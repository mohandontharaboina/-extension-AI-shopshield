/**
 * ShopShield AI — mock detection engine.
 *
 * This module is intentionally isolated and pure so it can be swapped for a
 * real ML backend (e.g. a Python/FastAPI service) later. Replace `analyzeUrl`
 * with an HTTP call that returns the same `ScanAnalysis` shape and every UI
 * surface keeps working unchanged.
 */

export type Classification = "SAFE" | "SUSPICIOUS" | "HIGH RISK";
export type IndicatorStatus = "positive" | "warning" | "negative" | "neutral";

export interface RiskIndicator {
  name: string;
  category: "url" | "domain" | "security" | "content" | "commerce";
  status: IndicatorStatus;
  weight: number;
  detail: string;
}

export interface ScanAnalysis {
  url: string;
  domain: string;
  websiteName: string;
  riskScore: number;
  trustScore: number;
  classification: Classification;
  domainAgeDays: number;
  httpsEnabled: boolean;
  sslIssuer: string;
  domainReputation: string;
  redirects: number;
  suspiciousKeywords: string[];
  hasContactInfo: boolean;
  hasPrivacyPolicy: boolean;
  hasRefundPolicy: boolean;
  paymentSecurity: string;
  priceAnomaly: string;
  brandImpersonation: string;
  urlStructure: string;
  indicators: RiskIndicator[];
  detectedThreats: string[];
  positiveSignals: string[];
  warnings: string[];
  aiExplanation: string;
  recommendation: string;
}

const SUSPICIOUS_KEYWORDS = [
  "cheap",
  "deal",
  "outlet",
  "sale",
  "discount",
  "offer",
  "free",
  "clearance",
  "mega",
  "lucky",
  "win",
  "gift",
  "official-store",
  "bestbuy-deals",
  "limited",
];

const IMPERSONATED_BRANDS = [
  "amazon",
  "flipkart",
  "myntra",
  "nike",
  "adidas",
  "apple",
  "rolex",
  "gucci",
  "zara",
  "shein",
];

const TRUSTED_DOMAINS = [
  "amazon.com",
  "amazon.in",
  "flipkart.com",
  "myntra.com",
  "ajio.com",
  "nike.com",
  "apple.com",
  "walmart.com",
  "ebay.com",
  "etsy.com",
];

