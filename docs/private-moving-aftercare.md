# Privé verhuisnazorg — uitvoerbare gebruikersflow

Sinds 18 oktober 2026 is via de dashboardlink **Nazorg & gebreken** het in het bestaande dashboard geïntegreerde onderdeel **#nazorg** beschikbaar. Doel: na verhuizing zelf open punten, gebreken en afspraken bijhouden zonder rechten op WoningNet, een verhuurder of een notificatieprovider te veronderstellen.

## Wat een gebruiker kan doen

1. Registreer een neutrale titel (maximaal 100 tekens), ruimte/categorie (maximaal 40), eigen prioriteit, optionele geldige streefdatum en privénotitie (maximaal 500).
2. Bekijk aantallen en verlopen eigen streefdatums. Filter op actieve, afgeronde of alle punten. Punten kunnen worden bewerkt, zelf als gemeld worden aangemerkt, afgerond en heropend. De handmatige status **gemeld** verzendt niets.
3. Verwijder een individueel punt met aparte bevestiging of wis alle tabbladgegevens pas na expliciete bevestiging.
4. Maak bewust een JSON-back-up van het complete werkoverzicht (`kind=woonpoints-private-nazorg`, `schema=1`), CSV voor eigen verwerking of een leesbaar TXT-overzicht. De CSV neutraliseert begintekens die bij openen in een spreadsheet als formule kunnen worden uitgevoerd.
5. Importeer uitsluitend lokaal gekozen JSON van maximaal 16 KiB. De import weigert onbekende velden/versies, ongeldige waarden en datums, te veel of dubbele items, en laat bestaande informatie ongewijzigd totdat **Vervang huidige punten** wordt bevestigd. Ook een lege back-up kan expliciet worden hersteld.

## Eigen deadlinekalender en opt-in agenda-export

De nazorgsectie toont sinds deze uitbreiding een afzonderlijk **Deadline-overzicht**: open of zelf-gemelde punten met een eigen datum, binnen de komende 31 kalenderdagen (vandaag t/m vandaag +30). Afgeronde punten worden niet meegenomen; verstreken datums blijven zichtbaar in de bestaande statuskaart.

Met **Download ICS voor mijn agenda** exporteert de gebruiker uitsluitend niet-afgeronde punten waarvoor een eigen datum is ingevuld:
- Ieder punt krijgt een all-day agenda-item op de zelf ingevulde datum, met een herinnering 1 dag eerder voor zover de gekozen kalenderapp die ondersteunt.
- Een vaste stabiele UID uit de privé-item-ID, correcte datum-exclusieve DTEND en RFC5545-veilige tekstvelden. Regels worden veilig gevouwen op maximaal 70 UTF-8 bytes.
- Er wordt **geen** agenda, server, verhuurder of account bezocht; een agenda-import of synchronisatie gebeurt uitsluitend na een aparte actie in de kalenderapp.
- Niet invullen van een datum genereert geen afspraak. "Gemeld" is alleen een eigen handmatige status en is geen verhuurderbevestiging.
- Bij ieder expliciet nieuw ICS-bestand kan de agenda-app bestaande importregels verwerken volgens eigen gedrag; Woonpoints beheert, annuleert of synchroniseert daar geen afspraak.

## Conceptmelding voor de verhuurder — uitsluitend handmatig delen

Onder **Concept voor de verhuurder** kies je expliciet 1–12 eigen, nog niet-afgeronde aandachtspunten. Een lokale samensteller maakt een aanpasbare tekst met zelf ingevuld onderwerp, ruimte en omschrijving per punt. Prioriteiten en eventuele eigen streefdatums worden als persoonlijke aannames gemarkeerd; er wordt **geen juridische hersteltermijn of ontvangstbewijs** toegekend.

