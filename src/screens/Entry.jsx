import { useState, useEffect } from "react";
import ScreenContainer from "../components/ScreenContainer";

// Smaller spacer — content sits higher, CTA visible above mobile nav bar
const TOP_SPACER_H = "clamp(24px, 8vh, 80px)";

const ENTRY_KEYFRAMES = `
  @keyframes ctaPulse {
    0%, 100% { opacity: 0.6; }
    50%       { opacity: 1;   }
  }
  @keyframes gradientDrift {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
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
    setTimeout(() => {
      setPressed(false);
      onNext(null);
    }, 130);
  };

  const fadeIn = (show, yOffset = 10) => ({
    opacity:    show ? 1 : 0,
    transform:  show ? "translateY(0)" : `translateY(${yOffset}px)`,
    transition: "opacity 600ms cubic-bezier(0.2,0.65,0.3,0.9), transform 600ms cubic-bezier(0.2,0.65,0.3,0.9)",
  });

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position:        "fixed",
          inset:            0,
          zIndex:           0,
          background:       "linear-gradient(135deg, #e8eaf6 0%, #f0f4ff 40%, #ede9f8 70%, #e8eaf6 100%)",
          backgroundSize:   "300% 300%",
          animation:        "gradientDrift 10s ease-in-out infinite",
          pointerEvents:    "none",
          willChange:       "transform",  /* GPU layer — prevents iOS freeze */
        }}
      />

      <ScreenContainer logoAlign="left" logoOpacity={0.45}>
        <div
          onClick={handleTap}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseLeave={() => setPressed(false)}
          style={{
            position:      "relative",
            zIndex:         1,
            flex:           1,
            display:        "flex",
            flexDirection:  "column",
            cursor:         "pointer",
            userSelect:     "none",
            transform:      pressed ? "scale(0.98)" : "scale(1)",
            transition:     "transform 120ms ease-out",
          }}
        >
          <div style={{ height: TOP_SPACER_H, flexShrink: 0 }} />

          {/* Headline */}
          <div style={{ marginBottom: 28 }}>
            <div style={fadeIn(phase >= 1)}>
              <p style={{
                fontSize:      39,
                fontWeight:    700,
                lineHeight:    1.15,
                letterSpacing: "-0.02em",
                color:         "#0f172a",
                margin:        "0 0 6px",
                textShadow:    "0 2px 60px rgba(165,180,252,0.2)",
              }}>
                Du denkst viel.
              </p>
            </div>

            <div style={fadeIn(phase >= 2)}>
              <p style={{
                fontSize:      39,
                fontWeight:    700,
                lineHeight:    1.15,
                letterSpacing: "-0.02em",
                color:         "#0f172a",
                margin:        "0 0 18px",
                textShadow:    "0 2px 60px rgba(165,180,252,0.2)",
              }}>
                Und manchmal dreht<br />es sich im Kreis.
              </p>
            </div>

            <div style={fadeIn(phase >= 3)}>
              <p style={{
                fontSize:      39,
                fontWeight:    600,
                lineHeight:    1.2,
                letterSpacing: "-0.015em",
                color:         "rgba(15,23,42,0.42)",
                margin:        0,
              }}>
                Lass uns das kurz ordnen.
              </p>
            </div>
          </div>

          {/* Supporting line */}
          <div style={fadeIn(phase >= 4)}>
            <p style={{
              fontSize:      17,
              fontWeight:    400,
              lineHeight:    1.6,
              color:         "rgba(15,23,42,0.40)",
              margin:        "0 0 16px",
              letterSpacing: "0.005em",
            }}>
              Ich stelle dir ein paar kurze Fragen —<br />
              und am Ende wird etwas klar.
            </p>
          </div>

          {/* Meta */}
          <div style={fadeIn(phase >= 5)}>
            <p style={{
              fontSize:      14,
              color:         "rgba(15,23,42,0.28)",
              margin:        "0 0 32px",
              letterSpacing: "0.01em",
            }}>
              Dauert etwa 5 Minuten · Kein Account nötig
            </p>
          </div>

          {/* CTA pulse */}
          <div style={fadeIn(phase >= 6)}>
            <p style={{
              fontSize:      13,
              color:         "rgba(0,0,0,0.55)",
              margin:        0,
              letterSpacing: "0.02em",
              animation:     phase >= 6 ? "ctaPulse 2s ease-in-out infinite" : "none",
            }}>
              Tippe, um zu starten →
            </p>
          </div>
        </div>
      </ScreenContainer>
    </>
  );
}
