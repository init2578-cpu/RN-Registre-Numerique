const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Gérer le chemin de la base de données en mode dev et production (Electron)
const userDataPath = process.env.APP_DATA_PATH || __dirname;
const dbPath = path.resolve(userDataPath, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err.message);
    }
});

// Initialiser la base de données (ajout de la table Parametres si manquante)
db.serialize(() => {
    // Création de la table Visiteurs
    db.run(`
        CREATE TABLE IF NOT EXISTS Visiteurs (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Prenom TEXT NOT NULL,
            Nom TEXT NOT NULL,
            Telephone TEXT UNIQUE,
            TypePiece TEXT,
            NumeroPiece TEXT,
            Provenance TEXT
        )
    `);

    // Création de la table Mouvements
    db.run(`
        CREATE TABLE IF NOT EXISTS Mouvements (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ID_Visiteur INTEGER,
            Motif TEXT NOT NULL,
            AgentService TEXT NOT NULL,
            Statut TEXT DEFAULT 'En cours',
            Heure_Entree DATETIME DEFAULT CURRENT_TIMESTAMP,
            Heure_Sortie DATETIME,
            FOREIGN KEY(ID_Visiteur) REFERENCES Visiteurs(ID) ON DELETE CASCADE
        )
    `);

    // Création de la table des paramètres globaux
    db.run(`
        CREATE TABLE IF NOT EXISTS Parametres (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            NomStructure TEXT DEFAULT 'RN - Registre Numérique',
            LogoUrl TEXT DEFAULT './icon_RN.png',
            CouleurFond TEXT DEFAULT '#f8f9fa',
            CouleurBouton TEXT DEFAULT '#3498DB',
            CouleurVert TEXT DEFAULT '#2B9348'
        )
    `);

    // Add safe column alter
    db.run(`ALTER TABLE Parametres ADD COLUMN CouleurVert TEXT DEFAULT '#2B9348'`, (err) => { /* ignore if exists */ });

    // Insérer les paramètres par défaut s'il n'y en a pas
    db.get('SELECT COUNT(*) as count FROM Parametres', (err, row) => {
        if (!err && row && row.count === 0) {
            db.run(`
        INSERT INTO Parametres (NomStructure, LogoUrl, CouleurFond, CouleurBouton)
        SELECT 'RN - Registre Numérique', './icon_RN.png', '#f8f9fa', '#3498DB'
        WHERE NOT EXISTS (SELECT 1 FROM Parametres)
      `);
        }
    });
});

// -- ENDPOINTS PARAMETRES --
app.get('/api/parametres', (req, res) => {
    db.get('SELECT * FROM Parametres ORDER BY ID ASC LIMIT 1', (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) {
            return res.json({ NomStructure: 'RN - Registre Numérique', LogoUrl: './icon_RN.png', CouleurFond: '#f8f9fa', CouleurBouton: '#3498DB', CouleurVert: '#2B9348' });
        }
        res.json(row);
    });
});

app.post('/api/parametres', (req, res) => {
    const { password, NomStructure, LogoUrl, CouleurFond, CouleurBouton, CouleurVert } = req.body;

    if (password !== 'CodeFire@CRE_KOLDA') {
        return res.status(403).json({ message: "Mot de passe incorrect." });
    }

    const query = `
        UPDATE Parametres 
        SET NomStructure = ?, LogoUrl = ?, CouleurFond = ?, CouleurBouton = ?, CouleurVert = ?
        WHERE ID = (SELECT MIN(ID) FROM Parametres)
    `;

    db.run(query, [NomStructure, LogoUrl, CouleurFond, CouleurBouton, CouleurVert], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) {
            // Si jamais la table était vide malgré tout, on insert
            db.run(`INSERT INTO Parametres (NomStructure, LogoUrl, CouleurFond, CouleurBouton, CouleurVert) VALUES (?, ?, ?, ?, ?)`,
                [NomStructure, LogoUrl, CouleurFond, CouleurBouton, CouleurVert]);
        }
        res.json({ message: "Paramètres mis à jour avec succès." });
    });
});

