# Eigen nazorg-acties en afspraaknotities

De **Mijn nazorg-acties**-inbox toont open aandachtspunten uit de bestaande privé-nazorgmodule.

De nieuwe **[Mijn privé-nazorgweekplan](PRIVATE_AFTERCARE_WEEK_PLAN.md)**-module zet de al bestaande eigen urgenties en afspraaknotities om in één bewust geselecteerd 7- of 30-dagenplan. Je kunt vanuit de planning 1–12 actuele punten direct in de handmatig te beoordelen eerste-meldings- of opvolgconcepteditor zetten. Een plan-TXT vereist volledige brongebonden preview en nieuwe toestemming, bevat nooit de vrije contacttekst, en verstuurt niets.
 Er wordt niets van een verhuurder of WoningNet gelezen. De rangorde wordt opnieuw berekend uit de huidige tijdelijke browsertabbladgegevens:

1. Verstreken eigen streefdatum.
2. Door jezelf als gemeld gemarkeerd, zonder genoteerd eigen verzendmoment.
3. Zelf gemeld, minstens 14 dagen sinds je laatst zelf een bericht registreerde, zonder toekomstige eigen afspraaknotitie.
4. Zelf als dringend geprioriteerd, nog open.
5. Eigen streefdatum binnen zeven dagen.

De weergegeven datum, contactstatus en prioriteit zijn **uitsluitend de eigen administratie**; ze vormen geen bewijs, verzuimtermijn of juridisch advies. Met **Neem op in eigen concept** ga je naar de bestaande, bewust te bevestigen berichteneditor. Er wordt niets automatisch verzonden. De editor houdt zijn bestaande maximum van 12 punten en trekt oude goedkeuringen in na een wijziging.

**Wat staat er in mijn eigen agenda?** toont apart de toekomstige notities van type `afspraak` bij nog open punten. **Download eigen afspraaknotities als ICS** bevat uitsluitend datum en zelf ingevoerde titel/ruimte, zonder vrije contacttekst. Het zijn hele-dag eigen herinneringen, géén geverifieerde afspraken. De bestaande deadline-ICS blijft apart; er worden geen accounts, agenda's of derde partijen aangeroepen. Een zelfgekozen agenda-app kan het bestand opslaan of synchroniseren.

Deze schermen gebruiken de bestaande `items` en `history` React-state; import/undo en eerdere versie-1/2 back-ups volgen ongewijzigd hun eigen bestaande contracten. Sluiten van het tabblad wist de tijdelijke gegevens tenzij zelf een privé-back-up is gedownload. Geen credentials, browserextensie, worker, server/API, database, automatische opslag, productie-release of `BOT_DRY_RUN`-mutatie.

## Doorzoeken, overzicht houden en exacte dossiernavigatie (18 oktober)

- De actie-inbox toont standaard de eerste 16, met **Toon alle eigen nazorg-acties** kun je alle maximaal 80 open punten in dezelfde eigen prioriteitsvolgorde zien.
- **Bekijk dit punt in mijn dossier** opent exact dat eigen punt in de volledige lijst; daarbij worden uitsluitend lokale status-, tekst-, prioriteits- en ruimtefilters gereset. De navigatie plaatst de toetsenbordfocus op het juiste punt. Er wordt niets automatisch gemeld of aangepast.
- In **Je punten** werkt een tabblad-lokale zoekterm over eigen titel, ruimte en privénotitie, aangevuld met status, prioriteit en ruimte. De telling maakt zichtbaar hoeveel van het eigen dossier momenteel wordt weergegeven. **Wis zoek- en prioriteitsfilters** herstelt de zoekweergave.
- **JSON en CSV exporteren altijd het volledige privé-nazorgdossier**, inclusief de expliciete velden die bij die export horen. Alleen de bewust gekozen **TXT van zichtbare punten** respecteert de actuele filters, toont het exacte aantal en is niet beschikbaar bij nul treffers. Bekijk privénotities vóór delen.
- Het afzonderlijk bevestigde herstel van een privé-nazorg-JSON opent daarna expliciet alle punten, zodat eerder actieve lokale filters geen herstelde records verhullen. De bestaande volledige import-preview/undo, 16-KiB grens en versie-1/2-compatibiliteit blijven ongewijzigd.

