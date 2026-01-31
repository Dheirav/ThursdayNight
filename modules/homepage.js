// modules/homepage.js
import { initTheme, pickFeatured } from './theme.js';
import { observeLazyImages } from './lazy.js';
import { getFavorites } from './favorites.js';
import { getPersonalizedRecommendations } from './recommendations.js';
import { getVotes, voteForMovie } from './voting.js';
import { getMemories } from './timeline.js';
import { getRomanticMessages, revealMessage } from './romantic.js';

// initialize theme
const theme = initTheme();

// utilities
function el(id){ return document.getElementById(id); }

function createPosterCard(item, options = {}){
  const title = item.title || item.name || 'Untitled';
  const poster = item.poster_path || item.poster || '';
  const rating = item.vote_average || item.rating || '';
  const id = item.media_id || item.id || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'poster-card';

  const img = poster ? document.createElement('img') : document.createElement('div');
  if (poster){ img.className = 'lazy-img'; img.setAttribute('data-src', `https://image.tmdb.org/t/p/w300${poster}`); img.alt = title; }
  else { img.className = 'no-image'; img.textContent = 'No Image'; }
  wrapper.appendChild(img);

  const t = document.createElement('div'); t.className='card-title'; t.textContent = title; wrapper.appendChild(t);
  const type = document.createElement('div'); type.className='card-type'; type.textContent = options.type || '' ; wrapper.appendChild(type);
  const r = document.createElement('div'); r.className='card-rating'; r.textContent = rating ? `⭐ ${rating}` : '' ; wrapper.appendChild(r);

  // vote overlay
  if (options.voteable){
    const btn = document.createElement('button'); btn.className='vote-overlay'; btn.textContent='Vote';
    btn.setAttribute('aria-label', `Vote for ${title}`);
    btn.onclick = async () => { await voteForMovie(options.roomId, id, options.role); renderVotes(options.roomId); };
    wrapper.appendChild(btn);
  }

  return wrapper;
}

// show skeleton placeholders in a container while loading
function showSkeleton(containerId, count=4){
  const c = el(containerId); if (!c) return;
  c.innerHTML = '';
  for(let i=0;i<count;i++){
    const s = document.createElement('div'); s.className = 'skeleton';
    s.innerHTML = `<div class='skeleton-poster'></div><div class='skeleton-line'></div>`;
    c.appendChild(s);
  }
}

async function renderPosterGrid(containerId, items, opts = {}){
  const container = el(containerId);
  if (!container) {
    console.warn(`renderPosterGrid: container '${containerId}' not found`);
    return;
  }
  container.innerHTML = '';
  if (!items || items.length === 0) {
    const empty = document.createElement('div'); empty.className = 'empty-row'; empty.textContent = 'No items to show';
    container.appendChild(empty);
    return;
  }
  items.forEach(i => container.appendChild(createPosterCard(i, opts)));
  // lazy-load newly added images
  try { observeLazyImages(container); } catch(e) { /* ignore */ }
}

async function renderHeroFeatured(roomId, role){
  // pick a featured from recommendations or favorites
  const recs = await getPersonalizedRecommendations(roomId, role);
  const favs = await getFavorites(roomId, role);
  const featured = pickFeatured([...recs, ...favs]) || null;
  const hero = document.querySelector('.main-title');
  if (!hero) return;
  if (featured && featured.poster_path){
    hero.style.backgroundImage = `linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.6)), url(https://image.tmdb.org/t/p/original${featured.poster_path})`;
    hero.style.backgroundSize = 'cover';
    hero.style.backgroundPosition = 'center';
  }
}

