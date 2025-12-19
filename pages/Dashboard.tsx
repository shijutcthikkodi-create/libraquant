import React from 'react';
import SignalCard from '../components/SignalCard';
import { Bell, List, Clock } from 'lucide-react';
import { WatchlistItem, TradeSignal } from '../types';

interface DashboardProps {
  watchlist: WatchlistItem[];
  signals: TradeSignal[];
}

const Dashboard: React.FC<DashboardProps> = ({ watchlist, signals }) => {
  // Sort signals: Active first, then by timestamp descending
  const sortedSignals = [...signals].sort((a, b) => {
    if (a.status === 'EXITED' && b.status !== 'EXITED') return 1;
    if (a.status !== 'EXITED' && b.status === 'EXITED') return -1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Live Trading Floor</h2>
          <p className="text-slate-400 text-sm">Real-time options signals from the desk.</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors text-sm">
                <Bell size={16} className="mr-2 text-yellow-500" />
                Enable Push Alerts
            </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Signal Feed */}
          <div className="flex-1">
              {sortedSignals.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
                      <p className="text-slate-500">No active signals at the moment.</p>
                      <p className="text-slate-600 text-sm mt-2">Wait for the market to open.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6">
                    {sortedSignals.map((signal) => (
                        <SignalCard key={signal.id} signal={signal} />
                    ))}
                  </div>
              )}
              <div className="mt-12 text-center">
                <p className="text-slate-600 text-sm">End of live feed. Check "P&L Analytics" for history.</p>
              </div>
          </div>

          {/* Admin Watchlist Sidebar */}
          <div className="w-full lg:w-80 shrink-0">
             <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden sticky top-4">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur">
                    <div className="flex items-center space-x-2">
                        <List size={16} className="text-purple-400" />
                        <h3 className="font-bold text-white text-sm">Market Watch</h3>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">ADMIN PICKS</span>
                </div>
                <div className="divide-y divide-slate-800">
                    {watchlist.length > 0 ? watchlist.map((item, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                            <div>
                                <p className="font-bold text-sm text-slate-200">{item.symbol}</p>
                                <div className="flex items-center mt-1 text-slate-500">
                                    <Clock size={10} className="mr-1" />
                                    <span className="text-[10px] font-mono">{item.lastUpdated || '--'}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-sm text-white font-medium">{item.price.toLocaleString()}</p>
                                <p className={`text-xs font-mono mt-0.5 ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {item.isPositive ? '+' : ''}{item.change}%
                                </p>
                            </div>
                        </div>
                    )) : (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            No items in watchlist.
                        </div>
                    )}
                </div>
                <div className="p-3 bg-slate-950/50 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500">Data delayed by 15 mins</p>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;