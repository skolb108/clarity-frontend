import { useState, useEffect, useRef } from "react";

const SYSTEM_PROMPT = `Du bist CLARITY.
Ein ruhiger digitaler Mentor, der Menschen hilft, mehr Klarheit über ihr Leben zu gewinnen.
Deine Zielgruppe sind urbane Professionals.
Stil: ruhig klar präzise ermutigend keine langen Texte

REGELN
* Stelle immer nur EINE Frage gleichzeitig.
* Warte auf die Antwort des Nutzers bevor du die nächste Frage stellst.
* Stelle die Fragen exakt in der angegebenen Reihenfolge.
* Antworte kurz (maximal 2–3 Sätze).
* Jede Antwort endet mit genau einer Frage solange das Gespräch läuft.
* Stelle niemals mehrere Fragen gleichzeitig.
* Analysiere nur Informationen die der Nutzer wirklich gesagt hat.
* Erfinde keine Informationen über den Nutzer.

FRAGEN
1 Was beschäftigt dich gerade am meisten in deinem Leben?
2 Was läuft gut in deinem Leben – und was fühlt sich nicht richtig an?
3 Wann fühlst du dich lebendig oder inspiriert?
4 Welche Dinge geben dir Energie?
5 Welche Dinge ziehen dir Energie?
6 Worin bist du besonders gut?
7 Wofür kommen andere Menschen zu dir wenn sie Hilfe brauchen?
8 Wenn du in drei Jahren zurückblickst was müsste passiert sein damit du zufrieden bist?
9 Gibt es etwas das du schon lange tun möchtest?
10 Was hält dich bisher davon ab?
11 Warum ist dir das trotzdem wichtig?
12 Wenn du heute eine kleine Sache verändern würdest welche wäre das?

ABSCHLUSS
Schreibe exakt dieses Format wenn das Gespräch beendet ist:

CONVERSATION_COMPLETE
{ "scores":{ "Clarity":number, "Energy":number, "Strength":number, "Direction":number, "Action":number }, "strengths":[...], "energySources":[...], "nextFocus":"...", "suggestedAction":"..." }

Die Score Werte müssen zwischen 4 und 25 liegen. Nicht in 5er-Schritten.`;

