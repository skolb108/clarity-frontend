import { useState, useEffect, useRef, useCallback } from "react";
import DailyFeed from "./DailyFeed";

/* ─────────────────────────────────────────────────────────────
   DEV PROFILES — keyboard 1/2/3 or ?dev=key
───────────────────────────────────────────────────────────── */

const DEV_PROFILES = {
  explorer_low: {
    summary:         "Du bist aktuell auf der Suche nach Klarheit in verschiedenen Lebensbereichen.",
    pattern:         "Du denkst viel nach, aber handelst selten. Der nächste Schritt fehlt noch.",
    strengths:       ["Offenheit für neue Perspektiven", "Hohe Reflexionsfähigkeit"],
    energySources:   ["Gespräche mit ehrlichen Menschen", "Zeit in der Natur"],
    nextFocus:       "Wähle einen Bereich und setze heute eine kleine Aktion um.",
    suggestedAction: "Schreib drei Dinge auf, die du in den nächsten 30 Tagen ändern willst.",
    confidence:      40,
    scores:          { Clarity: 3, Energy: 4, Strength: 5, Direction: 2, Action: 3 },
    identityModes:   [{ type: "Explorer", confidence: 40 }],
  },
  high_performer: {
    summary:         "Du hast klare Strukturen und setzt Dinge konsequent um.",
    pattern:         "Du bist im Flow — aber Erholung und Tiefe kommen manchmal zu kurz.",
    strengths:       ["Konsequenz", "Klarheit über Ziele", "Hohe Umsetzungskraft"],
    energySources:   ["Ergebnisse sehen", "Fokussierte Arbeitsphasen", "Klare Prioritäten"],
    nextFocus:       "Schutz deine Energie — nicht alles verdient dein Bestes.",
    suggestedAction: "Blockiere einmal pro Woche zwei Stunden für tiefe, ungestörte Arbeit.",
    confidence:      80,
    scores:          { Clarity: 8, Energy: 7, Strength: 8, Direction: 9, Action: 8 },
    identityModes:   [{ type: "Builder", confidence: 80 }],
  },
  chaotic: {
    summary:         "Du bist in vielen Bereichen aktiv, aber ohne klare Richtung.",
    pattern:         "Viel Energie, aber kein Kanal. Du springst von Idee zu Idee ohne Abschluss.",
    strengths:       ["Hohe Kreativität", "Breites Interessenspektrum"],
    energySources:   ["Neue Ideen", "Spontane Projekte"],
    nextFocus:       "Wähle ein Projekt und bring es zu Ende, bevor du das nächste beginnst.",
    suggestedAction: "Schreib alle aktiven Projekte auf. Streich 70% davon.",
    confidence:      30,
    scores:          { Clarity: 2, Energy: 6, Strength: 4, Direction: 1, Action: 3 },
    identityModes:   [{ type: "Explorer", confidence: 30 }],
  },
};

let devProfileFromUrl = null;

if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search);
    devProfileFromUrl = params.get("dev");
  } catch (e) {
    devProfileFromUrl = null;
  }
}

/* ─────────────────────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────────────────────── */

const SCORE_COLORS = {
  Clarity:   "#6366f1",
  Energy:    "#f59e0b",
  Strength:  "#8b5cf6",
  Direction: "#0ea5e9",
  Action:    "#ec4899",
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

const FS = { label: 11, body: 16, small: 14 };

const CARD = {
  background:   "#ffffff",
  border:       "1px solid rgba(0,0,0,0.07)",
  borderRadius: 12,
  padding:      "20px 22px",
  boxShadow:    "0 2px 12px rgba(0,0,0,0.04)",
};

const INPUT_STYLE = {
  boxSizing:  "border-box",
  padding:    "10px 14px",
  borderRadius: 8,
  border:     "1px solid rgba(0,0,0,0.12)",
  background: "rgba(0,0,0,0.025)",
  fontSize:   FS.body,
  color:      T.high,
  outline:    "none",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  width:      "100%",
};

const insightBorder = (color) => ({
  borderLeft:    `3px solid ${color}`,
  paddingLeft:   18,
  paddingTop:    2,
  paddingBottom: 2,
});

const scorePct = (v) => Math.min(Math.round(v * 3), 75);

/* ─────────────────────────────────────────────────────────────
   IDENTITY DESCRIPTORS — one sharp line per archetype
───────────────────────────────────────────────────────────── */

const IDENTITY_DESCRIPTORS = {
  "Builder":            "Du siehst Potenzial, wo andere Chaos sehen. Dein Werkzeug ist Umsetzung.",
  "Explorer":           "Du bist unterwegs — die Richtung noch offen. Aber deine Neugier bleibt.",
  "Creator":            "Du erschaffst, weil du nicht anders kannst. Das ist keine Entscheidung — das bist du.",
  "Stability Seeker":   "Sicherheit ist kein Rückzug für dich. Es ist das Fundament, auf dem du baust.",
  "Transition Phase":   "Du stehst zwischen zwei Versionen von dir. Das ist kein Problem — das ist Wachstum.",
  "Burnout Risk":       "Du gibst viel — vielleicht zu viel. Die Energie, die du trägst, verdient Schutz.",
  "Hidden Opportunity": "Du unterschätzt dich systematisch. Das Potenzial ist da — es wartet auf dich.",
};
const IDENTITY_DESCRIPTOR_DEFAULT = "Du bist an einem Punkt, der Klarheit braucht. Gut, dass du hier bist.";


/* ─────────────────────────────────────────────────────────────
   PROFILES — deterministic, frontend-controlled identity content
   Source: Clarity Profiles.md — do not auto-generate these.
───────────────────────────────────────────────────────────── */

const PROFILES = {
  Explorer: {
    title:        "Explorer",
    hook:         "Du bist nicht verloren. Du sammelst Richtungen — und nennst das Offenheit.",
    description:  "Du interessierst dich für fast alles. Bücher, Ideen, Menschen, Möglichkeiten. Das Problem ist nicht mangelndes Interesse. Es ist das Festlegen. Jede Entscheidung fühlt sich an wie eine Tür, die sich schließt — also bleibst du im Flur.",
    confrontation: "Du weißt genug, um anzufangen. Die Frage ist, ob du Angst vor dem Ende hast.",
  },
  Builder: {
    title:        "Builder",
    hook:         "Du machst. Während andere noch überlegen, hast du schon begonnen.",
    description:  "Du denkst nicht in Ideen — du denkst in Schritten. Du kommst schnell ins Handeln, aber prüfst selten, ob die Richtung stimmt.",
    confrontation: "Du bist gut darin, Dinge fertigzustellen. Schlechter darin, zu fragen, ob sie es wert waren.",
  },
  Creator: {
    title:        "Creator",
    hook:         "Du erschaffst nicht, weil du es willst. Du erschaffst, weil du nicht anders kannst.",
    description:  "Du hast einen inneren Drang zu kreieren, aber schwankst zwischen intensiven Phasen und Rückzug.",
    confrontation: "Du wartest nicht auf die richtige Idee. Du wartest auf den Mut, sie zu zeigen.",
  },
  Optimizer: {
    title:        "Optimizer",
    hook:         "Du siehst sofort, was nicht stimmt. Das ist deine Stärke — und dein Problem.",
    description:  "Du verbesserst konstant alles, aber erreichst selten ein Gefühl von 'genug'.",
    confrontation: "Du optimierst alles — außer die Frage, ob das Ziel noch richtig ist.",
  },
  Drifter: {
    title:        "Drifter",
    hook:         "Du bewegst dich. Aber nicht wirklich vorwärts.",
    description:  "Du bist beschäftigt, aber nicht bewusst gesteuert. Viel Aktivität, wenig Richtung.",
    confrontation: "Du weißt, dass sich etwas ändern müsste. Schon länger, als du zugibst.",
  },
};

const COMPARISON = {
  Explorer:  ["Builder", "Optimizer"],
  Builder:   ["Explorer", "Creator"],
  Creator:   ["Builder", "Optimizer"],
  Optimizer: ["Creator", "Explorer"],
  Drifter:   ["Builder", "Creator"],
};

const DISTRIBUTION = [
  { type: "Explorer",  percentage: 42 },
  { type: "Builder",   percentage: 23 },
  { type: "Creator",   percentage: 18 },
  { type: "Optimizer", percentage: 10 },
  { type: "Drifter",   percentage:  7 },
];

/* ─────────────────────────────────────────────────────────────
   PRIMITIVE SAFETY UTILITIES
───────────────────────────────────────────────────────────── */

function toSafeNum(v, fallback = 0) {
  if (typeof v === "symbol") return fallback;
  if (v !== null && typeof v === "object" && !Object.getPrototypeOf(v)) return fallback;
  try {
    const n = Number(v);
    return isFinite(n) ? n : fallback;
  } catch { return fallback; }
}

function toSafeStr(v, fallback = "") {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "symbol") return fallback;
  if (typeof v === "string") return v || fallback;
  if (typeof v === "object" && !Object.getPrototypeOf(v)) return fallback;
  try { return String(v) || fallback; } catch { return fallback; }
}

