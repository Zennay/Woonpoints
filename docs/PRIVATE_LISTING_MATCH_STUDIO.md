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

## Nieuw: twee matches naar de bestaande kostenvergelijker

Dezelfde persoonlijke woningmatch kan nu ook worden verbonden met de **bestaande
twee-scenario kostenvergelijker**, zodat gebruikers niet opnieuw dezelfde kale
huurprijzen hoeven overtypen. Kies in de ranking expliciet een woning als **A**
en een andere als **B**. Als beide woninglabels passen in de financiële module
(1–64 tekens, zonder onzichtbare stuurcodes/leidende spaties) en hun kale
huren exacte gehele bedragen zijn tussen €100 en €10.000, toont een
**volledige brongebonden preview** de twee gekozen woninglabels, kale
huurbedragen, eigen criteriauitslag en private scores.

De scores en voorwaarden worden nooit als huur- of officiële toewijzingsdata
doorgegeven. Pas na een apart aangevinkt akkoord stuurt de match één
**tijdelijke in-memory aanbieding met precies twee `{label,rent}`-paren**
naar de reeds bestaande kostenvergelijker. Geen React state, database, API
of externe bron wordt vanzelf opgeslagen. In de kostenvergelijker staat
**opnieuw een preview met een tweede toestemmingskeuze**; pas na bevestigen
vervangt die de twee tijdelijke scenario's. Andere maandlasten, borg,
energie, reis- en startkosten worden op blanco standaardramingen gezet,
niet uit de matchtekst of een algoritme gehaald. De gebruiker vult zelf
werkelijke bedragen aan en start apart de bestaande kostenberekening.
Het begin van de match blijft ongewijzigd.

Iedere bronbewerking maakt de eerste preview ongeldig. De tweede
bestemmingsbevestiging is aan de **exacte inhoud van de twee ontvangen
paren** gebonden; eerder aangevinkte toestemming voor een ander
voorstel autoriseert geen nieuwe import. Een mislukte bestemmevaluatie
laat de oude kosteninvoer staan. Dit is een eigen conceptvergelijking,
geen aanbod, actie op WoningNet of financiële geschiktheidsverklaring.

## Nieuw: woningmatch naar eigen huurvoorstel — dubbele toestemming

De al bestaande **Mijn woningmatch** en **Huurvoorstellen** zijn nu echt gekoppeld.
Kies bij een ingevulde woning **Bekijk overname naar eigen huurvoorstel…**
om eerst een volledige, brongebonden preview van jouw keuze te openen.
Je ziet het zelf gekozen label, de exacte kale huur, de huidige geschatte
totale maandlasten en of de vier persoonlijke grenzen gehaald zijn.
Bij een niet passende woning verschijnt een expliciete waarschuwing;
de keuze wordt **niet** stilzwijgend gefilterd of als officiële kans getoond.

Alleen als het label voldoet aan de doelmodule (1–64 tekens, geen control
characters/whitespace aan de randen) én kale huur een geheel bedrag van
€100–€10.000 is, kan de overdracht worden aangeboden. De bestaande vergelijking
zelf accepteert bewust andere bedragen/labels; die worden niet stilzwijgend
afgerond of ingekort. Wijzigingen aan criteria, relatieve gewichten, methode,
woningbedragen of notities maken de oude preview ongeldig.

De gebruiker vinkt daarna **apart** aan dat uitsluitend eigen
`{label, rent}` als tijdelijk voorstel mag worden aangeboden. Ook dan
zijn er **twee verdere handelingen vereist**: in de bestaande Huurvoorstellendesk
zelf kiezen of de tijdelijke kopie mag worden vooringevuld, en vervolgens
zelf de ontbrekende service-, energie-, borg-, verhuiskosten,
ingangsdatum en status controleren en het concept afzonderlijk opslaan.

Er wordt uit de match dus **geen** volledige kostenraming, matchscore,
lotingskans, accountgegevens, bezoek-/reactiestatus, adres of officiële
aanbieding aan de huurdesk verzonden. Er gebeurt geen save, upload, API,
browseropslag, WoningNet-actie of automatisch aanbod. De andere al
bestaande shortlist-handoffs blijven onveranderd en onafhankelijk.

## Nieuw: bewuste loting- of inschrijfduurvoorkeur

De M2-privévergelijker bevat nu ook een handmatig genoteerde **toewijzingsmethode** per
woning: *Onbekend*, *Loting* of *Inschrijfduur*. Je kunt daarnaast los daarvan jouw
persoonlijke voorkeur instellen op *Geen*, *Loting* of *Inschrijfduur*.
De bekende, zelf ingevoerde methode wordt met eigen voorkeur vergeleken en op elke
woningkaart en in de privacy-preview expliciet getoond. Alleen bij **gelijke score**
onder de oorspronkelijke **vier harde kosten-/ruimte-/kamers-/reistijdvoorwaarden**
telt een bekende passende methode vóór onbekend, en onbekend vóór een bekende
afwijkende methode. De gewogen matchscore blijft gebaseerd op de vier bestaande
waarden en meet **geen** lotingskans, inschrijfduur, WoningNet-toewijzing of echte
woningbronzekerheid.

