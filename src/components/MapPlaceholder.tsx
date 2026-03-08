import { motion } from "framer-motion";
import { vehicles, Vehicle } from "@/data/vehicles";

function VehiclePin({ vehicle, style }: { vehicle: Vehicle; style: React.CSSProperties }) {
  const colors = {
    active: "bg-success",
    stopped: "bg-stopped",
    offline: "bg-offline",
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute group cursor-pointer"
      style={style}
    >
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${colors[vehicle.status]}`}>
          {vehicle.status === "active" && (
            <div className={`absolute inset-0 rounded-full ${colors[vehicle.status]} animate-ping opacity-40`} />
          )}
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
          <div className="glass-card rounded-lg px-3 py-2 text-xs whitespace-nowrap">
            <p className="font-semibold">{vehicle.plate}</p>
            <p className="text-muted-foreground">{vehicle.driver}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function MapPlaceholder() {
  // Simplified positions mapped from lat/lng to percentages
  const positions: Record<string, { top: string; left: string }> = {
    "1": { top: "55%", left: "62%" },
    "2": { top: "35%", left: "48%" },
    "3": { top: "37%", left: "46%" },
    "4": { top: "40%", left: "52%" },
    "5": { top: "48%", left: "58%" },
    "6": { top: "38%", left: "44%" },
    "7": { top: "42%", left: "50%" },
    "8": { top: "22%", left: "72%" },
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden relative h-full min-h-[400px]">
      {/* Dark map background */}
      <div className="absolute inset-0 bg-secondary">
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-10" preserveAspectRatio="none">
          {/* Grid lines */}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.2" className="text-muted-foreground" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="currentColor" strokeWidth="0.2" className="text-muted-foreground" />
          ))}
          {/* Abstract road lines */}
          <path d="M 20,10 Q 40,30 50,50 T 80,90" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-muted-foreground" />
          <path d="M 10,40 Q 30,45 60,35 T 95,50" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-muted-foreground" />
          <path d="M 30,80 Q 50,70 70,75 T 90,60" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-muted-foreground" />
        </svg>
      </div>

      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-sm font-semibold">Mapa de Rastreamento</h3>
        <p className="text-xs text-muted-foreground">Região Sul / Sudeste</p>
      </div>

      {/* Vehicle pins */}
      {vehicles.map((v) => (
        <VehiclePin
          key={v.id}
          vehicle={v}
          style={positions[v.id] ? { top: positions[v.id].top, left: positions[v.id].left } : {}}
        />
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 glass-card rounded-lg px-3 py-2 flex items-center gap-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="status-dot bg-success" /> Ativo</span>
        <span className="flex items-center gap-1.5"><span className="status-dot bg-stopped" /> Parado</span>
        <span className="flex items-center gap-1.5"><span className="status-dot bg-offline" /> Offline</span>
      </div>
    </div>
  );
}
