import { memo, useCallback, useEffect, useRef, useState } from "react";
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
import MilestonePopup from "./components/MilestonePopup";
import { C, FONTS } from "./constants/theme";
import { playWhale } from "./lib/sounds";
import type { Trade } from "./types";

// Isolated footer — clock updates here don't re-render the main grid
function StatusBar() {
  const { trades } = useFlow();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString("en-US", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 16,
      background: "linear-gradient(90deg, rgba(102,204,255,0.04), rgba(204,136,255,0.04), rgba(255,136,187,0.04))",
      borderTop: "1px solid rgba(102,204,255,0.08)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 8px",
      fontFamily: FONTS.display, fontSize: 8, color: C.dim,
      pointerEvents: "none", zIndex: 101,
      letterSpacing: 1,
    }}>
      <span>FLOW ARCADE v2.0</span>
      <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span>{trades.length} TRADES</span>
        <span style={{ color: C.accent }}>{clock}</span>
      </span>
    </div>
  );
}

// Static decorations — never re-render
const HUD_STYLE = { fontSize: 10, fontFamily: FONTS.display, color: "rgba(102,204,255,0.12)", pointerEvents: "none" as const, zIndex: 100 };

const CornerHUD = memo(function CornerHUD() {
  return (
    <>
      <div style={{ position: "fixed", top: 4, left: 4, ...HUD_STYLE }}>┌──</div>
      <div style={{ position: "fixed", top: 4, right: 4, ...HUD_STYLE }}>──┐</div>
      <div style={{ position: "fixed", bottom: 18, left: 4, ...HUD_STYLE }}>└──</div>
      <div style={{ position: "fixed", bottom: 18, right: 4, ...HUD_STYLE, textAlign: "right" }}>──┘</div>
    </>
  );
});

function FlowTerminal() {
  const { setTrades, setConnectionStatus, trades } = useFlow();
  const [edgeFlash, setEdgeFlash] = useState(false);
  const [shaking, setShaking] = useState(false);
  const prevCount = useRef(0);
  const whaleCount = useRef(0);

  const onNewTrade = useCallback((trade: Trade) => {
    if (trade.total > 10e6) {
      window.dispatchEvent(new CustomEvent("flow:megablock", { detail: trade }));
      playWhale();
      setShaking(true);
      setTimeout(() => setShaking(false), 400);
      whaleCount.current++;
      if (whaleCount.current === 1) {
        window.dispatchEvent(new CustomEvent("flow:milestone", {
          detail: { key: "first-whale", emoji: "\uD83D\uDC33", text: "FIRST WHALE SPOTTED!" },
        }));
      }
    }
  }, []);

  // Screen edge flash only on large trades ($2M+)
  useEffect(() => {
    if (trades.length > prevCount.current && prevCount.current > 0) {
      const latest = trades[0];
      if (latest && latest.total > 2e6) {
        setEdgeFlash(true);
        const t = setTimeout(() => setEdgeFlash(false), 500);
        prevCount.current = trades.length;
        return () => clearTimeout(t);
      }
    }
    prevCount.current = trades.length;
  }, [trades]);

  useOptionsStream({ setTrades, setConnectionStatus, onNewTrade });

  return (
    <div className={shaking ? "whale-shake" : ""} style={{
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

      <StatusBar />

      {/* Screen edge flash on new trade */}
      {edgeFlash && (
        <div className="edge-flash" style={{
          position: "fixed", inset: 0,
          pointerEvents: "none", zIndex: 9997,
        }} />
      )}

      <CornerHUD />
      <MilestonePopup />
      <CursorTrail />
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
