import { useState } from "react";
import { useFlow } from "../context/FlowContext";
import { C, TICKERS, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
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

  return (
    <PixelCard title="LIVE BETS" titleIcon="🎰" style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, minWidth: 0 }}>
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
            <button key={f} onClick={() => setType(f)} style={{
              padding: "2px 4px", fontSize: 18,
              border: `2px solid ${active ? color : "transparent"}`,
              background: active ? `${color}15` : "transparent",
              color: active ? color : C.dim,
              cursor: "pointer", fontFamily: FONTS.mono,
              textShadow: active ? `0 0 6px ${color}` : "none",
            }}>{emoji}{label}</button>
          );
        })}
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowFilters(p => !p)} style={{
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
            <span style={{ fontSize: 14 }}>💎</span>
            {PREMIUM_OPTIONS.map(o => (
              <PxBtn key={o.value} active={filters.minPremium === o.value} onClick={() => setFilters(p => ({ ...p, minPremium: o.value }))}>{o.label}</PxBtn>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14 }}>📅</span>
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

      {/* Trade list */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", minHeight: 0, minWidth: 0 }}>
        {filtered.slice(0, 50).map((t, i) => {
          const dir = t.type === "CALL";
          const dirColor = dir ? C.call : C.put;
          const size = sizeLabel(t.total);
          return (
            <div key={t.id} className={i === 0 ? "new-trade" : ""} style={{
              padding: "5px 6px",
              background: i % 2 === 0 ? "rgba(102,204,255,0.02)" : "transparent",
              borderBottom: "1px solid rgba(102,204,255,0.04)",
              borderLeft: size.text ? `3px solid ${size.color}` : "3px solid transparent",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, overflow: "hidden" }}>
                <span style={{
                  fontSize: 24, color: C.bright,
                  textShadow: `0 0 6px ${C.bright}`,
                  flexShrink: 0,
                }}>{t.tk}</span>
                <span style={{
                  color: dirColor, fontSize: 20,
                  textShadow: `0 0 6px ${dirColor}`,
                  flexShrink: 0,
                }}>
                  {dir ? "📈" : "📉"}
                </span>
                {size.text && (
                  <span className="pixel-glow-pulse" style={{
                    fontFamily: FONTS.display, fontSize: 7,
                    color: size.color, flexShrink: 0,
                  }}>{size.text}</span>
                )}
                <span style={{
                  marginLeft: "auto", color: C.gold, fontSize: 22,
                  textShadow: `0 0 8px ${C.gold}`,
                  flexShrink: 0,
                }}>{fmt(t.total)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 14, color: C.dim, marginTop: 1, overflow: "hidden" }}>
                <span>${t.strike}</span>
                <span>{t.exp}</span>
                <span>{t.vol.toLocaleString()}</span>
                {t.isBlock && <span style={{ color: C.gold }}>🐋</span>}
                {t.isSweep && <span style={{ color: C.violet }}>⚡</span>}
              </div>
            </div>
          );
        })}
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
