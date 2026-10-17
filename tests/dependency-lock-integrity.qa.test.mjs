import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const text = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const pkg = JSON.parse(text('package.json'));
const lock = JSON.parse(text('package-lock.json'));
const workflow = text('.github/workflows/ci.yml');

test('the committed npm lock binds the complete top-level dependency declaration', () => {
  assert.equal(lock.lockfileVersion, 3);
  assert.equal(lock.name, pkg.name);
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].name, pkg.name);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies);
  assert.deepEqual(lock.packages[''].engines, pkg.engines);
  assert.ok(Object.keys(lock.packages).length > 1, 'lock must contain actual transitive packages');
});

test('locked npm registry packages have integrity-bound immutable resolutions', () => {
  let registryPackages = 0;
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!name) continue;
    if (typeof entry.resolved === 'string' && entry.resolved.startsWith('https://registry.npmjs.org/')) {
      registryPackages++;
      assert.match(entry.integrity || '', /^sha512-[A-Za-z0-9+/]+=*$/, name);
      assert.match(entry.version || '', /^\d+\.\d+\.\d+(?:[-+][\w.-]+)?$/, name);
    }
  }
  assert.ok(registryPackages > 0, 'a lock with no integrity-bound npm packages is not accepted');
});

test('hosted integration uses the committed lock instead of resolving versions again', () => {
  assert.match(workflow, /^\s*- run: npm ci --no-audit --no-fund$/m);
  assert.doesNotMatch(workflow, /^\s*- run: npm install(?:\s|$)/m);
  assert.match(workflow, /^\s*- run: npm test$/m);
  assert.match(workflow, /^\s*- run: npm run typecheck$/m);
  assert.match(workflow, /^\s*- run: npm run build$/m, 'real Next.js build must run in integration CI');
  assert.match(workflow, /^\s*timeout-minutes: 10$/m, 'bounded build job required');
});
