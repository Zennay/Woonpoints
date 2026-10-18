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
8. De tijdelijke inspectiebeoordelingen zijn niet opgenomen in JSON-back-ups; alleen bewust overgedragen gebreken verschijnen daar. De inspectie-voortgang zelf verdwijnt bij tabblad sluiten. De gebruiker kan een eigen tekstoverzicht downloaden vóór het verlaten van de pagina.

## Integriteit / privacy / scope

- Geen externe verbinding, accountlogin, camera, locatietoegang, cookies, API-, database-, localStorage- of uploads aan derden.
- Geen persoonsgegevens, foto's, huurdersidentiteit, originele bewijsdocumenten of gevoelige adressen in automatische sjablonen. De gebruiker schrijft desgewenst eigen beperkte notities.
- Geen regel vergelijkt met WoningNet, vervangt een geautoriseerde huurdersmelding, toetst juridische hersteltermijnen of beweert dat iets technisch veilig is.
- Geen nieuwe directories onder `src/app`; enkel bestaande, expliciet door Docker toegelaten `src/app/page.tsx`. De bestaande `.dockerignore` allowlist, checks, toestemming en `BOT_DRY_RUN=true` blijven intact.
- Productintegratie is broncode, geen bewijs van VPS-deploy of een werkende externe woningkoppeling.

## Onderhoud

De sjabloonconstante `INSPECTION_CHECKS` definieert zes groepen. `PrivateArrivalInspection` rendert de privé-interface en roept pas na afzonderlijke gebruikersbevestiging `createFromInspection` aan. Die centrale functie controleert actieve duplicaten, huidige bezetting en exacte nieuwe schema-2-back-upgrootte voordat ze nazorgstatus muteert. Aanvullende controles of wijzigingen horen in de bestaande code-review van de productowner; niet in een aparte QA-suite.
