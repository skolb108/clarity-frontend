import { useState, useEffect, useRef, useMemo, useCallback, memo, lazy, Suspense } from "react";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://clarity-backend-production-108.up.railway.app";
  
// ResultSection is lazy — loaded only after analysis completes (phase → "result").
// During the entire chat conversation this chunk is never downloaded.
const ResultSection = lazy(() => import("./ResultScreen"));


// ── Prompts ────────────────────────────────────────────────────────────────────

/**
 * Signal memory helpers — lightweight keyword frequency tracking.
 * Extracts meaningful words from user answers, filters German stopwords,
 * and surfaces repeated themes to the reflection AI.
 */
const GERMAN_STOPWORDS = new Set([
  "aber", "alle", "allem", "allen", "aller", "alles", "also", "andere", "anderen",
  "anderem", "anderer", "anderes", "auch", "bein", "beim", "beide", "beiden",
  "bereits", "besonders", "bien", "bin", "bist", "bitte", "brauche", "braucht",
  "dabei", "damit", "dann", "darin", "dass", "davon", "dazu", "dein", "deine",
  "deinen", "deiner", "deines", "denen", "denn", "dieser", "diese", "diesen",
  "diesem", "dieses", "doch", "dort", "durch", "eher", "eigen", "eigene",
  "eigenen", "eine", "einem", "einen", "einer", "eines", "einige", "einmal",
  "etwas", "euch", "euer", "eure", "ganz", "gerade", "genau", "gibt", "ging",
  "gute", "guten", "haben", "hatte", "hatten", "habe", "hier", "hinter",
  "immer", "ihnen", "ihrer", "ihrem", "ihres", "ihren", "jahre", "jetzt",
  "kann", "keine", "keinen", "keiner", "kommt", "könnte", "könnt", "lange",
  "machen", "macht", "meine", "meinen", "meiner", "meines", "meinem", "mich",
  "mehr", "meist", "mich", "muss", "müssen", "nach", "nicht", "nichts", "noch",
  "oder", "ohne", "sehr", "sich", "sind", "soll", "sollen", "sollte", "somit",
  "sonst", "sogar", "teil", "trotz", "über", "unter", "viel", "viele", "vielen",
  "vielleicht", "vom", "voll", "wann", "ware", "wäre", "weil", "weiß", "welche",
  "welchen", "welchem", "welches", "wenn", "werde", "werden", "wirklich",
  "wurde", "wurden", "zwar", "zwischen",
]);

/**
 * Extracts meaningful lowercase words (>4 chars, not stopwords) from a string.
 */
const extractKeywords = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-züäöß\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 4 && !GERMAN_STOPWORDS.has(w));

/**
 * Returns the top N keywords from signalsRef.keywords that appear >= minCount times.
 * Sorted by frequency descending.
 */
const getTopSignals = (keywordMap, topN = 3, minCount = 2) =>
  Object.entries(keywordMap)
    .filter(([, count]) => count >= minCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([word]) => word);

/**
 * Builds the reflection system prompt.
 * midInsight = true at question 8 (nextIndex 7) and question 10 (nextIndex 9).
 */
const buildReflectionSystemPrompt = (midInsight, topSignals = []) => {
  const base = `Du bist ein ruhiger, aufmerksamer Gesprächspartner – kein Coach, kein Therapeut.
Der Nutzer beantwortet gerade Reflexionsfragen über sein Leben.
Du reagierst kurz und menschlich auf seine letzte Antwort.`;

  const midBlock = midInsight
    ? `
Du befindest dich in der Mitte des Gesprächs.
Erkenne ein konkretes Muster aus den bisherigen Antworten und benenne es in einem Satz.
Beispiel: "Du hast jetzt schon ein paarmal Energie und Freiheit erwähnt – das scheint dir wirklich wichtig zu sein."`
    : `
Reagiere direkt auf das, was der Nutzer gerade gesagt hat.
Beispiele guter Reaktionen:
– "Das klingt wie eine echte Spannung, die du gerade trägst."
– "Energie taucht bei dir jetzt zum zweiten Mal auf."
– "Das ist ein sehr konkretes Bild."
– "Das ist offensichtlich noch nicht abgeschlossen."`;

  const rules = `
Strenge Regeln:
- Genau 1 Satz – nicht mehr.
- Niemals eine Frage stellen.
- Kein Coaching-Jargon, kein Therapeuten-Ton.
- Kein "Das ist toll" oder leere Bestätigung.
- Menschlich, geerdet, direkt.
- Wenn du ein Muster über mehrere Antworten siehst, darfst du es kurz benennen.`;

  const signalsBlock = topSignals.length > 0
    ? `\n\nWICHTIGE WIEDERKEHRENDE THEMEN: ${topSignals.join(", ")}\nWenn eines dieser Themen in der aktuellen Antwort auftaucht oder sich häuft, darfst du es kurz benennen.`
    : "";

  return `${base}${midBlock}${rules}${signalsBlock}`;
};

