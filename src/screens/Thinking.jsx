import { useState, useEffect } from "react";

export default function Thinking({ previousAnswer }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const iv = setInterval(() => {
      setDots(d => d.length >= 3 ? "" : d + ".");
    }, 380);
    return () => clearInterval(iv);
  }, []);

  return (
    <div
      style={{
        minHeight:      "100vh",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        fontFamily:     "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <p
        style={{
          fontSize:      16,
          color:         "rgba(0,0,0,0.32)",
          letterSpacing: "0.01em",
          margin:        0,
          width:         "12ch",     /* prevent layout shift as dots grow */
        }}
      >
        {previousAnswer
          ? `Ich schaue mir kurz an, was du gerade gesagt hast${dots}`
          : `Ich denke kurz darüber nach${dots}`
        }
      </p>
    </div>
  );
}
