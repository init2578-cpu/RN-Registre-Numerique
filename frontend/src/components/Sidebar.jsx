import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Mail } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

function Sidebar({ onEntrySuccess, logoUrl }) {
    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        telephone: '',
        typePiece: 'CNI',
        numeroPiece: '',
        provenance: '',
        motif: 'Information',
        motifPrecision: '',
        agentService: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const motifs = ['Courrier', 'Rendez-vous', 'Information', 'Stage/Emploi', 'Autre'];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePhoneBlur = async () => {
        if (formData.telephone.length >= 7) {
            try {
                const res = await axios.get(`${API_URL}/visiteurs/search?tel=${formData.telephone}`);
                if (res.data.length > 0) {
                    const visitor = res.data[0];
                    setFormData(prev => ({
                        ...prev,
                        prenom: visitor.Prenom,
                        nom: visitor.Nom,
                        typePiece: visitor.TypePiece,
                        numeroPiece: visitor.NumeroPiece,
                        provenance: visitor.Provenance
                    }));
                }
            } catch (err) {
                console.error("Erreur recherche visiteur", err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        // Concaténer le motif "Autre" avec sa précision
        const finalData = { ...formData };
        if (finalData.motif === 'Autre' && finalData.motifPrecision.trim() !== '') {
            finalData.motif = `Autre : ${finalData.motifPrecision}`;
        }

        try {
            await axios.post(`${API_URL}/entree`, finalData);
            setMessage({ type: 'success', text: 'Entrée validée avec succès' });
            // Reset form but keep some defaults
            setFormData({
                prenom: '', nom: '', telephone: '', typePiece: 'CNI', numeroPiece: '',
                provenance: '', motif: 'Information', motifPrecision: '', agentService: ''
            });
            onEntrySuccess(); // Rafraîchit le dashboard
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
        }
        setLoading(false);
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header" style={{ padding: '5px' }}>
                <img src={logoUrl || "./icon_RN.png"} alt="Logo Structure" style={{ height: '100px', width: 'auto', borderRadius: '4px', padding: '0px' }} />
            </div>

            <div className="sidebar-content">
                {message && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '16px',
                        borderRadius: '4px',
                        backgroundColor: message.type === 'success' ? '#e6fbef' : '#ffefef',
                        color: message.type === 'success' ? '#22793A' : '#E74C3C',
                        fontWeight: 500
                    }}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Téléphone (Recherche auto)</label>
                        <input type="text" className="form-control" name="telephone" value={formData.telephone} onChange={handleChange} onBlur={handlePhoneBlur} required placeholder="ex: 771234567" />
                    </div>
                    <div className="form-group">
                        <label>Prénom</label>
                        <input type="text" className="form-control" name="prenom" value={formData.prenom} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Nom</label>
                        <input type="text" className="form-control" name="nom" value={formData.nom} onChange={handleChange} required />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Type Pièce</label>
                            <select className="form-control" name="typePiece" value={formData.typePiece} onChange={handleChange}>
                                <option value="CNI">CNI</option>
                                <option value="Passeport">Passeport</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ flex: 2 }}>
                            <label>N° de Pièce</label>
                            <input type="text" className="form-control" name="numeroPiece" value={formData.numeroPiece} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Provenance (Quartier/Institution)</label>
                        <input type="text" className="form-control" name="provenance" value={formData.provenance} onChange={handleChange} />
                    </div>
                    <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />
                    <div className="form-group">
                        <label>Motif de la visite</label>
                        <select className="form-control" name="motif" value={formData.motif} onChange={handleChange}>
                            {motifs.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    {formData.motif === 'Autre' && (
                        <div className="form-group">
                            <label>Précisez le motif</label>
                            <input type="text" className="form-control" name="motifPrecision" value={formData.motifPrecision} onChange={handleChange} required placeholder="Saisissez la raison..." autoFocus />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Agent / Service visité</label>
                        <input type="text" className="form-control" name="agentService" value={formData.agentService} onChange={handleChange} required />
                    </div>

                    <button type="submit" className="btn btn-primary mt-4" disabled={loading}>
                        <UserPlus size={20} />
                        {loading ? 'Enregistrement...' : 'Valider Entrée'}
                    </button>
                </form>
            </div>

            <div style={{
                marginTop: 'auto',
                padding: '12px',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'rgba(0,0,0,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}>
                <span>&copy; {new Date().getFullYear()} iNiT / CRE KOLDA</span>
                <a
                    href="mailto:init2578@gmail.com"
                    title="Nous contacter"
                    style={{
                        color: 'var(--primary-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(52, 152, 219, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <Mail size={16} />
                </a>
            </div>
        </aside>
    );
}

export default Sidebar;
