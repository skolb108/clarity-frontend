import { useState, useEffect } from "react";

const FF      = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const INDIGO  = "#4361EE";
const API_URL = import.meta.env.VITE_API_URL ||
  "https://clarity-backend-production-108.up.railway.app";

const QUESTIONS = Array.from({ length: 12 }, (_, i) => `question_${i + 1}`);

function pct(a, b) {
  if (!b) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

function Bar({ value, max, color = INDIGO }) {
  const w = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        flex: 1, height: 8, background: "rgba(0,0,0,0.07)", borderRadius: 4, overflow: "hidden",
      }}>
        <div style={{
          width: `${w}%`, height: "100%", background: color, borderRadius: 4,
          transition: "width 600ms ease",
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", minWidth: 32, textAlign: "right" }}>
        {value ?? 0}
      </span>
    </div>
  );
}

export default function Stats() {
  const [key,     setKey]     = useState("");
  const [data,    setData]    = useState(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const load = async (k) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/stats`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ key: k }),
      });
      if (res.status === 401) { setError("Falscher Key."); setLoading(false); return; }
      const json = await res.json();
      setData(json);
    } catch (_) {
      setError("Verbindung fehlgeschlagen.");
    }
    setLoading(false);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = "Stats · Clarity";
  }, []);

  const t = data?.totals || {};
  const started   = t.flow_start    || 0;
  const completed = t.flow_complete || 0;
  const shareOpen = t.share_opened  || 0;
  const shareTap  = t.share_tapped  || 0;

  // Last 7 days
  const daily  = data?.daily || {};
  const days   = Object.keys(daily).sort().slice(-7);

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "48px 24px 80px", fontFamily: FF, boxSizing: "border-box", minHeight: "100vh" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a", margin: "0 0 4px" }}>
          Clarity Stats
        </p>
        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.35)", margin: 0 }}>
          Anonym · Keine Cookies · Keine personenbezogenen Daten
        </p>
      </div>

      {/* Login */}
      {!data && (
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          <input
            type="password"
            placeholder="Stats-Key"
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load(key)}
            style={{
              flex: 1, height: 44, padding: "0 14px", borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.14)", fontFamily: FF, fontSize: 14,
              outline: "none", background: "rgba(255,255,255,0.80)",
            }}
          />
          <button onClick={() => load(key)} disabled={loading} style={{
            height: 44, padding: "0 20px", background: INDIGO, color: "#fff",
            border: "none", borderRadius: 10, fontFamily: FF, fontSize: 14,
            fontWeight: 600, cursor: "pointer",
          }}>
            {loading ? "…" : "Laden"}
          </button>
        </div>
      )}
      {error && <p style={{ color: "#e11d48", fontSize: 14, marginBottom: 16 }}>{error}</p>}

      {/* Dashboard */}
      {data && (
        <>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
            {[
              { label: "Flows gestartet",  value: started },
              { label: "Abgeschlossen",    value: completed, sub: pct(completed, started) },
              { label: "Share geöffnet",   value: shareOpen, sub: pct(shareOpen, completed) },
              { label: "Tatsächlich geteilt", value: shareTap, sub: pct(shareTap, shareOpen) },
            ].map(({ label, value, sub }) => (
              <div key={label} style={{
                background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14, padding: "16px 18px",
              }}>
                <p style={{ fontSize: 12, color: "rgba(0,0,0,0.40)", margin: "0 0 4px", letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
                <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a", margin: 0 }}>{value}</p>
                {sub && <p style={{ fontSize: 12, color: INDIGO, margin: "2px 0 0", fontWeight: 600 }}>{sub}</p>}
              </div>
            ))}
          </div>

          {/* Dropoff per question */}
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(0,0,0,0.35)", margin: "0 0 16px" }}>
              Dropoff pro Frage
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {QUESTIONS.map((q, i) => {
                const val  = t[q] || 0;
                const prev = i === 0 ? started : (t[QUESTIONS[i - 1]] || 0);
                const drop = prev ? Math.round(((prev - val) / prev) * 100) : 0;
                return (
                  <div key={q}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: "rgba(0,0,0,0.55)" }}>Frage {i + 1}</span>
                      {drop > 15 && <span style={{ fontSize: 12, color: "#e11d48", fontWeight: 600 }}>−{drop}%</span>}
                    </div>
                    <Bar value={val} max={started} />
                  </div>
                );
              })}
              {/* Completion bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>Result erreicht</span>
                  <span style={{ fontSize: 12, color: INDIGO, fontWeight: 600 }}>{pct(completed, started)}</span>
                </div>
                <Bar value={completed} max={started} color="#10b981" />
              </div>
            </div>
          </div>

          {/* Last 7 days */}
          {days.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(0,0,0,0.35)", margin: "0 0 12px" }}>
                Letzte 7 Tage
              </p>
              <div style={{
                background: "rgba(255,255,255,0.80)", border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14, overflow: "hidden",
              }}>
                {days.map((day, i) => {
                  const d = daily[day];
                  return (
                    <div key={day} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "11px 16px",
                      borderBottom: i < days.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                    }}>
                      <span style={{ fontSize: 13, color: "rgba(0,0,0,0.55)" }}>{day}</span>
                      <div style={{ display: "flex", gap: 16 }}>
                        <span style={{ fontSize: 13 }}>▶ {d.flow_start || 0}</span>
                        <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>✓ {d.flow_complete || 0}</span>
                        <span style={{ fontSize: 13, color: INDIGO }}>⬆ {d.share_tapped || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "rgba(0,0,0,0.28)", margin: "8px 0 0" }}>
                ▶ Gestartet · ✓ Abgeschlossen · ⬆ Geteilt
              </p>
            </div>
          )}

          <button onClick={() => { setData(null); setKey(""); }} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: FF, fontSize: 13, color: "rgba(0,0,0,0.35)", padding: 0,
          }}>
            Abmelden
          </button>
        </>
      )}
    </div>
  );
}
