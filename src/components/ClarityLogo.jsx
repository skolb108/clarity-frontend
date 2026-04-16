const SIZES = {
  sm: { icon: 24, fontSize: 12 },
  md: { icon: 36, fontSize: 14 },
  lg: { icon: 52, fontSize: 16 },
};

export default function ClarityLogo({ size = "md", faded = false, centered = true }) {
  const { icon: px, fontSize } = SIZES[size] ?? SIZES.md;
  const opacity = faded ? 0.3 : 0.9;

  return (
    <div
      style={{
        display:        centered ? "flex" : "inline-flex",
        justifyContent: centered ? "center" : undefined,
        alignItems:     "center",
        gap:            8,
        opacity,
        transition:     "opacity 200ms ease",
      }}
    >
      <img
        src="/clarity-logo.png"
        alt=""
        style={{
          width:     px,
          height:    px,
          objectFit: "contain",
          display:   "block",
          filter: faded ? "grayscale(100%) opacity(0.5)" : "none",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily:    "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: 13,
          fontWeight:    600,
          letterSpacing: "0.08em",
          textTransform: "normal",
          color:         "rgba(0,0,0,0.88)",
          lineHeight:    1,
        }}
      >
        Clarity
      </span>
    </div>
  );
}
