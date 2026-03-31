/**
 * Arqia API Integration (via Supabase Edge Function proxy)
 *
 * All calls go through the "arqia-proxy" edge function to avoid CORS
 * and protect credentials server-side.
 */

import { supabase } from "@/integrations/supabase/client";

async function callArqiaProxy(action: string, params: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("arqia-proxy", {
    body: { action, params },
  });

  if (error) throw new Error(error.message || "Erro ao chamar proxy Arqia");
  if (data?.error) throw new Error(data.data?.message || data.error || "Erro na Arqia");

  return data?.data ?? data;
}

// Query line status by ICCID
export async function consultarLinha(iccid: string) {
  return callArqiaProxy("consultar_linha", { iccid });
}

// Send SMS command to device
export async function enviarComandoSMS(iccid: string, message: string) {
  return callArqiaProxy("enviar_sms", { iccid, message });
}

// Activate line
export async function ativarLinha(iccid: string) {
  return callArqiaProxy("ativar_linha", { iccid });
}

// Deactivate line
export async function desativarLinha(iccid: string) {
  return callArqiaProxy("desativar_linha", { iccid });
}

// List all lines
export async function listarLinhas() {
  return callArqiaProxy("listar_linhas");
}
