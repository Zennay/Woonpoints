import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

test('project status forms a labelled section with one heading and per-card headings', () => {
  assert.match(page, /<section className="status-section" aria-labelledby="projectstatus-heading">/);
  assert.match(page, /<h2 id="projectstatus-heading" className="sr-only">Projectstatus<\/h2>/);
  assert.match(page, /cards\.map\(\(\[label, value, detail\]\) => \(/);
  assert.match(page, /<article className="card" key={label}>\s*<h3>{label}<\/h3>/);
  assert.match(page, /<strong>{value}<\/strong>\s*<p>{detail}<\/p>/);
});

test('status heading is visually hidden but remains in the accessibility tree', () => {
  const sr = css.match(/\.sr-only\s*\{([^}]+)\}/);
  assert.ok(sr);
  assert.match(sr[1], /position:\s*absolute/);
  assert.match(sr[1], /clip:\s*rect\(0, 0, 0, 0\)/);
  assert.doesNotMatch(sr[1], /display:\s*none|visibility:\s*hidden/i);
  assert.match(css, /\.card h3\s*\{[^}]*font-size:\s*13px\s*;/);
});
