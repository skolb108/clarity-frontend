import { lazy, Suspense } from "react";
import Experience from "./flow/Experience";

const Datenschutz = lazy(() => import("./Datenschutz.jsx"));
const Stats       = lazy(() => import("./Stats.jsx"));

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === "/datenschutz") {
    return <Suspense fallback={null}><Datenschutz /></Suspense>;
  }

  if (pathname === "/stats") {
    return <Suspense fallback={null}><Stats /></Suspense>;
  }

  return <Experience />;
}
