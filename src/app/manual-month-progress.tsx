'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MANUAL_MONTHLY_GOAL,
  MANUAL_PROGRESS_STORAGE_KEY,
  decodeManualProgress,
  manualProgressNeedsExplicitErase,
  msUntilNextLocalMidnight,
  manualPlanningNudge,
  relevantManualStorageEvent,
  writeManualProgressIfUnchanged,
  eraseManualProgressIfUnchanged,
  manualStorageWarning,
  localMonthKey
} from '../lib/manual-month-progress.mjs';

/** Optional private notes, never a verified account counter or live instruction. */
export default function ManualMonthProgress() {
  const [month, setMonth] = useState<string | null>(null);
  const [observedAt, setObservedAt] = useState<Date | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [storageWorks, setStorageWorks] = useState(true);
  const [deleteError, setDeleteError] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  // A previous-month or unrecognized saved value must never be overwritten
  // by the blank/current-month "Begin" button without explicit deletion.
  const [opaqueStoredNote, setOpaqueStoredNote] = useState(false);
  const [transientDiscarded, setTransientDiscarded] = useState(false);
  const [reminderDates, setReminderDates] = useState<string[]>(['', '', '', '']);
  const [reminderMessage, setReminderMessage] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState<{month:string;count:number}|null>(null);
  const [transferMessage, setTransferMessage] = useState('');
  const [suggestedDates, setSuggestedDates] = useState<string[] | null>(null);
  const [reminderTimes, setReminderTimes] = useState(['09:00','09:00','09:00','09:00']);
  const [reminderDuration, setReminderDuration] = useState<15 | 30 | 60>(15);
  const reminderMonth = useRef<string | null>(null);
  // If the browser refuses writes, preserve current-tab edits across focus events.
  const unsaved = useRef<{month: string; count: number} | null>(null);
  // Undefined means storage has not supplied an authoritative snapshot yet.
  const lastObservedRaw = useRef<string | null | undefined>(undefined);
  // A successful read does NOT prove persistence is writable. Keep a prior
  // write/delete failure visible until a real write/delete succeeds.
  const writeUnverified = useRef(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function refresh() {
      const observed = new Date();
      const current = localMonthKey(observed);
      if (reminderMonth.current !== current) {
        reminderMonth.current = current;
        setReminderDates(['', '', '', '']);
        setReminderTimes(['09:00','09:00','09:00','09:00']);
        setReminderDuration(15);
        setSuggestedDates(null);
        setReminderMessage('');
        setPendingTransfer(null);
        setTransferMessage('');
      }
      setMonth(current);
      setObservedAt(observed);
      if (unsaved.current !== null && unsaved.current.month !== current) unsaved.current = null;
      setHasUnsaved(unsaved.current !== null);
      try {
        const raw = window.localStorage.getItem(MANUAL_PROGRESS_STORAGE_KEY);
        // Focus/visibility refresh must also notice tab changes if an event
        // was delayed, even while this tab has a failed-write fallback.
        if (lastObservedRaw.current !== undefined && lastObservedRaw.current !== raw) {
          unsaved.current = null;
          setHasUnsaved(false);
          setTransientDiscarded(false);
        }
        lastObservedRaw.current = raw;
        const stored = decodeManualProgress(raw, current);
        setOpaqueStoredNote(manualProgressNeedsExplicitErase(raw, current));
        setCount(unsaved.current?.count ?? stored);
        setStorageWorks(unsaved.current === null && !writeUnverified.current);
      } catch {
        writeUnverified.current = true;
        lastObservedRaw.current = undefined;
        setOpaqueStoredNote(false); // unreadable storage is already a separate HOLD
        setCount(unsaved.current?.count ?? null);
        setStorageWorks(false);
      }
      if (timer !== undefined) clearTimeout(timer);
      // Keep the deadline bound to the same civil instant used for the
      // displayed month. If storage refresh crosses midnight, re-reading
      // the clock here would defer rollover for another entire day.
      timer = setTimeout(refresh, msUntilNextLocalMidnight(observed) + 50);
    }
    function onStorage(event: StorageEvent) {
      // A trusted same-origin localStorage update/erase overrides this tab's
      // unsaved fallback. Otherwise a different tab's deletion is invisible.
      try {
        if (!relevantManualStorageEvent(event, window.localStorage)) return;
      } catch {
        return; // Storage unavailable: retain the explicitly unsaved local note.
      }
      unsaved.current = null;
      setHasUnsaved(false);
      setTransientDiscarded(false);
      setDeleteError(false);
      setConflict(false);
      refresh();
    }
    refresh();
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  function save(next: number) {
    setPendingTransfer(null);
    const observed = new Date();
    const current = localMonthKey(observed);
    setObservedAt(observed);
    // Month rollover never writes the previous month's stale counter.
    if (current !== month) {
      unsaved.current = null;
      setHasUnsaved(false);
      setTransientDiscarded(false);
      setMonth(current);
      try {
        const raw = window.localStorage.getItem(MANUAL_PROGRESS_STORAGE_KEY);
        lastObservedRaw.current = raw;
        setOpaqueStoredNote(manualProgressNeedsExplicitErase(raw, current));
        setCount(decodeManualProgress(raw, current));
        setStorageWorks(!writeUnverified.current);
      } catch {
        writeUnverified.current = true;
        lastObservedRaw.current = undefined;
        setOpaqueStoredNote(false);
        setCount(null);
        setStorageWorks(false);
      }
      return;
    }
    if (opaqueStoredNote || !Number.isInteger(next) || next < 0 || next > MANUAL_MONTHLY_GOAL) return;
    try {
      const result = writeManualProgressIfUnchanged(window.localStorage, lastObservedRaw.current, current, next);
      if (result.status !== 'saved') {
        if (result.status === 'unknown') {
          // Read denied or not yet observed: only a private temporary edit is
          // allowed; never overwrite unknown persistent data.
          writeUnverified.current = true;
          unsaved.current = { month: current, count: next };
          setHasUnsaved(true);
          setCount(next);
          setStorageWorks(false);
          setDeleteError(false);
          setTransientDiscarded(false);
          setConflict(false);
          return;
        }
        unsaved.current = null;
        setHasUnsaved(false);
        if (result.status === 'requires_erase') {
          lastObservedRaw.current = result.raw;
          setOpaqueStoredNote(true);
          setCount(null);
          setStorageWorks(!writeUnverified.current);
          setConflict(false);
          return;
        }
        if (result.status === 'changed') {
          lastObservedRaw.current = result.raw;
          setOpaqueStoredNote(manualProgressNeedsExplicitErase(result.raw, current));
          setCount(decodeManualProgress(result.raw, current));
          setStorageWorks(!writeUnverified.current);
        } else {
          writeUnverified.current = true;
          lastObservedRaw.current = undefined;
          setCount(null);
          setStorageWorks(false);
        }
        setConflict(true);
        return;
      }
      lastObservedRaw.current = result.raw;
      setOpaqueStoredNote(false);
      unsaved.current = null;
      setHasUnsaved(false);
      writeUnverified.current = false; // confirmed setItem success
      setStorageWorks(true);
    } catch {
      writeUnverified.current = true;
      // If getItem/setItem fails, keep a private temporary edit, never assume
      // the durable browser note was safely replaced.
      unsaved.current = { month: current, count: next };
      setHasUnsaved(true);
      setStorageWorks(false);
    }
    setCount(next);
    setConflict(false);
    setDeleteError(false);
    setTransientDiscarded(false);
  }

  function erase() {
    setPendingTransfer(null);
    // An old tab cannot erase a newer replacement without first displaying it.
    try {
      const result = eraseManualProgressIfUnchanged(window.localStorage, lastObservedRaw.current);
      if (result.status !== 'cleared') {
        unsaved.current = null;
        setHasUnsaved(false);
        if (result.status === 'changed') {
          lastObservedRaw.current = result.raw;
          setOpaqueStoredNote(manualProgressNeedsExplicitErase(result.raw, localMonthKey()));
          setCount(decodeManualProgress(result.raw, localMonthKey()));
          setStorageWorks(!writeUnverified.current);
        } else {
          writeUnverified.current = true;
          lastObservedRaw.current = undefined;
          setCount(null);
          setStorageWorks(false);
        }
        setConflict(true);
        return;
      }
      lastObservedRaw.current = null;
      setOpaqueStoredNote(false);
      unsaved.current = null;
      setHasUnsaved(false);
      setCount(null);
      writeUnverified.current = false; // confirmed removeItem success
      setStorageWorks(true);
      setTransientDiscarded(false);
      setConflict(false);
      setDeleteError(false);
    } catch {
      writeUnverified.current = true;
      setStorageWorks(false);
      setDeleteError(true);
    }
  }


  // User-initiated portable record; only the current, self-reported monthly number.
  // Keep this independent of persistence so browsers blocking localStorage may
  // still export a visibly temporary note without implying it was stored.
  function exportPersonalProgress() {
    if (!month || month !== localMonthKey(new Date()) ||
        count === null || opaqueStoredNote || count < 0 ||
        count > MANUAL_MONTHLY_GOAL) {
      setTransferMessage('Geen actuele eigen maandnotitie beschikbaar om te bewaren.');
      return;
    }
    const content = 'month,count\\r\\n'+month+','+String(count)+'\\r\\n';
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;
    link.download='woonpoints-eigen-maandstand-'+month+'.csv';
    link.rel='noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setTransferMessage((hasUnsaved ?
      'Tijdelijke maandstand aangeboden als CSV; de browser kon deze stand niet blijvend opslaan. ' :
      'Eigen maandstand aangeboden als CSV. ')+
      'De gekozen opslaglocatie kan extern synchroniseren.');
  }
  async function preparePersonalProgressImport(file: File|undefined) {
    setPendingTransfer(null);
    if (!file) return;
    if (!month || file.size < 1 || file.size > 128) {
      setTransferMessage('Alleen een eigen klein CSV-bestand (maximaal 128 bytes) uit deze maand is toegestaan.');
      return;
    }
    try {
      const raw=await file.text();
      const normalized=raw.replace(/\\r\\n/g,'\\n');
      // Strict ASCII numeric two-column CSV: no injected spreadsheet cells or
      // unbounded/unknown account data; previous-month files cannot overwrite now.
      const match=/^month,count\\n(20\\d{2}-(?:0[1-9]|1[0-2])),(0|[1-9]\\d?)\\n?$/.exec(normalized);
      const current=localMonthKey(new Date());
      if (!match || match[1] !== current || match[1] !== month ||
          Number(match[2]) > MANUAL_MONTHLY_GOAL ||
          opaqueStoredNote || /[^\\x0A\\x20-\\x7E]/.test(normalized)) throw new Error('invalid');
      setPendingTransfer({month:match[1],count:Number(match[2])});
      setTransferMessage('Eigen CSV ingelezen. Er is nog niets overschreven; bevestig afzonderlijk.');
    } catch {
      setTransferMessage('Bestand geweigerd: alleen month,count met een geldige stand uit de huidige maand. Huidige notitie behouden.');
    }
  }

  function forgetTemporary() {
    // Only an unsaved in-memory fallback is dropped. Never claim deletion of
    // persistent browser data when localStorage.removeItem was denied.
    if (!hasUnsaved || unsaved.current === null) return;
    unsaved.current = null;
    setCount(null);
    setHasUnsaved(false);
    setStorageWorks(false);
    setTransientDiscarded(true);
  }

  const nudge = month && observedAt ? manualPlanningNudge(month, count, observedAt) : null;

  // No background alarms, device permission, external service, or persistence.
  const remainingPersonalPlans = count === null || opaqueStoredNote
    ? 0 : Math.max(0, MANUAL_MONTHLY_GOAL - count);
  const dateString = (date: Date) =>
    [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'),
      String(date.getDate()).padStart(2,'0')].join('-');
  const todayLocal = dateString(new Date());
  const lastLocalDate = month ? (() => {
    const [year,number] = month.split('-').map(Number);
    return dateString(new Date(year,number,0));
  })() : '';
  function validLocalReminderTime(time: string) {
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
    const [hour,minute] = time.split(':').map(Number);
    return hour*60 + minute + reminderDuration < 1440;
  }
  function validLocalReminderDay(day: string, expectedMonth: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !day.startsWith(expectedMonth+'-')
        || day < dateString(new Date())) return false;
    const [year, monthPart, calendarDay] = day.split('-').map(Number);
    const check = new Date(Date.UTC(year, monthPart-1, calendarDay));
    return check.getUTCFullYear() === year && check.getUTCMonth() === monthPart-1 &&
      check.getUTCDate() === calendarDay;
  }
  function suggestRemainingDates() {
    const now = new Date();
    const currentMonth = localMonthKey(now);
    if (!month || currentMonth !== month || !remainingPersonalPlans ||
        count === null || opaqueStoredNote) {
      setSuggestedDates(null);
      setReminderMessage('Geen actuele, open eigen planning om over deze maand te verdelen.');
      return;
    }
    // Civil calendar days, not UTC milliseconds: DST does not skip/repeat a date.
    const lastDay = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const available = lastDay-now.getDate()+1;
    if (available < remainingPersonalPlans) {
      setSuggestedDates(null);
      setReminderMessage('Er zijn nog maar '+available+
        ' kalenderdagen over voor '+remainingPersonalPlans+
        ' unieke momenten. Kies zelf een passend alternatief; nooit dubbele of volgende-maanddatums.');
      return;
    }
    const proposals = Array.from({length:remainingPersonalPlans},(_,index) => {
      const offset = Math.floor((index+.5)*available/remainingPersonalPlans);
      const day = String(now.getDate()+offset).padStart(2,'0');
      return currentMonth+'-'+day;
    });
    if (new Set(proposals).size !== proposals.length ||
        proposals.some(day => !validLocalReminderDay(day,currentMonth))) {
      setSuggestedDates(null);
      setReminderMessage('Veilige datumverdeling niet mogelijk; vul je eigen datums in.');
      return;
    }
    setSuggestedDates(proposals);
    setReminderMessage('Voorstel gereed. Je huidige datums blijven ongewijzigd totdat je uitdrukkelijk bevestigt.');
  }
  function applySuggestedDates() {
    if (!suggestedDates || !month || month !== localMonthKey(new Date()) ||
        suggestedDates.length !== remainingPersonalPlans ||
        suggestedDates.some(day => !validLocalReminderDay(day,month)) ||
        new Set(suggestedDates).size !== suggestedDates.length) {
      setSuggestedDates(null);
      setReminderMessage('Voorstel verlopen of achterhaald; maak opnieuw een verdeling.');
      return;
    }
    setReminderDates(Array.from({length:MANUAL_MONTHLY_GOAL},(_,index) => suggestedDates[index] ?? ''));
    setSuggestedDates(null);
    setReminderMessage('Voorgestelde eigen datums ingevuld. Controleer en wijzig ze gerust; er is nog geen kalenderbestand gemaakt.');
  }
  function exportPersonalCalendar() {
    const currentMonth = localMonthKey(new Date());
    if (!month || month !== currentMonth || !remainingPersonalPlans) {
      setReminderMessage('De maand is veranderd of er zijn geen open persoonlijke momenten.');
      return;
    }
    const selected = reminderDates.slice(0, remainingPersonalPlans);
    const selectedTimes = reminderTimes.slice(0, remainingPersonalPlans);
    if (selected.some(day => !validLocalReminderDay(day, currentMonth)) ||
        new Set(selected).size !== selected.length ||
        selectedTimes.some(time => !validLocalReminderTime(time)) ||
        selected.some((day,index) => day === dateString(new Date()) &&
          new Date(day+'T'+selectedTimes[index]+':00').getTime() <= Date.now())) {
      setReminderMessage('Kies unieke, nog komende datums en geldige lokale tijden. Een tijdstip vandaag moet in de toekomst liggen en de afspraak moet vóór middernacht eindigen.');
      return;
    }
    const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0',
      'PRODID:-//Woonpoints//Prive maandplanning//NL','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    selected.forEach((day, index) => {
      const compact = day.replace(/-/g,'');
      const start = selectedTimes[index].replace(':','');
      const [hour,minute] = selectedTimes[index].split(':').map(Number);
      const endMins = hour*60+minute+reminderDuration;
      const end = String(Math.floor(endMins/60)).padStart(2,'0')+
        String(endMins%60).padStart(2,'0');
      lines.push('BEGIN:VEVENT',
        'UID:woonpoints-eigen-planning-'+currentMonth.replace('-','')+'-'+(index+1)+'@local.woonpoints.invalid',
        'DTSTAMP:'+stamp,'DTSTART:'+compact+'T'+start+'00',
        'DTEND:'+compact+'T'+end+'00',
        'SUMMARY:Woonpoints eigen reactiemoment',
        'DESCRIPTION:Persoonlijke planning. Geen automatisch WoningNet-reactie of officieel puntenbewijs.',
        'STATUS:CONFIRMED','END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    const url = URL.createObjectURL(new Blob([lines.join('\r\n')+'\r\n'],
      {type:'text/calendar;charset=utf-8'}));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'woonpoints-prive-planning-'+currentMonth+'.ics';
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setReminderMessage('ICS-download aangeboden met jouw gekozen lokale tijdstippen en lengte. Er zijn geen automatische herinneringen of WoningNet-reacties gemaakt.');
  }

  return (
    <section className="panel manual-progress" aria-labelledby="manual-progress-heading">
      <div>
        <p className="eyebrow">LOKAAL · EIGEN PLANNING</p>
        <h2 id="manual-progress-heading">Mijn maandplanning</h2>
        <p>Dit is een persoonlijke notitie, <strong>geen geverifieerde WoningNet-stand</strong>.
          Je gegevens blijven in deze browser; er wordt niets verstuurd.</p>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <p className="manual-month">Maand: {month ?? 'Laden…'}</p>
        <p className="manual-total">
          {opaqueStoredNote ? 'Eerdere of onleesbare notitie aanwezig' : count === null ? 'Nog niets ingevuld' : `${count} / ${MANUAL_MONTHLY_GOAL} zelf genoteerd`}
        </p>
        {month !== null && (count === null ? (
          !opaqueStoredNote && <button type="button" onClick={() => save(0)}>Begin maandplanning</button>
        ) : (
          <div className="manual-controls" role="group" aria-label="Eigen reactieplanning aanpassen">
            <button type="button" disabled={count <= 0} onClick={() => save(count - 1)}>
              Minder
            </button>
            <button type="button" disabled={count >= MANUAL_MONTHLY_GOAL} onClick={() => save(count + 1)}>
              Meer
            </button>
          </div>
        ))}
        {opaqueStoredNote && <p role="alert">Er staat een notitie uit een eerdere maand of met onleesbare inhoud in deze browser. Beginnen zou die notitie overschrijven. Wis deze alleen bewust met ‘Wis mijn notitie’ als je de bestaande gegevens niet wilt bewaren.</p>}
        {count !== null && <p>Zelf nog te plannen: {MANUAL_MONTHLY_GOAL - count}.</p>}
        {nudge !== null && (
          <p className="manual-reminder" role="status">
            <strong>Eigen planning:</strong> {nudge.urgency === 'late' ? 'De maand loopt bijna af.' : 'Het is halverwege de maand.'}
            {' '}Je hebt nog {nudge.missing} {nudge.missing === 1 ? 'reactie' : 'reacties'} niet zelf genoteerd;
            de officiële WoningNet-stand is onbekend.
          </p>
        )}
        {month !== null && count !== null && !opaqueStoredNote && (
          <div className="manual-reminder" style={{marginTop:16}}>
            <h3>Plan zelf de resterende momenten in je agenda</h3>
            <p>Een eigen reactiemoment is geen geldige WoningNet-reactie.
              Kies {remainingPersonalPlans} {remainingPersonalPlans === 1 ? 'datum' : 'datums'}
              binnen de lopende maand voor de nog open persoonlijke planning.
              Alleen na jouw klik wordt een ICS-bestand aangeboden.</p>
            {remainingPersonalPlans > 0 ? (
              <>
                {reminderDates.slice(0, remainingPersonalPlans).map((date, index) =>
                  <fieldset key={index} className="manual-reminder-slot">
                    <legend>Eigen reactiemoment {index+1}</legend>
                    <label>
                      Datum
                      <input type="date" min={todayLocal} max={lastLocalDate}
                        value={date} style={{display:'block',minHeight:44,width:'100%',padding:8}}
                        onChange={e => {
                          const next = [...reminderDates];
                          next[index] = e.target.value;
                          setReminderDates(next);
                          setSuggestedDates(null);
                          setReminderMessage('');
                        }} />
                    </label>
                    <label>
                      Eigen lokale begintijd
                      <input type="time" step="300"
                        value={reminderTimes[index]} onChange={e=>{
                          setReminderTimes(current=>current.map((v,i)=>i===index?e.target.value:v));
                          setReminderMessage('');
                        }} />
                    </label>
                  </fieldset>
                )}
                <label className="manual-reminder-duration">
                  Lengte van iedere persoonlijke agenda-afspraak
                  <select value={String(reminderDuration)} onChange={event=>{
                    const value=Number(event.target.value);
                    if (value===15 || value===30 || value===60) setReminderDuration(value);
                    setReminderMessage('');
                  }}>
                    <option value="15">15 minuten</option>
                    <option value="30">30 minuten</option>
                    <option value="60">60 minuten</option>
                  </select>
                </label>
                <div className="manual-reminder-suggest">
                  <p><strong>Handige verdeling:</strong> maak een voorstel om
                    alle nog open persoonlijke momenten gelijkmatig over de
                    resterende kalenderdagen van deze maand te spreiden. Dit
                    is geen WoningNet-deadline, boeking of automatische herinnering.</p>
                  <button type="button" onClick={suggestRemainingDates}>
                    Stel gelijkmatig verspreide datums voor…
                  </button>
                  {suggestedDates && <div role="group"
                    aria-label="Bevestig eigen voorstel voor kalenderdatums">
                    <p>Voorstel: <strong>{suggestedDates.join(' · ')}</strong>.
                      Hiermee worden alleen de hierboven gekozen, tijdelijke
                      datums vervangen. Je eigen reactie-aantal wordt niet gewijzigd.</p>
                    <button type="button" onClick={applySuggestedDates}>
                      Ja, vul deze datums in</button>
                    <button type="button" className="manual-erase" onClick={()=>{
                      setSuggestedDates(null);
                      setReminderMessage('Voorstel geannuleerd; bestaande datums behouden.');
                    }}>Behoud mijn huidige datums</button>
                  </div>}
                </div>
                <button type="button" onClick={exportPersonalCalendar}>
                  Bewaar {remainingPersonalPlans} privémomenten als agenda-ICS…
                </button>
                <button type="button" className="manual-erase" onClick={() => {
                  setReminderDates(['','','','']);
                  setSuggestedDates(null);
                  setReminderMessage('Alleen de tijdelijk gekozen agendadagen gewist.');
                }}>Wis gekozen agendadagen</button>
              </>
            ) : <p>Je eigen maandnotitie is op doel. Er zijn geen nieuwe
              kalenderherinneringen nodig.</p>}
            <p>ICS-afspraken zijn bewust handmatig, starten standaard
              om 09:00 lokale agendatijd maar hebben nu per datum een eigen
              begintijd en gezamenlijk een instelbare lengte. Ze kunnen
              op je eigen apparaat of cloudagenda worden bewaard.
              Geen automatische melding vanuit Woonpoints,
              geen accounttoegang en geen geplaatste reactie.</p>
            {reminderMessage && <p role="status">{reminderMessage}</p>}
          </div>
        )}

        {month !== null && (
          <div className="manual-reminder" style={{marginTop:16}}>
            <h3>Neem je eigen maandstand mee</h3>
            <p>Bewaar alleen de twee velden <code>month,count</code> in een lokaal
              CSV-bestand. Dit is jouw eigen notitie, geen bewijs van vier
              geregistreerde WoningNet-reacties of zoekpunten. Er worden
              geen accountgegevens, adressen of officiële statussen geëxporteerd.</p>
            <button type="button" onClick={exportPersonalProgress}
              disabled={count===null || opaqueStoredNote}>
              Bewaar eigen maandstand als CSV…
            </button>
            <label htmlFor="manual-progress-transfer">Open eigen maandstand (CSV, maximaal 128 bytes)</label>
            <input id="manual-progress-transfer" type="file" accept=".csv,text/csv"
              onChange={event=>{
                const file=event.currentTarget.files?.[0];
                event.currentTarget.value='';
                void preparePersonalProgressImport(file);
              }} />
            {pendingTransfer && (
              <div className="month-csv-confirm" role="group" aria-label="Bevestig eigen maandstand importeren">
                <p>Het bestand bevat voor {pendingTransfer.month} zelf genoteerd:
                  <strong> {pendingTransfer.count} / {MANUAL_MONTHLY_GOAL}</strong>.
                  Importeren vervangt jouw huidige maandstand, maar alleen als
                  deze sinds de laatste waarneming niet door een ander tabblad
                  is gewijzigd. De bestaande conflictbeveiliging blijft actief.</p>
                <button type="button" onClick={()=>{
                  const proposed=pendingTransfer;
                  setPendingTransfer(null);
                  if (proposed.month !== localMonthKey(new Date()) || proposed.month !== month) {
                    setTransferMessage('De kalendermaand is gewijzigd. Het oude bestand is niet toegepast.');
                    return;
                  }
                  save(proposed.count);
                  setTransferMessage('Vervanging aangevraagd; controleer de melding over eventuele opslagfouten of wijzigingen door andere tabbladen.');
                }}>Vervang mijn maandstand</button>
                <button type="button" onClick={()=>{
                  setPendingTransfer(null);
                  setTransferMessage('Import geannuleerd; jouw maandstand is behouden.');
                }}>Behoud mijn huidige maandstand</button>
              </div>
            )}
            {transferMessage && <p role="status">{transferMessage}</p>}
            <p>Een bestand uit een vorige maand wordt altijd geweigerd.
              Geen automatische import, opslag in een externe dienst of
              wijziging van de officiële WoningNet-reactiestand.</p>
          </div>
        )}
        {month !== null && (
          <button type="button" className="manual-erase" onClick={erase}>Wis mijn notitie</button>
        )}
        {hasUnsaved && (
          <button type="button" className="manual-erase" onClick={forgetTemporary}>Vergeet tijdelijke invoer</button>
        )}
        {transientDiscarded && (
          <p role="status">Alleen niet-opgeslagen invoer is gewist. Opgeslagen gegevens kunnen nog aanwezig zijn.</p>
        )}
        {conflict && <p role="alert">De notitie is gewijzigd in een ander tabblad of de opslagstatus is onbekend. De vorige actie is niet uitgevoerd; controleer de huidige stand en probeer opnieuw.</p>}
        {deleteError && <p role="alert">Verwijderen niet gelukt. Probeer opnieuw; opgeslagen gegevens kunnen nog aanwezig zijn.</p>}
        {!storageWorks && <p role="status">{manualStorageWarning(storageWorks, hasUnsaved)}</p>}
      </div>
    </section>
  );
}
