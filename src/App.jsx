import { useState, useEffect } from "react";

function injectStyles() {
  if (document.getElementById("upa-styles")) return;
  var s = document.createElement("style");
  s.id = "upa-styles";
  s.textContent = [
    "@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600;700;800;900&display=swap');",
    "*{box-sizing:border-box;margin:0;padding:0}",
    "html{scroll-behavior:smooth}",
    "body{font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;transition:background .3s,color .3s}",
    "body.light{--bg:#F7F6F2;--surface:#FFFFFF;--surface2:#F2F0EC;--border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.14);--ink:#0D0D0D;--ink2:#3A3A3A;--ink3:#6B6B6B;--navy:#1B3A6B;--navyL:#EEF3FB;--green:#147A45;--greenL:#E6F4EE;--red:#B53020;--redL:#FEF1F0;--gold:#8A5C00;--goldL:#FEF8EC;--orange:#D4620A;--shadow:0 1px 3px rgba(0,0,0,.06),0 4px 16px rgba(0,0,0,.06);--hero:linear-gradient(135deg,#0D1F3C 0%,#1B3A6B 50%,#0E3020 100%);}",
    "body.twilight{--bg:#1A1814;--surface:#252219;--surface2:#2E2A21;--border:rgba(255,255,255,0.07);--border2:rgba(255,255,255,0.12);--ink:#F0EDE6;--ink2:#C8C4BA;--ink3:#8A857A;--navy:#7BA8E0;--navyL:rgba(123,168,224,.12);--green:#4CAF80;--greenL:rgba(76,175,128,.12);--red:#E07070;--redL:rgba(224,112,112,.12);--gold:#D4A040;--goldL:rgba(212,160,64,.12);--orange:#F0844A;--shadow:0 1px 3px rgba(0,0,0,.3),0 4px 16px rgba(0,0,0,.3);--hero:linear-gradient(135deg,#0A0D0A 0%,#101820 50%,#0A1208 100%);}",
    "body{background:var(--bg);color:var(--ink)}",
    "@keyframes spin{to{transform:rotate(360deg)}}",
    "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}",
    "@keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}",
    ".fu{animation:fadeUp .6s cubic-bezier(.16,1,.3,1) forwards}",
    "input,select,textarea{width:100%;padding:14px 16px;font-size:17px;font-family:'Inter',sans-serif;border-radius:12px;border:1.5px solid var(--border2);background:var(--surface);color:var(--ink);margin-bottom:20px;box-sizing:border-box;transition:border-color .2s;outline:none;}",
    "input:focus,select:focus,textarea:focus{border-color:var(--navy);box-shadow:0 0 0 3px rgba(27,58,107,.12);}"
  ].join("\n");
  document.head.appendChild(s);
}

function useTheme() {
  var stored = "light";
  try { stored = localStorage.getItem("upa-theme") || "light"; } catch(e) {}
  var arr = useState(stored);
  var mode = arr[0];
  var setMode = arr[1];
  useEffect(function() {
    document.body.className = mode;
    try { localStorage.setItem("upa-theme", mode); } catch(e) {}
  }, [mode]);
  useEffect(function() { injectStyles(); }, []);
  return {
    mode: mode,
    toggle: function() { setMode(function(m) { return m === "light" ? "twilight" : "light"; }); }
  };
}

function el(tag, props, children) {
  if (Array.isArray(children)) {
    return React.createElement.apply(React, [tag, props].concat(children));
  }
  return React.createElement(tag, props, children);
}

function Card(props) {
  return el("div", {
    style: Object.assign({ background: "var(--surface)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "var(--shadow)" }, props.style || {})
  }, props.children);
}

function GreenBtn(props) {
  return el("button", {
    onClick: props.disabled ? undefined : props.onClick,
    style: Object.assign({
      background: props.disabled ? "#ccc" : "linear-gradient(135deg,#16A04A,#147A45)",
      color: "#fff", border: "none", borderRadius: 14, padding: "18px 36px",
      fontSize: 18, fontWeight: 800, cursor: props.disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter',sans-serif", letterSpacing: "-.02em",
      boxShadow: props.disabled ? "none" : "0 8px 28px rgba(20,122,69,.45)",
      transition: "all .18s", width: props.full ? "100%" : "auto",
      opacity: props.disabled ? .5 : 1, lineHeight: 1.3
    }, props.style || {})
  }, props.children);
}

function NavyBtn(props) {
  return el("button", {
    onClick: props.disabled ? undefined : props.onClick,
    style: Object.assign({
      background: props.disabled ? "#ccc" : "var(--navy)",
      color: "#fff", border: "none", borderRadius: 12, padding: "15px 28px",
      fontSize: 16, fontWeight: 700, cursor: props.disabled ? "not-allowed" : "pointer",
      fontFamily: "'Inter',sans-serif", transition: "all .18s", opacity: props.disabled ? .5 : 1
    }, props.style || {})
  }, props.children);
}

function ShareBtn(props) {
  return el("button", {
    onClick: props.onClick,
    style: Object.assign({
      background: "var(--orange)", color: "#fff", border: "none", borderRadius: 12,
      padding: "13px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer",
      fontFamily: "'Inter',sans-serif", boxShadow: "0 6px 20px rgba(212,98,10,.35)",
      transition: "all .18s", lineHeight: 1.3
    }, props.style || {})
  }, props.children);
}

function ThemeToggle(props) {
  return el("button", {
    onClick: props.toggle,
    style: {
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--surface2)", border: "1.5px solid var(--border2)",
      borderRadius: 40, padding: "8px 14px", cursor: "pointer",
      fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 700,
      color: "var(--ink2)", transition: "all .2s", whiteSpace: "nowrap"
    }
  }, props.mode === "light" ? "Moon  Easy on Eyes" : "Sun  Bright Mode");
}

function Logo(props) {
  var size = props.size || "md";
  var light = props.light || false;
  var dims = { sm: [30, 15], md: [38, 19], lg: [52, 26] }[size];
  var w = dims[0];
  var fs = dims[1];
  var c = light ? "#FFFFFF" : "var(--navy)";
  var g = light ? "#86EFAC" : "var(--green)";
  return el("div", { style: { display: "flex", alignItems: "center", gap: 10 } }, [
    el("svg", { width: w, height: w, viewBox: "0 0 48 48", fill: "none", key: "svg" }, [
      el("path", { d: "M24 4L6 11v12c0 11.4 7.7 22 18 25.2C34.3 45 42 34.4 42 23V11L24 4z", fill: light ? "rgba(255,255,255,0.12)" : "var(--navyL)", stroke: light ? "rgba(255,255,255,0.5)" : "var(--navy)", strokeWidth: "1.5", strokeLinejoin: "round", key: "p1" }),
      el("path", { d: "M17 24l5 5 9-10", stroke: g, strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", key: "p2" })
    ]),
    el("div", { style: { lineHeight: 1 }, key: "text" }, [
      el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: fs, fontWeight: 900, color: c, letterSpacing: "-.04em", lineHeight: 1.1 }, key: "t1" }, [
        "United",
        el("span", { style: { color: g }, key: "sp" }, "Patient")
      ]),
      el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: fs * .58, fontWeight: 600, color: light ? "rgba(255,255,255,.5)" : "var(--ink3)", letterSpacing: ".14em", textTransform: "uppercase", marginTop: 2 }, key: "t2" }, "Advocate")
    ])
  ]);
}

function Countdown(props) {
  var end = new Date("2026-06-15T23:59:59").getTime();
  var arr = useState(Math.max(0, end - Date.now()));
  var t = arr[0];
  var setT = arr[1];
  useEffect(function() {
    var i = setInterval(function() { setT(Math.max(0, end - Date.now())); }, 1000);
    return function() { clearInterval(i); };
  }, []);
  var d = Math.floor(t / 86400000);
  var h = Math.floor((t % 86400000) / 3600000);
  var m = Math.floor((t % 3600000) / 60000);
  var s = Math.floor((t % 60000) / 1000);
  function pad(n) { return String(n).padStart(2, "0"); }
  var light = props.light;
  var tc = light ? "rgba(255,255,255,.9)" : "var(--ink)";
  var lc = light ? "rgba(255,255,255,.45)" : "var(--ink3)";
  function Box(n, l) {
    return el("div", { style: { textAlign: "center", minWidth: 52 }, key: l }, [
      el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 28, fontWeight: 900, color: tc, lineHeight: 1, letterSpacing: "-.04em" }, key: "n" }, pad(n)),
      el("div", { style: { fontSize: 10, color: lc, textTransform: "uppercase", letterSpacing: "1.2px", marginTop: 5, fontWeight: 600 }, key: "l" }, l)
    ]);
  }
  var sep = el("div", { style: { fontSize: 20, color: lc, fontWeight: 300, paddingBottom: 18 }, key: "sep" }, ":");
  return el("div", { style: { display: "flex", gap: 8, alignItems: "center", justifyContent: "center" } }, [
    Box(d, "Days"), el("div", { style: { fontSize: 20, color: lc, fontWeight: 300, paddingBottom: 18 }, key: "s1" }, ":"),
    Box(h, "Hrs"), el("div", { style: { fontSize: 20, color: lc, fontWeight: 300, paddingBottom: 18 }, key: "s2" }, ":"),
    Box(m, "Min"), el("div", { style: { fontSize: 20, color: lc, fontWeight: 300, paddingBottom: 18 }, key: "s3" }, ":"),
    Box(s, "Sec")
  ]);
}

