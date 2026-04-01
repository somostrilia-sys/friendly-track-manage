/**
 * Hinova ERP API Integration
 * Busca associados com produto RASTREADOR via Edge Function hinova-sync
 */

import { supabase } from "@/integrations/supabase/client";

export interface VeiculoERP {
  codigo_veiculo: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  tipo: string;
  categoria: string;
  valor_fipe: number;
  status: string; // ativo, inadimplente, cancelado, inativo
  codigo_situacao: string;
  data_contrato: string;
  produtos: { codigo: string; descricao: string; valor: string }[];
}

export interface AssociadoERP {
  codigo_associado: string;
  nome: string;
  cpf: string;
  telefone: string;
  ddd: string;
  telefone_celular: string;
  ddd_celular: string;
  email: string;
  veiculos: VeiculoERP[];
}

export interface SyncResult {
  success: boolean;
  total_veiculos_buscados: number;
  total_veiculos_com_rastreador: number;
  total_associados: number;
  associados: AssociadoERP[];
}

async function invokeHinova(action: string, params: Record<string, string> = {}) {
  const { data, error } = await supabase.functions.invoke("hinova-sync", {
    body: { action, params },
  });

  if (error) {
    console.error("Erro ao invocar hinova-sync:", error);
    throw new Error(error.message || "Erro ao comunicar com o SGA");
  }

  if (data?.error && typeof data.error === "string") {
    throw new Error(data.error);
  }

  return data;
}

/**
 * Busca dados do cache SGA (tabela sga_veiculos_cache) - leitura instantanea.
 */
export async function buscarCacheSGA(): Promise<any[]> {
  const { data, error } = await supabase
    .from("sga_veiculos_cache")
    .select("*")
    .limit(15000);
  if (error) {
    console.error("Erro ao ler cache SGA:", error);
    return [];
  }
  return data || [];
}

/**
 * Dispara atualizacao do cache SGA em background via edge function.
 * A edge function busca tudo da Hinova e salva no cache automaticamente.
 */
export async function atualizarCacheSGA(): Promise<void> {
  try {
    await invokeHinova("listar_veiculos_rastreador");
  } catch (e) {
    console.error("Erro ao atualizar cache SGA:", e);
  }
}

/**
 * Busca todos os associados que possuem produto RASTREADOR vinculado ao veículo.
 * Primeiro tenta ler do cache. Se vazio ou stale (>24h), dispara refresh em background.
 * Retorna dados do cache imediatamente quando disponivel.
 */
export async function buscarAssociadosComRastreador(): Promise<SyncResult> {
  // Try cache first
  const cached = await buscarCacheSGA();

  if (cached.length > 0) {
    // Check if cache is stale (>24h)
    const oldestUpdate = cached.reduce((min, row) => {
      const updated = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      return updated < min ? updated : min;
    }, Date.now());
    const ageHours = (Date.now() - oldestUpdate) / (1000 * 60 * 60);

    if (ageHours > 24) {
      // Trigger background refresh (don't await)
      atualizarCacheSGA();
    }

    // Convert cache rows to AssociadoERP format
    const associadoMap: Record<string, AssociadoERP> = {};
    for (const row of cached) {
      const cpf = row.cpf || "";
      if (!associadoMap[cpf]) {
        associadoMap[cpf] = {
          codigo_associado: row.codigo_associado || "",
          nome: row.nome_associado || "",
          cpf,
          telefone: row.telefone || "",
          ddd: "",
          telefone_celular: row.telefone_celular || "",
          ddd_celular: row.ddd_celular || "",
          email: row.email || "",
          veiculos: [],
        };
      }

      let produtos: { codigo: string; descricao: string; valor: string }[] = [];
      try {
        produtos = typeof row.produtos === "string" ? JSON.parse(row.produtos) : (row.produtos || []);
      } catch { produtos = []; }

      associadoMap[cpf].veiculos.push({
        codigo_veiculo: row.codigo_veiculo || "",
        placa: row.placa || "",
        marca: row.marca || "",
        modelo: row.modelo || "",
        ano: row.ano || "",
        tipo: "",
        categoria: "",
        valor_fipe: row.valor_fipe || 0,
        status: row.status_veiculo || "ativo",
        codigo_situacao: row.status_veiculo === "ativo" ? "1" : row.status_veiculo === "inadimplente" ? "2" : row.status_veiculo === "cancelado" ? "3" : "4",
        data_contrato: row.data_contrato || "",
        produtos,
      });
    }

    const associados = Object.values(associadoMap);
    const totalVeiculos = cached.length;

    return {
      success: true,
      total_veiculos_buscados: totalVeiculos,
      total_veiculos_com_rastreador: cached.filter(r => r.tem_rastreador).length,
      total_associados: associados.length,
      associados,
    };
  }

  // Cache empty - fetch from API (will also populate cache)
  const data = await invokeHinova("listar_veiculos_rastreador");
  return {
    success: data.success ?? false,
    total_veiculos_buscados: data.total_veiculos_buscados ?? 0,
    total_veiculos_com_rastreador: data.total_veiculos_com_rastreador ?? 0,
    total_associados: data.total_associados ?? 0,
    associados: data.associados ?? [],
  };
}

/** Busca produtos vinculados a um veículo específico */
export async function buscarProdutosVeiculo(codigoOuPlaca: string) {
  return invokeHinova("buscar_produtos_veiculo", { codigo_veiculo: codigoOuPlaca });
}

/** Sincronizar = força refresh do cache via API */
export async function sincronizarAssociados(): Promise<SyncResult> {
  const data = await invokeHinova("listar_veiculos_rastreador");
  return {
    success: data.success ?? false,
    total_veiculos_buscados: data.total_veiculos_buscados ?? 0,
    total_veiculos_com_rastreador: data.total_veiculos_com_rastreador ?? 0,
    total_associados: data.total_associados ?? 0,
    associados: data.associados ?? [],
  };
}
