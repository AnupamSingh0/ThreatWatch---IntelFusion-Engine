import React, { useEffect, useState } from "react";
import { getPulses, refreshPulses, getPulseIndicators } from "../api/client";
import { Panel, Pill, Spinner, Empty, ProgressBar } from "../components/UI";

function IOCModal({ pulse, onClose }) {
  const [iocs, setIocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPulseIndicators(pulse.id)
      .then(r => setIocs(r.data.results || []))
      .catch(e => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, [pulse.id]);

  return (
    <div onClick={onClose} style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.8)",
      display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background:"var(--panel)", border:"1px solid var(--border)",
        borderRadius:12, padding:24, width:"90%", maxWidth:700,
        maxHeight:"80vh", overflow:"auto"
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{pulse.name}</div>
            <div style={{ fontSize:11, color:"var(--dim)", marginTop:4 }}>{pulse.indicator_count} IOC indicators</div>
          </div>
          <button onClick={onClose} style={{
            background:"var(--border)", border:"none", color:"var(--text)",
            borderRadius:6, padding:"6px 14px", cursor:"pointer", fontSize:12
          }}>✕ Close</button>
        </div>

        {loading && <div style={{ display:"flex", justifyContent:"center", padding:30 }}><Spinner /></div>}
        {error && <p style={{ color:"var(--red)", fontSize:12, padding:10 }}>⚠ {error}</p>}
        {!loading && !error && iocs.length === 0 && (
          <p style={{ color:"var(--muted)", fontSize:12, textAlign:"center", padding:20 }}>No indicators found.</p>
        )}
        {!loading && iocs.length > 0 && (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr>{["Type","Indicator","Description"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"0 8px 10px",
                  color:"var(--dim)", fontWeight:600, fontSize:10 }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>{iocs.map((ioc, i) => (
              <tr key={i} style={{ borderTop:"1px solid var(--border)" }}>
                <td style={{ padding:"8px" }}>
                  <span style={{ background:"rgba(74,144,196,0.15)", color:"var(--accent)",
                    borderRadius:4, padding:"2px 7px", fontSize:10 }}>{ioc.type}</span>
                </td>
                <td style={{ padding:"8px", fontFamily:"var(--font-mono)",
                  color:"var(--accent)", fontSize:11, wordBreak:"break-all" }}>{ioc.indicator}</td>
                <td style={{ padding:"8px", color:"var(--dim)", fontSize:11 }}>{ioc.description || "—"}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function Pulses() {
  const [pulses, setPulses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = (q = "") => {
    setLoading(true);
    getPulses(q ? { limit:30, search:q } : { limit:30 })
      .then(r => setPulses(r.data.pulses || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = e => {
    setSearch(e.target.value);
    clearTimeout(window._st);
    window._st = setTimeout(() => load(e.target.value), 400);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    refreshPulses().then(() => load(search)).finally(() => setRefreshing(false));
  };

  return (
    <div className="fade-in">
      {selected && <IOCModal pulse={selected} onClose={() => setSelected(null)} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>OTX Pulses</h1>
          <p style={{ fontSize:13, color:"var(--dim)", marginTop:4 }}>Threat intelligence from AlienVault OTX</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{
          background:"rgba(168,85,247,0.1)", color:"#a855f7",
          border:"1px solid rgba(168,85,247,0.3)", borderRadius:7,
          padding:"8px 18px", fontSize:12, fontWeight:700,
          cursor: refreshing ? "not-allowed" : "pointer", opacity: refreshing ? 0.6 : 1
        }}>
          {refreshing ? "Refreshing…" : "↻ Refresh OTX"}
        </button>
      </div>

      <input value={search} onChange={handleSearch} placeholder="Search pulses by name…"
        style={{ width:"100%", background:"var(--panel)", border:"1px solid var(--border)",
          color:"var(--text)", borderRadius:8, padding:"10px 16px",
          fontSize:13, outline:"none", marginBottom:16 }} />

      {error && <p style={{ color:"var(--red)", fontSize:12, marginBottom:12 }}>⚠ {error}</p>}
      {loading && <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spinner /></div>}
      {!loading && pulses.length === 0 && (
        <Empty message="No pulses cached. Click Refresh OTX or add your OTX API key to .env." />
      )}

      {!loading && pulses.map(p => (
        <div key={p.id} className="panel" style={{ marginBottom:12 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:8 }}>{p.name}</div>
              <div style={{ marginBottom:10 }}>
                {(p.tags || []).slice(0, 6).map(t => <Pill key={t} label={t} color="#a855f7" />)}
              </div>
              <div style={{ display:"flex", gap:20, fontSize:11, color:"var(--dim)" }}>
                <span>Author: <span style={{ color:"var(--accent)" }}>{p.author}</span></span>
                <span>IOCs: <span style={{ color:"var(--accent)", fontFamily:"var(--font-mono)" }}>{p.indicator_count}</span></span>
                <span>Published: {p.published_at?.split("T")[0] || "Unknown"}</span>
              </div>
            </div>
            <button onClick={() => setSelected(p)} style={{
              background:"rgba(168,85,247,0.1)", color:"#a855f7",
              border:"1px solid rgba(168,85,247,0.3)", borderRadius:6,
              padding:"6px 14px", fontSize:11, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap", flexShrink:0
            }}>
              VIEW IOCs →
            </button>
          </div>
          <div style={{ marginTop:12 }}>
            <ProgressBar value={p.indicator_count} max={300} color="#a855f7" />
          </div>
        </div>
      ))}
    </div>
  );
}