function ShareModal(props) {
  var onClose = props.onClose;
  var link = "https://unitedpatientadvocate.com";
  function share(msg) {
    if (navigator.share) { navigator.share({ text: msg, url: link }); }
    else { navigator.clipboard.writeText(msg + "\n" + link); alert("Message copied! Paste into a text."); }
    onClose();
  }
  return el("div", { style: { position: "fixed", inset: 0, background: "rgba(0,0,0,.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 } },
    el(Card, { style: { padding: "40px 34px", maxWidth: 460, width: "100%" } }, [
      el("div", { style: { textAlign: "center", marginBottom: 24 }, key: "hd" }, [
        el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--ink)", marginBottom: 10 }, key: "h" }, "Share With Your Family"),
        el("p", { style: { color: "var(--ink3)", fontSize: 15, lineHeight: 1.7 }, key: "p" }, "A son, daughter, or grandchild can fill this out with you in minutes.")
      ]),
      el("div", { style: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }, key: "btns" }, [
        el(ShareBtn, { onClick: function() { share("I found something that can help with my medical bill. It is free to check. Can you help me? " + link); }, style: { width: "100%", fontSize: 15, padding: "16px 20px", borderRadius: 12 }, key: "b1" }, "Send to My Son / Daughter / Grandchild"),
        el("button", { onClick: function() { share("I found a free tool that checks medical bills for errors and writes the dispute letter. Takes 3 minutes. " + link); }, style: { background: "var(--navyL)", color: "var(--navy)", border: "1.5px solid var(--navy)", borderRadius: 12, padding: "16px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif", width: "100%" }, key: "b2" }, "Send to Mom / Dad / Grandparent")
      ]),
      el("button", { onClick: onClose, style: { background: "none", border: "none", color: "var(--ink3)", fontSize: 13, cursor: "pointer", width: "100%", textAlign: "center", textDecoration: "underline", fontFamily: "'Inter',sans-serif" }, key: "cl" }, "Close")
    ])
  );
}

