// Home page rendering for Dherru & Nivi
import { renderDashboard } from './ui.js';

export function renderHome() {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room');
  const role = sessionStorage.getItem('role');
  if (roomId && role) {
    renderDashboard(roomId, role);
  } else {
    const root = document.getElementById('root');
    root.innerHTML = `
      <div class="glass-panel">
        <div class="gradient-title">Dherru & Nivi</div>
        <div class="subtitle">Our little world to relax, laugh, and feel close</div>
        <div style="text-align:center; margin:2rem 0;">
          <button id="start-btn" class="start-btn">Start Our Movie Night</button>
        </div>
      </div>
    `;
    document.getElementById('start-btn').addEventListener('click', () => {
      // Route to role/room selection
      window.location.href = window.location.pathname;
    });
  }
}
