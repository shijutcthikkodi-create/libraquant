import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Stats from './pages/Stats';
import Rules from './pages/Rules';
import Admin from './pages/Admin';
import { User, WatchlistItem, TradeSignal } from './types';
import { fetchSheetData } from './services/googleSheetsService';
import { MOCK_WATCHLIST, MOCK_SIGNALS } from './constants';
import { WifiOff, RefreshCw, ExternalLink, ShieldAlert, AlertCircle } from 'lucide-react';

const SESSION_DURATION_MS = 6.5 * 60 * 60 * 1000;
const SESSION_KEY = 'libra_user_session';
const POLL_INTERVAL = 10000; 

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
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(MOCK_WATCHLIST);
  const [signals, setSignals] = useState<TradeSignal[]>(MOCK_SIGNALS);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'syncing'>('connected');

  const syncFromSheets = useCallback(async () => {
    setIsSyncing(true);
    setConnectionStatus('syncing');
    try {
        const remoteData = await fetchSheetData();
        if (remoteData) {
          setSignals(remoteData.signals);
          setWatchlist(remoteData.watchlist);
          setConnectionStatus('connected');
          
          localStorage.setItem('libra_signals', JSON.stringify(remoteData.signals));
          localStorage.setItem('libra_watchlist', JSON.stringify(remoteData.watchlist));
        } else {
          setConnectionStatus('error');
        }
    } catch (err: any) {
        setConnectionStatus('error');
    } finally {
        setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncFromSheets();
    const poll = setInterval(syncFromSheets, POLL_INTERVAL);
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'libra_signals' || e.key === 'libra_watchlist') {
            const latestWatch = localStorage.getItem('libra_watchlist');
            const latestSignals = localStorage.getItem('libra_signals');
            if (latestWatch) setWatchlist(JSON.parse(latestWatch));
            if (latestSignals) setSignals(JSON.parse(latestSignals));
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        clearInterval(poll);
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [syncFromSheets]);

  const handleLogin = (newUser: User) => {
    const session = { user: newUser, timestamp: Date.now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(newUser);
    syncFromSheets();
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const handleTestLink = () => {
    // URL updated to the latest provided by the user
    window.open('https://script.google.com/macros/s/AKfycbyzmnhEsjwlQcxfchobNHnpRSe9H8cNWAuxTEblsWxLLyXiNH18D_JxaMDhV9QwJ8l5/exec', '_blank');
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
                    onUpdateWatchlist={(list) => setWatchlist(list)}
                    signals={signals}
                    onUpdateSignals={(list) => setSignals(list)}
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
      <div className="relative">
        {/* Connection Status Bar */}
        <div className="fixed top-4 right-4 z-[60] flex items-center space-x-2">
            {connectionStatus === 'error' ? (
                <button 
                  onClick={syncFromSheets}
                  className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center hover:bg-rose-500 transition-colors"
                >
                    <WifiOff size={10} className="mr-1.5" />
                    <span>SYNC ERROR</span>
                </button>
            ) : connectionStatus === 'syncing' ? (
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg flex items-center">
                    <RefreshCw size={10} className="animate-spin mr-1.5" />
                    <span>UPDATING</span>
                </div>
            ) : (
                <div className="bg-slate-800 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-700 flex items-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                    <span>LIVE</span>
                </div>
            )}
        </div>

        {connectionStatus === 'error' && (
            <div className="mb-6 bg-slate-900 border-2 border-rose-500/50 rounded-xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4">
                <div className="bg-rose-500/10 p-4 border-b border-rose-500/20 flex items-center">
                    <ShieldAlert className="text-rose-500 mr-3" size={20} />
                    <h3 className="font-bold text-rose-500 text-sm">Action Required: Connection Blocked</h3>
                </div>
                <div className="p-5 text-xs text-slate-300 space-y-3">
                    <p className="font-medium text-white">Your browser is blocking the data sync. This is 100% fixable by checking your Google Script settings:</p>
                    <div className="space-y-2 bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[10px]">
                        <p className="flex items-start"><AlertCircle size={10} className="mr-2 mt-0.5 text-blue-400" /> 1. Open your Google Apps Script project.</p>
                        <p className="flex items-start"><AlertCircle size={10} className="mr-2 mt-0.5 text-blue-400" /> 2. Click <b>Deploy</b> (top right) &gt; <b>New Deployment</b>.</p>
                        <p className="flex items-start"><AlertCircle size={10} className="mr-2 mt-0.5 text-blue-400" /> 3. Select <b>Web App</b>. Set <b>Who has access</b> to <b>"Anyone"</b>.</p>
                        <p className="flex items-start"><AlertCircle size={10} className="mr-2 mt-0.5 text-blue-400" /> 4. Copy the URL and paste it into the code (Ensure it ends in <b>/exec</b>).</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button 
                            onClick={handleTestLink}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors"
                        >
                            <ExternalLink size={14} className="mr-2" />
                            Step 5: Test URL Directly
                        </button>
                        <button 
                            onClick={syncFromSheets}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition-colors"
                        >
                            <RefreshCw size={14} className="mr-2" />
                            Retry Connection
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">If 'Test URL' asks for a login, your script is NOT set to 'Anyone'.</p>
                </div>
            </div>
        )}

        {renderPage()}
      </div>
    </Layout>
  );
};

export default App;