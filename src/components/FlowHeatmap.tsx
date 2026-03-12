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

/* ── Lofi pixel-art window scenes v10 — ultra-cute, premium, dynamic ──
 *  Right-biased with leftward overflow. Oversized chibi head with sparkle
 *  eyes & cat-mouth. WILD exaggerated motions. Hearts, stars, speed lines.
 */
function drawWindowScene(
  ctx: CanvasRenderingContext2D,
  wx: number, wy: number, winW: number, winH: number,
  sceneId: number, ratio: number, _bri: number, now: number,
) {
  if (winW < 20 || winH < 16) return;
  const u = 4;
  const cx = Math.round(wx + winW * 0.62);
  const by = Math.round(wy + winH - u);

  ctx.save();
  ctx.beginPath();
  ctx.rect(wx + 1, wy + 1, winW - 2, winH - 2);
  ctx.clip();

  const ph = ((Math.round(wx * 7.3 + wy * 13.7) & 0x7ff) / 2048) * Math.PI * 2;
  const S = (per: number, amp: number) =>
    Math.round((Math.sin(now / per + ph) * 0.65 +
                Math.sin(now / (per * 1.7) + ph * 1.3) * 0.35) * amp);
  const C2 = (per: number, amp: number) =>
    Math.round((Math.cos(now / per + ph) * 0.65 +
                Math.cos(now / (per * 1.7) + ph * 1.3) * 0.35) * amp);
  const bull = ratio > 0.6, bear = ratio < 0.4;

  // Premium palette — rich contrast + cute accents
  const D = "rgba(6,3,18,0.85)";
  const M = "rgba(10,7,24,0.60)";
  const L = "rgba(20,14,32,0.34)";
  const blush = "rgba(255,120,160,0.35)";
  const hi = "rgba(255,255,255,0.25)";
  const heart = "rgba(255,80,140,0.50)";
  const star = "rgba(255,230,80,0.45)";
  const spark = "rgba(180,220,255,0.40)";

  const p = (gx: number, gy: number, c = M) => {
    ctx.fillStyle = c; ctx.fillRect(cx + gx * u, by - gy * u, u, u);
  };
  const h = (gx: number, gy: number, n: number, c = M) => {
    if (n > 0) { ctx.fillStyle = c; ctx.fillRect(cx + gx * u, by - gy * u, n * u, u); }
  };
  const v = (gx: number, gy: number, n: number, c = M) => {
    if (n > 0) { ctx.fillStyle = c; ctx.fillRect(cx + gx * u, by - (gy + n - 1) * u, u, n * u); }
  };

  /* ── Ultra-chibi head — huge round, sparkle eyes, cat mouth ── */
  const hd = (ox: number, bob = 0, mood: "happy" | "sad" | "o" | "neutral" = "neutral") => {
    const y = 6 + bob;
    // BIG 9-wide round head
    h(ox - 1, y + 5, 3, D);     // hair tuft peak
    h(ox - 2, y + 4, 5, D);     // hair top
    h(ox - 3, y + 3, 7, D);     // hair full
    h(ox - 4, y + 2, 9, D);     // hair widest — 9px!
    h(ox - 4, y + 1, 9, M);     // face upper — eyes
    h(ox - 4, y, 9, M);         // face lower — mouth
    h(ox - 3, y - 1, 7, M);     // chin wide
    h(ox - 2, y - 2, 5, M);     // chin narrow
    // big sparkle eyes — 2px tall
    p(ox - 2, y + 1, D); p(ox - 3, y + 1, D); // L eye
    p(ox - 2, y + 2, D); // L eye lower
    p(ox - 2, y + 2, hi); // L sparkle
    p(ox + 2, y + 1, D); p(ox + 3, y + 1, D); // R eye
    p(ox + 2, y + 2, D); // R eye lower
    p(ox + 2, y + 2, hi); // R sparkle
    // rosy cheeks — BIG
    p(ox - 4, y, blush); p(ox - 3, y + 1, blush);
    p(ox + 4, y, blush); p(ox + 3, y + 1, blush);
    // cat mouth ω or mood
    if (mood === "happy") {
      p(ox - 1, y, D); p(ox, y - 1, D); p(ox + 1, y, D); // big W smile
      p(ox, y, L); // teeth flash
    } else if (mood === "sad") {
      p(ox - 1, y - 1, D); p(ox, y, D); p(ox + 1, y - 1, D); // wavy frown
    } else if (mood === "o") {
      p(ox, y, D); p(ox, y - 1, D); // O mouth
    } else {
      p(ox - 1, y, D); p(ox + 1, y, D); // cat ω mouth
    }
    // hair shine — triple sparkle
    p(ox - 1, y + 4, hi); p(ox, y + 5, hi); p(ox + 1, y + 4, hi);
  };
  const ts = (ox = 0) => {
    p(ox, 4, M);                // neck
    h(ox - 2, 3, 5, M);         // shoulders
    h(ox - 1, 2, 3, M);         // chest
    h(ox - 1, 1, 3, M);         // belly
    h(ox - 1, 0, 3, L);         // waist at sill
    p(ox - 2, 3, hi); p(ox + 2, 3, hi);
  };
  const mood = bull ? "happy" as const : bear ? "sad" as const : "neutral" as const;
  const bod = (ox = 0) => { hd(ox, S(1400, 1), mood); ts(ox); };

  // Cute effects helpers
  const drawHeart = (gx: number, gy: number) => {
    p(gx - 1, gy + 1, heart); p(gx + 1, gy + 1, heart);
    p(gx - 1, gy, heart); p(gx, gy, heart); p(gx + 1, gy, heart);
    p(gx, gy - 1, heart);
  };
  const drawStar = (gx: number, gy: number) => {
    p(gx, gy + 1, star); p(gx, gy - 1, star);
    p(gx - 1, gy, star); p(gx + 1, gy, star); p(gx, gy, star);
  };

  switch (sceneId) {
    case 0: { // TURBO TYPING — whole body shakes, screen flashes, keys fly off
      h(-10, 3, 15, D); h(-10, 2, 15, D); // wide desk
      const slam = S(180, 3);
      hd(slam, Math.abs(S(200, 2)), mood); ts(slam);
      // arms POUND keyboard alternating
      p(slam - 3, 4 + Math.max(slam, 0), M); p(slam - 4, 3 + Math.max(slam, 0), M);
      p(slam + 3, 4 + Math.max(-slam, 0), M); p(slam + 4, 3 + Math.max(-slam, 0), M);
      // monitor — screen flashes rapidly
      h(-10, 4, 4, D); v(-10, 5, 6, D); v(-7, 5, 6, D); h(-10, 10, 4, D);
      const g = S(400, 1) > 0 ? "rgba(60,220,255,0.38)" : "rgba(255,120,200,0.32)";
      h(-9, 5, 3, g); h(-9, 6, 3, g); h(-9, 7, 3, g); h(-9, 8, 3, g); h(-9, 9, 3, g);
      // keys flying off keyboard!
      p(2 + S(800, 4), 6 + C2(600, 3), L);
      p(-1 + C2(700, 3), 7 + S(500, 2), L);
      // coffee cup vibrates off desk
      h(4, 3 + Math.abs(slam), 2, D); h(4, 4 + Math.abs(slam), 2, D);
      p(4, 5 + Math.abs(slam) + Math.abs(S(500, 1)), "rgba(180,160,140,0.30)");
      break;
    }
    case 1: { // CAT ZOOMIES — sprints wall to wall, tail puffed
      const zoom = S(350, 6);
      const puff = Math.abs(zoom) > 3;
      // cat body — FLAT OUT sprint
      h(zoom - 3, 1, 5, D); h(zoom - 4, 0, 7, M);
      h(zoom - 2, 2, 4, D); // head
      p(zoom - 3, 3, D); p(zoom + 1, 3, D); // ears UP
      p(zoom - 1, 2, "rgba(200,255,80,0.50)"); p(zoom + 1, 2, "rgba(200,255,80,0.50)"); // crazy eyes
      // speed lines behind cat
      h(zoom + 3, 1, 3, L); h(zoom + 4, 0, 4, L); h(zoom + 2, 2, 2, L);
      // puffed tail when turning
      if (puff) {
        p(zoom + 3, 1, D); p(zoom + 4, 2, D); p(zoom + 3, 2, D); p(zoom + 4, 1, D); // poof!
        p(zoom + 5, 2, M); p(zoom + 3, 3, M);
      } else {
        p(zoom + 3, 0, D); p(zoom + 4, 1, D); p(zoom + 5, 2, D);
      }
      // paw prints left behind
      if (Math.abs(zoom) > 2) {
        p(zoom - 6, 0, L); p(zoom - 9, 0, L);
      }
      break;
    }
    case 2: { // MEGA STRETCH — arms reach sky, then SNAP back, stars burst
      const up = S(1400, 5);
      const stretch = Math.abs(up);
      hd(0, Math.min(stretch, 3), stretch > 3 ? "o" : "happy"); ts();
      // yawn — HUGE open mouth
      if (stretch > 2) { h(-2, 6, 4, D); h(-1, 5, 2, D); }
      // arms reach WAY up and spread
      const ay = 5 + stretch;
      p(-3, 5, M); p(-4, ay, M); p(-5, ay + 1, M); p(-6, ay + 2, M);
      p(-7, ay + 3, M); p(-8, ay + 4, M);
      p(3, 5, M); p(4, ay, M); p(5, ay + 1, M); p(6, ay + 2, M);
      p(7, ay + 3, M); p(8, ay + 4, M);
      // sparkle burst at peak
      if (stretch > 3) {
        drawStar(-8, ay + 5);
        drawStar(8, ay + 5);
        p(-6, ay + 6, spark); p(6, ay + 6, spark);
      }
      break;
    }
    case 3: { // COFFEE OVERDOSE — chug, vibrate, float off ground
      const chug = S(1200, 4);
      const tilt = Math.max(chug, 0);
      const jitter = tilt > 2 ? S(80, 2) : 0;
      const float = tilt > 3 ? 2 : 0;
      hd(jitter, tilt > 2 ? -1 + float : float, tilt > 2 ? "o" : "neutral"); ts(jitter);
      p(-3, 4, M); p(-3, 3, M);
      // HUGE cup raised to face
      const cupY = 4 + tilt;
      p(3, 4, M); v(3, 4, Math.max(cupY - 3, 1), M);
      h(4, cupY, 3, D); h(4, cupY + 1, 3, D); h(4, cupY + 2, 3, D);
      p(7, cupY, D); p(7, cupY + 1, D); p(7, cupY + 2, D);
      // steam ERUPTS
      p(4 + S(600, 2), cupY + 3, M); p(5 + C2(500, 2), cupY + 4, M);
      p(6 + S(400, 2), cupY + 5, L); p(4 + C2(700, 2), cupY + 4, L);
      // post-chug: body vibrates, sparks fly
      if (jitter !== 0) {
        drawStar(jitter + 5, 11);
        p(jitter - 4, 10, spark); p(jitter + 6, 9, spark);
        p(jitter - 5, 8, "rgba(255,220,60,0.35)");
      }
      break;
    }
    case 4: { // RAVE DANCE — full body whip, lasers, glow sticks
      const sw = S(300, 5), bn = S(220, 3);
      hd(sw, Math.abs(bn), "happy"); ts(sw);
      // arms whip around wildly
      const a = S(250, 4);
      p(sw - 3, 5, M); p(sw - 4, 6 + a, M); p(sw - 5, 7 + a, M);
      p(sw - 6, 8 + a, M); p(sw - 7, 9 + a, M);
      p(sw + 3, 5, M); p(sw + 4, 6 - a, M); p(sw + 5, 7 - a, M);
      p(sw + 6, 8 - a, M); p(sw + 7, 9 - a, M);
      // glow sticks in hands
      p(sw - 7, 10 + a, "rgba(0,255,150,0.50)");
      p(sw + 7, 10 - a, "rgba(255,0,200,0.50)");
      // laser beams across window
      const ly = 12 + S(1200, 3);
      h(-12, ly, 24, "rgba(255,0,80,0.18)");
      h(-12, ly + S(800, 2), 24, "rgba(0,200,255,0.15)");
      // floor lights
      p(sw + S(900, 6), 0, "rgba(255,80,200,0.40)");
      p(sw - C2(700, 5), 0, "rgba(80,200,255,0.35)");
      p(S(1100, 7), 0, "rgba(255,230,60,0.30)");
      break;
    }
    case 5: { // MEGA CELEBRATE / MELTDOWN
      if (bear) {
        // TOTAL MELTDOWN — violent shake, tears fly, storm
        const shake = S(120, 3);
        hd(shake, -3, "sad"); ts(shake);
        p(shake - 3, 8, M); p(shake + 3, 8, M); // hands clutch head
        p(shake - 4, 9, M); p(shake + 4, 9, M);
        // tears FLY outward
        p(shake - 5, 8 + S(400, 2), "rgba(80,160,255,0.45)");
        p(shake + 5, 8 + C2(350, 2), "rgba(80,160,255,0.45)");
        p(shake - 6, 7 + S(500, 1), "rgba(80,160,255,0.30)");
        p(shake + 6, 7 + C2(450, 1), "rgba(80,160,255,0.30)");
        // dark storm cloud
        h(-4, 13, 9, M); h(-3, 14, 7, M); h(-2, 15, 5, L);
        // lightning bolt
        if (S(1500, 1) > 0) { p(0, 12, star); p(1, 11, star); p(0, 10, star); }
      } else {
        // ABSOLUTE PARTY — huge jump, confetti EXPLODES
        const jump = Math.abs(S(350, 5));
        hd(0, jump + 2, "happy"); ts();
        // arms wave HUGE V
        p(-3, 7 + jump, M); p(-4, 8 + jump, M); p(-5, 9 + jump, M);
        p(-6, 10 + jump, M); p(-7, 11 + jump, M);
        p(3, 7 + jump, M); p(4, 8 + jump, M); p(5, 9 + jump, M);
        p(6, 10 + jump, M); p(7, 11 + jump, M);
        // CONFETTI EXPLOSION — tons of colors
        p(-5 + S(1200, 7), 14 + C2(1000, 3), "rgba(255,60,100,0.48)");
        p(4 + C2(900, 6), 15 + S(800, 3), "rgba(60,200,255,0.45)");
        p(S(1400, 8), 13 + C2(1200, 3), "rgba(255,230,40,0.48)");
        p(-3 + C2(1100, 5), 16 + S(900, 2), "rgba(100,255,120,0.40)");
        p(6 + S(1600, 4), 14 + C2(1300, 2), "rgba(255,140,255,0.42)");
        p(-7 + S(1000, 6), 12 + C2(800, 2), "rgba(255,200,80,0.38)");
        // hearts float up
        drawHeart(-2 + S(2500, 3), 16 + C2(2000, 2));
        drawHeart(4 + C2(2200, 3), 17 + S(1800, 2));
      }
      break;
    }
    case 6: { // SELFIE QUEEN — dramatic poses cycle, hearts pop, flash burst
      const pose = S(1500, 3);
      const tilt = S(800, 2);
      hd(pose + tilt, 2, "happy"); ts(pose);
      // peace sign — BIG
      p(pose - 3, 7, M); p(pose - 4, 8, M);
      p(pose - 5, 9, M); p(pose - 4, 10, M); // V fingers spread
      p(pose - 3, 10, M);
      // phone arm swings around
      p(pose + 3, 5, M); p(pose + 4, 5 + tilt, M); p(pose + 5, 6 + tilt, M);
      h(pose + 5, 7 + tilt, 2, D); h(pose + 5, 8 + tilt, 2, D);
      h(pose + 5, 9 + tilt, 2, D); h(pose + 5, 10 + tilt, 2, D);
      p(pose + 6, 8 + tilt, "rgba(100,150,255,0.30)"); p(pose + 6, 9 + tilt, "rgba(100,150,255,0.25)");
      // FLASH — dramatic starburst
      if (S(2000, 1) > 0) {
        drawStar(pose + 5, 11 + tilt);
        p(pose + 4, 12 + tilt, "rgba(255,255,200,0.35)");
        p(pose + 7, 12 + tilt, "rgba(255,255,200,0.35)");
      }
      // hearts pop around
      drawHeart(pose - 6, 12 + S(1800, 1));
      break;
    }
    case 7: { // MEGA CHEF — food LAUNCHES to ceiling, fire pillar, catch
      const toss = S(500, 6);
      hd(-1, Math.abs(toss) > 3 ? 2 : 0, Math.abs(toss) > 4 ? "o" : "happy"); ts(-1);
      // pan with handle
      h(2, 1, 6, D); h(2, 0, 6, D); p(1, 0, D); p(0, 0, D);
      p(0, 2, M); p(0, 3, M);
      // food ROCKETS up
      const foodY = 3 + Math.abs(toss) * 2;
      h(4, foodY, 2, D); h(3, foodY + 1, 3, D); // tumbling pancake
      p(5, foodY, L); // flip motion blur
      // FIRE PILLAR when food is high
      if (Math.abs(toss) > 3) {
        v(4, 3, foodY - 3, "rgba(255,120,30,0.25)");
        p(3, foodY - 1, "rgba(255,180,40,0.45)"); p(5, foodY + 2, "rgba(255,220,60,0.40)");
        p(6, foodY + 1, "rgba(255,100,20,0.35)"); p(2, foodY, "rgba(255,200,50,0.30)");
        // sparks
        p(3 + S(300, 2), foodY + 3, star);
        p(6 + C2(400, 2), foodY + 2, star);
      }
      // constant sizzle
      p(5 + S(250, 1), 2, "rgba(255,200,100,0.30)");
      p(6 + C2(300, 1), 3, "rgba(255,200,100,0.25)");
      p(7, 2 + S(350, 1), "rgba(255,200,100,0.20)");
      break;
    }
    case 8: { // DOOM SCROLL — soul leaving body, notification storm
      const sink = S(2000, 2);
      const deep = Math.abs(sink);
      hd(0, -deep, deep > 1 ? "o" : "neutral"); ts();
      p(-3, 4, L); // L arm limp
      p(3, 4, M); p(3, 5, M); p(3, 6, M);
      // HUGE phone dominates
      h(2, 5, 3, D); h(2, 6, 3, D); h(2, 7, 3, D); h(2, 8, 3, D);
      h(2, 9, 3, D); h(2, 10, 3, D);
      // scroll content — FAST blur
      const sc = S(200, 3);
      p(3, 6 + Math.abs(sc), "rgba(100,150,255,0.38)");
      p(3, 7, "rgba(100,150,255,0.28)"); p(4, 8, "rgba(100,150,255,0.28)");
      p(3, 9, "rgba(100,150,255,0.20)");
      // screen glow on face — intense
      p(1, 7, "rgba(100,150,255,0.22)"); p(0, 7, "rgba(100,150,255,0.15)");
      p(-1, 7, "rgba(100,150,255,0.08)");
      // notification badges EXPLODE
      p(4, 10 + S(600, 1), "rgba(255,40,40,0.55)");
      p(2, 11 + C2(800, 1), "rgba(255,40,40,0.45)");
      if (deep > 1) p(5, 9 + S(500, 1), "rgba(255,40,40,0.35)");
      // soul leaving body (translucent ghost drifts up)
      if (deep > 1) {
        p(0, 10 + deep, "rgba(200,220,255,0.15)");
        p(0, 11 + deep, "rgba(200,220,255,0.10)");
        p(0, 12 + deep, "rgba(200,220,255,0.06)");
      }
      break;
    }
    case 9: { // PLANT EXPLOSION — instant mega bloom, petals fly everywhere
      bod(-4);
      // big pot
      h(3, 0, 4, D); h(2, 1, 6, D);
      // THICK stem shoots up
      v(4, 2, 6, "rgba(40,140,50,0.65)"); v(5, 2, 5, "rgba(40,140,50,0.55)");
      // leaves BURST outward
      const sway = S(600, 2);
      p(3 + sway, 5, "rgba(40,140,50,0.55)"); p(6 - sway, 5, "rgba(40,140,50,0.55)");
      p(2 + sway, 6, "rgba(40,140,50,0.50)"); p(7 - sway, 6, "rgba(40,140,50,0.50)");
      p(1 + sway, 7, "rgba(40,140,50,0.45)"); p(8 - sway, 7, "rgba(40,140,50,0.45)");
      p(0, 8, "rgba(40,140,50,0.40)"); p(9, 8, "rgba(40,140,50,0.40)");
      // MEGA bloom — huge flower
      const bl = S(1200, 2);
      h(3, 8 + Math.abs(bl), 3, "rgba(255,100,170,0.55)");
      h(2, 9 + Math.abs(bl), 5, "rgba(255,140,190,0.50)");
      h(3, 10 + Math.abs(bl), 3, "rgba(255,180,210,0.40)");
      // petals fly off
      p(-1 + S(1500, 5), 10 + C2(1200, 3), "rgba(255,150,200,0.40)");
      p(8 + C2(1300, 4), 11 + S(1100, 3), "rgba(255,180,220,0.35)");
      p(-3 + S(1800, 3), 12, "rgba(255,200,230,0.25)");
      // sparkles
      drawStar(5, 11 + Math.abs(bl));
      if (bull) drawHeart(-2, 10 + S(2000, 2));
      break;
    }
    case 10: { // PLOT TWIST — book explodes open, reader FLIES backward
      const gasp = S(1500, 4);
      const shock = Math.abs(gasp) > 2;
      hd(shock ? -2 : 0, shock ? 3 : 0, shock ? "o" : "neutral"); ts(shock ? -2 : 0);
      // arms — flung wide on shock
      if (shock) {
        p(-4, 5, M); p(-5, 6, M); p(-6, 7, M); p(-7, 8, M);
        p(2, 5, M); p(3, 6, M); p(4, 7, M); p(5, 8, M);
      } else {
        p(-3, 4, M); p(-3, 3, M); p(3, 4, M); p(3, 3, M);
      }
      // book — EXPLODES open on twist
      if (shock) {
        // pages flying everywhere
        p(-6 + S(600, 3), 8 + C2(500, 2), L);
        p(5 + C2(700, 3), 9 + S(600, 2), L);
        p(-4 + S(800, 2), 10 + C2(700, 1), L);
        p(3 + C2(900, 2), 7 + S(800, 2), L);
        // shock lines radiate
        p(-7, 10, L); p(7, 10, L); p(-8, 9, L); p(8, 9, L);
        p(-9, 8, L); p(9, 8, L);
        // "!!!" above head
        v(0, 12, 3, D); p(0, 15, M);
        v(2, 12, 3, D); p(2, 15, M);
      } else {
        h(-5, 3, 5, L); h(-5, 4, 5, L); h(1, 3, 5, L); h(1, 4, 5, L);
        p(0, 3, D); p(0, 4, D);
      }
      break;
    }
    case 11: { // TEA SPILL GOSSIP — two people LEAN in hard, tea splashes
      const b1 = S(700, 4), b2 = S(900, 4);
      const lx = -8, rx = 5;
      hd(lx + Math.max(b1, 0), b1, b1 > 2 ? "o" : "happy"); ts(lx + Math.max(b1, 0));
      hd(rx - Math.max(b2, 0), b2, b2 > 2 ? "o" : "happy"); ts(rx - Math.max(b2, 0));
      // arms gesture WILDLY
      p(lx + 4 + Math.abs(b1), 5 + Math.abs(b1), M);
      p(lx + 5 + Math.abs(b1), 6 + Math.abs(b1), M);
      p(rx - 3 - Math.abs(b2), 5 + Math.abs(b2), M);
      p(rx - 4 - Math.abs(b2), 6 + Math.abs(b2), M);
      // speech bubbles — BIG, animated
      if (b1 > 2) {
        h(lx + 3, 13, 4, L); h(lx + 4, 14, 3, L); p(lx + 5, 15, L);
        p(lx + 4, 13, D); p(lx + 5, 13, D); p(lx + 6, 13, D); // "!!!"
      }
      if (b2 > 2) {
        h(rx - 2, 13, 4, L); h(rx - 1, 14, 3, L); p(rx, 15, L);
        p(rx - 1, 13, D); p(rx, 13, D); p(rx + 1, 13, D);
      }
      // tea cup between them — SPILLING
      h(-1, 3, 3, D); h(-1, 4, 3, D); p(2, 3, D);
      if (Math.abs(b1) > 2 || Math.abs(b2) > 2) {
        p(-2, 3, "rgba(180,140,80,0.40)"); p(3, 3, "rgba(180,140,80,0.40)"); // spill
        p(-2, 2, "rgba(180,140,80,0.25)"); p(3, 2, "rgba(180,140,80,0.25)");
      }
      break;
    }
    case 12: { // ROCK CONCERT — INSANE head bang, guitar spin, crowd goes wild
      const rock = S(250, 5);
      const bang = S(180, 4);
      hd(rock, -Math.abs(bang) - 1, "happy"); ts(rock);
      // guitar swings WILDLY
      const gr = S(400, 3);
      h(rock - 5 + gr, 0, 5, D); h(rock - 6 + gr, 1, 7, D);
      h(rock - 6 + gr, 2, 7, D); h(rock - 5 + gr, 3, 5, D);
      p(rock - 8 + gr, 4, D); p(rock - 9 + gr, 5, D);
      p(rock - 10 + gr, 6, D); p(rock - 11 + gr, 7, D);
      // windmill strum — HUGE arc
      const strum = S(150, 5);
      p(rock + 3, 3 + strum, M); p(rock + 4, 2 + strum, M); p(rock + 5, 1 + strum, M);
      // notes EXPLODE in all directions
      p(7 + S(800, 7), 11 + C2(600, 3), "rgba(255,200,80,0.48)");
      p(-8 + C2(900, 6), 13 + S(700, 3), "rgba(255,100,200,0.45)");
      p(S(1100, 8), 12 + C2(900, 4), "rgba(80,220,255,0.40)");
      p(-5 + S(1300, 5), 14 + C2(1100, 2), "rgba(255,255,100,0.38)");
      p(4 + C2(700, 6), 15 + S(800, 2), "rgba(200,100,255,0.35)");
      // lightning bolt
      if (Math.abs(bang) > 3) {
        p(6, 14, star); p(5, 13, star); p(6, 12, star);
      }
      break;
    }
    case 13: { // DEEP SLEEP — snore bubble, drool river, earthquake Zzz
      h(-9, 3, 14, D); h(-9, 2, 14, D); // desk
      h(-8, 4, 13, M); // arms
      const br = S(2500, 2);
      // head — face planted, rises with snore
      h(-3, 5 + br, 7, D); h(-3, 6 + br, 7, D); h(-4, 7 + br, 9, D);
      h(-2, 5 + br, 5, M); p(0, 5 + br, L);
      // snore bubble — INFLATES and POPS
      const bubble = Math.abs(S(1800, 3));
      if (bubble > 0) {
        p(3, 6 + br, "rgba(200,220,255,0.25)");
        if (bubble > 1) { p(4, 7 + br, "rgba(200,220,255,0.20)"); p(3, 7 + br, "rgba(200,220,255,0.20)"); }
        if (bubble > 2) { p(5, 7 + br, "rgba(200,220,255,0.15)"); p(4, 8 + br, "rgba(200,220,255,0.15)"); }
      }
      // drool stream
      p(3, 4, "rgba(100,180,255,0.30)"); p(3, 3, "rgba(100,180,255,0.25)");
      p(3, 2 + S(1500, 1), "rgba(100,180,255,0.18)");
      // HUGE Zzz — stagger up and grow
      const z = S(1500, 3);
      p(5, 8 + z, D); p(6, 8 + z, D);
      h(7, 10 + z, 3, M); h(7, 11 + z, 3, M);
      h(9, 13 + z, 4, L); h(9, 14 + z, 4, L);
      break;
    }
    case 14: { // PAPER AIRPLANE ACE — wind up, THROW, loop-de-loop, catch!
      const phase = S(1000, 6);
      const winding = Math.max(-phase, 0);
      const thrown = Math.max(phase, 0);
      hd(-3, winding > 3 ? -2 : thrown > 3 ? 2 : 0, thrown > 2 ? "happy" : "neutral"); ts(-3);
      p(-6, 4, M);
      // throw arm — MASSIVE wind-up
      p(-1 - winding * 2, 5 + winding, M); p(-1 - winding * 2, 6 + winding, M);
      p(-1 - winding * 2, 7 + winding, M);
      // plane does LOOP-DE-LOOP
      const fx = -4 + thrown * 5;
      const fy = 10 + C2(800, 4);
      p(fx, fy, D); p(fx + 1, fy, D); p(fx + 2, fy, D);
      p(fx, fy + 1, M); p(fx + 1, fy + 1, M); p(fx - 1, fy + 1, M);
      p(fx + 2, fy + 1, L);
      // long dramatic trail with sparkles
      if (thrown > 0) {
        p(fx - 1, fy, L); p(fx - 2, fy + S(300, 1), L);
        p(fx - 3, fy + C2(400, 1), L); p(fx - 4, fy + S(500, 1), L);
        p(fx - 5, fy + C2(600, 1), L);
        if (thrown > 3) { drawStar(fx + 3, fy); }
      }
      break;
    }
    case 15: { // EXTREME LIFTING — barbell bends, floor cracks, body shakes
      const lift = S(800, 5);
      const effort = Math.abs(lift);
      const shake = effort > 2 ? S(60, 2) : 0;
      hd(shake, effort > 2 ? 2 : effort > 1 ? 1 : 0, effort > 3 ? "sad" : "neutral"); ts(shake);
      const ay = 6 + effort;
      v(shake - 3, 5, Math.max(ay - 4, 1), M); v(shake + 3, 5, Math.max(ay - 4, 1), M);
      // MASSIVE barbell — bends under weight
      h(-11, ay, 5, D); h(-11, ay + 1, 5, D); h(-11, ay - 1, 5, D); // L plates THICK
      h(7, ay, 5, D); h(7, ay + 1, 5, D); h(7, ay - 1, 5, D);       // R plates THICK
      // bar BENDS in middle
      const bend = effort > 2 ? 1 : 0;
      h(-6, ay - bend, 13, D);
      // sweat FLIES off
      p(shake + 5, 10 + S(300, 2), "rgba(100,200,255,0.40)");
      p(shake - 5, 9 + C2(350, 2), "rgba(100,200,255,0.38)");
      p(shake + 4, 11 + S(400, 1), "rgba(100,200,255,0.30)");
      // floor cracks
      if (effort > 3) {
        p(-2, -1, L); p(2, -1, L); p(0, -1, L);
        p(-3, -1, L); p(3, -1, L);
      }
      // face strain — veins
      if (effort > 2) { p(shake + 4, 9, "rgba(255,60,60,0.30)"); }
      break;
    }
    case 16: { // MAD PAINTER — paint FLIES everywhere, canvas covered
      const rage = S(350, 4);
      hd(-4 + rage, S(300, 2), Math.abs(rage) > 2 ? "o" : "happy"); ts(-4 + rage);
      // easel with MESSY canvas
      v(3, 0, 11, L); v(8, 0, 9, L);
      h(2, 3, 8, D); h(2, 4, 8, D); h(2, 5, 8, D); h(2, 6, 8, D);
      h(2, 7, 8, D); h(2, 8, 8, D); h(2, 9, 8, D); h(2, 10, 8, D);
      // wild brush arm — HUGE sweeps
      const bx = S(300, 5), by2 = C2(250, 3);
      p(-1 + rage, 4, M); p(0 + rage, 5, M); p(1 + bx, 6 + by2, M);
      p(2 + bx, 6 + by2, D);
      // paint splatters EVERYWHERE — chaotic
      p(3, 4, "rgba(255,40,40,0.38)"); p(5, 6, "rgba(40,100,255,0.38)");
      p(8, 4, "rgba(255,220,20,0.38)"); p(4, 8, "rgba(40,220,80,0.35)");
      p(7, 5, "rgba(255,80,200,0.35)"); p(3, 9, "rgba(160,60,255,0.32)");
      p(6, 7, "rgba(255,150,40,0.32)"); p(9, 6, "rgba(40,200,200,0.28)");
      // paint flies OFF canvas
      if (Math.abs(bx) > 2) {
        p(-2 + S(500, 3), 8 + C2(400, 2), "rgba(255,40,40,0.30)");
        p(11 + C2(600, 2), 7 + S(500, 2), "rgba(40,100,255,0.28)");
      }
      break;
    }
    case 17: { // DOG TORNADO — dog drags owner at FULL SPEED
      const pull = S(300, 5);
      // owner — FLYING horizontally behind dog
      const ox = -6 - Math.abs(pull);
      hd(ox, S(200, 2), "sad"); ts(ox);
      // arm STRETCHED to breaking point
      p(ox + 3, 4, M); p(ox + 4, 4, M); p(ox + 5, 3, M);
      p(ox + 6, 3, D); p(ox + 7, 3, D); p(ox + 8, 3, D); // leash
      // speed lines behind owner
      h(ox - 3, 4, 2, L); h(ox - 4, 3, 3, L); h(ox - 2, 5, 2, L);
      // DOG — full sprint, ears back
      const bound = Math.abs(S(200, 3));
      h(4, 2 + bound, 6, D); h(3, 1 + bound, 7, M); // HUGE body
      h(4, 3 + bound, 4, D); p(3, 4 + bound, D); p(2, 4 + bound, D); // head
      p(5, 3 + bound, "rgba(80,255,80,0.40)"); // crazy happy eye
      // tongue flapping
      p(2, 2 + bound, "rgba(255,100,130,0.45)"); p(1, 2 + bound, "rgba(255,100,130,0.35)");
      // legs BLUR
      p(3, 0, M); p(4, 0, M); p(7, 0, M); p(8, 0, M);
      p(3, 0 + S(200, 1), L); p(8, 0 + C2(200, 1), L);
      // tail — HELICOPTER spin
      p(9, 2 + bound + S(150, 3), D); p(10, 3 + bound + S(150, 3), D);
      p(11, 4 + bound + C2(150, 3), D);
      break;
    }
    case 18: { // RAMEN VACUUM — noodles FLY into mouth, broth splashes
      const slurp = S(400, 5);
      hd(0, S(300, 2), "o"); ts();
      // MASSIVE bowl
      h(-7, 2, 15, D); h(-6, 1, 13, D); h(-5, 0, 11, D);
      // steam ERUPTS
      p(-4 + S(800, 3), 4, M); p(-2 + C2(600, 3), 5, M);
      p(0 + S(700, 3), 6, L); p(2 + C2(900, 2), 4, L);
      p(4 + S(500, 2), 5, L);
      // chopsticks raise noodles to EXTREME height
      const nH = Math.abs(slurp);
      p(5, 3, M); p(5, 4 + nH, M); p(6, 4 + nH, M);
      // noodle strands — THICK, whipping around
      v(3, 3, nH + 2, "rgba(255,220,140,0.45)");
      v(4, 3, nH + 2, "rgba(255,220,140,0.40)");
      v(5, 3, nH + 1, "rgba(255,220,140,0.35)");
      v(6, 3, nH, "rgba(255,220,140,0.28)");
      // broth splashes up
      if (nH > 3) {
        p(-3, 4, "rgba(200,160,100,0.30)"); p(3, 4, "rgba(200,160,100,0.30)");
        p(-5, 3, "rgba(200,160,100,0.20)"); p(7, 3, "rgba(200,160,100,0.20)");
      }
      // toppings
      p(-4, 2, "rgba(80,200,80,0.35)"); p(0, 2, "rgba(255,200,80,0.35)");
      p(4, 2, "rgba(255,100,100,0.35)");
      // slurp effect lines near mouth
      if (nH > 2) { p(-1, 7, L); p(1, 7, L); }
      break;
    }
    case 19: { // GAMER MOMENT — rage flip table OR victory lap
      const rage = S(400, 4);
      if (bear) {
        // TABLE FLIP — monitor flies, controller explodes
        const flip = Math.abs(rage);
        hd(S(120, 2), -flip, "sad"); ts(S(120, 2));
        // flipping desk
        if (flip > 2) {
          // desk flies up
          h(-6, 5 + flip, 12, D);
          // monitor tumbles
          p(-5 + S(400, 3), 8 + flip + C2(300, 2), D);
          p(-4 + S(400, 3), 9 + flip + C2(300, 2), D);
          // keyboard flies
          p(3 + C2(500, 2), 7 + flip + S(400, 2), L);
        } else {
          h(-6, 3, 12, D); h(-6, 2, 12, D);
        }
        // anger marks
        p(5, 11, "rgba(255,40,40,0.45)"); p(6, 12, "rgba(255,40,40,0.45)");
        p(6, 11, "rgba(255,40,40,0.30)"); p(5, 12, "rgba(255,40,40,0.30)");
        p(-4, 11, "rgba(255,40,40,0.35)"); p(-3, 12, "rgba(255,40,40,0.35)");
      } else {
        // VICTORY LAP — leaps off chair, fist ROCKETS up
        const jump = Math.abs(S(300, 4));
        hd(0, jump + 3, "happy"); ts();
        // fist PUNCHES skyward
        p(3, 7 + jump, M); p(3, 8 + jump, M); p(3, 9 + jump, M);
        p(3, 10 + jump, D); p(4, 10 + jump, D);
        p(-3, 5, M); p(-3, 4, M);
        // screen shows WIN
        h(-8, 7, 5, D); h(-8, 8, 5, D); h(-8, 9, 5, D); h(-8, 10, 5, D); h(-8, 11, 5, D);
        p(-7, 9, "rgba(80,255,100,0.35)"); p(-6, 8, "rgba(80,255,100,0.30)");
        p(-5, 9, "rgba(80,255,100,0.30)");
        // victory sparkles EVERYWHERE
        drawStar(5, 13 + C2(600, 2));
        drawStar(-2, 14 + S(800, 2));
        drawHeart(7, 11 + S(1200, 2));
        p(-5, 12 + C2(500, 1), star); p(8, 10 + S(700, 1), star);
      }
      break;
    }
    default: break;
  }
  ctx.restore();
}

