# Eigen nazorg-acties en afspraaknotities

De **Mijn nazorg-acties**-inbox toont open aandachtspunten uit de bestaande privé-nazorgmodule. Er wordt niets van een verhuurder of WoningNet gelezen. De rangorde wordt opnieuw berekend uit de huidige tijdelijke browsertabbladgegevens:

1. Verstreken eigen streefdatum.
2. Door jezelf als gemeld gemarkeerd, zonder genoteerd eigen verzendmoment.
3. Zelf gemeld, minstens 14 dagen sinds je laatst zelf een bericht registreerde, zonder toekomstige eigen afspraaknotitie.
4. Zelf als dringend geprioriteerd, nog open.
5. Eigen streefdatum binnen zeven dagen.

De weergegeven datum, contactstatus en prioriteit zijn **uitsluitend de eigen administratie**; ze vormen geen bewijs, verzuimtermijn of juridisch advies. Met **Neem op in eigen concept** ga je naar de bestaande, bewust te bevestigen berichteneditor. Er wordt niets automatisch verzonden. De editor houdt zijn bestaande maximum van 12 punten en trekt oude goedkeuringen in na een wijziging.

**Wat staat er in mijn eigen agenda?** toont apart de toekomstige notities van type `afspraak` bij nog open punten. **Download eigen afspraaknotities als ICS** bevat uitsluitend datum en zelf ingevoerde titel/ruimte, zonder vrije contacttekst. Het zijn hele-dag eigen herinneringen, géén geverifieerde afspraken. De bestaande deadline-ICS blijft apart; er worden geen accounts, agenda's of derde partijen aangeroepen. Een zelfgekozen agenda-app kan het bestand opslaan of synchroniseren.

Deze schermen gebruiken de bestaande `items` en `history` React-state; import/undo en eerdere versie-1/2 back-ups volgen ongewijzigd hun eigen bestaande contracten. Sluiten van het tabblad wist de tijdelijke gegevens tenzij zelf een privé-back-up is gedownload. Geen credentials, browserextensie, worker, server/API, database, automatische opslag, productie-release of `BOT_DRY_RUN`-mutatie.
