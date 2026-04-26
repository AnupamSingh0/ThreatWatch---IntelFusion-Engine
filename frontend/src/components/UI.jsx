import React from "react";
export function Panel({ title, accent="var(--accent)", children, style={} }) {
  return (
    <div className="panel" style={style}>
      {title && <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        <div style={{width:3,height:14,background:accent,borderRadius:2}}/>
        <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text)"}}>{title}</span>
      </div>}
      {children}
    </div>
  );
}
export function ScoreBadge({score}) {
  const color=score>=90?"var(--red)":score>=70?"var(--yellow)":"var(--accent)";
  return <span className="mono" style={{background:color+"22",color,border:`1px solid ${color}55`,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:700}}>{score}</span>;
}
export function Pill({label,color="var(--accent)"}) {
  return <span style={{background:color+"18",color,border:`1px solid ${color}30`,borderRadius:20,padding:"2px 9px",fontSize:10,fontWeight:600,marginRight:4,display:"inline-block"}}>{label}</span>;
}
export function StatCard({label,value,sub,color="var(--accent)"}) {
  return (
    <div className="panel" style={{display:"flex",flexDirection:"column",gap:6}}>
      <span style={{fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--dim)"}}>{label}</span>
      <span className="mono" style={{fontSize:32,fontWeight:800,color,lineHeight:1}}>{value}</span>
      <span style={{fontSize:11,color:"var(--muted)"}}>{sub}</span>
    </div>
  );
}
export function Spinner({size=20}) {
  return <div style={{width:size,height:size,border:"2px solid var(--border)",borderTop:"2px solid var(--accent)",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>;
}
export function ProgressBar({value,max=100,color="var(--accent)"}) {
  return <div style={{background:"var(--border)",borderRadius:3,height:5,overflow:"hidden"}}><div style={{width:`${Math.min((value/max)*100,100)}%`,height:"100%",background:color,borderRadius:3,transition:"width 0.6s ease"}}/></div>;
}
export function Empty({message="No data yet."}) {
  return <div style={{textAlign:"center",padding:"40px 20px",color:"var(--muted)",fontSize:13}}><div style={{fontSize:28,marginBottom:10}}>🛡</div>{message}</div>;
}
const s=document.createElement("style");
s.textContent="@keyframes spin{to{transform:rotate(360deg)}}";
document.head.appendChild(s);