/**
 * Formats collected answers as "Frage / Antwort" blocks for better AI context.
 */
const formatAnswersAsContext = (answers) =>
  JSON.stringify({ answers }, null, 2);

/**
 * Analysis system prompt — speaks directly to the user using "du".
 * Never uses "der Nutzer" or third-person constructions in the output fields.
 */
const ANALYSIS_SYSTEM_PROMPT = `Du analysierst die Antworten aus einem Reflexionsgespräch.
Du erhältst die Daten als strukturiertes JSON-Objekt mit einem "answers"-Array.

WICHTIG: Sprich die Person in allen Ausgabefeldern direkt mit "du" an.
Verwende NIEMALS Formulierungen wie "der Nutzer", "seine Gedanken", "er strebt" oder ähnliche Dritte-Person-Konstruktionen.

Vermeide generische Aussagen wie:
– "Du strebst nach Erfolg."
– "Du suchst nach Sinn."

Formuliere stattdessen konkret und bezogen auf das, was die Person tatsächlich gesagt hat.
Schlechtes Beispiel: "Du strebst nach Erfolg."
Gutes Beispiel: "In deinen Antworten taucht immer wieder der Wunsch auf, mehr Freiheit für deine Familie zu schaffen."

SCORING
Bewerte die Person in 5 Dimensionen. Jeder Score muss eine ganze Zahl zwischen 4 und 25 sein. Vermeide runde 5er-Schritte.

Clarity (4–25): Wie klar und präzise formulierst du deine Ziele und Prioritäten? Vage Antworten → niedrig. Konkrete, differenzierte Aussagen → hoch.

Energy (4–25): Wie ausgewogen ist dein Verhältnis von energiegebenden zu energieraubenden Aktivitäten? Starke Dominanz von Drainern → niedrig. Klare Energiequellen und wenig Drainer → hoch.

Strength (4–25): Wie deutlich sind deine persönlichen Stärken erkennbar? Unsicher, keine konkreten Stärken → niedrig. Klare, mehrfach belegte Stärken → hoch.

Direction (4–25): Wie klar ist deine langfristige Richtung? Kein Bild der Zukunft → niedrig. Konkrete Vision mit Zeitrahmen → hoch.

Action (4–25): Wie groß ist deine Bereitschaft, jetzt zu handeln? Viele Hindernisse, kein konkreter Schritt → niedrig. Klarer nächster Schritt, Veränderungswille → hoch.

OUTPUT
Antworte NUR mit validem JSON. Kein Text davor oder danach. Kein Markdown.

{
  "scores": {
    "Clarity": number,
    "Energy": number,
    "Strength": number,
    "Direction": number,
    "Action": number
  },
  "confidence": number,
  "identityModes": [
    { "type": "...", "confidence": number }
  ],
  "summary": "...",
  "pattern": "...",
  "strengths": ["...", "...", "..."],
  "energySources": ["...", "...", "..."],
  "nextFocus": "...",
  "suggestedAction": "..."
}

Feldbeschreibungen (alle in direkter "du"-Ansprache):
confidence: Ganzzahl zwischen 40 und 95. Niedrig wenn Antworten kurz, vage oder widersprüchlich sind. Hoch wenn Antworten konkret, konsistent und detailliert sind. Vermeide runde 10er-Schritte.
identityModes: Array mit 1–2 Einträgen. Wähle ausschließlich aus diesen Typen:
  • Creator — Starker Drang, etwas Neues zu erschaffen, eigene Ideen umzusetzen, kreativ zu gestalten. Zeigt sich in Aussagen über Projekte, Inhalte, Produkte oder kreative Arbeit.
  • Builder — Fokus auf Aufbau, Systeme, Strukturen oder ein Unternehmen. Denkt in Phasen, Ressourcen und langfristiger Skalierung.
  • Explorer — Suche nach Bedeutung, neuen Erfahrungen oder dem eigenen Weg. Noch keine klare Richtung, aber starke Neugier und Offenheit.
  • Stability Seeker — Sicherheit, Struktur und Kontinuität stehen im Vordergrund. Veränderung wird als Risiko erlebt, nicht als Chance.
  • Transition Phase — Steht eindeutig an einem Wendepunkt zwischen zwei Lebensphasen. Alte Identität lässt los, neue noch nicht gefunden.
  • Burnout Risk — Deutliche Anzeichen von Erschöpfung, Energieverlust oder Überforderung. Mehrere Drainer, wenig Erholung, hohe Dauerbelastung.
  • Hidden Opportunity — Erkennbares ungenutztes Potenzial, das der Person selbst noch nicht vollständig bewusst ist. Stärken werden systematisch unterschätzt.
  Confidence je Modus: Ganzzahl 40–95. Nur 2 Modi wenn beide mit Confidence ≥ 55 belegbar sind.
summary: Genau 1 Satz (max 16 Wörter), der die Situation der Person präzise auf den Punkt bringt. Direkte "du"-Ansprache. Beispiel: "Du stehst gerade zwischen Sicherheit und dem Wunsch nach mehr Selbstbestimmung."
pattern: 1 persönlicher Satz (max 20 Wörter), der ein wiederkehrendes Motiv aus deinen Antworten beschreibt. Beginnt mit "In deinen Antworten..." oder "Du hast mehrfach...".
strengths: 3 konkrete Stärken basierend auf dem, was du gesagt hast. Keine generischen Begriffe.
energySources: 3 konkrete Dinge, die dir Energie geben – direkt aus deinen Antworten.
nextFocus: 1 Satz – dein wichtigster Fokus für die nächsten 90 Tage.
suggestedAction: 1 konkreter, kleiner Schritt den du heute tun kannst.`;

