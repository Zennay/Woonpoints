'use client';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { PrivateMovingDayTimeline } from './manual-month-progress';
import { PrivateMovingPackingInventory } from './manual-month-progress';
import { PrivateReactionWorkflow, PrivateReactionPacing, PrivateCommuteComparison, PrivateMovingHelperRoster, PrivateAddressChangePlanner, type PrivateHomeOverview } from './position-stats';
import PositionStats from './position-stats';
import { PrivateMovingVolume, PrivateMovingHandover, PrivateMoveDocumentReadiness, PrivateMovingExpenseLedger, PrivateMovingQuoteComparison, PrivateMovingCostSplit, PrivateMovingWorkspace } from './manual-month-progress';
import { ManualHousingDecisionWorkspace, PrivatePhotoComparison } from './position-stats';

type HomeNavCategory='essentieel'|'reacties'|'woning'|'verhuizen'|'inzichten';
const homepageDestinations:{id:string;title:string;category:HomeNavCategory}[]=[
  {id:'projectstatus-heading',title:'Status',category:'essentieel'},
  {id:'manual-progress-heading',title:'Maanddoel',category:'essentieel'},
  {id:'private-month-pulse-heading',title:'Maandoverzicht en rapport',category:'essentieel'},
  {id:'private-reaction-pacing-heading',title:'Maandplan',category:'reacties'},
  {id:'private-points-heading',title:'Zoekpunten',category:'reacties'},
  {id:'reaction-journal-title',title:'Reactiedagboek',category:'reacties'},
  {id:'housing-shortlist-heading',title:'Woningen vergelijken',category:'woning'},
  {id:'private-budget-title',title:'Woonkosten',category:'woning'},
  {id:'private-commute-heading',title:'Woon-werk',category:'woning'},
  {id:'private-longterm-title',title:'Meerjarenkosten',category:'woning'},
  {id:'private-viewing-title',title:'Bezichtiging',category:'woning'},
  {id:'private-photo-comparison-heading',title:'Fotovergelijking',category:'woning'},
  {id:'private-plan-title',title:'Planner',category:'essentieel'},
  {id:'private-journey-heading',title:'Mijn woonreis',category:'essentieel'},
  {id:'private-moving-heading',title:'Verhuizen',category:'verhuizen'},
  {id:'private-moving-volume-heading',title:'Verhuisvolume',category:'verhuizen'},
  {id:'private-moving-workspace-heading',title:'Verhuiswerkmap',category:'verhuizen'},
  {id:'private-moving-day-heading',title:'Verhuisdag',category:'verhuizen'},
  {id:'private-packing-heading',title:'Paklijst',category:'verhuizen'},
  {id:'private-moving-plan-b-heading',title:'Verhuisdag plan B',category:'verhuizen'},
  {id:'private-moving-readiness-heading',title:'Verhuisregie',category:'essentieel'},
  {id:'private-moving-helpers-heading',title:'Verhuishulp',category:'verhuizen'},
  {id:'private-address-change-heading',title:'Adreswijzigingen',category:'verhuizen'},
  {id:'private-handover-heading',title:'Sleutelrapport',category:'verhuizen'},
  {id:'private-meter-handover-heading',title:'Meterstanden',category:'verhuizen'},
  {id:'private-utility-transfer-heading',title:'Nutsvoorzieningen overzetten',category:'verhuizen'},
  {id:'private-utility-contacts-heading',title:'Mijn leverancierscontacten',category:'verhuizen'},
  {id:'private-document-readiness-heading',title:'Documenten',category:'verhuizen'},
  {id:'private-moving-expenses-heading',title:'Werkelijke kosten',category:'verhuizen'},
  {id:'private-moving-quotes-heading',title:'Verhuisoffertes',category:'verhuizen'},
  {id:'private-cost-split-heading',title:'Kosten delen',category:'verhuizen'},
  {id:'private-deposit-heading',title:'Mijn borgboek',category:'verhuizen'},
  {id:'position-stats-heading',title:'Posities',category:'inzichten'},
  {id:'monthly-positions-heading',title:'Maandtrend',category:'inzichten'},
  {id:'nazorg-weekplan-title',title:'Mijn nazorgweekplan',category:'verhuizen'},
  {id:'nazorg-contactlijn',title:'Contacttijdlijn',category:'verhuizen'},
  {id:'nazorg',title:'Nazorg en gebreken',category:'verhuizen'}
];
const homeCategoryOptions=[
  {id:'snel',label:'Snelstart'},{id:'favorieten',label:'★ Vastgezet'},
  {id:'recent',label:'↗ Recent'},
  {id:'alles',label:'Alles'},
  {id:'reacties',label:'Reacties'},{id:'woning',label:'Woningen'},
  {id:'verhuizen',label:'Verhuizen'},{id:'inzichten',label:'Inzichten'}
] as const;

const NAV_PINS_STORAGE_KEY='woonpoints:quicknav-pins:v1';
const MAX_NAV_PINS=8;
const MAX_RECENT_NAV=6;
const homeNavAliases:Record<string,string[]>={
  'manual-progress-heading':['vier reacties','maandteller'],
  'private-month-pulse-heading':['rapportage','maandverslag'],
  'private-points-heading':['zoekpunten','puntenstand'],
  'housing-shortlist-heading':['woning kiezen','selectie'],
  'private-budget-title':['woonlasten','huur vergelijken'],
  'private-moving-workspace-heading':['backup','herstellen','verhuisdossier'],
  'private-moving-day-heading':['dagplanning','tijdlijn','verhuisdag'],
  'private-packing-heading':['dozen','inpakken','uitpakken','inventaris'],
  'private-moving-plan-b-heading':['noodplan','verhuisdag noodplan','backup vervoer','plan b'],
  'private-moving-readiness-heading':['mijn verhuisregie','verhuisoverzicht','prioriteiten verhuizing','wat moet ik doen'],
  'private-moving-helpers-heading':['helpers','vrijwilligers'],
  'private-address-change-heading':['adres doorgeven','post'],
  'private-handover-heading':['sleuteloverdracht','inspectie'],
  'private-meter-handover-heading':['gas water licht','meteropname'],
  'private-utility-transfer-heading':['energie','leverancier wisselen','internet'],
  'private-utility-contacts-heading':['contact leverancier','bellen'],
  'private-document-readiness-heading':['papieren','documentcheck'],
  'private-moving-expenses-heading':['uitgaven','verhuisbudget','bonnetjes'],
  'private-moving-quotes-heading':['offertes','aannemers'],
  'private-cost-split-heading':['kosten verdelen','afrekenen'],
  'nazorg-contactlijn':['contactgeschiedenis','gesprekken'],
  'nazorg':['gebreken','reparaties','klachten'],
};
function normalizeNavQuery(value:string):string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('nl-NL').trim();
}
/** Only allow known, bounded anchor IDs; never save typed search queries or personal text. */
function decodeNavPins(raw:string|null):string[]|null{
  if(raw===null)return [];
  if(raw.length>1200)return null;
  try{
    const parsed:unknown=JSON.parse(raw);
    if(!Array.isArray(parsed)||parsed.length>MAX_NAV_PINS||
      parsed.some(id=>typeof id!=='string'||
        !homepageDestinations.some(destination=>destination.id===id))||
      new Set(parsed).size!==parsed.length)return null;
    return parsed as string[];
  }catch{return null;}
}

/** Portable format is strictly a fixed schema with known screen anchors only. */
function readNavPinsBackup(raw:string):string[]|null{
  if(raw.length>1400)return null;
  try{
    const data:unknown=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const record=data as Record<string,unknown>;
    if(Object.keys(record).sort().join(',')!=='format,pins,version'||
      record.format!=='woonpoints-favorites'||record.version!==1)return null;
    if(!Array.isArray(record.pins))return null;
    return decodeNavPins(JSON.stringify(record.pins));
  }catch{return null;}
}

// These unknown-by-default values are an explicit safety contract for users
// who have not entered a private observation or linked a real account.
const initialCards = [
  ['Maanddoel', 'Onbekend', 'Doel: 4 geldige reacties; geen geverifieerde accountgegevens'],
  ['Actieve reacties', 'Onbekend', 'Nog geen account gekoppeld; actuele gegevens ontbreken'],
  ['Zoekpunten', '—', 'Nog geen puntensnapshot beschikbaar'],
  ['Worker', 'Dry-run', 'Live reageren is bewust geblokkeerd']
];

const PrivateDepositLedger = (() => {
type DepositEvent = {
  id: string;
  kind: 'terugontvangen' | 'ingehouden' | 'gepland';
  date: string;
  label: string;
  amountCents: number;
};
type DepositBackup = {
  kind: 'woonpoints-private-borgboek';
  schema: 2;
  depositCents: number;
  entries: DepositEvent[];
};
const KIND = 'woonpoints-private-borgboek' as const;
const MAX_FILE = 12 * 1024;
const MAX_ENTRIES = 24;
const MAX_CENTS = 5_000_000;
const euro = (cents: number) => new Intl.NumberFormat('nl-NL', {
  style: 'currency', currency: 'EUR'
}).format(cents / 100);

function parseEuro(value: string): number | null {
  const trimmed = value.trim();
  if (!/^(?:0|[1-9]\d{0,4})(?:[,.]\d{1,2})?$/.test(trimmed)) return null;
  const parts = trimmed.replace(',', '.').split('.');
  const cents = Number(parts[0]) * 100 + Number((parts[1] || '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
}
function validCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS;
}
function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function exactKeys(value: object, expected: string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every(key => expected.includes(key));
}
function safeLabel(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 80 &&
    value === value.trim() && !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
}
function validateBackup(value: unknown): DepositBackup {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      !exactKeys(value, ['kind', 'schema', 'depositCents', 'entries'])) throw Error('schema');
  const backup = value as Record<string, unknown>;
  if (backup.kind !== KIND || (backup.schema !== 1 && backup.schema !== 2) ||
      !validCents(backup.depositCents) || !Array.isArray(backup.entries) ||
      backup.entries.length > MAX_ENTRIES) throw Error('data');
  const seen = new Set<string>();
  const entries: DepositEvent[] = [];
  for (const unknownEntry of backup.entries) {
    if (!unknownEntry || typeof unknownEntry !== 'object' || Array.isArray(unknownEntry) ||
        !exactKeys(unknownEntry, ['id', 'kind', 'date', 'label', 'amountCents'])) throw Error('entry');
    const entry = unknownEntry as Record<string, unknown>;
    const validKind = entry.kind === 'terugontvangen' || entry.kind === 'ingehouden' ||
      (backup.schema === 2 && entry.kind === 'gepland');
    if (typeof entry.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(entry.id) ||
        seen.has(entry.id) || !validKind || !isValidDate(entry.date) ||
        !safeLabel(entry.label) || !validCents(entry.amountCents) ||
        entry.amountCents === 0) throw Error('entry');
    seen.add(entry.id);
    entries.push({
      id: entry.id, kind: entry.kind as DepositEvent['kind'],
      date: entry.date, label: entry.label, amountCents: entry.amountCents
    });
  }
  // Preserve all valid legacy records, but their future-dated "already received"
  // items are never counted in the actual balance.
  return { kind: KIND, schema: 2, depositCents: backup.depositCents, entries };
}
function depositToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
}
function depositCalendar(entries: DepositEvent[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const escape = (text: string) => text.replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
  const fold = (line: string): string => {
    let length = 0;
    let result = '';
    const encoder = new TextEncoder();
    for (const char of line) {
      const lengthUtf8 = encoder.encode(char).length;
      if (length + lengthUtf8 > 70) { result += '\r\n '; length = 1; }
      result += char;
      length += lengthUtf8;
    }
    return result;
  };
  const nextDay = (date: string): string => {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  };
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH', 'PRODID:-//Woonpoints//Own Deposit Reminders//NL'];
  for (const item of entries.filter(e => e.kind === 'gepland').sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) {
    lines.push('BEGIN:VEVENT',
      'UID:deposit-' + item.id + '@woonpoints.local',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + item.date.replace(/-/g, ''),
      'DTEND;VALUE=DATE:' + nextDay(item.date).replace(/-/g, ''),
      'SUMMARY:' + escape('Eigen borgterugbetaling controleren'),
      'DESCRIPTION:' + escape('Eigen verwachting: ' + euro(item.amountCents) +
        '. Geen geverifieerde toezegging, betaling of afspraak. Controleer de werkelijke status zelf.'),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY',
      'DESCRIPTION:' + escape('Controleer eigen verwachte borgterugbetaling'),
      'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

function saveFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PrivateDepositLedger() {
  const [deposit, setDeposit] = useState('');
  const [entries, setEntries] = useState<DepositEvent[]>([]);
  const [eventKind, setEventKind] = useState<DepositEvent['kind']>('terugontvangen');
  const [eventDate, setEventDate] = useState('');
  const [eventLabel, setEventLabel] = useState('');
  const [eventAmount, setEventAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{data: DepositBackup; before: string} | null>(null);
  const [txtPreview, setTxtPreview] = useState<{source: string; text: string} | null>(null);
  const [txtConfirmed, setTxtConfirmed] = useState(false);
  const [calendarPreview, setCalendarPreview] = useState<{source: string; contents: string; count: number} | null>(null);
  const [calendarConfirmed, setCalendarConfirmed] = useState(false);
  const [oneStepUndo, setOneStepUndo] = useState<{
    previousDeposit: string; previousEntries: DepositEvent[];
    expectedState: string; action: string;
  } | null>(null);
  const depositCents = parseEuro(deposit);
  const current: DepositBackup | null = depositCents === null ? null : {
    kind: KIND, schema: 2, depositCents, entries
  };
  const summary = useMemo(() => {
    const today = depositToday();
    const actual = entries.filter(item => item.date <= today);
    const refunded = actual.filter(item => item.kind === 'terugontvangen')
      .reduce((sum, item) => sum + item.amountCents, 0);
    const deducted = actual.filter(item => item.kind === 'ingehouden')
      .reduce((sum, item) => sum + item.amountCents, 0);
    const planned = entries.filter(item => item.kind === 'gepland')
      .reduce((sum, item) => sum + item.amountCents, 0);
    const plannedOverdue = entries.filter(item => item.kind === 'gepland' && item.date < today).length;
    const legacyFuture = entries.filter(item => item.kind !== 'gepland' && item.date > today).length;
    const rest = depositCents === null ? null : depositCents - refunded - deducted;
    return { refunded, deducted, planned, plannedOverdue, legacyFuture, rest };
  }, [entries, depositCents]);

  // Only the exact state created by the most recent destructive step can be undone.
  function ownState(value = deposit, events = entries) {
    return JSON.stringify({ deposit: value, entries: events });
  }
  function saveUndo(action: string, nextDeposit: string, nextEntries: DepositEvent[]) {
    setOneStepUndo({
      previousDeposit: deposit, previousEntries: entries,
      expectedState: ownState(nextDeposit, nextEntries), action
    });
  }
  function restoreOneStep() {
    if (!oneStepUndo || oneStepUndo.expectedState !== ownState()) {
      setOneStepUndo(null);
      setNotice('De huidige gegevens zijn veranderd. Terugzetten is uitgeschakeld om nieuwe invoer te behouden.');
      return;
    }
    if (!window.confirm('De vorige eigen wijziging terugzetten? Dit herstelt uitsluitend de tijdelijke tabbladgegevens.')) return;
    setDeposit(oneStepUndo.previousDeposit);
    setEntries(oneStepUndo.previousEntries);
    setOneStepUndo(null);
    setPending(null);
    setTxtConfirmed(false);
    setCalendarConfirmed(false);
    setNotice('Vorige eigen tabbladstatus eenmalig hersteld. Maak nieuwe exports opnieuw.');
  }
  function changeDeposit(value: string) {
    setDeposit(value); setPending(null); setOneStepUndo(null); setNotice('');
  }
  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = parseEuro(eventAmount);
    if (entries.length >= MAX_ENTRIES || !safeLabel(eventLabel.trim()) ||
        !isValidDate(eventDate) || (eventKind !== 'gepland' && eventDate > depositToday()) ||
        cents === null || cents === 0 ||
        depositCents === null) {
      setNotice('Controleer borg, datum, omschrijving en bedrag. Een al ontvangen/ingehouden bedrag kan niet in de toekomst gedateerd zijn (max. 24 regels).');
      return;
    }
    setEntries(previous => [...previous, {
      id: crypto.randomUUID(), kind: eventKind, date: eventDate,
      label: eventLabel.trim(), amountCents: cents
    }]);
    setOneStepUndo(null);
    setEventLabel(''); setEventAmount(''); setNotice('Eigen gebeurtenis toegevoegd.');
    setPending(null);
  }
  function confirmPlannedReceipt(id: string) {
    const planned = entries.find(item => item.id === id && item.kind === 'gepland');
    if (!planned || !window.confirm('Heb je dit bedrag daadwerkelijk ontvangen? De verwachte datum wordt vervangen door vandaag. Controleer eerst je eigen bankoverzicht.')) return;
    const nextEntries = entries.map(item =>
      item.id === id && item.kind === 'gepland' ?
        { ...item, kind: 'terugontvangen' as const, date: depositToday() } : item
    );
    saveUndo('ontvangstbevestiging', deposit, nextEntries);
    setEntries(nextEntries);
    setPending(null);
    setTxtConfirmed(false);
    setNotice('Eigen verwachting handmatig als ontvangen genoteerd. Dit is geen bankverificatie.');
  }
  function removeEvent(id: string) {
    const entry = entries.find(item => item.id === id);
    if (!entry || !window.confirm('Deze eigen boekingsregel verwijderen? Je kunt direct daarna eenmaal terugzetten.')) return;
    const nextEntries = entries.filter(item => item.id !== id);
    saveUndo('verwijdering', deposit, nextEntries);
    setEntries(nextEntries);
    setPending(null); setNotice('Eigen regel verwijderd. Eenmalig herstel is beschikbaar zolang niets verandert.');
  }
  function downloadJson() {
    if (!current) { setNotice('Vul eerst een geldig oorspronkelijk borgbedrag in.'); return; }
    const contents = JSON.stringify(current, null, 2);
    if (new TextEncoder().encode(contents).length > MAX_FILE) {
      setNotice('Het bestand is te groot voor veilig herstel (12 KiB).'); return;
    }
    saveFile('woonpoints-prive-borgboek.json', contents, 'application/json;charset=utf-8');
    setNotice('Privé-back-up gedownload. Bewaar deze zelf op een veilige plek.');
  }
  function previewTxt() {
    if (!current) { setNotice('Vul eerst een geldig oorspronkelijk borgbedrag in.'); return; }
    const lines = [
      'MIJN EIGEN BORGOVERZICHT — GEEN OFFICIEEL BEWIJS',
      'Oorspronkelijke borg (zelf ingevuld): ' + euro(current.depositCents),
      'Zelf genoteerd terugontvangen: ' + euro(summary.refunded),
      'Zelf genoteerde inhoudingen: ' + euro(summary.deducted),
      'Geplande maar niet bevestigde terugbetalingen (niet meetellen): ' + euro(summary.planned),
      'Nog open geplande datums in het verleden: ' + summary.plannedOverdue,
      'Oude toekomstige ontvangst-/inhoudingsdatums buiten saldo: ' + summary.legacyFuture,
      'Nog niet verklaard / saldo: ' + euro(summary.rest || 0),
      'Dit overzicht zegt niets over de rechtsgeldigheid van inhoudingen of terugbetaling.',
      '', ...entries.map(e => e.date + ' | ' + e.kind + ' | ' + euro(e.amountCents) + ' | ' + e.label)
    ];
    setTxtPreview({ source: JSON.stringify(current), text: lines.join('\n') });
    setTxtConfirmed(false);
    setNotice('Bekijk de exacte TXT-inhoud en geef afzonderlijk toestemming om die lokaal op te slaan.');
  }
  function downloadTxt() {
    if (!current || !txtPreview || txtPreview.source !== JSON.stringify(current) || !txtConfirmed) {
      setNotice('De voorvertoning is verlopen of niet goedgekeurd. Bekijk eerst de actuele inhoud.');
      return;
    }
    saveFile('woonpoints-prive-borgoverzicht.txt', txtPreview.text, 'text/plain;charset=utf-8');
    setTxtConfirmed(false);
    setNotice('Zelf beoordeelde TXT is gedownload; controleer bestemming en ontvanger.');
  }
  function previewCalendar() {
    if (!current) { setNotice('Vul eerst een geldig oorspronkelijk borgbedrag in.'); return; }
    const count = entries.filter(item => item.kind === 'gepland').length;
    if (!count) { setNotice('Voeg eerst een nog niet ontvangen geplande terugbetaling toe.'); return; }
    setCalendarPreview({ source: JSON.stringify(current),
      contents: depositCalendar(entries), count });
    setCalendarConfirmed(false);
    setNotice('Controleer de exacte eigen agendagegevens. Niets is toegevoegd aan een kalender.');
  }
  function downloadCalendar() {
    if (!current || !calendarPreview || !calendarConfirmed ||
        calendarPreview.source !== JSON.stringify(current)) {
      setNotice('De agendavoorvertoning is verlopen of niet goedgekeurd.');
      return;
    }
    saveFile('woonpoints-eigen-borgherinneringen.ics', calendarPreview.contents,
      'text/calendar;charset=utf-8');
    setCalendarConfirmed(false);
    setNotice('Agenda-importbestand gedownload. Je kalenderapp bepaalt of en hoe dit wordt geïmporteerd.');
  }
  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPending(null);
    if (!file) return;
    if (file.size > MAX_FILE) {
      setNotice('Back-up geweigerd: maximaal 12 KiB. Huidige gegevens zijn behouden.'); return;
    }
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (new TextEncoder().encode(text).length > MAX_FILE) throw Error('size');
      const parsed = validateBackup(JSON.parse(text));
      // A fresh tab starts with no entered deposit: restoring a saved backup
      // must work without inventing a new valid deposit first.
      setPending({ data: parsed, before: JSON.stringify({ deposit, entries }) });
      setNotice('Controleer eerst de inhoudsverschillen hieronder. Er is nog niets vervangen.');
    } catch {
      setNotice('Geen geldig Woonpoints-borgboek. De huidige gegevens zijn niet veranderd.');
    }
  }
  function restoreBackup() {
    if (!pending || pending.before !== JSON.stringify({ deposit, entries })) {
      setPending(null);
      setNotice('Eigen gegevens zijn gewijzigd. Kies de back-up opnieuw om die te beoordelen.');
      return;
    }
    const nextDeposit = (pending.data.depositCents / 100).toFixed(2).replace('.', ',');
    saveUndo('complete privé-import', nextDeposit, pending.data.entries);
    setDeposit(nextDeposit);
    setEntries(pending.data.entries);
    setPending(null);
    setNotice('Back-up hersteld. Vorige tabbladstatus is eenmaal herstelbaar zolang je niets wijzigt.');
  }
  return (
    <section className="panel" aria-labelledby="private-deposit-heading">
      <div>
        <p className="eyebrow">NA DE VERHUIZING · ALLEEN IN DIT TABBLAD</p>
        <h2 id="private-deposit-heading">Mijn privé-borgboek</h2>
        <p>Leg je oorspronkelijke borg, daadwerkelijk ontvangen terugbetalingen, geplande bedragen en eigen notities over inhoudingen vast.
          De berekening is alleen je persoonlijke administratie; dit is geen betalingsbewijs, juridisch oordeel
          of verificatie bij een verhuurder.</p>
      </div>
      <div>
        <label htmlFor="deposit-original">Oorspronkelijke borg in euro&apos;s</label>
        <input id="deposit-original" inputMode="decimal" type="text" maxLength={9}
          placeholder="Bijv. 850,00" value={deposit}
          onChange={e => changeDeposit(e.target.value)} />
        {deposit && depositCents === null && <p role="alert">Gebruik een bedrag van € 0 tot € 50.000 met maximaal twee decimalen.</p>}
        <dl>
          <div><dt>Zelf terugontvangen</dt><dd>{euro(summary.refunded)}</dd></div>
          <div><dt>Zelf genoteerd ingehouden</dt><dd>{euro(summary.deducted)}</dd></div>
          <div><dt>Gepland maar nog niet bevestigd (telt niet mee)</dt><dd>{euro(summary.planned)}</dd></div>
          <div><dt>Nog niet verklaard (geen opeisbaar saldo)</dt>
            <dd>{summary.rest === null ? 'Vul borg in' : euro(summary.rest)}</dd></div>
        </dl>
        {summary.plannedOverdue > 0 && <p role="status">{summary.plannedOverdue} eigen geplande terugbetaling(en) met een verstreken datum. Controleer de werkelijke ontvangst zelf.</p>}
        {summary.legacyFuture > 0 && <p role="alert">{summary.legacyFuture} toekomstige boeking(en) uit oudere gegevens tellen nog niet mee als werkelijk ontvangen/ingehouden. Corrigeer de eigen administratie indien nodig.</p>}
        {summary.rest !== null && summary.rest < 0 &&
          <p role="alert">Je ingevoerde terugbetalingen en inhoudingen zijn samen hoger dan de oorspronkelijke borg. Controleer de eigen cijfers.</p>}
        <form onSubmit={addEvent}>
          <h3>Nieuwe eigen boekingsnotitie</h3>
          <label htmlFor="deposit-kind">Wat heb je zelf genoteerd?</label>
          <select id="deposit-kind" value={eventKind}
            onChange={e => setEventKind(e.target.value as DepositEvent['kind'])}>
            <option value="terugontvangen">Bedrag daadwerkelijk ontvangen (eigen notitie)</option>
            <option value="ingehouden">Inhouding zelf genoteerd (niet juridisch beoordeeld)</option>
            <option value="gepland">Verwachte terugbetaling (nog NIET ontvangen)</option>
          </select>
          <label htmlFor="deposit-date">{eventKind === 'gepland' ? 'Zelf verwachte ontvangstdatum' : 'Datum van eigen feitelijke notitie'}</label>
          <input id="deposit-date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
          <label htmlFor="deposit-label">Korte omschrijving (geen persoonsgegevens)</label>
          <input id="deposit-label" value={eventLabel} maxLength={80}
            onChange={e => setEventLabel(e.target.value)} required placeholder="Bijv. terugbetaling deel 1" />
          <label htmlFor="deposit-amount">Bedrag in euro&apos;s</label>
          <input id="deposit-amount" inputMode="decimal" value={eventAmount}
            onChange={e => setEventAmount(e.target.value)} required placeholder="Bijv. 150,00" />
          <button type="submit" disabled={entries.length >= MAX_ENTRIES || depositCents === null}>Voeg eigen notitie toe</button>
        </form>
        <h3>Mijn notities ({entries.length}/{MAX_ENTRIES})</h3>
        {entries.length === 0 ? <p>Nog geen terugbetalingen of inhoudingen ingevuld.</p> :
          <ul>{entries.map(entry => <li key={entry.id}>
            <strong>{entry.date} · {entry.kind} · {euro(entry.amountCents)}</strong>
            {' — '}{entry.label}{' '}
            {entry.kind === 'gepland' && <button type="button" onClick={() => confirmPlannedReceipt(entry.id)}>
              Markeer na eigen controle als ontvangen
            </button>}{' '}
            <button type="button" onClick={() => removeEvent(entry.id)}
              aria-label={'Verwijder eigen notitie ' + entry.date + ' ' + entry.label}>Verwijder</button>
          </li>)}</ul>}
        <p>Geen automatische opslag: sluit je dit tabblad, dan verdwijnen deze eigen gegevens.
          JSON bevat ook de omschrijvingen; deel het bestand niet zonder controle.</p>
        <button type="button" onClick={downloadJson} disabled={!current}>Download volledige privé-JSON</button>{' '}
        <button type="button" onClick={previewTxt} disabled={!current}>Bekijk exact TXT-overzicht</button>
        {txtPreview && <div role="group" aria-label="Privé-overzicht beoordelen">
          <label htmlFor="deposit-txt-preview">Controleer de inhoud vóór delen (ook de zelf ingevoerde omschrijvingen)</label>
          <textarea id="deposit-txt-preview" readOnly rows={10} value={txtPreview.text} />
          {current && txtPreview.source === JSON.stringify(current) ?
            <>
              <label htmlFor="deposit-txt-approved">
                <input id="deposit-txt-approved" type="checkbox" checked={txtConfirmed}
                  onChange={e => setTxtConfirmed(e.target.checked)} />
                Ik heb precies dit privé-overzicht gecontroleerd en kies bewust voor downloaden.
              </label>
              <button type="button" onClick={downloadTxt} disabled={!txtConfirmed}>Download beoordeeld TXT-bestand</button>
            </> :
            <p role="alert">Gegevens zijn gewijzigd sinds de voorvertoning. Maak een nieuwe voorvertoning.</p>}
        </div>}
        <div>
          <h3>Eigen verwachte borgmomenten in mijn agenda</h3>
          <p>Bewaar alleen je <strong>zelf geplande</strong> data als een apart ICS-bestand.
            Elk agenda-item is een niet-geverifieerde persoonlijke herinnering, geen bewijs van
            betaling of afspraak met de verhuurder. Het bestand bevat datum en verwacht bedrag
            maar geen eigen vrije omschrijvingen, namen, adressen of bankgegevens.
            Er wordt niets automatisch toegevoegd of gesynchroniseerd.</p>
          <button type="button" onClick={previewCalendar}
            disabled={!current || !entries.some(item => item.kind === 'gepland')}>
            Bekijk mijn geplande borgmomenten als ICS
          </button>
          {calendarPreview && <div role="group" aria-label="Controleer agenda-export borg">
            <p>{calendarPreview.count} geplande persoonlijke agendaherinnering(en).
              Een eerdere verwachte datum blijft alleen een eigen notitie.</p>
            <label htmlFor="deposit-ics-preview">Exacte inhoud van het gekozen bestand</label>
            <textarea id="deposit-ics-preview" value={calendarPreview.contents} rows={9} readOnly />
            {current && calendarPreview.source === JSON.stringify(current) ?
              <>
                <label htmlFor="deposit-ics-approved">
                  <input id="deposit-ics-approved" type="checkbox" checked={calendarConfirmed}
                    onChange={e => setCalendarConfirmed(e.target.checked)} />
                  Ik heb deze precieze eigen agenda-inhoud bekeken en wil zelf een ICS-bestand opslaan.
                </label>
                <button type="button" onClick={downloadCalendar}
                  disabled={!calendarConfirmed}>Download beoordeeld ICS-bestand</button>
              </> : <p role="alert">De borggegevens veranderden. Maak een nieuwe agenda-voorvertoning.</p>}
          </div>}
        </div>
        <label htmlFor="deposit-import">Herstel een eerder gedownload privé-borgboek (max. 12 KiB)</label>
        <input id="deposit-import" type="file" accept=".json,application/json" onChange={chooseBackup} />
        {pending && <div role="group" aria-label="Bevestig herstel borgboek">
          <p><strong>Vervang alle huidige gegevens?</strong> Huidig: {entries.length} regels, borg {current ? euro(current.depositCents) : 'niet ingevuld' }.
            Back-up: {pending.data.entries.length} regels, borg {euro(pending.data.depositCents)}.
            Dit vervangt alle eigen notities in deze sessie, niet je eerdere bestanden.</p>
          <button type="button" onClick={restoreBackup}>Ja, vervang mijn borgboek</button>{' '}
          <button type="button" onClick={() => { setPending(null); setNotice('Herstel geannuleerd.'); }}>Annuleer</button>
        </div>}
        {oneStepUndo && <div role="group" aria-label="Eenmalig privé-herstel">
          <h3>Vorige eigen wijziging eenmalig herstellen</h3>
          <p>Laatste actie: {oneStepUndo.action}. Vorige tabbladstatus:
            {' '}{oneStepUndo.previousEntries.length} notities.
            Als er daarna iets is gewijzigd, wordt herstel uitgeschakeld.
            Een terugzetactie is alleen tijdelijk en verandert nooit een eerder opgeslagen bestand.</p>
          {oneStepUndo.expectedState === ownState() ?
            <button type="button" onClick={restoreOneStep}>Herstel mijn vorige tabbladstatus…</button> :
            <p role="alert">Nieuwe wijzigingen gedetecteerd. Vorige tabbladstatus wordt niet overschreven.</p>}
          <button type="button" onClick={() => setOneStepUndo(null)}>
            Wis tijdelijk herstelpunt
          </button>
        </div>}
        {notice && <p role="status" aria-live="polite">{notice}</p>}
      </div>
    </section>
  );
}

return PrivateDepositLedger;
})();


type MovingFallbackId = 'transport' | 'keys' | 'weather' | 'helpers';
type MovingFallbackEntry = {id:MovingFallbackId;action:string;contact:string;day:string;done:boolean};
const MOVING_FALLBACKS:ReadonlyArray<{id:MovingFallbackId;title:string;tip:string}> = [
  {id:'transport',title:'Vervoer valt uit',tip:'Denk aan een alternatief voertuig of een nieuwe rit.'},
  {id:'keys',title:'Sleuteloverdracht loopt vertraging op',tip:'Leg vast wie je zelf kunt benaderen en waar je tijdelijk terechtkunt.'},
  {id:'weather',title:'Slecht weer of onveilige toegang',tip:'Houd rekening met veilige opslag, droog materiaal en een andere dag.'},
  {id:'helpers',title:'Verhuishulp kan niet komen',tip:'Bedenk wie je eerst vraagt en welke zware taken kunnen wachten.'}
];
const MOVING_FALLBACK_KIND='woonpoints-private-plan-b';
const MOVING_FALLBACK_LIMIT=8192;

/** Private, opt-in recovery across accidental reloads in the same tab only.
 * Never syncs, writes by default, or uses localStorage. JSON schema is always revalidated. */
const PRIVATE_TAB_RECOVERY_REVOKE_EVENT='woonpoints:private-tab-recovery-revoke:v1';
const PRIVATE_TAB_RECOVERY_STATUS_EVENT='woonpoints:private-tab-recovery-status:v1';
const PRIVATE_MOVING_BUNDLE_RESTORE_EVENT='woonpoints:private-moving-bundle-restore:v1';
type PrivateMovingSnapshotChange=(change:(previous:Record<string,string>)=>Record<string,string>)=>void;
type PrivateMovingRestoreMessage={key:string;raw:string};
function usePrivateTabRecovery<T>(
  storageKey:string,initial:()=>T,encode:(data:T)=>string,
  decode:(raw:string)=>T|null,maxBytes:number,
  onBundleSnapshot?:PrivateMovingSnapshotChange
){
  const [value,setValue]=useState<T>(initial);
  const [enabled,setEnabled]=useState(false);
  const [hydrated,setHydrated]=useState(false);
  const [storageMessage,setStorageMessage]=useState('');
  const flagKey=storageKey+':opted-in';
  const clear=()=>{
    window.sessionStorage.removeItem(flagKey);
    window.sessionStorage.removeItem(storageKey);
  };
  useEffect(()=>{
    try{
      if(window.sessionStorage.getItem(flagKey)==='yes'){
        const raw=window.sessionStorage.getItem(storageKey);
        if(!raw||new TextEncoder().encode(raw).length>maxBytes)throw Error('size');
        const data=decode(raw);
        if(data===null)throw Error('schema');
        setValue(data);setEnabled(true);
        setStorageMessage('Vorige eigen tabbladnotities na herladen veilig teruggezet.');
      }
    }catch{
      try{clear();}catch{/* Browser may deny storage entirely. */}
      setStorageMessage('Tabbladherstel niet mogelijk: ongeldige of ontoegankelijke opslag. Bestaande tabbladinvoer blijft behouden.');
    }
    setHydrated(true);
  },[storageKey,flagKey,decode,maxBytes]);
  useEffect(()=>{
    function applyBundle(event:Event){
      const detail=(event as CustomEvent<PrivateMovingRestoreMessage>).detail;
      if(!hydrated||!detail||detail.key!==storageKey||
        typeof detail.raw!=='string')return;
      try{
        if(new TextEncoder().encode(detail.raw).length>maxBytes)return;
        const next=decode(detail.raw);
        if(next===null)return;
        setValue(next);
        setStorageMessage('Gegevens bijgewerkt uit expliciet bevestigde gecombineerde privéback-up.');
      }catch{/* Import must never bypass module validation or corrupt live input. */}
    }
    window.addEventListener(PRIVATE_MOVING_BUNDLE_RESTORE_EVENT,applyBundle);
    return ()=>window.removeEventListener(PRIVATE_MOVING_BUNDLE_RESTORE_EVENT,applyBundle);
  },[storageKey,decode,maxBytes,hydrated]);
  useEffect(()=>{
    if(!hydrated||!onBundleSnapshot)return;
    const raw=encode(value);
    onBundleSnapshot(previous=>previous[storageKey]===raw?previous:
      {...previous,[storageKey]:raw});
  },[storageKey,encode,value,hydrated,onBundleSnapshot]);
  useEffect(()=>{
    const revoke=()=>{
      setEnabled(false);
      try{
        clear();
        setStorageMessage('Centraal ingetrokken: tabbladherstel gewist; open invoer blijft staan.');
      }catch{
        setStorageMessage('Centrale verwijdering niet bevestigd. Wis eventueel de sitegegevens in de browser.');
      }
    };
    window.addEventListener(PRIVATE_TAB_RECOVERY_REVOKE_EVENT,revoke);
    return ()=>window.removeEventListener(PRIVATE_TAB_RECOVERY_REVOKE_EVENT,revoke);
  },[storageKey,flagKey]);
  useEffect(()=>{
    if(!hydrated||!enabled)return;
    try{
      const raw=encode(value);
      if(new TextEncoder().encode(raw).length>maxBytes)throw Error('size');
      if(decode(raw)===null)throw Error('schema');
      window.sessionStorage.setItem(storageKey,raw);
      window.sessionStorage.setItem(flagKey,'yes');
    }catch{
      setEnabled(false);
      try{clear();}catch{/* Fail closed; no claim of successful removal. */}
      setStorageMessage('Automatisch tabbladherstel gestopt: invoer niet herstelbaar of opslag geweigerd. Download zelf een geldige JSON-back-up.');
    }
  },[value,hydrated,enabled,storageKey,flagKey,encode,maxBytes]);
  useEffect(()=>{
    if(hydrated)window.dispatchEvent(new Event(PRIVATE_TAB_RECOVERY_STATUS_EVENT));
  },[enabled,hydrated]);
  function enable(){
    if(!hydrated||enabled)return;
    try{
      const raw=encode(value);
      if(new TextEncoder().encode(raw).length>maxBytes)throw Error('size');
      if(decode(raw)===null)throw Error('schema');
      window.sessionStorage.setItem(storageKey,raw);
      window.sessionStorage.setItem(flagKey,'yes');
      setEnabled(true);
      setStorageMessage('Herstel bij herladen ingeschakeld voor dit tabblad; geen serveropslag.');
    }catch{
      setEnabled(false);
      try{clear();}catch{/* May be inaccessible. */}
      setStorageMessage('Opslaan geweigerd: invoer niet herstelbaar of sessie-opslag ontbreekt. Gebruik de JSON-download.');
    }
  }
  function disable(){
    setEnabled(false);
    try{
      clear();
      setStorageMessage('Herstelgegevens uit dit tabblad gewist; huidige open invoer blijft staan.');
    }catch{
      setStorageMessage('Opslag wissen niet bevestigd door de browser. Wis zo nodig sitegegevens handmatig.');
    }
  }
  return {value,setValue,enabled,hydrated,storageMessage,enable,disable};
}

const FALLBACK_TAB_STORAGE_KEY='woonpoints:private-moving-plan-b:tab-recovery:v1';
function encodeFallbackTab(data:MovingFallbackEntry[]):string{
  return JSON.stringify({kind:MOVING_FALLBACK_KIND,version:1,entries:data});
}
function decodeFallbackTab(raw:string):MovingFallbackEntry[]|null{
  if(raw.length>MOVING_FALLBACK_LIMIT)return null;
  try{return parseMovingFallbackBackup(JSON.parse(raw) as unknown);}catch{return null;}
}

const defaultMovingFallbacks=():MovingFallbackEntry[]=>MOVING_FALLBACKS.map(row=>({
  id:row.id,action:'',contact:'',day:'',done:false
}));
function validMovingFallbackDay(day:string):boolean{
  if(day==='')return true;
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return false;
  const date=new Date(day+'T00:00:00.000Z');
  return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===day &&
    day>='2000-01-01'&&day<='2099-12-31';
}
function movingFallbackEntryValid(raw:unknown):raw is MovingFallbackEntry{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const row=raw as Record<string,unknown>;
  if(Object.keys(row).sort().join(',')!=='action,contact,day,done,id')return false;
  const id=MOVING_FALLBACKS.find(item=>item.id===row.id);
  const safeText=(value:unknown,max:number)=>typeof value==='string'&&
    value.length<=max&&!/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
  return Boolean(id)&&safeText(row.action,200)&&safeText(row.contact,60)&&
    typeof row.day==='string'&&validMovingFallbackDay(row.day)&&typeof row.done==='boolean';
}
function parseMovingFallbackBackup(value:unknown):MovingFallbackEntry[]|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const data=value as Record<string,unknown>;
  if(Object.keys(data).sort().join(',')!=='entries,kind,version'||
    data.kind!==MOVING_FALLBACK_KIND||data.version!==1||
    !Array.isArray(data.entries)||data.entries.length!==MOVING_FALLBACKS.length||
    !data.entries.every(movingFallbackEntryValid))return null;
  if(data.entries.some((row:MovingFallbackEntry,index:number)=>row.id!==MOVING_FALLBACKS[index].id))return null;
  return data.entries.map((row:MovingFallbackEntry)=>({...row}));
}
function movingFallbackDownload(name:string,body:string,mime:string){
  const url=URL.createObjectURL(new Blob([body],{type:mime}));
  try{
    const link=document.createElement('a');link.href=url;link.download=name;
    document.body.appendChild(link);link.click();link.remove();
  }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
function PrivateMovingFallbackPlan({onPulse,onBundleSnapshot}:{
  onPulse?: (pulse:PrivateMovePulse)=>void;
  onBundleSnapshot?:PrivateMovingSnapshotChange
}={}){
  const {value:entries,setValue:setEntries,enabled:rememberTab,hydrated:tabReady,
    storageMessage:tabStorageMessage,enable:enableTabRestore,
    disable:disableTabRestore}=usePrivateTabRecovery<MovingFallbackEntry[]>(
      FALLBACK_TAB_STORAGE_KEY,defaultMovingFallbacks,
      encodeFallbackTab,decodeFallbackTab,MOVING_FALLBACK_LIMIT,onBundleSnapshot);
  const [preview,setPreview]=useState<'txt'|'json'|'ics'|null>(null);
  const [incoming,setIncoming]=useState<MovingFallbackEntry[]|null>(null);
  const [undo,setUndo]=useState<{before:MovingFallbackEntry[];after:string}|null>(null);
  const [confirmReset,setConfirmReset]=useState(false);
  const [notice,setNotice]=useState('');
  const valid=entries.every(movingFallbackEntryValid);
  const completed=entries.filter(row=>row.done).length;
  const ready=entries.filter(row=>row.action.trim()!==''&&row.contact.trim()!=='').length;
  const today=(()=>{const now=new Date();const pad=(n:number)=>String(n).padStart(2,'0');
    return now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());})();
  const dated=entries.filter(row=>row.day&&row.day<=today&&!row.done);
  const futureReminders=entries.filter(row=>row.day&&!row.done);
  useEffect(()=>{
    const reminders:PrivateMoveReminder[]=entries.filter(row=>row.day&&!row.done&&
      validMovingFallbackDay(row.day)).map(row=>({
      id:row.id,day:row.day,origin:'fallback',
      title:MOVING_FALLBACKS.find(item=>item.id===row.id)!.title
    }));
    onPulse?.({done:ready,total:MOVING_FALLBACKS.length,
      attention:dated.length,invalid:!valid,reminders});
  },[onPulse,ready,dated.length,valid,entries]);
  // Intentionally export only known generic labels: never leak user-entered action/contact text.
  const calendar=(()=>{
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Woonpoints//Private Plan B//NL',
      'CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    for(const row of futureReminders){
      const scenario=MOVING_FALLBACKS.find(item=>item.id===row.id)!;
      const compact=row.day.replace(/-/g,'');
      const next=new Date(row.day+'T00:00:00.000Z');
      next.setUTCDate(next.getUTCDate()+1);
      lines.push('BEGIN:VEVENT','UID:woonpoints-planb-'+row.id+'-'+compact+'@local.invalid',
        'DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+compact,
        'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replace(/-/g,''),
        'SUMMARY:Zelf controleren - '+scenario.title,
        'DESCRIPTION:Persoonlijke Woonpoints-controledatum. Open het eigen plan B. Geen externe bevestiging.',
        'END:VEVENT');
    }
    return [...lines,'END:VCALENDAR',''].join('\r\n');
  })();
  const backup=JSON.stringify({kind:MOVING_FALLBACK_KIND,version:1,entries},null,2)+'\n';
  const printable=[
    'WOONPOINTS · MIJN PRIVÉ VERHUISDAG PLAN B',
    'Zelf ingevulde plannen. Geen bevestigde reserveringen of officiële afspraken.',
    '',
    ...entries.flatMap((row,index)=>[
      (index+1)+'. '+MOVING_FALLBACKS[index].title+' · '+(row.done?'zelf afgehandeld':'nog open'),
      'Alternatief: '+(row.action.trim()||'(niet ingevuld)'),
      'Zelf te benaderen: '+(row.contact.trim()||'(niet ingevuld)'),
      'Zelf gekozen controledatum: '+(row.day||'(geen datum)'),''
    ])
  ].join('\r\n')+'\r\n';
  const update=(id:MovingFallbackId,patch:Partial<MovingFallbackEntry>)=>{
    setEntries(previous=>previous.map(row=>row.id===id?{...row,...patch}:row));
    setPreview(null);setIncoming(null);setUndo(null);setConfirmReset(false);setNotice('');
  };
  async function importBackup(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];event.target.value='';
    setIncoming(null);setPreview(null);setUndo(null);setConfirmReset(false);
    if(!file)return;
    if(file.size===0||file.size>MOVING_FALLBACK_LIMIT){
      setNotice('Herstel geweigerd: bestand is leeg of groter dan 8 KiB. Huidige plannen blijven staan.');
      return;
    }
    try{
      const parsed:unknown=JSON.parse(await file.text());
      const next=parseMovingFallbackBackup(parsed);
      if(!next)throw new Error('schema');
      setIncoming(next);
      setNotice('Privébestand gecontroleerd. Je huidige vier plannen zijn nog niet vervangen.');
    }catch{setNotice('Herstel geweigerd: dit is geen geldig Woonpoints-plan-B-bestand. Niets veranderd.');}
  }
  return <section className="panel" aria-labelledby="private-moving-plan-b-heading"
    style={{display:'block'}}>
    <p className="eyebrow">VERHUISDAG · EIGEN NOODPLAN</p>
    <h2 id="private-moving-plan-b-heading">Mijn plan B bij tegenslag</h2>
    <p>Bereid zelf vier veelvoorkomende tegenvallers voor. Noteer een concrete volgende stap,
      een roepnaam of rol en eventueel een controledatum. Dit is uitsluitend privé tabbladgeheugen:
      geen leverancier, verhuurder, hulpverlener of WoningNet wordt gebeld of ingelicht.
      Vermeld hier geen telefoonnummers, adressen of geheime gegevens.</p>
    <div style={{border:'1px solid #d4dfd5',padding:14,borderRadius:10,margin:'12px 0'}}>
      <h3>Behoud mijn plan B bij per ongeluk herladen</h3>
      <p>Standaard wordt niets bewaard. Alleen met jouw toestemming bewaren we
        de vier ingevulde regels tijdelijk in de <strong>niet-versleutelde
        sessie-opslag van dit browsertabblad</strong>. Andere scripts op deze website
        kunnen die tabbladopslag lezen. Gebruik dit niet op een gedeeld apparaat,
        en vul geen telefoonnummers, adressen of geheime gegevens in.
        Een herladen tabblad kan je notities herstellen; sluiten van het tabblad
        wist sessiegegevens gewoonlijk. Maak voor langdurig bewaren zelf een JSON-download.</p>
      {rememberTab?
        <button type="button" disabled={!tabReady} onClick={disableTabRestore}
          style={{minHeight:44}}>Stop bewaren en wis tabbladherstel</button>:
        <button type="button" disabled={!tabReady} onClick={enableTabRestore}
          style={{minHeight:44}}>Ja, onthoud mijn plan B bij herladen</button>}
      <p role="status" aria-live="polite">Tabbladherstel:
        {' '}{tabReady?(rememberTab?'ingeschakeld':'uitgeschakeld'):'bezig met controleren'}.
        {tabStorageMessage&&' '+tabStorageMessage}</p>
    </div>
    <p role="status" aria-live="polite"><strong>{ready}/4 alternatieven voorbereid;
      {' '}{completed}/4 zelf afgehandeld.</strong>
      {dated.length>0&&<> <strong>{dated.length} open controledatum(s) vandaag of eerder.</strong></>}</p>
    <div style={{display:'grid',gap:14}}>
      {MOVING_FALLBACKS.map((scenario,index)=>{
        const row=entries[index];
        return <article key={scenario.id}
          style={{padding:14,border:'1px solid #d4dfd5',borderRadius:10}}>
          <h3>{index+1} · {scenario.title}</h3><p>{scenario.tip}</p>
          <label style={{display:'block'}}>Mijn alternatief
            <input type="text" maxLength={200} value={row.action}
              onChange={event=>update(row.id,{action:event.target.value})}
              placeholder="Wat ga ik zelf doen?" style={{display:'block',width:'100%',minHeight:44}}/>
          </label>
          <label style={{display:'block',marginTop:10}}>Wie kan ik zelf benaderen? (roepnaam of rol)
            <input type="text" maxLength={60} value={row.contact}
              onChange={event=>update(row.id,{contact:event.target.value})}
              placeholder="Bijvoorbeeld: buur of verhuizer" style={{display:'block',width:'100%',minHeight:44}}/>
          </label>
          <label style={{display:'block',marginTop:10}}>Zelf gekozen controledatum (optioneel)
            <input type="date" min="2000-01-01" max="2099-12-31" value={row.day}
              onChange={event=>update(row.id,{day:event.target.value})}
              style={{display:'block',minHeight:44}}/>
          </label>
          <label style={{display:'flex',gap:10,alignItems:'center',marginTop:12}}>
            <input type="checkbox" checked={row.done}
              onChange={event=>update(row.id,{done:event.target.checked})}/>
            Ik heb dit zelf afgehandeld
          </label>
          {row.day&&row.day<=today&&!row.done&&<p role="status">
            Controleer deze zelfgekozen datum; er wordt geen melding verzonden.</p>}
        </article>;
      })}
    </div>
    <details style={{marginTop:16}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>Privéoverzicht downloaden of herstellen</summary>
      <p>TXT/JSON bevatten alle ingevulde alternatieven, roepnamen en datums.
        De optionele agenda-export bevat uitsluitend vaste scenariotitels en datums,
        <strong> nooit roepnamen of privéacties</strong>. Controleer ieder bestand en
        kies zelf een veilige opslagplek; die kan extern synchroniseren.
        Agenda-import is volledig handmatig en maakt geen afspraken.</p>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button type="button" disabled={!valid} onClick={()=>{setPreview('txt');setIncoming(null);}}
          style={{minHeight:44}}>Bekijk afdrukbaar TXT-overzicht</button>
        <button type="button" disabled={!valid} onClick={()=>{setPreview('json');setIncoming(null);}}
          style={{minHeight:44}}>Bekijk volledige privéback-up</button>
        <button type="button" disabled={!valid||futureReminders.length===0}
          onClick={()=>{setPreview('ics');setIncoming(null);}}
          style={{minHeight:44}}>Bekijk agenda-export ({futureReminders.length} open datums)</button>
      </div>
      {preview&&<div>
        <p>Dit is de <strong>exacte inhoud</strong> van je eigen download:</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:260,overflow:'auto'}}>
          {preview==='txt'?printable:preview==='json'?backup:calendar}
        </pre>
        <button type="button" onClick={()=>{
          if(preview==='txt')movingFallbackDownload('woonpoints-verhuisdag-plan-b.txt',
            printable,'text/plain;charset=utf-8');
          else if(preview==='json')movingFallbackDownload('woonpoints-verhuisdag-plan-b.json',
            backup,'application/json;charset=utf-8');
          else movingFallbackDownload('woonpoints-verhuisdag-plan-b.ics',
            calendar,'text/calendar;charset=utf-8');
          setPreview(null);setNotice('Privébestand aan je browser aangeboden; je bewaart het zelf.');
        }} style={{minHeight:44}}>Download precies dit bestand</button>
        <button type="button" onClick={()=>setPreview(null)}
          style={{minHeight:44,marginLeft:8}}>Annuleer</button>
      </div>}
      <label htmlFor="moving-fallback-import" style={{display:'block',marginTop:16}}>
        Herstel mijn eigen plan-B-back-up (maximaal 8 KiB)
      </label>
      <input id="moving-fallback-import" type="file" accept=".json,application/json"
        onChange={importBackup} style={{maxWidth:'100%'}}/>
      {incoming&&<div>
        <p>Geldig privébestand: {incoming.filter(row=>row.done).length} afgehandeld,
          {incoming.filter(row=>row.action.trim()&&row.contact.trim()).length} voorbereid.
          Dit vervangt alle vier huidige regels, niet je andere verhuisgegevens.</p>
        <button type="button" onClick={()=>{
          setUndo({before:entries.map(row=>({...row})),after:JSON.stringify(incoming)});
          setEntries(incoming);setIncoming(null);setConfirmReset(false);
          setNotice('Eigen plannen vervangen. Eénmalig herstel is mogelijk zolang niets verandert.');
        }} style={{minHeight:44}}>Vervang mijn vier plannen</button>
        <button type="button" onClick={()=>setIncoming(null)}
          style={{minHeight:44,marginLeft:8}}>Behoud huidige plannen</button>
      </div>}
      {undo&&<button type="button" disabled={JSON.stringify(entries)!==undo.after}
        onClick={()=>{setEntries(undo.before);setUndo(null);setNotice('Vorige tabbladplannen hersteld.');}}
        style={{display:'block',minHeight:44,marginTop:12}}>Draai laatste herstel éénmaal terug</button>}
      <button type="button" onClick={()=>{setConfirmReset(true);setIncoming(null);setPreview(null);}}
        style={{display:'block',minHeight:44,marginTop:16}}>Wis mijn plan-B-notities</button>
      {confirmReset&&<div>
        <p>Alle vier alternatieven, roepnamen, controledatums en eigen statussen uit dit
          tabblad wissen? Andere Woonpoints-onderdelen blijven bestaan.</p>
        <button type="button" onClick={()=>{
          setEntries(defaultMovingFallbacks());setUndo(null);setConfirmReset(false);
          setNotice('Alleen dit privé-plan B is gewist.');
        }} style={{minHeight:44}}>Ja, wis alleen dit plan</button>
        <button type="button" onClick={()=>setConfirmReset(false)}
          style={{minHeight:44,marginLeft:8}}>Niet wissen</button>
      </div>}
    </details>
    {notice&&<p role="status" aria-live="polite">{notice}</p>}
  </section>;
}


type PrivateMoveReminder={id:string;title:string;day:string;origin:'fallback'|'utility'};
type PrivateMovePulse={done:number;total:number;attention:number;invalid:boolean;
  reminders?:PrivateMoveReminder[]};
type PrivateMovingReadinessRow={
  id:string;title:string;href:string;hint:string;pulse:PrivateMovePulse|null
};

type PrivateMovingBundleData=Record<string,string>;
const PRIVATE_MOVING_BUNDLE_KIND='woonpoints-private-moving-bundle';
const PRIVATE_MOVING_BUNDLE_LIMIT=32768;
const PRIVATE_MOVING_BUNDLE_PARTS=[
  {field:'journey',key:JOURNEY_TAB_STORAGE_KEY,title:'Mijn woonreis'},
  {field:'fallback',key:FALLBACK_TAB_STORAGE_KEY,title:'Verhuisdag plan B'},
  {field:'meters',key:METER_TAB_STORAGE_KEY,title:'Meterstanden'},
  {field:'utilities',key:UTILITY_TAB_STORAGE_KEY,title:'Nutsvoorzieningen'}
] as const;
function privateMovingBundleCurrent(snapshots:PrivateMovingBundleData):boolean{
  return PRIVATE_MOVING_BUNDLE_PARTS.every(part=>typeof snapshots[part.key]==='string');
}
function privateMovingBundleSignature(snapshots:PrivateMovingBundleData):string{
  return JSON.stringify(PRIVATE_MOVING_BUNDLE_PARTS.map(part=>snapshots[part.key]??null));
}
function privateMovingBundleSerialize(snapshots:PrivateMovingBundleData):string{
  if(!privateMovingBundleCurrent(snapshots))throw Error('Er ontbreken nog onderdelen.');
  const journey=JSON.parse(snapshots[JOURNEY_TAB_STORAGE_KEY]);
  const fallback=JSON.parse(snapshots[FALLBACK_TAB_STORAGE_KEY]);
  const meters=JSON.parse(snapshots[METER_TAB_STORAGE_KEY]);
  const utilities=JSON.parse(snapshots[UTILITY_TAB_STORAGE_KEY]);
  const valid=decodeJourneyTab(snapshots[JOURNEY_TAB_STORAGE_KEY])!==null&&
    decodeFallbackTab(snapshots[FALLBACK_TAB_STORAGE_KEY])!==null&&
    decodeMeterTab(snapshots[METER_TAB_STORAGE_KEY])!==null&&
    decodeUtilityTab(snapshots[UTILITY_TAB_STORAGE_KEY])!==null;
  if(!valid)throw Error('Een brononderdeel bevat ongeldige invoer.');
  const text=JSON.stringify({
    kind:PRIVATE_MOVING_BUNDLE_KIND,version:1,
    journey,fallback,meters,utilities
  },null,2)+'\n';
  if(new TextEncoder().encode(text).length>PRIVATE_MOVING_BUNDLE_LIMIT)
    throw Error('Gecombineerd privébestand te groot.');
  return text;
}
/** Strict, canonical and fail-closed. No partial application before all modules validate. */
function privateMovingBundleParse(raw:string):PrivateMovingBundleData|null{
  try{
    if(new TextEncoder().encode(raw).length>PRIVATE_MOVING_BUNDLE_LIMIT)return null;
    const data:unknown=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const obj=data as Record<string,unknown>;
    if(Object.keys(obj).sort().join(',')!=='fallback,journey,kind,meters,utilities,version'||
      obj.kind!==PRIVATE_MOVING_BUNDLE_KIND||obj.version!==1||
      !obj.journey||typeof obj.journey!=='object'||Array.isArray(obj.journey)||
      !obj.fallback||typeof obj.fallback!=='object'||Array.isArray(obj.fallback)||
      !obj.meters||typeof obj.meters!=='object'||Array.isArray(obj.meters)||
      !obj.utilities||typeof obj.utilities!=='object'||Array.isArray(obj.utilities))return null;
    const journey=JSON.stringify(obj.journey);
    const fallback=JSON.stringify(obj.fallback);
    const meterData=obj.meters as Record<string,unknown>;
    const utilityData=obj.utilities as Record<string,unknown>;
    const meters=handoverBackup(meterData.readings as PrivateMeterTabData['readings'],
      meterData.included as PrivateMeterTabData['included']);
    const utilities=privateUtilityBackup(utilityData.entries as Record<PrivateUtilityKey,PrivateUtilityStep>);
    const snapshots:PrivateMovingBundleData={
      [JOURNEY_TAB_STORAGE_KEY]:journey,
      [FALLBACK_TAB_STORAGE_KEY]:fallback,
      [METER_TAB_STORAGE_KEY]:meters,
      [UTILITY_TAB_STORAGE_KEY]:utilities
    };
    if(privateMovingBundleSerialize(snapshots)!==raw)return null;
    return snapshots;
  }catch{return null;}
}

function PrivateMovingReadinessBoard({rows,snapshots}:{
  rows:PrivateMovingReadinessRow[];
  snapshots:Record<string,string>
}){
  const [confirmRevokeAll,setConfirmRevokeAll]=useState(false);
  const [revokeMessage,setRevokeMessage]=useState('');
  const [activeTabCopies,setActiveTabCopies]=useState<number|null>(null);
  useEffect(()=>{
    function refresh(){
      const keys=[FALLBACK_TAB_STORAGE_KEY,JOURNEY_TAB_STORAGE_KEY,
        METER_TAB_STORAGE_KEY,UTILITY_TAB_STORAGE_KEY];
      try{
        setActiveTabCopies(keys.filter(key=>
          window.sessionStorage.getItem(key+':opted-in')==='yes').length);
      }catch{setActiveTabCopies(null);}
    }
    refresh();
    window.addEventListener(PRIVATE_TAB_RECOVERY_STATUS_EVENT,refresh);
    return ()=>window.removeEventListener(PRIVATE_TAB_RECOVERY_STATUS_EVENT,refresh);
  },[]);
  function revokeAllTabRecovery(){
    if(!confirmRevokeAll)return;
    // Each mounted hook must also stop future writes. No backend or cross-origin request.
    window.dispatchEvent(new Event(PRIVATE_TAB_RECOVERY_REVOKE_EVENT));
    const keys=[FALLBACK_TAB_STORAGE_KEY,JOURNEY_TAB_STORAGE_KEY,
      METER_TAB_STORAGE_KEY,UTILITY_TAB_STORAGE_KEY];
    let denied=0;
    for(const key of keys){
      try{
        window.sessionStorage.removeItem(key+':opted-in');
        window.sessionStorage.removeItem(key);
      }catch{denied++;}
    }
    window.dispatchEvent(new Event(PRIVATE_TAB_RECOVERY_STATUS_EVENT));
    setConfirmRevokeAll(false);
    setRevokeMessage(denied>0?
      'De browser heeft opslagverwijdering niet overal bevestigd. Wis zo nodig sitegegevens handmatig.':
      'Alle vier tijdelijke herstelkopieën ingetrokken en gewist. Open formulierinvoer blijft staan.');
  }
  const [bundlePreview,setBundlePreview]=useState<{from:string;contents:string}|null>(null);
  const [bundleDownloadApproved,setBundleDownloadApproved]=useState(false);
  const [bundleIncoming,setBundleIncoming]=useState<{
    from:string;contents:string;data:PrivateMovingBundleData
  }|null>(null);
  const [bundleRestoreApproved,setBundleRestoreApproved]=useState(false);
  const [bundleUndo,setBundleUndo]=useState<{
    expected:string;previous:PrivateMovingBundleData
  }|null>(null);
  const [bundleMessage,setBundleMessage]=useState('');
  const bundleReady=privateMovingBundleCurrent(snapshots);
  const bundleSignature=privateMovingBundleSignature(snapshots);
  const bundlePreviewFresh=bundlePreview!==null&&bundlePreview.from===bundleSignature&&bundleReady;
  const bundleIncomingFresh=bundleIncoming!==null&&bundleIncoming.from===bundleSignature&&bundleReady;
  const bundleUndoFresh=bundleUndo!==null&&bundleUndo.expected===bundleSignature&&bundleReady;
  function previewBundle(){
    setBundlePreview(null);setBundleDownloadApproved(false);setBundleMessage('');
    try{
      const contents=privateMovingBundleSerialize(snapshots);
      setBundlePreview({from:bundleSignature,contents});
    }catch{
      setBundleMessage('Eén of meer onderdelen hebben ongeldige invoer. Herstel dit eerst bij de bron.');
    }
  }
  function downloadBundle(){
    if(!bundlePreviewFresh||!bundleDownloadApproved||!bundlePreview)return;
    const url=URL.createObjectURL(new Blob([bundlePreview.contents],{
      type:'application/json;charset=utf-8'
    }));
    try{
      const link=document.createElement('a');link.href=url;
      link.download='woonpoints-verhuisregie-prive-backup.json';
      document.body.appendChild(link);link.click();link.remove();
      setBundleMessage('Eigen privébestand aan je browser aangeboden; geen automatische cloudopslag.');
    }finally{
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setBundlePreview(null);setBundleDownloadApproved(false);
    }
  }
  async function importBundle(file:File|undefined){
    setBundleIncoming(null);setBundleRestoreApproved(false);setBundleMessage('');
    if(!file)return;
    if(!bundleReady){
      setBundleMessage('Niet alle bronschermen zijn geladen; herladen of herstellen niet mogelijk.');
      return;
    }
    if(file.size>PRIVATE_MOVING_BUNDLE_LIMIT){
      setBundleMessage('Gecombineerde back-up geweigerd: groter dan 32 KiB.');return;
    }
    try{
      const contents=await file.text();
      const data=privateMovingBundleParse(contents);
      if(!data)throw Error('invalid');
      setBundleIncoming({from:bundleSignature,contents,data});
      setBundlePreview(null);setBundleDownloadApproved(false);
    }catch{
      setBundleMessage('Back-up geweigerd: geen exact geldig Woonpoints-combinatiebestand.');
    }
  }
  function applyBundle(data:PrivateMovingBundleData){
    for(const part of PRIVATE_MOVING_BUNDLE_PARTS){
      window.dispatchEvent(new CustomEvent<PrivateMovingRestoreMessage>(
        PRIVATE_MOVING_BUNDLE_RESTORE_EVENT,{
          detail:{key:part.key,raw:data[part.key]}
        }));
    }
  }
  function restoreBundle(){
    if(!bundleIncomingFresh||!bundleRestoreApproved||!bundleIncoming)return;
    const previous={...snapshots};
    const next=bundleIncoming.data;
    // All four subdocuments passed exact-schema validation before *any* source state is touched.
    applyBundle(next);
    setBundleUndo({expected:privateMovingBundleSignature(next),previous});
    setBundleIncoming(null);setBundleRestoreApproved(false);
    setBundleMessage('Vier bronschermen teruggezet. Je vorige tabbladstatus is éénmalig herstelbaar.');
  }
  function undoBundle(){
    if(!bundleUndoFresh||!bundleUndo)return;
    applyBundle(bundleUndo.previous);
    setBundleUndo(null);setBundleIncoming(null);setBundleRestoreApproved(false);
    setBundleMessage('Vorige open tabbladstatus hersteld; de bronmodules bewaren alleen bij afzonderlijke opt-in.');
  }

  const [preview,setPreview]=useState<{
    signature:string;contents:string;mode:'txt'|'ics'
  }|null>(null);
  const pending=rows.some(row=>row.pulse===null);
  const complete=rows.reduce((sum,row)=>sum+(row.pulse?.done??0),0);
  const total=rows.reduce((sum,row)=>sum+(row.pulse?.total??0),0);
  const attention=rows.reduce((sum,row)=>sum+(row.pulse?.attention??0),0);
  const urgent=rows.filter(row=>row.pulse?.invalid||Boolean(row.pulse?.attention))
    .sort((a,b)=>(Number(Boolean(b.pulse?.invalid))-Number(Boolean(a.pulse?.invalid)))||
      (b.pulse?.attention??0)-(a.pulse?.attention??0));
  const incomplete=rows.filter(row=>row.pulse&&row.pulse.done<row.pulse.total);
  // Reminders are fixed labels + own calendar dates; never read private user strings.
  const reminders=rows.flatMap(row=>row.pulse?.reminders??[])
    .sort((a,b)=>a.day.localeCompare(b.day)||a.origin.localeCompare(b.origin)||a.id.localeCompare(b.id));
  const calendar=(()=>{
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const escape=(value:string)=>value.replace(/\\/g,'\\\\')
      .replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0',
      'PRODID:-//Woonpoints//Private Moving Readiness//NL',
      'CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    for(const item of reminders){
      const next=new Date(item.day+'T00:00:00.000Z');
      next.setUTCDate(next.getUTCDate()+1);
      lines.push('BEGIN:VEVENT',
        'UID:woonpoints-regie-'+item.origin+'-'+item.id+'-'+item.day.replace(/-/g,'')+'@local.invalid',
        'DTSTAMP:'+stamp,
        'DTSTART;VALUE=DATE:'+item.day.replace(/-/g,''),
        'DTEND;VALUE=DATE:'+next.toISOString().slice(0,10).replace(/-/g,''),
        'SUMMARY:'+escape('Zelf controleren: '+item.title),
        'DESCRIPTION:Persoonlijke Woonpoints-controledatum. Geen externe afspraak of bevestiging.',
        'END:VEVENT');
    }
    // Fold at <=70 UTF-8 octets, without splitting multibyte characters.
    const encoder=new TextEncoder();
    const fold=(line:string)=>{
      let out='',octets=0;
      for(const character of line){
        const bytes=encoder.encode(character).length;
        if(octets+bytes>70){out+='\r\n ';octets=1;}
        out+=character;octets+=bytes;
      }
      return out;
    };
    return [...lines,'END:VCALENDAR',''].map(fold).join('\r\n');
  })();
  const formatLine=(value:string)=>value.replace(/[\u0000-\u001f\u007f-\u009f]/gu,' ').trim();
  const report=[
    'WOONPOINTS · MIJN EIGEN VERHUISREGIE',
    'Alle waarden komen uit eigen, tijdelijke tabbladnotities; geen officiële verificatie.',
    'Geen automatische afspraken of accountgegevens.',
    '',
    ...rows.flatMap(row=>[
      row.title,
      row.pulse===null?'Dit onderdeel is nog niet geladen.':
      'Zelf geregistreerd: '+row.pulse.done+' van '+row.pulse.total+
      (row.pulse.invalid?' · invoer controleren':'')+
      (row.pulse.attention?' · '+row.pulse.attention+' aandachtspunt(en)':''),
      'Open onderdeel: '+formatLine(row.href),
      ''
    ])
  ].join('\r\n')+'\r\n';
  // Only a complete, current read model can be downloaded.
  const signature=JSON.stringify(rows.map(row=>row.pulse));
  const validPreview=preview!==null&&preview.signature===signature&&!pending;
  function download(){
    if(!validPreview||!preview)return;
    const url=URL.createObjectURL(new Blob([preview.contents],
      {type:preview.mode==='ics'?'text/calendar;charset=utf-8':'text/plain;charset=utf-8'}));
    try{
      const link=document.createElement('a');link.href=url;
      link.download=preview.mode==='ics'?
        'woonpoints-verhuisregie-datums.ics':'woonpoints-verhuisregie.txt';
      document.body.appendChild(link);link.click();link.remove();
    }finally{
      window.setTimeout(()=>URL.revokeObjectURL(url),1000);
      setPreview(null);
    }
  }
  return <section className="panel" aria-labelledby="private-moving-readiness-heading"
    style={{display:'block'}}>
    <p className="eyebrow">PRIVÉ · ÉÉN OVERZICHT</p>
    <h2 id="private-moving-readiness-heading">Mijn verhuisregie</h2>
    <p>Bekijk vier <strong>zelf ingevulde</strong> onderdelen samen. Dit regiebord leest
      uitsluitend hun huidige tabbladstatus, niet WoningNet, de overheid, de verhuurder
      of een leverancier. Een open stap is geen officiële achterstand; een afgevinkte
      stap is geen bevestiging van een organisatie.</p>
    <details style={{border:'1px solid #d4dfd5',borderRadius:10,padding:14,margin:'14px 0'}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>
        Mijn vier verhuisdelen samen back-uppen of herstellen
      </summary>
      <p>Hier kun je de volledige eigen tabbladinvoer van de
        <strong> woonreis, plan B, meterstanden én nutsvoorzieningen</strong> in één
        privé-JSON opslaan of terugzetten. Dit bestand bevat mogelijk ingevulde
        actieomschrijvingen, contactrollen, meterstanden en eigen datums.
        Bekijk de inhoud vóór downloaden en kies zelf een veilige bewaarlocatie;
        die kan extern synchroniseren. Woonpoints verstuurt dit nergens heen.
        Hiermee worden <strong>geen</strong> WoningNet-reacties, contracten,
        leveranciers of afspraken officieel verwerkt.</p>
      <button type="button" disabled={!bundleReady} onClick={previewBundle}
        style={{minHeight:44}}>Bekijk exacte volledige privéback-up</button>
      {bundlePreview&&<div>
        {bundlePreviewFresh?<><p>Je eigen complete bestand (exacte inhoud):</p>
          <pre style={{maxHeight:250,overflow:'auto',whiteSpace:'pre-wrap',
            overflowWrap:'anywhere'}}>{bundlePreview.contents}</pre>
          <label style={{display:'block',minHeight:44}}>
            <input type="checkbox" checked={bundleDownloadApproved}
              onChange={event=>setBundleDownloadApproved(event.target.checked)}/>
            {' '}Ik heb dit privébestand bekeken en kies zelf waar het wordt opgeslagen.
          </label>
          <button type="button" disabled={!bundleDownloadApproved}
            onClick={downloadBundle} style={{minHeight:44}}>
            Download mijn volledige privé-back-up</button></>:
          <p role="alert">Je invoer is inmiddels gewijzigd. Maak een nieuwe preview.</p>}
        <button type="button" onClick={()=>{setBundlePreview(null);
          setBundleDownloadApproved(false);}} style={{minHeight:44,marginLeft:8}}>
          Annuleren</button>
      </div>}
      <label htmlFor="private-moving-bundle-import"
        style={{display:'block',marginTop:16,fontWeight:700}}>
        Herstel mijn complete eigen back-up (maximaal 32 KiB)
      </label>
      <input id="private-moving-bundle-import" type="file"
        accept=".json,application/json" style={{maxWidth:'100%'}}
        onChange={event=>{const file=event.target.files?.[0];
          event.target.value='';void importBundle(file);}}/>
      {bundleIncoming&&<div>
        {bundleIncomingFresh?<><p>Geldig bestand: alle vier onderdelen bevatten
          exact herkende Woonpoints-gegevens. <strong>Herstellen vervangt de
          huidige invoer in alle vier schermen</strong>; niets wordt buiten
          dit tabblad verzonden. De afzonderlijke automatische opslaginstellingen
          blijven zoals ze nu staan.</p>
          <ul>{PRIVATE_MOVING_BUNDLE_PARTS.map(part=><li key={part.key}>
            {part.title} — wordt vervangen
          </li>)}</ul>
          <label style={{display:'block',minHeight:44}}>
            <input type="checkbox" checked={bundleRestoreApproved}
              onChange={event=>setBundleRestoreApproved(event.target.checked)}/>
            {' '}Ik begrijp dat mijn vier huidige formulieren worden vervangen.
          </label>
          <button type="button" disabled={!bundleRestoreApproved}
            style={{minHeight:44}} onClick={restoreBundle}>
            Bevestig herstel van alle vier onderdelen</button></>:
          <p role="alert">De huidige invoer is veranderd. Selecteer het bestand opnieuw.</p>}
        <button type="button" style={{minHeight:44,marginLeft:8}}
          onClick={()=>{setBundleIncoming(null);setBundleRestoreApproved(false);}}>
          Herstel annuleren</button>
      </div>}
      {bundleUndo&&<div>
        {bundleUndoFresh?<button type="button" onClick={undoBundle}
          style={{minHeight:44}}>Maak laatste gecombineerde herstel ongedaan</button>:
          <p role="status">De tabbladstatus is na het herstel aangepast.
            Undo is uitgeschakeld zodat nieuwe invoer behouden blijft.</p>}
      </div>}
      {bundleMessage&&<p role="status" aria-live="polite">{bundleMessage}</p>}
      {!bundleReady&&<p role="status">Brononderdelen laden nog; de back-up is
        pas beschikbaar wanneer alle vier zijn geladen.</p>}
    </details>
    <details style={{border:'1px solid #d4dfd5',borderRadius:10,padding:14,margin:'14px 0'}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>
        Privacy: tijdelijke tabbladherstelkopieën beheren
        {activeTabCopies===null?' (opslagstatus onbekend)':
          ' ('+activeTabCopies+'/4 ingeschakeld)'}
      </summary>
      <p>Woonreis, plan B, meterstanden en nutsvoorzieningen bieden elk een
        afzonderlijke opt-in voor niet-versleutelde sessie-opslag. De exacte
        privé-inhoud verschijnt niet in dit regiebord. Met onderstaande optie
        schakel je alle vier herstelopties voor dit tabblad tegelijk uit
        en verwijder je hun tijdelijke kopieën. <strong>Je huidige open
        formuliervelden en eerder gedownloade JSON-bestanden blijven bestaan.</strong>
        Dit is geen volledige browser-sitegegevensverwijdering en geen externe actie.</p>
      {!confirmRevokeAll?
        <button type="button" onClick={()=>{setConfirmRevokeAll(true);setRevokeMessage('');}}
          style={{minHeight:44}}>Alle vier tabbladherstelopties uitschakelen…</button>:
        <div>
          <p>Bevestig: alle vier tijdelijke herstelsnapshots in dit
            browsertabblad wissen en verdere automatische sessie-opslag stoppen?
            De open invoer blijft staan, maar kan na herladen verdwijnen
            totdat je opnieuw bewust opslaan aanzet.</p>
          <button type="button" onClick={revokeAllTabRecovery}
            style={{minHeight:44}}>Ja, stop en wis alle vier</button>
          <button type="button" onClick={()=>setConfirmRevokeAll(false)}
            style={{minHeight:44,marginLeft:8}}>Annuleren</button>
        </div>}
      {revokeMessage&&<p role="status" aria-live="polite">{revokeMessage}</p>}
    </details>
    <p role="status" aria-live="polite">
      {pending?'Onderdelen worden geladen…':
        <><strong>{complete}/{total}</strong> persoonlijke controlevelden ingevuld
          of afgehandeld. <strong>{attention}</strong> aandachtspunt(en) volgens
          zelfgekozen datums of invoer. </>
      }
    </p>
    {urgent.length>0&&<div>
      <h3>Nu zelf controleren</h3>
      <ul>{urgent.map(row=><li key={row.id}>
        <a href={row.href}>{row.title}</a>{' · '}
        {row.pulse?.invalid?'Controleer ongeldige invoer. ' : ''}
        {row.pulse?.attention?row.pulse.attention+' zelf geregistreerde aandachtspunt(en).':''}
      </li>)}</ul>
    </div>}
    {reminders.length>0&&<div>
      <h3>Mijn zelfgekozen controledatums ({reminders.length})</h3>
      <ol>{reminders.map(item=><li key={item.origin+'-'+item.id}>
        <strong>{item.day}</strong> · {item.title} ·{' '}
        <a href={item.origin==='fallback'?'#private-moving-plan-b-heading':
          '#private-utility-transfer-heading'}>Open bron</a>
      </li>)}</ol>
      <p>Alle datums zijn door jou gekozen. Hieruit volgen geen officiële termijnen,
        meldingen, contractacties of kalenderafspraken.</p>
    </div>}
    <div style={{display:'grid',
      gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,240px),1fr))',gap:12}}>
      {rows.map(row=><article key={row.id}
        style={{border:'1px solid #d4dfd5',padding:14,borderRadius:10}}>
        <h3>{row.title}</h3>
        <p>{row.pulse?row.pulse.done+' / '+row.pulse.total+' zelf geregistreerd':
          'Nog geen tabbladstatus'}</p>
        {row.pulse&&row.pulse.total>0&&
          <progress value={row.pulse.done} max={row.pulse.total}
            aria-label={'Persoonlijke voortgang '+row.title}
            style={{width:'100%'}}/>}
        <p>{row.hint}</p>
        <a href={row.href}>Open en werk bij ↓</a>
      </article>)}
    </div>
    {!pending&&incomplete.length>0&&<p>Volgende eigen stap:
      {' '}<a href={incomplete[0].href}>{incomplete[0].title}</a>.
      Dit is een suggestie op basis van tabbladstatus, geen externe prioriteit.</p>}
    <details style={{marginTop:16}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>Privéstatus bekijken en zelf exporteren</summary>
      <p>TXT bevat uitsluitend vaste onderdeelnamen, aantallen en interne links.
        De optionele agenda bevat alleen zelfgekozen datums en vooraf vaste
        scenariotitels uit plan B/nutsvoorzieningen; geen adressen, contactnamen,
        ingevulde acties, bedragen, wachtwoorden of andere persoonlijke invoer.
        Niets wordt automatisch naar een agenda of organisatie verzonden.
        Je downloadlocatie kan extern synchroniseren.</p>
      <button type="button" disabled={pending}
        onClick={()=>setPreview({signature,contents:report,mode:'txt'})}
        style={{minHeight:44}}>Bekijk exacte TXT-export…</button>
      <button type="button" disabled={pending||reminders.length===0}
        onClick={()=>setPreview({signature,contents:calendar,mode:'ics'})}
        style={{minHeight:44,marginLeft:8}}>
        Bekijk één agenda-export ({reminders.length} datums)…
      </button>
      {preview&&<div>
        {validPreview?<><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
          maxHeight:220,overflow:'auto'}}>{preview.contents}</pre>
          <button type="button" onClick={download} style={{minHeight:44}}>
            Download dit privéstatusoverzicht</button></>:
          <p role="alert">De onderdeelinvoer is gewijzigd; open een nieuwe preview.</p>}
        <button type="button" onClick={()=>setPreview(null)}
          style={{minHeight:44,marginLeft:8}}>Sluiten</button>
      </div>}
    </details>
  </section>;
}
export default function HomePage() {
  const [movingBundleSnapshots,setMovingBundleSnapshots]=useState<Record<string,string>>({});
  const [journeyPulse,setJourneyPulse]=useState<PrivateMovePulse|null>(null);
  const [fallbackPulse,setFallbackPulse]=useState<PrivateMovePulse|null>(null);
  const [metersPulse,setMetersPulse]=useState<PrivateMovePulse|null>(null);
  const [utilitiesPulse,setUtilitiesPulse]=useState<PrivateMovePulse|null>(null);
  const movingReadinessRows:PrivateMovingReadinessRow[]=[
    {id:'journey',title:'Mijn woonreis',href:'#private-journey-heading',
      hint:'Zelf afgevinkte stappen; geen officiële reactie of toewijzing.',pulse:journeyPulse},
    {id:'fallback',title:'Verhuisdag plan B',href:'#private-moving-plan-b-heading',
      hint:'Voorbereide alternatieven en verstreken eigen controledatums.',pulse:fallbackPulse},
    {id:'meters',title:'Meterstanden',href:'#private-meter-handover-heading',
      hint:'Zelf genoteerde oude en nieuwe meterwaarden.',pulse:metersPulse},
    {id:'utilities',title:'Nutsvoorzieningen',href:'#private-utility-transfer-heading',
      hint:'Zelf gemarkeerde contract- en verhuisstappen.',pulse:utilitiesPulse}
  ];
  const [personalOverview,setPersonalOverview]=useState<PrivateHomeOverview|null>(null);
  const cards = initialCards.map(([label,value,detail])=>{
    if(label==='Maanddoel' && personalOverview?.count!=null) return [
      label,personalOverview.count+' / 4 zelf genoteerd',
      personalOverview.storage==='temporary'?
        'Tijdelijke eigen teller; browseropslag niet bevestigd, niet officieel geldig.':
        'Eigen maandteller, nooit officieel bevestigde geldige reacties.'
    ];
    if(label==='Actieve reacties' && personalOverview?.journalReacted!=null) return [
      'Zelf genoteerde reacties',personalOverview.journalReacted+' zelf gereageerd',
      (personalOverview.journalTotal??0)+' eigen notities in '+
        personalOverview.month+'; niet bij WoningNet geverifieerd.'
    ];
    if(label==='Zoekpunten' && personalOverview?.points) return [
      'Zelf genoteerde zoekpunten',personalOverview.points.points+' punten',
      'Handmatig afgelezen in '+personalOverview.points.month+
        '; geen officiële toekenning of accountverificatie.'
    ];
    return [label,value,detail];
  });
  const [navigationCategory,setNavigationCategory]=useState<
    'snel'|'favorieten'|'recent'|'alles'|HomeNavCategory>('snel');
  const [recentNavIds,setRecentNavIds]=useState<string[]>([]);
  const navSearchRef=useRef<HTMLInputElement|null>(null);
  useEffect(()=>{
    function onShortcut(event:KeyboardEvent){
      if((event.ctrlKey||event.metaKey)&&!event.altKey&&!event.shiftKey&&
        event.key.toLowerCase()==='k'){
        event.preventDefault();
        navSearchRef.current?.focus();
        navSearchRef.current?.select();
      }
    }
    window.addEventListener('keydown',onShortcut);
    return()=>window.removeEventListener('keydown',onShortcut);
  },[]);
  function recordNavigation(id:string){
    if(!homepageDestinations.some(item=>item.id===id))return;
    setRecentNavIds(previous=>[id,...previous.filter(value=>value!==id)].slice(0,MAX_RECENT_NAV));
  }
  const [pinnedNavIds,setPinnedNavIds]=useState<string[]>([]);
  const [pinMessage,setPinMessage]=useState('');
  const [pinBackupPreview,setPinBackupPreview]=useState<{
    bytes:string;source:string
  }|null>(null);
  const [pinImportPreview,setPinImportPreview]=useState<{
    pins:string[];source:string
  }|null>(null);
  const [pinStorageState,setPinStorageState]=useState<'unknown'|'persistent'|'temporary'>('unknown');
  useEffect(()=>{
    function refresh(){
      try{
        const value=decodeNavPins(window.localStorage.getItem(NAV_PINS_STORAGE_KEY));
        if(value===null){
          setPinStorageState('temporary');
          setPinMessage('Een bestaande onbekende vastzetvoorkeur blijft bewaard; '+
            'nieuwe wijzigingen werken voorlopig alleen in dit tabblad.');
        }else{
          setPinnedNavIds(value);
          setPinStorageState('persistent');
        }
      }catch{
        setPinStorageState('temporary');
        setPinMessage('Deze browser staat voorkeurenopslag niet toe; '+
          'vastgezette onderdelen blijven alleen in dit tabblad.');
      }
    }
    function onStorage(event:StorageEvent){
      if(event.storageArea===window.localStorage &&
        (event.key===NAV_PINS_STORAGE_KEY||event.key===null))refresh();
    }
    refresh();
    window.addEventListener('storage',onStorage);
    return()=>window.removeEventListener('storage',onStorage);
  },[]);
  function toggleNavPin(id:string){
    if(!homepageDestinations.some(item=>item.id===id))return;
    const fallback=pinnedNavIds.includes(id)?
      pinnedNavIds.filter(item=>item!==id):[...pinnedNavIds,id];
    if(fallback.length>MAX_NAV_PINS){
      setPinMessage('Je kunt maximaal acht onderdelen vastzetten. Maak eerst ruimte.');
      return;
    }
    try{
      const raw=window.localStorage.getItem(NAV_PINS_STORAGE_KEY);
      const current=decodeNavPins(raw);
      if(current===null)throw Error('Unknown existing preference');
      const updated=current.includes(id)?current.filter(item=>item!==id):[...current,id];
      if(updated.length>MAX_NAV_PINS){
        setPinMessage('Maximaal acht vastgezette onderdelen; maak eerst ruimte.');
        setPinnedNavIds(current);
        return;
      }
      window.localStorage.setItem(NAV_PINS_STORAGE_KEY,JSON.stringify(updated));
      if(window.localStorage.getItem(NAV_PINS_STORAGE_KEY)!==JSON.stringify(updated))
        throw Error('Preference write unverified');
      setPinnedNavIds(updated);
      setPinStorageState('persistent');
      setPinMessage('Je vastgezette onderdeelnavigatie is alleen lokaal opgeslagen.');
    }catch{
      setPinnedNavIds(fallback);
      setPinStorageState('temporary');
      setPinMessage('Vastzetten werkt alleen tijdelijk in dit tabblad; '+
        'bestaande onbekende voorkeuren zijn niet overschreven.');
    }
  }
  function moveNavPin(id:string,offset:-1|1){
    if(!pinnedNavIds.includes(id))return;
    function reordered(ids:string[]){
      const current=ids.indexOf(id);
      const target=current+offset;
      if(current<0||target<0||target>=ids.length)return ids;
      const copy=[...ids];
      [copy[current],copy[target]]=[copy[target],copy[current]];
      return copy;
    }
    const fallback=reordered(pinnedNavIds);
    try{
      const stored=decodeNavPins(window.localStorage.getItem(NAV_PINS_STORAGE_KEY));
      if(stored===null)throw Error('unknown saved pins');
      const next=reordered(stored);
      const raw=JSON.stringify(next);
      window.localStorage.setItem(NAV_PINS_STORAGE_KEY,raw);
      if(window.localStorage.getItem(NAV_PINS_STORAGE_KEY)!==raw)
        throw Error('unverified preference write');
      setPinnedNavIds(next);
      setPinStorageState('persistent');
      setPinMessage('Volgorde van je favorieten lokaal bijgewerkt.');
    }catch{
      setPinnedNavIds(fallback);
      setPinStorageState('temporary');
      setPinMessage('Nieuwe volgorde werkt alleen in dit tabblad; onbekende voorkeuren zijn niet overschreven.');
    }
  }
  function previewNavPinsBackup(){
    const bytes=JSON.stringify({
      format:'woonpoints-favorites',version:1,pins:pinnedNavIds
    },null,2);
    setPinBackupPreview({bytes,source:JSON.stringify(pinnedNavIds)});
    setPinMessage('Controleer de volledige inhoud voordat je de favorietenback-up opslaat.');
  }
  function downloadNavPinsBackup(){
    if(!pinBackupPreview||pinBackupPreview.source!==JSON.stringify(pinnedNavIds)){
      setPinBackupPreview(null);
      setPinMessage('De bron is gewijzigd. Bekijk de actuele back-up opnieuw.');
      return;
    }
    const blob=new Blob([pinBackupPreview.bytes],{type:'application/json;charset=utf-8'});
    const href=URL.createObjectURL(blob);
    const anchor=document.createElement('a');
    anchor.href=href;
    anchor.download='woonpoints-favorieten.json';
    document.body.appendChild(anchor);
    try{anchor.click();}finally{
      anchor.remove();
      window.setTimeout(()=>URL.revokeObjectURL(href),1000);
    }
    setPinBackupPreview(null);
    setPinMessage('Eigen favorietenbestand aangeboden; bepaal zelf waar je het opslaat.');
  }
  async function readNavPinsFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    event.target.value='';
    setPinImportPreview(null);
    if(!file)return;
    if(file.size>1400){
      setPinMessage('Bestand te groot: maximaal 1400 bytes voor acht vaste onderdeelcodes.');
      return;
    }
    try{
      const raw=await file.text();
      const pins=readNavPinsBackup(raw);
      if(pins===null){
        setPinMessage('Ongeldig favorietenbestand: bestaand overzicht blijft intact.');
        return;
      }
      setPinImportPreview({pins,source:JSON.stringify(pinnedNavIds)});
      setPinMessage('Bestand gelezen. Bekijk het bronoverzicht en bevestig apart vóór vervangen.');
    }catch{
      setPinMessage('Bestand niet leesbaar: er is niets vervangen.');
    }
  }
  function applyNavPinsBackup(){
    const pending=pinImportPreview;
    if(!pending)return;
    setPinImportPreview(null);
    if(pending.source!==JSON.stringify(pinnedNavIds)){
      setPinMessage('Favorieten zijn ondertussen veranderd. Kies je bestand opnieuw.');
      return;
    }
    const next=JSON.stringify(pending.pins);
    try{
      const current=decodeNavPins(window.localStorage.getItem(NAV_PINS_STORAGE_KEY));
      if(current===null||JSON.stringify(current)!==pending.source)
        throw Error('unknown or changed stored pins');
      window.localStorage.setItem(NAV_PINS_STORAGE_KEY,next);
      if(window.localStorage.getItem(NAV_PINS_STORAGE_KEY)!==next)
        throw Error('unverified write');
      setPinnedNavIds(pending.pins);
      setPinStorageState('persistent');
      setPinMessage('Alleen je vaste onderdeelcodes zijn na toestemming hersteld in deze browser.');
    }catch{
      // Never replace unknown concurrent storage; explicit user acceptance
      // can still use the in-memory list in this tab.
      setPinnedNavIds(pending.pins);
      setPinStorageState('temporary');
      setPinMessage('Back-up alleen in dit tabblad geopend; eerdere of onbekende browseropslag niet overschreven.');
    }
  }
  function clearNavPins(){
    try{
      window.localStorage.removeItem(NAV_PINS_STORAGE_KEY);
      setPinStorageState('persistent');
      setPinMessage('Alleen je eigen lokaal vastgezette navigatie is gewist.');
    }catch{
      setPinStorageState('temporary');
      setPinMessage('Vastgezette navigatie alleen in dit tabblad gewist; '+
        'eventueel eerder opgeslagen voorkeuren konden niet worden verwijderd.');
    }
    setPinnedNavIds([]);
  }
  const [contactIntent,setContactIntent]=useState<{
    utility:PrivateUtilityKey; revision:number
  }|null>(null);
  function startUtilityContact(utility:PrivateUtilityKey) {
    setContactIntent(previous=>({utility,revision:(previous?.revision??0)+1}));
    window.setTimeout(()=>document.getElementById('private-utility-contacts-heading')
      ?.scrollIntoView({behavior:'smooth',block:'start'}),0);
  }
  const [navigationSearch,setNavigationSearch]=useState('');
  const [navHighlighted,setNavHighlighted]=useState(0);
  const searchTerm=normalizeNavQuery(navigationSearch);
  const navigationResults=homepageDestinations.filter(destination=>{
    if(searchTerm)return [destination.title,...(homeNavAliases[destination.id]??[])]
      .some(value=>normalizeNavQuery(value).includes(searchTerm));
    if(navigationCategory==='favorieten')return pinnedNavIds.includes(destination.id);
    if(navigationCategory==='recent')return recentNavIds.includes(destination.id);
    return navigationCategory==='alles'||(navigationCategory==='snel'?
      destination.category==='essentieel'||pinnedNavIds.includes(destination.id):
      destination.category===navigationCategory);
  }).sort((a,b)=>{
    if(!searchTerm&&navigationCategory==='recent')
      return recentNavIds.indexOf(a.id)-recentNavIds.indexOf(b.id);
    if(!searchTerm&&navigationCategory==='favorieten')
      return pinnedNavIds.indexOf(a.id)-pinnedNavIds.indexOf(b.id);
    return Number(pinnedNavIds.includes(b.id))-Number(pinnedNavIds.includes(a.id));
  });
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
          <strong>Vind je onderdeel</strong>
          <span>Handmatige hulpmiddelen · zonder live accountverbinding</span>
        </div>
        <label htmlFor="woonpoints-nav-search"
          style={{display:'block',margin:'12px 0 5px',fontWeight:700}}>
          Zoek een onderdeel
        </label>
        <p id="woonpoints-nav-help">Ctrl+K (Mac: ⌘K) opent de zoekbalk.
          Gebruik ↑ en ↓ om resultaten te kiezen, Enter om direct naar het gekozen
          onderdeel te springen en Escape om het zoeken te sluiten.
          Zoek bijvoorbeeld op dozen, bonnetjes of gebreken.</p>
        <input id="woonpoints-nav-search" ref={navSearchRef} type="search" value={navigationSearch}
          aria-describedby="woonpoints-nav-help"
          onKeyDown={event=>{
            if(event.key==='Escape'){
              setNavigationSearch('');setNavHighlighted(0);event.currentTarget.blur();
            }else if(event.key==='ArrowDown'||event.key==='ArrowUp'){
              if(navigationResults.length===0)return;
              event.preventDefault();
              const step=event.key==='ArrowDown'?1:-1;
              setNavHighlighted(previous=>
                (previous+step+navigationResults.length)%navigationResults.length);
            }else if(event.key==='Enter'&&navigationResults.length>0){
              event.preventDefault();
              const found=navigationResults[Math.min(navHighlighted,navigationResults.length-1)];
              if(!homepageDestinations.some(item=>item.id===found.id))return;
              recordNavigation(found.id);
              window.location.hash=found.id;
              event.currentTarget.blur();
              setNavHighlighted(0);
            }
          }}
          onChange={event=>{setNavigationSearch(event.target.value);setNavHighlighted(0);}}
          maxLength={60} autoComplete="off"
          placeholder="Bijv. paklijst, maandrapport of nazorg"
          style={{display:'block',width:'100%',maxWidth:480,minHeight:44,
            border:'2px solid #536d5a',borderRadius:9,padding:10}}/>
        <div role="group" aria-label="Woonpoints-categorieën"
          style={{display:'flex',flexWrap:'wrap',gap:8,margin:'12px 0'}}>
          {homeCategoryOptions.map(category=><button type="button" key={category.id}
            aria-pressed={!searchTerm&&navigationCategory===category.id}
            onClick={()=>{setNavigationCategory(category.id);setNavigationSearch('');setNavHighlighted(0);}}
            style={{minHeight:44,minWidth:74,padding:'8px 12px',borderRadius:9,
              border:'1px solid #355e42',cursor:'pointer',
              background:!searchTerm&&navigationCategory===category.id?'#355e42':'white',
              color:!searchTerm&&navigationCategory===category.id?'white':'#355e42'}}>
            {category.label}
          </button>)}
        </div>
        <p role="status" aria-live="polite">{navigationResults.length} van
          {' '}{homepageDestinations.length} onderdelen zichtbaar{searchTerm?' · alle categorieën doorzocht':''}.
          {searchTerm&&navigationResults.length>0&&
            ' Toetsenbordselectie '+(Math.min(navHighlighted,navigationResults.length-1)+1)+
            ' van '+navigationResults.length+': '+
            navigationResults[Math.min(navHighlighted,navigationResults.length-1)].title+'.'}
        </p>
        {navigationResults.length===0?
          <p>{navigationCategory==='favorieten'&&!searchTerm
            ?'Nog niets vastgezet. Open Alles en kies ☆ Vastzetten bij je favoriete onderdelen.'
            :navigationCategory==='recent'&&!searchTerm
              ?'Nog geen onderdelen geopend. Kies een onderdeel om het hier tijdelijk terug te vinden.'
              :'Geen onderdeel gevonden. Wis je zoektekst of kies Alles.'}</p>:
          <ul className="quick-nav-links">{navigationResults.map((item,index)=><li key={item.id}
            style={searchTerm&&index===Math.min(navHighlighted,navigationResults.length-1)?
              {outline:'2px solid #355e42',outlineOffset:3,borderRadius:6}:undefined}>
            <a href={'#'+item.id} onClick={()=>recordNavigation(item.id)}>{item.title}</a>
            <button type="button" aria-pressed={pinnedNavIds.includes(item.id)}
              aria-label={(pinnedNavIds.includes(item.id)?'Verwijder ':'Zet vast: ')+item.title}
              onClick={()=>toggleNavPin(item.id)}
              style={{minHeight:40,marginLeft:10,padding:'7px 10px',
                border:'1px solid #355e42',borderRadius:9,
                background:pinnedNavIds.includes(item.id)?'#edf2ee':'white',
                color:'#355e42',cursor:'pointer'}}>
              {pinnedNavIds.includes(item.id)?'★ Vastgezet':'☆ Vastzetten'}
            </button>
            {navigationCategory==='favorieten'&&!searchTerm&&pinnedNavIds.includes(item.id)&&
              <span style={{display:'inline-flex',gap:4,marginLeft:6}}>
                <button type="button" className="secondary"
                  aria-label={'Zet '+item.title+' hoger in favorieten'}
                  disabled={pinnedNavIds.indexOf(item.id)===0}
                  onClick={()=>moveNavPin(item.id,-1)}>↑</button>
                <button type="button" className="secondary"
                  aria-label={'Zet '+item.title+' lager in favorieten'}
                  disabled={pinnedNavIds.indexOf(item.id)===pinnedNavIds.length-1}
                  onClick={()=>moveNavPin(item.id,1)}>↓</button>
              </span>}
          </li>)}</ul>}
        {!searchTerm&&navigationCategory!=='alles'&&<button type="button"
          onClick={()=>setNavigationCategory('alles')}
          style={{minHeight:44,marginTop:12,padding:'8px 14px',
            color:'#355e42',background:'white',border:'1px solid #355e42',borderRadius:9}}>
          Toon alle {homepageDestinations.length} onderdelen
        </button>}
        <p><strong>{pinnedNavIds.length} van {MAX_NAV_PINS} favorieten</strong> ingesteld.
          In ★ Vastgezet kun je de volgorde met ↑ en ↓ aanpassen; ze verschijnen ook bij Snelstart.</p>
        {pinnedNavIds.length>0&&<button type="button" className="secondary"
          onClick={clearNavPins}>Wis mijn vastgezette onderdelen</button>}
        {recentNavIds.length>0&&<p>{recentNavIds.length} laatst geopende onderdelen
          zijn in dit tabblad bereikbaar via ↗ Recent.
          {' '}<button type="button" className="secondary"
            onClick={()=>setRecentNavIds([])}>Wis recente navigatie</button></p>}
        <details style={{marginTop:12}}>
          <summary>Bewaar of herstel mijn favoriete onderdelen</summary>
          <p>Alleen de codes van maximaal acht vastgezette onderdelen worden
            opgeslagen. Geen privénotities, adressen of WoningNet-gegevens.
            Zelf gekozen opslag kan extern synchroniseren.</p>
          <button type="button" className="secondary" onClick={previewNavPinsBackup}>
            Bekijk volledige favorietenback-up
          </button>
          {pinBackupPreview&&<div>
            <p>{pinBackupPreview.source===JSON.stringify(pinnedNavIds)
              ?'Dit is de volledige exacte bestandsinhoud. Controleer vóór opslaan.'
              :'Je favorieten zijn gewijzigd; maak eerst een nieuwe preview.'}</p>
            <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:200,overflow:'auto'}}>
              {pinBackupPreview.bytes}</pre>
            <button type="button" disabled={pinBackupPreview.source!==JSON.stringify(pinnedNavIds)}
              onClick={downloadNavPinsBackup}>Ik wil dit gecontroleerde JSON-bestand downloaden</button>
          </div>}
          <label htmlFor="woonpoints-pin-backup-file" style={{display:'block',marginTop:16}}>
            Kies mijn eerder bewaarde favorietenbestand (maximaal 1400 bytes)
          </label>
          <input id="woonpoints-pin-backup-file" type="file" accept=".json,application/json"
            onChange={readNavPinsFile}/>
          {pinImportPreview&&<div>
            <p><strong>{pinImportPreview.pins.length} onderdelen</strong> in het bestand.
              Deze vervangen uitsluitend je huidige vastgezette favorieten na jouw bevestiging.</p>
            <ol>{pinImportPreview.pins.map(id=><li key={id}>
              {homepageDestinations.find(item=>item.id===id)?.title}</li>)}</ol>
            <button type="button" className="secondary" onClick={()=>setPinImportPreview(null)}>
              Behoud huidige favorieten</button>
            <button type="button" disabled={pinImportPreview.source!==JSON.stringify(pinnedNavIds)}
              onClick={applyNavPinsBackup}>Vervang mijn favorieten door deze gecontroleerde codes</button>
          </div>}
        </details>
        <p role="status" aria-live="polite">{pinMessage}</p>
        <p>Vastzetten bewaart uitsluitend vooraf bekende onderdeelcodes op dit apparaat,
          nooit je zoekwoorden, adressen, notities of accountgegevens. Opslagstatus:
          {' '}{pinStorageState==='persistent'?'alleen deze browser':
            pinStorageState==='temporary'?'alleen dit tabblad':'nog onbekend'}.
          Toetsenbordsprongen gebruiken alleen bestaande schermankers. Recente navigatie blijft uitsluitend in het geheugen van dit tabblad
          en verdwijnt bij herladen. Navigeren en zoeken verstuurt niets naar een server.</p>
      </nav>

      <PrivateMovingReadinessBoard rows={movingReadinessRows}
        snapshots={movingBundleSnapshots}/>
      <PrivateHousingJourney onPulse={setJourneyPulse}
        onBundleSnapshot={setMovingBundleSnapshots} />

      <section className="status-section" aria-labelledby="projectstatus-heading">
        <h2 id="projectstatus-heading" className="sr-only">Projectstatus</h2>
        <p>Actuele persoonlijke <strong>niet-geverifieerde</strong> notities uit je
          maandteller, dagboek en zoekpuntenhistorie. Er vindt geen automatische
          WoningNet- of accountcontrole plaats.</p>
        {personalOverview?.month&&<p>Eigen overzicht voor <strong>{
          personalOverview.month}</strong>. Zoeken, reageren of puntentoekenning
          via het woningportaal gebeurt niet vanuit deze kaarten.</p>}
        <div className="grid">
          {cards.map(([label, value, detail]) => (
            <article className="card" key={label}>
              <h3>{label}</h3>
              <strong>{value}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        {personalOverview?.countsDisagree&&<p role="status">
          Je zelf genoteerde maandteller en reactiedagboek verschillen.
          <a href="#private-month-pulse-heading"> Bekijk de twee eigen bronnen</a>
          {' '}en controleer echte reacties zelf bij de aanbieder.</p>}
        <p><a href="#private-month-pulse-heading">Bekijk mijn maandrapport en bronstatus</a>
          {' · '}<a href="#reaction-journal-title">Mijn eigen reactiedagboek</a>
          {' · '}<a href="#private-points-heading">Mijn puntennotities</a></p>
      </section>

      <PrivateReactionWorkflow onOverview={setPersonalOverview}>
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
      <PrivateMovingFallbackPlan onPulse={setFallbackPulse}
        onBundleSnapshot={setMovingBundleSnapshots} />
      <PrivateMovingHelperRoster />
      <PrivateAddressChangePlanner />
      <PrivateMovingHandover />
      <PrivateMeterHandover onPulse={setMetersPulse}
        onBundleSnapshot={setMovingBundleSnapshots} />
      <PrivateUtilityTransfer onLogContact={startUtilityContact}
        onPulse={setUtilitiesPulse} onBundleSnapshot={setMovingBundleSnapshots} />
      <PrivateUtilityContactLog intent={contactIntent} />
      <PrivateMoveDocumentReadiness />
      <PrivateMovingQuoteComparison />
      <PrivateMovingExpenseLedger />
      <PrivateMovingCostSplit />
      <PrivateDepositLedger />
      <PrivateMoveAftercare />

      <section className="panel" aria-labelledby="nazorg-link-heading">
        <div>
          <p className="eyebrow">NA DE VERHUIZING</p>
          <h2 id="nazorg-link-heading">Gebreken en open punten bijhouden</h2>
        </div>
        <div>
          <p>Doe eerst de begeleide startinspectie (22 controles), markeer zelf wat aandacht vraagt en zet alleen na bevestiging nieuwe punten in je privé-nazorgdossier. Beheer vervolgens deadlines, contactmomenten en optionele exports. Niets wordt naar een verhuurder of woningportaal verstuurd.</p>
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
type ContactKind = 'eigen-notitie' | 'zelf-verstuurd' | 'reactie-genoteerd' | 'afspraak';
type FollowUp = { id: string; issueId: string; kind: ContactKind; day: string; detail: string };
type AftercareBackup = { items: Item[]; history: FollowUp[] };
const CONTACT_TYPES: { id: ContactKind; title: string }[] = [
  { id: 'eigen-notitie', title: 'Eigen voortgangsnotitie' },
  { id: 'zelf-verstuurd', title: 'Ik heb zelf contact opgenomen' },
  { id: 'reactie-genoteerd', title: 'Reactie door mij genoteerd' },
  { id: 'afspraak', title: 'Afspraak volgens mijn eigen notitie' }
];

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
const validFollowUp = (v: unknown): v is FollowUp => {
  if (!isRecord(v) || !exactKeys(v, ['id', 'issueId', 'kind', 'day', 'detail'])) return false;
  return typeof v.id === 'string' && /^log-[0-9a-f-]{36}$/.test(v.id) &&
    typeof v.issueId === 'string' && /^item-[0-9a-f-]{36}$/.test(v.issueId) &&
    CONTACT_TYPES.some(type => type.id === v.kind) &&
    typeof v.day === 'string' && validDate(v.day) &&
    validText(v.detail, 1, 240);
};
const readBackup = (text: string): AftercareBackup => {
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw Error('Bestand groter dan 16 KiB.');
  const data: unknown = JSON.parse(text);
  if (!isRecord(data) || data.kind !== KIND || !Array.isArray(data.items) ||
      data.items.length > LIMIT || !data.items.every(validItem) ||
      (data.schema !== 1 && data.schema !== 2)) {
    throw Error('Dit is geen ondersteund en geldig Woonpoints-nazorgbestand.');
  }
  const ids = data.items.map(item => (item as Item).id);
  if (new Set(ids).size !== ids.length) throw Error('Dit bestand bevat dubbele punten.');
  if (data.schema === 1) {
    if (!exactKeys(data, ['kind', 'schema', 'items'])) throw Error('Onbekende velden in oud nazorgbestand.');
    return { items: data.items as Item[], history: [] };
  }
  if (!exactKeys(data, ['kind', 'schema', 'items', 'history']) ||
      !Array.isArray(data.history) || data.history.length > 160 ||
      !data.history.every(validFollowUp)) {
    throw Error('Ongeldige contacthistorie of onbekende velden in nazorgbestand.');
  }
  const events = data.history as FollowUp[];
  const allowed = new Set(ids);
  const eventIds = new Set<string>();
  const counts = new Map<string, number>();
  for (const event of events) {
    if (!allowed.has(event.issueId) || eventIds.has(event.id)) {
      throw Error('Contactmoment verwijst naar onbekend punt of is dubbel.');
    }
    eventIds.add(event.id);
    counts.set(event.issueId, (counts.get(event.issueId) || 0) + 1);
    if ((counts.get(event.issueId) || 0) > 8) throw Error('Te veel contactmomenten bij één punt.');
  }
  return { items: data.items as Item[], history: events };
};


// Combine only independently validated local backups. Identical IDs with
// changed content are conflicts, never silently edited or renamed. Reuse the
// exact 16KiB v2 import contract before exposing any merged state.
type PrivateConflictChoice = 'keep' | 'incoming';
type PrivateAftercareConflict = {
  key: string; kind: 'punt' | 'contactmoment'; label: string;
  existingDetails: string; incomingDetails: string; choice: PrivateConflictChoice | null;
};

// Reconcile only validated operator-controlled private backup records. Every
// colliding changed ID must receive its own choice; there is deliberately NO
// default that discards or overwrites hidden notes or locally marked statuses.
function planPrivateAftercareMerge(
  current: AftercareBackup, additional: AftercareBackup,
  choices: Record<string, PrivateConflictChoice> = {}
): {
  ready: boolean; reason: string; items: Item[]; history: FollowUp[];
  newPoints: number; newContacts: number; skippedPoints: number;
  skippedContacts: number; conflictingPoints: number; conflictingContacts: number;
  updatedPoints: number; updatedContacts: number; unresolved: number;
  conflicts: PrivateAftercareConflict[];
} {
  const existingPoints = new Map(current.items.map(item => [item.id, item]));
  const existingContacts = new Map(current.history.map(event => [event.id, event]));
  const pointFields = (row: Item) => JSON.stringify([
    row.id, row.title, row.room, row.priority, row.status, row.due, row.note, row.created
  ]);
  const contactFields = (row: FollowUp) => JSON.stringify([
    row.id, row.issueId, row.kind, row.day, row.detail
  ]);
  let skippedPoints = 0;
  let skippedContacts = 0;
  let conflictingPoints = 0;
  let conflictingContacts = 0;
  let updatedPoints = 0;
  let updatedContacts = 0;
  let unresolved = 0;
  const conflicts: PrivateAftercareConflict[] = [];
  const additions: Item[] = [];
  const moreContacts: FollowUp[] = [];
  const pointUpdates = new Map<string, Item>();
  const contactUpdates = new Map<string, FollowUp>();
  for (const row of additional.items) {
    const existing = existingPoints.get(row.id);
    if (!existing) { additions.push({ ...row }); continue; }
    if (pointFields(existing) === pointFields(row)) { skippedPoints++; continue; }
    conflictingPoints++;
    const key = 'point:' + row.id;
    const choice = choices[key] === 'keep' || choices[key] === 'incoming' ? choices[key] : null;
    conflicts.push({
      key, kind: 'punt',
      label: reportLine(existing.room + ' — ' + existing.title),
      existingDetails: JSON.stringify(existing, null, 2),
      incomingDetails: JSON.stringify(row, null, 2), choice
    });
    if (choice === 'incoming') { pointUpdates.set(row.id, { ...row }); updatedPoints++; }
    else if (choice !== 'keep') unresolved++;
  }
  for (const row of additional.history) {
    const existing = existingContacts.get(row.id);
    if (!existing) { moreContacts.push({ ...row }); continue; }
    if (contactFields(existing) === contactFields(row)) { skippedContacts++; continue; }
    conflictingContacts++;
    const key = 'contact:' + row.id;
    const choice = choices[key] === 'keep' || choices[key] === 'incoming' ? choices[key] : null;
    const point = existingPoints.get(existing.issueId);
    conflicts.push({
      key, kind: 'contactmoment',
      label: reportLine(existing.day + ' · ' + existing.kind + ' · ' + (point?.title || 'Eigen nazorgpunt')),
      existingDetails: JSON.stringify(existing, null, 2),
      incomingDetails: JSON.stringify(row, null, 2), choice
    });
    if (choice === 'incoming') { contactUpdates.set(row.id, { ...row }); updatedContacts++; }
    else if (choice !== 'keep') unresolved++;
  }
  const merged = {
    items: [...current.items.map(row => ({...(pointUpdates.get(row.id) || row)})), ...additions],
    history: [...current.history.map(row => ({...(contactUpdates.get(row.id) || row)})), ...moreContacts]
  };
  const base = {
    ...merged, newPoints: additions.length, newContacts: moreContacts.length,
    skippedPoints, skippedContacts, conflictingPoints, conflictingContacts,
    updatedPoints, updatedContacts, unresolved, conflicts
  };
  const fail = (reason: string) => ({...base, ready: false, reason});
  if (unresolved > 0) {
    return fail('Kies bij elk afwijkend ID bewust behouden of vervangen. Zonder volledige menselijke keuze gebeurt niets.');
  }
  if (!additions.length && !moreContacts.length && !updatedPoints && !updatedContacts) {
    return fail('Er zijn geen nieuwe of gekozen gewijzigde records om toe te voegen.');
  }
  if (merged.items.length > LIMIT || merged.history.length > 160) {
    return fail('Te veel gezamenlijke punten of contactmomenten voor het bestaande privé-dossier.');
  }
  const payload = JSON.stringify({kind: KIND, schema: 2, ...merged}, null, 2);
  if (new TextEncoder().encode(payload).length > MAX_BYTES) {
    return fail('Samenvoegen zou de bestaande veilige 16 KiB JSON-back-uplimiet overschrijden.');
  }
  // The original unchanged v2 parser re-checks exact schema and keys,
  // unique IDs, contact->issue references and max 8 per issue.
  try { readBackup(payload); }
  catch { return fail('Samenvoegen zou ongeldige of te veel contactnotities opleveren.'); }
  return {...base, ready: true, reason: ''};
}

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
  // Check a normalized copy for concealed formula prefixes, but retain the
  // operator's exact printable text in the resulting literal CSV field.
  const normalized = plain.normalize('NFKC');
  const formulaLike = /^[\p{White_Space}\p{Cf}\p{Cc}\p{M}]*[=+@-]/u.test(normalized);
  const safe = formulaLike ? "'" + plain : plain;
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


// Only future, self-recorded personal appointment notes, not verified landlord appointments.
function calendarForOwnAppointments(appointments: { event: FollowUp; item: Item }[]): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'CALSCALE:GREGORIAN',
    'PRODID:-//Woonpoints//Private Self-Recorded Appointments//NL', 'METHOD:PUBLISH'
  ];
  for (const { event, item } of appointments) {
    if (!validDate(event.day) || event.kind !== 'afspraak' || item.status === 'afgerond') continue;
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + event.id + '@woonpoints.local',
      'DTSTAMP:' + stamp,
      'DTSTART;VALUE=DATE:' + event.day.replace(/-/g, ''),
      'DTEND;VALUE=DATE:' + nextDay(event.day).replace(/-/g, ''),
      'SUMMARY:' + escapeIcs('Eigen afspraaknotitie: ' + item.title),
      'DESCRIPTION:' + escapeIcs('Dit is uitsluitend een door jou gemaakte persoonlijke afspraaknotitie bij ' + item.room + '. Niet door verhuurder of WoningNet bevestigd. Controleer de echte correspondentie.'),
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY',
      'DESCRIPTION:Controleer eigen afspraaknotitie', 'END:VALARM',
      'END:VEVENT'
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcs).join('\r\n') + '\r\n';
}

type InspectionGrade = 'goed' | 'aandacht';
type InspectionCheck = { id: string; room: string; title: string; tip: string; priority: Priority };
const INSPECTION_CHECKS: InspectionCheck[] = [
  { id: 'entry-lock', room: 'Entree', title: 'Deur en slot', tip: 'Controleer sluiting, sleutelwerking en zichtbare schade.', priority: 'dringend' },
  { id: 'entry-keys', room: 'Entree', title: 'Overgedragen sleutels', tip: 'Tel zelf de ontvangen sleutels, tags en afstandsbedieningen.', priority: 'normaal' },
  { id: 'entry-doorbell', room: 'Entree', title: 'Deurbel en intercom', tip: 'Controleer handmatig of de bediening werkt.', priority: 'normaal' },
  { id: 'entry-smoke', room: 'Entree', title: 'Rookmelders aanwezig', tip: 'Bekijk zichtbare aanwezigheid en raadpleeg de instructies voor controle.', priority: 'dringend' },
  { id: 'living-window', room: 'Woonkamer', title: 'Ramen en ventilatie', tip: 'Inspecteer openen, sluiten en zichtbaar vocht of tocht.', priority: 'normaal' },
  { id: 'living-walls', room: 'Woonkamer', title: 'Wanden, plafond en vloer', tip: 'Noteer zichtbare beschadigingen zonder de oorzaak te veronderstellen.', priority: 'normaal' },
  { id: 'living-power', room: 'Woonkamer', title: 'Verlichting en aansluitpunten', tip: 'Controleer alleen veilig bereikbare schakelaars; open geen elektra.', priority: 'dringend' },
  { id: 'living-heat', room: 'Woonkamer', title: 'Verwarming en bediening', tip: 'Bekijk of bediening reageert, zonder installaties te openen.', priority: 'normaal' },
  { id: 'kitchen-water', room: 'Keuken', title: 'Kraan en afvoer', tip: 'Kijk of water normaal loopt en er zichtbare lekkage is.', priority: 'dringend' },
  { id: 'kitchen-cabinets', room: 'Keuken', title: 'Kasten en laden', tip: 'Controleer fronten, scharnieren en losse onderdelen.', priority: 'normaal' },
  { id: 'kitchen-vent', room: 'Keuken', title: 'Ventilatie', tip: 'Controleer zichtbare roosters; demonteer geen apparaten.', priority: 'normaal' },
  { id: 'kitchen-appliances', room: 'Keuken', title: 'Meegeleverde apparatuur', tip: 'Noteer alleen apparaten die daadwerkelijk bij de woning horen.', priority: 'normaal' },
  { id: 'bath-shower', room: 'Badkamer', title: 'Douche en temperatuur', tip: 'Bekijk zichtbare werking en eventuele lekkage; vermijd heet water.', priority: 'dringend' },
  { id: 'bath-drain', room: 'Badkamer', title: 'Afvoer en voegen', tip: 'Inspecteer afvoer, voegen en zichtbaar vocht.', priority: 'normaal' },
  { id: 'bath-toilet', room: 'Badkamer', title: 'Toilet en doorspoelen', tip: 'Controleer doorspoelen en zichtbare lekkage.', priority: 'dringend' },
  { id: 'bath-fan', room: 'Badkamer', title: 'Ventilatievoorziening', tip: 'Controleer zichtbare roosters of ventilatorbediening.', priority: 'normaal' },
  { id: 'sleep-window', room: 'Slaapkamer', title: 'Raam, glas en tocht', tip: 'Controleer zichtbare schade en of het raam sluit.', priority: 'normaal' },
  { id: 'sleep-finish', room: 'Slaapkamer', title: 'Wanden en vloer', tip: 'Noteer eventuele bestaande beschadigingen.', priority: 'normaal' },
  { id: 'utility-meters', room: 'Installaties', title: 'Meterstanden zelf vastgelegd', tip: 'Vergelijk met je eigen sleuteloverdrachtsnotities; geen automatische meteropname.', priority: 'normaal' },
  { id: 'utility-heat', room: 'Installaties', title: 'Cv/verwarmingsinformatie', tip: 'Noteer ontbrekende instructies; raak geen gasinstallaties of bedrading aan.', priority: 'dringend' },
  { id: 'utility-moist', room: 'Installaties', title: 'Vocht en zichtbare lekkage', tip: 'Inspecteer visueel; vermoedelijke gevaarlijke schade vereist professionele hulp.', priority: 'dringend' },
  { id: 'utility-safety', room: 'Installaties', title: 'Veilige toegang en vluchtroute', tip: 'Controleer visueel of deuren en doorgangen bereikbaar zijn.', priority: 'dringend' }
];
const INSPECTION_ROOMS = ['Entree', 'Woonkamer', 'Keuken', 'Badkamer', 'Slaapkamer', 'Installaties'] as const;


type PrivateCustomInspectionCheck = {
  id: string;
  room: string;
  title: string;
  priority: Priority;
};
type InspectionBackup = {
  grades: Record<string, InspectionGrade | undefined>;
  notes: Record<string, string>;
  custom: PrivateCustomInspectionCheck[];
  count: number;
};
const INSPECTION_BACKUP_KIND = 'woonpoints-private-startinspectie';
const INSPECTION_BACKUP_BYTES = 16 * 1024;
const MAX_CUSTOM_INSPECTION_CHECKS = 12;
const INSPECTION_ALL_ROOMS = [...INSPECTION_ROOMS, 'Overig'] as const;

/** Offline report with an inert HTML/CSP envelope: escape all personal values, never fetch anything. */
function printableInspectionHtml(
  checks: InspectionCheck[], grades: Record<string, InspectionGrade | undefined>,
  notes: Record<string, string>, includeNotes: boolean
): string {
  const safe = (s: string) => s.replace(/[&<>"']/g, ch =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch] || ch));
  const count = checks.filter(c => grades[c.id] === 'aandacht' || grades[c.id] === 'goed').length;
  const flagged = checks.filter(c => grades[c.id] === 'aandacht').length;
  const rooms = INSPECTION_ALL_ROOMS.map(room => {
    const records = checks.filter(c => c.room === room);
    if (!records.length) return '';
    return '<section><h2>' + safe(room) + '</h2><table><thead><tr><th>Mijn controlepunt</th><th>Eigen oordeel</th><th>Prioriteit</th></tr></thead><tbody>' +
      records.map(c => {
        const grade = grades[c.id];
        const status = grade === 'goed' ? 'Volgens mij in orde' : grade === 'aandacht' ? 'Mijn aandachtspunt' : 'Niet gecontroleerd';
        const privateText = includeNotes && grade === 'aandacht' && notes[c.id]?.trim()
          ? '<p class="note">Eigen toelichting: ' + safe(notes[c.id].trim()) + '</p>' : '';
        return '<tr><th scope="row">' + safe(c.title) + (c.id.startsWith('custom-') ? ' (eigen punt)' : '') +
          privateText + '</th><td>' + status + '</td><td>' + safe(c.priority) + '</td></tr>';
      }).join('') + '</tbody></table></section>';
  }).join('\n');
  return [
    '<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">',
    '<title>Mijn startinspectie · Woonpoints</title>',
    '<style>@page{size:A4;margin:15mm}body{font:12pt/1.45 Arial,sans-serif;max-width:950px;margin:24px auto;padding:12px;color:#172f1e}h2{font-size:16pt;margin-top:24px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10pt}th,td{border:1px solid #92a699;padding:9px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th:first-child{width:54%}.note{font-weight:normal;white-space:pre-wrap}.warning{border:2px solid #687d6f;padding:12px}tr{break-inside:avoid}@media print{body{margin:0;padding:0}h2{break-after:avoid}}</style></head><body>',
    '<h1>Mijn eigen startinspectie</h1><p>Samengesteld op ' + safe(today()) + '</p>',
    '<p>' + count + ' van ' + checks.length + ' zelf beoordeeld · ' + flagged + ' aandachtspunten · ' + (checks.length - count) + ' niet gecontroleerd.</p>',
    '<p class="warning">Eigen checklist. Geen officiële keuring, juridisch oordeel, verzendbewijs of bevestiging door een verhuurder. Volg bij onveiligheid de officiële nood- of storingsroute.</p>',
    rooms, '<footer><p>Privétoelichtingen ' + (includeNotes ? 'bewust opgenomen' : 'niet opgenomen') + '. Dit bestand is uitsluitend op eigen verzoek lokaal samengesteld.</p></footer>',
    '</body></html>'
  ].join('\n');
}

function inspectionBackupContents(
  grades: Record<string, InspectionGrade | undefined>,
  notes: Record<string, string>,
  custom: PrivateCustomInspectionCheck[]
): string {
  const checks = [...INSPECTION_CHECKS, ...custom];
  const records = checks.flatMap(check => {
    const grade = grades[check.id];
    if (grade !== 'goed' && grade !== 'aandacht') return [];
    return [{ id: check.id, grade, note: grade === 'aandacht' ? (notes[check.id] || '').trim() : '' }];
  });
  return JSON.stringify({
    kind: INSPECTION_BACKUP_KIND, schema: 2,
    custom: custom.map(({id,room,title,priority}) => ({id,room,title,priority})),
    records
  }, null, 2);
}

/**
 * Admit only known built-in IDs and at most twelve explicitly user-created checks.
 * Legacy schema 1 from #145 remains accepted, with no custom check definitions.
 * No network, persisted IDs of people or legacy browser migration side effects.
 */
function parseInspectionBackup(source: string): InspectionBackup {
  if (new TextEncoder().encode(source).length > INSPECTION_BACKUP_BYTES)
    throw Error('Inspectiebestand is groter dan 16 KiB.');
  const data: unknown = JSON.parse(source);
  if (!isRecord(data) || data.kind !== INSPECTION_BACKUP_KIND ||
      (data.schema !== 1 && data.schema !== 2) ||
      !Array.isArray(data.records)) {
    throw Error('Ongeldig of niet ondersteund startinspectie-JSON-bestand.');
  }
  let custom: PrivateCustomInspectionCheck[] = [];
  if (data.schema === 1) {
    if (!exactKeys(data, ['kind', 'schema', 'records']))
      throw Error('Onbekende velden in oud inspectiebestand.');
  } else {
    if (!exactKeys(data, ['kind', 'schema', 'records', 'custom']) ||
        !Array.isArray(data.custom) || data.custom.length > MAX_CUSTOM_INSPECTION_CHECKS) {
      throw Error('Onbekende velden of te veel eigen inspectiepunten.');
    }
    const knownRoom = new Set<string>(INSPECTION_ALL_ROOMS);
    const customIds = new Set<string>();
    const roomTitles = new Set(INSPECTION_CHECKS.map(check =>
      check.room.toLocaleLowerCase('nl-NL') + '\u0000' + check.title.toLocaleLowerCase('nl-NL')));
    for (const row of data.custom) {
      if (!isRecord(row) || !exactKeys(row, ['id', 'room', 'title', 'priority']) ||
          typeof row.id !== 'string' ||
          !/^custom-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(row.id) ||
          customIds.has(row.id) ||
          typeof row.room !== 'string' || !knownRoom.has(row.room) ||
          typeof row.title !== 'string' || !validText(row.title, 1, 100) || row.title !== row.title.trim() ||
          !isPriority(row.priority)) {
        throw Error('Ongeldig of dubbel eigen inspectiepunt.');
      }
      const key = row.room.toLocaleLowerCase('nl-NL') + '\u0000' + row.title.toLocaleLowerCase('nl-NL');
      if (roomTitles.has(key)) throw Error('Twee inspectiepunten hebben dezelfde titel in dezelfde ruimte.');
      roomTitles.add(key);
      customIds.add(row.id);
      custom.push({ id: row.id, room: row.room, title: row.title, priority: row.priority });
    }
  }
  const known = new Set([...INSPECTION_CHECKS.map(check => check.id), ...custom.map(check => check.id)]);
  if (data.records.length > known.size) throw Error('Te veel beoordeelde inspectiepunten.');
  const used = new Set<string>();
  const grades: Record<string, InspectionGrade | undefined> = {};
  const notes: Record<string, string> = {};
  for (const record of data.records) {
    if (!isRecord(record) || !exactKeys(record, ['id', 'grade', 'note']) ||
        typeof record.id !== 'string' || !known.has(record.id) || used.has(record.id) ||
        (record.grade !== 'goed' && record.grade !== 'aandacht') ||
        !validText(record.note, 0, 300) ||
        (record.grade === 'goed' && record.note !== '')) {
      throw Error('Onbekend, ongeldig of dubbel inspectiepunt; niets vervangen.');
    }
    used.add(record.id);
    grades[record.id] = record.grade;
    if (record.grade === 'aandacht') notes[record.id] = (record.note as string).trim();
  }
  return { grades, notes, custom, count: used.size };
}


const COMPLETE_HANDOVER_KIND = 'woonpoints-private-complete-handover';
const COMPLETE_HANDOVER_MAX_BYTES = 40 * 1024;
type CompleteHandover = {
  inspection: InspectionBackup;
  aftercare: AftercareBackup;
};
function readCompleteHandover(source: string): CompleteHandover {
  if (new TextEncoder().encode(source).length > COMPLETE_HANDOVER_MAX_BYTES)
    throw Error('Complete overdracht is groter dan 40 KiB.');
  const data: unknown = JSON.parse(source);
  if (!isRecord(data) || !exactKeys(data, ['kind', 'schema', 'inspection', 'aftercare']) ||
      data.kind !== COMPLETE_HANDOVER_KIND || data.schema !== 1 ||
      !isRecord(data.inspection) || !isRecord(data.aftercare)) {
    throw Error('Dit is geen geldig compleet Woonpoints-overdrachtsbestand.');
  }
  // Both existing strict standalone importers remain the sole admission contract.
  // Do not mutate either module until the entire combined file is admitted.
  const inspection = parseInspectionBackup(JSON.stringify(data.inspection));
  const aftercare = readBackup(JSON.stringify(data.aftercare));
  return { inspection, aftercare };
}


/** Print the exact approved TXT snapshot instead of recomputing a potentially different report. */

type PrivateImportDelta = { action: 'toegevoegd'|'verwijderd'|'gewijzigd'; label: string };
type PrivateImportImpact = { added: number; removed: number; changed: number; details: PrivateImportDelta[] };
type PrivateImportRows = { id: string; label: string; snapshot: string }[];
function summarizePrivateImportChange(previous: PrivateImportRows, incoming: PrivateImportRows): PrivateImportImpact {
  const left = new Map(previous.map(row => [row.id, row]));
  const right = new Map(incoming.map(row => [row.id, row]));
  const details: PrivateImportDelta[] = [];
  for (const row of previous) {
    const next = right.get(row.id);
    if (!next) details.push({action:'verwijderd',label:row.label});
    else if (row.snapshot !== next.snapshot) details.push({action:'gewijzigd',label:next.label});
  }
  for (const row of incoming) {
    if (!left.has(row.id)) details.push({action:'toegevoegd',label:row.label});
  }
  return {
    added:details.filter(row => row.action === 'toegevoegd').length,
    removed:details.filter(row => row.action === 'verwijderd').length,
    changed:details.filter(row => row.action === 'gewijzigd').length,
    details
  };
}
/** Compare strict validated import data to the latest in-tab data, without exposing free-text notes. */
function compareCompleteHandover(current: CompleteHandover, incoming: CompleteHandover) {
  const inspectionRows = (data: InspectionBackup): PrivateImportRows =>
    [...INSPECTION_CHECKS, ...data.custom.map(c => ({...c, tip:''}))].map(check => {
      const grade = data.grades[check.id];
      return {
        id:check.id,
        label:check.room + ' — ' + check.title,
        snapshot:JSON.stringify({
          room:check.room, title:check.title, priority:check.priority, grade:grade || null,
          note:grade === 'aandacht' ? (data.notes[check.id] || '').trim() : ''
        })
      };
    });
  const itemRows = (data: AftercareBackup): PrivateImportRows =>
    data.items.map(item => ({
      id:item.id, label:item.room + ' — ' + item.title,
      // Compare semantic fields, never object-key serialization order.
      snapshot:JSON.stringify([item.title, item.room, item.priority, item.status,
        item.due, item.note, item.created])
    }));
  const contactRows = (data: AftercareBackup): PrivateImportRows => {
    const names = new Map(data.items.map(item => [item.id, item.room + ' — ' + item.title]));
    return data.history.map(item => ({
      id:item.id,
      label:item.day + ' · ' + (names.get(item.issueId) || 'Eigen nazorgpunt') + ' (' + item.kind + ')',
      snapshot:JSON.stringify([item.issueId, item.kind, item.day, item.detail])
    }));
  };
  return {
    inspection:summarizePrivateImportChange(inspectionRows(current.inspection),inspectionRows(incoming.inspection)),
    aftercare:summarizePrivateImportChange(itemRows(current.aftercare),itemRows(incoming.aftercare)),
    contacts:summarizePrivateImportChange(contactRows(current.aftercare),contactRows(incoming.aftercare))
  };
}

function completeHandoverPrintHtml(approvedText: string): string {
  const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char] || char));
  const lines = approvedText.replace(/\r/g, '').split('\n');
  const body = lines.map((line, index) => {
    const escaped = escapeHtml(line);
    if (!line.trim()) return '<div class="spacer" aria-hidden="true"></div>';
    if (index === 0) return '<h1>' + escaped + '</h1>';
    if (/^(STARTINSPECTIE:|NAZORG:)/.test(line)) return '<h2>' + escaped + '</h2>';
    if (INSPECTION_ALL_ROOMS.some(room => line === room.toUpperCase())) {
      return '<h3>' + escaped + '</h3>';
    }
    if (line.startsWith('- ')) return '<p class="inspection-row">' + escaped + '</p>';
    return '<p>' + escaped + '</p>';
  }).join('\n');
  return [
    '<!doctype html><html lang="nl"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">',
    '<title>Eigen complete overdracht · Woonpoints</title>',
    '<style>@page{size:A4;margin:16mm}body{font:11pt/1.5 Arial,Helvetica,sans-serif;color:#192d20;margin:22px auto;padding:0 15px;max-width:870px}',
    'h1{font-size:21pt}h2{font-size:16pt;margin:28px 0 11px;border-bottom:2px solid #647866;padding-bottom:5px;break-after:avoid}',
    'h3{font-size:12pt;margin:19px 0 6px;break-after:avoid}.inspection-row{padding-left:10px;border-left:2px solid #b4c7b7}',
    'p{white-space:pre-wrap;overflow-wrap:anywhere;margin:5px 0}.spacer{height:9px}',
    '.warning{border:2px solid #728674;padding:10px;margin-bottom:20px;break-inside:avoid}',
    '@media print{body{margin:0;padding:0}h1,h2,h3{break-after:avoid}}',
    '</style></head><body>',
    '<p class="warning"><strong>Persoonlijk overzicht.</strong> Alleen eigen invoer; geen officiële keuring, verzending of bevestiging. Controleer eventuele privégegevens vóór delen.</p>',
    '<main>' + body + '</main>',
    '<footer><p>Dit lokale afdrukbestand is op eigen verzoek gegenereerd. Niets automatisch verzonden of gesynchroniseerd.</p></footer>',
    '</body></html>'
  ].join('\n');
}

function PrivateArrivalInspection({
  items, onTransfer, grades, setGrades, notes, setNotes, customChecks, setCustomChecks
}: {
  items: Item[];
  onTransfer: (requests: Draft[]) => { added: number; skipped: number; error?: string };
  grades: Record<string, InspectionGrade | undefined>;
  setGrades: (value: Record<string, InspectionGrade | undefined> | ((previous: Record<string, InspectionGrade | undefined>) => Record<string, InspectionGrade | undefined>)) => void;
  notes: Record<string, string>;
  setNotes: (value: Record<string, string> | ((previous: Record<string, string>) => Record<string, string>)) => void;
  customChecks: PrivateCustomInspectionCheck[];
  setCustomChecks: (value: PrivateCustomInspectionCheck[] | ((previous: PrivateCustomInspectionCheck[]) => PrivateCustomInspectionCheck[])) => void;
}) {
  const [customTitle, setCustomTitle] = useState('');
  const [customRoom, setCustomRoom] = useState<string>('Overig');
  const [customPriority, setCustomPriority] = useState<Priority>('normaal');
  const [pendingCustomDelete, setPendingCustomDelete] = useState<string | null>(null);
  const [confirmTransfer, setConfirmTransfer] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [pendingRestore, setPendingRestore] = useState<InspectionBackup | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [printIncludeNotes, setPrintIncludeNotes] = useState(false);
  const [printPreview, setPrintPreview] = useState<{signature:string;includeNotes:boolean}|null>(null);
  const [inspectionView, setInspectionView] = useState<'all'|'pending'|'flagged'>('all');
  const allChecks: InspectionCheck[] = [...INSPECTION_CHECKS, ...customChecks.map(check => ({
    ...check, tip: 'Zelf toegevoegd controlepunt; dit is geen geverifieerde inspectie-eis.'
  }))];
  const checked = allChecks.filter(row => grades[row.id] !== undefined);
  const flagged = allChecks.filter(row => grades[row.id] === 'aandacht');
  const printSignature = JSON.stringify(allChecks.map(c => [
    c.id, c.room, c.title, c.priority, grades[c.id] || 'niet',
    grades[c.id] === 'aandacht' ? (notes[c.id] || '').trim() : ''
  ]));
  const printCurrent = printPreview !== null && printPreview.signature === printSignature &&
    printPreview.includeNotes === printIncludeNotes;
  const savePrintableInspection = () => {
    if (!printCurrent || (!checked.length && !customChecks.length)) {
      setFeedback('Bekijk eerst de actuele afdrukgegevens.'); return;
    }
    const html = printableInspectionHtml(allChecks, grades, notes, printIncludeNotes);
    if (new TextEncoder().encode(html).length > 80 * 1024) {
      setFeedback('Afdrukbestand te groot; verkort eigen toelichtingen.'); return;
    }
    download('woonpoints-eigen-startinspectie-afdruk.html', html, 'text/html;charset=utf-8');
    setPrintPreview(null);
    setFeedback('Privé-HTML gedownload. Open het lokaal om te printen of als PDF te bewaren. Niets verzonden.');
  };
  const alreadyIncluded = (row: InspectionCheck) => items.some(item =>
    item.room.toLocaleLowerCase('nl-NL') === row.room.toLocaleLowerCase('nl-NL') &&
    item.title.toLocaleLowerCase('nl-NL') === row.title.toLocaleLowerCase('nl-NL') &&
    item.status !== 'afgerond'
  );
  const newFlagged = flagged.filter(row => !alreadyIncluded(row));
  const saveInspectionBackup = () => {
    const source = inspectionBackupContents(grades, notes, customChecks);
    if (new TextEncoder().encode(source).length > INSPECTION_BACKUP_BYTES) {
      setFeedback('Inspectie-JSON overschrijdt 16 KiB. Verkort eigen toelichtingen.'); return;
    }
    download('woonpoints-eigen-startinspectie.json', source, 'application/json;charset=utf-8');
    setFeedback('Eigen inspectie-JSON gedownload. Een bestandsprovider kan deze privégegevens buiten de app bewaren.');
  };
  const importInspection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPendingRestore(null);
    setResetConfirm(false);
    if (!file) return;
    if (file.size > INSPECTION_BACKUP_BYTES) { setFeedback('Import geweigerd: maximaal 16 KiB.'); return; }
    try {
      const parsed = parseInspectionBackup(await file.text());
      setPendingRestore(parsed);
      setFeedback('Bestand gecontroleerd: ' + parsed.count + ' eigen beoordelingen. Bevestig vóór vervanging.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Inspectiebestand kan niet worden geopend.');
    }
  };
  const exportInspection = () => {
    if (!checked.length && !customChecks.length) { setFeedback('Markeer eerst minstens één eigen controle.'); return; }
    const lines = [
      'WOONPOINTS — eigen startinspectie', 'Alleen handmatig gecontroleerde items; niet door een verhuurder geverifieerd.',
      'Datum eigen overzicht: ' + today(), '', 'Niet gecontroleerd: ' + (allChecks.length - checked.length)
    ];
    for (const room of INSPECTION_ALL_ROOMS) {
      lines.push('', room.toUpperCase());
      for (const row of allChecks.filter(item => item.room === room)) {
        lines.push('- [' + (grades[row.id] === 'goed' ? 'NAAR EIGEN CONTROLE IN ORDE' :
          grades[row.id] === 'aandacht' ? 'AANDACHTSPUNT' : 'NIET GECONTROLEERD') + '] ' + row.title);
        if (grades[row.id] === 'aandacht' && notes[row.id]?.trim()) lines.push('  Mijn toelichting: ' + notes[row.id].trim());
      }
    }
    download('woonpoints-eigen-startinspectie.txt', lines.join('\n') + '\n', 'text/plain;charset=utf-8');
    setFeedback('Privé-inspectieoverzicht gedownload. De controle is niet officieel bevestigd.');
  };
  const addCustomCheck = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = customTitle.trim();
    if (!validText(title, 1, 100) ||
        !INSPECTION_ALL_ROOMS.includes(customRoom as typeof INSPECTION_ALL_ROOMS[number]) ||
        !isPriority(customPriority)) {
      setFeedback('Controleer eigen titel, ruimte en prioriteit.'); return;
    }
    if (customChecks.length >= MAX_CUSTOM_INSPECTION_CHECKS) {
      setFeedback('Maximaal 12 eigen inspectiepunten mogelijk.'); return;
    }
    if (allChecks.some(row => row.room.toLocaleLowerCase('nl-NL') === customRoom.toLocaleLowerCase('nl-NL') &&
        row.title.toLocaleLowerCase('nl-NL') === title.toLocaleLowerCase('nl-NL'))) {
      setFeedback('Dit controlepunt bestaat al in deze ruimte.'); return;
    }
    setCustomChecks(previous => [...previous, {
      id: 'custom-' + crypto.randomUUID(), room: customRoom, title, priority: customPriority
    }]);
    setCustomTitle('');
    setPendingRestore(null);
    setConfirmTransfer(false);
    setFeedback('Eigen controlepunt toegevoegd. Markeer na je eigen controle of het aandacht vraagt.');
  };
  const removeCustomCheck = (id: string) => {
    setCustomChecks(previous => previous.filter(row => row.id !== id));
    setGrades(previous => { const copy = { ...previous }; delete copy[id]; return copy; });
    setNotes(previous => { const copy = { ...previous }; delete copy[id]; return copy; });
    setPendingCustomDelete(null);
    setPendingRestore(null);
    setConfirmTransfer(false);
    setFeedback('Eigen controlepunt uit deze tijdelijke inspectie verwijderd. Bestaande nazorg blijft bestaan.');
  };
  const transfer = () => {
    const requests: Draft[] = newFlagged.map(row => ({
      title: row.title,
      room: row.room,
      priority: row.priority,
      due: '',
      note: (notes[row.id] || '').trim()
    }));
    const result = onTransfer(requests);
    setConfirmTransfer(false);
    if (result.error) setFeedback(result.error);
    else setFeedback(result.added + ' punten toegevoegd aan jouw privé-nazorgdossier' +
      (result.skipped ? '; ' + result.skipped + ' bestaande punten overgeslagen.' : '.'));
  };
  return (
    <section className="panel" aria-labelledby="private-startinspection-heading">
      <div>
        <p className="eyebrow">NA SLEUTELOVERDRACHT · ZELF CONTROLEREN</p>
        <h2 id="private-startinspection-heading">Begeleide startinspectie</h2>
        <p>Doorloop 22 standaardpunten in zes ruimtes en voeg zelf controlepunten toe als jouw woning dat vraagt. Markeer wat je zelf hebt bekeken als in orde of als aandachtspunt.
          Niets wordt automatisch aangemerkt als gecontroleerd, vastgelegd bij een verhuurder of bewezen gebrek.</p>
        <p><strong>{checked.length} / {allChecks.length}</strong> zelf beoordeeld ·
          <strong> {flagged.length}</strong> zelf gemarkeerde aandachtspunten ·
          <strong> {newFlagged.length}</strong> nieuwe punten voor nazorg</p>
        <progress max={allChecks.length} value={checked.length}
          aria-label="Zelf beoordeelde inspectiepunten" style={{width:'100%'}} />
        <p>Bij onveilige situaties: volg de officiële nood- of storingsroute. Deze checklist is geen technische keuring.</p>
      </div>
      <div>
        <form onSubmit={addCustomCheck} className="aftercare-inspection-custom">
          <h3>Mijn eigen controlepunten</h3>
          <p>Voeg maximaal 12 eigen controles toe, bijvoorbeeld voor een balkon of berging.
            Dit is geen officiële inspectie-eis.</p>
          <label htmlFor="inspection-custom-title">Wat wil je controleren?</label>
          <input id="inspection-custom-title" required maxLength={100} value={customTitle}
            onChange={event => setCustomTitle(event.target.value)}
            placeholder="Bijvoorbeeld: balkonafvoer" />
          <div className="aftercare-grid">
            <div>
              <label htmlFor="inspection-custom-room">Ruimte</label>
              <select id="inspection-custom-room" value={customRoom}
                onChange={event => setCustomRoom(event.target.value)}>
                {INSPECTION_ALL_ROOMS.map(room => <option key={room} value={room}>{room}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inspection-custom-priority">Mijn prioriteit bij nazorg</label>
              <select id="inspection-custom-priority" value={customPriority}
                onChange={event => setCustomPriority(event.target.value as Priority)}>
                <option value="laag">Laag</option><option value="normaal">Normaal</option>
                <option value="dringend">Dringend volgens mij</option>
              </select>
            </div>
          </div>
          <div className="aftercare-actions">
            <button type="submit" disabled={customChecks.length >= MAX_CUSTOM_INSPECTION_CHECKS}>
              Voeg mijn controlepunt toe
            </button>
          </div>
        </form>
        <div role="group" aria-label="Filter eigen inspectiepunten" className="aftercare-actions">
          <button type="button" className={inspectionView === 'all' ? '' : 'secondary'}
            aria-pressed={inspectionView === 'all'} onClick={() => setInspectionView('all')}>
            Alle {allChecks.length} controles
          </button>
          <button type="button" className={inspectionView === 'pending' ? '' : 'secondary'}
            aria-pressed={inspectionView === 'pending'} onClick={() => setInspectionView('pending')}>
            Nog niet gecontroleerd ({allChecks.length - checked.length})
          </button>
          <button type="button" className={inspectionView === 'flagged' ? '' : 'secondary'}
            aria-pressed={inspectionView === 'flagged'} onClick={() => setInspectionView('flagged')}>
            Mijn aandachtspunten ({flagged.length})
          </button>
        </div>
        {inspectionView === 'pending' && checked.length === allChecks.length &&
          <p role="status">Alle inspectiepunten zijn door jou beoordeeld. Dat betekent niet dat alles in orde is.</p>}
        {inspectionView === 'flagged' && flagged.length === 0 &&
          <p role="status">Je hebt nog geen eigen aandachtspunten gemarkeerd.</p>}
        {INSPECTION_ALL_ROOMS.map(room => {
          const rows = allChecks.filter(item => item.room === room &&
            (inspectionView === 'all' ||
              (inspectionView === 'pending' && grades[item.id] === undefined) ||
              (inspectionView === 'flagged' && grades[item.id] === 'aandacht')));
          if (!rows.length) return null;
          const completed = rows.filter(item => grades[item.id]).length;
          return (
            <details key={room} className="aftercare-inspection-room" open={inspectionView !== 'all' ? true : undefined}>
              <summary><strong>{room}</strong> · {completed} van {rows.length} zelf beoordeeld</summary>
              {rows.map(row => (
                <fieldset key={row.id} className="aftercare-inspection-check">
                  <legend><strong>{row.title}</strong>{row.id.startsWith('custom-') ? ' · eigen punt' : ''}</legend>
                  <p>{row.tip}</p>
                  <div className="aftercare-actions">
                    <label><input type="radio" name={'inspection-' + row.id}
                      checked={grades[row.id] === 'goed'}
                      onChange={() => { setGrades(previous => ({...previous,[row.id]:'goed'})); setConfirmTransfer(false); }}
                    /> In orde volgens mij</label>
                    <label><input type="radio" name={'inspection-' + row.id}
                      checked={grades[row.id] === 'aandacht'}
                      onChange={() => { setGrades(previous => ({...previous,[row.id]:'aandacht'})); setConfirmTransfer(false); }}
                    /> Aandachtspunt</label>
                    <button className="secondary" type="button"
                      disabled={grades[row.id] === undefined}
                      onClick={() => { setGrades(previous => ({...previous,[row.id]:undefined})); setConfirmTransfer(false); }}
                    >Nog niet beoordeeld</button>
                  </div>
                  {row.id.startsWith('custom-') && (
                    <div>
                      <button type="button" className="secondary"
                        onClick={() => setPendingCustomDelete(row.id)}>Verwijder eigen controlepunt…</button>
                      {pendingCustomDelete === row.id && (
                        <div className="aftercare-confirm" role="group" aria-label="Eigen controlepunt verwijderen">
                          <p>Dit eigen controlepunt en zijn tijdelijke beoordeling verwijderen?
                            Bestaande nazorgpunten worden niet gewist.</p>
                          <div className="aftercare-actions">
                            <button type="button" onClick={() => removeCustomCheck(row.id)}>Ja, verwijder</button>
                            <button type="button" className="secondary" onClick={() => setPendingCustomDelete(null)}>Behoud</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {grades[row.id] === 'aandacht' && (
                    <>
                      <label htmlFor={'inspection-note-' + row.id}>Eigen toelichting (optioneel)</label>
                      <textarea id={'inspection-note-' + row.id}
                        maxLength={300} value={notes[row.id] || ''}
                        onChange={event => { setNotes(previous => ({...previous,[row.id]:event.target.value})); setConfirmTransfer(false); }}
                        placeholder="Bijvoorbeeld: zichtbaar vocht onder de kraan — oorzaak onbekend." />
                      {alreadyIncluded(row) && <p>Dit aandachtspunt staat al als actief punt in je nazorgdossier en wordt niet dubbel toegevoegd.</p>}
                    </>
                  )}
                </fieldset>
              ))}
            </details>
          );
        })}
        <div className="aftercare-actions">
          <button type="button" className="secondary" onClick={saveInspectionBackup} disabled={checked.length === 0 && customChecks.length === 0}>
            Bewaar mijn inspectievoortgang (JSON)
          </button>
          <button type="button" className="secondary" disabled={checked.length === 0 && customChecks.length === 0} onClick={() => setResetConfirm(true)}>
            Begin opnieuw…
          </button>
        </div>
        <label htmlFor="private-inspection-backup">Hervat met mijn eigen inspectie-JSON (max. 16 KiB)</label>
        <input id="private-inspection-backup" type="file" accept="application/json,.json"
          onChange={importInspection} />
        <p>Er wordt niet automatisch opgeslagen. Een gekozen bestandsprovider kan jouw bestand buiten Woonpoints bewaren.</p>
        {pendingRestore !== null && (
          <div className="aftercare-confirm" role="group" aria-label="Inspectie-import bevestigen">
            <p><strong>{pendingRestore.count}</strong> beoordelingen gevonden. Bestaande inspectieantwoorden
              en tijdelijke toelichtingen worden uitsluitend na bevestiging vervangen.
              Reeds eerder aan nazorg overgedragen gebreken blijven bestaan. Je eigen controlepunten worden mee vervangen.</p>
            <div className="aftercare-actions">
              <button type="button" onClick={() => {
                setGrades(pendingRestore.grades);
                setNotes(pendingRestore.notes);
                setCustomChecks(pendingRestore.custom);
                setPendingCustomDelete(null);
                setPendingRestore(null);
                setConfirmTransfer(false);
                setFeedback('Inspectie hervat: alleen de tijdelijke controleantwoorden zijn vervangen.');
              }}>Vervang mijn inspectieantwoorden</button>
              <button type="button" className="secondary" onClick={() => {
                setPendingRestore(null); setFeedback('Import geannuleerd: eigen antwoorden behouden.');
              }}>Annuleer</button>
            </div>
          </div>
        )}
        {resetConfirm && (
          <div className="aftercare-confirm" role="group" aria-label="Inspectie opnieuw starten">
            <p>Alle tijdelijke inspectieantwoorden, toelichtingen en eigen controlepunten wissen? Bestaande nazorgpunten en
              eerder gedownloade inspectieback-ups blijven bestaan.</p>
            <div className="aftercare-actions">
              <button type="button" onClick={() => {
                setGrades({}); setNotes({}); setCustomChecks([]); setPendingCustomDelete(null); setResetConfirm(false); setPendingRestore(null);
                setConfirmTransfer(false); setFeedback('Tijdelijke inspectie is leeg; nazorg blijft behouden.');
              }}>Ja, begin opnieuw</button>
              <button type="button" className="secondary" onClick={() => setResetConfirm(false)}>Behoud inspectie</button>
            </div>
          </div>
        )}
        <div className="aftercare-actions">
          <button className="secondary" type="button" disabled={checked.length === 0 && customChecks.length === 0} onClick={exportInspection}>
            Download mijn eigen inspectieoverzicht (TXT)
          </button>
          <button type="button" disabled={newFlagged.length === 0}
            onClick={() => setConfirmTransfer(true)}>
            Zet {newFlagged.length} aandachtspunt{newFlagged.length === 1 ? '' : 'en'} in nazorg…
          </button>
        </div>
        <div className="aftercare-confirm" role="group" aria-label="Mijn afdrukbare startinspectie">
          <h3>Mijn startinspectie afdrukken</h3>
          <p>Maak een offline HTML-rapport met alle standaard- en eigen controlepunten,
            ook als ze nog niet beoordeeld zijn. Je privétoelichtingen blijven standaard verborgen.</p>
          <label className="aftercare-check"><input type="checkbox" checked={printIncludeNotes}
            onChange={e => { setPrintIncludeNotes(e.target.checked); setPrintPreview(null); }} />
            Neem bewust mijn privétoelichtingen bij aandachtspunten op
          </label>
          <button type="button" className="secondary"
            disabled={checked.length === 0 && customChecks.length === 0}
            onClick={() => setPrintPreview({signature:printSignature, includeNotes:printIncludeNotes})}>
            Bekijk mijn afdrukvoorbeeld…
          </button>
          {printPreview && !printCurrent &&
            <p role="status">Gegevens of privacykeuze gewijzigd. Bekijk eerst opnieuw het huidige rapport.</p>}
          {printCurrent && <div role="group" aria-label="Mijn actuele afdrukvoorbeeld bevestigen">
            <p><strong>{checked.length}</strong> beoordeeld · <strong>{flagged.length}</strong> aandachtspunten ·
              <strong> {allChecks.length - checked.length}</strong> niet gecontroleerd · privétoelichtingen
              {printIncludeNotes ? ' ingeschakeld' : ' uitgeschakeld'}.</p>
            <details><summary>Controleer alle {allChecks.length} rapportregels</summary>
              <ol>{allChecks.map(c => <li key={c.id}><strong>{c.room}: {c.title}</strong> — {
                grades[c.id] === 'goed' ? 'Volgens mij in orde' :
                grades[c.id] === 'aandacht' ? 'Mijn aandachtspunt' : 'Niet gecontroleerd'
              } ({c.priority})
                {printIncludeNotes && grades[c.id] === 'aandacht' && notes[c.id]?.trim() &&
                  <p className="aftercare-note">Eigen toelichting: {notes[c.id].trim()}</p>}
              </li>)}</ol>
            </details>
            <div className="aftercare-actions">
              <button type="button" onClick={savePrintableInspection}>Ja, download mijn HTML-afdrukbestand</button>
              <button type="button" className="secondary" onClick={() => setPrintPreview(null)}>Niet downloaden</button>
            </div>
            <p>Open het bestand zelf in je browser en kies Afdrukken of Bewaar als PDF.
              Je printer of bestandsmap kan informatie buiten Woonpoints bewaren.
              Niets wordt naar WoningNet, een verhuurder of een server verzonden.</p>
          </div>}
        </div>
        {confirmTransfer && (
          <div className="aftercare-confirm" role="group" aria-label="Overdracht naar nazorg bevestigen">
            <p><strong>{newFlagged.length}</strong> door jou afgekeurde, nog niet eerder actieve punten komen
              uitsluitend in dit tabblad als nieuwe open nazorgpunten. Er wordt niets naar anderen verstuurd.
              De inspectiestatussen zelf worden niet automatisch opgeslagen of in een back-up opgenomen.</p>
            <div className="aftercare-actions">
              <button type="button" onClick={transfer} disabled={newFlagged.length === 0}>Ja, voeg toe aan mijn nazorg</button>
              <button type="button" className="secondary" onClick={() => setConfirmTransfer(false)}>Niet toevoegen</button>
            </div>
          </div>
        )}
        <p role="status" aria-live="polite">{feedback}</p>
      </div>
    </section>
  );
}

function PrivateMoveAftercare() {
  const [inspectionGrades, setInspectionGrades] = useState<Record<string, InspectionGrade | undefined>>({});
  const [inspectionNotes, setInspectionNotes] = useState<Record<string, string>>({});
  const [inspectionCustomChecks, setInspectionCustomChecks] = useState<PrivateCustomInspectionCheck[]>([]);
  const [inspectionVersion, setInspectionVersion] = useState(0);
  const [pendingCompleteImport, setPendingCompleteImport] = useState<CompleteHandover | null>(null);
  const [pendingCompleteSource, setPendingCompleteSource] = useState('');
  const [importRiskApproved, setImportRiskApproved] = useState(false);
  const [completeBackupPreview, setCompleteBackupPreview] = useState<string | null>(null);
  const [completeUndo, setCompleteUndo] = useState<{
    previous: CompleteHandover;
    importedSignature: string;
  } | null>(null);
  const [confirmCompleteUndo, setConfirmCompleteUndo] = useState(false);
  const [completeMessage, setCompleteMessage] = useState('');
  const [includeInspectionSummaryNotes, setIncludeInspectionSummaryNotes] = useState(false);
  const [includeAftercareSummaryNotes, setIncludeAftercareSummaryNotes] = useState(false);
  const [includeContactSummaryNotes, setIncludeContactSummaryNotes] = useState(false);
  const [completeSummaryText, setCompleteSummaryText] = useState('');
  const [completeSummarySource, setCompleteSummarySource] = useState('');
  const [completeSummaryApproved, setCompleteSummaryApproved] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<FollowUp[]>([]);
  const [contactTimelineKind, setContactTimelineKind] = useState<ContactKind | 'alle'>('alle');
  const [contactTimelineSearch, setContactTimelineSearch] = useState('');
  const [timelineExportFormat, setTimelineExportFormat] = useState<'txt' | 'csv'>('txt');
  const [includeTimelinePrivateNotes, setIncludeTimelinePrivateNotes] = useState(false);
  const [timelineExportPreview, setTimelineExportPreview] = useState<{
    signature: string; content: string; count: number; format: 'txt' | 'csv'
  } | null>(null);
  const [timelineExportApproved, setTimelineExportApproved] = useState(false);
  const [timelineExportFeedback, setTimelineExportFeedback] = useState('');
  const [expandContactTimeline, setExpandContactTimeline] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);
  const [historyKind, setHistoryKind] = useState<ContactKind>('eigen-notitie');
  const [historyDay, setHistoryDay] = useState(today());
  const [historyDetail, setHistoryDetail] = useState('');
  const [historyDeletePending, setHistoryDeletePending] = useState<string | null>(null);
  const [caseSheetItemId, setCaseSheetItemId] = useState<string | null>(null);
  const [caseSheetIncludeItemNote, setCaseSheetIncludeItemNote] = useState(false);
  const [caseSheetIncludeContactDetails, setCaseSheetIncludeContactDetails] = useState(false);
  const [caseSheetPreview, setCaseSheetPreview] = useState<{
    source: string; itemId: string; content: string; contactCount: number
  } | null>(null);
  const [caseSheetApproved, setCaseSheetApproved] = useState(false);
  const [contactCorrection, setContactCorrection] = useState<{
    id: string; source: string; kind: ContactKind; day: string; detail: string
  } | null>(null);
  const [contactCorrectionPreview, setContactCorrectionPreview] = useState<{
    source: string; draft: string; updated: FollowUp
  } | null>(null);
  const [contactCorrectionUndo, setContactCorrectionUndo] = useState<{
    previous: FollowUp[]; resultingSignature: string
  } | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'actief' | 'alles' | 'afgerond'>('actief');
  const [issueSearch, setIssueSearch] = useState('');
  const [issuePriority, setIssuePriority] = useState<Priority | 'alle'>('alle');
  const [issueRoom, setIssueRoom] = useState('alle');
  const [showAllFollowUps, setShowAllFollowUps] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([]);
  const [pendingBulk, setPendingBulk] = useState<{
    status: 'open' | 'afgerond'; signature: string; count: number
  } | null>(null);
  const [bulkUndo, setBulkUndo] = useState<{
    before: Item[]; appliedSignature: string; changedCount: number
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [clearPending, setClearPending] = useState(false);
  const [incoming, setIncoming] = useState<AftercareBackup | null>(null);
  const [incomingMode, setIncomingMode] = useState<'replace' | 'merge'>('replace');
  const [mergeConflictChoices, setMergeConflictChoices] =
    useState<Record<string, PrivateConflictChoice>>({});
  const [incomingSource, setIncomingSource] = useState('');
  const [incomingRiskApproved, setIncomingRiskApproved] = useState(false);
  const [aftercareImportUndo, setAftercareImportUndo] = useState<{
    previous: AftercareBackup; importedSignature: string
  } | null>(null);
  const [removalUndo, setRemovalUndo] = useState<{
    previous: AftercareBackup; resultingSignature: string; label: string
  } | null>(null);
  const [clearUndo, setClearUndo] = useState<{
    previous: AftercareBackup; clearedSignature: string
  } | null>(null);
  const [message, setMessage] = useState('');
  const [pendingJsonExport, setPendingJsonExport] = useState<{
    source: string; contents: string; itemsCount: number; historyCount: number; bytes: number
  } | null>(null);
  const [jsonExportApproved, setJsonExportApproved] = useState(false);
  const [includePrivateTxtNotes, setIncludePrivateTxtNotes] = useState(false);
  const [pendingTextExport, setPendingTextExport] = useState<{
    source: string; preview: string; count: number
  } | null>(null);
  const [includePrivateCsvNotes, setIncludePrivateCsvNotes] = useState(false);
  const [pendingCsvExport, setPendingCsvExport] = useState<{
    source: string; preview: string; count: number
  } | null>(null);
  // A draft is a human-reviewed local export, never a sent or verified notice.
  const [chosenIssueIds, setChosenIssueIds] = useState<string[]>([]);
  const [includeDetails, setIncludeDetails] = useState(false);
  const [noticeSubject, setNoticeSubject] = useState('Open aandachtspunten na mijn verhuizing');
  const [noticeMode, setNoticeMode] = useState<'eerste-melding' | 'opvolging'>('eerste-melding');
  const [noticeDraft, setNoticeDraft] = useState('');
  const [noticeSource, setNoticeSource] = useState('');
  const [noticeApproved, setNoticeApproved] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const currentDay = today();
  // The downloadable, pretty-printed v2 JSON is the actual storage budget.
  // Counting only compact JSON would accept edits that cannot be backed up.
  const aftercareBackupBytes = new TextEncoder().encode(JSON.stringify({
    kind: KIND, schema: 2, items, history
  }, null, 2)).length;
  const aftercareBackupPercent = Math.min(100, Math.ceil(100 * aftercareBackupBytes / MAX_BYTES));
  const active = items.filter(item => item.status !== 'afgerond');
  const overdue = active.filter(item => item.due && item.due < currentDay);
  const noticeItems = active.filter(item => chosenIssueIds.includes(item.id)).slice(0, 12);
  // Self-entered message dates are advisory and never independently prove sending.
  const noticeOwnContactDates = noticeItems.map(item => ({
    id: item.id,
    lastOwnSentDay: history.filter(log => log.issueId === item.id &&
      log.kind === 'zelf-verstuurd' && log.day <= currentDay)
      .map(log => log.day).sort().slice(-1)[0] || null
  }));
  const noticeFingerprint = JSON.stringify({
    noticeItems, includeDetails, noticeSubject, noticeMode,
    ...(noticeMode === 'opvolging' ? { noticeOwnContactDates } : {})
  });
  const noticeCurrent = noticeDraft.length > 0 && noticeDraft.length <= 10000 &&
    noticeSource === noticeFingerprint && noticeItems.length > 0;

  const dueActive = active.filter(item => item.due).sort((a, b) =>
    a.due.localeCompare(b.due) || a.title.localeCompare(b.title));
  const completeDataSignature = JSON.stringify({
    inspectionGrades, inspectionNotes, inspectionCustomChecks, items, history
  });
  const completeImportCurrent = pendingCompleteImport !== null &&
    pendingCompleteSource === completeDataSignature;
  const completeImportImpact = pendingCompleteImport === null ? null :
    compareCompleteHandover({
      inspection: {
        grades: inspectionGrades, notes: inspectionNotes, custom: inspectionCustomChecks,
        count: Object.values(inspectionGrades).filter(value => value === 'goed' || value === 'aandacht').length
      },
      aftercare:{items,history}
    }, pendingCompleteImport);
  const completeBackupCurrent = completeBackupPreview !== null &&
    completeBackupPreview === completeDataSignature;
  const canUndoComplete = completeUndo !== null &&
    completeUndo.importedSignature === completeDataSignature;
  const completeSummaryFingerprint = JSON.stringify({
    inspectionGrades, inspectionNotes, inspectionCustomChecks, items, history,
    includeInspectionSummaryNotes, includeAftercareSummaryNotes, includeContactSummaryNotes
  });
  const completeSummaryCurrent = completeSummaryText.length > 0 &&
    completeSummaryText.length <= 70000 &&
    completeSummarySource === completeSummaryFingerprint;
  const [year, month, day] = currentDay.split('-').map(Number);
  const horizon = new Date(Date.UTC(year, month - 1, day + 30)).toISOString().slice(0, 10);
  const upcoming = dueActive.filter(item => item.due >= currentDay && item.due <= horizon);

  // Priority is based only on the user's local entries; never infer a real landlord notification.
  const nextSevenDays = new Date(Date.UTC(year, month - 1, day + 7)).toISOString().slice(0, 10);
  const followUpInbox = active.map(item => {
    const ownContact = history.filter(log => log.issueId === item.id && log.kind === 'zelf-verstuurd' && log.day <= currentDay)
      .sort((a, b) => b.day.localeCompare(a.day))[0];
    const ownFutureAppointment = history.some(log => log.issueId === item.id &&
      log.kind === 'afspraak' && log.day >= currentDay);
    const contactAge = ownContact
      ? Math.floor((Date.parse(currentDay + 'T00:00:00Z') - Date.parse(ownContact.day + 'T00:00:00Z')) / 86400000)
      : null;
    let urgency = 5;
    let reason = 'Bewaar dit punt in je eigen overzicht.';
    if (item.due && item.due < currentDay) {
      urgency = 0;
      reason = 'Je eigen streefdatum is verstreken; controleer zelf wat is afgesproken.';
    } else if (item.status === 'gemeld' && !ownContact) {
      urgency = 1;
      reason = 'Door jou als gemeld gemarkeerd, zonder vastgelegd eigen verzendmoment. Controleer de echte correspondentie.';
    } else if (item.status === 'gemeld' && contactAge !== null && contactAge >= 14 && !ownFutureAppointment) {
      urgency = 2;
      reason = 'Je laatste zelf genoteerde bericht is minstens 14 dagen oud. Kijk zelf of opvolging passend is.';
    } else if (item.priority === 'dringend' && item.status === 'open') {
      urgency = 3;
      reason = 'Door jou als dringend aangemerkt; beoordeel een volgende stap.';
    } else if (item.due && item.due <= nextSevenDays) {
      urgency = 4;
      reason = 'Je eigen streefdatum valt binnen zeven dagen.';
    }
    return { item, urgency, reason, ownContact, ownFutureAppointment };
  }).sort((a, b) => a.urgency - b.urgency ||
    (a.item.due || '9999-99-99').localeCompare(b.item.due || '9999-99-99') ||
    a.item.title.localeCompare(b.item.title));
  const attentionCount = followUpInbox.filter(entry => entry.urgency <= 4).length;
  const ownAppointments = history.filter(log => log.kind === 'afspraak' && log.day >= currentDay)
    .flatMap(event => {
      const item = active.find(candidate => candidate.id === event.issueId);
      return item ? [{ event, item }] : [];
    }).sort((a, b) => a.event.day.localeCompare(b.event.day) ||
      a.item.title.localeCompare(b.item.title));

  const contactTimelineQuery = contactTimelineSearch.normalize('NFKC').trim().toLocaleLowerCase('nl-NL');
  const contactTimeline = useMemo(() => {
    const byId = new Map(items.map(item => [item.id, item]));
    return history.flatMap(event => {
      const item = byId.get(event.issueId);
      if (!item || (contactTimelineKind !== 'alle' && event.kind !== contactTimelineKind)) return [];
      if (contactTimelineQuery && ![item.title, item.room, event.detail, event.day].some(value =>
        value.normalize('NFKC').toLocaleLowerCase('nl-NL').includes(contactTimelineQuery))) return [];
      return [{event, item}];
    }).sort((a, b) => b.event.day.localeCompare(a.event.day) ||
      a.item.title.localeCompare(b.item.title, 'nl-NL') ||
      a.event.id.localeCompare(b.event.id));
  }, [items, history, contactTimelineKind, contactTimelineQuery]);

  // Export is deliberately bound to the whole original dossier, current
  // search/type filters and privacy choice, not to a stale visible slice.
  const timelineExportSignature = JSON.stringify({
    items, history, contactTimelineKind, contactTimelineSearch,
    timelineExportFormat, includeTimelinePrivateNotes, contactTimeline
  });
  const timelineExportIsCurrent = timelineExportPreview !== null &&
    timelineExportPreview.signature === timelineExportSignature &&
    timelineExportPreview.count === contactTimeline.length &&
    timelineExportPreview.format === timelineExportFormat;


  const issueRooms = useMemo(() => Array.from(new Set(items.map(item => item.room)))
    .sort((a, b) => a.localeCompare(b, 'nl-NL')), [items]);
  const issueQuery = issueSearch.normalize('NFKC').trim().toLocaleLowerCase('nl-NL');
  const shown = useMemo(() => items.filter(item =>
    (filter === 'alles' || (filter === 'actief' ? item.status !== 'afgerond' : item.status === 'afgerond')) &&
    (issuePriority === 'alle' || item.priority === issuePriority) &&
    (issueRoom === 'alle' || item.room === issueRoom) &&
    (!issueQuery || [item.title, item.room, item.note].some(field =>
      field.normalize('NFKC').toLocaleLowerCase('nl-NL').includes(issueQuery))))
    .sort((a, b) => (a.status === 'afgerond' ? 1 : 0) - (b.status === 'afgerond' ? 1 : 0) ||
      (a.due || '9999').localeCompare(b.due || '9999') || a.title.localeCompare(b.title, 'nl-NL')),
    [items, filter, issuePriority, issueRoom, issueQuery]);
  const jsonExportSignature = JSON.stringify({ items, history });
  const jsonExportCurrent = pendingJsonExport !== null &&
    pendingJsonExport.source === jsonExportSignature &&
    pendingJsonExport.itemsCount === items.length &&
    pendingJsonExport.historyCount === history.length;
  const aftercareImportSignature = JSON.stringify({ items, history });
  // The visible one-case review is bound to all original tab contents and
  // both independent privacy choices, never just the currently shown text.
  const caseSheetSource = JSON.stringify({
    items, history, caseSheetItemId, caseSheetIncludeItemNote, caseSheetIncludeContactDetails
  });
  const caseSheetCurrent = caseSheetPreview !== null &&
    caseSheetPreview.source === caseSheetSource &&
    caseSheetPreview.itemId === caseSheetItemId &&
    items.some(item => item.id === caseSheetItemId);
  const contactCorrectionCurrent = contactCorrection !== null &&
    contactCorrectionPreview !== null &&
    contactCorrection.source === aftercareImportSignature &&
    contactCorrectionPreview.source === aftercareImportSignature &&
    contactCorrectionPreview.draft === JSON.stringify(contactCorrection) &&
    history.some(log => log.id === contactCorrectionPreview.updated.id &&
      log.issueId === contactCorrectionPreview.updated.issueId);
  const contactCorrectionUndoCurrent = contactCorrectionUndo !== null &&
    contactCorrectionUndo.resultingSignature === aftercareImportSignature;
  const incomingCurrent = incoming !== null && incomingSource === aftercareImportSignature;
  const incomingMerge = incoming === null ? null :
    planPrivateAftercareMerge({items, history}, incoming, mergeConflictChoices);
  const aftercareUndoCurrent = aftercareImportUndo !== null &&
    aftercareImportUndo.importedSignature === aftercareImportSignature;
  const removalUndoCurrent = removalUndo !== null &&
    removalUndo.resultingSignature === aftercareImportSignature;
  const clearUndoCurrent = clearUndo !== null &&
    clearUndo.clearedSignature === aftercareImportSignature;
  const incomingImpact = incoming === null ? null : (() => {
    const itemsRows = (data: AftercareBackup): PrivateImportRows => data.items.map(row => ({
      id: row.id, label: row.room + ' — ' + row.title,
      snapshot: JSON.stringify([row.title, row.room, row.status, row.priority,
        row.due, row.note, row.created])
    }));
    const historyRows = (data: AftercareBackup): PrivateImportRows => {
      const labels = new Map(data.items.map(row => [row.id, row.room + ' — ' + row.title]));
      return data.history.map(row => ({
        id: row.id,
        label: row.day + ' · ' + (labels.get(row.issueId) || 'Eigen nazorgpunt') + ' (' + row.kind + ')',
        snapshot: JSON.stringify([row.issueId, row.kind, row.day, row.detail])
      }));
    };
    const previous = { items, history };
    return {
      points: summarizePrivateImportChange(itemsRows(previous), itemsRows(incoming)),
      contacts: summarizePrivateImportChange(historyRows(previous), historyRows(incoming))
    };
  })();
  const csvExportSignature = JSON.stringify({ items, includePrivateCsvNotes });
  const csvExportCurrent = pendingCsvExport !== null &&
    pendingCsvExport.source === csvExportSignature &&
    pendingCsvExport.count === items.length;
  const textExportSignature = JSON.stringify({
    items, shown, filter, issuePriority, issueRoom, issueQuery, includePrivateTxtNotes
  });
  const textExportCurrent = pendingTextExport !== null &&
    pendingTextExport.source === textExportSignature &&
    pendingTextExport.count === shown.length;
  const bulkVisible = shown.filter(item => bulkSelectedIds.includes(item.id));
  const bulkSignature = JSON.stringify({
    items, selectedIds: bulkVisible.map(item => item.id), filter,
    issuePriority, issueRoom, issueQuery
  });
  const bulkIsCurrent = pendingBulk !== null && pendingBulk.signature === bulkSignature &&
    pendingBulk.count === bulkVisible.length;
  const bulkUndoCurrent = bulkUndo !== null &&
    bulkUndo.appliedSignature === JSON.stringify({ items, history });

  function proposeBulkStatus(status: 'open' | 'afgerond') {
    if (bulkVisible.length === 0) { setMessage('Selecteer eerst zichtbare eigen dossierpunten.'); return; }
    setPendingBulk({ status, signature: bulkSignature, count: bulkVisible.length });
  }

  function confirmBulkStatus() {
    if (pendingBulk === null || !bulkIsCurrent || bulkVisible.length === 0) {
      setPendingBulk(null);
      setMessage('Selectie of gegevens zijn veranderd. Selecteer en controleer de bulkactie opnieuw.');
      return;
    }
    const selected = new Set(bulkVisible.map(item => item.id));
    const next = items.map(item => selected.has(item.id) ?
      { ...item, status: pendingBulk.status } : item);
    if (new TextEncoder().encode(JSON.stringify({
      kind: KIND, schema: 2, items: next, history
    }, null, 2)).length > MAX_BYTES) {
      setPendingBulk(null);
      setMessage('Niet aangepast: eigen privé-JSON zou groter dan 16 KiB worden.');
      return;
    }
    const count = selected.size;
    setBulkUndo({
      before: items.map(item => ({ ...item })),
      appliedSignature: JSON.stringify({ items: next, history }),
      changedCount: count
    });
    setItems(next);
    setPendingBulk(null);
    setBulkSelectedIds([]);
    setMessage(count + ' eigen punten als ' + pendingBulk.status +
      ' gemarkeerd. Geen officiële actie of verhuurderbericht uitgevoerd.');
  }

  function undoLastBulkStatus() {
    if (bulkUndo === null || !bulkUndoCurrent) {
      setBulkUndo(null);
      setMessage('Terugdraaien geweigerd: na de bulkactie zijn eigen gegevens gewijzigd.');
      return;
    }
    setItems(bulkUndo.before.map(item => ({ ...item })));
    setBulkUndo(null);
    setPendingBulk(null);
    setBulkSelectedIds([]);
    setMessage('Vorige eigen statussen uit dit tabblad teruggezet. Er is niets extern veranderd.');
  }

  function openIssueFromInbox(id: string) {
    // Clearing the local view first ensures the destination cannot be hidden by filters.
    setFilter('alles');
    setIssueSearch('');
    setIssuePriority('alle');
    setIssueRoom('alle');
    requestAnimationFrame(() => {
      const target = document.getElementById('nazorg-punt-' + id);
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target?.focus({ preventScroll: true });
    });
  }

  function createFromInspection(requests: Draft[]): { added: number; skipped: number; error?: string } {
    if (requests.length === 0) return { added: 0, skipped: 0 };
    const existing = new Set(items.filter(item => item.status !== 'afgerond')
      .map(item => item.room.toLocaleLowerCase('nl-NL') + '\u0000' + item.title.toLocaleLowerCase('nl-NL')));
    const extra: Item[] = [];
    let skipped = 0;
    for (const request of requests) {
      const key = request.room.toLocaleLowerCase('nl-NL') + '\u0000' + request.title.toLocaleLowerCase('nl-NL');
      if (existing.has(key)) { skipped++; continue; }
      if (!validText(request.title, 1, 100) || !validText(request.room, 1, 40) ||
          !validText(request.note, 0, 500) || !isPriority(request.priority) ||
          request.due !== '') return { added: 0, skipped: 0, error: 'Ongeldige eigen inspectietekst; niets overgenomen.' };
      existing.add(key);
      extra.push({ ...request, id: 'item-' + crypto.randomUUID(), status: 'open', created: today() });
    }
    if (items.length + extra.length > LIMIT) return { added: 0, skipped, error: 'Er zijn maximaal 80 nazorgpunten mogelijk. Verwijder eerst oude punten.' };
    if (new TextEncoder().encode(JSON.stringify({
      kind: KIND, schema: 2, items: [...items, ...extra], history
    }, null, 2)).length > MAX_BYTES) {
      return { added: 0, skipped, error: 'Dit zou de maximale JSON-back-up van 16 KiB overschrijden; verkort bestaande notities.' };
    }
    setItems(previous => [...previous, ...extra]);
    setIncoming(null);
    setNoticeApproved(false);
    setMessage(extra.length + ' zelf gemarkeerde punten vanuit startinspectie toegevoegd; geen externe melding.');
    return { added: extra.length, skipped };
  }

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
    const nextItems: Item[] = editing
      ? items.map(item => item.id === editing ? { ...item, ...clean } : item)
      : [...items, { ...clean, id: 'item-' + crypto.randomUUID(), created: today(), status: 'open' }];
    if (editing && !items.some(item => item.id === editing)) {
      setMessage('Dit aandachtspunt is niet meer aanwezig; niets aangepast.'); return;
    }
    if (new TextEncoder().encode(JSON.stringify({
      kind: KIND, schema: 2, items: nextItems, history
    }, null, 2)).length > MAX_BYTES) {
      setMessage('Wijziging niet opgeslagen: de privé-JSON-back-up zou groter dan 16 KiB worden. Verkort eerst notities of verwijder oude punten.');
      return;
    }
    setItems(nextItems);
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
    if (!items.some(item => item.id === id)) return;
    const nextItems = items.map(item => item.id === id ? { ...item, status } : item);
    if (new TextEncoder().encode(JSON.stringify({
      kind: KIND, schema: 2, items: nextItems, history
    }, null, 2)).length > MAX_BYTES) {
      setMessage('Status niet aangepast: verkort eerst je eigen dossier voor een geldige JSON-back-up.'); return;
    }
    setItems(nextItems);
    setMessage(status === 'gemeld'
      ? 'Zelf als gemeld gemarkeerd. Er is niets aan een verhuurder verstuurd.'
      : 'Eigen status aangepast. Geen externe bevestiging.');
  }
  function addFollowUp(event: FormEvent<HTMLFormElement>, issueId: string) {
    event.preventDefault();
    const clean = historyDetail.trim();
    if (!items.some(item => item.id === issueId) || !CONTACT_TYPES.some(type => type.id === historyKind) ||
        !validDate(historyDay) || !validText(clean, 1, 240)) {
      setMessage('Controleer de datum en je contactnotitie (max. 240 tekens).'); return;
    }
    if (historyKind !== 'afspraak' && historyDay > today()) {
      setMessage('Een zelf genoteerd contact kan niet in de toekomst liggen. Kies voor een geplande afspraak.'); return;
    }
    if (history.length >= 160 || history.filter(item => item.issueId === issueId).length >= 8) {
      setMessage('Het maximum van 8 contactmomenten per punt of 160 in totaal is bereikt.'); return;
    }
    const next: FollowUp[] = [...history, {
      id: 'log-' + crypto.randomUUID(), issueId, kind: historyKind, day: historyDay, detail: clean
    }];
    const bytes = new TextEncoder().encode(JSON.stringify({ kind: KIND, schema: 2, items, history: next }, null, 2)).length;
    if (bytes > MAX_BYTES) {
      setMessage('Geen ruimte meer binnen de veilige privéback-up van 16 KiB. Verwijder oude contactmomenten of verkort invoer.'); return;
    }
    setHistory(next);
    setHistoryDetail('');
    setHistoryDay(today());
    setHistoryKind('eigen-notitie');
    setHistoryTarget(null);
    setHistoryDeletePending(null);
    setMessage('Contactmoment alleen in dit tabblad opgeslagen; niet extern geverifieerd of verzonden.');
  }
  function openCaseSheet(id: string) {
    if (!items.some(item => item.id === id)) return;
    setCaseSheetItemId(id);
    setCaseSheetIncludeItemNote(false);
    setCaseSheetIncludeContactDetails(false);
    setCaseSheetPreview(null);
    setCaseSheetApproved(false);
    setMessage('Privé-puntoverzicht geopend. Vrije toelichtingen zijn standaard verborgen.');
  }
  function prepareCaseSheet() {
    const item = items.find(row => row.id === caseSheetItemId);
    if (!item) {
      setCaseSheetPreview(null);
      setCaseSheetApproved(false);
      setMessage('Dit eigen nazorgpunt bestaat niet meer. Er is niets voorbereid.');
      return;
    }
    const related = history.filter(row => row.issueId === item.id)
      .sort((a, b) => a.day.localeCompare(b.day) || a.id.localeCompare(b.id));
    const lines = [
      'WOONPOINTS · MIJN PRIVÉ-NAZORGOVERZICHT PER PUNT',
      'Alleen mijn eigen invoer — geen verhuurderreactie, verzendbewijs, juridische termijn of inspectierapport.',
      '',
      'MIJN AANDACHTSPUNT',
      'Ruimte: ' + reportLine(item.room),
      'Titel: ' + reportLine(item.title),
      'Eigen prioriteit: ' + item.priority,
      'Eigen status: ' + item.status + ' (zelf ingevoerd en niet onafhankelijk gecontroleerd)',
      'Eigen streefdatum: ' + (item.due || 'niet ingevuld'),
      'Aangemaakt op: ' + item.created,
      ...(caseSheetIncludeItemNote ? ['Mijn privétoelichting: ' + reportLine(item.note)] : []),
      '',
      'MIJN CONTACTMOMENTEN (' + related.length + ')',
      ...related.flatMap((event, index) => [
        (index + 1) + '. ' + event.day + ' · ' +
          (CONTACT_TYPES.find(type => type.id === event.kind)?.title || 'Eigen aantekening'),
        ...(caseSheetIncludeContactDetails ? [
          '   Mijn privécontactnotitie: ' + reportLine(event.detail)
        ] : [])
      ]),
      '',
      'Privétoelichting bij punt: ' + (caseSheetIncludeItemNote ? 'bewust opgenomen' : 'weggelaten'),
      'Vrije contactteksten: ' + (caseSheetIncludeContactDetails ? 'bewust opgenomen' : 'weggelaten'),
      'Controleer de oorspronkelijke correspondentie zelf. Dit document is niet automatisch verzonden.'
    ];
    const content = lines.join('\n') + '\n';
    if (new TextEncoder().encode(content).length > 50000) {
      setCaseSheetPreview(null);
      setCaseSheetApproved(false);
      setMessage('Dit eigen punt-overzicht is te groot. Kies minder privétoelichtingen.');
      return;
    }
    setCaseSheetPreview({source: caseSheetSource, itemId: item.id, content,
      contactCount: related.length});
    setCaseSheetApproved(false);
    setMessage('Bekijk de volledige huidige tekst en geef dan een afzonderlijke downloadtoestemming.');
  }
  function confirmCaseSheet() {
    if (!caseSheetCurrent || !caseSheetApproved || !caseSheetPreview) {
      setCaseSheetPreview(null);
      setCaseSheetApproved(false);
      setMessage('Het dossier of je privacykeuze is gewijzigd. Bekijk eerst een nieuw overzicht.');
      return;
    }
    download('woonpoints-mijn-eigen-nazorgpunt.txt', caseSheetPreview.content,
      'text/plain;charset=utf-8');
    setCaseSheetPreview(null);
    setCaseSheetApproved(false);
    setMessage('Je gecontroleerde privé-puntoverzicht is gedownload. Er is niets aan derden verstuurd.');
  }

  function beginContactCorrection(log: FollowUp) {
    if (!history.some(row => row.id === log.id && row.issueId === log.issueId)) return;
    setContactCorrection({id: log.id, source: aftercareImportSignature,
      kind: log.kind, day: log.day, detail: log.detail});
    setContactCorrectionPreview(null);
    setHistoryDeletePending(null);
    setHistoryTarget(null);
  }
  function previewContactCorrection() {
    const draft = contactCorrection;
    if (!draft || draft.source !== aftercareImportSignature) {
      setContactCorrectionPreview(null);
      setMessage('Je eigen dossier is veranderd. Open het contactmoment opnieuw.');
      return;
    }
    const old = history.find(row => row.id === draft.id);
    if (!old || !items.some(item => item.id === old.issueId)) {
      setContactCorrectionPreview(null);
      setMessage('Dit eigen contactmoment is niet langer aanwezig.');
      return;
    }
    const updated: FollowUp = {...old, kind: draft.kind, day: draft.day, detail: draft.detail.trim()};
    if (!validFollowUp(updated) || (updated.kind !== 'afspraak' && updated.day > today())) {
      setContactCorrectionPreview(null);
      setMessage('Controleer de datum, notitiesoort en privétekst. Alleen afspraken kunnen toekomstig zijn.');
      return;
    }
    if (JSON.stringify(old) === JSON.stringify(updated)) {
      setContactCorrectionPreview(null);
      setMessage('Er zijn nog geen wijzigingen om te bewaren.');
      return;
    }
    const next = history.map(row => row.id === updated.id ? updated : row);
    if (new TextEncoder().encode(JSON.stringify({kind: KIND, schema: 2, items, history: next}, null, 2)).length > MAX_BYTES) {
      setContactCorrectionPreview(null);
      setMessage('Deze correctie past niet in je volledige 16 KiB herstel-JSON.');
      return;
    }
    setContactCorrectionPreview({source: aftercareImportSignature,
      draft: JSON.stringify(draft), updated});
    setMessage('Controleer eerst de eigen oorspronkelijke en gecorrigeerde notitie.');
  }
  function confirmContactCorrection() {
    if (!contactCorrectionCurrent || !contactCorrectionPreview ||
        !validFollowUp(contactCorrectionPreview.updated)) {
      setContactCorrectionPreview(null);
      setMessage('Correctie geweigerd: bron of concept is inmiddels veranderd.');
      return;
    }
    const updated = contactCorrectionPreview.updated;
    const next = history.map(row => row.id === updated.id ? {...updated} : row);
    if (new TextEncoder().encode(JSON.stringify({kind: KIND, schema: 2, items, history: next}, null, 2)).length > MAX_BYTES) {
      setContactCorrectionPreview(null);
      setMessage('Correctie geweigerd: herstelbestand zou groter dan 16 KiB zijn.');
      return;
    }
    setContactCorrectionUndo({previous: history.map(row => ({...row})),
      resultingSignature: JSON.stringify({items, history: next})});
    setHistory(next);
    setContactCorrection(null);
    setContactCorrectionPreview(null);
    setTimelineExportPreview(null);
    setTimelineExportApproved(false);
    setMessage('Eigen contactnotitie gecorrigeerd met behoud van ID; eenmalig herstel mogelijk.');
  }
  function undoContactCorrection() {
    if (!contactCorrectionUndo || !contactCorrectionUndoCurrent) {
      setMessage('Herstel geweigerd: het dossier veranderde na je correctie.');
      return;
    }
    setHistory(contactCorrectionUndo.previous.map(row => ({...row})));
    setContactCorrectionUndo(null);
    setContactCorrection(null);
    setContactCorrectionPreview(null);
    setTimelineExportPreview(null);
    setTimelineExportApproved(false);
    setMessage('Vorige eigen contactnotitie in dit tabblad teruggezet; geen externe melding gewijzigd.');
  }

  function rememberRemoval(nextItems: Item[], nextHistory: FollowUp[], label: string) {
    setRemovalUndo({
      previous: {items: items.map(item => ({...item})),
        history: history.map(event => ({...event}))},
      resultingSignature: JSON.stringify({items: nextItems, history: nextHistory}),
      label
    });
    setItems(nextItems);
    setHistory(nextHistory);
    setPendingDelete(null);
    setHistoryDeletePending(null);
    setHistoryTarget(null);
    setPendingJsonExport(null);
    setJsonExportApproved(false);
    setPendingCsvExport(null);
    setPendingTextExport(null);
    setMessage(label + ' uit dit tabblad verwijderd. Eénmalig herstel mogelijk zolang er niets wijzigt.');
  }
  function removeFollowUp(id: string) {
    const event = history.find(entry => entry.id === id);
    if (!event) return;
    const nextHistory = history.filter(entry => entry.id !== id);
    rememberRemoval(items, nextHistory, 'Eigen contactmoment');
  }
  function removeAftercarePoint(id: string) {
    const item = items.find(entry => entry.id === id);
    if (!item) return;
    const nextItems = items.filter(entry => entry.id !== id);
    const nextHistory = history.filter(entry => entry.issueId !== id);
    rememberRemoval(nextItems, nextHistory, 'Nazorgpunt en gekoppelde contactmomenten');
    if (editing === id) { setEditing(null); setDraft(EMPTY); }
  }
  function confirmClearAllAftercare() {
    if (!clearPending || (items.length === 0 && history.length === 0)) {
      setClearPending(false);
      return;
    }
    const previous: AftercareBackup = {
      items: items.map(item => ({...item})),
      history: history.map(event => ({...event}))
    };
    setClearUndo({ previous, clearedSignature: JSON.stringify({ items: [], history: [] }) });
    setItems([]);
    setHistory([]);
    resetAftercareRestoreEphemera();
    setAftercareImportUndo(null);
    setIncoming(null);
    setIncomingSource('');
    setIncomingRiskApproved(false);
    setHistoryTarget(null);
    setHistoryDeletePending(null);
    setDraft(EMPTY);
    setEditing(null);
    setClearPending(false);
    setPendingDelete(null);
    setMessage('Eigen punten en contactnotities uit dit tabblad gewist. Eénmalig veilig herstel is beschikbaar zolang je niets nieuws invoert.');
  }
  function undoClearAllAftercare() {
    if (!clearUndo || !clearUndoCurrent) {
      setClearUndo(null);
      setMessage('Terugzetten geweigerd: na het wissen zijn gegevens in dit tabblad gewijzigd.');
      return;
    }
    setItems(clearUndo.previous.items);
    setHistory(clearUndo.previous.history);
    resetAftercareRestoreEphemera();
    setClearUndo(null);
    setAftercareImportUndo(null);
    setIncoming(null);
    setIncomingSource('');
    setIncomingRiskApproved(false);
    setClearPending(false);
    setDraft(EMPTY);
    setEditing(null);
    setFilter('alles');
    setIssueSearch('');
    setIssuePriority('alle');
    setIssueRoom('alle');
    setMessage('Je vorige volledige privé-nazorgdossier staat weer in dit tabblad; geen extern bestand gewijzigd.');
  }
  function undoLastRemoval() {
    if (!removalUndo || !removalUndoCurrent) {
      setRemovalUndo(null);
      setMessage('Terugzetten geweigerd: het nazorgdossier is intussen gewijzigd.');
      return;
    }
    setItems(removalUndo.previous.items);
    setHistory(removalUndo.previous.history);
    setRemovalUndo(null);
    setIncoming(null);
    setIncomingSource('');
    setIncomingRiskApproved(false);
    setPendingBulk(null);
    setBulkSelectedIds([]);
    setPendingDelete(null);
    setHistoryDeletePending(null);
    setMessage('De eerder verwijderde eigen gegevens staan weer in dit tabblad.');
  }

  function previewCompleteSummary() {
    const allChecks: InspectionCheck[] = [...INSPECTION_CHECKS, ...inspectionCustomChecks.map(check => ({
      ...check, tip: 'Eigen toegevoegd controlepunt.'
    }))];
    const lines: string[] = [
      'WOONPOINTS — EIGEN COMPLETE OVERDRACHTSSAMENVATTING',
      'Niet door een verhuurder of inspecteur geverifieerd. Geen bewijs van officiële melding.',
      'Eigen overzichtexport op ' + today(), '',
      'STARTINSPECTIE: ' + allChecks.length + ' controles'
    ];
    for (const room of INSPECTION_ALL_ROOMS) {
      const roomChecks = allChecks.filter(check => check.room === room);
      if (!roomChecks.length) continue;
      lines.push('', room.toUpperCase());
      for (const check of roomChecks) {
        const state = inspectionGrades[check.id] === 'goed' ? 'Zelf in orde bevonden' :
          inspectionGrades[check.id] === 'aandacht' ? 'Eigen aandachtspunt' : 'Niet beoordeeld';
        lines.push('- ' + check.title + ' — ' + state + (check.id.startsWith('custom-') ? ' (eigen controle)' : ''));
        if (includeInspectionSummaryNotes && inspectionGrades[check.id] === 'aandacht' &&
            inspectionNotes[check.id]?.trim()) {
          lines.push('  Privétoelichting: ' + inspectionNotes[check.id].trim());
        }
      }
    }
    lines.push('', 'NAZORG: ' + items.length + ' punten / ' + history.length + ' eigen contactnotities');
    for (const issue of items) {
      lines.push('', issue.room + ' — ' + issue.title, 'Status: ' + issue.status +
        ' · Eigen prioriteit: ' + issue.priority + ' · Eigen streefdatum: ' + (issue.due || 'niet ingesteld'));
      if (includeAftercareSummaryNotes && issue.note.trim()) lines.push('Privénotitie: ' + issue.note.trim());
      const log = history.filter(event => event.issueId === issue.id);
      lines.push('Zelf genoteerde contactmomenten: ' + log.length);
      if (includeContactSummaryNotes) {
        for (const event of log) {
          lines.push('  ' + event.day + ' · ' + event.kind + ' · ' + event.detail.trim());
        }
      }
    }
    lines.push('', 'Alle beoordelingen en statusupdates zijn uitsluitend eigen invoer.',
      'De samenvatting is niet automatisch verstuurd of bevestigd.');
    const output = lines.join('\n') + '\n';
    if (new TextEncoder().encode(output).length > 70 * 1024) {
      setCompleteMessage('De samenvatting overschrijdt 70 KiB. Verkort privénotities.');
      return;
    }
    setCompleteSummaryText(output);
    setCompleteSummarySource(completeSummaryFingerprint);
    setCompleteSummaryApproved(false);
    setCompleteMessage('Bekijk de volledige samenvatting hieronder vóór vrijwillig downloaden.');
  }
  function exportCompletePrintableHandover() {
    if (!completeSummaryCurrent || !completeSummaryApproved) {
      setCompleteMessage('Bevestig eerst de actuele tekstvoorvertoning.'); return;
    }
    const html = completeHandoverPrintHtml(completeSummaryText);
    if (new TextEncoder().encode(html).length > 120 * 1024) {
      setCompleteMessage('Het afdrukbare overzicht is groter dan 120 KiB. Verkort privénotities.');
      return;
    }
    download('woonpoints-eigen-complete-overdracht-afdruk.html',
      html, 'text/html;charset=utf-8');
    setCompleteMessage('Offline afdrukbaar HTML-bestand gedownload. Open het lokaal en kies zelf Afdrukken of Bewaar als PDF. Er is niets verzonden.');
  }
  function exportCompleteSummary() {
    if (!completeSummaryCurrent || !completeSummaryApproved) {
      setCompleteMessage('Maak en controleer eerst een actueel voorbeeld.'); return;
    }
    download('woonpoints-eigen-volledige-overdracht.txt',
      completeSummaryText, 'text/plain;charset=utf-8');
    setCompleteMessage('Zelf gecontroleerde samenvatting gedownload; er is niets automatisch verstuurd.');
  }

  function exportCompleteHandover() {
    if (!completeBackupCurrent) {
      setCompleteMessage('Controleer eerst de actuele inspectie- en nazorggegevens vóór complete JSON-export.');
      return;
    }
    const inspection = JSON.parse(inspectionBackupContents(
      inspectionGrades, inspectionNotes, inspectionCustomChecks));
    const aftercare = { kind: KIND, schema: 2, items, history };
    // Continue honoring each existing module's independent 16 KiB limit.
    if (new TextEncoder().encode(JSON.stringify(inspection)).length > INSPECTION_BACKUP_BYTES ||
        new TextEncoder().encode(JSON.stringify(aftercare)).length > MAX_BYTES) {
      setCompleteMessage('Een onderdeel overschrijdt zijn eigen 16 KiB-back-uplimiet. Verkort notities eerst.');
      return;
    }
    const data = JSON.stringify({
      kind: COMPLETE_HANDOVER_KIND, schema: 1, inspection, aftercare
    }, null, 2);
    if (new TextEncoder().encode(data).length > COMPLETE_HANDOVER_MAX_BYTES) {
      setCompleteMessage('Het complete bestand overschrijdt 40 KiB; export geweigerd.');
      return;
    }
    download('woonpoints-volledige-prive-overdracht.json', data, 'application/json;charset=utf-8');
    setCompleteBackupPreview(null);
    setCompleteMessage('Complete privé-back-up gedownload. Bewaar dit bestand zelf op een veilige plek.');
  }
  async function importCompleteHandover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPendingCompleteImport(null);
    setPendingCompleteSource('');
    setImportRiskApproved(false);
    if (!file) return;
    if (file.size > COMPLETE_HANDOVER_MAX_BYTES) {
      setCompleteMessage('Import geweigerd: maximaal 40 KiB.'); return;
    }
    try {
      const data = readCompleteHandover(await file.text());
      if (new TextEncoder().encode(JSON.stringify({
        kind: KIND, schema: 2, items: data.aftercare.items, history: data.aftercare.history
      }, null, 2)).length > MAX_BYTES) {
        throw Error('Nazorg in deze complete import past niet in een nieuwe 16 KiB-back-up. Huidige gegevens behouden.');
      }
      setPendingCompleteImport(data);
      setPendingCompleteSource(completeDataSignature);
      setImportRiskApproved(false);
      setCompleteMessage('Geldige back-up ingelezen. Bekijk alle verschillen, daarna apart bevestigen.');
    } catch (error) {
      setCompleteMessage(error instanceof Error ? error.message : 'Volledig back-upbestand kon niet worden geopend.');
    }
  }
  /** Switch all related React states in one explicit user event. No disk or network writes. */
  function applyCompleteHandover(data: CompleteHandover) {
    const { inspection, aftercare } = data;
    setInspectionGrades(inspection.grades);
    setInspectionNotes(inspection.notes);
    setInspectionCustomChecks(inspection.custom);
    setInspectionVersion(value => value + 1);
    setItems(aftercare.items);
    setHistory(aftercare.history);
    setPendingCompleteImport(null);
    setPendingCompleteSource('');
    setImportRiskApproved(false);
    setIncoming(null);
    setHistoryTarget(null);
    setHistoryDeletePending(null);
    setDraft(EMPTY);
    setEditing(null);
    setPendingDelete(null);
    setClearPending(false);
    setChosenIssueIds([]);
    setNoticeDraft('');
    setNoticeSource('');
    setNoticeApproved(false);
    setCompleteSummaryApproved(false);
    setCompleteSummaryText('');
    setCompleteSummarySource('');
  }
  function confirmCompleteImport() {
    if (pendingCompleteImport === null || !completeImportCurrent || !importRiskApproved) {
      setCompleteMessage('Import niet uitgevoerd: vergelijk eerst de actuele verschillen en bevestig de vervanging.');
      return;
    }
    // Preserve one previous tab state in RAM only. It can be restored only
    // while the just-imported data is still byte-for-byte equivalent.
    const previous: CompleteHandover = {
      inspection: {
        grades: {...inspectionGrades},
        notes: {...inspectionNotes},
        custom: inspectionCustomChecks.map(row => ({...row})),
        count: Object.values(inspectionGrades).filter(value =>
          value === 'goed' || value === 'aandacht').length
      },
      aftercare: {
        items: items.map(item => ({...item})),
        history: history.map(event => ({...event}))
      }
    };
    const {inspection, aftercare} = pendingCompleteImport;
    const importedSignature = JSON.stringify({
      inspectionGrades: inspection.grades,
      inspectionNotes: inspection.notes,
      inspectionCustomChecks: inspection.custom,
      items: aftercare.items,
      history: aftercare.history
    });
    applyCompleteHandover(pendingCompleteImport);
    setCompleteUndo({previous, importedSignature});
    setConfirmCompleteUndo(false);
    setCompleteMessage('Beide onderdelen hersteld. De vorige tabbladstatus kan zolang niets is gewijzigd één keer worden teruggezet.');
    setMessage('Volledige inspectie en nazorg handmatig uit back-up hersteld.');
  }
  function undoLastCompleteImport() {
    if (!canUndoComplete || completeUndo === null || !confirmCompleteUndo) {
      setConfirmCompleteUndo(false);
      return;
    }
    applyCompleteHandover(completeUndo.previous);
    setCompleteUndo(null);
    setConfirmCompleteUndo(false);
    setCompleteMessage('Vorige tijdelijke tabbladstatus teruggezet. Het geïmporteerde bestand zelf blijft buiten de app bestaan.');
    setMessage('Vorige privé-inspectie en nazorg uit dit tabblad teruggezet.');
  }

  function exportJson() {
    if (items.length === 0 && history.length === 0) {
      setPendingJsonExport(null);
      setMessage('Voeg eerst eigen nazorggegevens toe.');
      return;
    }
    const json = JSON.stringify({ kind: KIND, schema: 2, items, history }, null, 2);
    const bytes = new TextEncoder().encode(json).length;
    if (bytes > MAX_BYTES) {
      setPendingJsonExport(null);
      setJsonExportApproved(false);
      setMessage('Export overschrijdt 16 KiB; verkort notities of verwijder afgeronde items.'); return;
    }
    setPendingJsonExport({
      source: jsonExportSignature, contents: json, itemsCount: items.length,
      historyCount: history.length, bytes
    });
    setJsonExportApproved(false);
    setMessage('De volledige herstelback-up staat klaar voor je eigen controle. Er is nog niets opgeslagen.');
  }
  function confirmJsonExport() {
    if (!jsonExportCurrent || !jsonExportApproved || pendingJsonExport === null) {
      setPendingJsonExport(null);
      setJsonExportApproved(false);
      setMessage('Back-up niet gedownload: gegevens of toestemming zijn veranderd. Bekijk opnieuw.');
      return;
    }
    download('woonpoints-nazorg.json', pendingJsonExport.contents, 'application/json;charset=utf-8');
    setPendingJsonExport(null);
    setJsonExportApproved(false);
    setMessage('Zelf bevestigde volledige privé-JSON gedownload. Externe opslag wordt door jou gekozen.');
  }
  function exportCsv() {
    if (!items.length) { setPendingCsvExport(null); return; }
    const header = ['ruimte', 'punt', 'prioriteit', 'status', 'eigen_deadline', 'gemaakt_op', 'notitie'];
    // Preserve seven fixed columns and all dossier rows. Notes require opt-in.
    const rows = items.map(item => [item.room, item.title, item.priority, item.status,
      item.due, item.created, includePrivateCsvNotes ? item.note : '']);
    const preview = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
    if (preview.length > 100000) {
      setPendingCsvExport(null);
      setMessage('CSV-export is te groot; verkort eerst eigen dossierregels.');
      return;
    }
    setPendingCsvExport({source: csvExportSignature, preview, count: items.length});
    setMessage('Volledige eigen CSV klaargezet. Controleer elke regel en bevestig apart vóór download.');
  }
  function confirmCsvExport() {
    if (pendingCsvExport === null || !csvExportCurrent) {
      setPendingCsvExport(null);
      setMessage('CSV geweigerd: privékeuze of dossier is veranderd; controleer een nieuw voorbeeld.');
      return;
    }
    download('woonpoints-nazorg.csv', pendingCsvExport.preview, 'text/csv;charset=utf-8');
    setPendingCsvExport(null);
    setMessage('Exact gecontroleerde privé-CSV van ' + items.length +
      ' punten gedownload, zonder externe verzending.');
  }

  function prepareTimelineExport() {
    if (!contactTimeline.length) {
      setTimelineExportPreview(null);
      setTimelineExportApproved(false);
      setTimelineExportFeedback('Er zijn geen zelf genoteerde contactmomenten binnen de huidige filters.');
      return;
    }
    const rows = contactTimeline.map(({event, item}) => ({
      date: event.day,
      kind: CONTACT_TYPES.find(type => type.id === event.kind)?.title || 'Eigen notitie',
      room: reportLine(item.room),
      title: reportLine(item.title),
      status: item.status,
      // Free contact details are private; opt-in is reset per export approval.
      detail: includeTimelinePrivateNotes ? reportLine(event.detail) : ''
    }));
    const content = timelineExportFormat === 'csv'
      ? [
          ['datum', 'eigen_contactsoort', 'ruimte', 'nazorgpunt', 'eigen_status', 'prive_contactnotitie'],
          ...rows.map(row => [row.date, row.kind, row.room, row.title, row.status, row.detail])
        ].map(columns => columns.map(csvCell).join(',')).join('\r\n') + '\r\n'
      : [
          'WOONPOINTS · EIGEN CONTACTTIJDLIJN',
          'Uitsluitend zelf ingevoerde notities; geen bewijs van officiële verzending, reactie of afspraak.',
          'Huidige selectie: ' + contactTimeline.length + ' van ' + history.length + ' eigen contactmomenten.',
          'Vrije privé-contactnotities: ' + (includeTimelinePrivateNotes ? 'bewust opgenomen' : 'weggelaten'),
          '',
          ...rows.flatMap((row, index) => [
            (index + 1) + '. ' + row.date + ' · ' + row.kind,
            '   ' + row.room + ': ' + row.title + ' · Eigen status: ' + row.status,
            ...(includeTimelinePrivateNotes ? ['   Mijn eigen contacttekst: ' + row.detail] : []),
            ''
          ]),
          'Controleer originele correspondentie voordat je deze zelf opgestelde tijdlijn deelt.'
        ].join('\n') + '\n';
    const bytes = new TextEncoder().encode(content).length;
    if (bytes > 95 * 1024) {
      setTimelineExportPreview(null);
      setTimelineExportApproved(false);
      setTimelineExportFeedback('Deze export zou te groot worden; beperk de huidige filters.');
      return;
    }
    setTimelineExportPreview({
      signature: timelineExportSignature, count: rows.length, format: timelineExportFormat, content
    });
    setTimelineExportApproved(false);
    setTimelineExportFeedback('Bekijk de volledige actuele inhoud en geef daarna apart toestemming voor de download.');
  }
  function confirmTimelineExport() {
    if (!timelineExportIsCurrent || !timelineExportApproved || !timelineExportPreview ||
        contactTimeline.length === 0) {
      setTimelineExportPreview(null);
      setTimelineExportApproved(false);
      setTimelineExportFeedback('Export geweigerd: de bron, filters of privacykeuze zijn veranderd.');
      return;
    }
    download('woonpoints-eigen-contacttijdlijn.' + timelineExportPreview.format,
      timelineExportPreview.content,
      timelineExportPreview.format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8');
    setTimelineExportPreview(null);
    setTimelineExportApproved(false);
    setTimelineExportFeedback('Je gecontroleerde privé-contacttijdlijn is lokaal gedownload. Er is niets verstuurd.');
  }

  function exportCalendar() {
    if (dueActive.length === 0) { setMessage('Voeg eerst een open punt met eigen streefdatum toe.'); return; }
    download('woonpoints-eigen-nazorgdeadlines.ics', calendarFor(dueActive), 'text/calendar;charset=utf-8');
    setMessage('Eigen ICS-agenda gemaakt. Import en herinneringen worden uitsluitend door je agenda-app beheerd.');
  }

  function exportOwnAppointments() {
    if (ownAppointments.length === 0) {
      setMessage('Geen toekomstige eigen afspraaknotities bij open aandachtspunten gevonden.');
      return;
    }
    download('woonpoints-eigen-afspraaknotities.ics',
      calendarForOwnAppointments(ownAppointments), 'text/calendar;charset=utf-8');
    setMessage('Je eigen afspraaknotities zijn als ICS opgeslagen; er is niets gepland of geverifieerd bij derden.');
  }

  function openNoticeFromInbox(id: string, mode: 'eerste-melding' | 'opvolging') {
    if (!active.some(item => item.id === id)) return;
    setChosenIssueIds(previous => {
      // Remove choices that are no longer open; don't allow a stale choice to consume a slot.
      const stillActive = previous.filter(key => active.some(item => item.id === key));
      return stillActive.includes(id) || stillActive.length >= 12 ? stillActive : [...stillActive, id];
    });
    setNoticeMode(mode);
    setNoticeSubject(current => {
      if (mode === 'opvolging' && current === 'Open aandachtspunten na mijn verhuizing') {
        return 'Navraag over open aandachtspunten na mijn verhuizing';
      }
      if (mode === 'eerste-melding' && current === 'Navraag over open aandachtspunten na mijn verhuizing') {
        return 'Open aandachtspunten na mijn verhuizing';
      }
      return current;
    });
    setNoticeApproved(false);
    document.getElementById('nazorg-notice-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function toggleNoticeItem(id: string) {
    setChosenIssueIds(previous => {
      // Completed/deleted points cannot permanently consume one of the 12 choices.
      const current = previous.filter(key => active.some(item => item.id === key));
      return current.includes(id)
        ? current.filter(existing => existing !== id)
        : current.length >= 12 ? current : [...current, id];
    });
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
      noticeMode === 'opvolging'
        ? 'Ik vraag graag naar de actuele stand van onderstaande punten. Mijn genoteerde contactdatums zijn geen onafhankelijk verzendbewijs.'
        : 'Ik wil de volgende door mij geconstateerde aandachtspunten bespreken en hoor graag wat een passende vervolgstap is.',
      ''
    ];
    noticeItems.forEach((item, i) => {
      lines.push(
        `${i + 1}. ${item.room}: ${item.title} (eigen prioriteit: ${item.priority})`,
        ...(includeDetails && item.note.trim() ? ['Mijn toelichting: ' + item.note.replace(/\s+/g, ' ').trim()] : []),
        ...(item.due ? ['Mijn eigen streefdatum: ' + item.due + ' (niet met u afgesproken)'] : []),
        ...(noticeMode === 'opvolging' ? [
          'Mijn laatst zelf genoteerde verzenddatum: ' +
          (noticeOwnContactDates.find(row => row.id === item.id)?.lastOwnSentDay || 'niet vastgelegd') +
          ' (controleer de originele correspondentie)'
        ] : []),
        ''
      );
    });
    lines.push(
      noticeMode === 'opvolging'
        ? 'Kunt u aangeven of er een vervolgstap nodig is en wat de huidige status volgens u is?'
        : 'Kunt u aangeven of en hoe ik deze punten verder moet melden of laten beoordelen?',
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
    if (!shown.length) { setPendingTextExport(null); return; }
    const lines = [
      'WOONPOINTS — eigen nazorgoverzicht',
      'Alleen ' + shown.length + ' zelf gekozen zichtbare punten.',
      'Niet verzonden of juridisch geverifieerd.',
      includePrivateTxtNotes ? 'Privénotities bewust INBEGREPEN.' : 'Privénotities bewust VERBORGEN.',
      ''
    ];
    for (const item of shown) {
      lines.push(`${item.room} — ${item.title}`,
        `Status: ${item.status} · Prioriteit: ${item.priority} · Eigen streefdatum: ${item.due || 'geen'}`,
        includePrivateTxtNotes ? (item.note || '(geen eigen toelichting)') : '(privénotitie verborgen)', '');
    }
    const preview = lines.join('\n');
    if (preview.length > 100000) {
      setPendingTextExport(null);
      setMessage('Dit overzicht is te groot; beperk eerst je eigen selectie.');
      return;
    }
    setPendingTextExport({source: textExportSignature, preview, count: shown.length});
    setMessage('Voorbeeld klaargezet. Controleer de volledige tekst en bevestig pas daarna de eigen download.');
  }
  function confirmTextExport() {
    if (pendingTextExport === null || !textExportCurrent) {
      setPendingTextExport(null);
      setMessage('Export geweigerd: selectie, privéoptie of dossier is gewijzigd. Maak een nieuw voorbeeld.');
      return;
    }
    download('woonpoints-nazorg-overzicht.txt', pendingTextExport.preview, 'text/plain;charset=utf-8');
    setPendingTextExport(null);
    setMessage('Zelf gecontroleerd TXT-overzicht van ' + shown.length + ' punten gedownload; niets verstuurd.');
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setIncoming(null);
    setIncomingMode('replace');
    setMergeConflictChoices({});
    setIncomingSource('');
    setIncomingRiskApproved(false);
    if (!file) return;
    if (file.size > MAX_BYTES) { setMessage('Import geweigerd: maximaal 16 KiB.'); return; }
    try {
      const value = readBackup(await file.text());
      if (new TextEncoder().encode(JSON.stringify({
        kind: KIND, schema: 2, items: value.items, history: value.history
      }, null, 2)).length > MAX_BYTES) {
        throw Error('Dit bestand kan niet opnieuw als eigen 16 KiB-JSON-back-up worden bewaard. Huidige gegevens behouden.');
      }
      setIncoming(value);
      setIncomingSource(JSON.stringify({ items, history }));
      setIncomingRiskApproved(false);
      setMessage(`Gecontroleerd bestand: ${value.items.length} punten, ${value.history.length} contactmomenten. Bekijk eerst alle verschillen en bevestig opnieuw.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Import kon niet worden gelezen.');
    }
  }

  function resetAftercareRestoreEphemera() {
    // Replaced local data invalidates preexisting selections, message previews,
    // bulk undo and all export/download consents, not just the visible edit form.
    setChosenIssueIds([]);
    setNoticeDraft('');
    setNoticeSource('');
    setNoticeApproved(false);
    setBulkSelectedIds([]);
    setPendingBulk(null);
    setBulkUndo(null);
    setRemovalUndo(null);
    setPendingTextExport(null);
    setPendingCsvExport(null);
    setPendingJsonExport(null);
    setJsonExportApproved(false);
    setCompleteBackupPreview(null);
    setCompleteSummaryText('');
    setCompleteSummarySource('');
    setCompleteSummaryApproved(false);
    setPendingCompleteImport(null);
    setPendingCompleteSource('');
    setImportRiskApproved(false);
  }
  function confirmAftercareImport() {
    if (incoming === null || !incomingCurrent || !incomingRiskApproved) {
      setIncomingRiskApproved(false);
      setMessage('Import geweigerd: controleer opnieuw het actuele dossier en de gekozen importwijze.');
      return;
    }
    const merged = incomingMode === 'merge'
      ? planPrivateAftercareMerge({items, history}, incoming, mergeConflictChoices) : null;
    if (merged && !merged.ready) {
      setIncomingRiskApproved(false);
      setMessage('Samenvoegen geweigerd: ' + merged.reason);
      return;
    }
    const next: AftercareBackup = merged
      ? {items: merged.items, history: merged.history}
      : {items: incoming.items, history: incoming.history};
    const previous: AftercareBackup = {
      items: items.map(item => ({ ...item })),
      history: history.map(event => ({ ...event }))
    };
    const importedSignature = JSON.stringify(next);
    setAftercareImportUndo({ previous, importedSignature });
    setItems(next.items);
    setHistory(next.history);
    resetAftercareRestoreEphemera();
    setHistoryTarget(null);
    setHistoryDeletePending(null);
    setClearUndo(null);
    setIncoming(null);
    setIncomingMode('replace');
    setMergeConflictChoices({});
    setIncomingSource('');
    setIncomingRiskApproved(false);
    setDraft(EMPTY);
    setEditing(null);
    setClearPending(false);
    setPendingDelete(null);
    setIssueSearch('');
    setIssuePriority('alle');
    setIssueRoom('alle');
    setFilter('alles');
    setMessage(incomingMode === 'merge'
      ? 'Eigen bestanden veilig samengevoegd: bestaande punten en contactnotities niet vervangen. De vorige tabbladstatus is eenmalig herstelbaar zolang niets verandert.'
      : 'Import bevestigd. Alle punten zichtbaar; de vorige lokale status is eenmaal veilig herstelbaar zolang niets verandert.');
  }
  function undoAftercareImport() {
    if (!aftercareImportUndo || !aftercareUndoCurrent) {
      setAftercareImportUndo(null);
      setMessage('Vorige import kan niet worden teruggedraaid: eigen gegevens zijn gewijzigd.');
      return;
    }
    setItems(aftercareImportUndo.previous.items);
    setHistory(aftercareImportUndo.previous.history);
    resetAftercareRestoreEphemera();
    setIncoming(null);
    setIncomingRiskApproved(false);
    setIncomingSource('');
    setPendingDelete(null);
    setHistoryDeletePending(null);
    setHistoryTarget(null);
    setEditing(null);
    setDraft(EMPTY);
    setBulkSelectedIds([]);
    setPendingBulk(null);
    setAftercareImportUndo(null);
    setFilter('alles');
    setIssueSearch('');
    setIssuePriority('alle');
    setIssueRoom('alle');
    setMessage('Vorige eigen nazorgstatus hersteld uit dit tabblad. Externe bestanden blijven onaangetast.');
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
        .aftercare .aftercare-inspection-room { border:1px solid #bdcfc2; border-radius:10px; margin:12px 0; padding:12px 14px; background:#f8faf8; }
        .aftercare .aftercare-inspection-room summary { cursor:pointer; padding:7px 0; font-size:17px; }
        .aftercare .aftercare-inspection-check { border:1px solid #d7e3d9; border-radius:10px; background:#fff; margin:12px 0; padding:12px; min-width:0; }
        .aftercare .aftercare-inspection-check legend { padding:0 4px; }
        .aftercare .aftercare-inspection-check .aftercare-actions label { display:inline-flex; gap:7px; align-items:center; font-weight:600; margin:0; cursor:pointer; }
        .aftercare .aftercare-inspection-check input[type="radio"] { display:inline-block; width:18px; min-width:18px; height:18px; min-height:18px; margin:0; padding:0; accent-color:#355e42; }
        .aftercare .aftercare-inspection-room progress { display:block; }

        .aftercare .aftercare-stats { display:flex; flex-wrap:wrap; gap:12px; padding:0; list-style:none; }
        .aftercare .aftercare-stats li { background:#edf2ee; padding:10px 14px; border-radius:10px; }
        .aftercare .aftercare-check { display:flex; align-items:start; gap:10px; font-weight:500; margin:12px 0; }
        .aftercare .aftercare-check input[type=checkbox] { width:22px; height:22px; min-height:22px; flex:0 0 22px; }
        .aftercare .aftercare-notice-picks { min-width:0; border:1px solid #d0e0d4; border-radius:12px; padding:12px; }
        .aftercare .aftercare-notice-picks legend { font-weight:700; }
        .aftercare .aftercare-notice-picks ul { list-style:none; margin:0; padding:0; max-height:350px; overflow:auto; }
        .aftercare #nazorg-notice-text { min-height:290px; }
        .aftercare .aftercare-history { background:#fff; border:1px solid #d0e0d4; border-radius:10px; padding:12px; margin:12px 0; }
        .aftercare .aftercare-history summary { cursor:pointer; font-weight:700; color:#355e42; }
        .aftercare .aftercare-history ol { padding-left:24px; }
        .aftercare .aftercare-history li { margin:12px 0; padding:8px 0; border-bottom:1px solid #d0e0d4; }


        @media(max-width:650px) { .aftercare .aftercare-grid { grid-template-columns:1fr; } }
      `}</style>
      
      <header className="hero">
        <p className="eyebrow">PRIVÉ VERHUISNAZORG</p>
        <h2>Gebreken en open punten op één plek.</h2>
        <p className="lede">Leg zelf vast wat je na de sleuteloverdracht wilt controleren, melden of opvolgen. Alles blijft in dit tabblad totdat je bewust een bestand opslaat.</p>
      </header>
      <PrivateArrivalInspection key={inspectionVersion}
        items={items} onTransfer={createFromInspection}
        grades={inspectionGrades} setGrades={setInspectionGrades}
        notes={inspectionNotes} setNotes={setInspectionNotes}
        customChecks={inspectionCustomChecks} setCustomChecks={setInspectionCustomChecks} />
      <section className="panel" aria-labelledby="nazorg-status">
        <div>
          <h2 id="nazorg-status">Je eigen overzicht</h2>
          <p>Geen WoningNet-, verhuurder- of meldportaalverbinding. ‘Gemeld’ betekent alleen dat jij dit zelf hebt aangegeven.</p>
          {overdue.length > 0 && <p className="aftercare-warning" role="status">{overdue.length} eigen streefdatum{overdue.length === 1 ? ' is' : 's zijn'} verstreken. Controleer wat echt is afgesproken.</p>}
          <p>Beschikbare ruimte voor je eigen nazorgback-up: <strong>{Math.max(0, MAX_BYTES - aftercareBackupBytes)}</strong> van
            {' '}{MAX_BYTES} bytes over. De app weigert toevoegen en bewerken dat een nieuwe JSON-back-up onmogelijk maakt.</p>
          {aftercareBackupPercent >= 85 && <p className="aftercare-warning" role="status">
            Je dossier is bijna vol. Download desgewenst eerst een eigen back-up en verkort oudere notities.
            Er wordt niets automatisch verwijderd.</p>}
        </div>
        <ul className="aftercare-stats">
          <li><strong>{items.length}</strong> vastgelegd</li>
          <li><strong>{active.length}</strong> nog open</li>
          <li><strong>{overdue.length}</strong> eigen deadlines verstreken</li>
          <li><strong>{items.filter(item => item.status === 'afgerond').length}</strong> afgerond</li>
          <li><strong>{aftercareBackupPercent}%</strong> gebruikte privé-JSON-ruimte</li>
        </ul>
      </section>


      <section className="panel" aria-labelledby="nazorg-action-inbox">
        <div>
          <p className="eyebrow">WAT VRAAGT JE AANDACHT?</p>
          <h2 id="nazorg-action-inbox">Mijn nazorg-acties</h2>
          <p>Een overzicht op basis van jouw eigen data: <strong>{attentionCount} aandachtspunt{attentionCount === 1 ? '' : 'en'}</strong> om na te lopen.
            Eigen prioriteit en streefdatum zijn geen juridisch oordeel of officieel afgesproken termijn. Een zelf aangevinkte melding is geen bewijs van verzending.</p>
        </div>
        <div>
          {followUpInbox.length === 0 ? <p>Geen open nazorgpunten. Voeg een punt toe of bekijk afgeronde punten in je dossier.</p> :
            <ol className="aftercare-list">
              {followUpInbox.slice(0, showAllFollowUps ? 80 : 16).map(entry => <li key={entry.item.id} className="aftercare-item">
                <strong>{entry.item.room}: {entry.item.title}</strong>
                <p>{entry.reason}</p>
                <button type="button" className="secondary"
                  onClick={() => openIssueFromInbox(entry.item.id)}>
                  Bekijk dit punt in mijn dossier ↓
                </button>
                <p>Eigen prioriteit: {entry.item.priority} · Status: {entry.item.status}
                  {entry.item.due ? ' · Eigen datum: ' + entry.item.due : ' · Geen datum'}
                  {entry.ownContact ? ' · Laatst zelf genoteerd verzonden: ' + entry.ownContact.day : ''}
                  {entry.ownFutureAppointment ? ' · Eigen toekomstige afspraaknotitie aanwezig' : ''}
                </p>
                <button type="button" className="secondary"
                  disabled={!chosenIssueIds.includes(entry.item.id) && noticeItems.length >= 12}
                  onClick={() => openNoticeFromInbox(entry.item.id, 'eerste-melding')}>
                  {chosenIssueIds.includes(entry.item.id) ? 'Bekijk mijn conceptselectie ↓' : 'Neem op in eigen concept ↓'}
                </button>
                {(entry.ownContact || entry.item.status === 'gemeld') &&
                  <button type="button" className="secondary"
                    disabled={!chosenIssueIds.includes(entry.item.id) && noticeItems.length >= 12}
                    onClick={() => openNoticeFromInbox(entry.item.id, 'opvolging')}>
                    Maak een eigen opvolgconcept ↓
                  </button>}
              </li>)}
            </ol>}
          {followUpInbox.length > 16 && <div>
            <p>Je ziet {showAllFollowUps ? 'alle' : 'de eerste 16 van'} {followUpInbox.length} eigen open punten. Niets is automatisch afgesloten.</p>
            <button type="button" className="secondary" aria-expanded={showAllFollowUps}
              onClick={() => setShowAllFollowUps(!showAllFollowUps)}>
              {showAllFollowUps ? 'Toon eerste 16' : 'Toon alle eigen nazorg-acties'}
            </button>
          </div>}
          <p>Conceptkeuze is handmatig en verstuurt niets. Contactmomenten en eigen status pas je per punt in het dossier hieronder aan.</p>
        </div>
      </section>
      <PrivateAftercareWeekPlan
        day={currentDay}
        sourceFingerprint={JSON.stringify({items, history})}
        actions={followUpInbox.map(({item, urgency, reason}) => ({
          id: item.id, title: item.title, room: item.room,
          priority: item.priority, status: item.status === 'afgerond' ? 'open' : item.status,
          due: item.due, urgency, reason
        }))}
        appointments={ownAppointments.map(({event, item}) => ({
          id: event.id, issueId: item.id, day: event.day, title: item.title, room: item.room
        }))}
        onOpen={openIssueFromInbox}
        onPrepareNotice={(ids, mode) => {
          const valid = ids.length > 0 && ids.length <= 12 &&
            new Set(ids).size === ids.length &&
            ids.every(id => active.some(item => item.id === id));
          if (!valid) {
            setMessage('Kies maximaal 12 actuele punten uit je huidige nazorgplan.');
            return;
          }
          setChosenIssueIds(ids);
          setNoticeMode(mode);
          setNoticeSubject(mode === 'opvolging'
            ? 'Navraag over open aandachtspunten na mijn verhuizing'
            : 'Open aandachtspunten na mijn verhuizing');
          setNoticeDraft('');
          setNoticeSource('');
          setNoticeApproved(false);
          setMessage('Je gekozen punten staan klaar in de bestaande editor. Controleer het hele concept.');
          document.getElementById('nazorg-notice-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onDownload={text => download('woonpoints-prive-nazorgplan.txt',
          text, 'text/plain;charset=utf-8')}
        onDownloadCalendar={text => download('woonpoints-geselecteerde-eigen-nazorg.ics',
          text, 'text/calendar;charset=utf-8')}
      />
      <section className="panel" aria-labelledby="nazorg-contactlijn">
        <div>
          <p className="eyebrow">EIGEN CHRONOLOGIE</p>
          <h2 id="nazorg-contactlijn">Mijn eigen contacttijdlijn</h2>
          <p>Alle zelf vastgelegde contactmomenten bij je nazorgpunten in één overzicht,
            met een directe route naar het bijbehorende dossier. Dit zijn uitsluitend
            je eigen notities: geen geverifieerde verzendingen, afspraken of reacties.</p>
          <label htmlFor="nazorg-timeline-kind">Soort eigen contactnotitie</label>
          <select id="nazorg-timeline-kind" value={contactTimelineKind}
            onChange={event => setContactTimelineKind(event.target.value as ContactKind | 'alle')}>
            <option value="alle">Alle eigen notities</option>
            {CONTACT_TYPES.map(type => <option key={type.id} value={type.id}>{type.title}</option>)}
          </select>
          <label htmlFor="nazorg-timeline-search">Zoeken in eigen tijdlijn</label>
          <input id="nazorg-timeline-search" type="search" autoComplete="off"
            maxLength={100} value={contactTimelineSearch}
            placeholder="Eigen punt, ruimte, datum of notitie"
            onChange={event => setContactTimelineSearch(event.target.value)} />
          <p role="status" aria-live="polite">
            {contactTimeline.length} van {history.length} zelf genoteerde contactmomenten zichtbaar.
          </p>
          {(contactTimelineSearch || contactTimelineKind !== 'alle') &&
            <button type="button" className="secondary"
              onClick={() => { setContactTimelineSearch(''); setContactTimelineKind('alle'); }}>
              Wis tijdlijnfilters
            </button>}
        </div>
        <div>
          {contactTimeline.length === 0 ? <p>Geen eigen contactmomenten binnen deze filters.
            Voeg een contactmoment toe bij een punt of wis de zoekfilters.</p> :
            <ol className="aftercare-list">
              {contactTimeline.slice(0, expandContactTimeline ? 160 : 20).map(({event, item}) =>
                <li className="aftercare-item" key={event.id}>
                  <strong>{event.day} · {CONTACT_TYPES.find(type => type.id === event.kind)?.title}</strong>
                  <p>{item.room} · {item.title} · Eigen status: {item.status}</p>
                  <details className="aftercare-history">
                    <summary>Bekijk mijn privénotitie</summary>
                    <p className="aftercare-note">{event.detail}</p>
                  </details>
                  <button type="button" className="secondary"
                    onClick={() => openIssueFromInbox(item.id)}>
                    Open het bijbehorende eigen nazorgpunt ↓
                  </button>
                  <button type="button" className="secondary" onClick={() => {
                    beginContactCorrection(event);
                    openIssueFromInbox(item.id);
                  }}>
                    Corrigeer deze eigen tijdlijnnotitie ↓
                  </button>
                </li>)}
            </ol>}
          {contactTimeline.length > 20 && <button type="button" className="secondary"
            aria-expanded={expandContactTimeline}
            onClick={() => setExpandContactTimeline(!expandContactTimeline)}>
            {expandContactTimeline ? 'Toon eerste 20 momenten' :
              'Toon alle ' + contactTimeline.length + ' momenten'}
          </button>}
          <div className="aftercare-confirm" role="group" aria-labelledby="nazorg-timeline-export-title">
            <h3 id="nazorg-timeline-export-title">Mijn eigen contacttijdlijn exporteren</h3>
            <p>Maak een chronologisch overzicht van de <strong>{contactTimeline.length}</strong> momenteel
              gefilterde zelf genoteerde contactmomenten. Een contactnotitie is geen verzendbewijs
              of geverifieerde verhuurderreactie. Er wordt niets automatisch verzonden.</p>
            <label htmlFor="nazorg-timeline-export-format">Bestandsformaat</label>
            <select id="nazorg-timeline-export-format" value={timelineExportFormat}
              onChange={e => {
                setTimelineExportFormat(e.target.value === 'csv' ? 'csv' : 'txt');
                setTimelineExportPreview(null); setTimelineExportApproved(false);
              }}>
              <option value="txt">Leesbare tekst (.txt)</option>
              <option value="csv">Spreadsheet met vaste kolommen (.csv)</option>
            </select>
            <label className="aftercare-check" htmlFor="nazorg-timeline-export-notes">
              <input id="nazorg-timeline-export-notes" type="checkbox"
                checked={includeTimelinePrivateNotes}
                onChange={e => {
                  setIncludeTimelinePrivateNotes(e.target.checked);
                  setTimelineExportPreview(null); setTimelineExportApproved(false);
                }} />
              Neem mijn vrije privécontactnotities bewust op in deze export
            </label>
            <p>Vrije contacttekst is standaard uitgesloten. Filters, het dossier en je privacykeuze
              bepalen precies wat dit bestand bevat; het vervangt je volledige herstel-JSON niet.</p>
            <button type="button" disabled={!contactTimeline.length} onClick={prepareTimelineExport}>
              Bekijk volledige gefilterde export vóór downloaden
            </button>
            {timelineExportPreview && <div className="aftercare-confirm"
              role="group" aria-label="Contacttijdlijnbestand controleren">
              <p><strong>{timelineExportPreview.count}</strong> contactmomenten ·
                {' '}{timelineExportPreview.format.toUpperCase()} ·
                eigen privétekst {includeTimelinePrivateNotes ? 'ingeschakeld' : 'uitgeschakeld'}.</p>
              {!timelineExportIsCurrent && <p className="aftercare-warning" role="status">
                Gegevens, filters of privacykeuze zijn gewijzigd. Maak een nieuwe voorvertoning.
              </p>}
              <details className="aftercare-history" open={timelineExportIsCurrent}>
                <summary>Bekijk mijn volledige daadwerkelijke exportinhoud</summary>
                <pre className="aftercare-note" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>
                  {timelineExportPreview.content}
                </pre>
              </details>
              <label className="aftercare-check" htmlFor="nazorg-timeline-export-approve">
                <input type="checkbox" id="nazorg-timeline-export-approve"
                  disabled={!timelineExportIsCurrent}
                  checked={timelineExportApproved && timelineExportIsCurrent}
                  onChange={e => setTimelineExportApproved(e.target.checked)} />
                Ik heb de volledige actuele export bekeken en kies zelf waar ik dit privébestand bewaar.
              </label>
              <div className="aftercare-actions">
                <button type="button" disabled={!timelineExportIsCurrent || !timelineExportApproved}
                  onClick={confirmTimelineExport}>Download precies mijn gecontroleerde bestand</button>
                <button type="button" className="secondary"
                  onClick={() => { setTimelineExportPreview(null); setTimelineExportApproved(false); }}>
                  Niet downloaden
                </button>
              </div>
            </div>}
            <p role="status" aria-live="polite">{timelineExportFeedback}</p>
          </div>
          <p>Vrije contacttekst blijft in de tijdlijn zelf ingeklapt totdat je deze opent.
            Een eventuele eigen download kan buiten Woonpoints worden bewaard of gesynchroniseerd.</p>
        </div>
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
      <section className="panel" aria-labelledby="nazorg-own-appointments">
        <div>
          <p className="eyebrow">EIGEN AFSPRAAKNOTITIES</p>
          <h2 id="nazorg-own-appointments">Wat staat er in mijn eigen agenda?</h2>
          <p>Zie toekomstige afspraaknotities die je zelf in de contacthistorie van open nazorgpunten hebt ingevoerd.
            Het zijn <strong>geen door een verhuurder bevestigde afspraken</strong>.</p>
        </div>
        <div>
          <p><strong>{ownAppointments.length}</strong> toekomstige eigen notitie{ownAppointments.length === 1 ? '' : 's'} bij open punten.</p>
          {ownAppointments.length > 0 && <ol>
            {ownAppointments.slice(0, 12).map(({ event, item }) =>
              <li key={event.id}><strong>{event.day}</strong> — {item.room}: {item.title}
                <span> (zelf genoteerd; verifieer bij de echte bron)</span></li>)}
          </ol>}
          {ownAppointments.length > 12 && <p>Er zijn nog {ownAppointments.length - 12} toekomstige notities; de ICS bevat alle actuele notities bij open punten.</p>}
          <button type="button" disabled={ownAppointments.length === 0} onClick={exportOwnAppointments}>
            Download eigen afspraaknotities als ICS
          </button>
          <p>Het exportbestand bevat de eigen dag en titel/ruimte, <strong>niet</strong> de vrije privécontacttekst.
            Agenda-apps kunnen het bestand synchroniseren en herinneringen maken. Er wordt niets naar WoningNet of je verhuurder gestuurd.</p>
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
          <label htmlFor="nazorg-search">Zoek in eigen titel, ruimte of privénotitie</label>
          <input id="nazorg-search" type="search" value={issueSearch}
            maxLength={100} autoComplete="off" placeholder="Zoek in je eigen dossier"
            onChange={event => setIssueSearch(event.target.value)} />
          <label htmlFor="nazorg-priority-filter">Eigen prioriteit</label>
          <select id="nazorg-priority-filter" value={issuePriority}
            onChange={event => setIssuePriority(event.target.value as Priority | 'alle')}>
            <option value="alle">Alle prioriteiten</option>
            <option value="dringend">Dringend</option>
            <option value="normaal">Normaal</option>
            <option value="laag">Laag</option>
          </select>
          <label htmlFor="nazorg-room-filter">Ruimte</label>
          <select id="nazorg-room-filter" value={issueRoom}
            onChange={event => setIssueRoom(event.target.value)}>
            <option value="alle">Alle ruimtes</option>
            {issueRooms.map(room => <option key={room} value={room}>{room}</option>)}
          </select>
          <p role="status" aria-live="polite">{shown.length} van {items.length} eigen punten zichtbaar.</p>
          {(issueSearch || issuePriority !== 'alle' || issueRoom !== 'alle') && (
            <button type="button" className="secondary" onClick={() => {
              setIssueSearch(''); setIssuePriority('alle'); setIssueRoom('alle');
            }}>Wis zoek- en prioriteitsfilters</button>
          )}
          <p>Deze filters werken alleen in dit tabblad. De privé-JSON-back-up blijft volledig en ongewijzigd.</p>
        </div>
        <div>
          {removalUndo !== null && <div className="aftercare-confirm" role="group"
            aria-label="Laatste individuele verwijdering ongedaan maken">
            <h3>Laatste verwijdering terugzetten</h3>
            {removalUndoCurrent ? <p>Laatste actie: {removalUndo.label}.
              Je kunt de vorige eigen punten en contactmomenten één keer terugzetten,
              uitsluitend zolang er na de verwijdering niets is gewijzigd.</p> :
              <p className="aftercare-warning" role="status">
                Na deze verwijdering zijn eigen dossiergegevens veranderd.
                Het oude herstelpunt mag nieuwe invoer niet overschrijven.
              </p>}
            <div className="aftercare-actions">
              <button type="button" className="secondary"
                disabled={!removalUndoCurrent} onClick={undoLastRemoval}>
                Herstel de laatst verwijderde gegevens
              </button>
              <button type="button" className="secondary"
                onClick={() => setRemovalUndo(null)}>Vernietig tijdelijk herstelpunt</button>
            </div>
          </div>}
          <div className="aftercare-item" role="group" aria-label="Meerdere eigen nazorgpunten beheren">
            <h3>Meerdere punten tegelijk bijwerken</h3>
            <p>Selecteer hieronder uitsluitend de eigen punten die je zelf hebt gecontroleerd.
              De actie wijzigt alleen hun status in dit tabblad; er wordt geen bericht verzonden
              en geen WoningNet-reactie of officiële afhandeling bevestigd.</p>
            <p role="status">{bulkVisible.length} van {shown.length} zichtbare punten geselecteerd.</p>
            <div className="aftercare-actions">
              <button type="button" className="secondary" disabled={!shown.length}
                onClick={() => { setBulkSelectedIds(shown.map(item => item.id)); setPendingBulk(null); }}>
                Selecteer alle zichtbare punten
              </button>
              <button type="button" className="secondary" disabled={!bulkSelectedIds.length}
                onClick={() => { setBulkSelectedIds([]); setPendingBulk(null); }}>
                Wis selectie
              </button>
              <button type="button" disabled={!bulkVisible.length}
                onClick={() => proposeBulkStatus('afgerond')}>Markeer geselecteerde als afgerond…</button>
              <button type="button" className="secondary" disabled={!bulkVisible.length}
                onClick={() => proposeBulkStatus('open')}>Heropen geselecteerde punten…</button>
            </div>
            {pendingBulk && <div className="aftercare-confirm" role="group"
              aria-label="Wijziging van meerdere eigen punten bevestigen">
              {bulkIsCurrent ? <p>Controleer dit zorgvuldig: {pendingBulk.count} geselecteerde
                eigen punten krijgen status <strong>{pendingBulk.status}</strong>. Hun notities,
                contacthistorie en privé-back-ups blijven ongewijzigd. Er wordt niets extern bevestigd.</p>
                : <p role="status">Het dossier of de selectie is intussen veranderd.
                  Deze oude bevestiging is ongeldig; stel de bulkactie opnieuw samen.</p>}
              {bulkIsCurrent && <details className="aftercare-history">
                <summary>Bekijk eerst alle {bulkVisible.length} eigen statuswijzigingen</summary>
                <ol>{bulkVisible.map(item => <li key={item.id}>
                  {item.room}: {item.title} — {item.status} → {pendingBulk.status}
                </li>)}</ol>
                <p>Deze preview bevat geen privénotities. Bekijk je eigen complete dossier
                  en eventuele afspraken apart vóór je statussen afsluit.</p>
              </details>}
              <div className="aftercare-actions">
                <button type="button" disabled={!bulkIsCurrent}
                  onClick={confirmBulkStatus}>Ja, wijzig {pendingBulk.count} eigen punten</button>
                <button type="button" className="secondary" onClick={() => setPendingBulk(null)}>
                  Annuleer bulkactie
                </button>
              </div>
            </div>}
            {bulkUndo !== null && <div className="aftercare-confirm" role="group"
              aria-label="Laatste bulkstatuswijziging terugdraaien">
              <h4>Laatste eigen bulkactie terugzetten</h4>
              {bulkUndoCurrent ? <p>De vorige status van {bulkUndo.changedCount} eigen punten
                staat nog alleen in dit tabblad. Er is sinds die actie niets aan
                de nazorggegevens veranderd. Terugdraaien verandert geen externe berichten.</p>
                : <p role="status">Sinds die actie zijn eigen punten of contactnotities gewijzigd.
                  Het vorige herstelpunt kan niet veilig worden teruggezet.</p>}
              <div className="aftercare-actions">
                <button type="button" className="secondary" disabled={!bulkUndoCurrent}
                  onClick={undoLastBulkStatus}>Herstel de vorige eigen statussen</button>
                <button type="button" className="secondary"
                  onClick={() => setBulkUndo(null)}>Verwijder dit herstelpunt</button>
              </div>
            </div>}
          </div>
          {contactCorrectionUndo && <div className="aftercare-confirm"
            role="group" aria-label="Contactcorrectie eenmalig terugzetten">
            <h3>Mijn laatste contactcorrectie herstellen</h3>
            <p>{contactCorrectionUndoCurrent
              ? 'Je vorige eigen contacttekst en datum zijn tijdelijk in dit tabblad bewaard.'
              : 'Je dossier is sindsdien gewijzigd. Oude gegevens mogen nieuwe invoer niet overschrijven.'}</p>
            <div className="aftercare-actions">
              <button type="button" className="secondary"
                disabled={!contactCorrectionUndoCurrent} onClick={undoContactCorrection}>
                Herstel vorige contactnotitie
              </button>
              <button type="button" className="secondary"
                onClick={() => setContactCorrectionUndo(null)}>Vernietig dit herstelpunt</button>
            </div>
          </div>}
          {shown.length === 0 ? <p>Geen aandachtspunten binnen deze weergave. Wis de filters om alles terug te zien.</p> :
            <ul className="aftercare-list">{shown.map(item =>
              <li className="aftercare-item" key={item.id}
                id={'nazorg-punt-' + item.id} tabIndex={-1}>
                <label htmlFor={'nazorg-bulk-' + item.id}>
                  <input id={'nazorg-bulk-' + item.id} type="checkbox"
                    style={{display:'inline-block', width:18, minHeight:18, marginRight:8}}
                    checked={bulkSelectedIds.includes(item.id)}
                    onChange={event => {
                      setBulkSelectedIds(current => event.target.checked ?
                        [...current.filter(id => id !== item.id), item.id] :
                        current.filter(id => id !== item.id));
                      setPendingBulk(null);
                    }} />
                  Selecteer dit punt voor eigen bulkactie
                </label>
                <strong>{item.title}</strong>
                <p>{item.room} · <b>{item.priority}</b> · {item.status}</p>
                <p>Eigen streefdatum: {item.due || 'niet ingesteld'}{item.status !== 'afgerond' && item.due && item.due < currentDay ? ' · VERSTREKEN' : ''}</p>
                {item.note && <p className="aftercare-note">{item.note}</p>}
                <button type="button" className="secondary"
                  onClick={() => openCaseSheet(item.id)}>Maak mijn privé-puntoverzicht…</button>
                {caseSheetItemId === item.id && <div className="aftercare-confirm"
                  role="group" aria-label="Eén eigen aandachtspunt zorgvuldig overdragen">
                  <h4>Alleen dit eigen nazorgpunt voorbereiden</h4>
                  <p>Dit overzicht bevat uitsluitend {item.room}: {item.title} en de
                    {' '}{history.filter(row => row.issueId === item.id).length} bijbehorende
                    zelf genoteerde contactmomenten. Het is géén officiële melding of bewijsstuk.</p>
                  <label className="aftercare-check"
                    htmlFor={'nazorg-case-include-note-' + item.id}>
                    <input id={'nazorg-case-include-note-' + item.id} type="checkbox"
                      checked={caseSheetIncludeItemNote}
                      onChange={event => {
                        setCaseSheetIncludeItemNote(event.target.checked);
                        setCaseSheetPreview(null); setCaseSheetApproved(false);
                      }} />
                    Neem mijn vrije privétoelichting bij dit punt bewust op
                  </label>
                  <label className="aftercare-check"
                    htmlFor={'nazorg-case-include-contacts-' + item.id}>
                    <input id={'nazorg-case-include-contacts-' + item.id} type="checkbox"
                      checked={caseSheetIncludeContactDetails}
                      onChange={event => {
                        setCaseSheetIncludeContactDetails(event.target.checked);
                        setCaseSheetPreview(null); setCaseSheetApproved(false);
                      }} />
                    Neem mijn vrije privécontactteksten bewust op
                  </label>
                  <p>De eigen datums, status, titel en contactsoorten zijn zichtbaar.
                    Beide soorten vrije privétekst blijven standaard uit.</p>
                  <div className="aftercare-actions">
                    <button type="button" onClick={prepareCaseSheet}>
                      Bekijk de volledige tekst vóór downloaden
                    </button>
                    <button type="button" className="secondary"
                      onClick={() => {
                        setCaseSheetItemId(null);
                        setCaseSheetPreview(null);
                        setCaseSheetApproved(false);
                      }}>Sluit zonder downloaden</button>
                  </div>
                  {caseSheetPreview && <div className="aftercare-confirm"
                    role="group" aria-label="Eigen nazorgpuntoverzicht controleren">
                    <p>Dit bestand bevat precies één eigen punt met
                      {' '}{caseSheetPreview.contactCount} bijbehorende contactmomenten.</p>
                    {!caseSheetCurrent && <p className="aftercare-warning" role="status">
                      Het dossier of je privacykeuze is veranderd. Maak een nieuwe voorvertoning.
                    </p>}
                    <details className="aftercare-history" open={caseSheetCurrent}>
                      <summary>Bekijk mijn hele daadwerkelijke privébestand</summary>
                      <pre className="aftercare-note" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>
                        {caseSheetPreview.content}
                      </pre>
                    </details>
                    <label className="aftercare-check"
                      htmlFor={'nazorg-case-approve-' + item.id}>
                      <input id={'nazorg-case-approve-' + item.id} type="checkbox"
                        checked={caseSheetApproved && caseSheetCurrent}
                        disabled={!caseSheetCurrent}
                        onChange={event => setCaseSheetApproved(event.target.checked)} />
                      Ik heb het volledige actuele overzicht bekeken en bepaal zelf of en
                      waar ik dit privébestand bewaar.
                    </label>
                    <button type="button" disabled={!caseSheetApproved || !caseSheetCurrent}
                      onClick={confirmCaseSheet}>Download precies dit gecontroleerde puntoverzicht</button>
                  </div>}
                </div>}
                <details className="aftercare-history"
                  open={Boolean(contactCorrection && history.some(event =>
                    event.id === contactCorrection.id && event.issueId === item.id))}>
                  <summary>Mijn contacthistorie ({history.filter(event => event.issueId === item.id).length})</summary>
                  <p>Alleen wat je zelf invult. Geen e-mail-, verhuurder- of WoningNet-verificatie.</p>
                  {history.filter(event => event.issueId === item.id).length > 0 ?
                    <ol>{history.filter(event => event.issueId === item.id)
                      .slice().sort((a, b) => b.day.localeCompare(a.day))
                      .map(log => <li key={log.id}>
                        <strong>{log.day} · {CONTACT_TYPES.find(type => type.id === log.kind)?.title}</strong>
                        <p className="aftercare-note">{log.detail}</p>
                        <button type="button" className="secondary"
                          onClick={() => beginContactCorrection(log)}>Corrigeer dit eigen moment…</button>
                        <button className="secondary" onClick={() => setHistoryDeletePending(log.id)}>Verwijder dit moment…</button>
                        {contactCorrection?.id === log.id && <form className="aftercare-confirm"
                          aria-label="Eigen contactnotitie corrigeren"
                          onSubmit={event => { event.preventDefault(); previewContactCorrection(); }}>
                          <h4>Mijn bestaande contactmoment corrigeren</h4>
                          {contactCorrection.source !== aftercareImportSignature &&
                            <p className="aftercare-warning" role="status">
                              Het dossier is gewijzigd. Open deze notitie opnieuw vóór corrigeren.
                            </p>}
                          <label htmlFor={'nazorg-correct-kind-' + log.id}>Mijn contactsoort</label>
                          <select id={'nazorg-correct-kind-' + log.id} value={contactCorrection.kind}
                            onChange={event => {
                              setContactCorrection({...contactCorrection, kind: event.target.value as ContactKind});
                              setContactCorrectionPreview(null);
                            }}>
                            {CONTACT_TYPES.map(type => <option key={type.id} value={type.id}>{type.title}</option>)}
                          </select>
                          <label htmlFor={'nazorg-correct-date-' + log.id}>Eigen datum</label>
                          <input id={'nazorg-correct-date-' + log.id} type="date" required
                            min="2020-01-01" max="2099-12-31" value={contactCorrection.day}
                            onChange={event => {
                              setContactCorrection({...contactCorrection, day: event.target.value});
                              setContactCorrectionPreview(null);
                            }} />
                          <label htmlFor={'nazorg-correct-text-' + log.id}>Mijn eigen privécontactnotitie</label>
                          <textarea id={'nazorg-correct-text-' + log.id} required maxLength={240}
                            value={contactCorrection.detail}
                            onChange={event => {
                              setContactCorrection({...contactCorrection, detail: event.target.value});
                              setContactCorrectionPreview(null);
                            }} />
                          <div className="aftercare-actions">
                            <button type="submit" disabled={contactCorrection.source !== aftercareImportSignature}>
                              Bekijk mijn wijziging vóór bewaren
                            </button>
                            <button type="button" className="secondary"
                              onClick={() => {setContactCorrection(null);setContactCorrectionPreview(null);}}>
                              Annuleer zonder aanpassing
                            </button>
                          </div>
                          {contactCorrectionPreview && <div className="aftercare-confirm"
                            role="group" aria-label="Vergelijk oude en nieuwe contactnotitie">
                            {!contactCorrectionCurrent && <p className="aftercare-warning" role="status">
                              Bron of concept gewijzigd. Controleer opnieuw.</p>}
                            <p><strong>Oorspronkelijk:</strong> {log.day} ·
                              {' '}{CONTACT_TYPES.find(type => type.id === log.kind)?.title}</p>
                            <p className="aftercare-note">{log.detail}</p>
                            <p><strong>Na correctie:</strong> {contactCorrectionPreview.updated.day} ·
                              {' '}{CONTACT_TYPES.find(type => type.id === contactCorrectionPreview.updated.kind)?.title}</p>
                            <p className="aftercare-note">{contactCorrectionPreview.updated.detail}</p>
                            <p>Alleen je eigen aantekening wordt aangepast. Bestaande correspondentie bij derden
                              verandert niet en wordt hiermee niet geverifieerd.</p>
                            <button type="button" disabled={!contactCorrectionCurrent}
                              onClick={confirmContactCorrection}>
                              Ja, bewaar precies deze correctie
                            </button>
                          </div>}
                        </form>}
                        {historyDeletePending === log.id && <div className="aftercare-confirm">
                          <p>Contactmoment uit dit tabblad wissen?</p>
                          <div className="aftercare-actions">
                            <button onClick={() => removeFollowUp(log.id)}>Ja, wis moment</button>
                            <button className="secondary" onClick={() => setHistoryDeletePending(null)}>Behoud moment</button>
                          </div>
                        </div>}
                      </li>)}</ol> : <p>Nog geen persoonlijke contactmomenten vastgelegd.</p>}
                  <button disabled={history.length >= 160 || history.filter(event => event.issueId === item.id).length >= 8}
                    className="secondary" onClick={() => {
                      setHistoryTarget(item.id); setHistoryDeletePending(null);
                      setHistoryDay(today()); setHistoryKind('eigen-notitie'); setHistoryDetail('');
                    }}>Contactmoment toevoegen</button>
                  {historyTarget === item.id && <form onSubmit={event => addFollowUp(event, item.id)}>
                    <div className="aftercare-grid">
                      <div><label htmlFor={'nazorg-log-kind-' + item.id}>Soort eigen notitie</label>
                        <select id={'nazorg-log-kind-' + item.id} value={historyKind}
                          onChange={event => setHistoryKind(event.target.value as ContactKind)}>
                          {CONTACT_TYPES.map(type => <option key={type.id} value={type.id}>{type.title}</option>)}
                        </select></div>
                      <div><label htmlFor={'nazorg-log-day-' + item.id}>Datum</label>
                        <input id={'nazorg-log-day-' + item.id} type="date" required
                          min="2020-01-01" max="2099-12-31" value={historyDay}
                          onChange={event => setHistoryDay(event.target.value)} /></div>
                    </div>
                    <label htmlFor={'nazorg-log-detail-' + item.id}>Wat heb jij zelf waargenomen of afgesproken?</label>
                    <textarea id={'nazorg-log-detail-' + item.id} required maxLength={240} value={historyDetail}
                      onChange={event => setHistoryDetail(event.target.value)}
                      placeholder="Geen persoonlijke gegevens of vertrouwelijke berichtkopieën" />
                    <div className="aftercare-actions">
                      <button type="submit">Bewaar eigen moment</button>
                      <button className="secondary" type="button" onClick={() => setHistoryTarget(null)}>Annuleer</button>
                    </div>
                  </form>}
                </details>
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
                    <button type="button" onClick={() => removeAftercarePoint(item.id)}>
                      Ja, verwijder inclusief eigen contactnotities
                    </button>
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
          <label htmlFor="nazorg-notice-mode">Type eigen concept</label>
          <select id="nazorg-notice-mode" value={noticeMode} onChange={e => {
            const mode = e.target.value as 'eerste-melding' | 'opvolging';
            setNoticeMode(mode);
            setNoticeSubject(current => mode === 'opvolging' && current === 'Open aandachtspunten na mijn verhuizing'
              ? 'Navraag over open aandachtspunten na mijn verhuizing'
              : mode === 'eerste-melding' && current === 'Navraag over open aandachtspunten na mijn verhuizing'
                ? 'Open aandachtspunten na mijn verhuizing' : current);
            setNoticeApproved(false);
          }}>
            <option value="eerste-melding">Eerste melding of vraag</option>
            <option value="opvolging">Navraag naar eerder besproken punten</option>
          </select>
          {noticeMode === 'opvolging' && <p>Alleen eigen, expliciet genoteerde verzenddatums van geselecteerde punten
            worden genoemd. Geen privécontacttekst en geen onbewezen ontvangst- of verzendclaim.
            Controleer originele berichten en de echte ontvanger zelf.</p>}
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
      <section className="panel" aria-labelledby="complete-handover-title">
        <div>
          <p className="eyebrow">ÉÉN BESTAND · ZELF BEWAREN</p>
          <h2 id="complete-handover-title">Complete privé-overdrachtsback-up</h2>
          <p>Bewaar je volledige zelf beoordeelde startinspectie (ook eigen controles) én alle nazorgpunten
            met contactnotities in één lokaal JSON-bestand. Geen automatische opslag, verhuurdercontact,
            accountkoppeling of officiële status. Je gekozen bestandsprovider kan dit privébestand extern synchroniseren.</p>
          <p>Dit gecombineerde bestand staat los van de bestaande afzonderlijke inspectie- en nazorgback-ups.
            Gebruik die afzonderlijke importknoppen nog steeds voor een gedeeltelijk herstel.</p>
        </div>
        <div>
          <div className="aftercare-actions">
            <button type="button" className="secondary"
              onClick={() => {
                setCompleteBackupPreview(completeDataSignature);
                setCompleteMessage('Controleer de inhoudscategorieën en bevestig eventueel de volledige privéback-up.');
              }}
              disabled={items.length === 0 && history.length === 0 &&
                inspectionCustomChecks.length === 0 &&
                !Object.values(inspectionGrades).some(value => value === 'goed' || value === 'aandacht')}>
              Bekijk complete privé-JSON-overdracht…
            </button>
            {completeBackupPreview !== null && !completeBackupCurrent &&
              <p className="aftercare-warning" role="status">
                Je inspectie of nazorg is veranderd. Bekijk opnieuw de huidige inhoud vóór export.
              </p>}
            {completeBackupCurrent && <div className="aftercare-confirm" role="group"
              aria-label="Complete privé-JSON export bevestigen">
              <p><strong>Alle gegevens van beide modules exporteren?</strong> Dit is een volledige
                herstelback-up: anders dan bij het leesbare TXT/HTML-overzicht worden eventuele
                privétoelichtingen, contactmomenten en eigen datums altijd opgenomen.
                Er is geen afzonderlijke inhoudsfilter voor dit herstelbestand.</p>
              <p>Eigen inspectie: {Object.values(inspectionGrades).filter(value =>
                value === 'goed' || value === 'aandacht').length} beoordelingen en
                {' '}{inspectionCustomChecks.length} eigen controlepunten.</p>
              <p>Eigen nazorg: {items.length} punten en {history.length} contactmomenten
                (met eventuele privégegevens).</p>
              <p>De opslaglocatie die je kiest kan dit bestand buiten Woonpoints delen of synchroniseren.</p>
              <div className="aftercare-actions">
                <button type="button" onClick={exportCompleteHandover}>
                  Ja, download alle privégegevens als herstel-JSON
                </button>
                <button type="button" className="secondary"
                  onClick={() => { setCompleteBackupPreview(null); setCompleteMessage('Volledige JSON-export geannuleerd.'); }}>
                  Niet downloaden
                </button>
              </div>
            </div>}
          </div>
          <div className="aftercare-confirm">
            <h3>Eigen leesbare samenvatting</h3>
            <p>Maak een TXT of een offline HTML-document om zelf als PDF te bewaren.
              Beide gebruiken exact dezelfde gecontroleerde voorvertoning. Kies apart welke
              privé-informatie erin mag: inspectie, nazorg en contactnotities blijven standaard verborgen.</p>
            <div role="group" aria-label="Privacykeuzes voor complete overdracht">
              <label className="aftercare-check" htmlFor="complete-summary-inspection">
                <input id="complete-summary-inspection" type="checkbox"
                  checked={includeInspectionSummaryNotes}
                  onChange={event => {
                    setIncludeInspectionSummaryNotes(event.target.checked);
                    setCompleteSummaryApproved(false);
                  }} />
                Neem mijn privétoelichtingen bij inspectiepunten op
              </label>
              <label className="aftercare-check" htmlFor="complete-summary-aftercare">
                <input id="complete-summary-aftercare" type="checkbox"
                  checked={includeAftercareSummaryNotes}
                  onChange={event => {
                    setIncludeAftercareSummaryNotes(event.target.checked);
                    setCompleteSummaryApproved(false);
                  }} />
                Neem mijn privétoelichtingen bij nazorgpunten op
              </label>
              <label className="aftercare-check" htmlFor="complete-summary-contacts">
                <input id="complete-summary-contacts" type="checkbox"
                  checked={includeContactSummaryNotes}
                  onChange={event => {
                    setIncludeContactSummaryNotes(event.target.checked);
                    setCompleteSummaryApproved(false);
                  }} />
                Neem ook de inhoud en datums van mijn eigen contactnotities op
              </label>
            </div>
            <div className="aftercare-actions">
              <button type="button" className="secondary"
                onClick={previewCompleteSummary}>Maak actuele TXT-voorvertoning</button>
            </div>
            {completeSummaryText && (
              <>
                {!completeSummaryCurrent && <p className="aftercare-warning" role="status">
                  De inspectie, nazorg of exportkeuze is gewijzigd. Maak eerst opnieuw een voorvertoning.
                </p>}
                <label htmlFor="complete-summary-preview">Controleer de exacte inhoud</label>
                <textarea id="complete-summary-preview" readOnly value={completeSummaryText}
                  rows={11} style={{minHeight:'210px'}} />
                <label className="aftercare-checkbox" htmlFor="complete-summary-approve">
                  <input id="complete-summary-approve" type="checkbox"
                    disabled={!completeSummaryCurrent}
                    checked={completeSummaryCurrent && completeSummaryApproved}
                    onChange={event => setCompleteSummaryApproved(event.target.checked)} />
                  Ik heb mijn eigen tekst, eventuele persoonsgegevens en gevoelige informatie nagekeken.
                </label>
                <div className="aftercare-actions">
                  <button type="button" disabled={!completeSummaryCurrent || !completeSummaryApproved}
                    onClick={exportCompleteSummary}>Download gecontroleerde TXT</button>
                  <button type="button" className="secondary"
                    disabled={!completeSummaryCurrent || !completeSummaryApproved}
                    onClick={exportCompletePrintableHandover}>Download afdrukbaar HTML/PDF-bronbestand</button>
                </div>
              </>
            )}
          </div>
          <label htmlFor="complete-handover-import">Open complete Woonpoints-back-up (max. 40 KiB)</label>
          <input type="file" id="complete-handover-import" accept=".json,application/json"
            onChange={importCompleteHandover} />
          {pendingCompleteImport !== null && (
            <div className="aftercare-confirm" role="group" aria-label="Complete import bevestigen">
              <p><strong>Vervang alle tijdelijke inspectie- én nazorggegevens?</strong></p>
              <p>Nieuwe back-up: {pendingCompleteImport.inspection.count} beoordeelde controles,
                {' '}{pendingCompleteImport.inspection.custom.length} eigen controles,
                {' '}{pendingCompleteImport.aftercare.items.length} nazorgpunten en
                {' '}{pendingCompleteImport.aftercare.history.length} contactnotities.</p>
              <p>Huidige sessie: {Object.values(inspectionGrades).filter(value =>
                value === 'goed' || value === 'aandacht').length} beoordelingen,
                {' '}{inspectionCustomChecks.length} eigen controles,
                {' '}{items.length} nazorgpunten en {history.length} contactnotities.
                Deze worden pas na bevestiging vervangen; download desgewenst eerst je huidige privébestand.
                Reeds gedownloade bestanden en extern verzonden berichten blijven uiteraard onaangetast.</p>
              {completeImportImpact && <div role="group" aria-label="Gevolgen complete herstelimport">
                <h3>Wat verandert er precies?</h3>
                <p>Een herstel vervangt beide modules als één geheel. De vergelijking toont eigen
                  titels, statussen en datums, maar geen vrije privénotities of contactinhoud.</p>
                {([
                  {id:'inspection',title:'Inspectie en eigen controlepunten',value:completeImportImpact.inspection},
                  {id:'aftercare',title:'Nazorgpunten',value:completeImportImpact.aftercare},
                  {id:'contacts',title:'Zelf genoteerde contactmomenten',value:completeImportImpact.contacts}
                ] as const).map(group => <details key={group.id} className="aftercare-history">
                  <summary>{group.title}: {group.value.added} erbij · {group.value.removed} verdwijnen ·
                    {' '}{group.value.changed} veranderen</summary>
                  {group.value.details.length === 0 ? <p>Geen wijzigingen voor dit onderdeel.</p> :
                    <ul>{group.value.details.map((entry,index) => <li key={group.id + '-' + index}>
                      <strong>{entry.action}</strong> — {entry.label}
                      {entry.action === 'gewijzigd' ? ' (status, eigenschappen of verborgen privé-inhoud)' : ''}
                    </li>)}</ul>}
                </details>)}
              </div>}
              {!completeImportCurrent && <div className="aftercare-warning" role="status">
                <p>Je huidige gegevens zijn veranderd sinds het bestand werd ingelezen.
                  De oude goedkeuring kan niet worden gebruikt.</p>
                <button type="button" className="secondary" onClick={() => {
                  setPendingCompleteSource(completeDataSignature);
                  setImportRiskApproved(false);
                  setCompleteMessage('De verschillen zijn bijgewerkt. Controleer alle gevolgen opnieuw.');
                }}>Bekijk gewijzigde importgevolgen opnieuw</button>
              </div>}
              <label className="aftercare-check" htmlFor="complete-import-impact-confirm">
                <input id="complete-import-impact-confirm" type="checkbox"
                  checked={completeImportCurrent && importRiskApproved}
                  disabled={!completeImportCurrent}
                  onChange={event => setImportRiskApproved(event.target.checked)} />
                Ik begrijp welke punten en contactmomenten worden vervangen, verwijderd of gewijzigd.
                Ik heb mijn huidige back-up desgewenst zelf bewaard.
              </label>
              <div className="aftercare-actions">
                <button type="button" disabled={!completeImportCurrent || !importRiskApproved}
                  onClick={confirmCompleteImport}>Ja, herstel beide onderdelen</button>
                <button type="button" className="secondary" onClick={() => {
                  setPendingCompleteImport(null);
                  setCompleteMessage('Complete import geannuleerd; inspectie en nazorg blijven onaangetast.');
                }}>Annuleer import</button>
              </div>
            </div>
          )}
          {completeUndo !== null && (
            <div className="aftercare-confirm" role="group" aria-label="Laatste complete import terugdraaien">
              <h3>Laatste complete import terugdraaien</h3>
              <p>De tijdelijke inspectie- en nazorgstatus van vóór de laatste import staat nog
                uitsluitend in het geheugen van dit tabblad. Sluiten wist deze herstelmogelijkheid.
                Bestaande externe bestanden, berichten en originele back-ups veranderen nooit.</p>
              {!canUndoComplete ? (
                <>
                  <p className="aftercare-warning" role="status">Je hebt na import iets gewijzigd.
                    Terugdraaien zou nieuwe invoer overschrijven en is daarom geblokkeerd.</p>
                  <button type="button" className="secondary"
                    onClick={() => { setCompleteUndo(null); setConfirmCompleteUndo(false); }}>
                    Vernietig oud herstelpunt
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="secondary"
                    onClick={() => setConfirmCompleteUndo(true)}>Herstel vorige tabbladstatus…</button>
                  {confirmCompleteUndo && (
                    <div className="aftercare-confirm" role="group" aria-label="Terugdraaien bevestigen">
                      <p>De vorige {completeUndo.previous.inspection.count} inspectiebeoordelingen,
                        {' '}{completeUndo.previous.inspection.custom.length} eigen controles,
                        {' '}{completeUndo.previous.aftercare.items.length} nazorgpunten en
                        {' '}{completeUndo.previous.aftercare.history.length} contactnotities
                        worden teruggezet. De huidige geïmporteerde gegevens verdwijnen uit dit tabblad.</p>
                      <div className="aftercare-actions">
                        <button type="button" onClick={undoLastCompleteImport}>Ja, zet vorige status terug</button>
                        <button type="button" className="secondary"
                          onClick={() => setConfirmCompleteUndo(false)}>Behoud huidige import</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <p role="status" aria-live="polite">{completeMessage}</p>
        </div>
      </section>
      <section className="panel" aria-labelledby="nazorg-backup-title">
        <div>
          <p className="eyebrow">ZELF BEWAREN</p>
          <h2 id="nazorg-backup-title">Back-up en overdracht</h2>
          <p>De versie-2 JSON-back-up bevat ook je zelf genoteerde contactmomenten. Eerdere versie-1 bestanden blijven importeerbaar zonder contacthistorie. CSV/TXT bevatten alleen de aandachtspunten; gebruik JSON voor volledig herstel.</p>
          <p>Bewaar optioneel een volledig JSON-bestand, een CSV-overzicht of een leesbaar TXT-dossier. Export kan via je gekozen bestandsprovider buiten Woonpoints synchroniseren.</p>
          <p>Import vervangt uitsluitend na een aparte bevestiging je huidige tabblad. Woonpoints bewaart geen automatische kopieën.</p>
        </div>
        <div>
          <div className="aftercare-actions">
            <button disabled={!items.length && !history.length} onClick={exportJson}>
              Controleer volledige herstel-JSON…
            </button>
            <button className="secondary" disabled={!items.length} onClick={exportCsv}>
              Controleer volledige CSV van {items.length} punten…
            </button>
            <button className="secondary" disabled={!shown.length} onClick={exportText}>Controleer TXT van {shown.length} zichtbare punten…</button>
          </div>
          {pendingJsonExport !== null && <div className="aftercare-confirm" role="group"
            aria-label="Volledige privé-JSON-back-up vooraf controleren">
            <h3>Controleer je volledige privé-herstelbestand</h3>
            {jsonExportCurrent ? <>
              <p>Dit bestand bewaart {pendingJsonExport.itemsCount} eigen punten,
                {pendingJsonExport.historyCount} zelf genoteerde contactmomenten en eventuele
                vrije privénotities als volledig herstelbestand ({pendingJsonExport.bytes} bytes).
                Ook verborgen, afgeronde en gefilterde punten worden opgenomen.</p>
              <details className="aftercare-history">
                <summary>Bekijk de exacte JSON inclusief privéteksten</summary>
                <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:320,
                  overflowY:'auto',padding:12,background:'#fff',
                  border:'1px solid #b6c7ba',borderRadius:8}}>{pendingJsonExport.contents}</pre>
              </details>
              <label className="aftercare-check" htmlFor="nazorg-json-export-approve">
                <input type="checkbox" id="nazorg-json-export-approve"
                  checked={jsonExportApproved}
                  onChange={event => setJsonExportApproved(event.target.checked)}/>
                Ik begrijp dat de volledige privénotities en contactgeschiedenis in mijn
                gekozen bestand komen, mogelijk in een gesynchroniseerde map.
              </label>
            </> : <p className="aftercare-warning" role="status">
              Je dossier is sinds dit voorbeeld gewijzigd. De eerdere goedkeuring is ongeldig.
              Maak een nieuwe back-upvoorvertoning.
            </p>}
            <div className="aftercare-actions">
              <button type="button" disabled={!jsonExportCurrent || !jsonExportApproved}
                onClick={confirmJsonExport}>Ja, download exact deze privé-JSON</button>
              <button type="button" className="secondary" onClick={() => {
                setPendingJsonExport(null); setJsonExportApproved(false);
                setMessage('Volledige JSON-export geannuleerd zonder download.');
              }}>Annuleer JSON-export</button>
            </div>
          </div>}
          <p>JSON en CSV bevatten alle punten uit het eigen dossier, ongeacht de zichtbare
            filters. CSV bevat privénotities alleen na een aparte bewuste keuze; TXT bevat
            uitsluitend gefilterde zichtbare punten. Beide tekstdelen vereisen een volledig
            voorbeeld en tweede toestemming vóór een bestand wordt gedownload.</p>
          <label className="aftercare-check" htmlFor="nazorg-csv-private-notes">
            <input id="nazorg-csv-private-notes" type="checkbox"
              checked={includePrivateCsvNotes}
              onChange={event => {
                setIncludePrivateCsvNotes(event.target.checked);
                setPendingCsvExport(null);
              }}/>
            Voeg mijn privénotities bewust toe aan de volledige CSV (standaard uit)
          </label>
          {pendingCsvExport !== null && <div className="aftercare-confirm" role="group"
            aria-label="CSV controleren vóór bewaren">
            <h3>Controleer alle CSV-regels vóór downloaden</h3>
            {csvExportCurrent ? <p>{pendingCsvExport.count} eigen dossierpunten, ook buiten
              actieve filters. Privénotities zijn {includePrivateCsvNotes ?
                'bewust opgenomen' : 'bewust weggelaten'}. Dit bevat geen
              geverifieerde melding of WoningNet-bewijs.</p> :
              <p className="aftercare-warning" role="status">
                Het eigen dossier of de privéoptie is gewijzigd; de vorige toestemming
                is ongeldig. Maak een nieuw voorbeeld.
              </p>}
            {csvExportCurrent && <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
              maxHeight:360,overflowY:'auto',padding:12,background:'#fff',
              border:'1px solid #b6c7ba',borderRadius:8}}>{pendingCsvExport.preview}</pre>}
            <div className="aftercare-actions">
              <button type="button" disabled={!csvExportCurrent}
                onClick={confirmCsvExport}>Ja, download exact deze CSV</button>
              <button type="button" className="secondary"
                onClick={() => {setPendingCsvExport(null);setMessage('CSV-download geannuleerd.');}}>
                Annuleer CSV
              </button>
            </div>
          </div>}
          <label className="aftercare-check" htmlFor="nazorg-txt-private-notes">
            <input id="nazorg-txt-private-notes" type="checkbox"
              checked={includePrivateTxtNotes}
              onChange={event => {
                setIncludePrivateTxtNotes(event.target.checked);
                setPendingTextExport(null);
              }}/>
            Voeg mijn privénotities bewust toe aan de TXT (standaard uit)
          </label>
          {pendingTextExport !== null && <div className="aftercare-confirm" role="group"
            aria-label="Privé-TXT controleren vóór de download">
            <h3>Controleer je volledige TXT vóór bewaren</h3>
            {textExportCurrent ? <p>{pendingTextExport.count} zichtbare punten in deze
              momentopname. Privénotities zijn {includePrivateTxtNotes ? 'bewust opgenomen' : 'verborgen'}.
              Controleer hieronder alle regels en bepaal zelf waar het bestand wordt bewaard.</p>
              : <p className="aftercare-warning" role="status">
                Je dossier of de zichtbare selectie is veranderd. Oude toestemming is ongeldig.
                Maak een nieuw TXT-voorbeeld.</p>}
            {textExportCurrent && <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
              maxHeight:360,overflowY:'auto',padding:12,background:'#fff',
              border:'1px solid #b6c7ba',borderRadius:8}}>{pendingTextExport.preview}</pre>}
            <div className="aftercare-actions">
              <button type="button" disabled={!textExportCurrent}
                onClick={confirmTextExport}>Ja, download dit exacte TXT-bestand</button>
              <button type="button" className="secondary"
                onClick={() => {setPendingTextExport(null);setMessage('TXT-download geannuleerd.');}}>
                Annuleer TXT
              </button>
            </div>
          </div>}
          <label htmlFor="nazorg-import">Open eigen nazorg-JSON (max. 16 KiB)</label>
          <input id="nazorg-import" type="file" ref={uploadRef} accept=".json,application/json" onChange={importFile} />
          {incoming !== null && incomingImpact !== null &&
            <div className="aftercare-confirm" role="group" aria-label="Gevolgen nazorgimport beoordelen">
              <h3>Kies hoe je dit eigen bestand verwerkt</h3>
              <div className="aftercare-actions" role="group" aria-label="Manier van eigen nazorgimport">
                <button type="button" className={incomingMode === 'replace' ? '' : 'secondary'}
                  aria-pressed={incomingMode === 'replace'} onClick={() => {
                    setIncomingMode('replace'); setIncomingRiskApproved(false);
                  }}>Bestaande gegevens vervangen</button>
                <button type="button" className={incomingMode === 'merge' ? '' : 'secondary'}
                  aria-pressed={incomingMode === 'merge'} onClick={() => {
                    setIncomingMode('merge'); setIncomingRiskApproved(false);
                  }}>Alleen nieuwe gegevens veilig samenvoegen</button>
              </div>
              <p>Gecontroleerd bestand: {incoming.items.length} punten en {incoming.history.length}
                {' '}contactmomenten. Huidige tab: {items.length} punten en {history.length}
                {' '}contactmomenten. Niets wordt gewijzigd vóór je aparte bevestiging.</p>
              {incomingMode === 'replace' && <p>Deze vervangende import verwijdert huidige
                eigen regels die ontbreken in de back-up. Het overzicht toont wijzigingen,
                inclusief wijzigingen aan verborgen notities, maar nooit hun vrije tekst.</p>}
              {incomingMode === 'merge' && incomingMerge && <div className="aftercare-history"
                role="status" aria-live="polite">
                <h4>Voorbeeld samenvoegen: alleen nieuwe records en handmatig gekozen wijzigingen</h4>
                <p><strong>{incomingMerge.newPoints} extra eigen punten</strong> en
                  <strong> {incomingMerge.newContacts} extra contactmomenten</strong>.
                  {' '}{incomingMerge.skippedPoints} identieke punten en
                  {' '}{incomingMerge.skippedContacts} identieke contactmomenten blijven ongewijzigd.</p>
                <p>Je huidige {items.length} punten en {history.length} contactmomenten
                  blijven bewaard, behalve de <strong>{incomingMerge.updatedPoints} punten</strong> en
                  <strong> {incomingMerge.updatedContacts} contactmomenten</strong>
                  waarvoor je hieronder afzonderlijk kiest de versie uit het bestand over te nemen.
                  Na de samenvoeging zijn er {incomingMerge.items.length} punten en
                  {' '}{incomingMerge.history.length} contactmomenten.</p>
                <p>{incomingMerge.conflictingPoints} conflicterende punt-ID’s en
                  {' '}{incomingMerge.conflictingContacts} conflicterende contact-ID’s.
                  Er blijven nog <strong>{incomingMerge.unresolved} onbesliste conflicten</strong>.
                  Zonder een expliciete keuze bij elk conflict wordt niets toegepast.</p>
                {incomingMerge.conflicts.length > 0 && <fieldset
                  className="aftercare-notice-picks" aria-label="Elk eigen importconflict afzonderlijk oplossen">
                  <legend>Beslis over elk afwijkend eigen record</legend>
                  <ol>{incomingMerge.conflicts.map((conflict, index) =>
                    <li key={conflict.key} className="aftercare-item">
                      <strong>{conflict.kind}: {conflict.label}</strong>
                      <p>Dezelfde ID komt in beide dossiers voor met andere velden.
                        Dat kan een status, titel, datum, koppeling of verborgen privénotitie zijn.</p>
                      <details className="aftercare-history">
                        <summary>Bekijk beide volledige versies (inclusief eigen privénotities)</summary>
                        <p><strong>Mijn huidige tabblad</strong></p>
                        <pre className="aftercare-note" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>
                          {conflict.existingDetails}
                        </pre>
                        <p><strong>Het gekozen privébestand</strong></p>
                        <pre className="aftercare-note" style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>
                          {conflict.incomingDetails}
                        </pre>
                      </details>
                      <label htmlFor={'nazorg-merge-choice-' + index}>Mijn beslissing voor deze ID</label>
                      <select id={'nazorg-merge-choice-' + index}
                        value={conflict.choice || ''}
                        onChange={event => {
                          const choice = event.target.value;
                          setMergeConflictChoices(current => {
                            const next = {...current};
                            if (choice === 'keep' || choice === 'incoming') {
                              next[conflict.key] = choice;
                            } else {
                              delete next[conflict.key];
                            }
                            return next;
                          });
                          setIncomingRiskApproved(false);
                        }}>
                        <option value="">Nog niet beslist — niets wordt toegepast</option>
                        <option value="keep">Behoud mijn huidige tabbladversie</option>
                        <option value="incoming">Vervang uitsluitend deze record-ID door mijn bestandsversie</option>
                      </select>
                    </li>)}</ol>
                </fieldset>}
                {!incomingMerge.ready && <p className="aftercare-warning" role="alert">
                  Samenvoegen is niet mogelijk: {incomingMerge.reason}
                </p>}
                <p>Per punt blijven maximaal 8 contactmomenten gelden; ook na samenvoegen
                  moet de hele privéback-up binnen de bestaande 16 KiB passen.</p>
              </div>}
              {incomingMode === 'replace' && ([
                {title:'Nazorgpunten', impact:incomingImpact.points},
                {title:'Zelf genoteerde contactmomenten', impact:incomingImpact.contacts}
              ]).map(group => <details key={group.title} className="aftercare-history">
                <summary>{group.title}: {group.impact.added} erbij · {group.impact.removed}
                  {' '}verdwijnen · {group.impact.changed} wijzigen</summary>
                {group.impact.details.length === 0 ? <p>Geen inhoudelijke wijzigingen.</p> :
                  <ul>{group.impact.details.map((entry, index) =>
                    <li key={index}><strong>{entry.action}</strong> — {entry.label}
                      {entry.action === 'gewijzigd' ?
                        ' (eigenschappen, eigen status of verborgen privétekst)' : ''}
                    </li>)}</ul>}
              </details>)}
              {!incomingCurrent && <div className="aftercare-warning" role="status">
                <p>Je huidige gegevens zijn na het kiezen van het bestand veranderd.
                  Eerder gegeven toestemming is ongeldig. Bekijk de actuele gevolgen opnieuw.</p>
                <button type="button" className="secondary" onClick={() => {
                  setIncomingSource(aftercareImportSignature); setIncomingRiskApproved(false);
                  setMessage('Gevolgen vernieuwd. Lees de wijzigingen opnieuw vóór bevestiging.');
                }}>Bekijk de nieuwe importgevolgen</button>
              </div>}
              <label className="aftercare-check" htmlFor="nazorg-import-impact-ack">
                <input type="checkbox" id="nazorg-import-impact-ack"
                  checked={incomingCurrent && incomingRiskApproved}
                  disabled={!incomingCurrent || (incomingMode === 'merge' && !incomingMerge?.ready)}
                  onChange={event => setIncomingRiskApproved(event.target.checked)}/>
                {incomingMode === 'merge'
                  ? 'Ik heb alle conflicten afzonderlijk beoordeeld, mijn keuzes en eigen verborgen privégegevens gecontroleerd, en keur uitsluitend de getoonde nieuwe en expliciet gekozen gewijzigde records goed.'
                  : 'Ik begrijp welke eigen nazorgpunten en contactmomenten verdwijnen of wijzigen, inclusief verborgen privéinhoud. Ik heb zo nodig een eigen back-up gemaakt.'}
              </label>
              <div className="aftercare-actions">
                <button type="button"
                  disabled={!incomingCurrent || !incomingRiskApproved ||
                    (incomingMode === 'merge' && !incomingMerge?.ready)}
                  onClick={confirmAftercareImport}>
                  {incomingMode === 'merge'
                    ? 'Ja, voeg uitsluitend deze nieuwe eigen gegevens toe'
                    : 'Ja, vervang mijn hele nazorgdossier'}
                </button>
                <button type="button" className="secondary" onClick={() => {
                  setIncoming(null); setIncomingMode('replace');
                  setIncomingSource(''); setIncomingRiskApproved(false);
                  setMessage('Import geannuleerd; bestaande nazorgpunten en contactmomenten behouden.');
                }}>Annuleer import</button>
              </div>
            </div>}
          {aftercareImportUndo !== null && <div className="aftercare-confirm" role="group"
            aria-label="Vorige nazorgimport terugdraaien">
            <h3>Laatste losse import terugdraaien</h3>
            {aftercareUndoCurrent ? <p>De vorige {aftercareImportUndo.previous.items.length}
              {' '}eigen punten en {aftercareImportUndo.previous.history.length}
              {' '}contactmomenten staan alleen in dit tabblad. Terugdraaien is mogelijk zolang
              na de import niets in het dossier is gewijzigd.</p> :
              <p className="aftercare-warning" role="status">Je hebt het dossier gewijzigd.
                Een oude status terugzetten zou nieuwe gegevens overschrijven en is geblokkeerd.</p>}
            <div className="aftercare-actions">
              <button type="button" className="secondary" disabled={!aftercareUndoCurrent}
                onClick={undoAftercareImport}>Herstel vorige tabbladstatus</button>
              <button type="button" className="secondary"
                onClick={() => setAftercareImportUndo(null)}>Verwijder tijdelijk herstelpunt</button>
            </div>
          </div>}
          <div className="aftercare-actions"><button className="secondary" disabled={!items.length} onClick={() => setClearPending(true)}>Wis alle tabbladpunten…</button></div>
          {clearPending && <div className="aftercare-confirm">
            <p>Je verwijdert {items.length} eigen punten en {history.length} zelf genoteerde
              contactmomenten uit dit tabblad. Eerder opgeslagen bestanden blijven bestaan.
              Je kunt dit uitsluitend in dit nog geopende tabblad één keer veilig
              terugzetten, totdat nieuwe invoer of een wijziging plaatsvindt.</p>
            <div className="aftercare-actions">
              <button type="button" onClick={confirmClearAllAftercare}>
                Ja, wis alle eigen punten en contactnotities
              </button>
              <button className="secondary" onClick={() => setClearPending(false)}>Behoud punten</button>
            </div>
          </div>}
          {clearUndo !== null && <div className="aftercare-confirm" role="group"
            aria-label="Laatste volledig gewiste nazorgdossier herstellen">
            <h3>Laatste volledig gewiste tabbladgegevens herstellen</h3>
            {clearUndoCurrent ? <p>Alle {clearUndo.previous.items.length} vorige eigen punten
              en {clearUndo.previous.history.length} contactmomenten zijn tijdelijk
              herstelbaar. Sluit je dit tabblad, dan vervalt die mogelijkheid.</p> :
              <p className="aftercare-warning" role="status">
                Na het wissen zijn eigen gegevens gewijzigd. Het vorige herstelpunt
                mag geen nieuwe invoer overschrijven en is daarom geblokkeerd.
              </p>}
            <div className="aftercare-actions">
              <button type="button" className="secondary" disabled={!clearUndoCurrent}
                onClick={undoClearAllAftercare}>Herstel mijn vorige volledige tabbladstatus</button>
              <button type="button" className="secondary"
                onClick={() => setClearUndo(null)}>Vernietig tijdelijk herstelpunt</button>
            </div>
          </div>}
          <p role="status" aria-live="polite">{message}</p>
        </div>
      </section>
      <p>Dit is een persoonlijke checklist, geen verstuurde melding of rechtsadvies.</p>
    </div>
  );
}

// Inline the private planner in the already reviewed Next.js page build context.
// Docker's fixed production allowlist and its permanent CI gate stay unchanged.
type PrivateWeekAction = {
  id: string;
  title: string;
  room: string;
  priority: 'laag' | 'normaal' | 'dringend';
  status: 'open' | 'gemeld';
  due: string;
  urgency: number;
  reason: string;
};

type PrivateWeekAppointment = {
  id: string;
  issueId: string;
  day: string;
  title: string;
  room: string;
};

type Props = {
  day: string;
  sourceFingerprint: string;
  actions: PrivateWeekAction[];
  appointments: PrivateWeekAppointment[];
  onOpen: (id: string) => void;
  onPrepareNotice: (ids: string[], mode: 'eerste-melding' | 'opvolging') => void;
  onDownload: (content: string) => void;
  onDownloadCalendar: (content: string) => void;
};

// All displayed facts are the user's own observations, never a landlord
// notice, legal deadline, verified appointment or proof of a sent message.
function addCalendarDays(day: string, count: number): string {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + count)).toISOString().slice(0, 10);
}

// Private TXT may be copied into email or shared after download. Prevent
// embedded controls, bidi directives and newlines from forging report rows.
// The source data stays intact; only the optional derived report is cleaned.
function reportLine(value: string): string {
  return value.normalize('NFKC')
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

// Escape displayed user labels for RFC 5545 TEXT; never use raw lines,
 // control characters or free private contact notes inside calendar data.
function icsCalendarText(value: string): string {
  return reportLine(value).replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;').replace(/,/g, '\\,');
}

// RFC 5545 requires CRLF and 75-octet folded content lines, counting the
// leading continuation whitespace. Count UTF-8 code points, not JS units.
function foldCalendarLine(value: string): string {
  const encoder = new TextEncoder();
  let result = '';
  let octets = 0;
  for (const character of value) {
    const width = encoder.encode(character).length;
    if (octets + width > 75) { result += '\r\n '; octets = 1; }
    result += character;
    octets += width;
  }
  return result;
}

function PrivateAftercareWeekPlan({
  day, sourceFingerprint, actions, appointments, onOpen, onPrepareNotice, onDownload,
  onDownloadCalendar
}: Props) {
  const [horizonDays, setHorizonDays] = useState<7 | 30>(7);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [includeAppointmentsInCalendar, setIncludeAppointmentsInCalendar] = useState(false);
  const [preview, setPreview] = useState<{
    fingerprint: string; text: string; count: number; format: 'text' | 'calendar'
  } | null>(null);
  const [approved, setApproved] = useState(false);
  const [feedback, setFeedback] = useState('');

  const endDay = addCalendarDays(day, horizonDays);
  const plan = useMemo(() => actions
    .filter(action => action.urgency <= 3 ||
      (action.due !== '' && action.due <= endDay))
    .sort((a, b) => a.urgency - b.urgency ||
      (a.due || '9999-99-99').localeCompare(b.due || '9999-99-99') ||
      a.title.localeCompare(b.title, 'nl-NL') || a.id.localeCompare(b.id))
    .slice(0, 80), [actions, endDay]);
  const upcomingAppointments = useMemo(() => appointments
    .filter(appointment => appointment.day >= day && appointment.day <= endDay)
    .sort((a, b) => a.day.localeCompare(b.day) ||
      a.title.localeCompare(b.title, 'nl-NL') || a.id.localeCompare(b.id))
    .slice(0, 160), [appointments, day, endDay]);
  const visibleSet = new Set(plan.map(action => action.id));
  const currentSelection = plan.filter(action => selectedIds.includes(action.id));
  const fingerprint = JSON.stringify({
    sourceFingerprint, day, endDay, selected: currentSelection,
    appointments: upcomingAppointments, includeAppointmentsInCalendar
  });
  const previewCurrent = preview !== null && preview.fingerprint === fingerprint;
  const urgentCount = plan.filter(action => action.urgency <= 3).length;
  const datedCount = plan.filter(action => action.due && action.due >= day && action.due <= endDay).length;
  const datedSelection = currentSelection.filter(action =>
    action.due !== '' && action.due >= day && action.due <= endDay);
  const calendarCount = datedSelection.length +
    (includeAppointmentsInCalendar ? upcomingAppointments.length : 0);

  function toggle(id: string) {
    if (!visibleSet.has(id)) return;
    setSelectedIds(previous => previous.includes(id)
      ? previous.filter(value => value !== id) : [...previous, id]);
    setPreview(null);
    setApproved(false);
  }

  function buildPreview() {
    if (!currentSelection.length && !upcomingAppointments.length) {
      setFeedback('Selecteer eerst een eigen actie of noteer een toekomstige afspraak.');
      return;
    }
    const lines = [
      'WOONPOINTS · MIJN PRIVÉ-NAZORGPLAN',
      'Gemaakt op: ' + day,
      'Periode: ' + day + ' t/m ' + endDay,
      'Eigen invoer — geen juridisch advies, vastgestelde termijn, verstuurd bericht of bevestigde afspraak.',
      '',
      'MIJN GEKOZEN ACTIES (' + currentSelection.length + ')',
      ...currentSelection.flatMap((action, index) => [
        String(index + 1) + '. ' + reportLine(action.room) + ' · ' + reportLine(action.title),
        '   Eigen status: ' + action.status + '; prioriteit: ' + action.priority +
          '; streefdatum: ' + (action.due || 'niet genoteerd'),
        '   Zelf na te lopen: ' + reportLine(action.reason),
        ''
      ]),
      'MIJN TOEKOMSTIGE AFSPRAAKNOTITIES (' + upcomingAppointments.length + ')',
      ...upcomingAppointments.map(appointment =>
        appointment.day + ' · ' + reportLine(appointment.room) + ': ' +
        reportLine(appointment.title) + ' (alleen zelf genoteerd)'),
      '',
      'Geen privénotitieteksten, adressen of contactgegevens toegevoegd door deze export.',
      'Controleer de originele correspondentie voordat je dit document deelt of gebruikt.'
    ];
    const text = lines.join('\n') + '\n';
    if (new TextEncoder().encode(text).length > 70000) {
      setPreview(null);
      setApproved(false);
      setFeedback('Het plan is te groot. Kies minder acties of verkort eigen titels.');
      return;
    }
    setPreview({ fingerprint, text, count: currentSelection.length, format: 'text' });
    setApproved(false);
    setFeedback('Eigen plan klaargezet ter controle. Er is nog geen bestand opgeslagen.');
  }

  function buildCalendarPreview() {
    const appointmentsForExport = includeAppointmentsInCalendar ? upcomingAppointments : [];
    if (!datedSelection.length && !appointmentsForExport.length) {
      setFeedback('Selecteer eerst een toekomstige eigen streefdatum of kies bewust eigen afspraaknotities.');
      setPreview(null); setApproved(false);
      return;
    }
    // No login, third-party access, location, alarms or free-text notes. The
    // original exact selected source and calendar inclusion opt-in are pinned.
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
    const records = [
      ...datedSelection.map(action => ({
        uid: 'woonpoints-own-due-' + action.id + '@local.invalid',
        day: action.due,
        title: 'Eigen nazorgstreefdatum: ' + action.room + ' — ' + action.title,
        note: 'Eigen zelfgekozen datum; geen juridisch of officieel afgesproken termijn.'
      })),
      ...appointmentsForExport.map(appointment => ({
        uid: 'woonpoints-own-appointment-' + appointment.id + '@local.invalid',
        day: appointment.day,
        title: 'Eigen afspraaknotitie: ' + appointment.room + ' — ' + appointment.title,
        note: 'Zelf genoteerde afspraak; niet geverifieerd of bevestigd bij een derde.'
      }))
    ];
    const lines = [
      'BEGIN:VCALENDAR', 'VERSION:2.0',
      'PRODID:-//Woonpoints//Private Selected Aftercare Calendar//NL',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'X-WR-CALNAME:Mijn eigen nazorgplanning',
      ...records.flatMap(record => [
        'BEGIN:VEVENT',
        'UID:' + record.uid,
        'DTSTAMP:' + stamp,
        'DTSTART;VALUE=DATE:' + record.day.replace(/-/g, ''),
        'DTEND;VALUE=DATE:' + addCalendarDays(record.day, 1).replace(/-/g, ''),
        'SUMMARY:' + icsCalendarText(record.title),
        'DESCRIPTION:' + icsCalendarText(record.note),
        'TRANSP:TRANSPARENT',
        'END:VEVENT'
      ]),
      'END:VCALENDAR'
    ];
    const content = lines.map(foldCalendarLine).join('\r\n') + '\r\n';
    if (new TextEncoder().encode(content).length > 70000) {
      setPreview(null); setApproved(false);
      setFeedback('Je geselecteerde agenda is te groot. Kies minder eigen streefdatums.');
      return;
    }
    setPreview({ fingerprint, text: content, count: records.length, format: 'calendar' });
    setApproved(false);
    setFeedback('Eigen agenda-export ter controle klaar. Er is nog niets toegevoegd aan je agenda.');
  }

  function confirmDownload() {
    if (!previewCurrent || !preview || !approved ||
      (!currentSelection.length && !upcomingAppointments.length)) {
      setApproved(false);
      setPreview(null);
      setFeedback('De selectie of het dossier is gewijzigd. Controleer eerst een nieuw plan.');
      return;
    }
    if (preview.format === 'calendar') {
      onDownloadCalendar(preview.text);
    } else {
      onDownload(preview.text);
    }
    setApproved(false);
    setPreview(null);
    setFeedback(preview.format === 'calendar'
      ? 'Je gecontroleerde ICS-bestand is gedownload; agenda-import is jouw keuze.'
      : 'Het door jou gecontroleerde privéplan is als tekstbestand gedownload.');
  }

  return <section className="panel" aria-labelledby="nazorg-weekplan-title">
    <div>
      <p className="eyebrow">EIGEN WEEKOVERZICHT</p>
      <h2 id="nazorg-weekplan-title">Plan mijn volgende nazorgstappen</h2>
      <p>Een praktisch plan uit je huidige eigen dossier: verstreken streefdatums, zelf gemelde punten
        die opvolging vragen, urgente punten, komende eigen datums en afspraaknotities.
        Alles wordt hier lokaal samengesteld. Er wordt niets automatisch gemeld, geagendeerd of verstuurd.</p>
      <label htmlFor="nazorg-weekplan-range">Mijn planningsperiode</label>
      <select id="nazorg-weekplan-range" value={horizonDays}
        onChange={event => {
          setHorizonDays(event.target.value === '30' ? 30 : 7);
          setPreview(null);
          setApproved(false);
        }}>
        <option value={7}>Komende 7 kalenderdagen</option>
        <option value={30}>Komende 30 kalenderdagen</option>
      </select>
      <ul className="aftercare-stats">
        <li><strong>{plan.length}</strong> relevante eigen acties</li>
        <li><strong>{urgentCount}</strong> extra aandacht</li>
        <li><strong>{datedCount}</strong> binnen gekozen periode</li>
        <li><strong>{upcomingAppointments.length}</strong> toekomstige eigen afspraaknotities</li>
      </ul>
    </div>
    <div>
      <div className="aftercare-actions">
        <button type="button" className="secondary" disabled={!plan.length}
          onClick={() => {
            setSelectedIds(plan.map(action => action.id));
            setPreview(null); setApproved(false);
          }}>Selecteer alle voorgestelde acties</button>
        <button type="button" className="secondary" disabled={!selectedIds.length}
          onClick={() => { setSelectedIds([]); setPreview(null); setApproved(false); }}>
          Wis mijn selectie
        </button>
      </div>
      {plan.length === 0 ? <p>Geen eigen actie met urgentie of streefdatum in deze periode.
        Je kunt alsnog eigen afspraken bekijken of nieuwe punten toevoegen.</p> :
        <fieldset className="aftercare-notice-picks">
          <legend>Mijn eigen taken kiezen ({currentSelection.length} van {plan.length})</legend>
          <ul>
            {plan.map(action => <li key={action.id}>
              <label className="aftercare-check">
                <input type="checkbox" checked={selectedIds.includes(action.id)}
                  onChange={() => toggle(action.id)} />
                <span><strong>{action.room}: {action.title}</strong><br />
                  {action.reason}<br />Eigen status: {action.status}
                  {' · '}{action.due || 'Geen eigen streefdatum'}</span>
              </label>
              <button type="button" className="secondary" onClick={() => onOpen(action.id)}>
                Open mijn eigen dossierregel ↓
              </button>
            </li>)}
          </ul>
        </fieldset>}
      <div className="aftercare-actions" aria-label="Geselecteerde eigen acties als concept voorbereiden">
        <button type="button" className="secondary"
          disabled={currentSelection.length < 1 || currentSelection.length > 12}
          onClick={() => onPrepareNotice(currentSelection.map(action => action.id), 'eerste-melding')}>
          Zet mijn selectie klaar voor een eerste-meldingsconcept ↓
        </button>
        <button type="button" className="secondary"
          disabled={currentSelection.length < 1 || currentSelection.length > 12}
          onClick={() => onPrepareNotice(currentSelection.map(action => action.id), 'opvolging')}>
          Zet mijn selectie klaar voor een opvolgconcept ↓
        </button>
      </div>
      {currentSelection.length > 12 && <p className="aftercare-warning" role="status">
        Een berichtconcept accepteert maximaal 12 actuele aandachtspunten. Kies er minder;
        je eigen downloadbare plan mag wel meer acties bevatten.
      </p>}
      <p>Deze knoppen openen uitsluitend de bestaande concepteditor. Zij maken geen bericht,
        leggen geen melding vast en sturen niets naar een verhuurder.</p>
      {upcomingAppointments.length > 0 && <details className="aftercare-history">
        <summary>Mijn {upcomingAppointments.length} toekomstige eigen afspraaknotities</summary>
        <ol>{upcomingAppointments.map(appointment => <li key={appointment.id}>
          <strong>{appointment.day}</strong> — {appointment.room}: {appointment.title}
          <button type="button" className="secondary" onClick={() => onOpen(appointment.issueId)}>
            Open bijbehorend punt ↓
          </button>
        </li>)}</ol>
      </details>}
      <button type="button" disabled={!currentSelection.length && !upcomingAppointments.length}
        onClick={buildPreview}>Bekijk mijn exacte plan vóór downloaden</button>
      <label className="aftercare-check">
        <input type="checkbox" checked={includeAppointmentsInCalendar}
          onChange={event => {
            setIncludeAppointmentsInCalendar(event.target.checked);
            setPreview(null); setApproved(false);
          }} />
        Neem mijn toekomstige zelf genoteerde afspraaknotities bewust op in de agenda-export.
      </label>
      <p>De agenda bevat uitsluitend de <strong>{datedSelection.length}</strong> geselecteerde
        streefdatums binnen de gekozen periode en, na je opt-in,
        <strong> {includeAppointmentsInCalendar ? upcomingAppointments.length : 0}</strong> eigen
        afspraaknotities. Verlopen en ongedateerde acties worden niet als toekomstige afspraken voorgesteld.</p>
      <button type="button" className="secondary" disabled={calendarCount === 0}
        onClick={buildCalendarPreview}>Bekijk mijn geselecteerde agenda-export (.ics) vóór downloaden</button>
      {preview && <div className="aftercare-confirm" role="group" aria-label="Eigen nazorgplan controleren">
        <p><strong>{preview.count} {preview.format === 'calendar'
          ? 'eigen agenda-evenementen' : 'geselecteerde acties'}</strong>;
          toekomstafspraken zijn eigen notities, geen verifieerbare boekingen.</p>
        {!previewCurrent && <p className="aftercare-warning" role="status">
          Je dossier, periode of selectie is veranderd. Maak eerst een nieuw plan.
        </p>}
        <details className="aftercare-history" open={previewCurrent}>
          <summary>Volledige tekst van mijn privéplan</summary>
          <pre className="aftercare-note" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {preview.text}
          </pre>
        </details>
        <label className="aftercare-check">
          <input type="checkbox" checked={approved && previewCurrent}
            disabled={!previewCurrent} onChange={event => setApproved(event.target.checked)} />
          Ik heb de huidige volledige inhoud bekeken en kies zelf waar ik dit bestand bewaar of deel.
        </label>
        <button type="button" disabled={!previewCurrent || !approved} onClick={confirmDownload}>
          {preview.format === 'calendar'
            ? 'Download precies deze gecontroleerde agenda (.ics)'
            : 'Download precies dit gecontroleerde plan (.txt)'}
        </button>
        <button type="button" className="secondary"
          onClick={() => { setPreview(null); setApproved(false); }}>Annuleer mijn voorvertoning</button>
      </div>}
      <p role="status" aria-live="polite">{feedback}</p>
      <p>Alleen eigen tabbladgegevens. TXT en zelfgekozen ICS bevatten titels/ruimtes en
        datums, maar geen vrije contact- of gebreksnotities. Een eigen datum is geen wettelijke
        of met een derde afgesproken termijn. Agenda-apps kunnen een bewust opgeslagen
        ICS-bestand buiten deze app synchroniseren; er zijn geen automatische agenda-acties.</p>
    </div>
  </section>;
}

type HandoverMeterKey = 'powerDay' | 'powerNight' | 'gas' | 'water' | 'heat';
type HandoverHomeKey = 'old' | 'new';
type HandoverReading = { day: string; values: Record<HandoverMeterKey, string> };
const HANDOVER_METERS: { key: HandoverMeterKey; label: string; unit: string }[] = [
  { key: 'powerDay', label: 'Elektriciteit normaal', unit: 'kWh' },
  { key: 'powerNight', label: 'Elektriciteit dal', unit: 'kWh' },
  { key: 'gas', label: 'Gas', unit: 'm³' },
  { key: 'water', label: 'Water', unit: 'm³' },
  { key: 'heat', label: 'Warmte (indien aanwezig)', unit: 'GJ' }
];
const HANDOVER_EMPTY_VALUES: Record<HandoverMeterKey, string> =
  { powerDay: '', powerNight: '', gas: '', water: '', heat: '' };
const HANDOVER_EMPTY: Record<HandoverHomeKey, HandoverReading> = {
  old: { day: '', values: { ...HANDOVER_EMPTY_VALUES } },
  new: { day: '', values: { ...HANDOVER_EMPTY_VALUES } }
};

function handoverValidDay(day: string): boolean {
  if (!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(day)) return false;
  const date = new Date(day + 'T12:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === day;
}
function handoverValidReading(value: string): boolean {
  return /^(?:0|[1-9]\d{0,8})(?:[,.]\d{1,3})?$/.test(value);
}
function handoverExportedReport(readings: Record<HandoverHomeKey, HandoverReading>, included: Record<HandoverMeterKey, boolean>): string {
  const lines = [
    'WOONPOINTS · PERSOONLIJK METERSTANDENOVERZICHT',
    'Eigen notities · niet geverifieerd door verhuurder of energieleverancier.',
    'Dit document is niet automatisch verzonden en bewijst geen formele overdracht.',
    ''
  ];
  for (const home of ['old', 'new'] as HandoverHomeKey[]) {
    const entry = readings[home];
    lines.push(home === 'old' ? 'OUDE WONING' : 'NIEUWE WONING');
    lines.push('Zelf genoteerde datum: ' + (entry.day || 'onbekend'));
    for (const meter of HANDOVER_METERS) {
      if (!included[meter.key]) continue;
      const number = entry.values[meter.key];
      lines.push(meter.label + ': ' + (number ? number.replace(',', '.') + ' ' + meter.unit : 'niet ingevuld'));
    }
    lines.push('');
  }
  lines.push('Controleer de gegevens persoonlijk bij sleuteloverdracht.');
  return lines.join('\r\n') + '\r\n';
}


/** A canonical small private backup: exact keys, dates and decimal strings only. */
function handoverBackup(readings: Record<HandoverHomeKey, HandoverReading>,
  included: Record<HandoverMeterKey, boolean>): string {
  return JSON.stringify({
    kind: 'woonpoints-private-meter-handover', version: 1, readings, included
  }, null, 2) + '\n';
}
function handoverRestore(raw: string): {
  readings: Record<HandoverHomeKey, HandoverReading>;
  included: Record<HandoverMeterKey, boolean>
} {
  if (new TextEncoder().encode(raw).length > 4096) throw Error('Bestand te groot.');
  const object: unknown = JSON.parse(raw);
  const isObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  const keys = (value: Record<string, unknown>, required: string[]) =>
    Object.keys(value).sort().join('|') === [...required].sort().join('|');
  if (!isObject(object) || !keys(object, ['kind', 'version', 'readings', 'included']) ||
      object.kind !== 'woonpoints-private-meter-handover' || object.version !== 1 ||
      !isObject(object.readings) || !isObject(object.included) ||
      !keys(object.readings, ['old', 'new']) ||
      !keys(object.included, HANDOVER_METERS.map(meter => meter.key))) {
    throw Error('Ongeldig eigen meterstandenbestand.');
  }
  const included = { ...HANDOVER_EMPTY_VALUES } as unknown as Record<HandoverMeterKey, boolean>;
  for (const meter of HANDOVER_METERS) {
    const flag = object.included[meter.key];
    if (typeof flag !== 'boolean') throw Error('Ongeldige meterkeuze.');
    included[meter.key] = flag;
  }
  if (!HANDOVER_METERS.some(meter => included[meter.key])) throw Error('Geen gekozen meter.');
  const readings = { old: { day: '', values: { ...HANDOVER_EMPTY_VALUES } },
    new: { day: '', values: { ...HANDOVER_EMPTY_VALUES } } };
  for (const home of ['old', 'new'] as HandoverHomeKey[]) {
    const entry = object.readings[home];
    if (!isObject(entry) || !keys(entry, ['day', 'values']) ||
        typeof entry.day !== 'string' ||
        (entry.day !== '' && !handoverValidDay(entry.day)) ||
        !isObject(entry.values) ||
        !keys(entry.values, HANDOVER_METERS.map(meter => meter.key))) {
      throw Error('Ongeldige overdrachtsdatum of stand.');
    }
    readings[home].day = entry.day;
    for (const meter of HANDOVER_METERS) {
      const value = entry.values[meter.key];
      if (typeof value !== 'string' || (value !== '' && !handoverValidReading(value))) {
        throw Error('Ongeldige meterstand.');
      }
      readings[home].values[meter.key] = value;
    }
  }
  if (handoverBackup(readings, included) !== raw) {
    throw Error('Geen canoniek door Woonpoints aangemaakt privébestand.');
  }
  return { readings, included };
}

/**
 * Private moving-day worksheet; no WoningNet API, account, localStorage,
 * third-party sync, automatic supplier submission, or energy-usage inference.
 */

type PrivateMeterTabData={
  readings:Record<HandoverHomeKey,HandoverReading>;
  included:Record<HandoverMeterKey,boolean>
};
const METER_TAB_STORAGE_KEY='woonpoints:private-meter-handover:tab-recovery:v1';
function initialMeterTab():PrivateMeterTabData{
  return {
    readings:{
      old:{day:'',values:{...HANDOVER_EMPTY_VALUES}},
      new:{day:'',values:{...HANDOVER_EMPTY_VALUES}}
    },
    included:{powerDay:true,powerNight:false,gas:true,water:true,heat:false}
  };
}
function encodeMeterTab(value:PrivateMeterTabData):string{
  return handoverBackup(value.readings,value.included);
}
function decodeMeterTab(raw:string):PrivateMeterTabData|null{
  try{return handoverRestore(raw);}catch{return null;}
}
function PrivateMeterHandover({onPulse,onBundleSnapshot}:{
  onPulse?:(pulse:PrivateMovePulse)=>void;
  onBundleSnapshot?:PrivateMovingSnapshotChange
}={}) {
  const {value:meterTab,setValue:setMeterTab,enabled:rememberMeters,
    hydrated:metersReady,storageMessage:metersStorageMessage,
    enable:enableMetersRestore,disable:disableMetersRestore}
    =usePrivateTabRecovery<PrivateMeterTabData>(
      METER_TAB_STORAGE_KEY,initialMeterTab,encodeMeterTab,decodeMeterTab,4096,
      onBundleSnapshot);
  const {readings,included}=meterTab;
  const setReadings=(change:Record<HandoverHomeKey,HandoverReading>|
    ((before:Record<HandoverHomeKey,HandoverReading>)=>Record<HandoverHomeKey,HandoverReading>))=>{
    setMeterTab(previous=>({...previous,readings:
      typeof change==='function'?change(previous.readings):change}));
  };
  const setIncluded=(change:Record<HandoverMeterKey,boolean>|
    ((before:Record<HandoverMeterKey,boolean>)=>Record<HandoverMeterKey,boolean>))=>{
    setMeterTab(previous=>({...previous,included:
      typeof change==='function'?change(previous.included):change}));
  };
  const [preview, setPreview] = useState<{
    source: string; text: string; format: 'txt' | 'json'
  } | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{
    baseline: string; data: ReturnType<typeof handoverRestore>
  } | null>(null);
  const [restoreApproved, setRestoreApproved] = useState(false);
  const [restoreUndo, setRestoreUndo] = useState<{
    from: string; readings: Record<HandoverHomeKey, HandoverReading>;
    included: Record<HandoverMeterKey, boolean>
  } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const source = JSON.stringify({ readings, included });
  const previewCurrent = preview !== null && preview.source === source;
  const restoreCurrent = pendingRestore !== null && pendingRestore.baseline === source;
  const undoCurrent = restoreUndo !== null && restoreUndo.from === source;
  const selected = HANDOVER_METERS.filter(meter => included[meter.key]);
  const status = useMemo(() => {
    const complete = (['old', 'new'] as HandoverHomeKey[]).flatMap(home =>
      HANDOVER_METERS.filter(meter => included[meter.key] && handoverValidReading(readings[home].values[meter.key])))
      .length;
    const total = selected.length * 2;
    const invalid = (['old', 'new'] as HandoverHomeKey[]).some(home =>
      (readings[home].day !== '' && !handoverValidDay(readings[home].day)) ||
      HANDOVER_METERS.some(meter => included[meter.key] && readings[home].values[meter.key] !== '' &&
        !handoverValidReading(readings[home].values[meter.key])));
    return { complete, total, invalid };
  }, [readings, included, selected.length]);
  useEffect(()=>{
    onPulse?.({done:status.complete,total:status.total,
      attention:status.invalid?1:0,invalid:status.invalid});
  },[onPulse,status.complete,status.total,status.invalid]);

  function editDay(home: HandoverHomeKey, day: string) {
    setReadings(previous => ({
      ...previous, [home]: { ...previous[home], day: day.slice(0, 10) }
    }));
    setConfirmed(false); setFeedback('');
  }
  function editMeter(home: HandoverHomeKey, meter: HandoverMeterKey, value: string) {
    setReadings(previous => ({
      ...previous,
      [home]: { ...previous[home],
        values: { ...previous[home].values, [meter]: value.slice(0, 16) } }
    }));
    setConfirmed(false); setFeedback('');
  }
  function buildPreview() {
    if (!selected.length || status.invalid) {
      setFeedback('Controleer eerst de gekozen meters en ongeldige invoer.');
      setPreview(null); setConfirmed(false); return;
    }
    setPreview({ source, text: handoverExportedReport(readings, included), format: 'txt' });
    setConfirmed(false); setFeedback('');
  }
  function backupPreview() {
    const allValid = (['old', 'new'] as HandoverHomeKey[]).every(home =>
      (readings[home].day === '' || handoverValidDay(readings[home].day)) &&
      HANDOVER_METERS.every(meter => readings[home].values[meter.key] === '' ||
        handoverValidReading(readings[home].values[meter.key])));
    if (!selected.length || !allValid) {
      setFeedback('Controleer ook eerder verborgen standen vóór een herstelback-up.');
      setPreview(null); setConfirmed(false); return;
    }
    setPreview({ source, text: handoverBackup(readings, included), format: 'json' });
    setConfirmed(false); setFeedback('');
  }
  async function chooseRestore(file: File | undefined) {
    if (!file) return;
    const baseline = source;
    setPendingRestore(null); setRestoreApproved(false); setFeedback('');
    if (file.size > 4096) {
      setFeedback('Herstel geweigerd: meer dan 4 KiB.');
      return;
    }
    try {
      const data = handoverRestore(await file.text());
      setPendingRestore({ baseline, data });
    } catch {
      setFeedback('Herstel geweigerd: geen exact geldig eigen Woonpoints-meterbestand.');
    }
  }
  function confirmRestore() {
    if (!restoreCurrent || !restoreApproved || pendingRestore === null) return;
    const next = pendingRestore.data;
    const newSource = JSON.stringify({ readings: next.readings, included: next.included });
    setRestoreUndo({ from: newSource, readings, included });
    setReadings(next.readings); setIncluded(next.included);
    setPreview(null); setConfirmed(false);
    setPendingRestore(null); setRestoreApproved(false);
    setFeedback('Privébestand geladen. De vorige invoer kun je één keer herstellen zolang niets verandert.');
  }
  function undoRestore() {
    if (!undoCurrent || restoreUndo === null) return;
    setReadings(restoreUndo.readings); setIncluded(restoreUndo.included);
    setRestoreUndo(null); setPreview(null); setConfirmed(false);
    setFeedback('De vorige tabbladinvoer is hersteld.');
  }
  function download() {
    if (!previewCurrent || !confirmed || preview === null) return;
    const blob = new Blob([preview.text], { type: preview.format === 'json'
      ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = preview.format === 'json'
      ? 'woonpoints-private-meterstanden.json' : 'woonpoints-eigen-meterstanden.txt';
    document.body.appendChild(link);
    link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setConfirmed(false);
    setFeedback('Eigen bestand aangevraagd. Controleer zelf de inhoud voordat je iets deelt.');
  }
  function reset() {
    setReadings({
      old: { day: '', values: { ...HANDOVER_EMPTY_VALUES } },
      new: { day: '', values: { ...HANDOVER_EMPTY_VALUES } }
    });
    setPreview(null); setConfirmed(false); setPendingRestore(null);
    setRestoreApproved(false); setRestoreUndo(null);
    setFeedback('Je invoer is uitsluitend uit dit tabblad gewist.');
  }

  return <section className="panel" aria-labelledby="private-meter-handover-heading"
    style={{ display: 'block' }}>
    <p className="eyebrow">PRIVÉ SLEUTELOVERDRACHT</p>
    <h2 id="private-meter-handover-heading">Meterstanden oude en nieuwe woning</h2>
    <p>Leg op de overdrachtsdag zelf de standen vast. Vul alleen meters in die echt bij de
      betreffende woning horen. Standen van twee verschillende woningen worden nooit van
      elkaar afgetrokken. Er is geen accountkoppeling of automatische leveranciersmelding.</p>
    <details style={{marginBottom:16}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>
        Meterstanden bij herladen behouden ({rememberMeters?'aan':'uit'})
      </summary>
      <p>Je eigen meterstanden zijn privé. Alleen met aparte toestemming
        bewaren we de exact gecontroleerde oude/nieuwe standen en meterkeuzes
        tijdelijk in <strong>niet-versleutelde sessie-opslag van dit tabblad</strong>.
        Andere scripts op dezelfde website kunnen die informatie lezen. Gebruik
        dit niet op gedeelde apparaten en vul geen adres- of accountgegevens in.
        Sluiten van het tabblad verwijdert de opslag gewoonlijk. Download zelf
        de JSON-back-up voor langdurig bewaren; er worden geen standen
        automatisch naar verhuurder of energieleverancier verzonden.</p>
      {rememberMeters?<button type="button" disabled={!metersReady}
        onClick={disableMetersRestore} style={{minHeight:44}}>
        Stop en wis opgeslagen meterstanden</button>:
        <button type="button" disabled={!metersReady}
          onClick={enableMetersRestore} style={{minHeight:44}}>
          Ja, onthoud meterstanden bij herladen</button>}
      <p role="status" aria-live="polite">
        {metersStorageMessage|| (metersReady?'Geen sessieopslag actief.':'Opslag wordt gecontroleerd.')}
      </p>
    </details>
    <fieldset style={{ border: '1px solid #c4d6c9', borderRadius: 12, padding: 14 }}>
      <legend><strong>Welke meters wil je opnemen?</strong></legend>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {HANDOVER_METERS.map(meter => <label key={meter.key} style={{ display: 'inline-flex',
          alignItems: 'center', gap: 7, minHeight: 44 }}>
          <input type="checkbox" checked={included[meter.key]}
            onChange={event => {
              setIncluded(previous => ({ ...previous, [meter.key]: event.target.checked }));
              setConfirmed(false); setFeedback('');
            }} />
          {meter.label}
        </label>)}
      </div>
    </fieldset>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
      gap: 16, marginTop: 16 }}>
      {(['old', 'new'] as HandoverHomeKey[]).map(home => <fieldset key={home}
        style={{ border: '1px solid #c4d6c9', borderRadius: 12, padding: 16,
          minWidth: 0 }}>
        <legend><strong>{home === 'old' ? 'Oude woning' : 'Nieuwe woning'}</strong></legend>
        <label style={{ display: 'block', fontWeight: 700 }}>
          Datum zelf genoteerd
          <input type="date" min="2000-01-01" max="2099-12-31"
            value={readings[home].day} onChange={event => editDay(home, event.target.value)}
            style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 6 }} />
        </label>
        {selected.map(meter => {
          const value = readings[home].values[meter.key];
          const invalid = value !== '' && !handoverValidReading(value);
          return <label key={meter.key} style={{ display: 'block', marginTop: 14,
            fontWeight: 700 }}>
            {meter.label} ({meter.unit})
            <input type="text" inputMode="decimal" autoComplete="off"
              aria-invalid={invalid} value={value} maxLength={16}
              placeholder="Niet ingevuld" onChange={event => editMeter(home, meter.key, event.target.value)}
              style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 6 }} />
            {invalid && <small style={{ color: '#a32a20', display: 'block' }}>
              Gebruik maximaal negen cijfers en hoogstens drie decimalen, zonder minteken.
            </small>}
          </label>;
        })}
      </fieldset>)}
    </div>
    <p role="status" aria-live="polite">
      {status.complete} van {status.total} geselecteerde standen ingevuld.
      {' '}Lege standen blijven nadrukkelijk onbekend.
    </p>
    {status.invalid && <p role="alert">Een datum of stand is ongeldig. Controleer de invoer.</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
      <button type="button" disabled={!selected.length || status.invalid}
        onClick={buildPreview}>Bekijk volledig overdrachtsbestand</button>
      <button type="button" className="secondary" disabled={!selected.length}
        onClick={backupPreview}>Bekijk volledige privéback-up (.json)</button>
      <button type="button" className="secondary" onClick={reset}>Wis mijn invoer</button>
    </div>
    {preview !== null && <div style={{ marginTop: 16, padding: 16, border: '1px solid #91a99a',
      borderRadius: 12 }}>
      {!previewCurrent && <p role="alert">De invoer is gewijzigd. Controleer een nieuwe export.</p>}
      {previewCurrent && <>
        <p><strong>Controleer alles wat je straks downloadt:</strong></p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 340,
          overflowY: 'auto' }}>{preview.text}</pre>
        <label style={{ display: 'flex', gap: 9, alignItems: 'start', marginTop: 12 }}>
          <input type="checkbox" checked={confirmed}
            onChange={event => setConfirmed(event.target.checked)} />
          Ik heb dit volledige privébestand bekeken en kies bewust of en met wie ik het deel.
        </label>
        <button type="button" disabled={!confirmed} onClick={download}
          style={{ marginTop: 12 }}>Download exact dit gecontroleerde {preview.format.toUpperCase()}-bestand</button>
      </>}
    </div>}
    <fieldset style={{ marginTop: 20, border: '1px solid #c4d6c9',
      borderRadius: 12, padding: 16 }}>
      <legend><strong>Mijn privébackup terugzetten</strong></legend>
      <p>Kies uitsluitend je eerder met dit onderdeel gedownloade JSON. Er gebeurt
        niets totdat je de vervanging goedkeurt. Een bestand mag maximaal 4 KiB zijn.</p>
      <input type="file" accept=".json,application/json"
        aria-label="Kies mijn eigen meterstanden-back-up"
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void chooseRestore(file);
        }} />
      {pendingRestore !== null && <div style={{ marginTop: 12 }}>
        {!restoreCurrent && <p role="alert">Je tabbladinvoer is veranderd; kies het bestand opnieuw.</p>}
        {restoreCurrent && <>
          <p>Dit bestand vervangt <strong>beide woningen</strong>, hun datums en de gekozen meters.
            {''} De bestaande niet-opgeslagen invoer wordt vervangen.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
            maxHeight: 240, overflowY: 'auto' }}>
            {handoverExportedReport(pendingRestore.data.readings, pendingRestore.data.included)}
          </pre>
          <label style={{ display: 'flex', gap: 9, alignItems: 'start' }}>
            <input type="checkbox" checked={restoreApproved}
              onChange={event => setRestoreApproved(event.target.checked)} />
            Ik heb de vervangende standen bekeken en geef toestemming om de huidige
            tabbladinvoer te vervangen.
          </label>
          <button type="button" disabled={!restoreApproved} onClick={confirmRestore}>
            Vervang mijn invoer met dit gecontroleerde bestand
          </button>
        </>}
      </div>}
      {undoCurrent && <button type="button" className="secondary"
        onClick={undoRestore}>Herstel mijn vorige tabbladinvoer één keer</button>}
    </fieldset>
    <p role="status" aria-live="polite">{feedback}</p>
    <p>Alle gegevens blijven alleen in het huidige browsertabblad totdat je zelf een
      TXT- of JSON-bestand aanvraagt. Vernieuwen of sluiten wist de invoer. Een gedownload bestand
      kan privégegevens bevatten: bewaar en deel dit uitsluitend zelf. Geen synchronisatie,
      accountbewijs, officiële meterregistratie of koppeling aan energieleveranciers.</p>
  </section>;
}


type PrivateUtilityKey = 'electricity' | 'water' | 'internet' | 'insurance' | 'council' | 'parking';
type PrivateUtilityState = 'todo' | 'requested' | 'confirmed' | 'not-applicable';
type PrivateUtilityStep = { state: PrivateUtilityState; date: string };
const PRIVATE_UTILITIES: {
  id: PrivateUtilityKey; name: string; guidance: string
}[] = [
  { id: 'electricity', name: 'Energiecontract en eindafrekening',
    guidance: 'Controleer zelf oude einddatum, nieuwe ingangsdatum en meterstanden.' },
  { id: 'water', name: 'Wateraanmelding en afmelding',
    guidance: 'Controleer zelf de adreswissel bij je waterbedrijf.' },
  { id: 'internet', name: 'Internet en televisie',
    guidance: 'Plan een eigen aansluit- of verhuisafspraak zonder persoonsgegevens hier.' },
  { id: 'insurance', name: 'Inboedel- en woonverzekeringen',
    guidance: 'Controleer zelf vanaf welke datum de nieuwe woning verzekerd moet zijn.' },
  { id: 'council', name: 'Inschrijving bij de gemeente',
    guidance: 'Controleer zelf de geldende termijn en officiële ontvangstbevestiging.' },
  { id: 'parking', name: 'Parkeer- en bewonersregelingen',
    guidance: 'Bepaal zelf of nieuwe lokale vergunningen of abonnementen nodig zijn.' }
];
const PRIVATE_UTILITY_EMPTY = Object.fromEntries(
  PRIVATE_UTILITIES.map(item => [item.id, { state: 'todo', date: '' }])
) as Record<PrivateUtilityKey, PrivateUtilityStep>;

/** Explicit local JSON backup. Never load or persist credentials/account data. */
function privateUtilityBackup(entries: Record<PrivateUtilityKey, PrivateUtilityStep>): string {
  return JSON.stringify({ kind: 'woonpoints-private-utility-checklist',
    version: 1, entries }, null, 2) + '\n';
}
function privateUtilityRestore(text: string): Record<PrivateUtilityKey, PrivateUtilityStep> {
  if (new TextEncoder().encode(text).length > 4096) throw Error('Private backup too large');
  const source: unknown = JSON.parse(text);
  const record = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value);
  const exact = (value: Record<string, unknown>, expected: string[]) =>
    Object.keys(value).sort().join('|') === [...expected].sort().join('|');
  if (!record(source) || !exact(source, ['kind', 'version', 'entries']) ||
      source.kind !== 'woonpoints-private-utility-checklist' || source.version !== 1 ||
      !record(source.entries) ||
      !exact(source.entries, PRIVATE_UTILITIES.map(item => item.id))) {
    throw Error('Not a supported private utility backup');
  }
  const entries = {} as Record<PrivateUtilityKey, PrivateUtilityStep>;
  for (const item of PRIVATE_UTILITIES) {
    const value = source.entries[item.id];
    if (!record(value) || !exact(value, ['state', 'date']) ||
        !['todo', 'requested', 'confirmed', 'not-applicable'].includes(
          typeof value.state === 'string' ? value.state : '') ||
        typeof value.date !== 'string' ||
        (value.date !== '' && !handoverValidDay(value.date))) {
      throw Error('Invalid private utility entry');
    }
    entries[item.id] = { state: value.state as PrivateUtilityState, date: value.date };
  }
  // Admit exactly the bytes produced by our own versioned exporter.
  // This rejects conflicting duplicate JSON keys and unknown field variants.
  if (privateUtilityBackup(entries) !== text) throw Error('Not a canonical private backup');
  return entries;
}

function privateUtilityTomorrow(day: string): string {
  const next = new Date(day + 'T12:00:00Z');
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
function privateUtilityReport(entries: Record<PrivateUtilityKey, PrivateUtilityStep>): string {
  const status: Record<PrivateUtilityState, string> = {
    todo: 'Nog te regelen', requested: 'Zelf aangevraagd (nog niet bevestigd)',
    confirmed: 'Zelf als bevestigd genoteerd (niet onafhankelijk geverifieerd)',
    'not-applicable': 'Niet van toepassing'
  };
  return [
    'WOONPOINTS · MIJN PRIVÉVERHUISOVERDRACHT',
    'Eigen handmatige planning · geen leveranciers- of gemeentestatus geverifieerd.',
    'Geen bericht verstuurd of contract gewijzigd via Woonpoints.',
    '', ...PRIVATE_UTILITIES.flatMap(item => [
      item.name,
      'Status: ' + status[entries[item.id].state],
      'Zelf gekozen controledatum: ' + (entries[item.id].date || 'niet ingepland'),
      ''
    ])
  ].join('\r\n') + '\r\n';
}
function privateUtilityCalendar(entries: Record<PrivateUtilityKey, PrivateUtilityStep>,
  today: string): string {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Woonpoints//Eigen Verhuischecklist//NL',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'
  ];
  for (const item of PRIVATE_UTILITIES) {
    const entry = entries[item.id];
    if (!handoverValidDay(entry.date) || entry.date < today ||
        entry.state === 'confirmed' || entry.state === 'not-applicable') continue;
    const start = entry.date.replaceAll('-', '');
    const end = privateUtilityTomorrow(entry.date).replaceAll('-', '');
    const stamp = new Date().toISOString().replaceAll('-', '').replaceAll(':', '')
      .replace(/\.\d{3}Z$/, 'Z');
    lines.push('BEGIN:VEVENT', 'UID:woonpoints-utility-' + item.id + '-' + start + '@offline.local',
      'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + start, 'DTEND;VALUE=DATE:' + end,
      'SUMMARY:Zelf controleren - ' + item.name,
      'DESCRIPTION:Persoonlijke herinnering. Geen bevestigde afspraak of officiële termijn.',
      'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n') + '\r\n';
}


type PrivateUtilityBucket = 'overdue' | 'soon' | 'later' | 'undated' | 'done';
const PRIVATE_UTILITY_BUCKETS: {
  id: PrivateUtilityBucket; title: string; description: string
}[] = [
  { id: 'overdue', title: 'Eigen controledatum verstreken',
    description: 'Kijk na of je eigen genoteerde stap is bijgewerkt.' },
  { id: 'soon', title: 'Binnen 7 kalenderdagen',
    description: 'Binnenkort zelf controleren; dit is geen officiële deadline.' },
  { id: 'later', title: 'Later gepland',
    description: 'Nog niet afgerond, maar je eigen datum ligt verder weg.' },
  { id: 'undated', title: 'Nog geen datum',
    description: 'Open taken waarvoor je zelf nog een controlemoment kunt kiezen.' },
  { id: 'done', title: 'Zelf afgehandeld',
    description: 'Alleen jouw notitie, niet onafhankelijk geverifieerd.' }
];

/** Read-only local overview; no reminders scheduled and no external deadlines invented. */
function PrivateUtilityDeadlineDesk({
  entries, today
}: {
  entries: Record<PrivateUtilityKey, PrivateUtilityStep>; today: string
}) {
  const [selected, setSelected] = useState<PrivateUtilityBucket | 'all'>('all');
  const items = PRIVATE_UTILITIES.map(item => {
    const step = entries[item.id];
    let bucket: PrivateUtilityBucket = 'undated';
    if (step.state === 'confirmed' || step.state === 'not-applicable') bucket = 'done';
    else if (step.date && handoverValidDay(step.date)) {
      if (step.date < today) bucket = 'overdue';
      else {
        // Gregorian civil dates at UTC noon avoid local DST and offset differences.
        const days = Math.round((Date.parse(step.date + 'T12:00:00Z') -
          Date.parse(today + 'T12:00:00Z')) / 86400000);
        bucket = days <= 7 ? 'soon' : 'later';
      }
    }
    return { ...item, step, bucket };
  });
  const counts = Object.fromEntries(PRIVATE_UTILITY_BUCKETS.map(bucket =>
    [bucket.id, items.filter(item => item.bucket === bucket.id).length]
  )) as Record<PrivateUtilityBucket, number>;
  const ordered = items.filter(item => selected === 'all' || item.bucket === selected)
    .sort((a, b) => {
      const order = (item: typeof a) => PRIVATE_UTILITY_BUCKETS.findIndex(
        group => group.id === item.bucket);
      return order(a) - order(b) || (a.step.date || '9999').localeCompare(
        b.step.date || '9999') || a.name.localeCompare(b.name, 'nl-NL');
    });
  return <section aria-labelledby="utility-deadline-desk-heading"
    style={{ marginTop: 24, padding: 16, background: '#f3f7f4',
      border: '1px solid #bbd2c2', borderRadius: 12 }}>
    <h3 id="utility-deadline-desk-heading">Mijn controle-inbox</h3>
    <p>Prioriteit uitsluitend op basis van <strong>jouw eigen ingevulde datums</strong>.
      Dit zijn geen wettelijke deadlines, automatische afspraken of officieel gemelde stappen.</p>
    <div role="group" aria-label="Filter mijn verhuiscontrolemomenten"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
      <button type="button" className="secondary" aria-pressed={selected === 'all'}
        onClick={() => setSelected('all')}>Alle 6</button>
      {PRIVATE_UTILITY_BUCKETS.map(bucket => <button type="button"
        className="secondary" key={bucket.id} aria-pressed={selected === bucket.id}
        onClick={() => setSelected(bucket.id)}>
        {bucket.title} ({counts[bucket.id]})
      </button>)}
    </div>
    {ordered.length === 0 ? <p>Geen stappen in dit overzicht.</p> :
      <ol style={{ marginTop: 14 }}>
        {ordered.map(item => <li key={item.id} style={{ marginBottom: 12 }}>
          <strong>{item.name}</strong> · {PRIVATE_UTILITY_BUCKETS.find(
            bucket => bucket.id === item.bucket)?.title}
          <br />
          <span>{item.step.date ? 'Eigen datum: ' + item.step.date :
            'Geen controledatum gekozen'} · {item.step.state === 'requested'
            ? 'zelf aangevraagd, wacht op bevestiging' :
            item.step.state === 'confirmed' ? 'zelf als afgerond genoteerd' :
            item.step.state === 'not-applicable' ? 'niet van toepassing' :
            'nog te regelen'}</span>
          <br />
          <a href={'#utility-step-' + item.id}>Bewerk deze stap ↑</a>
        </li>)}
      </ol>}
    <p role="status" aria-live="polite">
      {counts.overdue} eigen datums verstreken · {counts.soon} binnen 7 dagen ·
      {' '}{counts.undated} open zonder datum. Open of aangevraagd betekent
      <strong> nooit automatisch bevestigd</strong>.
    </p>
    <p>Filteren is alleen schermweergave. Er worden geen taken verwijderd, derden benaderd
      of notificaties aangemaakt.</p>
  </section>;
}

/**
 * A purely manual, ephemeral checklist. No supplier contact, WoningNet access
 * or local storage. A calendar file may be shared by an external calendar app
 * only after an explicit full preview and a separate user consent checkbox.
 */

const UTILITY_TAB_STORAGE_KEY='woonpoints:private-utility-transfer:tab-recovery:v1';
function encodeUtilityTab(entries:Record<PrivateUtilityKey,PrivateUtilityStep>):string{
  return privateUtilityBackup(entries);
}
function decodeUtilityTab(raw:string):Record<PrivateUtilityKey,PrivateUtilityStep>|null{
  try{return privateUtilityRestore(raw);}catch{return null;}
}
function PrivateUtilityTransfer({
  onLogContact,onPulse,onBundleSnapshot
}: { onLogContact?: (utility:PrivateUtilityKey)=>void;
     onPulse?: (pulse:PrivateMovePulse)=>void;
     onBundleSnapshot?:PrivateMovingSnapshotChange }={}) {
  const {value:entries,setValue:setEntries,enabled:rememberUtilities,
    hydrated:utilitiesReady,storageMessage:utilitiesStorageMessage,
    enable:enableUtilitiesRestore,disable:disableUtilitiesRestore}
    =usePrivateTabRecovery<Record<PrivateUtilityKey,PrivateUtilityStep>>(
      UTILITY_TAB_STORAGE_KEY,()=>PRIVATE_UTILITY_EMPTY,
      encodeUtilityTab,decodeUtilityTab,4096,onBundleSnapshot);
  const [preview, setPreview] = useState<{
    source: string; text: string; kind: 'txt' | 'ics' | 'json'
  } | null>(null);
  const [approved, setApproved] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{
    baseline: string; entries: Record<PrivateUtilityKey, PrivateUtilityStep>
  } | null>(null);
  const [restoreApproved, setRestoreApproved] = useState(false);
  const [restoreUndo, setRestoreUndo] = useState<{
    restored: string; previous: Record<PrivateUtilityKey, PrivateUtilityStep>
  } | null>(null);
  const [feedback, setFeedback] = useState('');
  const source = JSON.stringify(entries);
  const current = preview !== null && preview.source === source;
  const restoreCurrent = pendingRestore !== null && pendingRestore.baseline === source;
  const undoCurrent = restoreUndo !== null && restoreUndo.restored === source;
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')].join('-');
  const upcoming = PRIVATE_UTILITIES.filter(item => {
    const entry = entries[item.id];
    return entry.date !== '' && handoverValidDay(entry.date) &&
      entry.date >= today && entry.state !== 'confirmed' &&
      entry.state !== 'not-applicable';
  });
  const invalid = PRIVATE_UTILITIES.some(item => entries[item.id].date !== '' &&
    !handoverValidDay(entries[item.id].date));
  const settled = PRIVATE_UTILITIES.filter(item =>
    ['confirmed', 'not-applicable'].includes(entries[item.id].state)).length;
  const overdueCount = PRIVATE_UTILITIES.filter(item=>{
    const row=entries[item.id];
    return row.date!==''&&handoverValidDay(row.date)&&row.date<today&&
      row.state!=='confirmed'&&row.state!=='not-applicable';
  }).length;
  useEffect(()=>{
    const reminders:PrivateMoveReminder[]=PRIVATE_UTILITIES.flatMap(item=>{
      const row=entries[item.id];
      return row.date&&handoverValidDay(row.date)&&
        row.state!=='confirmed'&&row.state!=='not-applicable'?
        [{id:item.id,day:row.date,origin:'utility' as const,title:item.name}]:[];
    });
    onPulse?.({done:settled,total:PRIVATE_UTILITIES.length,
      attention:overdueCount+(invalid?1:0),invalid,reminders});
  },[onPulse,settled,overdueCount,invalid,entries]);
  function edit(key: PrivateUtilityKey, change: Partial<PrivateUtilityStep>) {
    setEntries(previous => ({
      ...previous, [key]: { ...previous[key], ...change }
    }));
    setApproved(false); setFeedback('');
  }
  function openPreview(kind: 'txt' | 'ics' | 'json') {
    if (invalid || (kind === 'ics' && !upcoming.length)) return;
    setPreview({ source, kind, text: kind === 'txt' ? privateUtilityReport(entries) :
      kind === 'ics' ? privateUtilityCalendar(entries, today) : privateUtilityBackup(entries) });
    setApproved(false); setFeedback('');
  }
  async function chooseRestore(file: File | undefined) {
    if (!file) return;
    const baseline = source;
    setPendingRestore(null); setRestoreApproved(false); setFeedback('');
    if (file.size > 4096) {
      setFeedback('Back-up geweigerd: bestand groter dan 4 KiB.');
      return;
    }
    try {
      const restored = privateUtilityRestore(await file.text());
      setPendingRestore({ baseline, entries: restored });
    } catch {
      setFeedback('Back-up geweigerd: geen exact geldig Woonpoints-verhuischecklistbestand.');
    }
  }
  function confirmRestore() {
    if (!restoreCurrent || !restoreApproved || pendingRestore === null) return;
    const next = pendingRestore.entries;
    setRestoreUndo({ restored: JSON.stringify(next), previous: entries });
    setEntries(next); setPreview(null); setApproved(false);
    setPendingRestore(null); setRestoreApproved(false);
    setFeedback('Checklist hersteld. Vorige tabbladinvoer is éénmalig herstelbaar zolang niets wijzigt.');
  }
  function undoRestore() {
    if (!undoCurrent || restoreUndo === null) return;
    setEntries(restoreUndo.previous); setRestoreUndo(null);
    setPendingRestore(null); setRestoreApproved(false);
    setPreview(null); setApproved(false);
    setFeedback('Je vorige eigen tabbladinvoer is hersteld.');
  }
  function download() {
    if (!current || preview === null || !approved) return;
    const blob = new Blob([preview.text], { type: preview.kind === 'ics'
      ? 'text/calendar;charset=utf-8' : preview.kind === 'json'
      ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = preview.kind === 'ics' ?
      'woonpoints-eigen-overstapherinneringen.ics' : preview.kind === 'json'
      ? 'woonpoints-private-verhuischecklist.json' : 'woonpoints-eigen-overstapchecklist.txt';
    document.body.appendChild(link);
    link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    setApproved(false);
    setFeedback('Privébestand aangevraagd. Er is niets automatisch naar derden gestuurd.');
  }
  function clear() {
    setEntries(Object.fromEntries(PRIVATE_UTILITIES.map(item =>
      [item.id, { state: 'todo', date: '' }])) as Record<PrivateUtilityKey, PrivateUtilityStep>);
    setPreview(null); setApproved(false);
    setPendingRestore(null); setRestoreApproved(false); setRestoreUndo(null);
    setFeedback('Alleen deze tabbladchecklist is gewist.');
  }
  return <section className="panel" aria-labelledby="private-utility-transfer-heading"
    style={{ display: 'block' }}>
    <p className="eyebrow">PRIVÉ VERHUISADMINISTRATIE</p>
    <h2 id="private-utility-transfer-heading">Nutsvoorzieningen en contracten overzetten</h2>
    <p>Gebruik zes handmatige stappen om je verhuizing te organiseren. Je kiest je eigen
      controledatums en houdt apart bij wat nog openstaat, wat je zelf hebt aangevraagd
      en wat je zelf als afgerond hebt genoteerd. Een status is nooit officiële bevestiging.</p>
    <details style={{marginBottom:16}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>
        Mijn checklist bij herladen behouden ({rememberUtilities?'aan':'uit'})
      </summary>
      <p>Zonder toestemming blijven de zes eigen statussen en datums alleen in dit
        tabbladgeheugen. Met jouw expliciete toestemming gebruiken we
        <strong> niet-versleutelde sessie-opslag in dit tabblad</strong> voor het
        exact gevalideerde bestand. Scripts op deze website kunnen dit lezen;
        gebruik dit niet op een gedeeld apparaat en vul geen persoonsgegevens in.
        Er gebeurt niets bij je leveranciers. Sluiten van het tabblad verwijdert
        de sessie doorgaans; langdurig bewaren gaat via je eigen JSON-download.</p>
      {rememberUtilities?<button type="button" disabled={!utilitiesReady}
        onClick={disableUtilitiesRestore} style={{minHeight:44}}>
        Stop en wis mijn tabbladchecklist</button>:
        <button type="button" disabled={!utilitiesReady}
          onClick={enableUtilitiesRestore} style={{minHeight:44}}>
          Ja, onthoud mijn zes stappen bij herladen</button>}
      <p role="status" aria-live="polite">
        {utilitiesStorageMessage|| (utilitiesReady?'Geen sessieopslag actief.':'Opslag wordt gecontroleerd.')}
      </p>
    </details>
    <div style={{ display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 310px), 1fr))', gap: 12 }}>
      {PRIVATE_UTILITIES.map(item => <fieldset key={item.id} id={'utility-step-' + item.id} style={{
        border: '1px solid #c4d6c9', borderRadius: 12, padding: 14, minWidth: 0
      }}>
        <legend><strong>{item.name}</strong></legend>
        <p>{item.guidance}</p>
        {onLogContact && <button type="button" className="secondary"
          onClick={()=>onLogContact(item.id)}>
          Noteer mijn contact over {item.name.toLocaleLowerCase('nl-NL')} ↓
        </button>}
        <label style={{ display: 'block', fontWeight: 700 }}>
          Mijn eigen voortgang
          <select value={entries[item.id].state} onChange={event =>
            edit(item.id, { state: event.target.value as PrivateUtilityState })}
            style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 6 }}>
            <option value="todo">Nog te regelen</option>
            <option value="requested">Zelf aangevraagd, wacht op bevestiging</option>
            <option value="confirmed">Zelf als afgerond genoteerd</option>
            <option value="not-applicable">Niet van toepassing</option>
          </select>
        </label>
        <label style={{ display: 'block', fontWeight: 700, marginTop: 12 }}>
          Eigen controledatum
          <input type="date" min="2000-01-01" max="2099-12-31"
            value={entries[item.id].date}
            onChange={event => edit(item.id, { date: event.target.value.slice(0, 10) })}
            style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 6 }} />
        </label>
      </fieldset>)}
    </div>
    <p role="status" aria-live="polite">
      {settled} van {PRIVATE_UTILITIES.length} stappen zelf afgehandeld of niet van toepassing.
      {' '}{upcoming.length} toekomstige controleherinneringen mogelijk.
    </p>
    {invalid && <p role="alert">Controleer de ingevoerde datums.</p>}
    <PrivateUtilityDeadlineDesk entries={entries} today={today} />
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
      <button type="button" disabled={invalid}
        onClick={() => openPreview('txt')}>Bekijk volledig privé-overzicht (TXT)</button>
      <button type="button" className="secondary" disabled={invalid || !upcoming.length}
        onClick={() => openPreview('ics')}>Bekijk mijn agendaherinneringen (ICS)</button>
      <button type="button" className="secondary" disabled={invalid}
        onClick={() => openPreview('json')}>Bekijk volledige herstelback-up (JSON)</button>
      <button type="button" className="secondary" onClick={clear}>Wis mijn checklist</button>
    </div>
    {preview !== null && <div style={{ padding: 16, border: '1px solid #91a99a',
      borderRadius: 12, marginTop: 16 }}>
      {!current && <p role="alert">Je checklist is gewijzigd. Maak eerst een nieuwe preview.</p>}
      {current && <>
        <p><strong>Volledige inhoud van het eigen {preview.kind.toUpperCase()}-bestand:</strong></p>
        <pre style={{ maxHeight: 320, overflowY: 'auto', whiteSpace: 'pre-wrap',
          overflowWrap: 'anywhere' }}>{preview.text}</pre>
        <label style={{ display: 'flex', gap: 9, alignItems: 'start' }}>
          <input type="checkbox" checked={approved}
            onChange={event => setApproved(event.target.checked)} />
          Ik heb de volledige inhoud gecontroleerd en kies zelf waar ik dit bestand
          opsla of met wie ik het deel.
        </label>
        <button type="button" disabled={!approved} onClick={download}
          style={{ marginTop: 12 }}>Download precies deze gecontroleerde {preview.kind.toUpperCase()}</button>
      </>}
    </div>}
    <fieldset style={{ border: '1px solid #c4d6c9', borderRadius: 12,
      padding: 16, marginTop: 18 }}>
      <legend><strong>Mijn eerder opgeslagen checklist terugzetten</strong></legend>
      <p>Kies je eigen Woonpoints-JSON-bestand (maximaal 4 KiB).
        De huidige checklist wordt pas vervangen na de volledige voorbeeldweergave en
        een afzonderlijke bevestiging.</p>
      <input type="file" accept=".json,application/json"
        aria-label="Kies mijn eigen verhuischecklist-JSON"
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void chooseRestore(file);
        }} />
      {pendingRestore !== null && <>
        {!restoreCurrent ? <p role="alert">De huidige checklist is gewijzigd.
          Kies het bestand opnieuw.</p> : <>
          <p>Vervanging van <strong>alle zes stappen</strong> en hun datums.</p>
          <pre style={{ maxHeight: 260, overflowY: 'auto', whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere' }}>{privateUtilityReport(pendingRestore.entries)}</pre>
          <label style={{ display: 'flex', alignItems: 'start', gap: 9 }}>
            <input type="checkbox" checked={restoreApproved}
              onChange={event => setRestoreApproved(event.target.checked)} />
            Ik heb de zes stappen gecontroleerd en wil mijn huidige tabbladinvoer vervangen.
          </label>
          <button type="button" disabled={!restoreApproved}
            onClick={confirmRestore}>Vervang mijn checklist met deze back-up</button>
        </>}
      </>}
      {undoCurrent && <button type="button" className="secondary"
        onClick={undoRestore}>Herstel eenmalig mijn vorige tabbladinvoer</button>}
    </fieldset>
    <p role="status" aria-live="polite">{feedback}</p>
    <p>Deze checklist blijft alleen in het tabblad en verdwijnt na verversen of sluiten.
      Een TXT-, JSON- of ICS-download ontstaat alleen op jouw verzoek.
      Je agenda-app kan een bewust gedownload ICS-bestand synchroniseren; Woonpoints
      maakt nooit zelf afspraken, verzendt geen berichten en wijzigt geen contracten.
      Controleer officiële termijnen, voorwaarden en bevestigingen altijd zelf.</p>
  </section>;
}


type PrivateContactChannel = 'phone' | 'email' | 'portal' | 'in-person' | 'other';
type PrivateUtilityContact = {
  id: number; utility: PrivateUtilityKey; day: string;
  channel: PrivateContactChannel; note: string; followUp: string
};
type PrivateContactDraft = Omit<PrivateUtilityContact, 'id'>;
const CONTACT_CHANNELS: { id: PrivateContactChannel; label: string }[] = [
  { id: 'phone', label: 'Telefoon' }, { id: 'email', label: 'E-mail' },
  { id: 'portal', label: 'Portaal' }, { id: 'in-person', label: 'Persoonlijk' },
  { id: 'other', label: 'Anders' }
];
const CONTACT_NEW: PrivateContactDraft = {
  utility: 'electricity', day: '', channel: 'phone', note: '', followUp: ''
};
const CONTACT_LIMIT = 60;
const CONTACT_NOTE_LIMIT = 200;
function privateContactValid(entry: PrivateUtilityContact): boolean {
  return Number.isSafeInteger(entry.id) && entry.id > 0 && entry.id <= 1000000 &&
    PRIVATE_UTILITIES.some(item => item.id === entry.utility) &&
    CONTACT_CHANNELS.some(channel => channel.id === entry.channel) &&
    handoverValidDay(entry.day) && typeof entry.followUp === 'string' &&
    (entry.followUp === '' || handoverValidDay(entry.followUp)) &&
    typeof entry.note === 'string' && entry.note.trim().length > 0 &&
    entry.note.length <= CONTACT_NOTE_LIMIT &&
    !/[\u0000-\u001f\u007f\u2028\u2029]/u.test(entry.note);
}
function privateContactBackup(entries: PrivateUtilityContact[]): string {
  return JSON.stringify({ kind: 'woonpoints-private-utility-contacts',
    version: 1, contacts: entries }, null, 2) + '\n';
}
function privateContactReadBackup(raw: string): PrivateUtilityContact[] {
  if (new TextEncoder().encode(raw).length > 24 * 1024)
    throw Error('Backup size out of bounds');
  const record = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v);
  const exact = (v: Record<string, unknown>, fields: string[]) =>
    Object.keys(v).sort().join('|') === [...fields].sort().join('|');
  const data: unknown = JSON.parse(raw);
  if (!record(data) || !exact(data, ['kind','version','contacts']) ||
    data.kind !== 'woonpoints-private-utility-contacts' || data.version !== 1 ||
    !Array.isArray(data.contacts) || data.contacts.length > CONTACT_LIMIT)
    throw Error('Unsupported contact backup');
  const ids = new Set<number>();
  const entries: PrivateUtilityContact[] = [];
  for (const value of data.contacts) {
    if (!record(value) || !exact(value, ['id','utility','day','channel','note','followUp'])) {
      throw Error('Invalid record');
    }
    const item = value as PrivateUtilityContact;
    if (!privateContactValid(item) || ids.has(item.id)) throw Error('Invalid contact record');
    ids.add(item.id);
    entries.push(item);
  }
  if (privateContactBackup(entries) !== raw) throw Error('Noncanonical backup');
  return entries;
}
function privateContactReport(entries: PrivateUtilityContact[], withNotes: boolean): string {
  const lines = [
    'WOONPOINTS · MIJN EIGEN LEVERANCIERSCONTACTEN',
    'Ongeverifieerde privénotities. Geen bewijs van officiële aanmelding, afspraak of contract.',
    'Geen berichten verzonden, niets gesynchroniseerd.',
    ''
  ];
  for (const entry of [...entries].sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id)) {
    const utility=PRIVATE_UTILITIES.find(item=>item.id===entry.utility)?.name||'Onbekend';
    const channel=CONTACT_CHANNELS.find(item=>item.id===entry.channel)?.label||'Onbekend';
    lines.push(entry.day + ' · ' + utility + ' · ' + channel);
    lines.push('Eigen opvolgdatum: ' + (entry.followUp || 'nog niet gepland'));
    if (withNotes) lines.push('Privénotitie: ' + entry.note);
    lines.push('');
  }
  return lines.join('\r\n') + '\r\n';
}

/** Calendar export carries only reviewed category labels and civil dates, never private notes. */
function privateContactCalendar(entries: PrivateUtilityContact[], today: string): string {
  const output = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Woonpoints//Eigen Leverancierscontacten//NL',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'
  ];
  const stamp = new Date().toISOString().replaceAll('-', '').replaceAll(':', '')
    .replace(/\.\d{3}Z$/, 'Z');
  for (const item of [...entries].sort((a,b)=>a.followUp.localeCompare(b.followUp)||a.id-b.id)) {
    if(!handoverValidDay(item.followUp)||item.followUp<today)continue;
    const label=PRIVATE_UTILITIES.find(x=>x.id===item.utility)?.name;
    if(!label)continue;
    const start=item.followUp.replaceAll('-', '');
    const end=privateUtilityTomorrow(item.followUp).replaceAll('-', '');
    output.push('BEGIN:VEVENT',
      'UID:woonpoints-contact-' + item.id + '-' + start + '@offline.local',
      'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + start,
      'DTEND;VALUE=DATE:' + end,
      'SUMMARY:Eigen opvolging - ' + label,
      'DESCRIPTION:Persoonlijke herinnering. Geen bevestigde afspraak.',
      'END:VEVENT');
  }
  output.push('END:VCALENDAR');
  return output.join('\r\n') + '\r\n';
}

/** A separate private contact timeline: no account sync, supplier calls or persistent records. */
function PrivateUtilityContactLog({intent}:{
  intent?:{utility:PrivateUtilityKey;revision:number}|null
}={}) {
  const [entries,setEntries] = useState<PrivateUtilityContact[]>([]);
  const [draft,setDraft] = useState<PrivateContactDraft>({ ...CONTACT_NEW });
  useEffect(()=>{
    if(intent) setDraft(previous=>({...previous,utility:intent.utility}));
  },[intent]);
  const [selected,setSelected] = useState<PrivateUtilityKey|'all'>('all');
  const [includeNotes,setIncludeNotes] = useState(false);
  const [preview,setPreview] = useState<{
    source:string; text:string; mode:'txt'|'json'|'ics'; notes:boolean
  }|null>(null);
  const [approved,setApproved]=useState(false);
  const [feedback,setFeedback]=useState('');
  const [pendingDelete,setPendingDelete] = useState<number|null>(null);
  const [undoDelete,setUndoDelete] = useState<{after:string;before:PrivateUtilityContact[]}|null>(null);
  const [pendingImport,setPendingImport] = useState<{
    from:string; incoming:PrivateUtilityContact[]
  }|null>(null);
  const [approvedImport,setApprovedImport] = useState(false);
  const [undoImport,setUndoImport] = useState<{
    after:string;before:PrivateUtilityContact[]
  }|null>(null);
  const source=JSON.stringify(entries);
  const previewCurrent=preview!==null && preview.source===source &&
    preview.notes===includeNotes;
  const importCurrent=pendingImport!==null && pendingImport.from===source;
  const undoCurrent=undoImport!==null&&undoImport.after===source;
  const deleteUndoCurrent=undoDelete!==null&&undoDelete.after===source;
  const visible=entries.filter(entry=>selected==='all'||entry.utility===selected)
    .sort((a,b)=>b.day.localeCompare(a.day)||b.id-a.id);
  const noteValid=draft.note.trim().length>0 && draft.note.length<=CONTACT_NOTE_LIMIT &&
    !/[\u0000-\u001f\u007f\u2028\u2029]/u.test(draft.note);
  const draftValid=handoverValidDay(draft.day) &&
    (draft.followUp===''||handoverValidDay(draft.followUp)) && noteValid;
  const today=new Date();
  const dayToday=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),
    String(today.getDate()).padStart(2,'0')].join('-');
  const dated=entries.filter(item=>item.followUp!=='' && handoverValidDay(item.followUp))
    .sort((a,b)=>a.followUp.localeCompare(b.followUp)||a.id-b.id);
  const upcoming=dated.filter(item=>item.followUp>=dayToday);
  const overdue=dated.filter(item=>item.followUp<dayToday);
  let weekLimit=dayToday;
  for(let i=0;i<7;i++)weekLimit=privateUtilityTomorrow(weekLimit);
  const dueSoon=upcoming.filter(item=>item.followUp<=weekLimit);
  const dueLater=upcoming.filter(item=>item.followUp>weekLimit);
  function editDraft(patch:Partial<PrivateContactDraft>) {
    setDraft(previous=>({...previous,...patch}));
    setFeedback('');
  }
  function jumpToContact(item:PrivateUtilityContact) {
    setSelected(item.utility);
    window.setTimeout(()=>document.getElementById('private-utility-contact-'+item.id)
      ?.scrollIntoView({behavior:'smooth',block:'center'}),0);
  }
  function save() {
    if(!draftValid||entries.length>=CONTACT_LIMIT)return;
    const next=Math.max(0,...entries.map(e=>e.id))+1;
    if(next>1000000)return;
    const contact={...draft,id:next,note:draft.note.trim()};
    if(!privateContactValid(contact))return;
    setEntries(previous=>[...previous,contact]);
    setDraft({...CONTACT_NEW,utility:draft.utility});
    setPreview(null);setApproved(false);setPendingDelete(null);
    setPendingImport(null);setApprovedImport(false);
    setUndoDelete(null);setUndoImport(null);
    setFeedback('Contactmoment uitsluitend in dit tabblad toegevoegd.');
  }
  function remove(id:number){
    if(pendingDelete!==id){setPendingDelete(id);setFeedback('Bevestig de verwijdering hieronder.');return}
    setUndoDelete({after:JSON.stringify(entries.filter(e=>e.id!==id)),before:entries});
    setEntries(previous=>previous.filter(entry=>entry.id!==id));
    setPendingDelete(null);setPendingImport(null);setApprovedImport(false);
    setUndoImport(null);setPreview(null);setApproved(false);
    setFeedback('Contact verwijderd. Herstel is één keer mogelijk zolang niets verandert.');
  }
  function revertDelete(){
    if(!deleteUndoCurrent||undoDelete===null)return;
    setEntries(undoDelete.before);setUndoDelete(null);
    setPreview(null);setApproved(false);
    setFeedback('Je eigen contactmoment is teruggezet.');
  }
  function openPreview(mode:'txt'|'json'|'ics'){
    if(!entries.length||(mode==='ics'&&!upcoming.length))return;
    setPreview({source,mode,notes:includeNotes,
      text:mode==='json'?privateContactBackup(entries):
        mode==='ics'?privateContactCalendar(entries,dayToday):
          privateContactReport(entries,includeNotes)});
    setApproved(false);setFeedback('');
  }
  function download(){
    if(!previewCurrent||!approved||preview===null)return;
    const blob=new Blob([preview.text],{type:preview.mode==='json'
      ?'application/json;charset=utf-8':preview.mode==='ics'
        ?'text/calendar;charset=utf-8':'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;
    link.download=preview.mode==='json'
      ?'woonpoints-prive-contacten.json':preview.mode==='ics'
        ?'woonpoints-eigen-contactopvolging.ics':'woonpoints-prive-contacten.txt';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    setApproved(false);setFeedback('Alleen het door jou gecontroleerde bestand is aangeboden.');
  }
  async function chooseFile(file:File|undefined){
    if(!file)return;
    const from=source;
    setPendingImport(null);setApprovedImport(false);setFeedback('');
    if(file.size>24*1024){
      setFeedback('Herstelbestand geweigerd: groter dan 24 KiB.');return;
    }
    try{
      const incoming=privateContactReadBackup(await file.text());
      setPendingImport({from,incoming});
    }catch{setFeedback('Geen geldig eigen Woonpoints-contactenbestand.');}
  }
  function doImport(){
    if(!importCurrent||!approvedImport||pendingImport===null)return;
    const incoming=pendingImport.incoming;
    setUndoImport({after:JSON.stringify(incoming),before:entries});
    setEntries(incoming);setPendingImport(null);setApprovedImport(false);
    setPendingDelete(null);setUndoDelete(null);setPreview(null);setApproved(false);
    setFeedback('Volledige eigen contacttijdlijn vervangen; éénmalig privéherstel beschikbaar.');
  }
  function revertImport(){
    if(!undoCurrent||undoImport===null)return;
    setEntries(undoImport.before);setUndoImport(null);setPreview(null);setApproved(false);
    setFeedback('Eerdere tabbladcontacten hersteld.');
  }
  return <section className="panel" aria-labelledby="private-utility-contacts-heading"
    style={{display:'block'}}>
    <p className="eyebrow">MIJN EIGEN NOTITIES</p>
    <h2 id="private-utility-contacts-heading">Contacten en opvolging bijhouden</h2>
    <p><a href="#private-utility-transfer-heading">Terug naar mijn zesstappen-verhuischecklist ↑</a>
      {' '}Dit contactlogboek wijzigt nooit vanzelf de status van een contract of aanvraag.</p>
    <p>Leg zelf een contactmoment vast voor energie, water, internet, verzekering, gemeente
      of parkeren. Bewaar geen wachtwoorden, rekeningnummers, identiteitsnummers of andere
      geheime gegevens. Niets wordt naar leveranciers, overheid of WoningNet verstuurd.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))',
      gap:12}}>
      <label>Onderdeel
        <select value={draft.utility} onChange={e=>editDraft({utility:e.target.value as PrivateUtilityKey})}>
          {PRIVATE_UTILITIES.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <label>Mijn contactdatum
        <input type="date" value={draft.day} min="2000-01-01" max="2099-12-31"
          onChange={e=>editDraft({day:e.target.value.slice(0,10)})}/>
      </label>
      <label>Manier van contact
        <select value={draft.channel}
          onChange={e=>editDraft({channel:e.target.value as PrivateContactChannel})}>
          {CONTACT_CHANNELS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </label>
      <label>Eigen opvolgdatum (optioneel)
        <input type="date" value={draft.followUp} min="2000-01-01" max="2099-12-31"
          onChange={e=>editDraft({followUp:e.target.value.slice(0,10)})}/>
      </label>
    </div>
    <label style={{display:'block',marginTop:12}}>Mijn privénotitie (maximaal 200 tekens)
      <textarea rows={3} maxLength={CONTACT_NOTE_LIMIT} value={draft.note}
        onChange={e=>editDraft({note:e.target.value})}
        placeholder="Bijv. zelf nagevraagd; wacht op bevestiging." />
    </label>
    <button type="button" disabled={!draftValid||entries.length>=CONTACT_LIMIT}
      onClick={save}>Bewaar dit contact uitsluitend in mijn tabblad</button>
    <p>{entries.length} van maximaal {CONTACT_LIMIT} eigen contactmomenten.
      {''} {upcoming.length} zelf geplande toekomstige opvolgmomenten,
      {' '}{overdue.length} verstreken eigen datums.</p>
    <div role="group" aria-label="Mijn privéopvolgdesk">
      <h3>Mijn eigen opvolgdesk</h3>
      <p><strong>{overdue.length} verstreken</strong> · {dueSoon.length} binnen zeven dagen
        · {dueLater.length} later. Dit zijn geen officiële reactietermijnen.</p>
      {([
        {id:'overdue',name:'Eigen controledatum verstreken',items:overdue},
        {id:'soon',name:'Binnen zeven dagen',items:dueSoon},
        {id:'later',name:'Later gepland',items:dueLater}
      ] as {id:string;name:string;items:PrivateUtilityContact[]}[]).map(bucket=>
        <details key={bucket.id} style={{marginTop:10}}>
          <summary>{bucket.name} ({bucket.items.length})</summary>
          {bucket.items.length===0?<p>Geen eigen contactmomenten in deze categorie.</p>:
            <ol>{bucket.items.map(entry=><li key={entry.id}
              style={{padding:'8px 0'}}>
              <strong>{entry.followUp}</strong> — {
                PRIVATE_UTILITIES.find(i=>i.id===entry.utility)?.name}
              <button type="button" className="secondary"
                onClick={()=>jumpToContact(entry)}>
                Open dit contact in mijn privétijdlijn ↓</button>
            </li>)}</ol>}
        </details>)}
    </div>
    <label style={{display:'block'}}>Filter mijn contacten
      <select value={selected}
        onChange={e=>setSelected(e.target.value as PrivateUtilityKey|'all')}>
        <option value="all">Alle zes onderdelen</option>
        {PRIVATE_UTILITIES.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}
      </select>
    </label>
    {upcoming.length>0&&<details>
      <summary>Mijn {upcoming.length} toekomstige zelf gekozen opvolgdatums</summary>
      <ol>{upcoming.map(entry=><li key={entry.id}>
        <strong>{entry.followUp}</strong> — {
          PRIVATE_UTILITIES.find(item=>item.id===entry.utility)?.name}
        {' '}({CONTACT_CHANNELS.find(channel=>channel.id===entry.channel)?.label})
      </li>)}</ol>
      <p>Alleen zelf ingevulde data; geen officiële of geboekte afspraken.</p>
    </details>}
    {visible.length===0?<p>Geen contactmomenten voor deze selectie.</p>:
      <ol>{visible.map(entry=><li key={entry.id} id={'private-utility-contact-'+entry.id} style={{margin:'14px 0',padding:'12px 0',
        borderBottom:'1px solid #dce7e0'}}>
        <strong>{entry.day}</strong> · {PRIVATE_UTILITIES.find(x=>x.id===entry.utility)?.name}
        {' '}· {CONTACT_CHANNELS.find(x=>x.id===entry.channel)?.label}
        <p>Zelf genoteerde opvolging: {entry.followUp||'niet ingepland'}</p>
        <details><summary>Privénotitie tonen</summary>
          <p style={{overflowWrap:'anywhere',whiteSpace:'pre-wrap'}}>{entry.note}</p></details>
        <button type="button" className="secondary" onClick={()=>remove(entry.id)}>
          {pendingDelete===entry.id?'Bevestig verwijdering':'Verwijder mijn contact'}
        </button>
      </li>)}</ol>}
    {deleteUndoCurrent&&<button type="button" className="secondary"
      onClick={revertDelete}>Herstel mijn laatst verwijderde contact</button>}
    <fieldset style={{border:'1px solid #c4d6c9',borderRadius:12,padding:14,marginTop:16}}>
      <legend><strong>Eigen privécontacten exporteren</strong></legend>
      <label style={{display:'flex',gap:8,alignItems:'center'}}>
        <input type="checkbox" checked={includeNotes}
          onChange={e=>{setIncludeNotes(e.target.checked);setApproved(false);}}/>
        Neem vrije privénotities bewust op in het leesbare TXT-overzicht.
      </label>
      <p>JSON-herstelback-up bevat altijd je volledige privénotities en vereist ook
        afzonderlijke toestemming. TXT laat die standaard weg.
        Een optionele ICS bevat uitsluitend datums en categorieën: geen privénotities.</p>
      <button type="button" disabled={!entries.length} onClick={()=>openPreview('txt')}>
        Bekijk exacte TXT-export</button>
      <button type="button" className="secondary" disabled={!entries.length}
        onClick={()=>openPreview('json')}>Bekijk volledige JSON-herstelback-up</button>
      <button type="button" className="secondary" disabled={!upcoming.length}
        onClick={()=>openPreview('ics')}>Bekijk mijn opvolgagenda (ICS)</button>
      {preview!==null&&<div style={{padding:12,marginTop:12,border:'1px solid #c4d6c9',
        borderRadius:10}}>
        {!previewCurrent?<p role="alert">Bron of privacykeuze gewijzigd. Controleer opnieuw.</p>:<>
          <p><strong>Volledige exacte inhoud, vóór downloaden:</strong></p>
          <pre style={{maxHeight:300,overflowY:'auto',whiteSpace:'pre-wrap',
            overflowWrap:'anywhere'}}>{preview.text}</pre>
          <label style={{display:'flex',gap:8,alignItems:'start'}}>
            <input type="checkbox" checked={approved}
              onChange={e=>setApproved(e.target.checked)}/>
            Ik heb het volledige bestand gezien en kies zelf waar ik het opsla of deel.
          </label>
          <button type="button" disabled={!approved} onClick={download}>
            Download precies dit gecontroleerde {preview.mode.toUpperCase()}-bestand</button>
        </>}
      </div>}
    </fieldset>
    <fieldset style={{border:'1px solid #c4d6c9',borderRadius:12,padding:14,marginTop:16}}>
      <legend><strong>Privécontacten uit mijn JSON-back-up herstellen</strong></legend>
      <p>Vervangt de volledige eigen tijdlijn, nooit een gedeeltelijke samenvoeging.
        Eerst controleren, dan apart bevestigen. Maximaal 24 KiB.</p>
      <input type="file" accept=".json,application/json"
        aria-label="Kies eigen Woonpoints-contactenback-up"
        onChange={e=>{const f=e.target.files?.[0];e.target.value='';void chooseFile(f);}}/>
      {pendingImport!==null&&<div style={{marginTop:12}}>
        {!importCurrent?<p role="alert">Huidige contacten gewijzigd. Kies de back-up opnieuw.</p>:<>
          <p>Vervang <strong>{entries.length}</strong> huidige contacten door
            <strong> {pendingImport.incoming.length}</strong> contacten uit je bestand.</p>
          <details><summary>Bekijk alle vervangende privécontacten</summary>
            <pre style={{maxHeight:260,overflowY:'auto',whiteSpace:'pre-wrap',
              overflowWrap:'anywhere'}}>
              {privateContactReport(pendingImport.incoming,true)}
            </pre></details>
          <label style={{display:'flex',gap:8,alignItems:'start'}}>
            <input type="checkbox" checked={approvedImport}
              onChange={e=>setApprovedImport(e.target.checked)}/>
            Ik heb de vervangende volledige tijdlijn gecontroleerd en wil mijn
            huidige tabbladcontacten vervangen.
          </label>
          <button type="button" disabled={!approvedImport} onClick={doImport}>
            Vervang mijn tijdlijn met de gecontroleerde back-up</button>
        </>}
      </div>}
      {undoCurrent&&<button type="button" className="secondary" onClick={revertImport}>
        Herstel éénmalig mijn vorige contacttijdlijn</button>}
    </fieldset>
    <p role="status" aria-live="polite">{feedback}</p>
    <p>Geen automatische verificatie, communicatie, lokale opslag of synchronisatie.
      Een bewust gedownload agenda-item kan door je agenda-app worden gesynchroniseerd;
      ook dan zijn deze datums nooit officiële afspraken.
      Bij sluiten of vernieuwen van het tabblad verdwijnt dit log; zelf gedownloade
      bestanden kunnen persoonlijke details bevatten en vallen onder jouw beheer.</p>
  </section>;
}



/**
 * Handmatige woonreis. Deze status is uitsluitend een eigen afvinklijst:
 * geen WoningNet-account, taakbewijs, serverpersistente opslag of toestemming.
 */
type JourneyPhase = 'zoeken' | 'kiezen' | 'voorbereiden' | 'verhuizen' | 'nazorg';
type JourneyStep = { id: string; label: string; target: string; help: string };
const HOUSING_JOURNEY: { id: JourneyPhase; label: string; detail: string; steps: JourneyStep[] }[] = [
  { id: 'zoeken', label: '1 · Zoeken', detail: 'Breng je eigen woonzoektocht in kaart.', steps: [
    {id:'maanddoel',label:'Bekijk mijn maanddoel',target:'manual-progress-heading',help:'Leg zelf vast wat je al hebt gedaan; dit bewijst geen geldige reactie.'},
    {id:'maandplan',label:'Maak een reactieplanning',target:'private-reaction-pacing-heading',help:'Verdeel je eigen acties zonder automatisch te reageren.'},
    {id:'dagboek',label:'Werk mijn reactiedagboek bij',target:'reaction-journal-title',help:'Alleen zelf ingevoerde, niet-geverifieerde waarnemingen.'},
    {id:'posities',label:'Bekijk mijn positiegeschiedenis',target:'monthly-positions-heading',help:'Gebruik alleen de handmatig ingevoerde resultaten.'}
  ]},
  { id: 'kiezen', label: '2 · Kiezen', detail: 'Vergelijk eigen opties voordat je beslist.', steps: [
    {id:'woningen',label:'Vergelijk woningen',target:'housing-shortlist-heading',help:'Persoonlijke voorkeuren, geen officiële toewijzingskans.'},
    {id:'woonkosten',label:'Controleer mijn woonkosten',target:'private-budget-title',help:'Bereken de lasten met eigen aannames.'},
    {id:'reistijd',label:'Vergelijk woon-werkreistijd',target:'private-commute-heading',help:'Gebruik je eigen reistijdschattingen.'},
    {id:'bezichtiging',label:'Bereid een bezichtiging voor',target:'private-viewing-title',help:'Maak een eigen checklist zonder extern contact.'}
  ]},
  { id: 'voorbereiden', label: '3 · Voorbereiden', detail: 'Maak je eigen verhuizing beheersbaar.', steps: [
    {id:'planner',label:'Werk de actieplanner bij',target:'private-plan-title',help:'Controleer zelf of afspraken definitief zijn.'},
    {id:'werkmap',label:'Bewaar mijn verhuiswerkmap',target:'private-moving-workspace-heading',help:'Kies zelf wanneer je privégegevens exporteert.'},
    {id:'kosten',label:'Werk mijn kostenoverzicht bij',target:'private-moving-expenses-heading',help:'Werkelijke bedragen zijn alleen wat je zelf hebt vastgelegd.'},
    {id:'documenten',label:'Controleer benodigde documenten',target:'private-document-readiness-heading',help:'Geen automatische beoordeling door verhuurder of gemeente.'}
  ]},
  { id: 'verhuizen', label: '4 · Verhuizen', detail: 'Regel de overdracht en de verhuisdag.', steps: [
    {id:'paklijst',label:'Controleer de paklijst',target:'private-packing-heading',help:'Controleer zelf de spullen en hoeveelheden.'},
    {id:'helpers',label:'Stem mijn verhuishulp af',target:'private-moving-helpers-heading',help:'Geen automatische berichten naar helpers.'},
    {id:'verhuisdag',label:'Plan mijn verhuisdag',target:'private-moving-day-heading',help:'Geen externe reserveringen of bevestigingen.'},
    {id:'sleutels',label:'Maak een eigen sleutelrapport',target:'private-handover-heading',help:'Alleen persoonlijke overdrachtsnotities.'}
  ]},
  { id: 'nazorg', label: '5 · Nazorg', detail: 'Houd eigen controlepunten bij na de verhuizing.', steps: [
    {id:'meters',label:'Controleer meterstanden',target:'private-meter-handover-heading',help:'Geen automatische leveranciersmelding.'},
    {id:'nuts',label:'Controleer nutsvoorzieningen',target:'private-utility-transfer-heading',help:'Contracten worden niet namens jou gewijzigd.'},
    {id:'nazorgplan',label:'Bekijk mijn nazorgweekplan',target:'nazorg-weekplan-title',help:'Datums zijn zelfgekozen, niet officieel vastgesteld.'},
    {id:'gebreken',label:'Werk mijn nazorgdossier bij',target:'nazorg',help:'Eigen waarnemingen; er wordt geen melding verstuurd.'}
  ]}
];
const JOURNEY_IDS = new Set(HOUSING_JOURNEY.flatMap(phase => phase.steps.map(step => step.id)));
const JOURNEY_BACKUP_KIND = 'woonpoints-private-woonreis';
const JOURNEY_BACKUP_LIMIT = 4096;

const JOURNEY_TAB_STORAGE_KEY='woonpoints:private-housing-journey:tab-recovery:v1';
function encodeJourneyTab(checked:string[]):string{
  return JSON.stringify({kind:JOURNEY_BACKUP_KIND,version:1,checked});
}
function decodeJourneyTab(raw:string):string[]|null{
  if(raw.length>JOURNEY_BACKUP_LIMIT)return null;
  try{
    const value:unknown=JSON.parse(raw);
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const data=value as Record<string,unknown>;
    if(Object.keys(data).sort().join(',')!=='checked,kind,version'||
      data.kind!==JOURNEY_BACKUP_KIND||data.version!==1||
      !Array.isArray(data.checked)||data.checked.length>JOURNEY_IDS.size||
      !data.checked.every((id:unknown)=>typeof id==='string'&&JOURNEY_IDS.has(id))||
      new Set(data.checked).size!==data.checked.length)return null;
    return data.checked as string[];
  }catch{return null;}
}


function PrivateHousingJourney({onPulse,onBundleSnapshot}:{
  onPulse?:(pulse:PrivateMovePulse)=>void;
  onBundleSnapshot?:PrivateMovingSnapshotChange
}={}) {
  const {value:checked,setValue:setChecked,enabled:rememberJourney,hydrated:journeyReady,
    storageMessage:journeyStorageMessage,enable:enableJourneyRestore,
    disable:disableJourneyRestore}=usePrivateTabRecovery<string[]>(
      JOURNEY_TAB_STORAGE_KEY,()=>[],encodeJourneyTab,decodeJourneyTab,
      JOURNEY_BACKUP_LIMIT,onBundleSnapshot);
  const [selectedPhase,setSelectedPhase] = useState<JourneyPhase>('zoeken');
  const [onlyOpen,setOnlyOpen] = useState(false);
  const [pendingImport,setPendingImport] = useState<string[] | null>(null);
  const [undoImport,setUndoImport] = useState<string[] | null>(null);
  const [exportPreview,setExportPreview] = useState(false);
  const [confirmReset,setConfirmReset] = useState(false);
  const [message,setMessage] = useState('');
  const total = JOURNEY_IDS.size;
  const complete = checked.length;
  useEffect(()=>{onPulse?.({done:complete,total,attention:0,invalid:false});},
    [onPulse,complete,total]);
  const currentPhase = HOUSING_JOURNEY.find(phase => phase.id === selectedPhase)!;
  const next = HOUSING_JOURNEY.flatMap(phase => phase.steps)
    .find(step => !checked.includes(step.id));
  const backup = JSON.stringify({
    kind: JOURNEY_BACKUP_KIND, version: 1,
    checked: HOUSING_JOURNEY.flatMap(phase => phase.steps)
      .filter(step => checked.includes(step.id)).map(step => step.id)
  },null,2);

  function changeProgress(nextChecked: string[]) {
    setChecked(nextChecked);
    setPendingImport(null);
    setUndoImport(null);
    setExportPreview(false);
    setConfirmReset(false);
    setMessage('Eigen voortgang bijgewerkt. Niets is extern bevestigd of opgeslagen.');
  }
  function toggleStep(id: string) {
    changeProgress(checked.includes(id) ? checked.filter(item => item !== id) : [...checked,id]);
  }
  async function readBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPendingImport(null);
    setUndoImport(null);
    setMessage('');
    if (!file) return;
    try {
      if (file.size > JOURNEY_BACKUP_LIMIT || file.size === 0) throw new Error('size');
      const raw: unknown = JSON.parse(await file.text());
      if (!isRecord(raw) || !exactKeys(raw,['kind','version','checked']) ||
          raw.kind !== JOURNEY_BACKUP_KIND || raw.version !== 1 ||
          !Array.isArray(raw.checked) || raw.checked.length > total ||
          !raw.checked.every((id: unknown) => typeof id === 'string' && JOURNEY_IDS.has(id)) ||
          new Set(raw.checked).size !== raw.checked.length) throw new Error('schema');
      setPendingImport(raw.checked as string[]);
      setExportPreview(false);
      setConfirmReset(false);
      setMessage('Bestand gecontroleerd. Je huidige voortgang is nog niet vervangen.');
    } catch {
      setMessage('Herstel geweigerd: dit is geen geldige, kleine Woonpoints-woonreisback-up. Bestaande voortgang behouden.');
    }
  }
  function downloadBackup() {
    if (!exportPreview) return;
    const blob = new Blob([backup+'\n'],{type:'application/json;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'woonpoints-mijn-woonreis.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage('Privébestand aangeboden aan je browser. Bewaar het zelf op een veilige plek.');
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url),1000);
      setExportPreview(false);
    }
  }
  const shownSteps = currentPhase.steps.filter(step => !onlyOpen || !checked.includes(step.id));
  const phaseDone = currentPhase.steps.filter(step => checked.includes(step.id)).length;

  return <section className="panel" aria-labelledby="private-journey-heading" style={{display:'block'}}>
    <p className="eyebrow">MIJN WOONREIS · HANDMATIG</p>
    <h2 id="private-journey-heading">Van woning zoeken tot nazorg</h2>
    <p>Een persoonlijke routekaart langs de bestaande Woonpoints-hulpmiddelen.
      Vink zelf stappen af; dit zegt niets over geldige WoningNet-reacties, afspraken,
      vergunningen of woningtoewijzing. Je voortgang blijft uitsluitend in dit
      browsertabblad.</p>
    <details>
      <summary style={{cursor:'pointer',fontWeight:700}}>
        Mijn woonreis herstellen na herladen ({rememberJourney?'aan':'uit'})
      </summary>
      <p>Zonder toestemming blijft de woonreis alleen in het geheugen van dit
        tabblad. Met toestemming bewaren we uitsluitend bekende stapcodes
        (geen namen, adressen, WoningNet-gegevens of notities) in
        niet-versleutelde sessie-opslag van dit tabblad. Andere scripts op deze site
        kunnen de codes lezen. Bij sluiten van het tabblad verdwijnen ze gewoonlijk.
        Een JSON-download is nodig voor permanent bewaren.</p>
      {rememberJourney?
        <button type="button" disabled={!journeyReady} onClick={disableJourneyRestore}
          style={{minHeight:44}}>Stop bewaren en wis deze tabbladstatus</button>:
        <button type="button" disabled={!journeyReady} onClick={enableJourneyRestore}
          style={{minHeight:44}}>Ja, onthoud mijn woonreis bij herladen</button>}
      <p role="status" aria-live="polite">
        {journeyStorageMessage|| (journeyReady?'Bewaren is uitgeschakeld.':'Opslag wordt gecontroleerd.')}
      </p>
    </details>
    <div role="status" aria-live="polite">
      <strong>{complete} van {total} stappen zelf afgevinkt</strong>
      <p><progress value={complete} max={total} aria-label="Eigen woonreisvoortgang" style={{width:'100%',maxWidth:560}}/>
        {' '}{Math.round(100*complete/total)}% persoonlijke voortgang</p>
      {next ? <p>Volgende open stap: <a href={'#'+next.target}>{next.label} →</a></p> :
        <p>Alle persoonlijke stappen afgevinkt. Controleer belangrijke zaken nog zelf bij de betreffende organisatie.</p>}
    </div>
    <div role="group" aria-label="Fasen van de woonreis"
      style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>
      {HOUSING_JOURNEY.map(phase => {
        const done = phase.steps.filter(step => checked.includes(step.id)).length;
        return <button type="button" key={phase.id} aria-pressed={selectedPhase===phase.id}
          onClick={()=>setSelectedPhase(phase.id)}
          style={{minHeight:44,padding:'8px 12px',borderRadius:8,
            border:'1px solid #355e42',
            background:selectedPhase===phase.id?'#355e42':'white',
            color:selectedPhase===phase.id?'white':'#355e42'}}>
          {phase.label} · {done}/{phase.steps.length}
        </button>;
      })}
    </div>
    <h3>{currentPhase.label}</h3>
    <p>{currentPhase.detail} <strong>{phaseDone}/{currentPhase.steps.length}</strong> zelf gedaan.</p>
    <label style={{display:'flex',alignItems:'center',gap:8,margin:'12px 0'}}>
      <input type="checkbox" checked={onlyOpen}
        onChange={event=>setOnlyOpen(event.target.checked)}/> Toon alleen open stappen
    </label>
    {shownSteps.length===0?<p>In deze fase zijn geen open stappen meer.</p>:
      <ul style={{listStyle:'none',padding:0,display:'grid',gap:10}}>
        {shownSteps.map(step=><li key={step.id} style={{padding:12,border:'1px solid #d4dfd5',borderRadius:8}}>
          <label style={{display:'flex',alignItems:'center',gap:10,fontWeight:700}}>
            <input type="checkbox" checked={checked.includes(step.id)}
              onChange={()=>toggleStep(step.id)} aria-label={'Zelf voltooid: '+step.label}/>
            {step.label}
          </label>
          <p style={{margin:'6px 0'}}>{step.help}</p>
          <a href={'#'+step.target}>Open bestaand onderdeel ↓</a>
        </li>)}
      </ul>}
    <details style={{marginTop:16}}>
      <summary style={{cursor:'pointer',fontWeight:700}}>Zelf bewaren, terugzetten of wissen</summary>
      <p>Een bestand bevat uitsluitend de twintig stap-ID’s die je zelf hebt afgevinkt.
        Er worden geen notities uit andere onderdelen, accounts of contactgegevens verzameld.
        Een door jou gekozen opslaglocatie kan extern synchroniseren.</p>
      <button type="button" onClick={()=>{setExportPreview(!exportPreview);setPendingImport(null);}}
        style={{minHeight:44,marginRight:8}}>Bekijk privéback-up</button>
      {exportPreview && <div>
        <p>Controleer de exacte inhoud voordat je een eigen bestand opslaat:</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:200,overflow:'auto'}}>{backup}</pre>
        <button type="button" onClick={downloadBackup} style={{minHeight:44}}>Download dit gecontroleerde JSON-bestand</button>
        <button type="button" onClick={()=>setExportPreview(false)} style={{minHeight:44,marginLeft:8}}>Annuleren</button>
      </div>}
      <label style={{display:'block',margin:'16px 0 6px'}} htmlFor="journey-import">Open eigen woonreisback-up (max. 4 KiB)</label>
      <input id="journey-import" type="file" accept=".json,application/json"
        onChange={readBackup} style={{maxWidth:'100%'}}/>
      {pendingImport && <div>
        <p>Te herstellen: <strong>{pendingImport.length} afgevinkte stappen</strong>.
          Momenteel {complete}; na vervangen {pendingImport.filter(id=>!checked.includes(id)).length} nieuw
          afgevinkt en {checked.filter(id=>!pendingImport.includes(id)).length} opnieuw open.
          Dit vervangt alleen de woonreis, niet andere Woonpoints-notities.</p>
        <button type="button" onClick={()=>{
          setUndoImport([...checked]);setChecked([...pendingImport]);setPendingImport(null);
          setExportPreview(false);setConfirmReset(false);
          setMessage('Eigen woonreis hersteld. Eenmalig terugdraaien mogelijk tot een volgende wijziging.');
        }} style={{minHeight:44}}>Vervang mijn woonreis</button>
        <button type="button" onClick={()=>setPendingImport(null)}
          style={{minHeight:44,marginLeft:8}}>Behoud huidige voortgang</button>
      </div>}
      {undoImport && <button type="button" onClick={()=>{
        setChecked(undoImport);setUndoImport(null);setMessage('Vorige woonreisvoortgang hersteld.');
      }} style={{minHeight:44,marginTop:12}}>Draai laatste import eenmalig terug</button>}
      <div style={{marginTop:16}}>
        <button type="button" onClick={()=>{setConfirmReset(true);setPendingImport(null);setExportPreview(false);}}
          style={{minHeight:44}}>Wis mijn woonreisvoortgang</button>
        {confirmReset && <div>
          <p>Weet je zeker dat je de {complete} zelf afgevinkte stappen wilt wissen?
            Alleen deze routekaart wordt gewist.</p>
          <button type="button" onClick={()=>changeProgress([])}
            style={{minHeight:44}}>Ja, wis mijn routekaart</button>
          <button type="button" onClick={()=>setConfirmReset(false)}
            style={{minHeight:44,marginLeft:8}}>Annuleren</button>
        </div>}
      </div>
    </details>
    {message && <p role="status" aria-live="polite">{message}</p>}
  </section>;
}
