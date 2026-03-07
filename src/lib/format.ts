import type { Trade } from "../types";
import { TICKERS, BASE, EXPIRIES } from "../constants/theme";

let uid = 0;

export function fmt(n: number): string {
  return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(0)}K`;
}

export function gen(): Trade {
  const tk = TICKERS[~~(Math.random() * TICKERS.length)];
  const type = Math.random() > 0.47 ? "CALL" : "PUT";
  const bp = BASE[tk];
  const strike = Math.round(bp * (0.86 + Math.random() * 0.28) / 5) * 5;
  // Skewed distribution — most trades small, occasional large ones
  const vol = ~~(Math.random() ** 2 * 4000) + 30;
  const prem = +(Math.random() ** 2 * 28 + 0.2).toFixed(2);
  const total = vol * prem * 100;
  const exp = EXPIRIES[~~(Math.random() * EXPIRIES.length)];
  return {
    id: uid++,
    tk, type, strike, vol, prem, total, exp,
    moneyness: strike / bp,
    isBlock: total > 5e6,
    isSweep: vol > 2500,
    time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

export function generateInitialTrades(count: number): Trade[] {
  return Array.from({ length: count }, gen);
}
