// 8×8 pixel art company logos — recognizable brand marks, not letter forms
// Each row is 8 pixels, null = transparent
type Row = (string | null)[];
type Logo = Row[];

const _ = null;

// Apple — apple silhouette with bite mark + green leaf
const AAPL: Logo = [
  [_, _, _, _, "#4CAF50", _, _, _],
  [_, _, "#C8CDD0", "#C8CDD0", "#C8CDD0", _, _, _],
  [_, "#C8CDD0", _, "#DDE1E3", "#C8CDD0", "#A8B0B5", _, _],
  [_, "#C8CDD0", _, "#C8CDD0", "#C8CDD0", "#A8B0B5", _, _],
  [_, "#A8B0B5", "#A8B0B5", "#C8CDD0", "#A8B0B5", "#A8B0B5", _, _],
  [_, "#A8B0B5", "#A8B0B5", "#A8B0B5", "#A8B0B5", "#909599", _, _],
  [_, _, "#909599", "#909599", "#909599", _, _, _],
  [_, _, _, "#909599", _, _, _, _],
];

// NVIDIA — green eye/swoosh shape
const NVDA: Logo = [
  [_, _, _, _, _, _, _, _],
  [_, _, "#9AE62B", "#9AE62B", "#9AE62B", _, _, _],
  [_, "#9AE62B", "#76B900", _, _, "#76B900", _, _],
  ["#76B900", "#9AE62B", "#76B900", "#76B900", "#76B900", "#76B900", "#5A8F00", _],
  ["#5A8F00", "#76B900", "#76B900", "#76B900", "#76B900", "#9AE62B", "#76B900", _],
  [_, "#5A8F00", _, _, "#9AE62B", "#76B900", _, _],
  [_, _, "#5A8F00", "#5A8F00", "#5A8F00", _, _, _],
  [_, _, _, _, _, _, _, _],
];

// Tesla — bold red T with wide top bar
const TSLA: Logo = [
  ["#FF3B40", "#FF3B40", "#FF3B40", "#FF3B40", "#FF3B40", "#FF3B40", "#FF3B40", _],
  ["#E82127", "#E82127", "#E82127", "#E82127", "#E82127", "#E82127", "#E82127", _],
  [_, _, _, "#E82127", _, _, _, _],
  [_, _, _, "#E82127", _, _, _, _],
  [_, _, _, "#C41C22", _, _, _, _],
  [_, _, _, "#C41C22", _, _, _, _],
  [_, _, _, "#C41C22", _, _, _, _],
  [_, _, _, _, _, _, _, _],
];

// Microsoft — 4-color window panes with highlights
const MSFT: Logo = [
  [_, _, _, _, _, _, _, _],
  [_, "#F25022", "#FF6A3D", _, "#99D41C", "#7FBA00", _, _],
  [_, "#F25022", "#F25022", _, "#7FBA00", "#7FBA00", _, _],
  [_, _, _, _, _, _, _, _],
  [_, "#29B6F6", "#00A4EF", _, "#FFCA28", "#FFB900", _, _],
  [_, "#00A4EF", "#00A4EF", _, "#FFB900", "#FFB900", _, _],
  [_, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _],
];

// Meta — blue infinity ∞ loop
const META: Logo = [
  [_, _, _, _, _, _, _, _],
  [_, "#29A0FC", "#29A0FC", _, _, "#29A0FC", "#29A0FC", _],
  ["#0081FB", _, _, "#0081FB", "#0081FB", _, _, "#0081FB"],
  ["#0081FB", _, _, _, _, _, _, "#0081FB"],
  ["#0065CC", _, _, "#0065CC", "#0065CC", _, _, "#0065CC"],
  [_, "#0065CC", "#0065CC", _, _, "#0065CC", "#0065CC", _],
  [_, _, _, _, _, _, _, _],
  [_, _, _, _, _, _, _, _],
];

