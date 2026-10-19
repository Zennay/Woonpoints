# Privé huurvoorstelvergelijker · M1

Zelfstandige handmatige huurvoorstelvergelijker binnen Woonpoints. Geen officiële woningtoewijzing, WoningNet-reactie, bevestiging bij verhuurder of directe koppeling.

## Gebruik

1. Startpagina → Huurvoorstellen, ook via bestaande zoek- en favorietennavigatie.
2. Tot vijf neutrale eigen labels, kale huur, servicekosten, geschatte energie/internet, borg, eenmalige kosten, verwachte ingangsdatum, status en open vragen toevoegen.
3. De rechterkolom rangschikt naar geschatte totale maandlasten; een optionele eigen budgetgrens geeft het verschil aan.
4. Open een voorstel, vink zes contract-/inspectiepunten zelf af, bewerk of verwijder na bevestiging.
5. Expliciete JSON-preview/download. Import: alle velden vooraf controleren, gebruikersbevestiging voor vervanging, éénmalige import-undo zolang de gegevens niet tussentijds wijzigen. Geen automatische uploads.

## Kosten

- Maandlasten = kale huur + servicekosten + eigen schatting energie/internet.
- Startgeld = eerste maandlasten + borg + overige eenmalige kosten.
- Eerste twaalf maanden = twaalf maal maandlasten + overige eenmalige kosten. Terugbetaalbare borg is apart en geen maandelijkse last.
- Geen dubbele huur, verhuiskosten, gemeentelijke lasten, verzekeringen, fiscaliteit, indexatie of echte rechtencheck. Controleer bronnen vóór besluit.

## Privacy

- Alleen React-geheugen van dit tabblad. Geen cookies, localStorage, sessie-opslag, database, backend, portaal-API, automatische export of WoningNet-contact.
- Bewuste download kan labels en persoonlijke vragen bevatten. Een bestandsprovider kan deze buiten Woonpoints synchroniseren.
- Import max. 16 KiB; exact JSON-schema woonpoints-prive-huurvoorstellen versie 1; max. vijf unieke voorstellen; geldige kalenderdatums, zes vaste vinkjescodes, begrensde invoer en veilige gehele eurocenten. Ongeldige import wijzigt niets.
- Budgetgrens wordt niet geëxporteerd. Sluiten van het tabblad wist alle notities tenzij de gebruiker bewust een bestand bewaart.

## Implementatie

De complete afgeschermde component staat in bestaande src/app/page.tsx met de gescopeerde rental- CSS-klassen in bestaande src/app/globals.css; opgenomen na de woningkeuze, met navigatieanker private-offer-desk-heading. Geen mutatie aan Prisma, worker, WoningNet, authenticatie, accountflow, QA-tests of workflows. Bestaande CI/review/releasegates blijven intact.
## Directe handoff vanuit de bestaande woningshortlist

Vanuit de eigen woningvergelijking biedt elke kandidaat nu **Gebruik voor een huurvoorstel**.
De knop draagt uitsluitend het reeds handmatig opgegeven neutrale woninglabel en de kale
maandhuur over aan de bestaande huurvoorstelvergelijker, **niet** de rest van de woning,
naam/adres, accountdata, status, service, energie, borg of startdatum.
De gebruiker ziet eerst een bevestiging en kan die annuleren zonder formuliermutatie.
Bevestigen vult uitsluitend de twee genoemde velden in een **nog niet opgeslagen**
nieuw formulier in. Bij een al bewerkt voorstel wordt dat formulier niet vervangen
zonder expliciete bevestiging. De gebruiker moet daarna onbekende kosten en andere
gegevens zelf invullen en apart **Voeg eigen voorstel toe** kiezen.
Bronvelden worden opnieuw gecontroleerd op geldig label en oorspronkelijke kale-huurrange.
De bestaande Woonpoints-snelkoppelingen voor kosten, verhuizing, bezichtiging en
planner blijven ongewijzigd. Handoff bestaat uitsluitend in React-geheugen van
dezelfde pagina; geen browserstorage, WoningNet-verzoek of gedeelde accountdata.

## Controleerbare gesprekssamenvatting (TXT)

Bij een gekozen huurvoorstel kan de gebruiker nu **Bekijk gespreksoverzicht als tekst**
openen: dit toont de **complete exacte tekst** met zelf opgegeven kale huur,
servicekosten, geschatte energie/internet, borg, overige startkosten, verwachte
ingangsdatum, status, eigen vragen en alle zes eigen afvinkbare contractpunten.
Berekeningen onderscheiden maandbedrag, startgeld inclusief borg en eerstejaarsbedrag
exclusief eventueel terugbetaalbare borg. Alle gegevens zijn handmatig en niet
geverifieerd; er wordt nooit een acceptatie, toewijzing of verhuurderbericht verstuurd.

De gebruiker kiest daarna afzonderlijk **Ja, download dit gecontroleerde TXT-bestand**
of **Annuleren**. Als de kandidaat intussen is gewijzigd, wordt de oude preview
geblokkeerd tot hij opnieuw wordt samengesteld. Tekst wordt beperkt tot 8 KiB en
wordt uitsluitend op expliciet verzoek lokaal als Blob aangeboden. Er wordt
geen backend, account, portaal, contactpersoon of automatische opslag gebruikt.
Zelfgekozen bestandsproviders kunnen de TXT buiten de browser synchroniseren.
