import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareChildEnvironment } from '../src/lib/db-url-launcher.mjs';

// Entirely synthetic offline launch environments. These tests never start a
// database, child process, production service or WoningNet account workflow.
test('database secret accessor is rejected without ever invoking a getter', () => {
  let executions = 0;
  const env = {};
  Object.defineProperty(env, 'WOONPOINTS_DB_PASSWORD', {
    enumerable: true, get() { executions++; return 'synthetic-only-secret'; }
  });
  assert.throws(() => prepareChildEnvironment(env), /invalid database environment/i);
  assert.equal(executions, 0);
});

test('unrelated accessor cannot execute during the child environment copy', () => {
  let executions = 0;
  const env = { WOONPOINTS_DB_PASSWORD: 'synthetic-only-password' };
  Object.defineProperty(env, 'UNTRUSTED_MARKER', {
    enumerable: true, get() { executions++; throw new Error('do not evaluate'); }
  });
  assert.throws(() => prepareChildEnvironment(env), /invalid database environment/i);
  assert.equal(executions, 0);
});

test('inherited or type-confused passwords do not authorize a child launch', () => {
  const inherited = Object.create({ WOONPOINTS_DB_PASSWORD: 'synthetic-inherited' });
  assert.throws(() => prepareChildEnvironment(inherited), /invalid database environment/i);
  for (const secret of [undefined, null, false, 42, new String('synthetic'), '']) {
    assert.throws(() => prepareChildEnvironment({ WOONPOINTS_DB_PASSWORD: secret }),
      /invalid database environment|non-empty operator database password/i);
  }
  assert.throws(() => prepareChildEnvironment({
    WOONPOINTS_DB_PASSWORD: 'synthetic-safe',
    NON_STRING_ENTRY: { toString() { throw Error('private'); } },
  }), /invalid database environment/i);
});

test('an uninspectable Proxy does not crash or reach process-spawning policy', () => {
  const unsafe = new Proxy({}, { ownKeys() { throw new Error('private object state'); } });
  assert.throws(() => prepareChildEnvironment(unsafe), /invalid database environment/i);
});

test('valid own-string env produces canonical single-credential child snapshot', () => {
  const secret = 'synthetic:@/#?%[] !';
  const env = Object.assign(Object.create({ INHERITED: 'must-not-copy' }), {
    WOONPOINTS_DB_PASSWORD: secret,
    DATABASE_URL: 'postgresql://old:password@untrusted.invalid:9876/old',
    WOONPOINTS_TEST_MARKER: 'safe',
    BOT_DRY_RUN: 'true',
  });
  const child = prepareChildEnvironment(env);
  assert.equal(Object.getPrototypeOf(child), null);
  assert.equal(child.WOONPOINTS_TEST_MARKER, 'safe');
  assert.equal(child.BOT_DRY_RUN, 'true');
  assert.equal(Object.hasOwn(child, 'INHERITED'), false);
  assert.equal(Object.hasOwn(child, 'WOONPOINTS_DB_PASSWORD'), false);
  assert.equal(new URL(child.DATABASE_URL).hostname, 'db');
  assert.equal(decodeURIComponent(new URL(child.DATABASE_URL).password), secret);
});

test('an obsolete DATABASE_URL getter must be ignored, never invoked', () => {
  let calls = 0;
  const env = { WOONPOINTS_DB_PASSWORD: 'synthetic-only' };
  Object.defineProperty(env, 'DATABASE_URL', {
    enumerable: true, get() { calls++; throw Error('obsolete untrusted'); }
  });
  const child = prepareChildEnvironment(env);
  assert.equal(calls, 0);
  assert.equal(new URL(child.DATABASE_URL).hostname, 'db');
});

test('non-enumerable private caller fields stay out of the child environment', () => {
  const env = { WOONPOINTS_DB_PASSWORD: 'synthetic-only' };
  Object.defineProperty(env, 'PRIVATE_CALLER_METADATA', {
    configurable: true, enumerable: false, value: 'not-for-child',
  });
  const child = prepareChildEnvironment(env);
  assert.equal(Object.hasOwn(child, 'PRIVATE_CALLER_METADATA'), false);
});

test('non-enumerable operator secret is not accepted as launch authority', () => {
  const env = {};
  Object.defineProperty(env, 'WOONPOINTS_DB_PASSWORD', {
    enumerable: false, value: 'synthetic-hidden-secret',
  });
  assert.throws(() => prepareChildEnvironment(env), /invalid database environment/i);
});
