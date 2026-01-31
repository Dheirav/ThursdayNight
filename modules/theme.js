// modules/theme.js
// Provides randomized pastel theme, microcopy, and helpers to apply theme to the page
export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const phrases = [
  "This week feels cozy",
  "Something new for us today",
  "Nivi, I added something fresh for you",
  "Our Thursdays, our little tradition",
  "A cozy corner made for you",
  "Nivi, this space is ours"
];

const palettes = [
  {bg:['#FFD6E0','#FFF1F0'], accent:'#FFB6B9', accent2:'#CDB4F6'},
  {bg:['#FFF5E6','#FFEFE8'], accent:'#FFD1A9', accent2:'#A7C7E7'},
  {bg:['#F3E8FF','#FFF6FD'], accent:'#CDB4F6', accent2:'#B8F2E6'},
  {bg:['#E8FFF5','#F7FFF5'], accent:'#B8F2E6', accent2:'#FFD6E0'},
  {bg:['#FFF6F0','#FFF0FA'], accent:'#FFF6B7', accent2:'#FFB6B9'}
];

export function initTheme() {
  const p = randomFrom(palettes);
  const phrase = randomFrom(phrases);
  const angle = Math.floor(Math.random() * 360);
  const gradient = `linear-gradient(${angle}deg, ${p.bg[0]} 0%, ${p.bg[1]} 100%)`;

  // Apply CSS variables
  const root = document.documentElement;
  root.style.setProperty('--theme-gradient', gradient);
  root.style.setProperty('--theme-accent', p.accent);
  root.style.setProperty('--theme-accent-2', p.accent2);
  root.style.setProperty('--theme-accent-glow', `${p.accent}55`);
  root.style.setProperty('--theme-phrase', `'${phrase}'`);

  return { gradient, accent: p.accent, accent2: p.accent2, phrase };
}

// Pick a featured item from an array of movies (if provided)
export function pickFeatured(movies=[]) {
  if (!movies || !movies.length) return null;
  return movies[Math.floor(Math.random() * movies.length)];
}
