import { createContext, useContext, useState, useRef, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useFlow } from "./FlowContext";
import { C } from "../constants/theme";
import { askNeko, analyze } from "../lib/neko-brain";
import { fmt } from "../lib/format";
import { playClick } from "../lib/sounds";
import type { Message } from "../types";

/* ── Types ── */
export interface Opt {
  id: string;
  icon: string;
  label: string;
  sub?: string;
  badge?: string;
  badgeColor?: string;
  query: string;
}

export type Cat = "hot" | "mood" | "whales" | "risk" | "volume" | "compare";
export type Mode = "main" | "follow-up" | "compare-pick";

export const CATS: { id: Cat; icon: string; label: string }[] = [
  { id: "hot", icon: "\uD83D\uDD25", label: "HOT" },
  { id: "mood", icon: "\uD83D\uDE0A", label: "MOOD" },
  { id: "whales", icon: "\uD83D\uDC0B", label: "WHALE" },
  { id: "risk", icon: "\uD83D\uDEE1\uFE0F", label: "RISK" },
  { id: "volume", icon: "\uD83D\uDCCA", label: "VOL" },
  { id: "compare", icon: "\u2694\uFE0F", label: "VS" },
];

interface NekoContextValue {
  msgs: Message[];
  aiLoad: boolean;
  typingText: string;
  activeCat: Cat;
  mode: Mode;
  comparePick: string | null;
  opts: Opt[];
  moodPct: number;
  moodIcon: string;
  topTk: string;
  totalFlow: string;
  anomalyCount: number;
  handleOpt: (opt: Opt) => void;
  handleCat: (cat: Cat) => void;
  backToMenu: () => void;
}

const Ctx = createContext<NekoContextValue | null>(null);

