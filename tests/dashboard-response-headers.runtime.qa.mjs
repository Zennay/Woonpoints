// Post-build integration proof. Runs only on CI's disposable GitHub-hosted
// Node runner; never reaches WoningNet, a database, or a production listener.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const nextBin = resolve(root, 'node_modules/next/dist/bin/next');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function freePort() {
  const server = createServer();
  await new Promise((resolveReady, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveReady);
  });
  const port = server.address().port;
  await new Promise((resolveClose, reject) => server.close(err => err ? reject(err) : resolveClose()));
  return port;
}

test('built Next server sends anti-embedding and privacy policy on 200 and 404', { timeout: 35000 }, async () => {
  const port = await freePort();
  const child = spawn(process.execPath, [nextBin, 'start', '-p', String(port), '-H', '127.0.0.1'], {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: '1' },
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  let errorText = '';
  child.stderr.on('data', part => { errorText = (errorText + part.toString('utf8')).slice(-2048); });
  try {
    let ready = false;
    for (let i = 0; i < 140; i++) {
      if (child.exitCode !== null) break;
      try {
        const response = await fetch('http://127.0.0.1:' + port + '/', { signal: AbortSignal.timeout(750) });
        if (response.status === 200) { ready = true; break; }
      } catch { /* A not-yet-listening preview is normal. */ }
      await sleep(100);
    }
    assert.ok(ready, 'built preview must start: ' + errorText);
    for (const [path, expected] of [['/', 200], ['/unavailable-test-path', 404], ['/api/health', 200]]) {
      const r = await fetch('http://127.0.0.1:' + port + path, { signal: AbortSignal.timeout(3000) });
      assert.equal(r.status, expected);
      assert.equal(r.headers.get('x-frame-options'), 'DENY');
      assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(r.headers.get('referrer-policy'), 'no-referrer');
      assert.equal(r.headers.get('x-dns-prefetch-control'), 'off');
      if (path === '/api/health') {
        // Only the HTTP server was reachable. No database, account, queue,
        // worker or live WoningNet status is independently verified here.
        assert.ok((r.headers.get('content-type') || '').startsWith('application/json'),
          'health endpoint must send JSON');
        const cacheDirectives = (r.headers.get('cache-control') || '')
          .split(',').map(part => part.trim().toLowerCase());
        assert.ok(cacheDirectives.includes('no-store'), 'health response must not be cached');
        const body = await r.json();
        assert.deepEqual(body, { service: 'woonpoints-web', status: 'serving' },
          'health response must never reveal operational details, secrets or a READY claim');
      }
      const policy = r.headers.get('permissions-policy') || '';
      for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) {
        assert.ok(policy.includes(feature + '=()'), feature + ' must be disabled on ' + path);
      }
    }
  } finally {
    child.kill('SIGTERM');
    await Promise.race([
      new Promise(done => child.once('exit', done)),
      sleep(2000).then(() => { if (child.exitCode === null) child.kill('SIGKILL'); }),
    ]);
  }
});
