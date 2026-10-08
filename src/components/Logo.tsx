import { ShieldCheck } from "lucide-react";
import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const ShieldLogo3D = lazy(() => import("@/components/ShieldLogo3D"));

class LogoFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  override render() { return this.state.failed ? <ShieldCheck className="size-4.5" /> : this.props.children; }
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden="true" className="shopshield-logo grid size-8 shrink-0 place-items-center text-primary">
        <LogoFallback>
          <Suspense fallback={<ShieldCheck className="size-4.5" />}>
            {mounted ? <ShieldLogo3D /> : <ShieldCheck className="size-4.5" />}
          </Suspense>
        </LogoFallback>
      </span>
      {!compact && (
        <span className="font-display text-base font-semibold tracking-tight">
          ShopShield <span className="text-primary">AI</span>
        </span>
      )}
    </span>
  );
}
