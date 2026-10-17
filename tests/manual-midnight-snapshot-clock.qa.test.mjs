import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { msUntilNextLocalMidnight } from '../src/lib/manual-month-progress.mjs';

test('month rollover uses the same captured clock for display and timer (delayed refresh)', () => {
  // A read or state refresh may span local midnight. Using a second Date
  // while scheduling delays the next refresh for an entire calendar day.
  const observed = new Date(2026, 9, 31, 23, 59, 59, 900);
  const timerSetupAfterMidnight = new Date(2026, 10, 1, 0, 0, 0, 100);
  assert.equal(msUntilNextLocalMidnight(observed), 100);
  assert.equal(msUntilNextLocalMidnight(timerSetupAfterMidnight), 86_399_900);

  const component = readFileSync(new URL('../src/app/manual-month-progress.tsx', import.meta.url), 'utf8');
  assert.match(component, /const observed = new Date\(\)/);
  assert.match(component, /const current = localMonthKey\(observed\)/);
  assert.match(component, /setTimeout\(refresh, msUntilNextLocalMidnight\(observed\) \+ 50\)/,
    'timer must share the exact sampled Date used for the visible month, not a later clock');
});

test('clock consistency preserves real 23-hour/25-hour DST-day durations', () => {
  const date = new Date(2026, 9, 17, 23, 59, 45);
  assert.equal(msUntilNextLocalMidnight(date), 15_000);
});
