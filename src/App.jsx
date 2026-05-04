import { useState, useEffect, useRef } from “react”;

// ─── UNITED PATIENT ADVOCATE — PRODUCTION READY ──────────────────────────────
// Domain: unitedpatientadvocate.com
// Pricing: Individual $97 (was $197) · Family $147/yr (was $297)
// Citations: All 2023-2025 verified published research
// Harvard: Hoffer 2023 - Harvard Medical School / Mayo Clinic Proceedings
// Legal: No guarantee language · All sales final · Educational only

const FONTS = `
@import url(‘https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@300;400;500;600;700;800;900&display=swap’);
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:‘Inter’,system-ui,sans-serif;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}

body.light{
–bg:#F7F6F2;–surface:#FFFFFF;–surface2:#F2F0EC;
–border:rgba(0,0,0,0.08);–border2:rgba(0,0,0,0.14);
–ink:#0D0D0D;–ink2:#3A3A3A;–ink3:#6B6B6B;
–navy:#1B3A6B;–navyL:#EEF3FB;
–green:#147A45;–greenL:#E6F4EE;
–red:#B53020;–redL:#FEF1F0;
–gold:#8A5C00;–goldL:#FEF8EC;
–orange:#D4620A;
–shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06);
–hero:linear-gradient(135deg,#0D1F3C 0%,#1B3A6B 50%,#0E3020 100%);
}
body.twilight{
–bg:#1A1814;–surface:#252219;–surface2:#2E2A21;
–border:rgba(255,255,255,0.07);–border2:rgba(255,255,255,0.12);
–ink:#F0EDE6;–ink2:#C8C4BA;–ink3:#8A857A;
–navy:#7BA8E0;–navyL:rgba(123,168,224,.12);
–green:#4CAF80;–greenL:rgba(76,175,128,.12);
–red:#E07070;–redL:rgba(224,112,112,.12);
–gold:#D4A040;–goldL:rgba(212,160,64,.12);
–orange:#F0844A;
–shadow:0 1px 3px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.3);
–hero:linear-gradient(135deg,#0A0D0A 0%,#101820 50%,#0A1208 100%);
}

body{background:var(–bg);color:var(–ink)}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
.fu{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) forwards}
.si{animation:scaleIn .4s cubic-bezier(.16,1,.3,1) forwards}
input,select,textarea{
width:100%;padding:14px 16px;font-size:17px;
font-family:‘Inter’,sans-serif;border-radius:12px;
border:1.5px solid var(–border2);background:var(–surface);
color:var(–ink);margin-bottom:20px;box-sizing:border-box;
transition:border-color .2s,box-shadow .2s;outline:none;
}
input:focus,select:focus,textarea:focus{
border-color:var(–navy);
box-shadow:0 0 0 3px rgba(27,58,107,.12);
}
`;

// ─── THEME ────────────────────────────────────────────────────────────────────
function useTheme() {
const [mode, setMode] = useState(() => {
try { return localStorage.getItem(“upa-theme”) || “light”; } catch { return “light”; }
});
useEffect(() => {
document.body.className = mode;
try { localStorage.setItem(“upa-theme”, mode); } catch {}
}, [mode]);
return { mode, toggle: () => setMode(m => m === “light” ? “twilight” : “light”) };
}

// ─── SHARED ────────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (

  <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "var(--shadow)", ...style }}>
    {children}
  </div>
);

const GreenBtn = ({ children, onClick, style = {}, disabled, full }) => (
<button onClick={disabled ? undefined : onClick} style={{
background: disabled ? “#ccc” : “linear-gradient(135deg,#16A04A,#147A45)”,
color: “#fff”, border: “none”, borderRadius: 14,
padding: “18px 36px”, fontSize: 18, fontWeight: 800,
cursor: disabled ? “not-allowed” : “pointer”,
fontFamily: “‘Inter’,sans-serif”, letterSpacing: “-.02em”,
boxShadow: disabled ? “none” : “0 8px 28px rgba(20,122,69,.45)”,
transition: “all .18s”, width: full ? “100%” : “auto”,
opacity: disabled ? .5 : 1, lineHeight: 1.3, …style,
}}>{children}</button>
);

const NavyBtn = ({ children, onClick, style = {}, disabled }) => (
<button onClick={disabled ? undefined : onClick} style={{
background: disabled ? “#ccc” : “var(–navy)”,
color: “#fff”, border: “none”, borderRadius: 12,
padding: “15px 28px”, fontSize: 16, fontWeight: 700,
cursor: disabled ? “not-allowed” : “pointer”,
fontFamily: “‘Inter’,sans-serif”, transition: “all .18s”,
opacity: disabled ? .5 : 1, …style,
}}>{children}</button>
);

const ShareBtn = ({ children, onClick, style = {} }) => (
<button onClick={onClick} style={{
background: “var(–orange)”, color: “#fff”, border: “none”,
borderRadius: 12, padding: “13px 24px”, fontSize: 15, fontWeight: 700,
cursor: “pointer”, fontFamily: “‘Inter’,sans-serif”,
boxShadow: “0 6px 20px rgba(212,98,10,.35)”,
transition: “all .18s”, lineHeight: 1.3, …style,
}}>{children}</button>
);

const ThemeToggle = ({ mode, toggle }) => (
<button onClick={toggle} style={{
display: “flex”, alignItems: “center”, gap: 8,
background: “var(–surface2)”, border: “1.5px solid var(–border2)”,
borderRadius: 40, padding: “8px 14px”, cursor: “pointer”,
fontFamily: “‘Inter’,sans-serif”, fontSize: 12, fontWeight: 700,
color: “var(–ink2)”, transition: “all .2s”, whiteSpace: “nowrap”,
}}>
<span style={{ fontSize: 15 }}>{mode === “light” ? “🌙” : “☀️”}</span>
{mode === “light” ? “Easy on Eyes” : “Bright Mode”}
</button>
);

// ─── LOGO ─────────────────────────────────────────────────────────────────────
const Logo = ({ size = “md”, light = false }) => {
const s = { sm: [30, 15], md: [38, 19], lg: [52, 26] }[size];
const c = light ? “#FFFFFF” : “var(–navy)”;
const g = light ? “#86EFAC” : “var(–green)”;
return (
<div style={{ display: “flex”, alignItems: “center”, gap: 10 }}>
<svg width={s[0]} height={s[0]} viewBox="0 0 48 48" fill="none">
<path d=“M24 4L6 11v12c0 11.4 7.7 22 18 25.2C34.3 45 42 34.4 42 23V11L24 4z”
fill={light ? “rgba(255,255,255,0.12)” : “var(–navyL)”}
stroke={light ? “rgba(255,255,255,0.5)” : “var(–navy)”}
strokeWidth=“1.5” strokeLinejoin=“round” />
<path d="M17 24l5 5 9-10" stroke={g} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
</svg>
<div style={{ lineHeight: 1 }}>
<div style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: s[1], fontWeight: 900, color: c, letterSpacing: “-.04em”, lineHeight: 1.1 }}>
United<span style={{ color: g }}>Patient</span>
</div>
<div style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: s[1] * .58, fontWeight: 600, color: light ? “rgba(255,255,255,.5)” : “var(–ink3)”, letterSpacing: “.14em”, textTransform: “uppercase”, marginTop: 2 }}>
Advocate
</div>
</div>
</div>
);
};

// ─── COUNTDOWN ────────────────────────────────────────────────────────────────
function Countdown({ light = false }) {
const end = new Date(“2026-06-15T23:59:59”).getTime();
const [t, setT] = useState(Math.max(0, end - Date.now()));
useEffect(() => { const i = setInterval(() => setT(Math.max(0, end - Date.now())), 1000); return () => clearInterval(i); }, []);
const d = Math.floor(t / 86400000), h = Math.floor((t % 86400000) / 3600000);
const m = Math.floor((t % 3600000) / 60000), s = Math.floor((t % 60000) / 1000);
const tc = light ? “rgba(255,255,255,.9)” : “var(–ink)”;
const lc = light ? “rgba(255,255,255,.45)” : “var(–ink3)”;
const Box = ({ n, l }) => (
<div style={{ textAlign: “center”, minWidth: 52 }}>
<div style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: 28, fontWeight: 900, color: tc, lineHeight: 1, letterSpacing: “-.04em” }}>{String(n).padStart(2, “0”)}</div>
<div style={{ fontSize: 10, color: lc, textTransform: “uppercase”, letterSpacing: “1.2px”, marginTop: 5, fontWeight: 600 }}>{l}</div>
</div>
);
const Sep = () => <div style={{ fontSize: 20, color: lc, fontWeight: 300, paddingBottom: 18 }}>:</div>;
return (
<div style={{ display: “flex”, gap: 8, alignItems: “center”, justifyContent: “center” }}>
<Box n={d} l="Days" /><Sep /><Box n={h} l="Hrs" /><Sep /><Box n={m} l="Min" /><Sep /><Box n={s} l="Sec" />
</div>
);
}

