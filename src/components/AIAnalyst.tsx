import { useEffect, useRef } from "react";
import { C, FONTS } from "../constants/theme";
import { useNeko } from "../context/NekoContext";
import PixelCard from "./ui/PixelCard";

export default function AIAnalyst() {
  const { msgs, aiLoad, typingText } = useNeko();
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, typingText]);

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
          {isAI ? "🐱 NEKO" : "🧑 YOU"}
        </div>
        <div style={{ fontSize: 17, lineHeight: 1.6, color: C.text, fontFamily: FONTS.mono }}>
          {text}
          {typing && <span className="type-cursor" />}
        </div>
      </div>
    );
  };

  return (
    <PixelCard title="NEKO" titleIcon="🐱" titleColor={C.violet} style={{ display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, minWidth: 0 }}>
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
        {/* Glow indicator on latest AI message */}
        {msgs.length > 1 && msgs[msgs.length - 1].r === "ai" && !aiLoad && (
          <div style={{
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.violet}40, transparent)`,
            marginTop: -4,
          }} />
        )}
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
            }}>🐱 NEKO</div>
            <span className="pixel-glow-pulse" style={{ fontSize: 17, color: C.violet, fontFamily: FONTS.mono }}>
              analyzing<span className="pixel-blink">...</span>
            </span>
            <div style={{
              marginTop: 4, height: 3, overflow: "hidden",
              display: "flex", gap: 2,
            }}>
              {[0, 1, 2, 3, 4].map(j => (
                <div key={j} className="pixel-sparkle" style={{
                  flex: 1, height: 3,
                  background: C.violet,
                  opacity: 0.5,
                  animationDelay: `${j * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </PixelCard>
  );
}
