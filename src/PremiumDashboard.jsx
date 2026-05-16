import { useMemo, useState } from "react";
import { AnnotatedParagraph } from "./TermTooltip.jsx";

function buildReportHtml({ results, session, logoSrc }) {
  const dossier = results?.paidDossier || {};
  const rows = [
    ["Executive Summary", dossier.executiveOverview || results?.summary?.keyFindings || ""],
    ["Potential Findings", (results?.summary?.errorsFound || []).join("\n")],
    ["Billing Pattern Analysis", (dossier.billingPatternAnalysis || []).join("\n")],
    ["Provider-Specific Observations", (dossier.providerSpecificObservations || []).join("\n")],
    ["Negotiation Context", (dossier.negotiationContext || []).join("\n")],
    ["Escalation Hierarchy", (dossier.escalationHierarchy || []).join("\n")],
    ["Recovery Probability", `${dossier.recoveryProbability?.label || ""}: ${dossier.recoveryProbability?.rationale || ""}`.trim()],
    ["Communication Guidance", (dossier.communicationGuidance || []).join("\n")],
    ["Dispute Letter", results?.disputeLetter || ""],
    ["Call Script", results?.phoneScript || ""],
    ["30-Day Action Plan", (results?.actionPlan || dossier.thirtyDayActionPlan || []).map(step => `${step.step || ""}. ${step.title || ""} (${step.timeframe || ""}) - ${step.description || ""}`).join("\n")],
    ["Rights Brief", (results?.yourRights || []).join("\n")]
  ];
  const esc = value => String(value || "").replace(/[&<>]/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;" }[ch]));
  return `<!doctype html><html><head><meta charset="utf-8"><title>UPA Complete Billing Review</title><style>
  body{margin:0;background:#F3F6FA;color:#172033;font-family:Arial,sans-serif}.page{max-width:920px;margin:0 auto;padding:34px 24px}.header{background:#13213A;color:white;border-radius:22px;padding:28px;display:flex;gap:18px;align-items:center}.header img{height:82px;width:auto}.kicker{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9FD8D6;font-weight:800}.title{font-family:Georgia,serif;font-size:34px;line-height:1.08;margin:6px 0 8px}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0}.meta div,.section{background:white;border:1px solid #D8E0EA;border-radius:16px;padding:16px}.label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#64748B;font-weight:800}.value{font-weight:800;margin-top:5px}.section{margin-bottom:14px;break-inside:avoid}.section h2{font-family:Georgia,serif;font-size:23px;margin:0 0 10px;color:#1F3A68}.section p{white-space:pre-wrap;line-height:1.75;margin:0;color:#374151}.footer{font-size:12px;line-height:1.7;color:#64748B;margin-top:18px;border-top:1px solid #CBD5E1;padding-top:14px}@media print{body{background:white}.page{padding:0}}
  </style></head><body><main class="page"><header class="header"><img src="${esc(logoSrc)}" alt="UPA"><div><div class="kicker">United Patient Advocate</div><div class="title">Complete Billing Review</div><div>Premium billing review prepared from your submitted information.</div></div></header><section class="meta"><div><div class="label">Provider</div><div class="value">${esc(session?.provider || "Saved session")}</div></div><div><div class="label">Total billed</div><div class="value">${esc(session?.totalAmount ? `$${session.totalAmount}` : "Saved total")}</div></div><div><div class="label">Prepared</div><div class="value">${esc(new Date().toLocaleDateString())}</div></div></section>${rows.map(([title,body])=>`<section class="section"><h2>${esc(title)}</h2><p>${esc(body || "This section will populate as additional review details are available.")}</p></section>`).join("")}<footer class="footer">United Patient Advocate provides educational and informational billing review support. Not legal, medical, insurance, or financial advice. Results vary and are not promised.</footer></main></body></html>`;
}

const asText = value => typeof value === "string" ? value : value ? JSON.stringify(value) : "";

function StatusPill({ children, tone = "green" }) {
  const colors = {
    green: ["#EAF7F1", "#237A55"],
    blue: ["#EAF0FA", "#1F3A68"],
    amber: ["#FFF4DA", "#8B6418"],
    red: ["#FFF0ED", "#B64232"]
  }[tone];
  return (
    <span style={{ display:"inline-flex",alignItems:"center",gap:7,background:colors[0],color:colors[1],borderRadius:999,padding:"7px 10px",fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",whiteSpace:"nowrap" }}>
      <span style={{ width:7,height:7,borderRadius:"50%",background:colors[1] }} />
      {children}
    </span>
  );
}

function SectionTitle({ kicker, title, note, colors }) {
  return (
    <div style={{ display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-end",marginBottom:16,flexWrap:"wrap" }}>
      <div>
        <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:colors.greenC,marginBottom:7 }}>{kicker}</div>
        <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:30,lineHeight:1.08,letterSpacing:"-0.04em",margin:0,color:colors.ink }}>{title}</h2>
      </div>
      {note && <div style={{ fontSize:12,fontWeight:900,color:colors.ink4 }}>{note}</div>}
    </div>
  );
}

function FindingCards({ findings, colors }) {
  const list = findings.length ? findings : ["No specific findings were returned for this section."];
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12 }}>
      {list.map((item,index)=>(
        <article key={index} style={{ background:index===0 ? "#EEF8F4" : "#FFFFFF",border:`1px solid ${index===0 ? "rgba(53,183,121,0.22)" : colors.border}`,borderRadius:18,padding:16,minHeight:150,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",gap:10,alignItems:"center",marginBottom:12 }}>
            <span style={{ width:34,height:34,borderRadius:12,background:index===0 ? colors.greenC : colors.navyC,color:"#fff",display:"grid",placeItems:"center",fontSize:13,fontWeight:900 }}>{index+1}</span>
            <StatusPill tone={index===0 ? "green" : "blue"}>{index===0 ? "Primary" : "Review"}</StatusPill>
          </div>
          <div style={{ color:colors.ink2,fontSize:13,lineHeight:1.7 }}><AnnotatedParagraph text={asText(item)} color={colors.ink2} /></div>
        </article>
      ))}
    </div>
  );
}

