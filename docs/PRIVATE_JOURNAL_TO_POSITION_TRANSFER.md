# Veilig eigen reactiedagboek overdragen naar maandpositiehistorie

Het reactiedagboek biedt al zelf genoteerde eindposities aan de aparte maandgrafiek aan, maar **Gebruik in maandgrafiek** verving voorheen altijd alle reeds getypte maandeindposities. Dat kon bestaande, niet-geëxporteerde handmatige historie laten verdwijnen.

## Nieuw: toevoegen, vervangen of behouden

De bewoner krijgt nu een bewuste keuze wanneer hij vanuit het reactiedagboek geldige eigen eindposities aanbiedt:
- **Voeg eigen dagboekposities toe zonder huidige te wissen:** behoudt alle huidige zelf ingevoerde grafiekresultaten en voegt alle aangeboden notities toe.
- **Vervang grafiek bewust:** de vorige workflow, maar met één tijdelijk herstelpunt.
- **Behoud huidige maandgrafiek:** slaat de aanbieding af en laat alles ongewijzigd.

De UI vermeldt aantallen, de grens van maximaal 120 resultaten, 24 verschillende ingevulde maanden en 8192 tekens, en eventuele exacte overlappende datum/positie/totaal-regels. Identieke regels mogen twee verschillende woningen vertegenwoordigen; niets wordt stilzwijgend gededupliceerd. Zowel aanvullen als vervangen passeert eerst de bestaande volledige maandpositieparser. Een mislukte validatie wijzigt geen data.

Na een succesvolle keuze kan de vorige volledige grafiektekst **één keer** worden teruggezet zolang de gebruiker niet opnieuw wijzigt. De reactiedagboeknotities worden nooit gemuteerd door deze overdracht. Bij een nieuwe bewerking, statusverandering, verwijdering of CSV-herstel in het dagboek wordt een eerdere aangeboden snapshot automatisch ongeldig; de gebruiker moet de actuele eigen eindposities opnieuw aanbieden. Hiermee worden verouderde dagboekvoorstellen niet onterecht later toegepast.

Alles is privé en tijdelijk in het tabblad. Geen officiële WoningNet-verificatie, broncontrole van zoekpunten, nieuwe localStorage, server, runner, queue of automatische rekeninghandeling. Alleen op eigen verzoek gemaakte CSV-downloads kunnen bij een gekozen externe opslagprovider terechtkomen. BOT_DRY_RUN en de bestaande verplichte releasegates blijven onveranderd.
