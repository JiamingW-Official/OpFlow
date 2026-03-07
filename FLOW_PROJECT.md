# FLOW// — Options Flow Intelligence Terminal

> 实时期权异动可视化 + AI 分析师仪表盘  
> *A portfolio-grade fintech artifact built with React, Canvas API, and Claude AI*

---

## 项目概览

**FLOW//** 是一个电影级期权流数据仪表盘，核心目标是将机构期权成交（unusual options activity）转化为可视化信号，并接入 AI 分析师进行实时解读。

**定位：** Prop Trading Desk 内部工具美学 × 数据艺术装置

---

## 功能架构

### 1. 实时 Tape（左侧）
- 滚动显示每笔期权成交：标的 / 类型 / 行权价 / 到期日 / 权利金规模
- CALL / PUT / ALL 三档快速筛选
- 自动标记两类异常信号：
  - `BLOCK` — 单笔权利金超过 $1.8M（机构大单）
  - `SWEEP` — 成交量超过 5200 手（扫单/激进买入）

### 2. Options Map（中央主视图）
Canvas 2D 气泡散点图，编码规则：

| 维度 | 含义 |
|---|---|
| X 轴 | 价值度（Moneyness）：深度实值 → 平值 → 虚值 |
| Y 轴 | 到期结构（近月 → 远月，6个月份）|
| 气泡大小 | 权利金规模（线性映射）|
| 颜色 | 绿色 = CALL，红色 = PUT |
| 发光强度 | BLOCK/SWEEP 更强辉光 + 外环 ticker 标注 |

背景：90 节点动态粒子网络，call/put 双色 hue，互相连线

### 3. 实时统计 Header
- **PREMIUM 30m** — 最近 30 笔成交权利金总额
- **SENTIMENT** — 多空情绪（基于 Call Ratio）
- **BLOCKS** — 机构大单计数
- **SWEEPS** — 扫单计数
- **C/P Bar** — 实时多空比例条

### 4. AI Analyst（右侧）
- 接入 Claude API (`claude-sonnet-4-20250514`)
- 每次对话自动注入最新 20 笔 flow 数据作为 system context
- Analyst 人格：trader 语言，简洁，直指信号
- 快捷问题按钮 + 自由输入 + Enter 发送
- 对话气泡 UI，打字指示器动效

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 18 (Hooks) |
| 可视化 | Canvas 2D API（手写，零图表库依赖）|
| 动效 | CSS Keyframes + requestAnimationFrame |
| AI | Anthropic Claude API (`/v1/messages`) |
| 字体 | Rajdhani (display) + DM Mono (data) |
| 样式 | Inline styles + dynamic CSS injection |
| 数据 | 模拟实时流（setInterval，1-2s/笔）|

---

## 设计语言

- **调色板**：深空黑背景 `#050c14` + 电光青主色 `#00c8f0` + 绿/红信号色
- **布局**：三栏固定，左(228px) + 中(flex) + 右(295px)
- **动效节奏**：新 trade 从上 slide down，指示灯 pulse，粒子网络持续浮动
- **数据密度**：Bloomberg Terminal 级别的信息密度，但保持视觉呼吸感

---

## 模拟数据结构

```js
{
  id: 42,
  tk: "NVDA",           // 标的
  type: "CALL",         // CALL | PUT
  strike: 900,          // 行权价
  vol: 3200,            // 成交手数
  prem: 12.40,          // 单张权利金
  total: 39680000,      // 总权利金 = vol * prem * 100
  exp: "04/17",         // 到期日
  moneyness: 1.03,      // strike / spot price
  isBlock: true,        // total > $1.8M
  isSweep: false,       // vol > 5200
  time: "14:32:07"
}
```

---

## Portfolio 价值点

