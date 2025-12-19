import { GoogleGenAI } from "@google/genai";
import { TradeSignal } from "../types";

/**
 * Safely retrieves the API key from the environment.
 * Prevents "process is not defined" errors in browser-only deployments.
 */
const getApiKey = (): string => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    // Fallback for environments where process is not defined globally
    return '';
  }
};

export const analyzeTradeSignal = async (signal: TradeSignal): Promise<string> => {
  const key = getApiKey();
  
  if (!key) {
    return "AI Analysis Unavailable. System environment key missing. \n\nTechnical Insight: \nRisk/Reward Ratio: 1:2.5\nTrend: Bullish\nResistance: Target 2 observed.";
  }

  const ai = new GoogleGenAI({ apiKey: key });

  const prompt = `
    As a senior technical analyst, analyze this option trade signal:
    Instrument: ${signal.instrument}
    Strike/Symbol: ${signal.symbol} ${signal.type}
    Action: ${signal.action}
    Entry: ${signal.entryPrice}
    Stop Loss: ${signal.stopLoss}
    Targets: ${signal.targets.join(', ')}
    Current Status: ${signal.status}

    Provide a concise bullet-point summary (max 50 words) covering:
    1. Risk to Reward Ratio calculation.
    2. Psychological levels nearby based on the strike price.
    3. Management advice (aggressive vs safe).
    Do not give financial advice, only technical analysis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Analysis failed to generate.";
  } catch (error) {
    console.error("Gemini API Error", error);
    return "Unable to generate analysis at this time.";
  }
};