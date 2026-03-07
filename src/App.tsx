import { useCallback, useEffect, useRef, useState } from "react";
import { FlowProvider, useFlow } from "./context/FlowContext";
import { useOptionsStream } from "./hooks/useOptionsStream";
import Header from "./components/Header";
import TapeFlow from "./components/TapeFlow";
import FlowHeatmap from "./components/FlowHeatmap";
import PremiumTimeline from "./components/PremiumTimeline";
import AIAnalyst from "./components/AIAnalyst";
import TickerHeat from "./components/TickerHeat";
import ToastAlert from "./components/ToastAlert";
import CursorTrail from "./components/ui/CursorTrail";
import { C, FONTS } from "./constants/theme";
import type { Trade } from "./types";

function FlowTerminal() {
  const { setTrades, setConnectionStatus, trades } = useFlow();
  const [edgeFlash, setEdgeFlash] = useState(false);
  const [clock, setClock] = useState("");
  const prevCount = useRef(0);
  const fps = useRef(0);
  const frameCount = useRef(0);
  const lastFpsTime = useRef(Date.now());

  const onNewTrade = useCallback((trade: Trade) => {
    if (trade.total > 3e6) {
      window.dispatchEvent(new CustomEvent("flow:megablock", { detail: trade }));
    }
  }, []);

  // Screen edge flash on new trade
  useEffect(() => {
    if (trades.length > prevCount.current && prevCount.current > 0) {
      setEdgeFlash(true);
      const t = setTimeout(() => setEdgeFlash(false), 500);
      return () => clearTimeout(t);
    }
    prevCount.current = trades.length;
  }, [trades.length]);

  // Clock + FPS counter
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-US", { hour12: false }));
      frameCount.current++;
      const elapsed = Date.now() - lastFpsTime.current;
      if (elapsed >= 1000) {
        fps.current = Math.round(frameCount.current * 1000 / elapsed);
        frameCount.current = 0;
        lastFpsTime.current = Date.now();
      }
    };
    const id = setInterval(tick, 250);
    tick();
    return () => clearInterval(id);
  }, []);

  useOptionsStream({ setTrades, setConnectionStatus, onNewTrade });

  return (
    <div style={{
      position: "relative", width: "100vw", height: "100vh", overflow: "hidden",
      fontFamily: "'VT323', monospace", color: "#eeeeff",
      background: "#0f0e17",
      backgroundImage: `
        linear-gradient(rgba(255,136,187,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(102,204,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: "16px 16px",
    }}>
      <div style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 8,
        padding: 10,
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
      }}>
        <Header />

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr 1.2fr",
          gap: 8,
          overflow: "hidden",
          minHeight: 0,
          minWidth: 0,
        }}>
          <TapeFlow />

          <div style={{
            display: "grid",
            gridTemplateRows: "1fr 150px",
            gap: 8,
            overflow: "hidden",
            minHeight: 0,
            minWidth: 0,
          }}>
            <FlowHeatmap />
            <PremiumTimeline />
          </div>

          <div style={{
            display: "grid",
            gridTemplateRows: "auto auto 1fr",
            gap: 8,
            overflow: "hidden",
            minHeight: 0,
            minWidth: 0,
          }}>
            <ToastAlert />
            <TickerHeat />
            <AIAnalyst />
          </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: 16,
        background: "linear-gradient(90deg, rgba(102,204,255,0.04), rgba(204,136,255,0.04), rgba(255,136,187,0.04))",
        borderTop: "1px solid rgba(102,204,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 8px",
        fontFamily: FONTS.display, fontSize: 6, color: C.dim,
        pointerEvents: "none", zIndex: 101,
        letterSpacing: 1,
      }}>
        <span>FLOW ARCADE v2.0</span>
        <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span>{trades.length} TRADES</span>
          <span style={{ color: C.accent }}>{clock}</span>
        </span>
      </div>

      {/* Screen edge flash on new trade */}
      {edgeFlash && (
        <div className="edge-flash" style={{
          position: "fixed", inset: 0,
          pointerEvents: "none", zIndex: 9997,
        }} />
      )}

      {/* Corner HUD decorations */}
      <div style={{ position: "fixed", top: 4, left: 4, fontSize: 8, fontFamily: FONTS.display, color: "rgba(102,204,255,0.12)", pointerEvents: "none", zIndex: 100 }}>
        ┌──
      </div>
      <div style={{ position: "fixed", top: 4, right: 4, fontSize: 8, fontFamily: FONTS.display, color: "rgba(102,204,255,0.12)", pointerEvents: "none", zIndex: 100 }}>
        ──┐
      </div>
      <div style={{ position: "fixed", bottom: 18, left: 4, fontSize: 8, fontFamily: FONTS.display, color: "rgba(102,204,255,0.12)", pointerEvents: "none", zIndex: 100 }}>
        └──
      </div>
      <div style={{ position: "fixed", bottom: 18, right: 4, fontSize: 8, fontFamily: FONTS.display, color: "rgba(102,204,255,0.12)", pointerEvents: "none", zIndex: 100, textAlign: "right" }}>
        ──┘
      </div>

      {/* Cursor trail particles */}
      <CursorTrail />

      {/* CRT scanline + vignette overlay */}
      <div className="crt-overlay" />
    </div>
  );
}

export default function App() {
  return (
    <FlowProvider>
      <FlowTerminal />
    </FlowProvider>
  );
}
