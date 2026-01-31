// Favorites management for Dherru & Nivi
import { supabase } from './supabase.js';

export async function addFavorite(roomId, role, media) {
  // tolerate different shapes from callers
  const media_id = media?.id || media?.media_id || media?.mediaId || null;
  const media_type = media?.media_type || media?.mediaType || media?.type || 'movie';
  const title = media?.title || media?.name || media?.title_text || '';
  const poster = media?.poster_path || media?.poster || media?.image || null;
  const rating = media?.vote_average || media?.rating || null;

  try{
    const payload = [{ room_id: roomId, role, media_id, media_type, title, poster, rating }];
    const { data, error } = await supabase.from('favorites').insert(payload).select();
    if (error) {
      console.error('addFavorite error', error);
      return { error };
    }
    return { data };
  }catch(err){
    console.error('addFavorite unexpected error', err);
    return { error: err };
  }
}

export async function getFavorites(roomId, role) {
  try{
    const { data, error } = await supabase.from('favorites').select('*').eq('room_id', roomId).eq('role', role);
    if (error) { console.error('getFavorites error', error); return []; }
    return data || [];
  }catch(err){ console.error('getFavorites unexpected', err); return []; }
}