function Landing(props) {
  var onStart = props.onStart;
  var mode = props.mode;
  var toggleMode = props.toggleMode;
  var arr = useState(false);
  var showShare = arr[0];
  var setShowShare = arr[1];

  return el("div", { style: { fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh" } }, [
    showShare ? el(ShareModal, { onClose: function() { setShowShare(false); }, key: "modal" }) : null,

    el("div", { style: { background: "var(--navy)", color: "#fff", textAlign: "center", padding: "10px 20px", fontSize: 13, fontWeight: 600 }, key: "urg" }, [
      "Introductory price ", el("strong", { key: "p" }, "$97"), " - was ", el("s", { key: "s" }, "$197"), " - offer ends June 15  ",
      el("span", { style: { color: "#93C5FD" }, key: "sp" }, "Save $100 today")
    ]),

    el("nav", { style: { background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 100 }, key: "nav" }, [
      el(Logo, { size: "md", key: "logo" }),
      el("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }, key: "navbtns" }, [
        el(ThemeToggle, { mode: mode, toggle: toggleMode, key: "tog" }),
        el(ShareBtn, { onClick: function() { setShowShare(true); }, style: { padding: "10px 16px", fontSize: 13, borderRadius: 10 }, key: "sh" }, "Share"),
        el(GreenBtn, { onClick: onStart, style: { padding: "11px 22px", fontSize: 14, borderRadius: 10 }, key: "st" }, "Free Analysis")
      ])
    ]),

    el("div", { style: { background: "var(--hero)", padding: "80px 24px 68px", textAlign: "center", position: "relative", overflow: "hidden" }, key: "hero" }, [
      el("div", { style: { position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 18% 42%,rgba(76,175,128,.12) 0%,transparent 50%),radial-gradient(circle at 82% 62%,rgba(123,168,224,.09) 0%,transparent 50%)", pointerEvents: "none" }, key: "ov" }),
      el("div", { style: { position: "relative", maxWidth: 820, margin: "0 auto" }, key: "inner" }, [
        el("div", { className: "fu", style: { display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(76,175,128,.15)", border: "1px solid rgba(76,175,128,.35)", borderRadius: 40, padding: "7px 18px", fontSize: 11, fontWeight: 700, color: "#86EFAC", letterSpacing: "1.3px", textTransform: "uppercase", marginBottom: 24 }, key: "badge" }, "Backed by 2023-2025 Published Medical Research"),
        el("h1", { style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(32px,5.5vw,60px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: 20, letterSpacing: "-.04em" }, key: "h1" }, [
          "Your Medical Bill", el("br", { key: "br1" }),
          "Contains Errors.", el("br", { key: "br2" }),
          el("span", { style: { background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontStyle: "italic" }, key: "gr" }, "We Find Them.")
        ]),
        el("p", { style: { fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 14px", lineHeight: 1.78 }, key: "p1" }, [
          "According to ", el("strong", { style: { color: "#fff" }, key: "h" }, "Harvard Medical School"),
          ", ", el("strong", { style: { color: "#fff" }, key: "m" }, "Mayo Clinic"),
          ", and the ", el("strong", { style: { color: "#fff" }, key: "c" }, "U.S. Government CFPB"),
          " - American patients are overcharged billions every year. Most never know they can fight back."
        ]),
        el("p", { style: { fontSize: "clamp(15px,2vw,19px)", color: "rgba(255,255,255,.72)", maxWidth: 580, margin: "0 auto 38px", lineHeight: 1.78 }, key: "p2" }, [
          el("strong", { style: { color: "#86EFAC" }, key: "s" }, "We have already done all the research."),
          " Answer a few simple questions. Get your ready-to-send dispute letter in minutes. ",
          el("strong", { style: { color: "#fff" }, key: "s2" }, "Two clicks. Done.")
        ]),
        el("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }, key: "ctas" }, [
          el(GreenBtn, { onClick: onStart, style: { fontSize: 20, padding: "22px 52px", borderRadius: 16 }, key: "btn" }, "Start My Free Analysis"),
          el("button", { onClick: function() { setShowShare(true); }, style: { background: "rgba(255,255,255,.08)", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Inter',sans-serif" }, key: "sh" }, "Not sure? Share with a family member"),
          el("div", { style: { fontSize: 12, color: "rgba(255,255,255,.38)" }, key: "note" }, "No account - No medical knowledge needed - Results sent to your inbox")
        ])
      ])
    ]),

    el("div", { style: { background: "var(--surface2)", padding: "52px 24px", borderBottom: "1px solid var(--border)" }, key: "research" }, [
      el("div", { style: { maxWidth: 860, margin: "0 auto" }, key: "rinner" }, [
        el("div", { style: { textAlign: "center", marginBottom: 30 }, key: "rtitle" }, [
          el("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 10 }, key: "rl" }, "What the Research Confirms"),
          el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,3.5vw,32px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em" }, key: "rh" }, [
            "The System Is Broken by Design. ",
            el("span", { style: { color: "var(--green)" }, key: "gs" }, "Two of the World's Most Trusted Medical Institutions Prove It.")
          ])
        ]),
        el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }, key: "rgrid" }, [
          el(Card, { style: { padding: "24px 26px", position: "relative", overflow: "hidden" }, key: "hcard" }, [
            el("div", { style: { position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--navy)", borderRadius: "20px 0 0 20px" }, key: "bar" }),
            el("div", { style: { paddingLeft: 14 }, key: "hcontent" }, [
              el("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }, key: "hbadges" }, [
                el("div", { style: { background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--navy)" }, key: "hb1" }, "Harvard Medical School"),
                el("div", { style: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 }, key: "hb2" }, "Published 2023")
              ]),
              el("p", { style: { fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 }, key: "hq" }, "Electronic medical records make it far too easy to bill for procedures that never happened. A patient described a brief exam yet the resulting bill documented a comprehensive physical examination that never occurred."),
              el("div", { style: { fontSize: 11, color: "var(--ink3)", marginBottom: 12 }, key: "hsrc" }, "Dr. Edward P. Hoffer, Harvard Medical School - Published in Mayo Clinic Proceedings: Digital Health - May 2023"),
              el("div", { style: { background: "var(--navyL)", border: "1px solid rgba(27,58,107,.15)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--navy)", fontWeight: 600 }, key: "htip" }, "This billing complexity creates the overcharges we find and fix for you.")
            ])
          ]),
          el(Card, { style: { padding: "24px 26px", position: "relative", overflow: "hidden" }, key: "mcard" }, [
            el("div", { style: { position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: "var(--green)", borderRadius: "20px 0 0 20px" }, key: "mbar" }),
            el("div", { style: { paddingLeft: 14 }, key: "mcontent" }, [
              el("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 12, flexWrap: "wrap" }, key: "mbadges" }, [
                el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 900, color: "var(--green)" }, key: "mb1" }, "Mayo Clinic Connect"),
                el("div", { style: { background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 20, padding: "3px 10px", fontSize: 10, color: "var(--ink3)", fontWeight: 600 }, key: "mb2" }, "Patient Community 2023")
              ]),
              el("p", { style: { fontFamily: "'Lora',serif", fontSize: 15, color: "var(--ink)", lineHeight: 1.68, fontStyle: "italic", marginBottom: 11 }, key: "mq" }, "I sincerely doubt that they ever would have given this money back if I did not have the time and the tenacity to keep calling them. Watch your bills."),
              el("div", { style: { fontSize: 11, color: "var(--ink3)", marginBottom: 12 }, key: "msrc" }, "Verified patient account, Mayo Clinic Connect community forum 2023"),
              el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 9, padding: "10px 14px", fontSize: 12, color: "var(--green)", fontWeight: 700 }, key: "mtip" }, "United Patient Advocate gives you that tenacity - in 3 minutes, not 3 months.")
            ])
          ])
        ])
      ])
    ]),

    el("div", { style: { background: "var(--navy)", padding: "42px 24px" }, key: "stats" },
      el("div", { style: { maxWidth: 880, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))", gap: 28, textAlign: "center" } },
        [["100M+","Americans with medical debt - CFPB 2025"],["$88B","In billing errors on credit reports - CFPB 2025"],["45%","Of insured adults got unexpected bills - Commonwealth Fund 2024"],["74%","Who disputed got mistakes corrected - JAMA 2024"]].map(function(item, i) {
          return el("div", { key: i }, [
            el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-.04em" }, key: "n" }, item[0]),
            el("div", { style: { fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 8, lineHeight: 1.55 }, key: "l" }, item[1])
          ]);
        })
      )
    ),

    el("div", { style: { background: "var(--surface)", padding: "52px 24px", borderBottom: "1px solid var(--border)" }, key: "ba" }, [
      el("div", { style: { maxWidth: 900, margin: "0 auto" }, key: "bai" }, [
        el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,36px)", fontWeight: 900, color: "var(--ink)", lineHeight: 1.2, letterSpacing: "-.03em", textAlign: "center", marginBottom: 32 }, key: "bah" }, [
          "We replace weeks of frustration", el("br", { key: "br" }),
          el("span", { style: { color: "var(--green)" }, key: "gs" }, "with 5 minutes and one email.")
        ]),
        el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }, key: "bagrid" }, [
          el(Card, { style: { padding: "24px 22px", background: "rgba(181,48,32,.04)", border: "1px solid rgba(181,48,32,.15)" }, key: "wout" }, [
            el("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }, key: "wl" }, "Without United Patient Advocate"),
            ["Research billing codes for hours","Call billing - on hold instantly","Transferred 3 or more times","Try to understand CPT codes alone","Write dispute letter from scratch","Wait weeks with no response","67% of people give up and overpay"].map(function(t, i) {
              return el("div", { key: i, style: { display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" } }, [
                el("span", { style: { color: "var(--red)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 }, key: "x" }, "X"),
                el("span", { style: { fontSize: 15, color: "var(--ink3)", lineHeight: 1.65 }, key: "t" }, t)
              ]);
            }),
            el("div", { style: { marginTop: 16, padding: "12px 14px", background: "rgba(181,48,32,.08)", borderRadius: 10, textAlign: "center" }, key: "wsum" }, [
              el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--red)", letterSpacing: "-.03em" }, key: "wn" }, "10-15+ Hours"),
              el("div", { style: { fontSize: 12, color: "var(--red)", opacity: .8, marginTop: 2 }, key: "ws" }, "of your time and stress")
            ])
          ]),
          el(Card, { style: { padding: "24px 22px", background: "rgba(20,122,69,.05)", border: "1.5px solid rgba(20,122,69,.2)", position: "relative" }, key: "win" }, [
            el("div", { style: { position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "4px 14px", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }, key: "wbadge" }, "With United Patient Advocate"),
            ["Answer a few questions - 3 minutes","Enter your email - 10 seconds","We analyze your bill vs Medicare rates","We write your personalized dispute letter","We write your word-for-word phone script","We build your complete 5-step action plan","You copy the letter. Send it. Done."].map(function(t, i) {
              return el("div", { key: i, style: { display: "flex", gap: 9, marginBottom: 10, alignItems: "flex-start" } }, [
                el("span", { style: { color: "var(--green)", fontSize: 13, flexShrink: 0, lineHeight: 1.6, fontWeight: 700 }, key: "v" }, "V"),
                el("span", { style: { fontSize: 15, color: i === 6 ? "var(--ink)" : "var(--ink2)", lineHeight: 1.65, fontWeight: i === 6 ? 700 : 400 }, key: "t" }, t)
              ]);
            }),
            el("div", { style: { marginTop: 16, padding: "12px 14px", background: "rgba(20,122,69,.1)", borderRadius: 10, textAlign: "center" }, key: "wsum" }, [
              el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", letterSpacing: "-.03em" }, key: "gn" }, "Under 5 Minutes"),
              el("div", { style: { fontSize: 12, color: "var(--green)", opacity: .85, marginTop: 2 }, key: "gs" }, "Everything handled for you")
            ])
          ])
        ])
      ])
    ]),

    el("div", { style: { maxWidth: 960, margin: "0 auto", padding: "52px 24px" }, key: "stories" }, [
      el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(20px,4vw,34px)", fontWeight: 900, color: "var(--ink)", textAlign: "center", marginBottom: 10, letterSpacing: "-.03em" }, key: "sh" }, "Does this sound familiar?"),
      el("p", { style: { textAlign: "center", color: "var(--ink3)", fontSize: 16, marginBottom: 32, lineHeight: 1.65 }, key: "sp" }, "Real patients. Real frustration. Every single day across America."),
      el("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 }, key: "sgrid" },
        [
          { q: "The doctor walked in, asked if I had questions, and left in 30 seconds. My bill showed $780 for a physician consultation. I had no idea I could fight that.", who: "Medicare patient, age 71" },
          { q: "I have insurance and still owe $6,400. I have paid premiums my whole life and still cannot afford my surgery. I did not know where to start.", who: "Retired teacher, age 66" },
          { q: "They billed me for a private room I never requested. Nobody told me I had the right to fight back. I wish I had found United Patient Advocate sooner.", who: "Hospital patient, age 58" }
        ].map(function(t, i) {
          return el(Card, { key: i, style: { padding: 28 } }, [
            el("div", { style: { fontSize: 40, color: "var(--navy)", fontFamily: "serif", lineHeight: 1, marginBottom: 12, opacity: .4 }, key: "q" }, '"'),
            el("p", { style: { color: "var(--ink2)", lineHeight: 1.78, fontSize: 15, marginBottom: 16, fontStyle: "italic" }, key: "t" }, t.q),
            el("div", { style: { fontSize: 12, color: "var(--ink3)", fontWeight: 600 }, key: "w" }, "- " + t.who)
          ]);
        })
      )
    ]),

    el("div", { style: { maxWidth: 760, margin: "0 auto 52px", padding: "0 24px" }, key: "included" },
      el(Card, { style: { padding: "44px 40px" } }, [
        el("div", { style: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }, key: "ihead" }, [
          el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 900, color: "var(--ink)", letterSpacing: "-.03em" }, key: "ih" }, "Everything You Get"),
          el("div", { style: { textAlign: "right" }, key: "iprice" }, [
            el("div", { style: { fontSize: 13, color: "var(--ink3)", textDecoration: "line-through" }, key: "ip1" }, "Was $197"),
            el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 28, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em", lineHeight: 1 }, key: "ip2" }, "$97"),
            el("div", { style: { fontSize: 11, color: "var(--green)", fontWeight: 700 }, key: "ip3" }, "Save $100 - 51% off")
          ])
        ]),
        el("p", { style: { color: "var(--ink3)", marginBottom: 28, fontSize: 15, lineHeight: 1.65 }, key: "isub" }, "One payment. Yours forever. No subscription. Sent instantly to your inbox."),
        [
          { t: "Personalized Dispute Letter", d: "Written specifically for your bill. Professionally worded, legally grounded. Ready to send today." },
          { t: "Word-for-Word Phone Script", d: "Exactly what to say when you call. Every objection handled. Read it directly during the call." },
          { t: "Clear 5-Step Action Plan", d: "Step 1, Step 2, Step 3. Simple. Nothing overwhelming. You always know what to do next." },
          { t: "Your Legal Rights in Plain English", d: "The federal laws protecting you - explained simply, without legal jargon." },
          { t: "Delivered to Your Inbox Forever", d: "Never lose your results. Access from any device, anytime, forever." }
        ].map(function(item, i) {
          return el("div", { key: i, style: { display: "flex", gap: 16, padding: "16px 0", borderBottom: i < 4 ? "1px solid var(--border)" : "none" } }, [
            el("div", { style: { width: 48, height: 48, background: "var(--greenL)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--green)", flexShrink: 0 }, key: "ic" }, String(i + 1)),
            el("div", { key: "txt" }, [
              el("div", { style: { fontWeight: 700, fontSize: 16, color: "var(--ink)", marginBottom: 4 }, key: "t" }, item.t),
              el("div", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.65 }, key: "d" }, item.d)
            ])
          ]);
        })
      ])
    ),

    el("div", { style: { background: "var(--hero)", padding: "64px 24px", textAlign: "center" }, key: "cta" }, [
      el("div", { style: { maxWidth: 540, margin: "0 auto" }, key: "ctai" }, [
        el("div", { style: { marginBottom: 28 }, key: "ctalogo" }, el(Logo, { size: "lg", light: true })),
        el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: "clamp(26px,5vw,46px)", fontWeight: 900, color: "#fff", marginBottom: 14, lineHeight: 1.1, letterSpacing: "-.04em" }, key: "ctah" }, [
          "Skip the research.", el("br", { key: "br1" }),
          "Skip the hold music.", el("br", { key: "br2" }),
          el("span", { style: { background: "linear-gradient(90deg,#86EFAC,#4CAF80)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }, key: "gr" }, "Get your answers today.")
        ]),
        el("p", { style: { color: "rgba(255,255,255,.65)", fontSize: 17, marginBottom: 32, lineHeight: 1.75 }, key: "ctap" }, "Every American patient deserves a fair bill. United Patient Advocate is here to make sure you get one."),
        el(Card, { style: { padding: 26, marginBottom: 26 }, key: "ctacd" }, [
          el("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--ink3)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }, key: "cdl" }, "Introductory Price Ends In:"),
          el(Countdown, { key: "cd" }),
          el("div", { style: { marginTop: 14, fontSize: 13, color: "var(--ink3)" }, key: "cdp" }, [
            el("span", { style: { textDecoration: "line-through", color: "var(--red)" }, key: "s1" }, "$197"),
            el("span", { style: { fontWeight: 900, color: "var(--green)", fontSize: 22, marginLeft: 10 }, key: "s2" }, "$97"),
            el("span", { style: { color: "var(--ink3)", marginLeft: 8 }, key: "s3" }, "- Save $100 today")
          ])
        ]),
        el(GreenBtn, { onClick: onStart, full: true, style: { fontSize: 20, padding: "22px 48px", borderRadius: 16, marginBottom: 12 }, key: "ctabtn" }, "Start My Free Analysis"),
        el(ShareBtn, { onClick: function() { setShowShare(true); }, style: { width: "100%", fontSize: 15, padding: "14px", borderRadius: 12, marginBottom: 16 }, key: "ctash" }, "Share With a Family Member"),
        el("div", { style: { color: "rgba(255,255,255,.3)", fontSize: 13 }, key: "ctanote" }, "Secure - Private - Instant digital delivery - No subscription")
      ])
    ]),

    el("div", { style: { background: "var(--surface)", padding: "16px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 }, key: "footer" },
      "United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary. Due to the instant delivery of personalized digital content, all sales are final. All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced. 2026 United Patient Advocate unitedpatientadvocate.com"
    )
  ]);
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
  var lS = { display: "block", fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 8 };

  function ChoiceBtn(cprops) {
    var selected = form[cprops.field] === cprops.val;
    return el("button", {
      onClick: function() { update(cprops.field, cprops.val); },
      style: { flex: 1, padding: "14px 10px", borderRadius: 11, cursor: "pointer", textAlign: "center", fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, lineHeight: 1.3, border: "1.5px solid " + (selected ? "var(--navy)" : "var(--border2)"), background: selected ? "var(--navyL)" : "var(--surface)", color: selected ? "var(--navy)" : "var(--ink3)", transition: "all .15s" }
    }, cprops.label);
  }

  return el("div", { style: { fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh" } }, [
    el("nav", { style: { background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }, key: "nav" }, [
      el(Logo, { size: "sm", key: "logo" }),
      el("div", { style: { display: "flex", gap: 10 }, key: "navr" }, [
        el(ThemeToggle, { mode: mode, toggle: toggleMode, key: "tog" }),
        el("span", { style: { fontSize: 13, color: "var(--ink3)", fontWeight: 500 }, key: "priv" }, "Private and Secure")
      ])
    ]),
    el("div", { style: { maxWidth: 560, margin: "0 auto", padding: "36px 20px" }, key: "content" }, [
      el("div", { style: { display: "flex", alignItems: "center", marginBottom: 36 }, key: "prog" },
        [1, 2, 3].map(function(n, i) {
          return el("div", { key: n, style: { display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" } }, [
            el("div", { style: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, flexShrink: 0, fontFamily: "'Inter',sans-serif", background: step >= n ? "var(--navy)" : "var(--surface2)", border: "1.5px solid " + (step >= n ? "var(--navy)" : "var(--border2)"), color: step >= n ? "#fff" : "var(--ink3)", transition: "all .3s" }, key: "dot" }, step > n ? "V" : n),
            i < 2 ? el("div", { style: { flex: 1, height: 2, background: step > n ? "var(--navy)" : "var(--border2)", margin: "0 10px", transition: "background .3s" }, key: "bar" }) : null
          ]);
        })
      ),
      el(Card, { style: { padding: "36px 32px" }, key: "card" }, [
        step === 1 ? el("div", { key: "s1" }, [
          el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.03em" }, key: "h" }, "About Your Medical Bill"),
          el("p", { style: { color: "var(--ink3)", fontSize: 15, marginBottom: 24, lineHeight: 1.65 }, key: "p" }, "Fill in what you know - do not worry if you are missing any details."),
          el("label", { style: lS, key: "l1" }, "Hospital or Doctor Name (optional)"),
          el("input", { placeholder: "e.g. St. Marys Hospital", value: form.providerName, onChange: function(e) { update("providerName", e.target.value); }, key: "i1" }),
          el("label", { style: lS, key: "l2" }, "Total Bill Amount *"),
          el("div", { style: { position: "relative" }, key: "d1" }, [
            el("span", { style: { position: "absolute", left: 16, top: "50%", transform: "translateY(-65%)", color: "var(--ink3)", fontSize: 18 }, key: "ds" }, "$"),
            el("input", { style: { paddingLeft: 32 }, type: "number", placeholder: "0.00", value: form.totalBilled, onChange: function(e) { update("totalBilled", e.target.value); }, key: "di" })
          ]),
          el("label", { style: lS, key: "l3" }, "Amount Left to Pay After Insurance"),
          el("div", { style: { position: "relative" }, key: "d2" }, [
            el("span", { style: { position: "absolute", left: 16, top: "50%", transform: "translateY(-65%)", color: "var(--ink3)", fontSize: 18 }, key: "ds" }, "$"),
            el("input", { style: { paddingLeft: 32 }, type: "number", placeholder: "0.00", value: form.amountOwed, onChange: function(e) { update("amountOwed", e.target.value); }, key: "di" })
          ]),
          el("label", { style: lS, key: "l4" }, "Do you have health insurance?"),
          el("div", { style: { display: "flex", gap: 10, marginBottom: 20 }, key: "ins" }, [
            el(ChoiceBtn, { field: "hasInsurance", val: true, label: "Yes I have insurance", key: "y" }),
            el(ChoiceBtn, { field: "hasInsurance", val: false, label: "No insurance", key: "n" })
          ]),
          form.hasInsurance ? el("div", { key: "instype" }, [
            el("label", { style: lS, key: "lt" }, "Type of Insurance"),
            el("select", { value: form.insuranceType, onChange: function(e) { update("insuranceType", e.target.value); }, key: "sel" }, [
              el("option", { value: "medicare", key: "m" }, "Medicare - Government plan age 65+"),
              el("option", { value: "medicaid", key: "mc" }, "Medicaid"),
              el("option", { value: "private", key: "pr" }, "Private / Employer Insurance"),
              el("option", { value: "marketplace", key: "mp" }, "ACA Marketplace Plan"),
              el("option", { value: "other", key: "ot" }, "Other")
            ])
          ]) : null,
          el("label", { style: lS, key: "l5" }, "Why did you visit? *"),
          el("input", { placeholder: "e.g. Chest pain, knee surgery, ER visit", value: form.visitReason, onChange: function(e) { update("visitReason", e.target.value); }, key: "i5" })
        ]) : null,
        step === 2 ? el("div", { key: "s2" }, [
          el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.03em" }, key: "h" }, "What Happened at Your Visit?"),
          el("p", { style: { color: "var(--ink3)", fontSize: 15, marginBottom: 24, lineHeight: 1.65 }, key: "p" }, "The more you share, the stronger your package becomes."),
          el("label", { style: lS, key: "lv" }, "Type of visit"),
          el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }, key: "vg" }, [
            el(ChoiceBtn, { field: "stayDuration", val: "outpatient", label: "ER / Outpatient", key: "o" }),
            el(ChoiceBtn, { field: "stayDuration", val: "inpatient", label: "Stayed Overnight", key: "i" }),
            el(ChoiceBtn, { field: "stayDuration", val: "surgery", label: "Surgery / Procedure", key: "s" }),
            el(ChoiceBtn, { field: "stayDuration", val: "office", label: "Doctor Office", key: "f" })
          ]),
          el("label", { style: lS, key: "ls" }, "Services received? *"),
          el("textarea", { style: { minHeight: 100, resize: "vertical" }, placeholder: "e.g. Blood tests, X-rays, IV fluids, doctor visit, medications", value: form.servicesReceived, onChange: function(e) { update("servicesReceived", e.target.value); }, key: "ts" }),
          el("label", { style: lS, key: "lbs" }, "Current bill status"),
          el("select", { value: form.billStatus, onChange: function(e) { update("billStatus", e.target.value); }, key: "bs" }, [
            el("option", { value: "unpaid", key: "u" }, "I have not paid anything yet"),
            el("option", { value: "payment_plan", key: "pp" }, "On a monthly payment plan"),
            el("option", { value: "collections", key: "co" }, "Sent to collections"),
            el("option", { value: "partially_paid", key: "pa" }, "Partially paid")
          ]),
          el("label", { style: lS, key: "lc" }, "Any specific concerns? (very helpful)"),
          el("textarea", { style: { minHeight: 88, resize: "vertical" }, placeholder: "e.g. Doctor saw me 30 seconds but billed $800. Duplicate charges.", value: form.specificConcerns, onChange: function(e) { update("specificConcerns", e.target.value); }, key: "tc" })
        ]) : null,
        step === 3 ? el("div", { key: "s3" }, [
          el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 6, letterSpacing: "-.03em" }, key: "h" }, "Almost Ready"),
          el("p", { style: { color: "var(--ink3)", fontSize: 15, marginBottom: 24, lineHeight: 1.65 }, key: "p" }, "Confirming your details before we begin:"),
          el("div", { style: { background: "var(--navyL)", border: "1px solid var(--border)", borderRadius: 13, padding: "4px 0", marginBottom: 22 }, key: "conf" },
            [["Provider", form.providerName || "Not provided"],["Total Billed", form.totalBilled ? "$" + Number(form.totalBilled).toLocaleString() : "Not provided"],["You Owe", form.amountOwed ? "$" + Number(form.amountOwed).toLocaleString() : "Not provided"],["Insurance", form.hasInsurance ? form.insuranceType : "None"],["Reason", form.visitReason || "Not provided"]].map(function(row, i) {
              return el("div", { key: i, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < 4 ? "1px solid var(--border)" : "none", flexWrap: "wrap", gap: 6 } }, [
                el("span", { style: { color: "var(--ink3)", fontSize: 14 }, key: "l" }, row[0]),
                el("span", { style: { color: "var(--ink)", fontWeight: 700, fontSize: 14, textAlign: "right", maxWidth: "55%" }, key: "v" }, row[1])
              ]);
            })
          ),
          el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 11, padding: "13px 16px", fontSize: 14, color: "var(--ink2)", lineHeight: 1.7 }, key: "priv" },
            "Your privacy is protected. We never store, share, or sell your information."
          )
        ]) : null,
        el("div", { style: { display: "flex", gap: 10, marginTop: 26 }, key: "fbtn" }, [
          step > 1 ? el("button", { onClick: function() { setStep(function(s) { return s - 1; }); }, style: { flex: 1, padding: "15px", borderRadius: 12, border: "1.5px solid var(--navy)", background: "transparent", color: "var(--navy)", fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer" }, key: "back" }, "Back") : null,
          el(NavyBtn, { onClick: step < 3 ? function() { setStep(function(s) { return s + 1; }); } : onSubmit, disabled: (step === 1 && !ok1) || (step === 2 && !ok2), style: { flex: 2, fontSize: 17, borderRadius: 12 }, key: "next" }, step === 3 ? "Analyze My Bill Now" : "Continue")
        ])
      ])
    ])
  ]);
}