1. **技术深度可见** — Canvas API 手写可视化，无图表库，展示底层图形编程能力
2. **产品思维完整** — 数据层 → 可视化层 → AI 分析层，完整产品闭环
3. **细节完成度高** — 字体选型、色彩系统、发光效果、动效节奏全部精心设计
4. **领域知识嵌入** — 理解 moneyness、block/sweep 语义，不是纯前端展示
5. **AI 集成实用** — context engineering 精准（注入结构化 flow 数据而非随意传文本）

---
---

# Claude Code 开发指令

> 以下是完整的 handoff prompt，可直接粘贴给 Claude Code agent 继续开发

---

## HANDOFF PROMPT

```
You are the sole developer on FLOW//, a real-time options flow intelligence terminal.
Stack: React 18 (single .jsx file), Canvas 2D API, Claude API integration, inline styles.
No build tool — this runs directly in claude.ai artifact renderer.

Core file: flow-viz.jsx (see attached / current codebase)

Design system (DO NOT deviate):
  Background:   #050c14
  Panel:        rgba(6,14,24,0.92)
  Border:       rgba(0,190,230,0.14)
  Call color:   #00e87a
  Put color:    #ff2d5a
  Accent:       #00c8f0
  Gold (block): #f0b040
  Violet (sweep): #b060ff
  Dim text:     #3a5a70
  Body text:    #a8c4d4
  Bright text:  #d8ecf4
  Fonts: Rajdhani (display, 500/600/700) + DM Mono (data/mono, 300/400/500)

Architecture rules:
- ptsRef = particle network state (bgRef canvas, always runs via RAF loop)
- tradesRef = live ref mirror of trades state (for AI context without stale closure)
- vizRef canvas redraws on every trades state update via drawViz() useCallback
- AI call: POST to https://api.anthropic.com/v1/messages, model claude-sonnet-4-20250514
- No API key needed in code (handled by claude.ai proxy)
- Simulated data: setInterval every 1100-2000ms calls gen(), prepends to trades (max 60)

When I give you a feature to add:
1. State the exact change plan in one sentence
2. Implement it — full file or targeted edit
3. Confirm what changed

Current features: live tape feed, options map (moneyness x expiry scatter),
header stats bar, particle background, AI analyst chat with context injection,
BLOCK/SWEEP tagging.
```

---

## 功能扩展任务清单

### 🔥 高优先级

**Task 1 — Ticker Heat Sidebar**
```
Add a ticker heatmap panel above the AI analyst (height ~180px).
Show each of the 10 tickers as a cell.
Cell color = green/red based on call/put ratio of last 20 trades for that ticker.
Cell size proportional to total premium weight.
Font: Rajdhani bold. Update every time trades state changes.
```

**Task 2 — Premium Flow Timeline**
```
Add a mini sparkline chart at the bottom of the center panel (height 60px).
X axis = time (last 60 data points), Y axis = cumulative call vs put premium.
Two lines: green (calls) and red (puts). Fill area between them.
Implement with Canvas 2D. Update on each new trade.
```

**Task 3 — Mega Block Toast Alert**
```
When a new trade arrives with total > $3M, show a toast notification in top-right corner.
Style: dark panel, gold border, ticker + type + total amount, 4s auto-dismiss.
Animation: slide in from right, fade out on dismiss. Stack multiple toasts vertically.
```

**Task 4 — Options Map Hover Tooltip**
```
Add mouse interaction to the vizRef canvas.
On mousemove, detect nearest bubble within 30px radius.
Show tooltip: ticker, type, strike, expiry, volume, total premium, block/sweep flags.
Style: dark glass panel, cyan border, DM Mono font, position follows cursor with offset.
```

### 📊 中优先级

**Task 5 — WebSocket Integration (Polygon.io)**
```
Replace setInterval mock with WebSocket connection to Polygon.io options stream.
Endpoint: wss://socket.polygon.io/options
Auth: API key from env var POLYGON_API_KEY
Parse: underlying_asset, contract_type, strike_price, expiration_date, size, premium, timestamp
Keep mock data fallback if WS fails.
Add connection status indicator in header: green=connected / yellow=connecting / red=disconnected
```

