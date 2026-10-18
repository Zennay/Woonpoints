'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './labels.css';
import { readBoxLabelBackup, writeBoxLabelBackup, type PortableBoxBatch } from './backup';

type Priority = 'direct' | 'eerst' | 'later';
type Batch = {
  id: number;
  room: string;
  contents: string;
  count: number;
  fragile: boolean;
  priority: Priority;
};
type Draft = Omit<Batch, 'id'>;

const MAX_BATCHES = 20;
const MAX_LABELS = 48;
const initialDraft: Draft = { room: '', contents: '', count: 1, fragile: false, priority: 'eerst' };
const priorityText: Record<Priority, string> = {
  direct: 'DIRECT NODIG', eerst: 'BIJ AANKOMST', later: 'KAN WACHTEN'
};

function cleaned(value: string, limit: number) {
  return value.replace(/[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, ' ').trim().slice(0, limit);
}

function escapeCsv(value: string) {
  // Protect spreadsheet importers, including Unicode-normalized leading formula characters.
  const normalized = value.normalize('NFKC');
  const cell = /^[\s]*[=+@-]/u.test(normalized) ? "'" + normalized : normalized;
  return '"' + cell.replace(/"/g, '""') + '"';
}

export default function MovingBoxLabelsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [editing, setEditing] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [message, setMessage] = useState('');
  const [showContentsInCsv, setShowContentsInCsv] = useState(false);
  const [clearRequested, setClearRequested] = useState(false);
  const [approvedBackup, setApprovedBackup] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    batches: PortableBoxBatch[]; sourceStamp: string; preview: string;
  } | null>(null);
  const [lastRestore, setLastRestore] = useState<{before: Batch[]; afterStamp: string} | null>(null);

  const labelCount = useMemo(() => batches.reduce((total, b) => total + b.count, 0), [batches]);
  const labels = useMemo(() => batches.flatMap(b => Array.from({ length: b.count }, (_, n) => ({
    key: b.id + ':' + n,
    number: n + 1,
    ...b
  }))), [batches]);
  const pages = useMemo(() => Array.from({length: Math.ceil(labels.length / 6)}, (_, i) => labels.slice(i * 6, i * 6 + 6)), [labels]);
  const backupPreview = useMemo(() => writeBoxLabelBackup(batches), [batches]);
  const batchStamp = useMemo(() => JSON.stringify(batches), [batches]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const room = cleaned(draft.room, 36);
    const contents = cleaned(draft.contents, 80);
    const count = Number(draft.count);
    const prior = editing === null ? 0 : batches.find(b => b.id === editing)?.count ?? 0;
    const requested = labelCount - prior + count;
    if (!room) { setMessage('Vul eerst een kamer of bestemming in.'); return; }
    if (!Number.isSafeInteger(count) || count < 1 || count > 24) {
      setMessage('Kies 1 tot en met 24 etiketten per reeks.'); return;
    }
    if (requested > MAX_LABELS) { setMessage('Er passen maximaal 48 etiketten in één printopdracht.'); return; }
    if (editing === null && batches.length >= MAX_BATCHES) {
      setMessage('Maximaal 20 reeksen. Verwijder eerst een reeks.'); return;
    }
    const value = {room, contents, count, fragile: draft.fragile, priority: draft.priority};
    if (editing !== null) {
      setBatches(current => current.map(b => b.id === editing ? {...b, ...value} : b));
      setMessage('Reeks bijgewerkt; controleer de actuele afdrukvoorbeelden.');
    } else {
      setBatches(current => [...current, {id: nextId, ...value}]);
      setNextId(id => id + 1);
      setMessage('Reeks toegevoegd; controleer de actuele afdrukvoorbeelden.');
    }
    setDraft(initialDraft);
    setEditing(null);
    setClearRequested(false);
  }

  function edit(batch: Batch) {
    setEditing(batch.id);
    setDraft({room: batch.room, contents: batch.contents, count: batch.count, fragile: batch.fragile, priority: batch.priority});
    setMessage('Bewerk de geselecteerde reeks en kies daarna Opslaan.');
    document.getElementById('label-entry-heading')?.scrollIntoView({behavior: 'smooth', block: 'start'});
  }

  function remove(id: number) {
    setBatches(current => current.filter(b => b.id !== id));
    if (editing === id) { setDraft(initialDraft); setEditing(null); }
    setClearRequested(false);
    setMessage('Reeks verwijderd. De nieuwe afdruk toont alleen de resterende labels.');
  }

  function clearAll() {
    if (!clearRequested) {
      setClearRequested(true);
      setMessage('Nog niets gewist. Klik nogmaals op Alle reeksen wissen om te bevestigen.');
      return;
    }
    setBatches([]);
    setDraft(initialDraft);
    setEditing(null);
    setClearRequested(false);
    setMessage('Alle reeksen uit dit tabblad gewist.');
  }

  function saveCsv() {
    if (!labels.length) return;
    const rows = [['Kamer', 'Reeksnummer', 'Doosnummer', 'Prioriteit', 'Breekbaar', 'Inhoud']];
    for (const item of labels) {
      rows.push([
        item.room, String(item.id), String(item.number), priorityText[item.priority],
        item.fragile ? 'Ja' : 'Nee', showContentsInCsv ? item.contents : ''
      ]);
    }
    const csv = '\uFEFF' + rows.map(row => row.map(escapeCsv).join(',')).join('\r\n') + '\r\n';
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mijn-verhuisdozenlabels.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage(showContentsInCsv
        ? 'CSV gedownload inclusief de inhoud die je zelf invoerde.'
        : 'CSV gedownload zonder vrije inhoudnotities.');
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function downloadBackup() {
    if (!batches.length || approvedBackup !== backupPreview) {
      setMessage('Bekijk en bevestig eerst de actuele volledige back-upinhoud.');
      return;
    }
    const blob = new Blob([backupPreview], {type: 'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mijn-verhuisdozenlabels-backup.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage('Eigen volledige JSON-back-up gedownload. Bewaar dit bestand zelf veilig.');
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    setPendingImport(null);
    if (!file) return;
    if (file.size > 16 * 1024 || file.size === 0) {
      setMessage('Back-up geweigerd: het bestand moet tussen 1 byte en 16 KiB groot zijn.');
      return;
    }
    try {
      const raw = await file.text();
      const accepted = readBoxLabelBackup(raw);
      setPendingImport({
        batches: accepted, sourceStamp: batchStamp, preview: raw
      });
      setMessage('Bestand alleen gelezen, nog niets vervangen. Controleer de volledige voorbeeldinhoud.');
    } catch {
      setMessage('Geen geldig, volledig Woonpoints-dozenlabelsback-upbestand. Bestaande reeksen zijn intact.');
    }
  }

  function applyBackup() {
    if (!pendingImport) return;
    if (batchStamp !== pendingImport.sourceStamp) {
      setPendingImport(null);
      setMessage('Je reeksen zijn na het openen van de back-up veranderd. Selecteer het bestand opnieuw.');
      return;
    }
    const restored = pendingImport.batches.map((b, i) => ({...b, id: nextId + i}));
    setLastRestore({before: batches, afterStamp: JSON.stringify(restored)});
    setBatches(restored);
    setNextId(id => id + restored.length);
    setDraft(initialDraft);
    setEditing(null);
    setClearRequested(false);
    setApprovedBackup(null);
    setPendingImport(null);
    setMessage('Back-up hersteld in dit tabblad. De vorige inhoud kun je één keer terugzetten zolang je niets wijzigt.');
  }

  function undoRestore() {
    if (!lastRestore) return;
    if (batchStamp !== lastRestore.afterStamp) {
      setLastRestore(null);
      setMessage('Herstel ongedaan maken kan niet meer: de reeksen zijn inmiddels gewijzigd.');
      return;
    }
    setBatches(lastRestore.before);
    setLastRestore(null);
    setApprovedBackup(null);
    setMessage('Vorige reeksen eenmalig teruggezet in dit tabblad.');
  }

  return <main className="boxStudio">
    <div className="boxStudioControls">
      <a className="boxBack" href="/">← Woonpoints</a>
      <p className="boxEyebrow">Privé verhuisgereedschap</p>
      <h1>Verhuisdozenlabels</h1>
      <p>Maak duidelijke A4-etiketten per kamer, met doosnummer, breekbaar-markering en uitpakprioriteit. Alles blijft in het huidige tabblad. Er wordt niets naar een server verstuurd en niets in je browser opgeslagen.</p>
      <div className="boxPrivacy">Dit zijn je eigen labels, geen officieel bewijs. Print naar papier of kies in het afdrukvenster zelf voor opslaan als PDF. Sluit je dit tabblad, dan ben je niet-opgeslagen reeksen kwijt.</div>
      <section className="boxPanel" aria-labelledby="label-entry-heading">
        <h2 id="label-entry-heading">{editing === null ? 'Nieuwe reeks' : 'Reeks aanpassen'}</h2>
        <form onSubmit={submit} className="boxForm">
          <label>Kamer of bestemming
            <input required maxLength={36} value={draft.room} onChange={e => setDraft(d => ({...d, room: e.target.value}))} placeholder="Bijv. keuken, slaapkamer" />
          </label>
          <label>Inhoud (optioneel)
            <input maxLength={80} value={draft.contents} onChange={e => setDraft(d => ({...d, contents: e.target.value}))} placeholder="Bijv. borden en glazen" />
          </label>
          <label>Aantal labels
            <input type="number" min="1" max="24" step="1" required value={draft.count} onChange={e => setDraft(d => ({...d, count: Number(e.target.value)}))}/>
          </label>
          <label>Uitpakprioriteit
            <select value={draft.priority} onChange={e => setDraft(d => ({...d, priority: e.target.value as Priority}))}>
              <option value="direct">Direct nodig</option>
              <option value="eerst">Bij aankomst</option>
              <option value="later">Kan wachten</option>
            </select>
          </label>
          <label className="boxCheckbox"><input type="checkbox" checked={draft.fragile} onChange={e => setDraft(d => ({...d, fragile: e.target.checked}))}/> Breekbaar / voorzichtig vervoeren</label>
          <div className="boxActions">
            <button type="submit">{editing === null ? 'Reeks toevoegen' : 'Wijzigingen opslaan'}</button>
            {editing !== null && <button type="button" className="boxSecondary" onClick={() => {setEditing(null); setDraft(initialDraft); setMessage('Bewerken geannuleerd.');}}>Annuleren</button>}
          </div>
        </form>
      </section>

      <section className="boxPanel" aria-labelledby="box-series">
        <div className="boxRowHeading"><h2 id="box-series">Jouw reeksen</h2><span>{labelCount} / {MAX_LABELS} labels</span></div>
        {batches.length === 0 ? <p>Nog geen reeksen. Voeg hierboven je eerste kamer toe.</p> :
          <ol className="boxSeries">{batches.map(b => <li key={b.id}>
            <div><strong>{b.room}</strong><span>{b.count} × · {priorityText[b.priority]}{b.fragile ? ' · BREKBAAR' : ''}</span>{b.contents && <small>{b.contents}</small>}</div>
            <div className="boxInlineActions"><button type="button" className="boxSecondary" onClick={() => edit(b)}>Bewerken</button><button type="button" className="boxDanger" onClick={() => remove(b.id)}>Verwijderen</button></div>
          </li>)}</ol>}
        {batches.length > 0 && <button type="button" className="boxDanger" onClick={clearAll}>{clearRequested ? 'Bevestig: alle reeksen wissen' : 'Alle reeksen wissen'}</button>}
      </section>
      <section className="boxPanel" aria-labelledby="box-output">
        <h2 id="box-output">Afdrukken en eigen CSV</h2>
        <p>{pages.length} A4-{pages.length === 1 ? 'vel' : 'vellen'} met maximaal zes etiketten per vel. Controleer de voorbeelden vóór het afdrukken.</p>
        <div className="boxActions">
          <button type="button" disabled={!labels.length} onClick={() => window.print()}>Print mijn labels / PDF</button>
          <button type="button" className="boxSecondary" disabled={!labels.length} onClick={saveCsv}>Download CSV-overzicht</button>
        </div>
        <label className="boxCheckbox"><input type="checkbox" checked={showContentsInCsv} onChange={e => setShowContentsInCsv(e.target.checked)}/> Neem mijn vrije inhoudnotities ook op in de CSV (standaard uit)</label>
        <p className="boxStatus" role="status" aria-live="polite">{message}</p>
      </section>
      <section className="boxPanel boxBackup" aria-labelledby="box-backup-heading">
        <h2 id="box-backup-heading">Privé back-up &amp; herstellen</h2>
        <p>Omdat we niets opslaan, kun je je eigen reeksen als volledig JSON-bestand bewaren. Bekijk eerst precies wat je meeneemt: kamer, inhoud, aantallen en markeringen. Er wordt niets geüpload.</p>
        {batches.length > 0 && <>
          <details><summary>Bekijk alle gegevens in mijn back-up</summary><pre>{backupPreview}</pre></details>
          <div className="boxActions">
            <button className="boxSecondary" type="button" onClick={() => {setApprovedBackup(backupPreview); setMessage('Deze exacte back-upinhoud is goedgekeurd voor een eigen download.');}}>
              Ik heb de volledige inhoud bekeken en keur de download goed
            </button>
            <button type="button" disabled={approvedBackup !== backupPreview} onClick={downloadBackup}>
              Download mijn volledige JSON-back-up
            </button>
          </div>
        </>}
        <label className="boxFileLabel">Open een eigen dozenlabelsback-up (max. 16 KiB)
          <input type="file" accept=".json,application/json" onChange={chooseBackup} />
        </label>
        {pendingImport && <>
          <p className="boxStatus">Voorbeeld: {pendingImport.batches.length} reeksen en {pendingImport.batches.reduce((n,b) => n + b.count,0)} labels. Je huidige {labelCount} labels worden pas na je bevestiging vervangen.</p>
          <details open><summary>Volledige te herstellen bestandsinhoud</summary><pre>{pendingImport.preview}</pre></details>
          <button type="button" className="boxDanger" onClick={applyBackup}>Bevestig: vervang mijn huidige reeksen</button>
          <button type="button" className="boxSecondary" onClick={() => {setPendingImport(null); setMessage('Herstellen geannuleerd: bestaande reeksen blijven intact.');}}>Annuleren</button>
        </>}
        {lastRestore && <div className="boxActions">
          <button type="button" className="boxSecondary" disabled={batchStamp !== lastRestore.afterStamp} onClick={undoRestore}>Eenmalig vorige reeksen terugzetten</button>
          {batchStamp !== lastRestore.afterStamp && <small>Terugzetten vervallen na een nieuwe wijziging.</small>}
        </div>}
      </section>
    </div>
    <div className="boxPrintable" aria-label="Voorbeeld van de etiketten">
      {pages.length === 0 ? <div className="boxEmpty">Je afdrukvoorbeelden verschijnen hier.</div> :
        pages.map((page, i) => <section className="boxSheet" aria-label={'A4 vel ' + (i + 1)} key={i}>
          {page.map(label => <article className="boxLabel" key={label.key}>
            <span className="boxLabelEyebrow">VERHUIZEN · EIGEN LABEL</span>
            <div className="boxLabelRoom">{label.room}</div>
            <p className="boxLabelNumber">DOOS {label.number} / {label.count}</p>
            <p className="boxLabelContents">{label.contents || 'Inhoud niet ingevuld'}</p>
            <div className="boxLabelBottom">
              <strong>{priorityText[label.priority]}</strong>
              {label.fragile && <strong className="boxFragile">⚠ BREKBAAR</strong>}
            </div>
          </article>)}
        </section>)}
    </div>
  </main>;
}
