/**
 * Local-only personal planning, NOT a WoningNet account snapshot.
 * No account IDs, cookies or external network data are read or stored.
 */
export const MANUAL_PROGRESS_STORAGE_KEY = 'woonpoints:manual-progress:v1';
export const MANUAL_MONTHLY_GOAL = 4;

export function localMonthKey(now = new Date()) {
  if (!(now instanceof Date)) throw new TypeError('A real date is required');
  const year = Date.prototype.getFullYear.call(now);
  const month = Date.prototype.getMonth.call(now);
  if (!Number.isInteger(year) || !Number.isInteger(month) || year < 2000 || year > 9999) {
    throw new RangeError('Invalid planning month');
  }
  return `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}`;
}

/** Delay until local midnight, including 23/25-hour DST days. */
export function msUntilNextLocalMidnight(now = new Date()) {
  if (!(now instanceof Date)) throw new TypeError('A real date is required');
  const epoch = Date.prototype.getTime.call(now);
  if (!Number.isFinite(epoch)) throw new RangeError('Invalid planning clock');
  const next = new Date(Date.prototype.getFullYear.call(now),
    Date.prototype.getMonth.call(now), Date.prototype.getDate.call(now) + 1);
  const delay = Date.prototype.getTime.call(next) - epoch;
  if (!Number.isFinite(delay) || delay <= 0 || delay > 26 * 3600000) throw new RangeError('Invalid local midnight');
  return delay;
}

/** Personal-only reminder; never represents validated WoningNet activity. */
export function manualPlanningNudge(month, count, now = new Date()) {
  if (typeof month !== 'string' || !Number.isSafeInteger(count) ||
      count < 0 || count >= MANUAL_MONTHLY_GOAL) return null;
  if (month !== localMonthKey(now)) return null;
  const day = Date.prototype.getDate.call(now);
  if (day < 15) return null;
  const lastDay = new Date(Date.prototype.getFullYear.call(now),
    Date.prototype.getMonth.call(now) + 1, 0).getDate();
  return { missing: MANUAL_MONTHLY_GOAL - count,
    urgency: lastDay - day <= 7 ? 'late' : 'midmonth' };
}

export function clearManualProgress(storage) {
  storage.removeItem(MANUAL_PROGRESS_STORAGE_KEY);
}

export function encodeManualProgress(month, count) {
  if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month) ||
      !Number.isSafeInteger(count) || count < 0 || count > MANUAL_MONTHLY_GOAL) {
    throw new TypeError('Invalid local planning progress');
  }
  return JSON.stringify({ version: 1, month, count });
}

/** Old, forged, corrupt and other-month data stay unknown rather than becoming 0/4. */
export function decodeManualProgress(raw, currentMonth) {
  if (typeof raw !== 'string' || raw.length > 128 ||
      typeof currentMonth !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(currentMonth)) return null;
  let value;
  try { value = JSON.parse(raw); } catch { return null; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  if (Object.keys(value).sort().join() !== 'count,month,version') return null;
  if (value.version !== 1 || value.month !== currentMonth ||
      !Number.isSafeInteger(value.count) || value.count < 0 || value.count > MANUAL_MONTHLY_GOAL) return null;
  // Only our exact canonical writer format is admitted: JSON.parse alone
  // silently accepts duplicate keys and last-key-wins counter spoofing.
  return raw === encodeManualProgress(currentMonth, value.count) ? value.count : null;
}