/**
 * Step 1 of 2 — Signal extraction prompt.
 * Runs before the main analysis to pull structured signals from raw answers.
 * The extracted signals are injected into the analysis prompt as additional context,
 * giving the model pre-processed insight anchors rather than raw text alone.
 */
const SIGNAL_EXTRACTION_PROMPT = `Du analysierst die Antworten aus einem Reflexionsgespräch und extrahierst strukturierte Signale.

Du erhältst ein JSON-Objekt mit einem "answers"-Array. Lies alle Antworten sorgfältig.

Deine Aufgabe: Erkenne wiederkehrende Muster, Werte und Spannungsfelder. Drücke jeden Punkt als kurzen, konkreten deutschen Begriff oder Halbsatz aus (2–6 Wörter). Keine vollständigen Sätze. Keine generischen Begriffe wie "Erfolg" oder "Glück".

Antworte NUR mit validem JSON. Kein Text davor oder danach. Kein Markdown.

{
  "values": [],
  "motivations": [],
  "energySources": [],
  "frictions": [],
  "strengthSignals": []
}

Feldbeschreibungen:
values: 2–4 Kernwerte die sich durch die Antworten ziehen. Beispiele: ["Selbstbestimmung", "Familie absichern", "Sichtbarkeit"].
motivations: 2–4 konkrete Antriebe. Beispiele: ["eigenes Projekt aufbauen", "weniger Fremdbestimmung"].
energySources: 2–4 Dinge die der Person nachweislich Energie geben, direkt aus den Antworten. Beispiele: ["kreatives Arbeiten allein", "Gespräche mit Gleichgesinnten"].
frictions: 2–4 Hemmnisse oder Spannungsfelder. Beispiele: ["zu viel Verantwortung im Job", "Angst vor finanziellem Risiko"].
strengthSignals: 2–4 belegte Stärken oder Fähigkeiten. Beispiele: ["strukturiertes Denken", "Menschen begeistern können"].`;

// ── Helpers ────────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


// ── Helper components ────────────────────────────────────────────────────────── ──────────────────────────────────────────────────────────
const SplashDot = memo(function SplashDot({ index }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => (s + 1) % 4), 500);
    return () => clearInterval(iv);
  }, []);
  const lit = step > index;
  return (
    <span style={{
      width: 6, height: 6, borderRadius: "50%",
      background: lit ? "#999" : "#ccc",
      display: "inline-block",
      transition: "background 0.2s ease",
    }} />
  );
});

