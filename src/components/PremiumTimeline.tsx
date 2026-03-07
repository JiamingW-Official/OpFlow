import { useEffect, useRef, useCallback } from "react";
import { useFlow } from "../context/FlowContext";
import { C } from "../constants/theme";
import PixelCard from "./ui/PixelCard";

interface DataPoint {
  callPrem: number;
  putPrem: number;
}

export default function PremiumTimeline() {
  const { trades } = useFlow();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<DataPoint[]>([]);

  useEffect(() => {
    if (trades.length === 0) return;
    const latest = trades[0];
    const prev = historyRef.current[historyRef.current.length - 1];
    historyRef.current.push({
      callPrem: (prev?.callPrem || 0) + (latest.type === "CALL" ? latest.total : 0),
      putPrem: (prev?.putPrem || 0) + (latest.type === "PUT" ? latest.total : 0),
    });
    if (historyRef.current.length > 60) historyRef.current.shift();
  }, [trades]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    ctx.clearRect(0, 0, W, H);

    const data = historyRef.current;
    if (data.length < 2) return;

    const pad = { l: 6, r: 6, t: 8, b: 6 };
    const fw = W - pad.l - pad.r;
    const fh = H - pad.t - pad.b;
    const allVals = data.flatMap(d => [d.callPrem, d.putPrem]);
    const maxVal = Math.max(...allVals, 1);
    const getX = (i: number) => pad.l + (i / (data.length - 1)) * fw;
    const getY = (val: number) => pad.t + fh - (val / maxVal) * fh;

    // Reference lines — pixel dashed
    ctx.strokeStyle = "rgba(102,204,255,0.08)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i <= 3; i++) {
      const y = pad.t + (fh / 4) * i;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(W - pad.r, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Step chart helper — draws staircase line
    const drawStep = (getData: (d: DataPoint) => number, color: string, fillColor: string) => {
      // Fill
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = getX(i);
        const y = getY(getData(d));
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, getY(getData(data[i - 1]))); // horizontal
          ctx.lineTo(x, y); // vertical
        }
      });
      ctx.lineTo(getX(data.length - 1), pad.t + fh);
      ctx.lineTo(getX(0), pad.t + fh);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + fh);
      grad.addColorStop(0, fillColor);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      data.forEach((d, i) => {
        const x = getX(i);
        const y = getY(getData(d));
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, getY(getData(data[i - 1])));
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    drawStep(d => d.callPrem, C.call, "rgba(0,255,136,0.15)");
    drawStep(d => d.putPrem, C.put, "rgba(255,51,102,0.15)");

    // Endpoint dots with glow
    if (data.length > 0) {
      const last = data[data.length - 1];
      for (const [getter, color] of [[((d: DataPoint) => d.callPrem), C.call], [((d: DataPoint) => d.putPrem), C.put]] as const) {
        const x = getX(data.length - 1);
        const y = getY(getter(last));
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.shadowBlur = 0;
        // Value label at endpoint
        const val = getter(last);
        if (val > 0) {
          ctx.font = "18px 'VT323', monospace";
          ctx.fillStyle = color;
          ctx.textAlign = "left";
          ctx.fillText(val >= 1e6 ? `${(val/1e6).toFixed(1)}M` : `${(val/1e3).toFixed(0)}K`, x + 5, y + 4);
        }
      }
    }

    // Legend — pixel squares with LED glow
    ctx.fillStyle = C.call;
    ctx.fillRect(W - 150, 6, 10, 10);
    ctx.font = "22px 'VT323', monospace";
    ctx.fillStyle = C.call;
    ctx.textAlign = "left";
    ctx.shadowColor = C.call;
    ctx.shadowBlur = 6;
    ctx.fillText("📈 Going UP", W - 150, 18);

    ctx.fillStyle = C.put;
    ctx.shadowColor = C.put;
    ctx.fillRect(W - 60, 6, 10, 10);
    ctx.fillStyle = C.put;
    ctx.fillText("📉 DOWN", W - 46, 18);
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => { drawChart(); }, [trades, drawChart]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => drawChart());
    ro.observe(el);
    return () => ro.disconnect();
  }, [drawChart]);

  return (
    <PixelCard ref={containerRef} title="UP vs DOWN" titleIcon="⚡" style={{ position: "relative", overflow: "hidden" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
    </PixelCard>
  );
}
