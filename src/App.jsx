import Waitlist from "./Waitlist";
import { useState, lazy, Suspense, memo, useRef } from "react";

// ── ChatApp chunk — declared at module level so Vite emits a separate chunk.
// The import() factory is NOT called (no network request) until <ChatApp />
// renders inside <Suspense> for the first time.
const ChatApp = lazy(() => import("./ChatFlow"));

// ── Prefetch helper — starts the chunk download early without mounting ─────────
// Called on pointerdown/touchstart so the ~400ms hero fade-out doubles as
// download time. Safe to call multiple times — import() caches the promise.
const prefetchChatApp = () => import("./ChatFlow");

// ── HeroScreen — lives in the initial bundle, paints before any JS evaluates ──
const HeroScreen = memo(function HeroScreen({ onStart }) {
  const [fading, setFading]   = useState(false);
  const prefetchedRef          = useRef(false);

  // Begin prefetch as early as possible (hover on desktop, touchstart on iOS)
  const handlePrefetch = () => {
    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      prefetchChatApp();          // fires import(), starts chunk download
    }
  };

  // Fade hero out, then tell App to mount ChatApp (already downloading)
  const handleStart = () => {
    handlePrefetch();             // ensure prefetch started even on fast taps
    setFading(true);
    setTimeout(() => onStart(), 400);
  };

  return (
    <div
      className={fading ? "c-hero-fading" : ""}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        maxWidth: "100%",
        margin: "0 auto",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        textAlign: "center",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Wordmark */}
      <div style={{
        fontSize: 11, letterSpacing: "0.42em", textTransform: "uppercase",
        color: "#000", opacity: 0.35, marginBottom: 52,
      }}>
        Clarity
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: "clamp(40px, 9vw, 68px)",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1.06,
        color: "#000",
        marginBottom: 20,
        maxWidth: 480,
      }}>
        Mehr Klarheit.
      </h1>

      {/* Subline */}
      <p style={{
        fontSize: "clamp(18px, 3.5vw, 20px)",
        color: "#000",
        opacity: 0.55,
        lineHeight: 1.6,
        marginBottom: 36,
        maxWidth: 360,
      }}>
        In einem kurzen Gespräch erkennst du, was dir wirklich wichtig ist.
      </p>

      {/* CTA — prefetch on first pointer contact, mount on click */}
      <button
        className="c-hero-btn"
        onMouseEnter={handlePrefetch}   /* desktop: hover starts download   */
        onTouchStart={handlePrefetch}   /* iOS: finger-down starts download  */
        onPointerDown={handlePrefetch}  /* covers remaining pointer devices  */
        onClick={handleStart}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "64px",
          padding: "0 36px",
          color: "#fff",
          border: "none",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "18px",
          fontWeight: 600,
          borderRadius: "18px",
          cursor: "pointer",
          marginBottom: 20,
          boxShadow: "0 10px 36px rgba(79,140,255,0.30)",
          minWidth: 220,
          willChange: "transform",
        }}
      >
        Gespräch starten
      </button>

      {/* Microcopy */}
      <div style={{
        fontSize: 14, color: "#000", opacity: 0.42,
        letterSpacing: "0.02em", lineHeight: 1.6,
      }}>
        Kostenlos · Kein Account · ca. 10 Minuten
      </div>

      {/* Trust signal */}
      <div style={{
        fontSize: 14, color: "#000", opacity: 0.6,
        marginTop: 10, letterSpacing: "0.01em",
      }}>
        Bereits über 1.000 Gespräche geführt
      </div>
    </div>
  );
});

// ── Route-aware app entry point ────────────────────────────────────────────────
export default function App() {
  const [chatStarted, setChatStarted] = useState(false);
  const pathname = window.location.pathname;
  if (pathname === "/waitlist") {
  return <Waitlist />;
}

  // /p/* — public profile, skip hero and load ChatApp immediately
  if (pathname.startsWith("/p/")) {
    return (
      <Suspense fallback={null}>
        <ChatApp />
      </Suspense>
    );
  }

  // Normal route — hero visible instantly; ChatApp mounts after fade-out
  if (!chatStarted) {
    return <HeroScreen onStart={() => setChatStarted(true)} />;
  }

  return (
    <Suspense fallback={null}>
      <ChatApp />
    </Suspense>
  );
}
