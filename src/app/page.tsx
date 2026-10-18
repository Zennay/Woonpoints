import { PrivateMovingDayTimeline } from './manual-month-progress';
import { PrivateMovingPackingInventory } from './manual-month-progress';
import { PrivateReactionWorkflow, PrivateReactionPacing, PrivateCommuteComparison } from './position-stats';
import PositionStats from './position-stats';
import { PrivateMovingVolume, PrivateMovingHandover, PrivateMoveDocumentReadiness, PrivateMovingExpenseLedger, PrivateMovingQuoteComparison, PrivateMovingCostSplit, PrivateMovingWorkspace } from './manual-month-progress';
import { ManualHousingDecisionWorkspace, PrivatePhotoComparison } from './position-stats';

const cards = [
  ['Maanddoel', 'Onbekend', 'Doel: 4 geldige reacties; geen geverifieerde accountgegevens'],
  ['Actieve reacties', 'Onbekend', 'Nog geen account gekoppeld; actuele gegevens ontbreken'],
  ['Zoekpunten', '—', 'Nog geen puntensnapshot beschikbaar'],
  ['Worker', 'Dry-run', 'Live reageren is bewust geblokkeerd']
];

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">WOONPOINTS</p>
        <h1>Je WoningNet-zoektocht, overzichtelijk en controleerbaar.</h1>
        <p className="lede">
          Deze repository-baseline bewaakt voortgang, voorkeuren en historische posities. Live reageren
          staat nog uit totdat de actuele WoningNet-flow veilig is gevalideerd.
        </p>
      </section>


      <nav className="quick-nav" aria-label="Direct naar een Woonpoints-onderdeel">
        <div className="quick-nav-head">
          <strong>Direct naar</strong>
          <span>Alleen handmatige hulpmiddelen · geen live account</span>
        </div>
        <ul className="quick-nav-links">
          {([
            ['projectstatus-heading', 'Status'],
            ['manual-progress-heading', 'Maanddoel'],
            ['private-reaction-pacing-heading', 'Maandplan'],
            ['private-points-heading', 'Zoekpunten'],
            ['reaction-journal-title', 'Reacties'],
            ['housing-shortlist-heading', 'Woningen'],
            ['private-budget-title', 'Woonkosten'],
            ['private-commute-heading', 'Woon-werk'],
            ['private-longterm-title', 'Meerjarenkosten'],
            ['private-viewing-title', 'Bezichtiging'],
            ['private-photo-comparison-heading', 'Fotovergelijking'],
            ['private-plan-title', 'Planner'],
            ['private-moving-heading', 'Verhuizen'],
            ['private-moving-volume-heading', 'Verhuisvolume'],
            ['private-moving-workspace-heading', 'Verhuiswerkmap'],
            ['private-moving-day-heading', 'Verhuisdag'],
            ['private-packing-heading', 'Paklijst'],
            ['private-handover-heading', 'Sleutelrapport'],
            ['private-document-readiness-heading', 'Documenten'],
            ['private-moving-expenses-heading', 'Werkelijke kosten'],
            ['private-moving-quotes-heading', 'Verhuisoffertes'],
            ['private-cost-split-heading', 'Kosten delen'],
            ['position-stats-heading', 'Posities'],
            ['monthly-positions-heading', 'Maandtrend']
          ] as const).map(([id, title]) =>
            <li key={id}><a href={'#'+id}>{title}</a></li>
          )}
        </ul>
      </nav>

      <section className="status-section" aria-labelledby="projectstatus-heading">
        <h2 id="projectstatus-heading" className="sr-only">Projectstatus</h2>
        <div className="grid">
          {cards.map(([label, value, detail]) => (
            <article className="card" key={label}>
              <h3>{label}</h3>
              <strong>{value}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
      </section>

      <PrivateReactionWorkflow>
        <PositionStats />
      </PrivateReactionWorkflow>
      <PrivateReactionPacing />
      <ManualHousingDecisionWorkspace />
      <PrivatePhotoComparison />
      <PrivateCommuteComparison />
      <PrivateMovingVolume />
      <PrivateMovingWorkspace />
      <PrivateMovingDayTimeline />
      <PrivateMovingPackingInventory />
      <PrivateMovingHandover />
      <PrivateMoveDocumentReadiness />
      <PrivateMovingQuoteComparison />
      <PrivateMovingExpenseLedger />
      <PrivateMovingCostSplit />

      <section className="panel">
        <div>
          <p className="eyebrow">VEILIGHEID</p>
          <h2>Human-in-the-loop waar het ertoe doet</h2>
        </div>
        <ul>
          <li>Geen WoningNet-wachtwoorden of MFA-codes in de database.</li>
          <li>Alleen eigen of aantoonbaar geautoriseerde accounts.</li>
          <li>Loginproblemen, CAPTCHA, bezichtigingen en aanbiedingen pauzeren de worker.</li>
          <li>De huidige worker accepteert uitsluitend <code>BOT_DRY_RUN=true</code>.</li>
        </ul>
      </section>
    </main>
  );
}
