// Home page UI module - Updated for tab-based layout
// - Exports initHomeUI(appState, opts)
// - Handles all the post-role-selection UI with tabs

import { getCountdown } from './countdown.js';
import { searchMedia, getMediaDetails, discoverByGenres } from './tmdb.js';
import { addFavorite, getFavorites, subscribeToFavorites, removeFavorite } from './favorites.js';
import { castVote, getVotes, hasVoted, subscribeToVotes } from './voting.js';
import { getTimeline, subscribeToTimeline } from './timeline.js';

function el(tag, opts = {}, ...children){
  const e = document.createElement(tag);
  if(opts.cls) e.className = opts.cls;
  opts.attrs = opts.attrs || {};
  if(tag === 'button' && (opts.attrs.type === undefined || opts.attrs.type === null)) opts.attrs.type = 'button';
  Object.entries(opts.attrs).forEach(([k,v])=>e.setAttribute(k,v));
  if(opts.text) e.textContent = opts.text;
  children.flat().forEach(c=>{ if(c==null) return; if(typeof c==='string') e.appendChild(document.createTextNode(c)); else e.appendChild(c); });
  return e;
}

function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleString();
}

function setStatus(container, text){
  if(!container) return;
  container.textContent = text || '';
}

function getRole(){
  return (window.APP && window.APP.role) || localStorage.getItem('role') || null;
}

function isLocalThursday(){
  return (new Date()).getDay() === 4;
}

