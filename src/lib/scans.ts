import { supabase } from "@/integrations/supabase/client";
import { analyzeUrl, type Classification, type ScanAnalysis } from "@/lib/scan-engine";

export interface ScanRow {
  id: string;
  user_id: string;
  url: string;
  domain: string;
  website_name: string | null;
  risk_score: number;
  trust_score: number;
  classification: string;
  domain_age_days: number | null;
  https_enabled: boolean;
  ai_explanation: string | null;
  recommendation: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export function rowClassification(row: ScanRow): Classification {
  const value = row.classification as Classification;
  return value === "SAFE" || value === "SUSPICIOUS" || value === "HIGH RISK" ? value : "SAFE";
}

export function rowAnalysis(row: ScanRow): ScanAnalysis {
  return row.details as unknown as ScanAnalysis;
}

export async function listScans(): Promise<ScanRow[]> {
  const { data, error } = await supabase
    .from("website_scans")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ScanRow[];
}

export async function getScan(id: string): Promise<ScanRow | null> {
  const { data, error } = await supabase.from("website_scans").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as unknown as ScanRow) ?? null;
}

/**
 * Runs the detection engine and persists the result for the signed-in user.
 * Swap `analyzeUrl` for a call to a real ML API here and nothing else changes.
 */
export async function runScan(rawUrl: string, userId: string): Promise<ScanRow> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken || sessionData.session?.user.id !== userId) {
    throw new Error("Your sign-in has expired. Please sign in and try again.");
  }

  const response = await fetch("/api/public/website-scan", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: rawUrl, source: "manual_dashboard" }),
  });
  const body = (await response.json().catch(() => null)) as { scan?: unknown; error?: string } | null;
  if (!response.ok || !body?.scan) {
    throw new Error(body?.error ?? "Scan failed. Please try again.");
  }
  return body.scan as ScanRow;
}

export async function deleteScan(id: string) {
  const { error } = await supabase.from("website_scans").delete().eq("id", id);
  if (error) throw error;
}
