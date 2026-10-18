# Mijn privé-borgboek — eigen borg en gedeeltelijke terugbetalingen

Een nieuwe zelfstandige kaart **Mijn privé-borgboek** staat in de verhuisflow na de kostenverdeling en is bereikbaar via de **Verhuizen**-categorie van QuickFind. Ze gebruikt uitsluitend React-tabbladgeheugen; geen WoningNet-account, verhuurder, bank, browseropslag, server of API.

## Gebruiken

1. Voer de **oorspronkelijke borg** handmatig in (€ 0–€ 50.000, maximaal twee decimalen).
2. Voeg maximaal **24** gedateerde gebeurtenissen toe: een bedrag dat je *zelf als ontvangen hebt genoteerd*, of een *zelf genoteerde inhouding*. Schrijf een korte neutrale omschrijving, geen naam of adres.
3. Bekijk de totalen **zelf terugontvangen**, **zelf genoteerd ingehouden** en **nog niet verklaard**. Bij meer boekingen dan oorspronkelijk ingevulde borg komt een waarschuwing; dit blijft zichtbaar en wordt niet stilzwijgend op nul gezet.
4. Verwijder een fout ingevoerde regel bewust, of download **privé-JSON** of **TXT**. Beide bestaan alleen na een expliciete browseractie. De TXT is een *eigen* samenvatting, geen bewijs of juridische berekening.
5. Via **Herstel een eerder gedownload privé-borgboek** kies je vrijwillig een lokaal JSON-bestand (maximaal 12 KiB). Vóór vervanging staat de vorige én inkomende borg en het aantal regels op het scherm. Met **Ja, vervang mijn borgboek** bevestig je afzonderlijk. Annuleren en fouten behouden de huidige staat.

## Gegevenscontract

JSON is `{kind:"woonpoints-private-borgboek",schema:1,depositCents,entries:[{id,kind,date,label,amountCents}]}`. De parser controleert exacte velden, maximumaantallen, integer-eurocenten, bedragen, kalenderdatums, unieke gegenereerde event-ID's, neutrale omschrijvingen en geldige UTF-8. Onbekende velden en versies worden geweigerd. Zonder geldige huidige borg ontstaat geen importmutatie. Een vooraf beoordeelde import wordt ingetrokken wanneer de lokale bronstaat verandert.

Dit is **geen juridische borgsomvordering**, geen bewijs van een werkelijk betaalde/ingehouden som, geen analyse van toegestaan onderhoud en geen officiële eindafrekening. Er wordt niets gemeld, geïnd, geïmporteerd uit externe providers of gesynchroniseerd. Een zelf opgeslagen bestand kan buiten Woonpoints worden gesynchroniseerd; behandel het als privé.

## Integratie

De clientcomponent is in de bestaande Docker-allowlisted `src/app/page.tsx` geïntegreerd en onder `private-deposit-heading` toegevoegd aan QuickFind. Geen nieuwe Docker-COPY-bron of wildcard-toestemming nodig. De bestaande verhuismap, nazorg, inspectie, kostenboek, importcontracten en de `BOT_DRY_RUN`-grens zijn onveranderd. Bestaande verplichte CI en merge/release-autorisatie blijven vereist; de broncommit is geen bewijs van productie-deployment.
