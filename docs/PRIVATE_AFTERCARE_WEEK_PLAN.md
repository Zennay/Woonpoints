# Mijn privé-nazorgweekplan — 7 of 30 dagen

De bestaande Mijn nazorg-acties-inbox en contacttijdlijn worden aangevuld met één werkbare planner. De planner gebruikt uitsluitend de al ingevoerde eigen punten en contacthistorie in de huidige React-tab; geen nieuwe accounts, tabellen, API's, automatische opslag of externe services.

## Gebruik

1. Kies een periode van 7 of 30 kalenderdagen.
2. Bekijk relevante open aandachtspunten: verlopen eigen streefdata, zelf gemelde punten met opvolgadvies, urgent gemarkeerde punten en komende eigen deadlines.
3. Selecteer bewust welke acties in je plan moeten komen. Elk punt heeft een knop naar de oorspronkelijke, bewerkbare dossierregel.
4. Bekijk toekomstige afspraaknotities. De planner gebruikt uitsluitend de eigen datum, titel en ruimte; nooit de vrije contacttekst.
5. Klik op Bekijk mijn exacte plan vóór downloaden. Lees de volledige tekst, bevestig bewust en download daarna precies die tekst. Annuleren laat de bron ongewijzigd.

Een gewijzigd dossier, kalenderdag, periode, selectie of afspraaklijst maakt eerdere downloadtoestemming ongeldig. De export wordt opnieuw beoordeeld en goedgekeurd. Na downloaden vervalt de goedkeuring. Niets wordt automatisch gedeeld, ingepland of verzonden.

## Datagrenzen

- Alleen niet-afgeronde punten en toekomstige zelf genoteerde afspraken; het bestaande dossier begrenst 80 punten en 160 contactmomenten.
- Een verlopen eigen streefdatum is geen wettelijke termijn. De status gemeld en een zelf-verstuurd-notitie zijn geen bewijs van verzending. Afspraak is geen geverifieerde boeking.
- De optionele TXT bevat alleen gekozen titels, ruimtes, eigen status, prioriteit, streefdatum en reeds weergegeven inbox-redenen, plus een lijst van eigen toekomstige afspraaknotities. Geen vrije privénotities, contactteksten of WoningNet-wachtwoorden worden automatisch meegenomen.
- Voor afgeleid rapportgebruik worden controletekens, meerregelige labels en bidirectionele formattekens uit tekstregels geneutraliseerd. Originele React-data, bestaande JSON-herstelback-up en contacten blijven onaangetast.
- Afgeleid rapport maximaal 70.000 UTF-8 bytes. Alleen de gebruiker kiest zelf een download; externe bestandssystemen/apps kunnen daarna onafhankelijk synchroniseren.
- Geen aanpassing van WoningNet live capability, BOT_DRY_RUN, server, VPS, worker of queue. Geen enkele status in dit overzicht vormt geverifieerd bewijs of juridisch advies.

De feature is broncodefunctionaliteit, niet automatisch een productie-deploy. Bestaande exacte GitHub-CI, review, deploy- en toestemmingsgates blijven van toepassing.

## Geplande acties naar bestaande berichteneditor

Een selectie van **1–12 actuele punten** kan rechtstreeks worden klaargezet voor een zelf te beoordelen eerste-meldingsconcept of opvolgconcept. Het plan overschrijft geen dossier- of contactgegevens. Het onderdeel zet alleen de geselecteerde ID's en de gekozen soort concept over; eerder geopende concept- en toestemmingstoestand vervalt. De bestaande editor stelt vervolgens de tekst op en vereist nog steeds een afzonderlijke expliciete menselijke bevestiging. Bij meer dan 12 punten blijft deze handoff uitgeschakeld en kies je eerst een kleinere selectie. Er gaat géén bericht uit, ook wordt de eigen status niet automatisch op gemeld gezet.

## Selectieve eigen kalender (.ics)

De weekplanner kan nu desgewenst een **aparte, selectieve agenda-export** samenstellen. Dit verschilt van de bestaande volledige eigen deadline-ICS: alleen door jou **geselecteerde punten met een niet-verstreken streefdatum binnen de gekozen 7/30-dagenperiode** worden een hele-dag-item. Verstreken punten, ongedateerde acties en niet-geselecteerde punten krijgen geen agenda-event.

Toekomstige afspraaknotities zijn **standaard uitgesloten**. Alleen na een expliciete checkbox gaan eigen afspraakdatums uit de bestaande contacthistorie als afzonderlijke niet-geverifieerde hele-dag-events mee. De afgeleide agenda krijgt geen automatische reminders, geen contacttekst, adressen, bijlagen of derdengegevens van de app. Eigen ruimte en titel zijn zichtbaar in de expliciete volledige ICS-preview, en moeten vóór downloaden afzonderlijk worden goedgekeurd.

De export gebruikt RFC 5545-veldafbakening, CRLF-regels, UTF-8-veilige 75-octet folding, vaste pseudo-lokale kalender-UIDs en inclusieve dag+1 voor een heel-dag-event. Door de tekstlabels eerst controle-/bidi-vrij te maken en daarna speciale ICS-tekens te escapen worden eigen invoervelden geen extra gebeurtenissen. De brondata blijven onveranderd.

Verandering van de dossierbron, selectie, planningsperiode, kalenderdag of afspraak-opt-in maakt elke voorgaande preview/goedkeuring ongeldig. Na downloaden vervalt het akkoord. Een agenda-app of cloudprovider kan het bestand vervolgens op initiatief van de gebruiker importeren/synchroniseren; Woonpoints maakt zelf **geen** agenda-afspraak of kennisgeving aan verhuurder/WoningNet.
