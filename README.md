# Woonpoints

Woonpoints is a private-first dashboard and local assistant for tracking WoningNet reactions, search points, preferences and position history.

## Current status

This repository is the reproducible code baseline for the project. The earlier **WoningKompas** ChatGPT Site remains a product/UI prototype; GitHub is the source of truth for executable code going forward.

The first baseline intentionally does **not** place live WoningNet reactions. Browser execution must remain fail-closed until the current WoningNet flow has been validated with an authorized test account.

## Safety contract

- `BOT_DRY_RUN=true` by default and required by the current worker.
- No WoningNet passwords, cookies, MFA codes or CAPTCHA material are stored in the dashboard database.
- No proxy/cookie obfuscation or control-bypass mechanisms.
- Only own accounts or accounts with explicit owner authorization.
- Expired login, MFA, CAPTCHA, invitations/viewings or housing offers stop automation for that account and require human action.
- A future live adapter must verify that a reaction is registered and belongs to the intended calendar month.

## Product scope

- Dashboard for wait/search points and monthly progress toward four valid reactions.
- Reaction history and final position tracking.
- Monthly position trend and percentile-style analysis.
- Housing preferences and explainable candidate filtering.
- Per-account consent and execution audit trail.
- Email/WhatsApp notifications as a later integration phase.


## Handmatige maandgrafiek (zonder WoningNet-koppeling)

Het dashboard biedt naast de bestaande losse positieberekening nu een
**maandelijkse eindpositiegeschiedenis**. Vul per woning uitsluitend
`JJJJ-MM-DD,positie/totaal` in, bijvoorbeeld `2026-09-21,8/110`.
De pagina groepeert de getypte resultaten per kalendermaand en toont een
responsieve grafiek, een toegankelijk tabeloverzicht, gemiddeld en mediaan
van de eindpositie, een gelijk gewogen positiepercentiel en het verschil
met de voorgaande **ingevulde** maand.

- Maximaal 120 handmatig getypte woningen, 24 maanden, 8192 tekens.
- Alleen echte geldige kalenderdagen en posities 1..aantal zijn toegestaan.
- **Expliciet exporteren en importeren:** gebruik **Exporteer CSV** om alleen
  gecontroleerde datum/positie/totaal-regels zelf te bewaren. Import leest
  een lokaal gekozen CSV van maximaal 16 KiB, weigert vreemde velden,
  ongeldige kalenderdagen en mogelijk uitvoerbare spreadsheetcellen en vraagt
  eerst bevestiging vóór de huidige invoer wordt vervangen. Een mislukte of
  geannuleerde import behoudt de bestaande invoer. De gekozen bestandslocatie
  kan synchroniseren buiten Woonpoints. Geen automatische bestandsopslag.
- **Alle gegevens blijven in het geheugen van dit browsertabblad**.
  Er is geen API-request, cookie, accountkoppeling, lokale opslag of export;
  met **Wis maandhistorie** kun je de notities direct leegmaken.
- Percentage betekent relatieve positie **binnen je ingevulde woningen**,
  niet de kans op woningtoewijzing. Een lege maand wordt nooit geschat.
- Dit is een onafhankelijk M1-instrument tot een toestemming- en
  brongeverifieerde read-only WoningNet-invoer echt beschikbaar is.
  Het beïnvloedt zoekpunten, reacties en `BOT_DRY_RUN` niet.


## Persoonlijk reactiedagboek — handmatig en privé

De homepage bevat nu een los, niet-geverifieerd **reactiedagboek**.
Je kunt zelf een datum en persoonlijke status (`van plan`, `zelf gereageerd`,
`afgesloten`, `uitgenodigd`, `ingetrokken`) vastleggen en optioneel
een afgeronde positie/totaal noteren. Tot 100 notities worden op het scherm
chronologisch weergegeven, zijn achteraf qua **eigen status** wijzigbaar,
per maand filterbaar, afzonderlijk verwijderbaar en per ingevulde maand
samengevat. Er is geen adres- of accountveld en er wordt geen officiële
WoningNet-reactie geregistreerd, geverifieerd of verstuurd.