function safeEncodeResult(result) {
  try { return btoa(unescape(encodeURIComponent(JSON.stringify(result)))); }
  catch (_) { return ""; }
}

function validateResult(raw) {
  const base = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};

  const rawScores = base.scores && typeof base.scores === "object" ? base.scores : {};
  const scores = {};
  SCORE_ORDER.forEach(k => {
    const v = rawScores[k];
    if (typeof v === "number" && isFinite(v)) scores[k] = v;
  });

  const rawModes    = Array.isArray(base.identityModes) ? base.identityModes : [];
  const identityModes = rawModes
    .filter(m => m && typeof m === "object" && typeof m.type === "string" && m.type.trim())
    .map(m => ({
      type:       String(m.type).trim(),
      confidence: typeof m.confidence === "number" && isFinite(m.confidence) ? m.confidence : 60,
    }));

  return {
    summary:         typeof base.summary         === "string" ? base.summary         : "",
    pattern:         typeof base.pattern         === "string" ? base.pattern         : "",
    strengths:       Array.isArray(base.strengths)     ? base.strengths.filter(s => typeof s === "string")     : [],
    energySources:   Array.isArray(base.energySources) ? base.energySources.filter(s => typeof s === "string") : [],
    nextFocus:       typeof base.nextFocus        === "string" ? base.nextFocus        : "",
    suggestedAction: typeof base.suggestedAction  === "string" ? base.suggestedAction  : "",
    confidence:      typeof base.confidence       === "number" ? base.confidence       : null,
    scores,
    identityModes,
  };
}

/* ─────────────────────────────────────────────────────────────
   ORGANIC BLOB — helpers + CSS
───────────────────────────────────────────────────────────── */

const TYPE_COLORS = {
  Explorer:  ["#6366f1", "#818cf8", "#a5b4fc"],
  Builder:   ["#0ea5e9", "#38bdf8", "#7dd3fc"],
  Creator:   ["#ec4899", "#f472b6", "#f9a8d4"],
  Optimizer: ["#10b981", "#34d399", "#6ee7b7"],
  Drifter:   ["#f59e0b", "#fbbf24", "#fde68a"],
};

function getDominantGradient(dims, type) {
  if (type && TYPE_COLORS[type]) return TYPE_COLORS[type];
  if (!dims || dims.length === 0) return ["#6366f1", "#818cf8", "#a5b4fc"];
  const top = dims.reduce((a, b) => toSafeNum(a.value, 0) >= toSafeNum(b.value, 0) ? a : b);
  const palettes = {
    "#6366f1": ["#6366f1", "#818cf8", "#a5b4fc"],
    "#f59e0b": ["#d97706", "#f59e0b", "#fbbf24"],
    "#8b5cf6": ["#7c3aed", "#8b5cf6", "#a78bfa"],
    "#0ea5e9": ["#0284c7", "#0ea5e9", "#38bdf8"],
    "#ec4899": ["#db2777", "#ec4899", "#f472b6"],
  };
  return palettes[typeof top.color === "string" ? top.color : ""] || ["#6366f1", "#818cf8", "#a5b4fc"];
}

function getBlobShape(dims) {
  if (!dims || dims.length < 5) return "50% 50% 50% 50% / 50% 50% 50% 50%";
  const vals = dims.map(d => toSafeNum(d.value, 50));
  const n = (v) => 30 + (v / 100) * 35;
  const s = `${n(vals[0]).toFixed(0)}% ${(100-n(vals[1])).toFixed(0)}% ${n(vals[2]).toFixed(0)}% ${(100-n(vals[3])).toFixed(0)}% / ${(100-n(vals[1])).toFixed(0)}% ${n(vals[2]).toFixed(0)}% ${(100-n(vals[3])).toFixed(0)}% ${n(vals[4]).toFixed(0)}%`;
  return s.includes("NaN") ? "50% 50% 50% 50% / 50% 50% 50% 50%" : s;
}

function getBlobShapeAlt(dims) {
  if (!dims || dims.length < 5) return "50% 50% 50% 50% / 50% 50% 50% 50%";
  const vals = dims.map(d => toSafeNum(d.value, 50));
  const n = (v) => 30 + (v / 100) * 35;
  const s = `${(100-n(vals[0])).toFixed(0)}% ${n(vals[1]).toFixed(0)}% ${(100-n(vals[2])).toFixed(0)}% ${n(vals[3]).toFixed(0)}% / ${n(vals[2]).toFixed(0)}% ${(100-n(vals[3])).toFixed(0)}% ${n(vals[4]).toFixed(0)}% ${(100-n(vals[0])).toFixed(0)}%`;
  return s.includes("NaN") ? "50% 50% 50% 50% / 50% 50% 50% 50%" : s;
}

const BLOB_KEYFRAMES = `
  @keyframes blobBreath {
    0%   { transform: scale(1);    border-radius: var(--s1); }
    40%  { transform: scale(1.03); border-radius: var(--s2); }
    70%  { transform: scale(1.01); border-radius: var(--s1); }
    100% { transform: scale(1);    border-radius: var(--s1); }
  }
  @keyframes glowA {
    0%, 100% { opacity: 0.55; transform: scale(1); }
    50%       { opacity: 0.75; transform: scale(1.08); }
  }
  @keyframes glowB {
    0%, 100% { opacity: 0.25; transform: scale(1.1); }
    50%       { opacity: 0.40; transform: scale(1); }
  }
`;

let kfInjected = false;
function injectKeyframes() {
  if (kfInjected) return;
  const s = document.createElement("style");
  s.textContent = BLOB_KEYFRAMES;
  document.head.appendChild(s);
  kfInjected = true;
}

/* ─────────────────────────────────────────────────────────────
   ORGANIC BLOB
───────────────────────────────────────────────────────────── */

