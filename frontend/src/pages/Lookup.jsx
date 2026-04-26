import React, { useState } from "react";
import { lookupIP } from "../api/client";
import { Panel, ScoreBadge, Pill, Spinner } from "../components/UI";

function Row({label,value,mono=false}) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
      <span style={{fontSize:12,color:"var(--dim)"}}>{label}</span>
      <span style={{fontSize:12,color:"var(--accent)",fontFamily:mono?"var(--font-mono)":"inherit",textAlign:"right",maxWidth:"55%",wordBreak:"break-all"}}>{value??'—'}</span>
    </div>
  );
}

export default function Lookup() {
  const [ip,setIp]=useState("");
  const [result,setResult]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [history,setHistory]=useState([]);

  async function handleLookup() {
    if(!ip.trim())return;
    setLoading(true);setError("");setResult(null);
    try {
      const res=await lookupIP(ip.trim());
      setResult(res.data);
      setHistory(h=>[{ip:ip.trim(),ts:new Date().toLocaleTimeString()},...h.slice(0,9)]);
    } catch(e) { setError(e.response?.data?.detail||e.message); }
    finally { setLoading(false); }
  }

  const abuse=result?.abuseipdb;
  const vt=result?.virustotal;
  const abuseScore=abuse?.abuseConfidenceScore;
  const vtMalicious=vt?.last_analysis_stats?.malicious??0;
  const risk=abuseScore>=90||vtMalicious>5?{label:"HIGH RISK",color:"var(--red)"}:abuseScore>=50||vtMalicious>0?{label:"SUSPICIOUS",color:"var(--yellow)"}:{label:"CLEAN / LOW RISK",color:"var(--accent)"};

  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:700}}>IP Lookup</h1>
        <p style={{fontSize:13,color:"var(--dim)",marginTop:4}}>Query AbuseIPDB and VirusTotal simultaneously.</p>
      </div>
      <Panel style={{marginBottom:20}}>
        <div style={{display:"flex",gap:10}}>
          <input value={ip} onChange={e=>setIp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLookup()}
            placeholder="Enter IPv4 address e.g. 185.220.101.45"
            style={{flex:1,background:"var(--bg)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:7,padding:"10px 16px",fontSize:14,fontFamily:"var(--font-mono)",outline:"none"}}/>
          <button onClick={handleLookup} disabled={loading}
            style={{background:"var(--accent)",color:"var(--bg)",border:"none",borderRadius:7,padding:"10px 24px",fontWeight:800,fontSize:13,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,display:"flex",alignItems:"center",gap:8}}>
            {loading?<><Spinner size={14}/>QUERYING</>:"LOOKUP →"}
          </button>
        </div>
        {error&&<div style={{marginTop:12,color:"var(--red)",fontSize:12}}>⚠ {error}</div>}
        {history.length>0&&<div style={{marginTop:14,display:"flex",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:10,color:"var(--dim)",alignSelf:"center"}}>Recent:</span>
          {history.map((h,i)=><button key={i} onClick={()=>setIp(h.ip)}
            style={{background:"var(--border)",color:"var(--text)",border:"none",borderRadius:5,padding:"3px 10px",fontSize:11,fontFamily:"var(--font-mono)",cursor:"pointer"}}>{h.ip}</button>)}
        </div>}
      </Panel>
      {result&&(
        <div className="fade-in">
          <div style={{background:risk.color+"12",border:`1px solid ${risk.color}40`,borderRadius:8,padding:"12px 18px",display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:risk.color,boxShadow:`0 0 10px ${risk.color}`}}/>
            <span style={{color:risk.color,fontWeight:700,fontSize:13}}>{risk.label}</span>
            {abuseScore!=null&&<span style={{marginLeft:"auto",fontSize:11,color:"var(--dim)"}}>AbuseIPDB score: <ScoreBadge score={abuseScore}/></span>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Panel title="AbuseIPDB" accent="var(--red)">
              {!abuse?<p style={{fontSize:12,color:"var(--muted)"}}>No AbuseIPDB key configured in .env</p>
              :abuse.error?<p style={{fontSize:12,color:"var(--red)"}}>{abuse.error}</p>
              :<>
                <Row label="IP Address" value={abuse.ipAddress} mono/>
                <Row label="Abuse Confidence" value={`${abuse.abuseConfidenceScore} / 100`}/>
                <Row label="Country" value={abuse.countryCode}/>
                <Row label="ISP" value={abuse.isp}/>
                <Row label="Usage Type" value={abuse.usageType}/>
                <Row label="Total Reports" value={abuse.totalReports?.toLocaleString()}/>
                <Row label="Last Reported" value={abuse.lastReportedAt?.split("T")[0]||"Never"}/>
              </>}
            </Panel>
            <Panel title="VirusTotal" accent="var(--blue)">
              {!vt?<p style={{fontSize:12,color:"var(--muted)"}}>No VirusTotal key configured in .env</p>
              :vt.error?<p style={{fontSize:12,color:"var(--red)"}}>{vt.error}</p>
              :<>
                <Row label="Country" value={vt.country}/>
                <Row label="AS Owner" value={vt.as_owner}/>
                <Row label="Malicious" value={vt.last_analysis_stats?.malicious}/>
                <Row label="Suspicious" value={vt.last_analysis_stats?.suspicious}/>
                <Row label="Harmless" value={vt.last_analysis_stats?.harmless}/>
                <Row label="Reputation" value={vt.reputation}/>
              </>}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
