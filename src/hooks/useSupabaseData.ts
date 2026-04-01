import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type {
  DbCliente, DbHistoricoContato, DbEquipamento, DbMovimentacao, DbComodato,
  DbPedido, DbPedidoItem, DbParcela, DbLinhaSIM, DbTarefa, DbTecnico,
  DbTecnicoEstoque, DbServico, DbManutencao, DbFinanceiro, DbFinanceiroServico,
  DbInstalacao, DbControleKM, DbFechamentoTecnico, DbFechamentoInstalacao,
  DbChamadoSuporte, DbAgendamento, DbDespacho, DbControleUnidade,
  DbUnidadeRastreador, DbUnidadeChip, DbConfiguracaoDispositivo, DbConfigChecklist,
  DbEscalonamento, DbFornecedor, DbFaturamentoB2B,
} from "@/types/database";

// Generic helper
function useSupabaseQuery<T>(key: string, table: string, options?: { enabled?: boolean }) {
  return useQuery<T[]>({
    queryKey: [key],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as T[];
    },
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  });
}

function useSupabaseInsert<T>(key: string, table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<T>) => {
      const { data, error } = await supabase.from(table).insert(item as any).select().single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

function useSupabaseUpdate<T>(key: string, table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<T>) => {
      const { data, error } = await supabase.from(table).update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data as T;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

function useSupabaseDelete(key: string, table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
  });
}

// ============ CLIENTES ============
export const useClientes = (options?: { enabled?: boolean }) => useSupabaseQuery<DbCliente>("clientes", "clientes", options);
export const useInsertCliente = () => useSupabaseInsert<DbCliente>("clientes", "clientes");
export const useUpdateCliente = () => useSupabaseUpdate<DbCliente>("clientes", "clientes");
export const useDeleteCliente = () => useSupabaseDelete("clientes", "clientes");

export const useHistoricoContatos = (clienteId?: string) => {
  return useQuery<DbHistoricoContato[]>({
    queryKey: ["historico_contatos", clienteId],
    queryFn: async () => {
      let q = supabase.from("historico_contatos").select("*").order("created_at", { ascending: false });
      if (clienteId) q = q.eq("cliente_id", clienteId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DbHistoricoContato[];
    },
    enabled: !!clienteId,
  });
};
export const useInsertHistoricoContato = () => useSupabaseInsert<DbHistoricoContato>("historico_contatos", "historico_contatos");

// ============ EQUIPAMENTOS ============
export const useEquipamentos = (options?: { enabled?: boolean }) => useSupabaseQuery<DbEquipamento>("equipamentos", "equipamentos", options);
export const useInsertEquipamento = () => useSupabaseInsert<DbEquipamento>("equipamentos", "equipamentos");
export const useUpdateEquipamento = () => useSupabaseUpdate<DbEquipamento>("equipamentos", "equipamentos");
export const useDeleteEquipamento = () => useSupabaseDelete("equipamentos", "equipamentos");

export const useBulkInsertEquipamentos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: Partial<DbEquipamento>[]) => {
      const { data, error } = await supabase.from("equipamentos").insert(items as any).select();
      if (error) throw error;
      return data as DbEquipamento[];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["equipamentos"] }),
  });
};

export const useMovimentacoes = (equipamentoId?: string) => {
  return useQuery<DbMovimentacao[]>({
    queryKey: ["movimentacoes_equipamento", equipamentoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("movimentacoes_equipamento").select("*").eq("equipamento_id", equipamentoId!);
      if (error) throw error;
      return (data || []) as DbMovimentacao[];
    },
    enabled: !!equipamentoId,
  });
};
export const useInsertMovimentacao = () => useSupabaseInsert<DbMovimentacao>("movimentacoes_equipamento", "movimentacoes_equipamento");

