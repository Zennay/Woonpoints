import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const launcher = fileURLToPath(new URL('../src/lib/db-url-launcher.mjs', import.meta.url));

function executeChild(code, envOverrides) {
  return spawnSync(process.execPath, [launcher, process.execPath, '-e', code], {
    encoding: 'utf8', timeout: 8000,
    env: { ...process.env, ...envOverrides },
  });
}

test('database launcher removes redundant raw operator credential from app/worker child', () => {
  const secret = 'synthetic-db:@/#%[] ?';
  const verify = [
    'const u = new URL(process.env.DATABASE_URL);',
    'if (u.hostname !== "db" || u.pathname !== "/woonpoints") process.exit(21);',
    'if (decodeURIComponent(u.password) !== ' + JSON.stringify(secret) + ') process.exit(22);',
    'if (Object.hasOwn(process.env, "WOONPOINTS_DB_PASSWORD")) process.exit(23);',
    'if (process.env.WOONPOINTS_TEST_MARKER !== "preserved") process.exit(24);',
  ].join(' ');
  const run = executeChild(verify, {
    WOONPOINTS_DB_PASSWORD: secret,
    DATABASE_URL: 'postgresql://wrong:fake@evil.invalid:9999/stale',
    WOONPOINTS_TEST_MARKER: 'preserved',
  });
  assert.equal(run.status, 0, 'child may receive only recomputed URL, not source password: ' + run.status);
  assert.equal(run.stdout, '');
  assert.equal(run.stderr, '');
});

test('child still returns a nonzero application failure without printing source credential', () => {
  const secret = 'synthetic-only-value-3122';
  const run = executeChild('process.exit(17)', {
    WOONPOINTS_DB_PASSWORD: secret,
    DATABASE_URL: 'synthetic-stale-uri-3122',
  });
  assert.equal(run.status, 17);
  assert.equal(run.stdout, '');
  assert.doesNotMatch(run.stderr, /synthetic-only-value-3122|synthetic-stale-uri-3122/);
});

test('missing operator secret still refuses launch rather than trusting inherited URL', () => {
  const run = executeChild('process.exit(0)', {
    WOONPOINTS_DB_PASSWORD: '',
    DATABASE_URL: 'postgresql://fake:password@evil.invalid/stale',
  });
  assert.equal(run.status, 2);
  assert.equal(run.stdout, '');
  assert.doesNotMatch(run.stderr, /postgresql:\/\//);
});
