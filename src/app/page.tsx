'use client';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { PrivateContractInlineChange, privateContractChangedDigits, PrivateContractParallelRows, isWhitespaceOnlyContractChange } from './manual-month-progress';
import { PrivateMovingDayTimeline } from './manual-month-progress';
import { PrivateMovingPackingInventory } from './manual-month-progress';
import { PrivateReactionWorkflow, PrivateReactionPacing, PrivateCommuteComparison, PrivateMovingHelperRoster, PrivateAddressChangePlanner, type PrivateHomeOverview, type PrivateMatchCostPair } from './position-stats';
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
  {id:'private-woningmatch-heading',title:'Mijn woningmatch',category:'woning'},
  {id:'private-offer-desk-heading',title:'Huurvoorstellen',category:'woning'},
  {id:'private-offer-safety-heading',title:'Aanbodcheck',category:'woning'},
  {id:'private-contract-review-heading',title:'Huurcontract nalopen',category:'woning'},
  {id:'private-contract-version-diff-heading',title:'Twee contractversies',category:'woning'},
  {id:'private-energy-quotes-heading',title:'Energietarieven vergelijken',category:'woning'},
  {id:'private-budget-title',title:'Woonkosten',category:'woning'},
  {id:'rental-scenarios-heading',title:'Huurscenario’s vergelijken',category:'woning'},
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
  'private-woningmatch-heading':['zelf woning vergelijken','matchscore','huurcriterium','match studio'],
  'private-contract-review-heading':['contract controleren','huurovereenkomst','voorwaarden','borg terug','contract tekenen'],
  'private-contract-version-diff-heading':['contractwijzigingen','conceptcontract','contractversie vergelijken','oude nieuwe overeenkomst'],
  'private-budget-title':['woonlasten','huur vergelijken'],
  'rental-scenarios-heading':['huurscenario','budget woning','borg reserveren','eerstejaarskosten','verhuizen kosten'],
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
  const [bundleSelected,setBundleSelected]=useState<string[]>(()=>PRIVATE_MOVING_BUNDLE_PARTS.map(part=>part.key));
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
    setBundleSelected(PRIVATE_MOVING_BUNDLE_PARTS.map(part=>part.key));
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
  function applyBundle(data:PrivateMovingBundleData,selected?:string[]){
    for(const part of PRIVATE_MOVING_BUNDLE_PARTS){
      if(selected&&!selected.includes(part.key))continue;
      window.dispatchEvent(new CustomEvent<PrivateMovingRestoreMessage>(
        PRIVATE_MOVING_BUNDLE_RESTORE_EVENT,{
          detail:{key:part.key,raw:data[part.key]}
        }));
    }
  }
  function restoreBundle(){
    if(!bundleIncomingFresh||!bundleRestoreApproved||!bundleIncoming||
      !bundleSelected.length)return;
    const previous={...snapshots};
    const next=bundleIncoming.data;
    const combined={...previous};
    for(const part of PRIVATE_MOVING_BUNDLE_PARTS){
      if(bundleSelected.includes(part.key))combined[part.key]=next[part.key];
    }
    // Every subdocument validates before any selected source is changed.
    applyBundle(next,bundleSelected);
    setBundleUndo({expected:privateMovingBundleSignature(combined),previous});
    setBundleIncoming(null);setBundleRestoreApproved(false);
    setBundleMessage(bundleSelected.length+' gekozen bronscherm(en) teruggezet. Je vorige tabbladstatus is éénmalig herstelbaar.');
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
          huidige invoer in de hieronder geselecteerde schermen</strong>; niets
          wordt buiten dit tabblad verzonden. De afzonderlijke automatische opslaginstellingen
          blijven zoals ze nu staan.</p>
          <fieldset style={{border:'1px solid #d4dfd5',padding:14,borderRadius:10}}>
            <legend><strong>Welke onderdelen wil je vervangen?</strong></legend>
            {PRIVATE_MOVING_BUNDLE_PARTS.map(part=><label key={part.key}
              style={{display:'block',minHeight:44}}>
              <input type="checkbox" checked={bundleSelected.includes(part.key)}
                onChange={event=>{
                  setBundleRestoreApproved(false);
                  setBundleSelected(previous=>event.target.checked?
                    [...previous,part.key]:previous.filter(key=>key!==part.key));
                }}/>
              {' '}{part.title}
            </label>)}
            <p>Niet geselecteerde onderdelen blijven ongewijzigd.
              Zonder selectie wordt niets vervangen.</p>
          </fieldset>
          <label style={{display:'block',minHeight:44}}>
            <input type="checkbox" checked={bundleRestoreApproved}
              onChange={event=>setBundleRestoreApproved(event.target.checked)}/>
            {' '}Ik begrijp dat de geselecteerde huidige formulieren worden vervangen.
          </label>
          <button type="button" disabled={!bundleRestoreApproved||bundleSelected.length===0}
            style={{minHeight:44}} onClick={restoreBundle}>
            Bevestig herstel van {bundleSelected.length} gekozen onderdeel(en)</button></>:
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

// Scoped feature, including private state and validation helpers; no external storage.
type PrivateRentalDecisionSnapshot={
  offerId:string;label:string;monthlyCents:number;initialCents:number;firstYearCents:number;
  checked:number;budgetCents:number|null
};
type PrivateEnergyRentalOfferProposal={label:string;monthlyCents:number;sourceKey:string};
type PrivateRentalScenarioOfferProposal={
  label:string;rentCents:number;serviceCents:number;utilitiesCents:number;depositCents:number
};
const PrivateRentalOfferDesk = (() => {
  const styles = {budget: 'rental-budget', buttons: 'rental-buttons', checks: 'rental-checks', column: 'rental-column', desk: 'rental-desk', details: 'rental-details', footnote: 'rental-footnote', form: 'rental-form', header: 'rental-header', importLabel: 'rental-importLabel', links: 'rental-links', notice: 'rental-notice', ok: 'rental-ok', portable: 'rental-portable', preview: 'rental-preview', ranking: 'rental-ranking', rowhead: 'rental-rowhead', sections: 'rental-sections', summary: 'rental-summary', two: 'rental-two', warn: 'rental-warn', warnbox: 'rental-warnbox'};
type OfferStatus = 'nog-bekijken'|'vragen-open'|'zelf-overwegen'|'afgewezen';
type Offer = {
  id:string; label:string; rentCents:number; serviceCents:number;
  utilitiesCents:number; depositCents:number; otherCents:number;
  startDate:string; status:OfferStatus; checked:string[]; questions:string;
};
type Draft = {
  label:string; rent:string; service:string; utilities:string; deposit:string;
  other:string; startDate:string; status:OfferStatus; questions:string;
};
type Backup = {kind:'woonpoints-prive-huurvoorstellen';version:1;offers:Offer[]};

const MAX_OFFERS=5;
const MAX_FILE=16*1024;
const MAX_CENTS=5_000_000;
const KIND='woonpoints-prive-huurvoorstellen';
const checklist=[
  {id:'huurprijs',name:'Huurprijs, kale huur en servicekosten schriftelijk nagekeken'},
  {id:'borg',name:'Borgsom en voorwaarden voor terugbetaling nagevraagd'},
  {id:'energie',name:'Energie-, internet- en overige contractkosten nagevraagd'},
  {id:'looptijd',name:'Looptijd, opzegging en voorwaarden nagelezen'},
  {id:'inspectie',name:'Staat van de woning en oplevering/inspectie besproken'},
  {id:'rechten',name:'Inschrijving, passendheid en eventuele officiële rechten zelf geverifieerd'}
] as const;
const ids=new Set<string>(checklist.map(item=>item.id));
const statuses:Record<OfferStatus,string>={
  'nog-bekijken':'Nog bekijken','vragen-open':'Nog vragen','zelf-overwegen':'Zelf overwegen','afgewezen':'Afgewezen'
};
const newDraft=():Draft=>({
  label:'',rent:'',service:'0',utilities:'0',deposit:'0',other:'0',
  startDate:'',status:'nog-bekijken',questions:''
});
const euro=(cents:number)=>new Intl.NumberFormat('nl-NL',{
  style:'currency',currency:'EUR'
}).format(cents/100);
const integerMoney=(value:string):number|null=>{
  const clean=value.trim();
  if(!/^(?:0|[1-9][0-9]{0,4})(?:[,.][0-9]{1,2})?$/.test(clean))return null;
  const [whole,dec='']=clean.replace(',','.').split('.');
  const cents=Number(whole)*100+Number(dec.padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents<=MAX_CENTS?cents:null;
};
const moneyText=(value:number)=>(value/100).toFixed(2).replace('.',',');
const object=(value:unknown):value is Record<string,unknown>=>
  typeof value==='object'&&value!==null&&!Array.isArray(value);
const hasKeys=(value:Record<string,unknown>,expected:readonly string[])=>
  Object.keys(value).length===expected.length&&Object.keys(value).every(k=>expected.includes(k));
const validLabel=(value:unknown,max:number)=>
  typeof value==='string'&&value===value.trim()&&value.length>=1&&value.length<=max&&
  !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
const validQuestions=(value:unknown)=>
  typeof value==='string'&&value.length<=400&&
  !/[\u0000-\u0008\u000b-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
const validDate=(value:unknown)=>
  typeof value==='string'&&(value===''||
  (/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T00:00:00.000Z'))&&
   new Date(value+'T00:00:00.000Z').toISOString().slice(0,10)===value));
const validMoney=(value:unknown):value is number=>
  typeof value==='number'&&Number.isSafeInteger(value)&&value>=0&&value<=MAX_CENTS;
const validOffer=(value:unknown):value is Offer=>{
  if(!object(value)||!hasKeys(value,[
    'id','label','rentCents','serviceCents','utilitiesCents','depositCents',
    'otherCents','startDate','status','checked','questions']))return false;
  return typeof value.id==='string'&&/^[a-z0-9-]{5,80}$/.test(value.id)&&
    validLabel(value.label,60)&&validMoney(value.rentCents)&&value.rentCents>0&&
    validMoney(value.serviceCents)&&validMoney(value.utilitiesCents)&&
    validMoney(value.depositCents)&&validMoney(value.otherCents)&&
    validDate(value.startDate)&&typeof value.status==='string'&&
    Object.hasOwn(statuses,value.status)&&
    validQuestions(value.questions)&&
    Array.isArray(value.checked)&&value.checked.length<=checklist.length&&
    value.checked.every((id:unknown)=>typeof id==='string'&&ids.has(id))&&
    new Set(value.checked).size===value.checked.length;
};
const decodeBackup=(raw:string):Offer[]=>{
  if(raw.length>MAX_FILE)throw Error('size');
  const data:unknown=JSON.parse(raw);
  if(!object(data)||!hasKeys(data,['kind','version','offers'])||
    data.kind!==KIND||data.version!==1||!Array.isArray(data.offers)||
    data.offers.length>MAX_OFFERS||!data.offers.every(validOffer))throw Error('format');
  const rows=data.offers as Offer[];
  if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('duplicates');
  return rows.map(row=>({...row,checked:[...row.checked]}));
};
const totals=(row:Offer)=>{
  const monthly=row.rentCents+row.serviceCents+row.utilitiesCents;
  return {
    monthly,
    initial:monthly+row.depositCents+row.otherCents,
    // Deposit is refundable in principle; separate upfront cash from 12-month spending.
    firstYear:monthly*12+row.otherCents
  };
};

/** Opt-in scenario inputs stay out of rental offer JSON backups and all network APIs. */
type RentalStressRecord={oldRent:string;moving:string;utilityDelta:string;cash:string;limit:string};
type RentalStressParsed={oldRent:number;moving:number;utilityDelta:number;cash:number|null;limit:number|null};
const initialRentalStress=():RentalStressRecord=>({
  oldRent:'0',moving:'0',utilityDelta:'0',cash:'',limit:''
});
function parseRentalStress(raw:RentalStressRecord):RentalStressParsed|null{
  const oldRent=integerMoney(raw.oldRent);
  const moving=integerMoney(raw.moving);
  const utilityDelta=integerMoney(raw.utilityDelta);
  const cash=raw.cash.trim()===''?null:integerMoney(raw.cash);
  const limit=raw.limit.trim()===''?null:integerMoney(raw.limit);
  if(oldRent===null||moving===null||utilityDelta===null||
    (raw.cash.trim()!==''&&cash===null)||(raw.limit.trim()!==''&&limit===null))return null;
  return {oldRent,moving,utilityDelta,cash,limit};
}
function rentalStressResult(row:Offer,scenario:RentalStressParsed,overlapMonths:number){
  const base=totals(row);
  const oldOverlap=scenario.oldRent*overlapMonths;
  const incremental=scenario.utilityDelta*12+oldOverlap+scenario.moving;
  return {
    monthly:base.monthly+scenario.utilityDelta,
    initial:base.initial+scenario.utilityDelta+oldOverlap+scenario.moving,
    firstYear:base.firstYear+incremental,
    extraYear:incremental
  };
}
function PrivateRentalStressPlan({offers}:{offers:Offer[]}){
  const [raw,setRaw]=useState<RentalStressRecord>(initialRentalStress);
  const [overlapMonths,setOverlapMonths]=useState(0);
  const [preview,setPreview]=useState<{signature:string;text:string}|null>(null);
  const [feedback,setFeedback]=useState('');
  const scenario=parseRentalStress(raw);
  const signature=JSON.stringify({raw,overlapMonths,offers:offers.map(row=>[
    row.id,row.label,row.rentCents,row.serviceCents,row.utilitiesCents,row.depositCents,row.otherCents
  ])});
  const results=scenario?offers.filter(validOffer).map(row=>({
    row,stress:rentalStressResult(row,scenario,overlapMonths)
  })).sort((a,b)=>a.stress.firstYear-b.stress.firstYear||
    a.row.label.localeCompare(b.row.label,'nl')):[];
  function update(field:keyof RentalStressRecord,value:string){
    setRaw(previous=>({...previous,[field]:value}));
    setPreview(null);setFeedback('');
  }
  function summary():string{
    if(!scenario||!results.length)return '';
    const header=[
      'WOONPOINTS · MIJN PRIVÉ WOONKOSTEN-SCENARIO',
      'Zelf ingevulde schattingen; geen financiële, juridische of officiële woningtoewijzing.',
      'Oude maandhuur: '+euro(scenario.oldRent),
      'Dubbele huur: '+overlapMonths+' extra maand(en)',
      'Eigen verhuiskosten: '+euro(scenario.moving),
      'Extra maandelijkse energie/onvoorzien: '+euro(scenario.utilityDelta),
      'Beschikbaar eigen startgeld: '+(scenario.cash===null?'onbekend':euro(scenario.cash)),
      'Eigen maandelijkse grens: '+(scenario.limit===null?'onbekend':euro(scenario.limit)),
      ''
    ];
    const lines=results.flatMap(({row,stress})=>[
      row.label+' ('+statuses[row.status]+')',
      'Geschatte maandlasten incl. tegenvaller: '+euro(stress.monthly),
      'Startgeld incl. eerste maand, borg, verhuiskosten en overlap: '+euro(stress.initial),
      'Eerste twaalf maanden excl. eventuele borgteruggave: '+euro(stress.firstYear),
      'Extra jaarlasten in dit scenario: '+euro(stress.extraYear),
      'Buffer na start: '+(scenario.cash===null?'onbekend':
        (scenario.cash>=stress.initial?euro(scenario.cash-stress.initial)+' over':
          euro(stress.initial-scenario.cash)+' tekort')),
      'Maandgrens: '+(scenario.limit===null?'niet ingevoerd':
        (scenario.limit>=stress.monthly?euro(scenario.limit-stress.monthly)+' ruimte':
          euro(stress.monthly-scenario.limit)+' boven eigen grens')),
      ''
    ]);
    return [...header,...lines,'Borg is als direct benodigd startgeld meegeteld, maar niet als definitieve jaaruitgave.',
      'Niet inbegrepen: dubbele verhuisuitgaven buiten dit model, verzekeringen, gemeentelijke lasten, belasting, indexatie.',
      'Geen aanvraag, portaalcontact, opslag of bericht verzonden.'].join('\n');
  }
  function download(){
    if(!preview||preview.signature!==signature||!scenario||!results.length){
      setFeedback('De voorstellen of aannames zijn veranderd. Bekijk opnieuw het actuele overzicht.');
      return;
    }
    const file=new Blob([preview.text+'\n'],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(file);
    try{
      const anchor=document.createElement('a');
      anchor.href=url;anchor.download='woonpoints-prive-huurscenario.txt';
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      setFeedback('Je gecontroleerde scenario is als TXT aan de browser aangeboden.');
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
    setPreview(null);
  }
  return <section className="rental-stress" aria-labelledby="rental-stress-title">
    <p className="eyebrow">FINANCIËLE TEGENVALLERS · WAT-ALS</p>
    <h3 id="rental-stress-title">Wat als verhuizen duurder uitvalt?</h3>
    <p>Vergelijk de <strong>bestaande eigen huurvoorstellen</strong> met
      extra energielasten, tijdelijke dubbele huur en verhuisuitgaven.
      Deze aannames blijven alleen in dit tabblad en wijzigen geen enkel huurvoorstel.</p>
    <div className="rental-stress-inputs">
      <label>Huidige maandhuur die tijdens overlap doorloopt (€)
        <input inputMode="decimal" value={raw.oldRent} onChange={e=>update('oldRent',e.target.value)}
          aria-describedby="rental-stress-explain"/></label>
      <label>Maanden dubbele huur
        <select value={overlapMonths} onChange={e=>{setOverlapMonths(Number(e.target.value));
          setPreview(null);setFeedback('');}}>
          {[0,1,2,3].map(n=><option key={n} value={n}>{n} maand{n===1?'':'en'}</option>)}
        </select></label>
      <label>Eigen geschatte verhuiskosten, eenmalig (€)
        <input inputMode="decimal" value={raw.moving} onChange={e=>update('moving',e.target.value)}/></label>
      <label>Extra energie/onvoorzien per maand (€)
        <input inputMode="decimal" value={raw.utilityDelta}
          onChange={e=>update('utilityDelta',e.target.value)}/></label>
      <label>Beschikbaar startgeld (€) <small>optioneel</small>
        <input inputMode="decimal" value={raw.cash} onChange={e=>update('cash',e.target.value)}
          placeholder="Niet ingevuld"/></label>
      <label>Persoonlijke maandgrens (€) <small>optioneel</small>
        <input inputMode="decimal" value={raw.limit} onChange={e=>update('limit',e.target.value)}
          placeholder="Niet ingevuld"/></label>
    </div>
    <p id="rental-stress-explain" className="rental-stress-hint">
      Voor alle bedragen geldt € 0–50.000, maximaal twee decimalen. Oude huur telt alleen
      mee voor het gekozen aantal overlappende maanden; maandlasten ná de verhuizing
      bestaan uit de nieuwe huur plus de zelf geschatte maandelijkse tegenvaller.</p>
    {!scenario?<p className="rental-stress-invalid" role="alert">
      Ongeldig bedrag. Pas eerst de velden aan; we tonen geen onbetrouwbare bedragen.</p>:
    !results.length?<p>Voeg eerst hierboven een eigen huurvoorstel toe.</p>:
    <div className="rental-stress-results">
      <h4>Mijn vergelijkbare scenario’s</h4>
      <ol>{results.map(({row,stress})=><li key={row.id}>
        <strong>{row.label}</strong>
        <dl>
          <div><dt>Nieuwe maandlasten</dt><dd>{euro(stress.monthly)}</dd></div>
          <div><dt>Benodigd startgeld incl. borg</dt><dd>{euro(stress.initial)}</dd></div>
          <div><dt>Eerste 12 maanden zonder borg als verbruik</dt>
            <dd>{euro(stress.firstYear)}</dd></div>
          <div><dt>Extra kosten door mijn scenario</dt><dd>{euro(stress.extraYear)}</dd></div>
        </dl>
        {scenario.cash!==null&&<p className={scenario.cash<stress.initial?'rental-stress-risk':'rental-stress-safe'}>
          {scenario.cash>=stress.initial
            ?euro(scenario.cash-stress.initial)+' buffer na startgeld'
            :euro(stress.initial-scenario.cash)+' tekort aan startgeld'}
        </p>}
        {scenario.limit!==null&&<p className={scenario.limit<stress.monthly?'rental-stress-risk':'rental-stress-safe'}>
          {scenario.limit>=stress.monthly
            ?euro(scenario.limit-stress.monthly)+' ruimte onder maandgrens'
            :euro(stress.monthly-scenario.limit)+' boven eigen maandgrens'}
        </p>}
      </li>)}</ol>
      <div className="rental-stress-actions">
        <button type="button" onClick={()=>{setPreview({signature,text:summary()});
          setFeedback('Controleer de volledige tekst voordat je een eigen bestand downloadt.');}}>
          Bekijk mijn scenario als TXT…
        </button>
        <button type="button" onClick={()=>{setRaw(initialRentalStress());setOverlapMonths(0);
          setPreview(null);setFeedback('Alleen de tijdelijke scenario-aannames hersteld.');}}>
          Herstel neutrale aannames</button>
      </div>
      {preview&&<div className="rental-stress-preview">
        <p>Controleer je eigen complete kostenoverzicht. Een bestandsprovider kan dit
          na een bewuste download buiten Woonpoints synchroniseren.</p>
        <pre>{preview.text}</pre>
        <button type="button" disabled={preview.signature!==signature} onClick={download}>
          Download dit gecontroleerde TXT-bestand</button>
        <button type="button" onClick={()=>setPreview(null)}>Annuleer</button>
      </div>}
    </div>}
    {feedback&&<p role="status" aria-live="polite">{feedback}</p>}
    <p className="rental-stress-hint">Geen huurcontracttoets, woningkans of betaalbaarheidsadvies.
      Er worden geen inkomsten meegerekend. De kasbuffer is uitsluitend het verschil
      tussen zelf ingevuld beschikbaar startgeld en geschatte eenmalige startbehoefte.
      Mogelijke teruggave van borg is onzeker en niet als gegarandeerde opbrengst gerekend.</p>
  </section>;
}

/** Build a private, human-reviewed interview checklist without claiming source verification. */
function rentalInterviewBrief(row:Offer):string|null {
  if(!validOffer(row))return null;
  const cost=totals(row);
  const lines=[
    'WOONPOINTS · MIJN EIGEN GESPREKSCHECKLIST',
    'Zelf ingevoerde, niet-geverifieerde woninggegevens. Geen officieel aanbod of juridische controle.',
    '',
    'Eigen woninglabel: '+row.label,
    'Eigen verwachte startdatum: '+(row.startDate||'nog onbekend'),
    'Eigen status: '+statuses[row.status],
    '',
    'EIGEN BEDRAGEN (NIET GECONTROLEERD)',
    'Kale huur/maand: '+euro(row.rentCents),
    'Servicekosten/maand: '+euro(row.serviceCents),
    'Geschatte energie/internet/maand: '+euro(row.utilitiesCents),
    'Totaal eigen maandlasten: '+euro(cost.monthly),
    'Zelf ingevoerde borg: '+euro(row.depositCents),
    'Overige eigen eenmalige kosten: '+euro(row.otherCents),
    'Eigen startgeld inclusief eerste maand en borg: '+euro(cost.initial),
    'Eerste 12 maanden exclusief terugbetaalbare borg: '+euro(cost.firstYear),
    '',
    'ZELF TE CONTROLEREN BIJ DE VERHUURDER',
    ...checklist.map((item,i)=>(
      (i+1)+'. '+(row.checked.includes(item.id)?'[zelf nagekeken] ':'[nog open] ')+item.name
    )),
    '',
    'EIGEN OPEN VRAGEN (NIET AUTOMATISCH VERSTUURD)',
    row.questions||'Nog geen vragen ingevuld.',
    '',
    'NOTITIES',
    '____________________________________________________________',
    '____________________________________________________________',
    '',
    'Geen rekening gehouden met dubbele huur, indexatie, verzekeringen, gemeentelijke',
    'lasten, verhuizing, belasting of individuele contractrechten. Controleer echte',
    'documenten en voorwaarden bij de aanbieder; Woonpoints doet geen accountacties.',
    'Een bestand kan persoonlijke gegevens bevatten en extern gesynchroniseerd worden.'
  ];
  const content=lines.join('\n')+'\n';
  return new TextEncoder().encode(content).length<=8192?content:null;
}
let nextLocalId=0;
function generateId(){
  nextLocalId++;
  return 'offer-'+Date.now().toString(36)+'-'+nextLocalId.toString(36);
}
function saveDownload(filename:string,content:string,mime='application/json;charset=utf-8'){
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  try{
    const link=document.createElement('a');
    link.href=url;link.download=filename;
    document.body.appendChild(link);link.click();link.remove();
  }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
}

function PrivateOfferDesk({prefill,onPrefillHandled,energyPrefill,onEnergyHandled,
  safetyQuestions,onSafetyQuestionsHandled,onPrepareSafetyDecision,onInvalidateSafetyDecision,
  onPrepareRentalBudget,onInvalidateRentalBudget}: {
  prefill?: {label:string;rent:number}|null;
  onPrefillHandled?:()=>void;
  energyPrefill?:PrivateEnergyRentalOfferProposal|null;
  onEnergyHandled?:()=>void;
  safetyQuestions?: string|null;
  onSafetyQuestionsHandled?:()=>void;
  onPrepareSafetyDecision?:(snapshot:PrivateRentalDecisionSnapshot)=>void;
  onInvalidateSafetyDecision?:()=>void;
  onPrepareRentalBudget?:(proposal:PrivateRentalScenarioOfferProposal)=>void;
  onInvalidateRentalBudget?:()=>void;
} = {}){
  const [offers,setOffers]=useState<Offer[]>([]);
  const [draft,setDraft]=useState<Draft>(newDraft);
  const [editing,setEditing]=useState<string|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [budget,setBudget]=useState('');
  const [notice,setNotice]=useState('');
  const [exportPreview,setExportPreview]=useState<string|null>(null);
  const [pendingImport,setPendingImport]=useState<Offer[]|null>(null);
  const [undoImport,setUndoImport]=useState<Offer[]|null>(null);
  const [pendingDelete,setPendingDelete]=useState<string|null>(null);
  const [briefPreview,setBriefPreview]=useState<{id:string;source:string;text:string}|null>(null);
  const [confirmClear,setConfirmClear]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const ranked=useMemo(()=>[...offers].sort((a,b)=>
    totals(a).monthly-totals(b).monthly||a.label.localeCompare(b.label,'nl')), [offers]);
  const chosen=offers.find(o=>o.id===selected)??null;
  const budgetCents=budget?integerMoney(budget):null;
  const edit=(key:keyof Draft,value:string)=>{
    setDraft(prev=>({...prev,[key]:value}));
    setExportPreview(null);
    setNotice('');
  };
  const resetDraft=()=>{setDraft(newDraft());setEditing(null);};
  const resetTransient=()=>{
    setPendingImport(null);setUndoImport(null);setExportPreview(null);
    setPendingDelete(null);setConfirmClear(false);setBriefPreview(null);
    onInvalidateRentalBudget?.();
  };
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const rent=integerMoney(draft.rent);
    const service=integerMoney(draft.service);
    const utilities=integerMoney(draft.utilities);
    const deposit=integerMoney(draft.deposit);
    const other=integerMoney(draft.other);
    if(!validLabel(draft.label.trim(),64)||rent===null||rent<=0||
      [service,utilities,deposit,other].some(v=>v===null)||
      !validDate(draft.startDate)||!validQuestions(draft.questions)){
      setNotice('Controleer het label, echte datum en bedragen (0 tot € 50.000, maximaal 2 decimalen). Kale huur moet hoger dan nul zijn.');
      return;
    }
    if(!editing&&offers.length>=MAX_OFFERS){
      setNotice('Er passen maximaal vijf eigen voorstellen in dit overzicht.');return;
    }
    const current=offers.find(o=>o.id===editing);
    const item:Offer={
      id:current?.id??generateId(),label:draft.label.trim(),rentCents:rent,
      serviceCents:service!,utilitiesCents:utilities!,depositCents:deposit!,
      otherCents:other!,startDate:draft.startDate,status:draft.status,
      checked:current?.checked??[],questions:draft.questions
    };
    const updated=editing?offers.map(o=>o.id===editing?item:o):[...offers,item];
    setOffers(updated);
    onInvalidateSafetyDecision?.();
    if(!selected||editing===selected)setSelected(item.id);
    resetDraft();resetTransient();
    setNotice(editing?'Eigen voorstel aangepast.':'Eigen voorstel toegevoegd; niets is verstuurd.');
  }
  function startEdit(row:Offer){
    setDraft({
      label:row.label,rent:moneyText(row.rentCents),service:moneyText(row.serviceCents),
      utilities:moneyText(row.utilitiesCents),deposit:moneyText(row.depositCents),
      other:moneyText(row.otherCents),startDate:row.startDate,
      status:row.status,questions:row.questions
    });
    setEditing(row.id);resetTransient();setNotice('Je bewerkt de ingevoerde bedragen; nog niets aangepast.');
  }
  function changeRow(id:string,patch:Partial<Offer>){
    setOffers(items=>items.map(row=>row.id===id?{...row,...patch}:row));
    onInvalidateSafetyDecision?.();
    resetTransient();
    setNotice('Persoonlijke notitie bijgewerkt, zonder externe actie.');
  }
  function remove(id:string){
    setOffers(rows=>rows.filter(row=>row.id!==id));
    onInvalidateSafetyDecision?.();
    if(selected===id)setSelected(null);
    if(editing===id)resetDraft();
    resetTransient();setNotice('Alleen dit eigen voorstel uit het tabblad verwijderd.');
  }
  const data:Backup={kind:KIND,version:1,offers};
  const serialized=JSON.stringify(data,null,2);
  async function readFile(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    event.target.value='';
    setPendingImport(null);setExportPreview(null);setNotice('');
    if(!file)return;
    try{
      if(!file.size||file.size>MAX_FILE)throw Error('size');
      const rows=decodeBackup(await file.text());
      setPendingImport(rows);
      setNotice('Bestand gecontroleerd. Je huidige voorstellen zijn nog niet gewijzigd.');
    }catch{
      setNotice('Import geweigerd: ongeldig of te groot privé-bestand. Huidige voorstellen behouden.');
    }
  }
  function restore(rows:Offer[],withUndo:boolean){
    onInvalidateSafetyDecision?.();
    if(withUndo)setUndoImport(offers.map(row=>({...row,checked:[...row.checked]})));
    else setUndoImport(null);
    setOffers(rows.map(row=>({...row,checked:[...row.checked]})));
    setPendingImport(null);setExportPreview(null);setPendingDelete(null);
    setConfirmClear(false);setSelected(null);resetDraft();
    setNotice('Privévoorstellen vervangen. Er is niets extern verstuurd.');
  }
  return <section id="private-offer-desk-heading" className={'panel '+styles.desk}
    aria-labelledby="offer-desk-heading">
    <header className={styles.header}>
      <p className="eyebrow">HUURVOORSTELLEN · EIGEN VERGELIJKING</p>
      <h2 id="offer-desk-heading">Welk huurvoorstel kan ik dragen?</h2>
      <p>Leg maximaal vijf <strong>zelf overgetypte, niet-geverifieerde</strong> voorstellen naast elkaar.
        Vergelijk totale maandlasten, benodigd startgeld en vragen vóór een eigen besluit.
        Een aanbieding opschrijven accepteert geen woning en verstuurt geen reactie.</p>
      <div className={styles.links}>
        <a href="#housing-shortlist-heading">Woningen vergelijken</a>
        <a href="#private-budget-title">Woonbudget</a>
        <a href="#private-document-readiness-heading">Documenten</a>
        <a href="#private-offer-safety-heading">Aanbodcheck: afzender en betaalverzoek</a>
      </div>
    </header>

    {safetyQuestions&&<aside className={styles.warnbox} aria-label="Aanbodcheck eigen vragen overnemen">
      <h3>Vragen uit de privé-aanbodcheck toevoegen?</h3>
      <p>Alleen vaste algemene controlevragen, zonder adres, verhuurder, bedrag,
        privénotities of accountgegevens. Er wordt nog niets naar dit voorstel,
        een verhuurder of WoningNet gestuurd. Controleer hieronder vóór overnemen.</p>
      <pre className={styles.preview} style={{whiteSpace:'pre-wrap'}}>{safetyQuestions}</pre>
      <p>Huidig tijdelijk veld: {draft.questions.length}/400 tekens. Na overnemen moet je
        je nieuwe of bestaande huurvoorstel nog <strong>zelf</strong> bewaren.</p>
      <div className={styles.buttons}>
        <button type="button" onClick={()=>{
          if(safetyQuestions.length>400||!safetyQuestions.trim()||
            /[^\x20-\x7E\u00C0-\u024F\u2013\u2014\n?]/u.test(safetyQuestions)){
            setNotice('Onverwachte controlevragen; niets overgenomen.');
            onSafetyQuestionsHandled?.();return;
          }
          const combined=draft.questions.trim() ?
            draft.questions.trim()+'\n'+safetyQuestions : safetyQuestions;
          if(combined.length>400){
            setNotice('Het formulier heeft maximaal 400 tekens. Maak in het formulier zelf ruimte en probeer opnieuw; bestaande vragen blijven intact.');
            return;
          }
          setDraft(current=>({...current,questions:combined}));
          resetTransient();
          setNotice('Alleen het tijdelijke vragenveld is aangevuld. Controleer en bewaar je huurvoorstel zelf als je dat wilt.');
          onSafetyQuestionsHandled?.();
        }}>Ja, voeg toe aan mijn tijdelijke vragenveld</button>
        <button type="button" onClick={()=>{
          onSafetyQuestionsHandled?.();setNotice('Controlevragen niet overgenomen.');
        }}>Nee, behoud mijn eigen invoer</button>
      </div>
    </aside>}

    {energyPrefill&&<aside className={styles.warnbox} aria-label="Eigen energieraming overnemen">
      <h3>Eigen maandraming uit energievergelijker overnemen?</h3>
      <p><strong>{energyPrefill.label}</strong> · eigen geschatte stroom- en gaskosten:
        {' '}{euro(energyPrefill.monthlyCents)} per maand.
        Huidige veldwaarde voor energie/internet: <strong>{draft.utilities||'nog leeg'}</strong>.
        De energievergelijking houdt geen rekening met internet, water of niet-opgegeven
        heffingen. Voeg deze zelf toe waar nodig. Je wijzigt uitsluitend het nog niet
        opgeslagen energie/internetveld na bevestiging, nooit de bestaande huurvoorstellen
        of een officieel contract.</p>
      <div className={styles.buttons}>
        <button type="button" onClick={()=>{
          if(!Number.isSafeInteger(energyPrefill.monthlyCents)||
             energyPrefill.monthlyCents<0||energyPrefill.monthlyCents>MAX_CENTS||
             !validLabel(energyPrefill.label,64)){
            setNotice('De energieraming is niet geldig voor het huurformulier.');
            onEnergyHandled?.();return;
          }
          setDraft(previous=>({...previous,
            utilities:moneyText(energyPrefill.monthlyCents)}));
          resetTransient();
          setNotice('Alleen het tijdelijke energie/internetveld is vooringevuld. Controleer internet, water en overige kosten. Bewaar zelf je huurvoorstel als dat klopt.');
          onEnergyHandled?.();
        }}>Ja, gebruik alleen deze maandraming in mijn formulier</button>
        <button type="button" onClick={()=>{onEnergyHandled?.();setNotice('Energieraming niet overgenomen.');}}>
          Behoud de huidige invoer</button>
      </div>
    </aside>}

    {prefill&&<aside className={styles.warnbox} aria-label="Eigen woninggegevens overnemen">
      <h3>Woning uit jouw eigen shortlist overnemen?</h3>
      <p><strong>{prefill.label}</strong> · zelf genoteerde kale huur:
        {' '}{euro(Number.isSafeInteger(prefill.rent)?prefill.rent*100:0)} per maand.
        Dit is uitsluitend een kopieervoorstel. Servicekosten, energie, borg,
        overige kosten, ingangsdatum en status worden niet overgenomen of verzonnen.
        Het bestaande formulier wordt pas na jouw bevestiging vervangen;
        een definitief huurvoorstel wordt niet automatisch opgeslagen.</p>
      <div className={styles.buttons}>
        <button type="button" onClick={()=>{
          if(!validLabel(prefill.label,64)||!Number.isSafeInteger(prefill.rent)||
             prefill.rent<100||prefill.rent>10000){
            setNotice('Ongeldige woninggegevens. Controleer de oorspronkelijke shortlist.');
            onPrefillHandled?.();
            return;
          }
          setDraft({...newDraft(),label:prefill.label,rent:String(prefill.rent)});
          setEditing(null);
          resetTransient();
          setNotice('Woninglabel en kale huur vooringevuld. Vul onbekende bedragen zelf in en kies daarna pas Voeg eigen voorstel toe.');
          onPrefillHandled?.();
        }}>Ja, vul alleen label en kale huur in</button>
        <button type="button" onClick={onPrefillHandled}>Nee, behoud huidige invoer</button>
      </div>
    </aside>}
    <div className={styles.sections}>
      <div className={styles.column}>
        <h3>{editing?'Eigen voorstel bewerken':'Eigen voorstel toevoegen'} <small>({offers.length}/{MAX_OFFERS})</small></h3>
        <form onSubmit={submit} className={styles.form}>
          <label>Neutraal eigen label <span>(geen adres nodig)</span>
            <input value={draft.label} maxLength={64} placeholder="Bijv. woning A"
              onChange={e=>edit('label',e.target.value)} required/></label>
          <div className={styles.two}>
            <label>Kale huur per maand (€)
              <input inputMode="decimal" value={draft.rent} onChange={e=>edit('rent',e.target.value)}
                placeholder="900,00" required/></label>
            <label>Servicekosten (€)
              <input inputMode="decimal" value={draft.service} onChange={e=>edit('service',e.target.value)}/></label>
            <label>Eigen schatting energie/internet (€)
              <input inputMode="decimal" value={draft.utilities} onChange={e=>edit('utilities',e.target.value)}/></label>
            <label>Borgsom (€)
              <input inputMode="decimal" value={draft.deposit} onChange={e=>edit('deposit',e.target.value)}/></label>
            <label>Overige eenmalige kosten (€)
              <input inputMode="decimal" value={draft.other} onChange={e=>edit('other',e.target.value)}/></label>
            <label>Zelf verwachte startdatum
              <input type="date" value={draft.startDate} onChange={e=>edit('startDate',e.target.value)}/></label>
          </div>
          <label>Eigen status
            <select value={draft.status} onChange={e=>edit('status',e.target.value)}>
              {Object.entries(statuses).map(([value,label])=>
                <option key={value} value={value}>{label}</option>)}
            </select></label>
          <label>Open vragen voor verhuurder of corporatie <span>(max. 400 tekens)</span>
            <textarea value={draft.questions} maxLength={400} rows={3}
              placeholder="Bijv. wat valt precies onder de servicekosten?"
              onChange={e=>edit('questions',e.target.value)}/></label>
          <div className={styles.buttons}>
            <button type="submit">{editing?'Bewaar wijzigingen':'Voeg eigen voorstel toe'}</button>
            {editing&&<button type="button" onClick={()=>{resetDraft();setNotice('Wijziging geannuleerd.');}}>Annuleren</button>}
          </div>
        </form>
      </div>

      <div className={styles.column}>
        <h3>Vergelijking <small>alleen mijn eigen invoer</small></h3>
        <label className={styles.budget}>Mijn eigen maandgrens (€)
          <input inputMode="decimal" value={budget} placeholder="Bijv. 1300,00"
            onChange={e=>{setBudget(e.target.value);onInvalidateSafetyDecision?.();}} />
        </label>
        {budget!==''&&budgetCents===null&&<p role="status">Voer een bedrag in van € 0 tot € 50.000.</p>}
        {!ranked.length?<p>Voeg links je eerste voorstel toe om de maandlasten te vergelijken.</p>:
        <ol className={styles.ranking}>{ranked.map(row=>{
          const result=totals(row);
          const checked=row.checked.length;
          const below=budgetCents===null?null:result.monthly<=budgetCents;
          return <li key={row.id}>
            <div className={styles.rowhead}><strong>{row.label}</strong><b>{euro(result.monthly)}/mnd</b></div>
            <p>{statuses[row.status]} · {checked}/{checklist.length} zelf nagekeken</p>
            <p>Startgeld inclusief borg: <strong>{euro(result.initial)}</strong></p>
            {below!==null&&<p className={below?styles.ok:styles.warn}>
              {below?'Binnen eigen maandgrens':'Boven eigen maandgrens'}
              {' · '}{euro(Math.abs(budgetCents!-result.monthly))} verschil
            </p>}
            <button type="button" onClick={()=>{setSelected(row.id);setBriefPreview(null);}}
              aria-pressed={chosen?.id===row.id}>Bekijk voorstel en checklist</button>
          </li>;
        })}</ol>}
      </div>
    </div>

    <PrivateRentalStressPlan offers={offers} />

    {chosen&&<section className={styles.details} aria-label={'Eigen voorstel '+chosen.label}>
      <div className={styles.rowhead}>
        <h3>Mijn vragen en aandachtspunten · {chosen.label}</h3>
        <button type="button" onClick={()=>startEdit(chosen)}>Bewerk voorstel</button>
      </div>
      <dl className={styles.summary}>
        <div><dt>Maandlasten incl. geschatte energie</dt><dd>{euro(totals(chosen).monthly)}</dd></div>
        <div><dt>Benodigd startgeld incl. eerste maand en borg</dt><dd>{euro(totals(chosen).initial)}</dd></div>
        <div><dt>Eerste 12 maanden, exclusief terugbetaalbare borg</dt><dd>{euro(totals(chosen).firstYear)}</dd></div>
        <div><dt>Eigen verwachte startdatum</dt><dd>{chosen.startDate||'Onbekend'}</dd></div>
      </dl>
      <div className={styles.portable}>
        <h4>Combineer mijn eigen huurkosten met de aanbodcheck</h4>
        <p>Neem alleen een <strong>tijdelijke momentopname</strong> van jouw huurkosten,
          benodigd startgeld, jaarlasten, eigen maandgrens en afvinkvoortgang mee.
          De eigen vragen en identiteit blijven buiten deze overdracht.
          In de aanbodcheck is een <strong>tweede bevestiging</strong> vereist;
          een export van de combinatie is altijd afzonderlijk en vrijwillig.</p>
        <button type="button" disabled={!onPrepareSafetyDecision}
          onClick={()=>{
            const costs=totals(chosen);
            if(![costs.monthly,costs.initial,costs.firstYear].every(
              value=>Number.isSafeInteger(value)&&value>=0)) {
              setNotice('Financieel overzicht is ongeldig; niets doorgezet.');
              return;
            }
            onPrepareSafetyDecision?.({
              offerId:chosen.id,label:chosen.label,monthlyCents:costs.monthly,
              initialCents:costs.initial,firstYearCents:costs.firstYear,
              checked:chosen.checked.length,budgetCents
            });
            document.getElementById('private-offer-safety-heading')?.scrollIntoView({behavior:'smooth'});
            setNotice('Financiële momentopname aangeboden aan de privé-aanbodcheck. Daar eerst bewust bevestigen.');
          }}>Bekijk deze huurkosten bij mijn aanbodcheck</button>
        <p>Je kunt ook je eigen kale huur, servicekosten, energiekosten en borg
          alleen na een tweede bevestiging naar de lokale huurscenariovergelijking
          sturen. Woon-werk en verhuiskosten worden daar apart door jezelf ingevuld.</p>
        <button type="button" disabled={!onPrepareRentalBudget}
          onClick={()=>{
            if(![chosen.rentCents,chosen.serviceCents,chosen.utilitiesCents,chosen.depositCents]
                .every(value=>Number.isSafeInteger(value)&&value>=0&&value<=5_000_000)){
              setNotice('Eigen huurwaarden buiten de toegelaten grens; niets klaargezet.');
              return;
            }
            onPrepareRentalBudget?.({
              label:chosen.label,rentCents:chosen.rentCents,
              serviceCents:chosen.serviceCents,utilitiesCents:chosen.utilitiesCents,
              depositCents:chosen.depositCents
            });
            document.getElementById('rental-scenarios-heading')?.scrollIntoView({behavior:'smooth'});
            setNotice('Eigen huurvoorstel ter controle klaargezet bij huurscenario’s. Nog niets vervangen.');
          }}>Bekijk dit eigen huurvoorstel bij mijn huurscenario’s</button>
      </div>
      <p><strong>Zelf afgevinkt:</strong> {chosen.checked.length}/{checklist.length}.
        Dit is geen juridische toets, betaalbaarheidsverklaring of officiële toelating.</p>
      <ul className={styles.checks}>{checklist.map(item=><li key={item.id}>
        <label><input type="checkbox" checked={chosen.checked.includes(item.id)}
          onChange={e=>changeRow(chosen.id,{checked:e.target.checked?
            [...chosen.checked,item.id]:chosen.checked.filter(id=>id!==item.id)})}/>
          {item.name}</label>
      </li>)}</ul>
      <p><strong>Eigen open vragen:</strong> {chosen.questions||'Nog niet ingevuld.'}</p>
      <div className={styles.portable}>
        <h4>Neem je persoonlijke gesprekspunten mee</h4>
        <p>Maak een eigen tekstbestand met bedragen, nog open contractvragen en een
          afvinklijst. Bekijk de exacte inhoud voordat je iets downloadt; geen
          e-mail of verhuurder wordt automatisch benaderd.</p>
        <button type="button" onClick={()=>{
          const text=rentalInterviewBrief(chosen);
          if(!text){setNotice('Het persoonlijke overzicht is ongeldig of te groot.');return;}
          setBriefPreview({id:chosen.id,source:JSON.stringify(chosen),text});
          setNotice('Inhoud klaar ter controle; nog geen bestand gemaakt.');
        }}>Bekijk gespreksoverzicht als tekst…</button>
        {briefPreview?.id===chosen.id&&<div>
          <pre className={styles.preview}>{briefPreview.text}</pre>
          <div className={styles.buttons}>
            <button type="button" disabled={briefPreview.source!==JSON.stringify(chosen)}
              onClick={()=>{
                if(briefPreview.source!==JSON.stringify(chosen))return;
                saveDownload('woonpoints-eigen-huurgesprek.txt',briefPreview.text,
                  'text/plain;charset=utf-8');
                setBriefPreview(null);
                setNotice('Eigen gespreksnotitie aangeboden; de gekozen opslaglocatie kan synchroniseren.');
              }}>Ja, download dit gecontroleerde TXT-bestand</button>
            <button type="button" onClick={()=>setBriefPreview(null)}>Annuleren</button>
          </div>
          {briefPreview.source!==JSON.stringify(chosen)&&<p role="status">
            Het voorstel is intussen veranderd. Maak een nieuw overzicht.</p>}
        </div>}
      </div>
      {pendingDelete===chosen.id?<div className={styles.warnbox}>
        <p>Dit verwijdert uitsluitend deze eigen notitie uit dit tabblad.</p>
        <button type="button" onClick={()=>remove(chosen.id)}>Ja, verwijder dit voorstel</button>
        <button type="button" onClick={()=>setPendingDelete(null)}>Annuleer</button>
      </div>:<button type="button" onClick={()=>setPendingDelete(chosen.id)}>Verwijder eigen voorstel…</button>}
    </section>}

    <details className={styles.portable}>
      <summary>Mijn privévoorstellen zelf bewaren, terugzetten of wissen</summary>
      <p>Geen account-, WoningNet-, cookie-, API- of browseropslag. Alles blijft standaard uitsluitend
        in dit tabblad. Alleen na je eigen bevestiging wordt een JSON-bestand gedownload. Een gekozen
        bestandsprovider kan het buiten deze app synchroniseren.</p>
      <div className={styles.buttons}>
        <button type="button" onClick={()=>{setExportPreview(serialized);setPendingImport(null);}}>
          Bekijk exacte JSON-back-up</button>
        <button type="button" onClick={()=>{setConfirmClear(true);setPendingImport(null);}}>
          Wis alle eigen voorstellen…</button>
      </div>
      {exportPreview!==null&&<div>
        <p>Controleer alle velden voor je het bestand opslaat; labels en vragen zijn persoonlijk.</p>
        <pre className={styles.preview}>{exportPreview}</pre>
        <button type="button" disabled={serialized!==exportPreview}
          onClick={()=>{saveDownload('woonpoints-huurvoorstellen.json',exportPreview);setExportPreview(null);
            setNotice('Privébestand aan jouw browser aangeboden.');}}>Download deze gecontroleerde JSON</button>
        <button type="button" onClick={()=>setExportPreview(null)}>Annuleer export</button>
      </div>}
      <label htmlFor="woonpoints-offer-import" className={styles.importLabel}>
        Kies eigen huurvoorstellenbestand (max. 16 KiB)
      </label>
      <input id="woonpoints-offer-import" ref={fileRef} type="file" accept=".json,application/json"
        onChange={readFile} />
      {pendingImport&&<div className={styles.warnbox}>
        <p>Bestand bevat <strong>{pendingImport.length} eigen voorstellen</strong>.
          Na jouw bevestiging vervangt dit alle {offers.length} huidige voorstellen
          en hun vinkjes/vragen. Het bestand wordt nergens heen verstuurd.</p>
        <ul>{pendingImport.map(row=><li key={row.id}>
          {row.label}: {euro(totals(row).monthly)}/mnd
        </li>)}</ul>
        <button type="button" onClick={()=>restore(pendingImport,true)}>Ja, vervang alle voorstellen</button>
        <button type="button" onClick={()=>setPendingImport(null)}>Behoud mijn huidige gegevens</button>
      </div>}
      {undoImport&&<button type="button" onClick={()=>restore(undoImport,false)}>
        Draai deze import éénmaal terug</button>}
      {confirmClear&&<div className={styles.warnbox}>
        <p>Weet je zeker dat je alle {offers.length} eigen voorstellen wilt wissen?
          Bewaarde bestanden worden hiermee niet verwijderd.</p>
        <button type="button" onClick={()=>{setOffers([]);onInvalidateSafetyDecision?.();setSelected(null);resetDraft();resetTransient();
          setNotice('Alle eigen voorstellen uit dit tabblad gewist.');}}>Ja, wis alles</button>
        <button type="button" onClick={()=>setConfirmClear(false)}>Annuleren</button>
      </div>}
    </details>
    <p className={styles.footnote}>Schattingsmodel: maandlasten = kale huur + servicekosten + eigen energie/internet.
      Startgeld = eerste maand + borg + eenmalige kosten. Eerste 12 maanden = 12 × maandlasten +
      overige eenmalige kosten; borg is hier apart gehouden omdat terugbetaling mogelijk is.
      Dubbele huur, indexatie, gemeentelijke lasten, verzekeringen, verhuizing en fiscale regels
      zijn niet meegerekend. Raadpleeg de oorspronkelijke aanbieder voordat je besluit.</p>
    {notice&&<p role="status" aria-live="polite" className={styles.notice}>{notice}</p>}
  </section>;
}

return PrivateOfferDesk;
})();


/** Private owner-typed energy plans; no vendor API, matching, account or background work. */
type EnergyQuote={
  id:string;label:string;electric10000:number;gas10000:number;standingCents:number
};
type EnergyQuoteForm={label:string;electric:string;gas:string;standing:string};
const newEnergyQuote=():EnergyQuoteForm=>({label:'',electric:'',gas:'0',standing:'0'});
const energyRate=(raw:string,max:number):number|null=>{
  const clean=raw.trim();
  if(!/^(?:0|[1-9][0-9]{0,2})(?:[,.][0-9]{1,4})?$/.test(clean))return null;
  const [whole,fraction='']=clean.replace(',','.').split('.');
  const unit=Number(whole)*10000+Number(fraction.padEnd(4,'0'));
  return Number.isSafeInteger(unit)&&unit>=0&&unit<=max*10000?unit:null;
};
const energyMoney=(raw:string):number|null=>{
  const clean=raw.trim();
  if(!/^(?:0|[1-9][0-9]{0,3})(?:[,.][0-9]{1,2})?$/.test(clean))return null;
  const [whole,fraction='']=clean.replace(',','.').split('.');
  const cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents>=0&&cents<=100000?cents:null;
};
const energyUnits=(raw:string,max:number):number|null=>
  /^(?:0|[1-9][0-9]{0,5})$/.test(raw.trim())&&
    Number(raw.trim())<=max?Number(raw.trim()):null;
const energyEuro=(cents:number)=>new Intl.NumberFormat('nl-NL',{
  style:'currency',currency:'EUR'
}).format(cents/100);
const energyQuoteTotal=(row:EnergyQuote,kwh:number,gas:number)=>{
  const electricity=Math.round(kwh*row.electric10000/100);
  const gasCents=Math.round(gas*row.gas10000/100);
  const fixed=row.standingCents*12;
  return {electricity,gasCents,fixed,total:electricity+gasCents+fixed};
};
let energyQuoteSequence=0;
function PrivateEnergyQuoteComparison({onProposeRental,onInvalidateRental}: {
  onProposeRental?:(proposal:PrivateEnergyRentalOfferProposal)=>void;
  onInvalidateRental?:()=>void;
}={}){
  const [kwh,setKwh]=useState('');
  const [gas,setGas]=useState('0');
  const [growth,setGrowth]=useState(0);
  const [form,setForm]=useState<EnergyQuoteForm>(newEnergyQuote);
  const [editing,setEditing]=useState<string|null>(null);
  const [quotes,setQuotes]=useState<EnergyQuote[]>([]);
  const [removeId,setRemoveId]=useState<string|null>(null);
  const [wipeConfirm,setWipeConfirm]=useState(false);
  const [exportView,setExportView]=useState<{signature:string;text:string}|null>(null);
  const [handoffPreview,setHandoffPreview]=useState<{id:string;signature:string;monthlyCents:number;label:string}|null>(null);
  const [message,setMessage]=useState('');
  const annualKwh=energyUnits(kwh,50000);
  const annualGas=energyUnits(gas,10000);
  const validUsage=annualKwh!==null&&annualGas!==null&&(annualKwh>0||annualGas>0);
  const adjustedKwh=validUsage?Math.round(annualKwh!*(100+growth)/100):0;
  const adjustedGas=validUsage?Math.round(annualGas!*(100+growth)/100):0;
  const estimates=validUsage?quotes.map(row=>({
    row,annual:energyQuoteTotal(row,annualKwh!,annualGas!),
    stress:energyQuoteTotal(row,adjustedKwh,adjustedGas)
  })).sort((a,b)=>a.annual.total-b.annual.total||a.row.label.localeCompare(b.row.label,'nl')):[];
  const signature=JSON.stringify({kwh,gas,growth,quotes});
  function editValue(field:keyof EnergyQuoteForm,value:string){
    setForm(previous=>({...previous,[field]:value}));setMessage('');
    setExportView(null);
  }
  function addOrChange(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const electric=energyRate(form.electric,20);
    const gasPrice=energyRate(form.gas,20);
    const standing=energyMoney(form.standing);
    const label=form.label.trim();
    if(!label||label.length>60||/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(label)||
       electric===null||gasPrice===null||standing===null){
      setMessage('Controleer je label en tarieven: max € 20 per kWh/m³ met vier decimalen en max € 1.000 vaste kosten per maand.');
      return;
    }
    if(!editing&&quotes.length>=4){
      setMessage('Er passen maximaal vier eigen tarieven in één vergelijking.');return;
    }
    const current=quotes.find(row=>row.id===editing);
    const offer:EnergyQuote={id:current?.id??'e-'+Date.now().toString(36)+'-'+(++energyQuoteSequence),
      label,electric10000:electric,gas10000:gasPrice,standingCents:standing};
    setQuotes(rows=>current?rows.map(row=>row.id===current.id?offer:row):[...rows,offer]);
    onInvalidateRental?.();
    setHandoffPreview(null);
    setEditing(null);setForm(newEnergyQuote());setRemoveId(null);setWipeConfirm(false);
    setExportView(null);setMessage(current?'Mijn tariefnotitie bijgewerkt.':'Eigen tariefnotitie toegevoegd.');
  }
  function startEdit(row:EnergyQuote){
    const rate=(value:number)=>(value/10000).toFixed(4).replace('.',',');
    setForm({label:row.label,electric:rate(row.electric10000),
      gas:rate(row.gas10000),standing:(row.standingCents/100).toFixed(2).replace('.',',')});
    setEditing(row.id);setExportView(null);setWipeConfirm(false);setRemoveId(null);
    setMessage('Eigen tarief openen om te wijzigen; eerdere bedragen blijven tot je opslaat.');
  }
  function summary():string{
    const lines=[
      'WOONPOINTS · MIJN HANDMATIGE ENERGIEVERGELIJKING',
      'Alle tarieven en het jaarverbruik zijn eigen niet-gecontroleerde invoer.',
      'Geschat jaarverbruik: '+annualKwh+' kWh stroom; '+annualGas+' m³ gas.',
      'Verbruiksscenario: '+growth+'% extra verbruik.',
      'Indicatieve kosten inclusief zelf ingevulde vaste bedragen, geen live leveranciersaanbod.',
      ''
    ];
    estimates.forEach(({row,annual,stress})=>{
      lines.push('Eigen tarief: '+row.label,
        'Stroomtarief: € '+(row.electric10000/10000).toFixed(4)+' per kWh',
        'Gastarief: € '+(row.gas10000/10000).toFixed(4)+' per m³',
        'Maandelijkse vaste kosten: '+energyEuro(row.standingCents),
        'Stroom/jaar: '+energyEuro(annual.electricity),
        'Gas/jaar: '+energyEuro(annual.gasCents),
        'Vaste lasten/jaar: '+energyEuro(annual.fixed),
        'Totaal eigen basisschatting/jaar: '+energyEuro(annual.total),
        'Totaal bij extra verbruik/jaar: '+energyEuro(stress.total),
        'Gemiddeld per maand basisschatting: '+energyEuro(Math.round(annual.total/12)),
        ''
      );
    });
    lines.push('Geen berekening van teruglevering, kortingen, heffingen/netbeheer buiten de opgegeven prijzen, dynamische uurprijzen, BTW-verschillen of contractvoorwaarden.',
      'Controleer de echte volledige tarieven en voorwaarden bij de betreffende leverancier.',
      'Er is geen contract afgesloten, aanvraag verzonden, rekening opgehaald of account gekoppeld.');
    return lines.join('\n');
  }
  function download(){
    if(!exportView||exportView.signature!==signature||!estimates.length||!validUsage){
      setMessage('De gegevens zijn gewijzigd. Bekijk opnieuw je actuele vergelijking.');return;
    }
    const url=URL.createObjectURL(new Blob([exportView.text+'\n'],{
      type:'text/plain;charset=utf-8'
    }));
    try{
      const link=document.createElement('a');
      link.href=url;link.download='woonpoints-mijn-energievergelijking.txt';
      document.body.appendChild(link);link.click();link.remove();
      setMessage('Eigen vergelijking als tekstbestand aangeboden aan je browser.');
      setExportView(null);
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }
  const labelStyle={display:'grid',gap:6,fontWeight:700,fontSize:13} as const;
  return <section className="panel woon-energy" id="private-energy-quotes-heading"
    aria-labelledby="woon-energy-title">
    <div className="woon-energy-intro">
      <p className="eyebrow">WOONKOSTEN · EIGEN ENERGIEAANNAMES</p>
      <h2 id="woon-energy-title">Wat kosten mijn zelf gevonden energietarieven?</h2>
      <p>Vergelijk maximaal vier zelf ingevoerde stroom- en gastarieven bij
        je eigen jaarverbruik. Geen energieprijzen opgehaald, geen aanbod geverifieerd,
        geen leverancierskoppeling of automatische contractactie.</p>
      <p>Je kunt de maandraming daarna <a href="#private-offer-desk-heading">
        zelf overnemen in je huurvoorstel</a>, eventueel met internet en andere
        nutsvoorzieningen erbij.</p>
    </div>
    <div className="woon-energy-columns">
      <div>
        <h3>Mijn geschat jaarverbruik</h3>
        <div className="woon-energy-inputs">
          <label style={labelStyle}>Stroomverbruik in kWh/jaar (0–50.000)
            <input inputMode="numeric" value={kwh} onChange={e=>{
              setKwh(e.target.value);setExportView(null);
              setHandoffPreview(null);onInvalidateRental?.();
            }} placeholder="Zelf opzoeken, bijv. 2500"/></label>
          <label style={labelStyle}>Gasverbruik in m³/jaar (0–10.000)
            <input inputMode="numeric" value={gas} onChange={e=>{
              setGas(e.target.value);setExportView(null);
              setHandoffPreview(null);onInvalidateRental?.();
            }} placeholder="0 als je geen gas verbruikt"/></label>
          <label style={labelStyle}>Wat-als: extra energieverbruik
            <select value={growth} onChange={e=>{setGrowth(Number(e.target.value));setExportView(null);
              setHandoffPreview(null);onInvalidateRental?.();}}>
              <option value={0}>0% · huidig geschat</option>
              <option value={10}>+10% · iets meer</option>
              <option value={20}>+20% · duidelijke stijging</option>
            </select></label>
        </div>
        {!validUsage&&<p role="status" className="woon-energy-hint">
          Vul je eigen stroom- en gasverbruik in (minimaal één groter dan nul),
          anders tonen we geen berekende kosten.</p>}
        <h3>{editing?'Mijn tarief aanpassen':'Eigen tarief toevoegen'}</h3>
        <form className="woon-energy-form" onSubmit={addOrChange}>
          <label style={labelStyle}>Eigen tarieflabel
            <input maxLength={60} required value={form.label}
              placeholder="Bijv. zelf gevonden aanbod A"
              onChange={e=>editValue('label',e.target.value)}/></label>
          <label style={labelStyle}>Mijn opgegeven prijs stroom, €/kWh (max. 4 decimalen)
            <input inputMode="decimal" required value={form.electric} placeholder="0,3000"
              onChange={e=>editValue('electric',e.target.value)}/></label>
          <label style={labelStyle}>Mijn opgegeven prijs gas, €/m³ (0 indien niet van toepassing)
            <input inputMode="decimal" required value={form.gas}
              onChange={e=>editValue('gas',e.target.value)}/></label>
          <label style={labelStyle}>Mijn opgegeven vaste kosten per maand, €
            <input inputMode="decimal" required value={form.standing}
              onChange={e=>editValue('standing',e.target.value)}/></label>
          <div className="woon-energy-buttons">
            <button type="submit">{editing?'Bewaar mijn tarief':'Voeg eigen tarief toe'}</button>
            {editing&&<button type="button" onClick={()=>{setEditing(null);setForm(newEnergyQuote());
              setMessage('Bewerken geannuleerd.');}}>Annuleer bewerking</button>}
          </div>
        </form>
      </div>
      <div className="woon-energy-results">
        <h3>Mijn indicatieve vergelijking ({quotes.length}/4)</h3>
        {!quotes.length?<p>Vul links je eigen tarieven in. Er zijn geen
          vooraf geselecteerde commerciële aanbieders of externe datastromen.</p>:
        !validUsage?<p>Eerst het verbruik invoeren om de eigen tarieven
          objectief met dezelfde aannames te vergelijken.</p>:
        <ol>{estimates.map(({row,annual,stress},index)=><li key={row.id}>
          <div className="woon-energy-head">
            <strong>{row.label}</strong>
            {index===0&&estimates.length>1&&<span>Laagste van eigen invoer</span>}
          </div>
          <p><strong>{energyEuro(annual.total)}</strong> per jaar · ongeveer
            {' '}<strong>{energyEuro(Math.round(annual.total/12))}</strong> per maand</p>
          <dl>
            <div><dt>Stroom</dt><dd>{energyEuro(annual.electricity)}</dd></div>
            <div><dt>Gas</dt><dd>{energyEuro(annual.gasCents)}</dd></div>
            <div><dt>Vast</dt><dd>{energyEuro(annual.fixed)}</dd></div>
            <div><dt>Extra verbruik {growth}%</dt><dd>{energyEuro(stress.total)}</dd></div>
          </dl>
          {index>0&&<p>Verschil met goedkoopste eigen invoer:
            {' '}{energyEuro(annual.total-estimates[0].annual.total)} per jaar.</p>}
          <div className="woon-energy-buttons">
            <button type="button" disabled={Math.round(annual.total/12)>5000000}
              onClick={()=>{setHandoffPreview({id:row.id,signature,
                monthlyCents:Math.round(annual.total/12),label:row.label});
                setMessage('Controleer het maandbedrag voordat je het naar een tijdelijk huurformulier aanbiedt.');}}>
              Gebruik eigen maandraming voor huurvoorstel…
            </button>
            <button type="button" onClick={()=>startEdit(row)}>Bewerk tarief</button>
            <button type="button" onClick={()=>setRemoveId(row.id)}>Verwijder…</button>
          </div>
          {handoffPreview?.id===row.id&&<div className="woon-energy-confirm">
            <p><strong>{handoffPreview.label}</strong> geeft volgens je eigen invoer
              {' '}{energyEuro(handoffPreview.monthlyCents)} per maand.
              Dit is alleen stroom en gas plus opgegeven vaste kosten, geen internet
              en geen officiële leverancierprijs. Je besluit zelf of je dit in het
              huurformulier wilt voorstellen.</p>
            <div className="woon-energy-buttons">
              <button type="button" disabled={handoffPreview.signature!==signature}
                onClick={()=>{
                  if(handoffPreview.signature!==signature||
                     !Number.isSafeInteger(handoffPreview.monthlyCents)||
                     handoffPreview.monthlyCents<0||handoffPreview.monthlyCents>5000000){
                    setMessage('De energieraming is verouderd of ongeldig. Kies de huidige berekening opnieuw.');
                    setHandoffPreview(null);return;
                  }
                  onProposeRental?.({label:handoffPreview.label,
                    monthlyCents:handoffPreview.monthlyCents,
                    sourceKey:handoffPreview.signature});
                  setHandoffPreview(null);
                  setMessage('Maandraming aangeboden aan het huurformulier. Bevestig daar nogmaals voordat er iets wordt vooringevuld.');
                  document.getElementById('private-offer-desk-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
                }}>
                Ja, bied deze raming aan het huurformulier aan
              </button>
              <button type="button" onClick={()=>setHandoffPreview(null)}>Annuleer</button>
            </div>
          </div>}
          {removeId===row.id&&<div className="woon-energy-confirm">
            <p>Alleen deze handmatige vergelijking verwijderen?</p>
            <button type="button" onClick={()=>{setQuotes(items=>items.filter(x=>x.id!==row.id));
              setHandoffPreview(null);onInvalidateRental?.();
              if(editing===row.id){setEditing(null);setForm(newEnergyQuote());}
              setRemoveId(null);setExportView(null);setMessage('Eigen tarief verwijderd.');}}>
              Ja, verwijder alleen dit tarief</button>
            <button type="button" onClick={()=>setRemoveId(null)}>Annuleer</button>
          </div>}
        </li>)}</ol>}
        {quotes.length>0&&<div className="woon-energy-buttons">
          <button type="button" disabled={!validUsage||!estimates.length}
            onClick={()=>{setExportView({signature,text:summary()});
              setMessage('Bekijk het volledige overzicht; downloaden blijft een aparte keuze.');}}>
            Bekijk kostenvergelijking als TXT…
          </button>
          <button type="button" onClick={()=>setWipeConfirm(true)}>Wis alle eigen tarieven…</button>
        </div>}
        {exportView&&<div className="woon-energy-preview">
          <p>Alleen jouw eigen gegevens staan in dit bestand. Een zelf gekozen
            bestandsprovider kan het later wel synchroniseren.</p>
          <pre>{exportView.text}</pre>
          <div className="woon-energy-buttons">
            <button type="button" disabled={exportView.signature!==signature} onClick={download}>
              Download deze gecontroleerde TXT</button>
            <button type="button" onClick={()=>setExportView(null)}>Annuleer</button>
          </div>
        </div>}
        {wipeConfirm&&<div className="woon-energy-confirm">
          <p>Verwijder alle {quotes.length} tariefnotities uit dit tabblad?
            Je verbruik en reeds gedownloade bestanden veranderen niet.</p>
          <button type="button" onClick={()=>{setQuotes([]);setEditing(null);setForm(newEnergyQuote());
            setHandoffPreview(null);onInvalidateRental?.();
            setRemoveId(null);setExportView(null);setWipeConfirm(false);
            setMessage('Eigen tariefnotities gewist.');}}>Ja, wis alle tarieven</button>
          <button type="button" onClick={()=>setWipeConfirm(false)}>Behoud tarieven</button>
        </div>}
      </div>
    </div>
    <p className="woon-energy-hint">Alle bedragen zijn handmatig en uitsluitend
      indicatief. Jaarbedrag = eigen stroomverbruik × eigen stroomprijs +
      eigen gasverbruik × eigen gasprijs + 12 × zelf opgegeven vaste maandkosten.
      Onbekende belastingen, netbeheerkosten, voorschotten, teruglevering,
      saldering, kortingen, indexatie en variabele/uurprijzen zijn niet berekend.
      Overgang naar een ander contract, levering of officiële vergelijking
      vindt nooit plaats. Alles blijft alleen in het geheugen van dit tabblad,
      tenzij je zelf een tekstbestand bewaart.</p>
    {message&&<p role="status" aria-live="polite" className="woon-energy-status">{message}</p>}
  </section>;
}

// Isolated private rental comparison kept in the explicitly reviewed dashboard source.
// No new Docker build-context allowlist entries or new runtime dependencies.
const PrivateRentalScenarioBudget=(()=>{
type AmountKey = 'rent'|'service'|'utilities'|'commute'|'moving'|'deposit';
type RentalScenario = { id:string; title:string } & Record<AmountKey,string>;
type Result = {
  scenario:RentalScenario; month:number; annualCost:number;
  firstMonthCash:number; firstYearCash:number; reservedDeposit:number;
  monthlyMargin:number;
};
const prices:ReadonlyArray<{key:AmountKey;label:string;hint:string}> = [
  {key:'rent',label:'Kale maandhuur',hint:'Per maand'},
  {key:'service',label:'Servicekosten',hint:'Per maand'},
  {key:'utilities',label:'Energie, water en internet',hint:'Geschat per maand'},
  {key:'commute',label:'Reiskosten',hint:'Geschat per maand'},
  {key:'moving',label:'Eenmalige verhuiskosten',hint:'Geen maandbedrag'},
  {key:'deposit',label:'Te reserveren borg',hint:'Tijdelijk vaststaand geld'}
];
const euro = new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'});
const newScenario=(id:string,title:string):RentalScenario=>({
  id,title,rent:'',service:'0',utilities:'0',commute:'0',moving:'0',deposit:'0'
});
const initial=()=>[newScenario('a','Woning A'),newScenario('b','Woning B')];
type RentalBackup={scenarios:RentalScenario[];budget:string};
const PRIVATE_BACKUP_KIND='woonpoints-rental-scenarios';
const BACKUP_LIMIT=8192;
const exactKeys=(value:Record<string,unknown>,expected:string[])=>
  Object.keys(value).sort().join(',')===expected.slice().sort().join(',');
function decodeRentalBackup(raw:string):RentalBackup|null{
  if(raw.length<16||raw.length>BACKUP_LIMIT)return null;
  try{
    const data:unknown=JSON.parse(raw);
    if(!data||typeof data!=='object'||Array.isArray(data))return null;
    const doc=data as Record<string,unknown>;
    // Accept only the canonical, app-exported JSON encoding. This additionally
    // refuses repeated JSON keys, invisible extra whitespace and alternatives.
    if(JSON.stringify(doc)!==raw||!exactKeys(doc,['kind','version','budget','scenarios'])||
       doc.kind!==PRIVATE_BACKUP_KIND||doc.version!==1||typeof doc.budget!=='string'||
       !Array.isArray(doc.scenarios)||!([2,3].includes(doc.scenarios.length)))return null;
    if(doc.budget!==''&&cents(doc.budget)===null)return null;
    const ids=['a','b','c'];
    const restored:RentalScenario[]=[];
    for(let i=0;i<doc.scenarios.length;i++){
      const row=doc.scenarios[i];
      if(!row||typeof row!=='object'||Array.isArray(row))return null;
      const r=row as Record<string,unknown>;
      if(!exactKeys(r,['id','title','rent','service','utilities','commute','moving','deposit'])||
         r.id!==ids[i]||typeof r.title!=='string'||!r.title.trim()||r.title.length>40||
         /[\u0000-\u001f\u007f]/u.test(r.title))return null;
      if(prices.some(p=>typeof r[p.key]!=='string'||(r[p.key]!==''&&cents(r[p.key] as string)===null)))return null;
      restored.push({...r} as RentalScenario);
    }
    return {scenarios:restored,budget:doc.budget};
  }catch{return null;}
}
function encodeRentalBackup(scenarios:RentalScenario[],budget:string):string{
  return JSON.stringify({kind:PRIVATE_BACKUP_KIND,version:1,budget,scenarios});
}
const valuePattern=/^(?:[0-9]{1,5})(?:[.,][0-9]{0,2})?$/;

/** Parse only short decimal euro inputs; compute exclusively with integer cents. */
function cents(value:string):number|null{
  if(!valuePattern.test(value)||/[.,]$/.test(value))return null;
  const [euros,part='']=value.replace(',','.').split('.');
  const amount=Number(euros)*100+Number(part.padEnd(2,'0'));
  return Number.isSafeInteger(amount)&&amount<=5_000_000?amount:null;
}
function makeResults(scenarios:RentalScenario[],budget:string):Result[]|null{
  const limit=cents(budget);
  if(limit===null||scenarios.some(s=>!s.title.trim()||s.title.length>40))return null;
  const results:Result[]=[];
  for(const scenario of scenarios){
    const values=prices.map(p=>cents(scenario[p.key]));
    if(values.some(v=>v===null))return null;
    const [rent,service,utilities,commute,moving,deposit]=values as number[];
    const month=rent+service+utilities+commute;
    results.push({
      scenario,month,annualCost:12*month+moving,
      firstMonthCash:month+moving+deposit,
      firstYearCash:12*month+moving+deposit,
      reservedDeposit:deposit,monthlyMargin:limit-month
    });
  }
  return results;
}
type RentalShock={
  id:string;scenario:string;month:number;delta:number;margin:number;
  reserve:number;annual:number;firstMonthCash:number
};
function stressScenarios(results:Result[],extra:string,energyPercent:number,
  reserveMonths:number,limit:number):RentalShock[]|null{
  const extraCents=cents(extra);
  if(extraCents===null||extraCents>100_000||![0,10,20,30].includes(energyPercent)||
     ![1,2,3,6].includes(reserveMonths))return null;
  return results.map(r=>{
    const utilities=cents(r.scenario.utilities);
    if(utilities===null)return null;
    const increase=extraCents+Math.round(utilities*energyPercent/100);
    const month=r.month+increase;
    return {id:r.scenario.id,scenario:r.scenario.title,month,delta:increase,margin:limit-month,
      reserve:month*reserveMonths,annual:12*month+cents(r.scenario.moving)!,
      firstMonthCash:month+cents(r.scenario.moving)!+r.reservedDeposit};
  }).filter((r):r is RentalShock=>r!==null);
}

type SavingsRow={
  id:string;scenario:string;target:number;availableAtMove:number;
  gap:number;monthsNeeded:number|null;remainingAfterGoal:number;
  neededMonthly:number|null
};
function planSavings(stress:RentalShock[],cashNow:string,savingPerMonth:string,
  monthsAway:number):SavingsRow[]|null{
  const now=cents(cashNow),perMonth=cents(savingPerMonth);
  if(now===null||perMonth===null||!Number.isInteger(monthsAway)||
     monthsAway<0||monthsAway>24)return null;
  const available=now+perMonth*monthsAway;
  return stress.map(row=>{
    // Reserve is intentionally *additional* to the first month's outlay:
    // a separate cushion, not an outgoing invoice or refundable deposit.
    const target=row.firstMonthCash+row.reserve;
    const outstanding=Math.max(0,target-now);
    return {id:row.id,scenario:row.scenario,target,availableAtMove:available,
      gap:Math.max(0,target-available),
      monthsNeeded:outstanding===0?0:perMonth===0?null:Math.ceil(outstanding/perMonth),
      neededMonthly:outstanding===0?0:monthsAway===0?null:Math.ceil(outstanding/monthsAway),
      remainingAfterGoal:available-target};
  });
}
function reportText(results:Result[],monthlyBudget:number,stress:RentalShock[],
  extra:string,energyPercent:number,reserveMonths:number,
  savings:SavingsRow[]|null,cashNow:string,savingPerMonth:string,monthsAway:number):string{
  const lines=[
    'WOONPOINTS · MIJN PRIVE HUURSCENARIOS',
    'Alle bedragen zelf ingevuld en niet onafhankelijk geverifieerd.',
    'Geen huuradvies, wettelijke betaalbaarheidscheck of officieel woningaanbod.',
    'Maandbudget: '+euro.format(monthlyBudget/100),'',
  ];
  for(const {scenario,month,annualCost,firstMonthCash,firstYearCash,reservedDeposit,monthlyMargin} of results){
    lines.push(scenario.title.trim(),
      'Maandlasten (incl. eigen schattingen): '+euro.format(month/100),
      'Maandbudgetruimte (+) / overschrijding (-): '+euro.format(monthlyMargin/100),
      'Eerste maand inclusief eigen verhuiskosten en borg: '+euro.format(firstMonthCash/100),
      'Twaalf maanden + verhuiskosten, exclusief terug te vragen borg: '+euro.format(annualCost/100),
      'Geld apart gehouden voor borg: '+euro.format(reservedDeposit/100),
      'Eerstejaars kasbehoefte inclusief gereserveerde borg: '+euro.format(firstYearCash/100),'');
  }
  lines.push('WAT-ALS SIMULATIE, NIET EEN VOORSPELLING',
    'Zelf toegevoegd per maand: '+euro.format((cents(extra)??0)/100),
    'Hypothetische stijging van alleen energie/water/internet: '+energyPercent+'%',
    'Zelf gekozen reserve: '+reserveMonths+' maanden van doorgerekende maandlasten','');
  for(const r of stress){
    lines.push(r.scenario,
      'Maandlasten onder eigen wat-als: '+euro.format(r.month/100),
      'Extra maandlast: '+euro.format(r.delta/100),
      'Ruimte t.o.v. eigen maandgrens: '+euro.format(r.margin/100),
      'Zelf berekende kosten voor 12 maanden + verhuizing: '+euro.format(r.annual/100),
      'Eigen reserve bij '+reserveMonths+' maanden: '+euro.format(r.reserve/100),
      'Eerste-maand kasbehoefte inclusief borg: '+euro.format(r.firstMonthCash/100),'');
  }
  lines.push('Een reserve is geen betaling, borgteruggave of daadwerkelijk spaarsaldo.','');
  if(savings){
    lines.push('MIJN EIGEN SPAARSIMULATIE, GEEN FINANCIEEL ADVIES',
      'Zelf opgegeven beschikbaar bedrag: '+euro.format((cents(cashNow)??0)/100),
      'Eigen geplande maandelijkse besparing: '+euro.format((cents(savingPerMonth)??0)/100),
      'Maanden tot eigen verhuisdoel: '+monthsAway,
      'Doel = eerste maand inclusief verhuiskosten en borg + aparte woonlastenbuffer.','');
    for(const r of savings){
      lines.push(r.scenario,
        'Doel voor vertrek: '+euro.format(r.target/100),
        'Verwacht gespaard onder eigen aannames: '+euro.format(r.availableAtMove/100),
        'Tekort bij verhuisdoel: '+euro.format(r.gap/100),
        'Zelf benodigde maanden bij gekozen spaarbedrag: '+(
          r.monthsNeeded===null?'niet haalbaar zonder extra inleg':String(r.monthsNeeded)),
        'Maandelijks nodig voor mijn gekozen verhuisdatum: '+(
          r.neededMonthly===null?'datum bereikt; doel niet gefinancierd':euro.format(r.neededMonthly/100)),
        'Ruimte (+) of tekort (-): '+euro.format(r.remainingAfterGoal/100),'');
    }
  }else lines.push('Persoonlijke spaarsimulatie niet ingevuld; geen spaardoel berekend.','');
  lines.push('Let op: geen inflatie, belastingen, toeslagen, borgteruggave, inkomenseisen of',
    'werkelijke toekomstige energietarieven voorspeld. Lasten kunnen afwijken.',
    'Door jou bewust gedownload; lokale/cloudgesynchroniseerde bestandslocaties',
    'vallen buiten Woonpoints. Browserinvoer wordt niet door de app opgeslagen.');
  return lines.join('\n')+'\n';
}

type RentalSourceProposal={
  label:string;rentCents:number;serviceCents:number;
  utilitiesCents:number;depositCents:number
};
function PrivateRentalScenarioBudget({
  proposal,onProposalHandled
}:{
  proposal?:RentalSourceProposal|null;onProposalHandled?:()=>void
}={}){
  const [scenarios,setScenarios]=useState<RentalScenario[]>(initial);
  const [budget,setBudget]=useState('');
  const [extraMonthly,setExtraMonthly]=useState('0');
  const [energyPercent,setEnergyPercent]=useState(0);
  const [reserveMonths,setReserveMonths]=useState(2);
  const [cashNow,setCashNow]=useState('');
  const [saveMonthly,setSaveMonthly]=useState('');
  const [monthsAway,setMonthsAway]=useState(3);
  const [preview,setPreview]=useState<{fingerprint:string;text:string}|null>(null);
  const [backupPreview,setBackupPreview]=useState<{fingerprint:string;text:string}|null>(null);
  const [incoming,setIncoming]=useState<{data:RentalBackup;raw:string}|null>(null);
  const [undo,setUndo]=useState<RentalBackup|null>(null);
  const fileGeneration=useRef(0);
  const [clearRequested,setClearRequested]=useState(false);
  const [status,setStatus]=useState('');
  const sourceFingerprint=JSON.stringify([scenarios,budget]);
  const fingerprint=JSON.stringify([scenarios,budget,extraMonthly,energyPercent,
    reserveMonths,cashNow,saveMonthly,monthsAway]);
  const results=useMemo(()=>makeResults(scenarios,budget),[scenarios,budget]);
  const monthlyBudget=cents(budget);
  const stress=useMemo(()=>(results&&monthlyBudget!==null?
    stressScenarios(results,extraMonthly,energyPercent,reserveMonths,monthlyBudget):null),
    [results,monthlyBudget,extraMonthly,energyPercent,reserveMonths]);
  const savings=useMemo(()=>stress?
    planSavings(stress,cashNow,saveMonthly,monthsAway):null,
    [stress,cashNow,saveMonthly,monthsAway]);
  function invalidateEdits(){
    fileGeneration.current++;
    setPreview(null);setBackupPreview(null);setIncoming(null);setUndo(null);
    setClearRequested(false);setStatus('');
  }
  function updateScenario(id:string,field:AmountKey|'title',raw:string){
    if(field==='title'){
      if(raw.length>40||/[\u0000-\u001f\u007f]/u.test(raw))return;
    }else if(raw!==''&&(!valuePattern.test(raw)||raw.length>9))return;
    setScenarios(items=>items.map(row=>row.id===id?{...row,[field]:raw}:row));
    invalidateEdits();
  }
  function updateBudget(raw:string){
    if(raw!==''&&(!valuePattern.test(raw)||raw.length>9))return;
    setBudget(raw);invalidateEdits();
  }
  function updateSavingsInput(which:'current'|'monthly',value:string){
    if(value!==''&&(!valuePattern.test(value)||value.length>9))return;
    if(which==='current')setCashNow(value);else setSaveMonthly(value);
    setPreview(null);setStatus('');
  }
  function updateWhatIfExtra(value:string){
    if(value!==''&&(!valuePattern.test(value)||value.length>9))return;
    setExtraMonthly(value);setPreview(null);setStatus('');
  }
  function applyOfferProposal(){
    if(!proposal)return;
    const money=[proposal.rentCents,proposal.serviceCents,proposal.utilitiesCents,proposal.depositCents];
    if(money.some(value=>!Number.isSafeInteger(value)||value<0||value>5_000_000)||
      typeof proposal.label!=='string'||!proposal.label.trim())return;
    const format=(value:number)=>(value/100).toFixed(2);
    setScenarios(items=>items.map(row=>row.id==='a'?{
      ...newScenario('a',proposal.label.trim().slice(0,40)),
      rent:format(proposal.rentCents),
      service:format(proposal.serviceCents),
      utilities:format(proposal.utilitiesCents),
      deposit:format(proposal.depositCents)
    }:row));
    invalidateEdits();setStatus('Eigen huurvoorstel na jouw bevestiging overgenomen in woning A; reis- en verhuiskosten blijven op 0 om zelf in te vullen.');
    onProposalHandled?.();
  }
  function openPreview(){
    if(!results||monthlyBudget===null||!stress)return;
    setPreview({fingerprint,text:reportText(results,monthlyBudget,stress,
      extraMonthly,energyPercent,reserveMonths,savings,cashNow,saveMonthly,monthsAway)});
    setStatus('Lees de hele tekst en kies pas daarna bewust voor downloaden.');
  }
  async function loadBackup(event:ChangeEvent<HTMLInputElement>){
    const file=event.currentTarget.files?.[0];
    if(!file)return;
    const ticket=++fileGeneration.current;
    setIncoming(null);setUndo(null);setBackupPreview(null);setPreview(null);
    try{
      if(file.size<16||file.size>BACKUP_LIMIT)throw Error('too large');
      const raw=await file.text();
      if(ticket!==fileGeneration.current)return;
      const data=decodeRentalBackup(raw);
      if(!data)throw Error('format');
      setIncoming({data,raw});
      setStatus('Controleer de volledige eigen JSON hieronder. Niets is vervangen.');
    }catch{
      if(ticket===fileGeneration.current)setStatus('Privé-herstel geweigerd: bestand te groot of geen exacte Woonpoints-versie 1 back-up.');
    }finally{event.currentTarget.value='';}
  }
  function applyImport(){
    if(!incoming)return;
    fileGeneration.current++;
    setUndo({scenarios:scenarios.map(x=>({...x})),budget});
    setScenarios(incoming.data.scenarios.map(x=>({...x})));
    setBudget(incoming.data.budget);
    setIncoming(null);setPreview(null);setBackupPreview(null);
    setStatus('Eigen back-up in dit tabblad hersteld. Je kunt dit eenmaal ongedaan maken.');
  }
  function restorePrevious(){
    if(!undo)return;
    fileGeneration.current++;
    setScenarios(undo.scenarios.map(x=>({...x})));setBudget(undo.budget);
    setUndo(null);setPreview(null);setBackupPreview(null);
    setStatus('Je vorige tabbladinvoer is hersteld.');
  }
  function previewBackup(){
    const text=encodeRentalBackup(scenarios,budget);
    if(text.length>BACKUP_LIMIT||!decodeRentalBackup(text)){
      setBackupPreview(null);
      setStatus('Back-up niet gereed: maak bedragen en woonlabels compleet, zonder halve decimalen.');
      return;
    }
    setBackupPreview({fingerprint:sourceFingerprint,text});
    setPreview(null);setStatus('Bekijk de volledige privé-JSON en kies daarna zelf voor downloaden.');
  }
  function downloadFile(filename:string,text:string,type:string){
    const url=URL.createObjectURL(new Blob([text],{type}));
    try{
      const link=document.createElement('a');
      link.href=url;link.download=filename;
      document.body.appendChild(link);link.click();link.remove();
      setStatus('Privébestand aangeboden aan de browser; Woonpoints heeft niets verzonden.');
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }
  function download(){
    if(!preview||preview.fingerprint!==fingerprint)return;
    downloadFile('woonpoints-mijn-huurscenarios.txt',preview.text,'text/plain;charset=utf-8');
  }
  return <section className="panel private-rental-budget" aria-labelledby="rental-scenarios-heading">
    <div className="private-rental-budget-full">
      <p className="eyebrow">EIGEN KEUZES · ALLEEN DIT TABBLAD</p>
      <h2 id="rental-scenarios-heading">Wat kost verhuizen naar woning A, B of C?</h2>
      <p>Vergelijk je eigen maandlasten, eenmalige verhuiskosten en het geld dat je voor borg moet reserveren. De borg is <strong>geen berekende uitgave</strong>, maar wel geld dat je voorlopig beschikbaar moet hebben. Alle bedragen zijn eigen schattingen, niet gecontroleerde aanbiedingen of een oordeel over betaalbaarheid.</p>
      {proposal&&<div className="private-rental-budget-preview">
        <h3>Eigen huurvoorstel overnemen? Eerst controleren</h3>
        <p>Dit voorstel komt uit je lokale tabblad **Huurvoorstellen**, niet van WoningNet.
          Bij bevestiging wordt alleen woning A vervangen; jouw woning B/C en maandgrens blijven staan.
          Zelf ingevoerde reis- en verhuiskosten voor A worden op 0 gezet.</p>
        <dl>
          <dt>Eigen label</dt><dd>{proposal.label.slice(0,40)}</dd>
          <dt>Kale huur</dt><dd>{euro.format(proposal.rentCents/100)}</dd>
          <dt>Servicekosten</dt><dd>{euro.format(proposal.serviceCents/100)}</dd>
          <dt>Energie en overige lasten</dt><dd>{euro.format(proposal.utilitiesCents/100)}</dd>
          <dt>Borg (gereserveerd, geen jaaruitgave)</dt><dd>{euro.format(proposal.depositCents/100)}</dd>
        </dl>
        <button type="button" onClick={applyOfferProposal}>Ja, vervang woning A met dit eigen voorstel</button>
        <button type="button" onClick={onProposalHandled}>Nee, behoud mijn scenario's</button>
      </div>}
      <label className="private-rental-budget-label" htmlFor="rental-monthly-budget">
        Mijn eigen maandgrens in euro
        <input id="rental-monthly-budget" value={budget} onChange={e=>updateBudget(e.target.value)}
          placeholder="Bijvoorbeeld 1250" inputMode="decimal" autoComplete="off" maxLength={9}/>
      </label>
      <div className="private-rental-budget-grid">
        {scenarios.map(row=><fieldset key={row.id} className="private-rental-budget-card">
          <legend>{row.id==='a'?'Woning A':row.id==='b'?'Woning B':'Woning C'}</legend>
          <label className="private-rental-budget-label">Mijn korte label
            <input value={row.title} maxLength={40} onChange={e=>updateScenario(row.id,'title',e.target.value)}
              autoComplete="off" aria-label={'Zelfgekozen label '+row.id}/>
          </label>
          {prices.map(p=><label className="private-rental-budget-label" key={p.key}>
            {p.label}<small>{p.hint}</small>
            <input inputMode="decimal" autoComplete="off" maxLength={9}
              placeholder="EUR" value={row[p.key]} onChange={e=>updateScenario(row.id,p.key,e.target.value)}
              aria-label={p.label+' van '+row.title}/>
          </label>)}
          {row.id==='c'&&<button type="button" onClick={()=>{
            setScenarios(items=>items.filter(s=>s.id!=='c'));invalidateEdits();
          }}>Verwijder woning C</button>}
        </fieldset>)}
      </div>
      {scenarios.length<3&&<button type="button" onClick={()=>{
        setScenarios(items=>[...items,newScenario('c','Woning C')]);invalidateEdits();
      }}>+ Vergelijk ook woning C</button>}
      <h3>Jouw rekenoverzicht</h3>
      {!results?<p role="status">Vul een maandgrens en voor elke woning een geldige kale huur in. Je kunt andere kosten bewust op 0 laten staan. Maximaal € 50.000 per invoerveld.</p>:
        <div className="private-rental-budget-scroll">
          <table>
            <caption>Handmatige scenariovergelijking; geen automatische broncontrole</caption>
            <thead><tr><th scope="col">Eigen woning</th><th scope="col">Per maand</th>
              <th scope="col">Ruimte t.o.v. maandgrens</th><th scope="col">Eerste maand incl. borg</th>
              <th scope="col">12 maanden + verhuizing</th><th scope="col">Borg apart</th>
              <th scope="col">Eerstejaars kasbehoefte incl. borg</th></tr></thead>
            <tbody>{results.map(r=><tr key={r.scenario.id}>
              <th scope="row">{r.scenario.title}</th>
              <td>{euro.format(r.month/100)}</td>
              <td>{euro.format(r.monthlyMargin/100)} {r.monthlyMargin<0?'(boven eigen grens)':''}</td>
              <td>{euro.format(r.firstMonthCash/100)}</td>
              <td>{euro.format(r.annualCost/100)}</td>
              <td>{euro.format(r.reservedDeposit/100)}</td>
              <td>{euro.format(r.firstYearCash/100)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      <p>De basisberekening neemt iedere maand dezelfde bedragen aan. Geen huurtoeslag, inflatie, borgteruggave, jaarlijkse wijzigingen, regelgeving of toekomstige energieprijzen meegerekend.</p>
      <div className="private-rental-budget-what-if">
        <h3>Wat-als: onverwachte lasten en mijn eigen reserve</h3>
        <p>Stel zelf een denkbeeldige tegenvaller in. Alleen de zelf opgegeven energie/water/internetpost stijgt met het gekozen percentage. Dit is geen tariefvoorspelling of advies over hoeveel je moet sparen.</p>
        <div className="private-rental-budget-grid">
          <label className="private-rental-budget-label">Extra maandelijkse tegenvaller (max € 1.000)
            <input inputMode="decimal" autoComplete="off" value={extraMonthly} maxLength={9}
              onChange={e=>updateWhatIfExtra(e.target.value)} />
          </label>
          <label className="private-rental-budget-label">Denkbeeldige stijging energie/water/internet
            <select value={energyPercent} onChange={e=>{
              setEnergyPercent(Number(e.target.value));setPreview(null);setStatus('');
            }}>
              {[0,10,20,30].map(p=><option key={p} value={p}>{p}%</option>)}
            </select>
          </label>
          <label className="private-rental-budget-label">Mijn gewenste woonlastenreserve
            <select value={reserveMonths} onChange={e=>{
              setReserveMonths(Number(e.target.value));setPreview(null);setStatus('');
            }}>
              {[1,2,3,6].map(n=><option key={n} value={n}>{n} {n===1?'maand':'maanden'}</option>)}
            </select>
          </label>
        </div>
        {!stress?<p role="status">Vul een extra maandbedrag van maximaal € 1.000 volledig in om de wat-als-berekening te zien.</p>:
        <div className="private-rental-budget-scroll">
          <table>
            <caption>Persoonlijke stresstest op basis van zelfgekozen aannames, niet geverifieerd</caption>
            <thead><tr><th scope="col">Eigen woning</th><th scope="col">Nieuwe maandlasten</th>
              <th scope="col">Extra per maand</th><th scope="col">Ruimte onder maandgrens</th>
              <th scope="col">Eigen bufferdoel</th><th scope="col">Eerste maand incl. borg</th>
              <th scope="col">12 maanden incl. verhuizing, excl. borg</th></tr></thead>
            <tbody>{stress.map(r=><tr key={r.id}>
              <th scope="row">{r.scenario}</th>
              <td>{euro.format(r.month/100)}</td>
              <td>{euro.format(r.delta/100)}</td>
              <td>{euro.format(r.margin/100)}{r.margin<0?' (boven eigen grens)':''}</td>
              <td>{euro.format(r.reserve/100)}</td>
              <td>{euro.format(r.firstMonthCash/100)}</td>
              <td>{euro.format(r.annual/100)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
        <p>Het bufferdoel staat los van de borg, en een berekende buffer is geen bewijs dat je dit geld hebt. Deze instellingen zijn alleen een tijdelijke simulatie en maken geen deel uit van de versie 1 JSON-back-up van de basiswoningen.</p>
      </div>
      <div className="private-rental-budget-what-if private-rental-budget-savings">
        <h3>Mijn verhuisspaarplan: startgeld + aparte reserve</h3>
        <p>Maak voor elke eigen woning een transparant spaarplaatje met jouw nu beschikbare bedrag en de maandelijkse inleg die je zelf denkt te kunnen missen. De doelbedragen zijn: de eerste maand met borg en verhuiskosten <strong>plus</strong> jouw eerder gekozen extra buffer. Geen echt spaar-, bank- of huuradvies.</p>
        <div className="private-rental-budget-grid">
          <label className="private-rental-budget-label">Nu zelf beschikbaar spaargeld (euro)
            <input inputMode="decimal" autoComplete="off" maxLength={9}
              value={cashNow} onChange={e=>updateSavingsInput('current',e.target.value)}
              placeholder="Bijvoorbeeld 1500"/>
          </label>
          <label className="private-rental-budget-label">Wat ik zelf iedere maand wil sparen (euro)
            <input inputMode="decimal" autoComplete="off" maxLength={9}
              value={saveMonthly} onChange={e=>updateSavingsInput('monthly',e.target.value)}
              placeholder="Bijvoorbeeld 250"/>
          </label>
          <label className="private-rental-budget-label">Maanden tot mijn geplande verhuizing
            <select value={monthsAway} onChange={e=>{
              setMonthsAway(Number(e.target.value));setPreview(null);setStatus('');
            }}>
              {[0,1,2,3,6,9,12,18,24].map(n=><option key={n} value={n}>
                {n} {n===1?'maand':'maanden'}</option>)}
            </select>
          </label>
        </div>
        {!savings?<p role="status">Vul eerst je beschikbare bedrag én maandelijkse spaarbedrag volledig in. Je kunt bewust 0 invullen.</p>:
          <div className="private-rental-budget-scroll">
            <table>
              <caption>Eigen gesimuleerd spaardoel per woning; zonder rente, toeslag, echte bankdata of prijsstijging</caption>
              <thead><tr><th scope="col">Eigen woning</th><th scope="col">Doel: start + reserve</th>
                <th scope="col">Zelf verwacht bij vertrek</th><th scope="col">Tekort bij vertrek</th>
                <th scope="col">Maanden om dit doel te bereiken</th>
                <th scope="col">Minimaal sparen per maand voor verhuisdoel</th>
                <th scope="col">Ruimte (+) of tekort (-)</th></tr></thead>
              <tbody>{savings.map(r=><tr key={r.id}>
                <th scope="row">{r.scenario}</th>
                <td>{euro.format(r.target/100)}</td>
                <td>{euro.format(r.availableAtMove/100)}</td>
                <td>{euro.format(r.gap/100)}</td>
                <td>{r.monthsNeeded===null?'Niet met € 0 extra sparen':
                  r.monthsNeeded+' '+(r.monthsNeeded===1?'maand':'maanden')}</td>
                <td>{r.neededMonthly===null?'Niet vóór vertrek bij 0 maanden':
                  euro.format(r.neededMonthly/100)}
                  {r.neededMonthly!==null&&cents(saveMonthly)!==null&&
                    r.neededMonthly>cents(saveMonthly)!?' (meer dan eigen plan)':''}</td>
                <td>{euro.format(r.remainingAfterGoal/100)}</td>
              </tr>)}</tbody>
            </table>
          </div>}
        <p>Geen automatische bankkoppeling of controle van jouw inkomen. Rente, aankomende rekeningen en de vraag of je de inleg daadwerkelijk kunt missen zijn niet meegenomen. De spaarinstellingen zijn tijdelijk en veranderen je basis-JSON niet.</p>
      </div>
      <div className="private-rental-budget-actions">
        <button type="button" disabled={!results||!stress} onClick={openPreview}>Bekijk basis + wat-als + spaarplan als privé-TXT</button>
        <button type="button" onClick={()=>{setClearRequested(true);setPreview(null);setBackupPreview(null);}}>Wis alle eigen scenario's…</button>
      </div>
      {clearRequested&&<div role="group" aria-label="Scenario's wissen">
        <p>Alle ingevulde scenario's en de maandgrens uit dit tabblad wissen?</p>
        <button type="button" onClick={()=>{
          fileGeneration.current++;setScenarios(initial());setBudget('');
          setExtraMonthly('0');setEnergyPercent(0);setReserveMonths(2);
          setCashNow('');setSaveMonthly('');setMonthsAway(3);
          setPreview(null);setBackupPreview(null);setIncoming(null);setUndo(null);
          setClearRequested(false);setStatus('Invoer uit dit tabblad gewist.');
        }}>Ja, wis mijn invoer</button>{' '}
        <button type="button" onClick={()=>setClearRequested(false)}>Behoud mijn invoer</button>
      </div>}
      {preview?.fingerprint===fingerprint&&<div className="private-rental-budget-preview">
        <h3>Controleer de complete tekst</h3>
        <pre>{preview.text}</pre>
        <button type="button" onClick={download}>Download precies deze privé-TXT</button>
      </div>}
      <div className="private-rental-budget-transfer">
        <h3>Mijn eigen invoer tijdelijk meenemen</h3>
        <p>Bewaar desgewenst je huidige 2–3 scenario's en budget als privé-JSON.
          Een geïmporteerd bestand wordt pas overgenomen na een aparte, zichtbare bevestiging.
          Zonder eigen download blijft alles in dit tabblad.</p>
        <button type="button" onClick={previewBackup}>Bekijk mijn JSON vóór bewaren</button>
        {backupPreview?.fingerprint===sourceFingerprint&&<div className="private-rental-budget-preview">
          <p>Deze JSON bevat alle zelfgekozen labels en geldbedragen. Controleer het bestand vóór download.</p>
          <pre>{backupPreview.text}</pre>
          <button type="button" onClick={()=>downloadFile('woonpoints-prive-huurscenarios.json',backupPreview.text,'application/json;charset=utf-8')}>
            Download precies deze privé-JSON</button>
        </div>}
        <label className="private-rental-budget-label">Open een eerdere eigen Woonpoints-JSON (maximaal 8 KiB)
          <input type="file" accept=".json,application/json" onChange={loadBackup} />
        </label>
        {incoming&&<div className="private-rental-budget-preview">
          <p>Vervangen is nog niet uitgevoerd. Je huidige scenario's blijven intact tot je bevestigt.
            Nieuw budget: {incoming.data.budget||'niet ingevuld'}; woningen:
            {' '}{incoming.data.scenarios.map(x=>x.title).join(' · ')}.</p>
          <pre>{incoming.raw}</pre>
          <button type="button" onClick={applyImport}>Ja, vervang mijn scenario's door deze back-up</button>
          <button type="button" onClick={()=>{setIncoming(null);setStatus('Import geannuleerd; eigen invoer behouden.');}}>
            Behoud mijn huidige invoer</button>
        </div>}
        {undo&&<button type="button" onClick={restorePrevious}>Herstel mijn vorige tabbladinvoer</button>}
      </div>
      {status&&<p role="status" aria-live="polite">{status}</p>}
      <p><small>Er is geen serveropslag, browseropslag, cookie, upload, API-verzoek of WoningNet-reactie. Sluiten van dit tabblad wist de ingevulde scenario's; zelf gedownloade bestanden blijven onder jouw beheer.</small></p>
    </div>
  </section>;
}
return PrivateRentalScenarioBudget;
})();

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
  const [rentalPrefill,setRentalPrefill]=useState<{label:string;rent:number}|null>(null);
  const [matchCostOffer,setMatchCostOffer]=useState<PrivateMatchCostPair|null>(null);
  const [scenarioOfferProposal,setScenarioOfferProposal]=useState<PrivateRentalScenarioOfferProposal|null>(null);
  const [energyRentalProposal,setEnergyRentalProposal]=useState<PrivateEnergyRentalOfferProposal|null>(null);
  const [safetyQuestionsProposal,setSafetyQuestionsProposal]=useState<string|null>(null);
  const [rentalDecisionProposal,setRentalDecisionProposal]=useState<PrivateRentalDecisionSnapshot|null>(null);
  const [acceptedRentalDecision,setAcceptedRentalDecision]=useState<{
    caseId:number;offer:PrivateRentalDecisionSnapshot
  }|null>(null);
  const invalidateRentalDecision=()=>{
    setRentalDecisionProposal(null);setAcceptedRentalDecision(null);
  };
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
        // Never steal keyboard focus from a private note, contract editor,
        // form selection or ongoing IME text composition.
        if(event.isComposing)return;
        const target=event.target;
        if(target instanceof Element&&target!==navSearchRef.current&&
          target.closest('input, textarea, select, [contenteditable], [role="textbox"]'))return;
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
      <ManualHousingDecisionWorkspace onRentalPrefill={item=>setRentalPrefill({...item})}
        matchCostOffer={matchCostOffer} onMatchCostHandled={()=>setMatchCostOffer(null)} />
      <section id="private-woningmatch-heading" aria-label="Mijn woningmatch" className="card">
        <PrivateListingMatchStudio onRentalPrefill={item=>setRentalPrefill({...item})}
          onCostPrefill={pair=>setMatchCostOffer({first:{...pair.first},second:{...pair.second}})} />
      </section>
      <PrivateRentalScenarioBudget proposal={scenarioOfferProposal}
        onProposalHandled={()=>setScenarioOfferProposal(null)} />
      <PrivateRentalOfferDesk prefill={rentalPrefill}
        onPrefillHandled={()=>setRentalPrefill(null)}
        energyPrefill={energyRentalProposal}
        onEnergyHandled={()=>setEnergyRentalProposal(null)}
        onPrepareRentalBudget={proposal=>setScenarioOfferProposal({...proposal})}
        onInvalidateRentalBudget={()=>setScenarioOfferProposal(null)}
        safetyQuestions={safetyQuestionsProposal}
        onSafetyQuestionsHandled={()=>setSafetyQuestionsProposal(null)}
        onPrepareSafetyDecision={snapshot=>{
          setRentalDecisionProposal(snapshot);
          setAcceptedRentalDecision(null);
        }}
        onInvalidateSafetyDecision={invalidateRentalDecision} />
      <PrivateEnergyQuoteComparison
        onProposeRental={proposal=>setEnergyRentalProposal({...proposal})}
        onInvalidateRental={()=>setEnergyRentalProposal(null)} />
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
      <PrivateOfferSafety onPrepareRentalQuestions={setSafetyQuestionsProposal}
        rentalDecisionProposal={rentalDecisionProposal}
        acceptedRentalDecision={acceptedRentalDecision}
        onAcceptRentalDecision={setAcceptedRentalDecision}
        onClearRentalProposal={()=>setRentalDecisionProposal(null)}
        onClearRentalDecision={invalidateRentalDecision} />
      <PrivateContractReview acceptedRentalDecision={acceptedRentalDecision} />
      <PrivateContractVersionComparison />
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


// Read-only, entirely local housing-offer safety decisions.
type OfferAnswer = 'yes' | 'no' | 'unknown';
type OfferSignal = {
  id: string;
  group: 'Identiteit en kanaal' | 'Betalen en documenten' | 'Afspraak en overeenkomst';
  question: string;
  why: string;
  next: string;
  severity: 'urgent' | 'check';
};

const offerSignals: readonly OfferSignal[] = [
  {
    id: 'unverified-contact', group: 'Identiteit en kanaal', severity: 'urgent',
    question: 'Kan ik de afzender of verhuurder niet onafhankelijk via een officieel kanaal bevestigen?',
    why: 'Een profielnaam, logo of meegestuurde link is op zichzelf geen onafhankelijk identiteitsbewijs.',
    next: 'Zoek de organisatie of verhuurder zelf via een vertrouwde bron en neem via dat kanaal contact op.'
  },
  {
    id: 'moved-conversation', group: 'Identiteit en kanaal', severity: 'check',
    question: 'Wordt de communicatie verplaatst naar een onbekend privéaccount of een ander platform?',
    why: 'Daardoor kan de oorspronkelijke aanbieder of de officiële omgeving buiten beeld raken.',
    next: 'Controleer het aanbod en de afzender opnieuw in het oorspronkelijke, officiële kanaal.'
  },
  {
    id: 'upfront-payment', group: 'Betalen en documenten', severity: 'urgent',
    question: 'Moet ik vooruitbetalen voordat ik de overeenkomst, ontvanger en betaalreden kan verifiëren?',
    why: 'Zonder verifieerbare ontvanger en voorwaarden is een betaling moeilijk te beoordelen of te herstellen.',
    next: 'Maak niets over totdat de identiteit, betaalgegevens, reden en schriftelijke voorwaarden onafhankelijk zijn bevestigd.'
  },
  {
    id: 'identity-upload', group: 'Betalen en documenten', severity: 'urgent',
    question: 'Wordt om een identiteitsbewijs, inlogcode of gevoelige gegevens gevraagd via een onbevestigd kanaal?',
    why: 'Gevoelige gegevens horen alleen bij een duidelijk omschreven, noodzakelijk en vertrouwd proces.',
    next: 'Deel geen codes of documenten via die route; verifieer eerst rechtstreeks met de officiële partij.'
  },
  {
    id: 'odd-payment', group: 'Betalen en documenten', severity: 'check',
    question: 'Wordt een ongebruikelijke betaalmethode of een betaling aan een andere naam gevraagd?',
    why: 'Een afwijkende ontvanger of betaalroute vraagt om onafhankelijke controle, ook als er een verklaring bij staat.',
    next: 'Controleer ontvanger en betaalinstructies via een apart, vertrouwd contactkanaal.'
  },
  {
    id: 'cannot-view', group: 'Afspraak en overeenkomst', severity: 'check',
    question: 'Mag ik de woning of de aangeboden voorwaarden niet voldoende controleren vóór een beslissing?',
    why: 'Zonder inspectie of duidelijke stukken blijven belangrijke eigenschappen en verplichtingen onbevestigd.',
    next: 'Vraag om een verifieerbare bezichtiging, volledige voorwaarden en tijd om die rustig door te nemen.'
  },
  {
    id: 'pressure', group: 'Afspraak en overeenkomst', severity: 'urgent',
    question: 'Word ik onder druk gezet om onmiddellijk te tekenen, te betalen of gegevens te versturen?',
    why: 'Tijdsdruk kan onafhankelijke controle en een weloverwogen keuze onmogelijk maken.',
    next: 'Stop de handeling en vraag tijd voor onafhankelijke controle of advies.'
  },
  {
    id: 'unclear-terms', group: 'Afspraak en overeenkomst', severity: 'check',
    question: 'Zijn huur, borg, kosten, looptijd of verantwoordelijkheden niet helder en schriftelijk vastgelegd?',
    why: 'Mondelinge of ontbrekende voorwaarden kunnen later tot verschillende verwachtingen leiden.',
    next: 'Vraag om een volledige schriftelijke uitsplitsing en laat twijfelpunten toelichten voordat je akkoord gaat.'
  },
  {
    id: 'different-offer', group: 'Afspraak en overeenkomst', severity: 'urgent',
    question: 'Verschillen de gegevens van de aangeboden woning of contractpartij van de officiële bron?',
    why: 'Een afwijkend adres, woningtype of contractpartij kan betekenen dat je niet hetzelfde aanbod beoordeelt.',
    next: 'Vergelijk zelfstandig de originele publicatie en vraag schriftelijk om uitleg voor elk verschil.'
  }
] as const;

const offerGroups = ['Identiteit en kanaal', 'Betalen en documenten', 'Afspraak en overeenkomst'] as const;
const offerLabels: Record<OfferAnswer, string> = { yes: 'Ja, dit speelt', no: 'Nee', unknown: 'Weet ik niet' };

const offerSafetyRentalQuestions: Record<string,string> = {
  'unverified-contact': 'Wie is de officiële verhuurder?',
  'moved-conversation': 'Waarom een ander contactkanaal?',
  'upfront-payment': 'Welke betaalreden en aan wie?',
  'identity-upload': 'Waarom zijn documenten/codes nodig?',
  'odd-payment': 'Waarom wijkt de betaalontvanger af?',
  'cannot-view': 'Wanneer kan ik aanbod en woning zien?',
  'pressure': 'Krijg ik tijd voor eigen controle?',
  'unclear-terms': 'Wat zijn alle schriftelijke voorwaarden?',
  'different-offer': 'Waarom wijkt het aanbod af?'
};

type OfferSafetyCase = {
  id: number;
  answers: Record<string, OfferAnswer>;
  reviewed: Record<string, boolean>;
  // Local-only planning. Not included in either the TXT/JSON safety evidence.
  reviewDate?: string;
  decision?: OfferDecision;
  decisionReason?: OfferReason;
};
const MAX_OFFER_SAFETY_CASES = 5;
const MAX_OFFER_SAFETY_BACKUP_BYTES = 10 * 1024;
const OFFER_SAFETY_BACKUP_KIND = 'woonpoints-private-offer-safety';
const OFFER_SAFETY_BACKUP_VERSION = 1;

function offerSafetyBackup(cases: readonly OfferSafetyCase[]): string {
  return JSON.stringify({
    kind: OFFER_SAFETY_BACKUP_KIND,
    version: OFFER_SAFETY_BACKUP_VERSION,
    cases: cases.map(item => ({
      id: item.id,
      answers: Object.fromEntries(Object.entries(item.answers)),
      reviewed: Object.fromEntries(Object.entries(item.reviewed).filter(
        ([id, done]) => done === true &&
          (item.answers[id] === 'yes' || item.answers[id] === 'unknown')
      ))
    }))
  }, null, 2);
}

function decodeOfferSafetyBackup(raw: string): OfferSafetyCase[] | null {
  if (raw.length < 20 || raw.length > MAX_OFFER_SAFETY_BACKUP_BYTES) return null;
  const isObject = (value: unknown): value is Record<string, unknown> =>
    value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
  const hasExactKeys = (value: Record<string, unknown>, names: readonly string[]) => {
    const keys = Object.keys(value);
    return keys.length === names.length && keys.every(key => names.includes(key));
  };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed) || !hasExactKeys(parsed, ['kind', 'version', 'cases']) ||
      parsed.kind !== OFFER_SAFETY_BACKUP_KIND ||
      parsed.version !== OFFER_SAFETY_BACKUP_VERSION ||
      !Array.isArray(parsed.cases) || parsed.cases.length < 1 ||
      parsed.cases.length > MAX_OFFER_SAFETY_CASES) return null;
    const ids = new Set<number>();
    const allowed = new Set(offerSignals.map(signal => signal.id));
    const restored: OfferSafetyCase[] = [];
    for (const original of parsed.cases) {
      if (!isObject(original) || !hasExactKeys(original, ['id', 'answers', 'reviewed']) ||
        typeof original.id !== 'number' || !Number.isSafeInteger(original.id) ||
        original.id < 1 || original.id > 1_000_000_000 || ids.has(original.id) ||
        !isObject(original.answers) || !isObject(original.reviewed)) return null;
      ids.add(original.id);
      const answerEntries = Object.entries(original.answers);
      const reviewedEntries = Object.entries(original.reviewed);
      if (answerEntries.length > offerSignals.length ||
        reviewedEntries.length > offerSignals.length) return null;
      const answers: Record<string, OfferAnswer> = Object.create(null);
      const reviewed: Record<string, boolean> = Object.create(null);
      for (const [id, answer] of answerEntries) {
        if (!allowed.has(id) || (answer !== 'yes' && answer !== 'no' &&
          answer !== 'unknown')) return null;
        answers[id] = answer;
      }
      for (const [id, done] of reviewedEntries) {
        if (!allowed.has(id) || done !== true ||
          (answers[id] !== 'yes' && answers[id] !== 'unknown')) return null;
        reviewed[id] = true;
      }
      restored.push({ id: original.id, answers, reviewed });
    }
    return restored;
  } catch { return null; }
}

function offerSafetyExport(answers: Record<string, OfferAnswer>, checkedAt: string, reviewed: Record<string, boolean>, caseName: string): string {
  const lines = [
    'WOONPOINTS · PRIVÉ WONINGAANBODCHECK',
    'Zelf ingevulde aandachtspunten (geen identiteits- of fraudecontrole)',
    'Eigen werkblad: ' + caseName,
    'Gecontroleerd op: ' + checkedAt,
    '',
    ...offerSignals.flatMap(signal => [
      signal.group + ' — ' + signal.question,
      'Antwoord: ' + (answers[signal.id] ? offerLabels[answers[signal.id]] : 'Niet ingevuld'),
      ...((answers[signal.id] === 'yes' || answers[signal.id] === 'unknown')
        ? ['Zelf nagekeken (niet geverifieerd): ' + (reviewed[signal.id] ? 'Ja' : 'Nog niet')] : []),
      ...(answers[signal.id] === 'yes' ? ['Volgende stap: ' + signal.next] : []),
      ...(answers[signal.id] === 'unknown' ? ['Volgende stap: onafhankelijke informatie verzamelen.'] : []),
      ''
    ]),
    'BELANGRIJK: Dit is alleen jouw eigen checklist. Geen WoningNet-, bank-, verhuurder- of juridische verificatie.',
    'Er zijn geen persoonsgegevens, documentinhoud, betaalgegevens of externe verificaties verwerkt.'
  ];
  return lines.join('\n');
}

type Answer = 'yes' | 'no' | 'unknown';
type Workblad = {
  id: number;
  answers: Record<string, Answer>;
  reviewed: Record<string, boolean>;
  reviewDate?: string;
  decision?: OfferDecision;
  decisionReason?: OfferReason;
};
type Signal = {
  id: string;
  group: string;
  question: string;
  next: string;
  severity: 'urgent' | 'check';
};
type Action = {
  caseId: number;
  signal: Signal;
  answer: Answer | undefined;
  reviewed: boolean;
};

type OfferDecision = 'investigate' | 'pause' | 'decline';
type OfferReason = 'costs' | 'conditions' | 'sender' | 'timing' | 'other';
const offerDecisionStages: readonly {value: OfferDecision; label: string}[] = [
  { value: 'investigate', label: 'Zelf verder onderzoeken' },
  { value: 'pause', label: 'Voorlopig parkeren' },
  { value: 'decline', label: 'Zelf van dit voorstel afzien' }
];
const offerDecisionReasons: readonly {value: OfferReason; label: string}[] = [
  { value: 'costs', label: 'Eigen woonkosten' },
  { value: 'conditions', label: 'Onbekende voorwaarden' },
  { value: 'sender', label: 'Afzender en contact' },
  { value: 'timing', label: 'Eigen planning' },
  { value: 'other', label: 'Andere persoonlijke reden' }
];

type PrivateDecisionBackupRow = {
  id: number;
  stage: OfferDecision | null;
  reason: OfferReason | null;
};

function PrivateOfferDecisionBackup({
  cases, onRestore
}: {
  cases: readonly Workblad[];
  onRestore: (rows: readonly PrivateDecisionBackupRow[]) => void;
}) {
  const [preview, setPreview] = useState<{source: string; content: string} | null>(null);
  const [pending, setPending] = useState<{
    rows: PrivateDecisionBackupRow[];
    source: string;
  } | null>(null);
  const [message, setMessage] = useState('');
  const generation = useRef(0);
  const source = JSON.stringify(cases.map(item =>
    [item.id, item.decision ?? null, item.decisionReason ?? null]));
  const rawBackup = JSON.stringify({
    kind: 'woonpoints-private-offer-decisions',
    version: 1,
    cases: cases.map(item => ({
      id: item.id, stage: item.decision ?? null,
      reason: item.decision ? item.decisionReason ?? null : null
    }))
  }, null, 2);
  const shownBackup = preview?.source === rawBackup ? preview.content : null;
  const shownImport = pending?.source === source ? pending.rows : null;

  function decodeDecisionBackup(raw: string): PrivateDecisionBackupRow[] | null {
    if (raw.length < 40 || raw.length > 4096) return null;
    try {
      const object: unknown = JSON.parse(raw);
      const isRecord = (value: unknown): value is Record<string, unknown> =>
        value !== null && typeof value === 'object' && !Array.isArray(value) &&
        Object.getPrototypeOf(value) === Object.prototype;
      const keys = (value: Record<string, unknown>, expected: readonly string[]) =>
        Object.keys(value).length === expected.length &&
        expected.every(key => Object.prototype.hasOwnProperty.call(value, key));
      if (!isRecord(object) || !keys(object, ['kind', 'version', 'cases']) ||
        object.kind !== 'woonpoints-private-offer-decisions' ||
        object.version !== 1 || !Array.isArray(object.cases) ||
        object.cases.length !== cases.length || object.cases.length > 5 ||
        object.cases.length < 1) return null;
      const seen = new Set<number>();
      const ids = new Set(cases.map(item => item.id));
      const rows: PrivateDecisionBackupRow[] = [];
      for (const candidate of object.cases) {
        if (!isRecord(candidate) || !keys(candidate, ['id', 'stage', 'reason']) ||
          typeof candidate.id !== 'number' || !Number.isSafeInteger(candidate.id) ||
          candidate.id < 1 || candidate.id > 1_000_000_000 ||
          !ids.has(candidate.id) || seen.has(candidate.id)) return null;
        const stage = candidate.stage;
        const reason = candidate.reason;
        if (!(stage === null || offerDecisionStages.some(item => item.value === stage)) ||
          !(reason === null || offerDecisionReasons.some(item => item.value === reason)) ||
          (stage === null && reason !== null)) return null;
        seen.add(candidate.id);
        rows.push({
          id: candidate.id,
          stage: stage as OfferDecision | null,
          reason: reason as OfferReason | null
        });
      }
      // Require exact native canonical encoding: duplicate keys, aliases,
      // added fields or arbitrary input JSON cannot be silently accepted.
      const canonical = JSON.stringify({
        kind: 'woonpoints-private-offer-decisions',
        version: 1,
        cases: rows
      }, null, 2);
      if (raw.trimEnd() !== canonical) return null;
      return rows;
    } catch {
      return null;
    }
  }

  function saveLocal(content: string) {
    if (!shownBackup || content !== shownBackup) return;
    const url = URL.createObjectURL(new Blob([content], {
      type: 'application/json;charset=utf-8'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-mijn-voorlopige-keuzes-prive.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPreview(null);
  }
  async function chooseFile(file: File | undefined) {
    const currentRead = ++generation.current;
    setPending(null);
    setPreview(null);
    setMessage('');
    if (!file) return;
    if (file.size > 4096 || file.size < 40) {
      setMessage('Bestand afgewezen: maximaal 4 KiB in het exacte privékeuzeformaat.');
      return;
    }
    const readFor = source;
    let raw = '';
    try { raw = await file.text(); } catch {
      if (currentRead === generation.current) setMessage('Bestand lezen mislukt.');
      return;
    }
    if (currentRead !== generation.current) return;
    const rows = decodeDecisionBackup(raw);
    if (!rows) {
      setMessage('Bestand afgewezen: ongeldig, onvolledig of geen exacte werkblad-ID-overeenkomst.');
      return;
    }
    setPending({rows, source: readFor});
    setMessage('Exacte privékeuzes ingelezen. Bekijk ze eerst en bevestig afzonderlijk.');
  }
  const decisionLabel = (stage: OfferDecision | null) =>
    offerDecisionStages.find(item => item.value === stage)?.label || 'Nog geen keuze';
  const reasonLabel = (reason: OfferReason | null) =>
    offerDecisionReasons.find(item => item.value === reason)?.label || 'Geen reden';

  return <section style={{ borderTop: '1px solid #dbe6dd',
    marginTop: 20, paddingTop: 15 }} aria-label="Privékeuzes bewaren en herstellen">
    <h3>Mijn voorlopige keuzes zelf bewaren of terugzetten</h3>
    <p>De officiële aanbodcheck-JSON bevat deze informele keuzes niet.
      Alleen als je bewust deze <em>aparte</em> privékeuze-JSON bewaart,
      kun je dezelfde keuze later in de bijbehorende werkbladen terugzetten.
      Geen namen, adressen, bedragen of antwoorden; een eigen opslaglocatie
      kan wel extern synchroniseren.</p>
    <button type="button" onClick={() =>
      setPreview(shownBackup ? null : {source: rawBackup, content: rawBackup})}
      style={{ minHeight: 44, padding: '8px 12px' }}>
      {shownBackup ? 'Sluit JSON-voorbeeld' : 'Bekijk exacte privékeuze-JSON'}
    </button>
    {shownBackup && <div>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
        maxHeight: 220, overflow: 'auto', padding: 12, background: '#f3f6f3' }}>
        {shownBackup}
      </pre>
      <button type="button" onClick={() => saveLocal(shownBackup)}
        style={{ minHeight: 44, padding: '8px 12px' }}>
        Download deze bekeken privékeuzes
      </button>
    </div>}
    <label htmlFor="offer-decision-private-import"
      style={{ display: 'block', fontWeight: 700, marginTop: 16 }}>
      Kies uitsluitend je eerdere privékeuzebestand (max. 4 KiB)
    </label>
    <input id="offer-decision-private-import" type="file" accept=".json,application/json"
      onChange={event => {
        const file = event.target.files?.[0];
        void chooseFile(file);
        event.target.value = '';
      }} style={{ display: 'block', margin: '8px 0', maxWidth: '100%' }} />
    {message && <p role="status">{message}</p>}
    {shownImport && <div role="group" aria-label="Privékeuzes herstellen">
      <p>Herstellen vervangt <strong>uitsluitend de voorlopige keuze en algemene reden</strong>
        van dezelfde huidige werkbladnummers. Alle veiligheidsantwoorden, datums
        en financiële informatie blijven intact. Verkeerde of ontbrekende IDs zijn geweigerd.</p>
      <ul>{shownImport.map(row => <li key={row.id}>
        Voorstel {row.id}: {decisionLabel(row.stage)} · {reasonLabel(row.reason)}
      </li>)}</ul>
      <button type="button" onClick={() => {
        if (!shownImport || pending?.source !== source) return;
        generation.current++;
        onRestore(shownImport);
        setPending(null);
        setMessage('Eigen voorlopige keuzes bewust overgenomen.');
      }} style={{ minHeight: 44, padding: '8px 12px' }}>
        Ja, neem uitsluitend deze privékeuzes over
      </button>
      <button type="button" onClick={() => {
        generation.current++;
        setPending(null);
        setMessage('Import geannuleerd. Niets gewijzigd.');
      }} style={{ minHeight: 44, padding: '8px 12px', marginLeft: 8 }}>
        Annuleer
      </button>
    </div>}
  </section>;
}


function PrivateOfferDecisionDesk({
  cases, signals, onUpdate, onSelect, onRestore
}: {
  cases: readonly Workblad[];
  signals: readonly Signal[];
  onUpdate: (caseId: number, stage: OfferDecision | undefined,
    reason: OfferReason | undefined) => void;
  onSelect: (caseId: number) => void;
  onRestore: (rows: readonly PrivateDecisionBackupRow[]) => void;
}) {
  const [preview, setPreview] = useState<{source: string; text: string} | null>(null);
  const count = cases.filter(item => item.decision !== undefined).length;
  const report = [
    'WOONPOINTS · MIJN EIGEN BESLUITVOORBEREIDING',
    'Alleen mijn eigen lokale keuzes; geen contract-, woning- of verhuurderverificatie.',
    'Geen keuze in deze lijst verleent toestemming voor betaling of een woonactie.',
    '',
    ...cases.flatMap(item => {
      const urgent = signals.filter(signal =>
        signal.severity === 'urgent' && item.answers[signal.id] === 'yes').length;
      const missing = signals.filter(signal => !item.answers[signal.id]).length;
      return [
        'Voorstel ' + item.id,
        'Mijn voorlopige keuze: ' + (offerDecisionStages.find(stage =>
          stage.value === item.decision)?.label || 'Nog niet gekozen'),
        'Eigen aandachtspunt: ' + (offerDecisionReasons.find(reason =>
          reason.value === item.decisionReason)?.label || 'Niet ingevuld'),
        'Urgent zelf gemeld: ' + urgent + ' · vragen nog open: ' + missing,
        'Geen officiële toets: controleer echte identiteit, voorwaarden en gegevens onafhankelijk.',
        ''
      ];
    })
  ].join('\n');
  const visiblePreview = preview?.source === report ? preview.text : null;
  function download() {
    if (!visiblePreview) return;
    const url = URL.createObjectURL(new Blob([visiblePreview], {
      type: 'text/plain;charset=utf-8'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-mijn-besluitvoorbereiding-prive.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPreview(null);
  }
  return <section className="card" aria-label="Mijn voorlopige keuze per voorstel"
    style={{ marginTop: 24 }}>
    <h2 style={{ fontSize: 24 }}>Mijn eigen besluitvoorbereiding</h2>
    <p>Geef elk van je voorstellen een voorlopige, persoonlijke vervolgrichting:
      verder onderzoeken, parkeren of zelf ervan afzien. Leg desgewenst één
      algemene reden vast, zonder namen, adressen, bedragen of documenten.
      Dit is géén acceptatie, afwijzing namens een aanbieder of fraudetoets.</p>
    <p aria-live="polite" role="status">
      <strong>{count} van {cases.length} voorlopige keuzes ingevuld.</strong>
      {' '}Alle keuzes blijven uitsluitend tijdens deze browsersessie zichtbaar.
    </p>
    <div style={{ display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
      {cases.map(item => {
        const urgent = signals.filter(signal =>
          signal.severity === 'urgent' && item.answers[signal.id] === 'yes').length;
        return <div key={item.id} style={{
          border: '1px solid #dbe6dd', borderRadius: 10, padding: 12 }}>
          <h3 style={{ marginTop: 0 }}>Voorstel {item.id}</h3>
          {urgent > 0 && <p role="status"><strong>{urgent} urgent zelf gemeld.</strong>
            {' '}Ga niet verder met betalen, tekenen of delen van gegevens
            zonder onafhankelijke controle.</p>}
          <label htmlFor={'offer-stage-' + item.id} style={{ display: 'block',
            fontWeight: 700 }}>Mijn voorlopige keuze</label>
          <select id={'offer-stage-' + item.id} value={item.decision || ''}
            onChange={event => {
              const stage = offerDecisionStages.find(choice =>
                choice.value === event.target.value)?.value;
              onUpdate(item.id, stage, stage ? item.decisionReason : undefined);
              setPreview(null);
            }} style={{ width: '100%', minHeight: 44, margin: '7px 0 12px' }}>
            <option value="">Nog geen keuze</option>
            {offerDecisionStages.map(stage => <option key={stage.value}
              value={stage.value}>{stage.label}</option>)}
          </select>
          <label htmlFor={'offer-reason-' + item.id} style={{ display: 'block',
            fontWeight: 700 }}>Mijn algemene reden (optioneel)</label>
          <select id={'offer-reason-' + item.id} value={item.decisionReason || ''}
            disabled={!item.decision} onChange={event => {
              const reason = offerDecisionReasons.find(choice =>
                choice.value === event.target.value)?.value;
              onUpdate(item.id, item.decision, reason);
              setPreview(null);
            }} style={{ width: '100%', minHeight: 44, margin: '7px 0 12px' }}>
            <option value="">Geen reden vastgelegd</option>
            {offerDecisionReasons.map(reason => <option key={reason.value}
              value={reason.value}>{reason.label}</option>)}
          </select>
          <button type="button" style={{ minHeight: 44, padding: '7px 12px' }}
            onClick={() => {
              onSelect(item.id);
              document.getElementById('offer-workbladen')?.scrollIntoView({
                behavior: 'smooth', block: 'start'
              });
            }}>
            Open de oorspronkelijke aanbodcheck
          </button>
        </div>;
      })}
    </div>
    <h3>Optionele privé-samenvatting</h3>
    <p>Bekijk de hele tekst vóór downloaden. Een gekozen bestandslocatie
      of eigen cloudmap kan buiten Woonpoints synchroniseren.
      De JSON-back-up van de veiligheidsvragen bevat deze keuzes niet.</p>
    <button type="button" onClick={() =>
      setPreview(visiblePreview ? null : {source: report, text: report})}
      style={{ minHeight: 44, padding: '8px 12px' }}>
      {visiblePreview ? 'Sluit beslisvoorbeeld' : 'Bekijk complete privé-samenvatting'}
    </button>
    {visiblePreview && <div>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
        maxHeight: 280, overflow: 'auto', padding: 12, background: '#f3f6f3' }}>
        {visiblePreview}
      </pre>
      <button type="button" onClick={download}
        style={{ minHeight: 44, padding: '8px 12px' }}>
        Download deze bekeken privésamenvatting
      </button>
    </div>}
    <PrivateOfferDecisionBackup cases={cases} onRestore={onRestore} />
  </section>;
}

function PrivateOfferQuestionDraft({
  cases, signals
}: {
  cases: readonly Workblad[];
  signals: readonly Signal[];
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [excluded, setExcluded] = useState<readonly string[]>([]);
  const [preview, setPreview] = useState<{source: string; text: string} | null>(null);
  const [message, setMessage] = useState('');
  const current = cases.find(item => item.id === selectedId) || cases[0];
  if (!current) return null;
  const candidates = signals.filter(signal => current.answers[signal.id] !== 'no');
  const included = candidates.filter(signal =>
    !excluded.includes(current.id + ':' + signal.id));
  const topic = (signal: Signal) => offerSafetyRentalQuestions[signal.id] || signal.question;
  const report = [
    'MIJN VRAAGVOORBEREIDING · Woningaanbodcheck',
    'Eigen concept voor een onafhankelijk bevestigd officieel contactkanaal.',
    'Er zijn geen persoonsgegevens of documenten aan dit concept toegevoegd.',
    '',
    'Goedendag,',
    '',
    'Ik wil de aangeboden woning en de voorwaarden zelf zorgvuldig beoordelen.',
    'Kunt u onderstaande punten schriftelijk toelichten?',
    '',
    ...included.map((signal, index) =>
      (index + 1) + '. ' + topic(signal)),
    '',
    'Ik controleer uw identiteit en dit aanbod onafhankelijk via een officieel kanaal.',
    'Dit concept is geen toezegging, betaling of akkoord.',
    '',
    'Met vriendelijke groet'
  ].join('\n');
  const shown = preview?.source === report ? preview.text : null;
  function download() {
    if (!shown || !included.length) return;
    const url = URL.createObjectURL(new Blob([shown], {
      type: 'text/plain;charset=utf-8'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-eigen-vragen-voorstel-' + current.id + '.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPreview(null);
    setMessage('Je eigen vraagconcept is lokaal gedownload. Er is niets verstuurd.');
  }
  return <section className="card" style={{ marginTop: 24 }}
    aria-label="Mijn eigen vragen over een woningvoorstel voorbereiden">
    <h2 style={{ fontSize: 24 }}>Vragen voor een officieel contactmoment</h2>
    <p>Maak uit zelf gemelde, onbekende en nog niet ingevulde onderwerpen
      een neutraal vragenconcept. Je kiest zelf wat je wilt vragen, bekijkt
      de tekst eerst en neemt die vervolgens alleen op eigen initiatief mee.
      Woonpoints zoekt geen ontvanger, verstuurt niets en controleert geen identiteit.</p>
    <p><strong>Bij urgent gemelde signalen:</strong> geen betaling, documenten of codes
      delen voordat je de betrokken partij en voorwaarden onafhankelijk hebt bevestigd.</p>
    <label htmlFor="offer-questions-selected-case"
      style={{ display: 'block', fontWeight: 700 }}>Mijn werkblad</label>
    <select id="offer-questions-selected-case" value={current.id}
      onChange={event => {
        setSelectedId(Number(event.target.value));
        setPreview(null);
        setMessage('');
      }} style={{ display: 'block', width: '100%', maxWidth: 350,
        margin: '8px 0 16px', minHeight: 44 }}>
      {cases.map(item => <option key={item.id} value={item.id}>
        Voorstel {item.id}
      </option>)}
    </select>
    <p aria-live="polite">{candidates.length} mogelijke vragen,
      {' '}{included.length} door jou geselecteerd. Antwoord ‘Nee’ wordt
      niet als open vraag toegevoegd.</p>
    {candidates.length === 0 ? <p>Je hebt alle risico-onderwerpen met
      ‘Nee’ beantwoord. Dit bevestigt niet dat het aanbod veilig is.
      Controleer de officiële informatie nog steeds zelfstandig.</p>
    : <div style={{ display: 'grid', gap: 9 }}>
      {candidates.map(signal => {
        const id = current.id + ':' + signal.id;
        const checked = !excluded.includes(id);
        const answer = current.answers[signal.id];
        return <label key={signal.id} style={{ display: 'flex', gap: 10,
          padding: 12, border: '1px solid #dbe6dd', borderRadius: 9,
          minHeight: 44, alignItems: 'flex-start' }}>
          <input type="checkbox" checked={checked}
            onChange={() => {
              setExcluded(old => checked ? [...old, id] :
                old.filter(item => item !== id));
              setPreview(null);
              setMessage('');
            }} style={{ marginTop: 5 }} />
          <span><strong>{topic(signal)}</strong><br />
            <small>{signal.group} · {answer === 'yes'
              ? 'Zelf gemeld' : answer === 'unknown'
                ? 'Nog onbekend' : 'Nog niet ingevuld'}</small></span>
        </label>;
      })}
    </div>}
    <p style={{ marginTop: 14 }}>Het concept bevat alleen vaste, algemene
      controlevragen. Voeg vóór gebruik zelf de juiste context toe nadat je
      de officiële contactgegevens onafhankelijk hebt bevestigd. Een opgeslagen
      TXT kan buiten Woonpoints synchroniseren.</p>
    <button type="button" disabled={!included.length}
      onClick={() => { setPreview(shown ? null : {source: report, text: report});
        setMessage(''); }}
      style={{ minHeight: 44, padding: '8px 12px' }}>
      {shown ? 'Sluit mijn vragenconcept' : 'Bekijk mijn vragenconcept'}
    </button>
    {shown && <div>
      <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
        maxHeight: 290, overflow: 'auto', background: '#f3f6f3',
        padding: 13, borderRadius: 9 }}>{shown}</pre>
      <button type="button" onClick={download}
        style={{ minHeight: 44, padding: '8px 12px' }}>
        Download precies deze bekeken vragen
      </button>
    </div>}
    {message && <p role="status">{message}</p>}
  </section>;
}


function PrivateOfferActionBoard({
  cases, signals, onSelect, onToggle, onSetDate
}: {
  cases: readonly Workblad[];
  signals: readonly Signal[];
  onSelect: (id: number) => void;
  onToggle: (caseId: number, signalId: string) => void;
  onSetDate: (caseId: number, date: string | undefined) => void;
}) {
  const [includeReviewed, setIncludeReviewed] = useState(false);
  const [priorityView, setPriorityView] = useState<'all'|'urgent'|'unknown'|'unanswered'|'due'>('all');
  const [preview, setPreview] = useState(false);
  const [calendarPreview, setCalendarPreview] = useState<number | null>(null);
  const [bundlePreview, setBundlePreview] = useState<{source: string; text: string} | null>(null);
  const actions = useMemo<Action[]>(() => cases.flatMap(item =>
    signals.flatMap(signal => {
      const answer = item.answers[signal.id];
      if (answer === 'no') return [];
      return [{
        caseId: item.id,
        signal,
        answer,
        reviewed: (answer === 'yes' || answer === 'unknown') &&
          item.reviewed[signal.id] === true
      }];
    })
  ), [cases, signals]);
  const pending = actions.filter(action => !action.reviewed);
  const urgent = pending.filter(action =>
    action.answer === 'yes' && action.signal.severity === 'urgent').length;
  const unknown = pending.filter(action => action.answer === 'unknown').length;
  const missing = pending.filter(action => !action.answer).length;
  const localNow = new Date();
  const todayKey = [localNow.getFullYear(),
    String(localNow.getMonth() + 1).padStart(2, '0'),
    String(localNow.getDate()).padStart(2, '0')].join('-');
  const dueCases = new Set(cases.filter(item =>
    item.reviewDate && item.reviewDate <= todayKey).map(item => item.id));
  const dueActionCount = pending.filter(action => dueCases.has(action.caseId)).length;
  // Never hide urgent self-reported signals below "no" answers. This is
  // navigation order, not a risk score or verified property ranking.
  const severityOrder = (action: Action) =>
    action.answer === 'yes' && action.signal.severity === 'urgent' ? 0 :
    action.answer === 'yes' ? 1 : action.answer === 'unknown' ? 2 : 3;
  const visible = (includeReviewed ? actions : pending).filter(action =>
    priorityView === 'all' ||
    (priorityView === 'urgent' && action.answer === 'yes' &&
      action.signal.severity === 'urgent') ||
    (priorityView === 'unknown' && action.answer === 'unknown') ||
    (priorityView === 'unanswered' && !action.answer) ||
    (priorityView === 'due' && dueCases.has(action.caseId))
  ).sort((left, right) => {
    const bySeverity = severityOrder(left) - severityOrder(right);
    if (bySeverity !== 0) return bySeverity;
    const leftDate = cases.find(item => item.id === left.caseId)?.reviewDate || '9999-12-31';
    const rightDate = cases.find(item => item.id === right.caseId)?.reviewDate || '9999-12-31';
    return leftDate.localeCompare(rightDate) ||
      left.caseId - right.caseId ||
      signals.findIndex(s => s.id === left.signal.id) -
      signals.findIndex(s => s.id === right.signal.id);
  });
  const validDay = (date?: string) => {
    if (!date || !/^20[0-9]{2}-[0-9]{2}-[0-9]{2}$/.test(date)) return false;
    const parsed = new Date(date + 'T12:00:00Z');
    return !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date;
  };
  // Export only operator-selected anonymous calendar events, never case answers.
  // Shared UID contract also prevents silently inventing different appointments
  // between single-event and multi-event downloads for the same date/case.
  function calendarEvent(item: Workblad): string[] {
    const date = item.reviewDate;
    if (!validDay(date)) return [];
    const start = date!.replace(/-/g, '');
    const next = new Date(Date.parse(date! + 'T12:00:00Z') + 86_400_000);
    const end = next.toISOString().slice(0, 10).replace(/-/g, '');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return [
      'BEGIN:VEVENT', 'UID:woonpoints-private-' + item.id + '-' + start + '@local',
      'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + start,
      'DTEND;VALUE=DATE:' + end, 'SUMMARY:Woonpoints eigen voorstel ' + item.id + ' nalopen',
      'DESCRIPTION:Zelf controles nalopen. Geen externe verificatie of automatische reactie.',
      'END:VEVENT'
    ];
  }
  function calendarExport(items: readonly Workblad[]): string | null {
    const events = items.flatMap(calendarEvent);
    if (!events.length) return null;
    return [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Woonpoints//Private Offer Planning//NL',
      ...events, 'END:VCALENDAR', ''
    ].join('\r\n');
  }
  const scheduledCases = cases.filter(item => validDay(item.reviewDate));
  const calendarSource = scheduledCases.map(item =>
    item.id + ':' + item.reviewDate).join('|');
  const viewedBundle = bundlePreview?.source === calendarSource ? bundlePreview.text : null;
  function privateCalendar(item: Workblad): string | null {
    return calendarExport([item]);
  }
  const report = [
    'WOONPOINTS · PRIVÉ VERVOLGACTIES',
    'Zelf ingevuld op ' + new Date().toLocaleDateString('nl-NL'),
    'Dit is geen verificatie van een aanbieder, woning, identiteit of betaalverzoek.',
    'Afvinken betekent alleen dat je een stap zelf hebt nagelopen; het signaal verdwijnt niet.',
    '',
    ...pending.slice().sort((a,b) => severityOrder(a)-severityOrder(b))
      .map(action => [
      'Voorstel ' + action.caseId + ' · ' + action.signal.group,
      (action.answer === 'yes' ? 'Zelf gemeld' : action.answer === 'unknown' ?
        'Nog onbekend' : 'Nog niet beantwoord') +
        (action.answer === 'yes' && action.signal.severity === 'urgent' ? ' · URGENT' : ''),
      'Vraag: ' + action.signal.question,
      'Vervolg: ' + (action.answer === 'yes' ? action.signal.next :
        'Zoek onafhankelijke informatie en vul dit werkblad zelf aan.'),
      ''
    ].join('\n'))
  ].join('\n');

  function downloadCalendarText(content: string, filename: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadCalendar(item: Workblad) {
    const content = privateCalendar(item);
    if (!content || calendarPreview !== item.id) return;
    downloadCalendarText(content,
      'woonpoints-voorstel-' + item.id + '-eigen-herinnering.ics');
    setCalendarPreview(null);
  }
  function downloadCalendarBundle() {
    if (!viewedBundle || scheduledCases.length < 2) return;
    downloadCalendarText(viewedBundle, 'woonpoints-eigen-controledagen.ics');
    setBundlePreview(null);
  }

  function openQuestion(action: Action) {
    onSelect(action.caseId);
    window.requestAnimationFrame(() => {
      document.getElementById('offer-question-' + action.signal.id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function download() {
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-open-vervolgacties-prive.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPreview(false);
  }

  return <section className="card" aria-label="Privé vervolgacties voor alle voorstellen"
    style={{ marginTop: 24 }}>
    <h2 style={{ fontSize: 24 }}>Mijn open vervolgacties · alle voorstellen</h2>
    <p>Werk de zelf gemelde en onbekende signalen per voorstel af zonder tussen
      werkbladen te zoeken. Vragen die je nog niet hebt ingevuld blijven zichtbaar.
      Er wordt niets verzonden, opgeslagen of gecontroleerd bij een derde partij.</p>
    <p aria-live="polite" role="status">
      <strong>{pending.length} open aandachtspunten</strong> · {urgent} urgente
      zelf gemelde signalen · {unknown} onbekend · {missing} onbeantwoord.
    </p>
    <p style={{ fontSize: 14 }}>Dit is géén veilige-aanbiedingenranglijst.
      Een afgevinkte stap bevestigt geen identiteit, overeenkomst of betaling.
      Bij een urgent signaal: stop en controleer onafhankelijk voordat je doorgaat.</p>
    <h3>Zelf een vervolgdatum kiezen (optioneel)</h3>
    <p>Per werkblad kun je handmatig een controledag kiezen en pas na een preview
      een anonieme agenda-afspraak downloaden. Geen automatische herinnering,
      synchronisatie of providercontrole. Agendadiensten kunnen jouw eigen
      import buiten dit tabblad bewaren.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
      {cases.map(item => <div key={item.id}
        style={{ border: '1px solid #dbe6dd', borderRadius: 10, padding: 12 }}>
        <label style={{ display: 'block', fontWeight: 700 }} htmlFor={'offer-review-date-' + item.id}>
          Voorstel {item.id} · eigen controledatum
        </label>
        <input id={'offer-review-date-' + item.id} type="date"
          min="2000-01-01" max="2099-12-31" value={item.reviewDate || ''}
          onChange={event => {
            onSetDate(item.id, event.target.value || undefined);
            setCalendarPreview(null);
            setBundlePreview(null);
          }} style={{ display: 'block', minHeight: 44, margin: '8px 0', maxWidth: '100%' }} />
        {validDay(item.reviewDate) && <p role="status">
          {item.reviewDate! < todayKey ? 'Gekozen controledatum is voorbij (geen automatische melding).' :
            item.reviewDate === todayKey ? 'Eigen controledag is vandaag.' :
            'Controledatum voor jezelf gekozen.'}
        </p>}
        {validDay(item.reviewDate) && <button type="button"
          onClick={() => setCalendarPreview(calendarPreview === item.id ? null : item.id)}
          style={{ minHeight: 44, padding: '8px 12px' }}>
          {calendarPreview === item.id ? 'Sluit agenda-voorbeeld' : 'Bekijk anonieme agenda-afspraak'}
        </button>}
        {calendarPreview === item.id && validDay(item.reviewDate) && <div>
          <p>Dit agenda-bestand bevat alléén de datum, het nummer
            van dit werkblad en de algemene omschrijving. Geen antwoorden,
            bedragen of contactgegevens.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
            maxHeight: 170, overflow: 'auto' }}>{privateCalendar(item)}</pre>
          <button type="button" onClick={() => downloadCalendar(item)}
            style={{ minHeight: 44, padding: '8px 12px' }}>Download bekeken .ics</button>
        </div>}
      </div>)}
    </div>
    <h3>Mijn aandachtspunten prioriteren</h3>
    <p>Alle signalen blijven beschikbaar. Een urgent zelf gemeld signaal staat vooraan,
      maar deze ordening is géén objectieve fraude- of verhuurrisicobeoordeling.</p>
    <div role="group" aria-label="Filter mijn open vervolgacties"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0' }}>
      {([
        ['all', 'Alle aandachtspunten', actions.length],
        ['urgent', 'Urgent zelf gemeld', urgent],
        ['unknown', 'Nog onbekend', unknown],
        ['unanswered', 'Niet ingevuld', missing],
        ['due', 'Controledatum bereikt', dueActionCount]
      ] as const).map(([key,label,count]) => <button type="button"
        key={key} aria-pressed={priorityView === key}
        onClick={() => setPriorityView(key)}
        style={{ minHeight: 44, border: '1px solid #355e42',
          background: priorityView === key ? '#355e42' : 'white',
          color: priorityView === key ? 'white' : '#355e42',
          borderRadius: 9, padding: '8px 12px' }}>
        {label} ({count})
      </button>)}
    </div>
    {scheduledCases.length > 1 && <div
      style={{ borderTop: '1px solid #dbe6dd', marginTop: 18, paddingTop: 15 }}>
      <h3>Alle eigen controledagen in één agenda-bestand</h3>
      <p>{scheduledCases.length} werkbladen hebben een zelf gekozen dag. Bekijk
        eerst alle kalenderregels en download ze daarna bewust. Een externe
        agenda-app kan dit bestand verder synchroniseren; Woonpoints doet dat niet.</p>
      <button type="button" onClick={() =>
        setBundlePreview(viewedBundle ? null : {
          source: calendarSource, text: calendarExport(scheduledCases) || ''
        })}
        style={{ minHeight: 44, padding: '8px 12px' }}>
        {viewedBundle ? 'Sluit compleet agenda-voorbeeld' :
          'Bekijk alle anonieme agenda-afspraken'}
      </button>
      {viewedBundle && <div>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
          maxHeight: 260, overflow: 'auto', marginTop: 12 }}>{viewedBundle}</pre>
        <button type="button" onClick={downloadCalendarBundle}
          style={{ minHeight: 44, padding: '8px 12px' }}>
          Download precies deze gecontroleerde .ics
        </button>
      </div>}
    </div>}
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
      <input type="checkbox" checked={includeReviewed}
        onChange={event => setIncludeReviewed(event.target.checked)} />
      Toon ook zelf nagelopen vervolgstappen
    </label>
    <p aria-live="polite">Je bekijkt {visible.length} aandachtspunten in deze selectie.
      Dit verandert geen antwoorden, datums of originele bewijsgegevens.</p>
    {visible.length === 0
      ? <p>Geen acties in deze weergave. Ook zonder signalen blijft onafhankelijke
          controle van een echt aanbod noodzakelijk.</p>
      : <ol style={{ paddingLeft: 24 }}>
        {visible.map(action => <li key={action.caseId + ':' + action.signal.id}
          style={{ padding: '10px 0', borderBottom: '1px solid #e5ece7' }}>
          <strong>Voorstel {action.caseId}</strong> · {action.signal.group}
          {action.answer === 'yes' && action.signal.severity === 'urgent' &&
            <strong> · Urgent zelf gemeld</strong>}
          <div style={{ margin: '6px 0' }}>{action.signal.question}</div>
          <p style={{ margin: '5px 0' }}>
            {action.answer === 'yes' ? action.signal.next :
              action.answer === 'unknown'
                ? 'Nog onbekend: verzamel onafhankelijke informatie.'
                : 'Nog niet ingevuld: beantwoord de vraag in dit werkblad.'}
          </p>
          {action.answer === 'yes' || action.answer === 'unknown' ? <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44,
              marginRight: 14 }}>
            <input type="checkbox" checked={action.reviewed}
              onChange={() => onToggle(action.caseId, action.signal.id)} />
            Zelf nagekeken (geen verificatie)
          </label> : null}
          <button type="button" onClick={() => openQuestion(action)}
            style={{ minHeight: 44, padding: '7px 12px' }}>
            Open vraag in voorstel {action.caseId}
          </button>
        </li>)}
      </ol>}
    <div style={{ borderTop: '1px solid #dbe6dd', paddingTop: 14 }}>
      <h3>Vrijwillige privé-actielijst</h3>
      <p>Bekijk de exacte inhoud vóór je de open acties als TXT downloadt.
        Een gekozen downloadlocatie kan buiten deze browser synchroniseren.
        Geen adressen, huurprijzen, documenten of gekoppelde financiële momentopnames.</p>
      <button type="button" onClick={() => setPreview(value => !value)}
        style={{ minHeight: 44, padding: '9px 14px' }}>
        {preview ? 'Sluit voorbeeld' : 'Bekijk mijn open actielijst'}
      </button>
      {preview && <div>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
          maxHeight: 300, overflow: 'auto', padding: 14, background: '#f3f6f3' }}>
          {report}
        </pre>
        <button type="button" onClick={download}
          style={{ minHeight: 44, padding: '9px 14px' }}>
          Download deze bekeken actielijst
        </button>
      </div>}
    </div>
  </section>;
}


function PrivateOfferSafety({onPrepareRentalQuestions,rentalDecisionProposal,
  acceptedRentalDecision,onAcceptRentalDecision,onClearRentalProposal,onClearRentalDecision}: {
  onPrepareRentalQuestions?: (questions: string) => void;
  rentalDecisionProposal?: PrivateRentalDecisionSnapshot|null;
  acceptedRentalDecision?: {caseId:number;offer:PrivateRentalDecisionSnapshot}|null;
  onAcceptRentalDecision?: (value:{caseId:number;offer:PrivateRentalDecisionSnapshot})=>void;
  onClearRentalProposal?:()=>void;
  onClearRentalDecision?:()=>void
} = {}) {
  const [caseItems, setCaseItems] = useState<OfferSafetyCase[]>([{ id: 1, answers: {}, reviewed: {} }]);
  const [currentCaseId, setCurrentCaseId] = useState(1);
  const [preview, setPreview] = useState(false);
  const [allPreview, setAllPreview] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [backupPreview, setBackupPreview] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<OfferSafetyCase[] | null>(null);
  const [backupMessage, setBackupMessage] = useState('');
  const [undoBackup, setUndoBackup] = useState<{ cases: OfferSafetyCase[]; selected: number } | null>(null);
  // Invalidate incomplete File.text() promises when the user changes this workmap
  // or chooses another import. Never replace newer user edits with stale previews.
  const backupReadGeneration = useRef(0);

  const currentCase = caseItems.find(item => item.id === currentCaseId) ?? caseItems[0];
  const answers = currentCase.answers;
  const reviewed = currentCase.reviewed;
  const caseLabel = (id: number) => 'Voorstel ' + id;
  const today = new Date().toLocaleDateString('nl-NL');
  const combinedReport = caseItems.map(item =>
    offerSafetyExport(item.answers, today, item.reviewed, caseLabel(item.id))
  ).join('\n\n' + '='.repeat(46) + '\n\n');

  function updateCurrentCase(change: (current: OfferSafetyCase) => OfferSafetyCase) {
    backupReadGeneration.current++;
    setCaseItems(current => current.map(item => item.id === currentCaseId ? change(item) : item));
    setUndoBackup(null);
    setPendingBackup(null);
    setBackupPreview(false);
    setBackupMessage('');
  }
  function toggleCaseReview(caseId: number, signalId: string) {
    // An action in another workblad is still an edit of the same private workbook.
    // Invalidate any pending asynchronous import and its one-time undo receipt.
    backupReadGeneration.current++;
    setCaseItems(current => current.map(item => {
      if (item.id !== caseId ||
        (item.answers[signalId] !== 'yes' && item.answers[signalId] !== 'unknown'))
        return item;
      return { ...item, reviewed: {
        ...item.reviewed, [signalId]: !item.reviewed[signalId]
      } };
    }));
    setUndoBackup(null); setPendingBackup(null);
    setBackupPreview(false); setBackupMessage('');
    setPreview(false); setAllPreview(false); setFinancialPreview(false);
  }
  function selectCase(id: number) {
    if (!caseItems.some(item => item.id === id)) return;
    setFinancialPreview(false);
    setCurrentCaseId(id);
    setPreview(false); setAllPreview(false); setConfirmReset(false); setConfirmDelete(false);
  }
  function addCase() {
    if (caseItems.length >= MAX_OFFER_SAFETY_CASES) return;
    backupReadGeneration.current++;
    // Imported workbooks may contain large safe IDs; reserve a fresh small ID
    // rather than overflowing the versioned backup's integer admission bound.
    let id = 1;
    while (caseItems.some(item => item.id === id)) id++;
    setCaseItems(current => [...current, { id, answers: {}, reviewed: {} }]);
    setUndoBackup(null); setPendingBackup(null); setBackupPreview(false); setBackupMessage('');
    setCurrentCaseId(id);
    setPreview(false); setAllPreview(false); setConfirmReset(false); setConfirmDelete(false);
  }
  function deleteCase() {
    if (caseItems.length <= 1) return;
    backupReadGeneration.current++;
    onClearRentalDecision?.();
    setFinancialPreview(false);
    const next = caseItems.filter(item => item.id !== currentCaseId);
    setCaseItems(next);
    setUndoBackup(null); setPendingBackup(null); setBackupPreview(false); setBackupMessage('');
    setCurrentCaseId(next[0].id);
    setPreview(false); setAllPreview(false); setConfirmReset(false); setConfirmDelete(false);
  }

  const findings = useMemo(() => {
    const flagged = offerSignals.filter(signal => answers[signal.id] === 'yes');
    const unknown = offerSignals.filter(signal => answers[signal.id] === 'unknown');
    const unanswered = offerSignals.filter(signal => !answers[signal.id]);
    return {
      flagged, unknown, unanswered,
      urgent: flagged.filter(signal => signal.severity === 'urgent'),
      checked: offerSignals.length - unanswered.length
    };
  }, [answers]);
  const reviewActions = [...findings.flagged, ...findings.unknown];
  const suggestedRentalQuestions = reviewActions.map(item =>
    offerSafetyRentalQuestions[item.id]).join('\n');
  const reviewedCount = reviewActions.filter(signal => reviewed[signal.id] === true).length;
  const report = offerSafetyExport(answers, today, reviewed, caseLabel(currentCase.id));
  const portableBackup = offerSafetyBackup(caseItems);
  // A merge never edits an existing workblad, only appends complete imported
  // cases. Conflicting numeric IDs get the first available positive ID.
  const mergePreview = useMemo(() => {
    if (!pendingBackup || caseItems.length + pendingBackup.length > MAX_OFFER_SAFETY_CASES)
      return null;
    const used = new Set(caseItems.map(item => item.id));
    const incoming = pendingBackup.map(item => {
      let targetId = item.id;
      if (used.has(targetId)) {
        targetId = 1;
        while (used.has(targetId)) targetId++;
      }
      used.add(targetId);
      return { sourceId: item.id, targetId, item: {
        id: targetId, answers: { ...item.answers }, reviewed: { ...item.reviewed }
      } as OfferSafetyCase };
    });
    return incoming;
  }, [caseItems, pendingBackup]);
  const acceptedForCase=acceptedRentalDecision?.caseId===currentCase.id
    ? acceptedRentalDecision.offer:null;
  const euros=(cents:number)=>new Intl.NumberFormat('nl-NL',{
    style:'currency',currency:'EUR'
  }).format(cents/100);
  // Export of personal financial data requires a dedicated preview/confirmation.
  // The existing safety TXT and versioned JSON intentionally exclude this snapshot.
  const combinedFinancialReport = acceptedForCase ? [
    report,'','EIGEN FINANCIËLE MOMENTOPNAME — NIET GEVERIFIEERD',
    'Eigen maandlasten: '+euros(acceptedForCase.monthlyCents),
    'Eigen benodigd startgeld: '+euros(acceptedForCase.initialCents),
    'Eigen eerste jaar, excl. terugbetaalbare borg: '+euros(acceptedForCase.firstYearCents),
    'Eigen maandgrens: '+(acceptedForCase.budgetCents===null?'Niet ingevuld':euros(acceptedForCase.budgetCents)),
    'Zelf nagelopen huurvragen: '+acceptedForCase.checked+'/6',
    'Dit is een verouderbare momentopname. Na bewerking van het huurvoorstel opnieuw aanmaken.',
    'Geldbedragen zijn eigen invoer; geen officiële huurprijs, bewijs van betaalbaarheid of geldige aanbieding.'
  ].join('\n'):null;
  const [financialPreview,setFinancialPreview]=useState(false);
  const status = findings.urgent.length > 0
    ? 'Eerst stoppen en onafhankelijk controleren'
    : findings.flagged.length > 0 || findings.unknown.length > 0 || findings.unanswered.length > 0
      ? 'Nog aandachtspunten of ontbrekende informatie'
      : 'Geen signalen door jou gemeld — géén verificatie';

  function setAnswer(id: string, value: OfferAnswer) {
    updateCurrentCase(current => ({
      ...current,
      answers: { ...current.answers, [id]: value },
      reviewed: { ...current.reviewed, [id]: false }
    }));
    setPreview(false); setAllPreview(false); setConfirmReset(false);
  }

  function downloadLocal(content: string, filename: string) {
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPreview(false); setAllPreview(false); setBackupPreview(false);
  }

  async function readOwnBackup(file?: File) {
    const generation = ++backupReadGeneration.current;
    setPendingBackup(null);
    setBackupMessage('');
    setBackupPreview(false);
    if (!file) return;
    if (file.size > MAX_OFFER_SAFETY_BACKUP_BYTES ||
      file.size < 20 || !file.name.toLocaleLowerCase('nl-NL').endsWith('.json')) {
      setBackupMessage('Bestand geweigerd: kies een eigen JSON-back-up tot 10 KiB.');
      return;
    }
    try {
      const raw = await file.text();
      if (generation !== backupReadGeneration.current) return;
      const restored = decodeOfferSafetyBackup(raw);
      if (!restored) {
        setBackupMessage('Bestand geweigerd: schema, versie, vragen of afvinkingen zijn ongeldig.');
        return;
      }
      setPendingBackup(restored);
      setBackupMessage('Eigen bestand gecontroleerd. Niets vervangen totdat je apart bevestigt.');
    } catch {
      if (generation === backupReadGeneration.current)
        setBackupMessage('Bestand kon niet veilig worden gelezen; huidige werkmap ongewijzigd.');
    }
  }

  function applyOwnBackup() {
    if (!pendingBackup) return;
    backupReadGeneration.current++;
    onClearRentalDecision?.();
    setFinancialPreview(false);
    setUndoBackup({ cases: caseItems, selected: currentCaseId });
    setCaseItems(pendingBackup);
    setCurrentCaseId(pendingBackup[0].id);
    setPendingBackup(null);
    setPreview(false); setAllPreview(false); setBackupPreview(false);
    setConfirmReset(false); setConfirmDelete(false);
    setBackupMessage('Eigen werkmap hersteld. Eenmalig terugdraaien mogelijk zolang je niets wijzigt.');
  }

  function mergeOwnBackup() {
    if (!mergePreview || !pendingBackup) return;
    backupReadGeneration.current++;
    onClearRentalDecision?.();
    setFinancialPreview(false);
    setUndoBackup({cases:caseItems, selected:currentCaseId});
    setCaseItems([...caseItems, ...mergePreview.map(entry => entry.item)]);
    setPendingBackup(null);
    setPreview(false); setAllPreview(false); setBackupPreview(false);
    setConfirmReset(false); setConfirmDelete(false);
    setBackupMessage('Werkbladen toegevoegd zonder je bestaande invoer te wijzigen. Eenmalig terugdraaien mogelijk zolang je niets wijzigt.');
  }

  function undoOwnBackup() {
    if (!undoBackup) return;
    backupReadGeneration.current++;
    onClearRentalDecision?.();
    setFinancialPreview(false);
    setCaseItems(undoBackup.cases);
    setCurrentCaseId(undoBackup.selected);
    setUndoBackup(null); setPendingBackup(null); setBackupPreview(false);
    setPreview(false); setAllPreview(false); setConfirmReset(false); setConfirmDelete(false);
    setBackupMessage('Vorige tabbladwerkmap teruggezet.');
  }

  return (
    <section id="private-offer-safety-heading" style={{ maxWidth: 940, paddingTop: 28, margin: '40px auto' }}>
      <a href="#projectstatus-heading" style={{ color: '#075e57', fontWeight: 700 }}>← Terug naar Woonpoints</a>
      <header className="hero">
        <p className="eyebrow" style={{ marginTop: 26 }}>PRIVÉ CONTROLE · GEEN AUTOMATISCHE ACTIES</p>
        <h1 style={{ fontSize: 'clamp(34px, 6vw, 54px)' }}>Woningaanbodcheck</h1>
        <p className="lede">Controleer in drie stappen of je een woningaanbod, bericht of huurvoorstel
          eerst onafhankelijk moet verifiëren. De vragen werken volledig in dit tabblad:
          geen account, opslag, externe aanvraag of WoningNet-reactie.</p>
      </header>

      {(rentalDecisionProposal || acceptedForCase) && <section className="card"
        aria-label="Persoonlijk financieel beslisblad" style={{marginTop:24}}>
        <h2 style={{fontSize:24}}>Mijn eigen huurkosten naast de aanbodcheck</h2>
        {rentalDecisionProposal && <div>
          <p><strong>Voorgestelde momentopname uit Huurvoorstellen:</strong>
            {' '}{rentalDecisionProposal.label}. Het betreft zelf ingevulde bedragen,
            zonder onafhankelijke huurprijs-, verhuurder- of contractcontrole.</p>
          <p>Maandlasten {euros(rentalDecisionProposal.monthlyCents)} ·
            benodigd startgeld {euros(rentalDecisionProposal.initialCents)} ·
            eigen maandgrens {rentalDecisionProposal.budgetCents===null?
              'onbekend':euros(rentalDecisionProposal.budgetCents)}.</p>
          <button type="button" onClick={()=>{
            if(!onAcceptRentalDecision)return;
            onAcceptRentalDecision({caseId:currentCase.id,offer:rentalDecisionProposal});
            setFinancialPreview(false);
            onClearRentalProposal?.();
          }} disabled={!onAcceptRentalDecision} style={{minHeight:44,padding:'9px 14px'}}>
            Koppel deze momentopname aan {caseLabel(currentCase.id)}
          </button>
          <button type="button" onClick={onClearRentalDecision}
            style={{minHeight:44,padding:'9px 14px',marginLeft:8}}>
            Niet overnemen</button>
        </div>}
        {acceptedForCase && <div>
          <p><strong>{caseLabel(currentCase.id)} · eigen financiële momentopname</strong>
            {' '}(bron: {acceptedForCase.label}). Het gaat om je eigen invoer,
            geen officiële financiële toets.</p>
          <dl style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:14}}>
            <div><dt>Geschatte maandlasten</dt><dd><strong>{euros(acceptedForCase.monthlyCents)}</strong></dd></div>
            <div><dt>Benodigd startgeld</dt><dd><strong>{euros(acceptedForCase.initialCents)}</strong></dd></div>
            <div><dt>Eerste jaar excl. borg</dt><dd><strong>{euros(acceptedForCase.firstYearCents)}</strong></dd></div>
            <div><dt>Eigen maandgrens</dt><dd><strong>{acceptedForCase.budgetCents===null?'Niet ingevuld':euros(acceptedForCase.budgetCents)}</strong></dd></div>
          </dl>
          <p role="status">
            {acceptedForCase.budgetCents===null?
              'Geen eigen maandgrens ingesteld: betaalbaarheid niet beoordeeld.':
              acceptedForCase.monthlyCents>acceptedForCase.budgetCents?
                'Boven je zelf ingestelde maandgrens. Onderzoek de woonkosten voor je besluit.':
                'Binnen je eigen maandgrens, maar overige vaste lasten en onverwachte kosten kunnen ontbreken.'}
            {' '}{findings.urgent.length} urgent door jou gemeld,
            {' '}{findings.unknown.length+findings.unanswered.length} onbekend of open.
            De controlevragen en huurkosten zijn onafhankelijk; nul signalen betekent niet dat de aanbieding veilig is.
          </p>
          <button type="button" onClick={()=>setFinancialPreview(value=>!value)}
            style={{minHeight:44,padding:'9px 14px'}}>
            {financialPreview?'Sluit gecombineerd voorbeeld':'Bekijk gecombineerd privéverslag'}
          </button>
          {financialPreview && combinedFinancialReport && <div>
            <p>Dit extra verslag bevat je eigen financiële bedragen. Lees de exacte tekst
              vóór je bewust downloadt; een gekozen opslaglocatie kan elders synchroniseren.</p>
            <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:240,overflow:'auto',
              padding:12,background:'#f3f6f3'}}>{combinedFinancialReport}</pre>
            <button type="button" onClick={()=>downloadLocal(combinedFinancialReport,
              'woonpoints-woonbesluit-prive.txt')}
              style={{minHeight:44,padding:'9px 14px'}}>Download dit bekeken privéverslag</button>
          </div>}
        </div>}
      </section>}
      <section id="offer-workbladen" className="card" aria-label="Mijn afzonderlijke aanbodcontroles" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 24, marginBottom: 12 }}>Mijn eigen voorstellen — {caseItems.length} van {MAX_OFFER_SAFETY_CASES}</h2>
        <p>Vergelijk maximaal vijf afzonderlijke controles naast elkaar. Elk voorstel heeft alleen een
          automatisch nummer: er worden geen woningadressen, verhuurders of contactgegevens gevraagd of bewaard.</p>
        <div role="group" aria-label="Kies een eigen werkblad" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          {caseItems.map(item => <button key={item.id} type="button"
            aria-pressed={currentCase.id === item.id}
            onClick={() => selectCase(item.id)} style={{ minHeight: 44, padding: '8px 12px',
              background: currentCase.id === item.id ? '#355e42' : 'white',
              color: currentCase.id === item.id ? 'white' : '#355e42',
              border: '2px solid #355e42', borderRadius: 9 }}>
            {caseLabel(item.id)} {currentCase.id === item.id ? '· actief' : ''}
          </button>)}
          <button type="button" disabled={caseItems.length >= MAX_OFFER_SAFETY_CASES}
            onClick={addCase} style={{ minHeight: 44, padding: '8px 12px', borderRadius: 9 }}>
            + Nieuw voorstel
          </button>
        </div>
        {caseItems.length > 1 && <div>
          <button type="button" onClick={() => { setConfirmDelete(true); setConfirmReset(false); setPreview(false); setAllPreview(false); }}
            style={{ minHeight: 44, padding: '9px 12px' }}>Verwijder {caseLabel(currentCase.id)}</button>
          {confirmDelete && <div role="group" aria-label="Voorstel verwijderen">
            <p>Dit verwijdert uitsluitend {caseLabel(currentCase.id)} en alle antwoorden en afvinkingen ervan uit
              dit tabblad. Andere voorstellen blijven intact.</p>
            <button type="button" onClick={deleteCase} style={{ minHeight: 44, padding: '9px 12px' }}>Ja, verwijder voorstel</button>
            <button type="button" onClick={() => setConfirmDelete(false)}
              style={{ minHeight: 44, padding: '9px 12px', marginLeft: 8 }}>Annuleren</button>
          </div>}
        </div>}
        <div style={{ overflowX: 'auto', marginTop: 18 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 590, textAlign: 'left' }}>
            <caption style={{ textAlign: 'left', marginBottom: 9 }}>
              Alleen zelf ingevulde signalen. Minder signalen is geen betrouwbaarder woningaanbod.
            </caption>
            <thead><tr>
              {['Werkblad', 'Urgent gemeld', 'Overige gemeld', 'Onbekend', 'Niet ingevuld', 'Zelf nagekeken'].map(label =>
                <th key={label} scope="col" style={{ padding: 8, borderBottom: '1px solid #dce5df' }}>{label}</th>)}
            </tr></thead>
            <tbody>{caseItems.map(item => {
              const yes = offerSignals.filter(signal => item.answers[signal.id] === 'yes');
              const unknown = offerSignals.filter(signal => item.answers[signal.id] === 'unknown');
              const remaining = offerSignals.filter(signal => !item.answers[signal.id]);
              const reviewedActions = [...yes, ...unknown].filter(signal => item.reviewed[signal.id]);
              return <tr key={item.id}>
                <th scope="row" style={{ padding: 8, borderBottom: '1px solid #e7eee9' }}>
                  <button type="button" onClick={() => selectCase(item.id)}
                    style={{ padding: 6, minHeight: 44 }}>{caseLabel(item.id)}</button>
                </th>
                <td style={{ padding: 8 }}>{yes.filter(signal => signal.severity === 'urgent').length}</td>
                <td style={{ padding: 8 }}>{yes.filter(signal => signal.severity !== 'urgent').length}</td>
                <td style={{ padding: 8 }}>{unknown.length}</td>
                <td style={{ padding: 8 }}>{remaining.length}</td>
                <td style={{ padding: 8 }}>{reviewedActions.length}/{yes.length + unknown.length}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>

      <PrivateOfferDecisionDesk cases={caseItems} signals={offerSignals}
        onSelect={selectCase} onRestore={(rows) => {
          const byId = new Map(rows.map(row => [row.id, row]));
          if (rows.length !== caseItems.length ||
            caseItems.some(item => !byId.has(item.id))) return;
          backupReadGeneration.current++;
          setCaseItems(items => items.map(item => {
            const next = byId.get(item.id);
            return next ? { ...item, decision: next.stage ?? undefined,
              decisionReason: next.reason ?? undefined } : item;
          }));
          setUndoBackup(null); setPendingBackup(null);
          setBackupPreview(false); setBackupMessage('');
        }} onUpdate={(id, decision, reason) => {
          backupReadGeneration.current++;
          setCaseItems(items => items.map(item => item.id === id
            ? { ...item, decision, decisionReason: reason } : item));
          setUndoBackup(null); setPendingBackup(null);
          setBackupPreview(false); setBackupMessage('');
        }} />

      <PrivateOfferActionBoard cases={caseItems} signals={offerSignals}
        onSelect={selectCase} onToggle={toggleCaseReview}
        onSetDate={(caseId, date) => {
          backupReadGeneration.current++;
          setCaseItems(items => items.map(item => item.id === caseId
            ? { ...item, reviewDate: date } : item));
          setUndoBackup(null); setPendingBackup(null);
          setBackupPreview(false); setBackupMessage('');
        }} />

      <PrivateOfferQuestionDraft cases={caseItems} signals={offerSignals} />

      <section className="card" aria-label="Resultaatoverzicht" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22 }}>Controle voor {caseLabel(currentCase.id)}</h2>
        <p aria-live="polite" role="status"><strong>{status}</strong></p>
        <p>{findings.checked} van {offerSignals.length} vragen beantwoord · {findings.flagged.length} gemelde signalen ·
          {' '}{findings.unknown.length} onbekend · {findings.unanswered.length} open.</p>
        {findings.urgent.length > 0 && <p><strong>Actie vóór betaling, delen of ondertekening:</strong>
          {' '}ga niet verder op basis van dit bericht alleen. Controleer onafhankelijk de betrokken partij en de voorwaarden.</p>}
        <p style={{ fontSize: 14 }}>Deze zelfcheck controleert géén echt aanbod, identiteit, huurrecht,
          adres, website, bankrekening of documenten. Ook nul signalen is geen bewijs van betrouwbaarheid.</p>
      </section>

      {offerGroups.map((group, index) => <section className="card" key={group} style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 25, marginBottom: 12 }}>{index + 1}. {group}</h2>
        {offerSignals.filter(signal => signal.group === group).map(signal => (
          <fieldset key={signal.id} id={'offer-question-' + signal.id}
            style={{ border: '1px solid #dbe6dd', borderRadius: 12, padding: '12px 14px', margin: '12px 0' }}>
            <legend style={{ fontWeight: 750, padding: '0 5px', maxWidth: '100%' }}>{signal.question}</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
              {(['yes', 'no', 'unknown'] as const).map(value => <label key={value} style={{ display: 'flex', gap: 7, alignItems: 'center', minHeight: 44, cursor: 'pointer' }}>
                <input type="radio" name={'offer-' + signal.id} value={value}
                  checked={answers[signal.id] === value} onChange={() => setAnswer(signal.id, value)} />
                {offerLabels[value]}
              </label>)}
            </div>
            {answers[signal.id] === 'yes' && <div style={{ background: '#fff7e5', borderRadius: 9, padding: 12 }}>
              <p><strong>Waarom controleren?</strong> {signal.why}</p>
              <p><strong>Volgende stap:</strong> {signal.next}</p>
            </div>}
            {answers[signal.id] === 'unknown' && <p style={{ marginBottom: 0 }}>
              Zoek deze informatie eerst via een onafhankelijk, vertrouwd kanaal op.
            </p>}
          </fieldset>
        ))}
      </section>)}

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 25 }}>Jouw concrete vervolg</h2>
        {reviewActions.length > 0 && <p aria-live="polite" role="status">
          <strong>{reviewedCount} van {reviewActions.length} vervolgstappen zelf nagelopen.</strong>
          Afvinken betekent alleen dat je zelf een stap hebt nagekeken, niet dat
          de woning, overeenkomst of afzender betrouwbaar is bevestigd.
        </p>}
        {findings.flagged.length === 0 && findings.unknown.length === 0 && findings.unanswered.length === 0
          ? <p>Je hebt zelf geen van de signalen gemeld. Controleer desondanks de aanbieder, het schriftelijke
              aanbod en de betaalinstructies buiten dit scherm.</p>
          : <ol style={{ lineHeight: 1.7, paddingLeft: 22 }}>
              {reviewActions.map(signal => <li key={signal.id} style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={reviewed[signal.id] === true}
                    aria-label={'Zelf nagelopen: ' + signal.question}
                    onChange={() => {
                      updateCurrentCase(current => ({
                        ...current,
                        reviewed: { ...current.reviewed, [signal.id]: !current.reviewed[signal.id] }
                      }));
                      setPreview(false); setAllPreview(false);
                    }} style={{ marginTop: 7 }} />
                  <span>{answers[signal.id] === 'yes' ? signal.next :
                    'Verzamel onafhankelijke informatie: ' + signal.question}
                  </span>
                </label>
              </li>)}
              {findings.unanswered.length > 0 && <li>Beantwoord de {findings.unanswered.length}
                {' '}open {findings.unanswered.length === 1 ? 'vraag' : 'vragen'} voordat je op deze check vertrouwt.</li>}
            </ol>}
        <p>Bij twijfel: gebruik zelf gevonden officiële contactgegevens, neem tijd voor advies en
          meld vermoedelijke fraude via de daarvoor bestemde officiële kanalen. Deze tool verstuurt niets.</p>
        {reviewActions.length>0 && <div style={{padding:'14px 0'}}>
          <h3>Stel vragen voor je eigen huurvoorstel voor</h3>
          <p>Voor {caseLabel(currentCase.id)} zijn {reviewActions.length} algemene controlevragen
            relevant. Alleen vaste vraagteksten (zonder antwoorden, bedragen, namen of documentinhoud)
            gaan binnen dit tabblad als <em>voorstel</em> naar het tijdelijke huurformulier.
            Het formulier neemt niets over zonder een tweede bevestiging.</p>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:200,
            overflow:'auto',padding:12,background:'#f3f6f3'}}>{suggestedRentalQuestions}</pre>
          <button type="button" disabled={!onPrepareRentalQuestions ||
            suggestedRentalQuestions.length>400}
            onClick={()=>{
              if(!onPrepareRentalQuestions||suggestedRentalQuestions.length>400) return;
              onPrepareRentalQuestions(suggestedRentalQuestions);
              document.getElementById('private-offer-desk-heading')?.scrollIntoView({behavior:'smooth'});
            }} style={{minHeight:44,padding:'9px 14px'}}>
            Toon deze vragen bij mijn huurvoorstellen
          </button>
          {suggestedRentalQuestions.length>400 && <p role="status">
            Er zijn te veel vragen voor het korte huurformulier. Gebruik de eigen TXT-export.</p>}
        </div>}
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 44 }}>Wat bewaren we van je antwoorden?</summary>
          <p>Niets op een server of in browseropslag. Alleen React-tabbladgeheugen totdat je dit tabblad
            sluit of herlaadt. Er wordt geen formulier, adres, bedrag, identiteitsbewijs, URL of rekeningnummer gevraagd.
            Een eigen gedownload TXT-bestand kun je buiten Woonpoints bewaren of delen; controleer zelf de opslaglocatie.</p>
        </details>
      </section>

      <section className="card" style={{ marginTop: 20, marginBottom: 32 }}>
        <h2 style={{ fontSize: 24 }}>Zelf meenemen of opnieuw beginnen</h2>
        <p>Je kijkt en downloadt nu uitsluitend {caseLabel(currentCase.id)}, tenzij je
          bewust de aparte complete vergelijking exporteert.</p>
        <button type="button" onClick={() => { setPreview(value => !value); setConfirmReset(false); }}
          style={{ minHeight: 44, padding: '9px 14px', margin: '12px 8px 12px 0' }}>
          {preview ? 'Sluit voorbeeld' : 'Bekijk mijn privé-TXT'}
        </button>
        {preview && <div>
          <p>Alleen bovenstaande keuzes en bijbehorende algemene adviezen; geen persoonlijke documenten.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 330, overflow: 'auto', padding: 16, background: '#f3f6f3' }}>{report}</pre>
          <button type="button" onClick={() => downloadLocal(report, 'woonpoints-' + caseLabel(currentCase.id).toLowerCase().replace(' ', '-') + '.txt')} style={{ minHeight: 44, padding: '9px 14px' }}>
            Download gecontroleerd TXT-bestand
          </button>
        </div>}
        <button type="button" onClick={() => { setConfirmReset(true); setPreview(false); setAllPreview(false); }}
          style={{ minHeight: 44, padding: '9px 14px', marginLeft: 8 }}>Wis antwoorden</button>
        {caseItems.length > 1 && <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #dbe6dd' }}>
          <h3>Alle werkbladen exporteren</h3>
          <p>In één bestand staan alle {caseItems.length} zelf ingevulde voorstellen met nummers,
            algemene signalen en eigen opvolgstatus. Lees het eerst na: een door jou gekozen
            bestandslocatie kan buiten Woonpoints synchroniseren.</p>
          <button type="button" onClick={() => { setAllPreview(value => !value); setPreview(false); setConfirmReset(false); }}
            style={{ minHeight: 44, padding: '9px 14px' }}>
            {allPreview ? 'Sluit alle voorbeelden' : 'Bekijk complete privévergelijking'}
          </button>
          {allPreview && <div>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 330, overflow: 'auto',
              padding: 16, background: '#f3f6f3' }}>{combinedReport}</pre>
            <button type="button" onClick={() => downloadLocal(combinedReport, 'woonpoints-aanbodcontroles-prive.txt')}
              style={{ minHeight: 44, padding: '9px 14px' }}>Download deze complete TXT</button>
          </div>}
        </div>}
        {confirmReset && <div role="group" aria-label="Antwoorden wissen" style={{ paddingTop: 12 }}>
          <p>Alle {findings.checked} antwoorden en {reviewedCount} zelf afgevinkte vervolgstappen
            voor {caseLabel(currentCase.id)} wissen? Andere voorstellen blijven intact.</p>
          <button type="button" onClick={() => {
              updateCurrentCase(current => ({ ...current, answers: {}, reviewed: {} }));
              setConfirmReset(false); setPreview(false); setAllPreview(false);
            }}
            style={{ minHeight: 44, padding: '9px 14px' }}>Ja, wis alles</button>
          <button type="button" onClick={() => setConfirmReset(false)}
            style={{ minHeight: 44, padding: '9px 14px', marginLeft: 8 }}>Annuleren</button>
        </div>}
      </section>

      <section className="card" aria-label="Zelf privéwerkmap bewaren en herstellen" style={{ marginTop: 20, marginBottom: 32 }}>
        <h2 style={{ fontSize: 24 }}>Privéwerkmap back-up en herstel</h2>
        <p>Je kunt de complete {caseItems.length} {caseItems.length === 1 ? 'werkblad' : 'werkbladen'}
          optioneel als eigen JSON bewaren om later bewust terug te zetten.
          Zonder downloaden verdwijnen antwoorden bij herladen of sluiten.
          Er staan geen adressen, namen, accountgegevens of documenten in dit formaat.
          Een bestandslocatie kan wel buiten Woonpoints synchroniseren.</p>
        <button type="button" onClick={() => {
          setBackupPreview(value => !value); setPendingBackup(null);
          setBackupMessage(''); setPreview(false); setAllPreview(false);
        }} style={{ minHeight: 44, padding: '9px 14px' }}>
          {backupPreview ? 'Sluit JSON-voorbeeld' : 'Bekijk complete privé-JSON'}
        </button>
        {backupPreview && <div>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 280, overflow: 'auto',
            padding: 16, background: '#f3f6f3' }}>{portableBackup}</pre>
          <button type="button" onClick={() =>
            downloadLocal(portableBackup, 'woonpoints-woningaanbod-werkmap.json')}
            style={{ minHeight: 44, padding: '9px 14px' }}>
            Download bekeken JSON
          </button>
        </div>}
        <label htmlFor="offer-safety-import" style={{ display: 'block', fontWeight: 700, marginTop: 18 }}>
          Open mijn eerdere privéwerkmap (.json, maximaal 10 KiB)
        </label>
        <input type="file" id="offer-safety-import" accept=".json,application/json"
          style={{ display: 'block', minHeight: 44, maxWidth: '100%', marginTop: 7 }}
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            void readOwnBackup(file);
          }} />
        {backupMessage && <p role="status" aria-live="polite">{backupMessage}</p>}
        {pendingBackup && <div style={{ background: '#f1f6f1', borderRadius: 10, padding: 14 }}>
          <p><strong>Gecontroleerd bestand:</strong> {pendingBackup.length} werkbladen;
            {' '}je huidige {caseItems.length} blijven onveranderd tot je kiest om
            <strong> alles te vervangen</strong> of <strong> zonder overschrijven toe te voegen</strong>.</p>
          <ul>{pendingBackup.map(item => <li key={item.id}>
            {caseLabel(item.id)}: {Object.keys(item.answers).length} vragen ingevuld,
            {' '}{Object.values(item.reviewed).filter(Boolean).length} acties zelf nagelopen.
          </li>)}</ul>
          {mergePreview ? <div>
            <h3>Voorbeeld toevoegen zonder overschrijven</h3>
            <p>Na toevoegen bevat dit tabblad {caseItems.length + mergePreview.length}
              {' '}afzonderlijke werkbladen. Bij gelijke nummers wordt een nieuwe, vrije
              nummercode gebruikt; geen enkel bestaand antwoord wordt aangepast.</p>
            <ul>{mergePreview.map(entry => <li key={entry.sourceId}>
              {caseLabel(entry.sourceId)} uit bestand → {caseLabel(entry.targetId)}
              {entry.sourceId !== entry.targetId ? ' (nieuw nummer)' : ''}
            </li>)}</ul>
            <button type="button" onClick={mergeOwnBackup} style={{ minHeight: 44, padding: '9px 14px' }}>
              Voeg deze werkbladen toe — behoud bestaande
            </button>
          </div> : <p role="status">Toevoegen kan niet: maximaal vijf werkbladen totaal.
            Kies eventueel bewust volledig vervangen of annuleer de import.</p>}
          <button type="button" onClick={applyOwnBackup} style={{ minHeight: 44, padding: '9px 14px', marginTop: 12 }}>
            Vervang in plaats daarvan alle huidige werkbladen
          </button>
          <button type="button" onClick={() => { backupReadGeneration.current++; setPendingBackup(null); setBackupMessage('Herstel geannuleerd.'); }}
            style={{ minHeight: 44, padding: '9px 14px', marginLeft: 8 }}>Annuleren</button>
        </div>}
        {undoBackup && <button type="button" onClick={undoOwnBackup}
          style={{ minHeight: 44, padding: '9px 14px', marginTop: 12 }}>
          Draai laatste import (vervangen of toevoegen) eenmalig terug
        </button>}
        <p style={{ fontSize: 14 }}>Alleen precies de bekende vraag-ID's en antwoorden
          worden geaccepteerd. Onbekende velden, extra werkbladen, corrupte bestandsinhoud,
          inconsistente afvinkingen of een verkeerde versie worden geweigerd vóór vervanging.
          Je bestanden worden niet geüpload.</p>
      </section>
    </section>
  );
}


// Self-contained, non-authorizing client-only comparison inside the approved app source.
type WoonMatchAllocation = 'unknown' | 'lottery' | 'queue';
type WoonMatchPreference = 'any' | 'lottery' | 'queue';
const WOON_MATCH_METHOD_LABELS: Record<WoonMatchAllocation,string> = {
  unknown: 'Onbekend / nog controleren', lottery: 'Loting (eigen invoer)', queue: 'Inschrijfduur (eigen invoer)'
};
const WOON_MATCH_PREFERENCE_LABELS: Record<WoonMatchPreference,string> = {
  any: 'Geen methodevoorkeur', lottery: 'Voorkeur voor loting', queue: 'Voorkeur voor inschrijfduur'
};
const woonMatchMethodRank = (method: WoonMatchAllocation, preference: WoonMatchPreference): number =>
  preference === 'any' ? 0 : method === preference ? 2 : method === 'unknown' ? 1 : 0;
type WoonMatchListing = { id: number; name: string; monthlyRent: string; utilities: string; area: string; bedrooms: string; commute: string; note: string; allocation: WoonMatchAllocation };
type WoonMatchCriteria = { budget: string; area: string; bedrooms: string; commute: string };
type WoonMatchWeights = Record<keyof WoonMatchCriteria, number>;
const WOON_MATCH_DEFAULT_WEIGHTS: WoonMatchWeights = { budget: 4, area: 3, bedrooms: 2, commute: 2 };
const WOON_MATCH_PRIORITY_LABELS: Array<{ key: keyof WoonMatchCriteria; label: string }> = [
  { key: 'budget', label: 'Totale maandlasten' }, { key: 'area', label: 'Woonoppervlak' },
  { key: 'bedrooms', label: 'Slaapkamers' }, { key: 'commute', label: 'Reistijd' }
];
type WoonMatchRule = { label: string; weight: number; observed: number | null; required: number | null; met: boolean | null; detail: string };
type WoonMatchOutcome = { listing: WoonMatchListing; monthly: number | null; rules: WoonMatchRule[]; complete: boolean; pass: boolean; met: number; known: number; score: number | null };

const WoonMatchBlank = (id: number): WoonMatchListing => ({ id, name: '', monthlyRent: '', utilities: '', area: '', bedrooms: '', commute: '', note: '', allocation: 'unknown' });
const WoonMatchInputStyle: React.CSSProperties = { width: '100%', minWidth: 0, padding: '9px', border: '1px solid #a8bdb8', borderRadius: 6, background: '#fff', color: '#173731', boxSizing: 'border-box' };
const WoonMatchPanelStyle: React.CSSProperties = { border: '1px solid #cedfda', borderRadius: 12, padding: 18, background: '#fff', marginBottom: 18 };
const WoonMatchNumeric = (input: string, cap: number): number | null => {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= cap ? value : null;
};
const WoonMatchMoney = (value: number): string => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
const WoonMatchScalar = (value: string, label: string, cap: number, required: boolean): string | null =>
  value.trim() && WoonMatchNumeric(value, cap) === null
    ? label + ' moet een getal tussen 0 en ' + cap + ' zijn.'
    : required && WoonMatchNumeric(value, cap) === null ? 'Vul ' + label.toLowerCase() + ' in.' : null;

function WoonMatchCalculate(listing: WoonMatchListing, criteria: WoonMatchCriteria, weights: WoonMatchWeights): WoonMatchOutcome {
  const rent = WoonMatchNumeric(listing.monthlyRent, 100000);
  const utility = WoonMatchNumeric(listing.utilities, 100000);
  const monthly = rent !== null && utility !== null ? rent + utility : null;
  const area = WoonMatchNumeric(listing.area, 100000);
  const bedrooms = WoonMatchNumeric(listing.bedrooms, 100);
  const commute = WoonMatchNumeric(listing.commute, 10000);
  const pairs: Array<[string, number, number | null, number | null, 'max' | 'min', string]> = [
    ['Totale maandkosten', weights.budget, monthly, WoonMatchNumeric(criteria.budget, 100000), 'max', '€ per maand, inclusief eigen service/energie-inschatting'],
    ['Woonoppervlak', weights.area, area, WoonMatchNumeric(criteria.area, 100000), 'min', 'm²'],
    ['Slaapkamers', weights.bedrooms, bedrooms, WoonMatchNumeric(criteria.bedrooms, 100), 'min', 'kamers'],
    ['Reistijd enkele reis', weights.commute, commute, WoonMatchNumeric(criteria.commute, 10000), 'max', 'minuten']
  ];
  const rules: WoonMatchRule[] = pairs.map(([label, weight, observed, required, direction, detail]) => ({
    label, weight, observed, required, detail,
    met: observed === null || required === null ? null : direction === 'max' ? observed <= required : observed >= required
  }));
  const known = rules.filter(r => r.met !== null).length;
  const met = rules.filter(r => r.met === true).length;
  const complete = known === rules.length;
  const total = rules.reduce((sum, r) => sum + r.weight, 0);
  const score = complete ? Math.round(rules.reduce((sum, r) => sum + (r.met ? r.weight : 0), 0) * 100 / total) : null;
  return { listing, monthly, rules, complete, pass: complete && met === rules.length, met, known, score };
}

/** Explain only the distance from an owner's own threshold, never inferred listing or eligibility facts. */
function WoonMatchGap(rule: WoonMatchRule): string | null {
  if (rule.met !== false || rule.observed === null || rule.required === null) return null;
  const distance = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 })
    .format(Math.abs(rule.observed - rule.required));
  switch (rule.label) {
    case 'Totale maandkosten': return '€ ' + distance + ' per maand boven jouw maximum';
    case 'Woonoppervlak': return distance + ' m² onder jouw minimum';
    case 'Slaapkamers': return distance + ' slaapkamers onder jouw minimum';
    case 'Reistijd enkele reis': return distance + ' minuten boven jouw maximum';
    default: return null;
  }
}
function WoonMatchField({ label, value, setValue, placeholder, maxLength = 20 }: { label: string; value: string; setValue: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return <label style={{ display: 'block', fontSize: 14, fontWeight: 650, minWidth: 0 }}>
    <span style={{ display: 'block', marginBottom: 5 }}>{label}</span>
    <input style={WoonMatchInputStyle} value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
  </label>;
}


const WOON_MATCH_CSV_HEADER = 'label;kale_huur;extra_maandlasten;m2;slaapkamers;reistijd_min;notitie';

// A CSV opened in desktop spreadsheet software can interpret a text cell as
// a formula. Refuse ambiguous leading formula prefixes rather than adding
// escape characters that silently change the seven-field import contract.
const woonMatchCsvFormulaCell = (value: string): boolean => /^[=+@-]/u.test(value.trimStart());

/** Only locally pasted, seven-column Dutch semicolon records; no spreadsheet parser or network. */
function parsePrivateMatchCsv(source: string, minRows: 1 | 2 = 2): { rows: Omit<WoonMatchListing, 'id'>[]; error: string } {
  if (!source || source.length > 4096 || /[^\S\n\r\t ]/.test(source)) {
    return { rows: [], error: 'Plak maximaal 4.096 tekens zonder verborgen besturingstekens.' };
  }
  const normalized = source.replace(/\r\n/g, '\n');
  if (normalized.includes('\r')) return { rows: [], error: 'Gebruik gewone LF of CRLF-regels.' };
  const lines = normalized.trimEnd().split('\n');
  if (lines[0] !== WOON_MATCH_CSV_HEADER) return { rows: [], error: 'De zeven kolomnamen moeten exact overeenkomen met het getoonde sjabloon.' };
  if (lines.length < minRows + 1 || lines.length > 6) return { rows: [], error: 'Voer ' + (minRows === 1 ? 'één tot vijf' : 'twee tot vijf') + ' woningregels in.' };
  const rows: Omit<WoonMatchListing, 'id'>[] = [];
  const names = new Set<string>();
  for (let index = 1; index < lines.length; index++) {
    const cols = lines[index].split(';');
    if (cols.length !== 7) return { rows: [], error: 'Rij ' + (index + 1) + ': verwacht precies 7 met puntkomma gescheiden velden; geen quotes of puntkomma in notities.' };
    const [name, monthlyRent, utilities, area, bedrooms, commute, note] = cols.map(value => value.trim());
    if (woonMatchCsvFormulaCell(name) || woonMatchCsvFormulaCell(note)) {
      return { rows: [], error: 'Rij ' + (index + 1) +
        ': label of notitie begint met een spreadsheet-formuleteken (=, +, - of @). Gebruik eigen platte tekst.' };
    }
    if (!name || name.length > 80 || note.length > 200 || /[\u0000-\u001f\u007f]/.test(name + note)) {
      return { rows: [], error: 'Rij ' + (index + 1) + ': naam of notitie ontbreekt, is te lang of bevat besturingstekens.' };
    }
    const nameKey = name.toLocaleLowerCase('nl-NL');
    if (names.has(nameKey)) return { rows: [], error: 'Rij ' + (index + 1) + ': gebruik voor iedere optie een uniek eigen label.' };
    names.add(nameKey);
    const amounts = [monthlyRent, utilities, area, bedrooms, commute];
    const caps = [100000, 100000, 100000, 100, 10000];
    if (amounts.some((value, k) => WoonMatchNumeric(value, caps[k]) === null) ||
      !/^\d+$/.test(bedrooms) || !/^\d+$/.test(commute)) {
      return { rows: [], error: 'Rij ' + (index + 1) + ': ongeldige bedragen, m², gehele slaapkamers of gehele reistijd.' };
    }
    rows.push({ name, monthlyRent, utilities, area, bedrooms, commute, note, allocation: 'unknown' });
  }
  return { rows, error: '' };
}



/** Export only faithfully round-trippable, explicitly private seven-field text. */
function woonMatchEncodeCsv(listings: WoonMatchListing[]): { text: string; error: string } {
  const fail = (error: string) => ({ text: '', error });
  if (listings.length < 2 || listings.length > 5) return fail('Alleen twee tot vijf opties kunnen worden geëxporteerd.');
  const names = new Set<string>();
  for (const [index, row] of listings.entries()) {
    if (woonMatchCsvFormulaCell(row.name) || woonMatchCsvFormulaCell(row.note))
      return fail('Optie ' + (index + 1) +
        ': label of notitie mag niet beginnen met =, +, - of @ bij CSV-export. Pas die eigen tekst eerst aan.');
    if (!woonMatchSafeText(row.name, 80) || !woonMatchSafeText(row.note, 200) ||
        !row.name.trim() || row.name !== row.name.trim() || row.note !== row.note.trim() ||
        /[;\r\n\t]/.test(row.name + row.note)) {
      return fail('Optie ' + (index + 1) + ': label of notitie is leeg, te lang, heeft randspaties of bevat een scheidingsteken. Pas dit eerst zelf aan.');
    }
    const key = row.name.toLocaleLowerCase('nl-NL');
    if (names.has(key)) return fail('Gebruik unieke woninglabels vóór export.');
    names.add(key);
    if ([row.monthlyRent,row.utilities,row.area,row.bedrooms,row.commute].some((v, i) =>
        !woonMatchSafeText(v, 20) || WoonMatchNumeric(v, [100000,100000,100000,100,10000][i]) === null) ||
        !/^\d+$/.test(row.bedrooms) || !/^\d+$/.test(row.commute)) {
      return fail('Optie ' + (index + 1) + ': vul eerst alle geldige bedragen, m², hele slaapkamers en hele reisminuten in.');
    }
  }
  const fields: Array<keyof Omit<WoonMatchListing, 'id' | 'allocation'>> =
    ['name','monthlyRent','utilities','area','bedrooms','commute','note'];
  const text = [WOON_MATCH_CSV_HEADER, ...listings.map(row =>
    fields.map(key => row[key]).join(';'))].join('\n') + '\n';
  if (text.length > 4096) return fail('De tekst is langer dan de toegestane 4.096 tekens.');
  const imported = parsePrivateMatchCsv(text);
  if (imported.error || imported.rows.length !== listings.length ||
      imported.rows.some((item,index) =>
        fields.some(key => item[key] !== listings[index][key]))) {
    return fail('De zeven-koloms tekst kan niet zonder verlies terug worden ingelezen. Gebruik de volledige JSON-back-up.');
  }
  return { text, error: '' };
}

type WoonMatchPortable = {
  format: 'woonpoints.private-match.v2';
  criteria: WoonMatchCriteria;
  weights: WoonMatchWeights;
  preference: WoonMatchPreference;
  listings: Omit<WoonMatchListing, 'id'>[];
};
const WOON_MATCH_BACKUP_LIMIT = 12288;
const woonMatchKeys = (value: Record<string, unknown>, expected: string[]): boolean =>
  Object.keys(value).sort().join('|') === [...expected].sort().join('|');
const woonMatchRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const woonMatchSafeText = (value: unknown, cap: number): value is string => {
  if (typeof value !== 'string' || value.length > cap || /[\u0000-\u001f\u007f]/.test(value)) return false;
  // JSON can decode \uD800 into an unpaired UTF-16 surrogate even from valid UTF-8.
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = value.charCodeAt(++i);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) return false;
    } else if (code >= 0xDC00 && code <= 0xDFFF) return false;
  }
  return true;
};
function woonMatchDecodeBackup(text: string): { data: WoonMatchPortable | null; error: string } {
  const fail = (message: string) => ({ data: null, error: message });
  if (new TextEncoder().encode(text).length > WOON_MATCH_BACKUP_LIMIT) return fail('Het bestand is groter dan 12 KiB.');
  let value: unknown;
  try { value = JSON.parse(text); } catch { return fail('Dit is geen geldige JSON-back-up.'); }
  if (!woonMatchRecord(value)) return fail('Onbekende versie of extra back-upvelden.');
  const v2 = value.format === 'woonpoints.private-match.v2';
  const v1 = value.format === 'woonpoints.private-match.v1';
  if ((!v1 && !v2) || !woonMatchKeys(value, v2
    ? ['format','criteria','weights','preference','listings']
    : ['format','criteria','weights','listings'])) return fail('Onbekende versie of extra back-upvelden.');
  if (v2 && value.preference !== 'any' && value.preference !== 'lottery' && value.preference !== 'queue') {
    return fail('Ongeldige eigen toewijzingsmethodevoorkeur.');
  }
  const c = value.criteria, w = value.weights, items = value.listings;
  const fields: Array<keyof WoonMatchCriteria> = ['budget','area','bedrooms','commute'];
  if (!woonMatchRecord(c) || !woonMatchKeys(c, fields) ||
      fields.some((key, index) => !woonMatchSafeText(c[key], 20) ||
        (c[key] !== '' && WoonMatchNumeric(c[key] as string, [100000,100000,100,10000][index]) === null))) {
    return fail('Ongeldige eigen criteria in de back-up.');
  }
  if (!woonMatchRecord(w) || !woonMatchKeys(w, fields) ||
      fields.some(key => typeof w[key] !== 'number' || !Number.isInteger(w[key]) || (w[key] as number) < 1 || (w[key] as number) > 5)) {
    return fail('Ongeldige relatieve weging in de back-up.');
  }
  if (!Array.isArray(items) || items.length < 2 || items.length > 5) return fail('Alleen twee tot vijf opties worden ondersteund.');
  const names = new Set<string>();
  for (const [index,item] of items.entries()) {
    if (!woonMatchRecord(item) || !woonMatchKeys(item, v2
      ? ['name','monthlyRent','utilities','area','bedrooms','commute','note','allocation']
      : ['name','monthlyRent','utilities','area','bedrooms','commute','note'])) {
      return fail('Optie '+(index+1)+': onbekende of ontbrekende velden.');
    }
    for (const [key,cap] of [['name',80],['note',200]] as const) {
      if (!woonMatchSafeText(item[key], cap)) return fail('Optie '+(index+1)+': ongeldige '+key+'.');
    }
    if (v2 && item.allocation !== 'unknown' && item.allocation !== 'lottery' && item.allocation !== 'queue') {
      return fail('Optie '+(index+1)+': ongeldige zelf ingevoerde toewijzingsmethode.');
    }
    const name = (item.name as string).trim().toLocaleLowerCase('nl-NL');
    if (name && names.has(name)) return fail('Dubbele labels in het herstelbestand.');
    if (name) names.add(name);
    const numbers: Array<[string,number]> = [['monthlyRent',100000],['utilities',100000],['area',100000],['bedrooms',100],['commute',10000]];
    if (numbers.some(([key,cap]) => !woonMatchSafeText(item[key],20) ||
        (item[key] !== '' && WoonMatchNumeric(item[key] as string,cap) === null))) {
      return fail('Optie '+(index+1)+': ongeldig numeriek veld.');
    }
    if (['bedrooms','commute'].some(key => item[key] !== '' && !/^\d+$/.test(item[key] as string))) {
      return fail('Optie '+(index+1)+': kamers en reistijd moeten gehele getallen zijn.');
    }
  }
  // Original v1 backups remain restorable. Never invent lottery evidence
  // for a listing in an older backup that carried no such field.
  return {
    data: {
      format: 'woonpoints.private-match.v2',
      criteria: c as WoonMatchCriteria,
      weights: w as WoonMatchWeights,
      preference: v2 ? value.preference as WoonMatchPreference : 'any',
      listings: items.map(item => ({
        ...item,
        allocation: v2 ? item.allocation as WoonMatchAllocation : 'unknown'
      })) as Array<Omit<WoonMatchListing, 'id'>>
    },
    error: ''
  };
}

type WoonMatchRentalHandoff = {
  id: number; source: string; label: string; rent: number;
  allOwnCriteriaMet: boolean; score: number; monthly: number;
};
const woonMatchHandoffLabel = (value: string) =>
  value.length >= 1 && value.length <= 64 && value === value.trim() &&
  !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
const woonMatchHandoffRent = (value: string): number | null => {
  const amount = WoonMatchNumeric(value, 10000);
  return amount !== null && Number.isSafeInteger(amount) && amount >= 100 ? amount : null;
};

function PrivateListingMatchStudio({ onRentalPrefill, onCostPrefill }: {
  onRentalPrefill?: (item: {label: string; rent: number}) => void;
  onCostPrefill?: (pair: PrivateMatchCostPair) => void;
} = {}) {
  const [criteria, setCriteria] = useState<WoonMatchCriteria>({ budget: '', area: '', bedrooms: '', commute: '' });
  const [weights, setWeights] = useState<WoonMatchWeights>({ ...WOON_MATCH_DEFAULT_WEIGHTS });
  const [preference, setPreference] = useState<WoonMatchPreference>('any');
  const [listings, setListings] = useState<WoonMatchListing[]>([WoonMatchBlank(1), WoonMatchBlank(2)]);
  const nextId = useRef(3);
  const backupRead = useRef(0);
  const [backupPreview, setBackupPreview] = useState<{ source: string; text: string } | null>(null);
  const [backupExportApproved, setBackupExportApproved] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<{ source: string; data: WoonMatchPortable; label: string } | null>(null);
  const [restoreApproved, setRestoreApproved] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [undoRestore, setUndoRestore] = useState<{ criteria: WoonMatchCriteria; weights: WoonMatchWeights; preference: WoonMatchPreference; listings: WoonMatchListing[] } | null>(null);
  const [csvText, setCsvText] = useState('');
  const csvFileRead = useRef(0);
  const [csvFileMessage, setCsvFileMessage] = useState('');
  const [csvError, setCsvError] = useState('');
  const [pendingCsv, setPendingCsv] = useState<{ source: string; paste: string; rows: Omit<WoonMatchListing, 'id'>[] } | null>(null);
  const [confirmCsv, setConfirmCsv] = useState(false);
  const [confirmCsvAppend, setConfirmCsvAppend] = useState(false);
  const [undoCsv, setUndoCsv] = useState<WoonMatchListing[] | null>(null);
  const [csvExportPreview, setCsvExportPreview] = useState<{ source: string; text: string } | null>(null);
  const [csvExportApproved, setCsvExportApproved] = useState(false);
  const [showPreview, setShowPreview] = useState<{ source: string; text: string } | null>(null);
  const [allowDownload, setAllowDownload] = useState(false);
  const [rentalHandoff, setRentalHandoff] = useState<WoonMatchRentalHandoff | null>(null);
  const [rentalApproved, setRentalApproved] = useState(false);
  const [rentalMessage, setRentalMessage] = useState('');
  const [firstCostId,setFirstCostId]=useState<number|null>(null);
  const [secondCostId,setSecondCostId]=useState<number|null>(null);
  const [costHandoff,setCostHandoff]=useState<{
    source:string; first:WoonMatchOutcome; second:WoonMatchOutcome;
    pair:PrivateMatchCostPair;
  }|null>(null);
  const [costApproved,setCostApproved]=useState(false);
  const [costMessage,setCostMessage]=useState('');
  const [whatIf, setWhatIf] = useState<{ source: string; limits: WoonMatchCriteria } | null>(null);
  const [scenarioReportPreview, setScenarioReportPreview] = useState<{ source: string; text: string } | null>(null);
  const [scenarioReportApproved, setScenarioReportApproved] = useState(false);
  const scenarioGeneration = useRef(0);
  const closeScenario = () => {
    scenarioGeneration.current++;
    setWhatIf(null);
    setScenarioReportPreview(null);
    setScenarioReportApproved(false);
  };
  const modifyScenario = (key: keyof WoonMatchCriteria, value: string) => {
    scenarioGeneration.current++;
    setWhatIf(prev => prev && ({ ...prev, limits: { ...prev.limits, [key]: value } }));
    setScenarioReportPreview(null);
    setScenarioReportApproved(false);
  };
  const changeCriteria = (key: keyof WoonMatchCriteria, value: string) => {
    setUndoRestore(null);
    setCriteria(prev => ({ ...prev, [key]: value }));
  };
  const changeListing = <K extends keyof Omit<WoonMatchListing, 'id'>>(id: number, key: K, value: Omit<WoonMatchListing, 'id'>[K]) => {
    setUndoRestore(null);
    setUndoCsv(null);
    setListings(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
  };

  const currentSource = JSON.stringify({ schema: 2, criteria, weights, preference, listings });
  const portableBackup: WoonMatchPortable = {
    format: 'woonpoints.private-match.v2', criteria, weights, preference,
    listings: listings.map(({ id, ...fields }) => fields)
  };
  const portableBackupText = JSON.stringify(portableBackup, null, 2);
  const backupSourceValid = woonMatchDecodeBackup(portableBackupText).data !== null;
  const backupPreviewValid = backupPreview?.source === currentSource && backupSourceValid;
  const restorePreviewValid = pendingRestore?.source === currentSource;
  const outcomes = useMemo(() => listings.map(item => WoonMatchCalculate(item, criteria, weights)), [listings, criteria, weights]);
  const criteriaErrors = [
    WoonMatchScalar(criteria.budget, 'Maandgrens', 100000, true),
    WoonMatchScalar(criteria.area, 'Minimum oppervlak', 100000, true),
    WoonMatchScalar(criteria.bedrooms, 'Minimum slaapkamers', 100, true),
    WoonMatchScalar(criteria.commute, 'Maximum reistijd', 10000, true)
  ].filter(Boolean) as string[];
  const fieldErrors = listings.flatMap((row, index) => [
    !row.name.trim() ? 'Optie ' + (index + 1) + ': vul een herkenbare titel in.' : null,
    WoonMatchScalar(row.monthlyRent, 'Optie ' + (index + 1) + ': kale huur', 100000, true),
    WoonMatchScalar(row.utilities, 'Optie ' + (index + 1) + ': extra maandlasten', 100000, true),
    WoonMatchScalar(row.area, 'Optie ' + (index + 1) + ': oppervlak', 100000, true),
    WoonMatchScalar(row.bedrooms, 'Optie ' + (index + 1) + ': slaapkamers', 100, true),
    WoonMatchScalar(row.commute, 'Optie ' + (index + 1) + ': reistijd', 10000, true)
  ].filter(Boolean)) as string[];
  const canCompare = criteriaErrors.length === 0 && fieldErrors.length === 0;
  const ordered = [...outcomes].sort((a, b) =>
    Number(b.pass) - Number(a.pass) || (b.score ?? -1) - (a.score ?? -1) ||
    woonMatchMethodRank(b.listing.allocation, preference) - woonMatchMethodRank(a.listing.allocation, preference) ||
    a.listing.id - b.listing.id);
  // Scenario is deliberately transient: an old source snapshot cannot change or authorize the real comparison.
  const whatIfCurrent = !!whatIf && whatIf.source === currentSource && canCompare;
  const whatIfErrors = !whatIf ? [] : ([
    WoonMatchScalar(whatIf.limits.budget, 'Scenario: maximale maandlasten', 100000, true),
    WoonMatchScalar(whatIf.limits.area, 'Scenario: minimaal oppervlak', 100000, true),
    WoonMatchScalar(whatIf.limits.bedrooms, 'Scenario: slaapkamers', 100, true),
    WoonMatchScalar(whatIf.limits.commute, 'Scenario: reistijd', 10000, true)
  ].filter(Boolean) as string[]);
  const scenarioOrdered = whatIfCurrent && whatIfErrors.length === 0
    ? listings.map(item => WoonMatchCalculate(item, whatIf!.limits, weights)).sort((a, b) =>
        Number(b.pass) - Number(a.pass) || (b.score ?? -1) - (a.score ?? -1) ||
        woonMatchMethodRank(b.listing.allocation, preference) - woonMatchMethodRank(a.listing.allocation, preference) ||
        a.listing.id - b.listing.id)
    : [];
  // A separate, explicitly hypothetical plain-text export. This never
  // authorizes or mutates original listings, budgets, other transfers or backups.
  const scenarioKey = JSON.stringify({
    source: currentSource,
    version: scenarioGeneration.current,
    limits: whatIf?.limits
  });
  const buildScenarioReport = (): string => {
    if (!whatIfCurrent || whatIfErrors.length > 0) return '';
    const lines = [
      'WOONPOINTS — MIJN HYPOTHETISCHE WONINGVERGELIJKING',
      'GEEN WONINGADVIES, GEEN TOEWIJZINGSKANS OF OFFICIËLE BESLISSING',
      'Alle waarden en grenzen zijn uitsluitend door mijzelf ingevuld.',
      'Dit is een wat-als-scenario: geen van mijn oorspronkelijke gegevens is gewijzigd.',
      '',
      'MIJN OORSPRONKELIJKE GRENZEN',
      'Maandkosten max.: € ' + criteria.budget,
      'Woonoppervlak min.: ' + criteria.area + ' m²',
      'Slaapkamers min.: ' + criteria.bedrooms,
      'Reistijd enkele reis max.: ' + criteria.commute + ' min',
      '',
      'MIJN HYPOTHETISCHE GRENZEN',
      'Maandkosten max.: € ' + whatIf!.limits.budget,
      'Woonoppervlak min.: ' + whatIf!.limits.area + ' m²',
      'Slaapkamers min.: ' + whatIf!.limits.bedrooms,
      'Reistijd enkele reis max.: ' + whatIf!.limits.commute + ' min',
      '',
      'MIJN WEGENDE PRIORITEITEN (ONVERANDERD)',
      'Maandkosten: ' + weights.budget + ', oppervlak: ' + weights.area +
        ', slaapkamers: ' + weights.bedrooms + ', reistijd: ' + weights.commute,
      '',
      'VOLLEDIG PASSEND VOLGENS AL MIJN VIER EIGEN GRENZEN',
      'Origineel: ' + ordered.filter(row => row.pass).length + '/' + ordered.length,
      'Hypothetisch: ' + scenarioOrdered.filter(row => row.pass).length + '/' + scenarioOrdered.length,
      '',
      'RANGSCHIKKING BIJ DE HYPOTHETISCHE GRENZEN'
    ];
    scenarioOrdered.forEach((row, index) => {
      const originalIndex = ordered.findIndex(item => item.listing.id === row.listing.id);
      const original = ordered[originalIndex];
      lines.push(
        String(index + 1) + '. ' + row.listing.name,
        'Oorspronkelijke plek: ' + (originalIndex + 1) +
          '; hypothetische plek: ' + (index + 1),
        'Oorspronkelijke score: ' + original.score + '% (' + original.met +
          '/4); hypothetische score: ' + row.score + '% (' + row.met + '/4)',
        'Harde grenzen hypothetisch: ' + (row.pass ? 'alle vier gehaald' : 'NIET alle vier gehaald')
      );
      row.rules.filter(rule => rule.met === false).forEach(rule => {
        lines.push('Niet gehaald: ' + rule.label + ' — ' +
          (WoonMatchGap(rule) || 'afwijking ten opzichte van eigen grens'));
      });
      lines.push('');
    });
    lines.push(
      'De scores zijn uitsluitend afgeleide eigen criteria; geen broncontrole of toewijzingsbewijs.',
      'Dit TXT-document bevat eigen woninglabels. Deel het alleen bewust.',
      'Alle scenario-waarden zijn tijdelijk; de oorspronkelijke JSON/TXT en overdrachten blijven ongewijzigd.'
    );
    return lines.join('\n') + '\n';
  };
  const scenarioPreviewValid = !!scenarioReportPreview && whatIfCurrent &&
    whatIfErrors.length === 0 && scenarioReportPreview.source === scenarioKey &&
    scenarioReportPreview.text === buildScenarioReport();
  const downloadScenarioReport = () => {
    if (!scenarioPreviewValid || !scenarioReportApproved || !scenarioReportPreview) return;
    const url = URL.createObjectURL(new Blob([scenarioReportPreview.text], {
      type: 'text/plain;charset=utf-8'
    }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'woonpoints-eigen-wat-als-vergelijking.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const previewValid = showPreview?.source === currentSource && canCompare;
  const rentalHandoffValid = !!rentalHandoff && rentalHandoff.source === currentSource &&
    canCompare && !!onRentalPrefill &&
    ordered.some(item => item.listing.id === rentalHandoff.id &&
      item.listing.name === rentalHandoff.label &&
      woonMatchHandoffRent(item.listing.monthlyRent) === rentalHandoff.rent &&
      item.monthly === rentalHandoff.monthly &&
      item.pass === rentalHandoff.allOwnCriteriaMet &&
      item.score === rentalHandoff.score);
  const costHandoffValid = !!costHandoff && costHandoff.source === currentSource && canCompare &&
    !!onCostPrefill && costHandoff.first.listing.id !== costHandoff.second.listing.id &&
    ordered.some(item=>item.listing.id===costHandoff.first.listing.id &&
      item.listing.name===costHandoff.pair.first.label &&
      woonMatchHandoffRent(item.listing.monthlyRent)===costHandoff.pair.first.rent) &&
    ordered.some(item=>item.listing.id===costHandoff.second.listing.id &&
      item.listing.name===costHandoff.pair.second.label &&
      woonMatchHandoffRent(item.listing.monthlyRent)===costHandoff.pair.second.rent);
  const pendingCsvValid = !!pendingCsv && pendingCsv.source === currentSource && pendingCsv.paste === csvText;

  const appendCsvReason = !pendingCsvValid || !pendingCsv ? '' :
    listings.length + pendingCsv.rows.length > 5
      ? 'Toevoegen kan niet: je hebt samen meer dan vijf woningen; kies vervangen of verwijder eerst opties.'
      : (() => {
          const existingNames = listings.map(row => row.name.trim().toLocaleLowerCase('nl-NL'));
          if (existingNames.some(name => !name) || new Set(existingNames).size !== existingNames.length)
            return 'Toevoegen kan pas als alle bestaande opties een uniek, niet-leeg label hebben.';
          if (pendingCsv.rows.some(row => existingNames.includes(row.name.trim().toLocaleLowerCase('nl-NL'))))
            return 'Een toegevoegd label bestaat al in jouw huidige lijst. Geef de opties eerst unieke labels.';
          return '';
        })();

  const csvExport = woonMatchEncodeCsv(listings);
  const csvExportValid = !!csvExportPreview && csvExportPreview.source === currentSource &&
    !csvExport.error && csvExportPreview.text === csvExport.text;
  const downloadOwnCsv = () => {
    if (!csvExportValid || !csvExportApproved || !csvExportPreview) return;
    const url = URL.createObjectURL(new Blob([csvExportPreview.text], { type: 'text/csv;charset=utf-8' }));
    const element = document.createElement('a');
    element.href = url;
    element.download = 'woonpoints-eigen-woninglijst.csv';
    document.body.appendChild(element);
    element.click();
    element.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };


  // Reading is explicitly local and never accepts a document as a saved
  // listing. The pasted-content preview plus append/replace consent still apply.
  const openPrivateCsvFile = async (file: File | undefined) => {
    const serial = ++csvFileRead.current;
    setPendingCsv(null);
    setConfirmCsv(false);
    setConfirmCsvAppend(false);
    setCsvFileMessage('');
    if (!file) return;
    if (file.size > 4096) {
      setCsvFileMessage('Bestand geweigerd: maximaal 4 KiB UTF-8-tekst.');
      return;
    }
    try {
      const decoded = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (serial !== csvFileRead.current) return;
      const result = parsePrivateMatchCsv(decoded, 1);
      if (result.error) {
        setCsvFileMessage('Bestand geweigerd: ' + result.error + ' Je bestaande invoer blijft staan.');
        return;
      }
      setCsvText(decoded);
      setCsvError('');
      setCsvFileMessage('Eigen bestand lokaal geopend: ' + result.rows.length +
        ' woningoptie(s). Bekijk alle regels hieronder en bevestig toevoegen of vervangen afzonderlijk.');
    } catch {
      if (serial === csvFileRead.current) {
        setCsvFileMessage('Bestand niet leesbaar als geldige UTF-8. Je invoer bleef ongewijzigd.');
      }
    }
  };

  const previewPastedCsv = () => {
    setConfirmCsv(false);
    setConfirmCsvAppend(false);
    const result = parsePrivateMatchCsv(csvText, 1);
    setPendingCsv(result.error ? null : { rows: result.rows, source: currentSource, paste: csvText });
    setCsvError(result.error);
  };
  const acceptPastedCsv = () => {
    if (!pendingCsvValid || !confirmCsv || !pendingCsv || pendingCsv.rows.length < 2) return;
    const imported = pendingCsv.rows.map(row => ({ ...row, id: nextId.current++ }));
    setUndoRestore(null);
    setUndoCsv(listings.map(item => ({ ...item })));
    setListings(imported);
    setCsvText('');
    setPendingCsv(null);
    setConfirmCsv(false);
    setConfirmCsvAppend(false);
    setCsvError('Eigen woningopties vervangen. Vorige opties kun je één keer herstellen.');
    setShowPreview(null);
    setAllowDownload(false);
  };

  const appendPastedCsv = () => {
    if (!pendingCsvValid || !confirmCsvAppend || !pendingCsv || appendCsvReason) return;
    const imported = pendingCsv.rows.map(row => ({ ...row, id: nextId.current++ }));
    setUndoRestore(null);
    setUndoCsv(listings.map(item => ({ ...item })));
    setListings([...listings, ...imported]);
    setCsvText('');
    setPendingCsv(null);
    setConfirmCsv(false);
    setConfirmCsvAppend(false);
    setCsvError('Nieuwe eigen opties toegevoegd; bestaande opties behouden. Je kunt de toevoeging één keer terugdraaien.');
    setShowPreview(null);
    setAllowDownload(false);
  };
  const undoPastedCsv = () => {
    if (!undoCsv) return;
    setUndoRestore(null);
    setListings(undoCsv);
    setUndoCsv(null);
    setPendingCsv(null);
    setConfirmCsv(false);
    setConfirmCsvAppend(false);
    setCsvError('Vorige woningopties in dit tabblad teruggezet.');
    setShowPreview(null);
    setAllowDownload(false);
  };

  const downloadBackup = () => {
    if (!backupExportApproved || !backupPreviewValid || !backupPreview) return;
    const url = URL.createObjectURL(new Blob([backupPreview.text], { type: 'application/json;charset=utf-8' }));
    const element = document.createElement('a');
    element.href = url;
    element.download = 'woonpoints-prive-woningmatch-v2.json';
    document.body.appendChild(element);
    element.click();
    element.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const openBackupFile = async (file: File | undefined) => {
    const read = ++backupRead.current;
    setPendingRestore(null);
    setRestoreApproved(false);
    setRestoreMessage('');
    if (!file) return;
    if (file.size > WOON_MATCH_BACKUP_LIMIT) {
      setRestoreMessage('Bestand geweigerd: groter dan 12 KiB.');
      return;
    }
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (read !== backupRead.current) return;
      const result = woonMatchDecodeBackup(text);
      if (!result.data) {
        setRestoreMessage(result.error);
        return;
      }
      setPendingRestore({ source: currentSource, data: result.data, label: file.name.slice(0, 100) });
    } catch {
      if (read === backupRead.current) setRestoreMessage('Bestand niet leesbaar of niet geldig UTF-8.');
    }
  };
  const applyRestore = () => {
    if (!pendingRestore || !restoreApproved || !restorePreviewValid) return;
    const copy = pendingRestore.data;
    setUndoRestore({
      criteria: { ...criteria }, weights: { ...weights }, preference, listings: listings.map(item => ({ ...item }))
    });
    setCriteria({ ...copy.criteria });
    setWeights({ ...copy.weights });
    setPreference(copy.preference);
    setListings(copy.listings.map(item => ({ ...item, id: nextId.current++ })));
    setPendingRestore(null);
    setRestoreApproved(false);
    setRestoreMessage('De gekozen back-up is tijdelijk geopend. Je kunt de vorige sessie één keer terugzetten.');
    setUndoCsv(null);
    setCsvText('');
    setShowPreview(null);
    setBackupPreview(null);
    setBackupExportApproved(false);
    setAllowDownload(false);
  };
  const revertRestore = () => {
    if (!undoRestore) return;
    setCriteria(undoRestore.criteria);
    setWeights(undoRestore.weights);
    setPreference(undoRestore.preference);
    setListings(undoRestore.listings);
    setUndoRestore(null);
    setPendingRestore(null);
    setRestoreApproved(false);
    setRestoreMessage('Vorige invoer teruggezet.');
    setShowPreview(null);
    setBackupPreview(null);
    setBackupExportApproved(false);
    setAllowDownload(false);
  };

  const previewCostPair = () => {
    setCostApproved(false);setCostMessage('');
    const first=ordered.find(item=>item.listing.id===firstCostId);
    const second=ordered.find(item=>item.listing.id===secondCostId);
    if(!onCostPrefill||!canCompare||!first||!second||first.listing.id===second.listing.id||
      !woonMatchHandoffLabel(first.listing.name)||!woonMatchHandoffLabel(second.listing.name)||
      first.listing.name===second.listing.name){
      setCostHandoff(null);
      setCostMessage('Kies twee verschillende woningen met unieke labels van maximaal 64 tekens.');
      return;
    }
    const rentA=woonMatchHandoffRent(first.listing.monthlyRent);
    const rentB=woonMatchHandoffRent(second.listing.monthlyRent);
    if(rentA===null||rentB===null){
      setCostHandoff(null);
      setCostMessage('Voor de kostenvergelijker moeten beide kale huurbedragen hele eurobedragen tussen €100 en €10.000 zijn. Afronden gebeurt niet automatisch.');
      return;
    }
    setCostHandoff({source:currentSource,first,second,pair:{
      first:{label:first.listing.name,rent:rentA},
      second:{label:second.listing.name,rent:rentB}
    }});
  };
  const acceptCostPair = () => {
    if(!costHandoffValid||!costHandoff||!costApproved||!onCostPrefill)return;
    onCostPrefill({
      first:{...costHandoff.pair.first},second:{...costHandoff.pair.second}
    });
    setCostHandoff(null);setCostApproved(false);
    setCostMessage('Twee kale huren als momentopname aangeboden. Ga naar de bestaande kostenvergelijker en bevestig daar opnieuw vóór overschrijven.');
  };
  const previewRentalHandoff = (item: WoonMatchOutcome) => {
    setRentalApproved(false);
    setRentalMessage('');
    const rent = woonMatchHandoffRent(item.listing.monthlyRent);
    if (!canCompare || !onRentalPrefill || !woonMatchHandoffLabel(item.listing.name) ||
      rent === null || item.monthly === null || item.score === null) {
      setRentalHandoff(null);
      setRentalMessage('Dit woninglabel of de kale huur is niet geldig voor de huurvoorstellendesk. Gebruik een label van 1–64 tekens en een hele kale maandhuur tussen €100 en €10.000.');
      return;
    }
    setRentalHandoff({
      id: item.listing.id, source: currentSource,
      label: item.listing.name, rent, monthly: item.monthly,
      allOwnCriteriaMet: item.pass, score: item.score
    });
  };
  const acceptRentalHandoff = () => {
    if (!rentalHandoffValid || !rentalApproved || !rentalHandoff || !onRentalPrefill) return;
    onRentalPrefill({label:rentalHandoff.label,rent:rentalHandoff.rent});
    setRentalHandoff(null);
    setRentalApproved(false);
    setRentalMessage('Alleen jouw label en kale huur staan klaar bij Huurvoorstellen. Daar moet je opnieuw bevestigen, ontbrekende kosten invullen en het voorstel zelf bewaren.');
  };

  const makeReport = (): string => {
    const lines = [
      'WOONPOINTS · PRIVÉ WONINGVERGELIJKING', 'Eigen invoer; geen WoningNet-gegevens of officieel match-/toewijzingsadvies.',
      '', 'EIGEN GRENZEN',
      'Maximale maandkosten: ' + criteria.budget + ' EUR; minimaal oppervlak: ' + criteria.area + ' m²;',
      'Minimaal slaapkamers: ' + criteria.bedrooms + '; maximaal enkele-reisminuten: ' + criteria.commute,
      'Zelf gekozen relatieve wegingspunten (1=licht, 5=zwaar): ' +
        WOON_MATCH_PRIORITY_LABELS.map(entry => entry.label + ' ' + weights[entry.key]).join('; '),
      'Persoonlijke toewijzingsmethodevoorkeur: ' + WOON_MATCH_PREFERENCE_LABELS[preference] +
        ' (geen officiële aanbiedings- of toewijzingskans)',
      '', 'ZELF INGEVOERDE OPTIES (GEEN GECONTROLEERDE ADVERTENTIES)'
    ];
    ordered.forEach((item, index) => {
      lines.push('', String(index + 1) + '. ' + item.listing.name);
      lines.push('Indicatieve eigen totale maandkosten: ' + (item.monthly === null ? 'Onbekend' : WoonMatchMoney(item.monthly)));
      lines.push('Zelf ingevulde toewijzingsmethode: ' + WOON_MATCH_METHOD_LABELS[item.listing.allocation] +
        (preference === 'any' ? '' : ' · ' + (item.listing.allocation === 'unknown' ? 'methode niet geverifieerd' :
          item.listing.allocation === preference ? 'past bij eigen methodevoorkeur' : 'andere methode dan eigen voorkeur')));
      lines.push('Eigen voorwaarden: ' + (item.pass ? 'Alle vier gehaald' : 'Een of meer niet gehaald') +
        ' · gewogen indicatie ' + (item.score === null ? 'onvolledig' : item.score + '%') + ' (geen toewijzingskans)');
      item.rules.forEach(rule => lines.push(' - ' + rule.label + ': ' + (rule.met === null ? 'onbekend' : rule.met ? 'voldoet' : 'voldoet niet') +
        ' · ingevuld ' + String(rule.observed ?? '?') + ' / eigen grens ' + String(rule.required ?? '?') + ' (' + rule.detail + '; gewicht ' + rule.weight + ')' + (WoonMatchGap(rule) ? ' · verschil: ' + WoonMatchGap(rule) : '')));
      if (item.listing.note.trim()) lines.push('Eigen notitie: ' + item.listing.note.trim());
    });
    lines.push('', 'Alleen eigen getallen en notities. Niet gebruiken als bewijs van woninggeschiktheid, identiteit, inkomen of reservering.',
      'Er is niets verzonden, bewaard op een server of bij WoningNet geplaatst.');
    return lines.join('\n') + '\n';
  };
  const download = () => {
    if (!allowDownload || !previewValid || !showPreview) return;
    const blob = new Blob([showPreview.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'woonpoints-prive-woningvergelijking.txt';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  return (
    <div style={{ maxWidth: 1000, padding: '24px 18px 80px', margin: 'auto', color: '#16342f', fontFamily: 'system-ui, sans-serif', lineHeight: 1.55 }}>
      <a href="#housing-shortlist-heading" style={{ color: '#075e57' }}>← Naar woningen vergelijken</a>
      <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 8 }}>Mijn woningmatch · privé vergelijker</h2>
      <p>Vergelijk twee tot vijf <strong>zelf ingevulde</strong> woningopties met vier persoonlijke grenzen. De score is alleen een
        gewogen uitleg van jouw criteria, <strong>geen officiële matchkans, woningcheck of verhuurdersbeslissing</strong>.</p>
      <p style={{ borderLeft: '4px solid #0b7669', paddingLeft: 12 }}>Alle gegevens blijven in dit browsertabblad. Geen accountkoppeling,
        tracking, WoningNet-login, woningreactie, automatische opslag of netwerkverzoek door deze vergelijker.</p>

      <section aria-labelledby="criteria-heading" style={WoonMatchPanelStyle}>
        <h2 id="criteria-heading">1. Stel je eigen grenzen in</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          <WoonMatchField label="Max. maandkosten (€)" value={criteria.budget} setValue={v => changeCriteria('budget', v)} placeholder="Bijv. 1050" />
          <WoonMatchField label="Min. woonoppervlak (m²)" value={criteria.area} setValue={v => changeCriteria('area', v)} placeholder="Bijv. 55" />
          <WoonMatchField label="Min. slaapkamers" value={criteria.bedrooms} setValue={v => changeCriteria('bedrooms', v)} placeholder="Bijv. 1" />
          <WoonMatchField label="Max. enkele-reisminuten" value={criteria.commute} setValue={v => changeCriteria('commute', v)} placeholder="Bijv. 45" />
        </div>
        <fieldset style={{ marginTop: 20, border: '1px solid #c1d7d0', borderRadius: 9, padding: 12 }}>
          <legend style={{ fontWeight: 700 }}>Wat telt voor mij het zwaarst?</legend>
          <p style={{ marginTop: 0, fontSize: 14 }}>Stel per criterium een gewicht van 1 (licht) tot 5 (zwaar) in.
            Alle vier eigen grenzen blijven harde voorwaarden, ook als een gewicht laag is.
            Startwaarden: geld 4, oppervlak 3, slaapkamers 2, reistijd 2.</p>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
            {WOON_MATCH_PRIORITY_LABELS.map(entry => <label key={entry.key} style={{ display: 'block', fontWeight: 650, fontSize: 14 }}>
              <span style={{ display: 'block', marginBottom: 5 }}>{entry.label}</span>
              <select style={WoonMatchInputStyle} value={weights[entry.key]} onChange={event => {
                const next = Number(event.currentTarget.value);
                if (Number.isInteger(next) && next >= 1 && next <= 5) {
                  setUndoRestore(null);
                  setWeights(prev => ({ ...prev, [entry.key]: next }));
                }
              }}>
                {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>
                  {value} — {value === 1 ? 'licht' : value === 5 ? 'zwaar' : 'gemiddeld'}
                </option>)}
              </select>
            </label>)}
          </div>
          <button type="button" style={{ marginTop: 12 }} onClick={() => { setUndoRestore(null); setWeights({ ...WOON_MATCH_DEFAULT_WEIGHTS }); }}>
            Herstel startweging
          </button>
        </fieldset>
        <label style={{ display: 'block', marginTop: 16, fontWeight: 700 }}>
          Mijn persoonlijke voorkeur voor toewijzingsmethode
          <select style={{ ...WoonMatchInputStyle, marginTop: 6 }} value={preference}
            onChange={event => { setUndoRestore(null); setPreference(event.target.value as WoonMatchPreference); }}>
            <option value="any">Geen methodevoorkeur</option>
            <option value="lottery">Loting</option>
            <option value="queue">Inschrijfduur</option>
          </select>
        </label>
        <p style={{ fontSize: 14 }}>Alleen je eigen inschatting: Woonpoints haalt geen WoningNet-advertenties,
          scores of officiële toewijzingskansen op. Methodevoorkeur is alleen een zichtbare sortering
          bij een <strong>gelijke eigen criteriascore</strong> en kan geen onvoldoende harde grens verbergen.</p>
        <p style={{ marginBottom: 0, fontSize: 14 }}>De expliciete gewichten bepalen alleen de indicatieve
          percentages en de volgorde van woningen die niet aan alle voorwaarden voldoen.
          Niets hiervan is een voorspelling van woningtoewijzing.</p>
      </section>

      <section aria-labelledby="options-heading">
        <h2 id="options-heading">2. Vul je opties in</h2>
        {listings.map((row, index) => (
          <article key={row.id} style={WoonMatchPanelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
              <h3 style={{ marginTop: 0 }}>Optie {index + 1}</h3>
              <button type="button" disabled={listings.length <= 2} onClick={() => { setUndoRestore(null); setUndoCsv(null); setListings(prev => prev.filter(item => item.id !== row.id)); }}>Verwijder</button>
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              <WoonMatchField label="Naam of eigen label (zonder adres)" value={row.name} setValue={v => changeListing(row.id, 'name', v)} maxLength={80} placeholder="Woning A" />
              <WoonMatchField label="Kale maandhuur (€)" value={row.monthlyRent} setValue={v => changeListing(row.id, 'monthlyRent', v)} placeholder="820" />
              <WoonMatchField label="Overige maandlasten (€)" value={row.utilities} setValue={v => changeListing(row.id, 'utilities', v)} placeholder="230,50" />
              <WoonMatchField label="Woonoppervlak (m²)" value={row.area} setValue={v => changeListing(row.id, 'area', v)} placeholder="62" />
              <WoonMatchField label="Slaapkamers" value={row.bedrooms} setValue={v => changeListing(row.id, 'bedrooms', v)} placeholder="2" />
              <WoonMatchField label="Reistijd enkele reis (min)" value={row.commute} setValue={v => changeListing(row.id, 'commute', v)} placeholder="32" />
              <label style={{ fontSize: 14, fontWeight: 650 }}>Zelf genoteerde methode
                <select style={{ ...WoonMatchInputStyle, marginTop: 6 }} value={row.allocation}
                  onChange={event => changeListing(row.id, 'allocation', event.target.value as WoonMatchAllocation)}>
                  <option value="unknown">Onbekend / nog controleren</option>
                  <option value="lottery">Loting — eigen notitie</option>
                  <option value="queue">Inschrijfduur — eigen notitie</option>
                </select>
              </label>
            </div>
            <div style={{ marginTop: 12 }}>
              <WoonMatchField label="Eigen notitie (maximaal 200 tekens; geen privé-adres)" value={row.note} setValue={v => changeListing(row.id, 'note', v)} maxLength={200} placeholder="Bijvoorbeeld: eerst bellen voor bezichtiging" />
            </div>
          </article>
        ))}
        <button type="button" disabled={listings.length >= 5} onClick={() => { setUndoRestore(null); setUndoCsv(null); setListings(prev => [...prev, WoonMatchBlank(nextId.current++)]); }}
          style={{ padding: '10px 16px', border: '1px solid #075e57', borderRadius: 7, background: '#f2faf7' }}>
          + Woningoptie toevoegen ({listings.length}/5)
        </button>
      </section>

      <section style={{ ...WoonMatchPanelStyle, marginTop: 22 }} aria-labelledby="csv-intake-heading">
        <h2 id="csv-intake-heading">Optioneel: eigen woninglijst plakken of lokaal openen</h2>
        <p>Gebruik een zelf gemaakt, puntkomma-gescheiden tekstlijstje. Maximaal 4 KiB; één tot vijf bij toevoegen, twee tot vijf bij vervangen;
          kolommen en volgorde liggen vast. Dit is geen advertentie-import, linkbezoek of accountkoppeling.
          <strong> Kies liever eigen labels dan adressen.</strong></p>
        <p><code style={{ overflowWrap: 'anywhere' }}>{WOON_MATCH_CSV_HEADER}</code></p>
        <label style={{ display: 'block', margin: '12px 0', fontWeight: 650 }}>
          Open mijn eigen CSV-bestand op dit apparaat (max. 4 KiB, UTF-8)
          <input type="file" accept=".csv,text/csv,text/plain" style={{ display: 'block', marginTop: 8 }}
            onChange={event => {
              const selected = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              void openPrivateCsvFile(selected);
            }} />
        </label>
        <p style={{ fontSize: 13 }}>
          Alleen lokale bestandslezing in dit tabblad; niets wordt verzonden of opgeslagen.
          Een geldig bestand vult uitsluitend onderstaande bewerkbare tekst in.
          Daarna moet je zelf alle regels bekijken en apart bevestigen of je toevoegt of vervangt.
          Kies bij voorkeur labels zonder straatadres of andere persoonlijke gegevens.
        </p>
        {csvFileMessage && <p role="status">{csvFileMessage}</p>}
        <label style={{ display: 'block', fontWeight: 650 }} htmlFor="woonmatch-paste">Eigen tekst (één woning per regel)</label>
        <textarea id="woonmatch-paste" rows={5} maxLength={4096} value={csvText}
          onChange={event => { csvFileRead.current += 1; setCsvFileMessage(''); setCsvText(event.target.value); setPendingCsv(null); setConfirmCsv(false); setConfirmCsvAppend(false); setCsvError(''); }}
          placeholder={'label;kale_huur;extra_maandlasten;m2;slaapkamers;reistijd_min;notitie\nWoning A;800;190;60;1;30;zelf bekijken\nWoning B;880;210;75;2;45;'}
          style={{ ...WoonMatchInputStyle, fontFamily: 'ui-monospace, monospace', resize: 'vertical' }} />
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={previewPastedCsv}>Bekijk alle eigen woningopties vóór toevoegen of vervangen</button>
        </div>
        {csvError && <p role="status">{csvError}</p>}
        {pendingCsv && !pendingCsvValid && <p role="status">De preview is vervallen omdat de invoer of woninglijst veranderde.</p>}
        {pendingCsv && pendingCsvValid && <>
          <h3>Voorbeeld — kies bewust vervangen of toevoegen</h3>
          <p>Je huidige {listings.length} opties veranderen pas bij afzonderlijke bevestiging van één van beide handelingen.</p>
          <p>Vanuit deze zeven-koloms tekst kan geen betrouwbare toewijzingsmethode worden afgeleid.
            Voor alle geplakte woningen wordt die daarom op <strong>Onbekend</strong> gezet.</p>
          <ol>{pendingCsv.rows.map((row, index) => <li key={index}>
            {row.name} · kale huur € {row.monthlyRent}, overige maandlasten € {row.utilities},
            {' '}{row.area} m², {row.bedrooms} slaapkamers, {row.commute} minuten;
            {' '}{row.note || 'geen notitie'}
          </li>)}</ol>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={confirmCsv} onChange={event => setConfirmCsv(event.target.checked)} />
            {' '}Ik heb alle regels bekeken; vervang alleen mijn huidige tijdelijke opties in dit tabblad.
          </label>
          {pendingCsv.rows.length < 2 && <p role="status">Volledig vervangen kan alleen met minimaal twee regels. Eén regel kun je wel toevoegen aan je huidige lijst.</p>}
          <button type="button" disabled={!confirmCsv || pendingCsv.rows.length < 2} onClick={acceptPastedCsv}>Vervang met deze bekeken opties</button>

          <div style={{ marginTop: 18, borderTop: '1px solid #ccdcd7', paddingTop: 12 }}>
            <h4>Of: veilig toevoegen zonder bestaande woningen te vervangen</h4>
            {appendCsvReason ? <p role="status">{appendCsvReason}</p> : <p>
              Voorbeeld: {listings.length} bestaande + {pendingCsv.rows.length} nieuwe =
              {' '}{listings.length + pendingCsv.rows.length} afzonderlijke woningopties.
              Je huidige criteria, prioriteiten, methoden en notities blijven behouden;
              uitsluitend nieuwe opties krijgen methode <strong>Onbekend</strong>.
            </p>}
            <label style={{ display: 'block', marginBottom: 12 }}>
              <input type="checkbox" disabled={!!appendCsvReason} checked={confirmCsvAppend}
                onChange={event => setConfirmCsvAppend(event.target.checked)} />
              {' '}Ik wil deze bekeken {pendingCsv.rows.length} unieke opties toevoegen zonder
              iets te overschrijven; ik behoud alle bestaande opties.
            </label>
            <button type="button" disabled={!!appendCsvReason || !confirmCsvAppend}
              onClick={appendPastedCsv}>Voeg deze bekeken opties toe</button>
          </div>
        </>}
        {undoCsv && <p><button type="button" onClick={undoPastedCsv}>
          Draai de laatste CSV-vervanging of -toevoeging één keer terug
        </button></p>}

        <div style={{ borderTop: '1px solid #ccdcd7', marginTop: 22, paddingTop: 16 }}>
          <h3>Mijn zevenkoloms woninglijst zelf exporteren</h3>
          <p>Maak van je <strong>eigen</strong> twee tot vijf opties hetzelfde puntkommaformaat als hierboven.
            Bekijk de volledige tekst en geef apart toestemming vóór lokaal downloaden.
            <strong> Dit compacte formaat bevat geen toewijzingsmethode, methodevoorkeur,
              prioriteiten of persoonlijke grenzen.</strong> Bij opnieuw plakken is iedere methode
            daarom weer <em>Onbekend</em>. Gebruik de volledige JSON-back-up hieronder
            om ook deze gegevens te behouden.</p>
          {csvExport.error ? <p role="status">{csvExport.error}</p> : null}
          <button type="button" disabled={!!csvExport.error} onClick={() => {
            setCsvExportPreview({ source: currentSource, text: csvExport.text });
            setCsvExportApproved(false);
          }}>Bekijk volledige eigen CSV vóór downloaden</button>
          {csvExportPreview && !csvExportValid && <p role="status">
            De CSV-preview is ongeldig geworden doordat je brongegevens veranderd zijn.
            Bekijk de actuele woninglijst opnieuw.
          </p>}
          {csvExportValid && csvExportPreview && <div style={{ marginTop: 12 }}>
            <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 240,
              overflow: 'auto', padding: 14, background: '#f2faf7', borderRadius: 8 }}>{csvExportPreview.text}</pre>
            <label style={{ display: 'block', marginBottom: 12 }}>
              <input type="checkbox" checked={csvExportApproved}
                onChange={event => setCsvExportApproved(event.target.checked)} />
              {' '}Ik heb alle zeven kolommen en het verlies van methodegegevens bekeken.
              Ik wil deze privétekst zelf lokaal bewaren.
            </label>
            <button type="button" disabled={!csvExportApproved} onClick={downloadOwnCsv}>
              Download deze bekeken CSV
            </button>
          </div>}
        </div>
      </section>

      <section style={{ ...WoonMatchPanelStyle, marginTop: 22 }} aria-labelledby="result-heading">
        <h2 id="result-heading">3. Mijn uitlegbare vergelijking</h2>
        {!canCompare ? (
          <div role="status">
            <p>De vergelijking verschijnt pas wanneer alle vier criteria en alle verplichte gegevens van iedere optie geldig zijn.
              Blanco/ongeldige velden tellen niet als nul of als een goede match.</p>
            <ul>{[...criteriaErrors, ...fieldErrors].slice(0, 25).map((error, index) => <li key={index}>{error}</li>)}</ul>
          </div>
        ) : (
          <div aria-live="polite">
            <p>Gerangschikt op het behalen van <strong>alle vier</strong> eigen voorwaarden, daarna op gewogen criteria
              en pas bij gelijke score op je <strong>eigen methodevoorkeur</strong>.
              Onbekende toewijzingsmethode blijft expliciet onbekend; dit is geen woningtoewijzingskans.</p>
            {ordered.map((outcome, index) => (
              <article key={outcome.listing.id} style={{ borderTop: '1px solid #ccdcd7', padding: '12px 0' }}>
                <h3 style={{ marginBottom: 4 }}>{index + 1}. {outcome.listing.name}</h3>
                <strong>{outcome.pass ? 'Alle 4 eigen grenzen gehaald' : outcome.met + ' van 4 grenzen gehaald'}</strong>
                <p style={{ marginTop: 4 }}>Gewogen criteriascore: {outcome.score}% · Geschatte maandlasten: {outcome.monthly === null ? 'Onbekend' : WoonMatchMoney(outcome.monthly)}</p>
                <p>Zelf ingevulde methode: <strong>{WOON_MATCH_METHOD_LABELS[outcome.listing.allocation]}</strong>.
                  {preference === 'any' ? ' Geen specifieke methodevoorkeur.' :
                    outcome.listing.allocation === 'unknown' ? ' Methode nog niet vastgesteld.' :
                    outcome.listing.allocation === preference ? ' Past bij je methodevoorkeur.' : ' Wijkt af van je methodevoorkeur.'}
                </p>
                <ul>{outcome.rules.map(rule => <li key={rule.label}>
                  {rule.met ? '✓' : '✕'} {rule.label}: {rule.met ? 'voldoet' : 'voldoet niet'} ({String(rule.observed)} versus eigen grens {String(rule.required)}; {rule.detail}; gewicht {rule.weight}){WoonMatchGap(rule) ? <> — <strong>Verschil: {WoonMatchGap(rule)}</strong></> : null}
                </li>)}</ul>
                <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:10}}>
                  <button type="button" onClick={()=>{
                    setFirstCostId(outcome.listing.id);
                    if(secondCostId===outcome.listing.id)setSecondCostId(null);
                    setCostHandoff(null);setCostApproved(false);
                  }} aria-pressed={firstCostId===outcome.listing.id}>
                    {firstCostId===outcome.listing.id?'✓ Als kostenwoning A':'Kies als kostenwoning A'}
                  </button>
                  <button type="button" onClick={()=>{
                    setSecondCostId(outcome.listing.id);
                    if(firstCostId===outcome.listing.id)setFirstCostId(null);
                    setCostHandoff(null);setCostApproved(false);
                  }} aria-pressed={secondCostId===outcome.listing.id}>
                    {secondCostId===outcome.listing.id?'✓ Als kostenwoning B':'Kies als kostenwoning B'}
                  </button>
                </div>
                <button type="button" disabled={!onRentalPrefill}
                  onClick={() => previewRentalHandoff(outcome)}
                  style={{ padding: '9px 12px', borderRadius: 6, border: '1px solid #1b6c5f' }}>
                  Bekijk overname naar eigen huurvoorstel…
                </button>
                {!woonMatchHandoffLabel(outcome.listing.name) ||
                 woonMatchHandoffRent(outcome.listing.monthlyRent) === null ?
                  <p style={{fontSize:13}}>Voor de huurdesk is een label van 1–64 tekens en een hele kale huur
                    van €100–€10.000 vereist. De woning blijft wel in deze vergelijking staan.</p> : null}
              </article>
            ))}
            <section aria-labelledby="woonmatch-cost-pair-title"
              style={{borderTop:'1px solid #ccdcd7',padding:'14px 0'}}>
              <h3 id="woonmatch-cost-pair-title">Twee woningmatches naar de echte kostenvergelijking</h3>
              <p>Kies hierboven bewust één optie als <strong>A</strong> en een andere als <strong>B</strong>.
                Bekijk ze samen voordat je alleen de twee zelf genoteerde labels en <strong>kale huren</strong>
                als onopgeslagen voorstel aan de kostenvergelijker doorgeeft. Service, energie,
                vervoer en startkosten worden daar <strong>niet</strong> overgenomen of geraden.</p>
              <p>Geselecteerd: A — {ordered.find(x=>x.listing.id===firstCostId)?.listing.name||'nog niet gekozen'}
                {' '}· B — {ordered.find(x=>x.listing.id===secondCostId)?.listing.name||'nog niet gekozen'}</p>
              <button type="button" disabled={!onCostPrefill||firstCostId===null||secondCostId===null}
                onClick={previewCostPair}>Bekijk twee kale huren vóór overname…</button>
              {costMessage && <p role="status">{costMessage}
                {costMessage.startsWith('Twee kale huren') &&
                  <> <a href="#private-budget-title">Ga naar kostenvergelijking ↓</a></>}</p>}
              {costHandoff && !costHandoffValid && <p role="status">
                Deze preview is vervallen omdat je brongegevens veranderden. Bekijk eerst een actuele selectie.
              </p>}
              {costHandoff && costHandoffValid && <div style={{background:'#f2faf7',padding:14,marginTop:12,borderRadius:8}}>
                <p><strong>Overdrachtsvoorbeeld (onopgeslagen)</strong></p>
                <ul>
                  <li>A: {costHandoff.pair.first.label} · kale huur {WoonMatchMoney(costHandoff.pair.first.rent)}
                    {' '}· {costHandoff.first.met} van 4 eigen grenzen gehaald; score {costHandoff.first.score}%</li>
                  <li>B: {costHandoff.pair.second.label} · kale huur {WoonMatchMoney(costHandoff.pair.second.rent)}
                    {' '}· {costHandoff.second.met} van 4 eigen grenzen gehaald; score {costHandoff.second.score}%</li>
                </ul>
                <p>De hier getoonde scores en ontbrekende andere maandkosten gaan <strong>niet mee</strong>.
                  De bestemmingsdesk vraagt apart toestemming om jouw twee bestaande tijdelijke
                  kostenscenario&apos;s te vervangen en zal geen onbekende bedragen verzinnen.</p>
                <label style={{display:'block',marginBottom:12}}>
                  <input type="checkbox" checked={costApproved}
                    onChange={event=>setCostApproved(event.target.checked)} />
                  {' '}Ik wil uitsluitend de twee labels en kale huurbedragen aanbieden voor een
                  <em> aparte, nog te bevestigen </em>kostenvergelijking.
                </label>
                <button type="button" disabled={!costApproved} onClick={acceptCostPair}>
                  Ja, bereid deze twee kostenwoningen voor
                </button>{' '}
                <button type="button" onClick={()=>{setCostHandoff(null);setCostApproved(false);
                  setCostMessage('Niet overgenomen. Je woonvergelijking is ongewijzigd.');}}>
                  Annuleren
                </button>
              </div>}
            </section>
            <section aria-labelledby="woonmatch-rental-handoff-title" style={{borderTop:'1px solid #ccdcd7',paddingTop:14}}>
              <h3 id="woonmatch-rental-handoff-title">Bewust overnemen naar Huurvoorstellen</h3>
              <p>Neem uitsluitend een zelf ingevuld <strong>woninglabel en kale huur</strong> over als tijdelijk
                kopieervoorstel. Geen score, toewijzingsmethode, servicekosten, energie, borg, adres,
                identiteit of officieel aanbiedingsbewijs wordt meegestuurd.</p>
              {rentalMessage && <p role="status">{rentalMessage}
                {rentalMessage.startsWith('Alleen jouw label') &&
                  <> <a href="#offer-desk-heading">Ga naar Huurvoorstellen ↓</a></>}
              </p>}
              {rentalHandoff && !rentalHandoffValid && <p role="status">
                Deze preview is vervallen omdat je woninggegevens of criteria veranderd zijn. Maak een nieuwe preview.
              </p>}
              {rentalHandoff && rentalHandoffValid && <div style={{background:'#f2faf7',padding:14,borderRadius:8}}>
                <p><strong>Preview:</strong> {rentalHandoff.label}; kale huur
                  {' '}{WoonMatchMoney(rentalHandoff.rent)} per maand.
                  Geschatte totale eigen maandlasten: {WoonMatchMoney(rentalHandoff.monthly)}
                  {' '}— dit tweede bedrag <strong>gaat niet mee</strong>.</p>
                <p>{rentalHandoff.allOwnCriteriaMet
                  ? 'Deze optie haalt jouw vier persoonlijke grenzen.'
                  : 'Let op: deze optie haalt niet alle vier jouw persoonlijke grenzen.'}
                  {' '}De matchscore van {rentalHandoff.score}% is geen toewijzingskans en wordt niet
                  als bewijs of contractgegeven overgenomen.</p>
                <label style={{display:'block',marginBottom:12}}>
                  <input type="checkbox" checked={rentalApproved}
                    onChange={event=>setRentalApproved(event.target.checked)} />
                  {' '}Ik wil alleen dit zelf ingevulde label en deze kale huur als <em>onopgeslagen voorstel</em>
                  {' '}doorgeven. De huurdesk vraagt nog een tweede bevestiging.
                </label>
                <button type="button" disabled={!rentalApproved} onClick={acceptRentalHandoff}>
                  Ja, bereid dit onopgeslagen huurvoorstel voor
                </button>{' '}
                <button type="button" onClick={()=>{
                  setRentalHandoff(null);setRentalApproved(false);
                  setRentalMessage('Niet overgenomen. Je woningvergelijking is ongewijzigd.');
                }}>Annuleren</button>
              </div>}
            </section>
          </div>
        )}
      </section>


      <section style={WoonMatchPanelStyle} aria-labelledby="woonmatch-whatif-heading">
        <h2 id="woonmatch-whatif-heading">4. Wat verandert er als mijn grenzen anders zijn?</h2>
        <p>Vergelijk veilig één hypothetisch scenario met je oorspronkelijke vier persoonlijke grenzen.
          Je echte criteria, weging, woninggegevens, back-up, TXT en overdrachten blijven intact.
          Dit is alleen een eigen rekenscenario, <strong>geen woningadvies of toewijzingskans</strong>.</p>
        <button type="button" disabled={!canCompare} onClick={() => { scenarioGeneration.current++; setScenarioReportPreview(null); setScenarioReportApproved(false); setWhatIf({ source: currentSource, limits: { ...criteria } }); }}>
          {whatIf ? 'Begin nieuw scenario met mijn actuele grenzen' : 'Begin eigen wat-als-scenario'}
        </button>
        {whatIf && !whatIfCurrent && <p role="status">
          Je oorspronkelijke gegevens zijn veranderd. Het oude scenario is vervallen; begin hierboven opnieuw.
        </p>}
        {whatIfCurrent && whatIf && <>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginTop: 14 }}>
            <WoonMatchField label="Scenario: max. maandkosten (€)" value={whatIf.limits.budget}
              setValue={value => modifyScenario('budget', value)} />
            <WoonMatchField label="Scenario: min. woonoppervlak (m²)" value={whatIf.limits.area}
              setValue={value => modifyScenario('area', value)} />
            <WoonMatchField label="Scenario: min. slaapkamers" value={whatIf.limits.bedrooms}
              setValue={value => modifyScenario('bedrooms', value)} />
            <WoonMatchField label="Scenario: max. enkele-reisminuten" value={whatIf.limits.commute}
              setValue={value => modifyScenario('commute', value)} />
          </div>
          {whatIfErrors.length > 0 ? <div role="status">
            <p>Vul geldige scenariogrenzen in; ongeldige invoer produceert geen nieuwe rangschikking.</p>
            <ul>{whatIfErrors.map((error,index) => <li key={index}>{error}</li>)}</ul>
          </div> : <div aria-live="polite" style={{ marginTop: 14 }}>
            <p><strong>Nu volledig passend:</strong> {ordered.filter(row => row.pass).length} van {ordered.length}.
              {' '}<strong>In dit scenario:</strong> {scenarioOrdered.filter(row => row.pass).length} van {scenarioOrdered.length}.
              {' '}Alle vier grenzen blijven ook in het scenario harde voorwaarden.</p>
            <ol>{scenarioOrdered.map((row, index) => {
              const original = ordered.find(item => item.listing.id === row.listing.id)!;
              const originalRank = ordered.findIndex(item => item.listing.id === row.listing.id) + 1;
              return <li key={row.listing.id} style={{ marginBottom: 12 }}>
                <strong>{row.listing.name}</strong> — oorspronkelijke plaats {originalRank}, scenarioplaats {index + 1}.
                {' '}{original.met}/4 naar {row.met}/4 eigen grenzen gehaald;
                {' '}score {original.score}% → {row.score}%.
                <strong> {row.pass ? 'Alle vier in scenario gehaald.' : 'Niet alle vier gehaald.'}</strong>
                {!row.pass && <ul>{row.rules.filter(rule => !rule.met).map(rule =>
                  <li key={rule.label}>{rule.label}: {WoonMatchGap(rule) || 'grens niet gehaald'}</li>)}</ul>}
              </li>;
            })}</ol>
            <p style={{ fontSize: 14 }}>Er is niets overgenomen, opgeslagen, verstuurd of in je werkblad aangepast.
              Gebruik de echte vergelijking hierboven voor bewuste vervolgacties.</p>
          </div>}

          <div style={{ borderTop: '1px solid #cfdcd7', paddingTop: 16, marginTop: 18 }}>
            <h3>Mijn wat-als-vergelijking als apart privé-TXT</h3>
            <p>Bekijk de <strong>volledige hypothetische vergelijking</strong> inclusief jouw
              oorspronkelijke en aangepaste grenzen, scores, rangorde en resterende tekorten.
              Je reguliere TXT, JSON-back-up en kosten- of huurvoorstellen blijven ongewijzigd.
              Dit is geen gecontroleerde woninginformatie of toewijzingsadvies.</p>
            <button type="button" disabled={whatIfErrors.length > 0 || !scenarioOrdered.length}
              onClick={() => {
                const text = buildScenarioReport();
                setScenarioReportPreview({ source: scenarioKey, text });
                setScenarioReportApproved(false);
              }}>
              Bekijk mijn volledige hypothetische privé-TXT
            </button>
            {scenarioReportPreview && !scenarioPreviewValid && <p role="status">
              De scenario-preview is verlopen. Bekijk de huidige inhoud opnieuw.
            </p>}
            {scenarioPreviewValid && scenarioReportPreview && <>
              <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 320,
                overflow: 'auto', padding: 14, background: '#f2faf7', borderRadius: 8 }}>
                {scenarioReportPreview.text}
              </pre>
              <label style={{ display: 'block', margin: '12px 0' }}>
                <input type="checkbox" checked={scenarioReportApproved}
                  onChange={event => setScenarioReportApproved(event.target.checked)} />
                {' '}Ik heb dit volledige hypothetische privédocument nagelezen
                en wil het zelf lokaal bewaren.
              </label>
              <button type="button" disabled={!scenarioReportApproved} onClick={downloadScenarioReport}>
                Download alleen deze bekeken wat-als-TXT
              </button>
            </>}
          </div>
          <button type="button" onClick={closeScenario}>Sluit scenario zonder overnemen</button>
        </>}
      </section>

      <section style={WoonMatchPanelStyle} aria-labelledby="export-heading">
        <h2 id="export-heading">5. Privérapport bekijken en downloaden</h2>
        <p>De optionele tekst bevat alleen jouw zelf ingevoerde labels, bedragen, criteria en notities.
          Bekijk de volledige inhoud vóór je deze bewust lokaal opslaat. Veranderen van invoer maakt een vorige preview ongeldig.</p>
        <button type="button" disabled={!canCompare} onClick={() => { setShowPreview({ source: currentSource, text: makeReport() }); setAllowDownload(false); }}>
          Volledige privé-TXT bekijken
        </button>
        {showPreview && !previewValid && <p role="status">De preview is verouderd. Bekijk eerst de gewijzigde inhoud opnieuw.</p>}
        {showPreview && previewValid && <>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 380, overflowY: 'auto', background: '#f2faf7', padding: 14, borderRadius: 8 }}>{showPreview.text}</pre>
          <label style={{ display: 'block', margin: '12px 0' }}>
            <input type="checkbox" checked={allowDownload} onChange={e => setAllowDownload(e.target.checked)} /> Ik heb dit volledige privédocument nagelezen en wil het zelf downloaden.
          </label>
          <button type="button" disabled={!allowDownload} onClick={download}>Download eigen TXT</button>
        </>}
      </section>

      <section style={WoonMatchPanelStyle} aria-labelledby="backup-match-heading">
        <h2 id="backup-match-heading">6. Mijn eigen woningmatch bewaren en terugzetten</h2>
        <p>Bewaar je zelf ingevoerde criteria, prioriteiten, woningopties en notities in een
          <strong> lokale JSON-back-up</strong> voor een volgende sessie. Ook onvolledige maar geldig geschreven concepten mogen mee.
          Het formaat bevat geen account-, cookies-, WoningNet- of bronrechtengegevens.
          Jouw gekozen opslaglocatie kan buiten Woonpoints synchroniseren.</p>
        <button type="button" disabled={!backupSourceValid} onClick={() => {
          setBackupPreview({ source: currentSource, text: portableBackupText });
          setBackupExportApproved(false);
        }}>Bekijk mijn volledige privé-JSON</button>
        {backupPreview && !backupPreviewValid && <p role="status">Je invoer veranderde; bekijk de actuele JSON eerst opnieuw.</p>}
        {backupPreview && backupPreviewValid && <>
          <pre style={{ maxHeight: 260, overflow: 'auto', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
            padding: 14, background: '#f2faf7', borderRadius: 7 }}>{backupPreview.text}</pre>
          <label style={{ display: 'block', margin: '12px 0' }}>
            <input type="checkbox" checked={backupExportApproved}
              onChange={event => setBackupExportApproved(event.target.checked)} />
            {' '}Ik heb alle velden bekeken en wil deze privé-JSON zelf lokaal downloaden.
          </label>
          <button type="button" disabled={!backupExportApproved} onClick={downloadBackup}>Download bekeken JSON</button>
        </>}
        <h3>Mijn eerdere privé-JSON terugzetten</h3>
        <p>Selecteer een eigen <code>woonpoints.private-match.v2</code> JSON, of je eerdere <code>v1</code>-back-up (maximaal 12 KiB).
          Oude v1-bestanden krijgen alleen een onbekende methode en geen methodevoorkeur: geen uitgevonden bronbewijs. Er wordt niets geüpload; onbekende velden en versies worden geweigerd.
          Je huidige invoer verandert pas na volledige preview en afzonderlijke bevestiging.</p>
        <input type="file" accept=".json,application/json"
          aria-label="Open eigen woningmatch-back-up" onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            void openBackupFile(file);
          }} />
        {restoreMessage && <p role="status">{restoreMessage}</p>}
        {pendingRestore && !restorePreviewValid && <p role="status">De restore-preview is verouderd: de huidige invoer is veranderd.</p>}
        {pendingRestore && restorePreviewValid && <div style={{ background: '#f2faf7', padding: 14, borderRadius: 8, marginTop: 12 }}>
          <p><strong>Volledig herstelvoorbeeld:</strong> {pendingRestore.label} · {pendingRestore.data.listings.length}
            {' '}opties. Je huidige {listings.length} opties en alle vier eigen grenzen/gewichten worden vervangen.</p>
          <p>Eigen grenzen:
            {' '}max €{pendingRestore.data.criteria.budget || 'onbekend'} per maand,
            {' '}min {pendingRestore.data.criteria.area || '?'} m²,
            {' '}min {pendingRestore.data.criteria.bedrooms || '?'} kamers,
            {' '}max {pendingRestore.data.criteria.commute || '?'} minuten.
          </p>
          <p>Prioriteiten: {WOON_MATCH_PRIORITY_LABELS.map(x => x.label + ' ' + pendingRestore.data.weights[x.key]).join(' · ')}</p>
          <p>Eigen methodevoorkeur: {WOON_MATCH_PREFERENCE_LABELS[pendingRestore.data.preference]}.</p>
          <ul>{pendingRestore.data.listings.map((row,index) => <li key={index}>
            <strong>{row.name || '(concept zonder naam)'}</strong> — huur {row.monthlyRent || '?'},
            {' '}extra {row.utilities || '?'}, {row.area || '?'} m², {row.bedrooms || '?'} slaapkamers,
            {' '}{row.commute || '?'} min; methode: {WOON_MATCH_METHOD_LABELS[row.allocation]}; notitie: {row.note || '(leeg)'}
          </li>)}</ul>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <input type="checkbox" checked={restoreApproved} onChange={event => setRestoreApproved(event.target.checked)} />
            {' '}Ik heb alle waarden bekeken; vervang alleen de tijdelijke invoer in dit tabblad.
          </label>
          <button type="button" disabled={!restoreApproved} onClick={applyRestore}>Zet deze privémomentopname terug</button>
          <button type="button" style={{ marginLeft: 10 }} onClick={() => {
            backupRead.current++;
            setPendingRestore(null);
            setRestoreApproved(false);
            setRestoreMessage('Herstel geannuleerd.');
          }}>Annuleren</button>
        </div>}
        {undoRestore && <p><button type="button" onClick={revertRestore}>
          Vorige complete woningmatch één keer terugzetten
        </button></p>}
      </section>
    </div>
  );
}


/**
 * Local contract-reading workspace. No legal decision, account integration,
 * persistence, upload or automatic acceptance; all values belong to this tab.
 */
const PRIVATE_CONTRACT_TOPICS = [
  ['partijen', 'Partijen en contactpersoon', 'Klopt wie verhuurt en met wie je afspraken maakt?'],
  ['woning', 'Woning en inbegrepen ruimtes', 'Staan woning, adres en afgesproken berging/parkeerplaats duidelijk genoemd?'],
  ['huur', 'Kale huur en betaalmoment', 'Zijn kale huur, ingangsdatum en betaalmoment terug te vinden?'],
  ['service', 'Servicekosten en afrekening', 'Is duidelijk wat een voorschot is en hoe afrekening plaatsvindt?'],
  ['borg', 'Borg en teruggave', 'Staan het betaalbedrag en de voorwaarden voor teruggave op papier?'],
  ['duur', 'Duur en opzegging', 'Is duidelijk welk soort overeenkomst je krijgt en hoe opzeggen werkt?'],
  ['verhoging', 'Huurprijsverhoging', 'Weet je waar en hoe een eventuele huurverhoging is beschreven?'],
  ['gebreken', 'Onderhoud en opleverstaat', 'Zijn bestaande gebreken en onderhoudsafspraken vastgelegd?'],
  ['energie', 'Gas, water, licht en internet', 'Weet je wat inbegrepen is en wat je zelf moet afsluiten?'],
  ['bijlagen', 'Bijlagen, huisregels en extra kosten', 'Zijn genoemde bijlagen beschikbaar en ongewenste extra kosten uitgezocht?']
] as const;
type ContractTopicChoice = 'open'|'gevonden'|'vraag';
function parseContractMoney(input: string): number | null {
  const value = input.trim();
  if (value === '') return null;
  if (!/^(?:0|[1-9][0-9]{0,5})(?:[,.][0-9]{1,2})?$/.test(value)) return null;
  const [whole, fraction = ''] = value.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents >= 0 && cents <= 50000000 ? cents : null;
}
const contractEuro = (cents: number): string =>
  new Intl.NumberFormat('nl-NL', {style:'currency',currency:'EUR'}).format(cents / 100);
/** Portable, opt-in document: never includes offer credentials or third-party responses. */
type PrivateContractBackup = {
  format:'woonpoints-private-contract';version:1;
  values:Record<string,ContractTopicChoice>;
  notes:Record<string,string>;
  rent:string;service:string;deposit:string;signingDate:string;followUpDate:string;
};
function validPrivateContractBackup(input:unknown): input is PrivateContractBackup {
  if(!input||typeof input!=='object'||Array.isArray(input))return false;
  const o=input as Record<string,unknown>;
  const keys=['format','version','values','notes','rent','service','deposit','signingDate','followUpDate'];
  if(Object.keys(o).sort().join('|')!==keys.sort().join('|')||
     o.format!=='woonpoints-private-contract'||o.version!==1||
     !o.values||typeof o.values!=='object'||Array.isArray(o.values)||
     !o.notes||typeof o.notes!=='object'||Array.isArray(o.notes))return false;
  const status=o.values as Record<string,unknown>, notes=o.notes as Record<string,unknown>;
  const ids=PRIVATE_CONTRACT_TOPICS.map(([id])=>id);
  if(Object.keys(status).sort().join('|')!==[...ids].sort().join('|')||
     Object.keys(notes).sort().join('|')!==[...ids].sort().join('|'))return false;
  if(ids.some(id=>!['open','gevonden','vraag'].includes(status[id] as string)||
     typeof notes[id]!=='string'||(notes[id] as string).length>180||
     /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(notes[id] as string)))return false;
  for(const name of ['rent','service','deposit'] as const){
    if(typeof o[name]!=='string'||o[name].length>10||
      (o[name].trim()!==''&&parseContractMoney(o[name])===null))return false;
  }
  for(const name of ['signingDate','followUpDate'] as const){
    const value=o[name];
    if(typeof value!=='string')return false;
    if(value==='')continue;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    const [y,m,d]=value.split('-').map(Number);
    if(y<2000||y>2100||new Date(Date.UTC(y,m-1,d)).toISOString().slice(0,10)!==value)return false;
  }
  return true;
}
function PrivateContractReview({acceptedRentalDecision}: {
  acceptedRentalDecision?: {caseId:number;offer:PrivateRentalDecisionSnapshot}|null
} = {}) {
  const [comparedSource, setComparedSource] = useState<string|null>(null);
  const [values, setValues] = useState<Record<string, ContractTopicChoice>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rent, setRent] = useState('');
  const [service, setService] = useState('');
  const [deposit, setDeposit] = useState('');
  const [signingDate, setSigningDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [calendarPreview, setCalendarPreview] = useState<{source:string;content:string}|null>(null);
  const [calendarAccepted, setCalendarAccepted] = useState(false);
  const [backupPreview, setBackupPreview] = useState<{source:string;json:string}|null>(null);
  const [backupAccepted, setBackupAccepted] = useState(false);
  const [importCandidate, setImportCandidate] = useState<{data:PrivateContractBackup;json:string}|null>(null);
  const [importAccepted, setImportAccepted] = useState(false);
  const [importUndo, setImportUndo] = useState<{before:PrivateContractBackup;after:string}|null>(null);
  const [preview, setPreview] = useState<{source: string;text: string}|null>(null);
  const [approved, setApproved] = useState(false);
  const [shareOwnNotes, setShareOwnNotes] = useState(false);
  const [questionsPreview, setQuestionsPreview] = useState<{fingerprint:string;text:string}|null>(null);
  const [questionsApproved, setQuestionsApproved] = useState(false);
  const [feedback, setFeedback] = useState('');
  const amounts = [rent,service,deposit].map(parseContractMoney);
  const moneyBad = [rent,service,deposit].some((s,i)=>s.trim()!==''&&amounts[i]===null);
  const checked = PRIVATE_CONTRACT_TOPICS.filter(([id])=>values[id]==='gevonden').length;
  const questions = PRIVATE_CONTRACT_TOPICS.filter(([id])=>values[id]==='vraag');
  const open = PRIVATE_CONTRACT_TOPICS.filter(([id])=>!values[id]||values[id]==='open');
  const questionFingerprint = JSON.stringify({
    status:questions.map(([id])=>id),
    notes:shareOwnNotes?questions.map(([id])=>notes[id]||''):[],
    shareOwnNotes
  });
  const source = JSON.stringify({values,notes,rent,service,deposit,signingDate,followUpDate,acceptedRentalDecision});
  const acceptedOffer = acceptedRentalDecision?.offer ?? null;
  const showOfferComparison = acceptedOffer!==null && comparedSource===source;
  const backupData:PrivateContractBackup={
    format:'woonpoints-private-contract',version:1,
    values:Object.fromEntries(PRIVATE_CONTRACT_TOPICS.map(([id])=>[id,values[id]||'open'])),
    notes:Object.fromEntries(PRIVATE_CONTRACT_TOPICS.map(([id])=>[id,notes[id]||''])),
    rent,service,deposit,signingDate,followUpDate
  };
  const backupFingerprint=JSON.stringify(backupData);
  const totalMonthly = amounts[0]!==null&&amounts[1]!==null ? amounts[0]+amounts[1] : null;
  const initialCash = totalMonthly!==null&&amounts[2]!==null ? totalMonthly+amounts[2] : null;
  const firstYearRent = totalMonthly!==null ? totalMonthly*12 : null;
  const change = () => {
    setPreview(null);setApproved(false);setCalendarPreview(null);
    setCalendarAccepted(false);setBackupPreview(null);setBackupAccepted(false);
    setImportCandidate(null);setImportAccepted(false);setImportUndo(null);
    setQuestionsPreview(null);setQuestionsApproved(false);
    setComparedSource(null);setFeedback('');
  };
  const fieldStyle = {display:'grid',gap:7,minWidth:0} as const;
  const formGrid = {display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14} as const;
  function makeReport() {
    if (moneyBad) {setFeedback('Controleer de bedragen: gebruik eurobedragen zonder valutateken en maximaal twee decimalen.');return;}
    const date = signingDate && /^\d{4}-\d{2}-\d{2}$/.test(signingDate) ? signingDate : 'Niet ingevuld';
    const lines = [
      'MIJN PRIVÉ-HUURCONTRACTCONTROLE','',
      'Eigen invulhulp; geen juridische toets, goedkeuring of digitale ondertekening.',
      'Niets is gecontroleerd bij een verhuurder of WoningNet.','',
      'AFGESPROKEN BEDRAGEN (ALLEEN EIGEN INVOER)',
      'Kale huur per maand: '+(amounts[0]===null?'Niet ingevuld':contractEuro(amounts[0])),
      'Servicekosten per maand: '+(amounts[1]===null?'Niet ingevuld':contractEuro(amounts[1])),
      'Kale huur + service per maand: '+(amounts[0]===null||amounts[1]===null?'Onbekend; vul beide bedragen in':contractEuro(amounts[0]+amounts[1])),
      'Borg eenmalig: '+(amounts[2]===null?'Niet ingevuld':contractEuro(amounts[2])),
      'Indicatieve startbetaling (maandbedrag + borg): '+(initialCash===null?'Onbekend':contractEuro(initialCash)),
      '12 maanden kale huur + service (exclusief borg, energie en overige kosten): '+(firstYearRent===null?'Onbekend':contractEuro(firstYearRent)),
      'Let op: borg is geen definitieve uitgave; teruggave en inhoudingen zijn niet voorspeld.',
      'Eigen gewenste tekendatum: '+date,
      'Eigen herinnering voor open vragen: '+(followUpDate||'Niet ingevuld'),
      '',
      'CONTROLEPUNTEN',
      ...PRIVATE_CONTRACT_TOPICS.flatMap(([id,title,hint])=>[
        '- '+title+': '+(values[id]==='gevonden'?'Zelf teruggevonden':values[id]==='vraag'?'Vragen open':'Nog niet nagekeken'),
        '  Controle: '+hint,
        ...(notes[id]?.trim()?['  Eigen notitie: '+notes[id].trim().replace(/[\r\n\t]+/g,' ')]:[])
      ]),
      '',
      'VRAGEN VOOR EEN MENS: '+questions.length,
      ...questions.map(([id,title])=>'- '+title+(notes[id]?.trim()?' — '+notes[id].trim().replace(/[\r\n\t]+/g,' '):'')),
      'NIET NAGEKEKEN: '+open.length,
      ...open.map(([,title])=>'- '+title),
      '',
      ...(showOfferComparison && acceptedOffer ? [
        '', 'EERDER BEVESTIGDE AANBODCHECK — EIGEN, NIET GEVERIFIEERD',
        'Eigen voorstel: '+acceptedOffer.label.replace(/[\r\n\t]+/g,' '),
        'Aanbod maandlasten (kan energie en andere posten omvatten): '+contractEuro(acceptedOffer.monthlyCents),
        'Aanbod startgeld (eigen raming): '+contractEuro(acceptedOffer.initialCents),
        'Aanbod eerstejaarskosten (eigen raming): '+contractEuro(acceptedOffer.firstYearCents),
        'Contractvergelijking is indicatief: kostengrondslagen zijn niet bewezen gelijk.',
        'Controleer servicekosten, energiekosten, overige kosten, voorschotten en borg zelf.',
      ] : []),
      '',
      'Dit is een persoonlijke conceptlijst. Controleer bedragen, geldende regels en het originele contract zelf.',
      'Er is geen acceptatie, betaling, officiële beoordeling, e-mail of upload uitgevoerd.'
    ];
    setPreview({source,text:lines.join('\n')+'\n'});
    setApproved(false);
    setFeedback('Rapport voorbereid. Lees de volledige tekst hieronder en bevestig zelf de download.');
  }
  function loadContractBackup(data:PrivateContractBackup) {
    setValues({...data.values});setNotes({...data.notes});
    setRent(data.rent);setService(data.service);setDeposit(data.deposit);
    setSigningDate(data.signingDate);setFollowUpDate(data.followUpDate);
    setPreview(null);setApproved(false);setCalendarPreview(null);
    setCalendarAccepted(false);setBackupPreview(null);setBackupAccepted(false);
    setImportCandidate(null);setImportAccepted(false);
  }
  function prepareContractBackup() {
    if(!validPrivateContractBackup(backupData)){setFeedback('De huidige invoer kan niet veilig worden opgeslagen. Controleer bedragen, datums en notities.');return;}
    const json=JSON.stringify(backupData,null,2)+'\n';
    if(new TextEncoder().encode(json).length>10000){setFeedback('De eigen back-up is te groot. Kort notities in.');return;}
    setBackupPreview({source:backupFingerprint,json});
    setBackupAccepted(false);
    setFeedback('Bekijk eerst alle persoonlijke tekst in deze back-up. Er is niets opgeslagen of geüpload.');
  }
  function downloadContractBackup() {
    if(!backupPreview||backupPreview.source!==backupFingerprint||!backupAccepted){
      setBackupPreview(null);setBackupAccepted(false);
      setFeedback('De back-up is gewijzigd of niet bevestigd. Bekijk eerst een nieuwe preview.');return;
    }
    const url=URL.createObjectURL(new Blob([backupPreview.json],{type:'application/json;charset=utf-8'}));
    try{
      const link=document.createElement('a');link.href=url;
      link.download='mijn-huurcontractcontrole-backup.json';
      document.body.appendChild(link);link.click();link.remove();
      setBackupAccepted(false);
      setFeedback('Eigen back-up aangeboden aan je browser. Controleer waar je het bestand bewaart.');
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }
  async function readContractBackup(file:File|undefined) {
    setImportCandidate(null);setImportAccepted(false);setFeedback('');
    if(!file||file.size<1||file.size>10000){
      setFeedback('Kies een niet-leeg JSON-bestand van maximaal 10 KB.');return;
    }
    try{
      const bytes=new Uint8Array(await file.arrayBuffer());
      const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
      if(new TextEncoder().encode(raw).length!==bytes.length)throw Error('encoding');
      const parsed:unknown=JSON.parse(raw);
      if(!validPrivateContractBackup(parsed))throw Error('schema');
      setImportCandidate({data:parsed,json:JSON.stringify(parsed,null,2)+'\n'});
      setFeedback('Back-up gelezen zonder wijziging. Controleer de volledige inhoud vóór vervangen.');
    }catch{
      setImportCandidate(null);
      setFeedback('Dit bestand is geen geldige volledige Woonpoints-contractback-up. Er is niets vervangen.');
    }
  }
  function confirmContractImport(){
    if(!importAccepted||!importCandidate)return;
    const previous=backupData;
    const candidate=importCandidate.data;
    if(!validPrivateContractBackup(candidate))return;
    const normalizedAfter:PrivateContractBackup={
      format:'woonpoints-private-contract',version:1,
      values:Object.fromEntries(PRIVATE_CONTRACT_TOPICS.map(([id])=>[id,candidate.values[id]])),
      notes:Object.fromEntries(PRIVATE_CONTRACT_TOPICS.map(([id])=>[id,candidate.notes[id]])),
      rent:candidate.rent,service:candidate.service,deposit:candidate.deposit,
      signingDate:candidate.signingDate,followUpDate:candidate.followUpDate
    };
    loadContractBackup(candidate);
    setImportUndo({before:previous,after:JSON.stringify(normalizedAfter)});
    setFeedback('Eigen gegevens na bevestiging vervangen. Eenmalig terugzetten blijft mogelijk tot de volgende wijziging.');
  }
  function undoContractImport(){
    if(!importUndo)return;
    if(importUndo.after!==backupFingerprint){
      setImportUndo(null);setFeedback('De huidige invoer is veranderd; terugzetten is vervallen.');return;
    }
    if(!window.confirm('De eigen contractgegevens van vóór de laatste import terugzetten?'))return;
    loadContractBackup(importUndo.before);setImportUndo(null);
    setFeedback('De eerdere tabbladgegevens zijn teruggezet. Maak exports opnieuw.');
  }
  function prepareCalendar() {
    const [y,m,d] = followUpDate.split('-').map(Number);
    const parsed = new Date(Date.UTC(y,m-1,d));
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(followUpDate) &&
      y>=2000&&y<=2100&&parsed.toISOString().slice(0,10)===followUpDate;
    const now = new Date();
    const localToday = String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0')+
      '-'+String(now.getDate()).padStart(2,'0');
    if (!valid || followUpDate<localToday) {
      setFeedback('Kies eerst een geldige herinneringsdag vandaag of later.');return;
    }
    const day = followUpDate.replace(/-/g,'');
    const nextDay = new Date(Date.UTC(y,m-1,d+1)).toISOString().slice(0,10).replace(/-/g,'');
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    // Deliberately never embed contract amounts, addresses, notes or other user text.
    const content = [
      'BEGIN:VCALENDAR','VERSION:2.0','CALSCALE:GREGORIAN','METHOD:PUBLISH',
      'PRODID:-//Woonpoints//Private Contract Followup//NL',
      'BEGIN:VEVENT','UID:contract-vragen-'+day+'@woonpoints.local',
      'DTSTAMP:'+stamp,'DTSTART;VALUE=DATE:'+day,'DTEND;VALUE=DATE:'+nextDay,
      'SUMMARY:Controleer eigen vragen over huurcontract',
      'DESCRIPTION:Bekijk je eigen contract en bespreek open vragen voordat je beslist. Geen afspraak of ondertekening.',
      'BEGIN:VALARM','TRIGGER:-P1D','ACTION:DISPLAY',
      'DESCRIPTION:Controleer eigen huurcontractvragen','END:VALARM',
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n')+'\r\n';
    setCalendarPreview({source,content});setCalendarAccepted(false);
    setFeedback('Bekijk de exacte kalenderinhoud voordat je het bestand opslaat. Er is geen afspraak gemaakt.');
  }
  function saveCalendar() {
    if(!calendarPreview||calendarPreview.source!==source||!calendarAccepted){
      setCalendarPreview(null);setCalendarAccepted(false);
      setFeedback('Herinnering gewijzigd of niet bevestigd. Maak opnieuw een preview.');return;
    }
    const url=URL.createObjectURL(new Blob([calendarPreview.content],{type:'text/calendar;charset=utf-8'}));
    try {
      const a=document.createElement('a');a.href=url;a.download='huurcontract-vragen-herinnering.ics';
      document.body.appendChild(a);a.click();a.remove();
      setCalendarAccepted(false);
      setFeedback('ICS aan je browser aangeboden. Importeren en melding instellen doe je zelf in je agenda.');
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }

  function prepareQuestionsHandoff() {
    if(questions.length===0){
      setFeedback('Markeer eerst minstens één contractonderdeel als vraag voor een verhuurder of adviseur.');
      setQuestionsPreview(null);setQuestionsApproved(false);return;
    }
    const text = [
      'MIJN OPEN HUURCONTRACTVRAGEN', '',
      'Zelf samengestelde conceptvragen. Geen geverifieerde controle, juridisch oordeel of bericht.',
      'Deze versie bevat geen huurprijs, borg, adres, persoonsgegevens of externe accountgegevens',
      'uit andere velden van Woonpoints.',
      ...(shareOwnNotes?['Let op: hieronder kunnen wel persoonlijke tekstnotities staan.','']:[
        'Eigen notities zijn bewust weggelaten.',''
      ]),
      ...questions.flatMap(([id,title,hint],index)=>[
        (index+1)+'. '+title,
        '   Vraag: '+hint,
        ...(shareOwnNotes && notes[id]?.trim()?
          ['   Eigen notitie: '+notes[id].trim().replace(/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]+/gu,' ')]:[]),
        ''
      ]),
      'Controleer je eigen tekst voordat je iets verstuurt. Woonpoints verstuurt niets.'
    ].join('\n')+'\n';
    setQuestionsPreview({fingerprint:questionFingerprint,text});
    setQuestionsApproved(false);
    setFeedback('Deelbare conceptvragen staan ter controle klaar. Niets is gedeeld.');
  }
  function saveQuestionsHandoff(){
    if(!questionsPreview||questionsPreview.fingerprint!==questionFingerprint||
       !questionsApproved||questions.length===0){
      setQuestionsPreview(null);setQuestionsApproved(false);
      setFeedback('De vraagselectie is gewijzigd of niet bevestigd. Bekijk een nieuwe preview.');return;
    }
    const url=URL.createObjectURL(new Blob([questionsPreview.text],{type:'text/plain;charset=utf-8'}));
    try{
      const a=document.createElement('a');a.href=url;
      a.download='mijn-open-contractvragen.txt';
      document.body.appendChild(a);a.click();a.remove();
      setQuestionsApproved(false);
      setFeedback('Afzonderlijke vragenlijst aangeboden aan je browser. Niets is automatisch verstuurd.');
    }finally{window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }
  function saveReport() {
    if (!preview || preview.source!==source || !approved || moneyBad) {
      setFeedback('Het rapport is gewijzigd of niet bevestigd. Maak een nieuwe preview.');
      setPreview(null);setApproved(false);return;
    }
    const url = URL.createObjectURL(new Blob([preview.text],{type:'text/plain;charset=utf-8'}));
    try {
      const a = document.createElement('a');
      a.href=url;a.download='mijn-huurcontractcontrole.txt';
      document.body.appendChild(a);a.click();a.remove();
      setFeedback('Privé-TXT aangeboden aan je browser. Er is niets verzonden of ondertekend.');
      setApproved(false);
    } finally {window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  }
  return <section className="panel" id="private-contract-review-heading" aria-labelledby="private-contract-review-title">
    <div>
      <p className="eyebrow">HUURCONTRACT · ALLEEN IN DIT TABBLAD</p>
      <h2 id="private-contract-review-title">Mijn contract vóór ondertekenen nalopen</h2>
      <p>Loop zelf tien contractonderwerpen langs, vergelijk eigen bedragen en maak een lijst met open vragen.
        Dit is een hulpmiddel bij het lezen, geen juridisch advies, goedkeuring of verhuurdercontrole.
        Woonpoints vraagt niet om je contract te uploaden of automatisch te accepteren.</p>
    </div>
    <div style={formGrid}>
      {([
        ['Kale maandhuur (€)',rent,setRent],
        ['Servicekosten per maand (€)',service,setService],
        ['Borg eenmalig (€)',deposit,setDeposit]
      ] as const).map(([label,value,set])=>
        <label key={label} style={fieldStyle}><strong>{label}</strong>
          <input type="text" inputMode="decimal" value={value} maxLength={10}
            placeholder="Bijvoorbeeld 850,00" onChange={e=>{set(e.target.value);change();}} />
        </label>)}
      <label style={fieldStyle}><strong>Eigen gewenste tekendatum (optioneel)</strong>
        <input type="date" value={signingDate} onChange={e=>{setSigningDate(e.target.value);change();}}/>
      </label>
      <label style={fieldStyle}><strong>Herinnering om open vragen na te lopen</strong>
        <input type="date" value={followUpDate} onChange={e=>{setFollowUpDate(e.target.value);change();}}/>
      </label>
    </div>
    {moneyBad&&<p role="alert">Een bedrag is ongeldig. Gebruik bijvoorbeeld 850,00 zonder €-teken.</p>}
    <p aria-live="polite"><strong>{checked}/10 zelf teruggevonden</strong> · {questions.length} vraagpunten · {open.length} nog niet nagekeken.</p>
    <p><strong>Kale huur + service:</strong> {amounts[0]!==null&&amounts[1]!==null?
      contractEuro(amounts[0]+amounts[1]):'Onbekend totdat beide bedragen zijn ingevuld'}
      {' · '}<strong>Borg:</strong> {amounts[2]!==null?contractEuro(amounts[2]):'Niet ingevuld'}.
      Dit zijn uitsluitend eigen contractaannames, geen geverifieerde kosten.</p>
    <p><strong>Indicatief bij aanvang te betalen:</strong> {initialCash===null?'Onbekend; vul huur, service en borg in':contractEuro(initialCash)}
      {' · '}<strong>Eerste 12 maanden huur + service:</strong> {firstYearRent===null?'Onbekend':contractEuro(firstYearRent)}.
      De borg is mogelijk terug te ontvangen en zit niet in de genoemde 12-maandskosten. Energie, verhuizing en andere kosten zijn niet inbegrepen.</p>
    {acceptedOffer&&<div style={{marginTop:16,padding:16,border:'1px solid #c9d8cf',borderRadius:12}}>
      <h3>Eerder bewust bevestigd aanbod naast mijn contract</h3>
      <p>De aanbodcheck bevat een zelf ingevulde financiële momentopname. Dat is geen geverifieerd
        contract of bewijs dat dezelfde kostenposten zijn gebruikt. Je contractvelden hierboven
        worden niet automatisch aangepast en er vindt geen opslag of overdracht plaats.</p>
      <button type="button" onClick={()=>{
        setComparedSource(source);setPreview(null);setApproved(false);
        setFeedback('Aanbod en contract staan naast elkaar. Vergelijk zelf de kostengrondslag.');
      }}>Toon mijn bevestigde aanbod naast deze contractcijfers</button>
      {showOfferComparison&&<div role="region" aria-label="Zelf bevestigde aanbod- en contractvergelijking">
        <p><strong>Mijn aanbod:</strong> {acceptedOffer.label} (aanbodcheck #{acceptedRentalDecision?.caseId}).</p>
        <dl style={{display:'grid',gap:8}}>
          <div><dt><strong>Maandbedrag</strong></dt>
            <dd>Contract kale huur + service: {totalMonthly===null?'Onbekend':contractEuro(totalMonthly)};
              aanbod maandlasten: {contractEuro(acceptedOffer.monthlyCents)}.</dd></div>
          <div><dt><strong>Benodigd startgeld</strong></dt>
            <dd>Contract maandbedrag + borg: {initialCash===null?'Onbekend':contractEuro(initialCash)};
              aanbod eigen startgeld: {contractEuro(acceptedOffer.initialCents)}.</dd></div>
          <div><dt><strong>Jaarbedrag</strong></dt>
            <dd>Contract 12 maanden kale huur + service: {firstYearRent===null?'Onbekend':contractEuro(firstYearRent)};
              aanbod eigen eerstejaarsraming: {contractEuro(acceptedOffer.firstYearCents)}.</dd></div>
        </dl>
        <p><strong>Let op:</strong> aanbodbedragen kunnen energie, overige kosten of andere periodes
          omvatten. Daarom wordt geen kunstmatig verschil of goedkeuringsscore berekend.
          Controleer de onderliggende voorwaarden en bedragen rechtstreeks in de documenten.</p>
        <button type="button" onClick={()=>{
          setComparedSource(null);setPreview(null);setApproved(false);
          setFeedback('De tijdelijke aanbodvergelijking is gesloten.');
        }}>Sluit mijn tijdelijke vergelijking</button>
      </div>}
    </div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(270px,1fr))',gap:12}}>
      {PRIVATE_CONTRACT_TOPICS.map(([id,title,hint],i)=>
        <fieldset key={id} style={{border:'1px solid #c9d8cf',borderRadius:12,padding:14,minWidth:0}}>
          <legend style={{fontWeight:700}}>{i+1}. {title}</legend>
          <p style={{margin:'6px 0 14px'}}>{hint}</p>
          <label style={fieldStyle}><strong>Mijn beoordeling</strong>
            <select value={values[id]||'open'} onChange={e=>{
              setValues(current=>({...current,[id]:e.target.value as ContractTopicChoice}));change();
            }}>
              <option value="open">Nog niet nagekeken</option>
              <option value="gevonden">Zelf teruggevonden</option>
              <option value="vraag">Vraag voor verhuurder / adviseur</option>
            </select>
          </label>
          <label style={{...fieldStyle,marginTop:12}}><strong>Eigen notitie (optioneel)</strong>
            <textarea rows={2} maxLength={180} value={notes[id]||''}
              placeholder="Bijvoorbeeld: waar staat dit beschreven?"
              onChange={e=>{setNotes(current=>({...current,[id]:e.target.value}));change();}}/>
          </label>
        </fieldset>)}
    </div>

    <div style={{marginTop:20,padding:16,border:'1px solid #c9d8cf',borderRadius:12}}>
      <h3>Alleen open vragen apart meenemen</h3>
      <p>Maak van alle onderdelen met status 'Vraag voor verhuurder / adviseur' een kort,
        los TXT-document. Kosten, borg, data, aanbodmomentopnames en adressen worden nooit
        automatisch toegevoegd. Je bepaalt zelf of jouw notities in deze export horen.</p>
      <p><strong>{questions.length} open vraagpunten geselecteerd.</strong></p>
      <label style={{display:'flex',gap:10,alignItems:'start',marginBottom:12}}>
        <input type="checkbox" checked={shareOwnNotes}
          onChange={e=>{
            setShareOwnNotes(e.target.checked);
            setQuestionsPreview(null);setQuestionsApproved(false);setFeedback('');
          }}/>
        <span>Ook mijn handgeschreven notities bij deze vragen opnemen. Daar kan persoonlijke informatie in staan.</span>
      </label>
      <button type="button" disabled={questions.length===0} onClick={prepareQuestionsHandoff}>
        Bekijk deze losse vraag- en overleglijst
      </button>
      {questionsPreview&&questionsPreview.fingerprint===questionFingerprint&&<div style={{marginTop:14}}>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:350,overflowY:'auto',
          padding:14,background:'#f2f6f2',borderRadius:10}}>{questionsPreview.text}</pre>
        <label style={{display:'flex',gap:10,alignItems:'start',marginBottom:12}}>
          <input type="checkbox" checked={questionsApproved} onChange={e=>setQuestionsApproved(e.target.checked)}/>
          <span>Ik heb de hele tekst gecontroleerd en kies zelf of ik het bestand opsla en eventueel met iemand deel.</span>
        </label>
        <button type="button" disabled={!questionsApproved} onClick={saveQuestionsHandoff}>
          Download uitsluitend mijn bekeken contractvragen
        </button>
      </div>}
    </div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:20}}>
      <button type="button" disabled={moneyBad} onClick={makeReport}>Bekijk mijn volledige vraag- en contractrapport</button>
      <button type="button" onClick={()=>{
        if(!window.confirm('Alle eigen controles en bedragen uit dit tabblad wissen?'))return;
        setValues({});setNotes({});setRent('');setService('');setDeposit('');
        setSigningDate('');setFollowUpDate('');change();
        setFeedback('Alleen deze tijdelijke contractcontrole is gewist.');
      }}>Wis tijdelijke contractcontrole</button>
    </div>
    {preview&&preview.source===source&&<div style={{marginTop:16}}>
      <h3>Volledige preview van mijn privérapport</h3>
      <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:420,overflowY:'auto',
        padding:16,background:'#f2f6f2',borderRadius:10}}>{preview.text}</pre>
      <label style={{display:'flex',gap:10,alignItems:'start',marginBottom:12}}>
        <input type="checkbox" checked={approved} onChange={e=>setApproved(e.target.checked)}/>
        <span>Ik heb deze volledige tekst bekeken en bepaal zelf of ik hem lokaal download.</span>
      </label>
      <button type="button" disabled={!approved} onClick={saveReport}>Download mijn bekeken TXT</button>
    </div>}
    <div style={{marginTop:18,borderTop:'1px solid #c9d8cf',paddingTop:16}}>
      <h3>Eigen herinnering voor open vragen</h3>
      <p>Bewaar na je eigen controle eventueel een agenda-item zonder adres, contractinhoud of bedragen.
        Je agenda importeert het bestand alleen als jij daarvoor kiest; er wordt niets automatisch ingepland.</p>
      <button type="button" disabled={!followUpDate} onClick={prepareCalendar}>Bekijk kalenderbestand voor gekozen dag</button>
      {calendarPreview&&calendarPreview.source===source&&<div style={{marginTop:12}}>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:260,overflowY:'auto',
          padding:14,background:'#f2f6f2',borderRadius:10}}>{calendarPreview.content}</pre>
        <label style={{display:'flex',gap:10,alignItems:'start',marginBottom:12}}>
          <input type="checkbox" checked={calendarAccepted} onChange={e=>setCalendarAccepted(e.target.checked)}/>
          <span>Ik heb de exacte agenda-inhoud gelezen en wil zelf een .ics-bestand downloaden.</span>
        </label>
        <button type="button" disabled={!calendarAccepted} onClick={saveCalendar}>Download mijn bekeken agenda-item</button>
      </div>}
    </div>
    {feedback&&<p role="status" aria-live="polite">{feedback}</p>}
    <div style={{marginTop:20,padding:16,border:'1px solid #c9d8cf',borderRadius:12}}>
      <h3>Mijn controle later verderzetten: privé-back-up</h3>
      <p>Bewaar alleen op eigen verzoek een JSON-bestand met je tien antwoorden, eigen notities,
        bedragen en datums. Er is geen automatisch opslaan. Het bestand kan persoonlijke informatie
        bevatten; import en export blijven volledig onder jouw controle.</p>
      <button type="button" onClick={prepareContractBackup}>Bekijk alle gegevens voor back-up</button>
      {backupPreview&&backupPreview.source===backupFingerprint&&<div style={{marginTop:12}}>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:280,overflowY:'auto',
          padding:14,background:'#f2f6f2',borderRadius:10}}>{backupPreview.json}</pre>
        <label style={{display:'flex',gap:10,alignItems:'start',marginBottom:12}}>
          <input type="checkbox" checked={backupAccepted} onChange={e=>setBackupAccepted(e.target.checked)}/>
          <span>Ik heb alle gegevens bekeken en kies zelf waar ik het privébestand bewaar.</span>
        </label>
        <button type="button" disabled={!backupAccepted} onClick={downloadContractBackup}>Download mijn bevestigde JSON</button>
      </div>}
      <label style={{display:'grid',gap:6,marginTop:18,maxWidth:500}}>
        <strong>Mijn eerdere JSON-back-up openen (maximaal 10 KB)</strong>
        <input type="file" accept=".json,application/json"
          onChange={async e=>{
            const chosen=e.target.files?.[0];e.target.value='';
            await readContractBackup(chosen);
          }}/>
      </label>
      {importCandidate&&<div style={{marginTop:12}}>
        <p><strong>Vervangingspreview:</strong> de volledige nieuwe invoer staat hieronder.
          Je huidige gegevens blijven staan totdat je afzonderlijk bevestigt.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:280,overflowY:'auto',
          padding:14,background:'#f2f6f2',borderRadius:10}}>{importCandidate.json}</pre>
        <label style={{display:'flex',gap:10,alignItems:'start',marginBottom:12}}>
          <input type="checkbox" checked={importAccepted} onChange={e=>setImportAccepted(e.target.checked)}/>
          <span>Ik heb de complete vervangende invoer bekeken en wil mijn huidige contractcontrole vervangen.</span>
        </label>
        <button type="button" disabled={!importAccepted} onClick={confirmContractImport}>Vervang mijn tijdelijke gegevens</button>
        <button type="button" onClick={()=>{setImportCandidate(null);setImportAccepted(false);}}>Annuleer import</button>
      </div>}
      {importUndo&&<button type="button" style={{marginTop:12}}
        disabled={importUndo.after!==backupFingerprint} onClick={undoContractImport}>
        Vorige tabbladgegevens eenmalig herstellen
      </button>}
    </div>
    <p><small>Er is geen opslag in dit tabblad, geen API-verzoek, e-mail of automatische toestemming.
      Sluit je het tabblad, dan verdwijnen de ingevulde waarden; een zelf gedownload bestand blijft onder jouw beheer.
      Controleer persoonlijke informatie vóór je een rapport met anderen deelt.</small></p>
  </section>;
}

// Reviewed private contract comparison shares the canonical app source boundary;
// the Docker source allowlist and CI ownership policy remain unchanged.
type PrivateContractDiffLine = {kind: 'same' | 'removed' | 'added'; text: string; oldLine: number | null; newLine: number | null};
type PrivateContractDiffPreview = {source: string; lines: PrivateContractDiffLine[]; additions: number; removals: number; unchanged: number};
type PrivateContractChangeGroup = {
  id: number;
  rows: PrivateContractDiffLine[];
  before: PrivateContractDiffLine | null;
  after: PrivateContractDiffLine | null;
};

// Each uninterrupted run of changed lines becomes one reviewable change group.
// Preserve only its immediately adjacent unchanged lines as optional context;
// these are exact source text, not a legal clause or an inference about meaning.
function privateContractSingleReplacement(group: PrivateContractChangeGroup) {
  // Highlight only an unambiguous 1:1 changed-line pair. If a group contains
  // multiple added/removed rows, preserve every original row instead of
  // guessing correspondences or silently hiding important contract text.
  if (group.rows.length !== 2) return null;
  const older = group.rows.find(row => row.kind === 'removed');
  const newer = group.rows.find(row => row.kind === 'added');
  if (!older || !newer || older.oldLine === null || newer.newLine === null) return null;
  return {older: older.text, newer: newer.text,
    oldLine: older.oldLine, newLine: newer.newLine};
}

function privateContractChangeGroups(lines: PrivateContractDiffLine[]): PrivateContractChangeGroup[] {
  const groups: PrivateContractChangeGroup[] = [];
  let changed: PrivateContractDiffLine[] = [];
  let previousSame: PrivateContractDiffLine | null = null;
  let before: PrivateContractDiffLine | null = null;
  const flush = (after: PrivateContractDiffLine | null) => {
    if (changed.length) {
      groups.push({id: groups.length + 1, rows: changed, before, after});
      changed = [];
      before = null;
    }
  };
  for (const row of lines) {
    if (row.kind === 'same') {
      flush(row);
      previousSame = row;
    } else {
      if (!changed.length) before = previousSame;
      changed.push(row);
    }
  }
  flush(null);
  return groups;
}

const CONTRACT_VERSION_MAX_CHARS = 8000;
const CONTRACT_VERSION_MAX_LINES = 80;

function privateContractLines(value: string): string[] {
  const normalized = value.replace(/\r\n?/g, '\n');
  const result = normalized.split('\n');
  if (result[result.length - 1] === '') result.pop();
  return result;
}

/** Bounded longest-common-subsequence diff, preserving order and original text.
 * Never infer legal significance or hide edits behind a similarity threshold. */
function comparePrivateContractText(before: string, after: string): PrivateContractDiffLine[] | null {
  if (!before.trim() || !after.trim() ||
      before.length > CONTRACT_VERSION_MAX_CHARS || after.length > CONTRACT_VERSION_MAX_CHARS) return null;
  const oldLines = privateContractLines(before);
  const newLines = privateContractLines(after);
  if (!oldLines.length || !newLines.length ||
      oldLines.length > CONTRACT_VERSION_MAX_LINES || newLines.length > CONTRACT_VERSION_MAX_LINES) return null;

  const dp: number[][] = Array.from({length: oldLines.length + 1},
    () => Array<number>(newLines.length + 1).fill(0));
  for (let a = oldLines.length - 1; a >= 0; a--) {
    for (let b = newLines.length - 1; b >= 0; b--) {
      dp[a][b] = oldLines[a] === newLines[b] ? 1 + dp[a + 1][b + 1]
        : Math.max(dp[a + 1][b], dp[a][b + 1]);
    }
  }
  const result: PrivateContractDiffLine[] = [];
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


// A deliberately opt-in, local-only review handoff. The source texts are private:
// no automatic browser storage or transmission, even of a derived fingerprint.
type ContractVersionReviewBackup = {
  kind: 'woonpoints-contract-version-review';
  version: 1;
  earlier: string;
  newer: string;
  reviewedGroups: number[];
  groupNotes: {group: number; text: string}[];
  onlyOpen: boolean;
};
const CONTRACT_REVIEW_BACKUP_MAX_BYTES = 64 * 1024;

function contractVersionReviewBackup(earlier: string, newer: string,
  reviewedGroups: number[], groupNotes: Record<number, string>,
  onlyOpen: boolean): ContractVersionReviewBackup | null {
  const lines = comparePrivateContractText(earlier, newer);
  if (!lines) return null;
  const groups = privateContractChangeGroups(lines);
  const groupCount = groups.length;
  if (reviewedGroups.length > groupCount ||
      new Set(reviewedGroups).size !== reviewedGroups.length ||
      reviewedGroups.some(id => !Number.isSafeInteger(id) || id < 1 || id > groupCount)) return null;
  const notes = Object.entries(groupNotes).map(([id, text]) => ({group: Number(id), text}));
  if (notes.length > groupCount ||
      notes.some(row => !Number.isSafeInteger(row.group) || row.group < 1 ||
        row.group > groupCount || typeof row.text !== 'string' || row.text.length > 240)) return null;
  return {
    kind: 'woonpoints-contract-version-review', version: 1,
    earlier, newer, reviewedGroups: [...reviewedGroups].sort((a, b) => a - b),
    groupNotes: notes.sort((a, b) => a.group - b.group), onlyOpen
  };
}

function parseContractVersionReviewBackup(input: string): ContractVersionReviewBackup {
  const raw: unknown = JSON.parse(input);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('invalid');
  const row = raw as Record<string, unknown>;
  const expected = ['earlier','groupNotes','kind','newer','onlyOpen','reviewedGroups','version'];
  if (Object.keys(row).sort().join('|') !== expected.join('|') ||
      row.kind !== 'woonpoints-contract-version-review' || row.version !== 1 ||
      typeof row.earlier !== 'string' || typeof row.newer !== 'string' ||
      typeof row.onlyOpen !== 'boolean' ||
      !Array.isArray(row.reviewedGroups) || !Array.isArray(row.groupNotes)) throw Error('invalid');
  const checked = row.reviewedGroups;
  const entries = row.groupNotes;
  if (checked.length > CONTRACT_VERSION_MAX_LINES || entries.length > CONTRACT_VERSION_MAX_LINES ||
      checked.some(value => typeof value !== 'number' || !Number.isSafeInteger(value)) ||
      entries.some(value => !value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).sort().join('|') !== 'group|text' ||
        !Number.isSafeInteger(value.group) || typeof value.text !== 'string' ||
        value.text.length > 240)) throw Error('invalid');
  const notes: Record<number, string> = Object.create(null);
  for (const value of entries) {
    if (Object.prototype.hasOwnProperty.call(notes, value.group)) throw Error('duplicate');
    notes[value.group] = value.text;
  }
  const result = contractVersionReviewBackup(row.earlier, row.newer,
    checked as number[], notes, row.onlyOpen);
  if (!result) throw Error('invalid');
  return result;
}

function PrivateContractVersionComparison() {
  const [earlier, setEarlier] = useState('');
  const [newer, setNewer] = useState('');
  const [diff, setDiff] = useState<PrivateContractDiffPreview | null>(null);
  const [includeQuotes, setIncludeQuotes] = useState(false);
  const [filePreview, setFilePreview] = useState<{source: string; text: string; filename: string} | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [notice, setNotice] = useState('');
  const [reviewedGroups, setReviewedGroups] = useState<number[]>([]);
  const [lastFocusedGroup, setLastFocusedGroup] = useState(0);
  const [groupNotes, setGroupNotes] = useState<Record<number, string>>({});
  const [onlyOpen, setOnlyOpen] = useState(false);
  // View-only controls do not change stored reviews or signed export previews.
  const [groupSearch, setGroupSearch] = useState('');
  const [notesOnly, setNotesOnly] = useState(false);
  const [numbersOnly, setNumbersOnly] = useState(false);
  const [changedDigitsOnly, setChangedDigitsOnly] = useState(false);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [reviewBackupPreview, setReviewBackupPreview] =
    useState<{source: string; content: string} | null>(null);
  const [reviewBackupAccepted, setReviewBackupAccepted] = useState(false);
  const [restoreCandidate, setRestoreCandidate] =
    useState<{backup: ContractVersionReviewBackup; content: string} | null>(null);
  const [restoreAccepted, setRestoreAccepted] = useState(false);
  const [restoreUndo, setRestoreUndo] = useState<{
    before: {earlier: string; newer: string; diff: PrivateContractDiffPreview | null;
      reviewed: number[]; notes: Record<number, string>; onlyOpen: boolean};
    restoredSource: string;
  } | null>(null);
  const contractFileReadEpoch = useRef(0);
  const source = JSON.stringify([earlier, newer]);
  const current = diff?.source === source ? diff : null;
  const groups = useMemo(() => current ? privateContractChangeGroups(current.lines) : [],
    [current]);
  const whitespaceOnlyGroups = useMemo(() =>
    groups.filter(group => isWhitespaceOnlyContractChange(group.rows)).length, [groups]);
  const reviewed = groups.filter(group => reviewedGroups.includes(group.id)).length;
  const searchTerm = groupSearch.trim().toLowerCase();
  // Literal digit presence only; a digit anywhere in a changed line is not
  // proof that the numeric value or legal meaning itself changed.
  const groupsWithDigits = groups.filter(group =>
    group.rows.some(row => /[0-9]/.test(row.text))).length;
  // Exact 1:1 replacements distinguish edited digits from incidental numbers.
  // Multi-line groups with digits remain candidates, never inferred matches.
  const changedDigitGroupIds = useMemo(() => new Set(groups.filter(group => {
    const pair = privateContractSingleReplacement(group);
    return pair ? privateContractChangedDigits(pair.older, pair.newer)
      : group.rows.some(row => /[0-9]/.test(row.text));
  }).map(group => group.id)), [groups]);
  const visibleGroups = groups.filter(group =>
    (!onlyOpen || !reviewedGroups.includes(group.id)) &&
    (!notesOnly || !!groupNotes[group.id]?.trim()) &&
    (!numbersOnly || group.rows.some(row => /[0-9]/.test(row.text))) &&
    (!changedDigitsOnly || changedDigitGroupIds.has(group.id)) &&
    (!searchTerm || String(group.id) === searchTerm ||
      (groupNotes[group.id] || '').toLowerCase().includes(searchTerm) ||
      group.rows.some(row => row.text.toLowerCase().includes(searchTerm))));
  const availableOpenGroups = visibleGroups.filter(group =>
    !reviewedGroups.includes(group.id)).map(group => group.id);
  function jumpToNextOpenGroup() {
    if (!availableOpenGroups.length) return;
    // Navigate only already-visible, still-unreviewed source groups. When the
    // filter hides an item, navigation must not silently relax it or mark it.
    const next = availableOpenGroups.find(id => id > lastFocusedGroup)
      ?? availableOpenGroups[0];
    setLastFocusedGroup(next);
    window.requestAnimationFrame(() => {
      const node = document.getElementById('woonpoints-contractversies-groep-' + next);
      node?.focus({preventScroll:true});
      node?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  function highlightMatchedText(text: string) {
    if (!text || !searchTerm) return text || '(lege regel)';
    const lower = text.toLowerCase();
    const parts = [];
    let position = 0;
    // Long lines and one-character queries must not create unbounded nodes.
    for (let count = 0; count < 32; count++) {
      const index = lower.indexOf(searchTerm, position);
      if (index < 0) break;
      if (index > position) parts.push(text.slice(position, index));
      parts.push(<mark key={index}>{text.slice(index, index + searchTerm.length)}</mark>);
      position = index + searchTerm.length;
    }
    parts.push(text.slice(position));
    return parts;
  }
  const reviewSource = JSON.stringify([source,
    [...reviewedGroups].sort((a, b) => a - b), groupNotes, onlyOpen]);
  const previewKey = JSON.stringify([source, includeQuotes, includeNotes,
    [...reviewedGroups].sort((a, b) => a - b), groupNotes]);

  function invalidate() {
    // Any source edit cancels an already pending asynchronous local file read.
    contractFileReadEpoch.current++;
    setReviewBackupPreview(null);
    setReviewBackupAccepted(false);
    setRestoreCandidate(null);
    setRestoreAccepted(false);
    setRestoreUndo(null);
    setDiff(null);
    setFilePreview(null);
    setConfirmSave(false);
    setReviewedGroups([]);
    setLastFocusedGroup(0);
    setGroupNotes({});
    setOnlyOpen(false);
    setGroupSearch('');
    setNotesOnly(false);
    setNumbersOnly(false);
    setChangedDigitsOnly(false);
    setIncludeNotes(false);
    setNotice('');
  }
  function invalidateExport() {
    setReviewBackupPreview(null);
    setReviewBackupAccepted(false);
    setRestoreUndo(null);
    setFilePreview(null);
    setConfirmSave(false);
    setNotice('Opvolgstatus of eigen notities aangepast. Bekijk een nieuwe exportpreview.');
  }
  async function importPlainTextContract(file: File | undefined, side: 'earlier' | 'newer') {
    if (!file) return;
    const epoch = ++contractFileReadEpoch.current;
    // Browser accept filters are hints only; enforce limits before reading bytes.
    if (!/\.txt$/i.test(file.name) || file.size < 1 || file.size > 32768) {
      setNotice('Kies een niet-leeg .txt-bestand van maximaal 32 KiB. PDF, DOCX en andere bestanden worden niet ingelezen.');
      return;
    }
    try {
      const bytes = await file.arrayBuffer();
      if (epoch !== contractFileReadEpoch.current) return;
      const text = new TextDecoder('utf-8', {fatal: true}).decode(bytes)
        .replace(/^\uFEFF/, '');
      if (!text.trim() || text.includes('\u0000') ||
          text.length > CONTRACT_VERSION_MAX_CHARS ||
          privateContractLines(text).length > CONTRACT_VERSION_MAX_LINES) {
        setNotice('Bestand niet overgenomen: maximaal 8.000 tekens en 80 tekstregels per concept; geen binaire inhoud.');
        return;
      }
      invalidate();
      if (side === 'earlier') setEarlier(text);
      else setNewer(text);
      setNotice((side === 'earlier' ? 'Oudere' : 'Nieuwere') +
        ' TXT lokaal overgenomen; de vergelijking en alle oude exporttoestemmingen zijn gewist. ' +
        'Controleer de tekst en klik zelf op Vergelijk.');
    } catch {
      if (epoch === contractFileReadEpoch.current) {
        setNotice('Het bestand kon niet als geldige UTF-8 tekst worden gelezen. Er is niets overgenomen.');
      }
    }
  }
  function compare() {
    const rows = comparePrivateContractText(earlier, newer);
    if (!rows) {
      setDiff(null);
      setNotice('Voeg twee niet-lege teksten toe (maximaal 8.000 tekens en 80 regels elk).');
      return;
    }
    setReviewedGroups([]);
    setLastFocusedGroup(0);
    setGroupNotes({});
    setOnlyOpen(false);
    setGroupSearch('');
    setNotesOnly(false);
    setNumbersOnly(false);
    setChangedDigitsOnly(false);
    setIncludeNotes(false);
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
      'Wijzigingsgroepen: ' + groups.length,
      'Handmatig bekeken groepen: ' + reviewed,
      'Nog te bekijken groepen: ' + (groups.length - reviewed),
      '',
      'Bekeken = alleen eigen afvinkstatus, GEEN juridische of inhoudelijke goedkeuring.',
      includeQuotes ? 'LET OP: DEZE VERSIE BEVAT TEKST UIT JE CONTRACT.' :
        'Contractinhoud weggelaten; alleen soort wijziging en regelnummer.',
      includeNotes ? 'LET OP: DEZE VERSIE BEVAT JE EIGEN NOTITIES.' :
        'Persoonlijke notities zijn standaard niet opgenomen.',
      '',
      ...groups.flatMap(group => [
        'WIJZIGINGSGROEP ' + group.id + ' · ' +
          (reviewedGroups.includes(group.id) ? 'HANDMATIG BEKEKEN' : 'NOG TE BEKIJKEN'),
        ...(includeNotes && groupNotes[group.id]?.trim() ?
          ['Eigen notitie: ' + groupNotes[group.id].trim()] : []),
        ...group.rows.flatMap(row => [
          (row.kind === 'added' ? 'TOEGEVOEGD: nieuwe regel ' + row.newLine :
            'VERWIJDERD: oude regel ' + row.oldLine),
          ...(includeQuotes ? [row.text] : [])
        ]),
        ''
      ]),
      'Controleer altijd beide originele documenten naast elkaar.',
      'Woonpoints heeft niemand gecontacteerd en niets geüpload, bewaard of geaccepteerd.'
    ].join('\n') + '\n';
    setFilePreview({source: previewKey, text: report,
      filename: 'mijn-contractversies-wijzigingen.txt'});
    setConfirmSave(false);
    setNotice('Lees de volledige TXT-preview. De download gebeurt alleen na jouw aparte toestemming.');
  }
  function prepareQuestions() {
    if (!current) return;
    const personalQuestions = groups.filter(group => groupNotes[group.id]?.trim());
    if (!personalQuestions.length) {
      setNotice('Schrijf eerst minimaal één eigen vraag bij een wijzigingsgroep.');
      return;
    }
    // Intentionally excludes both pasted contract sources and diff line text.
    // Even personal notes can contain sensitive information: preview is mandatory.
    const report = [
      'MIJN VRAGEN OVER TWEE HUURCONTRACTVERSIES', '',
      'Zelf opgeschreven aandachtspunten, geen juridisch advies of contractacceptatie.',
      'Bevat geen automatisch overgenomen contractregels of bedragen.',
      'Controleer zelf of je vragen persoonsgegevens bevatten voordat je ze deelt.',
      '',
      ...personalQuestions.flatMap(group => [
        'Wijzigingsgroep ' + group.id + ' · ' +
          (reviewedGroups.includes(group.id) ? 'zelf bekeken' : 'nog niet bekeken'),
        groupNotes[group.id].trim(), ''
      ]),
      'Er is niets verzonden of opgeslagen door Woonpoints.'
    ].join('\n') + '\n';
    setFilePreview({source: previewKey, text: report,
      filename: 'mijn-vragen-over-contractversies.txt'});
    setConfirmSave(false);
    setNotice('Dit is een aparte conceptvragenlijst met alleen jouw eigen notities. ' +
      'Lees de volledige preview en bevestig een eventuele download.');
  }
  function prepareLandlordDraft() {
    if (!current) return;
    const personalQuestions = groups.filter(group => groupNotes[group.id]?.trim());
    if (!personalQuestions.length) {
      setNotice('Voeg minimaal één zelfgeschreven vraag toe voordat je een conceptbericht maakt.');
      return;
    }
    const letter = [
      'Onderwerp: Vragen bij concept-huurovereenkomst',
      '',
      'Geachte verhuurder,',
      '',
      'Ik heb twee conceptversies van de huurovereenkomst naast elkaar bekeken.',
      'Voordat ik verderga, wil ik graag een toelichting op de volgende punten:',
      '',
      ...personalQuestions.flatMap(group => [
        'Punt ' + group.id + ': ' + groupNotes[group.id].trim(), ''
      ]),
      'Zou u deze punten schriftelijk willen toelichten?',
      '',
      'Met vriendelijke groet,',
      '[Uw naam]',
      '',
      'Let op: dit conceptbericht is uitsluitend uit mijn eigen aantekeningen gemaakt.',
      'Controleer de inhoud, persoonsgegevens en bewoordingen zelf vóór delen.'
    ].join('\n') + '\n';
    setFilePreview({source: previewKey, text: letter,
      filename: 'mijn-conceptbericht-aan-verhuurder.txt'});
    setConfirmSave(false);
    setNotice('Conceptbericht lokaal samengesteld uit uitsluitend eigen notities. ' +
      'Niet verzonden. Lees de volledige tekst en bevestig zelf een eventuele TXT-download.');
  }
  function previewReviewBackup() {
    const backup = contractVersionReviewBackup(earlier, newer, reviewedGroups,
      groupNotes, onlyOpen);
    if (!backup || !current) {
      setNotice('Maak eerst een geldige vergelijking voor een reviewback-up.');
      return;
    }
    const content = JSON.stringify(backup, null, 2) + '\n';
    if (new TextEncoder().encode(content).length > CONTRACT_REVIEW_BACKUP_MAX_BYTES) {
      setNotice('De privéback-up is te groot om veilig te exporteren.');
      return;
    }
    setReviewBackupPreview({source: reviewSource, content});
    setReviewBackupAccepted(false);
    setNotice('De back-up bevat beide volledige contractteksten en eigen notities. Controleer de hele preview.');
  }
  function downloadReviewBackup() {
    if (!current || !reviewBackupAccepted || !reviewBackupPreview ||
        reviewBackupPreview.source !== reviewSource) {
      setReviewBackupPreview(null); setReviewBackupAccepted(false);
      setNotice('Deze back-up is gewijzigd; controleer eerst een nieuwe preview.');
      return;
    }
    // The other page sections' saveFile/saveDownload helpers are scoped to
    // their own components. Keep this consent-gated browser download local.
    const blob = new Blob([reviewBackupPreview.content],
      {type:'application/json;charset=utf-8'});
    const objectUrl = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'mijn-contractversies-review-prive.json';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    }
    setReviewBackupAccepted(false);
    setNotice('De privé-JSON is aan je browser aangeboden. Bewaar dit contractbestand zelf veilig.');
  }
  async function readReviewBackup(file: File | undefined) {
    if (!file) return;
    const epoch = ++contractFileReadEpoch.current;
    setRestoreCandidate(null); setRestoreAccepted(false);
    if (!/\.json$/i.test(file.name) || file.size < 1 ||
        file.size > CONTRACT_REVIEW_BACKUP_MAX_BYTES) {
      setNotice('Kies een eigen niet-leeg JSON-reviewbestand van maximaal 64 KiB.');
      return;
    }
    try {
      const bytes = await file.arrayBuffer();
      if (contractFileReadEpoch.current !== epoch) return;
      const content = new TextDecoder('utf-8', {fatal: true}).decode(bytes);
      const backup = parseContractVersionReviewBackup(content);
      if (contractFileReadEpoch.current !== epoch) return;
      setRestoreCandidate({backup, content: JSON.stringify(backup, null, 2)});
      setReviewBackupPreview(null); setReviewBackupAccepted(false);
      setNotice('Reviewbestand lokaal gelezen. Vergelijk de volledige vervangingspreview voor bevestiging.');
    } catch {
      if (contractFileReadEpoch.current === epoch) {
        setRestoreCandidate(null); setRestoreAccepted(false);
        setNotice('Reviewbestand geweigerd: onjuiste structuur, regels of ongeldige UTF-8.');
      }
    }
  }
  function acceptReviewRestore() {
    if (!restoreCandidate || !restoreAccepted) return;
    const {backup} = restoreCandidate;
    const lines = comparePrivateContractText(backup.earlier, backup.newer);
    if (!lines) { setRestoreCandidate(null); setRestoreAccepted(false); return; }
    const before = {earlier, newer, diff, reviewed: [...reviewedGroups],
      notes: {...groupNotes}, onlyOpen};
    const notes: Record<number, string> = Object.create(null);
    for (const note of backup.groupNotes) notes[note.group] = note.text;
    const newSource = JSON.stringify([backup.earlier, backup.newer]);
    const restoredSource = JSON.stringify([newSource, backup.reviewedGroups, notes, backup.onlyOpen]);
    contractFileReadEpoch.current++;
    setEarlier(backup.earlier); setNewer(backup.newer);
    setDiff({source: newSource, lines,
      additions: lines.filter(row => row.kind === 'added').length,
      removals: lines.filter(row => row.kind === 'removed').length,
      unchanged: lines.filter(row => row.kind === 'same').length});
    setReviewedGroups([...backup.reviewedGroups]);
    setLastFocusedGroup(0);
    setGroupNotes(notes); setOnlyOpen(backup.onlyOpen);
    setGroupSearch(''); setNotesOnly(false); setNumbersOnly(false);
    setChangedDigitsOnly(false);
    setFilePreview(null); setConfirmSave(false);
    setReviewBackupPreview(null); setReviewBackupAccepted(false);
    setRestoreCandidate(null); setRestoreAccepted(false);
    setIncludeQuotes(false); setIncludeNotes(false);
    setRestoreUndo({before, restoredSource});
    setNotice('Twee teksten en handmatige reviews lokaal hersteld. Rapporten en eerdere toestemmingen zijn gewist.');
  }
  function undoReviewRestore() {
    if (!restoreUndo || restoreUndo.restoredSource !== reviewSource) return;
    const {before} = restoreUndo;
    contractFileReadEpoch.current++;
    setEarlier(before.earlier); setNewer(before.newer); setDiff(before.diff);
    setReviewedGroups(before.reviewed); setLastFocusedGroup(0);
    setGroupNotes(before.notes); setOnlyOpen(before.onlyOpen);
    setGroupSearch(''); setNotesOnly(false); setNumbersOnly(false);
    setChangedDigitsOnly(false);
    setRestoreUndo(null); setRestoreCandidate(null); setRestoreAccepted(false);
    setReviewBackupPreview(null); setReviewBackupAccepted(false);
    setFilePreview(null); setConfirmSave(false);
    setNotice('Vorige tabbladinvoer eenmalig hersteld. Geen eerdere downloadtoestemming hergebruikt.');
  }
  async function copyReviewedReport() {
    // Browsers share clipboard text with other apps. Keep this action strictly
    // behind the same fresh preview + explicit opt-in as the TXT download.
    if (!current || !filePreview || filePreview.source !== previewKey || !confirmSave) {
      setFilePreview(null);
      setConfirmSave(false);
      setNotice('De tekst is gewijzigd of niet bevestigd. Bekijk eerst een nieuwe preview.');
      return;
    }
    try {
      await navigator.clipboard.writeText(filePreview.text);
      setConfirmSave(false);
      setNotice('Alleen de bekeken tekst is op jouw klik naar het klembord gekopieerd. ' +
        'Er is niets verstuurd. Controleer zelf waar je de tekst plakt.');
    } catch {
      setConfirmSave(false);
      setNotice('Je browser staat klembordtoegang niet toe. Selecteer en kopieer de ' +
        'zichtbare voorbeeldtekst zelf, of gebruik na nieuwe bevestiging de TXT-download.');
    }
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
      a.download = filePreview.filename;
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
          <textarea value={earlier} rows={9} maxLength={CONTRACT_VERSION_MAX_CHARS}
            placeholder="Plak hier tekst uit de oudere conceptversie"
            onChange={event => { setEarlier(event.target.value); invalidate(); }}
          />
          <small>{earlier.length}/{CONTRACT_VERSION_MAX_CHARS} tekens · {privateContractLines(earlier).length} regels</small>
          <span>Of laad uitsluitend een lokale UTF-8 .txt met oude concepttekst:</span>
          <input type="file" accept=".txt,text/plain"
            aria-label="Laad oudere contracttekst uit een lokaal TXT-bestand"
            onChange={event => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              void importPlainTextContract(file, 'earlier');
            }} />
        </label>
        <label style={{display: 'grid', gap: 8}}>
          <strong>Nieuwere concepttekst</strong>
          <textarea value={newer} rows={9} maxLength={CONTRACT_VERSION_MAX_CHARS}
            placeholder="Plak hier dezelfde onderdelen uit het nieuwste concept"
            onChange={event => { setNewer(event.target.value); invalidate(); }}
          />
          <small>{newer.length}/{CONTRACT_VERSION_MAX_CHARS} tekens · {privateContractLines(newer).length} regels</small>
          <span>Of laad uitsluitend een lokale UTF-8 .txt met nieuwe concepttekst:</span>
          <input type="file" accept=".txt,text/plain"
            aria-label="Laad nieuwere contracttekst uit een lokaal TXT-bestand"
            onChange={event => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              void importPlainTextContract(file, 'newer');
            }} />
        </label>
      </div>
      <div style={{display:'flex', gap:12, flexWrap:'wrap', marginTop:12}}>
        <button type="button" onClick={compare}
          disabled={!earlier.trim() || !newer.trim() ||
            privateContractLines(earlier).length > CONTRACT_VERSION_MAX_LINES ||
            privateContractLines(newer).length > CONTRACT_VERSION_MAX_LINES}>
          Vergelijk mijn twee teksten lokaal
        </button>
        <button type="button" disabled={!earlier && !newer}
          onClick={() => {
            const previousEarlier = earlier;
            setEarlier(newer);
            setNewer(previousEarlier);
            invalidate();
            setNotice('Oud en nieuw omgewisseld. Bestaande vergelijking, vragen en rapporttoestemmingen zijn gewist.');
          }}>Wissel oud en nieuw</button>
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
        <p aria-live="polite">
          <strong>{whitespaceOnlyGroups} groepen met dezelfde niet-witruimtetekens · {groups.length - whitespaceOnlyGroups} groepen met andere letterlijke tekenwijzigingen.</strong>
          {' '}Dit is uitsluitend een tekenvergelijking, geen juridische beoordeling.
          Ook witruimte en regelafbreking kunnen betekenis hebben. Alle groepen blijven
          beschikbaar voor controle en blijven onderdeel van de volledige vergelijking en privé-back-up.
        </p>
        <h4>Mijn wijzigingsgroepen nalopen</h4>
        <p><strong>{reviewed} van {groups.length} groepen handmatig bekeken.</strong> Vink
          iedere groep uitsluitend af nadat je de oorspronkelijke contractteksten hebt
          vergeleken. Een vinkje betekent niet dat je akkoord gaat of dat een wijziging veilig is.
          Notities en vinkjes staan alleen tijdelijk in dit tabblad.</p>
        <div style={{display:'grid',gap:10,marginBottom:14,maxWidth:720}}>
          <label style={{display:'grid',gap:6}}>
            <strong>Zoek in gewijzigde contractregels en mijn eigen notities</strong>
            <input type="search" value={groupSearch} maxLength={120}
              autoComplete="off" spellCheck={false}
              placeholder="Bijvoorbeeld borg, huurprijs, opzegtermijn of groepsnummer"
              onChange={event => setGroupSearch(event.target.value)} />
          </label>
          <label style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="checkbox" checked={onlyOpen}
              onChange={event => setOnlyOpen(event.target.checked)} />
            Toon alleen groepen die ik nog niet heb bekeken
          </label>
          <label style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="checkbox" checked={notesOnly}
              onChange={event => setNotesOnly(event.target.checked)} />
            Toon alleen groepen met een eigen aandachtspunt
          </label>
          <label style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="checkbox" checked={numbersOnly}
              onChange={event => setNumbersOnly(event.target.checked)} />
            Toon groepen met cijfers in gewijzigde regels ({groupsWithDigits})
          </label>
          <label style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type="checkbox" checked={changedDigitsOnly}
              onChange={event => setChangedDigitsOnly(event.target.checked)} />
            Toon mogelijke cijfertekenwijzigingen ({changedDigitGroupIds.size})
          </label>
          <small>Het brede filter zoekt cijfers in gewijzigde regels. Dit extra filter
            zoekt bij één-op-één regelvervanging alleen daadwerkelijk gewijzigde
            cijfertekens. Complexe wijzigingen met meerdere regels blijven kandidaat
            wanneer daar cijfers in voorkomen: hun onderlinge overeenkomst is onbekend.
            Geen filter bepaalt of huur, datum of juridische afspraak inhoudelijk is
            gewijzigd. Ook wijzigingen zonder cijfers kunnen belangrijk zijn.</small>
          <p aria-live="polite" style={{margin:0}}>
            <strong>{visibleGroups.length} van {groups.length} wijzigingsgroepen zichtbaar.</strong>
            {' '}Zoeken en filteren gebeurt alleen in dit tabblad; de volledige vergelijking,
            afvinkstatus, privé-back-up en rapporten blijven ongewijzigd.
          </p>
          {(groupSearch || onlyOpen || notesOnly || numbersOnly || changedDigitsOnly) && <button type="button"
            style={{justifySelf:'start'}} onClick={() => {
              setGroupSearch(''); setOnlyOpen(false); setNotesOnly(false);
              setNumbersOnly(false); setChangedDigitsOnly(false);
            }}>Wis alleen deze weergavefilters</button>}
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginBottom:12}}>
          <button type="button" disabled={!availableOpenGroups.length}
            onClick={jumpToNextOpenGroup}>
            Naar volgende zichtbare, nog niet bekeken groep ({availableOpenGroups.length})
          </button>
          <small>Springt alleen naar een bestaande groep; verandert geen
            afvinkstatus, filter of contracttekst.</small>
        </div>
        {visibleGroups.length > 1 && <details style={{marginBottom:14}}>
          <summary>Snel naar een zichtbare wijzigingsgroep ({visibleGroups.length})</summary>
          <nav aria-label="Spring naar een zichtbare contractwijziging"
            style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
            {visibleGroups.map(group => <a key={group.id}
              href={'#woonpoints-contractversies-groep-' + group.id}
              style={{padding:'5px 8px',border:'1px solid #d2dcd7',borderRadius:8}}>
              Groep {group.id} · {reviewedGroups.includes(group.id) ? 'bekeken' : 'open'}
            </a>)}
          </nav>
        </details>}
        {visibleGroups.map(group => (
            <article id={'woonpoints-contractversies-groep-' + group.id}
              key={group.id} tabIndex={-1} style={{border:'1px solid #d2dcd7',borderRadius:10,
              scrollMarginTop:20,padding:12,marginBottom:12}}>
              <strong>Wijzigingsgroep {group.id} · {group.rows.length} gewijzigde regels</strong>
              <PrivateContractParallelRows group={group.id} rows={group.rows} />
              {(() => {
                const replacement = privateContractSingleReplacement(group);
                return replacement ?
                  <PrivateContractInlineChange {...replacement} /> : null;
              })()}
              {(group.before || group.after) && <details style={{marginTop:8,marginBottom:8}}>
                <summary>Bekijk ongewijzigde regels direct rondom deze wijziging</summary>
                <p style={{margin:'6px 0'}}><small>
                  Alleen de direct aangrenzende identieke tekstregels. Context helpt
                  terugzoeken, maar bevestigt geen juridische samenhang of akkoord.
                </small></p>
                {([['Vóór de wijziging', group.before], ['Na de wijziging', group.after]] as const)
                  .map(([label, row]) => row ? <div key={label}
                    style={{padding:'7px 9px',background:'#f2f6f2',marginTop:6,borderRadius:8}}>
                    <small>{label} · oud {row.oldLine} / nieuw {row.newLine}</small>
                    <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'3px 0'}}>
                      {row.text || '(lege regel)'}
                    </pre>
                  </div> : null)}
              </details>}
              {searchTerm && (groupNotes[group.id] || '').toLowerCase().includes(searchTerm) &&
                <p style={{margin:'8px 0 0'}}><small>Zoekterm komt ook voor in je eigen aandachtspunt.</small></p>}
              <div style={{maxHeight:240,overflowY:'auto',overflowWrap:'anywhere'}}>
                {group.rows.map((row,index) => <div key={index} style={{marginTop:8}}>
                  <small>{row.kind === 'added' ? '+ Nieuw · regel ' + row.newLine :
                    '− Oud · regel ' + row.oldLine}</small>
                  <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',margin:'2px 0'}}>
                    {highlightMatchedText(row.text)}
                  </pre>
                </div>)}
              </div>
              <label style={{display:'grid',gap:6,marginTop:12}}>
                Mijn eigen aandachtspunt (optioneel, maximaal 240 tekens)
                <textarea rows={2} maxLength={240} value={groupNotes[group.id] || ''}
                  placeholder="Bijvoorbeeld: dit bedrag navragen bij de verhuurder"
                  onChange={event => {
                    setGroupNotes(previous => ({...previous,[group.id]:event.target.value}));
                    invalidateExport();
                  }}/>
              </label>
              <label style={{display:'flex',gap:8,alignItems:'center',marginTop:10}}>
                <input type="checkbox" checked={reviewedGroups.includes(group.id)}
                  onChange={event => {
                    setReviewedGroups(previous => previous.includes(group.id) ?
                      previous.filter(id => id !== group.id) : [...previous,group.id]);
                    invalidateExport();
                  }}/>
                Ik heb deze groep zelf naast de originele documenten bekeken
              </label>
            </article>
          ))}
        {visibleGroups.length === 0 && groups.length > 0 &&
          <p role="status">Geen wijzigingsgroepen voldoen aan de gekozen filters.
            Wis je zoekterm of vink een weergavefilter uit. Er is niets verwijderd
            en de volledige vergelijking blijft beschikbaar.</p>}
        {onlyOpen && reviewed === groups.length && groups.length > 0 &&
          <p role="status">Alle groepen zijn handmatig afgevinkt. Dit is geen akkoord
            of juridische controle; vergelijk de originele documenten zelf.</p>}
        <details>
          <summary>Bekijk ook de volledige regel-voor-regel vergelijking, inclusief ongewijzigd</summary>
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
        </details>
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
        <label style={{display:'flex',gap:8,alignItems:'start',marginTop:12}}>
          <input type="checkbox" checked={includeNotes}
            onChange={event => {
              setIncludeNotes(event.target.checked);
              invalidateExport();
            }}/>
          <span>Neem ook mijn eigen aandachtspunten op in de TXT. Deze kunnen persoonlijke
            gegevens bevatten en worden standaard <strong>niet</strong> geëxporteerd.</span>
        </label>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:12}}>
          <button type="button" disabled={!current.additions && !current.removals}
            onClick={prepareReport}>Bekijk mijn volledige wijzigingsrapport met afvinkstatus</button>
          <button type="button" disabled={!groups.some(group => groupNotes[group.id]?.trim())}
            onClick={prepareQuestions}>Bekijk aparte vragenlijst (alleen mijn eigen notities)</button>
          <button type="button" disabled={!groups.some(group => groupNotes[group.id]?.trim())}
            onClick={prepareLandlordDraft}>Bekijk conceptbericht aan verhuurder</button>
        </div>
        <p><small>De vragenlijst en het conceptbericht bevatten geen automatisch gekopieerde contractregels;
          zelf geschreven notities kunnen alsnog privé-informatie bevatten.
          Geen verzending naar verhuurder, e-mail of externe dienst.</small></p>
        {filePreview?.source === previewKey && <div style={{marginTop:12}}>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:300,overflowY:'auto',
            padding:14,background:'#f2f6f2',borderRadius:10}}>{filePreview.text}</pre>
          <label style={{display:'flex',gap:8,alignItems:'start',marginBottom:10}}>
            <input type="checkbox" checked={confirmSave}
              onChange={event => setConfirmSave(event.target.checked)}/>
            <span>Ik heb de volledige tekst bekeken en kies bewust voor een lokale TXT-download
              of een kopie naar het gedeelde klembord. Andere apps kunnen gekopieerde
              tekst lezen; ik bepaal zelf waar ik deze plak.</span>
          </label>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            <button type="button" disabled={!confirmSave} onClick={saveReport}>
              Download uitsluitend mijn bekeken {filePreview.filename}
            </button>
            <button type="button" disabled={!confirmSave} onClick={() => {void copyReviewedReport();}}>
              Kopieer uitsluitend deze bekeken tekst
            </button>
          </div>
        </div>}
      </div>}
      <div style={{marginTop:20,padding:16,border:'1px solid #c9d8cf',borderRadius:12}}>
        <h3>Mijn contractvergelijking bewust bewaren of herstellen</h3>
        <p>Deze optionele privé-back-up bevat beide <strong>volledige contractteksten</strong>,
          eigen notities en aangevinkte groepen. Er is geen automatische opslag, upload,
          synchronisatie of verzending. Een lokaal gedownload bestand kan door jouw eigen
          opslagprovider gesynchroniseerd worden. Deel dit bestand niet onbedoeld.</p>
        <button type="button" disabled={!current} onClick={previewReviewBackup}>
          Bekijk volledige privé-JSON vóór download
        </button>
        {reviewBackupPreview?.source === reviewSource && <div style={{marginTop:12}}>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:300,overflowY:'auto',
            padding:14,background:'#f2f6f2',borderRadius:10}}>{reviewBackupPreview.content}</pre>
          <label style={{display:'flex',gap:8,alignItems:'start',marginBottom:10}}>
            <input type="checkbox" checked={reviewBackupAccepted}
              onChange={event => setReviewBackupAccepted(event.target.checked)}/>
            <span>Ik heb de volledige privé-JSON met contractinhoud bekeken en kies bewust
              zelf waar ik dit persoonlijke bestand bewaar.</span>
          </label>
          <button type="button" disabled={!reviewBackupAccepted} onClick={downloadReviewBackup}>
            Download uitsluitend mijn gecontroleerde privé-back-up
          </button>
        </div>}
        <label style={{display:'grid',gap:6,marginTop:18,maxWidth:500}}>
          <strong>Mijn eerdere privé-review-JSON lokaal openen (maximaal 64 KiB)</strong>
          <input type="file" accept=".json,application/json"
            onChange={event => {const file = event.currentTarget.files?.[0];
              event.currentTarget.value = ''; void readReviewBackup(file);}}/>
        </label>
        {restoreCandidate && <div style={{marginTop:12}}>
          <p><strong>Vervangingspreview:</strong> deze import overschrijft pas na jouw aparte
            bevestiging de twee tijdelijke teksten, notities en afvinkstatussen.
            Hij voert geen wijzigingen uit in officiële documenten.</p>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:300,overflowY:'auto',
            padding:14,background:'#f2f6f2',borderRadius:10}}>{restoreCandidate.content}</pre>
          <label style={{display:'flex',gap:8,alignItems:'start',marginBottom:10}}>
            <input type="checkbox" checked={restoreAccepted}
              onChange={event => setRestoreAccepted(event.target.checked)}/>
            <span>Ik heb de complete vervangende contractteksten en reviewstatus bekeken
              en wil mijn huidige tijdelijke vergelijking vervangen.</span>
          </label>
          <button type="button" disabled={!restoreAccepted} onClick={acceptReviewRestore}>
            Herstel uitsluitend mijn bekeken contractreview
          </button>
          <button type="button" onClick={() => {setRestoreCandidate(null);
            setRestoreAccepted(false);}}>Annuleer import</button>
        </div>}
        {restoreUndo && <button type="button" style={{marginTop:12}}
          disabled={restoreUndo.restoredSource !== reviewSource} onClick={undoReviewRestore}>
          Mijn vorige tabbladinvoer eenmalig terugzetten
        </button>}
      </div>
      {notice && <p role="status" aria-live="polite">{notice}</p>}
      <p><small>Deze functie gebruikt uitsluitend tijdelijk tabbladgeheugen.
        TXT-import leest alleen de door jou geselecteerde UTF-8-tekst lokaal
        (maximaal 32 KiB bestand, 8.000 tekens en 80 regels per concept);
        PDF/DOCX, scans en juridische inhoudsanalyse worden niet ondersteund.
        Geen account, upload, contractacceptatie, AI-samenvatting, automatische opslag
        of contact met een verhuurder. Sluiten of verversen wist de invoer van dit onderdeel;
        een eerder gedownload TXT-bestand blijft onder jouw eigen beheer.</small></p>
    </section>
  );
}