function renderCountdown() {
  const display = document.querySelector('.countdown-timer');
  function nextThursday(){
    const now = new Date();
    const day = now.getDay();
    const diff = (11 - day) % 7; // Thursday=4, so (4 - day +7) %7 but we'll use 11 to ensure next
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    target.setHours(20,0,0,0);
    return target;
  }
  const target = nextThursday();
  function update(){
    const now = new Date();
    let d = Math.max(0, target - now);
    const days = Math.floor(d / 86400000); d %= 86400000;
    const hours = Math.floor(d/3600000); d%=3600000;
    const mins = Math.floor(d/60000); d%=60000;
    const secs = Math.floor(d/1000);
    if (display) display.textContent = `${String(days).padStart(2,'0')} Days : ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
  }
  update(); setInterval(update,1000);
}

async function renderVotes(roomId){
  const votes = await getVotes(roomId);
  // render final picks grid with vote counts and winner highlight
  const container = el('final-picks-grid'); if (!container) return;
  container.innerHTML = '';
  votes.forEach(v => {
    const card = createPosterCard(v, {voteable:false});
    const badge = document.createElement('div'); badge.className='vote-badge'; badge.textContent = v.count ? `${v.count} votes` : '0';
    card.appendChild(badge);
    if (v.winner) card.classList.add('winning');
    container.appendChild(card);
  });
  try { observeLazyImages(container); } catch(e) { }
}

async function renderTimeline(roomId){
  const memories = await getMemories(roomId);
  const container = el('timeline-grid'); if (!container) return;
  container.innerHTML = '';
  memories.forEach(m => {
    const item = document.createElement('div'); item.className='timeline-item';
    const img = document.createElement('img');
    if (m.poster_path) { img.className = 'lazy-img timeline-poster'; img.setAttribute('data-src', `https://image.tmdb.org/t/p/w200${m.poster_path}`); }
    else { img.className = 'timeline-poster'; }
    img.alt = m.title; item.appendChild(img);
    const date = document.createElement('div'); date.className='timeline-date'; date.textContent = new Date(m.date).toLocaleDateString(); item.appendChild(date);
    container.appendChild(item);
  });
  try { observeLazyImages(container); } catch(e) { }
}

async function renderRomanticSection(roomId, role){
  const container = el('romantic-panel');
  if (!container) return;
  container.innerHTML = '';
  if (role !== 'Nivi') return; // secret only for Dherru/Nivi
  const messages = await getRomanticMessages(roomId);
  const card = document.createElement('div'); card.className='romantic-secret';
  const title = document.createElement('h3'); title.textContent = 'A Little Surprise For You'; card.appendChild(title);
  const list = document.createElement('div'); list.className='romantic-list';
  messages.forEach(m => {
    const mEl = document.createElement('div'); mEl.className='rom-msg'; mEl.textContent = m.revealed ? m.message : '••••••';
    const btn = document.createElement('button'); btn.className='reveal-btn'; btn.textContent = m.revealed ? 'Revealed' : 'Reveal';
    btn.onclick = async () => { await revealMessage(roomId, m.id); renderRomanticSection(roomId, role); };
    mEl.appendChild(btn); list.appendChild(mEl);
  });
  card.appendChild(list); container.appendChild(card);
}

function renderRoleSwitcher(currentRole='Dherru'){
  const headerUser = document.querySelector('.main-user');
  if (!headerUser) return;
  headerUser.innerHTML = '';
  const roles = ['Dherru','Nivi'];
  roles.forEach(r => {
    const btn = document.createElement('button');
    btn.className = 'role-chip';
    if (r === currentRole) btn.classList.add('active');
    btn.textContent = r;
    btn.onclick = () => {
      sessionStorage.setItem('role', r);
      // re-init homepage for new role
      initHomepage();
    };
    headerUser.appendChild(btn);
  });
  // small avatar at end
  const avatar = document.createElement('img'); avatar.src='assets/user1.svg'; avatar.className='user-avatar'; avatar.alt='Dherru';
  headerUser.appendChild(avatar);
}

