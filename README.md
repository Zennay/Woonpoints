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


## Eigen meerjarenkosten voor twee woningen (privé, geen WoningNet-data)

Via **Meerjarenkosten** op de homepage kun je twee hypothetische woningen over 1–10 jaar
vergelijken. Voer per woning eigen maandhuur, overige maandelijkse woonlasten,
eenmalige verhuis-/startkosten en een zelf gekozen jaarlijkse huurstijging in.
De simulatie verhoogt uitsluitend de huur ieder jaar samengesteld; overige
maandlasten blijven in deze aanname gelijk. In het overzicht staan de huur per
maand, lasten per jaar en cumulatieve uitgaven inclusief de startkosten; bij
verschillen verschijnt het gunstigste scenario en, als dat verandert, het eerste
jaar van omslag. Een bewuste CSV-download bevat uitsluitend vaste numerieke
kolommen, zonder labels uit gebruikersinvoer. Wissen maakt beide scenario's leeg.

Dit is **geen voorspelling**, geen beoordeling van wettelijke huurverhogingen en
geen financieel advies. Er worden geen WoningNet-gegevens gelezen, geen
toeslagen berekend, geen account gekoppeld en geen gegevens automatisch
opgeslagen of verzonden. Kies een bestandslocatie zelf; die locatie kan elders
synchroniseren. De WoningNet-worker blijft BOT_DRY_RUN=true.


## Eigen bezichtigingschecklist voor twee woningen


De checklist levert nu bovendien een **persoonlijke bespreeklijst**:
alle punten die nog onbekend, twijfelachtig of ongunstig zijn staan
bij elkaar, waarbij door jezelf essentieel gemarkeerde onderwerpen
bovenaan verschijnen. Met **Bewaar volledige eigen bespreeklijst als
TXT** maak je zelf een leesbaar bestand met alle tien inspectiepunten,
beide eigen beoordelingen en nog te bespreken punten. In dit bestand
heten de woningen uitsluitend **A/B**, ongeacht hun eventuele labels
in de browser. Het bestand bevat geen namen, adressen, bronclaims,
automatische bewijzen of verborgen accountinformatie. Bewaren is
uitdrukkelijk opt-in en de gekozen locatie kan extern synchroniseren.


Het dashboard heeft een **Bezichtiging**-onderdeel met tien vaste categorieën
zoals ventilatie, vocht, geluid, isolatie en bereikbaarheid. Markeer welke
punten voor jezelf essentieel zijn en geef voor woning A/B afzonderlijk aan
of iets goed, twijfelachtig, ongunstig of nog niet beoordeeld is. Het
overzicht telt alleen eigen oordelen; onbekende punten tellen niet als goed
of slecht en essentieel gemarkeerde aandachtspunten verschijnen duidelijk.
Er is geen automatische rangorde, woningkans of officiële keuring.

De volledige checklist blijft in het geheugen van het huidige tabblad.
Een bewuste JSON-export bevat uitsluitend vaste categoriecodes, vier vaste
beoordelingswaarden en de essentiële vlaggen (geen adres of vrije tekst).
Import weigert extra sleutels, onbekende waarden, verkeerde volgorde of
bestanden boven 8 KiB en vereist afzonderlijke bevestiging voordat huidige
beoordelingen worden vervangen. Een zelf gekozen opslaglocatie kan elders
synchroniseren. Er is geen netwerkverzoek, WoningNet-koppeling of live reactie.

### Van eigen kostenvergelijking naar meerjarenkosten

Na **Vergelijk mijn bedragen** in het bestaande privé-kostenoverzicht kun je
**Bied deze twee kostenramingen aan voor meerjarenvergelijking** kiezen. Deze actie
maakt uitsluitend een lokale momentopname van de twee reeds ingevulde huren,
service-, energie- en reiskosten plus eenmalige startkosten. In het meerjarenpaneel
verschijnt **eerst een aparte bevestiging** voordat eventuele eerder ingevulde
scenario's worden vervangen. Annuleren laat alle huidige bedragen intact.

Er worden geen prijzen, huurstijgingen of kansen uit woningportalen gehaald.
Beide hypothetische jaarlijkse huurstijgingen starten expliciet op **0%**;
controleer en wijzig dat percentage daarna zelf. De ingevoerde duur blijft
bij een overdracht behouden. Gewijzigde bedragen in het bronoverzicht veranderen
het reeds overgenomen meerjarenmodel niet stilzwijgend. Deze overdracht schrijft
geen bestanden, cookies of browseropslag en voert geen netwerkverzoeken uit.

### Vanuit de shortlist naar de bezichtigingschecklist

Selecteer in de eigen woninglijst twee woningen en kies **Bied deze twee woningen
 aan voor bezichtigingschecklist**. Alleen hun door jou ingetikte, neutrale
labels worden als momentopname aan de checklist aangeboden. **Overnemen vergt
nog een aparte bevestiging** omdat de eerdere beoordelingen en essentiële
punten dan volledig worden gewist: oude waarnemingen mogen nooit stilzwijgend
onder nieuwe woningen verschijnen. Annuleren behoudt de huidige checklist.
Na overname veranderen latere bewerkingen aan de woninglijst niets aan de
reeds ingestelde labels. Het bestaande JSON-formaat bewaart bewust alleen
A/B-scores, nooit woninglabels: bij latere import worden de labels expliciet
teruggezet op **Woning A/B** om verkeerde herkomst te voorkomen. Alle gegevens
blijven offline en ongeverifieerd.


### Van een belangrijk bezichtigingspunt naar een eigen vervolgactie

Een checklistregel die je zelf als **essentieel** én als twijfelachtig of
ongunstig markeert, verschijnt als mogelijke vervolgactie onder de checklist.
Kies daar bewust **één punt** (met het neutrale woninglabel) om aan de reeds
bestaande privéplanner aan te bieden. De planner vraagt opnieuw bevestiging
voordat hij het huidige invulformulier vervangt; bij bevestiging wordt alleen
een kort neutraal label met het type *beslismoment* voorbereid. Zelf de datum
en tijd invullen en daarna pas *Voeg eigen actie toe* kiezen blijft verplicht.

De bezichtigingschecklist wordt niet aangepast. Er is geen automatische
agenda-import, WoningNet-reactie, accounttoegang, opslag of netwerkactie.
Ontbrekende en reeds positief beoordeelde punten zijn niet selecteerbaar.


### Meerjarenscenario's volledig terugzetten met privé-JSON

**Bewaar volledige meerjarenvergelijking als JSON** maakt op eigen verzoek
één lokaal bestand met alle twee eigen huurscenario's, overige maandlasten,
startkosten, stijgingspercentages en het gekozen aantal jaren. Anders dan de
bestaande numerieke CSV bewaart deze JSON ook de oorspronkelijke aannames,
zodat het scenario later nog bewerkbaar is.

Een bewust geselecteerd JSON-bestand (maximaal 16 KiB) wordt alleen
geaccepteerd als het de juiste versie, uitsluitend bekende velden, valide
jaarhorizon en veilige begrensde getallen bevat. Een apart herstelakkoord
is verplicht voordat **alle huidige** bedragen en de termijn worden
vervangen. Annuleren of een fout bestand behoudt het huidige scenario.
Niets wordt automatisch bewaard, naar een server verstuurd of gebruikt
om rechten, werkelijke prijzen of toekomstig rendement af te leiden.


## Eigen zoekpuntengeschiedenis — handmatig en ongeverifieerd

Via **Zoekpunten** in de directe navigatie is er nu een eigen lokaal
maandoverzicht met maximaal 36 handmatig genoteerde zoekpuntenstanden.
Je kiest een geldige maand van januari 2000 tot de huidige lokale maand,
vult 0–10.000 gehele punten in en ziet de verandering ten opzichte van de
**vorige daadwerkelijk ingevulde** maand. De grafiek laat uitsluitend
ingevulde maanden zien; er zijn geen voorspelde punten of automatisch
geïnterpoleerde ontbrekende maanden. Je kunt een maandstand bewerken of
afzonderlijk na bevestiging verwijderen.

**Privacy en bewijskracht:** geen account-, WoningNet- of MijnDak-koppeling,
geen officiële puntenregistratie, geen zoekpuntentoekenning en geen
wijziging aan het automatische reactiegedrag. De invoer blijft alleen in
het tabgeheugen: sluiten zonder zelf exporteren verliest de notities.
Naast versiegebonden JSON is er nu ook **Bewaar eigen maandstanden als CSV**
en een eigen CSV-import. Dat bestand bevat alleen de vaste header
`month,points` en uitsluitend regels zoals `2026-10,12`, zonder
formules, labels, vrije tekst of verborgen persoonsgegevens. CSV-import
is beperkt tot 4 KiB en weigert onbekende kolommen, ongeldige maanden,
niet-gehele of dubbele puntenstanden en vreemde controletekens.
Ook CSV-herstel vervangt bestaande notities pas na afzonderlijke
bevestiging. Er vindt geen serverupload plaats.