/* ── Floating reactions above windows — cute pixel emoji that bob ── */
function drawFloatingReaction(
  ctx: CanvasRenderingContext2D,
  wx: number, wy: number, winW: number,
  cellHash: number, ratio: number, now: number,
) {
  const u = 3; // smaller grid for tiny emoji
  const ph = ((cellHash & 0x7ff) / 2048) * Math.PI * 2;
  const bob = Math.round(Math.sin(now / 1200 + ph) * 3);
  const cx = Math.round(wx + winW * 0.5);
  const baseY = wy - 8 + bob; // float above window top

  const p = (gx: number, gy: number, c: string) => {
    ctx.fillStyle = c; ctx.fillRect(cx + gx * u, baseY - gy * u, u, u);
  };

  const bull = ratio > 0.6, bear = ratio < 0.4;
  const pick = (cellHash >> 3) % 6;

  if (bull) {
    switch (pick) {
      case 0: // mini heart
        p(-1, 2, "rgba(255,80,140,0.60)"); p(1, 2, "rgba(255,80,140,0.60)");
        p(-2, 1, "rgba(255,80,140,0.55)"); p(-1, 1, "rgba(255,80,140,0.55)");
        p(0, 1, "rgba(255,80,140,0.55)"); p(1, 1, "rgba(255,80,140,0.55)"); p(2, 1, "rgba(255,80,140,0.55)");
        p(-1, 0, "rgba(255,80,140,0.45)"); p(0, 0, "rgba(255,80,140,0.45)"); p(1, 0, "rgba(255,80,140,0.45)");
        p(0, -1, "rgba(255,80,140,0.35)");
        break;
      case 1: // star burst
        p(0, 2, "rgba(255,230,60,0.60)"); p(0, -1, "rgba(255,230,60,0.60)");
        p(-2, 1, "rgba(255,230,60,0.55)"); p(2, 1, "rgba(255,230,60,0.55)");
        p(-1, 1, "rgba(255,230,60,0.50)"); p(1, 1, "rgba(255,230,60,0.50)");
        p(0, 1, "rgba(255,230,60,0.65)"); p(0, 0, "rgba(255,230,60,0.65)");
        break;
      case 2: // sparkle ✦
        p(0, 2, "rgba(200,220,255,0.55)"); p(0, -1, "rgba(200,220,255,0.55)");
        p(-2, 1, "rgba(200,220,255,0.50)"); p(2, 1, "rgba(200,220,255,0.50)");
        p(0, 1, "rgba(255,255,255,0.60)"); p(0, 0, "rgba(255,255,255,0.60)");
        p(-1, 0, "rgba(200,220,255,0.30)"); p(1, 0, "rgba(200,220,255,0.30)");
        break;
      case 3: // smiley
        p(-1, 2, "rgba(255,220,60,0.55)"); p(0, 2, "rgba(255,220,60,0.55)"); p(1, 2, "rgba(255,220,60,0.55)");
        p(-2, 1, "rgba(255,220,60,0.55)"); p(-1, 1, "rgba(255,220,60,0.55)"); p(0, 1, "rgba(255,220,60,0.55)");
        p(1, 1, "rgba(255,220,60,0.55)"); p(2, 1, "rgba(255,220,60,0.55)");
        p(-1, 0, "rgba(255,220,60,0.55)"); p(0, 0, "rgba(255,220,60,0.55)"); p(1, 0, "rgba(255,220,60,0.55)");
        p(-1, 1, "rgba(40,30,10,0.50)"); p(1, 1, "rgba(40,30,10,0.50)"); // eyes
        p(0, 0, "rgba(40,30,10,0.40)"); // smile
        break;
      case 4: // thumbs up
        p(0, 3, "rgba(255,210,120,0.55)"); p(0, 2, "rgba(255,210,120,0.55)");
        p(0, 1, "rgba(255,210,120,0.50)"); p(-1, 1, "rgba(255,210,120,0.50)");
        p(1, 1, "rgba(255,210,120,0.50)"); p(-1, 0, "rgba(255,210,120,0.45)");
        p(0, 0, "rgba(255,210,120,0.45)"); p(1, 0, "rgba(255,210,120,0.45)");
        break;
      default: // party popper
        p(0, 2, "rgba(255,100,60,0.55)"); p(0, 1, "rgba(255,100,60,0.50)");
        p(-1, 0, "rgba(255,100,60,0.45)"); p(0, 0, "rgba(255,100,60,0.45)");
        p(-2, 3, "rgba(255,230,60,0.45)"); p(1, 3, "rgba(80,200,255,0.45)");
        p(-1, 3, "rgba(255,120,200,0.40)"); p(2, 2, "rgba(120,255,120,0.40)");
        break;
    }
  } else if (bear) {
    switch (pick) {
      case 0: // teardrop
        p(0, 2, "rgba(100,170,255,0.55)");
        p(-1, 1, "rgba(100,170,255,0.55)"); p(0, 1, "rgba(100,170,255,0.60)"); p(1, 1, "rgba(100,170,255,0.55)");
        p(-1, 0, "rgba(100,170,255,0.50)"); p(0, 0, "rgba(100,170,255,0.50)"); p(1, 0, "rgba(100,170,255,0.50)");
        p(0, -1, "rgba(100,170,255,0.40)");
        break;
      case 1: // storm cloud
        p(-1, 2, "rgba(80,80,120,0.50)"); p(0, 2, "rgba(80,80,120,0.50)"); p(1, 2, "rgba(80,80,120,0.50)");
        p(-2, 1, "rgba(80,80,120,0.45)"); p(-1, 1, "rgba(80,80,120,0.45)"); p(0, 1, "rgba(80,80,120,0.45)");
        p(1, 1, "rgba(80,80,120,0.45)"); p(2, 1, "rgba(80,80,120,0.45)");
        p(0, 0, "rgba(255,230,60,0.40)"); p(1, -1, "rgba(255,230,60,0.35)"); // lightning
        break;
      case 2: // broken heart
        p(-1, 2, "rgba(180,60,100,0.55)"); p(1, 2, "rgba(180,60,100,0.55)");
        p(-1, 1, "rgba(180,60,100,0.50)"); p(1, 1, "rgba(180,60,100,0.50)");
        p(-1, 0, "rgba(180,60,100,0.45)"); p(1, 0, "rgba(180,60,100,0.45)");
        p(0, -1, "rgba(180,60,100,0.35)");
        p(0, 1, "rgba(20,10,30,0.40)"); // crack
        break;
      case 3: // swirl
        p(0, 2, "rgba(160,140,200,0.50)"); p(1, 1, "rgba(160,140,200,0.45)");
        p(0, 0, "rgba(160,140,200,0.40)"); p(-1, 1, "rgba(160,140,200,0.45)");
        p(-1, 0, "rgba(160,140,200,0.35)"); p(1, 0, "rgba(160,140,200,0.35)");
        break;
      case 4: // SOS
        p(-2, 1, "rgba(255,60,60,0.55)"); p(-1, 1, "rgba(255,60,60,0.50)");
        p(0, 1, "rgba(255,60,60,0.55)"); p(1, 1, "rgba(255,60,60,0.50)");
        p(2, 1, "rgba(255,60,60,0.55)");
        break;
      default: // lightning bolt
        p(0, 3, "rgba(255,230,60,0.55)"); p(-1, 2, "rgba(255,230,60,0.55)");
        p(0, 2, "rgba(255,230,60,0.60)"); p(1, 1, "rgba(255,230,60,0.55)");
        p(0, 1, "rgba(255,230,60,0.50)"); p(-1, 0, "rgba(255,230,60,0.45)");
        break;
    }
  } else {
    switch (pick) {
      case 0: // music note ♪
        p(0, 3, "rgba(200,180,255,0.55)"); p(1, 3, "rgba(200,180,255,0.50)");
        p(1, 2, "rgba(200,180,255,0.45)"); p(1, 1, "rgba(200,180,255,0.45)");
        p(1, 0, "rgba(200,180,255,0.40)"); p(0, 0, "rgba(200,180,255,0.40)");
        break;
      case 1: // zzz
        p(-1, 2, "rgba(180,200,255,0.50)"); p(0, 2, "rgba(180,200,255,0.50)");
        p(0, 1, "rgba(180,200,255,0.40)");
        p(1, 0, "rgba(180,200,255,0.35)"); p(2, 0, "rgba(180,200,255,0.35)");
        break;
      case 2: // mini coffee
        p(-1, 1, "rgba(180,140,100,0.50)"); p(0, 1, "rgba(180,140,100,0.50)");
        p(-1, 0, "rgba(180,140,100,0.45)"); p(0, 0, "rgba(180,140,100,0.45)");
        p(1, 0, "rgba(180,140,100,0.40)"); // handle
        p(0, 2, "rgba(200,200,200,0.30)"); // steam
        break;
      case 3: // dot dot dot
        p(-1, 1, "rgba(180,180,200,0.45)"); p(0, 1, "rgba(180,180,200,0.50)"); p(1, 1, "rgba(180,180,200,0.45)");
        break;
      case 4: // cat face
        p(-2, 2, "rgba(200,180,150,0.50)"); p(2, 2, "rgba(200,180,150,0.50)"); // ears
        p(-1, 1, "rgba(200,180,150,0.50)"); p(0, 1, "rgba(200,180,150,0.50)"); p(1, 1, "rgba(200,180,150,0.50)");
        p(-1, 0, "rgba(200,180,150,0.45)"); p(0, 0, "rgba(200,180,150,0.45)"); p(1, 0, "rgba(200,180,150,0.45)");
        p(-1, 1, "rgba(40,30,20,0.40)"); p(1, 1, "rgba(40,30,20,0.40)"); // eyes
        break;
      default: // flower
        p(0, 2, "rgba(255,160,200,0.50)"); p(-1, 1, "rgba(255,160,200,0.45)"); p(1, 1, "rgba(255,160,200,0.45)");
        p(0, 1, "rgba(255,220,80,0.50)"); // center
        p(0, 0, "rgba(80,160,60,0.40)"); p(0, -1, "rgba(80,160,60,0.35)"); // stem
        break;
    }
  }
}

