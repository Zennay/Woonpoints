# Begeleide privé-startinspectie na sleuteloverdracht

Woonpoints biedt boven het bestaande `#nazorg`-dossier nu een **zelf te doorlopen woningstartinspectie**. Dit is bewust geen bouwkundige keuring, bewijs van de staat van een huurwoning, officiële overdracht, klantaccount of melding aan een woningcorporatie.

## Productflow

1. Open vanaf het Woonpoints-dashboard **Nazorg & gebreken**. Start bij **Begeleide startinspectie**.
2. Open per ruimte de controles: **Entree** (4), **Woonkamer** (4), **Keuken** (4), **Badkamer** (4), **Slaapkamer** (2) en **Installaties** (4). In totaal 22 specifieke controlepunten met veiligheidstekst. Alle statussen beginnen onbeoordeeld. De gebruiker bepaalt handmatig **In orde volgens mij**, **Aandachtspunt** of **Nog niet beoordeeld**.
3. Voeg optioneel bij een aandachtspunt een eigen toelichting toe (maximaal 300 tekens). De voortgangsbalk en tellers zijn gebaseerd op daadwerkelijk door de gebruiker aangeklikte beoordelingen; geen automatische aanname dat iets gecontroleerd is.
4. Kies optioneel **Download mijn eigen inspectieoverzicht (TXT)**. Het overzicht onderscheidt expliciet eigen beoordeling en niet gecontroleerde items. Een gekozen bestandsprovider kan bestanden buiten Woonpoints bewaren of synchroniseren; de app verstuurt zelf niets.
5. Kies **Zet N aandachtspunten in nazorg…** voor de nog niet bestaande, door de gebruiker gemarkeerde gebreken. Een tweede bevestiging beschrijft precies wat in het tabblad wordt aangemaakt. Bestaande actieve punten met dezelfde ruimte en titel worden niet dubbel aangemaakt; afgeronde punten blijven historisch aanwezig en kunnen desgewenst door een nieuwe beoordeling opnieuw als open punt worden toegevoegd.
6. De bestaande nazorgmodule ontvangt uitsluitend nieuw bevestigde `Item` records met oorspronkelijke titel/ruimte, handmatige toelichting, standaardprioriteit van het sjabloon, status `open`, geen gefingeerde wettelijke deadline, en creatiedatum lokaal. Bestaande nazorgfuncties blijven werken: sortering, bewerken, herinnering via aparte ICS-export, contactlog, conceptexport, schema-2-JSON-back-up, handmatige restore.
7. Bij onvoldoende ruimte (max. 80 bestaande punten) of wanneer de **complete JSON-schema-2-back-up** daarna groter dan 16 KiB zou worden, wordt de **gehele overdracht geweigerd**. Geen gedeeltelijke invoer, geen automatisch wissen. De gebruiker krijgt een concrete melding.
8. Tijdelijke inspectiebeoordelingen worden niet automatisch bewaard en niet meegenomen in de nazorg JSON-v2-back-up. De gebruiker kan vóór het verlaten expliciet een aparte startinspectie-JSON of TXT-overzicht downloaden; zonder die actie verdwijnt de voortgang bij tabblad sluiten.

## Bewaar en hervat een onvoltooide startinspectie

- Selecteer na minimaal één eigen beoordeling **Bewaar mijn inspectievoortgang (JSON)**. Alleen daadwerkelijk beoordeelde vaste en eigen punten worden met hun bekende ID en `goed`/`aandacht` opgeslagen, plus maximaal twaalf eigen definities. Eigen notities worden uitsluitend bij aandachtspunten toegevoegd. Nieuwe downloads zijn schema 2; het eerdere schema 1 blijft importeerbaar. De download is een bewuste actie; er is nog steeds geen automatische lokale/serveropslag.
- Open later **Hervat met mijn eigen inspectie-JSON**. De app accepteert maximaal 16 KiB, exact het bekende schema, maximaal 22 vooraf gedefinieerde én twaalf valide unieke eigen controle-ID's, bekende statussen en maximaal 300 tekens per eigen toelichting. Onbekende of dubbele velden en IDs, onverwachte notities bij een in-orde-status en corrupte bestanden worden integraal geweigerd.
- Na valideren volgt een expliciete **Vervang mijn inspectieantwoorden**-bevestiging. Alleen de tijdelijke controleantwoorden en notities veranderen. Bestaande nazorgpunten, contactlog en bijbehorende exports worden **niet** overschreven. Ook een geldige lege checklist-JSON kan expliciet worden hersteld.
- **Begin opnieuw…** vraagt een eigen tweede bevestiging en wist alleen tijdelijke antwoorden/notities. Eerder gedownloade bestanden blijven bestaan.
- De TXT-export bevat eigen notities alleen bij een actueel als aandachtspunt gemarkeerde beoordeling. Een oude, in het geheugentoestand aanwezige notitie bij later als goed gemarkeerd punt lekt dus niet alsnog naar het TXT-rapport of inspectie-JSON.
- Beoordelingen kunnen grote of gevoelige beschrijvingen bevatten die een eigen bestandsprovider buiten Woonpoints synchroniseert: deel zelf alleen wat je wilt. De inspectie-JSON is apart van de bestaande nazorg JSON-v2-back-up; beide zijn niet onderling uitwisselbaar.

