import ClarityLogo from "./ClarityLogo";

export default function TopLogo({ faded = false }) {
  return (
    <div
      style={{
        position:  "fixed",
        top:       24,
        left:      "50%",
        transform: "translateX(-50%)",
        zIndex:    100,
        pointerEvents: "none",
        display:        "flex",
        justifyContent: "center",
        alignItems:     "center",
      }}
    >
      <ClarityLogo size="sm" faded={faded} />
    </div>
  );
}
