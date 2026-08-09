import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — ShopShield AI" },
      {
        name: "description",
        content: "Request a secure password reset link for your ShopShield AI account.",
      },
      { property: "og:title", content: "Reset your ShopShield AI password" },
      { property: "og:description", content: "We'll email you a secure reset link." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ForgotPasswordPage,
});

const schema = z.string().trim().email("Enter a valid email address").max(255);

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setError("");
    setLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (resetError) {
      toast.error(resetError.message);
      return;
    }
    setSent(true);
    toast.success("Reset link sent");
  };

  return (
    <div className="hero-surface grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo />
        </Link>
        <div className="panel p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-full bg-safe-muted text-safe">
                <MailCheck className="size-6" />
              </span>
              <h1 className="mt-4 text-xl font-semibold">Check your inbox</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                If an account exists for {email}, a password reset link is on its way.
              </p>
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">Forgot password</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your email and we'll send a secure reset link.
              </p>
              <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(error)}
                  />
                  {error && <p className="text-xs text-destructive">{error}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Remembered it?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