**Task 6 — Filter Panel Expansion**
```
Expand the tape filter bar to include:
- Min premium: $0 / $100K / $500K / $1M+ (toggle buttons)
- Expiry: This Week / This Month / All
- Ticker multi-select: pill buttons for each ticker, individually togglable
Filters apply to both tape list AND options map visualization simultaneously.
```

**Task 7 — Export Snapshot**
```
Add EXPORT button in the header.
On click:
  1. Capture options map canvas as PNG via canvas.toDataURL()
  2. Generate JSON of top 10 trades by total premium
  3. Trigger download of both: flow-snapshot.png + flow-data.json
```

### 🎨 视觉升级

**Task 8 — ATM Pulse Ring**
```
In options map canvas, the ATM dashed line should emit horizontal ripple rings.
Every 3 seconds, expand a ring from ATM line position, decreasing opacity outward.
Color: rgba(0,190,230,0.3). Use timestamp-based animation in drawViz RAF loop.
```

**Task 9 — Particle Shockwave on Block**
```
When a new BLOCK trade arrives, trigger a shockwave in the bgRef particle canvas:
- Emit circular ripple expanding to full canvas width over 800ms
- Gold color for CALL blocks, red-violet for PUT blocks
- Particles near ripple front get temporary velocity boost
Store active shockwaves in a ref array with timestamps.
```

---

## 真实数据接入

### Polygon.io（推荐）
```js
const ws = new WebSocket('wss://socket.polygon.io/options');
ws.onopen = () => ws.send(JSON.stringify({ action: "auth", params: API_KEY }));
ws.onmessage = (e) => {
  const msgs = JSON.parse(e.data);
  msgs.forEach(m => {
    if (m.ev === "T") {  // trade event
      const trade = {
        tk: m.sym.replace("O:", "").split(/\d/)[0],
        type: m.details?.contract_type?.toUpperCase() || "CALL",
        strike: m.details?.strike_price,
        vol: m.s,         // size
        prem: m.p,        // price
        total: m.s * m.p * 100,
        exp: m.details?.expiration_date,
        moneyness: m.details?.strike_price / m.bp  // needs spot price
      };
      setTrades(prev => [trade, ...prev.slice(0, 59)]);
    }
  });
};
```

### Tradier API（备选 REST）
```js
const res = await fetch(
  'https://api.tradier.com/v1/markets/options/chains?symbol=SPY&expiration=2024-03-15',
  { headers: { Authorization: `Bearer ${API_KEY}`, Accept: 'application/json' } }
);
```

---

## 建议文件结构（项目拆分后）

```
flow-terminal/
├── src/
│   ├── components/
│   │   ├── TapeFlow.jsx            # 左侧 tape
│   │   ├── OptionsMap.jsx          # 中央 canvas 可视化
│   │   ├── AIAnalyst.jsx           # 右侧 AI chat
│   │   ├── TickerHeat.jsx          # ticker 热力图 (Task 1)
│   │   └── PremiumTimeline.jsx     # sparkline (Task 2)
│   ├── hooks/
│   │   ├── useOptionsStream.js     # WebSocket / mock 数据
│   │   └── useParticleNetwork.js   # 粒子网络 RAF 循环
│   ├── lib/
│   │   ├── dataGen.js              # mock data generator
│   │   └── format.js               # fmt(), 数字格式化
│   ├── constants/
│   │   └── theme.js                # 全局色彩/字体变量
│   └── App.jsx
├── .env.local                      # VITE_POLYGON_KEY, VITE_ANTHROPIC_KEY
└── README.md
```

## 部署

```bash
npm create vite@latest flow-terminal -- --template react
cd flow-terminal
# 将 flow-viz.jsx 内容复制到 src/App.jsx
npm install
npm run build
npx vercel --prod
```

---

*FLOW// — Built with React + Canvas API + Claude AI*