## Eigen controlepunten voor niet-standaardwoningen

Vanaf deze versie kan de bewoner **maximaal twaalf eigen controles** toevoegen aan de 22 vaste punten. Bijvoorbeeld balkonafvoer, berging of een andere situatie die niet in de standaardlijst past. Per eigen punt kiest de bewoner een unieke titel (max. 100 tekens), één van de zes ruimtes of **Overig**, en de eigen prioriteit. Geen titel mag binnen dezelfde ruimte dubbel voorkomen, ook niet tegenover een vast sjabloonpunt. De standaardpunten zijn niet verwijderbaar of bewerkbaar; eigen punten kunnen **uitsluitend na afzonderlijke verwijderbevestiging** uit de tijdelijke inspectie worden gewist.

- Alle eigen punten krijgen dezelfde zelf-beoordeelde status, maximaal 300 tekens tijdelijke opmerking, voortgang en handmatig bevestigde overdracht naar het nazorgdossier.
- Het inspectie-JSON-formaat is nu **schema 2** (`kind=woonpoints-private-startinspectie`, `schema=2`) met uitsluitend `custom` en `records`. `custom` bewaart per eigen punt een lokaal gegenereerd ID, titel, ruimte en handmatige prioriteit. `records` bevat de beoordeelde vaste en eigen punten met status en eventuele eigen notitie. De volledige output blijft maximaal 16 KiB.
- **Schema 1** uit de voorgaande geïmplementeerde stap blijft ondersteund: de bestaande inspectie wordt dan met nul eigen controles hersteld. Nieuwe schema-2-import wordt integraal geweigerd bij dubbele/ongekende IDs, onbekende ruimte, ongeldige prioriteit, te veel controles, ongeldige titel, ontbrekende beoordelingselementen of onverwachte velden. Geen stille partiële import.
- De importbevestiging vervangt tijdelijke vaste beoordelingen, eigen beoordelingen én eigen puntdefinities, maar **nooit** al overgedragen nazorgpunten en contactmomenten.
- **Begin opnieuw** wist eveneens eigen controles pas na aparte bevestiging. Een TXT-inspectieoverzicht bevat ook onbeoordeelde eigen punten; de bewoner bepaalt zelf of het eigen bestand buiten Woonpoints wordt gedeeld.

## Integriteit / privacy / scope

- Geen externe verbinding, accountlogin, camera, locatietoegang, cookies, API-, database-, localStorage- of uploads aan derden.
- Geen persoonsgegevens, foto's, huurdersidentiteit, originele bewijsdocumenten of gevoelige adressen in automatische sjablonen. De gebruiker schrijft desgewenst eigen beperkte notities.
- Geen regel vergelijkt met WoningNet, vervangt een geautoriseerde huurdersmelding, toetst juridische hersteltermijnen of beweert dat iets technisch veilig is.
- Geen nieuwe directories onder `src/app`; enkel bestaande, expliciet door Docker toegelaten `src/app/page.tsx`. De bestaande `.dockerignore` allowlist, checks, toestemming en `BOT_DRY_RUN=true` blijven intact.
- Productintegratie is broncode, geen bewijs van VPS-deploy of een werkende externe woningkoppeling.

## Onderhoud

De sjabloonconstante `INSPECTION_CHECKS` definieert zes groepen. `PrivateArrivalInspection` rendert de privé-interface en roept pas na afzonderlijke gebruikersbevestiging `createFromInspection` aan. Die centrale functie controleert actieve duplicaten, huidige bezetting en exacte nieuwe schema-2-back-upgrootte voordat ze nazorgstatus muteert. Aanvullende controles of wijzigingen horen in de bestaande code-review van de productowner; niet in een aparte QA-suite.