function Analyzing(props) {
  var mode = props.mode;
  var toggleMode = props.toggleMode;
  var steps = ["Reading your bill details","Cross-referencing Medicare rates","Checking your federal billing rights","Identifying potential overcharges","Writing your personalized dispute letter","Preparing your word-for-word phone script","Building your complete advocacy package"];
  var arr = useState(0);
  var active = arr[0];
  var setActive = arr[1];
  useEffect(function() {
    var t = setInterval(function() { setActive(function(p) { return Math.min(p + 1, steps.length - 1); }); }, 2100);
    return function() { clearInterval(t); };
  }, []);
  return el("div", { style: { fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 } }, [
    el("div", { style: { position: "absolute", top: 14, right: 20 }, key: "tog" }, el(ThemeToggle, { mode: mode, toggle: toggleMode })),
    el("div", { style: { marginBottom: 36 }, key: "logo" }, el(Logo, { size: "md" })),
    el("div", { style: { textAlign: "center", maxWidth: 480 }, key: "content" }, [
      el("div", { style: { position: "relative", width: 96, height: 96, margin: "0 auto 40px" }, key: "spin" }, [
        el("div", { style: { position: "absolute", inset: 0, border: "2.5px solid var(--border2)", borderTop: "2.5px solid var(--navy)", borderRadius: "50%", animation: "spin 1.2s linear infinite" }, key: "s1" }),
        el("div", { style: { position: "absolute", inset: 11, border: "2px solid var(--border2)", borderTop: "2px solid var(--green)", borderRadius: "50%", animation: "spin 1.8s linear infinite reverse" }, key: "s2" }),
        el("div", { style: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34 }, key: "icon" }, "AV")
      ]),
      el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 26, fontWeight: 900, color: "var(--ink)", marginBottom: 8, letterSpacing: "-.03em" }, key: "h" }, "Your Advocate Is Working"),
      el("p", { style: { color: "var(--ink3)", fontSize: 16, marginBottom: 40, animation: "pulse 2s ease infinite", lineHeight: 1.6 }, key: "p" }, "Please wait - " + steps[active]),
      el("div", { style: { textAlign: "left" }, key: "list" },
        steps.map(function(s, i) {
          return el("div", { key: i, style: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12, opacity: i > active ? 0.2 : 1, transition: "opacity .5s" } }, [
            el("div", { style: { width: 24, height: 24, borderRadius: "50%", flexShrink: 0, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, background: i < active ? "var(--green)" : i === active ? "var(--navy)" : "var(--border2)", color: i <= active ? "#fff" : "var(--ink3)" }, key: "dot" }, i < active ? "V" : i === active ? "O" : i + 1),
            el("span", { style: { fontSize: 14, color: i <= active ? "var(--ink)" : "var(--ink3)" }, key: "t" }, s)
          ]);
        })
      )
    ])
  ]);
}

