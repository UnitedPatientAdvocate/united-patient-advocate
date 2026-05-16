import BillingEducation from "./BillingEducation.jsx";

function StatusDot({ tone = "green" }) {
  const color = tone === "green" ? "#35B779" : tone === "amber" ? "#D8A24A" : "#7FA3D8";
  return (
    <span style={{ width:9,height:9,borderRadius:"50%",background:color,boxShadow:`0 0 0 4px ${color}24`,display:"inline-block",flexShrink:0 }} />
  );
}

function MiniMetric({ label, value }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"12px 13px" }}>
      <div style={{ fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.12em",color:"rgba(255,255,255,0.46)",marginBottom:5 }}>{label}</div>
      <div style={{ fontSize:14,fontWeight:900,color:"#fff",lineHeight:1.25,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{value}</div>
    </div>
  );
}

function WorkspaceSidebar({ session, logoSrc, logoFallback, mode, toggleMode }) {
  const nav = ["Session", "Documents", "Generate", "Dashboard"];
  return (
    <aside className="entry-sidebar" style={{ background:"#10203A",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:18,color:"#fff",minHeight:"calc(100vh - 36px)",position:"sticky",top:18 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:22 }}>
        <img src={logoSrc} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=logoFallback; }} style={{ width:58,height:58,objectFit:"contain",background:"#fff",borderRadius:15,padding:5 }} />
        <div>
          <div style={{ fontSize:10,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:"#93D7D3",marginBottom:5 }}>Premium Workspace</div>
          <div style={{ fontSize:15,fontWeight:900,lineHeight:1.2 }}>Billing Review</div>
        </div>
      </div>

      <div style={{ background:"#172B4B",border:"1px solid rgba(255,255,255,0.09)",borderRadius:18,padding:14,marginBottom:16 }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:9 }}>
          <StatusDot />
          <span style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.12em",color:"#93D7D3" }}>Active Case</span>
        </div>
        <div style={{ fontSize:20,fontWeight:900,letterSpacing:"-0.03em",lineHeight:1.1,marginBottom:7 }}>{session?.provider || "Saved Review"}</div>
        <div style={{ fontSize:12,color:"rgba(255,255,255,0.62)",lineHeight:1.55 }}>{session?.insurance || "Insurance profile saved"}</div>
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18 }}>
        <MiniMetric label="Total" value={session?.totalAmount ? `$${session.totalAmount}` : "Saved"} />
        <MiniMetric label="Patient" value={session?.patientName || "Session"} />
      </div>

      <nav style={{ display:"grid",gap:8 }}>
        {nav.map((item,index)=>(
          <div key={item} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,border:"1px solid rgba(255,255,255,0.08)",background:index < 2 ? "rgba(255,255,255,0.1)" : "transparent",borderRadius:13,padding:"11px 12px" }}>
            <span style={{ display:"flex",alignItems:"center",gap:9,fontSize:13,fontWeight:900 }}>
              <StatusDot tone={index < 2 ? "green" : "blue"} />
              {item}
            </span>
            <span style={{ fontSize:11,color:"rgba(255,255,255,0.5)",fontWeight:900 }}>{index < 2 ? "Ready" : "Next"}</span>
          </div>
        ))}
      </nav>

      <button type="button" onClick={toggleMode} style={{ marginTop:16,width:"100%",background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.78)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:12,padding:"10px",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit" }}>
        {mode === "dark" ? "Day" : "Night"}
      </button>
    </aside>
  );
}

