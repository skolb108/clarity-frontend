import { useEffect } from "react";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 32 }}>
    <p style={{
      fontSize:      13,
      fontWeight:    700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color:         "rgba(0,0,0,0.35)",
      margin:        "0 0 10px",
    }}>
      {title}
    </p>
    <div style={{
      fontSize:   15,
      lineHeight: 1.75,
      color:      "rgba(0,0,0,0.70)",
    }}>
      {children}
    </div>
  </div>
);

export default function Datenschutz() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.title = "Datenschutz · Clarity";
  }, []);

  return (
    <div style={{
      maxWidth:   560,
      margin:     "0 auto",
      padding:    "60px 24px 80px",
      fontFamily: FF,
      boxSizing:  "border-box",
      minHeight:  "100vh",
    }}>

      {/* Back */}
      <button
        onClick={() => window.history.back()}
        style={{
          background:    "none",
          border:        "none",
          cursor:        "pointer",
          fontFamily:    FF,
          fontSize:      14,
          color:         "rgba(0,0,0,0.40)",
          padding:       0,
          marginBottom:  40,
          display:       "block",
        }}
      >
        ← Zurück
      </button>

      {/* Headline */}
      <p style={{
        fontSize:      28,
        fontWeight:    800,
        letterSpacing: "-0.02em",
        color:         "#0f172a",
        margin:        "0 0 8px",
      }}>
        Datenschutz
      </p>
      <p style={{
        fontSize:   14,
        color:      "rgba(0,0,0,0.35)",
        margin:     "0 0 48px",
      }}>
        Stand: April 2026
      </p>

      <Section title="Verantwortlicher">
        <p style={{ margin: "0 0 8px" }}>
          Clarity wird als privates Projekt betrieben.<br />
          Für Fragen zum Datenschutz: stephan (at) stephankolb (dot) com
        </p>
      </Section>

      <Section title="Was passiert mit deinen Antworten">
        <p style={{ margin: "0 0 12px" }}>
          Clarity stellt dir eine Reihe von Fragen. Deine Antworten werden
          ausschließlich dazu verwendet, dir ein persönliches Insight zu generieren.
        </p>
        <p style={{ margin: "0 0 12px" }}>
          Die Antworten werden <strong>nicht gespeichert</strong>, nicht geloggt
          und nicht für andere Zwecke verwendet. Jede Session ist vollständig
          anonym und wird nach Abschluss nicht aufbewahrt.
        </p>
        <p style={{ margin: 0 }}>
          Es gibt keine Nutzerkonten, keine E-Mail-Pflicht und keine
          Registrierung.
        </p>
      </Section>

      <Section title="OpenAI">
        <p style={{ margin: "0 0 12px" }}>
          Clarity nutzt die API von OpenAI (OpenAI, L.L.C., San Francisco, USA)
          zur Verarbeitung deiner Antworten. Deine Eingaben werden dabei an
          OpenAI-Server in den USA übertragen.
        </p>
        <p style={{ margin: "0 0 12px" }}>
          OpenAI verarbeitet die Daten gemäß seiner eigenen
          Datenschutzrichtlinie. Clarity hat die Data Processing Addendum (DPA)
          mit OpenAI abgeschlossen, welches DSGVO-konforme Verarbeitung
          sicherstellt.
        </p>
        <p style={{ margin: 0 }}>
          Weitere Informationen:{" "}
          <a href="https://openai.com/privacy" target="_blank" rel="noreferrer"
            style={{ color: "#4361EE", textDecoration: "none" }}>
            openai.com/privacy
          </a>
        </p>
      </Section>

      <Section title="Lokale Speicherung (localStorage)">
        <p style={{ margin: "0 0 12px" }}>
          Clarity speichert ausschließlich folgende technisch notwendige
          Informationen lokal in deinem Browser (localStorage):
        </p>
        <p style={{ margin: "0 0 4px" }}>· <code>clarity_visited</code> — ob du die App schon besucht hast</p>
        <p style={{ margin: "0 0 4px" }}>· <code>clarity_habit</code> — deine gewählte Gewohnheit</p>
        <p style={{ margin: "0 0 12px" }}>· <code>clarity_streak</code> — deine Streak-Anzahl</p>
        <p style={{ margin: 0 }}>
          Diese Daten verlassen dein Gerät nicht und können jederzeit über die
          Browser-Einstellungen gelöscht werden. Es werden keine Tracking-Cookies
          gesetzt.
        </p>
      </Section>

      <Section title="Deine Rechte">
        <p style={{ margin: "0 0 12px" }}>
          Da Clarity keine personenbezogenen Daten speichert, gibt es technisch
          gesehen nichts zu löschen oder auszukünften. Alle Verarbeitungen
          erfolgen in Echtzeit und werden nicht aufbewahrt.
        </p>
        <p style={{ margin: 0 }}>
          Bei Fragen oder Anliegen erreichst du uns unter:{" "}
          stephan (at) stephankolb (dot) com
        </p>
      </Section>

      <Section title="Hosting">
        <p style={{ margin: 0 }}>
          Das Frontend wird über Netlify (San Francisco, USA) gehostet.
          Das Backend läuft auf Railway (San Francisco, USA). Beide Anbieter
          verarbeiten Daten nach DSGVO-konformen Standardvertragsklauseln.
        </p>
      </Section>

    </div>
  );
}
