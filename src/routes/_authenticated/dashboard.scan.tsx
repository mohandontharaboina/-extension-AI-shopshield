import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScanResult } from "@/components/ScanResult";
import { useAuth } from "@/hooks/useAuth";
import { parseUrl, type ScanAnalysis } from "@/lib/scan-engine";
import { rowAnalysis, runScan } from "@/lib/scans";

export const Route = createFileRoute("/_authenticated/dashboard/scan")({
  head: () => ({
    meta: [
      { title: "Scan a website — ShopShield AI" },
      {
        name: "description",
        content: "Run an AI risk analysis on any shopping website URL and get an instant verdict.",
      },
    ],
  }),
  component: ScanPage,
});

const EXAMPLES = [
  "https://amazon.in",
  "https://mega-outlet-deals-store.xyz",
  "https://nike-official-clearance.shop",
];

function ScanPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ analysis: ScanAnalysis; id: string } | null>(null);

  const mutation = useMutation({
    mutationFn: async (value: string) => runScan(value, user!.id),
    onSuccess: (row) => {
      setResult({ analysis: rowAnalysis(row), id: row.id });
      queryClient.invalidateQueries({ queryKey: ["scans"] });
      toast.success(`Analysis complete — ${row.classification}`);
    },
    onError: () => toast.error("Scan failed. Please try again."),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim().slice(0, 2048);
    if (!trimmed) {
      setError("Enter a website URL to scan");
      return;
    }
    if (!parseUrl(trimmed)) {
      setError("That doesn't look like a valid website address");
      return;
    }
    setError("");
    setResult(null);
    mutation.mutate(trimmed);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Website scanner</h1>
        <p className="text-sm text-muted-foreground">
          Our model evaluates 15 fraud signals across URL, domain, security and commerce features.
        </p>
      </div>

      <div className="panel hero-surface p-5 sm:p-6">
        <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row" noValidate>
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter shopping website URL — e.g. https://example-shopping-site.com"
              aria-label="Shopping website URL"
              aria-invalid={Boolean(error)}
              className="h-11 pl-9"
              maxLength={2048}
            />
          </div>
          <Button type="submit" size="lg" className="h-11" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Scan Website
          </Button>
        </form>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Try:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setUrl(example)}
              className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {mutation.isPending && (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      )}

      {!mutation.isPending && result && <ScanResult analysis={result.analysis} scanId={result.id} />}

      {!mutation.isPending && !result && (
        <div className="panel border-dashed p-10 text-center">
          <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No analysis running</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a shopping website URL above to generate a risk report.
          </p>
        </div>
      )}
    </div>
  );
}
