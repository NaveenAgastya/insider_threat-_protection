import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, ShieldAlert, Users as UsersIcon, Activity, Zap, Eye, AlertTriangle } from "lucide-react";
import { RiskBadge, RiskScore } from "@/components/risk-badge";
import { SectionHeader } from "@/components/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import type { RiskLevel } from "@/lib/mock-data";

interface DashboardKpis {
  riskPosture: number; riskPostureDelta: string;
  activeIncidents: number; activeIncidentsDelta: string;
  usersMonitored: number; usersMonitoredDelta: string;
  mttr: number; mttrDelta: string;
}
interface TrendPoint { day: string; critical: number; high: number; medium: number; low: number; }
interface RiskDistItem { name: string; value: number; color: string; }
interface AttackVector { vector: string; count: number; }
interface TopUser { id: string; name: string; department: string; riskScore: number; riskLevel: RiskLevel; alerts: number; }
interface RecentIncident { id: string; time: string; type: string; severity: RiskLevel; source: string; user: string; status: string; }
interface DashboardData {
  kpis: DashboardKpis;
  trendData: TrendPoint[];
  riskDistribution: RiskDistItem[];
  attackVectors: AttackVector[];
  topUsers: TopUser[];
  recentIncidents: RecentIncident[];
}

const toneColor = {
  critical: "var(--critical)",
  warning: "var(--warning)",
  info: "var(--info)",
  success: "var(--success)",
};

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-sm" style={{ background: dot }} />
      {label}
    </span>
  );
}

