import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';
import apiRequest from '../../api/client.js';
import {
  Users, Search, Shield, Ban, CheckCircle, DollarSign, Eye, X,
  FileText, Trophy, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';

export default function AdminUsers() {
  const { success, error } = useNotification();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected User Modal
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDossier, setUserDossier] = useState(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  // Manual Balance Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustRef, setAdjustRef] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = `/admin/users?status=${statusFilter}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiRequest(url);
      setUsers(res.users || []);
      setTotal(res.total || 0);
    } catch (err) {
      error(err.message, 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const handleOpenDossier = async (userId) => {
    setSelectedUserId(userId);
    try {
      setLoadingDossier(true);
      const res = await apiRequest(`/admin/users/${userId}`);
      setUserDossier(res);
    } catch (err) {
      error(err.message, 'Failed to load user details');
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleToggleBan = async (userId, currentBanState) => {
    try {
      const res = await apiRequest(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ isBanned: !currentBanState })
      });
      success(res.message);
      await fetchUsers();
      if (selectedUserId === userId) {
        await handleOpenDossier(userId);
      }
    } catch (err) {
      error(err.message, 'Status update failed');
    }
  };

  const handleAdjustBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!adjustAmount || isNaN(parseFloat(adjustAmount))) {
      error('Please enter a valid adjustment amount.');
      return;
    }
    if (!adjustReason || adjustReason.trim().length < 5) {
      error('Please provide a descriptive reason for audit records.');
      return;
    }

    try {
      setAdjusting(true);
      const res = await apiRequest(`/admin/users/${selectedUserId}/adjust-balance`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(adjustAmount),
          reason: adjustReason.trim(),
          referenceNote: adjustRef.trim()
        })
      });
      success(res.message, 'Ledger Updated');
      setIsAdjustModalOpen(false);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustRef('');
      await handleOpenDossier(selectedUserId);
      await fetchUsers();
    } catch (err) {
      error(err.message, 'Adjustment Failed');
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          USER MANAGEMENT & DOSSIERS
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Inspect registered players, Free Fire UIDs, wallet ledger records, and execute documented balance adjustments.
        </p>
      </div>

      {/* FILTER & SEARCH */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'active', 'banned'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: statusFilter === s ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                background: statusFilter === s ? 'rgba(255, 183, 3, 0.2)' : '#090d15',
                color: statusFilter === s ? '#ffd700' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search name, UID, IGN, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark"
            style={{ padding: '8px 12px 8px 34px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        </div>
      </div>

      {/* USERS TABLE */}
      <div className="glass-card-static" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading player database...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No players matching search criteria.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Player</th>
                <th style={{ padding: '12px 10px' }}>Free Fire UID</th>
                <th style={{ padding: '12px 10px' }}>Email & Phone</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Wallet Balance</th>
                <th style={{ padding: '12px 10px', textAlign: 'center' }}>Matches / Wins</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`} alt={u.username} style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 800, color: '#fff' }}>{u.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>IGN: {u.in_game_name || u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#00f0ff' }}>
                    {u.free_fire_uid || '—'}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>
                    <div>{u.email}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.phone || 'No phone'}</div>
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: '#10b981', fontSize: '0.95rem' }}>
                    ₹{Number(u.wallet_balance || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'center', color: '#cbd5e1' }}>
                    {u.total_matches || 0} / <strong style={{ color: '#ffd700' }}>{u.total_wins || 0}</strong>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {u.is_banned ? (
                      <span className="badge-completed" style={{ color: '#ef4444' }}>SUSPENDED</span>
                    ) : (
                      <span className="badge-open">ACTIVE</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenDossier(u.id)}
                        className="btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title="View Full User Dossier"
                      >
                        <Eye size={14} />
                        <span>Inspect</span>
                      </button>

                      <button
                        onClick={() => handleToggleBan(u.id, u.is_banned)}
                        className={u.is_banned ? 'btn-secondary' : 'btn-danger'}
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title={u.is_banned ? 'Reactivate Account' : 'Suspend Account'}
                      >
                        {u.is_banned ? <CheckCircle size={14} /> : <Ban size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* USER FULL DOSSIER DRAWER / MODAL */}
      {selectedUserId && userDossier && (
        <div className="modal-backdrop" onClick={() => setSelectedUserId(null)}>
          <div className="glass-card-static" style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '30px', border: '1px solid rgba(255, 183, 3, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src={userDossier.user.avatar} alt="" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                    {userDossier.user.name} ({userDossier.user.username})
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    UID: <strong style={{ color: '#00f0ff' }}>{userDossier.user.free_fire_uid}</strong> • IGN: <strong style={{ color: '#ffd700' }}>{userDossier.user.in_game_name}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setIsAdjustModalOpen(true)}
                  className="btn-gold"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  <DollarSign size={14} />
                  <span>Adjust Balance</span>
                </button>

                <button onClick={() => setSelectedUserId(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* BALANCE CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: '#090d15', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>AVAILABLE BALANCE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>₹{Number(userDossier.user.wallet_balance).toFixed(2)}</div>
              </div>
              <div style={{ background: '#090d15', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>PENDING BALANCE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffb703' }}>₹{Number(userDossier.user.pending_balance).toFixed(2)}</div>
              </div>
              <div style={{ background: '#090d15', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>TOTAL EARNINGS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffd700' }}>₹{Number(userDossier.user.total_earnings).toFixed(2)}</div>
              </div>
              <div style={{ background: '#090d15', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>MATCHES / WINS</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>{userDossier.user.total_matches} / {userDossier.user.total_wins}</div>
              </div>
            </div>

            {/* RECENT TRANSACTIONS LEDGER */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
              Recent Ledger Transactions
            </h3>
            <div style={{ background: '#090d15', borderRadius: '8px', padding: '12px', marginBottom: '20px', maxHeight: '200px', overflowY: 'auto' }}>
              {userDossier.transactions.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>No transactions recorded.</div>
              ) : (
                <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                  <tbody>
                    {userDossier.transactions.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '6px' }}>{t.created_at}</td>
                        <td style={{ padding: '6px', fontWeight: 700 }}>{t.type}</td>
                        <td style={{ padding: '6px' }}>{t.description}</td>
                        <td style={{ padding: '6px', textAlign: 'right', fontWeight: 800, color: t.amount > 0 ? '#10b981' : '#ef4444' }}>
                          {t.amount > 0 ? `+₹${t.amount}` : `-₹${Math.abs(t.amount)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MANUAL BALANCE ADJUSTMENT MODAL (LEDGER BACKED) */}
      {isAdjustModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAdjustModalOpen(false)}>
          <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '28px', border: '1px solid rgba(255, 183, 3, 0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
                MANUAL BALANCE ADJUSTMENT
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255, 183, 3, 0.08)', border: '1px solid rgba(255, 183, 3, 0.25)', borderRadius: '8px', padding: '10px', fontSize: '0.78rem', color: '#fbbf24', marginBottom: '16px' }}>
              ⚠️ <strong>Audit Requirement:</strong> This will create an immutable ledger transaction and audit log under your admin username. Never modify balances silently.
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Adjustment Amount (Use negative for deduction e.g. -50 or +100) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 100 or -50"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Audit Reason (Mandatory) *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Compensation for tournament room reschedule dispute"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                  Reference Note / Ticket ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. TICK-84920"
                  value={adjustRef}
                  onChange={(e) => setAdjustRef(e.target.value)}
                  className="input-dark"
                />
              </div>

              <button
                type="submit"
                disabled={adjusting}
                className="btn-gold"
                style={{ padding: '12px', width: '100%', marginTop: '6px' }}
              >
                {adjusting ? 'Recording in Ledger...' : 'EXECUTE ADJUSTMENT & LOG'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
