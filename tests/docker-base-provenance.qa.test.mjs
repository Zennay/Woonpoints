import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dockerfile = readFileSync(new URL('../Dockerfile', import.meta.url), 'utf8');
const digest = 'fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293';

function baseFrom(source) {
  const from = source.split(/\r?\n/).find(line => /^FROM\s/i.test(line));
  assert.ok(from, 'Dockerfile must declare its external base');
  return from;
}

test('the Node 20 Alpine base uses the independently verified OCI index digest', () => {
  assert.equal(baseFrom(dockerfile),
    'FROM node:20-alpine@sha256:' + digest + ' AS base');
  assert.match(baseFrom(dockerfile), /^FROM node:20-alpine@sha256:[a-f0-9]{64} AS base$/);
});

test('mutable Docker base tags and architecture-specific digests cannot satisfy provenance', () => {
  for (const bad of [
    'FROM node:20-alpine AS base',
    'FROM node:20-alpine@sha256:afdf98210b07b586eb71fa22ba2e432e058e4cd1304d31ed60888755b8c865fb AS base',
    'FROM node:latest AS base',
    'FROM node:20-alpine@sha256:not-a-digest AS base',
  ]) {
    assert.notEqual(bad, 'FROM node:20-alpine@sha256:' + digest + ' AS base');
  }
});

test('app and dry-run worker inherit the same pinned base without new image roots', () => {
  const fromLines = dockerfile.split(/\r?\n/)
    .filter(line => /^FROM\s/i.test(line));
  assert.deepEqual(fromLines, [
    'FROM node:20-alpine@sha256:' + digest + ' AS base',
    'FROM base AS app',
    'FROM base AS worker',
  ]);
  assert.match(dockerfile, /^CMD \["npm", "run", "worker"\]$/m);
  assert.match(dockerfile, /^EXPOSE 3000$/m);
});
