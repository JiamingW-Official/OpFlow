import { useMemo, useState, useEffect } from "react";
import { useFlow } from "../context/FlowContext";
import { C, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";

const TIPS = [
  { icon: "📞", text: "CALL = bet price goes UP. Big call flow = traders are bullish!" },
  { icon: "📉", text: "PUT = bet price goes DOWN. Heavy put flow = bearish signal!" },
  { icon: "⚡", text: "SWEEP = urgent buy across multiple exchanges. Shows serious conviction!" },
  { icon: "🐋", text: "BLOCK = massive single trade ($5M+). Whales move markets — follow them!" },
  { icon: "📊", text: "C/P Ratio > 1.0 = more calls than puts = bullish. < 1.0 = bearish." },
  { icon: "🏢", text: "Building windows: bright green = calls dominate, bright red = puts dominate." },
  { icon: "💰", text: "Premium = price × volume × 100. Bigger premium = stronger conviction!" },
  { icon: "🔥", text: "Sudden spike in a ticker? Smart money might know something!" },
  { icon: "🎯", text: "Near-the-money options = aggressive bet. Far out = cheaper lottery tickets." },
  { icon: "📅", text: "Short expiry = aggressive bet needing a fast move. Long expiry = patient thesis." },
  { icon: "🌊", text: "\"Flow\" = real-time stream of options trades. It shows what big money is doing RIGHT NOW." },
  { icon: "👑", text: "The golden crown marks the hottest window — most money flowing into that strike + expiry." },
];

export default function MarketPulse() {
  const { trades, callRatio } = useFlow();
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 7000);
    return () => clearInterval(id);
  }, []);

  const stats = useMemo(() => {
    let callPrem = 0, putPrem = 0;
    const tickerFlow = new Map<string, number>();
    for (const t of trades.slice(0, 30)) {
      if (t.type === "CALL") callPrem += t.total;
      else putPrem += t.total;
      tickerFlow.set(t.tk, (tickerFlow.get(t.tk) || 0) + t.total);
    }
    let topTicker = "", topFlow = 0;
    for (const [tk, flow] of tickerFlow) {
      if (flow > topFlow) { topTicker = tk; topFlow = flow; }
    }
    const cpRatio = putPrem > 0 ? callPrem / putPrem : callPrem > 0 ? 99 : 1;
    return { callPrem, putPrem, topTicker, topFlow, cpRatio };
  }, [trades]);

  const bullPct = Math.round(callRatio * 100);
  const barSegs = 20;
  const bullSegs = Math.round(callRatio * barSegs);
  const tip = TIPS[tipIdx];
  const isBull = callRatio >= 0.5;

  return (
    <PixelCard title="MARKET PULSE" titleIcon="📊" titleColor={C.accent}>
      <div style={{ padding: "4px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Pixel sentiment bar */}
        <div role="img" aria-label={`Market sentiment: ${bullPct}% bullish, ${100 - bullPct}% bearish`} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span aria-hidden="true" style={{ fontSize: 14, flexShrink: 0 }}>🐂</span>
          <div style={{ flex: 1, display: "flex", height: 10, gap: 1 }}>
            {Array.from({ length: barSegs }, (_, i) => {
              const isEdge = i === bullSegs - 1 || i === bullSegs;
              return (
                <div key={i} className={isEdge ? "seg-edge" : ""} style={{
                  flex: 1,
                  background: i < bullSegs ? C.call : C.put,
                  opacity: i < bullSegs ? 0.85 : 0.65,
                  boxShadow: isEdge ? `0 0 8px ${i < bullSegs ? C.call : C.put}` : undefined,
                }} />
              );
            })}
          </div>
          <span aria-hidden="true" style={{ fontSize: 14, flexShrink: 0 }}>🐻</span>
          <span style={{
            fontSize: 18, fontFamily: FONTS.mono,
            color: isBull ? C.call : C.put,
            textShadow: `0 0 6px ${isBull ? C.call : C.put}`,
            minWidth: 48, textAlign: "right",
          }}>{bullPct}%{isBull ? "↑" : "↓"}</span>
        </div>

        {/* Stats row */}
        <div role="group" aria-label="Market flow statistics" style={{
          display: "flex", gap: 4, fontSize: 15, color: C.dim,
          flexWrap: "wrap", alignItems: "center",
        }}>
          <span title="Total call premium" className={stats.callPrem > stats.putPrem ? "neon-pulse-active" : ""} style={{ color: C.call, textShadow: `0 0 6px ${C.call}40` }}>▲{fmt(stats.callPrem)}</span>
          <span aria-hidden="true" style={{ opacity: 0.2 }}>│</span>
          <span title="Total put premium" className={stats.putPrem > stats.callPrem ? "neon-pulse-active" : ""} style={{ color: C.put, textShadow: `0 0 6px ${C.put}40` }}>▼{fmt(stats.putPrem)}</span>
          {stats.topTicker && <>
            <span aria-hidden="true" style={{ opacity: 0.2 }}>│</span>
            <span title="Most active ticker"  style={{ color: C.gold, textShadow: `0 0 6px ${C.gold}40` }}>👑{stats.topTicker}</span>
          </>}
          <span aria-hidden="true" style={{ opacity: 0.2 }}>│</span>
          <span title={`Call/Put ratio: ${stats.cpRatio >= 1 ? "bullish" : "bearish"}`} style={{ color: stats.cpRatio >= 1 ? C.call : C.put, textShadow: `0 0 4px ${stats.cpRatio >= 1 ? C.call : C.put}40` }}>⚖️{stats.cpRatio.toFixed(1)}</span>
        </div>

        {/* Educational tip — rotates */}
        <div key={tipIdx} className="msg-in" style={{
          padding: "3px 6px",
          background: "rgba(102,204,255,0.04)",
          border: "1px solid rgba(102,204,255,0.08)",
          fontSize: 15, color: C.dim,
          lineHeight: 1.3,
        }}>
          <div style={{
            fontFamily: FONTS.display, fontSize: 8,
            color: C.accent, marginBottom: 2,
            textShadow: `0 0 4px ${C.accent}`,
          }}>💡 DID YOU KNOW?</div>
          <div>{tip.icon} {tip.text}</div>
          <div role="tablist" aria-label="Navigate tips" style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "center" }}>
            {TIPS.map((t, j) => (
              <button key={j} role="tab" aria-label={`Tip ${j + 1}: ${t.text.slice(0, 40)}`} aria-selected={j === tipIdx}
                onClick={() => setTipIdx(j)}
                className={`tip-dot ${j === tipIdx ? "tip-dot-active" : ""}`} style={{
                  width: 6, height: 6, padding: 0, border: "none",
                  background: j === tipIdx ? C.accent : "rgba(102,204,255,0.15)",
                  cursor: "pointer",
                }} />
            ))}
          </div>
        </div>
      </div>
    </PixelCard>
  );
}
