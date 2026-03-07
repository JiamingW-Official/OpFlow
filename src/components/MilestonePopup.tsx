import { useState, useEffect, useCallback } from "react";
import { C, FONTS } from "../constants/theme";

interface Milestone {
  id: number;
  text: string;
  emoji: string;
  removing: boolean;
}

const SEEN = new Set<string>();

export default function MilestonePopup() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const show = useCallback((key: string, emoji: string, text: string) => {
    if (SEEN.has(key)) return;
    SEEN.add(key);
    const id = Date.now() + Math.random();
    setMilestones(prev => [...prev.slice(-2), { id, text, emoji, removing: false }]);
    setTimeout(() => {
      setMilestones(prev => prev.map(m => m.id === id ? { ...m, removing: true } : m));
      setTimeout(() => setMilestones(prev => prev.filter(m => m.id !== id)), 500);
    }, 3000);
  }, []);

  useEffect(() => {
    const onMilestone = (e: Event) => {
      const { key, emoji, text } = (e as CustomEvent).detail;
      show(key, emoji, text);
    };
    window.addEventListener("flow:milestone", onMilestone);
    return () => window.removeEventListener("flow:milestone", onMilestone);
  }, [show]);

  if (milestones.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: "50%", left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 9996, pointerEvents: "none",
      display: "flex", flexDirection: "column", gap: 8, alignItems: "center",
    }}>
      {milestones.map(m => (
        <div key={m.id} className={m.removing ? "toast-out" : "toast-in"} style={{
          padding: "12px 24px",
          background: "rgba(15,14,23,0.95)",
          border: `3px solid ${C.gold}`,
          boxShadow: `0 0 30px ${C.gold}60, 0 0 60px ${C.gold}20`,
          fontFamily: FONTS.display,
          fontSize: 14, color: C.gold,
          textShadow: `0 0 12px ${C.gold}`,
          textAlign: "center",
          letterSpacing: 2,
        }}>
          <div style={{ fontSize: 32 }}>{m.emoji}</div>
          <div>{m.text}</div>
        </div>
      ))}
    </div>
  );
}