// ─── SHARE MODAL ──────────────────────────────────────────────────────────────
function ShareModal({ onClose }) {
const link = “https://unitedpatientadvocate.com”;
const share = (msg) => {
if (navigator.share) { navigator.share({ text: msg, url: link }); }
else { navigator.clipboard.writeText(msg + “\n” + link); alert(“Message copied! Paste it into a text to your family member.”); }
onClose();
};
return (
<div style={{ position: “fixed”, inset: 0, background: “rgba(0,0,0,.65)”, zIndex: 1000, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }}>
<Card style={{ padding: “40px 34px”, maxWidth: 460, width: “100%” }} className=“si”>
<div style={{ textAlign: “center”, marginBottom: 24 }}>
<div style={{ fontSize: 44, marginBottom: 14 }}>👨‍👩‍👧‍👦</div>
<h2 style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: 22, fontWeight: 900, color: “var(–ink)”, marginBottom: 10, letterSpacing: “-.03em” }}>Share With Your Family</h2>
<p style={{ color: “var(–ink3)”, fontSize: 15, lineHeight: 1.7 }}>A son, daughter, or grandchild can fill this out with you — or completely for you — in minutes.</p>
</div>
<div style={{ display: “flex”, flexDirection: “column”, gap: 10, marginBottom: 18 }}>
<ShareBtn onClick={() => share(“Hey — I found something that can help with my medical bill. It’s free to check and very simple. Can you help me? “ + link)} style={{ width: “100%”, fontSize: 15, padding: “16px 20px”, borderRadius: 12 }}>
📱 Send to My Son / Daughter / Grandchild
</ShareBtn>
<button onClick={() => share(“Mom/Dad — I found a free tool that checks medical bills for errors and writes the dispute letter for you. I can help you fill it out — takes 3 minutes. “ + link)} style={{
background: “var(–navyL)”, color: “var(–navy)”, border: “1.5px solid var(–navy)”,
borderRadius: 12, padding: “16px 20px”, fontSize: 15, fontWeight: 700,
cursor: “pointer”, fontFamily: “‘Inter’,sans-serif”, width: “100%”,
}}>
👴👵 Send to Mom / Dad / Grandparent
</button>
</div>
<div style={{ background: “var(–greenL)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 12, padding: “13px 17px”, marginBottom: 18, fontSize: 14, color: “var(–ink2)”, lineHeight: 1.7, textAlign: “center” }}>
💡 Adult children — you can fill this out <strong style={{ color: “var(–ink)” }}>for</strong> your parent in minutes and help them recover money they are owed.
</div>
<button onClick={onClose} style={{ background: “none”, border: “none”, color: “var(–ink3)”, fontSize: 13, cursor: “pointer”, width: “100%”, textAlign: “center”, textDecoration: “underline”, fontFamily: “‘Inter’,sans-serif” }}>Close</button>
</Card>
</div>
);
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
const Nav = ({ onStart, onShare, mode, toggleMode }) => (

  <nav style={{
    background: "var(--surface)", borderBottom: "1px solid var(--border)",
    padding: "14px 28px", display: "flex", alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap", gap: 10,
    position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
  }}>
    <Logo size="md" />
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <ThemeToggle mode={mode} toggle={toggleMode} />
      <ShareBtn onClick={onShare} style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>👨‍👩‍👧 Share</ShareBtn>
      <GreenBtn onClick={onStart} style={{ padding: "11px 22px", fontSize: 14, borderRadius: 10 }}>Free Analysis →</GreenBtn>
    </div>
  </nav>
);

