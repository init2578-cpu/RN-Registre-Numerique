import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Historique from './components/Historique';
import Statistiques from './components/Statistiques';
import { Users, History, BarChart3, Settings, AlertCircle, CheckCircle2, Image as ImageIcon, Palette, Type, RefreshCw, Download, Trash2, X } from 'lucide-react';
import axios from 'axios';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [parametres, setParametres] = useState({
    NomStructure: 'RN - Registre Numérique',
    LogoUrl: './icon_RN.png',
    CouleurFond: '#f8f9fa',
    CouleurBouton: '#3498DB',
    CouleurVert: '#2B9348'
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(parametres);
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Database Management states
  const [dbUploadFile, setDbUploadFile] = useState(null);
  const [dbLoading, setDbLoading] = useState(false);
  const [dbMessage, setDbMessage] = useState({ text: '', type: '' }); // type: 'success' | 'error'
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

  // Setup First Launch Lock
  const [isFirstRunUnlocked, setIsFirstRunUnlocked] = useState(
    localStorage.getItem('isFirstRunComplete_v2') === 'true'
  );
  const [firstRunPassword, setFirstRunPassword] = useState('');
  const [firstRunError, setFirstRunError] = useState('');

  const handleFirstRunUnlock = (e) => {
    e.preventDefault();
    if (firstRunPassword === 'CodeFire@CRE_KOLDA') {
      localStorage.setItem('isFirstRunComplete_v2', 'true');
      setIsFirstRunUnlocked(true);
    } else {
      setFirstRunError('Mot de passe administrateur incorrect.');
    }
  };

  React.useEffect(() => {
    fetchParametres();
  }, []);

  const fetchParametres = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/parametres');
      if (res.data) {
        // Fix for databases that still hold the old path
        if (res.data.LogoUrl === '/icon_RN.png') {
          res.data.LogoUrl = './icon_RN.png';
        }
        setParametres(res.data);
        setSettingsForm(res.data);
        applyTheme(res.data.CouleurFond, res.data.CouleurBouton);
      }
    } catch (err) {
      console.error("Erreur chargement paramètres", err);
    }
  };

  const applyTheme = (bg, btn, vert) => {
    document.documentElement.style.setProperty('--bg-main', bg);
    document.documentElement.style.setProperty('--primary-blue', btn);
    if (vert) {
      document.documentElement.style.setProperty('--primary-green', vert);
    }
  };

  const handleEmptyDatabase = () => {
    if (!settingsPassword) {
      setDbMessage({ text: "Le mot de passe administrateur est requis pour vider la base.", type: 'error' });
      return;
    }
    setShowWipeConfirm(true);
  };

  const confirmEmptyDatabase = async () => {
    setShowWipeConfirm(false);
    setDbLoading(true);
    setDbMessage({ text: '', type: '' });
    try {
      const res = await axios.post('http://localhost:5000/api/database/vider', { password: settingsPassword });
      setDbMessage({ text: res.data.message, type: 'success' });
      triggerRefresh();
    } catch (err) {
      setDbMessage({ text: err.response?.data?.message || "Erreur lors du vidage de la base.", type: 'error' });
    }
    setDbLoading(false);
  };

  const handleUploadDatabase = async () => {
    if (!settingsPassword) {
      setDbMessage({ text: "Le mot de passe administrateur est requis pour restaurer la base.", type: 'error' });
      return;
    }
    if (!dbUploadFile) {
      setDbMessage({ text: "Veuillez sélectionner un fichier .sqlite", type: 'error' });
      return;
    }

    setDbLoading(true);
    setDbMessage({ text: '', type: '' });

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await axios.post('http://localhost:5000/api/database/upload', {
          password: settingsPassword,
          dbBase64: reader.result
        });
        setDbMessage({ text: res.data.message, type: 'success' });
        setTimeout(() => {
          window.location.reload(); // Recharger la page complète pour forcer la reconnexion Backend/Frontend
        }, 1500);
      } catch (err) {
        setDbMessage({ text: err.response?.data?.message || "Erreur lors de la restauration.", type: 'error' });
      }
      setDbLoading(false);
    };
    reader.readAsDataURL(dbUploadFile);
  };

  const handleDownloadDatabase = async () => {
    if (!settingsPassword) {
      setDbMessage({ text: "Le mot de passe administrateur est requis pour télécharger la sauvegarde.", type: 'error' });
      return;
    }

    setDbLoading(true);
    setDbMessage({ text: '', type: '' });

    try {
      const res = await axios.get(`http://localhost:5000/api/database/download?password=${encodeURIComponent(settingsPassword)}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      // On tente d'extraire le nom du fichier du header s'il existe, sinon nom par défaut
      const contentDisposition = res.headers['content-disposition'];
      let fileName = `sauvegarde_registre_${new Date().toISOString().slice(0, 10)}.sqlite`;
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
      }

      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDbMessage({ text: "Téléchargement démarré.", type: 'success' });
    } catch (err) {
      // Pour une réponse blob, l'erreur est aussi sous forme de blob. Mieux vaut un message générique.
      setDbMessage({ text: "Erreur lors du téléchargement. Vérifiez le mot de passe administrateur.", type: 'error' });
    }
    setDbLoading(false);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    if (!settingsPassword) {
      setSettingsError("Le mot de passe administrateur est requis.");
      return;
    }
    setSettingsLoading(true);
    try {
      const payload = { ...settingsForm, password: settingsPassword };
      await axios.post('http://localhost:5000/api/parametres', payload);
      setSettingsSuccess(true);
      setParametres(settingsForm);
      applyTheme(settingsForm.CouleurFond, settingsForm.CouleurBouton, settingsForm.CouleurVert);
      setTimeout(() => {
        setIsSettingsOpen(false);
        setSettingsSuccess(false);
        setSettingsPassword('');
      }, 1500);
    } catch (err) {
      setSettingsError(err.response?.data?.message || "Erreur de mise à jour");
    }
    setSettingsLoading(false);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm({ ...settingsForm, LogoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDefaults = () => {
    setSettingsForm({
      NomStructure: 'RN - Registre Numérique',
      LogoUrl: './icon_RN.png',
      CouleurFond: '#f8f9fa',
      CouleurBouton: '#3498DB',
      CouleurVert: '#2B9348'
    });
  };

  const openSettings = () => {
    setSettingsForm(parametres);
    setSettingsPassword('');
    setSettingsError('');
    setSettingsSuccess(false);
    setIsSettingsOpen(true);
  };

  // Fonction pour rafraîchir les données quand une entrée ou sortie est modifiée
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Verrouillage de la première exécution (après l'installation)
  if (!isFirstRunUnlocked) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main, #F8F9FA)', height: '100vh', width: '100vw' }}>
        <div className="card" style={{ padding: '40px', maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
          <h2 style={{ color: 'var(--primary-blue, #235B3B)', marginBottom: '16px' }}>Configuration Initiale</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>Bienvenue dans Registre Numérique.<br />Veuillez déverrouiller l'accès avec le mot de passe administrateur pour démarrer.</p>
          <form onSubmit={handleFirstRunUnlock}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <input
                type="password"
                className="form-control"
                placeholder="Saisir le mot de passe système..."
                value={firstRunPassword}
                onChange={(e) => { setFirstRunPassword(e.target.value); setFirstRunError(''); }}
                autoFocus
              />
              {firstRunError && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '8px', fontWeight: 500 }}>{firstRunError}</div>}
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
              Déverrouiller l'Application
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onEntrySuccess={triggerRefresh} logoUrl={parametres.LogoUrl} />

      <main className="main-content">
        <header className="main-header">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Users size={20} />
              Présence Réelle
            </button>
            <button
              className={`tab-btn ${activeTab === 'statistiques' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistiques')}
            >
              <BarChart3 size={20} />
              Statistiques & Affluence
            </button>
            <button
              className={`tab-btn ${activeTab === 'historique' ? 'active' : ''}`}
              onClick={() => setActiveTab('historique')}
            >
              <History size={20} />
              Historique
            </button>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--primary-blue)' }}>
            {parametres.NomStructure}
          </div>
        </header>

        <div className="page-content">
          {activeTab === 'dashboard' && <Dashboard refreshTrigger={refreshTrigger} onExitSuccess={triggerRefresh} />}
          {activeTab === 'statistiques' && <Statistiques refreshTrigger={refreshTrigger} />}
          {activeTab === 'historique' && <Historique refreshTrigger={refreshTrigger} />}
        </div>
        <div style={{ textAlign: 'center', padding: '15px 0', fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          version : 1.0.0.3
        </div>
      </main>

      {/* Bouton Paramètres Flottant */}
      <button
        onClick={openSettings}
        title="Paramètres de l'application"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-blue)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Settings size={24} />
      </button>

      {/* Modal des Paramètres */}
      {isSettingsOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsOpen(false)} style={{ zIndex: 10000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '650px', maxWidth: '90vw' }}>
            {!settingsSuccess ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: 'var(--primary-blue)', padding: '10px', borderRadius: '8px', display: 'flex' }}>
                      <Settings size={28} />
                    </div>
                    <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Personnalisation globale</h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    title="Restaurer les valeurs d'usine"
                  >
                    <RefreshCw size={14} /> Réinitialiser
                  </button>
                </div>

                <form onSubmit={handleSettingsSubmit}>
                  <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Type size={16} /> Nom de la structure</label>
                    <input
                      type="text" className="form-control" required
                      value={settingsForm.NomStructure}
                      onChange={(e) => setSettingsForm({ ...settingsForm, NomStructure: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><ImageIcon size={16} /> Logo de la structure</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="file" className="form-control" accept="image/*"
                          onChange={handleLogoUpload}
                        />
                        <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Sélectionnez une image (PNG, JPG, etc.)</small>
                      </div>
                      <div style={{
                        width: '60px', height: '60px', borderRadius: '4px', border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)',
                        overflow: 'hidden', flexShrink: 0
                      }}>
                        {settingsForm.LogoUrl ? (
                          <img src={settingsForm.LogoUrl} alt="Aperçu logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                          <ImageIcon size={24} color="var(--text-muted)" />
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: '1 1 30%', textAlign: 'left', marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Palette size={16} /> Couleur de Fond</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="color"
                          value={settingsForm.CouleurFond || '#f8f9fa'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, CouleurFond: e.target.value })}
                          style={{ width: '40px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{settingsForm.CouleurFond || '#f8f9fa'}</span>
                      </div>
                    </div>

                    <div className="form-group" style={{ flex: '1 1 30%', textAlign: 'left', marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Palette size={16} /> Boutons Primaires</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="color"
                          value={settingsForm.CouleurBouton || '#3498DB'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, CouleurBouton: e.target.value })}
                          style={{ width: '40px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{settingsForm.CouleurBouton || '#3498DB'}</span>
                      </div>
                    </div>

                    <div className="form-group" style={{ flex: '1 1 30%', textAlign: 'left', marginBottom: 0 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Palette size={16} /> Boutons Verts</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="color"
                          value={settingsForm.CouleurVert || '#2B9348'}
                          onChange={(e) => setSettingsForm({ ...settingsForm, CouleurVert: e.target.value })}
                          style={{ width: '40px', height: '40px', padding: '0', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}
                        />
                        <span style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>{settingsForm.CouleurVert || '#2B9348'}</span>
                      </div>
                    </div>
                  </div>

                  <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)', borderStyle: 'solid', borderWidth: '1px 0 0 0' }} />

                  <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px', backgroundColor: '#fff3cd', padding: '12px', borderRadius: '8px', border: '1px solid #ffeeba' }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#856404', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                      <AlertCircle size={16} /> Gestion de la Base de Données
                    </h4>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 50%' }}>
                        <label style={{ color: '#856404', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>Restaurer une ancienne base (.sqlite)</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="file"
                            className="form-control"
                            accept=".sqlite"
                            style={{ flex: 1, padding: '4px 8px', fontSize: '0.85rem' }}
                            onChange={(e) => setDbUploadFile(e.target.files[0])}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '4px 12px', whiteSpace: 'nowrap', fontSize: '0.85rem', width: 'auto' }}
                            onClick={handleUploadDatabase}
                            disabled={dbLoading}
                          >
                            Restaurer
                          </button>
                        </div>
                      </div>

                      <div style={{ flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ backgroundColor: 'var(--primary-blue)', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={handleDownloadDatabase}
                          disabled={dbLoading}
                          title="Télécharger une sauvegarde (.sqlite) de la base de données actuelle"
                        >
                          <Download size={14} /> Sauvegarder
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ backgroundColor: '#E74C3C', color: 'white', border: 'none', padding: '6px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          onClick={handleEmptyDatabase}
                          disabled={dbLoading}
                          title="Vider entièrement l'historique et les statistiques (Irréversible)"
                        >
                          <AlertCircle size={14} /> Vider la base
                        </button>
                      </div>
                    </div>

                    {dbMessage.text && (
                      <div style={{ marginTop: '8px', padding: '6px', borderRadius: '4px', backgroundColor: dbMessage.type === 'success' ? '#d4edda' : '#f8d7da', color: dbMessage.type === 'success' ? '#155724' : '#721c24', fontSize: '0.85rem', textAlign: 'center' }}>
                        {dbMessage.text}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                    <label style={{ color: '#E74C3C' }}>Mot de passe administrateur *</label>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>Obligatoire pour appliquer les changements globaux.</p>
                    <input
                      type="password" className="form-control" required
                      placeholder="Saisissez le mot de passe..."
                      value={settingsPassword}
                      onChange={(e) => setSettingsPassword(e.target.value)}
                    />
                  </div>

                  {settingsError && (
                    <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                      <AlertCircle size={18} /> {settingsError}
                    </div>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsSettingsOpen(false)}>Annuler</button>
                    <button type="submit" className="btn btn-primary" disabled={settingsLoading} style={{ backgroundColor: 'var(--primary-blue)' }}>
                      {settingsLoading ? 'Sauvegarde...' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="modal-success" style={{ textAlign: 'center', padding: '32px 0' }}>
                <CheckCircle2 size={64} style={{ color: '#2ecc71', margin: '0 auto 16px auto' }} />
                <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Paramètres enregistrés !</h3>
                <p style={{ color: 'var(--text-muted)' }}>L'application a été mise à jour.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmation pour vider la base (déplacé au niveau racine) */}
      {showWipeConfirm && (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0, justifyContent: 'center' }}>
              <div style={{ backgroundColor: '#fdeeea', color: '#E74C3C', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                <Trash2 size={32} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-main)' }}>Vider la base de données ?</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
              Êtes-vous sûr(e) de vouloir vider <strong>entièrement</strong> l'historique et les statistiques ? <br /><br />
              <span style={{ color: '#E74C3C', fontWeight: 600 }}>Cette action est irréversible.</span>
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowWipeConfirm(false)}>Annuler</button>
              <button className="btn btn-primary" style={{ backgroundColor: '#E74C3C' }} onClick={confirmEmptyDatabase}>
                Oui, vider la base
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
