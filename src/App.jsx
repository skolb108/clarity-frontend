import { lazy, Suspense } from "react";
import Experience from "./flow/Experience";

/*
  App.jsx — new entry point.

  Routes:
  /p/*      → PublicProfile (share page, lazy)
  /waitlist → Waitlist (lazy)
  *         → Experience (the main Clarity flow)

  The old HeroScreen + ChatApp is replaced by Experience directly.
*/

const PublicProfile = lazy(() => import("./PublicProfile.jsx"));
const Waitlist      = lazy(() => import("./Waitlist.jsx"));

export default function App() {
  const pathname = window.location.pathname;

  // /p/* — public profile share page
  if (pathname.startsWith("/p/")) {
    const slug = pathname.slice(3);
    return (
      <Suspense fallback={null}>
        <PublicProfile slug={slug} />
      </Suspense>
    );
  }

  // /waitlist
  if (pathname === "/waitlist") {
    return (
      <Suspense fallback={null}>
        <Waitlist />
      </Suspense>
    );
  }

  // Main flow — Entry → Questions → Result
  return <Experience />;
}
