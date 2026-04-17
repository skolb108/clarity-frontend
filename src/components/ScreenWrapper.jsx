import { useState, useEffect, useRef } from "react";

// Scrolls to top instantly before each screen transition —
// prevents the "slides up to page end" issue on mobile after keyboard dismiss.
function scrollTop() {
  try {
    window.scrollTo({ top: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  } catch (_) {}
}

export default function ScreenWrapper({ children }) {
  const [current,  setCurrent]  = useState(children);
  const [previous, setPrevious] = useState(null);
  const [exiting,  setExiting]  = useState(false);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      scrollTop();
      return;
    }

    // Reset scroll before swapping screens
    scrollTop();

    setPrevious(current);
    setCurrent(children);
    setExiting(true);

    const t = setTimeout(() => {
      setPrevious(null);
      setExiting(false);
    }, 300);

    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>

      {/* Outgoing — fades up and out */}
      {previous && (
        <div
          style={{
            position:      "absolute",
            inset:          0,
            opacity:        exiting ? 0 : 1,
            filter:         exiting ? "blur(6px)"  : "blur(0px)",
            transform:      exiting ? "translateY(-10px) scale(0.99)" : "translateY(0) scale(1)",
            transition:     "opacity 280ms ease-out, filter 280ms ease-out, transform 280ms ease-out",
            pointerEvents: "none",
          }}
        >
          {previous}
        </div>
      )}

      {/* Incoming — fades in from slight below */}
      <div
        style={{
          opacity:    previous ? 0   : 1,
          filter:     previous ? "blur(4px)"  : "blur(0px)",
          transform:  previous ? "translateY(12px) scale(0.99)" : "translateY(0) scale(1)",
          transition: previous
            ? "opacity 420ms cubic-bezier(0.2,0.65,0.3,0.9) 60ms, filter 420ms cubic-bezier(0.2,0.65,0.3,0.9) 60ms, transform 420ms cubic-bezier(0.2,0.65,0.3,0.9) 60ms"
            : "none",
        }}
      >
        {current}
      </div>

    </div>
  );
}
