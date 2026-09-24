import React, { useState, useEffect } from 'react';
import apiRequest from '../api/client.js';
import TournamentCard from '../components/TournamentCard.jsx';
import { Search, Crosshair, Swords, Target, Trophy } from 'lucide-react';

export default function Tournaments({ onSelectTournament, defaultMode = 'all' }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState(defaultMode);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSelectedMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        setLoading(true);
        let url = `/tournaments?mode=${selectedMode}&status=${selectedStatus}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const data = await apiRequest(url);
        setTournaments(data.tournaments || []);
      } catch (err) {
        console.error('Fetch tournaments error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchTournaments();
  }, [selectedMode, selectedStatus, searchQuery]);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 60px 20px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <div className="font-heading" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>PRO ARENA</div>
        <h1 className="font-heading" style={{ fontSize: '2rem', color: 'var(--text-main)' }}>TOURNAMENT SCHEDULE</h1>
        <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
          Select your discipline, secure your slot, and compete for verified prizes.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="tactical-card" style={{ padding: '14px 18px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Modes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button
            onClick={() => setSelectedMode('all')}
            className="font-heading"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: selectedMode === 'all' ? 'var(--primary)' : 'var(--border-subtle)',
              background: selectedMode === 'all' ? 'var(--primary)' : 'var(--bg-secondary)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            ALL MODES
          </button>

          <button
            onClick={() => setSelectedMode('battle_royale')}
            className="font-heading"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: selectedMode === 'battle_royale' ? 'var(--primary)' : 'var(--border-subtle)',
              background: selectedMode === 'battle_royale' ? 'rgba(255, 77, 0, 0.15)' : 'var(--bg-secondary)',
              color: selectedMode === 'battle_royale' ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Crosshair size={14} /> 50-SLOT BR
          </button>

          <button
            onClick={() => setSelectedMode('clash_squad')}
            className="font-heading"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: selectedMode === 'clash_squad' ? 'var(--secondary)' : 'var(--border-subtle)',
              background: selectedMode === 'clash_squad' ? 'rgba(0, 229, 255, 0.15)' : 'var(--bg-secondary)',
              color: selectedMode === 'clash_squad' ? 'var(--secondary)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Swords size={14} /> CLASH SQUAD
          </button>

          <button
            onClick={() => setSelectedMode('lone_wolf')}
            className="font-heading"
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: selectedMode === 'lone_wolf' ? 'var(--prize-gold)' : 'var(--border-subtle)',
              background: selectedMode === 'lone_wolf' ? 'rgba(255, 197, 61, 0.15)' : 'var(--bg-secondary)',
              color: selectedMode === 'lone_wolf' ? 'var(--prize-gold)' : 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Target size={14} /> 1V1 LONE WOLF
          </button>
        </div>

        {/* Status & Search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="input-dark font-heading"
            style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
          >
            <option value="all">ALL STATUSES</option>
            <option value="open">OPEN FOR REGISTRATION</option>
            <option value="live">LIVE MATCHES</option>
            <option value="full">SLOTS FULL</option>
            <option value="completed">COMPLETED</option>
          </select>

          <div style={{ position: 'relative', width: '200px' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark font-body"
              style={{ padding: '6px 10px 6px 30px', fontSize: '0.82rem' }}
            />
            <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          </div>
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading tournaments...</div>
      ) : tournaments.length === 0 ? (
        <div className="tactical-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Trophy size={40} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
          <h3 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>NO TOURNAMENTS FOUND</h3>
          <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Adjust filter settings to view more matches.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
          gap: '18px'
        }}>
          {tournaments.map(t => (
            <TournamentCard
              key={t.id}
              tournament={t}
              onSelect={(id) => onSelectTournament(id)}
            />
          ))}
        </div>
      )}

    </div>
  );
}
