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
const HINOVA_TOKEN_SGA = "c63a188780b2c3c950aa431950130cca20d4fdbfc71d51f320830f8d4678b955953ee6dd0f95bfc1c44855e9dc684926c851a9e845d957d1e3b994da76a6a5256d4db0c0f82f5198af4c62b20fd5dd50a69e459be55c908e49c794450036ed2a";
const HINOVA_TOKEN_SYNC = "0991beea9f5da288bb3d6bdf73467fa442960228167f8097e43f5b227ba15cfb02575f04b2a40563e1570ed7f71009a40aa631d494b87cf2999f8296ed5daaafedb67b58bc6d8f805f91bb510b57231b012a704bc6069d30a328834d4629758ac5200d0f266825acde0dc394e7b35411";
const HINOVA_USUARIO = "Alex";
const HINOVA_SENHA = "Walk2026";

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
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${HINOVA_TOKEN_SGA}` },
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
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
  });
  return res.json();
}

async function hinovaPost(endpoint: string, token: string, body: any) {
  const res = await fetch(`${HINOVA_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { action, params } = await req.json().catch(() => ({ action: "buscar_pagina", params: {} }));

    let result: any;

    switch (action) {
      // Busca UMA página de veículos de UMA situação — leve e rápido
      case "buscar_pagina": {
        const situacao = params?.situacao || "1";
        const inicio = parseInt(params?.inicio || "0", 10);
        const quantidade = Math.min(parseInt(params?.quantidade || "1000", 10), 5000);

        const token = await getTokenUsuario();
        const data = await hinovaGet(
          `/veiculo/listar-veiculo-produto/${situacao}/${inicio}/${quantidade}`,
          token
        );

        const sitLabels: Record<string, string> = { "1": "ativo", "2": "inadimplente", "3": "cancelado", "4": "inativo" };

        if (!Array.isArray(data)) {
          result = { error: false, data: { success: true, salvos: 0, total_pagina: 0, tem_mais: false } };
          break;
        }

        // Filtrar apenas com rastreador
        const comRastreador = data.filter((v: any) => temRastreador(v.produtos_vinculados || []));

        // Formatar e salvar direto no cache do Supabase
        const rows = comRastreador.map((v: any) => ({
          codigo_veiculo: v.codigo_veiculo || `${v.codigo_associado}_${v.placa}`,
          placa: (v.placa || "").toUpperCase().trim() || null,
          chassi: v.chassi || null,
          nome_associado: v.nome || "",
          cpf: v.cpf || "",
          codigo_associado: v.codigo_associado || "",
          marca: v.descricao_marca || "",
          modelo: v.descricao_modelo || "",
          ano: v.ano_fabricacao && v.ano_modelo ? `${v.ano_fabricacao}/${v.ano_modelo}` : "",
          valor_fipe: v.valor_fipe || null,
          status_veiculo: sitLabels[situacao] || "ativo",
          cooperativa: v.nome_cooperativa || v.descricao_cooperativa || "",
          tem_rastreador: true,
          telefone: v.telefone || "",
          telefone_celular: v.telefone_celular || "",
          ddd_celular: v.ddd_celular || "",
          email: v.email || "",
          produtos: JSON.stringify((v.produtos_vinculados || []).map((p: any) => ({
            codigo: p.codigo_produto, descricao: p.descricao_produto, valor: p.valor_produto,
          }))),
          updated_at: new Date().toISOString(),
        }));

        let salvos = 0;
        if (rows.length > 0) {
          for (let i = 0; i < rows.length; i += 500) {
            const batch = rows.slice(i, i + 500);
            const { error: upsertErr } = await supabaseAdmin
              .from("sga_veiculos_cache")
              .upsert(batch, { onConflict: "codigo_veiculo" });
            if (!upsertErr) salvos += batch.length;
            else console.error("Cache upsert error:", upsertErr);
          }
        }

        console.log(`Pagina sit=${situacao} inicio=${inicio}: ${data.length} total, ${comRastreador.length} rastreador, ${salvos} salvos`);

        result = {
          error: false,
          data: {
            success: true,
            salvos,
            total_pagina: data.length,
            com_rastreador: comRastreador.length,
            tem_mais: data.length >= quantidade,
          },
        };
        break;
      }

      // Mantém compatibilidade com chamadas antigas — agora retorna instrução pro frontend paginar
      case "listar_veiculos_rastreador": {
        const situacao = params?.situacao || "1";
        const token = await getTokenUsuario();
        const data = await hinovaGet(
          `/veiculo/listar-veiculo-produto/${situacao}/0/500`,
          token
        );

        const sitLabels: Record<string, string> = { "1": "ativo", "2": "inadimplente", "3": "cancelado", "4": "inativo" };

        if (!Array.isArray(data)) {
          result = {
            error: false,
            data: { success: true, total_veiculos_buscados: 0, total_veiculos_com_rastreador: 0, total_associados: 0, associados: [] },
          };
          break;
        }

        const veiculosComRastreador = data.filter((v: any) => temRastreador(v.produtos_vinculados || []));

        const associadoMap: Record<string, any> = {};
        for (const v of veiculosComRastreador) {
          const codAssoc = v.codigo_associado;
          if (!associadoMap[codAssoc]) {
            associadoMap[codAssoc] = {
              codigo_associado: codAssoc, nome: v.nome, cpf: v.cpf, rg: v.rg,
              telefone: v.telefone, ddd: v.ddd, telefone_celular: v.telefone_celular,
              ddd_celular: v.ddd_celular, email: v.email, cidade: v.cidade, estado: v.estado,
              cooperativa: v.nome_cooperativa || v.descricao_cooperativa || "",
              status_associado: v.descricao_situacao_associado || "",
              veiculos: [],
            };
          }
          associadoMap[codAssoc].veiculos.push({
            codigo_veiculo: v.codigo_veiculo, placa: v.placa, chassi: v.chassi,
            marca: v.descricao_marca, modelo: v.descricao_modelo,
            ano: `${v.ano_fabricacao}/${v.ano_modelo}`, tipo: v.descricao_tipo,
            categoria: v.descricao_categoria, valor_fipe: v.valor_fipe,
            status: sitLabels[situacao] || "ativo", codigo_situacao: situacao,
            data_contrato: v.data_contrato_veiculo,
            produtos: (v.produtos_vinculados || []).map((p: any) => ({
              codigo: p.codigo_produto, descricao: p.descricao_produto, valor: p.valor_produto,
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
            total_veiculos_buscados: data.length,
            tem_mais: data.length >= 1000,
            associados,
          },
        };
        break;
      }

      case "buscar_por_placa": {
        if (!params?.placa) {
          return new Response(JSON.stringify({ error: "placa obrigatoria" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        const data = await hinovaGet(`/sincronismo-produto-fornecedor/buscar/placa/${params.placa}`, HINOVA_TOKEN_SYNC);
        result = { error: false, data: { success: true, veiculo: data } };
        break;
      }

      case "buscar_por_chassi": {
        if (!params?.chassi) {
          return new Response(JSON.stringify({ error: "chassi obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        const data = await hinovaGet(`/sincronismo-produto-fornecedor/buscar/chassi/${params.chassi}`, HINOVA_TOKEN_SYNC);
        result = { error: false, data: { success: true, veiculo: data } };
        break;
      }

      case "buscar_por_cpf": {
        if (!params?.cpf) {
          return new Response(JSON.stringify({ error: "cpf obrigatorio" }),
            { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
        }
        const data = await hinovaGet(`/sincronismo-produto-fornecedor/buscar/cpf/${params.cpf}`, HINOVA_TOKEN_SYNC);
        result = { error: false, data: { success: true, veiculos: data } };
        break;
      }

      case "buscar_produtos_veiculo": {
        const token = await getTokenUsuario();
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
        const token = await getTokenUsuario();
        const body: Record<string, unknown> = { pagina: 1, registros: 5000, codigo_situacao: params?.codigo_situacao || "1" };
        if (params?.pagina) body.pagina = params.pagina;
        if (params?.registros) body.registros = params.registros;
        const data = await hinovaPost("/listar/associado", token, body);
        result = { error: false, data: { success: true, ...data } };
        break;
      }

      case "listar_regionais": {
        const token = await getTokenUsuario();
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

    const responseData = result.data;
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
