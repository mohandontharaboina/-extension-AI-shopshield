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
  const analysis = analyzeUrl(rawUrl);

  const { data, error } = await supabase
    .from("website_scans")
    .insert({
      user_id: userId,
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
      details: analysis as unknown as Record<string, unknown>,
    })
    .select("*")
    .single();
  if (error) throw error;

  const row = data as unknown as ScanRow;

  const { error: indicatorError } = await supabase.from("risk_indicators").insert(
    analysis.indicators.map((indicator) => ({
      scan_id: row.id,
      user_id: userId,
      name: indicator.name,
      category: indicator.category,
      status: indicator.status,
      weight: indicator.weight,
      detail: indicator.detail,
    })),
  );
  if (indicatorError) throw indicatorError;

  return row;
}

export async function deleteScan(id: string) {
  const { error } = await supabase.from("website_scans").delete().eq("id", id);
  if (error) throw error;
}
