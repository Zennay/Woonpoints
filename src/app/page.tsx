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
  {id:'nazorg-contactlijn',title:'Contacttijdlijn',category:'verhuizen'},
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
  const [expandContactTimeline, setExpandContactTimeline] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<string | null>(null);
  const [historyKind, setHistoryKind] = useState<ContactKind>('eigen-notitie');
  const [historyDay, setHistoryDay] = useState(today());
  const [historyDetail, setHistoryDetail] = useState('');
  const [historyDeletePending, setHistoryDeletePending] = useState<string | null>(null);
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
  const [incomingSource, setIncomingSource] = useState('');
  const [incomingRiskApproved, setIncomingRiskApproved] = useState(false);
  const [aftercareImportUndo, setAftercareImportUndo] = useState<{
    previous: AftercareBackup; importedSignature: string
  } | null>(null);
  const [removalUndo, setRemovalUndo] = useState<{
    previous: AftercareBackup; resultingSignature: string; label: string
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
  const incomingCurrent = incoming !== null && incomingSource === aftercareImportSignature;
  const aftercareUndoCurrent = aftercareImportUndo !== null &&
    aftercareImportUndo.importedSignature === aftercareImportSignature;
  const removalUndoCurrent = removalUndo !== null &&
    removalUndo.resultingSignature === aftercareImportSignature;
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
      setMessage('Import geweigerd: controleer eerst de actuele wijzigingen en bevestig de vervanging opnieuw.');
      return;
    }
    const previous: AftercareBackup = {
      items: items.map(item => ({ ...item })),
      history: history.map(event => ({ ...event }))
    };
    const importedSignature = JSON.stringify({ items: incoming.items, history: incoming.history });
    setAftercareImportUndo({ previous, importedSignature });
    setItems(incoming.items);
    setHistory(incoming.history);
    resetAftercareRestoreEphemera();
    setHistoryTarget(null);
    setHistoryDeletePending(null);
    setIncoming(null);
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
    setMessage('Import bevestigd. Alle punten zichtbaar; de vorige lokale status is eenmaal veilig herstelbaar zolang niets verandert.');
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
                </li>)}
            </ol>}
          {contactTimeline.length > 20 && <button type="button" className="secondary"
            aria-expanded={expandContactTimeline}
            onClick={() => setExpandContactTimeline(!expandContactTimeline)}>
            {expandContactTimeline ? 'Toon eerste 20 momenten' :
              'Toon alle ' + contactTimeline.length + ' momenten'}
          </button>}
          <p>Vrije contacttekst blijft hier ingeklapt totdat je zelf opent. Er is
            geen automatische export, synchronisatie of contact met derden.</p>
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
              <h3>Bekijk welke eigen gegevens worden vervangen</h3>
              <p>Gecontroleerd bestand: {incoming.items.length} punten en {incoming.history.length}
                {' '}contactmomenten. Huidige tab: {items.length} punten en {history.length}
                {' '}contactmomenten. Niets wordt gewijzigd vóór je aparte bevestiging.</p>
              <p>Dit overzicht toont namen, eigen statuswijzigingen en aantallen. Vrije
                privénotities worden niet weergegeven, maar hun wijzigingen tellen wel mee.</p>
              {([
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
                  disabled={!incomingCurrent}
                  onChange={event => setIncomingRiskApproved(event.target.checked)}/>
                Ik begrijp welke eigen nazorgpunten en contactmomenten verdwijnen of wijzigen,
                inclusief mogelijk verborgen privéinhoud. Ik heb zo nodig een eigen back-up gemaakt.
              </label>
              <div className="aftercare-actions">
                <button type="button" disabled={!incomingCurrent || !incomingRiskApproved}
                  onClick={confirmAftercareImport}>Ja, vervang mijn hele nazorgdossier</button>
                <button type="button" className="secondary" onClick={() => {
                  setIncoming(null); setIncomingSource(''); setIncomingRiskApproved(false);
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
