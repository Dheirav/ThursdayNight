// Dherru & Nivi – Main App Entry
import { renderHome } from './modules/home.js';
import { renderRoleSelection } from './modules/roles.js';
import { generateRoomId, getRoomUrl } from './modules/room.js';

function route() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  const role = sessionStorage.getItem('role');
  if (!roomId) {
    // No room, show role selection and create room
    renderRoleSelection(selectedRole => {
      sessionStorage.setItem('role', selectedRole);
      const newRoomId = generateRoomId();
      window.location.href = getRoomUrl(newRoomId);
    });
  } else if (!role) {
    // Room exists, but no role selected
    renderRoleSelection(selectedRole => {
      sessionStorage.setItem('role', selectedRole);
      window.location.reload();
    });
  } else {
    // Room and role set, show home/dashboard
    renderHome();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  route();
});
