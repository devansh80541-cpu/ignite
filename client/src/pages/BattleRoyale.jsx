import React, { useState, useEffect } from 'react';
import apiRequest from '../api/client.js';
import TournamentCard from '../components/TournamentCard.jsx';
import { Crosshair } from 'lucide-react';

export default function BattleRoyale({ onSelectTournament }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBRTournaments() {
      try {
        const data = await apiRequest('/tournaments?mode=battle_royale');
        setTournaments(data.tournaments || []);
      } catch (err) {
        console.error('BR fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBRTournaments();
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
            <Crosshair size={14} /> 50 PLAYER SLOTS • BATTLE ROYALE
          </div>
          <h1 className="font-heading" style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginBottom: '8px' }}>
            BATTLE ROYALE ARENA
          </h1>
          <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
            50 real-time player slots per tournament. Secure your slot number, claim kill bounties, and battle for the Booyah.
          </p>
        </div>

        {/* SCORING RULES */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-gold)',
          borderRadius: 'var(--radius-sm)',
          padding: '14px 18px',
          minWidth: '240px'
        }}>
          <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--prize-gold)', marginBottom: '6px' }}>
            BR SCORING SYSTEM
          </div>
          <div className="font-hud" style={{ fontSize: '0.8rem', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>1ST BOOYAH:</span>
              <strong style={{ color: 'var(--prize-gold)' }}>+12 PTS</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>2ND PLACE:</span>
              <span>+9 PTS</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>EACH KILL:</span>
              <strong style={{ color: 'var(--primary)' }}>+1 PT</strong>
            </div>
          </div>
        </div>
      </div>

      {/* MATCHES GRID */}
      <h2 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '16px' }}>
        50-SLOT MATCHES
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading Battle Royale matches...</div>
      ) : tournaments.length === 0 ? (
        <div className="tactical-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          No Battle Royale matches currently active.
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