function EmailCapture(props) {
  var onContinue = props.onContinue;
  var mode = props.mode;
  var toggleMode = props.toggleMode;
  var arr1 = useState("");
  var email = arr1[0];
  var setEmail = arr1[1];
  var arr2 = useState("");
  var name = arr2[0];
  var setName = arr2[1];
  var arr3 = useState(false);
  var done = arr3[0];
  var setDone = arr3[1];
  function submit() {
    if (!email.includes("@")) return;
    setDone(true);
    setTimeout(function() { onContinue(email, name); }, 1800);
  }
  var lS = { display: "block", fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 8, textAlign: "left" };
  return el("div", { style: { fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 } }, [
    el("div", { style: { position: "absolute", top: 14, right: 20 }, key: "tog" }, el(ThemeToggle, { mode: mode, toggle: toggleMode })),
    el("div", { style: { maxWidth: 500, width: "100%" }, key: "wrap" }, [
      el("div", { style: { textAlign: "center", marginBottom: 22 }, key: "logo" }, el(Logo, { size: "md" })),
      el(Card, { style: { padding: "48px 40px", textAlign: "center" }, key: "card" }, [
        el("div", { style: { width: 66, height: 66, background: "var(--greenL)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "var(--green)", margin: "0 auto 22px" }, key: "icon" }, "OK"),
        el("div", { style: { display: "inline-block", background: "var(--greenL)", color: "var(--green)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, marginBottom: 18 }, key: "badge" }, "Your Analysis Is Ready"),
        el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 12, letterSpacing: "-.03em" }, key: "h" }, "Where Should We Send Your Results?"),
        el("p", { style: { color: "var(--ink3)", fontSize: 15, lineHeight: 1.78, marginBottom: 26 }, key: "p" }, "Enter your email and we will send your complete advocacy package directly to your inbox so you can access it anytime from any device forever."),
        done ? el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 14, padding: "26px 22px" }, key: "done" }, [
          el("div", { style: { fontWeight: 900, color: "var(--green)", fontSize: 18, marginBottom: 7 }, key: "dt" }, "On its way to your inbox!"),
          el("div", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }, key: "ds" }, "Taking you to your results now.")
        ]) : el("div", { key: "form" }, [
          el("label", { style: lS, key: "ln" }, "Your First Name (optional)"),
          el("input", { placeholder: "e.g. Margaret", value: name, onChange: function(e) { setName(e.target.value); }, key: "in" }),
          el("label", { style: lS, key: "le" }, "Your Email Address *"),
          el("input", { type: "email", placeholder: "e.g. myemail@gmail.com", value: email, onChange: function(e) { setEmail(e.target.value); }, onKeyDown: function(e) { if (e.key === "Enter") submit(); }, key: "ie" }),
          el(GreenBtn, { onClick: submit, disabled: !email.includes("@"), full: true, style: { fontSize: 17, borderRadius: 12, marginBottom: 12 }, key: "btn" }, "Send My Results to My Inbox"),
          el("div", { style: { fontSize: 13, color: "var(--ink3)", lineHeight: 1.7, marginBottom: 16 }, key: "note" }, "No spam. Unsubscribe anytime. We will also send free weekly billing protection tips."),
          el("button", { onClick: function() { onContinue("", ""); }, style: { background: "none", border: "none", color: "var(--ink3)", fontSize: 13, cursor: "pointer", textDecoration: "underline", fontFamily: "'Inter',sans-serif" }, key: "skip" }, "Skip - show my results on screen only")
        ])
      ])
    ])
  ]);
}

