import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HINOVA_BASE_URL = "https://api.hinova.com.br/api/sga/v2";
const HINOVA_TOKEN = "583bc4740e73a5510513f04b10a1810cfe4be1f86cfb4ce34beb10a4439e640291d66d1891d4fbe55da175d5e667b8d3681c4bca180fdffaa0257dd88140670ed4c4ec6569e60add5f0c238c251eb59668cad90d6a2061ea5293d13562af3c86";
const HINOVA_USUARIO = "Matheus";
const HINOVA_SENHA = "Crm2026";

async function hinovaRequest(endpoint: string, method: string = "POST", body?: Record<string, unknown>) {
  const url = `${HINOVA_BASE_URL}${endpoint}`;
  console.log(`[hinova-sync] ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HINOVA_TOKEN}`,
      "usuario": HINOVA_USUARIO,
      "senha": HINOVA_SENHA,
    },
    body: body ? JSON.stringify(body) : method === "POST" ? "{}" : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

  console.log(`[hinova-sync] Response ${res.status}:`, text.substring(0, 500));

  if (!res.ok) {
    return { error: true, status: res.status, data };
  }
  return { error: false, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { action, params } = await req.json().catch(() => ({ action: "listar_associados", params: {} }));

    let result;

    switch (action) {
      case "listar_associados": {
        // Hinova sincronismo endpoint - returns all associates
        const body: Record<string, unknown> = {};
        if (params?.data_inicio) body.data_inicio = params.data_inicio;
        if (params?.data_fim) body.data_fim = params.data_fim;
        result = await hinovaRequest("/sincronismo/associados", "POST", body);
        break;
      }

      case "buscar_associado": {
        if (!params?.id) {
          return new Response(JSON.stringify({ error: "Parametro 'id' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        result = await hinovaRequest(`/sincronismo/associados/${params.id}`, "POST");
        break;
      }

      case "buscar_veiculos": {
        if (!params?.associado_id) {
          return new Response(JSON.stringify({ error: "Parametro 'associado_id' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        result = await hinovaRequest(`/sincronismo/veiculos`, "POST", { id_associado: params.associado_id });
        break;
      }

      case "sincronizar_associados": {
        result = await hinovaRequest("/sincronismo/associados", "POST", params || {});
        break;
      }

      case "buscar_produtos": {
        result = await hinovaRequest("/sincronismo/produtos", "POST");
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Acao desconhecida: ${action}` }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Even if Hinova returns an error, forward the data so frontend can show the message
    return new Response(JSON.stringify({ success: !result.error, ...result.data }), {
      status: result.error ? (result.status || 500) : 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[hinova-sync] Unhandled error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
