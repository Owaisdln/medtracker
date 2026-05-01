import { useState } from "react";
import { db, auth } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 8 hours",
  "Weekly",
];
const TIMES = ["Morning", "Afternoon", "Evening", "Night"];

export default function AddMedication() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    dose: "",
    frequency: "Once daily",
    times: [],
    startDate: "",
    totalPills: "",
    notes: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function toggleTime(time) {
    setForm((prev) => ({
      ...prev,
      times: prev.times.includes(time)
        ? prev.times.filter((t) => t !== time)
        : [...prev.times, time],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.times.length === 0) {
      setError("Please select at least one time of day.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "medications"), {
        ...form,
        totalPills: Number(form.totalPills),
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        active: true,
      });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* ── Header ─────────────────────────────── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <button
            id="add-back-btn"
            style={s.backBtn}
            onClick={() => navigate("/")}
          >
            ← BACK
          </button>
          <div style={s.headerLogo}>
            <div style={s.logoSquare} />
            <span style={s.logoBrand}>MEDTRACKER</span>
          </div>
        </div>
      </header>
      <div style={s.headerRule} />

      <div style={s.layout}>
        {/* ── Left: Typography ─────────────────── */}
        <aside style={s.aside}>
          <p style={s.eyebrow}>ADD MEDICATION</p>
          <h1 style={s.headline}>
            New<br />
            <em style={s.italic}>Prescrip</em><br />
            tion
          </h1>
          <div style={s.rule} />
          <p style={s.asideSub}>
            Add the details of your medication. We'll remind you to take it at the right times.
          </p>
        </aside>

        {/* ── Right: Form ──────────────────────── */}
        <main style={s.formArea}>
          {error && (
            <div style={s.errorBox}>
              <span style={s.errorMark}>■</span>
              <p style={s.errorText}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={s.form}>
            {/* Medicine Name */}
            <Field label="MEDICINE NAME">
              <input
                id="add-name"
                style={s.input}
                name="name"
                placeholder="e.g. Paracetamol"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Field>

            {/* Dose */}
            <Field label="DOSAGE">
              <input
                id="add-dose"
                style={s.input}
                name="dose"
                placeholder="e.g. 500mg"
                value={form.dose}
                onChange={handleChange}
                required
              />
            </Field>

            {/* Frequency */}
            <Field label="FREQUENCY">
              <select
                id="add-frequency"
                style={{ ...s.input, cursor: "pointer" }}
                name="frequency"
                value={form.frequency}
                onChange={handleChange}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </Field>

            {/* Time of day */}
            <Field label="TIME OF DAY">
              <div style={s.timeGrid}>
                {TIMES.map((time) => {
                  const selected = form.times.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      id={`add-time-${time.toLowerCase()}`}
                      style={{
                        ...s.timeBtn,
                        background: selected ? "#000" : "transparent",
                        color: selected ? "#fff" : "#000",
                        border: selected ? "2px solid #000" : "2px solid #E5E5E5",
                      }}
                      onClick={() => toggleTime(time)}
                    >
                      <span style={s.timeBtnIcon}>{selected ? "▪" : "▫"}</span>
                      {time.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </Field>

            {/* Start date */}
            <div style={s.twoCol}>
              <Field label="START DATE">
                <input
                  id="add-start-date"
                  style={s.input}
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  required
                />
              </Field>

              {/* Total pills */}
              <Field label="TOTAL PILLS">
                <input
                  id="add-total-pills"
                  style={s.input}
                  type="number"
                  name="totalPills"
                  placeholder="e.g. 30"
                  value={form.totalPills}
                  onChange={handleChange}
                  required
                />
              </Field>
            </div>

            {/* Notes */}
            <Field label="NOTES (OPTIONAL)">
              <textarea
                id="add-notes"
                style={{ ...s.input, height: "100px", resize: "vertical" }}
                name="notes"
                placeholder="e.g. Take after food"
                value={form.notes}
                onChange={handleChange}
              />
            </Field>

            <div style={s.submitRow}>
              <button
                id="add-submit-btn"
                style={{
                  ...s.submitBtn,
                  opacity: loading ? 0.6 : 1,
                }}
                type="submit"
                disabled={loading}
              >
                {loading ? "SAVING..." : "SAVE MEDICATION →"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={fs.field}>
      <label style={fs.label}>{label}</label>
      {children}
    </div>
  );
}

const fs = {
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#525252",
  },
};

const s = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    padding: "0 40px",
  },
  headerInner: {
    maxWidth: "1152px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "64px",
  },
  backBtn: {
    background: "none",
    border: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "#000",
    cursor: "pointer",
    padding: "8px 0",
    borderRadius: 0,
  },
  headerLogo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoSquare: {
    width: "18px",
    height: "18px",
    background: "#000",
  },
  logoBrand: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    color: "#000",
    fontWeight: 500,
  },
  headerRule: {
    height: "4px",
    background: "#000",
  },
  layout: {
    flex: 1,
    maxWidth: "1152px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    width: "100%",
  },
  aside: {
    borderRight: "4px solid #000",
    padding: "64px 48px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    background: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 1px,
        #000 1px,
        #000 2px
      )
    `,
    backgroundSize: "100% 4px",
    backgroundColor: "#fff",
    position: "relative",
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#525252",
    marginBottom: "20px",
    position: "relative",
    zIndex: 1,
    background: "#fff",
    display: "inline-block",
    padding: "2px 0",
  },
  headline: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(3rem, 4.5vw, 4.5rem)",
    fontWeight: 800,
    color: "#000",
    lineHeight: 0.92,
    letterSpacing: "-0.03em",
    position: "relative",
    zIndex: 1,
    background: "#fff",
  },
  italic: {
    fontStyle: "italic",
    fontWeight: 400,
  },
  rule: {
    width: "40px",
    height: "4px",
    background: "#000",
    margin: "28px 0",
    position: "relative",
    zIndex: 1,
  },
  asideSub: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: "0.95rem",
    color: "#525252",
    lineHeight: 1.7,
    position: "relative",
    zIndex: 1,
    background: "#fff",
  },
  formArea: {
    padding: "64px 56px",
    display: "flex",
    flexDirection: "column",
  },
  errorBox: {
    border: "1px solid #000",
    padding: "12px 16px",
    marginBottom: "32px",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
  },
  errorMark: {
    fontSize: "8px",
    flexShrink: 0,
    marginTop: "4px",
  },
  errorText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    color: "#000",
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  input: {
    width: "100%",
    padding: "14px 0",
    background: "transparent",
    border: "none",
    borderBottom: "2px solid #000",
    fontSize: "1rem",
    fontFamily: "'Source Serif 4', Georgia, serif",
    color: "#000",
    outline: "none",
    borderRadius: 0,
    appearance: "none",
  },
  timeGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
  },
  timeBtn: {
    padding: "12px 16px",
    borderRadius: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "all 0.1s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  timeBtnIcon: {
    fontSize: "10px",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  submitRow: {
    paddingTop: "8px",
    borderTop: "1px solid #E5E5E5",
    marginTop: "8px",
  },
  submitBtn: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 0,
    padding: "18px 40px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.7rem",
    letterSpacing: "0.15em",
    cursor: "pointer",
    transition: "background 0.1s, color 0.1s",
  },
};