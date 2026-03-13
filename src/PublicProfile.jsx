import { useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────────
   Score constants — kept in sync with ResultScreen.jsx so the
   public profile's bars are pixel-identical to the private one.
───────────────────────────────────────────────────────────── */
const SCORE_COLORS = {
  Clarity:   "#4F8CFF",
  Energy:    "#FF8A4F",
  Strength:  "#9C6BFF",
  Direction: "#3DDC97",
  Action:    "#FF5A6F",
};
const SCORE_ORDER = ["Clarity", "Energy", "Strength", "Direction", "Action"];

// Raw score 4–25 → 0–75% display width (identical cap to ResultScreen)
const scorePct = (v) => Math.min(Math.round(v * 3), 75);

// Fallback identity — shown when identityModes is missing or empty
const IDENTITY_FALLBACK = { type: "Explorer", confidence: 60 };

/* ─────────────────────────────────────────────────────────────
   decodeSlug — converts a Base64-encoded URL slug into the
   result object produced by ResultScreen when the user shares.

   Encoding (ResultScreen):
     const slug = btoa(JSON.stringify(result));
     const url  = `https://cla-ri-ty.netlify.app/p/${slug}`;

   Decoding (here):
     const result = JSON.parse(atob(slug));

   Returns { ok: true, result } on success.
   Returns { ok: false }        on any failure (truncated URL,
   tampered slug, non-JSON payload, etc.).
───────────────────────────────────────────────────────────── */
function decodeSlug(slug) {
  try {
    if (!slug || typeof slug !== "string") return { ok: false };
    const json   = atob(slug);
    const result = JSON.parse(json);
    if (typeof result !== "object" || result === null) return { ok: false };
    return { ok: true, result };
  } catch (_) {
    return { ok: false };
  }
}

/* ─────────────────────────────────────────────────────────────
   setMeta — upserts a <meta> tag in <head> without duplicates.
───────────────────────────────────────────────────────────── */
function setMeta(attr, name, content) {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

const APP_URL  = "https://cla-ri-ty.netlify.app";
const OG_IMAGE = `${APP_URL}/og-default.png`;

/* ─────────────────────────────────────────────────────────────
   ScoreBar — 0 → target animated bar.

   Same implementation as ResultScreen: `animated` must be false
   at mount so the fill renders at 0%. When barsReady flips true,
   React updates width to the target pct and the CSS transition
   fires. Duration: 900ms ease-out — matches the private screen.
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
        <span style={{ fontSize: 14, color: "#000", opacity: 0.62, letterSpacing: "0.02em" }}>
          {name}
        </span>
        <span style={{ fontSize: 13, color, fontWeight: 600, opacity: 0.80 }}>
          {value}
        </span>
      </div>
      <div style={{
        height: 6, borderRadius: 3,
        background: "rgba(0,0,0,0.07)", overflow: "hidden",
      }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 3,
          background: color,
          transition: "width 900ms cubic-bezier(0.0, 0.0, 0.2, 1)",
        }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ClarityPublicProfile — the public share page.

   Shows ONLY the safe-to-share subset of the profile:
     1. Identity hero (type + confidence)
     2. Score bars  (Clarity / Energy / Strength / Direction / Action)
     3. Explanation section (what these five dimensions mean)
     4. Call-to-action (start your own analysis)

   NOT shown (too personal — private screen only):
     summary · pattern · strengths · energySources
     nextFocus · suggestedAction

   Reveal timeline:
     0ms   outer wrapper fades in
    80ms   header
   180ms   identity hero
   480ms   scores section (bars animate 200ms later at 680ms)
   780ms   explanation section
───────────────────────────────────────────────────────────── */
function ClarityPublicProfile({ slug }) {
  const [vis,          setVis]          = useState(false);
  const [headerVis,    setHeaderVis]    = useState(false);
  const [heroVis,      setHeroVis]      = useState(false);
  const [scoresVis,    setScoresVis]    = useState(false);
  const [explainVis,   setExplainVis]   = useState(false);
  const [barsReady,    setBarsReady]    = useState(false);
  const [hoverCta,     setHoverCta]     = useState(false);

  const { ok, result } = decodeSlug(slug);

  // Derive OG values from the decoded profile
  const primaryMode = result?.identityModes?.[0]?.type ?? "Explorer";
  const ogTitle     = `Clarity Profil – ${primaryMode}`;
  const ogDesc      = "Ein kurzer AI-Dialog zeigt dir, was dir wirklich wichtig ist.";

  // ── OG / Twitter meta ─────────────────────────────────────────────────────
  useEffect(() => {
    document.title = ogTitle;
    setMeta("name",     "description",         ogDesc);
    setMeta("property", "og:type",             "website");
    setMeta("property", "og:title",            ogTitle);
    setMeta("property", "og:description",      ogDesc);
    setMeta("property", "og:image",            OG_IMAGE);
    setMeta("property", "og:url",              window.location.href);
    setMeta("name",     "twitter:card",        "summary_large_image");
    setMeta("name",     "twitter:title",       ogTitle);
    setMeta("name",     "twitter:description", ogDesc);
    setMeta("name",     "twitter:image",       OG_IMAGE);
  }, [ogTitle]);

  // ── Staged reveal — only runs when decode succeeded ───────────────────────
  useEffect(() => {
    if (!ok) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = [];

    t.push(setTimeout(() => setVis(true),        0));
    t.push(setTimeout(() => setHeaderVis(true),  80));
    t.push(setTimeout(() => setHeroVis(true),   180));
    t.push(setTimeout(() => setScoresVis(true), 480));
    // barsReady fires 200ms after scores section is visible — gives the
    // Section fade-up time to finish before bar widths start moving.
    t.push(setTimeout(() => setBarsReady(true), 680));
    t.push(setTimeout(() => setExplainVis(true), 780));

    return () => t.forEach(clearTimeout);
  }, [ok]);

  // ── Shared outer container ────────────────────────────────────────────────
  const wrap = {
    minHeight: "100vh",
    width: "100%",
    background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  };

  // ── ERROR STATE ───────────────────────────────────────────────────────────
  if (!ok) {
    return (
      <div style={wrap}>
        <div style={{
          maxWidth: 480, margin: "0 auto",
          padding: "120px 24px 80px", textAlign: "center",
        }}>
          {/* Wordmark */}
          <div style={{
            fontSize: 11, letterSpacing: "0.42em", textTransform: "uppercase",
            color: "#000", opacity: 0.18, marginBottom: 64,
          }}>
            clarity
          </div>

          {/* Error message */}
          <div style={{
            fontSize: 18, color: "#000", opacity: 0.48,
            lineHeight: 1.7, marginBottom: 48,
          }}>
            Dieses Clarity Profil konnte nicht geladen werden.
          </div>

          {/* CTA */}
          <a href={APP_URL} style={{ textDecoration: "none" }}>
            <button
              onMouseEnter={() => setHoverCta(true)}
              onMouseLeave={() => setHoverCta(false)}
              style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                height: 52, padding: "0 32px",
                background: hoverCta ? "#1a1a1a" : "#000",
                color: "#fff", border: "none",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 15, fontWeight: 600, borderRadius: 14, cursor: "pointer",
                transition: "background 200ms, transform 180ms",
                transform: hoverCta ? "scale(1.03)" : "scale(1)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
              }}
            >
              Starte deine eigene Clarity Analyse
            </button>
          </a>
        </div>
      </div>
    );
  }

  // ── Derive display data from decoded result ───────────────────────────────
  const scores     = result.scores        || {};
  const rawIdent   = result.identityModes  || [];
  const identModes = rawIdent.length > 0 ? rawIdent : [IDENTITY_FALLBACK];
  const hasScores  = SCORE_ORDER.some(k => scores[k] != null);

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  return (
    <div style={{
      ...wrap,
      opacity:    vis ? 1 : 0,
      transform:  vis ? "none" : "translateY(16px)",
      transition: "opacity 600ms ease, transform 600ms ease",
    }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      {/* Minimal branded bar — tells the viewer what this page is before
          the profile content arrives.                                      */}
      <div style={{
        maxWidth: 600, margin: "0 auto",
        padding: "40px 24px 0", textAlign: "center",
        opacity:    headerVis ? 1 : 0,
        transform:  headerVis ? "none" : "translateY(10px)",
        transition: "opacity 550ms ease, transform 550ms ease",
      }}>
        {/* Wordmark */}
        <div style={{
          fontSize: 11, letterSpacing: "0.42em", textTransform: "uppercase",
          color: "#000", opacity: 0.18, marginBottom: 10,
        }}>
          clarity
        </div>
        {/* Page label */}
        <div style={{
          fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
          color: "#4F8CFF", fontWeight: 600,
        }}>
          Clarity Profil
        </div>
        {/* Accent rule */}
        <div style={{
          width: 24, height: 1, margin: "12px auto 0",
          background: "linear-gradient(90deg, #4F8CFF, #9C6BFF)",
          borderRadius: 1, opacity: 0.45,
        }} />
      </div>

      {/* ── 1. IDENTITY HERO ─────────────────────────────────────────────── */}
      {/* Large identity type centered — the first thing the viewer reads.
          52px bold, same weight as the private result screen.               */}
      <div style={{
        maxWidth: 600, margin: "0 auto",
        padding: "52px 24px 0", textAlign: "center",
        opacity:    heroVis ? 1 : 0,
        transform:  heroVis ? "none" : "translateY(14px)",
        transition: "opacity 650ms ease, transform 650ms ease",
      }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase",
          color: "rgba(0,0,0,0.32)", fontWeight: 600, marginBottom: 12,
        }}>
          Dein Clarity Profil
        </div>

        {/* Primary identity type */}
        <div style={{
          fontSize: 52, fontWeight: 700, letterSpacing: "-0.03em",
          color: "#000", lineHeight: 1.05, marginBottom: 14,
        }}>
          {identModes[0].type}
        </div>

        {/* Confidence — blue dot + percentage */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          fontSize: 15, color: "#4F8CFF", fontWeight: 500, letterSpacing: "0.02em",
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#4F8CFF", opacity: 0.60,
          }} />
          {identModes[0].confidence}% Übereinstimmung
        </div>

        {/* Secondary mode — muted footnote when present */}
        {identModes[1] && (
          <div style={{
            marginTop: 10, fontSize: 13,
            color: "rgba(0,0,0,0.30)", letterSpacing: "0.04em",
          }}>
            + {identModes[1].type} · {identModes[1].confidence}%
          </div>
        )}
      </div>

      {/* ── 2. PROFILE SCORES ────────────────────────────────────────────── */}
      {/* Same bar design, same colors, same 900ms ease-out animation as the
          private result screen. barsReady fires 200ms after section appears
          so the fade-up transition finishes before bars start moving.       */}
      {hasScores && (
        <div style={{
          maxWidth: 600, margin: "0 auto",
          padding: "48px 24px 0",
          opacity:    scoresVis ? 1 : 0,
          transform:  scoresVis ? "none" : "translateY(18px)",
          transition: "opacity 550ms ease, transform 550ms ease",
        }}>
          {/* Section label */}
          <div style={{
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(0,0,0,0.32)", fontWeight: 600, marginBottom: 20,
          }}>
            Dein Profil
          </div>

          {/* Score bars */}
          {SCORE_ORDER.map(key =>
            scores[key] != null ? (
              <ScoreBar key={key} name={key} value={scores[key]} animated={barsReady} />
            ) : null
          )}
        </div>
      )}

      {/* ── 3. EXPLANATION SECTION ───────────────────────────────────────── */}
      {/* Contextualises the five dimensions for viewers who haven't used
          Clarity. Helps them understand what they're looking at and creates
          curiosity to start their own analysis.                             */}
      <div style={{
        maxWidth: 600, margin: "0 auto",
        padding: "40px 24px 0",
        opacity:    explainVis ? 1 : 0,
        transform:  explainVis ? "none" : "translateY(18px)",
        transition: "opacity 550ms ease, transform 550ms ease",
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(79,140,255,0.05) 0%, rgba(156,107,255,0.04) 100%)",
          border: "1px solid rgba(79,140,255,0.13)",
          borderRadius: 16, padding: "24px 22px",
        }}>
          {/* Section label */}
          <div style={{
            fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(0,0,0,0.32)", fontWeight: 600, marginBottom: 16,
          }}>
            Was zeigt diese Analyse?
          </div>

          {/* Intro sentence */}
          <div style={{
            fontSize: 16, color: "#000", lineHeight: 1.7,
            opacity: 0.72, marginBottom: 20,
          }}>
            Diese Analyse zeigt deine aktuelle Klarheit in fünf Bereichen:
          </div>

          {/* Dimension pills */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20,
          }}>
            {SCORE_ORDER.map(name => (
              <div key={name} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: `${SCORE_COLORS[name]}12`,
                border: `1px solid ${SCORE_COLORS[name]}30`,
                borderRadius: 20, padding: "5px 12px",
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: SCORE_COLORS[name], opacity: 0.85,
                }} />
                <span style={{
                  fontSize: 12, color: "#000", opacity: 0.70,
                  letterSpacing: "0.04em", fontWeight: 500,
                }}>
                  {name}
                </span>
              </div>
            ))}
          </div>

          {/* Closing sentence */}
          <div style={{
            fontSize: 15, color: "#000", lineHeight: 1.7,
            opacity: 0.55,
          }}>
            Sie basiert auf deinen Antworten im Gespräch mit Clarity.
          </div>
        </div>
      </div>

      {/* ── 4. CALL TO ACTION ────────────────────────────────────────────── */}
      {/* Invite the viewer to start their own analysis. Same button style
          used throughout the app.                                           */}
      <div style={{
        maxWidth: 600, margin: "0 auto",
        padding: "52px 24px 80px", textAlign: "center",
        borderTop: "1px solid rgba(0,0,0,0.07)",
        marginTop: 48,
      }}>
        {/* Eyebrow */}
        <div style={{
          fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "rgba(0,0,0,0.30)", fontWeight: 600, marginBottom: 16,
        }}>
          Dein Profil
        </div>

        <div style={{
          fontSize: 20, fontWeight: 600, color: "#000",
          letterSpacing: "-0.01em", marginBottom: 10, lineHeight: 1.3,
        }}>
          Was zeigt deine Analyse?
        </div>

        <div style={{
          fontSize: 16, color: "#000", opacity: 0.48,
          marginBottom: 32, lineHeight: 1.7,
        }}>
          Finde in wenigen Minuten heraus, was dir wirklich wichtig ist.
        </div>

        <a href={APP_URL} style={{ textDecoration: "none" }}>
          <button
            onMouseEnter={() => setHoverCta(true)}
            onMouseLeave={() => setHoverCta(false)}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 52, padding: "0 32px",
              background: hoverCta ? "#1a1a1a" : "#000",
              color: "#fff", border: "none",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 15, fontWeight: 600, borderRadius: 14, cursor: "pointer",
              transition: "background 200ms, transform 180ms",
              transform: hoverCta ? "scale(1.03)" : "scale(1)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
            }}
          >
            Starte deine eigene Clarity Analyse
          </button>
        </a>
      </div>

    </div>
  );
}

export default ClarityPublicProfile;
