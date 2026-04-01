/**
 * Walk Finance Integration
 *
 * Bidirectional sync between Trackit Hub (faturamento_b2b) and
 * Walk Finance (trackit_faturamento) via Supabase REST API.
 */

import { supabase } from "@/integrations/supabase/client";
import type { DbFaturamentoB2B } from "@/types/database";

const WALK_FINANCE_URL = "https://xytnibnqztjaixemlepb.supabase.co";
const WALK_FINANCE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dG5pYm5xenRqYWl4ZW1sZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDY3NzksImV4cCI6MjA5MDEyMjc3OX0.sA8_V6y-PtuUqO9SPtbhyIpBzDCBwHO4WRjcUUiOmSo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function walkFinanceRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    prefer?: string;
  } = {}
) {
  const { method = "GET", body, headers = {}, prefer } = options;

  const reqHeaders: Record<string, string> = {
    apikey: WALK_FINANCE_ANON_KEY,
    Authorization: `Bearer ${WALK_FINANCE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...headers,
  };

  if (prefer) {
    reqHeaders["Prefer"] = prefer;
  }

  const res = await fetch(`${WALK_FINANCE_URL}/rest/v1/${path}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Walk Finance API error (${res.status}): ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("json")) {
    return res.json();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Push faturamento B2B from Trackit -> Walk Finance
// ---------------------------------------------------------------------------

export async function enviarFaturamentoWalkFinance(): Promise<{
  enviados: number;
  atualizados: number;
  erros: string[];
}> {
  // 1. Fetch all faturamento_b2b records from Trackit
  const { data: registros, error } = await supabase
    .from("faturamento_b2b")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar faturamento_b2b: ${error.message}`);
  if (!registros || registros.length === 0) return { enviados: 0, atualizados: 0, erros: [] };

  // 2. Fetch existing records from Walk Finance
  const existing: Array<{ trackit_id: string; situacao: string }> =
    (await walkFinanceRequest("trackit_faturamento?select=trackit_id,situacao")) || [];

  const existingMap = new Map(existing.map((r) => [r.trackit_id, r]));

  let enviados = 0;
  let atualizados = 0;
  const erros: string[] = [];

  for (const reg of registros as DbFaturamentoB2B[]) {
    const payload = {
      trackit_id: reg.id,
      empresa: reg.empresa,
      mes_referencia: reg.mes_referencia,
      data_fechamento: reg.data_fechamento,
      data_vencimento: reg.data_fechamento, // uses fechamento as default
      total_geral: reg.total_geral,
      situacao: reg.situacao,
      valor_pago: reg.valor_pago || 0,
      observacao: reg.observacao || "",
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (existingMap.has(reg.id)) {
        // Update existing record
        await walkFinanceRequest(
          `trackit_faturamento?trackit_id=eq.${reg.id}`,
          {
            method: "PATCH",
            body: payload,
            prefer: "return=minimal",
          }
        );
        atualizados++;
      } else {
        // Insert new record
        await walkFinanceRequest("trackit_faturamento", {
          method: "POST",
          body: payload,
          prefer: "return=minimal",
        });
        enviados++;
      }
    } catch (err: any) {
      erros.push(`${reg.empresa} (${reg.mes_referencia}): ${err.message}`);
    }
  }

  return { enviados, atualizados, erros };
}

// ---------------------------------------------------------------------------
// Pull payment status from Walk Finance -> Trackit
// ---------------------------------------------------------------------------

export async function sincronizarPagamentos(): Promise<{
  atualizados: number;
  erros: string[];
}> {
  // 1. Fetch all records from Walk Finance that have been paid or updated
  const wfRecords: Array<{
    trackit_id: string;
    situacao: string;
    valor_pago: number;
    data_pagamento: string | null;
    observacao: string | null;
  }> =
    (await walkFinanceRequest(
      "trackit_faturamento?select=trackit_id,situacao,valor_pago,data_pagamento,observacao"
    )) || [];

  if (wfRecords.length === 0) return { atualizados: 0, erros: [] };

  // 2. Fetch current Trackit records for comparison
  const trackitIds = wfRecords.map((r) => r.trackit_id);
  const { data: trackitRecords, error } = await supabase
    .from("faturamento_b2b")
    .select("id, situacao, valor_pago")
    .in("id", trackitIds);

  if (error) throw new Error(`Erro ao buscar registros Trackit: ${error.message}`);

  const trackitMap = new Map(
    (trackitRecords || []).map((r: any) => [r.id, r])
  );

  let atualizados = 0;
  const erros: string[] = [];

  for (const wfRec of wfRecords) {
    const trackit = trackitMap.get(wfRec.trackit_id);
    if (!trackit) continue;

    // Only sync if Walk Finance has a different (more advanced) payment status
    const needsUpdate =
      wfRec.situacao !== trackit.situacao ||
      (wfRec.valor_pago || 0) !== (trackit.valor_pago || 0);

    if (!needsUpdate) continue;

    try {
      const updatePayload: Record<string, unknown> = {
        situacao: wfRec.situacao,
        valor_pago: wfRec.valor_pago || 0,
        updated_at: new Date().toISOString(),
      };

      if (wfRec.observacao) {
        updatePayload.observacao = wfRec.observacao;
      }

      const { error: updateError } = await supabase
        .from("faturamento_b2b")
        .update(updatePayload)
        .eq("id", wfRec.trackit_id);

      if (updateError) throw updateError;
      atualizados++;
    } catch (err: any) {
      erros.push(`ID ${wfRec.trackit_id}: ${err.message}`);
    }
  }

  return { atualizados, erros };
}

// ---------------------------------------------------------------------------
// Full bidirectional sync
// ---------------------------------------------------------------------------

export async function sincronizarCompleto(): Promise<{
  push: { enviados: number; atualizados: number; erros: string[] };
  pull: { atualizados: number; erros: string[] };
}> {
  const push = await enviarFaturamentoWalkFinance();
  const pull = await sincronizarPagamentos();
  return { push, pull };
}
