import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const HINOVA_BASE_URL = "https://api.hinova.com.br/api/sga/v2";
const HINOVA_TOKEN =
  "583bc4740e73a5510513f04b10a1810cfe4be1f86cfb4ce34beb10a4439e640291d66d1891d4fbe55da175d5e667b8d3681c4bca180fdffaa0257dd88140670ed4c4ec6569e60add5f0c238c251eb59668cad90d6a2061ea5293d13562af3c86";
const HINOVA_USUARIO = "Matheus";
const HINOVA_SENHA = "Crm2026";

async function hinovaRequest(
  endpoint: string,
  method: string = "GET",
  body?: Record<string, unknown>
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    token: HINOVA_TOKEN,
    usuario: HINOVA_USUARIO,
    senha: HINOVA_SENHA,
  };

  const url = `${HINOVA_BASE_URL}${endpoint}`;
  console.log(`[hinova-sync] ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error(`[hinova-sync] Error ${res.status}:`, text);
    return { error: true, status: res.status, data };
  }

  return { error: false, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: cors });

  try {
    const { action, params } = await req.json().catch(() => ({
      action: "listar_associados",
      params: {},
    }));

    let result;

    switch (action) {
      case "listar_associados": {
        const qs = new URLSearchParams();
        if (params?.data_inicio) qs.append("data_inicio", params.data_inicio);
        if (params?.data_fim) qs.append("data_fim", params.data_fim);
        const query = qs.toString() ? `?${qs.toString()}` : "";
        result = await hinovaRequest(`/associados${query}`);
        break;
      }

      case "buscar_associado": {
        if (!params?.id) {
          return new Response(
            JSON.stringify({ error: "Parametro 'id' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        result = await hinovaRequest(`/associados/${params.id}`);
        break;
      }

      case "buscar_veiculos": {
        if (!params?.associado_id) {
          return new Response(
            JSON.stringify({ error: "Parametro 'associado_id' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        result = await hinovaRequest(
          `/associados/${params.associado_id}/veiculos`
        );
        break;
      }

      case "sincronizar_associados": {
        result = await hinovaRequest("/sincronismo/associados", "POST");
        break;
      }

      case "buscar_produtos": {
        result = await hinovaRequest("/produtos");
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Acao desconhecida: ${action}` }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
        );
    }

    if (result.error) {
      return new Response(JSON.stringify(result), {
        status: result.status || 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, ...result.data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[hinova-sync] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
