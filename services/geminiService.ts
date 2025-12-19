import { GoogleGenAI } from "@google/genai";
import { TradeSignal } from "../types";

// The API key is obtained exclusively from the environment variable.
const API_KEY = process.env.API_KEY || ''; 

export const analyzeTradeSignal = async (signal: TradeSignal): Promise<string> => {
  if (!process.env.API_KEY) {
    return "AI Analysis Unavailable. System environment key missing. \n\nMock Analysis: \nRisk/Reward Ratio: 1:2.5\nTrend: Bullish\nKey Resistance: Target 2 level.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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