export default function EvaluationMetrics() {
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-semibold">
        Evaluation Metrics
      </h1>

      <div className="grid gap-4 md:grid-cols-5">

        <div className="rounded-lg border p-4">
          <div className="text-sm">Accuracy</div>
          <div className="text-3xl font-bold">94%</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm">Precision</div>
          <div className="text-3xl font-bold">91%</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm">Recall</div>
          <div className="text-3xl font-bold">89%</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm">F1 Score</div>
          <div className="text-3xl font-bold">90%</div>
        </div>

        <div className="rounded-lg border p-4">
          <div className="text-sm">ROC-AUC</div>
          <div className="text-3xl font-bold">95%</div>
        </div>

      </div>

      <div className="rounded-lg border p-5">
        <h2 className="font-semibold mb-4">
          System Statistics
        </h2>

        <ul className="space-y-2">
          <li>Users Analyzed: 100</li>
          <li>Incidents Generated: 35</li>
          <li>Reports Generated: 35</li>
          <li>Critical Alerts: 12</li>
          <li>High Alerts: 23</li>
        </ul>
      </div>

    </div>
  );
}