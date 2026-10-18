'use client';

import { useState } from 'react';

type ChecklistTask = { id: string; title: string; offset: number; group: string };
type ExtraTask = ChecklistTask & { group: 'Eigen taak' };

const DEFAULT_TASKS: ChecklistTask[] = [
  { id: 'contract', title: 'Huurafspraken en ingangsdatum zelf controleren', offset: -42, group: 'Voorbereiding' },
  { id: 'budget', title: 'Verhuisbudget en benodigde hulp afstemmen', offset: -35, group: 'Voorbereiding' },
  { id: 'vervoer', title: 'Vervoer en eventuele helpers regelen', offset: -28, group: 'Voorbereiding' },
  { id: 'nuts', title: 'Zelf energie-, water- en internetovergang plannen', offset: -21, group: 'Regelen' },
  { id: 'adres', title: 'Adreswijzigingen bij relevante partijen voorbereiden', offset: -14, group: 'Regelen' },
  { id: 'spullen', title: 'Dozen, kwetsbare spullen en verhuisvolgorde organiseren', offset: -10, group: 'Inpakken' },
  { id: 'sleutels', title: 'Eigen sleuteloverdracht en meterstanden afstemmen', offset: -3, group: 'Laatste dagen' },
  { id: 'dag', title: 'Sleutels, contactpersonen en eerste benodigdheden nalopen', offset: 0, group: 'Verhuisdag' },
  { id: 'nazorg', title: 'Eventuele open punten en adreswijzigingen nalopen', offset: 7, group: 'Na verhuizing' }
];

