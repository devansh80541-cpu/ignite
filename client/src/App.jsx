import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import AuthModal from './components/AuthModal.jsx';

// Player Pages
import Home from './pages/Home.jsx';
import Tournaments from './pages/Tournaments.jsx';
import BattleRoyale from './pages/BattleRoyale.jsx';
import ClashSquad from './pages/ClashSquad.jsx';
import LoneWolf from './pages/LoneWolf.jsx';
import TournamentDetail from './pages/TournamentDetail.jsx';
import MyTournaments from './pages/MyTournaments.jsx';
import Wallet from './pages/Wallet.jsx';
import Transactions from './pages/Transactions.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Profile from './pages/Profile.jsx';
import Notifications from './pages/Notifications.jsx';
import Support from './pages/Support.jsx';
import RulesFairPlay from './pages/RulesFairPlay.jsx';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminDeposits from './pages/admin/AdminDeposits.jsx';
import AdminCashouts from './pages/admin/AdminCashouts.jsx';
import AdminTournaments from './pages/admin/AdminTournaments.jsx';
import AdminMatches from './pages/admin/AdminMatches.jsx';
import AdminTransactions from './pages/admin/AdminTransactions.jsx';
import AdminSupport from './pages/admin/AdminSupport.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';

function MainApp() {
  const { user, isAdmin, loading } = useAuth();
  const [currentRoute, setCurrentRoute] = useState('home');
  const [selectedTournamentId, setSelectedTournamentId] = useState(null);
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard');

  // Handle URL Hash or Path Sync
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/admin/login') {
        setCurrentRoute('admin_login');
      } else if (path.startsWith('/admin')) {
        setCurrentRoute('admin_dashboard');
      }
    };
    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route, param = null) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (param) {
      setSelectedTournamentId(param);
    }
    setCurrentRoute(route);
  };

  const handleSelectTournament = (id) => {
    setSelectedTournamentId(id);
    setCurrentRoute('tournament_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If loading session
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#07090e', color: '#ff3b30', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>
        LOADING IGNITE ESPORTS...
      </div>
    );
  }

  // ADMIN EXPERIENCE
  if (currentRoute === 'admin_login') {
    return (
      <AdminLogin
        onLoginSuccess={() => navigate('admin_dashboard')}
        onBackToPlayer={() => navigate('home')}
      />
    );
  }

  if (currentRoute === 'admin_dashboard' || currentRoute.startsWith('admin_')) {
    if (!isAdmin) {
      return (
        <AdminLogin
          onLoginSuccess={() => navigate('admin_dashboard')}
          onBackToPlayer={() => navigate('home')}
        />
      );
    }

    return (
      <AdminLayout
        activePage={adminActiveTab}
        onNavigateAdmin={(tab) => setAdminActiveTab(tab)}
        onBackToPlayer={() => navigate('home')}
      >
        {adminActiveTab === 'dashboard' && <AdminDashboard onNavigateAdmin={(tab) => setAdminActiveTab(tab)} />}
        {adminActiveTab === 'users' && <AdminUsers />}
        {adminActiveTab === 'deposits' && <AdminDeposits />}
        {adminActiveTab === 'cashouts' && <AdminCashouts />}
        {adminActiveTab === 'tournaments' && <AdminTournaments />}
        {adminActiveTab === 'matches' && <AdminMatches />}
        {adminActiveTab === 'results' && <AdminMatches />}
        {adminActiveTab === 'transactions' && <AdminTransactions />}
        {adminActiveTab === 'leaderboard' && <Leaderboard />}
        {adminActiveTab === 'support' && <AdminSupport />}
        {adminActiveTab === 'notifications' && <Notifications onNavigate={navigate} />}
        {adminActiveTab === 'settings' && <AdminSettings />}
        {adminActiveTab === 'audit_logs' && <AdminAuditLogs />}
      </AdminLayout>
    );
  }

  // PLAYER EXPERIENCE
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar currentRoute={currentRoute} onNavigate={navigate} />

      <main style={{ flex: 1 }}>
        {currentRoute === 'home' && (
          <Home
            onNavigate={navigate}
            onSelectTournament={handleSelectTournament}
          />
        )}

        {currentRoute === 'tournaments' && (
          <Tournaments
            onSelectTournament={handleSelectTournament}
          />
        )}

        {currentRoute === 'battle_royale' && (
          <BattleRoyale
            onSelectTournament={handleSelectTournament}
          />
        )}

        {currentRoute === 'clash_squad' && (
          <ClashSquad
            onSelectTournament={handleSelectTournament}
          />
        )}

        {currentRoute === 'lone_wolf' && (
          <LoneWolf
            onSelectTournament={handleSelectTournament}
          />
        )}

        {currentRoute === 'tournament_detail' && (
          <TournamentDetail
            tournamentId={selectedTournamentId || 'tourn-br-01'}
            onBack={() => navigate('tournaments')}
            onNavigate={navigate}
          />
        )}

        {currentRoute === 'my_tournaments' && (
          <MyTournaments
            onSelectTournament={handleSelectTournament}
            onNavigate={navigate}
          />
        )}

        {currentRoute === 'wallet' && (
          <Wallet onNavigate={navigate} />
        )}

        {currentRoute === 'transactions' && (
          <Transactions />
        )}

        {currentRoute === 'leaderboard' && (
          <Leaderboard />
        )}

        {currentRoute === 'profile' && (
          <Profile />
        )}

        {currentRoute === 'notifications' && (
          <Notifications onNavigate={navigate} />
        )}

        {currentRoute === 'support' && (
          <Support />
        )}

        {currentRoute === 'rules_fairplay' && (
          <RulesFairPlay />
        )}
      </main>

      <Footer onNavigate={navigate} />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </NotificationProvider>
  );
}