Vanuit het dagboek verschijnt na het noteren van een geldige
eindpositie de knop **Toon genoteerde eindposities in maandgrafiek**.
Deze biedt uitsluitend de datum/positie/totaal uit de lokale
dagboekstatus aan de bestaande maandgrafiek aan. Pas na een tweede
expliciete klik **Gebruik in maandgrafiek** wordt eventueel eerder
handmatig getypte grafiekinvoer vervangen; **Behoud huidige grafiek**
laat die data onveranderd. Het dagboek wordt daarbij niet gewijzigd.
Er ontstaat geen automatische koppeling, serverrequest, opslag of
gecertificeerd WoningNet-bewijs.

**Bewaar als CSV** maakt op eigen verzoek een klein vast vierkolomsbestand
zonder dynamische spreadsheetinhoud. Import van een eerder bewaarde CSV
weigert onbekende kolommen, datums, toestanden, positie/totaal-combinaties
en meer dan 100 notities; de oorspronkelijke notities blijven behouden
totdat **Vervang huidige notities** expliciet is gekozen. Alles staat
standaard alleen in de React-geheugenstatus van het browsertabblad. Sluiten
zonder export wist deze notities. Opslaan op een cloudgesynchroniseerde
locatie kan buiten de app een kopie veroorzaken.

Maandtotalen hier zijn **eigen observaties**, nooit bewijs van een
WoningNet-registratie, geldige maandreactie, toegekend zoekpunt of
automatisch gegarandeerde selectie. Deze M1-interface verandert geen
authenticatie, accounttoestemming, backend, browserworker of
`BOT_DRY_RUN=true`. Geverifieerde read-only brondata en afzonderlijke
live-capability ontbreken nog.

## Handmatige woningkeuze — lokaal, transparant en zonder WoningNet-toegang

Een nieuw dashboardpaneel **Welke woningen passen bij jouw wensen?** laat je
zelf maximaal twaalf woningen vergelijken. Geef elke woning een neutraal
label (geen adres), huur, aantal kamers, eigen geschatte reistijd en balkon
op. Kies eerst je maximale huur, minimumkamers en maximale reistijd.

- Kandidaten buiten een harde grens krijgen **Past niet** met een concrete reden.
  Alleen passende woningen worden op basis van een **persoonlijke rekenregel**
  gerangschikt: maximaal 40 punten huurruimte, 35 reistijdruimte, 15 extra
  kamers en optioneel 10 balkonpunten. Dit is **geen woningkans,
  WoningNet-ranking, inkomenscheck of gegarandeerde toelating**.
- **Bewerk deze woning** opent een expliciet bewerkformulier voor dezelfde
  privéwoningnotitie. De huidige rangorde en de twee-woningenvergelijking
  veranderen pas als **Bewaar aanpassingen** geldig is; **Annuleren**
  behoudt de oorspronkelijke waarden.
- **Verwijder deze woning** biedt nu **Herstel laatst verwijderde woning**
  zolang dit tabblad nog open is en je geen nieuwe woning toevoegt, andere
  woning bewerkt, bestand terugzet of de gehele lijst wist. De herstelactie
  voert niets uit op WoningNet en verzendt geen gegevens; een gewiste
  vergelijking of verloren tabbladsessie blijft gewist.
- Met **Selecteer voor vergelijking** kun je twee van de eigen woningen rechtstreeks
  naast elkaar zetten. De schermvergelijking toont bij welke kandidaat
  de genoteerde huur lager is, de reistijd korter en er meer kamers zijn.
  Het rekenvoorbeeld **12 maal het huidige maandhuurverschil** rekent geen
  verhuizing, servicekosten, energie, huurverhogingen of kans op
  woningtoewijzing mee. **Bewaar beslisnotitie als TXT…** is een afzonderlijke,
  bewuste bestandsdownload van alleen die twee geselecteerde kandidaten;
  geen automatische opslag of verzending. Een verwijderde of vervangen
  kandidaat wist zijn tijdelijke selectiemarkering.