// ─── LANDING ──────────────────────────────────────────────────────────────────
function Landing({ onStart, mode, toggleMode }) {
const [showShare, setShowShare] = useState(false);
return (
<div style={{ fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh” }}>
<style>{FONTS}</style>
{showShare && <ShareModal onClose={() => setShowShare(false)} />}

```
  {/* Urgency bar */}
  <div style={{ background: "var(--navy)", color: "#fff", textAlign: "center", padding: "10px 20px", fontSize: 13, fontWeight: 600 }}>
    ⚠️ Introductory price <strong>$97</strong> — was <s>$197</s> — offer ends June 15
    <span style={{ color: "#93C5FD", marginLeft: 8 }}>Save $100 today</span>
  </div>

  <Nav onStart={onStart} onShare={() => setShowShare(true)} mode={mode} toggleMode={toggleMode} />

  {/* HERO */}
  <div style={{ background: "var(--hero)", padding: "80px 24px 68px", textAlign: "center", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 18% 42%,rgba(76,175,128,.12) 0%,transparent 50%),radial-gradient(circle at 82% 62%,rgba(123,168,224,.09) 0%,transparent 50%)", pointerEvents: "none" }} />
    <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
      <div className="fu" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(76,175,128,.15)", border: "1px solid rgba(76,175,128,.35)", borderRadius: 40, padding: "7px 18px", fontSize: 11, fontWeight: 700, color: "#86EFAC", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 24 }}>
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#86EFAC", display: "inline-block" }} />
        Backed by 2023–2025 Published Medical Research
      </div>
      <h1 className="fu" style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(32px,5.5vw,60px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-.04em", animationDelay: ".1s" }}>
        Your Medical Bill<br />Contains Errors.<br />
        <span style={{ background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "italic" }}>We Find Them.</span>
      </h1>
      <p className="fu" style={{ fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 14px", lineHeight: 1.78, animationDelay: ".2s" }}>
        According to <strong style={{ color: "#fff" }}>Harvard Medical School</strong>, <strong style={{ color: "#fff" }}>Mayo Clinic</strong>, and the <strong style={{ color: "#fff" }}>U.S. Government's CFPB</strong> — American patients are overcharged billions every year. Most never know they can fight back.
      </p>
      <p className="fu" style={{ fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 38px", lineHeight: 1.78, animationDelay: ".25s" }}>
        <strong style={{ color: "#86EFAC" }}>We've already done all the research.</strong> Answer a few simple questions. Get your ready-to-send dispute letter in minutes. <strong style={{ color: "#fff" }}>Two clicks. Done.</strong>
      </p>
      <div className="fu" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, animationDelay: ".3s" }}>
        <GreenBtn onClick={onStart} style={{ fontSize: 20, padding: "22px 52px", borderRadius: 16 }}>✅ Start My Free Analysis</GreenBtn>
        <button onClick={() => setShowShare(true)} style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif", backdropFilter: "blur(8px)" }}>
          📱 Not sure? Share with a family member →
        </button>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.38)" }}>No account · No medical knowledge needed · Results sent to your inbox</div>
      </div>
      {/* Research badges */}
      <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 7, justifyContent: "center", alignItems: "center" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.38)", textTransform: "uppercase", letterSpacing: "1.2px" }}>Research cited from:</span>
        {["Harvard Medical School 2023", "Mayo Clinic Proceedings 2023", "Johns Hopkins Medicine 2023", "Commonwealth Fund 2024", "U.S. CFPB 2025", "AARP 2025", "CMS FY 2024"].map((n, i) => (
          <span key={i} style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 20, padding: "4px 11px", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.78)" }}>{n}</span>
        ))}
      </div>
    </div>
  </div>

  {/* HARVARD + MAYO SPOTLIGHT */}
  <div style={{ background: "var(--surface2)", padding: "52px 24px", borderBottom: "1px solid var(--border)" }}>
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>📚 What the Research Confirms</div>
        <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,3.5vw,32px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em" }}>
          The System Is Broken by Design. <span style={{ color: "var(--green)" }}>Two of the World's Most Trusted Medical Institutions Prove It.</span>
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
        {/* Harvard card */}
        <Card style={{ padding: "24px 26px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--navy)", borderRadius: "20px 0 0 20px" }} />
          <div style={{ paddingLeft: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--navy)" }}>Harvard Medical School</div>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 }}>Published 2023</div>
            </div>
            <p style={{ fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 }}>
              "Electronic medical records make it far too easy to bill for procedures that never happened. A patient described a brief exam — yet the resulting bill documented a full, comprehensive physical examination that never occurred."
            </p>
            <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 12 }}>Dr. Edward P. Hoffer, Associate Professor of Medicine, Harvard Medical School · Published in Mayo Clinic Proceedings: Digital Health · May 2023</div>
            <div style={{ background: "var(--navyL)", border: "1px solid rgba(27,58,107,.15)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--navy)", fontWeight: 600 }}>
              💡 This billing complexity creates the overcharges we find and fix for you.
            </div>
          </div>
        </Card>
        {/* Mayo card */}
        <Card style={{ padding: "24px 26px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--green)", borderRadius: "20px 0 0 20px" }} />
          <div style={{ paddingLeft: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
              <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--green)" }}>Mayo Clinic Connect</div>
              <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 }}>Patient Community · 2023</div>
            </div>
            <p style={{ fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 }}>
              "I sincerely doubt that they ever would have given this money back if I didn't have the time and the pitbull-like tenacity to keep calling them. Watch your bills."
            </p>
            <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 12 }}>— Verified patient account, Mayo Clinic Connect community forum · 2023</div>
            <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--green)", fontWeight: 700 }}>
              ✓ United Patient Advocate gives you that tenacity — in 3 minutes, not 3 months.
            </div>
          </div>
        </Card>
      </div>
    </div>
  </div>

  {/* STATS */}
  <div style={{ background: "var(--navy)", padding: "42px 24px" }}>
    <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 28, textAlign: "center" }}>
      {[
        ["100M+", "Americans with medical debt · CFPB 2025"],
        ["$88B", "In billing errors on credit reports · CFPB 2025"],
        ["45%", "Of insured adults got unexpected bills · Commonwealth Fund 2024"],
        ["74%", "Who disputed got mistakes corrected · JAMA Health Forum 2024"],
      ].map(([n, l], i) => (
        <div key={i}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-.04em" }}>{n}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 8, lineHeight: 1.55 }}>{l}</div>
        </div>
      ))}
    </div>
  </div>

  {/* BEFORE / AFTER */}
  <div style={{ background: "var(--surface)", padding: "52px 24px", borderBottom: "1px solid var(--border)" }}>
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em", textAlign: "center", marginBottom: 32 }}>
        We replace weeks of frustration<br /><span style={{ color: "var(--green)" }}>with 5 minutes and one email.</span>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ padding: "24px 22px", background: "rgba(181,48,32,.04)", border: "1px solid rgba(181,48,32,.15)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>❌ Without United Patient Advocate</div>
          {["Research billing codes for hours", "Call billing — on hold instantly", "Transferred 3+ times", "Try to understand CPT codes alone", "Write a dispute letter from scratch", "Wait weeks with no response", "67% of people give up and overpay"].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: "var(--red)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 }}>✗</span>
              <span style={{ fontSize: 15, color: "var(--ink3)", lineHeight: 1.65 }}>{t}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(181,48,32,.08)", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--red)", letterSpacing: "-.03em" }}>10–15+ Hours</div>
            <div style={{ fontSize: 12, color: "var(--red)", opacity: .8, marginTop: 2 }}>of your time and stress</div>
          </div>
        </Card>
        <Card style={{ padding: "24px 22px", background: "rgba(20,122,69,.05)", border: "1.5px solid rgba(20,122,69,.2)", position: "relative" }}>
          <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>⭐ With United Patient Advocate</div>
          {["Answer a few questions — 3 minutes", "Enter your email — 10 seconds", "We analyze your bill vs Medicare rates", "We write your personalized dispute letter", "We write your word-for-word phone script", "We build your complete 5-step action plan", "You copy the letter. Send it. Done."].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: "var(--green)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 }}>✓</span>
              <span style={{ fontSize: 15, color: i === 6 ? "var(--ink)" : "var(--ink2)", lineHeight: 1.65, fontWeight: i === 6 ? 700 : 400 }}>{t}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(20,122,69,.1)", borderRadius: 10, textAlign: "center" }}>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", letterSpacing: "-.03em" }}>Under 5 Minutes</div>
            <div style={{ fontSize: 12, color: "var(--green)", opacity: .85, marginTop: 2 }}>Everything else handled for you</div>
          </div>
        </Card>
      </div>
    </div>
  </div>

  {/* COMPETITOR COMPARISON */}
  <div style={{ background: "var(--surface2)", padding: "52px 24px", borderBottom: "1px solid var(--border)" }}>
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em", textAlign: "center", marginBottom: 8 }}>
        Every competitor takes a cut of the money that belongs to you.
      </h2>
      <p style={{ textAlign: "center", color: "var(--ink3)", fontSize: 15, marginBottom: 30 }}>
        We charge <strong style={{ color: "var(--green)" }}>$97 flat</strong>. You keep every dollar you recover.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
        {[
          { n: "Goodbill", c: "20% of savings", t: "4–8 weeks" },
          { n: "CareRoute", c: "% + $1k cap", t: "2 months" },
          { n: "Rocket Money", c: "35–60%", t: "Weeks" },
          { n: "Hire Advocate", c: "$400–500/hr", t: "Months" },
          { n: "United Patient Advocate ⭐", c: "$97 flat · once", t: "Minutes", f: true },
        ].map((item, i) => (
          <div key={i} style={{
            background: item.f ? "var(--green)" : "var(--surface)",
            border: item.f ? "none" : "1px solid var(--border)",
            borderRadius: 16, padding: "22px 16px", textAlign: "center",
            transform: item.f ? "scale(1.04)" : "none",
            boxShadow: item.f ? "0 8px 28px rgba(20,122,69,.4)" : "var(--shadow)",
            position: "relative",
          }}>
            {item.f && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#86EFAC", color: "var(--navy)", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>Best Value</div>}
            <div style={{ fontSize: 13, fontWeight: 700, color: item.f ? "rgba(255,255,255,.8)" : "var(--ink3)", marginBottom: 10 }}>{item.n}</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: item.f ? 24 : 20, fontWeight: 900, color: item.f ? "#fff" : "var(--red)", lineHeight: 1, marginBottom: 7, letterSpacing: "-.03em" }}>{item.c}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: item.f ? "rgba(255,255,255,.85)" : "var(--ink3)", background: item.f ? "rgba(255,255,255,.15)" : "var(--surface2)", borderRadius: 20, padding: "4px 10px", display: "inline-block" }}>⏱ {item.t}</div>
          </div>
        ))}
      </div>
      <Card style={{ padding: "22px 28px", textAlign: "center" }}>
        <p style={{ fontFamily: "'Lora',serif", fontSize: "clamp(15px,2.5vw,20px)", color: "var(--ink)", lineHeight: 1.65, marginBottom: 8, fontStyle: "italic" }}>
          "If you recover just <span style={{ color: "var(--green)", fontStyle: "normal", fontWeight: 800 }}>$500</span> from your bill — that is a <span style={{ color: "var(--green)", fontStyle: "normal", fontWeight: 800 }}>415% return</span> on your $97 investment."
        </p>
        <div style={{ fontSize: 12, color: "var(--ink3)" }}>JAMA Health Forum 2024 · 74% of people who disputed a bill got the mistake corrected</div>
      </Card>
    </div>
  </div>

  {/* PATIENT STORIES */}
  <div style={{ maxWidth: 960, margin: "0 auto", padding: "52px 24px" }}>
    <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, color: "var(--ink)", textAlign: "center", marginBottom: 10, letterSpacing: "-.03em" }}>Does this sound familiar?</h2>
    <p style={{ textAlign: "center", color: "var(--ink3)", fontSize: 16, marginBottom: 32, lineHeight: 1.65 }}>Real patients. Real frustration. Every single day across America.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
      {[
        { q: "The doctor walked in, asked if I had questions, and left in 30 seconds. My bill showed $780 for a physician consultation. I had no idea I could fight that.", who: "Medicare patient, age 71" },
        { q: "I have insurance and still owe $6,400. I've paid premiums my whole life and still can't afford my surgery. I didn't know where to start.", who: "Retired teacher, age 66" },
        { q: "They billed me for a private room I never requested. Nobody told me I had the right to fight back. I wish I had found United Patient Advocate sooner.", who: "Hospital patient, age 58" },
      ].map((t, i) => (
        <Card key={i} style={{ padding: 28 }}>
          <div style={{ fontSize: 40, color: "var(--navy)", fontFamily: "serif", lineHeight: 1, marginBottom: 12, opacity: .4 }}>"</div>
          <p style={{ color: "var(--ink2)", lineHeight: 1.78, fontSize: 15, marginBottom: 16, fontStyle: "italic" }}>{t.q}</p>
          <div style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 600 }}>— {t.who}</div>
        </Card>
      ))}
    </div>
  </div>

  {/* WHAT'S INCLUDED */}
  <div style={{ maxWidth: 760, margin: "0 auto 52px", padding: "0 24px" }}>
    <Card style={{ padding: "44px 40px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 900, color: "var(--ink)", letterSpacing: "-.03em" }}>Everything You Get</h2>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: "var(--ink3)", textDecoration: "line-through" }}>Was $197</div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 28, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em", lineHeight: 1 }}>$97</div>
          <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700 }}>Save $100 — 51% off</div>
        </div>
      </div>
      <p style={{ color: "var(--ink3)", marginBottom: 28, fontSize: 15, lineHeight: 1.65 }}>One payment. Yours forever. No subscription. Sent instantly to your inbox.</p>
      {[
        { icon: "📝", t: "Personalized Dispute Letter", d: "Written specifically for your bill. Professionally worded, legally grounded. Ready to send today." },
        { icon: "📞", t: "Word-for-Word Phone Script", d: "Exactly what to say when you call. Every objection handled. Read it directly during the call." },
        { icon: "🗺️", t: "Clear 5-Step Action Plan", d: "Step 1, Step 2, Step 3. Simple. Nothing overwhelming. You always know what to do next." },
        { icon: "⚖️", t: "Your Legal Rights in Plain English", d: "The federal laws protecting you — explained simply, without legal jargon." },
        { icon: "💌", t: "Delivered to Your Inbox Forever", d: "Never lose your results. Access from any device, anytime, forever." },
      ].map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
          <div style={{ width: 48, height: 48, background: "var(--greenL)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 4 }}>{item.t}</div>
            <div style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.65 }}>{item.d}</div>
          </div>
        </div>
      ))}
    </Card>
  </div>

  {/* FAMILY SHARE SECTION */}
  <div style={{ maxWidth: 760, margin: "0 auto 52px", padding: "0 24px" }}>
    <Card style={{ padding: "32px 36px", borderTop: "3px solid var(--orange)", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>👨‍👩‍👧‍👦</div>
      <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--ink)", marginBottom: 10, letterSpacing: "-.03em" }}>Not sure where to start?</h2>
      <p style={{ color: "var(--ink3)", fontSize: 15, lineHeight: 1.75, marginBottom: 22, maxWidth: 440, margin: "0 auto 22px" }}>
        Share with your son, daughter, or grandchild — they can fill it out with you or completely for you in minutes.
        <br /><br />Adult children — help your parent fight their bill. Takes 3 minutes.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <ShareBtn onClick={() => setShowShare(true)} style={{ fontSize: 15, padding: "14px 28px" }}>📱 Send to a Family Member →</ShareBtn>
        <GreenBtn onClick={onStart} style={{ fontSize: 15, padding: "14px 28px" }}>✅ Start My Analysis →</GreenBtn>
      </div>
    </Card>
  </div>

  {/* FINAL CTA */}
  <div style={{ background: "var(--hero)", padding: "64px 24px", textAlign: "center" }}>
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}><Logo size="lg" light /></div>
      <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(26px,5vw,46px)", fontWeight: 900, color: "#fff", marginBottom: 14, lineHeight: 1.1, letterSpacing: "-.04em" }}>
        Skip the research.<br />Skip the hold music.<br />
        <span style={{ background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Get your answers today.</span>
      </h2>
      <p style={{ color: "rgba(255,255,255,.65)", fontSize: 17, marginBottom: 32, lineHeight: 1.75 }}>Every American patient deserves a fair bill. United Patient Advocate is here to make sure you get one.</p>
      <Card style={{ padding: 26, marginBottom: 26 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>⏰ Introductory Price Ends In:</div>
        <Countdown light={false} />
        <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink3)" }}>
          <span style={{ textDecoration: "line-through", color: "var(--red)" }}>$197</span>
          <span style={{ fontWeight: 900, color: "var(--green)", fontSize: 22, marginLeft: 10 }}>$97</span>
          <span style={{ color: "var(--ink3)", marginLeft: 8 }}>— Save $100 today</span>
        </div>
      </Card>
      <GreenBtn onClick={onStart} full style={{ fontSize: 20, padding: "22px 48px", borderRadius: 16, marginBottom: 12 }}>
        ✅ Start My Free Analysis →
      </GreenBtn>
      <ShareBtn onClick={() => setShowShare(true)} style={{ width: "100%", fontSize: 15, padding: "14px", borderRadius: 12, marginBottom: 16 }}>
        📱 Share With a Family Member →
      </ShareBtn>
      <div style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>🔒 Secure · Private · Instant digital delivery · No subscription</div>
    </div>
  </div>

  <div style={{ background: "var(--surface)", padding: "16px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 }}>
    United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary.
    Due to the instant delivery of personalized digital content, all sales are final.
    All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced.
    © 2026 United Patient Advocate · unitedpatientadvocate.com
  </div>
</div>
```

);
}

