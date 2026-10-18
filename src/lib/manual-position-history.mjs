/**
 * Local, unverified civil-date position history for Woonpoints M1.
 *
 * No WoningNet transport, credentials, DB access, URL construction or storage.
 * Only a user-entered Gregorian day and rank/total pair may reach this module.
 * Official account evidence must eventually use a separate authenticated path.
 */
import { summarizePositionPairs } from './position-statistics.mjs';

const MAX_LENGTH = 8192;
const MAX_ROWS = 120;
const MAX_MONTHS = 24;
const INVALID = 'Ongeldige handmatige maandhistorie';

function civilDate(value) {
  const match = /^(20[0-9]{2})-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/.exec(value);
  if (!match) throw new TypeError(INVALID);
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day) throw new TypeError(INVALID);
  return value;
}

/** Group by user-typed calendar month, not the machine/browser timezone.
 * Never guess a WoningNet reaction's eligibility from a typed end position.
 */
export function summarizeManualPositionHistory(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_LENGTH) throw new TypeError(INVALID);
  if (raw.includes('\0')) throw new TypeError(INVALID);
  const lines = raw.replace(/\r\n/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length > MAX_ROWS) throw new RangeError(INVALID);

  const groups = new Map();
  for (const line of lines) {
    const match = /^(20[0-9]{2}-[0-9]{2}-[0-9]{2}),([1-9][0-9]{0,5})\/([1-9][0-9]{0,5})$/.exec(line);
    if (!match) throw new TypeError(INVALID);
    const date = civilDate(match[1]);
    const pair = match[2] + '/' + match[3];
    // Reuse the canonical rank/total and percentile denominator contract.
    if (!summarizePositionPairs(pair)) throw new TypeError(INVALID);
    const month = date.slice(0, 7);
    const members = groups.get(month) ?? [];
    members.push(pair);
    groups.set(month, members);
    if (groups.size > MAX_MONTHS) throw new RangeError(INVALID);
  }
  const months = [...groups].sort(([a], [b]) => a.localeCompare(b))
    .map(([month, pairs]) => {
      return { month, pairs };
    });

  const result = months.map(({ month, pairs }) => {
    // Support up to 120 manually entered results in a single month without
    // weakening the single-batch 50-entry safety cap of position-statistics.
    const partitions = [];
    for (let i = 0; i < pairs.length; i += 50) {
      partitions.push(summarizePositionPairs(pairs.slice(i, i + 50).join('\n')));
    }
    const count = pairs.length;
    const weightedPercentile = partitions.reduce(
      (sum, group) => sum + group.averagePercentile * group.sampleCount, 0) / count;
    const weightedPosition = partitions.reduce(
      (sum, group) => sum + group.averagePosition * group.sampleCount, 0) / count;
    const sorted = pairs.map(pair => Number(pair.split('/')[0])).sort((a, b) => a - b);
    const middle = Math.floor(count / 2);
    const median = count % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    return { month, sampleCount: count, averagePosition: weightedPosition,
      medianPosition: median, averagePercentile: weightedPercentile };
  });
  return {
    source: 'manual-unverified',
    sampleCount: lines.length,
    months: result,
    lastObservedMonth: result[result.length - 1].month,
    // Difference in observational percentile points, NOT a trend/prediction
    // of eligibility, waiting points or selection probability.
    changePercentilePoints: result.length < 2 ? null :
      result[result.length - 1].averagePercentile - result[result.length - 2].averagePercentile
  };
}
