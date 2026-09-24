import React, { useState, useEffect } from 'react';
import apiRequest from '../../api/client.js';
import { ShieldAlert, Search, RefreshCw } from 'lucide-react';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/admin/audit-logs?limit=100');
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
            ADMIN AUDIT TRAIL & SYSTEM LOGS
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Complete immutable log of all administrator operations, approvals, balance adjustments, and logins.
          </p>
        </div>

        <button onClick={fetchLogs} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
          <RefreshCw size={14} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="glass-card-static" style={{ padding: '20px', overflowX: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>No audit records found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '12px 10px' }}>Timestamp</th>
                <th style={{ padding: '12px 10px' }}>Admin</th>
                <th style={{ padding: '12px 10px' }}>Action</th>
                <th style={{ padding: '12px 10px' }}>Entity Type</th>
                <th style={{ padding: '12px 10px' }}>Entity ID</th>
                <th style={{ padding: '12px 10px' }}>Details Payload</th>
                <th style={{ padding: '12px 10px' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1', whiteSpace: 'nowrap' }}>{l.created_at}</td>
                  <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--accent-gold)' }}>@{l.admin_username}</td>
                  <td style={{ padding: '12px 10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'rgba(255, 183, 3, 0.1)', color: '#ffd700', padding: '2px 8px', borderRadius: '4px' }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ padding: '12px 10px', color: '#cbd5e1' }}>{l.entity_type}</td>
                  <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#94a3b8' }}>{l.entity_id || '—'}</td>
                  <td style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.78rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.details_json}
                  </td>
                  <td style={{ padding: '12px 10px', color: '#64748b', fontSize: '0.78rem', fontFamily: 'monospace' }}>{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
