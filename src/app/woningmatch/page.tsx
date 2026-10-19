'use client';

import { useMemo, useRef, useState } from 'react';

type Listing = { id: number; name: string; monthlyRent: string; utilities: string; area: string; bedrooms: string; commute: string; note: string };
type Criteria = { budget: string; area: string; bedrooms: string; commute: string };
type Rule = { label: string; weight: number; observed: number | null; required: number | null; met: boolean | null; detail: string };
type Outcome = { listing: Listing; monthly: number | null; rules: Rule[]; complete: boolean; pass: boolean; met: number; known: number; score: number | null };

const blank = (id: number): Listing => ({ id, name: '', monthlyRent: '', utilities: '', area: '', bedrooms: '', commute: '', note: '' });
const inputStyle: React.CSSProperties = { width: '100%', minWidth: 0, padding: '9px', border: '1px solid #a8bdb8', borderRadius: 6, background: '#fff', color: '#173731', boxSizing: 'border-box' };
const panelStyle: React.CSSProperties = { border: '1px solid #cedfda', borderRadius: 12, padding: 18, background: '#fff', marginBottom: 18 };
const numeric = (input: string, cap: number): number | null => {
  const trimmed = input.trim();
  if (!trimmed || !/^\d+(?:[.,]\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(',', '.'));
  return Number.isFinite(value) && value >= 0 && value <= cap ? value : null;
};
const money = (value: number): string => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
const scalar = (value: string, label: string, cap: number, required: boolean): string | null =>
  value.trim() && numeric(value, cap) === null
    ? label + ' moet een getal tussen 0 en ' + cap + ' zijn.'
    : required && numeric(value, cap) === null ? 'Vul ' + label.toLowerCase() + ' in.' : null;

function calculate(listing: Listing, criteria: Criteria): Outcome {
  const rent = numeric(listing.monthlyRent, 100000);
  const utility = numeric(listing.utilities, 100000);
  const monthly = rent !== null && utility !== null ? rent + utility : null;
  const area = numeric(listing.area, 100000);
  const bedrooms = numeric(listing.bedrooms, 100);
  const commute = numeric(listing.commute, 10000);
  const pairs: Array<[string, number, number | null, number | null, 'max' | 'min', string]> = [
    ['Totale maandkosten', 4, monthly, numeric(criteria.budget, 100000), 'max', '€ per maand, inclusief eigen service/energie-inschatting'],
    ['Woonoppervlak', 3, area, numeric(criteria.area, 100000), 'min', 'm²'],
    ['Slaapkamers', 2, bedrooms, numeric(criteria.bedrooms, 100), 'min', 'kamers'],
    ['Reistijd enkele reis', 2, commute, numeric(criteria.commute, 10000), 'max', 'minuten']
  ];
  const rules: Rule[] = pairs.map(([label, weight, observed, required, direction, detail]) => ({
    label, weight, observed, required, detail,
    met: observed === null || required === null ? null : direction === 'max' ? observed <= required : observed >= required
  }));
  const known = rules.filter(r => r.met !== null).length;
  const met = rules.filter(r => r.met === true).length;
  const complete = known === rules.length;
  const total = rules.reduce((sum, r) => sum + r.weight, 0);
  const score = complete ? Math.round(rules.reduce((sum, r) => sum + (r.met ? r.weight : 0), 0) * 100 / total) : null;
  return { listing, monthly, rules, complete, pass: complete && met === rules.length, met, known, score };
}

function Field({ label, value, setValue, placeholder, maxLength = 20 }: { label: string; value: string; setValue: (v: string) => void; placeholder?: string; maxLength?: number }) {
  return <label style={{ display: 'block', fontSize: 14, fontWeight: 650, minWidth: 0 }}>
    <span style={{ display: 'block', marginBottom: 5 }}>{label}</span>
    <input style={inputStyle} value={value} onChange={e => setValue(e.target.value)} placeholder={placeholder} maxLength={maxLength} />
  </label>;
}

export default function PrivateListingMatchStudio() {
  const [criteria, setCriteria] = useState<Criteria>({ budget: '', area: '', bedrooms: '', commute: '' });
  const [listings, setListings] = useState<Listing[]>([blank(1), blank(2)]);
  const nextId = useRef(3);
  const [showPreview, setShowPreview] = useState<{ source: string; text: string } | null>(null);
  const [allowDownload, setAllowDownload] = useState(false);
  const changeCriteria = (key: keyof Criteria, value: string) => setCriteria(prev => ({ ...prev, [key]: value }));
  const changeListing = (id: number, key: keyof Omit<Listing, 'id'>, value: string) =>
    setListings(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));

  const currentSource = JSON.stringify({ schema: 1, criteria, listings });
  const outcomes = useMemo(() => listings.map(item => calculate(item, criteria)), [listings, criteria]);
  const criteriaErrors = [
    scalar(criteria.budget, 'Maandgrens', 100000, true),
    scalar(criteria.area, 'Minimum oppervlak', 100000, true),
    scalar(criteria.bedrooms, 'Minimum slaapkamers', 100, true),
    scalar(criteria.commute, 'Maximum reistijd', 10000, true)
  ].filter(Boolean) as string[];
  const fieldErrors = listings.flatMap((row, index) => [
    !row.name.trim() ? 'Optie ' + (index + 1) + ': vul een herkenbare titel in.' : null,
    scalar(row.monthlyRent, 'Optie ' + (index + 1) + ': kale huur', 100000, true),
    scalar(row.utilities, 'Optie ' + (index + 1) + ': extra maandlasten', 100000, true),
    scalar(row.area, 'Optie ' + (index + 1) + ': oppervlak', 100000, true),
    scalar(row.bedrooms, 'Optie ' + (index + 1) + ': slaapkamers', 100, true),
    scalar(row.commute, 'Optie ' + (index + 1) + ': reistijd', 10000, true)
  ].filter(Boolean) as string[];
  const canCompare = criteriaErrors.length === 0 && fieldErrors.length === 0;
  const ordered = [...outcomes].sort((a, b) =>
    Number(b.pass) - Number(a.pass) || (b.score ?? -1) - (a.score ?? -1) || a.listing.id - b.listing.id);
  const previewValid = showPreview?.source === currentSource && canCompare;

  const makeReport = (): string => {
    const lines = [
      'WOONPOINTS · PRIVÉ WONINGVERGELIJKING', 'Eigen invoer; geen WoningNet-gegevens of officieel match-/toewijzingsadvies.',
      '', 'EIGEN GRENZEN',
      'Maximale maandkosten: ' + criteria.budget + ' EUR; minimaal oppervlak: ' + criteria.area + ' m²;',
      'Minimaal slaapkamers: ' + criteria.bedrooms + '; maximaal enkele-reisminuten: ' + criteria.commute,
      '', 'ZELF INGEVOERDE OPTIES (GEEN GECONTROLEERDE ADVERTENTIES)'
    ];
    ordered.forEach((item, index) => {
      lines.push('', String(index + 1) + '. ' + item.listing.name);
      lines.push('Indicatieve eigen totale maandkosten: ' + (item.monthly === null ? 'Onbekend' : money(item.monthly)));
      lines.push('Eigen voorwaarden: ' + (item.pass ? 'Alle vier gehaald' : 'Een of meer niet gehaald') +
        ' · gewogen indicatie ' + (item.score === null ? 'onvolledig' : item.score + '%') + ' (geen toewijzingskans)');
      item.rules.forEach(rule => lines.push(' - ' + rule.label + ': ' + (rule.met === null ? 'onbekend' : rule.met ? 'voldoet' : 'voldoet niet') +
        ' · ingevuld ' + String(rule.observed ?? '?') + ' / eigen grens ' + String(rule.required ?? '?') + ' (' + rule.detail + ')'));
      if (item.listing.note.trim()) lines.push('Eigen notitie: ' + item.listing.note.trim());
    });
    lines.push('', 'Alleen eigen getallen en notities. Niet gebruiken als bewijs van woninggeschiktheid, identiteit, inkomen of reservering.',
      'Er is niets verzonden, bewaard op een server of bij WoningNet geplaatst.');
    return lines.join('\n') + '\n';
  };
  const download = () => {
    if (!allowDownload || !previewValid || !showPreview) return;
    const blob = new Blob([showPreview.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'woonpoints-prive-woningvergelijking.txt';
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  return (
    <main style={{ maxWidth: 1000, padding: '24px 18px 80px', margin: 'auto', color: '#16342f', fontFamily: 'system-ui, sans-serif', lineHeight: 1.55 }}>
      <a href="/" style={{ color: '#075e57' }}>← Terug naar Woonpoints</a>
      <h1 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.7rem)', marginBottom: 8 }}>Mijn woningmatch · privé vergelijker</h1>
      <p>Vergelijk twee tot vijf <strong>zelf ingevulde</strong> woningopties met vier persoonlijke grenzen. De score is alleen een
        gewogen uitleg van jouw criteria, <strong>geen officiële matchkans, woningcheck of verhuurdersbeslissing</strong>.</p>
      <p style={{ borderLeft: '4px solid #0b7669', paddingLeft: 12 }}>Alle gegevens blijven in dit browsertabblad. Geen accountkoppeling,
        tracking, WoningNet-login, woningreactie, automatische opslag of netwerkverzoek door deze vergelijker.</p>

      <section aria-labelledby="criteria-heading" style={panelStyle}>
        <h2 id="criteria-heading">1. Stel je eigen grenzen in</h2>
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
          <Field label="Max. maandkosten (€)" value={criteria.budget} setValue={v => changeCriteria('budget', v)} placeholder="Bijv. 1050" />
          <Field label="Min. woonoppervlak (m²)" value={criteria.area} setValue={v => changeCriteria('area', v)} placeholder="Bijv. 55" />
          <Field label="Min. slaapkamers" value={criteria.bedrooms} setValue={v => changeCriteria('bedrooms', v)} placeholder="Bijv. 1" />
          <Field label="Max. enkele-reisminuten" value={criteria.commute} setValue={v => changeCriteria('commute', v)} placeholder="Bijv. 45" />
        </div>
        <p style={{ marginBottom: 0, fontSize: 14 }}>Vaste transparante weging: totale maandkosten 4, oppervlak 3,
          slaapkamers 2, reistijd 2. Een niet gehaald criterium blijft zichtbaar; hoge andere scores verbergen dat niet.</p>
      </section>

      <section aria-labelledby="options-heading">
        <h2 id="options-heading">2. Vul je opties in</h2>
        {listings.map((row, index) => (
          <article key={row.id} style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start' }}>
              <h3 style={{ marginTop: 0 }}>Optie {index + 1}</h3>
              <button type="button" disabled={listings.length <= 2} onClick={() => setListings(prev => prev.filter(item => item.id !== row.id))}>Verwijder</button>
            </div>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))' }}>
              <Field label="Naam of eigen label (zonder adres)" value={row.name} setValue={v => changeListing(row.id, 'name', v)} maxLength={80} placeholder="Woning A" />
              <Field label="Kale maandhuur (€)" value={row.monthlyRent} setValue={v => changeListing(row.id, 'monthlyRent', v)} placeholder="820" />
              <Field label="Overige maandlasten (€)" value={row.utilities} setValue={v => changeListing(row.id, 'utilities', v)} placeholder="230,50" />
              <Field label="Woonoppervlak (m²)" value={row.area} setValue={v => changeListing(row.id, 'area', v)} placeholder="62" />
              <Field label="Slaapkamers" value={row.bedrooms} setValue={v => changeListing(row.id, 'bedrooms', v)} placeholder="2" />
              <Field label="Reistijd enkele reis (min)" value={row.commute} setValue={v => changeListing(row.id, 'commute', v)} placeholder="32" />
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Eigen notitie (maximaal 200 tekens; geen privé-adres)" value={row.note} setValue={v => changeListing(row.id, 'note', v)} maxLength={200} placeholder="Bijvoorbeeld: eerst bellen voor bezichtiging" />
            </div>
          </article>
        ))}
        <button type="button" disabled={listings.length >= 5} onClick={() => setListings(prev => [...prev, blank(nextId.current++)])}
          style={{ padding: '10px 16px', border: '1px solid #075e57', borderRadius: 7, background: '#f2faf7' }}>
          + Woningoptie toevoegen ({listings.length}/5)
        </button>
      </section>

      <section style={{ ...panelStyle, marginTop: 22 }} aria-labelledby="result-heading">
        <h2 id="result-heading">3. Mijn uitlegbare vergelijking</h2>
        {!canCompare ? (
          <div role="status">
            <p>De vergelijking verschijnt pas wanneer alle vier criteria en alle verplichte gegevens van iedere optie geldig zijn.
              Blanco/ongeldige velden tellen niet als nul of als een goede match.</p>
            <ul>{[...criteriaErrors, ...fieldErrors].slice(0, 25).map((error, index) => <li key={index}>{error}</li>)}</ul>
          </div>
        ) : (
          <div aria-live="polite">
            <p>Gerangschikt op het behalen van <strong>alle vier</strong> eigen voorwaarden, daarna op gewogen criteria.
              Ook een hoog percentage kan nog een belangrijke eigen grens missen.</p>
            {ordered.map((outcome, index) => (
              <article key={outcome.listing.id} style={{ borderTop: '1px solid #ccdcd7', padding: '12px 0' }}>
                <h3 style={{ marginBottom: 4 }}>{index + 1}. {outcome.listing.name}</h3>
                <strong>{outcome.pass ? 'Alle 4 eigen grenzen gehaald' : outcome.met + ' van 4 grenzen gehaald'}</strong>
                <p style={{ marginTop: 4 }}>Gewogen criteriascore: {outcome.score}% · Geschatte maandlasten: {outcome.monthly === null ? 'Onbekend' : money(outcome.monthly)}</p>
                <ul>{outcome.rules.map(rule => <li key={rule.label}>
                  {rule.met ? '✓' : '✕'} {rule.label}: {rule.met ? 'voldoet' : 'voldoet niet'} ({String(rule.observed)} versus eigen grens {String(rule.required)}; {rule.detail})
                </li>)}</ul>
              </article>
            ))}
          </div>
        )}
      </section>

      <section style={panelStyle} aria-labelledby="export-heading">
        <h2 id="export-heading">4. Privérapport bekijken en downloaden</h2>
        <p>De optionele tekst bevat alleen jouw zelf ingevoerde labels, bedragen, criteria en notities.
          Bekijk de volledige inhoud vóór je deze bewust lokaal opslaat. Veranderen van invoer maakt een vorige preview ongeldig.</p>
        <button type="button" disabled={!canCompare} onClick={() => { setShowPreview({ source: currentSource, text: makeReport() }); setAllowDownload(false); }}>
          Volledige privé-TXT bekijken
        </button>
        {showPreview && !previewValid && <p role="status">De preview is verouderd. Bekijk eerst de gewijzigde inhoud opnieuw.</p>}
        {showPreview && previewValid && <>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 380, overflowY: 'auto', background: '#f2faf7', padding: 14, borderRadius: 8 }}>{showPreview.text}</pre>
          <label style={{ display: 'block', margin: '12px 0' }}>
            <input type="checkbox" checked={allowDownload} onChange={e => setAllowDownload(e.target.checked)} /> Ik heb dit volledige privédocument nagelezen en wil het zelf downloaden.
          </label>
          <button type="button" disabled={!allowDownload} onClick={download}>Download eigen TXT</button>
        </>}
      </section>
    </main>
  );
}
