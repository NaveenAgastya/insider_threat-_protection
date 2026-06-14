import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Download,
  FileText,
  Share2,
  Sparkles,
} from "lucide-react";
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

type UserDetails = {
  user_id: string;
  username: string;
  department: string;
  riskFactors: string[];
  activityCount: number;
};

type Activity = {
  timestamp?: string;
  resource?: string;
  resource_sensitivity?: string;
  action?: string;
  time_classification?: string;
  [k: string]: unknown;
};

function generateNarrative(user: UserDetails | null, activities: Activity[]) {
  if (!user) return "Generating AI investigation narrative...";

  const highSensitivity = activities.filter(a => a.resource_sensitivity === "high").length;
  const exports = activities.filter(a => a.action === "export_data").length;
  const adminOps = activities.filter(a => a.action === "admin_operation").length;
  const nightAccess = activities.filter(
    a => a.time_classification === "night" || a.time_classification === "unusual_hours"
  ).length;

  return `Subject: ${user.username}
Department: ${user.department}
Observed Activities: ${activities.length}
High Sensitivity Accesses: ${highSensitivity}
Export Operations: ${exports}
Administrative Actions: ${adminOps}
Off-Hours Activity: ${nightAccess}

Assessment:
The user accessed enterprise resources requiring analyst review. Activity patterns indicate elevated operational risk.

Recommended Actions:
• Review sensitive resource access
• Verify export activity
• Confirm admin actions
• Continue monitoring`;
}

function buildActions(user: UserDetails | null, activities: Activity[]) {
  if (!user) return [];
  const actions: { label: string; priority: "critical" | "high" | "medium" }[] = [];

  if (activities.some(a => a.action === "export_data" && a.resource_sensitivity === "high")) {
    actions.push({ label: "Revoke active sessions and rotate credentials", priority: "critical" });
    actions.push({ label: "Quarantine endpoint and image disk for forensics", priority: "critical" });
  }
  if (activities.some(a => a.action === "admin_operation")) {
    actions.push({ label: "Review administrative operations performed", priority: "high" });
  }
  if (activities.some(a => ["night", "weekend", "unusual_hours"].includes(String(a.time_classification)))) {
    actions.push({ label: "Investigate off-hours access patterns", priority: "high" });
  }
  if (user.riskFactors?.length) {
    actions.push({ label: `Address ${user.riskFactors.length} flagged risk factor(s)`, priority: "medium" });
  }
  if (actions.length === 0) {
    actions.push({ label: "Continue routine monitoring", priority: "medium" });
  }
  return actions;
}

function buildEvidence(activities: Activity[]) {
  const counts: Record<string, number> = {};
  for (const a of activities) {
    const key = String(a.resource ?? "unknown");
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export default function ReportDetail() {
  const { reportId = "" } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!reportId) return;

  setLoading(true);

  fetch(`${baseUrl}/report/${reportId}`)
    .then(res => {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .then(setReport)
    .catch(() => setReport(null))
    .finally(() => setLoading(false));
}, [reportId]);


useEffect(() => {
  if (!report?.user_id) return;

  Promise.all([
    fetch(`${baseUrl}/user/${report.user_id}`).then(r => r.json()),
    fetch(`${baseUrl}/user/${report.user_id}/activities`).then(r => r.json()),
  ])
    .then(([u, a]) => {
      setUserDetails(u);
      setActivities(Array.isArray(a) ? a : []);
    })
    .catch(console.error);
}, [report]);

//useMemo to avoid expensive recalculations on every render
const aiNarrative = useMemo(
    () => generateNarrative(userDetails, activities),
    [userDetails, activities]
  );

  // Build recommended actions and evidence chain based on user details and activities
  const actions = useMemo(() => buildActions(userDetails, activities), [userDetails, activities]);
  const evidence = useMemo(() => buildEvidence(activities), [activities]);

  const highSensitivity =
  activities.filter(
    a => a.resource_sensitivity === "high"
  ).length;

const offHours =
  activities.filter(
    a =>
      a.time_classification === "night" ||
      a.time_classification === "unusual_hours"
  ).length;

const adminOps =
  activities.filter(
    a => a.action === "admin_operation"
  ).length;

const riskScore =
  highSensitivity * 10 +
  offHours * 8 +
  adminOps * 15;


  if (loading) {
  return <div className="p-6">Loading...</div>;
}

if (!report) {
  return (
    <div className="p-6">
      <h2>Report not found</h2>
      <p>{reportId}</p>
    </div>
  );
}



  return (
    <div className="p-6 space-y-6">
      <Link to="/reports" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All reports
      </Link>

      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{report.id}</span>
            <span className="inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI-generated
            </span>
            <RiskBadge level={report.severity as any} />
          </div>
          <h1 className="text-2xl font-semibold">{report.title}</h1>
          <p className="text-sm text-muted-foreground">
            Subject: {userDetails?.username ?? report.user_id} · Generated {report.generated} ·
            Confidence {Math.round(report.confidence * 100)}%
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            <Download className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <BrainCircuit className="h-5 w-5" /> AI Incident Narrative
            </h2>
            <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{aiNarrative}</pre>
          </section>

          <section className="rounded-lg border p-5">
  <h2 className="text-lg font-semibold">
    Risk Breakdown
  </h2>

  <div className="mt-4 space-y-3 text-sm">

    <div>
      <div className="flex justify-between">
        <span>High Sensitivity Access</span>
        <span>{highSensitivity}</span>
      </div>
    </div>

    <div>
      <div className="flex justify-between">
        <span>Off-Hours Activity</span>
        <span>{offHours}</span>
      </div>
    </div>

    <div>
      <div className="flex justify-between">
        <span>Administrative Operations</span>
        <span>{adminOps}</span>
      </div>
    </div>

    <div className="border-t pt-3 font-semibold">
      Total Risk Score: {riskScore}
    </div>
  </div>
</section>

          <section className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold">Summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
          </section>

          {userDetails?.riskFactors?.length ? (
            <section className="rounded-lg border p-5">
              <h2 className="text-lg font-semibold">Risk Factors</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {userDetails.riskFactors.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold">Recent Activities ({activities.length})</h2>
            <div className="mt-3 max-h-96 overflow-auto text-sm">
              {activities.slice(0, 50).map((a, i) => (
                <div key={i} className="border-b py-2">
                  <div className="font-medium">{a.action} · {a.resource}</div>
                  <div className="text-xs text-muted-foreground">
                    {a.timestamp} · sensitivity: {a.resource_sensitivity} · {a.time_classification}
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-muted-foreground">No activities recorded.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold">Recommended Actions</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {actions.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`mt-1 inline-block h-2 w-2 rounded-full ${
                    a.priority === "critical" ? "bg-destructive" :
                    a.priority === "high" ? "bg-orange-500" : "bg-yellow-500"
                  }`} />
                  <span>{a.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border p-5">
            <h2 className="text-lg font-semibold">Evidence Chain</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {evidence.length === 0 && <li className="text-muted-foreground">No evidence yet.</li>}
              {evidence.map(([resource, count]) => (
                <li key={resource} className="flex justify-between">
                  <span className="truncate">{resource}</span>
                  <span className="text-muted-foreground">{count}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
