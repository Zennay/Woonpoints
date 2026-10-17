import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const compose = fs.readFileSync(path.join(root, 'docker-compose.yml'), 'utf8');

test('Compose never embeds the operator DB password into a redundant app or worker DATABASE_URL', () => {
  for (const name of ['app', 'worker']) {
    const start = compose.indexOf('  ' + name + ':\n');
    const end = compose.indexOf(name === 'app' ? '  worker:\n' : '\nvolumes:', start);
    assert.ok(start >= 0 && end > start, 'expected scoped service ' + name);
    const block = compose.slice(start, end);
    assert.match(block, /^      DATABASE_URL: ""$/m,
      name + ' must receive an empty bootstrap URI; launcher derives the real URI');
    assert.doesNotMatch(block, /DATABASE_URL:\s*["']?postgresql:\/\//,
      name + ' must not re-expose raw password in a provisional URI');
    assert.match(block, /command: \["node", "src\/lib\/db-url-launcher\.mjs", "npm", "run", "(dev|worker)"\]/);
  }
  assert.match(compose, /^      POSTGRES_PASSWORD: \$\{WOONPOINTS_DB_PASSWORD:\?/m);
});

test('Docker Compose resolves a stale local URL to an empty bootstrap URI without weakening dry-run', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'woonpoints-compose-url-min-'));
  try {
    fs.copyFileSync(path.join(root, 'docker-compose.yml'), path.join(tmp, 'docker-compose.yml'));
    const source = fs.readFileSync(path.join(root, '.env.example'), 'utf8')
      .replace(/^WOONPOINTS_DB_PASSWORD=\s*$/m, 'WOONPOINTS_DB_PASSWORD=synthetic-no-real-secret')
      .replace(/^DATABASE_URL=\s*$/m, 'DATABASE_URL=postgresql://wrong:synthetic-wrong@invalid.test/stale');
    fs.writeFileSync(path.join(tmp, '.env'), source, { mode: 0o600 });
    const env = { ...process.env };
    delete env.WOONPOINTS_DB_PASSWORD;
    delete env.DATABASE_URL;
    const run = spawnSync('docker', ['compose', '-f', 'docker-compose.yml', 'config', '--format', 'json'], {
      cwd: tmp, env, encoding: 'utf8', timeout: 20000, maxBuffer: 1024 * 1024
    });
    assert.ifError(run.error);
    assert.equal(run.status, 0, 'synthetic Compose config must parse without daemon');
    const services = JSON.parse(run.stdout).services;
    assert.ok(services.db.environment.POSTGRES_PASSWORD, 'the db retains its own password');
    for (const name of ['app', 'worker']) {
      assert.equal(services[name].environment.DATABASE_URL, '',
        name + ' must not inherit stale or reconstructed raw credential URL');
      assert.equal(services[name].environment.WOONPOINTS_DB_PASSWORD,
        services.db.environment.POSTGRES_PASSWORD,
        name + ' launcher must still receive its sole source credential');
    }
    assert.equal(services.worker.environment.BOT_DRY_RUN, 'true');
    for (const name of ['db', 'app']) {
      assert.ok(services[name].ports?.every(p => p.host_ip === '127.0.0.1'),
        name + ' ports must remain localhost-only');
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