Alles blijft privé in React-browsertabbladgeheugen. Er is geen achtergrondsync, automatische bestandsexport, WoningNet-account, gecertificeerde reactie, juridische actie of bericht aan een verhuurder.

## Meerdere eigen statuswijzigingen, bewust per selectie

Het volledige privé-nazorgdossier ondersteunt nu lokale bulkacties op maximaal de 80 zichtbare records. Kies individuele regels of **Selecteer alle zichtbare punten**, en daarna bewust **Markeer geselecteerde als afgerond** of **Heropen geselecteerde punten**. De UI toont de geselecteerde aantallen en vereist een aparte tweede bevestiging. Alleen de actuele **zichtbare** geselecteerde records worden veranderd; niet-zichtbare eerder geselecteerde records worden nooit stilzwijgend verwerkt.

Voor de tweede bevestiging is de exacte huidige combinatie van statusfilter, zoekterm, ruimte, prioriteit, geselecteerde zichtbare IDs en de gehele originele itemset vastgelegd. Bij verandering vervalt de eerdere bevestiging. Wijzigingen blijven onder de bestaande 16-KiB privé-JSON-exportgrens, passen **geen** contacthistorie of notities aan, en wissen de tijdelijke selectie na succes. De status `gemeld` kan bewust niet als bulkactie worden gezet: een officiële kennisgeving of feitelijke verzending kan nooit collectief worden aangenomen.

Dit wijzigt geen WoningNet-account, reactiestatus, verhuurderbericht, gebruikersrechten, serverdatabase, worker of live feature gate. Alle bulkwijzigingen zijn uitsluitend zelf ingetikte tabbladstatus, geen bewijs van afronding.

## Volledige batch-preview en eenmalig herstel

Na het selecteren van een bulkactie toont **Bekijk eerst alle eigen statuswijzigingen** alle geselecteerde punten met ruimte/titel en eigen oude → nieuwe status, zonder vrije privénotities. De bestaande tweede bevestiging blijft vereist.

Na de bevestigde wijziging wordt precies één tijdelijk herstelpunt bewaard in het geheugen van hetzelfde browsertabblad. Via **Herstel de vorige eigen statussen** kun je de vorige volledige itemstatus terugzetten, maar uitsluitend als het huidige dossier en de contacthistorie sinds de bulkactie **exact ongewijzigd** zijn. Een nieuwe actie vervangt het vorige herstelpunt; je kunt het ook bewust vernietigen. Bij later bewerken, importeren, verwijderen of contactnotities wijzigen wordt het oude herstel ongeldig en blijft de nieuwe invoer behouden. Tabblad sluiten vernietigt ook dit herstelpunt; automatische netwerk-/bestandsback-up bestaat niet.

Bulk-preview, bevestiging en undo kunnen geen echte verhuurdermelding, WoningNet-reactie of feitelijke contactactie terugdraaien of bewijzen. Er verandert alleen handmatig ingevoerde lokale status.

## Eigen contacttijdlijn over alle nazorgpunten

Onder **Mijn eigen contacttijdlijn** verschijnen de maximaal 160 al bestaande, zelf ingevoerde contactmomenten uit alle eigen nazorgpunten in aflopende datumvolgorde. De gebruiker kan een type contactmoment selecteren, zoeken op eigen titel, ruimte, datum of de eigen notitietekst, en van de eerste twintig naar de volledige lijst schakelen. **Open het bijbehorende eigen nazorgpunt** herstelt een eventueel verborgen status-/ruimte-/prioriteitsfilter en navigeert rechtstreeks naar de correcte dossierregel. Verwijderde punten krijgen geen kunstmatige/tijdelijke tijdlijnrecords; historie volgt de bestaande geldige relatie met het punt.

De vrije privéinhoud wordt standaard **niet getoond**: open per regel expliciet **Bekijk mijn privénotitie**. Zo bevat het samenvattende overzicht alleen eigen datum, contactsoort, titel, ruimte en eigen status. Er is bewust geen nieuwe tijdlijnexport; de bestaande, zelf te downloaden versie-2 privé-JSON-back-up blijft de volledige bron voor herstel van contactnotities. De tijdlijn maakt geen nieuwe opslaglaag of officiële geschiedenis.

