import { useState } from "react";

// ─── Design tokens (self-contained — merge into ../components/designSystem if you keep a shared file) ───
const TOKENS = {
  paper: "#FFFFFF",
  navy: "#0B3558",
  navyDeep: "#072941",
  ink: "#16233A",
  inkSoft: "#57647A",
  rule: "#E3E7EC",
  ruleSoft: "#EEF1F4",
  saffron: "#FF9933",
  green: "#0F7A32",
  gold: "#B8860B",
  chakra: "#0B3558",
};

const FONTS = {
  display: "'Fraunces', 'Georgia', serif",
  body: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap";

function Eyebrow({ children }) {
  return (
    <span
      style={{
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: "0.16em",
        color: TOKENS.saffron,
        textTransform: "uppercase",
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

// ─── Waving Indian flag — SVG turbulence filter gives genuine cloth-like ripple ───
function WavingFlag({ height = 34 }) {
  const w = height * 1.5;
  return (
    <svg
      width={w}
      height={height + 10}
      viewBox={`0 0 ${w} ${height + 10}`}
      style={{ display: "block", flexShrink: 0 }}
      aria-label="Flag of India"
      role="img"
    >
      <defs>
        <filter id="flagRipple" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01 0.04"
            numOctaves="2"
            seed="4"
            result="noise"
          >
            <animate
              attributeName="baseFrequency"
              dur="6s"
              values="0.01 0.04;0.014 0.05;0.01 0.04"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter="url(#flagRipple)">
        <rect x="2" y="4" width={w - 4} height={(height - 8) / 3} fill={TOKENS.saffron} />
        <rect x="2" y={4 + (height - 8) / 3} width={w - 4} height={(height - 8) / 3} fill="#FFFFFF" />
        <rect x="2" y={4 + (2 * (height - 8)) / 3} width={w - 4} height={(height - 8) / 3} fill={TOKENS.green} />
        <circle cx={w / 2} cy={height / 2 + 4} r={(height - 8) / 6} fill="none" stroke={TOKENS.navy} strokeWidth="0.7" />
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          const cx = w / 2;
          const cy = height / 2 + 4;
          const r = (height - 8) / 6;
          const x2 = cx + r * Math.cos((angle * Math.PI) / 180);
          const y2 = cy + r * Math.sin((angle * Math.PI) / 180);
          return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke={TOKENS.navy} strokeWidth="0.5" />;
        })}
      </g>
    </svg>
  );
}

// ─── Chakra watermark — a large, near-invisible Ashoka Chakra sitting
// behind the role cards, now with a faint saffron wash above it and a
// faint green wash below it (echoing the flag's tricolour). Both washes
// sit in their own SVG layer, well under the chakra's z-index, and use
// radial gradients fading to transparent so there's no hard edge.
// Purely decorative (aria-hidden), reuses the same 24-spoke construction
// as WavingFlag's badge but static and much bigger. Positioned absolutely
// within a `position: relative` ancestor so it never affects document
// flow or card layout. ───
function ChakraWatermark({ size = 640 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        opacity: 0.3,
        zIndex: 0,
      }}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={TOKENS.chakra} strokeWidth={size * 0.06} />
      <circle cx={cx} cy={cy} r={r * 0.06} fill="none" stroke={TOKENS.chakra} strokeWidth={size * 0.006} />
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i * 360) / 24;
        const x2 = cx + r * Math.cos((angle * Math.PI) / 180);
        const y2 = cy + r * Math.sin((angle * Math.PI) / 180);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke={TOKENS.chakra}
            strokeWidth={size * 0.003}
          />
        );
      })}
    </svg>
  );
}

