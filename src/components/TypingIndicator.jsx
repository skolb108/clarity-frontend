const KEYFRAMES = `
  @keyframes typingBounce {
    0%, 80%, 100% { transform: translateY(0);    opacity: 0.35; }
    40%            { transform: translateY(-5px); opacity: 1;    }
  }
`;

let injected = false;
function injectStyles() {
  if (injected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = KEYFRAMES;
  document.head.appendChild(s);
  injected = true;
}

export default function TypingIndicator() {
  injectStyles();

  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width:           7,
            height:          7,
            borderRadius:    "50%",
            background:      "rgba(0,0,0,0.40)",
            display:         "inline-block",
            animation:       `typingBounce 1.2s ease-in-out infinite`,
            animationDelay:  `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}
