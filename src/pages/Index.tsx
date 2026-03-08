import { Truck, TruckIcon, AlertTriangle, WifiOff, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { VehicleRow } from "@/components/VehicleRow";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { vehicles } from "@/data/vehicles";
import { motion } from "framer-motion";
import { useState } from "react";

type Filter = "all" | "active" | "stopped" | "offline";

const Index = () => {
  const [filter, setFilter] = useState<Filter>("all");

  const active = vehicles.filter((v) => v.status === "active").length;
  const stopped = vehicles.filter((v) => v.status === "stopped").length;
  const offline = vehicles.filter((v) => v.status === "offline").length;

  const filtered = filter === "all" ? vehicles : vehicles.filter((v) => v.status === filter);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Ativos" },
    { key: "stopped", label: "Parados" },
    { key: "offline", label: "Offline" },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 glow-primary">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Gestão de Rastreamento</h1>
            <p className="text-sm text-muted-foreground">Monitoramento em tempo real da frota</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span className="status-dot bg-success animate-pulse" />
          Sistema operacional
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Veículos" value={vehicles.length} icon={Truck} accent="primary" />
        <StatCard label="Em Trânsito" value={active} icon={TruckIcon} accent="primary" />
        <StatCard label="Parados" value={stopped} icon={AlertTriangle} accent="warning" />
        <StatCard label="Offline" value={offline} icon={WifiOff} accent="muted" />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Vehicle list */}
        <div className="lg:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex gap-2 mb-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((v, i) => (
              <VehicleRow key={v.id} vehicle={v} index={i} />
            ))}
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <MapPlaceholder />
        </div>
      </div>
    </div>
  );
};

export default Index;
