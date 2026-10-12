import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { analyzeUrl, parseUrl } from "@/lib/scan-engine";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Max-Age": "86400",
};

const scanRequestSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  source: z.enum(["manual_dashboard", "automatic_extension"]),
}).strict();

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

export const Route = createFileRoute("/api/public/website-scan")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const declaredSize = Number(request.headers.get("content-length") ?? 0);
        if (declaredSize > 8192) return jsonResponse({ error: "The scan request is too large." }, 413);

        const authorization = request.headers.get("authorization") ?? "";
        const token = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
        if (!token || token.length > 4096) return jsonResponse({ error: "Please sign in to save this scan." }, 401);

        let rawBody: string;
        try {
          rawBody = await request.text();
        } catch {
          return jsonResponse({ error: "Could not read the scan request." }, 400);
        }
        if (rawBody.length > 8192) return jsonResponse({ error: "The scan request is too large." }, 413);

        let input: unknown;
        try {
          input = JSON.parse(rawBody);
        } catch {
          return jsonResponse({ error: "The scan request is not valid JSON." }, 400);
        }

        const parsed = scanRequestSchema.safeParse(input);
        if (!parsed.success || !parseUrl(parsed.data?.url ?? "")) {
          return jsonResponse({ error: "Enter a valid HTTP or HTTPS website address." }, 400);
        }

        const databaseUrl = process.env["SUPABASE_URL"];
        const publishableKey = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!databaseUrl || !publishableKey) {
          console.error("ShopShield scan service is missing its database connection configuration.");
          return jsonResponse({ error: "The scan service is temporarily unavailable." }, 503);
        }

        const supabase = createClient<Database>(databaseUrl, publishableKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (resource, init) => {
              const headers = new Headers(
                typeof Request !== "undefined" && resource instanceof Request ? resource.headers : undefined,
              );
              if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value));
              if (publishableKey.startsWith("sb_") && headers.get("Authorization") === `Bearer ${publishableKey}`) {
                headers.delete("Authorization");
              }
              headers.set("apikey", publishableKey);
              if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
              return fetch(resource, { ...init, headers });
            },
          },
        });

        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authData.user) return jsonResponse({ error: "Your sign-in has expired. Please sign in again." }, 401);

        let analysis;
        try {
          analysis = analyzeUrl(parsed.data.url);
        } catch {
          return jsonResponse({ error: "Enter a valid HTTP or HTTPS website address." }, 400);
        }

        const details = { ...analysis, scanSource: parsed.data.source };
        const { data: scan, error: scanError } = await supabase
          .from("website_scans")
          .insert({
            user_id: authData.user.id,
            url: analysis.url,
            domain: analysis.domain,
            website_name: analysis.websiteName,
            risk_score: analysis.riskScore,
            trust_score: analysis.trustScore,
            classification: analysis.classification,
            domain_age_days: analysis.domainAgeDays,
            https_enabled: analysis.httpsEnabled,
            ai_explanation: analysis.aiExplanation,
            recommendation: analysis.recommendation,
            details,
          })
          .select("*")
          .single();

        if (scanError || !scan) {
          console.error("ShopShield scan could not be saved.", scanError?.message);
          return jsonResponse({ error: "The scan could not be saved. Please try again." }, 500);
        }

        const { error: indicatorsError } = await supabase.from("risk_indicators").insert(
          analysis.indicators.map((indicator) => ({
            scan_id: scan.id,
            user_id: authData.user.id,
            name: indicator.name,
            category: indicator.category,
            status: indicator.status,
            weight: indicator.weight,
            detail: indicator.detail,
          })),
        );

        if (indicatorsError) {
          await supabase.from("website_scans").delete().eq("id", scan.id);
          console.error("ShopShield risk indicators could not be saved.", indicatorsError.message);
          return jsonResponse({ error: "The scan could not be saved completely. Please try again." }, 500);
        }

        return jsonResponse({ scan });
      },
    },
  },
});