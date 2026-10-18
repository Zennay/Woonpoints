# Woonpoints snelzoeken en privé-navigatie

De startpagina heeft tientallen losse privéhulpmiddelen. Met **Ctrl+K**
(of **⌘K** op macOS) spring je rechtstreeks naar de zoekbalk. Zoek naar
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
