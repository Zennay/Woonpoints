/**
 * Pure, deterministic statistics for locally typed rank/total pairs.
 * The caller supplies UNVERIFIED notes, never official WoningNet evidence.
 * No account, database, transport or filesystem dependencies.
 */
const MAX_CHARACTERS = 4096;
const MAX_SAMPLES = 50;
const MAX_TOTAL = 999_999;
const INVALID = 'Ongeldige positiegegevens: gebruik maximaal 50 regels positie/totaal (bijvoorbeeld 12/150).';

/** Higher percentile is better: (total - rank) / (total - 1) * 100.
 * A single applicant at rank 1/1 is treated as the best (100th percentile).
 * Every listing is weighted equally; this is not the chance of allocation.
 */
export function summarizePositionPairs(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_CHARACTERS) throw new TypeError(INVALID);
  const normalized = raw.replace(/\r\n/g, '\n');
  const rows = normalized.split('\n').map(row => row.trim()).filter(Boolean);
  if (rows.length === 0) return null;
  if (rows.length > MAX_SAMPLES) throw new RangeError(INVALID);

  const positions = [];
  const percentiles = [];
  for (const row of rows) {
    const match = /^([1-9][0-9]{0,5})\/([1-9][0-9]{0,5})$/.exec(row);
    if (!match) throw new TypeError(INVALID);
    const position = Number(match[1]);
    const total = Number(match[2]);
    if (position > total || total > MAX_TOTAL) throw new RangeError(INVALID);
    positions.push(position);
    percentiles.push(total === 1 ? 100 : 100 * (total - position) / (total - 1));
  }
  positions.sort((a, b) => a - b);
  const length = positions.length;
  const center = Math.floor(length / 2);
  const medianPosition = length % 2 ? positions[center] : (positions[center - 1] + positions[center]) / 2;
  return {
    source: 'manual-unverified', sampleCount: length,
    averagePosition: positions.reduce((a, b) => a + b, 0) / length,
    medianPosition,
    averagePercentile: percentiles.reduce((a, b) => a + b, 0) / length,
    bestPosition: positions[0], worstPosition: positions[length - 1]
  };
}

/**
 * Format a manually calculated percentile without claiming exact first/last
 * place when the true fractional average is merely rounded to an endpoint.
 * 100% and 0% are reserved for mathematically exact outcomes only.
 */
export function formatPositionPercentile(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new TypeError('Ongeldig positiepercentiel');
  }
  if (value > 0 && value < 0.1) return '<0,1%';
  if (value > 99.9 && value < 100) return '>99,9%';
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(value) + '%';
}


/**
 * Local, unverified civil-date position history for Woonpoints M1.
 *
 * No WoningNet transport, credentials, DB access, URL construction or storage.
 * Only a user-entered Gregorian day and rank/total pair may reach this module.
 * Official account evidence must eventually use a separate authenticated path.
 */

const MAX_LENGTH = 8192;
const MAX_ROWS = 120;
const MAX_MONTHS = 24;
const MONTH_INVALID = 'Ongeldige handmatige maandhistorie';

function civilDate(value) {
  const match = /^(20[0-9]{2})-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/.exec(value);
  if (!match) throw new TypeError(MONTH_INVALID);
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day) throw new TypeError(MONTH_INVALID);
  return value;
}

/** Group by user-typed calendar month, not the machine/browser timezone.
 * Never guess a WoningNet reaction's eligibility from a typed end position.
 */
export function summarizeManualPositionHistory(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_LENGTH) throw new TypeError(MONTH_INVALID);
  if (raw.includes('\0')) throw new TypeError(MONTH_INVALID);
  const lines = raw.replace(/\r\n/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  if (lines.length > MAX_ROWS) throw new RangeError(MONTH_INVALID);

  const groups = new Map();
  for (const line of lines) {
    const match = /^(20[0-9]{2}-[0-9]{2}-[0-9]{2}),([1-9][0-9]{0,5})\/([1-9][0-9]{0,5})$/.exec(line);
    if (!match) throw new TypeError(MONTH_INVALID);
    const date = civilDate(match[1]);
    const pair = match[2] + '/' + match[3];
    // Reuse the canonical rank/total and percentile denominator contract.
    if (!summarizePositionPairs(pair)) throw new TypeError(MONTH_INVALID);
    const month = date.slice(0, 7);
    const members = groups.get(month) ?? [];
    members.push(pair);
    groups.set(month, members);
    if (groups.size > MAX_MONTHS) throw new RangeError(MONTH_INVALID);
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
