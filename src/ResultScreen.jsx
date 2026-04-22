import { useState, useEffect } from "react";
import ResultPrimary   from "./screens/ResultPrimary";
import ResultSecondary from "./screens/ResultSecondary";

/* ─────────────────────────────────────────────────────────────
   DEV PROFILES — cycle with keys 1–5 in result screen
───────────────────────────────────────────────────────────── */
const DEV_TYPES = ["Explorer", "Builder", "Creator", "Optimizer", "Drifter"];

const DEV_RESULTS = {
  Explorer: {
    summary:         "Du sammelst Optionen — nicht weil du offen bist, sondern weil Entscheiden sich wie Verlieren anfühlt.",
    pattern:         "Du hast mehrfach erwähnt, dass du noch auf den richtigen Moment wartest.",
    strengths:       ["Offenheit", "Reflexionsfähigkeit", "Breite Perspektive"],
    energySources:   ["Neue Möglichkeiten", "Gespräche mit anderen", "Lesen und Lernen"],
    nextFocus:       "Eine Entscheidung treffen und 7 Tage dranbleiben.",
    suggestedAction: "Triff heute eine kleine Entscheidung — ohne sie zu überdenken.",
    scores:          { Clarity: 48, Energy: 72, Strength: 65, Direction: 38, Action: 44 },
    identityModes:   [{ type: "Explorer", confidence: 82 }],
  },
  Builder: {
    summary:         "Du baust schnell — nicht weil du weißt wohin, sondern weil Stillstand sich falsch anfühlt.",
    pattern:         "In deinen Antworten taucht auf, dass Erfolg sich leer anfühlt sobald er da ist.",
    strengths:       ["Umsetzungsstärke", "Disziplin", "Systemdenken"],
    energySources:   ["Sichtbarer Fortschritt", "Klare Ziele", "Effizienz"],
    nextFocus:       "Das Warum hinter deinem Tun klären — bevor du das nächste Projekt startest.",
    suggestedAction: "Stelle dir heute die Frage: Warum mache ich das eigentlich?",
    scores:          { Clarity: 55, Energy: 88, Strength: 80, Direction: 36, Action: 91 },
    identityModes:   [{ type: "Builder", confidence: 79 }],
  },
  Creator: {
    summary:         "Du wartest nicht auf die richtige Idee — du wartest auf den Mut, sie zu zeigen.",
    pattern:         "Du hast mehrfach erwähnt, dass deine Ideen noch nicht fertig genug sind.",
    strengths:       ["Kreativität", "Tiefe", "Originalität"],
    energySources:   ["Kreative Prozesse", "Stille", "Inspiration durch andere"],
    nextFocus:       "Etwas zeigen, bevor es sich fertig anfühlt.",
    suggestedAction: "Teile heute etwas — auch wenn es sich unfertig anfühlt.",
    scores:          { Clarity: 68, Energy: 76, Strength: 84, Direction: 62, Action: 41 },
    identityModes:   [{ type: "Creator", confidence: 85 }],
  },
  Optimizer: {
    summary:         "Du verbesserst dich ständig — nicht weil du gut werden willst, sondern weil Ankommen sich leer anfühlt.",
    pattern:         "Du hast mehrfach erwähnt, dass es immer noch etwas gibt, das nicht stimmt.",
    strengths:       ["Präzision", "Hohe Standards", "Problemerkennung"],
    energySources:   ["Messbare Verbesserung", "Feedback", "Klare Strukturen"],
    nextFocus:       "Einen Bereich wählen, der gut genug ist — und ihn loslassen.",
    suggestedAction: "Schreibe heute drei Dinge auf, die gut gelaufen sind — ohne Einschränkung.",
    scores:          { Clarity: 74, Energy: 62, Strength: 91, Direction: 70, Action: 66 },
    identityModes:   [{ type: "Optimizer", confidence: 88 }],
  },
  Drifter: {
    summary:         "Du lässt Dinge passieren — nicht weil du gelassen bist, sondern weil Entscheiden Verantwortung bedeutet.",
    pattern:         "In deinen Antworten taucht auf, dass du selten bewusst entscheidest.",
    strengths:       ["Anpassungsfähigkeit", "Offenheit", "Geduld"],
    energySources:   ["Impulse von außen", "Abwechslung", "Gespräche"],
    nextFocus:       "Eine klare Entscheidung treffen und eine Woche dabei bleiben.",
    suggestedAction: "Entscheide heute eine Sache bewusst — und halte daran fest.",
    scores:          { Clarity: 32, Energy: 48, Strength: 40, Direction: 28, Action: 31 },
    identityModes:   [{ type: "Drifter", confidence: 76 }],
  },
};

