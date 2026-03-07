import { forwardRef, type CSSProperties, type ReactNode, type HTMLAttributes } from "react";

const PIXEL_CLIP = `polygon(
  0 6px, 6px 6px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px),
  calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px)
)`;

const CARD: CSSProperties = {
  background: "#1a1a2e",
  border: "3px solid #66ccff",
  clipPath: PIXEL_CLIP,
  boxShadow: "0 0 18px rgba(102,204,255,0.12), inset 0 0 40px rgba(102,204,255,0.04)",
  overflow: "hidden",
  minWidth: 0,
  position: "relative",
};

const CORNER: CSSProperties = {
  position: "absolute",
  width: 3,
  height: 3,
  background: "rgba(102,204,255,0.18)",
  pointerEvents: "none",
  zIndex: 2,
};

const TITLE_BAR: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  background: "linear-gradient(90deg, rgba(255,136,187,0.1), rgba(102,204,255,0.1), rgba(204,136,255,0.08))",
  borderBottom: "3px solid rgba(102,204,255,0.25)",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 12,
  letterSpacing: 1,
};

interface PixelCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  titleIcon?: string;
  titleColor?: string;
}

const PixelCard = forwardRef<HTMLDivElement, PixelCardProps>(
  ({ children, title, titleIcon, titleColor, style, ...props }, ref) => (
    <div ref={ref} style={{ ...CARD, ...style }} {...props}>
      {/* Corner pixel dots */}
      <div style={{ ...CORNER, top: 8, left: 8 }} />
      <div style={{ ...CORNER, top: 8, right: 8 }} />
      <div style={{ ...CORNER, bottom: 8, left: 8 }} />
      <div style={{ ...CORNER, bottom: 8, right: 8 }} />
      {title && (
        <div style={{ ...TITLE_BAR, color: titleColor || "#66ccff", textShadow: `0 0 8px ${titleColor || "#66ccff"}` }}>
          {titleIcon && <span style={{ fontSize: 18 }}>{titleIcon}</span>}
          <span className="glitch-text">{title}</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 3, alignItems: "center" }}>
            <span className="pixel-sparkle" style={{ fontSize: 13, color: "#ff88bb", animationDelay: "0s" }}>~</span>
            <span className="pixel-sparkle" style={{ fontSize: 13, color: "#ffdd66", animationDelay: "0.4s" }}>*</span>
            <span className="pixel-sparkle" style={{ fontSize: 13, color: "#66ccff", animationDelay: "0.8s" }}>~</span>
          </span>
        </div>
      )}
      {children}
    </div>
  ),
);

PixelCard.displayName = "PixelCard";

export default PixelCard;
