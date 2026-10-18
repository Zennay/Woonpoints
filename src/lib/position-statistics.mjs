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


/**
 * Opt-in, private monthly-history portability. A fixed-column CSV contains
 * *only* validated civil dates and positive integer rank/total values.
 * Arbitrary quotes, formula cells, column injection, addresses and account
 * identifiers are never admitted or interpreted as a private history.
 */
const PRIVATE_HISTORY_CSV_HEADER = 'Datum;Eindpositie;Totaal';
const MAX_PRIVATE_CSV_CHARACTERS = 16_384;

export function exportManualPositionHistoryCsv(raw) {
  if (!summarizeManualPositionHistory(raw)) throw new TypeError(MONTH_INVALID);
  const lines = raw.replace(/\r\n/g, '\n').split('\n').map(s => s.trim()).filter(Boolean);
  const data = lines.map(line => {
    const match = /^(20[0-9]{2}-[0-9]{2}-[0-9]{2}),([1-9][0-9]{0,5})\/([1-9][0-9]{0,5})$/.exec(line);
    if (!match) throw new TypeError(MONTH_INVALID);
    return match[1] + ';' + match[2] + ';' + match[3];
  });
  const csv = [PRIVATE_HISTORY_CSV_HEADER, ...data].join('\r\n') + '\r\n';
  if (csv.length > MAX_PRIVATE_CSV_CHARACTERS) throw new RangeError(MONTH_INVALID);
  return csv;
}

export function importManualPositionHistoryCsv(csv) {
  if (typeof csv !== 'string' || csv.length > MAX_PRIVATE_CSV_CHARACTERS) {
    throw new TypeError(MONTH_INVALID);
  }
  const stripped = csv.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const lines = stripped.split('\n').map(s => s.trim());
  if (lines.at(-1) === '') lines.pop();
  if (lines[0] !== PRIVATE_HISTORY_CSV_HEADER ||
      lines.length < 2 || lines.length > 121 || lines.some(s => s === '')) {
    throw new TypeError(MONTH_INVALID);
  }
  const rows = lines.slice(1).map(line => {
    const match = /^(20[0-9]{2}-[0-9]{2}-[0-9]{2});([1-9][0-9]{0,5});([1-9][0-9]{0,5})$/.exec(line);
    if (!match) throw new TypeError(MONTH_INVALID);
    return match[1] + ',' + match[2] + '/' + match[3];
  });
  const restored = rows.join('\n');
  if (!summarizeManualPositionHistory(restored)) throw new TypeError(MONTH_INVALID);
  return restored;
}


/**
 * Private user-entered reaction journal (M1): an unsourced personal notebook,
 * NEVER official WoningNet registrations or qualifying point evidence.
 * Bounded structured records only: no addresses, passwords or source URLs.
 */
const REACTION_STATES = Object.freeze([
  'planned', 'reacted', 'closed', 'invited', 'withdrawn'
]);
const REACTION_HEADER = 'Datum;Eigen status;Eindpositie;Totaal';
const REACTION_MAX = 100;
const REACTION_INVALID = 'Ongeldige handmatige reactienotities';

function validateReactionEntry(entry) {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new TypeError(REACTION_INVALID);
  }
  const date = civilDate(entry.date);
  const status = entry.status;
  if (!REACTION_STATES.includes(status)) throw new TypeError(REACTION_INVALID);
  let rank = null, total = null;
  if (entry.rank !== null && entry.rank !== undefined && entry.rank !== '') {
    if (typeof entry.rank !== 'number' || !Number.isSafeInteger(entry.rank)) {
      throw new TypeError(REACTION_INVALID);
    }
    rank = entry.rank;
  }
  if (entry.total !== null && entry.total !== undefined && entry.total !== '') {
    if (typeof entry.total !== 'number' || !Number.isSafeInteger(entry.total)) {
      throw new TypeError(REACTION_INVALID);
    }
    total = entry.total;
  }
  if ((rank === null) !== (total === null)) throw new TypeError(REACTION_INVALID);
  if (rank !== null) summarizePositionPairs(rank + '/' + total);
  return { date, status, rank, total };
}

