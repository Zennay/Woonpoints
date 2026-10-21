'use client';

/**
 * Exact, local character-level view of a single replaced contract line.
 *
 * Preserve both complete source lines and all whitespace. No similarity,
 * legal meaning, monetary value or contract acceptance is inferred.
 * This component does not read from storage, perform I/O or export data.
 */
type ReplacementParts = {
  commonPrefix: string;
  removed: string;
  added: string;
  commonSuffix: string;
};

function exactReplacementParts(older: string, newer: string): ReplacementParts {
  // Code points, not UTF-16 code units: never split a surrogate pair.
  const a = Array.from(older);
  const b = Array.from(newer);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let end = 0;
  while (end < a.length - start && end < b.length - start &&
         a[a.length - 1 - end] === b[b.length - 1 - end]) end++;
  return {
    commonPrefix: a.slice(0, start).join(''),
    removed: a.slice(start, a.length - end).join(''),
    added: b.slice(start, b.length - end).join(''),
    commonSuffix: end ? a.slice(a.length - end).join('') : '',
  };
}

export function PrivateContractInlineChange({
  older, newer, oldLine, newLine,
}: {
  older: string;
  newer: string;
  oldLine: number;
  newLine: number;
}) {
  const parts = exactReplacementParts(older, newer);
  const alteredDigits = /[0-9]/.test(parts.removed + parts.added);
  return (
    <details style={{margin:'10px 0',padding:'10px 12px',
      border:'1px solid #b8cdbd',borderRadius:8}}>
      <summary style={{cursor:'pointer',fontWeight:600}}>
        Bekijk exacte tekenverschillen tussen oude regel {oldLine} en nieuwe regel {newLine}
        {alteredDigits ? ' · aangepaste tekst bevat cijfers' : ''}
      </summary>
      <p style={{margin:'8px 0',fontSize:13}}>
        Dezelfde volledige tekst staat hieronder; alleen het gewijzigde middenstuk is gemarkeerd.
        Er wordt niets uitgelegd, automatisch goedgekeurd of geëxporteerd.
        Vergelijk de originele contracten zelf.
      </p>
      <div aria-label={'Exacte tekenwijzigingen oud ' + oldLine + ' nieuw ' + newLine}
        style={{display:'grid',gap:8,overflowWrap:'anywhere'}}>
        <div>
          <strong>Oude regel {oldLine}</strong>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'3px 0'}}>
            {parts.commonPrefix}
            {parts.removed && <del style={{textDecoration:'none'}}><mark style={{background:'#ffdfd9'}}>{parts.removed}</mark></del>}
            {parts.commonSuffix}
          </pre>
        </div>
        <div>
          <strong>Nieuwe regel {newLine}</strong>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'3px 0'}}>
            {parts.commonPrefix}
            {parts.added && <ins style={{textDecoration:'none'}}><mark style={{background:'#ddf2dc'}}>{parts.added}</mark></ins>}
            {parts.commonSuffix}
          </pre>
        </div>
      </div>
      <small>Dit is een letterlijke weergave van één verwijderd en één toegevoegd tekstregel.
        Cijfers, bedragen en afspraken worden niet automatisch geïnterpreteerd.</small>
    </details>
  );
}
