# Paklijst veilig herstellen · één terugzetmogelijkheid

Het zelfstandige Woonpoints-paklijstvenster bewaart zelf ingevulde kamerregels, aantallen, pakstatussen en eigen doosvervoer-markeringen uitsluitend in het tabblad. Een verkeerde privé-JSON-import kon vóór deze uitbreiding de complete tabbladlijst vervangen zonder directe undo.

## Nieuwe productflow

1. Kies een eigen paklijst JSON-v1 of v2 (maximaal 64 KiB). De bestaande strikte archiefparser moet het gekozen bestand accepteren voordat het herstelpaneel verschijnt.
2. Bekijk vóór bevestiging aantallen van **het huidige tabblad** en van **het gekozen bestand**, plus het effect op de laad-/aflevermarkeringen. Een oud v1-bestand wist transportmarkeringen; v2 herstelt alleen de eigen markeringen uit de bron.
3. Klik bewust op **Ja, vervang volledige paklijst en bewaar tijdelijk herstelpunt**. De eerdere items én de bijbehorende transportstatus worden uitsluitend in het tabblad-RAM bewaard.
4. Als het verkeerde bestand gekozen is, klik **Herstel vorige tabbladgegevens**. Dit herstelt beide onderdelen samen, zonder externe bestanden te veranderen. Het herstelpunt verdwijnt na gebruik.
5. Heeft de gebruiker na import een pakregel of transportstatus aangepast, dan blokkeert Woonpoints undo om de nieuwe invoer niet te overschrijven. **Verwerp herstelpunt** laat de huidige invoer bewust staan.

De bestandskeuze is gebonden aan de exacte huidige lijst én transportstatus. Wanneer de gebruiker na kiezen de bronstatus wijzigt, moet het bestand opnieuw gekozen worden. Bij meerdere snelle bestandskeuzes wint de nieuwste aanvraag; een werkmap-herstelactie trekt in behandeling zijnde oude zelfstandige importkeuzes in.

## Grenzen

- De bestaande verplichte parser, versiecontracten, limieten en transportidentiteit blijven leidend. Geen automatische backup, localStorage, server of upload.
- De terugzetstatus is één sessie-lokaal herstelpunt, geen onbeperkte audittrail en geen herstel van een browser die gesloten is.
- Zelf gemarkeerd als geladen/afgeleverd is geen bevestigd vervoerdersbewijs.
- Geen WoningNet-account, logingegevens, worker, privileged runtime, queue, production deploy of BOT_DRY_RUN-wijziging. Een geaccepteerde GitHub-PR bewijst geen live VPS-deployment.
