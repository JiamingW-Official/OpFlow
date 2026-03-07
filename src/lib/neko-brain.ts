import type { Trade } from "../types";
import { fmt } from "./format";

/**
 * Neko's local brain — advanced rule-based trade data analysis.
 * No API, no model download. Instant, accurate, offline.
 *
 * Features:
 * - Statistical analysis: volatility, momentum, concentration (HHI)
 * - Pattern detection: streaks, spikes, divergence, unusual activity
 * - Intent recognition: 8 categories with bilingual support
 * - Dynamic, personality-rich responses
 */

interface TickerStats {
  tk: string;
  total: number;
  count: number;
  callPrem: number;
  putPrem: number;
  callRatio: number;
  avgSize: number;
  maxTrade: number;
  blockCount: number;
  sweepCount: number;
  momentum: number;     // positive = accelerating, negative = decelerating
  volatility: number;   // standard deviation of trade sizes
}

interface TradeStats {
  topTickers: TickerStats[];
  totalPrem: number;
  callRatio: number;
  blocks: Trade[];
  sweeps: Trade[];
  biggestTrade: Trade | null;
  recentTrend: "bullish" | "bearish" | "mixed";
  hotStreak: string | null;
  // Advanced metrics
  concentration: number;     // HHI: 0 = diversified, 1 = single ticker
  velocity: number;          // trades per "time window"
  avgTradeSize: number;
  topMover: { tk: string; momentum: number } | null;
  anomalies: string[];       // unusual patterns detected
  sentimentShift: "improving" | "declining" | "stable";
}

