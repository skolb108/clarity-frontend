import { useState, useEffect } from "react";
import ResultPrimary   from "./screens/ResultPrimary";
import ResultSecondary from "./screens/ResultSecondary";

/* ─────────────────────────────────────────────────────────────
   DEV PROFILES — cycle with keys 1–5 in result screen
───────────────────────────────────────────────────────────── */
const DEV_TYPES = ["Explorer", "Builder", "Creator", "Optimizer", "Drifter"];

const DEV_RESULT = {
  summary:         "Dev-Modus aktiv.",
  pattern:         "Du testest gerade den Result Screen.",
  strengths:       ["Schnelles Testen", "Entwicklerinstinkt", "Feedback-Loops"],
  energySources:   ["Kaffee", "Direktes Feedback", "Klarer Code"],
  nextFocus:       "Den Result Screen fertig bauen.",
  suggestedAction: "Scroll durch alle fünf Profile.",
  scores:          { Clarity: 72, Energy: 65, Strength: 80, Direction: 58, Action: 70 },
};

/* ─────────────────────────────────────────────────────────────
   PROFILES — deterministic, frontend-controlled identity content
───────────────────────────────────────────────────────────── */
const PROFILES = {
  Explorer: {
    hook:          "Du weißt längst, was du tun solltest — aber triffst die Entscheidung nicht.",
    description:   "Du sammelst Möglichkeiten, statt eine zu wählen. Jede Entscheidung fühlt sich wie eine Tür an, die sich schließt.",
    confrontation: "Offenheit ist deine Stärke — solange sie keine Ausrede wird, um nichts zu beenden.",
    fomo:          "In einem Jahr bist du vielleicht noch genau hier.",
    action:        "Triff heute eine kleine Entscheidung — ohne sie zu überdenken.",
    identityShift: "Ich treffe Entscheidungen, auch wenn sie sich unsicher anfühlen.",
  },
  Builder: {
    hook:          "Du kommst voran — aber nicht unbedingt in die richtige Richtung.",
    description:   "Du denkst in Schritten, nicht in Zielen. Du baust schnell — aber hinterfragst selten wohin.",
    confrontation: "Du bist gut darin, Dinge fertigzustellen. Schlechter darin, zu fragen, ob sie es wert waren.",
    fomo:          "Irgendwann merkst du, dass du etwas gebaut hast, das du nicht willst.",
    action:        "Stelle dir heute: Warum mache ich das überhaupt?",
    identityShift: "Ich hinterfrage die Richtung, bevor ich schneller werde.",
  },
  Creator: {
    hook:          "Du erschaffst nicht, weil du es willst — du kannst nicht anders.",
    description:   "Du hast einen inneren Drang zu kreieren, aber schwankst zwischen Intensität und Rückzug.",
    confrontation: "Du wartest nicht auf die richtige Idee. Du wartest auf den Mut, sie zu zeigen.",
    fomo:          "Die Idee, die du nicht zeigst, verändert nichts.",
    action:        "Zeige heute etwas, das sich noch nicht fertig anfühlt.",
    identityShift: "Ich zeige, was ich erschaffe — auch wenn es sich unfertig anfühlt.",
  },
  Optimizer: {
    hook:          "Du siehst sofort, was nicht stimmt. Das ist deine Stärke — und dein Problem.",
    description:   "Du verbesserst konstant alles, aber erreichst selten ein Gefühl von 'genug'.",
    confrontation: "Du optimierst alles — außer die Frage, ob das Ziel noch richtig ist.",
    fomo:          "Du kommst nie an — wenn 'fertig' das Ziel bleibt.",
    action:        "Definiere heute, wann gut gut genug ist.",
    identityShift: "Ich entscheide das Ziel, bevor ich es optimiere.",
  },
  Drifter: {
    hook:          "Du bewegst dich. Aber nicht wirklich vorwärts.",
    description:   "Du bist beschäftigt — mit Dingen, die sich wichtig anfühlen, aber nichts hinterlassen.",
    confrontation: "Du weißt, dass sich etwas ändern müsste. Schon länger, als du zugibst.",
    fomo:          "Irgendwann wird aus Drift Gewohnheit. Und aus Gewohnheit Identität.",
    action:        "Wähle heute eine Richtung und halte sie für 7 Tage.",
    identityShift: "Ich wähle eine Richtung und bewege mich bewusst.",
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

  const safeResult   = validateResult(result);
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
      {devType && (
        <div style={{
          position:      "fixed", bottom: 16, left: "50%",
          transform:     "translateX(-50%)",
          zIndex:         999,
          background:    "rgba(15,23,42,0.85)",
          color:          "#fff",
          padding:        "6px 16px",
          borderRadius:   20,
          fontSize:       12,
          fontFamily:     "'Helvetica Neue', Helvetica, Arial, sans-serif",
          pointerEvents: "none",
          letterSpacing: "0.04em",
        }}>
          DEV · {devType} · Taste 1–5 wechseln
        </div>
      )}
      <ResultPrimary
      type={type}
      profile={profile}
      safeResult={safeResult}
      onShare={handleShare}
      onGoDeep={() => setView("secondary")}
      copiedLink={copiedLink}
    />
    </>
  );
}
