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
