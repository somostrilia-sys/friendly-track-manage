/**
 * Hinova ERP API Integration
 * Docs: https://api.hinova.com.br/api/sga/v2/doc-sincronismo/
 *
 * All calls are proxied through the Supabase Edge Function `hinova-sync`
 * to avoid CORS issues and keep credentials server-side.
 */

import { supabase } from "@/integrations/supabase/client";

export interface AssociadoERP {
  id: string;
  numero: string;
  nome: string;
  cpf_cnpj: string;
  modeloVeiculo: string;
  placa: string;
  produto: string;
  status_instalacao: "instalado" | "pendente" | "agendado";
}

async function invokeHinova(action: string, params: Record<string, string> = {}) {
  const { data, error } = await supabase.functions.invoke("hinova-sync", {
    body: { action, params },
  });

  if (error) {
    console.error("Erro ao invocar hinova-sync:", error);
    throw new Error(error.message || "Erro ao comunicar com o ERP");
  }

  if (data?.error) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `Erro ERP: ${data.status || "desconhecido"}`
    );
  }

  return data;
}

/**
 * Fetch associates that have a tracker product.
 * Optionally filter by date range.
 */
export async function buscarAssociadosComRastreador(
  dataInicio?: string,
  dataFim?: string
): Promise<AssociadoERP[]> {
  const params: Record<string, string> = {};
  if (dataInicio) params.data_inicio = dataInicio;
  if (dataFim) params.data_fim = dataFim;

  const data = await invokeHinova("listar_associados", params);

  // Normalize the API response into our internal format.
  // The Hinova API may return data in different structures;
  // we handle the most common patterns here.
  const registros: any[] = Array.isArray(data)
    ? data
    : data?.associados ?? data?.registros ?? data?.data ?? [];

  return registros.map((r: any, idx: number) => ({
    id: String(r.id || r.codigo || r.numero_associado || idx),
    numero: String(r.numero_associado || r.codigo || r.id || ""),
    nome: r.nome || r.razao_social || r.nome_fantasia || "",
    cpf_cnpj: r.cpf || r.cnpj || r.cpf_cnpj || "",
    modeloVeiculo: r.modelo_veiculo || r.veiculo?.modelo || "",
    placa: r.placa || r.veiculo?.placa || "",
    produto: r.produto || r.nome_produto || r.plano || "",
    status_instalacao: (r.status_instalacao as AssociadoERP["status_instalacao"]) || "pendente",
  }));
}

/** Fetch a single associate by ID */
export async function buscarAssociadoPorId(id: string) {
  return invokeHinova("buscar_associado", { id });
}

/** Fetch vehicles for an associate */
export async function buscarVeiculosAssociado(associadoId: string) {
  return invokeHinova("buscar_veiculos", { associado_id: associadoId });
}

/** Fetch products / services */
export async function buscarProdutos() {
  return invokeHinova("buscar_produtos");
}

/** Trigger full sync of associates */
export async function sincronizarAssociados(): Promise<AssociadoERP[]> {
  const data = await invokeHinova("sincronizar_associados");

  const registros: any[] = Array.isArray(data)
    ? data
    : data?.associados ?? data?.registros ?? data?.data ?? [];

  return registros.map((r: any, idx: number) => ({
    id: String(r.id || r.codigo || r.numero_associado || idx),
    numero: String(r.numero_associado || r.codigo || r.id || ""),
    nome: r.nome || r.razao_social || r.nome_fantasia || "",
    cpf_cnpj: r.cpf || r.cnpj || r.cpf_cnpj || "",
    modeloVeiculo: r.modelo_veiculo || r.veiculo?.modelo || "",
    placa: r.placa || r.veiculo?.placa || "",
    produto: r.produto || r.nome_produto || r.plano || "",
    status_instalacao: (r.status_instalacao as AssociadoERP["status_instalacao"]) || "pendente",
  }));
}
