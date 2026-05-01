import { useState } from "react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useBreakpoint } from "../hooks/useBreakpoint";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isMobile } = useBreakpoint();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignUp) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ ...s.page, flexDirection: isMobile ? "column" : "row" }}>
      {/* Left panel — desktop only */}
      {!isMobile && (
        <div style={s.left}>
          <div style={s.leftInner}>
            <div style={s.logoMark}><div style={s.logoSquare} /></div>
            <div>
              <p style={s.eyebrow}>MEDICATION MANAGEMENT</p>
              <h1 style={s.heroHeadline}>Med<br />Track<span style={s.heroItalic}>er</span></h1>
            </div>
            <div style={s.leftRule} />
            <p style={s.heroSub}>Discipline. Routine.<br />Health.</p>
            <p style={s.leftCaption}>Track every dose. Never miss a moment.</p>
          </div>
        </div>
      )}

      {/* Right / full-width form */}
      <div style={{ ...s.right, padding: isMobile ? "0" : "48px 40px" }}>
        <div style={{ ...s.formWrap, maxWidth: isMobile ? "100%" : "400px" }}>

          {/* Mobile: black hero strip */}
          {isMobile && (
            <div style={s.mobileStrip}>
              <div style={s.mobileStripInner}>
                <div style={s.mobileLogoRow}>
                  <div style={s.mobileSquare} />
                  <span style={s.mobileBrand}>MEDTRACKER</span>
                </div>
                <h1 style={s.mobileHeroTitle}>Med<span style={s.mobileHeroItalic}>Tracker</span></h1>
                <p style={s.mobileHeroSub}>Track every dose. Never miss a moment.</p>
              </div>
            </div>
          )}

          <div style={{ padding: isMobile ? "40px 24px 60px" : "0" }}>
            <div style={s.formHeader}>
              <p style={s.formEyebrow}>{isSignUp ? "CREATE ACCOUNT" : "SIGN IN"}</p>
              <div style={s.formRule} />
              <h2 style={s.formTitle}>{isSignUp ? "Begin your journey" : "Welcome back"}</h2>
            </div>

            {error && (
              <div style={s.errorBox}>
                <span style={s.errorDot}>■</span>
                <p style={s.errorText}>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={s.form}>
              <div style={s.field}>
                <label style={s.label} htmlFor="login-email">EMAIL ADDRESS</label>
                <input id="login-email" style={s.input} type="email" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div style={s.field}>
                <label style={s.label} htmlFor="login-password">PASSWORD</label>
                <input id="login-password" style={s.input} type="password" placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button id="login-submit-btn" style={{ ...s.submitBtn, opacity: loading ? 0.6 : 1 }}
                type="submit" disabled={loading}>
                {loading ? "PLEASE WAIT..." : isSignUp ? "CREATE ACCOUNT →" : "SIGN IN →"}
              </button>
            </form>

            <div style={s.switchRow}>
              <div style={s.switchRule} />
              <p style={s.switchText}>
                {isSignUp ? "Have an account?" : "No account?"}{" "}
                <button style={s.switchBtn} onClick={() => { setIsSignUp(!isSignUp); setError(""); }}>
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", background: "#fff" },
  left: { flex: "0 0 42%", background: "#000", display: "flex", alignItems: "stretch", overflow: "hidden" },
  leftInner: {
    padding: "64px 56px", display: "flex", flexDirection: "column",
    justifyContent: "space-between", width: "100%",
    background: "repeating-linear-gradient(90deg,transparent,transparent 1px,rgba(255,255,255,0.04) 1px,rgba(255,255,255,0.04) 2px)",
    backgroundSize: "4px 100%",
  },
  logoMark: { display: "flex", alignItems: "center", gap: "10px" },
  logoSquare: { width: "28px", height: "28px", border: "2px solid #fff", background: "transparent" },
  heroHeadline: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: "clamp(4rem,7vw,7rem)", fontWeight: 800, color: "#fff", lineHeight: 0.9, letterSpacing: "-0.03em", marginTop: "24px" },
  heroItalic: { fontStyle: "italic", fontWeight: 400 },
  eyebrow: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", marginBottom: "8px" },
  leftRule: { width: "48px", height: "4px", background: "#fff", margin: "32px 0" },
  heroSub: { fontFamily: "'Playfair Display',Georgia,serif", fontStyle: "italic", fontSize: "1.75rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.3 },
  leftCaption: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center" },
  formWrap: { width: "100%" },
  mobileStrip: { background: "#000" },
  mobileStripInner: {
    padding: "40px 24px 36px",
    background: "repeating-linear-gradient(90deg,transparent,transparent 1px,rgba(255,255,255,0.04) 1px,rgba(255,255,255,0.04) 2px)",
    backgroundSize: "4px 100%",
  },
  mobileLogoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" },
  mobileSquare: { width: "16px", height: "16px", border: "2px solid #fff", background: "transparent" },
  mobileBrand: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)" },
  mobileHeroTitle: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: "2.75rem", fontWeight: 800, color: "#fff", lineHeight: 0.95, letterSpacing: "-0.03em" },
  mobileHeroItalic: { fontStyle: "italic", fontWeight: 400 },
  mobileHeroSub: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginTop: "12px" },
  formHeader: { marginBottom: "40px" },
  formEyebrow: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.15em", color: "#525252", marginBottom: "12px" },
  formRule: { height: "4px", background: "#000", width: "40px", marginBottom: "16px" },
  formTitle: { fontFamily: "'Playfair Display',Georgia,serif", fontSize: "2rem", fontWeight: 700, color: "#000", lineHeight: 1.1 },
  errorBox: { border: "1px solid #000", padding: "12px 16px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "10px" },
  errorDot: { fontSize: "8px", flexShrink: 0, marginTop: "4px" },
  errorText: { fontSize: "0.8rem", fontFamily: "'JetBrains Mono',monospace", color: "#000", lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: "28px" },
  field: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "#525252" },
  input: { width: "100%", padding: "14px 0", background: "transparent", border: "none", borderBottom: "2px solid #000", fontSize: "1rem", fontFamily: "'Source Serif 4',Georgia,serif", color: "#000", outline: "none", borderRadius: 0 },
  submitBtn: { marginTop: "8px", padding: "18px 24px", background: "#000", color: "#fff", border: "none", borderRadius: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: "0.7rem", letterSpacing: "0.15em", cursor: "pointer", textAlign: "center", width: "100%" },
  switchRow: { marginTop: "40px" },
  switchRule: { height: "1px", background: "#E5E5E5", marginBottom: "24px" },
  switchText: { fontFamily: "'Source Serif 4',Georgia,serif", fontSize: "0.875rem", color: "#525252" },
  switchBtn: { background: "none", border: "none", fontFamily: "'Source Serif 4',Georgia,serif", fontSize: "0.875rem", color: "#000", fontWeight: 600, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px", padding: 0 },
};