'use client';

import { useState } from 'react';
import {
  MAX_MANUAL_HOMES, normalizeHousingPreferences, normalizeManualHome,
  rankManualHomes, encodeHousingShortlist, decodeHousingShortlist
} from '../lib/manual-housing-shortlist.mjs';

type Home = {label: string; rent: number; rooms: number; travel: number; balcony: boolean};
type Preferences = {maxRent: number; minRooms: number; maxTravel: number; preferBalcony: boolean};
const defaults: Preferences = {maxRent: 1000, minRooms: 2, maxTravel: 45, preferBalcony: false};
const empty = {label: '', rent: '', rooms: '2', travel: '30', balcony: false};
const number = (s: string) => s.trim() === '' ? NaN : Number(s);

export default function ManualHousingShortlist() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [draft, setDraft] = useState(empty);
  const [homes, setHomes] = useState<Home[]>([]);
  const [notice, setNotice] = useState('');
  const [pendingImport, setPendingImport] = useState<{preferences: Preferences; homes: Home[]} | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const validPreferences = normalizeHousingPreferences(preferences) as Preferences | null;
  const ranked = validPreferences ? rankManualHomes(homes, validPreferences) : null;
  const eligible = ranked?.filter((row: {suitable: boolean}) => row.suitable).length ?? 0;

  function addHome(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (homes.length >= MAX_MANUAL_HOMES) {
      setNotice('Maximaal twaalf zelf ingevoerde woningen. Verwijder er eerst een.');
      return;
    }
    const entered = normalizeManualHome({
      label: draft.label.trim(), rent: number(draft.rent),
      rooms: number(draft.rooms), travel: number(draft.travel), balcony: draft.balcony
    }) as Home | null;
    if (!entered) {
      setNotice('Vul een label van maximaal 64 tekens, huur €100–€10.000, 1–20 kamers en 0–300 reistijdminuten in.');
      return;
    }
    setHomes(current => [...current, entered]);
    setDraft(empty);
    setNotice('Woning toegevoegd aan je privévergelijking; er is niets online gecontroleerd.');
  }

  function exportJson() {
    const json = encodeHousingShortlist(preferences, homes);
    if (!json) {
      setNotice('Kan deze selectie niet veilig opslaan. Controleer je voorkeuren en woningen.');
      return;
    }
    const url = URL.createObjectURL(new Blob([json], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-prive-woningen.json';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    setNotice('JSON aangeboden voor jouw eigen archief. De gekozen bestandsprovider kan synchroniseren.');
  }

  async function selectJson(file: File | undefined) {
    setPendingImport(null);
    if (!file) return;
    if (file.size < 1 || file.size > 16384) {
      setNotice('Bestand geweigerd: gebruik een Woonpoints-JSON van maximaal 16 KB.');
      return;
    }
    try {
      const raw = await file.text();
      const incoming = decodeHousingShortlist(raw) as {preferences: Preferences; homes: Home[]} | null;
      if (!incoming) throw new Error('invalid');
      setPendingImport(incoming);
      setNotice('Geldig privébestand. Bevestig apart of je de huidige vergelijking wilt vervangen.');
    } catch {
      setNotice('Bestand geweigerd: onjuist formaat of ongeldige gegevens. Je huidige kandidaten zijn behouden.');
    }
  }

  return (
    <section className="panel housing-shortlist" aria-labelledby="housing-shortlist-heading">
      <div>
        <p className="eyebrow">EIGEN WONINGVERGELIJKING · NIET GEKOPPELD</p>
        <h2 id="housing-shortlist-heading">Welke woningen passen bij jouw wensen?</h2>
        <p>Vergelijk tot twaalf woningen die je <strong>zelf</strong> invoert. Stel drie harde grenzen in.
          Binnen die grenzen geeft een doorzichtige puntentelling aan welke combinatie jij het beste vindt.</p>
        <p><strong>Geen WoningNet-import of woningkans.</strong> Geen beschikbaarheid,
          inkomenstoets, toewijzingsregels of echte huurprijzen zijn geverifieerd.
          Vul geen straatadressen, naam, accountgegevens of contactinformatie in.</p>
        <fieldset className="housing-prefs">
          <legend>Mijn voorkeuren (privé in dit tabblad)</legend>
          <label htmlFor="hs-budget">Maximale maandhuur in euro</label>
          <input id="hs-budget" type="number" min="100" max="10000" step="1"
            value={preferences.maxRent} onChange={event => setPreferences(p => ({...p, maxRent: number(event.target.value)}))} />
          <label htmlFor="hs-rooms">Minimaal aantal kamers</label>
          <input id="hs-rooms" type="number" min="1" max="20" step="1"
            value={preferences.minRooms} onChange={event => setPreferences(p => ({...p, minRooms: number(event.target.value)}))} />
          <label htmlFor="hs-travel">Maximale reistijd in minuten</label>
          <input id="hs-travel" type="number" min="1" max="300" step="1"
            value={preferences.maxTravel} onChange={event => setPreferences(p => ({...p, maxTravel: number(event.target.value)}))} />
          <label className="housing-check"><input type="checkbox" checked={preferences.preferBalcony}
            onChange={event => setPreferences(p => ({...p, preferBalcony: event.target.checked}))} />
            Balkon geeft bij gelijke geschiktheid tien bonuspunten</label>
        </fieldset>
        {!validPreferences && <p role="alert">Controleer je voorkeuren: huur €100–€10.000, minimaal 1–20 kamers, reistijd 1–300 minuten.</p>}
        <details>
          <summary>Hoe worden woningen gerangschikt?</summary>
          <p>Huur boven je maximum, te weinig kamers of te lange reistijd betekent <strong>past niet</strong>.
            Passende woningen krijgen maximaal 40 punten voor huurruimte, 35 voor reistijdruimte,
            15 voor extra kamers en 10 voor balkon wanneer je dat wenst. Meer punten betekent
            alleen een hogere <em>persoonlijke volgorde</em>, nooit meer kans op toewijzing.</p>
        </details>
      </div>

      <div>
        <form onSubmit={addHome} className="housing-form">
          <fieldset>
            <legend>Voeg handmatig een woning toe ({homes.length}/{MAX_MANUAL_HOMES})</legend>
            <label htmlFor="hs-label">Neutraal eigen label (geen adres)</label>
            <input id="hs-label" required maxLength={64} autoComplete="off" value={draft.label}
              placeholder="Bijv. woning A" onChange={event => setDraft(d => ({...d, label: event.target.value}))} />
            <div className="housing-fields">
              <div><label htmlFor="hs-rent">Maandhuur (€)</label><input id="hs-rent" type="number" min="100" max="10000" step="1"
                required value={draft.rent} onChange={event => setDraft(d => ({...d, rent: event.target.value}))} /></div>
              <div><label htmlFor="hs-count">Kamers</label><input id="hs-count" type="number" min="1" max="20" step="1"
                required value={draft.rooms} onChange={event => setDraft(d => ({...d, rooms: event.target.value}))} /></div>
              <div><label htmlFor="hs-minutes">Zelf geschatte reistijd (min)</label>
                <input id="hs-minutes" type="number" min="0" max="300" step="1" required value={draft.travel}
                  onChange={event => setDraft(d => ({...d, travel: event.target.value}))} /></div>
            </div>
            <label className="housing-check"><input type="checkbox" checked={draft.balcony}
              onChange={event => setDraft(d => ({...d, balcony: event.target.checked}))} /> Deze woning heeft een balkon</label>
            <button type="submit" disabled={homes.length >= MAX_MANUAL_HOMES}>Voeg toe aan vergelijking</button>
          </fieldset>
        </form>

        <div className="housing-actions">
          <button type="button" disabled={!homes.length || !validPreferences} onClick={exportJson}>
            Bewaar JSON…
          </button>
          <label htmlFor="hs-import">Open eerder bewaarde privévergelijking (JSON, max. 16 KB)</label>
          <input id="hs-import" type="file" accept=".json,application/json" onChange={event => {
            void selectJson(event.target.files?.[0]);
            event.target.value = '';
          }} />
          <button type="button" className="secondary" disabled={!homes.length}
            onClick={() => setConfirmClear(true)}>Wis vergelijking</button>
        </div>
        {pendingImport && <div className="housing-confirm" role="group" aria-label="Bevestig vervanging">
          <p>Dit bestand heeft <strong>{pendingImport.homes.length}</strong> woningen en eigen
            voorkeuren. Overnemen vervangt je huidige lokale vergelijking geheel.</p>
          <button type="button" onClick={() => {
            setPreferences(pendingImport.preferences); setHomes(pendingImport.homes);
            setPendingImport(null); setConfirmClear(false);
            setNotice('Privévergelijking lokaal overgenomen; gegevens blijven ongeverifieerd.');
          }}>Vervang vergelijking</button>
          <button type="button" className="secondary" onClick={() => {
            setPendingImport(null); setNotice('Import geannuleerd; je oorspronkelijke vergelijking is behouden.');
          }}>Annuleren</button>
        </div>}
        {confirmClear && <div className="housing-confirm" role="group" aria-label="Wissen bevestigen">
          <p>Alleen deze handmatig ingevulde woningvergelijking verwijderen? Andere Woonpoints-notities blijven bestaan.</p>
          <button type="button" onClick={() => {setHomes([]); setConfirmClear(false);
            setPendingImport(null); setNotice('Woningen uit dit tabblad verwijderd.');}}>Ja, wis woningen</button>
          <button type="button" className="secondary" onClick={() => setConfirmClear(false)}>Behoud woningen</button>
        </div>}
        {notice && <p role="status" aria-live="polite">{notice}</p>}
        <h3>Jouw rangorde: {eligible} passend van {homes.length} ingevoerde woningen</h3>
        {!homes.length && <p>Voeg een woning toe om de vergelijking te starten. De gegevens zijn alleen voor jou zichtbaar in dit tabblad.</p>}
        {!ranked && homes.length > 0 && <p role="alert">Je voorkeuren zijn niet volledig. De rangorde is onbekend.</p>}
        <ol className="housing-results">
          {ranked?.map((row: {index: number; home: Home; suitable: boolean; score: number | null; reasons: string[]}) => (
            <li key={row.index} className="housing-item">
              <div className="housing-item-head">
                <strong>{row.home.label}</strong>
                <span>{row.suitable ? `Past bij de grenzen · ${row.score} eigen punten` : 'Past niet bij jouw grenzen'}</span>
              </div>
              <p>Zelf genoteerd: €{row.home.rent}/maand · {row.home.rooms} kamers · {row.home.travel} minuten ·
                {row.home.balcony ? ' balkon' : ' geen balkon'}</p>
              <ul>{row.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
              <button type="button" className="secondary" onClick={() => {
                setHomes(current => current.filter((_, index) => index !== row.index));
                setNotice('Woning verwijderd uit je privévergelijking.');
              }}>Verwijder deze woning</button>
            </li>
          ))}
        </ol>
        <p><strong>Privacy:</strong> invoer blijft in het geheugen van dit tabblad;
          alleen met Bewaar JSON kies je zelf een bestand. Er wordt niets bij WoningNet
          opgevraagd of geplaatst. Sluiten zonder export verwijdert je invoer.</p>
      </div>
    </section>
  );
}
