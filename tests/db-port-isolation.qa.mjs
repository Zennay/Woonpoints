// Validate the ACTUAL normalized Docker Compose service topology, not a
// regex match on YAML. No daemon connection, image pull or network request:
// 'docker compose config' only reads isolated synthetic local files.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

function safeDatabasePorts(ports) {
  return Array.isArray(ports) && ports.every(port =>
    port && typeof port === 'object' &&
    (port.host_ip === '127.0.0.1' || port.host_ip === '::1')
  );
}

for (const unsafe of [
  [{target:5432,published:'5432'}],
  [{target:5432,published:'5432',host_ip:'0.0.0.0'}],
  [{target:5432,published:'5432',host_ip:'::'}],
  [{target:5432,published:'5432',host_ip:'192.0.2.12'}],
  [{target:5432,host_ip:'127.0.0.1'}, {target:5432}]
]) {
  assert.equal(safeDatabasePorts(unsafe),false,
    'public or partially public database bindings must fail');
}
assert.equal(safeDatabasePorts([{target:5432,host_ip:'127.0.0.1'}]),true);
assert.equal(safeDatabasePorts([]),true,'entirely internal DB needs no public port');

const root=path.resolve(import.meta.dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'woonpoints-compose-qa-'));
try {
  fs.copyFileSync(path.join(root,'docker-compose.yml'),path.join(temp,'docker-compose.yml'));
  // For schema inspection only: placeholders are not forwarded to any
  // service, database or Docker daemon and are never printed.
  fs.copyFileSync(path.join(root,'.env.example'),path.join(temp,'.env'));
  const result=spawnSync('docker',
    ['compose','-f','docker-compose.yml','config','--format','json'],
    {cwd:temp,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
  if (result.error) throw Error('Docker Compose config unavailable: '+result.error.code);
  assert.equal(result.status,0,
    'Compose configuration failed: '+(result.stderr||'').slice(0,500));
  const services=JSON.parse(result.stdout).services;
  assert.ok(services?.db,'expected PostgreSQL service');
  const ports=services.db.ports||[];
  assert.ok(safeDatabasePorts(ports),
    'PostgreSQL must not bind to 0.0.0.0, ::, or external host interfaces');
  assert.ok(!ports.length || ports.every(port=>Number(port.target)===5432),
    'only the expected PostgreSQL target port is permitted');
  console.log('PASS normalized Compose config: DB exclusively internal or loopback');
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
