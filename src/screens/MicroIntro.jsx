import { useState, useEffect } from "react";

/*
  MicroIntro — final tuning.
  A moment, not an animation.

  Phase 1 — Emergence  0–800ms:   blur clears, light settles
  Phase 2 — Stillness  800–1600ms: nothing moves, just held
  Phase 3 — Transition 1600–2000ms: fade + subtle lift
*/

const KEYFRAMES = `
  @keyframes logoPulse {
    0%,  100% { opacity: 0.72; }
    50%        { opacity: 0.92; }
  }
`;

const SunIconWhite = ({ size = 36 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 909.85 909.85"
    width={size} height={size} style={{ display: "block" }}>
    <circle cx="454.95" cy="454.92" r="111.22" fill="rgba(255,255,255,0.90)" />
    <line x1="454.95" y1="33.9"   x2="454.9"  y2="243.09" stroke="rgba(255,255,255,0.90)" strokeWidth="67.81" strokeLinecap="round" />
    <line x1="454.95" y1="666.76" x2="454.9"  y2="875.94" stroke="rgba(255,255,255,0.90)" strokeWidth="67.81" strokeLinecap="round" />
    <line x1="875.94" y1="454.95" x2="666.76" y2="454.9"  stroke="rgba(255,255,255,0.90)" strokeWidth="67.81" strokeLinecap="round" />
    <line x1="243.09" y1="454.95" x2="33.9"   y2="454.9"  stroke="rgba(255,255,255,0.90)" strokeWidth="67.81" strokeLinecap="round" />
    <line x1="752.61" y1="752.65" x2="604.73" y2="604.7"  stroke="rgba(255,255,255,0.68)" strokeWidth="29.06" strokeLinecap="round" />
    <line x1="305.11" y1="305.16" x2="157.23" y2="157.21" stroke="rgba(255,255,255,0.68)" strokeWidth="29.06" strokeLinecap="round" />
    <line x1="157.19" y1="752.62" x2="305.14" y2="604.73" stroke="rgba(255,255,255,0.68)" strokeWidth="29.06" strokeLinecap="round" />
    <line x1="604.68" y1="305.12" x2="752.62" y2="157.24" stroke="rgba(255,255,255,0.68)" strokeWidth="29.06" strokeLinecap="round" />
  </svg>
);

export default function MicroIntro({ onDone }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);

    const timers = [
      setTimeout(() => setPhase(1),  50),    // emergence starts
      setTimeout(() => setPhase(2),  680),   // logo fades in (slightly delayed)
      // Phase 2 = stillness 800–1600ms — no setState, just held
      setTimeout(() => setPhase(3),  1600),  // begin transition
      setTimeout(() => onDone(),     2000),  // hand off
    ];

    return () => {
      timers.forEach(clearTimeout);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position:   "fixed",
        inset:       0,
        zIndex:      100,
        overflow:    "hidden",
        // Phase 3 — gentle fade + slight upward lift
        opacity:    phase >= 3 ? 0 : 1,
        transform:  phase >= 3 ? "translateY(-6px)" : "translateY(0)",
        transition: phase >= 3
          ? "opacity 400ms cubic-bezier(0.4,0,1,1), transform 400ms cubic-bezier(0.4,0,1,1)"
          : "none",
      }}
    >
      {/* Sharpening container — whole scene clears in Phase 1 */}
      <div style={{
        position:   "absolute",
        inset:       0,
        filter:     phase >= 1 ? "blur(0px)"  : "blur(8px)",
        opacity:    phase >= 1 ? 1 : 0.50,
        // Emergence: 800ms — settles cleanly before logo arrives
        transition: "filter 800ms cubic-bezier(0.4,0,0.2,1), opacity 700ms ease",
        willChange: "filter",
      }}>
        {/* Base */}
        <div style={{ position: "absolute", inset: 0, background: "#F5F5F4" }} />

        {/* Mint / cyan — top-left, organic, not symmetrical */}
        <div style={{
          position:   "absolute",
          inset:       0,
          background: `radial-gradient(ellipse 78% 62% at -8% 3%,
            rgba(175, 228, 230, 0.70) 0%,
            rgba(155, 215, 222, 0.30) 42%,
            transparent 68%
          )`,
        }} />

        {/*
          Warm peach — shifted 12% RIGHT of center, 8% above center.
          Off-center = not staged. Large radius = no visible edge.
        */}
        <div style={{
          position:   "absolute",
          inset:       0,
          background: `radial-gradient(ellipse 62% 44% at 62% 44%,
            rgba(230, 193, 148, 0.58) 0%,
            rgba(235, 205, 162, 0.22) 48%,
            transparent 72%
          )`,
          filter:     "blur(22px)",
        }} />

        {/* Lavender — bottom-right, also slightly off-center */}
        <div style={{
          position:   "absolute",
          inset:       0,
          background: `radial-gradient(ellipse 88% 52% at 58% 108%,
            rgba(218, 198, 235, 0.62) 0%,
            rgba(225, 210, 238, 0.24) 48%,
            transparent 68%
          )`,
        }} />
      </div>

      {/*
        Logo — fades in at 680ms (after emergence is mostly complete).
        Position: slightly above center, 3% left of center — asymmetric.
        Very subtle blur→sharp on fade-in: filter transitions with opacity.
      */}
      <div style={{
        position:      "absolute",
        top:            "50%",
        left:           "50%",
        // Slightly off-center: -3% left, -6% up — not perfectly staged
        transform:     `translate(calc(-50% - 3%), calc(-50% - 6%)) translateY(${phase >= 2 ? "0px" : "10px"})`,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:             10,
        opacity:        phase >= 2 ? 1 : 0,
        // Subtle blur→sharp as it fades in
        filter:         phase >= 2 ? "blur(0px)" : "blur(3px)",
        transition:     "opacity 700ms cubic-bezier(0.2,0.65,0.3,0.9), transform 700ms cubic-bezier(0.2,0.65,0.3,0.9), filter 700ms ease",
      }}>
        {/* Icon — pulse only during stillness, stops on exit */}
        <div style={{
          animation: phase === 2 ? "logoPulse 3.4s ease-in-out infinite" : "none",
          opacity:   phase === 2 ? undefined : phase >= 2 ? 0.82 : 1,
        }}>
          <SunIconWhite size={36} />
        </div>

        <span style={{
          fontFamily:    "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize:       16,
          fontWeight:     500,
          letterSpacing:  "0.06em",
          color:          "rgba(255,255,255,0.88)",
          lineHeight:     1,
        }}>
          Clarity
        </span>
      </div>
    </div>
  );
}
