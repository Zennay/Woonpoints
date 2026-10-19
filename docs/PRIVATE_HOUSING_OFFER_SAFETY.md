# Privé woningaanbodcheck

Sectie: `/#private-offer-safety-heading` binnen de bestaande Woonpoints-pagina, ook bereikbaar via de vaste navigatie.

## Eigen herstelbare werkmap — geen automatische opslag

- **Bekijk complete privé-JSON** toont de exacte versiegebonden werkmap voordat een
  eigen `.json`-bestand handmatig wordt gedownload. Het schema is
  `{ kind: "woonpoints-private-offer-safety", version: 1, cases: [...] }`.
- Per werkblad staan uitsluitend de automatisch toegekende numerieke ID,
  bekende vraag-ID's met `yes/no/unknown` en expliciet als nagelopen aangevinkte
  **relevante** vraag-ID's. Geen vrije tekst, adressen of verhuurder-identiteiten.
  TXT-export blijft een leesbaar verslag; JSON is de enige herstelbare vorm.
- Een zelfgekozen JSON-bestand van maximaal 10 KiB wordt vóór het overschrijven
  volledig gevalideerd op exact schema, versie, 1–5 unieke veilige werkblad-ID's,
  0–9 bekende vraag-ID's per map, toegestane antwoorden en uitsluitend geldige
  positieve follow-up-afvinkingen. Onbekende/prototype-velden en inconsistente
  afvinkingen worden geweigerd. De originele werkmap blijft onaangeraakt.
- Eerst verschijnt een gecontroleerd overzicht per werkblad. **Pas na een tweede
  expliciete herstelknop** vervangt de gebruiker de complete tabbladwerkmap.
  Daarna bestaat éénmalig **ongedaan maken**, zolang antwoorden, werkbladen of
  afvinkingen niet verder gewijzigd worden. Annuleren/wissen van een import
  verandert niets aan andere bronnen.
- Bestandslocatie kan extern synchroniseren; Woonpoints slaat niets automatisch
  op en leest alleen een lokaal door de gebruiker gekozen bestand. Geen netwerk,
  opslag, dienst of WoningNet-actie.

## Meerdere voorstellen als privéwerkbladen

- De aanbodcheck ondersteunt nu **1–5 onafhankelijke voorstellen** zonder vrijetekst-identiteit:
  uitsluitend automatisch toegekende werkbladnummers. Wisselen behoudt per
  werkblad eigen ja/nee/onbekend-antwoorden en per vraag eigen afvinkstatus.
- De overzichtstabel toont per werkblad **urgente gemelde signalen**, overige
  gemelde signalen, onbekend, onbeantwoord en eigen vervolgvoortgang.
  Het is nadrukkelijk geen objectieve rangorde of frauderisicoscore.
- Nieuwe voorstellen beginnen leeg. Eén gekozen werkblad verwijderen vraagt
  bevestiging en laat alle andere werkbladen ongewijzigd; het allerlaatste
  werkblad kan niet verwijderd worden. De bestaande reset wist uitsluitend
  het actieve werkblad.
- Een privé-TXT-download bevat standaard alleen het actieve werkblad. Via
  **Bekijk complete privévergelijking** kan de gebruiker eerst alle inhoud
  van 2–5 werkbladen controleren en pas daarna bewust één TXT downloaden.
  Er worden geen namen, adressen, telefoonnummers, documenten of URL's gevraagd.
- Alle werkbladen zijn uitsluitend vluchtig React-geheugen. Herladen sluit de
  hele vergelijking af zonder persistentie; downloaden kan extern synchroniseren.
- De data gaat niet naar de bestaande huurvoorstellenlijst en wijzigt nooit
  aangevinkte huurrechten, WoningNet-reacties of contractstatussen.

## Wat werkt

De gebruiker doorloopt negen concrete aandachtspunten in drie categorieën:
identiteit/kanaal, betaling/documenten en afspraak/overeenkomst. Ieder antwoord
is **ja**, **nee** of **weet ik niet**. Niet beantwoorde en onbekende punten
worden niet stilzwijgend als veilig beschouwd. Een urgent signaal toont eerst
een stop-en-verifieer-advies; alle andere gemelde punten geven afzonderlijk
uitvoerbare vervolgstappen. De resultaten zijn bewust **geen frauderisicoscore**
of oordeel over de rechtmatigheid van een woningaanbod.

Er is een transparant overzicht van ingevulde/ongekende/open
vragen, een afvinkbaar eigen vervolgplan (elk vinkje betekent alleen **zelf nagekeken**, geen verificatie) en een aparte eigen TXT-export:
voor elk risico/onbekend antwoord gaat ook de persoonlijke nagelopen-/open-status mee.
De status wordt direct gewist zodra het bijbehorende antwoord verandert; overige
acties blijven intact. Er komt geen automatisch betrouwbaarheidsstempel.

eerst volledige lokale preview, daarna expliciete download. TXT bevat alleen
vaste vragen, gekozen antwoordlabels en generieke tips — geen formuliertekst,
credentials, adressen, betaalgegevens, contracten, URL's of persoonsgegevens.
Wissen is expliciet en vraagt bevestiging.

De navigatielink wordt vanuit de bestaande root-layout getoond, zodat de tool
niet verstopt zit in een alleen via directe URL bereikbare subpagina.

## Privacy- en autorisatiegrenzen

- Uitsluitend vluchtige React-state in het huidige tabblad, zonder localStorage,
  sessionStorage, backend-API, analytics, verifieerservice of achtergrondtaken.
- Geen WoningNet/MijnDak-accountinteractie, login, geldtransactie, contract,
  upload, contact met verhuurders of externe verifier.
- Download is vrijwillig; een zelfgekozen bestandslocatie kan buiten Woonpoints
  synchroniseren. De gebruiker krijgt eerst inzage in de exacte inhoud.
- Ook de status “geen signalen door jou gemeld” is nadrukkelijk **geen bewijs**
  dat de afzender, woning of overeenkomst betrouwbaar of legaal is.
- Regels, prijzen, rechten en autoriteit van documenten worden bewust niet
  automatisch beoordeeld; deze tool geeft slechts algemene controlehandvatten.

## Vrijgeven

De change bestaat uit een nieuwe client-only sectie binnen het bestaande
reviewed `src/app/page.tsx`, één expliciete navigatielink en deze documentatie.
De exacte Docker COPY-allowlist blijft intact: geen nieuwe source roots of
credentialbestanden worden in de app/worker images opgenomen. Geen wijzigingen in worker, `BOT_DRY_RUN`,
database, credentials, WoningNet-actiepad, VPS of externe diensten.

Een broncommit is geen productiedeploy. Volg verplichte bestaande exacte
GitHub-head CI, review, branch protection en releasepaden. Voeg geen
extra QA-/regressiesuites toe.
