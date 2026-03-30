-- ============================================
-- TRACK SYSTEM - Tabelas de rastreamento
-- ============================================

-- estoque (dispositivos rastreadores)
CREATE TABLE IF NOT EXISTS public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo TEXT NOT NULL,
  imei TEXT UNIQUE,
  chip TEXT,
  situacao TEXT DEFAULT 'disponivel',
  tecnico_id UUID REFERENCES public.tecnicos(id),
  associado_placa TEXT,
  valor_compra DECIMAL(10,2),
  fornecedor TEXT,
  data_entrada DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='estoque' AND policyname='Authenticated full access') THEN
    CREATE POLICY "Authenticated full access" ON public.estoque FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- linhas_chip (chips/SIMs vinculados a rastreadores)
CREATE TABLE IF NOT EXISTS public.linhas_chip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT UNIQUE,
  operadora TEXT,
  imei_vinculado TEXT,
  status TEXT DEFAULT 'disponivel',
  vencimento DATE,
  valor_mensalidade DECIMAL(8,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.linhas_chip ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='linhas_chip' AND policyname='Authenticated full access') THEN
    CREATE POLICY "Authenticated full access" ON public.linhas_chip FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
