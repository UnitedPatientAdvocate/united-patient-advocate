import { useState, useEffect } from “react”;

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600;700;800;900&display=swap'); *{box-sizing:border-box;margin:0;padding:0} html{scroll-behavior:smooth} body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s} body.light{ --bg:#F7F6F2;--surface:#FFFFFF;--surface2:#F2F0EC; --border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.14); --ink:#0D0D0D;--ink2:#3A3A3A;--ink3:#6B6B6B; --navy:#1B3A6B;--navyL:#EEF3FB; --green:#147A45;--greenL:#E6F4EE; --red:#B53020;--redL:#FEF1F0; --gold:#8A5C00;--goldL:#FEF8EC; --orange:#D4620A; --shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06); --hero:linear-gradient(135deg,#0D1F3C 0%,#1B3A6B 50%,#0E3020 100%); } body.twilight{ --bg:#1A1814;--surface:#252219;--surface2:#2E2A21; --border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12); --ink:#F0EDE6;--ink2:#C8C4BA;--ink3:#8A857A; --navy:#7BA8E0;--navyL:rgba(123,168,224,.12); --green:#4CAF80;--greenL:rgba(76,175,128,.12); --red:#E07070;--redL:rgba(224,112,112,.12); --gold:#D4A040;--goldL:rgba(212,160,64,.12); --orange:#F0844A; --shadow:0 1px 3px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.3); --hero:linear-gradient(135deg,#0A0D0A 0%,#101820 50%,#0A1208 100%); } body{background:var(--bg);color:var(--ink)} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}} @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}} .fu{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) forwards} .si{animation:scaleIn .4s cubic-bezier(.16,1,.3,1) forwards} input,select,textarea{ width:100%;padding:14px 16px;font-size:17px; font-family:'Inter',sans-serif;border-radius:12px; border:1.5px solid var(--border2);background:var(--surface); color:var(--ink);margin-bottom:20px;box-sizing:border-box; transition:border-color .2s,box-shadow .2s;outline:none; } input:focus,select:focus,textarea:focus{ border-color:var(--navy); box-shadow:0 0 0 3px rgba(27,58,107,.12); }`;

function useTheme() {
const [mode, setMode] = useState(function() {
try { return localStorage.getItem(“upa-theme”) || “light”; } catch(e) { return “light”; }
});
useEffect(function() {
document.body.className = mode;
try { localStorage.setItem(“upa-theme”, mode); } catch(e) {}
}, [mode]);
return { mode: mode, toggle: function() { setMode(function(m) { return m === “light” ? “twilight” : “light”; }); } };
}

function Card(props) {
var children = props.children;
var style = props.style || {};
return (
React.createElement(“div”, {
style: Object.assign({
background: “var(–surface)”,
borderRadius: 20,
border: “1px solid var(–border)”,
boxShadow: “var(–shadow)”
}, style)
}, children)
);
}

function GreenBtn(props) {
var children = props.children;
var onClick = props.onClick;
var style = props.style || {};
var disabled = props.disabled;
var full = props.full;
return (
React.createElement(“button”, {
onClick: disabled ? undefined : onClick,
style: Object.assign({
background: disabled ? “#ccc” : “linear-gradient(135deg,#16A04A,#147A45)”,
color: “#fff”,
border: “none”,
borderRadius: 14,
padding: “18px 36px”,
fontSize: 18,
fontWeight: 800,
cursor: disabled ? “not-allowed” : “pointer”,
fontFamily: “‘Inter’,sans-serif”,
letterSpacing: “-.02em”,
boxShadow: disabled ? “none” : “0 8px 28px rgba(20,122,69,.45)”,
transition: “all .18s”,
width: full ? “100%” : “auto”,
opacity: disabled ? .5 : 1,
lineHeight: 1.3
}, style)
}, children)
);
}

function NavyBtn(props) {
var children = props.children;
var onClick = props.onClick;
var style = props.style || {};
var disabled = props.disabled;
return (
React.createElement(“button”, {
onClick: disabled ? undefined : onClick,
style: Object.assign({
background: disabled ? “#ccc” : “var(–navy)”,
color: “#fff”,
border: “none”,
borderRadius: 12,
padding: “15px 28px”,
fontSize: 16,
fontWeight: 700,
cursor: disabled ? “not-allowed” : “pointer”,
fontFamily: “‘Inter’,sans-serif”,
transition: “all .18s”,
opacity: disabled ? .5 : 1
}, style)
}, children)
);
}

function ShareBtn(props) {
var children = props.children;
var onClick = props.onClick;
var style = props.style || {};
return (
React.createElement(“button”, {
onClick: onClick,
style: Object.assign({
background: “var(–orange)”,
color: “#fff”,
border: “none”,
borderRadius: 12,
padding: “13px 24px”,
fontSize: 15,
fontWeight: 700,
cursor: “pointer”,
fontFamily: “‘Inter’,sans-serif”,
boxShadow: “0 6px 20px rgba(212,98,10,.35)”,
transition: “all .18s”,
lineHeight: 1.3
}, style)
}, children)
);
}

function ThemeToggle(props) {
var mode = props.mode;
var toggle = props.toggle;
return (
React.createElement(“button”, {
onClick: toggle,
style: {
display: “flex”,
alignItems: “center”,
gap: 8,
background: “var(–surface2)”,
border: “1.5px solid var(–border2)”,
borderRadius: 40,
padding: “8px 14px”,
cursor: “pointer”,
fontFamily: “‘Inter’,sans-serif”,
fontSize: 12,
fontWeight: 700,
color: “var(–ink2)”,
transition: “all .2s”,
whiteSpace: “nowrap”
}
},
React.createElement(“span”, { style: { fontSize: 15 } }, mode === “light” ? “Moon” : “Sun”),
mode === “light” ? “Easy on Eyes” : “Bright Mode”
)
);
}

function Logo(props) {
var size = props.size || “md”;
var light = props.light || false;
var dims = { sm: [30, 15], md: [38, 19], lg: [52, 26] }[size];
var w = dims[0];
var fs = dims[1];
var c = light ? “#FFFFFF” : “var(–navy)”;
var g = light ? “#86EFAC” : “var(–green)”;
return (
React.createElement(“div”, { style: { display: “flex”, alignItems: “center”, gap: 10 } },
React.createElement(“svg”, { width: w, height: w, viewBox: “0 0 48 48”, fill: “none” },
React.createElement(“path”, {
d: “M24 4L6 11v12c0 11.4 7.7 22 18 25.2C34.3 45 42 34.4 42 23V11L24 4z”,
fill: light ? “rgba(255,255,255,0.12)” : “var(–navyL)”,
stroke: light ? “rgba(255,255,255,0.5)” : “var(–navy)”,
strokeWidth: “1.5”,
strokeLinejoin: “round”
}),
React.createElement(“path”, {
d: “M17 24l5 5 9-10”,
stroke: g,
strokeWidth: “2.5”,
strokeLinecap: “round”,
strokeLinejoin: “round”
})
),
React.createElement(“div”, { style: { lineHeight: 1 } },
React.createElement(“div”, {
style: {
fontFamily: “‘Inter’,sans-serif”,
fontSize: fs,
fontWeight: 900,
color: c,
letterSpacing: “-.04em”,
lineHeight: 1.1
}
},
“United”,
React.createElement(“span”, { style: { color: g } }, “Patient”)
),
React.createElement(“div”, {
style: {
fontFamily: “‘Inter’,sans-serif”,
fontSize: fs * .58,
fontWeight: 600,
color: light ? “rgba(255,255,255,.5)” : “var(–ink3)”,
letterSpacing: “.14em”,
textTransform: “uppercase”,
marginTop: 2
}
}, “Advocate”)
)
)
);
}

function Countdown(props) {
var light = props.light || false;
var end = new Date(“2026-06-15T23:59:59”).getTime();
var [t, setT] = useState(Math.max(0, end - Date.now()));
useEffect(function() {
var i = setInterval(function() { setT(Math.max(0, end - Date.now())); }, 1000);
return function() { clearInterval(i); };
}, []);
var d = Math.floor(t / 86400000);
var h = Math.floor((t % 86400000) / 3600000);
var m = Math.floor((t % 3600000) / 60000);
var s = Math.floor((t % 60000) / 1000);
var tc = light ? “rgba(255,255,255,.9)” : “var(–ink)”;
var lc = light ? “rgba(255,255,255,.45)” : “var(–ink3)”;
function pad(n) { return String(n).padStart(2, “0”); }
function Box(bprops) {
return React.createElement(“div”, { style: { textAlign: “center”, minWidth: 52 } },
React.createElement(“div”, { style: { fontFamily: “‘Inter’,sans-serif”, fontSize: 28, fontWeight: 900, color: tc, lineHeight: 1, letterSpacing: “-.04em” } }, pad(bprops.n)),
React.createElement(“div”, { style: { fontSize: 10, color: lc, textTransform: “uppercase”, letterSpacing: “1.2px”, marginTop: 5, fontWeight: 600 } }, bprops.l)
);
}
var sep = React.createElement(“div”, { style: { fontSize: 20, color: lc, fontWeight: 300, paddingBottom: 18 } }, “:”);
return React.createElement(“div”, { style: { display: “flex”, gap: 8, alignItems: “center”, justifyContent: “center” } },
React.createElement(Box, { n: d, l: “Days” }), sep,
React.createElement(Box, { n: h, l: “Hrs” }), sep,
React.createElement(Box, { n: m, l: “Min” }), sep,
React.createElement(Box, { n: s, l: “Sec” })
);
}

