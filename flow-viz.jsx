import { useState, useEffect, useRef, useCallback } from "react";

// ─── DATA SIMULATION ───────────────────────────────────────────────────────
const TICKERS = ["NVDA","SPY","AAPL","TSLA","META","QQQ","AMD","MSFT","GOOGL","TSM"];
const BASE = { NVDA:875, SPY:542, AAPL:195, TSLA:248, META:512, QQQ:468, AMD:178, MSFT:418, GOOGL:175, TSM:165 };
const EXPIRIES = ["03/21","03/28","04/04","04/17","05/16","06/20"];

let uid = 0;
function gen() {
  const tk = TICKERS[~~(Math.random() * TICKERS.length)];
  const type = Math.random() > 0.47 ? "CALL" : "PUT";
  const bp = BASE[tk];
  const strike = Math.round(bp * (0.86 + Math.random() * 0.28) / 5) * 5;
  const vol = ~~(Math.random() * 9500) + 80;
  const prem = +(Math.random() * 52 + 0.4).toFixed(2);
  const total = vol * prem * 100;
  const exp = EXPIRIES[~~(Math.random() * EXPIRIES.length)];
  return {
    id: uid++, tk, type, strike, vol, prem, total, exp,
    moneyness: strike / bp,
    isBlock: total > 1.8e6,
    isSweep: vol > 5200,
    time: new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit" })
  };
}

const fmt = n => n >= 1e6 ? `$${(n/1e6).toFixed(2)}M` : `$${(n/1e3).toFixed(0)}K`;

// ─── PALETTE ───────────────────────────────────────────────────────────────
const C = {
  bg: "#050c14",
  panel: "rgba(6,14,24,0.92)",
  border: "rgba(0,190,230,0.14)",
  call: "#00e87a",
  put: "#ff2d5a",
  accent: "#00c8f0",
  gold: "#f0b040",
  violet: "#b060ff",
  dim: "#3a5a70",
  text: "#a8c4d4",
  bright: "#d8ecf4",
};

