import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────
   DEV PROFILES — keyboard toggle (1/2/3) or ?dev=key in URL
───────────────────────────────────────────────────────────── */

const DEV_PROFILES = {
  explorer_low: {
    summary:      "Du bist aktuell auf der Suche nach Klarheit in verschiedenen Lebensbereichen.",
    pattern:      "Du denkst viel nach, aber handelst selten. Der nächste Schritt fehlt noch.",
    strengths:    ["Offenheit für neue Perspektiven", "Hohe Reflexionsfähigkeit"],
    energySources: ["Gespräche mit ehrlichen Menschen", "Zeit in der Natur"],
    nextFocus:    "Wähle einen Bereich und setze heute eine kleine Aktion um.",
    suggestedAction: "Schreib drei Dinge auf, die du in den nächsten 30 Tagen ändern willst.",
    confidence:   40,
    scores:       { Clarity: 3, Energy: 4, Strength: 5, Direction: 2, Action: 3 },
    identityModes: [{ type: "Explorer", confidence: 40 }],
  },
  high_performer: {
    summary:      "Du hast klare Strukturen und setzt Dinge konsequent um.",
    pattern:      "Du bist im Flow — aber Erholung und Tiefe kommen manchmal zu kurz.",
    strengths:    ["Konsequenz", "Klarheit über Ziele", "Hohe Umsetzungskraft"],
    energySources: ["Ergebnisse sehen", "Fokussierte Arbeitsphasen", "Klare Prioritäten"],
    nextFocus:    "Schutz deine Energie — nicht alles verdient dein Bestes.",
    suggestedAction: "Blockiere einmal pro Woche zwei Stunden für tiefe, ungestörte Arbeit.",
    confidence:   80,
    scores:       { Clarity: 8, Energy: 7, Strength: 8, Direction: 9, Action: 8 },
    identityModes: [{ type: "Builder", confidence: 80 }],
  },
  chaotic: {
    summary:      "Du bist in vielen Bereichen aktiv, aber ohne klare Richtung.",
    pattern:      "Viel Energie, aber kein Kanal. Du springst von Idee zu Idee ohne Abschluss.",
    strengths:    ["Hohe Kreativität", "Breites Interessenspektrum"],
    energySources: ["Neue Ideen", "Spontane Projekte"],
    nextFocus:    "Wähle ein Projekt und bring es zu Ende, bevor du das nächste beginnst.",
    suggestedAction: "Schreib alle aktiven Projekte auf. Streich 70% davon.",
    confidence:   30,
    scores:       { Clarity: 2, Energy: 6, Strength: 4, Direction: 1, Action: 3 },
    identityModes: [{ type: "Explorer", confidence: 30 }],
  },
};

const _urlParams       = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
const devProfileFromUrl = _urlParams.get("dev");

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS — single source of truth
───────────────────────────────────────────────────────────── */

const SCORE_COLORS = {
  Clarity:   "#4F8CFF",
  Energy:    "#FF8A4F",
  Strength:  "#9C6BFF",
  Direction: "#3DDC97",
  Action:    "#FF5A6F",
};
const SCORE_ORDER = ["Clarity", "Energy", "Strength", "Direction", "Action"];

const CLR = {
  primary:   "#4F8CFF",
  secondary: "#9C6BFF",
  orange:    "#D97B3C",
  green:     "#2D9E74",
};

const T = {
  high:  "rgba(0,0,0,0.82)",
  mid:   "rgba(0,0,0,0.60)",
  low:   "rgba(0,0,0,0.40)",
  muted: "rgba(0,0,0,0.28)",
};

const FS = {
  label: 11,
  body:  16,
  small: 14,
};

const CARD = {
  background:   "rgba(0,0,0,0.025)",
  border:       "1px solid rgba(0,0,0,0.07)",
  borderRadius: 12,
  padding:      "20px 22px",
};

const INPUT_STYLE = {
  boxSizing:    "border-box",
  padding:      "10px 14px",
  borderRadius: 8,
  border:       "1px solid rgba(0,0,0,0.12)",
  background:   "rgba(0,0,0,0.025)",
  fontSize:     FS.body,
  color:        T.high,
  outline:      "none",
  fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
  width:        "100%",
};

const insightBorder = (color) => ({
  borderLeft:    `3px solid ${color}`,
  paddingLeft:   18,
  paddingTop:    2,
  paddingBottom: 2,
});

const scorePct = (v) => Math.min(Math.round(v * 3), 75);
const IDENTITY_FALLBACK = { type: "Explorer", confidence: 60 };

/* ─────────────────────────────────────────────────────────────
   RESULT SAFETY UTILITIES
───────────────────────────────────────────────────────────── */

function safeEncodeResult(result) {
  try {
    const json = JSON.stringify(result);
    return btoa(unescape(encodeURIComponent(json)));
  } catch (_) { return ""; }
}

function safeDecodeResult(slug) {
  try {
    if (!slug || typeof slug !== "string" || slug.length === 0)
      return { ok: false, result: null };
    const json   = decodeURIComponent(escape(atob(slug)));
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return { ok: false, result: null };
    return { ok: true, result: parsed };
  } catch (_) { return { ok: false, result: null }; }
}