Via **Bewaar eigen maandstanden als JSON** kun je bewust een klein,
versiebeperkt bestand naar een zelfgekozen locatie wegschrijven. Import
accepteert uitsluitend het precieze JSON-formaat, één unieke geldige
maand per notitie, gehele punten en maximaal 16 KiB; alleen na tweede
bevestiging worden de huidige notities vervangen. Een gekozen map kan
buiten de app synchroniseren. Een lege of ongeldige import laat bestaande
notities ongemoeid. De officiële dashboardkaart blijft **Zoekpunten onbekend**
tot geautoriseerde read-only brondata beschikbaar zijn.


### Drie hypothetische meerjaren-kostenstressscenario's

Binnen **Meerjarenkosten** staan nu drie transparante vergelijkingen voor
dezelfde twee zelf ingevoerde woningen: jouw bestaande basisraming, een
extra huurstijging voor beide woningen, en een gecombineerde variant waarin
ook de overige maandelijkse woonlasten jaarlijks stijgen. De gebruiker kiest
beide stresspercentages zelf (0–20%). Jaarlijks samengestelde huur- en
kostenstijgingen en eenmalige verhuiskosten in jaar één zijn zichtbaar in
de vergelijking van de cumulatieve totale kosten over 1–10 jaar. De
app meldt wanneer de goedkoopste woning verandert tussen basis- en
gecombineerd scenario; dit is uitsluitend een gevoeligheidssignaal,
geen aanbeveling of voorspelling van toegestane huurverhoging.

**Bewaar de drie scenario's als eigen numerieke CSV** exporteert alleen
vaste scenario-identificaties en bedragen (geen formules, persoonsgegevens
of woninglabels). De volledige opt-in privé JSON-back-up is naar **v2**
opgewaardeerd en bevat nu ook de twee eigen stressinstellingen. Een
bestaand v1-bestand kan nog steeds worden hersteld, met vooraf verklaarde
standaardstress van 3/4% wanneer die velden ontbreken. Bij import blijven
huidige aannames intact tot de gebruiker de volledige vervanging apart
bevestigt. Geen automatische opslag, externe accounts of WoningNet-acties.


### Eigen maandmomenten gelijkmatig voorstellen

Als je in de **Maanddoel**-sectie nog eigen reacties wilt plannen, kun je
nu met **Stel gelijkmatig verspreide datums voor** een tijdelijke verdeling
over de resterende kalenderdagen laten maken. Dit verandert nog niets.
De app toont eerst alle voorgestelde datums en vraagt afzonderlijk
**Ja, vul deze datums in** of **Behoud mijn huidige datums**. Alleen bij
bevestiging worden de tijdelijke datumvelden overschreven; het eigen
reactie-aantal, de bewaarde maandnotitie en kalenderbestanden veranderen
niet. Na controle is apart **Bewaar ... als agenda-ICS** nodig.

Bij te weinig resterende dagen voor unieke datums wordt geen voorstel
gedaan. De berekening gebruikt lokale kalenderdagen in plaats van
24-uursblokken, zodat klokverzet geen dubbele of ontbrekende datum
oplevert. Voorstellen vervallen bij maandwisseling of als de gebruiker
de datums zelf wijzigt. Dit zijn geen officiële reactiedeadlines,
geen automatische accountreacties en geen browserherinneringen.


### Persoonlijke budgetgrens per maand — 1 tot 10 jaar

In de bestaande **Meerjarenkosten**-vergelijking kun je nu optioneel één
eigen maximale maandelijkse woonuitgave kiezen (€1–€50.000). De app toont
voor ieder jaar de **basisraming** van beide woningen (huur plus andere
vaste maandlasten), hoeveel die raming in die maand boven het zelf gekozen
bedrag ligt, en welk eerste jaar je maandgrens wordt overschreden. Een
theoretisch cumulatief bedrag boven die grens over alle gekozen jaren
helpt verschillen zichtbaar maken; eenmalige verhuis- en startkosten
horen niet bij de maandbudgetgrens, maar blijven wel in de bestaande
totale-kostenvergelijking zichtbaar.

Je kunt de numerieke jaartabel bewust als CSV bewaren, zonder
persoonsgegevens of formules. Het eigen maximale maandbedrag wordt
bovendien meegenomen in de volledige **privé-JSON v3**. Oude v1-
en v2-bestanden blijven leesbaar: voor ontbrekende budgetvelden
wordt **geen limiet** ingevuld. Ongeldige bestanden worden geweigerd
en herstellen vereist apart akkoord voor het vervangen van alle
huidige aannames.

Dit is een rekenkundige gevoeligheidsindicator, **geen** juridische
of financiële betaalbaarheidstoets. Geen inkomen, toeslag, wettelijke
huurverhoging, daadwerkelijke energiekosten of WoningNet-rechten worden
gecontroleerd; er gaat geen data naar een server.


### Privéagenda: tijd per datum en lengte zelf kiezen

Bij de maandplanning kun je naast iedere eigen datum een **lokale begintijd**
invullen en apart een lengte van 15, 30 of 60 minuten kiezen. De standaard
09:00/15 minuten is alleen een voorstel, geen officiële deadline. De
app weigert lege/ongeldige tijden, afspraken die pas na middernacht
eindigen, en afspraken op vandaag waarvan het startmoment al voorbij is.
Voor het huidige maanddoel accepteert het formulier uitsluitend datums
tussen vandaag en de werkelijke laatste kalenderdag van de huidige maand.
Geen extra rechten, serverkoppelingen of nieuwe opslag.

De bestaande twee stappen blijven: eerst een datumvoorstel expliciet
overnemen, daarna **bewust** een ICS-bestand downloaden en zelf in de
gewenste agenda importeren. De app maakt niet stilzwijgend afspraken,
notificaties of WoningNet-reacties. Alle tijden worden als door de gebruiker
gekozen lokale (zwevende) agendatijd in het ICS-bestand gezet; de eigen
agenda en ingestelde tijdzone bepalen de uiteindelijke herinneringen.


## Privé-verhuischecklist (handmatig, ná een eigen woonkeuze)

Het dashboard biedt een apart **Verhuizen**-onderdeel voor het organiseren van
een mogelijke verhuizing zonder WoningNet-verbinding. Het bevat twaalf algemene,
zelf af te vinken suggesties van eerste voorbereiding tot de eerste week na
verhuizing. Vul optioneel een voorlopige verhuisdatum in om eigen richtmomenten
te zien; dit zijn **geen wettelijke of contractuele deadlines**. Voeg tot 24 eigen
korte taken toe, groepeer ze naar fase, filter op open/afgevinkt en zie direct
hoeveel werk er nog resteert. Een eigen taak kan worden verwijderd.

- Geen adres, naam, rekeninggegevens of contracten invoeren. Er worden geen
  woningreacties, afspraken, betalingen of adreswijzigingen uitgevoerd.
- De checklist en datum leven uitsluitend in de React-geheugenstatus van dit
  tabblad. Geen automatische opslag, localStorage, cookies of netwerkverzoeken.
- **Bewaar eigen checklist als privé-JSON** maakt na een bewuste klik een
  versiegebonden bestand van de datum, taken en vinkjes. Een zelfgekozen
  opslaglocatie kan buiten deze applicatie synchroniseren.
- **Open eerder bewaarde privéchecklist** leest een lokaal JSON-bestand van
  maximaal 16 KiB. Onbekende formaten/velden, ontbrekende vaste stappen,
  dubbele IDs en ongeldige datums, labels of fasen worden geweigerd.
  De bestaande lijst blijft ongewijzigd tot de gebruiker **Vervang mijn
  huidige checklist** kiest. Bij **Begin opnieuw** is opnieuw een expliciete
  bevestiging vereist.
- **Bewaar open fases als agenda-ICS…** verschijnt na het kiezen van een
  geldige verhuisdatum. De gebruiker maakt op eigen verzoek maximaal vijf
  voorlopige agenda-afspraken (09:00–09:30 lokale agendatijd): één per fase
  met onafgeronde stappen, inclusief eigen taaklabels in de beschrijving.
  RFC 5545-tekst wordt ge-escaped en UTF-8-fysieke regels worden op een
  beperkte octetlengte gevouwen. Een kalender-app kan deze gegevens
  synchroniseren naar een cloud; dit gebeurt nooit automatisch vanuit
  Woonpoints. Er worden geen officiële deadlines of boekingen gemaakt.
