'use client';
import { useEffect, useState } from 'react';
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

export function ManualReactionJournal({
  onTransfer
}: { onTransfer?: (data: string, count: number) => void } = {}) {
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


/** Shared browser-memory-only handoff. No hidden cross-tab persistence/API. */
export function ManualPositionsWorkspace() {
  const [offer, setOffer] = useState<{ data: string; count: number } | null>(null);
  return (
    <>
      <ManualReactionJournal onTransfer={(data, count) => setOffer({ data, count })} />
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

export function ManualHousingShortlist({onCostPrefill, onPlanPrefill}: {
  onCostPrefill?: (selected: [Home, Home], preferences: Preferences) => void;
  onPlanPrefill?: (selected: Home) => void;
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
  prefill?: Home | null;
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

  function exportIcs() {
    const selected = entries.filter(item => item.status === 'open');
    if (!selected.length) return;
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
      'text/calendar;charset=utf-8', 'woonpoints-eigen-deadlines.ics');
    setNotice('iCalendar aangeboden voor eigen import. Agendameldingen hangen af van jouw kalenderapp.');
  }

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
          setDraft({...emptyPrivatePlan, label: prefill.label});
          setDeleteIndex(null);
          setPendingImport(null);
          setNotice('Label ingevuld. Kies zelf type, datum en tijd en klik dan pas op Voeg eigen actie toe.');
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
          <button type="button" disabled={!pending} onClick={exportIcs}>Download agenda (.ics)</button>
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

type CostHandoff = {selected: [Home, Home]; preferences: Preferences};

/** Two explicit, local-only handoffs unify shortlist, cost comparison and action planning. */
export function ManualHousingDecisionWorkspace() {
  const [handoff, setHandoff] = useState<CostHandoff | null>(null);
  const [planPrefill, setPlanPrefill] = useState<Home | null>(null);
  return (
    <>
      <ManualHousingShortlist onCostPrefill={(selected, preferences) =>
        setHandoff({
          selected: [{...selected[0]}, {...selected[1]}],
          preferences: {...preferences}
        })}
        onPlanPrefill={home => setPlanPrefill({...home})} />
      <ManualHousingCostComparison handoff={handoff} />
      <ManualDeadlinePlanner prefill={planPrefill} onPrefillHandled={() => setPlanPrefill(null)} />
    </>
  );
}

export function ManualHousingCostComparison({handoff}: {handoff?: CostHandoff | null} = {}) {
  const [a, setA] = useState<CostDraft>(() => blankCosts('Woning A'));
  const [b, setB] = useState<CostDraft>(() => blankCosts('Woning B'));
  const [show, setShow] = useState(false);
  const [notice, setNotice] = useState('');
  const [fromShortlist, setFromShortlist] = useState(false);

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
