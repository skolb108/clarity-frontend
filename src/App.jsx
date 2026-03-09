import { useState, useEffect, useRef } from "react";

// ── Questions — frontend controls the order, AI never generates them ──────────
const QUESTIONS = [
  "Was beschäftigt dich gerade am meisten in deinem Leben?",
  "Was läuft gut in deinem Leben – und was fühlt sich nicht richtig an?",
  "Wann fühlst du dich lebendig oder inspiriert?",
  "Welche Dinge geben dir Energie?",
  "Welche Dinge ziehen dir Energie?",
  "Worin bist du besonders gut?",
  "Wofür kommen andere Menschen zu dir wenn sie Hilfe brauchen?",
  "Wenn du in drei Jahren zurückblickst was müsste passiert sein damit du zufrieden bist?",
  "Gibt es etwas das du schon lange tun möchtest?",
  "Was hält dich bisher davon ab?",
  "Warum ist dir das trotzdem wichtig?",
  "Wenn du heute eine kleine Sache verändern würdest welche wäre das?",
];

// ── Analysis prompt — sent once after all 12 answers ─────────────────────────
const ANALYSIS_PROMPT = `Du analysierst die Antworten eines Nutzers aus einem Reflexionsgespräch.

Deine Analyse muss sich direkt auf seine Aussagen beziehen.

Vermeide generische Aussagen wie:
"Der Nutzer strebt nach Erfolg"
"Der Nutzer sucht Sinn"

Formuliere stattdessen persönlich und konkret,
als würdest du über genau diese Person sprechen.

Du erhältst die 12 Antworten eines Nutzers aus einem Reflexionsgespräch als JSON-Array.
Jedes Element hat die Form: { "question": "...", "answer": "..." }

Analysiere die Antworten tiefgehend und erstelle ein Klarheitsprofil.

SCORING
Bewerte den Nutzer in 5 Dimensionen. Jeder Score muss eine ganze Zahl zwischen 4 und 25 sein. Vermeide runde 5er-Schritte.

Clarity (4–25): Wie klar und präzise formuliert der Nutzer seine Ziele und Prioritäten? Vage Antworten → niedrig. Konkrete, differenzierte Aussagen → hoch.

Energy (4–25): Wie ausgewogen ist das Verhältnis von energiegebenden zu energieraubenden Aktivitäten? Starke Dominanz von Drainern → niedrig. Klare Energiequellen und wenig Drainer → hoch.

Strength (4–25): Wie deutlich sind persönliche Stärken erkennbar? Unsicher, keine konkreten Stärken → niedrig. Klare, mehrfach belegte Stärken → hoch.

Direction (4–25): Wie klar ist die langfristige Richtung? Kein Bild der Zukunft → niedrig. Konkrete Vision mit Zeitrahmen → hoch.

Action (4–25): Wie groß ist die Bereitschaft, jetzt zu handeln? Viele Hindernisse, kein konkreter Schritt → niedrig. Klarer nächster Schritt, Veränderungswille → hoch.

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
  "pattern": "...",
"strengths": ["...", "...", "..."],
"energySources": ["...", "...", "..."],
"nextFocus": "...",
"suggestedAction": "..."
}

pattern: Ein persönlicher Satz (max 20 Wörter), der ein wiederkehrendes Motiv aus den Antworten beschreibt. Keine generischen Aussagen.
strengths: 3 konkrete Stärken des Nutzers basierend auf seinen Antworten.
energySources: 3 konkrete Dinge die dem Nutzer Energie geben.
nextFocus: 1 Satz — der wichtigste Fokus für die nächsten 90 Tage.
suggestedAction: 1 konkreter, kleiner Schritt den der Nutzer heute tun kann.`;

// ── Intro sequence ────────────────────────────────────────────────────────────
const INTRO_CHUNKS = [
  "Bevor wir anfangen eine kurze Frage.",
  "Weißt du gerade wirklich was du in deinem Leben willst?",
  "Viele Menschen funktionieren einfach aber haben ihre Richtung aus den Augen verloren.",
  "Ich stelle dir ein paar kurze Fragen. Es dauert etwa 10 Minuten. Lass uns mit etwas Einfachem anfangen.",
  QUESTIONS[0],
];


