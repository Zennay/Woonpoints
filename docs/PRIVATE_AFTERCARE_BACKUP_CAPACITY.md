# Nazorg blijft altijd als eigen JSON exporteerbaar

In de nazorgmodule hebben aparte eigen JSON-back-ups een harde limiet van 16 KiB. Voorheen konden handmatige toevoegen/bewerken/statuswijzigingen meer tekst accepteren dan de eigen export later kon opslaan; ook compact ingelezen bestanden kunnen na pretty-print boven de grens uitkomen.

Nu controleert de app **vóór het opslaan** van ieder nieuw of bewerkt aandachtspunt de werkelijke omvang van het exact geëxporteerde JSON-v2-bestand (inclusief eigen contactgeschiedenis en whitespace van de leesbare export). Dezelfde grens geldt bij een statuswisseling. Als het dossier daardoor niet langer als 16-KiB-JSON exporteerbaar is, blijft de oude staat staan en krijgt de gebruiker een duidelijke melding; de conceptvelden blijven beschikbaar om zelf te verkorten.

Bij zowel de zelfstandige nazorgimport als de volledige inspectie+nazorgimport wordt het nazorgonderdeel vóór de herstelbevestiging ook op de **exacte opnieuw te exporteren grootte** gecontroleerd. Anders wordt alleen de voorgestelde import geweigerd; de bestaande sessie blijft staan. Bestaande schema-/structuur- en privacycontroles blijven gelden.

Het **Je eigen overzicht** toont de beschikbare ruimte in bytes en een percentage van de 16-KiB-grens. Vanaf 85% verschijnt een waarschuwing met advies over vrijwillige back-up, eigen verkorting of handmatige verwijdering. Er wordt **niets automatisch verwijderd, gesynchroniseerd of geüpload**. Dit verbetert uitsluitend de lokale gebruikerstoepassing: geen live WoningNet, accounts, service-restart, SQLite of runnerbesturing. Voor broncode-integratie gelden de bestaande GitHub checks; die zijn niet gelijk aan productie-deploy.
