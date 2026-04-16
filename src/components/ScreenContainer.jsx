import ClarityLogo from "../components/ClarityLogo";

// Injected once — body ambient + orb animations
const GLASS_CSS = `
  html, body {
    background: #e6e8f2;
    background-image:
      radial-gradient(ellipse 60% 50% at 15% 10%, rgba(165,180,252,0.18) 0%, transparent 100%),
      radial-gradient(ellipse 50% 60% at 85% 90%, rgba(196,181,253,0.12) 0%, transparent 100%);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  @keyframes orbDrift1 {
    0%,  100% { transform: translate(0px,   0px)   scale(1);    }
    33%        { transform: translate(28px, -22px)  scale(1.07); }
    66%        { transform: translate(-14px, 16px)  scale(0.95); }
  }
  @keyframes orbDrift2 {
    0%,  100% { transform: translate(0px,   0px)   scale(1);    }
    40%        { transform: translate(-24px, 22px)  scale(1.09); }
    72%        { transform: translate(18px, -14px)  scale(0.93); }
  }
  @keyframes orbDrift3 {
    0%,  100% { transform: translate(0px,  0px)   scale(1);    }
    50%        { transform: translate(12px, 30px)  scale(1.04); }
  }
`;

export default function ScreenContainer({
  children,
  logoAlign   = "left",
  logoOpacity = 0.75,
  headerRight = null,
}) {
  return (
    <>
      <style>{GLASS_CSS}</style>

      {/* Glass card — sits over the ambient body */}
      <div
        style={{
          position:              "relative",
          maxWidth:              560,
          margin:                "0 auto",
          minHeight:             "100vh",
          overflow:              "hidden",
          background:            "rgba(255,255,255,0.82)",
          backdropFilter:        "blur(48px) saturate(160%)",
          WebkitBackdropFilter:  "blur(48px) saturate(160%)",
          /* subtle glass rim + faint colored outer glow */
          boxShadow:
            "inset 0 0 0 0.5px rgba(255,255,255,0.85), " +
            "0 0 0 0.5px rgba(165,180,252,0.10), " +
            "0 8px 40px rgba(15,23,42,0.06)",
          boxSizing:             "border-box",
          fontFamily:            "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        {/* ── Ambient light orbs ── */}

        {/* Orb 1: top-right, indigo */}
        <div style={{
          position:      "absolute",
          top:           -100,
          right:         -80,
          width:          480,
          height:         480,
          borderRadius:  "50%",
          background:    "radial-gradient(circle at 40% 40%, rgba(165,180,252,0.22) 0%, rgba(165,180,252,0.06) 50%, transparent 70%)",
          filter:        "blur(1px)",
          animation:     "orbDrift1 16s ease-in-out infinite",
          pointerEvents: "none",
          zIndex:         0,
        }} />

        {/* Orb 2: bottom-left, violet */}
        <div style={{
          position:      "absolute",
          bottom:        "8%",
          left:          -100,
          width:          360,
          height:         360,
          borderRadius:  "50%",
          background:    "radial-gradient(circle at 60% 60%, rgba(196,181,253,0.18) 0%, rgba(196,181,253,0.05) 55%, transparent 72%)",
          filter:        "blur(1px)",
          animation:     "orbDrift2 21s ease-in-out infinite",
          pointerEvents: "none",
          zIndex:         0,
        }} />

        {/* Orb 3: center-ish, tiny warm accent */}
        <div style={{
          position:      "absolute",
          top:           "42%",
          right:         "10%",
          width:          160,
          height:         160,
          borderRadius:  "50%",
          background:    "radial-gradient(circle, rgba(224,231,255,0.30) 0%, transparent 70%)",
          filter:        "blur(2px)",
          animation:     "orbDrift3 11s ease-in-out infinite",
          pointerEvents: "none",
          zIndex:         0,
        }} />

        {/* ── Content layer ── */}
        <div
          style={{
            position:       "relative",
            zIndex:          1,
            padding:         "40px 24px 40px",
            minHeight:       "100vh",
            display:         "flex",
            flexDirection:   "column",
            justifyContent:  "flex-start",
            boxSizing:       "border-box",
          }}
        >
          {/* Header */}
          <div style={{
            display:        "flex",
            justifyContent: headerRight ? "space-between" : "flex-start",
            alignItems:     "center",
            marginBottom:   40,
          }}>
            <div style={{ opacity: logoOpacity, transition: "opacity 400ms ease" }}>
              <ClarityLogo size="sm" centered={false} />
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>

          {children}
        </div>
      </div>
    </>
  );
}
