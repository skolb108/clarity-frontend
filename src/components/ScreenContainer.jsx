import ClarityLogo from "../components/ClarityLogo";

/*
  ScreenContainer — updated to be always transparent.
  The global background (mint/peach/lavender) is set on body via index.css.
  No more white card, no border, no shadow on any screen.
*/
export default function ScreenContainer({
  children,
  logoAlign    = "left",
  logoOpacity  = 0.75,
  headerRight  = null,
}) {
  return (
    <div
      style={{
        maxWidth:       560,
        margin:         "0 auto",
        padding:        "40px 24px 40px",
        minHeight:      "100vh",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "flex-start",
        boxSizing:      "border-box",
        fontFamily:     "'Helvetica Neue', Helvetica, Arial, sans-serif",
        // Always transparent — background comes from body/html globally
        background:     "transparent",
      }}
    >
      {/* Header row */}
      <div style={{
        display:        "flex",
        justifyContent: headerRight ? "space-between" : "flex-start",
        alignItems:     "center",
        marginBottom:   40,
      }}>
        <div style={{ opacity: logoOpacity, transition: "opacity 400ms ease" }}>
          <ClarityLogo size="sm" centered={false} />
        </div>
        {headerRight && <div>{headerRight}</div>}
      </div>

      {children}
    </div>
  );
}
