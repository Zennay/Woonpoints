'use client';
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { PrivateMovingDayTimeline } from './manual-month-progress';
import { PrivateMovingPackingInventory } from './manual-month-progress';
import { PrivateReactionWorkflow, PrivateReactionPacing, PrivateCommuteComparison, PrivateMovingHelperRoster, PrivateAddressChangePlanner } from './position-stats';
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
  {id:'private-moving-heading',title:'Verhuizen',category:'verhuizen'},
  {id:'private-moving-volume-heading',title:'Verhuisvolume',category:'verhuizen'},
  {id:'private-moving-workspace-heading',title:'Verhuiswerkmap',category:'verhuizen'},
  {id:'private-moving-day-heading',title:'Verhuisdag',category:'verhuizen'},
  {id:'private-packing-heading',title:'Paklijst',category:'verhuizen'},
  {id:'private-moving-helpers-heading',title:'Verhuishulp',category:'verhuizen'},
  {id:'private-address-change-heading',title:'Adreswijzigingen',category:'verhuizen'},
  {id:'private-handover-heading',title:'Sleutelrapport',category:'verhuizen'},
  {id:'private-document-readiness-heading',title:'Documenten',category:'verhuizen'},
  {id:'private-moving-expenses-heading',title:'Werkelijke kosten',category:'verhuizen'},
  {id:'private-moving-quotes-heading',title:'Verhuisoffertes',category:'verhuizen'},
  {id:'private-cost-split-heading',title:'Kosten delen',category:'verhuizen'},
  {id:'position-stats-heading',title:'Posities',category:'inzichten'},
  {id:'monthly-positions-heading',title:'Maandtrend',category:'inzichten'},
  {id:'nazorg',title:'Nazorg en gebreken',category:'verhuizen'}
];
const homeCategoryOptions=[
  {id:'snel',label:'Snelstart'},{id:'alles',label:'Alles'},
  {id:'reacties',label:'Reacties'},{id:'woning',label:'Woningen'},
  {id:'verhuizen',label:'Verhuizen'},{id:'inzichten',label:'Inzichten'}
] as const;

const cards = [
  ['Maanddoel', 'Onbekend', 'Doel: 4 geldige reacties; geen geverifieerde accountgegevens'],
  ['Actieve reacties', 'Onbekend', 'Nog geen account gekoppeld; actuele gegevens ontbreken'],
  ['Zoekpunten', '—', 'Nog geen puntensnapshot beschikbaar'],
  ['Worker', 'Dry-run', 'Live reageren is bewust geblokkeerd']
];

