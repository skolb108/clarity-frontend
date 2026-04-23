import { useState, useEffect } from "react";
import ResultPrimary   from "./screens/ResultPrimary";
import ResultSecondary from "./screens/ResultSecondary";

/* ─────────────────────────────────────────────────────────────
   DEV PROFILES — keyboard shortcuts 1–5, dev builds only
───────────────────────────────────────────────────────────── */
const IS_DEV = import.meta.env.DEV;

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
   PROFILES — deterministic frontend content
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
    strengths:       Array.isArray(base.strengths)     ? base.strengths.filter(s => typeof s === "string") : [],
    energySources:   Array.isArray(base.energySources) ? base.energySources.filter(s => typeof s === "string") : [],
    nextFocus:       typeof base.nextFocus        === "string" ? base.nextFocus        : "",
    suggestedAction: typeof base.suggestedAction  === "string" ? base.suggestedAction  : "",
    scores,
    identityModes,
  };
}



export default function ResultScreen({ result }) {
  const [view,       setView]       = useState("primary");
  // Dev type override — only active in development builds
  const [devType, setDevType] = useState(null);

  // DEV ONLY: keyboard shortcuts 1–5 to cycle profiles
  useEffect(() => {
    if (!IS_DEV) return;
    const handler = (e) => {
      const idx = parseInt(e.key, 10);
      if (idx >= 1 && idx <= 5) {
        setDevType(DEV_TYPES[idx - 1]);
        setView("primary");
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      // Cmd+Shift+D → jump to result with Explorer profile
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        setDevType("Explorer");
        setView("primary");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const safeResult   = IS_DEV && devType
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

  const type    = (IS_DEV && devType) ? devType : identityType;
  const profile = PROFILES[type] || PROFILES["Explorer"];

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
    <ResultPrimary
      type={type}
      profile={profile}
      safeResult={safeResult}
      onGoDeep={() => setView("secondary")}
    />
  );
}