export const useComodatos = (equipamentoId?: string) => {
  return useQuery<DbComodato[]>({
    queryKey: ["comodatos", equipamentoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("comodatos").select("*").eq("equipamento_id", equipamentoId!);
      if (error) throw error;
      return (data || []) as DbComodato[];
    },
    enabled: !!equipamentoId,
  });
};
export const useInsertComodato = () => useSupabaseInsert<DbComodato>("comodatos", "comodatos");

// ============ PEDIDOS ============
export const usePedidos = (options?: { enabled?: boolean }) => useSupabaseQuery<DbPedido>("pedidos", "pedidos", options);
export const useInsertPedido = () => useSupabaseInsert<DbPedido>("pedidos", "pedidos");
export const useUpdatePedido = () => useSupabaseUpdate<DbPedido>("pedidos", "pedidos");
export const useDeletePedido = () => useSupabaseDelete("pedidos", "pedidos");

export const usePedidoItens = (pedidoId?: string) => {
  return useQuery<DbPedidoItem[]>({
    queryKey: ["itens_pedido", pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("itens_pedido").select("*").eq("pedido_id", pedidoId!);
      if (error) throw error;
      return (data || []) as DbPedidoItem[];
    },
    enabled: !!pedidoId,
  });
};
export const useInsertPedidoItem = () => useSupabaseInsert<DbPedidoItem>("itens_pedido", "itens_pedido");

export const useParcelas = (pedidoId?: string) => {
  return useQuery<DbParcela[]>({
    queryKey: ["parcelas", pedidoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("parcelas").select("*").eq("pedido_id", pedidoId!);
      if (error) throw error;
      return (data || []) as DbParcela[];
    },
    enabled: !!pedidoId,
  });
};
export const useInsertParcela = () => useSupabaseInsert<DbParcela>("parcelas", "parcelas");
export const useUpdateParcela = () => useSupabaseUpdate<DbParcela>("parcelas", "parcelas");

// ============ LINHAS SIM ============
export const useLinhasSIM = (options?: { enabled?: boolean }) => useSupabaseQuery<DbLinhaSIM>("linhas_sim", "linhas_sim", options);
export const useInsertLinhaSIM = () => useSupabaseInsert<DbLinhaSIM>("linhas_sim", "linhas_sim");
export const useUpdateLinhaSIM = () => useSupabaseUpdate<DbLinhaSIM>("linhas_sim", "linhas_sim");
export const useDeleteLinhaSIM = () => useSupabaseDelete("linhas_sim", "linhas_sim");

// ============ TAREFAS ============
export const useTarefas = () => useSupabaseQuery<DbTarefa>("tarefas", "tarefas");
export const useInsertTarefa = () => useSupabaseInsert<DbTarefa>("tarefas", "tarefas");
export const useUpdateTarefa = () => useSupabaseUpdate<DbTarefa>("tarefas", "tarefas");
export const useDeleteTarefa = () => useSupabaseDelete("tarefas", "tarefas");

// ============ TECNICOS ============
export const useTecnicos = (options?: { enabled?: boolean }) => useSupabaseQuery<DbTecnico>("tecnicos", "tecnicos", options);
export const useInsertTecnico = () => useSupabaseInsert<DbTecnico>("tecnicos", "tecnicos");
export const useUpdateTecnico = () => useSupabaseUpdate<DbTecnico>("tecnicos", "tecnicos");

export const useTecnicoEstoque = (tecnicoId?: string) => {
  return useQuery<DbTecnicoEstoque[]>({
    queryKey: ["tecnico_estoque", tecnicoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tecnico_estoque").select("*").eq("tecnico_id", tecnicoId!);
      if (error) throw error;
      return (data || []) as DbTecnicoEstoque[];
    },
    enabled: !!tecnicoId,
  });
};

// ============ SERVICOS ============
export const useServicos = (options?: { enabled?: boolean }) => useSupabaseQuery<DbServico>("servicos_agendados", "servicos_agendados", options);
export const useInsertServico = () => useSupabaseInsert<DbServico>("servicos_agendados", "servicos_agendados");
export const useUpdateServico = () => useSupabaseUpdate<DbServico>("servicos_agendados", "servicos_agendados");

