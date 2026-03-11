import type { Trade } from "../types";
import { TICKERS, BASE, EXPIRIES } from "../constants/theme";

let uid = 0;

export function fmt(n: number): string {
  return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(0)}K`;
}

// Seeded PRNG — same date = same initial data
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Realistic ticker weights — NVDA & SPY dominate options flow
const TICKER_WEIGHTS: Record<string, number> = {
  NVDA: 22, SPY: 18, TSLA: 12, QQQ: 10, AAPL: 9,
  META: 8, AMD: 7, MSFT: 6, GOOGL: 5, TSM: 3,
};
const TICKER_CDF: { tk: string; cum: number }[] = [];
{
  let sum = 0;
  for (const tk of TICKERS) { sum += TICKER_WEIGHTS[tk] || 1; TICKER_CDF.push({ tk, cum: sum }); }
  for (const e of TICKER_CDF) e.cum /= sum;
}

// Expiry weights — near-term gets more flow
const EXPIRY_WEIGHTS = [20, 18, 14, 12, 8, 5, 3]; // matches EXPIRIES order
const EXPIRY_CDF: { exp: string; cum: number }[] = [];
{
  let sum = 0;
  for (let i = 0; i < EXPIRIES.length; i++) {
    sum += EXPIRY_WEIGHTS[i] || 1;
    EXPIRY_CDF.push({ exp: EXPIRIES[i], cum: sum });
  }
  for (const e of EXPIRY_CDF) e.cum /= sum;
}

function pickWeighted(cdf: { cum: number }[], rng: number): number {
  for (let i = 0; i < cdf.length; i++) if (rng < cdf[i].cum) return i;
  return cdf.length - 1;
}

function makeTrade(rng: () => number): Trade {
  const tk = TICKER_CDF[pickWeighted(TICKER_CDF, rng())].tk;
  const type = rng() > 0.47 ? "CALL" : "PUT";
  const bp = BASE[tk];
  const strike = Math.round(bp * (0.86 + rng() * 0.28) / 5) * 5;
  const vol = ~~(rng() ** 2 * 4000) + 30;
  const prem = +(rng() ** 2 * 28 + 0.2).toFixed(2);
  const total = vol * prem * 100;
  const exp = EXPIRY_CDF[pickWeighted(EXPIRY_CDF, rng())].exp;
  return {
    id: uid++,
    tk, type, strike, vol, prem, total, exp,
    moneyness: strike / bp,
    isBlock: total > 5e6,
    isSweep: vol > 2500,
    time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

// Live stream uses Math.random (non-seeded)
export function gen(): Trade {
  return makeTrade(Math.random);
}

// Session storage key
const STORAGE_KEY = "opflow_trades";

export function generateInitialTrades(count: number): Trade[] {
  // Try restoring from session
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Trade[];
      if (parsed.length > 0) {
        uid = Math.max(...parsed.map(t => t.id)) + 1;
        return parsed;
      }
    }
  } catch { /* ignore */ }

  // Seeded by today's date — same day = same initial snapshot
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const rng = mulberry32(seed);
  return Array.from({ length: count }, () => makeTrade(rng));
}

export function persistTrades(trades: Trade[]) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trades.slice(0, 60))); } catch { /* ignore */ }
}
