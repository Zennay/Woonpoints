'use client';

import { useMemo, useState } from 'react';

type Answer = 'yes' | 'no' | 'unknown';
type Signal = {
  id: string;
  group: 'Identiteit en kanaal' | 'Betalen en documenten' | 'Afspraak en overeenkomst';
  question: string;
  why: string;
  next: string;
  severity: 'urgent' | 'check';
};

const signals: readonly Signal[] = [
  {
    id: 'unverified-contact', group: 'Identiteit en kanaal', severity: 'urgent',
    question: 'Kan ik de afzender of verhuurder niet onafhankelijk via een officieel kanaal bevestigen?',
    why: 'Een profielnaam, logo of meegestuurde link is op zichzelf geen onafhankelijk identiteitsbewijs.',
    next: 'Zoek de organisatie of verhuurder zelf via een vertrouwde bron en neem via dat kanaal contact op.'
  },
  {
    id: 'moved-conversation', group: 'Identiteit en kanaal', severity: 'check',
    question: 'Wordt de communicatie verplaatst naar een onbekend privéaccount of een ander platform?',
    why: 'Daardoor kan de oorspronkelijke aanbieder of de officiële omgeving buiten beeld raken.',
    next: 'Controleer het aanbod en de afzender opnieuw in het oorspronkelijke, officiële kanaal.'
  },
  {
    id: 'upfront-payment', group: 'Betalen en documenten', severity: 'urgent',
    question: 'Moet ik vooruitbetalen voordat ik de overeenkomst, ontvanger en betaalreden kan verifiëren?',
    why: 'Zonder verifieerbare ontvanger en voorwaarden is een betaling moeilijk te beoordelen of te herstellen.',
    next: 'Maak niets over totdat de identiteit, betaalgegevens, reden en schriftelijke voorwaarden onafhankelijk zijn bevestigd.'
  },
  {
    id: 'identity-upload', group: 'Betalen en documenten', severity: 'urgent',
    question: 'Wordt om een identiteitsbewijs, inlogcode of gevoelige gegevens gevraagd via een onbevestigd kanaal?',
    why: 'Gevoelige gegevens horen alleen bij een duidelijk omschreven, noodzakelijk en vertrouwd proces.',
    next: 'Deel geen codes of documenten via die route; verifieer eerst rechtstreeks met de officiële partij.'
  },
  {
    id: 'odd-payment', group: 'Betalen en documenten', severity: 'check',
    question: 'Wordt een ongebruikelijke betaalmethode of een betaling aan een andere naam gevraagd?',
    why: 'Een afwijkende ontvanger of betaalroute vraagt om onafhankelijke controle, ook als er een verklaring bij staat.',
    next: 'Controleer ontvanger en betaalinstructies via een apart, vertrouwd contactkanaal.'
  },
  {
    id: 'cannot-view', group: 'Afspraak en overeenkomst', severity: 'check',
    question: 'Mag ik de woning of de aangeboden voorwaarden niet voldoende controleren vóór een beslissing?',
    why: 'Zonder inspectie of duidelijke stukken blijven belangrijke eigenschappen en verplichtingen onbevestigd.',
    next: 'Vraag om een verifieerbare bezichtiging, volledige voorwaarden en tijd om die rustig door te nemen.'
  },
  {
    id: 'pressure', group: 'Afspraak en overeenkomst', severity: 'urgent',
    question: 'Word ik onder druk gezet om onmiddellijk te tekenen, te betalen of gegevens te versturen?',
    why: 'Tijdsdruk kan onafhankelijke controle en een weloverwogen keuze onmogelijk maken.',
    next: 'Stop de handeling en vraag tijd voor onafhankelijke controle of advies.'
  },
  {
    id: 'unclear-terms', group: 'Afspraak en overeenkomst', severity: 'check',
    question: 'Zijn huur, borg, kosten, looptijd of verantwoordelijkheden niet helder en schriftelijk vastgelegd?',
    why: 'Mondelinge of ontbrekende voorwaarden kunnen later tot verschillende verwachtingen leiden.',
    next: 'Vraag om een volledige schriftelijke uitsplitsing en laat twijfelpunten toelichten voordat je akkoord gaat.'
  },
  {
    id: 'different-offer', group: 'Afspraak en overeenkomst', severity: 'urgent',
    question: 'Verschillen de gegevens van de aangeboden woning of contractpartij van de officiële bron?',
    why: 'Een afwijkend adres, woningtype of contractpartij kan betekenen dat je niet hetzelfde aanbod beoordeelt.',
    next: 'Vergelijk zelfstandig de originele publicatie en vraag schriftelijk om uitleg voor elk verschil.'
  }
] as const;

