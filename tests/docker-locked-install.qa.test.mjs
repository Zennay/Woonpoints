import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const text = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const dockerfile = text('Dockerfile');
const pkg = JSON.parse(text('package.json'));
const lock = JSON.parse(text('package-lock.json'));

function assertLockedContainerInstall(source) {
  const copy = source.indexOf('COPY package*.json ./');
  const install = source.indexOf('RUN npm ci --no-audit --no-fund');
  const sourceCopy = source.indexOf('COPY . .');
  assert.ok(copy >= 0 && install > copy && sourceCopy > install,
    'install immutable lock before app source, never resolve dependencies from drifting ranges');
  assert.equal((source.match(/^RUN npm (?:ci|install)(?:\s|$)/gm) || []).length, 1,
    'exactly one dependency installer is allowed across inherited build stages');
  assert.doesNotMatch(source, /^RUN npm install(?:\s|$)/m);
  assert.doesNotMatch(source, /^RUN npm ci.*(?:\|\||--package-lock=false|--ignore-scripts)/m);
}

test('app and worker Docker build restore exact committed npm lock with npm ci', () => {
  assertLockedContainerInstall(dockerfile);
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
  assert.deepEqual(lock.packages[''].devDependencies, pkg.devDependencies);
  const dockerignore = text('.dockerignore');
  assert.match(dockerignore, /^!package\.json$/m,
    'package.json must be explicitly admitted into the Docker build context');
  assert.match(dockerignore, /^!package-lock\.json$/m,
    'the committed integrity lockfile must be explicitly admitted');
  assert.doesNotMatch(dockerignore, /^!package\*\.json$/m,
    'a broad package glob could admit unreviewed secret-like JSON files');
});

test('mutable install, fallback or mismatched build order fail closed', () => {
  for (const altered of [
    dockerfile.replace('RUN npm ci --no-audit --no-fund', 'RUN npm install'),
    dockerfile.replace('RUN npm ci --no-audit --no-fund', 'RUN npm ci || npm install'),
    dockerfile.replace('RUN npm ci --no-audit --no-fund', 'RUN npm ci --package-lock=false'),
    dockerfile.replace('RUN npm ci --no-audit --no-fund', 'RUN npm ci --ignore-scripts'),
    dockerfile.replace('COPY package*.json ./', 'COPY package.json ./'),
    dockerfile.replace('COPY . .', 'RUN npm install\nCOPY . .'),
    dockerfile.replace('COPY . .', '').replace('WORKDIR /app', 'WORKDIR /app\nCOPY . .'),
  ]) {
    assert.throws(() => assertLockedContainerInstall(altered));
  }
});