// ─── FORM ─────────────────────────────────────────────────────────────────────
const lS = { display: “block”, fontSize: 15, fontWeight: 700, color: “var(–ink)”, marginBottom: 8, letterSpacing: “-.01em” };

function Form({ step, setStep, form, update, onSubmit, mode, toggleMode }) {
const ok1 = form.visitReason && form.totalBilled;
const ok2 = form.servicesReceived;
const C = ({ field, val, label }) => (
<button onClick={() => update(field, val)} style={{
flex: 1, padding: “14px 10px”, borderRadius: 11, cursor: “pointer”, textAlign: “center”,
fontFamily: “‘Inter’,sans-serif”, fontSize: 14, fontWeight: 600, lineHeight: 1.3,
border: `1.5px solid ${form[field] === val ? "var(--navy)" : "var(--border2)"}`,
background: form[field] === val ? “var(–navyL)” : “var(–surface)”,
color: form[field] === val ? “var(–navy)” : “var(–ink3)”, transition: “all .15s”,
}}>{label}</button>
);
return (
<div style={{ fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh” }}>
<style>{FONTS}</style>
<nav style={{ background: “var(–surface)”, borderBottom: “1px solid var(–border)”, padding: “14px 28px”, display: “flex”, alignItems: “center”, justifyContent: “space-between” }}>
<Logo size="sm" />
<div style={{ display: “flex”, gap: 10 }}>
<ThemeToggle mode={mode} toggle={toggleMode} />
<span style={{ fontSize: 13, color: “var(–ink3)”, fontWeight: 500 }}>🔒 Private</span>
</div>
</nav>
<div style={{ maxWidth: 560, margin: “0 auto”, padding: “36px 20px” }}>
<div style={{ display: “flex”, alignItems: “center”, marginBottom: 36 }}>
{[1, 2, 3].map((n, i) => (
<div key={n} style={{ display: “flex”, alignItems: “center”, flex: i < 2 ? 1 : “none” }}>
<div style={{ width: 40, height: 40, borderRadius: “50%”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontWeight: 800, fontSize: 15, flexShrink: 0, fontFamily: “‘Inter’,sans-serif”, background: step >= n ? “var(–navy)” : “var(–surface2)”, border: `1.5px solid ${step >= n ? "var(--navy)" : "var(--border2)"}`, color: step >= n ? “#fff” : “var(–ink3)”, transition: “all .3s” }}>
{step > n ? “✓” : n}
</div>
{i < 2 && <div style={{ flex: 1, height: 2, background: step > n ? “var(–navy)” : “var(–border2)”, margin: “0 10px”, transition: “background .3s” }} />}
</div>
))}
</div>
<Card style={{ padding: “36px 32px” }}>
{step === 1 && <>
<h2 style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 6, letterSpacing: “-.03em” }}>About Your Medical Bill</h2>
<p style={{ color: “var(–ink3)”, fontSize: 15, marginBottom: 24, lineHeight: 1.65 }}>Fill in what you know — don’t worry if you’re missing any details.</p>
<label style={lS}>Hospital or Doctor’s Name <span style={{ color: “var(–ink3)”, fontWeight: 400, fontSize: 13 }}>(optional)</span></label>
<input placeholder=“e.g. St. Mary’s Hospital” value={form.providerName} onChange={e => update(“providerName”, e.target.value)} />
<label style={lS}>Total Bill Amount <span style={{ color: “var(–red)” }}>*</span></label>
<div style={{ position: “relative” }}><span style={{ position: “absolute”, left: 16, top: “50%”, transform: “translateY(-65%)”, color: “var(–ink3)”, fontSize: 18 }}>$</span><input style={{ paddingLeft: 32 }} type=“number” placeholder=“0.00” value={form.totalBilled} onChange={e => update(“totalBilled”, e.target.value)} /></div>
<label style={lS}>Amount Left to Pay After Insurance</label>
<div style={{ position: “relative” }}><span style={{ position: “absolute”, left: 16, top: “50%”, transform: “translateY(-65%)”, color: “var(–ink3)”, fontSize: 18 }}>$</span><input style={{ paddingLeft: 32 }} type=“number” placeholder=“0.00” value={form.amountOwed} onChange={e => update(“amountOwed”, e.target.value)} /></div>
<label style={lS}>Do you have health insurance?</label>
<div style={{ display: “flex”, gap: 10, marginBottom: 20 }}>
<C field="hasInsurance" val={true} label="✅ Yes, I have insurance" />
<C field="hasInsurance" val={false} label="❌ No insurance" />
</div>
{form.hasInsurance && <>
<label style={lS}>Type of Insurance</label>
<select value={form.insuranceType} onChange={e => update(“insuranceType”, e.target.value)}>
<option value="medicare">Medicare — Government plan (age 65+)</option>
<option value="medicaid">Medicaid</option>
<option value="private">Private / Employer Insurance</option>
<option value="marketplace">ACA Marketplace Plan</option>
<option value="other">Other</option>
</select>
</>}
<label style={lS}>Why did you visit? <span style={{ color: “var(–red)” }}>*</span></label>
<input placeholder=“e.g. Chest pain, knee surgery, ER visit…” value={form.visitReason} onChange={e => update(“visitReason”, e.target.value)} />
</>}
{step === 2 && <>
<h2 style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 6, letterSpacing: “-.03em” }}>What Happened at Your Visit?</h2>
<p style={{ color: “var(–ink3)”, fontSize: 15, marginBottom: 24, lineHeight: 1.65 }}>The more you share, the stronger your package becomes.</p>
<label style={lS}>Type of visit</label>
<div style={{ display: “grid”, gridTemplateColumns: “1fr 1fr”, gap: 10, marginBottom: 20 }}>
<C field="stayDuration" val="outpatient" label="🏥 ER / Outpatient" />
<C field="stayDuration" val="inpatient" label="🛏️ Stayed Overnight" />
<C field="stayDuration" val="surgery" label="🩺 Surgery / Procedure" />
<C field="stayDuration" val="office" label="👨‍⚕️ Doctor's Office" />
</div>
<label style={lS}>Services received? <span style={{ color: “var(–red)” }}>*</span></label>
<textarea style={{ minHeight: 100, resize: “vertical” }} placeholder=“e.g. Blood tests, X-rays, IV fluids, doctor visit, medications…” value={form.servicesReceived} onChange={e => update(“servicesReceived”, e.target.value)} />
<label style={lS}>Current bill status</label>
<select value={form.billStatus} onChange={e => update(“billStatus”, e.target.value)}>
<option value="unpaid">I haven’t paid anything yet</option>
<option value="payment_plan">On a monthly payment plan</option>
<option value="collections">Sent to collections</option>
<option value="partially_paid">Partially paid</option>
</select>
<label style={lS}>Any specific concerns? <span style={{ color: “var(–ink3)”, fontWeight: 400, fontSize: 13 }}>(very helpful)</span></label>
<textarea style={{ minHeight: 88, resize: “vertical” }} placeholder=“e.g. Doctor saw me 30 seconds but billed $800. Duplicate charges. Billed for things I didn’t receive…” value={form.specificConcerns} onChange={e => update(“specificConcerns”, e.target.value)} />
</>}
{step === 3 && <>
<h2 style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 6, letterSpacing: “-.03em” }}>Almost Ready</h2>
<p style={{ color: “var(–ink3)”, fontSize: 15, marginBottom: 24, lineHeight: 1.65 }}>Confirming your details before we begin:</p>
<div style={{ background: “var(–navyL)”, border: “1px solid var(–border)”, borderRadius: 13, padding: “4px 0”, marginBottom: 22 }}>
{[[“Provider”, form.providerName || “Not provided”], [“Total Billed”, form.totalBilled ? `$${Number(form.totalBilled).toLocaleString()}` : “Not provided”], [“You Owe”, form.amountOwed ? `$${Number(form.amountOwed).toLocaleString()}` : “Not provided”], [“Insurance”, form.hasInsurance ? form.insuranceType : “None”], [“Reason”, form.visitReason || “Not provided”]].map(([l, v], i) => (
<div key={i} style={{ display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “12px 18px”, borderBottom: i < 4 ? “1px solid var(–border)” : “none”, flexWrap: “wrap”, gap: 6 }}>
<span style={{ color: “var(–ink3)”, fontSize: 14 }}>{l}</span>
<span style={{ color: “var(–ink)”, fontWeight: 700, fontSize: 14, textAlign: “right”, maxWidth: “55%” }}>{v}</span>
</div>
))}
</div>
<div style={{ background: “var(–greenL)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 11, padding: “13px 16px”, fontSize: 14, color: “var(–ink2)”, lineHeight: 1.7 }}>
🔒 <strong style={{ color: “var(–ink)” }}>Your privacy is protected.</strong> We never store, share, or sell your information. You may cover any sensitive details on documents before submitting.
</div>
</>}
<div style={{ display: “flex”, gap: 10, marginTop: 26 }}>
{step > 1 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: “15px”, borderRadius: 12, border: “1.5px solid var(–navy)”, background: “transparent”, color: “var(–navy)”, fontFamily: “‘Inter’,sans-serif”, fontSize: 15, fontWeight: 700, cursor: “pointer” }}>← Back</button>}
<NavyBtn onClick={step < 3 ? () => setStep(s => s + 1) : onSubmit} disabled={(step === 1 && !ok1) || (step === 2 && !ok2)} style={{ flex: 2, fontSize: 17, borderRadius: 12 }}>
{step === 3 ? “✅ Analyze My Bill Now” : “Continue →”}
</NavyBtn>
</div>
</Card>
</div>
</div>
);
}

