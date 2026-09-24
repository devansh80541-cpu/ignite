import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';
import { Shield, Lock, User, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AdminLogin({ onLoginSuccess, onBackToPlayer }) {
  const { adminLogin } = useAuth();
  const { success, error, warning } = useNotification();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      error('Please enter admin username and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await adminLogin(username, password);
      success('Administrator session established.', 'Welcome Admin');
      if (res.mustChangePassword) {
        warning('Please change your default admin password in Admin Settings.', 'Security Notice');
      }
      onLoginSuccess();
    } catch (err) {
      error(err.message, 'Admin Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillDefault = () => {
    setUsername('admin');
    setPassword('CHANGE_THIS_ADMIN_PASSWORD');
  };

  return (
    <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      <div className="glass-card-static" style={{
        maxWidth: '440px',
        width: '100%',
        padding: '36px 30px',
        borderRadius: '20px',
        border: '1px solid rgba(255, 183, 3, 0.4)',
        background: 'linear-gradient(180deg, rgba(13, 18, 28, 0.95) 0%, #07090e 100%)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255, 183, 3, 0.15)'
      }}>
        
        {/* BACK TO PLAYER SITE BUTTON */}
        <button
          onClick={onBackToPlayer}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginBottom: '20px' }}
        >
          <ArrowLeft size={14} />
          <span>Back to Player Site</span>
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 25px rgba(255, 183, 3, 0.4)'
          }}>
            <Shield size={32} color="#07090e" />
          </div>

          <div style={{ fontSize: '0.78rem', color: '#ffb703', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>
            RESTRICTED ACCESS
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff', marginTop: '4px' }}>
            ADMINISTRATOR PORTAL
          </h1>
        </div>

        {/* DEFAULT CREDENTIALS HELPER BANNER */}
        <div style={{
          background: 'rgba(255, 183, 3, 0.08)',
          border: '1px solid rgba(255, 183, 3, 0.25)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '22px',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#fbbf24', fontWeight: 700 }}>Default Admin Auth:</div>
            <button
              type="button"
              onClick={handlePrefillDefault}
              style={{ background: 'rgba(255, 183, 3, 0.2)', border: '1px solid rgba(255, 183, 3, 0.4)', color: '#ffd700', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Auto-Fill
            </button>
          </div>
          <div style={{ color: '#cbd5e1', marginTop: '4px', fontFamily: 'monospace' }}>
            User: <strong>admin</strong> | Pass: <strong>CHANGE_THIS_ADMIN_PASSWORD</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Admin Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-dark"
                placeholder="admin"
                style={{ paddingLeft: '38px' }}
                required
              />
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Admin Master Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark"
                placeholder="••••••••••••"
                style={{ paddingLeft: '38px' }}
                required
              />
              <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold"
            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
          >
            {loading ? 'Authenticating...' : 'AUTHENTICATE & ENTER'}
          </button>
        </form>

      </div>

    </div>
  );
}
