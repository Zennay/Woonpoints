import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertAuthorizedAccount,
  assertDryRun,
  isDryRunEnabled,
  shouldPauseForHuman
} from '../src/lib/safety.mjs';
import { runWorker } from '../src/worker/index.mjs';

test('dry-run is only enabled by explicit true', () => {
  assert.equal(isDryRunEnabled({ BOT_DRY_RUN: 'true' }), true);
  assert.equal(isDryRunEnabled({ BOT_DRY_RUN: 'TRUE' }), true);
  assert.equal(isDryRunEnabled({ BOT_DRY_RUN: 'false' }), false);
  assert.equal(isDryRunEnabled({}), false);
});

test('worker fails closed when live execution is requested', () => {
  assert.throws(() => assertDryRun({ BOT_DRY_RUN: 'false' }), /Live WoningNet execution is disabled/);
  assert.throws(() => runWorker({ BOT_DRY_RUN: 'false' }), /Live WoningNet execution is disabled/);
});

test('worker can run in dry-run mode without attempting a reaction', () => {
  const result = runWorker({ BOT_DRY_RUN: 'true' });
  assert.equal(result.mode, 'dry-run');
  assert.match(result.action, /No live WoningNet reaction/);
});

test('explicit owner authorization is required', () => {
  assert.throws(() => assertAuthorizedAccount({}), /authorization is required/);
  assert.doesNotThrow(() => assertAuthorizedAccount({ authorizationGrantedAt: new Date() }));
});

test('sensitive account states require human action', () => {
  for (const reason of ['expired_login', 'mfa', 'captcha', 'viewing_invitation', 'housing_offer']) {
    assert.equal(shouldPauseForHuman(reason), true);
  }
  assert.equal(shouldPauseForHuman('normal_listing'), false);
});
