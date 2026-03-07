import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  life: number;
  color: string;
}

const COLORS = ["#66ccff", "#cc88ff", "#ff88bb", "#ffdd66"];
const MAX_PARTICLES = 12;
const SPAWN_INTERVAL = 60; // ms between spawns

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastSpawn = useRef(0);
  const rafRef = useRef(0);

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

    // Spawn new particle
    const now = Date.now();
    if (now - lastSpawn.current > SPAWN_INTERVAL && particles.current.length < MAX_PARTICLES) {
      lastSpawn.current = now;
      particles.current.push({
        x: mouseRef.current.x + (Math.random() - 0.5) * 6,
        y: mouseRef.current.y + (Math.random() - 0.5) * 6,
        life: 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      });
    }

    // Draw & decay
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.life -= 0.04;
      p.y -= 0.3; // float up

      if (p.life <= 0) {
        particles.current.splice(i, 1);
        continue;
      }

      const size = Math.max(Math.floor(p.life * 4), 1);
      ctx.globalAlpha = p.life * 0.6;
      ctx.fillStyle = p.color;
      // Pixel-snapped squares
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), size, size);
    }

    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [animate]);

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
