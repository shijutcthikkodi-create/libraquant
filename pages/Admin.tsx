
import React, { useState, useEffect } from 'react';
import { WatchlistItem, TradeSignal, OptionType, TradeStatus } from '../types';
import { Plus, Trash2, Edit2, List, X, Check, Radio, ShieldCheck, RefreshCw, Calculator, Activity } from 'lucide-react';
import { updateSheetData } from '../services/googleSheetsService';

interface AdminProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (list: WatchlistItem[]) => void;
  signals: TradeSignal[];
  onUpdateSignals: (list: TradeSignal[]) => void;
}

const Admin: React.FC<AdminProps> = ({ watchlist, onUpdateWatchlist, signals, onUpdateSignals }) => {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'WATCHLIST' | 'SESSIONS'>('SIGNALS');
  const [isSaving, setIsSaving] = useState(false);

  // --- Watchlist State ---
  const [isAddingWatch, setIsAddingWatch] = useState(false);
  const [newSymbol, setNewSymbol] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newChange, setNewChange] = useState('');

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

  const [editingSignalId, setEditingSignalId] = useState<string | null>(null);
  const [editSigStatus, setEditSigStatus] = useState<TradeStatus>(TradeStatus.ACTIVE);
  const [editSigPnl, setEditSigPnl] = useState('');
  const [editSigTrail, setEditSigTrail] = useState('');

  const handleAddSignal = async () => {
    if (!sigSymbol || !sigEntry || !sigSL) return;
    setIsSaving(true);
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
        comment: sigComment
    };

    // Push to Remote
    await updateSheetData('signals', 'ADD', newSignal);
    
    // Update Local
    onUpdateSignals([newSignal, ...signals]);
    
    setSigSymbol(''); setSigEntry(''); setSigSL(''); setSigTargets(''); setSigComment('');
    setIsAddingSignal(false);
    setIsSaving(false);
  };

  const saveSignalEdit = async () => {
    if (!editingSignalId) return;
    setIsSaving(true);
    const updatedSignal = signals.find(s => s.id === editingSignalId);
    if (updatedSignal) {
        const payload = {
            ...updatedSignal,
            status: editSigStatus,
            pnlPoints: editSigPnl ? parseFloat(editSigPnl) : undefined,
            trailingSL: editSigTrail ? parseFloat(editSigTrail) : undefined
        };
        
        await updateSheetData('signals', 'UPDATE_SIGNAL', payload, editingSignalId);
        
        const updatedSignals = signals.map(s => s.id === editingSignalId ? payload : s);
        onUpdateSignals(updatedSignals);
    }
    setEditingSignalId(null);
    setIsSaving(false);
  };

  const handleAddWatch = async () => {
    if (!newSymbol || !newPrice || !newChange) return;
    setIsSaving(true);
    const newItem: WatchlistItem = {
      symbol: newSymbol.toUpperCase(),
      price: parseFloat(newPrice),
      change: parseFloat(newChange),
      isPositive: parseFloat(newChange) >= 0,
      lastUpdated: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})
    };
    
    await updateSheetData('watchlist', 'ADD', newItem);
    onUpdateWatchlist([...watchlist, newItem]);
    
    setNewSymbol(''); setNewPrice(''); setNewChange(''); setIsAddingWatch(false);
    setIsSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Terminal Control</h2>
            <p className="text-slate-400 text-sm">Real-time signal management and dispatch.</p>
        </div>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 mt-4 md:mt-0">
            {[
              { id: 'SIGNALS', icon: Radio, label: 'Signals' },
              { id: 'WATCHLIST', icon: List, label: 'Market' },
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
                          <h3 className="text-lg font-bold text-white">Signal Dispatch</h3>
                      </div>
                      <button 
                        disabled={isSaving}
                        onClick={() => setIsAddingSignal(!isAddingSignal)}
                        className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isAddingSignal ? 'bg-slate-700 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                      >
                          {isAddingSignal ? <X size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
                          {isAddingSignal ? 'Cancel' : 'New Signal'}
                      </button>
                  </div>

                  {isAddingSignal && (
                      <div className="p-6 bg-slate-800/30 border-b border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
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
                                      <option value="CE">CE</option>
                                      <option value="PE">PE</option>
                                      <option value="FUT">FUT</option>
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
                          <div className="flex justify-end">
                              <button 
                                onClick={handleAddSignal} 
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-lg disabled:opacity-50 flex items-center"
                              >
                                  {isSaving && <RefreshCw size={14} className="mr-2 animate-spin" />}
                                  {isSaving ? 'Pushing Data...' : 'Broadcast Signal'}
                              </button>
                          </div>
                      </div>
                  )}

                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-800/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest border-b border-slate-800">
                                  <th className="py-4 pl-6">Signal</th>
                                  <th className="py-4">Status</th>
                                  <th className="py-4">P&L</th>
                                  <th className="py-4 pr-6 text-right">Control</th>
                              </tr>
                          </thead>
                          <tbody className="text-sm divide-y divide-slate-800">
                              {signals.map((signal) => (
                                  <tr key={signal.id} className="hover:bg-slate-800/20 group">
                                      <td className="py-4 pl-6">
                                          <div className="font-bold text-white">{signal.instrument} {signal.symbol}</div>
                                          <div className={`text-[10px] font-bold ${signal.action === 'BUY' ? 'text-emerald-500' : 'text-rose-500'}`}>{signal.action} {signal.type} @ ₹{signal.entryPrice}</div>
                                      </td>
                                      <td className="py-4">
                                          {editingSignalId === signal.id ? (
                                              <select value={editSigStatus} onChange={e => setEditSigStatus(e.target.value as TradeStatus)} className="bg-slate-950 border border-blue-500 rounded px-2 py-1 text-xs text-white">
                                                  {Object.values(TradeStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                              </select>
                                          ) : (
                                              <span className="text-[10px] font-bold text-slate-400">{signal.status}</span>
                                          )}
                                      </td>
                                      <td className="py-4 font-mono font-bold">
                                          {editingSignalId === signal.id ? (
                                              <input type="number" value={editSigPnl} onChange={e => setEditSigPnl(e.target.value)} placeholder="Pts" className="w-20 bg-slate-950 border border-blue-500 rounded px-2 py-1 text-xs text-white" />
                                          ) : (
                                              <span className={signal.pnlPoints && signal.pnlPoints > 0 ? 'text-emerald-400' : 'text-slate-500'}>
                                                  {signal.pnlPoints ? `${signal.pnlPoints > 0 ? '+' : ''}${signal.pnlPoints} pts` : '--'}
                                              </span>
                                          )}
                                      </td>
                                      <td className="py-4 pr-6 text-right">
                                          {editingSignalId === signal.id ? (
                                              <div className="flex justify-end space-x-2">
                                                  <button onClick={saveSignalEdit} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded"><Check size={14} /></button>
                                                  <button onClick={() => setEditingSignalId(null)} className="p-1.5 bg-slate-700 text-slate-400 rounded"><X size={14} /></button>
                                              </div>
                                          ) : (
                                              <button onClick={() => {
                                                  setEditingSignalId(signal.id);
                                                  setEditSigStatus(signal.status);
                                                  setEditSigPnl(signal.pnlPoints?.toString() || '');
                                                  setEditSigTrail(signal.trailingSL?.toString() || '');
                                              }} className="p-1.5 text-blue-400 hover:bg-blue-900/30 rounded"><Edit2 size={14} /></button>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'WATCHLIST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-lg font-bold text-white">Market Watch</h3>
                {!isAddingWatch && (
                    <button onClick={() => setIsAddingWatch(true)} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold">
                        Add Symbol
                    </button>
                )}
            </div>
            <div className="p-6">
                {isAddingWatch && (
                    <div className="mb-6 bg-slate-800/80 rounded-lg p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="Symbol" className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price" className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                        <input type="number" value={newChange} onChange={e => setNewChange(e.target.value)} placeholder="Change %" className="bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white text-sm" />
                        <button onClick={handleAddWatch} disabled={isSaving} className="bg-emerald-600 text-white rounded font-bold text-xs disabled:opacity-50">Save</button>
                    </div>
                )}
                <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-800">
                        {watchlist.map((item, index) => (
                            <tr key={index}>
                                <td className="py-4 font-bold text-white uppercase">{item.symbol}</td>
                                <td className="py-4 text-right font-mono text-slate-300">₹{item.price}</td>
                                <td className={`py-4 text-right font-mono ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{item.change}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'SESSIONS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500">
            <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
            <p className="font-mono text-sm uppercase tracking-widest">Client Security Dashboard</p>
            <p className="text-xs mt-2">Manage active device fingerprints here.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