- Er is geen koppeling met het privé-reactiedagboek, zoekpunten of
  WoningNet. Het project blijft in dry-run tot afzonderlijke
  toestemming-, bron- en releasevoorwaarden zijn vervuld.


## Van handmatige woning-shortlist naar privé-verhuischecklist

Vanuit elke zelf ingevoerde woning kun je **Bereid verhuisplan voor deze
woning voor** kiezen. Het scherm gaat naar de bestaande verhuischecklist,
waar een apart bevestigingspaneel laat zien welke *eigen, ongeverifieerde*
woningkenmerken als context worden aangeboden: huurindicatie, kamers,
reistijd en balkon. Pas met **Ja, voeg alleen deze stappen toe** worden
maximaal vijf nieuwe, concrete voorbereidende taken toegevoegd.

- De huurindicatie, reistijd en kamers dienen uitsluitend als tekst voor
  eigen controletaken; niets wordt beoordeeld als officiële woningaanbieding
  of geslaagde inkomens-/contractcheck.
- De voorgestelde taken worden toegevoegd, niet automatisch opgeslagen:
  bestaande vinkjes, datum, zelf toegevoegde taken, kalenderexports en
  archiefbestanden blijven ongewijzigd. Gelijknamige taken worden niet
  dubbel toegevoegd.
- Een lopend bestand-herstel of wisverzoek blokkeert toevoegen totdat de
  gebruiker dat verzoek afrondt. Bij onvoldoende ruimte (maximaal 36
  totale taken) wordt niets gedeeltelijk toegevoegd.
- Het aangeboden woninglabel wordt alleen in het tijdelijke
  bevestigingspaneel getoond. De nieuwe taken bevatten geen label,
  adres, naam of link naar een account, en verdwijnen bij sluiten
  van het tabblad zonder bewuste export.
- **Nee, behoud mijn eigen checklist** annuleert zonder mutatie. Geen
  WoningNet-actie, automatische woningacceptatie of netwerkverzoek.

## Privé-agendaconcept van de huidige reactiemaand bewaren

De bestaande handmatige maandplanning kan nu ook **eigen agendaconcepten**
bewaren en opnieuw openen, los van de optionele ICS-export. Kies maximaal vier
zelfbedachte reactiemomenten met een lokale begintijd en gezamenlijke duur.
Met **Bewaar agendaconcept als privé-JSON** download je alleen de maand,
het aantal nog open eigen momenten, de gekozen dagen/tijden en duur. De teller
met zelf genoteerde reacties staat *niet* in dit bestand. Er vindt nooit een
automatische agendaboeking of accountreactie plaats.

Via **Open eigen agendaconcept** lees je alleen een JSON-bestand van maximaal
4 KiB in: exact bekend versieformaat/velden, huidige kalendermaand, hetzelfde
aantal open eigen momenten, geldige unieke nog komende dagen, 24-uurs begintijd
en afspraak die vóór middernacht eindigt. Een apart bevestigingspaneel toont
de ingelezen keuzes; pas **Vervang mijn agenda-keuzes** past uitsluitend deze
tijdelijke instellingen toe. Geweigerde of geannuleerde import laat alles
ongewijzigd. Bij een nieuwe kalendermaand of gewijzigde eigen voortgang
vervalt een oud herstelvoorstel. Je eigen reactieteller en opgeslagen
Woonpoints-notitie worden nooit door agenda-import geschreven of vervangen.
Een gekozen downloadlocatie kan buiten deze app synchroniseren.


## Handmatig reactiedagboek → eigen maandteller (tweemaal bevestigen)

Het reactiedagboek kan een **eigen, ongeverifieerde maandtelling** voorstellen
aan het reeds bestaande maanddoel. Dit gebeurt volledig in het huidige
browsertabblad: er is geen account-API, geen backendrequest en geen automatische
vervanging of opslag van reactiedagboekgegevens. De nieuwe knop toont alleen
deze kalendermaand tot vandaag; alleen notities met de letterlijke eigen
status **Zelf gereageerd** worden geteld. Ingetrokken, afgesloten,
uitgenodigde, geplande of toekomstige notities worden **niet** automatisch
als geldige reacties geïnterpreteerd. Iedere eigen notitie kan onvolledig,
dubbel of onbevestigd zijn. Een teller is **nooit** bewijs dat WoningNet
een reactie registreerde of dat er zoekpunten werden toegekend.

- Een gebruiker kiest eerst **Bied eigen maandtelling ter controle aan**.
  Er wordt geen telling stilzwijgend toegepast of afgerond op vier.
  Als meer dan vier notities letterlijk als gereageerd zijn gemarkeerd,
  wordt de overdracht geweigerd met een concrete waarschuwing.
- De maandplanning toont vervolgens zijn **bestaande eigen stand en de
  aangeboden telling naast elkaar** en vraagt afzonderlijk **Ja, gebruik
  deze zelf genoteerde maandtelling** of **Nee, behoud mijn maandstand**.
  Afwijzen houdt de huidige teller ongewijzigd.
- Toepassen gebruikt de *bestaande* compare-and-set-beveiligde maandteller.
  Een andere tabbladwijziging, oude/onleesbare opgeslagen bron of
  maandwissel kan deze actie blokkeren: de gebruiker ziet bestaande
  conflict-/opslagwaarschuwingen. Geweigerde persistente opslag wordt
  niet als duurzaam bevestigd.
- Als het dagboek later verandert of een CSV-import wordt voorbereid,
  wordt een nog openstaand overdrachtsvoorstel ingetrokken. Sluiten van
  het browsertabblad verliest de tijdelijke handoff.
- De teller is een persoonlijke planningsnotitie, *geen* officiële
  maandelijkse validatiestatus en triggert geen reacties, e-mails of
  WoningNet-workers. `BOT_DRY_RUN=true` en alle rechten-/
  productievoorwaarden blijven onveranderd.


## Mijn eigen maandbeeld: twee privacy-first bronnen naast elkaar

Boven de handmatige maandplanning staat nu een **eigen maandoverzicht**,
dat alleen de lokale maandnotitie en het persoonlijke reactiedagboek van
het huidige browsertabblad laat zien. Het geeft twee aparte, expliciet
ongeverifieerde getallen: (1) het door jou bijgehouden maanddoel,
inclusief zichtbaar tijdelijk/niet-bevestigd browseropslaggedrag, en
(2) het aantal eigen notities met de letterlijke status
**Zelf gereageerd** in deze kalendermaand tot vandaag.

- Statussen *van plan*, *uitgenodigd*, *afgesloten* en *ingetrokken* tellen
  niet automatisch mee. De samenvatting toont ook hoeveel eigen
  dagboeknotities een andere status hebben.
- Als de eigen maandteller en het dagboek uiteenlopen, verschijnt alleen
  een duidelijk verschilbericht met snelkoppelingen naar de twee
  bestaande invoerpanelen. Er wordt niets automatisch samengevoegd,
  verwijderd of overschreven.
- Een oudere of niet-decodeerbare browsermaandnotitie blijft bewust
  beschermd. Als opslag geweigerd wordt, toont het overzicht dat de
  waarde hooguit tijdelijk is; een lokaal opgeslagen waarde wordt
  nooit gepresenteerd als officieel.
- Bij een nieuwe kalendermaand vernieuwt de bestaande maandtimer de
  maandstatus; het reactiedagboek rapporteert dan uitsluitend eigen
  gegevens van de nieuwe maand. De data-uitwisseling is in React
  geheugenstatus zonder nieuwe API, eventbus, cookie, opslag of
  netwerkaanroep. Sluiten van het tabblad wist niet-geëxporteerde
  dagboekgegevens.
- De oorspronkelijke officiële statuskaarten houden **Onbekend** als
  broninformatie ontbreekt. Het aparte eigen overzicht claimt dus
  geen geverifieerde WoningNet-stand, toegekende zoekpunten of
  automatisch geldige reacties. De worker blijft `BOT_DRY_RUN=true`.


## Eigen zoekpunten erbij in het gecombineerde privé-overzicht

