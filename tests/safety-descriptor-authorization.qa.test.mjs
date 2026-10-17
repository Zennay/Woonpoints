import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAuthorizedAccount, isDryRunEnabled } from '../src/lib/safety.mjs';

const now = new Date('2026-10-17T12:00:00Z');
const past = new Date('2026-10-16T12:00:00Z');
const future = new Date('2026-10-18T12:00:00Z');

test('an overridden instance getTime must not fabricate owner consent', () => {
  const spoofed = new Date(future);
  spoofed.getTime = () => past.getTime();
  assert.throws(
    () => assertAuthorizedAccount({authorizationGrantedAt: spoofed}, now),
    /authorization is required/,
  );
  // A normal valid consent timestamp must still be accepted.
  assert.doesNotThrow(() => assertAuthorizedAccount({authorizationGrantedAt: past}, now));
});

test('an overridden now.getTime must not advance the eligibility clock', () => {
  const spoofedNow = new Date(past);
  spoofedNow.getTime = () => future.getTime();
  assert.throws(
    () => assertAuthorizedAccount({authorizationGrantedAt: now}, spoofedNow),
    /authorization is required/,
  );
});

test('dry-run policy requires own data descriptor, not an accessor', () => {
  let getterCalls = 0;
  const env = {};
  Object.defineProperty(env, 'BOT_DRY_RUN', {
    configurable: true,
    enumerable: true,
    get() {
      getterCalls++;
      return 'true';
    },
  });
  assert.equal(isDryRunEnabled(env), false);
  assert.equal(getterCalls, 0, 'untrusted getter must not execute');
  assert.equal(isDryRunEnabled({BOT_DRY_RUN: 'true'}), true);
  assert.equal(isDryRunEnabled(Object.assign(Object.create(null), {BOT_DRY_RUN: 'TRUE'})), true);
});

test('date-shaped proxies and malformed environment proxies fail closed with policy errors', () => {
  const disguised = new Proxy(new Date(past), {});
  assert.throws(
    () => assertAuthorizedAccount({authorizationGrantedAt: disguised}, now),
    /authorization is required/,
  );
  assert.throws(
    () => assertAuthorizedAccount({authorizationGrantedAt: past},
                                  new Proxy(new Date(now), {})),
    /authorization is required/,
  );

  const badEnv = new Proxy({}, {
    getOwnPropertyDescriptor() {
      throw new Error('cannot inspect environment');
    }
  });
  assert.equal(isDryRunEnabled(badEnv), false);
});
