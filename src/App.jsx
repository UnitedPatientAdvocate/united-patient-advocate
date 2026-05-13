import { useState, useEffect, useRef, useCallback } from "react";
import BillingEducation from "./BillingEducation.jsx";
import { AnnotatedParagraph } from "./TermTooltip.jsx";

// ─── LOGO ────────────────────────────────────────────────────────────────────
const LOGO_B64 = "/Transparent.png"; // served from public folder
const LOGO_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MCA5NiI+PHBhdGggZD0iTTQwIDQgNzIgMTZ2MjRjMCAyNC0xNCA0MC0zMiA1MkMyMiA4MCA4IDY0IDggNDBWMTZMNDAgNFoiIGZpbGw9IiNGNEYxRUEiIHN0cm9rZT0iIzFGM0E2OCIgc3Ryb2tlLXdpZHRoPSI1Ii8+PHBhdGggZD0iTTI3IDMxdjIzYzAgOCA2IDE0IDEzIDE0czEzLTYgMTMtMTRWMzEiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFGM0E2OCIgc3Ryb2tlLXdpZHRoPSI2IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNDAgMjF2MzgiIHN0cm9rZT0iIzFBN0E4QyIgc3Ryb2tlLXdpZHRoPSI1IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJNNTQgMjRjNSA4IDUgMjAgMCAyOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjQzlBMjRBIiBzdHJva2Utd2lkdGg9IjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvc3ZnPg==";
const GUMROAD  = "https://upadvocate.gumroad.com/l/busfn?wanted=true";
const ANALYZE_MODES = {
  publicAnalyze: { generationMode: "free_preview" },
  paidSuccess: { generationMode: "paid_dossier" }
};
const FREE_PREVIEW_MODE = ANALYZE_MODES.publicAnalyze.generationMode;
const PAID_REVIEW_MODE = ANALYZE_MODES.paidSuccess.generationMode;
const CHECKOUT_SESSION_KEY = "upa.checkout.session.v2";
function normalizeGeneratedPayload(data, generationMode) {
  const raw = data?.content ? data.content.map(c=>c.text||"").join("") : "";
  const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
  if (s===-1 || e===-1) throw new Error("No JSON");

  const parsed = JSON.parse(raw.substring(s, e+1));
  return {
    generationMode: parsed.generationMode || data.generationMode || generationMode,
    summary: parsed.summary || {},
    preview: parsed.preview || {},
    paidDossier: parsed.paidDossier || null,
    disputeLetter: parsed.disputeLetter || "",
    phoneScript: parsed.phoneScript || "",
    actionPlan: parsed.actionPlan || parsed.paidDossier?.thirtyDayActionPlan || [],
    yourRights: parsed.yourRights || []
  };
}

async function fetchGeneration(generationMode, intake) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      generationMode,
      intake
    })
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("Analysis API error:", data);
    throw new Error("API " + res.status);
  }
  return normalizeGeneratedPayload(data, generationMode);
}

