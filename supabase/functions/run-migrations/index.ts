import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  
  // Check what tables exist
  const { data: tableList, error: tableListError } = await supabase.rpc('exec_sql', {
    sql: `SELECT tablename, schemaname FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  });

  const tables = [
    `CREATE TABLE IF NOT EXISTS tecnicos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nome TEXT NOT NULL, telefone TEXT, cpf TEXT, cidade TEXT, estado TEXT, ativo BOOLEAN DEFAULT TRUE, especialidades JSONB DEFAULT '[]', created_at TIMESTAMPTZ DEFAULT NOW())`,
    `ALTER TABLE tecnicos ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tecnicos' AND policyname='allow_all') THEN CREATE POLICY allow_all ON tecnicos FOR ALL USING (true); END IF; END $$`,
    `CREATE TABLE IF NOT EXISTS instalacoes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), associado_id UUID, placa TEXT, imei TEXT NOT NULL, tecnico_id UUID REFERENCES tecnicos(id), tipo TEXT DEFAULT 'instalacao', status TEXT DEFAULT 'agendado', data_agendada DATE, data_realizada DATE, observacoes TEXT, valor DECIMAL(10,2), company_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`,
    `CREATE INDEX IF NOT EXISTS idx_instalacoes_imei ON instalacoes(imei)`,
    `CREATE INDEX IF NOT EXISTS idx_instalacoes_placa ON instalacoes(placa)`,
    `ALTER TABLE instalacoes ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='instalacoes' AND policyname='allow_all') THEN CREATE POLICY allow_all ON instalacoes FOR ALL USING (true); END IF; END $$`,
    `CREATE TABLE IF NOT EXISTS estoque (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), modelo TEXT NOT NULL, imei TEXT UNIQUE, chip TEXT, situacao TEXT DEFAULT 'disponivel', tecnico_id UUID REFERENCES tecnicos(id), associado_placa TEXT, valor_compra DECIMAL(10,2), fornecedor TEXT, data_entrada DATE DEFAULT CURRENT_DATE, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `ALTER TABLE estoque ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='estoque' AND policyname='allow_all') THEN CREATE POLICY allow_all ON estoque FOR ALL USING (true); END IF; END $$`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.estoque TO anon`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.estoque TO authenticated`,
    `CREATE TABLE IF NOT EXISTS manutencoes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), imei TEXT, placa TEXT, tecnico_id UUID REFERENCES tecnicos(id), tipo TEXT DEFAULT 'manutencao', descricao TEXT, status TEXT DEFAULT 'pendente', data_abertura TIMESTAMPTZ DEFAULT NOW(), data_resolucao TIMESTAMPTZ, valor DECIMAL(10,2), created_at TIMESTAMPTZ DEFAULT NOW())`,
    `ALTER TABLE manutencoes ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='manutencoes' AND policyname='allow_all') THEN CREATE POLICY allow_all ON manutencoes FOR ALL USING (true); END IF; END $$`,
    `CREATE TABLE IF NOT EXISTS linhas_chip (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), numero TEXT UNIQUE, operadora TEXT, imei_vinculado TEXT, status TEXT DEFAULT 'disponivel', vencimento DATE, valor_mensalidade DECIMAL(8,2), created_at TIMESTAMPTZ DEFAULT NOW())`,
    `ALTER TABLE linhas_chip ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='linhas_chip' AND policyname='allow_all') THEN CREATE POLICY allow_all ON linhas_chip FOR ALL USING (true); END IF; END $$`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.linhas_chip TO anon`,
    `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.linhas_chip TO authenticated`,
  ];
  
  const results = [];
  for (const sql of tables) {
    try {
      await supabase.rpc('exec_sql', { sql });
      results.push({ ok: true, sql: sql.slice(0, 60) });
    } catch(e: any) {
      results.push({ ok: false, sql: sql.slice(0, 60), error: e.message });
    }
  }

  // Verify tables exist
  const verifications: Record<string, string> = {};
  for (const t of ['tecnicos', 'instalacoes', 'estoque', 'manutencoes', 'linhas_chip']) {
    try {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      verifications[t] = error ? `ERROR: ${error.message}` : `OK`;
    } catch(e: any) {
      verifications[t] = `EXCEPTION: ${e.message}`;
    }
  }

  return new Response(JSON.stringify({ done: true, tableList, results, verifications }), { headers: { ...cors, "Content-Type": "application/json" } });
});
