import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.28a12 12 0 0 0 0 10.74l4.01-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.63l4.01 3.09C6.23 6.88 8.88 4.77 12 4.77z"
      />
    </svg>
  );
}

export function SocialAuthButtons({ label = "Continue with Google" }: { label?: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Google sign-in failed");
        setLoading(false);
        return;
      }

      if (result.redirected) return;

      toast.success("Signed in");
      navigate({ to: "/dashboard" });
    } catch {
      toast.error("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={signInWithGoogle}
      disabled={loading}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <GoogleIcon />}
      {label}
    </Button>
  );
}
