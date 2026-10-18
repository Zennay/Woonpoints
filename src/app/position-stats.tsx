'use client';
import { useState } from 'react';
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
export function ManualPositionHistory() {
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

export function ManualReactionJournal() {
  const [entries, setEntries] = useState<JournalItem[]>([]);
  const [nextId, setNextId] = useState(1);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<JournalStatus>('planned');
  const [rankInput, setRankInput] = useState('');
  const [totalInput, setTotalInput] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [pendingImport, setPendingImport] = useState<JournalItem[] | null>(null);

  const journal = summarizeManualReactionJournal(entries);
  const visible = [...entries]
    .filter(row => monthFilter === 'all' || row.date.slice(0, 7) === monthFilter)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const rowCount = journal.total;

  function add() {
    setMessage('');
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
      setNextId(n => n + 1);
      setRankInput('');
      setTotalInput('');
      setMessage('Eigen notitie toegevoegd. Niet gecontroleerd door WoningNet.');
    } catch {
      setMessage('Deze datum of eindpositie is ongeldig. Huidige notities zijn behouden.');
    }
  }

  function updateState(id: number, state: JournalStatus) {
    if (!Object.hasOwn(statusNames, state)) return;
    setEntries(old => old.map(row => row.id === id ? { ...row, status: state } : row));
    setMessage('Eigen status aangepast; dit is geen officiële registratiestatus.');
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
        <p><strong>{rowCount}</strong> eigen notities · <strong>{journal.recordedPositions}</strong> met
          zelf ingevoerde eindpositie. Nul officiële reacties geverifieerd.</p>
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
                  onChange={e => updateState(row.id, e.target.value as JournalStatus)}>
                  {Object.entries(statusNames).map(([value, label]) =>
                    <option key={value} value={value}>{label}</option>)}
                </select>
                <button type="button" onClick={() => {
                  setEntries(old => old.filter(item => item.id !== row.id));
                  setMessage('Eigen notitie verwijderd; geen WoningNet-reactie gewijzigd.');
                }}>Verwijder</button>
              </article>)}
              {!visible.length && <p>Geen eigen notities voor deze maand.</p>}
            </div>
            <button type="button" onClick={() => {
              setEntries([]);
              setPendingImport(null);
              setMonthFilter('all');
              setMessage('Alle eigen notities uit dit tabblad gewist.');
            }}>Wis alle eigen notities in dit tabblad</button>
          </>
        )}
      </div>
    </section>
  );
}
