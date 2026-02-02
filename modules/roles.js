// modules/roles.js
// Role selection and realtime syncing via Supabase channels

import { supabase } from './supabase.js';

let localRole = null;
let channel = null;
let roomId = null;

/**
 * Initialize role realtime channel for a room.
 * Does NOT render any DOM — UI owns rendering.
 * Exports a helper to broadcast role selections to other clients.
 * @param {string} _roomId
 */
export function initRole(_roomId){
  roomId = _roomId;
  localRole = localStorage.getItem('role');
  setupChannel();
  // If role already present, sync APP state and notify UI
  if(localRole === 'Dherru' || localRole === 'Nivi'){
    try{ if(window.APP) window.APP.role = localRole; window.dispatchEvent(new CustomEvent('app:role-changed',{detail:{role:localRole}})); }catch(e){}
    // broadcast presence to room
    broadcastRoleToRoom(localRole);
  }
}

// Setup Supabase channel for realtime role events (broadcasts)
function setupChannel(){
  if(!roomId) return;
  if(channel) channel.unsubscribe();
  channel = supabase.channel(`room-roles-${roomId}`);
  channel.on('broadcast', { event: 'role-selected' }, payload => {
    try{
      const other = payload.payload && payload.payload.role;
      if(other && other !== localRole){
        // Notify UI that the other role was selected
        window.dispatchEvent(new CustomEvent('roles:other-selected', { detail: { role: other } }));
      }
    }catch(e){ console.error('roles channel payload error', e); }
  }).subscribe();
}

// Broadcast local role selection to the room (call from UI when user picks a role)
export function broadcastRoleToRoom(role){
  localRole = role;
  try{ if(window.APP) window.APP.role = role; window.dispatchEvent(new CustomEvent('app:role-changed',{detail:{role}})); }catch(e){}
  if(!channel) return;
  channel.send({ type: 'broadcast', event: 'role-selected', payload: { role } });
}