// ── Global CSS ────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f0ede8; }
  body { display: flex; justify-content: center; }
  #root { width: 100%; display: flex; justify-content: center; }

  #c-nebula {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background: #f0ede8; overflow: hidden; transition: opacity 2s ease;
  }
  #c-nebula.chat-mode { opacity: 0.35; }
  .c-blob { position: absolute; border-radius: 50%; filter: blur(90px); }
  .c-blob-1 {
    width: 55vw; height: 55vw; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(160,150,255,0.70) 0%, transparent 60%);
    animation: blobDrift1 14s ease-in-out infinite;
  }
  .c-blob-2 {
    width: 42vw; height: 42vw; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(100,180,255,0.65) 0%, transparent 60%);
    animation: blobDrift2 18s ease-in-out infinite;
  }
  .c-blob-3 {
    width: 38vw; height: 38vw; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(255,150,190,0.50) 0%, transparent 60%);
    animation: blobDrift3 16s ease-in-out infinite;
  }
  .c-blob-4 {
    width: 30vw; height: 30vw; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(100,220,195,0.45) 0%, transparent 60%);
    animation: blobDrift4 20s ease-in-out infinite;
  }
  @keyframes blobDrift1 {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    33%      { transform: translate(-44%,-56%) scale(1.05); }
    66%      { transform: translate(-56%,-44%) scale(0.96); }
  }
  @keyframes blobDrift2 {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    40%      { transform: translate(-57%,-44%) scale(1.06); }
    70%      { transform: translate(-43%,-55%) scale(0.95); }
  }
  @keyframes blobDrift3 {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    33%      { transform: translate(-43%,-43%) scale(1.08); }
    66%      { transform: translate(-57%,-57%) scale(0.94); }
  }
  @keyframes blobDrift4 {
    0%,100% { transform: translate(-50%,-50%) scale(1); }
    50%      { transform: translate(-44%,-58%) scale(1.10); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  #c-page {
    position: relative; z-index: 1; width: 100%; max-width: 680px;
    min-height: 100vh; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    padding: 120px 40px 180px;
  }
  #c-topbar {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 680px;
  z-index: 100;
  background: transparent;
  padding: 22px 40px 0;
  transition: background 0.5s ease, backdrop-filter 0.5s ease;
}
  #c-topbar.opaque {
    background: rgba(240,237,232,0.75);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  }
  #c-logo {
    font-size: 11px; letter-spacing: 0.35em; color: #888;
    text-align: center; margin-bottom: 14px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }
  #c-progress-track {
    width: 100%; height: 4px; background: #e0e0e0;
    overflow: hidden; opacity: 0; transition: opacity 0.6s ease;
  }
  #c-progress-track.show { opacity: 1; }
  #c-progress-fill { height: 4px; background: #000; width: 0%; transition: width 400ms ease; }
  #c-question-label {
    font-size: 10px; letter-spacing: 0.15em; color: #000;
    text-transform: uppercase; opacity: 0; padding: 10px 0 14px; transition: opacity 0.6s ease;
  }
  #c-question-label.show { opacity: 0.5; }

  #c-hero {
    text-align: center; padding: 56px 0 64px; opacity: 1; max-height: 800px;
    overflow: hidden; transition: opacity 1.2s ease, max-height 1.2s ease, padding 1.2s ease;
  }
  #c-hero.faded { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; pointer-events: none; }

  #c-input-bar {
    position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
    width: calc(100% - 80px); max-width: 640px;
    background: rgba(248,245,240,0.94); backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 28px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.07);
    border-radius: 16px; margin-bottom: 24px; padding: 14px 18px 14px 20px;
    display: flex; align-items: flex-end; gap: 10px; z-index: 200;
  }
  #c-input-bar textarea {
    flex: 1; border: none; outline: none; font-size: 18px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #000; background: transparent; resize: none;
    line-height: 1.55; max-height: 140px; overflow-y: auto; padding: 2px 0;
  }
  #c-input-bar textarea::placeholder { color: #bbb; }

  .c-fade-up { animation: fadeUp 0.6s ease forwards; opacity: 0; }
  .c-user-bubble { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .c-user-bubble-inner {
    background: #f0f0f0; border-radius: 18px 18px 4px 18px;
    padding: 14px 18px; max-width: 80%; font-size: 18px; color: #000; line-height: 1.6;
  }

  @media (max-width: 600px) {
    #c-input-bar { width: calc(100% - 32px); margin-bottom: 16px; border-radius: 14px; }
    #c-input-bar textarea { font-size: 16px; }
    #c-page { padding: 160px 40px 180px; }
    #c-hero-h1 { font-size: 36px !important; }
    #c-hero-sub { font-size: 24px !important; }
  }
`;


// ── Helper components ─────────────────────────────────────────────────────────
function InjectCSS() {
  useEffect(() => {
    const prev = document.getElementById("c-global-css");
    if (prev) prev.remove();
    const el = document.createElement("style");
    el.id = "c-global-css";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);
  return null;
}

function ThinkingDots() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => (s + 1) % 4), 500);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, color: "#000", letterSpacing: "0.06em", marginBottom: 10 }}>Clarity denkt</div>
      <div style={{ display: "flex", gap: 7 }}>
        {[0,1,2].map(i => (
          <span key={i} style={{ fontSize: 11, color: "#000", opacity: step > i ? 1 : 0.15, transition: "opacity 0.3s" }}>●</span>
        ))}
      </div>
    </div>
  );
}

function ResultSection({ result }) {
  const [vis, setVis]               = useState(false);
  const [barsOn, setBarsOn]         = useState(false);
  const [hover, setHover]           = useState(false);
  const [hoverShare, setHoverShare] = useState(false);
  const [copied, setCopied]         = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVis(true), 60);
    const t2 = setTimeout(() => setBarsOn(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const buildShareText = () => {
    const scores = Object.entries(result.scores)
      .map(([label, value]) => `${label}: ${value}`)
      .join("\n");
    return `Mein Klarheitsprofil von Clarity:\n\n${scores}\n\nMein nächster Fokus:\n${result.nextFocus}\n\nTeste dein eigenes Profil: Clarity`;
  };

  const handleShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try { await navigator.share({ title: "Mein Clarity Profil", text }); }
      catch (e) { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true); setTimeout(() => setCopied(false), 2200);
      } catch (e) {
        const el = document.createElement("textarea");
        el.value = text; document.body.appendChild(el); el.select();
        document.execCommand("copy"); document.body.removeChild(el);
        setCopied(true); setTimeout(() => setCopied(false), 2200);
      }
    }
  };

  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(20px)", transition: "opacity 600ms ease, transform 600ms ease" }}>
      <div style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.6, marginBottom: 48 }}>
        Hier ist, was ich in deinen Antworten erkenne.
      </div>
      <div style={{
  fontSize: 18,
  lineHeight: 1.6,
  marginBottom: 40,
  opacity: 0.8
}}>
  {result.pattern}
</div>
      <div style={{ fontSize: 14, letterSpacing: "0.3em", color: "#000", marginBottom: 36, textTransform: "uppercase", opacity: 0.45 }}>Dein Klarheitsprofil</div>
      <div style={{ marginBottom: 60 }}>
        {Object.entries(result.scores).map(([label, value]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 16 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "#000", width: 80, flexShrink: 0 }}>{label}</div>
            <div style={{ flex: 1, height: 3, background: "#ddd", overflow: "hidden" }}>
              <div style={{ height: 3, background: "#000", width: barsOn ? `${value}%` : "0%", transition: "width 1s ease" }} />
            </div>
            <div style={{ fontSize: 12, color: "#000", width: 28, textAlign: "right", flexShrink: 0 }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, marginBottom: 60 }}>
        {[
          { title: "Deine Stärken",        items: result.strengths },
          { title: "Deine Energiequellen", items: result.energySources },
          { title: "Dein nächster Fokus",  items: [result.nextFocus] },
        ].map(({ title, items }) => (
          <div key={title}>
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#000", marginBottom: 16, textTransform: "uppercase" }}>{title}</div>
            {items?.map((s, i) => <div key={i} style={{ fontSize: 14, color: "#000", lineHeight: 1.8 }}>— {s}</div>)}
          </div>
        ))}
      </div>
      <div style={{ borderTop: "1px solid #ddd", paddingTop: 44, marginBottom: 60, textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#000", marginBottom: 18, textTransform: "uppercase" }}>Deine Aufgabe für heute</div>
        <div style={{ fontSize: 20, fontWeight: 400, color: "#000", lineHeight: 1.55 }}>{result.suggestedAction}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 80 }}>
        <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          style={{ border: "1px solid #000", background: hover ? "#000" : "transparent", color: hover ? "#fff" : "#000", fontFamily: "inherit", fontSize: 13, letterSpacing: "0.2em", padding: "18px 36px", cursor: "pointer", transition: "background 200ms, color 200ms" }}>
          Clarity System starten – kostenlos
        </button>
        <button onClick={handleShare}
          onMouseEnter={() => setHoverShare(true)} onMouseLeave={() => setHoverShare(false)}
          style={{ border: "1px solid #000", background: hoverShare ? "#000" : "#fff", color: hoverShare ? "#fff" : "#000", fontFamily: "inherit", fontSize: 13, letterSpacing: "0.2em", padding: "18px 36px", cursor: "pointer", transition: "background 200ms, color 200ms" }}>
          {copied ? "✓ Kopiert" : "Profil teilen"}
        </button>
      </div>
    </div>
  );
}


// ── Main component ────────────────────────────────────────────────────────────
export default function Clarity() {
  const [phase,          setPhase]        = useState("splash");
  const [messages,       setMessages]     = useState([]);
  const [input,          setInput]        = useState("");
  const [isTyping,       setIsTyping]     = useState(false);
  const [result,         setResult]       = useState(null);
  const [analysing,      setAnalysing]    = useState(false);

  // Frontend controls which question we're on (0-indexed)
  const [currentQIndex,  setCurrentQIndex] = useState(0);
  // Answers collected: [{ question, answer }]
  const answersRef = useRef([]);

  // UI
  const [isListening,    setIsListening]  = useState(false);
  const [topbarOpaque,   setTopbarOpaque] = useState(false);
  const [heroFaded,      setHeroFaded]    = useState(false);
  const [sphereChatMode, setSphereChat]   = useState(false);
  const [visibleChunks,  setVisibleChunks] = useState(1);
  const [inputReady,     setInputReady]   = useState(false);

  const inputRef       = useRef(null);
  const bottomRef      = useRef(null);
  const recognitionRef = useRef(null);
  const pageRef        = useRef(null);
  
  // ── DEV shortcut: CMD + SHIFT + K → skip to result
useEffect(() => {

  const handleKey = (e) => {

    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {

      const dummyAnswers = QUESTIONS.map(q => ({
        question: q,
        answer: "Testantwort"
      }));

      runAnalysis(dummyAnswers);

    }

  };

  window.addEventListener("keydown", handleKey);

  return () => window.removeEventListener("keydown", handleKey);

}, []);

  const SR = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const hasSpeech = !!SR;

  // Auto-start
  useEffect(() => {
    const t = setTimeout(() => beginTransition(), 2500);
    return () => clearTimeout(t);
  }, []);

  const beginTransition = () => {
    setHeroFaded(true);
    setTimeout(() => {
      setSphereChat(true);
      setTopbarOpaque(true);
      setPhase("chat");
      startIntroSequence();
    }, 1800);
  };

  const startIntroSequence = () => {
    let i = 0;
    const revealNext = () => {
      i++;
      setVisibleChunks(i);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
      if (i < INTRO_CHUNKS.length) {
        setTimeout(revealNext, 1000);
      } else {
        setTimeout(() => {
          setInputReady(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }, 600);
      }
    };
    setTimeout(revealNext, 300);
  };

  // ── Backend call ────────────────────────────────────────────────────────────
  const callBackend = async (messages) => {
    const res = await fetch("https://clarity-backend-production-108.up.railway.app/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json();
    console.log("Backend response:", data);
    return data.reply || data.message || null;
  };

  // ── Analysis: send all 12 answers at once ───────────────────────────────────
  const runAnalysis = async (answers) => {
    setInputReady(false);
    setAnalysing(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    try {
      const reply = await callBackend([
        { role: "system", content: ANALYSIS_PROMPT },
        { role: "user",   content: JSON.stringify(answers) },
      ]);

      const clean = (reply || "").replace(/```json|```/g, "").trim();
      const s = clean.indexOf("{");
      const e = clean.lastIndexOf("}");

      if (s !== -1 && e !== -1) {
  const parsed = JSON.parse(clean.substring(s, e + 1));

  setTimeout(() => {
    setAnalysing(false);
    setResult(parsed);
    setPhase("result");

    setTimeout(() => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}, 200);

  }, 2000);

} else {
  throw new Error("No JSON in response");
}
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalysing(false);
    }
  };

  // ── User submits an answer ─────────────────────────────────────────────────
  const dispatchAnswer = async (text) => {
    if (!text.trim() || isTyping || analysing) return;

    const questionText = QUESTIONS[currentQIndex];

    // Show user bubble immediately
    setMessages(prev => [...prev, { role: "user", content: text.trim() }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    // Store answer
    const updatedAnswers = [...answersRef.current, { question: questionText, answer: text.trim() }];
    answersRef.current = updatedAnswers;

    const nextIndex = currentQIndex + 1;
    const midInsight = nextIndex === 7 || nextIndex === 9;

    if (nextIndex >= QUESTIONS.length) {
      // All 12 done — analyse
      await runAnalysis(updatedAnswers);
    } else {
// AI reflection + next question
setIsTyping(true);

try {

  const reflection = await callBackend([
    {
      role: "system",
content: `
Du bist ein ruhiger, empathischer Gesprächspartner.

Der Nutzer beantwortet Reflexionsfragen über sein Leben.

Deine Aufgabe:

1. Reagiere kurz auf seine Antwort (maximal 1 Satz).

${midInsight ? `
2. Du bist ungefähr in der Mitte des Gesprächs.
Gib eine kurze Zwischen-Reflexion über das Muster,
das du bisher in seinen Antworten erkennst.
` : ""}

Regeln:
- maximal 1 Satz
- keine Analyse
- keine neue Frage
- ruhig, menschlich
`

    },
    {
  role: "user",
  content: `
Die letzte Antwort des Nutzers:

${text}

Hier ist das bisherige Gespräch:

${answersRef.current
  .map(a => `Frage: ${a.question}\nAntwort: ${a.answer}`)
  .join("\n\n")}

Wenn du ein Muster erkennst zwischen mehreren Antworten,
darfst du es kurz erwähnen.
`
}
  ]);

  setMessages(prev => [
    ...prev,
    { role: "assistant", content: reflection }
  ]);

} catch (err) {
  console.error("Reflection error:", err);
}

setTimeout(() => {

  setMessages(prev => [
    ...prev,
    { role: "assistant", content: QUESTIONS[nextIndex] }
  ]);

  setCurrentQIndex(nextIndex);

  setIsTyping(false);

  setTimeout(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, 80);

}, 900);
    }
  };

  const sendMessage = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    dispatchAnswer(t);
  };

  // ── Voice ──────────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (!hasSpeech) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    const rec = new SR();
    rec.lang = "de-DE"; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = () => setIsListening(false);
    rec.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInput(final || interim);
      if (final) setTimeout(() => inputRef.current?.focus(), 50);
    };
    recognitionRef.current = rec;
    rec.start();
  };

  // Progress derived from answers collected
  const answersCollected = answersRef.current.length;
  const pct = Math.min((answersCollected / 12) * 100, 100);
  const displayQNum = Math.min(answersCollected + 1, 12);
  const showProgress = phase === "chat" || phase === "result";
  const showInput = phase === "chat" && inputReady && !isTyping && !analysing;

  return (
    <>
      <InjectCSS />

      <div id="c-nebula" className={sphereChatMode ? "chat-mode" : ""}>
        <div className="c-blob c-blob-1" />
        <div className="c-blob c-blob-2" />
        <div className="c-blob c-blob-3" />
        <div className="c-blob c-blob-4" />
      </div>

      <div id="c-page" ref={pageRef}>

        {/* Sticky topbar */}
        <div id="c-topbar" className={topbarOpaque ? "opaque" : ""}>
          <div id="c-logo">CLARITY</div>
          <div id="c-progress-track" className={showProgress ? "show" : ""}>
            <div id="c-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div id="c-question-label" className={showProgress ? "show" : ""}>
            Frage {displayQNum} von 12
          </div>
        </div>

        {/* Hero (splash) */}
        <div id="c-hero" className={heroFaded ? "faded" : ""}>
          <div id="c-hero-h1" style={{ fontSize: 56, fontWeight: 700, color: "#000", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.03em", textAlign: "center" }}>
            Ein Gespräch, das dein Leben verändern kann.
          </div>
          <div id="c-hero-sub" style={{ fontSize: 38, color: "#000", marginBottom: 40, lineHeight: 1.5, fontWeight: 400, textAlign: "center" }}>
            Finde in 10 Minuten heraus, was du wirklich willst.
          </div>
          <div style={{ fontSize: 25, color: "rgb(116,123,139)", lineHeight: 1.75, textAlign: "center" }}>
            Die meisten Menschen funktionieren einfach – aber wissen nicht mehr, warum.
          </div>
        </div>

        {/* Chat */}
        {phase === "chat" && (
          <div style={{ paddingTop: 48 }}>
            <div style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.75, marginBottom: 36 }}>
              {INTRO_CHUNKS.slice(0, visibleChunks).map((chunk, i) => (
                <p key={i} className="c-fade-up" style={{ margin: "0 0 24px 0" }}>{chunk}</p>
              ))}
            </div>

            {messages.map((msg, i) => (
              msg.role === "user" ? (
                <div key={i} className="c-user-bubble">
                  <div className="c-user-bubble-inner">{msg.content}</div>
                </div>
              ) : (
                <div key={i} className="c-fade-up" style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.75, marginBottom: 36 }}>
                  {msg.content}
                </div>
              )
            ))}

            {isTyping && <ThinkingDots />}

            {analysing && (
              <div className="c-fade-up" style={{ fontSize: 18, color: "#000", letterSpacing: "0.02em", marginBottom: 32, opacity: 0.65 }}>
                Clarity analysiert deine Antworten…
              </div>
            )}

            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        )}

        {/* Result */}
        {phase === "result" && result && (
          <div style={{ paddingTop: 0 }}>
            <ResultSection result={result} />
            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        )}

      </div>

      {/* Floating input */}
      {showInput && (
        <div id="c-input-bar">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Schreib deine Antwort…"
            rows={1}
          />
          {hasSpeech && (
            <button onClick={toggleVoice}
              style={{ border: "none", background: "none", fontSize: 22, cursor: "pointer", padding: "6px", color: isListening ? "#e33" : "#bbb", transition: "color 0.2s", lineHeight: 1, flexShrink: 0 }}>
              {isListening ? "⏹" : "🎤"}
            </button>
          )}
          <button onClick={sendMessage}
            style={{ border: "none", background: "none", fontSize: 28, cursor: "pointer", color: "#000", padding: "6px 10px", lineHeight: 1, flexShrink: 0 }}>
            →
          </button>
        </div>
      )}
    </>
  );
}