function Results(props) {
  var results = props.results;
  var userEmail = props.userEmail;
  var userName = props.userName;
  var onReset = props.onReset;
  var mode = props.mode;
  var toggleMode = props.toggleMode;
  var arr1 = useState(false); var unlocked = arr1[0]; var setUnlocked = arr1[1];
  var arr2 = useState("letter"); var tab = arr2[0]; var setTab = arr2[1];
  var arr3 = useState(""); var feedback = arr3[0]; var setFeedback = arr3[1];
  var arr4 = useState(false); var feedbackSent = arr4[0]; var setFeedbackSent = arr4[1];
  var arr5 = useState(null); var copied = arr5[0]; var setCopied = arr5[1];
  var arr6 = useState(false); var showShare = arr6[0]; var setShowShare = arr6[1];
  var arr7 = useState(false); var familyAdded = arr7[0]; var setFamilyAdded = arr7[1];

  if (!results) return null;
  var summary = results.summary;
  var disputeLetter = results.disputeLetter;
  var phoneScript = results.phoneScript;
  var actionPlan = results.actionPlan;
  var yourRights = results.yourRights;
  var rColor = summary.riskLevel === "HIGH" ? "var(--red)" : "var(--gold)";
  var rBg = summary.riskLevel === "HIGH" ? "var(--redL)" : "var(--goldL)";

  function cp(text, id) {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(function() { setCopied(null); }, 2500);
  }

  return el("div", { style: { fontFamily: "'Inter',sans-serif", background: "var(--bg)", minHeight: "100vh" } }, [
    showShare ? el(ShareModal, { onClose: function() { setShowShare(false); }, key: "modal" }) : null,
    el("div", { style: { background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "13px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, position: "sticky", top: 0, zIndex: 100 }, key: "hdr" }, [
      el("div", { style: { display: "flex", alignItems: "center", gap: 12 }, key: "hl" }, [
        el(Logo, { size: "sm", key: "logo" }),
        el("span", { style: { background: "var(--greenL)", color: "var(--green)", borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700 }, key: "badge" }, "Analysis Complete")
      ]),
      el("div", { style: { display: "flex", gap: 8 }, key: "hr" }, [
        el(ThemeToggle, { mode: mode, toggle: toggleMode, key: "tog" }),
        el(ShareBtn, { onClick: function() { setShowShare(true); }, style: { padding: "8px 14px", fontSize: 12, borderRadius: 10 }, key: "sh" }, "Share"),
        el("button", { onClick: onReset, style: { background: "var(--navyL)", color: "var(--navy)", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }, key: "new" }, "New Analysis")
      ])
    ]),
    el("div", { style: { maxWidth: 720, margin: "0 auto", padding: "36px 18px" }, key: "body" }, [
      userName ? el("p", { style: { fontFamily: "'Lora',serif", fontSize: 20, color: "var(--navy)", fontStyle: "italic", textAlign: "center", marginBottom: 22 }, key: "uname" }, userName + ", here is what your advocate found on your bill.") : null,
      el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "10px 16px", marginBottom: 18, display: "flex", gap: 8, alignItems: "center" }, key: "freebadge" }, [
        el("span", { style: { color: "var(--green)", fontSize: 16 }, key: "icon" }, "OK"),
        el("span", { style: { fontSize: 13, color: "var(--green)", fontWeight: 700 }, key: "txt" }, "FREE REVIEW - No payment required for this section")
      ]),
      el(Card, { style: { marginBottom: 18, overflow: "hidden" }, key: "sumcard" }, [
        el("div", { style: { background: "var(--navy)", padding: "18px 22px" }, key: "sumhd" }, [
          el("div", { style: { fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.5)", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 7 }, key: "sl" }, "Your Advocate Assessment"),
          el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 16, color: "#fff", lineHeight: 1.65, fontWeight: 500 }, key: "sf" }, summary.keyFindings)
        ]),
        el("div", { style: { padding: "20px 22px" }, key: "sumbody" }, [
          el("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }, key: "sumgrid" }, [
            el("div", { style: { background: rBg, border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }, key: "risk" }, [
              el("div", { style: { fontSize: 10, fontWeight: 700, color: rColor, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }, key: "rl" }, "Risk Level"),
              el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: rColor, letterSpacing: "-.03em" }, key: "rv" }, summary.riskLevel)
            ]),
            el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }, key: "sav" }, [
              el("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }, key: "sl" }, "Potential Savings"),
              el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--green)", letterSpacing: "-.02em" }, key: "sv" }, "$" + summary.estimatedSavingsMin + " to $" + summary.estimatedSavingsMax)
            ]),
            el("div", { style: { background: "var(--navyL)", border: "1px solid rgba(0,0,0,.05)", borderRadius: 12, padding: "14px", textAlign: "center" }, key: "iss" }, [
              el("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 5 }, key: "il" }, "Issues Found"),
              el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--navy)", letterSpacing: "-.03em" }, key: "iv" }, summary.errorsFound ? summary.errorsFound.length : 3)
            ])
          ]),
          el("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }, key: "errlbl" }, "Billing Concerns Identified"),
          summary.errorsFound ? summary.errorsFound.map(function(e, i) {
            return el("div", { key: i, style: { display: "flex", gap: 10, padding: "11px 0", borderBottom: i < summary.errorsFound.length - 1 ? "1px solid var(--border)" : "none", alignItems: "flex-start" } }, [
              el("div", { style: { width: 22, height: 22, background: "var(--redL)", border: "1px solid rgba(181,48,32,.18)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 11, fontWeight: 800, color: "var(--red)" }, key: "n" }, i + 1),
              el("span", { style: { color: "var(--ink2)", lineHeight: 1.7, fontSize: 15 }, key: "t" }, e)
            ]);
          }) : null
        ])
      ]),
      el(Card, { style: { padding: "20px 22px", marginBottom: 24 }, key: "rights" }, [
        el("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }, key: "rl" }, "Your Legal Rights as a Patient"),
        yourRights ? yourRights.map(function(r, i) {
          var parts = r.split(":");
          var title = parts[0];
          var rest = parts.slice(1).join(":").trim();
          return el("div", { key: i, style: { display: "flex", gap: 10, marginBottom: 12, alignItems: "flex-start" } }, [
            el("span", { style: { color: "var(--green)", fontSize: 16, flexShrink: 0, lineHeight: 1.5, fontWeight: 700 }, key: "v" }, "V"),
            el("div", { key: "d" }, [
              el("div", { style: { fontWeight: 700, color: "var(--ink)", fontSize: 15, marginBottom: 2 }, key: "t" }, title),
              rest ? el("div", { style: { color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }, key: "r" }, rest) : null
            ])
          ]);
        }) : null,
        el("div", { style: { marginTop: 14, padding: "10px 14px", background: "var(--navyL)", borderRadius: 10, fontSize: 11, color: "var(--ink3)", lineHeight: 1.65 }, key: "rsrc" },
          "Sources 2023-2025: Harvard Medical School - Mayo Clinic Proceedings - Johns Hopkins Medicine - U.S. CFPB - Commonwealth Fund - AARP - cited for educational reference only"
        )
      ]),
      !unlocked ? el(Card, { style: { padding: "40px 32px", textAlign: "center", borderTop: "3px solid var(--navy)", marginBottom: 28 }, key: "paywall" }, [
        el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 24, fontWeight: 900, color: "var(--ink)", marginBottom: 12, letterSpacing: "-.03em" }, key: "ph" }, "Get Your Complete Advocacy Package"),
        el("p", { style: { color: "var(--ink3)", fontSize: 15, maxWidth: 420, margin: "0 auto 10px", lineHeight: 1.75 }, key: "pp" }, "Your letter is written. Your script is ready. All you do is send one email."),
        el("p", { style: { color: "var(--ink3)", fontSize: 14, maxWidth: 420, margin: "0 auto 22px", lineHeight: 1.7 }, key: "pp2" }, "Others charge $200 or more and take weeks. We charge $97 flat - one time, forever."),
        el("div", { style: { background: "rgba(212,98,10,.07)", border: "1px solid rgba(212,98,10,.2)", borderRadius: 12, padding: "13px 17px", marginBottom: 20, display: "flex", gap: 11, alignItems: "center", textAlign: "left" }, key: "fambox" }, [
          el("div", { style: { flex: 1 }, key: "famd" }, [
            el("div", { style: { fontWeight: 700, color: "var(--ink)", fontSize: 14, marginBottom: 2 }, key: "famt" }, "Need help from a family member?"),
            el("div", { style: { color: "var(--ink3)", fontSize: 13 }, key: "fams" }, "Your son, daughter, or grandchild can complete this for you in minutes.")
          ]),
          el(ShareBtn, { onClick: function() { setShowShare(true); }, style: { padding: "9px 14px", fontSize: 12, borderRadius: 10, whiteSpace: "nowrap", flexShrink: 0 }, key: "famsh" }, "Share")
        ]),
        el("div", { style: { background: "var(--goldL)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 14, padding: "16px 20px", marginBottom: 22 }, key: "cdbox" }, [
          el("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }, key: "cdl" }, "Price Rises June 15 - Time Remaining:"),
          el(Countdown, { key: "cd" }),
          el("div", { style: { marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }, key: "prices" }, [
            el("span", { style: { fontSize: 16, color: "var(--ink3)", textDecoration: "line-through" }, key: "old" }, "$197"),
            el("span", { style: { fontFamily: "'Inter',sans-serif", fontSize: 36, fontWeight: 900, color: "var(--green)", letterSpacing: "-.04em" }, key: "new" }, "$97"),
            el("span", { style: { fontSize: 13, color: "var(--green)", fontWeight: 700 }, key: "save" }, "Save $100")
          ])
        ]),
        el("a", { href: "https://gumroad.com/YOUR_LINK", target: "_blank", rel: "noopener noreferrer", style: { display: "block", background: "linear-gradient(135deg,#16A04A,#147A45)", color: "#fff", textDecoration: "none", borderRadius: 14, padding: "18px 32px", fontSize: 19, fontWeight: 800, marginBottom: 10, boxShadow: "0 8px 28px rgba(20,122,69,.45)", maxWidth: 420, margin: "0 auto 10px", letterSpacing: "-.02em", fontFamily: "'Inter',sans-serif" }, key: "buylink" }, "Unlock My Complete Package - $97"),
        el("div", { style: { fontSize: 12, color: "var(--ink3)", marginTop: 10 }, key: "final" }, "Instant access - Sent to your email - All sales are final due to instant digital delivery"),
        el("div", { style: { marginTop: 20 }, key: "demo" }, el("button", { onClick: function() { setUnlocked(true); }, style: { background: "none", border: "1px dashed var(--border2)", borderRadius: 8, padding: "7px 14px", color: "var(--ink3)", cursor: "pointer", fontSize: 12, fontFamily: "'Inter',sans-serif" } }, "Preview full results demo"))
      ]) : el("div", { style: { marginBottom: 28 }, key: "unlocked" }, [
        el("div", { style: { display: "flex", gap: 4, marginBottom: 20, background: "var(--surface2)", padding: "6px", borderRadius: 14, border: "1px solid var(--border)" }, key: "tabs" },
          [["letter","Dispute Letter"],["script","Phone Script"],["action","Action Plan"],["rights","Your Rights"]].map(function(item) {
            return el("button", { key: item[0], onClick: function() { setTab(item[0]); }, style: { flex: 1, padding: "10px 8px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 700, background: tab === item[0] ? "var(--navy)" : "transparent", color: tab === item[0] ? "#fff" : "var(--ink3)", transition: "all .15s" } }, item[1]);
          })
        ),
        tab === "letter" ? el(Card, { style: { overflow: "hidden" }, key: "ltab" }, [
          el("div", { style: { background: "var(--navy)", padding: "16px 22px" }, key: "lhd" }, [
            el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" }, key: "lt" }, "Step 1 - Send Your Dispute Letter"),
            el("div", { style: { fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }, key: "ls" }, "Print and mail or copy and paste into an email")
          ]),
          el("div", { style: { padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }, key: "lbar" }, [
            el("span", { style: { fontSize: 14, color: "var(--ink3)" }, key: "ll" }, "Your Personalized Dispute Letter"),
            el("button", { onClick: function() { cp(disputeLetter, "letter"); }, style: { background: "var(--green)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }, key: "lcopy" }, copied === "letter" ? "Copied!" : "Copy Letter")
          ]),
          el("div", { style: { padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", background: "var(--surface)", fontFamily: "Georgia,'Times New Roman',serif", maxHeight: 460, overflowY: "auto" }, key: "ltxt" }, disputeLetter)
        ]) : null,
        tab === "script" ? el(Card, { style: { overflow: "hidden" }, key: "stab" }, [
          el("div", { style: { background: "#1A4A6B", padding: "16px 22px" }, key: "shd" }, [
            el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "#fff" }, key: "st" }, "Step 2 - Call the Billing Department"),
            el("div", { style: { fontSize: 12, color: "rgba(255,255,255,.55)", marginTop: 2 }, key: "ss" }, "Read this word for word - no memorizing needed")
          ]),
          el("div", { style: { padding: "12px 22px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }, key: "sbar" }, [
            el("span", { style: { fontSize: 14, color: "var(--ink3)" }, key: "sl" }, "Your Phone Script - Read During Your Call"),
            el("button", { onClick: function() { cp(phoneScript, "script"); }, style: { background: "#1A4A6B", color: "#fff", border: "none", borderRadius: 9, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Inter',sans-serif" }, key: "scopy" }, copied === "script" ? "Copied!" : "Copy Script")
          ]),
          el("div", { style: { padding: "24px 28px", whiteSpace: "pre-wrap", lineHeight: 2, fontSize: 15, color: "var(--ink2)", maxHeight: 460, overflowY: "auto" }, key: "stxt" }, phoneScript)
        ]) : null,
        tab === "action" && actionPlan ? el(Card, { style: { padding: "24px 22px" }, key: "atab" }, [
          el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)", marginBottom: 20 }, key: "ah" }, "Step 3 - Your Action Plan"),
          actionPlan.map(function(item, i) {
            return el("div", { key: i, style: { display: "flex", gap: 14, marginBottom: 20, alignItems: "flex-start" } }, [
              el("div", { style: { width: 42, height: 42, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontWeight: 800, fontSize: 16 }, key: "an" }, item.step),
              el("div", { style: { flex: 1, background: "var(--navyL)", border: "1px solid var(--border)", borderRadius: 14, padding: "18px 20px" }, key: "ac" }, [
                el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, flexWrap: "wrap", gap: 8 }, key: "atop" }, [
                  el("h3", { style: { fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 800, color: "var(--ink)" }, key: "at" }, item.title),
                  el("span", { style: { background: "var(--goldL)", color: "var(--gold)", border: "1px solid rgba(138,92,0,.18)", borderRadius: 20, padding: "3px 11px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }, key: "atf" }, item.timeframe)
                ]),
                el("p", { style: { color: "var(--ink2)", lineHeight: 1.7, fontSize: 14, marginBottom: 12 }, key: "ad" }, item.description),
                el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.18)", borderRadius: 10, padding: "10px 14px" }, key: "atip" }, [
                  el("div", { style: { fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 2 }, key: "atl" }, "Expert Tip"),
                  el("div", { style: { color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }, key: "att" }, item.powerTip)
                ])
              ])
            ]);
          })
        ]) : null,
        tab === "rights" && yourRights ? el(Card, { style: { padding: "24px 22px" }, key: "rtab" }, [
          el("h3", { style: { fontFamily: "'Inter',sans-serif", fontSize: 18, fontWeight: 900, color: "var(--navy)", marginBottom: 6 }, key: "rh" }, "Your Legal Rights as a Patient"),
          el("p", { style: { color: "var(--ink3)", fontSize: 14, marginBottom: 20, lineHeight: 1.65 }, key: "rp" }, "These federal protections apply to you right now. Know them. Use them."),
          yourRights.map(function(r, i) {
            var parts = r.split(":");
            var title = parts[0];
            var rest = parts.slice(1).join(":").trim();
            return el("div", { key: i, style: { display: "flex", gap: 12, marginBottom: 16, padding: "14px 16px", background: "var(--navyL)", borderLeft: "3px solid var(--navy)", borderRadius: "0 12px 12px 0" } }, [
              el("div", { key: "d" }, [
                el("div", { style: { fontWeight: 800, fontSize: 15, color: "var(--navy)", marginBottom: 3 }, key: "t" }, title),
                rest ? el("div", { style: { color: "var(--ink3)", fontSize: 13, lineHeight: 1.65 }, key: "r" }, rest) : null
              ])
            ]);
          }),
          el("div", { style: { marginTop: 16, padding: "12px 16px", background: "var(--navyL)", borderRadius: 10, fontSize: 11, color: "var(--ink3)", lineHeight: 1.7 }, key: "rsrc" },
            "Research Sources 2023-2025: Harvard Medical School - Mayo Clinic Proceedings - U.S. CFPB - Johns Hopkins Medicine - Commonwealth Fund - AARP - cited for educational reference only. United Patient Advocate is not affiliated with or endorsed by any institution listed."
          )
        ]) : null,
        userEmail ? el("div", { style: { background: "var(--greenL)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 14, padding: "20px 22px", marginTop: 20, display: "flex", gap: 12, alignItems: "flex-start" }, key: "emailconf" }, [
          el("div", { key: "ed" }, [
            el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 17, fontWeight: 800, color: "var(--green)", marginBottom: 5 }, key: "et" }, "Your package was also sent to your email"),
            el("div", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }, key: "es" }, "Everything was sent to " + userEmail + ". Close this page anytime - your complete advocacy package will be in your inbox forever.")
          ])
        ]) : null,
        el(Card, { style: { padding: "28px 26px", marginTop: 20 }, key: "famplan" }, [
          el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 6, textAlign: "center" }, key: "fh" }, "Protect Your Whole Family"),
          el("p", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.7, marginBottom: 22, textAlign: "center" }, key: "fp" }, "You are already protected with the Individual Plan. Here is what the Family Plan adds on top."),
          el("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }, key: "famgrid" }, [
            el("div", { style: { background: "var(--navyL)", border: "1px solid var(--border2)", borderRadius: 16, padding: "20px 16px" }, key: "ind" }, [
              el("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--navy)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }, key: "il" }, "You Already Have"),
              el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--navy)", marginBottom: 14 }, key: "it" }, "Individual Plan"),
              ["1 bill analysis","Dispute letter","Phone script","5-step action plan","Results in inbox"].map(function(t, i) {
                return el("div", { key: i, style: { display: "flex", gap: 7, marginBottom: 7 } }, [
                  el("span", { style: { color: "var(--green)", fontWeight: 700, fontSize: 13 }, key: "v" }, "V"),
                  el("span", { style: { fontSize: 13, color: "var(--ink3)" }, key: "t" }, t)
                ]);
              }),
              el("div", { style: { marginTop: 14 }, key: "ip" }, [
                el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" }, key: "io" }, "Was $197"),
                el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--navy)" }, key: "in" }, "$97 one-time")
              ])
            ]),
            el("div", { style: { background: "rgba(20,122,69,.06)", border: "1.5px solid rgba(20,122,69,.25)", borderRadius: 16, padding: "20px 16px", position: "relative" }, key: "fam" }, [
              el("div", { style: { position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "var(--green)", color: "#fff", borderRadius: 20, padding: "3px 12px", fontSize: 10, fontWeight: 800, textTransform: "uppercase", whiteSpace: "nowrap" }, key: "fb" }, "Premium Upgrade"),
              el("div", { style: { fontSize: 10, fontWeight: 700, color: "var(--green)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }, key: "fl" }, "Everything above PLUS"),
              el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 16, fontWeight: 900, color: "var(--green)", marginBottom: 14 }, key: "ft" }, "Family Plan"),
              [["Unlimited analyses - whole year",true],["Every family member covered",true],["Results saved permanently",true],["Professional PDF letterhead",false],["Monthly family billing newsletter",false]].map(function(item, i) {
                return el("div", { key: i, style: { display: "flex", gap: 7, marginBottom: 7 } }, [
                  el("span", { style: { color: "var(--green)", fontWeight: 700, fontSize: 13 }, key: "v" }, "V"),
                  el("span", { style: { fontSize: 13, color: item[1] ? "var(--ink)" : "var(--ink3)", fontWeight: item[1] ? 600 : 400 }, key: "t" }, item[0])
                ]);
              }),
              el("div", { style: { marginTop: 14 }, key: "fp" }, [
                el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 11, color: "var(--ink3)", textDecoration: "line-through" }, key: "fo" }, "Was $297 per year"),
                el("div", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--green)" }, key: "fn" }, "$147 per year")
              ])
            ])
          ]),
          !familyAdded ? el("a", { href: "https://gumroad.com/YOUR_FAMILY_LINK", target: "_blank", rel: "noopener noreferrer", onClick: function() { setFamilyAdded(true); }, style: { display: "block", background: "var(--navy)", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "15px 24px", fontSize: 16, fontWeight: 800, textAlign: "center", fontFamily: "'Inter',sans-serif" }, key: "famlink" }, "Add Family Protection Plan - $147 per year") : el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 10, padding: "14px 18px", textAlign: "center" }, key: "famdone" }, el("div", { style: { fontWeight: 800, color: "var(--green)", fontSize: 15 } }, "Family Plan added! Check your email for access details.")),
          el("div", { style: { marginTop: 12, textAlign: "center", fontSize: 12, color: "var(--ink3)" }, key: "famnote" }, "No confusion. No double charging. The Individual Plan is yours - this adds unlimited family coverage on top. All sales are final due to instant digital delivery.")
        ])
      ]),
      el(Card, { style: { padding: "32px 26px", textAlign: "center", borderTop: "3px solid var(--green)" }, key: "feedback" }, [
        el("h2", { style: { fontFamily: "'Inter',sans-serif", fontSize: 20, fontWeight: 900, color: "var(--ink)", marginBottom: 8 }, key: "fbh" }, "Help Us Serve More Americans Like You"),
        el("p", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.75, marginBottom: 20, maxWidth: 420, margin: "0 auto 20px" }, key: "fbp" }, "Your feedback shapes what we build next for every American patient who needs an advocate."),
        !feedbackSent ? el("div", { key: "fbform" }, [
          el("textarea", { value: feedback, onChange: function(e) { setFeedback(e.target.value); }, placeholder: "Any idea, big or small. What else do you need?", style: { minHeight: 90, resize: "vertical", textAlign: "left", marginBottom: 14 }, key: "fbtxt" }),
          el(GreenBtn, { onClick: function() { if (feedback.trim()) { setFeedbackSent(true); } }, disabled: !feedback.trim(), style: { maxWidth: 320, margin: "0 auto", fontSize: 15, borderRadius: 10, padding: "14px 28px" }, key: "fbbtn" }, "Share My Feedback")
        ]) : el("div", { style: { background: "var(--greenL)", border: "1px solid rgba(20,122,69,.2)", borderRadius: 14, padding: "24px" }, key: "fbdone" }, [
          el("div", { style: { fontWeight: 900, color: "var(--green)", fontSize: 17, marginBottom: 6 }, key: "fbt" }, "Thank you genuinely."),
          el("div", { style: { color: "var(--ink3)", fontSize: 14, lineHeight: 1.7 }, key: "fbs" }, "Your feedback shapes what we build next for every American patient who needs an advocate in their corner.")
        ])
      ])
    ]),
    el("div", { style: { background: "var(--surface)", padding: "14px 24px", textAlign: "center", fontSize: 11, color: "var(--ink3)", borderTop: "1px solid var(--border)", lineHeight: 1.8 }, key: "footer" },
      "United Patient Advocate provides educational information only. Not legal or medical advice. Results are informational. Individual outcomes vary. Due to the instant delivery of personalized digital content, all sales are final. All institutions cited for informational reference only. Not affiliated with or endorsed by any institution referenced. 2026 United Patient Advocate unitedpatientadvocate.com"
    )
  ]);
}

