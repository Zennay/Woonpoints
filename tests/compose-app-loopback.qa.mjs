import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const compose=readFileSync(new URL('../docker-compose.yml',import.meta.url),'utf8');

function service(name){
  const match=compose.match(new RegExp('^  '+name+':\\s*\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9_-]*:|^volumes:|$(?![\\s\\S]))','m'));
  assert.ok(match,name+' must exist in Compose');
  return match[1];
}

test('the unauthenticated dashboard and database are reachable only on host loopback',()=>{
  const app=service('app'),db=service('db');
  assert.match(app,/^    ports:\s*\n\s*- ["']127\.0\.0\.1:3000:3000["']\s*$/m,
    'app must be bound to localhost, not implicitly published on 0.0.0.0');
  assert.doesNotMatch(app,/^\s*- ["']?(?:3000:3000|0\.0\.0\.0:3000:3000)/m,
    'app must never be opened across all host interfaces by default');
  assert.match(db,/^    ports:\s*\n\s*- ["']127\.0\.0\.1:5432:5432["']\s*$/m,
    'the Postgres protection must remain intact');
});

test('the source Compose keeps the two internal service dependencies and no worker port',()=>{
  const app=service('app'),worker=service('worker');
  assert.match(app,/^    depends_on:\s*$/m);
  assert.match(worker,/^    restart: ["']no["']\s*$/m);
  assert.doesNotMatch(worker,/^    ports:/m,'worker must not expose a host listener');
});
