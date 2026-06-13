import { Link, useParams } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowLeft, Laptop, Lock, Mail, MapPin, ShieldAlert, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { RiskBadge } from "@/components/risk-badge";
import { type RiskLevel } from "@/lib/mock-data";

export default function UserDetail() {
  const { userId = "" } = useParams();
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isContaining, setIsContaining] = useState<boolean>(false);
  const [isContained, setIsContained] = useState<boolean>(false);

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    setIsLoading(true);
    
    fetch(`${baseUrl}/user/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Target investigator node unavailable.");
        return res.json();
      })
      .then((data) => {
        setDetails({
          id: String(data.user_id || data.id || userId),
          name: data.username || data.name || "Unknown Identity Vector",
          email: data.email || `${data.username || "user"}@company.com`,
          department: data.department || "Unassigned Operations",
          location: data.location || "Remote Grid",
          device: data.device || data.workstation || "Unknown Endpoint",
          riskScore: Number(data.riskScore || data.risk_score || 50),
          riskLevel: (data.riskLevel || data.risk_level || "medium").toLowerCase() as RiskLevel,
          alerts: Number(data.alerts || data.activityCount || 0),
          riskFactors: Array.isArray(data.riskFactors || data.risk_factors) 
            ? (data.riskFactors || data.risk_factors) 
            : ["Anomalous network activity detected", "Out of hours session validation requested"],
          behaviorHistory: Array.isArray(data.behaviorHistory || data.behavior_history)
            ? (data.behaviorHistory || data.behavior_history)
            : Array.from({ length: 24 }, (_, i) => ({
                hour: `${String(i).padStart(2, "0")}:00`,
                score: Math.max(10, Math.round(40 + Math.sin(i / 3) * 18 + (i > 18 ? 35 : 0) + Math.random() * 12)),
              }))
        });
      })
      .catch((err) => {
        console.error("Critical session sync error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [userId]);

  const initials = useMemo(() => {
    if (!details?.name) return "??";
    return details.name
      .trim()
      .split(/\s+/)
      .map((n: string) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }, [details?.name]);

  const handleContainment = async () => {
    if (isContained) return;
    setIsContaining(true);
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
    
    try {
      await fetch(`${baseUrl}/user/${userId}/contain`, { method: "POST" });
      setIsContained(true);
    } catch (err) {
      console.error("Containment transmission failed:", err);
    } finally {
      setIsContaining(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="font-mono text-xs uppercase tracking-widest">Compiling Subject Dossier...</span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="mx-auto max-w-[1600px] px-6 py-8 text-center font-mono text-xs text-muted-foreground uppercase tracking-widest">
        <div className="mb-4">Dossier not found or token expired.</div>
        <Link to="/users" className="text-primary hover:underline">← Return to primary analyst queue</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-8">
      <Link to="/users" className="mb-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition">
        <ArrowLeft className="h-3 w-3" /> Back to queue
      </Link>

      <div className="glass-panel scan-line rounded-xl border border-border bg-background/50 p-6 backdrop-blur-md">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/50 to-chart-5/50 text-lg font-semibold uppercase ring-1 ring-border">
              {initials}
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Subject // {details.id}</div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">{details.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {details.email}</span>
                <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {details.location}</span>
                <span className="inline-flex items-center gap-1"><Laptop className="h-3 w-3" /> {details.device}</span>
                <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {details.department}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RiskBadge level={details.riskLevel} />
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Composite Risk</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-semibold tabular-nums text-critical">{details.riskScore}</span>
                <span className="text-sm text-muted-foreground">/100</span>
              </div>
            </div>
            <button 
              onClick={handleContainment}
              disabled={isContaining || isContained}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition ${
                isContained 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed" 
                  : "bg-critical text-critical-foreground hover:opacity-90 disabled:opacity-50"
              }`}
            >
              {isContaining ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isContained ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Lock className="h-3.5 w-3.5" />
              )}
              {isContaining ? "Transmitting..." : isContained ? "Session Contained" : "Contain Session"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="glass-panel rounded-xl border border-border bg-background/50 p-5 backdrop-blur-md lg:col-span-2">
          <div className="mb-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Behavioral risk · 24h</div>
            <div className="mt-0.5 text-sm font-medium">Score over time</div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={details.behaviorHistory}>
                <defs>
                  <linearGradient id="ub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--critical)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--critical)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="hour" stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} interval={2} />
                <YAxis stroke="var(--muted-foreground)" tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="score" stroke="var(--critical)" fill="url(#ub)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-xl border border-border bg-background/50 p-5 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-warning" />
            <div className="text-sm font-medium">Contributing Signals</div>
          </div>
          <ul className="space-y-3">
            {details.riskFactors.map((factor: string, index: number) => (
              <li key={index}>
                <div className="rounded-md border border-border p-3 bg-muted/20">
                  <div className="text-xs text-foreground">⚠️ {factor}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-border bg-muted/20 p-5 max-w-xs">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Total Alerts</div>
        <div className="mt-1 text-3xl font-bold font-mono tracking-tight tabular-nums">{details.alerts}</div>
      </div>
    </div>
  );
}