function OrganicBlob({ dims = [], size = 320, type = "" }) {
  const colors = getDominantGradient(dims, type);
  const s1     = getBlobShape(dims);
  const s2     = getBlobShapeAlt(dims);
  const c0     = typeof colors[0] === "string" ? colors[0] : "#6366f1";
  const c1     = typeof colors[1] === "string" ? colors[1] : "#818cf8";
  const c2     = typeof colors[2] === "string" ? colors[2] : "#a5b4fc";

  useEffect(() => { injectKeyframes(); }, []);

  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: -48, borderRadius: "50%", background: `radial-gradient(circle at 40% 40%, ${c0}60 0%, ${c0}28 40%, transparent 70%)`, filter: "blur(36px)", pointerEvents: "none", animation: "glowA 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: -80, borderRadius: "50%", background: `radial-gradient(circle at 60% 60%, ${c1}44 0%, transparent 65%)`, filter: "blur(56px)", pointerEvents: "none", animation: "glowB 9s ease-in-out infinite" }} />
      <div style={{
        width: size, height: size, borderRadius: s1, position: "relative",
        background:   `linear-gradient(135deg, ${c0} 0%, ${c1} 50%, ${c2} 100%)`,
        boxShadow:    `0 0 0 1px ${c0}22, inset 0 1px 0 ${c0}40, 0 32px 80px ${c0}40, 0 8px 32px ${c0}30`,
        "--s1": s1, "--s2": s2,
        animation:  "blobBreath 8s ease-in-out infinite",
        willChange: "border-radius, transform",
      }}>
        <div style={{ position: "absolute", top: "12%", left: "14%", width: "38%", height: "32%", borderRadius: "50%", background: "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.32) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "12%", width: "42%", height: "36%", borderRadius: "50%", background: `radial-gradient(ellipse, ${c0}50 0%, transparent 70%)`, filter: "blur(12px)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SHAREABLE AVATAR CARD — offscreen, html-to-image target
───────────────────────────────────────────────────────────── */

function ShareableAvatarCard({ wrapperRef, dims = [], type = "", tagline = "" }) {
  const colors    = getDominantGradient(dims, type);
  const shape1    = getBlobShape(dims);
  const glow      = typeof colors[0] === "string" ? colors[0] : "#6366f1";
  const safeType  = toSafeStr(type, "Explorer") || "Explorer";
  const safeTag   = toSafeStr(tagline, "");

  return (
    <div ref={wrapperRef} style={{ width: 400, height: 560, background: "#ffffff", borderRadius: 28, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "40px 36px 36px", position: "relative", overflow: "hidden", fontFamily: "system-ui, sans-serif", boxSizing: "border-box" }}>
      <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: `radial-gradient(circle, ${glow}20 0%, transparent 65%)`, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: "#0f172a", fontWeight: 600 }}>clarity</span>
        <span style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: glow, fontWeight: 600, border: `1px solid ${glow}44`, padding: "4px 14px", borderRadius: 40 }}>Dein Profil</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 54, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1, textAlign: "center" }}>{safeType}</div>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", inset: -40, borderRadius: "50%", background: `radial-gradient(circle, ${glow}50 0%, transparent 68%)`, filter: "blur(28px)" }} />
          <div style={{ width: 240, height: 240, borderRadius: shape1, background: `linear-gradient(135deg, ${typeof colors[0] === "string" ? colors[0] : "#6366f1"} 0%, ${typeof colors[1] === "string" ? colors[1] : "#818cf8"} 50%, ${typeof colors[2] === "string" ? colors[2] : "#a5b4fc"} 100%)`, boxShadow: `0 24px 64px ${glow}44, inset 0 1px 0 ${glow}40`, position: "relative" }}>
            <div style={{ position: "absolute", top: "12%", left: "14%", width: "38%", height: "32%", borderRadius: "50%", background: "radial-gradient(ellipse at 40% 35%, rgba(255,255,255,0.28) 0%, transparent 70%)" }} />
          </div>
        </div>
        <div style={{ fontSize: 14, fontStyle: "italic", color: "#0f172a", textAlign: "center", lineHeight: 1.5, maxWidth: 280, fontWeight: 300 }}>"{safeTag}"</div>
      </div>
      <div style={{ fontSize: 10, letterSpacing: "0.36em", textTransform: "uppercase", color: "#0f172a", position: "relative", zIndex: 1 }}>clarity.ai</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   UI PRIMITIVES
───────────────────────────────────────────────────────────── */

const SectionLabel = ({ children, icon, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: FS.label, letterSpacing: "0.15em", textTransform: "uppercase", color: color || T.muted, fontWeight: 600, marginBottom: 12 }}>
    {icon}{children}
  </div>
);

function ScoreRing({ name, value, animated }) {
  const pct    = animated ? scorePct(value) : 0;
  const color  = SCORE_COLORS[name] || CLR.primary;
  const R = 34, SIZE = 88, CX = SIZE / 2;
  const circ   = 2 * Math.PI * R;
  const offset = circ * (1 - pct / 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: "visible" }}>
        <circle cx={CX} cy={CX} r={R} fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="10" />
        <circle cx={CX} cy={CX} r={R} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform={`rotate(-90 ${CX} ${CX})`}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.0,0.0,0.2,1)" }} />
        <text x={CX} y={CX} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 14, fontWeight: 700, fill: T.high, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          {pct}%
        </text>
      </svg>
      <div style={{ fontSize: FS.label, letterSpacing: "0.09em", textTransform: "uppercase", color: T.low, fontWeight: 500 }}>{name}</div>
    </div>
  );
}

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

function Section({ children, style = {}, delay = 0, onVisible }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const cbRef = useRef(onVisible);
  cbRef.current = onVisible;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const tid = setTimeout(() => { setVisible(true); cbRef.current?.(); }, delay);
        obs.unobserve(el);
        return () => clearTimeout(tid);
      }
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return (
    <div ref={ref} style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px", marginBottom: 36, opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(18px)", transition: "opacity 520ms ease, transform 520ms ease", willChange: "opacity, transform", ...style }}>
      {children}
    </div>
  );
}

const Divider = () => (
  <div style={{ maxWidth: 600, margin: "0 auto 36px", padding: "0 24px" }}>
    <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }} />
  </div>
);

const ActionButton = ({ label, onClick, active = true, green = false }) => (
  <button onClick={onClick} style={{
    height: 44, padding: "0 22px",
    background: green && active ? CLR.green : active ? "#111" : "rgba(0,0,0,0.10)",
    color: "#fff", border: "none",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize: FS.small, fontWeight: 600, borderRadius: 10,
    cursor: active ? "pointer" : "not-allowed",
    transition: "background 200ms",
    boxShadow: active && green ? "0 3px 12px rgba(45,158,116,0.22)" : active ? "0 3px 10px rgba(0,0,0,0.12)" : "none",
  }}>
    {label}
  </button>
);

const IconInsight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconShield = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconLightning = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconCompass = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);
const IconRocket = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

function getScoreInsight(scores) {
  const s = scores || {};
  const action    = s.Action    ?? 0;
  const clarity   = s.Clarity   ?? 0;
  const energy    = s.Energy    ?? 0;
  const direction = s.Direction ?? 0;

  if (action < 4 && clarity >= 5)   return "Du denkst viel nach, aber kommst selten ins Handeln.";
  if (energy >= 6 && direction < 4) return "Du hast viel Energie, aber sie verteilt sich ohne klaren Fokus.";
  if (clarity >= 7 && action >= 7)  return "Du hast Klarheit und setzt konsequent um. Das ist selten.";
  if (direction < 3)                return "Dir fehlt aktuell eine klare Richtung.";
  return "Dein Profil zeigt Entwicklungspotenzial in mehreren Bereichen.";
}


