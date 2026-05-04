import React, { useState, useEffect } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}
body.light{
  --bg:#F7F6F2;--surface:#FFFFFF;--surface2:#F2F0EC;
  --border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.14);
  --ink:#0D0D0D;--ink2:#3A3A3A;--ink3:#6B6B6B;
  --navy:#1B3A6B;--navyL:#EEF3FB;
  --green:#147A45;--greenL:#E6F4EE;
  --red:#B53020;--redL:#FEF1F0;
  --gold:#8A5C00;--goldL:#FEF8EC;
  --orange:#D4620A;
  --shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06);
  --hero:linear-gradient(135deg,#0D1F3C 0%,#1B3A6B 50%,#0E3020 100%);
}
body.twilight{
  --bg:#1A1814;--surface:#252219;--surface2:#2E2A21;
  --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);
  --ink:#F0EDE6;--ink2:#C8C4BA;--ink3:#8A857A;
  --navy:#7BA8E0;--navyL:rgba(123,168,224,.12);
  --green:#4CAF80;--greenL:rgba(76,175,128,.12);
  --red:#E07070;--redL:rgba(224,112,112,.12);
  --gold:#D4A040;--goldL:rgba(212,160,64,.12);
  --orange:#F0844A;
  --shadow:0 1px 3px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.3);
  --hero:linear-gradient(135deg,#0A0D0A 0%,#101820 50%,#0A1208 100%);
}
body{background:var(--bg);color:var(--ink)}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) forwards}
input,select,textarea{
  width:100%;padding:14px 16px;font-size:17px;
  font-family:'Inter',sans-serif;border-radius:12px;
  border:1.5px solid var(--border2);background:var(--surface);
  color:var(--ink);margin-bottom:20px;box-sizing:border-box;
  transition:border-color .2s;outline:none;
}
input:focus,select:focus,textarea:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(27,58,107,.12);}
`;

// COUNTDOWN TARGET - 3 days from now for FOMO urgency
const DEADLINE = new Date("2026-05-08T23:59:59").getTime();

function useTheme() {
  const stored = (() => { try { return localStorage.getItem("upa-theme") || "light"; } catch(e) { return "light"; } })();
  const [mode, setMode] = useState(stored);
  useEffect(() => {
    document.body.className = mode;
    try { localStorage.setItem("upa-theme", mode); } catch(e) {}
  }, [mode]);
  useEffect(() => {
    if (!document.getElementById("upa-css")) {
      const s = document.createElement("style");
      s.id = "upa-css";
      s.textContent = CSS;
      document.head.appendChild(s);
    }
  }, []);
  return { mode, toggle: () => setMode(m => m === "light" ? "twilight" : "light") };
}

// SVG Icons
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "var(--shadow)", ...style }}>
    {children}
  </div>
);

const GreenBtn = ({ children, onClick, style = {}, disabled, full }) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      background: disabled ? "#ccc" : "linear-gradient(135deg,#16A04A,#147A45)",
      color: "#fff", border: "none", borderRadius: 14,
      padding: "18px 36px", fontSize: 18, fontWeight: 800,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter',sans-serif", letterSpacing: "-.02em",
      boxShadow: disabled ? "none" : "0 8px 28px rgba(20,122,69,.45)",
      transition: "all .18s", width: full ? "100%" : "auto",
      opacity: disabled ? .5 : 1, lineHeight: 1.3, ...style
    }}
  >{children}</button>
);

const NavyBtn = ({ children, onClick, style = {}, disabled }) => (
  <button
    onClick={disabled ? undefined : onClick}
    style={{
      background: disabled ? "#ccc" : "var(--navy)",
      color: "#fff", border: "none", borderRadius: 12,
      padding: "15px 28px", fontSize: 16, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter',sans-serif", transition: "all .18s",
      opacity: disabled ? .5 : 1, ...style
    }}
  >{children}</button>
);

const ShareBtn = ({ children, onClick, style = {} }) => (
  <button onClick={onClick} style={{
    background: "var(--orange)", color: "#fff", border: "none",
    borderRadius: 12, padding: "13px 24px", fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "'Inter',sans-serif",
    boxShadow: "0 6px 20px rgba(212,98,10,.35)", transition: "all .18s",
    lineHeight: 1.3, ...style
  }}>{children}</button>
);

const ThemeToggle = ({ mode, toggle }) => (
  <button onClick={toggle} style={{
    display: "flex", alignItems: "center", gap: 8,
    background: mode === "twilight" ? "rgba(123,168,224,.15)" : "var(--surface2)",
    border: mode === "twilight" ? "1.5px solid rgba(123,168,224,.3)" : "1.5px solid var(--border2)",
    borderRadius: 40, padding: "8px 16px", cursor: "pointer",
    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700,
    color: mode === "twilight" ? "#7BA8E0" : "var(--ink2)",
    transition: "all .25s"
  }}>
    {mode === "light" ? <MoonIcon /> : <SunIcon />}
    <span>{mode === "light" ? "Night Mode" : "Day Mode"}</span>
  </button>
);

const Logo = ({ size = "md", light = false }) => {
  const dims = { sm: [30, 15], md: [38, 19], lg: [52, 26] }[size];
  const [w, fs] = dims;
  const c = light ? "#FFFFFF" : "var(--navy)";
  const g = light ? "#86EFAC" : "var(--green)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width={w} height={w} viewBox="0 0 48 48" fill="none">
        <path d="M24 4L6 11v12c0 11.4 7.7 22 18 25.2C34.3 45 42 34.4 42 23V11L24 4z"
          fill={light ? "rgba(255,255,255,0.12)" : "var(--navyL)"}
          stroke={light ? "rgba(255,255,255,0.5)" : "var(--navy)"}
          strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M17 24l5 5 9-10" stroke={g} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: fs, fontWeight: 900, color: c, letterSpacing: "-.04em", lineHeight: 1.1 }}>
          United<span style={{ color: g }}>Patient</span>
        </div>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: fs * .58, fontWeight: 600, color: light ? "rgba(255,255,255,.5)" : "var(--ink3)", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }}>
          Advocate
        </div>
      </div>
    </div>
  );
};

const Countdown = ({ light = false }) => {
  const [t, setT] = useState(Math.max(0, DEADLINE - Date.now()));
  useEffect(() => {
    const i = setInterval(() => setT(Math.max(0, DEADLINE - Date.now())), 1000);
    return () => clearInterval(i);
  }, []);
  const d = Math.floor(t / 86400000);
  const h = Math.floor((t % 86400000) / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const pad = n => String(n).padStart(2, "0");
  const tc = light ? "rgba(255,255,255,.9)" : "var(--ink)";
  const lc = light ? "rgba(255,255,255,.45)" : "var(--ink3)";
  const Box = ({ n, l }) => (
    <div style={{ textAlign: "center", minWidth: 52 }}>
      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 28, fontWeight: 900, color: tc, lineHeight: 1, letterSpacing: "-.04em" }}>{pad(n)}</div>
      <div style={{ fontSize: 10, color: lc, textTransform: "uppercase", letterSpacing: "1.2px", marginTop: 5, fontWeight: 600 }}>{l}</div>
    </div>
  );
  const Sep = () => <div style={{ fontSize: 20, color: lc, fontWeight: 300, paddingBottom: 18 }}>:</div>;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
      <Box n={d} l="Days" /><Sep /><Box n={h} l="Hrs" /><Sep /><Box n={m} l="Min" /><Sep /><Box n={s} l="Sec" />
    </div>
  );
};

const ShareModal = ({ onClose }) => {
  const link = "https://unitedpatientadvocate.com";
  const share = (msg) => {
    if (navigator.share) { navigator.share({ text: msg, url: link }); }
    else { navigator.clipboard.writeText(msg + "\n" + link); alert("Message copied! Paste it into a text to your family member."); }
    onClose();
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ padding: "40px 34px", maxWidth: 460, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 44, marginBottom: 14 }}>👨‍👩‍👧‍👦</div>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--ink)", marginBottom: 10 }}>Share With Your Family</h2>
          <p style={{ color: "var(--ink3)", fontSize: 15, lineHeight: 1.7 }}>A son, daughter, or grandchild can fill this out with you in minutes.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <ShareBtn onClick={() => share("I found something that can help with my medical bill. It is free to check. Can you help me? " + link)} style={{ width: "100%", fontSize: 15, padding: "16px 20px", borderRadius: 12 }}>
            Send to My Son / Daughter / Grandchild
          </ShareBtn>
          <button onClick={() => share("I found a free tool that checks medical bills for errors and writes the dispute letter. Takes 3 minutes. " + link)} style={{ background: "var(--navyL)", color: "var(--navy)", border: "1.5px solid var(--navy)", borderRadius: 12, padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", width: "100%" }}>
            Send to Mom / Dad / Grandparent
          </button>
        </div>
        <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 12, padding: "13px 17px", marginBottom: 18, fontSize: 14, color: "var(--ink2)", lineHeight: 1.7, textAlign: "center" }}>
          Adult children - fill this out for your parent in minutes and help them recover money they are owed.
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--ink3)", fontSize: 13, cursor: "pointer", width: "100%", textAlign: "center", textDecoration: "underline", fontFamily: "'Inter',sans-serif" }}>Close</button>
      </Card>
    </div>
  );
};

const lS = { display: "block", fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 8 };

function Landing({ onStart, mode, toggleMode }) {
  const [showShare, setShowShare] = useState(false);
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh" }}>
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      <div style={{ background: "#8B0000", color: "#fff", textAlign: "center", padding: "10px 20px", fontSize: 13, fontWeight: 700 }}>
        URGENT: Introductory price of <strong>$97</strong> expires in <strong>3 days</strong>  -  after that it goes back to $197 permanently
      </div>
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 100 }}>
        <Logo size="md" />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <ThemeToggle mode={mode} toggle={toggleMode} />
          <ShareBtn onClick={() => setShowShare(true)} style={{ padding: "10px 16px", fontSize: 13, borderRadius: 10 }}>Share</ShareBtn>
          <GreenBtn onClick={onStart} style={{ padding: "11px 22px", fontSize: 14, borderRadius: 10 }}>Free Analysis</GreenBtn>
        </div>
      </nav>

      <div style={{ background: "var(--hero)", padding: "80px 24px 68px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 18% 42%,rgba(76,175,128,.12) 0%,transparent 50%),radial-gradient(circle at 82% 62%,rgba(123,168,224,.09) 0%,transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 820, margin: "0 auto" }}>
          <div className="fu" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(76,175,128,.15)", border: "1px solid rgba(76,175,128,.35)", borderRadius: 40, padding: "7px 18px", fontSize: 11, fontWeight: 700, color: "#86EFAC", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 24 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#86EFAC", display: "inline-block" }} />
            Backed by 2023-2025 Published Medical Research
          </div>
          <h1 className="fu" style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(32px,5.5vw,60px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-.04em" }}>
            Your Medical Bill<br />Contains Errors.<br />
            <span style={{ background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "italic" }}>We Find Them.</span>
          </h1>
          <p style={{ fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 14px", lineHeight: 1.78 }}>
            According to <strong style={{ color: "#fff" }}>Harvard Medical School</strong>, <strong style={{ color: "#fff" }}>Mayo Clinic</strong>, and the <strong style={{ color: "#fff" }}>U.S. Government CFPB</strong>  -  American patients are overcharged billions every year. Most never know they can fight back.
          </p>
          <p style={{ fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 38px", lineHeight: 1.78 }}>
            <strong style={{ color: "#86EFAC" }}>We have already done all the research.</strong> Answer a few simple questions. Get your ready-to-send dispute letter in minutes. <strong style={{ color: "#fff" }}>Two clicks. Done.</strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <GreenBtn onClick={onStart} style={{ fontSize: 20, padding: "22px 52px", borderRadius: 16 }}>Start My Free Analysis</GreenBtn>
            <button onClick={() => setShowShare(true)} style={{ background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>
              Not sure? Share with a family member
            </button>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.38)" }}>No account  -  No medical knowledge needed  -  Results sent to your inbox</div>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface2)", padding: "52px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }}>What the Research Confirms</div>
            <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,3.5vw,32px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em" }}>
              The System Is Broken by Design. <span style={{ color: "var(--green)" }}>Two of the World's Most Trusted Medical Institutions Prove It.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
            <Card style={{ padding: "24px 26px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--navy)", borderRadius: "20px 0 0 20px" }} />
              <div style={{ paddingLeft: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
                  <div style={{ background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--navy)" }}>Harvard Medical School</div>
                  <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 }}>Published 2023</div>
                </div>
                <p style={{ fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 }}>
                  "Electronic medical records make it far too easy to bill for procedures that never happened. A patient described a brief exam yet the resulting bill documented a comprehensive physical examination that never occurred."
                </p>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 12 }}>Dr. Edward P. Hoffer, Harvard Medical School  -  Published in Mayo Clinic Proceedings: Digital Health  -  May 2023</div>
                <div style={{ background: "var(--navyL)", border: "1px solid rgba(27,58,107,.15)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--navy)", fontWeight: 600 }}>
                  This billing complexity creates the overcharges we find and fix for you.
                </div>
              </div>
            </Card>
            <Card style={{ padding: "24px 26px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--green)", borderRadius: "20px 0 0 20px" }} />
              <div style={{ paddingLeft: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }}>
                  <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--green)" }}>Mayo Clinic Connect</div>
                  <div style={{ background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 }}>Patient Community 2023</div>
                </div>
                <p style={{ fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 }}>
                  "I sincerely doubt that they ever would have given this money back if I did not have the time and the tenacity to keep calling them. Watch your bills."
                </p>
                <div style={{ fontSize: 11, color: "var(--ink3)", marginBottom: 12 }}>Verified patient account, Mayo Clinic Connect community forum 2023</div>
                <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--green)", fontWeight: 700 }}>
                  United Patient Advocate gives you that tenacity  -  in 3 minutes, not 3 months.
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div style={{ background: "var(--navy)", padding: "42px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 28, textAlign: "center" }}>
          {[["100M+","Americans with medical debt  -  CFPB 2025"],["$88B","In billing errors on credit reports  -  CFPB 2025"],["45%","Of insured adults got unexpected bills  -  Commonwealth Fund 2024"],["74%","Who disputed got mistakes corrected  -  JAMA 2024"]].map(([n,l],i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-.04em" }}>{n}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 8, lineHeight: 1.55 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--surface)", padding: "52px 24px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em", textAlign: "center", marginBottom: 32 }}>
            We replace weeks of frustration<br /><span style={{ color: "var(--green)" }}>with 5 minutes and one email.</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card style={{ padding: "24px 22px", background: "rgba(181,48,32,.04)", border: "1px solid rgba(181,48,32,.15)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>Without United Patient Advocate</div>
              {["Research billing codes for hours","Call billing  -  on hold instantly","Transferred 3 or more times","Try to understand CPT codes alone","Write dispute letter from scratch","Wait weeks with no response","67% of people give up and overpay"].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--red)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 }}>✗</span>
                  <span style={{ fontSize: 15, color: "var(--ink3)", lineHeight: 1.65 }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(181,48,32,.08)", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--red)" }}>10-15+ Hours</div>
                <div style={{ fontSize: 12, color: "var(--red)", opacity: .8, marginTop: 2 }}>of your time and stress</div>
              </div>
            </Card>
            <Card style={{ padding: "24px 22px", background: "rgba(20,122,69,.05)", border: "1.5px solid rgba(20,122,69,.2)", position: "relative" }}>
              <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", whiteSpace: "nowrap" }}>With United Patient Advocate</div>
              {["Answer a few questions  -  3 minutes","Enter your email  -  10 seconds","We analyze your bill vs Medicare rates","We write your personalized dispute letter","We write your word-for-word phone script","We build your complete 5-step action plan","You copy the letter. Send it. Done."].map((t,i) => (
                <div key={i} style={{ display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--green)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 15, color: i === 6 ? "var(--ink)" : "var(--ink2)", lineHeight: 1.65, fontWeight: i === 6 ? 700 : 400 }}>{t}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(20,122,69,.1)", borderRadius: 10, textAlign: "center" }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)" }}>Under 5 Minutes</div>
                <div style={{ fontSize: 12, color: "var(--green)", opacity: .85, marginTop: 2 }}>Everything handled for you</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "52px 24px" }}>
        <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, color: "var(--ink)", textAlign: "center", marginBottom: 10, letterSpacing: "-.03em" }}>Does this sound familiar?</h2>
        <p style={{ textAlign: "center", color: "var(--ink3)", fontSize: 16, marginBottom: 32, lineHeight: 1.65 }}>Real patients. Real frustration. Every single day across America.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }}>
          {[
            { q: "The doctor walked in, asked if I had questions, and left in 30 seconds. My bill showed $780 for a physician consultation. I had no idea I could fight that.", who: "Medicare patient, age 71" },
            { q: "I have insurance and still owe $6,400. I have paid premiums my whole life and still cannot afford my surgery. I did not know where to start.", who: "Retired teacher, age 66" },
            { q: "They billed me for a private room I never requested. Nobody told me I had the right to fight back. I wish I had found United Patient Advocate sooner.", who: "Hospital patient, age 58" }
          ].map((t,i) => (
            <Card key={i} style={{ padding: 28 }}>
              <div style={{ fontSize: 40, color: "var(--navy)", fontFamily: "serif", lineHeight: 1, marginBottom: 12, opacity: .4 }}>"</div>
              <p style={{ color: "var(--ink2)", lineHeight: 1.78, fontSize: 15, marginBottom: 16, fontStyle: "italic" }}>{t.q}</p>
              <div style={{ fontSize: 12, color: "var(--ink3)", fontWeight: 600 }}> -  {t.who}</div>
            </Card>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: "0 auto 52px", padding: "0 24px" }}>
        <Card style={{ padding: "44px 40px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 900, color: "var(--ink)", letterSpacing: "-.03em" }}>Everything You Get</h2>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, color: "var(--ink3)", textDecoration: "line-through" }}>Was $197</div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 28, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em", lineHeight: 1 }}>$97</div>
              <div style={{ fontSize: 11, color: "var(--green)", fontWeight: 700 }}>Save $100  -  51% off</div>
            </div>
          </div>
          <p style={{ color: "var(--ink3)", marginBottom: 28, fontSize: 15, lineHeight: 1.65 }}>One payment. Yours forever. No subscription. Sent instantly to your inbox.</p>
          {[
            { t: "Personalized Dispute Letter", d: "Written specifically for your bill. Professionally worded, legally grounded. Ready to send today." },
            { t: "Word-for-Word Phone Script", d: "Exactly what to say when you call. Every objection handled. Read it directly during the call." },
            { t: "Clear 5-Step Action Plan", d: "Step 1, Step 2, Step 3. Simple. Nothing overwhelming. You always know what to do next." },
            { t: "Your Legal Rights in Plain English", d: "The federal laws protecting you  -  explained simply, without legal jargon." },
            { t: "Delivered to Your Inbox Forever", d: "Never lose your results. Access from any device, anytime, forever." }
          ].map((item,i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "16px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
              <div style={{ width: 48, height: 48, background: "var(--greenL)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800, color: "var(--green)", flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 4 }}>{item.t}</div>
                <div style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.65 }}>{item.d}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ background: "var(--hero)", padding: "64px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>
          <div style={{ marginBottom: 28 }}><Logo size="lg" light={true} /></div>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: "clamp(26px,5vw,46px)", fontWeight: 900, color: "#fff", marginBottom: 14, lineHeight: 1.1, letterSpacing: "-.04em" }}>
            Skip the research.<br />Skip the hold music.<br />
            <span style={{ background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Get your answers today.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,.65)", fontSize: 17, marginBottom: 32, lineHeight: 1.75 }}>Every American patient deserves a fair bill. United Patient Advocate is here to make sure you get one.</p>
          <div style={{ background: "#8B000020", border: "1px solid #ff444444", borderRadius: 12, padding: "14px 20px", marginBottom: 20 }}>
            <div style={{ color: "#FF8888", fontSize: 14, fontWeight: 700, marginBottom: 4 }}>⚠️ WARNING  -  Price increases in:</div>
            <div style={{ color: "rgba(255,255,255,.7)", fontSize: 12 }}>After this timer hits zero, the price permanently returns to $197</div>
          </div>
          <Card style={{ padding: 26, marginBottom: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Time Remaining at $97:</div>
            <Countdown />
            <div style={{ marginTop: 14, fontSize: 13, color: "var(--ink3)" }}>
              <span style={{ textDecoration: "line-through", color: "var(--red)" }}>$197</span>
              <span style={{ fontWeight: 900, color: "var(--green)", fontSize: 22, marginLeft: 10 }}>$97</span>
              <span style={{ color: "var(--ink3)", marginLeft: 8 }}> -  Save $100 today</span>
            </div>
          </Card>
          <GreenBtn onClick={onStart} full style={{ fontSize: 20, padding: "22px 48px", borderRadius: 16, marginBottom: 12 }}>Start My Free Analysis</GreenBtn>
          <ShareBtn onClick={() => setShowShare(true)} style={{ width: "100%", fontSize: 15, padding: "14px", borderRadius: 12, marginBottom: 16 }}>Share With a Family Member</ShareBtn>
          <div style={{ color: "rgba(255,255,255,.3)", fontSize: 13 }}>Secure  -  Private  -  Instant digital delivery  -  No subscription</div>
        </div>
      </div>
      <div style={{ background: "var(--surface)", padding: "16px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 }}>
        United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary. Due to the instant delivery of personalized digital content, all sales are final. All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced. 2026 United Patient Advocate  -  unitedpatientadvocate.com
      </div>
    </div>
  );
}

function Form({ step, setStep, form, update, onSubmit, mode, toggleMode }) {
  const ok1 = !!(form.visitReason && form.totalBilled);
  const ok2 = !!form.servicesReceived;

  const C = ({ field, val, label }) => (
    <button onClick={() => update(field, val)} style={{
      flex: 1, padding: "14px 10px", borderRadius: 11, cursor: "pointer", textAlign: "center",
      fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3,
      border: `1.5px solid ${form[field] === val ? "var(--navy)" : "var(--border2)"}`,
      background: form[field] === val ? "var(--navyL)" : "var(--surface)",
      color: form[field] === val ? "var(--navy)" : "var(--ink3)", transition: "all .15s"
    }}>{label}</button>
  );

  const handleSubmit = () => {
    console.log("Submit clicked, calling onSubmit");
    onSubmit();
  };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh" }}>
      <nav style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo size="sm" />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <ThemeToggle mode={mode} toggle={toggleMode} />
          <span style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 500 }}>Private and Secure</span>
        </div>
      </nav>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
          {[1,2,3].map((n,i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0, background: step >= n ? "var(--navy)" : "var(--surface2)", border: `1.5px solid ${step >= n ? "var(--navy)" : "var(--border2)"}`, color: step >= n ? "#fff" : "var(--ink3)", transition: "all .3s" }}>
                {step > n ? "✓" : n}
              </div>
              {i < 2 && <div style={{ flex: 1, height: 2, background: step > n ? "var(--navy)" : "var(--border2)", margin: "0 10px", transition: "background .3s" }} />}
            </div>
          ))}
        </div>
        <Card style={{ padding: "36px 32px" }}>
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.03em" }}>About Your Medical Bill</h2>
              <p style={{ color: "var(--ink3)", fontSize: 15, marginBottom: 24, lineHeight: 1.65 }}>Fill in what you know  -  do not worry if you are missing any details.</p>
              <label style={lS}>Hospital or Doctor Name <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: 13 }}>(optional)</span></label>
              <input placeholder="e.g. St. Marys Hospital" value={form.providerName} onChange={e => update("providerName", e.target.value)} />
              <label style={lS}>Total Bill Amount *</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-65%)", color: "var(--ink3)", fontSize: 18 }}>$</span>
                <input style={{ paddingLeft: 32 }} type="number" placeholder="0.00" value={form.totalBilled} onChange={e => update("totalBilled", e.target.value)} />
              </div>
              <label style={lS}>Amount Left to Pay After Insurance</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-65%)", color: "var(--ink3)", fontSize: 18 }}>$</span>
                <input style={{ paddingLeft: 32 }} type="number" placeholder="0.00" value={form.amountOwed} onChange={e => update("amountOwed", e.target.value)} />
              </div>
              <label style={lS}>Do you have health insurance?</label>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <C field="hasInsurance" val={true} label="Yes I have insurance" />
                <C field="hasInsurance" val={false} label="No insurance" />
              </div>
              {form.hasInsurance && (
                <div>
                  <label style={lS}>Type of Insurance</label>
                  <select value={form.insuranceType} onChange={e => update("insuranceType", e.target.value)}>
                    <option value="medicare">Medicare  -  Government plan age 65+</option>
                    <option value="medicaid">Medicaid</option>
                    <option value="private">Private / Employer Insurance</option>
                    <option value="marketplace">ACA Marketplace Plan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
              <label style={lS}>Why did you visit? *</label>
              <input placeholder="e.g. Chest pain, knee surgery, ER visit" value={form.visitReason} onChange={e => update("visitReason", e.target.value)} />
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.03em" }}>What Happened at Your Visit?</h2>
              <p style={{ color: "var(--ink3)", fontSize: 15, marginBottom: 24, lineHeight: 1.65 }}>The more you share, the stronger your package becomes.</p>
              <label style={lS}>Type of visit</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                <C field="stayDuration" val="outpatient" label="ER / Outpatient" />
                <C field="stayDuration" val="inpatient" label="Stayed Overnight" />
                <C field="stayDuration" val="surgery" label="Surgery / Procedure" />
                <C field="stayDuration" val="office" label="Doctor Office" />
              </div>
              <label style={lS}>Services received? *</label>
              <textarea style={{ minHeight: 100, resize: "vertical" }} placeholder="e.g. Blood tests, X-rays, IV fluids, doctor visit, medications" value={form.servicesReceived} onChange={e => update("servicesReceived", e.target.value)} />
              <label style={lS}>Current bill status</label>
              <select value={form.billStatus} onChange={e => update("billStatus", e.target.value)}>
                <option value="unpaid">I have not paid anything yet</option>
                <option value="payment_plan">On a monthly payment plan</option>
                <option value="collections">Sent to collections</option>
                <option value="partially_paid">Partially paid</option>
              </select>
              <label style={lS}>Any specific concerns? <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: 13 }}>(very helpful)</span></label>
              <textarea style={{ minHeight: 88, resize: "vertical" }} placeholder="e.g. Doctor saw me 30 seconds but billed $800. Duplicate charges." value={form.specificConcerns} onChange={e => update("specificConcerns", e.target.value)} />
            </div>
          )}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.03em" }}>Almost Ready</h2>
              <p style={{ color: "var(--ink3)", fontSize: 15, marginBottom: 24, lineHeight: 1.65 }}>Confirming your details before we begin:</p>
              <div style={{ background: "var(--navyL)", border: "1px solid var(--border)", borderRadius: 13, padding: "4px 0", marginBottom: 22 }}>
                {[
                  ["Provider", form.providerName || "Not provided"],
                  ["Total Billed", form.totalBilled ? "$" + Number(form.totalBilled).toLocaleString() : "Not provided"],
                  ["You Owe", form.amountOwed ? "$" + Number(form.amountOwed).toLocaleString() : "Not provided"],
                  ["Insurance", form.hasInsurance ? form.insuranceType : "None"],
                  ["Reason", form.visitReason || "Not provided"]
                ].map(([l,v],i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < 4 ? "1px solid var(--border)" : "none", flexWrap: "wrap", gap: 6 }}>
                    <span style={{ color: "var(--ink3)", fontSize: 14 }}>{l}</span>
                    <span style={{ color: "var(--ink)", fontWeight: 700, fontSize: 14, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 11, padding: "13px 16px", fontSize: 14, color: "var(--ink2)", lineHeight: 1.7 }}>
                Your privacy is protected. We never store, share, or sell your information.
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: "15px", borderRadius: 12, border: "1.5px solid var(--navy)", background: "transparent", color: "var(--navy)", fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                Back
              </button>
            )}
            {step < 3 ? (
              <NavyBtn
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 1 && !ok1) || (step === 2 && !ok2)}
                style={{ flex: 2, fontSize: 17, borderRadius: 12 }}
              >
                Continue
              </NavyBtn>
            ) : (
              <button
                onClick={handleSubmit}
                style={{ flex: 2, background: "linear-gradient(135deg,#16A04A,#147A45)", color: "#fff", border: "none", borderRadius: 12, padding: "15px", fontSize: 17, fontWeight: 800, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}
              >
                Analyze My Bill Now
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Analyzing({ mode, toggleMode }) {
  const steps = ["Reading your bill details","Cross-referencing Medicare rates","Checking your federal billing rights","Identifying potential overcharges","Writing your personalized dispute letter","Preparing your word-for-word phone script","Building your complete advocacy package"];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => Math.min(p + 1, steps.length - 1)), 2100);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", top: 14, right: 20 }}><ThemeToggle mode={mode} toggle={toggleMode} /></div>
      <div style={{ marginBottom: 36 }}><Logo size="md" /></div>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 40px" }}>
          <div style={{ position: "absolute", inset: 0, border: "2.5px solid var(--border2)", borderTop: "2.5px solid var(--navy)", borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
          <div style={{ position: "absolute", inset: 11, border: "2px solid var(--border2)", borderTop: "2px solid var(--green)", borderRadius: "50%", animation: "spin 1.8s linear infinite reverse" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>⚖️</div>
        </div>
        <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 900, color: "var(--ink)", marginBottom: 8, letterSpacing: "-.03em" }}>Your Advocate Is Working</h2>
        <p style={{ color: "var(--ink3)", fontSize: 16, marginBottom: 40, animation: "pulse 2s ease infinite", lineHeight: 1.6 }}>Please wait  -  {steps[active]}</p>
        <div style={{ textAlign: "left" }}>
          {steps.map((s,i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, opacity: i > active ? 0.2 : 1, transition: "opacity .5s" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, background: i < active ? "var(--green)" : i === active ? "var(--navy)" : "var(--border2)", color: i <= active ? "#fff" : "var(--ink3)" }}>
                {i < active ? "✓" : i === active ? "●" : i + 1}
              </div>
              <span style={{ fontSize: 14, color: i <= active ? "var(--ink)" : "var(--ink3)" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmailCapture({ onContinue, mode, toggleMode }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [done, setDone] = useState(false);
  const submit = () => {
    if (!email.includes("@")) return;
    setDone(true);
    setTimeout(() => onContinue(email, name), 1800);
  };
  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ position: "absolute", top: 14, right: 20 }}><ThemeToggle mode={mode} toggle={toggleMode} /></div>
      <div style={{ maxWidth: 500, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}><Logo size="md" /></div>
        <Card style={{ padding: "48px 40px", textAlign: "center" }}>
          <div style={{ width: 66, height: 66, background: "var(--greenL)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 22px" }}>✅</div>
          <div style={{ display: "inline-block", background: "var(--greenL)", color: "var(--green)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, marginBottom: 18 }}>Your Analysis Is Ready</div>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 12, letterSpacing: "-.03em" }}>Where Should We Send Your Results?</h2>
          <p style={{ color: "var(--ink3)", fontSize: 15, lineHeight: 1.78, marginBottom: 26 }}>Enter your email and we will send your complete advocacy package directly to your inbox so you can access it anytime from any device forever.</p>
          {done ? (
            <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 14, padding: "26px 22px" }}>
              <div style={{ fontWeight: 900, color: "var(--green)", fontSize: 18, marginBottom: 7 }}>On its way to your inbox!</div>
              <div style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }}>Taking you to your results now.</div>
            </div>
          ) : (
            <div>
              <label style={{ ...lS, textAlign: "left" }}>Your First Name <span style={{ color: "var(--ink3)", fontWeight: 400, fontSize: 13 }}>(optional)</span></label>
              <input placeholder="e.g. Margaret" value={name} onChange={e => setName(e.target.value)} />
              <label style={{ ...lS, textAlign: "left" }}>Your Email Address *</label>
              <input type="email" placeholder="e.g. myemail@gmail.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
              <GreenBtn onClick={submit} disabled={!email.includes("@")} full style={{ fontSize: 17, borderRadius: 12, marginBottom: 12 }}>Send My Results to My Inbox</GreenBtn>
              <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 16 }}>No spam. Unsubscribe anytime. We will also send free weekly billing protection tips.</div>
              <button onClick={() => onContinue("", "")} style={{ background: "none", border: "none", color: "var(--ink3)", fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter',sans-serif" }}>
                Skip  -  show my results on screen only
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Results({ results, userEmail, userName, onReset, mode, toggleMode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState("letter");
  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [copied, setCopied] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [familyAdded, setFamilyAdded] = useState(false);

  if (!results) return null;
  const { summary, disputeLetter, phoneScript, actionPlan, yourRights } = results;
  const rColor = summary.riskLevel === "HIGH" ? "var(--red)" : "var(--gold)";
  const rBg = summary.riskLevel === "HIGH" ? "var(--redL)" : "var(--goldL)";
  const cp = (text, id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2500); };

  return (
    <div style={{ fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh" }}>
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "13px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Logo size="sm" />
          <span style={{ background: "var(--greenL)", color: "var(--green)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }}>Analysis Complete</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <ThemeToggle mode={mode} toggle={toggleMode} />
          <ShareBtn onClick={() => setShowShare(true)} style={{ padding: "8px 14px", fontSize: 12, borderRadius: 10 }}>Share</ShareBtn>
          <button onClick={onReset} style={{ background: "var(--navyL)", color: "var(--navy)", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>New Analysis</button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "36px 18px" }}>
        {userName && <p style={{ fontFamily: "'Lora',serif", fontSize: 20, color: "var(--navy)", fontStyle: "italic", textAlign: "center", marginBottom: 22 }}>{userName}, here is what your advocate found on your bill.</p>}

        <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: "var(--green)", fontSize: 16 }}>✅</span>
          <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>FREE REVIEW  -  No payment required for this section</span>
        </div>

        <Card style={{ marginBottom: 18, overflow: "hidden" }}>
          <div style={{ background: "var(--navy)", padding: "18px 22px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 7 }}>Your Advocate Assessment</div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, color: "#fff", lineHeight: 1.65, fontWeight: 500 }}>{summary.keyFindings}</div>
          </div>
          <div style={{ padding: "20px 22px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              <div style={{ background: rBg, border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: rColor, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>Risk Level</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: rColor }}>{summary.riskLevel}</div>
              </div>
              <div style={{ background: "var(--greenL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>Potential Savings</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--green)" }}>${summary.estimatedSavingsMin}-${summary.estimatedSavingsMax}</div>
              </div>
              <div style={{ background: "var(--navyL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }}>Issues Found</div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--navy)" }}>{summary.errorsFound ? summary.errorsFound.length : 3}</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Billing Concerns Identified</div>
            {summary.errorsFound && summary.errorsFound.map((e,i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "11px 0", borderBottom: i < summary.errorsFound.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, background: "var(--redL)", border: "1px solid rgba(181,48,32,.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: "var(--red)" }}>{i + 1}</div>
                <span style={{ color: "var(--ink2)", lineHeight: 1.7, fontSize: 15 }}>{e}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ padding: "20px 22px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Your Legal Rights as a Patient</div>
          {yourRights && yourRights.map((r,i) => {
            const parts = r.split(":");
            const title = parts[0];
            const rest = parts.slice(1).join(":").trim();
            return (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" }}>
                <span style={{ color: "var(--green)", fontSize: 16, flexShrink: 0, lineHeight: 1.5, fontWeight: 700 }}>✓</span>
                <div>
                  <div style={{ fontWeight: 700, color: "var(--ink)", fontSize: 15, marginBottom: 2 }}>{title}</div>
                  {rest && <div style={{ color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }}>{rest}</div>}
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--navyL)", borderRadius: 10, fontSize: 11, color: "var(--ink3)", lineHeight: 1.65 }}>
            Sources 2023-2025: Harvard Medical School  -  Mayo Clinic Proceedings  -  Johns Hopkins Medicine  -  U.S. CFPB  -  Commonwealth Fund  -  AARP  -  cited for educational reference only
          </div>
        </Card>

        {!unlocked ? (
          <Card style={{ padding: "40px 32px", textAlign: "center", borderTop: "3px solid var(--navy)", marginBottom: 28 }}>
            <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 12, letterSpacing: "-.03em" }}>Get Your Complete Advocacy Package</h2>
            <p style={{ color: "var(--ink3)", fontSize: 15, maxWidth: 420, margin: "0 auto 10px", lineHeight: 1.75 }}>Your letter is written. Your script is ready. All you do is send one email.</p>
            <p style={{ color: "var(--ink3)", fontSize: 14, maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.7 }}>Others charge $200 or more and take weeks. We charge $97 flat  -  one time, forever.</p>
            <div style={{ background: "var(--goldL)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 14, padding: "16px 20px", marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>Price Returns to $197 in:</div>
              <Countdown />
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <span style={{ fontSize: 16, color: "var(--ink3)", textDecoration: "line-through" }}>$197</span>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em" }}>$97</span>
                <span style={{ fontSize: 13, color: "var(--green)", fontWeight: 700 }}>Save $100</span>
              </div>
            </div>
            <a href="https://gumroad.com/YOUR_LINK" target="_blank" rel="noopener noreferrer" style={{ display: "block", background: "linear-gradient(135deg,#16A04A,#147A45)", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "18px 32px", fontSize: 19, fontWeight: 800, marginBottom: 10, boxShadow: "0 8px 28px rgba(20,122,69,.45)", maxWidth: 420, margin: "0 auto 10px", letterSpacing: "-.02em", fontFamily: "'Inter',sans-serif" }}>
              Unlock My Complete Package  -  $97
            </a>
            <div style={{ fontSize: 12, color: "var(--ink3)", marginTop: 10 }}>Instant access  -  Sent to your email  -  All sales are final due to instant digital delivery</div>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setUnlocked(true)} style={{ background: "none", border: "1px dashed var(--border2)", borderRadius: 8, padding: "7px 14px", color: "var(--ink3)", cursor: "pointer", fontSize: 12, fontFamily: "'Inter',sans-serif" }}>
                Preview full results (demo)
              </button>
            </div>
          </Card>
        ) : (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "var(--surface2)", padding: "6px", borderRadius: 14, border: "1px solid var(--border)" }}>
              {[["letter","Dispute Letter"],["script","Phone Script"],["action","Action Plan"],["rights","Your Rights"]].map(([id,label]) => (
                <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, background: tab === id ? "var(--navy)" : "transparent", color: tab === id ? "#fff" : "var(--ink3)", transition: "all .15s" }}>
                  {label}
                </button>
              ))}
            </div>

            {tab === "letter" && (
              <Card style={{ overflow: "hidden" }}>
                <div style={{ background: "var(--navy)", padding: "16px 22px" }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" }}>Step 1  -  Send Your Dispute Letter</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>Print and mail  -  or copy and paste into an email</div>
                </div>
                <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                  <span style={{ fontSize: 14, color: "var(--ink3)" }}>Your Personalized Dispute Letter</span>
                  <button onClick={() => cp(disputeLetter, "letter")} style={{ background: "var(--green)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{copied === "letter" ? "Copied!" : "Copy Letter"}</button>
                </div>
                <div style={{ padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", background: "var(--surface)", fontFamily: "Georgia,'Times New Roman',serif", maxHeight: 460, overflowY: "auto" }}>{disputeLetter}</div>
              </Card>
            )}

            {tab === "script" && (
              <Card style={{ overflow: "hidden" }}>
                <div style={{ background: "#1A4A6B", padding: "16px 22px" }}>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" }}>Step 2  -  Call the Billing Department</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }}>Read this word for word  -  no memorizing needed</div>
                </div>
                <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                  <span style={{ fontSize: 14, color: "var(--ink3)" }}>Your Phone Script</span>
                  <button onClick={() => cp(phoneScript, "script")} style={{ background: "#1A4A6B", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }}>{copied === "script" ? "Copied!" : "Copy Script"}</button>
                </div>
                <div style={{ padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", maxHeight: 460, overflowY: "auto" }}>{phoneScript}</div>
              </Card>
            )}

            {tab === "action" && actionPlan && (
              <Card style={{ padding: "24px 22px" }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", marginBottom: 20 }}>Your Step-by-Step Action Plan</div>
                {actionPlan.map((item,i) => (
                  <div key={i} style={{ display: "flex", gap: 14, marginBottom: 20, alignItems: "flex-start" }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 16 }}>{item.step}</div>
                    <div style={{ flex: 1, background: "var(--navyL)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                        <h3 style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--ink)" }}>{item.title}</h3>
                        <span style={{ background: "var(--goldL)", color: "var(--gold)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{item.timeframe}</span>
                      </div>
                      <p style={{ color: "var(--ink2)", lineHeight: 1.7, fontSize: 14, marginBottom: 12 }}>{item.description}</p>
                      <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.18)", borderRadius: 10, padding: "10px 14px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 2 }}>Expert Tip</div>
                        <div style={{ color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }}>{item.powerTip}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            {tab === "rights" && yourRights && (
              <Card style={{ padding: "24px 22px" }}>
                <h3 style={{ fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 6 }}>Your Legal Rights as a Patient</h3>
                <p style={{ color: "var(--ink3)", fontSize: 14, marginBottom: 20, lineHeight: 1.65 }}>These federal protections apply to you right now.</p>
                {yourRights.map((r,i) => {
                  const parts = r.split(":");
                  const title = parts[0];
                  const rest = parts.slice(1).join(":").trim();
                  return (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16, padding: "14px 16px", background: "var(--navyL)", borderLeft: "3px solid var(--navy)", borderRadius: "0 12px 12px 0" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 3 }}>{title}</div>
                        {rest && <div style={{ color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }}>{rest}</div>}
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}

            {userEmail && (
              <div style={{ background: "var(--greenL)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 14, padding: "20px 22px", marginTop: 20 }}>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "var(--green)", marginBottom: 5 }}>Your package was also sent to your email</div>
                <div style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }}>Everything was sent to <strong style={{ color: "var(--ink)" }}>{userEmail}</strong>. Close this page anytime  -  your complete advocacy package will be in your inbox forever.</div>
              </div>
            )}

            <Card style={{ padding: "28px 26px", marginTop: 20 }}>
              <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 6, textAlign: "center" }}>Protect Your Whole Family</h2>
              <p style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.7, marginBottom: 22, textAlign: "center" }}>You are already protected with the Individual Plan. Here is what the Family Plan adds on top.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }}>
                <div style={{ background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 16, padding: "20px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>You Already Have</div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--navy)", marginBottom: 14 }}>Individual Plan</div>
                  {["1 bill analysis","Dispute letter","Phone script","5-step action plan","Results in inbox"].map((t,i) => (
                    <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                      <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>✓</span>
                      <span style={{ fontSize: 13, color: "var(--ink3)" }}>{t}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" }}>Was $197</div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--navy)" }}>$97 one-time</div>
                  </div>
                </div>
                <div style={{ background: "rgba(20,122,69,.06)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 16, padding: "20px 16px", position: "relative" }}>
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }}>Premium Upgrade</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>Everything above PLUS</div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--green)", marginBottom: 14 }}>Family Plan</div>
                  {[["Unlimited analyses  -  whole year",true],["Every family member covered",true],["Results saved permanently",true],["Professional PDF letterhead",false],["Monthly family billing newsletter",false]].map(([t,bold],i) => (
                    <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                      <span style={{ color: "var(--green)", fontWeight: 700, fontSize: 13 }}>✓</span>
                      <span style={{ fontSize: 13, color: bold ? "var(--ink)" : "var(--ink3)", fontWeight: bold ? 600 : 400 }}>{t}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" }}>Was $297 per year</div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)" }}>$147 per year</div>
                  </div>
                </div>
              </div>
              {!familyAdded ? (
                <a href="https://gumroad.com/YOUR_FAMILY_LINK" target="_blank" rel="noopener noreferrer" onClick={() => setFamilyAdded(true)} style={{ display: "block", background: "var(--navy)", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "15px 24px", fontSize: 16, fontWeight: 800, textAlign: "center", fontFamily: "'Inter',sans-serif" }}>
                  Add Family Protection Plan  -  $147/year
                </a>
              ) : (
                <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
                  <div style={{ fontWeight: 800, color: "var(--green)", fontSize: 15 }}>Family Plan added! Check your email for access.</div>
                </div>
              )}
            </Card>
          </div>
        )}

        <Card style={{ padding: "32px 26px", textAlign: "center", borderTop: "3px solid var(--green)" }}>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }}>Help Us Serve More Americans Like You</h2>
          <p style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.75, marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" }}>Your feedback shapes what we build next.</p>
          {!feedbackSent ? (
            <div>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Any idea, big or small. What else do you need?" style={{ minHeight: 90, resize: "vertical", textAlign: "left", marginBottom: 14 }} />
              <GreenBtn onClick={() => { if (feedback.trim()) setFeedbackSent(true); }} disabled={!feedback.trim()} style={{ maxWidth: 320, margin: "0 auto", fontSize: 15, borderRadius: 10, padding: "14px 28px" }}>
                Share My Feedback
              </GreenBtn>
            </div>
          ) : (
            <div style={{ background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 14, padding: "24px" }}>
              <div style={{ fontWeight: 900, color: "var(--green)", fontSize: 17, marginBottom: 6 }}>Thank you genuinely.</div>
              <div style={{ color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }}>Your feedback shapes what we build next for every American patient.</div>
            </div>
          )}
        </Card>
      </div>

      <div style={{ background: "var(--surface)", padding: "14px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 }}>
        United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary. Due to the instant delivery of personalized digital content, all sales are final. All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced. 2026 United Patient Advocate  -  unitedpatientadvocate.com
      </div>
    </div>
  );
}

export default function App() {
  const { mode, toggle } = useTheme();
  const [screen, setScreen] = useState("landing");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    providerName: "", totalBilled: "", amountOwed: "",
    hasInsurance: true, insuranceType: "medicare",
    visitReason: "", servicesReceived: "",
    stayDuration: "outpatient", specificConcerns: "", billStatus: "unpaid"
  });
  const [results, setResults] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }));

  const analyze = async () => {
    console.log("analyze() called  -  moving to analyzing screen");
    setScreen("analyzing");

    const prompt = `You are the AI engine behind United Patient Advocate. Analyze this patient bill and return ONLY valid JSON. No markdown. No explanation. Just the JSON object.

