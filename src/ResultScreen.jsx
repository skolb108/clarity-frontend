import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   Section definitions — label, field key, and display variant.
   Variant "highlight" gets the visually emphasized treatment.
───────────────────────────────────────────────────────────── */
const SECTIONS = [
  { key: "core_problem",       label: "Das eigentliche Problem",   variant: "default"   },
  { key: "hidden_pattern",     label: "Das verborgene Muster",     variant: "default"   },
  { key: "clarity_statement",  label: "Deine Erkenntnis",          variant: "highlight" },
  { key: "recommended_action", label: "Dein nächster Schritt",     variant: "action"    },
  { key: "habit",              label: "Deine tägliche Gewohnheit", variant: "default"   },
  { key: "identity_shift",     label: "Deine neue Identität",      variant: "default"   },
];

/* ─────────────────────────────────────────────────────────────
   InsightSection — renders one labeled section of the profile.
   Variants:
     default   — standard label + body text
     highlight — enlarged, background-highlighted clarity statement
     action    — accent-left-border treatment for the action step
───────────────────────────────────────────────────────────── */
function InsightSection({ label, text, variant, visible }) {
  if (!text) return null;

  const baseWrapper = {
    opacity:    visible ? 1 : 0,
    transform:  visible ? "none" : "translateY(16px)",
    transition: "opacity 600ms ease, transform 600ms ease",
    maxWidth:   600,
    margin:     "0 auto",
    padding:    "0 24px",
  };

  // ── HIGHLIGHT: clarity_statement ──────────────────────────
  if (variant === "highlight") {
    return (
      <div style={{ ...baseWrapper, marginBottom: 40 }}>
        <div style={{
          background:   "linear-gradient(135deg, rgba(79,140,255,0.07) 0%, rgba(156,107,255,0.06) 100%)",
          border:       "1px solid rgba(79,140,255,0.18)",
          borderRadius: 16,
          padding:      "32px 28px",
          textAlign:    "center",
          position:     "relative",
        }}>
          {/* Accent dot */}
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "linear-gradient(135deg, #4F8CFF, #9C6BFF)",
            margin: "0 auto 16px",
          }} />
          <div style={{
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#4F8CFF", fontWeight: 600, marginBottom: 18,
          }}>
            {label}
          </div>
          <div style={{
            fontSize:   22,
            fontWeight: 400,
            fontStyle:  "italic",
            color:      "#000",
            lineHeight: 1.55,
          }}>
            {text}
          </div>
        </div>
      </div>
    );
  }

  // ── ACTION: recommended_action ────────────────────────────
  if (variant === "action") {
    return (
      <div style={{ ...baseWrapper, marginBottom: 40 }}>
        <div style={{
          borderLeft:  "3px solid #3DDC97",
          paddingLeft: 20,
          paddingTop:  4,
          paddingBottom: 4,
        }}>
          <div style={{
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#3DDC97", fontWeight: 600, marginBottom: 10,
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 18, fontWeight: 400, color: "#000",
            lineHeight: 1.6, opacity: 0.85,
          }}>
            {text}
          </div>
        </div>
      </div>
    );
  }

  // ── DEFAULT ────────────────────────────────────────────────
  return (
    <div style={{ ...baseWrapper, marginBottom: 40 }}>
      <div style={{
        fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
        color: "#000", opacity: 0.35, fontWeight: 600, marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 18, fontWeight: 400, color: "#000",
        lineHeight: 1.65, opacity: 0.78,
      }}>
        {text}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ClarityShareWrapper — static 1200×1600 layout used by
   html-to-image to generate the share card PNG.
   Rendered off-screen; never visible to the user.
───────────────────────────────────────────────────────────── */
function ClarityShareWrapper({ result, wrapperRef }) {
  return (
    <div
      ref={wrapperRef}
      style={{
        width: 1200, minHeight: 1600,
        background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        padding: "100px 0 80px",
      }}
    >
      {/* Wordmark */}
      <div style={{
        fontSize: 11, letterSpacing: "0.42em", textTransform: "uppercase",
        color: "#000", opacity: 0.25, marginBottom: 64,
      }}>
        clarity
      </div>

      {/* Headline */}
      <div style={{
        fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase",
        color: "#4F8CFF", opacity: 0.80, marginBottom: 28, fontWeight: 600,
      }}>
        Deine Clarity Erkenntnis
      </div>

      {/* Sections — static, all visible */}
      <div style={{ width: "100%", maxWidth: 700, padding: "0 60px" }}>
        {SECTIONS.map(({ key, label, variant }) => (
          result[key] ? (
            <div key={key} style={{ marginBottom: 52 }}>
              {variant === "highlight" ? (
                <div style={{
                  background: "linear-gradient(135deg, rgba(79,140,255,0.08), rgba(156,107,255,0.06))",
                  border: "1px solid rgba(79,140,255,0.18)",
                  borderRadius: 16, padding: "40px 44px", textAlign: "center",
                }}>
                  <div style={{
                    fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "#4F8CFF", fontWeight: 600, marginBottom: 20,
                  }}>{label}</div>
                  <div style={{ fontSize: 28, fontStyle: "italic", color: "#000", lineHeight: 1.5 }}>
                    {result[key]}
                  </div>
                </div>
              ) : variant === "action" ? (
                <div style={{ borderLeft: "3px solid #3DDC97", paddingLeft: 28 }}>
                  <div style={{
                    fontSize: 13, letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "#3DDC97", fontWeight: 600, marginBottom: 12,
                  }}>{label}</div>
                  <div style={{ fontSize: 22, color: "#000", lineHeight: 1.6, opacity: 0.85 }}>
                    {result[key]}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
                    color: "#000", opacity: 0.30, fontWeight: 600, marginBottom: 12,
                  }}>{label}</div>
                  <div style={{ fontSize: 22, color: "#000", lineHeight: 1.65, opacity: 0.75 }}>
                    {result[key]}
                  </div>
                </div>
              )}
            </div>
          ) : null
        ))}
      </div>

      {/* Footer */}
      <div style={{
        fontSize: 11, letterSpacing: "0.38em", textTransform: "uppercase",
        color: "#000", opacity: 0.18, marginTop: 60,
      }}>
        clarity.ai
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ResultSection — main component
───────────────────────────────────────────────────────────── */
function ResultSection({ result }) {
  // Staggered reveal: wrapper → header → sections (staggered per-section)
  const [vis,          setVis]          = useState(false);
  const [headerVis,    setHeaderVis]    = useState(false);
  const [sectionVis,   setSectionVis]   = useState([false, false, false, false, false, false]);
  const [copiedStatement, setCopiedStatement] = useState(false);
  const [hoverCopy,    setHoverCopy]    = useState(false);
  const [hoverCta,     setHoverCta]     = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [shareConfirm, setShareConfirm] = useState(false);
  const [hoverImg,     setHoverImg]     = useState(false);
  const [hoverNative,  setHoverNative]  = useState(false);
  const [shareWrapperMounted, setShareWrapperMounted] = useState(false);
  const shareWrapperRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });

    const timers = [];

    // Outer wrapper fades in first
    timers.push(setTimeout(() => setVis(true), 0));
    timers.push(setTimeout(() => setHeaderVis(true), 80));

    // Each section staggers in 150ms apart, starting at 300ms
    SECTIONS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setSectionVis((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, 300 + i * 150));
    });

    // Defer the 1200×1600 share DOM node until after animations settle
    timers.push(setTimeout(() => setShareWrapperMounted(true), 2500));

    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Copy clarity_statement to clipboard ──────────────────────────────────
  const copyInsight = async () => {
    try {
      await navigator.clipboard.writeText(result.clarity_statement || "");
      setCopiedStatement(true);
      setTimeout(() => setCopiedStatement(false), 2200);
    } catch (_) {}
  };

  // ── Generate and share/download the PNG share card ────────────────────────
  const generateShareImage = async () => {
    if (generating) return;
    setGenerating(true);
    if (!shareWrapperMounted) {
      setShareWrapperMounted(true);
      await new Promise((r) => setTimeout(r, 80));
    }
    if (!shareWrapperRef.current) { setGenerating(false); return; }
    try {
      const { toPng: _toPng } = await import("html-to-image");
      const dataUrl = await _toPng(shareWrapperRef.current, {
        cacheBust: true, pixelRatio: 1, style: { borderRadius: "0px" },
      });
      // Try native file-share first (mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "clarity-insight.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Meine Clarity Erkenntnis", files: [file] });
            setGenerating(false);
            return;
          }
        } catch (_) { /* fall through to download */ }
      }
      // Fallback: trigger download
      const a = document.createElement("a");
      a.download = "clarity-insight.png";
      a.href = dataUrl;
      a.click();
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 3500);
    } catch (_) {
      // Last resort: copy insight text
      await copyInsight();
    } finally {
      setGenerating(false);
    }
  };

  // ── Native share — text summary ───────────────────────────────────────────
  const nativeShare = async () => {
    const text = result.clarity_statement || "";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Meine Clarity Erkenntnis",
          text,
        });
      } catch (_) { /* cancelled */ }
    } else {
      await copyInsight();
    }
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
      opacity:   vis ? 1 : 0,
      transform: vis ? "none" : "translateY(24px)",
      transition: "opacity 700ms ease, transform 700ms ease",
      paddingBottom: 80,
    }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth:   600,
        margin:     "0 auto",
        padding:    "64px 24px 52px",
        textAlign:  "center",
        opacity:    headerVis ? 1 : 0,
        transform:  headerVis ? "none" : "translateY(12px)",
        transition: "opacity 600ms ease, transform 600ms ease",
      }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase",
          color: "#4F8CFF", fontWeight: 600, marginBottom: 16,
        }}>
          Deine Clarity Erkenntnis
        </div>
        {/* Divider accent */}
        <div style={{
          width: 32, height: 2, margin: "0 auto",
          background: "linear-gradient(90deg, #4F8CFF, #9C6BFF)",
          borderRadius: 2,
        }} />
      </div>

      {/* ── INSIGHT SECTIONS ──────────────────────────────────────────────── */}
      {SECTIONS.map(({ key, label, variant }, i) => (
        <InsightSection
          key={key}
          label={label}
          text={result[key]}
          variant={variant}
          visible={sectionVis[i]}
        />
      ))}

      {/* ── COPY INSIGHT BUTTON ───────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto 0", padding: "8px 24px 48px",
        display: "flex", justifyContent: "center",
      }}>
        <button
          onClick={copyInsight}
          onMouseEnter={() => setHoverCopy(true)}
          onMouseLeave={() => setHoverCopy(false)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: `1px solid ${hoverCopy ? "rgba(79,140,255,0.5)" : "rgba(79,140,255,0.25)"}`,
            background: hoverCopy ? "rgba(79,140,255,0.06)" : "transparent",
            color: "#4F8CFF",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 13, letterSpacing: "0.12em",
            padding: "14px 28px", borderRadius: 8,
            cursor: "pointer",
            transition: "background 200ms, border 200ms",
          }}
        >
          {/* Clipboard icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copiedStatement ? "✓ Kopiert" : "Erkenntnis kopieren"}
        </button>
      </div>

      {/* ── DIVIDER ───────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto",
        borderTop: "1px solid rgba(0,0,0,0.07)",
      }} />

      {/* ── NEXT STEP CTA ─────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "48px 24px 52px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 22, fontWeight: 600, color: "#000",
          letterSpacing: "-0.01em", marginBottom: 8, lineHeight: 1.3,
        }}>
          Willst du tiefer gehen?
        </div>
        <div style={{
          fontSize: 18, color: "#000", opacity: 0.50, marginBottom: 28, lineHeight: 1.6,
        }}>
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
        <div style={{ fontSize: 14, color: "#000", opacity: 0.45 }}>
          7 Tage kostenlos testen
        </div>
      </div>

      {/* ── SHARE SECTION ─────────────────────────────────────────────────── */}
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

        {shareConfirm && (
          <div style={{
            maxWidth: 340, width: "100%",
            background: "linear-gradient(135deg, rgba(61,220,151,0.11), rgba(79,140,255,0.09))",
            border: "1px solid rgba(61,220,151,0.28)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 16, textAlign: "left",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 3 }}>
              Bild gespeichert.
            </div>
            <div style={{ fontSize: 14, color: "#000", opacity: 0.52, lineHeight: 1.6 }}>
              Teile deine Erkenntnis mit Freunden.
            </div>
          </div>
        )}

        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          {BTN(
            generating ? "Wird erstellt…" : "Erkenntnis-Bild teilen",
            generateShareImage, hoverImg, setHoverImg, { disabled: generating }
          )}
          {BTN("Erkenntnis teilen", nativeShare, hoverNative, setHoverNative)}
        </div>
      </div>

      {/* Hidden share card — deferred 2.5s to avoid blocking reveal animation */}
      {shareWrapperMounted && (
        <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
          <ClarityShareWrapper result={result} wrapperRef={shareWrapperRef} />
        </div>
      )}
    </div>
  );
}

export default ResultSection;
