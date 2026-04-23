import { useState, useEffect } from "react";
import ClarityLogo from "../components/ClarityLogo";
import ShareOverlay from "../screens/ShareOverlay";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INDIGO = "#4361EE";

function triggerHaptic() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export default function ResultPrimary({ type, profile, safeResult, onGoDeep }) {
  const [phase,      setPhase]      = useState(0);
  const [btnPressed, setBtnPressed] = useState(false);
  const [exiting,    setExiting]    = useState(false);
  const [showShare,      setShowShare]      = useState(false);
  const [recognitionScale, setRecognitionScale] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1500);
    const t4 = setTimeout(() => setPhase(4), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  const mirror = safeResult?.summary || profile?.description || "";

  const fade = (show, delay = 0) => ({
    opacity:    show ? 1 : 0,
    transform:  show ? "translateY(0)" : "translateY(18px)",
    transition: `opacity 550ms ease-out ${delay}ms, transform 550ms ease-out ${delay}ms`,
  });

  // CTA tap → "snap & release" — brief recognition moment before overlay
  const handleCTAClick = () => {
    if (exiting) return;
    triggerHaptic();
    setRecognitionScale(true);
    setTimeout(() => {
      setRecognitionScale(false);
      setShowShare(true);
    }, 480);
  };

  // "Weiter →" inside overlay → exit animation → navigate
  const handleShareContinue = () => {
    setShowShare(false);
    setExiting(true);
    setTimeout(() => onGoDeep(), 320);
  };

  const handleTouchStart = () => setBtnPressed(true);
  const handleTouchEnd   = () => { setBtnPressed(false); handleCTAClick(); };
  const handleMouseDown  = () => setBtnPressed(true);
  const handleMouseUp    = () => setBtnPressed(false);
  const handleMouseLeave = () => setBtnPressed(false);

  return (
    <>
      {showShare && (
        <ShareOverlay
          profile={profile}
          type={type}
          onContinue={handleShareContinue}
          onClose={() => setShowShare(false)}
        />
      )}

      <div style={{
        maxWidth:      430,
        margin:        "0 auto",
        padding:       "0 28px 80px",
        boxSizing:     "border-box",
        minHeight:     "100vh",
        fontFamily:    FF,
        display:       "flex",
        flexDirection: "column",
        opacity:    exiting ? 0 : 1,
        // recognitionScale: brief 1→1.02 "this hits" moment before overlay
        transform:  exiting
          ? "scale(0.97) translateY(-10px)"
          : recognitionScale ? "scale(1.02)" : "scale(1) translateY(0)",
        transition: exiting
          ? "opacity 300ms ease-in, transform 300ms ease-in"
          : recognitionScale ? "transform 300ms ease-out" : "transform 300ms ease-out",
        willChange: "opacity, transform",
      }}>

        {/* Logo */}
        <div style={{
          paddingTop:   44,
          marginBottom: 60,
          opacity:      phase >= 1 ? 0.55 : 0,
          transition:   "opacity 600ms ease-out 100ms",
        }}>
          <ClarityLogo size="sm" centered={false} />
        </div>

        {/* ① HOOK */}
        <div style={{ ...fade(phase >= 1), marginBottom: 32 }}>
          <p style={{
            fontSize:      "clamp(39px, 8vw, 42px)",
            fontWeight:    800,
            lineHeight:    1.15,
            letterSpacing: "-0.02em",
            color:         "#111008",
            margin:        0,
          }}>
            {profile.hook}
          </p>
        </div>

        {/* ② MICRO MIRROR */}
        <div style={{ ...fade(phase >= 2), marginBottom: 36 }}>
          <p style={{
            fontSize:   17,
            fontWeight: 400,
            lineHeight: 1.65,
            color:      "rgba(15,23,42,0.62)",
            margin:     0,
          }}>
            {mirror}
          </p>
        </div>

        {/* ③ IDENTITY SHIFT */}
        <div style={{ ...fade(phase >= 3), marginBottom: 0 }}>
          <div style={{ borderLeft: `3px solid ${INDIGO}`, paddingLeft: 18 }}>
            <p style={{
              fontSize:   17,
              fontWeight: 600,
              lineHeight: 1.55,
              color:      "#0f172a",
              margin:     0,
            }}>
              „{profile.identityShift}"
            </p>
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 48 }} />

        {/* ④ CTA */}
        <div style={fade(phase >= 4)}>
          <button
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onClick={handleCTAClick}
            style={{
              width:         "100%",
              padding:       "17px 24px",
              background:    INDIGO,
              color:         "#fff",
              border:        "none",
              borderRadius:  13,
              fontSize:      16,
              fontWeight:    700,
              letterSpacing: "-0.01em",
              cursor:        "pointer",
              fontFamily:    FF,
              transform:     btnPressed ? "scale(0.98)" : "scale(1)",
              transition:    "transform 150ms ease-out",
              WebkitTapHighlightColor: "transparent",
              userSelect:    "none",
              touchAction:   "manipulation",
            }}
          >
            Weiter — ich will Klarheit →
          </button>
          <p style={{
            textAlign:  "center",
            fontSize:   12,
            color:      "rgba(0,0,0,0.32)",
            margin:     "10px 0 0",
            fontWeight: 500,
          }}>
            Kein Account. Keine E-Mail.
          </p>
        </div>
      </div>
    </>
  );
}
