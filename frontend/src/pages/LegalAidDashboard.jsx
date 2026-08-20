import { useState } from "react";
import { checkEligibility, searchPrecedent, getProceduralRequirements, checkBondWaiver, getAuditLog } from "../api/client";
import RosterTab from "./RosterTab";
import CalendarTab from "./CalendarTab";
import IntakeScan from "./IntakeScan";

// ─── Design tokens — identical to Landing.jsx / Login.jsx ───
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

function Eyebrow({ children, color = TOKENS.saffron }) {
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

function ActionButton({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FONTS.mono,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.03em",
        color: TOKENS.paper,
        background: disabled ? TOKENS.inkSoft : TOKENS.navy,
        border: "none",
        borderRadius: 2,
        padding: "11px 22px",
        cursor: disabled ? "default" : "pointer",
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

// ─── Page-local components ───

function Docket({ cases, activeId, onSelect }) {
  return (
    <div style={{ borderRight: `1px solid ${TOKENS.rule}`, paddingRight: 20 }}>
      <Eyebrow>Docket — {cases.length} cases</Eyebrow>
      {cases.map((c) => (
        <button
          key={c.case_id}
          onClick={() => onSelect(c.case_id)}
          style={{
            display: "block", width: "100%", textAlign: "left", padding: "12px 0",
            borderTop: `1px solid ${TOKENS.rule}`, background: "none", border: "none",
            borderBottom: c.case_id === activeId ? `2px solid ${TOKENS.navy}` : "none",
            cursor: "pointer",
          }}
        >
          <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.inkSoft }}>
            {c.case_id}
          </div>
          <div style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 600, color: TOKENS.ink, marginTop: 2 }}>
            {c.offense || "Undertrial case"}
          </div>
        </button>
      ))}
    </div>
  );
}

