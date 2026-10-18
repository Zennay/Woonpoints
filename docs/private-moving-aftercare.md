# Privé verhuisnazorg — uitvoerbare gebruikersflow

Sinds 18 oktober 2026 is via de dashboardlink **Nazorg & gebreken** een volledig aparte `/nazorg`-pagina beschikbaar. Doel: na verhuizing zelf open punten, gebreken en afspraken bijhouden zonder rechten op WoningNet, een verhuurder of een notificatieprovider te veronderstellen.

## Wat een gebruiker kan doen

1. Registreer een neutrale titel (maximaal 100 tekens), ruimte/categorie (maximaal 40), eigen prioriteit, optionele geldige streefdatum en privénotitie (maximaal 500).
2. Bekijk aantallen en verlopen eigen streefdatums. Filter op actieve, afgeronde of alle punten. Punten kunnen worden bewerkt, zelf als gemeld worden aangemerkt, afgerond en heropend. De handmatige status **gemeld** verzendt niets.
3. Verwijder een individueel punt met aparte bevestiging of wis alle tabbladgegevens pas na expliciete bevestiging.
4. Maak bewust een JSON-back-up van het complete werkoverzicht (`kind=woonpoints-private-nazorg`, `schema=1`), CSV voor eigen verwerking of een leesbaar TXT-overzicht. De CSV neutraliseert begintekens die bij openen in een spreadsheet als formule kunnen worden uitgevoerd.
5. Importeer uitsluitend lokaal gekozen JSON van maximaal 16 KiB. De import weigert onbekende velden/versies, ongeldige waarden en datums, te veel of dubbele items, en laat bestaande informatie ongewijzigd totdat **Vervang huidige punten** wordt bevestigd. Ook een lege back-up kan expliciet worden hersteld.

## Privacy, veiligheid en grenzen

- Maximaal 80 aandachtspunten; tabbladgeheugen, geen automatische opslag, cookies, localStorage, API-aanroep of sync.
- Een vrijwillige download kan buiten de app door de gekozen opslagprovider worden gesynchroniseerd. De gebruiker kiest zelf of en met wie een bestand wordt gedeeld.
- Gebruik neutrale omschrijvingen. Voer geen namen, adressen, persoonsgegevens of originele gevoelige bewijsdocumenten in.
- De tool is geen juridische gebrekenmelding, toestemmingsbewijs, hersteltermijnadvies, WoningNet-status of officiële ontvangstbevestiging.
- Geen nieuwe rechten, worker-aansturing, droogloopinstellingen, authenticatie, backend, database of productie-deploy. `BOT_DRY_RUN=true` blijft verplicht.
- De nieuwe client-side module staat los van de andere migratie-/verhuiswerkmap zodat bestaande eigenaars hun interfaces en bronbestanden onafhankelijk kunnen blijven onderhouden.

## Integratie en oplevering

Bronpaden: `src/app/nazorg/page.tsx`, `src/app/page.tsx` (alleen directe ingang en kaart), dit document. Productbron commit staat in een aparte featurebranch en vereist de bestaande verplichte exact-head GitHub CI/owner-reviews en veilige merge. Bronmerge bewijst geen VPS- of productiedeploy.
