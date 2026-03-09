// ===== TRACKIT MODULE =====

export interface Cliente {
  id: string;
  nome: string;
  razaoSocial: string;
  tipo: "associacao" | "empresa";
  cnpj: string;
  email: string;
  telefone: string;
  responsavel: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  veiculosAtivos: number;
  status: "ativo" | "inativo";
  statusAcesso: "pendente" | "credenciais_enviadas" | "ativo";
  cpfAssociado: string;
  emailAssociado: string;
  filial: string;
  historicoContatos: { data: string; tipo: string; descricao: string }[];
}

export const clientesIniciais: Cliente[] = [
  { id: "1", nome: "Transportadora Rápida Ltda", razaoSocial: "Transportadora Rápida Ltda ME", tipo: "empresa", cnpj: "12.345.678/0001-90", email: "contato@rapida.com.br", telefone: "(11) 98765-4321", responsavel: "João Martins", endereco: "Rua das Palmeiras, 450 - Vila Mariana", cidade: "São Paulo", estado: "SP", cep: "04012-000", veiculosAtivos: 45, status: "ativo", statusAcesso: "ativo", cpfAssociado: "123.456.789-00", emailAssociado: "joao@rapida.com.br", filial: "São Paulo", historicoContatos: [{ data: "2024-03-01", tipo: "Telefone", descricao: "Solicitou instalação de 10 rastreadores" }, { data: "2024-02-15", tipo: "Email", descricao: "Enviadas credenciais de acesso" }] },
  { id: "2", nome: "Associação Caminhoneiros do Sul", razaoSocial: "Associação dos Caminhoneiros do Sul do Brasil", tipo: "associacao", cnpj: "23.456.789/0001-01", email: "contato@acamsul.org.br", telefone: "(51) 99876-5432", responsavel: "Maria Souza", endereco: "Av. Ipiranga, 6800", cidade: "Porto Alegre", estado: "RS", cep: "90610-000", veiculosAtivos: 120, status: "ativo", statusAcesso: "ativo", cpfAssociado: "234.567.890-11", emailAssociado: "maria@acamsul.org.br", filial: "Porto Alegre", historicoContatos: [{ data: "2024-02-28", tipo: "WhatsApp", descricao: "Pedido de 25 rastreadores GV300" }] },
  { id: "3", nome: "LogBrasil Transportes", razaoSocial: "LogBrasil Transportes e Logística Ltda", tipo: "empresa", cnpj: "34.567.890/0001-12", email: "adm@logbrasil.com.br", telefone: "(21) 97654-3210", responsavel: "Carlos Silva", endereco: "Av. Brasil, 1200 - Centro", cidade: "Rio de Janeiro", estado: "RJ", cep: "20040-020", veiculosAtivos: 32, status: "ativo", statusAcesso: "credenciais_enviadas", cpfAssociado: "345.678.901-22", emailAssociado: "carlos@logbrasil.com.br", filial: "Rio de Janeiro", historicoContatos: [{ data: "2024-03-05", tipo: "Email", descricao: "Credenciais enviadas, aguardando ativação" }] },
  { id: "4", nome: "Frota Segura ME", razaoSocial: "Frota Segura Serviços ME", tipo: "empresa", cnpj: "45.678.901/0001-23", email: "frota@segura.com.br", telefone: "(41) 98765-1234", responsavel: "Pedro Alves", endereco: "Rua XV de Novembro, 300", cidade: "Curitiba", estado: "PR", cep: "80020-310", veiculosAtivos: 18, status: "inativo", statusAcesso: "pendente", cpfAssociado: "456.789.012-33", emailAssociado: "pedro@segura.com.br", filial: "Curitiba", historicoContatos: [] },
  { id: "5", nome: "Associação Rastreamento Nacional", razaoSocial: "Associação Brasileira de Rastreamento Nacional", tipo: "associacao", cnpj: "56.789.012/0001-34", email: "arn@rastreamento.org.br", telefone: "(31) 99988-7766", responsavel: "Ana Beatriz", endereco: "Av. Afonso Pena, 1500", cidade: "Belo Horizonte", estado: "MG", cep: "30130-004", veiculosAtivos: 200, status: "ativo", statusAcesso: "ativo", cpfAssociado: "567.890.123-44", emailAssociado: "ana@rastreamento.org.br", filial: "Belo Horizonte", historicoContatos: [{ data: "2024-03-02", tipo: "Reunião", descricao: "Apresentação de novos produtos" }] },
  { id: "6", nome: "TransNorte Logística", razaoSocial: "TransNorte Logística e Transportes Ltda", tipo: "empresa", cnpj: "67.890.123/0001-45", email: "ops@transnorte.com.br", telefone: "(92) 98877-6655", responsavel: "Roberto Lima", endereco: "Distrito Industrial, Rua A, 100", cidade: "Manaus", estado: "AM", cep: "69075-000", veiculosAtivos: 15, status: "ativo", statusAcesso: "credenciais_enviadas", cpfAssociado: "678.901.234-55", emailAssociado: "roberto@transnorte.com.br", filial: "Manaus", historicoContatos: [] },
];

