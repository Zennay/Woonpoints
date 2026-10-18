'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { PrivateJournalCountOffer, PrivateMonthSnapshot } from './position-stats';
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
export default function ManualMonthProgress({journalOffer,onJournalDecision,onMonthSnapshot}:{
  journalOffer?: PrivateJournalCountOffer|null;
  onJournalDecision?: ()=>void;
  onMonthSnapshot?: (snapshot:PrivateMonthSnapshot)=>void;
} = {}) {
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
  const [scheduleMessage,setScheduleMessage] = useState('');
  const [pendingSchedule,setPendingSchedule] = useState<{
    month:string; openSlots:number; dates:string[]; times:string[]; duration:15|30|60
  } | null>(null);
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
        setPendingSchedule(null);
        setScheduleMessage('');
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

  useEffect(() => {
    if (!onMonthSnapshot) return;
    onMonthSnapshot({
      month,count,previousNoteHeld:opaqueStoredNote,
      storage:hasUnsaved?'temporary':storageWorks?'browser':'unknown'
    });
  }, [month,count,opaqueStoredNote,hasUnsaved,storageWorks,onMonthSnapshot]);

  function save(next: number) {
    setPendingTransfer(null);
    setPendingSchedule(null);
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
    const content = 'month,count\r\n'+month+','+String(count)+'\r\n';
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
      const normalized=raw.replace(/\r\n/g,'\n');
      // Strict ASCII numeric two-column CSV: no injected spreadsheet cells or
      // unbounded/unknown account data; previous-month files cannot overwrite now.
      const match=/^month,count\n(20\d{2}-(?:0[1-9]|1[0-2])),(0|[1-9]\d?)\n?$/.exec(normalized);
      const current=localMonthKey(new Date());
      if (!match || match[1] !== current || match[1] !== month ||
          Number(match[2]) > MANUAL_MONTHLY_GOAL ||
          opaqueStoredNote || /[^\x0A\x20-\x7E]/.test(normalized)) throw new Error('invalid');
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

  // Explicit, bounded personal backup: never alters account data or places events.
  const scheduleFormat='woonpoints-private-month-calendar-v1';
  function saveScheduleDraft() {
    const current=localMonthKey(new Date());
    if (!month || month !== current || opaqueStoredNote || count===null ||
        remainingPersonalPlans<1) {
      setScheduleMessage('Geen actuele eigen agendaplanning beschikbaar.');return;
    }
    const data={format:scheduleFormat,month:current,openSlots:remainingPersonalPlans,
      dates:reminderDates.slice(0,remainingPersonalPlans),
      times:reminderTimes.slice(0,remainingPersonalPlans),duration:reminderDuration};
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],
      {type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download='woonpoints-agendaconcept-'+current+'.json';link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setScheduleMessage('Privé-JSON aangeboden om zelf te bewaren; jouw bestandslocatie kan extern synchroniseren.');
  }
  async function prepareScheduleDraft(file:File|undefined) {
    setPendingSchedule(null);
    if (!file) return;
    if (file.size<1 || file.size>4096) {
      setScheduleMessage('Ongeldig bestand: maximaal 4 KiB.');return;
    }
    try {
      const raw=await file.text();
      if (new TextEncoder().encode(raw).byteLength>4096) throw new Error('large');
      const input:unknown=JSON.parse(raw);
      if (!input || typeof input!=='object' || Array.isArray(input)) throw new Error('shape');
      const obj=input as Record<string,unknown>;
      if (Object.keys(obj).sort().join('|')!=='dates|duration|format|month|openSlots|times' ||
          obj.format!==scheduleFormat || typeof obj.month!=='string' ||
          obj.month!==localMonthKey(new Date()) || obj.month!==month ||
          typeof obj.openSlots!=='number' || !Number.isSafeInteger(obj.openSlots) ||
          obj.openSlots!==remainingPersonalPlans || obj.openSlots<1 || obj.openSlots>4 ||
          !Array.isArray(obj.dates) || !Array.isArray(obj.times) ||
          obj.dates.length!==obj.openSlots || obj.times.length!==obj.openSlots ||
          (obj.duration!==15 && obj.duration!==30 && obj.duration!==60)) throw new Error('fields');
      const duration=obj.duration as 15|30|60;
      const dates=obj.dates as unknown[], times=obj.times as unknown[];
      if (dates.some(day=>typeof day!=='string' ||
            (day!=='' && !validLocalReminderDay(day,obj.month as string))) ||
          times.some(time=>typeof time!=='string' ||
            !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time) ||
            Number(time.slice(0,2))*60+Number(time.slice(3,5))+duration>=1440) ||
          new Set(dates.filter(day=>day!=='')).size!==dates.filter(day=>day!=='').length)
        throw new Error('invalid');
      setPendingSchedule({month:obj.month,openSlots:obj.openSlots,
        dates:dates as string[],times:times as string[],duration});
      setScheduleMessage('Eigen concept ingelezen. Bevestig expliciet vóór vervangen.');
    } catch {
      setScheduleMessage('Bestand geweigerd: alleen geldige datum-/tijdkeuzes voor deze maand en hetzelfde aantal open momenten. Bestaand concept behouden.');
    }
  }
  function applyScheduleDraft() {
    if (!pendingSchedule) return;
    const plan=pendingSchedule;
    if (plan.month!==localMonthKey(new Date()) || plan.month!==month ||
        plan.openSlots!==remainingPersonalPlans || opaqueStoredNote || count===null) {
      setPendingSchedule(null);
      setScheduleMessage('Maand of voortgang gewijzigd: import niet toegepast.');
      return;
    }
    setReminderDates(Array.from({length:MANUAL_MONTHLY_GOAL},(_,i)=>plan.dates[i]??''));
    setReminderTimes(Array.from({length:MANUAL_MONTHLY_GOAL},(_,i)=>plan.times[i]??'09:00'));
    setReminderDuration(plan.duration);setPendingSchedule(null);setSuggestedDates(null);
    setScheduleMessage('Agendaconcept lokaal hersteld. De reactieteller bleef ongewijzigd; agenda-ICS wordt niet automatisch gemaakt.');
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
        {journalOffer && <div className="month-csv-confirm" role="group"
          aria-label="Bevestig voorstel uit eigen reactiedagboek">
          <h3>Eigen dagboekstand voorstellen aan deze maandplanning</h3>
          <p>Je reactiedagboek biedt voor <strong>{journalOffer.month}</strong> een
            <strong> persoonlijke telling van {journalOffer.count}</strong> aan,
            afgeleid van {journalOffer.totalThisMonth} eigen notities.
            Alleen de letterlijk gemarkeerde status 'Zelf gereageerd' telt.
            Jouw huidige maandstand is <strong>{count===null?'nog leeg':count}</strong>.
            Niets is door WoningNet gecontroleerd: dit bewijst geen
            geregistreerde, geldige maandreactie of zoekpunt.</p>
          {journalOffer.month!==month || month!==localMonthKey(new Date()) ||
            opaqueStoredNote || journalOffer.count>MANUAL_MONTHLY_GOAL ||
            journalOffer.count<0 ? <p role="alert">Dit voorstel kan niet worden
            toegepast: je maand is veranderd, de gegevens zijn ontoegankelijk
            of de telling ligt buiten het maanddoel. De bestaande maandstand
            blijft behouden.</p> :
          <button type="button" onClick={()=>{
            const currentMonth=localMonthKey(new Date());
            const suggested=journalOffer.count;
            if (currentMonth !== journalOffer.month || currentMonth !== month ||
                !Number.isSafeInteger(suggested) || suggested<0 ||
                suggested>MANUAL_MONTHLY_GOAL || opaqueStoredNote) {
              onJournalDecision?.();
              return;
            }
            save(suggested);
            onJournalDecision?.();
            setTransferMessage('Eigen dagboekstand ter opslag aangeboden. Controleer bovenaan het resultaat en eventuele conflict-/opslagwaarschuwingen. Dit is geen officiële WoningNet-registratie.');
          }}>Ja, gebruik deze zelf genoteerde maandtelling</button>}
          <button type="button" className="secondary" onClick={()=>{
            onJournalDecision?.();
            setTransferMessage('Dagboekvoorstel geannuleerd. Je huidige maandstand is behouden.');
          }}>Nee, behoud mijn maandstand</button>
        </div>}
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

                <div className="manual-reminder-suggest">
                  <h4>Bewaar je voorlopige agenda-keuzes apart</h4>
                  <p>Privé-JSON met alleen datums, tijden en afspraakduur.
                    Geen automatische opslag of kalenderkoppeling.</p>
                  <button type="button" onClick={saveScheduleDraft}>
                    Bewaar agendaconcept als privé-JSON…
                  </button>
                  <label htmlFor="manual-schedule-restore">
                    Open eigen agendaconcept (JSON, maximaal 4 KiB)
                  </label>
                  <input id="manual-schedule-restore" type="file" accept=".json,application/json"
                    onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';
                      void prepareScheduleDraft(file);}} />
                  {pendingSchedule && <div className="month-csv-confirm" role="group"
                    aria-label="Bevestig vervangen voorlopig agendaconcept">
                    <p>Dit bevat {pendingSchedule.openSlots} eigen momenten
                      voor {pendingSchedule.month} van {pendingSchedule.duration} minuten.
                      Alleen tijdelijke afspraken worden vervangen, nooit de reactieteller.</p>
                    <ol>{pendingSchedule.dates.map((day,i)=>
                      <li key={i}>{day||'Nog geen datum'} · {pendingSchedule.times[i]}</li>)}</ol>
                    <button type="button" onClick={applyScheduleDraft}>
                      Vervang mijn agenda-keuzes
                    </button>
                    <button type="button" onClick={()=>{
                      setPendingSchedule(null);
                      setScheduleMessage('Herstel geannuleerd: bestaande agenda-keuzes behouden.');
                    }}>Behoud mijn agenda-keuzes</button>
                  </div>}
                  {scheduleMessage && <p role="status">{scheduleMessage}</p>}
                  <p>Oude maanden, vervallen datums, vreemde velden of andere
                    aantallen open momenten worden geweigerd. Een gekozen
                    bestandslocatie kan buiten Woonpoints synchroniseren.</p>
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
        <PrivateMonthCountHistory currentMonth={month} currentCount={count}
          locked={opaqueStoredNote} />
      </div>
    </section>
  );
}


/** Personal, deliberately separate historical notes: never inferred from WoningNet. */
type PersonalMonthHistoryRow = {month:string;count:number};
const PRIVATE_HISTORY_MAX = 36;
function privateHistoryValid(rows:unknown): rows is PersonalMonthHistoryRow[] {
  if (!Array.isArray(rows) || rows.length>PRIVATE_HISTORY_MAX) return false;
  const existing=new Set<string>(),today=localMonthKey(new Date());
  for(const raw of rows) {
    if(!raw || typeof raw!=='object' || Array.isArray(raw)) return false;
    const item=raw as Record<string,unknown>;
    if(Object.keys(item).sort().join('|')!=='count|month' ||
       typeof item.month!=='string' ||
       !/^20\d{2}-(?:0[1-9]|1[0-2])$/.test(item.month) || item.month>today ||
       typeof item.count!=='number' || !Number.isSafeInteger(item.count) ||
       item.count<0 || item.count>MANUAL_MONTHLY_GOAL ||
       existing.has(item.month)) return false;
    existing.add(item.month);
  }
  return true;
}
function decodePersonalHistoryCsv(raw:string):PersonalMonthHistoryRow[]|null {
  if(!raw || new TextEncoder().encode(raw).byteLength>2048 ||
     /[^\x0A\x0D\x20-\x7E]/.test(raw)) return null;
  const normalized=raw.replace(/\r\n/g,'\n');
  if(normalized.includes('\r')) return null;
  const lines=(normalized.endsWith('\n')?normalized.slice(0,-1):normalized).split('\n');
  if(lines[0]!=='month,count' || lines.length<2 ||
     lines.length>PRIVATE_HISTORY_MAX+1) return null;
  const entries:PersonalMonthHistoryRow[]=[];
  for(const line of lines.slice(1)) {
    if(!/^20\d{2}-(?:0[1-9]|1[0-2]),[0-4]$/.test(line)) return null;
    const [month,count]=line.split(',');
    entries.push({month,count:Number(count)});
  }
  if(!privateHistoryValid(entries)) return null;
  return entries.sort((a,b)=>a.month.localeCompare(b.month));
}
/** Only locally typed/frozen counts. Not a monthly WoningNet eligibility history. */
function PrivateMonthCountHistory({currentMonth,currentCount,locked}:{
  currentMonth:string|null;
  currentCount:number|null;
  locked:boolean;
}) {
  const [rows,setRows]=useState<PersonalMonthHistoryRow[]>([]);
  const [draftMonth,setDraftMonth]=useState(()=>localMonthKey(new Date()));
  const [draftCount,setDraftCount]=useState('');
  const [pendingRow,setPendingRow]=useState<PersonalMonthHistoryRow|null>(null);
  const [pendingArchive,setPendingArchive]=useState<PersonalMonthHistoryRow[]|null>(null);
  const [pendingDelete,setPendingDelete]=useState<string|null>(null);
  const [message,setMessage]=useState('');
  const [selectedYear,setSelectedYear]=useState(()=>String(new Date().getFullYear()));
  const [compareYear,setCompareYear]=useState(()=>String(new Date().getFullYear()-1));
  const sorted=[...rows].sort((a,b)=>a.month.localeCompare(b.month));
  const recent=sorted.at(-1),previous=sorted.at(-2);
  const monthNow=localMonthKey(new Date());
  const currentYear=Number(monthNow.slice(0,4));
  const year=Number(selectedYear);
  const yearIsValid=/^20\d{2}$/.test(selectedYear) &&
    year>=2000 && year<=currentYear;
  const yearRows=Array.from({length:12},(_,i)=>{
    const monthKey=selectedYear+'-'+String(i+1).padStart(2,'0');
    const own=yearIsValid?sorted.find(row=>row.month===monthKey):undefined;
    const previousKey=i>0?selectedYear+'-'+String(i).padStart(2,'0'):null;
    const previous=previousKey?sorted.find(row=>row.month===previousKey):undefined;
    return {month:monthKey,count:own?.count??null,
      change:own && previous ? own.count-previous.count : null,
      future:monthKey>monthNow};
  });
  const filledYear=yearRows.filter(row=>row.count!==null);
  const observedSum=filledYear.reduce((sum,row)=>sum+row.count!,0);
  const exactFour=filledYear.filter(row=>row.count===MANUAL_MONTHLY_GOAL).length;

  const comparedYear=Number(compareYear);
  const canCompare=yearIsValid && /^20\d{2}$/.test(compareYear) &&
    comparedYear>=2000 && comparedYear<=currentYear && compareYear!==selectedYear;
  const comparableRows=Array.from({length:12},(_,i)=>{
    const suffix='-'+String(i+1).padStart(2,'0');
    const firstMonth=selectedYear+suffix, otherMonth=compareYear+suffix;
    const first=canCompare && firstMonth<=monthNow
      ? sorted.find(row=>row.month===firstMonth)?.count ?? null : null;
    const other=canCompare && otherMonth<=monthNow
      ? sorted.find(row=>row.month===otherMonth)?.count ?? null : null;
    return { index:i+1, first, other,
      difference:first===null || other===null ? null : first-other };
  });
  const matchedMonths=comparableRows.filter(row=>row.difference!==null);
  const firstMatchedTotal=matchedMonths.reduce((sum,row)=>sum+row.first!,0);
  const otherMatchedTotal=matchedMonths.reduce((sum,row)=>sum+row.other!,0);
  const matchedDifference=firstMatchedTotal-otherMatchedTotal;
  const formattedDifference=(value:number)=>value>0?'+'+value:String(value);
  function savePersonalYearComparison() {
    if(!canCompare || !matchedMonths.length || !privateHistoryValid(sorted)) {
      setMessage('Vul voor beide gekozen jaren minimaal één overeenkomstige kalendermaand in.');
      return;
    }
    const lines=[
      'WOONPOINTS · EIGEN MAANDSTANDEN VERGELIJKEN',
      'Zelf genoteerde, niet-geverifieerde maandstanden. Geen officiële WoningNet-reacties of zoekpunten.',
      'Jaar A: '+selectedYear+' · Jaar B: '+compareYear,
      'Overeenkomstig ingevulde kalendermaanden: '+matchedMonths.length+' van 12',
      'Som alleen voor deze gemeenschappelijke maanden: A='+firstMatchedTotal+', B='+otherMatchedTotal,
      'Verschil over dezelfde ingevulde maanden (A-B): '+formattedDifference(matchedDifference),
      'Ontbrekende en toekomstige maanden zijn onbekend, niet nul. Geen voorspelling.',
      '',
      'Kalendermaand | Jaar A | Jaar B | A-B'
    ];
    for(const row of comparableRows) {
      lines.push(String(row.index).padStart(2,'0')+' | '+
        (row.first===null?'onbekend':row.first+'/4')+' | '+
        (row.other===null?'onbekend':row.other+'/4')+' | '+
        (row.difference===null?'geen vergelijking':formattedDifference(row.difference)));
    }
    const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{
      type:'text/plain;charset=utf-8'
    }));
    const link=document.createElement('a');
    link.href=url;
    link.download='woonpoints-eigen-jaar-op-jaar-'+selectedYear+'-'+compareYear+'.txt';
    link.rel='noopener';document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Jaarvergelijking als eigen TXT aangeboden. Een gekozen bestandslocatie kan synchroniseren.');
  }

  function exportOwnYear() {
    if(!yearIsValid || !filledYear.length) {
      setMessage('Kies eerst een jaar met minimaal één eigen maandnotitie.');
      return;
    }
    const lines=[
      'WOONPOINTS · PERSOONLIJKE JAARREFLECTIE '+selectedYear,
      'Alleen eigen handmatige invoer. Geen WoningNet-registratie, zoekpunten of rechtsbewijs.',
      'Ingevuld: '+filledYear.length+' van 12 maanden',
      'Som van zelf genoteerde standen: '+observedSum,
      'Maanden met eigen stand 4: '+exactFour+' van '+filledYear.length+' ingevulde maanden',
      'Gemiddelde binnen ingevulde maanden: '+(observedSum/filledYear.length).toFixed(2),
      'Ontbrekende maanden tellen NIET als nul en zijn niet geschat.',
      '',
      'Maand | Eigen stand | Verschil met direct voorafgaande ingevulde kalendermaand'
    ];
    for(const row of yearRows) {
      lines.push(row.month+' | '+(row.count===null?(row.future?'toekomst / onbekend':'niet ingevuld'):row.count+'/4')+
        ' | '+(row.change===null?'onbekend':(row.change>0?'+':'')+row.change));
    }
    const url=URL.createObjectURL(new Blob([lines.join('\n')+'\n'],{
      type:'text/plain;charset=utf-8'
    }));
    const link=document.createElement('a');
    link.href=url;link.download='woonpoints-eigen-jaarreflectie-'+selectedYear+'.txt';
    link.rel='noopener';document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Je eigen jaarreflectie is als privé-TXT aangeboden; de bestandslocatie kan synchroniseren.');
  }

  function offerRow(row:PersonalMonthHistoryRow) {
    if(!privateHistoryValid([row]) || pendingArchive) {
      setMessage('Geen geldig eigen maandvoorstel of nog een openstaand herstelbestand.');
      return;
    }
    const exists=rows.some(value=>value.month===row.month);
    if(!exists && rows.length>=PRIVATE_HISTORY_MAX) {
      setMessage('Maximaal 36 eigen maanden: verwijder eerst bewust een eerdere notitie.');
      return;
    }
    if(exists) {
      setPendingRow(row);
      setMessage('Deze eigen maand bestaat al. Controleer het voorstel vóór vervangen.');
      return;
    }
    setRows(current=>[...current,row]);setPendingDelete(null);
    setMessage('Eigen historische maandnotitie toegevoegd, zonder WoningNet-broncontrole.');
  }
  function saveManual(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(!/^[0-4]$/.test(draftCount) || !privateHistoryValid([{month:draftMonth,count:Number(draftCount)}])) {
      setMessage('Kies een geldige maand vanaf 2000 t/m nu en een eigen tellerstand van 0 tot 4.');
      return;
    }
    offerRow({month:draftMonth,count:Number(draftCount)});
  }
  async function importCsv(file:File|undefined) {
    setPendingArchive(null);setPendingRow(null);
    if(!file) return;
    if(file.size<1 || file.size>2048) {
      setMessage('CSV geweigerd: maximaal 2 KiB en alleen bekende maand-, tellerkolommen.');
      return;
    }
    try {
      const parsed=decodePersonalHistoryCsv(await file.text());
      if(!parsed) throw new Error('invalid');
      setPendingArchive(parsed);
      setMessage('Eigen CSV gelezen; bevestig of je volledige lokale maandarchief vervangen mag worden.');
    } catch {
      setMessage('CSV geweigerd: ongeldige maanden, dubbele waarden, vreemde inhoud of formaat. Huidige historie behouden.');
    }
  }
  function downloadCsv() {
    if(!privateHistoryValid(sorted) || !sorted.length) {
      setMessage('Er is nog geen geldig eigen historisch maandarchief om te bewaren.');
      return;
    }
    const csv=['month,count',...sorted.map(row=>row.month+','+row.count)].join('\r\n')+'\r\n';
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download='woonpoints-eigen-maandteller-historie.csv';
    link.rel='noopener';document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setMessage('Eigen maandgeschiedenis aangeboden als CSV; je bestandslocatie kan synchroniseren.');
  }
  return <div className="manual-reminder-suggest" aria-labelledby="private-month-history-heading">
    <h3 id="private-month-history-heading">Bewaar zelf een historie van maandtellerstanden</h3>
    <p>Leg per kalendermaand één <strong>eigen, niet-geverifieerde</strong>
      eind- of tussenstand vast. Oudere maanden worden nooit geschat of
      automatisch uit WoningNet opgehaald. Je kunt maximaal {PRIVATE_HISTORY_MAX}
      zelf ingevoerde maanden bijhouden, alleen in dit browsertabblad.</p>
    {currentMonth===monthNow && currentCount!==null && !locked && <div>
      <p>Je huidige eigen teller voor {currentMonth} staat op {currentCount}.
        Dit is uitsluitend jouw persoonlijke notitie.</p>
      <button type="button" onClick={()=>offerRow({month:currentMonth,count:currentCount})}
        disabled={Boolean(pendingArchive)}>Neem huidige eigen maandstand bewust over</button>
    </div>}
    <form onSubmit={saveManual}>
      <fieldset>
        <legend>Noteer een maand uit je eigen herinnering of privébestand</legend>
        <label htmlFor="personal-history-month">Kalendermaand</label>
        <input id="personal-history-month" type="month" min="2000-01"
          max={monthNow} value={draftMonth}
          onChange={e=>setDraftMonth(e.target.value)} />
        <label htmlFor="personal-history-count">Eigen maandstand (0–4)</label>
        <input id="personal-history-count" type="number" min="0"
          max={MANUAL_MONTHLY_GOAL} step="1" inputMode="numeric"
          value={draftCount} onChange={e=>setDraftCount(e.target.value)} />
        <button type="submit" disabled={Boolean(pendingArchive)}>
          Voeg deze eigen maandstand toe
        </button>
      </fieldset>
    </form>
    {pendingRow && <div className="month-csv-confirm" role="group"
      aria-label="Bevestig een bestaande historische maand vervangen">
      <p>Je bestaande maand {pendingRow.month} wordt bewust vervangen door
        de eigen stand {pendingRow.count}. Dit heeft geen effect op de
        actuele lokale teller of een echte WoningNet-reactie.</p>
      <button type="button" onClick={()=>{
        const proposal=pendingRow;
        if(!proposal || !privateHistoryValid([proposal])) {setPendingRow(null);return;}
        setRows(current=>{
          const remaining=current.filter(row=>row.month!==proposal.month);
          if(remaining.length>=PRIVATE_HISTORY_MAX) return current;
          return [...remaining,proposal];
        });
        setPendingRow(null);setPendingDelete(null);
        setMessage('Eigen historische maandstand bijgewerkt; actuele maandteller niet gewijzigd.');
      }}>Ja, vervang deze historische maand</button>
      <button type="button" onClick={()=>{
        setPendingRow(null);setMessage('Vervangen geannuleerd; bestaande historie behouden.');
      }}>Behoud huidige maandstand</button>
    </div>}
    <p><strong>{rows.length}</strong> zelf genoteerde maanden.
      {recent?' Laatste eigen notitie: '+recent.month+' · '+recent.count+'.':''}</p>
    {recent && previous && <p>Verschil met vorige <em>ingevulde</em>
      maand ({previous.month}): <strong>
        {recent.count-previous.count>0?'+':''}{recent.count-previous.count}
      </strong>. Ontbrekende maanden zijn niet bijgeschat.</p>}
    <div className="month-history-table-wrap" aria-labelledby="private-year-insight-heading">
      <h4 id="private-year-insight-heading">Mijn eigen jaaroverzicht — geen officiële punten</h4>
      <label htmlFor="private-year-select">Jaar van zelf genoteerde maanden</label>
      <select id="private-year-select" value={selectedYear}
        onChange={e=>setSelectedYear(e.target.value)}>
        {Array.from(new Set([String(currentYear),...sorted.map(row=>row.month.slice(0,4))]))
          .sort((a,b)=>Number(b)-Number(a)).map(option=>
            <option key={option} value={option}>{option}</option>)}
      </select>
      {yearIsValid && <div aria-live="polite">
        <p><strong>{filledYear.length} van 12 maanden ingevuld</strong>
          {' · '}{exactFour} daarvan met de eigen stand 4.
          {filledYear.length>0?
            ' Gemiddelde van uitsluitend ingevulde maanden: '+
              (observedSum/filledYear.length).toLocaleString('nl-NL',{maximumFractionDigits:2})+'.':''}
        </p>
        <p>Geen doorlopende reeks of garantie: ontbrekende maanden zijn
          onbekend, niet nul. Een eigen maandstand van 4 is geen bewijs
          van vier door WoningNet geldig geregistreerde reacties.</p>
        <table>
          <caption>Privé jaar {selectedYear}: uitsluitend lokaal zelf ingevoerde maandtellers</caption>
          <thead><tr><th scope="col">Maand</th>
            <th scope="col">Zelf genoteerd</th><th scope="col">Verschil vorige kalendermaand</th>
          </tr></thead>
          <tbody>{yearRows.map(row=><tr key={row.month}>
            <th scope="row">{new Intl.DateTimeFormat('nl-NL',{month:'long'})
              .format(new Date(Number(row.month.slice(0,4)),Number(row.month.slice(5,7))-1,1))}</th>
            <td>{row.count===null?(row.future?'Nog niet begonnen':'Niet ingevuld'):row.count+' / 4'}</td>
            <td>{row.change===null?'Onbekend':(row.change>0?'+':'')+row.change}</td>
          </tr>)}</tbody>
        </table>
        <button type="button" onClick={exportOwnYear} disabled={!filledYear.length}>
          Bewaar persoonlijke jaarreflectie als TXT…
        </button>

        <div className="month-history-table-wrap"
          aria-labelledby="private-year-compare-heading">
          <h5 id="private-year-compare-heading">Twee jaren eerlijk vergelijken</h5>
          <label htmlFor="private-year-compare-select">Vergelijk {selectedYear} met</label>
          <select id="private-year-compare-select" value={compareYear}
            onChange={event=>setCompareYear(event.target.value)}>
            {Array.from({length:currentYear-1999},(_,i)=>String(currentYear-i))
              .map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          {canCompare ? <div aria-live="polite">
            <p><strong>{matchedMonths.length} van 12 maanden</strong> hebben in beide
              jaren een eigen invoer. Alleen die maandparen vergelijken we.
              {matchedMonths.length>0?' Totale verschillen A − B: '+
                formattedDifference(matchedDifference)+'.':''}</p>
            <p>Een niet-ingevulde maand is onbekend en draagt niets bij aan
              het verschil. Dat beide jaren verschillende aantallen ingevulde
              maanden hebben, maakt een volledige jaarvergelijking onbetrouwbaar.
              Er worden geen echte reacties of officiële zoekpunten afgeleid.</p>
            <table>
              <caption>Eigen maandteller: {selectedYear} naast {compareYear},
                met uitsluitend expliciet ingevulde vergelijking</caption>
              <thead><tr>
                <th scope="col">Kalendermaand</th>
                <th scope="col">{selectedYear}</th>
                <th scope="col">{compareYear}</th>
                <th scope="col">Verschil A − B</th>
              </tr></thead>
              <tbody>{comparableRows.map(row=><tr key={row.index}>
                <th scope="row">{new Intl.DateTimeFormat('nl-NL',{month:'short'})
                  .format(new Date(year,row.index-1,1))}</th>
                <td>{row.first===null?'Onbekend':row.first+'/4'}</td>
                <td>{row.other===null?'Onbekend':row.other+'/4'}</td>
                <td>{row.difference===null?'—':formattedDifference(row.difference)}</td>
              </tr>)}</tbody>
            </table>
            <button type="button" onClick={savePersonalYearComparison}
              disabled={matchedMonths.length===0}>
              Bewaar eigen jaarvergelijking als privé-TXT…
            </button>
            <p>Een export is altijd een aparte keuze en verandert nooit
              je actuele maandteller of historische invoer.</p>
          </div> : <p role="status">Kies twee verschillende jaren vanaf 2000
            tot en met het huidige jaar.</p>}
        </div>
        <p>Dit overzicht gebruikt alleen de historische notities in dit
          tabblad. Jaarreflectie opslaan gebeurt uitsluitend na je eigen klik.</p>
      </div>}
    </div>
    {sorted.length>0 && <div className="month-history-table-wrap">
      <table>
        <caption>Eigen maandtellerhistorie, geen officieel bronbewijs</caption>
        <thead><tr><th scope="col">Maand</th><th scope="col">Eigen stand</th>
          <th scope="col">Handeling</th></tr></thead>
        <tbody>{sorted.map(row=><tr key={row.month}>
          <th scope="row">{row.month}</th><td>{row.count} / 4</td>
          <td><button type="button" onClick={()=>setPendingDelete(row.month)}>
            Verwijder…</button></td>
        </tr>)}</tbody>
      </table>
    </div>}
    {pendingDelete && <div className="month-csv-confirm" role="group"
      aria-label="Bevestig historische maand verwijderen">
      <p>Wil je de eigen maandnotitie {pendingDelete} uit dit
        archief verwijderen? Dit verandert geen actuele teller.</p>
      <button type="button" onClick={()=>{
        setRows(current=>current.filter(row=>row.month!==pendingDelete));
        setPendingDelete(null);setPendingRow(null);
        setMessage('Deze eigen historische notitie verwijderd.');
      }}>Ja, verwijder deze maand</button>
      <button type="button" onClick={()=>setPendingDelete(null)}>
        Behoud deze maand</button>
    </div>}
    <div className="month-history-actions">
      <button type="button" onClick={downloadCsv} disabled={!sorted.length}>
        Bewaar mijn eigen maandhistorie als CSV…
      </button>
    </div>
    <label htmlFor="personal-history-import">Open eigen eerdere Woonpoints-maandstand
      of maandhistorie (CSV, maximaal 2 KiB)</label>
    <input id="personal-history-import" type="file" accept=".csv,text/csv"
      onChange={e=>{const file=e.currentTarget.files?.[0];
        e.currentTarget.value='';void importCsv(file);}} />
    {pendingArchive && <div className="month-csv-confirm" role="group"
      aria-label="Bevestig volledige eigen maandhistorie vervangen">
      <p>Deze CSV bevat {pendingArchive.length} zelf genoteerde maanden en
        vervangt na bevestiging alle {rows.length} huidige historienotities.
        De actuele maandteller blijft gescheiden en ongewijzigd.</p>
      <button type="button" onClick={()=>{
        if(!privateHistoryValid(pendingArchive)){setPendingArchive(null);return;}
        setRows([...pendingArchive]);setPendingArchive(null);
        setPendingRow(null);setPendingDelete(null);
        setMessage('Eigen maandhistorie lokaal hersteld; geen WoningNet-bronbewijs.');
      }}>Ja, vervang alleen mijn historische notities</button>
      <button type="button" onClick={()=>{
        setPendingArchive(null);setMessage('CSV-herstel geannuleerd; historie behouden.');
      }}>Behoud mijn historische notities</button>
    </div>}
    {message && <p role="status">{message}</p>}
    <p>CSV-import en -export gebeuren alleen na jouw keuze. Bestanden op
      een gesynchroniseerde locatie kunnen buiten Woonpoints worden
      opgeslagen. Dit is geen officieel reactieregister, zoekpuntenstand
      of garantie op geldige maandreacties.</p>
  </div>;
}


