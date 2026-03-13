import { memo } from "react";

function generateProfileLink(result) {
  try {
    const mode = Array.isArray(result.identityModes) && result.identityModes[0];
    const modeSlug    = mode
      ? `${mode.type.toLowerCase().replace(/\s+/g, "-")}-${mode.confidence}`
      : "profile";
    const s           = result.scores ?? {};
    // Encode all 5 dimensions so the public profile can show all bars
    const clarity     = s.Clarity   ?? 0;
    const energy      = s.Energy    ?? 0;
    const strength    = s.Strength  ?? 0;
    const direction   = s.Direction ?? 0;
    const action      = s.Action    ?? 0;
    const path = `/p/${modeSlug}-clarity${clarity}-energy${energy}-strength${strength}-direction${direction}-action${action}`;
    const base = window.location.hostname.includes("localhost")
      ? "http://localhost:5173"
      : "https://cla-ri-ty.netlify.app";
    return base + path;
  } catch (_) {
    return window.location.origin + "/p/profile";
  }
}

// ── Shared profile constants — single source of truth for all three views ────
const SCORE_COLORS = {
  Clarity:   "#4F8CFF",
  Energy:    "#FF8A4F",
  Strength:  "#9C6BFF",
  Direction: "#3DDC97",
  Action:    "#FF5A6F",
};
const SCORE_ORDER = ["Clarity", "Energy", "Strength", "Direction", "Action"];
// Clarity Score Scale: raw (0–20) × 3, capped at 75 (psychological room to grow)
const scorePct = (v) => Math.min(Math.round(v * 3), 75);

// ── ScoreIcon — minimal SVG icon for each clarity dimension ───────────────────
const ScoreIcon = memo(function ScoreIcon({ label, color, size = 18 }) {
  const sw = "1.8", slc = "round", slj = "round";
  if (label === "Clarity") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={slc} strokeLinejoin={slj} opacity="0.85">
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
  if (label === "Energy") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={slc} strokeLinejoin={slj} opacity="0.85">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
  if (label === "Strength") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={slc} strokeLinejoin={slj} opacity="0.85">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
  if (label === "Direction") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={slc} strokeLinejoin={slj} opacity="0.85">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
      <line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/>
      <line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/>
    </svg>
  );
  if (label === "Action") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap={slc} strokeLinejoin={slj} opacity="0.85">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
  return null;
});

