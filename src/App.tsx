import { useCallback } from "react";
import { FlowProvider, useFlow } from "./context/FlowContext";
import { useOptionsStream } from "./hooks/useOptionsStream";
import Header from "./components/Header";
import TapeFlow from "./components/TapeFlow";
import FlowHeatmap from "./components/FlowHeatmap";
import PremiumTimeline from "./components/PremiumTimeline";
import AIAnalyst from "./components/AIAnalyst";
import TickerHeat from "./components/TickerHeat";
import ToastAlert from "./components/ToastAlert";
import type { Trade } from "./types";

function FlowTerminal() {
  const { setTrades, setConnectionStatus } = useFlow();

  const onNewTrade = useCallback((trade: Trade) => {
    if (trade.total > 3e6) {
      window.dispatchEvent(new CustomEvent("flow:megablock", { detail: trade }));
    }
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
