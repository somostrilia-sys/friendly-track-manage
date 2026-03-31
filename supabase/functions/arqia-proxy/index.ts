import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ARQIA_BASE_URL = "https://portal.api.ip101.cloud";
const ARQIA_EMAIL = "alexander@holdingwalk.com.br";
const ARQIA_SENHA = "Arqia123#";

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  console.log("[arqia-proxy] Authenticating...");
  const res = await fetch(`${ARQIA_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ARQIA_EMAIL, password: ARQIA_SENHA }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[arqia-proxy] Auth failed:", text);
    throw new Error("Falha na autenticacao Arqia");
  }

  const data = await res.json();
  cachedToken = data.token || data.access_token;
  // Cache token for 50 minutes
  tokenExpiry = Date.now() + 50 * 60 * 1000;
  return cachedToken!;
}

async function arqiaRequest(
  path: string,
  method: string = "GET",
  body?: Record<string, unknown>
) {
  const token = await getToken();
  const url = `${ARQIA_BASE_URL}${path}`;
  console.log(`[arqia-proxy] ${method} ${url}`);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
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
    console.error(`[arqia-proxy] Error ${res.status}:`, text);
    return { error: true, status: res.status, data };
  }

  return { error: false, data };
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: cors });

  try {
    const { action, params } = await req.json().catch(() => ({
      action: "ping",
      params: {},
    }));

    let result;

    switch (action) {
      case "consultar_linha": {
        if (!params?.iccid) {
          return new Response(
            JSON.stringify({ error: "Parametro 'iccid' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        result = await arqiaRequest(`/api/lines/${params.iccid}`);
        break;
      }

      case "enviar_sms": {
        if (!params?.iccid || !params?.message) {
          return new Response(
            JSON.stringify({ error: "Parametros 'iccid' e 'message' obrigatorios" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        result = await arqiaRequest("/api/sms/send", "POST", {
          iccid: params.iccid,
          message: params.message,
        });
        break;
      }

      case "ativar_linha": {
        if (!params?.iccid) {
          return new Response(
            JSON.stringify({ error: "Parametro 'iccid' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        result = await arqiaRequest(`/api/lines/${params.iccid}/activate`, "POST");
        break;
      }

      case "desativar_linha": {
        if (!params?.iccid) {
          return new Response(
            JSON.stringify({ error: "Parametro 'iccid' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
        result = await arqiaRequest(`/api/lines/${params.iccid}/deactivate`, "POST");
        break;
      }

      case "listar_linhas": {
        result = await arqiaRequest("/api/lines");
        break;
      }

      case "ping": {
        return new Response(
          JSON.stringify({ success: true, message: "arqia-proxy online" }),
          { headers: { ...cors, "Content-Type": "application/json" } }
        );
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

    return new Response(JSON.stringify({ success: true, data: result.data }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[arqia-proxy] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
