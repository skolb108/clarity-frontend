import Waitlist from "./Waitlist";
import PublicProfile from "./PublicProfile";
import { useState, lazy, Suspense, memo, useRef } from "react";

// ── ChatApp chunk — declared at module level so Vite emits a separate chunk.
// The import() factory is NOT called (no network request) until <ChatApp />
// renders inside <Suspense> for the first time.
const ChatApp = lazy(() => import("./ChatFlow"));

// ── Prefetch helper — starts the chunk download early without mounting ─────────
// Called on pointerdown/touchstart so the ~400ms hero fade-out doubles as
// download time. Safe to call multiple times — import() caches the promise.
const prefetchChatApp = () => import("./ChatFlow");

// ── HeroScreen CSS — injected once at module load ──────────────────────────────
const HERO_CSS = `
  .c-hero-meta { display: block; }
  .c-header {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .c-header-inner {
    width: 100%;
    max-width: 600px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 24px;
    box-sizing: border-box;
    pointer-events: auto;
  }
  .c-header-logo {
    width: 24px;
    height: 24px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .c-header-wordmark {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #111;
    text-transform: uppercase;
  }
`;
if (typeof document !== "undefined") {
  const _s = document.createElement("style");
  _s.textContent = HERO_CSS;
  document.head.appendChild(_s);
}

// ── ClarityHeader — fixed top bar, always visible ────────────────────────────
const ClarityHeader = memo(function ClarityHeader() {
  return (
    <div className="c-header" aria-hidden="true">
      <div className="c-header-inner">
        <img
          src="/clarity-logo.png"
          alt=""
          className="c-header-logo"
          onError={e => { e.currentTarget.style.display = "none"; }}
        />
        <span className="c-header-wordmark">Clarity</span>
      </div>
    </div>
  );
});

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
      <ClarityHeader />

      {/* Headline */}
      <h1 style={{
        fontSize: "clamp(36px, 9vw, 68px)",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        lineHeight: 1.08,
        color: "#000",
        marginBottom: 20,
        maxWidth: 520,
      }}>
        Du glaubst, du kennst dich.<br />Stimmt nicht ganz.
      </h1>

      {/* Subline */}
      <p style={{
        fontSize: "clamp(17px, 3.5vw, 20px)",
        color: "#000",
        opacity: 0.55,
        lineHeight: 1.6,
        marginBottom: 36,
        maxWidth: 360,
      }}>
        Die meisten erkennen sich hier sofort.
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
        Meinen Typ finden
      </button>

      {/* Microcopy — always visible */}
      <div style={{
        fontSize: 13, color: "#000", opacity: 0.40,
        letterSpacing: "0.02em", lineHeight: 1.6, textAlign: "center",
      }}>
        Kostenlos · Kein Account · ca. 10 Minuten
      </div>

      {/* Trust signal — always visible */}
      <div style={{
        fontSize: 13, color: "#000", opacity: 0.55,
        marginTop: 6, letterSpacing: "0.01em", textAlign: "center",
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

  // /p/* — public profile, render PublicProfile with slug
  if (pathname.startsWith("/p/")) {
    const slug = pathname.replace("/p/", "");
    return <PublicProfile slug={slug} />;
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