De bestaande 7-koloms tekstimport blijft bewust achterwaarts compatibel en
zet de methode van iedere nieuwe geplakte woning op *Onbekend*; er is geen
geautomatiseerde inferentie uit het woonlabel of notitieveld.

De privé-JSON-export gebruikt nu precies `woonpoints.private-match.v2` en bewaart
naast de bestaande criteria en 1–5 gewichten ook jouw methodevoorkeur en de
zelf ingevoerde methode per woning. Bij herstel blijven oude **v1-bestanden**
ondersteund, maar krijgen ze uitsluitend *geen voorkeur* en *onbekende methode*
op alle woningen, zonder onbewezen metadata bij te verzinnen. De volledige
herstelpreview toont alle velden vóór een afzonderlijke bevestiging en oude
previews vervallen zodra je toewijzingsvoorkeur wijzigt.

## Nieuw: complete lokale back-up en bewuste restore

Een gebruiker kan de **volledige eigen privéwoningmatch** (ook een tijdelijk onvolledig
concept) als `woonpoints.private-match.v2` JSON apart bewaren. De export bevat alleen
vier eigen criteria, vier gewichten, methodevoorkeur, 2–5 zelf ingevoerde woningopties en optionele
notities; geen interne tijdelijke row-ID, account, reacties, authenticatie, externe
listing of WoningNet-bewijs. De tekst wordt volledig getoond; pas na afzonderlijk
aanvinken kan de eigenaar zelf een lokaal JSON-bestand downloaden.

Via **Open eigen woningmatch-back-up** kan de eigenaar later een v1- of v2-bestand van maximaal 12 KiB
lokale UTF-8 JSON opnieuw openen. Het formulier weigert niet-UTF-8, afwijkende
schema's/versies, extra of ontbrekende velden, ongeldige numerieke grenswaarden,
onvolledige surrogate-paren, dubbele niet-lege woninglabels of ongeldige gewichtwaarden
(alleen gehele 1–5). Geen externe API of server ziet het gekozen bestand.
De browser toont vóór vervanging **alle** criteria, gewichten, methodevoorkeur, woninglabels,
bedragen, oppervlaktes, kamers, reistijden en notities. Niets wordt gewijzigd
zonder een apart bevestigingsvakje. Een wijziging van de huidige invoer tijdens
de preview maakt het voorbeeld ongeldig.

De vorige volledige invoer kan na herstel één keer ongedaan worden gemaakt, zolang
nog geen nieuwe formulieredit is uitgevoerd. Een restore of undo maakt de oude
TXT- en JSON-exportpreviews ongeldig en wist de oude CSV-undo-optie.
Geldig geschreven onvolledige concepten mogen wel worden teruggezet, maar
leveren nog steeds géén fictieve score totdat de ontbrekende gegevens ingevuld zijn.
Bestanden kunnen op het gekozen apparaat eventueel automatisch worden
gesynchroniseerd: beheer dat zelf.

## Veiligheids- en privacygrenzen

De invoer, berekeningen en preview blijven uitsluitend in het actieve tabblad. Er zijn geen nieuwe netwerkverzoeken, database-, cookie-, localStorage- of serverwrites; een bewust gedownloade TXT is vervolgens jouw eigen verantwoordelijkheid. Sluiten/herladen van het tabblad verwijdert je tijdelijke invoer. Voer bij voorkeur geen identificeerbaar woningadres of persoonlijke gegevens in het vrije notitieveld in.

Dit is **geen officiële toewijzings- of wachttijdscore**, geverifieerde woningadvertentie, hypotheek-/inkomenscheck, fraudeoordeel of automatische woningreactie. Andere kosten (borg, verhuizing, eenmalige inrichting) zitten niet automatisch in de geschatte maandlasten. De gebruiker moet zelf de volledigheid en juistheid van huur, servicekosten en reistijd nagaan; een hoog percentage kan nog steeds een harde eigen grens missen.

De bestaande maandreactieplanner, woonpositiehistorie, aanbodcheck, import- en exportcontracten zijn niet gewijzigd. De feature verleent geen live-capability, toestemming of bewijs van geregistreerde WoningNet-reacties.

## Operationele oplevering

Dit is een zelfstandige clientcomponent binnen de bestaande, reeds voor Docker expliciet toegelaten `src/app/page.tsx`, bereikbaar via de bestaande navigatie in `src/app/layout.tsx`. De Docker file-allowlist blijft onveranderd en weigert dus ook na deze feature onbekende nieuwe bestanden. Geen nieuwe dependencies, workflows, QA- of regressiesuites. Release via bestaande repository-branch, verplichte CI/review en reguliere deploy-admissie, niet door een productscore of documentpreview.


## Nieuwe functie: meetbare verschillen en veilig wat-als-scenario

