# Eigen nazorg-acties en afspraaknotities

De **Mijn nazorg-acties**-inbox toont open aandachtspunten uit de bestaande privé-nazorgmodule. Er wordt niets van een verhuurder of WoningNet gelezen. De rangorde wordt opnieuw berekend uit de huidige tijdelijke browsertabbladgegevens:

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
