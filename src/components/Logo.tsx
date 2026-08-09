import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary/12 text-primary ring-1 ring-primary/25">
        <ShieldCheck className="size-4.5" />
      </span>
      {!compact && (
        <span className="font-display text-base font-semibold tracking-tight">
          ShopShield <span className="text-primary">AI</span>
        </span>
      )}
    </span>
  );
}
