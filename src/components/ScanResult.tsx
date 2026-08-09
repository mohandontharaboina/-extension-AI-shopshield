import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { ScoreDial } from "@/components/ScoreDial";
import { RiskBadge } from "@/components/RiskBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { IndicatorStatus, ScanAnalysis } from "@/lib/scan-engine";
import { cn } from "@/lib/utils";

const statusStyles: Record<IndicatorStatus, string> = {
  positive: "text-safe",
  warning: "text-warn",
  negative: "text-danger",
  neutral: "text-muted-foreground",
};

const StatusIcon = ({ status }: { status: IndicatorStatus }) => {
  const Icon = status === "positive" ? CheckCircle2 : status === "warning" ? AlertTriangle : status === "negative" ? ShieldAlert : Globe;
  return <Icon className={cn("mt-0.5 size-4 shrink-0", statusStyles[status])} />;
};

function Fact({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium break-words">{value}</p>
    </div>
  );
}

export function ScanResult({
  analysis,
  scanId,
  showDetailsLink = false,
}: {
  analysis: ScanAnalysis;
  scanId?: string;
  showDetailsLink?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="panel p-5 sm:p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <ScoreDial score={analysis.riskScore} classification={analysis.classification} />

          <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="font-display text-xl font-semibold">{analysis.websiteName}</h2>
              <RiskBadge classification={analysis.classification} />
            </div>
            <a
              href={analysis.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 text-sm break-all text-muted-foreground hover:text-primary"
            >
              {analysis.url}
              <ExternalLink className="size-3.5 shrink-0" />
            </a>

            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Trust score</span>
                <span className="tabular-nums">{analysis.trustScore}/100</span>
              </div>
              <Progress value={analysis.trustScore} className="mt-1.5 h-2" />
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <Fact icon={Clock} label="Domain age" value={`${analysis.domainAgeDays} days`} />
              <Fact icon={Lock} label="HTTPS / SSL" value={analysis.httpsEnabled ? analysis.sslIssuer : "Not secured"} />
              <Fact icon={Globe} label="Domain reputation" value={analysis.domainReputation} />
              <Fact icon={FileText} label="URL structure" value={analysis.urlStructure} />
              <Fact icon={CreditCard} label="Payment security" value={analysis.paymentSecurity} />
              <Fact icon={ShieldAlert} label="Brand impersonation" value={analysis.brandImpersonation} />
            </div>

            {showDetailsLink && scanId && (
              <Button asChild variant="outline" size="sm">
                <Link to="/dashboard/report/$id" params={{ id: scanId }}>
                  View full report
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="panel p-5 sm:p-6">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Sparkles className="size-4 text-primary" />
          AI explanation
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{analysis.aiExplanation}</p>

        <div
          className={cn(
            "mt-4 rounded-lg border p-4 text-sm",
            analysis.classification === "SAFE"
              ? "border-safe/30 bg-safe-muted text-safe"
              : analysis.classification === "SUSPICIOUS"
                ? "border-warn/30 bg-warn-muted text-warn"
                : "border-danger/30 bg-danger-muted text-danger",
          )}
        >
          <p className="font-medium">Recommended action</p>
          <p className="mt-1 opacity-90">{analysis.recommendation}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-danger">Detected threats</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {analysis.detectedThreats.length ? (
              analysis.detectedThreats.map((t) => (
                <li key={t} className="flex gap-2">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
                  {t}
                </li>
              ))
            ) : (
              <li>No critical threats detected.</li>
            )}
          </ul>
        </div>
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-warn">Warning indicators</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {analysis.warnings.length ? (
              analysis.warnings.map((t) => (
                <li key={t} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />
                  {t}
                </li>
              ))
            ) : (
              <li>No warnings raised.</li>
            )}
          </ul>
        </div>
        <div className="panel p-5">
          <h3 className="text-sm font-semibold text-safe">Positive signals</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {analysis.positiveSignals.slice(0, 8).map((t) => (
              <li key={t} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-safe" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold">Full indicator breakdown</h3>
          <Badge variant="secondary">{analysis.indicators.length} signals evaluated</Badge>
        </div>
        <ul className="mt-4 divide-y divide-border">
          {analysis.indicators.map((indicator) => (
            <li key={indicator.name} className="flex gap-3 py-3">
              <StatusIcon status={indicator.status} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{indicator.name}</p>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {indicator.category}
                  </Badge>
                  {indicator.weight > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      +{indicator.weight} risk
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{indicator.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
