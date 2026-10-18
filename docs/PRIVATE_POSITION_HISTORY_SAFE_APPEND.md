# Eigen maandpositiehistorie veilig aanvullen vanuit privé-CSV

De bestaande Woonpoints-maandgrafiek had al een gecontroleerde CSV-import, maar een hersteld bestand **verving altijd de volledige getypte historie**. Bewoners die oude en nieuwe eigen posities wilden samenvoegen, konden daardoor notities in het tabblad verliezen.

## Nieuwe importopties

- Selecteer een bestaande eigen Woonpoints-CSV (maximaal 16 KiB). De ongewijzigde strikte importparser valideert inhoud en datums. De huidige tekst wordt nog niet gewijzigd.
- Vergelijk vóór bevestigen het aantal regels van de bron en de huidige tekst. Identieke datum/positie/totaal-regels worden gemeld als **mogelijke** overlap, nooit ongevraagd gededupliceerd: verschillende woningen kunnen dezelfde positie en datum delen.
- Kies **Voeg eigen CSV-posities toe** om de bestaande regels volledig te behouden, of **Vervang alle huidige posities bewust** om ze te vervangen.
- Aanvullen moet passen binnen maximaal 120 resultaten, 24 ingevulde maanden en 8192 tekens. De gecombineerde historie wordt eerst door de bestaande volledige domeinvalidatie geaccepteerd. Een ongeldige combinatie wordt volledig geweigerd.
- Na **beide** importopties kan de vorige complete tabbladtekst één keer worden hersteld zolang er na import geen wijzigingen zijn gedaan. Anders is undo geblokkeerd zodat latere invoer niet verdwijnt.
- Een geselecteerd CSV-bestand verliest zijn importtoestemming als de actuele tekst is veranderd, en een later gekozen bestand wint van een nog lezende eerdere selectie.

Dit hulpmiddel gebruikt uitsluitend de bestaande eigen tekst en CSV-bronnen. Geen derdepartijverklaring, officiële WoningNet-eindpositie, kansberekening of reactiehistorie; geen externe accountkoppeling, nieuwe localStorage, SQLite, worker of `BOT_DRY_RUN`-wijziging.

Het herstelpunt is tijdelijk en leeft alleen in RAM; een tabblad sluiten of verversen maakt het onbeschikbaar. Bewaren buiten het tabblad blijft uitsluitend een bewuste eigen CSV-export. De gekozen bestandsprovider kan een vrijwillig gedownloade CSV synchroniseren. Een GitHub-merge is geen bewijs van VPS-deployment.
