import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Home() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toDateString();
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const medQuery = query(
      collection(db, "medications"),
      where("userId", "==", uid)
    );
    const unsubMeds = onSnapshot(medQuery, (snap) => {
      setMedications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    const logQuery = query(
      collection(db, "logs"),
      where("userId", "==", uid),
      where("date", "==", todayStr)
    );
    const unsubLogs = onSnapshot(logQuery, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubMeds();
      unsubLogs();
    };
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    navigate("/login");
  }

  async function markAsTaken(med, time) {
    const uid = auth.currentUser?.uid;
    await addDoc(collection(db, "logs"), {
      userId: uid,
      medicationId: med.id,
      medicationName: med.name,
      dose: med.dose,
      time,
      status: "taken",
      date: todayStr,
      takenAt: serverTimestamp(),
    });
  }

  async function markAsSkipped(med, time) {
    const uid = auth.currentUser?.uid;
    await addDoc(collection(db, "logs"), {
      userId: uid,
      medicationId: med.id,
      medicationName: med.name,
      dose: med.dose,
      time,
      status: "skipped",
      date: todayStr,
      takenAt: serverTimestamp(),
    });
  }

  function isLogged(medId, time) {
    return logs.find((l) => l.medicationId === medId && l.time === time);
  }

  const takenCount = logs.filter((l) => l.status === "taken").length;
  const totalDoses = medications.reduce((acc, m) => acc + m.times.length, 0);
  const progressPct = totalDoses > 0 ? Math.min((takenCount / totalDoses) * 100, 100) : 0;

  return (
    <div style={s.page}>
      {/* ── Navigation ─────────────────────────────────── */}
      <nav style={s.nav}>
        <div style={s.navInner}>
          <div style={s.navLogo}>
            <div style={s.navSquare} />
            <span style={s.navBrand}>MEDTRACKER</span>
          </div>
          <div style={s.navLinks}>
            <button
              id="nav-history-btn"
              style={s.navLink}
              onClick={() => navigate("/history")}
            >
              HISTORY
            </button>
            <button
              id="nav-settings-btn"
              style={s.navLink}
              onClick={() => navigate("/settings")}
            >
              SETTINGS
            </button>
            <button
              id="nav-signout-btn"
              style={s.navSignOut}
              onClick={handleSignOut}
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </nav>

      <div style={s.navRule} />

      {/* ── Hero Header ────────────────────────────────── */}
      <header style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroLeft}>
            <p style={s.heroEyebrow}>TODAY'S SCHEDULE</p>
            <h1 style={s.heroTitle}>Your<br /><em style={s.heroItalic}>Daily</em><br />Doses</h1>
            <div style={s.heroRule} />
          </div>
          <div style={s.heroRight}>
            <p style={s.heroDate}>{todayFormatted}</p>
            {totalDoses > 0 && (
              <div style={s.progressBlock}>
                <div style={s.progressHeader}>
                  <span style={s.progressLabel}>PROGRESS</span>
                  <span style={s.progressCount}>{takenCount}/{totalDoses}</span>
                </div>
                <div style={s.progressTrack}>
                  <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
                </div>
                <p style={s.progressPct}>{Math.round(progressPct)}% complete</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <div style={s.sectionRule} />

      {/* ── Medication List ─────────────────────────────── */}
      <main style={s.main}>
        {loading ? (
          <div style={s.state}>
            <p style={s.stateEyebrow}>LOADING</p>
            <p style={s.stateMsg}>Fetching your medications...</p>
          </div>
        ) : medications.length === 0 ? (
          <div style={s.state}>
            <p style={s.stateEyebrow}>EMPTY</p>
            <h2 style={s.stateHeadline}>No medications<br /><em>added yet</em></h2>
            <div style={s.stateRule} />
            <p style={s.stateSub}>Add your first medication to begin tracking your health journey.</p>
            <button
              id="home-add-first-btn"
              style={s.cta}
              onClick={() => navigate("/add")}
            >
              ADD MEDICATION →
            </button>
          </div>
        ) : (
          <div style={s.medGrid}>
            {medications.map((med) => (
              <MedCard
                key={med.id}
                med={med}
                isLogged={isLogged}
                onTaken={markAsTaken}
                onSkipped={markAsSkipped}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Floating Add Button ─────────────────────────── */}
      <button
        id="home-fab-btn"
        style={s.fab}
        onClick={() => navigate("/add")}
        title="Add medication"
      >
        +
      </button>
    </div>
  );
}

function MedCard({ med, isLogged, onTaken, onSkipped }) {
  return (
    <article style={cs.card}>
      {/* Card header */}
      <div style={cs.cardTop}>
        <div>
          <p style={cs.medName}>{med.name}</p>
          <p style={cs.medMeta}>
            <span style={cs.metaDose}>{med.dose}</span>
            <span style={cs.metaDot}>·</span>
            <span style={cs.metaFreq}>{med.frequency}</span>
          </p>
        </div>
        {med.notes && <p style={cs.notes}>{med.notes}</p>}
      </div>

      <div style={cs.divider} />

      {/* Times */}
      <div style={cs.timesCol}>
        {med.times.map((time) => {
          const log = isLogged(med.id, time);
          return (
            <div key={time} style={cs.timeRow}>
              <div style={cs.timeLabel}>
                <span style={cs.timeDot}>▸</span>
                <span style={cs.timeText}>{time.toUpperCase()}</span>
              </div>
              {log ? (
                <div style={{
                  ...cs.badge,
                  background: log.status === "taken" ? "#000" : "transparent",
                  color: log.status === "taken" ? "#fff" : "#000",
                  border: log.status === "taken" ? "none" : "1px solid #000",
                }}>
                  {log.status === "taken" ? "✓ TAKEN" : "✗ SKIPPED"}
                </div>
              ) : (
                <div style={cs.actions}>
                  <button
                    style={cs.takenBtn}
                    onClick={() => onTaken(med, time)}
                  >
                    TAKEN
                  </button>
                  <button
                    style={cs.skipBtn}
                    onClick={() => onSkipped(med, time)}
                  >
                    SKIP
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

/* ── Home page styles ── */
const s = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
  },
  nav: {
    background: "#fff",
    padding: "0 40px",
  },
  navInner: {
    maxWidth: "1152px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "64px",
  },
  navLogo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  navSquare: {
    width: "18px",
    height: "18px",
    background: "#000",
  },
  navBrand: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    color: "#000",
    fontWeight: 500,
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
  },
  navLink: {
    background: "none",
    border: "none",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "#525252",
    cursor: "pointer",
    padding: "4px 0",
    transition: "color 0.1s",
    borderRadius: 0,
  },
  navSignOut: {
    background: "none",
    border: "1px solid #000",
    borderRadius: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "#000",
    cursor: "pointer",
    padding: "8px 16px",
    transition: "background 0.1s, color 0.1s",
  },
  navRule: {
    height: "4px",
    background: "#000",
  },
  hero: {
    padding: "64px 40px 48px",
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
  heroInner: {
    maxWidth: "1152px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "64px",
    alignItems: "end",
    position: "relative",
    zIndex: 1,
    background: "#fff",
    padding: "40px",
  },
  heroLeft: {},
  heroEyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#525252",
    marginBottom: "16px",
  },
  heroTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(3rem, 5vw, 5.5rem)",
    fontWeight: 800,
    color: "#000",
    lineHeight: 0.95,
    letterSpacing: "-0.03em",
  },
  heroItalic: {
    fontStyle: "italic",
    fontWeight: 400,
  },
  heroRule: {
    width: "48px",
    height: "4px",
    background: "#000",
    marginTop: "28px",
  },
  heroRight: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
  },
  heroDate: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontStyle: "italic",
    fontSize: "1.125rem",
    color: "#525252",
  },
  progressBlock: {
    border: "1px solid #000",
    padding: "20px 24px",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "12px",
  },
  progressLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "#525252",
  },
  progressCount: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#000",
  },
  progressTrack: {
    height: "3px",
    background: "#E5E5E5",
    marginBottom: "8px",
  },
  progressFill: {
    height: "100%",
    background: "#000",
    transition: "width 0.4s ease",
  },
  progressPct: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.08em",
    color: "#525252",
  },
  sectionRule: {
    height: "4px",
    background: "#000",
    margin: "0 40px",
  },
  main: {
    maxWidth: "1152px",
    margin: "0 auto",
    padding: "48px 40px 120px",
    width: "100%",
  },
  state: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    paddingTop: "48px",
    maxWidth: "480px",
  },
  stateEyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#525252",
    marginBottom: "16px",
  },
  stateHeadline: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "3rem",
    fontWeight: 700,
    color: "#000",
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
  },
  stateRule: {
    width: "40px",
    height: "4px",
    background: "#000",
    margin: "24px 0",
  },
  stateSub: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: "1rem",
    color: "#525252",
    lineHeight: 1.625,
    marginBottom: "32px",
  },
  stateMsg: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.8rem",
    color: "#525252",
    marginTop: "8px",
  },
  cta: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 0,
    padding: "16px 32px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.7rem",
    letterSpacing: "0.12em",
    cursor: "pointer",
  },
  medGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "1px",
    border: "1px solid #000",
    background: "#000",
  },
  fab: {
    position: "fixed",
    bottom: "32px",
    right: "40px",
    width: "56px",
    height: "56px",
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 0,
    fontSize: "28px",
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 300,
    zIndex: 100,
    transition: "background 0.1s, color 0.1s",
  },
};

