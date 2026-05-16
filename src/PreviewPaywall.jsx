import { AnnotatedParagraph } from "./TermTooltip.jsx";

export default function PreviewPaywall({
  results,
  form,
  userName,
  mode,
  toggleMode,
  onCheckout,
  checkoutStatus,
  logoSrc,
  logoFallback
}) {
  const dark = mode === "dark";
  const { summary = {}, preview = {} } = results || {};
  const bg = dark ? "#141924" : "#F2F5F9";
  const surface = dark ? "#1C2035" : "#fff";
  const surface2 = dark ? "#1A2030" : "#EBF0F8";
  const ink = dark ? "#F0F4F8" : "#1E293B";
  const ink2 = dark ? "#CBD5E1" : "#374151";
  const ink3 = dark ? "#94A3B8" : "#6B7280";
  const ink4 = dark ? "#64748B" : "#94A3B8";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const border2 = dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)";
  const navyC = dark ? "#4A7BD4" : "#1F3A68";
  const navyL = dark ? "#1A2A45" : "#EBF0FA";
  const greenC = dark ? "#3DAF6A" : "#2F7A4F";
  const greenL = dark ? "#0D2218" : "#E8F5EE";
  const redC = dark ? "#F87171" : "#C0392B";
  const redL = dark ? "rgba(248,113,113,0.12)" : "#FEF2F0";
  const amberC = dark ? "#FCD34D" : "#92400E";
  const amberL = dark ? "rgba(252,211,77,0.12)" : "#FFF8EC";
  const riskLevel = String(summary.riskLevel || "MEDIUM").toUpperCase();
  const riskScore = riskLevel === "HIGH" ? 82 : riskLevel === "LOW" ? 38 : 61;
  const teaserFinding = preview.teaserFinding || summary.errorsFound?.[0] || summary.keyFindings || "One billing pattern in your intake deserves a deeper forensic review.";
  const visibleFindings = [
    teaserFinding,
    ...(summary.errorsFound || []).filter(item => item && item !== teaserFinding)
  ].slice(0, 3);
  const lockedFindings = preview.lockedModuleReferences?.length ? preview.lockedModuleReferences : [
    "CPT code and charge-level comparison",
    "Provider negotiation posture",
    "Escalation sequence and contact path",
    "Personalized call script",
    "30-day action plan"
  ];
  const benchmarkRows = [
    ["Submitted charge", form?.totalBilled ? `$${Number(form.totalBilled).toLocaleString()}` : "Submitted bill", 92, redC],
    ["Reference benchmark", "Medicare / public rate context", 52, navyC],
    ["Review visibility", "Full detail locked", 34, greenC]
  ];
  const cptCards = [
    ["CPT / HCPCS Review", "Code-level charge checks unlock in the Complete Billing Review.", redC],
    ["Duplicate Charge Scan", "Repeated lines, bundled services, and date mismatches are reviewed.", amberC],
    ["Itemized Bill Questions", "Prepared questions help you request supporting detail.", greenC]
  ];
  const lockIcon = (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );

  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif",background:bg,minHeight:"100vh",color:ink }}>
      <div style={{ position:"fixed",top:8,left:8,zIndex:9999,background:"#111827",color:"#fff",border:"2px solid #FCD34D",borderRadius:6,padding:"6px 8px",fontSize:12,fontWeight:900,fontFamily:"monospace" }}>
        ACTIVE_PREVIEW_COMPONENT: src/PreviewPaywall.jsx
      </div>
      <style>{`
        @media (max-width:820px){.preview-shell{padding:22px 14px 34px!important}.preview-main-grid,.preview-card-grid,.preview-lock-grid,.preview-cta-inner{grid-template-columns:1fr!important}.preview-nav{padding:10px 14px!important}.preview-title{font-size:31px!important}.preview-actions{text-align:left!important}.preview-meter{grid-template-columns:1fr!important}}
      `}</style>

      <div style={{ background:"#7C1D1D",color:"#fff",padding:"10px 20px",textAlign:"center",fontSize:13,fontWeight:900,letterSpacing:"0.02em" }}>
        Forensic preview only: full CPT review, benchmark context, scripts, and action plan are locked until checkout.
      </div>

      <nav className="preview-nav" style={{ background:surface,borderBottom:`1px solid ${border}`,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100 }}>
        <div style={{ display:"flex",alignItems:"center",gap:11 }}>
          <img src={logoSrc} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=logoFallback; }} style={{ height:70,width:"auto",flexShrink:0 }}/>
          <div style={{ display:"flex",flexDirection:"column",lineHeight:1 }}>
            <div style={{ fontSize:"1.1rem",letterSpacing:"-0.025em",whiteSpace:"nowrap",lineHeight:1.05 }}>
              <span style={{ fontWeight:900,color:dark?"#fff":navyC }}>United</span>
              <span style={{ fontWeight:500,color:"#1A7A8C" }}> Patient</span>
            </div>
            <div style={{ fontSize:"0.5rem",fontWeight:600,letterSpacing:"0.3em",textTransform:"uppercase",color:ink4,textAlign:"center",marginTop:3 }}>Advocate</div>
          </div>
        </div>
        <button onClick={toggleMode} style={{ padding:"8px 14px",borderRadius:40,border:`1.5px solid ${border2}`,background:"transparent",color:ink3,cursor:"pointer",fontSize:13,fontWeight:600,fontFamily:"inherit" }}>
          {dark ? "Day" : "Night"}
        </button>
      </nav>

      <main className="preview-shell" style={{ maxWidth:1180,margin:"0 auto",padding:"28px 20px 46px" }}>
        <section style={{ background:`linear-gradient(135deg, ${surface} 0%, ${dark ? "#17233A" : "#F8FBFE"} 100%)`,border:`1px solid ${border}`,borderRadius:24,padding:"28px",marginBottom:18,boxShadow:"0 14px 36px rgba(15,23,42,0.1)" }}>
          <div style={{ display:"flex",justifyContent:"space-between",gap:18,alignItems:"flex-start",flexWrap:"wrap",marginBottom:16 }}>
            <div>
              <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.16em",color:redC,marginBottom:9 }}>Phase 1 Forensic Preview</div>
              <h1 className="preview-title" style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:42,fontWeight:800,letterSpacing:"-0.04em",lineHeight:1.05,color:ink,margin:"0 0 12px" }}>
                {userName ? `${userName}, your` : "Your"} bill has review signals.
              </h1>
              <p style={{ color:ink2,fontSize:15,lineHeight:1.82,maxWidth:760,margin:0 }}>
                We screened the intake for {form?.providerName || "your provider"}. This preview shows a limited forensic snapshot. The complete review unlocks CPT context, benchmark notes, scripts, and the action plan.
              </p>
            </div>
            <div style={{ background:riskLevel === "HIGH" ? redL : amberL,border:`1px solid ${riskLevel === "HIGH" ? "rgba(192,57,43,0.22)" : "rgba(146,64,14,0.22)"}`,borderRadius:18,padding:"15px 16px",minWidth:178 }}>
              <div style={{ fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.12em",color:ink4,marginBottom:5 }}>Priority Signal</div>
              <div style={{ fontSize:25,fontWeight:900,color:riskLevel === "HIGH" ? redC : amberC }}>{riskLevel}</div>
              <div style={{ height:8,borderRadius:999,background:dark?"rgba(255,255,255,0.1)":"#E5E7EB",marginTop:10,overflow:"hidden" }}>
                <div style={{ width:`${riskScore}%`,height:"100%",background:riskLevel === "HIGH" ? redC : amberC,borderRadius:999 }} />
              </div>
            </div>
          </div>

          <div className="preview-card-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
            {[["Provider",form?.providerName || "Submitted bill"],["Total billed",form?.totalBilled ? `$${Number(form.totalBilled).toLocaleString()}` : "Submitted total"],["Preview scope","1 visible finding / premium locked"]].map(([label,value])=>(
              <div key={label} style={{ background:surface2,border:`1px solid ${border}`,borderRadius:14,padding:"13px 14px" }}>
                <div style={{ fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.12em",color:ink4,marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:14,fontWeight:900,color:ink,lineHeight:1.4 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="preview-main-grid" style={{ display:"grid",gridTemplateColumns:"1.08fr .92fr",gap:18,alignItems:"start",marginBottom:18 }}>
          <div style={{ display:"grid",gap:18 }}>
            <section style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:22 }}>
              <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:greenC,marginBottom:12 }}>Visible Finding</div>
              <div style={{ background:greenL,border:`1px solid rgba(47,122,79,0.18)`,borderRadius:18,padding:18 }}>
                <div style={{ display:"flex",gap:13,alignItems:"flex-start" }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:greenC,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,flexShrink:0 }}>1</div>
                  <div style={{ fontSize:15,color:ink2,lineHeight:1.85 }}><AnnotatedParagraph text={visibleFindings[0]} color={ink2} /></div>
                </div>
              </div>
            </section>

            <section style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:22 }}>
              <div style={{ display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:14 }}>
                <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:ink4 }}>CPT / Finding Cards</div>
                <div style={{ fontSize:12,fontWeight:900,color:redC }}>Forensic modules</div>
              </div>
              <div className="preview-card-grid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12 }}>
                {cptCards.map(([title,body,color],index)=>(
                  <div key={title} style={{ border:`1px solid ${border}`,background:index===0?redL:surface2,borderRadius:16,padding:15,minHeight:145 }}>
                    <div style={{ width:30,height:30,borderRadius:10,background:color,color:"#fff",display:"grid",placeItems:"center",fontSize:12,fontWeight:900,marginBottom:10 }}>{index+1}</div>
                    <div style={{ fontSize:14,fontWeight:900,color:ink,marginBottom:7 }}>{title}</div>
                    <div style={{ fontSize:12,color:ink2,lineHeight:1.65 }}>{body}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div style={{ display:"grid",gap:18 }}>
            <section style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:22 }}>
              <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:ink4,marginBottom:12 }}>Benchmark Bars</div>
              {benchmarkRows.map(([label,value,width,color])=>(
                <div key={label} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex",justifyContent:"space-between",gap:10,fontSize:12,fontWeight:900,color:ink,marginBottom:7 }}>
                    <span>{label}</span><span style={{ color:ink4 }}>{value}</span>
                  </div>
                  <div style={{ height:11,borderRadius:999,background:dark?"rgba(255,255,255,0.08)":"#E5E7EB",overflow:"hidden" }}>
                    <div style={{ width:`${width}%`,height:"100%",background:color,borderRadius:999 }} />
                  </div>
                </div>
              ))}
            </section>

            <section style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:22 }}>
              <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:ink4,marginBottom:12 }}>Review Visibility Meter</div>
              <div className="preview-meter" style={{ display:"grid",gridTemplateColumns:"96px 1fr",gap:16,alignItems:"center" }}>
                <div style={{ width:96,height:96,borderRadius:"50%",background:`conic-gradient(${greenC} 86deg, ${dark?"rgba(255,255,255,0.08)":"#E5E7EB"} 0deg)`,display:"grid",placeItems:"center" }}>
                  <div style={{ width:68,height:68,borderRadius:"50%",background:surface,display:"grid",placeItems:"center",border:`1px solid ${border}` }}>
                    <div style={{ textAlign:"center" }}><div style={{ fontSize:20,fontWeight:900,color:ink }}>24%</div><div style={{ fontSize:9,fontWeight:900,color:ink4 }}>VISIBLE</div></div>
                  </div>
                </div>
                <div style={{ color:ink2,fontSize:13,lineHeight:1.75 }}>
                  The preview reveals the first signal only. The remaining review context is locked behind the Complete Billing Review.
                </div>
              </div>
            </section>
          </div>
        </section>

        <section className="preview-lock-grid" style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:18 }}>
          <div style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:22,overflow:"hidden" }}>
            <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:ink4,marginBottom:12 }}>Blurred Locked Findings</div>
            {lockedFindings.slice(0,4).map((title,index)=>(
              <div key={title} style={{ position:"relative",display:"flex",gap:10,alignItems:"flex-start",padding:"11px 0",borderTop:index?`1px solid ${border}`:"none" }}>
                <div style={{ color:navyC,marginTop:2 }}>{lockIcon}</div>
                <div style={{ flex:1,filter:"blur(3.5px)",userSelect:"none",opacity:.62 }}>
                  <div style={{ fontSize:14,fontWeight:900,color:ink,marginBottom:4 }}>{title}</div>
                  <div style={{ fontSize:12,color:ink2,lineHeight:1.6 }}>Prepared evidence language and detailed review notes are included in the full workspace.</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display:"grid",gap:18 }}>
            <div style={{ position:"relative",background:surface,border:`1px solid ${border}`,borderRadius:22,padding:22,overflow:"hidden" }}>
              <div style={{ display:"flex",gap:9,alignItems:"center",fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:ink4,marginBottom:12 }}>{lockIcon} Locked Call-Script Preview</div>
              <div style={{ filter:"blur(3px)",opacity:.68,userSelect:"none" }}>
                {["Opening language for billing office", "Clarifying question sequence", "Escalation phrase if needed"].map(item=>(
                  <div key={item} style={{ background:surface2,border:`1px solid ${border}`,borderRadius:999,padding:"9px 12px",fontSize:12,color:ink2,marginBottom:8 }}>{item}</div>
                ))}
              </div>
            </div>
            <div style={{ position:"relative",background:surface,border:`1px solid ${border}`,borderRadius:22,padding:22,overflow:"hidden" }}>
              <div style={{ display:"flex",gap:9,alignItems:"center",fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:ink4,marginBottom:12 }}>{lockIcon} Locked Action-Plan Preview</div>
              <div style={{ filter:"blur(3px)",opacity:.68,userSelect:"none" }}>
                {["Day 1: Request itemized support", "Day 7: Follow up with documentation", "Day 14: Escalate review channel"].map(item=>(
                  <div key={item} style={{ display:"grid",gridTemplateColumns:"18px 1fr",gap:8,fontSize:12,color:ink2,marginBottom:9 }}><span style={{ width:16,height:16,borderRadius:4,border:`1px solid ${border2}` }} />{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ background:`linear-gradient(135deg, ${navyC} 0%, #13213A 100%)`,borderRadius:24,padding:"30px",color:"#fff",boxShadow:"0 16px 38px rgba(15,23,42,0.24)" }}>
          <div className="preview-cta-inner" style={{ display:"grid",gridTemplateColumns:"minmax(0,1fr) 220px",gap:22,alignItems:"center" }}>
            <div>
              <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.15em",color:"rgba(255,255,255,0.62)",marginBottom:8 }}>Unlock the forensic workspace</div>
              <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:34,fontWeight:800,letterSpacing:"-0.03em",lineHeight:1.08,margin:"0 0 10px" }}>Get the complete CPT review, benchmarks, scripts, and action plan.</h2>
              <p style={{ color:"rgba(255,255,255,0.78)",fontSize:14,lineHeight:1.8,margin:0 }}>Includes the full analysis, locked findings, communication guidance, prepared questions, escalation path, and 30-day workflow.</p>
            </div>
            <div className="preview-actions" style={{ textAlign:"right" }}>
              <div style={{ fontSize:13,color:"rgba(255,255,255,0.62)",textDecoration:"line-through",marginBottom:4 }}>Was $197</div>
              <div style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:48,fontWeight:800,lineHeight:1,marginBottom:12 }}>$97</div>
              <button type="button" onClick={onCheckout} disabled={checkoutStatus==="opening"} style={{ width:"100%",background:"linear-gradient(135deg,#2F7A4F,#276644)",color:"#fff",border:"none",borderRadius:14,padding:"16px 18px",fontSize:16,fontWeight:900,fontFamily:"inherit",cursor:checkoutStatus==="opening"?"wait":"pointer",boxShadow:"0 8px 26px rgba(47,122,79,0.42)" }}>
                {checkoutStatus==="opening" ? "Opening Secure Checkout..." : "Continue to Billing Review"}
              </button>
            </div>
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",fontSize:12,color:"rgba(255,255,255,0.68)",lineHeight:1.6,marginTop:14 }}>
            <span>Secure checkout opens next</span><span>Return to /success after payment</span><span>Same session handoff preserved</span>
          </div>
        </section>
      </main>
    </div>
  );
}
