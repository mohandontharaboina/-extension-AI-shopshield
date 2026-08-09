import { cn } from "@/lib/utils";
import type { Classification } from "@/lib/scan-engine";

const stroke: Record<Classification, string> = {
  SAFE: "var(--safe)",
  SUSPICIOUS: "var(--warn)",
  "HIGH RISK": "var(--danger)",
};

const text: Record<Classification, string> = {
  SAFE: "text-safe",
  SUSPICIOUS: "text-warn",
  "HIGH RISK": "text-danger",
};

export function ScoreDial({
  score,
  classification,
  size = 168,
  label = "Risk score",
  className,
}: {
  score: number;
  classification: Classification;
  size?: number;
  label?: string;
  className?: string;
}) {
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={10}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke[classification]}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("font-display text-4xl font-semibold tabular-nums", text[classification])}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
