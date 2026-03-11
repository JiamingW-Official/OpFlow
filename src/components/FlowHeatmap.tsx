import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { useFlow } from "../context/FlowContext";
import { C, TICKERS, EXPIRIES, FONTS } from "../constants/theme";
import { fmt } from "../lib/format";
import PixelCard from "./ui/PixelCard";
import { drawLogo } from "../constants/logos";

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
  const ambientTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buildCacheRef = useRef<HTMLCanvasElement | null>(null);
  const cacheKeyRef = useRef("");
  const sentimentRef = useRef(0.5);
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

  // Data refs — lets draw() read latest data without recreating the callback
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const sortedTickersRef = useRef(sortedTickers);
  sortedTickersRef.current = sortedTickers;
  const maxPremRef = useRef(maxCellPrem);
  maxPremRef.current = maxCellPrem;

  useEffect(() => {
    if (trades.length === 0) return;
    const latest = trades[0];
    if (latest.id !== prevTradeIdRef.current) {
      prevTradeIdRef.current = latest.id;
      if (latest.total > 200_000) {
        pulseRef.current.set(`${latest.tk}-${latest.exp}`, Date.now());
      }
    }
  }, [trades]);

  const TICKER_W = 36;
  const LABEL_H = 16;
  const ROOF_H = 16;
  const TOP = LABEL_H + ROOF_H;
  const FOUND_H = 0;
  const WPAD = 6;
  const COLS = EXPIRIES.length;
  const ROWS = sortedTickers.length;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Read from refs for stable callback
    const cells = cellsRef.current;
    const sortedTickers = sortedTickersRef.current;
    const maxCellPrem = maxPremRef.current;
    const ROWS = sortedTickers.length;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width, H = rect.height;
    const bL = TICKER_W, bT = TOP;
    const bW = W - bL - 2, bH = H - bT - 2;
    const bB = bT + bH, bR = bL + bW;
    const colW = bW / COLS, rowH = bH / ROWS;
    const winW = colW - WPAD * 2, winH = rowH - WPAD * 2;
    const now = Date.now();

    // Roof layout (shared between cache and dynamic smoke/neon)
    const oh = 8;
    const roofBase = bT;
    const roofTop = bT - ROOF_H;
    const roofL = bL - oh, roofR = bR + oh, roofW = roofR - roofL;
    const peakX = Math.floor(roofL + roofW / 2);
    const peakY = roofTop - 6;

    // Chimney layout (for dynamic smoke)
    const chX = Math.floor(roofL + roofW * 0.2);
    const chFrac = (roofTop - peakY) / (roofBase - peakY);
    const chRoofY = Math.floor(peakY + (roofTop - peakY) * (1 - (1 - chFrac) * 0.6));

    // Ground
    const groundY = bB + FOUND_H;

    /* ═══════════════════════════════════════════════════════
       STATIC BUILDING CACHE — only rebuild on resize
       Walls, roof, chimney body, foundation, drainpipe, ground
       ═══════════════════════════════════════════════════════ */
    const cacheKey = `${W}:${H}:${dpr}`;
    if (cacheKey !== cacheKeyRef.current) {
      let cache = buildCacheRef.current;
      if (!cache) { cache = document.createElement("canvas"); buildCacheRef.current = cache; }
      cache.width = Math.floor(W * dpr);
      cache.height = Math.floor(H * dpr);
      const cc = cache.getContext("2d")!;
      cc.scale(dpr, dpr);

      /* ─── WALLS — pixel bricks ─── */
      const brickW = 8, brickH = 4;
      const mortarC = "#080618";
      const brickPal: [number, number, number][][] = [
        [[28, 22, 52], [24, 18, 46], [32, 26, 56], [20, 16, 42]],
        [[36, 26, 58], [30, 22, 50], [40, 30, 62], [26, 20, 46]],
      ];
      for (let c = 0; c < COLS; c++) {
        const cx = Math.floor(bL + c * colW);
        const cw = Math.floor(c < COLS - 1 ? colW : bR - cx);
        const pal = brickPal[c % 2];
        cc.fillStyle = mortarC;
        cc.fillRect(cx, bT, cw, bH);
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
            cc.fillStyle = `rgb(${br[0]},${br[1]},${br[2]})`;
            cc.fillRect(x1, by, x2 - x1, y2 - by);
            cc.fillStyle = `rgba(255,255,255,0.06)`;
            cc.fillRect(x1, by, x2 - x1, 1);
            cc.fillRect(x1, by, 1, y2 - by);
            cc.fillStyle = `rgba(0,0,0,0.12)`;
            cc.fillRect(x1, y2 - 1, x2 - x1, 1);
            cc.fillRect(x2 - 1, by, 1, y2 - by);
          }
          brickRow++;
        }
        if (c > 0) {
          cc.fillStyle = "rgba(0,0,0,0.6)";
          cc.fillRect(cx, bT, 1, bH);
        }
      }
      cc.fillStyle = "rgba(255,255,255,0.06)";
      cc.fillRect(bL, bT, 2, bH);
      cc.fillStyle = "rgba(0,0,0,0.55)";
      cc.fillRect(bR - 2, bT, 2, bH);

      // Corner quoins
      const quoinW = 6, quoinH = 8;
      for (let qy = bT + 2; qy < bB - quoinH; qy += quoinH + 4) {
        cc.fillStyle = "#2e2658";
        cc.fillRect(bL, qy, quoinW, quoinH);
        cc.fillStyle = "rgba(255,255,255,0.08)";
        cc.fillRect(bL, qy, quoinW, 1);
        cc.fillRect(bL, qy, 1, quoinH);
        cc.fillStyle = "rgba(0,0,0,0.2)";
        cc.fillRect(bL, qy + quoinH - 1, quoinW, 1);
        cc.fillStyle = "#2a2254";
        cc.fillRect(bR - quoinW, qy, quoinW, quoinH);
        cc.fillStyle = "rgba(255,255,255,0.05)";
        cc.fillRect(bR - quoinW, qy, quoinW, 1);
        cc.fillStyle = "rgba(0,0,0,0.25)";
        cc.fillRect(bR - quoinW, qy + quoinH - 1, quoinW, 1);
        cc.fillRect(bR - 1, qy, 1, quoinH);
      }

      /* ─── ROOF ─── */
      cc.fillStyle = "#1a1444";
      cc.fillRect(roofL, roofTop, roofW, ROOF_H);
      cc.fillStyle = "#221a50";
      cc.beginPath();
      cc.moveTo(roofL, roofTop);
      cc.lineTo(peakX, peakY);
      cc.lineTo(roofR, roofTop);
      cc.closePath();
      cc.fill();
      const shingleC = ["#2a2058", "#241c50", "#1e1646", "#2e245c"];
      for (let sy = peakY + 3; sy < roofTop; sy += 3) {
        const frac = (sy - peakY) / (roofTop - peakY);
        const lx = Math.floor(roofL + (peakX - roofL) * (1 - frac));
        const rx = Math.ceil(peakX + (roofR - peakX) * frac);
        const si = Math.floor((sy - peakY) / 3) % shingleC.length;
        cc.fillStyle = shingleC[si];
        cc.fillRect(lx, sy, rx - lx, 3);
        cc.fillStyle = "rgba(255,255,255,0.04)";
        cc.fillRect(lx, sy, rx - lx, 1);
      }
      for (let sy = roofTop; sy < roofBase; sy += 3) {
        const si = Math.floor((sy - roofTop) / 3) % shingleC.length;
        cc.fillStyle = shingleC[si];
        cc.fillRect(roofL, sy, roofW, 3);
        cc.fillStyle = "rgba(255,255,255,0.03)";
        cc.fillRect(roofL, sy, roofW, 1);
      }
      cc.fillStyle = "rgba(255,255,255,0.08)";
      for (let sy = peakY; sy < roofTop; sy++) {
        const frac = (sy - peakY) / (roofTop - peakY);
        const lx = Math.floor(peakX - (peakX - roofL) * frac);
        cc.fillRect(lx, sy, 1, 1);
      }
      cc.fillStyle = "rgba(0,0,0,0.3)";
      for (let sy = peakY; sy < roofTop; sy++) {
        const frac = (sy - peakY) / (roofTop - peakY);
        const rx = Math.floor(peakX + (roofR - peakX) * frac);
        cc.fillRect(rx - 1, sy, 1, 1);
      }
      cc.fillStyle = "#0e0c2a";
      cc.fillRect(roofL, roofBase, roofW, 2);
      cc.fillStyle = "rgba(0,0,0,0.5)";
      cc.fillRect(bL, roofBase + 2, bW, 2);
      cc.fillStyle = "#3a3268";
      cc.fillRect(peakX - 2, peakY, 4, 2);
      cc.fillStyle = "rgba(255,255,255,0.1)";
      cc.fillRect(peakX - 2, peakY, 4, 1);

      // Antenna + flag
      const a1 = peakX;
      cc.fillStyle = "#2a2858";
      cc.fillRect(a1, peakY - 16, 2, 16);
      cc.fillStyle = "#ff2222";
      cc.shadowColor = "#ff4422";
      cc.shadowBlur = 12;
      cc.fillRect(a1 - 1, peakY - 18, 4, 2);
      cc.shadowBlur = 0;
      cc.fillStyle = "#ff4433";
      cc.fillRect(a1 + 2, peakY - 15, 7, 5);
      cc.fillStyle = "#ff6655";
      cc.fillRect(a1 + 2, peakY - 15, 7, 2);
      cc.fillStyle = "#cc2211";
      cc.fillRect(a1 + 8, peakY - 14, 1, 3);

      // Chimney body + bricks + cap (smoke is dynamic)
      cc.fillStyle = "#2a2250";
      cc.fillRect(chX - 4, chRoofY - 10, 10, 10 + (roofTop - chRoofY));
      for (let cby = chRoofY - 10; cby < roofTop; cby += 3) {
        const coff = (Math.floor((cby - chRoofY) / 3) % 2) * 3;
        cc.fillStyle = "#342c5a";
        for (let cbx = chX - 4 + coff; cbx < chX + 6; cbx += 6) {
          cc.fillRect(cbx, cby, 5, 2);
        }
      }
      cc.fillStyle = "#3a3268";
      cc.fillRect(chX - 5, chRoofY - 12, 12, 2);
      cc.fillStyle = "rgba(255,255,255,0.08)";
      cc.fillRect(chX - 5, chRoofY - 12, 12, 1);

      /* ─── FOUNDATION ─── */
      cc.fillStyle = "#0a0822";
      cc.fillRect(bL - 4, bB, bW + 8, FOUND_H);
      const stoneW = 12;
      for (let fy = bB; fy < bB + FOUND_H; fy += 4) {
        const foff = (Math.floor((fy - bB) / 4) % 2) * 6;
        for (let fx = bL - 4 + foff; fx < bR + 4; fx += stoneW + 1) {
          const sx1 = Math.max(fx, bL - 4);
          const sx2 = Math.min(fx + stoneW, bR + 4);
          if (sx2 <= sx1) continue;
          cc.fillStyle = "#0e0c28";
          cc.fillRect(sx1, fy, sx2 - sx1, 3);
          cc.fillStyle = "rgba(255,255,255,0.04)";
          cc.fillRect(sx1, fy, sx2 - sx1, 1);
          cc.fillStyle = "rgba(0,0,0,0.15)";
          cc.fillRect(sx1, fy + 2, sx2 - sx1, 1);
        }
      }
      cc.fillStyle = "rgba(255,255,255,0.04)";
      cc.fillRect(bL - 4, bB, bW + 8, 1);

      /* ─── DRAINPIPE ─── */
      const pipeX = bR - 8;
      cc.fillStyle = "#2a2650";
      cc.fillRect(pipeX, bT + 4, 3, bH - 4);
      cc.fillStyle = "rgba(255,255,255,0.06)";
      cc.fillRect(pipeX, bT + 4, 1, bH - 4);
      cc.fillStyle = "rgba(0,0,0,0.2)";
      cc.fillRect(pipeX + 2, bT + 4, 1, bH - 4);
      for (let py = bT + 20; py < bB - 10; py += 30) {
        cc.fillStyle = "#3a3668";
        cc.fillRect(pipeX - 1, py, 5, 2);
      }
      cc.fillStyle = "#2a2650";
      cc.fillRect(pipeX, bB - 2, 8, 3);

      /* ─── GROUND — cobblestones + lamp ─── */
      if (groundY < H) {
        const streetH = Math.min(H - groundY, 24);
        cc.fillStyle = "#0c0a22";
        cc.fillRect(bL - 12, groundY, bW + 24, streetH);
        for (let gy = groundY; gy < groundY + streetH; gy += 4) {
          const goff = (Math.floor((gy - groundY) / 4) % 2) * 5;
          for (let gx = bL - 12 + goff; gx < bR + 12; gx += 10) {
            cc.fillStyle = "#100e28";
            cc.fillRect(gx, gy, 8, 3);
            cc.fillStyle = "rgba(255,255,255,0.02)";
            cc.fillRect(gx, gy, 8, 1);
          }
        }
        const lampX = bL - 10;
        if (lampX > 6) {
          cc.fillStyle = "#2a2850";
          cc.fillRect(lampX, groundY - 18, 2, 18);
          cc.fillRect(lampX, groundY - 18, 6, 2);
          cc.fillStyle = "#3a3668";
          cc.fillRect(lampX + 3, groundY - 22, 5, 4);
          cc.fillStyle = "rgba(255,255,255,0.06)";
          cc.fillRect(lampX + 3, groundY - 22, 5, 1);
          cc.fillStyle = "#ffdd88";
          cc.shadowColor = "#ffcc66";
          cc.shadowBlur = 20;
          cc.fillRect(lampX + 4, groundY - 20, 3, 2);
          cc.shadowBlur = 0;
          cc.fillStyle = "rgba(255,220,136,0.04)";
          cc.fillRect(lampX - 6, groundY, 20, streetH);
          cc.fillStyle = "rgba(255,220,136,0.06)";
          cc.fillRect(lampX - 2, groundY, 10, Math.min(6, streetH));
        }
        const reflH = Math.min(8, streetH);
        cc.globalAlpha = 0.03;
        cc.fillStyle = "#cc88ff";
        cc.fillRect(bL, groundY + 2, bW, reflH);
        cc.globalAlpha = 1;
      }

      cacheKeyRef.current = cacheKey;
    }

    ctx.clearRect(0, 0, W, H);

    /* ═══ SKY — animated gradient + stars + moon + shooting star ═══ */
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
    // Crescent moon
    const mX = bR - 22, mY = 1;
    ctx.shadowColor = "#ffeedd";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#fff8e0";
    ctx.fillRect(mX, mY + 1, 2, 6);
    ctx.fillRect(mX + 2, mY, 2, 8);
    ctx.fillRect(mX + 4, mY, 1, 3);
    ctx.fillRect(mX + 4, mY + 5, 1, 3);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#030012";
    ctx.fillRect(mX + 3, mY + 2, 2, 4);
    ctx.fillRect(mX + 4, mY + 1, 1, 6);

    // Shooting star
    const shootPhase = (now / 3000) % 1;
    if (shootPhase < 0.25) {
      const sp = shootPhase / 0.25;
      const ssX = bL + bW * 0.2 + sp * bW * 0.5;
      const ssY = 2 + sp * (bT - 6);
      ctx.fillStyle = `rgba(255,255,255,${0.8 - sp * 0.7})`;
      ctx.shadowColor = "#aaddff";
      ctx.shadowBlur = 6;
      ctx.fillRect(ssX, ssY, 2, 1);
      for (let ti = 1; ti <= 4; ti++) {
        ctx.fillStyle = `rgba(200,220,255,${Math.max(0.5 - ti * 0.12 - sp * 0.3, 0)})`;
        ctx.fillRect(ssX - ti * 3, ssY - ti, 2, 1);
      }
      ctx.shadowBlur = 0;
    }

    /* ═══ BLIT CACHED BUILDING ═══ */
    if (buildCacheRef.current) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(buildCacheRef.current, 0, 0);
      ctx.restore();
    }

    /* ═══ CHIMNEY SMOKE — animated ═══ */
    const smokeT = Math.floor(now / 500) % 8;
    for (let s = 0; s < 4; s++) {
      const sAge = (smokeT + s * 2) % 8;
      const sAlpha = Math.max(0.2 - sAge * 0.025, 0);
      ctx.fillStyle = `rgba(140,140,180,${sAlpha})`;
      ctx.fillRect(chX - 1 + (sAge % 3) - 1, chRoofY - 14 - sAge * 4, 3 + (s % 2), 2);
    }

    /* ═══ PIXEL OWL on roof — cute mascot ═══ */
    {
      const ox = peakX - 12, oy = peakY - 2;
      const blink = Math.floor(now / 2500) % 8 === 0;
      const wingFlap = Math.floor(now / 300) % 12 === 0;
      // Body
      ctx.fillStyle = "#A07040";
      ctx.fillRect(ox + 1, oy, 4, 1);
      ctx.fillRect(ox, oy + 1, 6, 3);
      ctx.fillRect(ox + 1, oy + 4, 4, 1);
      // Belly highlight
      ctx.fillStyle = "#C8A870";
      ctx.fillRect(ox + 2, oy + 2, 2, 2);
      // Ear tufts
      ctx.fillStyle = "#7A5030";
      ctx.fillRect(ox, oy - 1, 1, 1);
      ctx.fillRect(ox + 5, oy - 1, 1, 1);
      // Eyes
      if (blink) {
        ctx.fillStyle = "#7A5030";
        ctx.fillRect(ox + 1, oy + 1, 2, 1);
        ctx.fillRect(ox + 3, oy + 1, 2, 1);
      } else {
        ctx.fillStyle = "#fff";
        ctx.fillRect(ox + 1, oy + 1, 2, 2);
        ctx.fillRect(ox + 3, oy + 1, 2, 2);
        // Pupils — look toward sentiment
        const pOff = sentimentRef.current > 0.55 ? 0 : sentimentRef.current < 0.45 ? 1 : 0;
        ctx.fillStyle = "#111";
        ctx.fillRect(ox + 1 + pOff, oy + 2, 1, 1);
        ctx.fillRect(ox + 4 + pOff, oy + 2, 1, 1);
        // Eye shine
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(ox + 1, oy + 1, 1, 1);
        ctx.fillRect(ox + 3, oy + 1, 1, 1);
      }
      // Beak
      ctx.fillStyle = "#FFB347";
      ctx.fillRect(ox + 2, oy + 3, 2, 1);
      // Feet
      ctx.fillStyle = "#FFB347";
      ctx.fillRect(ox + 1, oy + 5, 1, 1);
      ctx.fillRect(ox + 4, oy + 5, 1, 1);
      // Wings
      if (wingFlap) {
        ctx.fillStyle = "#8A6038";
        ctx.fillRect(ox - 1, oy + 1, 1, 2);
        ctx.fillRect(ox + 6, oy + 1, 1, 2);
      }
    }

    /* ═══ NEON SIGN on roof — animated flicker ═══ */
    const neonOn = Math.sin(now / 200) > -0.3;
    if (neonOn) {
      ctx.font = "11px 'VT323', monospace";
      ctx.fillStyle = "#ff66ff";
      ctx.shadowColor = "#ff44ff";
      ctx.shadowBlur = 10;
      ctx.textAlign = "center";
      ctx.fillText("FLOW", peakX, roofTop + 14);
      ctx.shadowBlur = 0;
    }

    /* ═══ BATS in sky — animated ═══ */
    for (let b = 0; b < 3; b++) {
      const bx = bL + ((now / (2400 + b * 600) + b * 0.33) % 1) * (bW + 20) - 10;
      const by = 3 + Math.sin(now / 500 + b * 2.1) * 3 + b * 2;
      const wingUp = Math.floor(now / 180 + b * 50) % 2 === 0;
      ctx.fillStyle = "#332255";
      ctx.fillRect(bx, by, 2, 1);
      if (wingUp) {
        ctx.fillRect(bx - 2, by - 1, 2, 1);
        ctx.fillRect(bx + 2, by - 1, 2, 1);
      } else {
        ctx.fillRect(bx - 2, by + 1, 2, 1);
        ctx.fillRect(bx + 2, by + 1, 2, 1);
      }
    }

    /* ═══ WINDOW GLOW + WINDOWS — dynamic (depends on trade data) ═══ */
    const muntW = winW > 35 ? 3 : 2;
    const muntH = winH > 14 ? 3 : 2;

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
          if (age < 0.8) { pulsing = age < 0.15; }
          else pulseRef.current.delete(key);
        }
        const bri = maxCellPrem > 0 ? cell.total / maxCellPrem : 0;
        let cr: number, cg: number, cb: number;
        if (cell.total === 0) { cr = 0; cg = 0; cb = 0; }
        else if (cell.ratio >= 0.5) {
          const t = Math.min((cell.ratio - 0.5) * 2, 1);
          cr = 0; cg = 220 + Math.round(35 * t); cb = 40 + Math.round(40 * t);
        } else {
          const t = Math.min((0.5 - cell.ratio) * 2, 1);
          cr = 255; cg = 10 + Math.round(20 * t); cb = 30 + Math.round(30 * t);
        }
        cellInfo.push({ r, c, cell, wx, wy, pulsing, bri, cr, cg, cb });
      }
    }

    // PASS 1: Glow halos
    for (const ci of cellInfo) {
      if (ci.cell.total === 0 || ci.bri < 0.1) continue;
      const { wx, wy, pulsing, bri, cr, cg, cb } = ci;
      const glowR = pulsing ? 55 : 8 + bri * 30;
      const glowA = pulsing ? 0.45 : 0.06 + bri * 0.2;
      ctx.shadowColor = pulsing ? `rgb(${Math.min(cr + 120, 255)},${Math.min(cg + 120, 255)},${Math.min(cb + 120, 255)})` : `rgb(${cr},${cg},${cb})`;
      ctx.shadowBlur = glowR;
      ctx.fillStyle = `rgba(${cr},${cg},${cb},${glowA})`;
      ctx.fillRect(wx - 4, wy - 4, winW + 8, winH + 10);
      ctx.shadowBlur = 0;
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

      // Recess
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(wx - 3, wy - 3, winW + 5, 3);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(wx - 3, wy, 3, winH);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(wx, wy + winH, winW + 1, 2);
      ctx.fillRect(wx + winW, wy, 2, winH + 1);

      // Frame
      ctx.fillStyle = fM;
      ctx.fillRect(wx - 1, wy - 1, winW + 2, winH + 2);
      ctx.fillStyle = fH;
      ctx.fillRect(wx - 1, wy - 1, winW + 2, 1);
      ctx.fillRect(wx - 1, wy, 1, winH + 1);
      ctx.fillStyle = fS;
      ctx.fillRect(wx - 1, wy + winH, winW + 2, 1);
      ctx.fillRect(wx + winW, wy - 1, 1, winH + 2);

      // 4 panes
      const halfW = Math.floor((winW - muntW) / 2);
      const halfH = Math.floor((winH - muntH) / 2);
      const panes = [
        { px: wx, py: wy, pw: halfW, ph: halfH, bm: 0.6 },
        { px: wx + halfW + muntW, py: wy, pw: winW - halfW - muntW, ph: halfH, bm: 0.75 },
        { px: wx, py: wy + halfH + muntH, pw: halfW, ph: winH - halfH - muntH, bm: 0.9 },
        { px: wx + halfW + muntW, py: wy + halfH + muntH, pw: winW - halfW - muntW, ph: winH - halfH - muntH, bm: 1.3 },
      ];

      if (cell.total === 0) {
        for (let i = 0; i < panes.length; i++) {
          const p = panes[i];
          ctx.fillStyle = "#020210";
          ctx.fillRect(p.px, p.py, p.pw, p.ph);
          ctx.fillStyle = "rgba(40,40,90,0.15)";
          const rx = p.px + 1 + (i % 2) * Math.floor(p.pw * 0.4);
          const ry = p.py + 1;
          ctx.fillRect(rx, ry, Math.max(Math.floor(p.pw * 0.25), 2), Math.max(Math.floor(p.ph * 0.3), 2));
        }
      } else {
        const a = pulsing ? 1 : 0.4 + bri * 0.6;
        const recessA = pulsing ? 0.35 : bri * 0.15;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${recessA})`;
        ctx.fillRect(wx - 3, wy - 3, winW + 5, 3);
        ctx.fillRect(wx - 3, wy, 3, winH);

        for (let i = 0; i < panes.length; i++) {
          const p = panes[i];
          const pa = Math.min(a * p.bm, 1);

          if (pulsing) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(p.px, p.py, p.pw, p.ph);
            ctx.fillStyle = `rgba(${cr},${cg},${cb},0.25)`;
            ctx.fillRect(p.px, p.py, p.pw, p.ph);
          } else {
            ctx.fillStyle = `rgba(${Math.floor(cr * 0.5)},${Math.floor(cg * 0.5)},${Math.floor(cb * 0.5)},${pa})`;
            ctx.fillRect(p.px, p.py, p.pw, p.ph);
            if (p.pw > 3 && p.ph > 3) {
              ctx.fillStyle = `rgba(${cr},${cg},${cb},${pa})`;
              ctx.fillRect(p.px + 1, p.py + 1, p.pw - 2, p.ph - 2);
            }
            if (p.pw > 6 && p.ph > 5) {
              ctx.fillStyle = `rgba(${Math.min(cr + 50, 255)},${Math.min(cg + 50, 255)},${Math.min(cb + 50, 255)},${Math.min(pa * 1.2, 1)})`;
              ctx.fillRect(p.px + 2, p.py + 2, p.pw - 4, p.ph - 4);
            }
            if (p.pw > 10 && p.ph > 7 && bri > 0.2) {
              ctx.fillStyle = `rgba(${Math.min(cr + 100, 255)},${Math.min(cg + 100, 255)},${Math.min(cb + 100, 255)},${Math.min(pa * 1.4, 1)})`;
              ctx.fillRect(p.px + 3, p.py + 3, p.pw - 6, p.ph - 6);
            }

            // Curtain — top panes
            if (i < 2) {
              const curtH = Math.max(Math.floor(p.ph * 0.28), 2);
              ctx.fillStyle = `rgba(0,0,0,${0.35 + (1 - bri) * 0.15})`;
              ctx.fillRect(p.px, p.py, p.pw, curtH);
              for (let sx = p.px; sx < p.px + p.pw - 1; sx += 3) {
                ctx.fillStyle = `rgba(0,0,0,0.2)`;
                ctx.fillRect(sx, p.py + curtH, Math.min(2, p.px + p.pw - sx), 1);
              }
            }
          }

          // Glass edge
          ctx.fillStyle = `rgba(0,0,0,${pulsing ? 0.05 : 0.2})`;
          ctx.fillRect(p.px, p.py, p.pw, 1);
          ctx.fillRect(p.px, p.py, 1, p.ph);
          // Glass highlight
          ctx.fillStyle = `rgba(255,255,255,${pulsing ? 0.5 : 0.08 + bri * 0.1})`;
          ctx.fillRect(p.px + Math.floor(p.pw * 0.6), p.py + 1, 2, Math.min(2, p.ph - 1));
        }

        // TV flicker in some lit windows
        if ((r * 7 + c * 3) % 5 === 0 && !pulsing && panes[3].pw > 4 && panes[3].ph > 4) {
          const tvColors = ["#4488ff", "#44ff88", "#ff8844", "#ff44ff", "#44ffff"];
          const tvIdx = Math.floor(now / 250) % tvColors.length;
          const tp = panes[3];
          ctx.fillStyle = tvColors[tvIdx] + "35";
          ctx.fillRect(tp.px + 1, tp.py + 1, tp.pw - 2, tp.ph - 2);
        }

        // Person silhouette in some lit windows
        if ((r * 5 + c * 7) % 6 === 0 && !pulsing && bri > 0.15 && panes[2].pw > 5 && panes[2].ph > 6) {
          const pp = panes[2];
          const px = pp.px + Math.floor(pp.pw * 0.35);
          const ph = Math.max(Math.floor(pp.ph * 0.6), 4);
          const pw = Math.max(Math.floor(pp.pw * 0.18), 2);
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(px, pp.py + pp.ph - ph, pw, ph);
          ctx.fillRect(px - 1, pp.py + pp.ph - ph - 1, pw + 2, Math.max(Math.floor(ph * 0.2), 2));
        }

        // Pulsing outer burst
        if (pulsing) {
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 60;
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.15)`;
          ctx.fillRect(wx - 6, wy - 6, winW + 12, winH + 14);
          ctx.shadowBlur = 0;
        }

        // Text — amount + direction
        if (winW > 16 && winH > 8) {
          const fs = Math.min(Math.floor(winH * 0.36), 18);
          ctx.font = `${fs}px 'VT323', monospace`;
          ctx.fillStyle = pulsing ? "#ffffff" : `rgba(255,255,255,${0.5 + bri * 0.5})`;
          ctx.textAlign = "left";
          ctx.shadowColor = pulsing ? "#fff" : `rgb(${cr},${cg},${cb})`;
          ctx.shadowBlur = pulsing ? 12 : 5;
          const amtStr = cell.total >= 1e6 ? `${(cell.total / 1e6).toFixed(1)}M` : `${(cell.total / 1e3).toFixed(0)}K`;
          const dirStr = cell.ratio >= 0.5 ? "▲" : "▼";
          ctx.fillText(amtStr, wx + 2, wy + winH - 2);
          if (winW > 24 && winH > 12) {
            ctx.textAlign = "right";
            ctx.fillStyle = cell.ratio >= 0.5 ? C.call : C.put;
            ctx.fillText(dirStr, wx + winW - 2, wy + fs);
          }
          ctx.shadowBlur = 0;
        }
      }

      // Muntin bars
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

      // Sill
      const sE = 3, sHt = 3;
      const slx = wx - sE, sly = wy + winH + 1, slw = winW + sE * 2;
      ctx.fillStyle = "#3a3860";
      ctx.fillRect(slx, sly, slw, 1);
      ctx.fillStyle = "#2a2850";
      ctx.fillRect(slx, sly + 1, slw, sHt - 1);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(slx + 1, sly + sHt, slw - 1, 1);
      if (cell.total > 0) {
        const sillA = pulsing ? 0.35 : bri * 0.18;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${sillA})`;
        ctx.fillRect(slx, sly, slw, sHt);
      }

      // Sill decorations (dark windows only)
      if (cell.total === 0) {
        const decor = (r * 7 + c * 3 + 1) % 12;
        const mid = Math.floor(slx + slw / 2);
        if (decor === 0 || decor === 5) {
          ctx.fillStyle = "#cc6644"; ctx.fillRect(mid - 2, sly - 2, 4, 2);
          ctx.fillStyle = "#44cc66"; ctx.fillRect(mid - 1, sly - 4, 2, 2);
          ctx.fillStyle = "#66dd88"; ctx.fillRect(mid, sly - 5, 1, 1);
          ctx.fillStyle = "#ff6688"; ctx.fillRect(mid + 1, sly - 5, 1, 1);
        } else if (decor === 2) {
          ctx.fillStyle = "#ffcc88"; ctx.fillRect(mid - 2, sly - 3, 4, 3);
          ctx.fillStyle = "#ffbb77"; ctx.fillRect(mid - 2, sly - 4, 1, 1); ctx.fillRect(mid + 1, sly - 4, 1, 1);
          ctx.fillStyle = "#222"; ctx.fillRect(mid - 1, sly - 3, 1, 1); ctx.fillRect(mid, sly - 3, 1, 1);
          ctx.fillStyle = "#ffcc88"; ctx.fillRect(mid + 2, sly - 2, 2, 1);
        } else if (decor === 4) {
          ctx.fillStyle = "#44aa55"; ctx.fillRect(mid, sly - 5, 2, 5);
          ctx.fillRect(mid - 1, sly - 3, 1, 2); ctx.fillRect(mid + 2, sly - 2, 1, 1);
          ctx.fillStyle = "#cc6644"; ctx.fillRect(mid - 1, sly - 1, 4, 1);
        } else if (decor === 6) {
          ctx.fillStyle = "#6699cc"; ctx.fillRect(mid, sly - 3, 3, 2);
          ctx.fillStyle = "#5588bb"; ctx.fillRect(mid - 1, sly - 4, 2, 1);
          ctx.fillStyle = "#ffaa44"; ctx.fillRect(mid - 2, sly - 4, 1, 1);
          ctx.fillStyle = "#6699cc"; ctx.fillRect(mid + 3, sly - 4, 1, 1);
        } else if (decor === 8) {
          ctx.fillStyle = "#8844aa"; ctx.fillRect(mid - 2, sly - 2, 5, 2);
          ctx.fillStyle = "#4488cc"; ctx.fillRect(mid - 1, sly - 3, 4, 1);
          ctx.fillStyle = "#cc6644"; ctx.fillRect(mid - 2, sly - 4, 5, 1);
        } else if (decor === 10) {
          ctx.fillStyle = "#ccaa88"; ctx.fillRect(mid, sly - 3, 2, 3);
          ctx.fillStyle = "#ffcc44"; ctx.fillRect(mid, sly - 4, 2, 1);
          ctx.fillStyle = "#ffee88";
          ctx.shadowColor = "#ffcc44"; ctx.shadowBlur = 4;
          ctx.fillRect(mid, sly - 5, 1, 1);
          ctx.shadowBlur = 0;
        }
      }
    }

    /* ═══ PIXEL CAR on street — animated ═══ */
    if (groundY < H) {
      const carPos = ((now / 30) % (bW + 40)) - 20;
      const carX = Math.floor(bL + carPos);
      const carY = groundY + 3;
      // Body
      ctx.fillStyle = "#ee3344";
      ctx.fillRect(carX, carY, 10, 3);
      // Cabin
      ctx.fillStyle = "#ff5566";
      ctx.fillRect(carX + 2, carY - 2, 5, 2);
      // Window
      ctx.fillStyle = "#88ccff";
      ctx.fillRect(carX + 3, carY - 2, 3, 1);
      // Wheels
      ctx.fillStyle = "#222";
      ctx.fillRect(carX + 1, carY + 3, 2, 1);
      ctx.fillRect(carX + 7, carY + 3, 2, 1);
      // Headlight
      ctx.fillStyle = "#ffee88";
      ctx.shadowColor = "#ffee44";
      ctx.shadowBlur = 4;
      ctx.fillRect(carX + 10, carY + 1, 1, 1);
      ctx.shadowBlur = 0;
      // Taillight
      ctx.fillStyle = "#ff2222";
      ctx.fillRect(carX - 1, carY + 1, 1, 1);
    }

    /* ═══ SENTIMENT GLOW + HOTTEST CROWN ═══ */
    let totalCallPrem = 0, totalPutPrem = 0;
    let hottest: typeof cellInfo[0] | null = null;
    for (const ci of cellInfo) {
      totalCallPrem += ci.cell.callPrem;
      totalPutPrem += ci.cell.putPrem;
      if (!hottest || ci.cell.total > hottest.cell.total) hottest = ci;
    }
    const sentTotal = totalCallPrem + totalPutPrem;
    if (sentTotal > 0) {
      const sentRatio = totalCallPrem / sentTotal;
      const sentColor = sentRatio >= 0.5 ? C.call : C.put;
      const sentA = Math.abs(sentRatio - 0.5) * 0.4;
      const hex = Math.floor(sentA * 255).toString(16).padStart(2, "0");
      ctx.fillStyle = `${sentColor}${hex}`;
      ctx.fillRect(bL, bT, 3, bH);
      ctx.fillRect(bR - 3, bT, 3, bH);
    }
    if (hottest && hottest.cell.total > 0) {
      const hx = hottest.wx + Math.floor(winW / 2);
      const hy = hottest.wy - 7;
      ctx.fillStyle = "#ffdd66";
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 6;
      ctx.fillRect(hx - 4, hy + 2, 9, 3);
      ctx.fillRect(hx - 4, hy, 2, 2);
      ctx.fillRect(hx, hy - 1, 1, 2);
      ctx.fillRect(hx + 3, hy, 2, 2);
      ctx.shadowBlur = 0;
    }

    /* ═══ WEATHER — rain when bearish, sparkles when bullish ═══ */
    sentimentRef.current = sentTotal > 0 ? totalCallPrem / sentTotal : 0.5;
    if (sentimentRef.current < 0.42) {
      // Rain — falling pixel drops
      const rainDensity = Math.floor((0.42 - sentimentRef.current) * 80);
      for (let i = 0; i < rainDensity; i++) {
        const rx = bL + ((i * 37 + Math.floor(now / 50) * (i % 3 + 1)) % Math.floor(bW));
        const ry = ((i * 53 + Math.floor(now / 30) * (i % 2 + 1)) % Math.floor(H));
        ctx.fillStyle = `rgba(120,160,255,${0.15 + (i % 3) * 0.05})`;
        ctx.fillRect(rx, ry, 1, 2 + (i % 2));
      }
      // Puddle reflections at ground
      if (groundY < H) {
        ctx.fillStyle = "rgba(120,160,255,0.04)";
        ctx.fillRect(bL, groundY + 1, bW, 3);
      }
    } else if (sentimentRef.current > 0.58) {
      // Sparkles — floating golden particles
      const sparkleDensity = Math.floor((sentimentRef.current - 0.58) * 40);
      for (let i = 0; i < sparkleDensity; i++) {
        const sx = bL + ((i * 41 + Math.floor(now / 200) * (i % 2 + 1)) % Math.floor(bW));
        const sy = bT + ((i * 67 + Math.floor(now / 300) * (i % 3 + 1)) % Math.floor(bH));
        const visible = Math.sin(now / 400 + i * 1.7) > 0.3;
        if (visible) {
          ctx.fillStyle = "#ffdd66";
          ctx.shadowColor = "#ffcc00";
          ctx.shadowBlur = 4;
          ctx.fillRect(sx, sy, 2, 2);
          ctx.shadowBlur = 0;
        }
      }
    }

    /* ═══ LABELS + LOGOS ═══ */
    ctx.font = "14px 'VT323', monospace";
    ctx.fillStyle = C.dim;
    ctx.textAlign = "center";
    for (let c = 0; c < COLS; c++)
      ctx.fillText(EXPIRIES[c], bL + c * colW + colW / 2, LABEL_H - 2);

    ctx.font = "14px 'VT323', monospace";
    ctx.textAlign = "center";
    for (let r = 0; r < ROWS; r++) {
      const rowCenter = bT + r * rowH + rowH / 2;
      drawLogo(ctx, sortedTickers[r], Math.floor(TICKER_W / 2 - 5), rowCenter - 10, 1.2);
      ctx.fillStyle = C.text;
      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 3;
      ctx.fillText(sortedTickers[r], TICKER_W / 2, rowCenter + 8);
      ctx.shadowBlur = 0;
    }

    // 60fps during pulses, ~7fps ambient, ~4fps idle
    if (pulseRef.current.size > 0) {
      rafRef.current = requestAnimationFrame(draw);
    } else {
      const hasWeather = sentimentRef.current < 0.42 || sentimentRef.current > 0.58;
      ambientTimer.current = setTimeout(() => {
        rafRef.current = requestAnimationFrame(draw);
      }, hasWeather ? 120 : 200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (ambientTimer.current) clearTimeout(ambientTimer.current);
    draw();
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (ambientTimer.current) clearTimeout(ambientTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells, sortedTickers, maxCellPrem]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      cacheKeyRef.current = "";
      cancelAnimationFrame(rafRef.current);
      if (ambientTimer.current) clearTimeout(ambientTimer.current);
      draw();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [draw]);

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
          fontSize: 26, fontFamily: FONTS.mono, color: C.text,
          pointerEvents: "none", whiteSpace: "nowrap",
          boxShadow: `0 0 20px ${C.accent}30`,
        }}>
          <div style={{ fontFamily: FONTS.display, fontSize: 12, color: C.accent, marginBottom: 4, textShadow: `0 0 6px ${C.accent}` }}>
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
