// Simple toast utility
export function showToast(message, type='info', opts={duration:3000}){
  try{
    let container = document.getElementById('toast-container');
    if (!container){ container = document.createElement('div'); container.id = 'toast-container'; container.className='toast-container'; document.body.appendChild(container); }
    const t = document.createElement('div'); t.className = `toast toast-${type}`; t.textContent = message;
    container.appendChild(t);
    // auto-remove
    setTimeout(()=>{ t.classList.add('toast-hide'); setTimeout(()=> t.remove(), 300); }, opts.duration || 3000);
    return t;
  }catch(e){ console.warn('showToast failed', e); }
}

export default showToast;
