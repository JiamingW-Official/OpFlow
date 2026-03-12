import { useCallback, useEffect, useRef, useState } from "react";
import { useFlow } from "../context/FlowContext";
import { C, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
import ExportButton from "./ExportButton";
import { playLevelUp, playMeow, playClick, isMuted, toggleMute } from "../lib/sounds";

const CAT_REACTIONS = [
  "nya~!", "meow!", "*purr*", "(=^-ω-^=)", "buy calls!", "sell puts!",
  "moon soon!", "diamond paws!", "HODL!", "gm gm~", "wen lambo?",
  "*nuzzle*", "to the moon!", "bullish!", "let's go!",
];

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

  const [catClicks, setCatClicks] = useState(0);
  const [catMsg, setCatMsg] = useState("");
  const [muted, setMutedState] = useState(() => isMuted());

  const onCatClick = useCallback(() => {
    setCatClicks(c => c + 1);
    setCatMsg(CAT_REACTIONS[Math.floor(Math.random() * CAT_REACTIONS.length)]);
    playMeow();
    setTimeout(() => setCatMsg(""), 1200);
  }, []);

  const onToggleMute = useCallback(() => {
    setMutedState(toggleMute());
  }, []);

  const power = getPowerLevel(totalPrem);
  const prevLevelRef = useRef(power.level);
  useEffect(() => {
    if (power.level > prevLevelRef.current) {
      playLevelUp();
      if (power.level === 5) {
        window.dispatchEvent(new CustomEvent("flow:milestone", {
          detail: { key: "legendary", emoji: "🌟", text: "LEGENDARY POWER!" },
        }));
      }
    }
    prevLevelRef.current = power.level;
  }, [power.level]);

  const moodEmoji = callRatio > 0.65 ? "🥳" : callRatio > 0.55 ? "😆" : callRatio > 0.45 ? "😊" : callRatio > 0.35 ? "😐" : "😱";
  const moodText = callRatio > 0.65 ? "PARTY!" : callRatio > 0.55 ? "HYPED" : callRatio > 0.45 ? "CHILL" : callRatio > 0.35 ? "MEH" : "PANIC";
  const moodColor = callRatio > 0.5 ? C.call : C.put;
  const isActive = trades.length > 10;

  const handleShare = useCallback(() => {
    playClick();
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
      {/* Mascot — click easter egg */}
      <span onClick={onCatClick} className="pixel-bounce" style={{
        fontSize: 28, flexShrink: 0, position: "relative",
        transition: "transform 0.1s steps(2)",
        transform: catMsg ? "scale(1.3) rotate(-10deg)" : undefined,
      }}>
        🐱
        {catMsg && (
          <span className="msg-in" style={{
            position: "absolute", bottom: "110%", left: "50%", transform: "translateX(-50%)",
            fontSize: 14, fontFamily: FONTS.display, color: C.pink,
            textShadow: `0 0 8px ${C.pink}`,
            whiteSpace: "nowrap", pointerEvents: "none",
          }}>{catMsg}</span>
        )}
        {catClicks >= 10 && (
          <span style={{
            position: "absolute", top: -2, right: -4,
            fontSize: 10, fontFamily: FONTS.display, color: C.gold,
          }}>✦</span>
        )}
      </span>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          fontFamily: FONTS.display, fontSize: 14, color: C.pink,
          textShadow: `0 0 12px ${C.pink}`,
        }}>
          FLOW<span style={{ color: C.gold }}>✦</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 1 }}>
          <span className={connectionStatus === "connected" ? "live-heartbeat" : "pixel-blink"} style={{ color: statusColor, fontSize: 10, display: "inline-block" }}>●</span>
          <span className={connectionStatus === "connected" ? "neon-pulse-active" : ""} style={{ fontSize: 20, color: statusColor, textShadow: `0 0 6px ${statusColor}` }}>
            {connectionStatus === "connected" ? "LIVE" : "..."}
          </span>
        </div>
      </div>

      {/* Power Level badge with fill bar */}
      <div className={`${power.level >= 3 ? "rainbow-border" : ""} ${power.level >= 2 ? "power-badge-float" : ""}`} style={{
        padding: "3px 10px",
        border: `2px solid ${power.color}`,
        background: `linear-gradient(135deg, ${power.color}12, ${power.color}06)`,
        display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
        position: "relative", overflow: "hidden",
        boxShadow: power.level >= 4
          ? `0 0 16px ${power.color}50, 0 0 6px ${power.color}30, inset 0 0 20px ${power.color}10`
          : power.level >= 2 ? `0 0 8px ${power.color}20` : undefined,
      }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${Math.min((totalPrem / (power.level === 5 ? 50e6 : power.level === 4 ? 50e6 : power.level === 3 ? 20e6 : power.level === 2 ? 10e6 : 5e6)) * 100, 100)}%`,
          background: `linear-gradient(90deg, ${power.color}20, ${power.color}08)`,
          transition: "width 0.5s steps(8)",
        }} />
        <span className={power.level >= 3 ? "streak-fire" : ""} style={{ fontSize: 22, position: "relative" }}>{power.emoji}</span>
        <span style={{
          fontFamily: FONTS.display, fontSize: 10, color: power.color,
          textShadow: `0 0 8px ${power.color}`,
          position: "relative",
        }}>LV{power.level} {power.name}</span>
      </div>

      {/* Trade counter */}
      <div style={{
        fontFamily: FONTS.display, fontSize: 10, color: C.dim,
        flexShrink: 0, display: "flex", alignItems: "center", gap: 3,
      }}>
        <span key={trades.length} className="counter-tick" style={{ color: C.accent, textShadow: `0 0 6px ${C.accent}`, fontSize: 12 }}>
          {trades.length}
        </span>
        <span>BETS</span>
      </div>

      <div style={{ flex: 1, minWidth: 8 }} />

      {/* Stats */}
      <Stat emoji="💰" val={fmt(totalPrem)} color={C.accent} label="FLOW" active={isActive} />
      <Stat emoji={moodEmoji} val={moodText} color={moodColor} label="MOOD" active={isActive} />
      <Stat emoji="🐋" val={String(blocks)} color={C.gold} label="WHALE" active={isActive} />
      <Stat emoji="⚡" val={String(sweeps)} color={C.violet} label="RUSH" active={isActive} />

      <div style={{ width: 2, height: 24, background: "rgba(102,204,255,0.1)", flexShrink: 0 }} />

      {/* Mute toggle */}
      <button onClick={onToggleMute} className="btn-glow" style={{
        padding: "3px 6px", fontSize: 18,
        background: "transparent",
        border: `2px solid ${muted ? C.dim : C.accent}`,
        color: muted ? C.dim : C.accent,
        cursor: "pointer", fontFamily: FONTS.mono,
        textShadow: muted ? "none" : `0 0 6px ${C.accent}`,
        flexShrink: 0,
      }}>{muted ? "🔇" : "🔊"}</button>

      <ExportButton />

      <button onClick={handleShare} className="btn-glow" style={{
        padding: "3px 6px", fontSize: 18,
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

function Stat({ emoji, val, color, label, active }: { emoji: string; val: string; color: string; label?: string; active?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        {label && <span style={{ fontSize: 10, fontFamily: FONTS.display, color: C.dim, letterSpacing: 1 }}>{label}</span>}
        <span className={active ? "neon-pulse-active" : ""} style={{
          fontSize: 22, color, lineHeight: 1,
          textShadow: `0 0 8px ${color}, 0 0 2px ${color}`,
        }}>{val}</span>
      </div>
    </div>
  );
}
