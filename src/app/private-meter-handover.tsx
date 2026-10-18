'use client';

import { useMemo, useState } from 'react';

type MeterKey = 'powerDay' | 'powerNight' | 'gas' | 'water' | 'heat';
type HomeKey = 'old' | 'new';
type Reading = { day: string; values: Record<MeterKey, string> };
const METERS: { key: MeterKey; label: string; unit: string }[] = [
  { key: 'powerDay', label: 'Elektriciteit normaal', unit: 'kWh' },
  { key: 'powerNight', label: 'Elektriciteit dal', unit: 'kWh' },
  { key: 'gas', label: 'Gas', unit: 'm³' },
  { key: 'water', label: 'Water', unit: 'm³' },
  { key: 'heat', label: 'Warmte (indien aanwezig)', unit: 'GJ' }
];
const EMPTY_VALUES: Record<MeterKey, string> =
  { powerDay: '', powerNight: '', gas: '', water: '', heat: '' };
const EMPTY: Record<HomeKey, Reading> = {
  old: { day: '', values: { ...EMPTY_VALUES } },
  new: { day: '', values: { ...EMPTY_VALUES } }
};

function validDay(day: string): boolean {
  if (!/^20\d{2}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(day)) return false;
  const date = new Date(day + 'T12:00:00Z');
  return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === day;
}
function validReading(value: string): boolean {
  return /^(?:0|[1-9]\d{0,8})(?:[,.]\d{1,3})?$/.test(value);
}
function exportedReport(readings: Record<HomeKey, Reading>, included: Record<MeterKey, boolean>): string {
  const lines = [
    'WOONPOINTS · PERSOONLIJK METERSTANDENOVERZICHT',
    'Eigen notities · niet geverifieerd door verhuurder of energieleverancier.',
    'Dit document is niet automatisch verzonden en bewijst geen formele overdracht.',
    ''
  ];
  for (const home of ['old', 'new'] as HomeKey[]) {
    const entry = readings[home];
    lines.push(home === 'old' ? 'OUDE WONING' : 'NIEUWE WONING');
    lines.push('Zelf genoteerde datum: ' + (entry.day || 'onbekend'));
    for (const meter of METERS) {
      if (!included[meter.key]) continue;
      const number = entry.values[meter.key];
      lines.push(meter.label + ': ' + (number ? number.replace(',', '.') + ' ' + meter.unit : 'niet ingevuld'));
    }
    lines.push('');
  }
  lines.push('Controleer de gegevens persoonlijk bij sleuteloverdracht.');
  return lines.join('\r\n') + '\r\n';
}

/**
 * Private moving-day worksheet; no WoningNet API, account, localStorage,
 * third-party sync, automatic supplier submission, or energy-usage inference.
 */
