import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import apiRequest from '../api/client.js';
import { User, Edit2, Lock, Save } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, openLogin } = useAuth();
  const { success, error } = useNotification();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [freeFireUid, setFreeFireUid] = useState('');
  const [inGameName, setInGameName] = useState('');
  const [avatar, setAvatar] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setFreeFireUid(user.free_fire_uid || '');
      setInGameName(user.in_game_name || '');
      setAvatar(user.avatar || '');
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ maxWidth: '550px', margin: '60px auto', padding: '40px 20px', textAlign: 'center' }} className="tactical-card">
        <User size={44} color="var(--primary)" style={{ margin: '0 auto 14px auto' }} />
        <h2 className="font-heading" style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '8px' }}>
          AUTHENTICATION REQUIRED
        </h2>
        <p className="font-body" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
          Log in to view and edit your esports career profile and statistics.
        </p>
        <button onClick={openLogin} className="btn-primary">LOG IN</button>
      </div>
    );
  }

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateProfile({ name, phone, free_fire_uid: freeFireUid, in_game_name: inGameName, avatar });
      success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      error(err.message, 'Update Failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    try {
      await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setIsChangingPass(false);
    } catch (err) {
      error(err.message, 'Password Change Failed');
    }
  };

  const winRate = user.total_matches > 0 ? ((user.total_wins / user.total_matches) * 100).toFixed(1) : '0.0';

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '30px 20px 80px 20px' }}>
      
      {/* 24. PROFILE SUMMARY (GLASSMORPHIC HEADER) */}
      <div className="glass-panel" style={{ padding: '30px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
            <img
              src={avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
              alt={user.username}
              style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', border: '2px solid var(--primary)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 className="font-heading" style={{ fontSize: '1.6rem', color: 'var(--text-main)' }}>
                  {user.name}
                </h1>
                <span className="badge-open" style={{ fontSize: '0.68rem' }}>{user.role}</span>
              </div>
              <div className="font-hud" style={{ fontSize: '0.88rem', color: 'var(--secondary)', marginTop: '2px' }}>
                IGN: {user.in_game_name || user.username}
              </div>
              <div className="font-hud" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                FF UID: <span style={{ color: 'var(--text-main)' }}>{user.free_fire_uid || 'N/A'}</span> • JOINED: {user.created_at?.slice(0, 10)}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Edit2 size={15} />
            <span>{isEditing ? 'CANCEL EDIT' : 'EDIT PROFILE'}</span>
          </button>

        </div>
      </div>

      {/* TACTICAL STAT CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '30px'
      }}>
        <div className="tactical-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>MATCHES</div>
          <div className="font-hud" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {user.total_matches || 0}
          </div>
        </div>

        <div className="tactical-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--secondary)' }}>WINS</div>
          <div className="font-hud" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--secondary)', marginTop: '4px' }}>
            {user.total_wins || 0}
          </div>
        </div>

        <div className="tactical-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>WIN RATE</div>
          <div className="font-hud" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
            {winRate}%
          </div>
        </div>

        <div className="tactical-card" style={{ padding: '18px', textAlign: 'center' }}>
          <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>KILLS</div>
          <div className="font-hud" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
            {user.total_kills || 0}
          </div>
        </div>

        <div className="tactical-card" style={{ padding: '18px', textAlign: 'center', borderColor: 'var(--border-gold)' }}>
          <div className="font-heading" style={{ fontSize: '0.72rem', color: 'var(--prize-gold)' }}>EARNINGS</div>
          <div className="font-hud" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--prize-gold)', marginTop: '4px' }}>
            ₹{Number(user.total_earnings || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* EDIT FORM */}
      {isEditing && (
        <div className="tactical-card" style={{ padding: '24px', marginBottom: '30px' }}>
          <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '16px' }}>
            EDIT PLAYER PROFILE
          </h3>
          <form onSubmit={handleProfileSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>FULL NAME</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark" required />
            </div>
            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>IN-GAME NAME (IGN)</label>
              <input type="text" value={inGameName} onChange={(e) => setInGameName(e.target.value)} className="input-dark" required />
            </div>
            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>FREE FIRE UID</label>
              <input type="text" value={freeFireUid} onChange={(e) => setFreeFireUid(e.target.value)} className="input-dark" required />
            </div>
            <div>
              <label className="font-heading" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>PHONE</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-dark" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                <Save size={15} /> SAVE CHANGES
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECURITY */}
      <div className="tactical-card" style={{ padding: '24px' }}>
        <h3 className="font-heading" style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '14px' }}>
          SECURITY
        </h3>
        {!isChangingPass ? (
          <button onClick={() => setIsChangingPass(true)} className="btn-ghost" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Lock size={15} /> CHANGE PASSWORD
          </button>
        ) : (
          <form onSubmit={handleChangePassword} style={{ maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input-dark" required />
            <input type="password" placeholder="New Password (min 6 chars)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-dark" required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>UPDATE PASSWORD</button>
              <button type="button" onClick={() => setIsChangingPass(false)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>CANCEL</button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
}
