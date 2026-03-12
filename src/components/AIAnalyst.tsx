import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useFlow } from "../context/FlowContext";
import { C, FONTS } from "../constants/theme";
import { askNeko, analyze } from "../lib/neko-brain";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
import { playClick } from "../lib/sounds";
import type { Message } from "../types";

/* ── Types ── */
interface Opt {
  id: string;
  icon: string;
  label: string;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  query: string;
}

type Cat = "hot" | "mood" | "whales" | "risk" | "volume" | "compare";
type Mode = "main" | "follow-up" | "compare-pick";

const CATS: { id: Cat; icon: string; label: string }[] = [
  { id: "hot", icon: "\uD83D\uDD25", label: "HOT" },
  { id: "mood", icon: "\uD83D\uDE0A", label: "MOOD" },
  { id: "whales", icon: "\uD83D\uDC0B", label: "WHALE" },
  { id: "risk", icon: "\uD83D\uDEE1\uFE0F", label: "RISK" },
  { id: "volume", icon: "\uD83D\uDCCA", label: "VOL" },
  { id: "compare", icon: "\u2694\uFE0F", label: "VS" },
];

export default function AIAnalyst() {
  const { trades, tradesRef } = useFlow();
  const [msgs, setMsgs] = useState<Message[]>([{
    r: "ai",
    t: "Hiii! I'm Neko~ your market analyst! \uD83D\uDC31\u2728\nTap a category below to explore live flow data!\nI crunch numbers instantly~ no internet needed! (=^\u2010\u03C9\u2010^=)",
  }]);
  const [aiLoad, setAiLoad] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [activeCat, setActiveCat] = useState<Cat>("hot");
  const [mode, setMode] = useState<Mode>("main");
  const [comparePick, setComparePick] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<Opt[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Live stats from trade data ── */
  const stats = useMemo(() => analyze(trades), [trades]);

  /* ── Auto-scroll on new messages ── */
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, typingText]);

  /* ── Typewriter effect ── */
  const typewriter = useCallback((text: string, fups?: Opt[]) => {
    let idx = 0;
    setTypingText("");
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      idx++;
      if (idx >= text.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        setTypingText("");
        setMsgs(p => [...p, { r: "ai", t: text }]);
        setAiLoad(false);
        if (fups?.length) { setFollowUps(fups); setMode("follow-up"); }
        else setMode("main");
        return;
      }
      const chunk = Math.min(idx + Math.floor(Math.random() * 3), text.length);
      idx = chunk;
      setTypingText(text.slice(0, idx));
    }, 12);
  }, []);

  /* ── Send a query to Neko brain ── */
  const send = useCallback((label: string, query: string, fups?: Opt[]) => {
    if (aiLoad) return;
    playClick();
    setMsgs(p => [...p, { r: "user", t: label }]);
    setAiLoad(true);
    setFollowUps([]);
    setTimeout(() => {
      const answer = askNeko(query, tradesRef.current);
      typewriter(answer, fups);
    }, 200 + Math.random() * 200);
  }, [aiLoad, tradesRef, typewriter]);

  /* ── Build follow-up options contextually ── */
  const makeFollowUps = useCallback((query: string): Opt[] => {
    const s = stats;
    // After ticker deep dive
    const tkMatch = query.match(/^(\w+) update$/);
    if (tkMatch) {
      const tk = tkMatch[1];
      const others = s.topTickers.filter(t => t.tk !== tk).slice(0, 2);
      return [
        ...(others.length > 0 ? [{ id: "f-vs", icon: "\u2694\uFE0F", label: `vs ${others[0].tk}`, query: `${tk} vs ${others[0].tk}` }] : []),
        { id: "f-risk", icon: "\uD83D\uDEE1\uFE0F", label: "Risk Check", query: "risk check" },
        { id: "f-mood", icon: "\uD83D\uDE0A", label: "Mood Check", query: "mood check" },
      ];
    }
    // After mood check
    if (query.includes("mood")) {
      return [
        { id: "f-hot", icon: "\uD83D\uDD25", label: "What's Hot", query: "what's hot" },
        { id: "f-whale", icon: "\uD83D\uDC0B", label: "Whale Watch", query: "any whales" },
        ...(s.topTickers[0] ? [{ id: "f-top", icon: "\uD83D\uDCCA", label: `${s.topTickers[0].tk} Dive`, query: `${s.topTickers[0].tk} update` }] : []),
      ];
    }
    // After whales
    if (query.includes("whale")) {
      return [
        { id: "f-risk", icon: "\uD83D\uDEE1\uFE0F", label: "Risk Check", query: "risk check" },
        { id: "f-hot", icon: "\uD83D\uDD25", label: "What's Hot", query: "what's hot" },
        ...(s.topTickers[0] ? [{ id: "f-top", icon: "\uD83D\uDCCA", label: `${s.topTickers[0].tk} Dive`, query: `${s.topTickers[0].tk} update` }] : []),
      ];
    }
    // After compare
    if (query.includes(" vs ")) {
      return [
        { id: "f-mood", icon: "\uD83D\uDE0A", label: "Mood Check", query: "mood check" },
        { id: "f-risk", icon: "\uD83D\uDEE1\uFE0F", label: "Risk Check", query: "risk check" },
        { id: "f-hot", icon: "\uD83D\uDD25", label: "What's Hot", query: "what's hot" },
      ];
    }
    // Default
    return [
      { id: "f-hot", icon: "\uD83D\uDD25", label: "What's Hot", query: "what's hot" },
      { id: "f-mood", icon: "\uD83D\uDE0A", label: "Mood Check", query: "mood check" },
      { id: "f-whale", icon: "\uD83D\uDC0B", label: "Whale Watch", query: "any whales" },
    ];
  }, [stats]);

  /* ── Generate options per category from live data ── */
  const getOptions = useCallback((cat: Cat): Opt[] => {
    const s = stats;
    switch (cat) {
      case "hot": {
        const tks = s.topTickers.slice(0, 6).map(t => ({
          id: `h-${t.tk}`,
          icon: t.callRatio >= 0.6 ? "\uD83D\uDCC8" : t.callRatio <= 0.4 ? "\uD83D\uDCC9" : "\u2696\uFE0F",
          label: t.tk,
          sub: `${Math.round(t.callRatio * 100)}% bull`,
          badge: fmt(t.total),
          badgeColor: t.callRatio >= 0.5 ? C.call : C.put,
          query: `${t.tk} update`,
        }));
        return [
          { id: "h-all", icon: "\uD83D\uDD25", label: "Full Ranking", sub: `${s.topTickers.length} tickers`, badge: fmt(s.totalPrem), badgeColor: C.gold, query: "what's hot" },
          ...tks,
        ];
      }
      case "mood": {
        const pct = Math.round(s.callRatio * 100);
        const opts: Opt[] = [
          { id: "m-vibe", icon: pct >= 60 ? "\uD83E\uDD29" : pct <= 40 ? "\uD83D\uDE30" : "\uD83E\uDD14", label: "Market Vibe", sub: `${pct}% bullish`, badge: pct >= 60 ? "BULL" : pct <= 40 ? "BEAR" : "NEUTRAL", badgeColor: pct >= 50 ? C.call : C.put, query: "mood check" },
          { id: "m-shift", icon: s.sentimentShift === "improving" ? "\uD83C\uDF08" : s.sentimentShift === "declining" ? "\uD83C\uDF27\uFE0F" : "\u2601\uFE0F", label: "Trend Shift", sub: s.sentimentShift, badge: s.sentimentShift === "stable" ? "FLAT" : s.sentimentShift === "improving" ? "UP" : "DOWN", badgeColor: s.sentimentShift === "improving" ? C.call : s.sentimentShift === "declining" ? C.put : C.dim, query: "mood check" },
          { id: "m-trend", icon: s.recentTrend === "bullish" ? "\uD83D\uDCC8" : s.recentTrend === "bearish" ? "\uD83D\uDCC9" : "\u2194\uFE0F", label: "Recent Flow", sub: `Last 5: ${s.recentTrend}`, query: "mood check" },
        ];
        if (s.hotStreak) opts.push({ id: "m-streak", icon: "\uD83D\uDD25", label: `${s.hotStreak} Streak`, sub: "On fire!", badge: "HOT", badgeColor: C.gold, query: `${s.hotStreak} update` });
        return opts;
      }
      case "whales": {
        const opts: Opt[] = [
          { id: "w-all", icon: "\uD83D\uDC0B", label: "Full Report", sub: `${s.blocks.length + s.sweeps.length} whale moves`, badge: String(s.blocks.length + s.sweeps.length), badgeColor: C.gold, query: "any whales" },
        ];
        if (s.blocks.length > 0) opts.push({ id: "w-blocks", icon: "\uD83E\uDDF1", label: "Block Trades", sub: `${s.blocks.length} institutional`, badge: String(s.blocks.length), badgeColor: C.gold, query: "any whales" });
        if (s.sweeps.length > 0) opts.push({ id: "w-sweeps", icon: "\u26A1", label: "Sweep Orders", sub: `${s.sweeps.length} urgent`, badge: String(s.sweeps.length), badgeColor: C.accent, query: "any whales" });
        if (s.biggestTrade) opts.push({ id: "w-big", icon: "\uD83D\uDC8E", label: `${s.biggestTrade.tk} Mega`, sub: `${s.biggestTrade.type} $${s.biggestTrade.strike}`, badge: fmt(s.biggestTrade.total), badgeColor: C.gold, query: "any whales" });
        return opts;
      }
      case "risk": {
        let rl = 0;
        if (s.concentration > 0.4) rl += 2;
        if (s.callRatio > 0.75 || s.callRatio < 0.25) rl += 2;
        if (s.sentimentShift !== "stable") rl += 1;
        if (s.blocks.length >= 3) rl += 1;
        if (s.anomalies.length >= 2) rl += 1;
        return [
          { id: "r-score", icon: rl >= 5 ? "\uD83D\uDD34" : rl >= 3 ? "\uD83D\uDFE1" : "\uD83D\uDFE2", label: "Risk Score", sub: rl >= 5 ? "HIGH RISK" : rl >= 3 ? "MODERATE" : "LOW RISK", badge: `${rl}/8`, badgeColor: rl >= 5 ? C.put : rl >= 3 ? C.gold : C.call, query: "risk check" },
          { id: "r-anomaly", icon: "\u26A0\uFE0F", label: "Anomalies", sub: s.anomalies.length > 0 ? "Issues found" : "All clear", badge: String(s.anomalies.length), badgeColor: s.anomalies.length > 0 ? C.put : C.call, query: "risk check" },
          { id: "r-conc", icon: "\uD83C\uDFAF", label: "Concentration", sub: `HHI: ${Math.round(s.concentration * 100)}%`, badge: s.concentration > 0.4 ? "HIGH" : "OK", badgeColor: s.concentration > 0.4 ? C.put : C.call, query: "risk check" },
        ];
      }
      case "volume": {
        const opts: Opt[] = [
          { id: "v-flow", icon: "\uD83D\uDCB0", label: "Total Flow", sub: `${s.velocity} trades`, badge: fmt(s.totalPrem), badgeColor: C.gold, query: "volume" },
          { id: "v-avg", icon: "\uD83D\uDCCF", label: "Avg Size", sub: "Per trade", badge: fmt(s.avgTradeSize), query: "volume" },
        ];
        if (s.topMover) opts.push({ id: "v-mover", icon: s.topMover.momentum > 0 ? "\uD83D\uDE80" : "\uD83D\uDCC9", label: `${s.topMover.tk} Moving`, sub: s.topMover.momentum > 0 ? "Accelerating" : "Slowing", badge: `${s.topMover.momentum > 0 ? "+" : ""}${Math.round(s.topMover.momentum * 100)}%`, badgeColor: s.topMover.momentum > 0 ? C.call : C.put, query: `${s.topMover.tk} update` });
        opts.push({ id: "v-detail", icon: "\uD83D\uDCCA", label: "Full Analysis", sub: "Deep breakdown", query: "volume" });
        return opts;
      }
      case "compare":
        return s.topTickers.slice(0, 8).map(t => ({
          id: `c-${t.tk}`,
          icon: t.callRatio >= 0.6 ? "\uD83D\uDCC8" : t.callRatio <= 0.4 ? "\uD83D\uDCC9" : "\u2696\uFE0F",
          label: t.tk,
          sub: `${Math.round(t.callRatio * 100)}% bull`,
          badge: fmt(t.total),
          badgeColor: t.callRatio >= 0.5 ? C.call : C.put,
          query: t.tk,
        }));
    }
  }, [stats]);

  /* ── Handle option click ── */
  const handleOpt = useCallback((opt: Opt) => {
    if (aiLoad) return;
    // Compare mode — pick two tickers
    if (activeCat === "compare" && mode !== "follow-up") {
      if (!comparePick) {
        playClick();
        setComparePick(opt.label);
        setMode("compare-pick");
        return;
      } else {
        const q = `${comparePick} vs ${opt.label}`;
        setComparePick(null);
        send(`\u2694\uFE0F ${q}`, q, makeFollowUps(q));
        return;
      }
    }
    send(opt.icon + " " + opt.label, opt.query, makeFollowUps(opt.query));
  }, [aiLoad, activeCat, mode, comparePick, send, makeFollowUps]);

  /* ── Category tab click ── */
  const handleCat = useCallback((cat: Cat) => {
    if (aiLoad) return;
    playClick();
    setActiveCat(cat);
    setComparePick(null);
    setMode("main");
  }, [aiLoad]);

  /* ── Back to main menu ── */
  const backToMenu = useCallback(() => {
    playClick();
    setMode("main");
    setComparePick(null);
  }, []);

  /* ── Keyboard shortcuts: 1-6 for categories ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < CATS.length && !aiLoad) {
        handleCat(CATS[idx].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiLoad, handleCat]);

  /* ── Current option set ── */
  const opts = mode === "follow-up" ? followUps : getOptions(activeCat);

  /* ── Status bar metrics ── */
  const moodPct = Math.round(stats.callRatio * 100);
  const moodIcon = moodPct >= 65 ? "\uD83D\uDE3A" : moodPct <= 35 ? "\uD83D\uDE40" : "\uD83D\uDC31";
  const topTk = stats.topTickers[0]?.tk || "\u2014";

  /* ── Bubble renderer ── */
  const bubble = (role: "ai" | "user", text: string, key: number | string, typing = false) => {
    const isAI = role === "ai";
    return (
      <div key={key} className="msg-in" style={{
        maxWidth: "94%",
        padding: "10px 14px",
        background: isAI
          ? "linear-gradient(135deg, rgba(204,136,255,0.10), rgba(255,136,187,0.06))"
          : "rgba(102,204,255,0.08)",
        border: `2px solid ${isAI ? "rgba(204,136,255,0.25)" : "rgba(102,204,255,0.18)"}`,
        alignSelf: isAI ? "flex-start" : "flex-end",
        wordBreak: "break-word" as const,
        whiteSpace: "pre-line" as const,
      }}>
        <div style={{
          fontSize: 11, fontFamily: FONTS.display, letterSpacing: 1.5,
          marginBottom: 6,
          color: isAI ? C.violet : C.accent,
          textShadow: `0 0 8px ${isAI ? C.violet : C.accent}`,
        }}>
          {isAI ? "\uD83D\uDC31 NEKO" : "\uD83E\uDDD1 YOU"}
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.6, color: C.text, fontFamily: FONTS.mono }}>
          {text}
          {typing && <span className="type-cursor" />}
        </div>
      </div>
    );
  };

  return (
    <PixelCard title="NEKO" titleIcon="\uD83D\uDC31" titleColor={C.violet} style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, minWidth: 0 }}>

      {/* ── Chat scroll area ── */}
      <div ref={chatRef} style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 0,
      }}>
        {msgs.map((m, i) => bubble(m.r, m.t, i))}
        {aiLoad && typingText && bubble("ai", typingText, "typing", true)}
        {aiLoad && !typingText && (
          <div className="msg-in" style={{
            maxWidth: "94%", padding: "10px 14px",
            background: "linear-gradient(135deg, rgba(204,136,255,0.10), rgba(255,136,187,0.06))",
            border: "2px solid rgba(204,136,255,0.25)",
          }}>
            <div style={{
              fontSize: 11, fontFamily: FONTS.display, letterSpacing: 1.5,
              marginBottom: 6, color: C.violet, textShadow: `0 0 8px ${C.violet}`,
            }}>{"\uD83D\uDC31"} NEKO</div>
            <span className="pixel-glow-pulse" style={{ fontSize: 17, color: C.violet, fontFamily: FONTS.mono }}>
              analyzing<span className="pixel-blink">...</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Live status strip ── */}
      <div style={{
        padding: "5px 10px",
        borderTop: `2px solid rgba(204,136,255,0.15)`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0,
        fontFamily: FONTS.mono,
        fontSize: 14,
        color: C.dim,
        background: "rgba(204,136,255,0.03)",
      }}>
        <span style={{ color: moodPct >= 50 ? C.call : C.put, textShadow: `0 0 4px ${moodPct >= 50 ? C.call : C.put}` }}>
          {moodIcon} {moodPct}%
        </span>
        <span style={{ color: "rgba(204,136,255,0.15)" }}>{"\u2502"}</span>
        <span style={{ color: C.gold }}>{"\uD83D\uDD25"} {topTk}</span>
        <span style={{ color: "rgba(204,136,255,0.15)" }}>{"\u2502"}</span>
        <span>{fmt(stats.totalPrem)}</span>
        {stats.anomalies.length > 0 && <>
          <span style={{ color: "rgba(204,136,255,0.15)" }}>{"\u2502"}</span>
          <span style={{ color: C.put, textShadow: `0 0 4px ${C.put}` }}>{"\u26A0"} {stats.anomalies.length}</span>
        </>}
      </div>

      {/* ── Category tabs ── */}
      <div style={{
        display: "flex",
        gap: 2,
        padding: "4px 6px 2px",
        borderTop: `1px solid rgba(204,136,255,0.08)`,
        flexShrink: 0,
      }}>
        {mode === "follow-up" ? (
          <button onClick={backToMenu} style={{
            flex: 1,
            fontSize: 10, fontFamily: FONTS.display,
            padding: "5px 4px",
            background: "rgba(102,204,255,0.08)",
            border: `2px solid ${C.accent}`,
            color: C.accent,
            cursor: "pointer",
            letterSpacing: 1,
            textShadow: `0 0 6px ${C.accent}`,
          }}>
            {"\u2190"} BACK TO MENU
          </button>
        ) : (
          CATS.map((cat, i) => {
            const active = activeCat === cat.id;
            return (
              <button key={cat.id} onClick={() => handleCat(cat.id)} style={{
                flex: 1,
                fontSize: 9, fontFamily: FONTS.display,
                padding: "4px 2px 3px",
                background: active ? "rgba(204,136,255,0.12)" : "transparent",
                border: `1px solid ${active ? C.violet : "rgba(204,136,255,0.08)"}`,
                color: active ? C.violet : C.dim,
                cursor: "pointer",
                letterSpacing: 0.5,
                textShadow: active ? `0 0 8px ${C.violet}` : "none",
                transition: "all 0.15s",
                lineHeight: 1.3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = C.violet; e.currentTarget.style.borderColor = "rgba(204,136,255,0.25)"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = C.dim; e.currentTarget.style.borderColor = "rgba(204,136,255,0.08)"; } }}>
                <span style={{ fontSize: 14 }}>{cat.icon}</span>
                <span>{cat.label}</span>
                <sup style={{ fontSize: 7, opacity: 0.4 }}>{i + 1}</sup>
              </button>
            );
          })
        )}
      </div>

      {/* ── Options grid ── */}
      <div style={{
        padding: "4px 6px 8px",
        flexShrink: 0,
        minHeight: 44,
      }}>
        {comparePick && (
          <div style={{
            fontSize: 14, fontFamily: FONTS.mono,
            color: C.gold, padding: "2px 6px 6px",
            textAlign: "center",
            textShadow: `0 0 6px ${C.gold}`,
          }}>
            {"\u2694\uFE0F"} {comparePick} vs ??? {"\u2014"} pick opponent
            <button onClick={backToMenu} style={{
              marginLeft: 8,
              fontSize: 11, fontFamily: FONTS.display,
              padding: "2px 8px",
              background: "transparent",
              border: `1px solid ${C.dim}`,
              color: C.dim,
              cursor: "pointer",
            }}>{"\u2715"}</button>
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: opts.length <= 3 ? "repeat(auto-fill, minmax(100px, 1fr))" : "repeat(auto-fill, minmax(88px, 1fr))",
          gap: 4,
        }}>
          {opts
            .filter(o => comparePick ? o.label !== comparePick : true)
            .map(opt => (
              <button key={opt.id} onClick={() => handleOpt(opt)} disabled={aiLoad} style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "7px 4px 5px",
                background: "rgba(204,136,255,0.04)",
                border: `1px solid rgba(204,136,255,0.12)`,
                color: C.text,
                cursor: aiLoad ? "not-allowed" : "pointer",
                opacity: aiLoad ? 0.4 : 1,
                fontFamily: FONTS.mono,
                transition: "all 0.15s",
                gap: 1,
                minWidth: 0,
              }}
                onMouseEnter={e => { if (!aiLoad) { e.currentTarget.style.borderColor = C.violet; e.currentTarget.style.background = "rgba(204,136,255,0.12)"; e.currentTarget.style.boxShadow = `0 0 10px rgba(204,136,255,0.15)`; } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(204,136,255,0.12)"; e.currentTarget.style.background = "rgba(204,136,255,0.04)"; e.currentTarget.style.boxShadow = "none"; }}>
                <span style={{ fontSize: 17, lineHeight: 1 }}>{opt.icon}</span>
                <span style={{ fontSize: 14, color: C.text, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{opt.label}</span>
                {opt.sub && <span style={{ fontSize: 11, color: C.dim, lineHeight: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{opt.sub}</span>}
                {opt.badge && (
                  <span style={{ fontSize: 10, fontFamily: FONTS.display, color: opt.badgeColor || C.dim, textShadow: opt.badgeColor ? `0 0 4px ${opt.badgeColor}` : "none", lineHeight: 1 }}>
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
        </div>
      </div>
    </PixelCard>
  );
}
