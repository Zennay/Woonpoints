import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const text = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const expected = [
  '!Dockerfile',
  '!package*.json',
  '!next.config.mjs',
  '!next-env.d.ts',
  '!tsconfig.json',
  '!src', '!src/**',
  '!prisma', '!prisma/**',
  '!public', '!public/**',
];

test('docker context is opt-in only: no local .env, credentials or git history', () => {
  const rules = text('.dockerignore').split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
  assert.equal(rules[0], '*', 'deny all source files before selective inclusion');
  const includes = rules.slice(1).filter((line) => line.startsWith('!'));
  const nestedSecretDenies = rules.slice(1).filter((line) => !line.startsWith('!'));
  assert.deepEqual(includes.slice().sort(), expected.slice().sort(),
    'review each added Docker build-context exception: no blanket !**');
  assert.deepEqual(nestedSecretDenies, [
    '**/.env', '**/.env.*', '**/.npmrc', '**/.netrc',
    '**/*.pem', '**/*.key', '**/*.p12',
  ], 'nested credentials under allowed src/prisma/public require final exclusions');
  assert.equal(rules[rules.length - 1], '**/*.p12',
    'secret exclusion rules must be AFTER the folder allowlist');
  for (const sensitive of [
    '.env', '.env.local', '.env.production', '.git/config',
    'secrets/private.key', 'keys/token.json', '.next/server/server.js',
    'node_modules/.cache/x',
  ]) {
    // Every allowed exception must remain disjoint from these examples.
    const selected = includes.some((rule) => {
      const candidate = rule.slice(1);
      return candidate === sensitive ||
        (candidate.endsWith('/**') && sensitive.startsWith(candidate.slice(0, -3) + '/')) ||
        (candidate === 'package*.json' && /^package[^/]*\.json$/.test(sensitive));
    });
    assert.equal(selected, false, sensitive + ' must not enter the image');
  }
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
