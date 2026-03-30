import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { associado_id, placa, imei, tecnico_id, tipo = "instalacao", data_agendada, valor, company_id } = await req.json();
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    // Registrar instalação
    const { data: instalacao, error } = await supabase.from("instalacoes").insert([{
      associado_id, placa, imei, tecnico_id, tipo,
      status: "agendado", data_agendada, valor, company_id
    }]).select().single();
    if (error) throw error;
    
    // Atualizar estoque — marcar IMEI como instalado
    if (imei) {
      await supabase.from("estoque").update({ situacao: "instalado", associado_placa: placa }).eq("imei", imei);
    }
    
    // Notificar GIA (histórico de manutenção)
    try {
      const SERVICE_KEY = Deno.env.get("GIA_SERVICE_KEY") || "";
      if (SERVICE_KEY) {
        await fetch("https://ecaduzwautlpzpvjognr.supabase.co/functions/v1/gia-evento-registrar", {
          method: "POST",
          headers: { "Authorization": `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ associado_id, tipo: "rastreador_instalado", descricao: `IMEI: ${imei}`, placa, origem: "tracksystem", company_id })
        });
      }
    } catch {}
    
    return new Response(JSON.stringify({ success: true, servico_id: instalacao.id, status: "agendado" }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