/* ── Scene descriptions for tooltip ── */
const SCENE_NAMES: string[] = [
  "⌨️ Typing furiously",
  "🐱 Cat zoomies!",
  "🙆 Big stretch & yawn",
  "☕ Coffee overdose",
  "💃 Rave dancing",
  "🎉 Mood check",
  "🤳 Selfie time!",
  "🍳 Chef flambé",
  "📱 Doom scrolling",
  "🌱 Plant parent",
  "📖 Plot twist!",
  "🫖 Gossip hour",
  "🎸 Rock concert",
  "😴 Deep sleep",
  "✈️ Paper airplane",
  "🏋️ Powerlifting",
  "🎨 Mad painter",
  "🐕 Dog tornado",
  "🍜 Ramen slurp",
  "🎮 Gamer moment",
];

/* ── Educational content system ── */
function getSentimentLabel(ratio: number): { emoji: string; label: string; color: string } {
  if (ratio > 0.8) return { emoji: "🚀", label: "Extremely Bullish", color: "#00ff88" };
  if (ratio > 0.65) return { emoji: "😊", label: "Bullish", color: "#44dd88" };
  if (ratio > 0.55) return { emoji: "🙂", label: "Slightly Bullish", color: "#88cc88" };
  if (ratio >= 0.45) return { emoji: "😐", label: "Neutral", color: "#aaaacc" };
  if (ratio >= 0.35) return { emoji: "😟", label: "Slightly Bearish", color: "#cc8888" };
  if (ratio >= 0.2) return { emoji: "😰", label: "Bearish", color: "#dd6666" };
  return { emoji: "💀", label: "Extremely Bearish", color: "#ff3366" };
}

