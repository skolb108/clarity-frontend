/*
  GlobalBackground — renders the mint/peach/lavender atmosphere
  as position:fixed layers that sit behind every screen.

  Rendered once in Experience.jsx, persists across all screen transitions.
  This is the only reliable way to have a consistent background on iOS
  (background-attachment:fixed doesn't work on iOS Safari).
*/
export default function GlobalBackground() {
  return (
    <>
      {/* Layer 1 — near-white base */}
      <div aria-hidden="true" style={{
        position:     "fixed",
        inset:         0,
        zIndex:        -3,
        background:    "#F5F5F4",
        pointerEvents: "none",
      }} />

      {/* Layer 2 — mint/cyan top-left */}
      <div aria-hidden="true" style={{
        position:     "fixed",
        inset:         0,
        zIndex:        -2,
        background:   `radial-gradient(ellipse 78% 62% at -8% 3%,
          rgba(175, 228, 230, 0.38) 0%,
          rgba(155, 215, 222, 0.12) 45%,
          transparent 68%
        )`,
        pointerEvents: "none",
      }} />

      {/* Layer 3 — soft lavender bottom-right */}
      <div aria-hidden="true" style={{
        position:     "fixed",
        inset:         0,
        zIndex:        -1,
        background:   `radial-gradient(ellipse 85% 52% at 58% 108%,
          rgba(218, 198, 235, 0.28) 0%,
          rgba(225, 210, 238, 0.10) 50%,
          transparent 70%
        )`,
        pointerEvents: "none",
      }} />
    </>
  );
}
