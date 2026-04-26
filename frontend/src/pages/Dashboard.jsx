import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { getThreats } from "../api/client";
import {
  Panel, StatCard, ScoreBadge, Pill, Empty, Spinner
} from "../components/UI";

export default function Dashboard() {
  const [threats, setThreats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await getThreats({ limit: 50 });

        console.log("API RESPONSE:", res);

        const data = res?.data?.events || res?.data || [];

        if (!Array.isArray(data)) {
          throw new Error("Invalid API response format");
        }

        setThreats(data);
      } catch (e) {
        console.error("FETCH ERROR:", e);
        setError(e.message || "Failed to fetch threats");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // --- SAFE DATA PROCESSING ---
  const countryMap = {};
  threats.forEach(t => {
    const key = t?.country || "Unknown";
    countryMap[key] = (countryMap[key] || 0) + 1;
  });

  const chartData = Object.entries(countryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const avgScore = threats.length
    ? Math.round(
        threats.reduce((s, t) => s + (t?.score ?? 0), 0) / threats.length
      )
    : 0;

  const highRisk = threats.filter(t => (t?.score ?? 0) >= 90).length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Overview</h1>
        <p style={{ fontSize: 13, color: "var(--dim)", marginTop: 4 }}>
          Aggregated threat intelligence from AbuseIPDB · VirusTotal · AlienVault OTX
        </p>
      </div>

      {/* --- STATS --- */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4,1fr)",
        gap: 14,
        marginBottom: 20
      }}>
        <StatCard label="Total Threats Cached" value={loading ? "—" : threats.length} sub="From AbuseIPDB blacklist" color="var(--red)" />
        <StatCard label="Critical (Score ≥ 90)" value={loading ? "—" : highRisk} sub="Immediate attention" color="var(--red)" />
        <StatCard label="Avg Abuse Score" value={loading ? "—" : avgScore} sub="Scale: 0 – 100" color="var(--yellow)" />
        <StatCard label="Countries Affected" value={loading ? "—" : Object.keys(countryMap).length} sub="Unique origin countries" color="var(--accent)" />
      </div>

      {/* --- MAIN PANELS --- */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.5fr 1fr",
        gap: 14
      }}>

        {/* TABLE */}
        <Panel title="Recent High-Risk IPs" accent="var(--red)">
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
              <Spinner />
            </div>
          )}

          {error && (
            <div style={{ color: "var(--red)", fontSize: 12, padding: 10 }}>
              ⚠ {error}
            </div>
          )}

          {!loading && !error && threats.length === 0 && (
            <Empty message="No threats cached yet." />
          )}

          {!loading && threats.length > 0 && (
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 12
            }}>
              <thead>
                <tr>
                  {["IP Address", "Country", "Score", "Reports", "ISP"].map(h => (
                    <th key={h} style={{
                      textAlign: "left",
                      padding: "0 8px 10px",
                      color: "var(--dim)",
                      fontWeight: 600,
                      fontSize: 10,
                      letterSpacing: "0.07em"
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {threats.slice(0, 10).map((t, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px", fontFamily: "var(--font-mono)", color: "var(--accent)" }}>
                      {t?.ip || "—"}
                    </td>

                    <td style={{ padding: "8px" }}>
                      <Pill label={t?.country || "??"} color="var(--blue)" />
                    </td>

                    <td style={{ padding: "8px" }}>
                      <ScoreBadge score={t?.score ?? 0} />
                    </td>

                    <td style={{ padding: "8px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>
                      {typeof t?.reports === "number"
                        ? t.reports.toLocaleString()
                        : "—"}
                    </td>

                    <td style={{ padding: "8px", color: "var(--dim)", fontSize: 11 }}>
                      {t?.isp
                        ? t.isp.slice(0, 22) + (t.isp.length > 22 ? "…" : "")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        {/* CHART */}
        <Panel title="Threats by Origin Country" accent="var(--accent)">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
              <Spinner />
            </div>
          ) : chartData.length === 0 ? (
            <Empty message="No data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tick={{ fill: "var(--dim)", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: "var(--dim)", fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={
                      i === 0 ? "var(--red)" :
                      i < 3 ? "var(--yellow)" :
                      "var(--accent)"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

      </div>
    </div>
  );
}