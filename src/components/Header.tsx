import { useCallback } from "react";
import { useFlow } from "../context/FlowContext";
import { C, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
import ExportButton from "./ExportButton";

// Power level based on total premium
function getPowerLevel(prem: number) {
  if (prem >= 50e6) return { level: 5, name: "LEGENDARY", emoji: "🌟", color: C.gold };
  if (prem >= 20e6) return { level: 4, name: "EPIC", emoji: "💎", color: C.violet };
  if (prem >= 10e6) return { level: 3, name: "RARE", emoji: "🔥", color: C.pink };
  if (prem >= 5e6) return { level: 2, name: "HOT", emoji: "⚡", color: C.call };
  return { level: 1, name: "CHILL", emoji: "🌱", color: C.accent };
}

export default function Header() {
  const { totalPrem, callRatio, blocks, sweeps, connectionStatus, trades } = useFlow();

  const statusColor = connectionStatus === "connected" ? C.call
    : connectionStatus === "connecting" ? C.gold : C.put;

  const power = getPowerLevel(totalPrem);
  const moodEmoji = callRatio > 0.65 ? "🥳" : callRatio > 0.55 ? "😆" : callRatio > 0.45 ? "😊" : callRatio > 0.35 ? "😐" : "😱";
  const moodText = callRatio > 0.65 ? "PARTY!" : callRatio > 0.55 ? "HYPED" : callRatio > 0.45 ? "CHILL" : callRatio > 0.35 ? "MEH" : "PANIC";
  const moodColor = callRatio > 0.5 ? C.call : C.put;

  const handleShare = useCallback(() => {
    const p = getPowerLevel(totalPrem);
    const text = `🐱 FLOW ARCADE ${p.emoji}\n\n${p.emoji} Power: ${p.name}\n💰 ${fmt(totalPrem)} flowing\n${moodEmoji} Mood: ${moodText}\n🐋 ${blocks} whales | ⚡ ${sweeps} rushes\n📊 ${trades.length} bets tracked\n\n#FlowArcade #Stocks`;
    if (navigator.share) {
      navigator.share({ title: "FLOW ARCADE", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
    }
  }, [totalPrem, blocks, sweeps, moodEmoji, moodText, trades.length]);

  return (
    <PixelCard style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 12px", flexWrap: "wrap", overflow: "hidden" }}>
      {/* Mascot */}
      <span className="pixel-bounce" style={{ fontSize: 28, flexShrink: 0 }}>🐱</span>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: FONTS.display, fontSize: 11, color: C.pink,
          textShadow: `0 0 12px ${C.pink}`,
        }}>
          FLOW<span style={{ color: C.gold }}>✦</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
          <span className="pixel-blink" style={{ color: statusColor, fontSize: 8 }}>●</span>
          <span style={{ fontSize: 16, color: statusColor, textShadow: `0 0 6px ${statusColor}` }}>
            {connectionStatus === "connected" ? "LIVE" : "..."}
          </span>
        </div>
      </div>

      {/* Power Level badge with fill bar */}
      <div className="rainbow-border" style={{
        padding: "3px 8px",
        border: `2px solid ${power.color}`,
        background: `${power.color}10`,
        display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
        position: "relative", overflow: "hidden",
      }}>
        {/* Background fill bar showing progress to next level */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${Math.min((totalPrem / (power.level === 5 ? 50e6 : power.level === 4 ? 50e6 : power.level === 3 ? 20e6 : power.level === 2 ? 10e6 : 5e6)) * 100, 100)}%`,
          background: `${power.color}15`,
          transition: "width 0.5s steps(8)",
        }} />
        <span style={{ fontSize: 16, position: "relative" }}>{power.emoji}</span>
        <span style={{
          fontFamily: FONTS.display, fontSize: 7, color: power.color,
          textShadow: `0 0 8px ${power.color}`,
          position: "relative",
        }}>LV{power.level} {power.name}</span>
      </div>

      {/* Trade counter */}
      <div style={{
        fontFamily: FONTS.display, fontSize: 7, color: C.dim,
        flexShrink: 0, display: "flex", alignItems: "center", gap: 3,
      }}>
        <span style={{ color: C.accent, textShadow: `0 0 4px ${C.accent}` }}>
          {trades.length}
        </span>
        <span>BETS</span>
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      {/* Stats */}
      <Stat emoji="💰" val={fmt(totalPrem)} color={C.accent} label="FLOW" />
      <Stat emoji={moodEmoji} val={moodText} color={moodColor} label="MOOD" />
      <Stat emoji="🐋" val={String(blocks)} color={C.gold} label="WHALE" />
      <Stat emoji="⚡" val={String(sweeps)} color={C.violet} label="RUSH" />

      <div style={{ width: 2, height: 24, background: "rgba(102,204,255,0.1)", flexShrink: 0 }} />

      <ExportButton />

      <button onClick={handleShare} style={{
        padding: "4px 8px", fontSize: 20,
        background: "transparent",
        border: `2px solid ${C.pink}`,
        color: C.pink, cursor: "pointer",
        fontFamily: FONTS.mono,
        textShadow: `0 0 6px ${C.pink}`,
        flexShrink: 0,
      }}
        onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(255,136,187,0.15)"; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}>
        📤SHARE
      </button>
    </PixelCard>
  );
}

function Stat({ emoji, val, color, label }: { emoji: string; val: string; color: string; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        {label && <span style={{ fontSize: 8, fontFamily: FONTS.display, color: C.dim, letterSpacing: 1 }}>{label}</span>}
        <span style={{
          fontSize: 24, color, lineHeight: 1,
          textShadow: `0 0 8px ${color}, 0 0 2px ${color}`,
        }}>{val}</span>
      </div>
    </div>
  );
}
