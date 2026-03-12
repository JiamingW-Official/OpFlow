import { useState, useEffect, useCallback } from "react";
import { C, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
import type { Trade } from "../types";

interface Toast {
  id: number;
  trade: Trade;
  removing: boolean;
}

export default function ToastAlert() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [whaleCount, setWhaleCount] = useState(0);

  const addToast = useCallback((trade: Trade) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-2), { id, trade, removing: false }]);
    setWhaleCount(p => p + 1);

    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    }, 6000);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const trade = (e as CustomEvent<Trade>).detail;
      addToast(trade);
    };
    window.addEventListener("flow:megablock", handler);
    return () => window.removeEventListener("flow:megablock", handler);
  }, [addToast]);

  const title = whaleCount > 0 ? `WHALE WATCH x${whaleCount}` : "WHALE WATCH";

  return (
    <PixelCard title={title} titleIcon="🐋" titleColor={C.gold}>
      <div style={{
        padding: "4px 8px",
        minHeight: 44,
        maxHeight: 130,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}>
        {toasts.length === 0 ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, padding: "4px 0",
            fontFamily: FONTS.mono,
          }}>
            <span className="pixel-bounce" style={{ fontSize: 20 }}>🌊</span>
            <div>
              <div style={{ fontSize: 18, color: C.dim, textShadow: `0 0 6px ${C.dim}` }}>
                No whales yet~
              </div>
              <div style={{ fontSize: 14, color: C.dim }}>
                Big bets ($3M+) show here!
              </div>
            </div>
          </div>
        ) : (
          toasts.map(toast => {
            const dir = toast.trade.type === "CALL";
            const dirColor = dir ? C.call : C.put;
            return (
              <div key={toast.id} className={toast.removing ? "toast-out" : "toast-in"} style={{
                padding: "4px 8px",
                background: "rgba(255,221,102,0.06)",
                border: `2px solid ${C.gold}`,
                boxShadow: `0 0 16px ${C.gold}50, 0 0 30px ${C.gold}20`,
                fontFamily: FONTS.mono,
                overflow: "hidden",
              }}>
                <div style={{
                  fontFamily: FONTS.display, fontSize: 9, color: C.gold,
                  textShadow: `0 0 8px ${C.gold}`, marginBottom: 2,
                }}>
                  <span className="pixel-bounce" style={{ fontSize: 18, verticalAlign: "middle" }}>🐋</span> WHALE INCOMING!
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: 20, color: C.bright,
                    textShadow: `0 0 8px ${C.bright}`,
                  }}>{toast.trade.tk}</span>
                  <span style={{
                    fontSize: 16, color: dirColor,
                    textShadow: `0 0 6px ${dirColor}`,
                  }}>
                    {dir ? "📈UP" : "📉DN"}
                  </span>
                  <span style={{
                    fontSize: 20, color: C.gold, marginLeft: "auto",
                    textShadow: `0 0 10px ${C.gold}`,
                  }}>{fmt(toast.trade.total)}</span>
                </div>
                <div style={{ fontSize: 14, color: C.dim }}>
                  🐋 BIG bet! ${toast.trade.strike}
                </div>
              </div>
            );
          })
        )}
      </div>
    </PixelCard>
  );
}
