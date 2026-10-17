'use client';
import { useState } from 'react';
import { summarizePositionPairs } from '../lib/position-statistics.mjs';

/** Ephemeral local arithmetic only: not a WoningNet account connection. */
export default function PositionStats() {
  const [input, setInput] = useState('');
  let summary: ReturnType<typeof summarizePositionPairs> = null;
  let invalid = false;
  try { summary = summarizePositionPairs(input); }
  catch { invalid = true; } // Do not echo personal data in errors.
  const fmt = (n: number) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 1 }).format(n);
  return (
    <section className="panel position-stats" aria-labelledby="position-stats-heading">
      <div>
        <p className="eyebrow">ALLEEN OP DIT SCHERM</p>
        <h2 id="position-stats-heading">Posities handmatig analyseren</h2>
        <p>Voer per woning uitsluitend jouw eindpositie en het totaal aantal reacties in, bijvoorbeeld <code>12/150</code>.</p>
        <p><strong>Geen geverifieerde WoningNet-gegevens.</strong> Dit is een persoonlijke berekening, geen officiële registratie, ranglijst of kansvoorspelling.</p>
      </div>
      <div>
        <label htmlFor="position-pairs">Eén positie/totaal per regel (maximaal 50)</label>
        <textarea id="position-pairs" value={input} maxLength={4096} rows={5}
          placeholder={'12/150\n3/60'} autoComplete="off" spellCheck={false}
          onChange={event => setInput(event.target.value)} />
        <p>Niet opgeslagen. Geen adressen, namen, accountgegevens of wachtwoorden invoeren.</p>
        <button type="button" onClick={() => setInput('')} disabled={input.length === 0}>Wis invoer</button>
        {invalid && <p role="alert">Ongeldige positiegegevens. Gebruik maximaal 50 regels positie/totaal, met een positie tussen 1 en het totaal.</p>}
        <div aria-live="polite" aria-atomic="true">
          {!invalid && summary === null && <p>Geen posities ingevuld — uitkomst onbekend.</p>}
          {!invalid && summary !== null && (
            <div className="position-stats-results">
              <p><strong>{summary.sampleCount}</strong> handmatig ingevulde posities · bron onbevestigd</p>
              <dl>
                <div><dt>Gemiddelde eindpositie</dt><dd>{fmt(summary.averagePosition)}</dd></div>
                <div><dt>Mediaan</dt><dd>{fmt(summary.medianPosition)}</dd></div>
                <div><dt>Gemiddeld positiepercentiel</dt><dd>{fmt(summary.averagePercentile)}%</dd></div>
              </dl>
              <p>Percentiel: 100% = eerste plaats, 0% = laatste plaats. Per woning even zwaar meegewogen, geen voorspelling.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
