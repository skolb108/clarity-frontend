import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   Score constants — inlined, zero shared.jsx deps
───────────────────────────────────────────────────────────── */
const SCORE_COLORS = {
  Clarity:   "#4F8CFF",
  Energy:    "#FF8A4F",
  Strength:  "#9C6BFF",
  Direction: "#3DDC97",
  Action:    "#FF5A6F",
};
const SCORE_ORDER = ["Clarity", "Energy", "Strength", "Direction", "Action"];

// Raw score 4–25 → 0–75% display width (capped so bars never feel "full")
const scorePct = (v) => Math.min(Math.round(v * 3), 75);

// Fallback identity — shown when the backend returns identityModes: []
const IDENTITY_FALLBACK = { type: "Explorer", confidence: 60 };

/* ─────────────────────────────────────────────────────────────
   computeSocialStats — derives plausible social-proof numbers
   from the user's raw scores. Not real population data.

   percentile: user sits in the top X% of participants.
               Higher scores → lower percentile → more exclusive.
   floor:      realistic "average starting point" in %.
   ceiling:    aspirational target in %.
───────────────────────────────────────────────────────────── */
function computeSocialStats(scores) {
  const keys = SCORE_ORDER.filter(k => scores[k] != null);
  if (!keys.length) return { percentile: 35, floor: 45, ceiling: 90 };

  const avg = keys.reduce((s, k) => s + scores[k], 0) / keys.length;
  // avg raw range 4–25; midpoint ~14.5
  // Higher avg → smaller percentile number (user is further ahead)
  const percentile = Math.max(8, Math.min(48, Math.round(48 - (avg - 10) * 1.8)));
  const floor      = Math.max(30, Math.min(58, Math.round(30 + (avg / 25) * 28)));
  const ceiling    = Math.min(95, floor + 40);
  return { percentile, floor, ceiling };
}

/* ─────────────────────────────────────────────────────────────
   Inline SVG icons — 13×13, 2px stroke, no external library
───────────────────────────────────────────────────────────── */
const IconInsight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconShield = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconLightning = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconCompass = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const IconRocket = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   SectionLabel — 11px uppercase eyebrow, 0.18em letter-spacing.
   `color` renders the label in an accent color (used for the
   action/focus sections whose left-border carries the same hue).
───────────────────────────────────────────────────────────── */
const SectionLabel = ({ children, icon, color }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
    color: color || "#000",
    opacity: color ? 1 : 0.32,
    fontWeight: 600, marginBottom: 14,
  }}>
    {icon}
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   ScoreBar — animates 0 → target width.

   `animated` must be false on first render (bars at 0%).
   When the flag flips true the CSS width transition fires.
   Duration: 900ms ease-out per spec.
