import { useState } from "react";
import { TOKENS, FONTS, Eyebrow, ActionButton, Pill } from "../components/designSystem";
import { extractFir, confirmIntake } from "../api/client";

const FIELD_LABELS = {
  district: "District", state: "State", police_station: "Police Station",
  fir_no: "FIR No.", fir_date: "Date", act: "Act", section: "Section",
  accused_name: "Accused name",
};

// Two-step by design: extracting a document never saves anything on its
// own - a misread section number could wrongly gate someone's bail
// eligibility, so a human always reviews the draft before it's confirmed.
export default function IntakeScan({ token, onCaseCreated }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [draft, setDraft] = useState(null);
  const [extractInfo, setExtractInfo] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setDraft(null);
    setResult(null);
    setError("");
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setError("");
    try {
      const res = await extractFir(file, token);
      setDraft(res.data.draft);
      setExtractInfo(res.data);
    } catch (err) {
      setError(err.message || "Could not read this document.");
    } finally {
      setExtracting(false);
    }
  }

  function updateField(key, value) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleConfirm() {
    if (!draft) return;
    setConfirming(true);
    setError("");
    try {
      const res = await confirmIntake(draft, token);
      if (res.success) {
        setResult(res.data);
        onCaseCreated?.(res.data.case_id);
      } else {
        setError(res.error?.message || "Could not save this case.");
      }
    } catch (err) {
      setError(err.message || "Could not save this case.");
    } finally {
      setConfirming(false);
    }
  }

  function reset() {
    setFile(null); setPreview(null); setDraft(null);
    setExtractInfo(null); setResult(null); setError("");
  }

  return (
    <div>
      <Eyebrow>FIR scan intake — jail officer only</Eyebrow>
      <p style={{ fontSize: 13, color: TOKENS.inkSoft, marginBottom: 20, maxWidth: 560 }}>
        Upload a photo or PDF of the First Information Report. Nothing is
        saved until you review and confirm every field below — OCR can
        misread a section number, and that number decides someone's
        eligibility, so it is never trusted blind.
      </p>

      {!result && (
        <div style={{
          border: `1px dashed ${TOKENS.rule}`, borderRadius: 6, padding: 24,
          background: "white", maxWidth: 560,
        }}>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFile}
            style={{ fontFamily: FONTS.body, fontSize: 13 }}
          />

          {preview && (
            <img src={preview} alt="FIR preview"
              style={{ display: "block", marginTop: 16, maxWidth: "100%", maxHeight: 320, border: `1px solid ${TOKENS.rule}` }} />
          )}

          {file && !draft && (
            <div style={{ marginTop: 16 }}>
              <ActionButton onClick={handleExtract} disabled={extracting}>
                {extracting ? "Reading document…" : "Extract fields"}
              </ActionButton>
            </div>
          )}
        </div>
      )}

      {error && <p style={{ color: TOKENS.danger, marginTop: 16 }}>{error}</p>}

      {draft && !result && (
        <div style={{ marginTop: 24, maxWidth: 560 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Pill color={TOKENS.sealEligible}>
              {extractInfo.fields_extracted}/{extractInfo.fields_total} fields read
            </Pill>
            {extractInfo.missing_fields.length > 0 && (
              <span style={{ fontSize: 12, color: TOKENS.inkSoft }}>
                Missing: {extractInfo.missing_fields.map((f) => FIELD_LABELS[f] || f).join(", ")} — fill in by hand below.
              </span>
            )}
          </div>

          <p style={{ fontSize: 12, color: TOKENS.sealPending, marginBottom: 14, fontStyle: "italic" }}>
            Review every field below before confirming. Nothing is saved yet.
          </p>

          {Object.entries(FIELD_LABELS).map(([key, label]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={{ fontFamily: FONTS.mono, fontSize: 10.5, color: TOKENS.inkSoft, letterSpacing: "0.05em" }}>
                {label.toUpperCase()}
              </label>
              <input
                value={draft[key] || ""}
                onChange={(e) => updateField(key, e.target.value)}
                style={{
                  display: "block", width: "100%", padding: 10, marginTop: 4,
                  border: `1px solid ${draft[key] ? TOKENS.rule : TOKENS.sealPending}`,
                  fontFamily: FONTS.body, fontSize: 14,
                }}
              />
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <ActionButton onClick={handleConfirm} disabled={confirming}>
              {confirming ? "Saving…" : "Confirm and save"}
            </ActionButton>
            <ActionButton onClick={reset} variant="neutral">Start over</ActionButton>
          </div>
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 24, maxWidth: 560, padding: 20, background: "white",
          border: `1px solid ${TOKENS.rule}`, borderLeft: `3px solid ${TOKENS.sealEligible}`,
        }}>
          <p style={{ fontFamily: FONTS.display, fontSize: 17, fontWeight: 600, color: TOKENS.ink }}>
            {result.action === "charge_appended_to_existing_case"
              ? "Charge added to an existing case"
              : "New case created"}
          </p>
          <p style={{ fontSize: 13, color: TOKENS.inkSoft, marginTop: 6 }}>
            {result.accused_name} — <span style={{ fontFamily: FONTS.mono }}>{result.case_id}</span>
            {result.total_charges && ` — ${result.total_charges} charges on file`}
          </p>
          <div style={{ marginTop: 16 }}>
            <ActionButton onClick={reset} variant="neutral">Scan another document</ActionButton>
          </div>
        </div>
      )}
    </div>
  );
}
