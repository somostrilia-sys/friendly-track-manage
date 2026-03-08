import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: "primary" | "warning" | "destructive" | "muted";
}

const accentStyles = {
  primary: "text-primary glow-primary",
  warning: "text-stopped",
  destructive: "text-destructive",
  muted: "text-muted-foreground",
};

export function StatCard({ label, value, icon: Icon, accent = "primary" }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5 flex items-center gap-4"
    >
      <div className={`p-3 rounded-lg bg-secondary ${accentStyles[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
}