// orchestrator
export async function initHomepage(roomId='demo-room'){
  const role = sessionStorage.getItem('role') || 'Dherru';
  // ensure basic page skeleton exists in #root so subsequent renderers find containers
  const root = document.getElementById('root');
  if (!root) {
    console.warn('initHomepage: #root not found');
    return;
  }
  root.innerHTML = `
    <header class="hero main-title"> 
      <div class="hero-inner">
        <div class="main-brand">Dherru & Nivi</div>
        <div class="main-user"></div>
        <div class="countdown-timer"></div>
      </div>
    </header>
    <main class="three-col-grid">
      <div class="col col-left">
        <div class="block">
          <h3>Dherru's Favorites</h3>
          <div id="user-favorites-grid" class="poster-grid"></div>
        </div>
        <div class="block">
          <h3>Nivi's Favorites</h3>
          <div id="nivi-favorites-grid" class="poster-grid"></div>
        </div>
      </div>

      <div class="col col-center">
        <div class="block">
          <h3>Recommendations</h3>
          <div id="recommendations-grid" class="poster-grid"></div>
        </div>
        <div class="block">
          <h3>Final Picks</h3>
          <div id="final-picks-grid" class="poster-grid"></div>
        </div>
      </div>

      <div class="col col-right">
          <div class="block search-panel">
            <h3>Search</h3>
            <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.6rem;">
              <input id="global-search" placeholder="Search movies or shows" aria-label="Search movies" style="flex:1;" />
              <select id="global-type" title="Filter type" style="border-radius:8px; padding:0.4rem; background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.06);">
                <option value="movie">Movies</option>
                <option value="tv">TV Shows</option>
                <option value="multi">All</option>
              </select>
            </div>
            <div style="display:flex; gap:0.5rem; margin-bottom:0.6rem; align-items:center;">
              <input id="year-from" placeholder="Year from" style="width:90px; padding:0.4rem; border-radius:8px;" />
              <input id="year-to" placeholder="Year to" style="width:90px; padding:0.4rem; border-radius:8px;" />
              <select id="global-sort" style="margin-left:auto; border-radius:8px; padding:0.4rem;">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="rating">Rating</option>
                <option value="popularity">Popularity</option>
              </select>
            </div>
            <div style="font-size:0.85rem; color:rgba(255,255,255,0.65); margin-bottom:0.5rem;">Search results: filtered by year range and sorted (default: newest first)</div>
            <div id="global-suggestions" class="suggestions"></div>
          </div>
        <div class="block">
          <h3>Timeline</h3>
          <div id="timeline-grid" class="timeline-grid"></div>
        </div>
        <aside id="romantic-panel"></aside>
      </div>
    </main>
  `;

  renderRoleSwitcher(role);
  renderCountdown();
  // attach global search handler
  const searchInput = document.getElementById('global-search');
  const suggestions = document.getElementById('global-suggestions');
  if (searchInput && suggestions) {
    // detail modal helper (shows details and allows adding to favorites)
    function showDetailModal(details, mediaType){
      try{
        const existing = document.getElementById('detail-modal');
        let modal = existing;
        if (!modal){
          modal = document.createElement('div'); modal.id='detail-modal'; modal.className='detail-modal';
          modal.innerHTML = `
            <div class="detail-backdrop" id="detail-backdrop"></div>
            <div class="detail-card" id="detail-card">
              <button class="detail-close" id="detail-close">×</button>
              <div id="detail-content">Loading…</div>
            </div>
          `;
          document.body.appendChild(modal);
        }
        const content = modal.querySelector('#detail-content');
        content.innerHTML = `
          <div class="detail-header">
            <img class="detail-poster" src="https://image.tmdb.org/t/p/w342${details.poster_path||''}" />
            <div>
              <h2>${details.title||details.name}</h2>
              <p class="muted">${(details.release_date||details.first_air_date||'').slice(0,10)} • ${mediaType}</p>
              <p class="muted small">${details.tagline||''}</p>
            </div>
          </div>
          <div class="detail-overview">${details.overview||'No overview available.'}</div>
          <div class="detail-actions">
            <button id="add-favorite-from-modal" class="btn primary">Add to Favorites</button>
            <button id="close-modal" class="btn ghost">Close</button>
          </div>
        `;
        modal.style.display = 'block';
        modal.querySelector('#detail-backdrop').onclick = closeModal;
        modal.querySelector('#detail-close').onclick = closeModal;
        modal.querySelector('#close-modal').onclick = closeModal;
        modal.querySelector('#add-favorite-from-modal').onclick = async ()=>{
          const role = sessionStorage.getItem('role') || 'Dherru';
          try{ await import('./favorites.js').then(m => m.addFavorite('demo-room', role, { media_id: details.id, title: details.title||details.name, media_type: mediaType, poster_path: details.poster_path })); }catch(e){ console.warn('addFavorite failed', e); }
          try{ await renderPosterGrid('user-favorites-grid', await getFavorites('demo-room', 'Dherru'), {type:'Favorite'}); }catch(e){}
          try{ await renderPosterGrid('nivi-favorites-grid', await getFavorites('demo-room', 'Nivi'), {type:"Nivi's Pick"}); }catch(e){}
          closeModal();
        };
        function closeModal(){ modal.style.display='none'; }
      }catch(err){ console.warn('modal error',err); }
    }

    function debounce(fn, wait=300){ let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; }
    async function doSearch(q){
      const query = (q||'').trim();
      if (!query){ suggestions.innerHTML=''; return; }
      suggestions.innerHTML = '<div class="mini-spinner"></div>';
      try{
        const typeSelect = document.getElementById('global-type');
        const typeParam = typeSelect ? typeSelect.value || 'movie' : 'movie';
        const apiType = typeParam === 'multi' ? 'multi' : typeParam; // pass through
        const yearFrom = parseInt(document.getElementById('year-from')?.value || '') || null;
        const yearTo = parseInt(document.getElementById('year-to')?.value || '') || null;
        const sortOrder = document.getElementById('global-sort')?.value || 'newest';

        const { results } = await import('./tmdb.js').then(m => m.searchTMDB(query, apiType));
        if (!results || !results.length){ suggestions.innerHTML = '<div class="muted">No results</div>'; return; }

        function getDateVal(r){ const d = r.release_date || r.first_air_date || ''; return d ? new Date(d).getTime() : 0; }
        // filter by year range if provided
        let filtered = results.filter(r => {
          const year = (r.release_date || r.first_air_date || '').slice(0,4);
          if (!year) return true;
          const y = parseInt(year);
          if (yearFrom && y < yearFrom) return false;
          if (yearTo && y > yearTo) return false;
          return true;
        });

        // sort according to sortOrder (only affects search results)
        if (sortOrder === 'newest') filtered.sort((a,b) => getDateVal(b) - getDateVal(a));
        else if (sortOrder === 'oldest') filtered.sort((a,b) => getDateVal(a) - getDateVal(b));
        else if (sortOrder === 'rating') filtered.sort((a,b) => (b.vote_average||0) - (a.vote_average||0));
        else if (sortOrder === 'popularity') filtered.sort((a,b) => (b.popularity||0) - (a.popularity||0));

        suggestions.innerHTML = filtered.slice(0,12).map(r => `
          <div class="suggest-item" data-id="${r.id}" data-type="${r.media_type || (apiType==='movie'?'movie':(apiType==='tv'?'tv':'mixed'))}">
            <img class="lazy-img" data-src="https://image.tmdb.org/t/p/w92${r.poster_path || r.poster || r.backdrop_path || ''}" />
            <div class="sugg-meta"><strong>${r.title || r.name}</strong><br/><small>${(r.release_date || r.first_air_date || '').slice(0,4)}</small></div>
          </div>
        `).join('');
        try{ observeLazyImages(suggestions); }catch(e){}

        Array.from(suggestions.querySelectorAll('.suggest-item')).forEach(el=> el.onclick = async ()=>{
          const id = el.getAttribute('data-id');
          const mtype = el.getAttribute('data-type') || 'movie';
          // open detail modal instead of auto-adding to favorites
          try{
            const details = await import('./tmdb.js').then(m => m.getTMDBDetails(id, mtype));
            showDetailModal(details, mtype);
          }catch(err){ console.warn('Failed to load details', err); }
        });
      }catch(err){ suggestions.innerHTML = '<div class="muted">Search failed</div>'; }
    }
    const deb = debounce(doSearch, 350);
    searchInput.addEventListener('input', e=> deb(e.target.value));
  }
  // show skeletons while loading
  showSkeleton('user-favorites-grid',4);
  showSkeleton('nivi-favorites-grid',4);
  showSkeleton('recommendations-grid',5);
  showSkeleton('final-picks-grid',3);
  showSkeleton('timeline-grid',4);

  await renderHeroFeatured(roomId, role);
  const userFavs = await getFavorites(roomId, role);
  await renderPosterGrid('user-favorites-grid', userFavs, {type:'Favorite'});
  const partner = role === 'Dherru' ? 'Nivi' : 'Dherru';
  const niviFavs = await getFavorites(roomId, partner);
  await renderPosterGrid('nivi-favorites-grid', niviFavs, {type:"Nivi's Pick"});
  const recs = await getPersonalizedRecommendations(roomId, role);
  await renderPosterGrid('recommendations-grid', recs, {type:'Recommended'});
  await renderVotes(roomId);
  await renderTimeline(roomId);
  await renderRomanticSection(roomId, role);
}

// Auto-run for the page
document.addEventListener('DOMContentLoaded', () => { initHomepage(); });
