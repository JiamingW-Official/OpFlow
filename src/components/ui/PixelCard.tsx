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
  boxShadow: "0 0 18px rgba(102,204,255,0.12), inset 0 0 30px rgba(102,204,255,0.03)",
  overflow: "hidden",
  minWidth: 0,
};

const TITLE_BAR: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  background: "linear-gradient(90deg, rgba(255,136,187,0.08), rgba(102,204,255,0.08), rgba(204,136,255,0.06))",
  borderBottom: "3px solid rgba(102,204,255,0.2)",
  fontFamily: "'Press Start 2P', monospace",
  fontSize: 9,
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
      {title && (
        <div style={{ ...TITLE_BAR, color: titleColor || "#66ccff", textShadow: `0 0 8px ${titleColor || "#66ccff"}` }}>
          {titleIcon && <span style={{ fontSize: 14 }}>{titleIcon}</span>}
          <span>{title}</span>
          <span style={{ marginLeft: "auto", display: "flex", gap: 3, alignItems: "center" }}>
            <span className="pixel-sparkle" style={{ fontSize: 10, color: "#ff88bb", animationDelay: "0s" }}>~</span>
            <span className="pixel-sparkle" style={{ fontSize: 10, color: "#ffdd66", animationDelay: "0.4s" }}>*</span>
            <span className="pixel-sparkle" style={{ fontSize: 10, color: "#66ccff", animationDelay: "0.8s" }}>~</span>
          </span>
        </div>
      )}
      {children}
    </div>
  ),
);

PixelCard.displayName = "PixelCard";

export default PixelCard;
