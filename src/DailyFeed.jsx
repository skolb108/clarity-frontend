import { useState } from "react";

/* ─────────────────────────────────────────────────────────────
   DAILY FEED — personalized insight cards, one set per day.
   Stored in localStorage as:
     clarity_feed → [{ date, type, content }]
───────────────────────────────────────────────────────────── */

// ── Design tokens (match ResultScreen) ────────────────────────
const T = {
  high:  "rgba(0,0,0,0.82)",
  mid:   "rgba(0,0,0,0.60)",
  low:   "rgba(0,0,0,0.40)",
  muted: "rgba(0,0,0,0.28)",
};
const FS = { body: 16, small: 14 };

// ── Card type metadata ─────────────────────────────────────────
const CARD_META = {
  insight:   { label: "Erkenntnis",    color: "#6366f1", emoji: "💡" },
  pattern:   { label: "Muster",        color: "#ec4899", emoji: "🔁" },
  challenge: { label: "Micro-Aufgabe", color: "#10b981", emoji: "⚡" },
  reflection:{ label: "Reflexion",     color: "#f59e0b", emoji: "🪞" },
};

// ── Type-specific feed content ─────────────────────────────────
const FEED_CONTENT = {
  Explorer: [
    { type: "insight",    content: "Du wartest nicht auf die richtige Idee. Du vermeidest die Entscheidung, welche es ist." },
    { type: "pattern",    content: "Du sammelst Optionen — und nennst das Offenheit. In Wahrheit blockierst du dich selbst." },
    { type: "challenge",  content: "Heute: Wähle eine Sache und arbeite 30 Minuten daran. Kein Wechsel erlaubt." },
    { type: "reflection", content: "Was hast du in den letzten 7 Tagen begonnen — und dann liegen gelassen?" },
    { type: "insight",    content: "Offenheit ist eine Stärke. Solange sie keine Ausrede wird, um nichts zu beenden." },
  ],
  Builder: [
    { type: "insight",    content: "Du bist gut darin, Dinge zu bauen. Die Frage ist, ob es die richtigen Dinge sind." },
    { type: "pattern",    content: "Du steckst Energie in Umsetzung — aber selten in Reflexion. Das kostet dich Richtung." },
    { type: "challenge",  content: "Heute: Bevor du etwas anfängst, frag dich: Warum ist das die wichtigste Sache gerade?" },
    { type: "reflection", content: "Was hast du in letzter Zeit umgesetzt — und bereust du, wie du die Zeit genutzt hast?" },
    { type: "insight",    content: "Geschwindigkeit ist eine Stärke. Aber Schnelligkeit in die falsche Richtung ist Verlust." },
  ],
  Creator: [
    { type: "insight",    content: "Du wartest nicht auf Inspiration. Du wartest auf den Mut, das Aktuelle zu zeigen." },
    { type: "pattern",    content: "Du arbeitest intensiv — dann ziehst du dich zurück. Dieses Muster kostet dich Sichtbarkeit." },
    { type: "challenge",  content: "Heute: Zeig einer Person etwas, das du noch nicht bereit bist zu zeigen." },
    { type: "reflection", content: "Was hast du erschaffen, das du noch keinem gezeigt hast — und warum nicht?" },
    { type: "insight",    content: "Perfektion schützt dich. Aber sie verhindert auch, dass du weißt, ob es gut ist." },
  ],
  Optimizer: [
    { type: "insight",    content: "Du verbesserst Prozesse — aber hinterfragst selten, ob das Ziel noch das richtige ist." },
    { type: "pattern",    content: "Dein Standard rückt nach oben, kurz bevor du ihn erreichst. Das ist kein Zufall." },
    { type: "challenge",  content: "Heute: Entscheide etwas, ohne es vorher zu analysieren. Fühle in die Entscheidung rein." },
    { type: "reflection", content: "Wann hast du zuletzt etwas gut genug gefunden — ohne es danach zu überarbeiten?" },
    { type: "insight",    content: "Nie zufrieden zu sein ist kein Qualitätsmerkmal. Es ist ein Muster, das dich erschöpft." },
  ],
  Drifter: [
    { type: "insight",    content: "Du bist aktiv. Aber nicht gesteuert. Das ist der Unterschied zwischen Bewegung und Richtung." },
    { type: "pattern",    content: "Du reagierst auf das, was gerade passiert — statt zu wählen, was passieren soll." },
    { type: "challenge",  content: "Heute: Entscheide eine Sache bewusst — nicht weil sie anfällt, sondern weil du sie willst." },
    { type: "reflection", content: "Was hast du diese Woche getan, das du wirklich gewählt hast — und nicht einfach gemacht?" },
    { type: "insight",    content: "Aus Reaktion wird Gewohnheit. Aus Gewohnheit wird Identität. Irgendwann merkst du es nicht mehr." },
  ],
};

