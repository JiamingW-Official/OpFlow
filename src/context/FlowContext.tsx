import { createContext, useContext, useState, useRef, useMemo, type ReactNode } from "react";
import type { Trade, Filters, ConnectionStatus } from "../types";
import { generateInitialTrades } from "../lib/format";

interface FlowContextValue {
  trades: Trade[];
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  tradesRef: React.RefObject<Trade[]>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>;
  // derived
  filtered: Trade[];
  totalPrem: number;
  callRatio: number;
  blocks: number;
  sweeps: number;
  vizCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const FlowContext = createContext<FlowContextValue | null>(null);

export function FlowProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>(() => generateInitialTrades(35));
  const [filters, setFilters] = useState<Filters>({
    type: "ALL",
    minPremium: 0,
    expiry: "all",
    tickers: [],
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");

  const tradesRef = useRef<Trade[]>(trades);
  tradesRef.current = trades;

  const vizCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const derived = useMemo(() => {
    const len = Math.min(trades.length, 30);
    let totalPrem = 0, calls = 0, blocks = 0, sweeps = 0;
    for (let i = 0; i < len; i++) {
      const t = trades[i];
      totalPrem += t.total;
      if (t.type === "CALL") calls++;
      if (t.isBlock) blocks++;
      if (t.isSweep) sweeps++;
    }
    return { totalPrem, callRatio: len > 0 ? calls / len : 0.5, blocks, sweeps };
  }, [trades]);

  const filtered = useMemo(() => {
    let result = trades;
    if (filters.type !== "ALL") {
      result = result.filter(t => t.type === filters.type);
    }
    if (filters.minPremium > 0) {
      result = result.filter(t => t.total >= filters.minPremium);
    }
    if (filters.tickers.length > 0) {
      result = result.filter(t => filters.tickers.includes(t.tk));
    }
    return result;
  }, [trades, filters]);

  const value = useMemo<FlowContextValue>(() => ({
    trades, setTrades, tradesRef, filters, setFilters,
    connectionStatus, setConnectionStatus,
    filtered, vizCanvasRef,
    ...derived,
  }), [trades, filters, connectionStatus, filtered, derived]);

  return <FlowContext.Provider value={value}>{children}</FlowContext.Provider>;
}

export function useFlow(): FlowContextValue {
  const ctx = useContext(FlowContext);
  if (!ctx) throw new Error("useFlow must be used within FlowProvider");
  return ctx;
}
