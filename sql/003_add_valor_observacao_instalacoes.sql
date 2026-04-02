-- Adiciona colunas valor e observacao na tabela instalacoes
-- para refletir os dados da planilha de instalações dos técnicos
ALTER TABLE public.instalacoes
  ADD COLUMN IF NOT EXISTS valor numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacao text DEFAULT '';