function readCheckoutSession() {
  try {
    const raw = localStorage.getItem(CHECKOUT_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Checkout session read failed:", error);
    return null;
  }
}

function writeCheckoutSession(session) {
  try {
    localStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error("Checkout session save failed:", error);
  }
}

function buildPaidDossierText(results) {
  const dossier = results?.paidDossier || {};
  const lines = [
    "United Patient Advocate - Complete Billing Review",
    "",
    dossier.executiveOverview || results?.summary?.keyFindings || ""
  ];

  const pushList = (title, items) => {
    if (!items?.length) return;
    lines.push("", title);
    items.forEach(item => lines.push(`- ${item}`));
  };

  pushList("Billing Pattern Analysis", dossier.billingPatternAnalysis);
  pushList("Provider-Specific Observations", dossier.providerSpecificObservations);
  pushList("Negotiation Context", dossier.negotiationContext);
  pushList("Escalation Hierarchy", dossier.escalationHierarchy);
  pushList("Financial Assistance Context", dossier.financialAssistanceContext);
  pushList("Communication Guidance", dossier.communicationGuidance);

  if (dossier.recoveryProbability) {
    lines.push("", "Recovery Probability", `${dossier.recoveryProbability.label || ""}: ${dossier.recoveryProbability.rationale || ""}`.trim());
  }

  if (results?.actionPlan?.length) {
    lines.push("", "30-Day Action Plan");
    results.actionPlan.forEach(step => lines.push(`${step.step}. ${step.title} (${step.timeframe}) - ${step.description}`));
  }

  if (results?.disputeLetter) lines.push("", "Dispute Letter", results.disputeLetter);
  if (results?.phoneScript) lines.push("", "Call Script", results.phoneScript);
  pushList("Rights Brief", results?.yourRights);

  return lines.filter(Boolean).join("\n");
}

// ─── FONTS — injected immediately at module load (fixes race condition) ───────
(function injectFonts() {
  if (document.getElementById("upa-fonts")) return;
  const link = document.createElement("link");
  link.id   = "upa-fonts";
  link.rel  = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap";
  document.head.prepend(link);
})();

// ─── LANDING PAGE CSS ─────────────────────────────────────────────────────────
const LANDING_CSS = `

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 18px; scroll-behavior: smooth; }
:root {
  /* ── REFINED PALETTE — premium healthcare-financial ── */

  /* Page surfaces */
  --cream:  #F2F5F9;   /* page bg — refined blue-grey white */
  --warm:   #E8EDF5;   /* section alt — deeper cool wash */
  --stone:  #CBD5E1;   /* borders — slate */

  /* Typography */
  --ink:    #1E293B;   /* headings — deep slate navy */
  --ink2:   #475569;   /* body — refined slate */
  --ink3:   #64748B;   /* secondary */
  --ink4:   #94A3B8;   /* metadata */

  /* Brand — refined tones from reference image */
  --navy:   #1F3A68;   /* primary navy — refined deeper blue */
  --navyL:  #EBF0FA;   /* navy tint surface */
  --green:  #2F7A4F;   /* primary green — richer, less bright */
  --greenL: #E8F5EE;   /* green tint surface */
  --green2: #276644;   /* green hover */
  --teal:   #1A7A8C;   /* teal accent */
  --tealL:  #E0F4F8;
  --amber:  #92400E;
  --amberL: #FFF8EC;
  --red:    #C0392B;   /* red — more premium, less harsh */
  --redL:   #FEF2F0;
  --crimson: #8B1A1A;

  --border: rgba(30,41,59,0.10);
  --shadow-sm: 0 1px 3px rgba(30,41,59,0.06), 0 4px 12px rgba(30,41,59,0.05);
  --shadow-md: 0 2px 8px rgba(30,41,59,0.08), 0 8px 28px rgba(30,41,59,0.08);
  --shadow-lg: 0 4px 16px rgba(30,41,59,0.1), 0 16px 40px rgba(30,41,59,0.1);
}
body {
  transition: background-color 0.35s ease, color 0.35s ease;
  font-family: 'DM Sans', system-ui, sans-serif;
  background: var(--cream);
  color: var(--ink);
  -webkit-font-smoothing: antialiased;
}

/* ── URGENCY ── */
.urgency {
  background: #7C2D12;
  color: #fff;
  text-align: center;
  padding: 11px 20px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.015em;
}
.urgency em { font-style: normal; color: #FCA5A5; }

/* ── NAV ── */
nav {
  background: rgba(250,250,247,0.96);
  border-bottom: 1px solid var(--border);
  padding: 6px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 200;
  backdrop-filter: blur(16px);
}
.nav-brand { display: flex; align-items: center; gap: 10px; }
.nav-shield {
  width: 34px; height: 34px;
  background: var(--navy);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}
.nav-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 1.84rem;
  line-height: 1.05;
  letter-spacing: -0.02em;
  white-space: nowrap;
}
.nav-name .wn-united {
  font-weight: 900;
  color: var(--navy);
}
.nav-name .wn-patient {
  font-weight: 500;
  color: var(--teal);
}
.nav-sub {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--ink4);
  letter-spacing: 0.28em;
  text-transform: uppercase;
  margin-top: 5px;
  padding-left: 1px;
}
/* Dark mode wordmark */
.dark-mode .nav-name .wn-united { color: #fff; }
.dark-mode .nav-name .wn-patient { color: #3DBFBF; }
.dark-mode .nav-sub { color: #70758A; }
.nav-btn {
  background: var(--green); color: #fff; border: none; border-radius: 40px;
  padding: 10px 22px; font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
  font-weight: 700; cursor: pointer; transition: background 0.18s;
}
.nav-btn:hover { background: #276644; }

/* ── HERO ── */
.hero {
  padding: 76px 24px 64px;
  text-align: center;
  background: linear-gradient(160deg, #EBF1FA 0%, #E4EDF8 45%, #E6F3EC 100%);
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute;
  top: -80px; left: 50%;
  transform: translateX(-50%);
  width: 900px; height: 600px;
  background: radial-gradient(ellipse, rgba(26,53,96,0.07) 0%, rgba(22,101,52,0.04) 50%, transparent 70%);
  pointer-events: none;
}
.hero-inner { position: relative; max-width: 640px; margin: 0 auto; }
.hero-pill {
  display: inline-flex; align-items: center; gap: 7px;
  background: var(--navyL); border: 1px solid rgba(26,53,96,0.15);
  border-radius: 40px; padding: 6px 16px; margin-bottom: 28px;
  font-size: 0.7rem; font-weight: 700; color: var(--navy);
  letter-spacing: 0.1em; text-transform: uppercase;
}
.pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--teal); }
.hero h1 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(2.0rem, 5.5vw, 3.2rem);
  font-weight: 800; color: var(--ink);
  line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 20px;
}
.hero h1 em { font-style: italic; color: var(--navy); }
.hero-sub {
  font-size: clamp(1rem, 2.2vw, 1.1rem); color: var(--ink3);
  line-height: 1.75; max-width: 480px; margin: 0 auto 36px;
}
.hero-sub strong { color: var(--ink2); font-weight: 600; }
.hero-cta-wrap { display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 48px; }
.btn-hero {
  display: inline-flex; align-items: center; gap: 10px;
  background: #2F7A4F; color: #fff; border: none; border-radius: 12px;
  padding: 18px 44px; font-family: 'DM Sans', sans-serif;
  font-size: 1.05rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(47,122,79,0.3), 0 12px 32px rgba(47,122,79,0.12);
  transition: all 0.2s; letter-spacing: -0.01em;
}
.btn-hero:hover { background: #276644; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(47,122,79,0.38), 0 16px 40px rgba(47,122,79,0.14); }
.microcopy { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: center; }
.microcopy-item { font-size: 0.76rem; color: var(--ink4); font-weight: 500; display: flex; align-items: center; gap: 5px; }
.microcopy-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--stone); }
.hero-stats {
  display: flex; justify-content: center; gap: 32px; flex-wrap: wrap;
  padding-top: 32px; border-top: 1px solid var(--border);
}
.hero-stat { text-align: center; }
.hero-stat-n {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.9rem; font-weight: 800; color: var(--navy);
  letter-spacing: -0.04em; line-height: 1; margin-bottom: 5px;
}
.hero-stat-l { font-size: 0.72rem; color: var(--ink3); line-height: 1.5; }
.hero-stat-src { font-size: 0.62rem; color: var(--ink4); margin-top: 3px; }
.stat-divider { width: 1px; background: var(--stone); }

/* ── CREDIBILITY STRIP ── */
.cred-strip {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--cream);
  padding: 26px 24px;
}
.cred-inner { max-width: 640px; margin: 0 auto; text-align: center; }
.cred-label { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--ink4); margin-bottom: 20px; }
.cred-logos { display: flex; align-items: center; justify-content: center; gap: 24px; flex-wrap: wrap; }
.cred-logo {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  opacity: 0.36; filter: grayscale(100%); transition: opacity 0.2s;
}
.cred-logo:hover { opacity: 0.52; }
.cred-logo-mark {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.04em;
  text-transform: uppercase; border: 1.5px solid currentColor; text-align: center; line-height: 1.2;
}
.cred-logo-name { font-size: 0.6rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
.logo-uhc { color: #1A6EBF; }
.logo-aetna { color: #7B1FA2; }
.logo-cigna { color: #0057B7; }
.logo-bcbs { color: #003087; }
.logo-humana { color: #00833E; }
.cred-disc { font-size: 0.62rem; color: var(--ink4); margin-top: 16px; line-height: 1.6; }

/* ── SCROLL TRAP ── */
.scroll-trap { padding: 56px 24px 60px; background: var(--cream); }
.scroll-trap-inner { max-width: 520px; margin: 0 auto; text-align: center; }
.trap-step {
  display: inline-block; background: var(--navyL); color: var(--navy);
  border-radius: 40px; padding: 5px 14px;
  font-size: 0.7rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 18px;
}
.trap-q {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700; color: var(--ink); line-height: 1.2;
  letter-spacing: -0.025em; margin-bottom: 10px;
}
.trap-sub { font-size: 0.88rem; color: var(--ink3); margin-bottom: 32px; line-height: 1.65; }
.bill-options { display: flex; flex-direction: column; gap: 10px; max-width: 420px; margin: 0 auto 20px; }
.bill-option {
  display: flex; align-items: center; gap: 14px;
  padding: 17px 20px; background: #fff;
  border: 1.5px solid var(--stone); border-radius: 13px;
  cursor: pointer; transition: all 0.22s cubic-bezier(0.34,1,0.64,1);
  text-align: left; position: relative; overflow: hidden;
  opacity: 0.9;
}
.bill-option::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--navy); transform: scaleY(0); transition: transform 0.22s;
  border-radius: 0 2px 2px 0;
}
.bill-option:hover { border-color: rgba(26,53,96,0.3); transform: translateX(2px); opacity: 1; }
.bill-option:hover::before, .bill-option.selected::before { transform: scaleY(1); }
.bill-option.selected {
  border-color: var(--navy);
  background: #EBF2FF;
  transform: translateX(4px);
  opacity: 1;
  box-shadow: 0 4px 24px rgba(26,53,96,0.16), 0 1px 4px rgba(26,53,96,0.1), -3px 0 0 var(--navy);
}
.bill-radio {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--stone); flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; transition: all 0.18s;
}
.bill-option.selected .bill-radio { border-color: var(--navy); background: var(--navy); }
.bill-radio-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #fff;
  opacity: 0; transform: scale(0); transition: all 0.18s;
}
.bill-option.selected .bill-radio-dot { opacity: 1; transform: scale(1); }
.bill-range { font-size: 0.95rem; font-weight: 700; color: var(--ink); }
.bill-option.selected .bill-range { color: var(--navy); }
.bill-desc { font-size: 0.75rem; color: var(--ink4); line-height: 1.5; margin-top: 2px; }
.bill-option.selected .bill-desc { color: var(--navy); opacity: 0.7; }
.bill-complexity {
  font-size: 0.68rem; font-weight: 700; color: var(--teal);
  background: var(--tealL); border-radius: 20px; padding: 3px 10px;
  white-space: nowrap; flex-shrink: 0; opacity: 0; transition: opacity 0.18s;
}
.bill-option.selected .bill-complexity { opacity: 1; }
.trap-info {
  display: none; max-width: 420px; margin: 0 auto 20px;
  background: var(--navyL); border: 1px solid rgba(26,53,96,0.15);
  border-radius: 12px; padding: 14px 18px; text-align: left;
  align-items: flex-start; gap: 10px;
}
.trap-info.show { display: flex; }
.trap-info-text { font-size: 0.78rem; color: var(--navy); line-height: 1.65; }
.trap-info-text strong { font-weight: 700; }
.trap-continue { max-width: 420px; margin: 0 auto; display: none; }
.trap-continue.show { display: block; }
.btn-continue-trap {
  display: block; width: 100%; background: #1F3A68; color: #fff; border: none;
  border-radius: 11px; padding: 17px 28px; font-family: 'DM Sans', sans-serif;
  font-size: 0.95rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 16px rgba(26,53,96,0.2); transition: all 0.2s; margin-bottom: 10px;
}
.btn-continue-trap:hover { background: #19305A; transform: translateY(-1px); }
.trap-fine { font-size: 0.7rem; color: var(--ink4); text-align: center; line-height: 1.6; }

/* ── SECTION COMMON ── */
section { padding: 72px 24px; }
.section-inner { max-width: 680px; margin: 0 auto; }
.section-inner-wide { max-width: 760px; margin: 0 auto; }
.section-eyebrow { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; text-align: center; margin-bottom: 14px; }
.eyebrow-navy { color: var(--navy); }
.eyebrow-green { color: #2F7A4F; }
.eyebrow-teal { color: var(--teal); }
.eyebrow-amber { color: var(--amber); }
.section-h {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  font-weight: 800; color: var(--ink); text-align: center;
  line-height: 1.15; letter-spacing: -0.03em; margin-bottom: 10px;
}
.section-h em { font-style: italic; }
.em-navy { color: var(--navy); }
.em-green { color: var(--green); }
.section-sub { font-size: 0.88rem; color: var(--ink3); text-align: center; line-height: 1.7; max-width: 460px; margin: 0 auto 48px; }

/* ── ANALYSIS PREVIEW SECTION ── */
.analysis-section { background: var(--warm); }

.analysis-card {
  background: #fff;
  border: 1px solid var(--stone);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

/* Card header bar */
.analysis-card-header {
  background: var(--navy);
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}
.analysis-card-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: #E1E5EC;
  letter-spacing: 0.02em;
}
.analysis-card-meta {
  display: flex;
  gap: 8px;
}
.analysis-chip {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 6px;
  padding: 3px 9px;
}
.chip-teal { background: rgba(14,116,144,0.25); color: #67E8F9; }
.chip-amber { background: rgba(217,119,6,0.25); color: #FCD34D; }
.chip-green { background: rgba(22,163,74,0.25); color: #86EFAC; }

/* Analysis rows */
.analysis-rows { padding: 0; }

.analysis-row {
  display: grid;
  grid-template-columns: 180px 1fr auto;
  gap: 0;
  border-bottom: 1px solid var(--stone);
  align-items: stretch;
}
.analysis-row:last-child { border-bottom: none; }

.ar-label {
  padding: 14px 16px;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--ink3);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  background: #FAFAF7;
  border-right: 1px solid var(--stone);
  display: flex;
  align-items: center;
}

.ar-value {
  padding: 14px 16px;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-size: 0.82rem;
  color: var(--ink2);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

/* Blur overlay for locked rows */
.ar-value.blurred {
  filter: blur(3.5px);
  user-select: none;
  pointer-events: none;
}
.ar-value.partial-blur { position: relative; }

/* Status badge on right */
.ar-status {
  padding: 14px 14px;
  display: flex;
  align-items: center;
  border-left: 1px solid var(--stone);
}
.status-badge {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 6px;
  padding: 3px 9px;
  white-space: nowrap;
}
.status-flag { background: #FEF2F2; color: #991B1B; }
.status-review { background: var(--amberL); color: var(--amber); }
.status-ok { background: var(--greenL); color: var(--green); }
.status-locked {
  background: var(--stone);
  color: var(--ink4);
  filter: blur(2px);
}

/* Code tags */
.code-tag {
  display: inline-block;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.72rem;
  font-weight: 500;
  background: var(--navyL);
  color: var(--navy);
  border-radius: 5px;
  padding: 2px 7px;
  letter-spacing: 0.04em;
}
.code-tag.amber { background: var(--amberL); color: var(--amber); }
.code-tag.red { background: var(--redL); color: var(--red); }
.code-tag.blurred-tag { filter: blur(2.5px); user-select: none; opacity: 0.8; }

/* Lock overlay on card bottom */
.analysis-lock-overlay {
  background: linear-gradient(180deg, transparent 0%, rgba(250,250,247,0.97) 40%, var(--cream) 100%);
  margin-top: -80px;
  padding: 80px 24px 28px;
  position: relative;
  text-align: center;
}
.lock-text {
  font-size: 0.82rem;
  color: var(--ink3);
  line-height: 1.65;
  max-width: 320px;
  margin: 0 auto 16px;
}
.lock-text strong { color: var(--ink); font-weight: 700; }
.btn-unlock {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1F3A68;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 13px 28px;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s;
}
.btn-unlock:hover { background: #142848; }

/* ── WHAT WE REVIEW ── */
.review-section { background: var(--cream); }
.review-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}
.review-item {
  background: var(--warm);
  border: 1px solid var(--stone);
  border-radius: 16px;
  padding: 22px 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.review-icon {
  width: 42px; height: 42px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.review-title { font-size: 0.9rem; font-weight: 700; color: var(--ink); margin-bottom: 4px; }
.review-desc { font-size: 0.78rem; color: var(--ink3); line-height: 1.6; }

/* ── PROCESS ── */
.process-section { background: #1F3A68; padding: 72px 24px; }
.process-section .section-h { color: #fff; }
.process-section .section-sub { color: rgba(255,255,255,0.5); }
.steps-row {
  display: grid; grid-template-columns: repeat(3,1fr); gap: 0;
  max-width: 640px; margin: 0 auto; position: relative;
}
.steps-row::before {
  content: ''; position: absolute;
  top: 28px; left: calc(16.66% + 18px); right: calc(16.66% + 18px);
  height: 1px; background: rgba(255,255,255,0.12); z-index: 0;
}
.step-item { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0 14px; position: relative; z-index: 1; }
.step-num {
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
}
.step-num-inner { font-family: 'Playfair Display', Georgia, serif; font-size: 1.2rem; font-weight: 800; color: #fff; }
.step-title { font-size: 0.9rem; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 7px; }
.step-desc { font-size: 0.78rem; color: rgba(255,255,255,0.48); line-height: 1.6; }
.step-time { display: inline-block; margin-top: 9px; background: rgba(134,239,172,0.1); color: #86EFAC; border-radius: 20px; padding: 3px 10px; font-size: 0.66rem; font-weight: 700; letter-spacing: 0.06em; }

/* ── COMPARISON ── */
.comparison-section { background: var(--warm); padding: 72px 24px; }
.comp-table {
  max-width: 620px; margin: 0 auto;
  border-radius: 18px; overflow: visible;
  border: 1px solid var(--stone); background: #fff;
}
.comp-table > .comp-header {
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}
.comp-header { display: grid; grid-template-columns: 1fr 1fr 1fr; background: #1F3A68; width: 100%; }
.comp-header-cell { padding: 16px 16px; font-size: 0.66rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #D6DAE2; text-align: center; }
.comp-header-cell.ours { background: #2F7A4F; color: #fff; position: relative; padding: 16px; font-weight: 900; font-size: 0.7rem; letter-spacing: 0.1em; white-space: nowrap; box-shadow: inset 1px 0 0 rgba(255,255,255,0.15); }
/* RECOMMENDED badge moved to HTML above table */
.comp-row { display: grid; grid-template-columns: 1fr 1fr 1fr; border-top: 1px solid var(--stone); width: 100%; }
.comp-cell { padding: 16px 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 5px; }
.comp-cell.topic { align-items: flex-start; text-align: left; padding: 16px 16px 16px 18px; }
.comp-topic-title { font-size: 0.85rem; font-weight: 700; color: #1E293B; line-height: 1.3; }
.comp-topic-sub { font-size: 0.7rem; color: #94A3B8; line-height: 1.5; margin-top: 2px; }
.comp-cell-icon { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.icon-bad { background: #FEF2F0; border: 1px solid rgba(192,57,43,0.15); }
.icon-good { background: #E8F5EE; border: 1px solid rgba(47,122,79,0.18); }
.comp-cell-text { font-size: 0.76rem; font-weight: 500; color: #475569; line-height: 1.5; }
.comp-cell.our-col { background: rgba(47,122,79,0.05); box-shadow: inset 1px 0 0 rgba(47,122,79,0.18), inset -1px 0 0 rgba(47,122,79,0.18); }
.comp-cell.our-col .comp-cell-text { color: #2F7A4F; font-weight: 800; }
.comp-cta-row { display: grid; grid-template-columns: 1fr 1fr 1fr; border-top: 1px solid rgba(255,255,255,0.1); background: #1A3055; width: 100%; }
.comp-cta-cell { padding: 16px 14px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 3px; }
.verdict-label { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #676C82; }
.verdict-val-diy { font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.4); }
.comp-cta-cell.ours-verdict { background: #2F7A4F; box-shadow: inset 1px 0 0 rgba(255,255,255,0.15); }
.verdict-val-ours { font-size: 0.95rem; font-weight: 800; color: #fff; }
.comp-cta-cell.topic-verdict { font-size: 0.68rem; font-weight: 700; color: #676C82; letter-spacing: 0.1em; text-transform: uppercase; }
.comp-below {
  max-width: 620px; margin: 20px auto 0;
  display: flex; align-items: center; gap: 14px;
  background: var(--navy); border-radius: 14px; padding: 18px 22px; flex-wrap: wrap;
}
.comp-below-text { flex: 1; min-width: 200px; }
.comp-below-title { font-size: 0.9rem; font-weight: 700; color: #fff; margin-bottom: 3px; }
.comp-below-sub { font-size: 0.76rem; color: #838897; line-height: 1.5; }
.btn-comp-cta { background: #2F7A4F; color: #fff; border: none; border-radius: 9px; padding: 11px 22px; font-family: 'DM Sans', sans-serif; font-size: 0.85rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.18s; flex-shrink: 0; }
.btn-comp-cta:hover { background: #276644; }

/* ── TRUST STACK ── */
.trust-section { background: var(--warm); padding: 72px 24px; }
.trust-items { display: flex; flex-direction: column; gap: 1px; border-radius: 18px; overflow: hidden; border: 1px solid var(--stone); box-shadow: var(--shadow-sm); }
.trust-item { display: flex; align-items: center; gap: 18px; padding: 20px 22px; background: #fff; }
.trust-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.icon-teal-bg { background: var(--tealL); }
.icon-navy-bg { background: var(--navyL); }
.icon-green-bg { background: var(--greenL); }
.icon-warm-bg { background: var(--amberL); }
.trust-title { font-size: 0.92rem; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
.trust-desc { font-size: 0.78rem; color: var(--ink3); line-height: 1.6; }
.trust-badge { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--teal); background: var(--tealL); border-radius: 20px; padding: 4px 11px; white-space: nowrap; flex-shrink: 0; }

/* ── CLOSING ── */
.close-section { padding: 80px 24px 88px; background: var(--cream); position: relative; overflow: hidden; }
.close-section::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 280px; background: linear-gradient(180deg, var(--warm) 0%, transparent 100%); pointer-events: none; }
.close-inner { max-width: 540px; margin: 0 auto; position: relative; text-align: center; }
.close-eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink3); margin-bottom: 20px; }
.eyebrow-line { width: 26px; height: 1px; background: var(--stone); }
.close-h { font-family: 'Playfair Display', Georgia, serif; font-size: clamp(1.8rem, 5vw, 2.8rem); font-weight: 800; color: var(--ink); line-height: 1.12; letter-spacing: -0.03em; margin-bottom: 16px; }
.close-h em { font-style: italic; color: var(--navy); }
.close-body { font-size: 0.95rem; color: var(--ink3); line-height: 1.75; max-width: 400px; margin: 0 auto 44px; }

/* Upload card */
.upload-card { background: #fff; border: 1px solid var(--stone); border-radius: 22px; padding: 32px 28px 26px; text-align: left; box-shadow: 0 2px 8px rgba(24,24,27,0.04), 0 12px 40px rgba(24,24,27,0.06); }
.security-indicator { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
.sec-pulse { position: relative; width: 10px; height: 10px; flex-shrink: 0; }
.sec-core { position: absolute; inset: 0; border-radius: 50%; background: var(--teal); }
.sec-ring { position: absolute; inset: -4px; border-radius: 50%; border: 1.5px solid var(--teal); opacity: 0.35; animation: pulse-ring 2s ease-out infinite; }
.sec-ring2 { position: absolute; inset: -8px; border-radius: 50%; border: 1px solid var(--teal); opacity: 0.15; animation: pulse-ring 2s ease-out infinite 0.4s; }
@keyframes pulse-ring { 0% { transform: scale(0.7); opacity: 0.5; } 100% { transform: scale(1); opacity: 0; } }
.sec-text { font-size: 0.73rem; font-weight: 600; color: var(--teal); letter-spacing: 0.04em; }
.upload-card-title { font-size: 1rem; font-weight: 700; color: var(--ink); margin-bottom: 5px; }
.upload-card-sub { font-size: 0.8rem; color: var(--ink3); line-height: 1.6; margin-bottom: 22px; }
.dropzone {
  border: 2px dashed var(--stone); border-radius: 15px; padding: 30px 20px;
  text-align: center; cursor: pointer; position: relative; overflow: hidden;
  background: var(--cream); transition: all 0.2s; margin-bottom: 10px;
}
.dropzone:hover, .dropzone.drag-over { border-color: var(--navy); background: var(--navyL); }
.dropzone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
.dz-icon { margin: 0 auto 12px; width: 54px; height: 54px; position: relative; }
.dz-back { position: absolute; bottom: 0; left: 50%; transform: translateX(-45%) rotate(-6deg); width: 35px; height: 43px; background: var(--stone); border-radius: 6px; }
.dz-mid { position: absolute; bottom: 0; left: 50%; transform: translateX(-55%) rotate(-2deg); width: 35px; height: 43px; background: #D4E4FF; border-radius: 6px; }
.dz-front { position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 37px; height: 45px; background: var(--navy); border-radius: 6px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 8px 6px; }
.dz-front::after { content: ''; position: absolute; top: -1px; right: -1px; width: 10px; height: 10px; background: #86EFAC; border-radius: 0 6px 0 6px; }
.dz-line { width: 100%; height: 2px; background: rgba(255,255,255,0.45); border-radius: 99px; }
.dz-line-s { width: 58%; height: 2px; background: rgba(255,255,255,0.22); border-radius: 99px; align-self: flex-start; }
.dz-title { font-size: 0.92rem; font-weight: 700; color: var(--navy); margin-bottom: 4px; }
.dz-sub { font-size: 0.75rem; color: var(--ink3); line-height: 1.5; }
.dz-formats { display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 12px; flex-wrap: wrap; }
.dz-fmt { font-size: 0.64rem; font-weight: 700; letter-spacing: 0.08em; color: var(--ink4); background: var(--warm); border: 1px solid var(--stone); border-radius: 5px; padding: 2px 8px; }
.or-row { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.or-line { flex: 1; height: 1px; background: var(--stone); }
.or-text { font-size: 0.72rem; color: var(--ink4); }
.camera-btn { display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%; padding: 13px; border-radius: 12px; border: 1.5px solid var(--stone); background: var(--cream); color: var(--ink2); font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 700; cursor: pointer; transition: all 0.18s; margin-bottom: 20px; }
.camera-btn:hover { border-color: var(--navy); background: var(--navyL); color: var(--navy); }
.uploaded-state { display: none; background: var(--greenL); border: 1px solid rgba(22,101,52,0.2); border-radius: 11px; padding: 13px 16px; align-items: center; gap: 10px; margin-bottom: 20px; }
.uploaded-state.show { display: flex; }
.uploaded-check { width: 30px; height: 30px; border-radius: 50%; background: var(--green); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.uploaded-name { font-size: 0.85rem; font-weight: 700; color: var(--green); margin-bottom: 1px; }
.uploaded-sub { font-size: 0.7rem; color: var(--ink3); }
.uploaded-remove { background: none; border: none; color: var(--ink4); cursor: pointer; font-size: 1.1rem; padding: 0 4px; line-height: 1; flex-shrink: 0; }
.privacy-row { display: flex; align-items: flex-start; gap: 9px; padding: 13px 0; border-top: 1px solid var(--stone); margin-bottom: 20px; }
.privacy-text { font-size: 0.75rem; color: var(--ink3); line-height: 1.65; }
.privacy-text strong { color: var(--ink2); font-weight: 600; }
.btn-cta { display: flex; align-items: center; justify-content: center; gap: 9px; width: 100%; padding: 18px 28px; border-radius: 11px; border: none; background: #2F7A4F; color: #fff; font-family: 'DM Sans', sans-serif; font-size: 1.02rem; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 14px rgba(22,101,52,0.26), 0 10px 28px rgba(22,101,52,0.1); }
.btn-cta:hover { background: #276644; transform: translateY(-1px); }
.cta-support { font-size: 0.72rem; color: var(--ink4); text-align: center; margin-top: 10px; line-height: 1.65; }
.skip-btn { display: block; width: 100%; background: none; border: none; font-family: 'DM Sans', sans-serif; font-size: 0.78rem; color: var(--ink3); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: 8px 0; text-align: center; margin-top: 6px; }
.reassurance-row { display: flex; align-items: center; justify-content: center; gap: 20px; margin-top: 32px; flex-wrap: wrap; }
.reassurance-item { display: flex; align-items: center; gap: 6px; font-size: 0.73rem; color: var(--ink4); font-weight: 500; }
.reassurance-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--stone); }

/* ── DISCLAIMER SECTION ── */
.disclaimer-section {
  padding: 36px 24px 40px;
  background: var(--warm);
  border-top: 1px solid var(--stone);
}
.disclaimer-inner {
  max-width: 640px;
  margin: 0 auto;
}
.disclaimer-title {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink3);
  margin-bottom: 14px;
}
.disclaimer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.disclaimer-item {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}
.disclaimer-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--stone); flex-shrink: 0; margin-top: 7px;
}
.disclaimer-text {
  font-size: 0.75rem;
  color: var(--ink3);
  line-height: 1.65;
}
.disclaimer-text strong { color: var(--ink2); font-weight: 600; }
.disclaimer-full {
  font-size: 0.68rem;
  color: var(--ink4);
  line-height: 1.8;
  padding-top: 14px;
  border-top: 1px solid var(--stone);
}

/* ── FOOTER ── */
footer { background: var(--ink); padding: 28px 24px; text-align: center; }
footer p { font-size: 0.66rem; color: rgba(255,255,255,0.22); line-height: 1.8; max-width: 600px; margin: 0 auto; }

/* ── MOBILE ── */
@media (max-width: 520px) {
  section { padding: 48px 16px; }
  .hero { padding: 48px 16px 40px; }
  .engagement { padding: 48px 16px; }
  nav { padding: 14px 18px; }
  .cred-strip { padding: 28px 16px 30px; }
  .cred-inner { max-width: 360px; }
  .cred-label {
    max-width: 310px;
    margin: 0 auto 16px;
    font-size: 0.58rem;
    line-height: 1.7;
    letter-spacing: 0.16em;
  }
  .cred-logos {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    align-items: start;
  }
  .cred-logo { gap: 4px; min-width: 0; }
  .cred-logo-mark {
    width: 36px;
    height: 36px;
    border-radius: 9px;
    font-size: 0.52rem;
    margin: 0 auto;
  }
  .cred-logo-mark svg {
    width: 17px;
    height: 17px;
  }
  .cred-logo-name {
    font-size: 0.48rem;
    line-height: 1.25;
    letter-spacing: 0.04em;
    overflow-wrap: anywhere;
  }
  .cred-disc {
    max-width: 320px;
    margin: 14px auto 0;
    font-size: 0.58rem;
    line-height: 1.65;
  }
  .steps-row { grid-template-columns: 1fr; gap: 28px; }
  .steps-row::before { display: none; }
  .analysis-row { grid-template-columns: 120px 1fr auto; }
  .ar-label { font-size: 0.64rem; }
  .ar-value { font-size: 0.72rem; }
  .comp-cell { padding: 12px 8px; }
  .comp-topic-title { font-size: 0.76rem; }
  .comp-cell-text { font-size: 0.7rem; }
  .trust-item { flex-wrap: wrap; }
  .trust-badge { display: none; }
}

/* ── DARK MODE ── */
body { transition: background 0.35s ease, color 0.35s ease; }
/* ── DARK MODE — Premium Charcoal/Navy-Black Palette ── */
.dark-mode {
  /* Dark mode — premium charcoal calibrated to refined palette */
  --cream:   #141924;   /* deep navy-charcoal — refined */
  --warm:    #1A2030;   /* card surface */
  --stone:   #2A3448;   /* borders */
  --ink:     #F0F4F8;   /* headings */
  --ink2:    #CBD5E1;   /* body — matches #475569 lightened */
  --ink3:    #94A3B8;   /* secondary */
  --ink4:    #64748B;   /* metadata */
  --border:  rgba(255,255,255,0.08);
  --navyL:   #1A2A45;
  --greenL:  #0D2218;
  --tealL:   #0A1E26;
  --amberL:  #211808;
  --redL:    #250A0A;
  --navy:    #4A7BD4;   /* lightened #1F3A68 for dark readability */
  --green:   #3DAF6A;   /* lightened #2F7A4F for dark readability */
  --teal:    #2AAFCE;
}

/* Smooth transitions across all key elements */
*, *::before, *::after {
  transition-property: background-color, border-color, color, box-shadow;
  transition-duration: 0.3s;
  transition-timing-function: ease;
}
/* Except transforms/opacity — let those stay instant */
button, a, .btn-hero, .btn-cta, .nav-btn, .bill-option {
  transition: all 0.2s;
}

/* Nav */
.dark-mode nav {
  background: rgba(22,24,31,0.97);
  border-bottom-color: #242933;
  box-shadow: 0 1px 0 rgba(255,255,255,0.04);
}

/* Logo — ensure "United" text stays readable */
.dark-mode .nav-name .wn-united { color: #fff; }
.dark-mode .nav-name .wn-patient { color: #3DBFBF; }
.dark-mode .nav-sub { color: #70758A; }

/* Urgency bar — keep crimson but soften */
.dark-mode .urgency { background: #6B1212; }

/* Cards — consistent premium dark surface with subtle border glow */
.dark-mode .upload-card,
.dark-mode .analysis-card,
.dark-mode .comp-table,
.dark-mode .trust-item,
.dark-mode .testimonial,
.dark-mode .review-item,
.dark-mode .savings-card {
  background: #1C1E27;
  border-color: #262B35;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
}
.dark-mode .scenario-card,
.dark-mode .proof-card {
  background: #1C1E27 !important;
  border-color: #262B35 !important;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2) !important;
}

/* White card surfaces */
.dark-mode .form-card,
.dark-mode .paywall-card,
.dark-mode .math {
  background: #1C1E27;
  border-color: #262B35;
}

/* Inputs */
.dark-mode .form-input,
.dark-mode .dropzone {
  background: #14151C;
  border-color: #2B3039;
  color: var(--ink);
}
.dark-mode .dropzone { border-color: #30343E; }
.dark-mode .dropzone:hover { background: #1A2340; border-color: rgba(74,127,212,0.4); }

/* Bill options */
.dark-mode .bill-option {
  background: #1C1E27;
  border-color: #262B35;
  opacity: 0.85;
}
.dark-mode .bill-option.selected {
  background: #1A2340;
  border-color: rgba(74,127,212,0.6);
  opacity: 1;
  box-shadow: 0 4px 20px rgba(74,127,212,0.18), 0 1px 4px rgba(74,127,212,0.12), -3px 0 0 rgba(74,127,212,0.8);
}
.dark-mode .bill-option:hover { background: #20222C; opacity: 1; }

/* Analysis card */
.dark-mode .ar-label { background: #14151C; border-right-color: rgba(255,255,255,0.07); }
.dark-mode .ar-value { color: #CCC9C0; }

/* Comparison table */
.dark-mode .comp-header { background: #0F1E35; }
.dark-mode .comp-row { background: #1C1E27; border-top-color: rgba(255,255,255,0.06); }
.dark-mode .comp-row:hover { background: #1E2A3E; }
.dark-mode .comp-cta-row { background: #0F1E35; }

/* Strip backgrounds */
.dark-mode .cred-strip { background: #1C1E27; border-color: rgba(255,255,255,0.06); }
.dark-mode .disclaimer-section { background: #1C1E27; border-top-color: rgba(255,255,255,0.06); }

/* Trust items border */
.dark-mode .trust-items { border-color: #242933; }
.dark-mode .trust-item { border-bottom: 1px solid rgba(255,255,255,0.05); }

/* Inner white backgrounds in scenario/proof review boxes */
.dark-mode [style*="background:#fff"],
.dark-mode [style*="background: #fff"] { background: #1C1E27 !important; }
.dark-mode [style*="background:var(--warm)"] { }

/* Inline white cards (3-tile grid in emotional bridge) */
.dark-mode .tile-white { background: #20222C !important; border-color: #262B35 !important; }

/* Footer */
.dark-mode footer { background: #0F1017; border-top: 1px solid rgba(255,255,255,0.05); }

/* Upload card privacy note */
.dark-mode .privacy-row { border-top-color: #242933; }

/* Camera btn */
.dark-mode .camera-btn { background: #1C1E27; border-color: rgba(255,255,255,0.1); color: var(--ink2); }
.dark-mode .camera-btn:hover { background: #1A2340; border-color: rgba(74,127,212,0.4); color: var(--ink); }

/* Trap info box */
.dark-mode .trap-info { background: #1A2340; border-color: rgba(74,127,212,0.2); }
.dark-mode .trap-info-text { color: #A8BFE8; }

/* Dark sections stay dark, not doubled */
.dark-mode section[style*="background:var(--navy)"],
.dark-mode [style*="background:var(--navy)"] { /* keep navy sections as-is */ }

/* Mobile spacing — tighten on dark for efficiency */
@media (max-width: 640px) {
  .dark-mode section { padding-top: 52px !important; padding-bottom: 52px !important; }
  .dark-mode .upload-card { padding: 22px 18px 18px; }
  .dark-mode .scenario-card { padding: 20px 18px !important; }
  .dark-mode .proof-card { padding: 20px 18px !important; }
}

/* Night toggle button */
.night-toggle {
  display:flex; align-items:center; gap:6px;
  background:transparent; border:1.5px solid var(--border);
  border-radius:40px; padding:7px 14px;
  font-family:'DM Sans',sans-serif; font-size:0.75rem;
  font-weight:600; color:var(--ink3); cursor:pointer;
  transition:all 0.2s;
}
.night-toggle:hover { border-color:var(--ink3); color:var(--ink2); }
.toggle-icon { width:14px; height:14px; flex-shrink:0; }


@media (max-width: 580px) {
  .comparison-section {
    padding: 44px 16px 60px;
    background: var(--warm);
  }
  .comparison-section .section-inner-wide {
    max-width: 390px;
  }
  .comparison-section .section-eyebrow {
    max-width: 320px;
    margin: 0 auto 16px;
    font-size: 0.58rem;
    line-height: 1.6;
    letter-spacing: 0.18em;
  }
  .comparison-section .section-h {
    font-size: clamp(2rem, 9.6vw, 2.46rem);
    line-height: 1.06;
    margin-bottom: 16px;
  }
  .comparison-section .section-h > span {
    display: flex !important;
    flex-direction: column;
    align-items: center;
    gap: 9px !important;
  }
  .comparison-section .section-h > span > span {
    font-size: 0.56em !important;
    line-height: 1 !important;
    padding: 6px 13px !important;
    border-radius: 8px !important;
    box-shadow: 0 6px 18px rgba(31,58,104,0.16);
  }
  .comparison-section .section-sub {
    max-width: 335px;
    margin: 0 auto 14px;
    font-size: 0.94rem;
    line-height: 1.56;
  }
  .comparison-section [style*="position:relative"][style*="max-width:620px"] {
    max-width: 100% !important;
    margin: 0 auto !important;
    display: flex !important;
    justify-content: flex-end !important;
  }
  .comparison-section [style*="top:-48px"] {
    position: static !important;
    width: 50% !important;
    margin: 8px 0 10px auto !important;
    align-items: center !important;
    transform: translateX(2px);
  }
  .comparison-section [style*="top:-48px"] > div {
    font-size: 0.55rem !important;
    letter-spacing: 0.16em !important;
    padding: 7px 14px !important;
    border-radius: 999px !important;
    white-space: nowrap !important;
    box-shadow: 0 8px 22px rgba(31,58,104,0.28), 0 2px 8px rgba(0,0,0,0.12) !important;
  }
  .comparison-section [style*="top:-48px"] svg {
    margin-top: -1px !important;
  }
  .comp-table {
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    border: 0;
    border-radius: 0;
    overflow: visible;
    background: transparent;
  }
  .comp-header { display: none; }
  .mobile-row-label {
    display: block;
    margin-top: 12px;
    padding: 12px 16px;
    background: #EBF0FA;
    border: 1px solid var(--stone);
    border-bottom: 0;
    border-radius: 16px 16px 0 0;
    font-size: 0.76rem;
    font-weight: 900;
    color: #1F3A68;
    letter-spacing: -0.01em;
  }
  .mobile-row-label:first-of-type { margin-top: 0; }
  .comp-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    width: 100%;
    border: 1px solid var(--stone);
    border-top: 0;
    border-radius: 0 0 16px 16px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 8px 26px rgba(31,58,104,0.06);
  }
  .comp-cell.topic { display: none; }
  .comp-cell {
    width: 100%;
    min-width: 0;
    min-height: 150px;
    box-sizing: border-box;
    padding: 13px 12px 15px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    gap: 8px;
    text-align: left;
  }
  .comp-cell.diy {
    background: #fff;
    border-right: 1px solid rgba(203,213,225,0.85);
  }
  .comp-cell.our-col {
    background: linear-gradient(180deg, rgba(232,245,238,0.92), rgba(245,251,248,0.98));
    box-shadow: inset 3px 0 0 rgba(47,122,79,0.36);
  }
  .comp-cell.diy::before,
  .comp-cell.our-col::before {
    display: block;
    margin-bottom: 2px;
    font-size: 0.52rem;
    line-height: 1;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .comp-cell.diy::before {
    content: "On your own";
    color: #94A3B8;
  }
  .comp-cell.our-col::before {
    content: "UPA prepares";
    color: #2F7A4F;
  }
  .comp-cell-icon {
    width: 26px;
    height: 26px;
    flex: 0 0 26px;
  }
  .comp-cell-text {
    flex: 1;
    min-width: 0;
    max-width: 100%;
    font-size: 0.72rem;
    line-height: 1.42;
    text-align: left;
    overflow-wrap: anywhere;
    word-wrap: break-word;
    word-break: normal;
    hyphens: none;
  }
  .comp-cell.our-col .comp-cell-text {
    color: #2F3F56;
    font-weight: 850;
  }
  .comp-cta-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-top: 14px;
    border-radius: 16px;
    overflow: hidden;
    background: #1A3055;
    box-shadow: 0 10px 28px rgba(31,58,104,0.14);
  }
  .comp-cta-cell.topic-verdict { display: none; }
  .comp-cta-cell {
    min-width: 0;
    padding: 16px 12px;
    align-items: flex-start;
    text-align: left;
  }
  .comp-cta-cell.ours-verdict {
    background: linear-gradient(135deg,#2F7A4F,#276644);
    box-shadow: inset 3px 0 0 rgba(255,255,255,0.16);
  }
  .verdict-label {
    font-size: 0.52rem;
    line-height: 1.2;
    letter-spacing: 0.12em;
  }
  .verdict-val-diy,
  .verdict-val-ours {
    font-size: 0.92rem;
    line-height: 1.18;
    overflow-wrap: anywhere;
  }
  .comp-below {
    align-items: stretch;
    padding: 18px;
    border-radius: 16px;
  }
  .comp-below-title { font-size: 0.86rem; line-height: 1.45; }
  .comp-below-sub { font-size: 0.72rem; line-height: 1.55; }
  .btn-comp-cta {
    width: 100%;
    text-align: center;
    padding: 13px 18px;
  }
}
@media (min-width: 581px) {
  .mobile-row-label { display: none; }
}


/* Comparison VS styling */
.comp-header-vs-label {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; padding: 8px 0;
}
.vs-chip {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  color: #fff;
  font-family: 'DM Sans', sans-serif;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  border-radius: 5px;
  padding: 3px 8px;
  vertical-align: middle;
}
.comp-vs-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #1F3A68;
  padding: 10px 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.comp-vs-left, .comp-vs-right {
  font-size: 0.72rem;
  font-weight: 600;
  color: #969BA7;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.comp-vs-right { color: rgba(134,239,172,0.8); }
.dark-mode .comp-vs-row { background: #101826; }


.dark-mode nav .nav-brand img {
  filter: brightness(0) invert(1) sepia(0.3) saturate(2) hue-rotate(165deg);
  opacity: 0.92;
}

/* Dark mode hero — keep text visible */
.dark-mode .hero { background: linear-gradient(160deg, #141924 0%, #1A2340 50%, #131E1A 100%); }
.dark-mode .hero h1 { color: #F0F4F8; }
.dark-mode .hero-sub { color: #B8BEC9; }
.dark-mode .hero-sub strong { color: #F0F4F8; }
.dark-mode .hero-eyebrow { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); color: #A9AEB9; }
.dark-mode .hero-pill { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }
.dark-mode .hero-pill .pill-dot { background: #3DAF6A; }
.dark-mode .hero-stat-n { color: #93C5FD; }
.dark-mode .hero-stat-l { color: #969BA7; }
.dark-mode .hero-stat-src { color: #676C82; }
.dark-mode .stat-divider { background: rgba(255,255,255,0.1); }
.dark-mode .hero-reassurance { color: #676C82; }

/* Dark mode credibility strip */
.dark-mode .cred-strip { background: #1A2030; border-color: rgba(255,255,255,0.06); }
.dark-mode .cred-label { color: #70758A; }
.dark-mode .cred-logo { opacity: 0.55; filter: grayscale(100%) brightness(2); }
.dark-mode .cred-disc { color: #5C6070; }

/* Dark mode footer — high contrast compliance text */
.dark-mode footer { background: #0C1220; border-top: 1px solid rgba(255,255,255,0.06); }
.dark-mode footer p { color: #6B7280 !important; }

/* Dark mode disclaimer section */
.dark-mode .disclaimer-section { background: #141924; border-top-color: rgba(255,255,255,0.06); }
.dark-mode .disclaimer-title { color: #70758A; }
.dark-mode .disclaimer-text { color: #6B7280 !important; }
.dark-mode .disclaimer-text strong { color: #94A3B8 !important; }
.dark-mode .disclaimer-full { color: #6B7280 !important; border-top-color: #222631; }
.dark-mode .disclaimer-dot { background: rgba(255,255,255,0.15); }

/* Dark mode scroll trap */
.dark-mode .scroll-trap { background: #141924; }
.dark-mode .trap-step { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.6); }
.dark-mode .trap-q { color: #F0F4F8; }
.dark-mode .trap-sub { color: #898C91; }

/* Dark mode — various sections text visibility */
.dark-mode .section-h { color: #F0F4F8; }
.dark-mode .section-sub { color: #969BA7; }
.dark-mode .section-eyebrow, .dark-mode .eyebrow-green { color: #3DAF6A; }
.dark-mode .eyebrow-navy { color: #93C5FD; }
.dark-mode .eyebrow-teal { color: #38D4E8; }
.dark-mode .eyebrow-amber { color: #FBBF24; }

/* Dark mode — research/citations section already navy so fine */
/* Dark mode — process section already navy so fine */

/* Dark mode — emotional bridge section */
.dark-mode .close-eyebrow { color: #72757B; }
.dark-mode .close-eyebrow .eyebrow-line { background: rgba(255,255,255,0.1); }
.dark-mode .close-h { color: #F0F4F8; }
.dark-mode .close-h em { color: #93C5FD; }
.dark-mode .close-body { color: #969BA7; }

/* Dark mode — hero stats border */
.dark-mode .hero-stats { border-top-color: #262B35; }

/* Dark mode — what we review section */
.dark-mode .review-title { color: #F0F4F8; }
.dark-mode .review-desc { color: #9C9EA3; }
.dark-mode .review-section { background: #141924; }

/* Dark mode — credibility numbers / microcopy */
.dark-mode .microcopy-item { color: #6D7077; }
.dark-mode .microcopy-dot { background: rgba(255,255,255,0.15); }
.dark-mode .hero-reassurance { color: #676C82; }

/* Dark mode — scenario and proof cards inner text */
.dark-mode .review-item .review-title { color: #F0F4F8; }
.dark-mode .review-item .review-desc { color: #969BA7; }

/* Dark mode — trust items */
.dark-mode .trust-title { color: #F0F4F8; }
.dark-mode .trust-desc { color: #969BA7; }
.dark-mode .trust-badge { background: rgba(61,175,106,0.15); color: #3DAF6A; }
.dark-mode .trust-items { border-color: #242933; }

/* Dark mode — drop zone */
.dark-mode .dz-title { color: #93C5FD; }
.dark-mode .dz-sub { color: #838897; }
.dark-mode .dz-fmt { color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.08); }
.dark-mode .upload-card-title { color: #F0F4F8; }
.dark-mode .upload-card-sub { color: #969BA7; }

/* Dark mode — night toggle */
.dark-mode .night-toggle { color: #A1A3A7; border-color: #A1A3A7; }
.dark-mode .night-toggle:hover { border-color: #676C82; color: #fff; }

/* Dark mode — skip link */
.dark-mode .skip-btn { color: #72757B; }
.dark-mode .or-text { color: #676C82; }
.dark-mode .or-line { background: rgba(255,255,255,0.08); }
.dark-mode .privacy-text { color: #898C91; }
.dark-mode .privacy-text strong { color: #B8BABD; }

/* Dark mode — cta support */
.dark-mode .cta-support { color: #6D7077; }
.dark-mode .sec-text { color: #38D4E8; }

/* Dark mode — reassurance row */
.dark-mode .reassurance-item { color: #72757B; }
.dark-mode .reassurance-dot { background: rgba(255,255,255,0.15); }


.dark-mode .hero h1 em { color: #86EFAC; }
.dark-mode .hero-sub .green { color: #86EFAC; }


/* ── COMPREHENSIVE DARK MODE TEXT CONTRAST BOOST ── */

/* Footer — much more visible */
.dark-mode footer { background: #1A2035 !important; }
.dark-mode footer p { color: #6B7280 !important; line-height: 1.85; }

/* Disclaimer section */
.dark-mode .disclaimer-section { background: #141924 !important; }
.dark-mode .disclaimer-full { 
  color: #6B7280 !important; 
  border-top-color: #262B35 !important;
}
.dark-mode .disclaimer-text { color: #6B7280 !important; }
.dark-mode .disclaimer-text strong { color: #94A3B8 !important; }

/* Close / upload section */
.dark-mode .close-section { background: #1A2035 !important; }
.dark-mode .close-section::before {
  background: linear-gradient(180deg, rgba(26,32,53,0.8) 0%, transparent 100%) !important;
}
.dark-mode .close-h { color: #F0F4F8 !important; }
.dark-mode .close-h em { color: #93C5FD !important; }
.dark-mode .close-body { color: #A5A7AB !important; }
.dark-mode .close-eyebrow { color: #898C91 !important; }

/* Upload card */
.dark-mode .upload-card { background: #1E2540 !important; border-color: #2B3039 !important; }
.dark-mode .upload-card-title { color: #F0F4F8 !important; }
.dark-mode .upload-card-sub { color: #A5A7AB !important; }
.dark-mode .privacy-text { color: #95979C !important; }
.dark-mode .privacy-text strong { color: #D0D1D3 !important; }
.dark-mode .cta-support { color: #898C91 !important; }
.dark-mode .skip-btn { color: #7D8086 !important; }

/* Reassurance row */
.dark-mode .reassurance-item { color: #95979C !important; }
.dark-mode .reassurance-dot { background: rgba(255,255,255,0.2) !important; }

/* Hero h1 — also fix in dark mode explicitly */
.dark-mode .hero h1 { color: #F0F4F8 !important; }
.dark-mode .hero h1 em { color: #86EFAC !important; }
.dark-mode .hero-sub { color: #BDBEC1 !important; }
.dark-mode .hero-sub strong { color: #F0F4F8 !important; }

/* Hero pill */
.dark-mode .hero-pill { 
  background: rgba(255,255,255,0.08) !important; 
  border-color: #343942 !important; 
  color: #B8BABD !important;
}

/* Hero stats */
.dark-mode .hero-stat-n { color: #93C5FD !important; }
.dark-mode .hero-stat-l { color: #9C9EA3 !important; }
.dark-mode .hero-stat-src { color: #5F626A !important; }
.dark-mode .hero-stats { border-top-color: #262B35 !important; }

/* Credibility logos — bright enough to see clearly */
.dark-mode .cred-logo { 
  opacity: 0.8 !important; 
  filter: grayscale(100%) brightness(5) !important;
}
.dark-mode .cred-label { color: #7D8086 !important; }
.dark-mode .cred-disc { color: #555961 !important; }
.dark-mode .cred-strip { background: #1A2035 !important; }

/* Nav */
.dark-mode nav { background: rgba(20,25,36,0.97) !important; }

/* Sec text (teal pulse indicator) */
.dark-mode .sec-text { color: #38D4E8 !important; }

/* Private Secure line */
.dark-mode [style*="color:var(--teal)"] { color: #38D4E8 !important; }


.dark-mode .comp-rec-badge {
  background: #2A4A85 !important;
  box-shadow: 0 6px 24px rgba(0,0,0,0.4) !important;
}


.dark-mode .input-method-card { background: #1E2540 !important; border-color: #2B3039 !important; }
.dark-mode .input-method-card:hover { background: #232B4A !important; border-color: #43474F !important; }
.dark-mode #manual-form { background: #1A2340 !important; }
.dark-mode #manual-form input { background: #141924 !important; border-color: #2B3039 !important; color: #F0F4F8 !important; }
.dark-mode #manual-form input::placeholder { color: #676C82; }


.dark-mode #card-upload,
.dark-mode #card-photo,
.dark-mode #card-manual {
  background: #1E2540 !important;
  border-color: #2B3039 !important;
}
.dark-mode #card-upload:hover,
.dark-mode #card-photo:hover,
.dark-mode #card-manual:hover {
  background: #232B4A !important;
  border-color: #474B54 !important;
}
.dark-mode #manual-form {
  background: #1A2340 !important;
  border-color: #262B35 !important;
}
.dark-mode #manual-form input {
  background: #14192A !important;
  border-color: #2B3039 !important;
  color: #F0F4F8 !important;
}
.dark-mode #manual-form input::placeholder { color: #5A5E65 !important; }


.dark-mode .nav-brand .wn-united { color: #fff !important; }
.dark-mode .nav-brand .wn-patient { color: #3DBFBF !important; }
.dark-mode .nav-brand .wn-advocate { color: #666970 !important; }


/* ═══════════════════════════════════════════════════════════
   DARK MODE CONTRAST FINAL FIX — WCAG AA Compliant
   All values tested against dark bg #141924 / #1A2030
   Target: minimum 4.5:1 for body, 7:1 for headings
═══════════════════════════════════════════════════════════ */

/* ── HERO ── */
.dark-mode .hero {
  background: linear-gradient(160deg, #141924 0%, #1A2340 50%, #131E1A 100%) !important;
}
.dark-mode .hero h1 {
  color: #F1F5F9 !important;  /* contrast ~14:1 on #141924 */
}
.dark-mode .hero h1 em {
  color: #6EE7B7 !important;  /* bright mint — contrast ~8:1 */
}
.dark-mode .hero-sub {
  color: #CBD5E1 !important;  /* contrast ~8.5:1 — was 0.72 opacity causing blending */
}
.dark-mode .hero-sub strong {
  color: #F1F5F9 !important;
}
.dark-mode .hero-pill {
  background: rgba(255,255,255,0.09) !important;
  border-color: #3E424B !important;
  color: #94A3B8 !important;
}
.dark-mode .pill-dot {
  background: #6EE7B7 !important;
}
.dark-mode .hero-eyebrow {
  background: rgba(255,255,255,0.08) !important;
  border-color: #393D47 !important;
  color: #94A3B8 !important;
}
.dark-mode .hero-stat-n {
  color: #93C5FD !important;  /* bright blue — contrast ~8:1 */
}
.dark-mode .hero-stat-l {
  color: #94A3B8 !important;  /* contrast ~5:1 */
}
.dark-mode .hero-stat-src {
  color: #64748B !important;
}
.dark-mode .hero-stats {
  border-top-color: #2B3039 !important;
}
.dark-mode .hero-reassurance {
  color: #64748B !important;
}
.dark-mode .microcopy-item {
  color: #64748B !important;
}
.dark-mode .microcopy-dot {
  background: rgba(255,255,255,0.2) !important;
}

/* ── SECTION HEADINGS — all sections ── */
.dark-mode .section-h {
  color: #F1F5F9 !important;
}
.dark-mode .section-sub {
  color: #94A3B8 !important;  /* contrast ~5:1 — was too faded */
}
.dark-mode .section-eyebrow,
.dark-mode .eyebrow-green {
  color: #4ADE80 !important;  /* bright green — readable on dark */
}
.dark-mode .eyebrow-navy {
  color: #93C5FD !important;
}
.dark-mode .eyebrow-teal {
  color: #22D3EE !important;
}
.dark-mode .eyebrow-amber {
  color: #FCD34D !important;
}

/* ── CLOSE / CTA SECTION ── */
.dark-mode .close-section {
  background: #1A2035 !important;
}
.dark-mode .close-h {
  color: #F1F5F9 !important;
}
.dark-mode .close-h em {
  color: #93C5FD !important;
}
.dark-mode .close-body {
  color: #94A3B8 !important;  /* contrast ~5:1 */
}
.dark-mode .close-eyebrow {
  color: #64748B !important;
}

/* ── FOOTER & DISCLAIMER — most faded area ── */
.dark-mode footer {
  background: #0F1520 !important;
  border-top: 1px solid rgba(255,255,255,0.06) !important;
}
.dark-mode footer p {
  color: #6B7280 !important;  /* contrast ~3.5:1 — appropriate for fine print */
  line-height: 1.9 !important;
  font-size: 0.68rem !important;
}
.dark-mode .disclaimer-section {
  background: #141924 !important;
}
.dark-mode .disclaimer-full {
  color: #6B7280 !important;
  border-top-color: #242933 !important;
  line-height: 1.85 !important;
}
.dark-mode .disclaimer-title {
  color: #475569 !important;
  letter-spacing: 0.16em !important;
}
.dark-mode .disclaimer-text {
  color: #6B7280 !important;
}
.dark-mode .disclaimer-text strong {
  color: #94A3B8 !important;  /* slightly brighter for label distinction */
}
.dark-mode .disclaimer-dot {
  background: rgba(255,255,255,0.15) !important;
}

/* ── CARD TEXT — proof, scenarios, review ── */
.dark-mode .review-title {
  color: #E2E8F0 !important;
}
.dark-mode .review-desc {
  color: #94A3B8 !important;
}
.dark-mode .trust-title {
  color: #E2E8F0 !important;
}
.dark-mode .trust-desc {
  color: #94A3B8 !important;
}
.dark-mode .trust-badge {
  color: #4ADE80 !important;
  background: rgba(74,222,128,0.1) !important;
}

/* ── UPLOAD CARD ── */
.dark-mode .upload-card {
  background: #1E2540 !important;
  border-color: #292D37 !important;
}
.dark-mode .upload-card-title {
  color: #E2E8F0 !important;
}
.dark-mode .upload-card-sub {
  color: #94A3B8 !important;
}
.dark-mode .privacy-text {
  color: #94A3B8 !important;
}
.dark-mode .privacy-text strong {
  color: #CBD5E1 !important;
}
.dark-mode .cta-support {
  color: #64748B !important;
}
.dark-mode .skip-btn {
  color: #64748B !important;
}
.dark-mode .or-text {
  color: #475569 !important;
}
.dark-mode .or-line {
  background: rgba(255,255,255,0.08) !important;
}

/* ── REASSURANCE ROW ── */
.dark-mode .reassurance-item {
  color: #64748B !important;
}
.dark-mode .reassurance-dot {
  background: rgba(255,255,255,0.15) !important;
}

/* ── INLINE TEAL "Private. Secure." LINE ── */
.dark-mode .sec-text {
  color: #22D3EE !important;
}

/* ── CREDIBILITY STRIP ── */
.dark-mode .cred-strip {
  background: #1A2035 !important;
  border-color: #1F242E !important;
}
.dark-mode .cred-label {
  color: #475569 !important;
}
.dark-mode .cred-logo {
  filter: grayscale(100%) brightness(4) !important;
  opacity: 0.65 !important;
}
.dark-mode .cred-disc {
  color: #475569 !important;
}

/* ── NAV ── */
.dark-mode nav {
  background: rgba(20,25,36,0.97) !important;
  border-bottom-color: #242933 !important;
}
.dark-mode .night-toggle {
  color: #64748B !important;
  border-color: #2B3039 !important;
}
.dark-mode .night-toggle:hover {
  color: #94A3B8 !important;
  border-color: #474B54 !important;
}

/* ── WARMTH SECTIONS (alternate bg) ── */
.dark-mode .trust-section,
.dark-mode .comparison-section,
.dark-mode .proof section,
.dark-mode .analysis-section {
  background: #1A2030 !important;
}

/* ── SCROLL TRAP ── */
.dark-mode .trap-q {
  color: #F1F5F9 !important;
}
.dark-mode .trap-sub {
  color: #94A3B8 !important;
}
.dark-mode .trap-step {
  background: rgba(255,255,255,0.07) !important;
  color: #64748B !important;
}
.dark-mode .trap-fine {
  color: #64748B !important;
}
.dark-mode .bill-range {
  color: #E2E8F0 !important;
}
.dark-mode .bill-desc {
  color: #64748B !important;
}
.dark-mode .bill-option {
  background: #1E2540 !important;
  border-color: #292D37 !important;
}
.dark-mode .bill-option.selected {
  background: #1A2A48 !important;
  border-color: rgba(147,197,253,0.5) !important;
  box-shadow: 0 4px 20px rgba(74,127,212,0.2), -3px 0 0 rgba(74,127,212,0.8) !important;
}

/* ── INPUT METHOD CARDS ── */
.dark-mode #card-upload,
.dark-mode #card-photo,
.dark-mode #card-manual {
  background: #1E2540 !important;
  border-color: #292D37 !important;
}


/* ════════════════════════════════════════════
   LIGHT MODE EXPLICIT CONTRAST FIXES
   Overrides any inherited/conflicting rules
════════════════════════════════════════════ */

/* HERO — Image 2: "Understand Your Medical Bill." invisible */
.hero h1 {
  color: #1E293B !important;
}
.hero h1 em {
  color: #1F3A68 !important;
}
.hero-sub {
  color: #475569 !important;
}
.hero-sub strong {
  color: #1E293B !important;
}

/* TRUST STACK — Image 5: titles faded */
.trust-title {
  color: #1E293B !important;
}
.trust-desc {
  color: #475569 !important;
}

/* UPLOAD SECTION — Image 6: "How would you like to share your bill?" faded */
.upload-card-title {
  color: #1E293B !important;
}
.upload-card-sub {
  color: #475569 !important;
}

/* BILL RANGE SELECTOR — Image 3: faded text on cards */
.bill-range {
  color: #1E293B !important;
}
.bill-desc {
  color: #64748B !important;
}
.bill-option {
  background: #ffffff !important;
  border-color: #CBD5E1 !important;
}
.scroll-trap {
  background: #F2F5F9 !important;
}
.trap-q {
  color: #1E293B !important;
}
.trap-sub {
  color: #475569 !important;
}
.trap-step {
  color: #1F3A68 !important;
  background: #EBF0FA !important;
}

/* CITATIONS — Image 4: "Commonwealth Fund (2024)" faded */
.hero-stat-n {
  color: #1F3A68 !important;
}
.hero-stat-l {
  color: #475569 !important;
}
.hero-stat-src {
  color: #94A3B8 !important;
}

/* FOOTER — Image 1: disclaimer nearly invisible */
footer {
  background: #F2F5F9 !important;
}
footer p {
  color: #64748B !important;
  line-height: 1.85 !important;
}

/* SECTION TEXT — general */
.section-h {
  color: #1E293B !important;
}
.section-sub {
  color: #475569 !important;
}

/* COMP TABLE BODY TEXT */
.comp-cell-text {
  color: #475569 !important;
}
.comp-topic-title {
  color: #1E293B !important;
}

/* REVIEW ITEMS */
.review-title {
  color: #1E293B !important;
}
.review-desc {
  color: #475569 !important;
}

/* CLOSE SECTION */
.close-h {
  color: #1E293B !important;
}
.close-body {
  color: #475569 !important;
}


/* App resets */
*, *::before, *::after { box-sizing: border-box; }

/* ── SECTION BACKGROUND FIXES (Issues 5 & 7) ── */
.stats-bar, .cred-strip {
  background: #F4F0E8 !important;
}
.dark-mode .stats-bar, .dark-mode .cred-strip {
  background: #1A1E2A !important;
}

/* ── STATS BAR NUMBERS — keep them readable on warm bg ── */
.stats-bar .hero-stat-n { color: #1F3A68 !important; }
.dark-mode .stats-bar .hero-stat-n { color: #93C5FD !important; }

/* Body class applied by React */
body.dark-mode { background: #141924 !important; }
`;

// ─── LANDING HTML SECTIONS ───────────────────────────────────────────────────
const URGENCY_HTML  = `<!-- URGENCY BAR -->
<div class="urgency">
  Introductory pricing &mdash; <em>this offer may not last. Lock in your rate today.</em>
</div>

`;
const HERO_HTML     = `<!-- HERO -->
<section class="hero">
  <div class="hero-inner">
    <div class="hero-pill">
      <div class="pill-dot"></div>
      Independent Billing Review &amp; Dispute Documentation Service
    </div>
    <h1>Understand Your Medical Bill.<br><em>We Prepare Your Review.</em></h1>
    <p class="hero-sub">
      Medical bills may contain discrepancies such as coding inconsistencies, duplicate line items, or charges that appear above published Medicare benchmarks. We prepare an independent billing review and dispute documentation package you may reference when reviewing charges with your provider or insurer.
    </p>
    <div class="hero-cta-wrap">
      <button class="btn-hero" data-cta="true"scroll-trap').scrollIntoView({behavior:'smooth',block:'center'})">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Begin My Billing Review
      </button>
      <div class="microcopy">
        <div class="microcopy-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          No upfront cost
        </div>
        <div class="microcopy-dot"></div>
        <div class="microcopy-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Takes 60 seconds
        </div>
        <div class="microcopy-dot"></div>
        <div class="microcopy-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          100% confidential
        </div>
      </div>
    </div>
    <div class="hero-stats">
      <div class="hero-stat">
        <div class="hero-stat-n">$88B</div>
        <div class="hero-stat-l">in billing errors on<br>U.S. credit reports</div>
        <div class="hero-stat-src">CFPB &middot; 2025</div>
      </div>
      <div class="stat-divider"></div>
      <div class="hero-stat">
        <div class="hero-stat-n">45%</div>
        <div class="hero-stat-l">of insured patients reported<br>unexpected bills</div>
        <div class="hero-stat-src">Commonwealth Fund &middot; 2024</div>
      </div>
      <div class="stat-divider"></div>
      <div class="hero-stat">
        <div class="hero-stat-n">3 min</div>
        <div class="hero-stat-l">to complete your<br>review submission</div>
        <div class="hero-stat-src">United Patient Advocate</div>
      </div>
    </div>
  </div>
</section>

`;
const CRED_HTML     = `<!-- CREDIBILITY STRIP -->
<div class="cred-strip">
  <div class="cred-inner">
    <div class="cred-label">Experienced with major U.S. insurance providers &amp; hospital systems</div>
    <div class="cred-logos">
      <div class="cred-logo logo-uhc"><div class="cred-logo-mark">UHC</div><div class="cred-logo-name">UnitedHealth</div></div>
      <div class="cred-logo logo-aetna"><div class="cred-logo-mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div><div class="cred-logo-name">Aetna</div></div>
      <div class="cred-logo logo-cigna"><div class="cred-logo-mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg></div><div class="cred-logo-name">Cigna</div></div>
      <div class="cred-logo logo-bcbs"><div class="cred-logo-mark">BCBS</div><div class="cred-logo-name">Blue Cross</div></div>
      <div class="cred-logo logo-humana"><div class="cred-logo-mark"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><div class="cred-logo-name">Humana</div></div>
    </div>
    <div class="cred-disc">All institutions listed are referenced solely for informational and research reference purposes. United Patient Advocate is not affiliated with, endorsed by, or sponsored by any institution listed above. Referenced institutions include UnitedHealthcare, Aetna, Cigna, Blue Cross Blue Shield, and Humana.</div>
  </div>
</div>


`;
const RESEARCH_HTML = `<!-- RESEARCH REFERENCES GRID -->
<section style="background:#1F3A68;padding:72px 24px;">
  <div style="max-width:960px;margin:0 auto;">

    <div style="text-align:center;margin-bottom:44px;">
      <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:40px;padding:6px 18px;margin-bottom:18px;">
        <div style="width:5px;height:5px;border-radius:50%;background:#86EFAC;"></div>
        <span style="font-size:0.65rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.5);">Industry Research &amp; Public Reporting References</span>
      </div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.8rem,4vw,2.6rem);font-weight:800;color:#fff;line-height:1.15;letter-spacing:-0.03em;margin-bottom:12px;">
        What the data shows
      </h2>
      <p style="font-size:0.88rem;color:rgba(255,255,255,0.42);max-width:440px;margin:0 auto;line-height:1.65;">
        Peer-reviewed publications, federal government reports, and independent research organizations — cited for informational reference only.
      </p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:28px;">

      <!-- 1. Johns Hopkins + Harvard Risk Mgmt -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:20px 20px 18px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:11px;background:rgba(123,168,224,0.15);border:1px solid rgba(123,168,224,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:900;color:#7BA8E0;text-align:center;line-height:1.2;letter-spacing:0.03em;">JHM</div>
          <div style="flex:1;">
            <div style="font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;">Johns Hopkins Medicine</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.38);line-height:1.5;margin-bottom:10px;">Armstrong Institute &amp; Harvard Risk Management Foundation &mdash; BMJ Quality &amp; Safety &middot; July 2023</div>
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:800;color:#fff;letter-spacing:-0.04em;line-height:1;margin-bottom:8px;">795,000</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65);line-height:1.6;">Americans experience death or permanent disability from diagnostic and medical errors annually.</div>
          </div>
        </div>
      </div>

      <!-- 2. Harvard Medical School / Mayo Clinic Proceedings -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:20px 20px 18px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:11px;background:rgba(123,168,224,0.15);border:1px solid rgba(123,168,224,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:900;color:#7BA8E0;text-align:center;line-height:1.2;letter-spacing:0.03em;">HMS</div>
          <div style="flex:1;">
            <div style="font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;">Harvard Medical School</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.38);line-height:1.5;margin-bottom:10px;">Dr. Edward P. Hoffer &mdash; Mayo Clinic Proceedings: Digital Health &middot; May 2023</div>
            <div style="font-size:0.8rem;color:rgba(255,255,255,0.72);line-height:1.65;">Published research documents how electronic medical record systems may contribute to billing entries that do not reflect the services as actually rendered.</div>
          </div>
        </div>
      </div>

      <!-- 3. Commonwealth Fund -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:20px 20px 18px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:11px;background:rgba(76,175,128,0.15);border:1px solid rgba(76,175,128,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:900;color:#4CAF80;text-align:center;line-height:1.2;letter-spacing:0.03em;">CF</div>
          <div style="flex:1;">
            <div style="font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;">The Commonwealth Fund</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.38);line-height:1.5;margin-bottom:10px;">Survey of 7,800+ insured U.S. adults &middot; August 2024</div>
            <div style="display:flex;gap:14px;margin-bottom:8px;">
              <div><div style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:800;color:#fff;letter-spacing:-0.04em;line-height:1;">45%</div><div style="font-size:0.66rem;color:rgba(255,255,255,0.45);margin-top:2px;">unexpected bills</div></div>
              <div style="width:1px;background:rgba(255,255,255,0.1);"></div>
              <div><div style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:800;color:#86EFAC;letter-spacing:-0.04em;line-height:1;">38%</div><div style="font-size:0.66rem;color:rgba(255,255,255,0.45);margin-top:2px;">who disputed saw corrections</div></div>
            </div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65);line-height:1.6;">Of 7,800+ insured U.S. adults surveyed.</div>
          </div>
        </div>
      </div>

      <!-- 4. U.S. CFPB -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:20px 20px 18px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:11px;background:rgba(224,112,112,0.15);border:1px solid rgba(224,112,112,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:900;color:#E07070;text-align:center;line-height:1.2;letter-spacing:0.03em;">CFPB</div>
          <div style="flex:1;">
            <div style="font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;">U.S. Consumer Financial Protection Bureau</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.38);line-height:1.5;margin-bottom:10px;">Federal Government Report &middot; 2025</div>
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:800;color:#fff;letter-spacing:-0.04em;line-height:1;margin-bottom:8px;">$88B</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65);line-height:1.6;">In medical billing-related debt on consumer credit reports. A 2025 federal rule addressed this for an estimated 15 million Americans.</div>
          </div>
        </div>
      </div>

      <!-- 5. CFPB Office for Older Americans -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:20px 20px 18px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:11px;background:rgba(212,160,64,0.15);border:1px solid rgba(212,160,64,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:900;color:#D4A040;text-align:center;line-height:1.2;letter-spacing:0.03em;">OAm</div>
          <div style="flex:1;">
            <div style="font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;">CFPB Office for Older Americans</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.38);line-height:1.5;margin-bottom:10px;">Federal Government Research &middot; 2023</div>
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:800;color:#fff;letter-spacing:-0.04em;line-height:1;margin-bottom:8px;">4 million</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65);line-height:1.6;">Adults 65+ reporting unpaid medical bills — despite 98% holding health insurance.</div>
          </div>
        </div>
      </div>

      <!-- 6. CMS FY 2024 -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:20px 20px 18px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:11px;background:rgba(123,168,224,0.15);border:1px solid rgba(123,168,224,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:900;color:#7BA8E0;text-align:center;line-height:1.2;letter-spacing:0.03em;">CMS</div>
          <div style="flex:1;">
            <div style="font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;">Centers for Medicare &amp; Medicaid Services</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.38);line-height:1.5;margin-bottom:10px;">U.S. Federal Government Annual Report &middot; FY 2024</div>
            <div style="display:flex;gap:14px;margin-bottom:8px;">
              <div><div style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:800;color:#fff;letter-spacing:-0.04em;line-height:1;">$31.7B</div><div style="font-size:0.66rem;color:rgba(255,255,255,0.45);margin-top:2px;">improper payments</div></div>
              <div style="width:1px;background:rgba(255,255,255,0.1);"></div>
              <div><div style="font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:800;color:#FCD34D;letter-spacing:-0.04em;line-height:1;">7.66%</div><div style="font-size:0.66rem;color:rgba(255,255,255,0.45);margin-top:2px;">error rate</div></div>
            </div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65);line-height:1.6;">Medicare program, FY 2024 annual report.</div>
          </div>
        </div>
      </div>

      <!-- 7. AARP -->
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);border-radius:16px;padding:20px 20px 18px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:44px;height:44px;border-radius:11px;background:rgba(212,160,64,0.15);border:1px solid rgba(212,160,64,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:'DM Sans',sans-serif;font-size:0.58rem;font-weight:900;color:#D4A040;text-align:center;line-height:1.2;letter-spacing:0.03em;">AARP</div>
          <div style="flex:1;">
            <div style="font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:800;color:#fff;margin-bottom:3px;line-height:1.3;">AARP Public Policy Institute</div>
            <div style="font-size:0.65rem;color:rgba(255,255,255,0.38);line-height:1.5;margin-bottom:10px;">National Policy Research &middot; 2025</div>
            <div style="font-family:'Playfair Display',Georgia,serif;font-size:1.5rem;font-weight:800;color:#fff;letter-spacing:-0.03em;line-height:1.1;margin-bottom:8px;">#1 financial concern</div>
            <div style="font-size:0.78rem;color:rgba(255,255,255,0.65);line-height:1.6;">Medical debt identified as the leading financial concern for Americans over 50.</div>
          </div>
        </div>
      </div>

    </div>

    <!-- Section disclaimer -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:16px 20px;display:flex;gap:12px;align-items:flex-start;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.8" stroke-linecap="round" style="flex-shrink:0;margin-top:1px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <p style="font-size:0.68rem;color:rgba(255,255,255,0.3);line-height:1.75;margin:0;">
        <strong style="color:rgba(255,255,255,0.45);font-weight:700;">Research Reference Disclosure:</strong> Institutions and studies cited above are referenced solely for informational and research reference purposes. Statistics reflect the findings of the original publishing organizations and are not claims made by United Patient Advocate. United Patient Advocate is not affiliated with, endorsed by, or sponsored by Johns Hopkins Medicine, Harvard Medical School, The Commonwealth Fund, the Consumer Financial Protection Bureau, the Centers for Medicare &amp; Medicaid Services, AARP, or any other institution referenced. Individual billing outcomes vary and are not implied by any statistic cited above.
      </p>
    </div>

  </div>
</section>

`;
const TRAP_HTML     = `<!-- SCROLL TRAP -->
<div class="scroll-trap" id="scroll-trap">
  <div class="scroll-trap-inner">
    <div class="trap-step">Quick question &mdash; 5 seconds</div>
    <h2 class="trap-q">How much is your medical bill?</h2>
    <p class="trap-sub">Select the range that fits. We will explain what a review typically covers for your bill size.</p>
    <div class="bill-options">
      <div class="bill-option" onclick="selectBill(this,'low')">
        <div class="bill-radio"><div class="bill-radio-dot"></div></div>
        <div style="flex:1"><div class="bill-range">Under $1,000</div><div class="bill-desc">Outpatient visits, minor procedures</div></div>
        <div class="bill-complexity">Standard review</div>
      </div>
      <div class="bill-option" onclick="selectBill(this,'mid')">
        <div class="bill-radio"><div class="bill-radio-dot"></div></div>
        <div style="flex:1"><div class="bill-range">$1,000 &ndash; $5,000</div><div class="bill-desc">ER visits, imaging, specialist care</div></div>
        <div class="bill-complexity">Full review</div>
      </div>
      <div class="bill-option" onclick="selectBill(this,'high')">
        <div class="bill-radio"><div class="bill-radio-dot"></div></div>
        <div style="flex:1"><div class="bill-range">Over $5,000</div><div class="bill-desc">Surgeries, hospital stays</div></div>
        <div class="bill-complexity">Comprehensive review</div>
      </div>
    </div>
    <div class="trap-info" id="trap-info">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3560" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <div class="trap-info-text" id="trap-info-text">Select a range above to see what your review covers.</div>
    </div>
    <div class="trap-continue" id="trap-continue">
      <button class="btn-continue-trap" data-cta="true"close-section').scrollIntoView({behavior:'smooth',block:'start'})">Upload My Bill &nbsp;&rarr;</button>
      <div class="trap-fine">Choose your review package to unlock your prepared billing analysis and dispute documentation &nbsp;&middot;&nbsp; Billing review documentation prepared promptly &nbsp;&middot;&nbsp; Confidential</div>
    </div>
  </div>
</div>

`;
const ANALYSIS_HTML = `<!-- ANALYSIS PREVIEW -->
<section class="analysis-section" style="padding-top:52px;">
  <div class="section-inner" style="max-width:720px">
    <div class="section-eyebrow eyebrow-navy" style="margin-bottom:10px;">Sample billing review</div>
    <h2 class="section-h" style="font-size:clamp(1.8rem,4vw,2.6rem);margin-bottom:10px;">This is what we prepare<br><em class="em-navy">for your bill</em></h2>
    <p class="section-sub" style="margin-bottom:28px;">CPT codes, ICD-10 references, Medicare benchmarks, duplicate charges, and coding indicators. Choose your review package to access your complete report.</p>

    <div class="analysis-card">
      <div class="analysis-card-header">
        <div class="analysis-card-title">United Patient Advocate &mdash; Billing Analysis Report</div>
        <div class="analysis-card-meta">
          <span class="analysis-chip chip-teal">In Review</span>
          <span class="analysis-chip chip-amber">3 Flags</span>
        </div>
      </div>

      <div class="analysis-rows">

        <!-- Row 1: Procedure codes — visible -->
        <div class="analysis-row">
          <div class="ar-label">CPT Codes Identified</div>
          <div class="ar-value">
            <span class="code-tag">99285</span>
            <span class="code-tag">71046</span>
            <span class="code-tag amber">93010</span>
            <span style="font-size:0.72rem;color:var(--ink4)">+ 2 more</span>
          </div>
          <div class="ar-status"><span class="status-badge status-review">Reviewing</span></div>
        </div>

        <!-- Row 2: ICD-10 — partial blur -->
        <div class="analysis-row">
          <div class="ar-label">ICD-10 Diagnoses</div>
          <div class="ar-value">
            <span class="code-tag blurred-tag">R07.9</span>
            <span class="code-tag blurred-tag">Z87.891</span>
            <span class="code-tag blurred-tag amber">I10</span>
          </div>
          <div class="ar-status"><span class="status-badge status-locked">Locked</span></div>
        </div>

        <!-- Row 3: Medicare benchmark — flagged -->
        <div class="analysis-row">
          <div class="ar-label">Medicare Benchmark</div>
          <div class="ar-value">
            <span style="font-size:0.8rem;color:var(--red);font-weight:700">CPT 99285: Charge above Medicare allowable</span>
          </div>
          <div class="ar-status"><span class="status-badge status-flag">Flagged</span></div>
        </div>

        <!-- Row 4: Provider charge analysis — blurred -->
        <div class="analysis-row">
          <div class="ar-label">Provider Charge Analysis</div>
          <div class="ar-value blurred">
            Facility fee $1,240 vs Medicare allowable $680 &middot; Variance +82%
          </div>
          <div class="ar-status"><span class="status-badge status-locked">Locked</span></div>
        </div>

        <!-- Row 5: Duplicate charge check — flagged visible -->
        <div class="analysis-row">
          <div class="ar-label">Duplicate Charge Check</div>
          <div class="ar-value">
            <span style="font-size:0.8rem;color:var(--red);font-weight:700">Line items 3 &amp; 7 appear duplicated</span>
            <span class="code-tag red">CPT 71046 &times;2</span>
          </div>
          <div class="ar-status"><span class="status-badge status-flag">Flagged</span></div>
        </div>

        <!-- Row 6: Coding mismatch — blurred -->
        <div class="analysis-row">
          <div class="ar-label">Coding Mismatch</div>
          <div class="ar-value blurred">
            Diagnosis code does not support billed procedure level &middot; Upcoding indicator present
          </div>
          <div class="ar-status"><span class="status-badge status-locked">Locked</span></div>
        </div>

        <!-- Row 7: Insurance billing analysis — blurred -->
        <div class="analysis-row">
          <div class="ar-label">Insurance Billing Analysis</div>
          <div class="ar-value blurred">
            Out-of-network rate applied to in-network eligible procedure &middot; No Surprises Act applicability: Yes
          </div>
          <div class="ar-status"><span class="status-badge status-locked">Locked</span></div>
        </div>

        <!-- Row 8: Dispute letter — fully blurred -->
        <div class="analysis-row">
          <div class="ar-label">Dispute Letter</div>
          <div class="ar-value blurred">
            Dear Billing Department, Pursuant to federal billing transparency requirements and the No Surprises Act (Pub.L. 116-260)...
          </div>
          <div class="ar-status"><span class="status-badge status-locked">Locked</span></div>
        </div>

      </div>

      <!-- Lock overlay -->
      <div class="analysis-lock-overlay">
        <div style="display:inline-flex;align-items:center;gap:7px;background:var(--greenL);border:1px solid rgba(22,101,52,0.2);border-radius:20px;padding:6px 16px;margin-bottom:14px;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span style="font-size:0.68rem;font-weight:700;color:var(--green);letter-spacing:0.08em;">Your review documentation has already been prepared.</span>
        </div>
        <div class="lock-text">
          Choose your review package to access your complete billing analysis, dispute reference letter, phone script, and action plan.
        </div>
        <button class="btn-unlock" style="padding:14px 32px;font-size:0.95rem;" data-cta="true"close-section').scrollIntoView({behavior:'smooth'})">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          See My Billing Review
        </button>
      </div>
    </div>

  </div>
</section>

`;
const REVIEW_HTML   = `<!-- WHAT WE REVIEW -->
<section class="review-section">
  <div class="section-inner" style="max-width:720px">
    <div class="section-eyebrow eyebrow-teal">Our review process</div>
    <h2 class="section-h">What we examine<br><em class="em-navy">in your bill</em></h2>
    <p class="section-sub" style="margin-bottom:36px">A structured review of seven categories that commonly contain errors in U.S. medical bills.</p>
    <div class="review-grid">
      <div class="review-item">
        <div class="review-icon" style="background:var(--navyL)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A3560" stroke-width="1.8" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        </div>
        <div><div class="review-title">CPT &amp; ICD-10 Coding Review</div><div class="review-desc">Flags potential coding discrepancies and mismatched billing entries against standard coding guidelines.</div></div>
      </div>
      <div class="review-item">
        <div class="review-icon" style="background:var(--tealL)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E7490" stroke-width="1.8" stroke-linecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
        <div><div class="review-title">Medicare Benchmark Comparison</div><div class="review-desc">Compares every charge against published Medicare allowable rates. Flags amounts that may exceed standard benchmarks.</div></div>
      </div>
      <div class="review-item">
        <div class="review-icon" style="background:var(--redL)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div><div class="review-title">Duplicate Charge Detection</div><div class="review-desc">Identifies line items that appear more than once or may have been billed under multiple codes for the same service.</div></div>
      </div>
      <div class="review-item">
        <div class="review-icon" style="background:var(--amberL)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="1.8" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div><div class="review-title">Upcoding &amp; Unbundling Indicators</div><div class="review-desc">Flags indicators where billing complexity codes may exceed standard guidelines, or where charges appear split unnecessarily.</div></div>
      </div>
      <div class="review-item">
        <div class="review-icon" style="background:var(--greenL)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="1.8" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div><div class="review-title">Insurance Billing Analysis</div><div class="review-desc">Reviews in-network rate applicability and flags potential No Surprises Act considerations relevant to your bill.</div></div>
      </div>
      <div class="review-item">
        <div class="review-icon" style="background:var(--navyL)">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A3560" stroke-width="1.8" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <div><div class="review-title">Dispute Documentation &amp; Phone Script</div><div class="review-desc">Prepares a dispute reference letter citing applicable federal billing protections, plus a structured phone script for contacting your provider.</div></div>
      </div>
    </div>
  </div>
</section>

<!-- 3-STEP PROCESS -->
<section class="process-section">
  <div class="section-inner">
    <div class="section-eyebrow" style="color:rgba(255,255,255,0.4)">How it works</div>
    <h2 class="section-h" style="color:#fff;margin-bottom:10px">Three steps.<br><em style="color:#86EFAC">That is all.</em></h2>
    <p class="section-sub">No hold music. No paperwork. No medical knowledge required.</p>
    <div class="steps-row">
      <div class="step-item">
        <div class="step-num"><div class="step-num-inner">1</div></div>
        <div class="step-title">Upload or enter your bill</div>
        <div class="step-desc">Photo, PDF, or screenshot. Or type the key amounts manually. Either way works.</div>
        <div class="step-time">Under 60 seconds</div>
      </div>
      <div class="step-item">
        <div class="step-num"><div class="step-num-inner">2</div></div>
        <div class="step-title">We prepare your review documentation</div>
        <div class="step-desc">CPT coding reference review, Medicare benchmark comparison, duplicate charge identification, and dispute documentation preparation.</div>
        <div class="step-time">Automated document analysis</div>
      </div>
      <div class="step-item">
        <div class="step-num"><div class="step-num-inner">3</div></div>
        <div class="step-title">You receive your report</div>
        <div class="step-desc">Dispute reference letter, structured phone script, action plan, and consumer billing rights overview — sent to your inbox.</div>
        <div class="step-time">Delivered in minutes</div>
      </div>
    </div>
  </div>
</section>

`;
const COMP_HTML     = `<!-- COMPARISON -->
<section class="comparison-section">
  <div class="section-inner-wide">
    <div class="section-eyebrow eyebrow-amber">An independent comparison</div>
    <h2 class="section-h">Navigating alone<br><span style="display:inline-flex;align-items:center;gap:12px;"><span style="display:inline-block;background:var(--navy);color:#fff;font-family:'DM Sans',sans-serif;font-size:0.7em;font-weight:900;letter-spacing:0.12em;border-radius:6px;padding:3px 10px;vertical-align:middle;font-style:normal;">VS</span><em class="em-navy" style="font-style:italic;">having documentation prepared</em></span></h2>
    <p class="section-sub">Four areas where having organized documentation may support a more informed billing review.</p>
    <div style="position:relative;max-width:620px;margin:0 auto;">
      <!-- RECOMMENDED badge — positioned above the UPA column (right third) -->
      <div style="
        position:absolute;
        right:0;
        top:-48px;
        width:calc(33.333% + 1px);
        display:flex;
        flex-direction:column;
        align-items:center;
        z-index:10;
        pointer-events:none;
      ">
        <div style="
          display:inline-flex;
          align-items:center;
          gap:7px;
          background: #1F3A68;
          color:#fff;
          font-family:'DM Sans',sans-serif;
          font-size:0.62rem;
          font-weight:700;
          letter-spacing:0.22em;
          text-transform:uppercase;
          border-radius:20px;
          padding:7px 18px;
          box-shadow: 0 6px 24px rgba(31,58,104,0.35), 0 2px 8px rgba(0,0,0,0.12);
          border:1.5px solid rgba(255,255,255,0.18);
          white-space:nowrap;
        ">
          <!-- Checkmark icon -->
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#86EFAC" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Recommended
        </div>
        <!-- Arrow pointing down, same width as badge tail, navy colored -->
        <svg width="14" height="10" viewBox="0 0 14 10" fill="none" style="margin-top:-1px;">
          <path d="M7 10 L0 0 L14 0 Z" fill="#1F3A68"/>
        </svg>
      </div>
    </div>
    <div class="comp-table">
      <div class="comp-header">
        <div class="comp-header-cell">The situation</div>
        <div class="comp-header-cell" style="text-align:center;">On your own</div>
        <div class="comp-header-cell ours">United Patient Advocate</div>
      </div>
      <div class="mobile-row-label">Reaching billing</div>
        <div class="comp-row">
        <div class="comp-cell topic"><div class="comp-topic-title">Reaching billing</div><div class="comp-topic-sub">Communicating with a provider's billing department</div></div>
        <div class="comp-cell diy"><div class="comp-cell-icon icon-bad"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div><div class="comp-cell-text">Navigation can be time-consuming. Multiple transfers are common.</div></div>
        <div class="comp-cell our-col"><div class="comp-cell-icon icon-good"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="comp-cell-text">Structured billing communication guide prepared.</div></div>
      </div>
      <div class="mobile-row-label">Understanding the bill</div>
        <div class="comp-row">
        <div class="comp-cell topic"><div class="comp-topic-title">Understanding the bill</div><div class="comp-topic-sub">Interpreting procedure codes and itemized line items</div></div>
        <div class="comp-cell diy"><div class="comp-cell-icon icon-bad"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div><div class="comp-cell-text">Billing codes can be difficult to interpret without reference tools.</div></div>
        <div class="comp-cell our-col"><div class="comp-cell-icon icon-good"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="comp-cell-text">Billing codes cross-referenced and explained in plain language.</div></div>
      </div>
      <div class="mobile-row-label">Dispute documentation</div>
        <div class="comp-row">
        <div class="comp-cell topic"><div class="comp-topic-title">Dispute documentation</div><div class="comp-topic-sub">Having organized references and documentation before contacting a provider</div></div>
        <div class="comp-cell diy"><div class="comp-cell-icon icon-bad"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div><div class="comp-cell-text">No organized reference documentation. No benchmark comparisons available.</div></div>
        <div class="comp-cell our-col"><div class="comp-cell-icon icon-good"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="comp-cell-text">Relevant federal billing protections referenced. Medicare benchmark comparisons included.</div></div>
      </div>
      <div class="mobile-row-label">Likely outcome</div>
        <div class="comp-row">
        <div class="comp-cell topic"><div class="comp-topic-title">Likely outcome</div><div class="comp-topic-sub">What many patients experience without billing review resources</div></div>
        <div class="comp-cell diy"><div class="comp-cell-icon icon-bad"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991B1B" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></div><div class="comp-cell-text">Many patients are unfamiliar with billing review resources.</div></div>
        <div class="comp-cell our-col"><div class="comp-cell-icon icon-good"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="comp-cell-text">Organized billing review documentation prepared and ready to reference.</div></div>
      </div>
      <div class="comp-cta-row">
        <div class="comp-cta-cell topic-verdict">Outcome</div>
        <div class="comp-cta-cell"><div class="verdict-label">Typical result</div><div class="verdict-val-diy">Unprepared</div></div>
        <div class="comp-cta-cell ours-verdict"><div class="verdict-label">Typical result</div><div class="verdict-val-ours">Documentation prepared</div></div>
      </div>
    </div>
    <div class="comp-below">
      <div class="comp-below-text">
        <div class="comp-below-title">Every patient has the right to understand their medical bill and access independent review resources.</div>
        <div class="comp-below-sub">Independent billing review and dispute documentation preparation service. No medical knowledge required.</div>
      </div>
      <button class="btn-comp-cta" data-cta="true"close-section').scrollIntoView({behavior:'smooth'})">Start My Billing Review &nbsp;&rarr;</button>
    </div>
  </div>
</section>


<!-- REAL-WORLD PROOF -->
<section style="padding:72px 24px;background:var(--cream);">
  <div style="max-width:680px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-size:0.66rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--teal);margin-bottom:14px;">Example billing review findings</div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.5rem,3.5vw,2.1rem);font-weight:800;color:var(--ink);line-height:1.2;letter-spacing:-0.025em;margin-bottom:10px;">
        What a billing review<br><em style="font-style:italic;color:var(--navy);">may surface in your documents</em>
      </h2>
      <p style="font-size:0.85rem;color:var(--ink3);max-width:460px;margin:0 auto;line-height:1.7;">
        These are illustrative examples of the categories our review process analyzes. They are not guarantees of specific findings or outcomes for your bill.
      </p>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">

      <div class="proof-card" style="background:var(--warm);border:1px solid var(--stone);border-radius:18px;padding:24px 24px 20px;display:flex;gap:18px;align-items:flex-start;position:relative;overflow:hidden;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--red);border-radius:18px 0 0 18px;opacity:0.6;"></div>
        <div style="padding-left:6px;flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
            <span style="font-size:0.65rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--red);background:var(--redL);border-radius:6px;padding:3px 9px;">Duplicate Charge Identified</span>
            <span style="font-size:0.65rem;color:var(--ink4);font-style:italic;">Illustrative example</span>
          </div>
          <div style="font-size:0.92rem;font-weight:700;color:var(--ink);margin-bottom:6px;letter-spacing:-0.01em;">CPT code billed on two separate line items for the same date of service</div>
          <div style="font-size:0.8rem;color:var(--ink3);line-height:1.7;">Our review identified a procedure code that appeared on two separate line items within the same billing statement for the same date of service. The patient received documentation referencing this discrepancy and guidance on requesting an itemized review from the billing department.</div>
        </div>
      </div>

      <div class="proof-card" style="background:var(--warm);border:1px solid var(--stone);border-radius:18px;padding:24px 24px 20px;display:flex;gap:18px;align-items:flex-start;position:relative;overflow:hidden;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--amber);border-radius:18px 0 0 18px;opacity:0.6;"></div>
        <div style="padding-left:6px;flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
            <span style="font-size:0.65rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--amber);background:var(--amberL);border-radius:6px;padding:3px 9px;">Benchmark Discrepancy Noted</span>
            <span style="font-size:0.65rem;color:var(--ink4);font-style:italic;">Illustrative example</span>
          </div>
          <div style="font-size:0.92rem;font-weight:700;color:var(--ink);margin-bottom:6px;letter-spacing:-0.01em;">Facility fee amount appeared above the published Medicare allowable rate for the same service category</div>
          <div style="font-size:0.8rem;color:var(--ink3);line-height:1.7;">A comparison against published Medicare benchmark rates for the relevant CPT code indicated that the facility fee billed exceeded the standard Medicare allowable amount for that service category. A dispute reference letter was prepared citing this benchmark comparison for the patient's informational use.</div>
        </div>
      </div>

      <div class="proof-card" style="background:var(--warm);border:1px solid var(--stone);border-radius:18px;padding:24px 24px 20px;display:flex;gap:18px;align-items:flex-start;position:relative;overflow:hidden;">
        <div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--teal);border-radius:18px 0 0 18px;opacity:0.6;"></div>
        <div style="padding-left:6px;flex:1;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
            <span style="font-size:0.65rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--teal);background:var(--tealL);border-radius:6px;padding:3px 9px;">Coding Inconsistency Flagged</span>
            <span style="font-size:0.65rem;color:var(--ink4);font-style:italic;">Illustrative example</span>
          </div>
          <div style="font-size:0.92rem;font-weight:700;color:var(--ink);margin-bottom:6px;letter-spacing:-0.01em;">Billed service complexity level appeared inconsistent with standard coding guidelines for the documented visit type</div>
          <div style="font-size:0.8rem;color:var(--ink3);line-height:1.7;">A review of the evaluation and management codes on the bill indicated that the complexity level billed may not align with standard coding guidelines for the documented service type. Our review prepared a structured documentation package referencing the relevant coding guidelines for the patient's use in discussing the bill with their provider.</div>
        </div>
      </div>

    </div>

    <div style="margin-top:18px;background:var(--navyL);border:1px solid rgba(26,53,96,0.12);border-radius:12px;padding:14px 18px;font-size:0.72rem;color:var(--ink3);line-height:1.7;text-align:center;">
      Examples above are illustrative of the categories our review process may identify. They are not representations of guaranteed findings or outcomes. Individual billing reviews vary based on the information submitted. Not legal, medical, or financial advice.
    </div>
  </div>
</section>


`;
const SCENARIO_HTML = `<!-- EXAMPLE SCENARIOS -->
<section style="padding:72px 24px;background:var(--cream);">
  <div style="max-width:680px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-size:0.66rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);margin-bottom:14px;">Example billing situations reviewed</div>
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.5rem,3.5vw,2.1rem);font-weight:800;color:var(--ink);line-height:1.2;letter-spacing:-0.025em;margin-bottom:10px;">
        Patients in situations<br><em style="font-style:italic;color:var(--green);">just like yours</em>
      </h2>
      <p style="font-size:0.85rem;color:var(--ink3);max-width:460px;margin:0 auto;line-height:1.7;">
        These anonymized scenarios illustrate the types of billing situations our review process is designed to help document and clarify.
      </p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;">

      <div class="scenario-card" style="background:var(--warm);border:1px solid var(--stone);border-radius:18px;padding:24px 22px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--navyL);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--navy)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--ink);line-height:1.2;">Retired Medicare Patient</div>
            <div style="font-size:0.66rem;color:var(--ink4);">Hospital outpatient visit</div>
          </div>
        </div>
        <p style="font-size:0.82rem;color:var(--ink3);line-height:1.72;margin-bottom:12px;">
          After receiving a hospital statement that included charges she did not recognize, a retired patient in her late 60s submitted her bill for review. She was unfamiliar with the CPT codes listed and unsure whether her Medicare coverage had been correctly applied.
        </p>
        <div style="background:var(--navyL);border-radius:10px;padding:10px 13px;font-size:0.75rem;color:var(--navy);line-height:1.6;">
          <strong>Review prepared:</strong> CPT code reference breakdown, Medicare benchmark comparison, insurance billing reference analysis, and a structured dispute letter for her records.
        </div>
      </div>

      <div class="scenario-card" style="background:var(--warm);border:1px solid var(--stone);border-radius:18px;padding:24px 22px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--tealL);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--ink);line-height:1.2;">Retired School Teacher</div>
            <div style="font-size:0.66rem;color:var(--ink4);">Emergency room balance</div>
          </div>
        </div>
        <p style="font-size:0.82rem;color:var(--ink3);line-height:1.72;margin-bottom:12px;">
          A retired teacher received an ER billing statement months after her visit. The balance was significantly higher than she expected given her insurance coverage. She was unsure which charges were her responsibility and whether the No Surprises Act applied to her situation.
        </p>
        <div style="background:var(--tealL);border-radius:10px;padding:10px 13px;font-size:0.75rem;color:var(--teal);line-height:1.6;">
          <strong>Review prepared:</strong> ER billing code reference review, No Surprises Act applicability analysis, insurance billing reference, and a structured communication guide for contacting the billing department.
        </div>
      </div>

      <div class="scenario-card" style="background:var(--warm);border:1px solid var(--stone);border-radius:18px;padding:24px 22px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--greenL);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--ink);line-height:1.2;">Parent Reviewing Child's Bill</div>
            <div style="font-size:0.66rem;color:var(--ink4);">Outpatient procedure charges</div>
          </div>
        </div>
        <p style="font-size:0.82rem;color:var(--ink3);line-height:1.72;margin-bottom:12px;">
          A parent received an outpatient billing statement for her child's procedure that included several unfamiliar line items. One procedure code appeared more than once on the itemized bill. She wanted to understand the charges before making any payment.
        </p>
        <div style="background:var(--greenL);border-radius:10px;padding:10px 13px;font-size:0.75rem;color:var(--green);line-height:1.6;">
          <strong>Review prepared:</strong> Line-item CPT code reference analysis, duplicate charge identification, Medicare benchmark comparison for reference, and a dispute documentation package.
        </div>
      </div>

      <div class="scenario-card" style="background:var(--warm);border:1px solid var(--stone);border-radius:18px;padding:24px 22px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--amberL);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div>
            <div style="font-size:0.78rem;font-weight:700;color:var(--ink);line-height:1.2;">Insured Employee, Age 48</div>
            <div style="font-size:0.66rem;color:var(--ink4);">Post-insurance adjustment discrepancy</div>
          </div>
        </div>
        <p style="font-size:0.82rem;color:var(--ink3);line-height:1.72;margin-bottom:12px;">
          An insured employee received a bill from a specialist after insurance adjustments had been applied. The remaining balance did not match what his Explanation of Benefits document showed as his responsibility. He submitted the bill to understand the discrepancy.
        </p>
        <div style="background:var(--amberL);border-radius:10px;padding:10px 13px;font-size:0.75rem;color:var(--amber);line-height:1.6;">
          <strong>Review prepared:</strong> EOB vs billed amount cross-reference analysis, in-network rate applicability review, insurance billing reference analysis, and a structured letter for the billing department.
        </div>
      </div>

    </div>

    <div style="margin-top:18px;background:var(--navyL);border:1px solid rgba(26,53,96,0.12);border-radius:12px;padding:14px 18px;font-size:0.72rem;color:var(--ink3);line-height:1.7;text-align:center;">
      All scenarios above are anonymized and illustrative. They represent common billing review categories and do not represent guaranteed findings, specific outcomes, or individual patient results.
    </div>
  </div>
</section>

`;
const TRUST_HTML    = `<!-- TRUST STACK -->
<section class="trust-section">
  <div class="section-inner">
    <div class="section-eyebrow eyebrow-teal">Why patients trust us</div>
    <h2 class="section-h">What you can expect<br><em class="em-navy">working with us</em></h2>
    <div class="trust-items" style="margin-top:12px">
      <div class="trust-item">
        <div class="trust-icon icon-teal-bg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0E7490" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </div>
        <div class="trust-item" style="flex:1;background:transparent;border:none;padding:0;gap:0;flex-direction:column;align-items:flex-start">
          <div class="trust-title">Confidential document handling</div>
          <div class="trust-desc">Your bill and personal information are handled with strict confidentiality. Documents are used solely to prepare your billing review and are not retained, shared, or sold.</div>
        </div>
        <div class="trust-badge">Private</div>
      </div>
      <div class="trust-item">
        <div class="trust-icon icon-navy-bg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A3560" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <div class="trust-item" style="flex:1;background:transparent;border:none;padding:0;gap:0;flex-direction:column;align-items:flex-start">
          <div class="trust-title">Built for the U.S. billing system</div>
          <div class="trust-desc">Our review process is built specifically for American healthcare billing — Medicare rates, federal law, and U.S. provider practices.</div>
        </div>
        <div class="trust-badge">U.S. focused</div>
      </div>
      <div class="trust-item">
        <div class="trust-icon icon-green-bg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        </div>
        <div class="trust-item" style="flex:1;background:transparent;border:none;padding:0;gap:0;flex-direction:column;align-items:flex-start">
          <div class="trust-title">Billing review and dispute documentation</div>
          <div class="trust-desc">We prepare a dispute reference letter citing applicable federal billing protections, a structured phone communication guide, and a step-by-step action plan for your reference when contacting your provider's billing department.</div>
        </div>
        <div class="trust-badge">Complete package</div>
      </div>
      <div class="trust-item">
        <div class="trust-icon icon-warm-bg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#92400E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="1"/><polyline points="17 22 17 7 7 7 7 22"/><line x1="2" y1="11" x2="22" y2="11"/><line x1="10" y1="11" x2="10" y2="22"/><line x1="14" y1="11" x2="14" y2="22"/><path d="M10 7V4a2 2 0 0 1 4 0v3"/></svg>
        </div>
        <div class="trust-item" style="flex:1;background:transparent;border:none;padding:0;gap:0;flex-direction:column;align-items:flex-start">
          <div class="trust-title">Experienced with all major U.S. insurers</div>
          <div class="trust-desc">Our billing review process covers all major insurance providers and hospital billing systems across the United States.</div>
        </div>
        <div class="trust-badge">All major insurers</div>
      </div>
    </div>
  </div>
</section>


`;
const BRIDGE_HTML   = `<!-- EMOTIONAL BRIDGE -->
<section style="padding:72px 24px;background:var(--warm);">
  <div style="max-width:600px;margin:0 auto;text-align:center;">
    <div style="font-size:0.66rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--ink3);margin-bottom:18px;">A note before you begin</div>
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:clamp(1.5rem,3.5vw,2rem);font-weight:800;color:var(--ink);line-height:1.2;letter-spacing:-0.025em;margin-bottom:22px;">
      Medical bills are confusing<br><em style="font-style:italic;color:var(--navy);">by design. That is not your fault.</em>
    </h2>
    <div style="text-align:left;background:#fff;border:1px solid var(--stone);border-radius:20px;padding:28px 28px 24px;margin-bottom:0;">
      <p style="font-family:'DM Sans',sans-serif;font-size:0.92rem;color:var(--ink2);line-height:1.82;margin-bottom:14px;">
        Many patients avoid reviewing their medical bills not because they do not care, but because billing statements are written in a language most people were never taught to read. CPT procedure codes, ICD-10 diagnosis references, explanation of benefits documents, and provider charge breakdowns can feel unfamiliar and overwhelming — even to educated, attentive adults.
      </p>
      <p style="font-family:'DM Sans',sans-serif;font-size:0.92rem;color:var(--ink2);line-height:1.82;margin-bottom:14px;">
        According to published research from <strong style="color:var(--ink);">The Commonwealth Fund (2024)</strong>, 45% of insured Americans received unexpected bills for services they believed were covered — and most did not know where to begin when reviewing them.
      </p>
      <p style="font-family:'DM Sans',sans-serif;font-size:0.92rem;color:var(--ink2);line-height:1.82;margin-bottom:0;">
        Reviewing a medical bill is a normal, reasonable, and often important step in managing your healthcare. You do not need a medical background or legal training. You need organized documentation, clear references, and a structured process. That is what we prepare for you.
      </p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:16px;">
      <div class="tile-white" style="background:#fff;border:1px solid var(--stone);border-radius:12px;padding:14px 12px;text-align:center;">
        <div style="font-size:0.75rem;font-weight:700;color:var(--navy);margin-bottom:3px;">CPT codes explained</div>
        <div style="font-size:0.7rem;color:var(--ink3);line-height:1.5;">Plain-language billing code reference included</div>
      </div>
      <div class="tile-white" style="background:#fff;border:1px solid var(--stone);border-radius:12px;padding:14px 12px;text-align:center;">
        <div style="font-size:0.75rem;font-weight:700;color:var(--navy);margin-bottom:3px;">Benchmark comparisons</div>
        <div style="font-size:0.7rem;color:var(--ink3);line-height:1.5;">Medicare-published rate comparisons provided</div>
      </div>
      <div class="tile-white" style="background:#fff;border:1px solid var(--stone);border-radius:12px;padding:14px 12px;text-align:center;">
        <div style="font-size:0.75rem;font-weight:700;color:var(--navy);margin-bottom:3px;">Dispute guide prepared</div>
        <div style="font-size:0.7rem;color:var(--ink3);line-height:1.5;">Structured letter and communication guide ready</div>
      </div>
    </div>
  </div>
</section>

`;
const CLOSE_HTML    = `<!-- CLOSE / UPLOAD -->
<section class="close-section" id="close-section">
  <div class="close-inner">
    <div class="close-eyebrow">
      <div class="eyebrow-line"></div>
      Your next step
      <div class="eyebrow-line"></div>
    </div>
    <h2 class="close-h">Every patient has the right<br>to <em>review their bill.</em></h2>
    <p class="close-body">Medical bills in the United States may include coding inconsistencies, duplicate charges, or amounts that appear inconsistent with published Medicare benchmarks. Many patients do not review or question their bills simply because they are unfamiliar with the review process. We provide a structured, documented billing review to help you understand and respond to your charges.</p>

    <div class="upload-card">
      <div class="security-indicator">
        <div class="sec-pulse">
          <div class="sec-core"></div>
          <div class="sec-ring"></div>
          <div class="sec-ring2"></div>
        </div>
        <div class="sec-text">Encrypted document submission &nbsp;&middot;&nbsp; Handled with strict confidentiality</div>
      </div>
      <div class="upload-card-title">How would you like to share your bill?</div>
      <div class="upload-card-sub" style="margin-bottom:18px;">Choose the easiest option for you. All three work perfectly.</div>

      <!-- Uploaded state badge -->
      <div id="uploaded-state" class="uploaded-state" style="margin-bottom:14px;">
        <div class="uploaded-check">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style="flex:1">
          <div class="uploaded-name" id="uploaded-name">bill.pdf</div>
          <div class="uploaded-sub">Ready &mdash; tap Start My Review below</div>
        </div>
        <button class="uploaded-remove" data-cta="true">&#215;</button>
      </div>

      <!-- Three input method cards -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px;">

        <!-- Card 1: Upload -->
        <div id="card-upload" data-cta="true"file-input').click()" style="border:1.5px solid var(--stone);border-radius:14px;padding:18px 10px 14px;text-align:center;cursor:pointer;background:#fff;transition:all 0.18s;position:relative;overflow:hidden;">
          <input type="file" id="file-input" accept="image/*,.pdf,.heic" onchange="handleFile(event)" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
          <div style="width:42px;height:42px;background:var(--navyL);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;transition:all 0.18s;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1F3A68" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
              <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
            </svg>
          </div>
          <div style="font-size:0.78rem;font-weight:700;color:#1F3A68;margin-bottom:3px;line-height:1.3;">Upload Bill</div>
          <div style="font-size:0.63rem;color:var(--ink3);line-height:1.5;">PDF, photo<br>or screenshot</div>
        </div>

        <!-- Card 2: Camera -->
        <div id="card-photo" onclick="triggerCamera()" style="border:1.5px solid var(--stone);border-radius:14px;padding:18px 10px 14px;text-align:center;cursor:pointer;background:#fff;transition:all 0.18s;">
          <div style="width:42px;height:42px;background:var(--tealL);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;transition:all 0.18s;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#1A7A8C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <div style="font-size:0.78rem;font-weight:700;color:#1A7A8C;margin-bottom:3px;line-height:1.3;">Take Photo</div>
          <div style="font-size:0.63rem;color:var(--ink3);line-height:1.5;">Use your phone<br>camera</div>
        </div>

        <!-- Card 3: Type manually -->
        <div id="card-manual" onclick="toggleManualForm()" style="border:1.5px solid var(--stone);border-radius:14px;padding:18px 10px 14px;text-align:center;cursor:pointer;background:#fff;transition:all 0.18s;">
          <div style="width:42px;height:42px;background:var(--greenL);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;transition:all 0.18s;">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#2F7A4F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div style="font-size:0.78rem;font-weight:700;color:#2F7A4F;margin-bottom:3px;line-height:1.3;">Type It In</div>
          <div style="font-size:0.63rem;color:var(--ink3);line-height:1.5;">Enter bill details<br>manually</div>
        </div>

      </div>

      <!-- Manual entry form — hidden until card-manual tapped -->
      <div id="manual-form" style="display:none;background:var(--navyL);border:1px solid var(--border);border-radius:13px;padding:16px 18px;margin-bottom:14px;">
        <div style="font-size:0.68rem;font-weight:700;color:var(--navy);margin-bottom:12px;letter-spacing:0.1em;text-transform:uppercase;">Enter your bill details</div>
        <input placeholder="Hospital or doctor name (optional)" style="width:100%;padding:10px 14px;font-size:0.88rem;font-family:'DM Sans',sans-serif;border:1.5px solid var(--stone);border-radius:9px;background:#fff;color:var(--ink);margin-bottom:8px;outline:none;box-sizing:border-box;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
          <input placeholder="Total bill $" style="width:100%;padding:10px 14px;font-size:0.88rem;font-family:'DM Sans',sans-serif;border:1.5px solid var(--stone);border-radius:9px;background:#fff;color:var(--ink);outline:none;box-sizing:border-box;">
          <input placeholder="Amount you owe $" style="width:100%;padding:10px 14px;font-size:0.88rem;font-family:'DM Sans',sans-serif;border:1.5px solid var(--stone);border-radius:9px;background:#fff;color:var(--ink);outline:none;box-sizing:border-box;">
        </div>
        <input placeholder="Reason for visit (e.g. ER visit, surgery)" style="width:100%;padding:10px 14px;font-size:0.88rem;font-family:'DM Sans',sans-serif;border:1.5px solid var(--stone);border-radius:9px;background:#fff;color:var(--ink);outline:none;box-sizing:border-box;">
      </div>


      <div class="privacy-row">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" stroke-width="1.5" stroke-linecap="round" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><path d="M12 6v4l3 1.5"/></svg>
        <div class="privacy-text"><strong>Your document is handled with strict confidentiality.</strong> We do not store, share, or sell your bill or personal information. Your file is used solely to prepare your review documentation and is not retained after your session.</div>
      </div>

      <button class="btn-cta" data-cta="true"In the live app this starts your billing analysis.')">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        Start My Review
      </button>
      <div class="cta-support">Encrypted upload &nbsp;&middot;&nbsp; Choose your review package to access your full billing analysis</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:10px;margin-bottom:2px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span style="font-size:0.75rem;font-weight:700;color:var(--teal);letter-spacing:0.03em;">Private. Secure. No phone calls required.</span>
      </div>
      
    </div>

    <div class="reassurance-row">
      <div class="reassurance-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>No upfront cost</div>
      <div class="reassurance-dot"></div>
      <div class="reassurance-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Billing review documentation prepared promptly</div>
      <div class="reassurance-dot"></div>
      <div class="reassurance-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>100% confidential</div>
    </div>
  </div>
</section>



`;
const FOOTER_HTML   = `<!-- FOOTER -->
<footer>
  <p>United Patient Advocate is an independent medical billing review and dispute preparation service. We provide educational billing analysis, Medicare benchmark comparisons, coding review references, and consumer dispute documentation tools. Results vary based on provider policies, insurer determinations, and individual circumstances. Nothing on this site constitutes legal, medical, or financial advice. Institutions referenced &mdash; including Harvard Medical School, Johns Hopkins Medicine, CMS, CFPB, AARP, Commonwealth Fund, UnitedHealthcare, Aetna, Cigna, Blue Cross Blue Shield, and Humana &mdash; are cited solely for informational and research reference purposes. United Patient Advocate is not affiliated with, endorsed by, or sponsored by any referenced institution. Due to the instant digital delivery of personalized content, all sales are final. &copy; 2026 United Patient Advocate &mdash; unitedpatientadvocate.com</p>
</footer>

<script>
// Scroll trap bill selector
var billInfo = {
  low: 'For bills under $1,000, our review covers CPT code reference verification, Medicare benchmark comparison, and duplicate charge identification. A dispute letter and phone script are prepared for your reference.',
  mid: 'For bills in the $1,000\\u2013$5,000 range, our full review includes CPT and ICD-10 coding analysis, Medicare benchmark comparison, duplicate detection, upcoding indicators, and insurance billing analysis.',
  high: 'For bills over $5,000, our review covers all seven billing reference categories: code review, Medicare benchmarking, duplicate charge identification, coding mismatch indicators, insurance billing reference analysis, and a complete dispute documentation package.'
};
function selectBill(el, range){
  document.querySelectorAll('.bill-option').forEach(function(b){ b.classList.remove('selected'); });
  el.classList.add('selected');
  var info = document.getElementById('trap-info');
  var text = document.getElementById('trap-info-text');
  text.innerHTML = '<strong>What your review covers:</strong> ' + billInfo[range];
  info.classList.add('show');
  document.getElementById('trap-continue').classList.add('show');
  setTimeout(function(){ document.getElementById('trap-continue').scrollIntoView({behavior:'smooth',block:'nearest'}); }, 180);
}

// Drag and drop
var dz = document.getElementById('dropzone');
if(dz){
  dz.addEventListener('dragover', function(e){ e.preventDefault(); dz.classList.add('drag-over'); });
  dz.addEventListener('dragleave', function(){ dz.classList.remove('drag-over'); });
  dz.addEventListener('drop', function(e){
    e.preventDefault(); dz.classList.remove('drag-over');
    var f = e.dataTransfer.files[0];
    if(f) showUploaded(f.name);
  });
}
function handleFile(e){
  var f = e.target.files[0];
  if(f) showUploaded(f.name);
}
function toggleManualForm(){
  var form = document.getElementById('manual-form');
  var card = document.getElementById('card-manual');
  var isOpen = form.style.display === 'block';
  form.style.display = isOpen ? 'none' : 'block';
  card.style.borderColor = isOpen ? '' : 'var(--green)';
  card.style.background = isOpen ? '' : 'var(--greenL)';
  card.style.boxShadow = isOpen ? '' : '0 4px 16px rgba(47,122,79,0.15)';
}
function triggerCamera(){
  var i = document.createElement('input');
  i.type='file'; i.accept='image/*'; i.capture='environment';
  i.onchange = function(e){ if(e.target.files[0]) showUploaded(e.target.files[0].name); };
  i.click();
}
function selectMethod(type){
  // highlight selected card
  document.querySelectorAll('.input-method-card').forEach(function(card){
    card.style.borderColor = '';
    card.style.boxShadow = '';
  });
  var card = document.getElementById('card-' + type);
  if(card){
    card.style.borderColor = 'var(--navy)';
    card.style.background = 'var(--navyL)';
    card.style.boxShadow = '0 4px 16px rgba(31,58,104,0.15)';
  }
  // hide manual form if switching away
  document.getElementById('manual-form').style.display = 'none';
}

function showUploaded(name){
  document.getElementById('uploaded-name').textContent = name;
  document.getElementById('uploaded-state').classList.add('show');
  document.getElementById('dropzone').style.display = 'none';
}
function removeFile(e){
  e.stopPropagation();
  document.getElementById('file-input').value = '';
  document.getElementById('uploaded-state').classList.remove('show');
  document.getElementById('dropzone').style.display = 'block';
}

// Night mode stub
var night = false;
function toggleDark(){
  night = !night;
  var r = document.documentElement;
  if(night){
    r.style.setProperty('--cream','#1A1814');
    r.style.setProperty('--warm','#252219');
    r.style.setProperty('--stone','#3A352A');
    r.style.setProperty('--ink','#F0EDE6');
    r.style.setProperty('--ink2','#C8C4BA');
    r.style.setProperty('--ink3','#8A857A');
    r.style.setProperty('--border','rgba(255,255,255,0.07)');
  } else {
    r.style.setProperty('--cream','#FAFAF7');
    r.style.setProperty('--warm','#F4F1EA');
    r.style.setProperty('--stone','#E6E1D6');
    r.style.setProperty('--ink','#18181B');
    r.style.setProperty('--ink2','#3F3F46');
    r.style.setProperty('--ink3','#71717A');
    r.style.setProperty('--border','rgba(24,24,27,0.08)');
  }
}
</script>
`;

// ─── THEME ───────────────────────────────────────────────────────────────────
function useTheme() {
  const get = () => { try { return localStorage.getItem("upa-mode") || "light"; } catch { return "light"; } };
  const [mode, setMode] = useState(get);
  const toggle = useCallback(() => {
    setMode(m => {
      const n = m === "light" ? "dark" : "light";
      try { localStorage.setItem("upa-mode", n); } catch {}
      document.body.classList.toggle("dark-mode", n === "dark");
      return n;
    });
  }, []);
  // Apply on mount immediately — fixes font/color race condition
  useEffect(() => {
    document.body.classList.toggle("dark-mode", mode === "dark");
  }, []);
  return { mode, toggle };
}

// ─── ICONS ───────────────────────────────────────────────────────────────────
const MoonIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>;
const SunIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
const GreenBtn = ({ children, onClick, style = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? "#94A3B8" : "linear-gradient(135deg,#2F7A4F,#276644)",
    color:"#fff", border:"none", borderRadius:12, padding:"14px 24px",
    fontFamily:"inherit", fontSize:16, fontWeight:700,
    cursor: disabled ? "not-allowed" : "pointer",
    boxShadow: disabled ? "none" : "0 4px 16px rgba(47,122,79,0.35)",
    transition:"all .18s", ...style
  }}>{children}</button>
);

