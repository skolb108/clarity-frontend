import { useState } from "react";

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

  const handleSubmit = async () => {
    if (!email) return;

    try {
      const res = await fetch(`${API_URL}/api/waitlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus("Danke! Du bist auf der Liste.");
        setEmail("");
      } else {
        setStatus("Fehler. Versuch es nochmal.");
      }
    } catch (e) {
      setStatus("Fehler. Versuch es nochmal.");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui",
      padding: 24,
      paddingTop: 100,
    }}>
      <div style={{ maxWidth: 420, width: "100%" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
          Join the Clarity Waitlist
        </h1>

        <p style={{ marginBottom: 24, color: "#64748b" }}>
          Get early access to the Clarity system.
        </p>

        <input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 14px",
            marginBottom: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0"
          }}
        />

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            height: 44,
            background: "#111",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          Join waitlist
        </button>

        {status && (
          <p style={{ marginTop: 12, fontSize: 14 }}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}