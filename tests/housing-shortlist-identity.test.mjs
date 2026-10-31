import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeManualHome, manualHomeDisplayLabels, compareTwoManualHomes,
  exportManualHousingDecisionNote, encodeHousingShortlist, decodeHousingShortlist
} from '../src/lib/position-statistics.mjs';

const preferences = {maxRent: 1200, minRooms: 2, maxTravel: 60, preferBalcony: false};
const first = {label: 'Woning A', rent: 850, rooms: 3, travel: 25, balcony: false};
const second = {label: 'Woning A', rent: 950, rooms: 2, travel: 35, balcony: true};

test('duplicate neutral labels still compare by distinct, original source rows', () => {
  const comparison = compareTwoManualHomes([first, second], preferences, [0, 1]);
  assert.ok(comparison);
  assert.deepEqual(comparison.choiceLabels, ['Woning A (notitie 1)', 'Woning A (notitie 2)']);
  assert.equal(comparison.lowerRent, 'Woning A (notitie 1)');
  assert.equal(comparison.shorterTravel, 'Woning A (notitie 1)');
  assert.equal(comparison.moreRooms, 'Woning A (notitie 1)');
  assert.equal(comparison.monthlyRentGap, 100);
  assert.deepEqual([comparison.choices[0].index, comparison.choices[1].index], [0, 1]);
  const note = exportManualHousingDecisionNote([first, second], preferences, [0, 1]);
  assert.ok(note.includes('Woning A (notitie 1)\n'));
  assert.ok(note.includes('Woning A (notitie 2)\n'));
  assert.ok(!note.includes('toewijzingskans bevestigd'));
});

test('distinct housing labels stay unchanged; no duplicate index inflation', () => {
  const separate = {...second, label: 'Studio B'};
  const result = compareTwoManualHomes([first, separate], preferences, [0, 1]);
  assert.deepEqual(result.choiceLabels, ['Woning A', 'Studio B']);
  assert.equal(result.lowerRent, 'Woning A');
  const raw = encodeHousingShortlist(preferences, [first, separate]);
  const parsed = decodeHousingShortlist(raw);
  assert.equal(parsed.homes[1].label, 'Studio B');
});

test('invisible directional controls cannot spoof manual housing comparison names', () => {
  for (const label of ['Woning\u202eB', 'Woning\u2067B', 'Woning\u200bB', 'Woning\ufeffB']) {
    assert.equal(normalizeManualHome({...first,label}), null, JSON.stringify(label));
  }
  assert.equal(normalizeManualHome({...first, label: 'Woning René'}).label, 'Woning René');
  const payload = JSON.stringify({
    format: 'woonpoints-private-shortlist-v1', preferences, homes: [first,
      {...second, label:'Woning\u202eB'}]
  });
  assert.equal(decodeHousingShortlist(payload), null);
});

// An actual shortlist may carry duplicate labels after import. Never make
// source row one indistinguishable from source row two on screen.
test('screen-facing labels match comparison and TXT identity for every row', () => {
  const labels = manualHomeDisplayLabels([
    first,
    {...second, label: 'woning a'},
    {...first, label: 'Studio B'},
  ]);
  assert.deepEqual(labels, ['Woning A (notitie 1)', 'woning a (notitie 2)', 'Studio B']);
  const comparison = compareTwoManualHomes([first, {...second,label:'woning a'}, {...first,label:'Studio B'}], preferences,[1,0]);
  assert.deepEqual(comparison.choiceLabels, [labels[1], labels[0]]);
});

test('screen-facing labels refuse invalid input and preserve distinct accents', () => {
  assert.equal(manualHomeDisplayLabels([first, {...second, label: 'Woning' + String.fromCharCode(0x202e)}]), null);
  assert.deepEqual(manualHomeDisplayLabels([first, {...second, label: 'Woning Á'}]), ['Woning A', 'Woning Á']);
});


test('visible comparison cards, ranked items and selection actions display disambiguated identities', () => {
  const ui = readFileSync(new URL('../src/app/position-stats.tsx', import.meta.url), 'utf8');
  assert.match(ui, /<h4>\{comparison\.choiceLabels\[0\]\}<\/h4>/);
  assert.match(ui, /<h4>\{comparison\.choiceLabels\[1\]\}<\/h4>/);
  assert.match(ui, /<strong>\{displayLabels\?\.\[row\.index\]/);
  assert.match(ui, /aria-label=\{\(compared\.includes\(row\.index\)/);
});