Het persoonlijke maandoverzicht laat nu naast de **eigen maandteller** en
het **persoonlijke reactiedagboek** ook de laatst door jou genoteerde
zoekpuntenmaand zien. Dit derde kaartje toont uitsluitend de laatste
handmatige puntenwaarde en, indien aanwezig, het exacte verschil met de
vorige *ingevulde* maand. Het schat geen tussenmaanden of toekomstige
punten, bevestigt geen geldige WoningNet-reacties en vervangt geen
officieel accountoverzicht. De bestaande officiële bronkaarten blijven
daarom terecht **Onbekend** waar broncontrole ontbreekt.

- Wijzig, verwijder of herstel een privépuntenstand in de bestaande
  zoekpuntenmodule: het kaartje volgt alleen de huidige React-status van
  dat browsertabblad, zonder achtergrondopslag of eigen data-API.
- Er is een zichtbare directe link naar de oorspronkelijke
  zoekpuntenhistorie, naast de links naar maandplanning en dagboek.
- De bestaande vorm en plaatsing van de drie invoerpanelen blijven
  behouden. Geen automatische overdracht tussen zoekpunten en eigen
  reacties: het is uitsluitend een transparante momentopname.
- Zelfs een verschil van nul is een *persoonlijke waarneming*, geen
  officiële toekenning of voorspelling. De WoningNet-worker blijft in
  dry-run en account-/toestemmings-/releasegates blijven intact.


## Vrijblijvend maandplan voor zelf woonaanbod bekijken

Onder **Maandplan** vind je nu een los, privé hulppaneel voor de zelfgekozen
maand. Vul je eigen aantal al gedane kijkmomenten (0–4) en elders
zelf geplande momenten in. De tool stelt de overige dagen gespreid voor,
rekening houdend met de echte kalenderdagen, reeds verstreken dagen en
desgewenst uitsluitend werkdagen. Elk voorgesteld kijkmoment is vervolgens
zelf aan te passen binnen de overgebleven geldige maanddagen; dubbele of
verstreken datums blokkeren de export totdat ze zijn hersteld. Als er onvoldoende dagen over zijn,
wordt dat expliciet getoond; acties schuiven niet stilzwijgend naar een
volgende maand. Bij reeds vier ingevulde/geplande aandachtspunten stelt
de tool niets extra's voor.

Alleen na een expliciete knopdruk kan een standaard **voorlopig ICS-bestand**
met uitsluitend de voorgestelde *kijkmomenten* lokaal worden aangeboden.
Er staan geen adressen, persoonsgegevens, WoningNet-accounts, opt-in
reminders, echte woningreacties of geheime gegevens in. Importeren in een
eigen agenda is de verantwoordelijkheid van de agenda-app; een cloud-
gesynchroniseerde agenda kan die suggesties vervolgens elders bewaren.
Het tabblad bewaart zelf geen gegevens en maakt geen API-verzoeken.

**Belangrijk:** dit is geen officiële bron, registratiesysteem of
reactieautomatisering. Een moment van woonaanbod bekijken is geen
geldige maandreactie, zoekpunt, uitnodiging, toewijzing of bewijs dat er
via WoningNet iets is gedaan. De gebruiker moet altijd zelf het aanbod,
zijn/haar daadwerkelijke reactie en de actuele regels controleren.
Bestaande `BOT_DRY_RUN=true`, producttoestemming en releasegates blijven
ongewijzigd. Dit paneel is technisch en qua bronpaden onafhankelijk van
de afzonderlijke handmatige maandhistorie.


### Een persoonlijk maandplan bewust bewaren en veilig herstellen

Bij **Maandplan** kun je een compleet, nog toekomstig eigen voorstel als
`woonpoints-eigen-maandplan.json` downloaden. Het bestand bevat uitsluitend
de gekozen kalendermaand, eigen teller (0–4), al elders geplande
aandachtspunten (0–4), werkdagfilter en zelf gekozen voorlopige datums.
Er is geen account, adres, officiële registratie of afspraakbewijs in.

De gebruiker kan datzelfde ongewijzigde Woonpoints-formaat later via
**Kies eerder bewaard maandplan** terugzetten. De lokaal gekozen JSON mag
hoogstens 2 KiB zijn en moet exact het versie-1-formaat van deze
export volgen; extra velden, ongeldige aantallen, dubbele of verstreken
datums, weekeind-datums bij de werkdagfilter, gewijzigde vormgeving en
onbekende bestanden worden geweigerd. De bestaande maand en gekozen
datums blijven ongewijzigd tot een **tweede expliciete bevestiging**.
Een tussentijdse wijziging van de huidige invoer maakt de bevestiging
ongeldig. Herstel wijzigt geen andere Woonpoints-sectie of externe agenda.

De functie is bewust **tabbladgeheugen-only**: geen automatische
browseropslag, geen API-verzoek, geen WoningNet-actie en geen
achtergrondherinneringen. Een zelfgekozen bestandsprovider kan
gedownloade bestanden buiten Woonpoints synchroniseren. Maak zelf
een back-up voordat je het tabblad sluit; verlopen kijkmomenten
kunnen niet als toekomstig plan worden hersteld.


## Twee woningen visueel vergelijken met eigen foto's

Naast de bestaande handmatige bezichtigings- en kostenvergelijkingen staat nu
**Fotovergelijking**. Kies voor woning A en B maximaal drie eigen JPEG-/PNG-/
WebP-foto's (maximaal 5 MiB per bestand en 20 MiB over beide woningen).
Woonpoints accepteert uitsluitend bestanden met een passende herkenbare
image-header; SVG, GIF, video, lege of te grote bestanden worden geweigerd.
Je kunt per woning tussen foto's bladeren, losse foto's direct uit het
browsertabblad verwijderen en maximaal 400 tekens eigen aantekeningen maken.
Met **Wis beide albums en aantekeningen** wis je alles tegelijk.

Dit is een **tijdelijke, lokale visuele vergelijking**. De browser maakt
alleen private tijdelijke object-URL's voor geselecteerde bestanden;
bij verwijderen, wissen en verlaten van het paneel worden deze vrijgegeven.
Er worden geen afbeeldingen geüpload, automatisch opgeslagen, gedownload,
vertaald of geanalyseerd. Alleen de eigen A/B-tekstobservaties kunnen via
**Toon privé-TXT-voorbeeld…** en een aparte expliciete bevestiging als
tekstbestand worden opgeslagen. De export bevat nooit beeldbytes,
bestandsnamen of tijdelijke afbeeldingslinks. De tekst is op eigen invoer
gebaseerd en kan persoonsgegevens bevatten als je die zelf noteert.
De bestaande originele fotobestanden op je apparaat worden niet verwijderd.
Sluiten/verversen van het browsertabblad verliest de invoer.

Let bij eigen foto's op herkenbare personen, adressen, documenten, foto's
van derden en andere privacy-/auteursrechten. Woonpoints claimt geen
auteurschap, advertentieherkomst, WoningNet-bron, bouwkundige beoordeling,
toewijzingskans, woninginspectie of officiële goedkeuring. Dit paneel
verandert geen account, reacties, zoekpunten, accounttoestemming of
`BOT_DRY_RUN=true` en staat volledig los van de live WoningNet-adapter.


### Optionele lokale schuifvergelijking van twee zelf gekozen foto's

In **Fotovergelijking** kun je nu naast de twee kolommen een
**A/B-overvloeiingsschuif** openen zodra je bij beide woningen een
eigen foto gekozen hebt. Op de achtergrond blijft woning A zichtbaar;
de positie van de schuif bepaalt welk deel links met jouw gekozen
foto van woning B bedekt wordt. Standaard is de verdeling 50/50;
een extra knop zet die verdeling terug. Kies je een andere thumbnail,
dan werkt de schuif direct met de nieuwe selectie.

Beide originelen blijven onaangetast en de schuif verwerkt uitsluitend
de twee tijdelijke lokale afbeeldings-URL's die de basisfotovergelijker
al gebruikte. De weergave uploadt niets, maakt geen nieuwe opslag
en voert geen afbeeldingherkenning, automatische uitlijning of
achtergrondanalyse uit. Foto's met andere perspectieven en formaten
zijn niet vanzelf vergelijkbaar; dit is geen bewijs dat afmetingen,
kwaliteit of woningen gelijkwaardig zijn. Bij het wissen van de
albums verdwijnen ook alle afbeeldingsvoorbeelden uit de app.


## Woon-werkcalculator voor twee handmatige woningen

