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
  const includes = rules.slice(1);
  assert.deepEqual(includes.slice().sort(), expected.slice().sort(),
    'review each added Docker build-context exception: no blanket !**');
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

test('docker layers still copy only the app/worker build roots', () => {
  const dockerfile = text('Dockerfile');
  assert.match(dockerfile, /^FROM node:20-alpine AS base/m);
  assert.match(dockerfile, /^COPY package\*\.json \.\//m);
  assert.match(dockerfile, /^COPY \. \.$/m);
  for (const required of ['package.json', 'src/worker/index.mjs',
                          'src/app/page.tsx', 'prisma/schema.prisma']) {
    assert.ok(text(required).length > 0, required + ' should remain present');
  }
});
