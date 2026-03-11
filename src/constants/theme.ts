export const C = {
  bg: "#0f0e17",
  panel: "#1a1a2e",
  border: "#66ccff",
  call: "#00ff88",
  put: "#ff3366",
  accent: "#66ccff",
  gold: "#ffdd66",
  violet: "#cc88ff",
  pink: "#ff88bb",
  dim: "#8888aa",
  text: "#eeeeff",
  bright: "#ffffff",
} as const;

export const TICKERS = ["NVDA", "SPY", "AAPL", "TSLA", "META", "QQQ", "AMD", "MSFT", "GOOGL", "TSM"] as const;

export const BASE: Record<string, number> = {
  NVDA: 875, SPY: 542, AAPL: 195, TSLA: 248, META: 512,
  QQQ: 468, AMD: 178, MSFT: 418, GOOGL: 175, TSM: 165,
};

export const EXPIRIES = ["03/14", "03/21", "03/28", "04/04", "04/17", "05/16", "06/20"] as const;

export const FONTS = {
  display: "'Press Start 2P', monospace",
  mono: "'VT323', monospace",
} as const;
