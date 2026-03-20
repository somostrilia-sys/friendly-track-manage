-- ============================================
-- SEED DATA
-- Run this AFTER 001_create_tables.sql
-- ============================================

-- CLIENTES
INSERT INTO public.clientes (id, nome, razao_social, tipo, cnpj, email, telefone, responsavel, endereco, cidade, estado, cep, veiculos_ativos, status, status_acesso, cpf_associado, email_associado, filial) VALUES
('c1000001-0000-0000-0000-000000000001', 'Transportadora Rápida Ltda', 'Transportadora Rápida Ltda ME', 'empresa', '12.345.678/0001-90', 'contato@rapida.com.br', '(11) 98765-4321', 'João Martins', 'Rua das Palmeiras, 450 - Vila Mariana', 'São Paulo', 'SP', '04012-000', 45, 'ativo', 'ativo', '123.456.789-00', 'joao@rapida.com.br', 'São Paulo'),
('c1000001-0000-0000-0000-000000000002', 'Associação Caminhoneiros do Sul', 'Associação dos Caminhoneiros do Sul do Brasil', 'associacao', '23.456.789/0001-01', 'contato@acamsul.org.br', '(51) 99876-5432', 'Maria Souza', 'Av. Ipiranga, 6800', 'Porto Alegre', 'RS', '90610-000', 120, 'ativo', 'ativo', '234.567.890-11', 'maria@acamsul.org.br', 'Porto Alegre'),
('c1000001-0000-0000-0000-000000000003', 'LogBrasil Transportes', 'LogBrasil Transportes e Logística Ltda', 'empresa', '34.567.890/0001-12', 'adm@logbrasil.com.br', '(21) 97654-3210', 'Carlos Silva', 'Av. Brasil, 1200 - Centro', 'Rio de Janeiro', 'RJ', '20040-020', 32, 'ativo', 'credenciais_enviadas', '345.678.901-22', 'carlos@logbrasil.com.br', 'Rio de Janeiro'),
('c1000001-0000-0000-0000-000000000004', 'Frota Segura ME', 'Frota Segura Serviços ME', 'empresa', '45.678.901/0001-23', 'frota@segura.com.br', '(41) 98765-1234', 'Pedro Alves', 'Rua XV de Novembro, 300', 'Curitiba', 'PR', '80020-310', 18, 'inativo', 'pendente', '456.789.012-33', 'pedro@segura.com.br', 'Curitiba'),
('c1000001-0000-0000-0000-000000000005', 'Associação Rastreamento Nacional', 'Associação Brasileira de Rastreamento Nacional', 'associacao', '56.789.012/0001-34', 'arn@rastreamento.org.br', '(31) 99988-7766', 'Ana Beatriz', 'Av. Afonso Pena, 1500', 'Belo Horizonte', 'MG', '30130-004', 200, 'ativo', 'ativo', '567.890.123-44', 'ana@rastreamento.org.br', 'Belo Horizonte'),
('c1000001-0000-0000-0000-000000000006', 'TransNorte Logística', 'TransNorte Logística e Transportes Ltda', 'empresa', '67.890.123/0001-45', 'ops@transnorte.com.br', '(92) 98877-6655', 'Roberto Lima', 'Distrito Industrial, Rua A, 100', 'Manaus', 'AM', '69075-000', 15, 'ativo', 'credenciais_enviadas', '678.901.234-55', 'roberto@transnorte.com.br', 'Manaus');

-- HISTORICO CONTATOS
INSERT INTO public.historico_contatos (cliente_id, data, tipo, descricao) VALUES
('c1000001-0000-0000-0000-000000000001', '2024-03-01', 'Telefone', 'Solicitou instalação de 10 rastreadores'),
('c1000001-0000-0000-0000-000000000001', '2024-02-15', 'Email', 'Enviadas credenciais de acesso'),
('c1000001-0000-0000-0000-000000000002', '2024-02-28', 'WhatsApp', 'Pedido de 25 rastreadores GV300'),
('c1000001-0000-0000-0000-000000000003', '2024-03-05', 'Email', 'Credenciais enviadas, aguardando ativação'),
('c1000001-0000-0000-0000-000000000005', '2024-03-02', 'Reunião', 'Apresentação de novos produtos');

