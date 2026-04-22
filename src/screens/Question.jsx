import { useState, useEffect, useRef } from "react";
import ScreenContainer from "../components/ScreenContainer";

const TOP_SPACER_H = "clamp(40px, 18vh, 160px)";

const KEYFRAMES = `
  @keyframes clarityBreathe {
    0%,  100% { transform: scale(1);    opacity: 0.35; }
    50%        { transform: scale(1.35); opacity: 0.7;  }
  }
  @keyframes reactionIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

function BreathingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {[0, 200, 400].map((d) => (
        <div key={d} style={{
          width:        9,
          height:       9,
          borderRadius: "50%",
          background:   "#a5b4fc",
          animation:    `clarityBreathe 2.4s cubic-bezier(0.4,0,0.2,1) ${d}ms infinite`,
        }} />
      ))}
    </div>
  );
}

function getQuestionFontSize(text) {
  const len = (text || "").length;
  if (len > 120) return 24;
  if (len > 90)  return 27;
  if (len > 65)  return 31;
  if (len > 45)  return 35;
  return 39;
}

function ProgressSlot({ questionNumber, totalQuestions }) {
  const nearEnd = questionNumber >= Math.ceil(totalQuestions * 0.6);
  return (
    <div style={{ textAlign: "right" }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.25)", letterSpacing: "0.01em", display: "block" }}>
        Frage {questionNumber} von {totalQuestions}
      </span>
      {nearEnd && (
        <span style={{ fontSize: 11, color: "rgba(0,0,0,0.18)", display: "block", marginTop: 3 }}>
          Du bist gleich durch.
        </span>
      )}
    </div>
  );
}

export default function Question({
  question,
  reflection   = "",
  reaction     = null,
  isReacting   = false,
  previousAnswer,
  isTyping,
  questionNumber,
  totalQuestions = 12,
  onNext,
}) {
  const [text,      setText]      = useState("");
  const [phase,     setPhase]     = useState(0);
  const [isFocused, setIsFocused] = useState(false); // CTA only visible after first focus
  const textareaRef = useRef(null);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = KEYFRAMES;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    setPhase(0);
    setText("");
    setIsFocused(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 300),
      setTimeout(() => setPhase(3), 600),
      // Auto-focus but don't set isFocused — CTA stays hidden until real tap
      setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [question]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onNext(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
  };

  const handleChange = (e) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const handleScreenTap = (e) => {
    if (e.target === textareaRef.current) return;
    handleSubmit();
  };

  const canSubmit = !isTyping && !isReacting && text.trim().length > 0;

  const fadeIn = (show, yOffset = 10) => ({
    opacity:    show ? 1 : 0,
    transform:  show ? "translateY(0)" : `translateY(${yOffset}px)`,
    transition: "opacity 500ms cubic-bezier(0.2,0.65,0.3,0.9), transform 500ms cubic-bezier(0.2,0.65,0.3,0.9)",
  });

  const progressSlot = questionNumber != null
    ? <ProgressSlot questionNumber={questionNumber} totalQuestions={totalQuestions} />
    : null;

  /* ── REACTION STATE ── */
  if (isReacting && reaction) {
    return (
      <ScreenContainer logoAlign="left" logoOpacity={0.25} headerRight={progressSlot}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <p style={{
            fontSize:      15,
            fontWeight:    400,
            lineHeight:    1.5,
            color:         "#4361EE",
            letterSpacing: "0.005em",
            margin:        0,
            animation:     "reactionIn 350ms cubic-bezier(0.2,0.65,0.3,0.9) forwards",
          }}>
            {reaction.text}
          </p>
        </div>
      </ScreenContainer>
    );
  }

  /* ── THINKING STATE ── */
  if (isTyping) {
    return (
      <ScreenContainer logoAlign="left" logoOpacity={0.25} headerRight={progressSlot}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center" }}>
          <BreathingDots />
          <p style={{ fontSize: 16, color: "rgba(0,0,0,0.28)", margin: "14px 0 0", letterSpacing: "0.01em" }}>
            Clarity denkt…
          </p>
        </div>
      </ScreenContainer>
    );
  }

  /* ── NORMAL QUESTION STATE ── */
  const hasContext = previousAnswer || reflection;

  return (
    <ScreenContainer logoAlign="left" logoOpacity={0.25} headerRight={progressSlot}>
      <style>{`
        .clarity-q-input::placeholder { color: rgba(0,0,0,0.25); }
        .clarity-q-input:focus {
          outline: none;
          border-bottom-color: rgba(165,180,252,0.50) !important;
          background: rgba(165,180,252,0.025) !important;
        }
      `}</style>

      <div
        onClick={handleScreenTap}
        style={{
          flex:          1,
          display:       "flex",
          flexDirection: "column",
          cursor:        canSubmit ? "pointer" : "default",
          userSelect:    "none",
        }}
      >
        {hasContext ? (
          <>
            <div style={{ height: "clamp(8px, 2vh, 20px)", flexShrink: 0 }} />

            <div style={fadeIn(phase >= 1, 8)}>
              {previousAnswer && (
                <div style={{ marginBottom: reflection ? 12 : 0 }}>
                  <p style={{
                    fontSize:      11,
                    letterSpacing: "0.08em",
                    color:         "rgba(0,0,0,0.20)",
                    margin:        "0 0 5px",
                  }}>
                    Vorherige Antwort
                  </p>
                  <p style={{
                    fontSize:         14,
                    lineHeight:       1.5,
                    color:            "rgba(0,0,0,0.26)",
                    margin:           0,
                    fontStyle:        "italic",
                    overflow:         "hidden",
                    display:          "-webkit-box",
                    WebkitLineClamp:  2,
                    WebkitBoxOrient:  "vertical",
                  }}>
                    {previousAnswer}
                  </p>
                </div>
              )}

              {reflection && (
                <p style={{
                  fontSize:      15,
                  lineHeight:    1.5,
                  color:         "#4361EE",
                  margin:        0,
                  fontWeight:    400,
                  letterSpacing: "0.005em",
                }}>
                  {reflection}
                </p>
              )}
            </div>

            <div style={{ height: "clamp(20px, 3.5vh, 48px)", flexShrink: 0 }} />
          </>
        ) : (
          <div style={{ height: TOP_SPACER_H, flexShrink: 0 }} />
        )}

        {/* Question */}
        <div style={{ ...fadeIn(phase >= 2, 14), marginBottom: 40 }}>
          <p style={{
            fontSize:      getQuestionFontSize(question),
            fontWeight:    700,
            lineHeight:    1.2,
            letterSpacing: "-0.02em",
            color:         "#0f172a",
            margin:        0,
            textShadow:    "0 2px 60px rgba(165,180,252,0.15)",
          }}>
            {question}
          </p>
        </div>

        {/* Textarea */}
        <div style={fadeIn(phase >= 3, 8)}>
          <textarea
            ref={textareaRef}
            className="clarity-q-input"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={questionNumber === 1 ? "z.\u202FB. Entscheidung, Beziehung, Job\u2026" : "Deine Antwort\u2026"}
            rows={1}
            onFocus={() => setIsFocused(true)}
            // Keep isFocused true once set — CTA stays visible
            style={{
              width:        "100%",
              boxSizing:    "border-box",
              fontSize:     17,
              lineHeight:   1.6,
              color:        "#0f172a",
              padding:      "0 0 12px",
              border:       "none",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              borderRadius: 0,
              background:   "transparent",
              resize:       "none",
              outline:      "none",
              overflow:     "hidden",
              fontFamily:   "inherit",
              display:      "block",
              minHeight:    "1.6em",
              cursor:       "text",
              transition:   "border-color 350ms ease, background 350ms ease",
            }}
          />

          {/* CTA — only visible after first focus, smooth fade-in */}
          <p style={{
            fontSize:      13,
            color:         canSubmit ? "rgba(0,0,0,0.32)" : "rgba(0,0,0,0.14)",
            margin:        "16px 0 0",
            letterSpacing: "0.02em",
            userSelect:    "none",
            opacity:       isFocused ? 1 : 0,
            transform:     isFocused ? "translateY(0)" : "translateY(4px)",
            transition:    "opacity 300ms ease, transform 300ms ease, color 200ms ease",
            pointerEvents: isFocused ? "auto" : "none",
          }}>
            Tippen für Weiter →
          </p>

          {/* Helper text — only on Q1, fades in with the textarea */}
          {questionNumber === 1 && (
            <p style={{
              fontSize:   13,
              color:      "rgba(0,0,0,0.28)",
              margin:     "10px 0 0",
              lineHeight: 1.5,
              opacity:    phase >= 3 ? 1 : 0,
              transition: "opacity 500ms ease 200ms",
            }}>
              Schreib einfach, was dir gerade durch den Kopf geht.
            </p>
          )}
        </div>
      </div>
    </ScreenContainer>
  );
}
