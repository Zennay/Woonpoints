import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { summarizePositionPairs } from '../src/lib/position-statistics.mjs';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('absent input is unknown rather than a fabricated rank or zero', () => {
  assert.equal(summarizePositionPairs(''), null);
  assert.equal(summarizePositionPairs('  \n  '), null);
});

test('simple rankings calculate exact average, median and per-listing percentiles', () => {
  const r = summarizePositionPairs('1/100\n3/11\n5/5');
  assert.deepEqual(r, {
    source: 'manual-unverified', sampleCount: 3, averagePosition: 3,
    medianPosition: 3, averagePercentile: 60, bestPosition: 1,
    worstPosition: 5
  });
  // 1/100 => 100th percentile, 3/11 => 80th, 5/5 => 0th.
});

test('even median and 1 of 1 outcome remain mathematically defined', () => {
  const r = summarizePositionPairs('1/1\n4/8');
  assert.deepEqual(r, {source:'manual-unverified',sampleCount:2,
    averagePosition:2.5,medianPosition:2.5,averagePercentile:100-100*3/14,
    bestPosition:1,worstPosition:4});
});

test('percentiles compute on raw fractions rather than rounded positions', () => {
  const r = summarizePositionPairs('2/3\n2/7');
  assert.equal(r.averagePercentile, (50 + 100 * 5/6)/2);
  assert.equal(r.averagePosition, 2);
});

test('bounded input accepts LF/CRLF and blanks, not hidden data or malformed rows', () => {
  assert.equal(summarizePositionPairs('\r\n1/2\r\n\r\n2/3\r\n').sampleCount, 2);
  const bad = ['1/0','0/2','3/2','-1/2','+1/2','01/2','1/02','1/2,foo',
    '1/2\rbad','1 /2','1/ 2','1/2\tsecret','Infinity/3','1e2/2','1.2/2',
    '1/1000000','1000000/1000000','0/0','1/2\npassword=secret'];
  for (const input of bad) assert.throws(() => summarizePositionPairs(input), /Ongeldige positiegegevens/, input);
});

test('oversize and >50 samples reject before parsing or leaking payloads', () => {
  assert.throws(() => summarizePositionPairs('1/2\n'.repeat(51)), /Ongeldige positiegegevens/);
  assert.throws(() => summarizePositionPairs('a'.repeat(4097)), /Ongeldige positiegegevens/);
  for (const invalid of [null,{},false,1,[]]) {
    assert.throws(() => summarizePositionPairs(invalid), /Ongeldige positiegegevens/);
  }
});

test('offline UI is explicitly manual, memory-only, no network or account proof', () => {
  const page = read('src/app/page.tsx');
  const ui = read('src/app/position-stats.tsx');
  assert.match(page, /<PositionStats \/>/);
  assert.match(ui, /Posities handmatig analyseren/);
  assert.match(ui, /Geen geverifieerde WoningNet-gegevens/);
  assert.match(ui, /Niet opgeslagen/);
  assert.match(ui, /summarizePositionPairs/);
  assert.match(ui, /aria-live="polite"/);
  assert.match(ui, /role="alert"/);
  assert.match(ui, /maxLength=\{4096\}/);
  assert.doesNotMatch(ui, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|WebSocket|navigator\.sendBeacon/);
});
