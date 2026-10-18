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