function getDaysToExpiry(expiry: string): number {
  const [m, d] = expiry.split("/").map(Number);
  const exp = new Date(2025, m - 1, d);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((exp.getTime() - now.getTime()) / 86400000));
}

function getTimeCategory(days: number): string {
  if (days <= 2) return "Expiring NOW — extreme time decay, high risk/reward";
  if (days <= 7) return "Weekly — fast-moving, popular with day traders";
  if (days <= 21) return "Short-term — moderate time decay, swing trade range";
  if (days <= 45) return "Medium-term — balanced risk, common for earnings plays";
  return "LEAPS — long-dated, lower time decay, more strategic";
}

function getPremiumInsight(total: number, callPrem: number, putPrem: number): string {
  const diff = Math.abs(callPrem - putPrem);
  const totalK = total / 1000;
  if (totalK > 500) return "Massive premium flow — institutional-level activity, big money is moving";
  if (totalK > 100) return "Heavy flow — significant trader interest, above average volume";
  if (totalK > 20) return "Moderate flow — normal retail + institutional mix";
  if (totalK > 5) return "Light flow — limited activity, low conviction";
  if (diff / total > 0.8) return "Extremely one-sided — almost all premium on one side";
  return "Minimal flow — very quiet, may lack liquidity";
}

function getStrategyHint(ratio: number, days: number, total: number): string {
  if (days <= 2 && ratio > 0.7) return "💡 Aggressive call buying near expiry often means traders expect a catalyst (earnings, news)";
  if (days <= 2 && ratio < 0.3) return "💡 Heavy puts near expiry = hedging or expecting imminent bad news";
  if (days > 30 && ratio > 0.6) return "💡 Bullish LEAPS = long-term conviction. Traders expect sustained uptrend";
  if (days > 30 && ratio < 0.4) return "💡 Long-dated puts = portfolio insurance or structural bearish thesis";
  if (total > 200000 && Math.abs(ratio - 0.5) < 0.1) return "💡 Balanced heavy flow may indicate straddle/strangle — expecting big move, direction unclear";
  if (ratio > 0.8) return "💡 One-sided call flow can signal euphoria — or smart money front-running a catalyst";
  if (ratio < 0.2) return "💡 Extreme put skew — could be panic hedging or someone knows something";
  return "💡 Watch how this flow evolves — follow the premium, not the noise";
}