In het dashboard staat bij **Woon-werk** een onafhankelijk overzicht waarin
je twee mogelijke woningen vergelijkt op **jaarlijkse eigen woonkosten én
woon-werkkosten**. Per woning kun je zelf een huur, overige woonkosten,
werkweken, reisdagen per week, enkele reistijd en vervoersmiddel invoeren.
Voor auto berekent het scherm de kosten uit retourkilometers × zelfgekozen
alle-in kilometerschatting, plus parkeren/tol. Voor het OV geef je een
zelf geraamd retourtarief per reisdag op; voor fiets/lopen kun je eveneens
eventuele eigen dagkosten invullen. Een zelf geraamde werkgeversvergoeding
wordt nooit voor meer dan de geraamde reiskosten in mindering gebracht.

Het scherm toont per woning jaarlijkse reisuren, netto- en
brutoreiskosten, gemiddelde maandlast en het **verschil B min A**
voor totale jaarkosten en reisuren. Getallen worden begrensd en
tegenstrijdige/ongeldige invoer wordt expliciet geweigerd; ontbreken
van gegevens levert geen schijnzeker resultaat op. Als voorbeeld staan
twee fictieve scenario's vooringevuld; deze zijn nooit actuele
woningaanbiedingen of tarieven.

Alle berekeningen zijn alleen voor de door de gebruiker ingevulde
aannames. Het is **geen** routeplanner, OV-prijszoeker,
kilometervergoedings-/belastingadvies of officieel budgetbesluit. Het
model waardeert reistijd niet als geld, voorspelt geen tarieven, en
houdt geen rekening met ziekte, onregelmatige diensten, toeslagen of
variabele ritten. Werkelijke individuele vergoedingen en belastingen
kunnen anders uitvallen.

Via een afzonderlijke voorbeeld-/bevestigingsstap kan uitsluitend een
eigen, leesbaar TXT-overzicht van de getallen worden opgeslagen.
Bij annuleren gebeurt niets. De bron bevat geen eigen adres- of
accountvelden, maakt geen netwerkverzoeken, slaat niets automatisch
op en stuurt nooit gegevens naar WoningNet. Verversen/wissen verwijdert
de invoer van het scherm. De bestaande shortlist, woningvergelijker,
privé-notities en `BOT_DRY_RUN=true` blijven volledig onafhankelijk.


## Zelf je verhuisvolume en mogelijke ritten inschatten

De nieuwe sectie **Verhuisvolume** helpt bij het handmatig noteren van
eigen meubels, apparaten en dozen. Drie fictieve voorbeelden zijn ingevuld
en kunnen direct worden aangepast of verwijderd. Je kunt maximaal 25
regels opnemen, elk met een korte eigen naam, breedte/diepte/hoogte in
**centimeters** en aantal stuks.

Per regel wordt de rechthoekige volume-omhulling berekend:
`breedte_cm × diepte_cm × hoogte_cm × aantal / 1.000.000`
in kubieke meters. De gebruiker kiest zelf een extra
laadruimtepercentage (0–50%) en de **zelf geverifieerde bruikbare m³
per rit** (1–30). Het scherm toont het totale volume inclusief reserve
en een afgeronde, **uitsluitend volumematige ondergrens** van het
aantal ritten. Een werkelijk passend verhuisvoertuig of veilig aantal
ritten volgt hier nooit automatisch uit: sommige meubels zijn niet
stapelbaar, passen niet door deuropeningen of overschrijden laadgewicht,
massa-/aslast, vergunning-, rijbewijs- of veiligheidsregels.

De calculator weigert ongeldige afmetingen/aantallen en volumes buiten
de begrenzing. Via een **bewust bekeken concept** kan de gebruiker
uitsluitend de eigen itemlijst en som als TXT downloaden;
Daarnaast kan een volledige inventaris inclusief eigen afmetingen,
hoeveelheden, reserveruimte en capaciteit na expliciete klik als
kleine versie-1 **privé-JSON (max. 8 KiB)** worden opgeslagen. Terugzetten
vereist het ongewijzigde Woonpoints-exportformaat, sluit ongeldige
waarden/duplicaatvelden/extra sleutels uit en stelt een aparte
**bevestiging voordat huidige gegevens worden vervangen**. Een gewijzigd
huidig formulier maakt een eerder gekozen herstelvoorstel ongeldig.
Bij afwijzing blijft alle huidige invoer behouden; import/export heeft
geen invloed op andere Woonpoints-onderdelen of eerdere downloads. de knop biedt
geen automatische agenda-, account- of backendactie. Persoonlijke
itemnamen kunnen privé zijn: controleer de export zelf voor opslaan.

Er is geen browseropslag, fotoverwerking, tariefzoeker, accounttoegang,
WoningNet-integratie of VPS-werklast. Wissen/verversen verwijdert de
gegevens uit de app, maar niet eventuele zelf gedownloade bestanden.
De bestaande verhuischecklist, woningvergelijking en
`BOT_DRY_RUN=true` worden niet gewijzigd.


### Zelf begrote verhuiskosten (geen offerte)

Onder **Verhuisvolume → Begroot je eigen verhuizing** staat nu een
losse, privacyvriendelijke schatting van de **totale eenmalige
verhuiskosten**, opgebouwd uit het door de gebruiker gewenste aantal
ritten, zelf geraamde vervoerskosten per rit, betaalde hulpuren en
uurtarief, inpakmateriaal, overige eigen kosten en onvoorziene
kostenreserve. Het aantal begrote ritten mag niet lager zijn dan
de eerder berekende volumematige minimumritten; wanneer er niets
te vervoeren is mag het aantal 0 zijn. Invoervelden zijn begrensd
en ongeldige of onvolledige bedragen blokkeren de budgetuitkomst
zonder de afzonderlijke inventaris onbruikbaar te maken.

Woonpoints toont het **subtotaal, reserve, eigen totaal** en de
extra kosten van één bijkomende voertuigrit, zonder impliciet
toegang, voertuigpasvorm, gewichtslimieten, werkelijk aantal
ritten, vergunningsregels of actuele prijzen te garanderen.
Alle getallen zijn uitsluitend door de gebruiker gekozen
scenario's en vormen geen offerte, financieel of verhuisadvies.

Een eigen TXT-rapport vereist eerst een zichtbare inhoudscontrole
en daarna een aparte downloadbevestiging. Het rapport bevat alleen
eigen aannames en het kostenresultaat, geen adres, account, voertuig-
of persoonsgegevens. Bij wijziging van invoer vervalt het eerdere
concept. **De apart op te slaan JSON-inventaris bevat bewust geen
kostenbudget**; wie ook een begroting wil bewaren kiest
de aparte TXT-export. Geen browseropslag, upload, automatische
afspraken of wijzigingen aan andere Woonpoints-onderdelen.

### Woon-werk: bereken de financiële omslaggrens van extra huur

De **Woon-werkcalculator** toont nu expliciet hoeveel extra **maandelijkse
woonlasten** woning B financieel kan hebben voordat de eigen
**netto-reiskostenbesparing ten opzichte van A** is opgebruikt.
De maandelijkse reisbesparing is
`(netto reiskosten A per jaar - netto reiskosten B per jaar) / 12`.
De werkelijke extra woonlasten van B (inclusief eigen andere vaste
woonkosten) worden hiervan afgetrokken. De resterende financiële marge
is precies de tegengestelde richting van het jaarkostenverschil gedeeld
door twaalf. Een negatieve grens betekent dat B juist lagere woonlasten
nodig heeft om financieel gelijk te komen. Reisuren worden daarnaast
afzonderlijk getoond, niet stilzwijgend als geld behandeld.

Wie dat expliciet wil kan zelf een **subjectieve waarde per reisuur**
van €0 tot €100 kiezen. Dan volgt een **afzonderlijke persoonlijke
weging** van het B-min-A jaarverschil:
`verschil woon- en reiskosten + verschil reisuren × eigen uurvoorkeur`.
Deze tijdwaarde is geen loon, betaalde uitgave, fiscale aftrek,
marktconforme waarde, of vervanging van de echte kostenvergelijking.
Een waarde van nul houdt de analyse puur financieel.

Alle parameters blijven privé in het browsertabblad. De eigen
TXT-samenvatting bevat beide scenario's, de financiële omslaggrens,
netto maandmarge en alleen na bewuste keuze de persoonlijke tijdweging.
Verversen/wissen maakt de eigen invoer ongedaan. Er worden geen
aanbiedingen, routes, externe OV-tarieven of werkgevergegevens opgehaald
of bijgehouden en `BOT_DRY_RUN=true` blijft intact.

### Inpakstatus per eigen meubel of verhuisdoos

