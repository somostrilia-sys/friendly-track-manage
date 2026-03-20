-- ============================================
-- TRACKIT HUB - COMPLETE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  razao_social text DEFAULT '',
  tipo text NOT NULL DEFAULT 'empresa' CHECK (tipo IN ('empresa', 'associacao')),
  cnpj text DEFAULT '',
  email text DEFAULT '',
  telefone text DEFAULT '',
  responsavel text DEFAULT '',
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  estado text DEFAULT '',
  cep text DEFAULT '',
  veiculos_ativos integer DEFAULT 0,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  status_acesso text NOT NULL DEFAULT 'pendente' CHECK (status_acesso IN ('pendente', 'credenciais_enviadas', 'ativo')),
  cpf_associado text DEFAULT '',
  email_associado text DEFAULT '',
  filial text DEFAULT '',
  tipo_servico text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 2. HISTORICO CONTATOS (relation to clientes)
CREATE TABLE IF NOT EXISTS public.historico_contatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
  data text NOT NULL,
  tipo text DEFAULT '',
  descricao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 3. EQUIPAMENTOS (Estoque)
CREATE TABLE IF NOT EXISTS public.equipamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'rastreador' CHECK (tipo IN ('rastreador', 'sensor', 'camera', 'bloqueador', 'acessorio', 'sim')),
  modelo text NOT NULL DEFAULT '',
  marca text DEFAULT '',
  serial text DEFAULT '',
  imei text DEFAULT '',
  sim_card text DEFAULT '',
  iccid text DEFAULT '',
  custo numeric DEFAULT 0,
  preco numeric DEFAULT 0,
  quantidade integer DEFAULT 0,
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'instalado', 'manutencao', 'defeito')),
  localizacao text DEFAULT '',
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 4. MOVIMENTACOES (relation to equipamentos)
CREATE TABLE IF NOT EXISTS public.movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE NOT NULL,
  data text NOT NULL,
  tipo text DEFAULT '',
  descricao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 5. COMODATOS (relation to equipamentos)
CREATE TABLE IF NOT EXISTS public.comodatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipamento_id uuid REFERENCES public.equipamentos(id) ON DELETE CASCADE NOT NULL,
  destino_tipo text DEFAULT 'tecnico' CHECK (destino_tipo IN ('tecnico', 'filial')),
  destino_nome text DEFAULT '',
  quantidade integer DEFAULT 0,
  data_envio text DEFAULT '',
  codigo_rastreio text DEFAULT '',
  status text DEFAULT 'enviado' CHECK (status IN ('enviado', 'recebido', 'devolvido')),
  created_at timestamptz DEFAULT now()
);

-- 6. PEDIDOS
CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome text DEFAULT '',
  valor_total numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'configurando', 'enviado', 'entregue')),
  data_pedido text DEFAULT '',
  codigo_rastreio text DEFAULT '',
  observacao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 7. PEDIDO_ITENS
CREATE TABLE IF NOT EXISTS public.pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  produto_id text DEFAULT '',
  nome text DEFAULT '',
  quantidade integer DEFAULT 0,
  valor_unitario numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 8. PARCELAS
CREATE TABLE IF NOT EXISTS public.parcelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
  numero integer DEFAULT 0,
  valor numeric DEFAULT 0,
  vencimento text DEFAULT '',
  status text DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente', 'atrasado')),
  created_at timestamptz DEFAULT now()
);

