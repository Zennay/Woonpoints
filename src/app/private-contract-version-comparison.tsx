'use client';

import {useState} from 'react';

type DiffLine = {kind: 'same' | 'removed' | 'added'; text: string; oldLine: number | null; newLine: number | null};
type DiffPreview = {source: string; lines: DiffLine[]; additions: number; removals: number; unchanged: number};

const MAX_CHARS = 8000;
const MAX_LINES = 80;

function contractLines(value: string): string[] {
  const normalized = value.replace(/\r\n?/g, '\n');
  const result = normalized.split('\n');
  if (result[result.length - 1] === '') result.pop();
  return result;
}

/** Bounded longest-common-subsequence diff, preserving order and original text.
 * Never infer legal significance or hide edits behind a similarity threshold. */
function compareContractText(before: string, after: string): DiffLine[] | null {
  if (!before.trim() || !after.trim() ||
      before.length > MAX_CHARS || after.length > MAX_CHARS) return null;
  const oldLines = contractLines(before);
  const newLines = contractLines(after);
  if (!oldLines.length || !newLines.length ||
      oldLines.length > MAX_LINES || newLines.length > MAX_LINES) return null;

  const dp: number[][] = Array.from({length: oldLines.length + 1},
    () => Array<number>(newLines.length + 1).fill(0));
  for (let a = oldLines.length - 1; a >= 0; a--) {
    for (let b = newLines.length - 1; b >= 0; b--) {
      dp[a][b] = oldLines[a] === newLines[b] ? 1 + dp[a + 1][b + 1]
        : Math.max(dp[a + 1][b], dp[a][b + 1]);
    }
  }
  const result: DiffLine[] = [];
  let a = 0, b = 0;
  while (a < oldLines.length || b < newLines.length) {
    if (a < oldLines.length && b < newLines.length &&
        oldLines[a] === newLines[b]) {
      result.push({kind: 'same', text: oldLines[a], oldLine: a + 1, newLine: b + 1});
      a++; b++;
    } else if (a < oldLines.length &&
        (b === newLines.length || dp[a + 1][b] >= dp[a][b + 1])) {
      result.push({kind: 'removed', text: oldLines[a], oldLine: a + 1, newLine: null});
      a++;
    } else {
      result.push({kind: 'added', text: newLines[b], oldLine: null, newLine: b + 1});
      b++;
    }
  }
  return result;
}