export const useServicoById = (id?: string) => {
  return useQuery<DbServico | null>({
    queryKey: ["servico", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("servicos_agendados").select("*").eq("codigo", id!).single();
      if (error) return null;
      return data as DbServico;
    },
    enabled: !!id,
  });
};

// ============ MANUTENCOES ============
export const useManutencoes = (options?: { enabled?: boolean }) => useSupabaseQuery<DbManutencao>("manutencoes", "manutencoes", options);
export const useInsertManutencao = () => useSupabaseInsert<DbManutencao>("manutencoes", "manutencoes");
export const useUpdateManutencao = () => useSupabaseUpdate<DbManutencao>("manutencoes", "manutencoes");

// ============ FINANCEIRO ============
export const useFinanceiro = () => useSupabaseQuery<DbFinanceiro>("financeiro", "financeiro");
export const useInsertFinanceiro = () => useSupabaseInsert<DbFinanceiro>("financeiro", "financeiro");
export const useUpdateFinanceiro = () => useSupabaseUpdate<DbFinanceiro>("financeiro", "financeiro");

export const useFinanceiroServicos = (financeiroId?: string) => {
  return useQuery<DbFinanceiroServico[]>({
    queryKey: ["financeiro_servicos", financeiroId],
    queryFn: async () => {
      const { data, error } = await supabase.from("financeiro_servicos").select("*").eq("financeiro_id", financeiroId!);
      if (error) throw error;
      return (data || []) as DbFinanceiroServico[];
    },
    enabled: !!financeiroId,
  });
};

// ============ INSTALACOES ============
export const useInstalacoes = () => useSupabaseQuery<DbInstalacao>("instalacoes", "instalacoes");
export const useInsertInstalacao = () => useSupabaseInsert<DbInstalacao>("instalacoes", "instalacoes");
export const useUpdateInstalacao = () => useSupabaseUpdate<DbInstalacao>("instalacoes", "instalacoes");

// ============ CONTROLE KM ============
export const useControleKM = (options?: { enabled?: boolean }) => useSupabaseQuery<DbControleKM>("controle_km", "controle_km", options);
export const useInsertControleKM = () => useSupabaseInsert<DbControleKM>("controle_km", "controle_km");

// ============ FECHAMENTO TECNICOS ============
export const useFechamentoTecnicos = () => useSupabaseQuery<DbFechamentoTecnico>("fechamento_tecnicos", "fechamento_tecnicos");
export const useUpdateFechamentoTecnico = () => useSupabaseUpdate<DbFechamentoTecnico>("fechamento_tecnicos", "fechamento_tecnicos");

export const useFechamentoInstalacoes = (fechamentoId?: string) => {
  return useQuery<DbFechamentoInstalacao[]>({
    queryKey: ["fechamento_instalacoes", fechamentoId],
    queryFn: async () => {
      const { data, error } = await supabase.from("fechamento_instalacoes").select("*").eq("fechamento_id", fechamentoId!);
      if (error) throw error;
      return (data || []) as DbFechamentoInstalacao[];
    },
    enabled: !!fechamentoId,
  });
};

// ============ CHAMADOS SUPORTE ============
export const useChamadosSuporte = (options?: { enabled?: boolean }) => useSupabaseQuery<DbChamadoSuporte>("chamados_suporte", "chamados_suporte", options);
export const useInsertChamadoSuporte = () => useSupabaseInsert<DbChamadoSuporte>("chamados_suporte", "chamados_suporte");
export const useUpdateChamadoSuporte = () => useSupabaseUpdate<DbChamadoSuporte>("chamados_suporte", "chamados_suporte");

