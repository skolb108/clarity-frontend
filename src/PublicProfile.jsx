import { useState, useEffect } from "react";
import ResultSection from "./ResultScreen.jsx";

/* ─────────────────────────────────────────────────────────────
   decodeSlug — converts a Base64-encoded URL slug into the
   result object that ResultSection expects.

   Encoding is done in ResultScreen when the user taps "Share":
     const slug = btoa(JSON.stringify(result));
     const url  = `https://cla-ri-ty.netlify.app/p/${slug}`;

   Decoding is done here:
     const result = JSON.parse(atob(slug));

   Returns { ok: true, result } on success.
   Returns { ok: false }        on any failure.

   Both atob() and JSON.parse() throw on bad input — both are
   caught and collapsed into the single error state below.
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
   ClarityPublicProfile — the public share page.

   Receives `slug` as a prop (injected by the router in App.jsx
   when the path matches /p/:slug).

   On success: renders ResultSection with the full decoded profile.
   On failure: shows a minimal error state with a CTA to start fresh.
───────────────────────────────────────────────────────────── */
function ClarityPublicProfile({ slug }) {
  const [hoverCta, setHoverCta] = useState(false);

  const { ok, result } = decodeSlug(slug);

  // Derive OG values — fall back gracefully when fields are absent
  const primaryMode = result?.identityModes?.[0]?.type ?? "Explorer";
  const ogTitle     = `Clarity Profil – ${primaryMode}`;
  const ogDesc      = result?.summary
    ? result.summary.slice(0, 160)
    : "Ein kurzer AI-Dialog zeigt dir, was dir wirklich wichtig ist.";

  // ── Inject OG / Twitter meta tags ─────────────────────────────────────────
  // These fire on mount (and on slug change) so link previews on social
  // platforms pick up the correct title, description, and image.
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
  }, [ogTitle, ogDesc]);

  // Shared outer container — matches the main app background
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

          {/* Error text */}
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

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  return (
    <div style={wrap}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      {/* Minimal branded header. Tells the viewer what this page is before
          the full profile animates in. Matches the visual language of the
          result screen (small caps, blue accent, gradient rule).            */}
      <div style={{
        maxWidth: 600, margin: "0 auto",
        padding: "40px 24px 0", textAlign: "center",
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

      {/* ── RESULT SECTION ──────────────────────────────────────────────── */}
      {/* Pass the fully decoded result object directly to ResultSection.
          This is the same component the sharer saw — identical layout,
          staged reveal, score bar animations, identity hero, comparison
          and potential blocks, and all insight sections.                  */}
      <ResultSection result={result} />

      {/* ── CTA — invite the viewer to start their own analysis ─────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto",
        padding: "52px 24px 80px", textAlign: "center",
        borderTop: "1px solid rgba(0,0,0,0.07)",
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
