import { useState, useEffect, useRef, useCallback } from "react";
import { useFlow } from "../context/FlowContext";
import { C, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
import type { Message } from "../types";

export default function AIAnalyst() {
  const { tradesRef } = useFlow();
  const [msgs, setMsgs] = useState<Message[]>([{
    r: "ai",
    t: "Hiii! I'm Neko your market guide! Ask me anything~ Like \"which stock is popular?\" or \"is everyone happy?\" I'll explain it super simply! (=^-ω-^=)✨",
  }]);
  const [inp, setInp] = useState("");
  const [aiLoad, setAiLoad] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  const askAI = useCallback(async () => {
    if (!inp.trim() || aiLoad) return;
    const q = inp.trim();
    setInp("");
    setMsgs(p => [...p, { r: "user", t: q }]);
    setAiLoad(true);

    const context = tradesRef.current.slice(0, 20).map(t =>
      `${t.tk} ${t.type} $${t.strike} exp:${t.exp} vol:${t.vol.toLocaleString()} prem:$${t.prem} total:${fmt(t.total)}${t.isBlock ? " [BLOCK]" : ""}${t.isSweep ? " [SWEEP]" : ""}`
    ).join("\n");

    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_KEY as string | undefined;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
        headers["anthropic-dangerous-direct-browser-access"] = "true";
      }

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are Neko 🐱, the cutest pixel cat market guide ever! You're in a fun arcade game that tracks real stock market bets. Your job: make it FUN and EASY to understand.

Live data (recent bets):
${context}

YOUR STYLE:
- Talk like a cute game character! Use emoji EVERYWHERE
- NEVER use: options, call, put, premium, strike, expiry, bullish, bearish, implied volatility
- INSTEAD say: "betting UP 📈", "betting DOWN 📉", "big money move 💰", "whale alert 🐋", "rush buy ⚡"
- Use game metaphors: "NVDA is on a WIN STREAK! 🏆", "money is FLOODING in like a tsunami! 🌊"
- Compare to food/games: "hotter than a pizza! 🍕", "stacking coins like Mario! 🪙"
- Keep it to 2-3 SHORT sentences max
- Always end with an emoji or kaomoji
- Be HYPED and encouraging!
- Answer in the same language as the user's question`,
          messages: [{ role: "user", content: q }],
        }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { r: "ai", t: data.content?.[0]?.text || "Nyaa~ lost signal! Try again? ><" }]);
    } catch {
      setMsgs(p => [...p, { r: "ai", t: "Meow! Can't connect~ Check your internet! (>_<)" }]);
    }
    setAiLoad(false);
  }, [inp, aiLoad, tradesRef]);

  const quickPrompts = [
    "🔥 What's hot?",
    "😊 Mood check",
    "🐋 Any whales?",
    "✨ NVDA update",
  ];

  return (
    <PixelCard title="NEKO" titleIcon="🐱" titleColor={C.violet} style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, minWidth: 0 }}>
      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 6px", display: "flex", flexDirection: "column", gap: 4, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} className="msg-in" style={{
            maxWidth: "95%", padding: "6px 8px",
            background: m.r === "ai"
              ? "linear-gradient(135deg, rgba(204,136,255,0.1), rgba(255,136,187,0.06))"
              : "rgba(255,255,255,0.04)",
            border: `2px solid ${m.r === "ai" ? "rgba(204,136,255,0.25)" : "rgba(255,255,255,0.08)"}`,
            alignSelf: m.r === "ai" ? "flex-start" : "flex-end",
            overflow: "hidden", wordBreak: "break-word",
          }}>
            <div style={{
              fontSize: 14, marginBottom: 2,
              color: m.r === "ai" ? C.violet : C.dim,
              textShadow: m.r === "ai" ? `0 0 6px ${C.violet}` : "none",
            }}>
              {m.r === "ai" ? "🐱 Neko" : "🧑 You"}
            </div>
            <div style={{ fontSize: 20, lineHeight: 1.4, color: C.text }}>{m.t}</div>
          </div>
        ))}
        {aiLoad && (
          <div className="msg-in" style={{
            maxWidth: "95%", padding: "6px 8px",
            background: "linear-gradient(135deg, rgba(204,136,255,0.1), rgba(255,136,187,0.06))",
            border: "2px solid rgba(204,136,255,0.25)",
          }}>
            <div style={{ fontSize: 14, color: C.violet, textShadow: `0 0 6px ${C.violet}` }}>🐱 Neko</div>
            <span className="pixel-glow-pulse" style={{ fontSize: 20, color: C.violet }}>
              thinking<span className="pixel-blink">...</span>
            </span>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div style={{ padding: "3px 6px", display: "flex", flexWrap: "wrap", gap: 2 }}>
        {quickPrompts.map(q => (
          <button key={q} onClick={() => setInp(q)} style={{
            fontSize: 16, padding: "2px 5px",
            background: "transparent",
            border: "2px solid rgba(204,136,255,0.12)",
            color: C.dim, cursor: "pointer",
            fontFamily: FONTS.mono,
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = C.violet; (e.target as HTMLElement).style.color = C.violet; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "rgba(204,136,255,0.12)"; (e.target as HTMLElement).style.color = C.dim; }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "4px 6px", borderTop: "3px solid rgba(204,136,255,0.1)", display: "flex", gap: 3 }}>
        <input
          style={{
            flex: 1, background: "rgba(204,136,255,0.04)",
            border: "2px solid rgba(204,136,255,0.15)",
            padding: "4px 8px", color: C.text, fontSize: 20,
            outline: "none", fontFamily: FONTS.mono,
            minWidth: 0,
          }}
          value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && askAI()}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = C.violet; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = "rgba(204,136,255,0.15)"; }}
          placeholder="Ask Neko~"
        />
        <button onClick={askAI} style={{
          padding: "4px 8px", background: "transparent",
          border: `2px solid ${C.violet}`,
          color: C.violet, fontSize: 20, cursor: "pointer",
          fontFamily: FONTS.mono,
          textShadow: `0 0 6px ${C.violet}`,
          flexShrink: 0,
        }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(204,136,255,0.15)"; }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = "transparent"; }}>
          GO!
        </button>
      </div>
    </PixelCard>
  );
}
