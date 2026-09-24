import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import apiRequest from '../api/client.js';
import {
  Trophy, Calendar, Clock, MapPin, Copy, Check, Lock, Unlock,
  Award, Crosshair, ArrowRight
} from 'lucide-react';

export default function MyTournaments({ onSelectTournament, onNavigate }) {
  const { user, openLogin } = useAuth();
  const { success } = useNotification();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'upcoming' | 'live' | 'completed'
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadMyTournaments() {
      try {
        setLoading(true);
        const data = await apiRequest('/tournaments/my/list');
        setTournaments(data.tournaments || []);
      } catch (err) {
        console.error('My tournaments error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMyTournaments();
  }, [user]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    success(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 20px', textAlign: 'center' }} className="glass-card-static">
        <Trophy size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '8px' }}>
          PLAYER LOGIN REQUIRED
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>
          Please log in to view your registered tournament slots, match room credentials, and prize history.
        </p>
        <button onClick={openLogin} className="btn-primary">LOG IN TO YOUR ACCOUNT</button>
      </div>
    );
  }

  const filteredTournaments = tournaments.filter(t => {
    if (activeTab === 'upcoming') return t.status === 'open' || t.status === 'full';
    if (activeTab === 'live') return t.status === 'live';
    if (activeTab === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 20px 70px 20px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          PLAYER DASHBOARD
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          MY REGISTERED TOURNAMENTS
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Access your confirmed match slots, live room credentials, and tournament results.
        </p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        {[
          { key: 'all', label: `All (${tournaments.length})` },
          { key: 'live', label: `Live Matches (${tournaments.filter(t => t.status === 'live').length})` },
          { key: 'upcoming', label: `Upcoming (${tournaments.filter(t => t.status === 'open' || t.status === 'full').length})` },
          { key: 'completed', label: `Completed (${tournaments.filter(t => t.status === 'completed').length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              fontFamily: 'var(--font-heading)',
              background: activeTab === tab.key ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              color: '#ffffff'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MATCH CARDS LIST */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>Loading your tournaments...</div>
      ) : filteredTournaments.length === 0 ? (
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Crosshair size={44} color="#64748b" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>No Tournaments Found</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '20px' }}>You have not joined any tournaments in this category yet.</p>
          <button onClick={() => onNavigate('tournaments')} className="btn-primary">
            BROWSE UPCOMING MATCHES
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredTournaments.map(t => (
            <div
              key={t.id}
              className="glass-card-static"
              style={{
                padding: '20px 24px',
                borderRadius: '14px',
                border: t.status === 'live' ? '1px solid #ff3b30' : '1px solid rgba(255,255,255,0.08)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              {/* TOURNAMENT MAIN INFO */}
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ff5247', background: 'rgba(255,59,48,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                    {t.mode.toUpperCase().replace('_', ' ')}
                  </span>
                  {t.status === 'live' && <span className="badge-live">LIVE</span>}
                  {t.status === 'completed' && <span className="badge-completed">COMPLETED</span>}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
                  {t.name}
                </h3>

                <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem', color: '#94a3b8' }}>
                  <span>{t.date} at {t.start_time} IST</span>
                  <span>Map: {t.map}</span>
                </div>
              </div>

              {/* SLOT & ENTRY DETAILS */}
              <div style={{ background: '#090d15', padding: '12px 16px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                  <span style={{ color: '#94a3b8' }}>Assigned Slot:</span>
                  <strong style={{ color: '#ff5247', fontFamily: 'var(--font-heading)', fontSize: '0.95rem' }}>
                    SLOT {t.slot_number < 10 ? '0' + t.slot_number : t.slot_number}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Entry Fee Paid:</span>
                  <strong style={{ color: '#10b981' }}>₹{Number(t.entry_fee_paid || 0).toFixed(2)}</strong>
                </div>
              </div>

              {/* ROOM ID & PASS OR RESULT BADGE */}
              <div>
                {t.is_room_released ? (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, marginBottom: '4px' }}>
                      ROOM DETAILS RELEASED
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ fontSize: '0.85rem' }}>
                        ID: <strong>{t.room_id}</strong>
                      </div>
                      <button
                        onClick={() => handleCopy(t.room_id, 'Room ID')}
                        style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
                      >
                        <Copy size={13} />
                      </button>
                      <div style={{ fontSize: '0.85rem' }}>
                        Pass: <strong>{t.room_password}</strong>
                      </div>
                      <button
                        onClick={() => handleCopy(t.room_password, 'Password')}
                        style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}
                      >
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                ) : t.status === 'completed' ? (
                  <div style={{ background: 'rgba(255, 183, 3, 0.1)', border: '1px solid rgba(255, 183, 3, 0.3)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#ffb703', fontWeight: 800 }}>RESULT: {t.final_position ? `Rank #${t.final_position}` : 'Participated'}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: t.prize_won > 0 ? '#10b981' : '#fff' }}>
                      {t.prize_won > 0 ? `Won ₹${Number(t.prize_won).toFixed(2)}` : `${t.my_kills || 0} Kills (${t.my_points || 0} Pts)`}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#090d15', padding: '10px 14px', borderRadius: '8px', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={14} color="#ffb703" />
                    <span>Room ID released 15m before start</span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTON */}
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => onSelectTournament(t.id)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <span>Match Room</span>
                  <ArrowRight size={14} />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
