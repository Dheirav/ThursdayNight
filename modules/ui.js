// UI rendering for Sai’s Thursday main features
import { getFavorites, addFavorite } from './favorites.js';
import { getPersonalizedRecommendations } from './recommendations.js';
import { voteForMovie, getVotes } from './voting.js';
import { getCountdownString } from './countdown.js';
import { getMemories } from './timeline.js';
import { getRomanticMessages, revealMessage } from './romantic.js';
import { observeLazyImages } from './lazy.js';

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
      <input id="fav-input" placeholder="Search for a movie..." style="padding:0.5rem; border-radius:1rem; border:none; width:60%;" autocomplete="off" aria-label="Search movies" />
      <div id="fav-suggestions" style="background:rgba(255,255,255,0.9); border-radius:1rem; box-shadow:0 2px 8px rgba(0,0,0,0.08); position:relative; z-index:10;"></div>
    </div>
  `;
  const input = document.getElementById('fav-input');
  const suggestions = document.getElementById('fav-suggestions');
  let lastQuery = '';

  function debounce(fn, wait = 300){ let t; return (...args) => { clearTimeout(t); t = setTimeout(()=>fn(...args), wait); }; }

  async function doSearch(query){
    suggestions.innerHTML = '<div style="padding:0.5rem;"><div class="spinner"></div></div>';
    try {
      const { results } = await import('./tmdb.js').then(m => m.searchTMDB(query, 'movie'));
      if (!results || !results.length) {
        suggestions.innerHTML = '<div style="padding:0.5rem; color:#c00;">No movies found.</div>';
        return;
      }
      suggestions.innerHTML = results.slice(0,6).map(movie => `
        <div class="fav-suggestion" role="button" tabindex="0" aria-label="Select ${movie.title}" style="padding:0.5rem; cursor:pointer; display:flex; align-items:center; gap:1rem;" data-id="${movie.id}" data-title="${movie.title}" data-poster="${movie.poster_path}" data-vote="${movie.vote_average}">
          <img class="lazy-img" data-src="https://image.tmdb.org/t/p/w92${movie.poster_path}" style="width:32px; height:48px; object-fit:cover; border-radius:0.5rem;" />
          <span>${movie.title} (${movie.release_date ? movie.release_date.slice(0,4) : ''})</span>
        </div>
      `).join('');
      // activate lazy loader for suggestion thumbnails
      try { observeLazyImages(suggestions); } catch(e) {}
      Array.from(document.getElementsByClassName('fav-suggestion')).forEach(el => {
        el.onclick = async () => {
          const id = el.getAttribute('data-id');
          const title = el.getAttribute('data-title');
          const poster = el.getAttribute('data-poster');
          const vote = el.getAttribute('data-vote');
          await addFavorite(roomId, sessionStorage.getItem('role'), {
            media_id: id,
            title,
            media_type: 'movie',
            poster_path: poster,
            vote_average: vote
          });
          input.value = '';
          suggestions.innerHTML = '';
          renderFavorites(roomId);
        };
        el.onkeypress = (ev) => { if (ev.key === 'Enter') el.click(); };
      });
    } catch (err) {
      suggestions.innerHTML = `<div style="padding:0.5rem; color:#c00;">Error searching TMDB. <button id="retry-search">Retry</button></div>`;
      const retry = document.getElementById('retry-search');
      if (retry) retry.onclick = () => doSearch(query);
    }
  }

  const deb = debounce(doSearch, 350);
  input.addEventListener('input', (e) => {
    const query = input.value.trim();
    if (!query) { suggestions.innerHTML = ''; lastQuery = ''; return; }
    if (query === lastQuery) return;
    lastQuery = query;
    deb(query);
  });
}

function renderPosterGrid(items) {
  if (!items.length) return '<div style="opacity:0.5;">No favorites yet</div>';
  return `<div class="poster-grid">${items.map(item => `
    <div class="poster-card">
      ${item.poster ? `<img src="https://image.tmdb.org/t/p/w300${item.poster}" alt="${item.title}" />` : '<div class="no-image">No Image</div>'}
      <div class="card-title">${item.title}</div>
      <div class="card-type">${item.media_type}</div>
      <div class="card-rating">${item.rating ? `⭐ ${item.rating}` : ''}</div>
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
