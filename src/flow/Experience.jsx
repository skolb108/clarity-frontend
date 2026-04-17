import { useState, useEffect, useRef, lazy, Suspense } from "react";
import ScreenWrapper from "../components/ScreenWrapper";
import Entry         from "../screens/Entry";
import MicroIntro    from "../screens/MicroIntro";
import Question      from "../screens/Question";
import Loading       from "../screens/Loading";

const ResultScreen = lazy(() => import("../ResultScreen"));

/* ─────────────────────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────────────────────── */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://clarity-backend-production-108.up.railway.app";

const OPENING_QUESTION = "Was beschäftigt dich gerade am meisten?";

const QUESTION_INTENTS = [
  "problem",        // Q1
  "concrete",       // Q2
  "change",         // Q3
  "energy",         // Q4
  "drain",          // Q5
  "strength",       // Q6
  "external_value", // Q7
  "future",         // Q8
  "block",          // Q9
  "meaning",        // Q10
  "next_step",      // Q11
];

const TOTAL_QUESTIONS = 1 + QUESTION_INTENTS.length; // 12

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

const REACTION_SCHEDULE = new Set([2, 4, 8]);

const TIER1 = [
  "Okay.",
  "Verstanden.",
  "Ich sehe.",
  "Notiert.",
  "Alles klar.",
];

const TIER2 = [
  "Ich verstehe.",
  "Das nehme ich mit.",
  "Ich höre dich.",
  "Das ergibt Sinn.",
  "Okay, ich bin bei dir.",
];

// Used max 1× — at Q9 (index 8), which is the "block" question
// and tends to surface heavier answers
const TIER3 = [
  "Das klingt nicht leicht.",
  "Ich verstehe, was du meinst.",
  "Das geht tiefer.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickReaction(questionIndex, tier3Used) {
  if (!REACTION_SCHEDULE.has(questionIndex)) return null;

  // Q9 (index 8): use tier 3 if not yet used, otherwise tier 2
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

const buildIntentPrompt = (intent) =>
  `INTENT: ${intent}.

Antworte NUR mit diesem JSON (kein Markdown, kein Text davor oder danach):
{"reflection": "<1 Satz der die letzte Antwort kurz spiegelt — kein Coaching, kein Lob, rein beobachtend>", "question": "<die nächste Frage zum Intent, maximal 2 Sätze, endet mit ?>"}`;

/* ─────────────────────────────────────────────────────────────
   PROMPTS
───────────────────────────────────────────────────────────── */

const ANALYSIS_SYSTEM_PROMPT = `Du analysierst die Antworten aus einem Reflexionsgespräch.
Du erhältst die Daten als strukturiertes JSON-Objekt mit einem "answers"-Array.

WICHTIG: Sprich die Person in allen Ausgabefeldern direkt mit "du" an.
Verwende NIEMALS Formulierungen wie "der Nutzer", "seine Gedanken" oder Dritte-Person-Konstruktionen.

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
  "summary":         "<1 Satz, max 16 Wörter, direkte du-Ansprache>",
  "pattern":         "<1 Satz, max 20 Wörter, beginnt mit 'In deinen Antworten...' oder 'Du hast mehrfach...'>",
  "strengths":       ["<Stärke>", "<Stärke>", "<Stärke>"],
  "energySources":   ["<Ding>", "<Ding>", "<Ding>"],
  "nextFocus":       "<1 Satz — wichtigster Fokus nächste 90 Tage>",
  "suggestedAction": "<1 konkreter kleiner Schritt heute>"
}`;

const SIGNAL_EXTRACTION_PROMPT = `Du analysierst die Antworten aus einem Reflexionsgespräch und extrahierst strukturierte Signale.
Du erhältst ein JSON-Objekt mit einem "answers"-Array.
Antworte NUR mit validem JSON. Kein Markdown.

{
  "values":          [],
  "motivations":     [],
  "energySources":   [],
  "frictions":       [],
  "strengthSignals": []
}

Drücke jeden Punkt als kurzen deutschen Begriff aus (2–6 Wörter). Keine generischen Begriffe.`;

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
    return {
      reflection: typeof parsed.reflection === "string" ? parsed.reflection.trim() : "",
      question:   typeof parsed.question   === "string" ? parsed.question.trim()   : raw,
    };
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

  useEffect(() => {
    // Mark as visited only after successful first render
    if (firstVisitRef.current) {
      localStorage.setItem("clarity_visited", "1");
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

  const wrapperKey = step === "question"
    ? `question-${questionIndex}`
    : step;

  /* ─── API ─────────────────────────────────────────────── */

  const sendMessage = async (msgs) => {
    const res  = await fetch(`${API_URL}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ messages: msgs }),
    });
    const data = await res.json();
    return data.content || data.reply || data.message || "";
  };

  const callAnalysisBackend = async (msgs) => {
    const res  = await fetch(`${API_URL}/api/analyze`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ messages: msgs }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && typeof data === "object" && !data.scores) {
      if (data.result && typeof data.result === "object") return data.result;
      if (typeof data.reply   === "string") return JSON.parse(data.reply);
      if (typeof data.message === "string") return JSON.parse(data.message);
    }
    return data;
  };

  /* ─── Analysis ───────────────────────────────────────── */

  const runAnalysis = async (finalAnswers) => {
    setStep("loading");
    try {
      const contextBlock = formatAnswersAsContext(finalAnswers);

      let signalsBlock = null;
      try {
        const raw = await callAnalysisBackend([
          { role: "system", content: SIGNAL_EXTRACTION_PROMPT },
          { role: "user",   content: `Hier sind die Antworten:\n\n${contextBlock}` },
        ]);
        signalsBlock = JSON.stringify(raw, null, 2);
      } catch (e) {
        console.warn("Signal extraction failed:", e.message);
      }

      const userContent = signalsBlock
        ? `ANTWORTEN:\n\n${contextBlock}\n\nEXTRAHIERTE SIGNALE:\n\n${signalsBlock}`
        : `Hier sind die Antworten:\n\n${contextBlock}`;

      const parsed = await callAnalysisBackend([
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user",   content: userContent },
      ]);

      await delay(2000);
      setResult(parsed);
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
        intent: questionIndex === 0 ? "initial" : QUESTION_INTENTS[questionIndex - 1],
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

    // Last question → straight to analysis, no reaction
    if (nextIndex > QUESTION_INTENTS.length) {
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

    const intentPrompt = buildIntentPrompt(QUESTION_INTENTS[nextIndex - 1]);

    try {
      const raw = await sendMessage([
        ...newMessages,
        { role: "system", content: intentPrompt },
      ]);
      const { reflection, question } = parseQuestionResponse(raw);
      setCurrentReflection(reflection);
      setCurrentQuestion(question || QUESTION_INTENTS[nextIndex - 1]);
    } catch (e) {
      console.error("Failed to get next question:", e);
      setCurrentReflection("");
      setCurrentQuestion(QUESTION_INTENTS[nextIndex - 1]);
    } finally {
      setIsTyping(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────── */

  return (
    <>
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
