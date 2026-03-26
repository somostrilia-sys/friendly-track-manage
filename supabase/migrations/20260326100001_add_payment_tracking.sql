ALTER TABLE faturamento_b2b
  ADD COLUMN IF NOT EXISTS valor_pago numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boleto_url text,
  ADD COLUMN IF NOT EXISTS comprovantes jsonb DEFAULT '[]'::jsonb;

INSERT INTO storage.buckets (id, name, public)
VALUES ('faturamento-docs', 'faturamento-docs', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload faturamento docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'faturamento-docs');

CREATE POLICY "Authenticated users can read faturamento docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'faturamento-docs');

CREATE POLICY "Authenticated users can delete faturamento docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'faturamento-docs');

CREATE POLICY "Public read access for faturamento docs"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'faturamento-docs');
