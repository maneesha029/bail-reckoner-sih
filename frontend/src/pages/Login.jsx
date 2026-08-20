import { useState } from "react";
import { TOKENS, FONTS } from "../components/designSystem";
import { login, caseLogin } from "../api/client";

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
      <label style={{ fontFamily: FONTS.mono, fontSize: 11 }}>USERNAME</label>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={{ display: "block", width: "100%", padding: 12, marginTop: 6, marginBottom: 20, border: `1px solid ${TOKENS.rule}` }}
        autoFocus
      />
      <label style={{ fontFamily: FONTS.mono, fontSize: 11 }}>PASSWORD</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", padding: 12, marginTop: 6, marginBottom: 20, border: `1px solid ${TOKENS.rule}` }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", padding: 14, background: TOKENS.ink, color: TOKENS.paper,
          border: "none", fontFamily: FONTS.mono, letterSpacing: "0.06em", cursor: "pointer",
        }}
      >
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
      <label style={{ fontFamily: FONTS.mono, fontSize: 11 }}>YOUR CASE ID</label>
      <p style={{ fontSize: 12.5, color: TOKENS.inkSoft, margin: "4px 0 6px" }}>
        Printed on the paperwork given to you or your family — e.g. <code>case-014</code>.
        No password is needed.
      </p>
      <input
        value={caseId}
        onChange={(e) => setCaseId(e.target.value)}
        placeholder="case-014"
        style={{
          display: "block", width: "100%", padding: 12, marginTop: 6, marginBottom: 20,
          border: `1px solid ${TOKENS.rule}`, fontFamily: FONTS.mono,
        }}
        autoFocus
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", padding: 14, background: TOKENS.seal, color: TOKENS.paper,
          border: "none", fontFamily: FONTS.mono, letterSpacing: "0.06em", cursor: "pointer",
        }}
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
    <div style={{ minHeight: "100vh", display: "flex", background: TOKENS.paper }}>
      <div style={{ flex: 1, background: TOKENS.ink, padding: 48, color: TOKENS.paper }}>
        <div style={{ fontFamily: FONTS.mono, fontSize: 12, color: TOKENS.seal, letterSpacing: "0.08em" }}>
          BAIL RECKONER
        </div>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 40, marginTop: 16 }}>
          A clearer record of every case.
        </h1>
        <p style={{ opacity: 0.8, marginTop: 16 }}>
          Secure access to case status, procedural requirements, and release guidance.
        </p>
      </div>

      <div style={{ flex: 1, padding: 64, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 480 }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${TOKENS.rule}` }}>
          {[
            { id: "staff", label: "Judge / Legal Aid / Jail Officer" },
            { id: "undertrial", label: "Undertrial" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setMode(t.id); setError(""); }}
              style={{
                fontFamily: FONTS.mono, fontSize: 11.5, letterSpacing: "0.04em",
                padding: "10px 4px", marginRight: 24, cursor: "pointer",
                background: "none", border: "none",
                color: mode === t.id ? TOKENS.ink : TOKENS.inkSoft,
                borderBottom: mode === t.id ? `2px solid ${TOKENS.seal}` : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <h2 style={{ fontFamily: FONTS.display, fontSize: 26, margin: "0 0 6px" }}>
          {mode === "staff" ? "Sign in to the docket" : "Check your case status"}
        </h2>
        <p style={{ color: TOKENS.inkSoft, marginBottom: 24, fontSize: 14 }}>
          {mode === "staff"
            ? "Use the credentials assigned to your account."
            : "This is not legal advice — speak with your legal aid provider about your case."}
        </p>

        {mode === "staff"
          ? <StaffLoginForm onLogin={onLogin} setError={setError} setLoading={setLoading} loading={loading} />
          : <UndertrialLoginForm onLogin={onLogin} setError={setError} setLoading={setLoading} loading={loading} />}

        {error && (
          <div style={{ color: TOKENS.danger, marginTop: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <button
          onClick={onBack}
          style={{ marginTop: 24, background: "none", border: "none", color: TOKENS.inkSoft, cursor: "pointer", fontFamily: FONTS.mono, fontSize: 12 }}
        >
          ← BACK TO ROLES
        </button>
      </div>
    </div>
  );
}
