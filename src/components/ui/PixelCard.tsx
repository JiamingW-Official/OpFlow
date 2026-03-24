import { forwardRef, type CSSProperties, type ReactNode, type HTMLAttributes } from "react";

const PIXEL_CLIP = `polygon(
  0 6px, 6px 6px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 6px) calc(100% - 6px),
  calc(100% - 6px) 100%, 6px 100%, 6px calc(100% - 6px), 0 calc(100% - 6px)
)`;

const CARD: CSSProperties = {
  background: "linear-gradient(180deg, #1d1a30 0%, #1a1a2e 30%, #171528 100%)",
  border: "3px solid #66ccff",
  clipPath: PIXEL_CLIP,
  boxShadow: "0 0 18px rgba(102,204,255,0.12), inset 0 0 40px rgba(102,204,255,0.04)",
  overflow: "hidden",
  minWidth: 0,
  position: "relative",
};

const CORNER: CSSProperties = {
  position: "absolute",
  width: 4,
  height: 4,
  pointerEvents: "none",
  zIndex: 2,
};

const TITLE_BAR: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  borderBottom: "3px solid rgba(102,204,255,0.25)",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 12,
  letterSpacing: 1,
  position: "relative",
  overflow: "hidden",
};

interface PixelCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  titleIcon?: string;
  titleColor?: string;
}

const PixelCard = forwardRef<HTMLDivElement, PixelCardProps>(
  ({ children, title, titleIcon, titleColor, style, ...props }, ref) => {
    const tc = titleColor || "#66ccff";
    return (
      <div ref={ref} className="pixel-card" style={{ ...CARD, ...style }} {...props}>
        {/* Animated corner pixels — decorative */}
        <div aria-hidden="true" className="pixel-corner-glow" style={{ ...CORNER, top: 7, left: 7, background: tc, boxShadow: `0 0 6px ${tc}` }} />
        <div aria-hidden="true" className="pixel-corner-glow" style={{ ...CORNER, top: 7, right: 7, background: "#ff88bb", boxShadow: "0 0 6px #ff88bb", animationDelay: "0.5s" }} />
        <div aria-hidden="true" className="pixel-corner-glow" style={{ ...CORNER, bottom: 7, left: 7, background: "#ffdd66", boxShadow: "0 0 6px #ffdd66", animationDelay: "1s" }} />
        <div aria-hidden="true" className="pixel-corner-glow" style={{ ...CORNER, bottom: 7, right: 7, background: "#cc88ff", boxShadow: "0 0 6px #cc88ff", animationDelay: "1.5s" }} />
        {title && (
          <div className="pixel-card-title" style={{ ...TITLE_BAR, color: tc, textShadow: `0 0 8px ${tc}` }}>
            {/* Animated gradient sweep */}
            <div className="title-gradient-sweep" style={{
              position: "absolute", inset: 0,
              background: `linear-gradient(90deg, ${tc}08, ${tc}18, ${tc}08)`,
              pointerEvents: "none",
            }} />
            {titleIcon && <span style={{ fontSize: 18, position: "relative" }}>{titleIcon}</span>}
            <span className="glitch-text" style={{ position: "relative" }}>{title}</span>
            <span aria-hidden="true" style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center", position: "relative" }}>
              <span className="pixel-sparkle" style={{ fontSize: 14, color: "#ff88bb", animationDelay: "0s" }}>~</span>
              <span className="pixel-sparkle" style={{ fontSize: 14, color: "#ffdd66", animationDelay: "0.4s" }}>*</span>
              <span className="pixel-sparkle" style={{ fontSize: 14, color: "#66ccff", animationDelay: "0.8s" }}>~</span>
            </span>
          </div>
        )}
        {children}
      </div>
    );
  },
);

PixelCard.displayName = "PixelCard";

export default PixelCard;