- Bewaar een vergelijking uitsluitend via **Bewaar JSON…** naar een zelfgekozen
  bestand. De bronversie, voorkeuren en maximaal twaalf kandidaten zitten in
  een begrensde JSON (maximaal 16 KiB). **Open eerder bewaarde privévergelijking**
  leest een gekozen bestand met strikte structuur-/waardelimieten. De huidige
  invoer wordt uitsluitend na **Vervang vergelijking** gewijzigd.
- Met **Wis vergelijking** en een aparte bevestiging verwijder je de lokale
  kandidaten. Alle niet-geëxporteerde gegevens blijven alleen in het
  tabbladgeheugen; geen cookies, localStorage, database, analytics, server-
  of WoningNet-aanroepen. Bestandsproviders kunnen gekozen exports zelf
  buiten Woonpoints synchroniseren.

**Fase:** dit is een autonome, handmatige M2-verkenning naast het nog open
M1 read-only accounttraject. Er is **geen kandidaatimport, live bron,
woningreactie, nieuw recht, vergunning of automatiseringsactivatie**.
`BOT_DRY_RUN=true` en menselijke account-/toestemmingsgates blijven intact.

## Repository layout

- `src/app/` — Next.js dashboard shell.
- `src/lib/` — project safety rules and domain helpers.
- `src/worker/` — local/background worker entry point; currently dry-run only.
- `prisma/` — PostgreSQL data model.
- `docs/` — architecture, handoff and roadmap.
- `tests/` — dependency-light safety regression tests.

## Local development

1. Copy `.env.example` to `.env`; **do not commit or paste the local secret**.
2. Generate one private, URL-safe random database password, for example:
   `python3 -c 'import secrets; print(secrets.token_urlsafe(32))'`
   Store that value in `.env` as `WOONPOINTS_DB_PASSWORD`. The
   Compose PostgreSQL, app and worker services all derive their private
   database password from **this single value**. An independent
   `DATABASE_URL` entry in `.env` is NOT trusted by the Compose app/worker;
   their service environment forces an **empty bootstrap URL**, and the
   `src/lib/db-url-launcher.mjs` entrypoint derives the encoded connection
   URI for its child. An empty `DATABASE_URL` in `docker compose config`
   is intentional; it is NOT a missing Compose database setup.
   Treat `docker compose config` output as sensitive: it still includes the
   required PostgreSQL password under `db.environment` and launcher input.
   For host-side Prisma or `npm run dev` outside Docker, configure
   `DATABASE_URL=postgresql://woonpoints:<same-password>@localhost:5432/woonpoints?schema=public`.
   Replace `<same-password>` locally, with no angle brackets. Only use
   the generated URL-safe secret to avoid reserved URL delimiter issues.
3. Keep `BOT_DRY_RUN=true`. Missing/empty `WOONPOINTS_DB_PASSWORD`
   intentionally blocks Compose startup; there is **no default password**.
4. Validate the local Compose configuration without starting a container:
   `docker compose config --quiet`
5. Start PostgreSQL with `docker compose up -d db`, then run `npm install`
   and `npm run dev`.

The Compose app image runs a prebuilt production Next.js server (`npm run build` during\nthe app image build, `npm run start` inside the DB URL launcher). It does not\nserve from the Next.js development server; local non-Docker development still\nuses `npm run dev`. The Docker worker remains independently dry-run-only.\n\nFor the complete app + worker stack, use `docker compose up --build` only\nafter the operator has configured matching credentials and authorized a
private local preview. Both dashboard and database ports default to host
loopback; enabling an authenticated public gateway is a separate release.
**These instructions are for a fresh local installation, not a production
password rotation or a live database migration.**

