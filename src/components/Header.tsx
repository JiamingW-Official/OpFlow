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

      {/* Power Level badge */}
      <div className="rainbow-border" style={{
        padding: "3px 8px",
        border: `2px solid ${power.color}`,
        background: `${power.color}10`,
        display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
      }}>
        <span style={{ fontSize: 16 }}>{power.emoji}</span>
        <span style={{
          fontFamily: FONTS.display, fontSize: 7, color: power.color,
          textShadow: `0 0 8px ${power.color}`,
        }}>LV{power.level} {power.name}</span>
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      {/* Stats */}
      <Stat emoji="💰" val={fmt(totalPrem)} color={C.accent} />
      <Stat emoji={moodEmoji} val={moodText} color={moodColor} />
      <Stat emoji="🐋" val={String(blocks)} color={C.gold} />
      <Stat emoji="⚡" val={String(sweeps)} color={C.violet} />

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

function Stat({ emoji, val, color }: { emoji: string; val: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{
        fontSize: 24, color, lineHeight: 1,
        textShadow: `0 0 8px ${color}, 0 0 2px ${color}`,
      }}>{val}</span>
    </div>
  );
}