// Generic fallback when type is unknown
const FEED_GENERIC = [
  { type: "insight",    content: "Klarheit entsteht nicht durch mehr Nachdenken. Sie entsteht durch ehrliche Fragen." },
  { type: "pattern",    content: "Die meisten Menschen kennen die Antwort bereits. Sie vermeiden nur die Konsequenz." },
  { type: "challenge",  content: "Heute: Tu eine Sache, die du immer wieder verschiebst. Nur diese eine." },
  { type: "reflection", content: "Was weißt du gerade, das du noch nicht zugegeben hast?" },
  { type: "insight",    content: "Veränderung beginnt nicht mit einem großen Schritt. Sie beginnt damit, ehrlich hinzuschauen." },
];

// ── Deterministic day picker — same items all day ──────────────
function toYMD(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function pickDailyItems(type) {
  const pool   = FEED_CONTENT[type] || FEED_GENERIC;
  const today  = toYMD(new Date());
  // Use date as seed for deterministic but varying selection
  const seed   = today.replace(/-/g, "").slice(-4);
  const i1     = parseInt(seed.slice(0, 2), 10) % pool.length;
  const i2     = (parseInt(seed.slice(2, 4), 10) + 1) % pool.length;
  const items  = i1 === i2
    ? [pool[i1]]
    : [pool[i1], pool[i2]];
  return items.map(item => ({ ...item, date: today }));
}

function loadFeed(type) {
  const today = toYMD(new Date());
  try {
    const stored = JSON.parse(localStorage.getItem("clarity_feed") || "[]");
    if (Array.isArray(stored) && stored.length > 0 && stored[0].date === today) {
      return stored;
    }
  } catch {}
  // Generate fresh items for today
  const fresh = pickDailyItems(type);
  try { localStorage.setItem("clarity_feed", JSON.stringify(fresh)); } catch {}
  return fresh;
}

// ── Sub-components ─────────────────────────────────────────────
function FeedCard({ item }) {
  const meta = CARD_META[item.type] || CARD_META.insight;

  return (
    <div style={{
      background:    "#ffffff",
      borderRadius:  12,
      padding:       "16px 18px",
      border:        "1px solid rgba(0,0,0,0.07)",
      boxShadow:     "0 2px 12px rgba(0,0,0,0.04)",
      marginBottom:  10,
    }}>
      {/* Card type label */}
      <div style={{
        display:        "flex",
        alignItems:     "center",
        gap:            6,
        marginBottom:   10,
      }}>
        <span style={{ fontSize: 14 }}>{meta.emoji}</span>
        <span style={{
          fontSize:       11,
          fontWeight:     700,
          letterSpacing:  "0.1em",
          textTransform:  "uppercase",
          color:          meta.color,
        }}>
          {meta.label}
        </span>
      </div>

      {/* Card content */}
      <p style={{
        fontSize:    FS.body,
        color:       T.high,
        lineHeight:  1.65,
        margin:      0,
        fontWeight:  item.type === "insight" ? 500 : 400,
        fontStyle:   item.type === "reflection" ? "italic" : "normal",
      }}>
        {item.type === "reflection" ? `„${item.content}"` : item.content}
      </p>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function DailyFeed({ type }) {
  const [items] = useState(() => loadFeed(type));

  return (
    <div style={{
      maxWidth:  600,
      margin:    "0 auto",
      padding:   "0 24px 24px",
    }}>
      {/* Section header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          fontSize:       11,
          fontWeight:     700,
          letterSpacing:  "0.15em",
          textTransform:  "uppercase",
          color:          T.muted,
          marginBottom:   4,
        }}>
          Dein Daily Feed
        </div>
        <p style={{
          fontSize:    FS.small,
          color:       T.mid,
          margin:      0,
          lineHeight:  1.5,
        }}>
          Das ist der Teil, der dich verändert.
        </p>
      </div>

      {/* Cards or empty state */}
      {items.length > 0 ? (
        items.map((item, i) => <FeedCard key={i} item={item} />)
      ) : (
        <div style={{
          padding:      "20px 18px",
          borderRadius: 12,
          background:   "#f9fafb",
          border:       "1px solid rgba(0,0,0,0.06)",
          fontSize:     FS.small,
          color:        T.muted,
          fontStyle:    "italic",
        }}>
          Dein Feed entsteht, wenn du zurückkommst.
        </div>
      )}
    </div>
  );
}
