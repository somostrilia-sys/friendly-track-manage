/**
 * Arqia API Integration
 * Portal: https://portal.api.ip101.cloud/
 *
 * IMPORTANT: In production, all API calls should go through Supabase Edge Functions
 * to protect credentials. This client is for reference and structure.
 *
 * Capabilities:
 * - Query SIM line status by ICCID
 * - Send SMS commands to devices
 * - Activate/deactivate lines
 * - Get line consumption data
 */

const ARQIA_PORTAL_URL = "https://portal.api.ip101.cloud";

interface ArqiaConfig {
  email: string;
  senha: string;
  authToken?: string;
}

const defaultConfig: ArqiaConfig = {
  email: "alexander@holdingwalk.com.br",
  senha: "Arqia123#",
};

// Authentication
export async function arqiaLogin(config: ArqiaConfig = defaultConfig): Promise<string> {
  const response = await fetch(`${ARQIA_PORTAL_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.senha }),
  });

  if (!response.ok) throw new Error("Arqia auth failed");
  const data = await response.json();
  return data.token || data.access_token;
}

// Query line status by ICCID
export async function consultarLinha(iccid: string, token: string) {
  const response = await fetch(`${ARQIA_PORTAL_URL}/api/lines/${iccid}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Arqia line query failed: ${response.status}`);
  return response.json();
}

// Send SMS command to device
export async function enviarComandoSMS(iccid: string, comando: string, token: string) {
  const response = await fetch(`${ARQIA_PORTAL_URL}/api/sms/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ iccid, message: comando }),
  });
  if (!response.ok) throw new Error(`Arqia SMS failed: ${response.status}`);
  return response.json();
}

// Activate line
export async function ativarLinha(iccid: string, token: string) {
  const response = await fetch(`${ARQIA_PORTAL_URL}/api/lines/${iccid}/activate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Arqia activate failed: ${response.status}`);
  return response.json();
}

// Deactivate line
export async function desativarLinha(iccid: string, token: string) {
  const response = await fetch(`${ARQIA_PORTAL_URL}/api/lines/${iccid}/deactivate`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Arqia deactivate failed: ${response.status}`);
  return response.json();
}

// List all lines
export async function listarLinhas(token: string) {
  const response = await fetch(`${ARQIA_PORTAL_URL}/api/lines`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Arqia list lines failed: ${response.status}`);
  return response.json();
}

export { defaultConfig };
