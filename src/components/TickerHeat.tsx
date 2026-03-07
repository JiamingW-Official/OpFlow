import { useMemo } from "react";
import { useFlow } from "../context/FlowContext";
import { C, TICKERS, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";

const RANK_MEDALS = ["👑", "🥈", "🥉"];

export default function TickerHeat() {
  const { trades } = useFlow();

  const data = useMemo(() => {
    return TICKERS.map(tk => {
      const tkTrades = trades.filter(t => t.tk === tk);
      const callPrem = tkTrades.filter(t => t.type === "CALL").reduce((s, t) => s + t.total, 0);
      const putPrem = tkTrades.filter(t => t.type === "PUT").reduce((s, t) => s + t.total, 0);
      const total = callPrem + putPrem;
      const ratio = total > 0 ? callPrem / total : 0.5;
      return { tk, total, ratio, count: tkTrades.length };
    }).sort((a, b) => b.total - a.total);
  }, [trades]);

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <PixelCard title="WHO'S HOT" titleIcon="🔥" titleColor={C.gold}>
      <div style={{ padding: "3px 6px", display: "flex", flexDirection: "column", gap: 1, overflow: "hidden", minWidth: 0 }}>
        {data.map((d, i) => {
          const barPct = d.total > 0 ? (d.total / maxTotal) * 100 : 0;
          const isUp = d.ratio >= 0.5;
          const barColor = isUp ? C.call : C.put;

          let vibe: string;
          if (d.count === 0) vibe = "😴 zzz";
          else if (isUp && d.ratio > 0.7) vibe = "🚀 MOON";
          else if (isUp && d.ratio > 0.55) vibe = "😆 hype";
          else if (!isUp && d.ratio < 0.3) vibe = "😱 DUMP";
          else if (!isUp) vibe = "😰 scary";
          else vibe = "😊 ok";

          return (
            <div key={d.tk} style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "3px 2px",
              borderBottom: "1px solid rgba(102,204,255,0.04)",
              overflow: "hidden", minWidth: 0,
            }}>
              <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>
                {i < 3 ? RANK_MEDALS[i] : <span style={{ fontFamily: FONTS.display, fontSize: 6, color: C.dim }}>#{i+1}</span>}
              </span>

              <span style={{
                fontSize: 20, width: 44, flexShrink: 0,
                color: d.count > 0 ? C.bright : C.dim,
                textShadow: d.count > 0 ? `0 0 6px ${C.bright}` : "none",
              }}>
                {d.tk}
              </span>

              {/* Power bar */}
              <div style={{
                flex: 1, height: 12, background: "rgba(102,204,255,0.04)",
                position: "relative", overflow: "hidden", minWidth: 0,
              }}>
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${barPct}%`,
                  background: `linear-gradient(90deg, ${barColor}, ${isUp ? "#88ffcc" : "#ff88bb"})`,
                  opacity: 0.7,
                  boxShadow: barPct > 0 ? `0 0 8px ${barColor}40` : "none",
                  transition: "width 0.3s steps(8)",
                }} />
              </div>

              <span style={{ fontSize: 12, color: C.dim, flexShrink: 0, width: 52, textAlign: "right", overflow: "hidden", whiteSpace: "nowrap" }}>
                {vibe}
              </span>

              <span style={{
                fontSize: 16, flexShrink: 0, width: 40, textAlign: "right",
                color: d.total > 0 ? C.text : "transparent",
                textShadow: d.total > 0 ? `0 0 4px ${barColor}` : "none",
                overflow: "hidden", whiteSpace: "nowrap",
              }}>
                {d.total > 0 ? fmt(d.total) : ""}
              </span>
            </div>
          );
        })}
      </div>
    </PixelCard>
  );
}
