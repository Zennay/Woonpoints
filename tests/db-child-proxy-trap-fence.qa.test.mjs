import test from 'node:test';
import assert from 'node:assert/strict';
import { types as utilTypes } from 'node:util';
import { prepareChildEnvironment } from '../src/lib/db-url-launcher.mjs';

test('nonthrowing Proxy environment is refused without executing any trap', () => {
  let calls = 0;
  const raw = {
    WOONPOINTS_DB_PASSWORD: 'fictional-private-only',
    BOT_DRY_RUN: 'true',
    DEBUG_MARKER: 'fixture'
  };
  const wrapped = new Proxy(raw, {
    ownKeys(target) { calls++; return Reflect.ownKeys(target); },
    getOwnPropertyDescriptor(target, key) {
      calls++;
      return Reflect.getOwnPropertyDescriptor(target, key);
    }
  });
  assert.equal(utilTypes.isProxy(wrapped), true);
  assert.throws(() => prepareChildEnvironment(wrapped), /Invalid database environment/);
  assert.equal(calls, 0, 'no caller-controlled ownKeys/descriptor traps may be executed');
});

test('revoked Proxy cannot enter descriptor discovery or expose raw exceptions', () => {
  let calls = 0;
  const revoked = Proxy.revocable({ WOONPOINTS_DB_PASSWORD: 'synthetic' }, {
    ownKeys() { calls++; return ['WOONPOINTS_DB_PASSWORD']; }
  });
  revoked.revoke();
  assert.equal(utilTypes.isProxy(revoked.proxy), true);
  assert.throws(() => prepareChildEnvironment(revoked.proxy), /Invalid database environment/);
  assert.equal(calls, 0);
});

test('plain own-data string environment remains admitted without exposing duplicate secret', () => {
  const child = prepareChildEnvironment({
    WOONPOINTS_DB_PASSWORD: 'synthetic:%?+#',
    BOT_DRY_RUN: 'true',
    EXAMPLE_SAFE: 'fixture'
  });
  assert.equal(Object.getPrototypeOf(child), null);
  assert.equal(child.EXAMPLE_SAFE, 'fixture');
  assert.equal(child.BOT_DRY_RUN, 'true');
  assert.equal(Object.hasOwn(child, 'WOONPOINTS_DB_PASSWORD'), false);
  assert.equal(decodeURIComponent(new URL(child.DATABASE_URL).password), 'synthetic:%?+#');
});
