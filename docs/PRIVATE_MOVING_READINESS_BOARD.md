# Verhuisregie — één persoonlijk overzicht

De startpagina van Woonpoints toont onder **Mijn verhuisregie** actuele, lokaal
gecombineerde voortgang uit vier bestaande onderdelen. Dit is een **read-only
overzicht van zelf ingevoerde status**, geen accountkoppeling en geen officiële
voortgang of bevestiging van een externe organisatie.

## Wat wordt samengebracht?

| Bestaand onderdeel | Waarop het bord zich baseert |
| --- | --- |
| Mijn woonreis | Zelf afgevinkte stappen van de persoonlijke routekaart. |
| Verhuisdag plan B | Alternatieven waarbij zowel een eigen actie als een rol is ingevuld; open/verstreken controledatums en invoerwaarschuwingen. |
| Meterstanden | Aantal ingevulde, geldige waarden voor de op dat moment geselecteerde meters van oude en nieuwe woning; ongeldige invoer telt als aandacht. |
| Nutsvoorzieningen | Zelf als bevestigd of niet van toepassing gemarkeerde onderdelen; verstreken eigen datums en ongeldige invoer tellen als aandacht. |

Vier kaartjes linken rechtstreeks naar de **echte bewerkbare bron**. Het bord
verandert geen van die bronnen. Er zijn geen automatische vinkjes, claims over
organisaties, boekingen, accountdata of berichten naar derden.

## Werking

1. Open het dashboard en kijk onder **Mijn verhuisregie** welke onderdelen nog
   niet zijn afgehandeld. Alle vier betrokken broncomponenten publiceren een
   minimaal teloverzicht naar de bestaande startpagina via React props.
2. Onder **Nu zelf controleren** staan uitsluitend zelfgekozen verstreken
   controledatums en invoerwaarschuwingen.
3. Volg **Open en werk bij** om het echte brononderdeel te openen. Na wijzigingen,
   import of undo wordt het regiebord automatisch bijgewerkt. Alle vier
   gekoppelde onderdelen — woonreis, plan B, meterstanden en nutsvoorzieningen —
   bieden nu **afzonderlijke opt-in** voor tijdelijk tabbladherstel na herladen.
   Bij een geldige eigen sessiekopie verschijnt automatisch de herstelde
   voortgang in de bijbehorende regiekaart.
4. Het regiebord verzamelt de **open, zelfgekozen controledatums** uit de
   bestaande plan-B- en nutsvoorzieningsmodules, sorteert die op datum en
   toont verwijzingen naar de oorspronkelijke invoer. Afgeronde taken verdwijnen
   automatisch uit de open agenda.
5. Via **Privéstatus bekijken en zelf exporteren** controleer je vooraf de
   exacte TXT en optioneel één gecombineerde, handmatig te downloaden
   **ICS-agenda-export**. De TXT bevat alleen vaste onderdelen, aantallen en
   interne `#`-ankers. De ICS bevat uitsluitend zelfgekozen datums en vaste
   scenariotitels, dus **geen privéacties, bedragen, contactnamen of adressen**.
   Zonder open datums is de agendaknop uitgeschakeld.
6. Via **Privacy: tijdelijke tabbladherstelkopieën beheren** zie je hoeveel
   van de vier individuele herstelopties actief zijn in dit tabblad.
   Het scherm toont uitsluitend het aantal, nooit de privé-inhoud.
7. **Alle vier tabbladherstelopties uitschakelen…** vraagt een tweede
   afzonderlijke bevestiging. Daarna stopt iedere bronmodule nieuwe
   automatische sessie-opslag en worden uitsluitend de vier
   Woonpoints-herstelkopieën en toestemmingstags voor dit tabblad verwijderd.
   De geopende formulieren en lokaal gedownloade JSON-bestanden blijven intact.
   Als de browser opslagverwijdering weigert, verschijnt een waarschuwing.
8. Als een onderdeel nog niet geladen is, wordt geen onvolledig overzicht
   geëxporteerd. Als invoer vóór het downloaden verandert, vervalt de preview.

## Gegevensveiligheid

- Geen netwerkaanroep, API-, SQLite- of serverwijziging.
- Geen localStorage of cookies; het regiebord slaat zelf niets op. Het leest
  de bestaande tabbladstatus van broncomponenten. Elk van de vier bronmodules
  kan **na afzonderlijke expliciete toestemming** een niet-versleutelde,
  versiegebonden `sessionStorage`-kopie voor hetzelfde tabblad bewaren.
  Meterstanden en contract-/statusdatums zijn privé-informatie: vermijd
  gedeelde apparaten en maak desgewenst een eigen JSON-download.
  Het stoppen van bewaren verwijdert de bijbehorende tabbladkopie zonder de
  actieve invoer te wissen. De privacysectie in het regiebord kan **alle vier**
  keuzes in één handmatig bevestigde actie intrekken. Andere Woonpoints-modules
  en eventuele eerder gedownloade bestanden blijven onaangetast.
- Geen externe meldingen, agenda-import, betalingen of automatische acties.
- Agenda-export voldoet aan RFC 5545-regelvouw en geeft zelfgekozen, niet
  officieel gevalideerde dagafspraken; daadwerkelijk importeren blijft een
  handmatige keuze van de gebruiker.
