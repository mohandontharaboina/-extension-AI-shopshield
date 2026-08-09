import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ShopShield AI" },
      { name: "description", content: "Manage your ShopShield AI account details and display name." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setFullName(data?.full_name ?? "");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = fullName.trim().slice(0, 100);
    if (!name) {
      toast.error("Please enter your name");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast.error("Could not save your profile");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success("Profile updated");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account information.</p>
      </div>

      <div className="panel p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-primary/12 text-primary">
            <UserRound className="size-7" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{fullName || "ShopShield user"}</p>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={save} className="mt-6 space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} readOnly disabled />
          </div>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