function canonicalJournal(entries) {
  if (!Array.isArray(entries) || entries.length > REACTION_MAX) {
    throw new RangeError(REACTION_INVALID);
  }
  return entries.map(validateReactionEntry);
}

export function summarizeManualReactionJournal(entries) {
  const safe = canonicalJournal(entries);
  const groups = new Map();
  for (const entry of safe) {
    const month = entry.date.slice(0, 7);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(entry);
  }
  const months = [...groups].sort(([a], [b]) => a.localeCompare(b)).map(([month, items]) => {
    const counts = Object.fromEntries(REACTION_STATES.map(state => [
      state, items.filter(x => x.status === state).length
    ]));
    const completed = items.filter(x => x.rank !== null);
    const ranks = completed.map(x => x.rank + '/' + x.total);
    const analyses = [];
    for (let i = 0; i < ranks.length; i += 50) {
      analyses.push(summarizePositionPairs(ranks.slice(i, i + 50).join('\n')));
    }
    const averagePercentile = analyses.length
      ? analyses.reduce((sum, part) => sum + part.averagePercentile * part.sampleCount, 0) /
        completed.length
      : null;
    return { month, total: items.length, counts, recordedPositions: completed.length,
      averagePercentile, source: 'manual-unverified' };
  });
  return { source: 'manual-unverified', total: safe.length, months,
    recordedPositions: safe.filter(x => x.rank !== null).length };
}

/** Fixed four-column, formula-inert CSV; imports never trust external labels. */
export function exportManualReactionJournalCsv(entries) {
  const safe = canonicalJournal(entries);
  if (!safe.length) throw new TypeError(REACTION_INVALID);
  return [REACTION_HEADER, ...safe.map(x =>
    [x.date, x.status, x.rank ?? '', x.total ?? ''].join(';'))].join('\r\n') + '\r\n';
}

export function importManualReactionJournalCsv(csv) {
  if (typeof csv !== 'string' || csv.length > 12_000) throw new TypeError(REACTION_INVALID);
  const lines = csv.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');
  if (lines.at(-1) === '') lines.pop();
  if (lines.shift() !== REACTION_HEADER || lines.length < 1 || lines.length > REACTION_MAX) {
    throw new TypeError(REACTION_INVALID);
  }
  const entries = lines.map(line => {
    const fields = line.split(';');
    if (fields.length !== 4 || !/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(fields[0]) ||
        !REACTION_STATES.includes(fields[1]) ||
        (fields[2] && !/^[1-9][0-9]{0,5}$/.test(fields[2])) ||
        (fields[3] && !/^[1-9][0-9]{0,5}$/.test(fields[3]))) {
      throw new TypeError(REACTION_INVALID);
    }
    return { date: fields[0], status: fields[1],
      rank: fields[2] ? Number(fields[2]) : null,
      total: fields[3] ? Number(fields[3]) : null };
  });
  return canonicalJournal(entries);
}


// Human-entered, RAM-only M2 shortlist; same reviewed Docker source dependency.
/**
 * Offline-only manual housing shortlist. No account, portal, address, ranking
 * data or scores ever leave caller RAM unless user explicitly downloads JSON.
 */
export const MAX_MANUAL_HOMES = 12;
const keys = (value, expected) => value !== null && typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value).sort().join('|') === expected.slice().sort().join('|');
const int = (n, min, max) => Number.isSafeInteger(n) && n >= min && n <= max;
const text = (s) => typeof s === 'string' && s.length >= 1 && s.length <= 64 &&
  s === s.trim() && !/[\u0000-\u001f\u007f-\u009f]/u.test(s);
