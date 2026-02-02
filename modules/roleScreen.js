// Role selection UI module
// - Exports initRoleScreen(opts)
// - Handles the initial role picker experience

import { broadcastRoleToRoom } from './roles.js';

// Helper: create element with classes and children
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

// Get role dynamically from global APP state or localStorage
function getRole(){
  return (window.APP && window.APP.role) || localStorage.getItem('role') || null;
}

export function initRoleScreen(opts = {}){
  const roleScreen = document.getElementById('role-screen');
  const homeScreen = document.getElementById('home-screen');
  if(!roleScreen || !homeScreen) { 
    console.warn('Role screen or home screen element missing'); 
    return; 
  }
  
  console.log('🎭 Rendering role selection screen...');
  
  // Always show the role picker on every page load per UX requirement.
  // Do not auto-skip even if a role is already saved.
  homeScreen.hidden = true;
  roleScreen.innerHTML = `
    <div class="role-screen-container">
      <div class="role-screen-header">
        <h1 class="role-screen-title">Nivi's Thursday</h1>
        <p class="role-screen-subtitle">A place for our movie nights</p>
      </div>
      <div class="role-screen-content">
        <h2>Who's joining us?</h2>
        <p class="role-screen-desc">Pick your seat and let's find something to watch together.</p>
        <div class="roles-grid">
          <button class="role-card role-dherru" data-role="Dherru">
            <div class="role-card-icon">🎬</div>
            <div class="role-card-name">Dherru</div>
            <div class="role-card-desc">Your picks</div>
          </button>
          <button class="role-card role-nivi" data-role="Nivi">
            <div class="role-card-icon">💜</div>
            <div class="role-card-name">Nivi</div>
            <div class="role-card-desc">Your favorites</div>
          </button>
        </div>
      </div>
    </div>
  `;
  
  roleScreen.querySelectorAll('.role-card').forEach(b => {
    b.addEventListener('click', (ev)=>{
      const r = b.getAttribute('data-role');
      console.log(`👤 Role selected: ${r}`);
      
      // Update app state via callback if provided
      if(opts && typeof opts.setRole === 'function') {
        opts.setRole(r);
      } else { 
        localStorage.setItem('role', r); 
        if(window.APP) window.APP.role = r; 
        window.dispatchEvent(new CustomEvent('app:role-changed',{detail:{role:r}})); 
      }
      
      // Broadcast to other clients
      try{ 
        broadcastRoleToRoom(r); 
      }catch(e){ 
        console.error('broadcastRoleToRoom error', e); 
      }
      
      // Hide role screen and show home, then trigger callback
      roleScreen.innerHTML = '';
      homeScreen.hidden = false;
      
      if(opts && typeof opts.onRoleSelected === 'function') {
        opts.onRoleSelected(r);
      }
    });
  });

  // Show banner when other role selected in the room
  function showOtherRoleActive(otherRole){
    let banner = document.getElementById('other-role-banner');
    if(!banner){
      banner = document.createElement('div');
      banner.id = 'other-role-banner';
      banner.style.position = 'fixed';
      banner.style.top = '0';
      banner.style.left = '0';
      banner.style.right = '0';
      banner.style.background = '#ffe6e6';
      banner.style.color = '#a00';
      banner.style.textAlign = 'center';
      banner.style.padding = '8px 0';
      banner.style.zIndex = '1000';
      document.body.appendChild(banner);
    }
    banner.textContent = `${otherRole} is active in this room.`;
    setTimeout(()=>{ if(banner) banner.remove(); }, 3000);
  }

  window.addEventListener('roles:other-selected', (ev)=>{ showOtherRoleActive(ev.detail.role); });

  return {
    destroy(){
      // Clean up event listeners if needed
      roleScreen.querySelectorAll('.role-card').forEach(b => {
        // Remove all event listeners by cloning
        const newB = b.cloneNode(true);
        b.parentNode.replaceChild(newB, b);
      });
    }
  };
}
