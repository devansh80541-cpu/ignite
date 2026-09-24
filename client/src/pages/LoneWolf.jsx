import React, { useState, useEffect } from 'react';
import apiRequest from '../api/client.js';
import TournamentCard from '../components/TournamentCard.jsx';
import { Target } from 'lucide-react';

export default function LoneWolf({ onSelectTournament }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLWTournaments() {
      try {
        const data = await apiRequest('/tournaments?mode=lone_wolf');
        setTournaments(data.tournaments || []);
      } catch (err) {
        console.error('LW fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLWTournaments();
  }, []);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 60px 20px' }}>
      
      {/* HERO HEADER */}
      <div className="tactical-card" style={{
        padding: '28px',
        marginBottom: '32px',
        borderColor: 'var(--border-orange)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div className="badge-open" style={{ marginBottom: '10px' }}>
            <Target size={14} /> 1V1 DUELS • LONE WOLF
          </div>
          <h1 className="font-heading" style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>
            LONE WOLF ARENA
          </h1>
          <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            No teammates. No excuses. High-stakes 1v1 cage duels for ultimate gun skill dominance.
          </p>
        </div>
      </div>

      {/* MATCHES GRID */}
      <h2 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '16px' }}>
        1V1 DUELS
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Lone Wolf duels...</div>
      ) : tournaments.length === 0 ? (
        <div className="tactical-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          No Lone Wolf duels currently active.
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
