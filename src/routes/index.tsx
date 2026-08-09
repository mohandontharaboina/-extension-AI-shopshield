import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Chrome, Gauge, Lock, ScanLine, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNavbar } from "@/components/SiteNavbar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopShield AI — Detect fake shopping websites instantly" },
      {
        name: "description",
        content:
          "ShopShield AI analyses any shopping website for fraud signals and returns a risk score, AI explanation and clear verdict in seconds.",
      },
      { property: "og:title", content: "ShopShield AI — Detect fake shopping websites instantly" },
      {
        property: "og:description",
        content: "AI-powered fraud detection for online shoppers. Scan a URL, get an instant risk verdict.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "AI risk analysis", body: "15 fraud signals scored across URL, domain, security and payment behaviour." },
  { icon: Gauge, title: "Instant risk score", body: "A 0–100 score with a clear Safe, Suspicious or High Risk verdict." },
  { icon: Lock, title: "Security inspection", body: "SSL issuer, HTTPS enforcement, domain age and reputation checks." },
  { icon: ScanLine, title: "Scan history", body: "Every analysis is stored privately in your account for later review." },
  { icon: ShieldCheck, title: "Plain-English explanations", body: "Understand exactly why a site was flagged, not just a number." },
  { icon: Chrome, title: "Built for shoppers", body: "Made for anyone checking an unfamiliar deal before paying." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNavbar />

      <main>
        <section className="hero-surface border-b border-border">
          <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              AI-powered fraud detection
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Know if a shopping site is fake — before you pay
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Paste any store URL. ShopShield AI inspects the domain, security setup and commerce
              signals, then returns a risk score with a plain-English explanation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/signup">Start scanning free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">What ShopShield checks</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            A layered detection model built around the patterns real scam storefronts share.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="panel p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/12 text-primary">
                  <feature.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-card/40">
          <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              Shop with confidence in three steps
            </h2>
            <ol className="mt-8 grid gap-4 text-left sm:grid-cols-3">
              {[
                ["Paste the URL", "Drop in any storefront link you're unsure about."],
                ["Run the analysis", "Our model scores 15 independent fraud indicators."],
                ["Act on the verdict", "Get a clear recommendation and a saved report."],
              ].map(([title, body], index) => (
                <li key={title} className="panel p-5">
                  <span className="font-display text-sm text-primary">0{index + 1}</span>
                  <h3 className="mt-2 font-medium">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
            <Button asChild size="lg" className="mt-10">
              <Link to="/signup">Create your free account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ShopShield AI. Risk scores are advisory, not a guarantee.
      </footer>
    </div>
  );
}