const ThinkingDots = memo(function ThinkingDots() {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{
        fontSize: 14, color: "#000", opacity: 0.38,
        letterSpacing: "0.10em", textTransform: "uppercase", marginBottom: 12,
      }}>
        Clarity denkt
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <span className="c-wave-dot" />
        <span className="c-wave-dot" />
        <span className="c-wave-dot" />
      </div>
    </div>
  );
});

// ── Analysis Screen — full-screen overlay while AI processes answers ──────────

const AnalysisScreen = memo(function AnalysisScreen() {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "linear-gradient(180deg, #f8f9fb 0%, #eef2f7 100%)",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      opacity: vis ? 1 : 0,
      transition: "opacity 400ms ease",
    }}>
      {/* Pulsing gradient orb — 80px per spec */}
      <div style={{
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg, #4F8CFF, #7C5CFF)",
        marginBottom: 36,
        animation: "analysisPulse 2s ease-in-out infinite",
        boxShadow: "0 0 48px rgba(79,140,255,0.40)",
      }} />

      <div style={{
        fontSize: 18, color: "#000", opacity: 0.60,
        letterSpacing: "0.02em", lineHeight: 1.6,
        textAlign: "center", maxWidth: 280,
      }}>
        Clarity analysiert deine Antworten…
      </div>
    </div>
  );
});

// ── Share helpers ──────────────────────────────────────────────────────────────


const ChatMessage = memo(function ChatMessage({ msg }) {
  if (msg.role === "user") {
    return (
      <div className="c-user-bubble">
        <div className="c-user-bubble-inner">{msg.content}</div>
      </div>
    );
  }
  if (msg.type === "reflection") {
    return (
      <div className="c-fade-up"
        style={{ marginTop: 8, marginBottom: 40, paddingLeft: 16, borderLeft: "2px solid rgba(0,0,0,0.15)" }}>
        <div style={{ fontSize: 14, letterSpacing: "0.12em", color: "#999", textTransform: "uppercase", marginBottom: 10 }}>
          Beobachtung
        </div>
        <div style={{ fontSize: 18, fontStyle: "italic", color: "#444", lineHeight: 1.6 }}>
          {msg.content}
          {msg.streaming && <StreamCursor color="#4F8CFF" />}
        </div>
      </div>
    );
  }
  if (msg.isQuestion) {
    return (
      <div className="c-fade-up"
        style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.6, marginBottom: 40 }}>
        {msg.content}
      </div>
    );
  }
  return (
    <div className="c-fade-up"
      style={{ fontSize: 18, fontWeight: 400, color: "#000", opacity: 0.78, lineHeight: 1.6, marginBottom: 40 }}>
      {msg.content}
      {msg.streaming && <StreamCursor color="#999" />}
    </div>
  );
});

// Blinking cursor shown while tokens are still arriving
const StreamCursor = memo(function StreamCursor({ color }) {
  return (
    <span style={{
      display: "inline-block",
      width: 2, height: "1em",
      background: color,
      marginLeft: 3,
      verticalAlign: "text-bottom",
      animation: "waveBounce 0.7s ease-in-out infinite",
    }} />
  );
});

