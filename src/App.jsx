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

// ── Intro sequence ─────────────────────────────────────────────────────────────
const INTRO_CHUNKS = [
  "Bevor wir anfangen eine kurze Frage.",
  "Weißt du gerade wirklich was du in deinem Leben willst?",
  "Viele Menschen funktionieren einfach aber haben ihre Richtung aus den Augen verloren.",
  "Ich stelle dir ein paar kurze Fragen. Es dauert etwa 10 Minuten. Lass uns mit etwas Einfachem anfangen.",
  QUESTIONS[0],
];

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

// ── Global CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #f2f4f8; }
  body { display: flex; justify-content: center; min-height: 100vh; }
  #root { width: 100%; display: flex; justify-content: center; align-items: flex-start; }

  /* ── Layer 1: AI Nebula background ───────────────────────────────────────── */
  #c-nebula {
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background: linear-gradient(145deg, #f8f9fb 0%, #f2f4f8 45%, #edf1f6 100%);
    overflow: hidden;
    transition: opacity 2.5s ease;
  }
  /* Splash: full vivid nebula bleeds around the glass panel */
  /* Chat:   dims so content reads clearly                   */
  #c-nebula.chat-mode { opacity: 0.28; }

  /* Thinking: each blob accelerates independently + expands */
  #c-nebula.thinking .c-blob   { transform: scale(1.1) !important; }
  #c-nebula.thinking .c-blob-1 { animation-duration: 22s !important; opacity: 0.9; }
  #c-nebula.thinking .c-blob-2 { animation-duration: 18s !important; opacity: 0.8; }
  #c-nebula.thinking .c-blob-3 { animation-duration: 20s !important; opacity: 0.75; }
  #c-nebula.thinking .c-blob-4 { animation-duration: 26s !important; opacity: 0.70; }

  /* ── Gradient strips — AI awakening on splash ─────────────────────────────
     6 diagonal light waves, large blur, clearly visible, slow sweep          */
  #c-strips {
    position: fixed; inset: 0; z-index: 1;
    overflow: hidden; pointer-events: none;
    opacity: 1; transition: opacity 2s ease;
  }
  #c-strips.fade-out { opacity: 0; }

  .c-strip {
    position: absolute;
    width: 220%;
    left: -60%;
    will-change: transform;
  }
  /* Strip 1 — steel blue, upper band */
  .c-strip-1 {
    top: 8%; height: 180px;
    filter: blur(90px); opacity: 0.75;
    background: linear-gradient(90deg, transparent 0%, #7aa2ff 20%, #9fd3ff 50%, #c7d7ff 80%, transparent 100%);
    animation: stripMove1 28s ease-in-out infinite;
  }
  /* Strip 2 — periwinkle / sky, mid upper */
  .c-strip-2 {
    top: 28%; height: 140px;
    filter: blur(80px); opacity: 0.65;
    background: linear-gradient(90deg, transparent 0%, #a6c8ff 20%, #7aa2ff 55%, #c7d7ff 85%, transparent 100%);
    animation: stripMove2 36s ease-in-out infinite;
  }
  /* Strip 3 — sky blue, center */
  .c-strip-3 {
    top: 48%; height: 200px;
    filter: blur(120px); opacity: 0.80;
    background: linear-gradient(90deg, transparent 0%, #9fd3ff 15%, #a6c8ff 50%, #9fd3ff 85%, transparent 100%);
    animation: stripMove3 22s ease-in-out infinite;
  }
  /* Strip 4 — ice blue, lower mid */
  .c-strip-4 {
    top: 62%; height: 130px;
    filter: blur(100px); opacity: 0.60;
    background: linear-gradient(90deg, transparent 0%, #c7d7ff 25%, #9fd3ff 60%, #7aa2ff 90%, transparent 100%);
    animation: stripMove4 32s ease-in-out infinite;
  }
  /* Strip 5 — soft blue, lower */
  .c-strip-5 {
    top: 78%; height: 160px;
    filter: blur(110px); opacity: 0.70;
    background: linear-gradient(90deg, transparent 0%, #7aa2ff 20%, #a6c8ff 50%, #9fd3ff 80%, transparent 100%);
    animation: stripMove5 26s ease-in-out infinite;
  }
  /* Strip 6 — wide full-bleed glow, very bottom */
  .c-strip-6 {
    top: 88%; height: 240px;
    filter: blur(140px); opacity: 0.55;
    background: linear-gradient(90deg, #c7d7ff 0%, #7aa2ff 30%, #9fd3ff 60%, #a6c8ff 100%);
    animation: stripMove6 40s ease-in-out infinite;
  }

  @keyframes stripMove1 {
    0%   { transform: translateX(-25%) rotate(-3deg); }
    50%  { transform: translateX(15%)  rotate(-2deg); }
    100% { transform: translateX(-25%) rotate(-3deg); }
  }
  @keyframes stripMove2 {
    0%   { transform: translateX(20%)  rotate(4deg); }
    50%  { transform: translateX(-18%) rotate(3deg); }
    100% { transform: translateX(20%)  rotate(4deg); }
  }
  @keyframes stripMove3 {
    0%   { transform: translateX(-10%) rotate(-2deg); }
    50%  { transform: translateX(22%)  rotate(-1deg); }
    100% { transform: translateX(-10%) rotate(-2deg); }
  }
  @keyframes stripMove4 {
    0%   { transform: translateX(15%)  rotate(5deg); }
    50%  { transform: translateX(-20%) rotate(4deg); }
    100% { transform: translateX(15%)  rotate(5deg); }
  }
  @keyframes stripMove5 {
    0%   { transform: translateX(-18%) rotate(-3deg); }
    50%  { transform: translateX(12%)  rotate(-2deg); }
    100% { transform: translateX(-18%) rotate(-3deg); }
  }
  @keyframes stripMove6 {
    0%   { transform: translateX(10%)  rotate(2deg); }
    50%  { transform: translateX(-15%) rotate(1deg); }
    100% { transform: translateX(10%)  rotate(2deg); }
  }

  /* ── Atmosphere layer — deep background glow, z-index 0 ────────────────────
     Very large, very slow, very soft — creates AI depth beneath the blobs      */
  #c-atmosphere {
    position: fixed; inset: 0; z-index: 0;
    pointer-events: none; overflow: hidden;
  }
  .c-atmo {
    position: absolute; border-radius: 50%;
    will-change: transform;
  }
  /* Atmo 1 — dominant blue field, upper-left anchor */
  .c-atmo-1 {
    width: 140vw; height: 140vw;
    top: -20%; left: -20%;
    filter: blur(120px);
    opacity: 0.22;
    background: radial-gradient(circle at 50% 50%,
      rgba(122, 162, 255, 0.60) 0%,
      rgba(122, 162, 255, 0.20) 50%,
      transparent 72%
    );
    animation: floatAtmo1 130s linear infinite;
  }
  /* Atmo 2 — lighter blue, lower-right counterpoint */
  .c-atmo-2 {
    width: 120vw; height: 120vw;
    top: 40%; left: 30%;
    filter: blur(110px);
    opacity: 0.18;
    background: radial-gradient(circle at 50% 50%,
      rgba(159, 211, 255, 0.55) 0%,
      rgba(159, 211, 255, 0.15) 50%,
      transparent 72%
    );
    animation: floatAtmo2 150s linear infinite;
  }
  @keyframes floatAtmo1 {
    0%   { transform: translate(0vw, 0vh)    rotate(0deg);   }
    25%  { transform: translate(10vw, 8vh)   rotate(2deg);   }
    50%  { transform: translate(18vw, -4vh)  rotate(0deg);   }
    75%  { transform: translate(8vw, 12vh)   rotate(-2deg);  }
    100% { transform: translate(0vw, 0vh)    rotate(0deg);   }
  }
  @keyframes floatAtmo2 {
    0%   { transform: translate(0vw, 0vh)    rotate(0deg);   }
    33%  { transform: translate(-12vw, -8vh) rotate(-3deg);  }
    66%  { transform: translate(-6vw, 10vh)  rotate(-1deg);  }
    100% { transform: translate(0vw, 0vh)    rotate(0deg);   }
  }

  /* ── Motion blobs — z-index 1, visible movement ──────────────────────────── */
  .c-blob {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
    transition: opacity 1.6s ease;
  }

  /* A — primary blue, 120vw, slow horizontal drift + scale breathing */
  .c-blob-1 {
    width: 120vw; height: 120vw;
    top: -15%; left: -20%;
    filter: blur(110px);
    background: radial-gradient(circle at 50% 50%,
      rgba(122, 162, 255, 0.48) 0%,
      rgba(122, 162, 255, 0.14) 42%,
      transparent 68%
    );
    animation: nebulaFloat1 80s ease-in-out infinite;
  }

  /* B — sky blue, 90vw, full circular orbit */
  .c-blob-2 {
    width: 90vw; height: 90vw;
    top: 15%; left: 55%;
    filter: blur(90px);
    background: radial-gradient(circle at 50% 50%,
      rgba(159, 211, 255, 0.50) 0%,
      rgba(159, 211, 255, 0.13) 44%,
      transparent 68%
    );
    animation: nebulaFloat2 62s ease-in-out infinite;
  }

  /* C — steel blue, 85vw, vertical breathing drift */
  .c-blob-3 {
    width: 85vw; height: 85vw;
    top: 52%; left: 5%;
    filter: blur(100px);
    background: radial-gradient(circle at 50% 50%,
      rgba(166, 200, 255, 0.45) 0%,
      rgba(166, 200, 255, 0.12) 46%,
      transparent 68%
    );
    animation: nebulaFloat3 98s ease-in-out infinite;
  }

  /* D — ice blue, 78vw, slow diagonal rotation + horizontal glide */
  .c-blob-4 {
    width: 78vw; height: 78vw;
    top: 25%; left: 48%;
    filter: blur(95px);
    background: radial-gradient(circle at 50% 50%,
      rgba(199, 215, 255, 0.50) 0%,
      rgba(199, 215, 255, 0.13) 48%,
      transparent 68%
    );
    animation: nebulaFloat4 112s ease-in-out infinite;
  }

  /* A: slow horizontal drift right→left + gentle scale breathing               */
  @keyframes nebulaFloat1 {
    0%   { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
    18%  { transform: translate(28vw, -6vh)   scale(1.05) rotate(2deg);  }
    36%  { transform: translate(52vw,  8vh)   scale(0.97) rotate(4deg);  }
    55%  { transform: translate(42vw, 42vh)   scale(1.04) rotate(2deg);  }
    73%  { transform: translate(12vw, 52vh)   scale(0.97) rotate(-1deg); }
    88%  { transform: translate(-8vw, 28vh)   scale(1.02) rotate(-3deg); }
    100% { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
  }

  /* B: large full circular orbit — sweeps the whole right half of screen       */
  @keyframes nebulaFloat2 {
    0%   { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
    16%  { transform: translate(-18vw, 22vh)  scale(1.06) rotate(-3deg); }
    33%  { transform: translate(-38vw, 48vh)  scale(0.94) rotate(-6deg); }
    50%  { transform: translate(-28vw, 68vh)  scale(1.03) rotate(-4deg); }
    66%  { transform: translate(-5vw,  55vh)  scale(0.97) rotate(-1deg); }
    83%  { transform: translate(14vw,  28vh)  scale(1.04) rotate(2deg);  }
    100% { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
  }

  /* C: vertical breathing — rises from bottom, climbs toward top, returns      */
  @keyframes nebulaFloat3 {
    0%   { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
    22%  { transform: translate(22vw, -28vh)  scale(1.06) rotate(3deg);  }
    44%  { transform: translate(48vw, -18vh)  scale(0.95) rotate(5deg);  }
    66%  { transform: translate(38vw,  18vh)  scale(1.04) rotate(3deg);  }
    84%  { transform: translate(15vw,  10vh)  scale(0.98) rotate(1deg);  }
    100% { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
  }

  /* D: slow diagonal glide + rotation — upper-right to lower-left arc          */
  @keyframes nebulaFloat4 {
    0%   { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
    20%  { transform: translate(-24vw,-18vh)  scale(1.05) rotate(-3deg); }
    42%  { transform: translate(-44vw,  8vh)  scale(0.96) rotate(-6deg); }
    64%  { transform: translate(-32vw, 32vh)  scale(1.06) rotate(-4deg); }
    84%  { transform: translate(-12vw, 20vh)  scale(0.98) rotate(-2deg); }
    100% { transform: translate(0vw,   0vh)   scale(1)    rotate(0deg);  }
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Fixed glass shell — Apple Liquid Glass ─────────────────────────────── */
  #c-shell {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 720px; max-width: 92vw;
    height: 86vh;
    z-index: 10;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    background: rgba(255, 255, 255, 0.28);
    backdrop-filter: blur(70px); -webkit-backdrop-filter: blur(70px);
    border-radius: 32px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    box-shadow:
      0 60px 160px rgba(0, 0, 0, 0.22),
      0 12px 40px  rgba(0, 0, 0, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.9),
      inset 0 -1px 0 rgba(255, 255, 255, 0.25);
    overflow: hidden;
    /* ambient light highlight driven by JS mouse tracking */
    --lx: 50%; --ly: 50%;
  }

  /* Glass edge refraction — VisionOS-style rim light, masked to edges only */
  #c-shell::before {
    content: "";
    position: absolute; inset: 0;
    border-radius: 32px;
    pointer-events: none;
    z-index: 3;
    background: linear-gradient(
      180deg,
      rgba(255,255,255,0.65) 0%,
      rgba(255,255,255,0.15) 100%
    );
    mask-image: radial-gradient(circle at center, transparent 65%, black 100%);
    -webkit-mask-image: radial-gradient(circle at center, transparent 65%, black 100%);
  }

  /* Glass refraction — two radial highlights simulate light bending */
  #c-shell::after {
    content: "";
    position: absolute; inset: 0;
    border-radius: 32px;
    pointer-events: none;
    z-index: 2;
    background:
      radial-gradient(1200px 400px at -20% -10%, rgba(255,255,255,0.55), transparent 60%),
      radial-gradient(800px 300px at 120% 120%,  rgba(255,255,255,0.20), transparent 60%),
      radial-gradient(600px 400px at var(--lx) var(--ly), rgba(255,255,255,0.16), transparent 55%);
    mix-blend-mode: overlay;
    transition: background 0.08s ease;
  }

  /* Focus glow — radial behind the glass panel, pulses when input active */
  #c-focus-glow {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 720px; max-width: 92vw;
    height: 86vh;
    z-index: 9;
    pointer-events: none;
    border-radius: 48px;
    background: radial-gradient(600px circle at center, rgba(122,162,255,0.22), transparent 70%);
    opacity: 0;
    transition: opacity 0.6s ease;
    will-change: opacity;
  }
  #c-focus-glow.active { animation: focusPulse 3s ease-in-out infinite; }
  @keyframes focusPulse {
    0%, 100% { opacity: 0;    }
    50%       { opacity: 0.35; }
  }

  /* Breathing keyframe — used when isTyping/analysing */
  @keyframes nebulaBreath {
    0%, 100% { transform: scale(1);    opacity: 0.35; }
    50%       { transform: scale(1.05); opacity: 0.42; }
  }
  #c-nebula.breathing { animation: nebulaBreath 6s ease-in-out infinite; }

  /* ── Layer 4: Scrollable content inside shell ───────────────────────────── */
  #c-scroll {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    overflow-y: auto;
    padding: 140px 40px 200px;
    -webkit-overflow-scrolling: touch;
  }
  #c-scroll::-webkit-scrollbar { display: none; }
  #c-scroll { scrollbar-width: none; }

  /* ── Topbar — absolute inside shell, gradient fade ──────────────────────── */
  #c-topbar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 110px;
    z-index: 20;
    background: linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0));
    padding: 22px 40px 0;
    border-radius: 32px 32px 0 0;
    pointer-events: none;
    transition: background 0.5s ease;
  }
  #c-topbar.opaque {
    background: linear-gradient(rgba(255,255,255,0.75), rgba(255,255,255,0));
  }
  #c-logo {
    font-size: 11px; letter-spacing: 0.35em; color: #666;
    text-align: center; margin-bottom: 14px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    pointer-events: none;
  }
  #c-progress-track {
    width: 100%; height: 3px;
    background: rgba(0,0,0,0.08);
    overflow: hidden; opacity: 0; transition: opacity 0.6s ease;
    border-radius: 2px;
  }
  #c-progress-track.show { opacity: 1; }
  #c-progress-fill {
    height: 3px; background: rgba(0,0,0,0.55); width: 0%;
    transition: width 400ms ease; border-radius: 2px;
  }
  #c-question-label {
    font-size: 10px; letter-spacing: 0.15em; color: #000;
    text-transform: uppercase; opacity: 0; padding: 10px 0 0; transition: opacity 0.6s ease;
  }
  #c-question-label.show { opacity: 0.4; }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  #c-hero {
    text-align: center; padding: 56px 0 64px; opacity: 1; max-height: 800px;
    overflow: hidden; transition: opacity 1.2s ease, max-height 1.2s ease, padding 1.2s ease;
  }
  #c-hero.faded { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; pointer-events: none; }

  /* ── Input bar ───────────────────────────────────────────────────────────── */
  #c-input-bar {
    position: absolute;
    bottom: 24px; left: 40px; right: 40px;
    background: rgba(255, 255, 255, 0.74);
    backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
    box-shadow:
      0 10px 40px rgba(0, 0, 0, 0.12),
      0 2px 8px  rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.65);
    border-radius: 22px;
    padding: 10px 10px 10px 22px;
    display: flex; align-items: center; gap: 8px; z-index: 30;
  }
  #c-input-bar textarea {
    flex: 1; border: none; outline: none; font-size: 18px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #111; background: transparent; resize: none;
    line-height: 1.55; max-height: 140px; overflow-y: auto;
    padding: 6px 0; align-self: flex-end;
  }
  #c-input-bar textarea::placeholder { color: rgba(0,0,0,0.28); }

  /* ── Circular icon buttons ────────────────────────────────────────────────── */
  .c-btn-circle {
    width: 42px; height: 42px;
    min-width: 42px;
    border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.09);
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: transform 0.16s ease, background 0.16s ease, box-shadow 0.16s ease;
    will-change: transform;
    padding: 0;
  }
  .c-btn-circle:hover {
    transform: scale(1.08);
    background: rgba(255,255,255,0.98);
    box-shadow: 0 4px 14px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,1);
  }
  .c-btn-circle:active { transform: scale(0.93); }

  /* Mic: grey → red when listening */
  .c-btn-mic { color: #aaa; }
  .c-btn-mic:hover { color: #777; }
  .c-btn-mic.listening {
    background: rgba(255,50,50,0.10);
    border-color: rgba(255,50,50,0.22);
    color: #e33;
  }

  /* Send: dark pill */
  .c-btn-send {
    background: rgba(14,14,14,0.90);
    border-color: transparent;
    color: #fff;
  }
  .c-btn-send:hover {
    background: rgba(0,0,0,1);
    transform: scale(1.08);
  }

  /* ── Chat bubbles ────────────────────────────────────────────────────────── */
  .c-fade-up { animation: fadeUp 0.6s ease forwards; opacity: 0; }
  .c-user-bubble { display: flex; justify-content: flex-end; margin-bottom: 28px; }
  .c-user-bubble-inner {
    background: rgba(255, 255, 255, 0.65);
    border: 1px solid rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    border-radius: 18px 18px 4px 18px;
    padding: 14px 18px; max-width: 80%; font-size: 18px; color: #111; line-height: 1.6;
  }

  /* ── Responsive — mobile-first premium layout ───────────────────────────── */
  @media (max-width: 600px) {
    #c-shell {
      height: 92vh;
      border-radius: 22px;
      backdrop-filter: blur(50px); -webkit-backdrop-filter: blur(50px);
    }
    #c-shell::before { border-radius: 22px; }
    #c-shell::after  { border-radius: 22px; }
    #c-scroll { padding: 120px 20px 220px; }
    #c-topbar { padding: 18px 20px 0; border-radius: 22px 22px 0 0; }
    #c-input-bar {
      left: 12px; right: 12px; bottom: 14px;
      border-radius: 16px;
      padding: 8px 8px 8px 16px;
      gap: 6px;
    }
    #c-input-bar textarea { font-size: 16px; }
    .c-btn-circle { width: 36px; height: 36px; min-width: 36px; }
    #c-hero-h1 { font-size: 34px !important; }
    #c-hero-sub { font-size: 22px !important; }
    #c-focus-glow { height: 92vh; border-radius: 36px; }
  }
