import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Stats from './pages/Stats';
import Rules from './pages/Rules';
import Admin from './pages/Admin';
import { User, WatchlistItem, TradeSignal } from './types';
import { MOCK_WATCHLIST, MOCK_SIGNALS } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  
  // Initialize Watchlist from LocalStorage or Fallback to Mock
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    const saved = localStorage.getItem('libra_watchlist');
    return saved ? JSON.parse(saved) : MOCK_WATCHLIST;
  });

  // Initialize Signals from LocalStorage or Fallback to Mock
  const [signals, setSignals] = useState<TradeSignal[]>(() => {
    const saved = localStorage.getItem('libra_signals');
    return saved ? JSON.parse(saved) : MOCK_SIGNALS;
  });

  // Persist Watchlist changes
  useEffect(() => {
    localStorage.setItem('libra_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  // Persist Signal changes
  useEffect(() => {
    localStorage.setItem('libra_signals', JSON.stringify(signals));
  }, [signals]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  const renderPage = () => {
    switch(page) {
        case 'dashboard': return <Dashboard watchlist={watchlist} signals={signals} />;
        case 'stats': return <Stats />;
        case 'rules': return <Rules />;
        case 'admin': 
            if (user.isAdmin) {
                return (
                    <Admin 
                        watchlist={watchlist} 
                        onUpdateWatchlist={setWatchlist}
                        signals={signals}
                        onUpdateSignals={setSignals}
                    />
                );
            } else {
                return <div className="text-center text-red-400 mt-20 font-mono">ACCESS DENIED: ADMIN ONLY</div>;
            }
        default: return <Dashboard watchlist={watchlist} signals={signals} />;
    }
  };

  return (
    <Layout 
        user={user} 
        onLogout={() => setUser(null)}
        currentPage={page}
        onNavigate={setPage}
    >
      {renderPage()}
    </Layout>
  );
};

export default App;