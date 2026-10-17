import test from 'node:test';
import assert from 'node:assert/strict';
import { HUMAN_ACTION_REASONS, shouldPauseForHuman, assertDryRun } from '../src/lib/safety.mjs';

// Future WoningNet status strings may differ from the current five known
// challenges. An unrecognized condition is not permission to continue.
test('known human challenges always request manual intervention', () => {
  assert.deepEqual([...HUMAN_ACTION_REASONS], [
    'expired_login', 'mfa', 'captcha', 'viewing_invitation', 'housing_offer',
  ]);
  for (const reason of HUMAN_ACTION_REASONS) {
    assert.equal(shouldPauseForHuman(reason), true, reason);
  }
});

test('normal listing is the ONLY reviewed non-pausing status', () => {
  assert.equal(shouldPauseForHuman('normal_listing'), false);
  for (const unknown of [
    'new_provider_challenge', 'login_warning', 'mfa_required',
    'captcha_pending', 'normal_listing ', ' normal_listing',
    'NORMAL_LISTING', 'normal\u200blisting', '', null, undefined,
    false, true, 0, 1, [], ['normal_listing'], {},
  ]) {
    assert.equal(shouldPauseForHuman(unknown), true,
      'unreviewed status must request manual intervention');
  }
});

test('human-stop classification never coerces hostile objects or evaluates accessors', () => {
  let invoked = 0;
  const trap = {
    get [Symbol.toStringTag]() { invoked++; throw Error('should not inspect'); },
    toString() { invoked++; throw Error('should not coerce'); },
    valueOf() { invoked++; throw Error('should not coerce'); },
  };
  assert.equal(shouldPauseForHuman(trap), true);
  assert.equal(invoked, 0);
});

test('unrecognized human states never relax the existing dry-run-only gate', () => {
  assert.equal(shouldPauseForHuman('unexpected_identity_verification'), true);
  assert.throws(() => assertDryRun({ BOT_DRY_RUN: 'false' }),
    /Live WoningNet execution is disabled/);
  assert.doesNotThrow(() => assertDryRun({ BOT_DRY_RUN: 'true' }));
});
