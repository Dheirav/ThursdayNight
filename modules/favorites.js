// Favorites table helpers
// - Implements add/remove/get and realtime subscription for `favorites`.
// - All queries are scoped by `room_id` to enforce privacy.

import { supabase } from './supabase.js';

/**
 * Add a favorite if it doesn't already exist for the same room + media.
 * @param {string} room_id
 * @param {string} role - "Dherru" or "Nivi"
 * @param {object} media - { media_id, media_type, title, poster, rating }
 * @returns {object} inserted record
 */
export async function addFavorite(room_id, role, media){
  if(!room_id) throw new Error('room_id required');
  if(!media || !media.media_id || !media.media_type) throw new Error('media.media_id and media.media_type required');

  // Prevent duplicates: check existing row for this room + media
  const { data: existing, error: selErr } = await supabase
    .from('favorites')
    .select('*')
    .eq('room_id', room_id)
    .eq('media_id', media.media_id)
    .eq('media_type', media.media_type)
    .maybeSingle();

  if(selErr) throw selErr;
  if(existing) return existing;

  // Insert a new favorite. Use explicit fields matching the schema.
  const payload = {
    room_id,
    role,
    media_id: media.media_id,
    media_type: media.media_type,
    title: media.title || null,
    poster: media.poster || null,
    rating: (typeof media.rating === 'number') ? media.rating : null
  };

  const { data: inserted, error: insErr } = await supabase
    .from('favorites')
    .insert(payload)
    .select()
    .single();

  if(insErr) {
    // If a race caused a duplicate, return the existing row if possible
    if(insErr.status === 409){
      const { data: existing2 } = await supabase
        .from('favorites')
        .select('*')
        .eq('room_id', room_id)
        .eq('media_id', media.media_id)
        .eq('media_type', media.media_type)
        .maybeSingle();
      return existing2;
    }
    throw insErr;
  }

  return inserted;
}

/**
 * Remove favorite by composite key (room_id + media_id + media_type)
 * @returns {boolean} true if deleted
 */
export async function removeFavorite(room_id, media_id, media_type){
  if(!room_id) throw new Error('room_id required');
  const { data, error } = await supabase
    .from('favorites')
    .delete()
    .eq('room_id', room_id)
    .eq('media_id', media_id)
    .eq('media_type', media_type);

  if(error) throw error;
  return Array.isArray(data) ? data.length > 0 : !!data;
}

/**
 * Get all favorites for a room
 */
export async function getFavorites(room_id){
  if(!room_id) return [];
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('room_id', room_id)
    .order('id', { ascending: false });

  if(error) throw error;
  return data || [];
}

/**
 * Subscribe to realtime favorites changes for a room.
 * Calls `callback({ event, record })` on INSERT and DELETE.
 * Returns an object with `unsubscribe()` to stop listening.
 */
export function subscribeToFavorites(room_id, callback){
  if(!room_id) throw new Error('room_id required for subscription');

  // Use a dedicated channel name per room for clarity
  const channel = supabase.channel(`public:favorites:${room_id}`);

  // Listen for inserts scoped to this room
  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'favorites', filter: `room_id=eq.${room_id}` }, (payload) => {
    try{ callback({ event: 'INSERT', record: payload.new }); }catch(e){ console.error(e); }
  });

  // Listen for deletes scoped to this room
  channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'favorites', filter: `room_id=eq.${room_id}` }, (payload) => {
    try{ callback({ event: 'DELETE', record: payload.old }); }catch(e){ console.error(e); }
  });

  channel.subscribe();

  return {
    unsubscribe: () => channel.unsubscribe()
  };
}
