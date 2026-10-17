import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const launcher = fileURLToPath(new URL('../src/lib/db-url-launcher.mjs', import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function until(predicate, timeoutMs = 4500) {
  const stop = Date.now() + timeoutMs;
  while (Date.now() < stop) {
    if (predicate()) return true;
    await pause(40);
  }
  return predicate();
}

test('SIGTERM reaches an npm-style grandchild, not only its direct parent', {
  skip: process.platform !== 'linux',
  timeout: 12000,
}, async () => {
  const dir = mkdtempSync(join(tmpdir(), 'woonpoints-shutdown-'));
  const readyPath = join(dir, 'grandchild-ready');
  const stoppedPath = join(dir, 'grandchild-stopped');
  const grandchildScript = [
    'const fs = require("node:fs");',
    'fs.writeFileSync(process.argv[1], "ready");',
    'process.on("SIGTERM", () => { fs.writeFileSync(process.argv[2], "terminated"); process.exit(0); });',
    'setInterval(() => {}, 250);',
  ].join(' ');
  const parentScript = [
    'const { spawn } = require("node:child_process");',
    'const child = spawn(process.execPath, ["-e", ' + JSON.stringify(grandchildScript) + ', ' +
      JSON.stringify(readyPath) + ', ' + JSON.stringify(stoppedPath) + '], { stdio: "ignore" });',
    'process.stdout.write(String(child.pid) + "\\n");',
    // Simulate npm shutting itself down without forwarding to its child.
    'process.on("SIGTERM", () => process.exit(0));',
    'setInterval(() => {}, 250);',
  ].join(' ');
  const child = spawn(process.execPath, [launcher, process.execPath, '-e', parentScript], {
    env: {
      ...process.env,
      WOONPOINTS_DB_PASSWORD: 'synthetic-process-group-secret',
      DATABASE_URL: 'stale-private-value',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', chunk => { stdout += chunk.toString(); });
  child.stderr.on('data', chunk => { stderr += chunk.toString(); });
  let grandchildPid = null;
  try {
    const ready = await until(() => existsSync(readyPath) && /^\d+\n/.test(stdout));
    assert.equal(ready, true, 'test subprocesses must start: ' + stderr);
    grandchildPid = Number(stdout.match(/^(\d+)\n/)[1]);
    assert.ok(Number.isSafeInteger(grandchildPid) && grandchildPid > 1);
    child.kill('SIGTERM');
    assert.equal(await until(() => existsSync(stoppedPath), 2600), true,
      'SIGTERM was swallowed by the direct npm-like child and never reached its Next-like grandchild');
    assert.doesNotMatch(stderr, /synthetic|postgresql:\/\//);
  } finally {
    if (child.exitCode === null) child.kill('SIGKILL');
    // If the test finds a regression, always clean up its own synthetic
    // descendant, never signal a VPS service or any process group here.
    if (grandchildPid && !existsSync(stoppedPath)) {
      try { process.kill(grandchildPid, 'SIGKILL'); } catch { /* already exited */ }
    }
    rmSync(dir, { recursive: true, force: true });
  }
});
