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
