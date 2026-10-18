# Reactiedagboek → snelle positiestatistiek (uitsluitend eigen invoer)

## Productprobleem en oplossing

Het bestaande Woonpoints-reactiedagboek bewaart zelf genoteerde
`eindpositie/totaal`-waarden, terwijl het losse scherm **Posities
handmatig analyseren** die regels opnieuw vraagt. De maandgrafiek
heeft al een aparte bestaande dagboekoverdracht; die blijft ongewijzigd.

Met de nieuwe knop **Bied eindposities aan de snelle statistiek aan** kun je
uitsluitend de `positie/totaal`-paren uit de zichtbare maand-/dagselectie
naar het snelle statistiekscherm aanbieden. De twee originele modules
blijven zelfstandig: niets wordt achter de schermen ingevuld.

## Gebruik

1. Noteer in **Mijn reactiedagboek** uitsluitend je **eigen** handmatige
   eindpositie en totaal per reactie. Filter eventueel op maand of dag.
2. Gebruik de nieuwe knop wanneer de selectie 1–50 posities heeft.
   Bij meer dan 50 posities wordt overdracht geweigerd, zonder gegevens
   stilzwijgend af te kappen; filter eerst verder.
3. Het snelle positiescherm springt in beeld en toont een **voorstel**.
   Kies **vervangen** of **aanvullen**; het totaal blijft begrensd tot 50
   geldige regels en maximaal 4096 tekens.
4. Inspecteer de nieuwe voorbeeldstatistiek (gemiddelde, mediaan en gemiddeld
   positiepercentiel). De bestaande invoer verandert pas nadat je de
   aparte toestemmingscheckbox aanvinkt én op **Bevestig** klikt.
5. Je kunt direct de oorspronkelijke statistiektekst één keer terugzetten
   via **Maak laatste dagboekovername ongedaan**. Zodra je daarna handmatig
   verder wijzigt, vervalt die oude undo.

## Dataveiligheid en betrouwbaarheid

- Een lokale browsertabblad-gebeurtenis geeft **uitsluitend** positieve gehele
  `positie/totaal`-regels door, nooit datum, woning, tekstlabels,
  journal-IDs, WoningNet-gegevens of accountcredentials.
- Het ontvangende scherm controleert het aanbod onafhankelijk met de
  bestaande `summarizePositionPairs`-parser, inclusief grenswaarden en
  maximaal 50 paren. Een toevoeging wordt als één geheel gevalideerd.
- Geen netwerk-/API-calls, cookies, nieuw browsergeheugen, accountacties,
  uploads, notificaties of live WoningNet-reacties.
- Alle uitkomsten zijn **door de gebruiker zelf genoteerd en niet
  onafhankelijk geverifieerd**. Ze bewijzen geen geldige maandreacties,
  zoekpunten, eindpositie bij een echte aanbieder of toekomstige kans.
- De bestaande journal-CSV, maandgrafiek en zelfstandige statistiekbewerking
  blijven behouden. De functie schrijft geen QA- of testsuites.
