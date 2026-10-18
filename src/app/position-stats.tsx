'use client';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import ManualMonthProgress from './manual-month-progress';
import { localMonthKey, MANUAL_MONTHLY_GOAL } from '../lib/manual-month-progress.mjs';
import { MAX_MANUAL_HOMES, normalizeHousingPreferences, normalizeManualHome, rankManualHomes,
  encodeHousingShortlist, decodeHousingShortlist, compareTwoManualHomes,
  exportManualHousingDecisionNote } from '../lib/position-statistics.mjs';
import { summarizePositionPairs, summarizeManualPositionHistory, exportManualPositionHistoryCsv, importManualPositionHistoryCsv, summarizeManualReactionJournal, exportManualReactionJournalCsv, importManualReactionJournalCsv, formatPositionPercentile } from '../lib/position-statistics.mjs';

/** Ephemeral local arithmetic only: not a WoningNet account connection. */
export default function PositionStats() {
  const [input, setInput] = useState('');
  let summary: ReturnType<typeof summarizePositionPairs> = null;
  let invalid = false;
  try { summary = summarizePositionPairs(input); }
  catch { invalid = true; } // Do not echo personal data in errors.
  const fmt = (n: number) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(n);
  return (
    <section className="panel position-stats" aria-labelledby="position-stats-heading">
      <div>
        <p className="eyebrow">ALLEEN OP DIT SCHERM</p>
        <h2 id="position-stats-heading">Posities handmatig analyseren</h2>
        <p>Voer per woning uitsluitend jouw eindpositie en het totaal aantal reacties in, bijvoorbeeld <code>12/150</code>.</p>
        <p><strong>Geen geverifieerde WoningNet-gegevens.</strong> Dit is een persoonlijke berekening, geen officiële registratie, ranglijst of kansvoorspelling.</p>
      </div>
      <div>
        <label htmlFor="position-pairs">Eén positie/totaal per regel (maximaal 50)</label>
        <textarea id="position-pairs" value={input} maxLength={4096} rows={5}
          placeholder={'12/150\n3/60'} autoComplete="off" spellCheck={false}
          onChange={event => setInput(event.target.value)} />
        <p>Niet opgeslagen. Geen adressen, namen, accountgegevens of wachtwoorden invoeren.</p>
        <button type="button" onClick={() => setInput('')} disabled={input.length === 0}>Wis invoer</button>
        {invalid && <p role="alert">Ongeldige positiegegevens. Gebruik maximaal 50 regels positie/totaal, met een positie tussen 1 en het totaal.</p>}
        <div aria-live="polite" aria-atomic="true">
          {!invalid && summary === null && <p>Geen posities ingevuld — uitkomst onbekend.</p>}
          {!invalid && summary !== null && (
            <div className="position-stats-results">
              <p><strong>{summary.sampleCount}</strong> handmatig ingevulde posities · bron onbevestigd</p>
              <dl>
                <div><dt>Gemiddelde eindpositie</dt><dd>{fmt(summary.averagePosition)}</dd></div>
                <div><dt>Mediaan</dt><dd>{fmt(summary.medianPosition)}</dd></div>
                <div><dt>Gemiddeld positiepercentiel</dt><dd>{formatPositionPercentile(summary.averagePercentile)}</dd></div>
              </dl>
              <p>Percentiel: exact 100% = telkens eerste, exact 0% = telkens laatste. Kleine afwijkingen bij de grenzen tonen we als &gt;99,9% of &lt;0,1%, niet als een exacte uiterste plaats. Per woning even zwaar meegewogen, geen voorspelling.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}



/** Browser-memory-only M1 monthly trend; never reads or writes an account. */
export function ManualPositionHistory({
  journalOffer, onJournalDecision
}: {
  journalOffer?: { data: string; count: number } | null;
  onJournalDecision?: () => void;
} = {}) {
  const [input, setInput] = useState('');
  const [pendingImport, setPendingImport] = useState<{ text: string; count: number } | null>(null);
  const [fileMessage, setFileMessage] = useState('');
  async function selectCsv(file: File | undefined) {
    if (!file) return;
    setPendingImport(null);
    setFileMessage('');
    if (file.size === 0 || file.size > 16384) {
      setFileMessage('Bestand geweigerd: selecteer een kleine geldige Woonpoints-CSV.');
      return;
    }
    try {
      const restored = importManualPositionHistoryCsv(await file.text());
      const sample = summarizeManualPositionHistory(restored);
      if (!sample) throw new TypeError('empty');
      setPendingImport({ text: restored, count: sample.sampleCount });
    } catch {
      setFileMessage('Bestand geweigerd: verkeerde indeling of ongeldige gegevens. Je huidige invoer is behouden.');
    }
  }
  function downloadCsv() {
    try {
      const csv = exportManualPositionHistoryCsv(input);
      const link = document.createElement('a');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      link.href = url;
      link.download = 'woonpoints-handmatige-maandposities.csv';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setFileMessage('CSV aangeboden om lokaal te bewaren. De gekozen opslaglocatie kan synchroniseren.');
    } catch {
      setFileMessage('Export niet beschikbaar: controleer eerst je handmatige posities.');
    }
  }
  let history: ReturnType<typeof summarizeManualPositionHistory> = null;
  let invalid = false;
  try {
    history = summarizeManualPositionHistory(input);
  } catch {
    invalid = true;
  }
  const format = (value: number) =>
    new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(value);
  const monthLabel = (month: string) => {
    const [year, number] = month.split('-').map(Number);
    return new Intl.DateTimeFormat('nl-NL', { month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(year, number - 1, 1)));
  };

  return (
    <section className="panel month-position-history" aria-labelledby="monthly-positions-heading">
      <div>
        <p className="eyebrow">PERSOONLIJKE MAANDHISTORIE · OFFLINE IN DIT TABBLAD</p>
        <h2 id="monthly-positions-heading">Hoe ontwikkelen je eindposities zich?</h2>
        <p>
          Voeg zelf de datum, je echte eindpositie en het totale aantal reacties
          per woning toe. Woonpoints groepeert deze notities per kalendermaand
          en toont het gemiddelde, de mediaan en het positiepercentiel.
        </p>
        <p>
          <strong>Geen live WoningNet-koppeling.</strong> Dit zijn alleen door jou getypte,
          niet-geverifieerde waarnemingen; percentages zijn geen kans op een woning,
          geen bevestiging van zoekpunten en geen officieel accountoverzicht.
        </p>
        <details>
          <summary>Wat betekent het positiepercentiel?</summary>
          <p>Een eerste plaats telt als 100%, de laatste als 0%. Elk ingevuld
          woningresultaat telt even zwaar. Een hogere maandwaarde beschrijft
          alleen deze handmatige steekproef; andere woningen, aantallen kandidaten
          of ontbrekende maanden kunnen het beeld veranderen.</p>
        </details>
      </div>

      <div>
        <label htmlFor="monthly-position-input">
          Per regel: JJJJ-MM-DD,positie/totaal (maximaal 120 resultaten)
        </label>
        <textarea
          id="monthly-position-input"
          value={input}
          onChange={event => setInput(event.target.value)}
          maxLength={8192}
          rows={7}
          spellCheck={false}
          autoComplete="off"
          placeholder={'2026-08-12,12/150\n2026-09-04,3/60\n2026-09-21,8/110'}
        />
        <p>Niet opgeslagen, niet verzonden. Vul geen adressen, namen,
          inloggegevens of andere persoonlijke informatie in.</p>
        {journalOffer && (
          <div className="month-csv-confirm" role="group" aria-label="Bevestig overdracht van reactiedagboek">
            <p>Je reactiedagboek biedt <strong>{journalOffer.count}</strong> zelf ingevoerde
              eindposities aan. Deze gegevens zijn niet officieel gecontroleerd.
              Overnemen vervangt de huidige maandgrafiek-invoer, maar wist het
              reactiedagboek niet.</p>
            <div className="month-history-actions">
              <button type="button" onClick={() => {
                setInput(journalOffer.data);
                setPendingImport(null);
                setFileMessage('Posities uit je eigen reactiedagboek overgenomen. Geen WoningNet-broncontrole.');
                onJournalDecision?.();
              }}>Gebruik in maandgrafiek</button>
              <button type="button" onClick={() => onJournalDecision?.()}>Behoud huidige grafiek</button>
            </div>
          </div>
        )}
        <div className="month-history-actions">
          <button type="button" onClick={() => {
            setInput('');
            setPendingImport(null);
            setFileMessage('');
          }} disabled={!input.length}>Wis maandhistorie</button>
          <button type="button" onClick={downloadCsv} disabled={invalid || !history}>
            Exporteer CSV…
          </button>
        </div>
        <label className="month-csv-picker" htmlFor="month-csv-input">
          Importeer eerder bewaarde maandhistorie (CSV, max. 16 KB)
        </label>
        <input type="file" id="month-csv-input" accept=".csv,text/csv"
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            void selectCsv(file);
          }} />
        {pendingImport && (
          <div className="month-csv-confirm" role="group" aria-label="Bevestig CSV-import">
            <p><strong>{pendingImport.count}</strong> geldige handmatige resultaten gevonden.
              Importeren vervangt alle huidige invoer in dit tabblad. Er wordt niets naar WoningNet verzonden.</p>
            <div className="month-history-actions">
              <button type="button" onClick={() => {
                setInput(pendingImport.text);
                setPendingImport(null);
                setFileMessage('CSV lokaal ingelezen. Nog steeds ongeverifieerde handmatige gegevens.');
              }}>Vervang huidige invoer</button>
              <button type="button" onClick={() => {
                setPendingImport(null);
                setFileMessage('Import geannuleerd: huidige invoer behouden.');
              }}>Annuleren</button>
            </div>
          </div>
        )}
        {fileMessage && <p role="status">{fileMessage}</p>}
        <p>CSV-export is uitsluitend op eigen verzoek. Een bestand op een
          cloudgesynchroniseerde locatie kan buiten Woonpoints terechtkomen.</p>
        <div aria-live="polite" aria-atomic="true">
          {invalid && (
            <p role="alert">Gebruik maximaal 120 geldige datum,positie/totaal-regels,
              verspreid over maximaal 24 maanden. De positie moet tussen 1 en
              het totale aantal reacties liggen.</p>
          )}
          {!invalid && !history && <p>Voer je eigen eindposities in om je maandgrafiek te zien.</p>}
          {!invalid && history && (
            <div className="month-position-results">
              <p><strong>{history.sampleCount}</strong> handmatig ingevulde resultaten ·
                <strong> {history.months.length}</strong> kalendermaanden · ongeverifieerd</p>
              <h3>Gemiddeld positiepercentiel per maand</h3>
              <div className="month-position-bars" aria-hidden="true">
                {history.months.map(entry => (
                  <div className="month-bar-column" key={entry.month}>
                    <span className="month-bar-value">{formatPositionPercentile(entry.averagePercentile)}</span>
                    <div className="month-bar-rail">
                      <span className="month-bar-fill"
                        style={{ height: `${Math.max(1, Math.min(100, entry.averagePercentile))}%` }} />
                    </div>
                    <span className="month-bar-label">{monthLabel(entry.month)}</span>
                  </div>
                ))}
              </div>
              <div className="month-history-table-wrap">
                <table>
                  <caption>Handmatige maandgegevens, per woning gelijk gewogen</caption>
                  <thead>
                    <tr><th scope="col">Maand</th><th scope="col">Woningen</th>
                      <th scope="col">Gem. positie</th><th scope="col">Mediaan</th>
                      <th scope="col">Positiepercentiel</th></tr>
                  </thead>
                  <tbody>
                    {history.months.map(entry => (
                      <tr key={entry.month}>
                        <th scope="row">{monthLabel(entry.month)}</th>
                        <td>{entry.sampleCount}</td>
                        <td>{format(entry.averagePosition)}</td>
                        <td>{format(entry.medianPosition)}</td>
                        <td>{formatPositionPercentile(entry.averagePercentile)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {history.changePercentilePoints !== null && (
                <p>Verschil met de vorige <em>ingevulde</em> maand:
                  <strong> {history.changePercentilePoints > 0 ? '+' : ''}
                    {format(history.changePercentilePoints)} procentpunt</strong>.
                  Ontbrekende maanden zijn niet geschat en dit is geen voorspelling.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


/**
 * A personal, unsigned notebook for manually observed housing reactions.
 * Neither this journal nor its counts can certify WoningNet search points.
 */
type JournalStatus = 'planned' | 'reacted' | 'closed' | 'invited' | 'withdrawn';
type JournalItem = {
  id: number; date: string; status: JournalStatus;
  rank: number | null; total: number | null;
};
const statusNames: Record<JournalStatus, string> = {
  planned: 'Van plan', reacted: 'Zelf gereageerd',
  closed: 'Afgesloten', invited: 'Uitgenodigd', withdrawn: 'Ingetrokken'
};

export type PrivatePointsSnapshot = {
  observations: number;
  last: {month:string;points:number}|null;
  previous: {month:string;points:number}|null;
};
export type PrivateMonthSnapshot = {
  month: string|null;
  count: number|null;
  storage: 'browser'|'temporary'|'unknown';
  previousNoteHeld: boolean;
};
export type PrivateJournalSnapshot = {
  month: string;
  total: number;
  reacted: number;
  other: number;
};
export type PrivateJournalCountOffer = {
  month: string;
  count: number;
  totalThisMonth: number;
};

/** Transfers only a voluntary aggregate; never source records or account data. */
export function ManualReactionJournal({
  onTransfer, onMonthCountOffer, onJournalSnapshot, reportMonth
}: {
  onTransfer?: (data: string, count: number) => void;
  onMonthCountOffer?: (offer: PrivateJournalCountOffer | null) => void;
  onJournalSnapshot?: (summary: PrivateJournalSnapshot) => void;
  reportMonth?: string;
} = {}) {
  const [entries, setEntries] = useState<JournalItem[]>([]);
  const [nextId, setNextId] = useState(1);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<JournalStatus>('planned');
  const [rankInput, setRankInput] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<JournalItem[] | null>(null);
  const [recentlyRemoved,setRecentlyRemoved] = useState<{item:JournalItem;index:number}|null>(null);
  const [confirmClearAll,setConfirmClearAll] = useState(false);
  const [editingId,setEditingId] = useState<number|null>(null);
  const [editDate,setEditDate] = useState('');
  const [editStatus,setEditStatus] = useState<JournalStatus>('planned');
  const [editRank,setEditRank] = useState('');
  const [editTotal,setEditTotal] = useState('');

  const journal = summarizeManualReactionJournal(entries);
  const visible = [...entries]
    .filter(row => monthFilter === 'all' || row.date.slice(0, 7) === monthFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const rowCount = journal.total;
  const currentJournalMonth = reportMonth ?? localMonthKey(new Date());
  const todayJournalDate = (() => {
    const now = new Date();
    return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),
      String(now.getDate()).padStart(2,'0')].join('-');
  })();
  const currentJournalEntries = entries.filter(item =>
    item.date.slice(0,7) === currentJournalMonth && item.date <= todayJournalDate);
  // Only the literal manually chosen "Zelf gereageerd" status counts. Invited,
  // closed, future, withdrawn and planned are never guessed as registrations.
  const journalReactedCount = currentJournalEntries.filter(item => item.status==='reacted').length;
  useEffect(() => {
    // A pending cross-panel proposal cannot survive a modification, restore
    // request or deletion in its original source journal.
    onMonthCountOffer?.(null);
  }, [entries,pendingImport,onMonthCountOffer]);
  useEffect(() => {
    if (!onJournalSnapshot) return;
    const now=new Date();
    const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),
      String(now.getDate()).padStart(2,'0')].join('-');
    const current=entries.filter(row=>row.date.slice(0,7)===currentJournalMonth &&
      row.date<=today);
    const reacted=current.filter(row=>row.status==='reacted').length;
    onJournalSnapshot({month:currentJournalMonth,total:current.length,
      reacted,other:current.length-reacted});
  }, [entries,currentJournalMonth,onJournalSnapshot]);

  function proposeMonthCount() {
    if (!onMonthCountOffer) return;
    const now = new Date();
    const localDate = [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),
      String(now.getDate()).padStart(2,'0')].join('-');
    const month = localMonthKey(now);
    const valid = entries.filter(item => item.date.slice(0,7) === month &&
      item.date <= localDate);
    const reacted=valid.filter(item=>item.status==='reacted').length;
    if (pendingImport || editingId !== null || !valid.length ||
        reacted>MANUAL_MONTHLY_GOAL || valid.length>100) {
      setMessage('Geen veilig voorstel: sluit eerst de editor/import of controleer je eigen maandnotities. Meer dan vier als gereageerd gemarkeerde notities worden nooit stilzwijgend afgeknipt.');
      return;
    }
    onMonthCountOffer({month,count:reacted,totalThisMonth:valid.length});
    setMessage('Eigen telling ter beoordeling aan de maandplanning aangeboden. Controleer daar de huidige stand en bevestig of annuleer afzonderlijk.');
    document.getElementById('manual-progress-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function add() {
    setMessage('');
    setConfirmClearAll(false);
    if (!date || entries.length >= 100 ||
        (rankInput === '') !== (totalInput === '') ||
        (rankInput !== '' && (!/^[1-9][0-9]{0,5}$/.test(rankInput) ||
                             !/^[1-9][0-9]{0,5}$/.test(totalInput)))) {
      setMessage('Controleer datum en optionele eindpositie/totaal (maximaal 100 notities).');
      return;
    }
    const next: JournalItem = {
      id: nextId, date, status,
      rank: rankInput ? Number(rankInput) : null,
      total: totalInput ? Number(totalInput) : null
    };
    try {
      summarizeManualReactionJournal([...entries, next]);
      setEntries(old => [...old, next]);
      setRecentlyRemoved(null); // Invalidate stale undo after a new journal entry.
      setNextId(n => n + 1);
      setRankInput('');
      setTotalInput('');
      setMessage('Eigen notitie toegevoegd. Niet gecontroleerd door WoningNet.');
    } catch {
      setMessage('Deze datum of eindpositie is ongeldig. Huidige notities zijn behouden.');
    }
  }


  function startEdit(item:JournalItem) {
    if (pendingImport) {
      setMessage('Rond eerst de openstaande CSV-import af voordat je een notitie bewerkt.');
      return;
    }
    setEditingId(item.id);setEditDate(item.date);setEditStatus(item.status);
    setEditRank(item.rank===null?'':String(item.rank));
    setEditTotal(item.total===null?'':String(item.total));
    setMessage('Bewerk de gegevens; je bestaande notitie verandert pas bij bevestigen.');
  }
  function cancelEdit() {
    setEditingId(null);
    setMessage('Bewerken geannuleerd. Alle oorspronkelijke notities behouden.');
  }
  function saveEdit() {
    const existing=entries.find(item=>item.id===editingId);
    if (!existing || pendingImport) {
      setMessage('Wijzigen niet mogelijk. Rond eerst de openstaande import af.');
      return;
    }
    if (!Object.hasOwn(statusNames,editStatus) ||
        (editRank==='')!==(editTotal==='') ||
        (editRank!=='' && (!/^[1-9][0-9]{0,5}$/.test(editRank) ||
                           !/^[1-9][0-9]{0,5}$/.test(editTotal)))) {
      setMessage('Onvolledige of ongeldige eindpositie. De oorspronkelijke notitie is behouden.');
      return;
    }
    const next:JournalItem={
      ...existing,date:editDate,status:editStatus,
      rank:editRank===''?null:Number(editRank),
      total:editTotal===''?null:Number(editTotal)
    };
    const candidate=entries.map(item=>item.id===existing.id?next:item);
    try {
      summarizeManualReactionJournal(candidate);
      setEntries(candidate);setEditingId(null);
      setConfirmClearAll(false);
      setMonthFilter('all'); // Reveal the corrected row if its date moved outside the old filter.
      setMessage('Je eigen datum, status en eindpositie zijn bijgewerkt. Dit verandert geen officiële woningreactie.');
    } catch {
      setMessage('Datum of eindpositie is ongeldig; de oorspronkelijke notitie is behouden.');
    }
  }


  function removeItem(item: JournalItem) {
    const index=entries.findIndex(row=>row.id===item.id);
    if (index<0) return;
    setRecentlyRemoved({item:{...item},index});
    setConfirmClearAll(false);
    setEntries(current=>current.filter(row=>row.id!==item.id));
    if (editingId===item.id) setEditingId(null);
    setMessage('Alleen deze eigen notitie verwijderd. Je kunt de laatste verwijdering hieronder herstellen.');
  }
  function undoRemoveItem() {
    if (!recentlyRemoved || pendingImport || entries.length>=100 ||
        entries.some(row=>row.id===recentlyRemoved.item.id)) return;
    const restored=[...entries];
    restored.splice(Math.min(recentlyRemoved.index,restored.length),0,{...recentlyRemoved.item});
    try {
      summarizeManualReactionJournal(restored);
      setEntries(restored);
      setRecentlyRemoved(null);
      setConfirmClearAll(false);
      setMessage('De laatste verwijderde eigen notitie is met dezelfde ID hersteld.');
    } catch {
      setMessage('Herstellen is niet veilig mogelijk. Je huidige notities blijven behouden.');
    }
  }

  function updateState(id: number, state: JournalStatus) {
    if (!Object.hasOwn(statusNames, state)) return;
    setEntries(old => old.map(row => row.id === id ? { ...row, status: state } : row));
    setConfirmClearAll(false);
    setMessage('Eigen status aangepast; dit is geen officiële registratiestatus.');
  }

  function proposePositions() {
    if (!onTransfer) return;
    const rows = entries.filter(entry => entry.rank !== null).map(
      entry => entry.date + ',' + entry.rank + '/' + entry.total
    );
    try {
      const data = rows.join('\n');
      if (!summarizeManualPositionHistory(data)) throw new TypeError('empty');
      onTransfer(data, rows.length);
      setMessage('Geldige eigen eindposities aangeboden aan de maandgrafiek; bevestig daar het vervangen.');
    } catch {
      setMessage('Niet alle handmatige eindposities zijn geldig; de grafiek is niet gewijzigd.');
    }
  }

  function download() {
    try {
      const csv = exportManualReactionJournalCsv(entries);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'woonpoints-eigen-reactienotities.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
      setMessage('CSV aangeboden. Externe bestandsopslag kan synchroniseren.');
    } catch {
      setMessage('Geen geldige reactienotities beschikbaar voor export.');
    }
  }

  async function prepareImport(file?: File) {
    setPendingImport(null);
    setEditingId(null);
    setConfirmClearAll(false);
    if (!file) return;
    if (!file.size || file.size > 12_000) {
      setMessage('Import geweigerd: kies een CSV kleiner dan 12 KB.');
      return;
    }
    try {
      const restored = importManualReactionJournalCsv(await file.text());
      setPendingImport(restored.map((row, index) => ({
        ...row, id: index + 1, status: row.status as JournalStatus
      })));
      setMessage('Import gecontroleerd. Bevestig apart of je huidige notities wilt vervangen.');
    } catch {
      setMessage('Import geweigerd: onbekend of beschadigd CSV-bestand; invoer onveranderd.');
    }
  }

  return (
    <section className="panel reaction-journal" aria-labelledby="reaction-journal-title">
      <div>
        <p className="eyebrow">EIGEN REACTIEDAGBOEK · HANDMATIG</p>
        <h2 id="reaction-journal-title">Houd je woningreacties bij</h2>
        <p>Schrijf zelf op wanneer je een woning overweegt, hebt gereageerd,
          een uitnodiging kreeg of een reactie afsloot. Het dagboek koppelt niet
          aan een woningaanbieder en voert geen reacties uit.</p>
        <p><strong>Alle aantallen zijn eigen notities, nooit geverifieerde zoekpunten.</strong>
          Dit scherm weet niet welke reacties officieel meetellen voor jouw maanddoel.
          Noteer geen adressen, persoonsgegevens, wachtwoorden of accountcodes.</p>
        <p>Je gegevens blijven in dit tabblad zolang je het openhoudt.
          Wil je ze bewaren? Kies zelf CSV-export. Bestanden op cloudopslag
          kunnen buiten Woonpoints worden gesynchroniseerd.</p>
      </div>
      <div>
        <fieldset className="journal-entry-form">
          <legend>Nieuwe eigen notitie</legend>
          <label htmlFor="journal-date">Datum van jouw notitie</label>
          <input id="journal-date" type="date" min="2000-01-01" max="2099-12-31"
            value={date} onChange={e => setDate(e.target.value)} />
          <label htmlFor="journal-status">Eigen status</label>
          <select id="journal-status" value={status}
            onChange={e => setStatus(e.target.value as JournalStatus)}>
            {Object.entries(statusNames).map(([value, label]) =>
              <option key={value} value={value}>{label}</option>)}
          </select>
          <p>Eindpositie is optioneel en alleen bedoeld voor afgeronde, zelf geobserveerde reacties.</p>
          <div className="journal-ranks">
            <div>
              <label htmlFor="journal-rank">Eindpositie (optioneel)</label>
              <input id="journal-rank" inputMode="numeric" value={rankInput} maxLength={6}
                onChange={e => setRankInput(e.target.value)} placeholder="12" />
            </div>
            <div>
              <label htmlFor="journal-total">Totaal reacties (optioneel)</label>
              <input id="journal-total" inputMode="numeric" value={totalInput} maxLength={6}
                onChange={e => setTotalInput(e.target.value)} placeholder="150" />
            </div>
          </div>
          <button type="button" onClick={add} disabled={entries.length >= 100}>
            Voeg eigen notitie toe
          </button>
        </fieldset>
        <div className="journal-toolbar">
          <button type="button" onClick={download} disabled={!entries.length}>Bewaar als CSV…</button>
          <label htmlFor="journal-import">Importeer eigen CSV (maximaal 12 KB)</label>
          <input id="journal-import" type="file" accept=".csv,text/csv"
            onChange={e => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              void prepareImport(file);
            }} />
        </div>
        {pendingImport && (
          <div className="journal-confirm" role="group" aria-label="Bevestig import">
            <p>Je CSV bevat {pendingImport.length} eigen notities.
              Vervangen verwijdert de huidige {entries.length} notities uit dit tabblad.</p>
            <button type="button" onClick={() => {
              setEntries(pendingImport);
              setRecentlyRemoved(null);
              setConfirmClearAll(false);
              setNextId(pendingImport.length + 1);
              setPendingImport(null);
              setMonthFilter('all');
              setMessage('Eigen notities lokaal vervangen; niet geverifieerd door WoningNet.');
            }}>Vervang huidige notities</button>
            <button type="button" onClick={() => {
              setPendingImport(null); setMessage('Import geannuleerd; notities behouden.');
            }}>Annuleren</button>
          </div>
        )}
        {message && <p role="status">{message}</p>}
        {recentlyRemoved && <div className="journal-confirm" role="group"
          aria-label="Herstel laatste verwijderde notitie">
          <p>Je verwijderde zojuist eigen notitie #{recentlyRemoved.item.id}
            ({recentlyRemoved.item.date}, {statusNames[recentlyRemoved.item.status]}).
            Alleen de meest recente verwijdering kan hier worden hersteld;
            invoer blijft uitsluitend in dit tabblad.</p>
          <button type="button" disabled={Boolean(pendingImport) || entries.length>=100}
            onClick={undoRemoveItem}>Herstel laatste verwijderde notitie</button>
          <button type="button" className="secondary" onClick={()=>{
            setRecentlyRemoved(null);
            setMessage('Herstelmogelijkheid voor de laatste verwijdering bewust gesloten.');
          }}>Niet herstellen</button>
        </div>}
        <p><strong>{rowCount}</strong> eigen notities · <strong>{journal.recordedPositions}</strong> met
          zelf ingevoerde eindpositie. Nul officiële reacties geverifieerd.</p>
        {onMonthCountOffer && <div className="journal-confirm">
          <h3>Stel zelf een maandstand voor op basis van je dagboek</h3>
          <p>Deze maand tot vandaag: <strong>{currentJournalEntries.length}</strong> eigen
            notities, waarvan <strong>{journalReactedCount}</strong> letterlijk
            'Zelf gereageerd'. Andere statussen en toekomstige datums tellen
            bewust niet mee. Het dagboek kan onvolledig of dubbel ingevuld zijn;
            dit is geen officiële bevestiging of geldig zoekpuntenbewijs.</p>
          {journalReactedCount > MANUAL_MONTHLY_GOAL && <p role="alert">
            Meer dan {MANUAL_MONTHLY_GOAL} notities met status 'Zelf gereageerd'.
            Controleer ze zelf; Woonpoints kapt niets automatisch af.</p>}
          <button type="button" disabled={!currentJournalEntries.length ||
              journalReactedCount>MANUAL_MONTHLY_GOAL || Boolean(pendingImport) || editingId!==null}
            onClick={proposeMonthCount}>Bied eigen maandtelling ter controle aan ↑</button>
          <p>Je bestaande maandstand verandert pas na een tweede expliciete
            bevestiging bovenaan. Een eigen reactie is niet noodzakelijk een
            geldige geregistreerde WoningNet-reactie.</p>
        </div>}
        {onTransfer && journal.recordedPositions > 0 && (
          <button type="button" onClick={proposePositions}>
            Toon genoteerde eindposities in maandgrafiek
          </button>
        )}
        {!!journal.months.length && (
          <div className="journal-monthly">
            <h3>Overzicht per ingevulde maand</h3>
            <div className="month-history-table-wrap">
              <table>
                <caption>Persoonlijke notities, zonder officiële registratiecontrole</caption>
                <thead><tr>
                  <th scope="col">Maand</th><th scope="col">Totaal</th>
                  <th scope="col">Zelf gereageerd</th><th scope="col">Uitgenodigd</th>
                  <th scope="col">Positie bekend</th>
                </tr></thead>
                <tbody>{journal.months.map(row => <tr key={row.month}>
                  <th scope="row">{row.month}</th><td>{row.total}</td>
                  <td>{row.counts.reacted}</td><td>{row.counts.invited}</td>
                  <td>{row.recordedPositions}</td>
                </tr>)}</tbody>
              </table>
            </div>
          </div>
        )}
        {!!entries.length && (
          <>
            <label htmlFor="journal-filter">Toon reacties uit maand</label>
            <select id="journal-filter" value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}>
              <option value="all">Alle ingevulde maanden</option>
              {journal.months.map(row =>
                <option key={row.month} value={row.month}>{row.month}</option>)}
            </select>
            <div className="journal-items">
              {visible.map(row => <article key={row.id} className="journal-row">
                <div><strong>Eigen notitie #{row.id}</strong> · <time dateTime={row.date}>{row.date}</time>
                  {row.rank !== null &&
                    <p>Zelf genoteerde eindpositie: {row.rank}/{row.total}</p>}
                </div>
                <label htmlFor={`journal-item-${row.id}`}>Wijzig eigen status</label>
                <select id={`journal-item-${row.id}`} value={row.status}
                  disabled={editingId===row.id || Boolean(pendingImport)}
                  onChange={e => updateState(row.id, e.target.value as JournalStatus)}>
                  {Object.entries(statusNames).map(([value, label]) =>
                    <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="button" className="secondary"
                  disabled={Boolean(pendingImport)}
                  onClick={() => startEdit(row)}>
                  {editingId===row.id ? 'Bewerken actief' : 'Bewerk datum en eindpositie'}
                </button>
                {editingId===row.id && <fieldset className="journal-entry-form">
                  <legend>Pas alleen deze eigen notitie #{row.id} aan</legend>
                  <p>Totdat je bewaart, blijven de oorspronkelijke gegevens staan.</p>
                  <label htmlFor={`journal-edit-date-${row.id}`}>Datum van de notitie</label>
                  <input id={`journal-edit-date-${row.id}`} type="date"
                    min="2000-01-01" max="2099-12-31" value={editDate}
                    onChange={e => setEditDate(e.target.value)} />
                  <label htmlFor={`journal-edit-status-${row.id}`}>Eigen status</label>
                  <select id={`journal-edit-status-${row.id}`} value={editStatus}
                    onChange={e => setEditStatus(e.target.value as JournalStatus)}>
                    {Object.entries(statusNames).map(([value,label]) =>
                      <option key={value} value={value}>{label}</option>)}
                  </select>
                  <label htmlFor={`journal-edit-rank-${row.id}`}>Eindpositie (optioneel)</label>
                  <input id={`journal-edit-rank-${row.id}`} inputMode="numeric"
                    maxLength={6} value={editRank} placeholder="12"
                    onChange={e => setEditRank(e.target.value)} />
                  <label htmlFor={`journal-edit-total-${row.id}`}>Totaal reacties (optioneel)</label>
                  <input id={`journal-edit-total-${row.id}`} inputMode="numeric"
                    maxLength={6} value={editTotal} placeholder="150"
                    onChange={e => setEditTotal(e.target.value)} />
                  <div className="month-history-actions">
                    <button type="button" onClick={saveEdit}>Bewaar deze notitie</button>
                    <button type="button" onClick={cancelEdit}>Annuleer bewerken</button>
                  </div>
                </fieldset>}
                <button type="button" onClick={() => removeItem(row)}>
                  Verwijder (herstelbaar)
                </button>
              </article>)}
              {!visible.length && <p>Geen eigen notities voor deze maand.</p>}
            </div>
            <button type="button" onClick={() => setConfirmClearAll(true)}>
              Wis alle eigen notities…
            </button>
            {confirmClearAll && <div className="journal-confirm" role="group"
              aria-label="Bevestig alle eigen reactienotities wissen">
              <p><strong>Alle {entries.length} notities wissen?</strong> Dit
                verwijdert de eigen datums, statussen en eindposities uit dit
                tabblad. Er is geen automatische reservekopie en de actie is
                niet ongedaan te maken. Bewaar eventueel eerst bewust je CSV.</p>
              <button type="button" onClick={()=>{
                setEntries([]);
                setPendingImport(null);
                setEditingId(null);
                setRecentlyRemoved(null);
                setConfirmClearAll(false);
                setMonthFilter('all');
                setMessage('Alle eigen notities na bevestiging gewist. Er is niets op WoningNet gewijzigd.');
              }}>Ja, wis echt alle notities</button>
              <button type="button" onClick={()=>{
                setConfirmClearAll(false);
                setMessage('Alles wissen geannuleerd; je notities zijn behouden.');
              }}>Nee, behoud alle notities</button>
            </div>}
          </>
        )}
      </div>
    </section>
  );
}


/** Shared browser-memory-only handoff. No hidden cross-tab persistence/API. */
export function ManualPositionsWorkspace({
  onMonthCountOffer,onJournalSnapshot,reportMonth
}: {
  onMonthCountOffer?: (offer: PrivateJournalCountOffer|null)=>void;
  onJournalSnapshot?: (summary: PrivateJournalSnapshot)=>void;
  reportMonth?: string;
} = {}) {
  const [offer, setOffer] = useState<{ data: string; count: number } | null>(null);
  return (
    <>
      <ManualReactionJournal onTransfer={(data, count) => setOffer({ data, count })}
        onMonthCountOffer={onMonthCountOffer}
        onJournalSnapshot={onJournalSnapshot} reportMonth={reportMonth} />
      <ManualPositionHistory journalOffer={offer} onJournalDecision={() => setOffer(null)} />
    </>
  );
}


/** Reviewed-context, local-only housing shortlist panel. */
type Home = {label: string; rent: number; rooms: number; travel: number; balcony: boolean};
type Preferences = {maxRent: number; minRooms: number; maxTravel: number; preferBalcony: boolean};
const defaults: Preferences = {maxRent: 1000, minRooms: 2, maxTravel: 45, preferBalcony: false};
const emptyHousing = {label: '', rent: '', rooms: '2', travel: '30', balcony: false};
const number = (s: string) => s.trim() === '' ? NaN : Number(s);

export function ManualHousingShortlist({onCostPrefill, onPlanPrefill, onViewingPrefill, onMovePrefill}: {
  onCostPrefill?: (selected: [Home, Home], preferences: Preferences) => void;
  onPlanPrefill?: (selected: Home) => void;
  onViewingPrefill?: (selected: [Home, Home]) => void;
  onMovePrefill?: (selected: Home) => void;
} = {}) {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [draft, setDraft] = useState(emptyHousing);
  const [homes, setHomes] = useState<Home[]>([]);
  const [notice, setNotice] = useState('');
  const [pendingImport, setPendingImport] = useState<{preferences: Preferences; homes: Home[]} | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [compared, setCompared] = useState<number[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState(emptyHousing);
  const [removedHome, setRemovedHome] = useState<{index: number; home: Home} | null>(null);
  const validPreferences = normalizeHousingPreferences(preferences) as Preferences | null;
  const ranked = validPreferences ? rankManualHomes(homes, validPreferences) : null;
  const eligible = ranked?.filter((row: {suitable: boolean}) => row.suitable).length ?? 0;
  const comparison = validPreferences ? compareTwoManualHomes(homes, validPreferences, compared) : null;

  function addHome(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (homes.length >= MAX_MANUAL_HOMES) {
      setNotice('Maximaal twaalf zelf ingevoerde woningen. Verwijder er eerst een.');
      return;
    }
    const entered = normalizeManualHome({
      label: draft.label.trim(), rent: number(draft.rent),
      rooms: number(draft.rooms), travel: number(draft.travel), balcony: draft.balcony
    }) as Home | null;
    if (!entered) {
      setNotice('Vul een label van maximaal 64 tekens, huur €100–€10.000, 1–20 kamers en 0–300 reistijdminuten in.');
      return;
    }
    setHomes(current => [...current, entered]);
    setRemovedHome(null);
    setDraft(emptyHousing);
    setNotice('Woning toegevoegd aan je privévergelijking; er is niets online gecontroleerd.');
  }

  function editHome(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingIndex === null || editingIndex < 0 || editingIndex >= homes.length) {
      setEditingIndex(null);
      setNotice('De woning is veranderd; open het bewerkformulier opnieuw.');
      return;
    }
    const updated = normalizeManualHome({
      label: editDraft.label.trim(),
      rent: number(editDraft.rent),
      rooms: number(editDraft.rooms),
      travel: number(editDraft.travel),
      balcony: editDraft.balcony
    }) as Home | null;
    if (!updated) {
      setNotice('Wijziging niet opgeslagen: gebruik een geldig label, €100–€10.000, 1–20 kamers en 0–300 minuten.');
      return;
    }
    setHomes(current => current.map((home, index) => index === editingIndex ? updated : home));
    setEditingIndex(null);
    setRemovedHome(null);
    setNotice('Eigen woninggegevens aangepast; de rangorde is opnieuw berekend.');
  }

  function undoRemove() {
    if (!removedHome || homes.length >= MAX_MANUAL_HOMES) return;
    const snapshot = removedHome;
    setHomes(current => {
      const restored = [...current];
      restored.splice(Math.min(snapshot.index, restored.length), 0, snapshot.home);
      return restored;
    });
    setCompared([]);
    setEditingIndex(null);
    setRemovedHome(null);
    setNotice('Laatst verwijderde woning teruggezet; niet online gecontroleerd.');
  }

  function exportJson() {
    const json = encodeHousingShortlist(preferences, homes);
    if (!json) {
      setNotice('Kan deze selectie niet veilig opslaan. Controleer je voorkeuren en woningen.');
      return;
    }
    const url = URL.createObjectURL(new Blob([json], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-prive-woningen.json';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotice('JSON aangeboden voor jouw eigen archief. De gekozen bestandsprovider kan synchroniseren.');
  }

  function exportDecisionNote() {
    const brief = exportManualHousingDecisionNote(homes, preferences, compared);
    if (!brief) {
      setNotice('Kies eerst twee geldige woningen om een eigen beslisnotitie op te slaan.');
      return;
    }
    const url = URL.createObjectURL(new Blob([brief], {type: 'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = 'woonpoints-eigen-woningafweging.txt'; link.rel = 'noopener';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotice('Eigen beslisnotitie aangeboden. Zelf gekozen bestandsproviders kunnen synchroniseren.');
  }

  async function selectJson(file: File | undefined) {
    setPendingImport(null);
    if (!file) return;
    if (file.size < 1 || file.size > 16384) {
      setNotice('Bestand geweigerd: gebruik een Woonpoints-JSON van maximaal 16 KB.');
      return;
    }
    try {
      const raw = await file.text();
      const incoming = decodeHousingShortlist(raw) as {preferences: Preferences; homes: Home[]} | null;
      if (!incoming) throw new Error('invalid');
      setPendingImport(incoming);
      setNotice('Geldig privébestand. Bevestig apart of je de huidige vergelijking wilt vervangen.');
    } catch {
      setNotice('Bestand geweigerd: onjuist formaat of ongeldige gegevens. Je huidige kandidaten zijn behouden.');
    }
  }

  return (
    <section className="panel housing-shortlist" aria-labelledby="housing-shortlist-heading">
      <div>
        <p className="eyebrow">EIGEN WONINGVERGELIJKING · NIET GEKOPPELD</p>
        <h2 id="housing-shortlist-heading">Welke woningen passen bij jouw wensen?</h2>
        <p>Vergelijk tot twaalf woningen die je <strong>zelf</strong> invoert. Stel drie harde grenzen in.
          Binnen die grenzen geeft een doorzichtige puntentelling aan welke combinatie jij het beste vindt.</p>
        <p><strong>Geen WoningNet-import of woningkans.</strong> Geen beschikbaarheid,
          inkomenstoets, toewijzingsregels of echte huurprijzen zijn geverifieerd.
          Vul geen straatadressen, naam, accountgegevens of contactinformatie in.</p>
        <fieldset className="housing-prefs">
          <legend>Mijn voorkeuren (privé in dit tabblad)</legend>
          <label htmlFor="hs-budget">Maximale maandhuur in euro</label>
          <input id="hs-budget" type="number" min="100" max="10000" step="1"
            value={preferences.maxRent} onChange={event => setPreferences(p => ({...p, maxRent: number(event.target.value)}))} />
          <label htmlFor="hs-rooms">Minimaal aantal kamers</label>
          <input id="hs-rooms" type="number" min="1" max="20" step="1"
            value={preferences.minRooms} onChange={event => setPreferences(p => ({...p, minRooms: number(event.target.value)}))} />
          <label htmlFor="hs-travel">Maximale reistijd in minuten</label>
          <input id="hs-travel" type="number" min="1" max="300" step="1"
            value={preferences.maxTravel} onChange={event => setPreferences(p => ({...p, maxTravel: number(event.target.value)}))} />
          <label className="housing-check"><input type="checkbox" checked={preferences.preferBalcony}
            onChange={event => setPreferences(p => ({...p, preferBalcony: event.target.checked}))} />
            Balkon geeft bij gelijke geschiktheid tien bonuspunten</label>
        </fieldset>
        {!validPreferences && <p role="alert">Controleer je voorkeuren: huur €100–€10.000, minimaal 1–20 kamers, reistijd 1–300 minuten.</p>}
        <details>
          <summary>Hoe worden woningen gerangschikt?</summary>
          <p>Huur boven je maximum, te weinig kamers of te lange reistijd betekent <strong>past niet</strong>.
            Passende woningen krijgen maximaal 40 punten voor huurruimte, 35 voor reistijdruimte,
            15 voor extra kamers en 10 voor balkon wanneer je dat wenst. Meer punten betekent
            alleen een hogere <em>persoonlijke volgorde</em>, nooit meer kans op toewijzing.</p>
        </details>
      </div>

      <div>
        <form onSubmit={addHome} className="housing-form">
          <fieldset>
            <legend>Voeg handmatig een woning toe ({homes.length}/{MAX_MANUAL_HOMES})</legend>
            <label htmlFor="hs-label">Neutraal eigen label (geen adres)</label>
            <input id="hs-label" required maxLength={64} autoComplete="off" value={draft.label}
              placeholder="Bijv. woning A" onChange={event => setDraft(d => ({...d, label: event.target.value}))} />
            <div className="housing-fields">
              <div><label htmlFor="hs-rent">Maandhuur (€)</label><input id="hs-rent" type="number" min="100" max="10000" step="1"
                required value={draft.rent} onChange={event => setDraft(d => ({...d, rent: event.target.value}))} /></div>
              <div><label htmlFor="hs-count">Kamers</label><input id="hs-count" type="number" min="1" max="20" step="1"
                required value={draft.rooms} onChange={event => setDraft(d => ({...d, rooms: event.target.value}))} /></div>
              <div><label htmlFor="hs-minutes">Zelf geschatte reistijd (min)</label>
                <input id="hs-minutes" type="number" min="0" max="300" step="1" required value={draft.travel}
                  onChange={event => setDraft(d => ({...d, travel: event.target.value}))} /></div>
            </div>
            <label className="housing-check"><input type="checkbox" checked={draft.balcony}
              onChange={event => setDraft(d => ({...d, balcony: event.target.checked}))} /> Deze woning heeft een balkon</label>
            <button type="submit" disabled={homes.length >= MAX_MANUAL_HOMES}>Voeg toe aan vergelijking</button>
          </fieldset>
        </form>

        <div className="housing-actions">
          <button type="button" disabled={!homes.length || !validPreferences} onClick={exportJson}>
            Bewaar JSON…
          </button>
          <label htmlFor="hs-import">Open eerder bewaarde privévergelijking (JSON, max. 16 KB)</label>
          <input id="hs-import" type="file" accept=".json,application/json" onChange={event => {
            void selectJson(event.target.files?.[0]);
            event.target.value = '';
          }} />
          <button type="button" className="secondary" disabled={!homes.length}
            onClick={() => setConfirmClear(true)}>Wis vergelijking</button>
        </div>
        {pendingImport && <div className="housing-confirm" role="group" aria-label="Bevestig vervanging">
          <p>Dit bestand heeft <strong>{pendingImport.homes.length}</strong> woningen en eigen
            voorkeuren. Overnemen vervangt je huidige lokale vergelijking geheel.</p>
          <button type="button" onClick={() => {
            setPreferences(pendingImport.preferences); setHomes(pendingImport.homes);
            setCompared([]); setPendingImport(null); setConfirmClear(false);
            setEditingIndex(null); setRemovedHome(null);
            setNotice('Privévergelijking lokaal overgenomen; gegevens blijven ongeverifieerd.');
          }}>Vervang vergelijking</button>
          <button type="button" className="secondary" onClick={() => {
            setPendingImport(null); setNotice('Import geannuleerd; je oorspronkelijke vergelijking is behouden.');
          }}>Annuleren</button>
        </div>}
        {confirmClear && <div className="housing-confirm" role="group" aria-label="Wissen bevestigen">
          <p>Alleen deze handmatig ingevulde woningvergelijking verwijderen? Andere Woonpoints-notities blijven bestaan.</p>
          <button type="button" onClick={() => {setHomes([]); setCompared([]); setConfirmClear(false);
            setEditingIndex(null); setRemovedHome(null);
            setPendingImport(null); setNotice('Woningen uit dit tabblad verwijderd.');}}>Ja, wis woningen</button>
          <button type="button" className="secondary" onClick={() => setConfirmClear(false)}>Behoud woningen</button>
        </div>}
        {notice && <p role="status" aria-live="polite">{notice}</p>}
        {removedHome && <div className="housing-undo" role="status">
          <p>Een woning is uit deze privésessie verwijderd. Je kunt de laatste verwijdering nog terugdraaien.</p>
          <button type="button" onClick={undoRemove} disabled={homes.length >= MAX_MANUAL_HOMES}>
            Herstel laatst verwijderde woning
          </button>
        </div>}
        <h3>Jouw rangorde: {eligible} passend van {homes.length} ingevoerde woningen</h3>
        {!homes.length && <p>Voeg een woning toe om de vergelijking te starten. De gegevens zijn alleen voor jou zichtbaar in dit tabblad.</p>}
        {!ranked && homes.length > 0 && <p role="alert">Je voorkeuren zijn niet volledig. De rangorde is onbekend.</p>}
        <section className="housing-side-by-side" aria-labelledby="housing-pair-heading">
          <h3 id="housing-pair-heading">Vergelijk twee woningen direct</h3>
          <p>Selecteer hieronder precies twee woningen. Het gaat om verschillen in jouw eigen
            invoer, niet om een huurgarantie, officieel passend aanbod of woningkans.</p>
          <p aria-live="polite">{compared.length}/2 geselecteerd</p>
          {comparison && <div className="housing-pair-grid">
            <article>
              <h4>{homes[compared[0]]?.label}</h4>
              <p>{comparison.choices[0]?.suitable ? 'Past bij je grenzen' : 'Past niet bij je grenzen'}</p>
            </article>
            <article>
              <h4>{homes[compared[1]]?.label}</h4>
              <p>{comparison.choices[1]?.suitable ? 'Past bij je grenzen' : 'Past niet bij je grenzen'}</p>
            </article>
            <div className="housing-pair-facts">
              <p><strong>Maandhuurverschil:</strong> €{comparison.monthlyRentGap}
                {comparison.lowerRent ? ` · Lager bij ${comparison.lowerRent}` : ' · Gelijk'}</p>
              <p><strong>12 keer hetzelfde maandverschil:</strong> €{comparison.twelveMonthRentGap}
                {' '}(geen voorspelling van toekomstige huur)</p>
              <p><strong>Verschil in enkele reistijd:</strong> {comparison.minutesGap} minuten
                {comparison.shorterTravel ? ` · Korter bij ${comparison.shorterTravel}` : ' · Gelijk'}</p>
              <p><strong>Kamerverschil:</strong> {comparison.roomsGap}
                {comparison.moreRooms ? ` · Meer bij ${comparison.moreRooms}` : ' · Gelijk'}</p>
              <p>Servicekosten, energie, woonlasten, wachtrijregels en veranderende reistijden
                zijn niet meegenomen.</p>
            </div>
          </div>}
          <div className="housing-choice-buttons">
            <button className="secondary" type="button" disabled={!compared.length}
              onClick={() => {setCompared([]); setNotice('Directe vergelijking leeggemaakt.');}}>
              Wis selectie
            </button>
            <button type="button" disabled={!comparison} onClick={exportDecisionNote}>
              Bewaar beslisnotitie als TXT…
            </button>
            {onCostPrefill && <button type="button" disabled={!comparison}
              onClick={() => {
                const first = homes[compared[0]], second = homes[compared[1]];
                if (!comparison || !first || !second) return;
                // Exact user-confirmed snapshot, no unknown fields or external lookups.
                if (!validPreferences) return;
                onCostPrefill([{...first}, {...second}], {...validPreferences});
                setNotice('Twee woningen overgenomen in de privé-kostenvergelijker. Vul aanvullende kosten zelf in.');
                document.getElementById('private-budget-title')?.scrollIntoView({behavior:'smooth', block:'start'});
              }}>
              Neem deze twee woningen mee naar totale kosten ↓
            </button>}
            {onViewingPrefill && <button type="button" disabled={!comparison} onClick={() => {
              const first = homes[compared[0]], second = homes[compared[1]];
              if (!comparison || !first || !second) return;
              const checkedFirst = normalizeManualHome(first) as Home | null;
              const checkedSecond = normalizeManualHome(second) as Home | null;
              if (!checkedFirst || !checkedSecond) return;
              onViewingPrefill([{...checkedFirst}, {...checkedSecond}]);
              setNotice('Twee eigen woninglabels aangeboden voor bezichtiging. Bevestig daar eerst om bestaande beoordelingen te wissen.');
              document.getElementById('private-viewing-title')?.scrollIntoView({block:'start'});
            }}>Bied deze twee woningen aan voor bezichtigingschecklist ↓</button>}
          </div>
        </section>
        <ol className="housing-results">
          {ranked?.map((row: {index: number; home: Home; suitable: boolean; score: number | null; reasons: string[]}) => (
            <li key={row.index} className="housing-item">
              <div className="housing-item-head">
                <strong>{row.home.label}</strong>
                <span>{row.suitable ? `Past bij de grenzen · ${row.score} eigen punten` : 'Past niet bij jouw grenzen'}</span>
              </div>
              <p>Zelf genoteerd: €{row.home.rent}/maand · {row.home.rooms} kamers · {row.home.travel} minuten ·
                {row.home.balcony ? ' balkon' : ' geen balkon'}</p>
              <ul>{row.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
              {editingIndex === row.index && <form onSubmit={editHome}
                className="housing-edit-form">
                <fieldset>
                  <legend>Bewerk jouw notitie: {row.home.label}</legend>
                  <label htmlFor="hs-edit-label">Neutraal label</label>
                  <input id="hs-edit-label" required maxLength={64} autoComplete="off"
                    value={editDraft.label}
                    onChange={event => setEditDraft(d => ({...d, label: event.target.value}))} />
                  <div className="housing-fields">
                    <div><label htmlFor="hs-edit-rent">Maandhuur (€)</label>
                      <input id="hs-edit-rent" type="number" min="100" max="10000" step="1" required
                        value={editDraft.rent}
                        onChange={event => setEditDraft(d => ({...d, rent: event.target.value}))} /></div>
                    <div><label htmlFor="hs-edit-rooms">Kamers</label>
                      <input id="hs-edit-rooms" type="number" min="1" max="20" step="1" required
                        value={editDraft.rooms}
                        onChange={event => setEditDraft(d => ({...d, rooms: event.target.value}))} /></div>
                    <div><label htmlFor="hs-edit-travel">Reistijd (minuten)</label>
                      <input id="hs-edit-travel" type="number" min="0" max="300" step="1" required
                        value={editDraft.travel}
                        onChange={event => setEditDraft(d => ({...d, travel: event.target.value}))} /></div>
                  </div>
                  <label className="housing-check">
                    <input type="checkbox" checked={editDraft.balcony}
                      onChange={event => setEditDraft(d => ({...d, balcony: event.target.checked}))} />
                    Balkon aanwezig
                  </label>
                  <div className="housing-edit-actions">
                    <button type="submit">Bewaar aanpassingen</button>
                    <button type="button" className="secondary" onClick={() => setEditingIndex(null)}>
                      Annuleren
                    </button>
                  </div>
                </fieldset>
              </form>}
              <button type="button" className="secondary"
                onClick={() => {
                  setEditingIndex(row.index);
                  setEditDraft({
                    label: row.home.label,
                    rent: String(row.home.rent),
                    rooms: String(row.home.rooms),
                    travel: String(row.home.travel),
                    balcony: row.home.balcony
                  });
                  setNotice('Wijzigingen gelden pas na Bewaar aanpassingen.');
                }}>
                {editingIndex === row.index ? 'Opnieuw bewerken' : 'Bewerk deze woning'}
              </button>
              <button type="button"
                aria-pressed={compared.includes(row.index)}
                className="secondary"
                disabled={!compared.includes(row.index) && compared.length >= 2}
                onClick={() => {
                  setCompared(current => current.includes(row.index)
                    ? current.filter(id => id !== row.index)
                    : current.length < 2 ? [...current, row.index] : current);
                }}>
                {compared.includes(row.index) ? '✓ In directe vergelijking' : 'Selecteer voor vergelijking'}
              </button>
              {onPlanPrefill && <button type="button" className="secondary"
                onClick={() => {
                  onPlanPrefill({...row.home});
                  setNotice('Woninglabel aan de planner aangeboden. Kies daar zelf het type en de datum; er is nog niets opgeslagen.');
                  document.getElementById('private-plan-title')?.scrollIntoView({behavior:'smooth', block:'start'});
                }}>
                Plan vervolgactie voor deze woning ↓
              </button>}
              {onMovePrefill && <button type="button" className="secondary"
                onClick={() => {
                  onMovePrefill({...row.home});
                  setNotice('Jouw eigen woningkenmerken aangeboden aan het vrijblijvende verhuisplan. Daar bevestig je eerst of suggesties worden toegevoegd.');
                  document.getElementById('private-moving-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
                }}>
                Bereid verhuisplan voor deze woning voor ↓
              </button>}
              <button type="button" className="secondary" onClick={() => {
                setCompared([]);
                setEditingIndex(null);
                setRemovedHome({index: row.index, home: row.home});
                setHomes(current => current.filter((_, index) => index !== row.index));
                setNotice('Woning verwijderd uit je privévergelijking.');
              }}>Verwijder deze woning</button>
            </li>
          ))}
        </ol>
        <p><strong>Privacy:</strong> invoer blijft in het geheugen van dit tabblad;
          alleen met Bewaar JSON kies je zelf een bestand. Er wordt niets bij WoningNet
          opgevraagd of geplaatst. Sluiten zonder export verwijdert je invoer.</p>
      </div>
    </section>
  );
}


/** Private, in-memory deadline planner. No account/portal hooks and no background reminders. */
type PrivatePlanKind = 'reactie' | 'bezichtiging' | 'beslissing';
type PrivatePlanStatus = 'open' | 'afgerond';
type PrivatePlanItem = {label: string; when: string; kind: PrivatePlanKind; status: PrivatePlanStatus};
const MAX_PRIVATE_PLANS = 12;
const emptyPrivatePlan: PrivatePlanItem = {label: '', when: '', kind: 'reactie', status: 'open'};
const planKinds: Record<PrivatePlanKind, string> = {
  reactie: 'Reactiedeadline (zelf genoteerd)',
  bezichtiging: 'Bezichtiging (zelf genoteerd)',
  beslissing: 'Beslismoment (zelf genoteerd)'
};

function validPrivatePlan(value: unknown): value is PrivatePlanItem {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<PrivatePlanItem>;
  if (typeof item.label !== 'string' || item.label.trim().length < 1 ||
      item.label.trim().length > 64 || /[\u0000-\u001f\u007f]/.test(item.label)) return false;
  if (item.kind !== 'reactie' && item.kind !== 'bezichtiging' && item.kind !== 'beslissing') return false;
  if (item.status !== 'open' && item.status !== 'afgerond') return false;
  if (typeof item.when !== 'string' ||
      !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d$/.test(item.when)) return false;
  const d = new Date(item.when);
  return Number.isFinite(d.getTime()) &&
    d.getFullYear() === Number(item.when.slice(0,4)) &&
    d.getMonth() + 1 === Number(item.when.slice(5,7)) &&
    d.getDate() === Number(item.when.slice(8,10)) &&
    d.getHours() === Number(item.when.slice(11,13)) &&
    d.getMinutes() === Number(item.when.slice(14,16));
}

function downloadPrivatePlanFile(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.rel = 'noopener';
  document.body.appendChild(a);
  a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  const lines: string[] = [];
  let row = '';
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      lines.push(row);
      row = ' ';
      bytes = 1;
    }
    row += char;
    bytes += size;
  }
  lines.push(row);
  return lines.join('\r\n');
}
function safeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,')
    .replace(/\r?\n/g, ' ');
}
function calendarUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

/** A deliberate download, never a browser notification or remote calendar write. */
export function ManualDeadlinePlanner({prefill, onPrefillHandled}: {
  prefill?: {label:string; kind?:PrivatePlanKind} | null;
  onPrefillHandled?: () => void;
} = {}) {
  const [entries, setEntries] = useState<PrivatePlanItem[]>([]);
  const [draft, setDraft] = useState<PrivatePlanItem>(emptyPrivatePlan);
  const [editing, setEditing] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [pendingImport, setPendingImport] = useState<PrivatePlanItem[] | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const pending = entries.filter(item => item.status === 'open').length;
  const ordered = entries.map((entry, index) => ({entry, index}))
    .filter(row => !onlyOpen || row.entry.status === 'open')
    .sort((a,b) => a.entry.when.localeCompare(b.entry.when) || a.index - b.index);
  const next = entries.filter(entry => entry.status === 'open' && new Date(entry.when).getTime() >= now)
    .sort((a,b) => a.when.localeCompare(b.when))[0];

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item = {...draft, label: draft.label.trim()};
    if (!validPrivatePlan(item)) {
      setNotice('Controleer je korte anonieme label en vul een geldige lokale datum en tijd in.');
      return;
    }
    if (editing === null && entries.length >= MAX_PRIVATE_PLANS) {
      setNotice('Maximaal twaalf acties; verwijder er eerst een.');
      return;
    }
    if (editing !== null && (editing < 0 || editing >= entries.length)) {
      setNotice('Deze actie bestaat niet meer; kies opnieuw.');
      setEditing(null);
      return;
    }
    setEntries(items => editing === null ? [...items, item] :
      items.map((existing, index) => index === editing ? item : existing));
    setDraft({...emptyPrivatePlan});
    setEditing(null); setDeleteIndex(null); setPendingImport(null);
    setNow(Date.now());
    setNotice('Alleen in dit tabblad genoteerd. Geen live-reactie of automatische herinnering.');
  }

  function edit(index: number) {
    setDraft({...entries[index]});
    setEditing(index);
    setDeleteIndex(null);
    setPendingImport(null);
    setNotice('Aanpassing is pas van kracht na Bewaar.');
  }

  function changeStatus(index: number) {
    setEntries(items => items.map((item,i) => index === i
      ? {...item, status: item.status === 'open' ? 'afgerond' : 'open'} : item));
    setEditing(null); setDraft({...emptyPrivatePlan});
    setDeleteIndex(null); setPendingImport(null);
    setNotice('Status alleen lokaal aangepast; dit verifieert geen WoningNet-reactie.');
  }

  function exportJson() {
    if (!entries.length) return;
    downloadPrivatePlanFile(JSON.stringify({version: 1, entries}, null, 2),
      'application/json', 'woonpoints-eigen-planning.json');
    setNotice('Privé-JSON aangeboden. Een door jou gekozen bestandsprovider kan synchroniseren.');
  }

  async function selectJson(file: File | undefined) {
    setPendingImport(null);
    if (!file) return;
    if (file.size < 1 || file.size > 16384) {
      setNotice('Bestand geweigerd: gebruik maximaal 16 KB JSON.');
      return;
    }
    try {
      const decoded: unknown = JSON.parse(await file.text());
      if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) throw new Error('invalid');
      const object = decoded as {version?: unknown; entries?: unknown};
      if (object.version !== 1 || !Array.isArray(object.entries) ||
          object.entries.length > MAX_PRIVATE_PLANS || !object.entries.every(validPrivatePlan)) throw new Error('invalid');
      // Never retain unknown JSON properties (which could include private metadata).
      setPendingImport(object.entries.map((item: PrivatePlanItem) => ({
        label: item.label.trim(), when: item.when, kind: item.kind, status: item.status
      })));
      setNotice('Bestand gecontroleerd. Bevestig apart voordat de huidige tabbladplanning wordt vervangen.');
    } catch {
      setNotice('Geen geldig Woonpoints-planningsbestand; de huidige invoer is ongewijzigd.');
    }
  }

  function exportIcs(selectedIndex: number | null = null) {
    const specific = selectedIndex === null ? null : entries[selectedIndex];
    const selected = selectedIndex === null ? entries.filter(item => item.status === 'open') :
      specific && specific.status === 'open' ? [specific] : [];
    if (!selected.length) {
      setNotice('Geen open eigen actie voor deze agenda-export beschikbaar.');
      return;
    }
    const stamp = calendarUtc(new Date());
    const rows = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Woonpoints//Private Manual Planner//NL',
      'CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    for (const [index,item] of selected.entries()) {
      const start = new Date(item.when);
      const end = new Date(start.getTime() + 15 * 60000);
      rows.push('BEGIN:VEVENT',
        'UID:woonpoints-own-'+stamp+'-'+index+'@local.invalid',
        'DTSTAMP:'+stamp,
        'DTSTART:'+calendarUtc(start),
        'DTEND:'+calendarUtc(end),
        'SUMMARY:'+safeCalendarText(planKinds[item.kind]),
        'DESCRIPTION:'+safeCalendarText('Eigen planning: '+item.label+'. Niet geverifieerd, geen automatische WoningNet-reactie.'),
        'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY',
        'DESCRIPTION:Eigen Woonpoints-planning controleren','END:VALARM',
        'END:VEVENT');
    }
    rows.push('END:VCALENDAR');
    downloadPrivatePlanFile(rows.map(foldCalendarLine).join('\r\n')+'\r\n',
      'text/calendar;charset=utf-8', selectedIndex === null ?
        'woonpoints-eigen-deadlines.ics' : 'woonpoints-een-eigen-actie.ics');
    setNotice(selectedIndex === null ?
      'iCalendar met alle open eigen acties aangeboden. Je kalenderprovider kan gegevens synchroniseren.' :
      'iCalendar met uitsluitend deze eigen actie aangeboden. Je kalenderprovider kan synchroniseren.');
  }

  const calendarYear = month.getFullYear(), calendarMonth = month.getMonth();
  const firstWeekday = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;
  const monthDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarDays = Array.from({length: firstWeekday + monthDays}, (_, index) =>
    index < firstWeekday ? null : index - firstWeekday + 1);
  const calendarRows = entries.map((entry, index) => ({entry, index}))
    .filter(row => !onlyOpen || row.entry.status === 'open');
  function shiftMonth(offset: number) {
    const d = new Date(calendarYear, calendarMonth + offset, 1);
    if (d.getFullYear() >= 2000 && d.getFullYear() <= 2100) setMonth(d);
  }
  const monthLabel = month.toLocaleString('nl-NL', {month: 'long', year: 'numeric'});

  return (
    <section className="panel private-plan" aria-labelledby="private-plan-title">
      <div>
        <p className="eyebrow">EIGEN ACTIEPLANNING · OFFLINE</p>
        <h2 id="private-plan-title">Reactiedeadlines en bezichtigingen zelf plannen</h2>
        <p>Leg maximaal twaalf zelf ontdekte deadlines, bezichtigingen of beslismomenten vast.
          De planner controleert <strong>geen woningplatform, agenda of reactie</strong> en
          stuurt nooit een bericht. De invoer blijft in dit tabblad totdat je zelf exporteert.</p>
        <p>Gebruik alleen een anoniem herkenningslabel (bijvoorbeeld &quot;Woning A&quot;);
          geen adressen, namen, accountgegevens, telefoonnummers of uitnodigingslinks.</p>
      </div>
      {prefill && onPrefillHandled && <div className="private-plan-confirm"
        role="group" aria-label="Woninglabel overnemen in nieuwe actie">
        <p>Maak een nieuwe eigen actie voor <strong>{prefill.label}</strong>?
          Alleen het neutrale woninglabel wordt voorbereid; huur, adres, reactiedeadline
          en daadwerkelijke woningstatus worden niet geïmporteerd.
          Je huidige onbewaarde formulier wordt pas na je bevestiging vervangen.</p>
        <button type="button" onClick={() => {
          setEditing(null);
          setDraft({...emptyPrivatePlan, label: prefill.label, kind: prefill.kind ?? 'reactie'});
          setDeleteIndex(null);
          setPendingImport(null);
          setNotice('Eigen label voorbereid. Controleer het actietype en kies zelf datum/tijd; er is nog niets opgeslagen.');
          onPrefillHandled();
          document.getElementById('plan-when')?.focus();
        }}>Ja, maak eigen actie aan</button>
        <button type="button" className="secondary" onClick={() => {
          onPrefillHandled();
          setNotice('Woning-overdracht geannuleerd. Huidige planning en formulier behouden.');
        }}>Annuleren, behoud formulier</button>
      </div>}
      <div className="private-plan-overview" aria-live="polite" aria-atomic="true">
        <p><strong>{pending}</strong> open eigen acties · {entries.length} / {MAX_PRIVATE_PLANS} ingevoerd</p>
        <p>{next ? 'Eerstvolgende: '+next.label+' · '+new Date(next.when).toLocaleString('nl-NL')
          : 'Geen toekomstige open acties bekend. Dit zegt niets over jouw echte reactiestand.'}</p>
      </div>
      <form className="private-plan-form" onSubmit={save}>
        <fieldset>
          <legend>{editing === null ? 'Nieuwe eigen actie' : 'Eigen actie aanpassen'}</legend>
          <label htmlFor="plan-label">Anoniem label</label>
          <input id="plan-label" value={draft.label} maxLength={64} autoComplete="off"
            placeholder="Woning A" required
            onChange={event => setDraft(d => ({...d, label: event.target.value}))} />
          <div className="private-plan-grid">
            <div><label htmlFor="plan-kind">Soort actie</label>
              <select id="plan-kind" value={draft.kind}
                onChange={event => setDraft(d => ({...d, kind: event.target.value as PrivatePlanKind}))}>
                <option value="reactie">Reactiedeadline</option>
                <option value="bezichtiging">Bezichtiging</option>
                <option value="beslissing">Beslismoment</option>
              </select>
            </div>
            <div><label htmlFor="plan-when">Lokale datum en tijd</label>
              <input id="plan-when" type="datetime-local" required value={draft.when}
                onChange={event => setDraft(d => ({...d, when: event.target.value}))} />
            </div>
          </div>
          <div className="private-plan-buttons">
            <button type="submit" disabled={editing === null && entries.length >= MAX_PRIVATE_PLANS}>
              {editing === null ? 'Voeg eigen actie toe' : 'Bewaar wijziging'}
            </button>
            {editing !== null && <button type="button" className="secondary" onClick={() => {
              setEditing(null); setDraft({...emptyPrivatePlan}); setNotice('Aanpassing geannuleerd.');
            }}>Annuleren</button>}
          </div>
        </fieldset>
      </form>
      <div className="private-plan-toolbar">
        <label className="private-plan-check"><input type="checkbox" checked={onlyOpen}
          onChange={event => setOnlyOpen(event.target.checked)} /> Alleen open acties tonen</label>
        <button type="button" onClick={() => {setNow(Date.now()); setNotice('Tijd opnieuw bekeken.');}}>
          Werk tijdsindicaties bij
        </button>
      </div>
      <section className="private-plan-calendar" aria-label="Maandoverzicht eigen acties">
        <div className="private-plan-calendar-head">
          <h3>Mijn handmatige maandplanning</h3>
          <div className="private-plan-buttons">
            <button type="button" className="secondary" aria-label="Vorige maand"
              disabled={calendarYear === 2000 && calendarMonth === 0}
              onClick={() => shiftMonth(-1)}>← Vorige</button>
            <button type="button" className="secondary" onClick={() => {
              const d = new Date();
              setMonth(new Date(d.getFullYear(), d.getMonth(), 1));
            }}>Deze maand</button>
            <button type="button" className="secondary" aria-label="Volgende maand"
              disabled={calendarYear === 2100 && calendarMonth === 11}
              onClick={() => shiftMonth(1)}>Volgende →</button>
          </div>
        </div>
        <p aria-live="polite"><strong>{monthLabel}</strong> · zelf ingevuld, niet uit
          een woningplatform of agenda gesynchroniseerd.</p>
        <div className="private-plan-month-grid" role="group"
          aria-label={'Maandoverzicht ' + monthLabel}>
          {['Ma','Di','Wo','Do','Vr','Za','Zo'].map(day =>
            <strong className="private-plan-weekday" key={day}>{day}</strong>)}
          {calendarDays.map((day, cell) => {
            if (day === null) return <span className="private-plan-calendar-empty" key={'empty-'+cell} aria-hidden="true" />;
            const key = [calendarYear, String(calendarMonth + 1).padStart(2,'0'),
              String(day).padStart(2,'0')].join('-');
            const active = calendarRows.filter(row => row.entry.when.slice(0, 10) === key);
            return <div className="private-plan-day" key={key}
              aria-label={day + ' ' + monthLabel + ': ' + active.length + ' eigen acties'}>
              <span className="private-plan-day-number">{day}</span>
              {active.map(({entry,index}) =>
                <button type="button" className="private-plan-calendar-action"
                  key={index}
                  onClick={() => {
                    edit(index);
                    document.getElementById('plan-label')?.focus();
                  }}
                  title={'Bewerk eigen actie: ' + entry.label}
                  aria-label={'Bewerk ' + entry.label + ', ' + planKinds[entry.kind]}>
                  {entry.status === 'afgerond' ? '✓ ' : ''}{entry.label}
                </button>)}
            </div>;
          })}
        </div>
        <p>Klik op een eigen actie in de kalender om die in het formulier te bewerken.
          De kalender is alleen een lokale weergave, geen herinneringsdienst.</p>
      </section>
      {ordered.length ? (
        <ol className="private-plan-items">
          {ordered.map(({entry,index}) => {
            const time = new Date(entry.when).getTime();
            const isPast = time < now;
            return <li key={index}>
              <strong>{entry.label}</strong>
              <span>{planKinds[entry.kind]} · {new Date(entry.when).toLocaleString('nl-NL')}</span>
              <span>{entry.status === 'afgerond' ? 'Zelf afgevinkt (niet geverifieerd)' :
                isPast ? 'Tijd verstreken — controleer zelf' : 'Open — nog niet geverifieerd'}</span>
              <div className="private-plan-buttons">
                <button type="button" className="secondary" onClick={() => edit(index)}>Bewerk</button>
                <button type="button" onClick={() => changeStatus(index)}>
                  {entry.status === 'open' ? 'Zelf afvinken' : 'Heropen'}
                </button>
                <button type="button" className="secondary" disabled={entry.status !== 'open'}
                  onClick={() => exportIcs(index)}>
                  Alleen deze actie naar agenda (.ics)…
                </button>
                <button type="button" className="secondary" onClick={() => setDeleteIndex(index)}>
                  Verwijder…
                </button>
              </div>
              {deleteIndex === index && <div className="private-plan-confirm">
                <p>Deze notitie echt verwijderen? Dit is niet te herstellen zonder eigen back-up.</p>
                <button type="button" onClick={() => {
                  setEntries(items => items.filter((_,i) => i !== index));
                  setEditing(null); setDraft({...emptyPrivatePlan});
                  setDeleteIndex(null); setPendingImport(null);
                  setNotice('Notitie alleen uit dit tabblad verwijderd.');
                }}>Ja, verwijder</button>
                <button type="button" className="secondary" onClick={() => setDeleteIndex(null)}>Annuleren</button>
              </div>}
            </li>;
          })}
        </ol>
      ) : <p>{entries.length && onlyOpen ? 'Geen open acties in dit tabblad.' : 'Nog geen acties ingevuld.'}</p>}
      <div className="private-plan-archive">
        <h3>Mijn planning bewaren of meenemen</h3>
        <p><strong>Alleen op jouw verzoek.</strong> JSON bewaart je eigen planning; ICS
          bevat uitsluitend nog open acties en kan bij import naar een kalenderdienst synchroniseren.
          Een agenda-event is geen bevestigde reactie of automatische herinnering vanuit Woonpoints.</p>
        <div className="private-plan-buttons">
          <button type="button" disabled={!entries.length} onClick={exportJson}>Download privé-JSON</button>
          <button type="button" disabled={!pending} onClick={() => exportIcs()}>Download alle open acties (.ics)</button>
        </div>
        <label htmlFor="plan-import">Herstel eigen Woonpoints-JSON (maximaal 16 KB)</label>
        <input id="plan-import" type="file" accept=".json,application/json"
          onChange={event => {void selectJson(event.target.files?.[0]); event.target.value = '';}} />
        {pendingImport !== null && <div className="private-plan-confirm">
          <p>Vervang alle {entries.length} huidige notities door {pendingImport.length} uit het bestand?</p>
          <button type="button" onClick={() => {
            setEntries(pendingImport); setPendingImport(null);
            setEditing(null); setDraft({...emptyPrivatePlan}); setDeleteIndex(null);
            setNow(Date.now()); setNotice('Eigen privéplanning uit gekozen bestand geladen.');
          }}>Ja, vervang</button>
          <button type="button" className="secondary" onClick={() => {
            setPendingImport(null); setNotice('Import geannuleerd; huidige planning blijft staan.');
          }}>Behoud huidige planning</button>
        </div>}
        {confirmClear ? <div className="private-plan-confirm">
          <p>Wil je alle {entries.length} acties verwijderen? Niet-opgeslagen notities zijn daarna weg.</p>
          <button type="button" onClick={() => {
            setEntries([]); setEditing(null); setDraft({...emptyPrivatePlan}); setDeleteIndex(null);
            setPendingImport(null); setConfirmClear(false);
            setNotice('Alle tabbladnotities gewist. Eventueel geëxporteerde bestanden blijven bestaan.');
          }}>Ja, wis alles</button>
          <button type="button" className="secondary" onClick={() => setConfirmClear(false)}>
            Annuleren
          </button>
        </div> : <button type="button" className="secondary" disabled={!entries.length}
          onClick={() => setConfirmClear(true)}>Wis tabbladplanning…</button>}
      </div>
      <p role="status" aria-live="polite">{notice}</p>
    </section>
  );
}


/** Two self-entered, browser-session-only cost scenarios, never official property prices. */
type CostDraft = {label: string; rent: string; service: string; energy: string; travel: string; start: string};
type CostResult = {label: string; rent: number; service: number; energy: number; travel: number; start: number; monthly: number; firstYear: number; followingYear: number};
const blankCosts = (label: string): CostDraft =>
  ({label, rent: '', service: '0', energy: '0', travel: '0', start: '0'});
const currencyCost = (amount: number) =>
  new Intl.NumberFormat('nl-NL', {style: 'currency', currency: 'EUR'}).format(amount / 100);

function readCostCents(raw: string, minimum: number, maximum: number): number | null {
  const trimmed = raw.trim();
  if (!/^\d{1,5}(?:\.\d{1,2})?$/.test(trimmed)) return null;
  const number = Number(trimmed);
  if (!Number.isFinite(number) || number < minimum || number > maximum) return null;
  return Math.round(number * 100);
}
function calculatePrivateCosts(input: CostDraft): CostResult | null {
  const label = input.label.trim();
  if (!label || label.length > 64 || /[\u0000-\u001f\u007f]/.test(label)) return null;
  const rent = readCostCents(input.rent, 100, 10000);
  const service = readCostCents(input.service, 0, 5000);
  const energy = readCostCents(input.energy, 0, 5000);
  const travel = readCostCents(input.travel, 0, 5000);
  const start = readCostCents(input.start, 0, 20000);
  if (rent === null || service === null || energy === null || travel === null || start === null) return null;
  const monthly = rent + service + energy + travel;
  return {label, rent, service, energy, travel, start, monthly,
    firstYear: monthly * 12 + start, followingYear: monthly * 12};
}

/** Voluntary, session-only scenario modelling; no lending, benefits or eligibility claims. */
type BudgetDraft = {income: string; essentials: string; savings: string; dip: string; rise: string};
type BudgetInputs = {income: number; essentials: number; savings: number; dip: number; rise: number};
type BudgetForecast = {
  availableAfterMove: number; baselineMonthly: number; stressedMonthly: number;
  baselineYear: number; stressedYear: number; stressedRunwayMonths: number | null;
};
function readBudgetInputs(draft: BudgetDraft): BudgetInputs | null {
  const income = readCostCents(draft.income, 1, 20000);
  const essentials = readCostCents(draft.essentials, 0, 20000);
  const savings = readCostCents(draft.savings, 0, 50000);
  if (!/^(?:0|[1-9]\d{0,2})$/.test(draft.dip) || !/^(?:0|[1-9]\d{0,2})$/.test(draft.rise)) return null;
  const dip = Number(draft.dip);
  const rise = Number(draft.rise);
  if (income === null || essentials === null || savings === null || dip > 90 || rise > 100) return null;
  return {income, essentials, savings, dip, rise};
}
function calculateBudgetForecast(cost: CostResult, plan: BudgetInputs): BudgetForecast {
  const availableAfterMove = plan.savings - cost.start;
  const baselineMonthly = plan.income - plan.essentials - cost.monthly;
  const stressedMonthly = Math.round(plan.income * (100 - plan.dip) / 100)
    - plan.essentials - Math.round(cost.monthly * (100 + plan.rise) / 100);
  return {
    availableAfterMove, baselineMonthly, stressedMonthly,
    baselineYear: availableAfterMove + 12 * baselineMonthly,
    stressedYear: availableAfterMove + 12 * stressedMonthly,
    stressedRunwayMonths: availableAfterMove < 0 ? 0
      : stressedMonthly >= 0 ? null
      : Math.floor(availableAfterMove / -stressedMonthly)
  };
}


type PrivateBudgetBackup = {
  schema: 1;
  scenarioA: CostDraft;
  scenarioB: CostDraft;
  budget: BudgetDraft;
  saving: {months: string; reserveMonths: string};
};
/** Exact-version, plain-data JSON only: imported files never become authorization evidence. */
function readPrivateBudgetBackup(text: string): PrivateBudgetBackup | null {
  if (new TextEncoder().encode(text).length > 16384) return null;
  let data: unknown;
  try { data = JSON.parse(text); } catch { return null; }
  const fields = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.keys(value).length === keys.length &&
    keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
  if (!fields(data, ['schema', 'scenarioA', 'scenarioB', 'budget', 'saving']) ||
    data.schema !== 1) return null;
  const costKeys = ['label', 'rent', 'service', 'energy', 'travel', 'start'];
  const budgetKeys = ['income', 'essentials', 'savings', 'dip', 'rise'];
  const scenarios = [data.scenarioA, data.scenarioB];
  if (scenarios.some(value => !fields(value, costKeys) ||
    costKeys.some(key => typeof value[key] !== 'string'))) return null;
  const candidateBudget = data.budget;
  if (!fields(candidateBudget, budgetKeys) ||
    budgetKeys.some(key => typeof candidateBudget[key] !== 'string')) return null;
  if (!fields(data.saving, ['months', 'reserveMonths']) ||
    typeof data.saving.months !== 'string' || typeof data.saving.reserveMonths !== 'string') return null;
  const first = data.scenarioA as CostDraft;
  const second = data.scenarioB as CostDraft;
  const budget = data.budget as BudgetDraft;
  const saving = data.saving as PrivateBudgetBackup['saving'];
  if (!calculatePrivateCosts(first) || !calculatePrivateCosts(second) ||
    !readBudgetInputs(budget) ||
    !/^(?:[1-9]|[12]\d|3[0-6])$/.test(saving.months) ||
    !/^(?:[0-9]|1[0-2])$/.test(saving.reserveMonths)) return null;
  return {schema: 1, scenarioA: {...first}, scenarioB: {...second},
    budget: {...budget}, saving: {...saving}};
}

type CostHandoff = {selected: [Home, Home]; preferences: Preferences};
type PrivateLongTermOffer = {
  sourceLabels: [string, string];
  first: PrivateCostInputs;
  second: PrivateCostInputs;
};


/** Two explicit, local-only handoffs unify shortlist, cost comparison and action planning. */
export function ManualHousingDecisionWorkspace() {
  const [handoff, setHandoff] = useState<CostHandoff | null>(null);
  const [planPrefill, setPlanPrefill] =
    useState<{label:string; kind?:PrivatePlanKind} | null>(null);
  const [longTermOffer, setLongTermOffer] = useState<PrivateLongTermOffer | null>(null);
  const [viewingOffer, setViewingOffer] = useState<[string, string] | null>(null);
  const [movingOffer, setMovingOffer] = useState<Home | null>(null);
  return (
    <>
      <ManualHousingShortlist onCostPrefill={(selected, preferences) =>
        setHandoff({
          selected: [{...selected[0]}, {...selected[1]}],
          preferences: {...preferences}
        })}
        onPlanPrefill={home => setPlanPrefill({...home})}
        onViewingPrefill={selected => setViewingOffer([selected[0].label, selected[1].label])}
        onMovePrefill={home => setMovingOffer({...home})} />
      <ManualHousingCostComparison handoff={handoff}
        onLongTermOffer={offer => setLongTermOffer(offer)} />
      <PrivateLongTermHousingCosts offer={longTermOffer}
        onOfferHandled={() => setLongTermOffer(null)} />
      <PrivateHousingViewingChecklist offer={viewingOffer}
        onOfferHandled={() => setViewingOffer(null)}
        onPlanFollowup={label => setPlanPrefill({label, kind:'beslissing'})} />
      <ManualDeadlinePlanner prefill={planPrefill} onPrefillHandled={() => setPlanPrefill(null)} />
      <PrivateMovingChecklist offer={movingOffer} onOfferHandled={() => setMovingOffer(null)} />
    </>
  );
}

export function ManualHousingCostComparison({handoff, onLongTermOffer}: {
  handoff?: CostHandoff | null;
  onLongTermOffer?: (offer: PrivateLongTermOffer) => void;
} = {}) {
  const [a, setA] = useState<CostDraft>(() => blankCosts('Woning A'));
  const [b, setB] = useState<CostDraft>(() => blankCosts('Woning B'));
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState('');
  const [fromShortlist, setFromShortlist] = useState(false);
  const [pendingBudgetRestore, setPendingBudgetRestore] = useState<PrivateBudgetBackup | null>(null);
  const [budgetArchiveMessage, setBudgetArchiveMessage] = useState('');

  const [movePlan, setMovePlan] = useState({months: '6', reserveMonths: '3'});
  const [budgetDraft, setBudgetDraft] = useState<BudgetDraft>({
    income: '', essentials: '0', savings: '0', dip: '15', rise: '10'
  });



  useEffect(() => {
    if (!handoff) return;
    const [first, second] = handoff.selected;
    // Only validated manually entered shortlist fields are copied.
    // Estimates, travel costs and one-off fees are deliberately NOT invented.
    const incomingA = {...blankCosts(first.label), rent: String(first.rent)};
    const incomingB = {...blankCosts(second.label), rent: String(second.rent)};
    if (!calculatePrivateCosts(incomingA) || !calculatePrivateCosts(incomingB)) return;
    setA(incomingA);
    setB(incomingB);
    setShow(false);
    setFromShortlist(true);
    setNotice('Beide eigen woninglabels en huurprijzen gekopieerd. Vul service, energie, vervoer en startkosten zelf in; oude schattingen zijn gewist.');
  }, [handoff]);

  const left = calculatePrivateCosts(a);
  const right = calculatePrivateCosts(b);
  const ready = !!left && !!right;
  const budgetInputs = readBudgetInputs(budgetDraft);
  const forecastA = left && budgetInputs ? calculateBudgetForecast(left, budgetInputs) : null;
  const forecastB = right && budgetInputs ? calculateBudgetForecast(right, budgetInputs) : null;
  const moveMonths = /^(?:[1-9]|[12]\d|3[0-6])$/.test(movePlan.months)
    ? Number(movePlan.months) : null;
  const reserveMonths = /^(?:[0-9]|1[0-2])$/.test(movePlan.reserveMonths)
    ? Number(movePlan.reserveMonths) : null;
  const savingsGoal = (cost: CostResult) => {
    if (!budgetInputs || moveMonths === null || reserveMonths === null) return null;
    const target = cost.start + reserveMonths * (cost.monthly + budgetInputs.essentials);
    const missing = Math.max(0, target - budgetInputs.savings);
    return {target, missing, monthlySavings: Math.ceil(missing / moveMonths)};
  };
  const savingA = left ? savingsGoal(left) : null;
  const savingB = right ? savingsGoal(right) : null;
  const forecastRows: [string, number, number][] = forecastA && forecastB ? [
    ['Eigen spaargeld na verhuiskosten', forecastA.availableAfterMove, forecastB.availableAfterMove],
    ['Maandruimte met huidig inkomen', forecastA.baselineMonthly, forecastB.baselineMonthly],
    ['Maandruimte bij tegenslag', forecastA.stressedMonthly, forecastB.stressedMonthly],
    ['Verwachte buffer na 12 maanden, basis', forecastA.baselineYear, forecastB.baselineYear],
    ['Verwachte buffer na 12 maanden, tegenslag', forecastA.stressedYear, forecastB.stressedYear]
  ] : [];

  function exportPrivateBudgetBackup() {
    if (!ready || !budgetInputs || !moveMonths || reserveMonths === null ||
      !left || !right || !show) return;
    const snapshot: PrivateBudgetBackup = {schema: 1,
      scenarioA: {...a}, scenarioB: {...b}, budget: {...budgetDraft}, saving: {...movePlan}};
    const raw = JSON.stringify(snapshot);
    // Do not offer a backup that the own restore validator would reject.
    if (new TextEncoder().encode(raw).length > 16384 || !readPrivateBudgetBackup(raw)) {
      setBudgetArchiveMessage('Deze invoer kan niet veilig worden geback-upt. Controleer je gegevens.');
      return;
    }
    downloadPrivatePlanFile(raw + '\n', 'application/json;charset=utf-8',
      'woonpoints-eigen-kosten-en-buffer.json');
    setBudgetArchiveMessage('Privé-JSON aangeboden. Bewaar het zorgvuldig: de gekozen opslaglocatie kan synchroniseren.');
  }
  async function selectBudgetRestore(file: File | undefined) {
    setPendingBudgetRestore(null);
    setBudgetArchiveMessage('');
    if (!file) return;
    if (file.size === 0 || file.size > 16384) {
      setBudgetArchiveMessage('Herstelbestand geweigerd: maximaal 16 KiB geldig Woonpoints-JSON.');
      return;
    }
    try {
      const incoming = readPrivateBudgetBackup(await file.text());
      if (!incoming) throw new TypeError('invalid');
      setPendingBudgetRestore(incoming);
      setBudgetArchiveMessage('Geldige privégegevens ingelezen. Bevestig apart voordat je huidige scenario’s worden vervangen.');
    } catch {
      setBudgetArchiveMessage('Herstelbestand geweigerd. Huidige bedragen en plannen zijn ongewijzigd.');
    }
  }
  function applyBudgetRestore() {
    if (!pendingBudgetRestore) return;
    const snapshot = pendingBudgetRestore;
    setA({...snapshot.scenarioA});
    setB({...snapshot.scenarioB});
    setBudgetDraft({...snapshot.budget});
    setMovePlan({...snapshot.saving});
    setFromShortlist(false); // Imported personal backup is NOT an original property provenance receipt.
    setShow(true);
    setPendingBudgetRestore(null);
    setBudgetArchiveMessage('Privé-vergelijking hersteld in dit tabblad; geen server of WoningNet geraadpleegd.');
    setNotice('Financiële gegevens uit eigen herstelbestand overgenomen; brongegevens blijven ongeverifieerd.');
  }

  function exportBudgetForecast() {
    if (!left || !right || !budgetInputs || !forecastA || !forecastB || !show) return;
    const formatScenario = (cost: CostResult, data: BudgetForecast) => [
      'Eigen scenariolabel: ' + cost.label,
      'Eigen woonlasten per maand: ' + currencyCost(cost.monthly),
      'Eigen eenmalige startkosten: ' + currencyCost(cost.start),
      'Buffer direct na verhuizing: ' + currencyCost(data.availableAfterMove),
      'Maandruimte basis: ' + currencyCost(data.baselineMonthly),
      'Maandruimte tegenslag: ' + currencyCost(data.stressedMonthly),
      'Buffer na twaalf maanden basis: ' + currencyCost(data.baselineYear),
      'Buffer na twaalf maanden tegenslag: ' + currencyCost(data.stressedYear),
      'Buffer houdt bij ongewijzigde tegenslag: ' +
        (data.stressedRunwayMonths === null ? 'geen berekende uitputting bij gelijkblijvende bedragen'
          : data.stressedRunwayMonths + ' volledige maanden')
    ];
    const lines = [
      'WOONPOINTS - PRIVATE BETAALBAARHEIDSVERGELIJKING',
      'Alle bedragen zijn uitsluitend handmatig ingevoerd en niet geverifieerd.',
      'Netto besteedbaar maandinkomen: ' + currencyCost(budgetInputs.income),
      'Andere vaste maandlasten: ' + currencyCost(budgetInputs.essentials),
      'Beschikbaar spaargeld bij start: ' + currencyCost(budgetInputs.savings),
      'Inkomensdaling in tegenslag: ' + budgetInputs.dip + '%',
      'Stijging gezamenlijke woonlasten in tegenslag: ' + budgetInputs.rise + '%',
      '', ...formatScenario(left, forecastA), '', ...formatScenario(right, forecastB),
      ...(savingA && savingB && moveMonths !== null && reserveMonths !== null
        ? ['', 'VERHUISSPAARDOEL - ZELF GEKOZEN PLANNING',
           'Maanden tot verhuizing: ' + moveMonths,
           'Maanden gewenste vaste-lastenbuffer: ' + reserveMonths,
           left.label + ' doel: ' + currencyCost(savingA.target) +
             ', tekort: ' + currencyCost(savingA.missing) +
             ', maandelijks bijsparen: ' + currencyCost(savingA.monthlySavings),
           right.label + ' doel: ' + currencyCost(savingB.target) +
             ', tekort: ' + currencyCost(savingB.missing) +
             ', maandelijks bijsparen: ' + currencyCost(savingB.monthlySavings)]
        : []),

      '', 'Rekenmodel: buffer = spaargeld - verhuiskosten + 12 x maandruimte.',
      'Tegenslag is een zelfgekozen scenario, geen voorspelling. Geen toeslagen, schulden,',
      'onverwachte uitgaven, wettelijke huur-/inkomenstoets of inflatiepad inbegrepen.',
      'Controleer werkelijke bedragen en rechten zelf. Extern bewaren kan synchroniseren.'
    ];
    const content = lines.join('\n') + '\n';
    if (new TextEncoder().encode(content).length > 8192) return;
    downloadPrivatePlanFile(content, 'text/plain;charset=utf-8', 'woonpoints-eigen-betaalbaarheidsprognose.txt');
    setNotice('Eigen prognose aangeboden om te bewaren; gekozen opslaglocaties kunnen synchroniseren.');
  }

  // Explicitly imported source facts are frozen. Cost edits never mutate
  // suitability or quietly rewrite the saved shortlist snapshot.
  const sourceRanking = handoff && fromShortlist
    ? rankManualHomes(handoff.selected, handoff.preferences) : null;
  const sourceRows = sourceRanking?.slice().sort(
    (x: {index: number}, y: {index: number}) => x.index - y.index
  ) as Array<{index: number; home: Home; suitable: boolean; score: number | null; reasons: string[]}> | undefined;
  const rows: {key: keyof CostDraft; title: string; max: number; description?: string}[] = [
    {key: 'rent', title: 'Maandhuur (€)', max: 10000},
    {key: 'service', title: 'Servicekosten per maand (€)', max: 5000},
    {key: 'energy', title: 'Energie-inschatting per maand (€)', max: 5000},
    {key: 'travel', title: 'Reiskosten per maand (€)', max: 5000},
    {key: 'start', title: 'Eenmalige start-/verhuiskosten (€)', max: 20000}
  ];

  function saveNote() {
    if (!left || !right || !show) return;
    const render = (result: CostResult) =>
      [result.label,
       'Eigen kale huur per maand: '+currencyCost(result.rent),
       'Eigen service-inschatting: '+currencyCost(result.service),
       'Eigen energie-inschatting: '+currencyCost(result.energy),
       'Eigen reiskosten-inschatting: '+currencyCost(result.travel),
       'Eigen eenmalige startkosten: '+currencyCost(result.start),
       'Maandbedrag: '+currencyCost(result.monthly),
       'Eerste 12 maanden inclusief start: '+currencyCost(result.firstYear),
       'Volgende 12 maanden zonder start: '+currencyCost(result.followingYear)].join('\n');
    const note = [
      'Woonpoints · eigen woningkostenvergelijking',
      'Zelf genoteerde bedragen, niet geverifieerd; geen huurtoeslag, kostenprognose of toelatingstoets.',
      '',
      render(left), '', render(right), '',
      'Verschil per maand: '+currencyCost(Math.abs(left.monthly - right.monthly)),
      'Verschil eerste jaar: '+currencyCost(Math.abs(left.firstYear - right.firstYear)),
      'De werkelijke kosten kunnen afwijken. Controleer huurprijs en contract zelf.'
    ].join('\n');
    downloadPrivatePlanFile(note, 'text/plain;charset=utf-8', 'woonpoints-eigen-kostenvergelijking.txt');
    setNotice('Eigen TXT-afweging aangeboden. Je gekozen opslagprovider kan het bestand synchroniseren.');
  }

  function exportCompleteDecision() {
    if (!left || !right || !show || !handoff || !sourceRows || sourceRows.length !== 2) return;
    const p = handoff.preferences;
    const details = sourceRows.flatMap((row, index) => [
      index === 0 ? 'Woning 1 (oorspronkelijke snapshot)' : 'Woning 2 (oorspronkelijke snapshot)',
      'Zelf gekozen label: ' + row.home.label,
      'Zelf genoteerde huur: ' + currencyCost(row.home.rent * 100),
      'Kamers: ' + row.home.rooms,
      'Zelf geschatte enkele reistijd: ' + row.home.travel + ' minuten',
      'Balkon: ' + (row.home.balcony ? 'ja' : 'nee'),
      'Past bij de toenmalige eigen grenzen: ' + (row.suitable ? 'ja' : 'nee'),
      ...row.reasons.map((reason: string) => '  - ' + reason),
      ''
    ]);
    const costRows = [left, right].flatMap((row, index) => [
      'Kosten-scenario ' + (index + 1) + ': ' + row.label,
      'Huur: ' + currencyCost(row.rent),
      'Service: ' + currencyCost(row.service),
      'Energie: ' + currencyCost(row.energy),
      'Vervoer: ' + currencyCost(row.travel),
      'Eenmalige startkosten: ' + currencyCost(row.start),
      'Som per maand: ' + currencyCost(row.monthly),
      'Eerste twaalf maanden inclusief start: ' + currencyCost(row.firstYear),
      'Volgende twaalf maanden zonder start: ' + currencyCost(row.followingYear),
      ''
    ]);
    const content = [
      'WOONPOINTS — VOLLEDIGE EIGEN WONINGAFWEGING',
      'Persoonlijke niet-geverifieerde snapshot; geen portalgegevens of toewijzingskans.',
      '',
      'OORSPRONKELIJKE PERSOONLIJKE GRENZEN',
      'Maximale eigen huur: ' + currencyCost(p.maxRent * 100),
      'Minimale kamers: ' + p.minRooms,
      'Maximale eigen enkele reistijd: ' + p.maxTravel + ' minuten',
      'Balkonvoorkeur: ' + (p.preferBalcony ? 'ja' : 'nee'),
      '',
      ...details,
      'LATERE HANDMATIGE KOSTENAANNAMES (NIET AUTOMATISCH GESYNCHRONISEERD)',
      ...costRows,
      'Maandverschil: ' + currencyCost(Math.abs(left.monthly - right.monthly)),
      'Verschil eerste twaalf maanden: ' + currencyCost(Math.abs(left.firstYear - right.firstYear)),
      '',
      'Dit bestand bevat geen WoningNet-toewijzingsbewijs of huurtoeslagadvies.',
      'Controleer actuele huur, bijkomende kosten, regels en rechten zelf.',
      'Geen informatie werd door Woonpoints online gecontroleerd.'
    ].join('\n') + '\n';
    if (new TextEncoder().encode(content).length > 8192) {
      setNotice('Het beslisoverzicht is te groot om veilig te exporteren.');
      return;
    }
    downloadPrivatePlanFile(content, 'text/plain;charset=utf-8', 'woonpoints-eigen-beslisdossier.txt');
    setNotice('Eigen volledige beslisafweging aangeboden; gekozen bestandsproviders kunnen synchroniseren.');
  }

  const cheaperMonthly = left && right
    ? left.monthly === right.monthly ? null : left.monthly < right.monthly ? left.label : right.label : null;
  const cheaperFirst = left && right
    ? left.firstYear === right.firstYear ? null : left.firstYear < right.firstYear ? left.label : right.label : null;

  return (
    <section className="panel private-budget" aria-labelledby="private-budget-title">
      <div>
        <p className="eyebrow">PERSOONLIJKE WONINGAFWEGING · PRIVÉ IN DIT TABBLAD</p>
        <h2 id="private-budget-title">Wat kost wonen je écht per maand?</h2>
        <p>Vergelijk twee zelf ingevulde scenario&apos;s, inclusief service, energie, vervoer
          en eenmalige startkosten. Je ziet het maandverschil, het eerste jaar en een
          volgend jaar zonder de eenmalige startkosten.</p>
        {fromShortlist && <p role="status"><strong>Overgenomen uit je eigen woninglijst:</strong>
          labels en maandhuur als momentopname. Overige kosten starten op €0 totdat je ze zelf invult.
          Bewerkingen in de woninglijst wijzigen deze berekening niet stilzwijgend. Gebruik opnieuw
          ‘Neem deze twee woningen mee’ om de berekening bewust te verversen.
          Wissen van de woninglijst wist deze onafhankelijke berekening niet automatisch.</p>}
        <p><strong>Dit is geen controle van WoningNet of officiële betaalbaarheidsberekening.</strong>
          De bedragen zijn jouw aannames: geen echte woningprijs, huurtoeslag, inkomenstoets,
          jaarlijkse prijsverhoging of verborgen kosten zijn geverifieerd.
          Gebruik labels zoals Woning A, nooit adressen, naam of accountgegevens.
          Er wordt niets opgeslagen of verstuurd.</p>
      </div>
      <div className="private-budget-grid">
        {([{data:a, setter:setA, id:'a'}, {data:b, setter:setB, id:'b'}] as const).map(({data,setter,id}) =>
          <fieldset key={id}>
            <legend>{id === 'a' ? 'Scenario A' : 'Scenario B'}</legend>
            <label htmlFor={'cost-'+id+'-label'}>Anoniem label</label>
            <input id={'cost-'+id+'-label'} maxLength={64} autoComplete="off"
              value={data.label} onChange={event => setter(current => ({...current, label:event.target.value}))} />
            {rows.map(field => (
              <div key={field.key}>
                <label htmlFor={'cost-'+id+'-'+field.key}>{field.title}</label>
                <input id={'cost-'+id+'-'+field.key} type="number" min={field.key === 'rent' ? 100 : 0}
                  max={field.max} step="0.01" inputMode="decimal" value={data[field.key]}
                  onChange={event => setter(current => ({...current, [field.key]:event.target.value}))} />
              </div>
            ))}
          </fieldset>
        )}
      </div>
      <div className="private-budget-buttons">
        <button type="button" onClick={() => {
          setShow(true); setNotice(ready ? 'Berekend met uitsluitend je eigen invoer.' :
            'Vul een anoniem label, huur €100–€10.000 en geldige overige kosten €0–€20.000 in.');
        }}>Vergelijk mijn bedragen</button>
        <button type="button" className="secondary" onClick={() => {
          setA(blankCosts('Woning A')); setB(blankCosts('Woning B'));
          setShow(false); setFromShortlist(false);
          setNotice('Alle bedragen uit dit kostenoverzicht gewist.');
        }}>Wis beide scenario&apos;s</button>
      </div>
      <div className="private-budget-provenance">
        <h4>Eigen vergelijking later hervatten (alleen na jouw keuze)</h4>
        <p>Download een privé-JSON met beide woningen, jouw financiële aannames en
          verhuis-spaarplan. Dit bevat gevoelige privébedragen. Er wordt niets
          automatisch bewaard of verstuurd. Een cloudbestandsprovider kan
          de gekozen JSON wel synchroniseren.</p>
        <button type="button" disabled={!ready || !budgetInputs || moveMonths === null || reserveMonths === null || !show}
            onClick={exportPrivateBudgetBackup}>
          Bewaar complete privévergelijking als JSON…
        </button>
        <label htmlFor="budget-restore-file">Lees een eigen Woonpoints-herstelbestand
          (JSON, maximaal 16 KiB)</label>
        <input id="budget-restore-file" type="file" accept=".json,application/json"
          onChange={event => {
            const selected = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            void selectBudgetRestore(selected);
          }} />
        {pendingBudgetRestore && <div className="housing-confirm" role="group"
          aria-label="Bevestig herstel van financiële privégegevens">
          <p><strong>Vervang huidige privévergelijking?</strong> Beide bestaande
            woning- en budgetscenario&apos;s en de verhuis-spaartermijn worden
            vervangen. De geïmporteerde invoer is niet officieel gecontroleerd;
            oorspronkelijke woninglijstbewijzen worden niet hersteld.</p>
          <div className="private-budget-buttons">
            <button type="button" onClick={applyBudgetRestore}>Ja, herstel lokaal</button>
            <button type="button" className="secondary" onClick={() => {
              setPendingBudgetRestore(null);
              setBudgetArchiveMessage('Herstel geannuleerd. Bestaande invoer behouden.');
            }}>Annuleer herstel</button>
          </div>
        </div>}
        {budgetArchiveMessage && <p role="status">{budgetArchiveMessage}</p>}
      </div>


      {show && ready && left && right && <div className="private-budget-results" aria-live="polite">
        <h3>Eigen kostenoverzicht</h3>
        <div className="private-budget-table-wrap">
          <table>
            <caption>Handmatig ingevulde maandbedragen en 12-maandschattingen</caption>
            <thead><tr><th scope="col">Periode</th><th scope="col">{left.label}</th><th scope="col">{right.label}</th></tr></thead>
            <tbody>
              <tr><th scope="row">Totaal per maand</th><td>{currencyCost(left.monthly)}</td><td>{currencyCost(right.monthly)}</td></tr>
              <tr><th scope="row">Eerste 12 maanden incl. start</th><td>{currencyCost(left.firstYear)}</td><td>{currencyCost(right.firstYear)}</td></tr>
              <tr><th scope="row">Daaropvolgende 12 maanden</th><td>{currencyCost(left.followingYear)}</td><td>{currencyCost(right.followingYear)}</td></tr>
            </tbody>
          </table>
        </div>
        <p><strong>Maandverschil: {currencyCost(Math.abs(left.monthly-right.monthly))}.</strong>
          {' '}{cheaperMonthly ? cheaperMonthly+' is goedkoper op basis van deze invoer.' : 'Even hoog in deze berekening.'}</p>
        <p><strong>Verschil eerste jaar: {currencyCost(Math.abs(left.firstYear-right.firstYear))}.</strong>
          {' '}{cheaperFirst ? cheaperFirst+' is goedkoper in het eerste jaar.' : 'Even hoog in het eerste jaar.'}</p>
        <p>Rekensom: 12 × (huur + service + energie + vervoer) + eigen startkosten.
          Dit zegt niets over beschikbaarheid, toekomstige prijsstijging of recht op huurtoeslag.</p>
        <button type="button" onClick={saveNote}>Download eigen TXT-kostenvergelijking</button>
        {onLongTermOffer && <div className="private-budget-provenance">
          <h4>Bekijk deze twee kostenramingen over meerdere jaren</h4>
          <p>Neem huur, jouw eigen service-, energie- en reiskostenschattingen en
            eenmalige startkosten als momentopname mee. De volgende berekening
            vraagt nog apart akkoord voordat daar bestaande cijfers worden
            vervangen. De toekomstige huurverhoging wordt niet geraden: die
            begint bij 0% en kun je zelf aanpassen.</p>
          <button type="button" onClick={() => {
            const transfer = (source: CostResult): PrivateCostInputs => ({
              rent: (source.rent / 100).toFixed(2),
              extras: ((source.service + source.energy + source.travel) / 100).toFixed(2),
              moving: (source.start / 100).toFixed(2),
              growth: '0'
            });
            const first = transfer(left);
            const second = transfer(right);
            if (!readPrivateCostOption(first) || !readPrivateCostOption(second)) {
              setNotice('Deze eigen bedragen passen niet binnen het meerjarenmodel. Pas ze eerst aan.');
              return;
            }
            onLongTermOffer({
              sourceLabels: [left.label, right.label],
              first, second
            });
            setNotice('Momentopname aangeboden. Controleer en bevestig de bedragen in Meerjarenkosten.');
            document.getElementById('private-longterm-title')?.scrollIntoView({block:'start'});
          }}>Bied deze twee kostenramingen aan voor meerjarenvergelijking</button>
        </div>}
        <section className="private-budget-provenance" aria-labelledby="private-runway-heading">
          <h4 id="private-runway-heading">Kan ik verhuizen en een tegenvaller opvangen?</h4>
          <p>Bereken voor dezelfde twee woningen hoe je zelf ingeschatte maandinkomen,
            andere vaste lasten en spaargeld zich verhouden tot je woonkosten.
            Kies een inkomensdaling en stijging van woonlasten voor een apart stressscenario.
            Er wordt niets opgezocht, opgeslagen of verzonden.</p>
          <div className="private-budget-grid">
            <fieldset>
              <legend>Mijn financiële aannames (privé)</legend>
              {([
                {key:'income', label:'Netto besteedbaar inkomen per maand (€)', max:20000, min:1},
                {key:'essentials', label:'Overige vaste maandlasten (€)', max:20000, min:0},
                {key:'savings', label:'Spaargeld beschikbaar voor verhuizing (€)', max:50000, min:0},
                {key:'dip', label:'Tegenslag: inkomensdaling (%)', max:90, min:0},
                {key:'rise', label:'Tegenslag: stijging woonkosten (%)', max:100, min:0}
              ] as {key:keyof BudgetDraft; label:string; max:number; min:number}[]).map(field =>
                <div key={field.key}>
                  <label htmlFor={'runway-'+field.key}>{field.label}</label>
                  <input id={'runway-'+field.key} type="number" min={field.min} max={field.max}
                    step={field.key === 'dip' || field.key === 'rise' ? '1' : '0.01'}
                    inputMode="decimal" autoComplete="off" value={budgetDraft[field.key]}
                    onChange={event => setBudgetDraft(current => ({...current, [field.key]:event.target.value}))} />
                </div>
              )}
              <button type="button" className="secondary" onClick={() => setBudgetDraft({
                income:'', essentials:'0', savings:'0', dip:'15', rise:'10'
              })}>Wis financiële invoer</button>
            </fieldset>
            <div>
              <h4>Hoe wordt gerekend?</h4>
              <p>Maandruimte = zelf ingevuld netto inkomen − andere maandlasten −
                huur, service, energie en vervoer. Bij tegenslag wordt het inkomen
                verlaagd en de volledige woonlastenpost verhoogd. Verhuiskosten
                gaan eerst van je spaargeld af.</p>
              <p>Dit model neemt géén huurtoeslag, belasting, leningen, onzekere kosten,
                toekomstige indexering of individuele omstandigheden mee. Een positief
                bedrag is geen garantie dat een woning betaalbaar of beschikbaar is.</p>
            </div>
          </div>
          {!budgetInputs && <p role="status">Vul eerst een geldig netto inkomen van €1–€20.000,
            andere maandlasten €0–€20.000, spaargeld €0–€50.000,
            inkomensdaling 0–90% en woonkostenstijging 0–100% in.</p>}
          {forecastA && forecastB && <div aria-live="polite">
            <div className="private-budget-table-wrap">
              <table>
                <caption>Persoonlijke bufferprognose, uitsluitend op basis van eigen aannames</caption>
                <thead><tr><th scope="col">Prognose</th><th scope="col">{left.label}</th>
                  <th scope="col">{right.label}</th></tr></thead>
                <tbody>{forecastRows.map(([label, amountA, amountB]) =>
                  <tr key={label}><th scope="row">{label}</th>
                    <td>{currencyCost(amountA)}</td><td>{currencyCost(amountB)}</td></tr>
                )}</tbody>
              </table>
            </div>

            <div className="private-budget-provenance">
              <h4>Mijn verhuis-spaarplan</h4>
              <p>Plan zelf hoeveel je vóór de verhuizing wilt reserveren: de
                eenmalige startkosten plus een aantal maanden aan verwachte
                woon- en overige vaste lasten. De berekening trekt alleen je
                hier ingevoerde spaargeld af en deelt het resterende bedrag
                door het aantal maanden tot je geplande verhuizing.</p>
              <div className="private-budget-grid">
                <fieldset>
                  <legend>Zelf gekozen spaartermijn</legend>
                  <label htmlFor="saving-horizon">Maanden tot verhuizing (1–36)</label>
                  <input id="saving-horizon" type="number" inputMode="numeric" min="1" max="36"
                    step="1" value={movePlan.months}
                    onChange={event => setMovePlan(current => ({...current, months:event.target.value}))} />
                </fieldset>
                <fieldset>
                  <legend>Zelf gekozen noodbuffer</legend>
                  <label htmlFor="saving-reserve">Maanden vaste lasten als buffer (0–12)</label>
                  <input id="saving-reserve" type="number" inputMode="numeric" min="0" max="12"
                    step="1" value={movePlan.reserveMonths}
                    onChange={event => setMovePlan(current => ({...current, reserveMonths:event.target.value}))} />
                </fieldset>
              </div>
              {savingA && savingB ? <div className="private-budget-table-wrap">
                <table>
                  <caption>Zelfgekozen spaardoelen vóór verhuizing; geen actuele spaarcapaciteit bekend</caption>
                  <thead><tr><th scope="col">Spaarplan</th><th scope="col">{left.label}</th>
                    <th scope="col">{right.label}</th></tr></thead>
                  <tbody>
                    <tr><th scope="row">Doel inclusief startkosten en buffer</th>
                      <td>{currencyCost(savingA.target)}</td><td>{currencyCost(savingB.target)}</td></tr>
                    <tr><th scope="row">Nog nodig na huidig spaargeld</th>
                      <td>{currencyCost(savingA.missing)}</td><td>{currencyCost(savingB.missing)}</td></tr>
                    <tr><th scope="row">Zelf bij te sparen per maand</th>
                      <td><strong>{currencyCost(savingA.monthlySavings)}</strong></td>
                      <td><strong>{currencyCost(savingB.monthlySavings)}</strong></td></tr>
                  </tbody>
                </table>
              </div> : <p role="alert">Gebruik hele maanden: 1–36 tot verhuizing
                en 0–12 maanden gewenste buffer.</p>}
              <p>De maandelijkse spaaropgave zegt niet of je nu voldoende
                kunt sparen: je huidige woonlasten, lopende verplichtingen
                en onverwachte kosten zijn niet bekend. Een hoger doel is geen
                financiële verplichting en er wordt niets automatisch ingepland.</p>
            </div>
            <p><strong>Hoe lang houdt het spaargeld stand bij ongewijzigde tegenslag?</strong>
              {' '}{left.label}: {forecastA.stressedRunwayMonths === null ?
                'geen berekende uitputting' : forecastA.stressedRunwayMonths + ' volledige maanden'};
              {' · '}{right.label}: {forecastB.stressedRunwayMonths === null ?
                'geen berekende uitputting' : forecastB.stressedRunwayMonths + ' volledige maanden'}.
            </p>
            {(forecastA.stressedYear < 0 || forecastB.stressedYear < 0 ||
              forecastA.availableAfterMove < 0 || forecastB.availableAfterMove < 0) &&
              <p role="alert">Let op: minstens één scenario heeft onvoldoende spaargeld voor
                de startkosten of een negatieve buffer binnen twaalf maanden.
                Dit is een indicatie op basis van je eigen invoer, geen financieel advies.</p>}
            <button type="button" onClick={exportBudgetForecast}>Bewaar eigen bufferprognose als TXT…</button>
            <p>Bestand alleen na jouw klik; een gekozen cloudbestandslocatie kan je
              zelf ingevoerde financiële gegevens synchroniseren.</p>
          </div>}
        </section>

        {sourceRows?.length === 2 && <div className="private-budget-provenance">
          <h4>Hoe passen deze woningen bij je oorspronkelijke voorkeuren?</h4>
          <p>Momentopname uit jouw woninglijst; gewijzigde kosten veranderen de oorspronkelijke
            kamer-, reistijd- en geschiktheidsgegevens niet.</p>
          <ul>{sourceRows.map(row =>
            <li key={row.index}>
              <strong>{row.home.label}</strong>: {row.home.rooms} kamers,
              {' '}{row.home.travel} minuten, {row.home.balcony ? 'met balkon' : 'zonder balkon'}.
              {' '}{row.suitable ? 'Past bij je eigen grenzen.' : 'Past niet bij je eigen grenzen.'}
            </li>
          )}</ul>
          <button type="button" onClick={exportCompleteDecision}>
            Download volledig beslisdossier (woning + kosten)
          </button>
        </div>}
      </div>}
      <p role="status" aria-live="polite">{notice}</p>
    </section>
  );
}


/** User-supplied hypothetical housing costs only; no account, storage or network access. */
type PrivateCostInputs = { rent: string; extras: string; moving: string; growth: string };
type PrivateCostOption = { rent: number; extras: number; moving: number; growth: number };
const DEFAULT_COST_INPUTS: PrivateCostInputs = {rent:'', extras:'0', moving:'0', growth:'2'};
function readPrivateCostOption(raw: PrivateCostInputs): PrivateCostOption | null {
  const number = (text: string, cap: number, min = 0): number | null => {
    const trimmed = text.trim();
    if (!/^\d{1,5}(?:[.,]\d{1,2})?$/.test(trimmed)) return null;
    const parsed = Number(trimmed.replace(',', '.'));
    return Number.isFinite(parsed) && parsed >= min && parsed <= cap ? parsed : null;
  };
  const rent = number(raw.rent, 20000, 1);
  const extras = number(raw.extras, 20000);
  const moving = number(raw.moving, 50000);
  const growth = number(raw.growth, 25);
  if (rent === null || extras === null || moving === null || growth === null) return null;
  return {rent, extras, moving, growth};
}
function projectPrivateHousingCosts(option: PrivateCostOption, years: number, extrasGrowth = 0) {
  let cumulative = 0;
  return Array.from({length: years}, (_, i) => {
    const year = i + 1;
    const monthlyRent = option.rent * Math.pow(1 + option.growth / 100, i);
    // Include one-time moving costs in year one, never in later years.
    const monthlyExtras = option.extras * Math.pow(1 + extrasGrowth / 100, i);
    const yearly = (monthlyRent + monthlyExtras) * 12 + (i === 0 ? option.moving : 0);
    cumulative += yearly;
    return {year, monthlyRent, yearly, cumulative};
  });
}

type LongTermPrivateBackup = {
  format: 'woonpoints-longterm-private-v1' | 'woonpoints-longterm-private-v2' | 'woonpoints-longterm-private-v3';
  years: string;
  first: PrivateCostInputs;
  second: PrivateCostInputs;
  rentStress: string;
  extrasStress: string;
  monthlyBudget: string;
};
function readPrivateMonthlyBudget(value: string) {
  if (!/^\d{1,5}(?:[.,]\d{1,2})?$/.test(value)) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 50000 ? parsed : null;
}
function readPrivateStressRate(value: string) {
  if (!/^(?:0|[1-9]|1[0-9]|20)(?:[.,]\d{1,2})?$/.test(value)) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 20 ? parsed : null;
}

function decodeLongTermPrivateBackup(text: string): LongTermPrivateBackup | null {
  if (!text || new TextEncoder().encode(text).length > 16384) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const root = parsed as Record<string, unknown>;
    const old = root.format === 'woonpoints-longterm-private-v1';
    const newer = root.format === 'woonpoints-longterm-private-v2';
    const newest = root.format === 'woonpoints-longterm-private-v3';
    if ((!old && !newer && !newest) ||
        Object.keys(root).sort().join('|') !== (old
          ? 'first|format|second|years'
          : newer ? 'extrasStress|first|format|rentStress|second|years'
          : 'extrasStress|first|format|monthlyBudget|rentStress|second|years') ||
        typeof root.years !== 'string' || !/^(?:[1-9]|10)$/.test(root.years)) return null;
    const rentStress = old ? '3' : root.rentStress;
    const extrasStress = old ? '4' : root.extrasStress;
    const monthlyBudget = newest ? root.monthlyBudget : '';
    if (typeof rentStress !== 'string' || typeof extrasStress !== 'string' ||
        readPrivateStressRate(rentStress) === null ||
        readPrivateStressRate(extrasStress) === null ||
        typeof monthlyBudget !== 'string' ||
        (monthlyBudget !== '' && readPrivateMonthlyBudget(monthlyBudget) === null)) return null;
    function parseScenario(raw: unknown): PrivateCostInputs | null {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
      const obj = raw as Record<string, unknown>;
      if (Object.keys(obj).sort().join('|') !== 'extras|growth|moving|rent') return null;
      for (const field of ['rent','extras','moving','growth'] as const) {
        if (typeof obj[field] !== 'string' || (obj[field] as string).length > 20) return null;
      }
      const candidate: PrivateCostInputs = {
        rent: obj.rent as string, extras: obj.extras as string,
        moving: obj.moving as string, growth: obj.growth as string
      };
      return readPrivateCostOption(candidate) ? candidate : null;
    }
    const first = parseScenario(root.first), second = parseScenario(root.second);
    return first && second ? {format:old
      ? 'woonpoints-longterm-private-v1' : newer
        ? 'woonpoints-longterm-private-v2' : 'woonpoints-longterm-private-v3',
      years:root.years,first,second,rentStress,extrasStress,monthlyBudget} : null;
  } catch {
    return null;
  }
}

/** Standalone private financial what-if model; does not represent future legal rent increases. */
export function PrivateLongTermHousingCosts({offer, onOfferHandled}: {
  offer?: PrivateLongTermOffer | null;
  onOfferHandled?: () => void;
} = {}) {
  const [first, setFirst] = useState<PrivateCostInputs>({...DEFAULT_COST_INPUTS});
  const [second, setSecond] = useState<PrivateCostInputs>({...DEFAULT_COST_INPUTS});
  const [horizon, setHorizon] = useState('5');
  const [rentStress, setRentStress] = useState('3');
  const [extrasStress, setExtrasStress] = useState('4');
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [message, setMessage] = useState('');
  const [pendingRestore, setPendingRestore] = useState<LongTermPrivateBackup | null>(null);
  const left = readPrivateCostOption(first);
  const right = readPrivateCostOption(second);
  const years = /^(?:[1-9]|10)$/.test(horizon) && Number.isInteger(Number(horizon)) &&
    Number(horizon) >= 1 && Number(horizon) <= 10 ? Number(horizon) : null;
  const leftRows = left && years ? projectPrivateHousingCosts(left, years) : null;
  const rightRows = right && years ? projectPrivateHousingCosts(right, years) : null;
  const format = (amount: number) => new Intl.NumberFormat('nl-NL', {
    style:'currency', currency:'EUR', maximumFractionDigits:0
  }).format(amount);
  const changeFirst = (name: keyof PrivateCostInputs, value: string) => {
    setFirst(current => ({...current, [name]:value}));
    setPendingRestore(null);
    setMessage('');
  };
  const changeSecond = (name: keyof PrivateCostInputs, value: string) => {
    setSecond(current => ({...current, [name]:value}));
    setPendingRestore(null);
    setMessage('');
  };
  const rows = leftRows && rightRows
    ? leftRows.map((a,i) => ({a,b:rightRows[i]})) : [];
  const last = rows.length ? rows[rows.length - 1] : null;
  const diff = last ? last.a.cumulative - last.b.cumulative : 0;
  const budgetLimit = monthlyBudget === '' ? null : readPrivateMonthlyBudget(monthlyBudget);
  const budgetRows = budgetLimit !== null && left && right && years
    ? rows.map(({a,b})=>{
      const aCost = a.monthlyRent + left.extras;
      const bCost = b.monthlyRent + right.extras;
      return {year:a.year, aCost, bCost,
        aGap:Math.max(0,aCost-budgetLimit),bGap:Math.max(0,bCost-budgetLimit)};
    }) : [];
  const firstYearOverBudgetA = budgetRows.find(row=>row.aGap > 0)?.year ?? null;
  const firstYearOverBudgetB = budgetRows.find(row=>row.bGap > 0)?.year ?? null;
  const budgetExcessA = budgetRows.reduce((sum,row)=>sum+row.aGap*12,0);
  const budgetExcessB = budgetRows.reduce((sum,row)=>sum+row.bGap*12,0);
  const rentBump = readPrivateStressRate(rentStress);
  const extrasBump = readPrivateStressRate(extrasStress);
  const stressReady = Boolean(left && right && years && rentBump !== null && extrasBump !== null);
  // Both homes face the same *additional* user-chosen stress; no invented official cap.
  const stressVariants = stressReady && left && right && years && rentBump !== null && extrasBump !== null
    ? ([
      {id:'base', name:'Basis: jouw ingevulde aannames', rentExtra:0, extrasExtra:0},
      {id:'rent', name:'Huurstress: extra stijging in beide woningen', rentExtra:rentBump, extrasExtra:0},
      {id:'combined', name:'Gecombineerd: huur + andere woonlasten', rentExtra:rentBump, extrasExtra:extrasBump}
    ] as const).map(variant => {
      const aOption = {...left, growth:left.growth+variant.rentExtra};
      const bOption = {...right, growth:right.growth+variant.rentExtra};
      if (aOption.growth > 45 || bOption.growth > 45) return null;
      const leftRows = projectPrivateHousingCosts(aOption,years,variant.extrasExtra);
      const rightRows = projectPrivateHousingCosts(bOption,years,variant.extrasExtra);
      const finalA = leftRows[years-1].cumulative, finalB = rightRows[years-1].cumulative;
      const preferred = Math.abs(finalA-finalB)<.005 ? 'gelijk' : finalA < finalB ? 'A' : 'B';
      return {...variant,aGrowth:aOption.growth,bGrowth:bOption.growth,
        finalA,finalB,preferred,margin:Math.abs(finalA-finalB)};
    }).filter((variant): variant is NonNullable<typeof variant> => variant !== null)
    : [];
  let firstChangeYear: number | null = null;
  if (left && right) {
    let previous = left.moving - right.moving;
    for (const entry of rows) {
      const current = entry.a.cumulative - entry.b.cumulative;
      if (firstChangeYear === null && previous !== 0 && current !== 0 &&
          Math.sign(previous) !== Math.sign(current)) firstChangeYear = entry.a.year;
      previous = current;
    }
  }
  function exportBudgetCsv() {
    if (!budgetRows.length || budgetLimit === null) return;
    const csv = ['jaar;maximaal_maandbudget_eur;woning_a_maandlasten_eur;woning_b_maandlasten_eur;woning_a_boven_budget_eur_per_maand;woning_b_boven_budget_eur_per_maand',
      ...budgetRows.map(row=>[
        row.year,budgetLimit.toFixed(2),row.aCost.toFixed(2),
        row.bCost.toFixed(2),row.aGap.toFixed(2),row.bGap.toFixed(2)
      ].join(';'))].join('\r\n')+'\r\n';
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const anchor=document.createElement('a');
    anchor.href=url;anchor.download='woonpoints-eigen-maandbudgetgrens.csv';anchor.rel='noopener';
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Eigen numerieke budgetvergelijking aangeboden. Dit is geen betaalbaarheidstoets.');
  }
  function exportStressCsv() {
    if (!stressVariants.length || !years) return;
    const csv = [
      'scenario;duur_jaren;extra_huurgroei_procentpunt;andere_lasten_jaargroei_procent;huurgroei_a_procent;huurgroei_b_procent;totaal_a_eur;totaal_b_eur;verschil_a_min_b_eur',
      ...stressVariants.map(variant=>[
        variant.id,years,variant.rentExtra.toFixed(2),variant.extrasExtra.toFixed(2),
        variant.aGrowth.toFixed(2),variant.bGrowth.toFixed(2),variant.finalA.toFixed(2),
        variant.finalB.toFixed(2),(variant.finalA-variant.finalB).toFixed(2)
      ].join(';'))
    ].join('\r\n')+'\r\n';
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href=url;
    anchor.download='woonpoints-eigen-kostenstresstabel.csv';
    anchor.rel='noopener';
    document.body.appendChild(anchor);anchor.click();anchor.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Eigen stresstabel als numerieke CSV aangeboden. Geen voorspelling of wettelijk maximum.');
  }
  function saveCompleteBackup() {
    if (!left || !right || !years ||
        (monthlyBudget !== '' && budgetLimit === null) ||
        readPrivateStressRate(rentStress) === null ||
        readPrivateStressRate(extrasStress) === null) return;
    const json = JSON.stringify({
      format:'woonpoints-longterm-private-v3', years:horizon,
      first:{...first}, second:{...second},
      rentStress,extrasStress,monthlyBudget
    },null,2) + '\n';
    const url = URL.createObjectURL(new Blob([json], {type:'application/json;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'woonpoints-prive-meerjarenkosten.json';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url),2000);
    setMessage('Volledige meerjarenscenario’s aangeboden voor eigen opslag; een cloudmap kan synchroniseren.');
  }
  async function prepareLongTermRestore(file: File | undefined) {
    setPendingRestore(null);
    if (!file) return;
    if (file.size === 0 || file.size > 16384) {
      setMessage('Herstelbestand geweigerd: maximaal 16 KiB toegestaan.');
      return;
    }
    try {
      const incoming = decodeLongTermPrivateBackup(await file.text());
      if (!incoming) throw new Error('invalid');
      setPendingRestore(incoming);
      setMessage('Geldig eigen scenario-bestand. Huidige bedragen blijven behouden tot je vervanging bevestigt.');
    } catch {
      setMessage('Herstelbestand geweigerd: onjuist formaat of ongeldig bedrag. De huidige cijfers blijven behouden.');
    }
  }
  function exportProjection() {
    if (!left || !right || !years || !last) return;
    const lines = [
      'jaar;optie_a_maandhuur_eur;optie_b_maandhuur_eur;optie_a_jaarlasten_eur;optie_b_jaarlasten_eur;optie_a_cumulatief_eur;optie_b_cumulatief_eur',
      ...rows.map(({a,b}) => [a.year,a.monthlyRent,b.monthlyRent,a.yearly,b.yearly,a.cumulative,b.cumulative]
        .map(value => typeof value === 'number' ? value.toFixed(2) : value).join(';'))
    ];
    // Only fixed numeric fields are exported: no spreadsheet formulas or personal labels.
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'], {type:'text/csv;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'woonpoints-hypothetische-meerjarenkosten.csv';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMessage('CSV aangeboden voor eigen opslag; een cloudmap kan dit bestand synchroniseren.');
  }
  const inputFields = [
    {name:'rent', label:'Maandhuur nu (€)', min:1, max:20000},
    {name:'extras', label:'Andere vaste maandelijkse woonlasten (€)', min:0, max:20000},
    {name:'moving', label:'Eenmalige verhuis-/startkosten (€)', min:0, max:50000},
    {name:'growth', label:'Zelf gekozen jaarlijkse huurstijging (%)', min:0, max:25}
  ] as const;
  return (
    <section className="panel private-budget" aria-labelledby="private-longterm-title">
      <div>
        <p className="eyebrow">PRIVÉ SCENARIO · ALLEEN IN JE BROWSER</p>
        <h2 id="private-longterm-title">Wat kosten twee woningen over meerdere jaren?</h2>
        <p>Vergelijk je eigen aannames over huur, vaste bijkomende lasten,
          verhuiskosten en een jaarlijks samengestelde huurstijging.
          Dit is een losse rekenhulp: neem je eigen bedragen over uit de
          eerdere vergelijking als je die wilt gebruiken.</p>
        <p><strong>Geen huurprognose of juridisch advies.</strong> Huurstijgingen zijn
          hypothetisch; wettelijke plafonds, contractafspraken, inflatie,
          energieprijzen, toeslagen en inkomensverandering worden niet voorspeld.
          Niets wordt opgeslagen, verstuurd of gekoppeld aan WoningNet.</p>
      </div>
      <div>
        {offer && <div className="month-csv-confirm" role="group"
          aria-label="Bevestig overname eigen kostenramingen naar meerjarenvergelijking">
          <h3>Overnemen uit je eigen kostenvergelijking?</h3>
          <p><strong>{offer.sourceLabels[0]}</strong> en <strong>{offer.sourceLabels[1]}</strong>
            {' '}zijn alleen jouw eigen momentopnamen, geen gecontroleerde
            huurprijzen. Overnemen vervangt beide huidige meerjarenscenario’s;
            jouw zelfgekozen vergelijkingsduur blijft behouden.</p>
          <p>Overgenomen worden uitsluitend de eigen huur, gecombineerde
            service-/energie-/reiskosten en eenmalige startkosten.
            De huurstijging begint in beide scenario’s bewust op 0%.
            Je moet de toekomstige stijging daarna zelf aanpassen.</p>
          <div className="month-history-actions">
            <button type="button" onClick={() => {
              if (!readPrivateCostOption(offer.first) || !readPrivateCostOption(offer.second)) {
                setMessage('Overname geweigerd: ongeldige overgedragen bedragen.');
                onOfferHandled?.();
                return;
              }
              setFirst({...offer.first});
              setSecond({...offer.second});
              setMessage('Beide eigen bedragen bewust overgenomen. Huurstijging staat op 0%; pas die zelf aan.');
              onOfferHandled?.();
            }}>Ja, vervang beide meerjarenscenario’s</button>
            <button type="button" onClick={() => {
              onOfferHandled?.();
              setMessage('Overname geannuleerd. Je meerjarenscenario’s zijn behouden.');
            }}>Behoud huidige cijfers</button>
          </div>
        </div>}
        <div className="private-budget-grid">
          {([{title:'Woning A',value:first,update:changeFirst},
             {title:'Woning B',value:second,update:changeSecond}] as const).map(item => (
            <fieldset key={item.title}>
              <legend>{item.title}</legend>
              {inputFields.map(field => (
                <label key={field.name} style={{display:'block',marginBottom:12}}>
                  {field.label}
                  <input aria-label={item.title + ' · ' + field.label}
                    type="number" inputMode="decimal" step="0.01"
                    min={field.min} max={field.max}
                    value={item.value[field.name]}
                    onChange={e => item.update(field.name,e.target.value)} />
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <label style={{display:'block',marginTop:14}}>
          Vergelijkingsduur in volledige jaren (1–10)
          <input type="number" min="1" max="10" step="1" value={horizon}
            onChange={e => {setHorizon(e.target.value);setMessage('');}} />
        </label>
        {(!left || !right || !years) && <p role="status">Vul voor beide woningen een geldige
          maandhuur (€1–€20.000), overige maandlasten (€0–€20.000),
          verhuiskosten (€0–€50.000), huurstijging (0–25%) en duur (1–10 jaar) in.
          Een komma of punt voor centen is toegestaan.</p>}
        <div className="private-budget-provenance" aria-labelledby="private-budget-ceiling-title">
          <h3 id="private-budget-ceiling-title">Past dit binnen jouw eigen maandbudget?</h3>
          <p>Vul eventueel jouw maximale woonuitgaven per maand in. Bekijk per
            jaar of de <strong>basisraming</strong> (huur + overige vaste
            woonlasten) van A of B dit bedrag overschrijdt.
            De eenmalige verhuiskosten tellen niet mee in deze maandbudgetgrens.
            Er wordt geen inkomen of recht op huurtoeslag gecontroleerd.</p>
          <label htmlFor="private-housing-budget-ceiling">Zelf gekozen maximaal
            maandbedrag (€1–€50.000, laat leeg om niets te berekenen)
            <input id="private-housing-budget-ceiling" type="number"
              inputMode="decimal" min="1" max="50000" step=".01"
              value={monthlyBudget} onChange={event=>{
                setMonthlyBudget(event.target.value);
                setPendingRestore(null);
                setMessage('');
              }} />
          </label>
          {monthlyBudget !== '' && budgetLimit === null &&
            <p role="status">Vul een geldig maandbedrag in tussen €1 en €50.000,
              met maximaal twee decimalen.</p>}
          {budgetRows.length > 0 ? <>
            <p><strong>Woning A:</strong> {firstYearOverBudgetA === null ?
              'Geen overschrijding in de gekozen jaren' :
              'Vanaf jaar '+firstYearOverBudgetA+' boven jouw maandgrens'}.
              {' '}Opgetelde theoretische overschrijding: {format(budgetExcessA)}.</p>
            <p><strong>Woning B:</strong> {firstYearOverBudgetB === null ?
              'Geen overschrijding in de gekozen jaren' :
              'Vanaf jaar '+firstYearOverBudgetB+' boven jouw maandgrens'}.
              {' '}Opgetelde theoretische overschrijding: {format(budgetExcessB)}.</p>
            <div className="private-budget-table-wrap">
              <table>
                <caption>Eigen maandbudget ten opzichte van vaste woonlasten in
                  elk basisramingsjaar, zonder inkomenstoets</caption>
                <thead><tr><th scope="col">Jaar</th>
                  <th scope="col">A maandlasten</th><th scope="col">B maandlasten</th>
                  <th scope="col">A boven grens p/m</th>
                  <th scope="col">B boven grens p/m</th></tr></thead>
                <tbody>{budgetRows.map(row=><tr key={row.year}>
                  <th scope="row">{row.year}</th>
                  <td>{format(row.aCost)}</td><td>{format(row.bCost)}</td>
                  <td>{format(row.aGap)}</td><td>{format(row.bGap)}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <button type="button" onClick={exportBudgetCsv}>
              Bewaar deze eigen maandbudgetgrenzen als numerieke CSV…
            </button>
          </> : monthlyBudget === '' ? <p>Optioneel: kies een eigen
            budgetgrens om jaarlijkse overschrijdingen zichtbaar te maken.</p> :
            <p>Voor de vergelijking zijn beide geldige woningen, een periode
              en een geldig maximaal maandbudget nodig.</p>}
          <p>Een overschrijding is een <strong>eigen rekenkundige signalering</strong>,
            geen officiële afwijzing. Werkelijke energietarieven, reiskosten,
            toeslagen, inkomsten en contractwijzigingen kunnen afwijken.</p>
        </div>
        <div className="private-budget-provenance" aria-labelledby="private-stress-title">
          <h3 id="private-stress-title">Hoe gevoelig is jouw vergelijking voor kostenstijgingen?</h3>
          <p>Vergelijk dezelfde twee woningen in drie uitdrukkelijk hypothetische
            scenario’s, zonder je oorspronkelijke bedragen te veranderen.
            Het extra percentage wordt boven op de jaarlijks gekozen
            huurstijging van beide woningen geteld; bij gecombineerde
            kostenstress stijgen ook de overige maandlasten ieder jaar
            samengesteld. Startkosten blijven eenmalig in jaar één.</p>
          <div className="private-budget-grid">
            <label htmlFor="private-rent-stress">Extra jaarlijkse huurstijging voor
              beide woningen (procentpunten, 0–20)
              <input id="private-rent-stress" type="number" inputMode="decimal"
                min="0" max="20" step=".01" value={rentStress}
                onChange={event=>{setRentStress(event.target.value);setMessage('');}} />
            </label>
            <label htmlFor="private-extras-stress">Jaarlijkse stijging andere
              woonlasten in gecombineerd scenario (%, 0–20)
              <input id="private-extras-stress" type="number" inputMode="decimal"
                min="0" max="20" step=".01" value={extrasStress}
                onChange={event=>{setExtrasStress(event.target.value);setMessage('');}} />
            </label>
          </div>
          {stressReady && stressVariants.length===3 ? <>
            <div className="private-budget-table-wrap">
              <table>
                <caption>Eigen scenario’s over {years} jaar: geschatte cumulatieve
                  uitgaven, geen officiële huurstijgingsprognose</caption>
                <thead><tr>
                  <th scope="col">Scenario</th><th scope="col">Woning A totaal</th>
                  <th scope="col">Woning B totaal</th>
                  <th scope="col">Verschil</th><th scope="col">Goedkoper</th>
                </tr></thead>
                <tbody>{stressVariants.map(variant=><tr key={variant.id}>
                  <th scope="row">{variant.name}</th>
                  <td>{format(variant.finalA)}</td><td>{format(variant.finalB)}</td>
                  <td>{format(variant.margin)}</td>
                  <td>{variant.preferred === 'gelijk' ? 'Even hoog' :
                    'Woning '+variant.preferred}</td>
                </tr>)}</tbody>
              </table>
            </div>
            {stressVariants[0].preferred !== stressVariants[2].preferred &&
              <p role="status"><strong>Let op:</strong> de woning met de laagste
                geraamde totale kosten verandert tussen je basis- en
                gecombineerde scenario. Bekijk zelf welke aannames realistisch zijn.</p>}
            <button type="button" onClick={exportStressCsv}>
              Bewaar de drie scenario’s als eigen numerieke CSV…
            </button>
          </> : <p role="status">Vul eerst beide geldige woningen, de periode en
            extra percentages tussen 0 en 20 in. De som van de basishuurgroei
            en de extra huurstijging mag in dit rekenmodel maximaal 45% zijn.</p>}
          <p>Deze stresstest is een scenariovergelijking, <strong>geen advies of
            verwachting</strong>. Wettelijke huurverhogingen, contracten,
            toeslagen, inkomensverandering of energieprijzen zijn niet bekend.
            Alle handmatige scenario- en stressvelden worden in de nieuwe
            privé-JSON v3 opgeslagen; oude versie-1- en versie-2-back-ups blijven leesbaar
            met 3 en 4 procent als expliciet herkenbare standaardstresswaarden.</p>
        </div>
        <div className="private-budget-provenance">
          <h3>Volledige privévergelijking bewaren of terugzetten</h3>
          <p>Bewaar op eigen verzoek zowel woning A/B, alle zelfgekozen bedragen,
            de jaarlijkse stijgingen en de vergelijkingsduur als JSON. Dit
            bevat financiële privégegevens; de gekozen opslaglocatie kan
            buiten Woonpoints synchroniseren. Er is geen automatische opslag.</p>
          <button type="button" onClick={saveCompleteBackup}
            disabled={!left || !right || !years ||
              rentBump === null || extrasBump === null ||
              (monthlyBudget !== '' && budgetLimit === null)}>
            Bewaar volledige meerjarenvergelijking als JSON…
          </button>
          <label htmlFor="longterm-private-import">Open eerdere Woonpoints-JSON
            (maximaal 16 KiB)</label>
          <input type="file" id="longterm-private-import"
            accept=".json,application/json" onChange={e => {
              const file = e.currentTarget.files?.[0];
              e.currentTarget.value = '';
              void prepareLongTermRestore(file);
            }} />
          {pendingRestore && <div className="month-csv-confirm" role="group"
            aria-label="Bevestig volledige privé-meerjarenrestore">
            <p>Vervang alle bestaande A/B-bedragen, stijgingspercentages,
              beide stressinstellingen, de eigen maandbudgetgrens en de
              gekozen vergelijkingsduur door dit
              privébestand? De
              gegevens zijn niet officieel gecontroleerd.</p>
            <div className="month-history-actions">
              <button type="button" onClick={() => {
                setFirst({...pendingRestore.first});
                setSecond({...pendingRestore.second});
                setHorizon(pendingRestore.years);
                setRentStress(pendingRestore.rentStress);
                setExtrasStress(pendingRestore.extrasStress);
                setMonthlyBudget(pendingRestore.monthlyBudget);
                setPendingRestore(null);
                setMessage('Eigen meerjarenvergelijking bewust hersteld. Controleer alle aannames zelf.');
              }}>Ja, vervang mijn volledige vergelijking</button>
              <button type="button" onClick={() => {
                setPendingRestore(null);
                setMessage('Herstel geannuleerd: huidige meerjarencijfers behouden.');
              }}>Behoud huidige cijfers</button>
            </div>
          </div>}
        </div>
        {last && <div className="private-budget-provenance" aria-live="polite">
          <h3>Na {years} jaar</h3>
          <p>Totale geschatte uitgaven inclusief eenmalige startkosten:
            <strong> A {format(last.a.cumulative)}</strong> en
            <strong> B {format(last.b.cumulative)}</strong>.</p>
          <p>{Math.abs(diff) < 0.005 ? 'Beide scenario’s kosten in deze berekening evenveel.'
            : (diff < 0 ? 'A' : 'B') + ' is ' + format(Math.abs(diff)) +
              ' goedkoper over de gekozen periode.'}</p>
          {firstChangeYear !== null && <p>De volgorde van cumulatieve kosten
            verandert voor het eerst in jaar {firstChangeYear}. Dit is geen maandexact
            omslagpunt.</p>}
          <div className="private-budget-table-wrap">
            <table>
              <caption>Jaarlijkse schatting met samengestelde huurstijging, vaste overige woonlasten en verhuiskosten uitsluitend in het startjaar</caption>
              <thead><tr>
                <th scope="col">Jaar</th><th scope="col">A maandhuur</th><th scope="col">B maandhuur</th>
                <th scope="col">A jaarlasten</th><th scope="col">B jaarlasten</th>
                <th scope="col">A totaal t/m jaar</th><th scope="col">B totaal t/m jaar</th>
              </tr></thead>
              <tbody>{rows.map(({a,b}) => <tr key={a.year}>
                <th scope="row">{a.year}</th><td>{format(a.monthlyRent)}</td>
                <td>{format(b.monthlyRent)}</td><td>{format(a.yearly)}</td>
                <td>{format(b.yearly)}</td><td>{format(a.cumulative)}</td>
                <td>{format(b.cumulative)}</td>
              </tr>)}</tbody>
            </table>
          </div>
          <button type="button" onClick={exportProjection}>Bewaar deze cijfers als CSV…</button>
          <button type="button" onClick={() => {
            setFirst({...DEFAULT_COST_INPUTS});setSecond({...DEFAULT_COST_INPUTS});
            setHorizon('5');setRentStress('3');setExtrasStress('4');
            setMonthlyBudget('');
            setPendingRestore(null);
            setMessage('Alle handmatige meerjarenbedragen gewist.');
          }}>Wis beide scenario’s</button>
          <p>Deze berekening indexeert alleen de ingevulde huur; andere woonlasten
            blijven gelijk. Er wordt niet aangenomen dat de eigen huurstijging
            daadwerkelijk mag of zal plaatsvinden.</p>
        </div>}
        {message && <p role="status">{message}</p>}
      </div>
    </section>
  );
}


/** A standalone, evidence-free, user-controlled viewing checklist for two private options. */
type PrivateViewingRating = 'unknown' | 'good' | 'concern' | 'bad';
type PrivateViewingAnswer = { must: boolean; a: PrivateViewingRating; b: PrivateViewingRating };
const PRIVATE_VIEWING_TOPICS = [
  {id:'ventilation', label:'Ventilatie en frisse lucht'},
  {id:'damp', label:'Zichtbaar vocht of schimmel'},
  {id:'noise', label:'Geluid van buiten en buren'},
  {id:'light', label:'Daglicht en privacy'},
  {id:'condition', label:'Staat van keuken en sanitair'},
  {id:'windows', label:'Ramen, tocht en isolatie'},
  {id:'safety', label:'Veilige toegang en verlichting'},
  {id:'storage', label:'Berging en praktische ruimte'},
  {id:'travel', label:'Eigen reistijd en bereikbaarheid'},
  {id:'outdoor', label:'Buitenruimte en omgeving'}
] as const;
const PRIVATE_VIEWING_RATINGS: PrivateViewingRating[] = ['unknown','good','concern','bad'];
const newPrivateViewingAnswers = (): PrivateViewingAnswer[] =>
  PRIVATE_VIEWING_TOPICS.map(() => ({must:false,a:'unknown',b:'unknown'}));

export function PrivateHousingViewingChecklist({offer, onOfferHandled, onPlanFollowup}: {
  offer?: [string,string] | null;
  onOfferHandled?: () => void;
  onPlanFollowup?: (label:string) => void;
} = {}) {
  const [entries, setEntries] = useState<PrivateViewingAnswer[]>(newPrivateViewingAnswers);
  const [sourceLabels, setSourceLabels] = useState<[string,string]>(['Woning A','Woning B']);
  const [pendingRestore, setPendingRestore] = useState<PrivateViewingAnswer[] | null>(null);
  const [message, setMessage] = useState('');
  const [issueChoice, setIssueChoice] = useState('');
  function change(index: number, field: keyof PrivateViewingAnswer, value: boolean | PrivateViewingRating) {
    setEntries(current => current.map((entry, i) =>
      i === index ? {...entry,[field]:value} : entry));
    setPendingRestore(null);
    setMessage('');
  }
  const summary = (key: 'a' | 'b') => {
    const examined = entries.filter(item => item[key] !== 'unknown');
    return {
      good: examined.filter(item => item[key] === 'good').length,
      concerns: examined.filter(item => item[key] === 'concern' || item[key] === 'bad').length,
      essential: examined.filter(item => item.must && (item[key] === 'concern' || item[key] === 'bad')).length,
      unknown: entries.length-examined.length
    };
  };
  const a = summary('a'), b = summary('b');
  const viewingFollowups = PRIVATE_VIEWING_TOPICS.flatMap((topic,index) =>
    (['a','b'] as const).flatMap(home => {
      const rating = entries[index][home];
      if (rating === 'good') return [];
      return [{
        key:home+'-'+topic.id, home, topic:topic.label, essential:entries[index].must,
        rating
      }];
    })).sort((a,b) => Number(b.essential)-Number(a.essential) ||
      (a.rating === 'bad' ? -1 : a.rating === 'concern' ? 0 : 1) -
      (b.rating === 'bad' ? -1 : b.rating === 'concern' ? 0 : 1));
  const openEssentialFindings = PRIVATE_VIEWING_TOPICS.flatMap((topic,index) =>
    (['a','b'] as const).flatMap(home =>
      entries[index].must && (entries[index][home] === 'concern' || entries[index][home] === 'bad')
        ? [{value:home+'-'+index, home, topic}] : []
    ));
  function offerFindingToPlanner() {
    const finding = openEssentialFindings.find(item => item.value === issueChoice);
    if (!finding || !onPlanFollowup) {
      setMessage('Kies eerst één nog steeds actueel essentieel aandachtspunt.');
      return;
    }
    const source = sourceLabels[finding.home === 'a' ? 0 : 1];
    const suffix = ' · '+finding.topic.label;
    const safeLabel = source.slice(0, 64 - suffix.length) + suffix;
    if (!safeLabel.trim() || safeLabel.length > 64) {
      setMessage('Ongeldig label. Gebruik neutrale kortere woningnamen.');
      return;
    }
    onPlanFollowup(safeLabel);
    setMessage('Eigen vervolgpunt aangeboden aan planner. Bevestig daar eerst; kies daarna zelf datum/tijd.');
    document.getElementById('private-plan-title')?.scrollIntoView({block:'start'});
  }
  function exportViewingBrief() {
    const printable: Record<PrivateViewingRating,string> = {
      unknown:'NIET BEOORDEELD', good:'Positief', concern:'Verder onderzoeken',
      bad:'Ongunstig'
    };
    // The document deliberately uses fixed A/B identifiers, never typed
    // source labels, property addresses, free text or account data.
    const lines = [
      'WOONPOINTS - MIJN EIGEN BEZICHTIGINGS- EN BESPREKLIJST',
      'Zelf genoteerde indrukken; geen officiële keuring of woningkans.',
      'Woningen heten in dit bestand alleen A en B, zonder persoons- of adresgegevens.',
      '',
      'EIGEN OVERZICHT',
      'A: '+a.good+' positief; '+a.concerns+' aandachtspunten; '+a.essential+
        ' essentieel aandachtspunten; '+a.unknown+' onbekend.',
      'B: '+b.good+' positief; '+b.concerns+' aandachtspunten; '+b.essential+
        ' essentieel aandachtspunten; '+b.unknown+' onbekend.',
      '',
      'PER ONDERDEEL (niet beoordeeld blijft onbekend)'
    ];
    PRIVATE_VIEWING_TOPICS.forEach((topic,index) => {
      const item = entries[index];
      lines.push(topic.label + (item.must ? ' [voor mij essentieel]' : ''));
      lines.push('  A: '+printable[item.a]+'; B: '+printable[item.b]);
    });
    lines.push('','ZELF NOG TE CONTROLEREN / BESPREKEN');
    if (!viewingFollowups.length) lines.push('Geen eigen open punten genoteerd.');
    else viewingFollowups.forEach(row => {
      lines.push((row.essential ? '[ESSENTIEEL] ' : '')+
        'Woning '+row.home.toUpperCase()+' - '+row.topic+' - '+
        printable[row.rating]);
    });
    lines.push('','Dit document bevat alleen de huidige lokale keuzes.');
    lines.push('Geen woning is door Woonpoints geïnspecteerd of geverifieerd.');
    lines.push('Niet beoordeeld betekent niet dat iets in orde is.');
    lines.push('De gekozen bestandslocatie kan het TXT-bestand elders synchroniseren.');
    const content = lines.join('\n')+'\n';
    if (new TextEncoder().encode(content).byteLength > 8192) {
      setMessage('Bespreeklijst is te groot om veilig te exporteren.');
      return;
    }
    downloadPrivatePlanFile(content,'text/plain;charset=utf-8',
      'woonpoints-eigen-bezichtigings-bespreeklijst.txt');
    setMessage('Eigen bespreeklijst aangeboden om te bewaren. Geen account- of woninglabels geëxporteerd.');
  }
  function exportJson() {
    const payload = {
      format:'woonpoints-private-viewing-v1',
      entries:entries.map((row, i) => ({id:PRIVATE_VIEWING_TOPICS[i].id,
        must:row.must,a:row.a,b:row.b}))
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],
      {type:'application/json;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'woonpoints-prive-bezichtigingschecklist.json';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url),2000);
    setMessage('Eigen checklist als JSON aangeboden voor bewuste lokale opslag.');
  }
  async function prepareRestore(file: File | undefined) {
    setPendingRestore(null);
    if (!file) return;
    if (file.size === 0 || file.size > 8192) {
      setMessage('Bestand geweigerd: maximaal 8 KiB toegestaan.');
      return;
    }
    try {
      const json: unknown = JSON.parse(await file.text());
      if (!json || typeof json !== 'object' || Array.isArray(json)) throw Error('object');
      const root = json as Record<string,unknown>;
      if (Object.keys(root).sort().join('|') !== 'entries|format' ||
          root.format !== 'woonpoints-private-viewing-v1' || !Array.isArray(root.entries) ||
          root.entries.length !== PRIVATE_VIEWING_TOPICS.length) throw Error('format');
      const restored: PrivateViewingAnswer[] = root.entries.map((candidate: unknown, i: number) => {
        if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
          throw Error('row');
        const row = candidate as Record<string,unknown>;
        if (Object.keys(row).sort().join('|') !== 'a|b|id|must' ||
            row.id !== PRIVATE_VIEWING_TOPICS[i].id ||
            typeof row.must !== 'boolean' ||
            !PRIVATE_VIEWING_RATINGS.includes(row.a as PrivateViewingRating) ||
            !PRIVATE_VIEWING_RATINGS.includes(row.b as PrivateViewingRating)) throw Error('rating');
        return {must:row.must,a:row.a as PrivateViewingRating,b:row.b as PrivateViewingRating};
      });
      setPendingRestore(restored);
      setMessage('Geldig privébestand gelezen. De huidige checklist blijft behouden tot je vervangen bevestigt.');
    } catch {
      setMessage('Bestand geweigerd: alleen een ongewijzigd Woonpoints-checklistformaat wordt geaccepteerd.');
    }
  }
  const ratings = [
    {value:'unknown',label:'Niet beoordeeld'},
    {value:'good',label:'Goed'},
    {value:'concern',label:'Twijfel / verder uitzoeken'},
    {value:'bad',label:'Ongunstig'}
  ] as const;
  return (
    <section className="panel private-budget" aria-labelledby="private-viewing-title">
      <div>
        <p className="eyebrow">EIGEN BEZICHTIGING · PRIVÉ BESLISSTEUN</p>
        <h2 id="private-viewing-title">Vergelijk wat je zelf hebt gezien</h2>
        <p>Beoordeel tien praktische punten voor woning A en B. Markeer wat voor
          jou essentieel is. Onbekende punten blijven onbekend; Woonpoints raadt
          geen ontbrekende staat, veiligheid of toekomstige geschiktheid.</p>
        <p><strong>Geen officiële keuring of selectieadvies.</strong> Gebruik geen
          adressen, namen, accounts of persoonlijke notities in dit hulpmiddel.
          De checklist blijft alleen in dit browsertabblad, tenzij je bewust
          zelf een JSON-bestand opslaat.</p>
      </div>
      <div>
        {offer && <div className="month-csv-confirm" role="group"
          aria-label="Bevestig eigen woningselectie voor bezichtiging">
          <h3>Gebruik je eigen shortlist-woningen?</h3>
          <p>Je hebt <strong>{offer[0]}</strong> en <strong>{offer[1]}</strong>
            {' '}zelf geselecteerd. Deze labels zijn niet officieel geverifieerd.
            Toepassen zet <strong>alle tien eerdere beoordelingen en essentiële keuzes terug
            op niet beoordeeld</strong> om foutieve toewijzing te voorkomen.
            De namen blijven alleen in dit tabblad en worden niet meegeëxporteerd.</p>
          <div className="month-history-actions">
            <button type="button" onClick={() => {
              setEntries(newPrivateViewingAnswers());
              setPendingRestore(null);
              setSourceLabels([offer[0],offer[1]]);
              setMessage('Eigen woninglabels overgenomen en alle eerdere beoordelingen gewist; geen WoningNet-bewijs.');
              onOfferHandled?.();
            }}>Gebruik selectie en wis oude beoordelingen</button>
            <button type="button" onClick={() => {
              setMessage('Overname geannuleerd. Huidige beoordelingen zijn behouden.');
              onOfferHandled?.();
            }}>Behoud huidige checklist</button>
          </div>
        </div>}
        <div className="private-budget-table-wrap">
          <table>
            <caption>Eigen indrukken; niet door WoningNet of een inspecteur gecontroleerd</caption>
            <thead><tr><th scope="col">Praktisch punt</th><th scope="col">Essentieel</th>
              <th scope="col">{sourceLabels[0]}</th><th scope="col">{sourceLabels[1]}</th></tr></thead>
            <tbody>{PRIVATE_VIEWING_TOPICS.map((topic, index) => (
              <tr key={topic.id}>
                <th scope="row">{topic.label}</th>
                <td><input type="checkbox" checked={entries[index].must}
                  aria-label={'Essentieel voor mij: '+topic.label}
                  onChange={e => change(index,'must',e.target.checked)} /></td>
                {(['a','b'] as const).map(home => (
                  <td key={home}>
                    <select value={entries[index][home]}
                      aria-label={sourceLabels[home === 'a' ? 0 : 1]+' · '+topic.label}
                      onChange={e => change(index,home,e.target.value as PrivateViewingRating)}>
                      {ratings.map(rating => <option key={rating.value}
                        value={rating.value}>{rating.label}</option>)}
                    </select>
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div aria-live="polite">
          {([{label:'A',data:a},{label:'B',data:b}]).map(row => (
            <p key={row.label}><strong>{sourceLabels[row.label === 'A' ? 0 : 1]}:</strong> {row.data.good} positief,
              {' '}{row.data.concerns} aandachtspunten (waarvan {row.data.essential} essentieel),
              {' '}{row.data.unknown} niet beoordeeld.</p>
          ))}
          {(a.essential > 0 || b.essential > 0) && (
            <p role="alert">Minstens één door jou essentieel genoemd punt is als
              twijfelachtig of ongunstig beoordeeld. Bespreek dit zelf tijdens
              de bezichtiging of met een deskundige; dit is geen afkeuring.</p>
          )}
          {(a.unknown > 0 || b.unknown > 0) &&
            <p>Niet beoordeelde punten tellen niet als goed of slecht. De
              aantallen zijn geen numerieke kwaliteitsscore of woningkans.</p>}
        </div>
        <div className="private-budget-provenance" aria-labelledby="viewing-review-brief-title">
          <h3 id="viewing-review-brief-title">Mijn persoonlijke bespreeklijst</h3>
          <p>Alles wat je nog niet hebt beoordeeld of zelf als twijfelachtig
            of ongunstig hebt gemarkeerd, blijft zichtbaar als aandachtspunt.
            Essentiële punten komen eerst; een onbekend punt telt nooit als goed.
            De lijst is geen officieel inspectierapport.</p>
          {viewingFollowups.length ? <ol>
            {viewingFollowups.map(row => <li key={row.key}>
              <strong>{row.essential ? 'Essentieel · ' : ''}
                {sourceLabels[row.home === 'a' ? 0 : 1]} · {row.topic}</strong>
              {' — '}{row.rating === 'unknown' ? 'Nog niet beoordeeld' :
                row.rating === 'bad' ? 'Ongunstig genoteerd' :
                'Twijfel, verder uitzoeken'}
            </li>)}
          </ol> : <p>Geen eigen open bespreekpunten ingevuld. Dit betekent
            niet dat de woning officieel goedgekeurd is.</p>}
          <button type="button" onClick={exportViewingBrief}>
            Bewaar volledige eigen bespreeklijst als TXT…
          </button>
          <p>Het bestand noemt alleen neutraal woning A/B, vaste onderwerpen
            en jouw beoordelingen, nooit eventuele overgenomen woninglabels,
            adressen of accountgegevens. Opslag uitsluitend na jouw klik.</p>
        </div>
        {onPlanFollowup && <div className="private-budget-provenance">
          <h3>Maak een eigen vervolgactie van een belangrijk aandachtspunt</h3>
          <p>Alleen door jou als essentieel en twijfelachtig/ongunstig beoordeelde
            punten staan hieronder. Kies er maximaal één om aan je privéplanner
            aan te bieden. Dit regelt geen officiële bezichtiging of herstel
            en voegt niets automatisch aan je planning toe.</p>
          <label htmlFor="viewing-issue-to-plan">Mijn vervolgpunt</label>
          <select id="viewing-issue-to-plan" value={openEssentialFindings.some(x => x.value === issueChoice) ? issueChoice : ''}
            onChange={e => setIssueChoice(e.target.value)}>
            <option value="">Kies een essentieel aandachtspunt…</option>
            {openEssentialFindings.map(item =>
              <option value={item.value} key={item.value}>
                {sourceLabels[item.home === 'a' ? 0 : 1]} · {item.topic.label}
              </option>)}
          </select>
          <button type="button" disabled={!openEssentialFindings.length}
            onClick={offerFindingToPlanner}>Bied dit punt aan de privéplanner aan ↓</button>
          <p>De planner laat je apart bevestigen en vraagt altijd zelf een
            datum en tijd. De inspectie blijft ongewijzigd.</p>
        </div>}
        <div className="month-history-actions">
          <button type="button" onClick={exportJson}>Bewaar checklist als privé-JSON…</button>
          <button type="button" onClick={() => {
            setEntries(newPrivateViewingAnswers());
            setPendingRestore(null);
            setMessage('Alle eigen beoordelingen in dit tabblad gewist; twee lokale woninglabels behouden.');
          }}>Wis beoordelingen</button>
        </div>
        <label style={{display:'block',marginTop:12}} htmlFor="private-viewing-restore">
          Open eerdere privéchecklist (JSON, max. 8 KiB)
        </label>
        <input id="private-viewing-restore" type="file" accept=".json,application/json"
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            void prepareRestore(file);
          }} />
        {pendingRestore && <div className="month-csv-confirm" role="group"
          aria-label="Bevestig checklist vervangen">
          <p>De tien beoordeelde onderdelen van dit bestand vervangen alle
            huidige beoordelingen en essentieelkeuzes in dit tabblad.
            De opgeslagen checklist bevat geen woninglabels; bij herstel
            worden die bewust teruggezet op neutraal Woning A en Woning B.</p>
          <button type="button" onClick={() => {
            setEntries(pendingRestore);
            setSourceLabels(['Woning A','Woning B']);
            setPendingRestore(null);
            setMessage('Eigen privéchecklist hersteld met neutrale woninglabels; de bron is niet extern gecontroleerd.');
          }}>Vervang huidige checklist</button>
          <button type="button" onClick={() => {
            setPendingRestore(null);setMessage('Herstel geannuleerd: huidige checklist behouden.');
          }}>Behoud huidige checklist</button>
        </div>}
        {message && <p role="status">{message}</p>}
        <p>Een handmatig gekozen opslaglocatie kan synchroniseren buiten
          Woonpoints. Je importeert uitsluitend op eigen verzoek en bevestigt
          apart voordat huidige beoordelingen worden vervangen. De JSON
          bevat alleen scores voor A/B; woninglabels blijven bewust buiten
          het bestand, ook bij een uit je shortlist overgenomen selectie.</p>
      </div>
    </section>
  );
}


/** Entirely voluntary snapshots: not synced, verified or awarded WoningNet points. */
type PrivatePointsEntry = {month: string; points: number};
const PRIVATE_POINTS_MAX = 36;
const PRIVATE_POINTS_ARCHIVE = 'woonpoints-private-points-history-v1';
const privateMonthToday = () => {
  const now = new Date();
  return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
};
function privatePointsMonthValid(month: unknown) {
  return typeof month === 'string' &&
    /^(?:20\d{2})-(?:0[1-9]|1[0-2])$/.test(month) &&
    month <= privateMonthToday();
}
function privatePointsValid(entries: unknown): entries is PrivatePointsEntry[] {
  if (!Array.isArray(entries) || entries.length > PRIVATE_POINTS_MAX) return false;
  const months = new Set<string>();
  for (const raw of entries) {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return false;
    const entry = raw as Record<string,unknown>;
    if (Object.keys(entry).sort().join('|') !== 'month|points' ||
        !privatePointsMonthValid(entry.month) ||
        typeof entry.points !== 'number' ||
        !Number.isSafeInteger(entry.points) || entry.points < 0 || entry.points > 10000 ||
        months.has(entry.month as string)) return false;
    months.add(entry.month as string);
  }
  return true;
}
function privatePointsDecodeArchive(raw: string): PrivatePointsEntry[] | null {
  if (!raw || new TextEncoder().encode(raw).byteLength > 16384) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const obj = parsed as Record<string,unknown>;
    if (Object.keys(obj).sort().join('|') !== 'entries|format' ||
        obj.format !== PRIVATE_POINTS_ARCHIVE ||
        !privatePointsValid(obj.entries) || !obj.entries.length) return null;
    return [...obj.entries].sort((a,b) => a.month.localeCompare(b.month));
  } catch {
    return null;
  }
}
function privatePointsDecodeCsv(raw: string): PrivatePointsEntry[] | null {
  if (!raw || new TextEncoder().encode(raw).byteLength > 4096 ||
      /[^\x0A\x0D\x20-\x7E]/.test(raw)) return null;
  // Only ASCII ISO-like month + integer; no labels, formulas, or spreadsheet directives.
  const normalized = raw.replace(/\r\n/g,'\n');
  if (normalized.includes('\r')) return null;
  const lines = (normalized.endsWith('\n')
    ? normalized.slice(0,-1) : normalized).split('\n');
  if (lines[0] !== 'month,points' ||
      lines.length < 2 || lines.length > PRIVATE_POINTS_MAX + 1) return null;
  const parsed: PrivatePointsEntry[] = [];
  for (const line of lines.slice(1)) {
    if (!/^20\d{2}-(?:0[1-9]|1[0-2]),(?:0|[1-9]\d{0,4})$/.test(line)) return null;
    const [month,value] = line.split(',');
    parsed.push({month,points:Number(value)});
  }
  if (!privatePointsValid(parsed)) return null;
  return parsed.sort((a,b)=>a.month.localeCompare(b.month));
}
function downloadPrivatePointsCsv(rows: PrivatePointsEntry[]) {
  const content = ['month,points',...rows.map(row=>row.month+','+String(row.points))]
    .join('\r\n')+'\r\n';
  // CSV columns are strictly numeric/canonical month: cannot begin with a formula.
  const url = URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'woonpoints-eigen-zoekpunten.csv';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function downloadPrivatePointsArchive(rows: PrivatePointsEntry[]) {
  const content = JSON.stringify({format:PRIVATE_POINTS_ARCHIVE,entries:rows},null,2)+'\n';
  const url = URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'woonpoints-eigen-zoekpunten.json';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url),2000);
}

/** Personal historical notes only; cannot register or verify points on a housing portal. */
export function PrivateSearchPointsHistory({onPointsSnapshot}:{
  onPointsSnapshot?: (snapshot:PrivatePointsSnapshot)=>void;
} = {}) {
  const [rows,setRows] = useState<PrivatePointsEntry[]>([]);
  const [month,setMonth] = useState(privateMonthToday);
  const [points,setPoints] = useState('');
  const [editingMonth,setEditingMonth] = useState<string|null>(null);
  const [pendingDelete,setPendingDelete] = useState<string|null>(null);
  const [pendingImport,setPendingImport] = useState<PrivatePointsEntry[]|null>(null);
  const [confirmClear,setConfirmClear] = useState(false);
  const [message,setMessage] = useState('');
  const sorted = [...rows].sort((a,b) => a.month.localeCompare(b.month));
  const monthExists = rows.some(row => row.month === month);
  const parsedPoints = /^\d{1,5}$/.test(points) ? Number(points) : NaN;
  const canSave = privatePointsMonthValid(month) && Number.isSafeInteger(parsedPoints) &&
    parsedPoints >= 0 && parsedPoints <= 10000 &&
    rows.length < PRIVATE_POINTS_MAX + (editingMonth ? 1 : 0) &&
    (!monthExists || editingMonth === month);
  const last = sorted.at(-1);
  const previous = sorted.at(-2);
  const biggest = Math.max(1,...sorted.map(row=>row.points));
  useEffect(() => {
    onPointsSnapshot?.({
      observations: sorted.length,
      last: sorted.at(-1) ?? null,
      previous: sorted.at(-2) ?? null
    });
  }, [rows,onPointsSnapshot]);
  const label = (value: string) => {
    const [year,number] = value.split('-').map(Number);
    return new Intl.DateTimeFormat('nl-NL',{month:'long',year:'numeric',timeZone:'UTC'})
      .format(new Date(Date.UTC(year,number-1,1)));
  };
  function cancelEdit() {
    setEditingMonth(null);setMonth(privateMonthToday());setPoints('');
    setMessage('Wijziging geannuleerd; bestaande notities behouden.');
  }
  function saveSnapshot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) {
      setMessage('Gebruik een geldige, unieke kalendermaand vanaf 2000 tot nu en 0–10.000 hele punten.');
      return;
    }
    // No implicit edits or overwrite of another month.
    if (editingMonth !== null && editingMonth !== month) {
      setMessage('Tijdens bewerken blijft de oorspronkelijke maand vaststaan.');
      return;
    }
    const entry = {month,points:parsedPoints};
    setRows(previousRows => editingMonth
      ? previousRows.map(item => item.month === editingMonth ? entry : item)
      : [...previousRows,entry]);
    setEditingMonth(null);
    setPoints('');
    setMessage('Eigen, ongeverifieerde maandnotitie bijgewerkt. Niets online gecontroleerd of opgeslagen.');
  }
  async function selectCsvArchive(file: File|undefined) {
    setPendingImport(null);
    if (!file) return;
    if (file.size < 1 || file.size > 4096) {
      setMessage('CSV geweigerd: maximaal 4 KiB toegestaan.');
      return;
    }
    try {
      const imported = privatePointsDecodeCsv(await file.text());
      if (!imported) throw new Error('invalid');
      setPendingImport(imported);
      setMessage('Eigen CSV gelezen; bevestig apart of je de huidige maandstanden wilt vervangen.');
    } catch {
      setMessage('CSV geweigerd: gebruik exact month,points en geldige unieke maand,gehele-punten-regels. Huidige notities behouden.');
    }
  }
  async function selectArchive(file: File|undefined) {
    setPendingImport(null);
    if (!file) return;
    if (file.size < 1 || file.size > 16384) {
      setMessage('Bestand geweigerd: gebruik eigen Woonpoints-JSON tot maximaal 16 KiB.');
      return;
    }
    try {
      const imported = privatePointsDecodeArchive(await file.text());
      if (!imported) throw new Error('invalid');
      setPendingImport(imported);
      setMessage('Geldig privébestand. Bevestig apart of de huidige notities mogen worden vervangen.');
    } catch {
      setMessage('Bestand geweigerd: verkeerde versie, dubbele maanden of ongeldige punten. Bestaande notities behouden.');
    }
  }
  return <section className="panel private-points" aria-labelledby="private-points-heading">
    <div>
      <p className="eyebrow">PRIVÉ ZOEKPUNTEN · ALLEEN EIGEN WAARNEMINGEN</p>
      <h2 id="private-points-heading">Hoe verandert je zelf genoteerde zoekpuntenstand?</h2>
      <p>Leg alleen handmatig afgelezen maandstanden vast en zie het verschil
        tussen opeenvolgende <em>ingevulde</em> maanden. Maximaal {PRIVATE_POINTS_MAX} maanden.
        Lege tussenmaanden worden nooit bijgeschat.</p>
      <p><strong>Geen koppeling of officiële zoekpuntentoekenning.</strong> Je typt alle
        waarden zelf over. Woonpoints controleert geen WoningNet/MijnDak,
        puntenregels, geldigheid of persoonlijke woningkansen. Dit is geen
        voorspelling, geen bewijs van een reactie en geen automatisch accountoverzicht.</p>
      <p>Er worden geen persoonsgegevens, adressen of loginvelden gevraagd.
        De notities blijven in het geheugen van dit tabblad; sluiten zonder
        eigen export verliest de invoer.</p>
    </div>
    <div>
      <form className="private-points-form" onSubmit={saveSnapshot}>
        <fieldset>
          <legend>{editingMonth ? 'Bewerk een bestaande maandstand' : 'Noteer een maandstand'}</legend>
          <label htmlFor="points-month">Eigen kalendermaand (niet in de toekomst)</label>
          <input id="points-month" type="month" value={month}
            min="2000-01" max={privateMonthToday()}
            disabled={editingMonth !== null}
            onChange={event=>{setMonth(event.target.value);setMessage('');}} />
          <label htmlFor="points-number">Zelf gelezen zoekpunten (0–10.000, hele punten)</label>
          <input id="points-number" type="number" min="0" max="10000" step="1"
            inputMode="numeric" value={points}
            onChange={event=>{setPoints(event.target.value);setMessage('');}} />
          <div className="private-points-actions">
            <button type="submit" disabled={!canSave}>{editingMonth ? 'Bewaar deze maandstand' : 'Voeg eigen maandstand toe'}</button>
            {editingMonth && <button type="button" className="secondary" onClick={cancelEdit}>Annuleer bewerken</button>}
          </div>
          {monthExists && !editingMonth && <p role="status">Deze maand bestaat al. Gebruik
            ‘Bewerk’ bij die maand om de eigen notitie aan te passen.</p>}
          {rows.length >= PRIVATE_POINTS_MAX && !editingMonth &&
            <p role="status">Maximum van {PRIVATE_POINTS_MAX} maanden bereikt. Bewerk of verwijder een notitie.</p>}
        </fieldset>
      </form>
      {last ? <div className="private-points-overview" aria-live="polite">
        <p><strong>Laatste eigen notitie:</strong> {last.points} punten ({label(last.month)}).
          {' '}Niet geverifieerd.</p>
        <p>{previous ? <>Verschil sinds de vorige <strong>ingevulde</strong> maand
          {' '}({label(previous.month)}): <strong>{last.points-previous.points > 0 ? '+' : ''}
          {last.points-previous.points}</strong> punten.</> :
          'Er is nog geen eerdere ingevulde maand om mee te vergelijken.'}</p>
        {sorted.length > 1 && <div className="private-points-chart" role="img"
          aria-label={'Handmatig genoteerde zoekpunten per ingevulde maand: '+sorted.map(row=>row.month+' '+row.points).join(', ')}>
          {sorted.map(row=><div className="private-points-column" key={row.month}>
            <span>{row.points}</span>
            <div className="private-points-rail"><span
              style={{height:(row.points === 0 ? 0 : Math.max(2,100*row.points/biggest))+'%'}} /></div>
            <small>{row.month}</small>
          </div>)}
        </div>}
        <div className="private-points-table-wrap">
          <table>
            <caption>Eigen maandstanden met verschillen sinds de vorige ingevulde maand</caption>
            <thead><tr><th scope="col">Maand</th><th scope="col">Punten</th>
              <th scope="col">Verschil</th><th scope="col">Bewerken</th><th scope="col">Verwijderen</th></tr></thead>
            <tbody>{sorted.map((row,index)=><tr key={row.month}>
              <th scope="row">{label(row.month)}</th>
              <td>{row.points}</td>
              <td>{index === 0 ? '—' : ((row.points-sorted[index-1].points > 0 ? '+' : '')+
                (row.points-sorted[index-1].points))}</td>
              <td><button type="button" onClick={()=>{
                setMonth(row.month);setPoints(String(row.points));setEditingMonth(row.month);
                setPendingDelete(null);setPendingImport(null);setMessage('Bewerk alleen deze eigen maandstand.');
              }}>Bewerk</button></td>
              <td><button type="button" className="secondary" onClick={()=>{
                setPendingDelete(row.month);setMessage('Kies bevestiging om deze eigen notitie te wissen.');
              }}>Verwijder…</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </div> : <p>Er is nog geen eigen maandstand genoteerd.</p>}
      {pendingDelete && <div className="private-points-confirm" role="group" aria-label="Bevestig verwijdering">
        <p>Verwijder uitsluitend je eigen notitie van {pendingDelete}?</p>
        <button type="button" onClick={()=>{
          setRows(current=>current.filter(row=>row.month!==pendingDelete));
          if(editingMonth===pendingDelete){setEditingMonth(null);setPoints('');setMonth(privateMonthToday());}
          setPendingDelete(null);setMessage('Gekozen maandnotitie lokaal verwijderd.');
        }}>Ja, verwijder maand</button>
        <button type="button" className="secondary" onClick={()=>setPendingDelete(null)}>Annuleer</button>
      </div>}
      <div className="private-points-actions">
        <button type="button" disabled={!rows.length} onClick={()=>{
          downloadPrivatePointsArchive(sorted);
          setMessage('Privé-JSON aangeboden om zelf op te slaan; de gekozen map kan synchroniseren.');
        }}>Bewaar eigen maandstanden als JSON…</button>
        <button type="button" disabled={!rows.length} onClick={()=>{
          downloadPrivatePointsCsv(sorted);
          setMessage('Eigen numerieke CSV aangeboden. Controleer de gekozen bestandslocatie.');
        }}>Bewaar eigen maandstanden als CSV…</button>
        <button type="button" className="secondary" disabled={!rows.length}
          onClick={()=>setConfirmClear(true)}>Wis alle maandstanden…</button>
      </div>
      {confirmClear && <div className="private-points-confirm" role="group" aria-label="Bevestig alle notities wissen">
        <p>Alle {rows.length} eigen maandstanden uit dit tabblad verwijderen?</p>
        <button type="button" onClick={()=>{
          setRows([]);setConfirmClear(false);setPendingDelete(null);setPendingImport(null);
          setEditingMonth(null);setPoints('');setMonth(privateMonthToday());
          setMessage('Eigen maandstanden gewist. Eerder opgeslagen bestanden blijven bestaan.');
        }}>Ja, wis alles</button>
        <button type="button" className="secondary" onClick={()=>setConfirmClear(false)}>Behoud huidige punten</button>
      </div>}
      <label htmlFor="points-import">Lees eerder bewaarde eigen JSON (max. 16 KiB)</label>
      <input type="file" id="points-import" accept=".json,application/json" onChange={event=>{
        const file=event.currentTarget.files?.[0];event.currentTarget.value='';
        void selectArchive(file);
      }} />
      <label htmlFor="points-import-csv">Lees eigen maandstanden-CSV (max. 4 KiB)</label>
      <input type="file" id="points-import-csv" accept=".csv,text/csv"
        onChange={event=>{
          const file=event.currentTarget.files?.[0];event.currentTarget.value='';
          void selectCsvArchive(file);
        }} />
      <p>De CSV gebruikt uitsluitend twee vaste kolommen:
        <code>month,points</code> en bijvoorbeeld <code>2026-10,12</code>.
        Alleen hele, zelf afgelezen punten, geen formules of vrije tekst.</p>
      {pendingImport && <div className="private-points-confirm" role="group" aria-label="Bevestig privé-puntenbestand herstellen">
        <p>Dit bestand bevat {pendingImport.length} geldige eigen maandstanden.
          Bevestigen vervangt alle {rows.length} huidige notities, niet je
          accountgegevens of andere Woonpoints-onderdelen.</p>
        <button type="button" onClick={()=>{
          setRows(pendingImport);setPendingImport(null);setPendingDelete(null);
          setConfirmClear(false);setEditingMonth(null);setPoints('');setMonth(privateMonthToday());
          setMessage('Eigen puntenhistorie na bevestiging lokaal hersteld. Geen officiële bronverificatie.');
        }}>Vervang huidige maandstanden</button>
        <button type="button" className="secondary" onClick={()=>{
          setPendingImport(null);setMessage('Import geannuleerd: de huidige maandstanden zijn behouden.');
        }}>Behoud huidige punten</button>
      </div>}
      {message && <p role="status" aria-live="polite">{message}</p>}
    </div>
  </section>;
}


/** Voluntary post-offer checklist. No account, address, network or persistent storage. */
type PrivateMoveTask = {
  id: string;
  label: string;
  offset: number;
  done: boolean;
};
const PRIVATE_MOVE_FORMAT = 'woonpoints-private-moving-checklist-v1';
const PRIVATE_MOVE_OFFSETS = [-45,-21,-7,0,7] as const;
const PRIVATE_MOVE_SUGGESTIONS: ReadonlyArray<Omit<PrivateMoveTask,'done'>> = [
  {id:'s1',label:'Plan een eigen overzicht van verhuiskosten en reserve',offset:-45},
  {id:'s2',label:'Controleer zelf welke huur- en overdrachtdocumenten je nodig hebt',offset:-45},
  {id:'s3',label:'Vergelijk verhuisvervoer en vraag zo nodig hulp',offset:-45},
  {id:'s4',label:'Controleer contracten voor energie, water en internet',offset:-21},
  {id:'s5',label:'Regel zelf de nodige adreswijzigingen bij betrokken partijen',offset:-21},
  {id:'s6',label:'Bedenk hoe je spullen sorteert, weggeeft of inpakt',offset:-21},
  {id:'s7',label:'Controleer de persoonlijke sleuteloverdracht-afspraken',offset:-7},
  {id:'s8',label:'Pak een tas met onmisbare spullen voor de eerste dagen',offset:-7},
  {id:'s9',label:'Maak eigen meterstand- en staatnotities indien van toepassing',offset:0},
  {id:'s10',label:'Controleer de nieuwe woning en noteer eigen aandachtspunten',offset:0},
  {id:'s11',label:'Controleer zelf de registratie van de adreswijziging',offset:7},
  {id:'s12',label:'Bewaar je eigen overdrachtspapieren op een gekozen plek',offset:7}
];
const privateMoveDefaults = (): PrivateMoveTask[] =>
  PRIVATE_MOVE_SUGGESTIONS.map(task => ({...task,done:false}));
function privateMoveDateValid(date: string) {
  if (!/^20\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date)) return false;
  const time = Date.parse(date+'T12:00:00Z');
  return Number.isFinite(time) && new Date(time).toISOString().slice(0,10) === date;
}
function privateMoveDue(date: string, offset: number) {
  if (!date) return offset < 0 ? Math.abs(offset)+' dagen vóór verhuizing' :
    offset > 0 ? offset+' dagen na verhuizing' : 'op de verhuisdag';
  const utc = Date.parse(date+'T12:00:00Z')+offset*86400000;
  return new Date(utc).toISOString().slice(0,10);
}
function privateMoveArchiveRead(raw: string): {movingDate:string;items:PrivateMoveTask[]} | null {
  if (!raw || new TextEncoder().encode(raw).length > 16384) return null;
  try {
    const decoded: unknown = JSON.parse(raw);
    if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) return null;
    const obj = decoded as Record<string,unknown>;
    if (Object.keys(obj).sort().join('|') !== 'format|items|movingDate' ||
      obj.format !== PRIVATE_MOVE_FORMAT || typeof obj.movingDate !== 'string' ||
      (obj.movingDate !== '' && !privateMoveDateValid(obj.movingDate)) ||
      !Array.isArray(obj.items) || obj.items.length < PRIVATE_MOVE_SUGGESTIONS.length ||
      obj.items.length > 36) return null;
    const seen = new Set<string>();
    const restored: PrivateMoveTask[] = [];
    for (const item of obj.items) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
      const t = item as Record<string,unknown>;
      if (Object.keys(t).sort().join('|') !== 'done|id|label|offset' ||
        typeof t.id !== 'string' || seen.has(t.id) ||
        typeof t.label !== 'string' || t.label.length < 1 || t.label.length > 72 ||
        t.label !== t.label.trim() || /[<>\x00-\x1F\x7F]/.test(t.label) ||
        typeof t.done !== 'boolean' ||
        typeof t.offset !== 'number' || !PRIVATE_MOVE_OFFSETS.includes(t.offset as typeof PRIVATE_MOVE_OFFSETS[number])) return null;
      const suggestion = PRIVATE_MOVE_SUGGESTIONS.find(s => s.id === t.id);
      if (suggestion ? suggestion.label !== t.label || suggestion.offset !== t.offset :
        !/^c-[a-z0-9-]{8,64}$/.test(t.id)) return null;
      seen.add(t.id);
      restored.push({id:t.id,label:t.label,offset:t.offset,done:t.done});
    }
    if (!PRIVATE_MOVE_SUGGESTIONS.every(s=>seen.has(s.id))) return null;
    return {movingDate:obj.movingDate,items:restored};
  } catch {
    return null;
  }
}
export function PrivateMovingChecklist({offer,onOfferHandled}: {
  offer?: Home | null;
  onOfferHandled?: () => void;
} = {}) {
  const [movingDate,setMovingDate] = useState('');
  const [items,setItems] = useState<PrivateMoveTask[]>(privateMoveDefaults);
  const [customLabel,setCustomLabel] = useState('');
  const [customOffset,setCustomOffset] = useState(-21);
  const [filter,setFilter] = useState<'open'|'all'|'done'>('open');
  const [paperScope,setPaperScope] = useState<'open'|'all'>('open');
  const [pendingImport,setPendingImport] = useState<{movingDate:string;items:PrivateMoveTask[]}|null>(null);
  const [confirmReset,setConfirmReset] = useState(false);
  const [message,setMessage] = useState('');
  const completed = items.filter(item => item.done).length;
  const remaining = items.length-completed;
  const visible = items.filter(item => filter === 'all' || (filter === 'done' ? item.done : !item.done))
    .sort((a,b)=>a.offset-b.offset || a.id.localeCompare(b.id));
  const phases: Record<number,string> = {
    [-45]:'Oriëntatie · circa zes weken eerder',
    [-21]:'Voorbereiden · circa drie weken eerder',
    [-7]:'Laatste week',
    [0]:'De verhuisdag',
    [7]:'Eerste week erna'
  };
  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = customLabel.trim();
    if (!label || label.length > 72 || /[<>\x00-\x1F\x7F]/.test(label) ||
        items.length >= 36 || items.some(item=>item.label.toLowerCase()===label.toLowerCase())) {
      setMessage('Gebruik een unieke korte taak (max. 72 tekens) zonder besturingstekens; maximaal 36 taken.');
      return;
    }
    const id='c-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
    setItems(current=>[...current,{id,label,offset:customOffset,done:false}]);
    setCustomLabel('');
    setPendingImport(null);
    setMessage('Eigen taak toegevoegd. Alleen in dit browsertabblad.');
  }


  // The optional shortlist-to-move transfer is intentionally additive and
  // does not auto-accept a home, clear checked tasks or save anything.
  const offeredSuggestions = offer ? ([
    {label:'Bepaal verhuisdozen voor '+offer.rooms+' zelf genoteerde kamers',offset:-45},
    {label:'Controleer budget bij eigen huurindicatie van €'+offer.rent,offset:-45},
    {label:'Loop je eigen reisroute van '+offer.travel+' minuten na',offset:-21},
    {label:'Meet zelf de doorgangen en indeling voor '+offer.rooms+' kamers',offset:-7},
    ...(offer.balcony ? [{label:'Controleer de eigen gewenste balkoninrichting',offset:-7}] : [])
  ] as const).filter(row=>!items.some(item=>item.label.toLowerCase()===row.label.toLowerCase())) : [];
  const offerWellFormed = Boolean(offer && normalizeManualHome(offer) &&
    typeof offer.label === 'string' && offer.label.trim() === offer.label &&
    offer.label.length >= 1 && offer.label.length <= 64);
  const transferWillFit = offeredSuggestions.length > 0 && offeredSuggestions.length <= 36-items.length;
  function acceptShortlistSuggestion() {
    if (!offer || !offerWellFormed || !transferWillFit || pendingImport || confirmReset) {
      setMessage('Overdracht niet toegepast. Controleer eerst bestaande herstel-/wisvragen en de maximale checklist.');
      return;
    }
    const proposed=offeredSuggestions.map((row,index)=>({
      id:'c-'+Date.now().toString(36)+'-'+index.toString(36)+'-'+Math.random().toString(36).slice(2,10),
      label:row.label,
      offset:row.offset,
      done:false
    }));
    setItems(current=>[...current,...proposed]);
    setFilter('open');
    setMessage(proposed.length+' nieuwe stappen uit jouw eigen woningaannames toegevoegd. Je overige taken en vinkjes zijn behouden; geen woning geaccepteerd of toegewezen.');
    onOfferHandled?.();
  }


  // A human-readable optional paper handoff; never an account/worker export.
  // User labels are limited by the existing add/import admission guards.
  const paperRows=items.filter(row=>paperScope==='all'||!row.done);
  const paperLines=[
    'WOONPOINTS · EIGEN VERHUISCHECKLIST',
    'Privéplanning · geen officiële datum, woningaanbieding of WoningNet-reactie.',
    'Gekozen verhuisdag: '+(movingDate||'niet ingevuld'),
    'Overzicht: '+completed+' afgevinkt / '+items.length+' eigen stappen.',
    'Selectie: '+(paperScope==='all'?'alle taken inclusief afgeronde':'alleen open taken'),
    ''
  ];
  PRIVATE_MOVE_OFFSETS.forEach(offset=>{
    const rows=paperRows.filter(row=>row.offset===offset);
    if (!rows.length) return;
    paperLines.push(phases[offset]+' · '+privateMoveDue(movingDate,offset));
    rows.forEach(row=>paperLines.push((row.done?'[x] ':'[ ] ')+row.label));
    paperLines.push('');
  });
  paperLines.push('Controleer dit overzicht zelf. Alleen jouw exportactie kan een bestand');
  paperLines.push('op je apparaat of gekozen cloudlocatie bewaren.');
  const paperContent=paperLines.join('\r\n')+'\r\n';
  function downloadPaperChecklist() {
    if (pendingImport || confirmReset || !paperRows.length) {
      setMessage('Tekstoverdracht niet beschikbaar. Rond eerst een open herstel-/wisvraag af of selecteer taken.');
      return;
    }
    const url=URL.createObjectURL(new Blob([paperContent],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='woonpoints-eigen-verhuischecklist-'+
      (paperScope==='all'?'compleet':'open')+'.txt';
    link.rel='noopener';
    document.body.appendChild(link);
    link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Eigen leesbare checklist aangeboden als TXT. De gekozen opslaglocatie kan buiten Woonpoints synchroniseren.');
  }

  // At most five calendar entries, one per unfinished phase. This is an
  // explicit export into the user's chosen calendar, never a scheduled worker.
  function exportMovingCalendar() {
    if (!privateMoveDateValid(movingDate)) {
      setMessage('Kies eerst een echte verhuisdatum voordat je een privéagenda maakt.');
      return;
    }
    const remainingTasks=items.filter(item=>!item.done);
    if (!remainingTasks.length) {
      setMessage('Alle taken zijn afgevinkt. Er zijn geen open verhuisfases om aan te bieden.');
      return;
    }
    const escapeIcs=(value:string)=>value.replace(/\\/g,'\\\\')
      .replace(/\r\n|\n|\r/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
    const fold=(value:string)=>{
      // RFC 5545 limits physical lines to 75 octets, not 75 JS characters.
      // Leave one byte for the continuation-space on folded lines.
      const encoder=new TextEncoder();
      const folded:string[]=[];
      let line='',bytes=0;
      for (const cp of value) {
        const size=encoder.encode(cp).byteLength;
        if (bytes+size>73) {
          folded.push(line);
          line=' '+cp;
          bytes=1+size;
        } else {
          line+=cp;
          bytes+=size;
        }
      }
      folded.push(line);
      return folded.join('\r\n');
    };
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const calendar=[
      'BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN',
      'PRODID:-//Woonpoints//Eigen verhuisfases//NL','METHOD:PUBLISH'
    ];
    PRIVATE_MOVE_OFFSETS.forEach(offset=>{
      const tasks=remainingTasks.filter(task=>task.offset===offset);
      if (!tasks.length) return;
      // Floating (local) 09:00 time: importing calendar chooses its own
      // time zone. Never compute by adding UTC hours through a DST boundary.
      const day=privateMoveDue(movingDate,offset).replace(/-/g,'');
      const uid='woonpoints-private-moving-'+movingDate.replace(/-/g,'')+
        '-'+(offset<0?'m':'p')+Math.abs(offset)+'@local.woonpoints.invalid';
      const summary='Eigen verhuisplanning: '+tasks.length+' open stappen';
      const description='Eigen richtmoment zonder officiële afspraak of WoningNet-actie.\n'+
        tasks.map((task,i)=>(i+1)+'. '+task.label).join('\n');
      calendar.push('BEGIN:VEVENT','UID:'+uid,'DTSTAMP:'+stamp,
        'DTSTART:'+day+'T090000','DTEND:'+day+'T093000',
        'SUMMARY:'+escapeIcs(summary),'DESCRIPTION:'+escapeIcs(description),
        'STATUS:TENTATIVE','END:VEVENT');
    });
    calendar.push('END:VCALENDAR');
    const content=calendar.map(fold).join('\r\n')+'\r\n';
    const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='woonpoints-eigen-verhuisfases.ics';
    link.rel='noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Eigen open verhuisfases als agenda-ICS aangeboden. Alleen jouw agenda-app bepaalt of deze afspraken worden ingevoerd of gesynchroniseerd.');
  }

  function exportArchive() {
    const content=JSON.stringify({format:PRIVATE_MOVE_FORMAT,movingDate,items},null,2);
    const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='woonpoints-prive-verhuischecklist.json';
    link.rel='noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Privé-JSON aangeboden om zelf te bewaren; je opslaglocatie kan extern synchroniseren.');
  }
  async function prepareImport(file: File|undefined) {
    setPendingImport(null);
    if (!file) return;
    if (file.size < 1 || file.size > 16384) {
      setMessage('Bestand geweigerd: alleen een geldige privé-JSON van maximaal 16 KiB.');
      return;
    }
    try {
      const archive=privateMoveArchiveRead(await file.text());
      if (!archive) throw new Error('invalid');
      setPendingImport(archive);
      setMessage('Bestand lokaal gelezen. Bevestig apart voor vervanging.');
    } catch {
      setMessage('Ongeldig of onbekend checklistbestand. Alle huidige taken blijven behouden.');
    }
  }
  return <section className="panel" aria-labelledby="private-moving-heading">
    <div>
      <p className="eyebrow">EIGEN VERHUISPLAN · ZONDER WONINGNET-ACCOUNT</p>
      <h2 id="private-moving-heading">Van eigen woonkeuze naar een haalbare verhuizing</h2>
      <p>Werk met twaalf aanpasbare afvinkstappen en voeg eigen taken toe.
        De datums zijn alleen <strong>persoonlijke richtmomenten</strong>:
        geen wettelijke termijnen, contractcontrole of automatische afspraken.</p>
      <p>Alles blijft in het geheugen van dit tabblad. Geen adres, naam,
        huurcontract, account of inloggegevens invoeren. Er is geen
        netwerkverzoek of automatische opslag. Exporteer bewust als je
        jouw voortgang wilt bewaren.</p>
    </div>
    <div>
      {offer && <div className="month-csv-confirm" role="group"
        aria-label="Bevestig verhuisplan op basis van eigen woning">
        <h3>Vrijblijvende stappen op basis van jouw eigen woningnotitie</h3>
        <p>Voor <strong>{offer.label}</strong> heb je zelf {offer.rooms} kamers,
          €{offer.rent} maandhuur, {offer.travel} minuten reistijd
          {offer.balcony ? ' en een balkon' : ' en geen balkon'} ingevuld.
          Dit zijn niet extern gecontroleerde gegevens en er is geen
          woningtoewijzing of contract bevestigd.</p>
        <p>Voeg alleen naar eigen keuze de volgende
          <strong> {offeredSuggestions.length} nieuwe checkliststappen</strong> toe.
          Al bestaande gelijknamige taken worden overgeslagen. Eerdere
          voortgang en de verhuisdatum blijven exact behouden.</p>
        {offerWellFormed && offeredSuggestions.length>0 &&
          <ul>{offeredSuggestions.map(item=><li key={item.label}>{item.label}</li>)}</ul>}
        {!transferWillFit && <p role="alert">Er is onvoldoende ruimte in je checklist
          of deze suggesties staan er al. Verwijder desgewenst eerst eigen taken.</p>}
        {(pendingImport || confirmReset) && <p role="alert">Rond eerst een openstaand herstel-
          of wisverzoek af voordat je suggesties toevoegt.</p>}
        <button type="button" disabled={!offerWellFormed || !transferWillFit || Boolean(pendingImport) || confirmReset}
          onClick={acceptShortlistSuggestion}>Ja, voeg alleen deze stappen toe</button>
        <button type="button" className="secondary" onClick={()=>{
          onOfferHandled?.();
          setMessage('Voorstel genegeerd. De bestaande checklist blijft ongewijzigd.');
        }}>Nee, behoud mijn eigen checklist</button>
      </div>}
      <label htmlFor="moving-date">Mijn vermoedelijke verhuisdag (optioneel)</label>
      <input id="moving-date" type="date" min="2000-01-01" max="2099-12-31"
        value={movingDate} onChange={event=>{
          const value=event.target.value;
          if (value === '' || privateMoveDateValid(value)) {
            setMovingDate(value);setPendingImport(null);setMessage('');
          }
        }} />
      <p aria-live="polite"><strong>{completed} van {items.length} taken gedaan</strong>
        {' · '}{remaining} open. Een datum toevoegen rekent alleen eigen richtmomenten uit.</p>
      <label htmlFor="moving-filter">Toon checklist</label>
      <select id="moving-filter" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}>
        <option value="open">Nog open</option>
        <option value="all">Alle taken</option>
        <option value="done">Afgevinkt</option>
      </select>
      {PRIVATE_MOVE_OFFSETS.map(offset=>{
        const tasks=visible.filter(item=>item.offset===offset);
        if (!tasks.length) return null;
        return <div key={offset} className="private-points-overview">
          <h3>{phases[offset]}</h3>
          <p>Richtmoment: <strong>{privateMoveDue(movingDate,offset)}</strong></p>
          <ul>{tasks.map(task=><li key={task.id}>
            <label style={{display:'inline-flex',gap:8,alignItems:'flex-start'}}>
              <input type="checkbox" checked={task.done} onChange={event=>{
                const done=event.target.checked;
                setItems(current=>current.map(row=>row.id===task.id?{...row,done}:row));
                setPendingImport(null);
              }} />
              <span>{task.label}</span>
            </label>
            {task.id.startsWith('c-') && <button type="button" className="secondary"
              onClick={()=>{setItems(current=>current.filter(row=>row.id!==task.id));setPendingImport(null);}}>
              Verwijder eigen taak</button>}
          </li>)}</ul>
        </div>;
      })}
      {!visible.length && <p>Geen taken in deze weergave. Wissel de filter om je lijst te zien.</p>}
      <form onSubmit={addTask}>
        <fieldset>
          <legend>Maak een eigen stap</legend>
          <label htmlFor="moving-task-label">Taak, zonder persoons- of adresgegevens</label>
          <input id="moving-task-label" type="text" maxLength={72}
            value={customLabel} onChange={e=>setCustomLabel(e.target.value)}
            placeholder="Bijvoorbeeld: dozen regelen" />
          <label htmlFor="moving-task-stage">Richtfase</label>
          <select id="moving-task-stage" value={customOffset}
            onChange={e=>setCustomOffset(Number(e.target.value))}>
            {PRIVATE_MOVE_OFFSETS.map(offset=><option value={offset} key={offset}>{phases[offset]}</option>)}
          </select>
          <button type="submit" disabled={items.length>=36}>Voeg eigen stap toe</button>
          <p>Maximaal 36 stappen, waarvan de twaalf suggesties vaste uitgangspunten zijn.</p>
        </fieldset>
      </form>
      <div className="manual-reminder-suggest">
        <h3>Neem je eigen checklist leesbaar mee</h3>
        <p>Maak uitsluitend op eigen verzoek een TXT-document met persoonlijke
          richtmomenten, open stappen en eventueel jouw afgevinkte voortgang.
          Het bestand bevat je zelf ingevoerde taakteksten; kies dus zorgvuldig
          waar je het opslaat of met wie je het deelt.</p>
        <label htmlFor="moving-paper-scope">Welke stappen wil je meenemen?</label>
        <select id="moving-paper-scope" value={paperScope}
          onChange={event=>setPaperScope(event.target.value as typeof paperScope)}>
          <option value="open">Alleen nog open stappen</option>
          <option value="all">Alle stappen met afvinkstatus</option>
        </select>
        <details>
          <summary>Bekijk eerst de exacte tekst voor jouw export</summary>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
            maxHeight:320,overflowY:'auto'}}>{paperContent}</pre>
        </details>
        <button type="button" onClick={downloadPaperChecklist}
          disabled={!paperRows.length || Boolean(pendingImport) || confirmReset}>
          Bewaar gekozen eigen checklist als TXT…
        </button>
        <p>Geen automatische opslag of synchronisatie, printertoegang,
          accountactie of officiële bevestiging van een verhuizing.</p>
      </div>
      <div className="month-history-actions">
        <button type="button" onClick={exportArchive}>Bewaar eigen checklist als privé-JSON…</button>
        <button type="button" onClick={exportMovingCalendar}
          disabled={!privateMoveDateValid(movingDate) || remaining===0}>
          Bewaar open fases als agenda-ICS…
        </button>
        <button type="button" className="secondary" onClick={()=>setConfirmReset(true)}>
          Begin opnieuw…</button>
      </div>
      {confirmReset && <div className="month-csv-confirm" role="group" aria-label="Bevestig checklist wissen">
        <p>Dit wist je eigen taken, vinkjes en verhuisdatum in dit tabblad. Niet-geëxporteerde informatie kun je niet terughalen.</p>
        <button type="button" onClick={()=>{
          setItems(privateMoveDefaults());setMovingDate('');setPendingImport(null);
          setConfirmReset(false);setMessage('Checklist opnieuw begonnen in dit tabblad.');
        }}>Wis mijn checklist</button>
        <button type="button" onClick={()=>setConfirmReset(false)}>Behoud mijn checklist</button>
      </div>}
      <label htmlFor="moving-archive">Open eerder bewaarde privéchecklist (JSON, maximaal 16 KiB)</label>
      <input id="moving-archive" type="file" accept=".json,application/json" onChange={event=>{
        const file=event.currentTarget.files?.[0];
        event.currentTarget.value='';
        void prepareImport(file);
      }} />
      {pendingImport && <div className="month-csv-confirm" role="group"
        aria-label="Bevestig checklist herstellen">
        <p>Dit eigen bestand bevat {pendingImport.items.length} stappen, waarvan
          {pendingImport.items.filter(item=>item.done).length} afgevinkt.
          Vervangen overschrijft alle huidige taken, vinkjes en de verhuisdatum.</p>
        <button type="button" onClick={()=>{
          setItems(pendingImport.items);setMovingDate(pendingImport.movingDate);
          setPendingImport(null);setConfirmReset(false);
          setMessage('Eigen checklist lokaal hersteld; geen externe gegevens gecontroleerd.');
        }}>Vervang mijn huidige checklist</button>
        <button type="button" onClick={()=>{
          setPendingImport(null);setMessage('Herstel geannuleerd: huidige checklist behouden.');
        }}>Behoud mijn huidige checklist</button>
      </div>}
      {message && <p role="status">{message}</p>}
      <p>De optionele agenda-ICS bevat maximaal vijf eigen groepsafspraken
        (09:00–09:30 lokale agendatijd), met de open eigen taken als
        beschrijving. De kalender-app kan deze gegevens online synchroniseren.
        Controleer de afspraakdatums zelf; het zijn geen officiële termijnen.</p>
      <p>Bewaren of herstellen werkt alleen na jouw expliciete keuze.
        Een eigen bestand kan buiten deze app worden gesynchroniseerd.
        Niets doet een woningreactie, inschrijving, betaling of contracthandeling.</p>
    </div>
  </section>;
}


/**
 * No global event, cross-tab persistence or account bridge.
 * The only shared context is an explicitly proposed private aggregate.
 */
export function PrivateReactionWorkflow({children}:{children:ReactNode}) {
  const [offer,setOffer]=useState<PrivateJournalCountOffer|null>(null);
  const [month,setMonth]=useState<PrivateMonthSnapshot|null>(null);
  const [journal,setJournal]=useState<PrivateJournalSnapshot|null>(null);
  const [pointsSnapshot,setPointsSnapshot]=useState<PrivatePointsSnapshot|null>(null);
  const updatePoints=useCallback((value:PrivatePointsSnapshot)=>setPointsSnapshot(value),[]);
  const propose=useCallback((value:PrivateJournalCountOffer|null)=>setOffer(value),[]);
  const decide=useCallback(()=>setOffer(null),[]);
  const updateMonth=useCallback((value:PrivateMonthSnapshot)=>setMonth(value),[]);
  const updateJournal=useCallback((value:PrivateJournalSnapshot)=>setJournal(value),[]);
  const activeMonth=month?.month ?? localMonthKey(new Date());
  const sameMonth=journal?.month===activeMonth;
  const diaryReacted=sameMonth?journal?.reacted??0:0;
  const diaryTotal=sameMonth?journal?.total??0:0;
  const monthCount=month?.month===activeMonth?month?.count??null:null;
  const discrepancy=monthCount!==null && diaryTotal>0 && diaryReacted!==monthCount;
  return <>
    <section className="panel private-month-pulse" aria-labelledby="private-month-pulse-heading">
      <div>
        <p className="eyebrow">MIJN EIGEN MAANDOVERZICHT · PRIVÉ EN ONGEVERIFIEERD</p>
        <h2 id="private-month-pulse-heading">Mijn zelf genoteerde voortgang</h2>
        <p>Een gecombineerd overzicht van twee <strong>handmatige</strong>
          Woonpoints-hulpmiddelen. Je eigen maandteller en dagboek kunnen
          verschillen: het zijn geen officiële WoningNet-reacties, zoekpunten
          of voorspellingen.</p>
      </div>
      <div>
        <div className="grid" aria-live="polite" aria-atomic="true">
          <article className="card">
            <h3>Eigen maandteller · {activeMonth}</h3>
            <strong>{monthCount===null ? 'Niet ingevuld' :
              monthCount+' / 4 zelf genoteerd'}</strong>
            <p>{month?.storage==='temporary' ?
              'Tijdelijke waarde in dit tabblad; browseropslag is niet bevestigd.' :
              month?.storage==='unknown' ?
              'Browseropslag niet beschikbaar of status onbekend.' :
              'Eigen planningsnotitie in deze browser, niet officieel geverifieerd.'}</p>
          </article>
          <article className="card">
            <h3>Eigen reactiedagboek · {activeMonth}</h3>
            <strong>{sameMonth ? diaryReacted+' zelf gereageerd' : 'Nog laden…'}</strong>
            <p>{sameMonth ? diaryTotal+' eigen notities tot vandaag; '+
              (diaryTotal-diaryReacted)+' met andere status.' :
              'Alleen eigen notities uit de huidige kalendermaand worden geteld.'}</p>
          </article>
          <article className="card">
            <h3>Zelf genoteerde zoekpunten</h3>
            <strong>{pointsSnapshot?.last ? pointsSnapshot.last.points+' punten' :
              'Geen eigen stand'}</strong>
            <p>{pointsSnapshot?.last ?
              'Laatste handmatige maand: '+pointsSnapshot.last.month+
              (pointsSnapshot.previous ?
                '. Verschil met '+pointsSnapshot.previous.month+': '+
                  (pointsSnapshot.last.points-pointsSnapshot.previous.points > 0 ? '+' : '')+
                  (pointsSnapshot.last.points-pointsSnapshot.previous.points)+'.' :
                '. Nog geen eerdere maand om te vergelijken.') :
              'Geen accountkoppeling of officiële punten toegekend.'}</p>
          </article>
        </div>
        {month?.previousNoteHeld && <p role="status">
          Je browser bevat nog een oudere of onleesbare maandnotitie. Deze wordt
          niet automatisch vervangen door een dagboekvoorstel.</p>}
        {discrepancy && <p role="status">
          Verschil tussen jouw teller en je dagboek. Je kunt beide zelfstandig
          corrigeren of een nieuw dagboekvoorstel ter bevestiging aanbieden.
          Verschil betekent niet dat WoningNet een reactie heeft geweigerd.</p>}
        {diaryReacted>4 && <p role="status">Meer dan vier eigen notities zijn als
          gereageerd gemarkeerd. Ze worden niet automatisch tot het maanddoel
          teruggebracht.</p>}
        <p><a href="#manual-progress-heading">Open mijn maandplanning</a>
          {' · '}<a href="#reaction-journal-title">Open mijn reactiedagboek</a>
          {' · '}<a href="#private-points-heading">Open mijn zoekpuntenhistorie</a></p>
        <p>Geen accounts, adressen, externe data of netwerkverzoeken worden voor
          dit overzicht gekoppeld. Er vindt geen achtergrondopslag of
          automatische correctie tussen de twee onderdelen plaats.</p>
      </div>
    </section>
    <ManualMonthProgress journalOffer={offer} onJournalDecision={decide}
      onMonthSnapshot={updateMonth} />
    <PrivateSearchPointsHistory onPointsSnapshot={updatePoints} />
    {children}
    <ManualPositionsWorkspace onMonthCountOffer={propose}
      onJournalSnapshot={updateJournal} reportMonth={activeMonth}/>
  </>;
}


/**
 * Optional, manual monthly planning hints: a calendar suggestion is never
 * evidence of a WoningNet reaction, point, invitation or registered account.
 * Its only persistent output is an explicitly user-requested ICS download.
 */
export function PrivateReactionPacing() {
  const [month, setMonth] = useState('');
  const [selfCount, setSelfCount] = useState('0');
  const [alreadyPlanned, setAlreadyPlanned] = useState('0');
  const [workdaysOnly, setWorkdaysOnly] = useState(true);
  const [message, setMessage] = useState('');
  const [dateChoices, setDateChoices] = useState<Record<number, string>>({});
  type PrivatePacingArchive = {
    format: 'woonpoints-private-monthplan-v1';
    month: string;
    selfCount: string;
    alreadyPlanned: string;
    workdaysOnly: boolean;
    dates: string[];
  };
  const [pendingBackup, setPendingBackup] = useState<{
    data: PrivatePacingArchive;
    currentSignature: string;
  } | null>(null);
  useEffect(() => {
    const now = new Date();
    setMonth(now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'));
  }, []);
  const parsedCount = (value: string) => /^[0-4]$/.test(value) ? Number(value) : null;
  const counted = parsedCount(selfCount);
  const planned = parsedCount(alreadyPlanned);
  const countsOk = counted !== null && planned !== null && counted + planned <= 4;
  const validMonth = /^(20\d{2})-(0[1-9]|1[0-2])$/.exec(month);
  const today = new Date();
  const todayKey = today.getFullYear() + '-' +
    String(today.getMonth()+1).padStart(2,'0') + '-' +
    String(today.getDate()).padStart(2,'0');
  const openDates: string[] = [];
  if (validMonth && countsOk) {
    const year = Number(validMonth[1]);
    const m = Number(validMonth[2]);
    const last = new Date(year, m, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const key = month + '-' + String(d).padStart(2,'0');
      if (key < todayKey) continue;
      const weekday = new Date(year, m-1, d, 12).getDay();
      if (workdaysOnly && (weekday === 0 || weekday === 6)) continue;
      openDates.push(key);
    }
  }
  const missing = countsOk ? 4 - counted! - planned! : 0;
  const proposed = missing > 0 && openDates.length
    ? Array.from({length: Math.min(missing, openDates.length)}, (_, i) =>
        openDates[Math.floor(((i + 1) * openDates.length) / (Math.min(missing, openDates.length) + 1))])
    : [];
  const insufficient = missing > proposed.length;
  const selected = proposed.map((day, i) => dateChoices[i] ?? day);
  const selectionValid = selected.every(day => openDates.includes(day)) &&
    new Set(selected).size === selected.length;
  const currentSignature = JSON.stringify({
    month, selfCount, alreadyPlanned, workdaysOnly, dates: selected
  });
  const fmt = (date: string) => {
    const [y,m,d] = date.split('-').map(Number);
    return new Intl.DateTimeFormat('nl-NL', {
      weekday:'long', day:'numeric', month:'long', year:'numeric'
    }).format(new Date(y,m-1,d,12));
  };
  function downloadPlan() {
    if (!validMonth || !countsOk || missing === 0 || insufficient ||
        proposed.length !== missing || !selectionValid) {
      setMessage('Er zijn onvoldoende geldige toekomstige dagen voor een volledige planning.');
      return;
    }
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN',
      'PRODID:-//Woonpoints//Prive maandreactieplan//NL','METHOD:PUBLISH'];
    for (const date of selected) {
      const [year,m,d] = date.split('-').map(Number);
      const following = new Date(year,m-1,d+1,12);
      const end = String(following.getFullYear()) +
        String(following.getMonth()+1).padStart(2,'0') +
        String(following.getDate()).padStart(2,'0');
      const start = date.replace(/-/g,'');
      lines.push('BEGIN:VEVENT',
        'UID:woonpoints-eigen-reactie-'+start+'@local.woonpoints.invalid',
        'DTSTAMP:'+stamp,
        'DTSTART;VALUE=DATE:'+start,
        'DTEND;VALUE=DATE:'+end,
        'SUMMARY:Zelf woonaanbod bekijken (geen automatische reactie)',
        'DESCRIPTION:Eigen vrijblijvend aandachtspunt. Controleer zelf de actuele woning en eventuele regels. Geen WoningNet-registratie of melding door Woonpoints.',
        'STATUS:TENTATIVE',
        'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    // All emitted characters are ASCII; fold calendar physical lines below 75 bytes.
    const fold = (line: string) => line.match(/.{1,73}/g)?.join('\r\n ') ?? line;
    const uri = URL.createObjectURL(new Blob([lines.map(fold).join('\r\n')+'\r\n'],
      {type:'text/calendar;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = uri;
    link.download = 'woonpoints-eigen-maandcheck.ics';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(uri),2000);
    setMessage('Eigen voorlopige agendadagen aangeboden. Je agenda-app kan dit bestand zelf opslaan of synchroniseren.');
  }

  function savePrivateBackup() {
    if (!validMonth || !countsOk || insufficient || !selectionValid ||
        selected.length !== missing) {
      setMessage('Bewaren kan alleen als je eigen maandplan geldig en compleet is.');
      return;
    }
    const data: PrivatePacingArchive = {
      format: 'woonpoints-private-monthplan-v1',
      month, selfCount, alreadyPlanned, workdaysOnly,
      dates: selected
    };
    // Exact own-export formatting is also the strict restore contract.
    const source = JSON.stringify(data, null, 2) + '\n';
    const url = URL.createObjectURL(new Blob([source], {
      type: 'application/json;charset=utf-8'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-eigen-maandplan.json';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setMessage('Privé-maandplan aangeboden om zelf te bewaren. Bestandslocaties kunnen synchroniseren.');
  }
  async function choosePrivateBackup(file: File | undefined) {
    setPendingBackup(null);
    if (!file) return;
    if (file.size < 1 || file.size > 2048) {
      setMessage('Bestand geweigerd. Kies een klein Woonpoints-maandplan van maximaal 2 KiB.');
      return;
    }
    try {
      const source = await file.text();
      if (new TextEncoder().encode(source).length > 2048) throw new Error('size');
      const raw: unknown = JSON.parse(source);
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
          Object.getPrototypeOf(raw) !== Object.prototype) throw new Error('type');
      const candidate = raw as Partial<PrivatePacingArchive>;
      if (Object.keys(candidate).join(',') !==
          'format,month,selfCount,alreadyPlanned,workdaysOnly,dates' ||
          candidate.format !== 'woonpoints-private-monthplan-v1' ||
          typeof candidate.month !== 'string' ||
          !/^(20\d{2})-(0[1-9]|1[0-2])$/.test(candidate.month) ||
          typeof candidate.selfCount !== 'string' ||
          typeof candidate.alreadyPlanned !== 'string' ||
          !/^[0-4]$/.test(candidate.selfCount) ||
          !/^[0-4]$/.test(candidate.alreadyPlanned) ||
          Number(candidate.selfCount) + Number(candidate.alreadyPlanned) > 4 ||
          typeof candidate.workdaysOnly !== 'boolean' ||
          !Array.isArray(candidate.dates)) throw new Error('schema');
      const dates = candidate.dates;
      const expected = 4 - Number(candidate.selfCount) - Number(candidate.alreadyPlanned);
      if (dates.length !== expected ||
          dates.some(date => typeof date !== 'string' ||
            !/^20\d{2}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date) ||
            !date.startsWith(candidate.month + '-') || date < todayKey) ||
          new Set(dates).size !== dates.length) throw new Error('dates');
      const year = Number(candidate.month.slice(0,4));
      const monthIndex = Number(candidate.month.slice(5,7));
      const lastDay = new Date(year, monthIndex, 0).getDate();
      const validDates = dates.every(date => {
        const day = Number(date.slice(8,10));
        if (day > lastDay) return false;
        const weekday = new Date(year, monthIndex-1, day, 12).getDay();
        return !candidate.workdaysOnly || (weekday !== 0 && weekday !== 6);
      });
      if (!validDates) throw new Error('weekday');
      const data: PrivatePacingArchive = {
        format: 'woonpoints-private-monthplan-v1',
        month: candidate.month,
        selfCount: candidate.selfCount,
        alreadyPlanned: candidate.alreadyPlanned,
        workdaysOnly: candidate.workdaysOnly,
        dates
      };
      if (JSON.stringify(data, null, 2) + '\n' !== source) throw new Error('canonical');
      setPendingBackup({ data, currentSignature });
      setMessage('Geldig eigen maandplan gelezen. Bevestig apart voordat huidige invoer wordt vervangen.');
    } catch {
      setMessage('Bestand geweigerd: alleen een volledig, ongewijzigd en nog toekomstig Woonpoints-maandplan. Je invoer is behouden.');
    }
  }
  function restorePrivateBackup() {
    if (!pendingBackup || pendingBackup.currentSignature !== currentSignature) {
      setPendingBackup(null);
      setMessage('Je huidige plan is gewijzigd. Kies het herstelbestand opnieuw.');
      return;
    }
    const data = pendingBackup.data;
    setMonth(data.month);
    setSelfCount(data.selfCount);
    setAlreadyPlanned(data.alreadyPlanned);
    setWorkdaysOnly(data.workdaysOnly);
    setDateChoices(Object.fromEntries(data.dates.map((day,i)=>[i,day])));
    setPendingBackup(null);
    setMessage('Privé-maandplan bewust hersteld in dit tabblad. Niets is naar WoningNet verstuurd.');
  }
  return <section className="panel" aria-labelledby="private-reaction-pacing-heading">
    <div>
      <p className="eyebrow">PRIVÉ MAANDPLAN · GEEN WONINGNET-KOPPELING</p>
      <h2 id="private-reaction-pacing-heading">Wanneer wil je zelf woonaanbod bekijken?</h2>
      <p>Verdeel jouw nog gewenste aandachtspunten over toekomstige kalenderdagen.
        Dit helpt uitsluitend herinneren om zélf te kijken. Het maanddoel
        van vier is hier een persoonlijke richtlijn: een check is <strong>geen
        geldige reactie, zoekpunt of woningtoewijzing</strong>.</p>
      <p>Getallen komen alleen van jou. Geen account, adres, gegevensimport,
        automatisch bericht, browseropslag, serveraanroep of ingeplande achtergrondactie.</p>
    </div>
    <div>
      <label htmlFor="pacing-month">Kalendermaand</label>
      <input id="pacing-month" type="month" min="2000-01" max="2099-12"
        value={month} onChange={event=>{
          setMonth(event.target.value);setDateChoices({});setMessage('');
        }}/>
      <label htmlFor="pacing-count">Zelf al gedaan deze maand (0–4, niet geverifieerd)</label>
      <input id="pacing-count" type="number" min="0" max="4" step="1"
        value={selfCount} onChange={event=>{
          setSelfCount(event.target.value);setDateChoices({});setMessage('');
        }}/>
      <label htmlFor="pacing-planned">Zelf elders al gepland (0–4)</label>
      <input id="pacing-planned" type="number" min="0" max="4" step="1"
        value={alreadyPlanned} onChange={event=>{
          setAlreadyPlanned(event.target.value);setDateChoices({});setMessage('');
        }}/>
      <label style={{display:'flex',gap:8,alignItems:'center'}}>
        <input type="checkbox" checked={workdaysOnly} onChange={event=>{
          setWorkdaysOnly(event.target.checked);setDateChoices({});setMessage('');
        }}/>
        Alleen op werkdagen voorstellen
      </label>
      {!countsOk && <p role="alert">Gebruik gehele aantallen tussen 0 en 4,
        samen maximaal vier. Geen bestaande plannen worden gewijzigd.</p>}
      {!validMonth && <p>Vul eerst een geldige kalendermaand in.</p>}
      {countsOk && validMonth && <>
        <p aria-live="polite"><strong>{missing} eigen aandachtspunt{missing===1?'':'en'} over</strong>
          {' · '}{openDates.length} toekomstige {workdaysOnly?'werkdagen':'dagen'} beschikbaar.</p>
        {missing===0 && <p>Vier punten zijn al ingevuld of elders gepland.
          Er worden geen extra dagen voorgesteld.</p>}
        {insufficient && <p role="alert">Deze maand heeft niet genoeg toekomstige
          {workdaysOnly?' werkdagen':' dagen'} voor alle open aandachtspunten.
          Kies desgewenst een andere maand of dagfilter. We schuiven nooit stilzwijgend
          een actie naar de volgende maand.</p>}
        {proposed.length>0 && <div>
          <h3>Vrijblijvende suggesties</h3>
          <ol>{selected.map((day, i)=><li key={i}>
            <label htmlFor={'pacing-day-'+i}>Aandachtspunt {i+1}</label>
            <select id={'pacing-day-'+i} value={day}
              onChange={event=>{
                setDateChoices(previous=>({...previous,[i]:event.target.value}));
                setMessage('');
              }}>
              {openDates.map(date=><option value={date} key={date}>{fmt(date)}</option>)}
            </select>
          </li>)}</ol>
          {!selectionValid && <p role="alert">Kies voor ieder aandachtspunt een andere, nog toekomstige datum in dezelfde maand.</p>}
          <p>Je kunt elke voorgestelde datum zelf aanpassen. Alle dagen blijven voorlopig en persoonlijk.</p>
          <p>Datums zijn uitsluitend voorgestelde kijkmomenten, geen deadlines
            van een verhuurder of bevestigde afspraken.</p>
        </div>}
        <button type="button" onClick={downloadPlan}
          disabled={missing===0 || insufficient || proposed.length!==missing || !selectionValid}>
          Bewaar alleen deze suggesties als voorlopige agenda-ICS…
        </button>
      </>}
      <button type="button" className="secondary" onClick={()=>{
        setSelfCount('0');setAlreadyPlanned('0');setDateChoices({});setMessage('');
      }}>Wis mijn aantallen</button>
      <div className="month-csv-confirm">
        <h3>Bewaar of herstel mijn maandplan</h3>
        <p>De huidige maand, je eigen aantallen en gekozen dagen kunnen alleen
          op jouw verzoek als privé-JSON worden bewaard. Geen automatische
          opslag in de browser of op een server.</p>
        <button type="button" onClick={savePrivateBackup}
          disabled={!validMonth || !countsOk || insufficient ||
            !selectionValid || selected.length!==missing}>
          Bewaar eigen maandplan als privé-JSON…
        </button>
        <label htmlFor="pacing-restore">Kies eerder bewaard maandplan (maximaal 2 KiB)</label>
        <input id="pacing-restore" type="file" accept=".json,application/json"
          onChange={event=>{
            const file=event.currentTarget.files?.[0];
            event.currentTarget.value='';
            void choosePrivateBackup(file);
          }}/>
        {pendingBackup && <div role="group" aria-label="Bevestig herstel maandplan">
          <p>Geselecteerd: <strong>{pendingBackup.data.month}</strong>,
            {' '}{pendingBackup.data.selfCount} eigen kijkmomenten,
            {' '}{pendingBackup.data.alreadyPlanned} elders gepland,
            {' '}{pendingBackup.data.dates.length} voorgestelde dagen.</p>
          {pendingBackup.currentSignature!==currentSignature && <p role="alert">
            Dit herstel is verouderd doordat je huidige invoer is gewijzigd.
            Kies het bestand opnieuw.</p>}
          <p><strong>Vervangen?</strong> De huidige maand, aantallen en
            voorgestelde dagen verdwijnen uit het tabblad. Andere Woonpoints-
            onderdelen en je reeds gedownloade bestanden veranderen niet.</p>
          <button type="button" onClick={restorePrivateBackup}
            disabled={pendingBackup.currentSignature!==currentSignature}>
            Ja, vervang alleen dit maandplan
          </button>
          <button type="button" className="secondary"
            onClick={()=>{setPendingBackup(null);setMessage('Herstel geannuleerd. Huidige invoer behouden.');}}>
            Nee, behoud huidig maandplan
          </button>
        </div>}
        <p>Oude of handmatig gewijzigde bestanden worden geweigerd. Kies je
          voor cloudopslag, dan kan dat platform jouw privéplan synchroniseren.</p>
      </div>
      <p aria-live="polite">{message}</p>
      <p>Een ICS-download gebeurt alleen na jouw klik. Je kalenderprovider kan
        de gekozen dagen synchroniseren; Woonpoints verstuurt nooit
        woningreacties of automatische herinneringen.</p>
    </div>
  </section>;
}


/**
 * Private image side-by-side viewer. This deliberately does not handle WoningNet
 * images, accounts, evidence provenance, EXIF extraction, persistence or uploads.
 * Each local object URL is revoked on removal, reset and component teardown.
 */
export function PrivatePhotoComparison() {
  type Side = 'A' | 'B';
  type Photo = { id: number; url: string; bytes: number };
  type Album = Record<Side, Photo[]>;
  const LIMIT_EACH = 3;
  const LIMIT_FILE = 5 * 1024 * 1024;
  const LIMIT_TOTAL = 20 * 1024 * 1024;
  const [album, setAlbum] = useState<Album>({ A: [], B: [] });
  const albumRef = useRef<Album>({ A: [], B: [] });
  const nextId = useRef(1);
  const alive = useRef(true);
  const [selected, setSelected] = useState<Record<Side, number | null>>({ A: null, B: null });
  const [notes, setNotes] = useState<Record<Side, string>>({ A: '', B: '' });
  const [notice, setNotice] = useState('');
  const [overlayPercent, setOverlayPercent] = useState(50);
  const [notesExport, setNotesExport] = useState<string | null>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      for (const side of ['A', 'B'] as const) {
        for (const photo of albumRef.current[side]) URL.revokeObjectURL(photo.url);
      }
      albumRef.current = { A: [], B: [] };
    };
  }, []);
  const updateAlbum = (next: Album) => {
    albumRef.current = next;
    setAlbum(next);
  };
  const totalBytes = [...album.A, ...album.B].reduce((sum, photo) => sum + photo.bytes, 0);
  const overlayA = album.A.find(item => item.id === selected.A) ?? album.A[0];
  const overlayB = album.B.find(item => item.id === selected.B) ?? album.B[0];
  const knownImage = async (file: File) => {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const jpg = file.type === 'image/jpeg' && bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const png = file.type === 'image/png' && bytes.length >= 8 &&
      [137,80,78,71,13,10,26,10].every((n,i) => bytes[i] === n);
    const webp = file.type === 'image/webp' && bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0,4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8,12)) === 'WEBP';
    return jpg || png || webp;
  };
  async function addPhotos(side: Side, files: FileList | null) {
    if (!files || files.length === 0) return;
    const batch = Array.from(files);
    setNotice('');
    if (batch.length > LIMIT_EACH ||
        batch.some(file => !Number.isSafeInteger(file.size) || file.size < 1 ||
          file.size > LIMIT_FILE)) {
      setNotice('Bestanden geweigerd: maximaal drie JPEG-, PNG- of WebP-foto’s per woning, elk maximaal 5 MiB.');
      return;
    }
    try {
      const valid = await Promise.all(batch.map(knownImage));
      if (!valid.every(Boolean)) {
        setNotice('Foto’s geweigerd: alleen herkenbare JPEG-, PNG- of WebP-bestanden, geen SVG, GIF of video.');
        return;
      }
      if (!alive.current) return;
      const current = albumRef.current;
      const used = [...current.A, ...current.B].reduce((sum, item) => sum + item.bytes, 0);
      const extra = batch.reduce((sum, file) => sum + file.size, 0);
      if (current[side].length + batch.length > LIMIT_EACH ||
          used + extra > LIMIT_TOTAL) {
        setNotice('Foto’s niet toegevoegd: te veel bestanden of meer dan 20 MiB tegelijk in dit tabblad. Verwijder eerst eigen foto’s.');
        return;
      }
      const created: Photo[] = [];
      try {
        for (const file of batch) {
          created.push({ id: nextId.current++, url: URL.createObjectURL(file), bytes: file.size });
        }
      } catch {
        created.forEach(photo => URL.revokeObjectURL(photo.url));
        setNotice('Je browser kan deze foto’s niet lokaal openen.');
        return;
      }
      updateAlbum({ ...current, [side]: [...current[side], ...created] });
      setSelected(previous => ({
        ...previous, [side]: previous[side] ?? created[0]?.id ?? null
      }));
      setNotice(batch.length + ' privéfoto(’s) toegevoegd aan woning ' + side + '. Niets is verstuurd.');
    } catch {
      if (alive.current) setNotice('Kon de gekozen foto’s niet veilig als lokale voorbeelden openen.');
    }
  }
  function removePhoto(side: Side, id: number) {
    const current = albumRef.current;
    const match = current[side].find(item => item.id === id);
    if (!match) return;
    const nextSide = current[side].filter(item => item.id !== id);
    updateAlbum({ ...current, [side]: nextSide });
    URL.revokeObjectURL(match.url);
    setSelected(previous => ({
      ...previous, [side]: previous[side] === id ? nextSide[0]?.id ?? null : previous[side]
    }));
    setNotice('Privéfoto verwijderd uit dit tabblad.');
  }
  function clearAll() {
    const current = albumRef.current;
    updateAlbum({ A: [], B: [] });
    for (const side of ['A', 'B'] as const) {
      current[side].forEach(photo => URL.revokeObjectURL(photo.url));
    }
    setSelected({ A: null, B: null });
    setNotes({ A: '', B: '' });
    setNotesExport(null);
    setNotice('Beide privéalbums en aantekeningen uit dit tabblad gewist.');
  }

  function preparePrivateNotes() {
    const a = notes.A.trim(), b = notes.B.trim();
    if (!a && !b) {
      setNotice('Schrijf eerst een eigen observatie bij minimaal één woning.');
      setNotesExport(null);
      return;
    }
    // Plain text only. Original image bytes, filenames and object URLs are never exported.
    const clean = (value: string) => value.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
      .replace(/\r\n?|\n/g, '\n').trim();
    const text = [
      'WOONPOINTS · EIGEN VISUELE WONINGNOTITIES',
      'Niet gecontroleerd door WoningNet of een andere bron.',
      'Geen foto’s, adressen, personen of bestanden opgenomen.',
      '',
      'WONING A',
      clean(a) || 'Geen eigen observatie',
      '',
      'WONING B',
      clean(b) || 'Geen eigen observatie',
      '',
      'Eigen waarnemingen; geen bouwkundige inspectie of toewijzingsadvies.'
    ].join('\n') + '\n';
    setNotesExport(text);
    setNotice('Controleer eerst het tekstvoorbeeld. Alleen een tweede klik bewaart het bestand.');
  }
  function savePrivateNotes() {
    if (!notesExport) return;
    const url = URL.createObjectURL(new Blob([notesExport], { type:'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-eigen-fotovergelijking-notities.txt';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotesExport(null);
    setNotice('Alleen je eigen tekstnotities als TXT aangeboden. De gekozen opslaglocatie kan synchroniseren.');
  }
  return <section className="panel" aria-labelledby="private-photo-comparison-heading">
    <div>
      <p className="eyebrow">EIGEN FOTO’S · ALLEEN IN DIT TABBLAD</p>
      <h2 id="private-photo-comparison-heading">Twee woningen visueel vergelijken</h2>
      <p>Bekijk eigen woning- of bezichtigingsfoto’s naast elkaar, zonder ze
        te verzenden. Voeg maximaal drie foto’s per woning toe en maak
        alleen tijdelijke persoonlijke aantekeningen. Sluiten of vernieuwen
        van dit tabblad verwijdert alle foto’s en tekst uit de app.</p>
      <p><strong>Privacy:</strong> kies bij voorkeur foto’s zonder personen,
        adres, documenten of zichtbare persoonlijke spullen. Je originele
        bestanden blijven op je apparaat. Woonpoints leest geen EXIF-gegevens,
        uploadt niets, bewaart geen foto’s in de browseropslag en maakt geen export.</p>
      <p>Alleen handmatige visuele oriëntatie, geen officiële woningadvertentie,
        technische inspectie, taxatie, selectieadvies of WoningNet-broncontrole.</p>
    </div>
    <div>
      <p aria-live="polite">Lokaal geladen: {album.A.length + album.B.length} van maximaal 6 foto’s
        {' · '}{(totalBytes/1048576).toLocaleString('nl-NL',{maximumFractionDigits:1})} MiB
        van maximaal 20 MiB.</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
        {(['A','B'] as const).map(side => {
          const images = album[side];
          const focus = images.find(item => item.id === selected[side]) ?? images[0];
          return <div key={side} style={{flex:'1 1 280px', minWidth:0}}>
            <h3>Woning {side} · {images.length}/3</h3>
            <label htmlFor={'private-photo-file-'+side}>Kies eigen foto’s voor woning {side}</label>
            <input id={'private-photo-file-'+side} type="file" multiple
              accept="image/jpeg,image/png,image/webp" disabled={images.length >= LIMIT_EACH}
              onChange={event=>{
                const files = event.currentTarget.files;
                event.currentTarget.value = '';
                void addPhotos(side, files);
              }} />
            {focus ? <figure>
              {/* User-supplied local files never become remote image URLs. */}
              <img src={focus.url} alt={'Lokale foto '+(images.findIndex(p=>p.id===focus.id)+1)+' van woning '+side}
                style={{width:'100%',height:260,objectFit:'contain'}} />
              <figcaption>Alleen lokaal voorbeeld; controleer het echte pand zelf.</figcaption>
            </figure> : <p>Nog geen foto gekozen voor deze woning.</p>}
            {images.length > 0 && <ul>
              {images.map((photo,index)=><li key={photo.id}>
                <button type="button" className="secondary"
                  aria-pressed={focus?.id === photo.id}
                  onClick={()=>setSelected(current=>({...current,[side]:photo.id}))}>
                  Bekijk foto {index+1} ({(photo.bytes/1048576).toLocaleString('nl-NL',{maximumFractionDigits:1})} MiB)
                </button>
                <button type="button" className="secondary"
                  onClick={()=>removePhoto(side,photo.id)}>
                  Verwijder foto {index+1}
                </button>
              </li>)}
            </ul>}
            <label htmlFor={'private-photo-notes-'+side}>Eigen aantekeningen woning {side} (tijdelijk)</label>
            <textarea id={'private-photo-notes-'+side} rows={4} maxLength={400}
              value={notes[side]} onChange={event=>{
                setNotes(current=>({...current,[side]:event.target.value}));
                setNotesExport(null);
              }} placeholder="Bijvoorbeeld: hoe valt het daglicht?"
              autoComplete="off" />
          </div>;
        })}
      </div>
      <div className="month-csv-confirm"
        aria-labelledby="private-photo-overlay-heading">
        <h3 id="private-photo-overlay-heading">Leg twee eigen foto’s over elkaar</h3>
        <p>Kies hierboven eerst één foto bij woning A en één bij woning B.
          De schuif toont links een groter deel van woning B over foto A.
          Dit is alleen een visueel hulpmiddel: perspectief, formaat en
          schaal kunnen sterk verschillen. Er wordt geen bouwkundige
          gelijkwaardigheid of identieke camerastand bewezen.</p>
        {overlayA && overlayB ? <div>
          <div style={{position:'relative',width:'100%',height:320,overflow:'hidden',
            background:'#edf2f4',borderRadius:8}}>
            <img src={overlayA.url} alt="Zelfgekozen lokale basisfoto van woning A"
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}} />
            <img src={overlayB.url} alt="Zelfgekozen lokale overliggende foto van woning B"
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain',
                clipPath:'inset(0 '+(100-overlayPercent)+'% 0 0)'}} />
            <div aria-hidden="true" style={{position:'absolute',top:0,bottom:0,
              left:overlayPercent+'%',width:2,background:'currentColor',
              pointerEvents:'none'}} />
          </div>
          <label htmlFor="private-photo-overlay-range">
            Deel van foto B links: {overlayPercent}% · foto A rechts: {100-overlayPercent}%
          </label>
          <input id="private-photo-overlay-range" type="range" min="0" max="100" step="5"
            value={overlayPercent} onChange={event=>setOverlayPercent(Number(event.target.value))}
            style={{width:'100%'}} />
          <button type="button" className="secondary"
            onClick={()=>setOverlayPercent(50)}>Verdeling terug naar 50/50</button>
          <p>Beide foto’s worden slechts tijdelijk lokaal getoond.
            De schuif verandert geen origineel bestand of notitie.</p>
        </div> : <p>Voeg in beide kolommen een foto toe om de schuifvergelijking
          te gebruiken. Er worden geen voorbeelden of foto's opgehaald.</p>}
      </div>
      <div className="month-csv-confirm">
        <h3>Bewaar alleen eigen observaties</h3>
        <p>Wil je je korte A/B-aantekeningen zelf bewaren? De tekstexport
          bevat nooit een foto, bestandsnaam, afbeeldinglink of EXIF-metadata.
          Controleer je eigen tekst eerst op adressen en andere privégegevens.</p>
        <button type="button" onClick={preparePrivateNotes}
          disabled={!notes.A.trim() && !notes.B.trim()}>
          Toon privé-TXT-voorbeeld…
        </button>
        {notesExport !== null && <div role="group"
          aria-label="Bevestig bewuste export van eigen observaties">
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{notesExport}</pre>
          <button type="button" onClick={savePrivateNotes}>
            Ja, bewaar alleen deze tekst als TXT…
          </button>
          <button type="button" className="secondary" onClick={()=>{
            setNotesExport(null);setNotice('Export geannuleerd. Je eigen notities blijven lokaal.');
          }}>Nee, geen bestand maken</button>
        </div>}
      </div>
      <button type="button" className="secondary"
        disabled={album.A.length + album.B.length === 0 && !notes.A && !notes.B}
        onClick={clearAll}>Wis beide albums en aantekeningen</button>
      <p role="status">{notice}</p>
      <p>Geen automatische opslag of verzending: alleen een bewuste eigen TXT-notitie kan worden bewaard. Zorg zelf voor je originele foto’s
        en rekening houden met privacy of auteursrechten bij je eigen bestandskeuze.
        Vergelijking in dit paneel verandert je overige Woonpoints-berekeningen niet.</p>
    </div>
  </section>;
}


type CommuteTravelMode = 'auto' | 'ov' | 'fiets';
type CommuteScenario = {
  rent: string;
  housingExtras: string;
  weeklyTrips: string;
  workingWeeks: string;
  oneWayMinutes: string;
  mode: CommuteTravelMode;
  returnKm: string;
  carEuroKm: string;
  parkingEuro: string;
  ticketEuro: string;
  bikeEuro: string;
  employerEuro: string;
};
type CommuteFieldName = Exclude<keyof CommuteScenario, 'mode'>;
const commuteDefaults: Record<'A'|'B', CommuteScenario> = {
  A: {rent:'950',housingExtras:'175',weeklyTrips:'3',workingWeeks:'46',
    oneWayMinutes:'50',mode:'auto',returnKm:'80',carEuroKm:'0.30',
    parkingEuro:'0',ticketEuro:'0',bikeEuro:'0',employerEuro:'0'},
  B: {rent:'1100',housingExtras:'175',weeklyTrips:'3',workingWeeks:'46',
    oneWayMinutes:'25',mode:'auto',returnKm:'40',carEuroKm:'0.30',
    parkingEuro:'0',ticketEuro:'0',bikeEuro:'0',employerEuro:'0'}
};
const commuteLimits: Record<CommuteFieldName, [number,number]> = {
  rent:[0,10000], housingExtras:[0,5000], weeklyTrips:[0,7],
  workingWeeks:[0,53], oneWayMinutes:[0,300], returnKm:[0,1000],
  carEuroKm:[0,5], parkingEuro:[0,150], ticketEuro:[0,200],
  bikeEuro:[0,100], employerEuro:[0,300]
};
const commuteIntegerFields = new Set<CommuteFieldName>(['weeklyTrips','workingWeeks','oneWayMinutes']);
type CommuteCalculation = {
  days:number; grossPerTrip:number; netPerTrip:number;
  grossTravelYear:number; compensatedYear:number; travelYear:number;
  hoursYear:number; housingYear:number; combinedYear:number; combinedMonth:number;
};
function calculateCommute(s: CommuteScenario): CommuteCalculation | null {
  const values = {} as Record<CommuteFieldName, number>;
  for(const key of Object.keys(commuteLimits) as CommuteFieldName[]) {
    const raw = s[key].trim().replace(',', '.');
    if (!/^(?:\d+)(?:\.\d{1,2})?$/.test(raw)) return null;
    const n = Number(raw);
    const [low,high] = commuteLimits[key];
    if(!Number.isFinite(n) || n < low || n > high ||
      (commuteIntegerFields.has(key) && !Number.isInteger(n))) return null;
    values[key] = n;
  }
  const days = values.weeklyTrips * values.workingWeeks;
  const gross = s.mode==='auto'
    ? values.returnKm * values.carEuroKm + values.parkingEuro
    : s.mode==='ov' ? values.ticketEuro : values.bikeEuro;
  // Employer help is an unverified personal estimate, not tax or payroll advice.
  const compensated = Math.min(gross,values.employerEuro);
  const net = Math.max(0,gross-compensated);
  const housingYear=(values.rent+values.housingExtras)*12;
  return {
    days, grossPerTrip:gross, netPerTrip:net,
    grossTravelYear:gross*days, compensatedYear:compensated*days,
    travelYear:net*days, hoursYear:days*values.oneWayMinutes*2/60,
    housingYear, combinedYear:housingYear+net*days,
    combinedMonth:(housingYear+net*days)/12
  };
}
const commuteEuro=(v:number)=>new Intl.NumberFormat('nl-NL',{
  style:'currency',currency:'EUR',maximumFractionDigits:2
}).format(v);
const commuteNumber=(v:number)=>new Intl.NumberFormat('nl-NL',{
  maximumFractionDigits:1
}).format(v);

export function PrivateCommuteComparison() {
  const [scenarios,setScenarios]=useState<Record<'A'|'B',CommuteScenario>>({
    A:{...commuteDefaults.A}, B:{...commuteDefaults.B}
  });
  const [report,setReport]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const a=calculateCommute(scenarios.A), b=calculateCommute(scenarios.B);
  const update=(side:'A'|'B', field:keyof CommuteScenario,value:string)=>{
    setScenarios(prev=>({...prev,[side]:{...prev[side],[field]:value}}));
    setReport(null);setMessage('');
  };
  const fields: Array<[CommuteFieldName,string,string]> = [
    ['rent','Maandhuur (€)','1000'],
    ['housingExtras','Overige vaste woonkosten per maand (€)','175'],
    ['weeklyTrips','Reisdagen per week','3'],
    ['workingWeeks','Reisweken per jaar (eigen inschatting)','46'],
    ['oneWayMinutes','Enkele reistijd per reisdag (min)','45']
  ];
  function prepareReport(){
    if(!a||!b){setMessage('Corrigeer eerst beide scenario’s.');return;}
    const lines=[
      'WOONPOINTS · EIGEN WOON-WERKVERGELIJKING',
      'Alle bedragen en reistijden zijn zelf ingevulde aannames, geen extern gecontroleerde prijzen.',
      'Geen officiële WoningNet-reactie, belasting-, hypotheek-, salaris- of woonadvies.',
      '',
    ];
    for(const side of ['A','B'] as const){
      const s=scenarios[side], c=side==='A'?a:b;
      lines.push('WONING '+side,
        'Maandhuur: '+commuteEuro(Number(s.rent.replace(',','.'))),
        'Overige maandelijkse woonkosten: '+commuteEuro(Number(s.housingExtras.replace(',','.'))),
        'Vervoer: '+({auto:'Auto',ov:'Openbaar vervoer',fiets:'Fiets/lopen'} as const)[s.mode],
        'Werkelijk gekozen reisdagen x weken: '+s.weeklyTrips+' x '+s.workingWeeks+' = '+c.days,
        'Enkele reistijd: '+s.oneWayMinutes+' min',
        'Brutoreiskosten per reisdag: '+commuteEuro(c.grossPerTrip),
        'Zelf geraamde vergoeding, maximaal geraamde ritkosten: '+commuteEuro(c.compensatedYear/c.days || 0),
        'Netto eigen reiskosten per jaar: '+commuteEuro(c.travelYear),
        'Reistijd per jaar: '+commuteNumber(c.hoursYear)+' uur',
        'Woonkosten per jaar: '+commuteEuro(c.housingYear),
        'Woonkosten plus eigen reizen per jaar: '+commuteEuro(c.combinedYear),
        '');
    }
    lines.push('JAARVERSCHIL (WONING B MIN A)',
      'Totale jaarlijkse eigen kosten: '+commuteEuro(b.combinedYear-a.combinedYear),
      'Reisuren per jaar: '+commuteNumber(b.hoursYear-a.hoursYear),
      'Dit model rekent geen loonwaarde van tijd, subsidies of fiscale voordelen mee.',
      'Gebruikte werkdagen zijn handmatig gekozen en missen ziekte/feestdagen en variabele ritten.');
    setReport(lines.join('\n')+'\n');
    setMessage('Controleer de concepttekst. Pas na een tweede klik wordt een bestand aangeboden.');
  }
  function saveReport(){
    if(!report || !a || !b)return;
    const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;
    link.download='woonpoints-eigen-woonwerkvergelijking.txt';link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setReport(null);setMessage('Privé-TXT aangeboden. Je gekozen opslaglocatie kan synchroniseren.');
  }
  return <section className="panel" aria-labelledby="private-commute-heading">
    <div>
      <p className="eyebrow">EIGEN WOON-WERKAFWEGING · OFFLINE</p>
      <h2 id="private-commute-heading">Hoeveel kost reizen vanaf twee woningen?</h2>
      <p>Vergelijk woonkosten, zelf geschatte reiskosten en reisuren voor twee
        opties. Kies per woning auto, OV of fiets/lopen; geef jouw werkweken
        en reisdagen op. Dit is geen routeplanner: Woonpoints haalt geen
        tarieven, reistijden, adressen of werkgevergegevens op.</p>
      <p><strong>Let op:</strong> alle bedragen, reiskostenvergoedingen en
        dagen komen van jou. Dit model is geen belasting- of mobiliteitsadvies,
        bevat geen tijdwaardering en verandert geen bestaande woningselectie.</p>
    </div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
      {(['A','B'] as const).map(side=>{
        const s=scenarios[side],c=side==='A'?a:b;
        return <div key={side} style={{flex:'1 1 280px',minWidth:0}}>
          <h3>Woning {side}</h3>
          {fields.map(([key,label,hint])=><div key={key}>
            <label htmlFor={'commute-'+side+'-'+key}>{label}</label>
            <input id={'commute-'+side+'-'+key} type="text" inputMode="decimal"
              maxLength={10} placeholder={hint} value={s[key]}
              onChange={e=>update(side,key,e.target.value)} />
          </div>)}
          <label htmlFor={'commute-'+side+'-mode'}>Vervoer naar werk</label>
          <select id={'commute-'+side+'-mode'} value={s.mode}
            onChange={e=>update(side,'mode',e.target.value)}>
            <option value="auto">Auto</option>
            <option value="ov">Openbaar vervoer</option>
            <option value="fiets">Fiets of lopen</option>
          </select>
          {s.mode==='auto'&&<>
            <label htmlFor={'commute-'+side+'-returnKm'}>Kilometers heen + terug per dag</label>
            <input id={'commute-'+side+'-returnKm'} type="text" inputMode="decimal" maxLength={10}
              value={s.returnKm} onChange={e=>update(side,'returnKm',e.target.value)} />
            <label htmlFor={'commute-'+side+'-carEuroKm'}>Zelf geraamde totale autokosten per km (€)</label>
            <input id={'commute-'+side+'-carEuroKm'} type="text" inputMode="decimal" maxLength={10}
              value={s.carEuroKm} onChange={e=>update(side,'carEuroKm',e.target.value)} />
            <label htmlFor={'commute-'+side+'-parkingEuro'}>Parkeren/tol per reisdag (€)</label>
            <input id={'commute-'+side+'-parkingEuro'} type="text" inputMode="decimal" maxLength={10}
              value={s.parkingEuro} onChange={e=>update(side,'parkingEuro',e.target.value)} />
          </>}
          {s.mode==='ov'&&<>
            <label htmlFor={'commute-'+side+'-ticketEuro'}>Retour OV per reisdag (€)</label>
            <input id={'commute-'+side+'-ticketEuro'} type="text" inputMode="decimal" maxLength={10}
              value={s.ticketEuro} onChange={e=>update(side,'ticketEuro',e.target.value)} />
          </>}
          {s.mode==='fiets'&&<>
            <label htmlFor={'commute-'+side+'-bikeEuro'}>Eigen fiets-/loopkosten per reisdag (€)</label>
            <input id={'commute-'+side+'-bikeEuro'} type="text" inputMode="decimal" maxLength={10}
              value={s.bikeEuro} onChange={e=>update(side,'bikeEuro',e.target.value)} />
          </>}
          <label htmlFor={'commute-'+side+'-employerEuro'}>Zelf geraamde werkgeversvergoeding per reisdag (€)</label>
          <input id={'commute-'+side+'-employerEuro'} type="text" inputMode="decimal"
            maxLength={10} value={s.employerEuro}
            onChange={e=>update(side,'employerEuro',e.target.value)} />
          {!c?<p role="alert">Controleer de getallen: geen negatieve waarden,
            maximaal 7 reisdagen, 53 weken, 300 minuten en 10.000 commuteEuro huur.
            Geldbedragen mogen maximaal twee decimalen hebben.</p>:
            <dl>
              <div><dt>Eigen reisdagen per jaar</dt><dd>{c.days}</dd></div>
              <div><dt>Brutoreiskosten per jaar</dt><dd>{commuteEuro(c.grossTravelYear)}</dd></div>
              <div><dt>Vergoeding voor zover reiskosten gedekt</dt><dd>{commuteEuro(c.compensatedYear)}</dd></div>
              <div><dt>Eigen netto reiskosten per jaar</dt><dd>{commuteEuro(c.travelYear)}</dd></div>
              <div><dt>Reisuren per jaar</dt><dd>{commuteNumber(c.hoursYear)}</dd></div>
              <div><dt>Woonkosten + reizen per maand (jaargemiddelde)</dt><dd>{commuteEuro(c.combinedMonth)}</dd></div>
            </dl>}
        </div>;
      })}
    </div>
    {a&&b&&<div aria-live="polite">
      <h3>Verschil: B ten opzichte van A</h3>
      <p><strong>{commuteEuro(b.combinedYear-a.combinedYear)}</strong> per jaar aan woonkosten
        plus eigen woon-werkverkeer. {commuteNumber(b.hoursYear-a.hoursYear)} reisuren per jaar verschil.</p>
      <p>Een negatief kostenverschil betekent dat B in deze aannames goedkoper is;
        een negatief urenverschil betekent minder geschatte reistijd. De
        werkgeversvergoeding wordt nooit hoger afgetrokken dan de
        geraamde reiskosten per dag. Er is geen belastingberekening.</p>
    </div>}
    <div className="month-csv-confirm">
      <h3>Bewaar een eigen berekening</h3>
      <p>Maak optioneel een leesbaar TXT-concept van je eigen aannames en
        uitkomsten. Controleer dat eerst; downloaden vraagt een tweede klik.
        Er worden geen namen, adressen of accounts verwerkt.</p>
      <button type="button" onClick={prepareReport} disabled={!a||!b}>
        Toon privésamenvatting als concept…
      </button>
      {report!==null&&<div role="group" aria-label="Bevestig lokale reiskostenexport">
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre>
        <button type="button" onClick={saveReport}>Ja, bewaar uitsluitend deze TXT…</button>
        <button type="button" className="secondary" onClick={()=>{
          setReport(null);setMessage('Export geannuleerd. Geen bestand gemaakt.');
        }}>Nee, behoud alleen schermgegevens</button>
      </div>}
    </div>
    <button type="button" className="secondary" onClick={()=>{
      setScenarios({A:{...commuteDefaults.A},B:{...commuteDefaults.B}});
      setReport(null);setMessage('Voorbeelden hersteld. Eventuele eigen invoer op dit scherm gewist.');
    }}>Wis eigen invoer en herstel voorbeelden</button>
    <p role="status">{message}</p>
    <p>Alles blijft tijdelijk in dit browsertabblad. Verversen of sluiten wist
      de invoer. Er is geen opslag, automatische notificatie, externe data of
      WoningNet-koppeling.</p>
  </section>;
}
