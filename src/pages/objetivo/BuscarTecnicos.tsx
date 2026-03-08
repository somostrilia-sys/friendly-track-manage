import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Phone, Mail } from "lucide-react";
import { useState } from "react";

const resultadosMock = [
  { id: "1", nome: "Auto Elétrica Santos", cnpj: "11.222.333/0001-44", cnae: "4321-5/00", cidade: "Campinas", estado: "SP", telefone: "(19) 3232-1234", email: "contato@autoeletricasantos.com.br" },
  { id: "2", nome: "Rastreadores & Cia", cnpj: "22.333.444/0001-55", cnae: "4530-7/03", cidade: "Ribeirão Preto", estado: "SP", telefone: "(16) 3636-5678", email: "cia@rastreadores.com.br" },
  { id: "3", nome: "TechVeicular Instalações", cnpj: "33.444.555/0001-66", cnae: "4541-2/06", cidade: "Goiânia", estado: "GO", telefone: "(62) 3434-9012", email: "tech@veicular.com.br" },
  { id: "4", nome: "Elétrica & Som Automotivo", cnpj: "44.555.666/0001-77", cnae: "4321-5/00", cidade: "Uberlândia", estado: "MG", telefone: "(34) 3232-3456", email: "eletrica@som.com.br" },
];

const estados = ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"];

const BuscarTecnicos = () => {
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [buscou, setBuscou] = useState(false);

  const handleBuscar = () => setBuscou(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Buscar Técnicos</h1>
        <p className="text-muted-foreground text-sm">
          Busca por CNAE na Receita Federal (4321-5/00, 4530-7/03, 4541-2/06) + Google
        </p>
      </div>

      <Card className="p-6 card-shadow">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-sm font-medium mb-1.5 block">Cidade</label>
            <Input placeholder="Ex: Campinas" value={cidade} onChange={e => setCidade(e.target.value)} />
          </div>
          <div className="w-full md:w-48">
            <label className="text-sm font-medium mb-1.5 block">Estado</label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent>
                {estados.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleBuscar}><Search className="w-4 h-4 mr-2" /> Buscar</Button>
          </div>
        </div>
      </Card>

      {buscou && (
        <Card className="card-shadow">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Resultados encontrados: {resultadosMock.length}</h3>
            <p className="text-xs text-muted-foreground">CNAEs: 4321-5/00, 4530-7/03, 4541-2/06</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>CNAE</TableHead>
                <TableHead>Cidade/UF</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultadosMock.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.cnpj}</TableCell>
                  <TableCell><Badge variant="secondary">{r.cnae}</Badge></TableCell>
                  <TableCell>{r.cidade}/{r.estado}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{r.telefone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{r.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="text-xs">
                      <MapPin className="w-3 h-3 mr-1" /> Cadastrar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default BuscarTecnicos;
