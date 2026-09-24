import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import apiRequest from '../api/client.js';
import { Bell, CheckCircle2, Trophy, Wallet, Crosshair, ArrowRight, CheckCheck } from 'lucide-react';

export default function Notifications({ onNavigate }) {
  const { user, openLogin } = useAuth();
  const { success } = useNotification();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await apiRequest('/notifications');
      setNotifications(data.notifications || []);
    } catch (e) {
      console.error('Notifications fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, [user]);

  const handleMarkAll = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      success('All notifications marked as read.');
    } catch (e) {}
  };

  const handleItemClick = async (notif) => {
    if (!notif.is_read) {
      try {
        await apiRequest(`/notifications/${notif.id}/read`, { method: 'PUT' });
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
      } catch (e) {}
    }
    if (notif.link) {
      if (notif.link.startsWith('/tournaments/')) {
        const tId = notif.link.replace('/tournaments/', '');
        onNavigate('tournament_detail', tId);
      } else if (notif.link === '/wallet') {
        onNavigate('wallet');
      } else if (notif.link === '/profile') {
        onNavigate('profile');
      } else if (notif.link === '/support') {
        onNavigate('support');
      }
    }
  };

  if (!user) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '40px 20px', textAlign: 'center' }} className="glass-card-static">
        <Bell size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
        <h2>PLEASE LOG IN</h2>
        <p style={{ color: '#94a3b8', margin: '12px 0 20px 0' }}>Log in to view your real-time tournament alerts and deposit updates.</p>
        <button onClick={openLogin} className="btn-primary">LOG IN</button>
      </div>
    );
  }

  const getNotifIcon = (type) => {
    switch (type) {
      case 'deposit': return <Wallet size={18} color="#10b981" />;
      case 'cashout': return <Wallet size={18} color="#ffb703" />;
      case 'tournament': return <Crosshair size={18} color="#ff5247" />;
      case 'prize': return <Trophy size={18} color="#ffd700" />;
      case 'match': return <Crosshair size={18} color="#00f0ff" />;
      default: return <Bell size={18} color="#94a3b8" />;
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
            ACTIVITY FEED
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
            NOTIFICATIONS CENTER
          </h1>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAll} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
            <CheckCheck size={16} />
            <span>Mark All Read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <Bell size={40} color="#64748b" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>No notifications yet</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>You will receive real-time alerts when rooms are released or deposits are approved.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              className="glass-card-static"
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                cursor: n.link ? 'pointer' : 'default',
                background: n.is_read ? '#0d121c' : 'rgba(255, 59, 48, 0.08)',
                border: n.is_read ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255, 59, 48, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px'
              }}
            >
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#090d15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {getNotifIcon(n.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: n.is_read ? '#f8fafc' : '#ffffff' }}>
                    {n.title}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{n.created_at}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                  {n.message}
                </p>
              </div>

              {n.link && (
                <div style={{ alignSelf: 'center' }}>
                  <ArrowRight size={16} color="#64748b" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
