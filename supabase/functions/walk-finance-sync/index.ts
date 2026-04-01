import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Trackit Hub (source of truth for faturamento)
const TRACKIT_URL = "https://jlrslrljvpveaeheetlm.supabase.co";
const TRACKIT_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscnNscmxqdnB2ZWFlaGVldGxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzNDM2NSwiZXhwIjoyMDg5NjEwMzY1fQ._iwyZf5vBiMeeh_9wg3SxCT5UEWHsXBIo42xogJpTeg";

// Walk Finance (destination for billing visibility / payment tracking)
const WALK_FINANCE_URL = "https://xytnibnqztjaixemlepb.supabase.co";
const WALK_FINANCE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dG5pYm5xenRqYWl4ZW1sZXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDY3NzksImV4cCI6MjA5MDEyMjc3OX0.sA8_V6y-PtuUqO9SPtbhyIpBzDCBwHO4WRjcUUiOmSo";

const trackitAdmin = createClient(TRACKIT_URL, TRACKIT_SERVICE_KEY);
const walkFinance = createClient(WALK_FINANCE_URL, WALK_FINANCE_ANON_KEY);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// -------------------------------------------------------------------------
// Push: Trackit faturamento_b2b -> Walk Finance trackit_faturamento
// -------------------------------------------------------------------------
async function pushFaturamento() {
  const { data: registros, error } = await trackitAdmin
    .from("faturamento_b2b")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erro ao buscar faturamento_b2b: ${error.message}`);
  if (!registros || registros.length === 0) return { enviados: 0, atualizados: 0 };

  const { data: existing } = await walkFinance
    .from("trackit_faturamento")
    .select("trackit_id");

  const existingIds = new Set((existing || []).map((r: any) => r.trackit_id));

  let enviados = 0;
  let atualizados = 0;

  for (const reg of registros) {
    const payload = {
      trackit_id: reg.id,
      empresa: reg.empresa,
      mes_referencia: reg.mes_referencia,
      data_fechamento: reg.data_fechamento,
      data_vencimento: reg.data_fechamento,
      total_geral: reg.total_geral,
      situacao: reg.situacao,
      valor_pago: reg.valor_pago || 0,
      observacao: reg.observacao || "",
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingIds.has(reg.id)) {
      const { error: upErr } = await walkFinance
        .from("trackit_faturamento")
        .update(payload)
        .eq("trackit_id", reg.id);
      if (upErr) console.error(`Update error for ${reg.id}:`, upErr);
      else atualizados++;
    } else {
      const { error: insErr } = await walkFinance
        .from("trackit_faturamento")
        .insert(payload);
      if (insErr) console.error(`Insert error for ${reg.id}:`, insErr);
      else enviados++;
    }
  }

  return { enviados, atualizados };
}

// -------------------------------------------------------------------------
// Pull: Walk Finance payment updates -> Trackit faturamento_b2b
// -------------------------------------------------------------------------
async function pullPagamentos() {
  const { data: wfRecords, error } = await walkFinance
    .from("trackit_faturamento")
    .select("trackit_id, situacao, valor_pago, data_pagamento, observacao");

  if (error) throw new Error(`Erro ao buscar Walk Finance: ${error.message}`);
  if (!wfRecords || wfRecords.length === 0) return { atualizados: 0 };

  let atualizados = 0;

  for (const wf of wfRecords) {
    const { data: trackit } = await trackitAdmin
      .from("faturamento_b2b")
      .select("id, situacao, valor_pago")
      .eq("id", wf.trackit_id)
      .single();

    if (!trackit) continue;

    const needsUpdate =
      wf.situacao !== trackit.situacao ||
      (wf.valor_pago || 0) !== (trackit.valor_pago || 0);

    if (!needsUpdate) continue;

    const updatePayload: Record<string, unknown> = {
      situacao: wf.situacao,
      valor_pago: wf.valor_pago || 0,
      updated_at: new Date().toISOString(),
    };
    if (wf.observacao) updatePayload.observacao = wf.observacao;

    const { error: upErr } = await trackitAdmin
      .from("faturamento_b2b")
      .update(updatePayload)
      .eq("id", wf.trackit_id);

    if (upErr) console.error(`Pull update error ${wf.trackit_id}:`, upErr);
    else atualizados++;
  }

  return { atualizados };
}

// -------------------------------------------------------------------------
// Handler
// -------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { action } = await req.json().catch(() => ({ action: "sync_all" }));

    let result: Record<string, unknown> = {};

    if (action === "push_faturamento" || action === "sync_all") {
      result.push = await pushFaturamento();
    }

    if (action === "pull_pagamentos" || action === "sync_all") {
      result.pull = await pullPagamentos();
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[walk-finance-sync] Error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
});