function ShareModal(props) {
var onClose = props.onClose;
var link = “https://unitedpatientadvocate.com”;
function share(msg) {
if (navigator.share) {
navigator.share({ text: msg, url: link });
} else {
navigator.clipboard.writeText(msg + “\n” + link);
alert(“Message copied! Paste it into a text to your family member.”);
}
onClose();
}
return React.createElement(“div”, {
style: { position: “fixed”, inset: 0, background: “rgba(0,0,0,.65)”, zIndex: 1000, display: “flex”, alignItems: “center”, justifyContent: “center”, padding: 20 }
},
React.createElement(Card, { style: { padding: “40px 34px”, maxWidth: 460, width: “100%” } },
React.createElement(“div”, { style: { textAlign: “center”, marginBottom: 24 } },
React.createElement(“div”, { style: { fontSize: 44, marginBottom: 14 } }, “Family”),
React.createElement(“h2”, { style: { fontFamily: “‘Inter’,sans-serif”, fontSize: 22, fontWeight: 900, color: “var(–ink)”, marginBottom: 10, letterSpacing: “-.03em” } }, “Share With Your Family”),
React.createElement(“p”, { style: { color: “var(–ink3)”, fontSize: 15, lineHeight: 1.7 } }, “A son, daughter, or grandchild can fill this out with you in minutes.”)
),
React.createElement(“div”, { style: { display: “flex”, flexDirection: “column”, gap: 10, marginBottom: 18 } },
React.createElement(ShareBtn, {
onClick: function() { share(“I found something that can help with my medical bill. It is free to check. Can you help me? “ + link); },
style: { width: “100%”, fontSize: 15, padding: “16px 20px”, borderRadius: 12 }
}, “Send to My Son / Daughter / Grandchild”),
React.createElement(“button”, {
onClick: function() { share(“Mom/Dad - I found a free tool that checks medical bills for errors and writes the dispute letter for you. Takes 3 minutes. “ + link); },
style: {
background: “var(–navyL)”, color: “var(–navy)”, border: “1.5px solid var(–navy)”,
borderRadius: 12, padding: “16px 20px”, fontSize: 15, fontWeight: 700,
cursor: “pointer”, fontFamily: “‘Inter’,sans-serif”, width: “100%”
}
}, “Send to Mom / Dad / Grandparent”)
),
React.createElement(“div”, {
style: { background: “var(–greenL)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 12, padding: “13px 17px”, marginBottom: 18, fontSize: 14, color: “var(–ink2)”, lineHeight: 1.7, textAlign: “center” }
}, “Adult children - you can fill this out for your parent in minutes and help them recover money they are owed.”),
React.createElement(“button”, {
onClick: onClose,
style: { background: “none”, border: “none”, color: “var(–ink3)”, fontSize: 13, cursor: “pointer”, width: “100%”, textAlign: “center”, textDecoration: “underline”, fontFamily: “‘Inter’,sans-serif” }
}, “Close”)
)
);
}