function validateResult(raw) {
  const base = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  const rawScores = base.scores && typeof base.scores === "object" ? base.scores : {};
  const scores = {};
  SCORE_ORDER.forEach(k => {
    const v = rawScores[k];
    if (typeof v === "number" && isFinite(v)) scores[k] = v;
  });

  const rawModes      = Array.isArray(base.identityModes) ? base.identityModes : [];
  const identityModes = rawModes
    .filter(m => m && typeof m === "object" && typeof m.type === "string" && m.type.trim())
    .map(m => ({
      type:       String(m.type).trim(),
      confidence: typeof m.confidence === "number" && isFinite(m.confidence) ? m.confidence : 60,
    }));

  return {
    summary:         typeof base.summary         === "string" ? base.summary         : "",
    pattern:         typeof base.pattern         === "string" ? base.pattern         : "",
    strengths:       Array.isArray(base.strengths)       ? base.strengths.filter(s => typeof s === "string")       : [],
    energySources:   Array.isArray(base.energySources)   ? base.energySources.filter(s => typeof s === "string")   : [],
    nextFocus:       typeof base.nextFocus        === "string" ? base.nextFocus       : "",
    suggestedAction: typeof base.suggestedAction  === "string" ? base.suggestedAction : "",
    confidence:      typeof base.confidence       === "number" ? base.confidence      : null,
    scores,
    identityModes,
  };
}

function computeSocialStats(scores) {
  const keys = SCORE_ORDER.filter(k => scores[k] != null);
  if (!keys.length) return { percentile: 35, floor: 45, ceiling: 90 };
  const avg        = keys.reduce((s, k) => s + scores[k], 0) / keys.length;
  const percentile = Math.max(8,  Math.min(48, Math.round(48 - (avg - 10) * 1.8)));
  const floor      = Math.max(30, Math.min(58, Math.round(30 + (avg / 25) * 28)));
  const ceiling    = Math.min(95, floor + 40);
  return { percentile, floor, ceiling };
}

/* ─────────────────────────────────────────────────────────────
   ICONS
───────────────────────────────────────────────────────────── */
const IconInsight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconShield = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconLightning = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconCompass = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const IconRocket = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

/* ── SectionLabel ─────────────────────────────────────────── */
const SectionLabel = ({ children, icon, color }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    fontSize: FS.label, letterSpacing: "0.15em", textTransform: "uppercase",
    color: color || T.muted, fontWeight: 600, marginBottom: 12,
  }}>
    {icon}{children}
  </div>
);

