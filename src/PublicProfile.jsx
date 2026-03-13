import { useState, useEffect } from "react";
import { parseProfileSlug, ClarityProfileView } from "./shared.jsx";

function ClarityPublicProfile({ slug }) {
  const { modeType, confidence, clarityScore, energyScore, strengthScore, directionScore, actionScore } = parseProfileSlug(slug);
  const OG_IMAGE = "https://cla-ri-ty.netlify.app/og-default.png";
  const [barsOn,   setBarsOn]   = useState(false);
  const [hoverCta, setHoverCta] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsOn(true), 400);
    return () => clearTimeout(t);
  }, []);

  // OG / Twitter meta tags (logic unchanged)
  useEffect(() => {
    const title = `Clarity Profil – ${modeType}`;
    const desc  = "Ein kurzer AI-Dialog zeigt dir, was dir wirklich wichtig ist.";
    document.title = title;
    const setMeta = (attr, name, content) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("name",     "description",         desc);
    setMeta("property", "og:type",             "website");
    setMeta("property", "og:title",            title);
    setMeta("property", "og:description",      desc);
    setMeta("property", "og:image",            OG_IMAGE);
    setMeta("property", "og:url",              window.location.href);
    setMeta("name",     "twitter:card",        "summary_large_image");
    setMeta("name",     "twitter:title",       title);
    setMeta("name",     "twitter:description", desc);
    setMeta("name",     "twitter:image",       OG_IMAGE);
  }, [modeType]);

  // Build a partial result object from the URL slug data.
  // All 5 scores are now encoded in the link; ClarityProfileView skips missing ones.
  const partialScores = {};
  if (clarityScore   != null) partialScores.Clarity   = clarityScore;
  if (energyScore    != null) partialScores.Energy     = energyScore;
  if (strengthScore  != null) partialScores.Strength   = strengthScore;
  if (directionScore != null) partialScores.Direction  = directionScore;
  if (actionScore    != null) partialScores.Action     = actionScore;

  const partialResult = {
    identityModes: [{ type: modeType, confidence }],
    scores: Object.keys(partialScores).length > 0 ? partialScores : null,
    // summary, pattern, strengths, etc. are not in the URL — rendered as absent
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>

      {/* ── PROFILE VIEW — identical component as result screen ──────────────── */}
      <ClarityProfileView
        result={partialResult}
        heroVis={true}
        barsOn={barsOn}
        insightVis={true}
        isStatic={false}
      />

      {/* ── CTA — invite viewer to create their own profile ──────────────────── */}
      <div style={{
        maxWidth: 640, margin: "48px auto 0",
        padding: "56px 24px 80px", textAlign: "center",
        borderTop: "1px solid rgba(0,0,0,0.07)",
      }}>
        <div style={{
          fontSize: 18, fontWeight: 500, color: "#000",
          opacity: 0.75, marginBottom: 28, lineHeight: 1.5,
        }}>
          Finde heraus, was du wirklich willst.
        </div>
        <button
          onClick={() => { window.location.href = "/"; }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#1a1a1a";
            e.currentTarget.style.transform  = "scale(1.03)";
            setHoverCta(true);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#000";
            e.currentTarget.style.transform  = "scale(1)";
            setHoverCta(false);
          }}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            height: 48, padding: "0 28px",
            background: "#000", color: "#fff", border: "none",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 15, fontWeight: 600, borderRadius: 12, cursor: "pointer",
            transition: "background 200ms, transform 180ms",
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          Dein eigenes Klarheitsprofil erstellen
        </button>
      </div>

    </div>
  );
}


// ── ChatApp — default export, lazy loaded by App.jsx ─────────────────────────
// Handles routing internally:
//   /p/*  → ClarityPublicProfile (share page)
//   /*    → Clarity (main chat flow, starts in "chat" phase)

export default ClarityPublicProfile;