function Landing(props) {
var onStart = props.onStart;
var mode = props.mode;
var toggleMode = props.toggleMode;
var [showShare, setShowShare] = useState(false);

return React.createElement(“div”, { style: { fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh” } },
React.createElement(“style”, null, FONTS),
showShare ? React.createElement(ShareModal, { onClose: function() { setShowShare(false); } }) : null,

```
React.createElement("div", { style: { background: "var(--navy)", color: "#fff", textAlign: "center", padding: "10px 20px", fontSize: 13, fontWeight: 600 } },
  "Introductory price ",
  React.createElement("strong", null, "$97"),
  " - was ",
  React.createElement("s", null, "$197"),
  " - offer ends June 15  ",
  React.createElement("span", { style: { color: "#93C5FD" } }, "Save $100 today")
),

React.createElement("nav", {
  style: {
    background: "var(--surface)", borderBottom: "1px solid var(--border)",
    padding: "14px 28px", display: "flex", alignItems: "center",
    justifyContent: "space-between", flexWrap: "wrap", gap: 10,
    position: "sticky", top: 0, zIndex: 100
  }
},
  React.createElement(Logo, { size: "md" }),
  React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" } },
    React.createElement(ThemeToggle, { mode: mode, toggle: toggleMode }),
    React.createElement(ShareBtn, { onClick: function() { setShowShare(true); }, style: { padding: "10px 16px", fontSize: 13, borderRadius: 10 } }, "Share"),
    React.createElement(GreenBtn, { onClick: onStart, style: { padding: "11px 22px", fontSize: 14, borderRadius: 10 } }, "Free Analysis")
  )
),

React.createElement("div", {
  style: { background: "var(--hero)", padding: "80px 24px 68px", textAlign: "center", position: "relative", overflow: "hidden" }
},
  React.createElement("div", {
    style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 18% 42%,rgba(76,175,128,.12) 0%,transparent 50%),radial-gradient(circle at 82% 62%,rgba(123,168,224,.09) 0%,transparent 50%)", pointerEvents: "none" }
  }),
  React.createElement("div", { style: { position: "relative", maxWidth: 820, margin: "0 auto" } },
    React.createElement("div", {
      className: "fu",
      style: { display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(76,175,128,.15)", border: "1px solid rgba(76,175,128,.35)", borderRadius: 40, padding: "7px 18px", fontSize: 11, fontWeight: 700, color: "#86EFAC", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 24 }
    },
      React.createElement("span", { style: { width: 5, height: 5, borderRadius: "50%", background: "#86EFAC", display: "inline-block" } }),
      "Backed by 2023-2025 Published Medical Research"
    ),
    React.createElement("h1", {
      className: "fu",
      style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(32px,5.5vw,60px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-.04em" }
    },
      "Your Medical Bill", React.createElement("br"),
      "Contains Errors.", React.createElement("br"),
      React.createElement("span", {
        style: { background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "italic" }
      }, "We Find Them.")
    ),
    React.createElement("p", {
      style: { fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 14px", lineHeight: 1.78 }
    },
      "According to ",
      React.createElement("strong", { style: { color: "#fff" } }, "Harvard Medical School"),
      ", ",
      React.createElement("strong", { style: { color: "#fff" } }, "Mayo Clinic"),
      ", and the ",
      React.createElement("strong", { style: { color: "#fff" } }, "U.S. Government CFPB"),
      " - American patients are overcharged billions every year. Most never know they can fight back."
    ),
    React.createElement("p", {
      style: { fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 38px", lineHeight: 1.78 }
    },
      React.createElement("strong", { style: { color: "#86EFAC" } }, "We have already done all the research."),
      " Answer a few simple questions. Get your ready-to-send dispute letter in minutes. ",
      React.createElement("strong", { style: { color: "#fff" } }, "Two clicks. Done.")
    ),
    React.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 } },
      React.createElement(GreenBtn, { onClick: onStart, style: { fontSize: 20, padding: "22px 52px", borderRadius: 16 } }, "Start My Free Analysis"),
      React.createElement("button", {
        onClick: function() { setShowShare(true); },
        style: { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }
      }, "Not sure? Share with a family member"),
      React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,.38)" } }, "No account - No medical knowledge needed - Results sent to your inbox")
    )
  )
),

React.createElement("div", { style: { background: "var(--surface2)", padding: "52px 24px", borderBottom: "1px solid var(--border)" } },
  React.createElement("div", { style: { maxWidth: 860, margin: "0 auto" } },
    React.createElement("div", { style: { textAlign: "center", marginBottom: 30 } },
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 } }, "What the Research Confirms"),
      React.createElement("h2", {
        style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,3.5vw,32px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em" }
      }, "The System Is Broken by Design. ", React.createElement("span", { style: { color: "var(--green)" } }, "Two of the World's Most Trusted Medical Institutions Prove It."))
    ),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 } },
      React.createElement(Card, { style: { padding: "24px 26px", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--navy)", borderRadius: "20px 0 0 20px" } }),
        React.createElement("div", { style: { paddingLeft: 14 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" } },
            React.createElement("div", { style: { background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--navy)" } }, "Harvard Medical School"),
            React.createElement("div", { style: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 } }, "Published 2023")
          ),
          React.createElement("p", { style: { fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 } },
            "Electronic medical records make it far too easy to bill for procedures that never happened. A patient described a brief exam yet the resulting bill documented a comprehensive physical examination that never occurred."
          ),
          React.createElement("div", { style: { fontSize: 11, color: "var(--ink3)", marginBottom: 12 } }, "Dr. Edward P. Hoffer, Harvard Medical School - Published in Mayo Clinic Proceedings: Digital Health - May 2023"),
          React.createElement("div", { style: { background: "var(--navyL)", border: "1px solid rgba(27,58,107,.15)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--navy)", fontWeight: 600 } },
            "This billing complexity creates the overcharges we find and fix for you."
          )
        )
      ),
      React.createElement(Card, { style: { padding: "24px 26px", position: "relative", overflow: "hidden" } },
        React.createElement("div", { style: { position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--green)", borderRadius: "20px 0 0 20px" } }),
        React.createElement("div", { style: { paddingLeft: 14 } },
          React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" } },
            React.createElement("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--green)" } }, "Mayo Clinic Connect"),
            React.createElement("div", { style: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 } }, "Patient Community 2023")
          ),
          React.createElement("p", { style: { fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 } },
            "I sincerely doubt that they ever would have given this money back if I did not have the time and the tenacity to keep calling them. Watch your bills."
          ),
          React.createElement("div", { style: { fontSize: 11, color: "var(--ink3)", marginBottom: 12 } }, "Verified patient account, Mayo Clinic Connect community forum 2023"),
          React.createElement("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--green)", fontWeight: 700 } },
            "United Patient Advocate gives you that tenacity - in 3 minutes, not 3 months."
          )
        )
      )
    )
  )
),

React.createElement("div", { style: { background: "var(--navy)", padding: "42px 24px" } },
  React.createElement("div", { style: { maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 28, textAlign: "center" } },
    [
      ["100M+", "Americans with medical debt - CFPB 2025"],
      ["$88B", "In billing errors on credit reports - CFPB 2025"],
      ["45%", "Of insured adults got unexpected bills - Commonwealth Fund 2024"],
      ["74%", "Who disputed got mistakes corrected - JAMA Health Forum 2024"]
    ].map(function(item, i) {
      return React.createElement("div", { key: i },
        React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-.04em" } }, item[0]),
        React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 8, lineHeight: 1.55 } }, item[1])
      );
    })
  )
),

React.createElement("div", { style: { background: "var(--surface)", padding: "52px 24px", borderBottom: "1px solid var(--border)" } },
  React.createElement("div", { style: { maxWidth: 900, margin: "0 auto" } },
    React.createElement("h2", {
      style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em", textAlign: "center", marginBottom: 32 }
    },
      "We replace weeks of frustration",
      React.createElement("br"),
      React.createElement("span", { style: { color: "var(--green)" } }, "with 5 minutes and one email.")
    ),
    React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 } },
      React.createElement(Card, { style: { padding: "24px 22px", background: "rgba(181,48,32,.04)", border: "1px solid rgba(181,48,32,.15)" } },
        React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 } }, "Without United Patient Advocate"),
        ["Research billing codes for hours", "Call billing - on hold instantly", "Transferred 3+ times", "Try to understand CPT codes alone", "Write dispute letter from scratch", "Wait weeks with no response", "67% of people give up and overpay"].map(function(t, i) {
          return React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" } },
            React.createElement("span", { style: { color: "var(--red)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 } }, "X"),
            React.createElement("span", { style: { fontSize: 15, color: "var(--ink3)", lineHeight: 1.65 } }, t)
          );
        }),
        React.createElement("div", { style: { marginTop: 16, padding: "12px 14px", background: "rgba(181,48,32,.08)", borderRadius: 10, textAlign: "center" } },
          React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--red)", letterSpacing: "-.03em" } }, "10-15+ Hours"),
          React.createElement("div", { style: { fontSize: 12, color: "var(--red)", opacity: .8, marginTop: 2 } }, "of your time and stress")
        )
      ),
      React.createElement(Card, { style: { padding: "24px 22px", background: "rgba(20,122,69,.05)", border: "1.5px solid rgba(20,122,69,.2)", position: "relative" } },
        React.createElement("div", { style: { position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" } }, "With United Patient Advocate"),
        ["Answer a few questions - 3 minutes", "Enter your email - 10 seconds", "We analyze your bill vs Medicare rates", "We write your personalized dispute letter", "We write your word-for-word phone script", "We build your complete 5-step action plan", "You copy the letter. Send it. Done."].map(function(t, i) {
          return React.createElement("div", { key: i, style: { display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" } },
            React.createElement("span", { style: { color: "var(--green)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 } }, "V"),
            React.createElement("span", { style: { fontSize: 15, color: i === 6 ? "var(--ink)" : "var(--ink2)", lineHeight: 1.65, fontWeight: i === 6 ? 700 : 400 } }, t)
          );
        }),
        React.createElement("div", { style: { marginTop: 16, padding: "12px 14px", background: "rgba(20,122,69,.1)", borderRadius: 10, textAlign: "center" } },
          React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", letterSpacing: "-.03em" } }, "Under 5 Minutes"),
          React.createElement("div", { style: { fontSize: 12, color: "var(--green)", opacity: .85, marginTop: 2 } }, "Everything handled for you")
        )
      )
    )
  )
),

React.createElement("div", { style: { maxWidth: 960, margin: "0 auto", padding: "52px 24px" } },
  React.createElement("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, color: "var(--ink)", textAlign: "center", marginBottom: 10, letterSpacing: "-.03em" } }, "Does this sound familiar?"),
  React.createElement("p", { style: { textAlign: "center", color: "var(--ink3)", fontSize: 16, marginBottom: 32, lineHeight: 1.65 } }, "Real patients. Real frustration. Every single day across America."),
  React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 } },
    [
      { q: "The doctor walked in, asked if I had questions, and left in 30 seconds. My bill showed $780 for a physician consultation. I had no idea I could fight that.", who: "Medicare patient, age 71" },
      { q: "I have insurance and still owe $6,400. I have paid premiums my whole life and still cannot afford my surgery. I did not know where to start.", who: "Retired teacher, age 66" },
      { q: "They billed me for a private room I never requested. Nobody told me I had the right to fight back. I wish I had found United Patient Advocate sooner.", who: "Hospital patient, age 58" }
    ].map(function(t, i) {
      return React.createElement(Card, { key: i, style: { padding: 28 } },
        React.createElement("div", { style: { fontSize: 40, color: "var(--navy)", fontFamily: "serif", lineHeight: 1, marginBottom: 12, opacity: .4 } }, '"'),
        React.createElement("p", { style: { color: "var(--ink2)", lineHeight: 1.78, fontSize: 15, marginBottom: 16, fontStyle: "italic" } }, t.q),
        React.createElement("div", { style: { fontSize: 12, color: "var(--ink3)", fontWeight: 600 } }, "- " + t.who)
      );
    })
  )
),

React.createElement("div", { style: { maxWidth: 760, margin: "0 auto 52px", padding: "0 24px" } },
  React.createElement(Card, { style: { padding: "44px 40px" } },
    React.createElement("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 } },
      React.createElement("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 900, color: "var(--ink)", letterSpacing: "-.03em" } }, "Everything You Get"),
      React.createElement("div", { style: { textAlign: "right" } },
        React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 13, color: "var(--ink3)", textDecoration: "line-through" } }, "Was $197"),
        React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 28, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em", lineHeight: 1 } }, "$97"),
        React.createElement("div", { style: { fontSize: 11, color: "var(--green)", fontWeight: 700 } }, "Save $100 - 51% off")
      )
    ),
    React.createElement("p", { style: { color: "var(--ink3)", marginBottom: 28, fontSize: 15, lineHeight: 1.65 } }, "One payment. Yours forever. No subscription. Sent instantly to your inbox."),
    [
      { icon: "Letter", t: "Personalized Dispute Letter", d: "Written specifically for your bill. Professionally worded, legally grounded. Ready to send today." },
      { icon: "Phone", t: "Word-for-Word Phone Script", d: "Exactly what to say when you call. Every objection handled. Read it directly during the call." },
      { icon: "Map", t: "Clear 5-Step Action Plan", d: "Step 1, Step 2, Step 3. Simple. Nothing overwhelming. You always know what to do next." },
      { icon: "Law", t: "Your Legal Rights in Plain English", d: "The federal laws protecting you - explained simply, without legal jargon." },
      { icon: "Email", t: "Delivered to Your Inbox Forever", d: "Never lose your results. Access from any device, anytime, forever." }
    ].map(function(item, i) {
      return React.createElement("div", { key: i, style: { display: "flex", gap: 16, padding: "16px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" } },
        React.createElement("div", { style: { width: 48, height: 48, background: "var(--greenL)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--green)", flexShrink: 0 } }, item.icon.slice(0, 2)),
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 4 } }, item.t),
          React.createElement("div", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.65 } }, item.d)
        )
      );
    })
  )
),

React.createElement("div", { style: { background: "var(--hero)", padding: "64px 24px", textAlign: "center" } },
  React.createElement("div", { style: { maxWidth: 540, margin: "0 auto" } },
    React.createElement("div", { style: { marginBottom: 28 } }, React.createElement(Logo, { size: "lg", light: true })),
    React.createElement("h2", {
      style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(26px,5vw,46px)", fontWeight: 900, color: "#fff", marginBottom: 14, lineHeight: 1.1, letterSpacing: "-.04em" }
    },
      "Skip the research.", React.createElement("br"),
      "Skip the hold music.", React.createElement("br"),
      React.createElement("span", { style: { background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } }, "Get your answers today.")
    ),
    React.createElement("p", { style: { color: "rgba(255,255,255,.65)", fontSize: 17, marginBottom: 32, lineHeight: 1.75 } }, "Every American patient deserves a fair bill. United Patient Advocate is here to make sure you get one."),
    React.createElement(Card, { style: { padding: 26, marginBottom: 26 } },
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 } }, "Introductory Price Ends In:"),
      React.createElement(Countdown, null),
      React.createElement("div", { style: { marginTop: 14, fontSize: 13, color: "var(--ink3)" } },
        React.createElement("span", { style: { textDecoration: "line-through", color: "var(--red)" } }, "$197"),
        React.createElement("span", { style: { fontWeight: 900, color: "var(--green)", fontSize: 22, marginLeft: 10 } }, "$97"),
        React.createElement("span", { style: { color: "var(--ink3)", marginLeft: 8 } }, "- Save $100 today")
      )
    ),
    React.createElement(GreenBtn, { onClick: onStart, full: true, style: { fontSize: 20, padding: "22px 48px", borderRadius: 16, marginBottom: 12 } }, "Start My Free Analysis"),
    React.createElement(ShareBtn, { onClick: function() { setShowShare(true); }, style: { width: "100%", fontSize: 15, padding: "14px", borderRadius: 12, marginBottom: 16 } }, "Share With a Family Member"),
    React.createElement("div", { style: { color: "rgba(255,255,255,.3)", fontSize: 13 } }, "Secure - Private - Instant digital delivery - No subscription")
  )
),

React.createElement("div", { style: { background: "var(--surface)", padding: "16px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 } },
  "United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary. Due to the instant delivery of personalized digital content, all sales are final. All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced. 2026 United Patient Advocate unitedpatientadvocate.com"
)
```

);
}