const groups = ['Identiteit en kanaal', 'Betalen en documenten', 'Afspraak en overeenkomst'] as const;
const labels: Record<Answer, string> = { yes: 'Ja, dit speelt', no: 'Nee', unknown: 'Weet ik niet' };

function safeExport(answers: Record<string, Answer>, checkedAt: string): string {
  const lines = [
    'WOONPOINTS · PRIVÉ WONINGAANBODCHECK',
    'Zelf ingevulde aandachtspunten (geen identiteits- of fraudecontrole)',
    'Gecontroleerd op: ' + checkedAt,
    '',
    ...signals.flatMap(signal => [
      signal.group + ' — ' + signal.question,
      'Antwoord: ' + (answers[signal.id] ? labels[answers[signal.id]] : 'Niet ingevuld'),
      ...(answers[signal.id] === 'yes' ? ['Volgende stap: ' + signal.next] : []),
      ...(answers[signal.id] === 'unknown' ? ['Volgende stap: onafhankelijke informatie verzamelen.'] : []),
      ''
    ]),
    'BELANGRIJK: Dit is alleen jouw eigen checklist. Geen WoningNet-, bank-, verhuurder- of juridische verificatie.',
    'Er zijn geen persoonsgegevens, documentinhoud, betaalgegevens of externe verificaties verwerkt.'
  ];
  return lines.join('\n');
}