-- TECNICOS
INSERT INTO public.tecnicos (id, nome, cpf, telefone, email, cidade, estado, especialidade, valor_servico, periodo_pagamento, chave_pix, banco, avaliacao, instalacoes_mes, equipamentos_em_estoque, saldo_aberto, status, tipo_tecnico, valor_instalacao, adicional_km, prazo_pagamento) VALUES
('t1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', '123.456.789-00', '(11) 98765-0001', 'marcos@tecnico.com', 'São Paulo', 'SP', 'Rastreadores e bloqueadores', 200, 'quinzenal', 'marcos@tecnico.com', 'Nubank', 4.8, 22, 8, 3200, 'disponivel', 'parceiro', 200, 1.5, '5 dias úteis'),
('t1000001-0000-0000-0000-000000000002', 'Fernando Silva', '234.567.890-11', '(21) 98765-0002', 'fernando@tecnico.com', 'Rio de Janeiro', 'RJ', 'Câmeras e sensores', 150, 'mensal', '23456789011', 'Bradesco', 4.5, 15, 5, 2100, 'em_servico', 'avulso', 150, 1.2, '2 dias úteis'),
('t1000001-0000-0000-0000-000000000003', 'Ricardo Santos', '345.678.901-22', '(41) 98765-0003', 'ricardo@tecnico.com', 'Curitiba', 'PR', 'Rastreadores', 200, 'quinzenal', '(41) 98765-0003', 'Itaú', 4.9, 28, 12, 4500, 'disponivel', 'proprio', 200, 0, 'Conforme contrato'),
('t1000001-0000-0000-0000-000000000004', 'André Costa', '456.789.012-33', '(31) 98765-0004', 'andre@tecnico.com', 'Belo Horizonte', 'MG', 'Instalação completa', 180, 'mensal', 'andre@tecnico.com', 'Inter', 4.3, 10, 3, 1800, 'indisponivel', 'parceiro', 180, 1.3, '5 dias úteis'),
('t1000001-0000-0000-0000-000000000005', 'Lucas Pereira', '567.890.123-44', '(51) 98765-0005', 'lucas@tecnico.com', 'Porto Alegre', 'RS', 'Rastreadores e câmeras', 190, 'quinzenal', '56789012344', 'Banco do Brasil', 4.7, 19, 7, 2800, 'disponivel', 'avulso', 190, 1.4, '2 dias úteis'),
('t1000001-0000-0000-0000-000000000006', 'Thiago Almeida', '678.901.234-55', '(85) 98765-0006', 'thiago@tecnico.com', 'Fortaleza', 'CE', 'Bloqueadores', 170, 'mensal', 'thiago@tecnico.com', 'Caixa', 4.1, 8, 4, 1200, 'em_servico', 'proprio', 170, 0, 'Conforme contrato');

-- TECNICO_ESTOQUE
INSERT INTO public.tecnico_estoque (tecnico_id, item, quantidade) VALUES
('t1000001-0000-0000-0000-000000000001', 'Rastreador ST4955', 5),
('t1000001-0000-0000-0000-000000000001', 'Bloqueador BK500', 3),
('t1000001-0000-0000-0000-000000000002', 'Câmera CV100', 3),
('t1000001-0000-0000-0000-000000000002', 'Sensor RS200', 2),
('t1000001-0000-0000-0000-000000000003', 'Rastreador GV300', 8),
('t1000001-0000-0000-0000-000000000003', 'Rastreador ST4955', 4),
('t1000001-0000-0000-0000-000000000004', 'Rastreador ST4955', 3),
('t1000001-0000-0000-0000-000000000005', 'Rastreador GV300', 4),
('t1000001-0000-0000-0000-000000000005', 'Câmera CV100', 3),
('t1000001-0000-0000-0000-000000000006', 'Bloqueador BK500', 4);

-- EQUIPAMENTOS
INSERT INTO public.equipamentos (id, tipo, modelo, marca, serial, imei, custo, preco, quantidade, status, localizacao, cliente_id) VALUES
('e1000001-0000-0000-0000-000000000001', 'rastreador', 'ST4955', 'Suntech', 'ST-2024-001', '351756051523999', 180, 350, 15, 'disponivel', 'Estoque Central SP', NULL),
('e1000001-0000-0000-0000-000000000002', 'rastreador', 'GV300', 'Queclink', 'QC-2024-002', '351756051524001', 220, 420, 8, 'instalado', 'Veículo ABC-1234', 'c1000001-0000-0000-0000-000000000001'),
('e1000001-0000-0000-0000-000000000003', 'sensor', 'Sensor Porta RS200', 'GenericSens', 'SP-2024-003', NULL, 45, 90, 30, 'disponivel', 'Estoque Central SP', NULL),
('e1000001-0000-0000-0000-000000000004', 'camera', 'Câmera Veicular CV100', 'HikVision', 'CV-2024-004', '351756051524003', 320, 550, 2, 'manutencao', 'Assistência Técnica', NULL),
('e1000001-0000-0000-0000-000000000005', 'bloqueador', 'BK500', 'BlockTech', 'BK-2024-005', NULL, 80, 160, 20, 'instalado', 'Veículo DEF-5678', 'c1000001-0000-0000-0000-000000000002'),
('e1000001-0000-0000-0000-000000000006', 'rastreador', 'ST4955', 'Suntech', 'ST-2024-006', '351756051524005', 180, 350, 1, 'defeito', 'Estoque Central SP', NULL),
('e1000001-0000-0000-0000-000000000007', 'rastreador', 'GV300', 'Queclink', 'QC-2024-007', '351756051524007', 220, 420, 5, 'disponivel', 'Estoque Filial RJ', NULL),
('e1000001-0000-0000-0000-000000000008', 'sensor', 'Sensor Temperatura TM300', 'GenericSens', 'TM-2024-008', NULL, 55, 110, 12, 'disponivel', 'Estoque Central SP', NULL);

