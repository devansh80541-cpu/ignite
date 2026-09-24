import React from 'react';
import { Swords, Trophy, Shield } from 'lucide-react';

export default function BracketCS({ teams = [] }) {
  // Demo bracket matches for Clash Squad 4v4/2v2
  const quarterFinals = [
    { id: 'm1', teamA: teams[0]?.name || 'TEAM VIPER', teamB: teams[1]?.name || 'SHADOW SQUAD', scoreA: '7', scoreB: '4', winner: 'A' },
    { id: 'm2', teamA: teams[2]?.name || 'THUNDER KINGS', teamB: teams[3]?.name || 'BLAZE FORCES', scoreA: '5', scoreB: '7', winner: 'B' },
    { id: 'm3', teamA: teams[4]?.name || 'VALKYRIE OP', teamB: teams[5]?.name || 'PHANTOM HUNTERS', scoreA: '7', scoreB: '6', winner: 'A' },
    { id: 'm4', teamA: teams[6]?.name || 'DRAGON SLAYERS', teamB: teams[7]?.name || 'FROST ASSASSINS', scoreA: '3', scoreB: '7', winner: 'B' }
  ];

  const semiFinals = [
    { id: 'm5', teamA: 'TEAM VIPER', teamB: 'BLAZE FORCES', scoreA: '7', scoreB: '5', winner: 'A' },
    { id: 'm6', teamA: 'VALKYRIE OP', teamB: 'FROST ASSASSINS', scoreA: '4', scoreB: '7', winner: 'B' }
  ];

  const grandFinal = {
    id: 'm7',
    teamA: 'TEAM VIPER',
    teamB: 'FROST ASSASSINS',
    scoreA: '7',
    scoreB: '6',
    winner: 'A',
    champion: 'TEAM VIPER'
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto', padding: '10px 0' }}>
      <div style={{
        display: 'flex',
        gap: '28px',
        alignItems: 'center',
        minWidth: '760px',
        padding: '16px 8px'
      }}>
        
        {/* ROUND 1: QUARTER FINALS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>
            QUARTER FINALS
          </div>
          {quarterFinals.map(m => (
            <div key={m.id} className="bracket-node">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: m.winner === 'A' ? 800 : 500, color: m.winner === 'A' ? '#10b981' : '#e2e8f0' }}>
                  {m.teamA}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: m.winner === 'A' ? '#10b981' : '#94a3b8' }}>
                  {m.scoreA}
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: m.winner === 'B' ? 800 : 500, color: m.winner === 'B' ? '#10b981' : '#e2e8f0' }}>
                  {m.teamB}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: m.winner === 'B' ? '#10b981' : '#94a3b8' }}>
                  {m.scoreB}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ROUND 2: SEMI FINALS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>
            SEMI FINALS
          </div>
          {semiFinals.map(m => (
            <div key={m.id} className="bracket-node" style={{ border: '1px solid rgba(0, 240, 255, 0.3)', background: 'rgba(0, 240, 255, 0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: m.winner === 'A' ? 800 : 500, color: m.winner === 'A' ? '#00f0ff' : '#e2e8f0' }}>
                  {m.teamA}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: m.winner === 'A' ? '#00f0ff' : '#94a3b8' }}>
                  {m.scoreA}
                </span>
              </div>
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: m.winner === 'B' ? 800 : 500, color: m.winner === 'B' ? '#00f0ff' : '#e2e8f0' }}>
                  {m.teamB}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: m.winner === 'B' ? '#00f0ff' : '#94a3b8' }}>
                  {m.scoreB}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ROUND 3: GRAND FINALS */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffb703', fontFamily: 'var(--font-heading)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <Trophy size={16} /> GRAND FINALS
          </div>
          <div className="bracket-node" style={{ border: '2px solid #ffb703', background: 'rgba(255, 183, 3, 0.06)', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffb703' }}>
                👑 {grandFinal.teamA}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#ffb703' }}>
                {grandFinal.scoreA}
              </span>
            </div>
            <div style={{ height: '1px', background: 'rgba(255, 183, 3, 0.2)', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}>
                {grandFinal.teamB}
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8' }}>
                {grandFinal.scoreB}
              </span>
            </div>

            <div style={{ marginTop: '14px', textAlign: 'center', background: 'rgba(255, 183, 3, 0.15)', borderRadius: '6px', padding: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#ffd700' }}>
              CHAMPION: {grandFinal.champion}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
