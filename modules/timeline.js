// Memory timeline for Dherru & Nivi
import { supabase } from './supabase.js';

export async function saveMemory(roomId, media) {
  await supabase.from('memories').insert([{ room_id: roomId, media_id: media.id, title: media.title || media.name, date: new Date().toISOString() }]);
}

export async function getMemories(roomId) {
  const { data } = await supabase.from('memories').select('*').eq('room_id', roomId).order('date', { ascending: false });
  return data || [];
}
