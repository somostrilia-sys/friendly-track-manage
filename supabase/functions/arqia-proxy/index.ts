import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ARQIA_BASE_URL = "https://proxy.api.ip101.cloud/gestaom2m/api";
const ARQIA_KEY = "39d69be6f8aa40fe9615abdcc4e8f11";

async function arqiaRequest(path: string, body?: Record<string, unknown>) {
  const url = `${ARQIA_BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Ocp-Apim-Subscription-Key": ARQIA_KEY,
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text, status: res.status }; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { action, params } = await req.json().catch(() => ({ action: "ping", params: {} }));

    let result: any;

    switch (action) {
      case "ping":
        result = { success: true, message: "arqia-proxy online", base_url: ARQIA_BASE_URL };
        break;

      case "add_apn":
        result = await arqiaRequest("/contract/add_apn", {
          resource_type: params?.resource_type || "line",
          iccid: params?.iccid || "",
          apn_name: params?.apn_name || "",
        });
        break;

      case "remove_apn":
        result = await arqiaRequest("/contract/remove_apn", {
          resource_type: params?.resource_type || "line",
          iccid: params?.iccid || "",
          apn_name: params?.apn_name || "",
        });
        break;

      // Generic passthrough for any endpoint
      case "raw":
        if (!params?.endpoint) {
          return new Response(JSON.stringify({ error: "endpoint obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        result = await arqiaRequest(params.endpoint, params.body || {});
        break;

      default:
        return new Response(JSON.stringify({ error: `Acao desconhecida: ${action}` }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
