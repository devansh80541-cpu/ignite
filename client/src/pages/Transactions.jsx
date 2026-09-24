import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import apiRequest from '../api/client.js';
import { FileText, Search, ArrowDownLeft, ArrowUpRight, Trophy, RotateCcw, Shield } from 'lucide-react';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    async function loadTx() {
      try {
        setLoading(true);
        let url = `/wallet/transactions?type=${selectedType}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        const res = await apiRequest(url);
        setTransactions(res.transactions || []);
        setTotal(res.total || 0);
      } catch (err) {
        console.error('Transactions load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTx();
  }, [user, selectedType, searchQuery]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit': return <ArrowDownLeft size={16} color="#10b981" />;
      case 'tournament_entry': return <ArrowUpRight size={16} color="#ef4444" />;
      case 'prize_credit': return <Trophy size={16} color="#ffd700" />;
      case 'cashout': return <ArrowUpRight size={16} color="#ffb703" />;
      case 'refund': return <RotateCcw size={16} color="#00f0ff" />;
      case 'admin_adjustment': return <Shield size={16} color="#8b5cf6" />;
      default: return <FileText size={16} color="#94a3b8" />;
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
          FINANCIAL AUDIT
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          IMMUTABLE TRANSACTION LEDGER
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
          Every rupee deposited, spent on tournament entries, won, or withdrawn is recorded here permanently.
        </p>
      </div>

      {/* FILTER & SEARCH */}
      <div className="glass-card-static" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {['all', 'deposit', 'tournament_entry', 'prize_credit', 'cashout', 'refund'].map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: selectedType === t ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                background: selectedType === t ? 'var(--primary)' : '#090d15',
                color: '#ffffff',
                fontWeight: 700,
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

        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            placeholder="Search description / ref ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-dark"
            style={{ padding: '8px 12px 8px 34px', fontSize: '0.85rem' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="glass-card-static" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading ledger records...</div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
            No transactions found for this filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Date & Time</th>
                <th style={{ padding: '12px 10px' }}>Transaction ID</th>
                <th style={{ padding: '12px 10px' }}>Type</th>
                <th style={{ padding: '12px 10px' }}>Description</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 10px', textAlign: 'right' }}>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => {
                const isPositive = Number(tx.amount) > 0;
                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{tx.created_at}</td>
                    <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#94a3b8' }}>{tx.id}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                        {getTypeIcon(tx.type)}
                        <span>{tx.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 10px', color: '#f8fafc' }}>{tx.description}</td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 800, color: isPositive ? '#10b981' : '#ef4444', fontSize: '0.95rem' }}>
                      {isPositive ? `+₹${Number(tx.amount).toFixed(2)}` : `-₹${Math.abs(Number(tx.amount)).toFixed(2)}`}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#f8fafc' }}>
                      ₹{Number(tx.balance_after).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