function getAdaptiveInsight(scores, pattern, summary) {
  try {
    const s   = scores || {};
    const pat = typeof pattern === "string" ? pattern : "";
    const sum = typeof summary === "string" ? summary : "";

    const action    = Number(s.Action)    || 0;
    const direction = Number(s.Direction) || 0;
    const clarity   = Number(s.Clarity)   || 0;

    if (action < 4) {
      return pat + " Das zentrale Problem ist, dass du zu selten ins Handeln kommst.";
    }

    if (direction < 4) {
      return pat + " Dir fehlt aktuell eine klare Richtung, was deine Energie streut.";
    }

    if (clarity >= 7 && action >= 7) {
      return "Du hast ein starkes Fundament. " + sum;
    }

    return pat || "";
  } catch (e) {
    return typeof pattern === "string" ? pattern : "";
  }
}

/* ─────────────────────────────────────────────────────────────
   RESULT SCREEN
───────────────────────────────────────────────────────────── */


const TYPE_STRUGGLES = {
  Explorer:  ["Zu viele Optionen, keine Entscheidung", "Starten ohne Abschluss"],
  Builder:   ["Falsche Ziele effizient verfolgen", "Zu wenig Reflexion"],
  Creator:   ["Warten statt zeigen", "Perfektion vor Output"],
  Optimizer: ["Nie zufrieden", "Optimieren statt entscheiden"],
  Drifter:   ["Viel Bewegung, kein Fortschritt", "Reaktiv statt bewusst"],
};

/* ─────────────────────────────────────────────────────────────
   FOMO STRIP — live social proof + same-type struggles
───────────────────────────────────────────────────────────── */

/* ── DAILY LOOP CONSTANTS ─────────────────────────────────── */
const DAILY_PROMPTS = [
  "Was hast du heute vermieden, obwohl du wusstest, dass es wichtig ist?",
  "Was war heute nur Bewegung — aber kein Fortschritt?",
  "Wo hast du heute dich selbst ausgebremst?",
  "Was würdest du morgen anders machen, wenn du ehrlich bist?",
  "Was hat dir heute Energie gegeben — und warum?"
];

const IDENTITY_REINFORCEMENT = {
  Explorer:  "Du suchst noch — aber diesmal gehst du weiter.",
  Builder:   "Du machst — aber diesmal bewusst.",
  Creator:   "Du hast Ideen — diesmal zeigst du sie.",
  Optimizer: "Du verbesserst — diesmal entscheidest du.",
  Drifter:   "Du bewegst dich — diesmal mit Richtung.",
};

/* ─────────────────────────────────────────────────────────────
   DAILY LOOP — reflection → progress → social proof → identity → action
───────────────────────────────────────────────────────────── */
function DailyLoop({ type, nativeShare, copiedLink }) {
  /* ── Date helpers — YYYY-MM-DD strings for reliable comparison ── */
  const toYMD = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayYMD     = toYMD(new Date());
  const yesterdayYMD = toYMD(new Date(Date.now() - 86400000));
  const todayLegacy     = new Date().toDateString();
  const yesterdayLegacy = new Date(Date.now() - 86400000).toDateString();

  /* ── Prompt — one per day, rotates at midnight ──────────── */
  const [prompt] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("clarity_daily_prompt") || "{}");
      if ((stored.date === todayYMD || stored.date === todayLegacy) && stored.text) return stored.text;
      const next = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
      localStorage.setItem("clarity_daily_prompt", JSON.stringify({ date: todayYMD, text: next }));
      return next;
    } catch { return DAILY_PROMPTS[0]; }
  });

  /* ── Commitment — true if user committed today ───────────── */
  const [committed, setCommitted] = useState(() => {
    try {
      const raw = localStorage.getItem("clarity_commitment");
      if (!raw) return false;
      const ts = parseInt(raw, 10);
      if (!isNaN(ts)) return toYMD(ts) === todayYMD;
      const obj = JSON.parse(raw);
      return obj.date === todayYMD || obj.date === todayLegacy;
    } catch { return false; }
  });

  /* ── Streak — persisted across days ─────────────────────── */
  const [streak, setStreak] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("clarity_streak") || "{}");
      const lastAction = localStorage.getItem("clarity_last_action") || "";
      if (lastAction === todayYMD || lastAction === yesterdayYMD) return s.count || 1;
      if (s.date === todayLegacy || s.date === yesterdayLegacy) return s.count || 1;
      return 0;
    } catch { return 0; }
  });

  /* ── Reflected today — "Jetzt reflektieren" clicked ─────── */
  const [reflected, setReflected] = useState(() => {
    try {
      return localStorage.getItem("clarity_reflected_today") === todayYMD;
    } catch { return false; }
  });

  const handleCommit = () => {
    try {
      const lastAction = localStorage.getItem("clarity_last_action") || "";
      const prevStreak = (() => {
        try { return JSON.parse(localStorage.getItem("clarity_streak") || "{}"); } catch { return {}; }
      })();
      const newCount = lastAction === yesterdayYMD
        ? (prevStreak.count || 0) + 1
        : lastAction === todayYMD
          ? (prevStreak.count || 1)
          : 1;
      localStorage.setItem("clarity_commitment", String(Date.now()));
      localStorage.setItem("clarity_last_action", todayYMD);
      localStorage.setItem("clarity_streak", JSON.stringify({ count: newCount }));
      setStreak(newCount);
      setCommitted(true);
    } catch { setCommitted(true); }
  };

  const handleReflect = () => {
    try {
      localStorage.setItem("clarity_reflected_today", todayYMD);
    } catch {}
    setReflected(true);
  };

  /* ── Live social proof ───────────────────────────────────── */
  const [count, setCount] = useState(() => Math.floor(Math.random() * 9) + 6);
  const [same,  setSame]  = useState(() => Math.floor(Math.random() * 3) + 1);
  useEffect(() => {
    const iv = setInterval(() => {
      setCount(c => Math.max(4, Math.min(24, c + (Math.random() > 0.5 ? 1 : -1))));
      setSame(s  => Math.max(1, Math.min(8,  s + (Math.random() > 0.6 ? 1 : -1))));
    }, 4500);
    return () => clearInterval(iv);
  }, []);

  const struggles     = TYPE_STRUGGLES[type] || [];
  const reinforcement = IDENTITY_REINFORCEMENT[type] || "";
  const avatarColors  = ["#6366f1", "#ec4899", "#10b981"];
  const avatarInitials = ["A", "M", "J"];

  /* ── Render ──────────────────────────────────────────────── */
  return (
    <Section delay={0}>
      <div style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 16,
        padding: "24px 22px",
        background: "#fafafa",
      }}>
        {/* ── Headline ── */}
        <SectionLabel color={CLR.primary}>Deine Reflexion heute Abend</SectionLabel>

        {/* 1. Daily prompt */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 8px" }}>
            Frag dich heute Abend:
          </p>
          <p style={{ fontSize: FS.body, color: T.high, lineHeight: 1.65, margin: 0, fontStyle: "italic" }}>
            „{prompt}"
          </p>
        </div>

        {/* 2+3. Commit / confirmation */}
        {committed ? (
          <div style={{ marginBottom: 4 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 20, background: "rgba(45,158,116,0.07)", border: "1px solid rgba(45,158,116,0.18)", fontSize: FS.small, color: CLR.green, fontWeight: 500, marginBottom: 8 }}>
              ✓ Erinnerung gespeichert.
            </div>
            <div style={{ fontSize: FS.small, color: T.muted, marginBottom: 10 }}>
              Du hast dir vorgenommen, heute ehrlich hinzuschauen.
            </div>
            <button
              onClick={reflected ? undefined : handleReflect}
              disabled={reflected}
              style={{
                height: 36, padding: "0 16px",
                background: reflected ? "rgba(45,158,116,0.07)" : "rgba(0,0,0,0.05)",
                color:      reflected ? CLR.green : T.mid,
                border:     reflected ? "1px solid rgba(45,158,116,0.18)" : "1px solid rgba(0,0,0,0.08)",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: FS.small, fontWeight: reflected ? 600 : 500,
                borderRadius: 8,
                cursor: reflected ? "default" : "pointer",
                transition: "all 200ms",
              }}>
              {reflected ? "✓ Reflektiert" : "Jetzt reflektieren"}
            </button>
            {reflected && (
              <p style={{ fontSize: 12, color: T.muted, margin: "8px 0 0", lineHeight: 1.5 }}>
                Du hast heute hingeschaut. Das machen die wenigsten.
              </p>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: 4 }}>
            <ActionButton label="Ich reflektiere das heute Abend" onClick={handleCommit} active />
          </div>
        )}

        {/* ── SECTION A: Personal progress ─────────────────── */}
        {streak > 0 && (
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 20, paddingTop: 16, marginBottom: 0 }}>
            <p style={{ fontSize: 13, color: T.mid, margin: "0 0 3px", fontWeight: 500 }}>
              🔥 {streak} {streak === 1 ? "Tag" : "Tage"} Klarheit in Folge
            </p>
            <p style={{ fontSize: 12, color: T.muted, margin: 0, opacity: 0.75 }}>
              Die meisten hören genau hier auf.
            </p>
          </div>
        )}

        {/* ── SECTION B: Social proof ──────────────────────── */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 20, paddingTop: 16, marginBottom: 20 }}>
          {/* Avatars + share count */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: struggles.length > 0 ? 12 : 8 }}>
            <div style={{ display: "flex" }}>
              {avatarColors.map((c, i) => (
                <div key={i} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid #fafafa", marginLeft: i > 0 ? -6 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                  {avatarInitials[i]}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: T.muted, margin: 0, lineHeight: 1.4 }}>
              <strong style={{ color: T.mid }}>{count} Menschen</strong> teilen das gerade
              {same > 0 && <> · <strong style={{ color: T.mid }}>{same}</strong> mit deinem Typ</>}
            </p>
          </div>

          {/* Struggles */}
          {struggles.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 6px" }}>Viele mit deinem Typ kämpfen damit:</p>
              {struggles.map((s, i) => (
                <p key={i} style={{ fontSize: 13, color: T.low, margin: i === 0 ? "0 0 2px" : "2px 0 0", lineHeight: 1.5 }}>
                  → {s}
                </p>
              ))}
            </div>
          )}

          {/* Social bridge + identity reinforcement */}
          <p style={{ fontSize: FS.small, color: T.muted, margin: "0 0 6px", lineHeight: 1.55 }}>
            Du bist nicht allein damit.
            Aber die meisten bleiben genau hier stehen.
          </p>
          {reinforcement && (
            <p style={{ fontSize: FS.small, color: CLR.primary, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
              {reinforcement}
            </p>
          )}
        </div>

        {/* 7. Share CTA */}
        <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 18 }}>
          <p style={{ fontSize: 12, color: T.muted, margin: "0 0 12px", lineHeight: 1.55 }}>
            Die meisten erkennen sich hier.
            Nur wenige verändern etwas.
          </p>
          <button onClick={nativeShare}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 46, padding: "0 24px", borderRadius: 999, border: "none", background: "linear-gradient(135deg, #4f46e5, #7c3aed, #db2777)", color: "#fff", fontSize: FS.small, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 24px rgba(99,102,241,0.25)", transition: "opacity 150ms" }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
            {copiedLink ? "✓ Link kopiert!" : "Teile Clarity mit jemandem, der dir nahe steht"}
          </button>
        </div>

        {/* Return anchor */}
        <p style={{ fontSize: 11, color: T.muted, marginTop: 16, opacity: 0.5 }}>
          Wenn du morgen wiederkommst, beginnt Veränderung.
        </p>

      </div>
    </Section>
  );
}