export default function App() {
  var themeData = useTheme();
  var mode = themeData.mode;
  var toggle = themeData.toggle;
  var arr1 = useState("landing"); var screen = arr1[0]; var setScreen = arr1[1];
  var arr2 = useState(1); var step = arr2[0]; var setStep = arr2[1];
  var arr3 = useState({ providerName: "", totalBilled: "", amountOwed: "", hasInsurance: true, insuranceType: "medicare", visitReason: "", servicesReceived: "", stayDuration: "outpatient", specificConcerns: "", billStatus: "unpaid" });
  var form = arr3[0]; var setForm = arr3[1];
  var arr4 = useState(null); var results = arr4[0]; var setResults = arr4[1];
  var arr5 = useState(""); var userEmail = arr5[0]; var setUserEmail = arr5[1];
  var arr6 = useState(""); var userName = arr6[0]; var setUserName = arr6[1];

  function update(f, v) { setForm(function(p) { return Object.assign({}, p, { [f]: v }); }); }

  async function analyze() {
    setScreen("analyzing");
    var prompt = "You are the AI engine behind United Patient Advocate. Analyze this bill and return ONLY valid JSON with no markdown.\n\nPatient: Provider=\"" + (form.providerName || "Hospital") + "\", Total=$" + form.totalBilled + ", Owes=$" + (form.amountOwed || form.totalBilled) + ", Insurance=" + (form.hasInsurance ? form.insuranceType : "none") + ", Visit=\"" + form.visitReason + "\", Services=\"" + form.servicesReceived + "\", Type=" + form.stayDuration + ", Status=" + form.billStatus + ", Concerns=\"" + (form.specificConcerns || "bill seems too high") + "\"\n\nReturn this JSON:\n{\"summary\":{\"riskLevel\":\"HIGH\",\"estimatedSavingsMin\":\"500\",\"estimatedSavingsMax\":\"2400\",\"errorsFound\":[\"Specific billing concern based on their visit type and insurance\",\"Second specific concern about their charges or services\",\"Third area worth investigating\"],\"keyFindings\":\"2-3 warm empowering sentences. Reference that 2024 JAMA Health Forum research confirms 74 percent who dispute get mistakes corrected.\"},\"disputeLetter\":\"[Your Full Name]\\n[Street Address]\\n[City State ZIP]\\n[Phone Number]\\n[Email Address]\\n\\n[Today Date]\\n\\nBilling Department\\n" + (form.providerName || "Medical Provider") + "\\nAttn: Patient Billing Review Team\\n\\nRe: Formal Billing Review Request\\nAccount Number: [ACCOUNT NUMBER on your bill]\\nDate of Service: [Date]\\nAmount Under Review: $" + (form.amountOwed || form.totalBilled) + "\\n\\nDear Billing Review Team\\n\\nI am writing on behalf of United Patient Advocate to formally request a complete audit of the charges on the above account before any payment is made.\\n\\n[Continue with 380 words: cite No Surprises Act 2022 itemized billing rights ACA transparency. Request complete itemized statement with CPT codes. State no payment until review complete. Set 30-day deadline. Reference CFPB complaint if unresolved. Professional firm tone.]\\n\\nRespectfully submitted\\n\\n[Patient Printed Name]\\n\\nUnited Patient Advocate unitedpatientadvocate.com\",\"phoneScript\":\"UNITED PATIENT ADVOCATE PHONE SCRIPT\\nKEEP THIS BY THE PHONE\\n\\nBEST TIME: Tuesday through Thursday 9 AM to 11 AM\\n\\nWHEN THEY ANSWER:\\nHello. My name is [Your Name] account number [Account Number]. I am calling with United Patient Advocate regarding a formal billing review. I need to speak with a billing supervisor please.\\n\\n[Continue 320 words covering supervisor handling No Surprises Act invocation itemized bill request 501r financial assistance by name settlement negotiation call documentation. Simple language for seniors.]\",\"actionPlan\":[{\"step\":1,\"title\":\"Request Your Itemized Bill Today\",\"description\":\"Call billing and ask for a complete itemized bill with every charge and CPT code. Legal right before any payment.\",\"timeframe\":\"TODAY\",\"powerTip\":\"Say: I am requesting a complete itemized statement as is my right under federal billing transparency regulations.\"},{\"step\":2,\"title\":\"Compare Bill to Insurance Payment\",\"description\":\"Call your insurer for the Explanation of Benefits. Compare line by line. 45 percent of insured Americans received unexpected bills per Commonwealth Fund 2024.\",\"timeframe\":\"Within 2 Days\",\"powerTip\":\"Ask: Was this claim processed at in-network or out-of-network rates? A wrong classification alone can add thousands.\"},{\"step\":3,\"title\":\"Mail Your Dispute Letter via Certified Mail\",\"description\":\"Print sign and mail via USPS Certified Mail. Keep the yellow receipt. Creates legal paper trail and pauses collections.\",\"timeframe\":\"Within 1 Week\",\"powerTip\":\"The yellow receipt is your legal proof of delivery. It protects your credit report during the dispute period.\"},{\"step\":4,\"title\":\"Apply for Financial Assistance\",\"description\":\"All nonprofit hospitals must offer charity care under IRS 501r. Many qualify even with insurance.\",\"timeframe\":\"Within 2 Weeks\",\"powerTip\":\"Ask for the 501r financial assistance application by name. Most billing staff will not volunteer this unless you ask.\"},{\"step\":5,\"title\":\"File Federal Complaint If Unresolved\",\"description\":\"File free at consumerfinance.gov or call 1-855-411-2372 after 30 days. CFPB complaints resolve most disputes within 10 to 14 days.\",\"timeframe\":\"Day 30\",\"powerTip\":\"Federal complaints trigger dedicated hospital resolution teams. Free to file. No lawyer needed.\"}],\"yourRights\":[\"Right to an Itemized Bill: Federal law requires hospitals to provide a complete itemized statement before you are required to pay anything\",\"No Surprises Act 2022: You cannot be billed above in-network rates for emergency care at any facility including out-of-network hospitals\",\"Right to Appeal Insurance Denials: Legal right to appeal any denial internally then through binding independent external review at no cost\",\"Charity Care IRS 501r: All nonprofit hospitals receiving federal funds must offer financial assistance programs and screen patients upon request\",\"Credit Protection CFPB 2025: Strengthened rules - medical debt under $500 cannot appear on credit reports and all debt needs 365 days before reporting\"]}";
    try {
      var res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 4000, messages: [{ role: "user", content: prompt }] })
      });
      var data = await res.json();
      var raw = data.content ? data.content.map(function(c) { return c.text || ""; }).join("") : "";
      var cleaned = raw.replace(/json/g, "").replace(/fence/g, "").trim();
      if (cleaned.charAt(0) !== "{") { cleaned = cleaned.substring(cleaned.indexOf("{")); }
      var parsed = JSON.parse(cleaned);
      setResults(parsed);
      setScreen("email");
    } catch(err) {
      console.error("Analysis error:", err);
      setScreen("form");
    }
  }

  var shared = { mode: mode, toggleMode: toggle };
  if (screen === "landing") return el(Landing, Object.assign({ onStart: function() { setScreen("form"); } }, shared));
  if (screen === "analyzing") return el(Analyzing, shared);
  if (screen === "email") return el(EmailCapture, Object.assign({ onContinue: function(email, name) { setUserEmail(email); setUserName(name); setScreen("results"); } }, shared));
  if (screen === "results") return el(Results, Object.assign({ results: results, userEmail: userEmail, userName: userName, formData: form, onReset: function() { setScreen("landing"); setResults(null); setStep(1); setUserEmail(""); setUserName(""); } }, shared));
  return el(Form, Object.assign({ step: step, setStep: setStep, form: form, update: update, onSubmit: analyze }, shared));
}
