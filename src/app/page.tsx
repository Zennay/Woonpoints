'use client';
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { PrivateMovingDayTimeline } from './manual-month-progress';
import { PrivateMovingPackingInventory } from './manual-month-progress';
import { PrivateReactionWorkflow, PrivateReactionPacing, PrivateCommuteComparison, PrivateMovingHelperRoster, PrivateAddressChangePlanner } from './position-stats';
import PositionStats from './position-stats';
import { PrivateMovingVolume, PrivateMovingHandover, PrivateMoveDocumentReadiness, PrivateMovingExpenseLedger, PrivateMovingQuoteComparison, PrivateMovingCostSplit, PrivateMovingWorkspace } from './manual-month-progress';
import { ManualHousingDecisionWorkspace, PrivatePhotoComparison } from './position-stats';

const cards = [
  ['Maanddoel', 'Onbekend', 'Doel: 4 geldige reacties; geen geverifieerde accountgegevens'],
  ['Actieve reacties', 'Onbekend', 'Nog geen account gekoppeld; actuele gegevens ontbreken'],
  ['Zoekpunten', '—', 'Nog geen puntensnapshot beschikbaar'],
  ['Worker', 'Dry-run', 'Live reageren is bewust geblokkeerd']
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">WOONPOINTS</p>
        <h1>Je WoningNet-zoektocht, overzichtelijk en controleerbaar.</h1>
        <p className="lede">
          Deze repository-baseline bewaakt voortgang, voorkeuren en historische posities. Live reageren
          staat nog uit totdat de actuele WoningNet-flow veilig is gevalideerd.
        </p>
      </section>


      <nav className="quick-nav" aria-label="Direct naar een Woonpoints-onderdeel">
        <div className="quick-nav-head">
          <strong>Direct naar</strong>
          <span>Alleen handmatige hulpmiddelen · geen live account</span>
        </div>
        <ul className="quick-nav-links">
          {([
            ['projectstatus-heading', 'Status'],
            ['manual-progress-heading', 'Maanddoel'],
            ['private-reaction-pacing-heading', 'Maandplan'],
            ['private-points-heading', 'Zoekpunten'],
            ['reaction-journal-title', 'Reacties'],
            ['housing-shortlist-heading', 'Woningen'],
            ['private-budget-title', 'Woonkosten'],
            ['private-commute-heading', 'Woon-werk'],
            ['private-longterm-title', 'Meerjarenkosten'],
            ['private-viewing-title', 'Bezichtiging'],
            ['private-photo-comparison-heading', 'Fotovergelijking'],
            ['private-plan-title', 'Planner'],
            ['private-moving-heading', 'Verhuizen'],
            ['private-moving-volume-heading', 'Verhuisvolume'],
            ['private-moving-workspace-heading', 'Verhuiswerkmap'],
            ['private-moving-day-heading', 'Verhuisdag'],
            ['private-packing-heading', 'Paklijst'],
            ['private-moving-helpers-heading', 'Verhuishulp'],
            ['private-address-change-heading', 'Adreswijzigingen'],
            ['private-handover-heading', 'Sleutelrapport'],
            ['private-document-readiness-heading', 'Documenten'],
            ['private-moving-expenses-heading', 'Werkelijke kosten'],
            ['private-moving-quotes-heading', 'Verhuisoffertes'],
            ['private-cost-split-heading', 'Kosten delen'],
            ['position-stats-heading', 'Posities'],
            ['monthly-positions-heading', 'Maandtrend']
          ] as const).map(([id, title]) =>
            <li key={id}><a href={'#'+id}>{title}</a></li>
          )}
          <li><a href="#nazorg">Nazorg &amp; gebreken</a></li>
        </ul>
      </nav>

      <section className="status-section" aria-labelledby="projectstatus-heading">
        <h2 id="projectstatus-heading" className="sr-only">Projectstatus</h2>
        <div className="grid">
          {cards.map(([label, value, detail]) => (
            <article className="card" key={label}>
              <h3>{label}</h3>
              <strong>{value}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <PrivateReactionWorkflow>
        <PositionStats />
      </PrivateReactionWorkflow>
      <PrivateReactionPacing />
      <ManualHousingDecisionWorkspace />
      <PrivatePhotoComparison />
      <PrivateCommuteComparison />
      <PrivateMovingVolume />
      <PrivateMovingWorkspace />
      <PrivateMovingDayTimeline />
      <PrivateMovingPackingInventory />
      <PrivateMovingHelperRoster />
      <PrivateAddressChangePlanner />
      <PrivateMovingHandover />
      <PrivateMoveDocumentReadiness />
      <PrivateMovingQuoteComparison />
      <PrivateMovingExpenseLedger />
      <PrivateMovingCostSplit />
      <PrivateMoveAftercare />

      <section className="panel" aria-labelledby="nazorg-link-heading">
        <div>
          <p className="eyebrow">NA DE VERHUIZING</p>
          <h2 id="nazorg-link-heading">Gebreken en open punten bijhouden</h2>
        </div>
        <div>
          <p>Maak een privé-overzicht met eigen prioriteiten, streefdatums en opvolgstatussen. Bewaar op verzoek JSON, CSV of een leesbaar dossier. Er wordt niets naar een verhuurder of woningportaal verstuurd.</p>
          <p><a href="#nazorg">Open mijn privé-nazorgdossier ↓</a></p>
        </div>
      </section>

      <section className="panel">
        <div>
          <p className="eyebrow">VEILIGHEID</p>
          <h2>Human-in-the-loop waar het ertoe doet</h2>
        </div>
        <ul>
          <li>Geen WoningNet-wachtwoorden of MFA-codes in de database.</li>
          <li>Alleen eigen of aantoonbaar geautoriseerde accounts.</li>
          <li>Loginproblemen, CAPTCHA, bezichtigingen en aanbiedingen pauzeren de worker.</li>
          <li>De huidige worker accepteert uitsluitend <code>BOT_DRY_RUN=true</code>.</li>
        </ul>
      </section>
    </main>
  );
}


type Priority = 'laag' | 'normaal' | 'dringend';
type Status = 'open' | 'gemeld' | 'afgerond';
type Item = {
  id: string;
  title: string;
  room: string;
  priority: Priority;
  status: Status;
  due: string;
  note: string;
  created: string;
};
type Draft = Pick<Item, 'title' | 'room' | 'priority' | 'due' | 'note'>;

const EMPTY: Draft = { title: '', room: '', priority: 'normaal', due: '', note: '' };
const LIMIT = 80;
const MAX_BYTES = 16 * 1024;
const KIND = 'woonpoints-private-nazorg';
const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);
const exactKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && Object.keys(value).every(k => keys.includes(k));
const validDate = (value: string) => {
  if (!/^20\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
};
const today = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};
const validText = (v: unknown, min: number, max: number) =>
  typeof v === 'string' && v.trim().length >= min && v.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v);
