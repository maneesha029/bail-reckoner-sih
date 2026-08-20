import { useState } from "react";

// ─── Design tokens ───
// Pulled out of Landing.jsx / Login.jsx / JudgeDashboard.jsx /
// LegalAidDashboard.jsx / RosterTab.jsx / UndertrialView.jsx, which all
// redeclared an identical (or near-identical) copy of this object locally.
// Import TOKENS from here instead of redefining it per file.
export const TOKENS = {
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
  danger: "#B3261E",
  chakra: "#0B3558", // alias used by Landing.jsx's flag

  // Semantic aliases for case-status "seals". Every page that renders a
  // status circle (JudgeDashboard's CaseSeal, LegalAidDashboard's CaseSeal,
  // UndertrialView's CaseSeal) hand-rolled its own status→color map instead
  // of sharing one. IntakeScan.jsx already expects these names
  // (TOKENS.sealEligible / TOKENS.sealPending) — this is where they live now.
  sealEligible: "#0F7A32", // same value as TOKENS.green
  sealIneligible: "#B3261E", // same value as TOKENS.danger
  sealPending: "#B8860B", // same value as TOKENS.gold
};

export const FONTS = {
  display: "'Fraunces', 'Georgia', serif",
  body: "'IBM Plex Sans', 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

export const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap";

// Drop this once near the root of any top-level page (Landing, Login,
// JudgeDashboard, LegalAidDashboard, UndertrialView already do this
// individually — a page that mounts inside another, like IntakeScan or
// RosterTab, should NOT repeat it, since the parent already loaded the fonts).
export function FontImport() {
  return <style>{`@import url('${FONT_IMPORT_URL}');`}</style>;
}

// ─── Eyebrow ───
// Small saffron uppercase mono kicker. JudgeDashboard/LegalAidDashboard's
// versions render as a block-level <div> with marginBottom; Landing/Login's
// render as inline <span>. Keeping the <div> form (the majority — 2 of 3
// dashboard-style pages use it) and exposing `color` like LegalAidDashboard
// did, since RosterTab and the bond-waiver flag in LegalAidDashboard both
// need an off-saffron color.
export function Eyebrow({ children, color = TOKENS.saffron }) {
  return (
    <div
      style={{
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: "0.14em",
        color,
        textTransform: "uppercase",
        fontWeight: 500,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ─── Pill ───
// Identical across JudgeDashboard.jsx and LegalAidDashboard.jsx.
export function Pill({ color = TOKENS.inkSoft, children }) {
  return (
    <span
      style={{
        fontFamily: FONTS.mono,
        fontSize: 10.5,
        letterSpacing: "0.04em",
        color: TOKENS.paper,
        background: color,
        borderRadius: 2,
        padding: "3px 8px",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

// ─── ActionButton ───
// Two versions existed: JudgeDashboard's has a primary/danger/neutral
// variant system; LegalAidDashboard's is a single always-navy button with
// no variant prop (disabled just goes gray). JudgeDashboard's is the
// superset and is what IntakeScan.jsx already assumes (`variant="neutral"`),
// so that's the one kept here. LegalAidDashboard's plain `<ActionButton
// onClick disabled>` calls still work unchanged, since "primary" behaves
// the same as its old always-navy style.
const BUTTON_VARIANTS = {
  primary: { background: TOKENS.navy, color: TOKENS.paper, border: "none" },
  danger: { background: TOKENS.danger, color: TOKENS.paper, border: "none" },
  neutral: { background: TOKENS.paper, color: TOKENS.ink, border: `1px solid ${TOKENS.rule}` },
};

export function ActionButton({ onClick, disabled, variant = "primary", children }) {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONTS.mono,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.03em",
        borderRadius: 2,
        padding: "11px 22px",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
        ...v,
      }}
    >
      {children}
    </button>
  );
}

// ─── TabBar ───
// Identical across JudgeDashboard.jsx and LegalAidDashboard.jsx.
export function TabBar({ active, onChange, tabs }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 32, borderBottom: `1px solid ${TOKENS.rule}` }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            fontFamily: FONTS.mono,
            fontSize: 12,
            letterSpacing: "0.04em",
            padding: "10px 4px",
            marginRight: 28,
            marginBottom: -1,
            cursor: "pointer",
            background: "none",
            border: "none",
            color: active === t.id ? TOKENS.ink : TOKENS.inkSoft,
            borderBottom: active === t.id ? `2px solid ${TOKENS.saffron}` : "2px solid transparent",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── CaseSeal ───
// JudgeDashboard/LegalAidDashboard key off "eligible"/"ineligible"/"pending";
// UndertrialView keys off the raw backend statuses
// ("eligible_now", "not_yet_eligible", etc). Both maps are kept so either
// caller works without translating its status string first.
const SEAL_COLORS = {
  eligible: TOKENS.sealEligible,
  eligible_now: TOKENS.sealEligible,
  eligible_first_time_offender_rule: TOKENS.sealEligible,
  ineligible: TOKENS.sealIneligible,
  not_yet_eligible: TOKENS.sealIneligible,
  pending: TOKENS.sealPending,
  insufficient_data: TOKENS.sealPending,
};

export function CaseSeal({ status, size = 72 }) {
  const color = SEAL_COLORS[status] || TOKENS.inkSoft;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: size + 24, flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: `3px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: size * 0.07, borderRadius: "50%", border: `1px solid ${color}` }} />
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: size * 0.12,
            color,
            letterSpacing: "0.04em",
            textAlign: "center",
            textTransform: "uppercase",
          }}
        >
          {(status || "unknown").replace(/_/g, " ").split(" ")[0].slice(0, 3)}
        </span>
      </div>
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 10.5,
          color,
          marginTop: 8,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          textAlign: "center",
        }}
      >
        {status}
      </span>
    </div>
  );
}

// ─── AuditHistory ───
// Identical across JudgeDashboard.jsx and LegalAidDashboard.jsx (the latter
// added a special saffron pill color for actor_role === "judge").
export function AuditHistory({ entries }) {
  if (!entries) return null;
  if (entries.length === 0) {
    return <p style={{ fontSize: 13, color: TOKENS.inkSoft, fontStyle: "italic" }}>No recorded actions on this case yet.</p>;
  }
  return (
    <div>
      {entries.map((e) => (
        <div
          key={e.log_id}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
            borderBottom: `1px solid ${TOKENS.rule}`,
          }}
        >
          <Pill color={e.actor_role === "judge" ? TOKENS.saffron : TOKENS.inkSoft}>{e.actor_role}</Pill>
          <span style={{ fontSize: 13, color: TOKENS.ink }}>{e.action_type.replace(/_/g, " ")}</span>
          {e.action_payload?.reason && (
            <span style={{ fontSize: 12, color: TOKENS.inkSoft }}>— {e.action_payload.reason}</span>
          )}
          <span style={{ marginLeft: "auto", fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft }}>
            {new Date(e.timestamp).toLocaleString()}
          </span>
          {/* entry_hash proves this row is part of the tamper-evident chain -
              trust-access-layer computes it from the previous row's hash.
              Only JudgeDashboard rendered this; kept behind the optional
              chain so LegalAidDashboard's entries (which may not carry a
              hash) don't print "#undefined". */}
          {e.entry_hash && (
            <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.rule }} title={e.entry_hash}>
              #{e.entry_hash.slice(0, 6)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── WavingFlag ───
// Identical across Landing.jsx and Login.jsx, aside from the filter id
// ("flagRipple" vs "flagRippleLogin") needing to be unique per mount so two
// instances on the same page don't collide. Generates one from `idSuffix`.
export function WavingFlag({ height = 34, idSuffix = "" }) {
  const w = height * 1.5;
  const filterId = `flagRipple${idSuffix}`;
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
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.04" numOctaves="2" seed="4" result="noise">
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
      <g filter={`url(#${filterId})`}>
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

// ─── RoleCard ───
// Landing.jsx-only today, but lifted out since it's a clean reusable card
// pattern (hover-lift + top accent bar) other list pages may want later.
export function RoleCard({ eyebrowText, title, description, accent, onSelect }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        textAlign: "left",
        background: TOKENS.paper,
        border: `1px solid ${TOKENS.rule}`,
        borderTop: `4px solid ${accent}`,
        borderRadius: 2,
        padding: "30px 26px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 200,
        boxShadow: hover ? "0 14px 28px rgba(11, 53, 88, 0.14)" : "0 2px 10px rgba(11, 53, 88, 0.07)",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        outlineOffset: 3,
      }}
    >
      <Eyebrow>{eyebrowText}</Eyebrow>
      <h2 style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: TOKENS.ink, margin: 0 }}>
        {title}
      </h2>
      <p style={{ fontFamily: FONTS.body, fontSize: 14.5, lineHeight: 1.6, color: TOKENS.inkSoft, margin: 0, flex: 1 }}>
        {description}
      </p>
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: 12,
          fontWeight: 500,
          color: accent,
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