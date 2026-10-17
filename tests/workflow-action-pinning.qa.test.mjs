// All external CI actions must be immutable: prevent silently movable tag execution.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const workflows = new URL('../.github/workflows/', import.meta.url);
const names = readdirSync(workflows).filter(name => /\.ya?ml$/.test(name));
const pinned = /^[a-z0-9_.-]+\/[a-z0-9_.\/-]+@[a-f0-9]{40}$/i;
function externalActions(yaml) {
  return [...yaml.matchAll(/^\s*-\s*uses:\s*([^\s#]+)/gm)]
    .map(match => match[1])
    .filter(value => !value.startsWith('./'));
}

test('all workflow sources are checked; a movable action ref is always rejected', () => {
  assert.ok(names.length >= 7, 'the existing workflow inventory must remain present');
  assert.equal(pinned.test('actions/setup-node@v4'), false);
  assert.equal(pinned.test('actions/checkout@main'), false);
  assert.equal(pinned.test('actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020'), true);
});

for (const name of names) {
  test(name + ': every remote action is pinned to an immutable full Git commit', () => {
    const yaml = readFileSync(new URL(name, workflows), 'utf8');
    const references = externalActions(yaml);
    assert.ok(references.length > 0, name + ': no action invocations detected');
    for (const reference of references) {
      assert.match(reference, pinned, name + ': replace movable/ambiguous action with full 40-hex SHA');
    }
  });
}
