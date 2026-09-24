import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import apiRequest from '../api/client.js';
import {
  Trophy, Wallet, User, Bell, Shield, LogOut, Swords, Target, Crosshair,
  FileText, HelpCircle, ChevronDown, Flame, Home as HomeIcon, MessageCircle
} from 'lucide-react';

export default function Navbar({ currentRoute, onNavigate }) {
  const { user, isAdmin, openLogin, openSignup, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const fetchNotifs = async () => {
    if (!user) return;
    try {
      const data = await apiRequest('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (e) {}
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'tournaments', label: 'Tournaments' },
    { id: 'battle_royale', label: 'Battle Royale', icon: Crosshair },
    { id: 'clash_squad', label: 'Clash Squad', icon: Swords },
    { id: 'lone_wolf', label: 'Lone Wolf', icon: Target },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'contact', label: 'Contact', icon: MessageCircle, external: 'https://www.instagram.com/__whois.magesh/?utm_source=ig_web_button_share_sheet' },
  ];

  return (
    <>
      {/* DESKTOP TOP HEADER */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 14, 23, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', height: '68px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          
          {/* LEFT: LOGO */}
          <div 
            onClick={() => onNavigate('home')} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
          >
            <img src="/ignite-logo.png" alt="IGNITE ESPORTS" style={{ height: '42px', width: 'auto', objectFit: 'contain' }} />
          </div>

          {/* CENTER: NAVIGATION LINKS */}
          <nav style={{ display: 'none', gap: '4px', alignItems: 'center' }} className="desktop-nav">
            {navItems.map(item => {
              const isActive = currentRoute === item.id;
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.external) {
                      window.open(item.external, '_blank', 'noopener,noreferrer');
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                    color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: isActive ? 700 : 600,
                    padding: '8px 12px',
                    borderRadius: '0',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '0.9rem',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px -2px var(--primary-glow)' : 'none'
                  }}
                >
                  {IconComp && <IconComp size={15} color={isActive ? 'var(--primary)' : 'var(--text-dim)'} />}
                  <span>{item.label.toUpperCase()}</span>
                </button>
              );
            })}
          </nav>

          {/* RIGHT: USER ACTIONS / CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            
            {/* CTA BUTTON */}
            <button
              onClick={() => onNavigate('tournaments')}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
            >
              JOIN TOURNAMENT
            </button>

            {user ? (
              <>
                {/* WALLET BUTTON */}
                <div 
                  onClick={() => onNavigate('wallet')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'rgba(0, 229, 255, 0.08)',
                    border: '1px solid var(--border-cyan)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Wallet size={16} color="var(--secondary)" />
                  <span className="font-hud" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    ₹{user.wallet_balance ? Number(user.wallet_balance).toFixed(2) : '0.00'}
                  </span>
                </div>

                {/* NOTIFICATIONS BELL */}
                <div style={{ position: 'relative' }} ref={notifRef}>
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="font-hud" style={{
                        position: 'absolute',
                        top: '-3px',
                        right: '-3px',
                        background: 'var(--primary)',
                        color: '#fff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {isNotifOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '46px',
                      width: '320px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
                      padding: '12px',
                      zIndex: 100
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '8px' }}>
                        <span className="font-heading" style={{ fontSize: '0.85rem' }}>NOTIFICATIONS</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                            No notifications
                          </div>
                        ) : (
                          notifications.slice(0, 6).map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setIsNotifOpen(false);
                                onNavigate('notifications');
                              }}
                              style={{
                                padding: '8px 10px',
                                borderRadius: 'var(--radius-sm)',
                                marginBottom: '6px',
                                background: n.is_read ? 'transparent' : 'rgba(255, 77, 0, 0.08)',
                                borderLeft: n.is_read ? '2px solid transparent' : '2px solid var(--primary)',
                                cursor: 'pointer'
                              }}
                            >
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{n.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{n.message}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* USER PROFILE AVATAR */}
                <div style={{ position: 'relative' }} ref={profileRef}>
                  <div
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      background: 'var(--bg-surface)',
                      padding: '4px 8px 4px 4px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <img
                      src={user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                      alt={user.username}
                      style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <span className="font-hud" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'none' }} className="username-text">
                      {user.in_game_name || user.username}
                    </span>
                    <ChevronDown size={14} color="var(--text-muted)" />
                  </div>

                  {/* Profile Dropdown */}
                  {isProfileOpen && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '44px',
                      width: '230px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.8)',
                      padding: '8px',
                      zIndex: 100
                    }}>
                      <div style={{ padding: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '6px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{user.name}</div>
                        <div className="font-hud" style={{ fontSize: '0.72rem', color: 'var(--secondary)', marginTop: '2px' }}>UID: {user.free_fire_uid || 'N/A'}</div>
                      </div>

                      <button
                        onClick={() => { setIsProfileOpen(false); onNavigate('profile'); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        <User size={15} /> My Profile
                      </button>

                      <button
                        onClick={() => { setIsProfileOpen(false); onNavigate('my_tournaments'); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        <Trophy size={15} /> My Tournaments
                      </button>

                      <button
                        onClick={() => { setIsProfileOpen(false); onNavigate('wallet'); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        <Wallet size={15} /> Wallet
                      </button>

                      <button
                        onClick={() => { setIsProfileOpen(false); onNavigate('transactions'); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                      >
                        <FileText size={15} /> Transactions
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => { setIsProfileOpen(false); onNavigate('admin_dashboard'); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(255, 77, 0, 0.12)', border: '1px solid var(--border-orange)', color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', cursor: 'pointer', marginTop: '4px' }}
                        >
                          <Shield size={15} /> ADMIN DASHBOARD
                        </button>
                      )}

                      <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '4px', paddingTop: '4px' }}>
                        <button
                          onClick={() => { setIsProfileOpen(false); logout(); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'transparent', border: 'none', color: 'var(--danger-red)', fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                        >
                          <LogOut size={15} /> Log Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={openLogin}
                  className="btn-ghost"
                  style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                >
                  LOG IN
                </button>
                <button
                  type="button"
                  onClick={openSignup}
                  className="btn-primary"
                  style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                >
                  SIGN UP
                </button>
              </div>
            )}

            {/* ADMIN ACCESS PORTAL PILL */}
            <button
              onClick={() => onNavigate('admin_login')}
              style={{
                background: 'rgba(255, 197, 61, 0.08)',
                border: '1px solid var(--border-gold)',
                color: 'var(--prize-gold)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Admin Portal"
            >
              <Shield size={13} /> ADMIN
            </button>

          </div>
        </div>
      </header>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR */}
      <div className="mobile-bottom-nav">
        <button
          onClick={() => onNavigate('home')}
          style={{ background: 'transparent', border: 'none', color: currentRoute === 'home' ? 'var(--primary)' : 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: 'pointer' }}
        >
          <HomeIcon size={18} />
          <span>HOME</span>
        </button>

        <button
          onClick={() => onNavigate('tournaments')}
          style={{ background: 'transparent', border: 'none', color: currentRoute === 'tournaments' || currentRoute === 'battle_royale' ? 'var(--primary)' : 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: 'pointer' }}
        >
          <Trophy size={18} />
          <span>TOURNAMENTS</span>
        </button>

        <button
          onClick={() => onNavigate('wallet')}
          style={{ background: 'transparent', border: 'none', color: currentRoute === 'wallet' ? 'var(--primary)' : 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: 'pointer' }}
        >
          <Wallet size={18} />
          <span>WALLET</span>
        </button>

        <button
          onClick={() => onNavigate('leaderboard')}
          style={{ background: 'transparent', border: 'none', color: currentRoute === 'leaderboard' ? 'var(--primary)' : 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: 'pointer' }}
        >
          <Trophy size={18} color={currentRoute === 'leaderboard' ? 'var(--prize-gold)' : 'var(--text-dim)'} />
          <span>LEADERBOARD</span>
        </button>

        <button
          onClick={() => user ? onNavigate('profile') : openLogin()}
          style={{ background: 'transparent', border: 'none', color: currentRoute === 'profile' ? 'var(--primary)' : 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: 'pointer' }}
        >
          <User size={18} />
          <span>PROFILE</span>
        </button>

        <button
          onClick={() => window.open('https://www.instagram.com/__whois.magesh/?utm_source=ig_web_button_share_sheet', '_blank', 'noopener,noreferrer')}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', fontSize: '0.68rem', fontFamily: 'var(--font-heading)', fontWeight: 700, cursor: 'pointer' }}
        >
          <MessageCircle size={18} />
          <span>CONTACT</span>
        </button>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav {
            display: flex !important;
          }
          .username-text {
            display: inline !important;
          }
        }
      `}</style>
    </>
  );
}
