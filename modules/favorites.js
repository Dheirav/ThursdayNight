// Favorites management for Sai’s Thursday
import { supabase } from './supabase.js';

export async function addFavorite(roomId, role, media) {
  await supabase.from('favorites').insert([{ room_id: roomId, role, media_id: media.id, media_type: media.media_type, title: media.title || media.name, poster: media.poster_path, rating: media.vote_average }]);
}

export async function getFavorites(roomId, role) {
  const { data } = await supabase.from('favorites').select('*').eq('room_id', roomId).eq('role', role);
  return data || [];
}