export function initHomeUI(appState, opts = {}){
  const { roomId } = appState;

  console.log('🏠 Starting home UI...');
  
  const homeScreen = document.getElementById('home-screen');
  const roleScreen = document.getElementById('role-screen');
  if(homeScreen) {
    homeScreen.removeAttribute('hidden');
    homeScreen.style.display = 'block';
    homeScreen.style.visibility = 'visible';
    homeScreen.style.opacity = '1';
    homeScreen.style.zIndex = '1';
    homeScreen.style.position = 'relative';
  }
  if(roleScreen) {
    roleScreen.style.display = 'none';
    roleScreen.style.visibility = 'hidden';
    roleScreen.style.zIndex = '-1';
    roleScreen.style.pointerEvents = 'none';
  }

  const refs = {};
  refs.searchState = { lastQuery: '', searchSeq: 0, searchTimer: null };
  let searchDelegationAttached = false;
  let delegatedSearchHandler = null;

  // Initialize tab switching
  initTabs();

  // Update countdown
  updateCountdown();
  const countdownTimer = setInterval(updateCountdown, 1000);
  refs._countdownTimer = countdownTimer;

  // Favorites section
  const favDherru = document.getElementById('fav-dherru');
  const favNivi = document.getElementById('fav-nivi');
  const suggestionsPreview = document.getElementById('suggestions-preview');

  async function refreshFavorites(){
    try{
      const favs = await getFavorites(roomId);
      renderFavorites(favs);
      // Also refresh suggestions based on new favorites
      await refreshSuggestions(favs);
    }catch(err){ console.error(err); }
  }

  async function refreshSuggestions(favs){
    if(!favs || favs.length === 0) return;
    
    try{
      // Extract genres from all favorites
      const genreSet = new Set();
      const mediaToFetch = favs.slice(0, 5); // Limit to avoid too many API calls
      
      for(const fav of mediaToFetch){
        const details = await getMediaDetails(fav.media_id, fav.media_type);
        if(details && details.genres){
          details.genres.forEach(g => genreSet.add(g.id));
        }
      }
      
      if(genreSet.size === 0) return;
      
      // Discover movies/tv by these genres
      const genreIds = Array.from(genreSet).slice(0, 3); // Limit to top 3 genres
      const suggestions = await discoverByGenres(genreIds, 'movie');
      
      // Filter out movies already in favorites
      const favIds = new Set(favs.map(f => f.media_id));
      const filtered = suggestions.filter(s => !favIds.has(s.media_id)).slice(0, 8);
      
      // Render suggestions
      suggestionsPreview.innerHTML = '';
      filtered.forEach(s => {
        suggestionsPreview.appendChild(createMovieCard(s, false));
      });
    }catch(err){ console.error('refreshSuggestions error', err); }
  }

  function renderFavorites(favs){
    favDherru.innerHTML = '';
    favNivi.innerHTML = '';
    suggestionsPreview.innerHTML = '<p class="loading-text" style="grid-column: 1/-1; text-align: center; color: #999;">Finding similar movies...</p>';

    if(!favs || favs.length === 0) return;

    const byRole = { Dherru: [], Nivi: [] };
    favs.forEach(f => {
      if(byRole[f.role]) byRole[f.role].push(f);
    });

    byRole.Dherru.forEach(f => {
      favDherru.appendChild(createMovieCard(f, true));
    });
    byRole.Nivi.forEach(f => {
      favNivi.appendChild(createMovieCard(f, true));
    });
  }

  function createMovieCard(item, showRemove = false){
    const card = el('div', { cls: 'movie-card' },
      el('img', { cls: 'poster', attrs: { src: item.poster || '', alt: item.title || '' } }),
      el('p', { text: item.title || 'Untitled' })
    );
    
    // Add remove button for favorites
    if(showRemove && item.media_id){
      const removeBtn = el('button', { cls: 'remove-btn', attrs: { type: 'button', title: 'Remove from favorites' }, text: '✕' });
      removeBtn.style.cssText = 'position:absolute;top:4px;right:4px;background:#ff4444;color:white;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;';
      card.style.position = 'relative';
      card.addEventListener('mouseenter', ()=>{ removeBtn.style.opacity = '1'; });
      card.addEventListener('mouseleave', ()=>{ removeBtn.style.opacity = '0'; });
      
      removeBtn.addEventListener('click', async (e)=>{
        e.stopPropagation();
        try{
          await removeFavorite(roomId, item.media_id, item.media_type);
          await refreshFavorites();
        }catch(err){ console.error('remove error', err); }
      });
      
      card.appendChild(removeBtn);
    }
    
    return card;
  }

  let favSub = null;
  try{ favSub = subscribeToFavorites(roomId, ()=>{ refreshFavorites(); }); }catch(e){ console.error('fav subscribe', e); }
  refreshFavorites();

  // Refresh suggestions periodically (every 5 minutes) to get dynamic recommendations
  let suggestionsRefreshTimer = setInterval(async () => {
    try{
      const favs = await getFavorites(roomId);
      await refreshSuggestions(favs);
    }catch(err){ console.error('periodic suggestions refresh error', err); }
  }, 5 * 60 * 1000); // 5 minutes
  refs._suggestionsRefreshTimer = suggestionsRefreshTimer;

  // Search section
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const searchResults = document.getElementById('search-results');
  const searchStatus = document.querySelector('.search-status');

  // Helper function to perform the search
  async function performSearch(q){
    if(!q) {
      searchResults.innerHTML = '';
      setStatus(searchStatus, '');
      return;
    }
    setStatus(searchStatus, 'Searching...');
    try{
      const items = await searchMedia(q);
      searchResults.innerHTML = '';
      items.slice(0,8).forEach(it => {
        const card = el('div', { cls: 'movie-card' },
          el('img', { cls: 'poster', attrs: { src: it.poster || '', alt: it.title || '' } }),
          el('p', { text: it.title || 'Untitled' })
        );
        card.addEventListener('click', async () => {
          try{
            const currentRole = getRole();
            await addFavorite(roomId, currentRole, it);
            alert('Added to favorites!');
            refreshFavorites();
          }catch(e){ console.error('add error', e); }
        });
        searchResults.appendChild(card);
      });
      setStatus(searchStatus, items.length === 0 ? 'No results' : '');
    }catch(err){ console.error(err); setStatus(searchStatus, 'Search failed'); }
  }

  // Debounced search on input
  let searchTimeout;
  const DEBOUNCE_DELAY = 500; // 500ms delay
  
  searchInput.addEventListener('input', (e) => {
    const q = (e.target.value || '').trim();
    
    // Clear previous timeout
    if(searchTimeout) clearTimeout(searchTimeout);
    
    // Set new debounced search
    searchTimeout = setTimeout(() => {
      performSearch(q);
    }, DEBOUNCE_DELAY);
  });

  // Search button click for immediate search
  searchBtn.addEventListener('click', async ()=>{
    const q = (searchInput.value || '').trim();
    if(searchTimeout) clearTimeout(searchTimeout);
    await performSearch(q);
  });

  // Voting section
  const voteGrid = document.getElementById('vote-grid');
  const votingResult = document.getElementById('voting-result');

  async function refreshVoting(){
    try{
      const favs = await getFavorites(roomId);
      const currentRole = getRole();
      const voted = await hasVoted(roomId, currentRole);
      
      voteGrid.innerHTML = '';
      favs.forEach(f => {
        const card = el('div', { cls: 'movie-card' },
          el('img', { cls: 'poster', attrs: { src: f.poster || '', alt: f.title || '' } }),
          el('p', { text: f.title || 'Untitled' })
        );
        card.style.cursor = 'pointer';
        card.style.position = 'relative';
        
        if(voted){
          const badge = el('div', { text: '✓ Voted' });
          badge.style.cssText = 'position:absolute;top:8px;right:8px;background:#ffb3c6;color:#1f1b2e;padding:4px 8px;border-radius:12px;font-size:0.75rem;font-weight:600;';
          card.appendChild(badge);
          card.style.opacity = '0.7';
          card.style.cursor = 'default';
        } else {
          card.addEventListener('click', async () => {
            try{
              await castVote(roomId, currentRole, { media_id: f.media_id, media_type: f.media_type });
              await refreshVoting();
              await renderVotingResult();
            }catch(e){ console.error('vote error', e); }
          });
        }
        voteGrid.appendChild(card);
      });
      
      await renderVotingResult();
    }catch(err){ console.error(err); }
  }

  async function renderVotingResult(){
    votingResult.innerHTML = '';
    const votes = await getVotes(roomId);
    if(!votes || votes.length < 2) return;

    const tally = {};
    votes.forEach(v => {
      const key = `${v.media_id}:${v.media_type}`;
      tally[key] = (tally[key] || 0) + 1;
    });

    const entries = Object.entries(tally).sort((a,b)=>b[1]-a[1]);
    const [winnerKey] = entries[0];
    const [media_id, media_type] = winnerKey.split(':');
    
    const winner = await getFavorites(roomId).then(favs => 
      favs.find(f => f.media_id === media_id && f.media_type === media_type)
    );

    if(winner){
      const prefix = isLocalThursday() ? "Tonight, we're watching" : 'Leading choice';
      votingResult.appendChild(el('div', { cls: 'winner', text: prefix }));
      
      const meta = el('div', { cls: 'winner-meta' },
        el('img', { cls: 'poster', attrs: { src: winner.poster || '', alt: winner.title || '' } }),
        el('div', { cls: 'title', text: winner.title })
      );
      votingResult.appendChild(meta);
    }
  }

  try{ subscribeToVotes(roomId, ()=>{ refreshVoting(); }); }catch(e){ console.error('vote subscribe', e); }
  refreshVoting();

  // Timeline section
  const timelineList = document.getElementById('timeline-list');

  async function refreshTimeline(){
    try{
      const items = await getTimeline(roomId);
      timelineList.innerHTML = '';
      if(!items || items.length === 0) return;
      
      items.forEach(it => {
        const entry = el('div', { cls: 'timeline-entry' },
          el('div', { cls: 'title', text: it.title || it.event_type }),
          it.message ? el('div', { cls: 'message', text: it.message }) : null,
          el('div', { cls: 'date', text: fmtDate(it.created_at) })
        );
        timelineList.appendChild(entry);
      });
    }catch(err){ console.error(err); }
  }

  try{ subscribeToTimeline(roomId, (ev)=>{ if(ev.event==='INSERT') refreshTimeline(); }); }catch(e){ console.error(e); }
  refreshTimeline();

  // Tab switching
  function initTabs(){
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        
        tab.classList.add('active');
        const tabId = tab.getAttribute('data-tab');
        const panel = document.getElementById(tabId);
        if(panel) panel.classList.add('active');
      });
    });
  }

  function updateCountdown(){
    const now = new Date();
    const day = now.getDay();
    const diff = (4 - day + 7) % 7 || 7;
    const target = new Date(now);
    target.setDate(now.getDate() + diff);
    target.setHours(20, 0, 0, 0);

    const time = target - now;
    const d = Math.floor(time / (1000*60*60*24));
    const h = Math.floor(time / (1000*60*60) % 24);
    const m = Math.floor(time / (1000*60) % 60);
    const s = Math.floor(time / 1000 % 60);

    document.getElementById('days').textContent = d;
    document.getElementById('hours').textContent = String(h).padStart(2,'0');
    document.getElementById('minutes').textContent = String(m).padStart(2,'0');
    document.getElementById('seconds').textContent = String(s).padStart(2,'0');
  }

  console.log('✅ Home UI initialized');

  return {
    destroy(){
      clearInterval(refs._countdownTimer);
      clearInterval(refs._suggestionsRefreshTimer);
      if(favSub && favSub.unsubscribe) favSub.unsubscribe();
      if(delegatedSearchHandler) document.removeEventListener('input', delegatedSearchHandler);
      if(refs.searchState && refs.searchState.searchTimer) clearTimeout(refs.searchState.searchTimer);
    }
  };
}
