import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext.jsx';
import apiRequest from '../../api/client.js';
import { Settings, Save, Lock, ShieldCheck, DollarSign, Globe, KeyRound } from 'lucide-react';

export default function AdminSettings() {
  const { success, error } = useNotification();

  const [settings, setSettings] = useState({
    platform_name: 'IGNITE FREE FIRE ESPORTS',
    currency_symbol: '₹',
    contact_email: 'support@ignite-esports.gg',
    support_phone: '+91 8000-FF-PRO',
    upi_id: 'esportsignite@okaxis',
    upi_qr_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=esportsignite@okaxis&pn=IgniteEsports&cu=INR',
    min_deposit: '50',
    max_deposit: '10000',
    min_cashout: '100',
    cashout_fee_percent: '2',
    is_real_money_enabled: 'true'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Admin Master Password Change
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await apiRequest('/admin/settings');
        if (res.settings) {
          setSettings(prev => ({ ...prev, ...res.settings }));
        }
      } catch (err) {
        error(err.message, 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings })
      });
      success(res.message, 'Settings Updated');
    } catch (err) {
      error(err.message, 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAdminPasswordChange = async (e) => {
    e.preventDefault();
    if (!newAdminPassword || newAdminPassword.length < 6) {
      error('New password must be at least 6 characters.');
      return;
    }
    try {
      setChangingPass(true);
      const res = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword: newAdminPassword })
      });
      success(res.message, 'Admin Password Changed');
      setNewAdminPassword('');
    } catch (err) {
      error(err.message, 'Password Update Failed');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, fontFamily: 'var(--font-heading)', color: '#ffffff' }}>
          PLATFORM CONFIGURATION & PAYMENT GATEWAY
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Configure live UPI deposit addresses, minimum withdrawal limits, fee schedules, and master admin security.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* PAYMENT & FINANCIAL CONFIG */}
        <div className="glass-card-static" style={{ padding: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <DollarSign size={22} color="var(--primary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
              PAYMENT & WALLET PARAMETERS
            </h2>
          </div>

          <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Active UPI ID (Receiver) *
                </label>
                <input
                  type="text"
                  value={settings.upi_id}
                  onChange={(e) => handleChange('upi_id', e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  UPI QR Code Image URL *
                </label>
                <input
                  type="text"
                  value={settings.upi_qr_url}
                  onChange={(e) => handleChange('upi_qr_url', e.target.value)}
                  className="input-dark"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Min Deposit (₹)
                </label>
                <input
                  type="number"
                  value={settings.min_deposit}
                  onChange={(e) => handleChange('min_deposit', e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Max Deposit (₹)
                </label>
                <input
                  type="number"
                  value={settings.max_deposit}
                  onChange={(e) => handleChange('max_deposit', e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Min Cashout (₹)
                </label>
                <input
                  type="number"
                  value={settings.min_cashout}
                  onChange={(e) => handleChange('min_cashout', e.target.value)}
                  className="input-dark"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Cashout Fee (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.cashout_fee_percent}
                  onChange={(e) => handleChange('cashout_fee_percent', e.target.value)}
                  className="input-dark"
                  required
                />
              </div>
            </div>

            {/* Platform Branding */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Platform Name
                </label>
                <input
                  type="text"
                  value={settings.platform_name}
                  onChange={(e) => handleChange('platform_name', e.target.value)}
                  className="input-dark"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Support Email
                </label>
                <input
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="input-dark"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                  Real Money Features
                </label>
                <select
                  value={settings.is_real_money_enabled}
                  onChange={(e) => handleChange('is_real_money_enabled', e.target.value)}
                  className="input-dark"
                >
                  <option value="true">Enabled (Real Cash Tournaments & UPI Payouts)</option>
                  <option value="false">Disabled (Free to Play Coins Mode)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ alignSelf: 'flex-start', padding: '12px 28px', marginTop: '10px' }}
            >
              <Save size={16} />
              <span>{saving ? 'Saving...' : 'SAVE CONFIGURATION'}</span>
            </button>
          </form>
        </div>

        {/* ADMIN SECURITY / CHANGE MASTER PASSWORD */}
        <div className="glass-card-static" style={{ padding: '30px', border: '1px solid rgba(255, 183, 3, 0.4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <KeyRound size={22} color="var(--accent-gold)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff' }}>
              CHANGE MASTER ADMIN PASSWORD
            </h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '18px' }}>
            Ensure you update the default password (<code>CHANGE_THIS_ADMIN_PASSWORD</code>) to secure your production database.
          </p>

          <form onSubmit={handleAdminPasswordChange} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', fontWeight: 600 }}>
                New Master Admin Password *
              </label>
              <input
                type="password"
                placeholder="Minimum 6 strong characters"
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                className="input-dark"
                required
              />
            </div>

            <button
              type="submit"
              disabled={changingPass}
              className="btn-gold"
              style={{ padding: '12px', width: '100%' }}
            >
              {changingPass ? 'Updating...' : 'UPDATE ADMIN MASTER PASSWORD'}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
