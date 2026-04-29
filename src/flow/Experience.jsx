import { useState, useEffect, useRef, lazy, Suspense } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import Entry         from "../screens/Entry";
import MicroIntro    from "../screens/MicroIntro";
import Question      from "../screens/Question";
import Loading           from "../screens/Loading";
import GlobalBackground  from "../components/GlobalBackground";
import { track }         from "../track.js";

const ResultScreen = lazy(() => import("../ResultScreen"));

/* ─────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────── */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://clarity-backend-production-108.up.railway.app";

const OPENING_QUESTION = "Was beschäftigt dich gerade am meisten?";

const QUESTION_FLOW = [
  "entry",
  "entry",

  "structure",
  "structure",
  "structure",

  "tension",
  "tension",
  "tension",
  "tension",

  "decision",
  "decision"
];

const TOTAL_QUESTIONS = 1 + QUESTION_FLOW.length;

/* ─────────────────────────────────────────────────────────────
   MICRO-REACTIONS
   
   Three tiers — all neutral, none interpretive:
   Tier 1 — standard acknowledgment
   Tier 2 — slightly warmer, still no interpretation
   Tier 3 — emotional, used max 1× in the full flow
   
   Schedule: reactions only at specific questionIndex values
   (0-indexed, = the index WHEN the user submits their answer).
   Feels human because it's unpredictable.
   
   Q1  (idx 0) → no
   Q2  (idx 1) → no      ← spec: Q2 keine Reaction
   Q3  (idx 2) → yes ✓   ← spec: Q3 Reaction
   Q4  (idx 3) → no
   Q5  (idx 4) → yes ✓   ← spec: Q5 Reaction
   Q6  (idx 5) → no
   Q7  (idx 6) → no      ← spec: Q7 (Deep) keine
   Q8  (idx 7) → no
   Q9  (idx 8) → yes ✓   ← spec: Q9 Reaction
   Q10 (idx 9) → no
   Q11 (idx 10)→ no      ← last, triggers analysis
───────────────────────────────────────────────────────────── */

// Q3=truth(2), Q4=avoidance(3), Q9=decision(8)
const REACTION_SCHEDULE = new Set([2, 3, 8]);

const TIER1 = [
  "Okay.",
  "Verstanden.",
  "Ich sehe.",
  "Notiert.",
  "Alles klar.",
];

const TIER2 = [
  "Ich verstehe.",
  "Ich höre dich.",
  "Das ergibt Sinn.",
  "Okay, ich bin bei dir.",
];

// Used max 1× — at Q9 (index 8), which is the "block" question
// and tends to surface heavier answers
const TIER3 = [
  "Das klingt nicht leicht.",
  "Ich verstehe, was du meinst.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickReaction(questionIndex, tier3Used) {
  if (!REACTION_SCHEDULE.has(questionIndex)) return null;

  // Q9 decision (index 8): use tier 3 if not yet used, otherwise tier 2
  if (questionIndex === 8) {
    const pool = tier3Used ? TIER2 : TIER3;
    return { text: pickRandom(pool), isTier3: !tier3Used };
  }

  // Q3 + Q5: mix tier 1 and tier 2 (50/50)
  const pool = Math.random() < 0.5 ? TIER1 : TIER2;
  return { text: pickRandom(pool), isTier3: false };
}

// Reaction stays visible long enough to read comfortably.
// ~90ms per character, minimum 1500ms.
const reactionDuration = (text) => Math.max(1500, text.length * 90);

/* ─────────────────────────────────────────────────────────────
   INTENT PROMPT
───────────────────────────────────────────────────────────── */

// Per-intent guidance — escalating psychological depth
const INTENT_GUIDANCE = {
  entry: `
- konkret
- leicht zugänglich
- keine Konfrontation
`,

  structure: `
- Muster erkennen
- erste Spannung
- Verhalten greifbar machen
`,

  tension: `
- Widerspruch aufdecken
- leicht unangenehm
- konfrontierend
- geht unter die Oberfläche
`,

  decision: `
- Klarheit erzwingen
- Richtung
- konkrete Entscheidung oder Handlung
`,
};

