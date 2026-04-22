import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import ClarityLogo from "../components/ClarityLogo";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INDIGO = "#4361EE";

function triggerHaptic() {
  if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(10);
}

// Generates a PNG blob from a DOM node at 3× pixel ratio (→ ~1080px wide on 360px card)
async function captureCard(node) {
  return toPng(node, {
    pixelRatio:  3,
    cacheBust:   true,
    backgroundColor: "#ffffff",
    style: {
      // Ensure shadows and borders render fully in the capture
      overflow: "visible",
    },
  });
}

// dataURL → File object (for navigator.share files)
function dataUrlToFile(dataUrl, filename) {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const bytes = atob(data);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new File([arr], filename, { type: mime });
}

export default function ShareOverlay({ profile, type, onContinue, onClose }) {
  const [vis,      setVis]      = useState(false);
  const [btnVis,   setBtnVis]   = useState(false);
  const [sharing,  setSharing]  = useState(false); // loading state during image gen
  const [copied,   setCopied]   = useState(false);
  const [exiting,  setExiting]  = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVis(true),    30);
    const t2 = setTimeout(() => setBtnVis(true), 180);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const dismiss = (callback) => {
    setExiting(true);
    setTimeout(() => { setVis(false); callback?.(); }, 260);
  };

  const handleContinue = () => { triggerHaptic(); dismiss(onContinue); };

  const handleShare = async () => {
    if (sharing) return;
    triggerHaptic();
    setSharing(true);

    const shareText =
      `Das hat mich gerade ziemlich genau getroffen.\n\n"${profile.identityShift}"\n\n→ clarity.app`;
    const shareUrl  = "https://clarity.app";

    try {
      // 1. Generate image from card
      const dataUrl = await captureCard(cardRef.current);
      const file    = dataUrlToFile(dataUrl, "clarity-profil.png");

      // 2. Web Share API with image file
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          title: "Clarity",
          text:  shareText,
          url:   shareUrl,
          files: [file],
        });
        setSharing(false);
        return;
      }

      // 3. Fallback A: Web Share without files (text + URL only)
      if (navigator.share) {
        await navigator.share({
          title: "Clarity",
          text:  shareText,
          url:   shareUrl,
        });
        setSharing(false);
        return;
      }

      // 4. Fallback B: download image + copy text to clipboard
      const link    = document.createElement("a");
      link.href     = dataUrl;
      link.download = "clarity-profil.png";
      link.click();

      await navigator.clipboard.writeText(shareText + "\n\n" + shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);

    } catch (err) {
      // User cancelled or error — silent fail
      console.warn("Share cancelled or failed:", err);
    }

    setSharing(false);
  };

  const sheetVisible = vis && !exiting;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) dismiss(onClose); }}
      style={{
        position:      "fixed",
        inset:          0,
        zIndex:         200,
        display:        "flex",
        alignItems:     "flex-end",
        justifyContent: "center",
        background:     sheetVisible ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0)",
        backdropFilter: sheetVisible ? "blur(8px)" : "blur(0px)",
        WebkitBackdropFilter: sheetVisible ? "blur(8px)" : "blur(0px)",
        transition:     "background 320ms ease, backdrop-filter 320ms ease",
      }}
    >
      <div style={{
        width:         "100%",
        maxWidth:       480,
        background:    "#ffffff",
        borderRadius:  "22px 22px 0 0",
        padding:       "24px 24px 48px",
        boxSizing:     "border-box",
        fontFamily:    FF,
        opacity:       sheetVisible ? 1 : 0,
        transform:     sheetVisible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.98)",
        transition:    "opacity 300ms cubic-bezier(0.2,0.65,0.3,0.9), transform 300ms cubic-bezier(0.2,0.65,0.3,0.9)",
        willChange:    "opacity, transform",
      }}>

        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "rgba(0,0,0,0.10)",
          margin: "0 auto 22px",
        }} />

        {/* Headline */}
        <p style={{
          fontSize:      18,
          fontWeight:    800,
          color:         "#0f172a",
          margin:        "0 0 6px",
          lineHeight:    1.3,
          letterSpacing: "-0.01em",
        }}>
          Das ist unangenehm präzise.
        </p>
        <p style={{
          fontSize:   14,
          color:      "rgba(0,0,0,0.42)",
          margin:     "0 0 20px",
          lineHeight: 1.55,
        }}>
          Du kannst das teilen. Oder einfach kurz wirken lassen.
        </p>

        {/* ─── SHARE CARD — this is what gets captured as image ─── */}
        <div
          ref={cardRef}
          style={{
            background:   "#ffffff",
            border:       "1px solid rgba(0,0,0,0.09)",
            borderRadius: 16,
            padding:      "22px 20px 20px",
            marginBottom: 8,
            boxShadow:    "0 12px 48px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.08)",
          }}
        >
          {/* Type */}
          <p style={{
            fontSize:      10,
            fontWeight:    700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color:         "rgba(0,0,0,0.36)",
            margin:        "0 0 12px",
          }}>
            {type}
          </p>

          {/* Hook — strong but not dominant */}
          <p style={{
            fontSize:      "clamp(20px, 5vw, 24px)",
            fontWeight:    700,
            lineHeight:    1.3,
            letterSpacing: "-0.02em",
            color:         "rgba(0,0,0,0.72)",
            margin:        "0 0 20px",
          }}>
            {profile.hook}
          </p>

          {/* Identity shift — the self-statement, visual center */}
          <p style={{
            fontSize:   18,
            fontWeight: 600,
            lineHeight: 1.55,
            color:      "#0f172a",
            margin:     "0 0 18px",
            fontStyle:  "italic",
            paddingTop:  18,
            borderTop:  "1px solid rgba(0,0,0,0.08)",
          }}>
            „{profile.identityShift}"
          </p>

          {/* Branding */}
          <div style={{ opacity: 0.32 }}>
            <ClarityLogo size="sm" centered={false} />
          </div>
        </div>

        {/* Social proof */}
        <p style={{
          textAlign:     "center",
          fontSize:      12,
          color:         "rgba(0,0,0,0.35)",
          margin:        "0 0 20px",
          letterSpacing: "0.02em",
        }}>
          Schon über 1.000 Mal geteilt
        </p>

        {/* CTAs */}
        <div style={{
          opacity:    btnVis ? 1 : 0,
          transform:  btnVis ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 280ms ease, transform 280ms ease",
        }}>
          {/* Primary */}
          <button
            onClick={handleContinue}
            style={{
              width:         "100%",
              padding:       "15px 24px",
              background:    INDIGO,
              color:         "#fff",
              border:        "none",
              borderRadius:  12,
              fontSize:      15,
              fontWeight:    700,
              cursor:        "pointer",
              fontFamily:    FF,
              letterSpacing: "-0.01em",
              marginBottom:  14,
              WebkitTapHighlightColor: "transparent",
              touchAction:   "manipulation",
            }}
          >
            Weiter →
          </button>

          {/* Share text link */}
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleShare}
              disabled={sharing}
              style={{
                background:  "none",
                border:      "none",
                cursor:      sharing ? "default" : "pointer",
                fontFamily:  FF,
                fontSize:    14,
                fontWeight:  500,
                color:       copied  ? "#059669"
                           : sharing ? "rgba(0,0,0,0.18)"
                           :           "rgba(0,0,0,0.28)",
                padding:     "4px 8px",
                transition:  "color 200ms ease",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
            >
              {copied  ? "Kopiert ✓"
             : sharing ? "Wird vorbereitet…"
             :           "→ Teilen"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
