import { useEffect, useRef } from "react";
import type { Trade, ConnectionStatus } from "../types";
import { gen } from "../lib/format";

interface UseOptionsStreamOptions {
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>;
  setConnectionStatus: React.Dispatch<React.SetStateAction<ConnectionStatus>>;
  onNewTrade?: (trade: Trade) => void;
}

export function useOptionsStream({ setTrades, setConnectionStatus, onNewTrade }: UseOptionsStreamOptions) {
  const onNewTradeRef = useRef(onNewTrade);
  onNewTradeRef.current = onNewTrade;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_POLYGON_KEY as string | undefined;

    if (apiKey) {
      // WebSocket mode
      setConnectionStatus("connecting");
      const ws = new WebSocket("wss://socket.polygon.io/options");

      ws.onopen = () => {
        ws.send(JSON.stringify({ action: "auth", params: apiKey }));
      };

      ws.onmessage = (e) => {
        const msgs = JSON.parse(e.data);
        for (const m of msgs) {
          if (m.ev === "status" && m.status === "auth_success") {
            setConnectionStatus("connected");
            ws.send(JSON.stringify({ action: "subscribe", params: "T.O:*" }));
          }
          if (m.ev === "T") {
            const ticker = m.sym?.replace("O:", "").split(/\d/)[0] || "UNK";
            const trade: Trade = {
              id: Date.now() + Math.random(),
              tk: ticker,
              type: m.details?.contract_type?.toUpperCase() === "PUT" ? "PUT" : "CALL",
              strike: m.details?.strike_price || 0,
              vol: m.s || 0,
              prem: m.p || 0,
              total: (m.s || 0) * (m.p || 0) * 100,
              exp: m.details?.expiration_date || "",
              moneyness: m.details?.strike_price && m.bp ? m.details.strike_price / m.bp : 1,
              isBlock: (m.s || 0) * (m.p || 0) * 100 > 1.8e6,
              isSweep: (m.s || 0) > 5200,
              time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            };
            setTrades(prev => [trade, ...prev.slice(0, 59)]);
            onNewTradeRef.current?.(trade);
          }
        }
      };

      ws.onerror = () => setConnectionStatus("disconnected");
      ws.onclose = () => {
        setConnectionStatus("disconnected");
        // Fallback to mock on WS failure
        startMock();
      };

      return () => {
        ws.close();
      };
    }

    // Mock mode
    const cleanup = startMock();
    return cleanup;

    function startMock() {
      setConnectionStatus("connected");
      const id = setInterval(() => {
        const trade = gen();
        setTrades(prev => [trade, ...prev.slice(0, 59)]);
        onNewTradeRef.current?.(trade);
      }, 1100 + Math.random() * 900);
      return () => clearInterval(id);
    }
  }, [setTrades, setConnectionStatus]);
}
