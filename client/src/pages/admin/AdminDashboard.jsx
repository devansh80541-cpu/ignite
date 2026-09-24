import React, { useState, useEffect } from 'react';
import apiRequest from '../../api/client.js';
import {
  Users, ArrowDownLeft, ArrowUpRight, Trophy, DollarSign,
  TrendingUp, AlertTriangle, ShieldCheck, PlusCircle, CheckCircle, Clock
} from 'lucide-react';

export default function AdminDashboard({ onNavigateAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await apiRequest('/admin/dashboard-stats');
        setData(res);
      } catch (err) {
        console.error('Admin stats error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
        Loading platform metrics...
      </div>
    );
  }

  const { stats, chartData, recentAudits } = data;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* HEADER & QUICK ACTIONS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
            ADMIN OVERVIEW & OPERATIONS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Live platform metrics, deposit/cashout approvals, and match orchestration.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onNavigateAdmin('tournaments')}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <PlusCircle size={16} />
            <span>CREATE TOURNAMENT</span>
          </button>

          {stats.pendingDepositsCount > 0 && (
            <button
              onClick={() => onNavigateAdmin('deposits')}
              className="btn-gold"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              <ArrowDownLeft size={16} />
              <span>{stats.pendingDepositsCount} PENDING DEPOSITS</span>
            </button>
          )}
        </div>
      </div>

      {/* METRICS CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* Total Users */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>TOTAL PLAYERS</span>
            <Users size={18} color="#00f0ff" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            {stats.totalUsers}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px' }}>{stats.activeUsers} Active Accounts</div>
        </div>

        {/* Total Deposits & Pending */}
        <div className="glass-card-static" style={{ padding: '20px', border: stats.pendingDepositsCount > 0 ? '1px solid #ffb703' : '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>TOTAL DEPOSITS</span>
            <ArrowDownLeft size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            ₹{Number(stats.totalDeposits).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: stats.pendingDepositsCount > 0 ? '#ffb703' : '#94a3b8', fontWeight: 700, marginTop: '4px' }}>
            {stats.pendingDepositsCount} Pending (₹{Number(stats.pendingDepositsAmount).toLocaleString()})
          </div>
        </div>

        {/* Total Cashouts & Pending */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>TOTAL CASHOUTS</span>
            <ArrowUpRight size={18} color="#ffb703" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#cbd5e1', fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            ₹{Number(stats.totalCashouts).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#ffb703', fontWeight: 700, marginTop: '4px' }}>
            {stats.pendingCashoutsCount} Pending (₹{Number(stats.pendingCashoutsAmount).toLocaleString()})
          </div>
        </div>

        {/* Active Tournaments */}
        <div className="glass-card-static" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>ACTIVE TOURNAMENTS</span>
            <Trophy size={18} color="#ff5247" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            {stats.activeTournaments}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{stats.completedTournaments} Completed Matches</div>
        </div>

        {/* Platform Net Revenue */}
        <div className="glass-card-static" style={{ padding: '20px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffd700', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span>EST. NET REVENUE</span>
            <TrendingUp size={18} color="#ffd700" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffd700', fontFamily: 'var(--font-heading)', marginTop: '8px' }}>
            ₹{Number(stats.platformRevenue).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Entry fee margins & cashout fees</div>
        </div>
      </div>

      {/* TWO COLUMN: 7-DAY VOLUME & RECENT AUDIT LOGS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* FINANCIAL ACTIVITY 7-DAY SUMMARY */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff', marginBottom: '16px' }}>
            LAST 7 DAYS FINANCIAL VOLUME
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chartData.labels.map((dayLabel, idx) => (
              <div key={idx} style={{ background: '#090d15', padding: '10px 14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 700, color: '#cbd5e1' }}>{dayLabel}</span>
                <div style={{ display: 'flex', gap: '18px' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>+₹{Number(chartData.deposits[idx] || 0).toFixed(0)} Dep</span>
                  <span style={{ color: '#ffb703', fontWeight: 700 }}>-₹{Number(chartData.cashouts[idx] || 0).toFixed(0)} Out</span>
                  <span style={{ color: '#00f0ff' }}>{chartData.registrations[idx] || 0} Regs</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT AUDIT LOGS */}
        <div className="glass-card-static" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#fff' }}>
              RECENT AUDIT TRAIL
            </h2>
            <button onClick={() => onNavigateAdmin('audit_logs')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              View All
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
            {recentAudits.map(log => (
              <div key={log.id} style={{ background: '#090d15', padding: '10px 12px', borderRadius: '8px', borderLeft: '3px solid var(--accent-gold)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 800, color: '#f8fafc' }}>{log.action}</span>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{log.created_at?.slice(11, 19)}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  By <strong>{log.admin_username}</strong> on {log.entity_type} {log.entity_id ? `(${log.entity_id.slice(0, 8)})` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
