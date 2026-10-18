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
6. Als een onderdeel nog niet geladen is, wordt geen onvolledig overzicht
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
  actieve invoer te wissen. Andere Woonpoints-modules blijven onaangetast.
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
