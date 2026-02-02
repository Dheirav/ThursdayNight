// Timeline helpers for the `timeline` table
// - addTimelineEvent(room_id, event)
// - getTimeline(room_id)
// - subscribeToTimeline(room_id, callback)
// All queries are scoped by `room_id` to preserve privacy.

import { supabase } from './supabase.js';

/**
 * Insert a timeline event. `event` must include `event_type` and may include
 * media_id, media_type, title, poster, message.
 */
export async function addTimelineEvent(room_id, event){
  if(!room_id) throw new Error('room_id required');
  if(!event || !event.event_type) throw new Error('event.event_type required');

  const payload = {
    room_id,
    event_type: event.event_type,
    media_id: event.media_id ?? null,
    media_type: event.media_type ?? null,
    title: event.title ?? null,
    poster: event.poster ?? null,
    message: event.message ?? null
  };

  const { data, error } = await supabase
    .from('timeline')
    .insert(payload)
    .select()
    .single();

  if(error) throw error;
  return data;
}

/**
 * Fetch all timeline events for a room ordered by created_at ascending.
 */
export async function getTimeline(room_id){
  if(!room_id) return [];
  const { data, error } = await supabase
    .from('timeline')
    .select('*')
    .eq('room_id', room_id)
    .order('created_at', { ascending: true });

  if(error) throw error;
  return data || [];
}

/**
 * Subscribe to realtime INSERTs on `timeline` for the given room.
 * Callback will be called with { event: 'INSERT', record }.
 * Returns an object with `unsubscribe()`.
 */
export function subscribeToTimeline(room_id, callback){
  if(!room_id) throw new Error('room_id required for subscription');

  const channel = supabase.channel(`public:timeline:${room_id}`);

  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'timeline', filter: `room_id=eq.${room_id}` }, (payload) => {
    try{ callback({ event: 'INSERT', record: payload.new }); }catch(e){ console.error(e); }
  });

  channel.subscribe();

  return { unsubscribe: () => channel.unsubscribe() };
}
