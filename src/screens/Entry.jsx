import { useState, useEffect } from "react";
import ScreenContainer from "../components/ScreenContainer";

const TOP_SPACER_H = "clamp(24px, 8vh, 80px)";

const ENTRY_KEYFRAMES = `
  @keyframes ctaPulse {
    0%, 100% { opacity: 0.50; }
    50%       { opacity: 0.88; }
  }
  @keyframes atmosphereDrift {
    0%   { opacity: 0.70; transform: translate(0px,  0px);  }
    50%  { opacity: 0.90; transform: translate(10px, -7px); }
    100% { opacity: 0.70; transform: translate(0px,  0px);  }
  }
`;

export default function Entry({ onNext }) {
  const [phase,   setPhase]   = useState(0);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = ENTRY_KEYFRAMES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 900),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2200),
      setTimeout(() => setPhase(5), 3000),
      setTimeout(() => setPhase(6), 3800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleTap = () => {
    setPressed(true);
    setTimeout(() => { setPressed(false); onNext(null); }, 130);
  };

  const fadeIn = (show, yOffset = 10) => ({
    opacity:    show ? 1 : 0,
    transform:  show ? "translateY(0)" : `translateY(${yOffset}px)`,
    transition: "opacity 600ms cubic-bezier(0.2,0.65,0.3,0.9), transform 600ms cubic-bezier(0.2,0.65,0.3,0.9)",
  });

  return (
    <>
      {/* Warm peach center — Entry-specific accent on top of global bg */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse 62% 44% at 62% 44%,
          rgba(230, 193, 148, 0.32) 0%,
          rgba(235, 205, 162, 0.12) 48%,
          transparent 72%
        )`,
        pointerEvents: "none",
        willChange: "transform",
      }} />

      {/* Drifting lavender orb — bottom-right */}
      <div aria-hidden="true" style={{
        position: "fixed", bottom: "-10%", right: "-10%",
        width: "60%", height: "60%",
        zIndex: 1,
        borderRadius: "50%",
        background: `radial-gradient(circle,
          rgba(215, 195, 232, 0.22) 0%,
          transparent 65%
        )`,
        animation: "atmosphereDrift 15s ease-in-out infinite",
        pointerEvents: "none",
        willChange: "transform, opacity",
      }} />

      <ScreenContainer logoAlign="left" logoOpacity={0.42}>
        <div
          onClick={handleTap}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          style={{
            position:     "relative",
            zIndex:        2,
            flex:          1,
            display:       "flex",
            flexDirection: "column",
            cursor:        "pointer",
            userSelect:    "none",
            transform:     pressed ? "scale(0.985)" : "scale(1)",
            transition:    "transform 120ms ease-out",
          }}
        >
          <div style={{ height: TOP_SPACER_H, flexShrink: 0 }} />

          <div style={{ marginBottom: 28 }}>
            <div style={fadeIn(phase >= 1)}>
              <p style={{ fontSize: 39, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", color: "#111008", margin: "0 0 6px" }}>
                Du denkst viel.
              </p>
            </div>
            <div style={fadeIn(phase >= 2)}>
              <p style={{ fontSize: 39, fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em", color: "#111008", margin: "0 0 20px" }}>
                Und manchmal dreht<br />es sich im Kreis.
              </p>
            </div>
            <div style={fadeIn(phase >= 3)}>
              <p style={{ fontSize: 39, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.015em", color: "rgba(17,16,8,0.40)", margin: 0 }}>
                Lass uns das kurz ordnen.
              </p>
            </div>
          </div>

          <div style={fadeIn(phase >= 4)}>
            <p style={{ fontSize: 17, fontWeight: 400, lineHeight: 1.65, color: "rgba(17,16,8,0.38)", margin: "0 0 5px", letterSpacing: "0.005em" }}>
              Ich stelle dir ein paar kurze Fragen —<br />und am Ende wird etwas klar.
            </p>
            <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.4, color: "rgba(17,16,8,0.48)", margin: "0 0 20px" }}>
              Für dich.
            </p>
          </div>

          <div style={fadeIn(phase >= 5)}>
            <p style={{ fontSize: 14, color: "rgba(17,16,8,0.26)", margin: "0 0 32px", letterSpacing: "0.01em" }}>
              Dauert etwa 5 Minuten · Kein Account nötig
            </p>
          </div>

          <div style={fadeIn(phase >= 6)}>
            <p style={{ fontSize: 13, color: "rgba(17,16,8,0.50)", margin: 0, letterSpacing: "0.02em", animation: phase >= 6 ? "ctaPulse 2.2s ease-in-out infinite" : "none" }}>
              Tippe, um das zu klären →
            </p>
          </div>
        </div>
      </ScreenContainer>
    </>
  );
}
