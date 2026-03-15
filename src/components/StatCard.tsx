import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "success" | "warning" | "destructive" | "muted";
  subtitle?: string;
  trend?: string;
  trendDirection?: "up" | "down";
}

const accentStyles = {
  primary: "text-primary bg-primary/10",
  success: "text-success bg-success/10",
  warning: "text-warning bg-warning/10",
  destructive: "text-destructive bg-destructive/10",
  muted: "text-muted-foreground bg-muted",
};

export function StatCard({ label, value, icon: Icon, accent = "primary", subtitle, trend, trendDirection }: StatCardProps) {
  return (
    <Card className="p-5 card-shadow card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${accentStyles[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
            trendDirection === "up"
              ? "text-success bg-success/10"
              : "text-destructive bg-destructive/10"
          }`}>
            {trendDirection === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </Card>
  );
}