// ── ClarityProfileView ─────────────────────────────────────────────────────────
// THE single source of truth rendered in all three views:
//   1. ResultSection (animated, result screen)
//   2. ClarityPublicProfile (/p/… page)
//   3. ClarityShareWrapper (html-to-image capture)
//
// Props
//   result     — full or partial result object; missing fields are skipped
//   heroVis    — header/hero visible (default true)
//   barsOn     — score bars filled + progress card visible (default true)
//   insightVis — insight / strengths / action visible (default true)
//   isStatic   — skip ALL CSS transitions (required for html-to-image capture)
function ClarityProfileView({
  result,
  heroVis      = true,
  barsOn       = true,
  insightVis   = true,
  isStatic     = false,
  showInsights = true,   // false = share-image mode: stops after Fortschrittspotenzial
}) {
  const primaryMode  = Array.isArray(result?.identityModes) && result.identityModes[0];
  // Only render scores that are present, in canonical order
  const scoreEntries = result?.scores
    ? SCORE_ORDER.filter((k) => result.scores[k] != null).map((k) => [k, result.scores[k]])
    : [];

  // Builds a transition style string — returns {} when isStatic (for share capture)
  const tr = (props, ms, delay = 0) =>
    isStatic ? {} : { transition: `${props} ${ms}ms ease${delay ? ` ${delay}ms` : ""}` };

  return (
    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
        padding: "80px 24px 64px",
        textAlign: "center",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        opacity: heroVis ? 1 : 0,
        transform: heroVis ? "none" : "translateY(16px)",
        ...tr("opacity, transform", 600),
      }}>
        <div style={{
          fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase",
          color: "#000", opacity: 0.38, marginBottom: 24,
        }}>
          Dein Clarity-Profil
        </div>

        {primaryMode && (
          <>
            <div style={{
              fontSize: "clamp(36px, 9vw, 64px)", fontWeight: 700,
              letterSpacing: "-0.025em", color: "#000", lineHeight: 1.0, marginBottom: 14,
            }}>
              {primaryMode.type.toUpperCase()}
            </div>
            <div style={{ fontSize: 16, fontWeight: 500, color: "#000", opacity: 0.42, letterSpacing: "0.06em" }}>
              {primaryMode.confidence}% Übereinstimmung
            </div>
          </>
        )}

        {/* Vergleich card — people icon, blue gradient */}
        <div style={{ maxWidth: 480, margin: "20px auto 0" }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(79,140,255,0.09) 0%, rgba(124,92,255,0.07) 100%)",
            border: "1px solid rgba(79,140,255,0.18)",
            borderRadius: 16, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F8CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4F8CFF" }}>
                Vergleich mit anderen Nutzern
              </span>
            </div>
            <div style={{ fontSize: 16, color: "#000", opacity: 0.65, lineHeight: 1.6 }}>
              Du liegst aktuell im oberen 35% aller Teilnehmenden.
            </div>
          </div>
        </div>

        {result?.summary && (
          <div style={{
            fontSize: 18, color: "#000", opacity: 0.65, lineHeight: 1.6,
            marginTop: 32, maxWidth: 480, marginLeft: "auto", marginRight: "auto",
          }}>
            {result.summary}
          </div>
        )}

        {result?.confidence != null && (
          <div style={{ fontSize: 14, color: "#000", opacity: 0.3, letterSpacing: "0.06em", marginTop: 16 }}>
            Analysequalität: {result.confidence}%
          </div>
        )}
      </div>

      {/* ── SCORE DASHBOARD ──────────────────────────────────────────────────── */}
      {scoreEntries.length > 0 && (
        <div style={{
          maxWidth: 600, margin: "0 auto", padding: "52px 24px 0",
          opacity: barsOn ? 1 : 0,
          transform: barsOn ? "none" : "translateY(16px)",
          ...tr("opacity, transform", 600),
        }}>
          <div style={{
            fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase",
            color: "#000", opacity: 0.35, marginBottom: 40, textAlign: "center",
          }}>
            Dein Klarheitsprofil
          </div>

          {scoreEntries.map(([label, value]) => {
            const pct = scorePct(value);
            const col = SCORE_COLORS[label] || "#000";
            return (
              <div key={label} style={{ marginBottom: 22 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <ScoreIcon label={label} color={col} size={18} />
                    <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: "0.04em", color: "#000", opacity: 0.65 }}>
                      {label}
                    </span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 600, color: col }}>{pct}%</span>
                </div>
                <div style={{ height: 12, borderRadius: 8, background: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                  <div style={{
                    height: 12, borderRadius: 8, background: col,
                    width: barsOn ? `${pct}%` : "0%",
                    boxShadow: barsOn ? `0 0 8px ${col}4D` : "none",
                    ...(isStatic ? {} : { transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }),
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PROGRESS POTENTIAL — trending-up icon, blue card ─────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "24px 24px 0",
        opacity: barsOn ? 1 : 0,
        ...tr("opacity", 600, 200),
      }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(79,140,255,0.09) 0%, rgba(124,92,255,0.07) 100%)",
          border: "1px solid rgba(79,140,255,0.18)",
          borderRadius: 16, padding: "18px 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F8CFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#4F8CFF" }}>
              Dein Fortschrittspotenzial
            </span>
          </div>
          <div style={{ fontSize: 16, color: "#000", opacity: 0.65, lineHeight: 1.6 }}>
            Viele Menschen starten in diesem Bereich bei etwa 40–60%.{" "}
            Mit den richtigen Gewohnheiten kannst du über 90% erreichen.
          </div>
        </div>
      </div>

      {/* ── INSIGHT — hidden in share-image mode ───────────────────────────── */}
      {showInsights && result?.pattern && (
        <div style={{
          maxWidth: 600, margin: "0 auto", padding: "44px 24px 0",
          opacity: insightVis ? 1 : 0,
          transform: insightVis ? "none" : "translateY(12px)",
          ...tr("opacity, transform", 600),
        }}>
          <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000", opacity: 0.38, marginBottom: 18 }}>
            Insight
          </div>
          <div style={{ fontSize: 18, lineHeight: 1.6, opacity: 0.88, color: "#000" }}>
            {result.pattern}
          </div>
        </div>
      )}

      {/* ── STRENGTHS / ENERGY SOURCES / NEXT FOCUS — hidden in share mode ───── */}
      {showInsights && (result?.strengths?.length || result?.energySources?.length || result?.nextFocus) && (
        <div style={{
          maxWidth: 600, margin: "44px auto 0", padding: "0 24px",
          opacity: insightVis ? 1 : 0,
          ...tr("opacity", 600, 100),
        }}>
          {[
            { title: "Deine Stärken",        items: result?.strengths },
            { title: "Deine Energiequellen", items: result?.energySources },
            { title: "Dein nächster Fokus",  items: result?.nextFocus ? [result.nextFocus] : null },
          ].map(({ title, items }) => items?.length ? (
            <div key={title} style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 14, letterSpacing: "0.12em", textTransform: "uppercase", color: "#000", opacity: 0.38, marginBottom: 18 }}>
                {title}
              </div>
              {items.map((s, i) => (
                <div key={i} style={{ fontSize: 18, color: "#000", lineHeight: 1.6, opacity: 0.85 }}>— {s}</div>
              ))}
            </div>
          ) : null)}
        </div>
      )}

      {/* ── TODAY'S ACTION — hidden in share-image mode ────────────────────────── */}
      {showInsights && result?.suggestedAction && (
        <div style={{
          maxWidth: 600, margin: "24px auto 0", padding: "0 24px",
          opacity: insightVis ? 1 : 0,
          transform: insightVis ? "none" : "translateY(10px)",
          ...tr("opacity, transform", 600, 150),
        }}>
          <div style={{
            background: "linear-gradient(135deg, rgba(255,90,111,0.09) 0%, rgba(255,138,79,0.08) 100%)",
            border: "1px solid rgba(255,90,111,0.20)",
            borderRadius: 16, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <ScoreIcon label="Action" color="#FF5A6F" size={20} />
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#FF5A6F" }}>
                Deine Aufgabe für heute
              </span>
            </div>
            <div style={{ fontSize: 18, color: "#000", lineHeight: 1.6, opacity: 0.82 }}>
              {result.suggestedAction}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── ClarityShareWrapper — 1200 × 1600 container for html-to-image capture ─────
// Renders ClarityProfileView with isStatic=true (no transitions) so html-to-image

function parseProfileSlug(slug) {
  try {
    const clarityMatch   = slug.match(/clarity(\d+)/i);
    const energyMatch    = slug.match(/energy(\d+)/i);
    const strengthMatch  = slug.match(/strength(\d+)/i);
    const directionMatch = slug.match(/direction(\d+)/i);
    const actionMatch    = slug.match(/action(\d+)/i);

    const clarityScore   = clarityMatch   ? parseInt(clarityMatch[1],   10) : null;
    const energyScore    = energyMatch    ? parseInt(energyMatch[1],    10) : null;
    const strengthScore  = strengthMatch  ? parseInt(strengthMatch[1],  10) : null;
    const directionScore = directionMatch ? parseInt(directionMatch[1], 10) : null;
    const actionScore    = actionMatch    ? parseInt(actionMatch[1],    10) : null;

    const scoresIndex = slug.search(/clarity\d+/i);
    const modeSection = slug.substring(0, scoresIndex).replace(/-$/, "");
    const lastDash    = modeSection.lastIndexOf("-");
    const rawType     = modeSection.substring(0, lastDash);
    const confidence  = parseInt(modeSection.substring(lastDash + 1), 10);

    const modeType = rawType
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return {
      modeType,
      confidence:    isNaN(confidence) ? null : confidence,
      clarityScore,
      energyScore,
      strengthScore,
      directionScore,
      actionScore,
    };
  } catch (_) {
    return {
      modeType: "Explorer", confidence: null,
      clarityScore: null, energyScore: null,
      strengthScore: null, directionScore: null, actionScore: null,
    };
  }
}

// ── ClarityPublicProfile — public /p/… page ────────────────────────────────────
// Now uses ClarityProfileView for 100% visual consistency with the result screen.
// Only Clarity + Energy scores are available from the URL slug; other dimensions

export {
  generateProfileLink,
  SCORE_COLORS,
  SCORE_ORDER,
  scorePct,
  ScoreIcon,
  ClarityProfileView,
  parseProfileSlug,
};