export interface Equipamento {
  id: string;
  tipo: "rastreador" | "sensor" | "camera" | "bloqueador" | "acessorio" | "sim";
  modelo: string;
  marca: string;
  serial: string;
  imei?: string;
  custo: number;
  preco: number;
  quantidade: number;
  status: "disponivel" | "instalado" | "manutencao" | "defeito";
  localizacao: string;
  clienteId?: string;
  movimentacoes: { data: string; tipo: string; descricao: string }[];
  comodatos: Comodato[];
}

export interface Comodato {
  id: string;
  destinoTipo: "tecnico" | "filial";
  destinoNome: string;
  quantidade: number;
  dataEnvio: string;
  codigoRastreio?: string;
  status: "enviado" | "recebido" | "devolvido";
}

export const equipamentosIniciais: Equipamento[] = [
  { id: "1", tipo: "rastreador", modelo: "ST4955", marca: "Suntech", serial: "ST-2024-001", imei: "351756051523999", custo: 180, preco: 350, quantidade: 15, status: "disponivel", localizacao: "Estoque Central SP", movimentacoes: [{ data: "2024-02-10", tipo: "entrada", descricao: "Recebimento lote 25 unidades" }, { data: "2024-02-20", tipo: "saida", descricao: "Enviado 10 para técnico Marcos" }], comodatos: [{ id: "COM-001", destinoTipo: "tecnico", destinoNome: "Marcos Oliveira", quantidade: 5, dataEnvio: "2024-02-20", codigoRastreio: "BR987654321SP", status: "recebido" }] },
  { id: "2", tipo: "rastreador", modelo: "GV300", marca: "Queclink", serial: "QC-2024-002", imei: "351756051524001", custo: 220, preco: 420, quantidade: 8, status: "instalado", localizacao: "Veículo ABC-1234", clienteId: "1", movimentacoes: [{ data: "2024-02-15", tipo: "instalacao", descricao: "Instalado veículo ABC-1234" }], comodatos: [] },
  { id: "3", tipo: "sensor", modelo: "Sensor Porta RS200", marca: "GenericSens", serial: "SP-2024-003", custo: 45, preco: 90, quantidade: 30, status: "disponivel", localizacao: "Estoque Central SP", movimentacoes: [], comodatos: [] },
  { id: "4", tipo: "camera", modelo: "Câmera Veicular CV100", marca: "HikVision", serial: "CV-2024-004", imei: "351756051524003", custo: 320, preco: 550, quantidade: 2, status: "manutencao", localizacao: "Assistência Técnica", movimentacoes: [{ data: "2024-03-01", tipo: "manutencao", descricao: "Enviado para reparo" }], comodatos: [] },
  { id: "5", tipo: "bloqueador", modelo: "BK500", marca: "BlockTech", serial: "BK-2024-005", custo: 80, preco: 160, quantidade: 20, status: "instalado", localizacao: "Veículo DEF-5678", clienteId: "2", movimentacoes: [], comodatos: [{ id: "COM-002", destinoTipo: "filial", destinoNome: "Filial RJ", quantidade: 8, dataEnvio: "2024-02-25", codigoRastreio: "BR123456789RJ", status: "enviado" }] },
  { id: "6", tipo: "rastreador", modelo: "ST4955", marca: "Suntech", serial: "ST-2024-006", imei: "351756051524005", custo: 180, preco: 350, quantidade: 1, status: "defeito", localizacao: "Estoque Central SP", movimentacoes: [{ data: "2024-03-03", tipo: "defeito", descricao: "Falha na placa principal" }], comodatos: [] },
  { id: "7", tipo: "rastreador", modelo: "GV300", marca: "Queclink", serial: "QC-2024-007", imei: "351756051524007", custo: 220, preco: 420, quantidade: 5, status: "disponivel", localizacao: "Estoque Filial RJ", movimentacoes: [], comodatos: [] },
  { id: "8", tipo: "sensor", modelo: "Sensor Temperatura TM300", marca: "GenericSens", serial: "TM-2024-008", custo: 55, preco: 110, quantidade: 12, status: "disponivel", localizacao: "Estoque Central SP", movimentacoes: [], comodatos: [] },
];

