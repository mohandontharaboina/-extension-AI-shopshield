import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  FileBarChart,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Settings,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", to: "/dashboard" as const, icon: LayoutDashboard, exact: true },
  { label: "Scan Website", to: "/dashboard/scan" as const, icon: ScanLine, exact: false },
  { label: "Scan History", to: "/dashboard/history" as const, icon: History, exact: false },
  { label: "Security Reports", to: "/dashboard/reports" as const, icon: FileBarChart, exact: false },
  { label: "Profile", to: "/dashboard/profile" as const, icon: User, exact: false },
  { label: "Settings", to: "/dashboard/settings" as const, icon: Settings, exact: false },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const sidebar = (
    <div className="flex h-full flex-col gap-1 border-r border-sidebar-border bg-sidebar p-4">
      <Link to="/" className="mb-4 px-1" onClick={() => setOpen(false)}>
        <Logo />
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary/12 text-sidebar-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4.5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 rounded-lg border border-sidebar-border bg-background/50 p-3">
        <p className="truncate text-xs text-muted-foreground">Signed in as</p>
        <p className="truncate text-sm font-medium">{user?.email}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={signOut}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden lg:block lg:h-screen lg:sticky lg:top-0">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72">{sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
            <span className="font-display text-sm font-semibold text-muted-foreground">
              Security Console
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link to="/dashboard/scan">New scan</Link>
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
