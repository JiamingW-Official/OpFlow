import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useFlow } from "../context/FlowContext";
import { C, TICKERS, EXPIRIES, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";

interface CellData {
  ticker: string;
  expiry: string;
  callPrem: number;
  putPrem: number;
  total: number;
  ratio: number;
}

export default function FlowHeatmap() {
  const { trades, vizCanvasRef } = useFlow();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<Map<string, number>>(new Map());
  const prevTradeIdRef = useRef<number>(-1);
  const rafRef = useRef<number>(0);
  const [hovered, setHovered] = useState<{ cell: CellData; x: number; y: number } | null>(null);

  const { cells, sortedTickers, maxCellPrem } = useMemo(() => {
    const cellMap = new Map<string, CellData>();
    for (const ticker of TICKERS) {
      for (const expiry of EXPIRIES) {
        cellMap.set(`${ticker}-${expiry}`, { ticker, expiry, callPrem: 0, putPrem: 0, total: 0, ratio: 0.5 });
      }
    }
    for (const t of trades) {
      const cell = cellMap.get(`${t.tk}-${t.exp}`);
      if (!cell) continue;
      if (t.type === "CALL") cell.callPrem += t.total;
      else cell.putPrem += t.total;
      cell.total = cell.callPrem + cell.putPrem;
      cell.ratio = cell.total > 0 ? cell.callPrem / cell.total : 0.5;
    }
    const tickerTotals = new Map<string, number>();
    for (const [, cell] of cellMap) {
      tickerTotals.set(cell.ticker, (tickerTotals.get(cell.ticker) || 0) + cell.total);
    }
    const sorted = [...TICKERS].sort((a, b) => (tickerTotals.get(b) || 0) - (tickerTotals.get(a) || 0));
    let max = 0;
    for (const [, cell] of cellMap) { if (cell.total > max) max = cell.total; }
    return { cells: cellMap, sortedTickers: sorted, maxCellPrem: max };
  }, [trades]);

  useEffect(() => {
    if (trades.length === 0) return;
    const latest = trades[0];
    if (latest.id !== prevTradeIdRef.current) {
      prevTradeIdRef.current = latest.id;
      pulseRef.current.set(`${latest.tk}-${latest.exp}`, Date.now());
    }
  }, [trades]);

  const TICKER_W = 50;
  const LABEL_H = 16;
  const ROOF_H = 22;
  const TOP = LABEL_H + ROOF_H;
  const FOUND_H = 12;
  const WPAD = 10;          // bigger padding → smaller windows, more wall visible
  const COLS = EXPIRIES.length;
  const ROWS = sortedTickers.length;

  const draw = useCallback(() => {
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

    const W = rect.width, H = rect.height;
    const bL = TICKER_W, bT = TOP;
    const bW = W - bL - 4, bH = H - bT - 4 - FOUND_H;
    const bB = bT + bH, bR = bL + bW;
    const colW = bW / COLS, rowH = bH / ROWS;
    const winW = colW - WPAD * 2, winH = rowH - WPAD * 2;
    const now = Date.now();

    ctx.clearRect(0, 0, W, H);

    /* ═══ SKY — deep gradient + stars + moon ═══ */
    const skyGrad = ctx.createLinearGradient(0, 0, 0, bT);
    skyGrad.addColorStop(0, "#030012");
    skyGrad.addColorStop(0.5, "#080420");
    skyGrad.addColorStop(1, "#0c0828");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(bL, 0, bW, bT);

    const stars = [
      [bL + 15, 4], [bL + bW * 0.22, 7], [bL + bW * 0.35, 2], [bL + bW * 0.48, 9],
      [bL + bW * 0.55, 3], [bL + bW * 0.68, 6], [bL + bW * 0.78, 8], [bL + bW * 0.88, 1],
      [bL + bW * 0.12, 11], [bL + bW * 0.42, 5], [bL + bW * 0.95, 10],
    ];
    for (const [sx, sy] of stars) {
      const twinkle = Math.sin(now / 800 + sx * 3) > 0.1;
      if (twinkle) {
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#aaccff";
        ctx.shadowBlur = 4;
        ctx.fillRect(Math.floor(sx), sy, 2, 2);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#8899cc";
        ctx.fillRect(Math.floor(sx) - 1, sy, 1, 1);
        ctx.fillRect(Math.floor(sx) + 2, sy + 1, 1, 1);
        ctx.fillRect(Math.floor(sx), sy - 1, 1, 1);
        ctx.fillRect(Math.floor(sx) + 1, sy + 2, 1, 1);
      } else {
        ctx.fillStyle = "#444466";
        ctx.fillRect(Math.floor(sx), sy, 1, 1);
      }
    }
    // Crescent moon — bigger, more glow
    const mX = bR - 22, mY = 1;
    ctx.shadowColor = "#ffeedd";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#fff8e0";
    ctx.fillRect(mX, mY + 1, 2, 6);
    ctx.fillRect(mX + 2, mY, 2, 8);
    ctx.fillRect(mX + 4, mY, 1, 3);
    ctx.fillRect(mX + 4, mY + 5, 1, 3);
    ctx.shadowBlur = 0;
    // Moon dark bite
    ctx.fillStyle = "#030012";
    ctx.fillRect(mX + 3, mY + 2, 2, 4);
    ctx.fillRect(mX + 4, mY + 1, 1, 6);

    // Shooting star — periodic streak
    const shootPhase = (now / 3000) % 1;
    if (shootPhase < 0.25) {
      const sp = shootPhase / 0.25; // 0→1
      const ssX = bL + bW * 0.2 + sp * bW * 0.5;
      const ssY = 2 + sp * (bT - 6);
      ctx.fillStyle = `rgba(255,255,255,${0.8 - sp * 0.7})`;
      ctx.shadowColor = "#aaddff";
      ctx.shadowBlur = 6;
      ctx.fillRect(ssX, ssY, 2, 1);
      // Tail
      for (let ti = 1; ti <= 4; ti++) {
        ctx.fillStyle = `rgba(200,220,255,${Math.max(0.5 - ti * 0.12 - sp * 0.3, 0)})`;
        ctx.fillRect(ssX - ti * 3, ssY - ti, 2, 1);
      }
      ctx.shadowBlur = 0;
    }

    /* ═══ WALLS — pixel bricks ═══ */
    const brickW = 8, brickH = 4;     // pixel brick size
    const mortarC = "#080618";         // dark mortar
    const brickPal: [number, number, number][][] = [
      // column palette A (cooler)
      [[28, 22, 52], [24, 18, 46], [32, 26, 56], [20, 16, 42]],
      // column palette B (warmer)
      [[36, 26, 58], [30, 22, 50], [40, 30, 62], [26, 20, 46]],
    ];
    for (let c = 0; c < COLS; c++) {
      const cx = Math.floor(bL + c * colW);
      const cw = Math.floor(c < COLS - 1 ? colW : bR - cx);
      const pal = brickPal[c % 2];
      // Fill mortar base
      ctx.fillStyle = mortarC;
      ctx.fillRect(cx, bT, cw, bH);
      // Draw bricks
      let brickRow = 0;
      for (let by = bT; by < bB; by += brickH + 1) {
        const offset = (brickRow % 2) * Math.floor(brickW / 2);
        for (let bx = cx - offset; bx < cx + cw; bx += brickW + 1) {
          const x1 = Math.max(bx, cx);
          const x2 = Math.min(bx + brickW, cx + cw);
          const y2 = Math.min(by + brickH, bB);
          if (x2 <= x1) continue;
          const bi = ((brickRow * 7 + Math.floor((bx - cx) / brickW) * 3) & 0x7fffffff) % pal.length;
          const br = pal[bi];
          ctx.fillStyle = `rgb(${br[0]},${br[1]},${br[2]})`;
          ctx.fillRect(x1, by, x2 - x1, y2 - by);
          // Brick 3D: top-left highlight, bottom-right shadow
          ctx.fillStyle = `rgba(255,255,255,0.06)`;
          ctx.fillRect(x1, by, x2 - x1, 1);
          ctx.fillRect(x1, by, 1, y2 - by);
          ctx.fillStyle = `rgba(0,0,0,0.12)`;
          ctx.fillRect(x1, y2 - 1, x2 - x1, 1);
          ctx.fillRect(x2 - 1, by, 1, y2 - by);
        }
        brickRow++;
      }
      // Column separator seam
      if (c > 0) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(cx, bT, 1, bH);
      }
    }
    // Building edge shading
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(bL, bT, 2, bH);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(bR - 2, bT, 2, bH);

    // Corner quoins — decorative stone corners
    const quoinW = 6, quoinH = 8;
    for (let qy = bT + 2; qy < bB - quoinH; qy += quoinH + 4) {
      // Left quoins
      ctx.fillStyle = "#2e2658";
      ctx.fillRect(bL, qy, quoinW, quoinH);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(bL, qy, quoinW, 1);
      ctx.fillRect(bL, qy, 1, quoinH);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(bL, qy + quoinH - 1, quoinW, 1);
      // Right quoins
      ctx.fillStyle = "#2a2254";
      ctx.fillRect(bR - quoinW, qy, quoinW, quoinH);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(bR - quoinW, qy, quoinW, 1);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(bR - quoinW, qy + quoinH - 1, quoinW, 1);
      ctx.fillRect(bR - 1, qy, 1, quoinH);
    }

    /* ═══ ROOF — peaked with shingles ═══ */
    const oh = 8;
    const roofBase = bT;
    const roofTop = bT - ROOF_H;
    const roofL = bL - oh, roofR = bR + oh, roofW = roofR - roofL;
    const peakX = Math.floor(roofL + roofW / 2);
    const peakY = roofTop - 6;   // peak above flat roof

    // Main roof slab
    ctx.fillStyle = "#1a1444";
    ctx.fillRect(roofL, roofTop, roofW, ROOF_H);

    // Peaked gable (triangle on top)
    ctx.fillStyle = "#221a50";
    ctx.beginPath();
    ctx.moveTo(roofL, roofTop);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(roofR, roofTop);
    ctx.closePath();
    ctx.fill();

    // Shingle rows on gable
    const shingleC = ["#2a2058", "#241c50", "#1e1646", "#2e245c"];
    for (let sy = peakY + 3; sy < roofTop; sy += 3) {
      const frac = (sy - peakY) / (roofTop - peakY);
      const lx = Math.floor(roofL + (peakX - roofL) * (1 - frac));
      const rx = Math.ceil(peakX + (roofR - peakX) * frac);
      const si = Math.floor((sy - peakY) / 3) % shingleC.length;
      ctx.fillStyle = shingleC[si];
      ctx.fillRect(lx, sy, rx - lx, 3);
      // Shingle edge highlight
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(lx, sy, rx - lx, 1);
    }
    // Shingle rows on flat roof slab
    for (let sy = roofTop; sy < roofBase; sy += 3) {
      const si = Math.floor((sy - roofTop) / 3) % shingleC.length;
      ctx.fillStyle = shingleC[si];
      ctx.fillRect(roofL, sy, roofW, 3);
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      ctx.fillRect(roofL, sy, roofW, 1);
    }

    // Gable 3D edges
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    // Left slope highlight
    for (let sy = peakY; sy < roofTop; sy++) {
      const frac = (sy - peakY) / (roofTop - peakY);
      const lx = Math.floor(peakX - (peakX - roofL) * frac);
      ctx.fillRect(lx, sy, 1, 1);
    }
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    // Right slope shadow
    for (let sy = peakY; sy < roofTop; sy++) {
      const frac = (sy - peakY) / (roofTop - peakY);
      const rx = Math.floor(peakX + (roofR - peakX) * frac);
      ctx.fillRect(rx - 1, sy, 1, 1);
    }

    // Roof/wall junction — eave overhang shadow
    ctx.fillStyle = "#0e0c2a";
    ctx.fillRect(roofL, roofBase, roofW, 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(bL, roofBase + 2, bW, 2);

    // Ridge cap at peak
    ctx.fillStyle = "#3a3268";
    ctx.fillRect(peakX - 2, peakY, 4, 2);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fillRect(peakX - 2, peakY, 4, 1);

    // Antenna on peak
    const a1 = peakX;
    ctx.fillStyle = "#2a2858";
    ctx.fillRect(a1, peakY - 16, 2, 16);
    ctx.fillStyle = "#ff2222";
    ctx.shadowColor = "#ff4422";
    ctx.shadowBlur = 12;
    ctx.fillRect(a1 - 1, peakY - 18, 4, 2);
    ctx.shadowBlur = 0;
    // Flag
    ctx.fillStyle = "#ff4433";
    ctx.fillRect(a1 + 2, peakY - 15, 7, 5);
    ctx.fillStyle = "#ff6655";
    ctx.fillRect(a1 + 2, peakY - 15, 7, 2);
    ctx.fillStyle = "#cc2211";
    ctx.fillRect(a1 + 8, peakY - 14, 1, 3);

    // Chimney (on left side of roof)
    const chX = Math.floor(roofL + roofW * 0.2);
    const chBase = roofTop;
    // Chimney goes up from the roof slope
    const chFrac = (chBase - peakY) / (roofBase - peakY);
    const chRoofY = Math.floor(peakY + (roofTop - peakY) * (1 - (1 - chFrac) * 0.6));
    ctx.fillStyle = "#2a2250";
    ctx.fillRect(chX - 4, chRoofY - 10, 10, 10 + (chBase - chRoofY));
    // Chimney bricks
    for (let cby = chRoofY - 10; cby < chBase; cby += 3) {
      const coff = (Math.floor((cby - chRoofY) / 3) % 2) * 3;
      ctx.fillStyle = "#342c5a";
      for (let cbx = chX - 4 + coff; cbx < chX + 6; cbx += 6) {
        ctx.fillRect(cbx, cby, 5, 2);
      }
    }
    // Chimney cap
    ctx.fillStyle = "#3a3268";
    ctx.fillRect(chX - 5, chRoofY - 12, 12, 2);
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(chX - 5, chRoofY - 12, 12, 1);
    // Animated smoke
    const smokeT = Math.floor(now / 500) % 8;
    for (let s = 0; s < 4; s++) {
      const sAge = (smokeT + s * 2) % 8;
      const sAlpha = Math.max(0.2 - sAge * 0.025, 0);
      ctx.fillStyle = `rgba(140,140,180,${sAlpha})`;
      ctx.fillRect(chX - 1 + (sAge % 3) - 1, chRoofY - 14 - sAge * 4, 3 + (s % 2), 2);
    }

    /* ═══ FOUNDATION — stone blocks ═══ */
    ctx.fillStyle = "#0a0822";
    ctx.fillRect(bL - 4, bB, bW + 8, FOUND_H);
    // Stone block pattern
    const stoneW = 12;
    for (let fy = bB; fy < bB + FOUND_H; fy += 4) {
      const foff = (Math.floor((fy - bB) / 4) % 2) * 6;
      for (let fx = bL - 4 + foff; fx < bR + 4; fx += stoneW + 1) {
        const sx1 = Math.max(fx, bL - 4);
        const sx2 = Math.min(fx + stoneW, bR + 4);
        if (sx2 <= sx1) continue;
        ctx.fillStyle = "#0e0c28";
        ctx.fillRect(sx1, fy, sx2 - sx1, 3);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        ctx.fillRect(sx1, fy, sx2 - sx1, 1);
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(sx1, fy + 2, sx2 - sx1, 1);
      }
    }
    // Foundation top edge
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.fillRect(bL - 4, bB, bW + 8, 1);

    /* ═══ WINDOW GLOW PRE-PASS — paint wall glow first ═══ */
    const muntW = winW > 35 ? 3 : 2;
    const muntH = winH > 14 ? 3 : 2;

    // Pre-compute cell data for two passes
    const cellInfo: { r: number; c: number; cell: CellData; wx: number; wy: number; pulsing: boolean; bri: number; cr: number; cg: number; cb: number }[] = [];
    for (let r = 0; r < ROWS; r++) {
      const ticker = sortedTickers[r];
      for (let c = 0; c < COLS; c++) {
        const expiry = EXPIRIES[c];
        const key = `${ticker}-${expiry}`;
        const cell = cells.get(key);
        if (!cell) continue;
        const wx = Math.floor(bL + c * colW + WPAD);
        const wy = Math.floor(bT + r * rowH + WPAD);
        const pt = pulseRef.current.get(key);
        let pulsing = false;
        if (pt) {
          const age = (now - pt) / 1000;
          if (age < 1.0) { pulsing = Math.floor(age * 8) % 2 === 0; }
          else pulseRef.current.delete(key);
        }
        const bri = maxCellPrem > 0 ? cell.total / maxCellPrem : 0;
        let cr: number, cg: number, cb: number;
        if (cell.total === 0) { cr = 0; cg = 0; cb = 0; }
        else if (cell.ratio >= 0.5) {
          const t = Math.min((cell.ratio - 0.5) * 2, 1);
          cr = 0; cg = 200 + Math.round(55 * t); cb = 80 + Math.round(56 * t);
        } else {
          const t = Math.min((0.5 - cell.ratio) * 2, 1);
          cr = 240 + Math.round(15 * t); cg = 20; cb = 50 + Math.round(50 * t);
        }
        cellInfo.push({ r, c, cell, wx, wy, pulsing, bri, cr, cg, cb });
      }
    }

    // PASS 1: Glow halos on walls (before windows, so windows draw on top)
    for (const ci of cellInfo) {
      if (ci.cell.total === 0) continue;
      const { wx, wy, pulsing, bri, cr, cg, cb } = ci;
      const glowR = pulsing ? 55 : 8 + bri * 30;
      const glowA = pulsing ? 0.45 : 0.06 + bri * 0.2;
      ctx.shadowColor = pulsing ? `rgb(${Math.min(cr + 120, 255)},${Math.min(cg + 120, 255)},${Math.min(cb + 120, 255)})` : `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur = glowR;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${glowA})`;
      ctx.fillRect(wx - 4, wy - 4, winW + 8, winH + 10);
      ctx.shadowBlur = 0;
      // Light spill below window (ground reflection)
      if (bri > 0.3 || pulsing) {
        const spillA = pulsing ? 0.12 : bri * 0.06;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${spillA})`;
        ctx.fillRect(wx - 2, wy + winH + 4, winW + 4, Math.floor(rowH * 0.25));
      }
    }

    // PASS 2: Windows
    for (const ci of cellInfo) {
      const { r, c, cell, wx, wy, pulsing, bri, cr, cg, cb } = ci;

      const fM = pulsing ? "#ccccee" : "#383660";
      const fH = pulsing ? "#eeeeff" : "#4a487a";
      const fS = pulsing ? "#9999bb" : "#1e1c3a";

      /* ── Recess (deep shadow) ── */
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(wx - 3, wy - 3, winW + 5, 3);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(wx - 3, wy, 3, winH);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(wx, wy + winH, winW + 1, 2);
      ctx.fillRect(wx + winW, wy, 2, winH + 1);

      /* ── Frame ── */
      ctx.fillStyle = fM;
      ctx.fillRect(wx - 1, wy - 1, winW + 2, winH + 2);
      ctx.fillStyle = fH;
      ctx.fillRect(wx - 1, wy - 1, winW + 2, 1);
      ctx.fillRect(wx - 1, wy, 1, winH + 1);
      ctx.fillStyle = fS;
      ctx.fillRect(wx - 1, wy + winH, winW + 2, 1);
      ctx.fillRect(wx + winW, wy - 1, 1, winH + 2);

      /* ── 4 panes ── */
      const halfW = Math.floor((winW - muntW) / 2);
      const halfH = Math.floor((winH - muntH) / 2);
      const panes = [
        { px: wx, py: wy, pw: halfW, ph: halfH, bm: 0.6 },
        { px: wx + halfW + muntW, py: wy, pw: winW - halfW - muntW, ph: halfH, bm: 0.75 },
        { px: wx, py: wy + halfH + muntH, pw: halfW, ph: winH - halfH - muntH, bm: 0.9 },
        { px: wx + halfW + muntW, py: wy + halfH + muntH, pw: winW - halfW - muntW, ph: winH - halfH - muntH, bm: 1.3 },
      ];

      if (cell.total === 0) {
        /* ── DARK WINDOW — near black ── */
        for (let i = 0; i < panes.length; i++) {
          const p = panes[i];
          ctx.fillStyle = "#020210";
          ctx.fillRect(p.px, p.py, p.pw, p.ph);
          // Faint blue reflection
          ctx.fillStyle = "rgba(40,40,90,0.15)";
          const rx = p.px + 1 + (i % 2) * Math.floor(p.pw * 0.4);
          const ry = p.py + 1;
          ctx.fillRect(rx, ry, Math.max(Math.floor(p.pw * 0.25), 2), Math.max(Math.floor(p.ph * 0.3), 2));
        }
      } else {
        /* ── LIT WINDOW — INTENSE GLOW ── */
        const a = pulsing ? 1 : 0.4 + bri * 0.6;

        // Recess lit by room
        const recessA = pulsing ? 0.35 : bri * 0.15;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${recessA})`;
        ctx.fillRect(wx - 3, wy - 3, winW + 5, 3);
        ctx.fillRect(wx - 3, wy, 3, winH);

        for (let i = 0; i < panes.length; i++) {
          const p = panes[i];
          const pa = Math.min(a * p.bm, 1);

          if (pulsing) {
            /* ── PULSE: BLINDING WHITE FLASH ── */
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(p.px, p.py, p.pw, p.ph);
            ctx.fillStyle = `rgba(${cr},${cg},${cb},0.25)`;
            ctx.fillRect(p.px, p.py, p.pw, p.ph);
          } else {
            /* ── 4-zone flat pixel shading (more dramatic) ── */
            // Zone 1: dark edge
            ctx.fillStyle = `rgba(${Math.floor(cr * 0.5)},${Math.floor(cg * 0.5)},${Math.floor(cb * 0.5)},${pa})`;
            ctx.fillRect(p.px, p.py, p.pw, p.ph);
            // Zone 2: base
            if (p.pw > 3 && p.ph > 3) {
              ctx.fillStyle = `rgba(${cr},${cg},${cb},${pa})`;
              ctx.fillRect(p.px + 1, p.py + 1, p.pw - 2, p.ph - 2);
            }
            // Zone 3: bright core
            if (p.pw > 6 && p.ph > 5) {
              ctx.fillStyle = `rgba(${Math.min(cr + 50, 255)},${Math.min(cg + 50, 255)},${Math.min(cb + 50, 255)},${Math.min(pa * 1.2, 1)})`;
              ctx.fillRect(p.px + 2, p.py + 2, p.pw - 4, p.ph - 4);
            }
            // Zone 4: hot center
            if (p.pw > 10 && p.ph > 7 && bri > 0.2) {
              ctx.fillStyle = `rgba(${Math.min(cr + 100, 255)},${Math.min(cg + 100, 255)},${Math.min(cb + 100, 255)},${Math.min(pa * 1.4, 1)})`;
              ctx.fillRect(p.px + 3, p.py + 3, p.pw - 6, p.ph - 6);
            }

            // Curtain — top panes only
            if (i < 2) {
              const curtH = Math.max(Math.floor(p.ph * 0.28), 2);
              ctx.fillStyle = `rgba(0,0,0,${0.35 + (1 - bri) * 0.15})`;
              ctx.fillRect(p.px, p.py, p.pw, curtH);
              // Scalloped hem
              for (let sx = p.px; sx < p.px + p.pw - 1; sx += 3) {
                ctx.fillStyle = `rgba(0,0,0,0.2)`;
                ctx.fillRect(sx, p.py + curtH, Math.min(2, p.px + p.pw - sx), 1);
              }
            }
          }

          // Glass edge (inner shadow)
          ctx.fillStyle = `rgba(0,0,0,${pulsing ? 0.05 : 0.2})`;
          ctx.fillRect(p.px, p.py, p.pw, 1);
          ctx.fillRect(p.px, p.py, 1, p.ph);

          // Glass highlight spot
          ctx.fillStyle = `rgba(255,255,255,${pulsing ? 0.5 : 0.08 + bri * 0.1})`;
          ctx.fillRect(p.px + Math.floor(p.pw * 0.6), p.py + 1, 2, Math.min(2, p.ph - 1));
        }

        // Pulsing window extra — dramatic outer burst
        if (pulsing) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 60;
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.15)`;
          ctx.fillRect(wx - 6, wy - 6, winW + 12, winH + 14);
          ctx.shadowBlur = 0;
        }

        // Text — bottom-left
        if (winW > 16 && winH > 8) {
          const fs = Math.min(Math.floor(winH * 0.36), 14);
          ctx.font = `${fs}px 'VT323', monospace`;
          ctx.fillStyle = pulsing ? "#ffffff" : `rgba(255,255,255,${0.5 + bri * 0.5})`;
          ctx.textAlign = "left";
          ctx.shadowColor = pulsing ? "#fff" : `rgb(${cr},${cg},${cb})`;
          ctx.shadowBlur = pulsing ? 12 : 5;
          ctx.fillText(
            cell.total >= 1e6 ? `${(cell.total / 1e6).toFixed(1)}M` : `${(cell.total / 1e3).toFixed(0)}K`,
            wx + 2, wy + winH - 2,
          );
          ctx.shadowBlur = 0;
        }
      }

      /* ── Muntin bars ── */
      ctx.fillStyle = fM;
      ctx.fillRect(wx + halfW, wy, muntW, winH);
      ctx.fillStyle = fH;
      ctx.fillRect(wx + halfW, wy, 1, winH);
      if (muntW >= 3) { ctx.fillStyle = fS; ctx.fillRect(wx + halfW + muntW - 1, wy, 1, winH); }
      ctx.fillStyle = fM;
      ctx.fillRect(wx, wy + halfH, winW, muntH);
      ctx.fillStyle = fH;
      ctx.fillRect(wx, wy + halfH, winW, 1);
      if (muntH >= 3) { ctx.fillStyle = fS; ctx.fillRect(wx, wy + halfH + muntH - 1, winW, 1); }

      /* ── Sill ── */
      const sE = 3, sHt = 3;
      const slx = wx - sE, sly = wy + winH + 1, slw = winW + sE * 2;
      ctx.fillStyle = "#3a3860";
      ctx.fillRect(slx, sly, slw, 1);
      ctx.fillStyle = "#2a2850";
      ctx.fillRect(slx, sly + 1, slw, sHt - 1);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(slx + 1, sly + sHt, slw - 1, 1);
      // Sill lit by room
      if (cell.total > 0) {
        const sillA = pulsing ? 0.35 : bri * 0.18;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${sillA})`;
        ctx.fillRect(slx, sly, slw, sHt);
      }

      /* ── Sill decorations ── */
      if (cell.total === 0) {
        const decor = (r * 7 + c * 3 + 1) % 12;
        const mid = Math.floor(slx + slw / 2);
        if (decor === 0 || decor === 5) {
          // Flower pot
          ctx.fillStyle = "#cc6644"; ctx.fillRect(mid - 2, sly - 2, 4, 2);
          ctx.fillStyle = "#44cc66"; ctx.fillRect(mid - 1, sly - 4, 2, 2);
          ctx.fillStyle = "#66dd88"; ctx.fillRect(mid, sly - 5, 1, 1);
          ctx.fillStyle = "#ff6688"; ctx.fillRect(mid + 1, sly - 5, 1, 1); // flower
        } else if (decor === 2) {
          // Pixel cat sitting
          ctx.fillStyle = "#ffcc88"; ctx.fillRect(mid - 2, sly - 3, 4, 3);
          ctx.fillStyle = "#ffbb77"; ctx.fillRect(mid - 2, sly - 4, 1, 1); ctx.fillRect(mid + 1, sly - 4, 1, 1); // ears
          ctx.fillStyle = "#222"; ctx.fillRect(mid - 1, sly - 3, 1, 1); ctx.fillRect(mid, sly - 3, 1, 1); // eyes
          ctx.fillStyle = "#ffcc88"; ctx.fillRect(mid + 2, sly - 2, 2, 1); // tail
        } else if (decor === 4) {
          // Cactus
          ctx.fillStyle = "#44aa55"; ctx.fillRect(mid, sly - 5, 2, 5);
          ctx.fillRect(mid - 1, sly - 3, 1, 2); ctx.fillRect(mid + 2, sly - 2, 1, 1);
          ctx.fillStyle = "#cc6644"; ctx.fillRect(mid - 1, sly - 1, 4, 1); // pot
        } else if (decor === 6) {
          // Bird on sill
          ctx.fillStyle = "#6699cc"; ctx.fillRect(mid, sly - 3, 3, 2); // body
          ctx.fillStyle = "#5588bb"; ctx.fillRect(mid - 1, sly - 4, 2, 1); // head
          ctx.fillStyle = "#ffaa44"; ctx.fillRect(mid - 2, sly - 4, 1, 1); // beak
          ctx.fillStyle = "#6699cc"; ctx.fillRect(mid + 3, sly - 4, 1, 1); // tail
        } else if (decor === 8) {
          // Book stack
          ctx.fillStyle = "#8844aa"; ctx.fillRect(mid - 2, sly - 2, 5, 2);
          ctx.fillStyle = "#4488cc"; ctx.fillRect(mid - 1, sly - 3, 4, 1);
          ctx.fillStyle = "#cc6644"; ctx.fillRect(mid - 2, sly - 4, 5, 1);
        } else if (decor === 10) {
          // Candle
          ctx.fillStyle = "#ccaa88"; ctx.fillRect(mid, sly - 3, 2, 3); // wax
          ctx.fillStyle = "#ffcc44"; ctx.fillRect(mid, sly - 4, 2, 1); // flame
          ctx.fillStyle = "#ffee88";
          ctx.shadowColor = "#ffcc44"; ctx.shadowBlur = 4;
          ctx.fillRect(mid, sly - 5, 1, 1); // flame tip
          ctx.shadowBlur = 0;
        }
      }
    }

    /* ═══ DOOR — grand entrance at bottom center ═══ */
    if (ROWS > 0) {
      const doorW = Math.min(Math.floor(colW * 0.6), 24);
      const doorH = Math.min(Math.floor(rowH * 0.9), 30);
      const doorX = Math.floor(bL + bW / 2 - doorW / 2);
      const doorY = bB - doorH;

      // Door frame
      ctx.fillStyle = "#3a3268";
      ctx.fillRect(doorX - 2, doorY - 3, doorW + 4, doorH + 3);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(doorX - 2, doorY - 3, doorW + 4, 1);
      ctx.fillRect(doorX - 2, doorY - 3, 1, doorH + 3);

      // Arch top
      ctx.fillStyle = "#3a3268";
      ctx.fillRect(doorX, doorY - 5, doorW, 3);
      ctx.fillStyle = "#4a4278";
      ctx.fillRect(doorX + 2, doorY - 5, doorW - 4, 1);

      // Door panels — dark wood
      const halfDoor = Math.floor(doorW / 2) - 1;
      ctx.fillStyle = "#1a1238";
      ctx.fillRect(doorX, doorY, halfDoor, doorH);
      ctx.fillRect(doorX + halfDoor + 2, doorY, doorW - halfDoor - 2, doorH);
      // Center seam
      ctx.fillStyle = "#0e0a28";
      ctx.fillRect(doorX + halfDoor, doorY, 2, doorH);
      // Panel highlights
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(doorX + 1, doorY + 1, halfDoor - 2, doorH - 2);
      // Doorknob
      ctx.fillStyle = "#cc9944";
      ctx.shadowColor = "#ffcc66";
      ctx.shadowBlur = 4;
      ctx.fillRect(doorX + halfDoor - 3, doorY + Math.floor(doorH * 0.55), 2, 2);
      ctx.shadowBlur = 0;

      // Light above door
      ctx.fillStyle = "#ffdd88";
      ctx.shadowColor = "#ffcc66";
      ctx.shadowBlur = 16;
      ctx.fillRect(doorX + Math.floor(doorW / 2) - 1, doorY - 7, 3, 2);
      ctx.shadowBlur = 0;
      // Light spill on ground
      ctx.fillStyle = "rgba(255,220,136,0.06)";
      ctx.fillRect(doorX - 4, bB, doorW + 8, FOUND_H + 4);
    }

    /* ═══ DRAINPIPE — right side ═══ */
    const pipeX = bR - 8;
    ctx.fillStyle = "#2a2650";
    ctx.fillRect(pipeX, bT + 4, 3, bH - 4);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(pipeX, bT + 4, 1, bH - 4);
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(pipeX + 2, bT + 4, 1, bH - 4);
    // Pipe brackets
    for (let py = bT + 20; py < bB - 10; py += 30) {
      ctx.fillStyle = "#3a3668";
      ctx.fillRect(pipeX - 1, py, 5, 2);
    }
    // Pipe elbow at bottom
    ctx.fillStyle = "#2a2650";
    ctx.fillRect(pipeX, bB - 2, 8, 3);

    /* ═══ GROUND SCENE — cobblestones + street lamp + reflections ═══ */
    const groundY = bB + FOUND_H;
    if (groundY < H) {
      // Cobblestone street
      const streetH = Math.min(H - groundY, 24);
      ctx.fillStyle = "#0c0a22";
      ctx.fillRect(bL - 12, groundY, bW + 24, streetH);
      // Cobblestone pattern
      for (let gy = groundY; gy < groundY + streetH; gy += 4) {
        const goff = (Math.floor((gy - groundY) / 4) % 2) * 5;
        for (let gx = bL - 12 + goff; gx < bR + 12; gx += 10) {
          ctx.fillStyle = "#100e28";
          ctx.fillRect(gx, gy, 8, 3);
          ctx.fillStyle = "rgba(255,255,255,0.02)";
          ctx.fillRect(gx, gy, 8, 1);
        }
      }

      // Street lamp — left side
      const lampX = bL - 10;
      if (lampX > 6) {
        // Pole
        ctx.fillStyle = "#2a2850";
        ctx.fillRect(lampX, groundY - 18, 2, 18);
        // Arm
        ctx.fillRect(lampX, groundY - 18, 6, 2);
        // Lamp housing
        ctx.fillStyle = "#3a3668";
        ctx.fillRect(lampX + 3, groundY - 22, 5, 4);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(lampX + 3, groundY - 22, 5, 1);
        // Lamp light
        ctx.fillStyle = "#ffdd88";
        ctx.shadowColor = "#ffcc66";
        ctx.shadowBlur = 20;
        ctx.fillRect(lampX + 4, groundY - 20, 3, 2);
        ctx.shadowBlur = 0;
        // Light cone on ground
        ctx.fillStyle = "rgba(255,220,136,0.04)";
        ctx.fillRect(lampX - 6, groundY, 20, streetH);
        ctx.fillStyle = "rgba(255,220,136,0.06)";
        ctx.fillRect(lampX - 2, groundY, 10, Math.min(6, streetH));
      }

      // Building reflection on wet street
      const reflH = Math.min(8, streetH);
      ctx.globalAlpha = 0.03;
      ctx.fillStyle = "#cc88ff";
      ctx.fillRect(bL, groundY + 2, bW, reflH);
      ctx.globalAlpha = 1;
    }

    /* ═══ LABELS ═══ */
    ctx.font = "14px 'VT323', monospace";
    ctx.fillStyle = C.dim;
    ctx.textAlign = "center";
    for (let c = 0; c < COLS; c++)
      ctx.fillText(EXPIRIES[c], bL + c * colW + colW / 2, LABEL_H - 2);

    ctx.font = "18px 'VT323', monospace";
    ctx.textAlign = "right";
    for (let r = 0; r < ROWS; r++) {
      ctx.fillStyle = C.text;
      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 4;
      ctx.fillText(sortedTickers[r], TICKER_W - 6, bT + r * rowH + rowH / 2 + 5);
      ctx.shadowBlur = 0;
    }

    // Always animate for shooting star + smoke + twinkling stars
    rafRef.current = requestAnimationFrame(draw);
  }, [cells, sortedTickers, maxCellPrem, ROWS]);

  useEffect(() => { cancelAnimationFrame(rafRef.current); draw(); }, [draw]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw());
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);
  useEffect(() => {
    if (pulseRef.current.size > 0) rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [trades, draw]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const bL = TICKER_W, bT = TOP;
    const bW = r.width - bL - 4, bH = r.height - bT - 4 - FOUND_H;
    const col = Math.floor((mx - bL) / (bW / COLS));
    const row = Math.floor((my - bT) / (bH / ROWS));
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const cell = cells.get(`${sortedTickers[row]}-${EXPIRIES[col]}`);
      if (cell) { setHovered({ cell, x: e.clientX - r.left, y: e.clientY - r.top }); return; }
    }
    setHovered(null);
  }, [cells, sortedTickers, ROWS]);

  useEffect(() => {
    if (vizCanvasRef && canvasRef.current)
      (vizCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvasRef.current;
  }, [vizCanvasRef]);

  return (
    <PixelCard ref={containerRef} title="MONEY TOWER" titleIcon="🏢" titleColor={C.accent} style={{ position: "relative", overflow: "hidden", minHeight: 0, minWidth: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHovered(null)}
      />
      {hovered && hovered.cell.total > 0 && (
        <div style={{
          position: "absolute",
          left: Math.min(hovered.x + 14, (containerRef.current?.clientWidth || 400) - 190),
          top: Math.max(hovered.y - 76, 8),
          zIndex: 10, background: "#131230",
          border: `2px solid ${C.accent}`, padding: "8px 12px",
          fontSize: 22, fontFamily: FONTS.mono, color: C.text,
          pointerEvents: "none", whiteSpace: "nowrap",
          boxShadow: `0 0 20px ${C.accent}30`,
        }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 9, color: C.accent, marginBottom: 4, textShadow: `0 0 6px ${C.accent}` }}>
            🏢 {hovered.cell.ticker} · {hovered.cell.expiry}
          </div>
          <div style={{ color: C.call, textShadow: `0 0 8px ${C.call}` }}>📈 UP: {fmt(hovered.cell.callPrem)}</div>
          <div style={{ color: C.put, textShadow: `0 0 8px ${C.put}` }}>📉 DOWN: {fmt(hovered.cell.putPrem)}</div>
          <div style={{ color: C.dim, marginTop: 2 }}>
            {hovered.cell.ratio > 0.5 ? "😊" : "😰"} {(hovered.cell.ratio * 100).toFixed(0)}% think UP
          </div>
        </div>
      )}
    </PixelCard>
  );
}
