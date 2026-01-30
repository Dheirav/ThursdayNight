// Secret romantic section for Sai’s Thursday
import { supabase } from './supabase.js';

export async function addRomanticMessage(roomId, message) {
  await supabase.from('romantic_messages').insert([{ room_id: roomId, message, revealed: false }]);
}

export async function getRomanticMessages(roomId) {
  const { data } = await supabase.from('romantic_messages').select('*').eq('room_id', roomId).order('id');
  return data || [];
}

export async function revealMessage(roomId, messageId) {
  await supabase.from('romantic_messages').update({ revealed: true }).eq('room_id', roomId).eq('id', messageId);
}