// ============ AGENDAMENTOS ============
export const useAgendamentos = (options?: { enabled?: boolean }) => useSupabaseQuery<DbAgendamento>("agendamentos", "agendamentos", options);
export const useInsertAgendamento = () => useSupabaseInsert<DbAgendamento>("agendamentos", "agendamentos");
export const useUpdateAgendamento = () => useSupabaseUpdate<DbAgendamento>("agendamentos", "agendamentos");

// ============ DESPACHOS ============
export const useDespachos = (options?: { enabled?: boolean }) => useSupabaseQuery<DbDespacho>("despachos_rastreadores", "despachos_rastreadores", options);
export const useInsertDespacho = () => useSupabaseInsert<DbDespacho>("despachos_rastreadores", "despachos_rastreadores");
export const useUpdateDespacho = () => useSupabaseUpdate<DbDespacho>("despachos_rastreadores", "despachos_rastreadores");

// ============ CONTROLE UNIDADES ============
export const useControleUnidades = (options?: { enabled?: boolean }) => useSupabaseQuery<DbControleUnidade>("controle_unidades", "controle_unidades", options);
export const useInsertControleUnidade = () => useSupabaseInsert<DbControleUnidade>("controle_unidades", "controle_unidades");
export const useUpdateControleUnidade = () => useSupabaseUpdate<DbControleUnidade>("controle_unidades", "controle_unidades");
export const useDeleteControleUnidade = () => useSupabaseDelete("controle_unidades", "controle_unidades");

export const useUnidadeRastreadores = (unidadeId?: string) => {
  return useQuery<DbUnidadeRastreador[]>({
    queryKey: ["unidade_rastreadores", unidadeId],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidade_rastreadores").select("*").eq("unidade_id", unidadeId!);
      if (error) throw error;
      return (data || []) as DbUnidadeRastreador[];
    },
    enabled: !!unidadeId,
  });
};

export const useUnidadeChips = (unidadeId?: string) => {
  return useQuery<DbUnidadeChip[]>({
    queryKey: ["unidade_chips", unidadeId],
    queryFn: async () => {
      const { data, error } = await supabase.from("unidade_chips").select("*").eq("unidade_id", unidadeId!);
      if (error) throw error;
      return (data || []) as DbUnidadeChip[];
    },
    enabled: !!unidadeId,
  });
};

// ============ CONFIGURACAO DISPOSITIVOS ============
export const useConfiguracaoDispositivos = () => useSupabaseQuery<DbConfiguracaoDispositivo>("configuracao_dispositivos", "configuracao_dispositivos");
export const useUpdateConfiguracaoDispositivo = () => useSupabaseUpdate<DbConfiguracaoDispositivo>("configuracao_dispositivos", "configuracao_dispositivos");

export const useConfigChecklist = (configId?: string) => {
  return useQuery<DbConfigChecklist[]>({
    queryKey: ["config_checklist", configId],
    queryFn: async () => {
      const { data, error } = await supabase.from("config_checklist").select("*").eq("config_id", configId!);
      if (error) throw error;
      return (data || []) as DbConfigChecklist[];
    },
    enabled: !!configId,
  });
};

export const useUpdateConfigChecklist = () => useSupabaseUpdate<DbConfigChecklist>("config_checklist", "config_checklist");

// Helper to get all configs with their checklists
export const useConfigDispositivosComChecklist = () => {
  return useQuery({
    queryKey: ["config_dispositivos_completo"],
    queryFn: async () => {
      const [configsRes, checklistRes] = await Promise.all([
        supabase.from("configuracao_dispositivos").select("*").order("created_at", { ascending: false }),
        supabase.from("config_checklist").select("*"),
      ]);
      if (configsRes.error) throw configsRes.error;
      if (checklistRes.error) throw checklistRes.error;

      const configs = (configsRes.data || []) as DbConfiguracaoDispositivo[];
      const checklists = (checklistRes.data || []) as DbConfigChecklist[];

      return configs.map(c => ({
        ...c,
        checklist: checklists.filter(cl => cl.config_id === c.id),
      }));
    },
  });
};

