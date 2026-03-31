/**
 * Hinova ERP API Integration
 * Docs: https://api.hinova.com.br/api/sga/v2/doc-sincronismo/
 *
 * IMPORTANT: In production, API calls should go through Supabase Edge Functions
 * to avoid exposing credentials in the frontend. This client is for reference.
 */

const HINOVA_BASE_URL = "https://api.hinova.com.br/api/sga/v2";

interface HinovaConfig {
  token: string;
  usuario: string;
  senha: string;
}

// Default config - in production, store in Supabase vault
const defaultConfig: HinovaConfig = {
  token: "583bc4740e73a5510513f04b10a1810cfe4be1f86cfb4ce34beb10a4439e640291d66d1891d4fbe55da175d5e667b8d3681c4bca180fdffaa0257dd88140670ed4c4ec6569e60add5f0c238c251eb59668cad90d6a2061ea5293d13562af3c86",
  usuario: "Matheus",
  senha: "Crm2026",
};

async function hinovaFetch(endpoint: string, method: string = "GET", body?: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${defaultConfig.token}`,
  };

  const response = await fetch(`${HINOVA_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`Hinova API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Fetch associates with tracker product
export async function buscarAssociadosComRastreador(dataInicio?: string, dataFim?: string) {
  const params = new URLSearchParams();
  if (dataInicio) params.append("data_inicio", dataInicio);
  if (dataFim) params.append("data_fim", dataFim);

  try {
    const data = await hinovaFetch(`/associados?${params.toString()}`);
    return data;
  } catch (error) {
    console.error("Erro ao buscar associados:", error);
    throw error;
  }
}

// Fetch associate details by ID
export async function buscarAssociadoPorId(id: string) {
  return hinovaFetch(`/associados/${id}`);
}

// Fetch vehicles for an associate
export async function buscarVeiculosAssociado(associadoId: string) {
  return hinovaFetch(`/associados/${associadoId}/veiculos`);
}

// Fetch products/services
export async function buscarProdutos() {
  return hinovaFetch("/produtos");
}

// Sync all associates
export async function sincronizarAssociados() {
  return hinovaFetch("/sincronismo/associados", "POST");
}

export { defaultConfig, hinovaFetch };
