# Persoonlijk maandrapport · uitsluitend eigen notities

Het bestaande maanddashboard combineert handmatige maandteller, eigen reactiedagboek en optionele persoonlijke zoekpuntenhistorie. Het nieuwe onderdeel **Mijn eigen maandrapport** maakt daarvan één leesbaar privé-TXT-overzicht.

## Gebruikersflow
1. Vul eigen maandteller, dagboek en eventueel zoekpuntenhistorie in. Geen WoningNet-accountkoppeling.
2. Zet **Voeg mijn zelf genoteerde puntenhistorie toe** alleen aan als die informatie bewust in het rapport mag verschijnen. Standaard UIT.
3. Maak een exacte actuele TXT-voorvertoning, lees alle velden, en vink afzonderlijk het akkoordvak aan.
4. Download pas dan het rapport. Sluiten of annuleren biedt geen bestand aan.

De TXT bevat maand/datum, eigen maandteller met opslagstatus, geaggregeerde dagboekstatussen, optionele laatste en eerdere eigen puntenstand, discrepanties en persoonlijke vervolgacties. Geen ruwe dagboekrijen, adres of accountgegevens. Een persoonlijke waarschuwing vanaf de 15e van de huidige maand vraagt alleen om eigen controle; het is **geen** pushbericht, juridische deadline of bronverificatie.

Het rapport is gekoppeld aan een snapshotvingerafdruk van de actuele geaggregeerde brondata, datum, maand en de privacykeuze. Zodra een bron, datum of gekozen broncategorie de feitelijke export verandert, vervalt oude goedkeuring automatisch. Bestaande originele invoer en import/export blijven onaangeraakt.

## Veiligheidsgrenzen
Een eigen 4/4 bewijst niet vier officieel geregistreerde geldige reacties. Handmatig genoteerde zoekpunten zijn geen geverifieerde toekenning. Het is een handmatig M4-voorproduct en **geen** gerealiseerde M1 WoningNet-read-only accountkoppeling.

Geen nieuwe API, cookie, localStorage, SQLite, worker, account-/portalhandeling, auto-export, melding aan derden of wijziging van BOT_DRY_RUN. Een gekozen externe bestandsprovider kan vrijwillig gedownloade TXT buiten Woonpoints synchroniseren. GitHub-source-integratie is niet hetzelfde als live deployment.
