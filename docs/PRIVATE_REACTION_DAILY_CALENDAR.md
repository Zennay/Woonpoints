# Eigen reactiedagboek · interactieve dagkalender (geen officieel woningplatform)

De bestaande privé-reactienotities hadden een maandsamenvatting en een tekstuele maandfilter, maar **geen dag-tot-dag-overzicht of snelle selectie van een specifieke kalenderdatum**. De nieuwe functie vult de bestaande eigen reactieworkflow aan zonder accounts, automatische acties of opslag toe te voegen.

## Productgedrag
1. Open **Mijn dagelijkse reactieoverzicht** in het eigen reactiedagboek; kies de huidige maand of een eerder ingevulde maand.
2. Een kalender van 28–31 dagen toont per dag het aantal notities en de expliciet zelf gekozen status. Tik een dag aan om alléén de betreffende eigen notities hieronder te tonen of te bewerken.
3. De knop **Gebruik geselecteerde dag voor nieuwe notitie** vult uitsluitend het datumveld van het bestaande invoerformulier in. Er wordt niets toegevoegd voordat de gebruiker zelf op **Voeg eigen notitie toe** drukt. Bestaande andere notities blijven intact.
4. **Toon alle notities weer** herstelt de volledige lijst. Bij bewust vervangen, aanvullen of wissen van de dagboekregels wordt een oude dagselectie opgeruimd.
5. De gebruiker kan vrijwillig een eigen dagoverzicht als TXT bekijken en, na een afzonderlijk akkoord voor de exacte voorvertoning, downloaden. Het bevat uitsluitend kalenderdatums en **aantallen** per zelfgekozen status. Geen vrijetekstlabels, adressen, namen, eindposities, persoonsgegevens, oude response-provenance of officiële WoningNet-data.

## Telgrenzen en privacy
- Alleen expliciete status **Zelf gereageerd** met een eigen kalenderdatum **uiterlijk vandaag** telt in de eigen maandsom. Als iemand een toekomstige datum als gereageerd markeert, wordt die apart benoemd en niet naar de maandsom of het officiële 4/4-doel vertaald.
- Maandkeuze is beperkt tot huidige maand en de daadwerkelijk ingevulde maanden, geen externe bron of voorspelling.
- Het TXT-voorbeeld is gebonden aan een signature van de eigen invoer en maandkeuze. Bij wijzigingen wordt oude downloadtoestemming onbruikbaar en is nieuwe voorvertoning nodig.
- Browserstate is vluchtig, net als het bestaande reactiedagboek. Een door de gebruiker gekozen downloadlocatie kan bestanden buiten Woonpoints synchroniseren. Er worden geen notificaties, woningreacties, accountlogins of officiële claims uitgevoerd.
- Het bestaande M3 BOT_DRY_RUN, WoningNet-releasepoort, database en zCloud/VPS worden niet gewijzigd. Source-merge naar GitHub is geen bewijs van live deployment.

Implementatie: `src/app/position-stats.tsx`, inline in `ManualReactionJournal`, zonder nieuwe dependencies en zonder geschreven of handmatig gestarte QA-/regressie-/testsuites.