export default function HomePage() {
  const [navigationCategory,setNavigationCategory]=useState<'snel'|'alles'|HomeNavCategory>('snel');
  const [navigationSearch,setNavigationSearch]=useState('');
  const searchTerm=navigationSearch.normalize('NFKC').trim().toLocaleLowerCase('nl-NL');
  const navigationResults=homepageDestinations.filter(destination=>{
    if(searchTerm)return destination.title.normalize('NFKC').toLocaleLowerCase('nl-NL').includes(searchTerm);
    return navigationCategory==='alles'||(navigationCategory==='snel'?
      destination.category==='essentieel':destination.category===navigationCategory);
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
        <input id="woonpoints-nav-search" type="search" value={navigationSearch}
          onChange={event=>setNavigationSearch(event.target.value)}
          maxLength={60} autoComplete="off"
          placeholder="Bijv. paklijst, maandrapport of nazorg"
          style={{display:'block',width:'100%',maxWidth:480,minHeight:44,
            border:'2px solid #536d5a',borderRadius:9,padding:10}}/>
        <div role="group" aria-label="Woonpoints-categorieën"
          style={{display:'flex',flexWrap:'wrap',gap:8,margin:'12px 0'}}>
          {homeCategoryOptions.map(category=><button type="button" key={category.id}
            aria-pressed={!searchTerm&&navigationCategory===category.id}
            onClick={()=>{setNavigationCategory(category.id);setNavigationSearch('');}}
            style={{minHeight:44,minWidth:74,padding:'8px 12px',borderRadius:9,
              border:'1px solid #355e42',cursor:'pointer',
              background:!searchTerm&&navigationCategory===category.id?'#355e42':'white',
              color:!searchTerm&&navigationCategory===category.id?'white':'#355e42'}}>
            {category.label}
          </button>)}
        </div>
        <p role="status" aria-live="polite">{navigationResults.length} van
          {' '}{homepageDestinations.length} onderdelen zichtbaar{searchTerm?' · alle categorieën doorzocht':''}.</p>
        {navigationResults.length===0?<p>Geen onderdeel gevonden. Wis je zoektekst of kies Alles.</p>:
          <ul className="quick-nav-links">{navigationResults.map(item=><li key={item.id}>
            <a href={'#'+item.id}>{item.title}</a>
          </li>)}</ul>}
        {!searchTerm&&navigationCategory!=='alles'&&<button type="button"
          onClick={()=>setNavigationCategory('alles')}
          style={{minHeight:44,marginTop:12,padding:'8px 14px',
            color:'#355e42',background:'white',border:'1px solid #355e42',borderRadius:9}}>
          Toon alle {homepageDestinations.length} onderdelen
        </button>}
        <p>Alle categorieën en zoekwoorden werken uitsluitend in dit tabblad; er worden geen
          persoonlijke gegevens naar een server verstuurd.</p>
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
  const allChecks: InspectionCheck[] = [...INSPECTION_CHECKS, ...customChecks.map(check => ({
    ...check, tip: 'Zelf toegevoegd controlepunt; dit is geen geverifieerde inspectie-eis.'
  }))];
  const checked = allChecks.filter(row => grades[row.id] !== undefined);
  const flagged = allChecks.filter(row => grades[row.id] === 'aandacht');
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
        {INSPECTION_ALL_ROOMS.map(room => {
          const rows = allChecks.filter(item => item.room === room);
          const completed = rows.filter(item => grades[item.id]).length;
          return (
            <details key={room} className="aftercare-inspection-room">
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
  const [completeUndo, setCompleteUndo] = useState<{
    previous: CompleteHandover;
    importedSignature: string;
  } | null>(null);
  const [confirmCompleteUndo, setConfirmCompleteUndo] = useState(false);
  const [completeMessage, setCompleteMessage] = useState('');
  const [includePrivateSummaryNotes, setIncludePrivateSummaryNotes] = useState(false);
  const [completeSummaryText, setCompleteSummaryText] = useState('');
  const [completeSummarySource, setCompleteSummarySource] = useState('');
  const [completeSummaryApproved, setCompleteSummaryApproved] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<FollowUp[]>([]);
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);
  const [historyKind, setHistoryKind] = useState<ContactKind>('eigen-notitie');
  const [historyDay, setHistoryDay] = useState(today());
  const [historyDetail, setHistoryDetail] = useState('');
  const [historyDeletePending, setHistoryDeletePending] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'actief' | 'alles' | 'afgerond'>('actief');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [clearPending, setClearPending] = useState(false);
  const [incoming, setIncoming] = useState<AftercareBackup | null>(null);
  const [message, setMessage] = useState('');
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
  const canUndoComplete = completeUndo !== null &&
    completeUndo.importedSignature === completeDataSignature;
  const completeSummaryFingerprint = JSON.stringify({
    inspectionGrades, inspectionNotes, inspectionCustomChecks, items, history, includePrivateSummaryNotes
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

  const shown = useMemo(() => items.filter(item => filter === 'alles' ||
    (filter === 'actief' ? item.status !== 'afgerond' : item.status === 'afgerond'))
    .sort((a, b) => (a.status === 'afgerond' ? 1 : 0) - (b.status === 'afgerond' ? 1 : 0) ||
      (a.due || '9999').localeCompare(b.due || '9999') || a.title.localeCompare(b.title)),
    [items, filter]);

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
  function removeFollowUp(id: string) {
    setHistory(prev => prev.filter(event => event.id !== id));
    setHistoryDeletePending(null);
    setMessage('Eigen contactnotitie uit het tabblad verwijderd. Externe berichten blijven onaangetast.');
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
        if (includePrivateSummaryNotes && inspectionGrades[check.id] === 'aandacht' &&
            inspectionNotes[check.id]?.trim()) {
          lines.push('  Privétoelichting: ' + inspectionNotes[check.id].trim());
        }
      }
    }
    lines.push('', 'NAZORG: ' + items.length + ' punten / ' + history.length + ' eigen contactnotities');
    for (const issue of items) {
      lines.push('', issue.room + ' — ' + issue.title, 'Status: ' + issue.status +
        ' · Eigen prioriteit: ' + issue.priority + ' · Eigen streefdatum: ' + (issue.due || 'niet ingesteld'));
      if (includePrivateSummaryNotes && issue.note.trim()) lines.push('Privénotitie: ' + issue.note.trim());
      const log = history.filter(event => event.issueId === issue.id);
      lines.push('Zelf genoteerde contactmomenten: ' + log.length);
      if (includePrivateSummaryNotes) {
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
  function exportCompleteSummary() {
    if (!completeSummaryCurrent || !completeSummaryApproved) {
      setCompleteMessage('Maak en controleer eerst een actueel voorbeeld.'); return;
    }
    download('woonpoints-eigen-volledige-overdracht.txt',
      completeSummaryText, 'text/plain;charset=utf-8');
    setCompleteMessage('Zelf gecontroleerde samenvatting gedownload; er is niets automatisch verstuurd.');
  }

  function exportCompleteHandover() {
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
    setCompleteMessage('Complete privé-back-up gedownload. Bewaar dit bestand zelf op een veilige plek.');
  }
  async function importCompleteHandover(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPendingCompleteImport(null);
    if (!file) return;
    if (file.size > COMPLETE_HANDOVER_MAX_BYTES) {
      setCompleteMessage('Import geweigerd: maximaal 40 KiB.'); return;
    }
    try {
      const data = readCompleteHandover(await file.text());
      setPendingCompleteImport(data);
      setCompleteMessage('Volledige back-up ingelezen en gecontroleerd. Bevestig het vervangen van beide onderdelen.');
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
    if (pendingCompleteImport === null) return;
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
    const json = JSON.stringify({ kind: KIND, schema: 2, items, history }, null, 2);
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
      setMessage(`Gecontroleerd bestand: ${value.items.length} punten, ${value.history.length} contactmomenten. Bevestig vervanging apart.`);
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
        </div>
        <ul className="aftercare-stats">
          <li><strong>{items.length}</strong> vastgelegd</li>
          <li><strong>{active.length}</strong> nog open</li>
          <li><strong>{overdue.length}</strong> eigen deadlines verstreken</li>
          <li><strong>{items.filter(item => item.status === 'afgerond').length}</strong> afgerond</li>
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
              {followUpInbox.slice(0, 16).map(entry => <li key={entry.item.id} className="aftercare-item">
                <strong>{entry.item.room}: {entry.item.title}</strong>
                <p>{entry.reason}</p>
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
          {followUpInbox.length > 16 && <p>Je ziet de eerste 16 van {followUpInbox.length} open punten. De rest staat in het volledige nazorgdossier.</p>}
          <p>Conceptkeuze is handmatig en verstuurt niets. Contactmomenten en eigen status pas je per punt in het dossier hieronder aan.</p>
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
        </div>
        <div>
          {shown.length === 0 ? <p>Geen aandachtspunten binnen deze weergave.</p> :
            <ul className="aftercare-list">{shown.map(item =>
              <li className="aftercare-item" key={item.id}>
                <strong>{item.title}</strong>
                <p>{item.room} · <b>{item.priority}</b> · {item.status}</p>
                <p>Eigen streefdatum: {item.due || 'niet ingesteld'}{item.status !== 'afgerond' && item.due && item.due < currentDay ? ' · VERSTREKEN' : ''}</p>
                {item.note && <p className="aftercare-note">{item.note}</p>}
                <details className="aftercare-history">
                  <summary>Mijn contacthistorie ({history.filter(event => event.issueId === item.id).length})</summary>
                  <p>Alleen wat je zelf invult. Geen e-mail-, verhuurder- of WoningNet-verificatie.</p>
                  {history.filter(event => event.issueId === item.id).length > 0 ?
                    <ol>{history.filter(event => event.issueId === item.id)
                      .slice().sort((a, b) => b.day.localeCompare(a.day))
                      .map(log => <li key={log.id}>
                        <strong>{log.day} · {CONTACT_TYPES.find(type => type.id === log.kind)?.title}</strong>
                        <p className="aftercare-note">{log.detail}</p>
                        <button className="secondary" onClick={() => setHistoryDeletePending(log.id)}>Verwijder dit moment…</button>
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
                    <button onClick={() => { setItems(prev => prev.filter(entry => entry.id !== item.id)); setHistory(prev => prev.filter(entry => entry.issueId !== item.id)); setHistoryTarget(null); setHistoryDeletePending(null); setPendingDelete(null); if (editing === item.id) { setEditing(null); setDraft(EMPTY); } }}>Ja, verwijder</button>
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
            <button type="button" onClick={exportCompleteHandover}
              disabled={items.length === 0 && history.length === 0 &&
                inspectionCustomChecks.length === 0 &&
                !Object.values(inspectionGrades).some(value => value === 'goed' || value === 'aandacht')}>
              Download complete privé-JSON
            </button>
          </div>
          <div className="aftercare-confirm">
            <h3>Eigen leesbare samenvatting</h3>
            <p>Maak optioneel een TXT voor je eigen dossier. De voorvertoning toont precies wat in
              het bestand komt. Vrije notities of zelf genoteerde contactteksten zijn standaard
              verborgen en worden pas opgenomen wanneer je dat hieronder zelf aanvinkt.</p>
            <label className="aftercare-checkbox" htmlFor="complete-summary-notes">
              <input id="complete-summary-notes" type="checkbox"
                checked={includePrivateSummaryNotes}
                onChange={event => {
                  setIncludePrivateSummaryNotes(event.target.checked);
                  setCompleteSummaryApproved(false);
                }} />
              Voeg mijn privétoelichtingen en zelf genoteerde contactteksten toe
            </label>
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
              <div className="aftercare-actions">
                <button type="button" onClick={confirmCompleteImport}>Ja, herstel beide onderdelen</button>
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
            <button disabled={!items.length} onClick={exportJson}>Download JSON-back-up</button>
            <button className="secondary" disabled={!items.length} onClick={exportCsv}>Download CSV</button>
            <button className="secondary" disabled={!items.length} onClick={exportText}>Download TXT-dossier</button>
          </div>
          <label htmlFor="nazorg-import">Open eigen nazorg-JSON (max. 16 KiB)</label>
          <input id="nazorg-import" type="file" ref={uploadRef} accept=".json,application/json" onChange={importFile} />
          {incoming !== null && <div className="aftercare-confirm" role="group" aria-label="Import bevestigen">
            <p>{incoming.items.length} geldige punten en {incoming.history.length} contactmomenten gevonden. Je huidige {items.length} punten en {history.length} contactmomenten worden pas na bevestiging vervangen.</p>
            <div className="aftercare-actions">
              <button onClick={() => { setItems(incoming.items); setHistory(incoming.history); setHistoryTarget(null); setHistoryDeletePending(null); setIncoming(null); setDraft(EMPTY); setEditing(null); setClearPending(false); setPendingDelete(null); setMessage('Import bevestigd. Alleen dit tabblad is gewijzigd.'); }}>Vervang huidige punten</button>
              <button className="secondary" onClick={() => { setIncoming(null); setMessage('Import geannuleerd; bestaande punten behouden.'); }}>Annuleer import</button>
            </div>
          </div>}
          <div className="aftercare-actions"><button className="secondary" disabled={!items.length} onClick={() => setClearPending(true)}>Wis alle tabbladpunten…</button></div>
          {clearPending && <div className="aftercare-confirm">
            <p>Alle huidige aandachtspunten definitief uit dit tabblad verwijderen? Een eerder gedownloade back-up blijft bestaan.</p>
            <div className="aftercare-actions">
              <button onClick={() => { setItems([]); setHistory([]); setHistoryTarget(null); setHistoryDeletePending(null); setDraft(EMPTY); setEditing(null); setClearPending(false); setIncoming(null); setMessage('Tabbladpunten gewist.'); }}>Ja, wis alles</button>
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