function analyze(trades: Trade[]): TradeStats {
  const recent = trades.slice(0, 40);
  const tickerMap = new Map<string, { trades: Trade[] }>();

  for (const t of recent) {
    const entry = tickerMap.get(t.tk) || { trades: [] };
    entry.trades.push(t);
    tickerMap.set(t.tk, entry);
  }

  const topTickers: TickerStats[] = [...tickerMap.entries()]
    .map(([tk, d]) => {
      const total = d.trades.reduce((s, t) => s + t.total, 0);
      const callPrem = d.trades.filter(t => t.type === "CALL").reduce((s, t) => s + t.total, 0);
      const putPrem = total - callPrem;
      const callRatio = d.trades.length > 0 ? d.trades.filter(t => t.type === "CALL").length / d.trades.length : 0.5;
      const avgSize = d.trades.length > 0 ? total / d.trades.length : 0;
      const maxTrade = d.trades.length > 0 ? Math.max(...d.trades.map(t => t.total)) : 0;
      const blockCount = d.trades.filter(t => t.isBlock).length;
      const sweepCount = d.trades.filter(t => t.isSweep).length;

      // Momentum: compare first half vs second half premium
      const half = Math.floor(d.trades.length / 2);
      const firstHalf = d.trades.slice(half).reduce((s, t) => s + t.total, 0);
      const secondHalf = d.trades.slice(0, half).reduce((s, t) => s + t.total, 0);
      const momentum = firstHalf > 0 ? (secondHalf - firstHalf) / firstHalf : 0;

      // Volatility: std dev of trade sizes
      const sizes = d.trades.map(t => t.total);
      const mean = avgSize;
      const variance = sizes.length > 1 ? sizes.reduce((s, v) => s + (v - mean) ** 2, 0) / sizes.length : 0;
      const volatility = Math.sqrt(variance);

      return { tk, total, count: d.trades.length, callPrem, putPrem, callRatio, avgSize, maxTrade, blockCount, sweepCount, momentum, volatility };
    })
    .sort((a, b) => b.total - a.total);

  const totalPrem = recent.reduce((s, t) => s + t.total, 0);
  const calls = recent.filter(t => t.type === "CALL").length;
  const callRatio = recent.length > 0 ? calls / recent.length : 0.5;
  const blocks = recent.filter(t => t.isBlock);
  const sweeps = recent.filter(t => t.isSweep);
  const biggestTrade = recent.length > 0 ? recent.reduce((a, b) => a.total > b.total ? a : b) : null;

  // Recent trend — last 5 trades
  const last5 = trades.slice(0, 5);
  const last5Calls = last5.filter(t => t.type === "CALL").length;
  const recentTrend = last5Calls >= 4 ? "bullish" : last5Calls <= 1 ? "bearish" : "mixed";

  // Sentiment shift — compare last 10 vs previous 10
  const recent10 = trades.slice(0, 10);
  const prev10 = trades.slice(10, 20);
  const recentCallPct = recent10.length > 0 ? recent10.filter(t => t.type === "CALL").length / recent10.length : 0.5;
  const prevCallPct = prev10.length > 0 ? prev10.filter(t => t.type === "CALL").length / prev10.length : 0.5;
  const sentimentShift = recentCallPct - prevCallPct > 0.15 ? "improving" : recentCallPct - prevCallPct < -0.15 ? "declining" : "stable";

  // Hot streak: ticker with 3+ consecutive same-direction trades
  let hotStreak: string | null = null;
  const seen = new Map<string, { dir: string; streak: number }>();
  for (const t of trades.slice(0, 20)) {
    const prev = seen.get(t.tk);
    if (prev && prev.dir === t.type) {
      prev.streak++;
      if (prev.streak >= 3 && !hotStreak) hotStreak = t.tk;
    } else {
      seen.set(t.tk, { dir: t.type, streak: 1 });
    }
  }

  // HHI concentration index
  const shares = topTickers.map(t => totalPrem > 0 ? t.total / totalPrem : 0);
  const concentration = shares.reduce((s, sh) => s + sh * sh, 0);

  // Velocity
  const velocity = recent.length;

  // Average trade size
  const avgTradeSize = recent.length > 0 ? totalPrem / recent.length : 0;

  // Top mover by momentum
  const movers = topTickers.filter(t => t.count >= 3).sort((a, b) => Math.abs(b.momentum) - Math.abs(a.momentum));
  const topMover = movers.length > 0 ? { tk: movers[0].tk, momentum: movers[0].momentum } : null;

  // Anomaly detection
  const anomalies: string[] = [];
  if (biggestTrade && avgTradeSize > 0 && biggestTrade.total > avgTradeSize * 5) {
    anomalies.push(`🚨 ${biggestTrade.tk} had a trade ${(biggestTrade.total / avgTradeSize).toFixed(0)}x bigger than average!`);
  }
  if (concentration > 0.5) {
    const dominant = topTickers[0];
    anomalies.push(`⚠️ ${Math.round(concentration * 100)}% of action concentrated in ${dominant?.tk || "one ticker"}!`);
  }
  if (blocks.length >= 3) {
    anomalies.push(`🐋 ${blocks.length} whale blocks in recent flow — institutions are moving!`);
  }
  if (sweeps.length >= 5) {
    anomalies.push(`⚡ ${sweeps.length} sweep orders — someone is URGENTLY buying!`);
  }
  for (const ts of topTickers) {
    if (ts.count >= 4 && ts.callRatio > 0.85) {
      anomalies.push(`📈 ${ts.tk}: ${Math.round(ts.callRatio * 100)}% calls — extremely one-sided!`);
    }
    if (ts.count >= 4 && ts.callRatio < 0.15) {
      anomalies.push(`📉 ${ts.tk}: ${Math.round((1 - ts.callRatio) * 100)}% puts — heavy bearish positioning!`);
    }
  }

  return { topTickers, totalPrem, callRatio, blocks, sweeps, biggestTrade, recentTrend, hotStreak, concentration, velocity, avgTradeSize, topMover, anomalies, sentimentShift };
}

// ─── Response generators ───

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function answerHot(stats: TradeStats): string {
  const top = stats.topTickers.slice(0, 5);
  if (top.length === 0) return "The arcade is empty... no players yet~ 🕹️💤\nCome back when the action starts! (=^-ω-^=)";

  const lines = top.map((t, i) => {
    const medal = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"][i];
    const dir = t.callRatio >= 0.65 ? "📈 bullish" : t.callRatio <= 0.35 ? "📉 bearish" : "⚖️ mixed";
    const momIcon = t.momentum > 0.3 ? "🚀" : t.momentum < -0.3 ? "📉" : "";
    return `${medal} ${t.tk}: ${fmt(t.total)} (${Math.round(t.callRatio * 100)}% UP ${dir}) ${momIcon}`;
  });

  const hype = pick([
    "The arcade is ON FIRE! 🔥",
    "Money machines going BRRR! 💸",
    "Players are stacking coins! 🪙",
    "The leaderboard is LIT! ✨",
  ]);

  let extra = "";
  if (stats.topMover && Math.abs(stats.topMover.momentum) > 0.5) {
    extra += `\n\n${stats.topMover.momentum > 0 ? "📈" : "📉"} ${stats.topMover.tk} is ${stats.topMover.momentum > 0 ? "ACCELERATING" : "slowing down"}!`;
  }
  if (stats.hotStreak) {
    extra += `\n🔥 ${stats.hotStreak} is on a HOT STREAK!`;
  }

  return `${hype}\n${lines.join("\n")}${extra}`;
}

