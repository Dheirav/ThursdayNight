// UI rendering for Sai’s Thursday main features
import { getFavorites, addFavorite } from './favorites.js';
import { getPersonalizedRecommendations } from './recommendations.js';
import { voteForMovie, getVotes } from './voting.js';
import { getCountdownString } from './countdown.js';
import { getMemories } from './timeline.js';
import { getRomanticMessages, revealMessage } from './romantic.js';

export async function renderDashboard(roomId, role) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="glass-panel">
      <div class="gradient-title">Sai’s Thursday</div>
      <div class="subtitle">For our Thursdays together, ${role === 'Sai' ? 'Sai' : 'you'}!</div>
      <div id="countdown" class="countdown"></div>
      <div style="display:flex; gap:2rem; flex-wrap:wrap; justify-content:center;">
        <div id="favorites-panel"></div>
        <div id="recommendations-panel"></div>
      </div>
      <div id="voting-panel"></div>
      <div id="timeline-panel"></div>
      ${role === 'Sai' ? '<div id="romantic-panel"></div>' : ''}
    </div>
  `;
  renderCountdown();
  renderFavorites(roomId);
  renderRecommendations(roomId, role);
  renderVoting(roomId, role);
  renderTimeline(roomId);
  if (role === 'Sai') renderRomantic(roomId);
}

function renderCountdown() {
  const el = document.getElementById('countdown');
  function update() {
    el.textContent = getCountdownString();
  }
  update();
  setInterval(update, 1000);
}

async function renderFavorites(roomId) {
  const youFavs = await getFavorites(roomId, 'You');
  const saiFavs = await getFavorites(roomId, 'Sai');
  document.getElementById('favorites-panel').innerHTML = `
    <div style="display:flex; gap:2rem;">
      <div><h3>You</h3>${renderPosterGrid(youFavs)}</div>
      <div><h3>Sai</h3>${renderPosterGrid(saiFavs)}</div>
    </div>
    <div style="margin-top:1rem;">
      <input id="fav-input" placeholder="Add a movie or show you love..." style="padding:0.5rem; border-radius:1rem; border:none; width:60%;" />
      <button id="fav-add-btn" class="start-btn">Add</button>
    </div>
  `;
  document.getElementById('fav-add-btn').onclick = async () => {
    const query = document.getElementById('fav-input').value;
    if (!query) return;
    // For demo, just add a dummy favorite (replace with TMDB search modal in production)
    await addFavorite(roomId, sessionStorage.getItem('role'), { id: Date.now(), title: query, media_type: 'movie', poster_path: '', vote_average: 10 });
    renderFavorites(roomId);
  };
}

function renderPosterGrid(items) {
  if (!items.length) return '<div style="opacity:0.5;">No favorites yet</div>';
  return `<div style="display:flex; gap:1rem; flex-wrap:wrap;">${items.map(item => `
    <div class="poster-card" style="background:rgba(255,255,255,0.2); border-radius:1rem; box-shadow:0 2px 16px #ffb6b9; padding:0.5rem; width:120px;">
      <div style="height:180px; background:#eee; border-radius:1rem; margin-bottom:0.5rem; overflow:hidden;">
        ${item.poster ? `<img src="https://image.tmdb.org/t/p/w200${item.poster}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;" />` : '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;">No Image</div>'}
      </div>
      <div style="font-weight:bold;">${item.title}</div>
      <div style="font-size:0.9em; color:#cdb4f6;">${item.media_type}</div>
      <div style="font-size:0.9em; color:#b8f2e6;">⭐ ${item.rating || ''}</div>
    </div>
  `).join('')}</div>`;
}

async function renderRecommendations(roomId, role) {
  const recs = await getPersonalizedRecommendations(roomId, role);
  document.getElementById('recommendations-panel').innerHTML = `
    <h3>Recommendations for ${role}</h3>
    ${renderPosterGrid(recs)}
  `;
}

async function renderVoting(roomId, role) {
  const votes = await getVotes(roomId);
  document.getElementById('voting-panel').innerHTML = `
    <h3>Final Thursday Voting</h3>
    <div style="display:flex; gap:1rem;">
      ${votes.map(v => `<div style="padding:1rem; border-radius:1rem; background:rgba(255,255,255,0.3); box-shadow:0 0 8px #fff6b7;">${v.media_id} <br/> <span style="color:#ffb6b9;">${v.role}</span></div>`).join('')}
    </div>
    <button class="start-btn" id="vote-btn">Vote for a random favorite</button>
  `;
  document.getElementById('vote-btn').onclick = async () => {
    // For demo, vote for a random favorite
    const favs = await getFavorites(roomId, role);
    if (!favs.length) return alert('Add a favorite first!');
    const pick = favs[Math.floor(Math.random() * favs.length)];
    await voteForMovie(roomId, pick.media_id, role);
    renderVoting(roomId, role);
  };
}

async function renderTimeline(roomId) {
  const memories = await getMemories(roomId);
  document.getElementById('timeline-panel').innerHTML = `
    <h3>Memory Timeline</h3>
    <div style="display:flex; flex-direction:column; gap:0.5rem;">
      ${memories.map(m => `<div style="background:rgba(255,255,255,0.2); border-radius:1rem; padding:0.5rem 1rem; box-shadow:0 2px 8px #cdb4f6;">
        <span style="color:#cdb4f6; font-weight:bold;">${new Date(m.date).toLocaleDateString()}</span> — <span style="color:#ffb6b9;">${m.title}</span>
      </div>`).join('')}
    </div>
  `;
}

async function renderRomantic(roomId) {
  const messages = await getRomanticMessages(roomId);
  const unrevealed = messages.find(m => !m.revealed);
  document.getElementById('romantic-panel').innerHTML = `
    <h3>Secret Romantic Messages</h3>
    <div style="margin:1rem 0;">
      ${unrevealed ? `<div class="glass-panel" style="background:rgba(255,182,185,0.3); box-shadow:0 0 16px #ffb6b9; animation:glowReveal 1s ease-in;">
        <span style="font-size:1.2em; color:#ffb6b9;">${unrevealed.message}</span>
        <br/><button id="reveal-btn" class="start-btn" style="margin-top:1rem;">Reveal Next</button>
      </div>` : '<div style="opacity:0.7;">All messages revealed!</div>'}
    </div>
  `;
  if (unrevealed) {
    document.getElementById('reveal-btn').onclick = async () => {
      await revealMessage(roomId, unrevealed.id);
      renderRomantic(roomId);
    };
  }
}
