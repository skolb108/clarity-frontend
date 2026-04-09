import { useState, useEffect } from "react";
import ResultScreen from "./ResultScreen";

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
   ClarityPublicProfile — thin wrapper.
   URL → decode slug → pass result to ResultScreen.
───────────────────────────────────────────────────────────── */
function ClarityPublicProfile({ slug }) {
  const [hoverCta, setHoverCta] = useState(false);

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

  // ── ERROR STATE ───────────────────────────────────────────────────────────
  if (!ok) {
    return (
      <div style={{
        minHeight: "100vh", width: "100%",
        background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}>
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

  // ── SUCCESS STATE — delegate entirely to ResultScreen ─────────────────────
  return <ResultScreen result={result} isPublicView={true} />;
}

export default ClarityPublicProfile;