/** User-estimated geometry, not a vehicle/load authorization or a physical fit guarantee. */
export function PrivateMovingVolume() {
  type Item = { id:number; name:string; width:string; depth:string; height:string; quantity:string };
  const initial: Item[] = [
    {id:1,name:'Eigen verhuisdoos (voorbeeld)',width:'60',depth:'40',height:'40',quantity:'8'},
    {id:2,name:'Eigen tafel (voorbeeld)',width:'140',depth:'80',height:'75',quantity:'1'},
    {id:3,name:'Eigen kast (voorbeeld)',width:'100',depth:'50',height:'200',quantity:'1'}
  ];
  const [items,setItems]=useState<Item[]>(initial);
  const nextId=useRef(4);
  // Per-line counts live only in this tab; the existing v1 inventory file stays compatible.
  const [packedCounts,setPackedCounts]=useState<Record<number,string>>({});
  const [margin,setMargin]=useState('15');
  const [capacity,setCapacity]=useState('10');
  const budgetDefaults={plannedTrips:'2',euroPerTrip:'90',laborHours:'8',
    helperHourlyEuro:'0',materialsEuro:'75',otherEuro:'100',reservePct:'15'};
  const [budget,setBudget]=useState(budgetDefaults);
  const [budgetReport,setBudgetReport]=useState<{text:string,signature:string}|null>(null);
  const [message,setMessage]=useState('');
  const [preview,setPreview]=useState<string|null>(null);
  const [pendingArchive,setPendingArchive]=useState<{
    rows:Array<Omit<Item,'id'>>; margin:string; capacity:string; signature:string
  }|null>(null);
  const parse=(raw:string,min:number,max:number,integer=false):number|null=>{
    const value=raw.trim();
    if(!/^\d+(?:[.,]\d{1,2})?$/.test(value))return null;
    const n=Number(value.replace(',','.'));
    if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))return null;
    return n;
  };
  const measured=items.map(item=>{
    const w=parse(item.width,1,400),d=parse(item.depth,1,400),
      h=parse(item.height,1,400),q=parse(item.quantity,0,100,true);
    const safeName=item.name.trim().length>0&&item.name.trim().length<=48&&
      !/[\u0000-\u001F\u007F]/.test(item.name);
    return {item,volume:safeName&&w!==null&&d!==null&&h!==null&&q!==null
      ? w*d*h*q/1000000 : null};
  });
  const overhead=parse(margin,0,50),vanCapacity=parse(capacity,1,30);
  const valid=items.length>0&&items.length<=25&&overhead!==null&&vanCapacity!==null&&
    measured.every(row=>row.volume!==null);
  const rawTotal=measured.reduce((sum,row)=>sum+(row.volume??0),0);
  const loadEstimate=valid?rawTotal*(1+overhead!/100):0;
  const safeTotal=valid&&loadEstimate<=200;
  const currentSignature=JSON.stringify({rows:items.map(({id,...rest})=>rest),margin,capacity});
  const trips=safeTotal&&loadEstimate>0?Math.ceil(loadEstimate/vanCapacity!):0;

  const packRows=measured.map(({item,volume})=>{
    const quantity=parse(item.quantity,0,100,true);
    const packed=parse(packedCounts[item.id]??'0',0,quantity??0,true);
    return {item,volume,quantity,packed};
  });
  const packingValid=safeTotal&&packRows.every(row=>row.packed!==null&&row.quantity!==null);
  const packedPieces=packRows.reduce((sum,row)=>sum+(row.packed??0),0);
  const piecesTotal=packRows.reduce((sum,row)=>sum+(row.quantity??0),0);
  const packedVolume=packingValid?packRows.reduce((sum,row)=>{
    if(!row.quantity||row.volume===null)return sum;
    return sum+row.volume*row.packed!/row.quantity;
  },0):0;
  const remainingVolume=packingValid?Math.max(0,rawTotal-packedVolume):0;
  const percentage=packingValid&&piecesTotal>0?100*packedPieces/piecesTotal:0;
  const packSignature=JSON.stringify({
    inventory:items.map(({id,...row})=>row),
    packed:items.map(row=>packedCounts[row.id]??'0')
  });
  const [packPreview,setPackPreview]=useState<{text:string,signature:string}|null>(null);
  function preparePackList(){
    if(!packingValid){setMessage('Controleer eerst de inventaris en het ingepakte aantal per item.');return;}
    const lines=[
      'WOONPOINTS · EIGEN INPAKLIJST',
      'Handmatige momentopname, geen automatische opslag of externe controle.',
      'Een itemregel telt pas als ingepakt voor precies het ingevoerde aantal stuks.',
      '',
      ...packRows.map(row=>{
        const left=row.quantity!-row.packed!;
        return row.item.name.trim()+' | totaal '+row.quantity+' | ingepakt '+
          row.packed+' | nog '+left+' | omhullend nog '+fmt(
            row.quantity ? row.volume!*left/row.quantity : 0
          )+' m3';
      }),
      '',
      'Eigen stuks totaal: '+piecesTotal,
      'Eigen stuks ingepakt: '+packedPieces,
      'Eigen stuks nog in te pakken: '+(piecesTotal-packedPieces),
      'Rechthoekig volume ingepakt: '+fmt(packedVolume)+' m3',
      'Rechthoekig volume nog niet ingepakt: '+fmt(remainingVolume)+' m3',
      'Niet gecontroleerd: gewicht, stapelbaarheid, voertuigcapaciteit of feitelijke verhuisstatus.'
    ];
    setPackPreview({text:lines.join('\n')+'\n',signature:packSignature});
    setMessage('Controleer alle eigen itemnamen en aantallen voordat je deze momentopname bewaart.');
  }
  function savePackList(){
    if(!packPreview||packPreview.signature!==packSignature||!packingValid){
      setPackPreview(null);
      setMessage('De inventaris is gewijzigd. Maak eerst opnieuw een inpakoverzicht.');
      return;
    }
    const url=URL.createObjectURL(new Blob([packPreview.text],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download='woonpoints-eigen-inpakstatus.txt';
    link.rel='noopener';document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setPackPreview(null);
    setMessage('Eigen TXT-inpakoverzicht aangeboden; de opslaglocatie kan synchroniseren.');
  }

  const costValues={
    plannedTrips:parse(budget.plannedTrips,0,300,true),
    euroPerTrip:parse(budget.euroPerTrip,0,2000),
    laborHours:parse(budget.laborHours,0,200),
    helperHourlyEuro:parse(budget.helperHourlyEuro,0,200),
    materialsEuro:parse(budget.materialsEuro,0,20000),
    otherEuro:parse(budget.otherEuro,0,30000),
    reservePct:parse(budget.reservePct,0,50)
  };
  const costValid=safeTotal&&Object.values(costValues).every(v=>v!==null)&&
    costValues.plannedTrips!==null&&costValues.plannedTrips>=trips;
  const vehicleExpense=(costValues.plannedTrips??0)*(costValues.euroPerTrip??0);
  const helpersExpense=(costValues.laborHours??0)*(costValues.helperHourlyEuro??0);
  const preReserveCost=vehicleExpense+helpersExpense+
    (costValues.materialsEuro??0)+(costValues.otherEuro??0);
  const reserveExpense=preReserveCost*(costValues.reservePct??0)/100;
  const finalMovingCost=preReserveCost+reserveExpense;
  const budgetSignature=JSON.stringify({
    items:items.map(({id,...item})=>item), margin,capacity,budget
  });
  const fmt=(n:number)=>new Intl.NumberFormat('nl-NL',{maximumFractionDigits:2}).format(n);
  const change=(id:number,key:keyof Omit<Item,'id'>,value:string)=>{
    setItems(previous=>previous.map(row=>row.id===id?{...row,[key]:value}:row));
    if(key==='quantity')setPackedCounts(current=>({...current,[id]:'0'}));
    setPackPreview(null);setPreview(null);setMessage('');
  };
  const add=(name:string,width:string,depth:string,height:string)=>{
    if(items.length>=25){setMessage('Maximaal 25 eigen itemregels.');return;}
    setItems(previous=>[...previous,{
      id:nextId.current++,name,width,depth,height,quantity:'1'
    }]);
    setPackPreview(null);setPreview(null);setMessage('');
  };
  function exportOwnInventory(){
    if(!safeTotal){setMessage('Herstelbestand kan alleen worden bewaard bij geldige invoer.');return;}
    const data={format:'woonpoints-private-volume-v1',
      rows:items.map(({id,...rest})=>rest),margin,capacity};
    const content=JSON.stringify(data,null,2)+'\n';
    const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;
    link.download='woonpoints-eigen-verhuisinventaris.json';link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setPendingArchive(null);
    setMessage('Eigen JSON-inventaris aangeboden. De gekozen opslaglocatie kan synchroniseren.');
  }
  async function prepareInventoryRestore(file:File|undefined){
    setPendingArchive(null);
    if(!file)return;
    if(file.size<1||file.size>8192){
      setMessage('Bestand geweigerd: maximaal 8 KiB privé-JSON.');
      return;
    }
    try {
      const source=await file.text();
      if(new TextEncoder().encode(source).byteLength>8192)throw Error('bytes');
      const candidate:unknown=JSON.parse(source);
      if(!candidate||typeof candidate!=='object'||Array.isArray(candidate)||
        Object.getPrototypeOf(candidate)!==Object.prototype)throw Error('root');
      const doc=candidate as Record<string,unknown>;
      if(Object.keys(doc).join(',')!=='format,rows,margin,capacity'||
        doc.format!=='woonpoints-private-volume-v1'||
        typeof doc.margin!=='string'||typeof doc.capacity!=='string'||
        !Array.isArray(doc.rows)||doc.rows.length<1||doc.rows.length>25 ||
        parse(doc.margin,0,50)===null||parse(doc.capacity,1,30)===null)throw Error('shape');
      const rows:Array<Omit<Item,'id'>>=[];
      let total=0;
      for(const line of doc.rows){
        if(!line||typeof line!=='object'||Array.isArray(line)||
          Object.getPrototypeOf(line)!==Object.prototype)throw Error('row');
        const v=line as Record<string,unknown>;
        if(Object.keys(v).join(',')!=='name,width,depth,height,quantity' ||
          typeof v.name!=='string'||typeof v.width!=='string'||
          typeof v.depth!=='string'||typeof v.height!=='string'||
          typeof v.quantity!=='string'||v.name.trim().length<1||
          v.name.trim().length>48||/[\u0000-\u001F\u007F]/.test(v.name))throw Error('fields');
        const w=parse(v.width,1,400),d=parse(v.depth,1,400),
          h=parse(v.height,1,400),q=parse(v.quantity,0,100,true);
        if(w===null||d===null||h===null||q===null)throw Error('numbers');
        total+=w*d*h*q/1000000;
        rows.push({name:v.name,width:v.width,depth:v.depth,
          height:v.height,quantity:v.quantity});
      }
      if(total*(1+(parse(doc.margin,0,50)??0)/100)>200)throw Error('too-large');
      if(JSON.stringify(doc,null,2)+'\n'!==source)throw Error('canonical');
      setPendingArchive({rows,margin:doc.margin,capacity:doc.capacity,signature:currentSignature});
      setMessage('Geldige eigen inventaris gelezen. Bevestig apart voordat je de huidige regels vervangt.');
    } catch {
      setMessage('Verhuisbestand geweigerd: verkeerde velden, wijziging, hoeveelheid of formaat. Huidige inventaris behouden.');
    }
  }
  function restoreOwnInventory(){
    if(!pendingArchive||pendingArchive.signature!==currentSignature){
      setPendingArchive(null);setMessage('Huidige inventaris gewijzigd. Kies het herstelbestand opnieuw.');
      return;
    }
    setItems(pendingArchive.rows.map(row=>({...row,id:nextId.current++})));
    setMargin(pendingArchive.margin);setCapacity(pendingArchive.capacity);
    setPackedCounts({});setPackPreview(null);
    setPreview(null);setPendingArchive(null);setBudgetReport(null);
    setMessage('Eigen inventaris bewust in dit tabblad hersteld. Niets is extern verstuurd.');
  }


  function offerMovingBudgetToLedger(){
    if(!costValid){setMessage('Controleer eerst je verhuisvolume en begroting.');return;}
    const offer=[
      {label:'Ritkosten (eigen begroting)',category:'Vervoer',amount:vehicleExpense},
      {label:'Hulpkosten (eigen begroting)',category:'Hulp',amount:helpersExpense},
      {label:'Verpakkingsmateriaal (begroot)',category:'Verpakkingen',amount:costValues.materialsEuro!},
      {label:'Andere verhuiskosten (begroot)',category:'Overig',amount:costValues.otherEuro!},
      {label:'Onvoorziene reserve (begroot)',category:'Overig',amount:reserveExpense}
    ].map(item=>({...item,plannedCents:Math.round(item.amount*100)}));
    if(offer.some(item=>!Number.isSafeInteger(item.plannedCents)||item.plannedCents>9999999)){
      setMessage('Je begroting bevat bedragen die groter zijn dan de limiet van het privé-kostenboek. Verlaag deze eerst.');
      return;
    }
    window.dispatchEvent(new CustomEvent('woonpoints:moving-budget-offer',{
      detail:{format:'woonpoints-moving-budget-offer',version:1,offer:offer.map(({label,category,plannedCents})=>({label,category,plannedCents}))}
    }));
    document.getElementById('private-moving-expenses-heading')?.scrollIntoView({behavior:'smooth',block:'start'});
    setMessage('Begroting als concept aan het privé-kostenboek aangeboden; niets is automatisch overgenomen.');
  }

  function prepareMovingBudget(){
    if(!costValid){setMessage('Corrigeer eerst het verhuisvolume, jouw ritten en kosten.');return;}
    const lines=[
      'WOONPOINTS · EIGEN VERHUISKOSTENSCENARIO',
      'Geen verhuizersofferte, voertuiggarantie, verzekeringsadvies of werkelijk rittenbewijs.',
      'Beperkt volume inclusief eigen reserve: '+fmt(loadEstimate)+' m3',
      'Volumematige minimumritten: '+trips,
      'Zelf gekozen te begroten ritten: '+budget.plannedTrips,
      'Zelf geraamde prijs per rit: €'+fmt(costValues.euroPerTrip!),
      'Ritkosten: €'+fmt(vehicleExpense),
      'Zelf gekozen hulpuren: '+budget.laborHours,
      'Zelf ingeschat bedrag per hulpuur: €'+fmt(costValues.helperHourlyEuro!),
      'Hulpkosten: €'+fmt(helpersExpense),
      'Dozen/inpakmateriaal: €'+fmt(costValues.materialsEuro!),
      'Overige eigen verhuiskosten: €'+fmt(costValues.otherEuro!),
      'Subtotaal: €'+fmt(preReserveCost),
      'Zelf ingestelde onvoorziene reserve: '+budget.reservePct+'% (= €'+fmt(reserveExpense)+')',
      'EIGEN BEGROTING: €'+fmt(finalMovingCost),
      'Eén extra rit zonder extra personeel/materiaal: + €'+fmt(costValues.euroPerTrip!),
      '',
      'Al deze bedragen zijn handmatige scenario-invoer, geen marktprijs of garantie.',
      'De werkelijke voertuig-/gewichtslimiet, toegang, reistijd en verzekeringen zijn niet gemodelleerd.'
    ];
    setBudgetReport({text:lines.join('\n')+'\n',signature:budgetSignature});
    setMessage('Controleer jouw verhuiskostenconcept. Alleen een tweede klik maakt een TXT.');
  }
  function saveMovingBudget(){
    if(!budgetReport||budgetReport.signature!==budgetSignature||!costValid){
      setBudgetReport(null);setMessage('Begroting is veranderd of ongeldig. Maak eerst opnieuw een concept.');
      return;
    }
    const url=URL.createObjectURL(new Blob([budgetReport.text],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;
    link.download='woonpoints-eigen-verhuisbudget.txt';link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setBudgetReport(null);
    setMessage('Alleen jouw budget-TXT aangeboden. Een opslagprovider kan het bestand synchroniseren.');
  }

  function makePreview(){
    if(!safeTotal){setMessage('Controleer eerst alle afmetingen, aantallen en de capaciteit.');return;}
    const lines=[
      'WOONPOINTS · EIGEN VERHUISVOLUME-INSCHATTING',
      'Alleen eigen metingen, geen professionele laadplanning of vervoersadvies.',
      'Lengte, breedte en hoogte zijn in centimeter en worden als rechthoekige omhulling benaderd.',
      'Geen garantie voor passen, stapelen, veilige lading, tillen, gewicht of rijbewijsregels.',
      '',
      ...measured.map(({item,volume},i)=> (i+1)+'. '+item.name.trim()+
        ' | '+item.width+'×'+item.depth+'×'+item.height+' cm | aantal '+item.quantity+
        ' | rechthoekig volume '+fmt(volume!)+' m3'),
      '',
      'Som geschatte omhullingen: '+fmt(rawTotal)+' m3',
      'Zelfgekozen extra laadruimte: '+margin+'%',
      'Volume inclusief reserveruimte: '+fmt(loadEstimate)+' m3',
      'Zelf ingevulde bruikbare ruimte per rit: '+capacity+' m3',
      'ALLEEN VOLUMEMATIGE ONDERGRENS: '+trips+' rit(ten).',
      'Gewicht, hoogte, deurmaten, laadvolgorde en ladingzekering zijn NIET berekend.',
      'Voor een echte verhuizing zelf het voertuig en lading controleren.'
    ];
    setPreview(lines.join('\n')+'\n');
    setMessage('Controleer eerst het persoonlijke rapport en je eigen itemnamen.');
  }
  function download(){
    if(!preview||!safeTotal)return;
    const url=URL.createObjectURL(new Blob([preview],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download='woonpoints-eigen-verhuisvolume.txt';link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setPreview(null);
    setMessage('Eigen TXT ter download aangeboden; je opslaglocatie kan synchroniseren.');
  }
  return <section className="panel" aria-labelledby="private-moving-volume-heading">
    <div>
      <p className="eyebrow">PRIVÉ VERHUISPLAN · ALLEEN IN DIT TABBLAD</p>
      <h2 id="private-moving-volume-heading">Hoeveel verhuisruimte heb je ongeveer nodig?</h2>
      <p>Voer afmetingen in <strong>centimeters</strong> en aantallen in.
        Woonpoints telt uitsluitend de rechthoekige omhulling van eigen dozen en
        meubels. De voorbeeldregels zijn fictief en vrij te wijzigen of verwijderen.</p>
      <p><strong>Geen beladingadvies.</strong> Een aantal ritten op volume is
        slechts een ondergrens: meubels kunnen niet in elkaar passen of gestapeld
        worden, en massa, aslast, maximale belading, lift-, deur- en trapmaten,
        veiligheid en rijbewijsregels zijn niet meegenomen.</p>
      <p>Gebruik geen volledige adressen of andere persoonsgegevens als itemnaam.
        Alle notities blijven alleen op dit scherm totdat je zelf een TXT bewaart.</p>
    </div>
    <div>
      <p aria-live="polite">{items.length} van maximaal 25 eigen regels.</p>
      {items.map((item,index)=><fieldset key={item.id}>
        <legend>Item {index+1}</legend>
        <label htmlFor={'mv-'+item.id+'-name'}>Eigen itemnaam (max. 48 tekens)</label>
        <input id={'mv-'+item.id+'-name'} type="text" maxLength={48}
          value={item.name} onChange={e=>change(item.id,'name',e.target.value)}/>
        {([
          ['width','Breedte (cm)'],
          ['depth','Diepte (cm)'],
          ['height','Hoogte (cm)'],
          ['quantity','Aantal stuks']
        ] as const).map(([key,label])=><div key={key}>
          <label htmlFor={'mv-'+item.id+'-'+key}>{label}</label>
          <input id={'mv-'+item.id+'-'+key} type="text" inputMode="decimal"
            maxLength={10} value={item[key]}
            onChange={e=>change(item.id,key,e.target.value)}/>
        </div>)}
        <p>Omhullend totaal voor deze regel: {
          measured[index].volume===null?'Onbekend (invoer corrigeren)':
          fmt(measured[index].volume!)+' m³'
        }</p>
        <button type="button" className="secondary" onClick={()=>{
          setItems(previous=>previous.filter(row=>row.id!==item.id));
          setPackedCounts(current=>{
            const next={...current};delete next[item.id];return next;
          });
          setPackPreview(null);setPreview(null);setMessage('Eigen item verwijderd.');
        }}>Verwijder item {index+1}</button>
      </fieldset>)}
      <button type="button" disabled={items.length>=25}
        onClick={()=>add('Nieuw eigen item','50','50','50')}>
        Voeg eigen meubel of doos toe
      </button>
      <label htmlFor="mv-overhead">Extra laadruimte (%) · 0–50</label>
      <input id="mv-overhead" type="text" inputMode="decimal" maxLength={8}
        value={margin} onChange={e=>{setMargin(e.target.value);setPreview(null);}}/>
      <label htmlFor="mv-capacity">Zelf geverifieerde bruikbare m³ per rit · 1–30</label>
      <input id="mv-capacity" type="text" inputMode="decimal" maxLength={8}
        value={capacity} onChange={e=>{setCapacity(e.target.value);setPreview(null);}}/>
      {!safeTotal?<p role="alert">Controleer alle namen en meetwaarden:
        1–400 cm, aantallen 0–100, maximaal 200 m³ inclusief reserveruimte.
        Geef een bruikbare voertuigcapaciteit en extra laadruimte binnen de grenzen op.</p>:
        <div aria-live="polite">
          <h3>Jouw voorlopige volumeberekening</h3>
          <dl>
            <div><dt>Omhullend volume</dt><dd>{fmt(rawTotal)} m³</dd></div>
            <div><dt>Inclusief eigen reserveruimte</dt><dd>{fmt(loadEstimate)} m³</dd></div>
            <div><dt>Minimumritten naar alleen volume</dt>
              <dd><strong>{trips}</strong> (zonder pas-/gewichtsgarantie)</dd></div>
          </dl>
          <p>Een nulhoeveelheid telt niet mee. Een ritindicatie kan te laag zijn
            als goederen niet stapelbaar zijn of de bus een lagere gewichtslimiet heeft.</p>
        </div>}
      <div className="month-csv-confirm" aria-labelledby="private-moving-budget-heading">
        <h3 id="private-moving-budget-heading">Begroot je eigen verhuizing</h3>
        <p>Maak een voorzichtig <strong>eigen kostenplaatje</strong>. Gebruik
          minimaal evenveel geplande ritten als de volumematige ondergrens.
          Kies zelf kosten per rit, hulpuurtarief, inpakkosten en een reserve.
          Het gaat niet om een actuele prijs, offerte of beladingsgarantie.</p>
        {([
          ['plannedTrips','Zelf gepland aantal ritten (0–300, niet minder dan de volumeschatting)'],
          ['euroPerTrip','Eigen voertuigkosten per rit (€)'],
          ['laborHours','Zelf geplande betaalde hulpuren'],
          ['helperHourlyEuro','Zelf geraamd bedrag per hulpuur (€)'],
          ['materialsEuro','Dozen en inpakmateriaal (€)'],
          ['otherEuro','Andere eigen verhuiskosten (€)'],
          ['reservePct','Extra reserveruimte voor onverwachte kosten (%)']
        ] as const).map(([key,label])=><div key={key}>
          <label htmlFor={'mv-budget-'+key}>{label}</label>
          <input id={'mv-budget-'+key} type="text" inputMode="decimal"
            maxLength={10} value={budget[key]} onChange={e=>{
              setBudget(current=>({...current,[key]:e.target.value}));
              setBudgetReport(null);setMessage('');
            }}/>
        </div>)}
        {!costValid ? <p role="alert">Geen bruikbare begroting: kies geldige
          kosten, reserve van 0–50% en minimaal {trips} eigen rit(ten).
          Maximumbedragen en aantallen zijn begrensd. Je
          volumeberekening en inventaris blijven bruikbaar.</p>:
          <div aria-live="polite">
            <dl>
              <div><dt>Voertuigritten</dt><dd>€{fmt(vehicleExpense)}</dd></div>
              <div><dt>Betaalde hulp</dt><dd>€{fmt(helpersExpense)}</dd></div>
              <div><dt>Subtotaal incl. materialen en overige kosten</dt>
                <dd>€{fmt(preReserveCost)}</dd></div>
              <div><dt>Jouw onvoorziene reserve</dt><dd>€{fmt(reserveExpense)}</dd></div>
              <div><dt><strong>Totaal eigen kostenplaatje</strong></dt>
                <dd><strong>€{fmt(finalMovingCost)}</strong></dd></div>
              <div><dt>Een extra rit, exclusief overige wijzigingen</dt>
                <dd>+ €{fmt(costValues.euroPerTrip!)}</dd></div>
            </dl>
            <p>De geplande ritten zijn een eigen inschatting, geen
              gegarandeerde laadcapaciteit. Neem gewicht, tillen,
              toegang en eventuele vergunningen zelf mee.</p>
          </div>}
        <button type="button" disabled={!costValid} onClick={offerMovingBudgetToLedger}>
          Bied deze vijf begrotingsposten aan in het privé-kostenboek…
        </button>
        <button type="button" disabled={!costValid} onClick={prepareMovingBudget}>
          Bekijk eigen verhuiskosten-TXT eerst…
        </button>
        {budgetReport&&<div role="group" aria-label="Bevestig eigen verhuisbudgetexport">
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{budgetReport.text}</pre>
          <button type="button" disabled={!costValid||budgetReport.signature!==budgetSignature}
            onClick={saveMovingBudget}>
            Ja, bewaar alleen dit budget als privé-TXT…
          </button>
          <button type="button" className="secondary" onClick={()=>{
            setBudgetReport(null);setMessage('Budgetexport geannuleerd; geen bestand gemaakt.');
          }}>Nee, alleen bekijken</button>
        </div>}
        <p>Je begroting wordt alleen op dit scherm vastgehouden en staat niet
          in de afzonderlijke JSON-inventaris. Bewaar desgewenst een
          eigen TXT-samenvatting om dit bedrag later terug te vinden.</p>
      </div>
      <div className="month-csv-confirm" aria-labelledby="mv-pack-progress-heading">
        <h3 id="mv-pack-progress-heading">Hoeveel heb je echt al ingepakt?</h3>
        <p>Vul per eigen meubel-/doosregel het aantal stuks in dat jij
          **zelf als ingepakt markeert**. De teller is onafhankelijk van
          het berekende minimumaantal ritten; markeren zegt niets over veilig
          vervoer, daadwerkelijke laadruimte of officiële verhuisstatus.</p>
        {items.map((item,index)=>{
          const measuredRow=packRows[index];
          return <div key={item.id}>
            <label htmlFor={'mv-packed-'+item.id}>
              {item.name.trim()||'Item '+(index+1)} · ingepakt van {item.quantity}
            </label>
            <input id={'mv-packed-'+item.id} type="number" min="0"
              max={measuredRow.quantity??0} step="1" inputMode="numeric"
              value={packedCounts[item.id]??'0'}
              onChange={e=>{
                setPackedCounts(current=>({...current,[item.id]:e.target.value}));
                setPackPreview(null);setMessage('');
              }}/>
            <button type="button" className="secondary" disabled={measuredRow.quantity===null}
              onClick={()=>{
                setPackedCounts(current=>({...current,[item.id]:item.quantity}));
                setPackPreview(null);
              }}>Alle stuks van deze regel ingepakt</button>
          </div>;
        })}
        {packingValid?<div aria-live="polite">
          <p><strong>{packedPieces} / {piecesTotal}</strong> stuks zelf
            als ingepakt genoteerd ({fmt(percentage)}%). Nog
            <strong> {piecesTotal-packedPieces}</strong> stuks open.</p>
          <p>Bij benadering <strong>{fmt(packedVolume)} m³</strong> ingepakt en
            <strong> {fmt(remainingVolume)} m³</strong> niet ingepakt.
            Dit rekent slechts op rechthoekige afmetingen, niet op
            stapelbaarheid of laadgewicht.</p>
        </div>:<p role="alert">Corrigeer eerst aantallen: ingepakt mag
          niet negatief, groter dan totaal of een deel van een stuk zijn.
          Ongeldige inventarismaten blokkeren de volumesamenvatting.</p>}
        <button type="button" disabled={!packingValid} onClick={preparePackList}>
          Toon eigen inpakmomentopname als TXT…
        </button>
        {packPreview!==null&&<div role="group"
          aria-label="Bevestig eigen inpakoverzicht bewaren">
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{packPreview.text}</pre>
          <button type="button" disabled={packPreview.signature!==packSignature}
            onClick={savePackList}>Ja, bewaar alleen deze inpakstatus als TXT…</button>
          <button type="button" className="secondary" onClick={()=>{
            setPackPreview(null);setMessage('Geen inpakbestand gemaakt.');
          }}>Nee, laat het alleen op het scherm</button>
        </div>}
        <button type="button" className="secondary" onClick={()=>{
          setPackedCounts({});setPackPreview(null);setMessage('Inpakstatus gewist; inventaris behouden.');
        }}>Wis uitsluitend mijn ingepakte aantallen</button>
        <p>De bestaande versie-1 JSON-inventaris bevat bewust alleen maten
          en aantallen, niet deze voortgang. Een apart inpak-TXT wordt
          uitsluitend na jouw eigen bevestiging aangeboden.</p>
      </div>
      <div className="month-csv-confirm">
        <h3>Eigen inventaris bewust bewaren of herstellen</h3>
        <p>Bewaar een volledige privé-JSON om je maten en aantallen later
          weer zelf in te laden. Dit gebeurt nooit automatisch.
          Controleer eigen itemnamen op persoonlijke gegevens.</p>
        <button type="button" onClick={exportOwnInventory} disabled={!safeTotal}>
          Bewaar mijn complete privé-inventaris als JSON…
        </button>
        <label htmlFor="mv-private-restore">Kies een eigen eerder bewaarde inventaris (max. 8 KiB)</label>
        <input id="mv-private-restore" type="file" accept=".json,application/json"
          onChange={e=>{const file=e.currentTarget.files?.[0];e.currentTarget.value='';
            void prepareInventoryRestore(file);}} />
        {pendingArchive&&<div role="group" aria-label="Bevestig eigen inventaris vervangen">
          <p>Je bestand bevat <strong>{pendingArchive.rows.length}</strong> eigen
            regels. Vervangen verwijdert jouw huidige {items.length} regels op
            dit scherm. Het verandert geen andere Woonpoints-sectie of bestanden.</p>
          {pendingArchive.signature!==currentSignature&&<p role="alert">
            Je huidige invoer is veranderd; selecteer het bestand opnieuw.</p>}
          <button type="button" disabled={pendingArchive.signature!==currentSignature}
            onClick={restoreOwnInventory}>
            Ja, vervang alleen mijn verhuisinventaris
          </button>
          <button type="button" className="secondary" onClick={()=>{
            setPendingArchive(null);setMessage('Herstel geannuleerd. Eigen invoer behouden.');
          }}>Nee, behoud mijn huidige inventaris</button>
        </div>}
      </div>
      <div className="month-csv-confirm">
        <h3>Bewaar eventueel je eigen overzicht</h3>
        <button type="button" onClick={makePreview} disabled={!safeTotal}>
          Toon privé-TXT eerst ter controle…
        </button>
        {preview!==null&&<div role="group" aria-label="Bevestig eigen verhuisoverzicht">
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{preview}</pre>
          <button type="button" onClick={download}>
            Ja, bewaar alleen dit eigen TXT…
          </button>
          <button type="button" className="secondary" onClick={()=>{
            setPreview(null);setMessage('Export geannuleerd. Geen bestand gemaakt.');
          }}>Nee, maak geen bestand</button>
        </div>}
      </div>
      <button type="button" className="secondary" onClick={()=>{
        setItems(initial.map(row=>({...row})));setMargin('15');setCapacity('10');
        setBudget(budgetDefaults);setBudgetReport(null);
        setPackedCounts({});setPackPreview(null);
        setPreview(null);setMessage('Eigen invoer gewist; fictieve voorbeelden hersteld.');
      }}>Wis mijn invoer en herstel voorbeelden</button>
      <p role="status">{message}</p>
      <p>Geen browseropslag, externe data, upload of automatisch overzicht:
        de eigen berekening verdwijnt bij verversen/sluiten. Dit wijzigt geen
        WoningNet-account, woningreactie, verhuisafspraak of andere Woonpoints-sectie.</p>
    </div>
  </section>;
}


// Private moving-day planning: all user state remains tab-local; no portal action.

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

export function PrivateMovingDayTimeline() {
  const [moveDate, setMoveDate] = useState('');
  const [completed, setCompleted] = useState<string[]>([]);
  const [extras, setExtras] = useState<ExtraTask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newOffset, setNewOffset] = useState('-7');
  const [pending, setPending] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{ moveDate: string; completed: string[]; extras: ExtraTask[] } | null>(null);
  const [message, setMessage] = useState('');
  useEffect(()=>{
    const publish=()=>window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:snapshot',{
      detail:{version:1,section:'timeline',data:{moveDate,completed,extras}}
    }));
    window.addEventListener('woonpoints:moving-workspace:request',publish);
    publish();
    return()=>window.removeEventListener('woonpoints:moving-workspace:request',publish);
  },[moveDate,completed,extras]);
  useEffect(()=>{
    function restore(event:Event){
      const archive=(event as CustomEvent<unknown>).detail;
      if(!validMovingWorkspaceArchive(archive)||archive.version===1)return;
      setMoveDate(archive.timeline.moveDate);setCompleted(archive.timeline.completed);setExtras(archive.timeline.extras);setNewTask('');setNewOffset('-7');setPending(null);setPendingRestore(null);
      setMessage('De planning is uit de privé-werkmap hersteld na je bevestiging.');
    }
    window.addEventListener('woonpoints:moving-workspace:restore',restore);
    return()=>window.removeEventListener('woonpoints:moving-workspace:restore',restore);
  },[]);


  const dateValid = dateOnly(moveDate) !== null;
  const tasks = [...DEFAULT_TASKS, ...extras]
    .map(task => ({ ...task, due: dayAtOffset(moveDate, task.offset), done: completed.includes(task.id) }))
    .sort((a, b) => a.offset - b.offset || a.title.localeCompare(b.title, 'nl-NL'));
  const openTasks = tasks.filter(task => !task.done);
  const snapshot = JSON.stringify({ moveDate, completed, extras });
  const ready = dateValid && openTasks.length > 0;

  function edit() { setPending(null); setPendingRestore(null); setMessage(''); }
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
  function downloadBackup() {
    const payload = JSON.stringify({
      format: 'woonpoints-private-moving-plan', version: 1, moveDate, completed,
      extras: extras.map(({ id, title, offset }) => ({ id, title, offset }))
    }, null, 2);
    exportFile('woonpoints-prive-verhuisplan.json', payload, 'application/json;charset=utf-8');
    setMessage('Privé-JSON lokaal aangeboden. Je gekozen opslaglocatie kan synchroniseren.');
  }
  async function importBackup(file: File | undefined) {
    setPendingRestore(null);
    setPending(null);
    if (!file) return;
    if (!file.size || file.size > 12288) {
      setMessage('JSON geweigerd: bestand is leeg of groter dan 12 KB.');
      return;
    }
    try {
      const raw: unknown = JSON.parse(await file.text());
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('format');
      const value = raw as Record<string, unknown>;
      if (value.format !== 'woonpoints-private-moving-plan' || value.version !== 1) throw new Error('version');
      if (typeof value.moveDate !== 'string' || (value.moveDate && !dateOnly(value.moveDate))) throw new Error('date');
      if (!Array.isArray(value.extras) || value.extras.length > 6) throw new Error('extras');
      const restored: ExtraTask[] = value.extras.map(item => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('task');
        const data = item as Record<string, unknown>;
        if (typeof data.id !== 'string' || !/^extra-[0-9]+-[0-9]+$/.test(data.id) ||
            typeof data.title !== 'string' || data.title !== data.title.trim() ||
            !data.title.trim() || data.title.length > 60 || /[\\u0000-\\u001f\\u007f]/.test(data.title) ||
            typeof data.offset !== 'number' || !Number.isInteger(data.offset) || data.offset < -120 || data.offset > 60)
          throw new Error('task');
        return { id: data.id, title: data.title, offset: data.offset as number, group: 'Eigen taak' as const };
      });
      if (!Array.isArray(value.completed) || value.completed.length > 15 ||
          !value.completed.every(item => typeof item === 'string')) throw new Error('checked');
      const taskIds = new Set([...DEFAULT_TASKS.map(task => task.id), ...restored.map(task => task.id)]);
      const checked = value.completed as string[];
      if (taskIds.size !== DEFAULT_TASKS.length + restored.length ||
          new Set(checked).size !== checked.length || checked.some(id => !taskIds.has(id))) throw new Error('ids');
      setPendingRestore({ moveDate: value.moveDate, completed: checked, extras: restored });
      setMessage('Back-up gecontroleerd. Bevestig zelf voordat je huidige privéplanning wordt vervangen.');
    } catch {
      setMessage('JSON geweigerd: versie, datums of taken zijn ongeldig. Huidige planning is behouden.');
    }
  }

  function downloadCalendar() {
    if (!ready || pending !== snapshot) { setPending(null); setMessage('De planning is gewijzigd. Bekijk eerst opnieuw de agenda-export.'); return; }
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const entries = openTasks.map(task => {
      const end = dayAtOffset(moveDate, task.offset + 1);
      return [
        'BEGIN:VEVENT',
        `DTSTAMP:${stamp}`,
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
      <div>
        <button type="button" onClick={downloadBackup} disabled={!dateValid && !completed.length && !extras.length}>
          Bewaar privéplanning als JSON…
        </button>
        <label htmlFor="moving-day-restore">Herstel eerder bewaarde privéplanning (JSON, max. 12 KB)</label>
        <input id="moving-day-restore" type="file" accept=".json,application/json"
          onChange={event => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            void importBackup(file);
          }} />
        {pendingRestore && <div role="group" aria-label="Bevestig privéplanning herstel">
          <p>Back-up bevat {pendingRestore.extras.length} eigen taken en {pendingRestore.completed.length}
            afgevinkte acties. Herstellen <strong>vervangt het hele huidige verhuisplan in dit tabblad</strong>.
            De back-up is niet gecontroleerd bij WoningNet.</p>
          <button type="button" onClick={() => {
            setMoveDate(pendingRestore.moveDate);
            setCompleted(pendingRestore.completed);
            setExtras(pendingRestore.extras);
            setPendingRestore(null); setPending(null);
            setMessage('Privéplanning hersteld. Geen account- of broncontrole uitgevoerd.');
          }}>Bevestig vervanging</button>
          <button type="button" onClick={() => {
            setPendingRestore(null); setMessage('Herstel geannuleerd, huidige planning behouden.');
          }}>Annuleren</button>
        </div>}
      </div>
      <p>Geen automatische meldingen, cloudopslag of koppeling met WoningNet. De agenda-export
        bevat ook je zelf getypte actienamen: deel het bestand alleen bewust.</p>
      {ready && pending !== snapshot && <button type="button" onClick={() => {
        setPending(snapshot); setMessage('');
      }}>Bekijk agenda-export voor {openTasks.length} open acties…</button>}
      {ready && pending === snapshot && <div role="group" aria-label="Bevestig privé-agenda-export">
        <p><strong>{openTasks.length} open acties</strong> worden als dagvullende agendapunten
          geëxporteerd, inclusief je eigen tekst. Afgevinkte acties worden overgeslagen.</p>
        <ul>{openTasks.map(task => <li key={task.id}>{task.due} · {task.title}</li>)}</ul>
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


/** User-entered move-in/out handover notes only, not a verified inspection or legal receipt. */
type PrivateHandoverEntry = {
  day: string; property: string; keys: number;
  electricity: string; gas: string; water: string; remarks: string;
};
type PrivateHandoverForm = {
  day: string; property: string; keys: string;
  electricity: string; gas: string; water: string; remarks: string;
};
const handoverEmpty = (): PrivateHandoverForm => ({
  day: '', property: '', keys: '', electricity: '', gas: '', water: '', remarks: ''
});
function handoverMeter(raw: string): string | null {
  const clean = raw.trim().replace(',', '.');
  return clean === '' ? '' : /^\\d{1,7}(\\.\\d{1,3})?$/.test(clean) ? clean : null;
}
function handoverNumber(value: string): number { return Number(value); }

export function PrivateMovingHandover() {
  const [stage, setStage] = useState<'in' | 'out'>('in');
  const [form, setForm] = useState<PrivateHandoverForm>(handoverEmpty);
  const [entries, setEntries] = useState<{in?: PrivateHandoverEntry; out?: PrivateHandoverEntry}>({});
  const [pendingSave, setPendingSave] = useState<{stage:'in'|'out'; entry:PrivateHandoverEntry} | null>(null);
  const [pendingExport, setPendingExport] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(()=>{
    const publish=()=>window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:snapshot',{
      detail:{version:1,section:'handover',data:{entries}}
    }));
    window.addEventListener('woonpoints:moving-workspace:request',publish);
    publish();
    return()=>window.removeEventListener('woonpoints:moving-workspace:request',publish);
  },[entries]);
  useEffect(()=>{
    function restore(event:Event){
      const archive=(event as CustomEvent<unknown>).detail;
      if(!validMovingWorkspaceArchive(archive)||archive.version===1)return;
      setEntries(archive.handover.entries);setStage('in');setForm(handoverEmpty());setPendingSave(null);setPendingExport(null);setConfirmClear(false);
      setNotice('Sleutel- en meteropnamen zijn uit de privé-werkmap hersteld.');
    }
    window.addEventListener('woonpoints:moving-workspace:restore',restore);
    return()=>window.removeEventListener('woonpoints:moving-workspace:restore',restore);
  },[]);


  function change<K extends keyof PrivateHandoverForm>(name:K, value:PrivateHandoverForm[K]) {
    setForm(old => ({...old, [name]:value}));
    setPendingSave(null); setPendingExport(null); setNotice('');
  }
  function selectStage(next:'in'|'out') {
    setStage(next); setPendingSave(null); setPendingExport(null);
    setForm(handoverEmpty());
    setNotice('Formulier gewisseld. Opgeslagen opnamen blijven binnen dit tabblad beschikbaar.');
  }
  function candidate():PrivateHandoverEntry | null {
    const meters = [handoverMeter(form.electricity),handoverMeter(form.gas),handoverMeter(form.water)];
    if (!dateOnly(form.day) || form.property.trim().length > 70 ||
        !/^\\d{1,2}$/.test(form.keys) || Number(form.keys) > 99 ||
        meters.some(value => value === null) || form.remarks.length > 900) return null;
    if (form.property && /[\\u0000-\\u001f\\u007f]/.test(form.property)) return null;
    return {
      day:form.day, property:form.property.trim(), keys:Number(form.keys),
      electricity:meters[0]!, gas:meters[1]!, water:meters[2]!, remarks:form.remarks
    };
  }
  function saveEntry() {
    const entry=candidate();
    if(!entry) {setNotice('Opname niet bewaard: controleer datum, 0–99 sleutels en optionele meterstanden (max. drie decimalen).');return;}
    if(entries[stage]) { setPendingSave({stage,entry}); setNotice('Er bestaat al een opname voor dit moment. Bevestig eerst het vervangen.');return;}
    setEntries(old=>({...old,[stage]:entry}));setNotice('Opname alleen in dit tabblad vastgelegd. Geen externe controle of handtekening.');
    setPendingExport(null);
  }
  const slots = [entries.in,entries.out];
  const draft = slots.map((entry,index)=>{
    if(!entry) return '';
    const title = index===0?'Sleutelontvangst':'Sleuteloverdracht';
    return [title, `Datum: ${entry.day}`,`Woning (eigen omschrijving): ${entry.property || 'niet ingevuld'}`,
      `Sleutels: ${entry.keys}`,`Elektriciteit (kWh): ${entry.electricity || 'niet ingevuld'}`,
      `Gas (m³): ${entry.gas || 'niet ingevuld'}`,`Water (m³): ${entry.water || 'niet ingevuld'}`,
      `Eigen opmerkingen: ${entry.remarks || 'geen'}`].join('\\n');
  }).filter(Boolean).join('\\n\\n');
  const report = 'Woonpoints · privé sleuteloverdrachtsnotities\\nAlle waarden zijn eigen invoer. Geen officiële meterstand, inspectie, handtekening of ontvangstbewijs.\\n\\n'+draft+'\\n';
  const reportToken=JSON.stringify(entries);
  const meterLabels: [('electricity'|'gas'|'water'), string][] = [
    ['electricity','Elektriciteit (kWh)'],['gas','Gas (m³)'],['water','Water (m³)']
  ];
  return (
    <section className="panel" aria-labelledby="private-handover-heading">
      <p className="eyebrow">VERHUIZEN · EIGEN INVOER · GEEN ACCOUNTKOPPELING</p>
      <h2 id="private-handover-heading">Sleutels en meterstanden bijhouden</h2>
      <p>Maak zelf een begin- en eindopname. Dit hulpmiddel legt geen officiële oplevering,
        meterregistratie, handtekening of akkoord van verhuurder vast. Bewaar echte bewijsstukken apart.</p>
      <div role="group" aria-label="Kies opnamemoment">
        <button type="button" aria-pressed={stage==='in'} onClick={()=>selectStage('in')}>Sleutelontvangst</button>
        <button type="button" aria-pressed={stage==='out'} onClick={()=>selectStage('out')}>Sleuteloverdracht</button>
      </div>
      <fieldset>
        <legend>{stage==='in'?'Beginopname':'Eindopname'} – eigen formulier</legend>
        <label htmlFor="handover-date">Datum opname</label>
        <input id="handover-date" type="date" min="2000-01-01" max="2099-12-31" value={form.day}
          onChange={event=>change('day',event.target.value)} />
        <label htmlFor="handover-house">Eigen naam van woning (optioneel, max. 70 tekens)</label>
        <input id="handover-house" maxLength={70} value={form.property} autoComplete="off"
          onChange={event=>change('property',event.target.value)} />
        <label htmlFor="handover-keys">Aantal ontvangen of afgegeven sleutels (0–99)</label>
        <input id="handover-keys" type="number" min={0} max={99} step={1} value={form.keys}
          onChange={event=>change('keys',event.target.value)} />
        {(['electricity','gas','water'] as const).map((key)=>(
          <div key={key}>
            <label htmlFor={`handover-${key}`}>{meterLabels.find(([name])=>name===key)?.[1]} (optioneel)</label>
            <input id={`handover-${key}`} type="text" inputMode="decimal" maxLength={12}
              value={form[key]} placeholder="Bijv. 1234,500"
              onChange={event=>change(key,event.target.value)} />
          </div>
        ))}
        <label htmlFor="handover-remarks">Eigen notities of openstaande punten (maximaal 900 tekens)</label>
        <textarea id="handover-remarks" rows={4} maxLength={900} value={form.remarks}
          onChange={event=>change('remarks',event.target.value)} />
        <button type="button" onClick={saveEntry}>Bewaar eigen {stage==='in'?'beginopname':'eindopname'}</button>
        {pendingSave && pendingSave.stage===stage && <div role="group" aria-label="Bevestig opname vervangen">
          <p>Deze opname vervangt de eerdere {stage==='in'?'begin':'eind'}stand in dit tabblad.
            De andere opname blijft staan.</p>
          <button type="button" onClick={()=>{
            setEntries(old=>({...old,[stage]:pendingSave.entry}));
            setPendingSave(null);setPendingExport(null);setNotice('Opname vervangen, alleen in dit tabblad.');
          }}>Bevestig vervanging</button>
          <button type="button" onClick={()=>setPendingSave(null)}>Annuleren</button>
        </div>}
      </fieldset>
      <h3>Eigen vastgelegde opnamen</h3>
      <ul>
        {(['in','out'] as const).map(key=>(
          <li key={key}>
            <strong>{key==='in'?'Ontvangst':'Overdracht'}:</strong>{' '}
            {entries[key] ? `${entries[key]!.day} · ${entries[key]!.keys} sleutels` : 'nog niet ingevuld'}
          </li>
        ))}
      </ul>
      {entries.in && entries.out && <div>
        <h3>Verschil tussen je twee invoeren</h3>
        <p>Sleutels: {entries.out.keys-entries.in.keys>=0?'+':''}{entries.out.keys-entries.in.keys}.
          Dit is geen bevestiging dat alle sleutels daadwerkelijk zijn overgedragen.</p>
        <ul>{meterLabels.map(([key,label])=>{
          const before=entries.in?.[key]; const after=entries.out?.[key];
          const delta=before && after ? handoverNumber(after)-handoverNumber(before):null;
          return <li key={key}>{label}: {delta===null?'onbekend (waarde ontbreekt)':
            `${delta>=0?'+':''}${new Intl.NumberFormat('nl-NL',{maximumFractionDigits:3}).format(delta)}`}</li>;
        })}</ul>
        <p>Verschillen zijn eenvoudige rekenkundige aftrekkingen, geen gecontroleerd verbruik of factuur.</p>
      </div>}
      {!!draft && pendingExport!==reportToken && <button type="button" onClick={()=>{
        setPendingExport(reportToken);setNotice('');
      }}>Bekijk privé-TXT voordat je exporteert…</button>}
      {!!draft && pendingExport===reportToken && <div role="group" aria-label="Bevestig privéoverdrachtsrapport">
        <p>Controleer onderstaande exacte tekst. De download bevat je zelf ingevulde woningnaam en opmerkingen.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre>
        <button type="button" onClick={()=>{
          if(pendingExport!==JSON.stringify(entries))return;
          const url=URL.createObjectURL(new Blob([report],{type:'text/plain;charset=utf-8'}));
          const link=document.createElement('a');link.href=url;link.download='woonpoints-prive-sleutelrapport.txt';
          document.body.appendChild(link);link.click();link.remove();
          window.setTimeout(()=>URL.revokeObjectURL(url),2000);
          setPendingExport(null);setNotice('Tekstbestand op eigen verzoek aangeboden; een opslaglocatie kan synchroniseren.');
        }}>Bevestig eigen TXT-download</button>
        <button type="button" onClick={()=>setPendingExport(null)}>Annuleren</button>
      </div>}
      {!!draft && !confirmClear && <button type="button" onClick={()=>setConfirmClear(true)}>
        Wis beide opnamen…
      </button>}
      {confirmClear && <div role="group" aria-label="Bevestig verwijderen van privé-opnamen">
        <p>Dit wist beide opnamen definitief uit dit tabblad. Maak zelf eerst een export als je ze wilt bewaren.</p>
        <button type="button" onClick={()=>{
          setEntries({});setForm(handoverEmpty());setPendingSave(null);setPendingExport(null);
          setConfirmClear(false);setNotice('Beide opnamen uit dit tabblad gewist.');
        }}>Bevestig wissen</button>
        <button type="button" onClick={()=>setConfirmClear(false)}>Annuleren</button>
      </div>}
      {notice && <p role="status">{notice}</p>}
      <p>Deze gegevens worden niet geüpload of automatisch bewaard. Bij sluiten van het tabblad
        verlies je de invoer. Exporteer bewust en deel persoonlijke notities niet onbedoeld.</p>
    </section>
  );
}


/** Optional tenant's own document-readiness tracker; titles/status only, no document files. */
type ReadinessState='needed'|'ready'|'skip';
type ReadinessDoc={id:string;title:string};
type ReadinessBackup={extras:ReadinessDoc[];states:Record<string,ReadinessState>;dates:Record<string,string>};
const READINESS_DEFAULTS:ReadinessDoc[]=[
  {id:'rental',title:'Zelf huurafspraken of huuraanbod nalopen'},
  {id:'identity',title:'Zelf controleren hoe identiteit veilig getoond moet worden'},
  {id:'income',title:'Zelf nagaan of inkomensstukken gevraagd zijn'},
  {id:'current',title:'Zelf vorige huur- of adreszaken controleren'},
  {id:'utilities',title:'Zelf contracten voor water, energie en internet nalopen'},
  {id:'insurance',title:'Zelf verzekeringen bij verhuizing controleren'},
  {id:'handover',title:'Zelf sleutel- of opleverafspraak nalopen'},
  {id:'municipality',title:'Zelf nagaan welke adreswijziging nodig is'}
];

export function PrivateMoveDocumentReadiness(){
  const [extras,setExtras]=useState<ReadinessDoc[]>([]);
  const [states,setStates]=useState<Record<string,ReadinessState>>({});
  const [dates,setDates]=useState<Record<string,string>>({});
  const [title,setTitle]=useState('');
  const [pendingBackup,setPendingBackup]=useState<ReadinessBackup|null>(null);
  const [pendingReport,setPendingReport]=useState<string|null>(null);
  const [pendingClear,setPendingClear]=useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    const publish=()=>window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:snapshot',{
      detail:{version:1,section:'documents',data:{extras,states,dates}}
    }));
    window.addEventListener('woonpoints:moving-workspace:request',publish);
    publish();
    return()=>window.removeEventListener('woonpoints:moving-workspace:request',publish);
  },[extras,states,dates]);
  useEffect(()=>{
    function restore(event:Event){
      const archive=(event as CustomEvent<unknown>).detail;
      if(!validMovingWorkspaceArchive(archive)||archive.version===1)return;
      setExtras(archive.documents.extras);setStates(archive.documents.states);setDates(archive.documents.dates);setTitle('');setPendingBackup(null);setPendingReport(null);setPendingClear(false);
      setNotice('Documentstatussen zijn uit de privé-werkmap hersteld.');
    }
    window.addEventListener('woonpoints:moving-workspace:restore',restore);
    return()=>window.removeEventListener('woonpoints:moving-workspace:restore',restore);
  },[]);

  const docs=[...READINESS_DEFAULTS,...extras];
  const actionable=docs.filter(item=>(states[item.id]||'needed')!=='skip');
  const ready=actionable.filter(item=>states[item.id]==='ready').length;
  const report= [
    'Woonpoints · Eigen documentenchecklist',
    'Alleen persoonlijke herinneringen. Geen officiële portaal-, huur- of identiteitscontrole.',
    ...docs.map(item=>{
      const label=states[item.id]==='ready'?'Zelf afgevinkt':states[item.id]==='skip'?'Niet van toepassing':'Nog na te gaan';
      return `${item.title} — ${label}${dates[item.id]?` — Eigen datum: ${dates[item.id]}`:''}`;
    }), 'Geen documentinhoud, bestanden of geverifieerde rechten opgenomen.'
  ].join('\\n')+'\\n';
  const receipt=JSON.stringify({extras,states,dates});
  function changed(){setPendingReport(null);setPendingBackup(null);setNotice('');setPendingClear(false);}
  function add(){
    const next=title.trim().replace(/[\\u0000-\\u001f\\u007f]/g,' ');
    if(!next || next.length>60 || extras.length>=8){
      setNotice('Eigen regel niet toegevoegd: gebruik maximaal acht extra regels van 60 tekens.');
      return;
    }
    setExtras(old=>[...old,{id:`custom-${Date.now()}-${old.length}`,title:next}]);
    setTitle('');changed();
  }
  async function readBackup(file:File|undefined){
    setPendingBackup(null);setPendingReport(null);
    if(!file)return;
    if(file.size===0||file.size>8192){setNotice('Back-up geweigerd: maximaal 8 KiB.');return;}
    try{
      const raw:unknown=JSON.parse(await file.text());
      if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('format');
      const data=raw as Record<string,unknown>;
      if(data.format!=='woonpoints-document-readiness'||data.version!==1 ||
        !Array.isArray(data.extras)||data.extras.length>8 ||
        !data.states||typeof data.states!=='object'||Array.isArray(data.states)||
        !data.dates||typeof data.dates!=='object'||Array.isArray(data.dates))throw Error('schema');
      const restored:ReadinessDoc[]=data.extras.map(item=>{
        if(!item||typeof item!=='object'||Array.isArray(item))throw Error('doc');
        const obj=item as Record<string,unknown>;
        if(typeof obj.id!=='string'||!/^custom-[0-9]+-[0-9]+$/.test(obj.id)||
          typeof obj.title!=='string'||!obj.title.trim()||obj.title!==obj.title.trim()||
          obj.title.length>60||/[\\u0000-\\u001f\\u007f]/.test(obj.title))throw Error('doc');
        return {id:obj.id,title:obj.title};
      });
      const ids=[...READINESS_DEFAULTS,...restored].map(doc=>doc.id);
      const allowed=new Set(ids);
      if(allowed.size!==ids.length)throw Error('duplicates');
      const rs=data.states as Record<string,unknown>,ds=data.dates as Record<string,unknown>;
      if(Object.keys(rs).length>16||Object.keys(ds).length>16 ||
        Object.keys(rs).some(key=>!allowed.has(key)||!['needed','ready','skip'].includes(String(rs[key])))||
        Object.keys(ds).some(key=>!allowed.has(key)||typeof ds[key]!=='string'||
          (ds[key]!==''&&!dateOnly(ds[key] as string))))throw Error('values');
      setPendingBackup({extras:restored,states:rs as Record<string,ReadinessState>,dates:ds as Record<string,string>});
      setNotice('Privé-JSON gecontroleerd. Huidige documentenstatus blijft behouden tot je vervangen bevestigt.');
    }catch{
      setNotice('Back-up geweigerd: ongeldige versie, status of datum. Huidig overzicht behouden.');
    }
  }
  return(
    <section className="panel" aria-labelledby="private-document-readiness-heading">
      <p className="eyebrow">WONINGDOSSIER · ALLEEN JE EIGEN CHECKLIST</p>
      <h2 id="private-document-readiness-heading">Wat moet je zelf nog regelen?</h2>
      <p>Een privé-overzicht om te onthouden welke stukken of afspraken je zelf nog moet nagaan.
        Dit zijn suggesties, geen officiële verplichtingen van WoningNet of verhuurder.
        Voer geen burgerservicenummer, wachtwoord, identiteitsbewijs of documentinhoud in.</p>
      <p aria-live="polite"><strong>{ready} van {actionable.length}</strong> toepasselijke regels door jou afgevinkt.
        {docs.length-actionable.length} gemarkeerd als niet van toepassing.</p>
      <ul>
        {docs.map(doc=><li key={doc.id}>
          <strong>{doc.title}</strong>
          <label htmlFor={`document-state-${doc.id}`}>Eigen status</label>
          <select id={`document-state-${doc.id}`} value={states[doc.id]||'needed'} onChange={event=>{
            setStates(old=>({...old,[doc.id]:event.target.value as ReadinessState}));changed();
          }}>
            <option value="needed">Nog na te gaan</option>
            <option value="ready">Door mij gecontroleerd</option>
            <option value="skip">Niet van toepassing</option>
          </select>
          <label htmlFor={`document-due-${doc.id}`}>Zelf gekozen datum (optioneel)</label>
          <input id={`document-due-${doc.id}`} type="date" min="2000-01-01" max="2099-12-31"
            value={dates[doc.id]||''} onChange={event=>{
              setDates(old=>({...old,[doc.id]:event.target.value}));changed();
            }} />
          {doc.id.startsWith('custom-') && <button type="button" onClick={()=>{
            setExtras(old=>old.filter(x=>x.id!==doc.id));
            setStates(old=>{const copy={...old};delete copy[doc.id];return copy;});
            setDates(old=>{const copy={...old};delete copy[doc.id];return copy;});
            changed();
          }}>Verwijder eigen regel</button>}
        </li>)}
      </ul>
      <fieldset>
        <legend>Zelf extra regel toevoegen (maximaal acht)</legend>
        <label htmlFor="document-extra">Alleen korte omschrijving (max. 60 tekens)</label>
        <input id="document-extra" type="text" autoComplete="off" maxLength={60}
          value={title} onChange={event=>setTitle(event.target.value)} />
        <button type="button" onClick={add} disabled={extras.length>=8}>Voeg regel toe</button>
      </fieldset>
      <div>
        <button type="button" onClick={()=>{
          const data=JSON.stringify({format:'woonpoints-document-readiness',version:1,extras,states,dates},null,2);
          exportFile('woonpoints-prive-documentenoverzicht.json',data,'application/json;charset=utf-8');
          setNotice('Privé-JSON op eigen verzoek aangeboden; een opslaglocatie kan synchroniseren.');
        }}>Bewaar eigen status als privé-JSON…</button>
        <label htmlFor="document-backup-upload">Lees eerder bewaard statusbestand in (JSON, max. 8 KiB)</label>
        <input id="document-backup-upload" type="file" accept=".json,application/json"
          onChange={event=>{
            const file=event.currentTarget.files?.[0];
            event.currentTarget.value='';
            void readBackup(file);
          }} />
        {pendingBackup && <div role="group" aria-label="Bevestig documentenoverzicht herstel">
          <p>De geldige privé-back-up bevat {pendingBackup.extras.length} eigen regels.
            Herstellen vervangt al je huidige statussen en datums in dit tabblad.</p>
          <button type="button" onClick={()=>{
            setExtras(pendingBackup.extras);setStates(pendingBackup.states);setDates(pendingBackup.dates);
            setPendingBackup(null);setPendingReport(null);setNotice('Eigen status hersteld, niet extern geverifieerd.');
          }}>Bevestig vervanging</button>
          <button type="button" onClick={()=>setPendingBackup(null)}>Annuleren</button>
        </div>}
      </div>
      {pendingReport!==receipt && <button type="button" onClick={()=>{setPendingReport(receipt);setNotice('');}}>
        Bekijk TXT-overzicht voor privé-export…
      </button>}
      {pendingReport===receipt && <div role="group" aria-label="Bevestig documentenoverzicht export">
        <p>Dit is de exacte tekst voor het lokaal te bewaren bestand.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre>
        <button type="button" onClick={()=>{
          if(pendingReport!==JSON.stringify({extras,states,dates}))return;
          exportFile('woonpoints-prive-documentenoverzicht.txt',report,'text/plain;charset=utf-8');
          setPendingReport(null);setNotice('TXT lokaal aangeboden na bevestiging.');
        }}>Bevestig TXT-download</button>
        <button type="button" onClick={()=>setPendingReport(null)}>Annuleren</button>
      </div>}
      {!pendingClear && <button type="button" onClick={()=>setPendingClear(true)}>Wis alle eigen statussen…</button>}
      {pendingClear && <div role="group" aria-label="Bevestig wissen documentstatus">
        <p>Hiermee verwijder je alle eigen statussen, datums en extra regels uit dit tabblad.</p>
        <button type="button" onClick={()=>{
          setExtras([]);setStates({});setDates({});setTitle('');changed();
          setNotice('Eigen checklist teruggezet naar leeg startoverzicht.');
        }}>Bevestig wissen</button>
        <button type="button" onClick={()=>setPendingClear(false)}>Annuleren</button>
      </div>}
      {notice && <p role="status">{notice}</p>}
      <p>Alleen titel, status en eigen datum; nooit een bestand, identiteit of woningaccount.
        Zonder expliciete export verdwijnen de gegevens bij sluiten van dit tabblad.</p>
    </section>
  );
}