const isDev = typeof window !== "undefined" && localStorage.getItem("clarity_dev") === "true";

function downloadICS(habitTime) {
  const now = new Date();
  const eventDate = new Date(now);
  // Try to parse a user-selected time like "Heute Abend" → 19:00, "Heute Nachmittag" → 15:00
  if (habitTime === "Heute Abend")       eventDate.setHours(19, 0, 0, 0);
  else if (habitTime === "Heute Nachmittag") eventDate.setHours(15, 0, 0, 0);
  else {
    // Try "HH:MM" format
    const match = (habitTime || "").match(/^(\d{1,2}):(\d{2})$/);
    if (match) eventDate.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0);
    else       eventDate.setHours(19, 0, 0, 0); // fallback
  }
  const formatDate = (date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    "SUMMARY:Clarity – Reflexion",
    "DESCRIPTION:Was hast du heute vermieden?",
    `DTSTART:${formatDate(eventDate)}`,
    `DTEND:${formatDate(new Date(eventDate.getTime() + 10 * 60000))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "clarity-reflection.ics";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ResultScreen({ result: realResult, isPublicView = false }) {
  const [vis,               setVis]               = useState(false);
  const [barsReady,         setBarsReady]          = useState(false);
  const [generating,        setGenerating]         = useState(false);
  const [shareConfirm,      setShareConfirm]       = useState(false);
  const [copiedLink,        setCopiedLink]         = useState(false);
  const [hoverCta,          setHoverCta]           = useState(false);
  const [selectedHabit,     setSelectedHabit]      = useState("");
  const [selectedNutrition, setSelectedNutrition]  = useState(false);
  const [habitTime,         setHabitTime]          = useState("");
  const [habitStep,         setHabitStep]          = useState(1);
  const [habitDone,         setHabitDone]          = useState(false);
  const [shareWrapperMounted, setShareWrapperMounted] = useState(false);
  const [devProfile,        setDevProfile]         = useState(devProfileFromUrl);
  const [devType,           setDevType]            = useState(null);
  const [isMobile,          setIsMobile]           = useState(typeof window !== "undefined" ? window.innerWidth < 640 : true);

  const shareWrapperRef = useRef(null);

  /* ── dev keyboard shortcuts ─────────────────────────────── */
  useEffect(() => {
    const h = (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) return;
      if (e.key === "1") { setDevProfile("explorer_low");   setDevType("Explorer");  }
      if (e.key === "2") { setDevProfile("high_performer"); setDevType("Builder");   }
      if (e.key === "3") { setDevProfile("chaotic");        setDevType("Creator");   }
      if (e.key === "4") {                                  setDevType("Optimizer"); }
      if (e.key === "5") {                                  setDevType("Drifter");   }
      if (e.key === "0") { setDevProfile(null);             setDevType(null);        }
      // CMD/CTRL + SHIFT + R → hard reset (clear all localStorage + reload)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        localStorage.clear();
        window.location.reload();
      }
      // CMD/CTRL + SHIFT + D → toggle dev mode + reload
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        const next = localStorage.getItem("clarity_dev") === "true" ? "false" : "true";
        localStorage.setItem("clarity_dev", next);
        window.location.reload();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    injectKeyframes();
    window.scrollTo({ top: 0, behavior: "instant" });
    const t1 = setTimeout(() => setVis(true), 80);
    const t2 = setTimeout(() => setShareWrapperMounted(true), 3000);
    return () => [t1, t2].forEach(clearTimeout);
  }, []);

  const handleScoresVisible = useCallback(() => {
    setTimeout(() => setBarsReady(true), 180);
  }, []);

  /* ── derived data ───────────────────────────────────────── */
  const finalResult = devProfile && DEV_PROFILES[devProfile] ? DEV_PROFILES[devProfile] : realResult;
  const safeResult  = validateResult(finalResult);
  const scores      = safeResult.scores;
  const scoreInsight   = getScoreInsight(scores);
let adaptiveInsight = safeResult.pattern || "";

try {
  adaptiveInsight = getAdaptiveInsight(
    scores,
    safeResult.pattern,
    safeResult.summary
  );
} catch (e) {
  adaptiveInsight = safeResult.pattern || "";
}

  // identityType — hardened extraction; devType overrides in dev mode
  const identityType = devType || (() => {
    try {
      const modes = safeResult.identityModes;
      if (!Array.isArray(modes) || modes.length === 0) return "Explorer";
      const raw = modes[0];
      if (!raw) return "Explorer";
      if (typeof raw === "string") return raw.trim() || "Explorer";
      if (typeof raw === "object") {
        const t = raw.type;
        if (typeof t === "string") return t.trim() || "Explorer";
      }
      return "Explorer";
    } catch { return "Explorer"; }
  })();

  // profile — single source of truth (PROFILES only)
  const type    = devType || safeResult.identityModes?.[0]?.type || identityType || "Explorer";
  const profile      = PROFILES[type] || PROFILES["Explorer"];
  const compareTypes = COMPARISON[type] || [];

  // blob dimensions (maps scores → OrganicBlob props)
  const blobDims = SCORE_ORDER.map(k => ({
    name:  k,
    value: toSafeNum(scores[k], 50),
    color: SCORE_COLORS[k] || "#6366f1",
  }));

  const tagline = safeResult.summary || "Du bist aktuell in einer Phase der Entwicklung.";
  const habitLabels = { walk: "Spaziergang", meditate: "Meditation", workout: "Workout" };

  /* ── share handlers ─────────────────────────────────────── */
  const generateShareImage = async () => {
    if (generating) return;
    setGenerating(true);
    if (!shareWrapperMounted) {
      setShareWrapperMounted(true);
      await new Promise(r => setTimeout(r, 80));
    }
    if (!shareWrapperRef.current) { setGenerating(false); return; }
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(shareWrapperRef.current, { cacheBust: true, pixelRatio: 1 });
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
      a.download = `clarity-${identityType.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.href = dataUrl;
      a.click();
      setShareConfirm(true);
      setTimeout(() => setShareConfirm(false), 3500);
    } catch (_) {}
    finally { setGenerating(false); }
  };

  const nativeShare = async () => {
    try {
      const slug     = btoa(JSON.stringify(safeResult));
      const shareUrl = window.location.origin + "/p/" + slug;
      const SHARE_COPY = {
        Explorer:  "Ich dachte, ich bin offen.\nIn Wahrheit vermeide ich Entscheidungen.\n\nDas hat mich ziemlich getroffen.\n\nWas bist du?\n→ ",
        Builder:   "Ich dachte, ich mache alles richtig.\nIn Wahrheit hinterfrage ich meine Richtung nicht.\n\nDas war unangenehm genau.\n\nWas bist du?\n→ ",
        Creator:   "Ich dachte, ich brauche nur die richtige Idee.\nIn Wahrheit fehlt mir der Mut, sie zu zeigen.\n\nDas hat gesessen.\n\nWas bist du?\n→ ",
        Optimizer: "Ich dachte, ich werde immer besser.\nIn Wahrheit komme ich nie an.\n\nDas war zu real.\n\nWas bist du?\n→ ",
        Drifter:   "Ich dachte, ich bin einfach beschäftigt.\nIn Wahrheit entscheide ich nichts.\n\nDas war unangenehm klar.\n\nWas bist du?\n→ ",
      };
      const message =
        (SHARE_COPY[identityType] ||
          "Das hat mich härter getroffen als erwartet.\n\nWas bist du?\n→ ") +
        shareUrl;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (_) {}
  };

  /* ── style helpers ──────────────────────────────────────── */
  const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  const fadeUp = (d = 0) => ({
    opacity:    vis ? 1 : 0,
    transform:  vis ? "none" : "translateY(20px)",
    transition: `opacity 600ms ease ${d}ms, transform 600ms ease ${d}ms`,
  });

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div style={{ fontFamily: FF, opacity: vis ? 1 : 0, transition: "opacity 650ms ease", paddingBottom: 80 }}>

      {/* Dev badge */}
      {devProfile && DEV_PROFILES[devProfile] && (
        <div style={{ position: "fixed", top: 60, right: 12, zIndex: 9999, padding: "6px 14px", borderRadius: 20, background: "rgba(79,140,255,0.92)", color: "#fff", fontSize: FS.label, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", fontFamily: FF, pointerEvents: "none" }}>
          DEV · {devProfile}
        </div>
      )}

      {/* ═══ 1. HERO ══════════════════════════════════════════ */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "56px 24px 0", ...fadeUp(0) }}>

        {/* Identity moment */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>

          {/* Pre-hook */}
          <p style={{ fontSize: 13, letterSpacing: "0.04em", color: "#94a3b8", fontWeight: 500, margin: "0 0 8px", lineHeight: 1.6 }}>
            Das trifft dich wahrscheinlich genauer, als dir gerade lieb ist.
          </p>
          <p style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, margin: "0 0 20px" }}>
            Die meisten erkennen sich hier zum ersten Mal wirklich.
          </p>

          {/* Type label */}
          <p style={{ fontSize: "clamp(16px, 3.5vw, 20px)", fontWeight: 400, color: "#94a3b8", lineHeight: 1, margin: "0 0 6px" }}>
            Du bist ein
          </p>

          {/* Identity word — the hero */}
          <h1 style={{ fontSize: "clamp(64px, 15vw, 104px)", fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 0.92, margin: "0 0 32px" }}>
            <span style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              {identityType}
            </span>
          </h1>

          {/* HOOK — short punchy identity statement */}
          <p style={{ fontSize: "clamp(17px, 2.8vw, 20px)", color: T.high, lineHeight: 1.55, maxWidth: 400, margin: "0 auto 28px", fontWeight: 700, letterSpacing: "-0.01em" }}>
            {profile.hook}
          </p>

          {/* PERSONAL HIT — AI summary with label */}
          {safeResult.summary && (
            <div style={{ maxWidth: 400, margin: "0 auto 8px", textAlign: "left" }}>
              <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", marginBottom: 6 }}>
                Das zeigt sich bei dir konkret:
              </p>
              <p style={{ fontSize: 18, fontWeight: 500, lineHeight: 1.6, margin: 0, color: "#111827" }}>
                {safeResult.summary}
              </p>
            </div>
          )}

          {/* CONFRONTATION — the sentence that hits, boxed */}
          <div style={{ maxWidth: 400, margin: "24px auto 0", padding: "16px 18px", borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb", textAlign: "left" }}>
            <p style={{ fontSize: 12, textTransform: "uppercase", color: "#9ca3af", marginBottom: 6, margin: "0 0 6px" }}>
              Wenn du ehrlich bist:
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#111827", lineHeight: 1.5, margin: 0 }}>
              {profile.confrontation}
            </p>
          </div>

          {/* ═══ COMPARISON HOOK ════════════════════════════ */}
          <div style={{ maxWidth: 400, margin: "40px auto 0", textAlign: "left" }}>
            <p style={{ fontSize: 12, textTransform: "uppercase", color: "#9ca3af", marginBottom: 10 }}>
              Andere bewegen sich anders:
            </p>

            {compareTypes.map((t) => {
              const p = PROFILES[t];
              if (!p) return null;
              return (
                <div key={t} style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid #e5e7eb", marginBottom: 10, background: "#fff" }}>
                  <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, margin: "0 0 4px", color: "#111827" }}>
                    {p.title}
                  </p>
                  <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.5, margin: 0 }}>
                    {p.confrontation}
                  </p>
                </div>
              );
            })}

            <p style={{ marginTop: 16, fontSize: 14, fontWeight: 500, color: "#111827" }}>
              Die Frage ist nicht nur, wer du bist.
              Sondern auch, wer du gerade nicht bist.
            </p>

            {/* ═══ DISTRIBUTION ═══════════════════════════════ */}
            <div style={{ marginTop: 40 }}>
              <p style={{ fontSize: 12, textTransform: "uppercase", color: "#9ca3af", marginBottom: 10 }}>
                So verteilen sich die Typen:
              </p>

              {DISTRIBUTION.map((item) => {
                const isUser = item.type === type;
                return (
                  <div key={item.type} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
                      <span style={{ fontWeight: isUser ? 600 : 400 }}>{item.type}</span>
                      <span style={{ color: "#6b7280" }}>{item.percentage}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 999, background: "#f3f4f6", overflow: "hidden" }}>
                      <div style={{ width: item.percentage + "%", height: "100%", background: isUser ? "#6366f1" : "#d1d5db" }} />
                    </div>
                  </div>
                );
              })}

              <p style={{ marginTop: 16, fontSize: 14, fontWeight: 500, color: "#111827" }}>
                {(() => {
                const userDist = DISTRIBUTION.find(d => d.type === type)?.percentage || 0;
                const label = userDist > 30 ? "häufigsten" : userDist < 15 ? "seltensten" : "mittleren";
                return `Du gehörst zu den ${label} Typen.`;
              })()}
              </p>
            </div>
          </div>

        </div>

        {/* Blob */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, marginBottom: 36 }}>
          <OrganicBlob dims={blobDims} size={300} type={type} />
        </div>

        {/* Hero share buttons — hidden in public view */}
        {!isPublicView && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 64 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              <button
                onClick={generateShareImage} disabled={generating}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 48, padding: "0 24px", borderRadius: 999, border: "none", background: "#0f172a", color: "#fff", fontSize: 14, fontWeight: 600, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.55 : 1, fontFamily: "inherit", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", transition: "background 150ms" }}
                onMouseEnter={e => { if (!generating) e.currentTarget.style.background = "#1e293b"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "#0f172a"; }}>
                {generating ? "Erstelle Bild…" : "Das hat mich überrascht — teilen"}
              </button>
            </div>
            {shareConfirm && (
              <div style={{ fontSize: FS.small, color: CLR.green, fontWeight: 500 }}>✓ Bild gespeichert.</div>
            )}
          </div>
        )}
      </div>

      {/* ═══ 2–6. PERSONAL SECTIONS — hidden in public view ══════ */}
      {!isPublicView && (<>

      <Divider />

      {/* ═══ 4. DIMENSIONS ════════════════════════════════════ */}
      {SCORE_ORDER.some(k => scores[k] != null) && (
        <Section delay={0} onVisible={handleScoresVisible}>
          <SectionLabel>Dein Profil</SectionLabel>
          <div style={{ display: "flex", flexWrap: isMobile ? "wrap" : "nowrap", justifyContent: isMobile ? "flex-start" : "space-between", gap: isMobile ? 20 : 8 }}>
            {SCORE_ORDER.map(k => scores[k] != null ? (
              <div key={k} style={{ flexShrink: 0, width: isMobile ? "calc(50% - 10px)" : "auto", display: "flex", justifyContent: "center" }}>
                <ScoreRing name={k} value={scores[k]} animated={barsReady} />
              </div>
            ) : null)}
          </div>
          <p style={{
  fontSize: 14,
  color: "#64748b",
  marginTop: 16,
  textAlign: "center",
  maxWidth: 420,
  marginLeft: "auto",
  marginRight: "auto"
}}>
  Dein Profil zeigt: Klarheit entsteht durch Bewegung, nicht nur Denken.
</p>
          <p style={{ fontSize: 14, color: T.high, fontWeight: 500, marginTop: 12, textAlign: "center", maxWidth: 420, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
            {scoreInsight}
          </p>
        </Section>
      )}

      <Divider />

      {/* ═══ 5. ACTION / HABIT SYSTEM ═════════════════════════ */}
      <Section delay={0}>
        <div style={{ ...CARD, borderLeft: `3px solid ${CLR.green}`, borderRadius: "0 12px 12px 0" }}>
          <SectionLabel color={CLR.green}>Dein Fortschrittspotenzial</SectionLabel>
          <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.7, marginBottom: 12 }}>
            Dein größter Hebel liegt in der Transformation deiner täglichen Gewohnheiten.
          </div>
          <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 14 }}>
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
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, marginBottom: 12, padding: "8px 16px", borderRadius: 20, background: "rgba(45,158,116,0.09)", border: "1px solid rgba(45,158,116,0.22)", fontSize: FS.small, color: CLR.green, fontWeight: 600 }}>
                ✓ Geplant für heute.
              </div>
              <div style={{ fontSize: FS.body, color: T.low, lineHeight: 1.6, marginBottom: 4 }}>
                {habitLabels[selectedHabit]}{selectedNutrition ? " + Salat" : ""} · {habitTime}
              </div>
              <div style={{ fontSize: FS.small, color: T.muted, lineHeight: 1.6 }}>
                Füge dir eine Erinnerung in deinen Kalender ein.
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
                  <div key={item.id} onClick={() => { if (habitStep === 1) setSelectedHabit(item.id); }}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10, cursor: habitStep === 1 ? "pointer" : "default", padding: "11px 13px", borderRadius: 10, background: sel ? "rgba(79,140,255,0.07)" : "rgba(0,0,0,0.02)", border: `1px solid ${sel ? "rgba(79,140,255,0.26)" : "rgba(0,0,0,0.07)"}`, transition: "background 140ms, border 140ms" }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginTop: 1, border: `2px solid ${sel ? CLR.primary : "rgba(0,0,0,0.20)"}`, background: sel ? CLR.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 140ms, border 140ms" }}>
                      {sel && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: FS.body, color: sel ? T.high : T.mid, lineHeight: 1.5, fontWeight: sel ? 600 : 400 }}>{item.primary}</div>
                      {item.secondary && <div style={{ fontSize: FS.small, color: T.low, lineHeight: 1.5, marginTop: 2 }}>{item.secondary}</div>}
                    </div>
                  </div>
                );
              })}

              {selectedHabit && habitStep === 1 && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 14, marginTop: 4, marginBottom: 18 }}>
                  <div style={{ fontSize: FS.label, color: T.muted, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>Nutrition (optional)</div>
                  <div onClick={() => setSelectedNutrition(v => !v)}
                    style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer", padding: "11px 13px", borderRadius: 10, background: selectedNutrition ? "rgba(45,158,116,0.06)" : "rgba(0,0,0,0.02)", border: `1px solid ${selectedNutrition ? "rgba(45,158,116,0.22)" : "rgba(0,0,0,0.07)"}`, transition: "background 140ms, border 140ms" }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1, border: `2px solid ${selectedNutrition ? CLR.green : "rgba(0,0,0,0.20)"}`, background: selectedNutrition ? CLR.green : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 140ms, border 140ms" }}>
                      {selectedNutrition && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <div style={{ fontSize: FS.body, color: selectedNutrition ? T.high : T.mid, lineHeight: 1.5, fontWeight: selectedNutrition ? 500 : 400 }}>
                      Frischer Salat mit viel Protein <span style={{ color: T.low }}>(z.B. Huhn, Rinderhack oder Rind)</span>
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
                  <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.6, marginBottom: 12, fontWeight: 500 }}>Wann möchtest du das machen?</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                    {["Heute Nachmittag", "Heute Abend"].map(opt => (
                      <div key={opt} onClick={() => { if (habitStep === 2) setHabitTime(opt); }}
                        style={{ display: "inline-flex", alignItems: "center", cursor: habitStep === 2 ? "pointer" : "default", padding: "8px 16px", borderRadius: 20, background: habitTime === opt ? "rgba(79,140,255,0.09)" : "rgba(0,0,0,0.03)", border: `1px solid ${habitTime === opt ? "rgba(79,140,255,0.28)" : "rgba(0,0,0,0.08)"}`, fontSize: FS.small, color: habitTime === opt ? CLR.primary : T.mid, fontWeight: habitTime === opt ? 600 : 400, transition: "all 140ms" }}>
                        {opt}
                      </div>
                    ))}
                  </div>
                  {habitStep === 2 && (
                    <input type="text" placeholder="Oder eigene Uhrzeit eingeben…"
                      value={["Heute Nachmittag", "Heute Abend"].includes(habitTime) ? "" : habitTime}
                      onChange={e => setHabitTime(e.target.value)}
                      onFocus={() => { if (["Heute Nachmittag", "Heute Abend"].includes(habitTime)) setHabitTime(""); }}
                      style={{ ...INPUT_STYLE, marginBottom: 14 }} />
                  )}
                  {habitStep === 2 && habitTime && <ActionButton label="Weiter" onClick={() => setHabitStep(3)} active />}
                </div>
              )}

              {habitStep >= 3 && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: 18, marginTop: 18 }}>
                  <div style={{ fontSize: FS.small, color: CLR.primary, fontWeight: 500, marginBottom: 14 }}>
                    ✓ {habitLabels[selectedHabit]}{selectedNutrition ? " + Salat" : ""} · {habitTime}
                  </div>
                  <div style={{ fontSize: FS.body, color: T.mid, lineHeight: 1.6, marginBottom: 14 }}>Füge dir eine Erinnerung in deinen Kalender ein.</div>
                  <ActionButton label="Erinnerung im Kalender speichern" green onClick={() => { downloadICS(habitTime); setHabitDone(true); }} active />
                </div>
              )}
            </div>
          )}
        </div>
      </Section>

      </>)}

      {!isPublicView && <DailyLoop type={type} nativeShare={nativeShare} copiedLink={copiedLink} />}

      {!isPublicView && <DailyFeed type={type} />}

      {/* ═══ 7. SHARE / CTA ════════════════════════════════════ */}
      <div style={{ marginTop: 40, background: "rgba(0,0,0,0.025)", borderTop: "1px solid rgba(0,0,0,0.07)" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px 56px", textAlign: "center" }}>

          {isPublicView ? (
            /* ── PUBLIC CTA ── */
            <>
              <h2 style={{ fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 12px" }}>
                Du denkst, du weißt, wer du bist.
              </h2>
              <p style={{ color: "#64748b", fontSize: 15, lineHeight: 1.6, maxWidth: 340, margin: "0 auto 28px" }}>
                Die meisten erkennen sich hier zum ersten Mal wirklich.
              </p>
              <button
                onClick={() => window.location.href = "/"}
                onMouseEnter={() => setHoverCta(true)} onMouseLeave={() => setHoverCta(false)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 52, padding: "0 32px", background: hoverCta ? "#1a1a1a" : "#111", color: "#fff", border: "none", fontFamily: FF, fontSize: FS.body, fontWeight: 600, borderRadius: 12, cursor: "pointer", transition: "background 180ms, transform 140ms, box-shadow 140ms", transform: hoverCta ? "scale(1.02)" : "scale(1)", boxShadow: hoverCta ? "0 8px 28px rgba(0,0,0,0.22)" : "0 4px 20px rgba(0,0,0,0.18)" }}>
                Finde deinen Typ
              </button>
            </>
          ) : (
            /* ── PRIVATE CTA — upgrade nudge only (share lives in DailyLoop) ── */
            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 48 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: T.high, letterSpacing: "-0.02em", marginBottom: 8 }}>Willst du tiefer gehen?</div>
              <div style={{ fontSize: FS.small, color: T.muted, marginBottom: 24 }}>Clarity ist ein System für ein selbstbestimmtes Leben.</div>
              <button
                onClick={() => window.location.href = "/waitlist"}
                onMouseEnter={() => setHoverCta(true)} onMouseLeave={() => setHoverCta(false)}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 48, padding: "0 28px", background: hoverCta ? "#1a1a1a" : "#111", color: "#fff", border: "none", fontFamily: FF, fontSize: FS.body, fontWeight: 600, borderRadius: 12, cursor: "pointer", transition: "background 180ms, transform 140ms, box-shadow 140ms", transform: hoverCta ? "scale(1.02)" : "scale(1)", boxShadow: hoverCta ? "0 8px 28px rgba(0,0,0,0.22)" : "0 4px 20px rgba(0,0,0,0.18)", marginBottom: 10 }}>
                Clarity System starten
              </button>
              <div style={{ fontSize: FS.small, color: T.muted }}>Früher Zugang zum Clarity System</div>
            </div>
          )}
        </div>
      </div>

      {/* Dev type indicator */}
      {devType && (
        <div style={{ position: "fixed", bottom: 10, right: 10, fontSize: 12, opacity: 0.5, fontFamily: "monospace", pointerEvents: "none" }}>
          Dev: {identityType}
        </div>
      )}

      {/* DEV MODE badge */}
      {isDev && (
        <div style={{ position: "fixed", top: 10, right: 10, zIndex: 9999, padding: "4px 10px", borderRadius: 6, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", fontFamily: "monospace", pointerEvents: "none" }}>
          DEV MODE
        </div>
      )}

      {/* DEV MODE — Reset Progress button */}
      {isDev && (
        <div style={{ position: "fixed", bottom: 36, right: 10, zIndex: 9999 }}>
          <button
            onClick={() => {
              ["clarity_streak", "clarity_commitment", "clarity_daily_prompt", "clarity_last_action", "clarity_reflected_today"].forEach(k => localStorage.removeItem(k));
              window.location.reload();
            }}
            style={{ padding: "5px 12px", background: "#1e293b", color: "#94a3b8", border: "none", borderRadius: 6, fontSize: 11, fontFamily: "monospace", cursor: "pointer", fontWeight: 600 }}>
            Reset Progress
          </button>
        </div>
      )}

      {/* Offscreen export card */}
      {shareWrapperMounted && (
        <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }} aria-hidden="true">
          <ShareableAvatarCard wrapperRef={shareWrapperRef} dims={blobDims} type={identityType} tagline={tagline} />
        </div>
      )}
    </div>
  );
}

export default ResultScreen;