## Prototype

Legacy product prototype: https://woningkompas-amsterdam.lizellay.chatgpt.site

## Source-of-truth order

1. GitHub repository for executable behavior.
2. Notion Woonpoints Project HQ for product decisions, roadmap and handoff.
3. WoningKompas Site for historical UI/product reference only.


### Eigen reactiedeadlines en bezichtigingen (alleen tabbladgeheugen)
Onder **Reactiedeadlines en bezichtigingen zelf plannen** kun je maximaal twaalf
eigen acties invoeren: een anoniem herkenningslabel, het soort actie en de lokale
datum/tijd. De eerstvolgende open actie en verstreken deadlines staan zichtbaar
in de tijdlijn. Je kunt een actie bewerken, zelf afvinken of heropenen, een
verwijdering bevestigen en optioneel alleen open acties bekijken.
**Zelf afgevinkt betekent nooit bij WoningNet bevestigd.**

Je kunt op verzoek een JSON-bestand downloaden, later een gecontroleerde JSON
(maximaal 16 KB) importeren en de vervanging apart bevestigen. Een ICS-bestand
biedt uitsluitend nog open acties aan je eigen agenda-app aan; de ICS bevat
je eigen anonieme labels en vraagt je agenda-app om een herinnering één dag
vooraf. Woonpoints plant zelf geen achtergrondmeldingen, heeft geen toegang
tot je agenda of WoningNet en verstuurt geen reactie. Externe bestands- en
agendaproviders kunnen bestanden synchroniseren. De planner bewaart geen invoer
in localStorage, cookies of een server: sluit je het tabblad zonder JSON-export,
dan vervalt de tabbladplanning.


### Twee woningen handmatig vergelijken op totale kosten

De nieuwe sectie **Wat kost wonen je écht per maand?** toont twee volledig
zelf ingevoerde scenario's met een anoniem label, maandhuur, servicekosten,
geschatte energie- en reiskosten en éénmalige verhuiskosten. Met
**Vergelijk mijn bedragen** zie je het totaal per maand, twaalf maanden
inclusief de eigen startkosten en een volgend jaar zonder die éénmalige
last. Het verschil per maand en eerste jaar wordt apart uitgelegd.
Met één knop wis je beide scenario's uit het tabblad. Als je dat zelf
kiest, kun je een TXT-afweging downloaden; een eigen cloudopslagprovider
kan dit bestand vervolgens synchroniseren.

Geen woning wordt opgezocht, geen gegevens verzonden of automatisch
opgeslagen, geen officiële huurprijs, subsidie/huurtoeslag,
inkomenscontrole of toekomstige prijswijziging wordt verondersteld.
Dit is uitsluitend een privé-rekenblad op basis van eigen aannames:
gebruik geen adressen, namen of andere persoonsgegevens als labels.
De maandvergelijking maakt geen claim over toewijzingskansen, betaalbaarheid
of WoningNet-toestemming. De bestaande live-actiegate blijft ongewijzigd.


### Van woningselectie naar volledige kostenvergelijking

In **Vergelijk twee woningen direct** kies je precies twee van je maximaal twaalf
zelf genoteerde woningnotities. De knop **Neem deze twee woningen mee naar totale kosten**
neemt alleen de twee gevalideerde labels en hun handmatig ingevoerde maandhuur over.
De rekentool eronder vult geen fictieve service-, energie-, vervoers- of startkosten in:
alle extra aannames beginnen op nul en zijn door jou aan te passen. Opnieuw selecteren
en op de knop tikken vervangt bewust de eerdere kostenmomentopname, inclusief eerdere
extra kosten; automatisch synchroniseren tussen panelen gebeurt nooit. De woninglijst
wissen wist de aparte kostenberekening niet: gebruik daarvoor **Wis beide scenario's**.
De gegevens bestaan uitsluitend in het browser-tabblad en worden nergens geüpload.
Exporteer alleen zelf gekozen privébestanden, zonder namen of adressen.