De woorden 'zelf contact opgenomen', 'reactie genoteerd' en 'afspraak volgens eigen notitie' zijn uitsluitend handmatige eigen beweringen, nooit onafhankelijk WoningNet-/verhuurderbewijs. Geen automatisch contact, agendakoppeling, rechtenverandering, serveropslag, credentials, background requests, QA-suite of live capability.

## Privacybewuste TXT-overdracht: echte preview vóór downloaden

De eigen nazorg-TXT (anders dan volledige herstel-JSON en volledige CSV) gebruikt precies de momenteel zichtbare/zelf gefilterde punten. Vóór de wijziging exporteerde één klik direct ook alle vrije privénotities uit die selectie. Nu werkt dit uitsluitend met een **volledige, leesbare preview** en een tweede menselijke downloadbevestiging. Vrije privénotities zijn standaard **niet opgenomen**; een afzonderlijke keuze **Voeg mijn privénotities bewust toe** is vereist om ze bij een TXT-export in te sluiten.

Het voorbeeld bevat het exacte aantal punten, hun eigen status, prioriteit, eigen datum en expliciet de instelling of privénotities verborgen of opgenomen zijn. Zolang het voorbeeld openstaat blijven gegevens binnen het huidige tabblad. De tweede bevestiging vergelijkt de ongewijzigde **hele eigen dossierdata**, de exact gefilterde zichtbare lijst en alle status-/zoek-/ruimte-/prioriteitsopties plus de privéoptie. Bij een bronwijziging, andere selectie, ander filter of andere privacykeuze wordt de oude toestemming ongeldig en moet de gebruiker opnieuw bewust een voorbeeld maken. Annuleren downloadt niets.

Na bevestiging wordt uitsluitend het exacte zojuist gecontroleerde tekstbestand gedownload via de bestaande bewuste browseractie. Geen automatische opslag, verhuurderbericht, juridische claim of externe actie. Bestaande JSON/CSV-back-ups en andere zelf bevestigde overdrachtspaden zijn onaangeraakt; externe bestands-/cloudproviders kunnen door de gebruiker gekozen exports zelf bewaren of synchroniseren.

## Volledige CSV onder expliciete privacykeuze en eigen controle

De complete eigen nazorg-CSV bevat **alle** dossierpunten, ook wanneer op het scherm filters actief zijn. De zeven bestaande kolommen en hun volgorde blijven hetzelfde. De laatste kolom `notitie` bevat nu standaard **lege velden**: vrije privénotities gaan pas bewust mee na een apart aangevinkte `Voeg mijn privénotities bewust toe aan de volledige CSV` optie. De volledige CSV (met kopregel en alle regels) wordt eerst binnen de browser getoond. Er vindt pas een download plaats nadat **Ja, download exact deze CSV** is bevestigd. Een gewijzigde dossierinhoud of privacykeuze maakt deze eerdere goedkeuring ongeldig, zodat de gebruiker opnieuw moet controleren.

Bij geëxporteerde vrije waarden wordt daarnaast een **genormaliseerde inspectiekopie** gebruikt voor conservatieve bescherming tegen spreadsheetformules na Unicode-spaties, verborgen format-/controlecodepunten, combining marks of Unicode-compatibiliteitsvarianten. De originele eigen tekst blijft behouden, maar een formule-achtige veldwaarde krijgt een expliciet letterlijke CSV-prefix; dubbele aanhalingstekens en CSV-regelgrenzen volgen de bestaande vaste-celcodering. Dit is voorzorg bij zelf openen in spreadsheetsoftware, niet de claim dat iedere mogelijke CSV-consument of formulevariant is bewezen.

De JSON-back-up blijft een afzonderlijk en volledig privé-herstelbestand, met reeds bestaande schema-/grootte- en importbevestigingen. Geen automatische verzending, opslag, achtergrondkoppeling, account, WoningNet-reactie of andere externe actie.

## Privacybewuste volledige JSON-herstelback-up (18 oktober)

De bestaande losstaande nazorg-JSON bewaart **expres alle** eigen punten, ook afgesloten/gefilterde, en de volledige contactgeschiedenis inclusief privéteksten; deze gegevens zijn nodig om later volledig te herstellen. Eerder startte één klik meteen een download, die via een door de gebruiker gekozen cloud-/bestandsprovider buiten de browser kon synchroniseren.