**Mijn uitlegbare vergelijking** geeft per **niet gehaald** criterium nu het
exacte verschil met je eigen grens weer: euro per maand boven het maximum,
m² of slaapkamers onder het minimum, of reisminuten boven het maximum.
Dit verschil komt uitsluitend uit je handmatig ingevulde getallen; het
is geen beschikbaarheidscheck, officiële afwijzing of garantie dat bedragen
in de advertentie volledig zijn. Hetzelfde verschil staat ook in de
bestaande, expliciet te beoordelen privé-TXT-preview.

Onder **Wat verandert er als mijn grenzen anders zijn?** kun je een tweede,
tijdelijk scenario met vier andere grenzen invoeren. Per zelf ingevoerde
woning toont Woonpoints de oorspronkelijke positie en scenariopositie,
het aantal behaalde harde grenzen, het gewogen percentage en resterende
verschillen. Eerst alle vier harde grenzen, dan de bestaande relatieve
gewichten en pas bij gelijke score de zelf genoteerde methodevoorkeur.
De oorspronkelijke vergelijking blijft zichtbaar en ongewijzigd.

De scenarioanalyse is **geen editor** voor de echte brongegevens en
wijzigt nooit het eigen TXT-rapport, JSON-back-up, kostenvergelijking
of de Huurvoorstellen-overdracht. Bij verandering van een oorspronkelijke
waarde, prioriteit of woningoptie wordt het scenario onmiddellijk
ongeldig; alleen **Begin nieuw scenario** maakt een nieuwe momentopname.
Ongeldige scenariogrenzen geven een invoermelding en geen uitslag.
Sluiten gooit alleen de tijdelijke scenario-invoer weg. Er wordt niets
automatisch opgeslagen, doorgestuurd of op WoningNet uitgevoerd.


## Zevenkoloms privéwoninglijst downloaden en opnieuw plakken

Na het handmatig invoeren of wijzigen van twee tot vijf woningopties kun je nu
onder **Eigen woninglijst plakken** ook **Bekijk volledige eigen CSV vóór downloaden**
kiezen. Eerst worden de exacte zeven puntkomma-gescheiden kolommen als gewone
tekst getoond; pas na apart aanvinken ontstaat een lokale CSV-download.

De tekst gebruikt precies het bestaande, begrensde importschema:
label;kale_huur;extra_maandlasten;m2;slaapkamers;reistijd_min;notitie.
Het exportpad weigert onvolledige cijfers, gebroken UTF-16, verborgen
besturingstekens, dubbele labels, puntkomma's of regeleindes in labels/
notities, onverwachte randspaties en afwijkende geheelgetalvelden. Een
interne ronde door de bestaande importparser moet alle zeven waarden
exact zonder verlies herstellen. Bij een probleem wordt niet geraden,
gequote of stilzwijgend ingekort: de gebruiker kan invoer corrigeren of
de volledige JSON-export gebruiken.

**Bewuste grens:** Dit tekstformaat heeft geen kolom voor bekende loting-/
inschrijfduurmethode, methodevoorkeur, eigen grenswaarden of relatieve
gewichten. Bij opnieuw plakken worden methoden uitsluitend **Onbekend**;
de huidige criteria blijven staan. Wie de hele werkmap wil bewaren
kiest de bestaande versiegebonden JSON-back-up. Geen automatische
bestandsopslag, browseropslag, API, advertentielezer of woningreactie.
Iedere bewerking maakt een eerdere CSV-preview ongeldig.


## Eigen CSV-opties toevoegen zonder bestaande te overschrijven

Na de bestaande **Bekijk alle geplakte woningopties**-preview is er nu
ook een afzonderlijke keuze **Voeg deze bekeken opties toe**.
Woonpoints toont vooraf hoeveel woningen er blijven en hoeveel worden
toegevoegd. De toevoeging is alleen beschikbaar als er in totaal
maximaal vijf opties ontstaan, alle bestaande labels uniek en niet-leeg
zijn en geen toegevoegd label al bestaat (hoofdletterongevoelig).
Een conflict of overschrijding wordt zichtbaar geweigerd; bestaande
gegevens worden nooit stilzwijgend overschreven of aangepast.

De bestaande optie **Vervang met deze bekeken opties** blijft behouden
en vereist haar eigen checkbox. **Toevoegen** vraagt een andere,
afzonderlijke toestemming. De bestaande criteria, relatieve gewichten,
eigen methodevoorkeur en alle oude opties blijven bij toevoegen gelijk.
Nieuwe via CSV ingevoerde opties krijgen net als bij vervangen uitsluitend
de methode Onbekend. Beide handelingen bewaren eenmalig de vorige
tijdelijke lijst voor expliciet terugdraaien; handmatig bewerken, toevoegen
of verwijderen trekt dat herstel in. Een verouderde preview verliest
toestemming als bron, CSV-tekst of woninglijst verandert.
Geen netwerk, woningreactie, opslag of accountkoppeling.
