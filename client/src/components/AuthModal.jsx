import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import { Lock, Mail, X } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab, login, signup } = useAuth();
  const { success, error } = useNotification();

  const [loading, setLoading] = useState(false);
  
  // Login fields
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Signup fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [inGameName, setInGameName] = useState('');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      error('Please enter your username/email and password.');
      return;
    }
    try {
      setLoading(true);
      await login(identifier, password);
      success('Logged in successfully! Welcome back.');
    } catch (err) {
      error(err.message, 'Login Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !email || !signupPassword) {
      error('Please fill in all required fields.');
      return;
    }
    try {
      setLoading(true);
      await signup({
        name,
        username,
        email,
        password: signupPassword,
        phone,
        free_fire_uid: freeFireUid,
        in_game_name: inGameName
      });
      success('Account created! Welcome to IGNITE ESPORTS.');
    } catch (err) {
      error(err.message, 'Signup Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={closeAuthModal}>
      <div 
        className="glass-panel" 
        style={{ width: '100%', maxWidth: '440px', padding: '28px', position: 'relative' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeAuthModal}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-dark)', padding: '4px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setAuthModalTab('login')}
            className="font-heading"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: authModalTab === 'login' ? 'var(--primary)' : 'transparent',
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          >
            LOGIN
          </button>
          <button
            type="button"
            onClick={() => setAuthModalTab('signup')}
            className="font-heading"
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              background: authModalTab === 'signup' ? 'var(--primary)' : 'transparent',
              color: 'var(--text-main)',
              fontSize: '0.85rem'
            }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {authModalTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                USERNAME OR EMAIL
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-dark font-hud"
                  placeholder="Username or Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  required
                />
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                PASSWORD
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="input-dark font-hud"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '36px' }}
                  required
                />
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '6px', padding: '10px' }}
            >
              {loading ? 'AUTHENTICATING...' : 'ENTER ARENA'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>FULL NAME *</label>
                <input
                  type="text"
                  className="input-dark"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>USERNAME *</label>
                <input
                  type="text"
                  className="input-dark font-hud"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>EMAIL ADDRESS *</label>
              <input
                type="email"
                className="input-dark font-hud"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PASSWORD *</label>
              <input
                type="password"
                className="input-dark font-hud"
                placeholder="Min 6 chars"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>FREE FIRE UID</label>
                <input
                  type="text"
                  className="input-dark font-hud"
                  placeholder="FF UID"
                  value={freeFireUid}
                  onChange={(e) => setFreeFireUid(e.target.value)}
                />
              </div>
              <div>
                <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>IGN</label>
                <input
                  type="text"
                  className="input-dark font-hud"
                  placeholder="In-Game Name"
                  value={inGameName}
                  onChange={(e) => setInGameName(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '6px', padding: '10px' }}
            >
              {loading ? 'REGISTERING...' : 'CREATE ACCOUNT'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
