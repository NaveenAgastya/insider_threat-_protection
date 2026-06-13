import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { FileText, Sparkles, ChevronRight, Search } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

type Report = {
  id: string;
  user_id: string;
  confidence: number;
  severity: "critical" | "high" | string;
  title: string;
  generated: string;
  summary: string;
};

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<"all" | "critical" | "high">("all");

  useEffect(() => {
    setLoading(true);
    fetch(`${baseUrl}/reports`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: Report[]) => setReports(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = reports.filter(r => {
    if (severity !== "all" && r.severity !== severity) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.id.toLowerCase().includes(q) ||
      r.user_id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q)
    );
  });

  const criticalCount = reports.filter(r => r.severity === "critical").length;
  const highCount = reports.filter(r => r.severity === "high").length;

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6" /> AI Investigation Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            {reports.length} total · {criticalCount} critical · {highCount} high
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search id, user, title..."
              className="w-64 rounded-md border bg-background pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <select
            value={severity}
            onChange={e => setSeverity(e.target.value as any)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
          </select>
        </div>
      </header>

      {loading && <p className="text-sm text-muted-foreground">Loading reports...</p>}
      {error && (
        <p className="text-sm text-destructive">Failed to load reports: {error}</p>
      )}

      {!loading && !error && (
        <div className="grid gap-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No reports match your filters.</p>
          )}
          {filtered.map(r => (
            <Link
              key={r.id}
              to={`/reports/${r.id}`}
              className="group flex items-center justify-between rounded-lg border p-4 transition hover:border-primary hover:bg-accent/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{r.id}</span>
                  <span>·</span>
                  <span className="font-mono">{r.user_id}</span>
                  <span className="inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> AI
                  </span>
                  <RiskBadge level={r.severity as any} />
                </div>
                <div className="mt-1 font-medium truncate">{r.title}</div>
                <p className="text-sm text-muted-foreground truncate">{r.summary}</p>
                <div className="mt-1 text-xs text-muted-foreground">
                  Generated {r.generated} · Confidence {Math.round(r.confidence * 100)}%
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
