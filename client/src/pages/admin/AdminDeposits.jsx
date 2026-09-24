import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';
import apiRequest from '../../api/client.js';
import {
  ArrowDownLeft, CheckCircle, XCircle, Search, Eye, X, Image as ImageIcon,
  ShieldCheck, AlertTriangle
} from 'lucide-react';

export default function AdminDeposits() {
  const { success, error } = useNotification();

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [search, setSearch] = useState('');

  // Modals
  const [selectedProof, setSelectedProof] = useState(null);
  const [approvingDeposit, setApprovingDeposit] = useState(null);
  const [rejectingDeposit, setRejectingDeposit] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/admin/deposits?status=${tab}`);
      setDeposits(res.deposits || []);
    } catch (err) {
      error(err.message, 'Failed to fetch deposits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [tab]);

  const handleApproveConfirm = async () => {
    if (!approvingDeposit) return;
    try {
      setProcessing(true);
      const res = await apiRequest(`/admin/deposits/${approvingDeposit.id}/approve`, {
        method: 'POST'
      });
      success(res.message, 'Deposit Approved');
      setApprovingDeposit(null);
      await fetchDeposits();
    } catch (err) {
      error(err.message, 'Approval Failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectingDeposit) return;
    if (!rejectionReason || rejectionReason.trim().length < 3) {
      error('Please provide a reason for rejection.');
      return;
    }
    try {
      setProcessing(true);
      const res = await apiRequest(`/admin/deposits/${rejectingDeposit.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectionReason.trim() })
      });
      success(res.message, 'Deposit Rejected');
      setRejectingDeposit(null);
      setRejectionReason('');
      await fetchDeposits();
    } catch (err) {
      error(err.message, 'Rejection Failed');
    } finally {
      setProcessing(false);
    }
  };

  const filteredDeposits = deposits.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.user_name?.toLowerCase().includes(q) ||
      d.username?.toLowerCase().includes(q) ||
      d.transaction_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          DEPOSIT VERIFICATION & APPROVALS
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Review player UTR transaction IDs and proof screenshots. Approving credits the player wallet instantly.
        </p>
      </div>

      {/* TABS & SEARCH */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: 'pending', label: 'Pending Review' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
            { key: 'all', label: 'All Deposits' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: tab === t.key ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                background: tab === t.key ? 'var(--primary)' : '#090d15',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            placeholder="Search UTR, player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-dark"
            style={{ padding: '8px 12px 8px 34px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        </div>
      </div>

      {/* DEPOSITS TABLE */}
      <div className="glass-card-static" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading deposit requests...</div>
        ) : filteredDeposits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No deposit requests found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Date Submitted</th>
                <th style={{ padding: '12px 10px' }}>Player</th>
                <th style={{ padding: '12px 10px' }}>Amount</th>
                <th style={{ padding: '12px 10px' }}>Payment Method</th>
                <th style={{ padding: '12px 10px' }}>12-Digit UTR / Ref</th>
                <th style={{ padding: '12px 10px' }}>Proof</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: d.status === 'pending' ? 'rgba(255, 183, 3, 0.03)' : 'transparent' }}>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{d.created_at}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{d.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>UID: {d.free_fire_uid || 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 900, color: '#10b981', fontSize: '1rem' }}>
                    ₹{Number(d.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 700 }}>
                    {d.payment_method}
                  </td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 800, color: '#ffd700' }}>
                    {d.transaction_id}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {d.proof_image ? (
                      <button
                        onClick={() => setSelectedProof(d.proof_image)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        <ImageIcon size={14} />
                        <span>View</span>
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>None</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {d.status === 'pending' && <span className="badge-full">PENDING REVIEW</span>}
                    {d.status === 'approved' && <span className="badge-open">APPROVED</span>}
                    {d.status === 'rejected' && <span className="badge-completed" style={{ color: '#ef4444' }}>REJECTED</span>}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    {d.status === 'pending' ? (
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => setApprovingDeposit(d)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#10b981' }}
                        >
                          <CheckCircle size={14} />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => setRejectingDeposit(d)}
                          className="btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        >
                          <XCircle size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        {d.reviewed_by ? `By ${d.reviewed_by}` : 'Completed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PROOF IMAGE MODAL */}
      {selectedProof && (
        <div className="modal-backdrop" onClick={() => setSelectedProof(null)}>
          <div className="glass-card-static" style={{ maxWidth: '600px', width: '100%', padding: '20px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 800 }}>PAYMENT PROOF PREVIEW</span>
              <button onClick={() => setSelectedProof(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <img src={selectedProof} alt="Proof" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}

      {/* APPROVAL CONFIRMATION MODAL */}
      {approvingDeposit && (
        <div className="modal-backdrop" onClick={() => setApprovingDeposit(null)}>
          <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '28px', border: '1px solid #10b981' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <CheckCircle size={44} color="#10b981" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>APPROVE DEPOSIT REQUEST</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '6px' }}>
                Confirm adding <strong>₹{Number(approvingDeposit.amount).toFixed(2)}</strong> to <strong>{approvingDeposit.user_name}</strong>'s wallet?
              </p>
            </div>

            <div style={{ background: '#090d15', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.82rem', color: '#cbd5e1' }}>
              <div>UTR Number: <strong style={{ color: '#ffd700', fontFamily: 'monospace' }}>{approvingDeposit.transaction_id}</strong></div>
              <div>Method: <strong>{approvingDeposit.payment_method.toUpperCase()}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleApproveConfirm}
                disabled={processing}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', background: '#10b981' }}
              >
                {processing ? 'Crediting Wallet...' : 'YES, APPROVE & CREDIT'}
              </button>
              <button
                onClick={() => setApprovingDeposit(null)}
                className="btn-secondary"
                style={{ padding: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingDeposit && (
        <div className="modal-backdrop" onClick={() => setRejectingDeposit(null)}>
          <div className="glass-card-static" style={{ maxWidth: '440px', width: '100%', padding: '28px', border: '1px solid #ef4444' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <XCircle size={44} color="#ef4444" style={{ margin: '0 auto 10px auto' }} />
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>REJECT DEPOSIT REQUEST</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '6px' }}>
                State why this UTR ({rejectingDeposit.transaction_id}) is being rejected.
              </p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Rejection Reason (Sent to Player) *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. UTR not found in bank statement / Fake transaction screenshot"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input-dark"
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleRejectConfirm}
                disabled={processing}
                className="btn-danger"
                style={{ flex: 1, padding: '12px' }}
              >
                {processing ? 'Rejecting...' : 'CONFIRM REJECTION'}
              </button>
              <button
                onClick={() => setRejectingDeposit(null)}
                className="btn-secondary"
                style={{ padding: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
