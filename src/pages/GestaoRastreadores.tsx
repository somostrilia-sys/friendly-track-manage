import { useState, useMemo, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useRastreadoresInstalados,
  useInsertRastreadorInstalado,
  useUpdateRastreadorInstalado,
  useDeleteRastreadorInstalado,
  useRealtimeSubscription,
  useSGACache,
} from "@/hooks/useSupabaseData";
import { atualizarCacheSGA, type AssociadoERP, type VeiculoERP } from "@/lib/hinova-erp";
import {
  Radio, Plus, Inbox, Search, Download, Upload, AlertTriangle,
  CheckCircle2, XCircle, Clock, FileWarning, BarChart3, Loader2,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { FilialSelect } from "@/components/FilialSelect";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// ---- Types ----

type RastreadorInstalado = {
  id: string;
  created_at: string;
  placa: string;
  chassi: string;
  imei: string;
  simcard: string;
  modelo_rastreador: string;
  veiculo: string;
  associado: string;
  cpf: string;
  cooperativa: string;
  status: string;
  encaminhamento: string;
  observacao: string;
  motivo_nao_retirada: string;
  justificativa: string;
};

type ERPVeiculoFlat = {
  associado: string;
  cpf: string;
  telefone: string;
  placa: string;
  chassi: string;
  veiculo: string;
  cooperativa: string;
  status_sga: string;
  tem_produto_rastreador: boolean;
};

// ---- Constants ----

const PAGE_SIZE = 100;

const statusMap: Record<string, { label: string; variant: "destructive" | "secondary" | "default" | "outline" }> = {
  instalado: { label: "Instalado", variant: "default" },
  pendente_retirada: { label: "Pendente Retirada", variant: "destructive" },
  retirado: { label: "Retirado", variant: "secondary" },
  irregular: { label: "Irregular", variant: "outline" },
};

const encaminhamentoMap: Record<string, string> = {
  pendente: "Pendente",
  cobranca: "Cobranca",
  retirada: "Retirada",
  regularizacao: "Regularizacao",
  resolvido: "Resolvido",
};

const motivoNaoRetiradaMap: Record<string, string> = {
  aguardando_tecnico: "Aguardando Tecnico",
  cliente_nao_encontrado: "Cliente Nao Encontrado",
  endereco_incorreto: "Endereco Incorreto",
  em_negociacao: "Em Negociacao",
  outro: "Outro",
};

const emptyForm: Partial<RastreadorInstalado> = {
  placa: "",
  chassi: "",
  imei: "",
  simcard: "",
  modelo_rastreador: "",
  veiculo: "",
  associado: "",
  cpf: "",
  cooperativa: "",
  status: "instalado",
  encaminhamento: "pendente",
  observacao: "",
  motivo_nao_retirada: "",
  justificativa: "",
};

// ---- Helpers ----

function flattenERP(associados: AssociadoERP[]): ERPVeiculoFlat[] {
  const result: ERPVeiculoFlat[] = [];
  for (const a of associados) {
    for (const v of a.veiculos) {
      const temRastreador = (v.produtos || []).some(
        (p) => p.descricao?.toLowerCase().includes("rastreador") || p.descricao?.toLowerCase().includes("rastreamento")
      );
      result.push({
        associado: a.nome,
        cpf: a.cpf,
        telefone: a.telefone_celular ? `(${a.ddd_celular}) ${a.telefone_celular}` : "",
        placa: (v.placa || "").toUpperCase().trim(),
        chassi: (v.chassi || "").toUpperCase().trim(),
        veiculo: `${v.marca} ${v.modelo}`.trim(),
        cooperativa: v.categoria || "",
        status_sga: (v.status || "").toLowerCase(),
        tem_produto_rastreador: temRastreador,
      });
    }
  }
  return result;
}

function flattenSGACache(cacheRows: any[]): ERPVeiculoFlat[] {
  return cacheRows.map((row) => {
    let temRastreador = row.tem_rastreador ?? false;
    if (!temRastreador) {
      try {
        const produtos = typeof row.produtos === "string" ? JSON.parse(row.produtos) : (row.produtos || []);
        temRastreador = produtos.some(
          (p: any) => (p.descricao || "").toLowerCase().includes("rastreador") || (p.descricao || "").toLowerCase().includes("rastreamento")
        );
      } catch { /* ignore */ }
    }
    return {
      associado: row.nome_associado || "",
      cpf: row.cpf || "",
      telefone: row.telefone_celular ? `(${row.ddd_celular || ""}) ${row.telefone_celular}` : "",
      placa: (row.placa || "").toUpperCase().trim(),
      chassi: (row.chassi || "").toUpperCase().trim(),
      veiculo: `${row.marca || ""} ${row.modelo || ""}`.trim(),
      cooperativa: row.cooperativa || "",
      status_sga: (row.status_veiculo || "").toLowerCase(),
      tem_produto_rastreador: temRastreador,
    };
  });
}

function normPlaca(p: string | null | undefined): string {
  const n = (p || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return n.length >= 5 ? n : "";
}

function exportExcel(rows: Record<string, any>[], filename: string) {
  if (!rows.length) { toast.error("Nenhum dado para exportar"); return; }
  const ws = XLSX.utils.json_to_sheet(rows);
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = Math.max(key.length, ...rows.slice(0, 50).map((r) => String(r[key] || "").length));
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws["!cols"] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");
  XLSX.writeFile(wb, `${filename}.xlsx`);
  toast.success(`Planilha exportada: ${filename}.xlsx`);
}

function exportPDF(title: string) {
  const tableEl = document.querySelector("[data-print-table]");
  if (!tableEl) { toast.error("Tabela nao encontrada"); return; }
  const pw = window.open("", "_blank");
  if (!pw) { toast.error("Permita popups para exportar PDF"); return; }
  pw.document.write(`<html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
    h1{font-size:16px;margin-bottom:5px}
    p{color:#666;margin-bottom:10px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:4px 8px;text-align:left}
    th{background:#f0f0f0;font-weight:bold}
    @media print{body{margin:0}}
  </style></head><body>
    <h1>${title}</h1>
    <p>Exportado em ${new Date().toLocaleDateString("pt-BR")}</p>
    ${tableEl.outerHTML}
  </body></html>`);
  pw.document.close();
  setTimeout(() => pw.print(), 500);
}

// ---- Component ----

const GestaoRastreadores = () => {
  const queryClient = useQueryClient();
  const { data: rastreadores = [], isLoading } = useRastreadoresInstalados();
  const { data: sgaCache = [], isLoading: sgaCacheLoading } = useSGACache();
  const insertRastreador = useInsertRastreadorInstalado();
  const updateRastreador = useUpdateRastreadorInstalado();

  useRealtimeSubscription("rastreadores_instalados", ["rastreadores_instalados"]);

  // State
  const [activeTab, setActiveTab] = useState("todos");
  const [busca, setBusca] = useState("");
  const [novoOpen, setNovoOpen] = useState(false);
  const [novoForm, setNovoForm] = useState<Partial<RastreadorInstalado>>({ ...emptyForm });
  const [detailItem, setDetailItem] = useState<RastreadorInstalado | null>(null);
  const [editForm, setEditForm] = useState<Partial<RastreadorInstalado>>({});

  // ERP state - derived from SGA cache
  const erpData = useMemo(() => flattenSGACache(sgaCache), [sgaCache]);
  const erpLoaded = sgaCache.length > 0;
  const [erpRefreshing, setErpRefreshing] = useState(false);

  // Cross-reference tab search/filter state
  const [pendenteBusca, setPendenteBusca] = useState("");
  const [pendenteFilial, setPendenteFilial] = useState("todas");
  const [pendenteLimite, setPendenteLimite] = useState(PAGE_SIZE);
  const [inadimplBusca, setInadimplBusca] = useState("");
  const [inadimplFilial, setInadimplFilial] = useState("todas");
  const [inadimplLimite, setInadimplLimite] = useState(PAGE_SIZE);
  const [inativoBusca, setInativoBusca] = useState("");
  const [inativoFilial, setInativoFilial] = useState("todas");
  const [inativoLimite, setInativoLimite] = useState(PAGE_SIZE);
  const [semCorrespBusca, setSemCorrespBusca] = useState("");
  const [semCorrespFilial, setSemCorrespFilial] = useState("todas");
  const [semCorrespLimite, setSemCorrespLimite] = useState(PAGE_SIZE);

  // Pagination
  const [limiteExibido, setLimiteExibido] = useState(PAGE_SIZE);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typed = rastreadores as RastreadorInstalado[];
  // Installed = has placa or chassi. Stock = only IMEI, no placa, no chassi.
  const temIdentificador = (r: RastreadorInstalado) => !!(r.placa?.trim()) || !!(r.chassi?.trim());
  const instalados = useMemo(() => typed.filter(temIdentificador), [typed]);
  const estoque = useMemo(() => typed.filter((r) => !temIdentificador(r)), [typed]);
  const placasInstaladas = useMemo(() => new Set(instalados.map((r) => normPlaca(r.placa)).filter(Boolean)), [instalados]);
  const chassisInstalados = useMemo(() => new Set(instalados.map((r) => (r.chassi || "").toUpperCase().trim()).filter((c) => c.length >= 10)), [instalados]);

  // ---- ERP import (refresh cache in background) ----
  const importarSGA = useCallback(async () => {
    setErpRefreshing(true);
    toast.info("Buscando dados do SGA... Isso pode levar alguns segundos.");
    try {
      const saved = await atualizarCacheSGA();
      await queryClient.invalidateQueries({ queryKey: ["sga_veiculos_cache"] });
      toast.success(`SGA atualizado! ${saved} veiculos com rastreador salvos no cache.`);
    } catch (e: any) {
      toast.error("Erro ao atualizar: " + (e.message || "Erro desconhecido"));
    } finally {
      setErpRefreshing(false);
    }
  }, [queryClient]);

  // ---- Cross-reference computations ----

  // Helper: normalize chassi for comparison
  const normChassi = (c: string | null | undefined): string => {
    const n = (c || "").toUpperCase().trim();
    return n.length >= 10 ? n : "";
  };

  // Helper: check if a SGA record is installed (exists in planilha) by placa or chassi
  const isInstalledInPlanilha = useCallback((erpPlaca: string, erpChassi?: string) => {
    const p = normPlaca(erpPlaca);
    if (p && placasInstaladas.has(p)) return true;
    const c = normChassi(erpChassi);
    if (c && chassisInstalados.has(c)) return true;
    return false;
  }, [placasInstaladas, chassisInstalados]);

  // Build SGA lookup maps by status (keyed by normalized placa)
  const sgaByPlaca = useMemo(() => {
    const map = new Map<string, ERPVeiculoFlat>();
    for (const v of erpData) {
      const p = normPlaca(v.placa);
      if (p) map.set(p, v);
    }
    return map;
  }, [erpData]);

  // Helper: find the SGA record that matches a planilha record
  const findSGAMatch = useCallback((r: RastreadorInstalado): ERPVeiculoFlat | undefined => {
    const p = normPlaca(r.placa);
    if (p) {
      const match = sgaByPlaca.get(p);
      if (match) return match;
    }
    // Fallback: try chassi match (slower, linear scan)
    const c = normChassi(r.chassi);
    if (c) {
      return erpData.find((v) => normChassi(v.chassi) === c);
    }
    return undefined;
  }, [sgaByPlaca, erpData]);

  // Tab 2: Pendentes de Instalacao - SGA vehicles with tem_rastreador=true AND status_veiculo="ativo" NOT in planilha
  const pendentesInstalacao = useMemo(() => {
    if (!erpLoaded) return [];
    return erpData.filter(
      (v) => v.tem_produto_rastreador && v.status_sga === "ativo" && !isInstalledInPlanilha(v.placa, v.chassi)
    );
  }, [erpData, erpLoaded, isInstalledInPlanilha]);

  // Tab 3: Inadimplentes - planilha records (with placa/chassi) matching SGA status_veiculo="inadimplente"
  const inadimplentesComRastreador = useMemo(() => {
    if (!erpLoaded) return [];
    const sgaInadimplentePlacas = new Set(
      erpData.filter((v) => v.status_sga === "inadimplente").map((v) => normPlaca(v.placa)).filter(Boolean)
    );
    const sgaInadimplenteChassis = new Set(
      erpData.filter((v) => v.status_sga === "inadimplente").map((v) => normChassi(v.chassi)).filter(Boolean)
    );
    return instalados.filter((r) => {
      const p = normPlaca(r.placa);
      if (p && sgaInadimplentePlacas.has(p)) return true;
      const c = normChassi(r.chassi);
      if (c && sgaInadimplenteChassis.has(c)) return true;
      return false;
    });
  }, [instalados, erpData, erpLoaded]);

  // Tab 4: Inativos - planilha records (with placa/chassi) matching SGA status_veiculo="inativo" or "cancelado"
  const inativosComRastreador = useMemo(() => {
    if (!erpLoaded) return [];
    const sgaInativoPlacas = new Set(
      erpData.filter((v) => v.status_sga === "inativo" || v.status_sga === "cancelado").map((v) => normPlaca(v.placa)).filter(Boolean)
    );
    const sgaInativoChassis = new Set(
      erpData.filter((v) => v.status_sga === "inativo" || v.status_sga === "cancelado").map((v) => normChassi(v.chassi)).filter(Boolean)
    );
    return instalados.filter((r) => {
      const p = normPlaca(r.placa);
      if (p && sgaInativoPlacas.has(p)) return true;
      const c = normChassi(r.chassi);
      if (c && sgaInativoChassis.has(c)) return true;
      return false;
    });
  }, [instalados, erpData, erpLoaded]);

  // Tab 5: Sem Produto (Irregular) - instalados na plataforma mas SEM produto rastreador no SGA
  const semProduto = useMemo(() => {
    if (!erpLoaded) return [];
    const erpSemProdutoPlacas = new Set(
      erpData.filter((v) => !v.tem_produto_rastreador).map((v) => normPlaca(v.placa)).filter(Boolean)
    );
    return instalados.filter((r) => erpSemProdutoPlacas.has(normPlaca(r.placa)));
  }, [instalados, erpData, erpLoaded]);

  // ---- Search filter (Tab 1) ----
  const filtrados = useMemo(() => {
    if (!busca.trim()) return typed;
    const termo = busca.toLowerCase();
    return typed.filter(
      (r) =>
        (r.placa || "").toLowerCase().includes(termo) ||
        (r.imei || "").toLowerCase().includes(termo) ||
        (r.chassi || "").toLowerCase().includes(termo) ||
        (r.associado || "").toLowerCase().includes(termo)
    );
  }, [typed, busca]);

  const filtradosPaginados = useMemo(() => filtrados.slice(0, limiteExibido), [filtrados, limiteExibido]);

  // ---- Stats ----
  const totalInstalados = instalados.length;
  const totalEstoque = estoque.length;

  // Ativos = planilha records (with placa/chassi) that match SGA record with status_veiculo="ativo"
  const totalAtivos = useMemo(() => {
    if (!erpLoaded) return 0;
    const sgaAtivoPlacas = new Set(
      erpData.filter((v) => v.status_sga === "ativo").map((v) => normPlaca(v.placa)).filter(Boolean)
    );
    const sgaAtivoChassis = new Set(
      erpData.filter((v) => v.status_sga === "ativo").map((v) => {
        const c = (v.chassi || "").toUpperCase().trim();
        return c.length >= 10 ? c : "";
      }).filter(Boolean)
    );
    return instalados.filter((r) => {
      const p = normPlaca(r.placa);
      if (p && sgaAtivoPlacas.has(p)) return true;
      const c = (r.chassi || "").toUpperCase().trim();
      if (c.length >= 10 && sgaAtivoChassis.has(c)) return true;
      return false;
    }).length;
  }, [instalados, erpData, erpLoaded]);

  const totalInadimplentes = inadimplentesComRastreador.length;
  const totalInativos = inativosComRastreador.length;

  // Sem correspondencia = instalados na planilha que nao tem match nenhum no SGA
  const semCorrespondencia = useMemo(() => {
    if (!erpLoaded) return [];
    const allSGAPlacas = new Set(erpData.map((v) => normPlaca(v.placa)).filter(Boolean));
    const allSGAChassis = new Set(erpData.map((v) => normChassi(v.chassi)).filter(Boolean));
    return instalados.filter((r) => {
      const p = normPlaca(r.placa);
      if (p && allSGAPlacas.has(p)) return false;
      const c = normChassi(r.chassi);
      if (c && allSGAChassis.has(c)) return false;
      return true; // no match
    });
  }, [instalados, erpData, erpLoaded]);
  const totalSemCorrespondencia = semCorrespondencia.length;

  // ---- Filtered cross-reference data ----

  // Pendentes filtered
  const pendenteCooperativas = useMemo(() => {
    const set = new Set(pendentesInstalacao.map((v) => v.cooperativa).filter(Boolean));
    return Array.from(set).sort();
  }, [pendentesInstalacao]);

  const pendentesFiltrados = useMemo(() => {
    let data = pendentesInstalacao;
    if (pendenteFilial !== "todas") {
      data = data.filter((v) => v.cooperativa === pendenteFilial);
    }
    if (pendenteBusca.trim()) {
      const termo = pendenteBusca.toLowerCase();
      data = data.filter(
        (v) =>
          v.placa.toLowerCase().includes(termo) ||
          v.associado.toLowerCase().includes(termo) ||
          v.cpf.toLowerCase().includes(termo) ||
          v.cooperativa.toLowerCase().includes(termo)
      );
    }
    return data;
  }, [pendentesInstalacao, pendenteBusca, pendenteFilial]);

  // Inadimplentes filtered
  const inadimplCooperativas = useMemo(() => {
    const set = new Set(inadimplentesComRastreador.map((r) => {
      const match = findSGAMatch(r);
      return match?.cooperativa || r.cooperativa || "";
    }).filter(Boolean));
    return Array.from(set).sort();
  }, [inadimplentesComRastreador, findSGAMatch]);

  const inadimplFiltrados = useMemo(() => {
    let data = inadimplentesComRastreador;
    if (inadimplFilial !== "todas") {
      data = data.filter((r) => {
        const match = findSGAMatch(r);
        const coop = match?.cooperativa || r.cooperativa || "";
        return coop === inadimplFilial;
      });
    }
    if (inadimplBusca.trim()) {
      const termo = inadimplBusca.toLowerCase();
      data = data.filter((r) => {
        const match = findSGAMatch(r);
        return (
          (r.placa || "").toLowerCase().includes(termo) ||
          (r.imei || "").toLowerCase().includes(termo) ||
          (match?.associado || r.associado || "").toLowerCase().includes(termo) ||
          (match?.cooperativa || r.cooperativa || "").toLowerCase().includes(termo)
        );
      });
    }
    return data;
  }, [inadimplentesComRastreador, inadimplBusca, inadimplFilial, findSGAMatch]);

  // Inativos filtered
  const inativoCooperativas = useMemo(() => {
    const set = new Set(inativosComRastreador.map((r) => {
      const match = findSGAMatch(r);
      return match?.cooperativa || r.cooperativa || "";
    }).filter(Boolean));
    return Array.from(set).sort();
  }, [inativosComRastreador, findSGAMatch]);

  const inativosFiltrados = useMemo(() => {
    let data = inativosComRastreador;
    if (inativoFilial !== "todas") {
      data = data.filter((r) => {
        const match = findSGAMatch(r);
        const coop = match?.cooperativa || r.cooperativa || "";
        return coop === inativoFilial;
      });
    }
    if (inativoBusca.trim()) {
      const termo = inativoBusca.toLowerCase();
      data = data.filter((r) => {
        const match = findSGAMatch(r);
        return (
          (r.placa || "").toLowerCase().includes(termo) ||
          (r.imei || "").toLowerCase().includes(termo) ||
          (match?.associado || r.associado || "").toLowerCase().includes(termo) ||
          (match?.cooperativa || r.cooperativa || "").toLowerCase().includes(termo)
        );
      });
    }
    return data;
  }, [inativosComRastreador, inativoBusca, inativoFilial, findSGAMatch]);

  // Sem Correspondencia filtered
  const semCorrespCooperativas = useMemo(() => {
    const set = new Set(semCorrespondencia.map((r) => r.cooperativa || "").filter(Boolean));
    return Array.from(set).sort();
  }, [semCorrespondencia]);

  const semCorrespFiltrados = useMemo(() => {
    let data = semCorrespondencia;
    if (semCorrespFilial !== "todas") {
      data = data.filter((r) => (r.cooperativa || "") === semCorrespFilial);
    }
    if (semCorrespBusca.trim()) {
      const termo = semCorrespBusca.toLowerCase();
      data = data.filter(
        (r) =>
          (r.placa || "").toLowerCase().includes(termo) ||
          (r.imei || "").toLowerCase().includes(termo) ||
          (r.associado || "").toLowerCase().includes(termo) ||
          (r.cooperativa || "").toLowerCase().includes(termo)
      );
    }
    return data;
  }, [semCorrespondencia, semCorrespBusca, semCorrespFilial]);

  // Console log for debugging cross-reference numbers
  useMemo(() => {
    if (!erpLoaded) return;
    console.log("[GestaoRastreadores] Cross-reference stats:", {
      totalInstalados,
      totalEstoque,
      totalAtivos,
      totalInadimplentes,
      totalInativos,
      totalSemCorrespondencia,
      pendentesInstalacao: pendentesInstalacao.length,
      inativos: inativosComRastreador.length,
      semCorrespondencia: semCorrespondencia.length,
      sgaCacheRecords: erpData.length,
      planilhaRecords: typed.length,
      placasInstaladasSetSize: placasInstaladas.size,
      chassisInstaladosSetSize: chassisInstalados.size,
    });
  }, [erpLoaded, totalInstalados, totalEstoque, totalAtivos, totalInadimplentes, totalInativos, pendentesInstalacao, inativosComRastreador, semProduto, erpData, typed, placasInstaladas, chassisInstalados]);

  // ---- Handlers ----

  const criarRegistro = async () => {
    if (!novoForm.placa || !novoForm.imei) {
      toast.error("Placa e IMEI sao obrigatorios");
      return;
    }
    try {
      await insertRastreador.mutateAsync(novoForm);
      setNovoOpen(false);
      setNovoForm({ ...emptyForm });
      toast.success("Rastreador registrado com sucesso");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const salvarEdicao = async () => {
    if (!detailItem) return;
    try {
      await updateRastreador.mutateAsync({ id: detailItem.id, ...editForm });
      setDetailItem(null);
      toast.success("Registro atualizado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const abrirDetalhe = (item: RastreadorInstalado) => {
    setDetailItem(item);
    setEditForm({
      status: item.status,
      encaminhamento: item.encaminhamento,
      observacao: item.observacao,
      motivo_nao_retirada: item.motivo_nao_retirada,
      justificativa: item.justificativa,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      if (!rows.length) {
        toast.error("Planilha vazia");
        return;
      }

      let inseridos = 0;
      let erros = 0;

      for (const row of rows) {
        try {
          await insertRastreador.mutateAsync({
            placa: (row.placa || row.Placa || "").toString().toUpperCase().trim(),
            chassi: (row.chassi || row.Chassi || "").toString().trim(),
            imei: (row.imei || row.IMEI || "").toString().trim(),
            simcard: (row.simcard || row.sim_card || row.SIM || "").toString().trim(),
            modelo_rastreador: (row.modelo_rastreador || row.modelo || row.Modelo || "").toString().trim(),
            veiculo: (row.veiculo || row.Veiculo || "").toString().trim(),
            associado: (row.associado || row.Associado || "").toString().trim(),
            cpf: (row.cpf || row.CPF || "").toString().trim(),
            cooperativa: (row.cooperativa || row.Cooperativa || "").toString().trim(),
            status: "instalado",
            encaminhamento: "pendente",
            observacao: (row.observacao || row.Observacao || "").toString().trim(),
          });
          inseridos++;
        } catch {
          erros++;
        }
      }

      toast.success(`Importacao concluida: ${inseridos} inseridos, ${erros} erros`);
    } catch (err: any) {
      toast.error("Erro ao ler planilha: " + (err.message || "Formato invalido"));
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const updateInline = async (id: string, updates: Partial<RastreadorInstalado>) => {
    try {
      await updateRastreador.mutateAsync({ id, ...updates });
      toast.success("Atualizado");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Gestao de Rastreadores" subtitle="Controle de rastreadores instalados e cruzamento com SGA" />
        <TableSkeleton rows={6} cols={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gestao de Rastreadores" subtitle="Controle de rastreadores instalados e cruzamento com SGA">
        <div className="flex gap-2">
          <Button variant="outline" onClick={importarSGA} disabled={erpRefreshing}>
            {erpRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            {erpRefreshing ? "Atualizando..." : "Atualizar do SGA"}
          </Button>
        </div>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setLimiteExibido(PAGE_SIZE); setPendenteLimite(PAGE_SIZE); setInadimplLimite(PAGE_SIZE); setInativoLimite(PAGE_SIZE); setSemCorrespLimite(PAGE_SIZE); }}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="todos">Todos Instalados</TabsTrigger>
          <TabsTrigger value="pendentes">
            Pendentes de Instalacao
            {erpLoaded && pendentesInstalacao.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5">{pendentesInstalacao.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inadimplentes">
            Inadimplentes
            {inadimplentesComRastreador.length > 0 && (
              <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5">{inadimplentesComRastreador.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inativos">
            Inativos
            {inativosComRastreador.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{inativosComRastreador.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="irregulares">
            Sem Correspondencia
            {erpLoaded && semCorrespondencia.length > 0 && (
              <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5">{semCorrespondencia.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
        </TabsList>

        {/* ============ TAB 1: TODOS INSTALADOS ============ */}
        <TabsContent value="todos" className="space-y-4 mt-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Instalados" value={totalInstalados} icon={Radio} accent="primary" />
            <StatCard label="Ativos no SGA" value={totalAtivos} icon={CheckCircle2} accent="success" />
            <StatCard label="Inadimpl. + Inativos" value={totalInadimplentes + totalInativos} icon={AlertTriangle} accent="warning" />
            <StatCard label="Sem Correspondencia" value={totalSemCorrespondencia} icon={FileWarning} accent="destructive" />
          </div>

          {/* Actions + Search */}
          <Card className="p-4 card-shadow">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, IMEI, chassi ou associado..."
                  value={busca}
                  onChange={(e) => { setBusca(e.target.value); setLimiteExibido(PAGE_SIZE); }}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setNovoOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Novo Registro
                </Button>
                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4 mr-1" /> Importar Planilha
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </Card>

          {/* Table */}
          <Card className="card-shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Chassi</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>SIM Card</TableHead>
                  <TableHead>Modelo Rastreador</TableHead>
                  <TableHead>Veiculo</TableHead>
                  <TableHead>Associado</TableHead>
                  <TableHead>Cooperativa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Encaminhamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradosPaginados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <EmptyState message="Nenhum rastreador instalado encontrado" />
                    </TableCell>
                  </TableRow>
                )}
                {filtradosPaginados.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => abrirDetalhe(r)}>
                    <TableCell className="font-mono font-medium text-sm">{r.placa}</TableCell>
                    <TableCell className="font-mono text-xs">{r.chassi || "--"}</TableCell>
                    <TableCell className="font-mono text-xs">{r.imei}</TableCell>
                    <TableCell className="font-mono text-xs">{r.simcard || "--"}</TableCell>
                    <TableCell className="text-sm">{r.modelo_rastreador || "--"}</TableCell>
                    <TableCell className="text-sm">{r.veiculo || "--"}</TableCell>
                    <TableCell className="text-sm">{r.associado || "--"}</TableCell>
                    <TableCell className="text-sm">{r.cooperativa || "--"}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[r.status]?.variant || "secondary"}>
                        {statusMap[r.status]?.label || r.status || "--"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{encaminhamentoMap[r.encaminhamento] || r.encaminhamento || "--"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filtrados.length > limiteExibido && (
              <div className="flex justify-center py-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setLimiteExibido((l) => l + PAGE_SIZE)}>
                  Carregar mais ({filtrados.length - limiteExibido} restantes)
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ============ TAB 2: PENDENTES DE INSTALACAO ============ */}
        <TabsContent value="pendentes" className="space-y-4 mt-4">
          {!erpLoaded ? (
            <Card className="p-12 text-center card-shadow">
              <Download className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {sgaCacheLoading ? "Carregando cache SGA..." : "Atualize os dados do SGA para visualizar veiculos pendentes de instalacao."}
              </p>
              <Button onClick={importarSGA} disabled={erpRefreshing}>
                {erpRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Atualizar do SGA
              </Button>
            </Card>
          ) : (
            <>
              <Card className="p-4 card-shadow">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por placa, associado, CPF ou cooperativa..."
                      value={pendenteBusca}
                      onChange={(e) => { setPendenteBusca(e.target.value); setPendenteLimite(PAGE_SIZE); }}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={pendenteFilial} onValueChange={(v) => { setPendenteFilial(v); setPendenteLimite(PAGE_SIZE); }}>
                      <SelectTrigger className="w-[200px] h-9 text-sm">
                        <SelectValue placeholder="Cooperativa: Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas Cooperativas</SelectItem>
                        {pendenteCooperativas.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        exportExcel(
                          pendentesFiltrados.map((v) => ({
                            Associado: v.associado,
                            CPF: v.cpf,
                            Telefone: v.telefone,
                            Placa: v.placa,
                            Veiculo: v.veiculo,
                            Cooperativa: v.cooperativa,
                            Status_SGA: v.status_sga,
                          })),
                          "pendentes_instalacao"
                        )
                      }
                    >
                      <Download className="w-4 h-4 mr-1" /> Excel
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {pendentesFiltrados.length} de {pendentesInstalacao.length} registros
                  {(pendenteBusca || pendenteFilial !== "todas") && " (filtrado)"}
                </p>
              </Card>
              <Card className="card-shadow overflow-x-auto">
                <div className="p-4 border-b bg-green-50/50">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Associados ATIVOS com produto rastreador no SGA que ainda NAO tem rastreador instalado na plataforma.
                  </p>
                  <p className="text-xs text-green-700">
                    Acao: agendar instalacao.
                  </p>
                </div>
                <Table data-print-table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Associado</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Placa</TableHead>
                      <TableHead>Veiculo</TableHead>
                      <TableHead>Cooperativa</TableHead>
                      <TableHead>Status SGA</TableHead>
                      <TableHead>Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendentesFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <EmptyState message="Nenhum veiculo pendente de instalacao" />
                        </TableCell>
                      </TableRow>
                    )}
                    {pendentesFiltrados.slice(0, pendenteLimite).map((v, i) => (
                      <TableRow key={`${v.placa}-${i}`}>
                        <TableCell className="text-sm font-medium">{v.associado}</TableCell>
                        <TableCell className="font-mono text-xs">{v.cpf}</TableCell>
                        <TableCell className="text-sm">{v.telefone || "--"}</TableCell>
                        <TableCell className="font-mono font-medium text-sm">{v.placa}</TableCell>
                        <TableCell className="text-sm">{v.veiculo}</TableCell>
                        <TableCell className="text-sm">{v.cooperativa}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="text-[9px] bg-green-600">Ativo</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              setNovoForm({
                                ...emptyForm,
                                placa: v.placa,
                                associado: v.associado,
                                cpf: v.cpf,
                                veiculo: v.veiculo,
                                cooperativa: v.cooperativa,
                              });
                              setNovoOpen(true);
                            }}
                          >
                            Agendar Instalacao
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {pendentesFiltrados.length > pendenteLimite && (
                  <div className="flex justify-center py-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setPendenteLimite((l) => l + PAGE_SIZE)}>
                      Carregar mais ({pendentesFiltrados.length - pendenteLimite} restantes)
                    </Button>
                  </div>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        {/* ============ TAB 3: INADIMPLENTES COM RASTREADOR ============ */}
        <TabsContent value="inadimplentes" className="space-y-4 mt-4">
          <Card className="p-4 card-shadow">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, IMEI, associado ou cooperativa..."
                  value={inadimplBusca}
                  onChange={(e) => { setInadimplBusca(e.target.value); setInadimplLimite(PAGE_SIZE); }}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Select value={inadimplFilial} onValueChange={(v) => { setInadimplFilial(v); setInadimplLimite(PAGE_SIZE); }}>
                  <SelectTrigger className="w-[200px] h-9 text-sm">
                    <SelectValue placeholder="Cooperativa: Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas Cooperativas</SelectItem>
                    {inadimplCooperativas.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportExcel(
                      inadimplFiltrados.map((r) => {
                        const match = findSGAMatch(r);
                        return {
                          Associado: match?.associado || r.associado || "",
                          CPF: match?.cpf || "",
                          Telefone: match?.telefone || "",
                          Placa: r.placa || "",
                          Veiculo: match?.veiculo || "",
                          Cooperativa: match?.cooperativa || r.cooperativa || "",
                          IMEI: r.imei || "",
                          Status_SGA: "Inadimplente",
                          Encaminhamento: encaminhamentoMap[r.encaminhamento] || r.encaminhamento || "",
                          Observacao: r.observacao || "",
                        };
                      }),
                      "inadimplentes_rastreador"
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-1" /> Excel
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {inadimplFiltrados.length} de {inadimplentesComRastreador.length} registros
              {(inadimplBusca || inadimplFilial !== "todas") && " (filtrado)"}
            </p>
          </Card>
          <Card className="card-shadow overflow-x-auto">
            <div className="p-4 border-b bg-orange-50/50">
              <p className="text-sm font-medium text-orange-800 mb-1">
                Associados INADIMPLENTES no SGA que possuem rastreador instalado na plataforma.
              </p>
              <p className="text-xs text-orange-700">
                Todos os {inadimplFiltrados.length} registros abaixo tem rastreador fisicamente instalado no veiculo. Encaminhe para cobranca ou agende a retirada do equipamento.
              </p>
            </div>
            <Table data-print-table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associado</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Veiculo</TableHead>
                  <TableHead>Cooperativa</TableHead>
                  <TableHead>Rastreador (IMEI)</TableHead>
                  <TableHead>Situacao SGA</TableHead>
                  <TableHead>Encaminhamento</TableHead>
                  <TableHead>Observacao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inadimplFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <EmptyState message="Nenhum inadimplente com rastreador" />
                    </TableCell>
                  </TableRow>
                )}
                {inadimplFiltrados.slice(0, inadimplLimite).map((r) => {
                  const sgaMatch = findSGAMatch(r);
                  return (
                  <TableRow key={r.id} className="hover:bg-orange-50/30">
                    <TableCell className="font-medium text-sm">{sgaMatch?.associado || r.associado || "--"}</TableCell>
                    <TableCell className="font-mono text-xs">{sgaMatch?.cpf || "--"}</TableCell>
                    <TableCell className="text-sm">{sgaMatch?.telefone || "--"}</TableCell>
                    <TableCell className="font-mono font-medium text-sm">{r.placa || "--"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sgaMatch?.veiculo || "--"}</TableCell>
                    <TableCell className="text-sm">{sgaMatch?.cooperativa || r.cooperativa || "--"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="default" className="text-[9px] bg-green-600">Instalado</Badge>
                        <span className="font-mono text-xs">{r.imei}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="destructive" className="text-xs">Inadimplente</Badge></TableCell>
                    <TableCell>
                      <Select
                        value={r.encaminhamento || "pendente"}
                        onValueChange={(v) => updateInline(r.id, { encaminhamento: v })}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cobranca">Enviar p/ Cobranca</SelectItem>
                          <SelectItem value="retirada">Agendar Retirada</SelectItem>
                          <SelectItem value="pendente">Aguardando</SelectItem>
                          <SelectItem value="resolvido">Resolvido</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs w-[180px]"
                        placeholder="Observacao..."
                        defaultValue={r.observacao || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (r.observacao || "")) {
                            updateInline(r.id, { observacao: e.target.value });
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                  ); })}
              </TableBody>
            </Table>
            {inadimplFiltrados.length > inadimplLimite && (
              <div className="flex justify-center py-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setInadimplLimite((l) => l + PAGE_SIZE)}>
                  Carregar mais ({inadimplFiltrados.length - inadimplLimite} restantes)
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ============ TAB 4: INATIVOS COM RASTREADOR ============ */}
        <TabsContent value="inativos" className="space-y-4 mt-4">
          <Card className="p-4 card-shadow">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por placa, IMEI, associado ou cooperativa..."
                  value={inativoBusca}
                  onChange={(e) => { setInativoBusca(e.target.value); setInativoLimite(PAGE_SIZE); }}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Select value={inativoFilial} onValueChange={(v) => { setInativoFilial(v); setInativoLimite(PAGE_SIZE); }}>
                  <SelectTrigger className="w-[200px] h-9 text-sm">
                    <SelectValue placeholder="Cooperativa: Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas Cooperativas</SelectItem>
                    {inativoCooperativas.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    exportExcel(
                      inativosFiltrados.map((r) => {
                        const match = findSGAMatch(r);
                        return {
                          Associado: match?.associado || r.associado || "",
                          CPF: match?.cpf || "",
                          Telefone: match?.telefone || "",
                          Placa: r.placa || "",
                          Veiculo: match?.veiculo || "",
                          Cooperativa: match?.cooperativa || r.cooperativa || "",
                          IMEI: r.imei || "",
                          Status_SGA: "Inativo/Cancelado",
                          Motivo_Nao_Retirada: motivoNaoRetiradaMap[r.motivo_nao_retirada] || r.motivo_nao_retirada || "",
                          Observacao: r.observacao || "",
                        };
                      }),
                      "inativos_rastreador"
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-1" /> Excel
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {inativosFiltrados.length} de {inativosComRastreador.length} registros
              {(inativoBusca || inativoFilial !== "todas") && " (filtrado)"}
            </p>
          </Card>
          <Card className="card-shadow overflow-x-auto">
            <div className="p-4 border-b bg-red-50/50">
              <p className="text-sm font-medium text-red-800 mb-1">
                Associados INATIVOS ou CANCELADOS no SGA que ainda possuem rastreador instalado na plataforma.
              </p>
              <p className="text-xs text-red-700">
                Todos os {inativosFiltrados.length} registros abaixo tem rastreador fisicamente instalado mas o associado ja esta inativo. Agende a retirada e justifique caso nao tenha sido retirado.
              </p>
            </div>
            <Table data-print-table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associado</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Veiculo</TableHead>
                  <TableHead>Cooperativa</TableHead>
                  <TableHead>Rastreador (IMEI)</TableHead>
                  <TableHead>Situacao SGA</TableHead>
                  <TableHead>Motivo Nao Retirada</TableHead>
                  <TableHead>Observacao</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inativosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <EmptyState message="Nenhum inativo com rastreador" />
                    </TableCell>
                  </TableRow>
                )}
                {inativosFiltrados.slice(0, inativoLimite).map((r) => {
                  const sgaMatch = findSGAMatch(r);
                  return (
                  <TableRow key={r.id} className="hover:bg-red-50/30">
                    <TableCell className="font-medium text-sm">{sgaMatch?.associado || r.associado || "--"}</TableCell>
                    <TableCell className="font-mono text-xs">{sgaMatch?.cpf || "--"}</TableCell>
                    <TableCell className="text-sm">{sgaMatch?.telefone || "--"}</TableCell>
                    <TableCell className="font-mono font-medium text-sm">{r.placa || "--"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sgaMatch?.veiculo || "--"}</TableCell>
                    <TableCell className="text-sm">{sgaMatch?.cooperativa || r.cooperativa || "--"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="default" className="text-[9px] bg-green-600">Instalado</Badge>
                        <span className="font-mono text-xs">{r.imei}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Inativo</Badge></TableCell>
                    <TableCell>
                      <Select
                        value={r.motivo_nao_retirada || ""}
                        onValueChange={(v) => updateInline(r.id, { motivo_nao_retirada: v })}
                      >
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                          <SelectValue placeholder="Selecionar motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(motivoNaoRetiradaMap).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 text-xs w-[200px]"
                        placeholder="Observacao..."
                        defaultValue={r.observacao || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (r.observacao || "")) {
                            updateInline(r.id, { observacao: e.target.value });
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                  ); })}
              </TableBody>
            </Table>
            {inativosFiltrados.length > inativoLimite && (
              <div className="flex justify-center py-4 border-t">
                <Button variant="outline" size="sm" onClick={() => setInativoLimite((l) => l + PAGE_SIZE)}>
                  Carregar mais ({inativosFiltrados.length - inativoLimite} restantes)
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ============ TAB 5: SEM PRODUTO (IRREGULAR) ============ */}
        <TabsContent value="irregulares" className="space-y-4 mt-4">
          {!erpLoaded ? (
            <Card className="p-12 text-center card-shadow">
              <FileWarning className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {sgaCacheLoading ? "Carregando cache SGA..." : "Atualize os dados do SGA para identificar rastreadores irregulares (sem produto vinculado)."}
              </p>
              <Button onClick={importarSGA} disabled={erpRefreshing}>
                {erpRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Atualizar do SGA
              </Button>
            </Card>
          ) : (
            <>
              <Card className="p-4 card-shadow">
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por placa, IMEI, associado ou cooperativa..."
                      value={semCorrespBusca}
                      onChange={(e) => { setSemCorrespBusca(e.target.value); setSemCorrespLimite(PAGE_SIZE); }}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <Select value={semCorrespFilial} onValueChange={(v) => { setSemCorrespFilial(v); setSemCorrespLimite(PAGE_SIZE); }}>
                      <SelectTrigger className="w-[200px] h-9 text-sm">
                        <SelectValue placeholder="Cooperativa: Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas Cooperativas</SelectItem>
                        {semCorrespCooperativas.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        exportExcel(
                          semCorrespFiltrados.map((r) => ({
                            Placa: r.placa,
                            IMEI: r.imei,
                            Cooperativa: r.cooperativa || "",
                            Status: statusMap[r.status]?.label || r.status || "",
                            Observacao: r.justificativa || r.observacao || "",
                          })),
                          "sem_correspondencia"
                        )
                      }
                    >
                      <Download className="w-4 h-4 mr-1" /> Excel
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {semCorrespFiltrados.length} de {semCorrespondencia.length} registros
                  {(semCorrespBusca || semCorrespFilial !== "todas") && " (filtrado)"}
                </p>
              </Card>
              <Card className="card-shadow overflow-x-auto">
                <div className="p-4 border-b bg-amber-50/50">
                  <p className="text-sm font-medium text-amber-800 mb-1">
                    Rastreadores instalados na plataforma cuja placa NAO foi encontrada no SGA.
                  </p>
                  <p className="text-xs text-amber-700">
                    Verificar se a placa esta correta ou se o veiculo foi removido do sistema.
                  </p>
                </div>
                <Table data-print-table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Placa</TableHead>
                      <TableHead>IMEI</TableHead>
                      <TableHead>Cooperativa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Observacao</TableHead>
                      <TableHead>Acao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {semCorrespFiltrados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <EmptyState message="Nenhum rastreador sem correspondencia encontrado" />
                        </TableCell>
                      </TableRow>
                    )}
                    {semCorrespFiltrados.slice(0, semCorrespLimite).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono font-medium text-sm">{r.placa}</TableCell>
                        <TableCell className="font-mono text-xs">{r.imei}</TableCell>
                        <TableCell className="text-sm">{r.cooperativa || "--"}</TableCell>
                        <TableCell>
                          <Badge variant={statusMap[r.status]?.variant || "secondary"}>
                            {statusMap[r.status]?.label || r.status || "--"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Input
                            className="h-8 text-xs w-[200px]"
                            placeholder="Observacao..."
                            defaultValue={r.justificativa || ""}
                            onBlur={(e) => {
                              if (e.target.value !== (r.justificativa || "")) {
                                updateInline(r.id, { justificativa: e.target.value });
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => updateInline(r.id, { status: "irregular", encaminhamento: "regularizacao" })}
                          >
                            Marcar Irregular
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {semCorrespFiltrados.length > semCorrespLimite && (
                  <div className="flex justify-center py-4 border-t">
                    <Button variant="outline" size="sm" onClick={() => setSemCorrespLimite((l) => l + PAGE_SIZE)}>
                      Carregar mais ({semCorrespFiltrados.length - semCorrespLimite} restantes)
                    </Button>
                  </div>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        {/* ============ TAB 6: RESUMO ============ */}
        <TabsContent value="resumo" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Plataforma" value={totalInstalados} icon={Radio} accent="primary" />
            <StatCard
              label="Pendentes Instalacao"
              value={erpLoaded ? pendentesInstalacao.length : "--"}
              icon={Clock}
              accent="warning"
            />
            <StatCard
              label="Inadimplentes c/ Rastreador"
              value={inadimplentesComRastreador.length}
              icon={AlertTriangle}
              accent="destructive"
            />
            <StatCard
              label="Inativos c/ Rastreador"
              value={inativosComRastreador.length}
              icon={XCircle}
              accent="muted"
            />
            <StatCard
              label="Irregulares"
              value={erpLoaded ? semCorrespondencia.length : "--"}
              icon={FileWarning}
              accent="destructive"
            />
          </div>

          {/* Cooperativa breakdown */}
          {typed.length > 0 && (
            <Card className="p-6 card-shadow">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Distribuicao por Cooperativa
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(
                  typed.reduce<Record<string, number>>((acc, r) => {
                    const key = r.cooperativa || "Sem cooperativa";
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                  }, {})
                )
                  .sort((a, b) => b[1] - a[1])
                  .map(([coop, count]) => (
                    <div key={coop} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium truncate mr-2">{coop}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                exportExcel(
                  typed.map((r) => ({
                    Placa: r.placa,
                    Chassi: r.chassi,
                    IMEI: r.imei,
                    SIM_Card: r.simcard,
                    Modelo: r.modelo_rastreador,
                    Veiculo: r.veiculo,
                    Associado: r.associado,
                    CPF: r.cpf,
                    Cooperativa: r.cooperativa,
                    Status: r.status,
                    Encaminhamento: r.encaminhamento,
                    Observacao: r.observacao,
                  })),
                  "rastreadores_instalados"
                )
              }
            >
              <Download className="w-4 h-4 mr-1" /> Excel
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============ DETAIL SHEET ============ */}
      <Sheet open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Rastreador</SheetTitle>
          </SheetHeader>
          {detailItem && (
            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Placa</p>
                  <p className="font-mono font-medium">{detailItem.placa}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IMEI</p>
                  <p className="font-mono font-medium">{detailItem.imei}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Chassi</p>
                  <p className="font-mono text-sm">{detailItem.chassi || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SIM Card</p>
                  <p className="font-mono text-sm">{detailItem.simcard || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Modelo Rastreador</p>
                  <p className="text-sm">{detailItem.modelo_rastreador || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Veiculo</p>
                  <p className="text-sm">{detailItem.veiculo || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Associado</p>
                  <p className="text-sm font-medium">{detailItem.associado || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cooperativa</p>
                  <p className="text-sm">{detailItem.cooperativa || "--"}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={editForm.status || "instalado"}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instalado">Instalado</SelectItem>
                      <SelectItem value="pendente_retirada">Pendente Retirada</SelectItem>
                      <SelectItem value="retirado">Retirado</SelectItem>
                      <SelectItem value="irregular">Irregular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Encaminhamento</Label>
                  <Select
                    value={editForm.encaminhamento || "pendente"}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, encaminhamento: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="cobranca">Cobranca</SelectItem>
                      <SelectItem value="retirada">Retirada</SelectItem>
                      <SelectItem value="regularizacao">Regularizacao</SelectItem>
                      <SelectItem value="resolvido">Resolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Motivo Nao Retirada</Label>
                  <Select
                    value={editForm.motivo_nao_retirada || ""}
                    onValueChange={(v) => setEditForm((f) => ({ ...f, motivo_nao_retirada: v }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecionar motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Nenhum</SelectItem>
                      {Object.entries(motivoNaoRetiradaMap).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Observacao</Label>
                  <Textarea
                    className="mt-1"
                    rows={3}
                    value={editForm.observacao || ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, observacao: e.target.value }))}
                    placeholder="Observacoes sobre o rastreador..."
                  />
                </div>

                <Button className="w-full" onClick={salvarEdicao}>
                  Salvar Alteracoes
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ============ NOVO REGISTRO DIALOG ============ */}
      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Rastreador Instalado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placa *</Label>
                <Input
                  value={novoForm.placa || ""}
                  onChange={(e) => setNovoForm((f) => ({ ...f, placa: e.target.value.toUpperCase() }))}
                  placeholder="ABC1D23"
                />
              </div>
              <div>
                <Label>IMEI *</Label>
                <Input
                  value={novoForm.imei || ""}
                  onChange={(e) => setNovoForm((f) => ({ ...f, imei: e.target.value }))}
                  placeholder="IMEI do rastreador"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chassi</Label>
                <Input
                  value={novoForm.chassi || ""}
                  onChange={(e) => setNovoForm((f) => ({ ...f, chassi: e.target.value }))}
                  placeholder="Chassi do veiculo"
                />
              </div>
              <div>
                <Label>SIM Card</Label>
                <Input
                  value={novoForm.simcard || ""}
                  onChange={(e) => setNovoForm((f) => ({ ...f, simcard: e.target.value }))}
                  placeholder="Numero do SIM Card"
                />
              </div>
            </div>
            <div>
              <Label>Modelo do Rastreador</Label>
              <Input
                value={novoForm.modelo_rastreador || ""}
                onChange={(e) => setNovoForm((f) => ({ ...f, modelo_rastreador: e.target.value }))}
                placeholder="Ex: Suntech ST340LC"
              />
            </div>
            <div>
              <Label>Veiculo (marca/modelo)</Label>
              <Input
                value={novoForm.veiculo || ""}
                onChange={(e) => setNovoForm((f) => ({ ...f, veiculo: e.target.value }))}
                placeholder="Ex: Fiat Uno 2020"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Associado</Label>
                <Input
                  value={novoForm.associado || ""}
                  onChange={(e) => setNovoForm((f) => ({ ...f, associado: e.target.value }))}
                  placeholder="Nome do associado"
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={novoForm.cpf || ""}
                  onChange={(e) => setNovoForm((f) => ({ ...f, cpf: e.target.value }))}
                  placeholder="CPF do associado"
                />
              </div>
            </div>
            <div>
              <Label>Cooperativa</Label>
              <FilialSelect
                value={novoForm.cooperativa || ""}
                onValueChange={(v) => setNovoForm((f) => ({ ...f, cooperativa: v }))}
                placeholder="Selecione a cooperativa"
              />
            </div>
            <div>
              <Label>Observacao</Label>
              <Textarea
                value={novoForm.observacao || ""}
                onChange={(e) => setNovoForm((f) => ({ ...f, observacao: e.target.value }))}
                placeholder="Observacoes adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNovoOpen(false); setNovoForm({ ...emptyForm }); }}>
              Cancelar
            </Button>
            <Button onClick={criarRegistro}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---- Helper Components ----

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-2 text-center">
      <div className="rounded-full bg-muted/60 p-3">
        <Inbox className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

export default GestaoRastreadores;
