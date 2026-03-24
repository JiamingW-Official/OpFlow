import { useState, useMemo, useEffect, useRef } from "react";
import { useFlow } from "../context/FlowContext";
import { C, TICKERS, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
import { playStreak, playCombo } from "../lib/sounds";
import type { FilterType } from "../types";

const PREMIUM_OPTIONS = [
  { label: "ALL", value: 0 },
  { label: "$100K+", value: 100_000 },
  { label: "$500K+", value: 500_000 },
  { label: "$1M+", value: 1_000_000 },
];

const EXPIRY_OPTIONS = [
  { label: "All", value: "all" as const },
  { label: "Week", value: "week" as const },
  { label: "Month", value: "month" as const },
];

// Fun size labels
function sizeLabel(total: number): { text: string; color: string } {
  if (total >= 5e6) return { text: "MEGA!", color: C.gold };
  if (total >= 1e6) return { text: "HUGE", color: C.pink };
  if (total >= 500e3) return { text: "BIG", color: C.violet };
  return { text: "", color: "" };
}

export default function TapeFlow() {
  const { filtered, filters, setFilters } = useFlow();
  const [showFilters, setShowFilters] = useState(false);

  const setType = (type: FilterType) => setFilters(prev => ({ ...prev, type }));

  const activeFilterCount = (filters.minPremium > 0 ? 1 : 0)
    + (filters.expiry !== "all" ? 1 : 0)
    + (filters.tickers.length > 0 ? 1 : 0);

  // Streak detection — consecutive same-direction trades
  const streak = useMemo(() => {
    if (filtered.length < 2) return { count: 0, type: "CALL" as string };
    const first = filtered[0].type;
    let count = 1;
    for (let i = 1; i < Math.min(filtered.length, 20); i++) {
      if (filtered[i].type === first) count++;
      else break;
    }
    return { count, type: first };
  }, [filtered]);

  // Sound effects for streak milestones
  const prevStreakRef = useRef(0);
  const isCallStreak = streak.type === "CALL";
  useEffect(() => {
    if (streak.count >= 5 && prevStreakRef.current < 5) {
      playCombo(isCallStreak);
      if (streak.count >= 10) {
        window.dispatchEvent(new CustomEvent("flow:milestone", {
          detail: { key: "streak-10", emoji: "🔥", text: "10x STREAK!" },
        }));
      }
    } else if (streak.count >= 3 && prevStreakRef.current < 3) {
      playStreak(isCallStreak);
    }
    prevStreakRef.current = streak.count;
  }, [streak.count, isCallStreak]);

  return (
    <PixelCard title={`LIVE BETS${filtered.length > 0 ? ` [${filtered.length}]` : ""}`} titleIcon="🎰" style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, minWidth: 0 }}>
      {/* Streak banner */}
      {streak.count >= 3 && (
        <div className="streak-glow" style={{
          padding: "2px 6px",
          background: streak.type === "CALL" ? "rgba(0,255,136,0.06)" : "rgba(255,51,102,0.06)",
          borderBottom: `2px solid ${streak.type === "CALL" ? C.call : C.put}30`,
          display: "flex", alignItems: "center", gap: 4,
          fontFamily: FONTS.display, fontSize: 10,
        }}>
          <span className="streak-fire" style={{ fontSize: 18 }}>{streak.type === "CALL" ? "🔥" : "❄️"}</span>
          <span className="streak-fire" style={{ color: streak.type === "CALL" ? C.call : C.put }}>
            {streak.count}x {streak.type === "CALL" ? "UP" : "DOWN"} STREAK!
          </span>
          {streak.count >= 5 && <span className="pixel-glow-pulse" style={{ color: C.gold }}>COMBO!</span>}
          {streak.count >= 8 && <span className="pixel-glow-pulse" style={{ color: C.pink }}>🔥UNSTOPPABLE</span>}
        </div>
      )}

      {/* Filter bar */}
      <div style={{
        padding: "4px 6px", borderBottom: `3px solid rgba(102,204,255,0.08)`,
        display: "flex", alignItems: "center", gap: 2, overflow: "hidden",
      }}>
        {(["ALL", "CALL", "PUT"] as FilterType[]).map(f => {
          const active = filters.type === f;
          const color = f === "CALL" ? C.call : f === "PUT" ? C.put : C.accent;
          const emoji = f === "ALL" ? "🌟" : f === "CALL" ? "📈" : "📉";
          const label = f === "ALL" ? "ALL" : f === "CALL" ? "UP" : "DN";
          return (
            <button key={f} onClick={() => setType(f)} className="btn-glow"
              aria-label={`Show ${f === "ALL" ? "all trades" : f === "CALL" ? "calls (bullish bets)" : "puts (bearish bets)"}`}
              aria-pressed={active}
              style={{
                padding: "2px 6px", fontSize: 16,
                border: `2px solid ${active ? color : "rgba(102,204,255,0.08)"}`,
                background: active ? `${color}18` : "transparent",
                color: active ? color : C.dim,
                cursor: "pointer", fontFamily: FONTS.mono,
                textShadow: active ? `0 0 8px ${color}` : "none",
                boxShadow: active ? `0 0 8px ${color}20, inset 0 0 12px ${color}08` : "none",
              }}>{emoji}{label}</button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowFilters(p => !p)}
          aria-label={`${showFilters ? "Hide" : "Show"} filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ""}`}
          aria-expanded={showFilters}
          style={{
            padding: "2px 4px", fontSize: 16,
            border: `2px solid ${activeFilterCount > 0 ? C.accent : "transparent"}`,
            background: activeFilterCount > 0 ? "rgba(102,204,255,0.08)" : "transparent",
            color: activeFilterCount > 0 ? C.accent : C.dim,
            cursor: "pointer", fontFamily: FONTS.mono,
          }}>
          🔧{activeFilterCount > 0 ? activeFilterCount : ""}
        </button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div style={{ padding: "4px 6px", borderBottom: `3px solid rgba(102,204,255,0.08)`, display: "flex", flexDirection: "column", gap: 3, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18 }}>💎</span>
            {PREMIUM_OPTIONS.map(o => (
              <PxBtn key={o.value} active={filters.minPremium === o.value} onClick={() => setFilters(p => ({ ...p, minPremium: o.value }))}>{o.label}</PxBtn>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: 18 }}>📅</span>
            {EXPIRY_OPTIONS.map(o => (
              <PxBtn key={o.value} active={filters.expiry === o.value} onClick={() => setFilters(p => ({ ...p, expiry: o.value }))}>{o.label}</PxBtn>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {TICKERS.map(tk => {
              const active = filters.tickers.includes(tk);
              return (
                <PxBtn key={tk} active={active} onClick={() => setFilters(p => ({
                  ...p, tickers: active ? p.tickers.filter(t => t !== tk) : [...p.tickers, tk],
                }))}>{tk}</PxBtn>
              );
            })}
          </div>
        </div>
      )}

      {/* Column header */}
      <div aria-hidden="true" style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "1px 6px",
        borderBottom: `1px solid rgba(102,204,255,0.06)`,
        fontFamily: FONTS.display, fontSize: 7, color: C.dim,
        letterSpacing: 0.5, flexShrink: 0,
      }}>
        <span style={{ width: 32, flexShrink: 0 }}>DIR</span>
        <span style={{ width: 42, flexShrink: 0 }}>TICK</span>
        <span style={{ flex: 1 }} />
        <span style={{ width: 48, textAlign: "right", flexShrink: 0 }}>PREMIUM</span>
      </div>

      {/* Trade list */}
      <div role="list" aria-label="Live options flow trades" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, minWidth: 0 }}>
        {(() => {
          const shown = filtered.slice(0, 50);
          const maxPrem = shown.length > 0 ? Math.max(...shown.map(t => t.total)) : 1;
          return shown.map((t, i) => {
            const dir = t.type === "CALL";
            const dirColor = dir ? C.call : C.put;
            const size = sizeLabel(t.total);
            const relSize = t.total / maxPrem;
            return (
              <div key={t.id} role="listitem"
                aria-label={`${t.type === "CALL" ? "Call (bullish)" : "Put (bearish)"} ${t.tk} $${t.strike} exp ${t.exp} premium ${fmt(t.total)}`}
                className={`trade-row ${i === 0 ? "new-trade" : ""} ${t.total >= 1e6 ? "trade-row-mega" : ""}`} style={{
                padding: "3px 6px",
                background: dir
                  ? `linear-gradient(90deg, rgba(0,255,136,${t.total >= 1e6 ? 0.15 : 0.08}) 0%, rgba(0,255,136,0.02) 100%)`
                  : `linear-gradient(90deg, rgba(255,51,102,${t.total >= 1e6 ? 0.15 : 0.08}) 0%, rgba(255,51,102,0.02) 100%)`,
                borderBottom: `1px solid ${dirColor}15`,
                borderLeft: size.text ? `4px solid ${size.color}` : `4px solid ${dirColor}88`,
                position: "relative", overflow: "hidden",
              }}>
                {/* Background size bar */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: `${relSize * 100}%`,
                  background: `${dirColor}08`,
                  pointerEvents: "none",
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden", position: "relative" }}>
                  {/* Direction badge */}
                  <span style={{
                    fontSize: 12, fontFamily: FONTS.display,
                    color: dir ? "#001a08" : "#1a0008",
                    background: dirColor,
                    padding: "1px 4px",
                    textShadow: "none",
                    flexShrink: 0,
                    letterSpacing: 1,
                  }}>{dir ? "▲UP" : "▼DN"}</span>
                  <span style={{
                    fontSize: 20, color: C.bright,
                    textShadow: `0 0 6px ${C.bright}`,
                    flexShrink: 0,
                  }}>{t.tk}</span>
                  {size.text && (
                    <span className={t.total >= 5e6 ? "streak-fire" : "pixel-glow-pulse"} style={{
                      fontFamily: FONTS.display, fontSize: 10,
                      color: size.color, flexShrink: 0,
                      background: t.total >= 5e6 ? `${size.color}15` : undefined,
                      padding: t.total >= 5e6 ? "0 4px" : undefined,
                      border: t.total >= 5e6 ? `1px solid ${size.color}40` : undefined,
                    }}>{size.text}</span>
                  )}
                  <span style={{
                    marginLeft: "auto", color: dirColor, fontSize: 18,
                    textShadow: `0 0 8px ${dirColor}`,
                    flexShrink: 0,
                    fontWeight: "bold",
                  }}>{fmt(t.total)}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 14, color: C.dim, marginTop: 1, overflow: "hidden", position: "relative" }}>
                  <span aria-hidden="true" style={{ color: dirColor, opacity: 0.7 }}>{dir ? "📈" : "📉"}</span>
                  <span title="Strike price">${t.strike}</span>
                  <span title="Expiration date">{t.exp}</span>
                  <span title="Volume (contracts traded)">{t.vol.toLocaleString()}</span>
                  {t.isBlock && <span title="Block trade — large single institution order" style={{ color: C.gold }}>🐋</span>}
                  {t.isSweep && <span title="Sweep — urgent buy across multiple exchanges" style={{ color: C.violet }}>⚡</span>}
                </div>
              </div>
            );
          });
        })()}
      </div>
    </PixelCard>
  );
}

function PxBtn({ children, active, onClick }: { children: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "1px 4px", fontSize: 14,
      border: `2px solid ${active ? C.accent : "rgba(102,204,255,0.12)"}`,
      background: active ? "rgba(102,204,255,0.1)" : "transparent",
      color: active ? C.accent : C.dim,
      cursor: "pointer", fontFamily: FONTS.mono,
    }}>{children}</button>
  );
}