const NavyBtn = ({ children, onClick, style = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? "#94A3B8" : "#1F3A68", color:"#fff",
    border:"none", borderRadius:12, padding:"14px 24px",
    fontFamily:"inherit", fontSize:16, fontWeight:700,
    cursor: disabled ? "not-allowed" : "pointer", transition:"all .18s", ...style
  }}>{children}</button>
);

// ─── SHARE MODAL ─────────────────────────────────────────────────────────────
const ShareModal = ({ onClose }) => {
  const url = "https://unitedpatientadvocate.com";
  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }} onClick={onClose}>
      <div style={{ background:"var(--cream,#F2F5F9)",borderRadius:20,padding:"32px 28px",maxWidth:420,width:"100%" }} onClick={e=>e.stopPropagation()}>
        <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,fontWeight:800,color:"var(--ink,#1E293B)",marginBottom:8 }}>Share with someone who needs this</h3>
        <p style={{ color:"var(--ink3,#6B7280)",fontSize:14,lineHeight:1.7,marginBottom:20 }}>Know someone with a confusing medical bill? Share this link.</p>
        <div style={{ display:"flex",gap:10,marginBottom:12 }}>
          <div style={{ flex:1,padding:"11px 14px",background:"var(--warm,#E8EDF5)",borderRadius:10,fontSize:13,color:"var(--ink3,#6B7280)",fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{url}</div>
          <button onClick={()=>navigator.clipboard.writeText(url)} style={{ background:"#1F3A68",color:"#fff",border:"none",borderRadius:10,padding:"11px 18px",fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Copy</button>
        </div>
        <button onClick={onClose} style={{ display:"block",width:"100%",background:"none",border:"1px solid var(--stone,#CBD5E1)",borderRadius:10,padding:"10px",color:"var(--ink3,#6B7280)",cursor:"pointer",fontFamily:"inherit" }}>Close</button>
      </div>
    </div>
  );
};

// ─── LANDING SCREEN ───────────────────────────────────────────────────────────
function Landing({ onStart, mode, toggleMode }) {
  const [showShare, setShowShare] = useState(false);
  const containerRef = useRef(null);
  const dark = mode === "dark";

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById("upa-landing-css")) {
      const style = document.createElement("style");
      style.id = "upa-landing-css";
      style.textContent = LANDING_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // Apply dark mode to container
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.classList.toggle("dark-mode", dark);
    }
  }, [dark]);

  // Wire all interactive elements after HTML renders
  useEffect(() => {
    // ── Dark mode toggle ─────────────────────────────────────────────────
    window.toggleDark = toggleMode;
    const nightBtn = document.getElementById("night-toggle");
    if (nightBtn) {
      nightBtn.onclick = (e) => { e.stopPropagation(); toggleMode(); };
    }

    // ── selectBill for scroll trap ────────────────────────────────────────
    window.selectBill = function(el, val) {
      document.querySelectorAll(".bill-option").forEach(o => o.classList.remove("selected"));
      if (el) el.classList.add("selected");
      const msgs = {
        low:  "For bills under $1,000, our review covers CPT code reference verification, Medicare benchmark comparison, and duplicate charge identification. A dispute letter and phone script are prepared for your reference.",
        mid:  "Bills in this range most commonly contain ER facility fee errors, duplicate line items, and in-network rate discrepancies. Your review covers all of these in full detail.",
        high: "High-value bills carry the greatest risk of coding complexity errors, upcoding, and duplicate charges. Your comprehensive review includes a full Medicare benchmark analysis and multi-document dispute package."
      };
      const infoEl = document.getElementById("trap-info");
      const textEl = document.getElementById("trap-info-text");
      const contEl = document.getElementById("trap-continue");
      if (textEl) textEl.innerHTML = "<strong>What your review covers:</strong> " + msgs[val];
      if (infoEl) infoEl.style.display = "flex";
      if (contEl) contEl.style.display = "block";
    };

    // ── Upload Bill card → file picker ────────────────────────────────────
    const uploadCard = document.getElementById("card-upload");
    const fileInput  = document.getElementById("file-input");
    if (uploadCard && fileInput) {
      uploadCard.onclick = (e) => { e.stopPropagation(); fileInput.click(); };
      fileInput.onchange = () => { if (fileInput.files[0]) onStart(); };
    } else if (uploadCard) {
      uploadCard.onclick = (e) => {
        e.stopPropagation();
        const inp = document.createElement("input");
        inp.type = "file"; inp.accept = "image/*,.pdf,.heic";
        inp.onchange = () => { if (inp.files[0]) onStart(); };
        inp.click();
      };
    }

    // ── Take Photo card → camera ──────────────────────────────────────────
    const photoCard = document.getElementById("card-photo");
    if (photoCard) {
      photoCard.onclick = (e) => {
        e.stopPropagation();
        const cam = document.createElement("input");
        cam.type = "file"; cam.accept = "image/*"; cam.capture = "environment";
        cam.onchange = () => { if (cam.files[0]) onStart(); };
        cam.click();
      };
    }

    // ── Type It In card → launch form directly ────────────────────────────
    const manualCard = document.getElementById("card-manual");
    if (manualCard) {
      manualCard.onclick = (e) => { e.stopPropagation(); onStart(); };
    }

    // ── toggleManualForm (if referenced elsewhere) ────────────────────────
    window.toggleManualForm = () => onStart();

    // ── Share button ──────────────────────────────────────────────────────
    const shareBtn = document.getElementById("share-btn");
    if (shareBtn) shareBtn.onclick = (e) => { e.stopPropagation(); setShowShare(true); };

  }, [onStart, toggleMode]);

  // ── Event delegation ──────────────────────────────────────────────────────
  // Hero/nav CTAs → scroll to upload section
  // Upload section "Start My Review" → launch form
  const handleClick = (e) => {
    // Let gumroad links through
    if (e.target.closest('a[href*="gumroad"]')) return;

    // Upload/Photo/Manual cards handled by direct onclick above — don't re-intercept
    if (e.target.closest("#card-upload, #card-photo, #card-manual")) return;

    // Night toggle handled above
    if (e.target.closest("#night-toggle")) return;

    // Share button handled above
    if (e.target.closest("#share-btn")) return;

    // "Start My Review" / close-btn / submit buttons → launch form
    const startBtn = e.target.closest(".close-btn, .btn-cta, #submit-btn, [data-start='true']");
    if (startBtn) {
      e.preventDefault();
      onStart();
      return;
    }

    // Scroll trap continue button → scroll to close section
    const trapBtn = e.target.closest(".btn-continue-trap");
    if (trapBtn) {
      e.preventDefault();
      const dest = document.getElementById("close-section");
      if (dest) dest.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    // Hero / nav CTAs → scroll to close/upload section
    const heroCta = e.target.closest(".btn-hero, .nav-btn, [data-cta='true']");
    if (heroCta) {
      e.preventDefault();
      const dest = document.getElementById("close-section");
      if (dest) {
        dest.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        onStart();
      }
      return;
    }
  };

  // ── Build nav HTML (custom — not from HTML file) ──────────────────────────
  const navHTML = `
  <nav style="background:var(--cream);border-bottom:1px solid var(--stone);padding:10px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;position:sticky;top:0;z-index:200;backdrop-filter:blur(10px);">
    <div style="display:flex;align-items:center;gap:11px;">
      <img src="${LOGO_B64}" alt="United Patient Advocate" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';" style="height:88px;width:auto;display:block;flex-shrink:0;" />
      <img src="${LOGO_B64}" alt="United Patient Advocate" onerror="this.onerror=null;this.src='${LOGO_FALLBACK}';" style="height:74px;width:auto;display:block;flex-shrink:0;" />
      <div style="display:flex;flex-direction:column;line-height:1;">
        <div style="font-family:'DM Sans',sans-serif;font-size:1.32rem;letter-spacing:-0.025em;white-space:nowrap;line-height:1.05;">
          <span style="font-weight:900;color:var(--navy);">United</span>
          <span style="font-weight:500;color:var(--teal);"> Patient</span>
        </div>
        <div style="font-family:'DM Sans',sans-serif;font-size:0.62rem;font-weight:600;letter-spacing:0.32em;text-transform:uppercase;color:var(--ink4);margin-top:4px;text-align:center;">Advocate</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <button id="night-toggle" style="display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:40px;border:1.5px solid var(--stone);background:transparent;color:var(--ink3);cursor:pointer;font-size:13px;font-weight:600;font-family:'DM Sans',sans-serif;transition:all .2s;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        Night
      </button>
      <button class="nav-btn" style="background:linear-gradient(135deg,#2F7A4F,#276644);color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:14px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;box-shadow:0 4px 14px rgba(47,122,79,0.35);">Review My Bill</button>
    </div>
  </nav>`;

  const fullHTML = [
    URGENCY_HTML, navHTML, HERO_HTML, CRED_HTML, RESEARCH_HTML,
    TRAP_HTML, ANALYSIS_HTML, REVIEW_HTML, COMP_HTML,
    SCENARIO_HTML, TRUST_HTML, BRIDGE_HTML, CLOSE_HTML, FOOTER_HTML
  ].join("\n");

  return (
    <div>
      {showShare && <ShareModal onClose={() => setShowShare(false)} />}
      <div
        ref={containerRef}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: fullHTML }}
        style={{ fontFamily:"'DM Sans',sans-serif" }}
      />
    </div>
  );
}

