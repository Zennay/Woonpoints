# Privé verhuisdag plan B

Woonpoints bevat onder **Verhuizen → Verhuisdag plan B** vier onafhankelijke noodscenario's:
vervoer valt uit, vertraagde sleuteloverdracht, slecht weer/onveilige toegang en
afwezige verhuishulp.

## Gebruik

1. Noteer per scenario een **zelfgekozen alternatief**, de **roepnaam of rol** van
   iemand die je zelf kunt benaderen en eventueel een persoonlijke controledatum.
2. Zet **zelf afgehandeld** pas aan wanneer jij het alternatief hebt opgepakt.
   Het scherm telt voorbereide plannen, afgeronde plannen en verstreken/open
   controledatums. Er komen geen automatische meldingen of externe acties.
3. Via **Privéoverzicht downloaden of herstellen** kun je het afdrukbare
   TXT-overzicht of een volledige JSON-back-up eerst exact controleren en
   daarna zelf downloaden. Als een open scenario een controledatum heeft, kun je
   optioneel ook een kalenderbestand (.ics) controleren en downloaden. Dit bevat
   uitsluitend de vaste vier scenariotitels en zelfgekozen datums, nooit eigen
   actieomschrijvingen of roepnamen; agenda-import gebeurt altijd handmatig.
4. Een eigen JSON-herstelbestand wordt begrensd tot 8 KiB en strikt
   gevalideerd op exacte vier scenario's, velden, datums en omvang.
   Bij import blijft je huidige plan behouden totdat je de vervanging zelf
   bevestigt. Je kunt het resultaat daarna eenmalig terugdraaien zolang je
   niets aanpast.
5. **Wis mijn plan-B-notities** vraagt apart bevestiging en wist uitsluitend
   dit onderdeel.

## Gegevens en beperkingen

- Niets wordt naar WoningNet, verhuurder, verzekeraar, gemeente of
  vervoerder gestuurd. Een opgeschreven alternatief is geen reservering.
- De vier scenario's blijven **alleen in het huidige browsertabblad** en
  verdwijnen bij herladen; er is geen automatische server-, cookie- of
  localStorage-opslag.
- TXT/JSON/ICS-export is altijd een bewuste actie. Afhankelijk van de
  gekozen downloadmap kan je eigen bestand extern worden gesynchroniseerd.
- Noteer geen telefoonnummers, adressen, bankgegevens, toegangs- of
  accountgegevens. Gebruik rollen of roepnamen.
- Datums zijn persoonlijke controledatums, geen officiële oplever- of
  contracttermijnen.
- De bestaande verhuisdagplanner, paklijst, meterstanden, leveranciersnotities
  en verhuiswerkmap blijven zelfstandige onderdelen. Plan B verandert hun
  status of back-upbestand niet.

## Implementatie

De component is ingebed in `src/app/page.tsx` omdat de productiecontainer
een gesloten allowlist van appbronbestanden heeft. De route is
`#private-moving-plan-b-heading`. Alle verwerking gebeurt in React state.
Er zijn geen nieuwe dependencies, API-routes, betaalproviders,
privileged workflows of automatische acties toegevoegd.
