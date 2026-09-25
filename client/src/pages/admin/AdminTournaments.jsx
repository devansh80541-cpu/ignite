import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';
import apiRequest from '../../api/client.js';
import {
  Trophy, PlusCircle, Edit2, Trash2, XCircle, Unlock, Users,
  Calendar, Clock, MapPin, X, CheckCircle, AlertTriangle, Crosshair, Swords, Target
} from 'lucide-react';

export default function AdminTournaments() {
  const { success, error, info } = useNotification();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [mode, setMode] = useState('battle_royale');
  const [teamSize, setTeamSize] = useState('1');
  const [entryFee, setEntryFee] = useState('50');
  const [prizePool, setPrizePool] = useState('5000');
  const [firstPrize, setFirstPrize] = useState('2500');
  const [secondPrize, setSecondPrize] = useState('1200');
  const [thirdPrize, setThirdPrize] = useState('800');
  const [killBounty, setKillBounty] = useState('500');
  const [maxSlots, setMaxSlots] = useState('50');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('20:00');
  const [map, setMap] = useState('Bermuda');
  const [rules, setRules] = useState('Solo Battle Royale. Official Esports Rulebook. Gun attributes OFF. Character skills ON.');
  const [roomId, setRoomId] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [status, setStatus] = useState('open');
  const [bannerImg, setBannerImg] = useState('');

  // Release Room Modal
  const [releaseModalTourn, setReleaseModalTourn] = useState(null);
  const [relRoomId, setRelRoomId] = useState('');
  const [relRoomPass, setRelRoomPass] = useState('');

  // Cancel & Refund Modal
  const [cancelModalTourn, setCancelModalTourn] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/tournaments?status=all');
      setTournaments(res.tournaments || []);
    } catch (err) {
      error(err.message, 'Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('🔥 Bermuda Champions League — ₹5,000 Battle Royale');
    setMode('battle_royale');
    setTeamSize('1');
    setEntryFee('50');
    setPrizePool('5000');
    setFirstPrize('2500');
    setSecondPrize('1200');
    setThirdPrize('800');
    setKillBounty('500');
    setMaxSlots('50');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('21:00');
    setMap('Bermuda');
    setRules('Standard Competitive Rules. Gun attributes OFF. Emulators strictly banned.');
    setRoomId('');
    setRoomPassword('');
    setStatus('open');
    setBannerImg('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingId(t.id);
    setName(t.name);
    setMode(t.mode);
    setTeamSize(String(t.team_size || '1'));
    setEntryFee(String(t.entry_fee || '0'));
    setPrizePool(String(t.prize_pool || '0'));
    setFirstPrize(String(t.first_prize || '0'));
    setSecondPrize(String(t.second_prize || '0'));
    setThirdPrize(String(t.third_prize || '0'));
    setKillBounty(String(t.kill_bounty || '0'));
    setMaxSlots(String(t.max_slots || '50'));
    setDate(t.date);
    setStartTime(t.start_time);
    setMap(t.map || 'Bermuda');
    setRules(t.rules || '');
    setRoomId(t.room_id || '');
    setRoomPassword(t.room_password || '');
    setStatus(t.status || 'open');
    setBannerImg(t.banner_img || '');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name,
        mode,
        team_size: parseInt(teamSize, 10),
        entry_fee: parseFloat(entryFee),
        prize_pool: parseFloat(prizePool),
        first_prize: parseFloat(firstPrize),
        second_prize: parseFloat(secondPrize),
        third_prize: parseFloat(thirdPrize),
        kill_bounty: parseFloat(killBounty),
        max_slots: mode === 'battle_royale' ? 50 : parseInt(maxSlots, 10),
        date,
        start_time: startTime,
        map,
        rules,
        room_id: roomId,
        room_password: roomPassword,
        status,
        banner_img: bannerImg
      };

      if (editingId) {
        await apiRequest(`/admin/tournaments/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        success('Tournament updated successfully!');
      } else {
        await apiRequest('/admin/tournaments', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        success('Tournament created and added to public schedule!');
      }

      setIsModalOpen(false);
      await fetchTournaments();
    } catch (err) {
      error(err.message, 'Operation Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReleaseRoomConfirm = async (e) => {
    e.preventDefault();
    if (!relRoomId || !relRoomPass) {
      error('Please enter Room ID and Room Password.');
      return;
    }
    try {
      const res = await apiRequest(`/admin/tournaments/${releaseModalTourn.id}/release-room`, {
        method: 'POST',
        body: JSON.stringify({ roomId: relRoomId, roomPassword: relRoomPass })
      });
      success(res.message, 'Room Released');
      setReleaseModalTourn(null);
      await fetchTournaments();
    } catch (err) {
      error(err.message, 'Release Failed');
    }
  };

  const handleCancelRefundConfirm = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest(`/admin/tournaments/${cancelModalTourn.id}/cancel-refund`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason.trim() })
      });
      success(res.message, 'Tournament Cancelled & Refunded');
      setCancelModalTourn(null);
      setCancelReason('');
      await fetchTournaments();
    } catch (err) {
      error(err.message, 'Cancel Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this tournament?')) return;
    try {
      await apiRequest(`/admin/tournaments/${id}`, { method: 'DELETE' });
      success('Tournament deleted');
      await fetchTournaments();
    } catch (err) {
      error(err.message, 'Delete Failed');
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
            TOURNAMENT MANAGEMENT & MATCHES
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Create 50-slot Battle Royale, Clash Squad 4v4/2v2, Lone Wolf duels, release room credentials, and manage slot registrations.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="btn-primary"
          style={{ padding: '10px 20px' }}
        >
          <PlusCircle size={18} />
          <span>CREATE NEW TOURNAMENT</span>
        </button>
      </div>

      {/* TOURNAMENTS TABLE */}
      <div className="glass-card-static" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading tournaments...</div>
        ) : tournaments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No tournaments created yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Tournament</th>
                <th style={{ padding: '12px 10px' }}>Mode</th>
                <th style={{ padding: '12px 10px' }}>Date & Time</th>
                <th style={{ padding: '12px 10px' }}>Slots Filled</th>
                <th style={{ padding: '12px 10px' }}>Fee / Prize</th>
                <th style={{ padding: '12px 10px' }}>Room Status</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 800, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Map: {t.map} • ID: {t.id}</div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: t.mode === 'battle_royale' ? '#ff5247' : t.mode === 'clash_squad' ? '#00f0ff' : '#ffb703', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px' }}>
                      {t.mode.toUpperCase().replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>
                    <div>{t.date}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.start_time} IST</div>
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 800, color: t.filled_slots >= t.max_slots ? '#ef4444' : '#10b981' }}>
                    {t.filled_slots || 0} / {t.max_slots || 50}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ color: Number(t.entry_fee) === 0 ? '#10b981' : '#fff', fontWeight: 700 }}>Fee: ₹{Number(t.entry_fee).toFixed(2)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 800 }}>Prize: ₹{Number(t.prize_pool).toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {t.is_room_released ? (
                      <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.78rem' }}>
                        ✓ {t.room_id} | {t.room_password}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReleaseModalTourn(t);
                          setRelRoomId(t.room_id || '');
                          setRelRoomPass(t.room_password || '');
                        }}
                        className="btn-gold"
                        style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      >
                        <Unlock size={12} />
                        <span>Release Room</span>
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {t.status === 'live' && <span className="badge-live">LIVE</span>}
                    {t.status === 'open' && <span className="badge-open">OPEN</span>}
                    {t.status === 'full' && <span className="badge-full">FULL</span>}
                    {t.status === 'completed' && <span className="badge-completed">COMPLETED</span>}
                    {t.status === 'cancelled' && <span className="badge-completed" style={{ color: '#ef4444' }}>CANCELLED</span>}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="btn-secondary"
                        style={{ padding: '6px 8px' }}
                        title="Edit Tournament"
                      >
                        <Edit2 size={13} />
                      </button>

                      {t.status !== 'cancelled' && t.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setCancelModalTourn(t);
                            setCancelReason('');
                          }}
                          className="btn-danger"
                          style={{ padding: '6px 8px' }}
                          title="Cancel & Auto-Refund Participants"
                        >
                          <XCircle size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(t.id)}
                        className="btn-secondary"
                        style={{ padding: '6px 8px', color: '#ef4444' }}
                        title="Delete Tournament"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* CREATE / EDIT TOURNAMENT MODAL */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="glass-card-static" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '30px', border: '1px solid rgba(255, 59, 48, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                {editingId ? 'EDIT TOURNAMENT' : 'CREATE NEW TOURNAMENT'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Tournament Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Game Mode *</label>
                  <select
                    value={mode}
                    onChange={(e) => {
                      setMode(e.target.value);
                      if (e.target.value === 'battle_royale') setMaxSlots('50');
                      else if (e.target.value === 'clash_squad') setMaxSlots('16');
                      else if (e.target.value === 'lone_wolf') setMaxSlots('16');
                    }}
                    className="input-dark"
                  >
                    <option value="battle_royale">Battle Royale (50 Slots)</option>
                    <option value="clash_squad">Clash Squad (Team Knockout)</option>
                    <option value="lone_wolf">Lone Wolf (1v1 Duels)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Map</label>
                  <select value={map} onChange={(e) => setMap(e.target.value)} className="input-dark">
                    <option value="Bermuda">Bermuda</option>
                    <option value="Purgatory">Purgatory</option>
                    <option value="Kalahari">Kalahari</option>
                    <option value="Alpine">Alpine</option>
                    <option value="Nexterra">Nexterra</option>
                    <option value="Iron Cage">Iron Cage (1v1)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Max Slots</label>
                  <input
                    type="number"
                    value={maxSlots}
                    onChange={(e) => setMaxSlots(e.target.value)}
                    className="input-dark"
                    disabled={mode === 'battle_royale'}
                    required
                  />
                </div>
              </div>

              {/* FINANCIALS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', background: '#090d15', padding: '16px', borderRadius: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '4px' }}>Entry Fee (₹)</label>
                  <input type="number" step="0.01" value={entryFee} onChange={(e) => setEntryFee(e.target.value)} className="input-dark" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#ffd700', marginBottom: '4px' }}>Total Prize (₹)</label>
                  <input type="number" step="0.01" value={prizePool} onChange={(e) => setPrizePool(e.target.value)} className="input-dark" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#ffd700', marginBottom: '4px' }}>1st Place (₹)</label>
                  <input type="number" step="0.01" value={firstPrize} onChange={(e) => setFirstPrize(e.target.value)} className="input-dark" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#c0c0c0', marginBottom: '4px' }}>2nd Place (₹)</label>
                  <input type="number" step="0.01" value={secondPrize} onChange={(e) => setSecondPrize(e.target.value)} className="input-dark" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#CD7F32', marginBottom: '4px' }}>3rd Place (₹)</label>
                  <input type="number" step="0.01" value={thirdPrize} onChange={(e) => setThirdPrize(e.target.value)} className="input-dark" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#ff5247', marginBottom: '4px' }}>Kill Bounty (₹)</label>
                  <input type="number" step="0.01" value={killBounty} onChange={(e) => setKillBounty(e.target.value)} className="input-dark" />
                </div>
              </div>

              {/* SCHEDULE & ROOM */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Match Date *</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-dark" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Start Time (IST) *</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-dark" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-dark">
                    <option value="open">Open</option>
                    <option value="full">Full</option>
                    <option value="live">Live</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* ROOM ID & PASSWORD */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Custom Room ID</label>
                  <input type="text" placeholder="e.g. 7829104" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="input-dark" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Room Password</label>
                  <input type="text" placeholder="e.g. FFPRO" value={roomPassword} onChange={(e) => setRoomPassword(e.target.value)} className="input-dark" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Rules & Instructions</label>
                <textarea rows={3} value={rules} onChange={(e) => setRules(e.target.value)} className="input-dark" />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                  {submitting ? 'Saving Tournament...' : (editingId ? 'UPDATE TOURNAMENT' : 'CREATE TOURNAMENT')}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ padding: '12px' }}>
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RELEASE ROOM MODAL */}
      {releaseModalTourn && (
        <div className="modal-backdrop" onClick={() => setReleaseModalTourn(null)}>
          <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '28px', border: '1px solid #10b981' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Unlock size={44} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>RELEASE ROOM CREDENTIALS</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '6px' }}>
                This will immediately broadcast Room ID and Password to all registered participants in <strong>{releaseModalTourn.name}</strong>.
              </p>
            </div>

            <form onSubmit={handleReleaseRoomConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Room ID *</label>
                <input type="text" value={relRoomId} onChange={(e) => setRelRoomId(e.target.value)} className="input-dark" placeholder="7829104" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>Room Password *</label>
                <input type="text" value={relRoomPass} onChange={(e) => setRelRoomPass(e.target.value)} className="input-dark" placeholder="FFPRO" required />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', background: '#10b981' }}>
                  BROADCAST ROOM NOW
                </button>
                <button type="button" onClick={() => setReleaseModalTourn(null)} className="btn-secondary" style={{ padding: '12px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL & REFUND MODAL */}
      {cancelModalTourn && (
        <div className="modal-backdrop" onClick={() => setCancelModalTourn(null)}>
          <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '28px', border: '1px solid #ef4444' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <XCircle size={44} color="#ef4444" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>CANCEL & REFUND TOURNAMENT</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '6px' }}>
                This will cancel <strong>{cancelModalTourn.name}</strong> and automatically refund 100% of the entry fee to all registered participants' wallets.
              </p>
            </div>

            <form onSubmit={handleCancelRefundConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Cancellation Reason *</label>
                <textarea rows={3} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input-dark" placeholder="e.g. Free Fire Server Maintenance" required />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-danger" style={{ flex: 1, padding: '12px' }}>
                  EXECUTE CANCELLATION & REFUNDS
                </button>
                <button type="button" onClick={() => setCancelModalTourn(null)} className="btn-secondary" style={{ padding: '12px' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
