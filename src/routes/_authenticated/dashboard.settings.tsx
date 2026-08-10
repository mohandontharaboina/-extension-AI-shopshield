import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, Moon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ShopShield AI" },
      { name: "description", content: "Update your password, alert preferences and appearance settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [alerts, setAlerts] = useState(true);
  const [autoScan, setAutoScan] = useState(false);

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Security, notifications and appearance.</p>
      </div>

      <div className="panel p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold">
          <ShieldCheck className="size-4 text-primary" />
          Change password
        </h2>
        <form onSubmit={updatePassword} className="mt-4 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm new password</Label>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              maxLength={72}
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </div>

      <div className="panel p-5 sm:p-6">
        <h2 className="font-display text-base font-semibold">Preferences</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">High-risk alerts</p>
              <p className="text-xs text-muted-foreground">
                Show a warning banner whenever a scan is classified as high risk.
              </p>
            </div>
            <Switch checked={alerts} onCheckedChange={setAlerts} aria-label="High-risk alerts" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Auto-scan pasted links</p>
              <p className="text-xs text-muted-foreground">
                Start an analysis automatically when a URL is pasted into the scanner.
              </p>
            </div>
            <Switch checked={autoScan} onCheckedChange={setAutoScan} aria-label="Auto-scan pasted links" />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium">
                <Moon className="size-4" /> Appearance
              </p>
              <p className="text-xs text-muted-foreground">Switch between dark and light console themes.</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="panel p-5 sm:p-6">
        <h2 className="font-display text-base font-semibold">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign out of ShopShield AI on this device.</p>
        <Button variant="outline" className="mt-4" onClick={signOut}>
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
