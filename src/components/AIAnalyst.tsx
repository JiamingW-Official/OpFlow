import { useState, useEffect, useRef, useCallback } from "react";
import { useFlow } from "../context/FlowContext";
import { C, FONTS } from "../constants/theme";
import { askNeko } from "../lib/neko-brain";
import PixelCard from "./ui/PixelCard";
import type { Message } from "../types";

export default function AIAnalyst() {
  const { tradesRef } = useFlow();
  const [msgs, setMsgs] = useState<Message[]>([{
    r: "ai",
    t: "Hiii! I'm Neko your market guide! 🐱✨ Ask me anything~ Like \"what's hot?\" or \"mood check\" — I analyze the data instantly, no internet needed! (=^-ω-^=)",
  }]);
  const [inp, setInp] = useState("");
  const [aiLoad, setAiLoad] = useState(false);
  const [typingText, setTypingText] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, typingText]);

  const typewriterEffect = useCallback((fullText: string) => {
    let idx = 0;
    setTypingText("");
    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      idx++;
      if (idx >= fullText.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        setTypingText("");
        setMsgs(p => [...p, { r: "ai", t: fullText }]);
        setAiLoad(false);
        return;
      }
      // Type 2-4 chars per tick for speed variation
      const chunk = Math.min(idx + Math.floor(Math.random() * 3), fullText.length);
      idx = chunk;
      setTypingText(fullText.slice(0, idx));
    }, 15);
  }, []);

  const askAI = useCallback(() => {
    if (!inp.trim() || aiLoad) return;
    const q = inp.trim();
    setInp("");
    setMsgs(p => [...p, { r: "user", t: q }]);
    setAiLoad(true);

    // Small delay for "thinking" feel, then typewriter
    setTimeout(() => {
      const answer = askNeko(q, tradesRef.current);
      typewriterEffect(answer);
    }, 300 + Math.random() * 300);
  }, [inp, aiLoad, tradesRef, typewriterEffect]);

  const quickPrompts = [
    { q: "🔥 What's hot?", key: "1" },
    { q: "😊 Mood check", key: "2" },
    { q: "🐋 Any whales?", key: "3" },
    { q: "🛡️ Risk check", key: "4" },
  ];

  // Quick prompt via keyboard (1-4 when input not focused)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < quickPrompts.length && !aiLoad) {
        setInp(quickPrompts[idx].q);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiLoad]); // eslint-disable-line

  const sendQuick = useCallback((q: string) => {
    if (aiLoad) return;
    setInp("");
    setMsgs(p => [...p, { r: "user", t: q }]);
    setAiLoad(true);
    setTimeout(() => {
      const answer = askNeko(q, tradesRef.current);
      typewriterEffect(answer);
    }, 200 + Math.random() * 200);
  }, [aiLoad, tradesRef, typewriterEffect]);

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
            whiteSpace: "pre-line",
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
        {aiLoad && typingText && (
          <div className="msg-in" style={{
            maxWidth: "95%", padding: "6px 8px",
            background: "linear-gradient(135deg, rgba(204,136,255,0.1), rgba(255,136,187,0.06))",
            border: "2px solid rgba(204,136,255,0.25)",
            whiteSpace: "pre-line",
          }}>
            <div style={{ fontSize: 14, color: C.violet, textShadow: `0 0 6px ${C.violet}` }}>🐱 Neko</div>
            <div style={{ fontSize: 20, lineHeight: 1.4, color: C.text }}>
              <span>{typingText}</span>
              <span className="type-cursor" />
            </div>
          </div>
        )}
        {aiLoad && !typingText && (
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
        {quickPrompts.map(p => (
          <button key={p.q} onClick={() => sendQuick(p.q)} style={{
            fontSize: 16, padding: "2px 5px",
            background: "transparent",
            border: "2px solid rgba(204,136,255,0.12)",
            color: C.dim,
            fontFamily: FONTS.mono,
            position: "relative",
          }}
            onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = C.violet; (e.target as HTMLElement).style.color = C.violet; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = "rgba(204,136,255,0.12)"; (e.target as HTMLElement).style.color = C.dim; }}>
            {p.q}
            <span style={{
              fontSize: 9, fontFamily: FONTS.display, color: C.dim, opacity: 0.4,
              marginLeft: 3, verticalAlign: "super",
            }}>{p.key}</span>
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