De knop **Controleer volledige herstel-JSON** geeft nu eerst het daadwerkelijke aantal punten en contactmomenten, het totale aantal bytes en een optioneel open te klappen volledig JSON-voorbeeld. De ruwe inhoud met privégegevens is standaard ingeklapt. De gebruiker moet daarnaast expliciet bevestigen te begrijpen dat **alle** privénotities in de herstelfile komen. **Ja, download exact deze privé-JSON** downloadt pas na die aparte toestemming precies de eerder gemaakte geldige bytes; annuleren doet niets.

De volledige originele dataset `items + history`, inclusief statussen, notities, contactmomenten en volgorde, wordt gebonden aan de lokale downloadtoestemming. Verandert er iets vóór het bevestigen, dan wordt die eerdere toestemming ongeldig. De bestaande versie-2 `kind/schema/items/history`-structuur, limiet van 16 KiB, versie-1/2-import, controle vóór overschrijven en complete gecombineerde inspectie+nazorgback-up blijven ongemoeid. Er is geen netwerk, automatische opslag, credential, WoningNet-actie of verhuurdersbericht.

## Losse JSON-import met werkelijk verschiloverzicht en eenmalig herstel

Eerder vroeg de losse nazorgimport alleen bevestiging op basis van twee totalen. Daarmee kon een gebruiker niet zien welke punten verdwijnen, welke eigen statussen veranderen en welke contactmomenten uit een back-up de huidige tabbladinhoud vervangen. **Open eigen nazorg-JSON** gebruikt nog steeds de bestaande strikte v1/v2 parser en 16-KiB omvangslimiet, maar toont vóór elke vervanging nu expliciete verschillen: per puntenlijst en contacthistorie hoeveel records worden toegevoegd, verwijderd of gewijzigd. De details tonen eigen titel, ruimte, datum en contacttype, niet de vrije notitie- of berichttekst. Wijzigingen aan alleen vrije privétekst tellen wel als gewijzigd.

De gebruiker bevestigt apart te begrijpen welke volledige datasets worden vervangen, inclusief verborgen notities. De toestemming is gekoppeld aan de exact actuele `items + history` in het browsertabblad; tussentijdse bewerkingen blokkeren het oude akkoord. Via **Bekijk de nieuwe importgevolgen** wordt de vergelijking met de nieuwe actuele status opnieuw opgesteld en moet de gebruiker opnieuw bevestigen.

Na een geslaagde losse import bewaart het tabblad één tijdelijk herstelpunt van de volledige vorige nazorgstatus. **Herstel vorige tabbladstatus** is alleen mogelijk zolang punten én contactmomenten exact gelijk zijn aan de net geïmporteerde toestand. Elke wijziging daarna vergrendelt de oude undo, zodat latere invoer niet wordt overschreven. Geen schijf-/serveropslag, externe herstelactie, WoningNet-actie of notificatie. Sluiten van het tabblad wist de tijdelijke mogelijkheid. De aparte gecombineerde inspectie+nazorgimport met zijn eigen al bestaande vergelijking en undo blijft onaangetast.

Bij succesvolle losse import én bij éénmalig terugzetten worden ook eerder geopende conceptmeldingen, selectie voor bulkacties, oude bulkherstelpunten, voorbereid TXT/CSV/JSON-downloadtoestemmingen en gecombineerde herstel-/overdrachtspreviews ingetrokken. Daardoor kan geen eerdere goedkeuring nog bij nieuwe dossiergegevens worden gebruikt.

## Eenmalig veilig terugzetten na individuele verwijdering

Naast bewust bevestigde bulk- en importacties kan nu ook de laatste losse verwijdering van **één nazorgpunt met gekoppelde contactmomenten** of **één zelf ingevoerd contactmoment** worden teruggedraaid. De verwijderactie laat uitdrukkelijk zien dat gekoppelde privé-contactnotities mee verdwijnen bij een volledig punt. Direct na verwijderen toont het dossier een knop **Herstel de laatst verwijderde gegevens** en kan de tijdelijke mogelijkheid ook bewust worden vernietigd.

