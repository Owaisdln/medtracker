import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function History() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "logs"),
      where("userId", "==", uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, []);

  function groupByDate() {
    const groups = {};
    logs.forEach((log) => {
      const date = log.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    // Sort by most recent first
    return Object.fromEntries(
      Object.entries(groups).sort(
        (a, b) => new Date(b[0]) - new Date(a[0])
      )
    );
  }

  function getChartData() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const shortLabel = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const dayLogs = logs.filter((l) => l.date === dateStr);
      const taken = dayLogs.filter((l) => l.status === "taken").length;
      const skipped = dayLogs.filter((l) => l.status === "skipped").length;
      days.push({ day: shortLabel, taken, skipped, total: taken + skipped });
    }
    return days;
  }

  const grouped = groupByDate();
  const chartData = getChartData();
  const totalTaken = logs.filter((l) => l.status === "taken").length;
  const totalSkipped = logs.filter((l) => l.status === "skipped").length;
  const adherenceRate =
    totalTaken + totalSkipped > 0
      ? Math.round((totalTaken / (totalTaken + totalSkipped)) * 100)
      : 0;

  return (
    <div style={s.page}>
      {/* ── Header ────────────────────────────── */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <button
            id="history-back-btn"
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

      {/* ── Page Title ────────────────────────── */}
      <div style={s.titleBand}>
        <div style={s.titleInner}>
          <p style={s.eyebrow}>DOSE LOG</p>
          <h1 style={s.pageTitle}>Adherence<br /><em style={s.italic}>History</em></h1>
        </div>
      </div>

      <div style={s.bodyRule} />

      <div style={s.body}>
        {/* ── Stats Row ─────────────────────── */}
        <div style={s.statsStrip}>
          <StatBlock label="ADHERENCE" value={`${adherenceRate}%`} inverted />
          <StatBlock label="TAKEN" value={totalTaken} />
          <StatBlock label="SKIPPED" value={totalSkipped} />
          <StatBlock label="TOTAL DOSES" value={totalTaken + totalSkipped} />
        </div>

        <div style={s.sectionRule} />

        {/* ── Chart ─────────────────────────── */}
        <section style={s.section}>
          <p style={s.sectionLabel}>LAST 7 DAYS</p>
          <div style={s.chartWrap}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={32} barGap={4}>
                <XAxis
                  dataKey="day"
                  tick={{
                    fontSize: 10,
                    fill: "#525252",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.08em",
                  }}
                  axisLine={{ stroke: "#000", strokeWidth: 1 }}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "#000",
                    border: "none",
                    borderRadius: 0,
                    padding: "8px 14px",
                    fontSize: "11px",
                    fontFamily: "'JetBrains Mono', monospace",
                    color: "#fff",
                    letterSpacing: "0.05em",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                />
                <Bar dataKey="taken" name="Taken" radius={[0, 0, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.taken > 0 ? "#000" : "#E5E5E5"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div style={s.sectionRule} />

        {/* ── Log List ──────────────────────── */}
        <section style={s.section}>
          <p style={s.sectionLabel}>DETAILED LOG</p>

          {loading ? (
            <p style={s.loadingText}>Loading history...</p>
          ) : logs.length === 0 ? (
            <div style={s.empty}>
              <h2 style={s.emptyHeadline}>No history<br /><em>yet</em></h2>
              <div style={s.emptyRule} />
              <p style={s.emptySub}>Start marking doses on the home screen to see your history here.</p>
            </div>
          ) : (
            <div style={s.logGroups}>
              {Object.entries(grouped).map(([date, dateLogs]) => (
                <div key={date} style={s.dateGroup}>
                  <div style={s.dateHeader}>
                    <span style={s.dateLine} />
                    <p style={s.dateLabel}>{date}</p>
                  </div>
                  {dateLogs.map((log) => (
                    <div key={log.id} style={s.logRow}>
                      <div style={s.logLeft}>
                        <p style={s.logName}>{log.medicationName}</p>
                        <p style={s.logMeta}>{log.dose} · {log.time}</p>
                      </div>
                      <div style={{
                        ...s.logBadge,
                        background: log.status === "taken" ? "#000" : "transparent",
                        color: log.status === "taken" ? "#fff" : "#000",
                        border: log.status === "taken" ? "none" : "1px solid #000",
                      }}>
                        {log.status === "taken" ? "✓ TAKEN" : "✗ SKIPPED"}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatBlock({ label, value, inverted = false }) {
  return (
    <div style={{
      ...st.block,
      background: inverted ? "#000" : "#fff",
      borderRight: inverted ? "none" : "1px solid #000",
    }}>
      <p style={{
        ...st.value,
        color: inverted ? "#fff" : "#000",
      }}>{value}</p>
      <p style={{
        ...st.label,
        color: inverted ? "rgba(255,255,255,0.5)" : "#525252",
      }}>{label}</p>
    </div>
  );
}

const st = {
  block: {
    flex: 1,
    padding: "28px 32px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  value: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "2.5rem",
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "-0.02em",
  },
  label: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.55rem",
    letterSpacing: "0.15em",
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
  titleBand: {
    padding: "56px 40px 48px",
    maxWidth: "1152px",
    margin: "0 auto",
    width: "100%",
  },
  titleInner: {},
  eyebrow: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#525252",
    marginBottom: "16px",
  },
  pageTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "clamp(3rem, 5vw, 5rem)",
    fontWeight: 800,
    color: "#000",
    lineHeight: 0.95,
    letterSpacing: "-0.03em",
  },
  italic: {
    fontStyle: "italic",
    fontWeight: 400,
  },
  bodyRule: {
    height: "4px",
    background: "#000",
    margin: "0 40px",
  },
  body: {
    maxWidth: "1152px",
    margin: "0 auto",
    padding: "0 40px 80px",
    width: "100%",
  },
  statsStrip: {
    display: "flex",
    border: "1px solid #000",
    marginTop: "40px",
    flexWrap: "wrap",
  },
  sectionRule: {
    height: "1px",
    background: "#E5E5E5",
    margin: "40px 0",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  sectionLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.15em",
    color: "#525252",
  },
  chartWrap: {
    border: "1px solid #E5E5E5",
    padding: "24px 8px 8px",
  },
  loadingText: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.75rem",
    color: "#525252",
    letterSpacing: "0.05em",
  },
  empty: {
    paddingTop: "24px",
    maxWidth: "400px",
  },
  emptyHeadline: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "#000",
    lineHeight: 1.05,
    letterSpacing: "-0.02em",
  },
  emptyRule: {
    width: "40px",
    height: "4px",
    background: "#000",
    margin: "20px 0",
  },
  emptySub: {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: "0.95rem",
    color: "#525252",
    lineHeight: 1.625,
  },
  logGroups: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
  },
  dateGroup: {
    borderBottom: "1px solid #E5E5E5",
    paddingBottom: "0",
  },
  dateHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "16px 0 8px",
  },
  dateLine: {
    display: "block",
    width: "24px",
    height: "2px",
    background: "#000",
    flexShrink: 0,
  },
  dateLabel: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.12em",
    color: "#525252",
  },
  logRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderTop: "1px solid #F5F5F5",
  },
  logLeft: {},
  logName: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: "1rem",
    fontWeight: 600,
    color: "#000",
    marginBottom: "2px",
  },
  logMeta: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.65rem",
    color: "#525252",
    letterSpacing: "0.05em",
  },
  logBadge: {
    padding: "7px 14px",
    borderRadius: 0,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: "0.6rem",
    letterSpacing: "0.1em",
    flexShrink: 0,
  },
};