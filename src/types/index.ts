export interface Trade {
  id: number;
  tk: string;
  type: "CALL" | "PUT";
  strike: number;
  vol: number;
  prem: number;
  total: number;
  exp: string;
  moneyness: number;
  isBlock: boolean;
  isSweep: boolean;
  time: string;
}

export interface Message {
  r: "ai" | "user";
  t: string;
}

export type FilterType = "ALL" | "CALL" | "PUT";

export type ConnectionStatus = "connected" | "connecting" | "disconnected";

export interface Filters {
  type: FilterType;
  minPremium: number;
  expiry: "all" | "week" | "month";
  tickers: string[];
}