const INTRO_CHUNKS = [
  "Bevor wir anfangen eine kurze Frage.",
  "Weißt du gerade wirklich was du in deinem Leben willst?",
  "Viele Menschen funktionieren einfach aber haben ihre Richtung aus den Augen verloren.",
  "Ich stelle dir ein paar kurze Fragen. Es dauert etwa 10 Minuten. Lass uns mit etwas Einfachem anfangen.",
  "Was beschäftigt dich gerade am meisten in deinem Leben?",
];

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f0ede8; }

  body {
    display: flex;
    justify-content: center;
  }
  #root {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  /* Framer-style drifting color nebula */
  #c-nebula {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: #f0ede8;
    overflow: hidden;
    transition: opacity 2s ease;
  }
  #c-nebula.chat-mode { opacity: 0.35; }

  .c-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(90px);
  }
  .c-blob-1 {
    width: 55vw; height: 55vw;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(160,150,255,0.70) 0%, transparent 60%);
    animation: blobDrift1 14s ease-in-out infinite;
  }
  .c-blob-2 {
    width: 42vw; height: 42vw;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(100,180,255,0.65) 0%, transparent 60%);
    animation: blobDrift2 18s ease-in-out infinite;
  }
  .c-blob-3 {
    width: 38vw; height: 38vw;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(255,150,190,0.50) 0%, transparent 60%);
    animation: blobDrift3 16s ease-in-out infinite;
  }
  .c-blob-4 {
    width: 30vw; height: 30vw;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(100,220,195,0.45) 0%, transparent 60%);
    animation: blobDrift4 20s ease-in-out infinite;
  }

  @keyframes blobDrift1 {
    0%,100% { transform: translate(-50%, -50%) scale(1);    }
    33%      { transform: translate(-44%, -56%) scale(1.05); }
    66%      { transform: translate(-56%, -44%) scale(0.96); }
  }
  @keyframes blobDrift2 {
    0%,100% { transform: translate(-50%, -50%) scale(1);    }
    40%      { transform: translate(-57%, -44%) scale(1.06); }
    70%      { transform: translate(-43%, -55%) scale(0.95); }
  }
  @keyframes blobDrift3 {
    0%,100% { transform: translate(-50%, -50%) scale(1);    }
    33%      { transform: translate(-43%, -43%) scale(1.08); }
    66%      { transform: translate(-57%, -57%) scale(0.94); }
  }
  @keyframes blobDrift4 {
    0%,100% { transform: translate(-50%, -50%) scale(1);    }
    50%      { transform: translate(-44%, -58%) scale(1.10); }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* The single centered column — full height scrollable */
  #c-page {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 680px;
    min-height: 100vh;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    padding: 0 40px 180px;
  }

  /* Sticky top bar (logo + progress + question indicator) */
  #c-topbar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: transparent;
    padding: 22px 0 0;
    transition: background 0.5s ease, backdrop-filter 0.5s ease;
  }
  #c-topbar.opaque {
    background: rgba(240, 237, 232, 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  #c-logo {
    font-size: 11px;
    letter-spacing: 0.35em;
    color: #888;
    text-align: center;
    margin-bottom: 14px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }
  #c-progress-track {
    width: 100%;
    height: 4px;
    background: #e0e0e0;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.6s ease;
  }
  #c-progress-track.show { opacity: 1; }
  #c-progress-fill {
    height: 4px;
    background: #000;
    width: 0%;
    transition: width 400ms ease;
  }
  #c-question-label {
    font-size: 10px;
    letter-spacing: 0.15em;
    color: #000;
    text-transform: uppercase;
    opacity: 0;
    padding: 10px 0 14px;
    transition: opacity 0.6s ease;
  }
  #c-question-label.show { opacity: 0.5; }

  #c-hero {
    text-align: center;
    padding: 56px 0 64px;
    opacity: 1;
    max-height: 800px;
    overflow: hidden;
    transition: opacity 1.2s ease, max-height 1.2s ease, padding 1.2s ease;
  }
  #c-hero.faded {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    pointer-events: none;
  }

  /* Sticky floating input bar */
  #c-input-bar {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: calc(100% - 80px);
    max-width: 640px;
    background: rgba(248,245,240,0.94);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 28px rgba(0,0,0,0.10), 0 1px 6px rgba(0,0,0,0.07);
    border-radius: 16px;
    margin-bottom: 24px;
    padding: 14px 18px 14px 20px;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    z-index: 200;
  }
  #c-input-bar textarea {
    flex: 1;
    border: none;
    outline: none;
    font-size: 18px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #000;
    background: transparent;
    resize: none;
    line-height: 1.55;
    max-height: 140px;
    overflow-y: auto;
    padding: 2px 0;
  }
  #c-input-bar textarea::placeholder { color: #bbb; }

  .c-fade-up {
    animation: fadeUp 0.6s ease forwards;
    opacity: 0;
  }
  .c-user-bubble {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 28px;
  }
  .c-user-bubble-inner {
    background: #f0f0f0;
    border-radius: 18px 18px 4px 18px;
    padding: 14px 18px;
    max-width: 80%;
    font-size: 18px;
    color: #000;
    line-height: 1.6;
  }

  @media (max-width: 600px) {
    #c-input-bar {
      width: calc(100% - 32px);
      margin-bottom: 16px;
      border-radius: 14px;
    }
    #c-input-bar textarea { font-size: 16px; }
    #c-page { padding: 0 20px 100px; }
    #c-hero-h1 { font-size: 36px !important; }
    #c-hero-sub { font-size: 24px !important; }
  }