// ─── FORM SCREEN ──────────────────────────────────────────────────────────────
const lS = { display:"block", fontSize:14, fontWeight:700, marginBottom:7 };

function Form({ step, setStep, form, update, onSubmit, onBack, mode, toggleMode }) {
  const ok1 = !!(form.visitReason && form.totalBilled);
  const ok2 = !!form.servicesReceived;
  const dark = mode === "dark";

  const surface = dark ? "#1C2035" : "#fff";
  const bg      = dark ? "#141924" : "#F2F5F9";
  const ink     = dark ? "#F0F4F8" : "#1E293B";
  const ink3    = dark ? "#94A3B8" : "#6B7280";
  const border  = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const border2 = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";
  const navyL   = dark ? "#1A2A45" : "#EBF0FA";

  const C = ({ field, val, label }) => (
    <button onClick={() => update(field, val)} style={{
      flex:1, padding:"13px 10px", borderRadius:11, cursor:"pointer", textAlign:"center",
      fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, lineHeight:1.3,
      border:`1.5px solid ${form[field]===val ? "#1F3A68" : border2}`,
      background: form[field]===val ? (dark?"#1A2A48":"#EBF0FA") : surface,
      color: form[field]===val ? "#1F3A68" : ink3,
      transition:"all .15s"
    }}>{label}</button>
  );

  const inputStyle = {
    width:"100%", padding:"13px 15px", fontSize:16, borderRadius:12,
    border:`1.5px solid ${border2}`, background: dark?"#14192A":surface,
    color:ink, marginBottom:18, boxSizing:"border-box",
    fontFamily:"'DM Sans',sans-serif", outline:"none",
    // Remove ugly number spinners
    MozAppearance:"textfield"
  };

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:bg, minHeight:"100vh", color:ink }}>
      {/* Inline style to remove webkit spinners */}
      <style>{`input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }`}</style>

      <nav style={{ background:surface, borderBottom:`1px solid ${border}`, padding:"10px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
          <img src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:70, width:"auto", flexShrink:0 }} />
          <img src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:60, width:"auto", flexShrink:0 }} />
          <div style={{ display:"flex", flexDirection:"column", lineHeight:1 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"1.2rem", letterSpacing:"-0.025em", whiteSpace:"nowrap", lineHeight:1.05 }}>
              <span style={{ fontWeight:900, color:dark?"#fff":"#1F3A68" }}>United</span>
              <span style={{ fontWeight:500, color:"#1A7A8C" }}> Patient</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:"0.5rem", fontWeight:600, letterSpacing:"0.3em", textTransform:"uppercase", color:dark?"#64748B":"#94A3B8", marginTop:3, textAlign:"center" }}>Advocate</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          <button onClick={toggleMode} style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:40,border:`1.5px solid ${border2}`,background:"transparent",color:ink3,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>
            {dark ? <SunIcon/> : <MoonIcon/>} {dark?"Day":"Night"}
          </button>
          {/* Back to home — fixes Issue 22 */}
          <button onClick={onBack} style={{ background:"none",border:"none",color:ink3,cursor:"pointer",fontSize:13,fontWeight:500,fontFamily:"inherit",textDecoration:"underline" }}>← Home</button>
        </div>
      </nav>

      <div style={{ maxWidth:560, margin:"0 auto", padding:"32px 20px" }}>
        {/* Progress */}
        <div style={{ display:"flex", alignItems:"center", marginBottom:32 }}>
          {[1,2,3].map((n,i) => (
            <div key={n} style={{ display:"flex", alignItems:"center", flex:i<2?1:"none" }}>
              <div style={{ width:38,height:38,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,fontFamily:"inherit",background:step>=n?"#1F3A68":surface,border:`2px solid ${step>=n?"#1F3A68":border2}`,color:step>=n?"#fff":ink3,flexShrink:0 }}>
                {step>n?"✓":n}
              </div>
              {i<2 && <div style={{ flex:1,height:2,background:step>n?"#1F3A68":border2,margin:"0 6px" }}/>}
            </div>
          ))}
        </div>

        <div style={{ background:surface, border:`1px solid ${border}`, borderRadius:18, padding:"32px 28px", boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.07)" }}>
          {step===1 && (
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:ink,marginBottom:7,letterSpacing:"-0.02em" }}>Your Bill Details</h2>
              <p style={{ color:ink3,fontSize:14,marginBottom:22,lineHeight:1.65 }}>Fill in what you know. Even partial information allows us to prepare your review.</p>
              <label style={{...lS,color:ink}}>Hospital or Doctor Name <span style={{ color:ink3,fontWeight:400 }}>(optional)</span></label>
              <input placeholder="e.g. St. Mary's Hospital" value={form.providerName} onChange={e=>update("providerName",e.target.value)} style={inputStyle} />
              <label style={{...lS,color:ink}}>Total Bill Amount *</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:15,top:"50%",transform:"translateY(-70%)",color:ink3,fontSize:16,fontWeight:600 }}>$</span>
                <input style={{...inputStyle,paddingLeft:30}} type="number" placeholder="0.00" value={form.totalBilled} onChange={e=>update("totalBilled",e.target.value)} />
              </div>
              <label style={{...lS,color:ink}}>Amount Left to Pay After Insurance</label>
              <div style={{ position:"relative" }}>
                <span style={{ position:"absolute",left:15,top:"50%",transform:"translateY(-70%)",color:ink3,fontSize:16,fontWeight:600 }}>$</span>
                <input style={{...inputStyle,paddingLeft:30}} type="number" placeholder="0.00" value={form.amountOwed} onChange={e=>update("amountOwed",e.target.value)} />
              </div>
              <label style={{...lS,color:ink}}>Do you have health insurance?</label>
              <div style={{ display:"flex",gap:10,marginBottom:18 }}>
                <C field="hasInsurance" val={true}  label="Yes, I have insurance" />
                <C field="hasInsurance" val={false} label="No insurance" />
              </div>
              {form.hasInsurance && (
                <div>
                  <label style={{...lS,color:ink}}>Type of Insurance</label>
                  <select value={form.insuranceType} onChange={e=>update("insuranceType",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
                    <option value="medicare">Medicare — Government plan age 65+</option>
                    <option value="medicaid">Medicaid</option>
                    <option value="private">Private / Employer Insurance</option>
                    <option value="marketplace">ACA Marketplace Plan</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
              <label style={{...lS,color:ink}}>Why did you visit? *</label>
              <input placeholder="e.g. Chest pain, knee surgery, ER visit" value={form.visitReason} onChange={e=>update("visitReason",e.target.value)} style={inputStyle} />
            </div>
          )}

          {step===2 && (
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:ink,marginBottom:7,letterSpacing:"-0.02em" }}>Visit Details</h2>
              <p style={{ color:ink3,fontSize:14,marginBottom:22,lineHeight:1.65 }}>The more detail you provide, the more specific your dispute documentation will be.</p>
              <label style={{...lS,color:ink}}>Type of visit</label>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18 }}>
                <C field="stayDuration" val="outpatient" label="ER / Outpatient" />
                <C field="stayDuration" val="inpatient"  label="Stayed Overnight" />
                <C field="stayDuration" val="surgery"    label="Surgery / Procedure" />
                <C field="stayDuration" val="office"     label="Doctor Office" />
              </div>
              <label style={{...lS,color:ink}}>Services received? *</label>
              <textarea style={{...inputStyle,minHeight:96,resize:"vertical"}} placeholder="e.g. Blood tests, X-rays, physical therapy..." value={form.servicesReceived} onChange={e=>update("servicesReceived",e.target.value)} />
              <label style={{...lS,color:ink}}>Current bill status</label>
              <select value={form.billStatus} onChange={e=>update("billStatus",e.target.value)} style={{...inputStyle,cursor:"pointer"}}>
                <option value="unpaid">I have not paid anything yet</option>
                <option value="payment_plan">On a monthly payment plan</option>
                <option value="collections">Sent to collections</option>
                <option value="partially_paid">Partially paid</option>
              </select>
              <label style={{...lS,color:ink}}>Any specific concerns? <span style={{ color:ink3,fontWeight:400 }}>(optional)</span></label>
              <textarea style={{...inputStyle,minHeight:88,resize:"vertical"}} placeholder="e.g. Doctor saw me 30 seconds, billed for full consultation..." value={form.specificConcerns} onChange={e=>update("specificConcerns",e.target.value)} />
            </div>
          )}

          {step===3 && (
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:ink,marginBottom:7,letterSpacing:"-0.02em" }}>Confirm &amp; Analyze</h2>
              <p style={{ color:ink3,fontSize:14,marginBottom:22,lineHeight:1.65 }}>Review your information before we prepare your billing analysis.</p>
              <div style={{ background:navyL,border:`1px solid ${border}`,borderRadius:12,padding:"18px 18px 10px" }}>
                {[
                  ["Provider",   form.providerName||"Not provided"],
                  ["Total Billed", form.totalBilled?"$"+Number(form.totalBilled).toLocaleString():"Not provided"],
                  ["You Owe",    form.amountOwed?"$"+Number(form.amountOwed).toLocaleString():"Not provided"],
                  ["Insurance",  form.hasInsurance?form.insuranceType:"None"],
                  ["Reason",     form.visitReason||"Not provided"]
                ].map(([l,v],i)=>(
                  <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:i<4?`1px solid ${border}`:"none" }}>
                    <span style={{ color:ink3,fontSize:13 }}>{l}</span>
                    <span style={{ color:ink,fontWeight:700,fontSize:13,textAlign:"right",maxWidth:"60%" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:dark?"#0D2218":"#E8F5EE",border:`1px solid rgba(47,122,79,0.2)`,borderRadius:10,padding:"12px 15px",fontSize:13,color:dark?"#3DAF6A":"#2F7A4F",marginTop:14,fontWeight:500 }}>
                🔒 Your privacy is protected. We never store, share, or sell your information.
              </div>
            </div>
          )}

          <div style={{ display:"flex",gap:10,marginTop:24 }}>
            {step>1 ? (
              <button onClick={()=>setStep(s=>s-1)} style={{ flex:1,padding:"14px",borderRadius:11,background:"transparent",border:`1.5px solid ${border2}`,color:ink3,fontFamily:"inherit",fontSize:15,fontWeight:600,cursor:"pointer" }}>Back</button>
            ) : (
              <button onClick={onBack} style={{ flex:1,padding:"14px",borderRadius:11,background:"transparent",border:`1.5px solid ${border2}`,color:ink3,fontFamily:"inherit",fontSize:15,fontWeight:600,cursor:"pointer" }}>← Back</button>
            )}
            {step<3 ? (
              <NavyBtn onClick={()=>setStep(s=>s+1)} disabled={(step===1&&!ok1)||(step===2&&!ok2)} style={{ flex:2,fontSize:16,borderRadius:11 }}>Continue</NavyBtn>
            ) : (
              <button onClick={onSubmit} style={{ flex:2,background:"linear-gradient(135deg,#2F7A4F,#276644)",color:"#fff",border:"none",borderRadius:11,padding:"15px",fontFamily:"inherit",fontSize:16,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 16px rgba(47,122,79,0.4)" }}>
                Analyze My Bill Now →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ANALYZING SCREEN ─────────────────────────────────────────────────────────
function Analyzing({ mode }) {
  const dark = mode === "dark";
  const steps = ["Reading your bill details","Cross-referencing Medicare rates","Checking your federal billing rights","Flagging potential discrepancies","Preparing your dispute documents"];
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(()=>setActive(p=>Math.min(p+1,steps.length-1)), 2200);
    return ()=>clearInterval(t);
  }, []);
  const bg=dark?"#141924":"#F2F5F9", surface=dark?"#1C2035":"#fff";
  const ink=dark?"#F0F4F8":"#1E293B", ink3=dark?"#94A3B8":"#6B7280";
  const border=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)";
  return (
    <div className="analyzing-screen" style={{ background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @media (max-width:520px){.analyzing-screen{padding:22px 18px!important;align-items:center!important}.analyzing-inner{max-width:390px!important}.analyzing-logo{height:92px!important;margin-bottom:18px!important}.analyzing-spinner{width:44px!important;height:44px!important;margin-bottom:20px!important}.analyzing-title{font-size:22px!important;line-height:1.12!important;margin-bottom:9px!important}.analyzing-sub{font-size:13.5px!important;line-height:1.65!important;margin-bottom:22px!important;max-width:340px!important;margin-left:auto!important;margin-right:auto!important}.analyzing-card{border-radius:16px!important;padding:18px 20px!important}.analyzing-row{gap:11px!important;padding:10px 0!important}.analyzing-step-text{font-size:13.5px!important;line-height:1.35!important;overflow-wrap:anywhere!important}}`}</style>
      <div className="analyzing-inner" style={{ textAlign:"center",maxWidth:440,width:"100%" }}>
        <img className="analyzing-logo" src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:92,width:"auto",margin:"0 auto 24px",display:"block" }}/>
        <div className="analyzing-spinner" style={{ width:52,height:52,border:"4px solid",borderColor:`transparent transparent ${dark?"#4A7BD4":"#1F3A68"} transparent`,borderRadius:"50%",animation:"spin 0.9s linear infinite",margin:"0 auto 24px" }}/>
        <h2 className="analyzing-title" style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:24,fontWeight:800,color:ink,marginBottom:8,letterSpacing:"-0.03em" }}>Preparing your billing review...</h2>
        <p className="analyzing-sub" style={{ color:ink3,fontSize:14,marginBottom:28,lineHeight:1.7 }}>Analyzing your bill against Medicare rates, federal billing guidelines, and coding standards.</p>
        <div className="analyzing-card" style={{ textAlign:"left",background:surface,borderRadius:16,padding:"20px 22px",border:`1px solid ${border}` }}>
          {steps.map((s,i)=>(
            <div className="analyzing-row" key={i} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<steps.length-1?`1px solid ${border}`:"none" }}>
              <div style={{ width:24,height:24,borderRadius:"50%",background:i<=active?"#2F7A4F":"transparent",border:`2px solid ${i<=active?"#2F7A4F":border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .3s" }}>
                {i<=active && <span style={{ color:"#fff",fontSize:13,fontWeight:700 }}>✓</span>}
              </div>
              <span className="analyzing-step-text" style={{ fontSize:14,color:i<=active?ink:ink3,fontWeight:i===active?700:400,transition:"color .3s",animation:i===active?"pulse 1.5s infinite":"none" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EMAIL CAPTURE ────────────────────────────────────────────────────────────
function EmailCapture({ onContinue, mode }) {
  const [email,setEmail]=useState(""); const [name,setName]=useState(""); const [done,setDone]=useState(false);
  const dark=mode==="dark";
  const bg=dark?"#141924":"#F2F5F9", surface=dark?"#1C2035":"#fff";
  const ink=dark?"#F0F4F8":"#1E293B", ink3=dark?"#94A3B8":"#6B7280";
  const border2=dark?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.14)";
  const iStyle={ width:"100%",padding:"13px 15px",fontSize:16,borderRadius:12,border:`1.5px solid ${border2}`,background:dark?"#14192A":surface,color:ink,marginBottom:12,boxSizing:"border-box",fontFamily:"'DM Sans',sans-serif",outline:"none" };
  const submit=()=>{ if(email){ setDone(true); setTimeout(()=>onContinue(email,name),1200); } };
  return (
    <div style={{ background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"'DM Sans',sans-serif" }}>
      <div style={{ background:surface,border:`1px solid ${dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"}`,borderRadius:18,padding:"40px 32px",maxWidth:460,width:"100%",textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.07)" }}>
        <div style={{ width:56,height:56,borderRadius:"50%",background:dark?"#0D2218":"#E8F5EE",border:"2px solid rgba(47,122,79,0.3)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:24 }}>✓</div>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:ink,marginBottom:8,letterSpacing:"-0.03em" }}>Your billing review is ready.</h2>
        <p style={{ color:ink3,fontSize:14,lineHeight:1.7,marginBottom:24 }}>Enter your email to access your results and receive your complete documentation package after purchase.</p>
        <input type="text"  placeholder="Your first name (optional)" value={name}  onChange={e=>setName(e.target.value)} style={iStyle} />
        <input type="email" placeholder="Your email address *"         value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{...iStyle,marginBottom:20}} />
        {done ? (
          <div style={{ background:dark?"#0D2218":"#E8F5EE",borderRadius:12,padding:14,fontSize:15,color:dark?"#3DAF6A":"#2F7A4F",fontWeight:700 }}>Opening your results...</div>
        ) : (
          <GreenBtn onClick={submit} disabled={!email} style={{ width:"100%",fontSize:16,padding:"16px",borderRadius:12 }}>View My Billing Review →</GreenBtn>
        )}
        <div style={{ fontSize:11,color:ink3,marginTop:12 }}>We do not send marketing emails. Your information is never sold.</div>
      </div>
    </div>
  );
}

// ─── RESULTS SCREEN ───────────────────────────────────────────────────────────
function DossierLockIcon({ color="#1F3A68" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Results({ results, userEmail, userName, form, mode, toggleMode }) {
  const [unlocked,setUnlocked]=useState(false);
  const [tab,setTab]=useState("letter");
  const [copied,setCopied]=useState(null);
  const [showShare,setShowShare]=useState(false);
  const [checkoutStatus,setCheckoutStatus]=useState("idle");
  const dark=mode==="dark";
  const { summary = {}, preview = {}, paidDossier = null, disputeLetter = "", phoneScript = "", actionPlan = [], yourRights = [] } = results || {};
  const riskLevel = summary.riskLevel || "MEDIUM";
  const rColor = riskLevel==="HIGH"?(dark?"#E07070":"#C0392B"):(dark?"#FCD34D":"#92400E");
  const rBg    = riskLevel==="HIGH"?(dark?"rgba(224,112,112,0.12)":"#FEF2F0"):(dark?"rgba(252,211,77,0.12)":"#FFF8EC");
  const cp=(text,id)=>{ navigator.clipboard.writeText(text); setCopied(id); setTimeout(()=>setCopied(null),2000); };

  const bg=dark?"#141924":"#F2F5F9", surface=dark?"#1C2035":"#fff", surface2=dark?"#1A2030":"#EBF0F8";
  const ink=dark?"#F0F4F8":"#1E293B", ink2=dark?"#CBD5E1":"#374151", ink3=dark?"#94A3B8":"#6B7280", ink4=dark?"#64748B":"#94A3B8";
  const border=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)", border2=dark?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.14)";
  const navyL=dark?"#1A2A45":"#EBF0FA", greenL=dark?"#0D2218":"#E8F5EE";
  const navyC=dark?"#4A7BD4":"#1F3A68", greenC=dark?"#3DAF6A":"#2F7A4F";
  const teaserFinding = preview.teaserFinding || summary.errorsFound?.[0] || summary.keyFindings || "Your initial screening found billing details that may deserve a deeper advocate review.";
  const riskIndex = riskLevel==="HIGH" ? 3 : riskLevel==="MEDIUM" ? 2 : 1;
  const premiumModules = [
    "Provider-Specific Negotiation Brief",
    "Recovery Probability Score",
    "Escalation Hierarchy",
    "Personalized Scripts",
    "30-Day Action Billing Review"
  ];
  const lockedPreviewRows = [
    "Provider billing posture mapped to your submission",
    "Negotiation pathway and escalation timing prepared",
    "Personalized recovery framing held in the Complete Billing Review"
  ];
  const openCheckout = () => {
    writeCheckoutSession({
      savedAt: new Date().toISOString(),
      intake: form,
      freePreviewSummary: summary,
      provider: form?.providerName || "",
      totalAmount: form?.totalBilled || "",
      insurance: form?.hasInsurance ? (form?.insuranceType || "") : "none",
      patientName: userName || ""
    });
    setCheckoutStatus("opening");
    window.setTimeout(() => { window.location.assign(GUMROAD); }, 180);
  };

  const LockedModule = ({ title, index }) => (
    <div style={{ position:"relative",background:surface,border:`1px solid ${border}`,borderRadius:16,padding:"18px 18px 20px",overflow:"hidden",minHeight:138,boxShadow:"0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
        <div style={{ width:34,height:34,borderRadius:"50%",background:navyL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <DossierLockIcon color={navyC} />
        </div>
        <div>
          <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:ink4,marginBottom:2 }}>Premium review module</div>
          <div style={{ fontSize:15,fontWeight:800,color:ink,lineHeight:1.35 }}>{title}</div>
        </div>
      </div>
      <div style={{ filter:"blur(4px)",opacity:.72,userSelect:"none",pointerEvents:"none" }}>
        {lockedPreviewRows.map((row,rowIndex)=>(
          <div key={`${index}-${rowIndex}`} style={{ display:"flex",gap:10,alignItems:"flex-start",marginBottom:8 }}>
            <span style={{ width:8,height:8,borderRadius:"50%",background:greenC,marginTop:6,flexShrink:0 }} />
            <span style={{ fontSize:13,color:ink2,lineHeight:1.55 }}>{row}</span>
          </div>
        ))}
      </div>
      <div style={{ position:"absolute",inset:0,background:`linear-gradient(180deg, ${dark?"rgba(28,32,53,0.08)":"rgba(255,255,255,0.10)"} 18%, ${dark?"rgba(28,32,53,0.88)":"rgba(255,255,255,0.92)"} 100%)`,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:16 }}>
        <div style={{ display:"inline-flex",alignItems:"center",gap:8,border:`1px solid ${border2}`,background:surface,borderRadius:999,padding:"8px 12px",fontSize:12,fontWeight:800,color:navyC,boxShadow:"0 6px 18px rgba(15,23,42,0.08)" }}>
          <DossierLockIcon color={navyC} /> Locked until unlock
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",background:bg,minHeight:"100vh",color:ink }}>

      {showShare && <ShareModal onClose={()=>setShowShare(false)}/>}
      <nav style={{ background:surface,borderBottom:`1px solid ${border}`,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:11 }}>
          <img src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:70,width:"auto",flexShrink:0 }}/>
          <img src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:60,width:"auto",flexShrink:0 }}/>
          <div style={{ display:"flex",flexDirection:"column",lineHeight:1 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"1.1rem",letterSpacing:"-0.025em",whiteSpace:"nowrap",lineHeight:1.05 }}>
              <span style={{ fontWeight:900,color:dark?"#fff":navyC }}>United</span>
              <span style={{ fontWeight:500,color:"#1A7A8C" }}> Patient</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"0.5rem",fontWeight:600,letterSpacing:"0.3em",textTransform:"uppercase",color:ink4,textAlign:"center",marginTop:3 }}>Advocate</div>
          </div>
        </div>
        <div style={{ display:"flex",gap:10,alignItems:"center" }}>
          <button onClick={toggleMode} style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:40,border:`1.5px solid ${border2}`,background:"transparent",color:ink3,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>
            {dark?<SunIcon/>:<MoonIcon/>} {dark?"Day":"Night"}
          </button>
          <button onClick={()=>setShowShare(true)} style={{ padding:"9px 16px",borderRadius:10,border:`1.5px solid ${border2}`,background:"transparent",color:ink3,fontFamily:"inherit",fontSize:13,fontWeight:600,cursor:"pointer" }}>Share</button>
        </div>
      </nav>

      <div style={{ maxWidth:760,margin:"0 auto",padding:"28px 20px" }}>
      <div style={{ maxWidth:680,margin:"0 auto",padding:"28px 20px" }}>

        {/* SUMMARY */}
        <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"26px",marginBottom:20,borderLeft:`4px solid ${rColor}`,boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.07)" }}>
          <div style={{ display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11,fontWeight:700,color:ink4,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6 }}>Billing Review Complete</div>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:21,fontWeight:800,color:ink,marginBottom:10,letterSpacing:"-0.02em" }}>
                {userName?`${userName}, your`:"Your"} review identified potential issues
              </h2>
              <p style={{ fontSize:14,color:ink2,lineHeight:1.75 }}>{summary.keyFindings}</p>
            </div>
            <div style={{ background:rBg,borderRadius:14,padding:"16px 18px",textAlign:"center",minWidth:110,flexShrink:0 }}>
              <div style={{ fontSize:10,fontWeight:700,color:rColor,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4 }}>Risk Level</div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:rColor }}>{summary.riskLevel}</div>
              {summary.estimatedSavingsMin && <>
                <div style={{ fontSize:10,color:ink4,marginTop:6 }}>Est. dispute range</div>
                <div style={{ fontSize:13,fontWeight:700,color:rColor }}>${summary.estimatedSavingsMin}–${summary.estimatedSavingsMax}</div>
              </>}
            </div>
          </div>
          {summary.errorsFound?.length>0 && (
            <div style={{ marginTop:18 }}>
              <div style={{ fontSize:12,fontWeight:700,color:ink3,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10 }}>Areas Flagged for Review</div>
              {summary.errorsFound.map((e,i)=>(
                <div key={i} style={{ display:"flex",gap:10,marginBottom:8,alignItems:"flex-start" }}>
                  <span style={{ color:rColor,fontWeight:700,fontSize:14,flexShrink:0 }}>▶</span>
                  <span style={{ fontSize:14,color:ink2,lineHeight:1.6 }}>{e}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding:"10px 14px",background:navyL,borderRadius:10,fontSize:11,color:ink4,lineHeight:1.7,marginBottom:20 }}>
          Personalized billing review generated from the information you submitted.
        </div>

        {/* PAYWALL */}
        {!unlocked ? (
          <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"36px 28px",borderTop:`4px solid ${navyC}`,marginBottom:28,textAlign:"center",boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.07)" }}>
            <img src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:82,width:"auto",margin:"0 auto 20px",display:"block" }}/>
            <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:ink,marginBottom:10,letterSpacing:"-0.03em" }}>Your Billing Review Is Ready</h2>
            <p style={{ color:ink3,fontSize:14,maxWidth:400,margin:"0 auto 24px",lineHeight:1.75 }}>Your dispute letter, phone script, and action plan have been prepared. Purchase to unlock your complete billing review package.</p>
            <div style={{ textAlign:"left",maxWidth:340,margin:"0 auto 24px",background:navyL,borderRadius:14,padding:"16px 18px" }}>
              {["Complete billing analysis","Personalized dispute letter","Word-for-word phone script","5-step action plan","Consumer billing rights overview"].map((t,i)=>(
                <div key={i} style={{ display:"flex",gap:10,marginBottom:8,alignItems:"flex-start" }}>
                  <span style={{ color:greenC,fontWeight:700,fontSize:15,flexShrink:0,marginTop:1 }}>✓</span>
                  <span style={{ fontSize:14,color:ink2,lineHeight:1.5 }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize:12,color:ink3,marginBottom:22 }}>One-time payment · Instant digital delivery</div>
            <button type="button" onClick={()=>window.open(GUMROAD, "_blank", "noopener,noreferrer")} style={{ display:"block",width:"100%",background:"linear-gradient(135deg,#2F7A4F,#276644)",color:"#fff",textDecoration:"none",border:"none",borderRadius:13,padding:"18px 28px",fontSize:17,fontWeight:800,marginBottom:10,boxShadow:"0 6px 24px rgba(47,122,79,0.4)",fontFamily:"'DM Sans',sans-serif",letterSpacing:"-0.01em",cursor:"pointer" }}>
              Unlock My Complete Package — $97
            </button>
            <div style={{ fontSize:11,color:ink4,marginBottom:16,lineHeight:1.65 }}>Secure checkout · All sales are final due to instant digital delivery</div>
            <button onClick={()=>setUnlocked(true)} style={{ background:"none",border:`1px dashed ${border2}`,borderRadius:8,padding:"6px 14px",color:ink4,cursor:"pointer",fontSize:11,fontFamily:"inherit" }}>Preview full results (demo)</button>
          </div>
        ) : (
          <div style={{ marginBottom:28 }}>
            <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:20,padding:"24px 26px",marginBottom:18,borderLeft:`4px solid ${greenC}`,boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize:11,fontWeight:800,color:greenC,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6 }}>Premium Complete Billing Review</div>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,fontWeight:800,color:ink,marginBottom:10,letterSpacing:"-0.03em" }}>Complete Billing Review access unlocked</h2>
              <p style={{ fontSize:14,color:ink2,lineHeight:1.75,marginBottom:16 }}>This is the differentiated paid experience: full personalized analysis, prepared scripts, dispute documentation, escalation guidance, and a structured action plan.</p>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10 }}>
                {["Deep analysis","Prepared documents","Action path"].map((label)=>(
                  <div key={label} style={{ background:surface2,border:`1px solid ${border}`,borderRadius:12,padding:"11px 12px",fontSize:13,fontWeight:800,color:ink }}>{label}</div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex",gap:4,marginBottom:18,background:surface2,padding:"5px",borderRadius:14,border:`1px solid ${border}` }}>
              {[["letter","Dispute Letter"],["script","Call Script"],["action","30-Day Plan"],["rights","Rights Brief"]].map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id)} style={{ flex:1,padding:"10px 8px",borderRadius:10,border:"none",fontFamily:"inherit",fontSize:13,fontWeight:tab===id?800:500,background:tab===id?surface:"transparent",color:tab===id?ink:ink3,cursor:"pointer",boxShadow:tab===id?"0 1px 3px rgba(0,0,0,0.06)":"none",transition:"all .15s" }}>{label}</button>
              ))}
            </div>

            {tab==="letter" && (
              <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,overflow:"hidden" }}>
                <div style={{ background:navyC,padding:"15px 22px" }}>
                  <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:800,color:"#fff" }}>Dispute Letter</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.55)",marginTop:2 }}>Prepared correspondence for the billing department</div>
                </div>
                <div style={{ padding:"12px 22px",borderBottom:`1px solid ${border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:14,color:ink3 }}>Your Personalized Dispute Letter</span>
                  <button onClick={()=>cp(disputeLetter,"letter")} style={{ background:greenC,color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer" }}>{copied==="letter"?"Copied!":"Copy"}</button>
                </div>
                <div style={{ padding:"24px 28px",whiteSpace:"pre-wrap",lineHeight:2,fontSize:14,color:ink2,maxHeight:400,overflowY:"auto" }}>{disputeLetter || "The paid dispute letter will render here after the Complete Billing Review generation flow is connected."}</div>
              </div>
            )}
            {tab==="script" && (
              <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,overflow:"hidden" }}>
                <div style={{ background:navyC,padding:"15px 22px" }}>
                  <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:800,color:"#fff" }}>Personalized Call Script</div>
                  <div style={{ fontSize:12,color:"rgba(255,255,255,0.55)",marginTop:2 }}>Word-for-word conversation guidance</div>
                </div>
                <div style={{ padding:"12px 22px",borderBottom:`1px solid ${border}`,display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                  <span style={{ fontSize:14,color:ink3 }}>Your Billing Phone Script</span>
                  <button onClick={()=>cp(phoneScript,"script")} style={{ background:greenC,color:"#fff",border:"none",borderRadius:8,padding:"7px 14px",fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer" }}>{copied==="script"?"Copied!":"Copy"}</button>
                </div>
                <div style={{ padding:"24px 28px",whiteSpace:"pre-wrap",lineHeight:2,fontSize:14,color:ink2,maxHeight:400,overflowY:"auto" }}>{phoneScript || "The paid communication script will render here after the Complete Billing Review generation flow is connected."}</div>
              </div>
            )}
            {tab==="action" && (
              <div>
                {actionPlan?.length ? actionPlan.map((s,i)=>(
                  <div key={i} style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"22px",marginBottom:12,borderLeft:`4px solid ${navyC}` }}>
                    <div style={{ display:"flex",gap:14,alignItems:"flex-start" }}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:navyC,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Playfair Display',Georgia,serif",fontSize:16,fontWeight:800,flexShrink:0 }}>{s.step}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:6 }}>
                          <div style={{ fontSize:15,fontWeight:800,color:ink }}>{s.title}</div>
                          <div style={{ background:navyL,borderRadius:6,padding:"2px 10px",fontSize:11,fontWeight:700,color:navyC }}>{s.timeframe}</div>
                        </div>
                        <p style={{ fontSize:14,color:ink2,lineHeight:1.7,marginBottom:8 }}>{s.description}</p>
                        {s.powerTip && <div style={{ background:greenL,borderRadius:8,padding:"9px 13px",fontSize:13,color:greenC,fontWeight:600 }}>{s.powerTip}</div>}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"22px",fontSize:14,color:ink2,lineHeight:1.7 }}>
                    The 30-day paid action plan will render here after the paid generation path is connected.
                  </div>
                )}
              </div>
            )}
            {tab==="rights" && (
              <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"24px 26px" }}>
                <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:18,fontWeight:800,color:ink,marginBottom:16,letterSpacing:"-0.02em" }}>Advocate Rights Brief</h3>
                {yourRights?.length ? yourRights.map((r,i)=>{
                  const parts=r.split(":");
                  return (
                    <div key={i} style={{ padding:"14px 0",borderBottom:i<yourRights.length-1?`1px solid ${border}`:"none" }}>
                      <div style={{ fontWeight:700,fontSize:14,color:navyC,marginBottom:4 }}>{parts[0]}</div>
                      {parts.slice(1).join(":").trim() && <div style={{ fontSize:14,color:ink2,lineHeight:1.65 }}>{parts.slice(1).join(":").trim()}</div>}
                    </div>
                  );
                }) : (
                  <div style={{ fontSize:14,color:ink2,lineHeight:1.7 }}>
                    The paid rights and escalation brief will render here after the Complete Billing Review generation flow is connected.
                  </div>
                )}
              </div>
            )}
            <div style={{ background:navyC,borderRadius:18,padding:"28px 26px",marginTop:24,textAlign:"center" }}>
              <h3 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:20,fontWeight:800,color:"#fff",marginBottom:10 }}>Ready to continue your billing review</h3>
              <p style={{ color:"rgba(255,255,255,0.65)",fontSize:14,marginBottom:20,lineHeight:1.7 }}>Your Complete Billing Review opens after checkout on the private success dashboard, with upload onboarding and clear next steps.</p>
              <button type="button" onClick={openCheckout} disabled={checkoutStatus==="opening"} style={{ display:"block",width:"100%",background:"linear-gradient(135deg,#2F7A4F,#276644)",color:"#fff",textDecoration:"none",border:"none",borderRadius:12,padding:"16px 28px",fontSize:16,fontWeight:800,boxShadow:"0 4px 20px rgba(47,122,79,0.45)",fontFamily:"inherit",cursor:checkoutStatus==="opening"?"wait":"pointer" }}>
                {checkoutStatus==="opening"?"Opening Secure Checkout...":"Continue to Billing Review - $97"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}


function SecureUploadPanel({ dark, surface, surface2, ink, ink2, ink3, ink4, border, border2, navyC, navyL, greenC, greenL }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState("idle");
  const [message, setMessage] = useState("PDF, JPG, and PNG files are accepted.");

  const acceptFile = useCallback((selected) => {
    if (!selected) return;
    const ok = /\.(pdf|jpg|jpeg|png)$/i.test(selected.name);
    if (!ok) {
      setFile(null);
      setProgress(0);
      setState("error");
      setMessage("Please upload a PDF, JPG, or PNG file.");
      return;
    }
    setFile(selected);
    setState("uploading");
    setMessage("Preparing your document for review intake.");
    setProgress(12);
    const steps = [34, 58, 82, 100];
    steps.forEach((step, index) => {
      window.setTimeout(() => {
        setProgress(step);
        if (step === 100) {
          setState("success");
          setMessage("Document attached to this review session.");
        }
      }, 280 + index * 260);
    });
  }, []);

  const statusColor = state === "success" ? greenC : state === "error" ? "#C0392B" : navyC;

  return (
    <section id="document-upload" className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:24,marginBottom:18,boxShadow:"0 10px 30px rgba(15,23,42,0.08)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",gap:18,alignItems:"flex-start",flexWrap:"wrap",marginBottom:18 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:greenC,marginBottom:7 }}>Secure document intake</div>
          <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,lineHeight:1.15,fontWeight:800,letterSpacing:"-0.03em",margin:0,color:ink }}>Upload supporting bill documents</h2>
          <p style={{ color:ink3,fontSize:14,lineHeight:1.7,margin:"10px 0 0",maxWidth:620 }}>Add the bill, statement, EOB, or itemized charge file you want included with the review handoff.</p>
        </div>
        <div style={{ background:greenL,border:`1px solid ${dark?"rgba(61,175,106,0.28)":"rgba(47,122,79,0.18)"}`,borderRadius:999,padding:"9px 13px",fontSize:12,fontWeight:900,color:greenC,whiteSpace:"nowrap" }}>Private review workspace</div>
      </div>

      <div
        onDragOver={(e)=>{ e.preventDefault(); setDragging(true); }}
        onDragLeave={()=>setDragging(false)}
        onDrop={(e)=>{ e.preventDefault(); setDragging(false); acceptFile(e.dataTransfer.files?.[0]); }}
        onClick={()=>inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e)=>{ if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        style={{ border:`1.5px dashed ${dragging ? greenC : border2}`,background:dragging ? greenL : surface2,borderRadius:18,padding:"24px 18px",textAlign:"center",cursor:"pointer",transition:"all .18s ease" }}
      >
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" style={{ display:"none" }} onChange={(e)=>acceptFile(e.target.files?.[0])}/>
        <div style={{ width:54,height:54,borderRadius:"50%",background:dark?"rgba(74,123,212,0.18)":"#EEF4FF",border:`1px solid ${border}`,margin:"0 auto 13px",display:"grid",placeItems:"center",color:navyC,fontWeight:900,fontSize:20 }}>UP</div>
        <div style={{ fontSize:16,fontWeight:900,color:ink,marginBottom:5 }}>{file ? file.name : "Drop your document here"}</div>
        <div style={{ fontSize:13,color:ink3,lineHeight:1.6 }}>{message}</div>
        {state === "uploading" && <div style={{ margin:"16px auto 0",maxWidth:420,height:8,borderRadius:999,background:dark?"rgba(255,255,255,0.08)":"#DDE6F2",overflow:"hidden" }}><div style={{ width:`${progress}%`,height:"100%",background:greenC,borderRadius:999,transition:"width .24s ease" }}/></div>}
        {(state === "success" || state === "error") && <div style={{ marginTop:14,fontSize:13,fontWeight:900,color:statusColor }}>{state === "success" ? "Ready for analyst handoff" : "Upload needs attention"}</div>}
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginTop:14 }}>
        {["Document review queue","Confidential billing material","Same-browser session handoff"].map(item=>(
          <div key={item} style={{ background:dark?"rgba(255,255,255,0.04)":"#F7FAFC",border:`1px solid ${border}`,borderRadius:13,padding:"11px 12px",fontSize:12,fontWeight:800,color:ink2 }}>{item}</div>
        ))}
      </div>
    </section>
  );
}
function SuccessTimeline({ surface, surface2, ink, ink2, ink3, border, navyC, greenC }) {
  const items = [
    ["1", "Upload documents", "Add your bill, EOB, statement, or itemized charges for the complete review package."],
    ["2", "Billing Review preparation", "Your intake is organized into findings, questions, scripts, and next steps."],
    ["3", "Review and act", "Use the Start Here section, call guidance, and 30-day plan to move forward with confidence."]
  ];
  return (
    <section className="success-grid" style={{ display:"grid",gridTemplateColumns:"1.05fr .95fr",gap:16,marginBottom:18 }}>
      <div className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:24 }}>
        <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:navyC,marginBottom:8 }}>What happens next</div>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:25,lineHeight:1.15,fontWeight:800,letterSpacing:"-0.03em",margin:"0 0 16px",color:ink }}>A clear path from payment to action</h2>
        {items.map(([step,title,body], index)=>(
          <div key={title} style={{ display:"grid",gridTemplateColumns:"40px 1fr",gap:13,paddingTop:index?15:0,marginTop:index?15:0,borderTop:index?`1px solid ${border}`:"none" }}>
            <div style={{ width:34,height:34,borderRadius:"50%",background:index===0?greenC:surface2,color:index===0?"#fff":navyC,display:"grid",placeItems:"center",fontWeight:900 }}>{step}</div>
            <div>
              <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:4 }}>{title}</div>
              <div style={{ fontSize:13,color:ink3,lineHeight:1.7 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:24 }}>
        <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:greenC,marginBottom:8 }}>Trust and handling</div>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:25,lineHeight:1.15,fontWeight:800,letterSpacing:"-0.03em",margin:"0 0 14px",color:ink }}>Built for sensitive billing details</h2>
        {["Only the review intake needed for this session is used.","Files are presented as confidential customer billing material.","Support is available if the same-browser session is interrupted."].map(item=>(
          <div key={item} style={{ display:"flex",gap:10,alignItems:"flex-start",marginBottom:11 }}>
            <span style={{ width:20,height:20,borderRadius:"50%",background:"rgba(47,122,79,0.12)",color:greenC,display:"grid",placeItems:"center",fontSize:12,fontWeight:900,flexShrink:0 }}>OK</span>
            <span style={{ fontSize:13,color:ink2,lineHeight:1.65 }}>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
function PremiumReportTemplate({ surface, surface2, ink, ink2, ink3, border, navyC, greenC }) {
  const sections = [
    ["Executive Summary", "A concise overview of the billing situation and the most important review priorities."],
    ["Potential Findings", "Areas that may deserve clarification, itemized support, or provider follow-up."],
    ["Duplicate Charge Review", "A structured pass over repeated charges, dates, and service descriptions."],
    ["Coding Review", "Plain-language review of billing codes, descriptions, and documentation questions."],
    ["Medicare Benchmark Comparison", "Contextual comparison language for rates and publicly available reference points."],
    ["Itemized Notes", "Organized notes customers can reference during provider or insurer conversations."],
    ["Recommended Questions", "Specific questions to ask billing offices, patient financial services, or insurers."],
    ["Suggested Next Steps", "A prioritized action path with timing and preparation guidance."],
    ["Communication Guidance", "Call scripts, message framing, and escalation language for the customer."],
    ["Disclaimers", "Clear educational-use boundaries presented calmly and professionally."]
  ];
  return (
    <section className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:24,marginBottom:18 }}>
      <div style={{ display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-end",flexWrap:"wrap",marginBottom:18 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:navyC,marginBottom:8 }}>Premium analysis report template</div>
          <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,lineHeight:1.15,fontWeight:800,letterSpacing:"-0.03em",margin:0,color:ink }}>The finished review is organized like a healthcare consulting brief</h2>
        </div>
        <div style={{ fontSize:12,fontWeight:900,color:greenC,background:"rgba(47,122,79,0.1)",borderRadius:999,padding:"9px 12px" }}>Customer-ready format</div>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12 }}>
        {sections.map(([title,body], index)=>(
          <div key={title} style={{ background:index<2?surface2:"transparent",border:`1px solid ${border}`,borderRadius:15,padding:"14px 15px" }}>
            <div style={{ display:"flex",gap:9,alignItems:"center",marginBottom:7 }}>
              <span style={{ width:24,height:24,borderRadius:"50%",background:index<2?navyC:"rgba(47,122,79,0.12)",color:index<2?"#fff":greenC,display:"grid",placeItems:"center",fontSize:11,fontWeight:900 }}>{index+1}</span>
              <span style={{ fontSize:14,fontWeight:900,color:ink }}>{title}</span>
            </div>
            <div style={{ fontSize:12,color:ink3,lineHeight:1.65 }}>{body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
function QuickScanLeadMagnet({ surface, surface2, ink, ink2, ink3, border, navyC, greenC }) {
  const preview = [
    "One possible billing pattern deserves a closer itemized review.",
    "A provider follow-up question may help clarify the account balance.",
    "Complete Billing Review unlocks scripts, benchmarks, and next-step sequencing."
  ];
  return (
    <section className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:24,marginBottom:18,position:"relative",overflow:"hidden" }}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 260px",gap:18,alignItems:"center" }} className="success-split">
        <div>
          <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:greenC,marginBottom:8 }}>Free quick scan pathway</div>
          <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:26,lineHeight:1.15,fontWeight:800,letterSpacing:"-0.03em",margin:"0 0 10px",color:ink }}>Run a free quick scan for future bill questions</h2>
          <p style={{ color:ink3,fontSize:14,lineHeight:1.75,margin:"0 0 14px" }}>Upload a new bill for a short screening, see one teaser finding, then unlock the Complete Billing Review when you are ready.</p>
          <button type="button" onClick={()=>{ window.location.href="/"; }} style={{ background:navyC,color:"#fff",border:"none",borderRadius:12,padding:"13px 16px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit" }}>Start a New Quick Scan</button>
        </div>
        <div style={{ background:surface2,border:`1px solid ${border}`,borderRadius:18,padding:14,position:"relative" }}>
          {preview.map((item,index)=>(
            <div key={item} style={{ filter:index>0?"blur(3px)":"none",opacity:index>0?0.58:1,display:"flex",gap:9,padding:"10px 0",borderTop:index?`1px solid ${border}`:"none" }}>
              <span style={{ width:22,height:22,borderRadius:"50%",background:index===0?greenC:"rgba(31,58,104,0.14)",color:index===0?"#fff":navyC,display:"grid",placeItems:"center",fontSize:11,fontWeight:900,flexShrink:0 }}>{index===0?"1":"L"}</span>
              <span style={{ fontSize:12,color:ink2,lineHeight:1.55,fontWeight:index===0?800:700 }}>{item}</span>
            </div>
          ))}
          <div style={{ position:"absolute",left:12,right:12,bottom:12,padding:"10px 12px",borderRadius:13,background:"rgba(31,58,104,0.92)",color:"#fff",fontSize:12,fontWeight:900,textAlign:"center" }}>Complete Billing Review locked</div>
        </div>
      </div>
    </section>
  );
}
function SuccessFAQ({ surface, ink, ink2, ink3, border, navyC }) {
  const [open, setOpen] = useState(0);
  const faqs = [
    ["What should I upload?", "Upload the bill, statement, explanation of benefits, itemized charges, or collection notice connected to the review."],
    ["Will this replace calling my provider?", "No. The billing review is designed to help you prepare for more organized conversations with billing offices, insurers, or patient financial services."],
    ["Can I use this on mobile?", "Yes. The dashboard, upload area, report sections, and copy/download actions are designed for mobile and desktop."],
    ["What if the session is missing?", "Return to the analyzer from the same device and browser used during checkout, or contact support for help." ]
  ];
  return (
    <section className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:24,marginBottom:18 }}>
      <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:navyC,marginBottom:8 }}>Support FAQ</div>
      <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:25,lineHeight:1.15,fontWeight:800,letterSpacing:"-0.03em",margin:"0 0 16px",color:ink }}>Common next-step questions</h2>
      {faqs.map(([q,a], index)=>(
        <div key={q} style={{ borderTop:index?`1px solid ${border}`:"none",paddingTop:index?13:0,marginTop:index?13:0 }}>
          <button type="button" onClick={()=>setOpen(open===index?-1:index)} style={{ width:"100%",background:"transparent",border:"none",padding:0,display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",fontFamily:"inherit",cursor:"pointer",textAlign:"left" }}>
            <span style={{ color:ink,fontSize:15,fontWeight:900 }}>{q}</span>
            <span style={{ color:ink3,fontSize:20,fontWeight:800 }}>{open===index?"-":"+"}</span>
          </button>
          {open===index && <p style={{ color:ink2,fontSize:13,lineHeight:1.75,margin:"9px 0 0" }}>{a}</p>}
        </div>
      ))}
    </section>
  );
}
function SuccessPage({ mode, toggleMode }) {
  const dark = mode === "dark";
  const [session] = useState(() => readCheckoutSession());
  const [status, setStatus] = useState(session ? "loading" : "missing");
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const bg=dark?"#141924":"#F2F5F9", surface=dark?"#1C2035":"#fff", surface2=dark?"#1A2030":"#EBF0F8";
  const ink=dark?"#F0F4F8":"#1E293B", ink2=dark?"#CBD5E1":"#374151", ink3=dark?"#94A3B8":"#6B7280", ink4=dark?"#64748B":"#94A3B8";
  const border=dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)", border2=dark?"rgba(255,255,255,0.14)":"rgba(0,0,0,0.14)";
  const navyL=dark?"#1A2A45":"#EBF0FA", greenL=dark?"#0D2218":"#E8F5EE";
  const navyC=dark?"#4A7BD4":"#1F3A68", greenC=dark?"#3DAF6A":"#2F7A4F";

  useEffect(() => {
    if (!session?.intake) return;
    let active = true;
    setStatus("loading");
    fetchGeneration(PAID_REVIEW_MODE, session.intake)
      .then(payload => {
        if (!active) return;
        setResults(payload);
        setStatus("ready");
      })
      .catch(err => {
        console.error("Complete Billing Review generation failed:", err);
        if (!active) return;
        setError("We could not prepare the Complete Billing Review right now. Please try again in a moment.");
        setStatus("error");
      });
    return () => { active = false; };
  }, [session]);

  const dossierText = buildPaidDossierText(results);
  const copyDossier = async () => {
    if (!dossierText) return;
    await navigator.clipboard.writeText(dossierText);
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };
  const downloadDossier = () => {
    if (!dossierText) return;
    const blob = new Blob([dossierText], { type:"text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "united-patient-advocate-billing-review.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (status === "missing") {
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif",background:bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,color:ink }}>
        <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:20,padding:"36px 30px",maxWidth:560,width:"100%",textAlign:"center",boxShadow:"0 8px 28px rgba(15,23,42,0.08)" }}>
          <img src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:88,width:"auto",margin:"0 auto 18px",display:"block" }}/>
          <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,fontWeight:800,letterSpacing:"-0.03em",marginBottom:12 }}>We couldn’t find your saved review session on this device.</h1>
          <p style={{ fontSize:15,color:ink2,lineHeight:1.8,marginBottom:20 }}>Please return to the analyzer or contact support.</p>
          <button type="button" onClick={()=>{ window.location.href="/"; }} style={{ background:navyC,color:"#fff",border:"none",borderRadius:12,padding:"14px 18px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>Return to Analyzer</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",background:bg,minHeight:"100vh",color:ink }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .success-card { box-sizing: border-box; }
        @media (max-width: 720px) {
          .success-grid, .success-split { grid-template-columns: 1fr !important; }
          .success-card { padding: 18px !important; border-radius: 18px !important; }
          .success-mobile-hero { padding: 24px 20px !important; border-radius: 20px !important; }
          .success-mobile-title { font-size: 28px !important; }
          .success-mobile-shell { padding: 22px 14px 34px !important; }
          .success-mobile-nav { padding: 10px 14px !important; }
        }
      `}</style>
      <nav className="success-mobile-nav" style={{ background:surface,borderBottom:`1px solid ${border}`,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:11 }}>
          <img src={LOGO_B64} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=LOGO_FALLBACK; }} style={{ height:70,width:"auto",flexShrink:0 }}/>
          <div style={{ display:"flex",flexDirection:"column",lineHeight:1 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"1.1rem",letterSpacing:"-0.025em",whiteSpace:"nowrap",lineHeight:1.05 }}>
              <span style={{ fontWeight:900,color:dark?"#fff":navyC }}>United</span>
              <span style={{ fontWeight:500,color:"#1A7A8C" }}> Patient</span>
            </div>
            <div style={{ fontFamily:"'DM Sans',sans-serif",fontSize:"0.5rem",fontWeight:600,letterSpacing:"0.3em",textTransform:"uppercase",color:ink4,textAlign:"center",marginTop:3 }}>Advocate</div>
          </div>
        </div>
        <button onClick={toggleMode} style={{ display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:40,border:`1.5px solid ${border2}`,background:"transparent",color:ink3,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>
          {dark?<SunIcon/>:<MoonIcon/>} {dark?"Day":"Night"}
        </button>
      </nav>

      <div className="success-mobile-shell" style={{ maxWidth:960,margin:"0 auto",padding:"30px 20px 42px" }}>
        <div className="success-mobile-hero" style={{ background:navyC,borderRadius:24,padding:"30px",color:"#fff",marginBottom:20,boxShadow:"0 12px 34px rgba(15,23,42,0.18)" }}>
          <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.14em",color:"rgba(255,255,255,0.68)",marginBottom:8 }}>Welcome to your private review dashboard</div>
          <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:34,fontWeight:800,letterSpacing:"-0.03em",lineHeight:1.12,marginBottom:12 }} className="success-mobile-title">Your Complete Billing Review Is Being Prepared</h1>
          <p style={{ color:"rgba(255,255,255,0.8)",fontSize:15,lineHeight:1.8,maxWidth:700,marginBottom:18 }}>We found your saved review session for {session?.provider || "your provider"}. Your private dashboard is ready. The Complete Billing Review is being generated now from the same bill intake you submitted before checkout.</p>
          <button type="button" onClick={()=>document.getElementById("document-upload")?.scrollIntoView({ behavior:"smooth", block:"start" })} style={{ background:"#fff",color:navyC,border:"none",borderRadius:13,padding:"14px 18px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 8px 24px rgba(0,0,0,0.16)" }}>Continue to Billing Review</button>
        </div>

        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14,marginBottom:20 }}>
          {[
            ["Provider", session?.provider || "Saved review session"],
            ["Total billed", session?.totalAmount ? `$${session.totalAmount}` : "Saved bill total"],
            ["Insurance", session?.insurance || "Saved insurance profile"],
            ["Patient", session?.patientName || "Customer session"]
          ].map(([label,value])=>(
            <div key={label} style={{ background:surface,border:`1px solid ${border}`,borderRadius:16,padding:"16px 18px" }}>
              <div style={{ fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:"0.12em",color:ink4,marginBottom:6 }}>{label}</div>
              <div style={{ fontSize:15,fontWeight:800,color:ink,lineHeight:1.45 }}>{value}</div>
            </div>
          ))}
        </div>

        <SuccessTimeline surface={surface} surface2={surface2} ink={ink} ink2={ink2} ink3={ink3} border={border} navyC={navyC} greenC={greenC} />

        <SecureUploadPanel dark={dark} surface={surface} surface2={surface2} ink={ink} ink2={ink2} ink3={ink3} ink4={ink4} border={border} border2={border2} navyC={navyC} navyL={navyL} greenC={greenC} greenL={greenL} />

        <BillingEducation dark={dark} surface={surface} surface2={surface2} ink={ink} ink2={ink2} ink3={ink3} border={border} navyC={navyC} greenC={greenC} />
        {status === "loading" && (
          <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:20,padding:"28px",marginBottom:20 }}>
            <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16 }}>
              <div style={{ width:46,height:46,borderRadius:"50%",border:`4px solid ${navyL}`,borderTopColor:greenC,animation:"spin 1s linear infinite" }} />
              <div>
                <div style={{ fontSize:16,fontWeight:800,color:ink,marginBottom:3 }}>Preparing your Complete Billing Review</div>
                <div style={{ fontSize:14,color:ink3,lineHeight:1.6 }}>Generating deep analysis, scripts, escalation context, and your 30-day plan.</div>
              </div>
            </div>
            <div style={{ background:surface2,borderRadius:14,padding:"16px 18px",fontSize:14,color:ink2,lineHeight:1.7 }}>
              Start Here is being assembled first so the finished Complete Billing Review opens with a clear path forward.
            </div>
          </div>
        )}

        {status === "error" && (
          <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:20,padding:"24px",marginBottom:20 }}>
            <div style={{ fontSize:16,fontWeight:800,color:ink,marginBottom:8 }}>We hit a preparation issue.</div>
            <p style={{ fontSize:14,color:ink2,lineHeight:1.7,marginBottom:16 }}>{error}</p>
            <button type="button" onClick={()=>window.location.reload()} style={{ background:navyC,color:"#fff",border:"none",borderRadius:12,padding:"13px 16px",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>Try Again</button>
          </div>
        )}

        {status === "ready" && results && (
          <>
            <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:20,padding:"24px 26px",marginBottom:18,borderLeft:`4px solid ${greenC}`,boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 4px 16px rgba(0,0,0,0.07)" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16,flexWrap:"wrap",marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:11,fontWeight:800,color:greenC,textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:6 }}>Start Here</div>
                  <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:28,fontWeight:800,color:ink,marginBottom:10,letterSpacing:"-0.03em" }}>Your Complete Billing Review path</h2>
                  <div style={{ fontSize:14,color:ink2,lineHeight:1.75,maxWidth:620 }}><AnnotatedParagraph text={results.paidDossier?.executiveOverview || results.summary?.keyFindings} color={ink2} /></div>
                </div>
                <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
                  <button type="button" onClick={()=>window.print()} style={{ background:navyC,color:"#fff",border:"none",borderRadius:11,padding:"12px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>Print</button>
                  <button type="button" onClick={downloadDossier} style={{ background:greenC,color:"#fff",border:"none",borderRadius:11,padding:"12px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>Download</button>
                  <button type="button" onClick={copyDossier} style={{ background:surface2,color:ink,border:`1px solid ${border2}`,borderRadius:11,padding:"12px 14px",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>{copied?"Copied":"Copy"}</button>
                </div>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10 }}>
                {["Deep analysis","Negotiation context","Escalation map","30-day plan"].map(label=>(
                  <div key={label} style={{ background:surface2,border:`1px solid ${border}`,borderRadius:12,padding:"12px",fontSize:13,fontWeight:800,color:ink }}>{label}</div>
                ))}
              </div>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16,marginBottom:18 }}>
              {[
                ["Billing Pattern Analysis", results.paidDossier?.billingPatternAnalysis],
                ["Provider-Specific Observations", results.paidDossier?.providerSpecificObservations],
                ["Negotiation Context", results.paidDossier?.negotiationContext],
                ["Escalation Hierarchy", results.paidDossier?.escalationHierarchy],
                ["Financial Assistance Context", results.paidDossier?.financialAssistanceContext],
                ["Communication Guidance", results.paidDossier?.communicationGuidance]
              ].map(([title,items])=>(
                <div key={title} style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"20px 20px 18px" }}>
                  <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:10 }}>{title}</div>
                  {(items || []).map((item,index)=>(
                    <div key={index} style={{ display:"flex",gap:10,alignItems:"flex-start",marginBottom:8 }}>
                      <span style={{ width:8,height:8,borderRadius:"50%",background:greenC,marginTop:6,flexShrink:0 }} />
                      <div style={{ fontSize:14,color:ink2,lineHeight:1.7,flex:1 }}><AnnotatedParagraph text={item} color={ink2} style={{ margin:0,lineHeight:1.7 }} /></div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"22px",marginBottom:18 }}>
              <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:10 }}>Recovery Probability</div>
              <div style={{ background:greenL,borderRadius:14,padding:"16px",fontSize:14,color:ink2,lineHeight:1.75 }}>
                <strong style={{ color:greenC }}>{results.paidDossier?.recoveryProbability?.label || "Prepared"}</strong>: <AnnotatedParagraph text={results.paidDossier?.recoveryProbability?.rationale || "Recovery framing will appear here when available from the Complete Billing Review generator."} color={ink2} style={{ display:"inline",margin:0,lineHeight:1.75 }} />
              </div>
            </div>

            <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"22px",marginBottom:18 }}>
              <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:14 }}>30-Day Action Plan</div>
              {results.actionPlan?.map((step,index)=>(
                <div key={index} style={{ borderTop:index?`1px solid ${border}`:"none",paddingTop:index?14:0,marginTop:index?14:0 }}>
                  <div style={{ fontSize:14,fontWeight:900,color:navyC,marginBottom:4 }}>{step.step}. {step.title} - {step.timeframe}</div>
                  <div style={{ fontSize:14,color:ink2,lineHeight:1.7 }}><AnnotatedParagraph text={step.description} color={ink2} /></div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,marginBottom:18 }}>
              <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"22px" }}>
                <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:12 }}>Dispute Letter</div>
                <div style={{ fontSize:14,color:ink2,lineHeight:1.8,maxHeight:360,overflowY:"auto" }}><AnnotatedParagraph text={results.disputeLetter} color={ink2} /></div>
              </div>
              <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"22px" }}>
                <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:12 }}>Call Script</div>
                <div style={{ fontSize:14,color:ink2,lineHeight:1.8,maxHeight:360,overflowY:"auto" }}><AnnotatedParagraph text={results.phoneScript} color={ink2} /></div>
              </div>
            </div>

            <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"22px",marginBottom:18 }}>
              <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:12 }}>Rights Brief</div>
              {(results.yourRights || []).map((item,index)=>(
                <div key={index} style={{ borderTop:index?`1px solid ${border}`:"none",paddingTop:index?12:0,marginTop:index?12:0,fontSize:14,color:ink2,lineHeight:1.75 }}><AnnotatedParagraph text={item} color={ink2} /></div>
              ))}
            </div>

            <PremiumReportTemplate surface={surface} surface2={surface2} ink={ink} ink2={ink2} ink3={ink3} border={border} navyC={navyC} greenC={greenC} />

            <QuickScanLeadMagnet surface={surface} surface2={surface2} ink={ink} ink2={ink2} ink3={ink3} border={border} navyC={navyC} greenC={greenC} />

            <SuccessFAQ surface={surface} ink={ink} ink2={ink2} ink3={ink3} border={border} navyC={navyC} />

            <div className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:18,padding:"20px 22px",marginBottom:18 }}>
              <div style={{ fontSize:15,fontWeight:900,color:ink,marginBottom:8 }}>Need help with your review?</div>
              <div style={{ fontSize:14,color:ink2,lineHeight:1.7 }}>Email support@unitedpatientadvocate.com with your name, provider, and the best way to reach you. Keep medical details out of the email unless requested through a secure intake workflow.</div>
            </div>
            <div style={{ background:navyL,borderRadius:16,padding:"16px 18px",fontSize:12,color:ink3,lineHeight:1.75 }}>
              This AI-assisted billing review is educational consumer guidance. It is not medical, legal, insurance, or financial representation. Outcomes depend on provider policies, insurer determinations, available documentation, and the facts of each individual account.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