-- 9. LINHAS_SIM
CREATE TABLE IF NOT EXISTS public.linhas_sim (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iccid text DEFAULT '',
  operadora text DEFAULT '',
  numero text DEFAULT '',
  fornecedor text DEFAULT '',
  status text NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline')),
  empresa_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  empresa_nome text DEFAULT '',
  veiculo text DEFAULT '',
  ultima_conexao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 10. TAREFAS
CREATE TABLE IF NOT EXISTS public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  descricao text DEFAULT '',
  prioridade text DEFAULT 'media' CHECK (prioridade IN ('urgente', 'alta', 'media', 'baixa')),
  responsavel text DEFAULT '',
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida')),
  data_criacao text DEFAULT '',
  data_limite text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 11. TECNICOS
CREATE TABLE IF NOT EXISTS public.tecnicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text DEFAULT '',
  telefone text DEFAULT '',
  email text DEFAULT '',
  cidade text DEFAULT '',
  estado text DEFAULT '',
  especialidade text DEFAULT '',
  regiao_atuacao text DEFAULT '',
  status_ativo text DEFAULT 'ativo' CHECK (status_ativo IN ('ativo', 'inativo')),
  valor_servico numeric DEFAULT 0,
  periodo_pagamento text DEFAULT 'quinzenal' CHECK (periodo_pagamento IN ('quinzenal', 'mensal')),
  chave_pix text DEFAULT '',
  banco text DEFAULT '',
  avaliacao numeric DEFAULT 0,
  instalacoes_mes integer DEFAULT 0,
  equipamentos_em_estoque integer DEFAULT 0,
  saldo_aberto numeric DEFAULT 0,
  status text DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_servico', 'indisponivel')),
  tipo_tecnico text DEFAULT 'avulso' CHECK (tipo_tecnico IN ('avulso', 'parceiro', 'proprio')),
  valor_instalacao numeric DEFAULT 0,
  adicional_km numeric DEFAULT 0,
  prazo_pagamento text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 12. TECNICO_ESTOQUE (items in technician's possession)
CREATE TABLE IF NOT EXISTS public.tecnico_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE CASCADE NOT NULL,
  item text DEFAULT '',
  quantidade integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 13. SERVICOS (Ordens de Servico)
CREATE TABLE IF NOT EXISTS public.servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  tecnico_nome text DEFAULT '',
  cliente_nome text DEFAULT '',
  veiculo text DEFAULT '',
  tipo text DEFAULT 'instalacao' CHECK (tipo IN ('instalacao', 'manutencao', 'remocao', 'troca')),
  endereco text DEFAULT '',
  cidade text DEFAULT '',
  estado text DEFAULT '',
  data text DEFAULT '',
  horario text DEFAULT '',
  status text DEFAULT 'agendado' CHECK (status IN ('agendado', 'aceito', 'em_deslocamento', 'em_execucao', 'concluido', 'cancelado')),
  valor_servico numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 14. MANUTENCOES
CREATE TABLE IF NOT EXISTS public.manutencoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  veiculo text DEFAULT '',
  placa text DEFAULT '',
  cliente_nome text DEFAULT '',
  problema text DEFAULT 'offline' CHECK (problema IN ('offline', 'falha_gps', 'sem_sinal', 'bateria_baixa', 'violacao')),
  descricao text DEFAULT '',
  prioridade text DEFAULT 'media' CHECK (prioridade IN ('critica', 'alta', 'media')),
  tecnico_designado text DEFAULT '',
  status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'designado', 'em_atendimento', 'resolvido')),
  data_abertura text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 15. FINANCEIRO (Fechamento antigo)
CREATE TABLE IF NOT EXISTS public.financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  tecnico_nome text DEFAULT '',
  periodo text DEFAULT '',
  total_servicos integer DEFAULT 0,
  valor_total numeric DEFAULT 0,
  descontos numeric DEFAULT 0,
  valor_final numeric DEFAULT 0,
  status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'fechado', 'pago')),
  nota_fiscal text DEFAULT '',
  data_pagamento text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 16. FINANCEIRO_SERVICOS (line items)
CREATE TABLE IF NOT EXISTS public.financeiro_servicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  financeiro_id uuid REFERENCES public.financeiro(id) ON DELETE CASCADE NOT NULL,
  data text DEFAULT '',
  descricao text DEFAULT '',
  valor numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 17. INSTALACOES
CREATE TABLE IF NOT EXISTS public.instalacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  placa text DEFAULT '',
  imei text DEFAULT '',
  chip text DEFAULT '',
  filial text DEFAULT '',
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  tecnico_nome text DEFAULT '',
  status text DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'em_andamento', 'concluida', 'problema')),
  data text DEFAULT '',
  localizacao_confirmacao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 18. CONTROLE_KM
CREATE TABLE IF NOT EXISTS public.controle_km (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  tecnico_nome text DEFAULT '',
  endereco_instalacao text DEFAULT '',
  horario text DEFAULT '',
  data text DEFAULT '',
  km_calculado numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 19. FECHAMENTO_TECNICOS
CREATE TABLE IF NOT EXISTS public.fechamento_tecnicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  tecnico_nome text DEFAULT '',
  tipo_tecnico text DEFAULT 'avulso' CHECK (tipo_tecnico IN ('avulso', 'parceiro', 'proprio')),
  periodo text DEFAULT '',
  data_inicio text DEFAULT '',
  data_fim text DEFAULT '',
  total_instalacoes integer DEFAULT 0,
  valor_instalacoes numeric DEFAULT 0,
  km_total numeric DEFAULT 0,
  valor_km numeric DEFAULT 0,
  valor_total numeric DEFAULT 0,
  regra_fiscal text DEFAULT 'recibo' CHECK (regra_fiscal IN ('recibo', 'nota_fiscal')),
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado_financeiro', 'pago')),
  created_at timestamptz DEFAULT now()
);

-- 20. FECHAMENTO_INSTALACOES (line items)
CREATE TABLE IF NOT EXISTS public.fechamento_instalacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fechamento_id uuid REFERENCES public.fechamento_tecnicos(id) ON DELETE CASCADE NOT NULL,
  data text DEFAULT '',
  placa text DEFAULT '',
  valor numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 21. CHAMADOS_SUPORTE
CREATE TABLE IF NOT EXISTS public.chamados_suporte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  origem text DEFAULT 'cliente' CHECK (origem IN ('cobranca', 'comercial', 'tecnico', 'cliente')),
  tipo text DEFAULT 'manutencao' CHECK (tipo IN ('instalacao_urgente', 'retirada', 'manutencao', 'atualizacao_equipamento', 'suporte_app')),
  descricao text DEFAULT '',
  cliente_nome text DEFAULT '',
  prioridade text DEFAULT 'normal' CHECK (prioridade IN ('normal', 'urgente')),
  status text DEFAULT 'aberto' CHECK (status IN ('aberto', 'em_atendimento', 'resolvido')),
  responsavel text DEFAULT '',
  data_criacao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 22. AGENDAMENTOS
