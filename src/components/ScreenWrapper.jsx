import { useState, useEffect, useRef } from "react";

// Holographic screen transition:
// outgoing: fades + lifts + blurs (like a holo-panel dissolving)
// incoming: fades in + rises + un-blurs (like a new panel crystallising)
export default function ScreenWrapper({ children }) {
  const [current,  setCurrent]  = useState(children);
  const [previous, setPrevious] = useState(null);
  const [exiting,  setExiting]  = useState(false);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }

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

      {/* Outgoing: lifts, fades, blurs out */}
      {previous && (
        <div
          style={{
            position:      "absolute",
            inset:          0,
            opacity:        exiting ? 0 : 1,
            filter:         exiting ? "blur(8px)"  : "blur(0px)",
            transform:      exiting ? "translateY(-10px) scale(0.99)" : "translateY(0) scale(1)",
            transition:     "opacity 280ms ease-out, filter 280ms ease-out, transform 280ms ease-out",
            pointerEvents: "none",
          }}
        >
          {previous}
        </div>
      )}

      {/* Incoming: rises, fades in, un-blurs */}
      <div
        style={{
          opacity:    previous ? 0   : 1,
          filter:     previous ? "blur(6px)"  : "blur(0px)",
          transform:  previous ? "translateY(14px) scale(0.99)" : "translateY(0) scale(1)",
          transition: previous
            ? "opacity 480ms cubic-bezier(0.2,0.65,0.3,0.9) 60ms, filter 480ms cubic-bezier(0.2,0.65,0.3,0.9) 60ms, transform 480ms cubic-bezier(0.2,0.65,0.3,0.9) 60ms"
            : "none",
        }}
      >
        {current}
      </div>

    </div>
  );
}
