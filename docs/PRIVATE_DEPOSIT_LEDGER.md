# Mijn privé-borgboek — eigen borg en gedeeltelijke terugbetalingen

Een nieuwe zelfstandige kaart **Mijn privé-borgboek** staat in de verhuisflow na de kostenverdeling en is bereikbaar via de **Verhuizen**-categorie van QuickFind. Ze gebruikt uitsluitend React-tabbladgeheugen; geen WoningNet-account, verhuurder, bank, browseropslag, server of API.

## Gebruiken

1. Voer de **oorspronkelijke borg** handmatig in (€ 0–€ 50.000, maximaal twee decimalen).
2. Voeg maximaal **24** gedateerde gebeurtenissen toe: een bedrag dat je *zelf als ontvangen hebt genoteerd*, een *zelf genoteerde inhouding*, of een **geplande** terugbetaling die nog niet is binnengekomen. Schrijf een korte neutrale omschrijving, geen naam of adres. Al ontvangen of ingehouden bedragen mogen geen toekomstige boekingsdatum krijgen.
3. Bekijk de totalen **zelf terugontvangen**, **zelf genoteerd ingehouden**, **gepland maar niet bevestigd** en **nog niet verklaard**. Verwachte bedragen worden nooit bij daadwerkelijk terugontvangen opgeteld. Verstreken eigen verwachte datums geven een lokale herinnering; bevestig een echt ontvangen bedrag pas met **Markeer na eigen controle als ontvangen** en een aparte browserbevestiging. Dit verandert de eigen datum in de werkelijk zelf genoteerde ontvangstdatum van vandaag. Bij meer werkelijke boekingen dan oorspronkelijk ingevulde borg komt een waarschuwing; het saldo wordt niet stilzwijgend op nul gezet.
4. Verwijder een fout ingevoerde regel bewust, of download **privé-JSON** of **TXT**. Voor de TXT toont Woonpoints eerst de exacte inhoud inclusief eigen omschrijvingen in een alleen-lezen voorvertoning. Pas na aparte inhoudscontrole-checkbox kan deze versie gedownload worden; elke wijziging van de eigen brongegevens maakt de oude goedkeuring ongeldig. De TXT is een *eigen* samenvatting, geen bewijs of juridische berekening.
5. Via **Herstel een eerder gedownload privé-borgboek** kies je vrijwillig een lokaal JSON-bestand (maximaal 12 KiB). Vóór vervanging staat de vorige én inkomende borg en het aantal regels op het scherm. Dit werkt ook in een **net geopend, nog leeg tabblad** zonder vooraf een fictief borgbedrag in te vullen. Met **Ja, vervang mijn borgboek** bevestig je afzonderlijk. Annuleren en fouten behouden de huidige staat.

## Gegevenscontract

JSON is `{kind:"woonpoints-private-borgboek",schema:2,depositCents,entries:[{id,kind,date,label,amountCents}]}`. De parser controleert exacte velden, maximumaantallen, integer-eurocenten, bedragen, kalenderdatums, unieke gegenereerde event-ID's, neutrale omschrijvingen en geldige UTF-8. Onbekende velden en versies worden geweigerd. Vorige **schema-1**-back-ups blijven importeerbaar; bekende velden en bestaande records blijven behouden, worden naar schema 2 omgezet en nooit automatisch als nieuw geplande gebeurtenissen aangemerkt. Eventuele legacy-toekomstige ontvangsten of inhoudingen tellen niet als feitelijk saldo totdat de eigen administratie is gecorrigeerd. De import werkt ook met een nog lege/ongeldige huidige borg; bij iedere vervanging is de volledige oorspronkelijke tekst en de actuele regels gebonden aan de voorvertoning, en een tussentijdse wijziging trekt de toestemming in. Een vooraf beoordeelde import wordt ingetrokken wanneer de lokale bronstaat verandert.

Dit is **geen juridische borgsomvordering**, geen bewijs van een werkelijk betaalde/ingehouden som, geen analyse van toegestaan onderhoud en geen officiële eindafrekening. Er wordt niets gemeld, geïnd, geïmporteerd uit externe providers of gesynchroniseerd. Een zelf opgeslagen bestand kan buiten Woonpoints worden gesynchroniseerd; behandel het als privé.

