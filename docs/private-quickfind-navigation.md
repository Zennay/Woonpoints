# Woonpoints snelzoeken en privé-navigatie

De startpagina heeft tientallen losse privéhulpmiddelen. Met **Ctrl+K**
(of **⌘K** op macOS) spring je rechtstreeks naar de zoekbalk. Kies met
**↑ / ↓** tussen de zoekresultaten; de geselecteerde schermnaam wordt ook
voor schermlezers aangekondigd. Druk op **Enter** om meteen naar het
gekozen, bekende schermanker te gaan; ook deze sprong wordt in de
private ↗ Recent-lijst bijgehouden. Zoek naar
een schermnaam of praktische term: bijvoorbeeld `dozen`, `bonnetjes`,
`meteropname`, `woning kiezen` of `gebreken`. Accenten tellen niet
mee; de resultaten bestaan uitsluitend uit vooraf gedefinieerde
Woonpoints-schermankers. **Escape** leegt de zoekbalk.

## ↗ Recent

Een klik op een resultaat zet het onderdeel bovenaan **↗ Recent**.
Maximaal zes unieke bezochte schermen blijven daar in volgorde
beschikbaar. Met **Wis recente navigatie** kun je het overzicht direct
legen. De geschiedenis wordt niet in cookies, browseropslag, URL,
database, analytics of een API opgeslagen: vernieuwen of sluiten
van het tabblad wist deze tijdelijke React-state.

## ★ Vastgezet

Je kunt maximaal acht eigen snelkoppelingen bewaren. Open
**★ Vastgezet** en gebruik **↑** en **↓** om de volgorde te veranderen.
De knoppen worden aan het eerste en laatste onderdeel uitgeschakeld.
De volgorde is alleen een lijst van bekende anker-codes: geen
privé-invoer, WoningNet-accountdata of vrije zoektekst.

Bij schrijfweigering of onbekende bestaande opgeslagen voorkeurlijsten
blijft de nieuwe volgorde alleen in het huidige tabblad. Een onbekende
opgeslagen waarde wordt niet overschreven. De opslagstatus wordt onder
de navigatie getoond. Bewust wissen van alle favorieten blijft
een afzonderlijke gebruikersactie.

## Reikwijdte

Deze navigatie opent alleen bestaande onderdelen van de lokale pagina.
Zij heeft geen toegang tot WoningNet-accounts, reacties, woningen,
webservices, workers of de database en activeert geen automatisering.
De bestaande `BOT_DRY_RUN=true`- en menselijke autorisatievoorwaarden
blijven van kracht.

Dit is de gebruikershandleiding van de bronwijziging; niet het bewijs
dat de huidige productie-app is bijgewerkt.

## Bewaar of herstel je favorieten (JSON)

Onder de snelnavigatie kun je **Bekijk volledige favorieten-back-up** kiezen.
De pagina toont daarna precies de JSON die je eventueel zelf kunt downloaden.
De inhoud is beperkt tot `format: woonpoints-favorites`, `version: 1`
en ten hoogste acht vooraf bekende, unieke schermcodes in eigen volgorde.
Een aparte knop bevestigt de huidige inhoud en biedt het bestand pas
dan als download aan. Aanpassen of wissen van een favoriet maakt een
bestaande preview ongeldig.

Voor herstel selecteer je zelf een JSON-bestand van maximaal **1400 bytes**.
De app weigert onbekende velden, onjuiste versies, extra schermcodes,
dubbele onderdelen en te veel favorieten. Je ziet alle gevonden
schermnamen vóór **Vervang mijn favorieten**. Annuleren laat de huidige
lijst intact. Als die tijdens de preview verandert, moet je opnieuw
selecteren. Bij onbekende, gewijzigde of niet-schrijfbare browseropslag
wordt niets daar overschreven; de bewust gekozen import is dan alleen
in dit tabblad beschikbaar met een zichtbare waarschuwing.

Dit bestand is geen synchronisatie: geen upload naar Woonpoints en geen
automatische import uit een andere browser. Je eigen bestandsprovider
kan de bewust gedownloade kopie wel buiten Woonpoints bewaren.
