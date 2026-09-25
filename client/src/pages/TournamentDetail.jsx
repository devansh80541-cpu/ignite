import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import apiRequest from '../api/client.js';
import SlotGrid50 from '../components/SlotGrid50.jsx';
import BracketCS from '../components/BracketCS.jsx';
import confetti from 'canvas-confetti';
import {
  Trophy, Calendar, Clock, MapPin, Users,
  Copy, Check, Lock, Unlock, ArrowLeft, X
} from 'lucide-react';

export default function TournamentDetail({ tournamentId, onBack, onNavigate }) {
  const { user, openLogin, refreshUser } = useAuth();
  const { success, error, info } = useNotification();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joining, setJoining] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [inGameName, setInGameName] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([
    { ign: '', ffUid: '' },
    { ign: '', ffUid: '' },
    { ign: '', ffUid: '' },
    { ign: '', ffUid: '' }
  ]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/tournaments/${tournamentId}`);
      setData(res);
      if (user) {
        setInGameName(user.in_game_name || user.username || '');
        setFreeFireUid(user.free_fire_uid || '');
      }
    } catch (err) {
      error(err.message, 'Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [tournamentId, user]);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    success(`Copied ${field} to clipboard!`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleOpenJoin = (slotNum = null) => {
    if (!user) {
      info('Please log in to join tournaments.', 'Login Required');
      openLogin();
      return;
    }
    if (slotNum) setSelectedSlot(slotNum);
    setIsJoinModalOpen(true);
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!inGameName || !freeFireUid) {
      error('Please provide your Free Fire In-Game Name and UID.');
      return;
    }

    try {
      setJoining(true);
      const res = await apiRequest(`/tournaments/${tournamentId}/join`, {
        method: 'POST',
        body: JSON.stringify({
          slotNumber: selectedSlot,
          inGameName,
          freeFireUid,
          teamName: data?.tournament?.mode === 'clash_squad' ? teamName : null,
          teamMembers: data?.tournament?.mode === 'clash_squad' ? teamMembers : null
        })
      });

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      success(res.message, 'Slot Secured!');
      setIsJoinModalOpen(false);
      await refreshUser();
      await fetchDetails();
    } catch (err) {
      error(err.message, 'Join Failed');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading tournament details...
      </div>
    );
  }

  if (!data || !data.tournament) {
    return (
      <div style={{ maxWidth: '700px', margin: '60px auto', padding: '40px', textAlign: 'center' }}>
        <h2 className="font-heading">TOURNAMENT NOT FOUND</h2>
        <button onClick={onBack} className="btn-secondary" style={{ marginTop: '16px' }}>BACK TO MATCHES</button>
      </div>
    );
  }

  const { tournament, slots, teams, results, registeredCount, totalSlots } = data;
  const isRegistered = tournament.isUserRegistered;
  const userSlot = tournament.userSlot;
  const entryFee = Number(tournament.entry_fee) || 0;
  const hasSufficientBalance = user ? (Number(user.wallet_balance) >= entryFee) : false;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      
      {/* BACK BUTTON */}
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '16px' }}
      >
        <ArrowLeft size={16} />
        <span>BACK TO MATCHES</span>
      </button>

      {/* 25. TOURNAMENT DETAIL TOP AREA */}
      <div className="tactical-card" style={{ padding: '28px', marginBottom: '28px', background: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
          
          <div style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge-open">{tournament.mode.toUpperCase().replace('_', ' ')}</span>
              {tournament.status === 'live' && <span className="badge-live">LIVE</span>}
              {tournament.status === 'open' && <span className="badge-open">OPEN</span>}
              {tournament.status === 'full' && <span className="badge-cyan">FILLED</span>}
              {isRegistered && <span className="badge-gold">SLOT {userSlot < 10 ? '0' + userSlot : userSlot} SECURED</span>}
            </div>

            <h1 className="font-heading" style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '12px' }}>
              {tournament.name}
            </h1>

            <div className="font-hud" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="var(--text-dim)" />
                <span>{tournament.date}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} color="var(--text-dim)" />
                <span>{tournament.start_time} IST</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <MapPin size={14} color="var(--text-dim)" />
                <span>MAP: {tournament.map}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} color="var(--text-dim)" />
                <span>SLOTS: {registeredCount} / {totalSlots}</span>
              </div>
            </div>
          </div>

          {/* PRIZE POOL EMBLEM */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-gold)', borderRadius: 'var(--radius-md)', padding: '20px 24px', minWidth: '240px', textAlign: 'center' }}>
            <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--prize-gold)' }}>PRIZE POOL</div>
            <div className="font-hud" style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--prize-gold)', margin: '4px 0' }}>
              ₹{Number(tournament.prize_pool).toLocaleString()}
            </div>
            <div className="font-hud" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              ENTRY: {entryFee === 0 ? 'FREE' : `₹${entryFee.toFixed(2)}`}
            </div>

            {isRegistered ? (
              <div className="badge-gold" style={{ width: '100%', justifyContent: 'center', padding: '8px' }}>
                ✓ REGISTERED
              </div>
            ) : tournament.status === 'open' ? (
              <button
                onClick={() => handleOpenJoin()}
                className="btn-primary"
                style={{ width: '100%', padding: '10px', fontSize: '0.9rem' }}
              >
                SECURE YOUR SLOT
              </button>
            ) : (
              <button disabled className="btn-ghost" style={{ width: '100%', opacity: 0.5 }}>
                {tournament.status.toUpperCase()}
              </button>
            )}
          </div>

        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)', gap: '24px' }}>
        
        <div>
          {/* 27. ROOM INFORMATION HUD */}
          <div className="tactical-card" style={{ padding: '20px', marginBottom: '24px', borderLeft: '3px solid var(--secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {tournament.is_room_released ? <Unlock size={18} color="var(--secondary)" /> : <Lock size={18} color="var(--prize-gold)" />}
                <h3 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>ROOM CREDENTIALS HUD</h3>
              </div>
              {tournament.is_room_released ? (
                <span className="badge-cyan">RELEASED</span>
              ) : (
                <span className="badge-open">RELEASING BEFORE MATCH</span>
              )}
            </div>

            {tournament.is_room_released && isRegistered ? (
              <div className="font-hud" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>ROOM ID</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
                    <span>{tournament.room_id}</span>
                    <button onClick={() => handleCopy(tournament.room_id, 'Room ID')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                      {copiedField === 'Room ID' ? <Check size={14} color="var(--secondary)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>PASSWORD</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--prize-gold)' }}>
                    <span>{tournament.room_password}</span>
                    <button onClick={() => handleCopy(tournament.room_password, 'Room Password')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                      {copiedField === 'Room Password' ? <Check size={14} color="var(--prize-gold)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="font-hud" style={{ padding: '14px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {isRegistered ? 'Room credentials will be revealed in JetBrains Mono format prior to match start.' : 'Join match to view Room ID & Password upon release.'}
              </div>
            )}
          </div>

          {/* 50-SLOTS GRID / BRACKET */}
          {tournament.mode === 'battle_royale' && (
            <div className="tactical-card" style={{ padding: '20px', marginBottom: '24px' }}>
              <SlotGrid50
                slots={slots}
                selectedSlot={selectedSlot}
                onSelectSlot={(s) => {
                  setSelectedSlot(s);
                  handleOpenJoin(s);
                }}
                isRegistered={isRegistered}
                userSlot={userSlot}
              />
            </div>
          )}

          {tournament.mode === 'clash_squad' && (
            <div className="tactical-card" style={{ padding: '20px', marginBottom: '24px' }}>
              <h3 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '14px' }}>BRACKET</h3>
              <BracketCS teams={teams} />
            </div>
          )}

          {/* MATCH RESULTS */}
          {results && results.length > 0 && (
            <div className="tactical-card" style={{ padding: '20px' }}>
              <h3 className="font-heading" style={{ fontSize: '1.1rem', color: 'var(--prize-gold)', marginBottom: '14px' }}>OFFICIAL RESULTS</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>RANK</th>
                      <th style={{ padding: '8px' }}>PLAYER</th>
                      <th style={{ padding: '8px' }}>KILLS</th>
                      <th style={{ padding: '8px' }}>PTS</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>PRIZE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="font-hud" style={{ padding: '8px', fontWeight: 700, color: r.position === 1 ? 'var(--prize-gold)' : 'var(--text-main)' }}>#{r.position}</td>
                        <td style={{ padding: '8px', fontWeight: 600 }}>{r.player_name}</td>
                        <td className="font-hud" style={{ padding: '8px' }}>{r.kills}</td>
                        <td className="font-hud" style={{ padding: '8px', fontWeight: 700, color: 'var(--primary)' }}>{r.total_points}</td>
                        <td className="font-hud" style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: 'var(--prize-gold)' }}>
                          {r.prize_amount > 0 ? `₹${Number(r.prize_amount).toFixed(2)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="tactical-card" style={{ padding: '20px' }}>
            <div className="font-heading" style={{ fontSize: '0.75rem', color: 'var(--prize-gold)', marginBottom: '10px' }}>PRIZE DISTRIBUTION</div>
            <div className="font-hud" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--prize-gold)' }}>
                <span>🥇 1ST PLACE</span>
                <strong style={{ color: 'var(--prize-gold)' }}>₹{Number(tournament.first_prize || (tournament.prize_pool * 0.5)).toLocaleString()}</strong>
              </div>
              {Number(tournament.second_prize) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #C0C0C0' }}>
                  <span>🥈 2ND PLACE</span>
                  <strong style={{ color: 'var(--text-main)' }}>₹{Number(tournament.second_prize).toLocaleString()}</strong>
                </div>
              )}
              {Number(tournament.third_prize) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid #CD7F32' }}>
                  <span>🥉 3RD PLACE</span>
                  <strong style={{ color: '#CD7F32' }}>₹{Number(tournament.third_prize).toLocaleString()}</strong>
                </div>
              )}
              {Number(tournament.kill_bounty) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                  <span>💀 PER KILL</span>
                  <strong style={{ color: 'var(--primary)' }}>₹{Number(tournament.kill_bounty).toLocaleString()}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="tactical-card" style={{ padding: '20px' }}>
            <div className="font-heading" style={{ fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '10px' }}>RULES & INFORMATION</div>
            <div className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
              {tournament.rules || '1. Gun attributes: OFF\n2. Character skills: ON\n3. Emulators forbidden\n4. Room credentials released prior to start'}
            </div>
          </div>
        </div>

      </div>

      {/* JOIN MODAL */}
      {isJoinModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsJoinModalOpen(false)}>
          <div className="tactical-card" style={{ maxWidth: '440px', width: '100%', padding: '24px', background: 'var(--bg-surface)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>CONFIRM SLOT ENTRY</h3>
              <button onClick={() => setIsJoinModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SELECTED SLOT</label>
                <input type="text" disabled value={selectedSlot ? `SLOT ${selectedSlot < 10 ? '0' + selectedSlot : selectedSlot}` : 'AUTO-ASSIGN'} className="input-dark font-hud" />
              </div>

              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>IN-GAME NAME (IGN) *</label>
                <input type="text" value={inGameName} onChange={(e) => setInGameName(e.target.value)} className="input-dark font-hud" required />
              </div>

              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>FREE FIRE UID *</label>
                <input type="text" value={freeFireUid} onChange={(e) => setFreeFireUid(e.target.value)} className="input-dark font-hud" required />
              </div>

              <button type="submit" disabled={joining || !hasSufficientBalance} className="btn-primary" style={{ padding: '10px', marginTop: '6px' }}>
                {joining ? 'SECURING...' : `CONFIRM & PAY ₹${entryFee.toFixed(2)}`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
