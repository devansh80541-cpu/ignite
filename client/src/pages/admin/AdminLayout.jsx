import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard, Users, Trophy, Swords, ArrowDownLeft, ArrowUpRight,
  FileText, Award, HelpCircle, Bell, Settings, ShieldAlert, LogOut,
  Flame, ExternalLink, Menu, X
} from 'lucide-react';

export default function AdminLayout({ activePage, onNavigateAdmin, onBackToPlayer, children }) {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { key: 'users', label: 'Users', icon: <Users size={18} /> },
    { key: 'tournaments', label: 'Tournaments', icon: <Trophy size={18} /> },
    { key: 'matches', label: 'Matches', icon: <Swords size={18} /> },
    { key: 'deposits', label: 'Deposits', icon: <ArrowDownLeft size={18} /> },
    { key: 'cashouts', label: 'Cashouts', icon: <ArrowUpRight size={18} /> },
    { key: 'transactions', label: 'Transactions', icon: <FileText size={18} /> },
    { key: 'leaderboard', label: 'Leaderboard', icon: <Award size={18} /> },
    { key: 'results', label: 'Results', icon: <Award size={18} /> },
    { key: 'support', label: 'Support', icon: <HelpCircle size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { key: 'audit_logs', label: 'Audit Logs', icon: <ShieldAlert size={18} /> }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#07090e' }}>
      
      {/* ADMIN SIDEBAR */}
      <aside style={{
        width: '260px',
        background: '#0a0e17',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50
      }}>
        
        {/* LOGO */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center' }}>
          <img src="/ignite-logo.png" alt="Ignite Admin" style={{ height: '36px', objectFit: 'contain' }} />
        </div>

        {/* NAVIGATION LIST */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map(item => {
            const isActive = activePage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigateAdmin(item.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, rgba(255, 183, 3, 0.2), rgba(255, 59, 48, 0.15))' : 'transparent',
                  color: isActive ? '#ffd700' : '#cbd5e1',
                  fontWeight: isActive ? 800 : 500,
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-heading)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderLeft: isActive ? '3px solid #ffb703' : '3px solid transparent',
                  transition: 'all 0.15s'
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* BOTTOM UTILITY LINKS */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={onBackToPlayer}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ExternalLink size={15} />
            <span>Player Website</span>
          </button>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            <span>Admin Logout</span>
          </button>
        </div>

      </aside>

      {/* MAIN ADMIN CONTENT AREA */}
      <main style={{ flex: 1, overflowX: 'hidden', padding: '30px', minHeight: '100vh' }}>
        {children}
      </main>

    </div>
  );
}
