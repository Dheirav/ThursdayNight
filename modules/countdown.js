// Countdown to next Thursday for Sai’s Thursday
export function getNextThursday() {
  const now = new Date();
  const day = now.getDay();
  const diff = (4 - day + 7) % 7 || 7; // 4 = Thursday
  const next = new Date(now);
  next.setDate(now.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function getCountdownString() {
  const now = new Date();
  const next = getNextThursday();
  const diff = next - now;
  if (diff <= 0) return 'It’s Thursday!';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return `${days}d ${hours}h ${mins}m ${secs}s until our next Thursday`;
}
