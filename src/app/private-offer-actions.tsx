'use client';

import { useMemo, useState } from 'react';

type Answer = 'yes' | 'no' | 'unknown';
type Workblad = {
  id: number;
  answers: Record<string, Answer>;
  reviewed: Record<string, boolean>;
};
type Signal = {
  id: string;
  group: string;
  question: string;
  next: string;
  severity: 'urgent' | 'check';
};
type Action = {
  caseId: number;
  signal: Signal;
  answer: Answer | undefined;
  reviewed: boolean;
};

export function PrivateOfferActionBoard({
  cases, signals, onSelect, onToggle
}: {
  cases: readonly Workblad[];
  signals: readonly Signal[];
  onSelect: (id: number) => void;
  onToggle: (caseId: number, signalId: string) => void;
}) {
  const [includeReviewed, setIncludeReviewed] = useState(false);
  const [preview, setPreview] = useState(false);
  const actions = useMemo<Action[]>(() => cases.flatMap(item =>
    signals.flatMap(signal => {
      const answer = item.answers[signal.id];
      if (answer === 'no') return [];
      return [{
        caseId: item.id,
        signal,
        answer,
        reviewed: (answer === 'yes' || answer === 'unknown') &&
          item.reviewed[signal.id] === true
      }];
    })
  ), [cases, signals]);
  const pending = actions.filter(action => !action.reviewed);
  const visible = includeReviewed ? actions : pending;
  const urgent = pending.filter(action =>
    action.answer === 'yes' && action.signal.severity === 'urgent').length;
  const unknown = pending.filter(action => action.answer === 'unknown').length;
  const missing = pending.filter(action => !action.answer).length;
  const report = [
    'WOONPOINTS · PRIVÉ VERVOLGACTIES',
    'Zelf ingevuld op ' + new Date().toLocaleDateString('nl-NL'),
    'Dit is geen verificatie van een aanbieder, woning, identiteit of betaalverzoek.',
    'Afvinken betekent alleen dat je een stap zelf hebt nagelopen; het signaal verdwijnt niet.',
    '',
    ...pending.map(action => [
      'Voorstel ' + action.caseId + ' · ' + action.signal.group,
      (action.answer === 'yes' ? 'Zelf gemeld' : action.answer === 'unknown' ?
        'Nog onbekend' : 'Nog niet beantwoord') +
        (action.answer === 'yes' && action.signal.severity === 'urgent' ? ' · URGENT' : ''),
      'Vraag: ' + action.signal.question,
      'Vervolg: ' + (action.answer === 'yes' ? action.signal.next :
        'Zoek onafhankelijke informatie en vul dit werkblad zelf aan.'),
      ''
    ].join('\n'))
  ].join('\n');

  function openQuestion(action: Action) {
    onSelect(action.caseId);
    window.requestAnimationFrame(() => {
      document.getElementById('offer-question-' + action.signal.id)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
  function download() {
    const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'woonpoints-open-vervolgacties-prive.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setPreview(false);
  }

  return <section className="card" aria-label="Privé vervolgacties voor alle voorstellen"
    style={{ marginTop: 24 }}>
    <h2 style={{ fontSize: 24 }}>Mijn open vervolgacties · alle voorstellen</h2>
    <p>Werk de zelf gemelde en onbekende signalen per voorstel af zonder tussen
      werkbladen te zoeken. Vragen die je nog niet hebt ingevuld blijven zichtbaar.
      Er wordt niets verzonden, opgeslagen of gecontroleerd bij een derde partij.</p>
    <p aria-live="polite" role="status">
      <strong>{pending.length} open aandachtspunten</strong> · {urgent} urgente
      zelf gemelde signalen · {unknown} onbekend · {missing} onbeantwoord.
    </p>
    <p style={{ fontSize: 14 }}>Dit is géén veilige-aanbiedingenranglijst.
      Een afgevinkte stap bevestigt geen identiteit, overeenkomst of betaling.
      Bij een urgent signaal: stop en controleer onafhankelijk voordat je doorgaat.</p>
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
      <input type="checkbox" checked={includeReviewed}
        onChange={event => setIncludeReviewed(event.target.checked)} />
      Toon ook zelf nagelopen vervolgstappen
    </label>
    {visible.length === 0
      ? <p>Geen acties in deze weergave. Ook zonder signalen blijft onafhankelijke
          controle van een echt aanbod noodzakelijk.</p>
      : <ol style={{ paddingLeft: 24 }}>
        {visible.map(action => <li key={action.caseId + ':' + action.signal.id}
          style={{ padding: '10px 0', borderBottom: '1px solid #e5ece7' }}>
          <strong>Voorstel {action.caseId}</strong> · {action.signal.group}
          {action.answer === 'yes' && action.signal.severity === 'urgent' &&
            <strong> · Urgent zelf gemeld</strong>}
          <div style={{ margin: '6px 0' }}>{action.signal.question}</div>
          <p style={{ margin: '5px 0' }}>
            {action.answer === 'yes' ? action.signal.next :
              action.answer === 'unknown'
                ? 'Nog onbekend: verzamel onafhankelijke informatie.'
                : 'Nog niet ingevuld: beantwoord de vraag in dit werkblad.'}
          </p>
          {action.answer === 'yes' || action.answer === 'unknown' ? <label
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 44,
              marginRight: 14 }}>
            <input type="checkbox" checked={action.reviewed}
              onChange={() => onToggle(action.caseId, action.signal.id)} />
            Zelf nagekeken (geen verificatie)
          </label> : null}
          <button type="button" onClick={() => openQuestion(action)}
            style={{ minHeight: 44, padding: '7px 12px' }}>
            Open vraag in voorstel {action.caseId}
          </button>
        </li>)}
      </ol>}
    <div style={{ borderTop: '1px solid #dbe6dd', paddingTop: 14 }}>
      <h3>Vrijwillige privé-actielijst</h3>
      <p>Bekijk de exacte inhoud vóór je de open acties als TXT downloadt.
        Een gekozen downloadlocatie kan buiten deze browser synchroniseren.
        Geen adressen, huurprijzen, documenten of gekoppelde financiële momentopnames.</p>
      <button type="button" onClick={() => setPreview(value => !value)}
        style={{ minHeight: 44, padding: '9px 14px' }}>
        {preview ? 'Sluit voorbeeld' : 'Bekijk mijn open actielijst'}
      </button>
      {preview && <div>
        <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
          maxHeight: 300, overflow: 'auto', padding: 14, background: '#f3f6f3' }}>
          {report}
        </pre>
        <button type="button" onClick={download}
          style={{ minHeight: 44, padding: '9px 14px' }}>
          Download deze bekeken actielijst
        </button>
      </div>}
    </div>
  </section>;
}
