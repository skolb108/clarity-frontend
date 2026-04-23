import { useEffect, useState } from "react";

const FF     = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INDIGO = "#4361EE";

const KEYFRAMES = `
  @keyframes dotPulse {
    0%   { transform: scale(1);    opacity: 0.70; background: #4361EE; }
    33%  { transform: scale(1.22); opacity: 1.00; background: #7c8ff5; }
    66%  { transform: scale(0.92); opacity: 0.80; background: #4361EE; }
    100% { transform: scale(1);    opacity: 0.70; background: #4361EE; }
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes msgOut {
    from { opacity: 1; transform: translateY(0); }
    to   { opacity: 0; transform: translateY(-6px); }
  }
`;

const MESSAGES = [
  { main: "Gleich wird es eindeutig.",          sub: "Und das fühlt sich anders an." },
  { main: "Ich lese, was du geschrieben hast.", sub: "Nicht nur die Wörter." },
  { main: "Muster werden sichtbar.",            sub: "Die, die du selbst nicht siehst." },
  { main: "Fast da.",                           sub: "Das hier ist der wichtige Teil." },
];

// White inline Clarity logo — same icon as the rest of the app
function LogoWhite() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 909.85 909.85"
        width={22} height={22} style={{ display: "block" }}>
        <circle cx="454.95" cy="454.92" r="111.22" fill="rgba(255,255,255,0.92)" />
        <line x1="454.95" y1="33.9"   x2="454.9"  y2="243.09" stroke="rgba(255,255,255,0.92)" strokeWidth="67.81" strokeLinecap="round" />
        <line x1="454.95" y1="666.76" x2="454.9"  y2="875.94" stroke="rgba(255,255,255,0.92)" strokeWidth="67.81" strokeLinecap="round" />
        <line x1="875.94" y1="454.95" x2="666.76" y2="454.9"  stroke="rgba(255,255,255,0.92)" strokeWidth="67.81" strokeLinecap="round" />
        <line x1="243.09" y1="454.95" x2="33.9"   y2="454.9"  stroke="rgba(255,255,255,0.92)" strokeWidth="67.81" strokeLinecap="round" />
        <line x1="752.61" y1="752.65" x2="604.73" y2="604.7"  stroke="rgba(255,255,255,0.70)" strokeWidth="29.06" strokeLinecap="round" />
        <line x1="305.11" y1="305.16" x2="157.23" y2="157.21" stroke="rgba(255,255,255,0.70)" strokeWidth="29.06" strokeLinecap="round" />
        <line x1="157.19" y1="752.62" x2="305.14" y2="604.73" stroke="rgba(255,255,255,0.70)" strokeWidth="29.06" strokeLinecap="round" />
        <line x1="604.68" y1="305.12" x2="752.62" y2="157.24" stroke="rgba(255,255,255,0.70)" strokeWidth="29.06" strokeLinecap="round" />
      </svg>
      <span style={{
        fontFamily:   FF,
        fontSize:      13,
        fontWeight:    600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color:         "rgba(255,255,255,0.88)",
        lineHeight:    1,
      }}>
        Clarity
      </span>
    </div>
  );
}

export default function Loading() {
  const [phase,    setPhase]    = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [msgState, setMsgState] = useState("in");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);

    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 200);
    const t3 = setTimeout(() => setPhase(3), 380);

    let idx = 0;
    const rotate = setInterval(() => {
      if (idx >= MESSAGES.length - 1) { clearInterval(rotate); return; }
      setMsgState("out");
      setTimeout(() => { idx += 1; setMsgIndex(idx); setMsgState("in"); }, 350);
    }, 2000);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearInterval(rotate);
      if (document.head.contains(style)) document.head.removeChild(style);
    };
  }, []);

  const msg = MESSAGES[msgIndex];

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>

      {/* Logo — top center, same position as other screens */}
      <div style={{
        position:   "absolute",
        top:         40,
        left:        0,
        right:       0,
        display:     "flex",
        justifyContent: "center",
        zIndex:       2,
        opacity:     phase >= 1 ? 0.88 : 0,
        transition:  "opacity 600ms ease",
      }}>
        <LogoWhite />
      </div>

      {/* Backdrop darken */}
      <div style={{
        position:      "fixed", inset: 0, zIndex: 0,
        background:    "rgba(0,0,0,0.28)",
        opacity:       phase >= 1 ? 1 : 0,
        transition:    "opacity 400ms ease-out",
        pointerEvents: "none",
      }} />

      {/* Content — centered column */}
      <div style={{
        position:       "relative", zIndex: 1,
        minHeight:       "100vh",
        display:         "flex",
        flexDirection:   "column",
        justifyContent:  "center",
        alignItems:      "center",
        gap:              24,
        fontFamily:      FF,
        padding:         "0 32px",
        textAlign:       "center",
      }}>

        {/* Indigo dot — color-cycling pulse */}
        <div style={{
          width:        24, height: 24, borderRadius: "50%",
          background:   INDIGO,
          animation:    phase >= 1 ? "dotPulse 2.2s ease-in-out infinite" : "none",
          opacity:      phase >= 1 ? 1 : 0,
          transition:   "opacity 400ms ease",
        }} />

        {/* Rotating messages */}
        <div style={{
          display:       "flex", flexDirection: "column",
          alignItems:    "center", gap: 10,
          opacity:       phase >= 2 ? 1 : 0,
          transition:    "opacity 500ms ease-out",
        }}>
          <p style={{
            fontSize:      "clamp(31px, 7vw, 42px)",
            fontWeight:    700, lineHeight: 1.25,
            letterSpacing: "-0.02em",
            color:         "#ffffff",
            margin:        0,
            maxWidth:      "88vw",
            animation:     msgState === "in"
              ? "msgIn 350ms cubic-bezier(0.2,0.65,0.3,0.9) forwards"
              : "msgOut 300ms ease-in forwards",
          }}>
            {msg.main}
          </p>

          <p style={{
            fontSize:   20, fontWeight: 400, lineHeight: 1.55,
            color:      "rgba(255,255,255,0.52)",
            margin:     0,
            maxWidth:   "80vw",
            opacity:    phase >= 3 ? 1 : 0,
            transition: "opacity 450ms ease-out",
            animation:  msgState === "in"
              ? "msgIn 400ms cubic-bezier(0.2,0.65,0.3,0.9) 80ms forwards"
              : "msgOut 280ms ease-in forwards",
          }}>
            {msg.sub}
          </p>
        </div>

      </div>
    </div>
  );
}
