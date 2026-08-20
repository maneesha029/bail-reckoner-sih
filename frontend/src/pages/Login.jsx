import { useState } from "react";
import { login, caseLogin } from "../api/client";

// ─── Design tokens — identical to Landing.jsx ───
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
  danger: "#B3261E",
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

// ─── Waving Indian flag — identical treatment to Landing.jsx ───
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
        <filter id="flagRippleLogin" x="-20%" y="-20%" width="140%" height="140%">
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
      <g filter="url(#flagRippleLogin)">
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

// ─── Header — identical to Landing.jsx ───
function Header({ onBack }) {
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
        <span style={{ fontFamily: FONTS.display, fontSize: 19, fontWeight: 700, color: TOKENS.navy }}>
          Bail-Reckoner
        </span>
        <WavingFlag height={30} />
      </div>

      <button
        onClick={onBack}
        style={{
          fontFamily: FONTS.mono,
          fontSize: 12,
          letterSpacing: "0.03em",
          color: TOKENS.inkSoft,
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        ← BACK TO ROLES
      </button>
    </header>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 12,
  marginTop: 6,
  marginBottom: 20,
  border: `1px solid ${TOKENS.rule}`,
  borderRadius: 2,
  fontFamily: FONTS.body,
  fontSize: 14,
  color: TOKENS.ink,
  boxSizing: "border-box",
};

const primaryButtonStyle = {
  width: "100%",
  padding: 14,
  background: TOKENS.navy,
  color: TOKENS.paper,
  border: "none",
  borderRadius: 2,
  fontFamily: FONTS.mono,
  fontSize: 13,
  letterSpacing: "0.06em",
  cursor: "pointer",
};

function StaffLoginForm({ onLogin, setError, setLoading, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.success) {
        onLogin({
          access_token: res.data.access_token,
          role: res.data.role,
          user_id: res.data.user_id,
          username,
        });
      } else {
        setError(res.error?.message || "Login failed");
      }
    } catch (err) {
      setError(err.message || "Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft, letterSpacing: "0.06em" }}>
        USERNAME
      </label>
      <input value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} autoFocus />

      <label style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft, letterSpacing: "0.06em" }}>
        PASSWORD
      </label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <button type="submit" disabled={loading} style={primaryButtonStyle}>
        {loading ? "SIGNING IN..." : "SIGN IN"}
      </button>
    </form>
  );
}

function UndertrialLoginForm({ onLogin, setError, setLoading, loading }) {
  const [caseId, setCaseId] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!caseId.trim()) return;
    setLoading(true);
    try {
      const res = await caseLogin(caseId.trim());
      if (res.success) {
        onLogin({
          access_token: res.data.access_token,
          role: res.data.role,
          case_id: res.data.case_id,
        });
      } else {
        setError(res.error?.message || "That case ID was not found.");
      }
    } catch (err) {
      setError(err.message || "Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft, letterSpacing: "0.06em" }}>
        YOUR CASE ID
      </label>
      <p style={{ fontSize: 12.5, color: TOKENS.inkSoft, margin: "4px 0 6px" }}>
        Printed on the paperwork given to you or your family — e.g. <code>case-014</code>.
        No password is needed.
      </p>
      <input
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
        placeholder="case-014"
        style={{ ...inputStyle, fontFamily: FONTS.mono }}
        autoFocus
      />

      <button
        type="submit"
        disabled={loading}
        style={{ ...primaryButtonStyle, background: TOKENS.saffron, color: TOKENS.navyDeep }}
      >
        {loading ? "CHECKING..." : "VIEW MY CASE STATUS"}
      </button>
    </form>
  );
}

export default function Login({ onLogin, onBack }) {
  const [mode, setMode] = useState("staff");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ background: TOKENS.paper, minHeight: "100vh", fontFamily: FONTS.body }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <Header onBack={onBack} />

      <div style={{ display: "flex", justifyContent: "center", padding: "60px 24px 80px" }}>
        <div style={{ maxWidth: 460, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <Eyebrow>Secure Sign-In</Eyebrow>
            <h1
              style={{
                fontFamily: FONTS.display,
                fontSize: 32,
                fontWeight: 700,
                color: TOKENS.ink,
                margin: "10px 0 12px",
              }}
            >
              A clearer record of every case
            </h1>
            <p style={{ fontFamily: FONTS.body, fontSize: 14.5, color: TOKENS.inkSoft, margin: 0 }}>
              Secure access to case status, procedural requirements, and release guidance.
            </p>
          </div>

          <div
            style={{
              background: TOKENS.paper,
              border: `1px solid ${TOKENS.rule}`,
              borderTop: `4px solid ${TOKENS.navy}`,
              borderRadius: 2,
              padding: "32px 30px",
              boxShadow: "0 2px 10px rgba(11, 53, 88, 0.07)",
            }}
          >
            <div style={{ display: "flex", gap: 4, marginBottom: 26, borderBottom: `1px solid ${TOKENS.rule}` }}>
              {[
                { id: "staff", label: "Judge / Legal Aid / Officer" },
                { id: "undertrial", label: "Undertrial" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setMode(t.id);
                    setError("");
                  }}
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 11.5,
                    letterSpacing: "0.04em",
                    padding: "10px 4px",
                    marginRight: 22,
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    color: mode === t.id ? TOKENS.ink : TOKENS.inkSoft,
                    borderBottom: mode === t.id ? `2px solid ${TOKENS.saffron}` : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <h2 style={{ fontFamily: FONTS.display, fontSize: 22, margin: "0 0 6px", color: TOKENS.ink }}>
              {mode === "staff" ? "Sign in to the docket" : "Check your case status"}
            </h2>
            <p style={{ color: TOKENS.inkSoft, marginBottom: 22, fontSize: 13.5 }}>
              {mode === "staff"
                ? "Use the credentials assigned to your account."
                : "This is not legal advice — speak with your legal aid provider about your case."}
            </p>

            {mode === "staff" ? (
              <StaffLoginForm onLogin={onLogin} setError={setError} setLoading={setLoading} loading={loading} />
            ) : (
              <UndertrialLoginForm onLogin={onLogin} setError={setError} setLoading={setLoading} loading={loading} />
            )}

            {error && <div style={{ color: TOKENS.danger, marginTop: 16, fontSize: 14 }}>{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}