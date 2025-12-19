import React, { useState } from 'react';
import { WatchlistItem, TradeSignal, OptionType, TradeStatus, User } from '../types';
import { Plus, Trash2, Edit2, List, X, Check, Radio, UserCheck, RefreshCw, Smartphone, Search, Calendar, ShieldCheck, UserPlus, Clock } from 'lucide-react';
import { updateSheetData } from '../services/googleSheetsService';

interface AdminProps {
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (list: WatchlistItem[]) => void;
  signals: TradeSignal[];
  onUpdateSignals: (list: TradeSignal[]) => void;
  users: User[];
  onUpdateUsers: (list: User[]) => void;
}

const Admin: React.FC<AdminProps> = ({ watchlist, onUpdateWatchlist, signals, onUpdateSignals, users, onUpdateUsers }) => {
  const [activeTab, setActiveTab] = useState<'SIGNALS' | 'WATCHLIST' | 'CLIENTS'>('SIGNALS');
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // --- Client State ---
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserExpiry, setNewUserExpiry] = useState(() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      return date.toISOString().split('T')[0];
  });

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

    await updateSheetData('signals', 'ADD', newSignal);
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
        onUpdateSignals(signals.map(s => s.id === editingSignalId ? payload : s));
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

  // --- Client Actions ---
  const handleAddUser = async () => {
    if (!newUserPhone || !newUserName) return;
    setIsSaving(true);
    const newUser: User = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        name: newUserName,
        phoneNumber: newUserPhone,
        password: newUserPass || '123456',
        expiryDate: newUserExpiry,
        isAdmin: false,
        deviceId: null
    };
    await updateSheetData('users', 'ADD', newUser, undefined);
    onUpdateUsers([newUser, ...users]);
    setIsAddingUser(false);
    setNewUserName(''); setNewUserPhone(''); setNewUserPass('');
    setIsSaving(false);
  };

  const handleResetDevice = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setIsSaving(true);
    const updatedUser = { ...user, deviceId: null };
    await updateSheetData('users', 'UPDATE_USER', updatedUser, userId);
    onUpdateUsers(users.map(u => u.id === userId ? updatedUser : u));
    setIsSaving(false);
  };

  const handleExtendAccess = async (userId: string, days: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setIsSaving(true);
    const currentExpiry = new Date(user.expiryDate);
    currentExpiry.setDate(currentExpiry.getDate() + days);
    const updatedUser = { ...user, expiryDate: currentExpiry.toISOString().split('T')[0] };
    await updateSheetData('users', 'UPDATE_USER', updatedUser, userId);
    onUpdateUsers(users.map(u => u.id === userId ? updatedUser : u));
    setIsSaving(false);
  };

  const handleDeleteUser = async (userId: string) => {
      if (!confirm('Are you sure you want to delete this client?')) return;
      setIsSaving(true);
      await updateSheetData('users', 'DELETE_USER', null, userId);
      onUpdateUsers(users.filter(u => u.id !== userId));
      setIsSaving(false);
  };

  const filteredUsers = (users || []).filter(u => 
      (u.name || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (u.phoneNumber || '').includes(searchQuery || '')
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Institutional Control</h2>
            <p className="text-slate-400 text-sm">System administration and client lifecycle management.</p>
        </div>
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 mt-4 md:mt-0">
            {[
              { id: 'SIGNALS', icon: Radio, label: 'Signals' },
              { id: 'WATCHLIST', icon: List, label: 'Market' },
              { id: 'CLIENTS', icon: UserCheck, label: 'Clients' }
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
                      <button onClick={() => setIsAddingSignal(!isAddingSignal)} className={`flex items-center px-4 py-2 rounded-lg text-xs font-bold transition-colors ${isAddingSignal ? 'bg-slate-700 text-white' : 'bg-blue-600 text-white'}`}>
                          {isAddingSignal ? <X size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />}
                          {isAddingSignal ? 'Cancel' : 'New Signal'}
                      </button>
                  </div>

                  {isAddingSignal && (
                      <div className="p-6 bg-slate-800/30 border-b border-slate-800">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-xs font-bold text-slate-500">
                              <div>
                                  <label className="block mb-1">Instrument</label>
                                  <select value={sigInstrument} onChange={e => setSigInstrument(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white">
                                      <option value="NIFTY">NIFTY</option>
                                      <option value="BANKNIFTY">BANKNIFTY</option>
                                      <option value="STOCK">STOCK</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block mb-1">Strike</label>
                                  <input type="text" value={sigSymbol} onChange={e => setSigSymbol(e.target.value)} placeholder="22500" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                              </div>
                              <div>
                                  <label className="block mb-1">Type</label>
                                  <select value={sigType} onChange={e => setSigType(e.target.value as OptionType)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white">
                                      <option value="CE">CE</option>
                                      <option value="PE">PE</option>
                                      <option value="FUT">FUT</option>
                                  </select>
                              </div>
                              <div>
                                  <label className="block mb-1">Action</label>
                                  <div className="flex bg-slate-950 rounded p-1 border border-slate-700">
                                      <button onClick={() => setSigAction('BUY')} className={`flex-1 py-1.5 rounded ${sigAction === 'BUY' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>BUY</button>
                                      <button onClick={() => setSigAction('SELL')} className={`flex-1 py-1.5 rounded ${sigAction === 'SELL' ? 'bg-rose-600 text-white' : 'text-slate-500'}`}>SELL</button>
                                  </div>
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-xs font-bold text-slate-500">
                              <div>
                                  <label className="block mb-1">Entry</label>
                                  <input type="number" value={sigEntry} onChange={e => setSigEntry(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                              </div>
                              <div>
                                  <label className="block mb-1">Stop Loss</label>
                                  <input type="number" value={sigSL} onChange={e => setSigSL(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                              </div>
                              <div className="md:col-span-2">
                                  <label className="block mb-1">Targets (Comma Sep)</label>
                                  <input type="text" value={sigTargets} onChange={e => setSigTargets(e.target.value)} placeholder="100, 120" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-white" />
                              </div>
                          </div>
                          <button onClick={handleAddSignal} disabled={isSaving} className="w-full bg-emerald-600 py-2.5 rounded-lg text-sm font-bold text-white flex items-center justify-center">
                              {isSaving ? <RefreshCw className="animate-spin mr-2" size={16} /> : 'Broadcast Signal'}
                          </button>
                      </div>
                  )}

                  <table className="w-full text-left">
                      <thead className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500">
                          <tr>
                              <th className="p-4 pl-6">Trade</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">P&L</th>
                              <th className="p-4 text-right pr-6">Action</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                          {signals.map(s => (
                              <tr key={s.id} className="hover:bg-slate-800/30">
                                  <td className="p-4 pl-6">
                                      <div className="font-bold text-white">{s.instrument} {s.symbol}</div>
                                      <div className="text-[10px] text-slate-500">{s.action} {s.type} @ {s.entryPrice}</div>
                                  </td>
                                  <td className="p-4">
                                      {editingSignalId === s.id ? (
                                          <select value={editSigStatus} onChange={e => setEditSigStatus(e.target.value as TradeStatus)} className="bg-slate-950 border border-blue-500 rounded text-xs p-1">
                                              {Object.values(TradeStatus).map(st => <option key={st} value={st}>{st}</option>)}
                                          </select>
                                      ) : <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{s.status}</span>}
                                  </td>
                                  <td className="p-4 font-mono text-sm">
                                      {editingSignalId === s.id ? (
                                          <input type="number" value={editSigPnl} onChange={e => setEditSigPnl(e.target.value)} className="w-16 bg-slate-950 border border-blue-500 rounded p-1" />
                                      ) : <span className={s.pnlPoints && s.pnlPoints > 0 ? 'text-emerald-400' : 'text-slate-500'}>{s.pnlPoints || '--'}</span>}
                                  </td>
                                  <td className="p-4 text-right pr-6">
                                      {editingSignalId === s.id ? (
                                          <button onClick={saveSignalEdit} className="p-1 bg-emerald-500/20 text-emerald-400 rounded"><Check size={14} /></button>
                                      ) : (
                                          <button onClick={() => {setEditingSignalId(s.id); setEditSigStatus(s.status); setEditSigPnl(s.pnlPoints?.toString() || '');}} className="text-blue-400 p-1"><Edit2 size={14} /></button>
                                      )}
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {activeTab === 'WATCHLIST' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                <h3 className="text-lg font-bold text-white">Market Watch</h3>
                <button onClick={() => setIsAddingWatch(!isAddingWatch)} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold flex items-center">
                    {isAddingWatch ? <X size={14} className="mr-2" /> : <Plus size={14} className="mr-2" />} Add
                </button>
            </div>
            <div className="p-5">
                {isAddingWatch && (
                    <div className="flex gap-4 mb-6 bg-slate-800/50 p-4 rounded-lg">
                        <input type="text" value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="Symbol" className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-xs" />
                        <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Price" className="w-24 bg-slate-950 border border-slate-700 rounded p-2 text-xs" />
                        <input type="number" value={newChange} onChange={e => setNewChange(e.target.value)} placeholder="%" className="w-20 bg-slate-950 border border-slate-700 rounded p-2 text-xs" />
                        <button onClick={handleAddWatch} className="bg-emerald-600 text-white px-4 rounded text-xs font-bold">Save</button>
                    </div>
                )}
                <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-800">
                        {watchlist.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20">
                                <td className="py-4 font-bold text-white">{item.symbol}</td>
                                <td className="py-4 text-right font-mono">₹{item.price}</td>
                                <td className={`py-4 text-right font-mono ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>{item.change}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'CLIENTS' && (
          <div className="space-y-6">
              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Total Clients</p>
                      <p className="text-2xl font-bold text-white">{(users || []).length}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Active Subs</p>
                      <p className="text-2xl font-bold text-emerald-400">{(users || []).filter(u => new Date(u.expiryDate) > new Date()).length}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Expired</p>
                      <p className="text-2xl font-bold text-rose-500">{(users || []).filter(u => new Date(u.expiryDate) <= new Date()).length}</p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Admin Roles</p>
                      <p className="text-2xl font-bold text-blue-400">{(users || []).filter(u => u.isAdmin).length}</p>
                  </div>
              </div>

              {/* Client Directory */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                  <div className="p-5 border-b border-slate-800 bg-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="relative w-full md:w-80">
                          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or phone..." 
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-xs text-white focus:border-blue-500 outline-none"
                          />
                      </div>
                      <button 
                        onClick={() => setIsAddingUser(!isAddingUser)}
                        className="w-full md:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                      >
                          <UserPlus size={14} className="mr-2" />
                          Register Client
                      </button>
                  </div>

                  {isAddingUser && (
                      <div className="p-6 bg-slate-800/30 border-b border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Full Name</label>
                              <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Client Name" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Mobile</label>
                              <input type="tel" value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)} placeholder="9876543210" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Password</label>
                              <input type="text" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} placeholder="123456" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                          </div>
                          <div className="flex items-end">
                              <button onClick={handleAddUser} disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs flex items-center justify-center">
                                  {isSaving ? <RefreshCw className="animate-spin mr-2" size={14} /> : <Check size={14} className="mr-2" />}
                                  Confirm Registration
                              </button>
                          </div>
                      </div>
                  )}

                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                              <tr>
                                  <th className="p-4 pl-6">Client Info</th>
                                  <th className="p-4">Subscription</th>
                                  <th className="p-4">Security</th>
                                  <th className="p-4 text-right pr-6">Manage</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800">
                              {filteredUsers.map(u => {
                                  const isExpired = new Date(u.expiryDate) <= new Date();
                                  const expiresSoon = !isExpired && (new Date(u.expiryDate).getTime() - Date.now()) < (7 * 24 * 60 * 60 * 1000);

                                  return (
                                    <tr key={u.id} className="hover:bg-slate-800/20 group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 font-bold text-xs ${u.isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                                    {(u.name || '?').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-sm flex items-center">
                                                        {u.name || 'Unknown'}
                                                        {u.isAdmin && <ShieldCheck size={12} className="ml-1.5 text-blue-400" />}
                                                    </div>
                                                    <div className="text-[10px] font-mono text-slate-500">{u.phoneNumber || 'No Phone'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className={`text-xs font-bold mb-1 ${isExpired ? 'text-rose-500' : expiresSoon ? 'text-yellow-500' : 'text-emerald-400'}`}>
                                                    {isExpired ? 'EXPIRED' : expiresSoon ? 'EXPIRES SOON' : 'ACTIVE'}
                                                </div>
                                                <div className="flex items-center text-[10px] text-slate-500 font-mono">
                                                    <Calendar size={10} className="mr-1" />
                                                    {u.expiryDate}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center text-[10px] font-bold text-slate-400 mb-1">
                                                    <Smartphone size={10} className="mr-1 text-slate-600" />
                                                    {u.deviceId ? 'DEVICE BOUND' : 'UNLOCKED'}
                                                </div>
                                                {u.deviceId && (
                                                    <button 
                                                        onClick={() => handleResetDevice(u.id)}
                                                        disabled={isSaving}
                                                        className="text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest text-left"
                                                    >
                                                        Reset Device ID
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button 
                                                    onClick={() => handleExtendAccess(u.id, 30)}
                                                    className="p-1.5 bg-slate-800 hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-400 rounded transition-all"
                                                    title="Extend 30 Days"
                                                >
                                                    <Clock size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(u.id)}
                                                    className="p-1.5 bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-400 rounded transition-all"
                                                    title="Remove Client"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                  );
                              })}
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