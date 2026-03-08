export type VehicleStatus = "active" | "stopped" | "offline";

export interface Vehicle {
  id: string;
  plate: string;
  driver: string;
  model: string;
  status: VehicleStatus;
  speed: number;
  location: string;
  lastUpdate: string;
  fuel: number;
  lat: number;
  lng: number;
}

export const vehicles: Vehicle[] = [
  { id: "1", plate: "ABC-1234", driver: "Carlos Silva", model: "Volvo FH 540", status: "active", speed: 87, location: "BR-101, km 234 - SC", lastUpdate: "Agora", fuel: 72, lat: -27.59, lng: -48.55 },
  { id: "2", plate: "DEF-5678", driver: "Ana Souza", model: "Scania R450", status: "active", speed: 62, location: "BR-116, km 112 - PR", lastUpdate: "2 min atrás", fuel: 58, lat: -25.43, lng: -49.27 },
  { id: "3", plate: "GHI-9012", driver: "Roberto Lima", model: "Mercedes Actros", status: "stopped", speed: 0, location: "Posto Shell - Curitiba, PR", lastUpdate: "15 min atrás", fuel: 34, lat: -25.44, lng: -49.28 },
  { id: "4", plate: "JKL-3456", driver: "Maria Santos", model: "DAF XF", status: "active", speed: 95, location: "BR-376, km 87 - PR", lastUpdate: "1 min atrás", fuel: 81, lat: -25.52, lng: -49.18 },
  { id: "5", plate: "MNO-7890", driver: "João Oliveira", model: "Iveco S-Way", status: "offline", speed: 0, location: "Último: Joinville, SC", lastUpdate: "3h atrás", fuel: 12, lat: -26.30, lng: -48.84 },
  { id: "6", plate: "PQR-1122", driver: "Felipe Costa", model: "Volvo FM 370", status: "active", speed: 74, location: "BR-277, km 56 - PR", lastUpdate: "Agora", fuel: 65, lat: -25.48, lng: -49.10 },
  { id: "7", plate: "STU-3344", driver: "Lucia Ferreira", model: "Scania G410", status: "stopped", speed: 0, location: "Base Logística - São José dos Pinhais", lastUpdate: "45 min atrás", fuel: 90, lat: -25.53, lng: -49.20 },
  { id: "8", plate: "VWX-5566", driver: "Pedro Almeida", model: "Mercedes Atego", status: "active", speed: 55, location: "Av. das Américas - RJ", lastUpdate: "Agora", fuel: 43, lat: -22.97, lng: -43.36 },
];
