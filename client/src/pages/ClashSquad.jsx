import React, { useState, useEffect } from 'react';
import apiRequest from '../api/client.js';
import TournamentCard from '../components/TournamentCard.jsx';
import { Swords } from 'lucide-react';

export default function ClashSquad({ onSelectTournament }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCSTournaments() {
      try {
        const data = await apiRequest('/tournaments?mode=clash_squad');
        setTournaments(data.tournaments || []);
      } catch (err) {
        console.error('CS fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCSTournaments();
  }, []);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 60px 20px' }}>
      
      {/* HERO HEADER */}
      <div className="tactical-card" style={{
        padding: '28px',
        marginBottom: '32px',
        borderColor: 'var(--border-cyan)',
        background: 'var(--bg-surface)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div className="badge-cyan" style={{ marginBottom: '10px' }}>
            <Swords size={14} /> TEAM COMPETITION • CLASH SQUAD
          </div>
          <h1 className="font-heading" style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>
            CLASH SQUAD ARENA
          </h1>
          <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            Coordinate. Push. Eliminate. Tactical 4v4 squad elimination brackets with round-based rounds.
          </p>
        </div>
      </div>

      {/* MATCHES GRID */}
      <h2 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '16px' }}>
        CLASH SQUAD TOURNAMENTS
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Clash Squad matches...</div>
      ) : tournaments.length === 0 ? (
        <div className="tactical-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          No Clash Squad tournaments currently active.
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
