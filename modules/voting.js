// Voting helpers for `votes` table
// - Exports: castVote, getVotes, subscribeToVotes, hasVoted
// - Voting is scoped to the current calendar week (UTC)

import { supabase } from './supabase.js';

// Compute start (inclusive) and end (exclusive) of the current Thursday voting period in UTC.
// Votes are scoped by Thursday occurrence: from Thursday 00:00 UTC to next Thursday 00:00 UTC.
// This aligns votes with the "Nivi's Thursday" movie night concept (not calendar week).
function getCurrentWeekRangeUTC(date = new Date()){
  const d = new Date(date.toISOString()); // normalize to UTC time
  // Get day of week: 0=Sunday, 1=Monday, ..., 4=Thursday, ..., 6=Saturday
  const day = d.getUTCDay();
  
  // Calculate offset to the most recent Thursday (inclusive if today is Thursday).
  // If today is Thursday (day=4), diffToThursday=0 (same day at 00:00).
  // If today is Friday (day=5), diffToThursday=-1 (yesterday).
  // If today is Wednesday (day=3), diffToThursday=1 (next day is actually wrong; we want -6).
  const diffToThursday = day === 4 ? 0 : (day > 4 ? day - 4 : day - 4 - 7);
  
  const thursday = new Date(d);
  thursday.setUTCDate(d.getUTCDate() + diffToThursday);
  thursday.setUTCHours(0, 0, 0, 0);
  
  const nextThursday = new Date(thursday);
  nextThursday.setUTCDate(thursday.getUTCDate() + 7);
  
  return { startISO: thursday.toISOString(), endISO: nextThursday.toISOString() };
}

/**
 * Check if `voter` has already cast a vote in `room_id` for the current week.
 * Returns true/false.
 */
export async function hasVoted(room_id, voter){
  if(!room_id || !voter) return false;
  const { startISO, endISO } = getCurrentWeekRangeUTC();
  const { data, error } = await supabase
    .from('votes')
    .select('id')
    .eq('room_id', room_id)
    .eq('voter', voter)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .limit(1);

  if(error) throw error;
  return Array.isArray(data) && data.length > 0;
}

/**
 * Cast a vote for the current Thursday voting period.
 * `media` should contain at least { media_id, media_type }.
 * Validates that the media exists in the room's favorites before allowing a vote.
 * Returns the inserted vote row or an object with { alreadyVoted: true } or { notInFavorites: true }.
 */
export async function castVote(room_id, voter, media){
  if(!room_id) throw new Error('room_id required');
  if(!voter) throw new Error('voter required');
  if(!media || !media.media_id || !media.media_type) throw new Error('media.media_id and media.media_type required');

  // Prevent double-voting within the same Thursday period
  const voted = await hasVoted(room_id, voter);
  if(voted) return { alreadyVoted: true };

  // VALIDATION: Ensure the media exists in the room's favorites.
  // Prevents orphaned votes on media that was never added.
  const { data: existingFav, error: favErr } = await supabase
    .from('favorites')
    .select('id')
    .eq('room_id', room_id)
    .eq('media_id', media.media_id)
    .eq('media_type', media.media_type)
    .maybeSingle();

  if(favErr) throw favErr;
  if(!existingFav) return { notInFavorites: true };

  const payload = {
    room_id,
    media_id: media.media_id,
    media_type: media.media_type,
    voter,
    vote: 1 // default single vote value; schema supports integer
  };

  try{
    const { data, error } = await supabase
      .from('votes')
      .insert(payload)
      .select()
      .single();

    if(error){
      // Handle potential race where another client inserted simultaneously.
      if(error.status === 409) return { alreadyVoted: true };
      throw error;
    }

    return data;
  }catch(err){
    console.error('castVote error', err);
    throw err;
  }
}

/**
 * Get all votes for the current week for a room.
 */
export async function getVotes(room_id){
  if(!room_id) return [];
  const { startISO, endISO } = getCurrentWeekRangeUTC();
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('room_id', room_id)
    .gte('created_at', startISO)
    .lt('created_at', endISO)
    .order('created_at', { ascending: false });

  if(error) throw error;
  return data || [];
}

/**
 * Subscribe to realtime vote changes (INSERT/DELETE) for a room.
 * Callback receives { event: 'INSERT'|'DELETE'|'UPDATE', record }
 */
export function subscribeToVotes(room_id, callback){
  if(!room_id) throw new Error('room_id required for subscription');
  const channel = supabase.channel(`public:votes:${room_id}`);

  channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes', filter: `room_id=eq.${room_id}` }, (payload) => {
    try{ callback({ event: 'INSERT', record: payload.new }); }catch(e){ console.error(e); }
  });

  channel.on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'votes', filter: `room_id=eq.${room_id}` }, (payload) => {
    try{ callback({ event: 'DELETE', record: payload.old }); }catch(e){ console.error(e); }
  });

  channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'votes', filter: `room_id=eq.${room_id}` }, (payload) => {
    try{ callback({ event: 'UPDATE', record: payload.new }); }catch(e){ console.error(e); }
  });

  channel.subscribe();

  return { unsubscribe: () => channel.unsubscribe() };
}
