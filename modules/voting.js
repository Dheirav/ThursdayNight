// Voting system for Sai’s Thursday
import { supabase } from './supabase.js';

export async function voteForMovie(roomId, mediaId, role) {
  await supabase.from('votes').upsert([{ room_id: roomId, media_id: mediaId, role }], { onConflict: ['room_id', 'role'] });
}

export async function getVotes(roomId) {
  const { data } = await supabase.from('votes').select('*').eq('room_id', roomId);
  return data || [];
}