// ── Main component ───────────────────────────────────────────────────────────── ─────────────────────────────────────────────────────────────
function Clarity() {
  const [phase,          setPhase]        = useState("chat");
  const [messages,       setMessages]     = useState([]);
  const [input,          setInput]        = useState("");
  const [isTyping,       setIsTyping]     = useState(false);
  const [result,         setResult]       = useState(null);
  const [analysing,      setAnalysing]    = useState(false);

  // Collected answers: [{ question, answer }]
  const answersRef = useRef([]);

  // Lightweight keyword frequency map — tracks repeated themes across answers
  const signalsRef = useRef({ keywords: {} });

  // UI state
  const [isListening,    setIsListening]  = useState(false);
  const [topbarOpaque,   setTopbarOpaque] = useState(false);
  const [heroFaded,      setHeroFaded]    = useState(false);
  const [sphereChatMode, setSphereChat]   = useState(false);
  const [inputReady,     setInputReady]   = useState(false);
  const [inputFocused,   setInputFocused] = useState(false);

  const inputRef           = useRef(null);
  const bottomRef          = useRef(null);
  const recognitionRef     = useRef(null);
  const finalTranscriptRef = useRef("");   // accumulates confirmed speech across sessions
  const pageRef            = useRef(null);
  const rafRef             = useRef(null);
  const mouseRef           = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });
  const phaseRef           = useRef("splash");  // mirror of phase for RAF closure

  // Keep phaseRef in sync so the RAF closure always reads the current phase
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const SR = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const hasSpeech = !!SR;

  // ── DEV shortcut: CMD/CTRL + SHIFT + K → skip to analysis ─────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        const dummyAnswers = messages
          .filter(m => m.role === "user")
          .map((m, i) => ({ question: `Q${i + 1}`, answer: m.content }));
        runAnalysis(dummyAnswers.length > 0 ? dummyAnswers : [{ question: "Dev", answer: "Testantwort" }]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [messages]);

  // ── iOS keyboard: shift input bar when virtual keyboard opens ────────────────
  // visualViewport.height shrinks when the keyboard appears; window.innerHeight
  // does not — so position:fixed elements stay anchored to the wrong bottom.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onVVChange = () => {
      const bar = document.getElementById('c-input-bar');
      if (!bar) return;
      // Gap between the bottom of the visual viewport and the window bottom
      const gap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      bar.style.bottom = gap + 'px';
    };
    vv.addEventListener('resize', onVVChange, { passive: true });
    vv.addEventListener('scroll', onVVChange, { passive: true });
    return () => {
      vv.removeEventListener('resize', onVVChange);
      vv.removeEventListener('scroll', onVVChange);
    };
  }, []);

  // ── Mouse / scroll tracking — always active, zero GPU cost ──────────────────
  // Kept in a separate effect with [] so the listeners survive phase changes.
  // The RAF loop reads from these refs; tracking without a running loop is free.
  useEffect(() => {
    const onMouse = (e) => {
      mouseRef.current.tx = e.clientX / window.innerWidth;
      mouseRef.current.ty = e.clientY / window.innerHeight;
    };
    const onScroll = () => { mouseRef.current.scrollY = window.scrollY; };
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("scroll",    onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll",    onScroll);
    };
  }, []);

  // ── Parallax RAF — runs ONLY while phase === "chat" ───────────────────────────
  // Re-runs whenever phase changes. On every non-chat phase the cleanup
  // cancels the pending frame immediately, leaving the main thread idle.
  // On iOS this eliminates ~60 wasted rAF callbacks/s during analysis and result.
  useEffect(() => {
    if (phase !== "chat") {
      // Ensure any previously scheduled frame is cancelled before we exit.
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const atmo   = document.getElementById("c-atmosphere");
    const nebula = document.getElementById("c-nebula");
    const shell  = document.getElementById("c-shell");

    const tick = () => {
      const m       = mouseRef.current;
      const scrollY = m.scrollY ?? 0;

      m.x += (m.tx - m.x) * 0.06;
      m.y += (m.ty - m.y) * 0.06;

      const atmoY = Math.min(scrollY * 0.02, 20);
      const nebY  = Math.min(scrollY * 0.05, 40);

      if (atmo)   atmo.style.transform   = `translateY(${atmoY.toFixed(2)}px)`;
      if (nebula) nebula.style.transform = `translateY(${nebY.toFixed(2)}px)`;

      if (shell) {
        const lx = (30 + m.x * 40).toFixed(1) + "%";
        const ly = (20 + m.y * 60).toFixed(1) + "%";
        shell.style.setProperty("--lx", lx);
        shell.style.setProperty("--ly", ly);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [phase]);

  // ── Mount effect: start visual transition, then trigger first AI message ───────
  // The AI controls the conversation. On mount we fire an empty message so the
  // backend system prompt generates the opening question automatically.
  useEffect(() => {
    document.getElementById("c-strips")?.classList.add("fade-out");
    setSphereChat(true);
    setTimeout(async () => {
      try {
        setIsTyping(true);
        const opening = await sendMessage([]);
        setIsTyping(false);
        if (opening) {
          setMessages([{ role: "assistant", content: opening }]);
        }
      } catch (_) {
        setIsTyping(false);
      }
      setInputReady(true);
      setTimeout(() => inputRef.current?.focus({ preventScroll: false }), 120);
    }, 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Backend call ──────────────────────────────────────────────────────────
  // Simple request-response — no streaming, no AbortController.
  const sendMessage = async (messages) => {
    const res = await fetch(`${API_URL}/api/chat`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ messages }),
    });
    const data = await res.json();
    console.log("sendMessage response:", data);
    return data.content || data.reply || data.message || "";
  };


  // ── Analysis endpoint — /api/analyze returns guaranteed JSON ──────────────
  const callAnalysisBackend = async (messages) => {
    const res  = await fetch(`${API_URL}/api/analyze`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("Analysis response:", data);
    // Unwrap if backend wraps result
    if (data && typeof data === "object" && !data.scores) {
      if (data.result && typeof data.result === "object") return data.result;
      if (typeof data.reply   === "string") return JSON.parse(data.reply);
      if (typeof data.message === "string") return JSON.parse(data.message);
    }
    return data;
  };

  // ── Analysis: send all 12 answers at once ──────────────────────────────────
  const runAnalysis = async (answers) => {
    setInputReady(false);
    setAnalysing(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    try {
      const contextBlock = formatAnswersAsContext(answers);

      // ── Step 1: Signal extraction ──────────────────────────────────────────
      // Attempt to extract structured signals from the raw answers.
      // On failure we fall back to the single-step path so the user always
      // receives a result even if the extraction call times out or errors.
      let signalsBlock = null;
      try {
        const signalsRaw = await callAnalysisBackend([
          { role: "system", content: SIGNAL_EXTRACTION_PROMPT },
          {
            role: "user",
            content: `Hier sind die Antworten aus dem Reflexionsgespräch:\n\n${contextBlock}`,
          },
        ]);
        // signalsRaw is already a parsed object (callAnalysisBackend returns JSON)
        signalsBlock = JSON.stringify(signalsRaw, null, 2);
        console.log("Signal extraction complete:", signalsRaw);
      } catch (signalErr) {
        console.warn("Signal extraction failed — falling back to single-step analysis:", signalErr.message);
      }

      // ── Step 2: Insight generation ─────────────────────────────────────────
      // Build the user message. If signals are available, inject them
      // as additional context so the analysis model has pre-processed anchors.
      const userContent = signalsBlock
        ? `ANTWORTEN:\n\n${contextBlock}\n\nEXTRAHIERTE SIGNALE:\n\n${signalsBlock}`
        : `Hier sind die Antworten aus dem Reflexionsgespräch:\n\n${contextBlock}`;

      const parsed = await callAnalysisBackend([
        { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ]);

      await delay(2000);
      setAnalysing(false);
      setResult(parsed);
      setPhase("result");
      setTimeout(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, 200);
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysing(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Clarity hatte gerade ein Problem. Versuche es bitte noch einmal.",
        },
      ]);
    }
  };

  // ── User submits an answer ─────────────────────────────────────────────────
  // The AI fully controls the conversation. The frontend sends the full
  // message history and appends whatever the AI returns.
  // CONVERSATION_COMPLETE in the response triggers the analysis phase.
  const dispatchAnswer = async (text) => {
    if (!text.trim() || isTyping || analysing) return;

    const trimmed = text.trim();

    // Append user bubble immediately
    const updatedMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(updatedMessages);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    // Build the API message list: only role + content for the backend
    const apiMessages = updatedMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      setIsTyping(true);
      const response = await sendMessage(apiMessages);
      setIsTyping(false);

      if (!response) return;

      // Detect CONVERSATION_COMPLETE signal in the response
      if (response.includes("CONVERSATION_COMPLETE")) {
        // Extract JSON after the token
        const jsonStart = response.indexOf("{");
        if (jsonStart !== -1) {
          try {
            const parsed = JSON.parse(response.slice(jsonStart));
            const answers = updatedMessages
              .filter(m => m.role === "user")
              .map((m, i) => ({ question: `Q${i + 1}`, answer: m.content }));
            await runAnalysis(answers, parsed);
          } catch (e) {
            console.error("Failed to parse CONVERSATION_COMPLETE JSON:", e);
          }
        }
        return;
      }

      // Normal AI response — append and continue
      await new Promise((r) => setTimeout(r, 1200)); // intentional reading pause
      setMessages((prev) => [...prev, { role: "assistant", content: response }]);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 80);

    } catch (err) {
      console.error("AI response failed:", err);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Da ist etwas schiefgelaufen. Versuch es nochmal." },
      ]);
    }
  };


  // ── Voice input — continuous, accumulating across pauses ────────────────────
  //
  // How it works:
  //   finalTranscriptRef holds all confirmed (isFinal) text from past segments.
  //   Each onresult appends new finals to the ref, then displays
  //   ref + current interim so the field always shows the full running text.
  //
  //   continuous: true   → recognition doesn't stop on brief pauses
  //   onend auto-restart → some browsers still force-stop on longer silences;
  //                        we restart transparently if the user hasn't tapped Stop.
  const startRecognition = () => {
    if (!SR) return;
    const rec = new SR();
    rec.lang            = "de-DE";
    rec.continuous      = true;       // stay alive through natural pauses
    rec.interimResults  = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => setIsListening(true);

    rec.onresult = (e) => {
      let newFinals = "";
      let interim   = "";

      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) newFinals += e.results[i][0].transcript;
        else                       interim   += e.results[i][0].transcript;
      }

      // Append any newly confirmed segments to the accumulated transcript.
      // Trim + add a space separator only when there is existing text.
      if (newFinals) {
        const prev = finalTranscriptRef.current;
        finalTranscriptRef.current = prev
          ? prev.trimEnd() + " " + newFinals.trim()
          : newFinals.trim();
      }

      // Display: everything confirmed so far + current interim hypothesis
      const displayed = interim
        ? finalTranscriptRef.current + (finalTranscriptRef.current ? " " : "") + interim
        : finalTranscriptRef.current;

      setInput(displayed);

      // Auto-resize textarea to match new content
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
        inputRef.current.style.height =
          Math.min(inputRef.current.scrollHeight, 120) + "px";
      }
    };

    rec.onerror = (e) => {
      // "no-speech" is routine on a quiet pause — don't treat it as a failure
      if (e.error === "no-speech") return;
      setIsListening(false);
    };

    rec.onend = () => {
      // If the user hasn't pressed Stop, restart automatically.
      // This covers browsers that force-terminate after ~60 s or on silence.
      if (recognitionRef.current === rec && isListeningRef.current) {
        try { rec.start(); } catch (_) { setIsListening(false); }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch (_) { setIsListening(false); }
  };

  // Ref mirror of isListening so onend closure can read the latest value
  const isListeningRef = useRef(false);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const toggleVoice = () => {
    if (!hasSpeech) return;
    if (isListening) {
      // User pressed Stop: set flag first so onend doesn't auto-restart
      isListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      // Keep whatever text was accumulated — user can edit before sending
      return;
    }
    // Fresh start: clear any leftover transcript from a previous session
    finalTranscriptRef.current = "";
    startRecognition();
  };

  // ── Derived UI values ────────────────────────────────────────────────────────
  const showInput = useMemo(
    () => phase === "chat" && inputReady && !isTyping && !analysing,
    [phase, inputReady, isTyping, analysing]
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Animated background layers */}
      <div id="c-strips" />
      <div id="c-atmosphere">
        <div className="c-atmo c-atmo-1" />
        <div className="c-atmo c-atmo-2" />
      </div>
      <div
        id="c-nebula"
        className={[
          sphereChatMode ? "chat-mode" : "",
          (isTyping || analysing) ? "thinking" : "",
        ].filter(Boolean).join(" ")}
      >
        <div className="c-blob c-blob-1" />
        <div className="c-blob c-blob-2" />
      </div>

      {/* Analysis overlay — full-screen, shown when AI is processing */}
      {analysing && <AnalysisScreen />}

      {/* Fullscreen app layout */}
      <div id="c-app">

        {/* ── CHAT — Part 7: fades in after hero fade-out ────────────────── */}
        {phase === "chat" && (
          <div className="c-chat-fadein" style={{ flex: 1 }}>

            {/* Minimal header — AI controls the conversation, no question counter */}
            <div id="c-progress-header">
              <div id="c-progress-header-inner">
                <div id="c-progress-meta">
                  <span id="c-progress-logo">Clarity</span>
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div id="c-chat-content">

              {/* Message list */}
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}

              {isTyping && <ThinkingDots />}

              <div ref={bottomRef} style={{ height: 1 }} />
            </div>
          </div>
        )}

        {/* ── RESULT ───────────────────────────────────────────────────── */}
        {phase === "result" && result && (() => {
          const analysisResult = result;

          // Hard fallback — if result is not a plain object, bail out silently
          if (!analysisResult || typeof analysisResult !== "object" || Array.isArray(analysisResult)) {
            console.warn("RESULT: invalid shape, skipping render", analysisResult);
            return null;
          }

          // Sanitize every field before passing to ResultSection.
          // Nothing here can be a raw object that React would try to stringify.
          const safeResult = {
            summary:         typeof analysisResult.summary         === "string" ? analysisResult.summary         : "",
            pattern:         typeof analysisResult.pattern         === "string" ? analysisResult.pattern         : "",
            nextFocus:       typeof analysisResult.nextFocus       === "string" ? analysisResult.nextFocus       : "",
            suggestedAction: typeof analysisResult.suggestedAction === "string" ? analysisResult.suggestedAction : "",
            confidence:      typeof analysisResult.confidence      === "number" ? analysisResult.confidence      : null,
            scores: analysisResult.scores && typeof analysisResult.scores === "object" && !Array.isArray(analysisResult.scores)
              ? {
                  Clarity:   typeof analysisResult.scores.Clarity   === "number" ? analysisResult.scores.Clarity   : 50,
                  Energy:    typeof analysisResult.scores.Energy     === "number" ? analysisResult.scores.Energy    : 50,
                  Strength:  typeof analysisResult.scores.Strength   === "number" ? analysisResult.scores.Strength  : 50,
                  Direction: typeof analysisResult.scores.Direction  === "number" ? analysisResult.scores.Direction : 50,
                  Action:    typeof analysisResult.scores.Action     === "number" ? analysisResult.scores.Action    : 50,
                }
              : { Clarity: 50, Energy: 50, Strength: 50, Direction: 50, Action: 50 },
            identityModes: Array.isArray(analysisResult.identityModes)
              ? analysisResult.identityModes
                  .filter(m => m && typeof m === "object" && typeof m.type === "string")
                  .map(m => ({
                    type:       String(m.type).trim(),
                    confidence: typeof m.confidence === "number" ? m.confidence : 60,
                  }))
              : [],
            strengths: Array.isArray(analysisResult.strengths)
              ? analysisResult.strengths.filter(s => typeof s === "string")
              : [],
            energySources: Array.isArray(analysisResult.energySources)
              ? analysisResult.energySources.filter(s => typeof s === "string")
              : [],
          };

          console.log("SAFE RESULT:", safeResult);

          return (
            <div>
              <Suspense fallback={null}>
                <ResultSection result={safeResult} />
              </Suspense>
              <div ref={bottomRef} style={{ height: 1 }} />
            </div>
          );
        })()}

      </div>{/* /#c-app */}

      {/* Fixed input bar — rendered outside c-app so it overlays everything */}
      {showInput && (
        <div id="c-input-bar">
          <div id="c-input-inner">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  const t = input.trim();
                  if (!t) return;
                  setInput("");
                  if (inputRef.current) inputRef.current.style.height = "auto";
                  dispatchAnswer(t);
                }
              }}
              placeholder="Schreib deine Antwort…"
              rows={1}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            {hasSpeech && (
              <button
                onClick={toggleVoice}
                className={`c-btn-circle c-btn-mic${isListening ? " listening" : ""}`}
                aria-label={isListening ? "Stop" : "Mikrofon"}
              >
                {isListening ? (
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="3" width="10" height="10" rx="2"/>
                  </svg>
                ) : (
                  <svg width="14" height="16" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="1" width="6" height="10" rx="3"/>
                    <path d="M2 8a6 6 0 0 0 12 0"/>
                    <line x1="8" y1="14" x2="8" y2="17"/>
                    <line x1="5" y1="17" x2="11" y2="17"/>
                  </svg>
                )}
              </button>
            )}
            <button onClick={() => {
                const t = input.trim();
                if (!t) return;
                setInput("");
                if (inputRef.current) inputRef.current.style.height = "auto";
                dispatchAnswer(t);
              }} className="c-btn-circle c-btn-send" aria-label="Senden">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="13" x2="8" y2="3"/>
                <polyline points="4,7 8,3 12,7"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════

// ── ChatFlow default export ────────────────────────────────────────────────────
export default function ChatFlow() {
  return <Clarity />;
}
