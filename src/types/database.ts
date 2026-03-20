// Database types matching Supabase schema
export interface DbCliente {
  id: string;
  nome: string;
  razao_social: string;
  tipo: "associacao" | "empresa";
  cnpj: string;
  email: string;
  telefone: string;
  responsavel: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  veiculos_ativos: number;
  status: "ativo" | "inativo";
  status_acesso: "pendente" | "credenciais_enviadas" | "ativo";
  cpf_associado: string;
  email_associado: string;
  filial: string;
  tipo_servico: string;
  created_at: string;
}

export interface DbHistoricoContato {
  id: string;
  cliente_id: string;
  data: string;
  tipo: string;
  descricao: string;
}

export interface DbEquipamento {
  id: string;
  tipo: "rastreador" | "sensor" | "camera" | "bloqueador" | "acessorio" | "sim";
  modelo: string;
  marca: string;
  serial: string;
  imei: string | null;
  sim_card: string | null;
  iccid: string | null;
  custo: number;
  preco: number;
  quantidade: number;
  status: "disponivel" | "instalado" | "manutencao" | "defeito";
  localizacao: string;
  cliente_id: string | null;
}

export interface DbMovimentacao {
  id: string;
  equipamento_id: string;
  data: string;
  tipo: string;
  descricao: string;
}

export interface DbComodato {
  id: string;
  equipamento_id: string;
  destino_tipo: "tecnico" | "filial";
  destino_nome: string;
  quantidade: number;
  data_envio: string;
  codigo_rastreio: string;
  status: "enviado" | "recebido" | "devolvido";
}

export interface DbPedido {
  id: string;
  codigo: string;
  cliente_id: string | null;
  cliente_nome: string;
  valor_total: number;
  status: "pendente" | "configurando" | "enviado" | "entregue";
  data_pedido: string;
  codigo_rastreio: string;
  observacao: string;
}

export interface DbPedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string;
  nome: string;
  quantidade: number;
  valor_unitario: number;
}

export interface DbParcela {
  id: string;
  pedido_id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: "pago" | "pendente" | "atrasado";
}

export interface DbLinhaSIM {
  id: string;
  iccid: string;
  operadora: string;
  numero: string;
  fornecedor: string;
  status: "online" | "offline";
  empresa_id: string | null;
  empresa_nome: string;
  veiculo: string;
  ultima_conexao: string;
}

export interface DbTarefa {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "urgente" | "alta" | "media" | "baixa";
  responsavel: string;
  status: "pendente" | "em_andamento" | "concluida";
  data_criacao: string;
  data_limite: string;
}

export interface DbTecnico {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  especialidade: string;
  regiao_atuacao: string;
  status_ativo: "ativo" | "inativo";
  valor_servico: number;
  periodo_pagamento: "quinzenal" | "mensal";
  chave_pix: string;
  banco: string;
  avaliacao: number;
  instalacoes_mes: number;
  equipamentos_em_estoque: number;
  saldo_aberto: number;
  status: "disponivel" | "em_servico" | "indisponivel";
  tipo_tecnico: "avulso" | "parceiro" | "proprio";
  valor_instalacao: number;
  adicional_km: number;
  prazo_pagamento: string;
}

export interface DbTecnicoEstoque {
  id: string;
  tecnico_id: string;
  item: string;
  quantidade: number;
}

export interface DbServico {
  id: string;
  codigo: string;
  tecnico_id: string | null;
  tecnico_nome: string;
  cliente_nome: string;
  veiculo: string;
  tipo: "instalacao" | "manutencao" | "remocao" | "troca";
  endereco: string;
  cidade: string;
  estado: string;
  data: string;
  horario: string;
  status: "agendado" | "aceito" | "em_deslocamento" | "em_execucao" | "concluido" | "cancelado";
  valor_servico: number;
}

export interface DbManutencao {
  id: string;
  codigo: string;
  veiculo: string;
  placa: string;
  cliente_nome: string;
  problema: "offline" | "falha_gps" | "sem_sinal" | "bateria_baixa" | "violacao";
  descricao: string;
  prioridade: "critica" | "alta" | "media";
  tecnico_designado: string;
  status: "aberto" | "designado" | "em_atendimento" | "resolvido";
  data_abertura: string;
}

export interface DbFinanceiro {
  id: string;
  codigo: string;
  tecnico_id: string | null;
  tecnico_nome: string;
  periodo: string;
  total_servicos: number;
  valor_total: number;
  descontos: number;
  valor_final: number;
  status: "aberto" | "fechado" | "pago";
  nota_fiscal: string;
  data_pagamento: string;
}

