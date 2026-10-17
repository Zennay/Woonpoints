import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const compose=readFileSync(new URL('../docker-compose.yml',import.meta.url),'utf8');
const example=readFileSync(new URL('../.env.example',import.meta.url),'utf8');
const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');

test('Postgres requires an explicit operator-provided password at Compose admission',()=>{
  assert.match(compose,
    /^      POSTGRES_PASSWORD: ["']?\$\{WOONPOINTS_DB_PASSWORD:\?[^\n}]+\}["']?\s*$/m,
    'no Docker Compose default password; fail closed when variable missing or empty');
  assert.doesNotMatch(compose,/^\s+POSTGRES_PASSWORD:\s*woonpoints\s*$/m);
  assert.match(compose,/^\s+- ["']127\.0\.0\.1:5432:5432["']\s*$/m,
    'database port must remain bound to loopback');
});

test('sample environment contains no reusable DB credentials and remains dry-run only',()=>{
  assert.match(example,/^WOONPOINTS_DB_PASSWORD=\s*$/m,
    'the supplied example must not silently enable a default database password');
  assert.match(example,/^DATABASE_URL=\s*$/m,
    'the sample must not contain a reusable static credential URL');
  assert.doesNotMatch(example,/postgresql:\/\/woonpoints:woonpoints@/);
  assert.match(example,/^BOT_DRY_RUN=true\s*$/m);
});

test('operator README documents matching URL-safe generated secret without deployment claim',()=>{
  assert.match(readme,/WOONPOINTS_DB_PASSWORD/);
  assert.match(readme,/DATABASE_URL/);
  assert.match(readme,/random|secrets|wachtwoord|password/i);
  assert.match(readme,/BOT_DRY_RUN=true/);
});
