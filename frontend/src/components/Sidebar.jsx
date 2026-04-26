console.log("THIS SIDEBAR IS LOADED");
import React from "react";
import { NavLink } from "react-router-dom";
const NAV = [
  {to:"/dashboard",icon:"▦", label:"Dashboard"},
  {to:"/lookup",   icon:"⌕", label:"IP Lookup"},
  {to:"/feed",     icon:"◉", label:"Threat Feed"},
  {to:"/pulses",   icon:"⚡",label:"OTX Pulses"},
  {to:"/correlate",icon:"⬡", label:"Correlate"},
  {to:"/#",icon:"🗺", label:"Attack Mapper (Comming Soon)"}, //coming soon
];
export default function Sidebar() {
  return (
    <aside style={{width:220,minHeight:"100vh",background:"rgba(10,15,24,0.97)",borderRight:"1px solid var(--border)",display:"flex",flexDirection:"column"}}>
      <div style={{padding:"18px 16px 14px",borderBottom:"1px solid var(--border)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo 2.png" alt="ThreatWatch Logo" className="src" style={{ width:180, height:120, objectFit:"contain" }}/>
         {/* <div>
            <div style={{fontFamily:"var(--font-mono)",fontWeight:800,fontSize:12,letterSpacing:"0.08em"}}>
              <span style={{color:"var(--text)"}}>THREAT</span><span style={{color:"var(--accent)"}}>WATCH</span>
            </div>
            <div style={{fontSize:9,color:"var(--dim)",letterSpacing:"0.1em"}}>INTELFUSION ENGINE</div>
          </div>*/}
        </div>
      </div>
      <nav style={{padding:"12px 10px",flex:1}}>
        {NAV.map(({to,icon,label})=>(
          <NavLink key={to} to={to} end={to==="/"} style={({isActive})=>({
            display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:7,marginBottom:2,
            textDecoration:"none",fontSize:13,fontWeight:500,
            color:isActive?"var(--accent)":"var(--dim)",
            background:isActive?"rgba(74,144,196,0.1)":"transparent",
            borderLeft:isActive?"3px solid var(--accent)":"3px solid transparent",
            transition:"all 0.15s",
          })}>
            <span style={{fontSize:15,width:20,textAlign:"center"}}>{icon}</span>{label}
          </NavLink>
        ))}
      </nav>
      <div style={{padding:"14px 20px",borderTop:"1px solid var(--border)",display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:"var(--accent2)",boxShadow:"0 0 8px var(--accent2)",animation:"pulse-dot 2s infinite"}}/>
        <span style={{fontSize:11,color:"var(--dim)"}}>Live feed active</span>
      </div>
    </aside>
  );
}