const buildIntentPrompt = (intent) =>
  `INTENT: ${intent}

DU BEFINDEST DICH IN DIESER PHASE DES GESPRÄCHS.

Du MUSST dich strikt an die Bedeutung dieses Intents halten.

Wenn deine Frage nicht zu dieser Phase passt:
→ neu schreiben, bis sie passt.

BEDEUTUNG:
${INTENT_GUIDANCE[intent] || ""}

━━━━━━━━━━━━━━━━━━━━━━━
REGELN
━━━━━━━━━━━━━━━━━━━━━━━

REFLECTION:
- 1 Satz
- max 18–20 Wörter
- darf leicht interpretieren (nur basierend auf Antwort)
- verbindet mindestens 2 Elemente
- zeigt Spannung oder Muster
- kein Coaching, kein Lob

FRAGE:
- genau 1 Frage
- max 15 Wörter
- muss direkt aus der Reflection entstehen
- muss konkret sein (kein abstraktes Gelaber)
- darf leicht konfrontierend sein

Wenn die Antwort vage, kurz oder ausweichend ist:
- stelle eine KONKRETERE Frage
- bringe den User zurück in eine echte Situation
- vermeide abstrakte Fragen

Beispiel:
Statt: "Warum ist das so?"
→ "Wann hast du das zuletzt konkret gemerkt?"

━━━━━━━━━━━━━━━━━━━━━━━
KRITISCH
━━━━━━━━━━━━━━━━━━━━━━━

Die Intensität MUSS sich steigern:

entry → ruhig  
structure → klar  
tension → unangenehm  
decision → eindeutig  

Wenn intent = tension:

- die Frage MUSS eine Spannung öffnen
- sie darf leicht unangenehm sein
- sie darf direkt sein

Wenn sie sich neutral oder sicher anfühlt:
→ falsch formuliert, neu formulieren, bis sie unangenehm oder spannungsvoll ist.

Wenn es sinnvoll ist:

Beziehe dich konkret auf etwas, das der User vorher gesagt hat.

Nicht allgemein:
"du hast vorhin gesagt..."

Sondern konkret:
"Du hast gesagt, dass du unsicher bist — wann merkst du das besonders?"

━━━━━━━━━━━━━━━━━━━━━━━
VERBOTEN
━━━━━━━━━━━━━━━━━━━━━━━

- generische Fragen
- abstrakte Fragen
- "Was denkst du?" / "Warum ist das wichtig?"
- Wiederholen ohne Bedeutung

━━━━━━━━━━━━━━━━━━━━━━━
BEISPIELE (Referenz)
━━━━━━━━━━━━━━━━━━━━━━━

"Was möchtest du gerade nicht aussprechen?"
"Wovor schützt dich das gerade?"
"Was weißt du längst, tust es aber nicht?"

━━━━━━━━━━━━━━━━━━━━━━━

Antworte NUR mit JSON:

{
  "reflection": "...",
  "question": "..."
}`;

/* ─────────────────────────────────────────────────────────────
   PROMPTS
───────────────────────────────────────────────────────────── */