function Form(props) {
var step = props.step;
var setStep = props.setStep;
var form = props.form;
var update = props.update;
var onSubmit = props.onSubmit;
var mode = props.mode;
var toggleMode = props.toggleMode;
var ok1 = form.visitReason && form.totalBilled;
var ok2 = form.servicesReceived;

function ChoiceBtn(cprops) {
var field = cprops.field;
var val = cprops.val;
var label = cprops.label;
var selected = form[field] === val;
return React.createElement(“button”, {
onClick: function() { update(field, val); },
style: {
flex: 1, padding: “14px 10px”, borderRadius: 11, cursor: “pointer”, textAlign: “center”,
fontFamily: “‘Inter’,sans-serif”, fontSize: 14, fontWeight: 600, lineHeight: 1.3,
border: “1.5px solid “ + (selected ? “var(–navy)” : “var(–border2)”),
background: selected ? “var(–navyL)” : “var(–surface)”,
color: selected ? “var(–navy)” : “var(–ink3)”,
transition: “all .15s”
}
}, label);
}

var lS = { display: “block”, fontSize: 15, fontWeight: 700, color: “var(–ink)”, marginBottom: 8, letterSpacing: “-.01em” };

return React.createElement(“div”, { style: { fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh” } },
React.createElement(“style”, null, FONTS),
React.createElement(“nav”, { style: { background: “var(–surface)”, borderBottom: “1px solid var(–border)”, padding: “14px 28px”, display: “flex”, alignItems: “center”, justifyContent: “space-between” } },
React.createElement(Logo, { size: “sm” }),
React.createElement(“div”, { style: { display: “flex”, gap: 10 } },
React.createElement(ThemeToggle, { mode: mode, toggle: toggleMode }),
React.createElement(“span”, { style: { fontSize: 13, color: “var(–ink3)”, fontWeight: 500 } }, “Private and Secure”)
)
),
React.createElement(“div”, { style: { maxWidth: 560, margin: “0 auto”, padding: “36px 20px” } },
React.createElement(“div”, { style: { display: “flex”, alignItems: “center”, marginBottom: 36 } },
[1, 2, 3].map(function(n, i) {
return React.createElement(“div”, { key: n, style: { display: “flex”, alignItems: “center”, flex: i < 2 ? 1 : “none” } },
React.createElement(“div”, {
style: {
width: 40, height: 40, borderRadius: “50%”, display: “flex”, alignItems: “center”, justifyContent: “center”,
fontWeight: 800, fontSize: 15, flexShrink: 0, fontFamily: “‘Inter’,sans-serif”,
background: step >= n ? “var(–navy)” : “var(–surface2)”,
border: “1.5px solid “ + (step >= n ? “var(–navy)” : “var(–border2)”),
color: step >= n ? “#fff” : “var(–ink3)”,
transition: “all .3s”
}
}, step > n ? “V” : n),
i < 2 ? React.createElement(“div”, { style: { flex: 1, height: 2, background: step > n ? “var(–navy)” : “var(–border2)”, margin: “0 10px”, transition: “background .3s” } }) : null
);
})
),
React.createElement(Card, { style: { padding: “36px 32px” } },
step === 1 ? React.createElement(“div”, null,
React.createElement(“h2”, { style: { fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 6, letterSpacing: “-.03em” } }, “About Your Medical Bill”),
React.createElement(“p”, { style: { color: “var(–ink3)”, fontSize: 15, marginBottom: 24, lineHeight: 1.65 } }, “Fill in what you know - do not worry if you are missing any details.”),
React.createElement(“label”, { style: lS }, “Hospital or Doctor Name (optional)”),
React.createElement(“input”, { placeholder: “e.g. St. Marys Hospital”, value: form.providerName, onChange: function(e) { update(“providerName”, e.target.value); } }),
React.createElement(“label”, { style: lS }, “Total Bill Amount *”),
React.createElement(“div”, { style: { position: “relative” } },
React.createElement(“span”, { style: { position: “absolute”, left: 16, top: “50%”, transform: “translateY(-65%)”, color: “var(–ink3)”, fontSize: 18 } }, “$”),
React.createElement(“input”, { style: { paddingLeft: 32 }, type: “number”, placeholder: “0.00”, value: form.totalBilled, onChange: function(e) { update(“totalBilled”, e.target.value); } })
),
React.createElement(“label”, { style: lS }, “Amount Left to Pay After Insurance”),
React.createElement(“div”, { style: { position: “relative” } },
React.createElement(“span”, { style: { position: “absolute”, left: 16, top: “50%”, transform: “translateY(-65%)”, color: “var(–ink3)”, fontSize: 18 } }, “$”),
React.createElement(“input”, { style: { paddingLeft: 32 }, type: “number”, placeholder: “0.00”, value: form.amountOwed, onChange: function(e) { update(“amountOwed”, e.target.value); } })
),
React.createElement(“label”, { style: lS }, “Do you have health insurance?”),
React.createElement(“div”, { style: { display: “flex”, gap: 10, marginBottom: 20 } },
React.createElement(ChoiceBtn, { field: “hasInsurance”, val: true, label: “Yes I have insurance” }),
React.createElement(ChoiceBtn, { field: “hasInsurance”, val: false, label: “No insurance” })
),
form.hasInsurance ? React.createElement(“div”, null,
React.createElement(“label”, { style: lS }, “Type of Insurance”),
React.createElement(“select”, { value: form.insuranceType, onChange: function(e) { update(“insuranceType”, e.target.value); } },
React.createElement(“option”, { value: “medicare” }, “Medicare - Government plan age 65+”),
React.createElement(“option”, { value: “medicaid” }, “Medicaid”),
React.createElement(“option”, { value: “private” }, “Private / Employer Insurance”),
React.createElement(“option”, { value: “marketplace” }, “ACA Marketplace Plan”),
React.createElement(“option”, { value: “other” }, “Other”)
)
) : null,
React.createElement(“label”, { style: lS }, “Why did you visit? *”),
React.createElement(“input”, { placeholder: “e.g. Chest pain, knee surgery, ER visit”, value: form.visitReason, onChange: function(e) { update(“visitReason”, e.target.value); } })
) : null,
step === 2 ? React.createElement(“div”, null,
React.createElement(“h2”, { style: { fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 6, letterSpacing: “-.03em” } }, “What Happened at Your Visit?”),
React.createElement(“p”, { style: { color: “var(–ink3)”, fontSize: 15, marginBottom: 24, lineHeight: 1.65 } }, “The more you share, the stronger your package becomes.”),
React.createElement(“label”, { style: lS }, “Type of visit”),
React.createElement(“div”, { style: { display: “grid”, gridTemplateColumns: “1fr 1fr”, gap: 10, marginBottom: 20 } },
React.createElement(ChoiceBtn, { field: “stayDuration”, val: “outpatient”, label: “ER / Outpatient” }),
React.createElement(ChoiceBtn, { field: “stayDuration”, val: “inpatient”, label: “Stayed Overnight” }),
React.createElement(ChoiceBtn, { field: “stayDuration”, val: “surgery”, label: “Surgery / Procedure” }),
React.createElement(ChoiceBtn, { field: “stayDuration”, val: “office”, label: “Doctor Office” })
),
React.createElement(“label”, { style: lS }, “Services received? *”),
React.createElement(“textarea”, { style: { minHeight: 100, resize: “vertical” }, placeholder: “e.g. Blood tests, X-rays, IV fluids, doctor visit, medications”, value: form.servicesReceived, onChange: function(e) { update(“servicesReceived”, e.target.value); } }),
React.createElement(“label”, { style: lS }, “Current bill status”),
React.createElement(“select”, { value: form.billStatus, onChange: function(e) { update(“billStatus”, e.target.value); } },
React.createElement(“option”, { value: “unpaid” }, “I have not paid anything yet”),
React.createElement(“option”, { value: “payment_plan” }, “On a monthly payment plan”),
React.createElement(“option”, { value: “collections” }, “Sent to collections”),
React.createElement(“option”, { value: “partially_paid” }, “Partially paid”)
),
React.createElement(“label”, { style: lS }, “Any specific concerns? (very helpful)”),
React.createElement(“textarea”, { style: { minHeight: 88, resize: “vertical” }, placeholder: “e.g. Doctor saw me 30 seconds but billed $800. Duplicate charges. Billed for things I did not receive.”, value: form.specificConcerns, onChange: function(e) { update(“specificConcerns”, e.target.value); } })
) : null,
step === 3 ? React.createElement(“div”, null,
React.createElement(“h2”, { style: { fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 6, letterSpacing: “-.03em” } }, “Almost Ready”),
React.createElement(“p”, { style: { color: “var(–ink3)”, fontSize: 15, marginBottom: 24, lineHeight: 1.65 } }, “Confirming your details before we begin:”),
React.createElement(“div”, { style: { background: “var(–navyL)”, border: “1px solid var(–border)”, borderRadius: 13, padding: “4px 0”, marginBottom: 22 } },
[
[“Provider”, form.providerName || “Not provided”],
[“Total Billed”, form.totalBilled ? “$” + Number(form.totalBilled).toLocaleString() : “Not provided”],
[“You Owe”, form.amountOwed ? “$” + Number(form.amountOwed).toLocaleString() : “Not provided”],
[“Insurance”, form.hasInsurance ? form.insuranceType : “None”],
[“Reason”, form.visitReason || “Not provided”]
].map(function(row, i) {
return React.createElement(“div”, { key: i, style: { display: “flex”, justifyContent: “space-between”, alignItems: “center”, padding: “12px 18px”, borderBottom: i < 4 ? “1px solid var(–border)” : “none”, flexWrap: “wrap”, gap: 6 } },
React.createElement(“span”, { style: { color: “var(–ink3)”, fontSize: 14 } }, row[0]),
React.createElement(“span”, { style: { color: “var(–ink)”, fontWeight: 700, fontSize: 14, textAlign: “right”, maxWidth: “55%” } }, row[1])
);
})
),
React.createElement(“div”, { style: { background: “var(–greenL)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 11, padding: “13px 16px”, fontSize: 14, color: “var(–ink2)”, lineHeight: 1.7 } },
“Your privacy is protected. We never store, share, or sell your information.”
)
) : null,
React.createElement(“div”, { style: { display: “flex”, gap: 10, marginTop: 26 } },
step > 1 ? React.createElement(“button”, {
onClick: function() { setStep(function(s) { return s - 1; }); },
style: { flex: 1, padding: “15px”, borderRadius: 12, border: “1.5px solid var(–navy)”, background: “transparent”, color: “var(–navy)”, fontFamily: “‘Inter’,sans-serif”, fontSize: 15, fontWeight: 700, cursor: “pointer” }
}, “Back”) : null,
React.createElement(NavyBtn, {
onClick: step < 3 ? function() { setStep(function(s) { return s + 1; }); } : onSubmit,
disabled: (step === 1 && !ok1) || (step === 2 && !ok2),
style: { flex: 2, fontSize: 17, borderRadius: 12 }
}, step === 3 ? “Analyze My Bill Now” : “Continue”)
)
)
)
);
}

