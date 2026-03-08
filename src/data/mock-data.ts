// ===== TRACKIT MODULE =====

export interface Cliente {
  id: string;
  nome: string;
  tipo: "associacao" | "empresa";
  cnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  veiculosAtivos: number;
  status: "ativo" | "inativo";
}

export const clientes: Cliente[] = [
  { id: "1", nome: "Transportadora Rápida Ltda", tipo: "empresa", cnpj: "12.345.678/0001-90", email: "contato@rapida.com.br", telefone: "(11) 98765-4321", cidade: "São Paulo", estado: "SP", veiculosAtivos: 45, status: "ativo" },
  { id: "2", nome: "Associação Caminhoneiros do Sul", tipo: "associacao", cnpj: "23.456.789/0001-01", email: "contato@acamsul.org.br", telefone: "(51) 99876-5432", cidade: "Porto Alegre", estado: "RS", veiculosAtivos: 120, status: "ativo" },
  { id: "3", nome: "LogBrasil Transportes", tipo: "empresa", cnpj: "34.567.890/0001-12", email: "adm@logbrasil.com.br", telefone: "(21) 97654-3210", cidade: "Rio de Janeiro", estado: "RJ", veiculosAtivos: 32, status: "ativo" },
  { id: "4", nome: "Frota Segura ME", tipo: "empresa", cnpj: "45.678.901/0001-23", email: "frota@segura.com.br", telefone: "(41) 98765-1234", cidade: "Curitiba", estado: "PR", veiculosAtivos: 18, status: "inativo" },
  { id: "5", nome: "Associação Rastreamento Nacional", tipo: "associacao", cnpj: "56.789.012/0001-34", email: "arn@rastreamento.org.br", telefone: "(31) 99988-7766", cidade: "Belo Horizonte", estado: "MG", veiculosAtivos: 200, status: "ativo" },
  { id: "6", nome: "TransNorte Logística", tipo: "empresa", cnpj: "67.890.123/0001-45", email: "ops@transnorte.com.br", telefone: "(92) 98877-6655", cidade: "Manaus", estado: "AM", veiculosAtivos: 15, status: "ativo" },
];

export interface Equipamento {
  id: string;
  tipo: "rastreador" | "sensor" | "camera" | "bloqueador";
  modelo: string;
  serial: string;
  status: "disponivel" | "instalado" | "manutencao" | "defeito";
  localizacao: string;
  clienteId?: string;
}

export const equipamentos: Equipamento[] = [
  { id: "1", tipo: "rastreador", modelo: "Suntech ST4955", serial: "ST-2024-001", status: "disponivel", localizacao: "Estoque Central SP" },
  { id: "2", tipo: "rastreador", modelo: "Queclink GV300", serial: "QC-2024-002", status: "instalado", localizacao: "Veículo ABC-1234", clienteId: "1" },
  { id: "3", tipo: "sensor", modelo: "Sensor Porta RS200", serial: "SP-2024-003", status: "disponivel", localizacao: "Estoque Central SP" },
  { id: "4", tipo: "camera", modelo: "Câmera Veicular CV100", serial: "CV-2024-004", status: "manutencao", localizacao: "Assistência Técnica" },
  { id: "5", tipo: "bloqueador", modelo: "Bloqueador BK500", serial: "BK-2024-005", status: "instalado", localizacao: "Veículo DEF-5678", clienteId: "2" },
  { id: "6", tipo: "rastreador", modelo: "Suntech ST4955", serial: "ST-2024-006", status: "defeito", localizacao: "Estoque Central SP" },
  { id: "7", tipo: "rastreador", modelo: "Queclink GV300", serial: "QC-2024-007", status: "disponivel", localizacao: "Estoque Filial RJ" },
  { id: "8", tipo: "sensor", modelo: "Sensor Temperatura TM300", serial: "TM-2024-008", status: "disponivel", localizacao: "Estoque Central SP" },
];

export interface Pedido {
  id: string;
  clienteId: string;
  clienteNome: string;
  itens: string;
  quantidade: number;
  valorTotal: number;
  status: "pendente" | "configurando" | "enviado" | "entregue";
  dataPedido: string;
  parcelas: number;
  valorParcela: number;
}

