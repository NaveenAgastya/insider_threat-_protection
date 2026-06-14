import { Routes, Route, Link } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { useSidebar,SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import UserDetail from "@/pages/UserDetail";
import Incidents from "@/pages/Incidents";
import Reports from "@/pages/Reports";
import ReportDetail from "@/pages/ReportDetail";
import EvaluationMetrics from "@/pages/EvaluationMetrics";
import NotFound from "@/pages/NotFound";

function TopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger className="-ml-1" />
      <div className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:flex">
        <span className="inline-flex h-1.5 w-1.5 rounded-full bg-success" />
        All sensors nominal · 1,284 events/s
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden sm:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Hunt: user, hash, IP…"
            className="h-8 w-64 rounded-md border border-border bg-muted/40 pl-8 pr-3 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/40 hover:bg-muted">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 font-mono text-[9px] text-critical-foreground">7</span>
        </button>
        <div className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:block">
          UTC 14:34:08
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:userId" element={<UserDetail />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:reportId" element={<ReportDetail />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/evaluation" element={<EvaluationMetrics />}/>
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