// ============ ESCALONAMENTOS ============
export const useEscalonamentos = () => useSupabaseQuery<DbEscalonamento>("escalonamentos", "escalonamentos");
export const useInsertEscalonamento = () => useSupabaseInsert<DbEscalonamento>("escalonamentos", "escalonamentos");
export const useUpdateEscalonamento = () => useSupabaseUpdate<DbEscalonamento>("escalonamentos", "escalonamentos");

// ============ FORNECEDORES ============
export const useFornecedores = () => useSupabaseQuery<DbFornecedor>("fornecedores", "fornecedores");
export const useInsertFornecedor = () => useSupabaseInsert<DbFornecedor>("fornecedores", "fornecedores");
export const useUpdateFornecedor = () => useSupabaseUpdate<DbFornecedor>("fornecedores", "fornecedores");
export const useDeleteFornecedor = () => useSupabaseDelete("fornecedores", "fornecedores");

// ============ FATURAMENTO B2B ============
export const useFaturamentoB2B = (options?: { enabled?: boolean }) => useSupabaseQuery<DbFaturamentoB2B>("faturamento_b2b", "faturamento_b2b", options);
export const useInsertFaturamentoB2B = () => useSupabaseInsert<DbFaturamentoB2B>("faturamento_b2b", "faturamento_b2b");
export const useUpdateFaturamentoB2B = () => useSupabaseUpdate<DbFaturamentoB2B>("faturamento_b2b", "faturamento_b2b");
export const useDeleteFaturamentoB2B = () => useSupabaseDelete("faturamento_b2b", "faturamento_b2b");

// ============ RETIRADAS ============
export const useRetiradas = () => useSupabaseQuery<any>("retiradas", "retiradas");
export const useInsertRetirada = () => useSupabaseInsert<any>("retiradas", "retiradas");
export const useUpdateRetirada = () => useSupabaseUpdate<any>("retiradas", "retiradas");
export const useDeleteRetirada = () => useSupabaseDelete("retiradas", "retiradas");


export const useUnidadesCompletas = () => {
  return useQuery({
    queryKey: ["unidades_completas"],
    queryFn: async () => {
      const [unidadesRes, rastreadoresRes, chipsRes] = await Promise.all([
        supabase.from("controle_unidades").select("*").order("created_at", { ascending: false }),
        supabase.from("unidade_rastreadores").select("*"),
        supabase.from("unidade_chips").select("*"),
      ]);
      if (unidadesRes.error) throw unidadesRes.error;
      if (rastreadoresRes.error) throw rastreadoresRes.error;
      if (chipsRes.error) throw chipsRes.error;

      const unidades = (unidadesRes.data || []) as DbControleUnidade[];
      const rastreadores = (rastreadoresRes.data || []) as DbUnidadeRastreador[];
      const chips = (chipsRes.data || []) as DbUnidadeChip[];

      return unidades.map(u => ({
        ...u,
        rastreadores: rastreadores.filter(r => r.unidade_id === u.id),
        chips: chips.filter(c => c.unidade_id === u.id),
      }));
    },
  });
};

// ============ PEDIDOS COM DETALHES ============
export const usePedidosCompletos = () => {
  return useQuery({
    queryKey: ["pedidos_completos"],
    queryFn: async () => {
      const [pedidosRes, itensRes, parcelasRes] = await Promise.all([
        supabase.from("pedidos").select("*").order("created_at", { ascending: false }),
        supabase.from("itens_pedido").select("*"),
        supabase.from("parcelas").select("*"),
      ]);
      if (pedidosRes.error) throw pedidosRes.error;
      if (itensRes.error) throw itensRes.error;
      if (parcelasRes.error) throw parcelasRes.error;

      const pedidos = (pedidosRes.data || []) as DbPedido[];
      const itens = (itensRes.data || []) as DbPedidoItem[];
      const parcelas = (parcelasRes.data || []) as DbParcela[];

      return pedidos.map(p => ({
        ...p,
        itens: (itens || []).filter(i => i.pedido_id === p.id),
        parcelas: (parcelas || []).filter(par => par.pedido_id === p.id),
      }));
    },
  });
};