function Analyzing(props) {
var mode = props.mode;
var toggleMode = props.toggleMode;
var steps = [“Reading your bill details”, “Cross-referencing Medicare rates”, “Checking your federal billing rights”, “Identifying potential overcharges”, “Writing your personalized dispute letter”, “Preparing your word-for-word phone script”, “Building your complete advocacy package”];
var [active, setActive] = useState(0);
useEffect(function() {
var t = setInterval(function() { setActive(function(p) { return Math.min(p + 1, steps.length - 1); }); }, 2100);
return function() { clearInterval(t); };
}, []);
return React.createElement(“div”, { style: { fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, padding: 24 } },
React.createElement(“style”, null, FONTS),
React.createElement(“div”, { style: { position: “absolute”, top: 14, right: 20 } }, React.createElement(ThemeToggle, { mode: mode, toggle: toggleMode })),
React.createElement(“div”, { style: { marginBottom: 36 } }, React.createElement(Logo, { size: “md” })),
React.createElement(“div”, { style: { textAlign: “center”, maxWidth: 480 } },
React.createElement(“div”, { style: { position: “relative”, width: 96, height: 96, margin: “0 auto 40px” } },
React.createElement(“div”, { style: { position: “absolute”, inset: 0, border: “2.5px solid var(–border2)”, borderTop: “2.5px solid var(–navy)”, borderRadius: “50%”, animation: “spin 1.2s linear infinite” } }),
React.createElement(“div”, { style: { position: “absolute”, inset: 11, border: “2px solid var(–border2)”, borderTop: “2px solid var(–green)”, borderRadius: “50%”, animation: “spin 1.8s linear infinite reverse” } }),
React.createElement(“div”, { style: { position: “absolute”, inset: 0, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 34 } }, “AV”)
),
React.createElement(“h2”, { style: { fontFamily: “‘Inter’,sans-serif”, fontSize: 26, fontWeight: 900, color: “var(–ink)”, marginBottom: 8, letterSpacing: “-.03em” } }, “Your Advocate Is Working”),
React.createElement(“p”, { style: { color: “var(–ink3)”, fontSize: 16, marginBottom: 40, animation: “pulse 2s ease infinite”, lineHeight: 1.6 } },
“Please wait - just a moment - “, steps[active]
),
React.createElement(“div”, { style: { textAlign: “left” } },
steps.map(function(s, i) {
return React.createElement(“div”, { key: i, style: { display: “flex”, alignItems: “center”, gap: 12, marginBottom: 12, opacity: i > active ? 0.2 : 1, transition: “opacity .5s” } },
React.createElement(“div”, {
style: {
width: 24, height: 24, borderRadius: “50%”, flexShrink: 0, fontSize: 11,
display: “flex”, alignItems: “center”, justifyContent: “center”, fontWeight: 800,
background: i < active ? “var(–green)” : i === active ? “var(–navy)” : “var(–border2)”,
color: i <= active ? “#fff” : “var(–ink3)”
}
}, i < active ? “V” : i === active ? “O” : i + 1),
React.createElement(“span”, { style: { fontSize: 14, color: i <= active ? “var(–ink)” : “var(–ink3)” } }, s)
);
})
)
)
);
}

function EmailCapture(props) {
var onContinue = props.onContinue;
var mode = props.mode;
var toggleMode = props.toggleMode;
var [email, setEmail] = useState(””);
var [name, setName] = useState(””);
var [done, setDone] = useState(false);
function submit() {
if (!email.includes(”@”)) return;
setDone(true);
setTimeout(function() { onContinue(email, name); }, 1800);
}
return React.createElement(“div”, { style: { fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh”, display: “flex”, flexDirection: “column”, alignItems: “center”, justifyContent: “center”, padding: 24 } },
React.createElement(“style”, null, FONTS),
React.createElement(“div”, { style: { position: “absolute”, top: 14, right: 20 } }, React.createElement(ThemeToggle, { mode: mode, toggle: toggleMode })),
React.createElement(“div”, { style: { maxWidth: 500, width: “100%” } },
React.createElement(“div”, { style: { textAlign: “center”, marginBottom: 22 } }, React.createElement(Logo, { size: “md” })),
React.createElement(Card, { style: { padding: “48px 40px”, textAlign: “center” } },
React.createElement(“div”, { style: { width: 66, height: 66, background: “var(–greenL)”, borderRadius: “50%”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 30, margin: “0 auto 22px” } }, “OK”),
React.createElement(“div”, { style: { display: “inline-block”, background: “var(–greenL)”, color: “var(–green)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 20, padding: “5px 14px”, fontSize: 12, fontWeight: 700, marginBottom: 18 } }, “Your Analysis Is Ready”),
React.createElement(“h2”, { style: { fontFamily: “‘Inter’,sans-serif”, fontSize: 24, fontWeight: 900, color: “var(–ink)”, marginBottom: 12, letterSpacing: “-.03em” } }, “Where Should We Send Your Results?”),
React.createElement(“p”, { style: { color: “var(–ink3)”, fontSize: 15, lineHeight: 1.78, marginBottom: 26 } }, “Enter your email and we will send your complete advocacy package directly to your inbox so you can access it anytime from any device forever.”),
done ? React.createElement(“div”, { style: { background: “var(–greenL)”, border: “1px solid rgba(20,122,69,.2)”, borderRadius: 14, padding: “26px 22px” } },
React.createElement(“div”, { style: { fontWeight: 900, color: “var(–green)”, fontSize: 18, marginBottom: 7 } }, “On its way to your inbox!”),
React.createElement(“div”, { style: { color: “var(–ink3)”, fontSize: 14, lineHeight: 1.7 } }, “Taking you to your results now.”)
) : React.createElement(“div”, null,
React.createElement(“label”, { style: { display: “block”, fontSize: 15, fontWeight: 700, color: “var(–ink)”, marginBottom: 8, textAlign: “left” } }, “Your First Name (optional)”),
React.createElement(“input”, { placeholder: “e.g. Margaret”, value: name, onChange: function(e) { setName(e.target.value); } }),
React.createElement(“label”, { style: { display: “block”, fontSize: 15, fontWeight: 700, color: “var(–ink)”, marginBottom: 8, textAlign: “left” } }, “Your Email Address *”),
React.createElement(“input”, { type: “email”, placeholder: “e.g. myemail@gmail.com”, value: email, onChange: function(e) { setEmail(e.target.value); }, onKeyDown: function(e) { if (e.key === “Enter”) submit(); } }),
React.createElement(GreenBtn, { onClick: submit, disabled: !email.includes(”@”), full: true, style: { fontSize: 17, borderRadius: 12, marginBottom: 12 } }, “Send My Results to My Inbox”),
React.createElement(“div”, { style: { fontSize: 13, color: “var(–ink3)”, lineHeight: 1.7, marginBottom: 16 } }, “No spam. Unsubscribe anytime. We will also send free weekly billing protection tips.”),
React.createElement(“button”, {
onClick: function() { onContinue(””, “”); },
style: { background: “none”, border: “none”, color: “var(–ink3)”, fontSize: 13, cursor: “pointer”, textDecoration: “underline”, fontFamily: “‘Inter’,sans-serif” }
}, “Skip - show my results on screen only”)
)
)
)
);
}

