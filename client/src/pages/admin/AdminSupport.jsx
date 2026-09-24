import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';
import apiRequest from '../../api/client.js';
import { HelpCircle, MessageSquare, Send, CheckCircle, Clock, X } from 'lucide-react';

export default function AdminSupport() {
  const { success, error } = useNotification();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyingTicket, setReplyingTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  const [submitting, setSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/admin/support-tickets');
      setTickets(res.tickets || []);
    } catch (err) {
      error(err.message, 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText || replyText.trim().length < 2) {
      error('Please write a reply message.');
      return;
    }
    try {
      setSubmitting(true);
      const res = await apiRequest(`/admin/support-tickets/${replyingTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ reply: replyText.trim(), status: replyStatus })
      });
      success(res.message, 'Reply Sent');
      setReplyingTicket(null);
      setReplyText('');
      await fetchTickets();
    } catch (err) {
      error(err.message, 'Reply Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          SUPPORT DESK & TICKETS
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Respond to player inquiries, dispute reports, and technical issues.
        </p>
      </div>

      <div className="glass-card-static" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading tickets...</div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No support tickets filed.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Date</th>
                <th style={{ padding: '12px 10px' }}>Player</th>
                <th style={{ padding: '12px 10px' }}>Category</th>
                <th style={{ padding: '12px 10px' }}>Subject</th>
                <th style={{ padding: '12px 10px' }}>Description</th>
                <th style={{ padding: '12px 10px' }}>Status</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{t.created_at}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{t.user_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>@{t.username}</div>
                  </td>
                  <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: 700, color: '#00f0ff' }}>
                    {t.category}
                  </td>
                  <td style={{ padding: '12px 10px', fontWeight: 800, color: '#fff' }}>{t.subject}</td>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1', maxWidth: '300px' }}>
                    <div>{t.description}</div>
                    {t.admin_reply && (
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>
                        <strong>Reply:</strong> {t.admin_reply}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    {t.status === 'open' && <span className="badge-full">OPEN</span>}
                    {t.status === 'in_progress' && <span className="badge-live">IN PROGRESS</span>}
                    {t.status === 'resolved' && <span className="badge-open">RESOLVED</span>}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setReplyingTicket(t);
                        setReplyText(t.admin_reply || '');
                        setReplyStatus(t.status === 'open' ? 'resolved' : t.status);
                      }}
                      className="btn-gold"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      <MessageSquare size={13} />
                      <span>Reply</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* REPLY MODAL */}
      {replyingTicket && (
        <div className="modal-backdrop" onClick={() => setReplyingTicket(null)}>
          <div className="glass-card-static" style={{ maxWidth: '500px', width: '100%', padding: '28px', border: '1px solid #ffb703' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fff' }}>
                REPLY TO TICKET ({replyingTicket.id})
              </h3>
              <button onClick={() => setReplyingTicket(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: '#090d15', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
              <div style={{ color: '#fff', fontWeight: 700 }}>{replyingTicket.subject}</div>
              <div style={{ color: '#94a3b8', marginTop: '4px' }}>{replyingTicket.description}</div>
            </div>

            <form onSubmit={handleReplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Admin Response *
                </label>
                <textarea
                  rows={4}
                  placeholder="Type your official answer to the player..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Ticket Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="input-dark"
                >
                  <option value="resolved">Resolved</option>
                  <option value="in_progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, padding: '12px' }}>
                  {submitting ? 'Sending...' : 'SEND REPLY & UPDATE STATUS'}
                </button>
                <button type="button" onClick={() => setReplyingTicket(null)} className="btn-secondary" style={{ padding: '12px' }}>
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
