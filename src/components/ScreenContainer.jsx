import ClarityLogo from "../components/ClarityLogo";

export default function ScreenContainer({
  children,
  logoAlign    = "left",
  logoOpacity  = 0.75,
  headerRight  = null,
  transparent  = false,   // true → no white card, no shadow; fullscreen atmosphere shows through
}) {
  return (
    <div
      style={{
        maxWidth:              560,
        margin:                "0 auto",
        padding:               "40px 24px 40px",
        minHeight:             "100vh",
        display:               "flex",
        flexDirection:         "column",
        justifyContent:        "flex-start",
        boxSizing:             "border-box",
        fontFamily:            "'Helvetica Neue', Helvetica, Arial, sans-serif",

        // Glass card — suppressed when transparent=true so the fixed
        // background gradient bleeds edge-to-edge on desktop
        background:            transparent ? "transparent"              : "rgba(255,255,255,0.82)",
        backdropFilter:        transparent ? "none"                     : "blur(48px) saturate(160%)",
        WebkitBackdropFilter:  transparent ? "none"                     : "blur(48px) saturate(160%)",
        boxShadow:             transparent ? "none"                     :
          "inset 0 0 0 0.5px rgba(255,255,255,0.85), " +
          "0 0 0 0.5px rgba(165,180,252,0.10), " +
          "0 8px 40px rgba(15,23,42,0.06)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display:        "flex",
          justifyContent: headerRight ? "space-between" : "flex-start",
          alignItems:     "center",
          marginBottom:   40,
        }}
      >
        <div style={{ opacity: logoOpacity, transition: "opacity 400ms ease" }}>
          <ClarityLogo size="sm" centered={false} />
        </div>

        {headerRight && <div>{headerRight}</div>}
      </div>

      {children}
    </div>
  );
}
