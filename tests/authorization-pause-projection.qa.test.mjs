import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAuthorizedAccount } from '../src/lib/safety.mjs';

const now = new Date('2026-10-17T12:00:00.000Z');
const consent = new Date('2026-10-16T12:00:00.000Z');

test('a complete Prisma account with explicit null pause is eligible in dry-run policy', () => {
  assert.doesNotThrow(() => assertAuthorizedAccount({
    authorizationGrantedAt: consent,
    pausedReason: null,
  }, now));
});

test('an incomplete account projection cannot imply a missing human stop is clear', () => {
  for (const row of [
    { authorizationGrantedAt: consent },
    { authorizationGrantedAt: consent, pausedReason: undefined },
    { authorizationGrantedAt: consent, pausedReason: '' },
    Object.assign(Object.create(null), { authorizationGrantedAt: consent }),
  ]) {
    assert.throws(() => assertAuthorizedAccount(row, now), /paused|human review/i);
  }
});

test('inherited or accessor-backed pause is not canonical Prisma data and getters never run', () => {
  const inherited = Object.assign(Object.create({ pausedReason: null }), {
    authorizationGrantedAt: consent,
  });
  assert.throws(() => assertAuthorizedAccount(inherited, now), /paused|human review/i);

  let called = 0;
  const accessor = { authorizationGrantedAt: consent };
  Object.defineProperty(accessor, 'pausedReason', {
    get() { called++; return null; },
  });
  assert.throws(() => assertAuthorizedAccount(accessor, now), /paused|human review/i);
  assert.equal(called, 0);
});

test('a real human stop continues to override valid consent', () => {
  assert.throws(() => assertAuthorizedAccount({
    authorizationGrantedAt: consent,
    pausedReason: 'mfa',
  }, now), /paused|human review/i);
});
