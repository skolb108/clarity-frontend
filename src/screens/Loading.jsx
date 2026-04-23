import { useEffect, useState } from "react";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const KEYFRAMES = `
  @keyframes breathePulse {
    0%,  100% { transform: scale(1);    opacity: 0.40; }
    50%        { transform: scale(1.14); opacity: 0.70; }
  }
`;

export default function Loading() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);

    // Staggered reveal
    const t1 = setTimeout(() => setPhase(1), 80);   // bg darken + dot
    const t2 = setTimeout(() => setPhase(2), 180);  // main text
    const t3 = setTimeout(() => setPhase(3), 330);  // sub text

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>

      {/* Background darkening overlay — creates tension */}
      <div style={{
        position:   "fixed",
        inset:       0,
        zIndex:      0,
        background:  "rgba(0,0,0,0.30)",
        opacity:     phase >= 1 ? 1 : 0,
        transition:  "opacity 400ms ease-out",
        pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position:       "relative",
        zIndex:          1,
        minHeight:       "100vh",
        display:         "flex",
        flexDirection:   "column",
        justifyContent:  "center",
        alignItems:      "center",
        gap:              28,
        fontFamily:      FF,
        padding:         "0 32px",
        textAlign:       "center",
      }}>

        {/* Breathing dot — subtle, above text */}
        <div style={{
          width:        10,
          height:       10,
          borderRadius: "50%",
          background:   "#0f172a",
          animation:    phase >= 1 ? "breathePulse 2.6s ease-in-out infinite" : "none",
          opacity:      phase >= 1 ? 1 : 0,
          transition:   "opacity 400ms ease",
        }} />

        {/* Main text */}
        <p style={{
          fontSize:      "clamp(26px, 6vw, 34px)",
          fontWeight:    700,
          lineHeight:    1.2,
          letterSpacing: "-0.02em",
          color:         "#0f172a",
          margin:        0,
          opacity:       phase >= 2 ? 1 : 0,
          transform:     phase >= 2 ? "scale(1) translateY(0)" : "scale(0.98) translateY(6px)",
          transition:    "opacity 500ms ease-out, transform 500ms ease-out",
        }}>
          Gleich wird es eindeutig.
        </p>

        {/* Sub text */}
        <p style={{
          fontSize:   16,
          fontWeight: 400,
          lineHeight: 1.55,
          color:      "rgba(0,0,0,0.55)",
          margin:     0,
          opacity:    phase >= 3 ? 0.65 : 0,
          transform:  phase >= 3 ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 450ms ease-out, transform 450ms ease-out",
        }}>
          Und das fühlt sich anders an.
        </p>

      </div>
    </div>
  );
}
