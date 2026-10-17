import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MANUAL_PROGRESS_STORAGE_KEY,
  msUntilNextLocalMidnight,
  manualPlanningNudge,
  clearManualProgress,
  decodeManualProgress,
  encodeManualProgress,
  localMonthKey
} from '../src/lib/manual-month-progress.mjs';

test('local planning uses browser-local civil month and a scoped noncredential storage key', () => {
  assert.equal(localMonthKey(new Date('2026-10-17T10:00:00Z')), '2026-10');
  assert.match(MANUAL_PROGRESS_STORAGE_KEY, /^woonpoints:manual-progress:v1$/);
  assert.equal(localMonthKey(new Date('2026-11-17T10:00:00Z')), '2026-11');
});

test('zero is only shown after explicit manual entry, never when missing or month changed', () => {
  assert.equal(decodeManualProgress(null, '2026-10'), null);
  assert.equal(decodeManualProgress('', '2026-10'), null);
  const entry = encodeManualProgress('2026-10', 0);
  assert.equal(decodeManualProgress(entry, '2026-10'), 0);
  assert.equal(decodeManualProgress(entry, '2026-11'), null);
});

test('all four manual increments preserve exact local serialization and report', () => {
  for (const count of [0, 1, 2, 3, 4]) {
    const raw = encodeManualProgress('2026-10', count);
    assert.deepEqual(JSON.parse(raw), { version: 1, month: '2026-10', count });
    assert.equal(decodeManualProgress(raw, '2026-10'), count);
  }
});

test('forged, numeric, invalid and oversize stored progress never becomes an official counter', () => {
  const invalid = [
    '{', 'null', '[]', 'true', '0', '""', ' '.repeat(129),
    '{"version":1,"month":"2026-10","count":-1}',
    '{"version":1,"month":"2026-10","count":5}',
    '{"version":1,"month":"2026-10","count":0.5}',
    '{"version":1,"month":"2026-10","count":"4"}',
    '{"version":true,"month":"2026-10","count":1}',
    '{"version":1,"month":"2026-10","count":1,"official":true}',
    '{"version":1,"month":"2026-10","count":1,"account":"secret"}',
    '{"version":2,"month":"2026-10","count":1}',
    '{"version":1,"month":"2026-00","count":1}',
    '{"version":1,"month":"2026-10","count":1,"count":4}'
  ];
  for (const sample of invalid) assert.equal(decodeManualProgress(sample, '2026-10'), null, sample.slice(0, 80));
  for (const n of [-1, 5, 1.5, NaN, Infinity, '2', true]) {
    assert.throws(() => encodeManualProgress('2026-10', n), TypeError);
  }
  assert.throws(() => encodeManualProgress('2026-00', 0), TypeError);
  assert.throws(() => localMonthKey(new Date(NaN)), RangeError);
});

test('manual UI marks its status as unverified and contains no WoningNet API fetch/side effects', async () => {
  const { readFile } = await import('node:fs/promises');
  const ui = await readFile(new URL('../src/app/manual-month-progress.tsx', import.meta.url), 'utf8');
  assert.match(ui, /geen geverifieerde WoningNet-stand/);
  assert.match(ui, /window\.localStorage\.setItem/);
  assert.match(ui, /unsaved\.current\?\.count \?\? stored/);
  assert.match(ui, /unsaved\.current\?\.count \?\? null/);
  assert.doesNotMatch(ui, /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bBOT_DRY_RUN\s*=/);
});


test('scheduled rollover accounts for calendar midnight and DST without carrying a stale counter', () => {
  assert.equal(msUntilNextLocalMidnight(new Date(2026, 9, 17, 23, 59, 30)), 30_000);
  assert.equal(msUntilNextLocalMidnight(new Date(2026, 10, 1, 0, 0, 0)), 86_400_000);
  assert.throws(() => msUntilNextLocalMidnight(new Date(NaN)), RangeError);
});