/* ── Med Card component styles ── */
const cs = {
  card: {
    background: "#fff",
    padding: "28px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  cardTop: {
    marginBottom: "20px",
  },
  medName: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#000",
    marginBottom: "6px",
    lineHeight: 1.1,
  },
  medMeta: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  metaDose: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    color: "#000",
    letterSpacing: "0.05em",
  },
  metaDot: {
    color: "#525252",
    fontSize: "0.75rem",
  },
  metaFreq: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontStyle: "italic",
    fontSize: "0.85rem",
    color: "#525252",
  },
  notes: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontStyle: "italic",
    fontSize: "0.8rem",
    color: "#525252",
    marginTop: "8px",
    lineHeight: 1.5,
  },
  divider: {
    height: "1px",
    background: "#E5E5E5",
    marginBottom: "16px",
  },
  timesCol: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  timeRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },
  timeLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  timeDot: {
    fontSize: "10px",
    color: "#000",
  },
  timeText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.1em",
    color: "#000",
  },
  actions: {
    display: "flex",
    gap: "8px",
  },
  takenBtn: {
    background: "#000",
    color: "#fff",
    border: "none",
    borderRadius: 0,
    padding: "7px 16px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "background 0.1s, color 0.1s",
  },
  skipBtn: {
    background: "transparent",
    color: "#000",
    border: "1px solid #000",
    borderRadius: 0,
    padding: "7px 16px",
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "background 0.1s, color 0.1s",
  },
  badge: {
    padding: "7px 14px",
    borderRadius: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    fontWeight: 500,
  },
};