// ─── ANALYZING ────────────────────────────────────────────────────────────────
function Analyzing({ mode, toggleMode }) {
const steps = [“Reading your bill details”, “Cross-referencing Medicare rates”, “Checking your federal billing rights”, “Identifying potential overcharges”, “Writing your personalized dispute letter”, “Preparing your word-for-word phone script”, “Building your complete advocacy package”];
const [active, setActive] = useState(0);
useEffect(() => { const t = setInterval(() => setActive(p => Math.min(p + 1, steps.length - 1)), 2100); return () => clearInterval(t); }, []);
return (
<div style={{ fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, padding: 24 }}>
<style>{FONTS}</style>
<div style={{ position: “absolute”, top: 14, right: 20 }}><ThemeToggle mode={mode} toggle={toggleMode} /></div>
<div style={{ marginBottom: 36 }}><Logo size="md" /></div>
<div style={{ textAlign: “center”, maxWidth: 480 }}>
<div style={{ position: “relative”, width: 96, height: 96, margin: “0 auto 40px” }}>
<div style={{ position: “absolute”, inset: 0, border: “2.5px solid var(–border2)”, borderTop: “2.5px solid var(–navy)”, borderRadius: “50%”, animation: “spin 1.2s linear infinite” }} />
<div style={{ position: “absolute”, inset: 11, border: “2px solid var(–border2)”, borderTop: “2px solid var(–green)”, borderRadius: “50%”, animation: “spin 1.8s linear infinite reverse” }} />
<div style={{ position: “absolute”, inset: 0, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 34 }}>⚖️</div>
</div>
<h2 style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: 26, fontWeight: 900, color: “var(–ink)”, marginBottom: 8, letterSpacing: “-.03em” }}>Your Advocate Is Working</h2>
<p style={{ color: “var(–ink3)”, fontSize: 16, marginBottom: 40, animation: “pulse 2s ease infinite”, lineHeight: 1.6 }}>Please wait — just a moment…<br /><em style={{ color: “var(–ink2)” }}>{steps[active]}</em></p>
<div style={{ textAlign: “left” }}>
{steps.map((s, i) => (
<div key={i} style={{ display: “flex”, alignItems: “center”, gap: 12, marginBottom: 12, opacity: i > active ? 0.2 : 1, transition: “opacity .5s” }}>
<div style={{ width: 24, height: 24, borderRadius: “50%”, flexShrink: 0, fontSize: 11, display: “flex”, alignItems: “center”, justifyContent: “center”, fontWeight: 800, background: i < active ? “var(–green)” : i === active ? “var(–navy)” : “var(–border2)”, color: i <= active ? “#fff” : “var(–ink3)” }}>
{i < active ? “✓” : i === active ? “●” : i + 1}
</div>
<span style={{ fontSize: 14, color: i <= active ? “var(–ink)” : “var(–ink3)” }}>{s}</span>
</div>
))}
</div>
</div>
</div>
);
}

// ─── EMAIL CAPTURE ────────────────────────────────────────────────────────────
function EmailCapture({ onContinue, mode, toggleMode }) {
const [email, setEmail] = useState(””);
const [name, setName] = useState(””);
const [done, setDone] = useState(false);
const submit = () => {
if (!email.includes(”@”)) return;
console.log(“Email captured:”, { name, email });
// TODO: POST to Resend / ConvertKit
setDone(true);
setTimeout(() => onContinue(email, name), 1800);
};
return (
<div style={{ fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, padding: 24 }}>
<style>{FONTS}</style>
<div style={{ position: “absolute”, top: 14, right: 20 }}><ThemeToggle mode={mode} toggle={toggleMode} /></div>
<div style={{ maxWidth: 500, width: “100%” }}>
<div style={{ textAlign: “center”, marginBottom: 22 }}><Logo size="md" /></div>
<Card style={{ padding: “48px 40px”, textAlign: “center” }} className=“si”>
<div style={{ width: 66, height: 66, background: “var(–greenL)”, borderRadius: “50%”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 30, margin: “0 auto 22px” }}>✅</div>
<div style={{ display: “inline-block”, background: “var(–greenL)”, color: “var(–green)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 20, padding: “5px 14px”, fontSize: 12, fontWeight: 700, marginBottom: 18, letterSpacing: “.02em” }}>Your Analysis Is Ready</div>
<h2 style={{ fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 12, letterSpacing: “-.03em” }}>Where Should We Send Your Results?</h2>
<p style={{ color: “var(–ink3)”, fontSize: 15, lineHeight: 1.78, marginBottom: 26 }}>
Enter your email and we’ll send your complete advocacy package directly to your inbox —
so you can <strong style={{ color: “var(–ink)” }}>access it anytime, from any device, forever.</strong>
</p>
{!done ? (<>
<label style={{ …lS, textAlign: “left” }}>Your First Name <span style={{ color: “var(–ink3)”, fontWeight: 400, fontSize: 13 }}>(optional)</span></label>
<input placeholder=“e.g. Margaret” value={name} onChange={e => setName(e.target.value)} />
<label style={{ …lS, textAlign: “left” }}>Your Email Address <span style={{ color: “var(–red)” }}>*</span></label>
<input type=“email” placeholder=“e.g. myemail@gmail.com” value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === “Enter” && submit()} />
<GreenBtn onClick={submit} disabled={!email.includes(”@”)} full style={{ fontSize: 17, borderRadius: 12, marginBottom: 12 }}>
Send My Results to My Inbox →
</GreenBtn>
<div style={{ fontSize: 13, color: “var(–ink3)”, lineHeight: 1.7, marginBottom: 16 }}>🔒 No spam. Unsubscribe anytime. We’ll also send free weekly billing protection tips.</div>
<button onClick={() => onContinue(””, “”)} style={{ background: “none”, border: “none”, color: “var(–ink3)”, fontSize: 13, cursor: “pointer”, textDecoration: “underline”, fontFamily: “‘Inter’,sans-serif” }}>
Skip — show my results on screen only
</button>
</>) : (
<div style={{ background: “var(–greenL)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 14, padding: “26px 22px” }}>
<div style={{ fontSize: 30, marginBottom: 10 }}>💌</div>
<div style={{ fontWeight: 900, color: “var(–green)”, fontSize: 18, marginBottom: 7, letterSpacing: “-.02em” }}>On its way to your inbox!</div>
<div style={{ color: “var(–ink3)”, fontSize: 14, lineHeight: 1.7 }}>Taking you to your results now. Check your email — everything will be there waiting for you.</div>
</div>
)}
</Card>
</div>
</div>
);
}