test('local midnight timer honours spring and autumn DST, with an isolated Europe/Amsterdam zone', async () => {
  const { spawnSync } = await import('node:child_process');
  const source = new URL('../src/lib/manual-month-progress.mjs', import.meta.url).href;
  const code = `import { msUntilNextLocalMidnight } from ${JSON.stringify(source)};
console.log(JSON.stringify([
  msUntilNextLocalMidnight(new Date(2026,2,29,0,30)),
  msUntilNextLocalMidnight(new Date(2026,9,25,0,30))
]));`;
  const child = spawnSync(process.execPath, ['--input-type=module','-e',code], {
    env: { ...process.env, TZ: 'Europe/Amsterdam' }, encoding: 'utf8', timeout: 8000
  });
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), [22.5 * 3_600_000, 24.5 * 3_600_000]);
});

test('explicit local erasure removes only this planning key and propagates denied storage', () => {
  const touched = [];
  clearManualProgress({ removeItem(key) { touched.push(key); } });
  assert.deepEqual(touched, [MANUAL_PROGRESS_STORAGE_KEY]);
  assert.throws(() => clearManualProgress({ removeItem() { throw new Error('blocked'); } }), /blocked/);
});

test('privacy UI exposes erase controls, midnight refresh and an explicit storage-denied error', async () => {
  const { readFile } = await import('node:fs/promises');
  const ui = await readFile(new URL('../src/app/manual-month-progress.tsx', import.meta.url), 'utf8');
  assert.match(ui, /Wis mijn notitie/);
  assert.match(ui, /clearManualProgress\(window\.localStorage\)/);
  assert.match(ui, /setTimeout\(refresh/);
  assert.match(ui, /clearTimeout\(timer\)/);
  assert.match(ui, /visibilitychange/);
  assert.match(ui, /Verwijderen niet gelukt/);
  assert.doesNotMatch(ui, /fetch\s*\(|XMLHttpRequest|WebSocket/);
});


test('monthly reminder is personal, only after halfway, never inferred for unknown/old/complete progress', () => {
  const at = day => new Date(2026, 9, day, 12);
  for (const count of [null, undefined, -1, 4, 5, '2', true]) {
    assert.equal(manualPlanningNudge('2026-10', count, at(20)), null);
  }
  assert.equal(manualPlanningNudge('2026-09', 0, at(26)), null);
  assert.equal(manualPlanningNudge('2026-10', 0, at(14)), null);
  assert.deepEqual(manualPlanningNudge('2026-10', 1, at(15)), { missing: 3, urgency: 'midmonth' });
  assert.deepEqual(manualPlanningNudge('2026-10', 2, at(24)), { missing: 2, urgency: 'late' });
  assert.deepEqual(manualPlanningNudge('2026-10', 3, at(31)), { missing: 1, urgency: 'late' });
});

test('end-of-month urgency respects leap February, not a guessed 30-day calendar', () => {
  const inLeap = new Date(2028, 1, 21, 12); // 8 days remain in February
  const lastWeek = new Date(2028, 1, 22, 12); // 7 days remain
  assert.deepEqual(manualPlanningNudge('2028-02', 0, inLeap), {missing:4, urgency:'midmonth'});
  assert.deepEqual(manualPlanningNudge('2028-02', 0, lastWeek), {missing:4, urgency:'late'});
});

test('onscreen reminder is explicitly manual and never claims 4 verified reactions', async () => {
  const { readFile } = await import('node:fs/promises');
  const ui = await readFile(new URL('../src/app/manual-month-progress.tsx', import.meta.url), 'utf8');
  assert.match(ui, /manualPlanningNudge/);
  assert.match(ui, /Eigen planning/);
  assert.match(ui, /officiële WoningNet-stand is onbekend/);
  assert.doesNotMatch(ui, /automatisch gereageerd|WoningNet-reacties bevestigd/);
});