type MovingExpenseCategory = 'Vervoer' | 'Hulp' | 'Verpakkingen' | 'Diensten' | 'Overig';
type MovingExpenseLine = {
  id: string; label: string; category: MovingExpenseCategory;
  plannedCents: number; actualCents: number | null; paid: boolean;
};
const EXPENSE_CATEGORIES: MovingExpenseCategory[] = ['Vervoer','Hulp','Verpakkingen','Diensten','Overig'];
const emptyExpenseForm = () => ({
  label:'',category:'Vervoer' as MovingExpenseCategory, planned:'',actual:'',paid:false
});
function expenseCents(value:string):number|null {
  const normalized=value.trim().replace(',','.');
  if(!/^(?:0|[1-9]\d{0,4})(?:\.\d{1,2})?$/.test(normalized))return null;
  const [whole,decimal='']=normalized.split('.');
  const cents=Number(whole)*100+Number(decimal.padEnd(2,'0'));
  return Number.isSafeInteger(cents)&&cents<=9999999?cents:null;
}
function expenseAmount(cents:number):string {
  return new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(cents/100);
}
function expenseFormAmount(cents:number|null):string {
  if(cents===null)return '';
  return (cents/100).toFixed(2).replace('.',',');
}
function validExpenseLine(raw:unknown):raw is MovingExpenseLine {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const item=raw as Record<string,unknown>;
  return Object.keys(item).length===6 &&
    typeof item.id==='string' && /^move-exp-[0-9]+-[0-9]+$/.test(item.id) &&
    typeof item.label==='string' && item.label.length>0&&item.label.length<=70 &&
    item.label.trim()===item.label&&!/[\u0000-\u001f\u007f]/.test(item.label) &&
    EXPENSE_CATEGORIES.includes(item.category as MovingExpenseCategory) &&
    typeof item.plannedCents==='number' && Number.isSafeInteger(item.plannedCents) &&
    item.plannedCents>=0&&item.plannedCents<=9999999 &&
    (item.actualCents===null||(typeof item.actualCents==='number' &&
      Number.isSafeInteger(item.actualCents)&&item.actualCents>=0&&item.actualCents<=9999999)) &&
    typeof item.paid==='boolean'&&(!item.paid||item.actualCents!==null);
}

