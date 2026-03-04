import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, LogOut, Loader2, Calendar, CalendarDays, BarChart3, Clock, AlertCircle, CheckCircle2, XCircle, Ban } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function Dashboard({ refreshTrigger, onExitSuccess }) {
    const [stats, setStats] = useState({
        presents: 0,
        totalToday: 0,
        totalMonth: 0,
        totalYear: 0,
        totalAllTime: 0
    });
    const [presents, setPresents] = useState([]);
    const [loading, setLoading] = useState(true);
    // Gestion du popup de sortie animée
    const [actionModale, setActionModale] = useState({ isOpen: false, visiteurId: null, isSuccess: false, type: null });

    useEffect(() => {
        fetchData();
    }, [refreshTrigger]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [statsRes, presentsRes] = await Promise.all([
                axios.get(`${API_URL}/stats`),
                axios.get(`${API_URL}/presents`)
            ]);
            setStats(statsRes.data);
            setPresents(presentsRes.data);
        } catch (err) {
            console.error("Erreur de chargement", err);
        }
        setLoading(false);
    };

    const handleActionClick = (id, type) => {
        setActionModale({ isOpen: true, visiteurId: id, isSuccess: false, type });
    };

    const confirmerAction = async () => {
        const { visiteurId: id, type } = actionModale;
        if (!id) return;

        try {
            await axios.post(`${API_URL}/${type}/${id}`);

            // Afficher l'animation de succès vert
            setActionModale(prev => ({ ...prev, isSuccess: true }));

            // Attendre 1.5s avant de fermer la modale et actualiser
            setTimeout(() => {
                setActionModale({ isOpen: false, visiteurId: null, isSuccess: false, type: null });
                onExitSuccess();
            }, 1500);

        } catch (err) {
            alert(`Erreur lors de la validation de l'action : ${type}`);
        }
    };

    const annulerActionModal = () => {
        if (actionModale.isSuccess) return; // Empêcher l'annulation pendant l'animation de succès
        setActionModale({ isOpen: false, visiteurId: null, isSuccess: false, type: null });
    };

    return (
        <div>
            <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div className="stat-card" style={{ borderLeftColor: '#F39C12' }}>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(243, 156, 18, 0.1)', color: '#F39C12' }}>
                        <Clock size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>En Cours</h3>
                        <p>{stats.presents}</p>
                    </div>
                </div>
                <div className="stat-card green">
                    <div className="stat-icon">
                        <Users size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>Aujourd'hui</h3>
                        <p>{stats.totalToday}</p>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeftColor: '#3498DB' }}>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498DB' }}>
                        <Calendar size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>Ce Mois</h3>
                        <p>{stats.totalMonth}</p>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2><Loader2 size={24} className={loading ? "spin" : ""} style={{ display: loading ? 'block' : 'none' }} /> Présence Réelle (En cours)</h2>
                </div>
                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Heure Entrée</th>
                                <th>Visiteur</th>
                                <th>Contact</th>
                                <th>Motif</th>
                                <th>Service/Agent</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {presents.length === 0 ? (
                                <tr>
                                    PRESENT(ES) ACTUELLEMENT
                                </tr>
                            ) : (
                                presents.map((p) => {
                                    const time = new Date(p.Heure_Entree).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <tr key={p.Mouvements_ID}>
                                            <td><strong>{time}</strong></td>
                                            <td>{p.Prenom} {p.Nom}</td>
                                            <td>{p.Telephone}</td>
                                            <td><span className="badge badge-warning">{p.Motif}</span></td>
                                            <td>{p.AgentService}</td>
                                            <td style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
                                                <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleActionClick(p.Mouvements_ID, 'sortie')} title="Valider la sortie">
                                                    <LogOut size={12} /> Sortie
                                                </button>
                                                <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#6c757d', color: 'white', borderColor: '#6c757d' }} onClick={() => handleActionClick(p.Mouvements_ID, 'annuler')} title="Annuler le mouvement (erreur)">
                                                    <XCircle size={12} /> Annuler
                                                </button>
                                                <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#343a40', color: 'white', borderColor: '#343a40' }} onClick={() => handleActionClick(p.Mouvements_ID, 'rejeter')} title="Rejeter le visiteur">
                                                    <Ban size={12} /> Rejeter
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Popup Modale de Confirmation d'Action */}
            {actionModale.isOpen && (
                <div className="modal-overlay" onClick={annulerActionModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {!actionModale.isSuccess ? (
                            <>
                                <div className="modal-icon">
                                    <AlertCircle size={36} />
                                </div>
                                {actionModale.type === 'sortie' && (
                                    <>
                                        <h3 className="modal-title">Confirmation de sortie</h3>
                                        <p className="modal-text">Êtes-vous sûr(e) de vouloir valider la sortie pour ce visiteur ? Cette action l'archivera dans l'historique.</p>
                                        <div className="modal-actions">
                                            <button className="btn btn-secondary" onClick={annulerActionModal}>Annuler</button>
                                            <button className="btn btn-primary" onClick={confirmerAction} style={{ backgroundColor: 'var(--danger)', color: 'white', boxShadow: 'none' }}>Oui, marquer la sortie</button>
                                        </div>
                                    </>
                                )}
                                {actionModale.type === 'annuler' && (
                                    <>
                                        <h3 className="modal-title">Annuler l'entrée</h3>
                                        <p className="modal-text">Êtes-vous sûr(e) de vouloir annuler ce mouvement ? Utilisez ceci en cas d'erreur de saisie.</p>
                                        <div className="modal-actions">
                                            <button className="btn btn-secondary" onClick={annulerActionModal}>Retour</button>
                                            <button className="btn btn-primary" onClick={confirmerAction} style={{ backgroundColor: '#6c757d', color: 'white', boxShadow: 'none' }}>Oui, annuler</button>
                                        </div>
                                    </>
                                )}
                                {actionModale.type === 'rejeter' && (
                                    <>
                                        <h3 className="modal-title">Rejeter le visiteur</h3>
                                        <p className="modal-text">Êtes-vous sûr(e) de vouloir rejeter ce visiteur ? Cette option marque le visiteur comme rejeté dans l'historique.</p>
                                        <div className="modal-actions">
                                            <button className="btn btn-secondary" onClick={annulerActionModal}>Retour</button>
                                            <button className="btn btn-primary" onClick={confirmerAction} style={{ backgroundColor: '#343a40', color: 'white', boxShadow: 'none' }}>Oui, rejeter</button>
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: '20px 0', animation: 'successPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                                <div className="modal-icon" style={{ backgroundColor: '#E8F5E9', color: 'var(--primary-green)', margin: '0 auto 20px', transform: 'scale(1.2)' }}>
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="modal-title" style={{ color: 'var(--primary-green)' }}>Action Validée !</h3>
                                <p className="modal-text">L'action a bien été enregistrée et archivée.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;
