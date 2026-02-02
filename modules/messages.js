// Shared messages helpers for the `messages` table
// - sendMessage(room_id, sender, message)
// - getMessages(room_id)
// - subscribeToMessages(room_id, callback)
// All queries are scoped by `room_id` to preserve privacy.
// This is for shared messaging between both Dherru and Nivi, unlike romantic which is private.

import { supabase } from './supabase.js';

/**
 * Insert a message row.
 * Returns the inserted record.
 */
export async function sendMessage(room_id, sender, message){
  if(!room_id) throw new Error('room_id required');
  if(!sender) throw new Error('sender required');
  if(typeof message !== 'string' || message.trim().length === 0) throw new Error('message required');

  const payload = { room_id, sender, message: message.trim() };
  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select()
    .single();

  if(error) throw error;
  return data;
}

/**
 * Fetch all messages for a room ordered by created_at ascending.
 */
export async function getMessages(room_id){
  if(!room_id) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('room_id', room_id)
    .order('created_at', { ascending: true });

  if(error) throw error;
  return data || [];
}

/**
 * Subscribe to realtime INSERTs on `messages` for the given room.
 * Callback will be called with { event: 'INSERT', record }.
 * Returns an object with `unsubscribe()`.
 */
export function subscribeToMessages(room_id, callback){
  if(!room_id) throw new Error('room_id required for subscription');

  const subscription = supabase
    .channel(`public:messages:room_id=eq.${room_id}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${room_id}`,
      },
      (payload) => {
        callback({ event: 'INSERT', record: payload.new });
      }
    )
    .subscribe();

  return {
    unsubscribe: () => {
      supabase.removeChannel(subscription);
    }
  };
}
