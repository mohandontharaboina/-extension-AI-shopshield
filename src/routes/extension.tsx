import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Chrome, Download, ShieldAlert, ShieldCheck, LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNavbar } from "@/components/SiteNavbar";

export const Route = createFileRoute("/extension")({
  head: () => ({
    meta: [
      { title: "ShopShield AI Browser Extension — Live fake-site alerts" },
      {
        name: "description",
        content:
          "Install the ShopShield AI browser extension, sign in once, and get a red warning at the bottom of the screen the moment you open a fake shopping website.",
      },
      { property: "og:title", content: "ShopShield AI Browser Extension" },
      {
        property: "og:description",
        content: "Continuous background protection with instant red alerts on fake shopping sites.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExtensionPage,
});

const steps = [
  { icon: Download, title: "Download the package", body: "Grab the ZIP and unzip it anywhere on your computer." },
  { icon: Chrome, title: "Load it into your browser", body: "Open chrome://extensions, turn on Developer mode, then click Load unpacked and pick the unzipped folder." },
  { icon: LogIn, title: "Sign in once", body: "Click the ShopShield icon and sign in with the same account you use here." },
  { icon: RefreshCw, title: "Stay protected", body: "Every site you open is checked continuously in the background and saved to your scan history." },
];

type ExtStatus = "checking" | "missing" | "signed-out" | "signed-in";

function ExtensionStatusCard() {
  const [status, setStatus] = useState<ExtStatus>("checking");
  const [email, setEmail] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    setStatus("checking");
    let done = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || (event.data as { type?: string })?.type !== "SHOPSHIELD_STATUS_RESPONSE") return;
      const payload = (event.data as { payload: { signedIn: boolean; email: string | null } }).payload;
      done = true;
      setEmail(payload.email);
      setStatus(payload.signedIn ? "signed-in" : "signed-out");
    };
    window.addEventListener("message", onMessage);
    window.postMessage({ type: "SHOPSHIELD_STATUS_REQUEST" }, "*");
    const timer = window.setTimeout(() => {
      if (!done) setStatus("missing");
    }, 1200);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, [nonce]);

  const config = {
    checking: { dot: "bg-muted-foreground", title: "Checking extension status…", body: "Looking for the ShopShield AI extension in this browser." },
    missing: { dot: "bg-muted-foreground", title: "Extension not detected", body: "Install the extension below, then refresh this page." },
    "signed-out": { dot: "bg-destructive", title: "Extension installed — signed out", body: "Open the ShopShield icon in your toolbar and sign in to start protection." },
    "signed-in": { dot: "bg-success", title: "Extension signed in — protection active", body: email ? `Signed in as ${email}.` : "Every site you open is being checked in the background." },
  }[status];

  return (
    <div className="mt-8 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5">
      <span className={`size-2.5 shrink-0 rounded-full ${config.dot}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{config.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{config.body}</p>
      </div>
      <Button variant="outline" size="sm" onClick={() => setNonce((n) => n + 1)} disabled={status === "checking"}>
        <RefreshCw className="size-4" />
        Re-check
      </Button>
    </div>
  );
}

function ExtensionPage() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const download = () => {
    setBusy(true);
    setError(null);
    fetch("/shopshield-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "shopshield-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
          <Chrome className="size-3.5 text-primary" />
          Chrome, Edge, Brave, Arc & Opera
        </span>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Real-time protection while you browse
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          The extension uses the exact same detection engine as the dashboard. You sign in once, then
          every website you open is checked continuously in the background. If a page looks fake, a red
          alert appears at the bottom of the screen straight away.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={download} disabled={busy}>
            <Download className="size-4" />
            {busy ? "Preparing…" : "Download extension"}
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/signup">Create an account</Link>
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <step.icon className="size-5 text-primary" />
                <h2 className="text-sm font-semibold">
                  {index + 1}. {step.title}
                </h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-14 rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-semibold">What the alert looks like</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Safe sites stay silent — only the extension badge shows the risk score. Suspicious and high
            risk sites trigger a pop-up bar pinned to the bottom of the page.
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
              <ShieldCheck className="mt-0.5 size-5 text-success" />
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Safe</span> — no interruption, score shown on
                the toolbar icon.
              </p>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-destructive p-4 text-destructive-foreground shadow-lg">
              <ShieldAlert className="mt-0.5 size-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">
                  Warning: mega-deals-outlet.xyz looks like a FAKE website (risk 82/100)
                </p>
                <p className="mt-1 text-xs opacity-90">
                  Do not enter card details or personal information on this website. Signals: Domain age,
                  Brand impersonation, Payment security.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