/** All figures are private user-entered estimates and payments, never financial or portal evidence. */
export function PrivateMovingExpenseLedger(){
  const [lines,setLines]=useState<MovingExpenseLine[]>([]);
  const [pendingBudget,setPendingBudget]=useState<MovingExpenseLine[]|null>(null);
  useEffect(()=>{
    function onBudget(event:Event){
      const raw=(event as CustomEvent<unknown>).detail;
      if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
      const data=raw as Record<string,unknown>;
      const count=data.format==='woonpoints-moving-budget-offer'?5:
        data.format==='woonpoints-moving-quote-offer'?1:0;
      if(data.version!==1||!Array.isArray(data.offer)||data.offer.length!==count||!count)return;
      const valid=data.offer.every(item=>{
        if(!item||typeof item!=='object'||Array.isArray(item))return false;
        const line=item as Record<string,unknown>;
        return typeof line.label==='string'&&line.label.length>0&&line.label.length<=70&&
          !/[\u0000-\u001f\u007f]/.test(line.label)&&
          EXPENSE_CATEGORIES.includes(line.category as MovingExpenseCategory)&&
          typeof line.plannedCents==='number'&&Number.isSafeInteger(line.plannedCents)&&
          line.plannedCents>=0&&line.plannedCents<=9999999;
      });
      if(!valid)return;
      const dataLines:MovingExpenseLine[]=data.offer.map((item,index)=>{
        const line=item as {label:string;category:MovingExpenseCategory;plannedCents:number};
        return {id:'move-exp-'+Date.now()+'-'+index,label:line.label,category:line.category,
          plannedCents:line.plannedCents,actualCents:null,paid:false};
      });
      setPendingBudget(dataLines);setNotice('Bekijk de aangeboden ramingsposten en bevestig apart voordat je ze toevoegt.');
    }
    window.addEventListener('woonpoints:moving-budget-offer',onBudget);
    return()=>window.removeEventListener('woonpoints:moving-budget-offer',onBudget);
  },[]);

  const [form,setForm]=useState(emptyExpenseForm);
  const [editing,setEditing]=useState<string|null>(null);
  const [pendingDelete,setPendingDelete]=useState<string|null>(null);
  const [pendingRestore,setPendingRestore]=useState<MovingExpenseLine[]|null>(null);
  const [pendingReport,setPendingReport]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    const publish=()=>window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:snapshot',{
      detail:{version:1,section:'expenses',data:{lines}}
    }));
    window.addEventListener('woonpoints:moving-workspace:request',publish);
    publish();
    return()=>window.removeEventListener('woonpoints:moving-workspace:request',publish);
  },[lines]);
  useEffect(()=>{
    function restore(event:Event){
      const archive=(event as CustomEvent<unknown>).detail;
      if(!validMovingWorkspaceArchive(archive))return;
      setLines(archive.expenses.lines);setEditing(null);setForm(emptyExpenseForm());setPendingBudget(null);setPendingDelete(null);setPendingRestore(null);setPendingReport(null);setClearPending(false);
      setNotice('Dit privé-onderdeel is na expliciete bevestiging vanuit de werkmap hersteld.');
    }
    window.addEventListener('woonpoints:moving-workspace:restore',restore);
    return()=>window.removeEventListener('woonpoints:moving-workspace:restore',restore);
  },[]);

  const [clearPending,setClearPending]=useState(false);
  const planned=lines.reduce((sum,line)=>sum+line.plannedCents,0);
  const actualKnown=lines.reduce((sum,line)=>sum+(line.actualCents??0),0);
  const paidKnown=lines.reduce((sum,line)=>sum+(line.paid?line.actualCents??0:0),0);
  const matchedPlanned=lines.reduce((sum,line)=>sum+(line.actualCents!==null?line.plannedCents:0),0);
  const outstanding=lines.filter(line=>line.actualCents===null).length;
  const recorded=lines.filter(line=>line.actualCents!==null).length;
  const snapshot=JSON.stringify(lines);
  const report=[
    'Woonpoints · privé verhuiskostenadministratie',
    'Alle bedragen zijn eigen invoer en geen boekhouding, offerte of geverifieerde betaling.',
    ...lines.map(line=>
      `${line.category} | ${line.label} | Begroot ${expenseAmount(line.plannedCents)} | `+
      `Werkelijk ${line.actualCents===null?'onbekend':expenseAmount(line.actualCents)} | `+
      (line.paid?'Door mij als betaald gemarkeerd':'Niet als betaald gemarkeerd')),
    '',
    `Begroot totaal: ${expenseAmount(planned)}`,
    `Bekend werkelijk: ${expenseAmount(actualKnown)} (${recorded} van ${lines.length} posten)`,
    `Nog zonder werkelijk bedrag: ${outstanding}`,
    `Afwijking voor posten met beide bedragen: ${expenseAmount(actualKnown-matchedPlanned)}`,
    `Door mij als betaald gemarkeerd: ${expenseAmount(paidKnown)}`,
    'Er worden geen facturen, transacties, betaalbewijzen of accountgegevens opgehaald.'
  ].join('\n')+'\n';
  function invalidate(){
    setPendingReport(null);setPendingRestore(null);setPendingDelete(null);setPendingBudget(null);
    setNotice('');setClearPending(false);
  }
  function submit(){
    const name=form.label.trim().replace(/[\u0000-\u001f\u007f]/g,' ');
    const plan=expenseCents(form.planned);
    const actual=form.actual.trim()?expenseCents(form.actual):null;
    if(!name||name.length>70||plan===null||(form.actual.trim()&&actual===null)||
      (form.paid&&actual===null)||!EXPENSE_CATEGORIES.includes(form.category)||
      (!editing&&lines.length>=30)){
      setNotice('Post niet bewaard. Max. 70 tekens, 30 posten en € 0–99.999,99 per bedrag; betaald vereist werkelijk bedrag.');
      return;
    }
    if(editing&&!lines.some(line=>line.id===editing)){
      setEditing(null);setNotice('Te bewerken post bestaat niet meer. Probeer opnieuw.');return;
    }
    const row:MovingExpenseLine={
      id:editing??`move-exp-${Date.now()}-${lines.length}`,
      label:name,category:form.category,plannedCents:plan,actualCents:actual,paid:form.paid
    };
    setLines(current=>editing?current.map(line=>line.id===editing?row:line):[...current,row]);
    setForm(emptyExpenseForm());setEditing(null);invalidate();
    setNotice('Eigen kostenpost opgeslagen, alleen in dit browsertabblad.');
  }
  function edit(line:MovingExpenseLine){
    setEditing(line.id);setForm({
      label:line.label,category:line.category,
      planned:expenseFormAmount(line.plannedCents),
      actual:expenseFormAmount(line.actualCents),paid:line.paid
    });invalidate();
    document.getElementById('private-moving-expense-entry')?.scrollIntoView({block:'start',behavior:'smooth'});
  }
  async function importJson(file:File|undefined){
    setPendingRestore(null);setPendingReport(null);
    if(!file)return;
    if(!file.size||file.size>16384){setNotice('Privé-JSON geweigerd: maximaal 16 KiB.');return;}
    try{
      const raw:unknown=JSON.parse(await file.text());
      if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('format');
      const data=raw as Record<string,unknown>;
      if(data.format!=='woonpoints-moving-expenses'||data.version!==1||
        !Array.isArray(data.lines)||data.lines.length>30)throw Error('version');
      if(!data.lines.every(validExpenseLine))throw Error('line');
      const rows=data.lines as MovingExpenseLine[];
      if(new Set(rows.map(row=>row.id)).size!==rows.length)throw Error('duplicate');
      setPendingRestore(rows);setNotice('Geldige privé-back-up gelezen. Bevestig vervanging van je huidige posten.');
    }catch{
      setNotice('Back-up afgewezen: ongeldige versie, posten of bedragen. Je huidige posten blijven behouden.');
    }
  }
  return(
    <section className="panel" aria-labelledby="private-moving-expenses-heading">
      <p className="eyebrow">VERHUIZING · BEGROOT VERSUS WERKELIJK</p>
      <h2 id="private-moving-expenses-heading">Verhuiskosten bijhouden</h2>
      <p>Vergelijk je eigen kostenraming met later zelf ingevulde bedragen. Lege werkelijke
        bedragen blijven <strong>onbekend</strong>: ze worden nooit als € 0 uitgelegd.
        Dit is geen gekoppelde bankrekening, factuuradministratie of financieel advies.</p>
      {pendingBudget&&<div role="group" aria-label="Bevestig begrotingsposten toevoegen">
        <h3>Concept uit jouw eigen verhuiskostenraming</h3>
        <p>Dit zijn <strong>zelf geraamde bedragen</strong> uit je eigen verhuisbudget of een gekozen privé-offerte.
          Er is nog niets toegevoegd. Werkelijke bedragen blijven onbekend en niets wordt betaald gemarkeerd.
          Als je dit twee keer toevoegt kunnen dubbele posten ontstaan.</p>
        <ul>{pendingBudget.map(item=><li key={item.id}>
          {item.label}: {expenseAmount(item.plannedCents)}
        </li>)}</ul>
        <button type="button" disabled={lines.length+pendingBudget.length>30} onClick={()=>{
          if(lines.length+pendingBudget.length>30)return;
          const existingIds=new Set(lines.map(line=>line.id));
          const suffix=Date.now();
          setLines(old=>[...old,...pendingBudget.map((item,index)=>({
            ...item,id:existingIds.has(item.id)?'move-exp-'+suffix+'-'+(index+old.length):item.id
          }))]);
          setPendingBudget(null);setNotice('Eigen ramingsposten zijn toegevoegd; vul werkelijke bedragen later zelf in.');
        }}>Bevestig toevoegen ({pendingBudget.length} posten)</button>
        <button type="button" onClick={()=>{
          setPendingBudget(null);setNotice('Begrotingsvoorstel geannuleerd.');
        }}>Annuleren</button>
        {lines.length+pendingBudget.length>30&&<p>Het kostenboek heeft plaats voor maximaal 30 posten.
          Verwijder eerst eigen posten of annuleer deze overdracht.</p>}
      </div>}
      <dl>
        <div><dt>Gepland totaal</dt><dd>{expenseAmount(planned)}</dd></div>
        <div><dt>Bekende werkelijke kosten</dt><dd>{expenseAmount(actualKnown)} ({recorded}/{lines.length} posten)</dd></div>
        <div><dt>Door mij als betaald gemarkeerd</dt><dd>{expenseAmount(paidKnown)}</dd></div>
        <div><dt>Afwijking op ingevulde posten</dt><dd>{expenseAmount(actualKnown-matchedPlanned)}</dd></div>
      </dl>
      {outstanding>0&&<p role="status">{outstanding} posten missen nog een werkelijk bedrag. De afwijking
        omvat alleen posten waarvoor beide bedragen zijn ingevuld en is geen definitieve besparing.</p>}
      <form id="private-moving-expense-entry" onSubmit={event=>{event.preventDefault();submit();}}>
        <fieldset>
          <legend>{editing?'Bewerk kostenpost':'Nieuwe eigen kostenpost'} (max. 30)</legend>
          <label htmlFor="expense-name">Omschrijving (geen rekeningnummers, max. 70 tekens)</label>
          <input id="expense-name" autoComplete="off" maxLength={70} value={form.label}
            onChange={event=>{setForm(old=>({...old,label:event.target.value}));invalidate();}} />
          <label htmlFor="expense-category">Categorie</label>
          <select id="expense-category" value={form.category} onChange={event=>{
            setForm(old=>({...old,category:event.target.value as MovingExpenseCategory}));invalidate();
          }}>{EXPENSE_CATEGORIES.map(cat=><option key={cat}>{cat}</option>)}</select>
          <label htmlFor="expense-planned">Begroot bedrag (€)</label>
          <input id="expense-planned" type="text" inputMode="decimal" maxLength={10}
            placeholder="Bijv. 125,50" value={form.planned}
            onChange={event=>{setForm(old=>({...old,planned:event.target.value}));invalidate();}} />
          <label htmlFor="expense-actual">Werkelijk bedrag (€; leeg zolang onbekend)</label>
          <input id="expense-actual" type="text" inputMode="decimal" maxLength={10}
            placeholder="Nog onbekend" value={form.actual}
            onChange={event=>{
              const value=event.target.value;
              setForm(old=>({...old,actual:value,paid:value.trim()?old.paid:false}));invalidate();
            }} />
          <label><input type="checkbox" checked={form.paid} disabled={!form.actual.trim()}
            onChange={event=>{setForm(old=>({...old,paid:event.target.checked}));invalidate();}} />
            Zelf als betaald markeren</label>
          <button type="submit">{editing?'Sla wijziging op':'Voeg kostenpost toe'}</button>
          {editing&&<button type="button" onClick={()=>{setForm(emptyExpenseForm());setEditing(null);invalidate();}}>
            Annuleer bewerken</button>}
        </fieldset>
      </form>
      <h3>Eigen kostenposten</h3>
      {!lines.length&&<p>Nog geen posten. Maak zelf een eerste kostenraming.</p>}
      <ul>{lines.map(line=><li key={line.id}>
        <strong>{line.label}</strong> · {line.category}<br />
        Begroot {expenseAmount(line.plannedCents)} ·
        Werkelijk {line.actualCents===null?'onbekend':expenseAmount(line.actualCents)} ·
        {line.paid?'zelf als betaald gemarkeerd':'niet als betaald gemarkeerd'}
        <div>
          <button type="button" onClick={()=>edit(line)}>Bewerken</button>
          <button type="button" onClick={()=>{setPendingDelete(line.id);setPendingReport(null);}}>Verwijderen…</button>
          {pendingDelete===line.id&&<div role="group" aria-label="Bevestig kostenpost verwijderen">
            <p>Deze eigen post verdwijnt uit de berekening. Andere posten blijven behouden.</p>
            <button type="button" onClick={()=>{
              setLines(old=>old.filter(item=>item.id!==line.id));
              if(editing===line.id){setEditing(null);setForm(emptyExpenseForm());}
              invalidate();setNotice('Kostenpost uit dit tabblad verwijderd.');
            }}>Bevestig verwijderen</button>
            <button type="button" onClick={()=>setPendingDelete(null)}>Annuleren</button>
          </div>}
        </div>
      </li>)}</ul>
      {lines.length>0&&<>
        <h3>Per categorie (bekende bedragen)</h3>
        <ul>{EXPENSE_CATEGORIES.map(cat=>{
          const group=lines.filter(line=>line.category===cat);
          if(!group.length)return null;
          return <li key={cat}>{cat}: begroot {expenseAmount(group.reduce((s,l)=>s+l.plannedCents,0))},
            werkelijk bekend {expenseAmount(group.reduce((s,l)=>s+(l.actualCents??0),0))}
            {' · '}{group.filter(l=>l.actualCents===null).length} onbekend</li>;
        })}</ul>
      </>}
      {planned>0&&planned<=9999999&&<button type="button" onClick={()=>{
        window.dispatchEvent(new CustomEvent('woonpoints:moving-cost-split-offer',{
          detail:{format:'woonpoints-moving-split-total',version:1,plannedCents:planned}
        }));
        document.getElementById('private-cost-split-heading')?.scrollIntoView({block:'start',behavior:'smooth'});
        setNotice('Alleen je totale privébegroting is als voorstel naar de kostenverdeling gestuurd, geen betaalbewijs.');
      }}>Bied eigen begroting aan om met anderen te verdelen…</button>}
      <button type="button" onClick={()=>{
        exportFile('woonpoints-prive-verhuiskosten.json',
          JSON.stringify({format:'woonpoints-moving-expenses',version:1,lines},null,2),
          'application/json;charset=utf-8');
        setNotice('Privé-JSON aangeboden. Je gekozen opslaglocatie kan synchroniseren.');
      }} disabled={!lines.length}>Bewaar eigen kostenposten als JSON…</button>
      <label htmlFor="expense-import">Herstel privé-JSON (max. 16 KiB)</label>
      <input id="expense-import" type="file" accept=".json,application/json" onChange={event=>{
        const file=event.currentTarget.files?.[0];event.currentTarget.value='';void importJson(file);
      }} />
      {pendingRestore&&<div role="group" aria-label="Bevestig verhuiskosten herstel">
        <p>Back-up bevat {pendingRestore.length} valide posten. Herstellen vervangt
          <strong> alle huidige posten</strong> en je onbewaarde bewerkingsformulier in dit tabblad.</p>
        <button type="button" onClick={()=>{
          setLines(pendingRestore);setForm(emptyExpenseForm());setEditing(null);
          setPendingRestore(null);setPendingReport(null);
          setNotice('Privé-kostenposten hersteld. Geen betaalbewijs of bankcontrole uitgevoerd.');
        }}>Bevestig vervangen</button>
        <button type="button" onClick={()=>setPendingRestore(null)}>Annuleren</button>
      </div>}
      {lines.length>0&&pendingReport!==snapshot&&
        <button type="button" onClick={()=>{setPendingReport(snapshot);setNotice('');}}>
          Bekijk volledig privé-kostenoverzicht voor TXT-export…
        </button>}
      {lines.length>0&&pendingReport===snapshot&&<div role="group" aria-label="Bevestig kostenoverzicht export">
        <p>Controleer deze volledige tekst. Je eigen omschrijvingen staan in het te bewaren bestand.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre>
        <button type="button" onClick={()=>{
          if(pendingReport!==JSON.stringify(lines))return;
          exportFile('woonpoints-prive-verhuiskosten.txt',report,'text/plain;charset=utf-8');
          setPendingReport(null);setNotice('TXT aangeboden na je uitdrukkelijke bevestiging.');
        }}>Bevestig TXT-download</button>
        <button type="button" onClick={()=>setPendingReport(null)}>Annuleren</button>
      </div>}
      {lines.length>0&&!clearPending&&<button type="button" onClick={()=>setClearPending(true)}>
        Wis alle kostenposten…</button>}
      {clearPending&&<div role="group" aria-label="Bevestig alle kosten wissen">
        <p>Alle bedragen en je eigen omschrijvingen verdwijnen uit dit tabblad.</p>
        <button type="button" onClick={()=>{
          setLines([]);setEditing(null);setForm(emptyExpenseForm());invalidate();
          setNotice('Alle eigen kostenposten gewist.');
        }}>Bevestig alles wissen</button>
        <button type="button" onClick={()=>setClearPending(false)}>Annuleren</button>
      </div>}
      {notice&&<p role="status">{notice}</p>}
      <p>Alles blijft in het huidige tabblad; geen automatische opslag of remote verwerking.
        Exporteer bewust als je dit overzicht later wilt terugzien.</p>
    </section>
  );
}


type MovingQuoteService = 'Alleen bus' | 'Bus met chauffeur' | 'Bus en verhuishulp';
type MovingQuote = {
  id:string; name:string; service:MovingQuoteService; quoteDate:string;
  baseCents:number; travelCents:number; materialCents:number; notes:string;
};
const QUOTE_SERVICES:MovingQuoteService[]=['Alleen bus','Bus met chauffeur','Bus en verhuishulp'];
const quoteBlank=()=>({
  name:'',service:'Alleen bus' as MovingQuoteService, quoteDate:'',
  base:'',travel:'0',materials:'0',notes:''
});
function quoteTotal(quote:MovingQuote):number{
  return quote.baseCents+quote.travelCents+quote.materialCents;
}
function validatePrivateQuote(row:unknown):row is MovingQuote{
  if(!row||typeof row!=='object'||Array.isArray(row))return false;
  const q=row as Record<string,unknown>;
  return Object.keys(q).length===8 &&
    typeof q.id==='string'&&/^private-quote-[0-9]+-[0-9]+$/.test(q.id)&&
    typeof q.name==='string'&&q.name.length>0&&q.name.length<=60&&q.name.trim()===q.name&&
    !/[\u0000-\u001f\u007f]/.test(q.name)&&
    QUOTE_SERVICES.includes(q.service as MovingQuoteService)&&
    typeof q.quoteDate==='string'&&(q.quoteDate===''||dateOnly(q.quoteDate)!==null)&&
    (['baseCents','travelCents','materialCents'] as const).every(k=>
      typeof q[k]==='number'&&Number.isSafeInteger(q[k])&&(q[k] as number)>=0&&(q[k] as number)<=9999999
    )&&
    (q.baseCents as number)+(q.travelCents as number)+(q.materialCents as number)<=9999999&&
    typeof q.notes==='string'&&q.notes.length<=400&&!/[\u0000-\u001f\u007f]/.test(q.notes);
}

/** Private manual quote estimates only: not verified vendors, bookings or financial advice. */
export function PrivateMovingQuoteComparison(){
  const [quotes,setQuotes]=useState<MovingQuote[]>([]);
  const [form,setForm]=useState(quoteBlank);
  const [editing,setEditing]=useState<string|null>(null);
  const [selected,setSelected]=useState<string|null>(null);
  const [pendingDelete,setPendingDelete]=useState<string|null>(null);
  const [pendingRestore,setPendingRestore]=useState<{quotes:MovingQuote[];selected:string|null}|null>(null);
  const [pendingReport,setPendingReport]=useState<string|null>(null);
  const [pendingOffer,setPendingOffer]=useState<MovingQuote|null>(null);
  const [clearConfirm,setClearConfirm]=useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    const publish=()=>window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:snapshot',{
      detail:{version:1,section:'quotes',data:{quotes,selected}}
    }));
    window.addEventListener('woonpoints:moving-workspace:request',publish);
    publish();
    return()=>window.removeEventListener('woonpoints:moving-workspace:request',publish);
  },[quotes,selected]);
  useEffect(()=>{
    function restore(event:Event){
      const archive=(event as CustomEvent<unknown>).detail;
      if(!validMovingWorkspaceArchive(archive))return;
      setQuotes(archive.quotes.quotes);setSelected(archive.quotes.selected);setForm(quoteBlank());setEditing(null);setPendingOffer(null);setPendingDelete(null);setPendingRestore(null);setPendingReport(null);setClearConfirm(false);
      setNotice('Dit privé-onderdeel is na expliciete bevestiging vanuit de werkmap hersteld.');
    }
    window.addEventListener('woonpoints:moving-workspace:restore',restore);
    return()=>window.removeEventListener('woonpoints:moving-workspace:restore',restore);
  },[]);

  const sorted=[...quotes].sort((a,b)=>quoteTotal(a)-quoteTotal(b)||a.name.localeCompare(b.name,'nl-NL'));
  const best=sorted[0]||null;
  const selectedQuote=quotes.find(q=>q.id===selected)||null;
  const snapshot=JSON.stringify({quotes,selected});
  const report=[
    'Woonpoints · eigen offertevergelijking voor verhuizing',
    'Eigen invoer. Geen geverifieerde leveranciers, officiële offerte, bindende prijs of reservering.',
    ...sorted.map(q=>
      `${q.name} | ${q.service} | Eigen datum ${q.quoteDate||'onbekend'} | `+
      `Basis ${expenseAmount(q.baseCents)} | Reis ${expenseAmount(q.travelCents)} | `+
      `Materiaal ${expenseAmount(q.materialCents)} | Geraamd totaal ${expenseAmount(quoteTotal(q))}`+
      (q.id===selected?' | Eigen voorkeur':'')+
      (q.notes?` | Notities: ${q.notes.replace(/\r?\n/g,' ')}`:'')
    ),
    best?`Laagste van de ingevulde ramingen: ${best.name} · ${expenseAmount(quoteTotal(best))}`:
      'Nog geen eigen ramingen',
    selectedQuote?`Gekozen voorkeur: ${selectedQuote.name} · ${expenseAmount(quoteTotal(selectedQuote))}`:
      'Nog geen eigen voorkeur gekozen',
    'Controleer voorwaarden, verzekeringen, annuleringskosten en definitieve prijzen zelf.'
  ].join('\n')+'\n';
  function invalidate(){
    setPendingDelete(null);setPendingRestore(null);setPendingReport(null);
    setPendingOffer(null);setClearConfirm(false);setNotice('');
  }
  function saveQuote(){
    const name=form.name.trim().replace(/[\u0000-\u001f\u007f]/g,' ');
    const base=expenseCents(form.base),travel=expenseCents(form.travel),materials=expenseCents(form.materials);
    if(!name||name.length>60||base===null||travel===null||materials===null||
      base+travel+materials>9999999||form.notes.length>400||
      !QUOTE_SERVICES.includes(form.service)||(form.quoteDate&&!dateOnly(form.quoteDate))||
      (!editing&&quotes.length>=4)){
      setNotice('Ongeldige offerte: maximaal vier eigen offertes, € 99.999,99 totaal, 60 tekens naam en 400 tekens notities.');
      return;
    }
    if(editing&&!quotes.some(q=>q.id===editing)){
      setNotice('Offerte bestaat niet meer; bewerken is geannuleerd.');setEditing(null);return;
    }
    const item:MovingQuote={
      id:editing??`private-quote-${Date.now()}-${quotes.length}`,name,service:form.service,
      quoteDate:form.quoteDate,baseCents:base,travelCents:travel,materialCents:materials,notes:form.notes.replace(/[\u0000-\u001f\u007f]/g,' ')
    };
    setQuotes(old=>editing?old.map(q=>q.id===editing?item:q):[...old,item]);
    setForm(quoteBlank());setEditing(null);invalidate();
    setNotice('Eigen offerte in dit tabblad vastgelegd; geen prijs extern bevestigd.');
  }
  async function restoreJson(file:File|undefined){
    setPendingRestore(null);setPendingReport(null);
    if(!file)return;
    if(!file.size||file.size>8192){setNotice('Back-up geweigerd: maximaal 8 KiB.');return;}
    try{
      const raw:unknown=JSON.parse(await file.text());
      if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('root');
      const data=raw as Record<string,unknown>;
      if(data.format!=='woonpoints-private-moving-quotes'||data.version!==1||
        !Array.isArray(data.quotes)||data.quotes.length>4||
        !data.quotes.every(validatePrivateQuote))throw Error('format');
      const rows=data.quotes as MovingQuote[];
      if(new Set(rows.map(q=>q.id)).size!==rows.length ||
        !(data.selected===null||(typeof data.selected==='string'&&rows.some(q=>q.id===data.selected))))
        throw Error('selection');
      setPendingRestore({quotes:rows,selected:data.selected as string|null});
      setNotice('Geldige eigen offerteback-up gelezen. Bevestig voordat bestaande offertes worden vervangen.');
    }catch{
      setNotice('Back-up geweigerd: ongeldige versie, bedragen of velden; huidige offertes blijven staan.');
    }
  }
  return(
    <section className="panel" aria-labelledby="private-moving-quotes-heading">
      <p className="eyebrow">VERHUIZEN · EIGEN OFFERTES NAAST ELKAAR</p>
      <h2 id="private-moving-quotes-heading">Vergelijk je eigen verhuisoffertes</h2>
      <p>Voer zelf maximaal vier prijsindicaties in. De tool berekent alleen basisbedrag,
        reis-/toeslagkosten en materiaal samen. Dit zijn geen live offertes of reserveringen;
        onbekende of verborgen kosten zijn niet meegenomen.</p>
      <form onSubmit={event=>{event.preventDefault();saveQuote();}}>
        <fieldset>
          <legend>{editing?'Bewerk eigen offerte':'Nieuwe eigen offerte'}</legend>
          <label htmlFor="quote-name">Zelfgekozen label (geen persoonlijke contactgegevens)</label>
          <input id="quote-name" type="text" autoComplete="off" maxLength={60} value={form.name}
            onChange={event=>{setForm(old=>({...old,name:event.target.value}));invalidate();}} />
          <label htmlFor="quote-service">Soort service volgens je eigen inschatting</label>
          <select id="quote-service" value={form.service} onChange={event=>{
            setForm(old=>({...old,service:event.target.value as MovingQuoteService}));invalidate();
          }}>{QUOTE_SERVICES.map(k=><option key={k}>{k}</option>)}</select>
          <label htmlFor="quote-date">Datum prijsindicatie (optioneel)</label>
          <input id="quote-date" type="date" min="2000-01-01" max="2099-12-31" value={form.quoteDate}
            onChange={event=>{setForm(old=>({...old,quoteDate:event.target.value}));invalidate();}} />
          {([['base','Basisprijs'],['travel','Reis / toeslagen'],['materials','Materialen']] as const).map(([key,label])=>
            <div key={key}>
              <label htmlFor={`quote-${key}`}>{label} (€; vul 0 in als je zelf geen kosten verwacht)</label>
              <input id={`quote-${key}`} type="text" inputMode="decimal" maxLength={10}
                value={form[key]} onChange={event=>{
                  setForm(old=>({...old,[key]:event.target.value}));invalidate();
                }} />
            </div>
          )}
          <label htmlFor="quote-notes">Eigen aandachtspunten, bijvoorbeeld uitsluitingen (max. 400 tekens)</label>
          <textarea id="quote-notes" rows={3} maxLength={400} value={form.notes}
            onChange={event=>{setForm(old=>({...old,notes:event.target.value}));invalidate();}} />
          <button type="submit">{editing?'Sla wijzigingen op':'Voeg eigen offerte toe'}</button>
          {editing&&<button type="button" onClick={()=>{setEditing(null);setForm(quoteBlank());invalidate();}}>
            Annuleren</button>}
        </fieldset>
      </form>
      {best&&<p><strong>Laagste van jouw ingevulde ramingen:</strong> {best.name} ·
        {expenseAmount(quoteTotal(best))}. Niet per se de beste keuze;
        kwaliteit, dekkingsvoorwaarden en prijswijzigingen zijn niet beoordeeld.</p>}
      {selectedQuote&&best&&<p><strong>Jouw voorkeur:</strong> {selectedQuote.name} ·
        {expenseAmount(quoteTotal(selectedQuote))} ·
        {expenseAmount(quoteTotal(selectedQuote)-quoteTotal(best))} boven de laagste eigen raming.</p>}
      <h3>Eigen prijsindicaties</h3>
      {!quotes.length&&<p>Geen offertes ingevoerd. Noteer een eerste eigen prijsindicatie.</p>}
      <ul>{sorted.map(q=><li key={q.id}>
        <strong>{q.name}</strong> · {q.service}<br />
        {q.quoteDate||'Geen datum'} · Totaal {expenseAmount(quoteTotal(q))}<br />
        Basis {expenseAmount(q.baseCents)}, reis {expenseAmount(q.travelCents)},
        materiaal {expenseAmount(q.materialCents)}
        {q.notes&&<p>Eigen aandachtspunten: {q.notes}</p>}
        <div>
          <button type="button" aria-pressed={selected===q.id} onClick={()=>{
            setSelected(q.id);invalidate();setNotice('Dit is alleen je eigen voorkeursraming.');
          }}>Kies als voorkeur</button>
          <button type="button" onClick={()=>{
            setEditing(q.id);setForm({name:q.name,service:q.service,quoteDate:q.quoteDate,
              base:expenseFormAmount(q.baseCents),travel:expenseFormAmount(q.travelCents),
              materials:expenseFormAmount(q.materialCents),notes:q.notes});
            invalidate();document.getElementById('private-moving-quotes-heading')?.scrollIntoView({block:'start'});
          }}>Bewerken</button>
          <button type="button" onClick={()=>{setPendingDelete(q.id);setPendingReport(null);}}>Verwijderen…</button>
          {pendingDelete===q.id&&<div role="group" aria-label="Bevestig offerte verwijderen">
            <p>Deze eigen offerte verdwijnt uit je vergelijking.</p>
            <button type="button" onClick={()=>{
              setQuotes(old=>old.filter(item=>item.id!==q.id));
              if(selected===q.id)setSelected(null);
              if(editing===q.id){setEditing(null);setForm(quoteBlank());}
              invalidate();setNotice('Eigen offerte verwijderd.');
            }}>Bevestig verwijderen</button>
            <button type="button" onClick={()=>setPendingDelete(null)}>Annuleren</button>
          </div>}
        </div>
      </li>)}</ul>
      {selectedQuote&&<button type="button" onClick={()=>{
        setPendingOffer(selectedQuote);setNotice('Controleer of je de eigen prijsindicatie wilt aanbieden.');
      }}>Bied gekozen raming aan het privé-kostenboek aan…</button>}
      {pendingOffer&&<div role="group" aria-label="Bevestig kostenboek voorstel">
        <p>Alleen eigen label <strong>{pendingOffer.name}</strong> en
          de volledige eigen prijsindicatie <strong>{expenseAmount(quoteTotal(pendingOffer))}</strong>
          gaan als onbetaalde, begrote vervoerspost naar het kostenboek. Je moet het daar
          nog apart accepteren. Werkelijk bedrag blijft onbekend.</p>
        <button type="button" onClick={()=>{
          const cost=quoteTotal(pendingOffer);
          window.dispatchEvent(new CustomEvent('woonpoints:moving-budget-offer',{
            detail:{format:'woonpoints-moving-quote-offer',version:1,
              offer:[{label:'Gekozen offerte: '+pendingOffer.name.slice(0,50),
                category:'Vervoer',plannedCents:cost}]}
          }));
          setPendingOffer(null);setNotice('Eigen offerte als concept aan kostenboek aangeboden; nog niet overgenomen.');
          document.getElementById('private-moving-expenses-heading')?.scrollIntoView({block:'start',behavior:'smooth'});
        }}>Bevestig aanbieden</button>
        <button type="button" onClick={()=>setPendingOffer(null)}>Annuleren</button>
      </div>}
      <button type="button" disabled={!quotes.length} onClick={()=>{
        exportFile('woonpoints-prive-verhuisoffertes.json',
          JSON.stringify({format:'woonpoints-private-moving-quotes',version:1,quotes,selected},null,2),
          'application/json;charset=utf-8');
        setNotice('Eigen JSON aangeboden voor bewuste opslag; je opslaglocatie kan synchroniseren.');
      }}>Bewaar eigen offertes als privé-JSON…</button>
      <label htmlFor="quote-restore">Lees eerder bewaarde eigen offertes (JSON, max. 8 KiB)</label>
      <input id="quote-restore" type="file" accept=".json,application/json" onChange={event=>{
        const f=event.currentTarget.files?.[0];event.currentTarget.value='';void restoreJson(f);
      }} />
      {pendingRestore&&<div role="group" aria-label="Bevestig offertes herstellen">
        <p>{pendingRestore.quotes.length} geldige privé-offertes; bevestigen vervangt
          alle huidige eigen offertes én je gekozen voorkeur. Niet extern geverifieerd.</p>
        <button type="button" onClick={()=>{
          setQuotes(pendingRestore.quotes);setSelected(pendingRestore.selected);
          setPendingRestore(null);setEditing(null);setForm(quoteBlank());invalidate();
          setNotice('Eigen offertes hersteld, alleen in dit tabblad.');
        }}>Bevestig vervangen</button>
        <button type="button" onClick={()=>setPendingRestore(null)}>Annuleren</button>
      </div>}
      {quotes.length>0&&pendingReport!==snapshot&&<button type="button" onClick={()=>{
        setPendingReport(snapshot);setNotice('');
      }}>Bekijk volledig privé-offerteoverzicht voor TXT-export…</button>}
      {quotes.length>0&&pendingReport===snapshot&&<div role="group" aria-label="Bevestig offerte TXT-export">
        <p>Controleer alle eigen labels en notities voordat je het bestand opslaat.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre>
        <button type="button" onClick={()=>{
          if(pendingReport!==JSON.stringify({quotes,selected}))return;
          exportFile('woonpoints-prive-verhuisoffertes.txt',report,'text/plain;charset=utf-8');
          setPendingReport(null);setNotice('Privé-TXT na je bevestiging aangeboden.');
        }}>Bevestig TXT-download</button>
        <button type="button" onClick={()=>setPendingReport(null)}>Annuleren</button>
      </div>}
      {quotes.length>0&&!clearConfirm&&<button type="button" onClick={()=>setClearConfirm(true)}>
        Wis alle offertes…</button>}
      {clearConfirm&&<div role="group" aria-label="Bevestig alle offertes verwijderen">
        <p>Dit wist alle eigen ramingen en notities uit dit tabblad.</p>
        <button type="button" onClick={()=>{
          setQuotes([]);setSelected(null);setForm(quoteBlank());setEditing(null);
          invalidate();setNotice('Alle offertes uit dit tabblad gewist.');
        }}>Bevestig alles wissen</button>
        <button type="button" onClick={()=>setClearConfirm(false)}>Annuleren</button>
      </div>}
      {notice&&<p role="status">{notice}</p>}
      <p>Geen offerteaanvragen, betalingen, contacten, opslag of tracking. Deze momentopnamen
        verdwijnen zonder eigen export bij sluiten van het tabblad.</p>
    </section>
  );
}