export const pedidos: Pedido[] = [
  { id: "PED-001", clienteId: "1", clienteNome: "Transportadora Rápida Ltda", itens: "10x Rastreador ST4955", quantidade: 10, valorTotal: 4500, status: "pendente", dataPedido: "2024-03-01", parcelas: 3, valorParcela: 1500 },
  { id: "PED-002", clienteId: "2", clienteNome: "Associação Caminhoneiros do Sul", itens: "25x Rastreador GV300 + 25x Bloqueador", quantidade: 50, valorTotal: 18750, status: "configurando", dataPedido: "2024-02-28", parcelas: 6, valorParcela: 3125 },
  { id: "PED-003", clienteId: "3", clienteNome: "LogBrasil Transportes", itens: "5x Câmera CV100", quantidade: 5, valorTotal: 3250, status: "enviado", dataPedido: "2024-02-25", parcelas: 2, valorParcela: 1625 },
  { id: "PED-004", clienteId: "5", clienteNome: "Associação Rastreamento Nacional", itens: "50x Rastreador ST4955", quantidade: 50, valorTotal: 20000, status: "entregue", dataPedido: "2024-02-15", parcelas: 10, valorParcela: 2000 },
  { id: "PED-005", clienteId: "6", clienteNome: "TransNorte Logística", itens: "8x Rastreador + 8x Sensor Porta", quantidade: 16, valorTotal: 7200, status: "pendente", dataPedido: "2024-03-05", parcelas: 4, valorParcela: 1800 },
];

export interface LinhaSIM {
  id: string;
  iccid: string;
  operadora: string;
  numero: string;
  status: "online" | "offline";
  empresaId: string;
  empresaNome: string;
  veiculo: string;
  ultimaConexao: string;
}

export const linhasSIM: LinhaSIM[] = [
  { id: "1", iccid: "8955031234567890001", operadora: "Vivo", numero: "(11) 99001-0001", status: "online", empresaId: "1", empresaNome: "Transportadora Rápida Ltda", veiculo: "ABC-1234", ultimaConexao: "Agora" },
  { id: "2", iccid: "8955031234567890002", operadora: "Claro", numero: "(11) 99001-0002", status: "online", empresaId: "1", empresaNome: "Transportadora Rápida Ltda", veiculo: "DEF-5678", ultimaConexao: "2 min" },
  { id: "3", iccid: "8955031234567890003", operadora: "Tim", numero: "(51) 99001-0003", status: "offline", empresaId: "2", empresaNome: "Associação Caminhoneiros do Sul", veiculo: "GHI-9012", ultimaConexao: "3h atrás" },
  { id: "4", iccid: "8955031234567890004", operadora: "Vivo", numero: "(21) 99001-0004", status: "online", empresaId: "3", empresaNome: "LogBrasil Transportes", veiculo: "JKL-3456", ultimaConexao: "Agora" },
  { id: "5", iccid: "8955031234567890005", operadora: "Claro", numero: "(41) 99001-0005", status: "offline", empresaId: "4", empresaNome: "Frota Segura ME", veiculo: "MNO-7890", ultimaConexao: "5 dias" },
  { id: "6", iccid: "8955031234567890006", operadora: "Tim", numero: "(31) 99001-0006", status: "online", empresaId: "5", empresaNome: "Associação Rastreamento Nacional", veiculo: "PQR-1122", ultimaConexao: "1 min" },
];

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: "urgente" | "alta" | "media" | "baixa";
  responsavel: string;
  status: "pendente" | "em_andamento" | "concluida";
  dataCriacao: string;
  dataLimite: string;
}

export const tarefas: Tarefa[] = [
  { id: "1", titulo: "Instalar rastreadores lote PED-002", descricao: "Configurar e instalar 25 rastreadores GV300 para Associação Caminhoneiros do Sul", prioridade: "urgente", responsavel: "Carlos Mendes", status: "em_andamento", dataCriacao: "2024-03-01", dataLimite: "2024-03-10" },
  { id: "2", titulo: "Resolver falha de comunicação GHI-9012", descricao: "Veículo GHI-9012 sem comunicação há 3h, verificar SIM e equipamento", prioridade: "alta", responsavel: "Ana Paula", status: "pendente", dataCriacao: "2024-03-05", dataLimite: "2024-03-06" },
  { id: "3", titulo: "Atualizar firmware lote ST4955", descricao: "Atualizar firmware de 15 rastreadores Suntech na base central", prioridade: "media", responsavel: "Roberto Lima", status: "pendente", dataCriacao: "2024-03-03", dataLimite: "2024-03-15" },
  { id: "4", titulo: "Enviar relatório mensal clientes", descricao: "Gerar e enviar relatórios mensais de rastreamento para todos os clientes ativos", prioridade: "alta", responsavel: "Juliana Costa", status: "pendente", dataCriacao: "2024-03-01", dataLimite: "2024-03-05" },
  { id: "5", titulo: "Organizar estoque filial RJ", descricao: "Inventariar e reorganizar estoque da filial Rio de Janeiro", prioridade: "baixa", responsavel: "Pedro Santos", status: "concluida", dataCriacao: "2024-02-20", dataLimite: "2024-03-01" },
];

// ===== OBJETIVO MODULE =====

