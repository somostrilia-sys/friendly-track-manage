import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInsertTecnico } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { CheckCircle, UserPlus } from "lucide-react";

const TecnicoRegistro = () => {
  const insertTecnico = useInsertTecnico();
  const [sucesso, setSucesso] = useState(false);
  const [form, setForm] = useState({
    nome: "", cpf: "", telefone: "", email: "",
    cidade: "", estado: "", especialidade: "", regiao_atuacao: "",
    tipo_tecnico: "avulso" as "avulso" | "parceiro" | "proprio",
    valor_instalacao: 0, adicional_km: 0,
    periodo_pagamento: "quinzenal" as "quinzenal" | "mensal",
    chave_pix: "", banco: "",
  });

  const salvar = async () => {
    if (!form.nome || !form.cpf || !form.telefone) {
      toast.error("Preencha nome, CPF e telefone");
      return;
    }
    try {
      const prazoPadrao: Record<string, string> = { avulso: "2 dias uteis", parceiro: "5 dias uteis", proprio: "Conforme contrato" };
      await insertTecnico.mutateAsync({
        ...form,
        avaliacao: 0,
        instalacoes_mes: 0,
        equipamentos_em_estoque: 0,
        saldo_aberto: 0,
        valor_servico: form.valor_instalacao,
        status: "disponivel",
        status_ativo: "ativo",
        prazo_pagamento: prazoPadrao[form.tipo_tecnico],
      });
      setSucesso(true);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-4">
          <div className="mx-auto rounded-full bg-green-500/10 p-4 w-fit">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h2 className="text-xl font-bold">Cadastro Realizado!</h2>
          <p className="text-muted-foreground">Seu cadastro foi enviado com sucesso. Nossa equipe entrara em contato em breve.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto rounded-full bg-primary/10 p-3 w-fit">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Cadastro de Tecnico</h1>
          <p className="text-muted-foreground text-sm">Preencha seus dados para se cadastrar como tecnico parceiro da Trackit</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Label>Nome Completo *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} /></div>
          <div><Label>CPF *</Label><Input value={form.cpf} onChange={e => setForm(f => ({ ...f, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
          <div><Label>Telefone *</Label><Input value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div><Label>Tipo</Label>
            <Select value={form.tipo_tecnico} onValueChange={v => setForm(f => ({ ...f, tipo_tecnico: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="avulso">Avulso</SelectItem>
                <SelectItem value="parceiro">Parceiro</SelectItem>
                <SelectItem value="proprio">Proprio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Especialidade</Label><Input value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} placeholder="Rastreadores, cameras..." /></div>
          <div><Label>Regiao de Atuacao</Label><Input value={form.regiao_atuacao} onChange={e => setForm(f => ({ ...f, regiao_atuacao: e.target.value }))} placeholder="Grande SP, Interior PR..." /></div>
          <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm(f => ({ ...f, cidade: e.target.value }))} /></div>
          <div><Label>Estado</Label><Input value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))} placeholder="SP" /></div>
          <div><Label>Valor por Instalacao (R$)</Label><Input type="number" min={0} value={form.valor_instalacao || ""} onChange={e => setForm(f => ({ ...f, valor_instalacao: +e.target.value }))} placeholder="Quanto cobra por instalacao" /></div>
          <div><Label>Adicional por KM (R$/km)</Label><Input type="number" min={0} step="0.1" value={form.adicional_km || ""} onChange={e => setForm(f => ({ ...f, adicional_km: +e.target.value }))} placeholder="Valor adicional por km" /></div>
          <div><Label>Periodo de Pagamento</Label>
            <Select value={form.periodo_pagamento} onValueChange={v => setForm(f => ({ ...f, periodo_pagamento: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quinzenal">Quinzenal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Chave PIX</Label><Input value={form.chave_pix} onChange={e => setForm(f => ({ ...f, chave_pix: e.target.value }))} /></div>
          <div><Label>Banco</Label><Input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} /></div>
        </div>

        <Button className="w-full" size="lg" onClick={salvar} disabled={insertTecnico.isPending}>
          {insertTecnico.isPending ? "Enviando..." : "Enviar Cadastro"}
        </Button>
      </Card>
    </div>
  );
};

export default TecnicoRegistro;
