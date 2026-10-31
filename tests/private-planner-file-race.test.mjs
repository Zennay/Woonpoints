import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../src/app/position-stats.tsx', import.meta.url), 'utf8');
const anchor = source.indexOf('export function ManualDeadlinePlanner(');
const start = source.indexOf('  async function selectJson(file: File | undefined) {', anchor);
const end = source.indexOf('\n  }\n\n  function exportIcs(', start);
assert.ok(anchor >= 0 && start > anchor && end > start);
const handler = source.slice(start, end + 4).replace('file: File | undefined', 'file')
  .replace('const decoded: unknown', 'const decoded')
  .replace(' as {version?: unknown; entries?: unknown}', '')
  .replace('(item: PrivatePlanItem)', '(item)');

function session() {
  const state = {pending: null, notice: '', sequence: {current: 0}};
  const globals = {
    planImportSequence: state.sequence,
    MAX_PRIVATE_PLANS: 12,
    validPrivatePlan: () => true,
    setPendingImport(v) { state.pending = v; },
    setNotice(v) { state.notice = v; }
  };
  return {state, select: vm.runInNewContext('(' + handler + ')', globals)};
}
function deferred() {
  let resolve;
  const promise = new Promise(r => { resolve = r; });
  return {promise, resolve};
}
const plan = label => JSON.stringify({version: 1, entries: [{label, when: '2026-11-01T10:00', kind: 'reactie', status: 'open'}]});
const file = promise => ({size: 150, text: () => promise});

test('latest private planner import wins when earlier file resolves last', async () => {
  const {state, select} = session();
  const slow = deferred(), latest = deferred();
  const first = select(file(slow.promise));
  const second = select(file(latest.promise));
  latest.resolve(plan('NEW')); await second;
  slow.resolve(plan('OLD')); await first;
  assert.equal(state.pending[0].label, 'NEW');
});

test('invalid new planner file cancels a previously reading file', async () => {
  const {state, select} = session();
  const slow = deferred();
  const first = select(file(slow.promise));
  await select({size: 17000, text: () => {throw Error('not read');}});
  slow.resolve(plan('OLD')); await first;
  assert.equal(state.pending, null);
  assert.match(state.notice, /Bestand geweigerd/);
});