export interface Tecnico {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  especialidade: string;
  avaliacao: number;
  instalacoesMes: number;
  equipamentosEmEstoque: number;
  saldoAberto: number;
  status: "disponivel" | "em_servico" | "indisponivel";
}

export const tecnicos: Tecnico[] = [
  { id: "1", nome: "Marcos Oliveira", cpf: "123.456.789-00", telefone: "(11) 98765-0001", email: "marcos@tecnico.com", cidade: "São Paulo", estado: "SP", especialidade: "Rastreadores e bloqueadores", avaliacao: 4.8, instalacoesMes: 22, equipamentosEmEstoque: 8, saldoAberto: 3200, status: "disponivel" },
  { id: "2", nome: "Fernando Silva", cpf: "234.567.890-11", telefone: "(21) 98765-0002", email: "fernando@tecnico.com", cidade: "Rio de Janeiro", estado: "RJ", especialidade: "Câmeras e sensores", avaliacao: 4.5, instalacoesMes: 15, equipamentosEmEstoque: 5, saldoAberto: 2100, status: "em_servico" },
  { id: "3", nome: "Ricardo Santos", cpf: "345.678.901-22", telefone: "(41) 98765-0003", email: "ricardo@tecnico.com", cidade: "Curitiba", estado: "PR", especialidade: "Rastreadores", avaliacao: 4.9, instalacoesMes: 28, equipamentosEmEstoque: 12, saldoAberto: 4500, status: "disponivel" },
  { id: "4", nome: "André Costa", cpf: "456.789.012-33", telefone: "(31) 98765-0004", email: "andre@tecnico.com", cidade: "Belo Horizonte", estado: "MG", especialidade: "Instalação completa", avaliacao: 4.3, instalacoesMes: 10, equipamentosEmEstoque: 3, saldoAberto: 1800, status: "indisponivel" },
  { id: "5", nome: "Lucas Pereira", cpf: "567.890.123-44", telefone: "(51) 98765-0005", email: "lucas@tecnico.com", cidade: "Porto Alegre", estado: "RS", especialidade: "Rastreadores e câmeras", avaliacao: 4.7, instalacoesMes: 19, equipamentosEmEstoque: 7, saldoAberto: 2800, status: "disponivel" },
  { id: "6", nome: "Thiago Almeida", cpf: "678.901.234-55", telefone: "(85) 98765-0006", email: "thiago@tecnico.com", cidade: "Fortaleza", estado: "CE", especialidade: "Bloqueadores", avaliacao: 4.1, instalacoesMes: 8, equipamentosEmEstoque: 4, saldoAberto: 1200, status: "em_servico" },
];

export interface ServicoAgendado {
  id: string;
  tecnicoId: string;
  tecnicoNome: string;
  clienteNome: string;
  veiculo: string;
  tipo: "instalacao" | "manutencao" | "remocao" | "troca";
  endereco: string;
  cidade: string;
  estado: string;
  data: string;
  horario: string;
  status: "agendado" | "aceito" | "em_deslocamento" | "em_execucao" | "concluido" | "cancelado";
  valorServico: number;
}