function answerMood(stats: TradeStats): string {
  const pct = Math.round(stats.callRatio * 100);
  const shift = stats.sentimentShift;
  const shiftMsg = shift === "improving" ? "\n📊 Trend: Mood is IMPROVING! More players betting UP recently~ 🌈"
    : shift === "declining" ? "\n📊 Trend: Mood is getting WORSE... players shifting to DOWN bets 😰"
    : "\n📊 Trend: Steady vibes — no big shift in sentiment~";

  let mood: string;
  if (pct >= 75) mood = `EUPHORIA MODE! 🤩 ${pct}% betting UP!\nEveryone's stacking coins like Mario! The crowd thinks we're going to the MOON! 🌙🚀`;
  else if (pct >= 60) mood = `The crowd is HYPED! 🎉 ${pct}% betting UP!\nPositive energy in the arcade~ Players are feeling confident! ✨`;
  else if (pct >= 45) mood = `It's a coin flip! ⚖️ ${pct}% UP vs ${100 - pct}% DOWN\nThe crowd can't decide~ Both sides are fighting! 🤔⚔️`;
  else if (pct >= 30) mood = `Getting nervous... 😰 Only ${pct}% betting UP\nThe bears are prowling the arcade~ Watch your coins! 🐻💨`;
  else mood = `PANIC MODE! 😱 Only ${pct}% betting UP!\nEveryone's running for the exits! Red alerts flashing! 🚨⚡`;

  let extra = "";
  if (stats.anomalies.length > 0) {
    extra += `\n\n${pick(["⚡ Alert:", "🔔 Notice:", "👀 Spotted:"])} ${stats.anomalies[0]}`;
  }

  return `${mood}${shiftMsg}${extra}`;
}

function answerWhales(stats: TradeStats): string {
  if (stats.blocks.length === 0 && stats.sweeps.length === 0)
    return "No whales spotted~ the ocean is calm 🌊😴\nBig players haven't entered the arcade yet. Keep watching! 🔭";

  const parts: string[] = [];

  if (stats.blocks.length > 0) {
    parts.push("🐋 WHALE ALERT! Institutional-size trades detected!");
    for (const b of stats.blocks.slice(0, 3)) {
      const dir = b.type === "CALL" ? "📈 Betting UP" : "📉 Betting DOWN";
      parts.push(`  • ${b.tk} — ${fmt(b.total)} block! ${dir} | $${b.strike} strike | ${b.exp}`);
    }
  }

  if (stats.sweeps.length > 0) {
    parts.push(`\n⚡ ${stats.sweeps.length} SWEEP orders — aggressive buying across exchanges!`);
    const sweepTickers = [...new Set(stats.sweeps.map(s => s.tk))];
    parts.push(`  Targets: ${sweepTickers.join(", ")}`);
  }

  if (stats.biggestTrade) {
    const bt = stats.biggestTrade;
    const sizeRatio = stats.avgTradeSize > 0 ? bt.total / stats.avgTradeSize : 1;
    parts.push(`\n💎 BIGGEST play: ${bt.tk} ${fmt(bt.total)} (${sizeRatio.toFixed(1)}x average size!)`);
    parts.push(`   ${bt.type === "CALL" ? "📈" : "📉"} $${bt.strike} ${bt.exp} | ${bt.vol.toLocaleString()} contracts`);
  }

  // Whale sentiment
  const whaleCallCount = [...stats.blocks, ...stats.sweeps].filter(t => t.type === "CALL").length;
  const whaleTotal = [...stats.blocks, ...stats.sweeps].length;
  if (whaleTotal >= 2) {
    const whaleCallPct = Math.round((whaleCallCount / whaleTotal) * 100);
    parts.push(`\n🧭 Whale sentiment: ${whaleCallPct}% bullish — ${whaleCallPct >= 60 ? "smart money is BUYING! 🚀" : whaleCallPct <= 40 ? "smart money is HEDGING! 🛡️" : "smart money is split~ 🤷"}`);
  }

  return parts.join("\n");
}