## Integratie

De clientcomponent is in de bestaande Docker-allowlisted `src/app/page.tsx` geïntegreerd en onder `private-deposit-heading` toegevoegd aan QuickFind. Geen nieuwe Docker-COPY-bron of wildcard-toestemming nodig. De bestaande verhuismap, nazorg, inspectie, kostenboek, importcontracten en de `BOT_DRY_RUN`-grens zijn onveranderd. Bestaande verplichte CI en merge/release-autorisatie blijven vereist; de broncommit is geen bewijs van productie-deployment.

## Mijn eigen geplande terugbetalingen in een agenda

Bij één of meer regels van type **gepland** kan de bewoner met **Bekijk mijn geplande borgmomenten als ICS** een afzonderlijke, volledige kalenderinhoud voorvertonen. Het bestand bevat **uitsluitend** de zelf gekozen verwachte dag, het zelf ingevulde bedrag, een neutrale titel en een persoonlijke herinnering één dag eerder. De vrije omschrijving, namen/adressen en bankgegevens staan er bewust niet in. 

De ICS gebruikt geldige all-day DTSTART/DTEND datums, een per regel stabiele privé-UID, geldige iCalendar-escaping en maximaal 70 UTF-8-byte-vouwregels. Het voorvertoningsvenster toont de exacte ruwe inhoud vóór export; de bevestigingscheckbox is apart. De voorvertoning is brongebonden en wordt ongeldig zodra oorspronkelijke borg, regels, datums of bedragen worden gewijzigd. Eén bewuste download trekt de exporttoestemming weer in.

Het betreft uitsluitend **niet-geverifieerde eigen verwachtingen**, geen huurdersrecht, geverifieerde betalings- of ontvangstdatum of afspraak met een verhuurder. Woonpoints opent geen agenda-app of account, maakt geen externe sync aan en kan een eerder door de gebruiker geïmporteerde afspraak niet herroepen. Bevestig werkelijk ontvangen bedragen apart in het borgboek. De gebruiker kan het ICS-bestand bewust in een eigen kalender importeren en daar zelf bewaren/verwijderen.

## Eénmalig tabbladherstel na ingrijpende eigen wijziging

De oorspronkelijke borg en de notities zijn tijdelijke sessiegegevens. Bij **volledige privé-JSON-import**, **handmatig bevestigen van een geplande ontvangst** of **verwijderen van een boekingsregel** ontstaat nu maximaal één tijdelijk herstelpunt met de volledige oude eigen tabbladstatus. Bij verwijderen wordt eerst apart gevraagd of de regel echt weg mag; bij ontvangstbevestiging blijft de eerdere bevestiging vereist.

Met **Herstel mijn vorige tabbladstatus…** bekijk je eerst het type handeling en het aantal oude regels, en geef je daarna apart toestemming om exact die voorgaande tabbladstaat terug te zetten. Het herstel wordt **fail-closed** gebonden aan de exacte nieuwe combinatie van oorspronkelijke borgtekst en alle regels. Als je daarna bedragen, datums, status, records of de oorspronkelijke borg verandert, komt de terugzetactie niet meer in aanmerking. Je kunt het herstelpunt bewust wissen; na succesvolle herstelactie verdwijnt het vanzelf. Een nieuwe ingrijpende actie vervangt de vorige herstelmogelijkheid. Vrije formulierinvoer zonder opslag blijft buiten die dataset; een volgende definitieve invoer trekt het tijdelijke herstelpunt in.

Dit is **geen permanente versiegeschiedenis** en herstelt geen al gedownloade, geïmporteerde of gedeelde externe bestanden. Het herstelpunt leeft alleen zolang hetzelfde tabblad open is, zonder localStorage/API/credentials. Na herstel moeten oude exporttoestemmingen opnieuw worden beoordeeld. Woonpoints controleert zelf geen betalingen en verandert geen verhuurder- of bankregistraties.
