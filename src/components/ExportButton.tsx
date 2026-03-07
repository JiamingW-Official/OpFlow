import { useCallback } from "react";
import { useFlow } from "../context/FlowContext";
import { C } from "../constants/theme";
import { fmt } from "../lib/format";

export default function ExportButton() {
  const { trades, vizCanvasRef } = useFlow();

  const handleExport = useCallback(() => {
    const canvas = vizCanvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "flow-snapshot.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    }

    const top10 = [...trades]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map(t => ({
        ticker: t.tk, type: t.type, strike: t.strike, expiry: t.exp,
        volume: t.vol, premium: fmt(t.total), total_raw: t.total,
        isBlock: t.isBlock, isSweep: t.isSweep, time: t.time,
      }));

    const blob = new Blob([JSON.stringify(top10, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "flow-data.json";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  }, [trades, vizCanvasRef]);

  return (
    <button onClick={handleExport} style={{
      padding: "5px 10px", fontSize: 26,
      background: "transparent",
      border: `2px solid ${C.accent}`,
      color: C.accent, cursor: "pointer",
      fontFamily: "'VT323', monospace",
      textShadow: `0 0 6px ${C.accent}`,
    }}
      onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(102,204,255,0.15)"; (e.target as HTMLElement).style.textShadow = `0 0 12px ${C.accent}`; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; (e.target as HTMLElement).style.textShadow = `0 0 6px ${C.accent}`; }}>
      💾 SAVE
    </button>
  );
}