const PREF_KEYS = ['maxRent', 'minRooms', 'maxTravel', 'preferBalcony'];
const HOME_KEYS = ['label', 'rent', 'rooms', 'travel', 'balcony'];

export function normalizeHousingPreferences(value) {
  if (!keys(value, PREF_KEYS) ||
      !int(value.maxRent, 100, 10000) || !int(value.minRooms, 1, 20) ||
      !int(value.maxTravel, 1, 300) || typeof value.preferBalcony !== 'boolean') return null;
  return {maxRent: value.maxRent, minRooms: value.minRooms,
    maxTravel: value.maxTravel, preferBalcony: value.preferBalcony};
}
export function normalizeManualHome(value) {
  if (!keys(value, HOME_KEYS) || !text(value.label) ||
      !int(value.rent, 100, 10000) || !int(value.rooms, 1, 20) ||
      !int(value.travel, 0, 300) || typeof value.balcony !== 'boolean') return null;
  return {label: value.label, rent: value.rent,
    rooms: value.rooms, travel: value.travel, balcony: value.balcony};
}

/** Suitability applies strict hard constraints; points are ONLY a local sorting aid. */
export function scoreManualHome(home, preferences) {
  const p = normalizeHousingPreferences(preferences);
  const h = normalizeManualHome(home);
  if (!h || !p) return null;
  const reasons = [];
  if (h.rent > p.maxRent) reasons.push('Huur boven jouw maximum');
  if (h.rooms < p.minRooms) reasons.push('Minder kamers dan jouw minimum');
  if (h.travel > p.maxTravel) reasons.push('Reistijd boven jouw maximum');
  if (reasons.length) return {suitable: false, score: null, reasons};
  const rentPoints = Math.round(40 * (p.maxRent - h.rent) / p.maxRent);
  const travelPoints = Math.round(35 * (p.maxTravel - h.travel) / p.maxTravel);
  const roomsPoints = Math.min(15, (h.rooms - p.minRooms) * 5);
  const balconyPoints = p.preferBalcony && h.balcony ? 10 : 0;
  return {
    suitable: true, score: rentPoints + travelPoints + roomsPoints + balconyPoints,
    reasons: [
      `Binnen jouw huurgrens: +${rentPoints} punten`,
      `Binnen jouw reistijdgrens: +${travelPoints} punten`,
      `Extra kamers: +${roomsPoints} punten`,
      p.preferBalcony ?
        (h.balcony ? 'Balkonwens ingevuld: +10 punten' : 'Balkonwens niet ingevuld: +0 punten') :
        'Geen balkonvoorkeur ingesteld: +0 punten'
    ]
  };
}
export function rankManualHomes(homes, preferences) {
  if (!Array.isArray(homes) || homes.length > MAX_MANUAL_HOMES ||
      !normalizeHousingPreferences(preferences)) return null;
  const ranked = [];
  for (let index = 0; index < homes.length; index++) {
    const home = normalizeManualHome(homes[index]);
    if (!home) return null;
    const scoring = scoreManualHome(home, preferences);
    // Normalized source rows should always admit a scoring result; explicitly
    // deny an unknown result rather than handing optional fields to the UI.
    if (!scoring) return null;
    ranked.push({index, home, ...scoring});
  }
  return ranked.sort((a, b) => Number(b.suitable) - Number(a.suitable) ||
    (b.score ?? 0) - (a.score ?? 0) || a.index - b.index);
}