### Eén compleet eigen beslisdossier in plaats van losse exports

Na het bewust overnemen van twee woningen naar de kostenvergelijker toont
**Hoe passen deze woningen bij je oorspronkelijke voorkeuren?** opnieuw
de handmatig vastgelegde kamers, reistijd, balkon en oorspronkelijke
geschiktheid. De knop **Download volledig beslisdossier (woning + kosten)**
schrijft pas op jouw verzoek een begrensd TXT-bestand met de bevroren
woninglijst- en voorkeurenmomentopname én je later handmatig ingevoerde
maand- en eenmalige kosten. Een wijziging in het kostenformulier verandert
niet achteraf je oorspronkelijke woningkenmerken of voorkeuren.
Gebruik opnieuw de overdrachtsknop om bewust een nieuwe momentopname te maken.
Het is geen officieel woningaanbod, toewijzings- of huurtoeslagadvies.
Bestanden kunnen via de door jou gekozen opslagprovider buiten Woonpoints komen;
zonder downloaden blijft alles uitsluitend in dit tabblad.


### Van gekozen woning naar eigen bezichtiging of reactiedeadline

In de bestaande woninglijst kies je bij een woning **Plan vervolgactie voor deze woning ↓**.
De planner vraagt afzonderlijk om bevestiging voordat een eventueel onbewaard
formulier wordt vervangen. Na toestemming wordt **uitsluitend het eigen neutrale
woninglabel** in een nieuw actieformulier gezet; datum, tijd en actietype moet je
zelf kiezen en expliciet bewaren. Annuleren laat het bestaande formulier en de
planning intact. Er wordt nooit een echte WoningNet-reactie of automatisch
kalenderitem aangemaakt. Voor een door jou gecontroleerd tijdstip kun je later
zelf de bestaande privé-JSON of ICS downloaden (een gekozen kalenderprovider kan
synchroniseren). Woninglijst, kosten en actieplanning blijven uitsluitend in het
huidige browsertabblad; wis je de woninglijst, dan worden eerder aangemaakte
handmatige acties niet automatisch uit de agenda of planning verwijderd.


### Privé-maandkalender en één enkele eigen actie delen met je agenda

De bestaande handmatige planner biedt nu een **maandkalender** met vorige/volgende
maand en terug naar vandaag. Alleen zelf genoteerde afspraken verschijnen, maximaal
twaalf, eventueel gefilterd op open acties. Tik op een dagactie om deze in hetzelfde
formulier te bewerken. Daarnaast biedt elke **open** eigen actie
**Alleen deze actie naar agenda (.ics)…**. Hiermee exporteer je niet per ongeluk
alle andere zelf ingevulde deadlines naar je kalenderprovider. De bestaande
opt-in download van alle open deadlines blijft beschikbaar als afzonderlijke
keuze. Een ICS-download is **geen synchronisatie, kalenderwijziging of bevestiging
van WoningNet**; import en externe cloudopslag gebeuren uitsluitend via de door
jou gekozen kalenderapp. De lokale maandweergave stuurt nooit meldingen zelf.

### Mobiele snelnavigatie door de persoonlijke hulpmiddelen

Het dashboard heeft bovenaan een zichtbare, horizontaal veegbare sectienavigatie naar projectstatus, maanddoel, zelf genoteerde reacties, woningselectie, woonkosten, actieplanner, positie-analyse en maandtrend. Elke link is een gewone in-page anchor naar de bestaande Nederlandstalige sectiekop; toetsenbord-, schermlezer- en touchbediening gebruiken dezelfde route. De balk blijft bij lang scrollen bereikbaar en laat de bovenkant van de bestemmingskop vrij. Er is geen nieuwe JavaScript-clientstate, cookie, servercall, browserstorage of live WoningNet-functionaliteit toegevoegd. De vaste niet-geverifieerde projectstatus blijft zichtbaar als context.

