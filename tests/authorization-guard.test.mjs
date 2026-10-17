import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAuthorizedAccount, assertDryRun } from '../src/lib/safety.mjs';

const granted = new Date('2026-01-01T00:00:00.000Z');
const now = new Date('2026-10-17T12:00:00.000Z');
const forbidden = [
  ['truthy string', 'approved'],
  ['truthy number', 1234],
  ['boolean flag', true],
  ['truthy object', {}],
  ['invalid Date', new Date(NaN)],
  ['future date', new Date('2026-10-18T12:00:00.000Z')],
  ['future far outside current epoch', new Date('9999-01-01T00:00:00Z')],
  ['missing date', undefined],
  ['null date', null]
];

test('owner consent must be a real, finite, nonfuture Prisma DateTime', () => {
  for (const [label, value] of forbidden) {
    assert.throws(
      () => assertAuthorizedAccount({authorizationGrantedAt: value}, now),
      /authorization/i,
      label + ' must never grant worker eligibility'
    );
  }
  assert.doesNotThrow(
    () => assertAuthorizedAccount({authorizationGrantedAt: granted, pausedReason: null}, now),
    'existing valid DateTime consent must remain valid'
  );
  assert.doesNotThrow(
    () => assertAuthorizedAccount({authorizationGrantedAt: now, pausedReason: null}, now),
    'a consent exactly at the evaluation instant must be accepted'
  );
});

test('paused or unknown account states block eligibility even with valid consent', () => {
  const paused = ['mfa', 'captcha', 'expired_login', 'viewing_invitation',
    'housing_offer', 'unexpected_new_state', '', 0, false, {}];
  for (const pausedReason of paused) {
    assert.throws(
      () => assertAuthorizedAccount({authorizationGrantedAt: granted,pausedReason}, now),
      /paus|human|authorization/i,
      'pausedReason '+String(pausedReason)+' must be fail-closed'
    );
  }
  assert.doesNotThrow(
    () => assertAuthorizedAccount({authorizationGrantedAt: granted, pausedReason: null}, now)
  );
  assert.throws(
    () => assertAuthorizedAccount({authorizationGrantedAt: granted, pausedReason: undefined}, now),
    /paus|human/i,
  );
});

test('authorization validation never relaxes the mandatory current dry-run gate', () => {
  assert.throws(()=>assertDryRun({BOT_DRY_RUN:'false'}),/Live WoningNet execution is disabled/);
  assert.doesNotThrow(()=>assertDryRun({BOT_DRY_RUN:'true'}));
});