// Récupérer les statistiques du Dashboard
app.get('/api/stats', (req, res) => {
    const queries = {
        presents: "SELECT COUNT(*) as count FROM Mouvements WHERE Statut = 'En cours'",
        totalToday: "SELECT COUNT(*) as count FROM Mouvements WHERE date(Heure_Entree) = date('now', 'localtime')",
        totalMonth: "SELECT COUNT(*) as count FROM Mouvements WHERE strftime('%Y-%m', Heure_Entree) = strftime('%Y-%m', 'now', 'localtime')",
        totalYear: "SELECT COUNT(*) as count FROM Mouvements WHERE strftime('%Y', Heure_Entree) = strftime('%Y', 'now', 'localtime')",
        totalAllTime: "SELECT COUNT(*) as count FROM Mouvements"
    };

    db.get(queries.presents, [], (err, presentRow) => {
        if (err) return res.status(500).json({ error: err.message });

        db.get(queries.totalToday, [], (err, totalRow) => {
            if (err) return res.status(500).json({ error: err.message });

            db.get(queries.totalMonth, [], (err, monthRow) => {
                if (err) return res.status(500).json({ error: err.message });

                db.get(queries.totalYear, [], (err, yearRow) => {
                    if (err) return res.status(500).json({ error: err.message });

                    db.get(queries.totalAllTime, [], (err, allTimeRow) => {
                        if (err) return res.status(500).json({ error: err.message });

                        res.json({
                            presents: presentRow.count,
                            totalToday: totalRow.count,
                            totalMonth: monthRow.count,
                            totalYear: yearRow.count,
                            totalAllTime: allTimeRow.count
                        });
                    });
                });
            });
        });
    });
});
// Récupérer les données analytiques (Affluence)
app.get('/api/analytics', (req, res) => {
    const queries = {
        heures: "SELECT strftime('%H', Heure_Entree) as unite, COUNT(*) as count FROM Mouvements GROUP BY unite ORDER BY count DESC LIMIT 5",
        jours: "SELECT strftime('%w', Heure_Entree) as unite, COUNT(*) as count FROM Mouvements GROUP BY unite ORDER BY count DESC LIMIT 5",
        mois: "SELECT strftime('%m', Heure_Entree) as unite, COUNT(*) as count FROM Mouvements GROUP BY unite ORDER BY count DESC LIMIT 5",
        annees: "SELECT strftime('%Y', Heure_Entree) as unite, COUNT(*) as count FROM Mouvements GROUP BY unite ORDER BY count DESC",
        motifsRepartition: "SELECT CASE WHEN Motif LIKE 'Autre : %' THEN 'Autre' ELSE Motif END as unite, COUNT(*) as count FROM Mouvements GROUP BY unite ORDER BY count DESC",
        statutsRepartition: "SELECT Statut as unite, COUNT(*) as count FROM Mouvements WHERE Statut IN ('Sortie validée', 'Annulé', 'Rejeté') GROUP BY unite ORDER BY count DESC",
        evolutionMois: "SELECT strftime('%Y-%m', Heure_Entree) as date, COUNT(*) as visites FROM Mouvements GROUP BY date ORDER BY date DESC LIMIT 6",
        evolutionJours: "SELECT date(Heure_Entree) as date, COUNT(*) as visites FROM Mouvements GROUP BY date ORDER BY date DESC LIMIT 30"
    };

    db.all(queries.heures, [], (err, heuresRows) => {
        if (err) return res.status(500).json({ error: err.message });
        db.all(queries.jours, [], (err, joursRows) => {
            if (err) return res.status(500).json({ error: err.message });
            db.all(queries.mois, [], (err, moisRows) => {
                if (err) return res.status(500).json({ error: err.message });
                db.all(queries.annees, [], (err, anneesRows) => {
                    if (err) return res.status(500).json({ error: err.message });
                    db.all(queries.motifsRepartition, [], (err, motifsRows) => {
                        if (err) return res.status(500).json({ error: err.message });
                        db.all(queries.statutsRepartition, [], (err, statutsRows) => {
                            if (err) return res.status(500).json({ error: err.message });
                            db.all(queries.evolutionMois, [], (err, evalMoisRows) => {
                                if (err) return res.status(500).json({ error: err.message });
                                db.all(queries.evolutionJours, [], (err, evalJoursRows) => {
                                    if (err) return res.status(500).json({ error: err.message });
                                    res.json({
                                        peakHours: heuresRows,
                                        peakDays: joursRows,
                                        peakMonths: moisRows,
                                        peakYears: anneesRows,
                                        motifsData: motifsRows, // NOUVEAU
                                        statutsData: statutsRows, // DONUT STATS
                                        chartDataMois: evalMoisRows.reverse(),
                                        chartDataJours: evalJoursRows.reverse()
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Récupérer les visiteurs actuellement présents
app.get('/api/presents', (req, res) => {
    const query = `
        SELECT M.ID as Mouvements_ID, V.ID as Visiteur_ID, V.Prenom, V.Nom, V.Telephone, 
               V.TypePiece, V.NumeroPiece, M.Motif, M.AgentService, M.Heure_Entree
        FROM Mouvements M
        JOIN Visiteurs V ON M.ID_Visiteur = V.ID
        WHERE M.Statut = 'En cours'
        ORDER BY M.Heure_Entree DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Rechercher un visiteur par téléphone pour autocomplétion
app.get('/api/visiteurs/search', (req, res) => {
    const { tel } = req.query;
    if (!tel) return res.json([]);

    db.all("SELECT * FROM Visiteurs WHERE Telephone LIKE ?", [`%${tel}%`], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Enregistrer une nouvelle entrée (Nouveau visiteur ou existant)
app.post('/api/entree', (req, res) => {
    let { prenom, nom, telephone, typePiece, numeroPiece, provenance, motif, agentService } = req.body;

    // Formatage du prénom (1ère lettre en majuscule pour chaque mot) et nom (tout en majuscule)
    if (prenom) {
        prenom = prenom.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
    }
    if (nom) {
        nom = nom.toUpperCase();
    }
    if (agentService) {
        agentService = agentService.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '').join(' ');
    }

    // Vérifier d'abord si le visiteur existe (par téléphone ou n° pièce) seulement si ces infos sont fournies
    if (!telephone && !numeroPiece) {
        // Nouveau visiteur sans contact/pièce : Insertion directe
        const insertVisiteur = `INSERT INTO Visiteurs (Prenom, Nom, Telephone, TypePiece, NumeroPiece, Provenance) VALUES (?, ?, ?, ?, ?, ?)`;
        db.run(insertVisiteur, [prenom, nom, telephone, typePiece, numeroPiece, provenance], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            creerMouvement(this.lastID, motif, agentService, res);
        });
        return;
    }

    let checkQuery = "SELECT ID FROM Visiteurs WHERE (Telephone != '' AND Telephone IS NOT NULL AND Telephone = ?) OR (NumeroPiece != '' AND NumeroPiece IS NOT NULL AND NumeroPiece = ?)";
    db.get(checkQuery, [telephone, numeroPiece], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            // Mettre à jour les informations du visiteur
            const updateVisiteur = `UPDATE Visiteurs SET TypePiece = ?, NumeroPiece = ?, Provenance = ? WHERE ID = ?`;
            db.run(updateVisiteur, [typePiece, numeroPiece, provenance, row.ID], (updateErr) => {
                if (updateErr) console.error("Erreur de mise à jour du visiteur:", updateErr.message);
                // Visiteur existant & mis à jour : Création du mouvement
                creerMouvement(row.ID, motif, agentService, res);
            });
        } else {
            // Nouveau visiteur : Insertion puis création mouvement
            const insertVisiteur = `INSERT INTO Visiteurs (Prenom, Nom, Telephone, TypePiece, NumeroPiece, Provenance) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(insertVisiteur, [prenom, nom, telephone, typePiece, numeroPiece, provenance], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                creerMouvement(this.lastID, motif, agentService, res);
            });
        }
    });
});

function creerMouvement(visiteurId, motif, agentService, res) {
    const insertMouvement = `INSERT INTO Mouvements (ID_Visiteur, Motif, AgentService, Statut) VALUES (?, ?, ?, 'En cours')`;
    db.run(insertMouvement, [visiteurId, motif, agentService], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({
            message: "Entrée enregistrée avec succès.",
            mouvement_id: this.lastID
        });
    });
}

// Marquer la sortie d'un visiteur
app.post('/api/sortie/:id', (req, res) => {
    const { id } = req.params;
    const query = `UPDATE Mouvements SET Statut = 'Sortie validée', Heure_Sortie = CURRENT_TIMESTAMP WHERE ID = ?`;

    db.run(query, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Mouvement non trouvé ou déjà sorti." });
        res.json({ message: "Sortie validée avec succès." });
    });
});

// Annuler un mouvement (ex: erreur de saisie)
app.post('/api/annuler/:id', (req, res) => {
    const { id } = req.params;
    const query = `UPDATE Mouvements SET Statut = 'Annulé', Heure_Sortie = CURRENT_TIMESTAMP WHERE ID = ?`;

    db.run(query, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Mouvement non trouvé ou déjà traité." });
        res.json({ message: "Mouvement annulé avec succès." });
    });
});

// Rejeter un visiteur
app.post('/api/rejeter/:id', (req, res) => {
    const { id } = req.params;
    const query = `UPDATE Mouvements SET Statut = 'Rejeté', Heure_Sortie = CURRENT_TIMESTAMP WHERE ID = ?`;

    db.run(query, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Mouvement non trouvé ou déjà traité." });
        res.json({ message: "Visiteur rejeté avec succès." });
    });
});

// Modification d'un historique (ex: changer le statut)
app.post('/api/historique/modifier/:id', (req, res) => {
    const { id } = req.params;
    const { password, nouveauStatut } = req.body;

    if (password !== 'iNiT@CRE_KOLDA') {
        return res.status(403).json({ message: "Mot de passe incorrect." });
    }

    if (!nouveauStatut) {
        return res.status(400).json({ message: "Le nouveau statut est requis." });
    }

    const query = `UPDATE Mouvements SET Statut = ? WHERE ID = ?`;

    db.run(query, [nouveauStatut, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Mouvement non trouvé." });
        res.json({ message: "Statut modifié avec succès." });
    });
});

// Suppression d'un historique (définitivement)
app.post('/api/historique/supprimer/:id', (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (password !== 'iNiT@CRE_KOLDA') {
        return res.status(403).json({ message: "Mot de passe incorrect." });
    }

    const query = `DELETE FROM Mouvements WHERE ID = ?`;

    db.run(query, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ message: "Mouvement non trouvé ou déjà supprimé." });
        res.json({ message: "Mouvement supprimé avec succès." });
    });
});

// Récupérer l'historique (avec filtres optionnels)
app.get('/api/historique', (req, res) => {
    const { date, query } = req.query; // query peut être un nom ou tel

    let sql = `
        SELECT M.ID as Mouvements_ID, V.Prenom, V.Nom, V.Telephone, V.TypePiece, V.NumeroPiece,
               M.Motif, M.AgentService, M.Statut, M.Heure_Entree, M.Heure_Sortie
        FROM Mouvements M
        JOIN Visiteurs V ON M.ID_Visiteur = V.ID
        WHERE 1=1
    `;
    let params = [];

    if (date) {
        sql += " AND date(M.Heure_Entree) = ?";
        params.push(date);
    }
    if (query) {
        sql += " AND (V.Nom LIKE ? OR V.Prenom LIKE ? OR V.Telephone LIKE ?)";
        const search = `%${query}%`;
        params.push(search, search, search);
    }

    sql += " ORDER BY M.Heure_Entree DESC LIMIT 100";

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// -- ENDPOINTS GESTION BASE DE DONNÉES --

app.post('/api/database/vider', (req, res) => {
    const { password } = req.body;
    if (password !== 'CodeFire@CRE_KOLDA') {
        return res.status(403).json({ message: "Mot de passe administrateur incorrect." });
    }

    db.serialize(() => {
        db.run(`DELETE FROM Mouvements`, function (err) {
            if (err) return res.status(500).json({ error: "Erreur lors de la suppression des mouvements." });

            // Réinitialiser l'auto-incrément si la table le permet
            db.run(`DELETE FROM sqlite_sequence WHERE name='Mouvements'`, function (errSeq) {
                // Ignore errSeq (table might not exist if empty)
                res.json({ message: "La base de données a été vidée avec succès." });
            });
        });
    });
});

app.post('/api/database/upload', (req, res) => {
    const { password, dbBase64 } = req.body;

    if (password !== 'CodeFire@CRE_KOLDA') {
        return res.status(403).json({ message: "Mot de passe administrateur incorrect." });
    }

    if (!dbBase64) {
        return res.status(400).json({ message: "Fichier de base de données manquant." });
    }

    try {
        // Le format attendu depuis le frontend sera data:application/x-sqlite3;base64,.... ou data:application/octet-stream;base64,....
        const base64Data = dbBase64.replace(/^data:([A-Za-z-+/]+);base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');

        fs.writeFileSync(dbPath, buffer);
        res.json({ message: "Ancienne base de données restaurée avec succès. Veuillez relancer l'application." });
    } catch (error) {
        console.error("Erreur lors de l'upload de la DB:", error);
        res.status(500).json({ message: "Erreur lors de la restauration du fichier SQLite." });
    }
});

app.get('/api/database/download', (req, res) => {
    const { password } = req.query;

    if (password !== 'CodeFire@CRE_KOLDA') {
        return res.status(403).json({ message: "Mot de passe administrateur incorrect." });
    }

    if (fs.existsSync(dbPath)) {
        res.download(dbPath, `sauvegarde_registre_${new Date().toISOString().slice(0, 10)}.sqlite`, (err) => {
            if (err) {
                console.error("Erreur lors du téléchargement de la DB:", err);
                if (!res.headersSent) {
                    res.status(500).json({ message: "Erreur lors du téléchargement du fichier." });
                }
            }
        });
    } else {
        res.status(404).json({ message: "Fichier de base de données introuvable." });
    }
});

app.post('/api/auth/verify', (req, res) => {
    const { password } = req.body;
    if (password === 'CodeFire@CRE_KOLDA' || password === 'iNiT@CRE_KOLDA') {
        res.json({ success: true });
    } else {
        res.status(403).json({ message: "Mot de passe administrateur incorrect." });
    }
});

app.listen(PORT, () => {
    console.log(`Serveur backend démarré sur le port ${PORT}`);
});