type PrivateSplitMember={id:number;alias:string;paid:string};
const splitMember=(id:number):PrivateSplitMember=>({id,alias:`Persoon ${id}`,paid:''});
function privateSplitValidMember(item:unknown,index:number):item is PrivateSplitMember{
  if(!item||typeof item!=='object'||Array.isArray(item))return false;
  const row=item as Record<string,unknown>;
  return Object.keys(row).length===3&&row.id===index+1&&
    typeof row.alias==='string'&&row.alias.length>0&&row.alias.length<=30&&
    row.alias.trim()===row.alias&&!/[\u0000-\u001f\u007f]/.test(row.alias)&&
    typeof row.paid==='string'&&(row.paid===''||expenseCents(row.paid)!==null);
}

/** Simple, cent-exact personal settlement *proposal*; never executes a payment. */
export function PrivateMovingCostSplit(){
  const [members,setMembers]=useState<PrivateSplitMember[]>([splitMember(1),splitMember(2)]);
  const [total,setTotal]=useState('');
  const [pendingOffer,setPendingOffer]=useState<number|null>(null);
  const [pendingCount,setPendingCount]=useState<number|null>(null);
  const [pendingBackup,setPendingBackup]=useState<{members:PrivateSplitMember[];total:string}|null>(null);
  const [pendingReport,setPendingReport]=useState<string|null>(null);
  const [confirmClear,setConfirmClear]=useState(false);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    const publish=()=>window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:snapshot',{
      detail:{version:1,section:'split',data:{members,total}}
    }));
    window.addEventListener('woonpoints:moving-workspace:request',publish);
    publish();
    return()=>window.removeEventListener('woonpoints:moving-workspace:request',publish);
  },[members,total]);
  useEffect(()=>{
    function restore(event:Event){
      const archive=(event as CustomEvent<unknown>).detail;
      if(!validMovingWorkspaceArchive(archive))return;
      setMembers(archive.split.members);setTotal(archive.split.total);setPendingOffer(null);setPendingCount(null);setPendingBackup(null);setPendingReport(null);setConfirmClear(false);
      setNotice('Dit privé-onderdeel is na expliciete bevestiging vanuit de werkmap hersteld.');
    }
    window.addEventListener('woonpoints:moving-workspace:restore',restore);
    return()=>window.removeEventListener('woonpoints:moving-workspace:restore',restore);
  },[]);

  useEffect(()=>{
    function onOffer(event:Event){
      const value=(event as CustomEvent<unknown>).detail;
      if(!value||typeof value!=='object'||Array.isArray(value))return;
      const data=value as Record<string,unknown>;
      if(data.format==='woonpoints-moving-split-total'&&data.version===1&&
        typeof data.plannedCents==='number'&&Number.isSafeInteger(data.plannedCents)&&
        data.plannedCents>=0&&data.plannedCents<=9999999){
        setPendingOffer(data.plannedCents);
        setNotice('Eigen kostenboekbegroting aangeboden. Bevestig voordat het splitbedrag wordt vervangen.');
      }
    }
    window.addEventListener('woonpoints:moving-cost-split-offer',onOffer);
    return()=>window.removeEventListener('woonpoints:moving-cost-split-offer',onOffer);
  },[]);
  const totalCents=expenseCents(total);
  const paidCents=members.map(person=>person.paid.trim()?expenseCents(person.paid):null);
  const allKnown=paidCents.every(value=>value!==null);
  const paidTotal=paidCents.reduce<number>((sum,value)=>sum+(value??0),0);
  const sameTotal=totalCents!==null&&allKnown&&paidTotal===totalCents;
  const expected=members.map((_,index)=>{
    if(totalCents===null)return 0;
    return Math.floor(totalCents/members.length)+(index<totalCents%members.length?1:0);
  });
  const balances=members.map((_,index)=>(paidCents[index]??0)-expected[index]);
  const settlements:{from:number;to:number;cents:number}[]=[];
  if(sameTotal){
    const debtor=balances.map((value,id)=>({id,remaining:Math.max(0,-value)})).filter(x=>x.remaining>0);
    const creditor=balances.map((value,id)=>({id,remaining:Math.max(0,value)})).filter(x=>x.remaining>0);
    let d=0,c=0;
    while(d<debtor.length&&c<creditor.length){
      const cents=Math.min(debtor[d].remaining,creditor[c].remaining);
      if(cents>0)settlements.push({from:debtor[d].id,to:creditor[c].id,cents});
      debtor[d].remaining-=cents;creditor[c].remaining-=cents;
      if(debtor[d].remaining===0)d++;
      if(creditor[c].remaining===0)c++;
    }
  }
  const state=JSON.stringify({members,total});
  const report=[
    'Woonpoints · eigen verhuiskostenverdeling',
    'Uitsluitend lokale persoonlijke rekenhulp, geen betaling, schuldverklaring of bankcontrole.',
    `Zelf gekozen totaal: ${totalCents===null?'onbekend':expenseAmount(totalCents)}`,
    ...members.map((person,index)=>
      `${person.alias}: eigen bijdrage ${expenseAmount(expected[index])}, `+
      `zelf ingevoerd betaald ${paidCents[index]===null?'onbekend':expenseAmount(paidCents[index]!)}`),
    `Totaal ingevulde betaalbedragen: ${expenseAmount(paidTotal)}`,
    !allKnown?'Nog niet alle betaalbedragen ingevuld: geen verrekenadvies.':
      !sameTotal?'Betaalde bedragen sluiten niet op gekozen totaal: geen verrekenadvies.':
        settlements.length?settlements.map(item=>
          `Voorstel: ${members[item.from].alias} → ${members[item.to].alias}: ${expenseAmount(item.cents)}`).join('\n'):
          'Alle eigen bedragen gelijk verdeeld; geen onderlinge verrekening nodig.',
    'Verschillen van een cent bij een oneven totaal worden op basis van invoervolgorde toegewezen.',
    'Het resultaat is niet bevestigd met betaalbewijzen en verstuurt geen geld.'
  ].join('\n')+'\n';
  function invalidate(){
    setPendingBackup(null);setPendingReport(null);setPendingCount(null);setConfirmClear(false);setNotice('');
  }
  async function loadBackup(file:File|undefined){
    setPendingBackup(null);setPendingReport(null);
    if(!file)return;
    if(!file.size||file.size>8192){setNotice('JSON geweigerd: maximaal 8 KiB.');return;}
    try{
      const value:unknown=JSON.parse(await file.text());
      if(!value||typeof value!=='object'||Array.isArray(value))throw Error('root');
      const data=value as Record<string,unknown>;
      if(data.format!=='woonpoints-private-moving-split'||data.version!==1||
        typeof data.total!=='string'||
        (data.total!==''&&expenseCents(data.total)===null)||
        !Array.isArray(data.members)||data.members.length<2||data.members.length>4||
        !data.members.every((row,index)=>privateSplitValidMember(row,index)))throw Error('fields');
      setPendingBackup({total:data.total,members:data.members as PrivateSplitMember[]});
      setNotice('Geldige privé-verdelingsback-up gelezen. Bevestig om de huidige invoer te vervangen.');
    }catch{
      setNotice('Privé-JSON geweigerd: ongeldige versie, bedragen of personen. Huidige invoer behouden.');
    }
  }
  return(
    <section className="panel" aria-labelledby="private-cost-split-heading">
      <p className="eyebrow">VERHUISKOSTEN · PRIVÉ MET MEERDERE PERSONEN</p>
      <h2 id="private-cost-split-heading">Verdeel eigen verhuiskosten</h2>
      <p>Maak met twee tot vier personen een <strong>gelijke verdeling</strong> van een zelfgekozen
        totaal. Vul per persoon zelf het al betaalde bedrag in. Een verrekenvoorstel verschijnt
        pas als alle bedragen bekend zijn én precies optellen tot het afgesproken totaal.
        Geen rekeningkoppeling of automatische betaling.</p>
      {pendingOffer!==null&&<div role="group" aria-label="Bevestig begrotingsbedrag uit kostenboek">
        <p>Eigen begroting aangeboden: <strong>{expenseAmount(pendingOffer)}</strong>.
          Dit is geen bewezen werkelijke of betaalde uitgave. Overnemen vervangt alleen
          het te verdelen totaal; bestaande personen/betalingen blijven staan.</p>
        <button type="button" onClick={()=>{
          setTotal(expenseFormAmount(pendingOffer));setPendingOffer(null);invalidate();
          setNotice('Eigen begroting bewust overgenomen. Controleer alle betaalbedragen opnieuw.');
        }}>Bevestig totaal overnemen</button>
        <button type="button" onClick={()=>setPendingOffer(null)}>Annuleren</button>
      </div>}
      <label htmlFor="private-cost-split-total">Zelf te verdelen totaal (€)</label>
      <input id="private-cost-split-total" inputMode="decimal" type="text" maxLength={10}
        placeholder="Bijvoorbeeld 450,00" value={total} onChange={event=>{
          setTotal(event.target.value);invalidate();
        }} />
      <label htmlFor="private-cost-split-count">Aantal personen (2–4)</label>
      <select id="private-cost-split-count" value={members.length} onChange={event=>{
        const count=Number(event.target.value);
        if(count<members.length&&members.slice(count).some(person=>
          !!person.paid.trim()||person.alias.trim()!=='Persoon '+person.id)){
          setPendingCount(count);setNotice('Controleer eerst welke betaalgegevens verdwijnen bij minder deelnemers.');
          return;
        }
        setMembers(old=>Array.from({length:count},(_,index)=>old[index]??splitMember(index+1)));
        invalidate();
      }}>{[2,3,4].map(n=><option value={n} key={n}>{n}</option>)}</select>
      {pendingCount!==null&&<div role="group" aria-label="Bevestig deelnemers verminderen">
        <p>Als je naar {pendingCount} personen teruggaat, verdwijnen de ingevulde naamlabels
          en betaalbedragen van de laatste {members.length-pendingCount} persoon/personen.
          De overige invoer blijft behouden. Maak eventueel eerst een privé-JSON back-up.</p>
        <button type="button" onClick={()=>{
          setMembers(old=>old.slice(0,pendingCount));
          invalidate();setNotice('Aantal personen verlaagd na expliciete bevestiging.');
        }}>Bevestig verwijderen van deelnemers</button>
        <button type="button" onClick={()=>{setPendingCount(null);setNotice('Huidige personen behouden.');}}>
          Annuleren</button>
      </div>}
      <ul>{members.map((member,index)=><li key={member.id}>
        <label htmlFor={`split-person-name-${member.id}`}>Naamlabel persoon {member.id}</label>
        <input id={`split-person-name-${member.id}`} type="text" autoComplete="off"
          maxLength={30} value={member.alias} onChange={event=>{
            setMembers(old=>old.map(x=>x.id===member.id?{...x,alias:event.target.value}:x));invalidate();
          }} onBlur={()=>{
            setMembers(old=>old.map(x=>x.id===member.id?{...x,alias:x.alias.trim()||'Persoon '+x.id}:x));
          }} />
        <label htmlFor={`split-person-paid-${member.id}`}>Zelf ingevuld reeds betaald (€; leeg = onbekend)</label>
        <input id={`split-person-paid-${member.id}`} type="text" inputMode="decimal"
          maxLength={10} value={member.paid} onChange={event=>{
            setMembers(old=>old.map(x=>x.id===member.id?{...x,paid:event.target.value}:x));invalidate();
          }} />
        <p>Aandeel bij gelijke verdeling: {totalCents===null?'onbekend':expenseAmount(expected[index])}.
          Dit is een rekenafspraak, geen externe vordering.</p>
      </li>)}</ul>
      {totalCents===null&&<p role="alert">Vul eerst een geldig totaal tussen € 0 en € 99.999,99 in.</p>}
      {totalCents!==null&&!allKnown&&<p>Vul voor iedere persoon een bedrag in (ook 0,00 als niets betaald is).
        Er wordt geen verrekening voorgesteld zolang gegevens ontbreken of ongeldig zijn.</p>}
      {totalCents!==null&&allKnown&&!sameTotal&&<p role="alert">
        Ingevuld betaald {expenseAmount(paidTotal)} tegenover het eigen totaal {expenseAmount(totalCents)}:
        verschil {expenseAmount(paidTotal-totalCents)}. Pas invoer aan; er is nu geen verrekenvoorstel.
      </p>}
      {sameTotal&&<div aria-live="polite">
        <h3>Optionele onderlinge verrekening</h3>
        {!settlements.length&&<p>De ingevulde bedragen zijn al gelijk verdeeld. Geen voorstel nodig.</p>}
        <ol>{settlements.map((item,index)=><li key={index}>
          {members[item.from].alias} zou {expenseAmount(item.cents)} aan {members[item.to].alias} kunnen overmaken.
        </li>)}</ol>
        <p>Deze bedragen zijn exact in centen berekend, maar er worden geen betaalopdrachten verstuurd.
          Controleer zelf of alle kosten en eerdere betalingen kloppen.</p>
      </div>}
      <button type="button" onClick={()=>{
        exportFile('woonpoints-prive-kostenverdeling.json',
          JSON.stringify({format:'woonpoints-private-moving-split',version:1,
            members:members.map(x=>({...x,alias:x.alias.trim()||'Persoon '+x.id})),total},null,2),
          'application/json;charset=utf-8');
        setNotice('Eigen privé-JSON aangeboden; je opslaglocatie kan synchroniseren.');
      }}>Bewaar kostenverdeling als privé-JSON…</button>
      <label htmlFor="private-split-restore">Herstel privé-JSON (max. 8 KiB)</label>
      <input id="private-split-restore" type="file" accept=".json,application/json" onChange={event=>{
        const f=event.currentTarget.files?.[0];event.currentTarget.value='';void loadBackup(f);
      }} />
      {pendingBackup&&<div role="group" aria-label="Bevestig privé-kostenverdeling vervangen">
        <p>Back-up heeft {pendingBackup.members.length} personen.
          Bevestigen vervangt alle huidige namen, betaalbedragen en het totaal in dit tabblad.</p>
        <button type="button" onClick={()=>{
          setMembers(pendingBackup.members);setTotal(pendingBackup.total);
          setPendingBackup(null);setPendingReport(null);
          setNotice('Eigen kostenverdeling hersteld. Geen betalingscontrole uitgevoerd.');
        }}>Bevestig herstellen</button>
        <button type="button" onClick={()=>setPendingBackup(null)}>Annuleren</button>
      </div>}
      {pendingReport!==state&&<button type="button" onClick={()=>{
        setPendingReport(state);setNotice('');
      }}>Bekijk privé-verdeling als TXT…</button>}
      {pendingReport===state&&<div role="group" aria-label="Bevestig privé-verdelingsrapport">
        <p>Bekijk de exacte tekst, inclusief eigen naamlabels. Onvolledige gegevens blijven
          zichtbaar als onbekend en geven geen betaaladvies.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{report}</pre>
        <button type="button" onClick={()=>{
          if(pendingReport!==JSON.stringify({members,total}))return;
          exportFile('woonpoints-prive-kostenverdeling.txt',report,'text/plain;charset=utf-8');
          setPendingReport(null);setNotice('TXT-bestand op eigen verzoek aangeboden.');
        }}>Bevestig TXT-download</button>
        <button type="button" onClick={()=>setPendingReport(null)}>Annuleren</button>
      </div>}
      {!confirmClear&&<button type="button" onClick={()=>setConfirmClear(true)}>Wis eigen verdeling…</button>}
      {confirmClear&&<div role="group" aria-label="Bevestig privé-kostenverdeling wissen">
        <p>Hiermee wis je alle zelf ingevoerde bedragen en naamlabels uit dit tabblad.</p>
        <button type="button" onClick={()=>{
          setMembers([splitMember(1),splitMember(2)]);setTotal('');invalidate();
          setPendingOffer(null);setNotice('Eigen verdeling gewist.');
        }}>Bevestig wissen</button>
        <button type="button" onClick={()=>setConfirmClear(false)}>Annuleren</button>
      </div>}
      {notice&&<p role="status">{notice}</p>}
      <p>Alleen je eigen rekengegevens, niet automatisch opgeslagen of verzonden.
        Deel geen rekeningnummers of gevoelige persoonsgegevens in de labels.</p>
    </section>
  );
}


type MovingWorkspaceArchive = {
  format: 'woonpoints-private-moving-workspace';
  version: 1;
  quotes: { quotes: MovingQuote[]; selected: string | null };
  expenses: { lines: MovingExpenseLine[] };
  split: { members: PrivateSplitMember[]; total: string };
};
type MovingWorkspaceSection = 'quotes' | 'expenses' | 'split';

type MovingWorkspaceArchiveV2 = Omit<MovingWorkspaceArchive,'version'> & {
  version: 2;
  timeline: {moveDate:string;completed:string[];extras:ExtraTask[]};
  handover: {entries:{in?:PrivateHandoverEntry;out?:PrivateHandoverEntry}};
  documents: ReadinessBackup;
};
type MovingWorkspaceArchiveV3 = Omit<MovingWorkspaceArchiveV2,'version'> & {
  version:3;
  packing:{items:PackingItem[]};
};
type MovingWorkspaceArchiveV4=Omit<MovingWorkspaceArchiveV3,'version'|'packing'> & {
  version:4;
  packing:{items:PackingItem[];transport:PackingTransportRow[]};
};

type MovingHelperEntry={
  id:string;alias:string;task:'Inpakken'|'Laden'|'Vervoer'|'Uitpakken'|'Overig';
  date:string;start:string;end:string;
  state:'Nog vragen'|'Bevestigd'|'Afgerond';note:string;
};
type MovingWorkspaceArchiveV5=Omit<MovingWorkspaceArchiveV4,'version'> & {
  version:5;
  helpers:{helpers:MovingHelperEntry[]};
};

type MovingAddressEntry={
  id:string;label:string;status:'Nog regelen'|'Zelf gemeld'|'Niet van toepassing';date:string;note:string;
};
type MovingWorkspaceArchiveV6=Omit<MovingWorkspaceArchiveV5,'version'> & {
  version:6;address:{items:MovingAddressEntry[]};
};
const MOVING_ADDRESS_DEFAULTS=[
  ['gemeente','Gemeente of BRP'],['post','Post doorsturen'],
  ['bank','Bank- en betaalgegevens'],['werk','Werkgever of opdrachtgever'],
  ['zorg','Zorgverzekeraar'],['huisarts','Huisarts en zorgverleners'],
  ['energie','Energiecontract'],['internet','Internet en televisie'],
  ['verzekeringen','Overige verzekeringen'],['abonnementen','Abonnementen en bezorgingen']
] as const;
function validMovingWorkspaceAddress(value:unknown):value is MovingWorkspaceArchiveV6['address']{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const data=value as Record<string,unknown>;
  if(Object.keys(data).join('|')!=='items'||!Array.isArray(data.items)||
    data.items.length<10||data.items.length>22)return false;
  const seen=new Set<string>();
  for(const raw of data.items){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
    const row=raw as Record<string,unknown>;
    if(Object.keys(row).sort().join('|')!=='date|id|label|note|status'||
      typeof row.id!=='string'||typeof row.label!=='string'||
      typeof row.date!=='string'||typeof row.note!=='string')return false;
    const builtin=MOVING_ADDRESS_DEFAULTS.find(([id])=>id===row.id);
    if(builtin){
      if(row.label!==builtin[1])return false;
    }else if(!/^custom-[0-9]+-[0-9]+$/.test(row.id))return false;
    if(seen.has(row.id)||!row.label||row.label.length>65||
      row.label!==row.label.trim()||row.note.length>160||
      row.note!==row.note.trim()||/[\u0000-\u001f\u007f]/.test(row.label+row.note)||
      !['Nog regelen','Zelf gemeld','Niet van toepassing'].includes(String(row.status))||
      (row.date!==''&&!dateOnly(row.date)))return false;
    seen.add(row.id);
  }
  return MOVING_ADDRESS_DEFAULTS.every(([id])=>seen.has(id))&&
    [...seen].filter(id=>id.startsWith('custom-')).length<=12;
}

function validMovingWorkspaceHelpers(raw:unknown):raw is MovingWorkspaceArchiveV5['helpers']{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const data=raw as Record<string,unknown>;
  if(Object.keys(data).join('|')!=='helpers'||!Array.isArray(data.helpers)||
    data.helpers.length>12)return false;
  const ids:string[]=[];
  for(const item of data.helpers){
    if(!item||typeof item!=='object'||Array.isArray(item))return false;
    const row=item as Record<string,unknown>;
    if(Object.keys(row).sort().join('|')!=='alias|date|end|id|note|start|state|task'||
      typeof row.id!=='string'||!/^assist-[0-9]+-[0-9]+$/.test(row.id)||
      typeof row.alias!=='string'||row.alias.length<1||row.alias.length>32||
      row.alias!==row.alias.trim()||/[\u0000-\u001f\u007f]/.test(row.alias)||
      typeof row.note!=='string'||row.note.length>120||
      row.note!==row.note.trim()||/[\u0000-\u001f\u007f]/.test(row.note)||
      !['Inpakken','Laden','Vervoer','Uitpakken','Overig'].includes(String(row.task))||
      !['Nog vragen','Bevestigd','Afgerond'].includes(String(row.state))||
      typeof row.date!=='string'||typeof row.start!=='string'||typeof row.end!=='string')
      return false;
    if(!row.date){
      if(row.start||row.end||row.state==='Afgerond')return false;
    }else{
      if(!dateOnly(row.date))return false;
      if(!row.start&&!row.end){
        if(row.state==='Afgerond')return false;
      }else{
        const time=/^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
        if(!time.test(row.start)||!time.test(row.end)||row.start>=row.end)return false;
      }
    }
    ids.push(row.id);
  }
  return new Set(ids).size===ids.length;
}

function validMovingWorkspacePackingV4(raw:unknown):raw is MovingWorkspaceArchiveV4['packing']{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const data=raw as Record<string,unknown>;
  if(Object.keys(data).sort().join('|')!=='items|transport')return false;
  return validArchive({format:'woonpoints-private-packing-list',version:2,
    items:data.items,transport:data.transport});
}
function validMovingWorkspacePacking(value:unknown):value is MovingWorkspaceArchiveV3['packing']{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const data=value as Record<string,unknown>;
  if(Object.keys(data).join('|')!=='items'||!Array.isArray(data.items)||
    data.items.length>80||!data.items.every(validItem))return false;
  return new Set(data.items.map((item:PackingItem)=>item.id)).size===data.items.length;
}

function validMovingWorkspaceTimeline(value:unknown):
  value is MovingWorkspaceArchiveV2['timeline'] {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const data=value as Record<string,unknown>;
  if(Object.keys(data).sort().join('|')!=='completed|extras|moveDate' ||
    typeof data.moveDate!=='string'||(data.moveDate!==''&&!dateOnly(data.moveDate))||
    !Array.isArray(data.extras)||data.extras.length>6||
    !Array.isArray(data.completed)||data.completed.length>15)return false;
  const extraIds:string[]=[];
  for(const item of data.extras){
    if(!item||typeof item!=='object'||Array.isArray(item))return false;
    const task=item as Record<string,unknown>;
    if(Object.keys(task).sort().join('|')!=='group|id|offset|title' ||
      typeof task.id!=='string'||!/^extra-[0-9]+-[0-9]+$/.test(task.id)||
      typeof task.title!=='string'||!task.title.trim()||task.title.length>60||
      task.title!==task.title.trim()||
      task.group!=='Eigen taak'||typeof task.offset!=='number'||
      !Number.isInteger(task.offset)||task.offset < -120||task.offset > 60)return false;
    extraIds.push(task.id);
  }
  const validIds=new Set([...DEFAULT_TASKS.map(t=>t.id),...extraIds]);
  return validIds.size===DEFAULT_TASKS.length+extraIds.length &&
    data.completed.every((id:unknown)=>typeof id==='string'&&validIds.has(id)) &&
    new Set(data.completed).size===data.completed.length;
}
function validMovingWorkspaceHandover(value:unknown):
  value is MovingWorkspaceArchiveV2['handover']{
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const envelope=value as Record<string,unknown>;
  if(Object.keys(envelope).join('|')!=='entries'||!envelope.entries||
    typeof envelope.entries!=='object'||Array.isArray(envelope.entries))return false;
  const entries=envelope.entries as Record<string,unknown>;
  if(Object.keys(entries).some(k=>k!=='in'&&k!=='out'))return false;
  for(const item of Object.values(entries)){
    if(!item||typeof item!=='object'||Array.isArray(item))return false;
    const row=item as Record<string,unknown>;
    if(Object.keys(row).sort().join('|')!=='day|electricity|gas|keys|property|remarks|water'||
      typeof row.day!=='string'||!dateOnly(row.day)||
      typeof row.property!=='string'||row.property.length>70||
      typeof row.keys!=='number'||!Number.isInteger(row.keys)||row.keys<0||row.keys>99||
      typeof row.remarks!=='string'||row.remarks.length>900)return false;
    for(const meter of ['electricity','gas','water']){
      if(typeof row[meter]!=='string'||handoverMeter(row[meter] as string)===null)return false;
    }
  }
  return true;
}
function validMovingWorkspaceDocuments(value:unknown):
  value is ReadinessBackup {
  if(!value||typeof value!=='object'||Array.isArray(value))return false;
  const doc=value as Record<string,unknown>;
  if(Object.keys(doc).sort().join('|')!=='dates|extras|states'||
    !Array.isArray(doc.extras)||doc.extras.length>8||
    !doc.states||typeof doc.states!=='object'||Array.isArray(doc.states)||
    !doc.dates||typeof doc.dates!=='object'||Array.isArray(doc.dates))return false;
  const ids=READINESS_DEFAULTS.map(item=>item.id);
  for(const raw of doc.extras){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
    const extra=raw as Record<string,unknown>;
    if(Object.keys(extra).sort().join('|')!=='id|title' ||
      typeof extra.id!=='string'||!/^custom-[0-9]+-[0-9]+$/.test(extra.id)||
      typeof extra.title!=='string'||!extra.title.trim()||extra.title.length>60||
      extra.title!==extra.title.trim())return false;
    ids.push(extra.id);
  }
  const allowed=new Set(ids);
  if(allowed.size!==ids.length)return false;
  const states=doc.states as Record<string,unknown>,dates=doc.dates as Record<string,unknown>;
  if(Object.keys(states).length>16||Object.keys(dates).length>16)return false;
  return Object.keys(states).every(key=>
      allowed.has(key)&&['needed','ready','skip'].includes(String(states[key]))) &&
    Object.keys(dates).every(key=>
      allowed.has(key)&&typeof dates[key]==='string'&&
      (dates[key]===''||dateOnly(dates[key] as string)!==null));
}


