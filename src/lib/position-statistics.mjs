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
