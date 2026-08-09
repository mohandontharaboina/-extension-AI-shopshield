import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScanResult } from "@/components/ScanResult";
import { getScan, rowAnalysis } from "@/lib/scans";

export const Route = createFileRoute("/_authenticated/dashboard/report/$id")({
  head: () => ({
    meta: [
      { title: "Scan report — ShopShield AI" },
      { name: "description", content: "Detailed AI fraud-risk breakdown for a scanned shopping website." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { id } = useParams({ from: "/_authenticated/dashboard/report/$id" });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["scan", id],
    queryFn: () => getScan(id),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Detailed report</h1>
          <p className="text-sm text-muted-foreground">
            Full signal-by-signal breakdown of this website analysis.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/history">
            <ArrowLeft className="size-4" />
            Back to history
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {(isError || (!isLoading && !data)) && (
        <div className="panel border-dashed p-10 text-center">
          <p className="font-medium">Report not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This scan may have been deleted or belongs to another account.
          </p>
          <Button asChild className="mt-4">
            <Link to="/dashboard/history">Back to history</Link>
          </Button>
        </div>
      )}

      {data && <ScanResult analysis={rowAnalysis(data)} scanId={data.id} />}
    </div>
  );
}