CREATE TABLE IF NOT EXISTS public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  tipo text DEFAULT 'instalacao' CHECK (tipo IN ('instalacao', 'manutencao', 'retirada')),
  placa text DEFAULT '',
  associado text DEFAULT '',
  endereco text DEFAULT '',
  endereco_instalacao text DEFAULT '',
  cidade text DEFAULT '',
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  tecnico_nome text DEFAULT '',
  data text DEFAULT '',
  horario text DEFAULT '',
  status text DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'sem_retorno')),
  tentativas integer DEFAULT 0,
  rastreador_serial text DEFAULT '',
  status_envio_rastreador text DEFAULT 'nao_enviado' CHECK (status_envio_rastreador IN ('nao_enviado', 'enviado', 'entregue')),
  created_at timestamptz DEFAULT now()
);

-- 23. DESPACHOS (Logistica Rastreadores)
CREATE TABLE IF NOT EXISTS public.despachos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  rastreador_modelo text DEFAULT '',
  serial text DEFAULT '',
  imei text DEFAULT '',
  destinatario text DEFAULT '',
  endereco_destino text DEFAULT '',
  cidade_destino text DEFAULT '',
  codigo_rastreio text DEFAULT '',
  data_envio text DEFAULT '',
  status_entrega text DEFAULT 'preparando' CHECK (status_entrega IN ('preparando', 'postado', 'em_transito', 'entregue', 'devolvido')),
  unidade_destino text DEFAULT '',
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 24. CONTROLE_UNIDADES
CREATE TABLE IF NOT EXISTS public.controle_unidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  unidade text NOT NULL,
  responsavel text DEFAULT '',
  cidade text DEFAULT '',
  estado text DEFAULT '',
  acesso_plataforma text DEFAULT 'ativo' CHECK (acesso_plataforma IN ('ativo', 'pendente', 'bloqueado')),
  total_rastreadores integer DEFAULT 0,
  total_chips integer DEFAULT 0,
  valor_mensal numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 25. UNIDADE_RASTREADORES
CREATE TABLE IF NOT EXISTS public.unidade_rastreadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid REFERENCES public.controle_unidades(id) ON DELETE CASCADE NOT NULL,
  serial text DEFAULT '',
  modelo text DEFAULT '',
  status text DEFAULT 'enviado' CHECK (status IN ('enviado', 'instalado', 'estoque')),
  created_at timestamptz DEFAULT now()
);

-- 26. UNIDADE_CHIPS
CREATE TABLE IF NOT EXISTS public.unidade_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid REFERENCES public.controle_unidades(id) ON DELETE CASCADE NOT NULL,
  iccid text DEFAULT '',
  operadora text DEFAULT '',
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at timestamptz DEFAULT now()
);

-- 27. CONFIGURACAO_DISPOSITIVOS
CREATE TABLE IF NOT EXISTS public.configuracao_dispositivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial text DEFAULT '',
  modelo text DEFAULT '',
  imei text DEFAULT '',
  firmware text DEFAULT '',
  apn text DEFAULT '',
  ip text DEFAULT '',
  porta text DEFAULT '',
  intervalo_transmissao integer DEFAULT 60,
  checklist_concluido boolean DEFAULT false,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'configurado', 'testado')),
  responsavel_config text DEFAULT '',
  data_config text DEFAULT '',
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 28. CONFIG_CHECKLIST
CREATE TABLE IF NOT EXISTS public.config_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid REFERENCES public.configuracao_dispositivos(id) ON DELETE CASCADE NOT NULL,
  item text DEFAULT '',
  feito boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 29. ESCALONAMENTOS
CREATE TABLE IF NOT EXISTS public.escalonamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  tecnico_id uuid REFERENCES public.tecnicos(id) ON DELETE SET NULL,
  tecnico_nome text DEFAULT '',
  demanda text DEFAULT '',
  cliente_nome text DEFAULT '',
  motivo text DEFAULT '',
  data_abertura text DEFAULT '',
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'resolvido')),
  responsavel_gestor text DEFAULT '',
  resolucao text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comodatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linhas_sim ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tecnico_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manutencoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_km ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamento_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechamento_instalacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chamados_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despachos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.controle_unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidade_rastreadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidade_chips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracao_dispositivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalonamentos ENABLE ROW LEVEL SECURITY;

-- Authenticated users can do everything (internal management system)
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'clientes','historico_contatos','equipamentos','movimentacoes','comodatos',
    'pedidos','pedido_itens','parcelas','linhas_sim','tarefas',
    'tecnicos','tecnico_estoque','servicos','manutencoes','financeiro',
    'financeiro_servicos','instalacoes','controle_km','fechamento_tecnicos',
    'fechamento_instalacoes','chamados_suporte','agendamentos','despachos',
    'controle_unidades','unidade_rastreadores','unidade_chips',
    'configuracao_dispositivos','config_checklist','escalonamentos'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "Authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
