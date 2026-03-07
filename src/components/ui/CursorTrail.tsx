import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

const COLORS = ["#66ccff", "#cc88ff", "#ff88bb", "#ffdd66"];

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const rafRef = useRef(0);
  const running = useRef(false);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== window.innerWidth * dpr || canvas.height !== window.innerHeight * dpr) {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
    }

    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw & decay
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.life -= 0.04;
      p.x += p.vx;
      p.y += p.vy;

      if (p.life <= 0) {
        particles.current.splice(i, 1);
        continue;
      }

      const size = Math.max(Math.floor(p.life * 4), 1);
      ctx.globalAlpha = p.life * 0.6;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), size, size);
    }

    ctx.globalAlpha = 1;

    // Stop loop when no particles left
    if (particles.current.length === 0) {
      running.current = false;
      return;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  const startLoop = useCallback(() => {
    if (!running.current) {
      running.current = true;
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [animate]);

  // Particle burst events from trades only
  useEffect(() => {
    const onBurst = (e: Event) => {
      const { x, y, color } = (e as CustomEvent).detail;
      for (let i = 0; i < 7; i++) {
        const angle = (Math.PI * 2 * i) / 7 + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 2;
        particles.current.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y + (Math.random() - 0.5) * 10,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
        });
      }
      startLoop();
    };
    window.addEventListener("flow:particle-burst", onBurst);
    return () => {
      window.removeEventListener("flow:particle-burst", onBurst);
      cancelAnimationFrame(rafRef.current);
      running.current = false;
    };
  }, [startLoop]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9998,
      }}
    />
  );
}