`;

// ── Helper components ──────────────────────────────────────────────────────────
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

function SplashDot({ index }) {
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
}

function ThinkingDots() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep((s) => (s + 1) % 4), 500);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 13, color: "#000", letterSpacing: "0.06em", marginBottom: 10 }}>
        Clarity denkt
      </div>
      <div style={{ display: "flex", gap: 7 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              color: "#000",
              opacity: step > i ? 1 : 0.15,
              transition: "opacity 0.3s",
            }}
          >
            ●
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Share helpers ──────────────────────────────────────────────────────────────

/**
 * Generates a shareable slug-style profile URL from the result.
 * Format: /p/{mode}-{modeConfidence}-clarity{score}-energy{score}
 * Example: /p/explorer-82-clarity17-energy14
 */
function generateProfileLink(result) {
  try {
    const mode = Array.isArray(result.identityModes) && result.identityModes[0];
    const modeSlug  = mode
      ? `${mode.type.toLowerCase().replace(/\s+/g, "-")}-${mode.confidence}`
      : "profile";
    const clarity = result.scores?.Clarity ?? 0;
    const energy  = result.scores?.Energy  ?? 0;
    const path = `/p/${modeSlug}-clarity${clarity}-energy${energy}`;
    const base = window.location.hostname.includes("localhost")
      ? "http://localhost:5173"
      : "https://cla-ri-ty.netlify.app";
    return base + path;
  } catch (_) {
    return window.location.origin + "/p/profile";
  }
}

// ── Share card — rendered off-screen, exported via html-to-image ──────────────
function ClarityShareCard({ result, cardRef }) {
  const BAR_MAX = 25;

  return (
    <div
      ref={cardRef}
      style={{
        width: 480,
        background: "#fff",
        borderRadius: 24,
        padding: "48px 44px 40px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        boxShadow: "0 4px 40px rgba(0,0,0,0.08)",
        color: "#000",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.35em", textTransform: "uppercase", opacity: 0.45, marginBottom: 18 }}>
          CLARITY PROFILE
        </div>
        {result.summary && (
          <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.5, color: "#000" }}>
            {result.summary}
          </div>
        )}
      </div>

      {/* Identity modes */}
      {Array.isArray(result.identityModes) && result.identityModes.length > 0 && (
        <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid #f0f0f0" }}>
          {result.identityModes.map((mode, i) => (
            <div key={mode.type} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: i < result.identityModes.length - 1 ? 6 : 0 }}>
              <div style={{ fontSize: i === 0 ? 28 : 17, fontWeight: i === 0 ? 700 : 500, letterSpacing: "-0.01em" }}>
                {mode.type}
              </div>
              <div style={{ fontSize: 11, opacity: 0.35, letterSpacing: "0.06em" }}>
                {mode.confidence}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Score bars */}
      {result.scores && (
        <div style={{ marginBottom: 32, paddingBottom: 28, borderBottom: "1px solid #f0f0f0" }}>
          {Object.entries(result.scores).map(([label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.08em", opacity: 0.5, width: 68, flexShrink: 0 }}>
                {label}
              </div>
              <div style={{ flex: 1, height: 2, background: "#ebebeb" }}>
                <div style={{ height: 2, background: "#000", width: `${(value / BAR_MAX) * 100}%` }} />
              </div>
              <div style={{ fontSize: 10, opacity: 0.4, width: 22, textAlign: "right", flexShrink: 0 }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pattern */}
      {result.pattern && (
        <div style={{ fontSize: 13, lineHeight: 1.65, opacity: 0.65, marginBottom: 32 }}>
          {result.pattern}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 600, opacity: 0.75 }}>
          clarity.ai
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.04em", opacity: 0.38 }}>
          Generated with Clarity AI
        </div>
      </div>
    </div>
  );
}

function ResultSection({ result }) {
  const [vis, setVis]               = useState(false);
  const [barsOn, setBarsOn]         = useState(false);
  const [hover, setHover]           = useState(false);
  const [hoverImg, setHoverImg]     = useState(false);
  const [hoverLink, setHoverLink]   = useState(false);
  const [hoverNative, setHoverNative] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generating, setGenerating] = useState(false);

  const cardRef = useRef(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVis(true), 60);
    const t2 = setTimeout(() => setBarsOn(true), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // ── Copy profile link to clipboard ────────────────────────────────────────
  const copyProfileLink = async () => {
    const link = generateProfileLink(result);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (_) {}
  };

  // ── Native share — URL + summary text ─────────────────────────────────────
  const nativeShare = async () => {
    const profileLink = generateProfileLink(result);
    const shareData = {
      title: "Mein Clarity Profil",
      text: result.summary || "Mein persönliches Klarheitsprofil von Clarity.",
      url: profileLink,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); }
      catch (e) { /* user cancelled */ }
    } else {
      // Fallback: copy link
      try {
        await navigator.clipboard.writeText(profileLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      } catch (_) {}
    }
  };

  // ── Generate & share/download PNG card ─────────────────────────────────────
  const generateShareImage = async () => {
    if (!cardRef.current || generating) return;
    setGenerating(true);
    try {
      const { toPng: _toPng } = await import("html-to-image");
      const dataUrl = await _toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        style: { borderRadius: "24px" },
      });

      // Try native share with file (mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], "clarity-profile.png", { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ title: "Mein Clarity Profil", files: [file] });
            setGenerating(false);
            return;
          }
        } catch (e) { /* fall through to download */ }
      }

      // Fallback: trigger download
      const a = document.createElement("a");
      a.download = "clarity-profile.png";
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("Share card generation failed:", err);
      // Fallback: copy profile link instead of plain text
      const profileLink = generateProfileLink(result);
      try {
        await navigator.clipboard.writeText(profileLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
      } catch (_) {}
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(20px)",
        transition: "opacity 600ms ease, transform 600ms ease",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.6, marginBottom: 48 }}>
        Hier ist, was ich in deinen Antworten erkenne.
      </div>

      {/* Summary — one-sentence situational overview */}
      {result.summary && (
        <div style={{ fontSize: 20, fontWeight: 500, color: "#000", lineHeight: 1.55, marginBottom: 12 }}>
          {result.summary}
        </div>
      )}

      {/* Confidence label */}
      {result.confidence != null && (
        <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#000", opacity: 0.4, textTransform: "uppercase", marginBottom: 36 }}>
          Analysequalität: {result.confidence}%
        </div>
      )}

      {/* Identity modes */}
      {Array.isArray(result.identityModes) && result.identityModes.length > 0 && (
        <div style={{ marginBottom: 44 }}>
          <div style={{ fontSize: 10, letterSpacing: "0.3em", color: "#000", opacity: 0.4, textTransform: "uppercase", marginBottom: 14 }}>
            Du befindest dich gerade in
          </div>
          {result.identityModes.map((mode) => (
            <div key={mode.type} style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
              <div style={{ fontSize: 22, fontWeight: 600, color: "#000", letterSpacing: "-0.01em" }}>
                {mode.type}
              </div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#000", opacity: 0.38 }}>
                {mode.confidence}%
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 40, opacity: 0.8 }}>
        {result.pattern}
      </div>

      <div style={{ fontSize: 14, letterSpacing: "0.3em", color: "#000", marginBottom: 36, textTransform: "uppercase", opacity: 0.45 }}>
        Dein Klarheitsprofil
      </div>

      <div style={{ marginBottom: 60 }}>
        {Object.entries(result.scores).map(([label, value]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 16 }}>
            <div style={{ fontSize: 12, letterSpacing: "0.08em", color: "#000", width: 80, flexShrink: 0 }}>
              {label}
            </div>
            <div style={{ flex: 1, height: 3, background: "#ddd", overflow: "hidden" }}>
              <div
                style={{
                  height: 3,
                  background: "#000",
                  width: barsOn ? `${value}%` : "0%",
                  transition: "width 1s ease",
                }}
              />
            </div>
            <div style={{ fontSize: 12, color: "#000", width: 28, textAlign: "right", flexShrink: 0 }}>
              {value}
            </div>
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
            <div style={{ fontSize: 10, letterSpacing: "0.22em", color: "#000", marginBottom: 16, textTransform: "uppercase" }}>
              {title}
            </div>
            {items?.map((s, i) => (
              <div key={i} style={{ fontSize: 14, color: "#000", lineHeight: 1.8 }}>— {s}</div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #ddd", paddingTop: 44, marginBottom: 60, textAlign: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.25em", color: "#000", marginBottom: 18, textTransform: "uppercase" }}>
          Deine Aufgabe für heute
        </div>
        <div style={{ fontSize: 20, fontWeight: 400, color: "#000", lineHeight: 1.55 }}>
          {result.suggestedAction}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 80 }}>
        {/* CTA */}
        <button
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            border: "1px solid #000",
            background: hover ? "#000" : "transparent",
            color: hover ? "#fff" : "#000",
            fontFamily: "inherit",
            fontSize: 13,
            letterSpacing: "0.2em",
            padding: "18px 36px",
            cursor: "pointer",
            transition: "background 200ms, color 200ms",
          }}
        >
          Clarity System starten – kostenlos
        </button>

        {/* 1 — Profil als Bild teilen */}
        <button
          onClick={generateShareImage}
          onMouseEnter={() => setHoverImg(true)}
          onMouseLeave={() => setHoverImg(false)}
          disabled={generating}
          style={{
            border: "1px solid #000",
            background: hoverImg ? "#000" : "#fff",
            color: hoverImg ? "#fff" : "#000",
            fontFamily: "inherit",
            fontSize: 13,
            letterSpacing: "0.2em",
            padding: "18px 36px",
            cursor: generating ? "wait" : "pointer",
            transition: "background 200ms, color 200ms",
            opacity: generating ? 0.6 : 1,
          }}
        >
          {generating ? "Wird erstellt…" : "Profil als Bild teilen"}
        </button>

        {/* 2 — Profil-Link kopieren */}
        <button
          onClick={copyProfileLink}
          onMouseEnter={() => setHoverLink(true)}
          onMouseLeave={() => setHoverLink(false)}
          style={{
            border: "1px solid #000",
            background: hoverLink ? "#000" : "#fff",
            color: hoverLink ? "#fff" : "#000",
            fontFamily: "inherit",
            fontSize: 13,
            letterSpacing: "0.2em",
            padding: "18px 36px",
            cursor: "pointer",
            transition: "background 200ms, color 200ms",
          }}
        >
          {copiedLink ? "✓ Link kopiert" : "Profil-Link kopieren"}
        </button>

        {/* 3 — Profil teilen (native share / link fallback) */}
        <button
          onClick={nativeShare}
          onMouseEnter={() => setHoverNative(true)}
          onMouseLeave={() => setHoverNative(false)}
          style={{
            border: "1px solid #000",
            background: hoverNative ? "#000" : "#fff",
            color: hoverNative ? "#fff" : "#000",
            fontFamily: "inherit",
            fontSize: 13,
            letterSpacing: "0.2em",
            padding: "18px 36px",
            cursor: "pointer",
            transition: "background 200ms, color 200ms",
          }}
        >
          Profil teilen
        </button>
      </div>

      {/* Hidden share card — rendered off-screen for html-to-image export */}
      <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none" }}>
        <ClarityShareCard result={result} cardRef={cardRef} />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
function Clarity() {
  const [phase,          setPhase]        = useState("splash");
  const [messages,       setMessages]     = useState([]);
  const [input,          setInput]        = useState("");
  const [isTyping,       setIsTyping]     = useState(false);
  const [result,         setResult]       = useState(null);
  const [analysing,      setAnalysing]    = useState(false);

  // Frontend controls which question we're on (0-indexed)
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Collected answers: [{ question, answer }]
  const answersRef = useRef([]);

  // Lightweight keyword frequency map — tracks repeated themes across answers
  const signalsRef = useRef({ keywords: {} });

  // UI state
  const [isListening,    setIsListening]  = useState(false);
  const [topbarOpaque,   setTopbarOpaque] = useState(false);
  const [heroFaded,      setHeroFaded]    = useState(false);
  const [sphereChatMode, setSphereChat]   = useState(false);
  const [visibleChunks,  setVisibleChunks] = useState(1);
  const [inputReady,     setInputReady]   = useState(false);
  const [inputFocused,   setInputFocused] = useState(false);

  const inputRef       = useRef(null);
  const bottomRef      = useRef(null);
  const recognitionRef = useRef(null);
  const pageRef        = useRef(null);
  const rafRef         = useRef(null);
  const mouseRef       = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 });

  const SR = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const hasSpeech = !!SR;

  // ── DEV shortcut: CMD/CTRL + SHIFT + K → skip to analysis ─────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "k") {
        const dummyAnswers = QUESTIONS.map((q) => ({ question: q, answer: "Testantwort" }));
        runAnalysis(dummyAnswers);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // ── Auto-start ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => beginTransition(), 5200);
    return () => clearTimeout(t);
  }, []);

  // ── Parallax depth + ambient glass light ────────────────────────────────────
  useEffect(() => {
    const atmo   = document.getElementById("c-atmosphere");
    const nebula = document.getElementById("c-nebula");
    const shell  = document.getElementById("c-shell");

    // Smooth mouse tracking
    const onMouse = (e) => {
      mouseRef.current.tx = e.clientX / window.innerWidth;
      mouseRef.current.ty = e.clientY / window.innerHeight;
    };
    window.addEventListener("mousemove", onMouse, { passive: true });

    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tick = () => {
      const m = mouseRef.current;
      // Smooth interpolation toward target
      m.x += (m.tx - m.x) * 0.06;
      m.y += (m.ty - m.y) * 0.06;

      // Parallax: atmosphere moves slowest, nebula slightly faster
      const atmoY  = Math.min(scrollY * 0.02, 20);
      const nebY   = Math.min(scrollY * 0.05, 40);

      if (atmo)   atmo.style.transform   = `translateY(${atmoY.toFixed(2)}px)`;
      if (nebula) nebula.style.transform = `translateY(${nebY.toFixed(2)}px)`;

      // Ambient glass light — move radial highlight with mouse
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
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const beginTransition = () => {
    setHeroFaded(true);
    document.getElementById("c-strips")?.classList.add("fade-out");
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

  // ── Backend call ───────────────────────────────────────────────────────────
  // ── Shared fetch helper — 25s AbortController timeout ───────────────────────
  const fetchWithTimeout = async (url, body, timeoutMs = 25000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify(body),
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  };

  // ── Reflection endpoint ────────────────────────────────────────────────────
  const callBackend = async (messages) => {
    const data = await fetchWithTimeout(
      "https://clarity-backend-production-108.up.railway.app/api/chat",
      { messages }
    );
    console.log("Backend response:", data);
    return data.reply || data.message || null;
  };

  // ── Analysis endpoint — /api/analyze returns guaranteed JSON ──────────────
  const callAnalysisBackend = async (messages) => {
    const data = await fetchWithTimeout(
      "https://clarity-backend-production-108.up.railway.app/api/analyze",
      { messages }
    );
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
      setTimeout(() => { const sc = document.getElementById("c-scroll"); if (sc) sc.scrollTo({ top: 0, behavior: "smooth" }); }, 200);
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
  const dispatchAnswer = async (text) => {
    if (!text.trim() || isTyping || analysing) return;

    const trimmed      = text.trim();
    const questionText = QUESTIONS[currentQIndex];

    // Show user bubble immediately
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    // Store answer
    const updatedAnswers = [...answersRef.current, { question: questionText, answer: trimmed }];
    answersRef.current   = updatedAnswers;

    // Update signal memory — increment frequency counts for keywords in this answer
    const words = extractKeywords(trimmed);
    words.forEach((word) => {
      signalsRef.current.keywords[word] = (signalsRef.current.keywords[word] || 0) + 1;
    });

    const nextIndex  = currentQIndex + 1;

    // All 12 answered — run final analysis
    if (nextIndex >= QUESTIONS.length) {
      await runAnalysis(updatedAnswers);
      return;
    }

    // Mid-conversation pattern insight at questions 8 and 10 (nextIndex 7 and 9)
    const midInsight = nextIndex === 7 || nextIndex === 10;

    setIsTyping(true);

    try {
      const topSignals = getTopSignals(signalsRef.current.keywords);

      const userContent = topSignals.length > 0
        ? `Aktuelle Antwort: ${trimmed}\n\nWIEDERKEHRENDE THEMEN: ${topSignals.join(", ")}\n\nBisheriges Gespräch:\n\n${formatAnswersAsContext(updatedAnswers)}`
        : `Aktuelle Antwort: ${trimmed}\n\nBisheriges Gespräch:\n\n${formatAnswersAsContext(updatedAnswers)}`;

      const reflection = await callBackend([
        {
          role: "system",
          content: buildReflectionSystemPrompt(midInsight, topSignals),
        },
        {
          role: "user",
          content: userContent,
        },
      ]);

      if (reflection) {
        // Thinking pause — typing indicator stays visible before reflection appears
        await delay(700);
        const reflectionMsg = midInsight
          ? { role: "assistant", type: "reflection", content: reflection }
          : { role: "assistant", content: reflection };
        setMessages((prev) => [...prev, reflectionMsg]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
        // Reading pause — give the user time to read before the next question appears
        await delay(1200);
      }
    } catch (err) {
      console.error("Reflection error:", err);
      // Show error in chat, then continue to next question
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Clarity hatte gerade ein Problem. Versuche es bitte noch einmal.",
        },
      ]);
    }

    // Show next question
    setMessages((prev) => [...prev, { role: "assistant", isQuestion: true, content: QUESTIONS[nextIndex] }]);
    setCurrentQIndex(nextIndex);
    setIsTyping(false);

    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }, 80);
  };

  const sendMessage = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    dispatchAnswer(t);
  };

  // ── Voice input ────────────────────────────────────────────────────────────
  const toggleVoice = () => {
    if (!hasSpeech) return;
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const rec = new SR();
    rec.lang            = "de-DE";
    rec.interimResults  = true;
    rec.maxAlternatives = 1;
    rec.onstart  = () => setIsListening(true);
    rec.onend    = () => setIsListening(false);
    rec.onerror  = () => setIsListening(false);
    rec.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final  += e.results[i][0].transcript;
        else                       interim += e.results[i][0].transcript;
      }
      setInput(final || interim);
      if (final) setTimeout(() => inputRef.current?.focus(), 50);
    };
    recognitionRef.current = rec;
    rec.start();
  };

  // ── Derived UI values ──────────────────────────────────────────────────────
  const answersCollected = answersRef.current.length;
  const pct              = Math.min((answersCollected / 12) * 100, 100);
  const displayQNum      = Math.min(answersCollected + 1, 12);
  const showProgress     = phase === "chat" || phase === "result";
  const showInput        = phase === "chat" && inputReady && !isTyping && !analysing;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <InjectCSS />

      <div id="c-strips">
        <div className="c-strip c-strip-1" />
        <div className="c-strip c-strip-2" />
        <div className="c-strip c-strip-3" />
        <div className="c-strip c-strip-4" />
        <div className="c-strip c-strip-5" />
        <div className="c-strip c-strip-6" />
      </div>

      <div id="c-atmosphere">
        <div className="c-atmo c-atmo-1" />
        <div className="c-atmo c-atmo-2" />
      </div>

      <div id="c-nebula" className={[sphereChatMode ? "chat-mode" : "", (isTyping || analysing) ? "thinking breathing" : ""].filter(Boolean).join(" ")}>
        <div className="c-blob c-blob-1" />
        <div className="c-blob c-blob-2" />
        <div className="c-blob c-blob-3" />
        <div className="c-blob c-blob-4" />
      </div>

      <div
        id="c-focus-glow"
        className={(inputFocused || isTyping || analysing) ? "active" : ""}
      />

      <div id="c-shell" ref={pageRef}>

        {/* Topbar — absolute inside glass shell */}
        <div id="c-topbar" className={topbarOpaque ? "opaque" : ""}>
          <div id="c-logo">CLARITY</div>
          <div id="c-progress-track" className={showProgress ? "show" : ""}>
            <div id="c-progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div id="c-question-label" className={showProgress ? "show" : ""}>
            Frage {displayQNum} von 12
          </div>
        </div>

        {/* Scrollable content layer */}
        <div id="c-scroll">

          {/* Hero (splash) */}
          <div id="c-hero" className={heroFaded ? "faded" : ""}>
            <div
              id="c-hero-h1"
              style={{
                fontSize: 56,
                fontWeight: 700,
                color: "#000",
                lineHeight: 1.15,
                marginBottom: 20,
                letterSpacing: "-0.03em",
                textAlign: "center",
              }}
            >
              Ein Gespräch, das dein Leben verändern kann.
            </div>
            <div
              id="c-hero-sub"
              style={{
                fontSize: 38,
                color: "#000",
                marginBottom: 40,
                lineHeight: 1.5,
                fontWeight: 400,
                textAlign: "center",
              }}
            >
              Finde in 10 Minuten heraus, was du wirklich willst.
            </div>
            <div style={{ fontSize: 25, color: "rgb(116,123,139)", lineHeight: 1.75, textAlign: "center" }}>
              Die meisten Menschen funktionieren einfach – aber wissen nicht mehr, warum.
            </div>
            {/* Splash loading indicator */}
            {phase === "splash" && !heroFaded && (
              <div style={{ marginTop: 52, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", opacity: 0.55, color: "#555", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  Clarity macht sich bereit
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  {[0, 1, 2].map((i) => (
                    <SplashDot key={i} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat */}
          {phase === "chat" && (
            <div style={{ paddingTop: 48 }}>
              <div style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.75, marginBottom: 36 }}>
                {INTRO_CHUNKS.slice(0, visibleChunks).map((chunk, i) => (
                  <p key={i} className="c-fade-up" style={{ margin: "0 0 24px 0" }}>
                    {chunk}
                  </p>
                ))}
              </div>

              {messages.map((msg, i) =>
                msg.role === "user" ? (
                  <div key={i} className="c-user-bubble">
                    <div className="c-user-bubble-inner">{msg.content}</div>
                  </div>
                ) : msg.type === "reflection" ? (
                  // Mid-insight block — visually distinguished
                  <div
                    key={i}
                    className="c-fade-up"
                    style={{ marginTop: 8, marginBottom: 40, paddingLeft: 16, borderLeft: "2px solid #bbb" }}
                  >
                    <div style={{ fontSize: 10, letterSpacing: "0.2em", color: "#999", textTransform: "uppercase", marginBottom: 8 }}>
                      Beobachtung
                    </div>
                    <div style={{ fontSize: 17, fontStyle: "italic", color: "#444", lineHeight: 1.7, fontWeight: 400 }}>
                      {msg.content}
                    </div>
                  </div>
                ) : msg.isQuestion ? (
                  // Next question — full visual weight
                  <div
                    key={i}
                    className="c-fade-up"
                    style={{ fontSize: 22, fontWeight: 400, color: "#000", lineHeight: 1.75, marginBottom: 36 }}
                  >
                    {msg.content}
                  </div>
                ) : (
                  // Normal reflection — lighter, smaller
                  <div
                    key={i}
                    className="c-fade-up"
                    style={{ fontSize: 20, fontWeight: 400, color: "#000", opacity: 0.85, lineHeight: 1.7, marginBottom: 36 }}
                  >
                    {msg.content}
                  </div>
                )
              )}

              {isTyping && <ThinkingDots />}

              {analysing && (
                <div
                  className="c-fade-up"
                  style={{ fontSize: 18, color: "#000", letterSpacing: "0.02em", marginBottom: 32, opacity: 0.65 }}
                >
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

        </div>{/* /#c-scroll */}

        {/* Input bar — absolute at bottom of glass shell */}
        {showInput && (
          <div id="c-input-bar">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
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
                  /* stop square */
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="3" width="10" height="10" rx="2"/>
                  </svg>
                ) : (
                  /* mic icon */
                  <svg width="16" height="18" viewBox="0 0 16 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="1" width="6" height="10" rx="3"/>
                    <path d="M2 8a6 6 0 0 0 12 0"/>
                    <line x1="8" y1="14" x2="8" y2="17"/>
                    <line x1="5" y1="17" x2="11" y2="17"/>
                  </svg>
                )}
              </button>
            )}
            <button
              onClick={sendMessage}
              className="c-btn-circle c-btn-send"
              aria-label="Senden"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="13" x2="8" y2="3"/>
                <polyline points="4,7 8,3 12,7"/>
              </svg>
            </button>
          </div>
        )}

      </div>{/* /#c-shell */}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC PROFILE PAGE — rendered when path starts with /p/
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Parses a profile slug like "explorer-82-clarity17-energy14"
 * into structured data.
 */
function parseProfileSlug(slug) {
  try {
    const clarityMatch = slug.match(/clarity(\d+)/i);
    const energyMatch  = slug.match(/energy(\d+)/i);
    const clarityScore = clarityMatch ? parseInt(clarityMatch[1], 10) : null;
    const energyScore  = energyMatch  ? parseInt(energyMatch[1],  10) : null;

    // Everything before "clarityXX" holds the mode slug + confidence
    // e.g. "explorer-82-"  or "stability-seeker-76-"
    const scoresIndex = slug.search(/clarity\d+/i);
    const modeSection = slug.substring(0, scoresIndex).replace(/-$/, "");
    const lastDash    = modeSection.lastIndexOf("-");
    const rawType     = modeSection.substring(0, lastDash);
    const confidence  = parseInt(modeSection.substring(lastDash + 1), 10);

    // "stability-seeker" → "Stability Seeker"
    const modeType = rawType
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return { modeType, confidence: isNaN(confidence) ? null : confidence, clarityScore, energyScore };
  } catch (_) {
    return { modeType: "Explorer", confidence: null, clarityScore: null, energyScore: null };
  }
}

function ClarityPublicProfile({ slug }) {
  const { modeType, confidence, clarityScore, energyScore } = parseProfileSlug(slug);
  const BAR_MAX  = 25;
  const OG_IMAGE = "https://cla-ri-ty.netlify.app/og-default.png";
  const [barsOn, setBarsOn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsOn(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Full meta-tag suite for OG + Twitter share previews
  useEffect(() => {
    const title = `Clarity Profil – ${modeType}`;
    const desc  = "Ein kurzer AI-Dialog zeigt dir, was dir wirklich wichtig ist.";
    document.title = title;

    const setMeta = (attr, name, content) => {
      let el = document.querySelector(`meta[${attr}="${name}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };
    setMeta("name",     "description",         desc);
    setMeta("property", "og:type",             "website");
    setMeta("property", "og:title",            title);
    setMeta("property", "og:description",      desc);
    setMeta("property", "og:image",            OG_IMAGE);
    setMeta("property", "og:url",              window.location.href);
    setMeta("name",     "twitter:card",        "summary_large_image");
    setMeta("name",     "twitter:title",       title);
    setMeta("name",     "twitter:description", desc);
    setMeta("name",     "twitter:image",       OG_IMAGE);
  }, [modeType]);

  const scores = [
    clarityScore != null && { label: "Clarity", value: clarityScore },
    energyScore  != null && { label: "Energy",  value: energyScore  },
  ].filter(Boolean);

  // Part 1: spec-exact layout styles
  const pageStyle = {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(145deg,#f8f9fb 0%,#f2f4f8 45%,#edf1f6 100%)",
    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  };

  const columnStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: 640,
    padding: "60px 30px",
  };

  return (
    <div style={pageStyle}>
      <div style={columnStyle}>

        {/* Wordmark */}
        <div style={{
          fontSize: 11,
          letterSpacing: "0.38em",
          textTransform: "uppercase",
          color: "#000",
          opacity: 0.32,
          marginBottom: 48,
        }}>
          Clarity
        </div>

        {/* Profile card — maxWidth 520, centered */}
        <div style={{
          width: "100%",
          maxWidth: 520,
          background: "#fff",
          borderRadius: 24,
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 32px 100px rgba(0,0,0,0.10), 0 4px 20px rgba(0,0,0,0.05)",
          padding: "48px 44px 40px",
          marginBottom: 32,
        }}>

          {/* Label */}
          <div style={{
            fontSize: 9,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "#000",
            opacity: 0.35,
            marginBottom: 32,
          }}>
            Clarity Profil
          </div>

          {/* Identity mode */}
          <div style={{ marginBottom: scores.length ? 36 : 40 }}>
            <div style={{
              fontSize: 40,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "#000",
              lineHeight: 1.05,
              marginBottom: 10,
            }}>
              {modeType}
            </div>
            {confidence != null && (
              <div style={{ fontSize: 12, letterSpacing: "0.12em", color: "#000", opacity: 0.38 }}>
                {confidence}% Übereinstimmung
              </div>
            )}
          </div>

          {/* Score bars */}
          {scores.length > 0 && (
            <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 28 }}>
              {scores.map(({ label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "#000", opacity: 0.45, width: 68, flexShrink: 0 }}>
                    {label}
                  </div>
                  <div style={{ flex: 1, height: 2, background: "#ebebeb" }}>
                    <div style={{
                      height: 2,
                      background: "#000",
                      width: barsOn ? `${Math.min((value / BAR_MAX) * 100, 100)}%` : "0%",
                      transition: "width 1s ease",
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#000", opacity: 0.38, width: 22, textAlign: "right", flexShrink: 0 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Card footer */}
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600, color: "#000", opacity: 0.6 }}>
              clarity.ai
            </div>
            <div style={{ fontSize: 10, color: "#000", opacity: 0.32 }}>
              Finde heraus, was du wirklich willst.
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => { window.location.href = "/"; }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#222"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#000"; }}
          style={{
            border: "none",
            background: "#000",
            color: "#fff",
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 13,
            letterSpacing: "0.18em",
            padding: "18px 36px",
            borderRadius: 3,
            cursor: "pointer",
            transition: "background 200ms",
          }}
        >
          Dein eigenes Klarheitsprofil erstellen
        </button>

      </div>
    </div>
  );
}

// ── Route-aware app entry point ────────────────────────────────────────────────
// Renders the public profile page for /p/* URLs, the main chat app for everything else.
export default function App() {
  const pathname = window.location.pathname;
  if (pathname.startsWith("/p/")) {
    const slug = pathname.slice(3); // strip "/p/"
    return <ClarityPublicProfile slug={slug} />;
  }
  return <Clarity />;
}