/* ─────────────────────────────────────────────────────────────
   PROFILES — deterministic, frontend-controlled identity content
───────────────────────────────────────────────────────────── */
const PROFILES = {
  Explorer: {
    hook:          "Du weißt, was du tun solltest — aber du entscheidest dich nicht.",
    description:   "Du hältst dir Optionen offen — und hältst dich damit selbst zurück.",
    confrontation: "Du nennst es Freiheit. In Wahrheit vermeidest du das Festlegen.",
    fomo:          "Wenn du dich nicht entscheidest, bleibt alles möglich — und nichts passiert.",
    action:        "Triff heute eine kleine Entscheidung — und bleib dabei.",
    identityShift: "Ich entscheide mich — auch wenn es sich unsicher anfühlt.",
  },
  Builder: {
    hook:          "Du kommst voran — aber weichst der eigentlichen Entscheidung aus.",
    description:   "Du arbeitest viel — aber stellst selten infrage, ob es überhaupt das Richtige ist.",
    confrontation: "Du bist produktiv. Aber nicht unbedingt ehrlich zu dir selbst.",
    fomo:          "Du kannst lange etwas bauen, das du eigentlich gar nicht willst.",
    action:        "Frag dich heute: Würde ich das auch anfangen, wenn ich ehrlich bin?",
    identityShift: "Ich entscheide die Richtung — bevor ich weitermache.",
  },
  Creator: {
    hook:          "Du hast etwas in dir — aber hältst es zurück.",
    description:   "Du wartest auf den richtigen Moment, statt einfach zu zeigen, was da ist.",
    confrontation: "Du brauchst keine bessere Idee. Du brauchst mehr Mut, sie zu zeigen.",
    fomo:          "Was du nicht zeigst, existiert für niemanden.",
    action:        "Zeig heute etwas, das sich noch nicht fertig anfühlt.",
    identityShift: "Ich zeige, was in mir ist — auch wenn es nicht perfekt ist.",
  },
  Optimizer: {
    hook:          "Du verbesserst alles — außer die Richtung.",
    description:   "Du feilst an Details, statt zu prüfen, ob das Ganze überhaupt Sinn macht.",
    confrontation: "Du verwechselst Fortschritt mit Feinschliff.",
    fomo:          "Du kannst ewig optimieren — und trotzdem falsch liegen.",
    action:        "Entscheide heute, was wirklich zählt — und ignoriere den Rest.",
    identityShift: "Ich wähle das Wesentliche — und lasse den Rest los.",
  },
  Drifter: {
    hook:          "Du bist beschäftigt — aber gehst dem Wesentlichen aus dem Weg.",
    description:   "Du machst Dinge, die sich nach Bewegung anfühlen — aber nichts verändern.",
    confrontation: "Du weißt längst, dass es so nicht weitergeht.",
    fomo:          "Wenn du so weitermachst, wird genau das dein Alltag bleiben.",
    action:        "Wähle heute eine Richtung — und bleib für 7 Tage dabei.",
    identityShift: "Ich entscheide mich — und gehe.",
  },
};

/* ─────────────────────────────────────────────────────────────
   SAFETY UTILITIES
───────────────────────────────────────────────────────────── */
const SCORE_ORDER = ["Clarity", "Energy", "Strength", "Direction", "Action"];

function toSafeNum(v, fallback = 0) {
  try { const n = Number(v); return isFinite(n) ? n : fallback; } catch { return fallback; }
}

function validateResult(raw) {
  const base = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const rawScores = base.scores && typeof base.scores === "object" ? base.scores : {};
  const scores = {};
  SCORE_ORDER.forEach(k => {
    const v = rawScores[k];
    if (typeof v === "number" && isFinite(v)) scores[k] = v;
  });
  const rawModes = Array.isArray(base.identityModes) ? base.identityModes : [];
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
    scores,
    identityModes,
  };
}

/* ─────────────────────────────────────────────────────────────
   SHARE COPY — per identity type
───────────────────────────────────────────────────────────── */
const SHARE_COPY = {
  Explorer:  "Ich dachte, ich bin offen.\nIn Wahrheit vermeide ich Entscheidungen.\n\nDas hat mich getroffen.\n\nWas bist du?\n→ ",
  Builder:   "Ich dachte, ich mache alles richtig.\nIn Wahrheit hinterfrage ich die Richtung nicht.\n\nDas war unangenehm genau.\n\nWas bist du?\n→ ",
  Creator:   "Ich dachte, ich brauche nur die richtige Idee.\nIn Wahrheit fehlt mir der Mut, sie zu zeigen.\n\nDas hat gesessen.\n\nWas bist du?\n→ ",
  Optimizer: "Ich dachte, ich werde immer besser.\nIn Wahrheit komme ich nie an.\n\nDas war zu real.\n\nWas bist du?\n→ ",
  Drifter:   "Ich dachte, ich bin einfach beschäftigt.\nIn Wahrheit entscheide ich nichts.\n\nDas war unangenehm klar.\n\nWas bist du?\n→ ",
};

