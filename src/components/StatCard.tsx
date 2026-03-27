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
    <Card className="p-6 min-h-[120px] card-shadow card-hover border-l-4 border-l-primary/60 relative">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`p-2.5 rounded-lg ${accentStyles[accent]}`}>
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              trendDirection === "up"
                ? "text-success bg-success/10"
                : "text-destructive bg-destructive/10"
            }`}>
              {trendDirection === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