In de bestaande **Verhuisvolume**-inventaris staat nu een aparte
**Inpakken bijhouden**-sectie. De gebruiker kan per itemregel zelf
vastleggen hoeveel stuks werkelijk zijn ingepakt: bijvoorbeeld
3 van 8 dozen, 0 van 1 tafel. Het totaal in eigen stuks, resterende
stuks, ingepakt percentage en het uit de **zelf ingevoerde
rechthoekige maten** benaderde ingepakte en nog openstaande volume
worden opgeteld. Er is een aparte knop om precies alle stuks
van één item te markeren, een eigen inpakstatus te wissen of
een gecontroleerd concept-TXT van itemnamen en aantallen te tonen.

De teller is zuiver **handmatig**, heeft geen enkele verbinding met
werkelijk verplaatste goederen, beladingsgewicht, voertuigpasvorm
of logistieke registratie. Onderdelen met gemengde maten moeten door
de gebruiker als aparte inventarisregels worden ingevuld. Als
het aantal van een item wordt gewijzigd, reset de ingepakte
teller van die regel om oude onmogelijke hoeveelheden te voorkomen.
Een definitief extern TXT-bestand verschijnt pas na
uitdrukkelijke controle en bevestiging.

**Privacy en compatibiliteit:** deze tijdelijk ingepakte aantallen
worden bewust **niet opgenomen in de bestaande versie-1
verhuisinventaris-JSON**. Die export blijft volledig terugleesbaar
en het expliciete terugzetten van een inventaris begint met lege
inpakmarkeringen. Een apart TXT-momentoverzicht is optioneel,
kan bij een opslagprovider terechtkomen en is geen herstelbestand.
Verversen/sluiten verwijdert de appvoortgang, en niets wordt
naar WoningNet, een ander account of een worker geüpload.


## Privacyselectief verhuisdossier (alleen je eigen invoer)

De gecombineerde verhuiswerkmap bevat nu ook **Maak een leesbaar verhuisdossier**.
Daarmee selecteer je expliciet welke van zes bestaande privémodules in een
leesbare TXT terechtkomen: planning, documentenstatus, sleutel-/meteropnamen,
eigen offertes, kostenboek en kostenverdeling. Planning en documenten zijn
voorgeselecteerd; onderdelen met naamlabels, geldbedragen en meterstanden
moet je bewust aanvinken.

- Het overzicht gebruikt uitsluitend de actuele, gevalideerde gegevens die
  de zes tabbladonderdelen al aan de werkmap doorgeven. Geen API, account,
  notificatie, serveropslag of automatische bestandsdownload.
- Per gekozen onderdeel verschijnen volledige eigen regels en de bijbehorende
  nog open acties. Onbekende werkelijke kosten worden niet als definitief
  totaal gepresenteerd. Datums zijn zelf ingevuld, geen officiële termijnen.
- Voordat de TXT wordt opgeslagen verschijnt de volledige inhoud als
  controleerbaar voorbeeld. De gebruiker bevestigt de download afzonderlijk.
  Verandert een bronmodule of de selectie, dan vervalt de oude bevestiging.
- Zelf ingevulde namen, notities, meterstanden en betaalbedragen kunnen
  privacygevoelig zijn. De browseropslaglocatie kan synchroniseren; delen
  gebeurt uitsluitend buiten de app en op eigen initiatief.

Deze functie bevestigt geen woningtoewijzing, getekend contract, geregistreerde
WoningNet-reactie, daadwerkelijke betaling of wettelijk geldige termijn.
Het bestaande `BOT_DRY_RUN=true`- en toestemmingsbeleid blijft ongewijzigd.


## Nieuwe zelfstandige privé-paklijst per kamer

Op het dashboard staat **Paklijst per kamer** met een directe navigatielink.
Je kunt maximaal 80 eigen regels toevoegen (maximaal 99 stuks per regel),
een kamer en eventueel een dooslabel kiezen en ieder item op **Nog inpakken**,
**Ingepakt** of **Uitgepakt** zetten. Wijzigingen en verwijderen blijven
handmatige acties. Het overzicht toont aantallen per kamer en een losse lijst
van spullen die je hebt aangemerkt als **eerst nodig**.

- De lijst is uitsluitend React-tabbladgeheugen: geen database, browseropslag,
  accountkoppeling, tracker of automatische synchronisatie.
- Je kunt de complete lijst na een exacte preview afzonderlijk als versie-1
  JSON bewaren, of een menselijk leesbare kamer- en statuspaklijst als TXT.
- JSON-import heeft een limiet van 32 KiB en een gesloten schema met strikte
  velden, datatypen, aantallen, ID's en toegestane kamers/statussen.
  Een import overschrijft pas na een afzonderlijke bevestiging de huidige
  (mogelijk onbewaarde) regels. Ongeldige import verandert niets.
- Verwijderen van één regel en wissen van de volledige lijst vragen expliciete
  bevestiging. Lokale exports worden niet automatisch bijgewerkt of gewist.

Deze hulpmiddelen zijn geen geverifieerde huisraad-/verzekeringsinventaris.
Voer liever geen adressen, toegangscodes of persoonsgegevens in labels in.
Opslag of delen via de door jou gekozen bestandslocatie kan buiten de app
synchroniseren. De WoningNet-, dry-run- en autorisatiegates blijven intact.


## Printbare offline dozenlabels uit eigen paklijst

In **Paklijst per kamer → Printbare eigen dozenlabels** groepeert Woonpoints
de eigen, nog niet uitgepakte pakregels per **kamer én dooscode** en maakt
na een afzonderlijke voorvertoning een lokaal afdrukbare A4-HTML. Op ieder
etiket staan een grote dooscode, kamernaam, aantallen en een eventuele
**Eerst nodig**-markering. Je kunt daarnaast expliciet kiezen om de zelf
ingevulde inhoud ook op de etiketten te printen; die staat standaard UIT.

- Zonder dooscode of bij status **Uitgepakt** wordt een regel niet op
  de etiketten gezet; het scherm toont hoeveel regels zonder dooscode
  zijn overgeslagen.
- Een dubbele dooscode in verschillende kamers geeft een waarschuwing.
  Kamer en dooscode blijven beide leesbaar om verwisseling te voorkomen.
- De volledige labels zijn vóór download zichtbaar. Verandert er iets aan
  de paklijst of inhoudskeuze, dan moet de preview opnieuw bevestigd worden.
- De download bevat alleen een statische, escaped HTML met lokale
  print-CSS en een beperkende CSP. Geen scripts, fonts, netwerk,
  locatiegegevens, klantaccount, automatische printeraansturing of upload.
  Open het bestand zelf en kies **Afdrukken** in je browser.

Ook printbare labels zijn persoonlijke notities en geen gecertificeerde
huisraadinventaris of adresbewijs. Deel het bestand niet onbedoeld.


## Verhuiswerkmap v3: alle zeven lokale modules samen herstellen

**Je verhuisoverzicht in één werkmap** neemt naast de bestaande zes
modules nu ook de zelfstandige **Paklijst per kamer** op. Dit levert
versie-3 JSON met strikt gevalideerde kamer-, doos-, status-,
aantal- en identiteitsvelden voor maximaal 80 eigen pakregels.

- De zeven actuele modules sturen uitsluitend tabbladinterne snapshots
  naar de werkmap. Export is één bewuste handeling na een zichtbaar
  overzicht van de totale inhoud. Het bestaande optionele leesbare
  verhuisdossier kan nu eveneens expliciet de eigen pakregels bevatten.
- Herstel van **v3** vervangt pas na expliciete bevestiging alle zeven
  onderdelen, inclusief onbewaarde pakregels.
- Een bestaande **v2**-werkmap herstelt alleen de eerdere zes modules;
  de huidige paklijst blijft onaangeroerd. Een bestaande **v1** herstelt
  alleen offertes, kostenboek en kostenverdeling: overige modules
  inclusief paklijst blijven onaangeroerd.
- Import is begrensd op 64 KiB, weigert vreemde velden, dubbele
  identiteiten en ongeldige inhoud. Ongeldige of geannuleerde import
  behoudt alle huidige gegevens. Geen live account, WoningNet-actie,
  database- of cloudopslag, automatische upload of externe betaling.
- Persoonlijke labels, aantekeningen, meterstanden, bedragen en
  zelf ingepakte spullen staan in gekozen exports. Controleer
  opslaglocatie en delen; sluiten van de browser zonder export wist
  niet-bewaarde privégegevens.

Woonpoints blijft uitsluitend een handmatig hulpmiddel. Er worden geen
officiële termijnen, rechten, woningtoewijzingen of betaalbewijzen
geclaimd. `BOT_DRY_RUN=true` en account-/toestemmingsgates blijven intact.


## Eigen laden en afleveren per doos (geen externe tracking)

