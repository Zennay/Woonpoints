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
   import of undo wordt het regiebord automatisch bijgewerkt.
4. Via **Privéstatus bekijken en zelf exporteren** kan de gebruiker exact de
   gegenereerde TXT inspecteren en daarna bewust downloaden. Het overzicht
   bevat alleen vaste onderdelen, aantallen, aandachtspunten en interne
   `#`-ankers; **geen persoonlijke acties, bedragen, contactnamen of adressen**.
5. Als een onderdeel nog niet geladen is, wordt geen onvolledig overzicht
   geëxporteerd. Als de teller vóór downloaden verandert, vervalt de preview.

## Gegevensveiligheid

- Geen netwerkaanroep, API-, SQLite- of serverwijziging.
- Geen localStorage, cookies of automatische browseropslag. Alle voortgang wordt
  alleen uit de reeds bestaande tabbladstatus van de broncomponenten gelezen.
- Geen externe meldingen, Agenda-import, betalingen of automatische acties.
- Eigen TXT-download is opt-in; externe synchronisatie van de downloadmap is
  een persoonlijke keuze.
- Geen wijzigingen in de zelfstandige privé-back-upformaten of herstel/undo
  van de afzonderlijke bronschermen.

## Techniek

Geïntegreerd in de bestaande gesloten productiebron
`src/app/page.tsx`. Vier componenten publiceren uitsluitend
`{done,total,attention,invalid}` via stabiele React-state callbacks;
het dashboard leest geen private detailwaarden. Toegevoegd aan de bestaande
anker-/zoeknavigatie. Geen nieuwe dependencies, CI-workflows of QA-bestanden.