export default function PrivateOfferSafetyPage() {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [preview, setPreview] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const findings = useMemo(() => {
    const flagged = signals.filter(signal => answers[signal.id] === 'yes');
    const unknown = signals.filter(signal => answers[signal.id] === 'unknown');
    const unanswered = signals.filter(signal => !answers[signal.id]);
    return {
      flagged, unknown, unanswered,
      urgent: flagged.filter(signal => signal.severity === 'urgent'),
      checked: signals.length - unanswered.length
    };
  }, [answers]);
  const report = safeExport(answers, new Date().toLocaleDateString('nl-NL'));
  const status = findings.urgent.length > 0
    ? 'Eerst stoppen en onafhankelijk controleren'
    : findings.flagged.length > 0 || findings.unknown.length > 0 || findings.unanswered.length > 0
      ? 'Nog aandachtspunten of ontbrekende informatie'
      : 'Geen signalen door jou gemeld — géén verificatie';

  function setAnswer(id: string, value: Answer) {
    setAnswers(current => ({ ...current, [id]: value }));
    setPreview(false);
    setConfirmReset(false);
  }

  function downloadReport() {
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-eigen-woningaanbodcheck.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPreview(false);
  }

  return (
    <main className="shell" style={{ maxWidth: 940, paddingTop: 28 }}>
      <a href="/" style={{ color: '#075e57', fontWeight: 700 }}>← Terug naar Woonpoints</a>
      <header className="hero">
        <p className="eyebrow" style={{ marginTop: 26 }}>PRIVÉ CONTROLE · GEEN AUTOMATISCHE ACTIES</p>
        <h1 style={{ fontSize: 'clamp(34px, 6vw, 54px)' }}>Woningaanbodcheck</h1>
        <p className="lede">Controleer in drie stappen of je een woningaanbod, bericht of huurvoorstel
          eerst onafhankelijk moet verifiëren. De vragen werken volledig in dit tabblad:
          geen account, opslag, externe aanvraag of WoningNet-reactie.</p>
      </header>

      <section className="card" aria-label="Resultaatoverzicht" style={{ marginTop: 24 }}>
        <p aria-live="polite" role="status"><strong>{status}</strong></p>
        <p>{findings.checked} van {signals.length} vragen beantwoord · {findings.flagged.length} gemelde signalen ·
          {' '}{findings.unknown.length} onbekend · {findings.unanswered.length} open.</p>
        {findings.urgent.length > 0 && <p><strong>Actie vóór betaling, delen of ondertekening:</strong>
          {' '}ga niet verder op basis van dit bericht alleen. Controleer onafhankelijk de betrokken partij en de voorwaarden.</p>}
        <p style={{ fontSize: 14 }}>Deze zelfcheck controleert géén echt aanbod, identiteit, huurrecht,
          adres, website, bankrekening of documenten. Ook nul signalen is geen bewijs van betrouwbaarheid.</p>
      </section>

      {groups.map((group, index) => <section className="card" key={group} style={{ marginTop: 18 }}>
        <h2 style={{ fontSize: 25, marginBottom: 12 }}>{index + 1}. {group}</h2>
        {signals.filter(signal => signal.group === group).map(signal => (
          <fieldset key={signal.id} style={{ border: '1px solid #dbe6dd', borderRadius: 12, padding: '12px 14px', margin: '12px 0' }}>
            <legend style={{ fontWeight: 750, padding: '0 5px', maxWidth: '100%' }}>{signal.question}</legend>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
              {(['yes', 'no', 'unknown'] as const).map(value => <label key={value} style={{ display: 'flex', gap: 7, alignItems: 'center', minHeight: 44, cursor: 'pointer' }}>
                <input type="radio" name={'offer-' + signal.id} value={value}
                  checked={answers[signal.id] === value} onChange={() => setAnswer(signal.id, value)} />
                {labels[value]}
              </label>)}
            </div>
            {answers[signal.id] === 'yes' && <div style={{ background: '#fff7e5', borderRadius: 9, padding: 12 }}>
              <p><strong>Waarom controleren?</strong> {signal.why}</p>
              <p><strong>Volgende stap:</strong> {signal.next}</p>
            </div>}
            {answers[signal.id] === 'unknown' && <p style={{ marginBottom: 0 }}>
              Zoek deze informatie eerst via een onafhankelijk, vertrouwd kanaal op.
            </p>}
          </fieldset>
        ))}
      </section>)}

      <section className="card" style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 25 }}>Jouw concrete vervolg</h2>
        {findings.flagged.length === 0 && findings.unknown.length === 0 && findings.unanswered.length === 0
          ? <p>Je hebt zelf geen van de signalen gemeld. Controleer desondanks de aanbieder, het schriftelijke
              aanbod en de betaalinstructies buiten dit scherm.</p>
          : <ol style={{ lineHeight: 1.7, paddingLeft: 22 }}>
              {findings.flagged.map(signal => <li key={signal.id}>{signal.next}</li>)}
              {findings.unknown.length > 0 && <li>Zoek onafhankelijke bevestiging voor de {findings.unknown.length}
                {' '}onbekende {findings.unknown.length === 1 ? 'vraag' : 'vragen'}.</li>}
              {findings.unanswered.length > 0 && <li>Beantwoord de {findings.unanswered.length}
                {' '}open {findings.unanswered.length === 1 ? 'vraag' : 'vragen'} voordat je op deze check vertrouwt.</li>}
            </ol>}
        <p>Bij twijfel: gebruik zelf gevonden officiële contactgegevens, neem tijd voor advies en
          meld vermoedelijke fraude via de daarvoor bestemde officiële kanalen. Deze tool verstuurt niets.</p>
        <details>
          <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 44 }}>Wat bewaren we van je antwoorden?</summary>
          <p>Niets op een server of in browseropslag. Alleen React-tabbladgeheugen totdat je dit tabblad
            sluit of herlaadt. Er wordt geen formulier, adres, bedrag, identiteitsbewijs, URL of rekeningnummer gevraagd.
            Een eigen gedownload TXT-bestand kun je buiten Woonpoints bewaren of delen; controleer zelf de opslaglocatie.</p>
        </details>
      </section>

      <section className="card" style={{ marginTop: 20, marginBottom: 32 }}>
        <h2 style={{ fontSize: 24 }}>Zelf meenemen of opnieuw beginnen</h2>
        <button type="button" onClick={() => { setPreview(value => !value); setConfirmReset(false); }}
          style={{ minHeight: 44, padding: '9px 14px', margin: '12px 8px 12px 0' }}>
          {preview ? 'Sluit voorbeeld' : 'Bekijk mijn privé-TXT'}
        </button>
        {preview && <div>
          <p>Alleen bovenstaande keuzes en bijbehorende algemene adviezen; geen persoonlijke documenten.</p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxHeight: 330, overflow: 'auto', padding: 16, background: '#f3f6f3' }}>{report}</pre>
          <button type="button" onClick={downloadReport} style={{ minHeight: 44, padding: '9px 14px' }}>
            Download gecontroleerd TXT-bestand
          </button>
        </div>}
        <button type="button" onClick={() => { setConfirmReset(true); setPreview(false); }}
          style={{ minHeight: 44, padding: '9px 14px', marginLeft: 8 }}>Wis antwoorden</button>
        {confirmReset && <div role="group" aria-label="Antwoorden wissen" style={{ paddingTop: 12 }}>
          <p>Alle {findings.checked} antwoorden in dit tabblad wissen?</p>
          <button type="button" onClick={() => { setAnswers({}); setConfirmReset(false); setPreview(false); }}
            style={{ minHeight: 44, padding: '9px 14px' }}>Ja, wis alles</button>
          <button type="button" onClick={() => setConfirmReset(false)}
            style={{ minHeight: 44, padding: '9px 14px', marginLeft: 8 }}>Annuleren</button>
        </div>}
      </section>
    </main>
  );
}
