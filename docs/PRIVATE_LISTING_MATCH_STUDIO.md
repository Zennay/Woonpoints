# Mijn woningmatch — eigen woningopties vergelijken

Open **Mijn woningmatch** via de navigatie of rechtstreeks via `/#private-woningmatch-heading`.

## Wat je hiermee kunt

- Leg **twee tot vijf** zelf gekozen woningen naast elkaar zonder een WoningNet-account, API, browserbot of advertentiescraper.
- Bepaal vier persoonlijke criteria: maximale **totale** maandlasten, minimale m², minimaal aantal slaapkamers, maximale enkele-reisminuten.
- Vul per woning een eigen label (liever geen exact adres), kale huur, ingeschatte overige maandlasten, m², slaapkamers, reistijd en optionele korte notitie in.
- Bekijk per woning welke zelf opgegeven voorwaarden **wel/niet** worden gehaald. De scores gebruiken expliciete vaste gewichten: geld 4, oppervlak 3, kamers 2, reistijd 2. Er wordt eerst gerangschikt op het volledig halen van alle criteria, vervolgens op de gewogen score.
- Alle velden zijn vereist voor een vergelijking. Lege en ongeldige waarden worden dus niet als `0`, als bekende advertentiegegevens of als een geslaagde match voorgesteld.
- Open een **volledige TXT-preview** met exacte eigen criteria, per-woning uitleg en optionele notities, vink afzonderlijk aan dat je de inhoud wilt downloaden. Iedere bewerking maakt de preview ongeldig.

## Veiligheids- en privacygrenzen

De invoer, berekeningen en preview blijven uitsluitend in het actieve tabblad. Er zijn geen nieuwe netwerkverzoeken, database-, cookie-, localStorage- of serverwrites; een bewust gedownloade TXT is vervolgens jouw eigen verantwoordelijkheid. Sluiten/herladen van het tabblad verwijdert je tijdelijke invoer. Voer bij voorkeur geen identificeerbaar woningadres of persoonlijke gegevens in het vrije notitieveld in.

Dit is **geen officiële toewijzings- of wachttijdscore**, geverifieerde woningadvertentie, hypotheek-/inkomenscheck, fraudeoordeel of automatische woningreactie. Andere kosten (borg, verhuizing, eenmalige inrichting) zitten niet automatisch in de geschatte maandlasten. De gebruiker moet zelf de volledigheid en juistheid van huur, servicekosten en reistijd nagaan; een hoog percentage kan nog steeds een harde eigen grens missen.

De bestaande maandreactieplanner, woonpositiehistorie, aanbodcheck, import- en exportcontracten zijn niet gewijzigd. De feature verleent geen live-capability, toestemming of bewijs van geregistreerde WoningNet-reacties.

## Operationele oplevering

Dit is een zelfstandige clientcomponent binnen de bestaande, reeds voor Docker expliciet toegelaten `src/app/page.tsx`, bereikbaar via de bestaande navigatie in `src/app/layout.tsx`. De Docker file-allowlist blijft onveranderd en weigert dus ook na deze feature onbekende nieuwe bestanden. Geen nieuwe dependencies, workflows, QA- of regressiesuites. Release via bestaande repository-branch, verplichte CI/review en reguliere deploy-admissie, niet door een productscore of documentpreview.
