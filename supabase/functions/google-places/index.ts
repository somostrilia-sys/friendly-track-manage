import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_API_KEY = "AIzaSyCXx6Zr4nKhj-n9RP8z2xdVubB2YtgjTe8";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const { cidade, estado, tipo } = await req.json().catch(() => ({}));

    if (!cidade) {
      return new Response(JSON.stringify({ error: "Cidade obrigatoria" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const query = encodeURIComponent(
      `${tipo || "autoeletrica instalador rastreador"} em ${cidade} ${estado || ""}`
    );

    // Text Search API
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${GOOGLE_API_KEY}&language=pt-BR&region=br`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return new Response(JSON.stringify({ error: `Google API: ${data.status}`, details: data.error_message }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const results = (data.results || []).map((place: any) => ({
      id: place.place_id,
      nome: place.name,
      endereco: place.formatted_address,
      avaliacao: place.rating || 0,
      total_avaliacoes: place.user_ratings_total || 0,
      aberto: place.opening_hours?.open_now ?? null,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      tipos: place.types || [],
    }));

    return new Response(JSON.stringify({ success: true, results, total: results.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