De bestaande privé-**Paklijst per kamer** bevat nu een
**Verhuisrit: eigen laad- en afleveroverzicht**. Elke unieke combinatie
van eigen kamer en dooscode krijgt een afzonderlijke manuele status:
**nog laden → geladen → afgeleverd**, met de mogelijkheid om te
corrigeren naar **nog laden**. De knop voor laden werkt alleen wanneer
alle genoteerde artikelen in de doos zelf als ingepakt zijn gemarkeerd.
Een doos zonder code telt niet mee en krijgt een zichtbare waarschuwing.

- Voortgang per doos en totalen voor geladen, afgeleverd en nog niet
  geladen. Eigen prioriteitsdozen blijven duidelijk zichtbaar.
- Een losse, volledig te controleren TXT-transportlijst bevat alleen
  kamer, dooscode, aantallen en eigen status; eigen artikelomschrijvingen
  komen uitsluitend na het aanvinken van een afzonderlijke opt-in mee.
- Wijzigingen aan een pakregel (ook inpakstatus) verwijderen alle eerdere
  transportmarkeringen: nooit een achterhaalde persoonlijke 'afgeleverd'-
  status meenemen naar een andere inhoud.
- De zelfstandige privé-JSON-back-up is nu **versie 2** en bewaart
  pakregels én de geldige handmatige transportstatussen. Oude paklijst
  **versie 1** kan nog worden ingelezen, maar heeft geen transportstatus
  en maakt huidige laadmarkeringen leeg. Import vraagt een afzonderlijke
  bevestiging, beperkt het bestand tot 64 KiB en weigert onbekende velden,
  ongeldige statussen, dubbele dozen en ongerelateerde transportrecords.
- De reeds bestaande gecombineerde werkmap **versie 3** bevat vooralsnog
  de pakregels, maar nog niet deze nieuwe laadstatussen. Bij herstel van
  werkmap v3 worden laadstatussen veilig teruggezet naar onbekend;
  bewaar ze voorlopig via de zelfstandige paklijst-v2-JSON.

Niets in deze transportweergave is een echte vervoerdersscan,
afleverbewijs, WoningNet-bevestiging of verzekeringsinventaris.
Alles blijft uitsluitend in tijdelijk browsergeheugen totdat je
zelf bewust een bestand downloadt; geen netwerk of automatische opslag.

## Privé-verhuishulp plannen zonder iemand automatisch te benaderen

Het dashboard heeft nu **Wie helpt wanneer?** met maximaal twaalf zelf
ingevoerde helpers/afspraken. Gebruik een roepnaam, kies een taak
(inpakken, laden, vervoer, uitpakken of overig), eventueel een echte
datum plus begin- en eindtijd, een eigen korte taaknotitie en de
persoonlijk ingevulde status nog vragen / bevestigd / afgerond.

- Bewerk, filter, verander de eigen status en verwijder afspraken.
  Een datum met tijdvak is nodig voor het afronden van een afspraak.
  Er worden geen uitnodigingen of berichten verstuurd.
- **Bewaar privé-JSON…** toont eerst de volledige broninhoud. Import
  weigert vreemde sleutels, ongeldige kalenderdagen/tijden, dubbele ID's
  en meer dan twaalf afspraken. Een bestaande lijst wordt uitsluitend
  na expliciete, afzonderlijke bevestiging vervangen.
- **Mijn agenda (.ics)…** selecteert alleen bewust als bevestigd
  gemarkeerde afspraken met een ingevuld tijdvak; het afzonderlijke
  voorvertoningsscherm toont de te exporteren roepnamen, eigen notities
  en tijdvakken. De .ics bevat lokale zwevende kloktijden, geen
  automatische uitnodiging, e-mail, notificatie of API-aanroep.
- Alles blijft in de huidige browsertabsessie tenzij je zelf
  een bestand bewaart. Externe bestands-/agendaproviders kunnen door
  jou gekozen bestanden synchroniseren.

Dit zijn uitsluitend persoonlijke notities en geen officiële
toewijzingen, geverifieerde afspraken, werkgeversroosters of
WoningNet-acties. Vermijd telefoonnummers, adressen en gevoelige
persoonsgegevens in roepnaam of notitie. De bestaande dry-run-,
toestemmings- en productievoorwaarden blijven intact.


## Eigen verhuisdagdraaiboek en overlapwaarschuwing

In **Wie helpt wanneer?** toont Woonpoints nu ook een samengevoegd
**draaiboek per verhuisdag**. Dezelfde door jezelf ingevoerde afspraken
worden per datum en tijdvak weergegeven, met taak, alias en de door jou
zelf gemarkeerde status. Onbevestigde afspraken blijven expliciet
**Nog vragen**, niet stilzwijgend bevestigd.

- Als dezelfde **eigen alias** op dezelfde kalenderdag in overlappende
  tijdvakken staat en beide taken nog niet als afgerond zijn gemarkeerd,
  geeft het scherm een zichtbare overlapwaarschuwing. Dit is een
  handmatig planningssignaal, geen geverifieerde persoonherkenning
  en er wordt niets automatisch verwijderd of verplaatst.
- De knop **Bekijk eigen verhuisdagdraaiboek als TXT…** toont alle
  persoonlijke afspraken, ook die zonder datum, plus open
  bevestigingen, ontbrekende tijden en eventuele dubbele tijdvakken.
  Alleen na aparte bevestiging wordt het tekstbestand lokaal aangeboden.
- Eigen aliases, korte notities en tijdvakken blijven privé in
  het tabblad totdat je zelf exporteert. Een buiten de app gekozen
  opslaglocatie kan synchroniseren. Er zijn geen e-mails, apps,
  automatische uitnodigingen, WoningNet-acties of achtergrondjobs.

Dit is een persoonlijke planning voor eigen verhuishulp, geen
garantie op aanwezigheid, boeking, verzekering of voltooide verhuizing.


## Gecombineerde privé-verhuiswerkmap v5 · 8 onderdelen

**Je verhuisoverzicht in één werkmap** bewaart nu ook de losse
**Wie helpt wanneer?**-hulpplanning, inclusief maximaal twaalf eigen
aliases, taken, datums/tijden, persoonlijke statussen en korte notities.
Samen met de bestaande zeven modules en de zelfgenoteerde
laad-/aflevermarkeringen ontstaat versie-5 JSON.

- De acht formulieren publiceren alleen binnen hetzelfde browsertabblad
  tijdelijke snapshots. **Volledige v5-export** laat eerst de aantallen
  per onderdeel zien en biedt pas na een tweede klik één privé-JSON.
- **V5-herstel** valideert bekende sleutels, datums/tijden,
  rol/statuswaarden, dubbele IDs, eigen privacyregels en de gesloten
  status-/doosgrenzen van de paklijst. Het bestand blijft begrensd op
  64 KiB; zonder expliciete vervangingsbevestiging blijven alle
  huidige gegevens onaangeraakt.
- Herstel van een oude **v1, v2, v3 of v4** behoudt je huidige
  helpersinformatie. V1 vervangt alleen de oorspronkelijke drie
  modules; v2 alleen zes, v3 zeven inclusief paklijst zonder
  transportmarkeringen; v4 zeven inclusief transport. Alleen v5
  bevat de eigen hulpplanning als achtste module.
- De prioriteitsinbox laat nog onbevestigde of niet-ingeplande
  eigen hulp zien. Het optionele, volledig vooraf in te zien
  TXT-verhuisdossier kan apart **verhuishulp** meenemen,
  inclusief roepnamen, eigen tijdvakken, taken en opmerkingen.
  Deze privacygevoelige sectie staat standaard UIT.
- Er is geen automatische opslag, API-aanroep, uitnodiging,
  WoningNet-koppeling, vervoerdersscan of juridisch verifieerbare
  afspraak. Bestanden kunnen buiten Woonpoints via een door jou
  gekozen opslaglocatie synchroniseren.

Controleer zelf afspraken, woningrechten en betalingen bij de
betrokken organisaties/personen. De bestaande `BOT_DRY_RUN=true`-
en autorisatievoorwaarden blijven onaangeraakt.


## Privé-verhuisdag: één vertrek- en aankomstoverzicht

De gecombineerde eigen verhuiswerkmap v5 toont nu een **driefasenbord**
uit de actuele acht browser-only modules. Voor **voorbereiding** gebruikt
het de eigen verhuisdatum, documentenchecklist en vrijwillig ingevulde
helpers; voor **vertrek** de inpakstatus, ontbrekende dooslabels en
handmatig geladen dozen; en voor **aankomst** de eigen afleverstatus,
prioriteitsartikelen en reeds uitgepakte regels.

