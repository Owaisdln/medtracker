import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useNotifications } from "../hooks/useNotifications";

/** Format raw time label for display: preset labels pass through, HH:MM → 12h */
function formatTimeLabel(t) {
  const match = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return t.toUpperCase(); // preset label like MORNING
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export default function Home() {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useBreakpoint();
  const [medications, setMedications] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied"
  );

  // Schedule browser notifications for un-logged doses
  useNotifications(medications, logs);

  async function requestNotifPermission() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setNotifPermission(result);
  }

  const todayStr = new Date().toDateString();
  const todayFormatted = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const medQ = query(collection(db, "medications"), where("userId", "==", uid));
    const unsubMeds = onSnapshot(medQ, (snap) => {
      setMedications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const logQ = query(collection(db, "logs"), where("userId", "==", uid), where("date", "==", todayStr));
    const unsubLogs = onSnapshot(logQ, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubMeds(); unsubLogs(); };
  }, []);

  async function handleSignOut() { await signOut(auth); navigate("/login"); }
  async function markAsTaken(med, time) {
    const uid = auth.currentUser?.uid;
    await addDoc(collection(db, "logs"), { userId: uid, medicationId: med.id, medicationName: med.name, dose: med.dose, time, status: "taken", date: todayStr, takenAt: serverTimestamp() });
  }
  async function markAsSkipped(med, time) {
    const uid = auth.currentUser?.uid;
    await addDoc(collection(db, "logs"), { userId: uid, medicationId: med.id, medicationName: med.name, dose: med.dose, time, status: "skipped", date: todayStr, takenAt: serverTimestamp() });
  }
  function isLogged(medId, time) { return logs.find((l) => l.medicationId === medId && l.time === time); }

  const takenCount = logs.filter((l) => l.status === "taken").length;
  const totalDoses = medications.reduce((acc, m) => acc + m.times.length, 0);
  const progressPct = totalDoses > 0 ? Math.min((takenCount / totalDoses) * 100, 100) : 0;

  const px = isMobile ? "16px" : "40px";

  return (
    <div style={s.page}>
      {/* ── Nav ── */}
      <nav style={{ ...s.nav, padding: `0 ${px}` }}>
        <div style={s.navInner}>
          <div style={s.navLogo}>
            <div style={s.navSquare} />
            <span style={s.navBrand}>MEDTRACKER</span>
          </div>
          {isMobile ? (
            <button style={s.menuBtn} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
              {menuOpen ? "✕" : "☰"}
            </button>
          ) : (
            <div style={s.navLinks}>
              <button id="nav-history-btn" style={s.navLink} onClick={() => navigate("/history")}>HISTORY</button>
              <button id="nav-settings-btn" style={s.navLink} onClick={() => navigate("/settings")}>SETTINGS</button>
              <button id="nav-signout-btn" style={s.navSignOut} onClick={handleSignOut}>SIGN OUT</button>
            </div>
          )}
        </div>
        {/* Mobile dropdown menu */}
        {isMobile && menuOpen && (
          <div style={s.mobileMenu}>
            <button style={s.mobileMenuItem} onClick={() => { navigate("/history"); setMenuOpen(false); }}>HISTORY</button>
            <button style={s.mobileMenuItem} onClick={() => { navigate("/settings"); setMenuOpen(false); }}>SETTINGS</button>
            <button style={{ ...s.mobileMenuItem, borderBottom: "none", color: "#525252" }} onClick={handleSignOut}>SIGN OUT</button>
          </div>
        )}
      </nav>
      <div style={s.navRule} />

      {/* ── Notification permission banner ── */}
      {notifPermission === "default" && (
        <div style={nb.banner}>
          <div style={nb.inner}>
            <div style={nb.left}>
              <span style={nb.icon}>🔔</span>
              <div>
                <p style={nb.title}>Enable dose reminders</p>
                <p style={nb.sub}>Get notified at the right time to take your medication.</p>
              </div>
            </div>
            <div style={nb.actions}>
              <button style={nb.allowBtn} onClick={requestNotifPermission}>ALLOW →</button>
              <button style={nb.dismissBtn} onClick={() => setNotifPermission("denied")}>✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      <header style={{ ...s.hero, padding: isMobile ? "32px 16px 28px" : "64px 40px 48px" }}>
        <div style={{
          ...s.heroInner,
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? "24px" : "64px",
          padding: isMobile ? "24px 16px" : "40px",
        }}>
          <div>
            <p style={s.heroEyebrow}>TODAY'S SCHEDULE</p>
            <h1 style={{ ...s.heroTitle, fontSize: isMobile ? "2.5rem" : "clamp(3rem,5vw,5.5rem)" }}>
              Your<br /><em style={s.heroItalic}>Daily</em><br />Doses
            </h1>
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

      <div style={{ ...s.sectionRule, margin: `0 ${px}` }} />

      {/* ── Main content ── */}
      <main style={{ ...s.main, padding: isMobile ? "32px 16px 100px" : "48px 40px 120px" }}>
        {loading ? (
          <div style={s.state}>
            <p style={s.stateEyebrow}>LOADING</p>
            <p style={s.stateMsg}>Fetching your medications...</p>
          </div>
        ) : medications.length === 0 ? (
          <div style={s.state}>
            <p style={s.stateEyebrow}>EMPTY</p>
            <h2 style={{ ...s.stateHeadline, fontSize: isMobile ? "2rem" : "3rem" }}>
              No medications<br /><em>added yet</em>
            </h2>
            <div style={s.stateRule} />
            <p style={s.stateSub}>Add your first medication to begin tracking your health journey.</p>
            <button id="home-add-first-btn" style={s.cta} onClick={() => navigate("/add")}>
              ADD MEDICATION →
            </button>
          </div>
        ) : (
          <div style={{
            ...s.medGrid,
            gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "repeat(auto-fill,minmax(340px,1fr))",
          }}>
            {medications.map((med) => (
              <MedCard key={med.id} med={med} isLogged={isLogged} onTaken={markAsTaken} onSkipped={markAsSkipped} />
            ))}
          </div>
        )}
      </main>

      {/* ── FAB ── */}
      <button id="home-fab-btn" style={{ ...s.fab, bottom: isMobile ? "20px" : "32px", right: isMobile ? "16px" : "40px" }}
        onClick={() => navigate("/add")} title="Add medication">+</button>
    </div>
  );
}

function MedCard({ med, isLogged, onTaken, onSkipped }) {
  return (
    <article style={cs.card}>
      <div style={cs.cardTop}>
        <p style={cs.medName}>{med.name}</p>
        <p style={cs.medMeta}>
          <span style={cs.metaDose}>{med.dose}</span>
          <span style={cs.metaDot}> · </span>
          <span style={cs.metaFreq}>{med.frequency}</span>
        </p>
        {med.notes && <p style={cs.notes}>{med.notes}</p>}
      </div>
      <div style={cs.divider} />
      <div style={cs.timesCol}>
        {med.times.map((time) => {
          const log = isLogged(med.id, time);
          return (
            <div key={time} style={cs.timeRow}>
              <div style={cs.timeLabel}>
                <span style={cs.timeDot}>▸</span>
                <span style={cs.timeText}>{formatTimeLabel(time)}</span>
              </div>
              {log ? (
                <div style={{ ...cs.badge, background: log.status === "taken" ? "#000" : "transparent", color: log.status === "taken" ? "#fff" : "#000", border: log.status === "taken" ? "none" : "1px solid #000" }}>
                  {log.status === "taken" ? "✓ TAKEN" : "✗ SKIPPED"}
                </div>
              ) : (
                <div style={cs.actions}>
                  <button style={cs.takenBtn} onClick={() => onTaken(med, time)}>TAKEN</button>
                  <button style={cs.skipBtn} onClick={() => onSkipped(med, time)}>SKIP</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

/* ── Notification banner styles ── */
const nb = {
  banner: {
    background: "#000",
    borderBottom: "4px solid #000",
  },
  inner: {
    maxWidth: "1152px",
    margin: "0 auto",
    padding: "14px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: "200px",
  },
  icon: { fontSize: "18px", flexShrink: 0 },
  title: {
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.12em",
    color: "#fff",
    fontWeight: 500,
    marginBottom: "2px",
  },
  sub: {
    fontFamily: "'Source Serif 4',Georgia,serif",
    fontSize: "0.8rem",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.4,
  },
  actions: { display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 },
  allowBtn: {
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 0,
    padding: "10px 20px",
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    cursor: "pointer",
    fontWeight: 500,
    minHeight: "44px",
  },
  dismissBtn: {
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 0,
    width: "36px",
    height: "36px",
    minHeight: "44px",
    cursor: "pointer",
    fontFamily: "monospace",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};

const s = {
  page: { minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column" },
  nav: { background: "#fff" },
  navInner: { maxWidth: "1152px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px" },
  navLogo: { display: "flex", alignItems: "center", gap: "10px" },
  navSquare: { width: "18px", height: "18px", background: "#000" },
  navBrand: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.15em", color: "#000", fontWeight: 500 },
  navLinks: { display: "flex", alignItems: "center", gap: "32px" },
  navLink: { background: "none", border: "none", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#525252", cursor: "pointer", padding: "4px 0", borderRadius: 0 },
  navSignOut: { background: "none", border: "1px solid #000", borderRadius: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#000", cursor: "pointer", padding: "8px 16px" },
  menuBtn: { background: "none", border: "1px solid #000", borderRadius: 0, fontSize: "16px", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace" },
  mobileMenu: { borderTop: "1px solid #E5E5E5", background: "#fff" },
  mobileMenuItem: { display: "block", width: "100%", padding: "16px 16px", background: "none", border: "none", borderBottom: "1px solid #E5E5E5", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#000", cursor: "pointer", textAlign: "left" },
  navRule: { height: "4px", background: "#000" },
  hero: { backgroundColor: "#fff", position: "relative", backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 1px,#000 1px,#000 2px)", backgroundSize: "100% 4px" },
  heroInner: { maxWidth: "1152px", margin: "0 auto", display: "grid", alignItems: "end", position: "relative", zIndex: 1, background: "#fff" },
  heroEyebrow: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "#525252", marginBottom: "16px" },
  heroTitle: { fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 800, color: "#000", lineHeight: 0.95, letterSpacing: "-0.03em" },
  heroItalic: { fontStyle: "italic", fontWeight: 400 },
  heroRule: { width: "48px", height: "4px", background: "#000", marginTop: "28px" },
  heroRight: { display: "flex", flexDirection: "column", gap: "20px" },
  heroDate: { fontFamily: "'Playfair Display',Georgia,serif", fontStyle: "italic", fontSize: "1.125rem", color: "#525252" },
  progressBlock: { border: "1px solid #000", padding: "20px 24px" },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" },
  progressLabel: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#525252" },
  progressCount: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.5rem", fontWeight: 700, color: "#000" },
  progressTrack: { height: "3px", background: "#E5E5E5", marginBottom: "8px" },
  progressFill: { height: "100%", background: "#000", transition: "width 0.4s ease" },
  progressPct: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.08em", color: "#525252" },
  sectionRule: { height: "4px", background: "#000" },
  main: { maxWidth: "1152px", margin: "0 auto", width: "100%" },
  state: { display: "flex", flexDirection: "column", alignItems: "flex-start", paddingTop: "48px", maxWidth: "480px" },
  stateEyebrow: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "#525252", marginBottom: "16px" },
  stateHeadline: { fontFamily: "'Playfair Display',Georgia,serif", fontWeight: 700, color: "#000", lineHeight: 1.05, letterSpacing: "-0.02em" },
  stateRule: { width: "40px", height: "4px", background: "#000", margin: "24px 0" },
  stateSub: { fontFamily: "'Source Serif 4',Georgia,serif", fontSize: "1rem", color: "#525252", lineHeight: 1.625, marginBottom: "32px" },
  stateMsg: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.8rem", color: "#525252", marginTop: "8px" },
  cta: { background: "#000", color: "#fff", border: "none", borderRadius: 0, padding: "16px 32px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", letterSpacing: "0.12em", cursor: "pointer" },
  medGrid: { display: "grid", gap: "1px", border: "1px solid #000", background: "#000" },
  fab: { position: "fixed", width: "56px", height: "56px", background: "#000", color: "#fff", border: "none", borderRadius: 0, fontSize: "28px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 300, zIndex: 100 },
};

const cs = {
  card: { background: "#fff", padding: "24px", display: "flex", flexDirection: "column" },
  cardTop: { marginBottom: "16px" },
  medName: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: "1.35rem", fontWeight: 700, color: "#000", marginBottom: "6px", lineHeight: 1.1 },
  medMeta: { display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" },
  metaDose: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.75rem", color: "#000", letterSpacing: "0.05em" },
  metaDot: { color: "#525252", fontSize: "0.75rem" },
  metaFreq: { fontFamily: "'Source Serif 4',Georgia,serif", fontStyle: "italic", fontSize: "0.85rem", color: "#525252" },
  notes: { fontFamily: "'Source Serif 4',Georgia,serif", fontStyle: "italic", fontSize: "0.8rem", color: "#525252", marginTop: "8px", lineHeight: 1.5 },
  divider: { height: "1px", background: "#E5E5E5", marginBottom: "16px" },
  timesCol: { display: "flex", flexDirection: "column", gap: "10px" },
  timeRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" },
  timeLabel: { display: "flex", alignItems: "center", gap: "8px" },
  timeDot: { fontSize: "10px", color: "#000" },
  timeText: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.1em", color: "#000" },
  actions: { display: "flex", gap: "8px" },
  takenBtn: { background: "#000", color: "#fff", border: "none", borderRadius: 0, padding: "8px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", minWidth: "64px" },
  skipBtn: { background: "transparent", color: "#000", border: "1px solid #000", borderRadius: 0, padding: "8px 14px", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.1em", cursor: "pointer", minWidth: "48px" },
  badge: { padding: "8px 12px", borderRadius: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.1em", fontWeight: 500, whiteSpace: "nowrap" },
};