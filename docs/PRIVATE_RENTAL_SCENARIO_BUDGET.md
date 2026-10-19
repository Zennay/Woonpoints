# Privé huurscenario's vergelijken

Open het onderdeel **Huurscenario’s vergelijken** in de woningcategorie van
Snelstart/Alles, of gebruik het anker
[`/#rental-scenarios-heading`](/#rental-scenarios-heading).

## Wat je werkelijk kunt doen

Vergelijk twee eigen, **niet door een verhuurder bevestigde** woningopties en
voeg desgewenst een derde toe. Geef de woningen alleen een kort zelfgekozen
label. Voer je persoonlijke maximale maandlasten in en per woning de kale huur,
servicekosten, geschat energie/water/internet, reiskosten, eenmalige
verhuiskosten en borg. Met komma of punt zijn maximaal twee decimalen
toegestaan. Elk bedrag is begrensd op € 50.000; ongeldige of onvolledige
scenario's worden niet berekend en niet gedownload.

Woonpoints toont per scenario:
- maandelijkse lasten en ruimte ten opzichte van **je eigen** maandgrens;
- de kasbehoefte voor de eerste maand inclusief borg en verhuiskosten;
- twaalf maal de eigen maandlasten plus eenmalige verhuiskosten;
- apart gereserveerde borg, die niet als normale jaaruitgave wordt geteld;
- eerstejaars kasbehoefte inclusief voorlopig vastgezette borg.

De maandgrens is je eigen notitie en beslist niets over huurtoeslag,
acceptatie, inkomen of juridische betaalbaarheid. De bedragen blijven twaalf
maanden gelijk in deze eenvoudige vergelijking. Belastingen, toeslagen,
prijsstijgingen, officiële puntentelling, borgteruggave en toekomstige
variabele tarieven zijn niet berekend; een lager berekend bedrag is geen
aanbeveling voor een bepaald huis.

## Privacy en export

Alle invoer leeft uitsluitend in de React-state van het huidige tabblad: geen
cookies, lokale browseropslag, accountkoppeling, serveraanroep, Google,
WoningNet, automatische reactie of upload. Sluiten wist de invoer. **Wis alle
eigen scenario's** vraagt een tweede bewuste bevestiging.

**Bekijk mijn privé-TXT vóór downloaden** toont exact het tekstbestand.
Je moet vervolgens bewust op **Download precies deze privé-TXT** klikken;
elke wijziging in huur, kosten, maandbudget of woningselectie vervalt het
eerder getoonde concept. Een eventuele gesynchroniseerde downloadmap is de
verantwoordelijkheid van het lokale toestel/de bestandsprovider.

Dit is een vrije productfunctie en verandert geen `BOT_DRY_RUN`,
WoningNet-integratie of production admission. De bestaande GitHub-hosted
CI/review/releasevoorwaarden blijven gelden voordat iets naar productie kan.
Geen QA- of regressiesuites zijn toegevoegd of handmatig gedraaid.

## Versiegebonden privé-JSON terugzetten

Naast de tekstsamenvatting bestaat **Bekijk mijn JSON vóór bewaren**:
een exacte, korte `woonpoints-rental-scenarios` versie 1 back-up van
je eigen twee of drie woningen en maandgrens. Je moet de volledige
JSON eerst bekijken en daarna bewust op de downloadknop klikken.
Onvolledige decimalen, ongeldige labels en onherstelbare waarden
worden geweigerd voordat de downloadknop verschijnt.

**Open een eerdere eigen Woonpoints-JSON** leest uitsluitend een
zelfgekozen bestand van maximaal 8 KiB. Onbekende velden, dubbele
JSON-sleutels, niet-canonieke serialisatie, afwijkende versie,
verkeerde woningvolgorde en bedragen buiten de grenzen worden
geweigerd. Een geldige import krijgt eerst een volledige preview,
met een aparte expliciete vervangingsknop. De bestaande invoer wordt
pas daarna aangepast. Eén keer **Herstel mijn vorige tabbladinvoer**
maakt die import ongedaan, totdat je verder bewerkt. Een oudere
asynchrone bestandslezing mag latere wijzigingen of een nieuwere
bestandskeuze niet alsnog overschrijven.

De JSON is privé: eigen woninglabels en bedragen kunnen zichtbaar
zijn als je het bestand deelt of in een cloudgesynchroniseerde map
plaatst. Woonpoints gebruikt geen server, mail, cookies, automatische
accountsynchronisatie of opslag in de browser voor deze workflow.

## Twee bevestigingen: van eigen huurvoorstel naar scenario A

In de bestaande privé-Huurvoorstellen-desk kies je eerst een **zelf ingevuld**
huurvoorstel en vervolgens **Bekijk dit eigen huurvoorstel bij mijn
huurscenario’s**. Dat opent slechts een tijdelijk voorstel in de
scenariovergelijker; nog niets is aangepast. Je ziet vooraf welke eigen
bedragen en welk korte label meekomen. Pas **Ja, vervang woning A** neemt
kale huur, service, energie/overige lasten en gereserveerde borg over.
Woning B/C en je maandgrens blijven ongemoeid. De reis- en
verhuiskosten van woning A worden bewust op 0 gezet om zelf in te vullen.
**Nee** laat alles staan. Wijzig je intussen het eigen bronvoorstel,
dan vervalt een nog openstaand overdrachtsvoorstel.

Dit is een expliciet lokale, door de gebruiker beheerde handoff tussen
bestaande React-componenten; geen automatische koppeling met WoningNet,
bank, verhuurder, externe dienst of beveiligde accountinhoud. Er is
geen automatische opslag en geen server- of netwerkverzoek.

## Product-integratie en Docker-brongrens

De complete React-vergelijker is samengebracht in de bestaande, reeds
expliciet toegelaten `src/app/page.tsx`, niet als extra build-context
dependency. De oorspronkelijke exacte `.dockerignore`-allowlist blijft
onveranderd. De tijdelijke losstaande TSX-bron is verwijderd toen de
component in de bestaande dashboardmodule landde. De normale
Woonpoints-GitHub-workflows controleren de integratie opnieuw op de
definitieve PR-head; deze documentatie is geen claim dat een aparte
QA-test of production release succesvol is uitgevoerd.

## Wat-als: hoger maandbedrag en eigen bufferdoel

Het extra paneel **Wat-als: onverwachte lasten en mijn eigen reserve**
past dezelfde basiswoningen niet automatisch aan. Je voert één eigen
hypothetische extra maandlast van € 0–1.000 in, kiest een fictieve
toename van alleen de post energie/water/internet (0, 10, 20 of 30%)
en een gewenste reserve van 1, 2, 3 of 6 maanden van de nieuwe
maandlasten. De cijfers zijn simulaties: het zijn geen energietarieven,
statistische voorspellingen, aanbevelingen of wettelijke normen.

Per woning toont het paneel de extra lasten, nieuwe maandlast,
eigen-budgetmarge, persoonlijke bufferberekening, eerste-maand
kasbehoefte inclusief gereserveerde borg en de gesimuleerde kosten
over twaalf gelijke maanden exclusief terug te krijgen borg.
De buffer is **geen betaling of spaarsaldo** en wordt niet opgeteld
bij de eerstejaarsuitgaven.

**Bekijk basis + wat-als als privé-TXT** toont beide tabellen
naast de eigen simulatiekeuzes in dezelfde vrijwillige preview.
Elke aanpassing aan de scenario's, maandgrens of wat-als-invoer
maakt het eerdere TXT-voorbeeld ongeldig. De versie 1 JSON-back-up
blijft bewust het eerdere, compatibele basisschema van eigen
woningen en budget bevatten; hypothetische stresstestinstellingen
worden daarin niet meegenomen. Ook deze simulatie blijft
uitsluitend in de huidige browser-tabbladstatus, zonder server,
accountkoppeling, WoningNet-verzoek of opslag door Woonpoints.
