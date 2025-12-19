import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Stats from './pages/Stats';
import Rules from './pages/Rules';
import Admin from './pages/Admin';
import { User, WatchlistItem, TradeSignal } from './types';
import { MOCK_WATCHLIST, MOCK_SIGNALS } from './constants';

const SESSION_DURATION_MS = 6.5 * 60 * 60 * 1000;
const SESSION_KEY = 'libra_user_session';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      try {
        const { user, timestamp } = JSON.parse(savedSession);
        if (Date.now() - timestamp < SESSION_DURATION_MS) return user;
        localStorage.removeItem(SESSION_KEY);
      } catch (e) { console.error(e); }
    }
    return null;
  });

  const [page, setPage] = useState('dashboard');
  
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('libra_watchlist');
    return saved ? JSON.parse(saved) : MOCK_WATCHLIST;
  });

  const [signals, setSignals] = useState<TradeSignal[]>(() => {
    const saved = localStorage.getItem('libra_signals');
    return saved ? JSON.parse(saved) : MOCK_SIGNALS;
  });

  // REAL-TIME SYNC ENGINE (Simulated Backend via LocalStorage Events)
  const syncData = useCallback(() => {
    const latestWatch = localStorage.getItem('libra_watchlist');
    const latestSignals = localStorage.getItem('libra_signals');
    if (latestWatch) setWatchlist(JSON.parse(latestWatch));
    if (latestSignals) setSignals(JSON.parse(latestSignals));
  }, []);

  useEffect(() => {
    // 1. Listen for cross-tab updates (Instant)
    window.addEventListener('storage', (e) => {
      if (e.key === 'libra_watchlist' || e.key === 'libra_signals') {
        syncData();
      }
    });

    // 2. High-frequency polling fallback (Every 2 seconds) for smoother experience
    const pollInterval = setInterval(syncData, 2000);

    return () => {
      window.removeEventListener('storage', syncData);
      clearInterval(pollInterval);
    };
  }, [syncData]);

  // Persist local changes from Admin
  useEffect(() => {
    localStorage.setItem('libra_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('libra_signals', JSON.stringify(signals));
  }, [signals]);

  const handleLogin = (newUser: User) => {
    const session = { user: newUser, timestamp: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(newUser);
    syncData(); // Immediate handshake on login
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  if (!user) return <Login onLogin={handleLogin} />;

  const renderPage = () => {
    switch(page) {
        case 'dashboard': return <Dashboard watchlist={watchlist} signals={signals} />;
        case 'stats': return <Stats />;
        case 'rules': return <Rules />;
        case 'admin': 
            return user.isAdmin ? (
                <Admin 
                    watchlist={watchlist} 
                    onUpdateWatchlist={setWatchlist}
                    signals={signals}
                    onUpdateSignals={setSignals}
                />
            ) : <Dashboard watchlist={watchlist} signals={signals} />;
        default: return <Dashboard watchlist={watchlist} signals={signals} />;
    }
  };

  return (
    <Layout 
        user={user} 
        onLogout={handleLogout}
        currentPage={page}
        onNavigate={setPage}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;