// ============ EQUIPAMENTOS COM DETALHES ============
export const useEquipamentosCompletos = () => {
  return useQuery({
    queryKey: ["equipamentos_completos"],
    queryFn: async () => {
      const [equipRes, movRes, comRes] = await Promise.all([
        supabase.from("equipamentos").select("*").order("created_at", { ascending: false }),
        supabase.from("movimentacoes_equipamento").select("*"),
        supabase.from("comodatos").select("*"),
      ]);
      if (equipRes.error) throw equipRes.error;

      const equips = (equipRes.data || []) as DbEquipamento[];
      const movs = (movRes.data || []) as DbMovimentacao[];
      const coms = (comRes.data || []) as DbComodato[];

      return equips.map(e => ({
        ...e,
        movimentacoes: movs.filter(m => m.equipamento_id === e.id),
        comodatos: coms.filter(c => c.equipamento_id === e.id),
      }));
    },
  });
};

// ============ FINANCEIRO COM SERVICOS ============
export const useFinanceiroCompleto = () => {
  return useQuery({
    queryKey: ["financeiro_completo"],
    queryFn: async () => {
      const [finRes, servRes] = await Promise.all([
        supabase.from("financeiro").select("*").order("created_at", { ascending: false }),
        supabase.from("financeiro_servicos").select("*"),
      ]);
      if (finRes.error) throw finRes.error;

      const fins = (finRes.data || []) as DbFinanceiro[];
      const servs = (servRes.data || []) as DbFinanceiroServico[];

      return fins.map(f => ({
        ...f,
        servicos: servs.filter(s => s.financeiro_id === f.id),
      }));
    },
  });
};

// ============ FECHAMENTO COM INSTALACOES ============
export const useFechamentoCompleto = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ["fechamento_completo"],
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
    queryFn: async () => {
      const [fechRes, instRes] = await Promise.all([
        supabase.from("fechamento_tecnicos").select("*").order("created_at", { ascending: false }),
        supabase.from("fechamento_instalacoes").select("*"),
      ]);
      if (fechRes.error) throw fechRes.error;

      const fechs = (fechRes.data || []) as DbFechamentoTecnico[];
      const insts = (instRes.data || []) as DbFechamentoInstalacao[];

      return fechs.map(f => ({
        ...f,
        instalacoes: insts.filter(i => i.fechamento_id === f.id),
      }));
    },
  });
};

// ============ TECNICOS COM ESTOQUE ============
export const useTecnicosCompletos = () => {
  return useQuery({
    queryKey: ["tecnicos_completos"],
    queryFn: async () => {
      const [tecRes, estRes] = await Promise.all([
        supabase.from("tecnicos").select("*").order("created_at", { ascending: false }),
        supabase.from("tecnico_estoque").select("*"),
      ]);
      if (tecRes.error) throw tecRes.error;

      const tecs = (tecRes.data || []) as DbTecnico[];
      const ests = (estRes.data || []) as DbTecnicoEstoque[];

      return tecs.map(t => ({
        ...t,
        estoque: ests.filter(e => e.tecnico_id === t.id),
      }));
    },
  });
};

// ============ CLIENTES COM HISTORICO ============
export const useClientesCompletos = () => {
  return useQuery({
    queryKey: ["clientes_completos"],
    queryFn: async () => {
      const [cliRes, histRes] = await Promise.all([
        supabase.from("clientes").select("*").order("created_at", { ascending: false }),
        supabase.from("historico_contatos").select("*"),
      ]);
      if (cliRes.error) throw cliRes.error;

      const clientes = (cliRes.data || []) as DbCliente[];
      const historico = (histRes.data || []) as DbHistoricoContato[];

      return clientes.map(c => ({
        ...c,
        historicoContatos: historico.filter(h => h.cliente_id === c.id).map(h => ({
          data: h.data,
          tipo: h.tipo,
          descricao: h.descricao,
        })),
      }));
    },
  });
};