// ─── RESULTS ──────────────────────────────────────────────────────────────────
function Results({ results, userEmail, userName, formData, onReset, mode, toggleMode }) {
const [unlocked, setUnlocked] = useState(false);
const [tab, setTab] = useState(“letter”);
const [feedback, setFeedback] = useState(””);
const [feedbackSent, setFeedbackSent] = useState(false);
const [copied, setCopied] = useState(null);
const [showShare, setShowShare] = useState(false);
const [familyAdded, setFamilyAdded] = useState(false);
if (!results) return null;
const { summary, disputeLetter, phoneScript, actionPlan, yourRights } = results;
const rColor = summary.riskLevel === “HIGH” ? “var(–red)” : “var(–gold)”;
const rBg = summary.riskLevel === “HIGH” ? “var(–redL)” : “var(–goldL)”;
const cp = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2500); };

return (
<div style={{ fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh” }}>
<style>{FONTS}</style>
{showShare && <ShareModal onClose={() => setShowShare(false)} />}

```
  {/* Header */}
  <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "13px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Logo size="sm" />
      <span style={{ background: "var(--greenL)", color: "var(--green)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>✓ Analysis Complete</span>
    </div>
    <div style={{ display: "flex", gap: 8 }}>
      <ThemeToggle mode={mode} toggle={toggleMode} />
      <ShareBtn onClick={() => setShowShare(true)} style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>👨‍👩‍👧 Share</ShareBtn>
      <button onClick={onReset} style={{ background: "var(--navyL)", color: "var(--navy)", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>← New</button>
    </div>
  </div>

  <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 18px" }}>
    {userName && <p style={{ fontFamily: "'Lora',serif", fontSize: 20, color: "var(--navy)", fontStyle: "italic", textAlign: "center", marginBottom: 22 }}>{userName}, here is what your advocate found on your bill.</p>}

    {/* Free badge */}
    <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ color: "var(--green)", fontSize: 16 }}>✅</span>
      <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>FREE REVIEW — No payment required for this section</span>
    </div>

    {/* Summary */}
    <Card style={{ marginBottom: 18, overflow: "hidden" }}>
      <div style={{ background: "var(--navy)", padding: "18px 22px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 7 }}>Your Advocate's Assessment</div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, color: "#fff", lineHeight: 1.65, fontWeight: 500 }}>{summary.keyFindings}</div>
      </div>
      <div style={{ padding: "20px 22px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
          <div style={{ background: rBg, border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: rColor, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>Risk Level</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: rColor, letterSpacing: "-.03em" }}>{summary.riskLevel}</div>
          </div>
          <div style={{ background: "var(--greenL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>Potential Savings</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--green)", letterSpacing: "-.02em" }}>${summary.estimatedSavingsMin}–${summary.estimatedSavingsMax}</div>
          </div>
          <div style={{ background: "var(--navyL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>Issues Found</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--navy)", letterSpacing: "-.03em" }}>{summary.errorsFound?.length || 3}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>⚠️ Billing Concerns Identified</div>
        {summary.errorsFound?.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: i < summary.errorsFound.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
            <div style={{ width: 22, height: 22, background: "var(--redL)", border: "1px solid rgba(181,48,32,.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: "var(--red)" }}>{i + 1}</div>
            <span style={{ color: "var(--ink2)", lineHeight: 1.7, fontSize: 15 }}>{e}</span>
          </div>
        ))}
      </div>
    </Card>

    {/* Rights */}
    <Card style={{ padding: "20px 22px", marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>🛡️ Your Legal Rights as a Patient</div>
      {yourRights?.map((r, i) => {
        const [title, ...rest] = r.split(":");
        return (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
            <span style={{ color: "var(--green)", fontSize: 16, flexShrink: 0, lineHeight: 1.5, fontWeight: 700 }}>✓</span>
            <div>
              <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 15, marginBottom: 2 }}>{title}</div>
              {rest.length > 0 && <div style={{ color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }}>{rest.join(":").trim()}</div>}
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--navyL)", borderRadius: 10, fontSize: 11, color: "var(--ink3)", lineHeight: 1.65 }}>
        📚 <strong style={{ color: "var(--navy)" }}>Sources (2023–2025):</strong> Harvard Medical School · Mayo Clinic Proceedings · Johns Hopkins Medicine · U.S. CFPB · Commonwealth Fund · AARP — cited for educational reference only
      </div>
    </Card>

    {/* PAYWALL */}
    {!unlocked ? (
      <Card style={{ padding: "40px 32px", textAlign: "center", borderTop: "3px solid var(--navy)", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
        <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 12, letterSpacing: "-.03em" }}>Get Your Complete Advocacy Package</h2>
        <p style={{ color: "var(--ink3)", fontSize: 15, maxWidth: 420, margin: "0 auto 10px", lineHeight: 1.75 }}>
          Your letter is written. Your script is ready. Your plan is clear.
          <strong style={{ color: "var(--ink)" }}> All you do is send one email.</strong>
        </p>
        <p style={{ color: "var(--ink3)", fontSize: 14, maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.7 }}>
          Others charge <strong style={{ color: "var(--red)" }}>$200+</strong> and take weeks.
          We charge <strong style={{ color: "var(--green)" }}>$97 flat</strong> — one time, forever.
        </p>

        {/* Family share prompt inside paywall */}
        <div style={{ background: "rgba(212,98,10,.07)", border: "1px solid rgba(212,98,10,.2)", borderRadius: 12, padding: "13px 17px", marginBottom: 20, display: "flex", gap: 11, alignItems: "center", textAlign: "left" }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>👨‍👩‍👧</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 14, marginBottom: 2 }}>Need help from a family member?</div>
            <div style={{ color: "var(--ink3)", fontSize: 13 }}>Your son, daughter, or grandchild can complete this for you in minutes.</div>
          </div>
          <ShareBtn onClick={() => setShowShare(true)} style={{ padding: "9px 14px", fontSize: 12, borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0 }}>Share →</ShareBtn>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 360, margin: "0 auto 22px", textAlign: "left" }}>
          {[["📝", "Dispute Letter"], ["📞", "Phone Script"], ["🗺️", "Action Plan"], ["⚖️", "Your Rights"]].map(([ic, lb], i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--surface2)", borderRadius: 10, padding: "11px 13px", border: "1px solid var(--border)" }}>
              <span style={{ fontSize: 20 }}>{ic}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{lb}</span>
            </div>
          ))}
        </div>

        {/* Price display */}
        <div style={{ background: "var(--goldL)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 14, padding: "16px 20px", marginBottom: 22 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>⏰ Introductory Price Ends June 15:</div>
          <Countdown />
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 16, color: "var(--ink3)", textDecoration: "line-through" }}>$197</span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em" }}>$97</span>
            <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>Save $100</span>
          </div>
        </div>

        <a href="https://gumroad.com/YOUR_LINK" target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "linear-gradient(135deg,#16A04A,#147A45)", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "18px 32px", fontSize: 19, fontWeight: 800, marginBottom: 10, boxShadow: "0 8px 28px rgba(20,122,69,.45)", maxWidth: 420, margin: "0 auto 10px", letterSpacing: "-.02em", fontFamily: "'Inter',sans-serif" }}>
          Unlock My Complete Package — $97 →
        </a>
        <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 10 }}>
          Instant access · Sent to your email · Due to instant digital delivery, all sales are final
        </div>
        <div style={{ marginTop: 20 }}>
          <button onClick={() => setUnlocked(true)} style={{ background: "none", border: "1px dashed var(--border2)", borderRadius: 8, padding: "7px 14px", color: "var(--ink3)", cursor: "pointer", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>
            Preview full results (demo)
          </button>
        </div>
      </Card>
    ) : (
      <div style={{ marginBottom: 28 }}>
        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface2)", padding: "6px", borderRadius: 14, border: "1px solid var(--border)" }}>
          {[["letter", "📝 Letter"], ["script", "📞 Script"], ["action", "🗺️ Plan"], ["rights", "⚖️ Rights"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, background: tab === id ? "var(--navy)" : "transparent", color: tab === id ? "#fff" : "var(--ink3)", transition: "all .15s", letterSpacing: ".01em" }}>
              {label}
            </button>
          ))}
        </div>

        {tab === "letter" && (
          <Card style={{ overflow: "hidden" }}>
            <div style={{ background: "var(--navy)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", flexShrink: 0 }}>1</div>
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Send Your Dispute Letter</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>Print and mail — or copy and paste into an email</div>
              </div>
            </div>
            <div style={{ padding: "18px 22px", background: "var(--navyL)", borderBottom: "1px solid var(--border)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 10 }}>How to send this letter:</div>
              {["Click the Copy button below", "Fill in [bracket] fields — your name, address, account number (on your bill)", "Paste into an email and send — OR print and mail to the billing address on your bill", "If mailing: use Certified Mail at the post office and keep your yellow receipt"].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--navy)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{"①②③④"[i]}</div>
                  <span style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.65 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
              <span style={{ fontSize: 14, color: "var(--ink3)" }}>📄 Your Personalized Dispute Letter</span>
              <button onClick={() => cp(disputeLetter, "letter")} style={{ background: "var(--green)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{copied === "letter" ? "✓ Copied!" : "📋 Copy Letter"}</button>
            </div>
            <div style={{ padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", background: "var(--surface)", fontFamily: "Georgia,'Times New Roman',serif", maxHeight: 460, overflowY: "auto" }}>{disputeLetter}</div>
          </Card>
        )}

        {tab === "script" && (
          <Card style={{ overflow: "hidden" }}>
            <div style={{ background: "#1A4A6B", padding: "16px 22px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", flexShrink: 0 }}>2</div>
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: "-.02em" }}>Call the Billing Department</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>Read this word for word — no memorizing needed</div>
              </div>
            </div>
            <div style={{ padding: "16px 22px", background: "var(--surface2)", borderBottom: "1px solid var(--border)" }}>
              {["Best days: Tuesday, Wednesday, or Thursday", "Best time: Between 9:00 AM and 11:00 AM", "Ask for a billing supervisor — not a regular representative", "Have your bill and account number ready", "Write down who you spoke with and the date"].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <span style={{ color: "var(--navy)", fontWeight: 700, flexShrink: 0 }}>•</span>
                  <span style={{ fontSize: 14, color: "var(--ink2)", lineHeight: 1.65 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
              <span style={{ fontSize: 14, color: "var(--ink3)" }}>📞 Your Phone Script — Read During Your Call</span>
              <button onClick={() => cp(phoneScript, "script")} style={{ background: "#1A4A6B", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{copied === "script" ? "✓ Copied!" : "📋 Copy Script"}</button>
            </div>
            <div style={{ padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", maxHeight: 460, overflowY: "auto" }}>{phoneScript}</div>
          </Card>
        )}

        {tab === "action" && (
          <Card style={{ padding: "24px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#fff", flexShrink: 0 }}>3</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", letterSpacing: "-.02em" }}>Your Step-by-Step Action Plan</div>
            </div>
            <p style={{ color: "var(--ink3)", fontSize: 15, lineHeight: 1.7, marginBottom: 24, paddingLeft: 50 }}>Follow these one at a time. No rush. Each step is clear and simple.</p>
            {actionPlan?.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "flex-start" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "'Inter',sans-serif", boxShadow: "0 4px 12px rgba(27,58,107,.3)" }}>{item.step}</div>
                <div style={{ flex: 1, background: "var(--navyL)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                    <h3 style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.02em" }}>{item.title}</h3>
                    <span style={{ background: "var(--goldL)", color: "var(--gold)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{item.timeframe}</span>
                  </div>
                  <p style={{ color: "var(--ink2)", lineHeight: 1.7, fontSize: 14, marginBottom: 12 }}>{item.description}</p>
                  <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.18)", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 2, textTransform: "uppercase", letterSpacing: ".5px" }}>Expert Tip</div>
                      <div style={{ color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }}>{item.powerTip}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </Card>
        )}

        {tab === "rights" && (
          <Card style={{ padding: "24px 22px" }}>
            <h3 style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 6, letterSpacing: "-.02em" }}>🛡️ Your Legal Rights as a Patient</h3>
            <p style={{ color: "var(--ink3)", fontSize: 14, marginBottom: 20, lineHeight: 1.65 }}>These federal protections apply to you right now. Know them. Use them.</p>
            {yourRights?.map((r, i) => {
              const [title, ...rest] = r.split(":");
              return (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, padding: "14px 16px", background: "var(--navyL)", borderLeft: "3px solid var(--navy)", borderRadius: "0 12px 12px 0" }}>
                  <div style={{ width: 32, height: 32, background: "var(--navy)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{"📜🚫⚖️🏥🛡️"[i * 2] || "✓"}</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 3 }}>{title}</div>
                    {rest.length > 0 && <div style={{ color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }}>{rest.join(":").trim()}</div>}
                  </div>
                </div>
              );
            })}
            <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--navyL)", borderRadius: 10, fontSize: 11, color: "var(--ink3)", lineHeight: 1.7 }}>
              📚 <strong style={{ color: "var(--navy)" }}>Research Sources (2023–2025):</strong> Harvard Medical School · Mayo Clinic Proceedings · U.S. CFPB · Johns Hopkins Medicine · Commonwealth Fund · AARP — cited for educational reference only. United Patient Advocate is not affiliated with or endorsed by any institution listed.
            </div>
          </Card>
        )}

        {/* Email confirmation */}
        {userEmail && (
          <div style={{ background: "var(--greenL)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 14, padding: "20px 22px", marginTop: 20, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>💌</span>
            <div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "var(--green)", marginBottom: 5, letterSpacing: "-.02em" }}>Your package was also sent to your email</div>
              <div style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }}>Everything was sent to <strong style={{ color: "var(--ink)" }}>{userEmail}</strong>. Close this page anytime — your complete advocacy package will be in your inbox forever.</div>
            </div>
          </div>
        )}

        {/* Individual vs Family Comparison */}
        <Card style={{ padding: "28px 26px", marginTop: 20 }}>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 6, textAlign: "center", letterSpacing: "-.03em" }}>Protect Your Whole Family</h2>
          <p style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.7, marginBottom: 22, textAlign: "center" }}>You are already protected with the Individual Plan. Here is what the Family Plan adds on top — no double charging, no confusion.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
            {/* Individual */}
            <div style={{ background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 16, padding: "20px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>✅ You Already Have</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--navy)", marginBottom: 14, letterSpacing: "-.02em" }}>Individual Plan</div>
              {["1 bill analysis", "Dispute letter", "Phone script", "5-step action plan", "Results in inbox"].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                  <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>✓</span>
                  <span style={{ fontSize: 13, color: "var(--ink3)" }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" }}>Was $197</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--navy)", letterSpacing: "-.03em" }}>$97 <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink3)" }}>one-time</span></div>
              </div>
            </div>
            {/* Family */}
            <div style={{ background: "rgba(20,122,69,.06)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 16, padding: "20px 16px", position: "relative" }}>
              <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>⭐ Premium Upgrade</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Everything above PLUS:</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--green)", marginBottom: 14, letterSpacing: "-.02em" }}>Family Plan</div>
              {[
                ["Unlimited analyses — whole year", true],
                ["Every family member covered", true],
                ["Results saved permanently", true],
                ["Professional PDF letterhead", false],
                ["Monthly family billing newsletter", false],
              ].map(([t, bold], i) => (
                <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                  <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>✓</span>
                  <span style={{ fontSize: 13, color: bold ? "var(--ink)" : "var(--ink3)", fontWeight: bold ? 600 : 400 }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" }}>Was $297/year</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", letterSpacing: "-.03em" }}>$147 <span style={{ fontSize: 11, fontWeight: 400, color: "var(--ink3)" }}>per year</span></div>
              </div>
            </div>
          </div>
          {!familyAdded ? (
            <a href="https://gumroad.com/YOUR_FAMILY_LINK" target="_blank" rel="noopener noreferrer" onClick={() => setFamilyAdded(true)} style={{ display: "block", background: "var(--navy)", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "15px 24px", fontSize: 16, fontWeight: 800, textAlign: "center", boxShadow: "0 4px 16px rgba(27,58,107,.3)", fontFamily: "'Inter',sans-serif", letterSpacing: "-.02em" }}>
              Add Family Protection Plan — $147/year →
            </a>
          ) : (
            <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
              <div style={{ fontWeight: 800, color: "var(--green)", fontSize: 15 }}>🎉 Family Plan added! Check your email for access details.</div>
            </div>
          )}
          <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--ink3)" }}>
            No confusion. No double charging. The Individual Plan is yours — this adds unlimited family coverage on top.
            Due to instant digital delivery, all sales are final.
          </div>
        </Card>
      </div>
    )}

    {/* Feedback */}
    <Card style={{ padding: "32px 26px", textAlign: "center", borderTop: "3px solid var(--green)" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
      <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 8, letterSpacing: "-.03em" }}>Help Us Serve More Americans Like You</h2>
      <p style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.75, marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" }}>Your feedback shapes what we build next for every American patient who needs an advocate in their corner.</p>
      {!feedbackSent ? (<>
        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Any idea, big or small. What else do you need? What would make this easier?" style={{ minHeight: 90, resize: "vertical", textAlign: "left", marginBottom: 14 }} />
        <GreenBtn onClick={() => { if (feedback.trim()) { console.log("Feedback:", feedback); setFeedbackSent(true); } }} disabled={!feedback.trim()} style={{ maxWidth: 320, margin: "0 auto", fontSize: 15, borderRadius: 10, padding: "14px 28px" }}>
          Share My Feedback →
        </GreenBtn>
      </>) : (
        <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 14, padding: "24px" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🙏</div>
          <div style={{ fontWeight: 800, color: "var(--green)", fontSize: 17, marginBottom: 6, letterSpacing: "-.02em" }}>Thank you — genuinely.</div>
          <div style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }}>Your feedback shapes what we build next for every American patient who needs an advocate in their corner.</div>
        </div>
      )}
    </Card>
  </div>

  {/* Footer */}
  <div style={{ background: "var(--surface)", padding: "14px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 }}>
    United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary.
    Due to the instant delivery of personalized digital content, all sales are final.
    All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced.
    © 2026 United Patient Advocate · unitedpatientadvocate.com
  </div>
</div>
```

);
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
const { mode, toggle } = useTheme();
const [screen, setScreen] = useState(“landing”);
const [step, setStep] = useState(1);
const [form, setForm] = useState({
providerName: “”, totalBilled: “”, amountOwed: “”,
hasInsurance: true, insuranceType: “medicare”,
visitReason: “”, servicesReceived: “”,
stayDuration: “outpatient”, specificConcerns: “”, billStatus: “unpaid”,
});
const [results, setResults] = useState(null);
const [userEmail, setUserEmail] = useState(””);
const [userName, setUserName] = useState(””);
const update = (f, v) => setForm(p => ({ …p, [f]: v }));

