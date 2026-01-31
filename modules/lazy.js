// modules/lazy.js
// Simple IntersectionObserver-based lazy loader for images with data-src
export function observeLazyImages(root=document) {
  const imgs = Array.from(root.querySelectorAll('img[data-src]'));
  if (!imgs.length) return;
  if (!('IntersectionObserver' in window)) {
    // fallback: load all
    imgs.forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
    return;
  }

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.remove('lazy-img');
        observer.unobserve(img);
      }
    });
  }, { root: null, rootMargin: '100px', threshold: 0.01 });

  imgs.forEach(img => {
    // if already has no src, set a tiny transparent placeholder to avoid layout shift optionally
    if (!img.src) img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    io.observe(img);
  });
}