// ─── COMPONENT ─────────────────────────────────────────────────────────────
export default function FlowViz() {
  const [trades, setTrades] = useState(() => Array.from({ length: 35 }, gen));
  const [filter, setFilter] = useState("ALL");
  const [msgs, setMsgs] = useState([{
    r: "ai",
    t: "Flow intelligence online. I'm reading the tape in real-time — ask me about unusual positioning, what the smart money's doing, or any ticker you want to dig into."
  }]);
  const [inp, setInp] = useState("");
  const [aiLoad, setAiLoad] = useState(false);

  const bgRef    = useRef(null);
  const vizRef   = useRef(null);
  const rafRef   = useRef(null);
  const ptsRef   = useRef([]);
  const chatRef  = useRef(null);
  const tradesRef = useRef(trades);
  tradesRef.current = trades;

  // ── CSS injection ──────────────────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&display=swap');
      * { box-sizing: border-box; }
      @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
      @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.25} }
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes pulse { 0%,100%{box-shadow:0 0 4px rgba(0,200,240,0.4)} 50%{box-shadow:0 0 14px rgba(0,200,240,0.9)} }
      .new-trade { animation: slideDown 0.3s cubic-bezier(0.16,1,0.3,1) forwards; }
      .blink { animation: blink 1.4s ease-in-out infinite; }
      .pulsedot { animation: pulse 2s ease-in-out infinite; }
      .msg-in { animation: fadeIn 0.25s ease forwards; }
      ::-webkit-scrollbar { width: 3px; }
      ::-webkit-scrollbar-thumb { background: rgba(0,190,230,0.22); border-radius: 2px; }
      ::-webkit-scrollbar-track { background: transparent; }
      input::placeholder { color: rgba(58,90,112,0.8); }
    `;
    document.head.appendChild(s);
    return () => s.remove();
  }, []);

  // ── Background particle network ─────────────────────────────────────────
  useEffect(() => {
    const canvas = bgRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);

    ptsRef.current = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00025,
      vy: (Math.random() - 0.5) * 0.00025,
      r: Math.random() * 1.4 + 0.4,
      hue: Math.random() > 0.7 ? 340 : 190
    }));

    function draw() {
      const { width: w, height: h } = canvas;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);
      const pts = ptsRef.current;
      pts.forEach(p => {
        p.x = (p.x + p.vx + 1) % 1;
        p.y = (p.y + p.vy + 1) % 1;
      });
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = (pts[i].x - pts[j].x) * w;
          const dy = (pts[i].y - pts[j].y) * h;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(${pts[i].hue}, 80%, 65%, ${(1 - d / 110) * 0.1})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(pts[i].x * w, pts[i].y * h);
            ctx.lineTo(pts[j].x * w, pts[j].y * h);
            ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, 0.45)`;
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize", resize); };
  }, []);

  // ── Options bubble visualization ─────────────────────────────────────────
  const drawViz = useCallback(() => {
    const canvas = vizRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.offsetWidth || 400;
    const h = canvas.offsetHeight || 300;
    canvas.width = w; canvas.height = h;

    const pad = { l: 48, r: 18, t: 18, b: 36 };
    const fw = w - pad.l - pad.r;
    const fh = h - pad.t - pad.b;
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(0,190,230,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const x = pad.l + (i / 8) * fw;
      ctx.beginPath(); ctx.moveTo(x, pad.t); ctx.lineTo(x, h - pad.b); ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const y = pad.t + (i / 5) * fh;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
    }

    // Axis: ATM line
    const atmX = pad.l + ((1.0 - 0.85) / 0.30) * fw;
    if (atmX > pad.l && atmX < w - pad.r) {
      ctx.strokeStyle = "rgba(0,190,230,0.2)";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(atmX, pad.t); ctx.lineTo(atmX, h - pad.b); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Y labels (expiry)
    ctx.font = "10px DM Mono";
    ctx.fillStyle = "rgba(0,190,230,0.45)";
    ctx.textAlign = "right";
    EXPIRIES.forEach((exp, i) => {
      const y = pad.t + (i / (EXPIRIES.length - 1)) * fh;
      ctx.fillText(exp, pad.l - 6, y + 3.5);
    });

    // X axis label
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,190,230,0.3)";
    ctx.font = "9px DM Mono";
    ctx.fillText("← ITM   ATM   OTM →", pad.l + fw / 2, h - 6);

    const tds = tradesRef.current;
    const maxTotal = Math.max(...tds.map(t => t.total), 1);

    // Sort: small first so big ones render on top
    const sorted = [...tds].sort((a, b) => a.total - b.total);

    sorted.forEach(t => {
      const rawX = pad.l + ((t.moneyness - 0.85) / 0.30) * fw;
      const x = Math.max(pad.l + 5, Math.min(w - pad.r - 5, rawX));
      const ei = EXPIRIES.indexOf(t.exp);
      const y = pad.t + (ei / (EXPIRIES.length - 1)) * fh;
      const r = 4 + (t.total / maxTotal) * 32;
      const isHot = t.isBlock || t.isSweep;
      const [cr, cg, cb] = t.type === "CALL" ? [0, 232, 122] : [255, 45, 90];

      ctx.shadowBlur = isHot ? 28 : 10;
      ctx.shadowColor = `rgba(${cr},${cg},${cb},0.7)`;

      // Outer glow ring for hot trades
      if (isHot) {
        ctx.beginPath();
        ctx.arc(x, y, r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.15)`;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      // Fill
      const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      grad.addColorStop(0, `rgba(${cr},${cg},${cb},${isHot ? 0.55 : 0.3})`);
      grad.addColorStop(1, `rgba(${cr},${cg},${cb},${isHot ? 0.15 : 0.06})`);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Stroke
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${isHot ? 0.9 : 0.55})`;
      ctx.lineWidth = isHot ? 1.8 : 1;
      ctx.stroke();

      // Ticker label for notable trades
      if (isHot && r > 10) {
        ctx.shadowBlur = 0;
        ctx.font = `bold 9px DM Mono`;
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.95)`;
        ctx.textAlign = "center";
        ctx.fillText(t.tk, x, y - r - 4);
      }
    });
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => { drawViz(); }, [trades, drawViz]);

  useEffect(() => {
    const handleResize = () => drawViz();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawViz]);

  // ── Simulate live stream ─────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setTrades(prev => [gen(), ...prev.slice(0, 59)]);
    }, 1100 + Math.random() * 900);
    return () => clearInterval(id);
  }, []);

  // ── Chat auto-scroll ─────────────────────────────────────────────────────
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs]);

  // ── AI analysis ──────────────────────────────────────────────────────────
  const askAI = async () => {
    if (!inp.trim() || aiLoad) return;
    const q = inp.trim();
    setInp("");
    setMsgs(p => [...p, { r: "user", t: q }]);
    setAiLoad(true);

    const context = tradesRef.current.slice(0, 20).map(t =>
      `${t.tk} ${t.type} $${t.strike} exp:${t.exp} vol:${t.vol.toLocaleString()} prem:$${t.prem} total:${fmt(t.total)}${t.isBlock ? " [BLOCK]" : ""}${t.isSweep ? " [SWEEP]" : ""}`
    ).join("\n");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a razor-sharp options flow analyst at a prop trading desk. You read unusual options activity and institutional positioning. You speak like an experienced trader — terse, direct, no fluff.

Live flow data (most recent 20 trades):
${context}

Rules:
- Max 3 sentences unless user asks for deep analysis
- Use trader language (delta, premium, sweep, block, pin risk, etc.)
- Highlight the most significant signals
- Never say "I notice" or "It seems" — state facts
- If asked about a specific ticker, focus on that ticker's flow`,
          messages: [{ role: "user", content: q }]
        })
      });
      const data = await res.json();
      setMsgs(p => [...p, { r: "ai", t: data.content?.[0]?.text || "Signal lost." }]);
    } catch {
      setMsgs(p => [...p, { r: "ai", t: "Connection error. Check API." }]);
    }
    setAiLoad(false);
  };

  // ── Derived stats ─────────────────────────────────────────────────────────
  const recent = trades.slice(0, 30);
  const totalPrem = recent.reduce((s, t) => s + t.total, 0);
  const callRatio = recent.filter(t => t.type === "CALL").length / recent.length;
  const blocks = recent.filter(t => t.isBlock).length;
  const sweeps = recent.filter(t => t.isSweep).length;
  const filtered = filter === "ALL" ? trades : trades.filter(t => t.type === filter);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position:"relative", width:"100%", height:"100vh", overflow:"hidden", background:C.bg, color:C.text, fontFamily:"'DM Mono', monospace" }}>
      {/* Background canvas */}
      <canvas ref={bgRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%", zIndex:0 }} />

      {/* Main UI */}
      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", height:"100%" }}>

        {/* ── HEADER ── */}
        <div style={{ display:"flex", alignItems:"center", gap:14, padding:"9px 16px", borderBottom:`1px solid ${C.border}`, background:"rgba(5,12,20,0.88)", backdropFilter:"blur(16px)" }}>
          <div style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:22, fontWeight:700, letterSpacing:3, color:C.accent }}>
            FLOW//
          </div>
          <div style={{ width:1, height:22, background:C.border }} />
          <div className="pulsedot" style={{ width:7, height:7, borderRadius:"50%", background:"#00e87a" }} />
          <span style={{ fontSize:9, color:C.dim, letterSpacing:2 }}>LIVE</span>
          <span style={{ fontSize:10, color:"rgba(58,90,112,0.6)" }}>{new Date().toLocaleTimeString()}</span>

          <div style={{ flex:1 }} />

          {/* Stats */}
          {[
            { label:"PREMIUM 30m", val:fmt(totalPrem), color:"0,190,230" },
            { label:"SENTIMENT", val: callRatio > 0.5 ? "▲ BULLISH" : "▼ BEARISH", color: callRatio > 0.5 ? "0,232,122" : "255,45,90" },
            { label:"BLOCKS", val:blocks, color:"240,176,64" },
            { label:"SWEEPS", val:sweeps, color:"176,96,255" },
          ].map(s => (
            <div key={s.label} style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"3px 14px", borderRadius:4, border:`1px solid rgba(${s.color},0.25)`, background:`rgba(${s.color},0.05)` }}>
              <span style={{ fontSize:9, color:C.dim, letterSpacing:1 }}>{s.label}</span>
              <span style={{ fontSize:15, fontWeight:500, color:`rgb(${s.color})` }}>{s.val}</span>
            </div>
          ))}

          {/* C/P bar */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginLeft:6 }}>
            <span style={{ fontSize:9, color:C.dim }}>C/P</span>
            <div style={{ width:72, height:5, borderRadius:3, background:"rgba(255,45,90,0.35)", overflow:"hidden" }}>
              <div style={{ width:`${callRatio * 100}%`, height:"100%", background:C.call, borderRadius:3, transition:"width 0.6s ease" }} />
            </div>
            <span style={{ fontSize:9, color:C.dim }}>{(callRatio * 100).toFixed(0)}%</span>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

          {/* ── LEFT: Flow Feed ── */}
          <div style={{ width:228, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", background:"rgba(5,12,20,0.65)", backdropFilter:"blur(10px)" }}>
            <div style={{ padding:"7px 10px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:9, letterSpacing:2, color:C.dim }}>TAPE</span>
              <div style={{ flex:1 }} />
              {["ALL", "CALL", "PUT"].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding:"2px 7px", fontSize:9, border:`1px solid ${filter===f ? (f==="CALL" ? C.call : f==="PUT" ? C.put : C.accent) : "transparent"}`,
                  borderRadius:2, background:"transparent", color: filter===f ? (f==="CALL" ? C.call : f==="PUT" ? C.put : C.accent) : C.dim,
                  cursor:"pointer", fontFamily:"'DM Mono', monospace"
                }}>{f}</button>
              ))}
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"3px 0" }}>
              {filtered.slice(0, 45).map((t, i) => (
                <div key={t.id} className={i === 0 ? "new-trade" : ""} style={{
                  padding:"5px 9px", margin:"2px 5px",
                  borderLeft:`2px solid ${t.type === "CALL" ? C.call : C.put}`,
                  background:`rgba(${t.type==="CALL"?"0,232,122":"255,45,90"},0.035)`,
                  borderRadius:"0 3px 3px 0"
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, fontWeight:500, color:C.bright }}>{t.tk}</span>
                    <span style={{ fontSize:10, color: t.type==="CALL" ? C.call : C.put, letterSpacing:0.5 }}>{t.type}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:1 }}>
                    <span style={{ fontSize:10, color:C.dim }}>${t.strike} · {t.exp}</span>
                    <span style={{ fontSize:10, color:C.text }}>{fmt(t.total)}</span>
                  </div>
                  {(t.isBlock || t.isSweep) && (
                    <div style={{ marginTop:3, display:"flex", gap:3 }}>
                      {t.isBlock && <span style={{ fontSize:8, padding:"1px 4px", borderRadius:2, background:"rgba(240,176,64,0.12)", border:"1px solid rgba(240,176,64,0.4)", color:C.gold }}>BLOCK</span>}
                      {t.isSweep && <span style={{ fontSize:8, padding:"1px 4px", borderRadius:2, background:"rgba(176,96,255,0.12)", border:"1px solid rgba(176,96,255,0.4)", color:C.violet }}>SWEEP</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── CENTER: Visualization ── */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", padding:10, gap:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontSize:9, letterSpacing:2, color:C.dim }}>OPTIONS MAP</span>
              <div style={{ flex:1, height:1, background:C.border }} />
              <span style={{ fontSize:9, color:C.dim }}>SIZE = PREMIUM  ·  COLOR = TYPE  ·  Y = EXPIRY  ·  X = MONEYNESS</span>
            </div>
            <div style={{ flex:1, borderRadius:6, border:`1px solid ${C.border}`, background:"rgba(6,14,24,0.7)", backdropFilter:"blur(8px)", position:"relative", overflow:"hidden" }}>
              <canvas ref={vizRef} style={{ width:"100%", height:"100%", display:"block" }} />
              {/* Legend */}
              <div style={{ position:"absolute", top:8, right:10, display:"flex", gap:12 }}>
                {[["CALL", C.call], ["PUT", C.put], ["BLOCK", C.gold], ["SWEEP", C.violet]].map(([l, c]) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:5 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:c, boxShadow:`0 0 7px ${c}` }} />
                    <span style={{ fontSize:9, color:C.dim }}>{l}</span>
                  </div>
                ))}
              </div>
              {/* ATM label */}
              <div style={{ position:"absolute", bottom:38, left:"50%", transform:"translateX(-50%)", fontSize:8, color:"rgba(0,190,230,0.35)", letterSpacing:1 }}>ATM</div>
            </div>
          </div>

          {/* ── RIGHT: AI Analyst ── */}
          <div style={{ width:295, borderLeft:`1px solid ${C.border}`, display:"flex", flexDirection:"column", background:"rgba(5,12,20,0.65)", backdropFilter:"blur(10px)" }}>
            <div style={{ padding:"7px 12px", borderBottom:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                <div className="pulsedot" style={{ width:7, height:7, borderRadius:"50%", background:C.accent }} />
                <span style={{ fontFamily:"'Rajdhani', sans-serif", fontSize:14, fontWeight:600, letterSpacing:2, color:C.accent }}>AI ANALYST</span>
              </div>
              <div style={{ fontSize:9, color:C.dim, marginTop:2 }}>Claude · reading live flow data</div>
            </div>

            {/* Chat */}
            <div ref={chatRef} style={{ flex:1, overflowY:"auto", padding:"10px 9px", display:"flex", flexDirection:"column", gap:8 }}>
              {msgs.map((m, i) => (
                <div key={i} className="msg-in" style={{
                  maxWidth:"92%", padding:"8px 10px",
                  borderRadius: m.r==="ai" ? "2px 8px 8px 8px" : "8px 2px 8px 8px",
                  background: m.r==="ai" ? "rgba(0,190,230,0.07)" : "rgba(200,200,255,0.07)",
                  border: m.r==="ai" ? `1px solid rgba(0,190,230,0.2)` : `1px solid rgba(200,200,255,0.15)`,
                  alignSelf: m.r==="ai" ? "flex-start" : "flex-end"
                }}>
                  {m.r==="ai" && <div style={{ fontSize:8, color:C.accent, letterSpacing:1.5, marginBottom:5 }}>ANALYST</div>}
                  <div style={{ fontSize:11, lineHeight:1.7, color: m.r==="ai" ? C.text : "#d0d8f4" }}>{m.t}</div>
                </div>
              ))}
              {aiLoad && (
                <div className="msg-in" style={{ maxWidth:"92%", padding:"8px 10px", borderRadius:"2px 8px 8px 8px", background:"rgba(0,190,230,0.07)", border:`1px solid rgba(0,190,230,0.2)` }}>
                  <div style={{ fontSize:8, color:C.accent, letterSpacing:1.5, marginBottom:5 }}>ANALYST</div>
                  <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                    {[0,1,2].map(i => (
                      <div key={i} className="blink" style={{ width:5, height:5, borderRadius:"50%", background:C.accent, animationDelay:`${i*0.18}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts */}
            <div style={{ padding:"4px 8px", display:"flex", flexWrap:"wrap", gap:4 }}>
              {["What's the biggest block?", "Bullish or bearish?", "NVDA activity?", "Any red flags?"].map(q => (
                <button key={q} onClick={() => setInp(q)} style={{
                  fontSize:8, padding:"3px 7px", background:"transparent",
                  border:`1px solid rgba(0,190,230,0.18)`, borderRadius:2,
                  color:C.dim, cursor:"pointer", fontFamily:"'DM Mono', monospace",
                  transition:"border-color 0.15s, color 0.15s"
                }}
                  onMouseEnter={e => { e.target.style.borderColor = "rgba(0,190,230,0.45)"; e.target.style.color = C.text; }}
                  onMouseLeave={e => { e.target.style.borderColor = "rgba(0,190,230,0.18)"; e.target.style.color = C.dim; }}>
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding:"8px", borderTop:`1px solid ${C.border}`, display:"flex", gap:6 }}>
              <input
                style={{ flex:1, background:"rgba(0,190,230,0.05)", border:`1px solid rgba(0,190,230,0.2)`, borderRadius:4, padding:"7px 9px", color:C.text, fontSize:11, outline:"none", fontFamily:"'DM Mono', monospace", transition:"border-color 0.2s" }}
                value={inp} onChange={e => setInp(e.target.value)}
                onKeyDown={e => e.key === "Enter" && askAI()}
                onFocus={e => e.target.style.borderColor = "rgba(0,190,230,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(0,190,230,0.2)"}
                placeholder="Ask the analyst..." />
              <button onClick={askAI} style={{
                padding:"7px 14px", background:"rgba(0,190,230,0.12)", border:`1px solid rgba(0,190,230,0.35)`,
                borderRadius:4, color:C.accent, fontSize:13, cursor:"pointer", fontFamily:"'DM Mono', monospace",
                transition:"background 0.15s"
              }}
                onMouseEnter={e => e.target.style.background = "rgba(0,190,230,0.22)"}
                onMouseLeave={e => e.target.style.background = "rgba(0,190,230,0.12)"}>
                →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
