import { useState, useEffect } from "react";

const FF = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export default function Result({ onNext }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fadeUp = (delay = 0) => ({
    opacity:    visible ? 1 : 0,
    transform:  visible ? "translateY(0)" : "translateY(10px)",
    transition: `opacity 600ms ease ${delay}ms, transform 600ms ease ${delay}ms`,
  });

  return (
    <div
      style={{
        minHeight:      "100vh",
        background:     "#f8f9fb",
        fontFamily:     FF,
        paddingBottom:  80,
      }}
    >
      <div
        style={{
          maxWidth: 600,
          margin:   "0 auto",
          padding:  "80px 28px 0",
        }}
      >

        {/* ── 1. SOFT INTRO ─────────────────────────────────────────── */}
        <p
          style={{
            fontSize:      13,
            color:         "rgba(0,0,0,0.38)",
            letterSpacing: "0.03em",
            lineHeight:    1.6,
            marginBottom:  10,
            textAlign:     "center",
            ...fadeUp(0),
          }}
        >
          Das trifft dich wahrscheinlich genauer, als dir gerade lieb ist.
        </p>

        {/* ── 2. RECOGNITION LINE ───────────────────────────────────── */}
        <p
          style={{
            fontSize:      13,
            color:         "#6366f1",
            fontWeight:    600,
            letterSpacing: "0.02em",
            lineHeight:    1.6,
            marginBottom:  48,
            textAlign:     "center",
            ...fadeUp(80),
          }}
        >
          Die meisten erkennen sich hier zum ersten Mal wirklich.
        </p>

        {/* ── 3. IDENTITY LABEL ─────────────────────────────────────── */}
        <p
          style={{
            fontSize:      "clamp(15px, 3vw, 18px)",
            fontWeight:    400,
            color:         "rgba(0,0,0,0.42)",
            lineHeight:    1,
            marginBottom:  8,
            textAlign:     "center",
            ...fadeUp(160),
          }}
        >
          Du bist ein
        </p>

        {/* ── 4. CORE IDENTITY ──────────────────────────────────────── */}
        <h1
          style={{
            fontSize:           "clamp(68px, 16vw, 104px)",
            fontWeight:         900,
            letterSpacing:      "-0.045em",
            lineHeight:         0.92,
            textAlign:          "center",
            margin:             "0 0 36px",
            background:         "linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip:     "text",
            ...fadeUp(240),
          }}
        >
          Explorer
        </h1>

        {/* ── 5. CORE STATEMENT ─────────────────────────────────────── */}
        <p
          style={{
            fontSize:      "clamp(18px, 3.5vw, 22px)",
            fontWeight:    600,
            color:         "#0f172a",
            lineHeight:    1.45,
            letterSpacing: "-0.015em",
            marginBottom:  24,
            textAlign:     "center",
            ...fadeUp(320),
          }}
        >
          Du bist nicht verloren. Du sammelst Richtungen — und nennst das Offenheit.
        </p>

        {/* ── 6. CONCRETE MIRROR ────────────────────────────────────── */}
        <p
          style={{
            fontSize:      "clamp(15px, 2.5vw, 17px)",
            fontWeight:    400,
            color:         "rgba(0,0,0,0.55)",
            lineHeight:    1.7,
            marginBottom:  40,
            textAlign:     "center",
            ...fadeUp(400),
          }}
        >
          Du bist aktuell auf der Suche nach Klarheit in verschiedenen Lebensbereichen.
        </p>

        {/* ── 7. HONEST BLOCK ───────────────────────────────────────── */}
        <div
          style={{
            background:   "#fff",
            border:       "1px solid rgba(0,0,0,0.07)",
            borderRadius: 14,
            padding:      "22px 24px",
            marginBottom: 56,
            ...fadeUp(480),
          }}
        >
          <p
            style={{
              fontSize:      11,
              fontWeight:    700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color:         "rgba(0,0,0,0.30)",
              margin:        "0 0 10px",
            }}
          >
            Wenn du ehrlich bist:
          </p>
          <p
            style={{
              fontSize:   "clamp(15px, 2.5vw, 17px)",
              fontWeight: 500,
              color:      "#0f172a",
              lineHeight: 1.6,
              margin:     0,
            }}
          >
            Du weißt genug, um anzufangen. Die Frage ist, ob du Angst vor dem Ende hast.
          </p>
        </div>

        {/* ── OPTIONAL: CONTINUE ────────────────────────────────────── */}
        {onNext && (
          <div
            style={{
              textAlign: "center",
              ...fadeUp(560),
            }}
          >
            <button
              onClick={onNext}
              style={{
                height:       50,
                padding:      "0 32px",
                background:   "#0f172a",
                color:        "#fff",
                border:       "none",
                borderRadius: 12,
                fontSize:     15,
                fontWeight:   600,
                fontFamily:   FF,
                cursor:       "pointer",
                letterSpacing: "0.01em",
              }}
            >
              Weiter
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