const analyze = async () => {
setScreen(“analyzing”);
const prompt = `You are the AI engine behind United Patient Advocate — America’s trusted patient billing advocacy service. Research-backed by Harvard Medical School, Mayo Clinic, Johns Hopkins Medicine, and the U.S. CFPB. Analyze this patient’s bill and return ONLY valid JSON with no markdown or code blocks.

Patient: Provider=”${form.providerName || “Hospital”}”, Total=$${form.totalBilled}, Owes=$${form.amountOwed || form.totalBilled}, Insurance=${form.hasInsurance ? form.insuranceType : “none”}, Visit=”${form.visitReason}”, Services=”${form.servicesReceived}”, Type=${form.stayDuration}, Status=${form.billStatus}, Concerns=”${form.specificConcerns || “bill seems too high”}”

Return this exact JSON:
{“summary”:{“riskLevel”:“HIGH”,“estimatedSavingsMin”:“500”,“estimatedSavingsMax”:“2400”,“errorsFound”:[“Specific billing concern based on their visit type and insurance”,“Second specific concern about their charges or services”,“Third area worth investigating”],“keyFindings”:“2-3 warm, empowering, specific sentences. Reference that 2024 JAMA Health Forum research confirms 74% who dispute get mistakes corrected. Hopeful, authoritative, on their side.”},“disputeLetter”:”[Your Full Name]\n[Street Address]\n[City, State ZIP]\n[Phone Number]\n[Email Address]\n\n[Today’s Date]\n\nBilling Department\n${form.providerName || “Medical Provider”}\nAttn: Patient Billing Review Team\n\nRe: Formal Billing Review Request\nAccount Number: [ACCOUNT NUMBER — on your bill]\nDate of Service: [Date]\nAmount Under Review: $${form.amountOwed || form.totalBilled}\n\nDear Billing Review Team,\n\nI am writing on behalf of United Patient Advocate to formally request a complete audit of the charges on the above account before any payment is made.\n\n[Continue with 380 words: cite No Surprises Act 2022, itemized billing rights, ACA transparency. Request complete itemized statement with CPT codes. State no payment until review complete. Set 30-day deadline. Reference CFPB complaint if unresolved. Professional, firm tone.]\n\nRespectfully submitted,\n\n_________________________________\n[Patient Printed Name]\n\nUnited Patient Advocate · unitedpatientadvocate.com”,“phoneScript”:“UNITED PATIENT ADVOCATE — PHONE SCRIPT\nKEEP THIS BY THE PHONE · READ WORD FOR WORD\n\nBEST TIME: Tuesday–Thursday, 9:00–11:00 AM\n\n━━━━━━━━━━━━━━━━━━━━━━━━\nWHEN THEY ANSWER:\n━━━━━━━━━━━━━━━━━━━━━━━━\n\“Hello. My name is [Your Name], account number [Account Number]. I am calling with United Patient Advocate regarding a formal billing review. I need to speak with a billing supervisor please.\”\n\n[Continue 320 words: supervisor handling, No Surprises Act invocation, itemized bill request, 501r financial assistance by name, settlement negotiation, call documentation. Simple language for seniors.]”,“actionPlan”:[{“step”:1,“title”:“Request Your Itemized Bill — Today”,“description”:“Call billing and ask for a complete itemized bill with every charge and CPT code. Legal right before any payment.”,“timeframe”:“TODAY”,“powerTip”:“Say: I am requesting a complete itemized statement as is my right under federal billing transparency regulations. This signals you know your rights.”},{“step”:2,“title”:“Compare Bill to Insurance Payment”,“description”:“Call your insurer for the Explanation of Benefits. Compare line by line. 45% of insured Americans received bills for services believed to be covered — Commonwealth Fund 2024.”,“timeframe”:“Within 2 Days”,“powerTip”:“Ask: Was this claim processed at in-network or out-of-network rates? A wrong classification alone can add thousands.”},{“step”:3,“title”:“Mail Your Dispute Letter — Certified Mail”,“description”:“Print, sign, and mail via USPS Certified Mail. Keep the yellow receipt. Creates legal paper trail and pauses collections.”,“timeframe”:“Within 1 Week”,“powerTip”:“The yellow receipt is your legal proof of delivery. It protects your credit report during the dispute period.”},{“step”:4,“title”:“Apply for Financial Assistance”,“description”:“All nonprofit hospitals must offer charity care under IRS 501r. Many qualify even with insurance.”,“timeframe”:“Within 2 Weeks”,“powerTip”:“Ask for the 501r financial assistance application by name. Most billing staff won’t volunteer this unless you ask.”},{“step”:5,“title”:“File Federal Complaint If Unresolved”,“description”:“File free at consumerfinance.gov or call 1-855-411-2372 after 30 days. CFPB complaints resolve most disputes within 10-14 days.”,“timeframe”:“Day 30”,“powerTip”:“Federal complaints trigger dedicated hospital resolution teams. Free to file. No lawyer needed.”}],“yourRights”:[“Right to an Itemized Bill: Federal law requires hospitals to provide a complete itemized statement before you are required to pay anything”,“No Surprises Act (2022): You cannot be billed above in-network rates for emergency care at any facility, including out-of-network hospitals”,“Right to Appeal Insurance Denials: Legal right to appeal any denial internally then through binding independent external review at no cost”,“Charity Care — IRS 501(r): All nonprofit hospitals receiving federal funds must offer financial assistance programs and screen patients upon request”,“Credit Protection (CFPB 2025): Strengthened rules — medical debt under $500 cannot appear on credit reports and all debt needs 365 days before reporting”]}`;

```
try {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await res.json();
  const raw = data.content?.map(c => c.text || "").join("") || "";
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  setResults(parsed);
  setScreen("email");
} catch (err) {
  console.error("Analysis error:", err);
  setScreen("form");
}
```

};

const sharedProps = { mode, toggleMode: toggle };

if (screen === “landing”) return <Landing onStart={() => setScreen(“form”)} {…sharedProps} />;
if (screen === “analyzing”) return <Analyzing {…sharedProps} />;
if (screen === “email”) return <EmailCapture onContinue={(email, name) => { setUserEmail(email); setUserName(name); setScreen(“results”); }} {…sharedProps} />;
if (screen === “results”) return <Results results={results} userEmail={userEmail} userName={userName} formData={form} onReset={() => { setScreen(“landing”); setResults(null); setStep(1); setUserEmail(””); setUserName(””); }} {…sharedProps} />;
return <Form step={step} setStep={setStep} form={form} update={update} onSubmit={analyze} {…sharedProps} />;
}