export const servicosAgendados: ServicoAgendado[] = [
  { id: "OS-001", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", clienteNome: "Transportadora Rápida Ltda", veiculo: "Scania R450 - DEF-5678", tipo: "instalacao", endereco: "Rua das Palmeiras, 450 - Vila Mariana", cidade: "São Paulo", estado: "SP", data: "2024-03-08", horario: "09:00", status: "aceito", valorServico: 180 },
  { id: "OS-002", tecnicoId: "2", tecnicoNome: "Fernando Silva", clienteNome: "LogBrasil Transportes", veiculo: "Mercedes Actros - GHI-9012", tipo: "manutencao", endereco: "Av. Brasil, 1200 - Centro", cidade: "Rio de Janeiro", estado: "RJ", data: "2024-03-08", horario: "14:00", status: "em_deslocamento", valorServico: 120 },
  { id: "OS-003", tecnicoId: "3", tecnicoNome: "Ricardo Santos", clienteNome: "Frota Segura ME", veiculo: "Volvo FH 540 - ABC-1234", tipo: "instalacao", endereco: "Rod. BR-116, km 98", cidade: "Curitiba", estado: "PR", data: "2024-03-09", horario: "08:00", status: "agendado", valorServico: 200 },
  { id: "OS-004", tecnicoId: "5", tecnicoNome: "Lucas Pereira", clienteNome: "Associação Caminhoneiros do Sul", veiculo: "DAF XF - JKL-3456", tipo: "troca", endereco: "Av. Ipiranga, 6800", cidade: "Porto Alegre", estado: "RS", data: "2024-03-07", horario: "10:00", status: "concluido", valorServico: 150 },
  { id: "OS-005", tecnicoId: "6", tecnicoNome: "Thiago Almeida", clienteNome: "TransNorte Logística", veiculo: "Iveco S-Way - MNO-7890", tipo: "instalacao", endereco: "Distrito Industrial, Rua A, 100", cidade: "Fortaleza", estado: "CE", data: "2024-03-10", horario: "09:00", status: "agendado", valorServico: 220 },
];

export interface Manutencao {
  id: string;
  veiculo: string;
  placa: string;
  clienteNome: string;
  problema: "offline" | "falha_gps" | "sem_sinal" | "bateria_baixa" | "violacao";
  descricao: string;
  prioridade: "critica" | "alta" | "media";
  tecnicoDesignado?: string;
  status: "aberto" | "designado" | "em_atendimento" | "resolvido";
  dataAbertura: string;
}

export const manutencoes: Manutencao[] = [
  { id: "MAN-001", veiculo: "Mercedes Atego", placa: "VWX-5566", clienteNome: "LogBrasil Transportes", problema: "offline", descricao: "Veículo sem comunicação há 12h", prioridade: "critica", tecnicoDesignado: "Fernando Silva", status: "designado", dataAbertura: "2024-03-05" },
  { id: "MAN-002", veiculo: "Iveco S-Way", placa: "MNO-7890", clienteNome: "TransNorte Logística", problema: "falha_gps", descricao: "GPS retornando coordenadas incorretas", prioridade: "alta", status: "aberto", dataAbertura: "2024-03-06" },
  { id: "MAN-003", veiculo: "Volvo FM 370", placa: "PQR-1122", clienteNome: "Transportadora Rápida Ltda", problema: "bateria_baixa", descricao: "Bateria do rastreador com nível crítico", prioridade: "media", tecnicoDesignado: "Marcos Oliveira", status: "em_atendimento", dataAbertura: "2024-03-04" },
  { id: "MAN-004", veiculo: "Scania G410", placa: "STU-3344", clienteNome: "Associação Caminhoneiros do Sul", problema: "violacao", descricao: "Alerta de violação do equipamento disparado", prioridade: "critica", status: "aberto", dataAbertura: "2024-03-06" },
];

export interface Financeiro {
  id: string;
  tecnicoId: string;
  tecnicoNome: string;
  periodo: string;
  totalServicos: number;
  valorTotal: number;
  descontos: number;
  valorFinal: number;
  status: "aberto" | "pago";
  dataPagamento?: string;
}

export const financeiro: Financeiro[] = [
  { id: "FIN-001", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", periodo: "01-15/03/2024", totalServicos: 11, valorTotal: 2200, descontos: 0, valorFinal: 2200, status: "aberto" },
  { id: "FIN-002", tecnicoId: "2", tecnicoNome: "Fernando Silva", periodo: "01-15/03/2024", totalServicos: 7, valorTotal: 1050, descontos: 50, valorFinal: 1000, status: "aberto" },
  { id: "FIN-003", tecnicoId: "3", tecnicoNome: "Ricardo Santos", periodo: "16-28/02/2024", totalServicos: 14, valorTotal: 2800, descontos: 0, valorFinal: 2800, status: "pago", dataPagamento: "2024-03-02" },
  { id: "FIN-004", tecnicoId: "5", tecnicoNome: "Lucas Pereira", periodo: "16-28/02/2024", totalServicos: 9, valorTotal: 1620, descontos: 120, valorFinal: 1500, status: "pago", dataPagamento: "2024-03-02" },
  { id: "FIN-005", tecnicoId: "6", tecnicoNome: "Thiago Almeida", periodo: "01-15/03/2024", totalServicos: 4, valorTotal: 880, descontos: 0, valorFinal: 880, status: "aberto" },
];

// ===== CHART DATA =====
export const faturamentoMensal = [
  { mes: "Out", valor: 42000 },
  { mes: "Nov", valor: 48000 },
  { mes: "Dez", valor: 51000 },
  { mes: "Jan", valor: 45000 },
  { mes: "Fev", valor: 53000 },
  { mes: "Mar", valor: 58000 },
];

export const instalacoesPorMes = [
  { mes: "Out", instalacoes: 65 },
  { mes: "Nov", instalacoes: 72 },
  { mes: "Dez", instalacoes: 58 },
  { mes: "Jan", instalacoes: 80 },
  { mes: "Fev", instalacoes: 88 },
  { mes: "Mar", instalacoes: 95 },
];

export const linhasPorStatus = [
  { name: "Online", value: 4, fill: "hsl(152, 60%, 42%)" },
  { name: "Offline", value: 2, fill: "hsl(210, 10%, 55%)" },
];