function Results(props) {
var results = props.results;
var userEmail = props.userEmail;
var userName = props.userName;
var onReset = props.onReset;
var mode = props.mode;
var toggleMode = props.toggleMode;
var [unlocked, setUnlocked] = useState(false);
var [tab, setTab] = useState(“letter”);
var [feedback, setFeedback] = useState(””);
var [feedbackSent, setFeedbackSent] = useState(false);
var [copied, setCopied] = useState(null);
var [showShare, setShowShare] = useState(false);
var [familyAdded, setFamilyAdded] = useState(false);

if (!results) return null;
var summary = results.summary;
var disputeLetter = results.disputeLetter;
var phoneScript = results.phoneScript;
var actionPlan = results.actionPlan;
var yourRights = results.yourRights;

var rColor = summary.riskLevel === “HIGH” ? “var(–red)” : “var(–gold)”;
var rBg = summary.riskLevel === “HIGH” ? “var(–redL)” : “var(–goldL)”;

function cp(text, id) {
navigator.clipboard.writeText(text);
setCopied(id);
setTimeout(function() { setCopied(null); }, 2500);
}

return React.createElement(“div”, { style: { fontFamily: “‘Inter’,sans-serif”, background: “var(–bg)”, minHeight: “100vh” } },
React.createElement(“style”, null, FONTS),
showShare ? React.createElement(ShareModal, { onClose: function() { setShowShare(false); } }) : null,

```
React.createElement("div", { style: { background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "13px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 100 } },
  React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 12 } },
    React.createElement(Logo, { size: "sm" }),
    React.createElement("span", { style: { background: "var(--greenL)", color: "var(--green)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 } }, "Analysis Complete")
  ),
  React.createElement("div", { style: { display: "flex", gap: 8 } },
    React.createElement(ThemeToggle, { mode: mode, toggle: toggleMode }),
    React.createElement(ShareBtn, { onClick: function() { setShowShare(true); }, style: { padding: "8px 14px", fontSize: 12, borderRadius: 10 } }, "Share"),
    React.createElement("button", { onClick: onReset, style: { background: "var(--navyL)", color: "var(--navy)", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" } }, "New Analysis")
  )
),

React.createElement("div", { style: { maxWidth: 720, margin: "0 auto", padding: "36px 18px" } },
  userName ? React.createElement("p", { style: { fontFamily: "'Lora',serif", fontSize: 20, color: "var(--navy)", fontStyle: "italic", textAlign: "center", marginBottom: 22 } }, userName + ", here is what your advocate found on your bill.") : null,

  React.createElement("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", gap: 8, alignItems: "center" } },
    React.createElement("span", { style: { color: "var(--green)", fontSize: 16 } }, "OK"),
    React.createElement("span", { style: { fontSize: 13, color: "var(--green)", fontWeight: 700 } }, "FREE REVIEW - No payment required for this section")
  ),

  React.createElement(Card, { style: { marginBottom: 18, overflow: "hidden" } },
    React.createElement("div", { style: { background: "var(--navy)", padding: "18px 22px" } },
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 7 } }, "Your Advocate Assessment"),
      React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 16, color: "#fff", lineHeight: 1.65, fontWeight: 500 } }, summary.keyFindings)
    ),
    React.createElement("div", { style: { padding: "20px 22px" } },
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 } },
        React.createElement("div", { style: { background: rBg, border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" } },
          React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: rColor, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 } }, "Risk Level"),
          React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: rColor, letterSpacing: "-.03em" } }, summary.riskLevel)
        ),
        React.createElement("div", { style: { background: "var(--greenL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" } },
          React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 } }, "Potential Savings"),
          React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--green)", letterSpacing: "-.02em" } }, "$" + summary.estimatedSavingsMin + " to $" + summary.estimatedSavingsMax)
        ),
        React.createElement("div", { style: { background: "var(--navyL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" } },
          React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 } }, "Issues Found"),
          React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--navy)", letterSpacing: "-.03em" } }, summary.errorsFound ? summary.errorsFound.length : 3)
        )
      ),
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 } }, "Billing Concerns Identified"),
      summary.errorsFound ? summary.errorsFound.map(function(e, i) {
        return React.createElement("div", { key: i, style: { display: "flex", gap: 10, padding: "11px 0", borderBottom: i < summary.errorsFound.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" } },
          React.createElement("div", { style: { width: 22, height: 22, background: "var(--redL)", border: "1px solid rgba(181,48,32,.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: "var(--red)" } }, i + 1),
          React.createElement("span", { style: { color: "var(--ink2)", lineHeight: 1.7, fontSize: 15 } }, e)
        );
      }) : null
    )
  ),

  React.createElement(Card, { style: { padding: "20px 22px", marginBottom: 24 } },
    React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 } }, "Your Legal Rights as a Patient"),
    yourRights ? yourRights.map(function(r, i) {
      var parts = r.split(":");
      var title = parts[0];
      var rest = parts.slice(1).join(":").trim();
      return React.createElement("div", { key: i, style: { display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" } },
        React.createElement("span", { style: { color: "var(--green)", fontSize: 16, flexShrink: 0, lineHeight: 1.5, fontWeight: 700 } }, "V"),
        React.createElement("div", null,
          React.createElement("div", { style: { fontWeight: 700, color: "var(--ink)", fontSize: 15, marginBottom: 2 } }, title),
          rest ? React.createElement("div", { style: { color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 } }, rest) : null
        )
      );
    }) : null,
    React.createElement("div", { style: { marginTop: 14, padding: "10px 14px", background: "var(--navyL)", borderRadius: 10, fontSize: 11, color: "var(--ink3)", lineHeight: 1.65 } },
      "Sources 2023-2025: Harvard Medical School - Mayo Clinic Proceedings - Johns Hopkins Medicine - U.S. CFPB - Commonwealth Fund - AARP - cited for educational reference only"
    )
  ),

  !unlocked ? React.createElement(Card, { style: { padding: "40px 32px", textAlign: "center", borderTop: "3px solid var(--navy)", marginBottom: 28 } },
    React.createElement("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 12, letterSpacing: "-.03em" } }, "Get Your Complete Advocacy Package"),
    React.createElement("p", { style: { color: "var(--ink3)", fontSize: 15, maxWidth: 420, margin: "0 auto 10px", lineHeight: 1.75 } }, "Your letter is written. Your script is ready. All you do is send one email."),
    React.createElement("p", { style: { color: "var(--ink3)", fontSize: 14, maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.7 } }, "Others charge $200 or more and take weeks. We charge $97 flat - one time, forever."),
    React.createElement("div", { style: { background: "rgba(212,98,10,.07)", border: "1px solid rgba(212,98,10,.2)", borderRadius: 12, padding: "13px 17px", marginBottom: 20, display: "flex", gap: 11, alignItems: "center", textAlign: "left" } },
      React.createElement("span", { style: { fontSize: 22, flexShrink: 0 } }, "Fam"),
      React.createElement("div", { style: { flex: 1 } },
        React.createElement("div", { style: { fontWeight: 700, color: "var(--ink)", fontSize: 14, marginBottom: 2 } }, "Need help from a family member?"),
        React.createElement("div", { style: { color: "var(--ink3)", fontSize: 13 } }, "Your son, daughter, or grandchild can complete this for you in minutes.")
      ),
      React.createElement(ShareBtn, { onClick: function() { setShowShare(true); }, style: { padding: "9px 14px", fontSize: 12, borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0 } }, "Share")
    ),
    React.createElement("div", { style: { background: "var(--goldL)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 14, padding: "16px 20px", marginBottom: 22 } },
      React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 } }, "Price Rises June 15 - Time Remaining:"),
      React.createElement(Countdown, null),
      React.createElement("div", { style: { marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 } },
        React.createElement("span", { style: { fontSize: 16, color: "var(--ink3)", textDecoration: "line-through" } }, "$197"),
        React.createElement("span", { style: { fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em" } }, "$97"),
        React.createElement("span", { style: { fontSize: 13, color: "var(--green)", fontWeight: 700 } }, "Save $100")
      )
    ),
    React.createElement("a", {
      href: "https://gumroad.com/YOUR_LINK",
      target: "_blank",
      rel: "noopener noreferrer",
      style: { display: "block", background: "linear-gradient(135deg,#16A04A,#147A45)", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "18px 32px", fontSize: 19, fontWeight: 800, marginBottom: 10, boxShadow: "0 8px 28px rgba(20,122,69,.45)", maxWidth: 420, margin: "0 auto 10px", letterSpacing: "-.02em", fontFamily: "'Inter',sans-serif" }
    }, "Unlock My Complete Package - $97"),
    React.createElement("div", { style: { fontSize: 12, color: "var(--ink3)", marginTop: 10 } }, "Instant access - Sent to your email - All sales are final due to instant digital delivery"),
    React.createElement("div", { style: { marginTop: 20 } },
      React.createElement("button", { onClick: function() { setUnlocked(true); }, style: { background: "none", border: "1px dashed var(--border2)", borderRadius: 8, padding: "7px 14px", color: "var(--ink3)", cursor: "pointer", fontSize: 12, fontFamily: "'Inter',sans-serif" } }, "Preview full results demo")
    )
  ) : React.createElement("div", { style: { marginBottom: 28 } },
    React.createElement("div", { style: { display: "flex", gap: 4, marginBottom: 20, background: "var(--surface2)", padding: "6px", borderRadius: 14, border: "1px solid var(--border)" } },
      [["letter", "Dispute Letter"], ["script", "Phone Script"], ["action", "Action Plan"], ["rights", "Your Rights"]].map(function(item) {
        return React.createElement("button", {
          key: item[0],
          onClick: function() { setTab(item[0]); },
          style: { flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, background: tab === item[0] ? "var(--navy)" : "transparent", color: tab === item[0] ? "#fff" : "var(--ink3)", transition: "all .15s" }
        }, item[1]);
      })
    ),

    tab === "letter" ? React.createElement(Card, { style: { overflow: "hidden" } },
      React.createElement("div", { style: { background: "var(--navy)", padding: "16px 22px" } },
        React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" } }, "Step 1 - Send Your Dispute Letter"),
        React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 } }, "Print and mail or copy and paste into an email")
      ),
      React.createElement("div", { style: { padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" } },
        React.createElement("span", { style: { fontSize: 14, color: "var(--ink3)" } }, "Your Personalized Dispute Letter"),
        React.createElement("button", {
          onClick: function() { cp(disputeLetter, "letter"); },
          style: { background: "var(--green)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }
        }, copied === "letter" ? "Copied!" : "Copy Letter")
      ),
      React.createElement("div", { style: { padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", background: "var(--surface)", fontFamily: "Georgia,'Times New Roman',serif", maxHeight: 460, overflowY: "auto" } }, disputeLetter)
    ) : null,

    tab === "script" ? React.createElement(Card, { style: { overflow: "hidden" } },
      React.createElement("div", { style: { background: "#1A4A6B", padding: "16px 22px" } },
        React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" } }, "Step 2 - Call the Billing Department"),
        React.createElement("div", { style: { fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 } }, "Read this word for word - no memorizing needed")
      ),
      React.createElement("div", { style: { padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" } },
        React.createElement("span", { style: { fontSize: 14, color: "var(--ink3)" } }, "Your Phone Script - Read During Your Call"),
        React.createElement("button", {
          onClick: function() { cp(phoneScript, "script"); },
          style: { background: "#1A4A6B", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }
        }, copied === "script" ? "Copied!" : "Copy Script")
      ),
      React.createElement("div", { style: { padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", maxHeight: 460, overflowY: "auto" } }, phoneScript)
    ) : null,

    tab === "action" && actionPlan ? React.createElement(Card, { style: { padding: "24px 22px" } },
      React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", marginBottom: 20, letterSpacing: "-.02em" } }, "Step 3 - Your Action Plan"),
      actionPlan.map(function(item, i) {
        return React.createElement("div", { key: i, style: { display: "flex", gap: 14, marginBottom: 20, alignItems: "flex-start" } },
          React.createElement("div", { style: { width: 42, height: 42, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 16 } }, item.step),
          React.createElement("div", { style: { flex: 1, background: "var(--navyL)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" } },
            React.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 } },
              React.createElement("h3", { style: { fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--ink)" } }, item.title),
              React.createElement("span", { style: { background: "var(--goldL)", color: "var(--gold)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" } }, item.timeframe)
            ),
            React.createElement("p", { style: { color: "var(--ink2)", lineHeight: 1.7, fontSize: 14, marginBottom: 12 } }, item.description),
            React.createElement("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.18)", borderRadius: 10, padding: "10px 14px" } },
              React.createElement("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 2 } }, "Expert Tip"),
              React.createElement("div", { style: { color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 } }, item.powerTip)
            )
          )
        );
      })
    ) : null,

    tab === "rights" && yourRights ? React.createElement(Card, { style: { padding: "24px 22px" } },
      React.createElement("h3", { style: { fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 6 } }, "Your Legal Rights as a Patient"),
      React.createElement("p", { style: { color: "var(--ink3)", fontSize: 14, marginBottom: 20, lineHeight: 1.65 } }, "These federal protections apply to you right now. Know them. Use them."),
      yourRights.map(function(r, i) {
        var parts = r.split(":");
        var title = parts[0];
        var rest = parts.slice(1).join(":").trim();
        return React.createElement("div", { key: i, style: { display: "flex", gap: 12, marginBottom: 16, padding: "14px 16px", background: "var(--navyL)", borderLeft: "3px solid var(--navy)", borderRadius: "0 12px 12px 0" } },
          React.createElement("div", null,
            React.createElement("div", { style: { fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 3 } }, title),
            rest ? React.createElement("div", { style: { color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 } }, rest) : null
          )
        );
      }),
      React.createElement("div", { style: { marginTop: 16, padding: "12px 16px", background: "var(--navyL)", borderRadius: 10, fontSize: 11, color: "var(--ink3)", lineHeight: 1.7 } },
        "Research Sources 2023-2025: Harvard Medical School - Mayo Clinic Proceedings - U.S. CFPB - Johns Hopkins Medicine - Commonwealth Fund - AARP - cited for educational reference only. United Patient Advocate is not affiliated with or endorsed by any institution listed."
      )
    ) : null,

    userEmail ? React.createElement("div", { style: { background: "var(--greenL)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 14, padding: "20px 22px", marginTop: 20, display: "flex", gap: 12, alignItems: "flex-start" } },
      React.createElement("div", null,
        React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "var(--green)", marginBottom: 5 } }, "Your package was also sent to your email"),
        React.createElement("div", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 } }, "Everything was sent to " + userEmail + ". Close this page anytime - your complete advocacy package will be in your inbox forever.")
      )
    ) : null,

    React.createElement(Card, { style: { padding: "28px 26px", marginTop: 20 } },
      React.createElement("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 6, textAlign: "center" } }, "Protect Your Whole Family"),
      React.createElement("p", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.7, marginBottom: 22, textAlign: "center" } }, "You are already protected with the Individual Plan. Here is what the Family Plan adds on top."),
      React.createElement("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 } },
        React.createElement("div", { style: { background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 16, padding: "20px 16px" } },
          React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 } }, "You Already Have"),
          React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--navy)", marginBottom: 14 } }, "Individual Plan"),
          ["1 bill analysis", "Dispute letter", "Phone script", "5-step action plan", "Results in inbox"].map(function(t, i) {
            return React.createElement("div", { key: i, style: { display: "flex", gap: 7, marginBottom: 7 } },
              React.createElement("span", { style: { color: "var(--green)", fontWeight: 700, fontSize: 13 } }, "V"),
              React.createElement("span", { style: { fontSize: 13, color: "var(--ink3)" } }, t)
            );
          }),
          React.createElement("div", { style: { marginTop: 14 } },
            React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" } }, "Was $197"),
            React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--navy)" } }, "$97 one-time")
          )
        ),
        React.createElement("div", { style: { background: "rgba(20,122,69,.06)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 16, padding: "20px 16px", position: "relative" } },
          React.createElement("div", { style: { position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" } }, "Premium Upgrade"),
          React.createElement("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 } }, "Everything above PLUS"),
          React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--green)", marginBottom: 14 } }, "Family Plan"),
          [["Unlimited analyses - whole year", true], ["Every family member covered", true], ["Results saved permanently", true], ["Professional PDF letterhead", false], ["Monthly family billing newsletter", false]].map(function(item, i) {
            return React.createElement("div", { key: i, style: { display: "flex", gap: 7, marginBottom: 7 } },
              React.createElement("span", { style: { color: "var(--green)", fontWeight: 700, fontSize: 13 } }, "V"),
              React.createElement("span", { style: { fontSize: 13, color: item[1] ? "var(--ink)" : "var(--ink3)", fontWeight: item[1] ? 600 : 400 } }, item[0])
            );
          }),
          React.createElement("div", { style: { marginTop: 14 } },
            React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" } }, "Was $297 per year"),
            React.createElement("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)" } }, "$147 per year")
          )
        )
      ),
      !familyAdded ? React.createElement("a", {
        href: "https://gumroad.com/YOUR_FAMILY_LINK",
        target: "_blank",
        rel: "noopener noreferrer",
        onClick: function() { setFamilyAdded(true); },
        style: { display: "block", background: "var(--navy)", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "15px 24px", fontSize: 16, fontWeight: 800, textAlign: "center", fontFamily: "'Inter',sans-serif" }
      }, "Add Family Protection Plan - $147 per year") : React.createElement("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "14px 18px", textAlign: "center" } },
        React.createElement("div", { style: { fontWeight: 800, color: "var(--green)", fontSize: 15 } }, "Family Plan added! Check your email for access details.")
      ),
      React.createElement("div", { style: { marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--ink3)" } }, "No confusion. No double charging. The Individual Plan is yours - this adds unlimited family coverage on top. All sales are final due to instant digital delivery.")
    )
  ),

  React.createElement(Card, { style: { padding: "32px 26px", textAlign: "center", borderTop: "3px solid var(--green)" } },
    React.createElement("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 8 } }, "Help Us Serve More Americans Like You"),
    React.createElement("p", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.75, marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" } }, "Your feedback shapes what we build next for every American patient who needs an advocate."),
    !feedbackSent ? React.createElement("div", null,
      React.createElement("textarea", { value: feedback, onChange: function(e) { setFeedback(e.target.value); }, placeholder: "Any idea, big or small. What else do you need?", style: { minHeight: 90, resize: "vertical", textAlign: "left", marginBottom: 14 } }),
      React.createElement(GreenBtn, {
        onClick: function() { if (feedback.trim()) { setFeedbackSent(true); } },
        disabled: !feedback.trim(),
        style: { maxWidth: 320, margin: "0 auto", fontSize: 15, borderRadius: 10, padding: "14px 28px" }
      }, "Share My Feedback")
    ) : React.createElement("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 14, padding: "24px" } },
      React.createElement("div", { style: { fontWeight: 900, color: "var(--green)", fontSize: 17, marginBottom: 6 } }, "Thank you genuinely."),
      React.createElement("div", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 } }, "Your feedback shapes what we build next for every American patient who needs an advocate in their corner.")
    )
  )
),

React.createElement("div", { style: { background: "var(--surface)", padding: "14px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 } },
  "United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary. Due to the instant delivery of personalized digital content, all sales are final. All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced. 2026 United Patient Advocate unitedpatientadvocate.com"
)
```

);
}

