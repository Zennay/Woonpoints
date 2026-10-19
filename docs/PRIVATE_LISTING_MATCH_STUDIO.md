# Mijn woningmatch — eigen woningopties vergelijken

Open **Mijn woningmatch** via de navigatie of rechtstreeks via `/#private-woningmatch-heading`.

## Wat je hiermee kunt

- Leg **twee tot vijf** zelf gekozen woningen naast elkaar zonder een WoningNet-account, API, browserbot of advertentiescraper.
- Bepaal vier persoonlijke criteria: maximale **totale** maandlasten, minimale m², minimaal aantal slaapkamers, maximale enkele-reisminuten.
- Vul per woning een eigen label (liever geen exact adres), kale huur, ingeschatte overige maandlasten, m², slaapkamers, reistijd en optionele korte notitie in.
- Bekijk per woning welke zelf opgegeven voorwaarden **wel/niet** worden gehaald. Kies nu ook je eigen **prioriteit per criterium (1–5)**, met startwaarden geld 4, oppervlak 3, kamers 2, reistijd 2. Er wordt eerst gerangschikt op het volledig halen van **alle vier harde voorwaarden**, vervolgens op de gewogen score. Zelfs gewicht 1 kan een gemiste harde grens nooit verborgen of automatisch toegestaan maken.
- Alle velden zijn vereist voor een vergelijking. Lege en ongeldige waarden worden dus niet als `0`, als bekende advertentiegegevens of als een geslaagde match voorgesteld.
- Open een **volledige TXT-preview** met exacte eigen criteria, per-woning uitleg en optionele notities, vink afzonderlijk aan dat je de inhoud wilt downloaden. Iedere bewerking maakt de preview ongeldig.

## Nieuw: persoonlijke matchprioriteiten

Bij je vier eigen harde voorwaarden kun je afzonderlijk kiezen hoe zwaar geld, ruimte,
slaapkamers en reistijd wegen. De vijf mogelijke prioriteiten zijn strikt begrensd en
veranderen direct de relatieve percentages en volgorde. Alle vier harde grenzen
blijven onveranderd geldig: een woning die niet voldoet, wordt nooit als volledig
passend gepresenteerd door bijvoorbeeld een laag gewicht aan budget toe te kennen.
Met **Herstel startweging** keer je terug naar 4/3/2/2.

De volledige optionele TXT vermeldt nu óók de vier persoonlijk gekozen prioriteiten
en het gewicht per wel/niet gehaald criterium. Zowel de TXT-preview als een nog niet
bevestigde import-preview vervalt conservatief bij iedere prioriteitswijziging,
zodat een oude beoordeling niet als je nieuwe beslissing kan worden gedownload.
Dit blijft een lokale rekenkundige voorkeur, **geen** officieel woningalgoritme,
voorraadstatus, geschiktheids- of toewijzingskans.

## Nieuw: eigen woningopties in één keer plakken

In het onderdeel **Eigen woninglijst plakken** kan de gebruiker nu optioneel twee tot vijf eigen records
met precies deze zeven puntkomma-gescheiden kolommen vooraf bekijken:

```text
label;kale_huur;extra_maandlasten;m2;slaapkamers;reistijd_min;notitie
Woning A;800;190;60;1;30;zelf bekijken
Woning B;880;210;75;2;45;
```

De tekst blijft maximaal 4.096 tekens in het tabblad. Geen bestand, server, scraper, website of WoningNet wordt aangeroepen.
Alle kolommen zijn exact en in vaste volgorde vereist; maximaal vijf records, unieke labels, bekende begrensde
getallen, gehele slaapkamers/reistijd en korte vrije labels/notities zonder verborgen besturingstekens.
Geciteerde CSV, puntkomma's binnen notities en onverwachte velden worden bewust niet stilzwijgend gerepareerd.

De gebruiker ziet eerst **alle** nieuw herkende opties met de ingevulde waarden. Alleen na een
afzonderlijk aangevinkte bevestiging worden de huidige tijdelijke opties vervangen. Bij gewijzigde bron,
velden of plaktekst vervalt de preview. Na de import is **éénmalig ongedaan maken** beschikbaar,
tot de gebruiker een nieuwe woningoptie toevoegt, verwijdert of bewerkt. Criteria blijven gelijk;
de bestaande TXT-preview moet opnieuw worden opgebouwd.

## Veiligheids- en privacygrenzen

De invoer, berekeningen en preview blijven uitsluitend in het actieve tabblad. Er zijn geen nieuwe netwerkverzoeken, database-, cookie-, localStorage- of serverwrites; een bewust gedownloade TXT is vervolgens jouw eigen verantwoordelijkheid. Sluiten/herladen van het tabblad verwijdert je tijdelijke invoer. Voer bij voorkeur geen identificeerbaar woningadres of persoonlijke gegevens in het vrije notitieveld in.

Dit is **geen officiële toewijzings- of wachttijdscore**, geverifieerde woningadvertentie, hypotheek-/inkomenscheck, fraudeoordeel of automatische woningreactie. Andere kosten (borg, verhuizing, eenmalige inrichting) zitten niet automatisch in de geschatte maandlasten. De gebruiker moet zelf de volledigheid en juistheid van huur, servicekosten en reistijd nagaan; een hoog percentage kan nog steeds een harde eigen grens missen.

De bestaande maandreactieplanner, woonpositiehistorie, aanbodcheck, import- en exportcontracten zijn niet gewijzigd. De feature verleent geen live-capability, toestemming of bewijs van geregistreerde WoningNet-reacties.

## Operationele oplevering

Dit is een zelfstandige clientcomponent binnen de bestaande, reeds voor Docker expliciet toegelaten `src/app/page.tsx`, bereikbaar via de bestaande navigatie in `src/app/layout.tsx`. De Docker file-allowlist blijft onveranderd en weigert dus ook na deze feature onbekende nieuwe bestanden. Geen nieuwe dependencies, workflows, QA- of regressiesuites. Release via bestaande repository-branch, verplichte CI/review en reguliere deploy-admissie, niet door een productscore of documentpreview.
