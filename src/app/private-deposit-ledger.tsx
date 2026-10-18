'use client';

import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';

type DepositEvent = {
  id: string;
  kind: 'terugontvangen' | 'ingehouden';
  date: string;
  label: string;
  amountCents: number;
};
type DepositBackup = {
  kind: 'woonpoints-private-borgboek';
  schema: 1;
  depositCents: number;
  entries: DepositEvent[];
};
const KIND = 'woonpoints-private-borgboek' as const;
const MAX_FILE = 12 * 1024;
const MAX_ENTRIES = 24;
const MAX_CENTS = 5_000_000;
const euro = (cents: number) => new Intl.NumberFormat('nl-NL', {
  style: 'currency', currency: 'EUR'
}).format(cents / 100);

function parseEuro(value: string): number | null {
  const trimmed = value.trim();
  if (!/^(?:0|[1-9]\d{0,4})(?:[,.]\d{1,2})?$/.test(trimmed)) return null;
  const parts = trimmed.replace(',', '.').split('.');
  const cents = Number(parts[0]) * 100 + Number((parts[1] || '').padEnd(2, '0'));
  return Number.isSafeInteger(cents) && cents <= MAX_CENTS ? cents : null;
}
function validCents(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= MAX_CENTS;
}
function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function exactKeys(value: object, expected: string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every(key => expected.includes(key));
}
function safeLabel(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 80 &&
    value === value.trim() && !/[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value);
}
function validateBackup(value: unknown): DepositBackup {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      !exactKeys(value, ['kind', 'schema', 'depositCents', 'entries'])) throw Error('schema');
  const backup = value as Partial<DepositBackup>;
  if (backup.kind !== KIND || backup.schema !== 1 || !validCents(backup.depositCents) ||
      !Array.isArray(backup.entries) || backup.entries.length > MAX_ENTRIES) throw Error('data');
  const seen = new Set<string>();
  for (const entry of backup.entries) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) ||
        !exactKeys(entry, ['id', 'kind', 'date', 'label', 'amountCents']) ||
        typeof entry.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(entry.id) ||
        seen.has(entry.id) ||
        (entry.kind !== 'terugontvangen' && entry.kind !== 'ingehouden') ||
        !isValidDate(entry.date) || !safeLabel(entry.label) ||
        !validCents(entry.amountCents) || entry.amountCents === 0) throw Error('entry');
    seen.add(entry.id);
  }
  return backup as DepositBackup;
}
function saveFile(name: string, contents: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PrivateDepositLedger() {
  const [deposit, setDeposit] = useState('');
  const [entries, setEntries] = useState<DepositEvent[]>([]);
  const [eventKind, setEventKind] = useState<DepositEvent['kind']>('terugontvangen');
  const [eventDate, setEventDate] = useState('');
  const [eventLabel, setEventLabel] = useState('');
  const [eventAmount, setEventAmount] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<{data: DepositBackup; before: string} | null>(null);
  const depositCents = parseEuro(deposit);
  const current: DepositBackup | null = depositCents === null ? null : {
    kind: KIND, schema: 1, depositCents, entries
  };
  const summary = useMemo(() => {
    const refunded = entries.filter(item => item.kind === 'terugontvangen')
      .reduce((sum, item) => sum + item.amountCents, 0);
    const deducted = entries.filter(item => item.kind === 'ingehouden')
      .reduce((sum, item) => sum + item.amountCents, 0);
    const rest = depositCents === null ? null : depositCents - refunded - deducted;
    return { refunded, deducted, rest };
  }, [entries, depositCents]);

  function changeDeposit(value: string) {
    setDeposit(value); setPending(null); setNotice('');
  }
  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cents = parseEuro(eventAmount);
    if (entries.length >= MAX_ENTRIES || !safeLabel(eventLabel.trim()) ||
        !isValidDate(eventDate) || cents === null || cents === 0 ||
        depositCents === null) {
      setNotice('Controleer de datum, omschrijving, oorspronkelijke borg en bedrag (maximaal 24 regels).');
      return;
    }
    setEntries(previous => [...previous, {
      id: crypto.randomUUID(), kind: eventKind, date: eventDate,
      label: eventLabel.trim(), amountCents: cents
    }]);
    setEventLabel(''); setEventAmount(''); setNotice('Eigen gebeurtenis toegevoegd.');
    setPending(null);
  }
  function removeEvent(id: string) {
    setEntries(previous => previous.filter(item => item.id !== id));
    setPending(null); setNotice('Eigen regel verwijderd.');
  }
  function downloadJson() {
    if (!current) { setNotice('Vul eerst een geldig oorspronkelijk borgbedrag in.'); return; }
    const contents = JSON.stringify(current, null, 2);
    if (new TextEncoder().encode(contents).length > MAX_FILE) {
      setNotice('Het bestand is te groot voor veilig herstel (12 KiB).'); return;
    }
    saveFile('woonpoints-prive-borgboek.json', contents, 'application/json;charset=utf-8');
    setNotice('Privé-back-up gedownload. Bewaar deze zelf op een veilige plek.');
  }
  function downloadTxt() {
    if (!current) { setNotice('Vul eerst een geldig oorspronkelijk borgbedrag in.'); return; }
    const lines = [
      'MIJN EIGEN BORGOVERZICHT — GEEN OFFICIEEL BEWIJS',
      'Oorspronkelijke borg (zelf ingevuld): ' + euro(current.depositCents),
      'Zelf genoteerd terugontvangen: ' + euro(summary.refunded),
      'Zelf genoteerde inhoudingen: ' + euro(summary.deducted),
      'Nog niet verklaard / saldo: ' + euro(summary.rest || 0),
      'Dit overzicht zegt niets over de rechtsgeldigheid van inhoudingen of terugbetaling.',
      '', ...entries.map(e => e.date + ' | ' + e.kind + ' | ' + euro(e.amountCents) + ' | ' + e.label)
    ];
    saveFile('woonpoints-prive-borgoverzicht.txt', lines.join('\n'), 'text/plain;charset=utf-8');
    setNotice('Eigen TXT is gedownload; controleer de gegevens vóór delen.');
  }
  async function chooseBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    setPending(null);
    if (!file) return;
    if (file.size > MAX_FILE) {
      setNotice('Back-up geweigerd: maximaal 12 KiB. Huidige gegevens zijn behouden.'); return;
    }
    try {
      const text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      if (new TextEncoder().encode(text).length > MAX_FILE) throw Error('size');
      const parsed = validateBackup(JSON.parse(text));
      if (current === null) throw Error('invalid current');
      setPending({ data: parsed, before: JSON.stringify(current) });
      setNotice('Controleer eerst de inhoudsverschillen hieronder. Er is nog niets vervangen.');
    } catch {
      setNotice('Geen geldig Woonpoints-borgboek. De huidige gegevens zijn niet veranderd.');
    }
  }
  function restoreBackup() {
    if (!pending || !current || pending.before !== JSON.stringify(current)) {
      setPending(null);
      setNotice('Eigen gegevens zijn gewijzigd. Kies de back-up opnieuw om die te beoordelen.');
      return;
    }
    setDeposit((pending.data.depositCents / 100).toFixed(2).replace('.', ','));
    setEntries(pending.data.entries);
    setPending(null); setNotice('Back-up hersteld in dit tabblad. Oude regels zijn vervangen.');
  }
  return (
    <section className="panel" aria-labelledby="private-deposit-heading">
      <div>
        <p className="eyebrow">NA DE VERHUIZING · ALLEEN IN DIT TABBLAD</p>
        <h2 id="private-deposit-heading">Mijn privé-borgboek</h2>
        <p>Leg je oorspronkelijke borg, zelf ontvangen terugbetalingen en eigen notities over inhoudingen vast.
          De berekening is alleen je persoonlijke administratie; dit is geen betalingsbewijs, juridisch oordeel
          of verificatie bij een verhuurder.</p>
      </div>
      <div>
        <label htmlFor="deposit-original">Oorspronkelijke borg in euro&apos;s</label>
        <input id="deposit-original" inputMode="decimal" type="text" maxLength={9}
          placeholder="Bijv. 850,00" value={deposit}
          onChange={e => changeDeposit(e.target.value)} />
        {deposit && depositCents === null && <p role="alert">Gebruik een bedrag van € 0 tot € 50.000 met maximaal twee decimalen.</p>}
        <dl>
          <div><dt>Zelf terugontvangen</dt><dd>{euro(summary.refunded)}</dd></div>
          <div><dt>Zelf genoteerd ingehouden</dt><dd>{euro(summary.deducted)}</dd></div>
          <div><dt>Nog niet verklaard (geen opeisbaar saldo)</dt>
            <dd>{summary.rest === null ? 'Vul borg in' : euro(summary.rest)}</dd></div>
        </dl>
        {summary.rest !== null && summary.rest < 0 &&
          <p role="alert">Je ingevoerde terugbetalingen en inhoudingen zijn samen hoger dan de oorspronkelijke borg. Controleer de eigen cijfers.</p>}
        <form onSubmit={addEvent}>
          <h3>Nieuwe eigen boekingsnotitie</h3>
          <label htmlFor="deposit-kind">Wat heb je zelf genoteerd?</label>
          <select id="deposit-kind" value={eventKind}
            onChange={e => setEventKind(e.target.value as DepositEvent['kind'])}>
            <option value="terugontvangen">Bedrag daadwerkelijk ontvangen (eigen notitie)</option>
            <option value="ingehouden">Inhouding zelf genoteerd (niet juridisch beoordeeld)</option>
          </select>
          <label htmlFor="deposit-date">Datum</label>
          <input id="deposit-date" type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
          <label htmlFor="deposit-label">Korte omschrijving (geen persoonsgegevens)</label>
          <input id="deposit-label" value={eventLabel} maxLength={80}
            onChange={e => setEventLabel(e.target.value)} required placeholder="Bijv. terugbetaling deel 1" />
          <label htmlFor="deposit-amount">Bedrag in euro&apos;s</label>
          <input id="deposit-amount" inputMode="decimal" value={eventAmount}
            onChange={e => setEventAmount(e.target.value)} required placeholder="Bijv. 150,00" />
          <button type="submit" disabled={entries.length >= MAX_ENTRIES || depositCents === null}>Voeg eigen notitie toe</button>
        </form>
        <h3>Mijn notities ({entries.length}/{MAX_ENTRIES})</h3>
        {entries.length === 0 ? <p>Nog geen terugbetalingen of inhoudingen ingevuld.</p> :
          <ul>{entries.map(entry => <li key={entry.id}>
            <strong>{entry.date} · {entry.kind} · {euro(entry.amountCents)}</strong>
            {' — '}{entry.label}{' '}
            <button type="button" onClick={() => removeEvent(entry.id)}
              aria-label={'Verwijder eigen notitie ' + entry.date + ' ' + entry.label}>Verwijder</button>
          </li>)}</ul>}
        <p>Geen automatische opslag: sluit je dit tabblad, dan verdwijnen deze eigen gegevens.
          JSON bevat ook de omschrijvingen; deel het bestand niet zonder controle.</p>
        <button type="button" onClick={downloadJson} disabled={!current}>Download volledige privé-JSON</button>{' '}
        <button type="button" onClick={downloadTxt} disabled={!current}>Download leesbaar TXT</button>
        <label htmlFor="deposit-import">Herstel een eerder gedownload privé-borgboek (max. 12 KiB)</label>
        <input id="deposit-import" type="file" accept=".json,application/json" onChange={chooseBackup} />
        {pending && <div role="group" aria-label="Bevestig herstel borgboek">
          <p><strong>Vervang alle huidige gegevens?</strong> Huidig: {entries.length} regels, borg {euro(current?.depositCents || 0)}.
            Back-up: {pending.data.entries.length} regels, borg {euro(pending.data.depositCents)}.
            Dit vervangt alle eigen notities in deze sessie, niet je eerdere bestanden.</p>
          <button type="button" onClick={restoreBackup}>Ja, vervang mijn borgboek</button>{' '}
          <button type="button" onClick={() => { setPending(null); setNotice('Herstel geannuleerd.'); }}>Annuleer</button>
        </div>}
        {notice && <p role="status" aria-live="polite">{notice}</p>}
      </div>
    </section>
  );
}
