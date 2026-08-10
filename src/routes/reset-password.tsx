import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { PasswordInput } from "@/components/PasswordInput";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — ShopShield AI" },
      { name: "description", content: "Set a new password for your ShopShield AI account." },
      { property: "og:title", content: "Choose a new ShopShield AI password" },
      { property: "og:description", content: "Complete your password reset securely." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters").max(72),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ password, confirm });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="hero-surface grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo />
        </Link>
        <div className="panel p-6 sm:p-8">
          <h1 className="text-2xl font-semibold">Set a new password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open this page from your reset email so the session is verified.
          </p>
          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(errors["password"])}
              />
              {errors["password"] && <p className="text-xs text-destructive">{errors["password"]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <PasswordInput
                id="confirm"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-invalid={Boolean(errors["confirm"])}
              />
              {errors["confirm"] && <p className="text-xs text-destructive">{errors["confirm"]}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Update password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
