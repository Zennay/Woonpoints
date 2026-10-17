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
  // The distributable sample deliberately leaves the DB password empty.
  // Assert the real Compose parser FAILS CLOSED before supplying any secret.
  const sample=fs.readFileSync(path.join(root,'.env.example'),'utf8');
  const envFile=path.join(temp,'.env');
  fs.writeFileSync(envFile,sample,{mode:0o600});
  // Ignore any unrelated runner-level environment variables so the test
  // proves the actual example/Compose admission contract.
  const isolatedEnv={...process.env};
  delete isolatedEnv.WOONPOINTS_DB_PASSWORD;
  delete isolatedEnv.DATABASE_URL;
  const run=()=>spawnSync('docker',
    ['compose','-f','docker-compose.yml','config','--format','json'],
    {cwd:temp,env:isolatedEnv,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
  const rejected=run();
  if(rejected.error)throw Error('Docker Compose config unavailable: '+rejected.error.code);
  assert.notEqual(rejected.status,0,
    'missing DB password must block real Compose config admission');

  // Use disposable fixture-only credentials. Never contact Docker daemon,
  // run an image or write a real operator's database.
  const syntheticPassword='fixture-only-not-for-deployment-47';
  const admitted=sample
    .replace(/^WOONPOINTS_DB_PASSWORD=\s*$/m,
      'WOONPOINTS_DB_PASSWORD='+syntheticPassword)
    .replace(/^DATABASE_URL=\s*$/m,
      'DATABASE_URL=postgresql://woonpoints:'+syntheticPassword+
      '@db:5432/woonpoints?schema=public');
  assert.notEqual(admitted,sample,'fixture must populate empty credential sample');
  fs.writeFileSync(envFile,admitted,{mode:0o600});
  const result=run();
  if (result.error) throw Error('Docker Compose config unavailable: '+result.error.code);
  assert.equal(result.status,0,
    'synthetic private credential must pass the actual Compose parser');
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