const ANALYSIS_SYSTEM_PROMPT = `Du analysierst die Antworten aus einem Reflexionsgespräch.
Du erhältst ein "answers"-Array mit 12 Antworten auf tiefe Reflexionsfragen.

SCHRITT 1: TYP-ERKENNUNG

Lies alle Antworten und erkenne das dominante Verhaltensmuster.
Ordne den User exakt EINEM dieser 5 Typen zu:

EXPLORER
Sammelt Optionen statt zu entscheiden. Nennt viele Möglichkeiten. Spricht über
"vielleicht", "könnte", "wenn". Entscheidungen fühlen sich wie Verlust an.
Schlüsselwörter: Optionen, noch nicht sicher, abwarten, erst wenn.

BUILDER
Handelt viel, hinterfragt das Wohin selten. Fokus auf Fortschritt, Umsetzung,
Effizienz — selten auf Sinn. Schlüsselwörter: vorankommen, umsetzen, optimieren.

CREATOR
Starker innerer Drang zu erschaffen, aber Angst vor Sichtbarkeit oder Bewertung.
Ideen vorhanden, Umsetzung blockiert. Schlüsselwörter: Ideen, zeigen, noch nicht bereit.

OPTIMIZER
Sieht sofort was nicht stimmt. Hohe Standards, schwer zufrieden. Ankommen unmöglich.
Schlüsselwörter: besser werden, nicht gut genug, immer noch, Standards.

DRIFTER
Bewegt sich ohne Richtung. Reagiert auf Impulse. Wenig klare Entscheidungen.
Schlüsselwörter: mal schauen, irgendwie, passiert halt, keine Ahnung.

Confidence: 40–65 = unsicher, 66–80 = klar, 81–95 = eindeutig.

SCHRITT 2: INSIGHT GENERIEREN

"pattern": Benennt ein KONKRETES, WIEDERHOLENDES Muster aus den echten Antworten.
Beginnt mit "Du hast mehrfach..." oder "In deinen Antworten taucht auf..."
Verwendet echte Inhalte — keine Generalaussagen. Max 20 Wörter.

"summary": Konfrontiert — beschreibt nicht.
Formel: "Du [konkretes Verhalten] — nicht weil [falsche Erklärung], sondern weil [Wahrheit]."
Darf sich unangenehm anfühlen. Soll sich wahr anfühlen. Max 18 Wörter.

"suggestedAction": Eine konkrete Handlung für HEUTE.
Kein Coaching-Sprech. Formulierung: "Tu X — nicht Y." Max 12 Wörter.

"strengths", "energySources": Nur aus den echten Antworten ableiten — nicht erfinden.

Antworte NUR mit validem JSON. Kein Text davor oder danach. Kein Markdown.

{
  "scores": {
    "Clarity":   <integer 1–100>,
    "Energy":    <integer 1–100>,
    "Strength":  <integer 1–100>,
    "Direction": <integer 1–100>,
    "Action":    <integer 1–100>
  },
  "identityModes": [
    { "type": "<Explorer|Builder|Creator|Optimizer|Drifter>", "confidence": <integer 40–95> }
  ],
  "summary":         "<1 Satz, max 18 Wörter, Konfrontations-Formel>",
  "pattern":         "<1 Satz, max 20 Wörter, beginnt mit 'Du hast mehrfach...' oder 'In deinen Antworten...'>",
  "strengths":       ["<konkret aus Antworten>", "<konkret>", "<konkret>"],
  "energySources":   ["<konkret aus Antworten>", "<konkret>", "<konkret>"],
  "nextFocus":       "<1 Satz — wichtigster Fokus nächste 30 Tage>",
  "suggestedAction": "<1 konkreter Schritt heute, max 12 Wörter>"
}`;

const SIGNAL_EXTRACTION_PROMPT = `Du liest die Antworten eines Reflexionsgesprächs und 
extrahierst die wichtigsten Signale für eine spätere Analyse.
Antworte NUR mit validem JSON. Kein Markdown.

{
  "repeated_themes":   ["<Thema das 2+ mal auftaucht>"],
  "avoided_topics":    ["<Was umgangen, relativiert oder schnell verlassen wurde>"],
  "energy_language":   ["<Wörter mit spürbarer Energie oder Abwehr>"],
  "core_tension":      "<Das zentrale Spannungsfeld — was zieht in zwei Richtungen, 1 Satz>",
  "avoidance_pattern": "<Was konkret vermieden wird und wodurch — 1 Satz>",
  "behavioral_type_signals": {
    "Explorer": <0–10>, "Builder": <0–10>, "Creator": <0–10>,
    "Optimizer": <0–10>, "Drifter": <0–10>
  }
}`;

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */

