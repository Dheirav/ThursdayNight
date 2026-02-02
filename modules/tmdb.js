// TMDB API helper (client-side)
// - Exposes `searchMedia(query)` which queries TMDB multi-search and returns
//   normalized results for movies and TV shows.
// - Does not perform any UI updates or persistence.

import { TMDB_API_KEY } from './config.js';

const BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Normalize a TMDB item into the required shape.
function normalize(item){
  if(!item || !item.media_type) return null;
  if(item.media_type !== 'movie' && item.media_type !== 'tv') return null;

  const media_id = item.id;
  const media_type = item.media_type;
  const title = media_type === 'movie' ? item.title || item.original_title : item.name || item.original_name;
  const poster = item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null;
  const rating = (typeof item.vote_average === 'number' && item.vote_average > 0) ? Math.round(item.vote_average) : null;

  return { media_id, media_type, title, poster, rating };
}

// Search TMDB multi endpoint and return normalized array of movies/tv
export async function searchMedia(query){
  if(!query || String(query).trim().length === 0) return [];
  const q = encodeURIComponent(String(query).trim());
  const url = `${BASE}/search/multi?api_key=${TMDB_API_KEY}&language=en-US&query=${q}&page=1&include_adult=false`;

  try{
    const res = await fetch(url);
    if(!res.ok) {
      console.warn('TMDB search failed', res.status, res.statusText);
      return [];
    }
    const json = await res.json();
    if(!json || !Array.isArray(json.results)) return [];

    // Filter only movie and tv results, normalize, and remove nulls
    const out = json.results
      .map(normalize)
      .filter(x => x !== null);

    return out;
  }catch(err){
    console.error('searchMedia error', err);
    return [];
  }
}

// Backwards-compat alias used by earlier code that expected `searchTMDB`.
export const searchTMDB = searchMedia;
// Get details of a specific movie including genres
export async function getMediaDetails(media_id, media_type){
  const endpoint = media_type === 'movie' ? 'movie' : 'tv';
  const url = `${BASE}/${endpoint}/${media_id}?api_key=${TMDB_API_KEY}&language=en-US`;
  
  try{
    const res = await fetch(url);
    if(!res.ok) {
      console.warn('TMDB details failed', res.status);
      return null;
    }
    const json = await res.json();
    return json;
  }catch(err){
    console.error('getMediaDetails error', err);
    return null;
  }
}

// Discover movies/tv by genres
export async function discoverByGenres(genres, media_type = 'movie'){
  if(!genres || genres.length === 0) return [];
  
  const genreIds = genres.join('|'); // TMDB uses pipe-separated genre IDs
  const endpoint = media_type === 'movie' ? 'discover/movie' : 'discover/tv';
  const url = `${BASE}/${endpoint}?api_key=${TMDB_API_KEY}&language=en-US&sort_by=vote_average.desc&vote_count.gte=100&with_genres=${genreIds}&page=1`;
  
  try{
    const res = await fetch(url);
    if(!res.ok) {
      console.warn('TMDB discover failed', res.status);
      return [];
    }
    const json = await res.json();
    if(!json || !Array.isArray(json.results)) return [];
    
    const out = json.results
      .map(item => {
        const media_id = item.id;
        const media_type_out = media_type;
        const title = media_type === 'movie' ? item.title || item.original_title : item.name || item.original_name;
        const poster = item.poster_path ? `${IMAGE_BASE}${item.poster_path}` : null;
        const rating = (typeof item.vote_average === 'number' && item.vote_average > 0) ? Math.round(item.vote_average) : null;
        return { media_id, media_type: media_type_out, title, poster, rating };
      })
      .filter(x => x !== null);
    
    return out;
  }catch(err){
    console.error('discoverByGenres error', err);
    return [];
  }
}