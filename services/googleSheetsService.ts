import { TradeSignal, WatchlistItem } from '../types';

/**
 * 🛠️ PRODUCTION SCRIPT URL:
 * User provided: https://script.google.com/macros/s/AKfycbyzmnhEsjwlQcxfchobNHnpRSe9H8cNWAuxTEblsWxLLyXiNH18D_JxaMDhV9QwJ8l5/exec
 */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyzmnhEsjwlQcxfchobNHnpRSe9H8cNWAuxTEblsWxLLyXiNH18D_JxaMDhV9QwJ8l5/exec';

export interface SheetData {
  signals: TradeSignal[];
  watchlist: WatchlistItem[];
  users: any[];
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
    throw new Error("The script returned HTML instead of JSON. Check 'Who has access: Anyone'.");
  }
};

export const fetchSheetData = async (): Promise<SheetData | null> => {
  if (!SCRIPT_URL || SCRIPT_URL.includes('REPLACE_WITH_ACTUAL')) {
    return null;
  }

  try {
    /**
     * Google Apps Script CORS Best Practices:
     * 1. No custom headers (prevents OPTIONS preflight)
     * 2. Use 'redirect: follow' (essential as Google redirects the request)
     * 3. Append timestamp to bypass aggressive browser caching
     */
    const response = await fetch(`${SCRIPT_URL}?t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const rawText = await response.text();
    
    // If the response is HTML, it means Google is showing a Login Screen or an Error Screen
    if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
      throw new Error("CORS_PERMISSION_DENIED");
    }

    const data = robustParseJson(rawText);
    
    if (!data) throw new Error("Empty Response");

    const formattedSignals = (data.signals || []).map((s: any) => ({
      ...s,
      entryPrice: Number(s.entryPrice || 0),
      stopLoss: Number(s.stopLoss || 0),
      targets: typeof s.targets === 'string' 
        ? s.targets.split(',').map((t: string) => Number(t.trim())) 
        : Array.isArray(s.targets) ? s.targets.map(Number) : [Number(s.targets || 0)],
      pnlPoints: s.pnlPoints ? Number(s.pnlPoints) : undefined,
      pnlRupees: s.pnlRupees ? Number(s.pnlRupees) : undefined,
      trailingSL: s.trailingSL ? Number(s.trailingSL) : undefined,
      action: (s.action || 'BUY') as 'BUY' | 'SELL',
      status: (s.status || 'ACTIVE') as any,
      timestamp: s.timestamp || new Date().toISOString()
    }));

    const formattedWatch = (data.watchlist || []).map((w: any) => ({
      ...w,
      price: Number(w.price || 0),
      change: Number(w.change || 0),
      isPositive: String(w.isPositive).toLowerCase() === 'true'
    }));

    return {
      signals: formattedSignals,
      watchlist: formattedWatch,
      users: data.users || []
    };
  } catch (error: any) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message === 'CORS_PERMISSION_DENIED') {
      console.error("Connectivity Issue: Likely Google Script Deployment settings.");
      throw new Error("CORS_BLOCK");
    }
    console.error("Sync Error:", error.message);
    return null;
  }
};

export const updateSheetData = async (target: 'signals' | 'watchlist', action: 'ADD' | 'UPDATE_SIGNAL', payload: any, id?: string) => {
  if (!SCRIPT_URL) return false;

  try {
    // POST to Google Script works best with 'no-cors' for fire-and-forget updates
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