import { useState, useEffect } from "react";
import ClarityLogo from "../components/ClarityLogo";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export default function ResultPrimary({ type, profile, safeResult, onShare, onGoDeep, copiedLink }) {
  const [vis, setVis]         = useState(false);
  const [btnPressed, setBtnPressed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(t);
  }, []);

  const fadeUp = (delay = 0) => ({
    opacity:    vis ? 1 : 0,
    transform:  vis ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 550ms ease ${delay}ms, transform 550ms ease ${delay}ms`,
  });

  return (
    <div style={{
      maxWidth:       520,
      margin:         "0 auto",
      padding:        "48px 24px 64px",
      minHeight:      "100vh",
      display:        "flex",
      flexDirection:  "column",
      fontFamily:     FF,
      boxSizing:      "border-box",
      textAlign:      "center",
    }}>

      {/* Logo */}
      <div style={{ ...fadeUp(0), marginBottom: 32, opacity: vis ? 0.35 : 0 }}>
        <ClarityLogo size="sm" centered={true} />
      </div>

      {/* Type label */}
      <div style={{ ...fadeUp(100), marginBottom: 24 }}>
        <span style={{
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color:         "rgba(0,0,0,0.28)",
        }}>
          {type}
        </span>
      </div>

      {/* Main hook — big, bold, the core insight */}
      <div style={{ ...fadeUp(180), marginBottom: 32 }}>
        <p style={{
          fontSize:      "clamp(34px, 7.5vw, 48px)",
          fontWeight:    800,
          lineHeight:    1.1,
          letterSpacing: "-0.025em",
          color:         "#0f172a",
          margin:        0,
        }}>
          {profile.hook}
        </p>
      </div>

      {/* Pattern — the mirror sentence */}
      <div style={{ ...fadeUp(280), marginBottom: 8 }}>
        <p style={{
          fontSize:   17,
          fontWeight: 400,
          lineHeight: 1.6,
          color:      "rgba(0,0,0,0.50)",
          margin:     0,
        }}>
          {safeResult.pattern || profile.description}
        </p>
      </div>

      {/* FOMO */}
      <div style={{ ...fadeUp(340), marginBottom: 40 }}>
        <p style={{
          fontSize:   14,
          fontWeight: 400,
          lineHeight: 1.5,
          color:      "rgba(0,0,0,0.32)",
          margin:     0,
        }}>
          {profile.fomo}
        </p>
      </div>

      {/* Nächster Schritt */}
      <div style={{ ...fadeUp(400), marginBottom: 48 }}>
        <p style={{
          fontSize:      10,
          fontWeight:    600,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color:         "rgba(0,0,0,0.28)",
          margin:        "0 0 10px",
        }}>
          Dein nächster Schritt
        </p>
        <p style={{
          fontSize:   18,
          fontWeight: 700,
          lineHeight: 1.4,
          color:      "#0f172a",
          margin:     0,
        }}>
          {safeResult.suggestedAction || profile.action}
        </p>
      </div>

      {/* Identity shift — italic quote */}
      <div style={{ ...fadeUp(480), marginBottom: 56 }}>
        <p style={{
          fontSize:   17,
          fontStyle:  "italic",
          lineHeight: 1.55,
          color:      "rgba(0,0,0,0.45)",
          margin:     0,
        }}>
          "{profile.identityShift}"
        </p>
      </div>

      {/* Share CTA */}
      <div style={{ ...fadeUp(560), marginBottom: 12 }}>
        <button
          onClick={() => { setBtnPressed(true); onShare(); setTimeout(() => setBtnPressed(false), 300); }}
          style={{
            width:         "100%",
            height:        56,
            background:    "#0f172a",
            color:         "#fff",
            border:        "none",
            borderRadius:  14,
            fontSize:      16,
            fontWeight:    600,
            fontFamily:    FF,
            cursor:        "pointer",
            letterSpacing: "0.01em",
            transform:     btnPressed ? "scale(0.97)" : "scale(1)",
            transition:    "transform 120ms ease",
          }}
        >
          {copiedLink ? "Link kopiert ✓" : "Das trifft — teilen"}
        </button>
      </div>

      {/* Social proof */}
      <div style={{ ...fadeUp(600), marginBottom: 4 }}>
        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.28)", margin: 0 }}>
          12 Menschen teilen das gerade
        </p>
      </div>

      {/* Microtext */}
      <div style={{ ...fadeUp(620), marginBottom: 48 }}>
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.22)", margin: 0 }}>
          Die meisten erkennen sich. Wenige verändern sich.
        </p>
      </div>

      {/* Tiefer gehen */}
      <div style={fadeUp(660)}>
        <button
          onClick={onGoDeep}
          style={{
            background:    "none",
            border:        "none",
            cursor:        "pointer",
            fontFamily:    FF,
            padding:       0,
            textAlign:     "center",
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", margin: "0 0 4px" }}>
            Tiefer gehen
          </p>
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.35)", margin: 0 }}>
            Clarity kann dich im Alltag begleiten.
          </p>
        </button>
      </div>
    </div>
  );
}
