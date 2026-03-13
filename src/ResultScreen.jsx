import { useState, useEffect, useRef } from "react";
import {
  generateProfileLink,
  SCORE_COLORS,
  SCORE_ORDER,
  scorePct,
  ScoreIcon,
  ClarityProfileView,
} from "./shared.jsx";

function ClarityShareWrapper({ result, wrapperRef }) {
  return (
    <div
      ref={wrapperRef}
      style={{
        width: 1200,
        minHeight: 1600,
        background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Centered profile content at 700px max-width */}
      <div style={{ width: "100%", maxWidth: 700 }}>
        <ClarityProfileView
          result={result}
          heroVis={true}
          barsOn={true}
          insightVis={true}
          isStatic={true}
          showInsights={false}
        />
      </div>

      {/* Footer wordmark */}
      <div style={{
        fontSize: 11, letterSpacing: "0.38em", textTransform: "uppercase",
        color: "#000", opacity: 0.20, marginTop: 56, paddingBottom: 72,
      }}>
        clarity.ai
      </div>
    </div>
  );
}

function ResultSection({ result }) {
  // Staggered micro-reward animation states
  const [vis,          setVis]          = useState(false);   // outer wrapper
  const [heroVis,      setHeroVis]      = useState(false);   // 1. header
  const [barsOn,       setBarsOn]       = useState(false);   // 2. score bars
  const [insightVis,   setInsightVis]   = useState(false);   // 3. insight + rest
  const [copiedLink,   setCopiedLink]   = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [shareConfirm, setShareConfirm] = useState(false);
  const [hoverCta,     setHoverCta]     = useState(false);
  const [hoverImg,     setHoverImg]     = useState(false);
  const [hoverLink,    setHoverLink]    = useState(false);
  const [hoverNative,  setHoverNative]  = useState(false);
  const shareWrapperRef      = useRef(null);
  // Deferred share wrapper: avoid laying out the 1200×1600 DOM node during
  // the reveal animation. Mounts 2.5 s after result appears.
  const [shareWrapperMounted, setShareWrapperMounted] = useState(false);

  useEffect(() => {
    // Scroll to top so reveal animation is fully in view
    window.scrollTo({ top: 0, behavior: "instant" });
    // Staggered reveal: title → 0ms, bars → 300ms, insights → 700ms
    const t0 = setTimeout(() => setVis(true),              0);
    const t1 = setTimeout(() => setHeroVis(true),          0);
    const t2 = setTimeout(() => setBarsOn(true),           300);
    const t3 = setTimeout(() => setInsightVis(true),       700);
    // Mount the 1200×1600 share wrapper only after animations have settled
    const t4 = setTimeout(() => setShareWrapperMounted(true), 2500);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2);
                   clearTimeout(t3); clearTimeout(t4); };
  }, []);

  // ── Share handlers ──────────────────────────────────────────────────────────
  const copyProfileLink = async () => {
    const link = generateProfileLink(result);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (_) {}
  };

  const nativeShare = async () => {
    const profileLink = generateProfileLink(result);
    const shareData = { title: "Mein Clarity Profil", text: result.summary || "Mein persönliches Klarheitsprofil von Clarity.", url: profileLink };
    if (navigator.share) {
      try { await navigator.share(shareData); }
      catch (e) { /* cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(profileLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2200); }
      catch (_) {}
    }
  };

  const generateShareImage = async () => {
    if (generating) return;
    setGenerating(true);
    // If the share wrapper hasn't mounted yet (user tapped fast), mount it now
    // and give React one frame to render before capturing.
    if (!shareWrapperMounted) {
      setShareWrapperMounted(true);
      await new Promise((r) => setTimeout(r, 80));
    }
    if (!shareWrapperRef.current) { setGenerating(false); return; }
    try {
      const { toPng: _toPng } = await import("html-to-image");
      // Capture at full 1200×1600 resolution (pixelRatio: 1 — already large)
      const dataUrl = await _toPng(shareWrapperRef.current, {
        cacheBust: true,
        pixelRatio: 1,
        style: { borderRadius: "0px" },
      });
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "clarity-profile.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) { await navigator.share({ title: "Mein Clarity Profil", files: [file] }); setGenerating(false); return; }
        } catch (e) { /* fall through */ }
      }
      const a = document.createElement("a"); a.download = "clarity-profile.png"; a.href = dataUrl; a.click();
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 3500);
    } catch (err) {
      const profileLink = generateProfileLink(result);
      try { await navigator.clipboard.writeText(profileLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2200); }
      catch (_) {}
    } finally { setGenerating(false); }
  };

  const BTN = (label, onClick, hover, setHover, opts = {}) => (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={opts.disabled}
      style={{
        border: `1px solid ${hover ? "transparent" : "rgba(0,0,0,0.18)"}`,
        background: hover ? "#000" : (opts.dark ? "#000" : "#fff"),
        color: hover ? "#fff" : (opts.dark ? "#fff" : "#000"),
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: 13, letterSpacing: "0.14em",
        padding: "16px 32px", borderRadius: 4,
        cursor: opts.disabled ? "wait" : "pointer",
        transition: "background 200ms, color 200ms, border 200ms",
        opacity: opts.disabled ? 0.55 : 1,
        width: "100%", maxWidth: 340,
        ...opts.style,
      }}
    >
      {label}
    </button>
  );

  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : "translateY(24px)",
      transition: "opacity 700ms ease, transform 700ms ease",
      paddingBottom: 80,
    }}>

      {/* ── PROFILE VIEW — ClarityProfileView is the single source of truth ─── */}
      <ClarityProfileView
        result={result}
        heroVis={heroVis}
        barsOn={barsOn}
        insightVis={insightVis}
        isStatic={false}
      />

      {/* ── NEXT STEP CTA — Part 4: marginBottom 32 before this divider ──────── */}
      <div style={{
        maxWidth: 600, margin: "32px auto 0", padding: "48px 24px 52px",
        textAlign: "center",
        borderTop: "1px solid rgba(0,0,0,0.07)",
      }}>
        <div style={{
          fontSize: 22, fontWeight: 600, color: "#000",
          letterSpacing: "-0.01em", marginBottom: 8, lineHeight: 1.3,
        }}>
          Willst du tiefer gehen?
        </div>
        <div style={{ fontSize: 18, color: "#000", opacity: 0.50, marginBottom: 28, lineHeight: 1.6 }}>
          Entdecke, was wirklich möglich ist.
        </div>
        <button
          onMouseEnter={() => setHoverCta(true)}
          onMouseLeave={() => setHoverCta(false)}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            height: 56, padding: "0 32px",
            background: hoverCta ? "#1a1a1a" : "#000",
            color: "#fff", border: "none",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 16, fontWeight: 600, borderRadius: 16, cursor: "pointer",
            transition: "background 200ms, transform 150ms",
            transform: hoverCta ? "scale(1.03)" : "scale(1)",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            marginBottom: 12,
          }}
        >
          Clarity System starten
        </button>
        <div style={{ fontSize: 14, color: "#000", opacity: 0.45, letterSpacing: "0.01em" }}>
          7 Tage kostenlos testen
        </div>
      </div>

      {/* ── SHARE SECTION ────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "36px 24px 0",
        borderTop: "1px solid rgba(0,0,0,0.07)", textAlign: "center",
      }}>
        <div style={{
          fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "#000", opacity: 0.35, marginBottom: 24,
        }}>
          Profil teilen
        </div>

        {/* Share confirmation toast */}
        {shareConfirm && (
          <div style={{
            maxWidth: 340, width: "100%",
            background: "linear-gradient(135deg, rgba(61,220,151,0.11), rgba(79,140,255,0.09))",
            border: "1px solid rgba(61,220,151,0.28)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 16, textAlign: "left",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 3 }}>
              Profilbild gespeichert.
            </div>
            <div style={{ fontSize: 14, color: "#000", opacity: 0.52, lineHeight: 1.6 }}>
              Teile dein Klarheitsprofil mit Freunden.
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {BTN(generating ? "Wird erstellt…" : "Profilbild teilen", generateShareImage, hoverImg, setHoverImg, { disabled: generating })}
          {BTN(copiedLink ? "✓ Link kopiert" : "Profil-Link kopieren", copyProfileLink, hoverLink, setHoverLink)}
          {BTN("Profil teilen", nativeShare, hoverNative, setHoverNative)}
        </div>
      </div>

      {/* Hidden share wrapper — deferred until 2.5s after result to avoid
           blocking the reveal animation with a 1200×1600 layout. */}
      {shareWrapperMounted && (
        <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
          <ClarityShareWrapper result={result} wrapperRef={shareWrapperRef} />
        </div>
      )}
    </div>
  );
}

// ── ChatMessage — memoized to prevent re-rendering old messages ───────────────
// Each message is stable once added; only the newest message ever changes.

export default ResultSection;