const formatAnswersAsContext = (answers) =>
  JSON.stringify({ answers }, null, 2);

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function parseQuestionResponse(raw) {
  try {
    const clean = raw.replace(/```json|```/g, "").trim();
    const start = clean.indexOf("{");
    const end   = clean.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("no json");
    const parsed = JSON.parse(clean.slice(start, end + 1));

    let reflection = typeof parsed.reflection === "string" ? parsed.reflection.trim() : "";
    let question   = typeof parsed.question   === "string" ? parsed.question.trim()   : raw;

    // Guard: if AI packed reflection into question (no separate reflection field),
    // try to split on last "?" — everything before last sentence ending in "?" is the question,
    // leading declarative sentence(s) become the reflection.
    if (!reflection && question) {
      const lastQ = question.lastIndexOf("?");
      if (lastQ > 0) {
        // Find the sentence boundary before the last question
        const before = question.slice(0, lastQ);
        const sentEnd = Math.max(before.lastIndexOf(". "), before.lastIndexOf("! "), before.lastIndexOf(".\n"));
        if (sentEnd > 20) {
          // Split: declarative part → reflection, question part → question
          reflection = question.slice(0, sentEnd + 1).trim();
          question   = question.slice(sentEnd + 1).trim();
        }
      }
    }

    // Guard: reflection must not be a question itself
    if (reflection.trim().endsWith("?")) {
      question   = reflection + " " + question;
      reflection = "";
    }

    return { reflection, question: question || raw };
  } catch {
    return { reflection: "", question: raw };
  }
}

/* ─────────────────────────────────────────────────────────────
   EXPERIENCE
───────────────────────────────────────────────────────────── */

