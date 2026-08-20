import { useState } from "react";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import LegalAidDashboard from "./pages/LegalAidDashboard";
import JudgeDashboard from "./pages/JudgeDashboard";
import UndertrialView from "./pages/UndertrialView";
import { TOKENS, FONTS, WavingFlag } from "./components/designSystem";

// Same visual language as Landing.jsx's own Header (wordmark + waving flag,
// sticky, light background) rather than the old dark BackBar. SWITCH ROLE
// sits where Landing's LOGIN button sits, since this is effectively the
// signed-in equivalent of that same top-right action slot.
function Header({ label, username, onSwitchRole }) {
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
        <WavingFlag height={30} idSuffix="App" />
        {label && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              letterSpacing: "0.08em",
              color: TOKENS.inkSoft,
              textTransform: "uppercase",
              marginLeft: 8,
              paddingLeft: 12,
              borderLeft: `1px solid ${TOKENS.rule}`,
            }}
          >
            {label}
          </span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        {username && (
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: 11,
              color: TOKENS.inkSoft,
              letterSpacing: "0.05em",
            }}
          >
            SIGNED IN AS {username.toUpperCase()}
          </span>
        )}
        <button
          onClick={onSwitchRole}
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
          SWITCH ROLE
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState(null);
  const [caseId, setCaseId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // login() from trust-access-layer returns {access_token, role, user_id} -
  // it does NOT echo back the username, so we carry it up from what was
  // typed into the form (see Login.jsx).
  function handleLogin({ access_token, role: authenticatedRole, user_id, username: uname, case_id }) {
    setToken(access_token);
    setRole(authenticatedRole);
    setUserId(user_id || null);
    setUsername(uname || null);
    setCaseId(case_id || null);
  }

  function handleSwitchRole() {
    setToken(null);
    setRole(null);
    setUserId(null);
    setUsername(null);
    setCaseId(null);
    setShowLogin(false);
  }

  if (!token || !role) {
    if (showLogin) {
      return <Login onLogin={handleLogin} onBack={() => setShowLogin(false)} />;
    }
    // Landing renders two separate entry points: the role cards
    // (onSelectRole) AND the top-right LOGIN button (onLogin) - both need
    // to land on the Login screen, so both props have to be passed here.
    return <Landing onSelectRole={() => setShowLogin(true)} onLogin={() => setShowLogin(true)} />;
  }

  const views = {
    judge: {
      component: <JudgeDashboard token={token} userId={userId} role={role} />,
      label: "JUDICIAL AUTHORITY",
    },
    undertrial: {
      component: <UndertrialView token={token} caseId={caseId} />,
      label: "UNDERTRIAL",
    },
    legal_aid: {
      component: <LegalAidDashboard token={token} userId={userId} role={role} />,
      label: "LEGAL AID / JAIL OFFICER",
    },
    jail_officer: {
      component: <LegalAidDashboard token={token} userId={userId} role={role} />,
      label: "LEGAL AID / JAIL OFFICER",
    },
  };

  const current = views[role];

  if (!current) {
    return <div>Unknown role: {role}</div>;
  }

  return (
    <div>
      <Header label={current.label} username={username} onSwitchRole={handleSwitchRole} />
      {current.component}
    </div>
  );
}