function ErrorScreen({ onRetry, onBack }) {
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",background:"#F2F5F9",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      <div style={{ background:"#fff",borderRadius:18,padding:"40px 32px",maxWidth:520,width:"100%",textAlign:"center",boxShadow:"0 4px 24px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize:48,marginBottom:20 }}>⚠️</div>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:22,fontWeight:800,color:"#1E293B",marginBottom:12 }}>Analysis could not be completed</h2>
        <p style={{ color:"#6B7280",fontSize:14,lineHeight:1.75,marginBottom:8 }}>
          The billing analysis failed to run.
        </p>
        <div style={{ background:"#FEF2F0",borderRadius:10,padding:"14px 16px",fontSize:13,color:"#C0392B",marginBottom:24,textAlign:"left",lineHeight:1.7 }}>
          The analysis request could not be completed. Please try again in a moment.<br/><br/>
          Server API key is not configured. Set <code>ANTHROPIC_API_KEY</code> in Vercel environment variables and redeploy.
        </div>
        <div style={{ display:"flex",gap:10 }}>
          <button onClick={onBack} style={{ flex:1,padding:"13px",borderRadius:11,background:"transparent",border:"1.5px solid #CBD5E1",color:"#6B7280",fontFamily:"inherit",fontSize:14,fontWeight:600,cursor:"pointer" }}>← Go Back</button>
          <button onClick={onRetry} style={{ flex:2,padding:"13px",borderRadius:11,background:"#1F3A68",color:"#fff",border:"none",fontFamily:"inherit",fontSize:14,fontWeight:700,cursor:"pointer" }}>Try Again</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const { mode, toggle } = useTheme();
  const isSuccessPath = typeof window !== "undefined" && window.location.pathname === "/success";
  const [screen, setScreen]   = useState("landing");
  const [step,   setStep]     = useState(1);
  const [form,   setForm]     = useState({
    providerName:"", totalBilled:"", amountOwed:"",
    hasInsurance:true, insuranceType:"medicare",
    visitReason:"", servicesReceived:"",
    stayDuration:"outpatient", billStatus:"unpaid", specificConcerns:""
  });
  const [results,   setResults]   = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [userName,  setUserName]  = useState("");

  const update  = (f,v) => setForm(p=>({...p,[f]:v}));
  const goHome  = ()   => { setScreen("landing"); setStep(1); };
  const onStart = ()   => { setStep(1); setScreen("form"); };

  const requestGeneration = async (generationMode) => fetchGeneration(generationMode, form);

  const analyze = async () => {
    setScreen("analyzing");

    try {
      const previewResults = await requestGeneration(FREE_PREVIEW_MODE);
      setResults(previewResults);
      setScreen("email");
    } catch(err) {
      console.error("Analysis failed:", err);
      setScreen("error");
    }
  };

  const shared = { mode, toggleMode:toggle };

  if (isSuccessPath) return <SuccessPage {...shared}/>;

  if (screen==="landing")   return <Landing  onStart={onStart} {...shared}/>;
  if (screen==="form")      return <Form step={step} setStep={setStep} form={form} update={update} onSubmit={analyze} onBack={goHome} {...shared}/>;
  if (screen==="analyzing") return <Analyzing {...shared}/>;
  if (screen==="email")     return <EmailCapture onContinue={(email,name)=>{ setUserEmail(email); setUserName(name); setScreen("results"); }} {...shared}/>;
  if (screen==="results")   return <Results results={results} userEmail={userEmail} userName={userName} form={form} {...shared}/>;
  if (screen==="error")     return <ErrorScreen onRetry={()=>setScreen("form")} onBack={goHome}/>;
}

