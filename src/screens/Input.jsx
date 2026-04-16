import { useState, useEffect, useRef } from "react";
import ScreenContainer from "../components/ScreenContainer";

const TOP_SPACER_H = "clamp(40px, 18vh, 160px)";

export default function Input({ onNext }) {
  const [text, setText]   = useState("");
  const [phase, setPhase] = useState(0);
  const textareaRef       = useRef(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => textareaRef.current?.focus({ preventScroll: true }), 700),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

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

  const canSubmit = text.trim().length > 0;

  const fadeIn = (show, yOffset = 12) => ({
    opacity:    show ? 1 : 0,
    transform:  show ? "translateY(0)" : `translateY(${yOffset}px)`,
    transition: "opacity 500ms cubic-bezier(0.2,0.65,0.3,0.9), transform 500ms cubic-bezier(0.2,0.65,0.3,0.9)",
  });

  return (
    <ScreenContainer logoAlign="left" logoOpacity={0.35}>
      {/* Glass textarea focus styles */}
      <style>{`
        .clarity-input::placeholder {
          color: rgba(0,0,0,0.22);
        }
        .clarity-input:focus {
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
        <div style={{ height: TOP_SPACER_H, flexShrink: 0 }} />

        {/* Headline */}
        <div style={fadeIn(phase >= 1, 16)}>
          <p style={{
            fontSize:      39,
            fontWeight:    700,
            lineHeight:    1.2,
            letterSpacing: "-0.02em",
            color:         "#0f172a",
            margin:        "0 0 48px",
            textShadow:    "0 2px 60px rgba(165,180,252,0.15)",
          }}>
            Was geht dir gerade wirklich durch den Kopf?
          </p>
        </div>

        {/* Glass input surface */}
        <div style={fadeIn(phase >= 2, 8)}>
          <textarea
            ref={textareaRef}
            className="clarity-input"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Deine Antwort…"
            rows={1}
            style={{
              width:        "100%",
              boxSizing:    "border-box",
              fontSize:     18,
              lineHeight:   1.6,
              color:        "#0f172a",
              padding:      "0 0 12px",
              border:       "none",
              borderBottom: "1px solid rgba(0,0,0,0.09)",
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

          {/* Tappable CTA */}
          <p style={{
            fontSize:      13,
            color:         canSubmit ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.15)",
            margin:        "20px 0 0",
            letterSpacing: "0.02em",
            userSelect:    "none",
            transition:    "color 300ms ease",
          }}>
            Tippen für Weiter →
          </p>
        </div>
      </div>
    </ScreenContainer>
  );
}
