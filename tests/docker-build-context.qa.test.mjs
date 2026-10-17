import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const text = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// No recursive allowlists: an arbitrary secret JSON, migration dump or source
// config must not be swept into a cached app/worker Docker image layer.
const expected = [
  'Dockerfile', 'package.json', 'package-lock.json',
  'next.config.mjs', 'next-env.d.ts', 'tsconfig.json',
  'src', 'src/app', 'src/app/api', 'src/app/api/health',
  'src/app/api/health/route.ts', 'src/app/globals.css', 'src/app/layout.tsx',
  'src/app/manual-month-progress.tsx', 'src/app/position-stats.tsx', 'src/app/page.tsx', 'src/lib', 'src/lib/db-url-launcher.mjs',
  'src/lib/manual-month-progress.mjs', 'src/lib/position-statistics.mjs',
  'src/lib/safety.mjs', 'src/worker', 'src/worker/index.mjs',
  'prisma', 'prisma/schema.prisma',
];
const includedFiles = expected.filter(path => path.includes('/') && /\.[a-z]+$/.test(path));

test('Docker build context is deny-by-default and exactly file-allowlisted', () => {
  const rules = text('.dockerignore').split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
  const expectedRules = ['*'];
  for (const path of expected) {
    expectedRules.push('!' + path);
    // Docker exclusions are last-match-wins: unignoring a directory can
    // reintroduce its children unless the folder content is denied again.
    if (['src', 'src/app', 'src/app/api', 'src/app/api/health', 'src/lib', 'src/worker', 'prisma'].includes(path)) {
      expectedRules.push(path + '/*');
    }
  }
  assert.deepEqual(rules, expectedRules,
    'every traversable folder must re-deny all children before exact files');
  for (const path of expected) {
    assert.ok(existsSync(new URL('../' + path, import.meta.url)), 'missing build dependency: ' + path);
  }
  const reviewedDirectories = new Set(['src/app/api', 'src/app/api/health']);
  for (const source of ['src/app', 'src/app/api', 'src/app/api/health', 'src/lib', 'src/worker', 'prisma']) {
    // Detect an accidentally added source that builds locally but is absent
    // in Docker, rather than silently broadening the context to all files.
    const sourceDir = new URL('../' + source + '/', import.meta.url);
    for (const member of readdirSync(sourceDir, { withFileTypes: true })) {
      const candidate = source + '/' + member.name;
      assert.ok((member.isFile() && includedFiles.includes(candidate)) ||
        (member.isDirectory() && reviewedDirectories.has(candidate)),
        'review new Docker dependency explicitly: ' + source + '/' + member.name);
    }
  }
});

test('allowlist cannot ingest synthetic nested credential file paths', () => {
  const allowed = new Set(expected);
  for (const secret of [
    '.env', '.env.production', '.npmrc', '.netrc',
    'src/.env', 'src/app/.env', 'src/app/production-credentials.json',
    'src/app/config.secret.ts', 'src/app/api/secret.ts',
    'src/app/api/health/secret.json', 'src/app/api/health/.env',
    'src/lib/private.pem',
    'src/lib/token.json', 'src/worker/service-account.json',
    'prisma/.env', 'prisma/backup.sql', 'prisma/secret.p12',
    'public/local-token.json', '.git/config', '.next/server/manifest.json',
  ]) {
    assert.equal(allowed.has(secret), false, 'unreviewed secret path: ' + secret);
  }
  assert.equal(includedFiles.length, 12, 'source files require manifest review when changed');
});

// Until the separately owned Node OCI base update (#26) lands, accept only
// the currently shipped base or that ONE reviewed multiarch index. No wildcard
// digest and no additional external FROM stage may pass this context check.
const approvedNodeBases = new Set([
  'FROM node:20-alpine AS base',
  'FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS base',
]);
function hasReviewedStages(source) {
  const stages = source.split(/\r?\n/).map(line => line.trim())
    .filter(line => /^FROM\s/i.test(line));
  return stages.length === 3 && approvedNodeBases.has(stages[0]) &&
    stages[1] === 'FROM base AS app' && stages[2] === 'FROM base AS worker';
}

test('docker layers still copy only the app/worker build roots', () => {
  const dockerfile = text('Dockerfile');
  assert.ok(hasReviewedStages(dockerfile), 'only the current or exact reviewed OCI base and inherited app/worker stages are allowed');
  assert.match(dockerfile, /^COPY package\*\.json \.\//m);
  assert.match(dockerfile, /^COPY \. \.$/m);
  for (const required of ['package.json', 'src/worker/index.mjs',
                          'src/app/page.tsx', 'prisma/schema.prisma']) {
    assert.ok(text(required).length > 0, required + ' should remain present');
  }
});

test('context test refuses unreviewed Docker base substitutions and extra image roots', () => {
  const good = [
    'FROM node:20-alpine AS base',
    'FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS base',
  ];
  for (const base of good) {
    assert.equal(hasReviewedStages([base, 'FROM base AS app', 'FROM base AS worker'].join('\n')), true);
  }
  for (const rejected of [
    'FROM node:latest AS base',
    'FROM node:20-alpine@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa AS base',
    'FROM node:20-alpine@sha256:incomplete AS base',
    'FROM node:20-alpine AS base # unreviewed suffix',
  ]) {
    assert.equal(hasReviewedStages([rejected, 'FROM base AS app', 'FROM base AS worker'].join('\n')), false);
  }
  assert.equal(hasReviewedStages([good[1], 'FROM node:20-alpine AS app', 'FROM base AS worker'].join('\n')), false,
    'unreviewed second external base is forbidden');
});
