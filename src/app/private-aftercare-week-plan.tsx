'use client';

import { useMemo, useState } from 'react';

export type PrivateWeekAction = {
  id: string;
  title: string;
  room: string;
  priority: 'laag' | 'normaal' | 'dringend';
  status: 'open' | 'gemeld';
  due: string;
  urgency: number;
  reason: string;
};

export type PrivateWeekAppointment = {
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
  onDownload: (content: string) => void;
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

export function PrivateAftercareWeekPlan({
  day, sourceFingerprint, actions, appointments, onOpen, onDownload
}: Props) {
  const [horizonDays, setHorizonDays] = useState<7 | 30>(7);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<{ fingerprint: string; text: string; count: number } | null>(null);
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
    sourceFingerprint, day, endDay, selected: currentSelection, appointments: upcomingAppointments
  });
  const previewCurrent = preview !== null && preview.fingerprint === fingerprint;
  const urgentCount = plan.filter(action => action.urgency <= 3).length;
  const datedCount = plan.filter(action => action.due && action.due >= day && action.due <= endDay).length;

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
    setPreview({ fingerprint, text, count: currentSelection.length });
    setApproved(false);
    setFeedback('Eigen plan klaargezet ter controle. Er is nog geen bestand opgeslagen.');
  }

  function confirmDownload() {
    if (!previewCurrent || !preview || !approved ||
      (!currentSelection.length && !upcomingAppointments.length)) {
      setApproved(false);
      setPreview(null);
      setFeedback('De selectie of het dossier is gewijzigd. Controleer eerst een nieuw plan.');
      return;
    }
    onDownload(preview.text);
    setApproved(false);
    setPreview(null);
    setFeedback('Het door jou gecontroleerde privéplan is als tekstbestand gedownload.');
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
      {preview && <div className="aftercare-confirm" role="group" aria-label="Eigen nazorgplan controleren">
        <p><strong>{preview.count} geselecteerde acties</strong>; toekomstafspraken zijn eigen notities,
          geen verifieerbare boekingen.</p>
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
          Download precies dit gecontroleerde plan (.txt)
        </button>
        <button type="button" className="secondary"
          onClick={() => { setPreview(null); setApproved(false); }}>Annuleer mijn voorvertoning</button>
      </div>}
      <p role="status" aria-live="polite">{feedback}</p>
      <p>Alleen eigen tabbladgegevens. De optionele TXT bevat titels/ruimtes en datums, maar geen
        vrije contact- of gebreksnotities. Een eigen datum is geen wettelijke of met een derde afgesproken termijn.</p>
    </div>
  </section>;
}