function LoadingPanel({ status, error, colors }) {
  const steps = [
    ["Case intake", "Saved purchase session connected", "green"],
    ["Document center", "Ready for bill and EOB uploads", "blue"],
    ["AI review", status === "loading" ? "Generating premium dossier" : "Standing by", status === "loading" ? "amber" : "blue"],
    ["Workspace", "Dashboard opens when generation completes", "blue"]
  ];

  return (
    <section style={{ background:"#FFFFFF",border:`1px solid ${colors.border}`,borderRadius:24,padding:24,boxShadow:"0 18px 44px rgba(15,23,42,0.12)",marginBottom:16 }}>
      <div style={{ display:"flex",justifyContent:"space-between",gap:14,alignItems:"flex-start",flexWrap:"wrap",marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:colors.greenC,marginBottom:7 }}>Preparation Queue</div>
          <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:34,lineHeight:1.05,letterSpacing:"-0.04em",margin:"0 0 9px",color:colors.ink }}>Your Complete Billing Review is being prepared</h1>
          <p style={{ maxWidth:720,color:colors.ink2,fontSize:14,lineHeight:1.75,margin:0 }}>The premium workspace is assembling the analysis, negotiation context, scripts, escalation map, and weekly checklist from the saved case.</p>
        </div>
        <div style={{ width:64,height:64,borderRadius:"50%",border:`5px solid ${colors.navyL}`,borderTopColor:colors.greenC,animation:status === "loading" ? "spin 1s linear infinite" : "none",flexShrink:0 }} />
      </div>

      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginBottom:16 }}>
        {steps.map(([title,desc,tone])=>(
          <div key={title} style={{ background:colors.surface2,border:`1px solid ${colors.border}`,borderRadius:16,padding:"14px 15px" }}>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
              <StatusDot tone={tone} />
              <div style={{ fontSize:13,fontWeight:900,color:colors.ink }}>{title}</div>
            </div>
            <div style={{ fontSize:12,color:colors.ink3,lineHeight:1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      {status === "error" ? (
        <div style={{ background:"#FFF5F3",border:"1px solid rgba(192,57,43,0.18)",borderRadius:16,padding:"15px 16px" }}>
          <div style={{ fontSize:15,fontWeight:900,color:"#B64232",marginBottom:6 }}>Preparation issue</div>
          <div style={{ fontSize:13,color:"#743126",lineHeight:1.65,marginBottom:12 }}>{error}</div>
          <button type="button" onClick={()=>window.location.reload()} style={{ background:colors.navyC,color:"#fff",border:"none",borderRadius:11,padding:"11px 14px",fontSize:13,fontWeight:900,cursor:"pointer",fontFamily:"inherit" }}>Try Again</button>
        </div>
      ) : (
        <div style={{ background:"#EEF7F4",border:"1px solid rgba(53,183,121,0.18)",borderRadius:16,padding:"15px 16px",display:"flex",gap:11,alignItems:"flex-start" }}>
          <StatusDot />
          <div>
            <div style={{ fontSize:14,fontWeight:900,color:colors.ink,marginBottom:4 }}>Premium dashboard loading</div>
            <div style={{ fontSize:13,color:colors.ink2,lineHeight:1.65 }}>Keep this page open. The paid workspace will replace this screen automatically when the review finishes.</div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function WorkspaceEntry({
  mode,
  toggleMode,
  session,
  status,
  error,
  children,
  uploadPanel,
  faq,
  logoSrc,
  logoFallback,
  colors
}) {
  if (!session) {
    return (
      <div style={{ fontFamily:"'DM Sans',sans-serif",background:"#101C32",minHeight:"100vh",display:"grid",placeItems:"center",padding:24,color:"#fff" }}>
        <div style={{ background:"#13213A",border:"1px solid rgba(255,255,255,0.1)",borderRadius:24,padding:"34px 30px",maxWidth:560,width:"100%",textAlign:"center",boxShadow:"0 22px 60px rgba(0,0,0,0.28)" }}>
          <img src={logoSrc} alt="UPA" onError={(e)=>{ e.currentTarget.onerror=null; e.currentTarget.src=logoFallback; }} style={{ height:82,width:"auto",margin:"0 auto 18px",display:"block",background:"#fff",borderRadius:18,padding:6 }} />
          <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:"#93D7D3",marginBottom:9 }}>Session Handoff</div>
          <h1 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:30,fontWeight:800,letterSpacing:"-0.04em",lineHeight:1.08,margin:"0 0 12px" }}>We couldn't find your saved review session on this device.</h1>
          <p style={{ fontSize:14,color:"rgba(255,255,255,0.68)",lineHeight:1.75,margin:"0 0 20px" }}>Return to the analyzer from the same browser used for checkout, or contact support for help reconnecting the case.</p>
          <button type="button" onClick={()=>{ window.location.href="/"; }} style={{ background:"#35B779",color:"#fff",border:"none",borderRadius:12,padding:"13px 17px",fontSize:14,fontWeight:900,cursor:"pointer",fontFamily:"inherit" }}>Return to Analyzer</button>
        </div>
      </div>
    );
  }

  return (
    <main style={{ fontFamily:"'DM Sans',sans-serif",background:"#101C32",minHeight:"100vh",color:colors.ink }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width:920px){.entry-workspace{grid-template-columns:1fr!important}.entry-sidebar{position:relative!important;min-height:auto!important}.entry-root{padding:12px!important}}
        @media (max-width:640px){.entry-shell{padding:16px!important}.entry-title{font-size:28px!important}}
      `}</style>
      <div className="entry-root" style={{ padding:18 }}>
        <div className="entry-workspace" style={{ display:"grid",gridTemplateColumns:"280px minmax(0,1fr)",gap:18,maxWidth:1420,margin:"0 auto" }}>
          <WorkspaceSidebar session={session} logoSrc={logoSrc} logoFallback={logoFallback} mode={mode} toggleMode={toggleMode} />

          <section className="entry-shell" style={{ minHeight:"calc(100vh - 36px)",background:"#F4F7FB",border:"1px solid rgba(255,255,255,0.08)",borderRadius:24,padding:22,overflow:"hidden" }}>
            <LoadingPanel status={status} error={error} colors={colors} />
            <div id="document-upload" style={{ marginBottom:16 }}>{uploadPanel}</div>
            <BillingEducation dark={mode === "dark"} surface={colors.surface} surface2={colors.surface2} ink={colors.ink} ink2={colors.ink2} ink3={colors.ink3} border={colors.border} navyC={colors.navyC} greenC={colors.greenC} />
            {children}
            {faq}
            <section style={{ background:"#EAF3F1",border:"1px solid rgba(53,183,121,0.16)",borderRadius:16,padding:"14px 16px",fontSize:12,color:colors.ink3,lineHeight:1.7 }}>
              Advocate note: keep bills, EOBs, payment receipts, collection notices, and any prior call reference numbers together before using the scripts.
            </section>
          </section>
        </div>
      </div>
    </main>
  );
}
