import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RiskBadge } from "@/components/RiskBadge";
import { listScans, rowClassification } from "@/lib/scans";

export const Route = createFileRoute("/_authenticated/dashboard/history")({
  head: () => ({
    meta: [
      { title: "Scan history — ShopShield AI" },
      { name: "description", content: "Search and filter every website you have analysed with ShopShield AI." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { data, isLoading } = useQuery({ queryKey: ["scans"], queryFn: listScans });
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (data ?? []).filter((scan) => {
      const matchesTerm =
        !term ||
        scan.url.toLowerCase().includes(term) ||
        scan.domain.toLowerCase().includes(term) ||
        (scan.website_name ?? "").toLowerCase().includes(term);
      const matchesStatus = status === "ALL" || scan.classification === status;
      return matchesTerm && matchesStatus;
    });
  }, [data, query, status]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Scan history</h1>
        <p className="text-sm text-muted-foreground">Every analysis stored against your account.</p>
      </div>

      <div className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by website or URL"
              aria-label="Search scan history"
              className="pl-9"
              maxLength={200}
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-52" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="SAFE">Safe</SelectItem>
              <SelectItem value="SUSPICIOUS">Suspicious</SelectItem>
              <SelectItem value="HIGH RISK">High risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center">
            <History className="mx-auto size-8 text-muted-foreground" />
            <p className="mt-3 font-medium">Nothing to show</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.length ? "No scans match your filters." : "Run your first scan to build a history."}
            </p>
            <Button asChild className="mt-4">
              <Link to="/dashboard/scan">Scan a website</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 pr-3 font-medium">Website</th>
                  <th className="py-2.5 pr-3 font-medium">URL</th>
                  <th className="py-2.5 pr-3 font-medium">Scan date</th>
                  <th className="py-2.5 pr-3 font-medium">Risk score</th>
                  <th className="py-2.5 pr-3 font-medium">Status</th>
                  <th className="py-2.5 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((scan) => (
                  <tr key={scan.id}>
                    <td className="py-3 pr-3 font-medium">{scan.website_name ?? scan.domain}</td>
                    <td className="max-w-[240px] truncate py-3 pr-3 text-muted-foreground">{scan.url}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-muted-foreground">
                      {new Date(scan.created_at).toLocaleDateString(undefined, {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3 pr-3 tabular-nums">{scan.risk_score}/100</td>
                    <td className="py-3 pr-3">
                      <RiskBadge classification={rowClassification(scan)} size="sm" />
                    </td>
                    <td className="py-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/dashboard/report/$id" params={{ id: scan.id }}>
                          View Details
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
