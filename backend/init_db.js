const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Spécifier le chemin de la base de données (fichier local)
const dbPath = path.resolve(__dirname, 'database.sqlite');

// Création/Connexion à la base de données
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err.message);
        return;
    }
    console.log('Connecté à la base de données SQLite.');
});

// Sérialisation des requêtes pour s'assurer qu'elles s'exécutent dans l'ordre
db.serialize(() => {
    // 1. Création de la table Visiteurs
    const createVisiteursTable = `
        CREATE TABLE IF NOT EXISTS Visiteurs (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Prenom TEXT NOT NULL,
            Nom TEXT NOT NULL,
            Telephone TEXT,
            TypePiece TEXT,
            NumeroPiece TEXT,
            Provenance TEXT
        )
    `;

    db.run(createVisiteursTable, (err) => {
        if (err) {
            console.error("Erreur lors de la création de la table Visiteurs:", err.message);
        } else {
            console.log("Table 'Visiteurs' créée ou déjà existante.");
        }
    });

    // 2. Création de la table Mouvements
    const createMouvementsTable = `
        CREATE TABLE IF NOT EXISTS Mouvements (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            ID_Visiteur INTEGER,
            Motif TEXT,
            AgentService TEXT,
            Statut TEXT DEFAULT 'En attente',
            Heure_Entree DATETIME DEFAULT CURRENT_TIMESTAMP,
            Heure_Sortie DATETIME,
            FOREIGN KEY (ID_Visiteur) REFERENCES Visiteurs(ID)
        )
    `;

    db.run(createMouvementsTable, (err) => {
        if (err) {
            console.error("Erreur lors de la création de la table Mouvements:", err.message);
        } else {
            console.log("Table 'Mouvements' créée ou déjà existante.");
        }
    });
});

// Fermer la base de données proprement
db.close((err) => {
    if (err) {
        console.error("Erreur lors de la fermeture de la base de données:", err.message);
    } else {
        console.log("Fermeture de la connexion à la base de données après initialisation.");
    }
});
