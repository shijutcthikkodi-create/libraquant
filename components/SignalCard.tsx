import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, Target, Cpu, Edit2, Check, X, TrendingUp, TrendingDown, MoveRight, Clock, ShieldAlert } from 'lucide-react';
import { TradeSignal, TradeStatus, OptionType } from '../types';
import { analyzeTradeSignal } from '../services/geminiService';

interface SignalCardProps {
  signal: TradeSignal;
}

const SignalCard: React.FC<SignalCardProps> = ({ signal }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Local state for editing Trailing SL
  const [isEditingTrail, setIsEditingTrail] = useState(false);
  const [trailValue, setTrailValue] = useState<string>(signal.trailingSL != null ? String(signal.trailingSL) : '');
  const [displayTrail, setDisplayTrail] = useState<number | null | undefined>(signal.trailingSL);

  useEffect(() => {
    setDisplayTrail(signal.trailingSL);
    setTrailValue(signal.trailingSL != null ? String(signal.trailingSL) : '');
  }, [signal.trailingSL]);

  const isBuy = signal.action === 'BUY';
  const isActive = signal.status === TradeStatus.ACTIVE || signal.status === TradeStatus.PARTIAL;
  const isExited = signal.status === TradeStatus.EXITED || signal.status === TradeStatus.STOPPED;
  
  // Status Color Logic
  const getStatusColor = (status: TradeStatus) => {
    switch (status) {
      case TradeStatus.ACTIVE: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case TradeStatus.PARTIAL: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case TradeStatus.EXITED: return 'bg-slate-800 text-slate-500 border-slate-700';
      case TradeStatus.STOPPED: return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      default: return 'bg-slate-800 text-slate-400';
    }
  };

  const handleAIAnalysis = async () => {
    if (analysis) {
        setAnalysis(null); // Toggle off
        return;
    }
    setLoadingAnalysis(true);
    const result = await analyzeTradeSignal(signal);
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const handleSaveTrail = () => {
    const val = parseFloat(trailValue);
    if (!isNaN(val)) {
        setDisplayTrail(val);
    } else {
        setDisplayTrail(null);
    }
    setIsEditingTrail(false);
  };

  const showPnL = isExited || signal.pnlPoints !== undefined || signal.pnlRupees !== undefined;

  // Calculate a mock risk score based on targets/entry (Professional look)
  const riskReward = (signal.targets[0] - signal.entryPrice) / (signal.entryPrice - signal.stopLoss);
  const riskGrade = riskReward >= 2.5 ? 'A+' : riskReward >= 1.5 ? 'B' : 'C-';

  return (
    <div className={`relative bg-slate-900 border rounded-xl overflow-hidden transition-all duration-300 ${isActive ? 'border-slate-700 shadow-xl' : 'border-slate-800 opacity-90'}`}>
      {/* Header */}
      <div className="flex justify-between items-start p-5 pb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isBuy ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'}`}>
            {isBuy ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight font-mono">{signal.instrument}</h3>
            <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono text-slate-400 uppercase">{signal.symbol}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${signal.type === OptionType.CE ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                    {signal.type}
                </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1.5">
            <div className={`px-3 py-1 rounded text-[10px] font-bold border ${getStatusColor(signal.status)} flex items-center`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isActive ? 'bg-current' : 'bg-current opacity-50'}`}></span>
                {signal.status}
            </div>
            <div className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                <ShieldAlert size={10} className="mr-1 text-blue-400" />
                RISK: {riskGrade}
            </div>
        </div>
      </div>

      {/* Grid Data */}
      <div className="grid grid-cols-2 gap-px bg-slate-800 border-y border-slate-800">
        <div className="bg-slate-900 p-4">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Entry Price</p>
            <p className="text-2xl font-mono font-bold text-white">₹{signal.entryPrice}</p>
        </div>
        
        <div className="bg-slate-900 p-4 flex flex-col">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Stop Loss</p>
            <p className="text-2xl font-mono font-bold text-rose-400 mb-3">₹{signal.stopLoss}</p>
            
            <div className="mt-auto pt-2 border-t border-slate-800/80">
                {isEditingTrail ? (
                    <div className="flex items-center space-x-1">
                        <input 
                            type="number" 
                            value={trailValue}
                            onChange={(e) => setTrailValue(e.target.value)}
                            className="w-full bg-slate-950 border border-blue-500/50 rounded text-[10px] px-2 py-1 text-white focus:outline-none font-mono"
                            placeholder="TSL"
                            autoFocus
                        />
                        <button onClick={handleSaveTrail} className="p-1 bg-emerald-500/20 text-emerald-400 rounded"><Check size={10} /></button>
                        <button onClick={() => setIsEditingTrail(false)} className="p-1 bg-slate-700 text-slate-400 rounded"><X size={10} /></button>
                    </div>
                ) : (
                    <div 
                        className={`flex items-center justify-between cursor-pointer rounded -mx-1 px-1 py-1 transition-colors group/trail ${isExited ? 'opacity-50 pointer-events-none' : 'hover:bg-slate-800/50'}`}
                        onClick={() => !isExited && setIsEditingTrail(true)}
                    >
                         <div className="flex items-center space-x-1.5">
                            <TrendingUp size={10} className="text-yellow-600" />
                            <span className="text-[10px] text-slate-500 uppercase font-bold">Trail SL</span>
                         </div>
                         <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-yellow-500">{displayTrail ? `₹${displayTrail}` : '--'}</span>
                            {!isExited && <Edit2 size={10} className="text-slate-700" />}
                         </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {showPnL && (
        <div className={`px-5 py-3 flex items-center justify-between border-b border-slate-800 ${
            (signal.pnlPoints || 0) >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5'
        }`}>
            <div className="flex items-center space-x-2">
                <div className={`p-1.5 rounded-full ${(signal.pnlPoints || 0) >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {(signal.pnlPoints || 0) >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isExited ? 'Final Result' : 'Current P&L'}
                  </span>
                  {isExited && signal.lastTradedTimestamp && (
                    <span className="text-[9px] font-mono text-slate-500">EXILED @ {signal.lastTradedTimestamp}</span>
                  )}
                </div>
            </div>
            <div className="text-right">
                 <div className={`text-xl font-mono font-bold leading-none ${(signal.pnlPoints || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(signal.pnlPoints || 0) > 0 ? '+' : ''}{signal.pnlPoints || 0} pts
                 </div>
                 {signal.pnlRupees !== undefined && (
                    <div className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                        {(signal.pnlRupees || 0) > 0 ? '+' : ''}₹{signal.pnlRupees.toLocaleString()}
                    </div>
                 )}
            </div>
        </div>
      )}

      {/* Targets */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
                <Target size={14} className="text-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Targets</span>
            </div>
            <span className="text-[10px] font-mono text-slate-600 italic">RR 1:{riskReward.toFixed(1)}</span>
        </div>
        <div className="flex justify-between space-x-2">
            {signal.targets.map((t, idx) => (
                <div key={idx} className={`flex-1 rounded px-2 py-2 text-center border ${
                    isExited ? 'bg-slate-900 border-slate-800 text-slate-600' : 'bg-slate-950 border-slate-800'
                }`}>
                    <p className="text-[10px] font-bold text-slate-500 mb-1">T{idx + 1}</p>
                    <p className={`text-sm font-mono font-bold ${isExited ? 'text-slate-600' : 'text-blue-400'}`}>{t}</p>
                </div>
            ))}
        </div>

        {signal.comment && (
            <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800/50">
                <p className="text-xs text-slate-400 leading-relaxed">" {signal.comment} "</p>
            </div>
        )}

        {/* AI Action */}
        <div className="mt-4 border-t border-slate-800 pt-3 flex justify-between items-center">
            <div className="flex items-center text-[10px] text-slate-600 font-mono">
                <Clock size={10} className="mr-1" />
                {new Date(signal.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                {!isExited && signal.lastTradedTimestamp && <span className="ml-2 border-l border-slate-800 pl-2">LTT: {signal.lastTradedTimestamp}</span>}
            </div>
            
            <button 
                onClick={handleAIAnalysis}
                disabled={loadingAnalysis}
                className="flex items-center py-1 text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
            >
                <Cpu size={12} className="mr-1.5" />
                {loadingAnalysis ? 'Consulting AI...' : analysis ? 'Close Intel' : 'AI Analysis'}
            </button>
        </div>
        
        {analysis && (
            <div className="mt-2 p-3 bg-slate-950 border border-blue-900/30 rounded text-[10px] text-slate-300 leading-relaxed font-mono">
                <div className="text-blue-400 mb-1 font-bold uppercase tracking-widest text-[9px] border-b border-blue-900/30 pb-1 flex items-center">
                    <Check size={10} className="mr-1" /> Quantitative Analysis Output
                </div>
                {analysis}
            </div>
        )}
      </div>
    </div>
  );
};

export default SignalCard;