import { Vehicle } from "@/data/vehicles";
import { motion } from "framer-motion";
import { Fuel, MapPin, Gauge } from "lucide-react";

const statusConfig = {
  active: { label: "Ativo", class: "bg-success" },
  stopped: { label: "Parado", class: "bg-stopped" },
  offline: { label: "Offline", class: "bg-offline" },
};

export function VehicleRow({ vehicle, index }: { vehicle: Vehicle; index: number }) {
  const status = statusConfig[vehicle.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card rounded-xl p-4 hover:border-primary/30 transition-colors cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`status-dot ${status.class}`} />
            <span className="font-semibold text-sm">{vehicle.plate}</span>
          </div>
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary">
            {status.label}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{vehicle.lastUpdate}</span>
      </div>

      <p className="text-sm text-muted-foreground mb-1">{vehicle.driver}</p>
      <p className="text-xs text-muted-foreground mb-3">{vehicle.model}</p>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {vehicle.location}
        </span>
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Gauge className="w-3.5 h-3.5" />
          {vehicle.speed} km/h
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Fuel className="w-3.5 h-3.5" />
          {vehicle.fuel}%
        </span>
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${vehicle.fuel}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
