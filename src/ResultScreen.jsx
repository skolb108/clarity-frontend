import { useState, useEffect, useRef } from "react";

/* ─────────────────────────────────────────────────────────────
   Score constants — inlined so this file has zero shared.jsx deps.
───────────────────────────────────────────────────────────── */
const SCORE_COLORS = {
  Clarity:   "#4F8CFF",
  Energy:    "#FF8A4F",
  Strength:  "#9C6BFF",
  Direction: "#3DDC97",
  Action:    "#FF5A6F",
};
const SCORE_ORDER = ["Clarity", "Energy", "Strength", "Direction", "Action"];

// Raw score is 4–25 → convert to a 0–100% width (capped at 75% so bars
// never feel "full" even at max, preserving the visual tension of the scale)
const scorePct = (v) => Math.min(Math.round(v * 3), 75);

/* ─────────────────────────────────────────────────────────────
   Section label helper — uppercase muted eyebrow
───────────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
    color: "#000", opacity: 0.35, fontWeight: 600, marginBottom: 10,
  }}>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   ScoreBar — one labeled horizontal progress bar
───────────────────────────────────────────────────────────── */
function ScoreBar({ name, value }) {
  const pct   = scorePct(value);
  const color = SCORE_COLORS[name] || "#4F8CFF";

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Label + raw value */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        marginBottom: 6,
      }}>
        <div style={{ fontSize: 13, color: "#000", opacity: 0.65, letterSpacing: "0.04em" }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: color, fontWeight: 600, opacity: 0.85 }}>
          {value}
        </div>
      </div>
      {/* Track */}
      <div style={{
        height: 4, borderRadius: 2,
        background: "rgba(0,0,0,0.07)",
        overflow: "hidden",
      }}>
        {/* Fill — width animated via inline transition */}
        <div style={{
          height: "100%",
          width:  `${pct}%`,
          borderRadius: 2,
          background: color,
          transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BulletList — renders an array of strings as clean bullet rows
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
          <span style={{
            fontSize: 17, color: "#000", opacity: 0.78,
            lineHeight: 1.6,
          }}>
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared section wrapper — handles fade-up animation per section
───────────────────────────────────────────────────────────── */
function Section({ visible, children, style = {} }) {
  return (
    <div style={{
      maxWidth:   600,
      margin:     "0 auto",
      padding:    "0 24px",
      marginBottom: 40,
      opacity:    visible ? 1 : 0,
      transform:  visible ? "none" : "translateY(16px)",
      transition: "opacity 600ms ease, transform 600ms ease",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ClarityShareWrapper — static 1200×1600 off-screen share card
   Rendered via html-to-image; never visible to the user.
───────────────────────────────────────────────────────────── */
function ClarityShareWrapper({ result, wrapperRef }) {
  const scores = result.scores || {};

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
        color: "#000", opacity: 0.22, marginBottom: 60,
      }}>
        clarity
      </div>

      {/* Summary — the focal point */}
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

        {/* Pattern */}
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

        {/* Scores */}
        {SCORE_ORDER.some(k => scores[k] != null) && (
          <div style={{ marginBottom: 52 }}>
            <div style={{
              fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 20,
            }}>Scores</div>
            {SCORE_ORDER.map((k) => scores[k] != null && (
              <div key={k} style={{ marginBottom: 18 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  marginBottom: 8,
                }}>
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

        {/* Identity modes */}
        {result.identityModes?.length > 0 && (
          <div style={{ marginBottom: 52 }}>
            <div style={{
              fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#000", opacity: 0.28, fontWeight: 600, marginBottom: 14,
            }}>Identitätsmodus</div>
            {result.identityModes.map((m, i) => (
              <div key={i} style={{
                fontSize: 20, color: "#000", opacity: 0.72, marginBottom: 8,
              }}>
                {m.type} — {m.confidence}%
              </div>
            ))}
          </div>
        )}

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

      {/* Footer */}
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
───────────────────────────────────────────────────────────── */
// 8 sections: summary · pattern · strengths · energySources ·
//             nextFocus · suggestedAction · scores · identityModes
const SECTION_COUNT = 8;

function ResultSection({ result }) {
  const [vis,          setVis]          = useState(false);
  const [headerVis,    setHeaderVis]    = useState(false);
  const [sectionVis,   setSectionVis]   = useState(() => Array(SECTION_COUNT).fill(false));
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [hoverCopy,    setHoverCopy]    = useState(false);
  const [hoverCta,     setHoverCta]     = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [shareConfirm, setShareConfirm] = useState(false);
  const [hoverImg,     setHoverImg]     = useState(false);
  const [hoverNative,  setHoverNative]  = useState(false);
  const [shareWrapperMounted, setShareWrapperMounted] = useState(false);
  const shareWrapperRef = useRef(null);

  // ── Score bars need a separate "barsReady" flag so their CSS
  // width transition fires after the section has become visible ──
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const timers = [];

    timers.push(setTimeout(() => setVis(true),       0));
    timers.push(setTimeout(() => setHeaderVis(true), 80));

    // Stagger each section 160ms apart starting at 300ms
    for (let i = 0; i < SECTION_COUNT; i++) {
      const delay = 300 + i * 160;
      timers.push(setTimeout(() => {
        setSectionVis((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, delay));
    }

    // Let score bars animate in after their section is visible
    timers.push(setTimeout(() => setBarsReady(true), 300 + 6 * 160 + 200));

    // Defer heavy share DOM node
    timers.push(setTimeout(() => setShareWrapperMounted(true), 2500));

    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Copy summary to clipboard ─────────────────────────────────────────────
  const copyInsight = async () => {
    try {
      await navigator.clipboard.writeText(result.summary || "");
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2200);
    } catch (_) {}
  };

  // ── Generate and share / download PNG ────────────────────────────────────
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
        } catch (_) { /* fall through */ }
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

  // ── Native share — shares summary text ───────────────────────────────────
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

  const scores      = result.scores      || {};
  const identModes  = result.identityModes || [];

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
        maxWidth: 600, margin: "0 auto", padding: "64px 24px 52px",
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

      {/* ── SECTION 1 — SUMMARY (highlighted) ────────────────────────────── */}
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

      {/* ── SECTION 2 — PATTERN ──────────────────────────────────────────── */}
      {result.pattern && (
        <Section visible={sectionVis[1]}>
          <SectionLabel>Das verborgene Muster</SectionLabel>
          <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.65, opacity: 0.78 }}>
            {result.pattern}
          </div>
        </Section>
      )}

      {/* ── SECTION 3 — STRENGTHS ────────────────────────────────────────── */}
      {result.strengths?.length > 0 && (
        <Section visible={sectionVis[2]}>
          <SectionLabel>Deine Stärken</SectionLabel>
          <BulletList items={result.strengths} accentColor="#9C6BFF" />
        </Section>
      )}

      {/* ── SECTION 4 — ENERGY SOURCES ───────────────────────────────────── */}
      {result.energySources?.length > 0 && (
        <Section visible={sectionVis[3]}>
          <SectionLabel>Deine Energiequellen</SectionLabel>
          <BulletList items={result.energySources} accentColor="#FF8A4F" />
        </Section>
      )}

      {/* ── SECTION 5 — NEXT FOCUS (action variant) ──────────────────────── */}
      {result.nextFocus && (
        <Section visible={sectionVis[4]}>
          <div style={{
            borderLeft: "3px solid #3DDC97",
            paddingLeft: 20, paddingTop: 4, paddingBottom: 4,
          }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#3DDC97", fontWeight: 600, marginBottom: 10,
            }}>
              Dein nächster Fokus
            </div>
            <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.6, opacity: 0.85 }}>
              {result.nextFocus}
            </div>
          </div>
        </Section>
      )}

      {/* ── SECTION 6 — SUGGESTED ACTION ─────────────────────────────────── */}
      {result.suggestedAction && (
        <Section visible={sectionVis[5]}>
          <div style={{
            borderLeft: "3px solid #4F8CFF",
            paddingLeft: 20, paddingTop: 4, paddingBottom: 4,
          }}>
            <div style={{
              fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
              color: "#4F8CFF", fontWeight: 600, marginBottom: 10,
            }}>
              Empfohlene Aktion
            </div>
            <div style={{ fontSize: 18, fontWeight: 400, color: "#000", lineHeight: 1.6, opacity: 0.85 }}>
              {result.suggestedAction}
            </div>
          </div>
        </Section>
      )}

      {/* ── SECTION 7 — SCORES ───────────────────────────────────────────── */}
      {SCORE_ORDER.some(k => scores[k] != null) && (
        <Section visible={sectionVis[6]}>
          <SectionLabel>Deine Scores</SectionLabel>
          {/* Score bars only animate their width once barsReady is true,
              which fires 200ms after this section becomes visible. */}
          <div style={{ opacity: barsReady ? 1 : 0, transition: "opacity 200ms ease" }}>
            {SCORE_ORDER.map((key) =>
              scores[key] != null ? (
                <ScoreBar key={key} name={key} value={barsReady ? scores[key] : 0} />
              ) : null
            )}
          </div>
          {/* Confidence badge */}
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

      {/* ── SECTION 8 — IDENTITY MODES ───────────────────────────────────── */}
      {identModes.length > 0 && (
        <Section visible={sectionVis[7]}>
          <SectionLabel>Identitätsmodus</SectionLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {identModes.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {/* Mode bar */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    marginBottom: 5,
                  }}>
                    <span style={{ fontSize: 15, color: "#000", opacity: 0.75 }}>
                      {m.type}
                    </span>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      color: i === 0 ? "#4F8CFF" : "#9C6BFF",
                    }}>
                      {m.confidence}%
                    </span>
                  </div>
                  <div style={{
                    height: 3, borderRadius: 2,
                    background: "rgba(0,0,0,0.07)", overflow: "hidden",
                  }}>
                    <div style={{
                      height: "100%",
                      width: barsReady ? `${m.confidence}%` : "0%",
                      borderRadius: 2,
                      background: i === 0 ? "#4F8CFF" : "#9C6BFF",
                      transition: "width 800ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }} />
                  </div>
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