function buildKpiCards(k: DashboardKpis) {
  return [
    { label: "Risk Posture", value: String(k.riskPosture), unit: "/100", delta: k.riskPostureDelta, icon: ShieldAlert, tone: "critical" as const },
    { label: "Active Incidents", value: String(k.activeIncidents), unit: "", delta: k.activeIncidentsDelta, icon: Zap, tone: "warning" as const },
    { label: "Users Monitored", value: k.usersMonitored.toLocaleString(), unit: "", delta: k.usersMonitoredDelta, icon: UsersIcon, tone: "info" as const },
    { label: "MTTR", value: String(k.mttr), unit: "min", delta: k.mttrDelta, icon: Activity, tone: "success" as const },
  ];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    if (!baseUrl) {
      setError("VITE_API_BASE_URL is not configured.");
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`${baseUrl}/dashboard`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: DashboardData) => setData(json))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [reloadKey]);

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
              {error ? "Stream offline" : loading ? "Connecting…" : "Streaming · live"}
            </div>
          }
        />

        {error && (
          <div className="glass-panel mb-3 flex items-center justify-between rounded-xl border border-critical/40 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-critical" />
              <div>
                <div className="text-sm font-medium">Failed to load dashboard</div>
                <div className="font-mono text-[11px] text-muted-foreground">{error}</div>
              </div>
            </div>
            <button
              onClick={() => setReloadKey((k) => k + 1)}
              className="rounded-md border border-border bg-muted/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest hover:bg-muted"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {loading || !data
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-panel rounded-xl p-4">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-8 w-20" />
                  <Skeleton className="mt-3 h-3 w-16" />
                </div>
              ))
            : buildKpiCards(data.kpis).map((k) => (
                <div key={k.label} className="glass-panel relative overflow-hidden rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-3xl font-semibold tabular-nums" style={{ color: toneColor[k.tone] }}>{k.value}</span>
                        <span className="text-sm text-muted-foreground">{k.unit}</span>
                      </div>
                    </div>
                    <div className="rounded-md p-1.5 ring-1 ring-inset" style={{ background: `color-mix(in oklab, ${toneColor[k.tone]} 12%, transparent)`, color: toneColor[k.tone], borderColor: toneColor[k.tone] }}>
                      <k.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                    <ArrowUpRight className="h-3 w-3" />
                    <span>{k.delta} vs 24h</span>
                  </div>
                  <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl" style={{ background: toneColor[k.tone] }} />
                </div>
              ))}
        </div>

        {/* Trend + Distribution */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="glass-panel rounded-xl p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Threat Telemetry · 7d</div>
                <div className="mt-0.5 text-sm font-medium">Detections by severity</div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
                <Legend dot="var(--critical)" label="Critical" />
                <Legend dot="var(--warning)" label="High" />
                <Legend dot="var(--info)" label="Medium" />
                <Legend dot="var(--success)" label="Low" />
              </div>
            </div>
            <div className="h-[260px]">
              {loading || !data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trendData}>
                    <defs>
                      {(["critical", "high", "medium", "low"] as const).map((k, i) => {
                        const c = [toneColor.critical, toneColor.warning, toneColor.info, toneColor.success][i];
                        return (
                          <linearGradient key={k} id={`g-${k}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={c} stopOpacity={0.6} />
                            <stop offset="100%" stopColor={c} stopOpacity={0} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="low" stackId="1" stroke={toneColor.success} fill="url(#g-low)" />
                    <Area type="monotone" dataKey="medium" stackId="1" stroke={toneColor.info} fill="url(#g-medium)" />
                    <Area type="monotone" dataKey="high" stackId="1" stroke={toneColor.warning} fill="url(#g-high)" />
                    <Area type="monotone" dataKey="critical" stackId="1" stroke={toneColor.critical} fill="url(#g-critical)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Risk Distribution</div>
            <div className="mt-0.5 text-sm font-medium">Active risk inventory</div>
            <div className="h-[200px]">
              {loading || !data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.riskDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="var(--card)">
                      {data.riskDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(loading || !data ? Array.from({ length: 4 }).map((_, i) => ({ name: "", value: 0, color: "var(--muted)", _k: i })) : data.riskDistribution).map((d: any, i) => (
                <div key={d._k ?? i} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-sm" style={{ background: d.color }} />
                    <span className="text-xs">{d.name || <Skeleton className="h-3 w-12" />}</span>
                  </div>
                  <span className="font-mono text-xs tabular-nums">{d.name ? d.value : ""}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attack vectors + top users */}
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="glass-panel rounded-xl p-5">
            <div className="mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Attack Vectors</div>
              <div className="mt-0.5 text-sm font-medium">Last 24 hours</div>
            </div>
            <div className="h-[220px]">
              {loading || !data ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.attackVectors} layout="vertical" margin={{ left: 8 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="vector" stroke="var(--muted-foreground)" tick={{ fontSize: 11, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} cursor={{ fill: "var(--muted)" }} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Top High-Risk Users</div>
                <div className="mt-0.5 text-sm font-medium">Prioritized by AI risk score</div>
              </div>
              <Link to="/users" className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline">View all →</Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Dept</th>
                    <th className="px-3 py-2 text-left">Risk</th>
                    <th className="px-3 py-2 text-left">Level</th>
                    <th className="px-3 py-2 text-right">Alerts</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading || !data
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-3 py-2"><Skeleton className="h-3 w-20" /></td>
                          <td className="px-3 py-2"><Skeleton className="h-3 w-10" /></td>
                          <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-3 py-2 text-right"><Skeleton className="ml-auto h-3 w-6" /></td>
                          <td className="px-3 py-2 text-right"><Skeleton className="ml-auto h-6 w-20" /></td>
                        </tr>
                      ))
                    : data.topUsers.map((u) => (
                        <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-2">
                            <div className="font-medium">{u.name}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{u.id}</div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{u.department}</td>
                          <td className="px-3 py-2"><RiskScore score={u.riskScore} /></td>
                          <td className="px-3 py-2"><RiskBadge level={u.riskLevel} /></td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums">{u.alerts}</td>
                          <td className="px-3 py-2 text-right">
                            <Link to={`/users/${u.id}`} className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-muted">
                              <Eye className="h-3 w-3" /> Investigate
                            </Link>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Live incidents */}
        <div className="mt-3 glass-panel rounded-xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Live Incident Feed</div>
              <div className="mt-0.5 text-sm font-medium">Most recent alerts</div>
            </div>
            <Link to="/incidents" className="font-mono text-[10px] uppercase tracking-widest text-primary hover:underline">Open timeline →</Link>
          </div>
          <ul className="divide-y divide-border">
            {loading || !data
              ? Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="flex items-center gap-4 py-2.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </li>
                ))
              : data.recentIncidents.map((inc) => (
                  <li key={inc.id} className="flex items-center gap-4 py-2.5">
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{inc.time}</span>
                    <RiskBadge level={inc.severity} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{inc.type}</div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">{inc.id} · {inc.source} · {inc.user}</div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{inc.status}</span>
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
