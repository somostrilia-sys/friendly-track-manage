import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  "https://jlrslrljvpveaeheetlm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpscnNscmxqdnB2ZWFlaGVldGxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDAzNDM2NSwiZXhwIjoyMDg5NjEwMzY1fQ._iwyZf5vBiMeeh_9wg3SxCT5UEWHsXBIo42xogJpTeg"
);

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
        // Fetch ALL vehicles across ALL situacoes (1=ativo, 2=inadimplente, 3=cancelado, 4=inativo)
        const situacoes = params?.situacao ? [params.situacao] : ["1", "2", "3", "4"];
        const pageSize = 15000; // API supports large pages
        let allVehicles: any[] = [];

        const sitLabels: Record<string, string> = { "1": "ativo", "2": "inadimplente", "3": "cancelado", "4": "inativo" };

        for (const sit of situacoes) {
          const freshToken = await getTokenUsuario();
          const data = await hinovaGet(
            `/veiculo/listar-veiculo-produto/${sit}/0/${pageSize}`,
            freshToken
          );

          if (Array.isArray(data)) {
            // Tag each vehicle with the situacao from the request
            for (const v of data) {
              v._situacao_veiculo = sit;
              v._status_label = sitLabels[sit] || `status_${sit}`;
            }
            allVehicles = allVehicles.concat(data);
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
              cidade: v.cidade,
              estado: v.estado,
              cooperativa: v.nome_cooperativa || v.descricao_cooperativa || "",
              status_associado: v.descricao_situacao_associado || v.codigo_situacao_associado || "",
              veiculos: [],
            };
          }

          // Use status from the request situacao tag
          const statusVeiculo = v._status_label || "ativo";
          const codSit = v._situacao_veiculo || "1";

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

        // Cache is saved by the frontend after receiving data (edge function has 60s timeout)

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

      case "salvar_cache": {
        const veiculos = params?.veiculos;
        if (!Array.isArray(veiculos) || veiculos.length === 0) {
          return new Response(JSON.stringify({ error: "veiculos array obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }

        const rows = veiculos.map((v: any) => ({
          placa: (v.placa || "").toUpperCase().trim(),
          chassi: v.chassi || "",
          nome_associado: v.nome_associado || "",
          cpf: v.cpf || "",
          marca: v.marca || "",
          modelo: v.modelo || "",
          status_veiculo: v.status_veiculo || "ativo",
          cooperativa: v.cooperativa || "",
          tem_rastreador: v.tem_rastreador ?? true,
          codigo_associado: v.codigo_associado || "",
          codigo_veiculo: v.codigo_veiculo || "",
          ano: v.ano || "",
          valor_fipe: v.valor_fipe || null,
          data_contrato: v.data_contrato || null,
          telefone: v.telefone || "",
          telefone_celular: v.telefone_celular || "",
          ddd_celular: v.ddd_celular || "",
          email: v.email || "",
          produtos: typeof v.produtos === "string" ? v.produtos : JSON.stringify(v.produtos || []),
          updated_at: new Date().toISOString(),
        }));

        let upserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error: upsertErr } = await supabaseAdmin
            .from("sga_veiculos_cache")
            .upsert(batch, { onConflict: "codigo_veiculo" });
          if (upsertErr) {
            console.error("Cache upsert error:", upsertErr);
          } else {
            upserted += batch.length;
          }
        }

        result = { error: false, data: { success: true, total_upserted: upserted } };
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
