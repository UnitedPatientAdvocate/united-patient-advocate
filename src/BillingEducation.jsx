export default function BillingEducation({ dark = false, surface = "#fff", surface2 = "#EBF0F8", ink = "#1E293B", ink2 = "#374151", ink3 = "#6B7280", border = "rgba(0,0,0,0.08)", navyC = "#1F3A68", greenC = "#2F7A4F" }) {
  const items = [
    ["Start with the itemized bill", "Ask for the detailed bill if you only have a summary. It helps show dates, codes, quantities, and repeated charges."],
    ["Compare with your EOB", "Your Explanation of Benefits can show what insurance allowed, paid, denied, or left as patient responsibility."],
    ["Use simple questions", "Ask the billing office to explain unclear codes, duplicate-looking charges, facility fees, and any balance that does not match your insurance paperwork."]
  ];

  return (
    <section className="success-card" style={{ background:surface,border:`1px solid ${border}`,borderRadius:22,padding:24,marginBottom:18 }}>
      <div style={{ fontSize:11,fontWeight:900,textTransform:"uppercase",letterSpacing:"0.14em",color:greenC,marginBottom:8 }}>Billing basics</div>
      <h2 style={{ fontFamily:"'Playfair Display',Georgia,serif",fontSize:25,lineHeight:1.15,fontWeight:800,letterSpacing:"-0.03em",margin:"0 0 10px",color:ink }}>What to have ready before your review</h2>
      <p style={{ color:ink3,fontSize:14,lineHeight:1.75,margin:"0 0 16px",maxWidth:720 }}>These are the most helpful documents and questions for a cleaner billing review. Plain copies are fine.</p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12 }}>
        {items.map(([title,body], index)=>(
          <div key={title} style={{ background:index===0?surface2:(dark?"rgba(255,255,255,0.04)":"#F8FAFC"),border:`1px solid ${border}`,borderRadius:15,padding:"15px 15px 16px" }}>
            <div style={{ width:28,height:28,borderRadius:"50%",background:index===0?navyC:"rgba(47,122,79,0.12)",color:index===0?"#fff":greenC,display:"grid",placeItems:"center",fontSize:12,fontWeight:900,marginBottom:10 }}>{index+1}</div>
            <div style={{ fontSize:14,fontWeight:900,color:ink,marginBottom:6,lineHeight:1.35 }}>{title}</div>
            <div style={{ fontSize:13,color:ink2,lineHeight:1.65,overflowWrap:"anywhere" }}>{body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
