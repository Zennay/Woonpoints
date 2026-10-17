'use client';

import { useEffect, useState } from 'react';
import {
  MANUAL_MONTHLY_GOAL,
  MANUAL_PROGRESS_STORAGE_KEY,
  decodeManualProgress,
  encodeManualProgress,
  localMonthKey
} from '../lib/manual-month-progress.mjs';

/** Optional private notes, never a verified account counter or live instruction. */
export default function ManualMonthProgress() {
  const [month, setMonth] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [storageWorks, setStorageWorks] = useState(true);

  useEffect(() => {
    function refresh() {
      const current = localMonthKey();
      setMonth(current);
      try {
        setCount(decodeManualProgress(window.localStorage.getItem(MANUAL_PROGRESS_STORAGE_KEY), current));
        setStorageWorks(true);
      } catch {
        setCount(null);
        setStorageWorks(false);
      }
    }
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  function save(next: number) {
    const current = localMonthKey();
    // A month rollover never carries last month's personal count into the new month.
    if (current !== month) {
      setMonth(current);
      setCount(null);
      return; // Start the new month explicitly, never carry over the old count.
    }
    if (!Number.isInteger(next) || next < 0 || next > MANUAL_MONTHLY_GOAL) return;
    setMonth(current);
    setCount(next);
    try {
      window.localStorage.setItem(MANUAL_PROGRESS_STORAGE_KEY, encodeManualProgress(current, next));
      setStorageWorks(true);
    } catch {
      // Still usable in-memory when private browsing/storage is unavailable.
      setStorageWorks(false);
    }
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
        {!storageWorks && <p role="status">Opslaan is niet beschikbaar; deze invoer blijft alleen op dit scherm.</p>}
      </div>
    </section>
  );
}
