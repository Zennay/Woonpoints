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

/** A different tab may replace or erase a note. Unrelated/session storage does not. */
export function relevantManualStorageEvent(event, localStorageArea) {
  return event != null && event.storageArea === localStorageArea &&
    (event.key === MANUAL_PROGRESS_STORAGE_KEY || event.key === null);
}

export function clearManualProgress(storage) {
  storage.removeItem(MANUAL_PROGRESS_STORAGE_KEY);
}

/**
 * A previous-month or malformed note occupies the same private storage key.
 * Do not convert its "unknown" presentation into permission to overwrite it.
 * The UI must request an explicit erase of that exact observed snapshot.
 */
export function manualProgressNeedsExplicitErase(raw, currentMonth) {
  return raw !== null && decodeManualProgress(raw, currentMonth) === null;
}

/** Best-effort stale-tab guard, NOT an atomic browser-wide transaction. */
export function writeManualProgressIfUnchanged(storage, expectedRaw, month, count) {
  // Invalid count must fail before reading/writing browser state.
  const next = encodeManualProgress(month, count);
  if (expectedRaw !== null && typeof expectedRaw !== 'string') return { status: 'unknown' };
  const actual = storage.getItem(MANUAL_PROGRESS_STORAGE_KEY);
  if (actual !== expectedRaw) return { status: 'changed', raw: actual };
  if (manualProgressNeedsExplicitErase(actual, month)) {
    return { status: 'requires_erase', raw: actual };
  }
  storage.setItem(MANUAL_PROGRESS_STORAGE_KEY, next);
  return { status: 'saved', raw: next };
}

/** Do not erase a newer tab's private note using a stale on-screen count. */
export function eraseManualProgressIfUnchanged(storage, expectedRaw) {
  if (expectedRaw !== null && typeof expectedRaw !== 'string') return { status: 'unknown' };
  const actual = storage.getItem(MANUAL_PROGRESS_STORAGE_KEY);
  if (actual !== expectedRaw) return { status: 'changed', raw: actual };
  clearManualProgress(storage);
  return { status: 'cleared', raw: null };
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

/**
 * Privacy-accurate UI message for an unverified browser write capability.
 * A successful getItem may expose a *previously saved* note even after a
 * failed setItem/removeItem. Never claim all data exists only in memory.
 * This function never touches storage, accounts, or a network.
 */
export function manualStorageWarning(storageWorks, hasUnsaved) {
  if (typeof storageWorks !== 'boolean' || typeof hasUnsaved !== 'boolean') {
    throw new TypeError('Invalid private storage state');
  }
  if (storageWorks) return null;
  if (hasUnsaved) {
    return 'Opslaan is niet bevestigd. Deze wijziging is tijdelijk en niet opgeslagen; eerder opgeslagen notities kunnen nog in deze browser aanwezig zijn.';
  }
  return 'Schrijven of wissen in browseropslag is niet bevestigd. Eerder opgeslagen notities kunnen nog in deze browser aanwezig zijn.';
}
