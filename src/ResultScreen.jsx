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

// Raw score 4–25 → 0–75% display width
const scorePct = (v) => Math.min(Math.round(v * 3), 75);

/* ─────────────────────────────────────────────────────────────
   Part 3 — Inline SVG icons, 13×13, no external library.
   Each uses a thin 2px stroke consistent with the design system.
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
   SectionLabel — uppercase eyebrow with optional leading icon.
   When `color` is passed the label renders in that accent color
   (used for the action/focus left-border sections).
───────────────────────────────────────────────────────────── */
const SectionLabel = ({ children, icon, color }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
    color: color || "#000",
    opacity: color ? 1 : 0.35,
    fontWeight: 600, marginBottom: 12,
  }}>
    {icon}
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Part 2 — ScoreBar with proper 0 → target animation.

   The key insight: `animated` must be false at mount so the bar
   renders at width 0. When `animated` flips to true (200ms after
   the scores section becomes visible), React updates the `width`
   style from "0%" to the target percentage. The CSS `transition`
   on that property then fires the 800ms ease-out animation.

   If we just render at the target width immediately and add a
   transition, nothing animates — there is no prior value to
   transition FROM. The false → true flag flip is essential.
───────────────────────────────────────────────────────────── */
function ScoreBar({ name, value, animated }) {
  const pct   = animated ? scorePct(value) : 0;
  const color = SCORE_COLORS[name] || "#4F8CFF";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 6,
      }}>
        <div style={{ fontSize: 13, color: "#000", opacity: 0.65, letterSpacing: "0.04em" }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color, fontWeight: 600, opacity: 0.85 }}>
          {value}
        </div>
      </div>
      <div style={{
        height: 4, borderRadius: 2,
        background: "rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          width: `${pct}%`,
          borderRadius: 2,
          background: color,
          // ease-out: fast start, decelerates to a stop — feels like it "lands"
          transition: "width 800ms cubic-bezier(0.0, 0.0, 0.2, 1)",
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BulletList — array of strings as clean dot-prefixed rows
───────────────────────────────────────────────────────────── */
function BulletList({ items, accentColor = "#4F8CFF" }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          marginBottom: i < items.length - 1 ? 10 : 0,
        }}>
          <span style={{
            display: "inline-block",
            width: 5, height: 5, borderRadius: "50%",
            background: accentColor,
            marginTop: 8, flexShrink: 0,
          }} />
          <span style={{ fontSize: 17, color: "#000", opacity: 0.78, lineHeight: 1.6 }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────────
   Section — fade-up wrapper for each content block.
   invisible (opacity 0, shifted 18px down) until `visible` flips.
───────────────────────────────────────────────────────────── */
function Section({ visible, children, style = {} }) {
  return (
    <div style={{
      maxWidth:     600,
      margin:       "0 auto",
      padding:      "0 24px",
      marginBottom: 40,
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
   ClarityShareWrapper — static 1200×1600 off-screen share card.
   Captured by html-to-image; never directly visible to the user.
───────────────────────────────────────────────────────────── */
function ClarityShareWrapper({ result, wrapperRef }) {
  const scores     = result.scores       || {};
  const identModes = result.identityModes || [];

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
        color: "#000", opacity: 0.22, marginBottom: 40,
      }}>
        clarity
      </div>

      {/* Identity hero on share card */}
      {identModes[0] && (
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{
            fontSize: 11, letterSpacing: "0.30em", textTransform: "uppercase",
            color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 14,
          }}>
            Dein Clarity Profil
          </div>
          <div style={{
            fontSize: 54, fontWeight: 700, letterSpacing: "-0.025em",
            color: "#000", lineHeight: 1.1, marginBottom: 12,
          }}>
            {identModes[0].type}
          </div>
          <div style={{ fontSize: 16, color: "#4F8CFF", fontWeight: 500 }}>
            {identModes[0].confidence}% Übereinstimmung
          </div>
          {identModes[1] && (
            <div style={{ marginTop: 10, fontSize: 14, color: "#000", opacity: 0.35 }}>
              + {identModes[1].type} · {identModes[1].confidence}%
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {result.summary && (
        <div style={{
          width: "100%", maxWidth: 780,
          background: "linear-gradient(135deg, rgba(79,140,255,0.08), rgba(156,107,255,0.06))",
          border: "1px solid rgba(79,140,255,0.18)",
          borderRadius: 20, padding: "52px 56px",
          textAlign: "center", marginBottom: 72,
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "linear-gradient(135deg, #4F8CFF, #9C6BFF)",
            margin: "0 auto 20px",
          }} />
          <div style={{
            fontSize: 13, letterSpacing: "0.22em", textTransform: "uppercase",
            color: "#4F8CFF", fontWeight: 600, marginBottom: 24,
          }}>
            Zusammenfassung
          </div>
          <div style={{ fontSize: 30, fontStyle: "italic", color: "#000", lineHeight: 1.5 }}>
            {result.summary}
          </div>
        </div>
      )}

      <div style={{ width: "100%", maxWidth: 780 }}>
        {result.pattern && (
          <div style={{ marginBottom: 52 }}>
            <div style={{
              fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 14,
            }}>Muster</div>
            <div style={{ fontSize: 22, color: "#000", lineHeight: 1.65, opacity: 0.75 }}>
              {result.pattern}
            </div>
          </div>
        )}

        {SCORE_ORDER.some(k => scores[k] != null) && (
          <div style={{ marginBottom: 52 }}>
            <div style={{
              fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 20,
            }}>Scores</div>
            {SCORE_ORDER.map((k) => scores[k] != null && (
              <div key={k} style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 15, color: "#000", opacity: 0.60 }}>{k}</span>
                  <span style={{ fontSize: 14, color: SCORE_COLORS[k], fontWeight: 600 }}>
                    {scores[k]}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.08)" }}>
                  <div style={{
                    height: "100%", width: `${scorePct(scores[k])}%`,
                    borderRadius: 3, background: SCORE_COLORS[k],
                  }} />
                </div>
              </div>
            ))}
          </div>
        )}

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

   Part 1 — Staged reveal timeline:
     0ms    outer wrapper fades in
     80ms   header eyebrow + accent line
     160ms  identity hero (Part 4) — appears before summary
     400ms  section 0: summary card        ← emotional peak 1
     700ms  section 1: pattern
     1000ms section 2: strengths
     1300ms section 3: energySources
     1600ms section 4: nextFocus
     1900ms section 5: suggestedAction     ← emotional peak 2
     2200ms section 6: scores (visible)
     2400ms barsReady → bars animate 0→target (Part 2)
     2500ms section 7: identity modes detail
───────────────────────────────────────────────────────────── */
const SECTION_COUNT = 8;

function ResultSection({ result }) {
  const [vis,           setVis]           = useState(false);
  const [headerVis,     setHeaderVis]     = useState(false);
  const [identHeroVis,  setIdentHeroVis]  = useState(false); // Part 4
  const [sectionVis,    setSectionVis]    = useState(() => Array(SECTION_COUNT).fill(false));
  const [barsReady,     setBarsReady]     = useState(false); // Part 2
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [hoverCopy,     setHoverCopy]     = useState(false);
  const [hoverCta,      setHoverCta]      = useState(false);
  const [generating,    setGenerating]    = useState(false);
  const [shareConfirm,  setShareConfirm]  = useState(false);
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

    // Part 1 — 300ms gaps between sections
    const BASE = 400, GAP = 300;
    for (let i = 0; i < SECTION_COUNT; i++) {
      t.push(setTimeout(() => {
        setSectionVis(prev => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, BASE + i * GAP));
    }

    // Part 2 — scores section (i=6) visible at BASE + 6*GAP = 2200ms.
    // barsReady fires 200ms later so the Section fade-up finishes before
    // the bar widths start moving — the two transitions don't overlap.
    t.push(setTimeout(() => setBarsReady(true), 2200 + 200));

    // Defer the heavy 1200×1600 share DOM node well past all animations
    t.push(setTimeout(() => setShareWrapperMounted(true), 4500));

    return () => t.forEach(clearTimeout);
  }, []);

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
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mein Clarity Profil", text: result.summary || "" });
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

  const scores     = result.scores       || {};
  const identModes = result.identityModes || [];

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
        maxWidth: 600, margin: "0 auto", padding: "64px 24px 40px",
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
          background: "linear-gradient(90deg, #4F8CFF, #9C6BFF)",
          borderRadius: 2,
        }} />
      </div>

      {/* ── PART 4 — IDENTITY HERO ────────────────────────────────────────── */}
      {/* Displayed before the summary so the user sees WHO they are first,
          before they read what that means. Primary mode is large and bold;
          secondary mode appears as a quiet footnote underneath.             */}
      {identModes.length > 0 && (
        <div style={{
          maxWidth: 600, margin: "0 auto", padding: "0 24px",
          marginBottom: 44,
          textAlign: "center",
          opacity:    identHeroVis ? 1 : 0,
          transform:  identHeroVis ? "none" : "translateY(14px)",
          transition: "opacity 700ms ease, transform 700ms ease",
        }}>
          <div style={{
            fontSize: 10, letterSpacing: "0.32em", textTransform: "uppercase",
            color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 10,
          }}>
            Dein Clarity Profil
          </div>

          {/* Primary mode — large, bold, full weight */}
          <div style={{
            fontSize: 38, fontWeight: 700, letterSpacing: "-0.025em",
            color: "#000", lineHeight: 1.1, marginBottom: 10,
          }}>
            {identModes[0].type}
          </div>

          {/* Confidence dot + percentage */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 13, color: "#4F8CFF", fontWeight: 500,
            letterSpacing: "0.03em",
          }}>
            <div style={{
              width: 5, height: 5, borderRadius: "50%",
              background: "#4F8CFF", opacity: 0.65,
            }} />
            {identModes[0].confidence}% Übereinstimmung
          </div>

          {/* Secondary mode — muted, smaller */}
          {identModes[1] && (
            <div style={{
              marginTop: 12,
              fontSize: 13, color: "#000", opacity: 0.35,
              letterSpacing: "0.05em",
            }}>
              + {identModes[1].type} · {identModes[1].confidence}%
            </div>
          )}
        </div>
      )}

      {/* ── SECTION 0 — SUMMARY ───────────────────────────────────────────── */}
      <Section visible={sectionVis[0]}>
        <div style={{
          background:   "linear-gradient(135deg, rgba(79,140,255,0.07) 0%, rgba(156,107,255,0.06) 100%)",
          border:       "1px solid rgba(79,140,255,0.18)",
          borderRadius: 16,
          padding:      "32px 28px",
          textAlign:    "center",
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: "50%",
            background: "linear-gradient(135deg, #4F8CFF, #9C6BFF)",
            margin: "0 auto 16px",
          }} />
          <div style={{
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "#4F8CFF", fontWeight: 600, marginBottom: 18,
          }}>
            Zusammenfassung
          </div>
          <div style={{
            fontSize: 22, fontWeight: 400, fontStyle: "italic",
            color: "#000", lineHeight: 1.55,
          }}>
            {result.summary}
          </div>
        </div>
      </Section>

      {/* ── SECTION 1 — PATTERN ──────────────────────────────────────────── */}
      {result.pattern && (
        <Section visible={sectionVis[1]}>
          {/* Part 3: insight icon */}
          <SectionLabel icon={<IconInsight />}>Das verborgene Muster</SectionLabel>
          <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.65, opacity: 0.78 }}>
            {result.pattern}
          </div>
        </Section>
      )}

      {/* ── SECTION 2 — STRENGTHS ────────────────────────────────────────── */}
      {result.strengths?.length > 0 && (
        <Section visible={sectionVis[2]}>
          {/* Part 3: shield icon */}
          <SectionLabel icon={<IconShield />}>Deine Stärken</SectionLabel>
          <BulletList items={result.strengths} accentColor="#9C6BFF" />
        </Section>
      )}

      {/* ── SECTION 3 — ENERGY SOURCES ───────────────────────────────────── */}
      {result.energySources?.length > 0 && (
        <Section visible={sectionVis[3]}>
          {/* Part 3: lightning icon */}
          <SectionLabel icon={<IconLightning />}>Deine Energiequellen</SectionLabel>
          <BulletList items={result.energySources} accentColor="#FF8A4F" />
        </Section>
      )}

      {/* ── SECTION 4 — NEXT FOCUS ───────────────────────────────────────── */}
      {result.nextFocus && (
        <Section visible={sectionVis[4]}>
          <div style={{
            borderLeft: "3px solid #3DDC97",
            paddingLeft: 20, paddingTop: 4, paddingBottom: 4,
          }}>
            {/* Part 3: compass icon in accent color */}
            <SectionLabel icon={<IconCompass />} color="#3DDC97">
              Dein nächster Fokus
            </SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.6, opacity: 0.85 }}>
              {result.nextFocus}
            </div>
          </div>
        </Section>
      )}

      {/* ── SECTION 5 — SUGGESTED ACTION ─────────────────────────────────── */}
      {result.suggestedAction && (
        <Section visible={sectionVis[5]}>
          <div style={{
            borderLeft: "3px solid #4F8CFF",
            paddingLeft: 20, paddingTop: 4, paddingBottom: 4,
          }}>
            {/* Part 3: rocket icon in accent color */}
            <SectionLabel icon={<IconRocket />} color="#4F8CFF">
              Empfohlene Aktion
            </SectionLabel>
            <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.6, opacity: 0.85 }}>
              {result.suggestedAction}
            </div>
          </div>
        </Section>
      )}

      {/* ── SECTION 6 — SCORES ───────────────────────────────────────────── */}
      {/* Part 2: `animated={barsReady}` controls 0 → target width transition. */}
      {SCORE_ORDER.some(k => scores[k] != null) && (
        <Section visible={sectionVis[6]}>
          <SectionLabel>Deine Scores</SectionLabel>
          {SCORE_ORDER.map((key) =>
            scores[key] != null ? (
              <ScoreBar key={key} name={key} value={scores[key]} animated={barsReady} />
            ) : null
          )}
          {result.confidence != null && (
            <div style={{
              marginTop: 20,
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "#000", opacity: 0.38, letterSpacing: "0.08em",
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

      {/* ── SECTION 7 — IDENTITY MODES (detail) ─────────────────────────── */}
      {/* Hero (Part 4) shows the primary mode large above the fold.
          This section shows all modes with mini bars for completeness.
          Primary mode renders slightly larger and heavier than secondary. */}
      {identModes.length > 0 && (
        <Section visible={sectionVis[7]}>
          <SectionLabel>Identitätsmodus</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {identModes.map((m, i) => (
              <div key={i}>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginBottom: 5,
                }}>
                  <span style={{
                    fontSize: i === 0 ? 15 : 14,
                    color: "#000",
                    opacity: i === 0 ? 0.80 : 0.52,
                    fontWeight: i === 0 ? 500 : 400,
                  }}>
                    {m.type}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: i === 0 ? "#4F8CFF" : "#9C6BFF",
                    opacity: i === 0 ? 1 : 0.70,
                  }}>
                    {m.confidence}%
                  </span>
                </div>
                <div style={{
                  height: i === 0 ? 3 : 2, borderRadius: 2,
                  background: "rgba(0,0,0,0.07)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: barsReady ? `${m.confidence}%` : "0%",
                    borderRadius: 2,
                    background: i === 0 ? "#4F8CFF" : "#9C6BFF",
                    transition: "width 800ms cubic-bezier(0.0, 0.0, 0.2, 1)",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ── COPY SUMMARY BUTTON ───────────────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "0 24px 48px",
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          {copiedSummary ? "✓ Kopiert" : "Zusammenfassung kopieren"}
        </button>
      </div>

      {/* ── DIVIDER ───────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 600, margin: "0 auto", borderTop: "1px solid rgba(0,0,0,0.07)" }} />

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
              Teile dein Klarheitsprofil mit Freunden.
            </div>
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

      {/* Hidden share card — deferred 4.5s to avoid competing with animations */}
      {shareWrapperMounted && (
        <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
          <ClarityShareWrapper result={result} wrapperRef={shareWrapperRef} />
        </div>
      )}
    </div>
  );
}

export default ResultSection;
