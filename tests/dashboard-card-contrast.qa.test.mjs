import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

function luminance(color) {
  assert.match(color, /^#[\da-f]{6}$/i, 'only explicit six-digit CSS colors are admitted');
  const channels = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16) / 255);
  return channels.reduce((acc, channel, i) => {
    const linear = channel <= 0.04045
      ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return acc + linear * [0.2126, 0.7152, 0.0722][i];
  }, 0);
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const found = css.match(new RegExp('(?:^|})\\s*' + escaped + '\\s*\\{([^}]*)\\}', 'm'));
  assert.ok(found, selector + ' must be present');
  return found[1];
}

test('the former muted small-text color genuinely failed WCAG AA', () => {
  assert.ok(contrast('#6f7b73', '#ffffff') < 4.5,
    'regression negative control must demonstrate the original defect');
});

test('14px project-status descriptions meet ordinary-text WCAG AA contrast', () => {
  const card = rule('.card, .panel');
  assert.match(card, /background:\s*white\s*;/,
    'card surface must remain white for this contrast contract');
  const description = rule('.card p');
  assert.match(description, /font-size:\s*14px\s*;/,
    'threshold applies to actual ordinary-size text, not large-text exceptions');
  const color = description.match(/(?:^|;)\s*color:\s*(#[\da-f]{6})\s*;/i);
  assert.ok(color, 'a reviewable explicit text color is required');
  const ratio = contrast(color[1], '#ffffff');
  assert.ok(ratio >= 4.5, 'card details require at least 4.5:1 contrast (observed ' + ratio.toFixed(2) + ':1)');
});
