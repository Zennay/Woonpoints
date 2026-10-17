import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { constants } from 'node:os';
import { fileURLToPath } from 'node:url';

const launcher = fileURLToPath(new URL('../src/lib/db-url-launcher.mjs', import.meta.url));

function exitFromSignal(signal) {
  return spawnSync(process.execPath, [
    launcher, process.execPath, '-e',
    'process.kill(process.pid, ' + JSON.stringify(signal) + ')',
  ], {
    encoding: 'utf8',
    timeout: 8000,
    env: {
      ...process.env,
      WOONPOINTS_DB_PASSWORD: 'synthetic-signal-only-password',
      DATABASE_URL: 'synthetic-legacy-should-not-appear',
    },
  });
}

test('a SIGKILL child exits as 137, not the old misleading SIGTERM 143', {
  skip: process.platform !== 'linux',
}, () => {
  const result = exitFromSignal('SIGKILL');
  assert.equal(result.error, undefined, 'no real OS process should hang');
  assert.equal(result.signal, null, 'launcher itself exits normally with the encoded child failure');
  assert.equal(result.status, 128 + constants.signals.SIGKILL);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
});

test('SIGTERM and SIGINT children retain their own distinct POSIX exit codes', {
  skip: process.platform !== 'linux',
}, () => {
  for (const signal of ['SIGTERM', 'SIGINT']) {
    const result = exitFromSignal(signal);
    assert.equal(result.error, undefined, signal + ' child must terminate');
    assert.equal(result.status, 128 + constants.signals[signal]);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, '');
  }
});

test('normal explicit child exit 17 is preserved and no URL leaks on error', () => {
  const result = spawnSync(process.execPath, [
    launcher, process.execPath, '-e', 'process.exit(17)',
  ], {
    encoding: 'utf8',
    timeout: 8000,
    env: {
      ...process.env,
      WOONPOINTS_DB_PASSWORD: 'synthetic-signal-only-password',
      DATABASE_URL: 'synthetic-legacy-should-not-appear',
    },
  });
  assert.equal(result.status, 17);
  assert.doesNotMatch(result.stderr, /synthetic|postgresql:\/\//);
});