- Persoonlijke toelichtingen staan **standaard uit**. Alleen na een aparte opt-in worden ze aan het concept toegevoegd.
- Je kunt het concept in een tekstvak corrigeren, inkorten of anonimiseren (maximaal 10.000 tekens).
- De huidige selectie en bronvelden zijn aan het concept gekoppeld; als ze na genereren worden aangepast, is kopiëren/export uitgeschakeld totdat je het concept opnieuw opbouwt.
- Een aparte checkbox bevestigt menselijke inhoudscontrole. Daarna kan de gebruiker bewust kopiëren naar het klembord of een TXT-bestand downloaden. Er is geen netwerk-, e-mail-, WoningNet- of verhuurderkoppeling en geen automatische verzending of statuswijziging naar ‘gemeld’.
- Klembord en zelfgekozen opslagplek vallen buiten Woonpoints; een bestand of reeds gekopieerde tekst kan niet op afstand worden ingetrokken. De gebruiker controleert zelf ontvanger en eventueel benodigde bijlagen voordat deze iets verstuurt.

## Contacthistorie per aandachtspunt (alleen eigen observaties)

Elk aandachtspunt heeft een inklapbare **Mijn contacthistorie**. Per punt kun je maximaal acht handmatige gebeurtenissen vastleggen, tot 160 gebeurtenissen in totaal, elk met een eigen geldige kalenderdatum, keuze uit eigen notitie / zelf contact opgenomen / reactie zelf genoteerd / afspraak en een korte omschrijving van maximaal 240 tekens. Je kunt een afzonderlijk moment na aparte bevestiging wissen. Verwijder je het bijbehorende aandachtspunt, dan worden ook diens tabbladmomenten verwijderd. Voor een zelf verstuurd bericht of genoteerde reactie is een datum in de toekomst niet toegestaan; geplande afspraken mogen een eigen toekomstige datum hebben. Geen gebeurtenis bewijst dat de andere partij werkelijk iets heeft ontvangen of bevestigd.

**Herstelcompatibiliteit:** een nieuwe complete privé-JSON-back-up schrijft schema **2** met `items` plus `history`. De eerdere schema-1 back-up met uitsluitend `items` blijft importeerbaar; contacthistorie wordt dan leeg hersteld. Schema-2 invoer wordt met dezelfde 16-KiB limiet, uitsluitend bekende velden, individuele limieten, referentiële item-ID's, unieke event-ID's en per-item limieten gevalideerd. De oorspronkelijke tabbladstaat blijft bij mislukte of geannuleerde import behouden. Een geslaagde restore vraagt nog steeds een afzonderlijke vervangingsbevestiging, inclusief zichtbare aantallen punten en contactmomenten.

De gewone CSV en TXT bevatten **alleen** aandachtspunten, geen contacttijdlijn; voor een volledige privéback-up moet bewust JSON worden gekozen. Bij toevoegen van een contactmoment wordt vooraf gecontroleerd of de volledige ingesprongen JSON nog binnen de 16 KiB blijft; anders wordt het moment niet opgeslagen. Er is geen koppeling met e-mail, verhuurder, WoningNet, berichten, automatisch statusbeheer of externe tijdstempels.

## Privacy, veiligheid en grenzen

- Maximaal 80 aandachtspunten; tabbladgeheugen, geen automatische opslag, cookies, localStorage, API-aanroep of sync.
- Een vrijwillige download kan buiten de app door de gekozen opslagprovider worden gesynchroniseerd. De gebruiker kiest zelf of en met wie een bestand wordt gedeeld.
- Gebruik neutrale omschrijvingen. Voer geen namen, adressen, persoonsgegevens of originele gevoelige bewijsdocumenten in.
- De tool is geen juridische gebrekenmelding, toestemmingsbewijs, hersteltermijnadvies, WoningNet-status of officiële ontvangstbevestiging.
- Geen nieuwe rechten, worker-aansturing, droogloopinstellingen, authenticatie, backend, database of productie-deploy. `BOT_DRY_RUN=true` blijft verplicht.
- De nieuwe client-side module staat los van de andere migratie-/verhuiswerkmap zodat bestaande eigenaars hun interfaces en bronbestanden onafhankelijk kunnen blijven onderhouden.

## Integratie en oplevering

Bronpaden: `src/app/page.tsx` (directe ingang, kaart én afgeschermde tabbladinterface), dit document. De originele route-map is bewust ingetrokken om exact binnen de bestaande productie-Docker bron-allowlist te blijven; de bestaande security- en CI-gates blijven ongewijzigd. Productbron commit staat in een aparte featurebranch en vereist de bestaande verplichte exact-head GitHub CI/owner-reviews en veilige merge. Bronmerge bewijst geen VPS- of productiedeploy.