/** Explicit portable document; import never commits user state by itself. */
export function encodeHousingShortlist(preferences, homes) {
  const ranked = rankManualHomes(homes, preferences);
  if (!ranked || !homes.length) return null;
  const document = {format: 'woonpoints-private-shortlist-v1',
    preferences: normalizeHousingPreferences(preferences),
    homes: ranked.sort((a, b) => a.index - b.index).map(x => x.home)};
  const payload = JSON.stringify(document, null, 2) + '\n';
  return new TextEncoder().encode(payload).length <= 16384 ? payload : null;
}
export function decodeHousingShortlist(input) {
  if (typeof input !== 'string' || !input || new TextEncoder().encode(input).length > 16384) return null;
  let document;
  try { document = JSON.parse(input); } catch { return null; }
  if (!keys(document, ['format', 'preferences', 'homes']) ||
      document.format !== 'woonpoints-private-shortlist-v1') return null;
  const preferences = normalizeHousingPreferences(document.preferences);
  if (!preferences || !Array.isArray(document.homes) || document.homes.length < 1 ||
      document.homes.length > MAX_MANUAL_HOMES) return null;
  const homes = document.homes.map(normalizeManualHome);
  if (homes.some(x => !x)) return null;
  return {preferences, homes};
}


/**
 * Two user-selected homes, never fetched from a property platform.
 * Differences are descriptive arithmetic only and never predict allocation.
 */
export function compareTwoManualHomes(homes, preferences, selected) {
  if (!Array.isArray(selected) || selected.length !== 2 ||
      !selected.every(index => int(index, 0, MAX_MANUAL_HOMES - 1)) ||
      selected[0] === selected[1]) return null;
  const ranked = rankManualHomes(homes, preferences);
  if (!ranked) return null;
  const choices = selected.map(index => ranked.find(row => row.index === index));
  if (choices.some(x => !x)) return null;
  const [a, b] = choices;
  const aHome = a.home, bHome = b.home;
  const lowest = (key) => aHome[key] === bHome[key] ? null :
    (aHome[key] < bHome[key] ? aHome.label : bHome.label);
  const highest = (key) => aHome[key] === bHome[key] ? null :
    (aHome[key] > bHome[key] ? aHome.label : bHome.label);
  return {
    choices, lowerRent: lowest('rent'), shorterTravel: lowest('travel'),
    moreRooms: highest('rooms'),
    monthlyRentGap: Math.abs(aHome.rent - bHome.rent),
    twelveMonthRentGap: Math.abs(aHome.rent - bHome.rent) * 12,
    minutesGap: Math.abs(aHome.travel - bHome.travel),
    roomsGap: Math.abs(aHome.rooms - bHome.rooms)
  };
}

/** Optional human-triggered plain-text note; never an official housing report. */
export function exportManualHousingDecisionNote(homes, preferences, selected) {
  const comparison = compareTwoManualHomes(homes, preferences, selected);
  if (!comparison) return null;
  const [a, b] = comparison.choices;
  const lines = [
    'Woonpoints — mijn eigen woningafweging (handmatige, ongeverifieerde notities)',
    '',
    'Geen accountgegevens, echte woningbeschikbaarheid, toewijzing of woningkans.',
    ...[a, b].flatMap(row => [
      '',
      row.home.label,
      `Eigen invoer: EUR ${row.home.rent}/maand, ${row.home.rooms} kamers, ${row.home.travel} minuten reistijd, ${row.home.balcony ? 'balkon' : 'geen balkon'}`,
      row.suitable ? `Past bij eigen grenzen: ja, eigen score ${row.score}` : 'Past bij eigen grenzen: nee',
      ...row.reasons
    ]),
    '',
    `Verschil maandhuur: EUR ${comparison.monthlyRentGap}`,
    `Verschil in 12 maal dezelfde maandhuur: EUR ${comparison.twelveMonthRentGap}`,
    `Verschil reistijd per enkele reis: ${comparison.minutesGap} minuten`,
    `Verschil kamers: ${comparison.roomsGap}`,
    '',
    'Huurschommelingen, energie, servicekosten, reistijdvariatie en toewijzingsregels zijn niet meegenomen.',
    'Deze tekst is uitsluitend op mijn verzoek vanuit dit browsertabblad geëxporteerd.'
  ];
  const payload = lines.join('\n') + '\n';
  return new TextEncoder().encode(payload).length <= 4096 ? payload : null;
}