function answerTicker(stats: TradeStats, ticker: string): string {
  const t = stats.topTickers.find(x => x.tk === ticker.toUpperCase());
  if (!t) return `Nobody's playing ${ticker.toUpperCase()} right now~ 🕹️\nMaybe check back later! I'll keep watching for you~ (=^-ω-^=)`;

  const parts: string[] = [];
  parts.push(`📊 ${t.tk} DEEP DIVE`);
  parts.push(`${"═".repeat(20)}`);

  // Volume & premium
  parts.push(`💰 Total premium: ${fmt(t.total)}`);
  parts.push(`📝 ${t.count} trades | Avg size: ${fmt(t.avgSize)}`);
  parts.push(`🏆 Biggest trade: ${fmt(t.maxTrade)}`);

  // Direction
  const callPct = Math.round(t.callRatio * 100);
  parts.push(`\n📈 Calls: ${fmt(t.callPrem)} (${callPct}%)`);
  parts.push(`📉 Puts: ${fmt(t.putPrem)} (${100 - callPct}%)`);

  if (callPct >= 70) parts.push("🚀 SUPER BULLISH — crowd is ALL-IN on UP!");
  else if (callPct >= 55) parts.push("😊 Leaning bullish — more betting UP than DOWN~");
  else if (callPct <= 30) parts.push("💀 VERY BEARISH — heavy downside positioning!");
  else if (callPct <= 45) parts.push("😰 Leaning bearish — more betting DOWN~");
  else parts.push("⚖️ Balanced — tug-of-war between UP and DOWN!");

  // Institutional activity
  if (t.blockCount > 0 || t.sweepCount > 0) {
    parts.push(`\n🐋 Institutional: ${t.blockCount} blocks, ${t.sweepCount} sweeps`);
  }

  // Momentum
  if (Math.abs(t.momentum) > 0.2) {
    parts.push(t.momentum > 0
      ? `\n🚀 Momentum: ACCELERATING! Activity ramping UP!`
      : `\n📉 Momentum: Slowing down... interest fading~`);
  }

  // Volatility context
  if (t.volatility > t.avgSize * 0.8) {
    parts.push(`\n⚠️ High volatility: trade sizes are very uneven — big players mixed with small!`);
  }

  const sign = pick(["(=^-ω-^=)", "✨", "🎮", "🏆", "~nya"]);
  parts.push(`\n${t.callRatio >= 0.5 ? "Looking strong!" : "Be careful~"} ${sign}`);

  return parts.join("\n");
}

function answerVolume(stats: TradeStats): string {
  const parts: string[] = [];
  parts.push(`📊 VOLUME ANALYSIS`);
  parts.push(`${"═".repeat(20)}`);

  parts.push(`🎯 ${stats.velocity} trades in recent window`);
  parts.push(`💰 Total premium: ${fmt(stats.totalPrem)}`);
  parts.push(`📏 Average trade: ${fmt(stats.avgTradeSize)}`);

  // Concentration
  const hhi = Math.round(stats.concentration * 100);
  if (hhi > 40) parts.push(`\n⚠️ HIGH concentration (${hhi}%) — most action in few tickers!`);
  else if (hhi > 25) parts.push(`\n📊 Moderate concentration (${hhi}%) — a few leaders dominate~`);
  else parts.push(`\n✨ Well diversified (${hhi}%) — action spread across many tickers!`);

  // Top 3 by count
  const byCount = [...stats.topTickers].sort((a, b) => b.count - a.count).slice(0, 3);
  if (byCount.length > 0) {
    parts.push("\n🔢 Most active:");
    for (const t of byCount) {
      parts.push(`  ${t.tk}: ${t.count} trades (avg ${fmt(t.avgSize)})`);
    }
  }

  // Blocks & sweeps summary
  if (stats.blocks.length > 0 || stats.sweeps.length > 0) {
    parts.push(`\n🐋 ${stats.blocks.length} block trades | ⚡ ${stats.sweeps.length} sweep orders`);
  }

  return parts.join("\n");
}

