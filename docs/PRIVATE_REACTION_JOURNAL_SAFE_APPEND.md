# Reactiedagboek veilig aanvullen uit bestaande eigen CSV

De privé-CSV-import voor het eigen Woonpoints-reactiedagboek bood eerder alleen **alle huidige notities vervangen**. Wie oude en nieuwe eigen bestanden wilde samenvoegen, kon daardoor bestaande invoer kwijtraken of moest zelf meerdere bestanden buiten Woonpoints bewerken.

## Nieuw: preview, aanvullen, vervangen en herstel

1. Kies een eerder bewaard Woonpoints-CSV-bestand (maximaal 12 KB). De bestaande importparser valideert datum, status, positie, aantal en het aantal rijen **vóór** een mutatie.
2. Bekijk hoeveel eigen regels in het huidige tabblad en in het gekozen bestand staan.
3. Als een nieuw bestand een reeds voorkomende combinatie van datum, status en positie/totaal bevat, toont Woonpoints een **waarschuwing**. Gelijke velden kunnen verschillende woningen zijn, dus er worden **geen** rijen stilzwijgend weggegooid.
4. Kies **Voeg CSV-notities toe zonder huidige te wissen**. Alle bestaande invoer blijft; geïmporteerde rijen krijgen nieuwe unieke tabblad-ID's. Het gecombineerde aantal mag niet meer dan 100 zijn. Als dat niet past, wordt alleen die aanvulactie geweigerd.
5. Of kies bewust **Vervang alle huidige notities**. Alleen deze expliciete vervangingskeuze mag oude rijen verwijderen. Een annulering verandert niets.
6. Direct na een aanvulling verschijnt **Herstel vorige tabbladnotities**. Dit ene herstelpunt bestaat alleen in het geheugen van het tabblad. Wanneer de gebruiker na aanvullen een notitie wijzigt, wordt terugdraaien geblokkeerd om nieuwe invoer te beschermen. De gebruiker kan het herstelpunt vrijwillig vernietigen.

De toestemming is gebonden aan de exacte tijdelijke oorspronkelijke dagboekinhoud. Als de gebruiker tijdens het kiezen van een bestand het dagboek wijzigt, wordt de oude import ongeldig. Bij snel opeenvolgende bestandskeuzes mag alleen de laatst aangevraagde importpreview verschijnen.

## Veiligheidsgrenzen

Alleen de bestaande **handmatig ingevoerde** reactiedata wordt gebruikt. Geen WoningNet-accounttoegang, automatische reacties, browseropslag, API, server, worker, database, credentials, notificatie of wijziging van `BOT_DRY_RUN`. Een privé-CSV die de gebruiker vrijwillig zelf downloadt kan via de gekozen bestandsprovider extern synchroniseren. Een geëxporteerde eigen reactie betekent niet dat een officiële WoningNet-reactie geldig of geregistreerd is.

De oude CSV-indeling blijft ongewijzigd; de vorige vervangingsflow blijft beschikbaar. Nieuwe of handmatig gestarte QA-, regressie- of testsuites zijn geen onderdeel van deze implementatie. Bestaande verplichte CI en review bepalen of de source-PR gemerged mag worden; GitHub-main bewijst geen VPS-deploy.