function BenchmarkBars({ results, dossier, colors }) {
  const source = [
    ["Charge clarity", results?.summary?.riskLevel || "Needs review", 72],
    ["Code support", dossier.billingPatternAnalysis?.[0] || "Documentation comparison prepared", 61],
    ["Negotiation leverage", dossier.negotiationContext?.[0] || "Conversation leverage identified", 78],
    ["Escalation readiness", dossier.escalationHierarchy?.[0] || "Escalation path mapped", 66]
  ];
  return (
    <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
      <SectionTitle kicker="Benchmark Bars" title="Review strength signals" note="Directional" colors={colors} />
      <div style={{ display:"grid",gap:13 }}>
        {source.map(([label,detail,value])=>(
          <div key={label}>
            <div style={{ display:"flex",justifyContent:"space-between",gap:10,marginBottom:7 }}>
              <div style={{ fontSize:13,fontWeight:900,color:colors.ink }}>{label}</div>
              <div style={{ fontSize:12,fontWeight:900,color:colors.ink4 }}>{value}%</div>
            </div>
            <div style={{ height:10,background:"#E6EDF5",borderRadius:999,overflow:"hidden",marginBottom:6 }}>
              <div style={{ width:`${value}%`,height:"100%",background:`linear-gradient(90deg,${colors.greenC},#4BA3A0)`,borderRadius:999 }} />
            </div>
            <div style={{ fontSize:12,color:colors.ink3,lineHeight:1.55,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{asText(detail)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecoveryGauge({ probability, colors }) {
  const label = probability?.label || "Prepared";
  const score = /high|strong|good/i.test(label) ? 82 : /low|limited/i.test(label) ? 39 : 64;
  return (
    <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
      <SectionTitle kicker="Recovery Gauge" title={label} note={`${score} index`} colors={colors} />
      <div style={{ display:"grid",gridTemplateColumns:"130px 1fr",gap:18,alignItems:"center" }} className="premium-gauge-wrap">
        <div style={{ width:130,height:130,borderRadius:"50%",background:`conic-gradient(${colors.greenC} ${score * 3.6}deg, #E3EBF4 0deg)`,display:"grid",placeItems:"center" }}>
          <div style={{ width:94,height:94,borderRadius:"50%",background:"#fff",display:"grid",placeItems:"center",textAlign:"center",border:`1px solid ${colors.border}` }}>
            <div>
              <div style={{ fontSize:28,fontWeight:900,color:colors.ink,lineHeight:1 }}>{score}</div>
              <div style={{ fontSize:10,fontWeight:900,letterSpacing:"0.12em",textTransform:"uppercase",color:colors.ink4 }}>Index</div>
            </div>
          </div>
        </div>
        <div style={{ color:colors.ink2,fontSize:13,lineHeight:1.75 }}><AnnotatedParagraph text={probability?.rationale || "Recovery framing will appear here when available from the Complete Billing Review generator."} color={colors.ink2} /></div>
      </div>
    </section>
  );
}

function NegotiationGrid({ items = [], colors }) {
  const list = items.length ? items : ["Ask for itemized support before discussing payment.", "Request documentation for any unclear charge.", "Use dates, account number, and service labels in every follow-up."];
  return (
    <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
      <SectionTitle kicker="Negotiation Grid" title="Leverage points" note={`${list.length} prompts`} colors={colors} />
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10 }}>
        {list.slice(0,6).map((item,index)=>(
          <div key={index} style={{ background:colors.surface2,border:`1px solid ${colors.border}`,borderRadius:15,padding:"13px 14px" }}>
            <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.1em",color:colors.greenC,marginBottom:7 }}>Point {index+1}</div>
            <div style={{ fontSize:13,color:colors.ink2,lineHeight:1.65 }}><AnnotatedParagraph text={asText(item)} color={colors.ink2} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EscalationLadder({ items = [], colors }) {
  const ladder = items.length ? items : ["Request itemized support.", "Ask for supervisor review.", "Escalate through patient financial services."];
  return (
    <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
      <SectionTitle kicker="Escalation Ladder" title="Who to contact next" note="Ordered path" colors={colors} />
      <div style={{ display:"grid",gap:10 }}>
        {ladder.slice(0,5).map((item,index)=>(
          <div key={index} style={{ display:"grid",gridTemplateColumns:"34px 1fr",gap:11,alignItems:"stretch" }}>
            <div style={{ display:"grid",justifyItems:"center" }}>
              <div style={{ width:32,height:32,borderRadius:12,background:index===0?colors.greenC:colors.navyC,color:"#fff",display:"grid",placeItems:"center",fontSize:12,fontWeight:900 }}>{index+1}</div>
              {index < ladder.length - 1 && <div style={{ width:2,background:"#D8E2EE",flex:1,marginTop:6 }} />}
            </div>
            <div style={{ background:colors.surface2,border:`1px solid ${colors.border}`,borderRadius:15,padding:"11px 13px",fontSize:13,lineHeight:1.65,color:colors.ink2 }}>
              <AnnotatedParagraph text={asText(item)} color={colors.ink2} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScriptBubbles({ script, guidance = [], colors }) {
  const lines = String(script || "").split(/\n+/).map(s=>s.trim()).filter(Boolean);
  const list = lines.length ? lines : guidance.length ? guidance : ["I am calling to request an itemized review of the charges on this account.", "Can you explain the documentation supporting this charge and note my dispute on the account?"];
  return (
    <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
      <SectionTitle kicker="Call-Script Bubbles" title="Conversation script" note="Copy-ready" colors={colors} />
      <div style={{ display:"grid",gap:10 }}>
        {list.slice(0,5).map((item,index)=>(
          <div key={index} style={{ display:"flex",justifyContent:index % 2 ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth:"88%",background:index % 2 ? "#EAF7F1" : colors.surface2,border:`1px solid ${colors.border}`,borderRadius:index % 2 ? "16px 16px 4px 16px" : "16px 16px 16px 4px",padding:"12px 14px",fontSize:13,lineHeight:1.65,color:colors.ink2 }}>
              <AnnotatedParagraph text={asText(item)} color={colors.ink2} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WeeklyChecklist({ actionPlan = [], colors }) {
  const fallback = [
    { title:"Collect itemized documents", timeframe:"Week 1", description:"Gather the bill, EOB, receipts, account number, and any collection notices." },
    { title:"Call billing office", timeframe:"Week 1", description:"Use the script to request clarification and account notes." },
    { title:"Escalate unresolved items", timeframe:"Week 2", description:"Ask for supervisor or patient financial services review." },
    { title:"Document every response", timeframe:"Weeks 3-4", description:"Track dates, names, reference numbers, and promised follow-up." }
  ];
  const list = actionPlan.length ? actionPlan : fallback;
  return (
    <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
      <SectionTitle kicker="Weekly Checklist" title="30-day action path" note={`${list.length} steps`} colors={colors} />
      <div style={{ display:"grid",gap:10 }}>
        {list.slice(0,6).map((step,index)=>(
          <label key={index} style={{ display:"grid",gridTemplateColumns:"24px 1fr auto",gap:11,alignItems:"start",background:colors.surface2,border:`1px solid ${colors.border}`,borderRadius:15,padding:"12px 13px",cursor:"pointer" }}>
            <input type="checkbox" style={{ width:18,height:18,accentColor:colors.greenC,marginTop:3 }} />
            <span>
              <span style={{ display:"block",fontSize:14,fontWeight:900,color:colors.ink,marginBottom:4 }}>{step.title || `Step ${index+1}`}</span>
              <span style={{ display:"block",fontSize:13,lineHeight:1.6,color:colors.ink2 }}>{step.description || asText(step)}</span>
            </span>
            <span style={{ fontSize:11,fontWeight:900,color:colors.navyC,background:"#EAF0FA",borderRadius:999,padding:"6px 8px",whiteSpace:"nowrap" }}>{step.timeframe || `Week ${Math.min(index+1,4)}`}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

function AdvocateNotes({ rights = [], colors }) {
  const notes = rights.length ? rights : ["Keep written records of billing conversations.", "Ask for itemized support before making payment arrangements.", "Educational support only; use professional advice where appropriate."];
  return (
    <section style={{ background:"#10203A",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:18,color:"#fff" }}>
      <div style={{ display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:"#93D7D3",marginBottom:6 }}>Advocate Notes</div>
          <div style={{ fontSize:20,fontWeight:900,letterSpacing:"-0.03em" }}>Rights and reminders</div>
        </div>
        <StatusPill tone="green">Keep handy</StatusPill>
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10 }}>
        {notes.slice(0,3).map((note,index)=>(
          <div key={index} style={{ background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:15,padding:"12px 13px",fontSize:12,lineHeight:1.65,color:"rgba(255,255,255,0.76)" }}>
            <AnnotatedParagraph text={asText(note)} color="rgba(255,255,255,0.76)" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PremiumDashboard({ results, session, copied, onCopy, onDownload, logoSrc, colors, mode, toggleMode }) {
  const [active, setActive] = useState("overview");
  const dossier = results?.paidDossier || {};
  const findings = results?.summary?.errorsFound || [];
  const actionPlan = results?.actionPlan || dossier.thirtyDayActionPlan || [];
  const reportHtml = buildReportHtml({ results, session, logoSrc });
  const darkShell = "#0E1A2F";
  const sidebar = "#10203A";
  const sidebar2 = "#172B4B";

  const nav = useMemo(() => [
    ["overview", "Overview"],
    ["findings", "Findings"],
    ["recovery", "Recovery"],
    ["escalation", "Escalation"],
    ["scripts", "Scripts"],
    ["checklist", "Checklist"]
  ], []);

  const metrics = [
    ["Provider", session?.provider || "Saved case", "blue"],
    ["Risk", results?.summary?.riskLevel || "Screened", "amber"],
    ["Findings", findings.length || "Ready", "green"],
    ["Plan", `${actionPlan.length || 30} days`, "blue"]
  ];

  const printReport = () => {
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    win.document.write(reportHtml);
    win.document.close();
    win.focus();
    window.setTimeout(() => win.print(), 300);
  };

  const panelMap = {
    overview: (
      <div style={{ display:"grid",gap:16 }}>
        <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
          <SectionTitle kicker="Case Brief" title="Active review summary" note="Premium dossier" colors={colors} />
          <div style={{ color:colors.ink2,fontSize:14,lineHeight:1.8 }}>
            <AnnotatedParagraph text={dossier.executiveOverview || results?.summary?.keyFindings || "Your Complete Billing Review is ready."} color={colors.ink2} />
          </div>
        </section>
        <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(320px,0.7fr)",gap:16 }} className="premium-two-col">
          <BenchmarkBars results={results} dossier={dossier} colors={colors} />
          <RecoveryGauge probability={dossier.recoveryProbability} colors={colors} />
        </div>
        <NegotiationGrid items={dossier.negotiationContext || []} colors={colors} />
        <AdvocateNotes rights={results?.yourRights || []} colors={colors} />
      </div>
    ),
    findings: (
      <div>
        <SectionTitle kicker="Findings Cards" title="Review signals" note={`${findings.length || 1} cards`} colors={colors} />
        <FindingCards findings={findings} colors={colors} />
      </div>
    ),
    recovery: (
      <div style={{ display:"grid",gridTemplateColumns:"minmax(0,0.8fr) minmax(0,1fr)",gap:16 }} className="premium-two-col">
        <RecoveryGauge probability={dossier.recoveryProbability} colors={colors} />
        <BenchmarkBars results={results} dossier={dossier} colors={colors} />
      </div>
    ),
    escalation: (
      <div style={{ display:"grid",gridTemplateColumns:"minmax(0,0.9fr) minmax(0,1fr)",gap:16 }} className="premium-two-col">
        <EscalationLadder items={dossier.escalationHierarchy || []} colors={colors} />
        <NegotiationGrid items={dossier.providerSpecificObservations || dossier.negotiationContext || []} colors={colors} />
      </div>
    ),
    scripts: (
      <div style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,0.9fr)",gap:16 }} className="premium-two-col">
        <ScriptBubbles script={results?.phoneScript} guidance={dossier.communicationGuidance || []} colors={colors} />
        <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:20,padding:18,boxShadow:"0 12px 28px rgba(15,23,42,0.06)" }}>
          <SectionTitle kicker="Dispute Letter" title="Written response" note="Draft" colors={colors} />
          <div style={{ maxHeight:420,overflow:"auto",fontSize:13,lineHeight:1.75,color:colors.ink2 }}>
            <AnnotatedParagraph text={results?.disputeLetter || "The dispute letter will appear here when included in the paid review."} color={colors.ink2} />
          </div>
        </section>
      </div>
    ),
    checklist: (
      <div style={{ display:"grid",gap:16 }}>
        <WeeklyChecklist actionPlan={actionPlan} colors={colors} />
        <AdvocateNotes rights={results?.yourRights || []} colors={colors} />
      </div>
    )
  };

  return (
    <main id="premium-dashboard" style={{ minHeight:"100vh",background:darkShell,fontFamily:"'DM Sans',sans-serif",color:colors.ink }}>
      <div style={{ position:"fixed",top:8,left:8,zIndex:9999,background:"#111827",color:"#fff",border:"2px solid #86EFAC",borderRadius:6,padding:"6px 8px",fontSize:12,fontWeight:900,fontFamily:"monospace" }}>
        ACTIVE_DASHBOARD_COMPONENT: src/PremiumDashboard.jsx
      </div>
      <style>{`
        @media print{body *{visibility:hidden!important}#premium-dashboard,#premium-dashboard *{visibility:visible!important}#premium-dashboard{position:absolute;left:0;top:0;width:100%;background:white!important}.no-print{display:none!important}}
        @media (max-width:1060px){.premium-workspace{grid-template-columns:1fr!important}.premium-sidebar{position:relative!important;min-height:auto!important}.premium-main{min-height:auto!important}.premium-case-header{grid-template-columns:1fr!important}.premium-two-col{grid-template-columns:1fr!important}.premium-gauge-wrap{grid-template-columns:1fr!important}.premium-actions{justify-content:flex-start!important}}
        @media (max-width:680px){.premium-root{padding:12px!important}.premium-metrics{grid-template-columns:repeat(2,1fr)!important}.premium-title{font-size:30px!important}.premium-panel{padding:16px!important}.premium-header-card{padding:18px!important}}
      `}</style>
      <div className="premium-root" style={{ padding:18 }}>
        <div className="premium-workspace" style={{ display:"grid",gridTemplateColumns:"292px minmax(0,1fr)",gap:18,maxWidth:1480,margin:"0 auto" }}>
          <aside className="premium-sidebar" style={{ background:sidebar,border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:18,color:"#fff",minHeight:"calc(100vh - 36px)",position:"sticky",top:18 }}>
            <div style={{ display:"flex",alignItems:"center",gap:11,marginBottom:22 }}>
              <img src={logoSrc} alt="UPA" style={{ width:58,height:58,objectFit:"contain",background:"#fff",borderRadius:15,padding:5 }} />
              <div>
                <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:"#93D7D3" }}>Active Case</div>
                <div style={{ fontSize:15,fontWeight:900,lineHeight:1.2 }}>{session?.provider || "Saved Review"}</div>
              </div>
            </div>

            <div style={{ background:sidebar2,border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:15,marginBottom:16 }}>
              <div style={{ fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.13em",color:"rgba(255,255,255,0.48)",marginBottom:6 }}>Amount Under Review</div>
              <div style={{ fontSize:25,fontWeight:900,letterSpacing:"-0.04em",lineHeight:1.1 }}>{session?.totalAmount ? `$${session.totalAmount}` : "Review Ready"}</div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.62)",lineHeight:1.6,marginTop:7 }}>{session?.insurance || "Saved insurance profile"}</div>
            </div>

            <nav className="no-print" style={{ display:"grid",gap:8 }}>
              {nav.map(([id,label])=>(
                <button key={id} type="button" onClick={()=>setActive(id)} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,width:"100%",background:active===id?"rgba(255,255,255,0.13)":"transparent",color:"#fff",border:`1px solid ${active===id?"rgba(147,215,211,0.46)":"rgba(255,255,255,0.06)"}`,borderRadius:13,padding:"11px 12px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit",textAlign:"left" }}>
                  <span>{label}</span>
                  <span style={{ color:active===id ? "#93D7D3" : "rgba(255,255,255,0.45)" }}>{">"}</span>
                </button>
              ))}
            </nav>

            <div className="no-print" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:18 }}>
              <button type="button" onClick={printReport} style={{ background:"#fff",color:sidebar,border:"none",borderRadius:12,padding:"11px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit" }}>Print</button>
              <button type="button" onClick={()=>onDownload(reportHtml)} style={{ background:colors.greenC,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit" }}>Download</button>
              <button type="button" onClick={onCopy} style={{ gridColumn:"1 / -1",background:"rgba(255,255,255,0.08)",color:"#fff",border:"1px solid rgba(255,255,255,0.14)",borderRadius:12,padding:"11px",fontSize:12,fontWeight:900,cursor:"pointer",fontFamily:"inherit" }}>{copied ? "Copied" : "Copy Text"}</button>
            </div>

            <button type="button" onClick={toggleMode} className="no-print" style={{ marginTop:12,width:"100%",background:"transparent",color:"rgba(255,255,255,0.72)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"10px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>{mode === "dark" ? "Day" : "Night"}</button>
          </aside>

          <section className="premium-main" style={{ minHeight:"calc(100vh - 36px)",display:"grid",gridTemplateRows:"auto 1fr",gap:16 }}>
            <header className="premium-case-header" style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:16,alignItems:"stretch" }}>
              <div className="premium-header-card" style={{ background:"linear-gradient(135deg,#FFFFFF 0%,#F4F8FC 100%)",border:`1px solid ${colors.border}`,borderRadius:24,padding:22,boxShadow:"0 18px 44px rgba(15,23,42,0.14)" }}>
                <div style={{ display:"flex",gap:9,alignItems:"center",marginBottom:9,flexWrap:"wrap" }}>
                  <StatusPill tone="green">Paid Review Ready</StatusPill>
                  <StatusPill tone="blue">Workspace Mode</StatusPill>
                </div>
                <h1 className="premium-title" style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:39,lineHeight:1.04,letterSpacing:"-0.045em",margin:"0 0 10px",color:colors.ink }}>Premium billing workspace</h1>
                <div style={{ maxWidth:820,color:colors.ink2,fontSize:14,lineHeight:1.75 }}>
                  <AnnotatedParagraph text={dossier.executiveOverview || results?.summary?.keyFindings || "Your Complete Billing Review is ready."} color={colors.ink2} />
                </div>
              </div>
              <div className="premium-metrics" style={{ display:"grid",gridTemplateColumns:"repeat(2,156px)",gap:10 }}>
                {metrics.map(([label,value,tone])=>(
                  <div key={label} style={{ background:"#fff",border:`1px solid ${colors.border}`,borderRadius:18,padding:"14px 15px",boxShadow:"0 12px 30px rgba(15,23,42,0.08)" }}>
                    <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:5 }}>
                      <span style={{ width:7,height:7,borderRadius:"50%",background:tone === "green" ? colors.greenC : tone === "amber" ? "#D8A24A" : colors.navyC }} />
                      <div style={{ fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.12em",color:colors.ink4 }}>{label}</div>
                    </div>
                    <div style={{ fontSize:15,fontWeight:900,color:colors.ink,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{value}</div>
                  </div>
                ))}
              </div>
            </header>

            <section className="premium-panel" style={{ background:"#F4F7FB",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:18,boxShadow:"0 18px 44px rgba(0,0,0,0.14)",overflow:"auto" }}>
              {panelMap[active]}
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
