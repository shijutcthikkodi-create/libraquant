import React, { useState, useEffect } from 'react';
import { WatchlistItem, TradeSignal, OptionType, TradeStatus, InstrumentType } from '../types';
import { Plus, Trash2, Edit2, List, X, Check, Radio, ShieldCheck, Smartphone, RefreshCw, Calculator, TrendingUp, Activity, Clock } from 'lucide-react';

interface AdminProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (list: WatchlistItem[]) => void;
  signals: TradeSignal[];
  onUpdateSignals: (list: TradeSignal[]) => void;
}

interface ActiveSession {
  phone: string;
  deviceId: string;
  lastLogin: string;
}

const Admin: React.FC<AdminProps> = ({ watchlist, onUpdateWatchlist, signals, onUpdateSignals }) => {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'WATCHLIST' | 'SESSIONS'>('SIGNALS');

  // --- Watchlist State ---
  const [isAddingWatch, setIsAddingWatch] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newChange, setNewChange] = useState('');
  const [editingWatchIndex, setEditingWatchIndex] = useState<number | null>(null);
  const [editWatchSymbol, setEditWatchSymbol] = useState('');
  const [editWatchPrice, setEditWatchPrice] = useState('');
  const [editWatchChange, setEditWatchChange] = useState('');

  // --- Signal State ---
  const [isAddingSignal, setIsAddingSignal] = useState(false);
  const [sigInstrument, setSigInstrument] = useState('NIFTY');
  const [sigSymbol, setSigSymbol] = useState('');
  const [sigType, setSigType] = useState<OptionType>(OptionType.CE);
  const [sigAction, setSigAction] = useState<'BUY' | 'SELL'>('BUY');
  const [sigEntry, setSigEntry] = useState('');
  const [sigSL, setSigSL] = useState('');
  const [sigTargets, setSigTargets] = useState('');
  const [sigComment, setSigComment] = useState('');
  const [sigLastTraded, setSigLastTraded] = useState('');

  // --- Signal Edit State ---
  const [editingSignalId, setEditingSignalId] = useState<string | null>(null);
  const [editSigStatus, setEditSigStatus] = useState<TradeStatus>(TradeStatus.ACTIVE);
  const [editSigPnl, setEditSigPnl] = useState('');
  const [editSigTrail, setEditSigTrail] = useState('');
  const [editSigLastTraded, setEditSigLastTraded] = useState('');

  // --- Session Management State ---
  const [sessions, setSessions] = useState<ActiveSession[]>([]);

  useEffect(() => {
    const keys = Object.keys(localStorage);
    const foundSessions: ActiveSession[] = [];
    keys.forEach(key => {
      if (key.startsWith('libra_bound_device_')) {
        const phone = key.replace('libra_bound_device_', '');
        const deviceId = localStorage.getItem(key) || 'Unknown';
        foundSessions.push({
          phone,
          deviceId,
          lastLogin: new Date().toLocaleDateString()
        });
      }
    });
    setSessions(foundSessions);
  }, []);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleAddWatch = () => {
    if (!newSymbol || !newPrice || !newChange) return;
    const newItem: WatchlistItem = {
      symbol: newSymbol.toUpperCase(),
      price: parseFloat(newPrice),
      change: parseFloat(newChange),
      isPositive: parseFloat(newChange) >= 0,
      lastUpdated: getCurrentTime()
    };
    onUpdateWatchlist([...watchlist, newItem]);
    setNewSymbol(''); setNewPrice(''); setNewChange(''); setIsAddingWatch(false);
  };

  const saveWatchEdit = () => {
    if (editingWatchIndex === null) return;
    const updated: WatchlistItem = {
      symbol: editWatchSymbol.toUpperCase(),
      price: parseFloat(editWatchPrice),
      change: parseFloat(editWatchChange),
      isPositive: parseFloat(editWatchChange) >= 0,
      lastUpdated: getCurrentTime()
    };
    const newList = [...watchlist];
    newList[editingWatchIndex] = updated;
    onUpdateWatchlist(newList);
    setEditingWatchIndex(null);
  };

  const handleRemoveWatch = (index: number) => {
    if (window.confirm(`Remove ${watchlist[index].symbol}?`)) {
      const newList = [...watchlist];
      newList.splice(index, 1);
      onUpdateWatchlist(newList);
    }
  };

  const handleAddSignal = () => {
    if (!sigSymbol || !sigEntry || !sigSL) return;
    const targets = sigTargets.split(',').map(t => parseFloat(t.trim())).filter(n => !isNaN(n));
    const newSignal: TradeSignal = {
        id: `SIG-${Date.now().toString().slice(-4)}`,
        instrument: sigInstrument,
        symbol: sigSymbol,
        type: sigType,
        action: sigAction,
        entryPrice: parseFloat(sigEntry),
        stopLoss: parseFloat(sigSL),
        targets: targets.length > 0 ? targets : [parseFloat(sigEntry) * 1.1],
        status: TradeStatus.ACTIVE,
        timestamp: new Date().toISOString(),
        lastTradedTimestamp: sigLastTraded || undefined,
        comment: sigComment
    };
    onUpdateSignals([newSignal, ...signals]);
    setSigSymbol(''); setSigEntry(''); setSigSL(''); setSigTargets(''); setSigComment(''); setSigLastTraded('');
    setIsAddingSignal(false);
  };

  const handleResetDevice = (phone: string) => {
    if (window.confirm(`Reset device lock for ${phone}? User will be able to login from a new device.`)) {
      localStorage.removeItem(`libra_bound_device_${phone}`);
      if (phone === '9876543210') {
        localStorage.removeItem('libra_device_owner_phone');
      }
      setSessions(prev => prev.filter(s => s.phone !== phone));
    }
  };

  const startEditSignal = (signal: TradeSignal) => {
    setEditingSignalId(signal.id);
    setEditSigStatus(signal.status);
    setEditSigPnl(signal.pnlPoints?.toString() || '');
    setEditSigTrail(signal.trailingSL?.toString() || '');
    setEditSigLastTraded(signal.lastTradedTimestamp || '');
  };

  const saveSignalEdit = () => {
    if (!editingSignalId) return;
    const updatedSignals = signals.map(s => {
        if (s.id === editingSignalId) {
            return {
                ...s,
                status: editSigStatus,
                pnlPoints: editSigPnl ? parseFloat(editSigPnl) : undefined,
                trailingSL: editSigTrail ? parseFloat(editSigTrail) : undefined,
                lastTradedTimestamp: editSigLastTraded || undefined
            };
        }
        return s;
    });
    onUpdateSignals(updatedSignals);
    setEditingSignalId(null);
  };

  const deleteSignal = (id: string) => {
    if (window.confirm('Delete this signal entirely?')) {
        onUpdateSignals(signals.filter(s => s.id !== id));
    }
  };

  const targetsArr = sigTargets.split(',').map(t => parseFloat(t.trim())).filter(n => !isNaN(n));
  const riskReward = targetsArr.length > 0 && parseFloat(sigEntry) && parseFloat(sigSL) ? 
    (targetsArr[0] - parseFloat(sigEntry)) / (parseFloat(sigEntry) - parseFloat(sigSL)) : 0;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Terminal Control</h2>
            <p className="text-slate-400 text-sm">Strict administrative access and signal management.</p>
        </div>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {[
              { id: 'SIGNALS', icon: Radio, label: 'Signals' },
              { id: 'WATCHLIST', icon: List, label: 'Watchlist' },
              { id: 'SESSIONS', icon: ShieldCheck, label: 'Security' }
            ].map((tab) => (
              <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-4 py-2 rounded-md text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                  <tab.icon size={14} className="mr-2" />
                  {tab.label}
              </button>
            ))}
        </div>
      </div>

      {activeTab === 'SIGNALS' && (
          <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                      <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Radio size={20} /></div>
                          <div>
                              <h3 className="text-lg font-bold text-white">Signal Dispatch</h3>
                              <p className="text-xs text-slate-400">Deploy real-time institutional alerts</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setIsAddingSignal(!isAddingSignal)}
                        className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isAddingSignal ? 'bg-slate-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                      >
                          {isAddingSignal ? <X size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
                          {isAddingSignal ? 'Close Form' : 'New Signal'}
                      </button>
                  </div>

                  {isAddingSignal && (
                      <div className="p-6 bg-slate-800/30">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Instrument</label>
                                  <select value={sigInstrument} onChange={e => setSigInstrument(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none">
                                      <option value="NIFTY">NIFTY</option>
                                      <option value="BANKNIFTY">BANKNIFTY</option>
                                      <option value="FINNIFTY">FINNIFTY</option>
                                      <option value="STOCK">STOCK</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Strike/Symbol</label>
                                  <input type="text" value={sigSymbol} onChange={e => setSigSymbol(e.target.value)} placeholder="e.g. 22500" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                              </div>
                              <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Type</label>
                                  <select value={sigType} onChange={e => setSigType(e.target.value as OptionType)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none">
                                      <option value="CE">CE (Call)</option>
                                      <option value="PE">PE (Put)</option>
                                      <option value="FUT">FUT (Future)</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Action</label>
                                  <div className="flex bg-slate-950 rounded p-1 border border-slate-700">
                                      <button onClick={() => setSigAction('BUY')} className={`flex-1 text-[10px] font-bold py-1.5 rounded ${sigAction === 'BUY' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500'}`}>BUY</button>
                                      <button onClick={() => setSigAction('SELL')} className={`flex-1 text-[10px] font-bold py-1.5 rounded ${sigAction === 'SELL' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500'}`}>SELL</button>
                                  </div>
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Entry Price</label>
                                  <input type="number" value={sigEntry} onChange={e => setSigEntry(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                              </div>
                              <div>
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Stop Loss</label>
                                  <input type="number" value={sigSL} onChange={e => setSigSL(e.target.value)} placeholder="0.00" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Targets (Comma separated)</label>
                                  <input type="text" value={sigTargets} onChange={e => setSigTargets(e.target.value)} placeholder="100, 120, 150" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                              </div>
                          </div>
                          <div className="flex flex-col md:flex-row gap-4 mb-6">
                              <div className="flex-1">
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Institutional Note</label>
                                  <input type="text" value={sigComment} onChange={e => setSigComment(e.target.value)} placeholder="Reasoning..." className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                              </div>
                              <div className="w-full md:w-64">
                                  <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Last Traded (Optional)</label>
                                  <input type="text" value={sigLastTraded} onChange={e => setSigLastTraded(e.target.value)} placeholder="e.g. 15:30" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-blue-500 outline-none" />
                              </div>
                              {sigEntry && sigSL && targetsArr.length > 0 && (
                                <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 flex items-center space-x-4 min-w-[180px]">
                                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-full"><Calculator size={16} /></div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">R:R Estimate</p>
                                        <p className={`text-sm font-mono font-bold ${riskReward >= 2 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                            1 : {riskReward.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                              )}
                          </div>
                          <div className="flex justify-end">
                              <button onClick={handleAddSignal} className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/20 transition-all">
                                  Broadcast Signal
                              </button>
                          </div>
                      </div>
                  )}

                  <div className="p-0">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-800/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800">
                                  <th className="py-4 pl-6">Instrument</th>
                                  <th className="py-4">Type</th>
                                  <th className="py-4">Status</th>
                                  <th className="py-4">P&L Points</th>
                                  <th className="py-4 pr-6 text-right">Control</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-800">
                              {signals.length === 0 ? (
                                  <tr><td colSpan={5} className="py-12 text-center text-slate-600 font-mono italic">Database empty</td></tr>
                              ) : (
                                  signals.map((signal) => (
                                      <tr key={signal.id} className="hover:bg-slate-800/20 group">
                                          <td className="py-4 pl-6">
                                              <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{signal.instrument}</div>
                                              <div className="text-[10px] text-slate-500 font-mono">{signal.symbol}</div>
                                          </td>
                                          <td className="py-4">
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${signal.type === OptionType.CE ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>{signal.type}</span>
                                              <div className={`text-[10px] font-bold mt-1 ${signal.action === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{signal.action}</div>
                                          </td>
                                          <td className="py-4">
                                              {editingSignalId === signal.id ? (
                                                  <select value={editSigStatus} onChange={e => setEditSigStatus(e.target.value as TradeStatus)} className="bg-slate-950 border border-blue-500 rounded px-2 py-1 text-xs text-white">
                                                      {Object.values(TradeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                  </select>
                                              ) : (
                                                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                                                      signal.status === TradeStatus.ACTIVE ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                                      signal.status === TradeStatus.EXITED ? 'bg-slate-800 text-slate-500 border-slate-700' :
                                                      'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                                  }`}>
                                                      {signal.status}
                                                  </span>
                                              )}
                                          </td>
                                          <td className="py-4 font-mono font-bold">
                                              {editingSignalId === signal.id ? (
                                                  <div className="flex flex-col space-y-2">
                                                      <input type="number" value={editSigPnl} onChange={e => setEditSigPnl(e.target.value)} placeholder="Pts" className="w-20 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-xs text-white" />
                                                      <input type="text" value={editSigLastTraded} onChange={e => setEditSigLastTraded(e.target.value)} placeholder="LTT" className="w-20 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-[10px] text-white" />
                                                  </div>
                                              ) : (
                                                  <div>
                                                      <span className={signal.pnlPoints && signal.pnlPoints > 0 ? 'text-emerald-400' : signal.pnlPoints && signal.pnlPoints < 0 ? 'text-rose-400' : 'text-slate-500'}>
                                                          {signal.pnlPoints ? `${signal.pnlPoints > 0 ? '+' : ''}${signal.pnlPoints}` : '0.00'}
                                                      </span>
                                                      {signal.lastTradedTimestamp && (
                                                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">LTT: {signal.lastTradedTimestamp}</div>
                                                      )}
                                                  </div>
                                              )}
                                          </td>
                                          <td className="py-4 pr-6 text-right">
                                              {editingSignalId === signal.id ? (
                                                  <div className="flex justify-end space-x-2">
                                                      <button onClick={saveSignalEdit} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded"><Check size={14} /></button>
                                                      <button onClick={() => setEditingSignalId(null)} className="p-1.5 bg-slate-700 text-slate-400 rounded"><X size={14} /></button>
                                                  </div>
                                              ) : (
                                                  <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                      <button onClick={() => startEditSignal(signal)} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14} /></button>
                                                      <button onClick={() => deleteSignal(signal.id)} className="p-1.5 text-rose-400 hover:bg-rose-900/30 rounded"><Trash2 size={14} /></button>
                                                  </div>
                                              )}
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'WATCHLIST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg"><List size={20} /></div>
                    <div><h3 className="text-lg font-bold text-white">Market Watch Manager</h3></div>
                </div>
                {!isAddingWatch && (
                    <button onClick={() => setIsAddingWatch(true)} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold">
                        <Plus size={14} className="mr-2" /> Add Symbol
                    </button>
                )}
            </div>
            <div className="p-6">
                {isAddingWatch && (
                    <div className="mb-6 bg-slate-800/80 border border-slate-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="Symbol" className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price" className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                        <input type="number" value={newChange} onChange={e => setNewChange(e.target.value)} placeholder="Change %" className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                        <div className="flex space-x-2">
                            <button onClick={handleAddWatch} className="flex-1 bg-emerald-600 text-white rounded font-bold text-xs">Save</button>
                            <button onClick={() => setIsAddingWatch(false)} className="px-3 bg-slate-700 text-white rounded text-xs">X</button>
                        </div>
                    </div>
                )}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-800/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800">
                            <th className="py-4 pl-4">Symbol</th>
                            <th className="py-4 text-right">Price</th>
                            <th className="py-4 text-right">Change %</th>
                            <th className="py-4 text-right pr-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-800">
                        {watchlist.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-800/20">
                                {editingWatchIndex === index ? (
                                    <>
                                      <td className="py-3 pl-4"><input value={editWatchSymbol} onChange={e => setEditWatchSymbol(e.target.value)} className="w-full bg-slate-950 border border-blue-500 rounded px-2 py-1 text-white text-sm" /></td>
                                      <td className="py-3 text-right"><input value={editWatchPrice} onChange={e => setEditWatchPrice(e.target.value)} className="w-24 ml-auto bg-slate-950 border border-blue-500 rounded px-2 py-1 text-white text-right text-sm font-mono" /></td>
                                      <td className="py-3 text-right"><input value={editWatchChange} onChange={e => setEditWatchChange(e.target.value)} className="w-20 ml-auto bg-slate-950 border border-blue-500 rounded px-2 py-1 text-white text-right text-sm font-mono" /></td>
                                      <td className="py-3 text-right pr-4">
                                          <button onClick={saveWatchEdit} className="mr-2 text-emerald-400"><Check size={16} /></button>
                                          <button onClick={() => setEditingWatchIndex(null)} className="text-slate-400"><X size={16} /></button>
                                      </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="py-4 pl-4 font-bold text-white uppercase">{item.symbol}</td>
                                        <td className="py-4 text-right font-mono text-slate-300">₹{item.price.toLocaleString()}</td>
                                        <td className={`py-4 text-right font-mono font-bold ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{item.isPositive ? '+' : ''}{item.change}%</td>
                                        <td className="py-4 text-right pr-4">
                                            <button onClick={() => {
                                                setEditingWatchIndex(index);
                                                setEditWatchSymbol(item.symbol);
                                                setEditWatchPrice(item.price.toString());
                                                setEditWatchChange(item.change.toString());
                                            }} className="p-1.5 text-blue-400 mr-2"><Edit2 size={16} /></button>
                                            <button onClick={() => handleRemoveWatch(index)} className="p-1.5 text-rose-400"><Trash2 size={16} /></button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'SESSIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
             <div className="p-6 border-b border-slate-800 bg-slate-800/50 flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg"><ShieldCheck size={20} /></div>
                <div>
                    <h3 className="text-lg font-bold text-white">Security Guard</h3>
                    <p className="text-xs text-slate-400">Manage device locks and active fingerprints</p>
                </div>
            </div>
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Active Device Locks</p>
                        <p className="text-4xl font-mono font-bold text-white">{sessions.length}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">System Integrity</p>
                        <div className="flex items-center space-x-3 text-emerald-400">
                            <Activity size={32} />
                            <p className="text-4xl font-mono font-bold">SECURE</p>
                        </div>
                    </div>
                </div>

                <div className="mt-8 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-800 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                                <th className="py-4 px-6">User Phone</th>
                                <th className="py-4 px-6">Fingerprint</th>
                                <th className="py-4 px-6">Last Access</th>
                                <th className="py-4 px-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {sessions.map((session, i) => (
                                <tr key={i} className="hover:bg-slate-800/30">
                                    <td className="py-4 px-6 text-white font-bold">{session.phone}</td>
                                    <td className="py-4 px-6"><span className="font-mono text-xs text-slate-500">{session.deviceId.substring(0, 12)}...</span></td>
                                    <td className="py-4 px-6 text-xs text-slate-400">{session.lastLogin}</td>
                                    <td className="py-4 px-6 text-right">
                                        <button 
                                            onClick={() => handleResetDevice(session.phone)}
                                            className="inline-flex items-center px-3 py-1.5 bg-rose-900/20 text-rose-400 rounded-lg text-xs font-bold hover:bg-rose-900/40 transition-colors"
                                        >
                                            <RefreshCw size={12} className="mr-2" />
                                            Release Lock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {sessions.length === 0 && (
                                <tr><td colSpan={4} className="py-12 text-center text-slate-600 font-mono italic">No locks found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Admin;