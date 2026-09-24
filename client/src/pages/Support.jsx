import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import apiRequest from '../api/client.js';
import { HelpCircle, MessageSquare, Send, ShieldAlert, FileQuestion, ChevronDown, ChevronUp } from 'lucide-react';

export default function Support() {
  const { user, openLogin } = useAuth();
  const { success, error } = useNotification();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('payment');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    {
      q: 'When do I receive the custom match Room ID and Password?',
      a: 'The Room ID and Password are automatically released 15 minutes before the scheduled match time on the tournament page and sent directly to your notification center.'
    },
    {
      q: 'How does adding money to my wallet work?',
      a: 'When you scan the QR or pay via UPI, you must submit your 12-digit UTR/Transaction ID. Our finance team verifies the UTR and credits your wallet within a few minutes.'
    },
    {
      q: 'Are PC emulators allowed in tournaments?',
      a: 'No. Unless a tournament explicitly states "EMULATOR ALLOWED" in its title, all matches are strictly mobile-only. Players detected on emulators will be banned and entry fees forfeited.'
    },
    {
      q: 'How are prizes distributed after a match ends?',
      a: 'Once the admin enters and finalizes the kill and placement results, prize amounts are automatically and atomically credited to the winners\' wallet balances immediately.'
    },
    {
      q: 'How long do cashout withdrawals take to process?',
      a: 'Cashouts are reviewed and processed directly to your UPI ID or Bank Account within 15 minutes to 2 hours during active operating hours.'
    }
  ];

  const fetchTickets = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiRequest('/support/my');
      setTickets(data.tickets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      openLogin();
      return;
    }
    if (!subject || !description) {
      error('Please provide a subject and description.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiRequest('/support', {
        method: 'POST',
        body: JSON.stringify({ subject, category, description })
      });
      success(res.message, 'Ticket Submitted');
      setSubject('');
      setDescription('');
      await fetchTickets();
    } catch (err) {
      error(err.message, 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      
      {/* HEADER */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          24/7 HELPDESK
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          SUPPORT & TICKET CENTER
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Have a question or payment inquiry? Review our FAQs or raise a support ticket.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        
        {/* LEFT COLUMN: FAQS */}
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '18px' }}>
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="glass-card-static"
                style={{ borderRadius: '10px', overflow: 'hidden' }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} color="var(--primary)" /> : <ChevronDown size={18} color="#64748b" />}
                </button>
                {openFaq === idx && (
                  <div style={{ padding: '0 16px 16px 16px', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: CREATE TICKET & MY TICKETS */}
        <div>
          <div className="glass-card-static" style={{ padding: '24px', border: '1px solid rgba(255, 59, 48, 0.35)', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '16px' }}>
              SUBMIT A SUPPORT TICKET
            </h2>

            <form onSubmit={handleTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="input-dark"
                >
                  <option value="payment">Payment & Deposit Issue</option>
                  <option value="cashout">Cashout / Withdrawal Query</option>
                  <option value="tournament">Tournament & Room Issue</option>
                  <option value="fairplay">Report Cheater / Unfair Play</option>
                  <option value="account">Account & Profile Support</option>
                  <option value="other">Other Inquiries</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Subject *</label>
                <input
                  type="text"
                  placeholder="e.g. Deposit UTR 482910 verification delay"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>Description *</label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue with all relevant match IDs or UTR numbers..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-dark"
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{ padding: '12px', width: '100%' }}
              >
                {submitting ? 'Submitting...' : 'SUBMIT TICKET'}
              </button>
            </form>
          </div>

          {/* MY TICKETS LIST */}
          {user && (
            <div className="glass-card-static" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>
                MY PAST TICKETS
              </h3>

              {tickets.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>You have no open tickets.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {tickets.map(t => (
                    <div key={t.id} style={{ background: '#090d15', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: '0.85rem' }}>{t.subject}</span>
                        <span style={{ fontSize: '0.72rem', color: t.status === 'resolved' ? '#10b981' : '#ffb703', textTransform: 'uppercase', fontWeight: 700 }}>
                          {t.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{t.description}</p>
                      {t.admin_reply && (
                        <div style={{ marginTop: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px', borderRadius: '6px', fontSize: '0.78rem', color: '#6ee7b7' }}>
                          <strong>Admin Reply:</strong> {t.admin_reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
