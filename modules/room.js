// Room management helpers
// Responsibilities:
// - Ensure a stable `room_id` in localStorage
// - Create the `rooms` row in the database if it doesn't exist
// - Export `initRoom()` which returns the active room id

import { supabase } from './supabase.js';

const STORAGE_KEY = 'nt_room_id';

// Generate a random alphanumeric id of length 6-8
function genRoomId(){
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const len = 6 + Math.floor(Math.random()*3); // 6,7,8
  let s = '';
  for(let i=0;i<len;i++) s += chars[Math.floor(Math.random()*chars.length)];
  return s;
}

// Initialize or retrieve the room id and ensure the `rooms` table has a row.
export async function initRoom(){
  // 1) Check localStorage for an existing room id
  let roomId = localStorage.getItem(STORAGE_KEY);
  if(!roomId){
    roomId = genRoomId();
    localStorage.setItem(STORAGE_KEY, roomId);
  }

  // 2) Ensure the room exists in the `rooms` table. Do not create duplicates.
  try{
    const { data: existing, error: selectErr } = await supabase
      .from('rooms')
      .select('id')
      .eq('id', roomId)
      .maybeSingle();

    if(selectErr){
      // If selection fails for some reason, surface the error.
      throw selectErr;
    }

    if(!existing){
      // Insert a new room row. Rely on the DB to set `created_at`.
      const { data: inserted, error: insertErr } = await supabase
        .from('rooms')
        .insert({ id: roomId });

      if(insertErr){
        // If the insert failed due to a duplicate key (race), treat as non-fatal.
        // Postgres duplicate key errors typically return status 409.
        if(insertErr.status === 409){
          // Another client created the row concurrently — that's fine.
        } else {
          throw insertErr;
        }
      }
    }

    return roomId;
  }catch(err){
    console.error('initRoom error', err);
    throw err;
  }
}