export default function PrivateMeterHandover() {
  const [readings, setReadings] = useState<Record<HomeKey, Reading>>(EMPTY);
  const [included, setIncluded] = useState<Record<MeterKey, boolean>>({
    powerDay: true, powerNight: false, gas: true, water: true, heat: false
  });
  const [preview, setPreview] = useState<{ source: string; text: string } | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [feedback, setFeedback] = useState('');
  const source = JSON.stringify({ readings, included });
  const previewCurrent = preview !== null && preview.source === source;
  const selected = METERS.filter(meter => included[meter.key]);
  const status = useMemo(() => {
    const complete = (['old', 'new'] as HomeKey[]).flatMap(home =>
      METERS.filter(meter => included[meter.key] && validReading(readings[home].values[meter.key])))
      .length;
    const total = selected.length * 2;
    const invalid = (['old', 'new'] as HomeKey[]).some(home =>
      (readings[home].day !== '' && !validDay(readings[home].day)) ||
      METERS.some(meter => included[meter.key] && readings[home].values[meter.key] !== '' &&
        !validReading(readings[home].values[meter.key])));
    return { complete, total, invalid };
  }, [readings, included, selected.length]);

  function editDay(home: HomeKey, day: string) {
    setReadings(previous => ({
      ...previous, [home]: { ...previous[home], day: day.slice(0, 10) }
    }));
    setConfirmed(false); setFeedback('');
  }
  function editMeter(home: HomeKey, meter: MeterKey, value: string) {
    setReadings(previous => ({
      ...previous,
      [home]: { ...previous[home],
        values: { ...previous[home].values, [meter]: value.slice(0, 16) } }
    }));
    setConfirmed(false); setFeedback('');
  }
  function buildPreview() {
    if (!selected.length || status.invalid) {
      setFeedback('Controleer eerst de gekozen meters en ongeldige invoer.');
      setPreview(null); setConfirmed(false); return;
    }
    setPreview({ source, text: exportedReport(readings, included) });
    setConfirmed(false); setFeedback('');
  }
  function download() {
    if (!previewCurrent || !confirmed || preview === null) return;
    const blob = new Blob([preview.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'woonpoints-eigen-meterstanden.txt';
    document.body.appendChild(link);
    link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setConfirmed(false);
    setFeedback('Eigen bestand aangevraagd. Controleer zelf de inhoud voordat je iets deelt.');
  }
  function reset() {
    setReadings({
      old: { day: '', values: { ...EMPTY_VALUES } },
      new: { day: '', values: { ...EMPTY_VALUES } }
    });
    setPreview(null); setConfirmed(false);
    setFeedback('Je invoer is uitsluitend uit dit tabblad gewist.');
  }

  return <section className="panel" aria-labelledby="private-meter-handover-heading"
    style={{ display: 'block' }}>
    <p className="eyebrow">PRIVÉ SLEUTELOVERDRACHT</p>
    <h2 id="private-meter-handover-heading">Meterstanden oude en nieuwe woning</h2>
    <p>Leg op de overdrachtsdag zelf de standen vast. Vul alleen meters in die echt bij de
      betreffende woning horen. Standen van twee verschillende woningen worden nooit van
      elkaar afgetrokken. Er is geen accountkoppeling of automatische leveranciersmelding.</p>
    <fieldset style={{ border: '1px solid #c4d6c9', borderRadius: 12, padding: 14 }}>
      <legend><strong>Welke meters wil je opnemen?</strong></legend>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {METERS.map(meter => <label key={meter.key} style={{ display: 'inline-flex',
          alignItems: 'center', gap: 7, minHeight: 44 }}>
          <input type="checkbox" checked={included[meter.key]}
            onChange={event => {
              setIncluded(previous => ({ ...previous, [meter.key]: event.target.checked }));
              setConfirmed(false); setFeedback('');
            }} />
          {meter.label}
        </label>)}
      </div>
    </fieldset>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
      gap: 16, marginTop: 16 }}>
      {(['old', 'new'] as HomeKey[]).map(home => <fieldset key={home}
        style={{ border: '1px solid #c4d6c9', borderRadius: 12, padding: 16,
          minWidth: 0 }}>
        <legend><strong>{home === 'old' ? 'Oude woning' : 'Nieuwe woning'}</strong></legend>
        <label style={{ display: 'block', fontWeight: 700 }}>
          Datum zelf genoteerd
          <input type="date" min="2000-01-01" max="2099-12-31"
            value={readings[home].day} onChange={event => editDay(home, event.target.value)}
            style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 6 }} />
        </label>
        {selected.map(meter => {
          const value = readings[home].values[meter.key];
          const invalid = value !== '' && !validReading(value);
          return <label key={meter.key} style={{ display: 'block', marginTop: 14,
            fontWeight: 700 }}>
            {meter.label} ({meter.unit})
            <input type="text" inputMode="decimal" autoComplete="off"
              aria-invalid={invalid} value={value} maxLength={16}
              placeholder="Niet ingevuld" onChange={event => editMeter(home, meter.key, event.target.value)}
              style={{ display: 'block', width: '100%', minHeight: 44, marginTop: 6 }} />
            {invalid && <small style={{ color: '#a32a20', display: 'block' }}>
              Gebruik maximaal negen cijfers en hoogstens drie decimalen, zonder minteken.
            </small>}
          </label>;
        })}
      </fieldset>)}
    </div>
    <p role="status" aria-live="polite">
      {status.complete} van {status.total} geselecteerde standen ingevuld.
      {' '}Lege standen blijven nadrukkelijk onbekend.
    </p>
    {status.invalid && <p role="alert">Een datum of stand is ongeldig. Controleer de invoer.</p>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
      <button type="button" disabled={!selected.length || status.invalid}
        onClick={buildPreview}>Bekijk volledig overdrachtsbestand</button>
      <button type="button" className="secondary" onClick={reset}>Wis mijn invoer</button>
    </div>
    {preview !== null && <div style={{ marginTop: 16, padding: 16, border: '1px solid #91a99a',
      borderRadius: 12 }}>
      {!previewCurrent && <p role="alert">De invoer is gewijzigd. Controleer een nieuwe export.</p>}
      {previewCurrent && <>
        <p><strong>Controleer alles wat je straks downloadt:</strong></p>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 340,
          overflowY: 'auto' }}>{preview.text}</pre>
        <label style={{ display: 'flex', gap: 9, alignItems: 'start', marginTop: 12 }}>
          <input type="checkbox" checked={confirmed}
            onChange={event => setConfirmed(event.target.checked)} />
          Ik heb dit volledige privébestand bekeken en kies bewust of en met wie ik het deel.
        </label>
        <button type="button" disabled={!confirmed} onClick={download}
          style={{ marginTop: 12 }}>Download exact dit gecontroleerde TXT-bestand</button>
      </>}
    </div>}
    <p role="status" aria-live="polite">{feedback}</p>
    <p>Alle gegevens blijven alleen in het huidige browsertabblad totdat je zelf een
      TXT-bestand aanvraagt. Vernieuwen of sluiten wist de invoer. Een gedownload bestand
      kan privégegevens bevatten: bewaar en deel dit uitsluitend zelf. Geen synchronisatie,
      accountbewijs, officiële meterregistratie of koppeling aan energieleveranciers.</p>
  </section>;
}
