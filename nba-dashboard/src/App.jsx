
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
    Users,
    LayoutDashboard,
    Trophy,
    TrendingUp,
    Search,
    Shield,
    Zap,
    Activity,
    Calendar,
    AlertTriangle,
    Flame,
    Target,
    Swords,
    ChevronRight,
    TrendingDown,
    BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LineChart, Line, AreaChart, Area, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
    { id: 'overview', label: 'Player Details', icon: LayoutDashboard },
    { id: 'comparison', label: 'Compare Players', icon: Swords },
    { id: 'draft', label: 'Build Your Team', icon: Trophy },
    { id: 'analytics', label: 'Stat Predictions', icon: TrendingUp },
];

const BasketballAnimation = () => (
    <div className="hoop-container">
        <motion.div
            className="basketball"
            initial={{ x: -300, y: 150, scale: 1 }}
            animate={{
                x: [-100, 50, 75, 75],
                y: [150, -50, 60, 150],
                scale: [1, 1.3, 0.8, 0.6],
                rotate: 1080
            }}
            transition={{
                duration: 3,
                repeat: Infinity,
                times: [0, 0.5, 0.7, 1],
                ease: "easeInOut"
            }}
        />
        <div className="rim" />
        <div className="net" />
    </div>
);

const App = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [players, setPlayers] = useState([]);
    const [bestTeam, setBestTeam] = useState([]);
    const [modelStats, setModelStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [comparePlayer, setComparePlayer] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [playersRes, teamRes, statsRes] = await Promise.all([
                    fetch('/data/latest_season_data.csv').then(r => r.text()),
                    fetch('/data/best_team.csv').then(r => r.text()),
                    fetch('/data/model_stats.json').then(r => r.json()),
                ]);

                const parsedPlayers = Papa.parse(playersRes, { header: true, dynamicTyping: true }).data;
                const parsedTeam = Papa.parse(teamRes, { header: true, dynamicTyping: true }).data;

                const cleanPlayers = parsedPlayers.filter(p => p.player_name);
                setPlayers(cleanPlayers);
                setBestTeam(parsedTeam.filter(p => p.player_name));
                setModelStats(statsRes);
                setSelectedPlayer(cleanPlayers.find(p => p.player_name?.includes("Cooper")) || cleanPlayers[0]);
                setComparePlayer(cleanPlayers.find(p => p.player_name?.includes("Ace")) || cleanPlayers[1]);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load data", err);
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        return players.filter(p =>
            p.player_name.toLowerCase().includes(searchQuery.toLowerCase())
        ).slice(0, 8);
    }, [searchQuery, players]);

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505' }}>
            <motion.div
                animate={{ scale: [1, 1.5, 1], rotate: [0, 180, 360] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="basketball"
                style={{ width: 60, height: 60 }}
            />
        </div>
    );

    return (
        <div className="layout">
            <BasketballAnimation />

            {/* Sidebar */}
            <nav className="sidebar">
                <div style={{ padding: '0 0 48px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        background: 'var(--accent-primary)',
                        width: 40, height: 40, transform: 'rotate(45deg)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 15px var(--accent-primary)'
                    }}>
                        <Flame size={20} color="black" style={{ transform: 'rotate(-45deg)' }} />
                    </div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900 }}>
                        NBA <span style={{ color: 'var(--accent-primary)' }}>DATA</span>
                    </h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="glass-hover"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '16px',
                                border: activeTab === tab.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                                background: activeTab === tab.id ? 'rgba(255, 0, 0, 0.15)' : 'transparent',
                                color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                width: '100%',
                                fontWeight: 900,
                                letterSpacing: '1px',
                                clipPath: 'polygon(0 0, 100% 0, 95% 100%, 0 100%)'
                            }}
                        >
                            <tab.icon size={20} color={activeTab === tab.id ? 'var(--accent-primary)' : 'currentColor'} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ position: 'absolute', bottom: '32px', left: '24px', right: '24px' }}>
                    <div className="glass" style={{ padding: '20px', borderRight: '4px solid var(--accent-primary)', textAlign: 'right' }}>
                        <div style={{ color: 'var(--accent-primary)', fontSize: '0.6rem', fontWeight: 900, marginBottom: '4px' }}>DASHBOARD STATUS</div>
                        <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>DATA UPLOADED</div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
                    <div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 0.8, fontStyle: 'italic' }}>
                            PLAYER <span style={{ color: 'var(--accent-primary)' }}>SEARCH</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '0.8rem', letterSpacing: '3px', textTransform: 'uppercase' }}>
                            &gt; FIND ANY PLAYER BY NAME
                        </p>
                    </div>

                    <div style={{ position: 'relative', width: '400px' }}>
                        <Search style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--accent-primary)' }} size={20} />
                        <input
                            type="text"
                            placeholder="SEARCH PLAYER NAME..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="glass"
                            style={{
                                width: '100%',
                                padding: '16px 16px 16px 48px',
                                outline: 'none',
                                color: 'white',
                                border: '2px solid var(--accent-primary)',
                                background: 'rgba(255,0,0,0.05)',
                                fontWeight: 900,
                                fontStyle: 'italic'
                            }}
                        />

                        <AnimatePresence>
                            {searchResults.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="search-results-container"
                                >
                                    {searchResults.map(p => (
                                        <div
                                            key={p.player_name}
                                            className="glass-hover"
                                            onClick={() => {
                                                setSelectedPlayer(p);
                                                setSearchQuery('');
                                            }}
                                            style={{ padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,0,0,0.2)' }}
                                        >
                                            <span style={{ fontWeight: 900 }}>{p.player_name}</span>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <span className={`badge badge-${p.inferred_position?.toLowerCase()}`}>{p.inferred_position}</span>
                                                <span style={{ color: 'var(--accent-primary)', fontWeight: 900 }}>{Math.round(p.overall_impact)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ type: "spring", stiffness: 100 }}
                    >
                        {activeTab === 'overview' && <Overview selection={selectedPlayer} players={players} setSelection={setSelectedPlayer} setCompare={setComparePlayer} setTab={setActiveTab} />}
                        {activeTab === 'comparison' && <Comparison p1={selectedPlayer} p2={comparePlayer} players={players} setP1={setSelectedPlayer} setP2={setComparePlayer} />}
                        {activeTab === 'draft' && <TacticalRoster bestTeam={bestTeam} players={players} />}
                        {activeTab === 'analytics' && <FutureForecast players={players} stats={modelStats} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

const StatCard = ({ label, value, sub, color = "var(--accent-primary)" }) => (
    <div className="glass" style={{ padding: '20px', borderLeft: `4px solid ${color}`, minWidth: '140px' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase' }}>{label}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>{value}</div>
        {sub && <div style={{ fontSize: '0.6rem', color: color, fontWeight: 700 }}>{sub}</div>}
    </div>
);

const Overview = ({ selection, players, setSelection, setCompare, setTab }) => {
    if (!selection) return null;

    const radarData = [
        { subject: 'ATTACK', A: selection.scoring_impact },
        { subject: 'ASSISTS', A: selection.playmaking_impact },
        { subject: 'DEFENSE', A: selection.defensive_impact },
        { subject: 'UPTIME', A: selection.availability_score },
        { subject: 'OVERALL', A: selection.overall_impact },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                {/* Core Profile */}
                <div className="glass" style={{ padding: '40px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.1 }}>
                        <BarChart3 size={120} color="var(--accent-primary)" />
                    </div>

                    <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                        <div style={{
                            width: 100, height: 100, border: '4px solid var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '3rem', fontWeight: 900, fontStyle: 'italic', background: 'rgba(255,0,0,0.1)'
                        }}>
                            {selection.player_name?.[0]}
                        </div>
                        <div>
                            <div className={`badge badge-${selection.inferred_position?.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '6px 16px', marginBottom: '12px' }}>
                                POSITION: {selection.inferred_position}
                            </div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 900 }}>{selection.player_name}</h2>
                            <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>TEAM: {selection.team}</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <StatCard label="POINTS" value={selection.player_points_per_game} sub={`PER 36 MINS: ${selection.pts_per_36?.toFixed(1)}`} />
                        <StatCard label="ASSISTS" value={selection.player_assists_per_game} sub={`PER 36 MINS: ${selection.ast_per_36?.toFixed(1)}`} color="var(--success)" />
                        <StatCard label="REBOUNDS" value={selection.player_rebounds_per_game} sub={`PER 36 MINS: ${selection.reb_per_36?.toFixed(1)}`} color="var(--warning)" />
                        <StatCard label="EFFICIENCY" value={selection.efficiency_metric?.toFixed(1)} sub="OVERALL SCORE" color="white" />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontWeight: 900, fontSize: '0.9rem' }}>
                            <span>OVERALL RATING</span>
                            <span style={{ color: 'var(--accent-primary)' }}>{Math.round(selection.overall_impact)}%</span>
                        </div>
                        <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', position: 'relative' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${selection.overall_impact}%` }}
                                style={{ height: '100%', background: 'linear-gradient(90deg, #500, #f00)' }}
                            />
                            <div style={{ position: 'absolute', top: 0, left: '50%', height: '100%', width: '1px', background: 'rgba(255,255,255,0.3)' }} />
                        </div>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="glass" style={{ padding: '40px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '24px', fontStyle: 'italic', color: 'var(--accent-primary)' }}>// PERFORMANCE RADAR</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,0,0,0.3)" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: 'white', fontWeight: 900, fontSize: 10 }} />
                                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar
                                    name={selection.player_name}
                                    dataKey="A"
                                    stroke="var(--accent-primary)"
                                    fill="var(--accent-primary)"
                                    fillOpacity={0.5}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div className="glass" style={{ padding: '32px' }}>
                    <h3 style={{ marginBottom: '24px' }}>SIMILAR PLAYERS</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                        {players
                            .filter(p => p.inferred_position === selection.inferred_position && p.player_name !== selection.player_name)
                            .sort((a, b) => b.overall_impact - a.overall_impact)
                            .slice(0, 8)
                            .map(p => (
                                <div
                                    key={p.player_name}
                                    className="glass-hover"
                                    style={{
                                        cursor: 'pointer', padding: '12px 20px', border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex', flexDirection: 'column', gap: '8px'
                                    }}
                                    onClick={() => {
                                        setCompare(p);
                                        setTab('comparison');
                                    }}
                                >
                                    <div style={{ fontWeight: 900, fontSize: '0.8rem' }}>{p.player_name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)' }}>IMPACT: {Math.round(p.overall_impact)}</div>
                                        <ChevronRight size={12} color="var(--accent-primary)" />
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>

                <div className="glass" style={{ padding: '32px', background: 'repeating-linear-gradient(45deg, rgba(255,0,0,0.02), rgba(255,0,0,0.02) 10px, transparent 10px, transparent 20px)' }}>
                    <h3 style={{ marginBottom: '16px', color: 'var(--warning)' }}>PLAYER ANALYSIS</h3>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem' }}>
                        Player **{selection.player_name}** shows a scoring profile with a rating of **{selection.scoring_impact.toFixed(1)}**.
                        Compared to other players in the same position, they are performing at a **{selection.overall_impact > 80 ? 'Elite' : 'Standard'}** level.
                        Recommendation: **{selection.inferred_position === 'PG' ? 'Primary Playmaker' : 'High Performance Scorer'}**.
                    </p>
                </div>
            </div>
        </div>
    );
};

const Comparison = ({ p1, p2, players, setP1, setP2 }) => {
    if (!p1 || !p2) return <div>Incomplete Combatants Selected.</div>;

    const compareStats = [
        { label: 'PTS/36', key: 'pts_per_36' },
        { label: 'AST/36', key: 'ast_per_36' },
        { label: 'REB/36', key: 'reb_per_36' },
        { label: 'EFFICIENCY', key: 'efficiency_metric' },
        { label: 'OVERALL', key: 'overall_impact' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
                <div className="glass" style={{ flex: 1, padding: '32px', textAlign: 'center', borderBottom: '4px solid var(--accent-primary)' }}>
                    <h2 style={{ fontStyle: 'italic' }}>{p1.player_name}</h2>
                    <div className={`badge badge-${p1.inferred_position?.toLowerCase()}`}>{p1.inferred_position}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>VS</div>
                <div className="glass" style={{ flex: 1, padding: '32px', textAlign: 'center', borderBottom: '4px solid #fff' }}>
                    <h2 style={{ fontStyle: 'italic' }}>{p2.player_name}</h2>
                    <div className={`badge badge-${p2.inferred_position?.toLowerCase()}`}>{p2.inferred_position}</div>
                </div>
            </div>

            <div className="glass" style={{ padding: '40px' }}>
                <h3 style={{ marginBottom: '32px', textAlign: 'center' }}>HEAD TO HEAD COMPARISON</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {compareStats.map(stat => {
                        const val1 = p1[stat.key] || 0;
                        const val2 = p2[stat.key] || 0;
                        const max = Math.max(val1, val2, 1);
                        return (
                            <div key={stat.label}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 900, marginBottom: '8px' }}>
                                    <span style={{ color: val1 > val2 ? 'var(--accent-primary)' : '#fff' }}>{val1.toFixed(1)}</span>
                                    <span>{stat.label}</span>
                                    <span style={{ color: val2 > val1 ? 'var(--accent-primary)' : '#fff' }}>{val2.toFixed(1)}</span>
                                </div>
                                <div style={{ display: 'flex', height: '12px', gap: '4px' }}>
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', background: 'rgba(255,255,255,0.05)' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(val1 / max) * 100}%` }} style={{ height: '100%', background: 'var(--accent-primary)' }} />
                                    </div>
                                    <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.05)' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(val2 / max) * 100}%` }} style={{ height: '100%', background: '#fff' }} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="glass" style={{ padding: '32px' }}>
                <h3 style={{ marginBottom: '24px' }}>SELECT AN OPPONENT</h3>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
                    {players.slice(0, 15).map(p => (
                        <button
                            key={p.player_name}
                            onClick={() => setP2(p)}
                            className="glass-hover"
                            style={{
                                padding: '8px 16px', background: 'transparent', border: '1px solid var(--accent-primary)',
                                color: 'white', cursor: 'pointer', minWidth: '150px', fontWeight: 700
                            }}
                        >
                            COMPARE WITH: {p.player_name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const TacticalRoster = ({ bestTeam, players }) => {
    const [team, setTeam] = useState(bestTeam);

    const handleSwap = (pos) => {
        const currentList = team.map(p => p.player_name);
        const options = players.filter(p => p.inferred_position === pos && !currentList.includes(p.player_name));
        if (options.length > 0) {
            const next = options[Math.floor(Math.random() * Math.min(5, options.length))];
            setTeam(prev => prev.map(p => p.inferred_position === pos ? next : p));
        }
    };

    const firepower = team.reduce((acc, p) => acc + (p.player_points_per_game || 0), 0);
    const synergy = Math.round(team.reduce((acc, p) => acc + (p.overall_impact || 0), 0) / 5);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <StatCard label="TOTAL TEAM POINTS" value={firepower.toFixed(1)} sub="ESTIMATED PPG" />
                <StatCard label="TEAM CHEMISTRY" value={`${synergy}%`} sub="SYNERGY SCORE" color="var(--success)" />
                <StatCard label="LINEUP STRENGTH" value={synergy > 80 ? 'ELITE' : 'GOOD'} sub="PERFORMANCE LEVEL" color="var(--warning)" />
            </div>

            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '20px 0' }}>
                {team.map(unit => (
                    <div key={unit.inferred_position} className="glass" style={{ minWidth: 260, padding: '32px', borderTop: '8px solid var(--accent-primary)' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--accent-primary)', marginBottom: '16px' }}>{unit.inferred_position} PLAYER</div>
                        <h4 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{unit.player_name}</h4>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>{unit.team}</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>POINTS</span> <span style={{ fontWeight: 900 }}>{unit.player_points_per_game}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>EFFICIENCY</span> <span style={{ fontWeight: 900 }}>{unit.efficiency_metric?.toFixed(1)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>STRENGTH</span> <span style={{ fontWeight: 900, color: 'var(--accent-primary)' }}>{Math.round(unit.overall_impact)}%</span></div>
                        </div>

                        <button
                            onClick={() => handleSwap(unit.inferred_position)}
                            className="glass-hover"
                            style={{
                                marginTop: '32px', width: '100%', padding: '12px', background: 'transparent',
                                border: '1px solid var(--accent-primary)', color: 'white', cursor: 'pointer', fontWeight: 900
                            }}
                        >
                            REPLACE_UNIT
                        </button>
                    </div>
                ))}
            </div>

            <div className="glass" style={{ padding: '32px', borderLeft: '12px solid var(--accent-primary)' }}>
                <h3 style={{ marginBottom: '16px' }}>TEAM ANALYSIS</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                    This roster is designed to maximize scoring while keeping team chemistry high.
                    By including highly efficient players, the team stays stable under pressure.
                    Our AI recommends this starting lineup for the best chance of victory.
                </p>
            </div>
        </div>
    );
};

const FutureForecast = ({ players, stats }) => {
    const topBreakouts = players
        .filter(p => (p.predicted_player_points_per_game || 0) > (p.player_points_per_game || 0))
        .sort((a, b) => (b.predicted_player_points_per_game - b.player_points_per_game) - (a.predicted_player_points_per_game - a.player_points_per_game))
        .slice(0, 5);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
                <div className="glass" style={{ padding: '40px' }}>
                    <h3 style={{ marginBottom: '32px', color: 'var(--accent-primary)' }}>TOP BREAKOUT CANDIDATES</h3>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={topBreakouts}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,0,0,0.1)" />
                                <XAxis dataKey="player_name" tick={{ fill: 'white', fontSize: 10, fontWeight: 900 }} />
                                <YAxis tick={{ fill: 'white' }} />
                                <Tooltip contentStyle={{ background: '#000', border: '1px solid var(--accent-primary)' }} />
                                <Bar dataKey="player_points_per_game" fill="rgba(255,255,255,0.1)" name="CURRENT PERFORMANCE" />
                                <Bar dataKey="predicted_player_points_per_game" fill="var(--accent-primary)" name="PREDICTED GROWTH">
                                    {topBreakouts.map((e, i) => <Cell key={i} fill={i === 0 ? '#ff0000' : '#800000'} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass" style={{ padding: '32px' }}>
                    <h3 style={{ marginBottom: '24px' }}>PREDICTION ACCURACY</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {stats && Object.entries(stats).map(([metric, data]) => (
                            <div key={metric} style={{ padding: '16px', background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontWeight: 900 }}>{metric.replace('player_', '').replace('_per_game', '').toUpperCase()}</span>
                                    <span style={{ color: 'var(--accent-primary)', fontWeight: 900 }}>{Math.max(60, 100 - (data.rmse * 8)).toFixed(1)}% CONFIDENCE</span>
                                </div>
                                <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(60, 100 - (data.rmse * 8))}%` }} style={{ height: '100%', background: 'var(--accent-primary)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass" style={{ padding: '40px' }}>
                <h3 style={{ marginBottom: '32px' }}><Target size={20} style={{ marginRight: '12px' }} />WHAT DRIVES THE PREDICTIONS?</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.8rem' }}>
                    This chart shows which individual stats have the biggest impact on our AI's future projections.
                    A balanced model looks at multiple skills rather than just one stat like scoring.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {stats && Object.entries(stats.player_points_per_game.importances)
                        .sort((a, b) => b[1] - a[1])
                        .map(([feat, imp]) => (
                            <div key={feat} className="glass" style={{ padding: '20px', border: '1px solid rgba(255,0,0,0.1)' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', fontWeight: 900, marginBottom: '8px' }}>VAR_IMPORTANCE</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 900 }}>{(imp * 100).toFixed(1)}%</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>
                                    {feat.replace('player_', '').replace(/_/g, ' ')}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default App;
