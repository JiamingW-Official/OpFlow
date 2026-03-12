import { C, FONTS } from "../constants/theme";
import { useNeko, CATS } from "../context/NekoContext";
import PixelCard from "./ui/PixelCard";

export default function NekoNav() {
  const {
    activeCat, mode, comparePick, opts, aiLoad,
    moodPct, moodIcon, topTk, totalFlow, anomalyCount,
    handleOpt, handleCat, backToMenu,
  } = useNeko();

  return (
    <PixelCard title="NEKO" titleIcon="🐱" titleColor={C.violet} style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

      {/* ── Status strip ── */}
      <div style={{
        padding: "4px 8px",
        display: "flex", alignItems: "center", gap: 6,
        fontFamily: FONTS.mono, fontSize: 15, color: C.dim,
        background: "rgba(204,136,255,0.03)",
        borderBottom: "1px solid rgba(204,136,255,0.08)",
        flexShrink: 0,
      }}>
        <span style={{ color: moodPct >= 50 ? C.call : C.put, textShadow: `0 0 4px ${moodPct >= 50 ? C.call : C.put}` }}>
          {moodIcon}{moodPct}%
        </span>
        <span style={{ opacity: 0.2 }}>{"\u2502"}</span>
        <span style={{ color: C.gold }}>{"\uD83D\uDD25"}{topTk}</span>
        <span style={{ opacity: 0.2 }}>{"\u2502"}</span>
        <span>{totalFlow}</span>
        {anomalyCount > 0 && <>
          <span style={{ opacity: 0.2 }}>{"\u2502"}</span>
          <span style={{ color: C.put }}>{"\u26A0"}{anomalyCount}</span>
        </>}
      </div>

      {/* ── Category tabs ── */}
      <div style={{
        display: "flex", gap: 2, padding: "3px 4px",
        borderBottom: "1px solid rgba(204,136,255,0.08)",
        flexShrink: 0,
      }}>
        {mode === "follow-up" ? (
          <button onClick={backToMenu} style={{
            flex: 1, fontSize: 11, fontFamily: FONTS.display,
            padding: "3px", background: "rgba(102,204,255,0.08)",
            border: `1px solid ${C.accent}`, color: C.accent,
            cursor: "pointer", letterSpacing: 0.5,
          }}>
            {"\u2190"} MENU
          </button>
        ) : (
          CATS.map(cat => {
            const active = activeCat === cat.id;
            return (
              <button key={cat.id} onClick={() => handleCat(cat.id)} style={{
                flex: 1, padding: "3px 1px",
                background: active ? "rgba(204,136,255,0.12)" : "transparent",
                border: `1px solid ${active ? C.violet : "rgba(204,136,255,0.06)"}`,
                color: active ? C.violet : C.dim,
                cursor: "pointer",
                textShadow: active ? `0 0 6px ${C.violet}` : "none",
                transition: "all 0.15s",
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 0, lineHeight: 1.2,
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.violet; e.currentTarget.style.borderColor = "rgba(204,136,255,0.25)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.dim; e.currentTarget.style.borderColor = "rgba(204,136,255,0.06)"; } }}>
                <span style={{ fontSize: 16 }}>{cat.icon}</span>
                <span style={{ fontSize: 9, fontFamily: FONTS.display }}>{cat.label}</span>
              </button>
            );
          })
        )}
      </div>

      {/* ── Compare pick header ── */}
      {comparePick && (
        <div style={{
          fontSize: 14, fontFamily: FONTS.mono,
          color: C.gold, padding: "4px 6px", textAlign: "center",
          borderBottom: "1px solid rgba(204,136,255,0.08)",
          flexShrink: 0, textShadow: `0 0 4px ${C.gold}`,
        }}>
          {"\u2694\uFE0F"} {comparePick} vs ???
          <button onClick={backToMenu} style={{
            marginLeft: 6, fontSize: 11, fontFamily: FONTS.display,
            padding: "1px 6px", background: "transparent",
            border: `1px solid ${C.dim}`, color: C.dim, cursor: "pointer",
          }}>{"\u2715"}</button>
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
            <button key={opt.id} onClick={() => handleOpt(opt)} disabled={aiLoad} style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "4px 6px",
              background: "rgba(204,136,255,0.03)",
              border: "1px solid rgba(204,136,255,0.08)",
              color: C.text, cursor: aiLoad ? "not-allowed" : "pointer",
              opacity: aiLoad ? 0.4 : 1,
              fontFamily: FONTS.mono, fontSize: 16,
              transition: "all 0.15s", flexShrink: 0,
              minWidth: 0, textAlign: "left",
            }}
              onMouseEnter={e => { if (!aiLoad) { e.currentTarget.style.borderColor = C.violet; e.currentTarget.style.background = "rgba(204,136,255,0.08)"; e.currentTarget.style.boxShadow = `0 0 8px rgba(204,136,255,0.12)`; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(204,136,255,0.08)"; e.currentTarget.style.background = "rgba(204,136,255,0.03)"; e.currentTarget.style.boxShadow = "none"; }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{opt.icon}</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {opt.label}
                {opt.sub && <span style={{ fontSize: 14, color: C.dim, marginLeft: 4 }}>{opt.sub}</span>}
              </span>
              {opt.badge && (
                <span style={{
                  fontSize: 12, fontFamily: FONTS.display,
                  color: opt.badgeColor || C.dim, flexShrink: 0,
                  textShadow: opt.badgeColor ? `0 0 4px ${opt.badgeColor}` : "none",
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
