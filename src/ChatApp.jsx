import { lazy, Suspense } from "react";

// ── Lazy chunks — Vite emits each as a separate JS file ───────────────────────
//
//   ChatFlow     — chat questions, AI prompts, voice, analysis logic (~650 lines)
//                  Loads only when the user starts a conversation.
//
//   PublicProfile — /p/* share page, parseProfileSlug, ClarityPublicProfile
//                  Loads only for public profile URLs. Zero cost for chat users.
//
// Both chunks share a third chunk (shared.jsx: ClarityProfileView, ScoreIcon,
// SCORE_COLORS, etc.) that Vite deduplicates automatically.
const ChatFlow      = lazy(() => import("./ChatFlow.jsx"));
const PublicProfile = lazy(() => import("./PublicProfile.jsx"));

// ── Route-aware entry — ChatApp is itself lazy-loaded from App.jsx ─────────────
export default function ChatApp() {
  const pathname = window.location.pathname;

  // /p/* — public share page: load profile chunk, skip chat entirely
  if (pathname.startsWith("/p/")) {
    const slug = pathname.slice(3);
    return (
      <Suspense fallback={null}>
        <PublicProfile slug={slug} />
      </Suspense>
    );
  }

  // Normal route — load chat flow
  return (
    <Suspense fallback={null}>
      <ChatFlow />
    </Suspense>
  );
}