// NEW: was only ever built into JudgeDashboard - legal aid/officers need to
// see the same decision history, especially the judge's manual_override
// entries. Without it this role has no way to know a decision was made.
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
          <Pill color={e.actor_role === "judge" ? TOKENS.saffron : TOKENS.inkSoft}>{e.actor_role}</Pill>
          <span style={{ fontSize: 13, color: TOKENS.ink }}>{e.action_type.replace(/_/g, " ")}</span>
          {e.action_payload?.reason && (
            <span style={{ fontSize: 12, color: TOKENS.inkSoft }}>— {e.action_payload.reason}</span>
          )}
          <span style={{ marginLeft: "auto", fontFamily: FONTS.mono, fontSize: 11, color: TOKENS.inkSoft }}>
            {new Date(e.timestamp).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// export default function LegalAidDashboard({ token, userId }) {
export default function LegalAidDashboard({ token, userId, role }) {
  const [tab, setTab] = useState("docket");
  const [caseId, setCaseId] = useState("");
  const [result, setResult] = useState(null);
  const [auditEntries, setAuditEntries] = useState(null);
  const [docket, setDocket] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadCase = async (idOverride) => {
    const id = idOverride ?? caseId;
    if (!id) return;
    setError("");
    setLoading(true);
    try {
      const [eligibility, precedent, procedural, bondWaiver] = await Promise.all([
        checkEligibility(id, token),
        searchPrecedent(id, { offense_category: "general", discretion_factors: [] }, token),
        getProceduralRequirements(id, token),
        checkBondWaiver(id, {}, token),
      ]);
      setResult({
        eligibility: eligibility.data, precedent: precedent.data,
        procedural: procedural.data, bondWaiver: bondWaiver.data,
      });
      setCaseId(id);
      setDocket((prev) => prev.some((c) => c.case_id === id) ? prev
        : [...prev, { case_id: id, offense: "Loaded case" }]);

      try {
        const log = await getAuditLog(id, token);
        setAuditEntries(log.data || []);
      } catch {
        setAuditEntries([]);
      }
    } catch (err) {
      setError(err.message || "Could not load this case.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const openCaseFromElsewhere = (id) => {
    setTab("docket");
    loadCase(id);
  };

  return (
    <div style={{
      background: TOKENS.paper, minHeight: "100vh", padding: "0px 48px 40px",
      fontFamily: FONTS.body, color: TOKENS.ink,
    }}>
      <style>{`@import url('${FONT_IMPORT_URL}');`}</style>

      <header style={{ marginBottom: 28, borderBottom: `1px solid ${TOKENS.rule}`, paddingBottom: 20, paddingTop: 20 }}>
        <Eyebrow>Bail Reckoner — Legal Aid Docket</Eyebrow>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 30, fontWeight: 700, margin: 0, color: TOKENS.ink }}>
          Case review
        </h1>
      </header>

      <TabBar
        active={tab}
        onChange={setTab}
        tabs={
          role === "jail_officer"
            ? [
                { id: "docket", label: "Docket" },
                { id: "roster", label: "Roster" },
                { id: "scan", label: "Scan FIR" },
                { id: "calendar", label: "Calendar" },
              ]
            : [
                { id: "docket", label: "My Case" },
                { id: "roster", label: "Roster" },
                { id: "calendar", label: "Calendar" },
              ]
        }
      />

      {tab === "roster" && <RosterTab onOpenCase={openCaseFromElsewhere} token={token} />}
      {tab === "scan" && role === "jail_officer" && <IntakeScan token={token} onCaseCreated={openCaseFromElsewhere} />}
      {tab === "calendar" && <CalendarTab token={token} userId={userId} />}

      {tab === "docket" && (
        <>
          <div style={{ display: "flex", gap: 12, marginBottom: 32, alignItems: "center" }}>
            <input
              value={caseId} onChange={(e) => setCaseId(e.target.value)}
              placeholder="e.g. case-001"
              style={{
                fontFamily: FONTS.mono, fontSize: 13, padding: "10px 14px",
                border: `1px solid ${TOKENS.rule}`, borderRadius: 2, background: TOKENS.paper,
                color: TOKENS.ink, flex: 1, maxWidth: 320,
              }}
            />
            <ActionButton onClick={() => loadCase()} disabled={loading}>
              {loading ? "Loading..." : "Open case"}
            </ActionButton>
          </div>

          {error && <p style={{ color: TOKENS.danger, fontSize: 13, marginBottom: 24 }}>{error}</p>}

          <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 32 }}>
            <Docket cases={docket} activeId={caseId} onSelect={(id) => loadCase(id)} />

            <div>
              {!result && !loading && (
                <p style={{ color: TOKENS.inkSoft, fontStyle: "italic" }}>
                  No case open. Enter a case ID above, or pick someone from the Roster tab.
                </p>
              )}

              {result && (
                <div style={{
                  display: "flex", gap: 28, background: TOKENS.paper,
                  border: `1px solid ${TOKENS.rule}`, borderRadius: 2, padding: 24,
                  boxShadow: "0 2px 10px rgba(11, 53, 88, 0.07)",
                }}>
                  <CaseSeal status={result.eligibility.eligibility_status} />

                  <div style={{ flex: 1 }}>
                    <section style={{ marginBottom: 24 }}>
                      <Eyebrow>Custody status</Eyebrow>
                      <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                        <strong>{result.eligibility.days_served}</strong> days served against a
                        threshold of <strong>{result.eligibility.days_required}</strong> days
                        ({result.eligibility.threshold_rule_applied.replace(/_/g, " ")}).
                      </p>
                    </section>

                    <section style={{ marginBottom: 24 }}>
                      <Eyebrow>Precedent</Eyebrow>
                      {result.precedent.results.map((r) => (
                        <p key={r.citation_id} style={{
                          fontSize: 14, lineHeight: 1.6, borderLeft: `2px solid ${TOKENS.saffron}`,
                          paddingLeft: 12, marginBottom: 10,
                        }}>
                          <em>{r.case_name}</em> — {r.citation_text}
                        </p>
                      ))}
                      <p style={{ fontSize: 12, color: TOKENS.inkSoft, fontStyle: "italic" }}>
                        {result.precedent.disclaimer}
                      </p>
                    </section>

                    <section style={{ marginBottom: 24 }}>
                      <Eyebrow>Procedural checklist</Eyebrow>
                      {result.procedural.procedural_steps.map((s) => (
                        <div key={s.step_number} style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.saffron }}>
                            {String(s.step_number).padStart(2, "0")}
                          </span>
                          <span style={{ fontSize: 14 }}>{s.description}</span>
                        </div>
                      ))}
                    </section>

                    {result.bondWaiver.is_flagged_for_waiver && (
                      <section style={{
                        borderTop: `2px solid ${TOKENS.saffron}`, marginTop: 14,
                        background: "#FFF6E8", padding: 16,
                      }}>
                        <Eyebrow color={TOKENS.saffron}>⚑ Flagged — indigent bond waiver review</Eyebrow>
                        <p style={{ fontSize: 13, color: TOKENS.inkSoft, margin: 0 }}>
                          {result.bondWaiver.reasoning_summary} ({result.bondWaiver.governing_section})
                        </p>
                      </section>
                    )}

                    {/* NEW: this section didn't exist before - it's the whole
                        point of this fix. Shows the judge's decision (and
                        every system check) to the legal aid / officer role. */}
                    <section style={{ borderTop: `1px solid ${TOKENS.rule}`, paddingTop: 20, marginTop: 24 }}>
                      <Eyebrow>Recorded actions on this case</Eyebrow>
                      <AuditHistory entries={auditEntries} />
                    </section>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}