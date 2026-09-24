import React, { useState, useEffect } from 'react';
import apiRequest from '../api/client.js';

export default function Leaderboard() {
  const [timeframe, setTimeframe] = useState('all_time');
  const [leaderboard, setLeaderboard] = useState([]);
  const [podium, setPodium] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        setLoading(true);
        const data = await apiRequest(`/leaderboard?timeframe=${timeframe}`);
        setLeaderboard(data.leaderboard || []);
        setPodium(data.podium || []);
      } catch (err) {
        console.error('Leaderboard error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [timeframe]);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="font-heading" style={{ fontSize: '0.75rem', color: 'var(--prize-gold)', letterSpacing: '0.12em' }}>
          PRO ESPORTS LEADERBOARD
        </div>
        <h1 className="font-heading" style={{ fontSize: '2.2rem', color: 'var(--text-main)', marginTop: '4px' }}>
          TOP PLAYERS
        </h1>
        <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '540px', margin: '6px auto 0 auto' }}>
          National rankings computed from verified tournament victories, placement points, and total kill counts.
        </p>

        {/* TIMEFRAME SELECTOR */}
        <div style={{ display: 'inline-flex', gap: '6px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)', marginTop: '18px', border: '1px solid var(--border-subtle)' }}>
          {['daily', 'weekly', 'monthly', 'all_time'].map(t => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className="font-heading"
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: timeframe === t ? 'var(--prize-gold)' : 'transparent',
                color: timeframe === t ? 'var(--bg-dark)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* TOP 3 PODIUM */}
      {podium.length >= 3 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '18px',
          alignItems: 'flex-end',
          maxWidth: '1000px',
          margin: '0 auto 32px auto'
        }}>
          {/* RANK 2 */}
          <div className="tactical-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid #9AA7B8' }}>
            <div className="font-hud" style={{ fontSize: '0.8rem', color: '#9AA7B8', fontWeight: 700, marginBottom: '8px' }}>RANK #2</div>
            <img src={podium[1].avatar} alt={podium[1].username} style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', margin: '0 auto 10px auto', objectFit: 'cover' }} />
            <h3 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{podium[1].in_game_name || podium[1].username}</h3>
            <div className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>UID: {podium[1].free_fire_uid}</div>
            <div className="font-hud" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--prize-gold)' }}>
              ₹{Number(podium[1].total_earnings).toLocaleString()}
            </div>
            <div className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {podium[1].total_wins} WINS • {podium[1].total_kills} KILLS
            </div>
          </div>

          {/* RANK 1 GOLD */}
          <div className="tactical-card" style={{ padding: '26px', textAlign: 'center', borderTop: '4px solid var(--prize-gold)', background: 'rgba(255, 197, 61, 0.04)' }}>
            <div className="font-hud" style={{ fontSize: '0.85rem', color: 'var(--prize-gold)', fontWeight: 800, marginBottom: '8px' }}>👑 RANK #1</div>
            <img src={podium[0].avatar} alt={podium[0].username} style={{ width: '68px', height: '68px', borderRadius: 'var(--radius-sm)', margin: '0 auto 10px auto', border: '2px solid var(--prize-gold)', objectFit: 'cover' }} />
            <h3 className="font-heading" style={{ fontSize: '1.3rem', color: 'var(--prize-gold)' }}>{podium[0].in_game_name || podium[0].username}</h3>
            <div className="font-hud" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>UID: {podium[0].free_fire_uid}</div>
            <div className="font-hud" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--prize-gold)' }}>
              ₹{Number(podium[0].total_earnings).toLocaleString()}
            </div>
            <div className="font-hud" style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '4px' }}>
              {podium[0].total_wins} WINS • {podium[0].total_kills} KILLS
            </div>
          </div>

          {/* RANK 3 */}
          <div className="tactical-card" style={{ padding: '20px', textAlign: 'center', borderTop: '3px solid #CD7F32' }}>
            <div className="font-hud" style={{ fontSize: '0.8rem', color: '#CD7F32', fontWeight: 700, marginBottom: '8px' }}>RANK #3</div>
            <img src={podium[2].avatar} alt={podium[2].username} style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', margin: '0 auto 10px auto', objectFit: 'cover' }} />
            <h3 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{podium[2].in_game_name || podium[2].username}</h3>
            <div className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '6px' }}>UID: {podium[2].free_fire_uid}</div>
            <div className="font-hud" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--prize-gold)' }}>
              ₹{Number(podium[2].total_earnings).toLocaleString()}
            </div>
            <div className="font-hud" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {podium[2].total_wins} WINS • {podium[2].total_kills} KILLS
            </div>
          </div>
        </div>
      )}

      {/* FULL TABLE */}
      <div className="tactical-card" style={{ padding: '20px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>RANK</th>
              <th style={{ padding: '10px' }}>PLAYER</th>
              <th style={{ padding: '10px' }}>FREE FIRE UID</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>MATCHES</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>WINS</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>KILLS</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>EARNINGS</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td className="font-hud" style={{ padding: '10px', fontWeight: 700, color: p.rank === 1 ? 'var(--prize-gold)' : p.rank === 2 ? '#9AA7B8' : p.rank === 3 ? '#CD7F32' : 'var(--text-muted)' }}>
                  #{p.rank}
                </td>
                <td style={{ padding: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src={p.avatar} alt={p.username} style={{ width: '28px', height: '28px', borderRadius: '2px', objectFit: 'cover' }} />
                    <span className="font-heading" style={{ color: 'var(--text-main)' }}>{p.in_game_name || p.username}</span>
                  </div>
                </td>
                <td className="font-hud" style={{ padding: '10px', color: 'var(--text-muted)' }}>{p.free_fire_uid}</td>
                <td className="font-hud" style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)' }}>{p.total_matches}</td>
                <td className="font-hud" style={{ padding: '10px', textAlign: 'center', color: 'var(--secondary)', fontWeight: 700 }}>{p.total_wins}</td>
                <td className="font-hud" style={{ padding: '10px', textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>{p.total_kills}</td>
                <td className="font-hud" style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: 'var(--prize-gold)' }}>
                  ₹{Number(p.total_earnings).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