/* ── ScoreRing ────────────────────────────────────────────── */
function ScoreRing({ name, value, animated }) {
  const pct   = animated ? scorePct(value) : 0;
  const color = SCORE_COLORS[name] || CLR.primary;
  const R = 34, SIZE = 88, CX = SIZE / 2;
  const circ   = 2 * Math.PI * R;
  const offset = circ * (1 - pct / 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: "visible" }}>
        <circle cx={CX} cy={CX} r={R} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="10" />
        <circle
          cx={CX} cy={CX} r={R} fill="none"
          stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CX})`}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.0,0.0,0.2,1)" }}
        />
        <text x={CX} y={CX} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fill: T.high, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          {pct}%
        </text>
      </svg>
      <div style={{ fontSize: FS.label, letterSpacing: "0.09em", textTransform: "uppercase", color: T.low, fontWeight: 500 }}>
        {name}
      </div>
    </div>
  );
}

/* ── BulletList ───────────────────────────────────────────── */
function BulletList({ items, accentColor = CLR.primary }) {
  if (!items?.length) return null;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < items.length - 1 ? 11 : 0 }}>
          <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: accentColor, marginTop: 8, flexShrink: 0, opacity: 0.80 }} />
          <span style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.6 }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Section ──────────────────────────────────────────────── */
function Section({ children, style = {}, delay = 0, onVisible }) {
  const ref          = useRef(null);
  const [visible, setVisible] = useState(false);
  const onVisibleRef = useRef(onVisible);
  onVisibleRef.current = onVisible;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const tid = setTimeout(() => {
            setVisible(true);
            onVisibleRef.current?.();
          }, delay);
          observer.unobserve(el);
          return () => clearTimeout(tid);
        }
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{
      maxWidth: 600, margin: "0 auto", padding: "0 24px", marginBottom: 36,
      opacity:    visible ? 1 : 0,
      transform:  visible ? "none" : "translateY(18px)",
      transition: "opacity 520ms ease, transform 520ms ease",
      willChange: "opacity, transform",
      ...style,
    }}>
      {children}
    </div>
  );
}

/* ── Divider ──────────────────────────────────────────────── */
const Divider = () => (
  <div style={{ maxWidth: 600, margin: "0 auto 36px", padding: "0 24px" }}>
    <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
  </div>
);

/* ── ActionButton ─────────────────────────────────────────── */
const ActionButton = ({ label, onClick, active = true, green = false, style: extra = {} }) => (
  <button onClick={onClick} style={{
    height: 44, padding: "0 22px",
    background: green && active ? CLR.green : active ? "#111" : "rgba(0,0,0,0.10)",
    color: "#fff", border: "none",
    fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize:     FS.small, fontWeight: 600, borderRadius: 10,
    cursor:       active ? "pointer" : "not-allowed",
    transition:   "background 200ms",
    boxShadow:    active && green ? "0 3px 12px rgba(45,158,116,0.22)" : active ? "0 3px 10px rgba(0,0,0,0.12)" : "none",
    ...extra,
  }}>
    {label}
  </button>
);

const BackButton = ({ onClick }) => (
  <button onClick={onClick} style={{
    height: 44, padding: "0 18px", background: "transparent", color: T.low,
    border: "1px solid rgba(0,0,0,0.12)",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: FS.small, fontWeight: 500, borderRadius: 10, cursor: "pointer",
  }}>
    ← Zurück
  </button>
);

/* ─────────────────────────────────────────────────────────────
   RadialAvatar — bold minimal identity symbol
───────────────────────────────────────────────────────────── */
function RadialAvatar({ scores }) {
  const AVATAR_COLOR = "#4F8CFF";

  const size      = 360;
  const center    = size / 2;
  const radius    = 148;
  const total     = SCORE_ORDER.length;
  const angleStep = (Math.PI * 2) / total;

  const points = SCORE_ORDER.map((key, i) => {
    const raw   = scores[key] != null ? scores[key] : 0;
    const pct   = Math.min(Math.max(raw * 3, 6), 75) / 75;
    const angle = i * angleStep - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * radius * pct,
      y: center + Math.sin(angle) * radius * pct,
    };
  });

  const shapePath = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{
      position:       "relative",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "20px",
    }}>

      {/* Strong radial glow */}
      <div style={{
        position:     "absolute",
        width:        280,
        height:       280,
        borderRadius: "50%",
        background:   "radial-gradient(ellipse at center, rgba(79,140,255,0.38) 0%, rgba(79,140,255,0.12) 45%, transparent 72%)",
        filter:       "blur(24px)",
        pointerEvents: "none",
      }} />

      {/* Secondary outer halo */}
      <div style={{
        position:     "absolute",
        width:        360,
        height:       360,
        borderRadius: "50%",
        background:   "radial-gradient(ellipse at center, transparent 30%, rgba(79,140,255,0.08) 60%, transparent 80%)",
        pointerEvents: "none",
      }} />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible", position: "relative" }}
      >
        {/* Outer boundary ring */}
        <circle
          cx={center} cy={center}
          r={radius}
          fill="none"
          stroke="rgba(79,140,255,0.12)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />

        {/* Mid reference ring */}
        <circle
          cx={center} cy={center}
          r={radius * 0.5}
          fill="none"
          stroke="rgba(79,140,255,0.06)"
          strokeWidth="1"
        />

        {/* Identity shape */}
        <polygon
          points={shapePath}
          fill="rgba(79,140,255,0.14)"
          stroke={AVATAR_COLOR}
          strokeWidth="4.5"
          strokeLinejoin="round"
          style={{
            filter: "drop-shadow(0 0 22px rgba(79,140,255,0.60)) drop-shadow(0 0 8px rgba(79,140,255,0.40))",
          }}
        />

        {/* Vertex anchor dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y}
            r="7"
            fill={AVATAR_COLOR}
            stroke="#0a0a0a"
            strokeWidth="2"
            style={{ filter: "drop-shadow(0 0 6px rgba(79,140,255,0.70))" }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ClarityAvatarCard — 1200×1600 identity share card
───────────────────────────────────────────────────────────── */
function ClarityAvatarCard({ result, wrapperRef }) {
  const safeR      = validateResult(result);
  const scores     = safeR.scores;
  const identModes = safeR.identityModes.length > 0 ? safeR.identityModes : [IDENTITY_FALLBACK];
  const { percentile } = computeSocialStats(scores);

  const topKey = SCORE_ORDER.reduce((best, k) => {
    if (scores[k] == null) return best;
    return (best == null || scores[k] > scores[best]) ? k : best;
  }, null);
  const accentColor = topKey ? SCORE_COLORS[topKey] : "#4F8CFF";

  const summaryShort = safeR.summary
    ? (safeR.summary.length > 120 ? safeR.summary.slice(0, 118).trimEnd() + "…" : safeR.summary)
    : "";

  const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  return (
    <div ref={wrapperRef} style={{
      width: 1200, height: 1600,
      background: "#0a0a0a",
      display: "flex", flexDirection: "column",
      fontFamily: FF,
      position: "relative",
      overflow: "hidden",
    }}>

      {/* Background atmosphere blobs */}
      <div style={{
        position: "absolute", top: -300, left: "50%",
        transform: "translateX(-50%)",
        width: 1100, height: 1100, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(79,140,255,0.09) 0%, transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: -120, right: -120,
        width: 640, height: 640, borderRadius: "50%",
        background: "radial-gradient(ellipse, rgba(156,107,255,0.10) 0%, transparent 68%)",
        pointerEvents: "none",
      }} />

      {/* Card inner */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "space-between",
        padding: "88px 100px 80px",
        position: "relative", zIndex: 1,
      }}>

        {/* TOP: wordmark + badge */}
        <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{
            fontSize: 13, letterSpacing: "0.52em", textTransform: "uppercase",
            color: "#fff", opacity: 0.22, fontWeight: 500,
          }}>
            clarity
          </div>
          <div style={{
            fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase",
            color: accentColor, fontWeight: 600,
            border: `1px solid ${accentColor}55`,
            padding: "7px 18px", borderRadius: 40,
          }}>
            Dein Profil
          </div>
        </div>

        {/* MIDDLE: identity → avatar → summary */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center", padding: "40px 0 0",
          width: "100%",
        }}>

          {/* Primary identity */}
          <div style={{
            fontSize: 120, fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 0.88,
            color: "#fff", marginBottom: 18,
          }}>
            {identModes[0].type}
          </div>

          {/* Secondary identity */}
          {identModes[1] && (
            <div style={{
              fontSize: 22, color: "#fff", opacity: 0.30,
              letterSpacing: "0.16em", textTransform: "uppercase",
              fontWeight: 400, marginBottom: 12,
            }}>
              + {identModes[1].type}
            </div>
          )}

          {/* Accent rule */}
          <div style={{
            width: 48, height: 3, borderRadius: 2,
            background: accentColor,
            margin: "0 auto 52px",
            boxShadow: `0 0 16px ${accentColor}88`,
          }} />

          {/* RadialAvatar scaled up for 1200px card */}
          <div style={{ transform: "scale(1.55)", transformOrigin: "center center", marginBottom: 0 }}>
            <RadialAvatar scores={scores} />
          </div>

          {/* Summary quote */}
          {summaryShort && (
            <div style={{
              fontSize: 27, fontStyle: "italic",
              color: "#fff", opacity: 0.44,
              lineHeight: 1.60, maxWidth: 800,
              fontWeight: 300, marginTop: 52,
            }}>
              "{summaryShort}"
            </div>
          )}

        </div>

        {/* BOTTOM: percentile row */}
        <div style={{ width: "100%" }}>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: 32 }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{
                fontSize: 10, letterSpacing: "0.34em", textTransform: "uppercase",
                color: "#fff", opacity: 0.22, marginBottom: 8,
              }}>
                Top Teilnehmende
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <span style={{
                  fontSize: 60, fontWeight: 800,
                  color: accentColor, letterSpacing: "-0.03em", lineHeight: 1,
                }}>
                  {percentile}%
                </span>
                <span style={{ fontSize: 16, color: "#fff", opacity: 0.30 }}>weltweit</span>
              </div>
            </div>
            <div style={{
              fontSize: 11, letterSpacing: "0.44em", textTransform: "uppercase",
              color: "#fff", opacity: 0.13,
            }}>
              clarity.ai
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ResultSection
───────────────────────────────────────────────────────────── */

function ResultSection({ result: realResult }) {
  const [vis,               setVis]               = useState(false);
  const [headerVis,         setHeaderVis]          = useState(false);
  const [avatarVis,         setAvatarVis]          = useState(false);
  const [barsReady,         setBarsReady]          = useState(false);
  const [hoverCta,          setHoverCta]           = useState(false);
  const [generating,        setGenerating]         = useState(false);
  const [shareConfirm,      setShareConfirm]       = useState(false);
  const [copiedLink,        setCopiedLink]         = useState(false);
  const [habitCommitted,    setHabitCommitted]     = useState(false);
  const [selectedHabit,     setSelectedHabit]      = useState("");
  const [selectedNutrition, setSelectedNutrition]  = useState(false);
  const [habitTime,         setHabitTime]          = useState("");
  const [habitEmail,        setHabitEmail]         = useState("");
  const [habitStep,         setHabitStep]          = useState(1);
  const [habitDone,         setHabitDone]          = useState(false);
  const [checkEmail,        setCheckEmail]         = useState("");
  const [checkEmailDone,    setCheckEmailDone]     = useState(false);
  const [hoverImg,          setHoverImg]           = useState(false);
  const [hoverNative,       setHoverNative]        = useState(false);
  const [shareWrapperMounted, setShareWrapperMounted] = useState(false);
  const [avatarScale,       setAvatarScale]        = useState(0.46);
  const [devProfile,        setDevProfile]         = useState(devProfileFromUrl);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : true
  );

  const shareWrapperRef    = useRef(null);
  const avatarContainerRef = useRef(null);

  /* ── Keyboard toggle for dev profiles ──────────────────── */
  useEffect(() => {
    const handleKey = (e) => {
      // Only fire when no input/textarea is focused
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "1") setDevProfile("explorer_low");
      if (e.key === "2") setDevProfile("high_performer");
      if (e.key === "3") setDevProfile("chaotic");
      if (e.key === "0") setDevProfile(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const el = avatarContainerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w > 0) setAvatarScale(w / 1200);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t1 = setTimeout(() => setVis(true),        0);
    const t2 = setTimeout(() => setHeaderVis(true), 80);
    const t3 = setTimeout(() => setAvatarVis(true), 220);
    const t4 = setTimeout(() => setShareWrapperMounted(true), 3000);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  const handleScoresVisible = useCallback(() => {
    setTimeout(() => setBarsReady(true), 180);
  }, []);

  /* ── handlers ──────────────────────────────────────────── */
  const generateShareImage = async () => {
    if (generating) return;
    setGenerating(true);
    if (!shareWrapperMounted) {
      setShareWrapperMounted(true);
      await new Promise(r => setTimeout(r, 80));
    }
    if (!shareWrapperRef.current) { setGenerating(false); return; }
    try {
      const { toPng: _toPng } = await import("html-to-image");
      const dataUrl = await _toPng(shareWrapperRef.current, { cacheBust: true, pixelRatio: 1, style: { borderRadius: "0px" } });
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "clarity-profil.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Mein Clarity Profil", files: [file] });
            setGenerating(false);
            return;
          }
        } catch (_) {}
      }
      const a = document.createElement("a");
      a.download = "clarity-profil.png";
      a.href = dataUrl;
      a.click();
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 3500);
    } catch (_) {
      // failed silently
    } finally {
      setGenerating(false);
    }
  };

  const nativeShare = async () => {
    const slug = safeEncodeResult(safeResult);
    if (!slug) return;
    const shareUrl = window.location.origin + "/p/" + slug;
    try { localStorage.setItem("clarity_" + slug, JSON.stringify(safeResult)); } catch (_) {}
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (_) {}
  };

  const BTN = (label, onClick, hover, setHover, opts = {}) => (
    <button
      onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      disabled={opts.disabled}
      style={{
        border:     `1px solid ${hover ? "transparent" : "rgba(0,0,0,0.13)"}`,
        background: hover ? "#111" : "rgba(255,255,255,0.70)",
        color:      hover ? "#fff" : T.high,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: FS.small, letterSpacing: "0.06em",
        padding: "12px 22px", borderRadius: 8,
        cursor:   opts.disabled ? "wait" : "pointer",
        transition: "background 180ms, color 180ms, border 180ms",
        opacity:  opts.disabled ? 0.50 : 1,
        width: "100%", maxWidth: 320,
        textAlign: "left",
        boxShadow: hover ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
        ...opts.style,
      }}
    >
      {label}
    </button>
  );

  /* ── derived data ───────────────────────────────────────── */
  // Dev override: if a valid devProfile key is active, use that data instead of the real result
  const finalResult         = devProfile && DEV_PROFILES[devProfile] ? DEV_PROFILES[devProfile] : realResult;
  console.log("DEV PROFILE:", devProfile);

  const safeResult          = validateResult(finalResult);
  const scores              = safeResult.scores;
  const rawIdentModes       = safeResult.identityModes;
  const effectiveIdentModes = rawIdentModes.length > 0 ? rawIdentModes : [IDENTITY_FALLBACK];
  const habitLabels = { walk: "Spaziergang", meditate: "Meditation", workout: "Workout" };

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      opacity:    vis ? 1 : 0, transform: vis ? "none" : "translateY(18px)",
      transition: "opacity 650ms ease, transform 650ms ease",
      paddingBottom: 80,
    }}>

      {/* Dev overlay badge — visible only when a dev profile is active */}
      {devProfile && DEV_PROFILES[devProfile] && (
        <div style={{
          position:   "fixed", top: 12, right: 12, zIndex: 9999,
          padding:    "6px 14px", borderRadius: 20,
          background: "rgba(79,140,255,0.92)",
          color:      "#fff",
          fontSize:   FS.label, fontWeight: 700, letterSpacing: "0.10em",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          boxShadow:  "0 2px 12px rgba(79,140,255,0.40)",
          pointerEvents: "none",
          textTransform: "uppercase",
        }}>
          DEV · {devProfile}
        </div>
      )}

      {/* Page header */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "48px 24px 0",
        opacity:    headerVis ? 1 : 0, transform: headerVis ? "none" : "translateY(8px)",
        transition: "opacity 550ms ease, transform 550ms ease",
      }}>
        <div style={{ fontSize: FS.label, letterSpacing: "0.18em", textTransform: "uppercase", color: CLR.primary, fontWeight: 600, marginBottom: 6 }}>
          Dein Clarity Profil
        </div>
        <div style={{ width: 20, height: 2, background: `linear-gradient(90deg,${CLR.primary},${CLR.secondary})`, borderRadius: 2 }} />
      </div>

      {/* ─── Avatar Card Hero ─────────────────────────────────── */}
      <div style={{
        maxWidth: 600, margin: "0 auto", padding: "24px 24px 0",
        marginBottom: 56,
        opacity:    avatarVis ? 1 : 0,
        transform:  avatarVis ? "none" : "translateY(14px)",
        transition: "opacity 700ms ease, transform 700ms ease",
      }}>
        <div
          ref={avatarContainerRef}
          style={{
            width: "100%",
            position: "relative",
            paddingTop: "133.33%",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          <div style={{
            position: "absolute", top: 0, left: 0,
            transformOrigin: "top left",
            transform: `scale(${avatarScale})`,
          }}>
            <ClarityAvatarCard result={finalResult} />
          </div>
        </div>
      </div>

      {/* Section 0 — Summary */}
      {safeResult.summary && (
        <Section delay={80}>
          <div style={{ ...CARD }}>
            <SectionLabel>Zusammenfassung</SectionLabel>
            <div style={{ fontSize: 17, fontStyle: "italic", color: T.high, lineHeight: 1.65, opacity: 0.82 }}>
              {safeResult.summary}
            </div>
          </div>
        </Section>
      )}

      {/* Section 1 — Explanation */}
      <Section delay={safeResult.summary ? 160 : 80}>
        <div style={{ ...CARD }}>
          <SectionLabel>Was zeigt diese Analyse?</SectionLabel>
          <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.65, marginBottom: 10 }}>
            Diese Analyse zeigt deine Stärke in fünf Bereichen deines Lebens.
          </div>
          <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.65 }}>
            Sie basiert auf deinem Gespräch mit Clarity und zeigt dir, wo du gerade stehst.
          </div>
        </div>
      </Section>

      {/* ═══ VERSTÄNDNIS ════════════════════════════════════════ */}

      {SCORE_ORDER.some(k => scores[k] != null) && (
        <Section delay={0} onVisible={handleScoresVisible}>
          <SectionLabel>Dein Profil</SectionLabel>
          <div style={{
            display: "flex",
            flexWrap:       isMobile ? "wrap" : "nowrap",
            justifyContent: isMobile ? "flex-start" : "space-between",
            gap:            isMobile ? 20 : 8,
          }}>
            {SCORE_ORDER.map(key => scores[key] != null ? (
              <div key={key} style={{ flexShrink: 0, width: isMobile ? "calc(50% - 10px)" : "auto", display: "flex", justifyContent: "center" }}>
                <ScoreRing name={key} value={scores[key]} animated={barsReady} />
              </div>
            ) : null)}
          </div>
        </Section>
      )}

      {/* ═══ INSIGHTS ══════════════════════════════════════════ */}

      {safeResult.pattern && (
        <Section delay={0}>
          <div style={insightBorder(CLR.primary)}>
            <SectionLabel icon={<IconInsight />} color={CLR.primary}>Das verborgene Muster</SectionLabel>
            <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.65 }}>{safeResult.pattern}</div>
          </div>
        </Section>
      )}

      {safeResult.strengths?.length > 0 && (
        <Section delay={0}>
          <div style={insightBorder(CLR.secondary)}>
            <SectionLabel icon={<IconShield />} color={CLR.secondary}>Deine Stärken</SectionLabel>
            <BulletList items={safeResult.strengths} accentColor={CLR.secondary} />
          </div>
        </Section>
      )}

      {safeResult.energySources?.length > 0 && (
        <Section delay={0}>
          <div style={insightBorder(CLR.orange)}>
            <SectionLabel icon={<IconLightning />} color={CLR.orange}>Deine Energiequellen</SectionLabel>
            <BulletList items={safeResult.energySources} accentColor={CLR.orange} />
          </div>
        </Section>
      )}

      <Divider />

      {/* ═══ HANDLUNG ══════════════════════════════════════════ */}

      <Section delay={0}>
        <div style={{ ...CARD, borderLeft: `3px solid ${CLR.green}`, borderRadius: "0 12px 12px 0" }}>
          <SectionLabel color={CLR.green}>Dein Fortschrittspotenzial</SectionLabel>
          <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.7, marginBottom: 12 }}>
            Dein größter Hebel liegt in der Transformation deiner täglichen Gewohnheiten.
          </div>
          <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.7, marginBottom: 14 }}>
            Mit den richtigen Gewohnheiten kannst du deine Stärke in diesen fünf Bereichen in wenigen Wochen deutlich steigern.
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 14 }}>
            <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.65, marginBottom: 6 }}>
              Es gibt zwei Arten von Gewohnheiten: die, die es sich lohnt aufzugeben — und die, die es sich lohnt zu beginnen.
            </div>
            <div style={{ fontSize: FS.small, color: CLR.green, lineHeight: 1.65, fontWeight: 600, marginBottom: 6 }}>
              Clarity arbeitet mit positiven Gewohnheiten.
            </div>
            <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.65 }}>
              Wenn du diese aufbaust, verschwinden viele negative Gewohnheiten von selbst.
            </div>
          </div>
        </div>
      </Section>

      <Section delay={0}>
        <div style={{ ...CARD }}>
          <SectionLabel color={CLR.primary}>Deine erste neue Gewohnheit</SectionLabel>
          <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.65, marginBottom: 20 }}>
            Klarheit entsteht nicht nur durch Denken, sondern durch Bewegung, Abstand und gute Routinen.
          </div>

          {habitDone ? (
            <div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 12,
                padding: "8px 16px", borderRadius: 20,
                background: "rgba(45,158,116,0.09)", border: "1px solid rgba(45,158,116,0.22)",
                fontSize: FS.small, color: CLR.green, fontWeight: 600,
              }}>
                ✓ Geplant für heute.
              </div>
              <div style={{ fontSize: FS.body, color: T.low, lineHeight: 1.6, marginBottom: 4 }}>
                {habitLabels[selectedHabit]}{selectedNutrition ? " + Salat" : ""} · {habitTime}
              </div>
              <div style={{ fontSize: FS.small, color: T.muted, lineHeight: 1.6 }}>
                Wir schicken dir eine Erinnerung an {habitEmail}.
              </div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: FS.label, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 12 }}>
                Wähle heute eine kleine Aktion:
              </div>
              {[
                { id: "walk",     primary: "20 Minuten Spaziergang im Park oder Wald ohne Handy", secondary: null },
                { id: "meditate", primary: "5 Minuten Meditation", secondary: "Aufrecht sitzen, Augen schließen, ruhig ein- und ausatmen." },
                { id: "workout",  primary: "Kurzes Workout", secondary: "20 Kniebeugen · 15 Liegestütze · 30 Sit-Ups" },
              ].map(item => {
                const sel = selectedHabit === item.id;
                return (
                  <div key={item.id}
                    onClick={() => { if (habitStep === 1) setSelectedHabit(item.id); }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10,
                      cursor: habitStep === 1 ? "pointer" : "default",
                      padding: "11px 13px", borderRadius: 10,
                      background: sel ? "rgba(79,140,255,0.07)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${sel ? "rgba(79,140,255,0.26)" : "rgba(0,0,0,0.07)"}`,
                      transition: "background 140ms, border 140ms",
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      border: `2px solid ${sel ? CLR.primary : "rgba(0,0,0,0.20)"}`,
                      background: sel ? CLR.primary : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 140ms, border 140ms",
                    }}>
                      {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: FS.body, color: sel ? T.high : T.mid, lineHeight: 1.5, fontWeight: sel ? 600 : 400 }}>
                        {item.primary}
                      </div>
                      {item.secondary && (
                        <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.5, marginTop: 2 }}>{item.secondary}</div>
                      )}
                    </div>
                  </div>
                );
              })}

              {selectedHabit && habitStep === 1 && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 14, marginTop: 4, marginBottom: 18 }}>
                  <div style={{ fontSize: FS.label, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
                    Nutrition (optional)
                  </div>
                  <div onClick={() => setSelectedNutrition(v => !v)} style={{
                    display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer",
                    padding: "11px 13px", borderRadius: 10,
                    background: selectedNutrition ? "rgba(45,158,116,0.06)" : "rgba(0,0,0,0.02)",
                    border: `1px solid ${selectedNutrition ? "rgba(45,158,116,0.22)" : "rgba(0,0,0,0.07)"}`,
                    transition: "background 140ms, border 140ms",
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
                      border: `2px solid ${selectedNutrition ? CLR.green : "rgba(0,0,0,0.20)"}`,
                      background: selectedNutrition ? CLR.green : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "background 140ms, border 140ms",
                    }}>
                      {selectedNutrition && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize: FS.body, color: selectedNutrition ? T.high : T.mid, lineHeight: 1.5, fontWeight: selectedNutrition ? 500 : 400 }}>
                      Frischer Salat mit viel Protein{" "}
                      <span style={{ color: T.low }}>(z.B. Huhn, Rinderhack oder Rind)</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedHabit && habitStep === 1 && (
                <div style={{ marginTop: selectedNutrition ? 0 : 18 }}>
                  <ActionButton label="Weiter" onClick={() => setHabitStep(2)} active />
                </div>
              )}

              {habitStep >= 2 && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 18, marginTop: 18 }}>
                  <div style={{ fontSize: FS.small, color: CLR.primary, fontWeight: 500, marginBottom: 14 }}>
                    ✓ {habitLabels[selectedHabit]}{selectedNutrition ? " + Salat" : ""}
                  </div>
                  <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.6, marginBottom: 12, fontWeight: 500 }}>
                    Wann möchtest du das machen?
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {["Heute Nachmittag", "Heute Abend"].map(opt => (
                      <div key={opt}
                        onClick={() => { if (habitStep === 2) setHabitTime(opt); }}
                        style={{
                          display: "inline-flex", alignItems: "center", cursor: habitStep === 2 ? "pointer" : "default",
                          padding: "8px 16px", borderRadius: 20,
                          background: habitTime === opt ? "rgba(79,140,255,0.09)" : "rgba(0,0,0,0.03)",
                          border: `1px solid ${habitTime === opt ? "rgba(79,140,255,0.28)" : "rgba(0,0,0,0.08)"}`,
                          fontSize: FS.small, color: habitTime === opt ? CLR.primary : T.mid,
                          fontWeight: habitTime === opt ? 600 : 400, transition: "all 140ms",
                        }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  {habitStep === 2 && (
                    <input
                      type="text" placeholder="Oder eigene Uhrzeit eingeben…"
                      value={["Heute Nachmittag", "Heute Abend"].includes(habitTime) ? "" : habitTime}
                      onChange={e => setHabitTime(e.target.value)}
                      onFocus={() => { if (["Heute Nachmittag", "Heute Abend"].includes(habitTime)) setHabitTime(""); }}
                      style={{ ...INPUT_STYLE, marginBottom: 14 }}
                    />
                  )}
                  {habitStep === 2 && habitTime && (
                    <ActionButton label="Weiter" onClick={() => setHabitStep(3)} active />
                  )}
                </div>
              )}

              {habitStep >= 3 && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 18, marginTop: 18 }}>
                  <div style={{ fontSize: FS.small, color: CLR.primary, fontWeight: 500, marginBottom: 14 }}>
                    ✓ {habitLabels[selectedHabit]}{selectedNutrition ? " + Salat" : ""} · {habitTime}
                  </div>
                  <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.6, marginBottom: 12 }}>
                    Wir schicken dir eine Erinnerung.
                  </div>
                  <input
                    type="email" placeholder="Deine E-Mail für die Erinnerung"
                    value={habitEmail} onChange={e => setHabitEmail(e.target.value)}
                    style={{ ...INPUT_STYLE, marginBottom: 14 }}
                  />
                  {habitEmail && (
                    <ActionButton
                      label="Für heute planen"
                      green
                      onClick={() => { setHabitDone(true); setHabitCommitted(true); }}
                      active
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      {habitDone && (
        <Section delay={0}>
          <div style={{ ...CARD }}>
            <SectionLabel color={CLR.secondary}>Kurzer Rückblick heute Abend</SectionLabel>
            <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.65, marginBottom: 12 }}>
              Schau heute Abend kurz hin: Was lief gut? Was würdest du morgen anders machen?
            </div>
            <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.65, marginBottom: 16 }}>
              Ein paar Minuten kurz hinschauen reicht. Kein Aufwand — einfach ehrlich sein.
            </div>
            {!checkEmailDone ? (
              <div>
                <div style={{ fontSize: FS.small, color: T.low, marginBottom: 8 }}>
                  Erinnerung für heute Abend:
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                  <input
                    type="email" placeholder="Deine E-Mail"
                    value={checkEmail} onChange={e => setCheckEmail(e.target.value)}
                    style={{ ...INPUT_STYLE, flex: 1, width: "auto" }}
                  />
                  <button
                    onClick={() => { if (checkEmail) setCheckEmailDone(true); }}
                    disabled={!checkEmail}
                    style={{
                      height: 43, padding: "0 18px",
                      background: checkEmail ? CLR.secondary : "rgba(0,0,0,0.05)",
                      color: checkEmail ? "#fff" : T.muted,
                      border: `1px solid ${checkEmail ? "transparent" : "rgba(0,0,0,0.10)"}`,
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                      fontSize: FS.small, fontWeight: 600, borderRadius: 8,
                      cursor: checkEmail ? "pointer" : "not-allowed",
                      transition: "background 200ms, color 200ms, border 200ms",
                      whiteSpace: "nowrap", opacity: checkEmail ? 1 : 0.60,
                    }}
                  >
                    Erinnerung erhalten
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "8px 14px", borderRadius: 20,
                background: "rgba(156,107,255,0.08)", border: "1px solid rgba(156,107,255,0.18)",
                fontSize: FS.small, color: CLR.secondary, fontWeight: 500,
              }}>
                ✓ Wir erinnern dich heute Abend daran.
              </div>
            )}
          </div>
        </Section>
      )}

      <Divider />

      {/* ═══ NEXT STEP ═════════════════════════════════════════ */}

      {safeResult.nextFocus && (
        <Section delay={0}>
          <div style={insightBorder(CLR.green)}>
            <SectionLabel icon={<IconCompass />} color={CLR.green}>Dein nächster Fokus</SectionLabel>
            <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.65 }}>{safeResult.nextFocus}</div>
          </div>
        </Section>
      )}

      {safeResult.suggestedAction && (
        <Section delay={0}>
          <div style={insightBorder(CLR.primary)}>
            <SectionLabel icon={<IconRocket />} color={CLR.primary}>Empfohlene Aktion</SectionLabel>
            <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.65 }}>{safeResult.suggestedAction}</div>
          </div>
        </Section>
      )}

      {/* ═══ UPGRADE + SHARE ═══════════════════════════════════ */}

      <div style={{
        marginTop: 56,
        background: "rgba(0,0,0,0.028)",
        borderTop:    "1px solid rgba(0,0,0,0.07)",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 44px" }}>
          <div style={{
            fontSize: 24, fontWeight: 700, color: T.high,
            letterSpacing: "-0.02em", marginBottom: 8, lineHeight: 1.2,
          }}>
            Willst du tiefer gehen?
          </div>
          <div style={{ fontSize: FS.body, color: T.low, marginBottom: 6, lineHeight: 1.6 }}>
            Entdecke, was wirklich möglich ist.
          </div>
          <div style={{ fontSize: FS.small, color: T.muted, marginBottom: 28 }}>
            Clarity ist ein System für ein selbstbestimmtes Leben.
          </div>
          <button
            onMouseEnter={() => setHoverCta(true)}
            onMouseLeave={() => setHoverCta(false)}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              height: 52, padding: "0 32px",
              background: hoverCta ? "#1a1a1a" : "#111",
              color: "#fff", border: "none",
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: FS.body, fontWeight: 600, borderRadius: 12, cursor: "pointer",
              transition: "background 180ms, transform 140ms",
              transform: hoverCta ? "scale(1.02)" : "scale(1)",
              boxShadow: hoverCta ? "0 8px 28px rgba(0,0,0,0.22)" : "0 4px 20px rgba(0,0,0,0.18)",
              marginBottom: 12,
            }}
          >
            Clarity System starten
          </button>
          <div style={{ fontSize: FS.small, color: T.muted }}>7 Tage kostenlos testen</div>
        </div>

        <div style={{
          maxWidth: 600, margin: "0 auto",
          padding: "0 24px 48px",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{
            fontSize: FS.label, letterSpacing: "0.15em", textTransform: "uppercase",
            color: T.muted, fontWeight: 600,
            paddingTop: 24, marginBottom: 16,
          }}>
            Teilen
          </div>

          {shareConfirm && (
            <div style={{ ...CARD, marginBottom: 12, maxWidth: 320 }}>
              <div style={{ fontSize: FS.small, fontWeight: 600, color: T.high, marginBottom: 2 }}>Bild gespeichert.</div>
              <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.6 }}>Teile dein Clarity Profil mit Freunden.</div>
            </div>
          )}
          {copiedLink && (
            <div style={{ ...CARD, marginBottom: 12, maxWidth: 320 }}>
              <div style={{ fontSize: FS.small, fontWeight: 600, color: T.high, marginBottom: 2 }}>Link kopiert.</div>
              <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.6 }}>Füge den Link ein, um dein Profil zu teilen.</div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 320 }}>
            {BTN(generating ? "Wird erstellt…" : "Profil-Bild runterladen", generateShareImage, hoverImg, setHoverImg, { disabled: generating })}
            {BTN("Profil-Link kopieren", nativeShare, hoverNative, setHoverNative)}
          </div>
        </div>
      </div>

      {/* Hidden export card */}
      {shareWrapperMounted && (
        <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
          <ClarityAvatarCard result={finalResult} wrapperRef={shareWrapperRef} />
        </div>
      )}
    </div>
  );
}

export default ResultSection;
