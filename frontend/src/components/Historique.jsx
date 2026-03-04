import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, FileText, Edit, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const getBadgeClass = (statut) => {
    switch (statut) {
        case 'En cours': return 'badge-warning';
        case 'Sortie validée': return 'badge-success';
        case 'Annulé': return 'badge-secondary';
        case 'Rejeté': return 'badge-danger';
        default: return 'badge-secondary';
    }
};

function Historique({ refreshTrigger }) {
    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState('');
    const [date, setDate] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal state for password validation and status modification
    const [modifierModale, setModifierModale] = useState({ isOpen: false, mouvementId: null, password: '', nouveauStatut: 'En cours', error: '', isSuccess: false });
    const [supprimerModale, setSupprimerModale] = useState({ isOpen: false, mouvementId: null, password: '', error: '', isSuccess: false });
    const [exportModale, setExportModale] = useState({ isOpen: false, password: '', error: '' });

    useEffect(() => {
        fetchHistory();
    }, [refreshTrigger, date]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/historique`, {
                params: { query: search, date: date }
            });
            setHistory(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchHistory();
    };

    const handleModifierClick = (id, currentStatut) => {
        setModifierModale({ isOpen: true, mouvementId: id, password: '', nouveauStatut: currentStatut, error: '', isSuccess: false });
    };

    const confirmerModification = async () => {
        const { mouvementId, password, nouveauStatut } = modifierModale;
        if (!password) {
            setModifierModale(prev => ({ ...prev, error: "Le mot de passe est requis." }));
            return;
        }

        try {
            await axios.post(`${API_URL}/historique/modifier/${mouvementId}`, { password, nouveauStatut });

            setModifierModale(prev => ({ ...prev, isSuccess: true, error: '' }));

            setTimeout(() => {
                setModifierModale({ isOpen: false, mouvementId: null, password: '', nouveauStatut: 'En cours', error: '', isSuccess: false });
                fetchHistory(); // Rafraîchir l'historique
                if (refreshTrigger) refreshTrigger(); // Optionnel : rafraîchir Dashboard si fonction passée
            }, 1500);

        } catch (err) {
            const errorMsg = err.response && err.response.data && err.response.data.message
                ? err.response.data.message
                : "Erreur lors de la modification.";
            setModifierModale(prev => ({ ...prev, error: errorMsg }));
        }
    };

    const annulerModificationModal = () => {
        if (modifierModale.isSuccess) return;
        setModifierModale({ isOpen: false, mouvementId: null, password: '', nouveauStatut: 'En cours', error: '', isSuccess: false });
    };

    const handleSupprimerClick = (id) => {
        setSupprimerModale({ isOpen: true, mouvementId: id, password: '', error: '', isSuccess: false });
    };

    const confirmerSuppression = async () => {
        const { mouvementId, password } = supprimerModale;
        if (!password) {
            setSupprimerModale(prev => ({ ...prev, error: "Le mot de passe est requis." }));
            return;
        }

        try {
            await axios.post(`${API_URL}/historique/supprimer/${mouvementId}`, { password });

            setSupprimerModale(prev => ({ ...prev, isSuccess: true, error: '' }));

            setTimeout(() => {
                setSupprimerModale({ isOpen: false, mouvementId: null, password: '', error: '', isSuccess: false });
                fetchHistory(); // Rafraîchir l'historique
                if (refreshTrigger) refreshTrigger();
            }, 1500);

        } catch (err) {
            const errorMsg = err.response && err.response.data && err.response.data.message
                ? err.response.data.message
                : "Erreur lors de la suppression.";
            setSupprimerModale(prev => ({ ...prev, error: errorMsg }));
        }
    };

    const annulerSuppressionModal = () => {
        if (supprimerModale.isSuccess) return;
        setSupprimerModale({ isOpen: false, mouvementId: null, password: '', error: '', isSuccess: false });
    };

    const exportCSV = () => {
        if (history.length === 0) return;
        const header = ["Date", "Heure Entree", "Heure Sortie", "Prenom", "Nom", "Telephone", "Type Piece", "Numero Piece", "Motif", "Agent/Service", "Statut"];
        const rows = history.map(h => [
            new Date(h.Heure_Entree).toLocaleDateString('fr-FR'),
            new Date(h.Heure_Entree).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            h.Heure_Sortie ? new Date(h.Heure_Sortie).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
            h.Prenom,
            h.Nom,
            h.Telephone,
            h.TypePiece || '',
            h.NumeroPiece || '',
            h.Motif,
            h.AgentService,
            h.Statut
        ]);

        let csvContent = "data:text/csv;charset=utf-8,"
            + header.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `rapport_visiteurs_${date || 'global'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportClick = () => {
        if (history.length === 0) return;
        setExportModale({ isOpen: true, password: '', error: '' });
    };

    const confirmerExport = async () => {
        const { password } = exportModale;
        if (!password) {
            setExportModale(prev => ({ ...prev, error: "Le mot de passe est requis." }));
            return;
        }

        try {
            await axios.post(`${API_URL}/auth/verify`, { password });

            setExportModale({ isOpen: false, password: '', error: '' });
            exportCSV();
        } catch (err) {
            const errorMsg = err.response && err.response.data && err.response.data.message
                ? err.response.data.message
                : "Mot de passe incorrect.";
            setExportModale(prev => ({ ...prev, error: errorMsg }));
        }
    };

    const annulerExportModal = () => {
        setExportModale({ isOpen: false, password: '', error: '' });
    };

    return (
        <div className="card">
            <div className="card-header flex-between">
                <h2><FileText size={24} /> Archives & Historique</h2>

                <button className="btn btn-secondary" onClick={handleExportClick}>
                    <Download size={18} /> Exporter (CSV)
                </button>
            </div>

            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', backgroundColor: '#FAFCFF' }}>
                <form className="search-bar" onSubmit={handleSearch}>
                    <input
                        type="date"
                        className="form-control"
                        style={{ width: '200px' }}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Rechercher par nom, téléphone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '10px 20px' }}>
                        <Search size={20} /> Rechercher
                    </button>
                </form>
            </div>

            <div className="table-responsive">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Heure Entrée</th>
                            <th>Heure Sortie</th>
                            <th>Visiteur</th>
                            <th>Contact</th>
                            <th>Motif</th>
                            <th>Service</th>
                            <th>Statut</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center">{loading ? 'Chargement...' : 'Aucun historique trouvé.'}</td>
                            </tr>
                        ) : (
                            history.map((h) => {
                                const d = new Date(h.Heure_Entree);
                                return (
                                    <tr key={h.Mouvements_ID}>
                                        <td>{d.toLocaleDateString('fr-FR')}</td>
                                        <td>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td>{h.Heure_Sortie ? new Date(h.Heure_Sortie).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                        <td>{h.Prenom} {h.Nom}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <div style={{ fontWeight: 500 }}>{h.Telephone}</div>
                                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                {h.TypePiece} {h.NumeroPiece}
                                            </div>
                                        </td>
                                        <td>{h.Motif}</td>
                                        <td>{h.AgentService}</td>
                                        <td>
                                            <span className={`badge ${getBadgeClass(h.Statut)}`}>
                                                {h.Statut}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {h.Statut !== 'En cours' && (
                                                    <button
                                                        className="btn btn-secondary btn-sm"
                                                        onClick={() => handleModifierClick(h.Mouvements_ID, h.Statut)}
                                                        title="Modifier le statut de ce visiteur"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleSupprimerClick(h.Mouvements_ID)}
                                                    title="Supprimer cette entrée"
                                                    style={{ backgroundColor: '#E74C3C', borderColor: '#E74C3C', color: 'white' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Popup Modale de Confirmation de Modification (Mot de passe) */}
            {modifierModale.isOpen && (
                <div className="modal-overlay" onClick={annulerModificationModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {!modifierModale.isSuccess ? (
                            <>
                                <div className="modal-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498DB' }}>
                                    <AlertCircle size={36} />
                                </div>
                                <h3 className="modal-title">Modifier le statut</h3>
                                <p className="modal-text">
                                    Veuillez choisir le nouveau statut et saisir le mot de passe administrateur pour confirmer (la date/heure de sortie ne sera pas modifiée).
                                </p>

                                <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                                    <label>Nouveau Statut</label>
                                    <select
                                        className="form-control"
                                        value={modifierModale.nouveauStatut}
                                        onChange={(e) => setModifierModale(prev => ({ ...prev, nouveauStatut: e.target.value }))}
                                    >
                                        <option value="En cours">En cours</option>
                                        <option value="Sortie validée">Sortie validée</option>
                                        <option value="Annulé">Annulé</option>
                                        <option value="Rejeté">Rejeté</option>
                                    </select>
                                </div>

                                <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                                    <label>Mot de passe</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Entrez le mot de passe"
                                        value={modifierModale.password}
                                        onChange={(e) => setModifierModale(prev => ({ ...prev, password: e.target.value, error: '' }))}
                                        onKeyDown={(e) => e.key === 'Enter' && confirmerModification()}
                                    />
                                    {modifierModale.error && (
                                        <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px' }}>
                                            {modifierModale.error}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button className="btn btn-secondary" onClick={annulerModificationModal}>Annuler</button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={confirmerModification}
                                        style={{ backgroundColor: '#3498DB', color: 'white', boxShadow: 'none' }}
                                    >
                                        Confirmer la modification
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '20px 0', animation: 'successPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                                <div className="modal-icon" style={{ backgroundColor: '#E8F5E9', color: 'var(--primary-green)', margin: '0 auto 20px', transform: 'scale(1.2)' }}>
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="modal-title" style={{ color: 'var(--primary-green)' }}>Modification Validée !</h3>
                                <p className="modal-text">Le statut a bien été mis à jour.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Popup Modale de Confirmation de Suppression (Mot de passe) */}
            {supprimerModale.isOpen && (
                <div className="modal-overlay" onClick={annulerSuppressionModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {!supprimerModale.isSuccess ? (
                            <>
                                <div className="modal-icon" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#E74C3C' }}>
                                    <AlertCircle size={36} />
                                </div>
                                <h3 className="modal-title" style={{ color: '#E74C3C' }}>Supprimer l'entrée</h3>
                                <p className="modal-text">
                                    Attention, cette action est irréversible. Veuillez saisir le mot de passe administrateur pour confirmer la suppression définitive de ce mouvement.
                                </p>

                                <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                                    <label>Mot de passe</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        placeholder="Saisir le mot de passe..."
                                        value={supprimerModale.password}
                                        onChange={(e) => setSupprimerModale(prev => ({ ...prev, password: e.target.value }))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                confirmerSuppression();
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>

                                {supprimerModale.error && (
                                    <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                                        {supprimerModale.error}
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button className="btn btn-secondary" onClick={annulerSuppressionModal}>
                                        Annuler
                                    </button>
                                    <button className="btn btn-danger" onClick={confirmerSuppression}>
                                        Confirmer la suppression
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="modal-success" style={{ textAlign: 'center', padding: '24px 0' }}>
                                <CheckCircle2 size={64} style={{ color: 'var(--primary-green)', margin: '0 auto 16px auto' }} />
                                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Entrée supprimée !</h3>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Popup Modale d'Exportation (Mot de passe) */}
            {exportModale.isOpen && (
                <div className="modal-overlay" onClick={annulerExportModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498DB' }}>
                            <Download size={36} />
                        </div>
                        <h3 className="modal-title">Télécharger l'historique</h3>
                        <p className="modal-text">
                            Veuillez saisir le mot de passe administrateur pour autoriser l'exportation des données.
                        </p>

                        <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                            <label>Mot de passe</label>
                            <input
                                type="password"
                                className="form-control"
                                placeholder="Entrez le mot de passe"
                                value={exportModale.password}
                                onChange={(e) => setExportModale(prev => ({ ...prev, password: e.target.value, error: '' }))}
                                onKeyDown={(e) => e.key === 'Enter' && confirmerExport()}
                                autoFocus
                            />
                            {exportModale.error && (
                                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '6px' }}>
                                    {exportModale.error}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={annulerExportModal}>Annuler</button>
                            <button
                                className="btn btn-primary"
                                onClick={confirmerExport}
                                style={{ backgroundColor: '#2B9348', color: 'white', boxShadow: 'none' }}
                            >
                                <Download size={16} style={{ marginRight: '6px', display: 'inline' }} />
                                Télécharger
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Historique;
