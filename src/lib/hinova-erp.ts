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
 * Busca todos os associados que possuem produto RASTREADOR vinculado ao veículo.
 * Retorna associados com seus veículos, separados por status (ativo/inativo).
 */
export async function buscarAssociadosComRastreador(): Promise<SyncResult> {
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

/** Sincronizar = mesma coisa que buscar, mas força refresh */
export async function sincronizarAssociados(): Promise<SyncResult> {
  return buscarAssociadosComRastreador("1");
}
