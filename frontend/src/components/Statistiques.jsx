import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, TrendingUp, Calendar, Clock, Loader2, CalendarDays, Users, Download, PieChart as PieChartIcon, ZoomIn, X } from 'lucide-react';

const COLORS = ['#235B3B', '#3498DB', '#F39C12', '#9B59B6', '#E74C3C', '#2ecc71', '#e67e22', '#1abc9c', '#34495e'];

const API_URL = 'http://localhost:5000/api';

const joursSemaine = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const moisAnnee = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

function Statistiques({ refreshTrigger }) {
    const [data, setData] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedChart, setExpandedChart] = useState(null); // 'motifs' or 'statuts' or null

    useEffect(() => {
        fetchAnalytics();
    }, [refreshTrigger]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [analyticsRes, statsRes] = await Promise.all([
                axios.get(`${API_URL}/analytics`),
                axios.get(`${API_URL}/stats`)
            ]);
            setData(analyticsRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (loading || !data || !stats) {
        return <div className="text-center" style={{ padding: '40px' }}><Loader2 className="spin" size={32} /></div>;
    }

    const exportToCSV = () => {
        if (!data || !stats) return;

        // "sep=;" force Excel à interpréter le point-virgule comme un séparateur de colonnes
        let csvContent = "sep=;\n";

        // 1. Stats Globales
        csvContent += "STATISTIQUES GLOBALES\n";
        csvContent += "Ce Mois;Cette Annee;Total Global\n";
        csvContent += `${stats.totalMonth};${stats.totalYear};${stats.totalAllTime}\n\n`;

        // 2. Heures de pointe
        csvContent += "HEURES DE POINTE\n";
        csvContent += "Plage Horaire;Nombre de visites\n";
        data.peakHours.forEach(h => {
            csvContent += `${h.unite}h - ${parseInt(h.unite) + 1}h;${h.count}\n`;
        });
        csvContent += "\n";

        // 3. Jours récurrents
        csvContent += "JOURS LES PLUS RECURRENTS\n";
        csvContent += "Jour;Nombre de visites\n";
        data.peakDays.forEach(d => {
            csvContent += `${joursSemaine[parseInt(d.unite)]};${d.count}\n`;
        });
        csvContent += "\n";

        // 4. Mois record
        csvContent += "MOIS RECORDS\n";
        csvContent += "Mois;Nombre de visites\n";
        data.peakMonths.forEach(m => {
            csvContent += `${moisAnnee[parseInt(m.unite) - 1]};${m.count}\n`;
        });
        csvContent += "\n";

        // 5. Années record
        csvContent += "ANNEES RECORDS\n";
        csvContent += "Annee;Nombre de visites\n";
        data.peakYears.forEach(y => {
            csvContent += `${y.unite};${y.count}\n`;
        });
        csvContent += "\n";

        // 6. Répartition des Motifs
        csvContent += "REPARTITION DES MOTIFS\n";
        csvContent += "Motif;Nombre de visites\n";
        data.motifsData.forEach(m => {
            csvContent += `${m.unite};${m.count}\n`;
        });
        csvContent += "\n";

        // Ajout de l'en-tête natif CSV + BOM (Byte Order Mark pour les accents sous Windows/Excel)
        const BOM = "\uFEFF";
        const finalContent = BOM + csvContent;
        const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `rapport_statistiques_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const renderExpandedChart = () => {
        if (expandedChart === 'jours' || expandedChart === 'mois') {
            const chartData = expandedChart === 'jours' ? data.chartDataJours : data.chartDataMois;
            const lineColor = expandedChart === 'jours' ? 'var(--primary-green)' : 'var(--primary-blue)';
            const xLabel = expandedChart === 'jours' ? 'Visites / Jour' : 'Visites / Mois';

            return (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" stroke="#6C7A89" tick={{ fontSize: 14 }} />
                        <YAxis stroke="#6C7A89" tick={{ fontSize: 14 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '1.2rem', paddingTop: '20px' }} />
                        <Line type="monotone" name={xLabel} dataKey="visites" stroke={lineColor} strokeWidth={4} activeDot={{ r: 10 }} />
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={expandedChart === 'motifs' ? data.motifsData : data.statutsData}
                        dataKey="count"
                        nameKey="unite"
                        cx="50%"
                        cy="50%"
                        innerRadius={expandedChart === 'statuts' ? 120 : 0}
                        outerRadius={200}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                        labelLine={true}
                    >
                        {(expandedChart === 'motifs' ? data.motifsData : data.statutsData).map((entry, index) => {
                            let fillColor = COLORS[index % COLORS.length];
                            if (expandedChart === 'statuts') {
                                if (entry.unite === 'Sortie validée') fillColor = '#2B9348';
                                if (entry.unite === 'Annulé') fillColor = '#6C7A89';
                                if (entry.unite === 'Rejeté') fillColor = '#E74C3C';
                            }
                            return <Cell key={`cell-exp-${index}`} fill={fillColor} />;
                        })}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ fontSize: '1.2rem', paddingTop: '20px' }} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const getExpandedTitle = () => {
        switch (expandedChart) {
            case 'motifs': return 'Répartition des motifs de visite';
            case 'statuts': return 'Répartition des statuts';
            case 'jours': return "Évolution (30 derniers jours d'activité)";
            case 'mois': return "Évolution (06 derniers mois d'activité)";
            default: return '';
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Analyse des Affluences</h2>
                <button className="btn btn-primary" onClick={exportToCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', width: 'auto' }}>
                    <Download size={18} />
                    Télécharger le Rapport Excel (CSV)
                </button>
            </div>

            <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '32px' }}>
                <div className="stat-card" style={{ borderLeftColor: '#3498DB' }}>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(52, 152, 219, 0.1)', color: '#3498DB' }}>
                        <Calendar size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>Ce Mois</h3>
                        <p>{stats.totalMonth}</p>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeftColor: '#9B59B6' }}>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(155, 89, 182, 0.1)', color: '#9B59B6' }}>
                        <CalendarDays size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>Cette Année</h3>
                        <p>{stats.totalYear}</p>
                    </div>
                </div>
                <div className="stat-card" style={{ borderLeftColor: 'var(--text-main)' }}>
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(44, 62, 80, 0.1)', color: 'var(--text-main)' }}>
                        <Users size={28} />
                    </div>
                    <div className="stat-info">
                        <h3>Total Global</h3>
                        <p>{stats.totalAllTime}</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '16px' }}>
                        <Clock size={20} /> Heures de pointe
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {data.peakHours.map((h, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span>{h.unite}h - {parseInt(h.unite) + 1}h</span>
                                <strong>{h.count} visites</strong>
                            </li>
                        ))}
                        {data.peakHours.length === 0 && <p className="text-muted">Pas assez de données</p>}
                    </ul>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '16px' }}>
                        <TrendingUp size={20} /> Jours les plus récurrents
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {data.peakDays.map((d, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span>{joursSemaine[parseInt(d.unite)]}</span>
                                <strong>{d.count} visites</strong>
                            </li>
                        ))}
                        {data.peakDays.length === 0 && <p className="text-muted">Pas assez de données</p>}
                    </ul>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '16px' }}>
                        <Calendar size={20} /> Mois record
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {data.peakMonths.map((m, i) => (
                            <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span>{moisAnnee[parseInt(m.unite) - 1]}</span>
                                <strong>{m.count} visites</strong>
                            </li>
                        ))}
                        {data.peakMonths.length === 0 && <p className="text-muted">Pas assez de données</p>}
                    </ul>
                </div>
            </div>

            <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', marginTop: '32px' }}>
                <div className="card" style={{ padding: '24px', position: 'relative' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '24px' }}>
                        <BarChart3 size={20} /> Évolution (30 derniers jours d'activité)
                    </h3>
                    <button
                        onClick={() => setExpandedChart('jours')}
                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Agrandir le graphique"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div style={{ width: '100%', height: 350 }}>
                        {data.chartDataJours?.length > 0 ? (
                            <ResponsiveContainer>
                                <LineChart data={data.chartDataJours} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" stroke="#6C7A89" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#6C7A89" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" name="Visites / Jour" dataKey="visites" stroke="var(--primary-green)" strokeWidth={3} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">Données insuffisantes pour le graphique.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', position: 'relative' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '24px' }}>
                        <BarChart3 size={20} /> Évolution (06 derniers mois d'activité)
                    </h3>
                    <button
                        onClick={() => setExpandedChart('mois')}
                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Agrandir le graphique"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div style={{ width: '100%', height: 350 }}>
                        {data.chartDataMois?.length > 0 ? (
                            <ResponsiveContainer>
                                <LineChart data={data.chartDataMois} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" stroke="#6C7A89" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#6C7A89" tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend />
                                    <Line type="monotone" name="Visites / Mois" dataKey="visites" stroke="var(--primary-blue)" strokeWidth={3} activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">Données insuffisantes pour le graphique.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', marginTop: '32px' }}>
                <div className="card" style={{ padding: '24px', position: 'relative' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '24px' }}>
                        <PieChartIcon size={20} /> Répartition des motifs de visite
                    </h3>
                    <button
                        onClick={() => setExpandedChart('motifs')}
                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Agrandir le diagramme"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div style={{ width: '100%', height: 350, display: 'flex', justifyContent: 'center' }}>
                        {data.motifsData?.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={data.motifsData}
                                        dataKey="count"
                                        nameKey="unite"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        fill="var(--primary-blue)"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {data.motifsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">Données insuffisantes pour le diagramme circulaire.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', position: 'relative' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-blue)', marginBottom: '24px' }}>
                        <PieChartIcon size={20} /> Répartition des statuts
                    </h3>
                    <button
                        onClick={() => setExpandedChart('statuts')}
                        style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                        title="Agrandir le diagramme"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div style={{ width: '100%', height: 350, display: 'flex', justifyContent: 'center' }}>
                        {data.statutsData?.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={data.statutsData}
                                        dataKey="count"
                                        nameKey="unite"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={100}
                                        fill="var(--primary-blue)"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {data.statutsData.map((entry, index) => {
                                            let fillColor = COLORS[index % COLORS.length];
                                            if (entry.unite === 'Sortie validée') fillColor = '#2B9348';
                                            if (entry.unite === 'Annulé') fillColor = '#6C7A89';
                                            if (entry.unite === 'Rejeté') fillColor = '#E74C3C';
                                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                                        })}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <p className="text-muted">Données insuffisantes pour le diagramme circulaire.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for Expanded Charts */}
            {expandedChart && (
                <div className="modal-overlay" onClick={() => setExpandedChart(null)} style={{ zIndex: 10000 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: '90vw', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 className="modal-title" style={{ margin: 0 }}>
                                {getExpandedTitle()}
                            </h3>
                            <button onClick={() => setExpandedChart(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ flex: 1, position: 'relative' }}>
                            {renderExpandedChart()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Statistiques;