### Eigen betaalbaarheid en buffer bij tegenslag (handmatige preview)

Onder **Wat kost wonen je écht per maand?** kun je na vergelijking van twee handmatig ingevulde woningen nu je netto besteedbaar inkomen, overige maandlasten en voor verhuizing beschikbaar spaargeld invoeren. Dezelfde twee scenario's tonen naast hun maand- en jaarkosten direct de buffer ná verhuiskosten, het maandoverschot/-tekort en het geschatte saldo na 12 maanden, zowel bij huidige aannames als bij een zelfgekozen inkomensdaling en stijging van de gezamenlijke woonlasten. Bij een negatief maandbedrag wordt ook de geschatte uitputtingsduur in volle maanden getoond. Een tekort of negatieve buffer krijgt een expliciete waarschuwing.

Alles blijft uitsluitend in React-tabbladgeheugen; **geen serververzoek, storage-synchronisatie, accountcontrole of financiële toestemming**. De gebruiker kan financiële invoer los van de twee woningen wissen of vrijwillig een TXT van de ingevoerde aannames en prognoses opslaan; een gekozen bestandsprovider kan wel synchroniseren. Het rekenmodel is een deterministische momentopname, **geen bewijs van betaalbaarheid, wettelijke huurtoets, huurtoeslagberekening of voorspelling**. Je werkelijke persoonlijke uitgaven, schulden, jaarlijkse wijzigingen en andere risico's kunnen afwijken. Een bestaande woninglijst-naar-kostenoverdracht blijft uitsluitend opt-in; andere financiële waarden worden nooit mee geïmporteerd.

Voor een **verhuis-spaarplan** kun je daarnaast een termijn van 1–36 maanden en een gewenste vaste-lastenbuffer van 0–12 maanden kiezen. Per woning berekent de app een handmatig spaardoel (verhuiskosten plus buffer), het ontbrekende bedrag na al beschikbaar spaargeld en het per maand te reserveren bedrag tot de verhuizing. De huidige huur/uitgaven vóór verhuizing zijn onbekend; het spaarbedrag is daarom een doel, geen bewezen spaarcapaciteit. De invoer wordt desgewenst in dezelfde opt-in TXT-prognose meegenomen.

### Privé kosten- en buffervergelijking bewaren en herstellen (alleen opt-in)

In de woningkostenvergelijker staat een eigen **Bewaar complete privévergelijking als JSON…**-actie zodra de twee woning- en bufferberekeningen geldig zijn. De browser geeft uitsluitend na die klik een lokaal te bewaren versie-1-bestand met beide handmatige kostenramingen, netto inkomen, overige vaste lasten, beschikbaar spaargeld, gekozen tegenslagpercentages, spaarhorizon en reserveperiode. Er is geen automatische opslag, accountkoppeling of serveroverdracht. Het bestand bevat gevoelige privébedragen; gekozen bestandsproviders kunnen de opslag synchroniseren.

Een eerder geëxporteerd bestand kan óók bij een leeg formulier worden geselecteerd. De import accepteert uitsluitend exact bekende versie-1-velden met stringwaarden, alle bestaande invoergrenzen, twee geldige scenario's en een bestand van maximaal 16 KiB. Foute, gewijzigde of te grote bestanden worden geweigerd zonder de huidige invoer aan te passen. Na succesvolle controle volgt een **apart annuleerbaar bevestigingsmoment** vóórdat beide bestaande scenario's, de financiële aannames en het spaarplan in het huidige tabblad worden vervangen. Een eigen JSON-herstelbestand bewijst geen WoningNet-bron of officiële woninggegevens; eerder uit een woninglijst overgenomen provenance wordt na restore bewust niet geclaimd. Bestanden verdwijnen niet van schijf als het tabblad wordt gewist.