export function PrivateContractVersionComparison() {
  const [earlier, setEarlier] = useState('');
  const [newer, setNewer] = useState('');
  const [diff, setDiff] = useState<DiffPreview | null>(null);
  const [includeQuotes, setIncludeQuotes] = useState(false);
  const [filePreview, setFilePreview] = useState<{source: string; text: string} | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [notice, setNotice] = useState('');
  const source = JSON.stringify([earlier, newer]);
  const current = diff?.source === source ? diff : null;
  const previewKey = JSON.stringify([source, includeQuotes]);

  function invalidate() {
    setDiff(null);
    setFilePreview(null);
    setConfirmSave(false);
    setNotice('');
  }
  function compare() {
    const rows = compareContractText(earlier, newer);
    if (!rows) {
      setDiff(null);
      setNotice('Voeg twee niet-lege teksten toe (maximaal 8.000 tekens en 80 regels elk).');
      return;
    }
    setDiff({
      source,
      lines: rows,
      additions: rows.filter(row => row.kind === 'added').length,
      removals: rows.filter(row => row.kind === 'removed').length,
      unchanged: rows.filter(row => row.kind === 'same').length
    });
    setFilePreview(null);
    setConfirmSave(false);
    setNotice('Vergelijking alleen in dit tabblad gemaakt. Geen juridische beoordeling.');
  }
  function prepareReport() {
    if (!current) return;
    const report = [
      'MIJN EIGEN CONTRACTVERSIES · WIJZIGINGSOVERZICHT', '',
      'Concept van zelf ingevoerde teksten. Geen juridische toets, documentverificatie of ondertekening.',
      'Een gewijzigde regel kan uit een verwijdering plus een toevoeging bestaan.',
      'Dit overzicht bewijst niet dat alle juridische wijzigingen zijn herkend.',
      '',
      'Toegevoegde regels: ' + current.additions,
      'Verwijderde regels: ' + current.removals,
      'Identieke regels: ' + current.unchanged,
      '',
      includeQuotes ? 'LET OP: DEZE VERSIE BEVAT TEKST UIT JE CONTRACT.' :
        'Contractinhoud weggelaten; alleen soort wijziging en regelnummer.',
      '',
      ...current.lines.filter(row => row.kind !== 'same').flatMap(row => [
        (row.kind === 'added' ? 'TOEGEVOEGD: nieuwe regel ' + row.newLine :
          'VERWIJDERD: oude regel ' + row.oldLine),
        ...(includeQuotes ? [row.text] : []),
        ''
      ]),
      'Controleer altijd beide originele documenten naast elkaar.',
      'Woonpoints heeft niemand gecontacteerd en niets geüpload, bewaard of geaccepteerd.'
    ].join('\n') + '\n';
    setFilePreview({source: previewKey, text: report});
    setConfirmSave(false);
    setNotice('Lees de volledige TXT-preview. De download gebeurt alleen na jouw aparte toestemming.');
  }
  function saveReport() {
    if (!current || !filePreview || filePreview.source !== previewKey || !confirmSave) {
      setFilePreview(null);
      setConfirmSave(false);
      setNotice('De inhoud is gewijzigd of nog niet bevestigd; maak eerst een nieuwe preview.');
      return;
    }
    const url = URL.createObjectURL(
      new Blob([filePreview.text], {type: 'text/plain;charset=utf-8'}));
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mijn-contractversies-wijzigingen.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setConfirmSave(false);
      setNotice('TXT aangeboden aan je browser. Controleer zelf de opslaglocatie en eventuele gedeelde inhoud.');
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }
  const layout = {display: 'grid', gap: 12, gridTemplateColumns:
    'repeat(auto-fit,minmax(260px,1fr))'} as const;
  return (
    <section className="panel" id="private-contract-version-diff-heading"
      aria-labelledby="private-contract-version-diff-title">
      <p className="eyebrow">TWEE CONCEPTEN · ALLEEN IN DIT TABBLAD</p>
      <h2 id="private-contract-version-diff-title">Mijn huurcontractversies naast elkaar</h2>
      <p>
        Plak een oudere en een nieuwere tekstversie. Deze lokale vergelijking toont exacte
        toegevoegde en verwijderde regels. Ook een kleine aanpassing binnen één regel
        verschijnt als oude én nieuwe regel. Dit is geen juridische controle en geen bewijs
        van volledigheid. Vergelijk de officiële documenten altijd zelf.
      </p>
      <div style={layout}>
        <label style={{display: 'grid', gap: 8}}>
          <strong>Oudere concepttekst</strong>
          <textarea value={earlier} rows={9} maxLength={MAX_CHARS}
            placeholder="Plak hier tekst uit de oudere conceptversie"
            onChange={event => { setEarlier(event.target.value); invalidate(); }}
          />
          <small>{earlier.length}/{MAX_CHARS} tekens · {contractLines(earlier).length} regels</small>
        </label>
        <label style={{display: 'grid', gap: 8}}>
          <strong>Nieuwere concepttekst</strong>
          <textarea value={newer} rows={9} maxLength={MAX_CHARS}
            placeholder="Plak hier dezelfde onderdelen uit het nieuwste concept"
            onChange={event => { setNewer(event.target.value); invalidate(); }}
          />
          <small>{newer.length}/{MAX_CHARS} tekens · {contractLines(newer).length} regels</small>
        </label>
      </div>
      <div style={{display:'flex', gap:12, flexWrap:'wrap', marginTop:12}}>
        <button type="button" onClick={compare}
          disabled={!earlier.trim() || !newer.trim() ||
            contractLines(earlier).length > MAX_LINES ||
            contractLines(newer).length > MAX_LINES}>
          Vergelijk mijn twee teksten lokaal
        </button>
        <button type="button" onClick={() => {
          if (!window.confirm('Beide ingevoerde contractconcepten en previews uit dit tabblad wissen?')) return;
          setEarlier(''); setNewer(''); invalidate();
          setNotice('Beide tijdelijke teksten gewist uit deze vergelijker.');
        }}>Wis mijn beide teksten</button>
      </div>
      {current && <div style={{marginTop:18}}>
        <h3>Exacte regelwijzigingen</h3>
        <p aria-live="polite"><strong>{current.additions} toegevoegd · {current.removals} verwijderd
          · {current.unchanged} identiek.</strong> Dit telt regels, niet juridische clausules.</p>
        <div role="region" aria-label="Resultaat van de lokale tekstvergelijking"
          style={{maxHeight:380, overflowY:'auto', overflowWrap:'anywhere'}}>
          {current.lines.map((row, index) => (
            <div key={index} style={{borderBottom:'1px solid #d2dcd7',padding:'8px 10px'}}>
              <strong>{row.kind === 'same' ? 'Ongewijzigd' :
                row.kind === 'removed' ? '− Uit oudere versie' : '+ In nieuwere versie'}
                {' · '}
                {row.kind === 'added' ? 'nieuw ' + row.newLine :
                  'oud ' + row.oldLine}
              </strong>
              <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'4px 0 0'}}>
                {row.text || '(lege regel)'}
              </pre>
            </div>
          ))}
        </div>
        <p><small>De lijst is een letterlijke tekstvergelijking. Een verschoven identieke
          regel kan elders terugkomen; een andere regelindeling kan extra verschillen tonen.
          Lees de volledige contracten ook naast elkaar.</small></p>
        <h3>Mijn wijzigingslijst bewaren</h3>
        <label style={{display:'flex',gap:8,alignItems:'start'}}>
          <input type="checkbox" checked={includeQuotes}
            onChange={event => {
              setIncludeQuotes(event.target.checked);
              setFilePreview(null); setConfirmSave(false); setNotice('');
            }}/>
          <span>Neem ook de gewijzigde contractregels letterlijk op in mijn TXT.
            Dit kan persoonsgegevens en gevoelige afspraken bevatten.
            Standaard worden die teksten <strong>niet</strong> geëxporteerd.</span>
        </label>
        <button type="button" style={{marginTop:12}} disabled={!current.additions && !current.removals}
          onClick={prepareReport}>Bekijk mijn volledige wijzigingsrapport</button>
        {filePreview?.source === previewKey && <div style={{marginTop:12}}>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:300,overflowY:'auto',
            padding:14,background:'#f2f6f2',borderRadius:10}}>{filePreview.text}</pre>
          <label style={{display:'flex',gap:8,alignItems:'start',marginBottom:10}}>
            <input type="checkbox" checked={confirmSave}
              onChange={event => setConfirmSave(event.target.checked)}/>
            <span>Ik heb de volledige rapporttekst bekeken en bepaal zelf of ik dit bestand opsla.</span>
          </label>
          <button type="button" disabled={!confirmSave} onClick={saveReport}>
            Download uitsluitend mijn bekeken TXT
          </button>
        </div>}
      </div>}
      {notice && <p role="status" aria-live="polite">{notice}</p>}
      <p><small>Deze functie gebruikt uitsluitend tijdelijk tabbladgeheugen.
        Geen account, upload, contractacceptatie, AI-samenvatting, automatische opslag
        of contact met een verhuurder. Sluiten of verversen wist de invoer van dit onderdeel;
        een eerder gedownload TXT-bestand blijft onder jouw eigen beheer.</small></p>
    </section>
  );
}
