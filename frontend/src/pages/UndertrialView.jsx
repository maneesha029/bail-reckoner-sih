import { useEffect, useState } from "react";
import { checkEligibility } from "../api/client";

// ─── Design tokens — identical to Landing.jsx / other dashboards ───
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

const SEAL_COLORS = {
  eligible: TOKENS.green,
  eligible_now: TOKENS.green,
  eligible_first_time_offender_rule: TOKENS.green,
  not_yet_eligible: TOKENS.danger,
  insufficient_data: TOKENS.gold,
};

function CaseSeal({ status, size = 96 }) {
  const color = SEAL_COLORS[status] || TOKENS.inkSoft;
  return (
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
        flexShrink: 0,
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
        {(status || "unknown").replace(/_/g, " ").split(" ")[0]}
      </span>
    </div>
  );
}

const PLAIN_LANGUAGE = {
  eligible_now: "You may already qualify for release. Your legal aid contact has been notified.",
  eligible_first_time_offender_rule: "As this may be your first offense, you may already qualify for release under a shorter waiting period. Your legal aid contact has been notified.",
  not_yet_eligible: "You do not yet qualify for automatic release, based on time served so far.",
  insufficient_data: "We don't have enough information yet to check your status. Please speak with your legal aid contact.",
};

// caseId comes from the case-login token itself, so this view loads
// automatically on mount and only ever shows the case tied to that token.
// There is deliberately no way to look up any other case from here - an
// undertrial's session should never be able to browse or search for
// someone else's name, case ID, offense, or status.
export default function UndertrialView({ token, caseId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!caseId);

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    checkEligibility(caseId, token)
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.message || "Could not load this case status."))
      .finally(() => setLoading(false));
  }, [caseId, token]);

  return (
    <div style={{ background: TOKENS.paper, minHeight: "100vh", fontFamily: FONTS.body, color: TOKENS.ink }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0px 24px 40px" }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 700, marginTop: 20, marginBottom: 6, color: TOKENS.ink }}>
          Your case status
        </h1>
        <p style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.inkSoft, marginBottom: 24 }}>
          {caseId || "No case selected"}
        </p>

        {loading && <p style={{ color: TOKENS.inkSoft, fontStyle: "italic" }}>Loading your case…</p>}
        {error && <p style={{ color: TOKENS.danger }}>{error}</p>}

        {result && !loading && (
          <div
            style={{
              textAlign: "center",
              border: `1px solid ${TOKENS.rule}`,
              borderTop: `4px solid ${TOKENS.navy}`,
              borderRadius: 2,
              padding: "32px 26px",
              boxShadow: "0 2px 10px rgba(11, 53, 88, 0.07)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <CaseSeal status={result.eligibility_status} size={110} />
            </div>
            <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
              {PLAIN_LANGUAGE[result.eligibility_status] || PLAIN_LANGUAGE.insufficient_data}
            </p>
            <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
              This is not legal advice. Please speak with your legal aid provider about your case.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}