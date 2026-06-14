// src/pages/Dashboard.tsx
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

import {
  ArrowUpRight, ShieldAlert, Users as UsersIcon, Activity, Zap, Eye, Loader2,
} from "lucide-react";

import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { SectionHeader } from "@/components/section-header";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const REFRESH_MS = 15000;

type RiskLevel = "critical" | "high" | "medium" | "low";

type ApiUser = {
  id: string; name: string; email: string; department: string;
  riskScore: number; riskLevel: RiskLevel; alerts: number;
  lastActivity: string; location: string; device: string; status: string;
};
type ApiIncident = {
  id: string; time: string; type: string; severity: RiskLevel;
  user: string; source: string; description: string; status: string;
};
type ApiReport = {
  id: string; user_id: string; confidence: number;
  severity: RiskLevel; title: string; generated: string; summary: string;
};

const toneColor = {
  critical: "var(--critical)",
  warning: "var(--warning)",
  info: "var(--info)",
  success: "var(--success)",
} as const;

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: dot }} />
      {label}
    </span>
  );
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`);
  if (!res.ok) throw new Error(`${path} ${res.status}`);
  return res.json();
}

export default function Dashboard() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [incidents, setIncidents] = useState<ApiIncident[]>([]);
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [u, i, r] = await Promise.all([
          fetchJson<ApiUser[]>("/users"),
          fetchJson<ApiIncident[]>("/incidents"),
          fetchJson<ApiReport[]>("/reports"),
        ]);
        if (!alive) return;
        setUsers(Array.isArray(u) ? u : []);
        setIncidents(Array.isArray(i) ? i : []);
        setReports(Array.isArray(r) ? r : []);
        setLastSync(new Date());
        setError(null);
      } catch (e: any) {
        if (alive) setError(e.message || "Failed to load telemetry");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  // KPIs — derived live
  const kpis = useMemo(() => {
    const activeIncidents = incidents.filter(
      (i) => i.status?.toLowerCase() !== "closed" && i.status?.toLowerCase() !== "resolved"
    ).length;
    const avgRisk = users.length
      ? Math.round(users.reduce((s, u) => s + (u.riskScore || 0), 0) / users.length)
      : 0;
    const criticalReports = reports.filter((r) => r.severity === "critical").length;
    return [
      { label: "Risk Posture", value: String(avgRisk), unit: "/100", delta: `${users.filter(u => u.riskLevel === "critical").length} critical`, icon: ShieldAlert, tone: "critical" as const },
      { label: "Active Incidents", value: String(activeIncidents), unit: "", delta: `${incidents.length} total`, icon: Zap, tone: "warning" as const },
      { label: "Users Monitored", value: users.length.toLocaleString(), unit: "", delta: `${users.filter(u => u.status === "active").length} active`, icon: UsersIcon, tone: "info" as const },
      { label: "AI Reports", value: String(reports.length), unit: "", delta: `${criticalReports} critical`, icon: Activity, tone: "success" as const },
    ];
  }, [users, incidents, reports]);

  // Risk distribution (pie)
  const riskDistribution = useMemo(() => {
    const buckets: Record<RiskLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    users.forEach((u) => { if (u.riskLevel in buckets) buckets[u.riskLevel]++; });
    return [
      { name: "Critical", value: buckets.critical, color: "var(--critical)" },
      { name: "High",     value: buckets.high,     color: "var(--warning)" },
      { name: "Medium",   value: buckets.medium,   color: "var(--info)" },
      { name: "Low",      value: buckets.low,      color: "var(--success)" },
    ];
  }, [users]);

  // Attack vectors (bar) — derived from incident.type
  const attackVectors = useMemo(() => {
    const map = new Map<string, number>();
    incidents.forEach((i) => map.set(i.type, (map.get(i.type) || 0) + 1));
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [incidents]);

  // Trend (area) — incidents per day
  const trendData = useMemo(() => {
    const map = new Map<string, { day: string; incidents: number; critical: number }>();
    incidents.forEach((i) => {
      const day = (i.time || "").slice(0, 10) || "unknown";
      const cur = map.get(day) || { day, incidents: 0, critical: 0 };
      cur.incidents++;
      if (i.severity === "critical") cur.critical++;
      map.set(day, cur);
    });
    return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day)).slice(-14);
  }, [incidents]);

  const top = useMemo(
    () => [...users].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).slice(0, 5),
    [users]
  );
  const recent = useMemo(
    () => [...incidents].sort((a, b) => (b.time || "").localeCompare(a.time || "")).slice(0, 5),
    [incidents]
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Synchronizing live telemetry...
      </div>
    );
  }

  return (
    <div className="grid-bg">
      <div className="mx-auto max-w-[1600px] px-6 py-8">
        <SectionHeader
          eyebrow="LIVE // SOC OVERVIEW"
          title="Executive Dashboard"
          description="Aggregated risk, telemetry, and AI triage across the global perimeter."
          actions={
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className={`inline-flex h-1.5 w-1.5 rounded-full ${error ? "bg-critical" : "bg-success pulse-critical"}`} />
              {error ? `Stream error: ${error}` : `Streaming · last sync ${lastSync ? Math.max(0, Math.round((Date.now() - lastSync.getTime()) / 1000)) : 0}s ago`}
            </div>
          }
        />

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="glass-panel relative overflow-hidden rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold tabular-nums" style={{ color: toneColor[k.tone] }}>{k.value}</span>
                    <span className="text-sm text-muted-foreground">{k.unit}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{k.delta}</div>
                </div>
                <k.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Trend */}
          <div className="glass-panel rounded-xl p-4 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Incident Trend · 14d</div>
                <div className="text-sm font-medium">Telemetry pulse</div>
              </div>
              <div className="flex gap-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <Legend dot="var(--info)" label="Incidents" />
                <Legend dot="var(--critical)" label="Critical" />
              </div>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="i1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--info)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--info)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="i2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="var(--critical)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)" }} />
                  <Area type="monotone" dataKey="incidents" stroke="var(--info)" fill="url(#i1)" />
                  <Area type="monotone" dataKey="critical" stroke="var(--critical)" fill="url(#i2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Risk distribution */}
          <div className="glass-panel rounded-xl p-4">
            <div className="mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">User Risk Distribution</div>
              <div className="text-sm font-medium">{users.length} subjects</div>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {riskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
              {riskDistribution.map((r) => (
                <Legend key={r.name} dot={r.color} label={`${r.name} · ${r.value}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Attack vectors + Top users */}
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="glass-panel rounded-xl p-4 lg:col-span-2">
            <div className="mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top Attack Vectors</div>
              <div className="text-sm font-medium">Derived from incident telemetry</div>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attackVectors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} />
                  <Tooltip contentStyle={{ background: "var(--background)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="count" fill="var(--warning)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top Risk Users</div>
                <div className="text-sm font-medium">Highest scoring subjects</div>
              </div>
              <Link to="/users" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <ul className="space-y-2">
              {top.map((u) => (
                <li key={u.id}>
                  <Link to={`/users/${u.id}`} className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/40">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{u.name}</div>
                      <div className="truncate text-[11px] text-muted-foreground">{u.department}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RiskScore score={u.riskScore} />
                      <RiskBadge level={u.riskLevel} />
                    </div>
                  </Link>
                </li>
              ))}
              {top.length === 0 && <li className="text-xs text-muted-foreground">No user telemetry.</li>}
            </ul>
          </div>
        </div>

        {/* Recent incidents */}
        <div className="mt-4 glass-panel rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Recent Incidents</div>
              <div className="text-sm font-medium">Live incident stream</div>
            </div>
            <Link to="/incidents" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Open log <Eye className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <th className="py-2">ID</th><th>Time</th><th>Type</th><th>User</th>
                  <th>Source</th><th>Severity</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((i) => (
                  <tr key={i.id} className="border-t border-border/40">
                    <td className="py-2 font-mono text-xs">{i.id}</td>
                    <td className="text-xs text-muted-foreground">{i.time}</td>
                    <td>{i.type}</td>
                    <td className="text-xs">{i.user}</td>
                    <td className="text-xs text-muted-foreground">{i.source}</td>
                    <td><RiskBadge level={i.severity} /></td>
                    <td className="text-xs capitalize">{i.status}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr><td colSpan={7} className="py-4 text-center text-xs text-muted-foreground">No incidents.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
