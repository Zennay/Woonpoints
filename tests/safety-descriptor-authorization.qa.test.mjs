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

test('account consent cannot be inherited or supplied by an accessor', () => {
  const inheritedAccount = Object.create({ authorizationGrantedAt: past });
  assert.throws(
    () => assertAuthorizedAccount(inheritedAccount, now),
    /authorization is required/,
    'prototype properties are not account-specific permission evidence',
  );

  let getterCalls = 0;
  const accessored = {};
  Object.defineProperty(accessored, 'authorizationGrantedAt', {
    enumerable: true,
    get() {
      getterCalls++;
      return past;
    },
  });
  assert.throws(
    () => assertAuthorizedAccount(accessored, now),
    /authorization is required/,
    'computed properties must not manufacture a permission receipt',
  );
  assert.equal(getterCalls, 0, 'no untrusted getter should execute to fetch consent');
  assert.doesNotThrow(
    () => assertAuthorizedAccount({authorizationGrantedAt: past}, now),
  );
});

test('computed or inherited human-stop fields cannot impersonate a clear account', () => {
  let getterCalls = 0;
  const deceptive = {authorizationGrantedAt: past};
  Object.defineProperty(deceptive, 'pausedReason', {
    enumerable: true,
    get() {
      getterCalls++;
      return null;  // A computed 'not paused' is not stored account state.
    },
  });
  assert.throws(
    () => assertAuthorizedAccount(deceptive, now),
    /paused|human review/,
  );
  assert.equal(getterCalls, 0);

  const inheritedClear = Object.assign(
    Object.create({pausedReason: null}),
    {authorizationGrantedAt: past},
  );
  assert.throws(
    () => assertAuthorizedAccount(inheritedClear, now),
    /paused|human review/,
  );
  assert.doesNotThrow(
    () => assertAuthorizedAccount({authorizationGrantedAt: past, pausedReason: null}, now),
  );
  assert.throws(
    () => assertAuthorizedAccount({authorizationGrantedAt: past, pausedReason: 'mfa'}, now),
    /paused|human review/,
  );
});