Elke regel onderscheidt expliciet **zelf nog na te kijken**,
**onbekende gegevens** en **eigen voortgang**. Bij twijfel worden lege
paklijsten/afspraken niet als daadwerkelijk afgerond gepresenteerd.
De gebruiker kan vanuit ieder punt rechtstreeks naar het betreffende
bestaande formulier springen om de bronstatus te veranderen.
Het bord verandert die bronstatus niet zelf.

**Bekijk mijn privé-verhuisdagoverzicht als TXT…** laat het volledige
bestand eerst zien en vraagt daarna een aparte bevestiging.
De samenvatting bevat uitsluitend geaggregeerde zelfgerapporteerde
statussen: geen helpersnamen, bedragen, straatadressen, privé-notities,
doosinhoud, betaalgegevens of WoningNet-provenance. Er wordt niets
opgeslagen of gedeeld zonder expliciete gebruikeractie. Een gekozen
lokale opslagmap kan buiten de app synchroniseren.

Dit bord is geen vertrektoestemming, leveranciers-/vervoerdersbewijs,
actuele inventarisverificatie of garantie dat alle officiële verhuisacties
zijn verricht. De acht-module JSON-back-up v5 en versiecompatibiliteit
blijven ongewijzigd; geen nieuwe account- of productieactie.


## Zelf adreswijzigingen en contracten bijhouden (geen echte melding)

De nieuwe dashboardsectie **Adreswijzigingen die jij nog wilt regelen**
bevat tien handmatige voorbeeldcategorieën: gemeente/BRP,
postdoorsturen, bank, werkgever, zorgverzekeraar, huisarts,
energie, internet, overige verzekeringen en abonnementen.
Dit is uitdrukkelijk geen volledige lijst met wettelijke verplichtingen.

- Markeer iedere categorie zelf als **Nog regelen**, **Zelf gemeld**
  of **Niet van toepassing**. Voeg maximaal twaalf eigen extra taken
  toe, noteer desgewenst een controledatum en een korte notitie.
  Open, zelfgekozen datums in het verleden verschijnen als aandachtspunt.
  Een status is nooit een officiële ontvangstbevestiging.
- Download alleen bewust de volledige **JSON-back-up** of een leesbare
  **TXT-checklist**, beide na exacte preview en tweede bevestiging.
  JSON-import accepteert uitsluitend de gesloten versie-1-indeling
  met oorspronkelijke tien voorbeeldcategorieën, unieke taak-ID's,
  echte datums, begrensde aantallen en waarden (maximaal 16 KiB).
  Import vervangt niets zonder afzonderlijke bevestiging.
- Een los optioneel **.ics-agendabestand** toont vooraf uitsluitend
  open zelfgedateerde taken (zonder privénotities), en verstuurt geen
  reminders of uitnodigingen.
- Geen echte adresinvoer nodig. Alle gegevens blijven in het tijdelijke
  browsergeheugen, tenzij je zelf een bestand opslaat. Een gekozen
  externe opslagdienst kan dat bestand later synchroniseren.
  Er is geen BRP-melding, bank-/poliswijziging, WoningNet-actie,
  leveranciersbericht of automatische betaling.

Controleer adresverplichtingen en deadlines bij de betreffende
instanties. De live account- en productieautorisatie blijven ongewijzigd.


## Samengevoegde privé-verhuiswerkmap v6 met adreswijzigingen

De bestaande gecombineerde **Je verhuisoverzicht in één werkmap**
heeft nu een optionele **negende lokale module**, de eigen
adreswijzigingen- en contractchecklist. De complete v6-JSON bevat de
vorige acht onderdelen plus de tien voorbeeldcategorieën en maximaal
twaalf eigen extra meldpunten, inclusief handmatig gekozen status,
controledatum en eventuele privénotitie.

- De dashboardwerkmap laat direct zien hoeveel van de eigen
  adrespunten nog open zijn. Open punten verschijnen in de bestaande
  prioriteitsinbox en, indien zelf gedateerd, in de bewust te
  downloaden agenda met privé-acties. Ieder punt linkt naar
  **Adreswijzigingen** voor bijwerken.
- Het privé-TXT-verhuisdossier kan adreswijzigingen als apart
  **standaard niet geselecteerd** onderdeel opnemen. Kies het bewust:
  je eigen taaknotities en datums kunnen gevoelig zijn.
- Compleet v6-JSON wordt alleen na preview en bevestiging aangeboden;
  herstel van een valide v6-JSON vervangt na een afzonderlijke
  bevestiging alle negen modules. Een v1-, v2-, v3-, v4- of
  v5-import **laat de nieuwere adreswijzigingen ongewijzigd**.
  De oudere importversies herstellen uitsluitend hun eigen
  historische modules. Het totale JSON-bestand is begrensd op
  64 KiB met strikte gesloten velden, echte datums, unieke taken en
  een limiet van twaalf extra eigen meldpunten.
- De afzonderlijke adreschecklist-v1-back-up blijft bruikbaar.
  Bij v6-herstel wordt de bestaande adresmodule alleen binnen het
  huidige tabblad bijgewerkt; er volgt geen externe melding, app-,
  bank-, BRP-, WoningNet-, verzekerings- of contractactie.
- Ook **v5-paklijstherstel** ondersteunt weer het werkelijk bewaren
  en terugzetten van eigen transportmarkeringen (bronfix #138).
  De gecombineerde v6 bewaart die dezelfde informatie.

Alle gegevens blijven in tabbladgeheugen tot een expliciete eigen
bestandsdownload. Een lokale/cloudmap die je zelf kiest kan buiten
de applicatie synchroniseren. Geen afvinkstatus geldt als officieel
bewijs van registratie, toestemming of afgesloten contract.


## Eigen startinspectie afdrukken — offline HTML en PDF

De bestaande begeleide startinspectie heeft nu een afdrukbare overdrachtsweergave.
Alle 22 standaardcontroles en maximaal 12 zelf toegevoegde punten worden per ruimte
gegroepeerd met het **eigen oordeel**, de eigen prioriteit en een expliciete
**niet gecontroleerd**-status. Een gedeeltelijke inspectie wordt dus nooit
stilzwijgend een complete keuring. Het A4-document is zelfstandig te openen
zonder Woonpoints-account, serververbinding of externe stylesheet.

1. Beoordeel minimaal één controlepunt in **Begeleide startinspectie**.
2. Kies desgewenst expliciet **Neem mijn privétoelichtingen op** (standaard uit).
3. Kies **Bekijk mijn afdrukvoorbeeld…**; controleer de telling en open desgewenst
   de volledige regels en optionele privénotities.
4. Download het HTML-document pas na afzonderlijke bevestiging. Open het bestand
   zelf in een browser en gebruik **Afdrukken → Bewaar als PDF** als je een PDF wilt.

Verandert de eigen inspectie of de privacykeuze na de voorbeeldweergave,
dan moet het voorbeeld opnieuw worden geopend voordat downloaden mogelijk is.
De export ontsmet alle handmatig ingevoerde titels en toelichtingen voor HTML,
heeft een restrictieve Content Security Policy, bevat geen scripts of externe
assets en weigert documenten groter dan 80 KiB.

Deze afdruk is **geen officiële keuring of bewijs van melding**, en er wordt
niets verstuurd naar een verhuurder, WoningNet of andere dienst. Door zelf
een bestand op te slaan, af te drukken of als PDF te bewaren kan privé-inhoud
buiten het huidige browsertabblad terechtkomen; een zelfgekozen opslagmap kan
met een clouddienst synchroniseren. De bestaande JSON-back-up, gecombineerde
overdracht en nazorgmodule blijven ongewijzigd. `BOT_DRY_RUN=true` blijft gelden.

### Inspectie in één klik filteren

Boven de ruimtechecklists staan drie knoppen: **Alle controles**,
**Nog niet gecontroleerd** en **Mijn aandachtspunten**. Elk toont het
aantal punten in die categorie. In de twee gerichte weergaven worden de
relevante ruimtes direct opengeklapt en lege ruimtes niet getoond. Zo
kun je niet-gecontroleerde controles afronden of je eigen gebreken snel
nalopen zonder door alle zes ruimtes te zoeken.

Dit zijn uitsluitend zichtfilters: ze veranderen nooit een beoordeling,
wissen geen toelichting en beperken ook niet de afzonderlijke volledige
JSON-, TXT- of HTML-export. Een leeg aandachtspuntenfilter is **geen**
officiële bevestiging dat de woning goedgekeurd is.