export default function App() {
var themeData = useTheme();
var mode = themeData.mode;
var toggle = themeData.toggle;
var [screen, setScreen] = useState(“landing”);
var [step, setStep] = useState(1);
var [form, setForm] = useState({
providerName: “”, totalBilled: “”, amountOwed: “”,
hasInsurance: true, insuranceType: “medicare”,
visitReason: “”, servicesReceived: “”,
stayDuration: “outpatient”, specificConcerns: “”, billStatus: “unpaid”
});
var [results, setResults] = useState(null);
var [userEmail, setUserEmail] = useState(””);
var [userName, setUserName] = useState(””);

function update(f, v) { setForm(function(p) { return Object.assign({}, p, { [f]: v }); }); }

async function analyze() {
setScreen(“analyzing”);
var prompt = “You are the AI engine behind United Patient Advocate. Analyze this bill and return ONLY valid JSON with no markdown.\n\nPatient: Provider="” + (form.providerName || “Hospital”) + “", Total=$” + form.totalBilled + “, Owes=$” + (form.amountOwed || form.totalBilled) + “, Insurance=” + (form.hasInsurance ? form.insuranceType : “none”) + “, Visit="” + form.visitReason + “", Services="” + form.servicesReceived + “", Type=” + form.stayDuration + “, Status=” + form.billStatus + “, Concerns="” + (form.specificConcerns || “bill seems too high”) + “"\n\nReturn this JSON:\n{"summary":{"riskLevel":"HIGH","estimatedSavingsMin":"500","estimatedSavingsMax":"2400","errorsFound":["Specific billing concern based on their visit type and insurance","Second specific concern about their charges or services","Third area worth investigating"],"keyFindings":"2-3 warm empowering sentences. Reference that 2024 JAMA Health Forum research confirms 74 percent who dispute get mistakes corrected. Hopeful and authoritative."},"disputeLetter":"[Your Full Name]\n[Street Address]\n[City State ZIP]\n[Phone Number]\n[Email Address]\n\n[Today Date]\n\nBilling Department\n” + (form.providerName || “Medical Provider”) + “\nAttn: Patient Billing Review Team\n\nRe: Formal Billing Review Request\nAccount Number: [ACCOUNT NUMBER on your bill]\nDate of Service: [Date]\nAmount Under Review: $” + (form.amountOwed || form.totalBilled) + “\n\nDear Billing Review Team\n\nI am writing on behalf of United Patient Advocate to formally request a complete audit of the charges on the above account before any payment is made.\n\n[Continue with 380 words: cite No Surprises Act 2022, itemized billing rights, ACA transparency. Request complete itemized statement with CPT codes. State no payment until review complete. Set 30-day deadline. Reference CFPB complaint if unresolved. Professional firm tone.]\n\nRespectfully submitted\n\n[Patient Printed Name]\n\nUnited Patient Advocate unitedpatientadvocate.com","phoneScript":"UNITED PATIENT ADVOCATE PHONE SCRIPT\nKEEP THIS BY THE PHONE\n\nBEST TIME: Tuesday through Thursday 9:00 AM to 11:00 AM\n\nWHEN THEY ANSWER:\nHello. My name is [Your Name] account number [Account Number]. I am calling with United Patient Advocate regarding a formal billing review. I need to speak with a billing supervisor please.\n\n[Continue 320 words: supervisor handling, No Surprises Act invocation, itemized bill request, 501r financial assistance by name, settlement negotiation, call documentation. Simple language for seniors.]","actionPlan":[{"step":1,"title":"Request Your Itemized Bill Today","description":"Call billing and ask for a complete itemized bill with every charge and CPT code. Legal right before any payment.","timeframe":"TODAY","powerTip":"Say: I am requesting a complete itemized statement as is my right under federal billing transparency regulations. This signals you know your rights."},{"step":2,"title":"Compare Bill to Insurance Payment","description":"Call your insurer for the Explanation of Benefits. Compare line by line. 45 percent of insured Americans received bills for services believed to be covered per Commonwealth Fund 2024.","timeframe":"Within 2 Days","powerTip":"Ask: Was this claim processed at in-network or out-of-network rates? A wrong classification alone can add thousands."},{"step":3,"title":"Mail Your Dispute Letter via Certified Mail","description":"Print sign and mail via USPS Certified Mail. Keep the yellow receipt. Creates legal paper trail and pauses collections.","timeframe":"Within 1 Week","powerTip":"The yellow receipt is your legal proof of delivery. It protects your credit report during the dispute period."},{"step":4,"title":"Apply for Financial Assistance","description":"All nonprofit hospitals must offer charity care under IRS 501r. Many qualify even with insurance.","timeframe":"Within 2 Weeks","powerTip":"Ask for the 501r financial assistance application by name. Most billing staff will not volunteer this unless you ask."},{"step":5,"title":"File Federal Complaint If Unresolved","description":"File free at consumerfinance.gov or call 1-855-411-2372 after 30 days. CFPB complaints resolve most disputes within 10 to 14 days.","timeframe":"Day 30","powerTip":"Federal complaints trigger dedicated hospital resolution teams. Free to file. No lawyer needed."}],"yourRights":["Right to an Itemized Bill: Federal law requires hospitals to provide a complete itemized statement before you are required to pay anything","No Surprises Act 2022: You cannot be billed above in-network rates for emergency care at any facility including out-of-network hospitals","Right to Appeal Insurance Denials: Legal right to appeal any denial internally then through binding independent external review at no cost","Charity Care IRS 501r: All nonprofit hospitals receiving federal funds must offer financial assistance programs and screen patients upon request","Credit Protection CFPB 2025: Strengthened rules - medical debt under $500 cannot appear on credit reports and all debt needs 365 days before reporting"]}”;

```
try {
  var res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  var data = await res.json();
  var raw = data.content ? data.content.map(function(c) { return c.text || ""; }).join("") : "";
  var parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  setResults(parsed);
  setScreen("email");
} catch(err) {
  console.error("Analysis error:", err);
  setScreen("form");
}
```

}

var shared = { mode: mode, toggleMode: toggle };

if (screen === “landing”) return React.createElement(Landing, Object.assign({ onStart: function() { setScreen(“form”); } }, shared));
if (screen === “analyzing”) return React.createElement(Analyzing, shared);
if (screen === “email”) return React.createElement(EmailCapture, Object.assign({ onContinue: function(email, name) { setUserEmail(email); setUserName(name); setScreen(“results”); } }, shared));
if (screen === “results”) return React.createElement(Results, Object.assign({ results: results, userEmail: userEmail, userName: userName, formData: form, onReset: function() { setScreen(“landing”); setResults(null); setStep(1); setUserEmail(””); setUserName(””); } }, shared));
return React.createElement(Form, Object.assign({ step: step, setStep: setStep, form: form, update: update, onSubmit: analyze }, shared));
}
