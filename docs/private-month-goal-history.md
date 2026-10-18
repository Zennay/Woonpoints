# Eigen maandtellerhistorie — alleen persoonlijke notities

Het bestaande Woonpoints-maanddoel is een losse, alleen door de gebruiker
bijgehouden huidige maandstand (0–4), **geen** officiële WoningNet-reactie of
zoekpuntenbewijs. Een aanvullend paneel **Bewaar zelf een historie van
maandtellerstanden** laat vanaf nu maximaal 36 eigen maanden vastleggen,
controleren en teruglezen, geheel in de geheugenstatus van het huidige
browsertabblad.

- Een maand kan uit de eigen herinnering worden ingevuld (JJJJ-MM, 0–4).
  De **actuele** zelf genoteerde stand mag ook bewust worden overgenomen
  via een expliciete knop; dat verandert de echte maandteller nooit.
- Als een gekozen maand al bestaat, verschijnt eerst een afzonderlijke
  **Ja, vervang deze historische maand**-bevestiging. Zonder plaats of
  bevestiging worden geen notities overschreven. Bij 36 unieke maanden
  is een nieuwe maand geblokkeerd tot een eerdere maand afzonderlijk
  en bewust wordt verwijderd.
- Het scherm toont de laatst **ingevulde** maand en het verschil met de
  voorgaande ingevulde maand. Ontbrekende kalendermaanden krijgen
  geen geschatte resultaten.
- **Bewaar mijn eigen maandhistorie als CSV** maakt na een bewuste klik
  een bestand met alleen `month,count`-regels. Het bestand is geen bewijs
  van een WoningNet-registratie.
- **Open eigen eerdere Woonpoints-maandstand of maandhistorie** accepteert
  CSV's van maximaal 2 KiB, exact bekende ASCII-kolommen, unieke
  kalendermaanden 2000..huidige maand en gehele tellerwaarden 0..4.
  Ook de eerder ingebouwde CSV-export van één actuele maandstand is
  leesbaar als één historienotitie. Een onjuist bestand verandert niets;
  geldig herstel vervangt de **hele aparte historie** uitsluitend na een
  tweede expliciete bevestiging. De actuele maandstand blijft intact.
- Verwijderen van één historische maand vereist een eigen tweede klik;
  er is geen stille bulk-wis-actie. Het archief is alleen in deze tab
  aanwezig totdat de gebruiker zelf een CSV uitkiest en bewaart.
  Een gekozen bestandsprovider kan buiten Woonpoints synchroniseren.

Er zijn geen accounts, adressen, wachtwoorden, backendverzoeken,
cookies, nieuwe browseropslag, automatische reminders, woonreacties
of accounttoestemmingen toegevoegd. Bestaande `BOT_DRY_RUN=true`,
beveiligings- en releasevoorwaarden blijven ongewijzigd.
