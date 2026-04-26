import React, { useState } from "react";
import axios from "axios";
import { Panel, Pill, ScoreBadge, Spinner, Empty } from "../components/UI";

export default function Correlate() {
  const [ip,setIp]=useState("");
  const [result,setResult]=useState(null);
  const [ml,setMl]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function handleCorrelate() {
    if(!ip.trim())return;
    setLoading(true);setError("");setResult(null);setMl(null);
    try {
      const [cr,mr]=await Promise.allSettled([
        axios.get(`/correlate/${ip.trim()}`),
        axios.get(`/ml/predict/${ip.trim()}`),
      ]);
      if(cr.status==="fulfilled")setResult(cr.value.data);
      else setError(cr.reason?.response?.data?.detail||cr.reason.message);
      if(mr.status==="fulfilled")setMl(mr.value.data);
    } finally { setLoading(false); }
  }

  return (
    <div className="fade-in">
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:22,fontWeight:700}}>Correlation Engine</h1>
        <p style={{fontSize:13,color:"var(--dim)",marginTop:4}}>Full IOC intelligence — links IP → domains → malware hashes → threat campaigns</p>
      </div>
      <Panel style={{marginBottom:20}}>
        <div style={{display:"flex",gap:10}}>
          <input value={ip} onChange={e=>setIp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleCorrelate()}
            placeholder="Enter IP address to correlate"
            style={{flex:1,background:"var(--bg)",border:"1px solid var(--border)",color:"var(--text)",borderRadius:7,padding:"10px 16px",fontSize:14,fontFamily:"var(--font-mono)",outline:"none"}}/>
          <button onClick={handleCorrelate} disabled={loading}
            style={{background:"#a855f7",color:"#fff",border:"none",borderRadius:7,padding:"10px 24px",fontWeight:800,fontSize:13,cursor:loading?"not-allowed":"pointer",opacity:loading?0.6:1,display:"flex",alignItems:"center",gap:8}}>
            {loading?<><Spinner size={14}/>CORRELATING</>:"CORRELATE →"}
          </button>
        </div>
        {error&&<div style={{marginTop:10,color:"var(--red)",fontSize:12}}>⚠ {error}</div>}
      </Panel>
      {result&&(
        <div className="fade-in">
          <div style={{background:"rgba(168,85,247,0.08)",border:"1px solid rgba(168,85,247,0.25)",borderRadius:8,padding:"14px 18px",marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:700,color:"#a855f7",marginBottom:8}}>CORRELATION SUMMARY — {result.ip}</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>{result.summary.map((s,i)=><Pill key={i} label={s} color="#a855f7"/>)}</div>
          </div>
          {ml&&(
            <Panel title="ML Anomaly Verdict" accent="var(--yellow)" style={{marginBottom:14}}>
              {ml.confidence==="model_not_ready"
                ?<p style={{fontSize:12,color:"var(--muted)"}}>Model not trained yet. POST /ml/train after feed populates.</p>
                :<div style={{display:"flex",gap:24}}>
                  <div><div style={{fontSize:10,color:"var(--dim)",marginBottom:4}}>VERDICT</div><div style={{fontSize:20,fontWeight:800,color:ml.anomaly?"var(--red)":"var(--accent)"}}>{ml.anomaly?"⚠ ANOMALOUS":"✓ NORMAL"}</div></div>
                  <div><div style={{fontSize:10,color:"var(--dim)",marginBottom:4}}>SCORE</div><div style={{fontSize:20,fontWeight:800,fontFamily:"var(--font-mono)",color:"var(--yellow)"}}>{ml.anomaly_score}</div></div>
                  <div><div style={{fontSize:10,color:"var(--dim)",marginBottom:4}}>CONFIDENCE</div><div style={{fontSize:20,fontWeight:800,textTransform:"uppercase",color:ml.confidence==="high"?"var(--red)":ml.confidence==="medium"?"var(--yellow)":"var(--accent)"}}>{ml.confidence}</div></div>
                </div>}
            </Panel>
          )}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <Panel title={`DNS Resolutions (${result.dns_resolutions.length})`} accent="var(--accent)">
              {result.dns_resolutions.length===0?<Empty message="No resolutions or VirusTotal key not set."/>
              :result.dns_resolutions.map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--border)",fontSize:12}}>
                  <span style={{fontFamily:"var(--font-mono)",color:"var(--accent)"}}>{r.hostname}</span>
                  <span style={{color:"var(--dim)",fontSize:11}}>{r.last_resolved?.split("T")[0]}</span>
                </div>
              ))}
            </Panel>
            <Panel title={`Co-Infrastructure IPs (${result.related_ips.length})`} accent="var(--yellow)">
              {result.related_ips.length===0?<Empty message="No related IPs found."/>
              :result.related_ips.map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                  <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--accent)"}}>{r.ip}</span>
                  <div style={{display:"flex",gap:8}}><Pill label={r.country||"??"} color="var(--blue)"/><ScoreBadge score={r.score}/></div>
                </div>
              ))}
            </Panel>
            <Panel title={`Linked Malware Hashes (${result.malware_files.length})`} accent="var(--red)">
              {result.malware_files.length===0?<Empty message="No malware samples found."/>
              :result.malware_files.map((f,i)=>(
                <div key={i} style={{padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:"var(--text)",fontWeight:600}}>{f.name}</span>
                    <Pill label={`${f.malicious} detections`} color="var(--red)"/>
                  </div>
                  <div style={{fontFamily:"var(--font-mono)",fontSize:10,color:"var(--dim)",wordBreak:"break-all"}}>{f.sha256}</div>
                </div>
              ))}
            </Panel>
            <Panel title={`OTX Pulse References (${result.otx_pulses.length})`} accent="#a855f7">
              {result.otx_pulses.length===0?<Empty message="No OTX pulse references."/>
              :result.otx_pulses.map((p,i)=>(
                <div key={i} style={{padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                  <div style={{fontSize:12,color:"var(--text)",fontWeight:600,marginBottom:4}}>{p.name}</div>
                  <div style={{fontSize:11,color:"var(--accent)",marginBottom:5}}>{p.author}</div>
                  <div>{(p.tags||[]).slice(0,4).map(t=><Pill key={t} label={t} color="#a855f7"/>)}</div>
                </div>
              ))}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
