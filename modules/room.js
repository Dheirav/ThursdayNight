// Room system for Sai’s Thursday
import { supabase } from './supabase.js';

export function generateRoomId() {
  return 'room-' + Math.random().toString(36).substr(2, 9);
}

export async function createRoom(role) {
  const roomId = generateRoomId();
  await supabase.from('rooms').insert([{ id: roomId, created_at: new Date().toISOString(), role_you: role === 'You', role_sai: role === 'Sai' }]);
  return roomId;
}

export async function joinRoom(roomId, role) {
  // Optionally update role presence in DB
  return roomId;
}

export function getRoomUrl(roomId) {
  return `${window.location.origin}${window.location.pathname}?room=${roomId}`;
}
