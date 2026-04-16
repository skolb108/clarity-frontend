import { useEffect, useState } from "react";
import ScreenContainer from "../components/ScreenContainer";

const KEYFRAMES = `
  @keyframes breathe {
    0%,  100% { transform: scale(1);    opacity: 0.4; }
    50%        { transform: scale(1.25); opacity: 0.7; }
  }
`;

export default function Loading() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);

    const timers = [
      setTimeout(() => setPhase(1), 100),  // dot
      setTimeout(() => setPhase(2), 400),  // text
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <ScreenContainer logoAlign="center" logoOpacity={0.25}>
      <div style={{
        flex:           1,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        justifyContent: "center",
        gap:            40,
        paddingBottom:  40,
      }}>
        {/* Breathing dot */}
        <div style={{
          width:        12,
          height:       12,
          borderRadius: "50%",
          background:   "#a5b4fc",
          animation:    phase >= 1 ? "breathe 2.4s cubic-bezier(0.4,0,0.2,1) infinite" : "none",
          opacity:      phase >= 1 ? undefined : 0,
          transition:   "opacity 600ms ease",
        }} />

        {/* Text */}
        <div style={{
          textAlign:  "center",
          opacity:    phase >= 2 ? 1 : 0,
          transform:  phase >= 2 ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 500ms cubic-bezier(0.2,0.65,0.3,0.9), transform 500ms cubic-bezier(0.2,0.65,0.3,0.9)",
        }}>
          <p style={{
            fontSize:      "clamp(24px, 5.5vw, 30px)",
            fontWeight:    600,
            lineHeight:    1.3,
            letterSpacing: "-0.01em",
            color:         "#0f172a",
            margin:        "0 0 10px",
            maxWidth:      300,
          }}>
            Ich verbinde gerade<br />deine Antworten…
          </p>
          <p style={{
            fontSize:      15,
            fontWeight:    400,
            color:         "rgba(0,0,0,0.35)",
            margin:        0,
            letterSpacing: "0.01em",
          }}>
            Einen Moment.
          </p>
        </div>
      </div>
    </ScreenContainer>
  );
}