De volledige vorige eigen items/contacthistorie wordt uitsluitend in het geopende browsertabblad bewaard. Terugdraaien is alleen toegestaan als het huidige volledige dossier na de verwijdering exact hetzelfde is gebleven; elke volgende toevoeging, bewerking, import of contactwijziging invalideert de oude herstelactie. Een nieuwe individuele verwijdering vervangt het vorige herstelpunt, geen onbeperkte undo-stack. Het bewust wissen van alle tabbladpunten vernietigt de tijdelijke individuele verwijdering-undo. Ook eerder voorbereide downloadpreviews/toestemmingen vervallen bij verwijdering.

Er komt geen automatische opslag, kopie, verzonden bericht, WoningNet-handeling of restore van bestanden buiten het tabblad bij kijken. De eigen herstel-JSON blijft de enige bewuste duurzame back-up.

## Complete privé-nazorg wissen met tijdelijke terugzetmogelijkheid

**Wis alle tabbladpunten** noemt nu vóór de bestaande afzonderlijke menselijke bevestiging het volledige aantal eigen nazorgpunten én alle gekoppelde zelf genoteerde contactmomenten dat tegelijk verdwijnt. Bevestigen wist die twee tijdelijke datasets, trekt oude export- en conceptgoedkeuringen in en bewaart precies één vorige volledige privéstatus in het nog geopende tabbladgeheugen.

Met **Herstel mijn vorige volledige tabbladstatus** kunnen de oude punten/contactmomenten samen één keer worden teruggezet, maar alleen zolang de actuele gegevens exact overeenkomen met de direct na het wissen lege status. Zodra iemand nieuwe punten of contactmomenten toevoegt of weer wijzigt, wordt het oude herstelpunt geblokkeerd om nieuwe invoer te beschermen. Een nieuw bevestigd volledig wissen vervangt het vorige herstelpunt; bewust vernietigen kan ook. Het gaat alleen om tabbladstatus, niet om een bestand, cloud-back-up, verhuurdermelding of WoningNet-actie. Tabblad sluiten wist ook het tijdelijke herstelpunt.

## Veilig privé-dossiers samenvoegen zonder vervanging (18 oktober)

Wanneer je een zelf bewaarde, gevalideerde versie-1/2-nazorg-JSON importeert, kun je nu bewust kiezen tussen **Bestaande gegevens vervangen** en **Alleen nieuwe gegevens veilig samenvoegen**. Vervangen behoudt alle bestaande herstel- en verschilcontroles. Samenvoegen voegt uitsluitend eigen nazorgpunten en contactmomenten toe waarvan het stabiele ID nog niet in het huidige tabblad bestaat.

- Het voorbeeld toont afzonderlijk hoeveel punten/contactmomenten toegevoegd worden, hoeveel volledig identieke records al aanwezig zijn en hoeveel bestaande ID's conflicteren. Vrije privénotities verschijnen nooit in de samenvatting.
- **Zelfde ID, andere velden** (ook een status, gekoppeld punt of een verborgen contactnotitie) blokkeert de gehele samenvoeging. Er worden geen bestaande regels overschreven, geen ID's stilzwijgend hernoemd en geen twee gelijknamige punten automatisch tot één gemaakt.
- Een geheel identiek bestand is een veilige no-op: er is niets nieuws toe te voegen en daarom geen reden voor een importmutatie.
- De samengevoegde dataset wordt opnieuw door de originele, strikt ongewijzigde v2-JSON-ontvanger gecontroleerd, inclusief valide verwijzingen, maximaal 80 punten, maximaal 160 contactmomenten, maximaal 8 momenten per punt en 16 KiB voor het complete, opnieuw te exporteren privébestand.
- Na het lezen van het actuele voorbeeld is een **apart menselijk akkoord** nodig. Bij wijziging van de brondata of de importkeuze vervalt die toestemming. Bevestigde samenvoeging trekt oude export- en berichttoestemmingen in; de volledige vorige tabbladstatus kan éénmaal veilig worden hersteld, uitsluitend zolang het zojuist geïmporteerde dossier ongewijzigd is.
- Er wordt niets gesynchroniseerd, door een verhuurder gevalideerd, verstuurd of uit WoningNet opgehaald. Het bronbestand op het eigen apparaat blijft intact.

Een conflict vraagt dus een **bewuste menselijke keuze**: corrigeer de afzonderlijke eigen bronbestanden, behoud het dossier zoals het is, of gebruik apart en expliciet de bestaande vervangactie (met eigen verliesoverzicht). Samenvoegen mag dit conflict niet automatisch oplossen.
