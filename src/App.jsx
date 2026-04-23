import { lazy, Suspense } from "react";
import Experience from "./flow/Experience";

const Datenschutz = lazy(() => import("./Datenschutz.jsx"));

export default function App() {
  const pathname = window.location.pathname;

  if (pathname === "/datenschutz") {
    return (
      <Suspense fallback={null}>
        <Datenschutz />
      </Suspense>
    );
  }

  return <Experience />;
}