-- LINHAS_SIM
INSERT INTO public.linhas_sim (iccid, operadora, numero, status, empresa_id, empresa_nome, veiculo, ultima_conexao) VALUES
('8955031234567890001', 'Vivo', '(11) 99001-0001', 'online', 'c1000001-0000-0000-0000-000000000001', 'Transportadora Rápida Ltda', 'ABC-1234', 'Agora'),
('8955031234567890002', 'Claro', '(11) 99001-0002', 'online', 'c1000001-0000-0000-0000-000000000001', 'Transportadora Rápida Ltda', 'DEF-5678', '2 min'),
('8955031234567890003', 'Tim', '(51) 99001-0003', 'offline', 'c1000001-0000-0000-0000-000000000002', 'Associação Caminhoneiros do Sul', 'GHI-9012', '3h atrás'),
('8955031234567890004', 'Vivo', '(21) 99001-0004', 'online', 'c1000001-0000-0000-0000-000000000003', 'LogBrasil Transportes', 'JKL-3456', 'Agora'),
('8955031234567890005', 'Claro', '(41) 99001-0005', 'offline', 'c1000001-0000-0000-0000-000000000004', 'Frota Segura ME', 'MNO-7890', '5 dias'),
('8955031234567890006', 'Tim', '(31) 99001-0006', 'online', 'c1000001-0000-0000-0000-000000000005', 'Associação Rastreamento Nacional', 'PQR-1122', '1 min');

-- TAREFAS
INSERT INTO public.tarefas (titulo, descricao, prioridade, responsavel, status, data_criacao, data_limite) VALUES
('Instalar rastreadores lote PED-002', 'Configurar e instalar 25 rastreadores GV300 para Associação Caminhoneiros do Sul', 'urgente', 'Carlos Mendes', 'em_andamento', '2024-03-01', '2024-03-10'),
('Resolver falha de comunicação GHI-9012', 'Veículo GHI-9012 sem comunicação há 3h, verificar SIM e equipamento', 'alta', 'Ana Paula', 'pendente', '2024-03-05', '2024-03-06'),
('Atualizar firmware lote ST4955', 'Atualizar firmware de 15 rastreadores Suntech na base central', 'media', 'Roberto Lima', 'pendente', '2024-03-03', '2024-03-15'),
('Enviar relatório mensal clientes', 'Gerar e enviar relatórios mensais de rastreamento para todos os clientes ativos', 'alta', 'Juliana Costa', 'pendente', '2024-03-01', '2024-03-05'),
('Organizar estoque filial RJ', 'Inventariar e reorganizar estoque da filial Rio de Janeiro', 'baixa', 'Pedro Santos', 'concluida', '2024-02-20', '2024-03-01');

