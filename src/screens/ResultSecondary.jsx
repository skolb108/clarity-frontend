import { useState, useEffect } from "react";
import ClarityLogo from "../components/ClarityLogo";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

// Daily prompts for the Reflexion card — rotates daily
const DAILY_PROMPTS = [
  "Wo hast du dich selbst ausgebremst?",
  "Was weißt du gerade, das du noch nicht zugegeben hast?",
  "Was hat dir heute Energie gegeben — und warum?",
  "Was würdest du morgen anders machen, wenn du ehrlich bist?",
  "Welche Entscheidung schiebst du gerade vor dir her?",
];

function toYMD(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background:    "rgba(255,255,255,0.72)",
      borderRadius:  16,
      padding:       "20px 18px",
      marginBottom:  12,
      border:        "1px solid rgba(0,0,0,0.06)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardLabel({ children }) {
  return (
    <p style={{
      fontSize:      10,
      fontWeight:    700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color:         "rgba(100,116,139,0.80)",
      margin:        "0 0 14px",
    }}>
      {children}
    </p>
  );
}

export default function ResultSecondary({ safeResult, type, profile, onBack }) {
  const [vis,      setVis]      = useState(false);
  const [habit,    setHabit]    = useState("workout");
  const [time,     setTime]     = useState("evening");
  const [saved,    setSaved]    = useState(false);
  const [streak,   setStreak]   = useState(0);
  const [reflected, setReflected] = useState(false);

  // Daily prompt
  const [prompt] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("clarity_daily_prompt") || "{}");
      if (stored.date === toYMD(new Date()) && stored.text) return stored.text;
      const next = DAILY_PROMPTS[Math.floor(Math.random() * DAILY_PROMPTS.length)];
      localStorage.setItem("clarity_daily_prompt", JSON.stringify({ date: toYMD(new Date()), text: next }));
      return next;
    } catch { return DAILY_PROMPTS[0]; }
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const t = setTimeout(() => setVis(true), 40);
    // Load saved habit state
    try {
      const h = localStorage.getItem("clarity_habit");
      if (h) { const p = JSON.parse(h); setHabit(p.habit || "workout"); setTime(p.time || "evening"); }
      const s = JSON.parse(localStorage.getItem("clarity_streak") || "{}");
      setStreak(s.count || 0);
      setReflected(localStorage.getItem("clarity_reflected_today") === toYMD(new Date()));
    } catch {}
    return () => clearTimeout(t);
  }, []);

  const handleSaveHabit = () => {
    try {
      localStorage.setItem("clarity_habit", JSON.stringify({ habit, time }));
      const today = toYMD(new Date());
      const yesterday = toYMD(new Date(Date.now() - 86400000));
      const prev = JSON.parse(localStorage.getItem("clarity_streak") || "{}");
      const last = localStorage.getItem("clarity_last_action") || "";
      const newCount = (last === yesterday) ? (prev.count || 0) + 1 : 1;
      localStorage.setItem("clarity_streak", JSON.stringify({ count: newCount, date: today }));
      localStorage.setItem("clarity_last_action", today);
      setStreak(newCount);
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReflect = () => {
    try { localStorage.setItem("clarity_reflected_today", toYMD(new Date())); } catch {}
    setReflected(true);
  };

  const habitOptions = [
    { key: "walk",     label: "20 Min Spaziergang" },
    { key: "meditate", label: "5 Min Meditation" },
    { key: "workout",  label: "Kurzes Workout" },
  ];

  const fadeUp = (d = 0) => ({
    opacity:    vis ? 1 : 0,
    transform:  vis ? "translateY(0)" : "translateY(12px)",
    transition: `opacity 450ms ease ${d}ms, transform 450ms ease ${d}ms`,
  });

  return (
    <div style={{
      maxWidth:       520,
      margin:         "0 auto",
      padding:        "0 0 64px",
      minHeight:      "100vh",
      display:        "flex",
      flexDirection:  "column",
      fontFamily:     FF,
      boxSizing:      "border-box",
    }}>

      {/* Header */}
      <div style={{
        display:        "flex",
        justifyContent: "space-between",
        alignItems:     "center",
        padding:        "20px 24px",
        marginBottom:   8,
      }}>
        <button
          onClick={onBack}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: FF, fontSize: 14, color: "rgba(0,0,0,0.45)",
            padding: 0, display: "flex", alignItems: "center", gap: 4,
          }}
        >
          ← Zurück
        </button>
        <div style={{ opacity: 0.30 }}>
          <ClarityLogo size="sm" centered={false} />
        </div>
      </div>

      <div style={{ padding: "0 24px" }}>

        {/* Section label */}
        <div style={{ ...fadeUp(0), marginBottom: 24 }}>
          <p style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: "rgba(0,0,0,0.28)", margin: "0 0 6px",
          }}>
            Dein System
          </p>
          <p style={{ fontSize: 14, color: "rgba(0,0,0,0.35)", margin: 0 }}>
            Optional — wenn du tiefer gehen willst
          </p>
        </div>

        {/* ── Habit Card ── */}
        <div style={fadeUp(80)}>
          <Card>
            <CardLabel>Gewohnheit</CardLabel>

            {habitOptions.map(({ key, label }) => (
              <div
                key={key}
                onClick={() => setHabit(key)}
                style={{
                  display:     "flex",
                  alignItems:  "center",
                  gap:          12,
                  padding:     "10px 0",
                  cursor:      "pointer",
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                {/* Radio */}
                <div style={{
                  width:        20, height: 20, borderRadius: "50%",
                  border:       habit === key ? "2px solid #7c3aed" : "2px solid rgba(0,0,0,0.18)",
                  background:   habit === key ? "#7c3aed" : "transparent",
                  boxShadow:    habit === key ? "inset 0 0 0 3px #fff" : "none",
                  flexShrink:   0,
                  transition:   "all 180ms ease",
                }} />
                <span style={{
                  fontSize:   15, color: "#0f172a",
                  fontWeight: habit === key ? 600 : 400,
                }}>
                  {label}
                </span>
              </div>
            ))}

            {/* Time toggle */}
            <div style={{ display: "flex", gap: 8, marginTop: 16, marginBottom: 14 }}>
              {[{ key: "afternoon", label: "Nachmittag" }, { key: "evening", label: "Abend" }].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTime(key)}
                  style={{
                    flex:          1, height: 42, borderRadius: 10,
                    border:        "none", cursor: "pointer", fontFamily: FF,
                    fontSize:      14, fontWeight: time === key ? 600 : 400,
                    background:    time === key ? "#0f172a" : "rgba(0,0,0,0.06)",
                    color:         time === key ? "#fff" : "rgba(0,0,0,0.45)",
                    transition:    "all 180ms ease",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveHabit}
              style={{
                width:       "100%", height: 48, borderRadius: 12,
                border:      "none", cursor: "pointer", fontFamily: FF,
                fontSize:    15, fontWeight: 600,
                background:  saved ? "#059669" : "#10b981",
                color:       "#fff",
                transition:  "background 300ms ease",
              }}
            >
              {saved ? "✓ Gespeichert" : "Speichern"}
            </button>
            {streak > 0 && (
              <p style={{ fontSize: 12, color: "rgba(0,0,0,0.35)", margin: "8px 0 0", textAlign: "center" }}>
                🔥 {streak} Tag{streak !== 1 ? "e" : ""} dabei
              </p>
            )}
          </Card>
        </div>

        {/* ── Reflexion Card ── */}
        <div style={fadeUp(160)}>
          <Card>
            <CardLabel>Reflexion</CardLabel>
            <p style={{
              fontSize:  16, fontStyle: "italic",
              lineHeight: 1.55, color: "#0f172a",
              margin:     "0 0 14px",
            }}>
              "{prompt}"
            </p>
            {reflected ? (
              <p style={{ fontSize: 13, color: "#059669", margin: 0 }}>
                ✓ Gespeichert · 🔥 {streak} Tag
              </p>
            ) : (
              <button
                onClick={handleReflect}
                style={{
                  background: "none", border: "1px solid rgba(0,0,0,0.14)",
                  borderRadius: 8, padding: "8px 16px", cursor: "pointer",
                  fontFamily: FF, fontSize: 13, color: "rgba(0,0,0,0.50)",
                }}
              >
                Jetzt reflektieren
              </button>
            )}
          </Card>
        </div>

        {/* ── Erkenntnis Card ── */}
        <div style={fadeUp(220)}>
          <Card>
            <CardLabel>💡 Erkenntnis</CardLabel>
            <p style={{
              fontSize:   15, lineHeight: 1.6,
              color:      "#0f172a", margin: 0,
            }}>
              {profile.confrontation}
            </p>
          </Card>
        </div>

        {/* Pattern card (if available from AI) */}
        {safeResult.pattern && (
          <div style={fadeUp(280)}>
            <Card>
              <CardLabel>🧠 Dein Muster</CardLabel>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: "#0f172a", margin: 0 }}>
                {safeResult.pattern}
              </p>
            </Card>
          </div>
        )}

        {/* Back link */}
        <div style={{ ...fadeUp(340), textAlign: "center", marginTop: 32 }}>
          <button
            onClick={onBack}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontFamily: FF, fontSize: 14, color: "rgba(0,0,0,0.35)",
            }}
          >
            ← Zurück zum Hauptscreen
          </button>
        </div>
      </div>
    </div>
  );
}