// ─── Full-bleed tricolour wash — sits behind everything in the hero
// section, spanning the entire page width (not just the chakra's
// bounding box). Saffron fades in from the top edge, green fades in
// from the bottom edge, both to fully transparent at ~55% height so
// they never meet or muddy in the middle. Purely decorative. ───
function HeroWash() {
  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "55%",
          background: `linear-gradient(180deg, ${TOKENS.saffron}0D 0%, ${TOKENS.saffron}00 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "55%",
          background: `linear-gradient(0deg, ${TOKENS.green}0D 0%, ${TOKENS.green}00 100%)`,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
    </>
  );
}

const ROLES = [
  {
    id: "undertrial",
    ref: "ACCESS — UNDERTRIAL",
    title: "Undertrial",
    description: "Check your case status and what it means for your release, in plain language.",
    accent: TOKENS.saffron,
  },
  {
    id: "legal_aid",
    ref: "ACCESS — LEGAL AID",
    title: "Legal Aid / Jail Officer",
    description: "Review your docket: eligibility, precedent, procedural checklist, and bond-waiver flags.",
    accent: TOKENS.navy,
  },
  {
    id: "judge",
    ref: "ACCESS — JUDICIAL",
    title: "Judicial Authority",
    description: "Reference material for cases before you. No recommendation is made — the determination is yours.",
    accent: TOKENS.green,
  },
];

function RoleCard({ role, onSelect }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={() => onSelect(role.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        textAlign: "left",
        background: TOKENS.paper,
        border: `1px solid ${TOKENS.rule}`,
        borderTop: `4px solid ${role.accent}`,
        borderRadius: 2,
        padding: "30px 26px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 200,
        boxShadow: hover
          ? "0 14px 28px rgba(11, 53, 88, 0.14)"
          : "0 2px 10px rgba(11, 53, 88, 0.07)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        outlineOffset: 3,
      }}
    >
      <Eyebrow>{role.ref}</Eyebrow>
      <h2
        style={{
          fontFamily: FONTS.display,
          fontSize: 22,
          fontWeight: 700,
          color: TOKENS.ink,
          margin: 0,
        }}
      >
        {role.title}
      </h2>
      <p
        style={{
          fontFamily: FONTS.body,
          fontSize: 14.5,
          lineHeight: 1.6,
          color: TOKENS.inkSoft,
          margin: 0,
          flex: 1,
        }}
      >
        {role.description}
      </p>
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 12,
          fontWeight: 500,
          color: role.accent,
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ENTER →
      </span>
    </button>
  );
}

function Header({ onLogin }) {
  return (
    <header
      style={{
        background: TOKENS.paper,
        borderBottom: `1px solid ${TOKENS.rule}`,
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontFamily: FONTS.display,
            fontSize: 19,
            fontWeight: 700,
            color: TOKENS.navy,
          }}
        >
          Bail-Reckoner
        </span>
        <WavingFlag height={30} />
      </div>

      <button
        onClick={onLogin}
        style={{
          fontFamily: FONTS.mono,
          fontSize: 13,
          fontWeight: 500,
          letterSpacing: "0.03em",
          color: TOKENS.paper,
          background: TOKENS.navy,
          border: "none",
          borderRadius: 2,
          padding: "10px 22px",
          cursor: "pointer",
        }}
      >
        LOGIN
      </button>
    </header>
  );
}

export default function Landing({ onSelectRole, onLogin }) {
  return (
    <div
      style={{
        position: "relative",
        background: TOKENS.paper,
        minHeight: "100vh",
        fontFamily: FONTS.body,
        overflow: "hidden",
      }}
    >
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <HeroWash />

      <div style={{ position: "relative", zIndex: 1 }}>
        <Header onLogin={onLogin} />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 24px 80px",
          }}
        >
          <ChakraWatermark size={640} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, width: "100%" }}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 48,
              paddingBottom: 32,
              borderBottom: `1px solid ${TOKENS.rule}`,
            }}
          >
            <Eyebrow>National Bail Reckoning System</Eyebrow>
            <h1
              style={{
                fontFamily: FONTS.display,
                fontSize: 38,
                fontWeight: 700,
                color: TOKENS.ink,
                margin: "10px 0 12px",
              }}
            >
              A record of where each case stands
            </h1>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 15,
                color: TOKENS.inkSoft,
                maxWidth: 460,
                margin: "0 auto",
              }}
            >
              Select how you're accessing the docket. Every action here is logged.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {ROLES.map((role) => (
              <RoleCard key={role.id} role={role} onSelect={onSelectRole} />
            ))}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}