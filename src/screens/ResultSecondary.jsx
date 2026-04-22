import { useState, useEffect, useRef } from "react";
import ClarityLogo from "../components/ClarityLogo";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INDIGO = "#4361EE";
const INDIGO_A = (a) => `rgba(67,97,238,${a})`;

const HABIT_STACK = {
  Explorer: {
    Körper:    ["20 Min Spaziergang", "15 Min Dehnen", "10 Min Yoga"],
    Geist:     ["Eine Entscheidung aufschreiben", "5 Min Journaling", "3 Optionen auf eine reduzieren"],
    Ernährung: ["Wasser vor dem Kaffee", "Kein Zucker bis mittags", "Bewusst ohne Ablenkung essen"],
  },
  Builder: {
    Körper:    ["15 Min Workout", "20 Min Laufen", "10 Min Mobilität"],
    Geist:     ["Warum-Frage stellen bevor du anfängst", "5 Min Richtung prüfen", "Ein Ziel hinterfragen"],
    Ernährung: ["Protein-Fokus mittags", "Langsam essen", "Wasser vor jeder Mahlzeit"],
  },
  Creator: {
    Körper:    ["20 Min Spaziergang für Ideen", "10 Min Dehnen", "15 Min Laufen"],
    Geist:     ["Etwas zeigen, auch wenn unfertig", "5 Min freies Schreiben", "Eine Idee skizzieren"],
    Ernährung: ["Kein Zucker bis mittags", "Bewusst frühstücken", "Wasser beim Arbeiten"],
  },
  Optimizer: {
    Körper:    ["20 Min Sport", "15 Min Laufen", "10 Min Yoga"],
    Geist:     ["3 Dinge die heute gut liefen", "5 Min ohne Selbstkritik reflektieren", "Eine Stärke notieren"],
    Ernährung: ["Bewusst essen ohne Ablenkung", "Langsam kauen", "Wasser vor dem Essen"],
  },
  Drifter: {
    Körper:    ["15 Min Spaziergang", "10 Min Dehnen", "20 Min Laufen"],
    Geist:     ["Eine Entscheidung für heute treffen", "5 Min Tagesplan", "3 Prioritäten setzen"],
    Ernährung: ["Festes Frühstück zur gleichen Zeit", "Wasser morgens", "Kein Zucker bis mittags"],
  },
};

const KEYFRAMES = `
  @keyframes stepIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes confirmIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes checkPop {
    0%   { transform: scale(0.6); opacity: 0; }
    60%  { transform: scale(1.1); }
    100% { transform: scale(1);   opacity: 1; }
  }
`;

