import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';
import apiRequest from '../../api/client.js';
import {
  ArrowUpRight, CheckCircle, XCircle, Search, RefreshCw, X, ShieldAlert,
  Send, AlertCircle
} from 'lucide-react';

export default function AdminCashouts() {
  const { success, error } = useNotification();

  const [cashouts, setCashouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');

  // Payout Modals
  const [payingCashout, setPayingCashout] = useState(null);
  const [txRef, setTxRef] = useState('');
  const [adminNote, setAdminNote] = useState('');

  const [rejectingCashout, setRejectingCashout] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchCashouts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/admin/cashouts?status=${tab}`);
      setCashouts(res.cashouts || []);
    } catch (err) {
      error(err.message, 'Failed to fetch cashout requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCashouts();
  }, [tab]);

  const handleMarkPaidSubmit = async (e) => {
    e.preventDefault();
    if (!payingCashout) return;
    try {
      setProcessing(true);
      const res = await apiRequest(`/admin/cashouts/${payingCashout.id}/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({
          transactionReference: txRef.trim() || `IMPS-${Date.now()}`,
          adminNote: adminNote.trim() || null
        })
      });
      success(res.message, 'Cashout Paid');
      setPayingCashout(null);
      setTxRef('');
      setAdminNote('');
      await fetchCashouts();
    } catch (err) {
      error(err.message, 'Payout Failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingCashout) return;
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      error('Please provide a reason for rejecting the cashout.');
      return;
    }
    try {
      setProcessing(true);
      const res = await apiRequest(`/admin/cashouts/${rejectingCashout.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      success(res.message, 'Cashout Rejected & Funds Returned');
      setRejectingCashout(null);
      setRejectionReason('');
      await fetchCashouts();
    } catch (err) {
      error(err.message, 'Rejection Failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredCashouts = cashouts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.user_name?.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.payout_identifier?.toLowerCase().includes(q) ||
      c.account_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          CASHOUT & WITHDRAWAL OPERATIONS
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Execute bank/UPI transfers for player winnings. Rejecting automatically unlocks reserved funds back to the player wallet.
        </p>
      </div>

      {/* TABS */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'pending', label: 'Pending' },
            { key: 'processing', label: 'Processing' },
            { key: 'paid', label: 'Paid' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all', label: 'All' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: tab === t.key ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                background: tab === t.key ? 'var(--accent-gold)' : '#090d15',
                color: tab === t.key ? '#07090e' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            placeholder="Search player, UPI ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark"
            style={{ padding: '8px 12px 8px 34px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        </div>
      </div>

      {/* TABLE */}
      <div className="glass-card-static" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading cashout queue...</div>
        ) : filteredCashouts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No cashouts in this view.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Requested Date</th>
                <th style={{ padding: '12px 10px' }}>Player</th>
                <th style={{ padding: '12px 10px' }}>Requested</th>
                <th style={{ padding: '12px 10px' }}>Fee ({cashouts[0]?.fee_amount ? '' : '2%'})</th>
                <th style={{ padding: '12px 10px' }}>Net Transfer</th>
                <th style={{ padding: '12px 10px' }}>Payout To</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCashouts.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{c.created_at}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{c.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>UID: {c.free_fire_uid || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 800, color: '#f8fafc' }}>
                    ₹{Number(c.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#ef4444' }}>
                    -₹{Number(c.fee_amount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>
                    ₹{Number(c.net_amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{c.account_name}</div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#ffd700' }}>{c.payout_identifier}</div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {c.status === 'pending' && <span className="badge-full">PENDING</span>}
                    {c.status === 'processing' && <span className="badge-live">PROCESSING</span>}
                    {c.status === 'paid' && <span className="badge-open">PAID</span>}
                    {c.status === 'rejected' && <span className="badge-completed" style={{ color: '#ef4444' }}>REJECTED</span>}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    {c.status === 'pending' || c.status === 'processing' ? (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => setPayingCashout(c)}
                          className="btn-gold"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <Send size={13} />
                          <span>Mark Paid</span>
                        </button>

                        <button
                          onClick={() => setRejectingCashout(c)}
                          className="btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {c.transaction_reference || 'Completed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MARK PAID MODAL */}
      {payingCashout && (
        <div className="modal-backdrop" onClick={() => setPayingCashout(null)}>
          <div className="glass-card-static" style={{ maxWidth: '460px', width: '100%', padding: '28px', border: '1px solid #10b981' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>CONFIRM PAYOUT TRANSFER</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '6px' }}>
                Transferring <strong>₹{Number(payingCashout.net_amount).toFixed(2)}</strong> to <strong>{payingCashout.account_name}</strong> ({payingCashout.payout_identifier}).
              </p>
            </div>

            <form onSubmit={handleMarkPaidSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Bank UTR / IMPS Payout Reference Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. IMPS48291048 or UPI Ref"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Admin Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Processed via HDFC Corporate NetBanking"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="input-dark"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-primary"
                  style={{ flex: 1, padding: '12px', background: '#10b981' }}
                >
                  {processing ? 'Recording Payout...' : 'CONFIRM PAID'}
                </button>
                <button
                  type="button"
                  onClick={() => setPayingCashout(null)}
                  className="btn-secondary"
                  style={{ padding: '12px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECT CASHOUT MODAL (REVERTS FUNDS) */}
      {rejectingCashout && (
        <div className="modal-backdrop" onClick={() => setRejectingCashout(null)}>
          <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '28px', border: '1px solid #ef4444' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <XCircle size={44} color="#ef4444" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>REJECT CASHOUT REQUEST</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '6px' }}>
                Reserved funds (<strong>₹{Number(rejectingCashout.amount).toFixed(2)}</strong>) will be unlocked and returned to <strong>{rejectingCashout.user_name}</strong>'s available wallet balance.
              </p>
            </div>

            <form onSubmit={handleRejectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Invalid UPI ID / Account name mismatch with KYC"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-danger"
                  style={{ flex: 1, padding: '12px' }}
                >
                  {processing ? 'Reverting...' : 'REJECT & REFUND RESERVED FUNDS'}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingCashout(null)}
                  className="btn-secondary"
                  style={{ padding: '12px' }}
                >
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
