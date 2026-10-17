// Verify a single source of DB credentials across all Compose services.
// Reads only temporary synthetic files and Docker's config parser: NO daemon,
// containers, real database, user data or network required.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=path.resolve(import.meta.dirname,'..');

test('app and worker defer DB URI construction until launcher, despite stale env-file URL',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'woonpoints-db-parity-'));
  try {
    fs.copyFileSync(path.join(root,'docker-compose.yml'),path.join(tmp,'docker-compose.yml'));
    const secret='synthetic-private-source-of-truth-447';
    const wrong='synthetic-intentionally-wrong-889';
    const source=fs.readFileSync(path.join(root,'.env.example'),'utf8')
      .replace(/^WOONPOINTS_DB_PASSWORD=\s*$/m,'WOONPOINTS_DB_PASSWORD='+secret)
      .replace(/^DATABASE_URL=\s*$/m,'DATABASE_URL=postgresql://woonpoints:'+wrong+
        '@db:5432/woonpoints?schema=public');
    fs.writeFileSync(path.join(tmp,'.env'),source,{mode:0o600});
    const isolatedEnv={...process.env};
    delete isolatedEnv.WOONPOINTS_DB_PASSWORD;
    delete isolatedEnv.DATABASE_URL;
    const result=spawnSync('docker',
      ['compose','-f','docker-compose.yml','config','--format','json'],
      {cwd:tmp,env:isolatedEnv,encoding:'utf8',timeout:20000,maxBuffer:1024*1024});
    if(result.error)throw Error('Docker Compose unavailable: '+result.error.code);
    assert.equal(result.status,0,'valid synthetic Compose must be parseable without daemon access');
    const services=JSON.parse(result.stdout).services;
    assert.equal(services.db.environment.POSTGRES_PASSWORD,secret);
    assert.ok(wrong !== secret, 'test fixture must genuinely differ');
    for (const name of ['app', 'worker']) {
      assert.equal(services[name].environment.DATABASE_URL, '',
        name+' must not expose an encoded or stale raw credential before launcher');
      assert.equal(services[name].environment.WOONPOINTS_DB_PASSWORD, secret,
        name+' launcher must still receive source-of-truth input');
    }
    assert.equal(services.worker.environment.BOT_DRY_RUN,'true');
    for(const name of ['db','app']){
      assert.ok(services[name].ports?.every(p=>p.host_ip==='127.0.0.1'),
        name+' must retain localhost-only port publishing');
    }
  } finally {
    fs.rmSync(tmp,{recursive:true,force:true});
  }
});