/** Deterministic hash so the same URL always yields the same mock analysis. */
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pseudoRandom(seed: number, index: number): number {
  return ((hash(`${seed}:${index}`) % 1000) / 1000 + 0) as number;
}

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function parseUrl(raw: string): URL | null {
  try {
    const url = new URL(normalizeUrl(raw));
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

export function classify(riskScore: number): Classification {
  if (riskScore < 35) return "SAFE";
  if (riskScore < 70) return "SUSPICIOUS";
  return "HIGH RISK";
}

function titleCase(domain: string): string {
  const core = domain.replace(/^www\./, "").split(".")[0] ?? domain;
  return core
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Mock AI scoring function. Combines weighted feature signals into a 0–100
 * risk score. A real model would return the same fields.
 */
export function analyzeUrl(rawUrl: string): ScanAnalysis {
  const url = parseUrl(rawUrl);
  if (!url) throw new Error("Invalid URL");

  const href = url.href;
  const host = url.hostname.toLowerCase();
  const bareHost = host.replace(/^www\./, "");
  const seed = hash(bareHost);
  const isTrusted = TRUSTED_DOMAINS.some((d) => bareHost === d || bareHost.endsWith(`.${d}`));

  const httpsEnabled = url.protocol === "https:";
  const urlLength = href.length;
  const specialChars = (href.match(/[-_@%?=&~]/g) ?? []).length;
  const digitCount = (bareHost.match(/\d/g) ?? []).length;
  const subdomains = Math.max(0, bareHost.split(".").length - 2);
  const suspiciousKeywords = SUSPICIOUS_KEYWORDS.filter((k) => href.toLowerCase().includes(k));
  const impersonated = IMPERSONATED_BRANDS.find((b) => bareHost.includes(b) && !isTrusted);
  const oddTld = /\.(xyz|top|shop|club|online|store|buzz|icu|cc)$/.test(bareHost) && !isTrusted;

  const domainAgeDays = isTrusted
    ? 3000 + (seed % 4000)
    : Math.round(5 + pseudoRandom(seed, 1) * (oddTld || impersonated ? 200 : 1600));

  const redirects = isTrusted ? 0 : Math.round(pseudoRandom(seed, 2) * 3);
  const hasContactInfo = isTrusted || pseudoRandom(seed, 3) > 0.4;
  const hasPrivacyPolicy = isTrusted || pseudoRandom(seed, 4) > 0.35;
  const hasRefundPolicy = isTrusted || pseudoRandom(seed, 5) > 0.45;
  const insecurePayments = !isTrusted && pseudoRandom(seed, 6) > 0.6;
  const priceAnomalyScore = isTrusted ? 0 : pseudoRandom(seed, 7);

  const indicators: RiskIndicator[] = [];
  const add = (i: RiskIndicator) => indicators.push(i);

  add({
    name: "HTTPS / SSL encryption",
    category: "security",
    status: httpsEnabled ? "positive" : "negative",
    weight: httpsEnabled ? 0 : 18,
    detail: httpsEnabled
      ? "Traffic is encrypted with a valid TLS certificate."
      : "No HTTPS — data submitted to this site travels in plain text.",
  });

  add({
    name: "URL length",
    category: "url",
    status: urlLength > 90 ? "warning" : "positive",
    weight: urlLength > 90 ? 6 : 0,
    detail: `${urlLength} characters. Long URLs are frequently used to hide the real destination.`,
  });

  add({
    name: "Special characters in URL",
    category: "url",
    status: specialChars > 6 ? "warning" : "positive",
    weight: specialChars > 6 ? 5 : 0,
    detail: `${specialChars} special characters detected in the address.`,
  });

  add({
    name: "Numeric characters in domain",
    category: "url",
    status: digitCount > 2 ? "warning" : "positive",
    weight: digitCount > 2 ? 5 : 0,
    detail: `${digitCount} digits in the hostname.`,
  });

  add({
    name: "Subdomain depth",
    category: "url",
    status: subdomains > 1 ? "warning" : "positive",
    weight: subdomains > 1 ? 6 : 0,
    detail: `${subdomains} subdomain level(s) detected.`,
  });

  add({
    name: "Suspicious keywords",
    category: "content",
    status: suspiciousKeywords.length > 1 ? "negative" : suspiciousKeywords.length ? "warning" : "positive",
    weight: Math.min(14, suspiciousKeywords.length * 5),
    detail: suspiciousKeywords.length
      ? `Found: ${suspiciousKeywords.join(", ")}`
      : "No high-pressure bait keywords in the address.",
  });

  add({
    name: "Domain age",
    category: "domain",
    status: domainAgeDays < 90 ? "negative" : domainAgeDays < 365 ? "warning" : "positive",
    weight: domainAgeDays < 90 ? 20 : domainAgeDays < 365 ? 9 : 0,
    detail: `Registered approximately ${domainAgeDays} days ago.`,
  });

  add({
    name: "Domain reputation",
    category: "domain",
    status: isTrusted ? "positive" : oddTld ? "negative" : "neutral",
    weight: oddTld ? 10 : 0,
    detail: isTrusted
      ? "Domain appears on known-good retailer lists."
      : oddTld
        ? "Uncommon TLD frequently abused by short-lived storefronts."
        : "No strong reputation signal in threat feeds.",
  });

  add({
    name: "Brand impersonation",
    category: "domain",
    status: impersonated ? "negative" : "positive",
    weight: impersonated ? 18 : 0,
    detail: impersonated
      ? `Hostname mimics the "${impersonated}" brand without being an official domain.`
      : "No brand look-alike pattern detected.",
  });

  add({
    name: "Redirect behaviour",
    category: "security",
    status: redirects > 1 ? "negative" : redirects === 1 ? "warning" : "positive",
    weight: redirects > 1 ? 10 : redirects === 1 ? 4 : 0,
    detail: `${redirects} redirect hop(s) observed before the final page loaded.`,
  });

  add({
    name: "Contact information",
    category: "content",
    status: hasContactInfo ? "positive" : "negative",
    weight: hasContactInfo ? 0 : 8,
    detail: hasContactInfo
      ? "Physical address and support contact published."
      : "No verifiable contact details found on the site.",
  });

  add({
    name: "Privacy policy",
    category: "content",
    status: hasPrivacyPolicy ? "positive" : "negative",
    weight: hasPrivacyPolicy ? 0 : 7,
    detail: hasPrivacyPolicy ? "Privacy policy page located." : "No privacy policy page found.",
  });

  add({
    name: "Return / refund policy",
    category: "commerce",
    status: hasRefundPolicy ? "positive" : "negative",
    weight: hasRefundPolicy ? 0 : 7,
    detail: hasRefundPolicy
      ? "Return and refund terms published."
      : "No return or refund policy published.",
  });

  add({
    name: "Payment security",
    category: "commerce",
    status: insecurePayments ? "negative" : "positive",
    weight: insecurePayments ? 15 : 0,
    detail: insecurePayments
      ? "Accepts bank transfer, crypto or gift cards — non-reversible payment methods."
      : "Checkout uses recognised PCI-compliant payment gateways.",
  });

  add({
    name: "Product price anomaly",
    category: "commerce",
    status: priceAnomalyScore > 0.7 ? "negative" : priceAnomalyScore > 0.45 ? "warning" : "positive",
    weight: priceAnomalyScore > 0.7 ? 12 : priceAnomalyScore > 0.45 ? 5 : 0,
    detail:
      priceAnomalyScore > 0.7
        ? "Listed prices are 70–90% below market average for identical products."
        : priceAnomalyScore > 0.45
          ? "Some listings are noticeably below typical market price."
          : "Pricing is consistent with market averages.",
  });

  const rawScore = indicators.reduce((sum, i) => sum + i.weight, 0);
  const riskScore = Math.max(2, Math.min(98, Math.round(isTrusted ? Math.min(rawScore, 12) : rawScore)));
  const trustScore = 100 - riskScore;
  const classification = classify(riskScore);

  const detectedThreats = indicators.filter((i) => i.status === "negative").map((i) => i.name);
  const warnings = indicators.filter((i) => i.status === "warning").map((i) => i.name);
  const positiveSignals = indicators.filter((i) => i.status === "positive").map((i) => i.name);

  const aiExplanation =
    classification === "SAFE"
      ? `Our model scored ${bareHost} at ${riskScore}/100 risk. The domain has an established registration history, serves content over a valid TLS certificate, and publishes the trust pages (contact, privacy and refund policy) that legitimate retailers maintain. No brand-impersonation or payment-redirection patterns were found.`
      : classification === "SUSPICIOUS"
        ? `Our model scored ${bareHost} at ${riskScore}/100 risk. Several features associated with low-quality or short-lived storefronts were detected${
            detectedThreats.length ? `, notably ${detectedThreats.slice(0, 3).join(", ")}` : ""
          }. The site is not conclusively fraudulent, but the combination of a young domain profile and missing trust pages places it well above the safe baseline.`
        : `Our model scored ${bareHost} at ${riskScore}/100 risk. The URL and domain profile match patterns commonly seen in fraudulent shopping sites${
            detectedThreats.length ? `: ${detectedThreats.slice(0, 4).join(", ")}` : ""
          }. Multiple high-weight fraud features fired simultaneously, which historically correlates strongly with scam storefronts.`;

  const recommendation =
    classification === "SAFE"
      ? "This website looks legitimate. Continue as normal, but always verify the seller and pay with a card that supports chargebacks."
      : classification === "SUSPICIOUS"
        ? "Proceed with caution. Avoid saving payment details, use a card with chargeback protection, and verify the seller independently before purchasing."
        : "Do not enter card details or personal information on this website. Close the tab and report the domain if you were directed here from an advert or message.";

  return {
    url: href,
    domain: bareHost,
    websiteName: titleCase(bareHost),
    riskScore,
    trustScore,
    classification,
    domainAgeDays,
    httpsEnabled,
    sslIssuer: httpsEnabled
      ? isTrusted
        ? "DigiCert Global G2 (EV)"
        : "Let's Encrypt R3 (DV, issued recently)"
      : "None",
    domainReputation: isTrusted ? "Excellent" : oddTld || impersonated ? "Poor" : "Unrated",
    redirects,
    suspiciousKeywords,
    hasContactInfo,
    hasPrivacyPolicy,
    hasRefundPolicy,
    paymentSecurity: insecurePayments ? "Non-reversible methods accepted" : "PCI-compliant gateway",
    priceAnomaly:
      priceAnomalyScore > 0.7 ? "Severe" : priceAnomalyScore > 0.45 ? "Moderate" : "None detected",
    brandImpersonation: impersonated ? `Mimics ${impersonated}` : "None detected",
    urlStructure:
      urlLength > 90 || specialChars > 6 || subdomains > 1
        ? "Obfuscated / abnormal"
        : "Clean and readable",
    indicators,
    detectedThreats,
    positiveSignals,
    warnings,
    aiExplanation,
    recommendation,
  };
}
