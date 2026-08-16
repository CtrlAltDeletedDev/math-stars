// Calendar days, in the child's own time zone.
//
// `new Date().toISOString().split('T')[0]` returns the *UTC* date. In US time
// zones that flips to tomorrow in the late afternoon or evening — so an
// after-dinner session got filed under the next day, which broke play streaks,
// marked the wrong square on the calendar, and could let the daily challenge be
// played twice. Every day-boundary decision in the app goes through here.

/** Local calendar date as YYYY-MM-DD. */
export function todayString(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local calendar date `n` days before today, as YYYY-MM-DD. */
export function daysAgoString(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() - n);
  return todayString(d);
}

export function yesterdayString(from: Date = new Date()): string {
  return daysAgoString(1, from);
}
