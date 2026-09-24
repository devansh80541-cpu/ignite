import React, { useState, useEffect } from 'react';
import apiRequest from '../../api/client.js';
import { FileText, Search, ArrowDownLeft, ArrowUpRight, Trophy, RotateCcw, Shield } from 'lucide-react';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let url = `/admin/transactions?type=${selectedType}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await apiRequest(url);
      setTransactions(res.transactions || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedType, search]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          PLATFORM MASTER TRANSACTION LEDGER
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Global immutable audit trail of all financial movements across all player wallets.
        </p>
      </div>

      {/* FILTER & SEARCH */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['all', 'deposit', 'tournament_entry', 'prize_credit', 'cashout', 'refund', 'admin_adjustment'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedType === t ? 'var(--accent-gold)' : 'rgba(255,255,255,0.1)',
                background: selectedType === t ? 'var(--accent-gold)' : '#090d15',
                color: selectedType === t ? '#07090e' : '#ffffff',
                fontWeight: 800,
                fontSize: '0.8rem',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                textTransform: 'uppercase'
              }}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Search player, UTR, ref..."
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
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading master ledger...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No transactions recorded.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Date</th>
                <th style={{ padding: '12px 10px' }}>Tx ID</th>
                <th style={{ padding: '12px 10px' }}>Player</th>
                <th style={{ padding: '12px 10px' }}>Type</th>
                <th style={{ padding: '12px 10px' }}>Description</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{t.created_at}</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#94a3b8' }}>{t.id}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <strong style={{ color: '#fff' }}>{t.user_name}</strong>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>@{t.username}</div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: t.type === 'deposit' || t.type === 'prize_credit' ? '#10b981' : '#ffb703' }}>
                      {t.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#f8fafc' }}>{t.description}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: t.amount > 0 ? '#10b981' : '#ef4444' }}>
                    {t.amount > 0 ? `+₹${Number(t.amount).toFixed(2)}` : `-₹${Math.abs(Number(t.amount)).toFixed(2)}`}
                  </td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                    ₹{Number(t.balance_after).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
