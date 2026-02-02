// App entry (ES module)
// This file builds a lightweight UI shell and progressively loads feature modules
// while keeping startup flow simple. It uses `modules/room.js` as the single
// source of truth for creating/retrieving the `room_id` and stores a small
// global `APP` state object for other modules to read.

import { initRoom } from './modules/room.js';
import { initRole } from './modules/roles.js';
import { initUI } from './modules/ui.js';

// Minimal global app state available to other modules via `window.APP`.
const APP = { roomId: null, role: null };
window.APP = APP;

// Role setter: update APP and notify UI. UI listens for `app:role-changed` to react.
function setRole(role){
  if(role !== 'Dherru' && role !== 'Nivi') return;
  localStorage.setItem('role', role);
  APP.role = role;
  // Notify UI immediately via custom event
  try{ window.dispatchEvent(new CustomEvent('app:role-changed', { detail: { role } })); }catch(e){}
}

// NOTE: All UI rendering and DOM event wiring (share button, search, romantic send,
// favorites, voting) is owned by `modules/ui.js`. This file only initializes
// the runtime state and notifies the UI via `initUI(APP)`.

// --- Startup initializer ---
async function initApp(){
  try{
    // 1) Initialize or retrieve the room
    const roomId = await initRoom();
    APP.roomId = roomId;

    // 2) Initialize UI immediately so the role picker shows even if realtime
    //    services are slow or unavailable. Role realtime sync will be started
    //    afterwards and will update the UI via events.
    initUI(APP, { setRole });

    // 3) Initialize role selection and realtime sync (runs in background)
    //    Do not block UI rendering on Supabase connectivity.
    // `initRole` is synchronous in this codebase but may later return a Promise.
    // Handle both cases safely without assuming a Promise.
    try {
      const maybe = initRole(roomId);
      if (maybe && typeof maybe.then === 'function') {
        maybe.catch(err => console.error('initRole error', err));
      }
    } catch (err) {
      console.error('initRole error', err);
    }
  }catch(err){
    console.error('initApp error', err);
  }
}

initApp();

// --- Helpers ---
function escapeHtml(s=''){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

export { APP, setRole };
