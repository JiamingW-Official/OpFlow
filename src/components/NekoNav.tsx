import { C, FONTS } from "../constants/theme";
import { useNeko, CATS } from "../context/NekoContext";
import PixelCard from "./ui/PixelCard";

export default function NekoNav() {
  const {
    activeCat, mode, comparePick, opts, aiLoad,
    moodPct, moodIcon, topTk, totalFlow, anomalyCount,
    handleOpt, handleCat, backToMenu,
  } = useNeko();

  const moodColor = moodPct >= 50 ? C.call : C.put;

  return (
    <PixelCard title="NEKO" titleIcon="🐱" titleColor={C.violet} style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

      {/* ── Status strip with live pulse ── */}
      <div className="stat-shimmer" style={{
        padding: "4px 8px",
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: FONTS.mono, fontSize: 15, color: C.dim,
        background: "rgba(204,136,255,0.03)",
        borderBottom: "1px solid rgba(204,136,255,0.08)",
        flexShrink: 0,
      }}>
        <span style={{ color: moodColor, textShadow: `0 0 6px ${moodColor}` }}>
          {moodIcon}{moodPct}%
        </span>
        <span style={{ opacity: 0.2 }}>│</span>
        <span style={{ color: C.gold, textShadow: `0 0 4px ${C.gold}` }}>🔥{topTk}</span>
        <span style={{ opacity: 0.2 }}>│</span>
        <span>{totalFlow}</span>
        {anomalyCount > 0 && <>
          <span style={{ opacity: 0.2 }}>│</span>
          <span className="pixel-glow-pulse" style={{ color: C.put }}>⚠{anomalyCount}</span>
        </>}
      </div>

      {/* ── Category tabs ── */}
      <div style={{
        display: "flex", gap: 2, padding: "3px 4px",
        borderBottom: "1px solid rgba(204,136,255,0.08)",
        flexShrink: 0,
      }}>
        {mode === "follow-up" ? (
          <button onClick={backToMenu} className="btn-glow" style={{
            flex: 1, fontSize: 11, fontFamily: FONTS.display,
            padding: "4px", background: "rgba(102,204,255,0.08)",
            border: `1px solid ${C.accent}`, color: C.accent,
            cursor: "pointer", letterSpacing: 0.5,
          }}>
            ← MENU
          </button>
        ) : (
          CATS.map(cat => {
            const active = activeCat === cat.id;
            return (
              <button key={cat.id} onClick={() => handleCat(cat.id)}
                className={active ? "cat-tab-active" : "btn-glow"}
                style={{
                  flex: 1, padding: "4px 1px",
                  background: active ? "rgba(204,136,255,0.15)" : "transparent",
                  border: `1px solid ${active ? C.violet : "rgba(204,136,255,0.06)"}`,
                  color: active ? C.violet : C.dim,
                  cursor: "pointer",
                  textShadow: active ? `0 0 8px ${C.violet}` : "none",
                  transition: "all 0.15s",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 0, lineHeight: 1.2,
                }}>
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <span style={{ fontSize: 9, fontFamily: FONTS.display }}>{cat.label}</span>
              </button>
            );
          })
        )}
      </div>

      {/* ── Compare pick header ── */}
      {comparePick && (
        <div className="pixel-glow-pulse" style={{
          fontSize: 14, fontFamily: FONTS.mono,
          color: C.gold, padding: "4px 6px", textAlign: "center",
          borderBottom: "1px solid rgba(255,221,102,0.15)",
          flexShrink: 0,
          background: "rgba(255,221,102,0.04)",
        }}>
          ⚔️ {comparePick} vs ???
          <button onClick={backToMenu} className="btn-glow" style={{
            marginLeft: 6, fontSize: 11, fontFamily: FONTS.display,
            padding: "1px 6px", background: "transparent",
            border: `1px solid ${C.dim}`, color: C.dim, cursor: "pointer",
          }}>✕</button>
        </div>
      )}

      {/* ── Options list ── */}
      <div style={{
        flex: 1, overflowY: "auto", overflowX: "hidden",
        padding: "3px 4px", display: "flex", flexDirection: "column", gap: 2,
        minHeight: 0,
      }}>
        {opts
          .filter(o => comparePick ? o.label !== comparePick : true)
          .map(opt => (
            <button key={opt.id} onClick={() => handleOpt(opt)} disabled={aiLoad}
              className={`neko-opt ${aiLoad ? "neko-opt-loading" : ""}`}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "5px 6px",
                background: "rgba(204,136,255,0.03)",
                border: "1px solid rgba(204,136,255,0.08)",
                color: C.text, cursor: aiLoad ? "not-allowed" : "pointer",
                opacity: aiLoad ? 0.4 : 1,
                fontFamily: FONTS.mono, fontSize: 16,
                flexShrink: 0, minWidth: 0, textAlign: "left",
              }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{opt.icon}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {opt.label}
                {opt.sub && <span style={{ fontSize: 14, color: C.dim, marginLeft: 4 }}>{opt.sub}</span>}
              </span>
              {opt.badge && (
                <span className="neko-opt-badge" style={{
                  fontSize: 12, fontFamily: FONTS.display,
                  color: opt.badgeColor || C.dim, flexShrink: 0,
                  textShadow: opt.badgeColor ? `0 0 6px ${opt.badgeColor}` : "none",
                }}>
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
      </div>
    </PixelCard>
  );
}
