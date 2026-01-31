// TMDB API functions for Dherru & Nivi
import { TMDB_API_KEY } from './config.js';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export async function searchTMDB(query, type = 'multi') {
  const url = `${TMDB_BASE}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB search failed');
  return res.json();
}

export async function getTMDBDetails(id, mediaType = 'movie') {
  const url = `${TMDB_BASE}/${mediaType}/${id}?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB details fetch failed');
  return res.json();
}

export async function getTMDBRecommendations(id, mediaType = 'movie') {
  const url = `${TMDB_BASE}/${mediaType}/${id}/recommendations?api_key=${TMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB recommendations fetch failed');
  return res.json();
}
