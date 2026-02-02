// Romantic messages helpers for the `romantic` table
// - sendRomanticMessage(room_id, sender, message)
// - getRomanticMessages(room_id)
// - subscribeToRomantic(room_id, callback)
// All queries are scoped by `room_id` to preserve privacy.

import { supabase } from './supabase.js';

/**
 * Insert a romantic message row.
 * Returns the inserted record.
 */
export async function sendRomanticMessage(room_id, sender, message){
  if(!room_id) throw new Error('room_id required');
  if(!sender) throw new Error('sender required');
  if(typeof message !== 'string' || message.trim().length === 0) throw new Error('message required');

  const payload = { room_id, sender, message: message.trim() };
  const { data, error } = await supabase
    .from('romantic')
    .insert(payload)
    .select()
    .single();

  if(error) throw error;
  return data;
}

/**
 * Fetch all romantic messages for a room ordered by created_at ascending.
 */
export async function getRomanticMessages(room_id){
  if(!room_id) return [];
  const { data, error } = await supabase
    .from('romantic')
    .select('*')
    .eq('room_id', room_id)
    .order('created_at', { ascending: true });

  if(error) throw error;
  return data || [];
}

/**
 * Subscribe to realtime INSERTs on `romantic` for the given room.
 * Callback will be called with { event: 'INSERT', record }.
 * Returns an object with `unsubscribe()`.
 */
export function subscribeToRomantic(room_id, callback){
  if(!room_id) throw new Error('room_id required for subscription');

  const channel = supabase.channel(`public:romantic:${room_id}`);

  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'romantic', filter: `room_id=eq.${room_id}` }, (payload) => {
    try{ callback({ event: 'INSERT', record: payload.new }); }catch(e){ console.error(e); }
  });

  channel.subscribe();

  return { unsubscribe: () => channel.unsubscribe() };
}
