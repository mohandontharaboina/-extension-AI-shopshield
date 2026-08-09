import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Classification } from "@/lib/scan-engine";

export const riskTone: Record<Classification, string> = {
  SAFE: "bg-safe-muted text-safe border-safe/30",
  SUSPICIOUS: "bg-warn-muted text-warn border-warn/30",
  "HIGH RISK": "bg-danger-muted text-danger border-danger/30",
};

const icons: Record<Classification, typeof CheckCircle2> = {
  SAFE: CheckCircle2,
  SUSPICIOUS: AlertTriangle,
  "HIGH RISK": ShieldAlert,
};

export function RiskBadge({
  classification,
  className,
  size = "md",
}: {
  classification: Classification;
  className?: string;
  size?: "sm" | "md";
}) {
  const Icon = icons[classification];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        riskTone[classification],
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-4"} />
      {classification}
    </span>
  );
}