// Google — multicolor G shape
const GOOGL: Logo = [
  [_, _, "#4285F4", "#4285F4", "#4285F4", "#4285F4", _, _],
  [_, "#4285F4", "#4285F4", _, _, _, "#EA4335", _],
  ["#34A853", "#34A853", _, _, _, _, _, _],
  ["#34A853", _, _, _, "#4285F4", "#4285F4", "#4285F4", _],
  ["#FBBC05", "#FBBC05", _, _, _, _, "#4285F4", _],
  [_, "#FBBC05", _, _, _, _, "#EA4335", _],
  [_, _, "#EA4335", "#EA4335", "#EA4335", "#EA4335", _, _],
  [_, _, _, _, _, _, _, _],
];

// AMD — arrow/chevron pointing right
const AMD: Logo = [
  [_, _, _, _, _, _, _, _],
  [_, "#FF3333", _, _, _, _, _, _],
  [_, "#FF3333", "#FF3333", _, _, _, _, _],
  [_, "#ED1C24", "#FF3333", "#FF3333", _, _, _, _],
  [_, "#ED1C24", "#ED1C24", "#FF3333", "#ED1C24", "#C41820", _, _],
  [_, "#C41820", "#ED1C24", "#C41820", _, _, _, _],
  [_, "#C41820", "#C41820", _, _, _, _, _],
  [_, "#C41820", _, _, _, _, _, _],
];

// SPY — uptrend chart line (S&P 500 bullish)
const SPY: Logo = [
  [_, _, _, _, _, _, "#00E676", _],
  [_, _, _, _, _, "#00E676", _, _],
  [_, _, _, _, "#00E676", _, _, _],
  [_, _, _, "#00C853", _, _, _, _],
  [_, "#00C853", "#00C853", _, _, _, _, _],
  ["#009624", _, _, _, _, _, _, _],
  ["#009624", _, _, _, _, _, _, _],
  ["#009624", "#009624", "#009624", "#009624", "#009624", "#009624", "#009624", "#009624"],
];

// QQQ — tech circuit/chip grid (Nasdaq)
const QQQ: Logo = [
  ["#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", _],
  ["#0FAAFF", _, "#29B6F6", _, "#29B6F6", _, "#0FAAFF", _],
  ["#0FAAFF", "#29B6F6", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#29B6F6", "#0FAAFF", _],
  ["#0FAAFF", _, "#0FAAFF", _, "#0FAAFF", _, "#0FAAFF", _],
  ["#0FAAFF", "#29B6F6", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#29B6F6", "#0FAAFF", _],
  ["#0FAAFF", _, "#29B6F6", _, "#29B6F6", _, "#0FAAFF", _],
  ["#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", "#0FAAFF", _],
  [_, _, _, _, _, _, _, _],
];

// TSM — diamond/semiconductor crystal shape
const TSM: Logo = [
  [_, _, _, "#E30613", _, _, _, _],
  [_, _, "#E30613", "#FF1A1A", "#E30613", _, _, _],
  [_, "#E30613", "#FF1A1A", _, "#FF1A1A", "#E30613", _, _],
  ["#E30613", "#FF1A1A", _, _, _, "#FF1A1A", "#E30613", _],
  [_, "#C10510", "#E30613", _, "#E30613", "#C10510", _, _],
  [_, _, "#C10510", "#E30613", "#C10510", _, _, _],
  [_, _, _, "#C10510", _, _, _, _],
  [_, _, _, _, _, _, _, _],
];

export const LOGOS: Record<string, Logo> = {
  AAPL, NVDA, TSLA, MSFT, META, GOOGL, AMD, SPY, QQQ, TSM,
};

/** Draw an 8×8 pixel logo on a canvas context at (x, y) with given pixel size */
export function drawLogo(ctx: CanvasRenderingContext2D, ticker: string, x: number, y: number, pixelSize = 1): void {
  const logo = LOGOS[ticker];
  if (!logo) return;
  for (let row = 0; row < logo.length; row++) {
    for (let col = 0; col < logo[row].length; col++) {
      const color = logo[row][col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}
