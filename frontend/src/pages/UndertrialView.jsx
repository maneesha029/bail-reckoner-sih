import { useEffect, useState } from "react";
import { checkEligibility } from "../api/client";
import { TOKENS, FONTS, CaseSeal } from "../components/designSystem";

const PLAIN_LANGUAGE = {
  eligible_now: "You may already qualify for release. Your legal aid contact has been notified.",
  eligible_first_time_offender_rule: "As this may be your first offense, you may already qualify for release under a shorter waiting period. Your legal aid contact has been notified.",
  not_yet_eligible: "You do not yet qualify for automatic release, based on time served so far.",
  insufficient_data: "We don't have enough information yet to check your status. Please speak with your legal aid contact.",
};

// caseId now comes from the case-login token itself, so this view no
// longer asks for it a second time - it loads automatically on mount.
export default function UndertrialView({ token, caseId }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!caseId) { setLoading(false); return; }
    checkEligibility(caseId, token)
      .then((res) => setResult(res.data))
      .catch((err) => setError(err.message || "Could not load your case status."))
      .finally(() => setLoading(false));
  }, [caseId, token]);

  return (
    <div style={{
      background: TOKENS.paper, minHeight: "100vh", padding: "32px 24px",
      fontFamily: FONTS.body, color: TOKENS.ink, maxWidth: 480, margin: "0 auto",
    }}>
      <h1 style={{ fontFamily: FONTS.display, fontSize: 26, fontWeight: 700, marginBottom: 6 }}>
        Your case status
      </h1>
      <p style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.inkSoft, marginBottom: 28 }}>
        {caseId}
      </p>

      {loading && <p style={{ color: TOKENS.inkSoft, fontStyle: "italic" }}>Loading your case…</p>}
      {error && <p style={{ color: TOKENS.danger }}>{error}</p>}

      {result && (
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <CaseSeal status={result.eligibility_status} size={110} />
          </div>
          <p style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 20 }}>
            {PLAIN_LANGUAGE[result.eligibility_status] || PLAIN_LANGUAGE.insufficient_data}
          </p>
          <p style={{ fontSize: 13, color: TOKENS.inkSoft }}>
            This is not legal advice. Please speak with your legal aid provider about your case.
          </p>
        </div>
      )}
    </div>
  );
}
