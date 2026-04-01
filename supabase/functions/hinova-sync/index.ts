import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HINOVA_BASE_URL = "https://api.hinova.com.br/api/sga/v2";
const HINOVA_TOKEN_FORNECEDOR = "583bc4740e73a5510513f04b10a1810cfe4be1f86cfb4ce34beb10a4439e640291d66d1891d4fbe55da175d5e667b8d3681c4bca180fdffaa0257dd88140670ed4c4ec6569e60add5f0c238c251eb59668cad90d6a2061ea5293d13562af3c86";
const HINOVA_USUARIO = "Matheus";
const HINOVA_SENHA = "Crm2026";

async function getTokenUsuario(): Promise<string> {
  const res = await fetch(`${HINOVA_BASE_URL}/usuario/autenticar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HINOVA_TOKEN_FORNECEDOR}`,
    },
    body: JSON.stringify({ usuario: HINOVA_USUARIO, senha: HINOVA_SENHA }),
  });
  const data = await res.json();
  if (data.mensagem !== "OK" || !data.token_usuario) {
    throw new Error(`Falha na autenticacao Hinova: ${JSON.stringify(data)}`);
  }
  return data.token_usuario;
}

async function hinovaRequest(endpoint: string, method: string = "POST", body?: Record<string, unknown>) {
  const tokenUsuario = await getTokenUsuario();
  const url = `${HINOVA_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tokenUsuario}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }

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
        const body: Record<string, unknown> = { pagina: 1, registros: 5000 };
        // Filter by situacao (1=ativo by default)
        body.codigo_situacao = params?.codigo_situacao || "1";
        if (params?.data_cadastro_inicio) body.data_cadastro_inicio = params.data_cadastro_inicio;
        if (params?.data_cadastro_fim) body.data_cadastro_fim = params.data_cadastro_fim;
        if (params?.pagina) body.pagina = params.pagina;
        if (params?.registros) body.registros = params.registros;
        result = await hinovaRequest("/listar/associado", "POST", body);
        break;
      }

      case "buscar_veiculos": {
        if (!params?.codigo_associado) {
          return new Response(JSON.stringify({ error: "Parametro 'codigo_associado' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        result = await hinovaRequest("/listar/veiculo", "POST", { codigo_associado: params.codigo_associado });
        break;
      }

      case "buscar_cooperativa": {
        if (!params?.codigo) {
          return new Response(JSON.stringify({ error: "Parametro 'codigo' obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        result = await hinovaRequest(`/cooperativa/buscar/${params.codigo}`, "GET");
        break;
      }

      case "listar_regionais": {
        result = await hinovaRequest("/listar/regional", "GET");
        break;
      }

      case "sincronizar_associados": {
        const body: Record<string, unknown> = { pagina: 1, registros: 5000, codigo_situacao: "1" };
        if (params?.data_cadastro_inicio) body.data_cadastro_inicio = params.data_cadastro_inicio;
        if (params?.data_cadastro_fim) body.data_cadastro_fim = params.data_cadastro_fim;
        result = await hinovaRequest("/listar/associado", "POST", body);
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Acao desconhecida: ${action}` }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: !result.error, ...result.data }), {
      status: result.error ? (result.status || 500) : 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
