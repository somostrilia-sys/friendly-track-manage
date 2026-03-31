/**
 * Geocoding utilities using Google Maps API
 * API Key: AIzaSyCXx6Zr4nKhj-n9RP8z2xdVubB2YtgjTe8
 *
 * Used for:
 * - Calculating distances between technician base and installation addresses
 * - Route optimization suggestions
 * - Finding nearby technicians
 */

const GOOGLE_API_KEY = "AIzaSyCXx6Zr4nKhj-n9RP8z2xdVubB2YtgjTe8";

interface LatLng {
  lat: number;
  lng: number;
}

interface DistanceResult {
  distance_km: number;
  duration_minutes: number;
  origin: string;
  destination: string;
}

// Geocode an address to lat/lng
export async function geocodeAddress(address: string): Promise<LatLng | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}&language=pt-BR&region=br`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
    return null;
  } catch {
    return null;
  }
}

// Calculate distance between two addresses using Distance Matrix API
export async function calcularDistancia(origem: string, destino: string): Promise<DistanceResult | null> {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origem)}&destinations=${encodeURIComponent(destino)}&key=${GOOGLE_API_KEY}&language=pt-BR&region=br`
    );
    const data = await response.json();
    if (data.rows?.[0]?.elements?.[0]?.status === "OK") {
      const element = data.rows[0].elements[0];
      return {
        distance_km: element.distance.value / 1000,
        duration_minutes: element.duration.value / 60,
        origin: origem,
        destination: destino,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Calculate total route distance: base -> stop1 -> stop2 -> ... -> stopN
export async function calcularRota(enderecos: string[]): Promise<{ total_km: number; trechos: DistanceResult[] }> {
  const trechos: DistanceResult[] = [];
  let total_km = 0;

  for (let i = 0; i < enderecos.length - 1; i++) {
    const result = await calcularDistancia(enderecos[i], enderecos[i + 1]);
    if (result) {
      trechos.push(result);
      total_km += result.distance_km;
    }
  }

  return { total_km, trechos };
}

// Calculate straight-line distance between two coordinates (Haversine)
export function distanciaHaversine(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

// Find nearby places (autoeletrica, oficinas) using Google Places
export async function buscarLocaisProximos(lat: number, lng: number, tipo: string = "car_repair", raio: number = 20000) {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${raio}&type=${tipo}&keyword=autoeletrica+instalador+rastreador&key=${GOOGLE_API_KEY}&language=pt-BR`
    );
    const data = await response.json();
    return data.results || [];
  } catch {
    return [];
  }
}

export { GOOGLE_API_KEY };