/* ─────────────────────────────────────────────────────────────
   RESULT SCREEN — Controller
   Manages primary/secondary navigation.
   Keeps PublicProfile.jsx interface intact (accepts result prop).
───────────────────────────────────────────────────────────── */
export default function ResultScreen({ result }) {
  const [view,       setView]       = useState("primary");
  const [copiedLink, setCopiedLink] = useState(false);
  const [devType,    setDevType]    = useState(null); // keys 1-5 override identity type
  const [logoTaps,   setLogoTaps]   = useState(0);   // mobile dev trigger: 5 taps on logo
  const [showDevPicker, setShowDevPicker] = useState(false);

  // Mobile dev trigger: tap logo 5× within 2s
  const handleLogoTap = () => {
    const next = logoTaps + 1;
    setLogoTaps(next);
    if (next >= 5) {
      setLogoTaps(0);
      setShowDevPicker(true);
    }
    // Reset counter after 2s of inactivity
    clearTimeout(window.__clarityDevTapTimer);
    window.__clarityDevTapTimer = setTimeout(() => setLogoTaps(0), 2000);
  };

  // DEV: press 1–5 to cycle through the five profiles
  useEffect(() => {
    const handler = (e) => {
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= 5) {
        setDevType(DEV_TYPES[idx - 1]);
        setView("primary");
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const safeResult = devType
  ? validateResult(DEV_RESULTS[devType])
  : validateResult(result);
  const identityType = (() => {
    try {
      const modes = safeResult.identityModes;
      if (!Array.isArray(modes) || modes.length === 0) return "Explorer";
      const raw = modes[0];
      if (typeof raw === "string") return raw.trim() || "Explorer";
      if (typeof raw === "object") return String(raw.type || "").trim() || "Explorer";
      return "Explorer";
    } catch { return "Explorer"; }
  })();

  const type    = devType || identityType;
  const profile = PROFILES[type] || PROFILES["Explorer"];

  /* ── Share: copy public profile link to clipboard ── */
  const handleShare = async () => {
    try {
      const slug     = btoa(unescape(encodeURIComponent(JSON.stringify(result))));
      const shareUrl = window.location.origin + "/p/" + slug;
      const message  = (SHARE_COPY[type] || "Das hat mich getroffen.\n\nWas bist du?\n→ ") + shareUrl;

      if (navigator.share) {
        try {
          await navigator.share({ title: "Mein Clarity Profil", text: message, url: shareUrl });
          return;
        } catch (_) {}
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (_) {}
  };

  if (view === "secondary") {
    return (
      <ResultSecondary
        safeResult={safeResult}
        type={type}
        profile={profile}
        onBack={() => setView("primary")}
      />
    );
  }

  return (
    <>

      {showDevPicker && (
        <div style={{
          position:   "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.50)",
          display:    "flex", alignItems: "flex-end", justifyContent: "center",
          padding:    "0 0 0",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }} onClick={() => setShowDevPicker(false)}>
          <div style={{
            background: "#fff", borderRadius: "16px 16px 0 0",
            width: "100%", maxWidth: 480, padding: "20px 24px 40px",
            boxSizing: "border-box",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(0,0,0,0.12)", margin: "0 auto 18px" }} />
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.10em", color: "rgba(0,0,0,0.35)", margin: "0 0 14px", textTransform: "uppercase" }}>
              Dev — Profil wählen
            </p>
            {DEV_TYPES.map((t, i) => (
              <button key={t} onClick={() => { setDevType(t); setView("primary"); setShowDevPicker(false); window.scrollTo({ top: 0, behavior: "instant" }); }} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "13px 0",
                background: "none", border: "none", borderBottom: i < 4 ? "1px solid rgba(0,0,0,0.07)" : "none",
                cursor: "pointer", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}>
                <span style={{ fontSize: 15, fontWeight: devType === t ? 700 : 400, color: "#0f172a" }}>{t}</span>
                <span style={{ fontSize: 12, color: "rgba(0,0,0,0.28)" }}>{i + 1}</span>
              </button>
            ))}
            {/* Reset localStorage */}
            <button onClick={() => {
              localStorage.clear();
              setShowDevPicker(false);
              alert("localStorage geleert. Seite neu laden für MicroIntro.");
            }} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "13px 0", marginTop: 4,
              background: "none", border: "none", borderTop: "1px solid rgba(0,0,0,0.07)",
              cursor: "pointer", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            }}>
              <span style={{ fontSize: 14, color: "rgba(200,50,50,0.80)" }}>localStorage leeren</span>
              <span style={{ fontSize: 12, color: "rgba(0,0,0,0.28)" }}>↺</span>
            </button>
          </div>
        </div>
      )}
      <ResultPrimary
      type={type}
      profile={profile}
      safeResult={safeResult}
      onShare={handleShare}
      onGoDeep={() => setView("secondary")}
      onLogoTap={handleLogoTap}
      copiedLink={copiedLink}
    />
    </>
  );
}
