import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { composeDatabaseUrl } from '../src/lib/db-url-launcher.mjs';

const launcher = fileURLToPath(new URL('../src/lib/db-url-launcher.mjs', import.meta.url));
const compose = readFileSync(new URL('../docker-compose.yml', import.meta.url), 'utf8');

for (const secret of ['simple-local-secret', 'synthetic:@/#?%[] :']) {
  test('correctly and privately encodes credentials from one operator secret: '+secret.length, () => {
    const url = new URL(composeDatabaseUrl(secret));
    assert.equal(url.protocol, 'postgresql:');
    assert.equal(url.hostname, 'db');
    assert.equal(url.pathname, '/woonpoints');
    assert.equal(url.searchParams.get('schema'), 'public');
    assert.equal(decodeURIComponent(url.password), secret);
    assert.equal(url.username, 'woonpoints');
  });
}

test('fail closed on absent, empty, or invalid operator password', () => {
  for (const bad of [undefined, null, '', 42, { password: 'synthetic' }, 'null\0byte']) {
    assert.throws(() => composeDatabaseUrl(bad), /non-empty operator database password/);
  }
});

test('child receives canonical credential URL without inheriting duplicate raw source password', () => {
  const secret = 'synthetic:@/#?%[]';
  const code = "const u = new URL(process.env.DATABASE_URL); if (u.hostname !== 'db' || decodeURIComponent(u.password) !== 'synthetic:@/#?%[]' || Object.hasOwn(process.env, 'WOONPOINTS_DB_PASSWORD')) process.exit(19);";
  const result = spawnSync(process.execPath, [launcher, process.execPath, '-e', code], {
    encoding: 'utf8', timeout: 8000,
    env: { ...process.env, WOONPOINTS_DB_PASSWORD: secret,
      DATABASE_URL: 'postgresql://woonpoints:wrong@evil.example/db' }
  });
  assert.equal(result.status, 0, 'process must receive recomputed internal URL');
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('invalid startup secret exits 2 without printing the password or inherited URI', () => {
  const result = spawnSync(process.execPath, [launcher, process.execPath, '-e', 'process.exit(0)'], {
    encoding: 'utf8', timeout: 8000,
    env: { ...process.env, WOONPOINTS_DB_PASSWORD: '', DATABASE_URL: 'private-should-not-appear' }
  });
  assert.equal(result.status, 2);
  assert.doesNotMatch(result.stderr, /private-should-not-appear|postgresql:\/\//);
});

test('both Compose services invoke the URL launcher without an implicit shell', () => {
  for (const name of ['app', 'worker']) {
    const start = compose.indexOf('  '+name+':\n');
    const end = compose.indexOf(name==='app'?'  worker:\n':'\nvolumes:', start);
    assert.ok(start>=0 && end>start, name+' service exists');
    const block = compose.slice(start,end);
    assert.match(block, /DATABASE_URL: "postgresql:\/\/woonpoints:\$\{WOONPOINTS_DB_PASSWORD:/);
    assert.match(block, /command: \["node", "src\/lib\/db-url-launcher\.mjs", "npm", "run", "(?:dev|worker)"\]/);
  }
});


test('launched service nonzero exit status is retained for supervisor diagnosis', () => {
  const result = spawnSync(process.execPath, [launcher, process.execPath, '-e', 'process.exit(17)'], {
    encoding: 'utf8', timeout: 8000,
    env: { ...process.env, WOONPOINTS_DB_PASSWORD: 'synthetic-safe-password' }
  });
  assert.equal(result.status, 17);
  assert.equal(result.stderr, '');
});

test('missing child executable fails without leaking the generated connection URL', () => {
  const result = spawnSync(process.execPath, [launcher, 'woonpoints-nonexistent-cli-20261017'], {
    encoding: 'utf8', timeout: 8000,
    env: { ...process.env, WOONPOINTS_DB_PASSWORD: 'synthetic:@/#%reserved',
      DATABASE_URL: 'private-should-not-appear' }
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /service could not start/);
  assert.doesNotMatch(result.stderr, /synthetic|private-should-not-appear|postgresql:\/\//);
});
