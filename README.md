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
