import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { situacao, tecnico_id } = await req.json().catch(() => ({}));
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    
    let q = supabase.from("estoque").select("*").order("created_at", { ascending: false }).limit(200);
    if (situacao) q = q.eq("situacao", situacao);
    if (tecnico_id) q = q.eq("tecnico_id", tecnico_id);
    
    const { data, count } = await q;
    
    const resumo = {
      total: count || data?.length || 0,
      disponivel: (data || []).filter((e: any) => e.situacao === "disponivel").length,
      instalado: (data || []).filter((e: any) => e.situacao === "instalado").length,
      manutencao: (data || []).filter((e: any) => e.situacao === "manutencao").length,
    };
    
    return new Response(JSON.stringify({ success: true, resumo, estoque: data || [] }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch(e: any) {
    return new Response(JSON.stringify({ success: false, error: e.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
