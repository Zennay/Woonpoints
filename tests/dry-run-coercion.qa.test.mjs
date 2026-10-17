import test from 'node:test';
import assert from 'node:assert/strict';
import { assertDryRun, isDryRunEnabled } from '../src/lib/safety.mjs';
import { runWorker } from '../src/worker/index.mjs';

test('only an actual string env true allows the fail-closed dry-run baseline', () => {
  for (const accepted of ['true', 'TRUE', 'TrUe']) {
    assert.equal(isDryRunEnabled({BOT_DRY_RUN: accepted}), true);
    assert.doesNotThrow(() => assertDryRun({BOT_DRY_RUN: accepted}));
  }
  const impostors = [
    ['true'],
    ['TRUE'],
    new String('true'),
    {toString: () => 'true'},
    {toString: () => 'TRUE'},
    {valueOf: () => 'true', toString: () => 'true'},
    true, 1, 0, null, undefined, {}, [], ' false ', '1',
  ];
  for (const supplied of impostors) {
    assert.equal(isDryRunEnabled({BOT_DRY_RUN: supplied}), false,
      'untrusted nonstring environment marker must not enable worker');
    assert.throws(() => assertDryRun({BOT_DRY_RUN: supplied}),
      /Live WoningNet execution is disabled/);
  }
});

test('worker does not log a fake dry-run-ready event for coercible objects', () => {
  const hostile = {toString: () => 'true'};
  assert.throws(() => runWorker({BOT_DRY_RUN: hostile}),
    /Live WoningNet execution is disabled/);
});
