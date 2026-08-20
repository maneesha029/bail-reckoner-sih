import { useState } from "react";
import {
  checkEligibility, searchPrecedent, getProceduralRequirements,
  overrideEligibility, getAuditLog,
} from "../api/client";
import RosterTab from "./RosterTab";

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

const FONT_IMPORT_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap";

// ─── Shared bits (recreated locally to match Landing.jsx's theme — move into ../components/designSystem when ready) ───

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

function Pill({ color = TOKENS.inkSoft, children }) {
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

const BUTTON_VARIANTS = {
  primary: { background: TOKENS.navy, color: TOKENS.paper, border: "none" },
  danger: { background: TOKENS.danger, color: TOKENS.paper, border: "none" },
  neutral: { background: TOKENS.paper, color: TOKENS.ink, border: `1px solid ${TOKENS.rule}` },
};

function ActionButton({ onClick, disabled, variant = "neutral", children }) {
  const v = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.neutral;
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

function TabBar({ active, onChange, tabs }) {
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

const SEAL_COLORS = {
  eligible: TOKENS.green,
  ineligible: TOKENS.danger,
  pending: TOKENS.gold,
};

function CaseSeal({ status }) {
  const color = SEAL_COLORS[status] || TOKENS.inkSoft;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 96, flexShrink: 0 }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          border: `3px solid ${color}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 5, borderRadius: "50%", border: `1px solid ${color}` }} />
        <span style={{ fontFamily: FONTS.mono, fontSize: 9, color, letterSpacing: "0.04em", textAlign: "center" }}>
          {(status || "unknown").slice(0, 3).toUpperCase()}
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

function AuditHistory({ entries }) {
  if (!entries) return null;
  if (entries.length === 0) {
    return <p style={{ fontSize: 13, color: TOKENS.inkSoft, fontStyle: "italic" }}>No recorded actions on this case yet.</p>;
  }
  return (
    <div>
      {entries.map((e) => (
        <div key={e.log_id} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
          borderBottom: `1px solid ${TOKENS.rule}`,
        }}>
          <Pill color={TOKENS.saffron}>{e.actor_role}</Pill>
          <span style={{ fontSize: 13, color: TOKENS.ink }}>{e.action_type.replace(/_/g, " ")}</span>
          {e.action_payload?.reason && (
            <span style={{ fontSize: 12, color: TOKENS.inkSoft }}>— {e.action_payload.reason}</span>
          )}
          <span style={{ marginLeft: "auto", fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft }}>
            {new Date(e.timestamp).toLocaleString()}
          </span>
          {/* entry_hash proves this row is part of the tamper-evident chain -
              trust-access-layer computes it from the previous row's hash. */}
          <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: TOKENS.rule }} title={e.entry_hash}>
            #{e.entry_hash?.slice(0, 6)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function JudgeDashboard({ token, userId, role }) {
  const [tab, setTab] = useState("reference");
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);
  const [auditEntries, setAuditEntries] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decisionInFlight, setDecisionInFlight] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const refreshAuditLog = async (id) => {
    try {
      const log = await getAuditLog(id, token);
      setAuditEntries(log.data || []);
    } catch {
      setAuditEntries([]);
    }
  };

  const loadCase = async (idOverride) => {
    const id = idOverride ?? caseId;
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const [eligibility, precedent, procedural] = await Promise.all([
        checkEligibility(id, token),
        searchPrecedent(id, { offense_category: "general", discretion_factors: ["flight_risk", "witness_influence"] }, token),
        getProceduralRequirements(id, token),
      ]);
      setResult({ eligibility: eligibility.data, precedent: precedent.data, procedural: procedural.data });
      setCaseId(id);
      await refreshAuditLog(id);
    } catch (err) {
      setError(err.message || "Could not load this case.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const openCaseFromElsewhere = (id) => {
    setTab("reference");
    loadCase(id);
  };

  // The real backend has no formal "grant/deny/send-back" field - /override
  // takes a free-text reason. We prefix it so it's still clearly a decision
  // when read back in the audit trail.
  const takeAction = async (label) => {
    setDecisionInFlight(true);
    setError("");
    try {
      const reason = note ? `${label}. ${note}` : label;
      await overrideEligibility(caseId, userId, role, reason, token);
      setNote("");
      await refreshAuditLog(caseId);
    } catch (err) {
      setError(err.message || "Could not record the decision. It was not saved.");
    } finally {
      setDecisionInFlight(false);
    }
  };

  return (
    <div style={{
      background: TOKENS.paper, minHeight: "100vh", padding: "0px 48px 40px",
      fontFamily: FONTS.body, color: TOKENS.ink,
    }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <header style={{ marginBottom: 28, borderBottom: `1px solid ${TOKENS.rule}`, paddingBottom: 20, paddingTop: 20 }}>
        <Eyebrow>Bail Reckoner — Judicial Reference</Eyebrow>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 30, fontWeight: 700, margin: 0, color: TOKENS.ink }}>
          Case reference
        </h1>
        <p style={{ fontSize: 13, color: TOKENS.inkSoft, marginTop: 6 }}>
          Reference material only. No recommendation is made — final determination rests with the presiding judicial authority.
        </p>
      </header>

      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "reference", label: "Case Reference" },
          { id: "roster", label: "Roster" },
        ]}
      />

      {tab === "roster" && <RosterTab onOpenCase={openCaseFromElsewhere} token={token} />}

      {tab === "reference" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <input
              value={caseId} onChange={(e) => setCaseId(e.target.value)}
              placeholder="e.g. case-001"
              style={{
                fontFamily: FONTS.mono, fontSize: 13, padding: "10px 14px",
                border: `1px solid ${TOKENS.rule}`, borderRadius: 2, background: TOKENS.paper,
                color: TOKENS.ink, flex: 1, maxWidth: 320,
              }}
            />
            <ActionButton variant="primary" onClick={() => loadCase()} disabled={loading}>
              {loading ? "Loading..." : "Load reference"}
            </ActionButton>
          </div>

          {error && <p style={{ color: TOKENS.danger, fontSize: 13, marginBottom: 24 }}>{error}</p>}
          {!result && !loading && <p style={{ color: TOKENS.inkSoft, fontStyle: "italic" }}>No case loaded.</p>}

          {result && (
            <div style={{
              display: "flex", gap: 28, background: TOKENS.paper,
              border: `1px solid ${TOKENS.rule}`, borderRadius: 2, padding: 24,
              boxShadow: "0 2px 10px rgba(11, 53, 88, 0.07)",
            }}>
              <CaseSeal status={result.eligibility.eligibility_status} />
              <div style={{ flex: 1 }}>
                <section style={{ marginBottom: 24 }}>
                  <Eyebrow>Statutory time-served calculation</Eyebrow>
                  <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                    {result.eligibility.days_served} of {result.eligibility.days_required} required days served
                    ({result.eligibility.threshold_rule_applied.replace(/_/g, " ")}).
                  </p>
                </section>

                <section style={{ marginBottom: 24 }}>
                  <Eyebrow>Relevant precedent — flight risk &amp; witness influence</Eyebrow>
                  {result.precedent.results.map((r) => (
                    <p key={r.citation_id} style={{
                      fontSize: 14, lineHeight: 1.6, borderLeft: `2px solid ${TOKENS.saffron}`,
                      paddingLeft: 12, marginBottom: 10,
                    }}>
                      <em>{r.case_name}</em> — {r.citation_text}
                    </p>
                  ))}
                </section>

                <section style={{ marginBottom: 28 }}>
                  <Eyebrow>Procedural summary</Eyebrow>
                  <p style={{ fontSize: 14, margin: 0 }}>
                    {result.procedural.bond_type.replace(/_/g, " ")} · ₹{result.procedural.estimated_fine_amount_inr}
                  </p>
                </section>

                <section style={{ borderTop: `1px solid ${TOKENS.rule}`, paddingTop: 20, marginBottom: 24 }}>
                  <Eyebrow>Record a decision</Eyebrow>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note / reasoning"
                    style={{
                      fontFamily: FONTS.body, fontSize: 13, padding: "10px 14px",
                      border: `1px solid ${TOKENS.rule}`, borderRadius: 2, color: TOKENS.ink,
                      width: "100%", maxWidth: 480, marginBottom: 12, boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <ActionButton variant="primary" disabled={decisionInFlight} onClick={() => takeAction("Bail granted")}>
                      Grant Bail
                    </ActionButton>
                    <ActionButton variant="danger" disabled={decisionInFlight} onClick={() => takeAction("Bail denied")}>
                      Deny
                    </ActionButton>
                    <ActionButton variant="neutral" disabled={decisionInFlight} onClick={() => takeAction("Sent back for review")}>
                      Send Back for Review
                    </ActionButton>
                  </div>
                </section>

                <section>
                  <Eyebrow>Recorded actions on this case</Eyebrow>
                  <AuditHistory entries={auditEntries} />
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}