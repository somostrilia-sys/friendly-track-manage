import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HINOVA_BASE_URL = "https://api.hinova.com.br/api/sga/v2";
const HINOVA_TOKEN_FORNECEDOR = "c63a188780b2c3c950aa431950130cca20d4fdbfc71d51f320830f8d4678b955953ee6dd0f95bfc1c44855e9dc684926c851a9e845d957d1e3b994da76a6a5256d4db0c0f82f5198af4c62b20fd5dd50a69e459be55c908e49c794450036ed2a";
const HINOVA_USUARIO = "Alex";
const HINOVA_SENHA = "Walk2026";

// Rastreador product codes (classificacao 24)
const RASTREADOR_KEYWORDS = ["rastreador", "rastreamento", "tracker", "bloqueio rastreador", "ratreador"];

function temRastreador(produtos: any[]): boolean {
  return produtos.some((p: any) => {
    const desc = (p.descricao_produto || p.descricao || "").toLowerCase();
    return RASTREADOR_KEYWORDS.some(k => desc.includes(k));
  });
}

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

async function hinovaGet(endpoint: string, token: string) {
  const res = await fetch(`${HINOVA_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });
  return res.json();
}

async function hinovaPost(endpoint: string, token: string, body: any) {
  const res = await fetch(`${HINOVA_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { action, params } = await req.json().catch(() => ({ action: "listar_veiculos_rastreador", params: {} }));
    const token = await getTokenUsuario();

    let result: any;

    switch (action) {
      case "listar_veiculos_rastreador": {
        // Fetch vehicles WITH products using the veiculo/listar-veiculo-produto endpoint
        // situacao: 1=ativo, 0=todos
        const situacao = params?.situacao || "1";
        const pageSize = 1000;
        let offset = 0;
        let allVehicles: any[] = [];
        const maxPages = 20; // Safety limit

        // Fetch in pages, re-authenticating for each page (token expires fast)
        for (let page = 0; page < maxPages; page++) {
          const freshToken = await getTokenUsuario();
          const data = await hinovaGet(
            `/veiculo/listar-veiculo-produto/${situacao}/${offset}/${pageSize}`,
            freshToken
          );

          if (Array.isArray(data)) {
            allVehicles = allVehicles.concat(data);
            if (data.length < pageSize) break;
            offset += pageSize;
          } else {
            break;
          }
        }

        // Filter: only vehicles that have RASTREADOR in produtos_vinculados
        const veiculosComRastreador = allVehicles.filter((v: any) =>
          temRastreador(v.produtos_vinculados || [])
        );

        // Group by associado (codigo_associado)
        const associadoMap: Record<string, any> = {};
        for (const v of veiculosComRastreador) {
          const codAssoc = v.codigo_associado;
          if (!associadoMap[codAssoc]) {
            associadoMap[codAssoc] = {
              codigo_associado: codAssoc,
              nome: v.nome,
              cpf: v.cpf,
              rg: v.rg,
              telefone: v.telefone,
              ddd: v.ddd,
              telefone_celular: v.telefone_celular,
              ddd_celular: v.ddd_celular,
              email: v.email,
              veiculos: [],
            };
          }

          // Determine vehicle status
          let statusVeiculo = "ativo";
          const codSit = String(v.codigo_situacao || "1");
          if (codSit === "2") statusVeiculo = "inadimplente";
          else if (codSit === "3") statusVeiculo = "cancelado";
          else if (codSit === "4") statusVeiculo = "inativo";
          else if (codSit !== "1") statusVeiculo = `status_${codSit}`;

          associadoMap[codAssoc].veiculos.push({
            codigo_veiculo: v.codigo_veiculo,
            placa: v.placa,
            chassi: v.chassi,
            marca: v.descricao_marca,
            modelo: v.descricao_modelo,
            ano: `${v.ano_fabricacao}/${v.ano_modelo}`,
            tipo: v.descricao_tipo,
            categoria: v.descricao_categoria,
            valor_fipe: v.valor_fipe,
            status: statusVeiculo,
            codigo_situacao: codSit,
            data_contrato: v.data_contrato_veiculo,
            produtos: (v.produtos_vinculados || []).map((p: any) => ({
              codigo: p.codigo_produto,
              descricao: p.descricao_produto,
              valor: p.valor_produto,
            })),
          });
        }

        const associados = Object.values(associadoMap);

        result = {
          error: false,
          data: {
            success: true,
            total_veiculos_com_rastreador: veiculosComRastreador.length,
            total_associados: associados.length,
            total_veiculos_buscados: allVehicles.length,
            associados,
          },
        };
        break;
      }

      case "buscar_produtos_veiculo": {
        if (!params?.codigo_veiculo && !params?.placa) {
          return new Response(JSON.stringify({ error: "codigo_veiculo ou placa obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        const id = params.codigo_veiculo || params.placa;
        const data = await hinovaGet(`/produto-vinculado-veiculo/listar/${id}`, token);
        result = { error: false, data: { success: true, ...data } };
        break;
      }

      case "listar_associados": {
        const body: Record<string, unknown> = { pagina: 1, registros: 5000, codigo_situacao: params?.codigo_situacao || "1" };
        if (params?.pagina) body.pagina = params.pagina;
        if (params?.registros) body.registros = params.registros;
        const data = await hinovaPost("/listar/associado", token, body);
        result = { error: false, data: { success: true, ...data } };
        break;
      }

      case "listar_regionais": {
        const data = await hinovaGet("/listar/regional", token);
        result = { error: false, data: { success: true, regionais: data } };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Acao desconhecida: ${action}` }),
          { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const responseData = result.error ? result.data : result.data;
    return new Response(JSON.stringify(responseData), {
      status: result.error ? 500 : 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
