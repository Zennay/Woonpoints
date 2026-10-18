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
    ranked.push({index, home, ...scoreManualHome(home, preferences)});
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