const OPTION_GLOSSARY: Record<string, string> = {
  "Call": "A contract giving the right to BUY a stock at a set price. Profit when stock goes UP",
  "Put": "A contract giving the right to SELL a stock at a set price. Profit when stock goes DOWN",
  "Premium": "The price paid to buy an option. Total $ flowing into calls or puts",
  "Expiry": "Date when the option contract expires. After this, it's worthless if not exercised",
  "Ratio": "Call premium / total premium. >50% = more bullish bets, <50% = more bearish bets",
  "Flow": "Real-time options transactions. Shows where traders are putting their money RIGHT NOW",
};

function getRandomGlossary(hash: number): [string, string] {
  const keys = Object.keys(OPTION_GLOSSARY);
  const key = keys[hash % keys.length];
  return [key, OPTION_GLOSSARY[key]];
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
  const [hovered, setHovered] = useState<{ cell: CellData; x: number; y: number; sceneId: number } | null>(null);

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

      // Lofi life scene — drawn BEFORE muntins so frame covers figure
      if (cell.total > 0) {
        const sceneId = (r * 7 + c * 11) % 20;
        drawWindowScene(ctx, wx, wy, winW, winH, sceneId, cell.ratio, bri, now);
      }

      // Muntin bars (drawn on top → window frame effect)
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

      // Floating reaction emoji above window
      if (cell.total > 0) {
        const cellHash = Math.round(wx * 7.3 + wy * 13.7);
        drawFloatingReaction(ctx, wx, wy, winW, cellHash, cell.ratio, now);
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
      if (cell) { setHovered({ cell, x: e.clientX - r.left, y: e.clientY - r.top, sceneId: (row * 7 + col * 11) % 20 }); return; }
    }
    setHovered(null);
  }, [cells, sortedTickers, ROWS]);

  useEffect(() => {
    if (vizCanvasRef && canvasRef.current)
      (vizCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = canvasRef.current;
  }, [vizCanvasRef]);

  return (
    <PixelCard ref={containerRef} title="MONEY TOWER" titleIcon="🏢" titleColor={C.accent} style={{ display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", minHeight: 0, minWidth: 0 }}>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", flex: 1, minHeight: 0, display: "block", cursor: "crosshair" }}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHovered(null)}
      />
      {hovered && hovered.cell.total > 0 && (() => {
        const { cell, sceneId } = hovered;
        const rPct = Math.round(cell.ratio * 100);
        const sent = getSentimentLabel(cell.ratio);
        const days = getDaysToExpiry(cell.expiry);
        const timeCat = getTimeCategory(days);
        const premInsight = getPremiumInsight(cell.total, cell.callPrem, cell.putPrem);
        const strategy = getStrategyHint(cell.ratio, days, cell.total);
        const [glossaryTerm, glossaryDef] = getRandomGlossary(sceneId);
        const cpRatio = cell.putPrem > 0 ? (cell.callPrem / cell.putPrem).toFixed(2) : "N/A";
        const sS = { fontSize: 14, color: "#9990bb", whiteSpace: "normal" as const, lineHeight: 1.5 };
        const hS = { fontSize: 11, fontFamily: FONTS.display, color: C.accent, letterSpacing: 1, marginTop: 10, marginBottom: 5, textShadow: `0 0 6px ${C.accent}` };
        const pixClip = "polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px))";
        const dot = (t: string, l: string) => <div style={{ position: "absolute" as const, [t.startsWith("b") ? "bottom" : "top"]: 6, [l.startsWith("r") ? "right" : "left"]: 6, width: 3, height: 3, background: `${C.accent}30` }} />;
        const divider = <div style={{ height: 3, background: `linear-gradient(90deg, ${C.accent}00, ${C.accent}25, ${C.accent}00)`, margin: "8px 0" }} />;
        return (
        <div style={{
          position: "absolute",
          left: Math.min(hovered.x + 16, (containerRef.current?.clientWidth || 400) - 440),
          top: Math.max(hovered.y - 240, 8),
          zIndex: 10,
          background: C.panel,
          border: `3px solid ${C.accent}`,
          clipPath: pixClip,
          boxShadow: `0 0 18px ${C.accent}20, inset 0 0 40px ${C.accent}08`,
          fontFamily: FONTS.mono, color: C.text,
          pointerEvents: "none",
          width: 420,
          imageRendering: "pixelated",
        }}>
          {/* Corner dots */}
          {dot("top","left")}{dot("top","right")}{dot("bottom","left")}{dot("bottom","right")}

          {/* Title bar — matches PixelCard */}
          <div style={{
            padding: "9px 14px",
            background: `linear-gradient(90deg, ${C.pink}18, ${C.accent}18, ${C.violet}14)`,
            borderBottom: `3px solid ${C.accent}40`,
            fontFamily: FONTS.display, fontSize: 13, letterSpacing: 1,
            color: C.accent, textShadow: `0 0 8px ${C.accent}`,
          }}>
            🏢 {cell.ticker} · {cell.expiry} <span className="pixel-sparkle" style={{ opacity: 0.5 }}>~</span>
          </div>

          {/* Body */}
          <div style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 15, color: C.text, marginBottom: 3 }}>
              {SCENE_NAMES[sceneId] || "🏠 Living their life"}
            </div>
            <div style={{ fontSize: 14, color: C.dim }}>
              {days === 0 ? "⚡ Expires today!" : `⏳ ${days} day${days > 1 ? "s" : ""} to expiry`}
            </div>

            {divider}

            {/* Premium flow */}
            <div style={hS}>PREMIUM FLOW</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
              <span style={{ color: C.call, textShadow: `0 0 6px ${C.call}` }}>📈 Calls: {fmt(cell.callPrem)}</span>
              <span style={{ color: C.put, textShadow: `0 0 6px ${C.put}` }}>📉 Puts: {fmt(cell.putPrem)}</span>
            </div>
            <div style={{ fontSize: 14, color: C.dim, marginTop: 3 }}>
              Total: {fmt(cell.total)} · C/P Ratio: {cpRatio}
            </div>
            <div style={{ ...sS, marginTop: 4 }}>{premInsight}</div>

            {divider}

            {/* Sentiment gauge */}
            <div style={hS}>MARKET SENTIMENT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <div style={{ flex: 1, height: 8, background: "#0f0e17", overflow: "hidden", display: "flex", border: `1px solid ${C.accent}30` }}>
                <div style={{ width: `${rPct}%`, background: C.call }} />
                <div style={{ width: `${100 - rPct}%`, background: C.put }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 15, color: sent.color, textShadow: `0 0 6px ${sent.color}` }}>{sent.emoji} {sent.label}</span>
              <span style={{ fontSize: 14, color: sent.color }}>{rPct}% bullish</span>
            </div>
            <div style={{ ...sS, marginTop: 4 }}>
              {rPct > 70 ? `Strong call dominance on ${cell.ticker} — traders are paying premium to bet on upside before ${cell.expiry}`
                : rPct > 55 ? `More money flowing into calls than puts — mild bullish tilt on ${cell.ticker}`
                : rPct >= 45 ? `Nearly equal call/put flow — market is undecided on ${cell.ticker}'s direction by ${cell.expiry}`
                : rPct >= 30 ? `Put-heavy flow on ${cell.ticker} — traders buying downside protection for ${cell.expiry}`
                : `Extreme put buying on ${cell.ticker} — either panic hedging or directional bearish bet before ${cell.expiry}`}
            </div>

            {divider}

            {/* Time analysis */}
            <div style={hS}>EXPIRY ANALYSIS</div>
            <div style={sS}>{timeCat}</div>
            <div style={{ ...sS, marginTop: 3 }}>
              {days <= 7
                ? "Options lose value fastest in the final week. Buyers need the move to happen NOW"
                : days <= 30
                ? "Moderate time decay — still time for the trade to work, but the clock is ticking"
                : "Plenty of time value left — these positions reflect longer-term conviction"}
            </div>

            {divider}

            {/* Strategy hint */}
            <div style={hS}>WHAT DOES THIS MEAN?</div>
            <div style={{ ...sS, color: "#aabbdd" }}>{strategy}</div>

            {divider}

            {/* Glossary */}
            <div style={{ marginTop: 2 }}>
              <span style={{ fontSize: 11, color: C.accent, fontFamily: FONTS.display, letterSpacing: 1 }}>📚 {glossaryTerm}</span>
              <div style={{ ...sS, marginTop: 2 }}>{glossaryDef}</div>
            </div>
          </div>
        </div>
        );
      })()}
    </PixelCard>
  );
}