export interface Parcela {
  numero: number;
  valor: number;
  vencimento: string;
  status: "pago" | "pendente" | "atrasado";
}

export interface Pedido {
  id: string;
  clienteId: string;
  clienteNome: string;
  itens: { produtoId: string; nome: string; quantidade: number; valorUnitario: number }[];
  valorTotal: number;
  status: "pendente" | "configurando" | "enviado" | "entregue";
  dataPedido: string;
  parcelas: Parcela[];
  codigoRastreio?: string;
}

export const pedidosIniciais: Pedido[] = [
  { id: "PED-001", clienteId: "1", clienteNome: "Transportadora Rápida Ltda", itens: [{ produtoId: "1", nome: "Rastreador ST4955", quantidade: 10, valorUnitario: 350 }], valorTotal: 3500, status: "pendente", dataPedido: "2024-03-01", parcelas: [{ numero: 1, valor: 1167, vencimento: "2024-04-01", status: "pendente" }, { numero: 2, valor: 1167, vencimento: "2024-05-01", status: "pendente" }, { numero: 3, valor: 1166, vencimento: "2024-06-01", status: "pendente" }] },
  { id: "PED-002", clienteId: "2", clienteNome: "Associação Caminhoneiros do Sul", itens: [{ produtoId: "2", nome: "Rastreador GV300", quantidade: 25, valorUnitario: 420 }, { produtoId: "5", nome: "Bloqueador BK500", quantidade: 25, valorUnitario: 160 }], valorTotal: 14500, status: "configurando", dataPedido: "2024-02-28", parcelas: [{ numero: 1, valor: 2417, vencimento: "2024-03-28", status: "pago" }, { numero: 2, valor: 2417, vencimento: "2024-04-28", status: "pendente" }, { numero: 3, valor: 2417, vencimento: "2024-05-28", status: "pendente" }, { numero: 4, valor: 2417, vencimento: "2024-06-28", status: "pendente" }, { numero: 5, valor: 2416, vencimento: "2024-07-28", status: "pendente" }, { numero: 6, valor: 2416, vencimento: "2024-08-28", status: "pendente" }] },
  { id: "PED-003", clienteId: "3", clienteNome: "LogBrasil Transportes", itens: [{ produtoId: "4", nome: "Câmera CV100", quantidade: 5, valorUnitario: 550 }], valorTotal: 2750, status: "enviado", dataPedido: "2024-02-25", codigoRastreio: "BR123456789SP", parcelas: [{ numero: 1, valor: 1375, vencimento: "2024-03-25", status: "pago" }, { numero: 2, valor: 1375, vencimento: "2024-04-25", status: "pendente" }] },
  { id: "PED-004", clienteId: "5", clienteNome: "Associação Rastreamento Nacional", itens: [{ produtoId: "1", nome: "Rastreador ST4955", quantidade: 50, valorUnitario: 350 }], valorTotal: 17500, status: "entregue", dataPedido: "2024-02-15", parcelas: [{ numero: 1, valor: 1750, vencimento: "2024-03-15", status: "pago" }, { numero: 2, valor: 1750, vencimento: "2024-04-15", status: "pago" }, { numero: 3, valor: 1750, vencimento: "2024-05-15", status: "pendente" }, { numero: 4, valor: 1750, vencimento: "2024-06-15", status: "pendente" }, { numero: 5, valor: 1750, vencimento: "2024-07-15", status: "pendente" }, { numero: 6, valor: 1750, vencimento: "2024-08-15", status: "pendente" }, { numero: 7, valor: 1750, vencimento: "2024-09-15", status: "pendente" }, { numero: 8, valor: 1750, vencimento: "2024-10-15", status: "pendente" }, { numero: 9, valor: 1750, vencimento: "2024-11-15", status: "pendente" }, { numero: 10, valor: 1750, vencimento: "2024-12-15", status: "pendente" }] },
  { id: "PED-005", clienteId: "6", clienteNome: "TransNorte Logística", itens: [{ produtoId: "1", nome: "Rastreador ST4955", quantidade: 8, valorUnitario: 350 }, { produtoId: "3", nome: "Sensor Porta RS200", quantidade: 8, valorUnitario: 90 }], valorTotal: 3520, status: "pendente", dataPedido: "2024-03-05", parcelas: [{ numero: 1, valor: 880, vencimento: "2024-04-05", status: "pendente" }, { numero: 2, valor: 880, vencimento: "2024-05-05", status: "pendente" }, { numero: 3, valor: 880, vencimento: "2024-06-05", status: "pendente" }, { numero: 4, valor: 880, vencimento: "2024-07-05", status: "pendente" }] },
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

export const linhasSIMIniciais: LinhaSIM[] = [
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

export const tarefasIniciais: Tarefa[] = [
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
  valorServico: number;
  periodoPagamento: "quinzenal" | "mensal";
  chavePix: string;
  banco: string;
  avaliacao: number;
  instalacoesMes: number;
  equipamentosEmEstoque: number;
  saldoAberto: number;
  status: "disponivel" | "em_servico" | "indisponivel";
  estoque: { item: string; quantidade: number }[];
  tipoTecnico: "avulso" | "parceiro" | "proprio";
  valorInstalacao: number;
  adicionalKm: number;
  prazoPagamento: string;
}

export const tecnicosIniciais: Tecnico[] = [
  { id: "1", nome: "Marcos Oliveira", cpf: "123.456.789-00", telefone: "(11) 98765-0001", email: "marcos@tecnico.com", cidade: "São Paulo", estado: "SP", especialidade: "Rastreadores e bloqueadores", valorServico: 200, periodoPagamento: "quinzenal", chavePix: "marcos@tecnico.com", banco: "Nubank", avaliacao: 4.8, instalacoesMes: 22, equipamentosEmEstoque: 8, saldoAberto: 3200, status: "disponivel", estoque: [{ item: "Rastreador ST4955", quantidade: 5 }, { item: "Bloqueador BK500", quantidade: 3 }], tipoTecnico: "parceiro", valorInstalacao: 200, adicionalKm: 1.5, prazoPagamento: "5 dias úteis" },
  { id: "2", nome: "Fernando Silva", cpf: "234.567.890-11", telefone: "(21) 98765-0002", email: "fernando@tecnico.com", cidade: "Rio de Janeiro", estado: "RJ", especialidade: "Câmeras e sensores", valorServico: 150, periodoPagamento: "mensal", chavePix: "23456789011", banco: "Bradesco", avaliacao: 4.5, instalacoesMes: 15, equipamentosEmEstoque: 5, saldoAberto: 2100, status: "em_servico", estoque: [{ item: "Câmera CV100", quantidade: 3 }, { item: "Sensor RS200", quantidade: 2 }], tipoTecnico: "avulso", valorInstalacao: 150, adicionalKm: 1.2, prazoPagamento: "2 dias úteis" },
  { id: "3", nome: "Ricardo Santos", cpf: "345.678.901-22", telefone: "(41) 98765-0003", email: "ricardo@tecnico.com", cidade: "Curitiba", estado: "PR", especialidade: "Rastreadores", valorServico: 200, periodoPagamento: "quinzenal", chavePix: "(41) 98765-0003", banco: "Itaú", avaliacao: 4.9, instalacoesMes: 28, equipamentosEmEstoque: 12, saldoAberto: 4500, status: "disponivel", estoque: [{ item: "Rastreador GV300", quantidade: 8 }, { item: "Rastreador ST4955", quantidade: 4 }], tipoTecnico: "proprio", valorInstalacao: 200, adicionalKm: 0, prazoPagamento: "Conforme contrato" },
  { id: "4", nome: "André Costa", cpf: "456.789.012-33", telefone: "(31) 98765-0004", email: "andre@tecnico.com", cidade: "Belo Horizonte", estado: "MG", especialidade: "Instalação completa", valorServico: 180, periodoPagamento: "mensal", chavePix: "andre@tecnico.com", banco: "Inter", avaliacao: 4.3, instalacoesMes: 10, equipamentosEmEstoque: 3, saldoAberto: 1800, status: "indisponivel", estoque: [{ item: "Rastreador ST4955", quantidade: 3 }], tipoTecnico: "parceiro", valorInstalacao: 180, adicionalKm: 1.3, prazoPagamento: "5 dias úteis" },
  { id: "5", nome: "Lucas Pereira", cpf: "567.890.123-44", telefone: "(51) 98765-0005", email: "lucas@tecnico.com", cidade: "Porto Alegre", estado: "RS", especialidade: "Rastreadores e câmeras", valorServico: 190, periodoPagamento: "quinzenal", chavePix: "56789012344", banco: "Banco do Brasil", avaliacao: 4.7, instalacoesMes: 19, equipamentosEmEstoque: 7, saldoAberto: 2800, status: "disponivel", estoque: [{ item: "Rastreador GV300", quantidade: 4 }, { item: "Câmera CV100", quantidade: 3 }], tipoTecnico: "avulso", valorInstalacao: 190, adicionalKm: 1.4, prazoPagamento: "2 dias úteis" },
  { id: "6", nome: "Thiago Almeida", cpf: "678.901.234-55", telefone: "(85) 98765-0006", email: "thiago@tecnico.com", cidade: "Fortaleza", estado: "CE", especialidade: "Bloqueadores", valorServico: 170, periodoPagamento: "mensal", chavePix: "thiago@tecnico.com", banco: "Caixa", avaliacao: 4.1, instalacoesMes: 8, equipamentosEmEstoque: 4, saldoAberto: 1200, status: "em_servico", estoque: [{ item: "Bloqueador BK500", quantidade: 4 }], tipoTecnico: "proprio", valorInstalacao: 170, adicionalKm: 0, prazoPagamento: "Conforme contrato" },
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

export const servicosIniciais: ServicoAgendado[] = [
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

export const manutencoesIniciais: Manutencao[] = [
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
  servicos: { data: string; descricao: string; valor: number }[];
  valorTotal: number;
  descontos: number;
  valorFinal: number;
  status: "aberto" | "fechado" | "pago";
  notaFiscal?: string;
  dataPagamento?: string;
}

export const financeiroIniciais: Financeiro[] = [
  { id: "FIN-001", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", periodo: "01-15/03/2024", totalServicos: 11, servicos: [{ data: "2024-03-02", descricao: "Instalação rastreador - Veículo ABC-1234", valor: 200 }, { data: "2024-03-04", descricao: "Instalação bloqueador - Veículo DEF-5678", valor: 200 }, { data: "2024-03-05", descricao: "Manutenção - Veículo GHI-9012", valor: 150 }], valorTotal: 2200, descontos: 0, valorFinal: 2200, status: "aberto" },
  { id: "FIN-002", tecnicoId: "2", tecnicoNome: "Fernando Silva", periodo: "01-15/03/2024", totalServicos: 7, servicos: [{ data: "2024-03-01", descricao: "Instalação câmera - Veículo JKL-3456", valor: 150 }, { data: "2024-03-03", descricao: "Troca sensor - Veículo MNO-7890", valor: 120 }], valorTotal: 1050, descontos: 50, valorFinal: 1000, status: "aberto" },
  { id: "FIN-003", tecnicoId: "3", tecnicoNome: "Ricardo Santos", periodo: "16-28/02/2024", totalServicos: 14, servicos: [{ data: "2024-02-16", descricao: "Instalação rastreador - Veículo PQR-1122", valor: 200 }, { data: "2024-02-18", descricao: "Instalação rastreador - Veículo STU-3344", valor: 200 }], valorTotal: 2800, descontos: 0, valorFinal: 2800, status: "pago", dataPagamento: "2024-03-02" },
  { id: "FIN-004", tecnicoId: "5", tecnicoNome: "Lucas Pereira", periodo: "16-28/02/2024", totalServicos: 9, servicos: [{ data: "2024-02-17", descricao: "Troca rastreador - Veículo VWX-5566", valor: 190 }], valorTotal: 1620, descontos: 120, valorFinal: 1500, status: "pago", dataPagamento: "2024-03-02" },
  { id: "FIN-005", tecnicoId: "6", tecnicoNome: "Thiago Almeida", periodo: "01-15/03/2024", totalServicos: 4, servicos: [{ data: "2024-03-02", descricao: "Instalação bloqueador - Veículo YZA-7788", valor: 170 }], valorTotal: 880, descontos: 0, valorFinal: 880, status: "aberto" },
];

// ===== NEW MODULES =====

export interface Instalacao {
  id: string;
  placa: string;
  imei: string;
  chip: string;
  filial: string;
  tecnicoId: string;
  tecnicoNome: string;
  status: "aguardando" | "em_andamento" | "concluida" | "problema";
  data: string;
  localizacaoConfirmacao?: string;
}

export const instalacoesIniciais: Instalacao[] = [
  { id: "INST-001", placa: "ABC-1234", imei: "351756051523999", chip: "8955031234567890001", filial: "São Paulo", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", status: "concluida", data: "2024-03-08", localizacaoConfirmacao: "-23.5505, -46.6333" },
  { id: "INST-002", placa: "DEF-5678", imei: "351756051524001", chip: "8955031234567890002", filial: "São Paulo", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", status: "em_andamento", data: "2024-03-08" },
  { id: "INST-003", placa: "GHI-9012", imei: "351756051524003", chip: "8955031234567890003", filial: "Rio de Janeiro", tecnicoId: "2", tecnicoNome: "Fernando Silva", status: "aguardando", data: "2024-03-09" },
  { id: "INST-004", placa: "JKL-3456", imei: "351756051524005", chip: "8955031234567890004", filial: "Curitiba", tecnicoId: "3", tecnicoNome: "Ricardo Santos", status: "problema", data: "2024-03-07" },
  { id: "INST-005", placa: "MNO-7890", imei: "351756051524007", chip: "8955031234567890005", filial: "Porto Alegre", tecnicoId: "5", tecnicoNome: "Lucas Pereira", status: "concluida", data: "2024-03-07", localizacaoConfirmacao: "-30.0346, -51.2177" },
  { id: "INST-006", placa: "PQR-1122", imei: "351756051524009", chip: "8955031234567890006", filial: "Belo Horizonte", tecnicoId: "4", tecnicoNome: "André Costa", status: "aguardando", data: "2024-03-10" },
];

export interface ControleKM {
  id: string;
  tecnicoId: string;
  tecnicoNome: string;
  enderecoInstalacao: string;
  horario: string;
  data: string;
  kmCalculado: number;
}

export const controleKMIniciais: ControleKM[] = [
  { id: "KM-001", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", enderecoInstalacao: "Rua das Palmeiras, 450 - Vila Mariana, SP", horario: "09:00", data: "2024-03-08", kmCalculado: 15 },
  { id: "KM-002", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", enderecoInstalacao: "Av. Paulista, 1500, SP", horario: "11:30", data: "2024-03-08", kmCalculado: 22 },
  { id: "KM-003", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", enderecoInstalacao: "Rua Augusta, 800, SP", horario: "14:00", data: "2024-03-08", kmCalculado: 8 },
  { id: "KM-004", tecnicoId: "2", tecnicoNome: "Fernando Silva", enderecoInstalacao: "Av. Brasil, 1200 - Centro, RJ", horario: "09:30", data: "2024-03-08", kmCalculado: 25 },
  { id: "KM-005", tecnicoId: "2", tecnicoNome: "Fernando Silva", enderecoInstalacao: "Rua do Catete, 300, RJ", horario: "13:00", data: "2024-03-08", kmCalculado: 12 },
  { id: "KM-006", tecnicoId: "3", tecnicoNome: "Ricardo Santos", enderecoInstalacao: "Rod. BR-116, km 98, PR", horario: "08:00", data: "2024-03-09", kmCalculado: 45 },
  { id: "KM-007", tecnicoId: "5", tecnicoNome: "Lucas Pereira", enderecoInstalacao: "Av. Ipiranga, 6800, RS", horario: "10:00", data: "2024-03-07", kmCalculado: 18 },
];

export interface FechamentoTecnico {
  id: string;
  tecnicoId: string;
  tecnicoNome: string;
  tipoTecnico: "avulso" | "parceiro" | "proprio";
  periodo: string;
  dataInicio: string;
  dataFim: string;
  instalacoes: { data: string; placa: string; valor: number }[];
  totalInstalacoes: number;
  valorInstalacoes: number;
  kmTotal: number;
  valorKm: number;
  valorTotal: number;
  regraFiscal: "recibo" | "nota_fiscal";
  status: "pendente" | "enviado_financeiro" | "pago";
}

export const fechamentosTecnicosIniciais: FechamentoTecnico[] = [
  { id: "FECH-001", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", tipoTecnico: "parceiro", periodo: "01-15/03/2024", dataInicio: "2024-03-01", dataFim: "2024-03-15", instalacoes: [{ data: "2024-03-02", placa: "ABC-1234", valor: 200 }, { data: "2024-03-04", placa: "DEF-5678", valor: 200 }, { data: "2024-03-08", placa: "GHI-9012", valor: 200 }], totalInstalacoes: 3, valorInstalacoes: 600, kmTotal: 45, valorKm: 67.5, valorTotal: 667.5, regraFiscal: "recibo", status: "pendente" },
  { id: "FECH-002", tecnicoId: "2", tecnicoNome: "Fernando Silva", tipoTecnico: "avulso", periodo: "01-15/03/2024", dataInicio: "2024-03-01", dataFim: "2024-03-15", instalacoes: [{ data: "2024-03-01", placa: "JKL-3456", valor: 150 }, { data: "2024-03-03", placa: "MNO-7890", valor: 150 }], totalInstalacoes: 2, valorInstalacoes: 300, kmTotal: 37, valorKm: 44.4, valorTotal: 344.4, regraFiscal: "recibo", status: "enviado_financeiro" },
  { id: "FECH-003", tecnicoId: "3", tecnicoNome: "Ricardo Santos", tipoTecnico: "proprio", periodo: "16-28/02/2024", dataInicio: "2024-02-16", dataFim: "2024-02-28", instalacoes: [{ data: "2024-02-16", placa: "PQR-1122", valor: 200 }, { data: "2024-02-18", placa: "STU-3344", valor: 200 }, { data: "2024-02-20", placa: "VWX-5566", valor: 200 }, { data: "2024-02-22", placa: "YZA-7788", valor: 200 }], totalInstalacoes: 4, valorInstalacoes: 800, kmTotal: 120, valorKm: 0, valorTotal: 800, regraFiscal: "recibo", status: "pago" },
  { id: "FECH-004", tecnicoId: "5", tecnicoNome: "Lucas Pereira", tipoTecnico: "avulso", periodo: "01-15/03/2024", dataInicio: "2024-03-01", dataFim: "2024-03-15", instalacoes: [{ data: "2024-03-07", placa: "BCD-2233", valor: 190 }], totalInstalacoes: 1, valorInstalacoes: 190, kmTotal: 18, valorKm: 25.2, valorTotal: 215.2, regraFiscal: "recibo", status: "pendente" },
];

export interface ChamadoSuporte {
  id: string;
  origem: "cobranca" | "comercial" | "tecnico" | "cliente";
  tipo: "instalacao_urgente" | "retirada" | "manutencao" | "atualizacao_equipamento" | "suporte_app";
  descricao: string;
  clienteNome: string;
  prioridade: "normal" | "urgente";
  status: "aberto" | "em_atendimento" | "resolvido";
  responsavel: string;
  dataCriacao: string;
}

export const chamadosSuporteIniciais: ChamadoSuporte[] = [
  { id: "SUP-001", origem: "cliente", tipo: "instalacao_urgente", descricao: "Cliente precisa de instalação urgente em 3 veículos novos", clienteNome: "Transportadora Rápida Ltda", prioridade: "urgente", status: "aberto", responsavel: "Ana Paula", dataCriacao: "2024-03-08" },
  { id: "SUP-002", origem: "tecnico", tipo: "manutencao", descricao: "Rastreador com falha no GPS, precisa de troca", clienteNome: "LogBrasil Transportes", prioridade: "normal", status: "em_atendimento", responsavel: "Carlos Mendes", dataCriacao: "2024-03-07" },
  { id: "SUP-003", origem: "comercial", tipo: "suporte_app", descricao: "Cliente não consegue acessar o aplicativo de rastreamento", clienteNome: "Frota Segura ME", prioridade: "normal", status: "aberto", responsavel: "Juliana Costa", dataCriacao: "2024-03-08" },
  { id: "SUP-004", origem: "cobranca", tipo: "retirada", descricao: "Retirada de equipamento por inadimplência", clienteNome: "TransNorte Logística", prioridade: "urgente", status: "em_atendimento", responsavel: "Roberto Lima", dataCriacao: "2024-03-06" },
  { id: "SUP-005", origem: "cliente", tipo: "atualizacao_equipamento", descricao: "Troca de rastreador antigo por modelo novo", clienteNome: "Associação Rastreamento Nacional", prioridade: "normal", status: "resolvido", responsavel: "Pedro Santos", dataCriacao: "2024-03-05" },
];

export interface Agendamento {
  id: string;
  tipo: "instalacao" | "manutencao" | "retirada";
  placa: string;
  associado: string;
  endereco: string;
  cidade: string;
  tecnicoId: string;
  tecnicoNome: string;
  data: string;
  horario: string;
  status: "agendado" | "realizado" | "sem_retorno";
  tentativas: number;
}

export const agendamentosIniciais: Agendamento[] = [
  { id: "AG-001", tipo: "instalacao", placa: "ABC-1234", associado: "João Martins", endereco: "Rua das Palmeiras, 450", cidade: "São Paulo - SP", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", data: "2024-03-08", horario: "09:00", status: "realizado", tentativas: 1 },
  { id: "AG-002", tipo: "manutencao", placa: "DEF-5678", associado: "Maria Souza", endereco: "Av. Ipiranga, 6800", cidade: "Porto Alegre - RS", tecnicoId: "5", tecnicoNome: "Lucas Pereira", data: "2024-03-09", horario: "10:00", status: "agendado", tentativas: 0 },
  { id: "AG-003", tipo: "instalacao", placa: "GHI-9012", associado: "Carlos Silva", endereco: "Av. Brasil, 1200", cidade: "Rio de Janeiro - RJ", tecnicoId: "2", tecnicoNome: "Fernando Silva", data: "2024-03-09", horario: "14:00", status: "agendado", tentativas: 0 },
  { id: "AG-004", tipo: "retirada", placa: "JKL-3456", associado: "Pedro Alves", endereco: "Rua XV de Novembro, 300", cidade: "Curitiba - PR", tecnicoId: "3", tecnicoNome: "Ricardo Santos", data: "2024-03-07", horario: "08:00", status: "sem_retorno", tentativas: 3 },
  { id: "AG-005", tipo: "instalacao", placa: "MNO-7890", associado: "Ana Beatriz", endereco: "Av. Afonso Pena, 1500", cidade: "Belo Horizonte - MG", tecnicoId: "4", tecnicoNome: "André Costa", data: "2024-03-10", horario: "09:00", status: "agendado", tentativas: 0 },
  { id: "AG-006", tipo: "manutencao", placa: "PQR-1122", associado: "Roberto Lima", endereco: "Distrito Industrial, Rua A", cidade: "Manaus - AM", tecnicoId: "6", tecnicoNome: "Thiago Almeida", data: "2024-03-06", horario: "11:00", status: "sem_retorno", tentativas: 4 },
  { id: "AG-007", tipo: "instalacao", placa: "STU-3344", associado: "Fernanda Costa", endereco: "Rua Augusta, 800", cidade: "São Paulo - SP", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", data: "2024-03-11", horario: "10:00", status: "agendado", tentativas: 0 },
  { id: "AG-008", tipo: "instalacao", placa: "VWX-5566", associado: "Lucas Ferreira", endereco: "Av. Paulista, 1500", cidade: "São Paulo - SP", tecnicoId: "1", tecnicoNome: "Marcos Oliveira", data: "2024-03-08", horario: "14:00", status: "realizado", tentativas: 1 },
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
