import { TradeSignal, TradeStatus, InstrumentType, OptionType, User, PnLStats, WatchlistItem } from './types';

// In a real app, this comes from Firebase Auth context
export const MOCK_USER: User = {
  id: 'USR-9928',
  phoneNumber: '+919876543210',
  name: 'Demo Trader',
  expiryDate: '2024-12-31',
  isAdmin: true
};

export const MOCK_SIGNALS: TradeSignal[] = [
  {
    id: 'SIG-001',
    instrument: 'BANKNIFTY',
    symbol: '47500',
    type: OptionType.CE,
    action: 'BUY',
    entryPrice: 320,
    stopLoss: 280,
    targets: [360, 400, 480],
    trailingSL: 340,
    status: TradeStatus.ACTIVE,
    timestamp: new Date().toISOString(),
    comment: 'Strong breakout above VWAP'
  },
  {
    id: 'SIG-002',
    instrument: 'NIFTY',
    symbol: '22100',
    type: OptionType.PE,
    action: 'BUY',
    entryPrice: 110,
    stopLoss: 90,
    targets: [130, 150, 180],
    status: TradeStatus.PARTIAL,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    pnlPoints: 40,
    comment: 'Target 1 Done, Safe traders book full'
  },
  {
    id: 'SIG-003',
    instrument: 'RELIANCE',
    symbol: 'FUT',
    type: OptionType.FUT,
    action: 'SELL',
    entryPrice: 2950,
    stopLoss: 2980,
    targets: [2900, 2850],
    status: TradeStatus.EXITED,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    pnlPoints: 50
  }
];

export const MOCK_STATS: PnLStats = {
  totalTrades: 42,
  winRate: 78.5,
  netPoints: 1250,
  estimatedPnL: 62500,
  accuracy: 82
};

export const MOCK_WATCHLIST: WatchlistItem[] = [
  { symbol: 'NIFTY 50', price: 22450.30, change: 0.45, isPositive: true, lastUpdated: '15:30' },
  { symbol: 'BANKNIFTY', price: 47820.10, change: -0.12, isPositive: false, lastUpdated: '15:31' },
  { symbol: 'INDIA VIX', price: 13.45, change: -2.30, isPositive: false, lastUpdated: '15:29' },
  { symbol: 'HDFCBANK', price: 1450.00, change: 1.20, isPositive: true, lastUpdated: '15:30' },
  { symbol: 'RELIANCE', price: 2960.50, change: 0.80, isPositive: true, lastUpdated: '15:32' },
];

export const SEBI_DISCLAIMER = "Investment in securities market are subject to market risks. Read all the related documents carefully before investing. Registration granted by SEBI, membership of BASL (in case of IAs) and certification from NISM in no way guarantee performance of the intermediary or provide any assurance of returns to investors.";