`;

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
  const [vis, setVis]           = useState(false);
  const [barsOn, setBarsOn]     = useState(false);
  const [hover, setHover]       = useState(false);
  const [hoverShare, setHoverShare] = useState(false);
  const [copied, setCopied]     = useState(false);

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
      try {
        await navigator.share({ title: "Mein Clarity Profil", text });
      } catch (e) { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch (e) {
        // final fallback
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    }
  };

  return (
    <div style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(20px)", transition: "opacity 600ms ease, transform 600ms ease" }}>
      <div style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.6, marginBottom: 48 }}>
        Hier ist, was ich in deinen Antworten erkenne.
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

      {/* CTA buttons */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 80 }}>
        <button
          onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
          style={{ border: "1px solid #000", background: hover ? "#000" : "transparent", color: hover ? "#fff" : "#000", fontFamily: "inherit", fontSize: 13, letterSpacing: "0.2em", padding: "18px 36px", cursor: "pointer", transition: "background 200ms, color 200ms" }}>
          Clarity System starten – kostenlos
        </button>
        <button
          onClick={handleShare}
          onMouseEnter={() => setHoverShare(true)} onMouseLeave={() => setHoverShare(false)}
          style={{ border: "1px solid #000", background: hoverShare ? "#000" : "#fff", color: hoverShare ? "#fff" : "#000", fontFamily: "inherit", fontSize: 13, letterSpacing: "0.2em", padding: "18px 36px", cursor: "pointer", transition: "background 200ms, color 200ms" }}>
          {copied ? "✓ Kopiert" : "Profil teilen"}
        </button>
      </div>
    </div>
  );
}

export default function Clarity() {
  // phase: "splash" → "transitioning" → "chat" → "result"
  const [phase,         setPhase]         = useState("splash");
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState("");
  const [isTyping,      setIsTyping]      = useState(false);
  const [result,        setResult]        = useState(null);
  const [questionCount, setQuestionCount] = useState(1);
  const [apiKey,        setApiKey]        = useState("");
  const [showKeyInput,  setShowKeyInput]  = useState(false);
  const [isListening,   setIsListening]   = useState(false);
  const [analysing,     setAnalysing]     = useState(false);
  const [topbarOpaque,  setTopbarOpaque]  = useState(false);
  const [heroFaded,     setHeroFaded]     = useState(false);
  const [sphereChatMode,setSphereChat]    = useState(false);
  const [visibleChunks, setVisibleChunks] = useState(1);
  const [inputReady,    setInputReady]    = useState(false);
  const [storedKey,     setStoredKey]     = useState(null);

  const inputRef       = useRef(null);
  const bottomRef      = useRef(null);
  const historyRef     = useRef([]);
  const recognitionRef = useRef(null);
  const pageRef        = useRef(null);

  const SR = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const hasSpeech = !!SR;

  // Start automatisch nach kurzer Zeit
useEffect(() => {
  const t = setTimeout(() => {
    beginTransition();
  }, 2500);

  return () => clearTimeout(t);
}, []);

  // beginTransition: fade hero + nebula out, then start chat
  const beginTransition = () => {
    setHeroFaded(true);
    setTimeout(() => {
      setSphereChat(true);
      setTopbarOpaque(true);
      setPhase("chat");
      startIntroSequence();
    }, 1800);
  };

  // Reveal intro chunks one by one, scroll to each
  const startIntroSequence = () => {
    historyRef.current = [{ role: "assistant", content: INTRO_CHUNKS.join(" ") }];
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

  const saveKey = () => {
    localStorage.setItem("clarity_api_key", apiKey);
    setShowKeyInput(false);
    beginTransition(apiKey);
  };

  const callOpenAI = async (history) => {

  const res = await fetch("https://clarity-backend-production-108.up.railway.app/api/chat", {

    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      messages: history
    })

  });

  const data = await res.json();

console.log("Backend response:", data);

return data.reply || data.message || null;
};

const dispatchMessage = async (text) => {
  if (!text || isTyping) return;

  const userMsg = { role: "user", content: text };

  const hist = [...historyRef.current, userMsg];
  historyRef.current = hist;

  setMessages(prev => [...prev, userMsg]);
  setIsTyping(true);

  setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

  const reply = await callOpenAI(hist);

  setIsTyping(false);

  if (!reply) return;

  // Conversation finished → parse result
  if (reply.includes("CONVERSATION_COMPLETE")) {
    const s = reply.indexOf("{");
    const e = reply.lastIndexOf("}");

    if (s !== -1 && e !== -1) {
      try {
        const p = JSON.parse(reply.substring(s, e + 1));

        setAnalysing(true);

        setTimeout(() => {
          setAnalysing(false);
          setResult(p);
          setPhase("result");
        }, 2000);

        return;

      } catch (err) {
        console.error("JSON parse error:", err);
      }
    }
  }

  // Normal assistant reply
  const am = { role: "assistant", content: reply };

  historyRef.current = [...hist, am];

  setMessages(prev => [...prev, am]);

  // Progress jetzt korrekt erhöhen
  setQuestionCount(p => Math.min(p + 1, 12));

  setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
};

  const sendMessage = () => { const t = input.trim(); setInput(""); dispatchMessage(t); };
  const handleKey   = (e) => { if (e.key === "Enter") sendMessage(); };

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

  const pct = Math.min((questionCount / 12) * 100, 100);
  const showProgress = phase === "chat" || phase === "result";

  return (
    <>
      <InjectCSS />

      {/* Drifting color nebula — always present */}
      <div id="c-nebula" className={sphereChatMode ? "chat-mode" : ""}>
        <div className="c-blob c-blob-1" />
        <div className="c-blob c-blob-2" />
        <div className="c-blob c-blob-3" />
        <div className="c-blob c-blob-4" />
      </div>

      {/* Centered page column */}
      <div id="c-page" ref={pageRef}>

        {/* ── Sticky top bar ── */}
        <div id="c-topbar" className={topbarOpaque ? "opaque" : ""}>
          <div id="c-logo">CLARITY</div>
          <div id="c-progress-track" className={showProgress ? "show" : ""}>
            <div id="c-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div id="c-question-label" className={showProgress ? "show" : ""}>
            Frage {questionCount} von 12
          </div>
        </div>

        {/* ── HERO (splash + transitioning) ── */}
        <div id="c-hero" className={heroFaded ? "faded" : ""}>
          <div id="c-hero-h1" style={{ fontSize: 56, fontWeight: 700, color: "#000", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.03em", textAlign: "center" }}>
            Ein Gespräch, das dein Leben verändern kann.
          </div>
          <div id="c-hero-sub" style={{ fontSize: 38, color: "#000", marginBottom: 40, lineHeight: 1.5, fontWeight: 400, textAlign: "center" }}>
            Finde in 10 Minuten heraus, was du wirklich willst.
          </div>
          <div style={{ fontSize: 25, color: "rgb(116, 123, 139)", lineHeight: 1.75, textAlign: "center" }}>
            Die meisten Menschen funktionieren einfach – aber wissen nicht mehr, warum.
          </div>
        </div>

        {/* ── CHAT ── */}
        {phase === "chat" && (
          <div style={{ paddingTop: 48 }}>

            {/* Intro chunks revealed one by one */}
            <div style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.75, marginBottom: 36 }}>
              {INTRO_CHUNKS.slice(0, visibleChunks).map((chunk, i) => (
                <p key={i} className="c-fade-up" style={{ margin: "0 0 24px 0" }}>{chunk}</p>
              ))}
            </div>

            {/* Conversation messages after intro */}
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

        {/* ── RESULT ── */}
        {phase === "result" && result && (
          <div style={{ paddingTop: 8 }}>
            <ResultSection result={result} />
            <div ref={bottomRef} style={{ height: 1 }} />
          </div>
        )}

      </div>

      {/* Floating input bar — fixed at bottom */}
      {phase === "chat" && inputReady && !isTyping && (
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
