// Role selection for Sai’s Thursday
export function renderRoleSelection(onSelect) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="glass-panel">
      <div class="gradient-title">Who are you today?</div>
      <div class="subtitle">Choose your role to enter our cozy space</div>
      <div style="display:flex; gap:2rem; justify-content:center; margin:2rem 0;">
        <button class="role-btn" data-role="You">You</button>
        <button class="role-btn" data-role="Sai">Sai</button>
      </div>
    </div>
  `;
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      onSelect(e.target.dataset.role);
    });
  });
}