export default function Experience() {
  // First visit check — computed once via ref, never re-runs on re-render
  const firstVisitRef = useRef(
    typeof localStorage !== "undefined"
      && !localStorage.getItem("clarity_visited")
  );
  const [step, setStep] = useState(firstVisitRef.current ? "micro" : "entry");
  const trackedStartRef = useRef(false);

  useEffect(() => {
    // Mark as visited only after successful first render
    if (firstVisitRef.current) {
      localStorage.setItem("clarity_visited", "1");
    }
    // Track flow start once per session
    if (!trackedStartRef.current) {
      trackedStartRef.current = true;
      track("flow_start");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [questionIndex,     setQuestionIndex]     = useState(0);
  const [currentQuestion,   setCurrentQuestion]   = useState(OPENING_QUESTION);
  const [currentReflection, setCurrentReflection] = useState("");
  const [currentReaction,   setCurrentReaction]   = useState(null); // {text, isTier3} | null
  const [isReacting,        setIsReacting]        = useState(false);
  const [previousAnswer,    setPreviousAnswer]    = useState("");
  const [isTyping,          setIsTyping]          = useState(false);
  const [messages,          setMessages]          = useState([]);
  const [answers,           setAnswers]           = useState([]);
  const [result,            setResult]            = useState(null);

  // Track tier-3 usage — max 1× in the full flow
  const tier3UsedRef = useRef(false);

  // DEV SHORTCUT: Cmd+Shift+D (or Ctrl+Shift+D) → jump to result screen
  useEffect(() => {
    const handler = (e) => {
      // Cmd+Shift+D or Ctrl+Shift+D — avoids browser conflicts
      const isShortcut = (e.metaKey || e.ctrlKey) && e.shiftKey
        && (e.key === "d" || e.key === "D");
      if (isShortcut) {
        e.preventDefault();
        setResult({
          summary: "Dev-Modus aktiv.",
          pattern: "Du testest gerade den Result Screen.",
          strengths: ["Schnelles Testen", "Entwicklerinstinkt"],
          energySources: ["Kaffee", "Feedback-Loops"],
          nextFocus: "Den Result Screen fertig bauen.",
          suggestedAction: "Scroll durch alle fünf Profile.",
          scores: { Clarity: 72, Energy: 65, Strength: 80, Direction: 58, Action: 70 },
          identityModes: [{ type: "Explorer", confidence: 75 }],
        });
        setStep("result");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapperKey = step === "question"
    ? `question-${questionIndex}`
    : step;

  /* ─── API ─────────────────────────────────────────────── */
const sendMessage = async (msgs) => {
  const res = await fetch(`${API_URL}/api/chat`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: msgs }),
  });
  const data = await res.json();
  return data.content || data.reply || data.message || "";
};

  /* ─── Analysis ───────────────────────────────────────── */

  const runAnalysis = async (finalAnswers) => {
    setStep("loading");
    try {
      const contextBlock = formatAnswersAsContext(finalAnswers);

      let signalsBlock = null;
      try {
        const _res1 = await fetch(`${API_URL}/api/analyze`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [
            { role: "system", content: SIGNAL_EXTRACTION_PROMPT },
            { role: "user",   content: `Hier sind die Antworten:\n\n${contextBlock}` },
          ]}),
        });
        if (!_res1.ok) throw new Error(`HTTP ${_res1.status}`);
        const raw = await _res1.json();
        signalsBlock = JSON.stringify(raw, null, 2);
      } catch (e) {
        console.warn("Signal extraction failed:", e.message);
      }

      const userContent = signalsBlock
        ? `ANTWORTEN:\n\n${contextBlock}\n\nEXTRAHIERTE SIGNALE:\n\n${signalsBlock}`
        : `Hier sind die Antworten:\n\n${contextBlock}`;

      const _res2 = await fetch(`${API_URL}/api/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [
          { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
          { role: "user",   content: userContent },
        ]}),
      });
      if (!_res2.ok) throw new Error(`HTTP ${_res2.status}`);
      const parsed = await _res2.json();

      await delay(2000);
      setResult(parsed);
      track("flow_complete");
      setStep("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Analysis error:", err);
    }
  };

  /* ─── Answer handler ─────────────────────────────────── */

  const handleAnswer = async (text) => {
    // Reset scroll position before each screen transition
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    } catch (_) {}

    const newAnswers = [
      ...answers,
      {
        intent: questionIndex === 0 ? "initial" : QUESTION_FLOW[questionIndex - 1],
        answer: text,
      },
    ];
    const newMessages = [
      ...messages,
      { role: "assistant", content: currentQuestion },
      { role: "user",      content: text },
    ];

    setMessages(newMessages);
    setAnswers(newAnswers);
    setPreviousAnswer(text);

    const nextIndex = questionIndex + 1;

    // Track answered question
    track(`question_${questionIndex + 1}`);

    // Last question → straight to analysis, no reaction
    if (nextIndex > QUESTION_FLOW.length) {
      await runAnalysis(newAnswers);
      return;
    }

    // ── Micro-reaction ──────────────────────────────────
    const reaction = pickReaction(questionIndex, tier3UsedRef.current);
    if (reaction) {
      if (reaction.isTier3) tier3UsedRef.current = true;
      setCurrentReaction(reaction);
      setIsReacting(true);
      await delay(reactionDuration(reaction.text));
      setIsReacting(false);
      setCurrentReaction(null);
    }

    // ── Fetch next AI question + reflection ─────────────
    setIsTyping(true);
    setQuestionIndex(nextIndex);
    setCurrentReflection("");

    const intentPrompt = buildIntentPrompt(QUESTION_FLOW[nextIndex - 1]);

    try {
      const raw = await sendMessage([
        ...newMessages,
        { role: "system", content: intentPrompt },
      ]);
      const { reflection, question } = parseQuestionResponse(raw);
      setCurrentReflection(reflection);
      setCurrentQuestion(question || QUESTION_FLOW[nextIndex - 1]);
    } catch (e) {
      console.error("Failed to get next question:", e);
      setCurrentReflection("");
      setCurrentQuestion(QUESTION_FLOW[nextIndex - 1]);
    } finally {
      setIsTyping(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <>
      <GlobalBackground />

      {/* MicroIntro is a fixed overlay — must sit OUTSIDE ScreenWrapper
          to avoid conflict with ScreenWrapper's own transition system */}
      {step === "micro" && (
        <MicroIntro onDone={() => setStep("entry")} />
      )}

    <ScreenWrapper key={wrapperKey}>

      {step === "entry" && (
        <Entry onNext={() => setStep("question")} />
      )}

      {step === "question" && (
        <Question
          question={currentQuestion}
          reflection={currentReflection}
          reaction={currentReaction}
          isReacting={isReacting}
          previousAnswer={previousAnswer}
          isTyping={isTyping}
          questionNumber={questionIndex + 1}
          totalQuestions={TOTAL_QUESTIONS}
          onNext={handleAnswer}
        />
      )}

      {step === "loading" && <Loading />}

      {step === "result" && result && (
        <Suspense fallback={<Loading />}>
          <ResultScreen result={result} />
        </Suspense>
      )}

    </ScreenWrapper>
    </>
  );
}