function answerRisk(stats: TradeStats): string {
  const parts: string[] = [];
  parts.push(`🛡️ RISK CHECK`);
  parts.push(`${"═".repeat(20)}`);

  // Overall risk assessment
  let riskLevel = 0;
  const flags: string[] = [];

  if (stats.concentration > 0.4) { riskLevel += 2; flags.push("High ticker concentration"); }
  if (stats.callRatio > 0.75 || stats.callRatio < 0.25) { riskLevel += 2; flags.push("Extreme sentiment skew"); }
  if (stats.sentimentShift !== "stable") { riskLevel += 1; flags.push(`Sentiment ${stats.sentimentShift}`); }
  if (stats.blocks.length >= 3) { riskLevel += 1; flags.push("Heavy institutional activity"); }
  if (stats.anomalies.length >= 2) { riskLevel += 1; flags.push("Multiple anomalies detected"); }

  const riskEmoji = riskLevel >= 5 ? "🔴" : riskLevel >= 3 ? "🟡" : "🟢";
  const riskText = riskLevel >= 5 ? "HIGH RISK" : riskLevel >= 3 ? "MODERATE" : "LOW RISK";
  parts.push(`${riskEmoji} Risk level: ${riskText} (${riskLevel}/8)`);

  if (flags.length > 0) {
    parts.push("\n🚩 Risk factors:");
    for (const f of flags) parts.push(`  • ${f}`);
  }

  // Anomalies
  if (stats.anomalies.length > 0) {
    parts.push("\n👀 Anomalies:");
    for (const a of stats.anomalies.slice(0, 3)) parts.push(`  ${a}`);
  }

  // Advice
  parts.push(riskLevel >= 5
    ? "\n⚡ Neko says: The arcade is WILD right now! Be extra careful~ 😰"
    : riskLevel >= 3
      ? "\n🐱 Neko says: Some unusual activity! Keep your eyes open~"
      : "\n✨ Neko says: Things look calm! Normal arcade vibes~ (=^-ω-^=)");

  return parts.join("\n");
}

function answerCompare(stats: TradeStats, tickers: string[]): string {
  const found = tickers.map(tk => stats.topTickers.find(x => x.tk === tk.toUpperCase())).filter(Boolean) as TickerStats[];
  if (found.length < 2) {
    return `I need data for both tickers to compare~ 🤔\nTry asking about specific tickers first! ${pick(["(=^-ω-^=)", "✨", "~nya"])}`;
  }

  const [a, b] = found;
  const parts: string[] = [];
  parts.push(`⚔️ ${a.tk} vs ${b.tk} — HEAD TO HEAD!`);
  parts.push(`${"═".repeat(24)}`);

  parts.push(`\n💰 Premium: ${a.tk} ${fmt(a.total)} vs ${b.tk} ${fmt(b.total)} ${a.total > b.total ? `→ ${a.tk} wins! 👑` : `→ ${b.tk} wins! 👑`}`);
  parts.push(`📝 Activity: ${a.tk} ${a.count} trades vs ${b.tk} ${b.count} trades`);
  parts.push(`📈 Bullish: ${a.tk} ${Math.round(a.callRatio * 100)}% vs ${b.tk} ${Math.round(b.callRatio * 100)}%`);
  parts.push(`🏆 Max trade: ${a.tk} ${fmt(a.maxTrade)} vs ${b.tk} ${fmt(b.maxTrade)}`);

  // Winner
  let aScore = 0, bScore = 0;
  if (a.total > b.total) aScore++; else bScore++;
  if (a.count > b.count) aScore++; else bScore++;
  if (a.momentum > b.momentum) aScore++; else bScore++;

  const winner = aScore > bScore ? a.tk : b.tk;
  parts.push(`\n🏅 Overall: ${winner} is winning the battle! ${pick(["✨", "🔥", "🎮"])}`);

  return parts.join("\n");
}

function answerGeneral(stats: TradeStats): string {
  const parts: string[] = [];

  parts.push(`${pick(["Here's the scoop!", "Market report!", "Let me analyze~", "Neko's report!"])} 🔍`);
  parts.push(`${"═".repeat(20)}`);

  // Overall summary
  parts.push(`💰 Total flow: ${fmt(stats.totalPrem)} across ${stats.velocity} trades`);
  parts.push(`📏 Average bet: ${fmt(stats.avgTradeSize)}`);

  // Trend
  if (stats.recentTrend === "bullish") parts.push("📈 Recent trend: UP UP UP! The crowd is bullish~");
  else if (stats.recentTrend === "bearish") parts.push("📉 Recent trend: Going DOWN... bears in control~");
  else parts.push("⚖️ Recent trend: Mixed signals~ no clear direction!");

  // Sentiment shift
  if (stats.sentimentShift !== "stable") {
    parts.push(stats.sentimentShift === "improving"
      ? "🌈 Mood is IMPROVING — shift towards bullish!"
      : "😰 Mood is DECLINING — shift towards bearish!");
  }

  // Hot streak
  if (stats.hotStreak) parts.push(`🔥 ${stats.hotStreak} is on a HOT STREAK!`);

  // Top 3
  if (stats.topTickers.length > 0) {
    parts.push("\n👑 Top players:");
    for (const t of stats.topTickers.slice(0, 3)) {
      parts.push(`  ${t.tk}: ${fmt(t.total)} (${Math.round(t.callRatio * 100)}% UP)`);
    }
  }

  // Key anomaly
  if (stats.anomalies.length > 0) {
    parts.push(`\n${stats.anomalies[0]}`);
  }

  parts.push(`\n${pick(["Ask me more!", "Want details on a ticker?", "Try 'mood check' or 'any whales?'~"])} (=^-ω-^=)`);

  return parts.join("\n");
}