function validMovingWorkspaceArchive(raw:unknown): raw is MovingWorkspaceArchive | MovingWorkspaceArchiveV2 | MovingWorkspaceArchiveV3 | MovingWorkspaceArchiveV4 | MovingWorkspaceArchiveV5 | MovingWorkspaceArchiveV6 {
  if(!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const obj = raw as Record<string,unknown>;
  const v2=obj.version===2,v3=obj.version===3,v4=obj.version===4,
    v5=obj.version===5,v6=obj.version===6;
  const keys=Object.keys(obj).sort().join('|');
  if(keys!==(v6?'address|documents|expenses|format|handover|helpers|packing|quotes|split|timeline|version':
    v5?'documents|expenses|format|handover|helpers|packing|quotes|split|timeline|version':
    (v3||v4)?'documents|expenses|format|handover|packing|quotes|split|timeline|version':
    v2?'documents|expenses|format|handover|quotes|split|timeline|version':
    'expenses|format|quotes|split|version') ||
    obj.format !== 'woonpoints-private-moving-workspace' ||
    (obj.version!==1&&!v2&&!v3&&!v4&&!v5&&!v6))return false;
  const quoteData=obj.quotes, expenseData=obj.expenses, splitData=obj.split;
  if(!quoteData||typeof quoteData!=='object'||Array.isArray(quoteData)||
    !expenseData||typeof expenseData!=='object'||Array.isArray(expenseData)||
    !splitData||typeof splitData!=='object'||Array.isArray(splitData))return false;
  const quotes=quoteData as Record<string,unknown>;
  const expenses=expenseData as Record<string,unknown>;
  const split=splitData as Record<string,unknown>;
  if(Object.keys(quotes).sort().join('|')!=='quotes|selected'||
    !Array.isArray(quotes.quotes)||quotes.quotes.length>4||
    !quotes.quotes.every(validatePrivateQuote)||
    !(quotes.selected===null || (typeof quotes.selected==='string'&&
      quotes.quotes.some((q:MovingQuote)=>q.id===quotes.selected))))return false;
  if(Object.keys(expenses).join('|')!=='lines'||
    !Array.isArray(expenses.lines)||expenses.lines.length>30||
    !expenses.lines.every(validExpenseLine))return false;
  if(Object.keys(split).sort().join('|')!=='members|total'||
    !Array.isArray(split.members)||split.members.length<2||split.members.length>4||
    !split.members.every((person:unknown,index:number)=>privateSplitValidMember(person,index))||
    typeof split.total!=='string'||(split.total!==''&&expenseCents(split.total)===null))return false;
  const quoteIds=(quotes.quotes as MovingQuote[]).map(q=>q.id);
  const expenseIds=(expenses.lines as MovingExpenseLine[]).map(e=>e.id);
  return new Set(quoteIds).size===quoteIds.length &&
    new Set(expenseIds).size===expenseIds.length &&
    (!(v2||v3||v4||v5||v6) || (validMovingWorkspaceTimeline(obj.timeline)&&
      validMovingWorkspaceHandover(obj.handover)&&
      validMovingWorkspaceDocuments(obj.documents))) &&
    (!v3 || validMovingWorkspacePacking(obj.packing)) &&
    (!(v4||v5||v6) || validMovingWorkspacePackingV4(obj.packing)) &&
    (!(v5||v6) || validMovingWorkspaceHelpers(obj.helpers)) &&
    (!v6 || validMovingWorkspaceAddress(obj.address));
}
function privateMovingWorkspaceSignature(data:MovingWorkspaceArchive|MovingWorkspaceArchiveV2|MovingWorkspaceArchiveV3|MovingWorkspaceArchiveV4|MovingWorkspaceArchiveV5|MovingWorkspaceArchiveV6):string{
  return JSON.stringify(data);
}

/**
 * Read-only in-tab hub for the three existing user-authored moving modules.
 * No account, vendor, backend or localStorage. Restore only after one explicit
 * confirmation that replaces all three independent browser-only modules.
 */

type PrivateMovingAction = {
  id:string;
  title:string;
  due:string;
  origin:'planning'|'documents'|'overdracht'|'financieel'|'offertes'|'inpakken'|'verhuishulp'|'adres';
  href:string;
};
function movingLocalDate(now:Date):string{
  return String(now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+
    String(now.getDate()).padStart(2,'0');
}
function movingActionPriority(action:PrivateMovingAction,today:string|null):number {
  if(!today||!action.due)return 3;
  if(action.due<today)return 0;
  if(action.due===today)return 1;
  const day=dateOnly(action.due),current=dateOnly(today);
  if(!day||!current)return 3;
  return (day.getTime()-current.getTime())/86400000<=7?2:3;
}
function movingCalendarText(text:string):string{
  return text.replace(/\\/g,'\\\\').replace(/[\r\n]/g,' ')
    .replace(/,/g,'\\,').replace(/;/g,'\\;');
}


type MovingReportSection = 'timeline'|'handover'|'documents'|'quotes'|'expenses'|'split'|'packing'|'helpers'|'address';
const MOVING_REPORT_SECTIONS:{id:MovingReportSection;label:string;warning:string}[]=[
  {id:'timeline',label:'Verhuisplanning en open acties',warning:'Zelfgekozen datums en taken'},
  {id:'documents',label:'Eigen documentenchecklist',warning:'Eigen documentstatus en taaklabels'},
  {id:'handover',label:'Sleutels en meterstanden',warning:'Privé-opnamen en eigen woninglabels'},
  {id:'quotes',label:'Verhuisoffertes',warning:'Leveranciersnamen en eigen notities'},
  {id:'expenses',label:'Verhuiskostenboek',warning:'Eigen bedragen en betaalmarkeringen'},
  {id:'split',label:'Persoonlijke kostenverdeling',warning:'Naamlabels en betaalbedragen'},
  {id:'packing',label:'Eigen paklijst per kamer',warning:'Dooslabels, inhoud, aantallen en prioriteiten'},
  {id:'helpers',label:'Zelf ingevulde verhuishulp',warning:'Roepnamen, datums, taaknotities en eigen statussen'},
  {id:'address',label:'Eigen adreswijzigingen en contracten',warning:'Meldpunten, privénotities en eigen controledatums'}
];
function movingReportLine(value:string):string{
  // User text belongs to a plain-text report, never to generated headings or another line.
  return value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,900);
}
function buildPrivateMovingReport(
  archive:MovingWorkspaceArchiveV6,sections:MovingReportSection[],
  actions:PrivateMovingAction[],today:string|null
):string{
  const lines:string[]=[
    'WOONPOINTS - PRIVÉ VERHUISDOSSIER',
    'Zelf ingevoerde gegevens; geen officieel bewijs van woning, betaling, offerte of afspraak.',
    'Overzichtsdatum (eigen browser): '+(today||'niet beschikbaar'),
    'Gekozen onderdelen: '+sections.length+' van '+MOVING_REPORT_SECTIONS.length,
    ''
  ];
  const add=(heading:string,body:string[])=>{lines.push('=== '+heading+' ===',...body,'');};
  const selected=new Set(sections);
  if(selected.has('timeline')){
    const date=archive.timeline.moveDate;
    const tasks=[...DEFAULT_TASKS,...archive.timeline.extras]
      .map(task=>({title:task.title,offset:task.offset,done:archive.timeline.completed.includes(task.id)}))
      .sort((a,b)=>a.offset-b.offset||a.title.localeCompare(b.title,'nl-NL'));
    add('PLANNING',[
      'Zelfgekozen verhuisdatum: '+(date||'niet ingevuld'),
      ...tasks.map(task=>(task.done?'[x] ':'[ ] ')+
        (date?dayAtOffset(date,task.offset)+' - ':'geen datum - ')+movingReportLine(task.title))
    ]);
  }
  if(selected.has('documents')){
    const all=[...READINESS_DEFAULTS,...archive.documents.extras];
    add('DOCUMENTENSTATUS',all.map(doc=>{
      const status=archive.documents.states[doc.id]||'needed';
      const due=archive.documents.dates[doc.id]||'geen datum';
      return '['+status+'] '+movingReportLine(doc.title)+' - '+due;
    }));
  }
  if(selected.has('handover')){
    const body:string[]=[];
    for(const [kind,label] of [['in','Ontvangst'],['out','Overdracht']] as const){
      const item=archive.handover.entries[kind];
      if(!item){body.push(label+': geen eigen opname');continue;}
      body.push(label+' - '+item.day+' - '+movingReportLine(item.property),
        'Sleutels: '+item.keys+'; stroom: '+item.electricity+'; gas: '+item.gas+'; water: '+item.water,
        'Eigen opmerkingen: '+(movingReportLine(item.remarks)||'geen'));
    }
    add('SLEUTEL- EN METEROPNAMEN',body);
  }
  if(selected.has('quotes')){
    add('EIGEN VERHUISRAMINGEN',archive.quotes.quotes.length?
      archive.quotes.quotes.map(q=>(archive.quotes.selected===q.id?'[voorkeur] ':'')+
        movingReportLine(q.name)+' - '+movingReportLine(q.service)+' - '+
        expenseAmount(quoteTotal(q))+' - '+(q.quoteDate||'geen offertedatum')+
        ' - eigen notitie: '+(movingReportLine(q.notes)||'geen')):['Geen offertes genoteerd.']);
  }
  if(selected.has('expenses')){
    const planned=archive.expenses.lines.reduce((n,e)=>n+e.plannedCents,0);
    const complete=archive.expenses.lines.filter(e=>e.actualCents!==null);
    const actual=complete.reduce((n,e)=>n+(e.actualCents??0),0);
    add('KOSTENBOEK',[
      'Begroot: '+expenseAmount(planned),
      'Bekende werkelijke bedragen: '+expenseAmount(actual)+' ('+complete.length+'/'+archive.expenses.lines.length+' ingevuld; niet definitief)',
      ...archive.expenses.lines.map(e=>movingReportLine(e.label)+' ['+e.category+'] - begroting '+
        expenseAmount(e.plannedCents)+'; werkelijk '+(e.actualCents===null?'onbekend':expenseAmount(e.actualCents))+
        '; '+(e.paid?'zelf gemarkeerd als betaald':'niet als betaald gemarkeerd'))
    ]);
  }
  if(selected.has('split')){
    add('EIGEN KOSTENVERDELING',[
      'Zelfgekozen verdeeltotaal: '+(archive.split.total?expenseAmount(expenseCents(archive.split.total)??0):'onbekend'),
      'Geen automatische betaalopdracht of betalingsverificatie.',
      ...archive.split.members.map(m=>movingReportLine(m.alias)+
        ' - reeds betaald volgens eigen invoer: '+(m.paid?expenseAmount(expenseCents(m.paid)??0):'onbekend'))
    ]);
  }
  if(selected.has('address')){
    const rows=archive.address.items.slice().sort((a,b)=>
      (a.date||'9999').localeCompare(b.date||'9999')||
      a.label.localeCompare(b.label,'nl-NL'));
    add('EIGEN ADRESWIJZIGINGEN',rows.map(row=>
      '['+row.status+'] '+movingReportLine(row.label)+' - '+(row.date||'zonder eigen datum')+
      (row.note?' - '+movingReportLine(row.note):'')));
  }
  if(selected.has('helpers')){
    const rows=archive.helpers.helpers.slice().sort((a,b)=>
      (a.date||'9999').localeCompare(b.date||'9999')||
      a.start.localeCompare(b.start)||a.alias.localeCompare(b.alias,'nl-NL'));
    add('EIGEN VERHUISHULP',rows.length?rows.map(row=>
      '['+row.state+'] '+(row.date||'zonder datum')+
      (row.start&&row.end?' '+row.start+'-'+row.end:' zonder volledig tijdvak')+
      ' - '+movingReportLine(row.alias)+' - '+row.task+
      (row.note?' - '+movingReportLine(row.note):'')):
      ['Geen zelf ingevoerde helpers.']);
  }
  if(selected.has('packing')){
    const rows=archive.packing.items.slice().sort((a,b)=>
      a.room.localeCompare(b.room,'nl-NL')||a.box.localeCompare(b.box,'nl-NL')||
      a.label.localeCompare(b.label,'nl-NL'));
    add('PAKLIJST EN DOZEN',rows.length?rows.map(row=>
      '['+row.status+'] '+row.room+' - '+row.quantity+' x '+movingReportLine(row.label)+
      (row.box?' - doos '+movingReportLine(row.box):' - doos onbekend')+
      (row.priority?' - EERST NODIG':'')):['Nog geen eigen pakregels ingevoerd.']);
    const boxes=packingBoxGroups(archive.packing.items);
    add('EIGEN LAAD- EN AFLEVERMARKERINGEN',boxes.length?boxes.map(group=>{
      const recorded=archive.packing.transport.find(row=>
        row.room===group.room&&row.box===group.box);
      return '['+(recorded?.stage||'nog laden')+'] '+group.room+' - doos '+movingReportLine(group.box);
    }):['Geen eigen dozen met labels genoteerd.']);
  }
  const relevant=actions.filter(a=>
    (a.origin==='planning'&&selected.has('timeline'))||
    (a.origin==='documents'&&selected.has('documents'))||
    (a.origin==='overdracht'&&selected.has('handover'))||
    (a.origin==='offertes'&&selected.has('quotes'))||
    (a.origin==='financieel'&&(selected.has('expenses')||selected.has('split')))|| 
    (a.origin==='inpakken'&&selected.has('packing'))||
    (a.origin==='verhuishulp'&&selected.has('helpers'))||
    (a.origin==='adres'&&selected.has('address'))
  );
  add('NOG ZELF TE REGELEN',relevant.length?relevant.map(a=>
    (a.due||'zonder eigen datum')+' - '+movingReportLine(a.title)):['Geen open punten in de gekozen onderdelen.']);
  lines.push('Controleer officiële deadlines, bedragen en rechten zelf bij de betreffende organisatie.',
    'Dit rapport is lokaal samengesteld; bewaren/delen is uitsluitend jouw eigen keuze.');
  return lines.join('\n')+'\n';
}


type MoveDayPhase='voorbereiding'|'vertrek'|'aankomst';
type MoveDayStep={id:string;phase:MoveDayPhase;status:'open'|'eigen-klaar'|'onbekend';title:string;detail:string;href:string};
const MOVE_DAY_PHASES:{id:MoveDayPhase;name:string}[]=[
  {id:'voorbereiding',name:'1. Voorbereiding'},
  {id:'vertrek',name:'2. Vertrek'},
  {id:'aankomst',name:'3. Aankomst'}
];
function buildMoveDaySteps(a:MovingWorkspaceArchiveV6):MoveDayStep[]{
  const result:MoveDayStep[]=[];
  const add=(phase:MoveDayPhase,id:string,status:MoveDayStep['status'],title:string,detail:string,href:string)=>{
    result.push({phase,id,status,title,detail,href});
  };
  add('voorbereiding','date',a.timeline.moveDate?'eigen-klaar':'onbekend',
    a.timeline.moveDate?'Eigen verhuisdatum genoteerd':'Verhuisdatum nog onbekend',
    a.timeline.moveDate||'Kies zelf een verwachte datum.', '#private-moving-day-heading');
  const docs=[...READINESS_DEFAULTS,...a.documents.extras]
    .filter(x=>a.documents.states[x.id]!=='skip');
  const pendingDocs=docs.filter(x=>a.documents.states[x.id]!=='ready').length;
  add('voorbereiding','docs',pendingDocs?'open':'eigen-klaar',
    pendingDocs?pendingDocs+' eigen documentpunten open':'Eigen documentchecklist afgevinkt',
    docs.length+' zelf geregistreerde toepasselijke punten; niet officieel geverifieerd.',
    '#private-document-readiness-heading');
  const addressItems=a.address.items;
  const addressOpen=addressItems.filter(item=>item.status==='Nog regelen').length;
  add('voorbereiding','address',addressOpen?'open':'eigen-klaar',
    addressOpen?addressOpen+' eigen adres-/contractmeldpunten nog te regelen':
      'Eigen adres-/contractchecklist heeft geen open punten',
    addressItems.length+' zelf ingevulde categorieën; geen officiële ontvangst of BRP-melding.',
    '#private-address-change-heading');
  const helpers=a.helpers.helpers;
  const helperOpen=helpers.filter(h=>h.state==='Nog vragen').length;
  const helperWithoutTime=helpers.filter(h=>h.state!=='Afgerond'&&
    (!h.date||!h.start||!h.end)).length;
  add('voorbereiding','helpers',!helpers.length?'onbekend':
    helperOpen||helperWithoutTime?'open':'eigen-klaar',
    !helpers.length?'Geen verhuishulp genoteerd':
      helperOpen||helperWithoutTime?'Hulpplanning vraagt nog aandacht':'Geen open hulpbevestigingen/tijdvakken',
    helpers.length+' afspraken, '+helperOpen+' nog te vragen, '+
      helperWithoutTime+' zonder volledig tijdvak.', '#private-moving-helpers-heading');
  const packing=a.packing.items;
  const toPack=packing.filter(x=>x.status==='Nog inpakken').length;
  const noBox=packing.filter(x=>x.status!=='Uitgepakt'&&!x.box).length;
  const unpacked=packing.filter(x=>x.status==='Uitgepakt').length;
  add('vertrek','pack',!packing.length?'onbekend':toPack?'open':'eigen-klaar',
    !packing.length?'Geen eigen paklijst beschikbaar':
      toPack?toPack+' pakregels nog niet ingepakt':'Geen open inpakregels',
    packing.length+' eigen pakregels; '+unpacked+' als uitgepakt gemarkeerd.',
    '#private-packing-heading');
  add('vertrek','codes',!packing.length?'onbekend':noBox?'open':'eigen-klaar',
    !packing.length?'Dooslabels onbekend':
      noBox?noBox+' open pakregels zonder dooscode':'Eigen open pakregels hebben dooscode',
    'Zonder dooscode ontbreekt een regel in het transportoverzicht.',
    '#private-packing-heading');
  const groups=packingBoxGroups(packing);
  const notLoaded=groups.filter(group=>!a.packing.transport.some(row=>
    row.room===group.room&&row.box===group.box)).length;
  const notDelivered=groups.filter(group=>!a.packing.transport.some(row=>
    row.room===group.room&&row.box===group.box&&row.stage==='afgeleverd')).length;
  add('vertrek','load',!packing.length?'onbekend':notLoaded?'open':'eigen-klaar',
    !packing.length?'Geen eigen transportregistratie':
      notLoaded?notLoaded+' dozen nog niet als geladen gemarkeerd':
      'Actuele dozen hebben een eigen laad-/aflevermarkering',
    groups.length+' gelabelde, niet uitgepakte dozen; geen vervoerdersbewijs.',
    '#private-transport-heading');
  add('aankomst','delivery',!packing.length?'onbekend':notDelivered?'open':'eigen-klaar',
    !packing.length?'Aflevering nog onbekend':
      notDelivered?notDelivered+' dozen nog niet als afgeleverd gemarkeerd':
      'Geen actuele gelabelde dozen zonder aflevermarkering',
    'Zelf ingevulde transportstatus. Uitgepakte regels tellen hier niet mee.',
    '#private-transport-heading');
  const urgent=packing.filter(x=>x.priority&&x.status!=='Uitgepakt').length;
  add('aankomst','urgent',!packing.length?'onbekend':urgent?'open':'eigen-klaar',
    !packing.length?'Prioriteitsartikelen nog onbekend':
      urgent?urgent+' prioriteitsregels nog niet uitgepakt':'Geen eigen open prioriteitsregels',
    'Deze prioriteiten heb je zelf gemarkeerd.','#private-packing-heading');
  add('aankomst','unpack',!packing.length?'onbekend':
    unpacked<packing.length?'open':'eigen-klaar',
    !packing.length?'Uitpakken nog onbekend':
      unpacked<packing.length?(packing.length-unpacked)+' regels nog niet uitgepakt':
      'Alle eigen pakregels als uitgepakt genoteerd',
    unpacked+' van '+packing.length+' eigen pakregels.','#private-packing-heading');
  return result;
}
function moveDayPrivacyReport(lines:MoveDayStep[]):string{
  const result=['WOONPOINTS - EIGEN VERHUISDAGOVERZICHT',
    'Alleen zelf ingevoerde statusindicaties, geen officieel bewijs.',
    'Geen namen, adressen, persoonlijke notities, bedragen of doosinhoud.',''];
  for(const phase of MOVE_DAY_PHASES){
    result.push(phase.name.toUpperCase());
    for(const line of lines.filter(x=>x.phase===phase.id)){
      result.push('['+(line.status==='open'?'ACTIE':
        line.status==='eigen-klaar'?'EIGEN VOORTGANG':'ONBEKEND')+'] '+line.title,
        '  '+line.detail);
    }
    result.push('');
  }
  result.push('Zelf controleren bij betrokken organisaties en personen.',
    'Zelfbewaar of deel deze persoonlijke momentopname uitsluitend bewust.');
  return result.join('\n')+'\n';
}

export function PrivateMovingWorkspace() {
  const [quotes,setQuotes]=useState<MovingWorkspaceArchive['quotes']|null>(null);
  const [expenses,setExpenses]=useState<MovingWorkspaceArchive['expenses']|null>(null);
  const [split,setSplit]=useState<MovingWorkspaceArchive['split']|null>(null);
  const [timeline,setTimeline]=useState<MovingWorkspaceArchiveV2['timeline']|null>(null);
  const [handover,setHandover]=useState<MovingWorkspaceArchiveV2['handover']|null>(null);
  const [documents,setDocuments]=useState<MovingWorkspaceArchiveV2['documents']|null>(null);
  const [packing,setPacking]=useState<MovingWorkspaceArchiveV4['packing']|null>(null);
  const [helpers,setHelpers]=useState<MovingWorkspaceArchiveV5['helpers']|null>(null);
  const [address,setAddress]=useState<MovingWorkspaceArchiveV6['address']|null>(null);
  const [pendingRestore,setPendingRestore]=useState<MovingWorkspaceArchive|MovingWorkspaceArchiveV2|MovingWorkspaceArchiveV3|MovingWorkspaceArchiveV4|MovingWorkspaceArchiveV5|MovingWorkspaceArchiveV6|null>(null);
  const [pendingExport,setPendingExport]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  const [today,setToday]=useState<string|null>(null);
  const [pendingCalendar,setPendingCalendar]=useState<string|null>(null);
  const [calendarPreview,setCalendarPreview]=useState<string|null>(null);
  const [calendarOrigins,setCalendarOrigins]=useState<Array<'planning'|'documents'|'overdracht'|'adres'>>(['planning','documents']);
  const [calendarWhen,setCalendarWhen]=useState<'upcoming'|'all'>('upcoming');
  const [calendarPrivacy,setCalendarPrivacy]=useState<'generic'|'titles'>('generic');
  const [actionScope,setActionScope]=useState<'all'|'urgent'|'dated'|'undated'>('all');
  const [showAllActions,setShowAllActions]=useState(false);
  const [reportSections,setReportSections]=useState<MovingReportSection[]>(['timeline','documents']);
  const [pendingReport,setPendingReport]=useState<string|null>(null);
  const [pendingMoveDay,setPendingMoveDay]=useState<string|null>(null);
  useEffect(()=>{
    let timer:number|undefined;
    function refresh(){
      const now=new Date();
      setToday(movingLocalDate(now));
      if(timer!==undefined)window.clearTimeout(timer);
      timer=window.setTimeout(refresh,msUntilNextLocalMidnight(now)+100);
    }
    refresh();
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    return()=>{
      if(timer!==undefined)window.clearTimeout(timer);
      window.removeEventListener('focus',refresh);
      document.removeEventListener('visibilitychange',refresh);
    };
  },[]);
  useEffect(()=>{
    function capture(event:Event){
      const raw=(event as CustomEvent<unknown>).detail;
      if(!raw||typeof raw!=='object'||Array.isArray(raw))return;
      const item=raw as Record<string,unknown>;
      if(item.version!==1||!item.data||typeof item.data!=='object')return;
      if(item.section==='quotes'){
        const d=item.data as MovingWorkspaceArchive['quotes'];
        if(d && Array.isArray(d.quotes)&&d.quotes.length<=4&&d.quotes.every(validatePrivateQuote))
          setQuotes({quotes:d.quotes,selected:d.selected});
      }else if(item.section==='expenses'){
        const d=item.data as MovingWorkspaceArchive['expenses'];
        if(d && Array.isArray(d.lines)&&d.lines.length<=30&&d.lines.every(validExpenseLine))
          setExpenses({lines:d.lines});
      }else if(item.section==='split'){
        const d=item.data as MovingWorkspaceArchive['split'];
        if(d && Array.isArray(d.members)&&d.members.length>=2&&d.members.length<=4&&
          d.members.every((m,index)=>privateSplitValidMember(m,index)))
          setSplit({members:d.members,total:d.total});
      }else if(item.section==='timeline'){
        if(validMovingWorkspaceTimeline(item.data))setTimeline(item.data);
      }else if(item.section==='handover'){
        if(validMovingWorkspaceHandover(item.data))setHandover(item.data);
      }else if(item.section==='documents'){
        if(validMovingWorkspaceDocuments(item.data))setDocuments(item.data);
      }else if(item.section==='packing'){
        if(validMovingWorkspacePackingV4(item.data))setPacking(item.data);
      }else if(item.section==='helpers'){
        if(validMovingWorkspaceHelpers(item.data))setHelpers(item.data);
      }else if(item.section==='address'){
        if(validMovingWorkspaceAddress(item.data))setAddress(item.data);
      }
    }
    window.addEventListener('woonpoints:moving-workspace:snapshot',capture);
    // A deferred request catches child module subscriptions regardless of
    // sibling effect order, including an initially empty workspace.
    const timer=window.setTimeout(()=>{
      window.dispatchEvent(new Event('woonpoints:moving-workspace:request'));
    },0);
    return ()=>{
      window.clearTimeout(timer);
      window.removeEventListener('woonpoints:moving-workspace:snapshot',capture);
    };
  },[]);
  const complete=quotes!==null&&expenses!==null&&split!==null&&
    timeline!==null&&handover!==null&&documents!==null&&packing!==null&&
    helpers!==null&&address!==null;
  const archive:MovingWorkspaceArchiveV6|null=complete?{
    format:'woonpoints-private-moving-workspace',version:6,
    quotes:quotes!,expenses:expenses!,split:split!,
    timeline:timeline!,handover:handover!,documents:documents!,
    packing:packing!,helpers:helpers!,address:address!
  }:null;
  const signature=archive?privateMovingWorkspaceSignature(archive):'';
  const moveDaySteps=archive?buildMoveDaySteps(archive):[];
  const moveDayReport=moveDayPrivacyReport(moveDaySteps);
  const moveDaySignature=JSON.stringify({signature,moveDayReport});
  const quoteCount=quotes?.quotes.length??0;
  const expenseCount=expenses?.lines.length??0;
  const planned=expenses?.lines.reduce((total,item)=>total+item.plannedCents,0)??0;
  const knownExpenses=expenses?.lines.filter(item=>item.actualCents!==null)??[];
  const actual=knownExpenses.reduce((total,item)=>total+(item.actualCents??0),0);
  const known=knownExpenses.length;
  const selectedQuote=quotes?.quotes.find(q=>q.id===quotes.selected);
  const splitAmount=split?.total?expenseCents(split.total):null;
  const potentialMismatch=splitAmount!==null&&splitAmount!==planned;
  const totalTimelineTasks=timeline?DEFAULT_TASKS.length+timeline.extras.length:0;
  const completeTimelineTasks=timeline?.completed.length??0;
  const handoverCount=handover?Number(!!handover.entries.in)+Number(!!handover.entries.out):0;
  const documentItems=documents?[...READINESS_DEFAULTS,...documents.extras]:[];
  const addressOpen=address?.items.filter(x=>x.status==='Nog regelen').length??0;
  const addressTotal=address?.items.length??0;
  const helperCount=helpers?.helpers.length??0;
  const confirmedHelperCount=helpers?.helpers.filter(item=>item.state==='Bevestigd').length??0;
  const packCount=packing?.items.length??0;
  const unfinishedPack=packing?.items.filter(item=>item.status!=='Uitgepakt').length??0;
  const boxesLoaded=packing?.transport.filter(item=>item.stage==='geladen').length??0;
  const boxesDelivered=packing?.transport.filter(item=>item.stage==='afgeleverd').length??0;
  const relevantDocumentItems=documentItems.filter(doc=>documents?.states[doc.id]!=='skip');
  const readyDocumentItems=relevantDocumentItems.filter(doc=>documents?.states[doc.id]==='ready');
  const actions:PrivateMovingAction[]=[];
  if(timeline){
    if(!timeline.moveDate){
      actions.push({id:'moving-date',title:'Kies zelf een verwachte verhuisdatum',
        due:'',origin:'planning',href:'#private-moving-day-heading'});
    }else{
      for(const task of [...DEFAULT_TASKS,...timeline.extras]){
        if(timeline.completed.includes(task.id))continue;
        actions.push({id:'task-'+task.id,title:task.title,
          due:dayAtOffset(timeline.moveDate,task.offset),
          origin:'planning',href:'#private-moving-day-heading'});
      }
    }
  }
  if(documents){
    for(const doc of documentItems){
      const status=documents.states[doc.id]||'needed';
      if(status==='ready'||status==='skip')continue;
      actions.push({id:'doc-'+doc.id,title:doc.title,
        due:documents.dates[doc.id]||'',origin:'documents',
        href:'#private-document-readiness-heading'});
    }
  }
  if(handover&&timeline?.moveDate){
    if(!handover.entries.in)actions.push({id:'handover-in',
      title:'Controleer je eigen sleutelontvangst en meterstanden',
      due:timeline.moveDate,origin:'overdracht',href:'#private-handover-heading'});
    if(!handover.entries.out)actions.push({id:'handover-out',
      title:'Controleer je eigen sleuteloverdracht en meterstanden',
      due:timeline.moveDate,origin:'overdracht',href:'#private-handover-heading'});
  }
  if(quotes&&quotes.quotes.length>0&&!quotes.selected)
    actions.push({id:'quote-choice',title:'Kies eventueel een eigen voorkeursraming',
      due:'',origin:'offertes',href:'#private-moving-quotes-heading'});
  if(expenses&&expenseCount===0)
    actions.push({id:'expense-start',title:'Maak een eigen raming van je verhuiskosten',
      due:'',origin:'financieel',href:'#private-moving-expenses-heading'});
  else if(expenses&&known<expenseCount)
    actions.push({id:'expense-missing',title:String(expenseCount-known)+
      ' eigen kostenposten hebben nog geen werkelijk bedrag',
      due:'',origin:'financieel',href:'#private-moving-expenses-heading'});
  if(potentialMismatch)
    actions.push({id:'split-difference',title:'Controleer het verschil tussen begroting en verdeeltotaal',
      due:'',origin:'financieel',href:'#private-cost-split-heading'});
  if(address){
    for(const item of address.items){
      if(item.status!=='Nog regelen')continue;
      actions.push({id:'address-'+item.id,title:'Zelf nagaan: '+item.label,
        due:item.date,origin:'adres',href:'#private-address-change-heading'});
    }
  }
  if(helpers&&helpers.helpers.length>0){
    const toAsk=helpers.helpers.filter(item=>item.state==='Nog vragen').length;
    const noTime=helpers.helpers.filter(item=>item.state!=='Afgerond'&&
      (!item.date||!item.start||!item.end)).length;
    if(toAsk)actions.push({id:'helper-confirmations',title:toAsk+
      ' eigen hulpafspraken nog niet bevestigd',due:'',origin:'verhuishulp',
      href:'#private-moving-helpers-heading'});
    if(noTime)actions.push({id:'helper-unscheduled',title:noTime+
      ' hulpafspraken zonder volledig tijdvak',due:'',origin:'verhuishulp',
      href:'#private-moving-helpers-heading'});
  }
  if(packing&&packing.items.length>0){
    const notPacked=packing.items.filter(item=>item.status==='Nog inpakken').length;
    const urgent=packing.items.filter(item=>item.priority&&item.status!=='Uitgepakt').length;
    const missingBoxes=packing.items.filter(item=>item.status!=='Uitgepakt'&&!item.box).length;
    if(notPacked)actions.push({id:'packing-open',title:notPacked+
      ' eigen pakregels nog niet ingepakt',due:'',origin:'inpakken',href:'#private-packing-heading'});
    if(urgent)actions.push({id:'packing-urgent',title:urgent+
      ' eigen prioriteitsregels eerst nodig na aankomst',due:'',origin:'inpakken',href:'#private-packing-heading'});
    if(missingBoxes)actions.push({id:'packing-unlabelled',title:missingBoxes+
      ' pakregels nog zonder doosnummer',due:'',origin:'inpakken',href:'#private-packing-heading'});
  }
  actions.sort((a,b)=>movingActionPriority(a,today)-movingActionPriority(b,today)||
    (a.due||'9999').localeCompare(b.due||'9999')||
    a.title.localeCompare(b.title,'nl-NL'));
  const calendarChoices=[
    {id:'planning',name:'Verhuisplanning',privacy:'Zelfgekozen taaknamen'},
    {id:'documents',name:'Documenten',privacy:'Eigen documentomschrijvingen'},
    {id:'overdracht',name:'Sleuteloverdracht',privacy:'Overdrachtsacties'},
    {id:'adres',name:'Adreswijzigingen',privacy:'Eigen meldpuntnamen'}
  ] as const;
  const dueActions=actions.filter(item=>dateOnly(item.due)!==null&&
    (calendarOrigins as string[]).includes(item.origin)&&
    (calendarWhen==='all'||(today!==null&&item.due>=today)));
  const filteredActions=actions.filter(item=>actionScope==='all'||
    (actionScope==='undated'&&!item.due)||
    (actionScope==='dated'&&!!item.due)||
    (actionScope==='urgent'&&movingActionPriority(item,today)<=2));
  const visibleActions=showAllActions?filteredActions:filteredActions.slice(0,10);
  const overdueCount=actions.filter(item=>movingActionPriority(item,today)===0).length;
  const dueTodayCount=actions.filter(item=>movingActionPriority(item,today)===1).length;
  const dueWeekCount=actions.filter(item=>movingActionPriority(item,today)===2).length;
  const calendarSignature=JSON.stringify({
    signature,today,calendarOrigins,calendarWhen,calendarPrivacy,dueActions
  });
  const reportSignature=JSON.stringify({signature,reportSections,today,calendarSignature});
  const report=archive&&reportSections.length?
    buildPrivateMovingReport(archive,reportSections,actions,today):null;
  function downloadMoveDay(){
    if(!archive||pendingMoveDay!==moveDaySignature||!moveDaySteps.length){
      setPendingMoveDay(null);
      setNotice('Je privégegevens zijn gewijzigd. Bekijk de nieuwste verhuisdagstatus opnieuw.');
      return;
    }
    exportFile('woonpoints-prive-verhuisdagoverzicht.txt',moveDayReport,
      'text/plain;charset=utf-8');
    setPendingMoveDay(null);
    setNotice('Privé-verhuisdagoverzicht lokaal aangeboden zonder naam- of inhoudsgegevens.');
  }
  function downloadPrivateReport(){
    if(!complete||!report||pendingReport!==reportSignature){
      setPendingReport(null);
      setNotice('Het dossier is gewijzigd. Bekijk de tekst en de geselecteerde privé-onderdelen opnieuw.');
      return;
    }
    exportFile('woonpoints-prive-verhuisdossier.txt',report,'text/plain;charset=utf-8');
    setPendingReport(null);
    setNotice('Privé-verhuisdossier lokaal aangeboden. Deel of bewaar het alleen bewust.');
  }
  function prepareCombinedCalendar(){
    if(!complete||!dueActions.length){
      setPendingCalendar(null);setCalendarPreview(null);
      setNotice('Geen eigen, gedateerde acties binnen je geselecteerde agenda-instellingen.');
      return;
    }
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
    const lines=['BEGIN:VCALENDAR','VERSION:2.0',
      'PRODID:-//Woonpoints//Prive Verhuisacties//NL','CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'];
    for(const [index,item] of dueActions.entries()){
      const genericName={
        planning:'Eigen verhuisplanning',documents:'Eigen documentcontrole',
        overdracht:'Eigen sleuteloverdracht',adres:'Eigen adrescontrole'
      }[item.origin as 'planning'|'documents'|'overdracht'|'adres']||'Eigen verhuisactie';
      const title=calendarPrivacy==='titles'?item.title:genericName;
      // Use position-based identifiers instead of raw user task IDs: even the
      // generic privacy mode must not expose custom IDs in calendar metadata.
      lines.push('BEGIN:VEVENT',
        'UID:woonpoints-private-'+String(index+1)+'-'+item.due.replace(/-/g,'')+'@local',
        'DTSTAMP:'+stamp,
        'DTSTART;VALUE=DATE:'+item.due.replace(/-/g,''),
        'DTEND;VALUE=DATE:'+dayAtOffset(item.due,1).replace(/-/g,''),
        'SUMMARY:'+movingCalendarText(title),
        'DESCRIPTION:Eigen, niet geverifieerde Woonpoints-actie. Controleer datum en noodzaak zelf.',
        'END:VEVENT');
    }
    lines.push('END:VCALENDAR','');
    setCalendarPreview(lines.join('\r\n'));
    setPendingCalendar(calendarSignature);setNotice('');
  }
  function saveCombinedCalendar(){
    if(!complete||!pendingCalendar||pendingCalendar!==calendarSignature||
      !calendarPreview||!dueActions.length){
      setPendingCalendar(null);setCalendarPreview(null);
      setNotice('Brongegevens, dag of agendakeuze gewijzigd. Bekijk de exacte export opnieuw.');
      return;
    }
    exportFile('woonpoints-prive-verhuisactiepunten.ics',calendarPreview,
      'text/calendar;charset=utf-8');
    setPendingCalendar(null);setCalendarPreview(null);
    setNotice('Eigen gecontroleerde agenda-ICS aangeboden. Geen extern account of notificatie gebruikt.');
  }

  function exportWorkspace(){
    if(!archive||pendingExport!==signature){
      setPendingExport(null);
      setNotice('Het privé-overzicht is veranderd. Bekijk het exportvoorstel opnieuw.');
      return;
    }
    const json=JSON.stringify(archive,null,2)+'\n';
    const url=URL.createObjectURL(new Blob([json],{type:'application/json;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download='woonpoints-prive-verhuiswerkmap.json';link.rel='noopener';
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),2000);
    setPendingExport(null);
    setNotice('Privé-werkmap lokaal aangeboden. Je gekozen opslaglocatie kan synchroniseren.');
  }
  async function prepareRestore(file:File|undefined){
    setPendingRestore(null);setPendingExport(null);
    if(!file)return;
    if(file.size===0||file.size>65536){
      setNotice('Werkmap afgewezen: het JSON-bestand moet maximaal 64 KiB zijn.');
      return;
    }
    try{
      const raw:unknown=JSON.parse(await file.text());
      if(!validMovingWorkspaceArchive(raw))throw new Error('schema');
      setPendingRestore(raw);
      setNotice('Geldige privé-werkmap gelezen. Niets vervangen totdat je expliciet bevestigt.');
    }catch{
      setNotice('Werkmap afgewezen: onjuiste versie, ontbrekende secties of ongeldige invoer. Bestaande gegevens behouden.');
    }
  }
  function restoreWorkspace(){
    if(!pendingRestore||!validMovingWorkspaceArchive(pendingRestore))return;
    const imported=pendingRestore;
    window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:restore',{
      detail:imported
    }));
    setPendingRestore(null);setPendingExport(null);
    setNotice(imported.version===6?
      'Eigen werkmap v6 hersteld: negen privé-onderdelen inclusief adreswijzigingen. Geen bericht verstuurd.':
      imported.version===5?
      'Oudere werkmap v5 hersteld: acht modules. Bestaande eigen adreswijzigingen behouden.':
      imported.version===4?
      'Oudere werkmap v4 hersteld: zeven modules. Bestaande verhuishulp behouden.':
      imported.version===3?
      'Oudere werkmap v3 hersteld: zeven modules vervangen; transportstatussen zijn leeggemaakt.':
      imported.version===2?
      'Werkmap v2 hersteld: zes oudere modules vervangen, huidige paklijst en transportstatus behouden.':
      'Werkmap v1 hersteld: alleen offertes, kosten en verdeling vervangen; andere gegevens behouden.');
  }
  return (
    <section className="panel" aria-labelledby="private-moving-workspace-heading">
      <p className="eyebrow">VERHUISWERKMAP · LOKAAL IN ÉÉN TABBLAD</p>
      <h2 id="private-moving-workspace-heading">Je verhuisoverzicht in één werkmap</h2>
      <p>Je eigen planning, sleuteloverdracht, documenten, offertes, verhuiskosten,
        kostenverdeling, paklijst/transport, eigen verhuishulp en adreswijzigingen bij elkaar.
        Alle gegevens blijven alleen in dit tabblad;
        er wordt niets naar WoningNet, een leverancier, bank of cloud verstuurd.</p>
      <dl>
        <div><dt>Eigen offertes</dt><dd>{quotes===null?'Nog laden':quoteCount}
          {selectedQuote?' · Eigen keuze: '+selectedQuote.name:''}</dd></div>
        <div><dt>Kostenposten</dt><dd>{expenses===null?'Nog laden':expenseCount}</dd></div>
        <div><dt>Totale eigen begroting</dt><dd>{expenses===null?'Onbekend':expenseAmount(planned)}</dd></div>
        <div><dt>Zelf ingevulde werkelijke bedragen</dt><dd>
          {expenses===null?'Onbekend':expenseAmount(actual)+' ('+known+'/'+expenseCount+' ingevuld)'}</dd></div>
        <div><dt>Te verdelen totaal</dt><dd>{splitAmount===null?'Onbekend':expenseAmount(splitAmount)}</dd></div>
        <div><dt>Verhuisplanning</dt><dd>{timeline===null?'Nog laden':
          completeTimelineTasks+' van '+totalTimelineTasks+' zelf afgevinkt'}</dd></div>
        <div><dt>Sleutel-/meteropnamen</dt><dd>{handover===null?'Nog laden':
          handoverCount+' van 2 eigen opnamen'}</dd></div>
        <div><dt>Eigen documentenstatus</dt><dd>{documents===null?'Nog laden':
          readyDocumentItems.length+' van '+relevantDocumentItems.length+' toepasselijke regels'}</dd></div>
        <div><dt>Eigen paklijst</dt><dd>{packing===null?'Nog laden':
          packCount+' regels · '+unfinishedPack+' nog niet uitgepakt'}</dd></div>
        <div><dt>Eigen verhuisrit</dt><dd>{packing===null?'Nog laden':
          boxesLoaded+' geladen · '+boxesDelivered+' afgeleverd (zelf genoteerd)'}</dd></div>
        <div><dt>Eigen verhuishulp</dt><dd>{helpers===null?'Nog laden':
          helperCount+' afspraken · '+confirmedHelperCount+' zelf bevestigd'}</dd></div>
        <div><dt>Adreswijzigingen</dt><dd>{address===null?'Nog laden':
          addressOpen+' nog regelen · '+addressTotal+' eigen meldpunten'}</dd></div>
      </dl>
      {potentialMismatch&&<p role="status">Het eigen verdeeltotaal wijkt af van de kostenbegroting.
        Controleer zelf wat je wilt verdelen; dit wordt niet automatisch aangepast.</p>}
      {expenses!==null&&known<expenseCount&&<p>
        Er ontbreken nog {expenseCount-known} werkelijke bedrag(en).
        Het getoonde bedrag is daarom geen definitieve verhuistotaalprijs.</p>}
      <div>
        <a href="#private-moving-quotes-heading">Naar offertes</a>{' · '}
        <a href="#private-moving-expenses-heading">Naar kostenboek</a>{' · '}
        <a href="#private-cost-split-heading">Naar kosten delen</a>{' · '}
        <a href="#private-moving-day-heading">Planning</a>{' · '}
        <a href="#private-handover-heading">Sleuteloverdracht</a>{' · '}
        <a href="#private-document-readiness-heading">Documenten</a>{' · '}
        <a href="#private-packing-heading">Paklijst</a>{' · '}
        <a href="#private-moving-helpers-heading">Verhuishulp</a>{' · '}
        <a href="#private-address-change-heading">Adreswijzigingen</a>
      </div>


      <section aria-labelledby="private-move-day-readiness-heading">
        <h3 id="private-move-day-readiness-heading">Mijn verhuisdag · voorbereiden, vertrekken, aankomen</h3>
        <p>Dit overzicht verbindt je eigen planning, documenten, hulp, dozen en
          laad-/aflevermarkeringen. Het laat acties en ontbrekende gegevens apart
          zien. Een groen eigen vinkje is nooit een officiële goedkeuring,
          werkelijke levering of bevestiging van een helper.</p>
        {!complete&&<p>De privé-werkmap verzamelt nog gegevens uit de acht onderdelen.
          Niets wordt op de achtergrond opgeslagen.</p>}
        {complete&&MOVE_DAY_PHASES.map(phase=>{
          const rows=moveDaySteps.filter(step=>step.phase===phase.id);
          const open=rows.filter(step=>step.status==='open').length;
          const missing=rows.filter(step=>step.status==='onbekend').length;
          return <div key={phase.id}>
            <h4>{phase.name}</h4>
            <p>{open} zelf na te kijken · {missing} onbekend ·
              {' '+rows.filter(step=>step.status==='eigen-klaar').length}
              {' '}onderdelen volgens eigen invoer afgewerkt.</p>
            <ul>{rows.map(step=><li key={step.id}>
              <strong>{step.status==='open'?'Nog regelen: ':
                step.status==='onbekend'?'Onbekend: ':'Eigen voortgang: '}
                {step.title}</strong>
              <p>{step.detail} <a href={step.href}>Werk dit onderdeel bij</a></p>
            </li>)}</ul>
          </div>;
        })}
        <p>De momentopname bevat uitsluitend geaggregeerde statusregels.
          Er worden geen persoonsnamen, bedragen, privéadressen, doosinhoud of
          originele notities geëxporteerd. Je opslaglocatie kan synchroniseren.</p>
        <button type="button" disabled={!complete} onClick={()=>{
          setPendingMoveDay(moveDaySignature);setNotice('');
        }}>Bekijk mijn privé-verhuisdagoverzicht als TXT…</button>
        {archive&&pendingMoveDay===moveDaySignature&&
          <div role="group" aria-label="Bevestig geanonimiseerd verhuisdagoverzicht">
            <p>Controleer vóór opslag de volledige tekst. Dit is een door jou
              gemaakte overzichtsnotitie, geen bewijs van vertrek of aankomst.</p>
            <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
              maxHeight:'25rem',overflowY:'auto'}}>{moveDayReport}</pre>
            <button type="button" onClick={downloadMoveDay}>
              Bevestig lokale TXT-download
            </button>
            <button type="button" onClick={()=>setPendingMoveDay(null)}>Annuleren</button>
          </div>}
      </section>

      <section aria-labelledby="private-moving-actions-heading">
        <h3 id="private-moving-actions-heading">Wat wil je nog zelf regelen?</h3>
        <p>Eigen actieoverzicht, geen officiële toewijzing of deadline.
          {today?' Vandaag in je lokale tijd: '+today+'.':''}
          <strong> {overdueCount} voorbij, {dueTodayCount} vandaag en {dueWeekCount}
          binnen zeven dagen</strong> op basis van je zelfgekozen datums.</p>
        {!complete&&<p>Het privé-overzicht verzamelt de huidige formulierstanden.</p>}
        {complete&&!actions.length&&<p>Geen open punten op basis van deze eigen invoer.
          Dit betekent niet dat alle officiële verplichtingen zijn gecontroleerd.</p>}
        <div role="group" aria-label="Filter persoonlijke verhuisacties"
          style={{display:'flex',flexWrap:'wrap',gap:8,margin:'12px 0'}}>
          {([
            ['all','Alles'],['urgent','Verlopen, vandaag en komende week'],
            ['dated','Met datum'],['undated','Zonder datum']
          ] as const).map(([id,label])=><button key={id} type="button"
            aria-pressed={actionScope===id}
            onClick={()=>{setActionScope(id);setShowAllActions(false);}}
            style={{minHeight:44,padding:'8px 12px',
              border:'1px solid #355e42',borderRadius:8,
              background:actionScope===id?'#355e42':'white',
              color:actionScope===id?'white':'#355e42'}}>{label}</button>)}
        </div>
        <p role="status">{filteredActions.length} van {actions.length} eigen acties in deze selectie.</p>
        <ol>{visibleActions.map(action=><li key={action.id}>
          <strong>{action.title}</strong>{action.due?' · '+action.due:' · geen eigen datum'}
          {movingActionPriority(action,today)===0?' · zelf gekozen datum voorbij':
            movingActionPriority(action,today)===1?' · zelf gekozen datum vandaag':
            movingActionPriority(action,today)===2?' · binnen zeven dagen':''}
          {' · '}<a href={action.href}>Open onderdeel</a>
        </li>)}</ol>
        {filteredActions.length>10&&<button type="button"
          onClick={()=>setShowAllActions(!showAllActions)}
          style={{minHeight:44,margin:'8px 0'}}>
          {showAllActions?'Toon alleen de eerste tien':'Toon alle '+filteredActions.length+' eigen acties'}
        </button>}
        <section aria-labelledby="private-workspace-calendar-heading">
          <h4 id="private-workspace-calendar-heading">Mijn veilige privé-agenda samenstellen</h4>
          <p>Kies bewust welke soorten eigen acties meegaan in een lokaal ICS-bestand.
            Alleen je nog open zelfgedateerde acties worden meegenomen. Standaard zijn
            officiële adressen, vrije taaknamen en identiteiten niet opgenomen:
            de agenda toont dan neutrale actietitels per categorie. Geen verzonden notificaties,
            accountverbindingen of officiële termijnen.</p>
          <fieldset>
            <legend>Kies welke privé-onderdelen je in je agenda wilt</legend>
            {calendarChoices.map(choice=><label key={choice.id} style={{display:'block',margin:'8px 0'}}>
              <input type="checkbox" checked={calendarOrigins.includes(choice.id)}
                onChange={event=>{
                  setCalendarOrigins(current=>event.target.checked?
                    [...current,choice.id]:current.filter(id=>id!==choice.id));
                  setPendingCalendar(null);setCalendarPreview(null);
                }}/>
              {choice.name} <small>({choice.privacy})</small>
            </label>)}
          </fieldset>
          <fieldset>
            <legend>Welke eigen controledatums?</legend>
            <label style={{display:'block'}}>
              <input type="radio" name="private-moving-calendar-range"
                checked={calendarWhen==='upcoming'} onChange={()=>{
                  setCalendarWhen('upcoming');setPendingCalendar(null);setCalendarPreview(null);
                }}/> Vandaag en later (standaard)
            </label>
            <label style={{display:'block'}}>
              <input type="radio" name="private-moving-calendar-range"
                checked={calendarWhen==='all'} onChange={()=>{
                  setCalendarWhen('all');setPendingCalendar(null);setCalendarPreview(null);
                }}/> Ook verstreken eigen datums
            </label>
          </fieldset>
          <fieldset>
            <legend>Privacy van agendatitels</legend>
            <label style={{display:'block'}}>
              <input type="radio" name="private-moving-calendar-privacy"
                checked={calendarPrivacy==='generic'} onChange={()=>{
                  setCalendarPrivacy('generic');setPendingCalendar(null);setCalendarPreview(null);
                }}/> Neutrale titels, zonder zelf ingevoerde taaknamen (standaard)
            </label>
            <label style={{display:'block'}}>
              <input type="radio" name="private-moving-calendar-privacy"
                checked={calendarPrivacy==='titles'} onChange={()=>{
                  setCalendarPrivacy('titles');setPendingCalendar(null);setCalendarPreview(null);
                }}/> Mijn eigen taaknamen in de agenda (kan privé-informatie bevatten)
            </label>
          </fieldset>
          <p role="status">{dueActions.length} open, zelfgedateerde acties in deze selectie.
            {' '}Alles blijft in het huidige tabblad totdat jij bewust exporteert.</p>
          <button type="button" disabled={!complete||!dueActions.length}
            onClick={prepareCombinedCalendar} style={{minHeight:44}}>
            Bekijk exacte agenda-inhoud ({dueActions.length} acties)…
          </button>
          {pendingCalendar===calendarSignature&&calendarPreview&&dueActions.length>0&&
            <div role="group" aria-label="Bevestig gecontroleerde privé-agenda">
              <p>Controleer hieronder de exacte kalenderbron, inclusief datums,
                titels en technische event-identificaties. De gekozen opslaglocatie
                kan agenda-inhoud synchroniseren. Dit bestand wordt niet verstuurd.</p>
              <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
                maxHeight:'25rem',overflowY:'auto'}}>{calendarPreview}</pre>
              <button type="button" onClick={saveCombinedCalendar}>
                Bevestig download van deze exacte ICS
              </button>
              <button type="button" onClick={()=>{
                setPendingCalendar(null);setCalendarPreview(null);
              }}>Annuleren</button>
            </div>}
          {pendingCalendar!==null&&pendingCalendar!==calendarSignature&&<p role="status">
            Je gegevens of de kalenderdag zijn gewijzigd. De eerdere goedkeuring
            is vervallen; bekijk de nieuwe agenda voordat je downloadt.
          </p>}
        </section>
      </section>
      <section aria-labelledby="private-moving-report-heading">
        <h3 id="private-moving-report-heading">Maak een leesbaar verhuisdossier</h3>
        <p>Bundel geselecteerde onderdelen en je resterende eigen acties in één leesbaar
          TXT-bestand, bijvoorbeeld voor een gesprek met een huisgenoot. Je bepaalt
          welke privégegevens meegaan. De tekst wordt niet verzonden of automatisch bewaard.</p>
        <fieldset>
          <legend>Kies expliciet welke onderdelen in de tekst mogen</legend>
          {MOVING_REPORT_SECTIONS.map(section=><label key={section.id} style={{display:'block'}}>
            <input type="checkbox" checked={reportSections.includes(section.id)}
              onChange={event=>{
                setReportSections(previous=>event.target.checked?
                  [...previous,section.id]:previous.filter(id=>id!==section.id));
                setPendingReport(null);setNotice('');
              }} />
            {section.label} <small>({section.warning})</small>
          </label>)}
        </fieldset>
        <button type="button" disabled={!complete||!reportSections.length} onClick={()=>{
          setPendingReport(reportSignature);setNotice('');
        }}>Bekijk geselecteerd privé-verhuisdossier…</button>
        {report&&pendingReport===reportSignature&&<div role="group"
          aria-label="Controleer privé-verhuisdossier voor download">
          <p>Controleer de exacte tekst hieronder vóór je het bestand opslaat.
            Geselecteerde namen, notities, bedragen en meterstanden kunnen privacygevoelig zijn.</p>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
            maxHeight:'28rem',overflowY:'auto'}}>{report}</pre>
          <button type="button" onClick={downloadPrivateReport}>Bevestig privé-TXT-download</button>
          <button type="button" onClick={()=>setPendingReport(null)}>Annuleren</button>
        </div>}
      </section>
      <h3>Je eigen volledige werkmap bewaren</h3>
      <p>Deze gecombineerde privé-JSON bevat ook alle zelf ingevoerde namen, notities,
        betaalbedragen, offertes, verhuisdata, sleutel- en meterstanden, documentenstatus
        en de eigen kamer-/doospaklijst, hulpafspraken en adreswijzigingen.
        Niets wordt op de achtergrond opgeslagen.
        Sla alleen bewust op en controleer of je opslaglocatie synchroniseert.</p>
      <button type="button" disabled={!complete} onClick={()=>{
        setPendingExport(signature);setNotice('');
      }}>Bekijk gecombineerde privé-JSON-export…</button>
      {archive&&pendingExport===signature&&<div role="group" aria-label="Bevestig gecombineerde werkmap-export">
        <p>Versie 6 bevat <strong>{quoteCount} offerte(s)</strong>,
          <strong> {expenseCount} kostenpost(en)</strong>,
          <strong> {split!.members.length} deelnemers</strong>,
          <strong> {totalTimelineTasks} geplande taken</strong>,
          <strong> {handoverCount} opname(n)</strong> en
          <strong> {documentItems.length} documentenregels</strong> en
          <strong> {packCount} pakregels</strong> en
          <strong> {boxesLoaded+boxesDelivered} handmatige transportmarkeringen</strong> en
          <strong> {helperCount} privé-hulpafspraken</strong> en
          <strong> {addressTotal} eigen meldpunten</strong>.
          Ook persoonlijke roepnamen, controledatums, notities, meterstanden en dooslabels
          worden mee geëxporteerd.</p>
        <button type="button" onClick={exportWorkspace}>Bevestig volledige JSON-download</button>
        <button type="button" onClick={()=>setPendingExport(null)}>Annuleren</button>
      </div>}
      <label htmlFor="private-moving-workspace-upload">Herstel eigen werkmap v1, v2, v3, v4, v5 of v6 (JSON, maximaal 64 KiB)</label>
      <input id="private-moving-workspace-upload" type="file" accept=".json,application/json"
        onChange={event=>{
          const file=event.currentTarget.files?.[0];
          event.currentTarget.value='';
          void prepareRestore(file);
        }} />
      {pendingRestore&&<div role="group" aria-label="Bevestig volledige privé-werkmap herstellen">
        <p>Werkmap <strong>versie {pendingRestore.version}</strong> bevat
          <strong> {pendingRestore.quotes.quotes.length} offerte(s)</strong>,
          <strong> {pendingRestore.expenses.lines.length} kostenpost(en)</strong> en
          <strong> {pendingRestore.split.members.length} deelnemers</strong>.
          {pendingRestore.version===6?
            ' Deze v6-back-up vervangt negen onderdelen, inclusief '+
            pendingRestore.address.items.length+
            ' eigen adres-/contractpunten en alle eerdere privégegevens, ook onbewaarde invoer.':
            pendingRestore.version===5?
            ' Deze oudere v5-back-up vervangt acht onderdelen, inclusief '+
            pendingRestore.helpers.helpers.length+
            ' eigen hulpafspraken, laadstatussen en mogelijk onbewaarde invoer.':
            pendingRestore.version===4?
            ' Deze oudere v4-back-up vervangt zeven onderdelen, '+
            pendingRestore.packing.items.length+
            ' pakregels en '+pendingRestore.packing.transport.length+
            ' eigen laad-/aflevermarkeringen. Ook onbewaarde invoer wordt vervangen.':
            pendingRestore.version===3?
            ' Deze oudere v3-back-up vervangt zeven onderdelen en de paklijst; huidige transportstatussen worden gewist omdat v3 ze niet bevat.':
            pendingRestore.version===2?
            ' Deze oudere v2-werkmap vervangt zes onderdelen inclusief onbewaarde invoer. De huidige paklijst en transportstatus blijven behouden.':
            ' Deze oudere v1-werkmap vervangt alleen drie onderdelen; planning, overdracht, documenten, paklijst en transportstatus blijven behouden.'}
          Een eerder opgeslagen bestand blijft ongewijzigd.</p>
        <button type="button" onClick={restoreWorkspace}>Bevestig complete werkmap vervangen</button>
        <button type="button" onClick={()=>{
          setPendingRestore(null);setNotice('Herstel geannuleerd. Alle huidige onderdelen behouden.');
        }}>Annuleren</button>
      </div>}
      {notice&&<p role="status">{notice}</p>}
      <p>De werkmap bevestigt geen echte betaling, contract, WoningNet-registratie
        of verhuisafspraak. Sluiten van het tabblad wist niet-geëxporteerde wijzigingen.</p>
    </section>
  );
}


