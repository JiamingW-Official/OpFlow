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
    const recent = trades.slice(0, 30);
    const totalPrem = recent.reduce((s, t) => s + t.total, 0);
    const callRatio = recent.length > 0 ? recent.filter(t => t.type === "CALL").length / recent.length : 0.5;
    const blocks = recent.filter(t => t.isBlock).length;
    const sweeps = recent.filter(t => t.isSweep).length;
    return { totalPrem, callRatio, blocks, sweeps };
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
