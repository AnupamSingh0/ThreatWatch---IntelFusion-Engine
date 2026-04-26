import React, { useEffect, useState, useRef } from "react";
import { getThreats } from "../api/client";
import { Panel, ScoreBadge, Pill, Spinner, Empty } from "../components/UI";

export default function Feed() {
  const [events,setEvents]=useState([]);
  const [loading,setLoading]=useState(true);
  const [liveCount,setLiveCount]=useState(0);
  const [error,setError]=useState("");

  useEffect(()=>{
    getThreats({limit:100})
      .then(r=>setEvents(r.data.events||[]))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const es=new EventSource("/feed/stream");
    es.onmessage=e=>{
      const data=JSON.parse(e.data);
      setLiveCount(n=>n+1);
      setEvents(prev=>prev.find(x=>x.ip===data.ip)?prev:[{...data,_fresh:true},...prev.slice(0,149)]);
    };
    return()=>es.close();
  },[]);

  return (
    <div className="fade-in">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700}}>Threat Feed</h1>
          <p style={{fontSize:13,color:"var(--dim)",marginTop:4}}>Live AbuseIPDB blacklist — refreshed every 10 minutes</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(74,144,196,0.08)",border:"1px solid rgba(74,144,196,0.2)",borderRadius:8,padding:"8px 14px"}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"var(--accent)",animation:"pulse-dot 2s infinite"}}/>
          <span style={{fontSize:12,color:"var(--accent)",fontFamily:"var(--font-mono)"}}>LIVE · {liveCount} new</span>
        </div>
      </div>
      <Panel>
        {loading&&<div style={{display:"flex",justifyContent:"center",padding:40}}><Spinner/></div>}
        {error&&<p style={{color:"var(--red)",fontSize:12}}>⚠ {error}</p>}
        {!loading&&events.length===0&&<Empty message="No threats yet."/>}
        {!loading&&events.length>0&&(
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr>{["IP Address","Country","Score","Reports","ISP","Last Reported"].map(h=>(
              <th key={h} style={{textAlign:"left",padding:"0 10px 12px",color:"var(--dim)",fontWeight:600,fontSize:10,letterSpacing:"0.07em"}}>{h}</th>
            ))}</tr></thead>
            <tbody>{events.map((e,i)=>(
              <tr key={e.ip+i} className={e._fresh?"flash-row":""} style={{borderTop:"1px solid var(--border)"}}>
                <td style={{padding:"9px 10px",fontFamily:"var(--font-mono)",color:"var(--accent)"}}>{e.ip}</td>
                <td style={{padding:"9px 10px"}}><Pill label={e.country||"??"} color="var(--blue)"/></td>
                <td style={{padding:"9px 10px"}}><ScoreBadge score={e.score}/></td>
                <td style={{padding:"9px 10px",fontFamily:"var(--font-mono)",color:"var(--muted)"}}>{e.reports?.toLocaleString()}</td>
                <td style={{padding:"9px 10px",color:"var(--dim)",fontSize:11}}>{e.isp?.slice(0,28)||"—"}</td>
                <td style={{padding:"9px 10px",color:"var(--dim)",fontSize:11}}>{e.last_reported?.split("T")[0]||"—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}
