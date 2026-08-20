import { useEffect, useState } from "react";
import { getCases } from "../api/client";

// ─── Design tokens — identical to Landing.jsx / LegalAidDashboard.jsx ───
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

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: FONTS.mono,
        fontSize: 11,
        letterSpacing: "0.14em",
        color: TOKENS.saffron,
        textTransform: "uppercase",
        fontWeight: 500,
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

const AVATAR_PALETTE = [TOKENS.navy, TOKENS.saffron, TOKENS.green, TOKENS.gold, TOKENS.navyDeep];

function Avatar({ name, size = 44 }) {
  const initials = (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
  const idx = (name || "").length % AVATAR_PALETTE.length;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: AVATAR_PALETTE[idx],
        color: TOKENS.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.mono,
        fontSize: size * 0.36,
        fontWeight: 500,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

export default function RosterTab({ onOpenCase, token }) {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCases(token)
      .then((res) => setRoster(res.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div>
      <Eyebrow>All persons — {roster.length} on record</Eyebrow>
      <p style={{ fontSize: 12, color: TOKENS.inkSoft, marginBottom: 20, fontStyle: "italic" }}>
        Live case directory from the eligibility service.
      </p>
      {loading && <p style={{ fontSize: 13, color: TOKENS.inkSoft }}>Loading cases...</p>}
      {error && <p style={{ fontSize: 13, color: TOKENS.danger }}>{error}</p>}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: 16,
        }}
      >
        {roster.map((p) => (
          <button
            key={p.case_id}
            onClick={() => onOpenCase(p.case_id)}
            style={{
              textAlign: "left",
              background: TOKENS.paper,
              border: `1px solid ${TOKENS.rule}`,
              borderTop: `3px solid ${TOKENS.navy}`,
              borderRadius: 2,
              padding: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 2px 10px rgba(11, 53, 88, 0.07)",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 10px 22px rgba(11, 53, 88, 0.13)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 10px rgba(11, 53, 88, 0.07)";
            }}
          >
            <Avatar name={p.name} size={44} />
            <div>
              <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 600, color: TOKENS.ink }}>
                {p.name}
              </div>
              <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft }}>
                {p.case_id}
              </div>
              <div style={{ fontSize: 12, color: TOKENS.inkSoft, marginTop: 4 }}>
                {p.offense}
                {p.is_compoundable && (
                  <span style={{ marginLeft: 6, color: TOKENS.inkSoft, fontStyle: "italic" }}>
                    · compoundable
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}