- Eigen TXT-download is opt-in; externe synchronisatie van de downloadmap is
  een persoonlijke keuze.
- Geen wijzigingen in de zelfstandige privé-back-upformaten of herstel/undo
  van de afzonderlijke bronschermen.

## Techniek

Geïntegreerd in de bestaande gesloten productiebron
`src/app/page.tsx`. Vier componenten publiceren uitsluitend
`{done,total,attention,invalid,reminders?}` via stabiele React-state callbacks;
  `reminders` bevat alleen vaste scenario-ID/naam en zelfgekozen datum;
het dashboard leest geen private detailwaarden. Toegevoegd aan de bestaande
anker-/zoeknavigatie. Geen nieuwe dependencies, CI-workflows of QA-bestanden.

## Centrale privacy-intrekking

De vier module-hooks luisteren uitsluitend in dit tabblad naar een lokale
`woonpoints:private-tab-recovery-revoke:v1`-browsergebeurtenis. De knop
in het regiebord verstuurt deze gebeurtenis én probeert defensief de vier
bekende snapshot-/opt-in-sleutels te verwijderen. Iedere hook schakelt
tegelijk verder schrijven uit. Een afzonderlijke lokale statusgebeurtenis
werkt het getoonde aantal actieve herstelkopieën bij.

De actie heeft geen externe netwerk- of serverkant, raakt geen andere
`sessionStorage`-sleutels en wist geen open formulieren. Bij geweigerde
browseropslag wordt geen onterechte verwijderbevestiging geclaimd. De
bestaande individuele herstelfuncties en handmatige JSON-imports blijven
onveranderd.

## Eén gecombineerde privéback-up — vier echte bronmodules

Op **Mijn verhuisregie → Mijn vier verhuisdelen samen back-uppen of herstellen**
kun je nu één volledig privé-JSON downloaden en later weer terugzetten. Dit
vervangt niet de vier zelfstandige handmatige back-ups en is ook geen
account-/cloudsynchronisatie. De gezamenlijke back-up omvat uitsluitend:

- De woonreis: exact de zelf afgevinkte, bekende stapcodes.
- Verhuisdag plan B: vier eigen actie-/contactrol-/datumregels en vinkjes.
- Meterstanden: beide woningdelen en alle getoonde/verborgen meterkeuzes en
  waarden (zodat verborgen invoer niet onbedoeld verdwijnt).
- Nutsvoorzieningen: zes eigen status-/datumregels.

**Zo gebruik je dit:**

1. Wacht totdat de vier onderdelen zijn geladen. Bekijk met één klik de
   **exacte inhoud** van het volledige JSON-bestand (maximaal 32 KiB).
2. Bevestig dat je het gevoelige privébestand hebt bekeken en kies bewust een
   veilige locatie voor de optionele download. Het bestand bevat mogelijk
   meterstanden, roepnamen, privéacties en zelfgekozen datums. Bewaar het
   zelf; Woonpoints verstuurt niets naar een server of derde partij.
3. Kies later het eigen gecombineerde JSON-bestand om de vier schermen samen
   te herstellen. De volledige versie-, sleutel-, inhouds- en omvangscontrole
   vindt **vóór iedere wijziging** plaats. Een onvolledig, corrupt,
   niet-canoniek of te groot bestand wordt volledig geweigerd.
4. Het scherm toont welke vier onderdelen in het bestand staan. Je kiest zelf
   of je **alle vier** of juist één of meer specifieke onderdelen wilt
   vervangen; niet-geselecteerde formulieren blijven onveranderd. Het scherm
   vereist een afzonderlijke bevestiging en zonder geselecteerde onderdelen
   kan niet worden hersteld. De bestaande sessie-opslagkeuzes per module
   blijven ongewijzigd (standaard uit).
5. Meteen na herstellen kun je **de vorige tabbladstatus éénmalig
   terugzetten**, zolang de vier bronwaarden niet onafhankelijk zijn gewijzigd.
   Daarna blokkeert undo om nieuwe eigen invoer te beschermen.

De module gebruikt voor elk onderdeel diens **bestaande canonieke
JSON-hersteldecoder**, inclusief validatie van verborgen meterwaarden.
Voor het gelijktijdig vervangen meldt het centrale scherm uitsluitend de
**geselecteerde**, vooraf gevalideerde nieuwe snapshots via lokale
browsertabblad-events aan de bestaande React-componenten; zij verwerken die
uitsluitend na hernieuwde eigen decode-/groottecheck. Alle wijzigingen verschijnen onmiddellijk in
het bestaande verhuisregiebord, inclusief eigen controledatums en voortgang.

**Privacygrenzen:** er wordt niets automatisch opgeslagen,
geüpload, geïmporteerd vanuit WoningNet, betaald of naar leveranciers
doorgestuurd. De gecombineerde export en het herstel zijn handmatige acties.
De export bevat privé-invoer; lokale downloads kunnen vanuit een
door jou gekozen downloadmap extern gesynchroniseerd worden. Het eigen
`sessionStorage`-opt-in-model uit de eerdere PR's is ongewijzigd.
