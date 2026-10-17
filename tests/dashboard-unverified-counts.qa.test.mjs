import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// The baseline has no authorized live WoningNet integration. Do not state an
// observed 0 for reaction counters before data actually exists.
const page = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const card = (name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return page.match(new RegExp(`\\['${escaped}',\\s*'([^']+)',\\s*'([^']+)'\\]`));
};

test('unlinked account must not present invented zero monthly reactions', () => {
  const item = card('Maanddoel');
  assert.ok(item, 'monthly goal card is required');
  assert.equal(item[1], 'Onbekend');
  assert.match(item[2], /vier|4/i);
  assert.match(item[2], /geen|niet|onbekend/i);
});

test('unlinked account must not present invented zero active reactions', () => {
  const item = card('Actieve reacties');
  assert.ok(item, 'active reactions card is required');
  assert.equal(item[1], 'Onbekend');
  assert.match(item[2], /geen.*(gegevens|account)|niet.*gekoppeld/i);
});

test('point snapshots stay explicitly unknown before account binding', () => {
  const item = card('Zoekpunten');
  assert.ok(item, 'search points card is required');
  assert.equal(item[1], '—');
  assert.match(item[2], /geen puntensnapshot/i);
});
