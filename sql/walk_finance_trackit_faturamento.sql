-- ============================================================================
-- Walk Finance: tabela trackit_faturamento
-- Executar no projeto Walk Finance (xytnibnqztjaixemlepb)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trackit_faturamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trackit_id TEXT UNIQUE,
  empresa TEXT,
  mes_referencia TEXT,
  data_fechamento TEXT,
  data_vencimento TEXT,
  total_geral NUMERIC DEFAULT 0,
  situacao TEXT DEFAULT 'aberto',
  valor_pago NUMERIC DEFAULT 0,
  data_pagamento TEXT,
  observacao TEXT,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trackit_faturamento_trackit_id ON trackit_faturamento (trackit_id);
CREATE INDEX IF NOT EXISTS idx_trackit_faturamento_empresa ON trackit_faturamento (empresa);
CREATE INDEX IF NOT EXISTS idx_trackit_faturamento_situacao ON trackit_faturamento (situacao);
CREATE INDEX IF NOT EXISTS idx_trackit_faturamento_mes ON trackit_faturamento (mes_referencia);

-- RLS
ALTER TABLE trackit_faturamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_auth_trackit ON trackit_faturamento
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY allow_all_anon_trackit ON trackit_faturamento
  FOR ALL TO anon USING (true) WITH CHECK (true);
