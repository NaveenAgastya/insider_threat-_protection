import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { RiskBadge } from "@/components/risk-badge";
import { SectionHeader } from "@/components/section-header";
import { Activity, Filter, Loader2 } from "lucide-react";
import { type RiskLevel } from "@/lib/mock-data";

const filters: (RiskLevel | "all")[] = ["all", "critical", "high", "medium", "low"];

export default function Incidents() {
  const [filter, setFilter] = useState<RiskLevel | "all">("all");
  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    setIsLoading(true);
    fetch(`${baseUrl}/incidents`)
      .then((res) => res.json())
      .then((data) => {
        const parsedArray = Array.isArray(data) ? data : [];
        const normalized = parsedArray.map((i: any) => ({
          id: String(i.incident_id || i.id || ""),
          time: i.time || i.timestamp || "00:00",
          severity: (i.severity || i.risk_level || "medium").toLowerCase() as RiskLevel,
          type: i.type || "Unknown Alert",
          description: i.description || "No description provided.",
          source: i.source || "System",
          user: i.user || i.username || "Unknown",
          userId: String(i.user_id || i.userId || ""),
          status: i.status || "Open"
        }));
        setIncidents(normalized);
      })
      .catch((err) => {
        console.error("Failed to fetch incident log stream:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const rows = useMemo(() => {
    return incidents.filter((i) => filter === "all" || i.severity === filter);
  }, [incidents, filter]);

  // Dynamic calculations for Live Pulse panel
  const pulseMetrics = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    incidents.forEach((i) => {
      if (i.severity in counts) counts[i.severity as keyof typeof counts]++;
    });
    const total = incidents.length || 1;
    return [
      { l: "Critical", v: counts.critical, pct: (counts.critical / total) * 100, c: "var(--critical)" },
      { l: "High", v: counts.high, pct: (counts.high / total) * 100, c: "var(--warning)" },
      { l: "Medium", v: counts.medium, pct: (counts.medium / total) * 100, c: "var(--info)" },
      { l: "Low", v: counts.low, pct: (counts.low / total) * 100, c: "var(--success)" }
    ];
  }, [incidents]);

  // Dynamic calculations for Top Sources panel
  const topSources = useMemo(() => {
    const frequency: Record<string, number> = {};
    incidents.forEach((i) => {
      frequency[i.source] = (frequency[i.source] || 0) + 1;
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [incidents]);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <SectionHeader
        eyebrow="TIMELINE // 24H"
        title="Incident Timeline"
        description="Chronological feed of every detection. Click any event to pivot to the subject investigation."
        actions={
          <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f}
              </button>
            ))}
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-3">
          <div className="glass-panel relative rounded-xl border border-border bg-background/50 p-6 backdrop-blur-md">
            {!isLoading && rows.length > 0 && (
              <div className="absolute left-[5.25rem] top-6 bottom-6 w-px bg-border" />
            )}
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Parsing Real-Time Events...</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="py-12 text-center font-mono text-xs uppercase tracking-wider text-muted-foreground">
                No incidents detected for filter: {filter}
              </div>
            ) : (
              <ul className="space-y-5">
                {rows.map((inc) => (
                  <li key={inc.id} className="relative grid grid-cols-[5rem_auto_1fr_auto] items-start gap-4">
                    <div className="font-mono text-[11px] tabular-nums text-muted-foreground">{inc.time}</div>
                    <span
                      className="mt-1.5 h-3 w-3 rounded-full ring-2 ring-background"
                      style={{ background: inc.severity === "critical" ? "var(--critical)" : inc.severity === "high" ? "var(--warning)" : inc.severity === "medium" ? "var(--info)" : "var(--success)" }}
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <RiskBadge level={inc.severity} />
                        <span className="text-sm font-medium">{inc.type}</span>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{inc.id}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{inc.description}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        <span>src: {inc.source}</span>
                        <span>
                          subject: {inc.userId ? (
                            <Link to={`/users/${inc.userId}`} className="text-primary hover:underline">{inc.user}</Link>
                          ) : (
                            <span className="text-muted-foreground">{inc.user}</span>
                          )}
                        </span>
                        <span>status: {inc.status}</span>
                      </div>
                    </div>
                    <button className="rounded-md border border-border bg-muted/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest hover:bg-muted transition">
                      Triage
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="glass-panel rounded-xl border border-border bg-background/50 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium">Live Pulse</div>
            </div>
            <div className="mt-3 space-y-2">
              {pulseMetrics.map((r) => (
                <div key={r.l}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{r.l}</span>
                    <span className="font-mono tabular-nums">{r.v}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${r.pct}%`, background: r.c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel rounded-xl border border-border bg-background/50 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <div className="text-sm font-medium">Top Sources</div>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs">
              {topSources.length === 0 ? (
                <li className="text-center font-mono text-[10px] uppercase text-muted-foreground py-2">No active feeds</li>
              ) : (
                topSources.map(([source, count]) => (
                  <li key={source} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
                    <span className="truncate max-w-[150px]">{source}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">{count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
