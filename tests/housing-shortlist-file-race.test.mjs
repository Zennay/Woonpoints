import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../src/app/position-stats.tsx',import.meta.url),'utf8');
const anchor=source.indexOf('export function ManualHousingShortlist(');
const start=source.indexOf('  async function selectJson(file: File | undefined) {',anchor);
const end=source.indexOf('\n  }\n\n  return (',start);
assert.ok(anchor>=0&&start>anchor&&end>start);
const actualHandler=source.slice(start,end+4)
  .replace('file: File | undefined','file')
  .replace(' as {preferences: Preferences; homes: Home[]} | null','');

function createSession(){
  const state={pending:null,notice:'',sequence:{current:0}};
  const context={
    importSequence:state.sequence,
    setPendingImport(v){state.pending=v;},
    setNotice(v){state.notice=v;},
    decodeHousingShortlist(raw){return JSON.parse(raw);}
  };
  return {state,select:vm.runInNewContext('('+actualHandler+')',context)};
}
function deferred(){
  let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};
}
function file(promise){
  return {size:60,text:()=>promise};
}

test('later selected private file remains the pending preview when older read finishes last',async()=>{
  const {state,select}=createSession();
  const old=deferred(),newest=deferred();
  const first=select(file(old.promise));
  const second=select(file(newest.promise));
  newest.resolve(JSON.stringify({homes:[{label:'NEW'}],preferences:{}}));
  await second;
  old.resolve(JSON.stringify({homes:[{label:'STALE'}],preferences:{}}));
  await first;
  assert.equal(state.pending.homes[0].label,'NEW');
});
test('selecting an invalid file cancels an older still-reading private import',async()=>{
  const {state,select}=createSession();
  const old=deferred();
  const first=select(file(old.promise));
  await select({size:18000,text:async()=>{throw new Error('should never read');}});
  old.resolve(JSON.stringify({homes:[{label:'STALE'}],preferences:{}}));
  await first;
  assert.equal(state.pending,null);
  assert.match(state.notice,/Bestand geweigerd/);
});
