// Recommendations for Dherru & Nivi
import { getTMDBRecommendations } from './tmdb.js';
import { getFavorites } from './favorites.js';

export async function getPersonalizedRecommendations(roomId, role) {
  const favorites = await getFavorites(roomId, role);
  if (!favorites.length) return [];
  // Get recommendations for the first favorite as a simple demo
  const recs = await getTMDBRecommendations(favorites[0].media_id, favorites[0].media_type);
  return recs.results || [];
}