function dateOnly(value: string): Date | null {
  if (!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
    ? parsed : null;
}

function dayAtOffset(move: string, offset: number): string {
  const parsed = dateOnly(move);
  if (!parsed) return '';
  parsed.setUTCDate(parsed.getUTCDate() + offset);
  return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`;
}

function icsDate(day: string): string { return day.replace(/-/g, ''); }
function icsText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, ' ').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
function exportFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export default function PrivateMovingDayTimeline() {
  const [moveDate, setMoveDate] = useState('');
  const [completed, setCompleted] = useState<string[]>([]);
  const [extras, setExtras] = useState<ExtraTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newOffset, setNewOffset] = useState('-7');
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const dateValid = dateOnly(moveDate) !== null;
  const tasks = [...DEFAULT_TASKS, ...extras]
    .map(task => ({ ...task, due: dayAtOffset(moveDate, task.offset), done: completed.includes(task.id) }))
    .sort((a, b) => a.offset - b.offset || a.title.localeCompare(b.title, 'nl-NL'));
  const openTasks = tasks.filter(task => !task.done);
  const snapshot = JSON.stringify({ moveDate, completed, extras });
  const ready = dateValid && openTasks.length > 0;

  function edit() { setPending(null); setMessage(''); }
  function addTask() {
    const title = newTask.trim().replace(/[\u0000-\u001f\u007f]/g, ' ');
    const offset = Number(newOffset);
    if (!title || title.length > 60 || extras.length >= 6 || !Number.isInteger(offset) || offset < -120 || offset > 60) {
      setMessage('Eigen taak niet toegevoegd: max. 60 tekens, zes taken en 120 dagen vóór tot 60 dagen na verhuizing.');
      return;
    }
    const id = `extra-${Date.now()}-${extras.length}`;
    setExtras(current => [...current, { id, title, offset, group: 'Eigen taak' }]);
    setNewTask('');
    edit();
  }
  function downloadCalendar() {
    if (!ready || pending !== snapshot) { setPending(null); setMessage('De planning is gewijzigd. Bekijk eerst opnieuw de agenda-export.'); return; }
    const entries = openTasks.map(task => {
      const end = dayAtOffset(moveDate, task.offset + 1);
      return [
        'BEGIN:VEVENT',
        `UID:woonpoints-${task.id.replace(/[^a-zA-Z0-9-]/g, '')}-${icsDate(task.due)}@local`,
        `DTSTART;VALUE=DATE:${icsDate(task.due)}`,
        `DTEND;VALUE=DATE:${icsDate(end)}`,
        `SUMMARY:${icsText(task.title)}`,
        'DESCRIPTION:Zelf ingevulde Woonpoints-verhuisplanning. Controleer de echte deadlines bij de betreffende organisatie.',
        'END:VEVENT'
      ].join('\r\n');
    });
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Woonpoints//Prive Verhuisplan//NL',
      'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...entries, 'END:VCALENDAR', ''].join('\r\n');
    exportFile('woonpoints-verhuisacties.ics', ics, 'text/calendar;charset=utf-8');
    setPending(null);
    setMessage('Agenda-bestand lokaal aangeboden. Controleer bij import datum en officiële afspraken.');
  }

  return (
    <section className="panel" aria-labelledby="private-moving-day-heading">
      <p className="eyebrow">VERHUIZEN · PRIVÉ IN DIT TABBLAD</p>
      <h2 id="private-moving-day-heading">Verhuisdag: eigen stappenplan</h2>
      <p>Plan handmatig vanaf je verwachte verhuisdatum. Voorsteltijden zijn slechts suggesties,
        geen wettelijke termijnen, officiële afspraken of live gekoppelde status.</p>
      <label htmlFor="moving-day-date">Zelf gekozen verhuisdatum</label>
      <input id="moving-day-date" type="date" min="2000-01-01" max="2099-12-31" value={moveDate}
        onChange={event => { setMoveDate(event.target.value); edit(); }} />
      {!dateValid && <p>Kies een geldige datum om de voorgestelde planning te zien.</p>}
      {dateValid && <p><strong>{completed.length} van {tasks.length}</strong> acties afgevinkt ·
        {openTasks.length} open. Alles blijft alleen in het huidige tabblad, tenzij je zelf exporteert.</p>}
      <ol className="moving-day-list">
        {tasks.map(task => (
          <li key={task.id}>
            <label>
              <input type="checkbox" checked={task.done} onChange={() => {
                setCompleted(old => old.includes(task.id) ? old.filter(id => id !== task.id) : [...old, task.id]); edit();
              }} />
              <strong>{task.title}</strong>
            </label>
            <span> {dateValid ? task.due : `${Math.abs(task.offset)} dagen ${task.offset < 0 ? 'ervoor' : task.offset === 0 ? '(verhuisdag)' : 'erna'}`} · {task.group}</span>
            {task.id.startsWith('extra-') && <button type="button" onClick={() => {
              setExtras(old => old.filter(x => x.id !== task.id));
              setCompleted(old => old.filter(id => id !== task.id)); edit();
            }}>Verwijder eigen taak</button>}
          </li>
        ))}
      </ol>
      <fieldset>
        <legend>Eigen verhuisactie toevoegen (maximaal 6)</legend>
        <label htmlFor="moving-extra-title">Actie</label>
        <input id="moving-extra-title" type="text" autoComplete="off" maxLength={60}
          value={newTask} onChange={event => setNewTask(event.target.value)} />
        <label htmlFor="moving-extra-offset">Dagen t.o.v. verhuisdatum (-120 tot +60)</label>
        <input id="moving-extra-offset" type="number" min={-120} max={60} step={1}
          value={newOffset} onChange={event => setNewOffset(event.target.value)} />
        <button type="button" onClick={addTask} disabled={extras.length >= 6}>Voeg taak toe</button>
      </fieldset>
      <p>Geen automatische meldingen, cloudopslag of koppeling met WoningNet. De agenda-export
        bevat ook je zelf getypte actienamen: deel het bestand alleen bewust.</p>
      {ready && pending !== snapshot && <button type="button" onClick={() => {
        setPending(snapshot); setMessage('');
      }}>Bekijk agenda-export voor {openTasks.length} open acties…</button>}
      {ready && pending === snapshot && <div role="group" aria-label="Bevestig privé-agenda-export">
        <p><strong>{openTasks.length} open acties</strong> worden als dagvullende agendapunten
          geëxporteerd, inclusief je eigen tekst. Afgevinkte acties worden overgeslagen.</p>
        <button type="button" onClick={downloadCalendar}>Bevestig .ics-download</button>
        <button type="button" onClick={() => setPending(null)}>Annuleren</button>
      </div>}
      <button type="button" onClick={() => {
        setMoveDate(''); setCompleted([]); setExtras([]); setNewTask(''); setPending(null); setMessage('Planning uit dit tabblad gewist.');
      }} disabled={!moveDate && !completed.length && !extras.length}>Wis mijn verhuisplan</button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