───────────────────────────────────────────────────────────── */
function ScoreBar({ name, value, animated }) {
  const pct   = animated ? scorePct(value) : 0;
  const color = SCORE_COLORS[name] || "#4F8CFF";

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 7,
      }}>
        <div style={{ fontSize: 14, color: "#000", opacity: 0.58, letterSpacing: "0.02em" }}>
          {name}
        </div>
        <div style={{ fontSize: 13, color, fontWeight: 600, opacity: 0.80 }}>
          {value}
        </div>
      </div>
      {/* Track */}
      <div style={{
        height: 6, borderRadius: 3,
        background: "rgba(0,0,0,0.07)", overflow: "hidden",
      }}>
        {/* Fill — CSS transition from 0% to target */}
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 3,
          background: color,
          transition: "width 900ms cubic-bezier(0.0, 0.0, 0.2, 1)",
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BulletList — 18px dot-prefixed list
───────────────────────────────────────────────────────────── */
function BulletList({ items, accentColor = "#4F8CFF" }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          marginBottom: i < items.length - 1 ? 12 : 0,
        }}>
          <span style={{
            display: "inline-block",
            width: 5, height: 5, borderRadius: "50%",
            background: accentColor,
            marginTop: 9, flexShrink: 0,
          }} />
          <span style={{ fontSize: 18, color: "#000", opacity: 0.75, lineHeight: 1.65 }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section — fade-up wrapper. Hidden until `visible` flips.
───────────────────────────────────────────────────────────── */
function Section({ visible, children, style = {} }) {
  return (
    <div style={{
      maxWidth:     600,
      margin:       "0 auto",
      padding:      "0 24px",
      marginBottom: 44,
      opacity:      visible ? 1 : 0,
      transform:    visible ? "none" : "translateY(18px)",
      transition:   "opacity 550ms ease, transform 550ms ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ClarityShareWrapper — 1200×1600 off-screen share card.
   Captured by html-to-image; never visible to the user.
───────────────────────────────────────────────────────────── */
function ClarityShareWrapper({ result, wrapperRef }) {
  const scores     = result.scores        || {};
  const rawIdent   = result.identityModes || [];
  const identModes = rawIdent.length > 0 ? rawIdent : [IDENTITY_FALLBACK];
  const { percentile } = computeSocialStats(scores);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: 1200, minHeight: 1600,
        background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
        display: "flex", flexDirection: "column", alignItems: "center",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        padding: "100px 60px 80px",
      }}
    >
      {/* Wordmark */}
      <div style={{
        fontSize: 11, letterSpacing: "0.42em", textTransform: "uppercase",
        color: "#000", opacity: 0.22, marginBottom: 48,
      }}>
        clarity
      </div>

      {/* Identity hero */}
      <div style={{ textAlign: "center", marginBottom: 64 }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.30em", textTransform: "uppercase",
          color: "#000", opacity: 0.26, fontWeight: 600, marginBottom: 16,
        }}>
          Dein Clarity Profil
        </div>
        <div style={{
          fontSize: 72, fontWeight: 700, letterSpacing: "-0.03em",
          color: "#000", lineHeight: 1.0, marginBottom: 16,
        }}>
          {identModes[0].type}
        </div>
        <div style={{ fontSize: 18, color: "#4F8CFF", fontWeight: 500 }}>
          {identModes[0].confidence}% Übereinstimmung
        </div>
        {identModes[1] && (
          <div style={{ marginTop: 12, fontSize: 16, color: "#000", opacity: 0.30 }}>
            + {identModes[1].type} · {identModes[1].confidence}%
          </div>
        )}
      </div>

      {/* Summary */}
      {result.summary && (
        <div style={{
          width: "100%", maxWidth: 780,
          background: "linear-gradient(135deg, rgba(79,140,255,0.08), rgba(156,107,255,0.06))",
          border: "1px solid rgba(79,140,255,0.18)",
          borderRadius: 20, padding: "52px 56px",
          textAlign: "center", marginBottom: 64,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "linear-gradient(135deg, #4F8CFF, #9C6BFF)",
            margin: "0 auto 20px",
          }} />
          <div style={{
            fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#000", opacity: 0.32, fontWeight: 600, marginBottom: 24,
          }}>
            Zusammenfassung
          </div>
          <div style={{ fontSize: 28, fontStyle: "italic", color: "#000", lineHeight: 1.55 }}>
            {result.summary}
          </div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 780 }}>
        {/* Scores */}
        {SCORE_ORDER.some(k => scores[k] != null) && (
          <div style={{ marginBottom: 56 }}>
            <div style={{
              fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 24,
            }}>Dein Profil</div>
            {SCORE_ORDER.map((k) => scores[k] != null && (
              <div key={k} style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 16, color: "#000", opacity: 0.58 }}>{k}</span>
                  <span style={{ fontSize: 14, color: SCORE_COLORS[k], fontWeight: 600 }}>{scores[k]}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.08)" }}>
                  <div style={{
                    height: "100%", width: `${scorePct(scores[k])}%`,
                    borderRadius: 3, background: SCORE_COLORS[k],
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comparison */}
        <div style={{
          background: "rgba(79,140,255,0.05)",
          border: "1px solid rgba(79,140,255,0.14)",
          borderRadius: 16, padding: "32px 36px", marginBottom: 40,
        }}>
          <div style={{
            fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#4F8CFF", fontWeight: 600, marginBottom: 14,
          }}>
            Vergleich mit anderen Nutzern
          </div>
          <div style={{ fontSize: 22, color: "#000", lineHeight: 1.55, opacity: 0.82 }}>
            Du liegst aktuell im oberen{" "}
            <strong style={{ fontWeight: 700 }}>{percentile}%</strong>{" "}
            aller Teilnehmenden.
          </div>
        </div>

        {/* Next focus */}
        {result.nextFocus && (
          <div style={{ borderLeft: "3px solid #3DDC97", paddingLeft: 28, marginBottom: 52 }}>
            <div style={{
              fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#3DDC97", fontWeight: 600, marginBottom: 12,
            }}>Nächster Fokus</div>
            <div style={{ fontSize: 22, color: "#000", lineHeight: 1.6, opacity: 0.85 }}>
              {result.nextFocus}
            </div>
          </div>
        )}
      </div>

      <div style={{
        fontSize: 11, letterSpacing: "0.38em", textTransform: "uppercase",
        color: "#000", opacity: 0.16, marginTop: 60,
      }}>
        clarity.ai
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ResultSection — main component

   Reveal → Impact → Curiosity structure:

   REVEAL  (user sees who they are and their core insight)
     0ms   outer wrapper fades in
    80ms   header eyebrow
   160ms   identity hero            ← WHO are you?
   400ms   summary card             ← WHAT does that mean?

   IMPACT  (numbers + social proof create the emotional peak)
   700ms   scores (main moment)     ← your profile
   900ms   barsReady → bars animate 0 → target
  1000ms   comparison block         ← "top X%"
  1300ms   potential block          ← "you could reach 90%+"

   CURIOSITY  (insights keep users reading & motivate action)
  1600ms   pattern
  1900ms   strengths
  2200ms   energy sources
  2500ms   next focus
  2800ms   suggested action
───────────────────────────────────────────────────────────── */
// Sections: 0=summary, 1=scores, 2=comparison, 3=potential,
//           4=pattern,  5=strengths, 6=energySources,
//           7=nextFocus, 8=suggestedAction
const SECTION_COUNT = 9;

function ResultSection({ result }) {
  const [vis,           setVis]           = useState(false);
  const [headerVis,     setHeaderVis]     = useState(false);
  const [identHeroVis,  setIdentHeroVis]  = useState(false);
  const [sectionVis,    setSectionVis]    = useState(() => Array(SECTION_COUNT).fill(false));
  const [barsReady,     setBarsReady]     = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [hoverCopy,     setHoverCopy]     = useState(false);
  const [hoverCta,      setHoverCta]      = useState(false);
  const [generating,    setGenerating]    = useState(false);
  const [shareConfirm,  setShareConfirm]  = useState(false);
  const [shareUrl,      setShareUrl]      = useState(null);  // revealed share URL box
  const [copiedLink,    setCopiedLink]    = useState(false); // copy-link button feedback
  const [hoverImg,      setHoverImg]      = useState(false);
  const [hoverNative,   setHoverNative]   = useState(false);
  const [shareWrapperMounted, setShareWrapperMounted] = useState(false);
  const shareWrapperRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = [];

    t.push(setTimeout(() => setVis(true),           0));
    t.push(setTimeout(() => setHeaderVis(true),    80));
    t.push(setTimeout(() => setIdentHeroVis(true), 160));

    // 300ms gaps between sections, starting at 400ms
    const BASE = 400, GAP = 300;
    for (let i = 0; i < SECTION_COUNT; i++) {
      t.push(setTimeout(() => {
        setSectionVis(prev => {
          const next = [...prev]; next[i] = true; return next;
        });
      }, BASE + i * GAP));
    }

    // barsReady fires 200ms after section 1 (scores) visible.
    // scores section delay = BASE + 1*GAP = 700ms → barsReady at 900ms.
    // The gap lets the Section fade-up finish before bar widths start moving.
    t.push(setTimeout(() => setBarsReady(true), BASE + 1 * GAP + 200));

    // Defer heavy 1200×1600 share DOM well past all animations
    t.push(setTimeout(() => setShareWrapperMounted(true), BASE + (SECTION_COUNT - 1) * GAP + 1500));

    return () => t.forEach(clearTimeout);
  }, []);

  /* ── handlers ──────────────────────────────────────────────────────────── */
  const copyInsight = async () => {
    try {
      await navigator.clipboard.writeText(result.summary || "");
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2200);
    } catch (_) {}
  };

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
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "clarity-profil.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Mein Clarity Profil", files: [file] });
            setGenerating(false);
            return;
          }
        } catch (_) { /* fall through to download */ }
      }
      const a = document.createElement("a");
      a.download = "clarity-profil.png";
      a.href = dataUrl;
      a.click();
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 3500);
    } catch (_) {
      await copyInsight();
    } finally {
      setGenerating(false);
    }
  };

  const nativeShare = async () => {
    // Build the public profile URL by Base64-encoding the full result object.
    // PublicProfile.jsx decodes this with: JSON.parse(atob(slug))
    const encoded  = btoa(JSON.stringify(result));
    const url      = "https://cla-ri-ty.netlify.app/p/" + encoded;

    // Always reveal the URL box so the user can see and copy the link
    setShareUrl(url);

    // Also trigger the native share dialog when available (mobile).
    // This is non-blocking — the box stays visible regardless of outcome.
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mein Clarity Profil",
          text:  "Mein Clarity Profil",
          url,
        });
      } catch (_) { /* user cancelled — URL box still visible */ }
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

  /* ── derived data ─────────────────────────────────────────────────────── */
  const scores              = result.scores        || {};
  const rawIdentModes       = result.identityModes  || [];
  const effectiveIdentModes = rawIdentModes.length > 0 ? rawIdentModes : [IDENTITY_FALLBACK];
  const { percentile, floor, ceiling } = computeSocialStats(scores);

  /* ── render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      opacity:    vis ? 1 : 0,
      transform:  vis ? "none" : "translateY(24px)",
      transition: "opacity 700ms ease, transform 700ms ease",
      paddingBottom: 80,
    }}>

      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "56px 24px 36px",
        textAlign: "center",
        opacity:    headerVis ? 1 : 0,
        transform:  headerVis ? "none" : "translateY(12px)",
        transition: "opacity 600ms ease, transform 600ms ease",
      }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase",
          color: "#4F8CFF", fontWeight: 600, marginBottom: 16,
        }}>
          Deine Clarity Erkenntnis
        </div>
        <div style={{
          width: 32, height: 2, margin: "0 auto",
          background: "linear-gradient(90deg, #4F8CFF, #9C6BFF)", borderRadius: 2,
        }} />
      </div>

      {/* ── IDENTITY HERO ─────────────────────────────────────────────────── */}
      {/* Always renders — effectiveIdentModes guarantees ≥1 entry (fallback).
          52px bold gives maximum visual weight. Centered on mobile.          */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "0 24px",
        marginBottom: 48, textAlign: "center",
        opacity:    identHeroVis ? 1 : 0,
        transform:  identHeroVis ? "none" : "translateY(14px)",
        transition: "opacity 700ms ease, transform 700ms ease",
      }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase",
          color: "#000", opacity: 0.26, fontWeight: 600, marginBottom: 12,
        }}>
          Dein Clarity Profil
        </div>

        {/* Identity type — 52px bold, primary focal point */}
        <div style={{
          fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em",
          color: "#000", lineHeight: 1.05, marginBottom: 14,
        }}>
          {effectiveIdentModes[0].type}
        </div>

        {/* Confidence — blue, 15px */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontSize: 15, color: "#4F8CFF", fontWeight: 500, letterSpacing: "0.02em",
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#4F8CFF", opacity: 0.55,
          }} />
          {effectiveIdentModes[0].confidence}% Übereinstimmung
        </div>

        {/* Secondary mode — muted footnote */}
        {effectiveIdentModes[1] && (
          <div style={{
            marginTop: 10, fontSize: 13,
            color: "#000", opacity: 0.28, letterSpacing: "0.04em",
          }}>
            + {effectiveIdentModes[1].type} · {effectiveIdentModes[1].confidence}%
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────
           REVEAL PHASE — Summary gives the insight its meaning
         ──────────────────────────────────────────────────────────────────── */}

      {/* ── SECTION 0 — SUMMARY ───────────────────────────────────────────── */}
      {/* 20px italic. The first sentence the user reads. Subtle gradient box. */}
      <Section visible={sectionVis[0]}>
        <div style={{
          background:   "linear-gradient(135deg, rgba(79,140,255,0.06) 0%, rgba(156,107,255,0.05) 100%)",
          border:       "1px solid rgba(79,140,255,0.15)",
          borderRadius: 16, padding: "26px 22px", textAlign: "center",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "linear-gradient(135deg, #4F8CFF, #9C6BFF)",
            margin: "0 auto 14px",
          }} />
          <div style={{
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#000", opacity: 0.30, fontWeight: 600, marginBottom: 16,
          }}>
            Zusammenfassung
          </div>
          <div style={{
            fontSize: 20, fontWeight: 400, fontStyle: "italic",
            color: "#000", lineHeight: 1.65, opacity: 0.85,
          }}>
            {result.summary}
          </div>
        </div>
      </Section>

      {/* ────────────────────────────────────────────────────────────────────
           IMPACT PHASE — scores + social proof create the emotional peak
         ──────────────────────────────────────────────────────────────────── */}

      {/* ── SECTION 1 — SCORES (MAIN MOMENT) ─────────────────────────────── */}
      {/* Moved immediately after summary so bars animate in the viewport.
          barsReady fires 200ms after this section becomes visible (at 900ms).
          Duration: 900ms ease-out.                                          */}
      {SCORE_ORDER.some(k => scores[k] != null) && (
        <Section visible={sectionVis[1]}>
          <SectionLabel>Dein Profil</SectionLabel>
          {SCORE_ORDER.map((key) =>
            scores[key] != null ? (
              <ScoreBar key={key} name={key} value={scores[key]} animated={barsReady} />
            ) : null
          )}
          {result.confidence != null && (
            <div style={{
              marginTop: 14,
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "#000", opacity: 0.30, letterSpacing: "0.08em",
            }}>
              <div style={{
                width: 4, height: 4, borderRadius: "50%",
                background: result.confidence >= 70 ? "#3DDC97" : "#FF8A4F",
              }} />
              Konfidenz {result.confidence}%
            </div>
          )}
        </Section>
      )}

      {/* ── SECTION 2 — COMPARISON BLOCK ─────────────────────────────────── */}
      {/* Social proof. Computed percentile from user scores.
          Blue tint to signal this is an external reference point.           */}
      <Section visible={sectionVis[2]}>
        <div style={{
          background: "rgba(79,140,255,0.04)",
          border: "1px solid rgba(79,140,255,0.13)",
          borderRadius: 14, padding: "20px 22px",
        }}>
          <SectionLabel color="#4F8CFF">Vergleich mit anderen Nutzern</SectionLabel>
          <div style={{ fontSize: 18, color: "#000", lineHeight: 1.65, opacity: 0.80 }}>
            Du liegst aktuell im oberen{" "}
            <strong style={{ fontWeight: 700, color: "#000", opacity: 1 }}>{percentile}%</strong>{" "}
            aller Teilnehmenden.
          </div>
          {/* Position bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{
              height: 4, borderRadius: 2,
              background: "rgba(79,140,255,0.10)", overflow: "hidden",
            }}>
              <div style={{
                height: "100%",
                width: barsReady ? `${100 - percentile}%` : "0%",
                borderRadius: 2,
                background: "linear-gradient(90deg, #4F8CFF, #9C6BFF)",
                transition: "width 1000ms cubic-bezier(0.0, 0.0, 0.2, 1)",
              }} />
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              marginTop: 5, fontSize: 10, color: "#000", opacity: 0.25,
              letterSpacing: "0.06em",
            }}>
              <span>0 %</span><span>50 %</span><span>100 %</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── SECTION 3 — POTENTIAL BLOCK ──────────────────────────────────── */}
      {/* Aspiration. Shows the user there is clear upside to continuing.
          Green tint signals growth, forward motion.                        */}
      <Section visible={sectionVis[3]}>
        <div style={{
          background: "rgba(61,220,151,0.04)",
          border: "1px solid rgba(61,220,151,0.15)",
          borderRadius: 14, padding: "20px 22px",
        }}>
          <SectionLabel color="#3DDC97">Dein Fortschrittspotenzial</SectionLabel>
          <div style={{ fontSize: 18, color: "#000", lineHeight: 1.65, opacity: 0.80, marginBottom: 10 }}>
            Viele Menschen starten in diesem Bereich bei etwa{" "}
            <strong style={{ fontWeight: 600 }}>{floor}–{floor + 15}%</strong>.
          </div>
          <div style={{ fontSize: 18, color: "#000", lineHeight: 1.65, opacity: 0.80 }}>
            Mit den richtigen Gewohnheiten kannst du über{" "}
            <strong style={{ fontWeight: 600 }}>{ceiling}%</strong> erreichen.
          </div>
        </div>
      </Section>

      {/* ────────────────────────────────────────────────────────────────────
           CURIOSITY PHASE — insights reward reading & motivate action
         ──────────────────────────────────────────────────────────────────── */}

      {/* Thin divider separates impact blocks from insight sections */}
      <div style={{ maxWidth: 600, margin: "-4px auto 44px", padding: "0 24px" }}>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />
      </div>

      {/* ── SECTION 4 — PATTERN ──────────────────────────────────────────── */}
      {result.pattern && (
        <Section visible={sectionVis[4]}>
          <SectionLabel icon={<IconInsight />}>Das verborgene Muster</SectionLabel>
          <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.65, opacity: 0.75 }}>
            {result.pattern}
          </div>
        </Section>
      )}

      {/* ── SECTION 5 — STRENGTHS ────────────────────────────────────────── */}
      {result.strengths?.length > 0 && (
        <Section visible={sectionVis[5]}>
          <SectionLabel icon={<IconShield />}>Deine Stärken</SectionLabel>
          <BulletList items={result.strengths} accentColor="#9C6BFF" />
        </Section>
      )}

      {/* ── SECTION 6 — ENERGY SOURCES ───────────────────────────────────── */}
      {result.energySources?.length > 0 && (
        <Section visible={sectionVis[6]}>
          <SectionLabel icon={<IconLightning />}>Deine Energiequellen</SectionLabel>
          <BulletList items={result.energySources} accentColor="#FF8A4F" />
        </Section>
      )}

      {/* ── SECTION 7 — NEXT FOCUS ───────────────────────────────────────── */}
      {result.nextFocus && (
        <Section visible={sectionVis[7]}>
          <div style={{
            borderLeft: "3px solid #3DDC97",
            paddingLeft: 20, paddingTop: 2, paddingBottom: 2,
          }}>
            <SectionLabel icon={<IconCompass />} color="#3DDC97">
              Dein nächster Fokus
            </SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.65, opacity: 0.82 }}>
              {result.nextFocus}
            </div>
          </div>
        </Section>
      )}

      {/* ── SECTION 8 — SUGGESTED ACTION ─────────────────────────────────── */}
      {result.suggestedAction && (
        <Section visible={sectionVis[8]}>
          <div style={{
            borderLeft: "3px solid #4F8CFF",
            paddingLeft: 20, paddingTop: 2, paddingBottom: 2,
          }}>
            <SectionLabel icon={<IconRocket />} color="#4F8CFF">
              Empfohlene Aktion
            </SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.65, opacity: 0.82 }}>
              {result.suggestedAction}
            </div>
          </div>
        </Section>
      )}

      {/* ── COPY SUMMARY BUTTON ───────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "0 24px 52px",
        display: "flex", justifyContent: "center",
      }}>
        <button
          onClick={copyInsight}
          onMouseEnter={() => setHoverCopy(true)}
          onMouseLeave={() => setHoverCopy(false)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: `1px solid ${hoverCopy ? "rgba(79,140,255,0.5)" : "rgba(79,140,255,0.22)"}`,
            background: hoverCopy ? "rgba(79,140,255,0.06)" : "transparent",
            color: "#4F8CFF",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 13, letterSpacing: "0.12em",
            padding: "14px 28px", borderRadius: 8,
            cursor: "pointer",
            transition: "background 200ms, border 200ms",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copiedSummary ? "✓ Kopiert" : "Zusammenfassung kopieren"}
        </button>
      </div>

      {/* ── DIVIDER ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
      </div>

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
        <div style={{ fontSize: 18, color: "#000", opacity: 0.46, marginBottom: 28, lineHeight: 1.6 }}>
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
        <div style={{ fontSize: 14, color: "#000", opacity: 0.38 }}>
          7 Tage kostenlos testen
        </div>
      </div>

      {/* ── SHARE SECTION ─────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "36px 24px 0",
        borderTop: "1px solid rgba(0,0,0,0.07)", textAlign: "center",
      }}>
        <div style={{
          fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 24,
        }}>
          Profil teilen
        </div>

        {shareConfirm && (
          <div style={{
            maxWidth: 340, width: "100%",
            background: "linear-gradient(135deg, rgba(61,220,151,0.10), rgba(79,140,255,0.08))",
            border: "1px solid rgba(61,220,151,0.26)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 16, textAlign: "left",
          }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#000", marginBottom: 3 }}>
              Bild gespeichert.
            </div>
            <div style={{ fontSize: 14, color: "#000", opacity: 0.50, lineHeight: 1.6 }}>
              Teile dein Klarheitsprofil mit Freunden.
            </div>
          </div>
        )}

        {/* ── SHARE URL BOX ─────────────────────────────────────────────────
             Revealed when the user clicks "Profil teilen". Shows the full
             public URL and a copy button. Stays visible until the user
             navigates away — no auto-dismiss, so they can copy at their pace.
           ─────────────────────────────────────────────────────────────────── */}
        {shareUrl && (
          <div style={{
            maxWidth: 340, width: "100%",
            background: "linear-gradient(135deg, rgba(79,140,255,0.06) 0%, rgba(156,107,255,0.04) 100%)",
            border: "1px solid rgba(79,140,255,0.20)",
            borderRadius: 12, padding: "14px 16px", marginBottom: 16, textAlign: "left",
          }}>
            {/* Eyebrow label */}
            <div style={{
              fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#4F8CFF", fontWeight: 600, marginBottom: 8, opacity: 0.80,
            }}>
              Dein Profil-Link
            </div>

            {/* URL display — monospace, truncated with ellipsis on narrow screens */}
            <div style={{
              fontSize: 12, color: "#000", opacity: 0.55,
              fontFamily: "ui-monospace, 'SF Mono', monospace",
              lineHeight: 1.5, wordBreak: "break-all",
              marginBottom: 12,
            }}>
              {shareUrl}
            </div>

            {/* Copy button */}
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                } catch (_) {}
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                fontSize: 12, letterSpacing: "0.10em",
                color: copiedLink ? "#3DDC97" : "#4F8CFF",
                background: "transparent", border: "none",
                padding: 0, cursor: "pointer",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontWeight: 600, transition: "color 200ms",
              }}
            >
              {copiedLink ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Kopiert
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Link kopieren
                </>
              )}
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {BTN(
            generating ? "Wird erstellt…" : "Profilbild teilen",
            generateShareImage, hoverImg, setHoverImg, { disabled: generating }
          )}
          {BTN("Profil teilen", nativeShare, hoverNative, setHoverNative)}
        </div>
      </div>

      {/* Hidden share card — deferred well past all animations */}
      {shareWrapperMounted && (
        <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
          <ClarityShareWrapper result={result} wrapperRef={shareWrapperRef} />
        </div>
      )}
    </div>
  );
}

export default ResultSection;
