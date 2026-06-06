const API_KEY = import.meta.env.VITE_LASTFM_API_KEY;
const BASE_URL = "https://ws.audioscrobbler.com/2.0/";

async function get(method, params = {}) {
  const url = new URL(BASE_URL);
  url.searchParams.set("method", method);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("format", "json");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Last.fm error: ${res.status}`);
  return res.json();
}

// Buscar artistas por nombre
export async function searchArtist(query) {
  const data = await get("artist.search", { artist: query, limit: 8 });
  return data.results?.artistmatches?.artist ?? [];
}

// Info completa de un artista
export async function getArtist(name) {
  const data = await get("artist.getinfo", { artist: name });
  return data.artist ?? null;
}

// Top tracks de un artista
export async function getTopTracks(name) {
  const data = await get("artist.gettoptracks", { artist: name, limit: 7 });
  return data.toptracks?.track ?? [];
}

// Top álbumes de un artista
export async function getTopAlbums(name) {
  const data = await get("artist.gettopalbums", { artist: name, limit: 5 });
  return data.topalbums?.album ?? [];
}

// Artistas similares
export async function getSimilar(name) {
  const data = await get("artist.getsimilar", { artist: name, limit: 6 });
  return data.similarartists?.artist ?? [];
}

// Top artistas globales de la semana
export async function getTopArtists() {
  const data = await get("chart.gettopartists", { limit: 20 });
  return data.artists?.artist ?? [];
}
