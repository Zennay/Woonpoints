'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MANUAL_MONTHLY_GOAL,
  MANUAL_PROGRESS_STORAGE_KEY,
  decodeManualProgress,
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
  const [transientDiscarded, setTransientDiscarded] = useState(false);
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
        setCount(unsaved.current?.count ?? stored);
        setStorageWorks(unsaved.current === null && !writeUnverified.current);
      } catch {
        writeUnverified.current = true;
        lastObservedRaw.current = undefined;
        setCount(unsaved.current?.count ?? null);
        setStorageWorks(false);
      }
      if (timer !== undefined) clearTimeout(timer);
      timer = setTimeout(refresh, msUntilNextLocalMidnight() + 50);
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
        setCount(decodeManualProgress(raw, current));
        setStorageWorks(!writeUnverified.current);
      } catch {
        writeUnverified.current = true;
        lastObservedRaw.current = undefined;
        setCount(null);
        setStorageWorks(false);
      }
      return;
    }
    if (!Number.isInteger(next) || next < 0 || next > MANUAL_MONTHLY_GOAL) return;
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
        if (result.status === 'changed') {
          lastObservedRaw.current = result.raw;
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
    // An old tab cannot erase a newer replacement without first displaying it.
    try {
      const result = eraseManualProgressIfUnchanged(window.localStorage, lastObservedRaw.current);
      if (result.status !== 'cleared') {
        unsaved.current = null;
        setHasUnsaved(false);
        if (result.status === 'changed') {
          lastObservedRaw.current = result.raw;
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
          {count === null ? 'Nog niets ingevuld' : `${count} / ${MANUAL_MONTHLY_GOAL} zelf genoteerd`}
        </p>
        {month !== null && (count === null ? (
          <button type="button" onClick={() => save(0)}>Begin maandplanning</button>
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
        {count !== null && <p>Zelf nog te plannen: {MANUAL_MONTHLY_GOAL - count}.</p>}
        {nudge !== null && (
          <p className="manual-reminder" role="status">
            <strong>Eigen planning:</strong> {nudge.urgency === 'late' ? 'De maand loopt bijna af.' : 'Het is halverwege de maand.'}
            {' '}Je hebt nog {nudge.missing} {nudge.missing === 1 ? 'reactie' : 'reacties'} niet zelf genoteerd;
            de officiële WoningNet-stand is onbekend.
          </p>
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