function answerHelp(): string {
  return [
    "🐱 Hi! I'm Neko~ Here's what I can do!",
    "═".repeat(24),
    "",
    "🔥 \"What's hot?\" — Top tickers by premium",
    "😊 \"Mood check\" — Overall market sentiment",
    "🐋 \"Any whales?\" — Big institutional trades",
    "📊 \"NVDA update\" — Deep dive on any ticker",
    "📈 \"Volume?\" — Trade volume & concentration",
    "🛡️ \"Risk check\" — Risk assessment & anomalies",
    "⚔️ \"NVDA vs TSLA\" — Head-to-head comparison",
    "",
    "💡 I also understand Chinese! Try: 行情怎么样、有鲸鱼吗、风险分析",
    "",
    "I analyze live trade data instantly —",
    "no internet needed! (=^-ω-^=)✨",
  ].join("\n");
}

// ─── Intent detection ───

const TICKERS = ["NVDA", "SPY", "AAPL", "TSLA", "META", "QQQ", "AMD", "MSFT", "GOOGL", "TSM", "AMZN", "NFLX"];

type IntentType = "hot" | "mood" | "whales" | "ticker" | "volume" | "risk" | "compare" | "help" | "general";

function detectIntent(q: string): { type: IntentType; ticker?: string; tickers?: string[] } {
  const lower = q.toLowerCase();

  // Help
  if (/^(help|what can you|how do|teach me|指南|帮助|你能做什么|你会什么)/.test(lower)) return { type: "help" };

  // Compare — "X vs Y", "compare X Y"
  const vsMatch = lower.match(/(\w+)\s*(?:vs|versus|compare|against|pk|对比)\s*(\w+)/);
  if (vsMatch) {
    const found = [vsMatch[1], vsMatch[2]]
      .map(w => TICKERS.find(tk => tk.toLowerCase() === w.toLowerCase()))
      .filter(Boolean) as string[];
    if (found.length === 2) return { type: "compare", tickers: found };
  }

  // Hot / popular / trending
  if (/hot|popular|trend|fire|busy|active|leader|top|rank|热|火|忙|流行|行情|排行/.test(lower)) return { type: "hot" };

  // Mood / sentiment
  if (/mood|feel|sentiment|vibe|happy|sad|scare|emotion|opti|pessi|心情|情绪|氛围|感觉|恐慌|乐观/.test(lower)) return { type: "mood" };

  // Whales / big money / blocks
  if (/whale|block|sweep|big.*money|huge|mega|institut|smart\s*money|鲸|大单|大钱|机构|主力/.test(lower)) return { type: "whales" };

  // Volume / activity
  if (/volume|activity|busy|concent|divers|spread|分散|集中|活跃|成交量/.test(lower)) return { type: "volume" };

  // Risk / anomaly
  if (/risk|danger|warn|anomal|unusual|alert|safe|careful|风险|危险|异常|预警|安全/.test(lower)) return { type: "risk" };

  // Specific ticker
  for (const tk of TICKERS) {
    if (lower.includes(tk.toLowerCase())) return { type: "ticker", ticker: tk };
  }

  return { type: "general" };
}

// ─── Main entry ───

export function askNeko(question: string, trades: Trade[]): string {
  if (trades.length === 0) {
    return "The arcade is empty~ no data yet! 🕹️💤\nWait for some trades to come in and ask me again! (=^-ω-^=)";
  }

  const stats = analyze(trades);
  const intent = detectIntent(question);

  switch (intent.type) {
    case "hot": return answerHot(stats);
    case "mood": return answerMood(stats);
    case "whales": return answerWhales(stats);
    case "ticker": return answerTicker(stats, intent.ticker!);
    case "volume": return answerVolume(stats);
    case "risk": return answerRisk(stats);
    case "compare": return answerCompare(stats, intent.tickers!);
    case "help": return answerHelp();
    case "general": return answerGeneral(stats);
  }
}