// ============ REALTIME SUBSCRIPTIONS ============
export function useRealtimeSubscription(table: string, queryKeys: string[]) {
  const qc = useQueryClient();
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const channel = supabase
      .channel(`realtime-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          queryKeys.forEach(key => qc.invalidateQueries({ queryKey: [key] }));
        }, 500);
      })
      .subscribe();
    return () => {
      if (timeout) clearTimeout(timeout);
      supabase.removeChannel(channel);
    };
  }, [table, qc]);
}

// ============ MISSING CRUD HOOKS ============
export const useDeleteTecnico = () => useSupabaseDelete("tecnicos", "tecnicos");
export const useDeleteServico = () => useSupabaseDelete("servicos_agendados", "servicos_agendados");
export const useDeleteManutencao = () => useSupabaseDelete("manutencoes", "manutencoes");
export const useInsertFechamentoTecnico = () => useSupabaseInsert<DbFechamentoTecnico>("fechamento_tecnicos", "fechamento_tecnicos");
export const useInsertFechamentoInstalacao = () => useSupabaseInsert<DbFechamentoInstalacao>("fechamento_instalacoes", "fechamento_instalacoes");
export const useInsertUnidadeRastreador = () => useSupabaseInsert<DbUnidadeRastreador>("unidade_rastreadores", "unidade_rastreadores");
export const useInsertUnidadeChip = () => useSupabaseInsert<DbUnidadeChip>("unidade_chips", "unidade_chips");
export const useInsertConfiguracaoDispositivo = () => useSupabaseInsert<DbConfiguracaoDispositivo>("configuracao_dispositivos", "configuracao_dispositivos");
export const useDeleteConfiguracaoDispositivo = () => useSupabaseDelete("configuracao_dispositivos", "configuracao_dispositivos");
export const useInsertConfigChecklist = () => useSupabaseInsert<DbConfigChecklist>("config_checklist", "config_checklist");
export const useUpdateControleKM = () => useSupabaseUpdate<DbControleKM>("controle_km", "controle_km");
export const useDeleteControleKM = () => useSupabaseDelete("controle_km", "controle_km");
export const useDeleteChamadoSuporte = () => useSupabaseDelete("chamados_suporte", "chamados_suporte");
export const useDeleteAgendamento = () => useSupabaseDelete("agendamentos", "agendamentos");
export const useDeleteDespacho = () => useSupabaseDelete("despachos_rastreadores", "despachos_rastreadores");
export const useDeleteInstalacao = () => useSupabaseDelete("instalacoes", "instalacoes");

// ============ RASTREADORES INSTALADOS ============
export const useRastreadoresInstalados = (options?: { enabled?: boolean }) => {
  return useQuery<any[]>({
    queryKey: ["rastreadores_instalados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rastreadores_instalados")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10000);
      if (error) throw error;
      return data || [];
    },
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  });
};
export const useInsertRastreadorInstalado = () => useSupabaseInsert<any>("rastreadores_instalados", "rastreadores_instalados");
export const useUpdateRastreadorInstalado = () => useSupabaseUpdate<any>("rastreadores_instalados", "rastreadores_instalados");
export const useDeleteRastreadorInstalado = () => useSupabaseDelete("rastreadores_instalados", "rastreadores_instalados");

// ============ SGA VEICULOS CACHE ============
export const useSGACache = (options?: { enabled?: boolean }) => {
  return useQuery<any[]>({
    queryKey: ["sga_veiculos_cache"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sga_veiculos_cache")
        .select("*")
        .limit(15000);
      if (error) throw error;
      return data || [];
    },
    ...(options?.enabled !== undefined && { enabled: options.enabled }),
  });
};
