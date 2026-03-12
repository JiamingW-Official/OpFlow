import { useMemo } from "react";
import { useFlow } from "../context/FlowContext";
import { C, TICKERS, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";

const RANK_MEDALS = ["👑", "🥈", "🥉"];

export default function TickerHeat() {
  const { trades } = useFlow();

  const data = useMemo(() => {
    // Single pass through trades to aggregate per ticker
    const agg = new Map<string, { callPrem: number; putPrem: number; count: number }>();
    for (const tk of TICKERS) agg.set(tk, { callPrem: 0, putPrem: 0, count: 0 });
    for (const t of trades) {
      const a = agg.get(t.tk);
      if (!a) continue;
      a.count++;
      if (t.type === "CALL") a.callPrem += t.total;
      else a.putPrem += t.total;
    }
    return TICKERS.map(tk => {
      const a = agg.get(tk)!;
      const total = a.callPrem + a.putPrem;
      return { tk, total, ratio: total > 0 ? a.callPrem / total : 0.5, count: a.count };
    }).sort((a, b) => b.total - a.total).slice(0, 7);
  }, [trades]);

  const maxTotal = Math.max(...data.map(d => d.total), 1);

  return (
    <PixelCard title="WHO'S HOT" titleIcon="🔥" titleColor={C.gold}>
      <div style={{ padding: "3px 6px", display: "flex", flexDirection: "column", gap: 1, overflow: "hidden", minWidth: 0 }}>
        {data.map((d, i) => {
          const barPct = d.total > 0 ? (d.total / maxTotal) * 100 : 0;
          const isUp = d.ratio >= 0.5;
          const barColor = isUp ? C.call : C.put;

          let vibe: string, vibeColor: string, vibeClass = "";
          if (d.count === 0) { vibe = "😴 zzz"; vibeColor = C.dim; }
          else if (isUp && d.ratio > 0.7) { vibe = "🚀 MOON"; vibeColor = C.call; vibeClass = "vibe-hot"; }
          else if (isUp && d.ratio > 0.55) { vibe = "😆 hype"; vibeColor = C.call; }
          else if (!isUp && d.ratio < 0.3) { vibe = "😱 DUMP"; vibeColor = C.put; vibeClass = "vibe-hot"; }
          else if (!isUp) { vibe = "😰 scary"; vibeColor = C.put; }
          else { vibe = "😊 ok"; vibeColor = C.accent; }

          return (
            <div key={d.tk} className={`ticker-row ${i === 0 && d.total > 0 ? "ticker-row-top" : ""}`} style={{
              display: "flex", alignItems: "center", gap: 3,
              padding: "2px 2px",
              borderBottom: "1px solid rgba(102,204,255,0.04)",
              overflow: "hidden", minWidth: 0,
              background: i === 0 && d.total > 0
                ? `linear-gradient(90deg, ${barColor}12, ${barColor}04, transparent)`
                : i < 3 && d.total > 0
                  ? `linear-gradient(90deg, ${barColor}06, transparent)`
                  : undefined,
              borderLeft: i < 3 && d.total > 0 ? `3px solid ${barColor}60` : "3px solid transparent",
            }}>
              <span style={{ fontSize: 14, width: 20, textAlign: "center", flexShrink: 0 }}>
                {i < 3 ? RANK_MEDALS[i] : <span style={{ fontFamily: FONTS.display, fontSize: 8, color: C.dim }}>#{i+1}</span>}
              </span>

              <span className={i === 0 && d.total > 0 ? "neon-pulse-active" : ""} style={{
                fontSize: 18, width: 42, flexShrink: 0,
                color: d.count > 0 ? (i === 0 ? barColor : C.bright) : C.dim,
                textShadow: d.count > 0 ? `0 0 ${i === 0 ? 10 : 6}px ${i === 0 ? barColor : C.bright}` : "none",
              }}>
                {d.tk}
              </span>

              {/* Power bar — dual split (call/put) */}
              <div style={{
                flex: 1, height: 14, background: "rgba(102,204,255,0.04)",
                position: "relative", overflow: "hidden", minWidth: 0,
                border: "1px solid rgba(102,204,255,0.06)",
              }}>
                {/* Call portion */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${barPct * d.ratio}%`,
                  background: `linear-gradient(90deg, ${C.call}88, ${C.call})`,
                  opacity: 0.8,
                  transition: "width 0.3s steps(8)",
                }} />
                {/* Put portion — stacked after call */}
                <div style={{
                  position: "absolute", left: `${barPct * d.ratio}%`, top: 0, bottom: 0,
                  width: `${barPct * (1 - d.ratio)}%`,
                  background: `linear-gradient(90deg, ${C.put}88, ${C.put})`,
                  opacity: 0.8,
                  transition: "width 0.3s steps(8), left 0.3s steps(8)",
                }} />
                {/* Inner glow for top entries */}
                {i < 3 && barPct > 20 && (
                  <div style={{
                    position: "absolute", left: 0, top: 0, bottom: 0,
                    width: `${barPct}%`,
                    boxShadow: `0 0 12px ${barColor}50, inset 0 1px 0 rgba(255,255,255,0.12)`,
                    pointerEvents: "none",
                  }} />
                )}
                {/* Center ratio indicator */}
                {barPct > 30 && (
                  <div style={{
                    position: "absolute", left: `${barPct * d.ratio}%`, top: 0, bottom: 0,
                    width: 1, background: "rgba(255,255,255,0.25)",
                    transform: "translateX(-0.5px)",
                  }} />
                )}
                {/* Bar segment markers */}
                {barPct > 0 && [25, 50, 75].map(mark => (
                  <div key={mark} style={{
                    position: "absolute", left: `${mark}%`, top: 0, bottom: 0,
                    width: 1, background: "rgba(255,255,255,0.04)",
                  }} />
                ))}
              </div>

              <span className={vibeClass} style={{ fontSize: 13, color: vibeColor, flexShrink: 0, width: 60, textAlign: "right", overflow: "hidden", whiteSpace: "nowrap", textShadow: vibeColor !== C.dim ? `0 0 4px ${vibeColor}40` : "none" }}>
                {vibe}
              </span>

              {d.count > 0 && (
                <span style={{
                  fontSize: 13, flexShrink: 0, width: 26, textAlign: "right",
                  color: isUp ? C.call : C.put,
                  opacity: 0.6,
                }}>
                  {Math.round(d.ratio * 100)}%
                </span>
              )}

              <span style={{
                fontSize: 16, flexShrink: 0, width: 48, textAlign: "right",
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
