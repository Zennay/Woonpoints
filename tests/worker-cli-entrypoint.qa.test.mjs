import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const workerSource = fileURLToPath(new URL('../src/worker/index.mjs', import.meta.url));
const policySource = fileURLToPath(new URL('../src/lib/safety.mjs', import.meta.url));

function withSpecialPathWorker(check) {
  const root = mkdtempSync(join(tmpdir(), 'woonpoints # worker space '));
  const workerFolder = join(root, 'src', 'worker');
  const libFolder = join(root, 'src', 'lib');
  mkdirSync(workerFolder, { recursive: true });
  mkdirSync(libFolder, { recursive: true });
  const entry = join(workerFolder, 'worker # copy.mjs');
  copyFileSync(workerSource, entry);
  copyFileSync(policySource, join(libFolder, 'safety.mjs'));
  try {
    return check(entry);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('direct Node CLI invocation works even when worker URL contains spaces and #', () => {
  withSpecialPathWorker((entry) => {
    const run = spawnSync(process.execPath, [entry], {
      encoding: 'utf8',
      env: { ...process.env, BOT_DRY_RUN: 'true' },
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stderr, '');
    const lines = run.stdout.trim().split('\n');
    assert.equal(lines.length, 1, 'successful dry-run CLI emits one non-authorizing receipt');
    const receipt = JSON.parse(lines[0]);
    assert.equal(receipt.service, 'woonpoints-worker');
    assert.equal(receipt.mode, 'dry-run');
    assert.equal(receipt.status, 'dry_run_only');
    assert.equal(receipt.liveExecutionAllowed, false);
    assert.equal(receipt.accountDataVerified, false);
    assert.equal(receipt.providerAdapterAvailable, false);
    assert.deepEqual(Object.keys(receipt).sort(), [
      'accountDataVerified', 'action', 'liveExecutionAllowed', 'mode',
      'providerAdapterAvailable', 'service', 'status'
    ]);
    assert.match(receipt.action, /No live WoningNet reaction/);
  });
});

test('special-path direct CLI never bypasses the existing live-execution refusal', () => {
  withSpecialPathWorker((entry) => {
    const run = spawnSync(process.execPath, [entry], {
      encoding: 'utf8',
      env: { ...process.env, BOT_DRY_RUN: 'false' },
    });
    assert.notEqual(run.status, 0, 'missing dry-run permission must fail, not exit silently');
    assert.match(run.stderr, /Live WoningNet execution is disabled/);
    assert.equal(run.stdout, '');
  });
});

test('importing a worker module under a special path never starts the CLI', () => {
  withSpecialPathWorker((entry) => {
    const expression = 'await import(' + JSON.stringify(pathToFileURL(entry).href) + ')';
    const run = spawnSync(process.execPath, ['--input-type=module', '--eval', expression], {
      encoding: 'utf8',
      env: { ...process.env, BOT_DRY_RUN: 'true' },
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(run.stdout, '');
    assert.equal(run.stderr, '');
  });
});