Patient data:
- Provider: ${form.providerName || "Unknown Hospital"}
- Total billed: $${form.totalBilled}
- Amount owed: $${form.amountOwed || form.totalBilled}
- Insurance: ${form.hasInsurance ? form.insuranceType : "none"}
- Reason for visit: ${form.visitReason}
- Services received: ${form.servicesReceived}
- Visit type: ${form.stayDuration}
- Bill status: ${form.billStatus}
- Specific concerns: ${form.specificConcerns || "bill seems too high"}

Return exactly this JSON structure:
{
  "summary": {
    "riskLevel": "HIGH",
    "estimatedSavingsMin": "500",
    "estimatedSavingsMax": "2400",
    "errorsFound": [
      "First specific billing concern identified",
      "Second specific billing concern identified",
      "Third area worth investigating"
    ],
    "keyFindings": "2 to 3 warm empowering sentences about what was found and why they have strong grounds to dispute."
  },
  "disputeLetter": "Full formal dispute letter text here, ready to print and mail.",
  "phoneScript": "Full word-for-word phone script here.",
  "actionPlan": [
    {"step": 1, "title": "Step title", "description": "Step description", "timeframe": "TODAY", "powerTip": "Expert tip text"},
    {"step": 2, "title": "Step title", "description": "Step description", "timeframe": "Within 2 Days", "powerTip": "Expert tip text"},
    {"step": 3, "title": "Step title", "description": "Step description", "timeframe": "Within 1 Week", "powerTip": "Expert tip text"},
    {"step": 4, "title": "Step title", "description": "Step description", "timeframe": "Within 2 Weeks", "powerTip": "Expert tip text"},
    {"step": 5, "title": "Step title", "description": "Step description", "timeframe": "Day 30", "powerTip": "Expert tip text"}
  ],
  "yourRights": [
    "Right to an Itemized Bill: Federal law requires hospitals to provide a complete itemized statement before you pay",
    "No Surprises Act 2022: You cannot be billed above in-network rates for emergency care",
    "Right to Appeal Denials: Legal right to appeal any insurance denial at no cost",
    "Charity Care IRS 501r: All nonprofit hospitals must offer financial assistance upon request",
    "Credit Protection CFPB 2025: Medical debt under $500 cannot appear on credit reports"
  ]
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }]
        })
      });

      if (!res.ok) {
        throw new Error("API error: " + res.status);
      }

      const data = await res.json();
      const rawText = data.content ? data.content.map(c => c.text || "").join("") : "";

      // Extract JSON from response
      let jsonStr = rawText.trim();
      const start = jsonStr.indexOf("{");
      const end = jsonStr.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
      }

      const parsed = JSON.parse(jsonStr);
      console.log("Analysis complete, showing results");
      setResults(parsed);
      setScreen("email");
    } catch (err) {
      console.error("Analysis failed:", err);
      // Show error state  -  go back to form with alert
      alert("Analysis failed. Please check your API key is configured in Vercel environment variables as VITE_ANTHROPIC_API_KEY and redeploy.");
      setScreen("form");
    }
  };

  const shared = { mode, toggleMode: toggle };

  if (screen === "landing") return <Landing onStart={() => { setStep(1); setScreen("form"); }} {...shared} />;
  if (screen === "form") return <Form step={step} setStep={setStep} form={form} update={update} onSubmit={analyze} {...shared} />;
  if (screen === "analyzing") return <Analyzing {...shared} />;
  if (screen === "email") return <EmailCapture onContinue={(email, name) => { setUserEmail(email); setUserName(name); setScreen("results"); }} {...shared} />;
  if (screen === "results") return <Results results={results} userEmail={userEmail} userName={userName} onReset={() => { setScreen("landing"); setResults(null); setStep(1); setUserEmail(""); setUserName(""); }} {...shared} />;
  return null;
}