const isPriority = (v: unknown): v is Priority => ['laag', 'normaal', 'dringend'].includes(String(v));
const isStatus = (v: unknown): v is Status => ['open', 'gemeld', 'afgerond'].includes(String(v));
const validItem = (v: unknown): v is Item => {
  if (!isRecord(v) || !exactKeys(v, ['id', 'title', 'room', 'priority', 'status', 'due', 'note', 'created'])) return false;
  return typeof v.id === 'string' && /^item-[0-9a-f-]{36}$/.test(v.id) &&
    validText(v.title, 1, 100) && validText(v.room, 1, 40) &&
    isPriority(v.priority) && isStatus(v.status) &&
    typeof v.due === 'string' && (v.due === '' || validDate(v.due)) &&
    validText(v.note, 0, 500) &&
    typeof v.created === 'string' && validDate(v.created);
};
const readBackup = (text: string): Item[] => {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw Error('Bestand groter dan 16 KiB.');
  const data: unknown = JSON.parse(text);
  if (!isRecord(data) || !exactKeys(data, ['kind', 'schema', 'items']) ||
      data.kind !== KIND || data.schema !== 1 || !Array.isArray(data.items) ||
      data.items.length > LIMIT || !data.items.every(validItem)) {
    throw Error('Dit is geen ondersteund en geldig Woonpoints-nazorgbestand.');
  }
  const ids = data.items.map(item => (item as Item).id);
  if (new Set(ids).size !== ids.length) throw Error('Dit bestand bevat dubbele items.');
  return data.items as Item[];
};
function download(name: string, body: string, mime: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const csvCell = (value: string) => {
  const plain = value.replace(/[\r\n\t]+/g, ' ').trim();
  const safe = /^[=+@-]/.test(plain) ? "'" + plain : plain;
  return '"' + safe.replace(/"/g, '""') + '"';
};


const escapeIcs = (value: string) => value
  .replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n')
  .replace(/;/g, '\\;').replace(/,/g, '\\,');
function foldIcs(line: string): string {
  const encode = new TextEncoder();
  let length = 0;
  let output = '';
  for (const point of line) {
    const size = encode.encode(point).length;
    if (length + size > 70) { output += '\r\n '; length = 1; }
    output += point;
    length += size;
  }
  return output;
}
function nextDay(day: string) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
function calendarFor(items: Item[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const entries = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'CALSCALE:GREGORIAN',
    'PRODID:-//Woonpoints//Private Aftercare//NL', 'METHOD:PUBLISH'
  ];
  for (const item of items) {
    if (!validDate(item.due) || item.status === 'afgerond') continue;
    entries.push(
      'BEGIN:VEVENT',
      'UID:' + item.id + '@woonpoints.local',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + item.due.replace(/-/g, ''),
      'DTEND;VALUE=DATE:' + nextDay(item.due).replace(/-/g, ''),
      'SUMMARY:' + escapeIcs('Eigen nazorg: ' + item.room + ' — ' + item.title),
      'DESCRIPTION:' + escapeIcs('Persoonlijk ingevoerde deadline, geen afspraak met verhuurder. Status: ' + item.status),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY',
      'DESCRIPTION:Eigen nazorgherinnering', 'END:VALARM',
      'END:VEVENT'
    );
  }
  entries.push('END:VCALENDAR');
  return entries.map(foldIcs).join('\r\n') + '\r\n';
}

function PrivateMoveAftercare() {
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'actief' | 'alles' | 'afgerond'>('actief');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [clearPending, setClearPending] = useState(false);
  const [incoming, setIncoming] = useState<Item[] | null>(null);
  const [message, setMessage] = useState('');
  // A draft is a human-reviewed local export, never a sent or verified notice.
  const [chosenIssueIds, setChosenIssueIds] = useState<string[]>([]);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [noticeSubject, setNoticeSubject] = useState('Open aandachtspunten na mijn verhuizing');
  const [noticeDraft, setNoticeDraft] = useState('');
  const [noticeSource, setNoticeSource] = useState('');
  const [noticeApproved, setNoticeApproved] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const currentDay = today();
  const active = items.filter(item => item.status !== 'afgerond');
  const overdue = active.filter(item => item.due && item.due < currentDay);
  const noticeItems = active.filter(item => chosenIssueIds.includes(item.id)).slice(0, 12);
  const noticeFingerprint = JSON.stringify({ noticeItems, includeDetails, noticeSubject });
  const noticeCurrent = noticeDraft.length > 0 && noticeDraft.length <= 10000 &&
    noticeSource === noticeFingerprint && noticeItems.length > 0;

  const dueActive = active.filter(item => item.due).sort((a, b) =>
    a.due.localeCompare(b.due) || a.title.localeCompare(b.title));
  const [year, month, day] = currentDay.split('-').map(Number);
  const horizon = new Date(Date.UTC(year, month - 1, day + 30)).toISOString().slice(0, 10);
  const upcoming = dueActive.filter(item => item.due >= currentDay && item.due <= horizon);

  const shown = useMemo(() => items.filter(item => filter === 'alles' ||
    (filter === 'actief' ? item.status !== 'afgerond' : item.status === 'afgerond'))
    .sort((a, b) => (a.status === 'afgerond' ? 1 : 0) - (b.status === 'afgerond' ? 1 : 0) ||
      (a.due || '9999').localeCompare(b.due || '9999') || a.title.localeCompare(b.title)),
    [items, filter]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean: Draft = {
      title: draft.title.trim(), room: draft.room.trim(), priority: draft.priority,
      due: draft.due, note: draft.note.trim()
    };
    if (!validText(clean.title, 1, 100) || !validText(clean.room, 1, 40) ||
        !isPriority(clean.priority) || !validText(clean.note, 0, 500) ||
        (clean.due !== '' && !validDate(clean.due))) {
      setMessage('Controleer de titel, ruimte, datum en notitie.'); return;
    }
    if (!editing && items.length >= LIMIT) { setMessage('Maximum van 80 aandachtspunten bereikt.'); return; }
    if (editing) {
      setItems(prev => prev.map(item => item.id === editing ? { ...item, ...clean } : item));
    } else {
      setItems(prev => [...prev, {
        ...clean, id: 'item-' + crypto.randomUUID(), created: today(), status: 'open'
      }]);
    }
    setDraft(EMPTY);
    setEditing(null);
    setIncoming(null);
    setPendingDelete(null);
    setMessage(editing ? 'Aandachtspunt aangepast (alleen dit tabblad).' : 'Aandachtspunt toegevoegd (alleen dit tabblad).');
  }
  function startEdit(item: Item) {
    setDraft({ title: item.title, room: item.room, priority: item.priority, due: item.due, note: item.note });
    setEditing(item.id); setPendingDelete(null); setClearPending(false);
    document.getElementById('nazorg-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function setStatus(id: string, status: Status) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    setMessage(status === 'gemeld'
      ? 'Zelf als gemeld gemarkeerd. Er is niets aan een verhuurder verstuurd.'
      : 'Eigen status aangepast. Geen externe bevestiging.');
  }
  function exportJson() {
    const json = JSON.stringify({ kind: KIND, schema: 1, items }, null, 2);
    if (new TextEncoder().encode(json).length > MAX_BYTES) {
      setMessage('Export overschrijdt 16 KiB; verkort notities of verwijder afgeronde items.'); return;
    }
    download('woonpoints-nazorg.json', json, 'application/json;charset=utf-8');
    setMessage('Privé-JSON gemaakt. Let zelf op waar je het bestand bewaart.');
  }
  function exportCsv() {
    const header = ['ruimte', 'punt', 'prioriteit', 'status', 'eigen_deadline', 'gemaakt_op', 'notitie'];
    const rows = items.map(item => [item.room, item.title, item.priority, item.status, item.due, item.created, item.note]);
    download('woonpoints-nazorg.csv', [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n',
      'text/csv;charset=utf-8');
    setMessage('Privé-CSV gemaakt. Dit is geen verstuurde gebrekenmelding.');
  }

  function exportCalendar() {
    if (dueActive.length === 0) { setMessage('Voeg eerst een open punt met eigen streefdatum toe.'); return; }
    download('woonpoints-eigen-nazorgdeadlines.ics', calendarFor(dueActive), 'text/calendar;charset=utf-8');
    setMessage('Eigen ICS-agenda gemaakt. Import en herinneringen worden uitsluitend door je agenda-app beheerd.');
  }

  function toggleNoticeItem(id: string) {
    setChosenIssueIds(prev => prev.includes(id)
      ? prev.filter(existing => existing !== id)
      : prev.length >= 12 ? prev : [...prev, id]);
    setNoticeApproved(false);
  }
  function createNoticeDraft() {
    if (noticeItems.length < 1 || noticeItems.length > 12 ||
        !validText(noticeSubject, 1, 100)) {
      setMessage('Selecteer 1–12 actuele punten en controleer het onderwerp.'); return;
    }
    const lines = [
      'Onderwerp: ' + noticeSubject.trim(),
      '',
      'Geachte verhuurder/beheerder,',
      '',
      'Ik wil de volgende door mij geconstateerde aandachtspunten bespreken en hoor graag wat een passende vervolgstap is.',
      ''
    ];
    noticeItems.forEach((item, i) => {
      lines.push(
        `${i + 1}. ${item.room}: ${item.title} (eigen prioriteit: ${item.priority})`,
        ...(includeDetails && item.note.trim() ? ['Mijn toelichting: ' + item.note.replace(/\s+/g, ' ').trim()] : []),
        ...(item.due ? ['Mijn eigen streefdatum: ' + item.due + ' (niet met u afgesproken)'] : []),
        ''
      );
    });
    lines.push(
      'Kunt u aangeven of en hoe ik deze punten verder moet melden of laten beoordelen?',
      '',
      'Met vriendelijke groet,',
      '[Vul zelf uw naam en contactgegevens in na controle]',
      '',
      'CONCEPT — niet automatisch verzonden of juridisch getoetst.'
    );
    const candidate = lines.join('\n');
    if (candidate.length > 10000) { setMessage('Te veel inhoud voor één concept; kies minder punten.'); return; }
    setNoticeDraft(candidate);
    setNoticeSource(noticeFingerprint);
    setNoticeApproved(false);
    setMessage('Concept aangemaakt. Controleer en bewerk het vóór kopiëren of downloaden.');
  }
  async function copyNoticeDraft() {
    if (!noticeCurrent || !noticeApproved) { setMessage('Controleer en bevestig eerst het actuele concept.'); return; }
    try {
      if (!navigator.clipboard?.writeText) throw Error('Clipboard unavailable');
      await navigator.clipboard.writeText(noticeDraft);
      setMessage('Concept gekopieerd. Plak het bewust in je eigen bericht en controleer ontvanger en bijlagen.');
    } catch {
      setMessage('Kopiëren niet beschikbaar in deze browser; gebruik de bewuste TXT-download.');
    }
  }
  function downloadNoticeDraft() {
    if (!noticeCurrent || !noticeApproved) { setMessage('Controleer en bevestig eerst het actuele concept.'); return; }
    download('woonpoints-eigen-conceptmelding.txt', noticeDraft, 'text/plain;charset=utf-8');
    setMessage('Concept-TXT gedownload. Er is niets verstuurd.');
  }
  function exportText() {
    const lines = ['WOONPOINTS — eigen nazorgoverzicht', 'Niet verzonden of juridisch geverifieerd.', ''];
    for (const item of shown) {
      lines.push(`${item.room} — ${item.title}`, `Status: ${item.status} · Prioriteit: ${item.priority} · Eigen streefdatum: ${item.due || 'geen'}`,
        item.note || '(geen toelichting)', '');
    }
    download('woonpoints-nazorg-overzicht.txt', lines.join('\n'), 'text/plain;charset=utf-8');
    setMessage('Eigen TXT-overzicht gemaakt. Neem het zelf door vóór je het deelt.');
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setIncoming(null);
    if (!file) return;
    if (file.size > MAX_BYTES) { setMessage('Import geweigerd: maximaal 16 KiB.'); return; }
    try {
      const value = readBackup(await file.text());
      setIncoming(value);
      setMessage(`Gecontroleerd bestand: ${value.length} aandachtspunten. Bevestig vervanging apart.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import kon niet worden gelezen.');
    }
  }

  return (
    <div className="aftercare" id="nazorg">
      <style>{`
        .aftercare .aftercare-actions { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin:16px 0; }
        .aftercare button,.aftercare .aftercare-button { border:1px solid #355e42; border-radius:10px; background:#355e42; color:white; font:inherit; font-weight:700; padding:10px 15px; min-height:44px; cursor:pointer; }
        .aftercare button.secondary,.aftercare .aftercare-button.secondary { background:white; color:#355e42; }
        .aftercare button:focus-visible,.aftercare input:focus-visible,.aftercare select:focus-visible,.aftercare textarea:focus-visible,.aftercare a:focus-visible { outline:3px solid #173d25; outline-offset:3px; }
        .aftercare button:disabled { opacity:.5; cursor:not-allowed; }
        .aftercare label { display:block; font-weight:700; margin:12px 0 6px; }
        .aftercare input,.aftercare select,.aftercare textarea { display:block; width:100%; border:2px solid #536d5a; border-radius:9px; padding:10px; color:#18231c; background:white; font:inherit; min-height:44px; }
        .aftercare textarea { min-height:94px; resize:vertical; }
        .aftercare .aftercare-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0 16px; }
        .aftercare .aftercare-list { padding:0; list-style:none; display:grid; gap:12px; }
        .aftercare .aftercare-item { padding:18px; background:#f5f7f5; border:1px solid #d0e0d4; border-radius:12px; min-width:0; overflow-wrap:anywhere; }
        .aftercare .aftercare-item strong { display:block; font-size:20px; }
        .aftercare .aftercare-note { white-space:pre-wrap; overflow-wrap:anywhere; }
        .aftercare .aftercare-warning { border-left:4px solid #9c5725; padding:12px; background:#fff5e9; margin:14px 0; }
        .aftercare .aftercare-confirm { border:2px solid #355e42; background:#edf2ee; padding:15px; border-radius:12px; margin:12px 0; }
        .aftercare .aftercare-stats { display:flex; flex-wrap:wrap; gap:12px; padding:0; list-style:none; }
        .aftercare .aftercare-stats li { background:#edf2ee; padding:10px 14px; border-radius:10px; }
        .aftercare .aftercare-check { display:flex; align-items:start; gap:10px; font-weight:500; margin:12px 0; }
        .aftercare .aftercare-check input[type=checkbox] { width:22px; height:22px; min-height:22px; flex:0 0 22px; }
        .aftercare .aftercare-notice-picks { min-width:0; border:1px solid #d0e0d4; border-radius:12px; padding:12px; }
        .aftercare .aftercare-notice-picks legend { font-weight:700; }
        .aftercare .aftercare-notice-picks ul { list-style:none; margin:0; padding:0; max-height:350px; overflow:auto; }
        .aftercare #nazorg-notice-text { min-height:290px; }

        @media(max-width:650px) { .aftercare .aftercare-grid { grid-template-columns:1fr; } }
      `}</style>
      
      <header className="hero">
        <p className="eyebrow">PRIVÉ VERHUISNAZORG</p>
        <h2>Gebreken en open punten op één plek.</h2>
        <p className="lede">Leg zelf vast wat je na de sleuteloverdracht wilt controleren, melden of opvolgen. Alles blijft in dit tabblad totdat je bewust een bestand opslaat.</p>
      </header>
      <section className="panel" aria-labelledby="nazorg-status">
        <div>
          <h2 id="nazorg-status">Je eigen overzicht</h2>
          <p>Geen WoningNet-, verhuurder- of meldportaalverbinding. ‘Gemeld’ betekent alleen dat jij dit zelf hebt aangegeven.</p>
          {overdue.length > 0 && <p className="aftercare-warning" role="status">{overdue.length} eigen streefdatum{overdue.length === 1 ? ' is' : 's zijn'} verstreken. Controleer wat echt is afgesproken.</p>}
        </div>
        <ul className="aftercare-stats">
          <li><strong>{items.length}</strong> vastgelegd</li>
          <li><strong>{active.length}</strong> nog open</li>
          <li><strong>{overdue.length}</strong> eigen deadlines verstreken</li>
          <li><strong>{items.filter(item => item.status === 'afgerond').length}</strong> afgerond</li>
        </ul>
      </section>

      <section className="panel" aria-labelledby="nazorg-calendar-title">
        <div>
          <p className="eyebrow">EIGEN AGENDA</p>
          <h2 id="nazorg-calendar-title">Deadline-overzicht</h2>
          <p>Bekijk je eerstvolgende zelf gekozen streefdatums. Exporteer alleen niet-afgeronde punten met een datum naar een ICS-bestand. Import in een agenda-app is altijd een afzonderlijke keuze.</p>
          <p><strong>{upcoming.length}</strong> punten binnen 31 kalenderdagen · <strong>{overdue.length}</strong> verstreken · <strong>{dueActive.length}</strong> met nog open eigen datum.</p>
          <button disabled={!dueActive.length} onClick={exportCalendar}>Download ICS voor mijn agenda</button>
          <p>Geen pushmeldingen, geen automatische agendatoegang en geen aangenomen verhuurderafspraken. De agenda-app kan het gekozen bestand buiten Woonpoints bewaren of synchroniseren.</p>
        </div>
        <div>
          <h3>Komende eigen streefdatums</h3>
          {upcoming.length === 0 ? <p>Geen open punten met een datum in de komende 31 dagen.</p> :
            <ol>{upcoming.slice(0, 12).map(item =>
              <li key={item.id}><strong>{item.due}</strong> — {item.room}: {item.title} ({item.priority}, {item.status})</li>)}</ol>}
          {upcoming.length > 12 && <p>En nog {upcoming.length - 12} punten. Bekijk de volledige lijst hieronder of exporteer de ICS.</p>}
        </div>
      </section>
      <section className="panel" aria-labelledby="nazorg-form-title">
        <div>
          <p className="eyebrow">ACTIE</p>
          <h2 id="nazorg-form-title">{editing ? 'Punt aanpassen' : 'Nieuw aandachtspunt'}</h2>
          <p>Gebruik neutrale labels, geen namen, adressen of gevoelige documenten. Houd originele foto’s of juridische correspondentie zelf veilig buiten de app.</p>
        </div>
        <form id="nazorg-form" onSubmit={save}>
          <label htmlFor="nazorg-title">Wat moet gebeuren?</label>
          <input id="nazorg-title" required maxLength={100} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="Bijvoorbeeld: tocht bij raam" />
          <label htmlFor="nazorg-room">Ruimte / categorie</label>
          <input id="nazorg-room" required maxLength={40} value={draft.room} onChange={e => setDraft({ ...draft, room: e.target.value })} placeholder="Bijvoorbeeld: woonkamer" />
          <div className="aftercare-grid">
            <div><label htmlFor="nazorg-priority">Eigen prioriteit</label>
              <select id="nazorg-priority" value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as Priority })}>
                <option value="laag">Laag</option><option value="normaal">Normaal</option><option value="dringend">Dringend</option>
              </select></div>
            <div><label htmlFor="nazorg-due">Eigen streefdatum (optioneel)</label>
              <input id="nazorg-due" type="date" min="2020-01-01" max="2099-12-31" value={draft.due} onChange={e => setDraft({ ...draft, due: e.target.value })} /></div>
          </div>
          <label htmlFor="nazorg-note">Privénotitie (optioneel, max. 500 tekens)</label>
          <textarea id="nazorg-note" maxLength={500} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} />
          <div className="aftercare-actions">
            <button type="submit">{editing ? 'Bewaar aanpassing' : 'Voeg aandachtspunt toe'}</button>
            {editing && <button className="secondary" type="button" onClick={() => { setEditing(null); setDraft(EMPTY); }}>Annuleer bewerken</button>}
          </div>
        </form>
      </section>
      <section className="panel" aria-labelledby="nazorg-list-title">
        <div>
          <p className="eyebrow">OPVOLGEN</p>
          <h2 id="nazorg-list-title">Je punten</h2>
          <label htmlFor="nazorg-filter">Toon</label>
          <select id="nazorg-filter" value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
            <option value="actief">Nog niet afgerond</option><option value="alles">Alles</option><option value="afgerond">Afgerond</option>
          </select>
        </div>
        <div>
          {shown.length === 0 ? <p>Geen aandachtspunten binnen deze weergave.</p> :
            <ul className="aftercare-list">{shown.map(item =>
              <li className="aftercare-item" key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.room} · <b>{item.priority}</b> · {item.status}</p>
                <p>Eigen streefdatum: {item.due || 'niet ingesteld'}{item.status !== 'afgerond' && item.due && item.due < currentDay ? ' · VERSTREKEN' : ''}</p>
                {item.note && <p className="aftercare-note">{item.note}</p>}
                <div className="aftercare-actions">
                  {item.status !== 'gemeld' && item.status !== 'afgerond' && <button onClick={() => setStatus(item.id, 'gemeld')}>Ik heb dit zelf gemeld</button>}
                  {item.status !== 'afgerond' && <button onClick={() => setStatus(item.id, 'afgerond')}>Markeer afgerond</button>}
                  {item.status !== 'open' && <button className="secondary" onClick={() => setStatus(item.id, 'open')}>Heropen</button>}
                  <button className="secondary" onClick={() => startEdit(item)}>Bewerk</button>
                  <button className="secondary" onClick={() => setPendingDelete(item.id)}>Verwijder…</button>
                </div>
                {pendingDelete === item.id && <div className="aftercare-confirm" role="group" aria-label="Verwijderen bevestigen">
                  <p>Dit aandachtspunt uit het tabblad verwijderen?</p>
                  <div className="aftercare-actions">
                    <button onClick={() => { setItems(prev => prev.filter(entry => entry.id !== item.id)); setPendingDelete(null); if (editing === item.id) { setEditing(null); setDraft(EMPTY); } }}>Ja, verwijder</button>
                    <button className="secondary" onClick={() => setPendingDelete(null)}>Behoud</button>
                  </div>
                </div>}
              </li>)}</ul>}
        </div>
      </section>

      <section className="panel" aria-labelledby="nazorg-notice-title">
        <div>
          <p className="eyebrow">BERICHT VOORBEREIDEN</p>
          <h2 id="nazorg-notice-title">Concept voor de verhuurder</h2>
          <p>Stel zelf een conceptbericht samen uit 1–12 niet-afgeronde aandachtspunten. Je selecteert precies welke punten meegaan. Standaard blijven je privénotities buiten het concept.</p>
          <p>Dit is geen officiële gebrekenmelding of juridisch termijnadvies. Woonpoints verstuurt niets en bewaart geen berichten op een server.</p>
        </div>
        <div>
          <fieldset className="aftercare-notice-picks">
            <legend>Kies de aandachtspunten ({noticeItems.length} van maximaal 12)</legend>
            {active.length === 0 ? <p>Voeg eerst een open nazorgpunt toe.</p> :
              <ul>{active.map(item => <li key={item.id}>
                <label className="aftercare-check">
                  <input type="checkbox" checked={chosenIssueIds.includes(item.id)}
                    disabled={!chosenIssueIds.includes(item.id) && noticeItems.length >= 12}
                    onChange={() => toggleNoticeItem(item.id)} />
                  <span>{item.room}: {item.title} · {item.status}</span>
                </label>
              </li>)}</ul>}
          </fieldset>
          <label htmlFor="nazorg-notice-subject">Onderwerp (max. 100 tekens)</label>
          <input id="nazorg-notice-subject" maxLength={100} value={noticeSubject} onChange={e => {
            setNoticeSubject(e.target.value); setNoticeApproved(false);
          }} />
          <label className="aftercare-check" htmlFor="nazorg-notice-details">
            <input id="nazorg-notice-details" type="checkbox" checked={includeDetails}
              onChange={e => { setIncludeDetails(e.target.checked); setNoticeApproved(false); }} />
            <span>Neem ook mijn privétoelichtingen van geselecteerde punten op</span>
          </label>
          <p>Als je dit aanzet, lees de toelichtingen dan extra zorgvuldig op gevoelige gegevens na.</p>
          <button disabled={!noticeItems.length} onClick={createNoticeDraft}>Maak lokaal concept</button>
          {noticeDraft && <div className="aftercare-confirm" aria-labelledby="nazorg-review-title">
            <h3 id="nazorg-review-title">Controleer het concept vóór gebruik</h3>
            {!noticeCurrent && <p className="aftercare-warning" role="status">De selectie of brongegevens zijn gewijzigd. Maak een nieuw concept om te voorkomen dat je een verouderd bericht gebruikt.</p>}
            <label htmlFor="nazorg-notice-text">Bewerk het bericht hier (max. 10.000 tekens)</label>
            <textarea id="nazorg-notice-text" value={noticeDraft} maxLength={10000} rows={15}
              onChange={e => { setNoticeDraft(e.target.value); setNoticeApproved(false); }} />
            <label className="aftercare-check" htmlFor="nazorg-notice-confirm">
              <input id="nazorg-notice-confirm" type="checkbox" checked={noticeApproved}
                disabled={!noticeCurrent}
                onChange={e => setNoticeApproved(e.target.checked)} />
              <span>Ik heb de inhoud nagekeken, inclusief persoonsgegevens, ontvanger en niet-officiële termijnen.</span>
            </label>
            <div className="aftercare-actions">
              <button disabled={!noticeCurrent || !noticeApproved} onClick={copyNoticeDraft}>Kopieer bericht bewust</button>
              <button className="secondary" disabled={!noticeCurrent || !noticeApproved} onClick={downloadNoticeDraft}>Download concept-TXT</button>
              <button className="secondary" onClick={() => { setNoticeDraft(''); setNoticeApproved(false); setNoticeSource(''); }}>Sluit concept</button>
            </div>
            <p>Niet automatisch verzonden. Een eerder gekopieerd of opgeslagen bestand blijft buiten de app bestaan.</p>
          </div>}
        </div>
      </section>
      <section className="panel" aria-labelledby="nazorg-backup-title">
        <div>
          <p className="eyebrow">ZELF BEWAREN</p>
          <h2 id="nazorg-backup-title">Back-up en overdracht</h2>
          <p>Bewaar optioneel een volledig JSON-bestand, een CSV-overzicht of een leesbaar TXT-dossier. Export kan via je gekozen bestandsprovider buiten Woonpoints synchroniseren.</p>
          <p>Import vervangt uitsluitend na een aparte bevestiging je huidige tabblad. Woonpoints bewaart geen automatische kopieën.</p>
        </div>
        <div>
          <div className="aftercare-actions">
            <button disabled={!items.length} onClick={exportJson}>Download JSON-back-up</button>
            <button className="secondary" disabled={!items.length} onClick={exportCsv}>Download CSV</button>
            <button className="secondary" disabled={!items.length} onClick={exportText}>Download TXT-dossier</button>
          </div>
          <label htmlFor="nazorg-import">Open eigen nazorg-JSON (max. 16 KiB)</label>
          <input id="nazorg-import" type="file" ref={uploadRef} accept=".json,application/json" onChange={importFile} />
          {incoming !== null && <div className="aftercare-confirm" role="group" aria-label="Import bevestigen">
            <p>{incoming.length} geldige punten gevonden. Je huidige {items.length} punten worden pas na bevestiging vervangen.</p>
            <div className="aftercare-actions">
              <button onClick={() => { setItems(incoming); setIncoming(null); setDraft(EMPTY); setEditing(null); setClearPending(false); setPendingDelete(null); setMessage('Import bevestigd. Alleen dit tabblad is gewijzigd.'); }}>Vervang huidige punten</button>
              <button className="secondary" onClick={() => { setIncoming(null); setMessage('Import geannuleerd; bestaande punten behouden.'); }}>Annuleer import</button>
            </div>
          </div>}
          <div className="aftercare-actions"><button className="secondary" disabled={!items.length} onClick={() => setClearPending(true)}>Wis alle tabbladpunten…</button></div>
          {clearPending && <div className="aftercare-confirm">
            <p>Alle huidige aandachtspunten definitief uit dit tabblad verwijderen? Een eerder gedownloade back-up blijft bestaan.</p>
            <div className="aftercare-actions">
              <button onClick={() => { setItems([]); setDraft(EMPTY); setEditing(null); setClearPending(false); setIncoming(null); setMessage('Tabbladpunten gewist.'); }}>Ja, wis alles</button>
              <button className="secondary" onClick={() => setClearPending(false)}>Behoud punten</button>
            </div>
          </div>}
          <p role="status" aria-live="polite">{message}</p>
        </div>
      </section>
      <p>Dit is een persoonlijke checklist, geen verstuurde melding of rechtsadvies.</p>
    </div>
  );
}
