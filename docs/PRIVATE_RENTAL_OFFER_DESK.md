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


## Wat-als: financiële verhuisbuffer en tegenvallers

Open binnen **Huurvoorstellen** de sectie **Wat als verhuizen duurder uitvalt?**.
Daar kun je onafhankelijk van de originele eigen huurvoorstellen zes persoonlijke
scenario-aannames invoeren: oude maandhuur, nul tot drie overlappende huurmaanden,
extra eenmalige verhuiskosten, extra maandelijkse energie/onvoorziene lasten,
optioneel beschikbaar startgeld en een eigen maandgrens.

Voor **ieder bestaand** huurvoorstel krijg je een vergelijkbare
- verwachte nieuwe maandlast: kale huur + service + eigen energie-inschatting
  + opgegeven tegenvaller per maand;
- vereiste startbuffer: eerste nieuwe maand + borg + originele eenmalige kosten
  + eerste maandelijkse tegenvaller + eigen verhuiskosten + oude huur × overlapmaanden;
- jaaruitgaven: twaalf nieuwe maanden + originele eenmalige kosten +
  twaalf maandelijkse tegenvallers + oude huur tijdens overlap + verhuiskosten;
- afzonderlijke verschillen met de vrijwillig ingevulde kasbuffer en maandgrens.

Het bestaande huurvoorstel, de contractchecklist en de JSON-back-up
worden **niet gewijzigd** door de wat-als-bedragen. Er wordt geen
persoonlijke inkomensinformatie gevraagd of afgeleid. De buffer na start toont
slechts startgeld minus berekende startbehoefte; hij is geen volledige
maandelijkse huishoudbegroting. De terugbetaalbaarheid van een borg is onzeker,
dus de borg wordt direct gereserveerd maar telt niet automatisch als
niet-terugvorderbare twaalfmaandslast.

De gebruiker kan een exact Nederlandstalig kostenoverzicht **vooraf bekijken**
en daarna afzonderlijk als privé-TXT downloaden. Bij wijzigingen aan scenario
of huurvoorstellen wordt een eerdere preview ongeldig. Geen upload, bericht
aan de verhuurder, woningreactie, cookie, opslag of achtergrondverwerking.
Een gekozen bestandsprovider kan bewust gedownloade bestanden wel synchroniseren.
Onjuist ingevulde bedragen (maximaal € 50.000 met twee decimalen) zorgen ervoor
dat berekeningen stoppen, in plaats van ongemerkt naar € 0 te worden afgerond.
Voor een realistische beslissing blijven belastingen, verzekering, indexaties,
woninggebreken en actuele contractvoorwaarden handmatig te controleren.


## Energie-maandraming uit dezelfde Woonpoints-pagina



## Gecontroleerde overdracht van eigen energieraming naar huurvoorstel

De energievergelijker biedt bij elke echt zelf ingevoerde tariefkaart nu
**Gebruik eigen maandraming voor huurvoorstel…**. Deze actie berekent uitsluitend
het *basis*-maandgemiddelde van de geselecteerde tariefkaart (niet de +10/+20%
gevoeligheidsvariant), met de huidige handmatig opgegeven kWh, m³,
tarieven en vaste leveringskosten. De gebruiker moet het bedrag eerst
afzonderlijk bevestigen; wijziging van de bronraming blokkeert een
verouderde preview. Een waarde boven de bestaande veilige
huurformuliergrens van € 50.000 kan niet worden overgedragen.

Na bevestiging scrollt Woonpoints naar de bestaande huurvoorstelvergelijker.
Daar verschijnt een **tweede expliciete keuze** met de oorspronkelijke
tariefnaam, het exacte eurobedrag en de **huidige** waarde van het tijdelijke
energie/internetveld. Alleen bij de tweede bevestiging wordt de
**nog niet opgeslagen** energiekostenraming in het huidige huurformulier gezet.
Bestaande kale huur, servicekosten, borg, startdatum, eigen vragen,
bestaande opgeslagen voorstelscenario's en WoningNet-data blijven
ongemoeid. Een lopend huurvoorstel wordt nooit automatisch ingediend of
opgeslagen. De gebruiker moet internet, water en onbekende contractkosten
zelf alsnog toevoegen en daarna het formulier afzonderlijk opslaan.

Deze overdracht passeert uitsluitend React-parentprops en callbacks
binnen dezelfde browserpagina; geen localStorage, database, backend,
netwerkrequest, energiecontract-API of nieuwe toestemmingsgate. De
bronprijs blijft **een persoonlijke schatting**, geen geverifieerde
leveranciersfactuur of verantwoord financieel advies. Een geannuleerde
overdracht behoudt de bestaande invoer exact.
