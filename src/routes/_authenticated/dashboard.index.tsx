import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, ScanLine, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskBadge } from "@/components/RiskBadge";
import { listScans, rowClassification } from "@/lib/scans";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ShopShield AI" },
      { name: "description", content: "Overview of your website scans, risk levels and recent activity." },
    ],
  }),
  component: DashboardOverview,
});

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
  tone: "primary" | "safe" | "warn" | "danger";
}) {
  const tones = {
    primary: "bg-primary/12 text-primary",
    safe: "bg-safe-muted text-safe",
    warn: "bg-warn-muted text-warn",
    danger: "bg-danger-muted text-danger",
  } as const;

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <span className={cn("grid size-10 place-items-center rounded-lg", tones[tone])}>
          <Icon className="size-5" />
        </span>
      </div>
    </div>
  );
}

function DashboardOverview() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["scans"], queryFn: listScans });

  const scans = data ?? [];
  const safe = scans.filter((s) => s.classification === "SAFE").length;
  const suspicious = scans.filter((s) => s.classification === "SUSPICIOUS").length;
  const high = scans.filter((s) => s.classification === "HIGH RISK").length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Overview</h1>
          <p className="text-sm text-muted-foreground">
            Live summary of everything ShopShield AI has analysed for your account.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/scan">
            <ScanLine className="size-4" />
            Scan a website
          </Link>
        </Button>
      </div>

      {isError && (
        <div className="panel border-destructive/40 p-5 text-sm text-destructive">
          We couldn't load your scans. Please refresh and try again.
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total websites scanned" value={scans.length} icon={Activity} tone="primary" />
          <StatCard label="Safe websites" value={safe} icon={CheckCircle2} tone="safe" />
          <StatCard label="Suspicious websites" value={suspicious} icon={AlertTriangle} tone="warn" />
          <StatCard label="High-risk websites" value={high} icon={ShieldAlert} tone="danger" />
        </div>
      )}

      <div className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-base font-semibold">Recent scan activity</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/dashboard/history">View all</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : scans.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center">
            <ScanLine className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">No scans yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Run your first analysis to see risk results here.
            </p>
            <Button asChild className="mt-4">
              <Link to="/dashboard/scan">Scan a website</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {scans.slice(0, 6).map((scan) => (
              <li key={scan.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{scan.website_name ?? scan.domain}</p>
                  <p className="truncate text-xs text-muted-foreground">{scan.url}</p>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">{scan.risk_score}/100</span>
                <RiskBadge classification={rowClassification(scan)} size="sm" />
                <Button asChild variant="outline" size="sm">
                  <Link to="/dashboard/report/$id" params={{ id: scan.id }}>
                    View details
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
