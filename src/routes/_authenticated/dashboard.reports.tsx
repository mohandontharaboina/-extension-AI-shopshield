import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileBarChart, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { listScans } from "@/lib/scans";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  head: () => ({
    meta: [
      { title: "Security reports — ShopShield AI" },
      { name: "description", content: "Aggregated security insights across all of your scanned websites." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["scans"], queryFn: listScans });
  const scans = data ?? [];

  const avg = scans.length
    ? Math.round(scans.reduce((sum, s) => sum + s.risk_score, 0) / scans.length)
    : 0;
  const flagged = scans.filter((s) => s.classification !== "SAFE").length;
  const safeRate = scans.length ? Math.round(((scans.length - flagged) / scans.length) * 100) : 0;

  const threatCounts = scans.reduce<Record<string, number>>((acc, scan) => {
    const threats = (scan.details?.["detectedThreats"] ?? []) as string[];
    for (const threat of threats) {
      acc[threat] = (acc[threat] ?? 0) + 1;
    }
    return acc;
  }, {});
  const topThreats = Object.entries(threatCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Security reports</h1>
        <p className="text-sm text-muted-foreground">
          Aggregated intelligence from every scan run on your account.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="panel border-dashed p-10 text-center">
          <FileBarChart className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No report data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Reports are generated automatically once you have scanned a few websites.
          </p>
          <Button asChild className="mt-4">
            <Link to="/dashboard/scan">Run a scan</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="panel p-5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="size-4" /> Average risk score
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{avg}/100</p>
              <Progress value={avg} className="mt-3 h-2" />
            </div>
            <div className="panel p-5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4" /> Safe rate
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{safeRate}%</p>
              <Progress value={safeRate} className="mt-3 h-2" />
            </div>
            <div className="panel p-5">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileBarChart className="size-4" /> Flagged websites
              </p>
              <p className="mt-1 font-display text-3xl font-semibold tabular-nums">{flagged}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                out of {scans.length} total scans
              </p>
            </div>
          </div>

          <div className="panel p-5 sm:p-6">
            <h2 className="font-display text-base font-semibold">Most common threats detected</h2>
            {topThreats.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No threats detected across your scans — nice work.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {topThreats.map(([threat, count]) => (
                  <li key={threat}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate">{threat}</span>
                      <span className="tabular-nums text-muted-foreground">{count}x</span>
                    </div>
                    <Progress
                      value={(count / (topThreats[0]?.[1] ?? 1)) * 100}
                      className="mt-1.5 h-1.5"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
