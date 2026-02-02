// Countdown helpers targeting the next Thursday at 00:00 local time.
// Exports:
// - getNextThursday(): Date (next Thursday at 00:00 local time)
// - getCountdown(): { days, hours, minutes, seconds }

/**
 * Return a Date object for the upcoming Thursday at 00:00 local time.
 * If today is Thursday, returns next Thursday (7 days ahead).
 */
export function getNextThursday(now = new Date()){
  // local day of week: 0 (Sunday) .. 6 (Saturday)
  const day = now.getDay();
  // Target Thursday is weekday 4 (Sunday=0 -> Thursday=4)
  let daysUntil = (4 - day + 7) % 7;
  if(daysUntil === 0) daysUntil = 7; // if today is Thursday, pick next Thursday

  const target = new Date(now);
  target.setDate(now.getDate() + daysUntil);
  // Set to 00:00 local time
  target.setHours(0,0,0,0);
  target.setMilliseconds(0);
  return target;
}

/**
 * Return a countdown object to the upcoming Thursday.
 * Values are integers: days, hours, minutes, seconds.
 */
export function getCountdown(now = new Date()){
  const target = getNextThursday(now);
  let diffMs = target.getTime() - now.getTime();
  if(diffMs < 0) diffMs = 0; // safety

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  let rem = totalSeconds % 86400;
  const hours = Math.floor(rem / 3600);
  rem = rem % 3600;
  const minutes = Math.floor(rem / 60);
  const seconds = rem % 60;

  return { days, hours, minutes, seconds };
}
