import { TradeSignal, WatchlistItem, User } from '../types';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyFbphSzUzTcjwiqGs3EdCcg2y67fOhmvuq65cXLSvaUJXFRDyrMTJkm6OdrVNPMk_A/exec';

export interface SheetData {
  signals: TradeSignal[];
  watchlist: WatchlistItem[];
  users: User[];
}

const robustParseJson = (text: string) => {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (e) {
    const jsonMatch = trimmed.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        throw new Error("Invalid JSON structure.");
      }
    }
    throw new Error("Invalid response format.");
  }
};

export const fetchSheetData = async (): Promise<SheetData | null> => {
  if (!SCRIPT_URL) return null;

  try {
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rawText = await response.text();
    if (rawText.includes('<!DOCTYPE')) throw new Error("CORS_PERMISSION_DENIED");

    const data = robustParseJson(rawText);
    
    const formattedSignals = (data.signals || []).map((s: any) => ({
      ...s,
      entryPrice: Number(s.entryPrice || 0),
      stopLoss: Number(s.stopLoss || 0),
      targets: Array.isArray(s.targets) ? s.targets.map(Number) : [Number(s.targets || 0)],
      action: (s.action || 'BUY') as 'BUY' | 'SELL',
      status: (s.status || 'ACTIVE') as any,
    }));

    const formattedWatch = (data.watchlist || []).map((w: any) => ({
      ...w,
      price: Number(w.price || 0),
      change: Number(w.change || 0),
    }));

    const formattedUsers = (data.users || []).map((u: any) => ({
      ...u,
      name: u.name || 'Premium Client',
      phoneNumber: String(u.phoneNumber || ''),
      isAdmin: String(u.isAdmin || 'false').toLowerCase() === 'true',
    }));

    return {
      signals: formattedSignals,
      watchlist: formattedWatch,
      users: formattedUsers
    };
  } catch (error: any) {
    console.error("Sync Error:", error.message);
    throw error;
  }
};

export const updateSheetData = async (
  target: 'signals' | 'watchlist' | 'users', 
  action: 'ADD' | 'UPDATE_SIGNAL' | 'UPDATE_USER' | 'DELETE_USER', 
  payload: any, 
  id?: string
) => {
  if (!SCRIPT_URL) return false;

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ target, action, payload, id })
    });
    return true;
  } catch (error) {
    console.error("Update failed:", error);
    return false;
  }
};