export interface DbFinanceiroServico {
  id: string;
  financeiro_id: string;
  data: string;
  descricao: string;
  valor: number;
}

export interface DbInstalacao {
  id: string;
  codigo: string;
  placa: string;
  imei: string;
  chip: string;
  filial: string;
  tecnico_id: string | null;
  tecnico_nome: string;
  status: "aguardando" | "em_andamento" | "concluida" | "problema";
  data: string;
  localizacao_confirmacao: string;
}

export interface DbControleKM {
  id: string;
  tecnico_id: string | null;
  tecnico_nome: string;
  endereco_instalacao: string;
  horario: string;
  data: string;
  km_calculado: number;
}

export interface DbFechamentoTecnico {
  id: string;
  codigo: string;
  tecnico_id: string | null;
  tecnico_nome: string;
  tipo_tecnico: "avulso" | "parceiro" | "proprio";
  periodo: string;
  data_inicio: string;
  data_fim: string;
  total_instalacoes: number;
  valor_instalacoes: number;
  km_total: number;
  valor_km: number;
  valor_total: number;
  regra_fiscal: "recibo" | "nota_fiscal";
  status: "pendente" | "enviado_financeiro" | "pago";
}

export interface DbFechamentoInstalacao {
  id: string;
  fechamento_id: string;
  data: string;
  placa: string;
  valor: number;
}

export interface DbChamadoSuporte {
  id: string;
  codigo: string;
  origem: "cobranca" | "comercial" | "tecnico" | "cliente";
  tipo: "instalacao_urgente" | "retirada" | "manutencao" | "atualizacao_equipamento" | "suporte_app";
  descricao: string;
  cliente_nome: string;
  prioridade: "normal" | "urgente";
  status: "aberto" | "em_atendimento" | "resolvido";
  responsavel: string;
  data_criacao: string;
}

export interface DbAgendamento {
  id: string;
  codigo: string;
  tipo: "instalacao" | "manutencao" | "retirada";
  placa: string;
  associado: string;
  endereco: string;
  endereco_instalacao: string;
  cidade: string;
  tecnico_id: string | null;
  tecnico_nome: string;
  data: string;
  horario: string;
  status: "agendado" | "realizado" | "sem_retorno";
  tentativas: number;
  rastreador_serial: string;
  status_envio_rastreador: "nao_enviado" | "enviado" | "entregue";
}

export interface DbDespacho {
  id: string;
  codigo: string;
  rastreador_modelo: string;
  serial: string;
  imei: string;
  destinatario: string;
  endereco_destino: string;
  cidade_destino: string;
  codigo_rastreio: string;
  data_envio: string;
  status_entrega: "preparando" | "postado" | "em_transito" | "entregue" | "devolvido";
  unidade_destino: string;
  observacoes: string;
}

export interface DbControleUnidade {
  id: string;
  codigo: string;
  unidade: string;
  responsavel: string;
  cidade: string;
  estado: string;
  acesso_plataforma: "ativo" | "pendente" | "bloqueado";
  total_rastreadores: number;
  total_chips: number;
  valor_mensal: number;
}

export interface DbUnidadeRastreador {
  id: string;
  unidade_id: string;
  serial: string;
  modelo: string;
  status: "enviado" | "instalado" | "estoque";
}

export interface DbUnidadeChip {
  id: string;
  unidade_id: string;
  iccid: string;
  operadora: string;
  status: "ativo" | "inativo";
}

export interface DbConfiguracaoDispositivo {
  id: string;
  serial: string;
  modelo: string;
  imei: string;
  firmware: string;
  apn: string;
  ip: string;
  porta: string;
  intervalo_transmissao: number;
  checklist_concluido: boolean;
  status: "pendente" | "configurado" | "testado";
  responsavel_config: string;
  data_config: string;
  observacoes: string;
}

export interface DbConfigChecklist {
  id: string;
  config_id: string;
  item: string;
  feito: boolean;
}

export interface DbEscalonamento {
  id: string;
  codigo: string;
  tecnico_id: string | null;
  tecnico_nome: string;
  demanda: string;
  cliente_nome: string;
  motivo: string;
  data_abertura: string;
  status: "pendente" | "em_analise" | "resolvido";
  responsavel_gestor: string;
  resolucao: string;
}
