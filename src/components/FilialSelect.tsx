import { useFiliais } from "@/hooks/useSupabaseData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilialSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  includeAll?: boolean;
  allLabel?: string;
  allValue?: string;
  disabled?: boolean;
}

export function FilialSelect({
  value,
  onValueChange,
  placeholder = "Selecione a filial",
  includeAll = false,
  allLabel = "Todas as Cooperativas",
  allValue = "todas",
  disabled = false,
}: FilialSelectProps) {
  const { data: filiais = [] } = useFiliais();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value={allValue}>{allLabel}</SelectItem>}
        {filiais.map((f) => (
          <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