-- SERVICOS
INSERT INTO public.servicos (codigo, tecnico_id, tecnico_nome, cliente_nome, veiculo, tipo, endereco, cidade, estado, data, horario, status, valor_servico) VALUES
('OS-001', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', 'Transportadora Rápida Ltda', 'Scania R450 - DEF-5678', 'instalacao', 'Rua das Palmeiras, 450 - Vila Mariana', 'São Paulo', 'SP', '2024-03-08', '09:00', 'aceito', 180),
('OS-002', 't1000001-0000-0000-0000-000000000002', 'Fernando Silva', 'LogBrasil Transportes', 'Mercedes Actros - GHI-9012', 'manutencao', 'Av. Brasil, 1200 - Centro', 'Rio de Janeiro', 'RJ', '2024-03-08', '14:00', 'em_deslocamento', 120),
('OS-003', 't1000001-0000-0000-0000-000000000003', 'Ricardo Santos', 'Frota Segura ME', 'Volvo FH 540 - ABC-1234', 'instalacao', 'Rod. BR-116, km 98', 'Curitiba', 'PR', '2024-03-09', '08:00', 'agendado', 200),
('OS-004', 't1000001-0000-0000-0000-000000000005', 'Lucas Pereira', 'Associação Caminhoneiros do Sul', 'DAF XF - JKL-3456', 'troca', 'Av. Ipiranga, 6800', 'Porto Alegre', 'RS', '2024-03-07', '10:00', 'concluido', 150),
('OS-005', 't1000001-0000-0000-0000-000000000006', 'Thiago Almeida', 'TransNorte Logística', 'Iveco S-Way - MNO-7890', 'instalacao', 'Distrito Industrial, Rua A, 100', 'Fortaleza', 'CE', '2024-03-10', '09:00', 'agendado', 220);

-- MANUTENCOES
INSERT INTO public.manutencoes (codigo, veiculo, placa, cliente_nome, problema, descricao, prioridade, tecnico_designado, status, data_abertura) VALUES
('MAN-001', 'Mercedes Atego', 'VWX-5566', 'LogBrasil Transportes', 'offline', 'Veículo sem comunicação há 12h', 'critica', 'Fernando Silva', 'designado', '2024-03-05'),
('MAN-002', 'Iveco S-Way', 'MNO-7890', 'TransNorte Logística', 'falha_gps', 'GPS retornando coordenadas incorretas', 'alta', '', 'aberto', '2024-03-06'),
('MAN-003', 'Volvo FM 370', 'PQR-1122', 'Transportadora Rápida Ltda', 'bateria_baixa', 'Bateria do rastreador com nível crítico', 'media', 'Marcos Oliveira', 'em_atendimento', '2024-03-04'),
('MAN-004', 'Scania G410', 'STU-3344', 'Associação Caminhoneiros do Sul', 'violacao', 'Alerta de violação do equipamento disparado', 'critica', '', 'aberto', '2024-03-06');

-- FINANCEIRO
INSERT INTO public.financeiro (codigo, tecnico_id, tecnico_nome, periodo, total_servicos, valor_total, descontos, valor_final, status, data_pagamento) VALUES
('FIN-001', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', '01-15/03/2024', 11, 2200, 0, 2200, 'aberto', NULL),
('FIN-002', 't1000001-0000-0000-0000-000000000002', 'Fernando Silva', '01-15/03/2024', 7, 1050, 50, 1000, 'aberto', NULL),
('FIN-003', 't1000001-0000-0000-0000-000000000003', 'Ricardo Santos', '16-28/02/2024', 14, 2800, 0, 2800, 'pago', '2024-03-02'),
('FIN-004', 't1000001-0000-0000-0000-000000000005', 'Lucas Pereira', '16-28/02/2024', 9, 1620, 120, 1500, 'pago', '2024-03-02'),
('FIN-005', 't1000001-0000-0000-0000-000000000006', 'Thiago Almeida', '01-15/03/2024', 4, 880, 0, 880, 'aberto', NULL);

-- INSTALACOES
INSERT INTO public.instalacoes (codigo, placa, imei, chip, filial, tecnico_id, tecnico_nome, status, data, localizacao_confirmacao) VALUES
('INST-001', 'ABC-1234', '351756051523999', '8955031234567890001', 'São Paulo', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', 'concluida', '2024-03-08', '-23.5505, -46.6333'),
('INST-002', 'DEF-5678', '351756051524001', '8955031234567890002', 'São Paulo', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', 'em_andamento', '2024-03-08', ''),
('INST-003', 'GHI-9012', '351756051524003', '8955031234567890003', 'Rio de Janeiro', 't1000001-0000-0000-0000-000000000002', 'Fernando Silva', 'aguardando', '2024-03-09', ''),
('INST-004', 'JKL-3456', '351756051524005', '8955031234567890004', 'Curitiba', 't1000001-0000-0000-0000-000000000003', 'Ricardo Santos', 'problema', '2024-03-07', ''),
('INST-005', 'MNO-7890', '351756051524007', '8955031234567890005', 'Porto Alegre', 't1000001-0000-0000-0000-000000000005', 'Lucas Pereira', 'concluida', '2024-03-07', '-30.0346, -51.2177'),
('INST-006', 'PQR-1122', '351756051524009', '8955031234567890006', 'Belo Horizonte', 't1000001-0000-0000-0000-000000000004', 'André Costa', 'aguardando', '2024-03-10', '');

-- CONTROLE_KM
INSERT INTO public.controle_km (tecnico_id, tecnico_nome, endereco_instalacao, horario, data, km_calculado) VALUES
('t1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', 'Rua das Palmeiras, 450 - Vila Mariana, SP', '09:00', '2024-03-08', 15),
('t1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', 'Av. Paulista, 1500, SP', '11:30', '2024-03-08', 22),
('t1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', 'Rua Augusta, 800, SP', '14:00', '2024-03-08', 8),
('t1000001-0000-0000-0000-000000000002', 'Fernando Silva', 'Av. Brasil, 1200 - Centro, RJ', '09:30', '2024-03-08', 25),
('t1000001-0000-0000-0000-000000000002', 'Fernando Silva', 'Rua do Catete, 300, RJ', '13:00', '2024-03-08', 12),
('t1000001-0000-0000-0000-000000000003', 'Ricardo Santos', 'Rod. BR-116, km 98, PR', '08:00', '2024-03-09', 45),
('t1000001-0000-0000-0000-000000000005', 'Lucas Pereira', 'Av. Ipiranga, 6800, RS', '10:00', '2024-03-07', 18);

-- FECHAMENTO_TECNICOS
INSERT INTO public.fechamento_tecnicos (id, codigo, tecnico_id, tecnico_nome, tipo_tecnico, periodo, data_inicio, data_fim, total_instalacoes, valor_instalacoes, km_total, valor_km, valor_total, regra_fiscal, status) VALUES
('f1000001-0000-0000-0000-000000000001', 'FECH-001', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', 'parceiro', '01-15/03/2024', '2024-03-01', '2024-03-15', 3, 600, 45, 67.5, 667.5, 'recibo', 'pendente'),
('f1000001-0000-0000-0000-000000000002', 'FECH-002', 't1000001-0000-0000-0000-000000000002', 'Fernando Silva', 'avulso', '01-15/03/2024', '2024-03-01', '2024-03-15', 2, 300, 37, 44.4, 344.4, 'recibo', 'enviado_financeiro'),
('f1000001-0000-0000-0000-000000000003', 'FECH-003', 't1000001-0000-0000-0000-000000000003', 'Ricardo Santos', 'proprio', '16-28/02/2024', '2024-02-16', '2024-02-28', 4, 800, 120, 0, 800, 'recibo', 'pago'),
('f1000001-0000-0000-0000-000000000004', 'FECH-004', 't1000001-0000-0000-0000-000000000005', 'Lucas Pereira', 'avulso', '01-15/03/2024', '2024-03-01', '2024-03-15', 1, 190, 18, 25.2, 215.2, 'recibo', 'pendente');

-- FECHAMENTO_INSTALACOES
INSERT INTO public.fechamento_instalacoes (fechamento_id, data, placa, valor) VALUES
('f1000001-0000-0000-0000-000000000001', '2024-03-02', 'ABC-1234', 200),
('f1000001-0000-0000-0000-000000000001', '2024-03-04', 'DEF-5678', 200),
('f1000001-0000-0000-0000-000000000001', '2024-03-08', 'GHI-9012', 200),
('f1000001-0000-0000-0000-000000000002', '2024-03-01', 'JKL-3456', 150),
('f1000001-0000-0000-0000-000000000002', '2024-03-03', 'MNO-7890', 150),
('f1000001-0000-0000-0000-000000000003', '2024-02-16', 'PQR-1122', 200),
('f1000001-0000-0000-0000-000000000003', '2024-02-18', 'STU-3344', 200),
('f1000001-0000-0000-0000-000000000003', '2024-02-20', 'VWX-5566', 200),
('f1000001-0000-0000-0000-000000000003', '2024-02-22', 'YZA-7788', 200),
('f1000001-0000-0000-0000-000000000004', '2024-03-07', 'BCD-2233', 190);

-- CHAMADOS_SUPORTE
INSERT INTO public.chamados_suporte (codigo, origem, tipo, descricao, cliente_nome, prioridade, status, responsavel, data_criacao) VALUES
('SUP-001', 'cliente', 'instalacao_urgente', 'Cliente precisa de instalação urgente em 3 veículos novos', 'Transportadora Rápida Ltda', 'urgente', 'aberto', 'Ana Paula', '2024-03-08'),
('SUP-002', 'tecnico', 'manutencao', 'Rastreador com falha no GPS, precisa de troca', 'LogBrasil Transportes', 'normal', 'em_atendimento', 'Carlos Mendes', '2024-03-07'),
('SUP-003', 'comercial', 'suporte_app', 'Cliente não consegue acessar o aplicativo de rastreamento', 'Frota Segura ME', 'normal', 'aberto', 'Juliana Costa', '2024-03-08'),
('SUP-004', 'cobranca', 'retirada', 'Retirada de equipamento por inadimplência', 'TransNorte Logística', 'urgente', 'em_atendimento', 'Roberto Lima', '2024-03-06'),
('SUP-005', 'cliente', 'atualizacao_equipamento', 'Troca de rastreador antigo por modelo novo', 'Associação Rastreamento Nacional', 'normal', 'resolvido', 'Pedro Santos', '2024-03-05');

-- AGENDAMENTOS
INSERT INTO public.agendamentos (codigo, tipo, placa, associado, endereco, endereco_instalacao, cidade, tecnico_id, tecnico_nome, data, horario, status, tentativas, rastreador_serial, status_envio_rastreador) VALUES
('AG-001', 'instalacao', 'ABC-1234', 'Joao Martins', 'Rua das Palmeiras, 450', 'Rua das Palmeiras, 450 - Vila Mariana, SP', 'Sao Paulo - SP', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', '2024-03-08', '09:00', 'realizado', 1, 'J16-2024-001', 'entregue'),
('AG-002', 'manutencao', 'DEF-5678', 'Maria Souza', 'Av. Ipiranga, 6800', 'Av. Ipiranga, 6800 - Centro, RS', 'Porto Alegre - RS', 't1000001-0000-0000-0000-000000000005', 'Lucas Pereira', '2024-03-09', '10:00', 'agendado', 0, 'QC-2024-015', 'enviado'),
('AG-003', 'instalacao', 'GHI-9012', 'Carlos Silva', 'Av. Brasil, 1200', 'Av. Brasil, 1200 - Centro, RJ', 'Rio de Janeiro - RJ', 't1000001-0000-0000-0000-000000000002', 'Fernando Silva', '2024-03-09', '14:00', 'agendado', 0, 'J16-2024-002', 'enviado'),
('AG-004', 'retirada', 'JKL-3456', 'Pedro Alves', 'Rua XV de Novembro, 300', 'Rua XV de Novembro, 300 - Centro, PR', 'Curitiba - PR', 't1000001-0000-0000-0000-000000000003', 'Ricardo Santos', '2024-03-07', '08:00', 'sem_retorno', 3, '', 'nao_enviado'),
('AG-005', 'instalacao', 'MNO-7890', 'Ana Beatriz', 'Av. Afonso Pena, 1500', 'Av. Afonso Pena, 1500 - Centro, MG', 'Belo Horizonte - MG', 't1000001-0000-0000-0000-000000000004', 'Andre Costa', '2024-03-10', '09:00', 'agendado', 0, 'J16-2024-003', 'entregue'),
('AG-006', 'manutencao', 'PQR-1122', 'Roberto Lima', 'Distrito Industrial, Rua A', 'Distrito Industrial, Rua A, 100 - Manaus, AM', 'Manaus - AM', 't1000001-0000-0000-0000-000000000006', 'Thiago Almeida', '2024-03-06', '11:00', 'sem_retorno', 4, '', 'nao_enviado'),
('AG-007', 'instalacao', 'STU-3344', 'Fernanda Costa', 'Rua Augusta, 800', 'Rua Augusta, 800 - Consolacao, SP', 'Sao Paulo - SP', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', '2024-03-11', '10:00', 'agendado', 0, 'ST-2024-010', 'nao_enviado'),
('AG-008', 'instalacao', 'VWX-5566', 'Lucas Ferreira', 'Av. Paulista, 1500', 'Av. Paulista, 1500 - Bela Vista, SP', 'Sao Paulo - SP', 't1000001-0000-0000-0000-000000000001', 'Marcos Oliveira', '2024-03-08', '14:00', 'realizado', 1, 'J16-2024-001', 'entregue');

-- DESPACHOS
INSERT INTO public.despachos (codigo, rastreador_modelo, serial, imei, destinatario, endereco_destino, cidade_destino, codigo_rastreio, data_envio, status_entrega, unidade_destino, observacoes) VALUES
('DSP-001', 'J16 4G', 'J16-2024-001', '351756051530001', 'Marcos Oliveira', 'Rua das Palmeiras, 450', 'Sao Paulo - SP', 'BR123456789SP', '2024-03-05', 'entregue', 'Objetivo Auto Truck SP', 'Entregue em maos'),
('DSP-002', 'J16 4G', 'J16-2024-002', '351756051530002', 'Fernando Silva', 'Av. Brasil, 1200', 'Rio de Janeiro - RJ', 'BR987654321RJ', '2024-03-06', 'em_transito', 'Objetivo Auto Truck RJ', ''),
('DSP-003', 'ST4955', 'ST-2024-010', '351756051530003', 'Ricardo Santos', 'Rod. BR-116, km 98', 'Curitiba - PR', 'BR111222333PR', '2024-03-07', 'postado', 'Objetivo Auto Truck PR', 'Urgente'),
('DSP-004', 'GV300', 'QC-2024-015', '351756051530004', 'Lucas Pereira', 'Av. Ipiranga, 6800', 'Porto Alegre - RS', 'BR444555666RS', '2024-03-08', 'preparando', 'Objetivo Auto Truck RS', ''),
('DSP-005', 'J16 4G', 'J16-2024-003', '351756051530005', 'Andre Costa', 'Av. Afonso Pena, 1500', 'Belo Horizonte - MG', 'BR777888999MG', '2024-03-04', 'entregue', 'Objetivo Auto Truck MG', 'Recebido pelo responsavel');

-- CONTROLE_UNIDADES
INSERT INTO public.controle_unidades (id, codigo, unidade, responsavel, cidade, estado, acesso_plataforma, total_rastreadores, total_chips, valor_mensal) VALUES
('u1000001-0000-0000-0000-000000000001', 'UN-001', 'Objetivo Auto Truck SP', 'Joao Martins', 'Sao Paulo', 'SP', 'ativo', 2, 2, 298),
('u1000001-0000-0000-0000-000000000002', 'UN-002', 'Objetivo Auto Truck RJ', 'Carlos Silva', 'Rio de Janeiro', 'RJ', 'ativo', 1, 1, 149),
('u1000001-0000-0000-0000-000000000003', 'UN-003', 'Objetivo Auto Truck PR', 'Roberto Lima', 'Curitiba', 'PR', 'pendente', 2, 1, 248),
('u1000001-0000-0000-0000-000000000004', 'UN-004', 'Objetivo Auto Truck RS', 'Maria Souza', 'Porto Alegre', 'RS', 'ativo', 1, 1, 149);

-- UNIDADE_RASTREADORES
INSERT INTO public.unidade_rastreadores (unidade_id, serial, modelo, status) VALUES
('u1000001-0000-0000-0000-000000000001', 'J16-2024-001', 'J16 4G', 'instalado'),
('u1000001-0000-0000-0000-000000000001', 'ST-2024-006', 'ST4955', 'estoque'),
('u1000001-0000-0000-0000-000000000002', 'J16-2024-002', 'J16 4G', 'enviado'),
('u1000001-0000-0000-0000-000000000003', 'QC-2024-007', 'GV300', 'instalado'),
('u1000001-0000-0000-0000-000000000003', 'ST-2024-010', 'ST4955', 'enviado'),
('u1000001-0000-0000-0000-000000000004', 'QC-2024-015', 'GV300', 'estoque');

-- UNIDADE_CHIPS
INSERT INTO public.unidade_chips (unidade_id, iccid, operadora, status) VALUES
('u1000001-0000-0000-0000-000000000001', '8955031234567890001', 'Vivo', 'ativo'),
('u1000001-0000-0000-0000-000000000001', '8955031234567890002', 'Claro', 'ativo'),
('u1000001-0000-0000-0000-000000000002', '8955031234567890004', 'Vivo', 'ativo'),
('u1000001-0000-0000-0000-000000000003', '8955031234567890003', 'Tim', 'inativo'),
('u1000001-0000-0000-0000-000000000004', '8955031234567890005', 'Claro', 'ativo');

-- CONFIGURACAO_DISPOSITIVOS
INSERT INTO public.configuracao_dispositivos (id, serial, modelo, imei, firmware, apn, ip, porta, intervalo_transmissao, checklist_concluido, status, responsavel_config, data_config, observacoes) VALUES
('d1000001-0000-0000-0000-000000000001', 'J16-2024-001', 'J16 4G', '351756051530001', 'v3.2.1', 'trackit.iot', '45.189.10.50', '5001', 60, true, 'testado', 'Carlos Mendes', '2024-03-04', 'Pronto para envio'),
('d1000001-0000-0000-0000-000000000002', 'J16-2024-002', 'J16 4G', '351756051530002', 'v3.2.1', 'trackit.iot', '45.189.10.50', '5001', 60, true, 'configurado', 'Carlos Mendes', '2024-03-05', 'Falta teste GPS'),
('d1000001-0000-0000-0000-000000000003', 'ST-2024-010', 'ST4955', '351756051530003', 'v2.8.4', 'trackit.iot', '45.189.10.50', '5002', 90, false, 'pendente', 'Ana Paula', '2024-03-07', 'Aguardando APN'),
('d1000001-0000-0000-0000-000000000004', 'QC-2024-015', 'GV300', '351756051530004', 'v4.1.0', 'trackit.iot', '45.189.10.50', '5003', 120, false, 'pendente', '', '', 'Nao iniciado');

-- CONFIG_CHECKLIST
INSERT INTO public.config_checklist (config_id, item, feito) VALUES
('d1000001-0000-0000-0000-000000000001', 'Firmware atualizado', true),
('d1000001-0000-0000-0000-000000000001', 'APN configurado', true),
('d1000001-0000-0000-0000-000000000001', 'IP/Porta definidos', true),
('d1000001-0000-0000-0000-000000000001', 'Teste de comunicacao', true),
('d1000001-0000-0000-0000-000000000001', 'Teste de GPS', true),
('d1000001-0000-0000-0000-000000000002', 'Firmware atualizado', true),
('d1000001-0000-0000-0000-000000000002', 'APN configurado', true),
('d1000001-0000-0000-0000-000000000002', 'IP/Porta definidos', true),
('d1000001-0000-0000-0000-000000000002', 'Teste de comunicacao', true),
('d1000001-0000-0000-0000-000000000002', 'Teste de GPS', false),
('d1000001-0000-0000-0000-000000000003', 'Firmware atualizado', true),
('d1000001-0000-0000-0000-000000000003', 'APN configurado', false),
('d1000001-0000-0000-0000-000000000003', 'IP/Porta definidos', false),
('d1000001-0000-0000-0000-000000000003', 'Teste de comunicacao', false),
('d1000001-0000-0000-0000-000000000003', 'Teste de GPS', false),
('d1000001-0000-0000-0000-000000000004', 'Firmware atualizado', false),
('d1000001-0000-0000-0000-000000000004', 'APN configurado', false),
('d1000001-0000-0000-0000-000000000004', 'IP/Porta definidos', false),
('d1000001-0000-0000-0000-000000000004', 'Teste de comunicacao', false),
('d1000001-0000-0000-0000-000000000004', 'Teste de GPS', false);

-- ESCALONAMENTOS
INSERT INTO public.escalonamentos (codigo, tecnico_id, tecnico_nome, demanda, cliente_nome, motivo, data_abertura, status, responsavel_gestor, resolucao) VALUES
('ESC-001', 't1000001-0000-0000-0000-000000000002', 'Fernando Silva', 'Rastreador nao transmite apos instalacao', 'LogBrasil Transportes', 'Problema de hardware - tecnico nao consegue resolver em campo', '2024-03-06', 'pendente', 'Matheus Souza', ''),
('ESC-002', 't1000001-0000-0000-0000-000000000004', 'Andre Costa', 'Cliente recusa instalacao no ponto indicado', 'Frota Segura ME', 'Divergencia com o cliente sobre local de instalacao', '2024-03-05', 'em_analise', 'Matheus Souza', 'Contato com cliente para alinhar'),
('ESC-003', 't1000001-0000-0000-0000-000000000006', 'Thiago Almeida', 'Equipamento com defeito de fabrica', 'TransNorte Logistica', 'Rastreador apresentou falha na placa apos desembalar', '2024-03-07', 'resolvido', 'Matheus Souza', 'Enviado novo equipamento via Sedex');

-- PEDIDOS
INSERT INTO public.pedidos (id, codigo, cliente_id, cliente_nome, valor_total, status, data_pedido) VALUES
('p1000001-0000-0000-0000-000000000001', 'PED-001', 'c1000001-0000-0000-0000-000000000001', 'Transportadora Rápida Ltda', 3500, 'pendente', '2024-03-01'),
('p1000001-0000-0000-0000-000000000002', 'PED-002', 'c1000001-0000-0000-0000-000000000002', 'Associação Caminhoneiros do Sul', 14500, 'configurando', '2024-02-28'),
('p1000001-0000-0000-0000-000000000003', 'PED-003', 'c1000001-0000-0000-0000-000000000003', 'LogBrasil Transportes', 2750, 'enviado', '2024-02-25'),
('p1000001-0000-0000-0000-000000000004', 'PED-004', 'c1000001-0000-0000-0000-000000000005', 'Associação Rastreamento Nacional', 17500, 'entregue', '2024-02-15'),
('p1000001-0000-0000-0000-000000000005', 'PED-005', 'c1000001-0000-0000-0000-000000000006', 'TransNorte Logística', 3520, 'pendente', '2024-03-05');

-- PEDIDO_ITENS
INSERT INTO public.pedido_itens (pedido_id, produto_id, nome, quantidade, valor_unitario) VALUES
('p1000001-0000-0000-0000-000000000001', '1', 'Rastreador ST4955', 10, 350),
('p1000001-0000-0000-0000-000000000002', '2', 'Rastreador GV300', 25, 420),
('p1000001-0000-0000-0000-000000000002', '5', 'Bloqueador BK500', 25, 160),
('p1000001-0000-0000-0000-000000000003', '4', 'Câmera CV100', 5, 550),
('p1000001-0000-0000-0000-000000000004', '1', 'Rastreador ST4955', 50, 350),
('p1000001-0000-0000-0000-000000000005', '1', 'Rastreador ST4955', 8, 350),
('p1000001-0000-0000-0000-000000000005', '3', 'Sensor Porta RS200', 8, 90);

-- PARCELAS
INSERT INTO public.parcelas (pedido_id, numero, valor, vencimento, status) VALUES
('p1000001-0000-0000-0000-000000000001', 1, 1167, '2024-04-01', 'pendente'),
('p1000001-0000-0000-0000-000000000001', 2, 1167, '2024-05-01', 'pendente'),
('p1000001-0000-0000-0000-000000000001', 3, 1166, '2024-06-01', 'pendente'),
('p1000001-0000-0000-0000-000000000003', 1, 1375, '2024-03-25', 'pago'),
('p1000001-0000-0000-0000-000000000003', 2, 1375, '2024-04-25', 'pendente');

-- FINANCEIRO_SERVICOS
INSERT INTO public.financeiro_servicos (financeiro_id, data, descricao, valor)
SELECT f.id, s.data, s.descricao, s.valor
FROM (VALUES
  ('FIN-001', '2024-03-02', 'Instalação rastreador - Veículo ABC-1234', 200),
  ('FIN-001', '2024-03-04', 'Instalação bloqueador - Veículo DEF-5678', 200),
  ('FIN-001', '2024-03-05', 'Manutenção - Veículo GHI-9012', 150),
  ('FIN-002', '2024-03-01', 'Instalação câmera - Veículo JKL-3456', 150),
  ('FIN-002', '2024-03-03', 'Troca sensor - Veículo MNO-7890', 120),
  ('FIN-003', '2024-02-16', 'Instalação rastreador - Veículo PQR-1122', 200),
  ('FIN-003', '2024-02-18', 'Instalação rastreador - Veículo STU-3344', 200),
  ('FIN-004', '2024-02-17', 'Troca rastreador - Veículo VWX-5566', 190),
  ('FIN-005', '2024-03-02', 'Instalação bloqueador - Veículo YZA-7788', 170)
) AS s(codigo, data, descricao, valor)
JOIN public.financeiro f ON f.codigo = s.codigo;
