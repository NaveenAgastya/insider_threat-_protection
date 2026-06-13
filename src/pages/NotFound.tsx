import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Sentinel // 404</div>
        <h1 className="mt-2 text-5xl font-semibold tracking-tight">Signal lost</h1>
        <p className="mt-2 text-sm text-muted-foreground">No telemetry matches this route.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Return to console
          </Link>
        </div>
      </div>
    </div>
  );
}
