import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Multi-architecture OCI index inspected from Docker Hub and exact digest on 2026-10-17.
const expectedImage = 'postgres:16-alpine@sha256:721873c34ceb9f8d8fc265984940dc982404c105f19ad51be9fdc5970a6080ea';
const compose = readFileSync(new URL('../docker-compose.yml', import.meta.url), 'utf8');

function dbBlock(document) {
  const match = document.match(/^  db:\n([\s\S]*?)(?=^  app:)/m);
  assert.ok(match, 'Docker Compose db service must precede app');
  return match[1];
}

function assertPinnedPostgres(document) {
  const block = dbBlock(document);
  const matches = [...block.matchAll(/^    image:\s*(\S+)\s*$/gm)];
  assert.equal(matches.length, 1, 'DB service must declare exactly one image');
  assert.equal(matches[0][1], expectedImage, 'DB base requires reviewed multiarch OCI digest');
}

test('PostgreSQL database uses exact reviewed immutable multiarch index', () => {
  assertPinnedPostgres(compose);
  assert.match(expectedImage, /^postgres:16-alpine@sha256:[0-9a-f]{64}$/);
});

test('guard rejects mutable tag, platform-specific manifest and bogus digest', () => {
  for (const image of [
    'postgres:16-alpine',
    'postgres:latest',
    'postgres:16-alpine@sha256:1a66d744c1b459e13b05a8fca341da84cb63383e99ce262210efee5a319d4551',
    'postgres:16-alpine@sha256:invalid',
  ]) {
    const changed = compose.replace(expectedImage, image);
    assert.notEqual(changed, compose, 'negative fixture must change the actual Compose image');
    assert.throws(() => assertPinnedPostgres(changed), /reviewed multiarch OCI digest/);
  }
});

test('pinning preserves local database boundary and dry-run worker', () => {
  const db = dbBlock(compose);
  assert.match(db, /POSTGRES_PASSWORD: \$\{WOONPOINTS_DB_PASSWORD:\?/);
  assert.match(db, /POSTGRES_USER:\s*woonpoints/);
  assert.match(db, /POSTGRES_DB:\s*woonpoints/);
  assert.match(db, /127\.0\.0\.1:5432:5432/);
  assert.match(db, /pg_isready -U woonpoints -d woonpoints/);
  assert.match(compose, /127\.0\.0\.1:3000:3000/);
  assert.match(compose, /command: \["node", "src\/lib\/db-url-launcher\.mjs", "npm", "run", "worker"\]/);
  assert.match(compose, /restart:\s*"no"/);
});