const ROOMS = ['Woonkamer','Keuken','Slaapkamer','Badkamer','Hal',
  'Werkkamer','Berging','Balkon','Overig'] as const;
const STATES = ['Nog inpakken','Ingepakt','Uitgepakt'] as const;
type Room = (typeof ROOMS)[number];
type PackingState = (typeof STATES)[number];
type PackingItem = {
  id:string;label:string;room:Room;quantity:number;box:string;
  priority:boolean;status:PackingState;
};
type PackingTransportStage='geladen'|'afgeleverd';
type PackingTransportRow={room:Room;box:string;stage:PackingTransportStage};
type PackingTransportState={stage:PackingTransportStage;fingerprint:string};
type PackingArchive =
  | {format:'woonpoints-private-packing-list';version:1;items:PackingItem[]}
  | {format:'woonpoints-private-packing-list';version:2;items:PackingItem[];transport:PackingTransportRow[]};
type FormState = {label:string;room:Room;quantity:string;box:string;priority:boolean;status:PackingState};
const blank = ():FormState=>({
  label:'',room:'Woonkamer',quantity:'1',box:'',priority:false,status:'Nog inpakken'
});
const CONTROL = /[\u0000-\u001f\u007f]/;
function cleanText(raw:string):string{return raw.trim();}
function validItem(raw:unknown):raw is PackingItem{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const row=raw as Record<string,unknown>;
  if(Object.keys(row).sort().join('|')!=='box|id|label|priority|quantity|room|status')return false;
  return typeof row.id==='string'&&/^item-[0-9]+-[0-9]+$/.test(row.id)&&
    typeof row.label==='string'&&row.label===row.label.trim()&&
    row.label.length>0&&row.label.length<=60&&!CONTROL.test(row.label)&&
    typeof row.box==='string'&&row.box===row.box.trim()&&
    row.box.length<=30&&!CONTROL.test(row.box)&&
    ROOMS.includes(row.room as Room)&&STATES.includes(row.status as PackingState)&&
    typeof row.priority==='boolean'&&typeof row.quantity==='number'&&
    Number.isInteger(row.quantity)&&row.quantity>=1&&row.quantity<=99;
}
function validArchive(raw:unknown):raw is PackingArchive{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const obj=raw as Record<string,unknown>;
  const isV2=obj.version===2;
  if(Object.keys(obj).sort().join('|')!==(isV2?'format|items|transport|version':'format|items|version')||
    obj.format!=='woonpoints-private-packing-list'||(obj.version!==1&&!isV2)||
    !Array.isArray(obj.items)||obj.items.length>80||
    !obj.items.every(validItem))return false;
  const items=obj.items as PackingItem[];
  if(new Set(items.map(item=>item.id)).size!==items.length)return false;
  if(!isV2)return true;
  if(!Array.isArray(obj.transport)||obj.transport.length>80)return false;
  const boxes=new Set(packingBoxGroups(items).map(group=>JSON.stringify([group.room,group.box])));
  const keys=new Set<string>();
  for(const raw of obj.transport){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
    const row=raw as Record<string,unknown>;
    if(Object.keys(row).sort().join('|')!=='box|room|stage'||
      typeof row.room!=='string'||!ROOMS.includes(row.room as Room)||
      typeof row.box!=='string'||!row.box||row.box.length>30||
      CONTROL.test(row.box)||row.box!==row.box.trim()||
      (row.stage!=='geladen'&&row.stage!=='afgeleverd'))return false;
    const key=JSON.stringify([row.room,row.box]);
    if(!boxes.has(key)||keys.has(key))return false;
    keys.add(key);
  }
  return true;
}
function downloadPrivateFile(name:string,content:string,mime:string){
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const anchor=document.createElement('a');
  anchor.href=url;anchor.download=name;anchor.rel='noopener';
  document.body.appendChild(anchor);anchor.click();anchor.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function packingReport(items:PackingItem[]):string{
  const lines=[
    'WOONPOINTS - PRIVÉ PAKLIJST',
    'Zelf ingevoerde spullen en dozen. Geen garantie op volledigheid of verhuizing.',
    'Totaal '+items.length+' regels; '+items.reduce((n,item)=>n+item.quantity,0)+' stuks.',
    'Eerst nodig: '+items.filter(item=>item.priority&&item.status!=='Uitgepakt').length+
      ' nog niet uitgepakte regels.',''
  ];
  for(const room of ROOMS){
    const matching=items.filter(item=>item.room===room)
      .sort((a,b)=>Number(b.priority)-Number(a.priority)||a.label.localeCompare(b.label,'nl-NL'));
    if(!matching.length)continue;
    lines.push('=== '+room.toUpperCase()+' ===');
    for(const item of matching){
      lines.push('['+item.status+'] '+item.quantity+' × '+item.label+
        (item.box?' - doos: '+item.box:'')+(item.priority?' - DIRECT NODIG':''));
    }
    lines.push('');
  }
  lines.push('Dit is een lokale persoonlijke lijst, geen officiële inventaris of verzekeringsoverzicht.',
    'Bewaar en deel deze gegevens alleen bewust.');
  return lines.join('\n')+'\n';
}


type PackingBoxGroup={room:Room;box:string;items:PackingItem[]};
function packingBoxGroups(items:PackingItem[]):PackingBoxGroup[]{
  const groups:PackingBoxGroup[]=[];
  for(const item of items){
    // Unpacked entries no longer belong on a current box label.
    if(!item.box||item.status==='Uitgepakt')continue;
    let group=groups.find(g=>g.room===item.room&&g.box===item.box);
    if(!group){group={room:item.room,box:item.box,items:[]};groups.push(group);}
    group.items.push(item);
  }
  return groups.sort((a,b)=>a.room.localeCompare(b.room,'nl-NL')||
    a.box.localeCompare(b.box,'nl-NL'));
}

function packingTransportKey(group:PackingBoxGroup):string{
  return JSON.stringify([group.room,group.box]);
}
function packingTransportFingerprint(group:PackingBoxGroup):string{
  // Bound to exactly the current not-yet-unpacked contents: a stale stamp
  // must never silently confirm different quantities, priorities or labels.
  return JSON.stringify(group.items.map(item=>[
    item.id,item.label,item.quantity,item.priority,item.status
  ]).sort((a,b)=>String(a[0]).localeCompare(String(b[0]))));
}
function packingCurrentTransport(
  groups:PackingBoxGroup[],state:Record<string,PackingTransportState>
):PackingTransportRow[]{
  return groups.flatMap(group=>{
    const current=state[packingTransportKey(group)];
    return current&&current.fingerprint===packingTransportFingerprint(group)?
      [{room:group.room,box:group.box,stage:current.stage}]:[];
  });
}
function packingRestoreTransport(
  items:PackingItem[],rows:PackingTransportRow[]
):Record<string,PackingTransportState>{
  const states:Record<string,PackingTransportState>={};
  for(const group of packingBoxGroups(items)){
    const row=rows.find(item=>item.room===group.room&&item.box===group.box);
    if(row)states[packingTransportKey(group)]={
      stage:row.stage,fingerprint:packingTransportFingerprint(group)
    };
  }
  return states;
}
function packingTransportReport(
  groups:PackingBoxGroup[],entries:PackingTransportRow[],
  withContents:boolean
):string{
  const lines=['WOONPOINTS - EIGEN VERHUISTRANSPORTOVERZICHT',
    'Handmatig ingevulde laad- en aflevermarkeringen; niet extern geverifieerd.',
    'Totaal '+groups.length+' dozen; '+
      entries.filter(row=>row.stage==='geladen').length+' als geladen en '+
      entries.filter(row=>row.stage==='afgeleverd').length+' als afgeleverd gemarkeerd.',''];
  for(const group of groups){
    const stage=entries.find(row=>row.room===group.room&&row.box===group.box)?.stage||'nog laden';
    const urgent=group.items.some(item=>item.priority);
    lines.push('['+stage+'] '+group.room+' / doos '+group.box+
      ' - '+group.items.length+' regels - '+
      group.items.reduce((n,item)=>n+item.quantity,0)+' stuks'+
      (urgent?' - EERST NODIG':''));
    if(withContents)for(const item of group.items){
      lines.push('  '+item.quantity+' x '+item.label+
        (item.priority?' - eerst nodig':''));
    }
  }
  lines.push('','Dozen zonder eigen dooscode en al uitgepakte regels staan hier niet in.',
    'Geen laadbewijs, bezorgbewijs, verzekeringsinventaris of officiële verhuismelding.',
    'Eigen labels kunnen privacygevoelig zijn. Bewaar en deel dit document bewust.');
  return lines.join('\n')+'\n';
}
function packingHtmlText(value:string):string{
  return value.replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function packingPrintLabels(groups:PackingBoxGroup[],showContents:boolean):string{
  const cards=groups.map(group=>{
    const total=group.items.reduce((n,item)=>n+item.quantity,0);
    const priority=group.items.some(item=>item.priority);
    const content=showContents?
      '<ul>'+group.items.map(item=>'<li>'+packingHtmlText(String(item.quantity)+' × '+item.label)+
        (item.priority?' <strong>· eerst nodig</strong>':'')+'</li>').join('')+'</ul>':'';
    return '<article class="label"><p class="eyebrow">EIGEN VERHUISDOOS</p>'+
      '<h2>'+packingHtmlText(group.box)+'</h2>'+
      '<p class="room">'+packingHtmlText(group.room)+'</p>'+
      '<p>'+group.items.length+' eigen regels · '+total+' stuks</p>'+
      (priority?'<p class="priority">EERST NODIG</p>':'')+
      content+'</article>';
  }).join('\n');
  return '<!doctype html>\n<html lang="nl"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;; base-uri &#39;none&#39;; form-action &#39;none&#39;">'+
    '<title>Eigen Woonpoints-dozenlabels</title>'+
    '<style>@page{size:A4;margin:12mm}*{box-sizing:border-box}'+
    'body{font-family:Arial,sans-serif;margin:0;color:#111}header{padding:10mm 0 5mm}'+
    '.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6mm}'+
    '.label{border:2px solid #222;border-radius:3mm;padding:6mm;min-height:68mm;'+
    'break-inside:avoid;overflow-wrap:anywhere}'+
    '.eyebrow{font-size:10pt;letter-spacing:.08em}h1{font-size:16pt}'+
    'h2{font-size:22pt;margin:4mm 0}p{margin:2mm 0}'+
    '.room{font-size:16pt;font-weight:bold}.priority{font-weight:bold;border:2px solid #111;'+
    'padding:2mm;display:inline-block}ul{padding-left:5mm;font-size:10pt}li{margin:1mm 0}'+
    'footer{padding:6mm 0;font-size:9pt}@media print{header{display:none}}'+
    '</style></head><body><header><h1>Eigen dozenlabels · printvoorbeeld</h1>'+
    '<p>Privé samengesteld; kies in je browser Afdrukken. Geen adres, opslag of synchronisatie.</p></header>'+
    '<main class="grid">'+cards+'</main>'+
    '<footer>Zelfgetypte gegevens; controleer dozen en inhoud vóór gebruik.</footer></body></html>\n';
}

/** Entirely ephemeral room-by-room packing board. No account, worker or API calls. */
export function PrivateMovingPackingInventory(){
  const [items,setItems]=useState<PackingItem[]>([]);
  const [form,setForm]=useState<FormState>(blank);
  const [editing,setEditing]=useState<string|null>(null);
  const [roomFilter,setRoomFilter]=useState<Room|'Alle kamers'>('Alle kamers');
  const [stateFilter,setStateFilter]=useState<PackingState|'Alle statussen'>('Alle statussen');
  const [pendingDelete,setPendingDelete]=useState<string|null>(null);
  const [confirmClear,setConfirmClear]=useState(false);
  const [pendingExport,setPendingExport]=useState<{kind:'json'|'txt';signature:string}|null>(null);
  const [pendingRestore,setPendingRestore]=useState<PackingArchive|null>(null);
  const [pendingRestoreSource,setPendingRestoreSource]=useState<string|null>(null);
  const [restoreUndo,setRestoreUndo]=useState<{
    previousItems:PackingItem[];
    previousTransport:Record<string,PackingTransportState>;
    importedSignature:string;
  }|null>(null);
  const pendingArchiveSequence=useRef(0);
  const [showLabelContents,setShowLabelContents]=useState(false);
  const [pendingLabels,setPendingLabels]=useState<string|null>(null);
  const [transport,setTransport]=useState<Record<string,PackingTransportState>>({});
  const [showManifestContents,setShowManifestContents]=useState(false);
  const [pendingManifest,setPendingManifest]=useState<string|null>(null);
  const [pendingDeparture,setPendingDeparture]=useState<string|null>(null);
  const [notice,setNotice]=useState('');
  useEffect(()=>{
    const publish=()=>window.dispatchEvent(new CustomEvent('woonpoints:moving-workspace:snapshot',{
      detail:{version:1,section:'packing',data:{
        items,transport:packingCurrentTransport(packingBoxGroups(items),transport)
      }}
    }));
    window.addEventListener('woonpoints:moving-workspace:request',publish);
    publish();
    return()=>window.removeEventListener('woonpoints:moving-workspace:request',publish);
  },[items,transport]);
  useEffect(()=>{
    function restore(event:Event){
      const imported=(event as CustomEvent<unknown>).detail;
      if(!validMovingWorkspaceArchive(imported)||
        (imported.version!==3&&imported.version!==4&&
          imported.version!==5&&imported.version!==6))return;
      setItems(imported.packing.items);setForm(blank());setEditing(null);
      setPendingDelete(null);setConfirmClear(false);setPendingExport(null);
      pendingArchiveSequence.current++;
      setPendingRestore(null);setPendingLabels(null);
      setRestoreUndo(null);setPendingRestoreSource(null);
      setTransport(imported.version===4||imported.version===5||imported.version===6?
        packingRestoreTransport(imported.packing.items,imported.packing.transport):{});
      setPendingManifest(null);
      setNotice(imported.version>=4?
        'Paklijst en eigen transportmarkeringen uit v4/v5/v6-werkmap hersteld.':
        'Oude v3-paklijst hersteld. Niet-bewaarde transportmarkeringen zijn leeggemaakt.');
    }
    window.addEventListener('woonpoints:moving-workspace:restore',restore);
    return()=>window.removeEventListener('woonpoints:moving-workspace:restore',restore);
  },[]);
  const sequence=useRef(0);
  const signature=JSON.stringify(items);
  const fullPackingSignature=JSON.stringify({items,transport});
  const canApplyRestore=pendingRestore!==null&&pendingRestoreSource===fullPackingSignature;
  const canUndoRestore=restoreUndo!==null&&
    restoreUndo.importedSignature===fullPackingSignature;
  const total=items.reduce((sum,item)=>sum+item.quantity,0);
  const packed=items.filter(item=>item.status!=='Nog inpakken').length;
  const unpacked=items.filter(item=>item.status==='Uitgepakt').length;
  const urgent=items.filter(item=>item.priority&&item.status!=='Uitgepakt');
  const visible=useMemo(()=>items.filter(item=>
    (roomFilter==='Alle kamers'||item.room===roomFilter)&&
    (stateFilter==='Alle statussen'||item.status===stateFilter)
  ).sort((a,b)=>Number(b.priority)-Number(a.priority)||
    a.room.localeCompare(b.room,'nl-NL')||a.label.localeCompare(b.label,'nl-NL')),
  [items,roomFilter,stateFilter]);
  const report=packingReport(items);
  const boxGroups=packingBoxGroups(items);
  const transportEntries=packingCurrentTransport(boxGroups,transport);
  const loadedCount=transportEntries.filter(row=>row.stage==='geladen').length;
  const deliveredCount=transportEntries.filter(row=>row.stage==='afgeleverd').length;
  const manifestSignature=JSON.stringify({signature,transportEntries,showManifestContents});
  const manifest=packingTransportReport(boxGroups,transportEntries,showManifestContents);
  const labelSignature=JSON.stringify({signature,showLabelContents});
  const unlabelled=items.filter(item=>item.status!=='Uitgepakt'&&!item.box).length;
  const duplicateCodes=[...new Set(boxGroups.map(group=>group.box))]
    .filter(box=>new Set(boxGroups.filter(group=>group.box===box).map(group=>group.room)).size>1);
  // Departure readiness is derived from current manual inventory and transport state.
  // Never persist or represent this as verified delivery, a courier scan, or a permit.
  const departureNotPacked=items.filter(item=>item.status==='Nog inpakken');
  const departureUnlabelled=items.filter(item=>item.status!=='Uitgepakt'&&!item.box);
  const departureWaiting=boxGroups.filter(group=>!transportEntries.some(row=>
    row.room===group.room&&row.box===group.box&&
    (row.stage==='geladen'||row.stage==='afgeleverd')));
  const departurePriorityWaiting=departureWaiting.filter(group=>
    group.items.some(item=>item.priority&&item.status!=='Uitgepakt'));
  const departureReady=items.length>0&&departureNotPacked.length===0&&
    departureUnlabelled.length===0&&departureWaiting.length===0&&duplicateCodes.length===0;
  const departureSignature=JSON.stringify({items,transportEntries});
  const departureReport=[
    'WOONPOINTS — EIGEN VERHUISVERTREKCONTROLE',
    'Alleen zelf genoteerde gegevens; geen vervoerder-, verhuurder- of WoningNet-bevestiging.',
    'Status volgens huidige eigen invoer: '+(departureReady?'Geen open blokkades':'Nog open controlepunten'),
    'Pakregels: '+items.length+' · Doosgroepen: '+boxGroups.length,
    'Nog in te pakken regels: '+departureNotPacked.length,
    'Regels zonder dooslabel (niet uitgepakt): '+departureUnlabelled.length,
    'Doosgroepen nog niet als geladen of afgeleverd gemarkeerd: '+departureWaiting.length,
    'Eerst benodigde doosgroepen nog niet als geladen genoteerd: '+departurePriorityWaiting.length,
    'Dooscodes in meerdere kamers: '+duplicateCodes.length,
    '',
    'NOG IN TE PAKKEN (EIGEN REGELS)',
    ...departureNotPacked.map(item=>item.room+' · '+item.quantity+' × '+item.label),
    '',
    'ZONDER DOOSLABEL (EIGEN REGELS)',
    ...departureUnlabelled.map(item=>item.room+' · '+item.quantity+' × '+item.label),
    '',
    'NOG NIET ALS GELADEN GENOTEERDE DOOSGROEPEN',
    ...departureWaiting.map(group=>group.room+' · doos '+group.box+
      (group.items.some(item=>item.priority&&item.status!=='Uitgepakt')?' · EERST NODIG':'')),
    '',
    'DUBBELE DOOSCODES TUSSEN KAMERS',
    ...duplicateCodes,
    '',
    'Dit bestand is een persoonlijke checklist. Controleer alle spullen zelf.'
  ].join('\n')+'\n';
  function savePrivateLabels(){
    if(!boxGroups.length||pendingLabels!==labelSignature){
      setPendingLabels(null);
      setNotice('De dozen of labelkeuze zijn gewijzigd. Controleer het labelvoorbeeld opnieuw.');
      return;
    }
    downloadPrivateFile('woonpoints-prive-dozenlabels.html',
      packingPrintLabels(boxGroups,showLabelContents),'text/html;charset=utf-8');
    setPendingLabels(null);
    setNotice('Lokaal printbaar HTML-bestand aangeboden. Open het zelf om af te drukken.');
  }
  const resetPending=()=>{
    setPendingExport(null);setPendingRestore(null);setPendingRestoreSource(null);setPendingDelete(null);
    setPendingLabels(null);setPendingManifest(null);setPendingDeparture(null);
    setConfirmClear(false);setNotice('');
  };
  function stampTransport(group:PackingBoxGroup,stage:PackingTransportStage|null){
    const key=packingTransportKey(group);
    if(stage!==null&&group.items.some(item=>item.status==='Nog inpakken')){
      setNotice('Deze doos bevat nog niet ingepakte regels. Rond die eerst af.');
      return;
    }
    if(stage==='afgeleverd'&&!transportEntries.some(row=>
      row.room===group.room&&row.box===group.box&&row.stage==='geladen')){
      setNotice('Markeer een doos eerst zelf als geladen voordat je aflevering noteert.');
      return;
    }
    setTransport(old=>{
      const updated={...old};
      if(stage===null)delete updated[key];
      else updated[key]={stage,fingerprint:packingTransportFingerprint(group)};
      return updated;
    });
    resetPending();
    setNotice(stage===null?'Eigen transportmarkering teruggezet.':
      'Eigen doos gemarkeerd als '+stage+'. Dit is geen extern bewijs.');
  }
  function saveDeparture(){
    if(pendingDeparture!==departureSignature){
      setPendingDeparture(null);
      setNotice('Pakregels, doosgroepen of vervoersmarkeringen zijn gewijzigd. Bekijk de vertrekcontrole opnieuw.');
      return;
    }
    downloadPrivateFile('woonpoints-prive-vertrekcontrole.txt',
      departureReport,'text/plain;charset=utf-8');
    setPendingDeparture(null);
    setNotice('Eigen vertrekcontrole als TXT aangeboden. Dit is geen officieel of extern bewijs.');
  }
  function saveManifest(){
    if(!boxGroups.length||pendingManifest!==manifestSignature){
      setPendingManifest(null);
      setNotice('Doosinhoud, status of privacykeuze is gewijzigd. Bekijk de transportlijst opnieuw.');
      return;
    }
    downloadPrivateFile('woonpoints-prive-verhuistransport.txt',
      manifest,'text/plain;charset=utf-8');
    setPendingManifest(null);
    setNotice('Privé-transportlijst lokaal aangeboden. Geen vervoerder of account benaderd.');
  }
  function saveItem(){
    const label=cleanText(form.label),box=cleanText(form.box),quantity=Number(form.quantity);
    if(!label||label.length>60||CONTROL.test(label)||box.length>30||CONTROL.test(box)||
      !/^[1-9][0-9]?$/.test(form.quantity)||!Number.isInteger(quantity)||
      !ROOMS.includes(form.room)||!STATES.includes(form.status)){
      setNotice('Ongeldige invoer: naam 1–60 tekens, dooscode max. 30 en aantal 1–99.');
      return;
    }
    if(!editing&&items.length>=80){setNotice('Maximaal 80 privé-pakregels.');return;}
    const previous=editing?items.find(item=>item.id===editing):null;
    if(editing&&!previous){setEditing(null);setNotice('Deze regel bestaat niet meer.');return;}
    const updated:PackingItem={id:previous?.id||'item-'+Date.now()+'-'+(++sequence.current),
      label,box,quantity,room:form.room,priority:form.priority,status:form.status};
    setItems(old=>editing?old.map(item=>item.id===editing?updated:item):[...old,updated]);
    setTransport({}); // A changed inventory must never carry forward a stale load receipt.
    setEditing(null);setForm(blank());resetPending();
    setNotice(editing?'Pakregel bijgewerkt.':'Pakregel toegevoegd.');
  }
  function startEdit(item:PackingItem){
    setEditing(item.id);setForm({label:item.label,room:item.room,box:item.box,
      quantity:String(item.quantity),priority:item.priority,status:item.status});
    resetPending();
  }
  function changeStatus(id:string,status:PackingState){
    setItems(old=>old.map(item=>item.id===id?{...item,status}:item));
    setTransport({}); // Packing/unpacking invalidates every previous manual transport stamp.
    resetPending();
  }
  function exportNow(kind:'json'|'txt'){
    if(pendingExport?.signature!==signature||pendingExport.kind!==kind){
      setPendingExport(null);setNotice('De paklijst is veranderd. Controleer de nieuwe inhoud eerst.');
      return;
    }
    if(kind==='json'){
      const archive:PackingArchive={format:'woonpoints-private-packing-list',
        version:2,items,transport:transportEntries};
      downloadPrivateFile('woonpoints-prive-paklijst.json',
        JSON.stringify(archive,null,2)+'\n','application/json;charset=utf-8');
    }else downloadPrivateFile('woonpoints-prive-paklijst.txt',report,'text/plain;charset=utf-8');
    setPendingExport(null);setNotice('Bestand lokaal aangeboden. Je opslaglocatie kan synchroniseren.');
  }
  async function readArchive(file:File|undefined){
    const seq=++pendingArchiveSequence.current;
    const source=fullPackingSignature;
    setPendingRestore(null);setPendingRestoreSource(null);setPendingExport(null);
    if(!file)return;
    if(file.size<1||file.size>65536){setNotice('Back-up geweigerd: kies een JSON van maximaal 64 KiB.');return;}
    try{
      const raw:unknown=JSON.parse(await file.text());
      if(seq!==pendingArchiveSequence.current)return;
      if(!validArchive(raw))throw new Error('invalid archive');
      setPendingRestore(raw);
      setPendingRestoreSource(source);
      setNotice('Geldige privé-lijst gelezen. Controleer aantallen vóór bewust vervangen.');
    }catch{
      if(seq!==pendingArchiveSequence.current)return;
      setNotice('Back-up geweigerd: versie, velden, aantallen of inhoud ongeldig. Huidige lijst behouden.');
    }
  }
  function applyPackingRestore(){
    if(!pendingRestore||!canApplyRestore){
      setNotice('De huidige paklijst is sinds bestandskeuze gewijzigd. Kies opnieuw; niets vervangen.');
      return;
    }
    const restoredTransport=pendingRestore.version===2?
      packingRestoreTransport(pendingRestore.items,pendingRestore.transport):{};
    setRestoreUndo({
      previousItems:items.map(item=>({...item})),
      previousTransport:Object.fromEntries(Object.entries(transport).map(([key,value])=>[key,{...value}])),
      importedSignature:JSON.stringify({items:pendingRestore.items,transport:restoredTransport})
    });
    setItems(pendingRestore.items);
    setTransport(restoredTransport);
    setPendingManifest(null);setPendingRestore(null);setPendingRestoreSource(null);
    setPendingExport(null);setPendingDelete(null);setPendingLabels(null);
    setEditing(null);setForm(blank());setConfirmClear(false);
    setNotice('Privé-paklijst na bevestiging hersteld. Eén tijdelijke terugdraaioptie is beschikbaar zolang je niets wijzigt.');
  }
  function undoPackingRestore(){
    if(!restoreUndo||!canUndoRestore||pendingRestore){
      setNotice('Terugdraaien geweigerd: na het importeren is de paklijst of het transport veranderd. Huidige invoer behouden.');
      return;
    }
    setItems(restoreUndo.previousItems.map(item=>({...item})));
    setTransport(Object.fromEntries(Object.entries(restoreUndo.previousTransport)
      .map(([key,value])=>[key,{...value}])));
    setRestoreUndo(null);setPendingRestore(null);setPendingRestoreSource(null);
    setPendingExport(null);setPendingLabels(null);setPendingManifest(null);
    setPendingDelete(null);setEditing(null);setForm(blank());setConfirmClear(false);
    setNotice('Vorige tabblad-paklijst én eigen transportmarkeringen veilig teruggezet. Externe bestanden blijven onaangetast.');
  }
  return <section className="panel" aria-labelledby="private-packing-heading">
    <p className="eyebrow">VERHUIZEN · EIGEN KAMERS EN DOZEN</p>
    <h2 id="private-packing-heading">Paklijst per kamer</h2>
    <p>Houd zelf bij wat nog in een doos moet, ingepakt is of al is uitgepakt.
      Markeer spullen die je als eerste nodig hebt. Geen automatische registratie,
      opslag, WoningNet-koppeling of externe inventarisgegevens.</p>
    <dl>
      <div><dt>Eigen regels</dt><dd>{items.length} / 80</dd></div>
      <div><dt>Stuks volgens eigen invoer</dt><dd>{total}</dd></div>
      <div><dt>Ingepakt of uitgepakt</dt><dd>{packed} / {items.length} regels</dd></div>
      <div><dt>Al uitgepakt</dt><dd>{unpacked} regels</dd></div>
      <div><dt>Eerst nodig</dt><dd>{urgent.length} open regels</dd></div>
    </dl>
    <h3>{editing?'Bewerk je pakregel':'Voeg een pakregel toe'}</h3>
    <label htmlFor="pack-item">Eigen omschrijving (geen persoonsgegevens)</label>
    <input id="pack-item" maxLength={60} autoComplete="off" value={form.label}
      onChange={event=>setForm(old=>({...old,label:event.target.value}))}
      placeholder="Bijvoorbeeld: borden" />
    <label htmlFor="pack-room">Kamer</label>
    <select id="pack-room" value={form.room}
      onChange={event=>setForm(old=>({...old,room:event.target.value as Room}))}>
      {ROOMS.map(room=><option key={room} value={room}>{room}</option>)}
    </select>
    <label htmlFor="pack-count">Aantal stuks (1–99)</label>
    <input id="pack-count" type="number" min={1} max={99} step={1}
      value={form.quantity} onChange={event=>setForm(old=>({...old,quantity:event.target.value}))}/>
    <label htmlFor="pack-box">Eigen dooslabel (optioneel, maximaal 30 tekens)</label>
    <input id="pack-box" maxLength={30} autoComplete="off" value={form.box}
      onChange={event=>setForm(old=>({...old,box:event.target.value}))}
      placeholder="Bijvoorbeeld: K-03" />
    <label htmlFor="pack-priority">
      <input id="pack-priority" type="checkbox" checked={form.priority}
        onChange={event=>setForm(old=>({...old,priority:event.target.checked}))} />
      Als eerste nodig na verhuizing
    </label>
    <label htmlFor="pack-status">Eigen status</label>
    <select id="pack-status" value={form.status}
      onChange={event=>setForm(old=>({...old,status:event.target.value as PackingState}))}>
      {STATES.map(status=><option key={status} value={status}>{status}</option>)}
    </select>
    <div>
      <button type="button" onClick={saveItem}>{editing?'Bewaar wijzigingen':'Voeg toe'}</button>
      {editing&&<button type="button" onClick={()=>{setEditing(null);setForm(blank());}}>
        Annuleer bewerken</button>}
    </div>
    <h3>Je eigen kamers</h3>
    <ul>{ROOMS.map(room=>{
      const rows=items.filter(item=>item.room===room);
      if(!rows.length)return null;
      const ready=rows.filter(item=>item.status!=='Nog inpakken').length;
      return <li key={room}>{room}: {ready} van {rows.length} regels ingepakt of uitgepakt
        {' · '}{rows.reduce((n,item)=>n+item.quantity,0)} stuks</li>;
    })}</ul>
    {items.length===0&&<p>Nog geen spullen genoteerd.</p>}
    {urgent.length>0&&<div>
      <h3>Eerst nodig na aankomst</h3>
      <ul>{urgent.map(item=><li key={item.id}>
        {item.room}: {item.quantity} × {item.label}
        {item.box?' · doos '+item.box:''} · {item.status}
      </li>)}</ul>
    </div>}
    <h3>Pakregels bekijken</h3>
    <label htmlFor="pack-filter-room">Filter op kamer</label>
    <select id="pack-filter-room" value={roomFilter}
      onChange={event=>setRoomFilter(event.target.value as Room|'Alle kamers')}>
      <option>Alle kamers</option>
      {ROOMS.map(room=><option key={room}>{room}</option>)}
    </select>
    <label htmlFor="pack-filter-state">Filter op status</label>
    <select id="pack-filter-state" value={stateFilter}
      onChange={event=>setStateFilter(event.target.value as PackingState|'Alle statussen')}>
      <option>Alle statussen</option>
      {STATES.map(status=><option key={status}>{status}</option>)}
    </select>
    <p>{visible.length} van {items.length} eigen regels zichtbaar.</p>
    <ol>{visible.map(item=><li key={item.id}>
      <strong>{item.quantity} × {item.label}</strong> · {item.room}
      {item.box?' · doos '+item.box:''}{item.priority?' · eerst nodig':''}
      <label htmlFor={'pack-status-'+item.id}>Status van {item.label}</label>
      <select id={'pack-status-'+item.id} value={item.status}
        onChange={event=>changeStatus(item.id,event.target.value as PackingState)}>
        {STATES.map(status=><option key={status}>{status}</option>)}
      </select>
      <button type="button" onClick={()=>startEdit(item)}>Bewerk</button>
      <button type="button" onClick={()=>{setPendingDelete(item.id);setNotice('');}}>Verwijder…</button>
      {pendingDelete===item.id&&<div role="group" aria-label="Bevestig pakregel verwijderen">
        <p>Verwijder je eigen regel <strong>{item.label}</strong>?</p>
        <button type="button" onClick={()=>{
          setItems(old=>old.filter(x=>x.id!==item.id));
          setTransport({});
          if(editing===item.id){setEditing(null);setForm(blank());}
          resetPending();setNotice('Pakregel verwijderd. Transportmarkeringen opnieuw beginnen.');
        }}>Ja, verwijder deze regel</button>
        <button type="button" onClick={()=>setPendingDelete(null)}>Annuleren</button>
      </div>}
    </li>)}</ol>
    {visible.length===0&&items.length>0&&<p>Geen regels binnen je filters.</p>}


    <section aria-labelledby="private-transport-heading">
      <h3 id="private-transport-heading">Verhuisrit: eigen laad- en afleveroverzicht</h3>
      <p>Volg per zelf ingevulde doos of jij hem als geladen en later als
        afgeleverd hebt gemarkeerd. Dat kan alleen als alle artikelen in
        die doos al zijn ingepakt. Dit is een persoonlijke notitie,
        geen scan, chauffeursbevestiging of officieel afleverbewijs.</p>
      <dl>
        <div><dt>Dozen met een label</dt><dd>{boxGroups.length}</dd></div>
        <div><dt>Door jezelf als geladen gemarkeerd</dt><dd>{loadedCount}</dd></div>
        <div><dt>Door jezelf als afgeleverd gemarkeerd</dt><dd>{deliveredCount}</dd></div>
        <div><dt>Nog niet geladen</dt><dd>{boxGroups.length-loadedCount-deliveredCount}</dd></div>
      </dl>
      <section aria-labelledby="private-packing-departure-heading"
        style={{margin:'20px 0',padding:16,border:'1px solid #8ca996',borderRadius:8}}>
        <h4 id="private-packing-departure-heading">Vóór vertrek: mijn laadcontrole</h4>
        <p>Controleer je eigen paklijst en transportmarkeringen vóór de verhuisrit.
          Dit overzicht wordt onmiddellijk opnieuw berekend na elke wijziging.
          Het is geen fysieke scan, ontvangstbevestiging of garantie.</p>
        <p role="status" aria-live="polite"><strong>{
          items.length===0?'Begin met eigen pakregels.':
          departureReady?'Geen open punten volgens je eigen invoer.':
          'Nog niet klaar volgens je eigen invoer.'
        }</strong></p>
        <dl>
          <div><dt>Nog in te pakken regels</dt><dd>{departureNotPacked.length}</dd></div>
          <div><dt>Nog zonder dooscode</dt><dd>{departureUnlabelled.length}</dd></div>
          <div><dt>Doosgroepen niet als geladen genoteerd</dt><dd>{departureWaiting.length}</dd></div>
          <div><dt>Daarvan als eerste nodig</dt><dd>{departurePriorityWaiting.length}</dd></div>
          <div><dt>Dubbele codes tussen kamers</dt><dd>{duplicateCodes.length}</dd></div>
        </dl>
        {departurePriorityWaiting.length>0&&<div>
          <h5>Eerst nodig, maar nog niet als geladen genoteerd</h5>
          <ul>{departurePriorityWaiting.map(group=><li key={packingTransportKey(group)}>
            {group.room} · doos {group.box} · {group.items.filter(item=>item.priority).length} prioritaire regel(s)
          </li>)}</ul>
        </div>}
        {duplicateCodes.length>0&&<p role="alert">
          Een dooscode wordt in verschillende kamers gebruikt ({duplicateCodes.join(', ')}).
          Geef dozen een unieke code voordat je op de laadlijst vertrouwt.
        </p>}
        {(departureNotPacked.length>0||departureUnlabelled.length>0)&&
          <p><a href="#pack-item">Werk je eigen pakregels hierboven bij ↑</a>.</p>}
        {departureWaiting.length>0&&<p><a href="#private-transport-heading">
          Markeer geladen dozen pas nadat je ze echt hebt gecontroleerd ↑</a>.</p>}
        <button type="button" onClick={()=>{setPendingDeparture(departureSignature);setNotice('');}}>
          Bekijk volledige privé-vertrekcontrole
        </button>
        {pendingDeparture===departureSignature&&<div>
          <p>Deze exacte inhoud kan labels en zelf ingevoerde voorwerpnamen bevatten.
            Lees eerst wat je naar een eigen bestand gaat schrijven.</p>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:260,overflow:'auto'}}>
            {departureReport}
          </pre>
          <button type="button" onClick={saveDeparture}>
            Download deze gecontroleerde TXT
          </button>
          <button type="button" onClick={()=>setPendingDeparture(null)}>Annuleren</button>
        </div>}
        {pendingDeparture!==null&&pendingDeparture!==departureSignature&&<p role="status">
          Je lijst is gewijzigd. De vorige toestemming is vervallen; bekijk opnieuw.</p>}
      </section>
      {unlabelled>0&&<p role="status">
        {unlabelled} eigen pakregel(s) zonder dooscode tellen niet mee
        in de vervoerscontrole. Geef ze eerst een eigen dooslabel.</p>}
      {boxGroups.length===0&&<p>Maak eerst een eigen dooscode bij je pakregels.</p>}
      <ol>{boxGroups.map(group=>{
        const current=transportEntries.find(row=>row.room===group.room&&row.box===group.box);
        const stage=current?.stage||'nog laden';
        const waiting=group.items.some(item=>item.status==='Nog inpakken');
        return <li key={packingTransportKey(group)}>
          <strong>{group.room} · doos {group.box}</strong>
          {' · '}{group.items.length} regels, {' '}
          {group.items.reduce((n,item)=>n+item.quantity,0)} stuks
          {group.items.some(item=>item.priority)?' · EERST NODIG':''}
          <p>Eigen transportstatus: <strong>{stage}</strong>.
            {waiting?' Nog niet alle inhoud is ingepakt.':''}</p>
          {stage==='nog laden'&&<button type="button" disabled={waiting}
            onClick={()=>stampTransport(group,'geladen')}>
            Markeer zelf als geladen
          </button>}
          {stage==='geladen'&&<button type="button" disabled={waiting}
            onClick={()=>stampTransport(group,'afgeleverd')}>
            Markeer zelf als afgeleverd
          </button>}
          {stage!=='nog laden'&&<button type="button"
            onClick={()=>stampTransport(group,null)}>
            Herstel: nog niet geladen
          </button>}
        </li>;
      })}</ol>
      <label htmlFor="private-transport-show-contents">
        <input id="private-transport-show-contents" type="checkbox"
          checked={showManifestContents} onChange={event=>{
            setShowManifestContents(event.target.checked);setPendingManifest(null);setNotice('');
          }} />
        Neem ook mijn eigen artikelomschrijvingen op in het vervoerbestand (standaard uit)
      </label>
      <button type="button" disabled={!boxGroups.length} onClick={()=>{
        setPendingManifest(manifestSignature);setNotice('');
      }}>Bekijk complete eigen vervoer-/afleverlijst…</button>
      {pendingManifest===manifestSignature&&boxGroups.length>0&&
        <div role="group" aria-label="Bevestig privé-vervoerbestand">
          <p>Dit is je eigen momentopname van alle bekende dozen.
            Bekijk de exacte tekst voordat je een eventueel privacygevoelig
            lokaal TXT-bestand downloadt. Er wordt niets automatisch gedeeld.</p>
          <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxHeight:'24rem',
            overflowY:'auto'}}>{manifest}</pre>
          <button type="button" onClick={saveManifest}>Bevestig privé-TXT-download</button>
          <button type="button" onClick={()=>setPendingManifest(null)}>Annuleren</button>
        </div>}
      <p>Elke wijziging aan pakregels of hun inpakstatus trekt eerdere
        laad-/aflevermarkeringen in. Je kunt ze daarna opnieuw zelf vastleggen.
        De zelfstandige paklijst-back-up v2 bewaart deze markeringen;
        oudere werkmap v3 en paklijst v1 bevatten ze niet.</p>
    </section>
    <section aria-labelledby="private-box-labels-heading">
      <h3 id="private-box-labels-heading">Printbare eigen dozenlabels</h3>
      <p>Maak voor elke unieke combinatie van kamer en dooslabel een offline A4-vel
        met grote dooscode en kamernaam. Alleen nog niet uitgepakte regels met
        een eigen doosnummer komen mee; er wordt geen adres toegevoegd.</p>
      <p>{boxGroups.length} dozen met inhoudsregels · {unlabelled} nog niet uitgepakte
        regel(s) zonder doosnummer niet opgenomen.</p>
      {duplicateCodes.length>0&&<p role="status">
        Let op: de dooscode(s) {duplicateCodes.join(', ')} komen in meerdere
        kamers voor. Controleer de kamernaam op ieder geprint etiket.</p>}
      <label htmlFor="private-box-label-contents">
        <input id="private-box-label-contents" type="checkbox"
          checked={showLabelContents} onChange={event=>{
            setShowLabelContents(event.target.checked);setPendingLabels(null);setNotice('');
          }} />
        Toon ook de zelf ingevulde inhoud op het etiket (privacygevoelig)
      </label>
      <button type="button" disabled={!boxGroups.length} onClick={()=>{
        setPendingLabels(labelSignature);setNotice('');
      }}>Bekijk afdrukbare dozenlabels…</button>
      {pendingLabels===labelSignature&&boxGroups.length>0&&
        <div role="group" aria-label="Bevestig privé-dozenlabels">
          <p>Controleer de {boxGroups.length} onderstaande labels voordat je
            een offline HTML-bestand bewaart. Open dat bestand zelf in een browser
            en gebruik Afdrukken wanneer je dat wilt.</p>
          <ol>{boxGroups.map(group=><li key={group.room+'|'+group.box}>
            <strong>{group.room} · doos {group.box}</strong>
            {' · '}{group.items.reduce((n,item)=>n+item.quantity,0)} stuks
            {group.items.some(item=>item.priority)?' · EERST NODIG':''}
            {showLabelContents&&<ul>{group.items.map(item=><li key={item.id}>
              {item.quantity} × {item.label}{item.priority?' · eerst nodig':''}
            </li>)}</ul>}
          </li>)}</ol>
          <button type="button" onClick={savePrivateLabels}>
            Bevestig offline HTML-download ({boxGroups.length} labels)
          </button>
          <button type="button" onClick={()=>setPendingLabels(null)}>Annuleren</button>
        </div>}
    </section>
    <h3>Zelf privé bewaren of overdragen</h3>
    <p>Back-up en paklijst bevatten eigen kamerlabels, omschrijvingen en doosnummers.
      Bekijk eerst de exacte gegevens. Niets wordt zonder bevestiging gedownload.</p>
    <button type="button" onClick={()=>{
      setPendingExport({kind:'txt',signature});setNotice('');
    }}>Bekijk leesbare paklijst als TXT…</button>
    <button type="button" onClick={()=>{
      setPendingExport({kind:'json',signature});setNotice('');
    }}>Bekijk complete privé-back-up als JSON…</button>
    {pendingExport&&pendingExport.signature===signature&&
      <div role="group" aria-label="Bevestig paklijst export">
        <p>{pendingExport.kind==='json'?
          'Een privé JSON-back-up waarmee je deze volledige lijst later kunt herstellen.':
          'Een leesbare paklijst met kamer, status, dooslabel en prioriteit.'}
          Controleer de gegevens vóór bewaren of delen.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',
          maxHeight:'25rem',overflowY:'auto'}}>{pendingExport.kind==='json'?
          JSON.stringify({format:'woonpoints-private-packing-list',
            version:2,items,transport:transportEntries},null,2):report}</pre>
        <button type="button" onClick={()=>exportNow(pendingExport.kind)}>
          Bevestig privé-{pendingExport.kind==='json'?'JSON':'TXT'}-download</button>
        <button type="button" onClick={()=>setPendingExport(null)}>Annuleren</button>
      </div>}
    <label htmlFor="pack-upload">Herstel eigen paklijst v1 of v2 (JSON, maximaal 64 KiB)</label>
    <input id="pack-upload" type="file" accept=".json,application/json"
      onChange={event=>{
        const file=event.currentTarget.files?.[0];
        event.currentTarget.value='';void readArchive(file);
      }}/>
    {pendingRestore&&<div role="group" aria-label="Bevestig huidige paklijst vervangen">
      <h3>Herstel bewust één eigen bestand</h3>
      <p>Gekozen back-up: <strong>{pendingRestore.items.length}</strong> eigen regels in
        {' '+new Set(pendingRestore.items.map(item=>item.room)).size} kamer(s).
        Je huidige tabblad heeft <strong>{items.length}</strong> regels en
        <strong> {transportEntries.length}</strong> eigen doosvervoer-markeringen.
        Bevestigen vervangt ze allebei, inclusief nog niet bewaarde wijzigingen.</p>
      <p>{pendingRestore.version===2?
          'Versie 2 herstelt ook de eigen laad- en aflevermarkeringen uit de gekozen back-up.':
          'Versie 1 heeft geen transportmarkeringen: de huidige markeringen worden gewist.'}
        Er wordt geen WoningNet-, vervoerder- of externe accountinformatie geraadpleegd.</p>
      {!canApplyRestore&&<p role="alert">Je paklijst of transportstatus veranderde
        sinds het kiezen van het bestand. Annuleer en kies het bestand opnieuw.
        De oude importtoestemming is ongeldig; er wordt niets vervangen.</p>}
      <button type="button" disabled={!canApplyRestore} onClick={applyPackingRestore}>
        Ja, vervang volledige paklijst en bewaar tijdelijk herstelpunt
      </button>
      <button type="button" onClick={()=>{
        setPendingRestore(null);setPendingRestoreSource(null);
        setNotice('Privé-import geannuleerd; bestaande paklijst behouden.');
      }}>Annuleer zonder wijzigingen</button>
    </div>}
    {restoreUndo&&<div role="group" aria-label="Vorige paklijst veilig terugzetten">
      <h3>Vorige tabblad-paklijst herstellen</h3>
      <p>Vóór je laatste JSON-import stonden er <strong>{restoreUndo.previousItems.length}</strong>
        eigen pakregels. Dit tijdelijk herstelpunt kan de vorige paklijst én
        transportmarkeringen één keer terugzetten zolang na de import niets is gewijzigd.</p>
      {!canUndoRestore&&<p role="status">Je paklijst of laad-/afleverstatus is na de
        import aangepast. Automatisch terugdraaien is uitgeschakeld, zodat nieuwe
        invoer niet stilzwijgend wordt overschreven.</p>}
      <button type="button" disabled={!canUndoRestore||Boolean(pendingRestore)}
        onClick={undoPackingRestore}>Herstel vorige tabbladgegevens</button>
      <button type="button" onClick={()=>{
        setRestoreUndo(null);setNotice('Tijdelijke terugzetmogelijkheid gewist; huidige paklijst behouden.');
      }}>Verwerp herstelpunt</button>
      <p>Dit herstelpunt blijft uitsluitend in het RAM van dit browsertabblad.
        Sluiten wist het. Gedownloade privé-JSON-bestanden worden niet gewijzigd.</p>
    </div>}
    {!confirmClear?<button type="button" onClick={()=>setConfirmClear(true)}>
      Wis eigen paklijst…</button>:<div role="group" aria-label="Bevestig paklijst wissen">
      <p>Wis alle {items.length} eigen pakregels uit dit tabblad? Externe kopieën blijven bestaan.</p>
      <button type="button" onClick={()=>{
        setItems([]);setTransport({});setEditing(null);setForm(blank());
        resetPending();setNotice('Paklijst en transportmarkeringen gewist.');
      }}>Ja, wis alle regels</button>
      <button type="button" onClick={()=>setConfirmClear(false)}>Annuleren</button>
    </div>}
    {notice&&<p role="status">{notice}</p>}
    <p>Alle informatie blijft uitsluitend in het geheugen van dit tabblad.
      Sluiten of verversen wist niet-geëxporteerde regels. Dit hulpmiddel bevat
      geen WoningNet-accountgegevens, voorraadgarantie of automatische verzendactie.</p>
  </section>;
}
