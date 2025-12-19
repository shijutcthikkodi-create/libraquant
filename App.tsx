import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Stats from './pages/Stats';
import Rules from './pages/Rules';
import Admin from './pages/Admin';
import { User, WatchlistItem, TradeSignal } from './types';
import { fetchSheetData } from './services/googleSheetsService';
import { MOCK_WATCHLIST, MOCK_SIGNALS } from './constants';
import { WifiOff, RefreshCw, ExternalLink, ShieldAlert, Volume2, VolumeX } from 'lucide-react';

const SESSION_DURATION_MS = 6.5 * 60 * 60 * 1000;
const SESSION_KEY = 'libra_user_session';
const POLL_INTERVAL = 15000; 

// Professional notification sound URL
const NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

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
  const [users, setUsers] = useState<User[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('libra_sound_enabled') === 'true');
  
  const prevSignalsRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.volume = 0.5;
  }, []);

  const playNotification = useCallback(() => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked by browser. Click anywhere to enable."));
    }
  }, [soundEnabled]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('libra_sound_enabled', String(newState));
    // Brief play to "arm" the browser's audio context
    if (newState && audioRef.current) {
      audioRef.current.volume = 0;
      audioRef.current.play().then(() => {
        audioRef.current!.volume = 0.5;
      }).catch(() => {});
    }
  };

  const syncFromSheets = useCallback(async (isInitial = false) => {
    setIsSyncing(true);
    setConnectionStatus('syncing');
    try {
        const remoteData = await fetchSheetData();
        if (remoteData) {
          // Detect changes for sound notification
          const signalsJson = JSON.stringify(remoteData.signals);
          if (!isInitial && prevSignalsRef.current && prevSignalsRef.current !== signalsJson) {
            // Check if there are new IDs or status changes
            const oldSignals: TradeSignal[] = JSON.parse(prevSignalsRef.current);
            const hasSignificantChange = remoteData.signals.some(newSig => {
              const oldSig = oldSignals.find(s => s.id === newSig.id);
              return !oldSig || oldSig.status !== newSig.status;
            });

            if (hasSignificantChange) {
              playNotification();
            }
          }
          prevSignalsRef.current = signalsJson;

          setSignals(remoteData.signals);
          setWatchlist(remoteData.watchlist);
          setUsers(remoteData.users);
          setConnectionStatus('connected');
          
          localStorage.setItem('libra_signals', JSON.stringify(remoteData.signals));
          localStorage.setItem('libra_watchlist', JSON.stringify(remoteData.watchlist));
          localStorage.setItem('libra_users', JSON.stringify(remoteData.users));
        } else {
          setConnectionStatus('error');
        }
    } catch (err: any) {
        setConnectionStatus('error');
    } finally {
        setIsSyncing(false);
    }
  }, [playNotification]);

  useEffect(() => {
    syncFromSheets(true);
    const poll = setInterval(() => syncFromSheets(false), POLL_INTERVAL);
    
    const handleStorageChange = (e: StorageEvent) => {
        if (['libra_signals', 'libra_watchlist', 'libra_users'].includes(e.key || '')) {
            const data = localStorage.getItem(e.key!);
            if (data) {
                if (e.key === 'libra_watchlist') setWatchlist(JSON.parse(data));
                if (e.key === 'libra_signals') setSignals(JSON.parse(data));
                if (e.key === 'libra_users') setUsers(JSON.parse(data));
            }
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
    syncFromSheets(true);
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const handleTestLink = () => {
    window.open('https://script.google.com/macros/s/AKfycbyFbphSzUzTcjwiqGs3EdCcg2y67fOhmvuq65cXLSvaUJXFRDyrMTJkm6OdrVNPMk_A/exec', '_blank');
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
                    users={users}
                    onUpdateUsers={(list) => setUsers(list)}
                />
            ) : <Dashboard watchlist={watchlist} signals={signals} />;
        default: return <Dashboard watchlist={watchlist} signals={signals} />;
    }
  };

  return (
    <Layout user={user} onLogout={handleLogout} currentPage={page} onNavigate={setPage}>
      <div className="relative">
        <div className="fixed top-4 right-4 z-[60] flex items-center space-x-2">
            {/* Sound Toggle */}
            <button 
              onClick={toggleSound}
              className={`p-2 rounded-full border transition-all shadow-lg flex items-center justify-center ${
                soundEnabled 
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30' 
                : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'
              }`}
              title={soundEnabled ? "Mute Alerts" : "Unmute Alerts"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {connectionStatus === 'error' ? (
                <button onClick={() => syncFromSheets(false)} className="bg-rose-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center">
                    <WifiOff size={10} className="mr-1.5" />
                    <span>SYNC ERROR</span>
                </button>
            ) : connectionStatus === 'syncing' ? (
                <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-lg flex items-center">
                    <RefreshCw size={10} className="animate-spin mr-1.5" />
                    <span>UPDATING</span>
                </div>
            ) : (
                <div className="bg-slate-800 text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-bold border border-slate-700 flex items-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></div>
                    <span>LIVE</span>
                </div>
            )}
        </div>

        {connectionStatus === 'error' && (
            <div className="mb-6 bg-slate-900 border-2 border-rose-500/50 rounded-xl p-5 shadow-2xl">
                <div className="flex items-center text-rose-500 mb-3">
                    <ShieldAlert className="mr-3" size={20} />
                    <h3 className="font-bold">Connection Blocked</h3>
                </div>
                <p className="text-xs text-slate-300 mb-4">The Google Script connection is failing. Ensure Deployment is set to 'Anyone'.</p>
                <div className="flex gap-2">
                    <button onClick={handleTestLink} className="flex-1 bg-blue-600 py-2 rounded text-xs font-bold text-white flex items-center justify-center">
                        <ExternalLink size={12} className="mr-2" /> Test Script
                    </button>
                    <button onClick={() => syncFromSheets(false)} className="flex-1 bg-slate-800 py-2 rounded text-xs font-bold text-white flex items-center justify-center">
                        <RefreshCw size={12} className="mr-2" /> Retry
                    </button>
                </div>
            </div>
        )}

        {renderPage()}
      </div>
    </Layout>
  );
};

export default App;