/* Single habit step — selection + micro-commitment */
function HabitStep({ stepNum, cat, options, selectedIdx, onSelect, visible }) {
  const [justSelected, setJustSelected] = useState(false);

  const handleSelect = (i) => {
    if (selectedIdx === i) return;
    onSelect(i);
    setJustSelected(true);
    setTimeout(() => setJustSelected(false), 600);
  };

  if (!visible) return null;

  return (
    <div style={{ animation: "stepIn 350ms cubic-bezier(0.2,0.65,0.3,0.9) forwards", marginBottom: 28 }}>
      {/* Step header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%",
          background: selectedIdx !== null ? INDIGO : "rgba(0,0,0,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 250ms ease",
          flexShrink: 0,
        }}>
          {selectedIdx !== null ? (
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
              style={{ animation: "checkPop 280ms cubic-bezier(0.2,0.65,0.3,0.9) forwards" }}>
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(0,0,0,0.35)" }}>{stepNum}</span>
          )}
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "0.01em" }}>
          {cat}
        </p>
      </div>

      {/* Options */}
      <div style={{
        background: "rgba(255,255,255,0.30)",
        border: "1px solid rgba(0,0,0,0.07)",
        borderRadius: 12, overflow: "hidden",
      }}>
        {options.map((h, i) => {
          const sel = selectedIdx === i;
          const isLast = i === options.length - 1;
          return (
            <button key={i} onClick={() => handleSelect(i)} style={{
              display:       "flex",
              alignItems:    "center",
              gap:            14,
              padding:       "14px 16px",
              background:    sel ? INDIGO_A(0.07) : "transparent",
              border:        "none",
              borderBottom:  isLast ? "none" : "1px solid rgba(0,0,0,0.07)",
              cursor:        "pointer",
              fontFamily:    FF,
              textAlign:     "left",
              width:         "100%",
              transform:     sel && justSelected ? "scale(1.01)" : "scale(1)",
              transition:    "background 200ms ease, transform 200ms ease",
            }}>
              <div style={{
                width:        20, height: 20, borderRadius: "50%", flexShrink: 0,
                border:       `2px solid ${sel ? INDIGO : "rgba(0,0,0,0.20)"}`,
                background:   sel ? INDIGO : "transparent",
                display:      "flex", alignItems: "center", justifyContent: "center",
                transition:   "all 200ms ease",
              }}>
                {sel && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
              </div>
              <span style={{
                fontSize:   15,
                lineHeight: 1.4,
                fontWeight: sel ? 600 : 400,
                color:      sel ? "#0f172a" : "rgba(0,0,0,0.60)",
              }}>
                {h}
              </span>
            </button>
          );
        })}
      </div>

      {/* Micro-commitment confirmation */}
      {selectedIdx !== null && (
        <p style={{
          fontSize:   13,
          fontWeight: 600,
          color:      INDIGO,
          margin:     "14px 0 4px 34px",
          animation:  "confirmIn 300ms ease forwards",
          letterSpacing: "0.01em",
        }}>
          Das machst du ab jetzt. ✓
        </p>
      )}
    </div>
  );
}

export default function ResultSecondary({ safeResult, type, profile, onBack }) {
  const [selected,     setSelected]     = useState({ Körper: null, Geist: null, Ernährung: null });
  const [showPlan,     setShowPlan]     = useState(false); // confirmation block before CTA
  const [upgradeOpen,  setUpgradeOpen]  = useState(false);
  const [paid,         setPaid]         = useState(() => localStorage.getItem(`clarity_paid_${type}`) === "true");
  const [vis,          setVis]          = useState(false);
  const upgradeRef  = useRef(null);
  const planRef     = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = setTimeout(() => setVis(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Show plan confirmation 400ms after all 3 selected
  const allDone = selected.Körper !== null && selected.Geist !== null && selected.Ernährung !== null;

  useEffect(() => {
    if (allDone && !showPlan) {
      const t = setTimeout(() => {
        setShowPlan(true);
        setTimeout(() => planRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 200);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  useEffect(() => {
    if (upgradeOpen && upgradeRef.current) {
      setTimeout(() => upgradeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" }), 180);
    }
  }, [upgradeOpen]);

  const handlePaid = () => {
    localStorage.setItem(`clarity_paid_${type}`, "true");
    setPaid(true);
    setUpgradeOpen(false);
  };

  const fadeUp = (delay = 0) => ({
    opacity:    vis ? 1 : 0,
    transform:  vis ? "translateY(0)" : "translateY(20px)",
    transition: `opacity 420ms cubic-bezier(0.2,0.65,0.3,0.9) ${delay}ms, transform 420ms cubic-bezier(0.2,0.65,0.3,0.9) ${delay}ms`,
  });

  const habits   = HABIT_STACK[type] || HABIT_STACK.Explorer;
  const körperDone = selected.Körper !== null;
  const geistDone  = selected.Geist  !== null;

  return (
    <div style={{
      maxWidth:   430, margin: "0 auto", padding: "0 24px 96px",
      boxSizing:  "border-box", minHeight: "100vh", fontFamily: FF,
      opacity:    vis ? 1 : 0,
      transform:  vis ? "translateY(0)" : "translateY(20px)",
      transition: "opacity 380ms cubic-bezier(0.2,0.65,0.3,0.9) 40ms, transform 380ms cubic-bezier(0.2,0.65,0.3,0.9) 40ms",
    }}>
      <style>{KEYFRAMES}</style>

      {/* HEADER */}
      <div style={{ ...fadeUp(0), display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 44, marginBottom: 40 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FF, fontSize: 13, color: "rgba(0,0,0,0.40)", padding: 0 }}>
          ← Zurück
        </button>
        <ClarityLogo size="sm" centered={false} />
      </div>

      {/* INTRO */}
      <div style={{ ...fadeUp(60), marginBottom: 36 }}>
        <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.1, color: "#0f172a", margin: "0 0 12px" }}>
          Dein 7-Tage System
        </p>
        <p style={{ fontSize: 15, color: "rgba(15,23,42,0.60)", margin: 0, lineHeight: 1.65 }}>
          Wähle eine Gewohnheit pro Bereich. Klein genug, um sie wirklich zu tun.
        </p>
      </div>

      {/* GUIDED STEPS — sequential reveal */}
      <div style={fadeUp(120)}>
        <HabitStep stepNum={1} cat="Körper" options={habits.Körper}
          selectedIdx={selected.Körper}
          onSelect={i => setSelected(s => ({ ...s, Körper: i }))}
          visible={true}
        />
        <HabitStep stepNum={2} cat="Geist" options={habits.Geist}
          selectedIdx={selected.Geist}
          onSelect={i => setSelected(s => ({ ...s, Geist: i }))}
          visible={körperDone}
        />
        <HabitStep stepNum={3} cat="Ernährung" options={habits.Ernährung}
          selectedIdx={selected.Ernährung}
          onSelect={i => setSelected(s => ({ ...s, Ernährung: i }))}
          visible={geistDone}
        />
      </div>

      {/* PLAN CONFIRMATION — appears 400ms after all 3 selected */}
      {showPlan && (
        <div ref={planRef} style={{ animation: "stepIn 380ms cubic-bezier(0.2,0.65,0.3,0.9) forwards", marginBottom: 24 }}>
          <div style={{
            padding:      "20px 18px",
            background:   "rgba(255,255,255,0.50)",
            border:       `1px solid ${INDIGO_A(0.14)}`,
            borderRadius: 14,
            marginBottom: 20,
          }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: "#0f172a", margin: "0 0 6px", lineHeight: 1.4 }}>
              Das ist dein Plan für die nächsten 7 Tage.
            </p>
            <p style={{ fontSize: 14, fontStyle: "italic", color: "rgba(0,0,0,0.42)", margin: "0 0 8px", lineHeight: 1.6 }}>
              Einfach genug, um ihn wirklich durchzuziehen.
            </p>
            <p style={{ fontSize: 14, color: "rgba(0,0,0,0.50)", margin: 0, lineHeight: 1.6 }}>
              {habits.Körper[selected.Körper]} · {habits.Geist[selected.Geist]} · {habits.Ernährung[selected.Ernährung]}
            </p>
          </div>

          {/* Primary CTA */}
          {!paid && (
            <>
              <button onClick={() => setUpgradeOpen(true)} style={{
                width:         "100%",
                padding:       "16px 24px",
                background:    INDIGO,
                color:         "#fff",
                border:        "none",
                borderRadius:  13,
                fontSize:      16,
                fontWeight:    700,
                cursor:        "pointer",
                fontFamily:    FF,
                letterSpacing: "-0.01em",
                marginBottom:  10,
                WebkitTapHighlightColor: "transparent",
              }}>
                Ich starte jetzt →
              </button>
              <p style={{ textAlign: "center", fontSize: 13, color: "rgba(0,0,0,0.38)", margin: 0 }}>
                Trag dir das ein — damit es nicht im Kopf bleibt.
              </p>
            </>
          )}
        </div>
      )}

      {/* UPGRADE BLOCK */}
      {upgradeOpen && !paid && (
        <div ref={upgradeRef} style={{ animation: "stepIn 380ms cubic-bezier(0.2,0.65,0.3,0.9) forwards", marginBottom: 28 }}>
          <div style={{
            padding:    "22px 20px",
            background: "rgba(255,255,255,0.65)",
            borderRadius: 14,
            boxShadow:  `0 0 0 1px ${INDIGO_A(0.18)}, 0 4px 24px ${INDIGO_A(0.12)}`,
          }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: INDIGO, margin: "0 0 4px" }}>
              Das funktioniert — wenn du dran bleibst.
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 18 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>4,99€</span>
              <span style={{ fontSize: 13, color: "rgba(0,0,0,0.40)" }}>einmalig · 7 Tage Klarheit</span>
            </div>
            <div style={{ marginBottom: 22 }}>
              {[
                "Dein 7-Tage Habit Stack als Kalender-Download",
                "7 Levels Deep — das KI-Tool das immer tiefer geht",
                "Tägliche Check-In-Fragen passend zu deinem Typ",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontSize: 14, color: INDIGO, flexShrink: 0, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 14, color: "rgba(0,0,0,0.70)", lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <button onClick={handlePaid} style={{
                flex: 1, padding: "13px 8px", background: "#000", color: "#fff",
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple Pay
              </button>
              <button onClick={handlePaid} style={{
                flex: 1, padding: "13px 8px", background: "rgba(255,255,255,0.90)", color: "#0f172a",
                border: "1px solid rgba(0,0,0,0.10)", borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google Pay
              </button>
            </div>
            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(0,0,0,0.50)", margin: 0, fontWeight: 500 }}>
              Kein Account. Keine E-Mail. Sofort-Zugang.
            </p>
          </div>
        </div>
      )}

      {/* POST-PAYMENT */}
      {paid && (
        <div style={{ marginBottom: 28, padding: "20px", background: "rgba(255,255,255,0.65)", borderRadius: 14, animation: "stepIn 400ms ease forwards", boxShadow: `0 0 0 1px ${INDIGO_A(0.12)}, 0 4px 16px rgba(0,0,0,0.06)` }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 4px" }}>Geschafft. Jetzt beginnt es.</p>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.55)", margin: "0 0 18px", lineHeight: 1.6 }}>
            Dein Plan ist gesetzt. Ab heute.
          </p>
          <button style={{
            width: "100%", padding: "13px", marginBottom: 10,
            background: INDIGO, color: "#fff", border: "none",
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FF,
          }}>
            Kalender-Datei herunterladen (.ics)
          </button>
          <button style={{
            width: "100%", padding: "13px",
            background: "transparent", color: INDIGO,
            border: `1px solid ${INDIGO_A(0.30)}`, borderRadius: 10,
            fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FF,
          }}>
            7 Levels Deep starten →
          </button>
        </div>
      )}


    </div>
  );
}