export function NekoProvider({ children }: { children: ReactNode }) {
  const { trades, tradesRef } = useFlow();

  const [msgs, setMsgs] = useState<Message[]>([{
    r: "ai",
    t: "Hiii! I'm Neko~ your market analyst! \uD83D\uDC31\u2728\nPick a category on the left to explore!\nI crunch numbers instantly~ (=^\u2010\u03C9\u2010^=)",
  }]);
  const [aiLoad, setAiLoad] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [activeCat, setActiveCat] = useState<Cat>("hot");
  const [mode, setMode] = useState<Mode>("main");
  const [comparePick, setComparePick] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<Opt[]>([]);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Live stats ── */
  const stats = useMemo(() => analyze(trades), [trades]);

  /* ── Typewriter ── */
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

  /* ── Send query ── */
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

  /* ── Follow-ups ── */
  const makeFollowUps = useCallback((query: string): Opt[] => {
    const s = stats;
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
    if (query.includes("mood")) return [
      { id: "f-hot", icon: "\uD83D\uDD25", label: "What's Hot", query: "what's hot" },
      { id: "f-whale", icon: "\uD83D\uDC0B", label: "Whale Watch", query: "any whales" },
      ...(s.topTickers[0] ? [{ id: "f-top", icon: "\uD83D\uDCCA", label: `${s.topTickers[0].tk} Dive`, query: `${s.topTickers[0].tk} update` }] : []),
    ];
    if (query.includes("whale")) return [
      { id: "f-risk", icon: "\uD83D\uDEE1\uFE0F", label: "Risk Check", query: "risk check" },
      { id: "f-hot", icon: "\uD83D\uDD25", label: "What's Hot", query: "what's hot" },
      ...(s.topTickers[0] ? [{ id: "f-top", icon: "\uD83D\uDCCA", label: `${s.topTickers[0].tk} Dive`, query: `${s.topTickers[0].tk} update` }] : []),
    ];
    if (query.includes(" vs ")) return [
      { id: "f-mood", icon: "\uD83D\uDE0A", label: "Mood", query: "mood check" },
      { id: "f-risk", icon: "\uD83D\uDEE1\uFE0F", label: "Risk", query: "risk check" },
      { id: "f-hot", icon: "\uD83D\uDD25", label: "Hot", query: "what's hot" },
    ];
    return [
      { id: "f-hot", icon: "\uD83D\uDD25", label: "What's Hot", query: "what's hot" },
      { id: "f-mood", icon: "\uD83D\uDE0A", label: "Mood Check", query: "mood check" },
      { id: "f-whale", icon: "\uD83D\uDC0B", label: "Whale Watch", query: "any whales" },
    ];
  }, [stats]);

  /* ── Options per category ── */
  const getOptions = useCallback((cat: Cat): Opt[] => {
    const s = stats;
    switch (cat) {
      case "hot": {
        const tks = s.topTickers.slice(0, 6).map(t => ({
          id: `h-${t.tk}`,
          icon: t.callRatio >= 0.6 ? "\uD83D\uDCC8" : t.callRatio <= 0.4 ? "\uD83D\uDCC9" : "\u2696\uFE0F",
          label: t.tk,
          sub: `${Math.round(t.callRatio * 100)}%`,
          badge: fmt(t.total),
          badgeColor: t.callRatio >= 0.5 ? C.call : C.put,
          query: `${t.tk} update`,
        }));
        return [
          { id: "h-all", icon: "\uD83D\uDD25", label: "Full Ranking", badge: fmt(s.totalPrem), badgeColor: C.gold, query: "what's hot" },
          ...tks,
        ];
      }
      case "mood": {
        const pct = Math.round(s.callRatio * 100);
        const opts: Opt[] = [
          { id: "m-vibe", icon: pct >= 60 ? "\uD83E\uDD29" : pct <= 40 ? "\uD83D\uDE30" : "\uD83E\uDD14", label: "Market Vibe", sub: `${pct}% bull`, badge: pct >= 60 ? "BULL" : pct <= 40 ? "BEAR" : "MIXED", badgeColor: pct >= 50 ? C.call : C.put, query: "mood check" },
          { id: "m-shift", icon: s.sentimentShift === "improving" ? "\uD83C\uDF08" : s.sentimentShift === "declining" ? "\uD83C\uDF27\uFE0F" : "\u2601\uFE0F", label: "Trend Shift", sub: s.sentimentShift, query: "mood check" },
          { id: "m-trend", icon: s.recentTrend === "bullish" ? "\uD83D\uDCC8" : s.recentTrend === "bearish" ? "\uD83D\uDCC9" : "\u2194\uFE0F", label: "Recent Flow", sub: s.recentTrend, query: "mood check" },
        ];
        if (s.hotStreak) opts.push({ id: "m-streak", icon: "\uD83D\uDD25", label: `${s.hotStreak} Streak`, badge: "HOT", badgeColor: C.gold, query: `${s.hotStreak} update` });
        return opts;
      }
      case "whales": {
        const opts: Opt[] = [
          { id: "w-all", icon: "\uD83D\uDC0B", label: "Full Report", sub: `${s.blocks.length + s.sweeps.length} moves`, query: "any whales" },
        ];
        if (s.blocks.length > 0) opts.push({ id: "w-blocks", icon: "\uD83E\uDDF1", label: "Blocks", badge: String(s.blocks.length), badgeColor: C.gold, query: "any whales" });
        if (s.sweeps.length > 0) opts.push({ id: "w-sweeps", icon: "\u26A1", label: "Sweeps", badge: String(s.sweeps.length), badgeColor: C.accent, query: "any whales" });
        if (s.biggestTrade) opts.push({ id: "w-big", icon: "\uD83D\uDC8E", label: s.biggestTrade.tk, badge: fmt(s.biggestTrade.total), badgeColor: C.gold, query: "any whales" });
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
          { id: "r-score", icon: rl >= 5 ? "\uD83D\uDD34" : rl >= 3 ? "\uD83D\uDFE1" : "\uD83D\uDFE2", label: "Risk Score", badge: `${rl}/8`, badgeColor: rl >= 5 ? C.put : rl >= 3 ? C.gold : C.call, query: "risk check" },
          { id: "r-anomaly", icon: "\u26A0\uFE0F", label: "Anomalies", badge: String(s.anomalies.length), badgeColor: s.anomalies.length > 0 ? C.put : C.call, query: "risk check" },
          { id: "r-conc", icon: "\uD83C\uDFAF", label: "Concentration", badge: `${Math.round(s.concentration * 100)}%`, query: "risk check" },
        ];
      }
      case "volume": {
        const opts: Opt[] = [
          { id: "v-flow", icon: "\uD83D\uDCB0", label: "Total Flow", badge: fmt(s.totalPrem), badgeColor: C.gold, query: "volume" },
          { id: "v-avg", icon: "\uD83D\uDCCF", label: "Avg Size", badge: fmt(s.avgTradeSize), query: "volume" },
        ];
        if (s.topMover) opts.push({ id: "v-mover", icon: s.topMover.momentum > 0 ? "\uD83D\uDE80" : "\uD83D\uDCC9", label: s.topMover.tk, badge: `${Math.round(s.topMover.momentum * 100)}%`, badgeColor: s.topMover.momentum > 0 ? C.call : C.put, query: `${s.topMover.tk} update` });
        opts.push({ id: "v-detail", icon: "\uD83D\uDCCA", label: "Full Analysis", query: "volume" });
        return opts;
      }
      case "compare":
        return s.topTickers.slice(0, 8).map(t => ({
          id: `c-${t.tk}`,
          icon: t.callRatio >= 0.6 ? "\uD83D\uDCC8" : t.callRatio <= 0.4 ? "\uD83D\uDCC9" : "\u2696\uFE0F",
          label: t.tk,
          sub: `${Math.round(t.callRatio * 100)}%`,
          badge: fmt(t.total),
          badgeColor: t.callRatio >= 0.5 ? C.call : C.put,
          query: t.tk,
        }));
    }
  }, [stats]);

  /* ── Handlers ── */
  const handleOpt = useCallback((opt: Opt) => {
    if (aiLoad) return;
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

  const handleCat = useCallback((cat: Cat) => {
    if (aiLoad) return;
    playClick();
    setActiveCat(cat);
    setComparePick(null);
    setMode("main");
  }, [aiLoad]);

  const backToMenu = useCallback(() => {
    playClick();
    setMode("main");
    setComparePick(null);
  }, []);

  /* ── Keyboard shortcuts 1-6 ── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < CATS.length && !aiLoad) handleCat(CATS[idx].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiLoad, handleCat]);

  /* ── Derived ── */
  const opts = useMemo(() => mode === "follow-up" ? followUps : getOptions(activeCat), [mode, followUps, activeCat, getOptions]);
  const moodPct = Math.round(stats.callRatio * 100);
  const moodIcon = moodPct >= 65 ? "\uD83D\uDE3A" : moodPct <= 35 ? "\uD83D\uDE40" : "\uD83D\uDC31";
  const topTk = stats.topTickers[0]?.tk || "\u2014";
  const totalFlow = fmt(stats.totalPrem);
  const anomalyCount = stats.anomalies.length;

  const value = useMemo<NekoContextValue>(() => ({
    msgs, aiLoad, typingText, activeCat, mode, comparePick, opts,
    moodPct, moodIcon, topTk, totalFlow, anomalyCount,
    handleOpt, handleCat, backToMenu,
  }), [msgs, aiLoad, typingText, activeCat, mode, comparePick, opts,
    moodPct, moodIcon, topTk, totalFlow, anomalyCount,
    handleOpt, handleCat, backToMenu]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNeko(): NekoContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNeko must be used within NekoProvider");
  return ctx;
}
