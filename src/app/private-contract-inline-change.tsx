'use client';

import {useMemo} from 'react';

/**
 * Literal, local character changes between ONE removed and ONE added line.
 * Keep both complete original lines. Never classify legal terms, prices or
 * acceptance. Long/ambiguous lines fall back to a single exact middle span.
 */
type Run = {text: string; kind: 'same' | 'removed' | 'added'};
type ExactChange = {oldRuns: Run[]; newRuns: Run[]; removed: number; added: number; regions: number; changedDigits: boolean; coarse: boolean};
const MAX_PRECISE_CODEPOINTS = 320;

function pushRun(runs: Run[], kind: Run['kind'], text: string) {
  if (!text) return;
  const last = runs[runs.length - 1];
  if (last?.kind === kind) last.text += text;
  else runs.push({kind, text});
}

function exactChange(older: string, newer: string): ExactChange {
  const oldPoints = Array.from(older);
  const newPoints = Array.from(newer);
  let first = 0;
  while (first < oldPoints.length && first < newPoints.length &&
         oldPoints[first] === newPoints[first]) first++;
  let last = 0;
  while (last < oldPoints.length - first && last < newPoints.length - first &&
         oldPoints[oldPoints.length - last - 1] === newPoints[newPoints.length - last - 1]) last++;
  const a = oldPoints.slice(first, oldPoints.length - last);
  const b = newPoints.slice(first, newPoints.length - last);
  const oldRuns: Run[] = [];
  const newRuns: Run[] = [];
  pushRun(oldRuns, 'same', oldPoints.slice(0, first).join(''));
  pushRun(newRuns, 'same', newPoints.slice(0, first).join(''));
  let regions = 0;
  let inChange = false;
  let changedDigits = false;
  let removed = 0;
  let added = 0;
  const emit = (kind: Run['kind'], character: string) => {
    if (kind !== 'same') {
      if (!inChange) regions++;
      inChange = true;
      if (/[0-9]/.test(character)) changedDigits = true;
    } else {
      inChange = false;
    }
    if (kind === 'removed') {removed++; pushRun(oldRuns, kind, character);}
    else if (kind === 'added') {added++; pushRun(newRuns, kind, character);}
    else {
      pushRun(oldRuns, kind, character);
      pushRun(newRuns, kind, character);
    }
  };
  const coarse = a.length > MAX_PRECISE_CODEPOINTS || b.length > MAX_PRECISE_CODEPOINTS;
  if (coarse) {
    for (const character of a) emit('removed', character);
    for (const character of b) emit('added', character);
  } else {
    // Bounded exact LCS; tie-break removal first and retain original order.
    // Uint16 is safe because each compared middle section is at most 320 points.
    const width = b.length + 1;
    const matrix = new Uint16Array((a.length + 1) * width);
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        matrix[i * width + j] = a[i] === b[j]
          ? 1 + matrix[(i + 1) * width + j + 1]
          : Math.max(matrix[(i + 1) * width + j], matrix[i * width + j + 1]);
      }
    }
    let i = 0, j = 0;
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) {
        emit('same', a[i]); i++; j++;
      } else if (i < a.length &&
          (j === b.length || matrix[(i + 1) * width + j] >= matrix[i * width + j + 1])) {
        emit('removed', a[i++]);
      } else {
        emit('added', b[j++]);
      }
    }
  }
  pushRun(oldRuns, 'same', last ? oldPoints.slice(-last).join('') : '');
  pushRun(newRuns, 'same', last ? newPoints.slice(-last).join('') : '');
  return {oldRuns, newRuns, removed, added, regions,
    changedDigits, coarse};
}

/** For an unambiguous one-line replacement, inspect the changed characters
 * rather than any digits that happen to occur elsewhere in the line.
 * This is literal edit evidence only, never a changed-price determination. */
export function privateContractChangedDigits(older: string, newer: string): boolean {
  return exactChange(older, newer).changedDigits;
}

function markedRuns(runs: Run[], side: 'old' | 'new') {
  return runs.map((run, index) => {
    if (run.kind === 'same') return <span key={index}>{run.text}</span>;
    return side === 'old'
      ? <del key={index} style={{textDecoration:'none'}}><mark
          style={{background:'#ffdfd9'}}>{run.text}</mark></del>
      : <ins key={index} style={{textDecoration:'none'}}><mark
          style={{background:'#ddf2dc'}}>{run.text}</mark></ins>;
  });
}

export function PrivateContractInlineChange({
  older, newer, oldLine, newLine,
}: {
  older: string;
  newer: string;
  oldLine: number;
  newLine: number;
}) {
  // Review checkboxes and notes can re-render many groups; only recompute
  // the bounded character alignment if one of these two actual lines changes.
  const comparison = useMemo(() => exactChange(older, newer), [older, newer]);
  return (
    <details style={{margin:'10px 0',padding:'10px 12px',
      border:'1px solid #b8cdbd',borderRadius:8}}>
      <summary style={{cursor:'pointer',fontWeight:600}}>
        Bekijk exacte tekenverschillen tussen oude regel {oldLine} en nieuwe regel {newLine}
        {comparison.changedDigits ? ' · gewijzigde tekens bevatten cijfers' : ''}
      </summary>
      <p style={{margin:'8px 0',fontSize:13}}>
        {comparison.regions} letterlijk gewijzigd(e) tekendeel(en):
        {' '}{comparison.removed} verwijderd, {comparison.added} toegevoegd.
        {comparison.coarse
          ? ' Lange regels krijgen één begrensde middenmarkering; de volledige tekst blijft zichtbaar.'
          : ' Afzonderlijke wijzigingen zijn apart gemarkeerd.'}
        {' '}Dit is geen interpretatie of goedkeuring van de contractwijziging.
      </p>
      <div aria-label={'Exacte tekenwijzigingen oud ' + oldLine + ' nieuw ' + newLine}
        style={{display:'grid',gap:8,overflowWrap:'anywhere'}}>
        <div>
          <strong>Oude regel {oldLine}</strong>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'3px 0'}}>
            {markedRuns(comparison.oldRuns, 'old')}
          </pre>
        </div>
        <div>
          <strong>Nieuwe regel {newLine}</strong>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'3px 0'}}>
            {markedRuns(comparison.newRuns, 'new')}
          </pre>
        </div>
      </div>
      <small>De volledige oorspronkelijke regeltekst, inclusief spaties en Unicode-tekens,
        blijft zichtbaar. Markering vergelijkt alleen tekens en bepaalt geen bedrag,
        juridische betekenis of akkoord. Controleer beide originele contracten.</small>
    </details>
  );
}
