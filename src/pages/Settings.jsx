import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function Settings() {
  const navigate = useNavigate();
  const [caregiverName, setCaregiverName] = useState("");
  const [caregiverPhone, setCaregiverPhone] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      const ref = doc(db, "settings", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setCaregiverName(data.caregiverName || "");
        setCaregiverPhone(data.caregiverPhone || "");
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    if (!user) return;
    const ref = doc(db, "settings", user.uid);
    await setDoc(ref, {
      caregiverName,
      caregiverPhone,
      updatedAt: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleSignOut() {
    await signOut(auth);
    navigate("/login");
  }

  const initials = user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div style={s.page}>
      {/* ── Header ─────────────────────────────── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <button
            id="settings-back-btn"
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
        {/* ── Left Sidebar ─────────────────────── */}
        <aside style={s.aside}>
          <p style={s.eyebrow}>ACCOUNT</p>
          <h1 style={s.headline}>Settings</h1>
          <div style={s.rule} />

          {/* Avatar */}
          <div style={s.avatarBlock}>
            <div style={s.avatar}>{initials}</div>
            <div>
              <p style={s.avatarEmail}>{user?.email}</p>
              <p style={s.avatarStatus}>● SIGNED IN</p>
            </div>
          </div>

          <div style={s.asideFooter}>
            <button
              id="settings-signout-btn"
              style={s.signOutBtn}
              onClick={handleSignOut}
            >
              SIGN OUT →
            </button>
          </div>
        </aside>

        {/* ── Main Content ─────────────────────── */}
        <main style={s.main}>

          {/* Caregiver Section */}
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <p style={s.sectionEyebrow}>01</p>
              <div>
                <h2 style={s.sectionTitle}>Caregiver Contact</h2>
                <p style={s.sectionSub}>
                  This person will be alerted if you miss a dose for more than 2 hours.
                </p>
              </div>
            </div>

            {loading ? (
              <p style={s.loadingText}>Loading settings...</p>
            ) : (
              <form onSubmit={handleSave} style={s.form}>
                <Field label="CAREGIVER NAME">
                  <input
                    id="settings-caregiver-name"
                    style={s.input}
                    placeholder="e.g. Mom"
                    value={caregiverName}
                    onChange={(e) => setCaregiverName(e.target.value)}
                  />
                </Field>
                <Field label="PHONE NUMBER">
                  <input
                    id="settings-caregiver-phone"
                    style={s.input}
                    placeholder="e.g. +91 98765 43210"
                    value={caregiverPhone}
                    onChange={(e) => setCaregiverPhone(e.target.value)}
                    type="tel"
                  />
                </Field>

                {saved && (
                  <div style={s.successBox}>
                    <span style={s.successIcon}>✓</span>
                    <p style={s.successText}>Settings saved successfully.</p>
                  </div>
                )}

                <div style={s.submitRow}>
                  <button
                    id="settings-save-btn"
                    style={s.saveBtn}
                    type="submit"
                  >
                    SAVE SETTINGS →
                  </button>
                </div>
              </form>
            )}
          </section>

          <div style={s.divider} />

          {/* About Section */}
          <section style={s.section}>
            <div style={s.sectionHeader}>
              <p style={s.sectionEyebrow}>02</p>
              <div>
                <h2 style={s.sectionTitle}>About</h2>
                <p style={s.sectionSub}>Application information.</p>
              </div>
            </div>

            <div style={s.infoGrid}>
              <InfoRow label="APPLICATION" value="MedTracker" />
              <InfoRow label="VERSION" value="1.0.0" />
              <InfoRow label="STACK" value="React + Firebase" />
              <InfoRow label="DESIGN" value="Minimalist Monochrome" />
            </div>
          </section>

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

function InfoRow({ label, value }) {
  return (
    <div style={ir.row}>
      <p style={ir.label}>{label}</p>
      <p style={ir.value}>{value}</p>
    </div>
  );
}

const ir = {
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "14px 0",
    borderBottom: "1px solid #E5E5E5",
  },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "#525252",
  },
  value: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#000",
  },
};

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
    gridTemplateColumns: "300px 1fr",
    width: "100%",
    alignItems: "start",
  },
  aside: {
    borderRight: "4px solid #000",
    padding: "56px 40px",
    position: "sticky",
    top: 0,
    minHeight: "calc(100vh - 68px)",
    display: "flex",
    flexDirection: "column",
    background: "#000",
  },
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "16px",
  },
  headline: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "3.5rem",
    fontWeight: 800,
    color: "#fff",
    lineHeight: 0.95,
    letterSpacing: "-0.03em",
  },
  rule: {
    width: "40px",
    height: "4px",
    background: "#fff",
    margin: "28px 0",
  },
  avatarBlock: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "32px",
  },
  avatar: {
    width: "48px",
    height: "48px",
    background: "#fff",
    color: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.25rem",
    fontWeight: 700,
    flexShrink: 0,
  },
  avatarEmail: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: "0.85rem",
    color: "#fff",
    marginBottom: "4px",
    wordBreak: "break-all",
  },
  avatarStatus: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.55rem",
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.5)",
  },
  asideFooter: {
    marginTop: "auto",
  },
  signOutBtn: {
    background: "transparent",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 0,
    color: "#fff",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    padding: "12px 20px",
    cursor: "pointer",
    transition: "border-color 0.1s, background 0.1s",
    width: "100%",
    textAlign: "left",
  },
  main: {
    padding: "56px 56px 80px",
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  sectionHeader: {
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  sectionEyebrow: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "2rem",
    fontWeight: 300,
    color: "#E5E5E5",
    lineHeight: 1,
    flexShrink: 0,
    marginTop: "4px",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#000",
    lineHeight: 1.1,
    marginBottom: "6px",
  },
  sectionSub: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: "0.9rem",
    color: "#525252",
    lineHeight: 1.6,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "480px",
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
  },
  successBox: {
    border: "1px solid #000",
    padding: "12px 16px",
    display: "flex",
    gap: "10px",
    alignItems: "center",
  },
  successIcon: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    color: "#000",
  },
  successText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.7rem",
    letterSpacing: "0.05em",
    color: "#000",
  },
  submitRow: {
    paddingTop: "8px",
  },
  saveBtn: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 0,
    padding: "16px 32px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    cursor: "pointer",
  },
  divider: {
    height: "4px",
    background: "#000",
    margin: "48px 0",
  },
  infoGrid: {
    maxWidth: "480px",
  },
  loadingText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    color: "#525252",
    letterSpacing: "0.05em",
  },
};