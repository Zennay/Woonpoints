# Persoonlijke reactienotities corrigeren

Het handmatige Woonpoints-reactiedagboek houdt maximaal 100 eigen, ongeverifieerde
notities bij. Je kunt nu een foutieve datum, eigen status of optioneel
eindpositie/totaal **zonder verwijderen of opnieuw invoeren** aanpassen.

1. Kies bij de notitie **Bewerk datum en eindpositie**.
2. Corrigeer de datum, zelf genoteerde status en, indien relevant, zowel
   eindpositie als totaal. Laat beide positievelden leeg als er nog geen
   eindresultaat bekend is.
3. Met **Bewaar deze notitie** worden alle velden als één nieuwe, gecontroleerde
   versie van dezelfde notitie toegepast. Ongeldige datum of positie,
   een eenzijdig leeg positieveld of een fout totaal weigert de gehele
   wijziging. **Annuleer bewerken** behoudt de oorspronkelijke gegevens.
4. Na een geslaagde datumwijziging wordt de maandfilter op *Alle maanden*
   gezet, zodat de bijgewerkte notitie zichtbaar blijft. CSV-export en
   handmatige maandstatistieken gebruiken dan dezelfde gecorrigeerde
   bronnotitie; er ontstaat geen extra record.
5. Tijdens een openstaand CSV-herstelverzoek wordt bewerken uitgeschakeld.
   Het kiezen van een nieuw CSV-bestand sluit een onafgeronde bewerking
   zonder de huidige notities te wijzigen.

Er is geen WoningNet-accountkoppeling, bronverificatie, woningreactie of
automatische opslag: de hele lijst leeft uitsluitend in het tabbladgeheugen.
Bewaar zo nodig expliciet een privé-CSV. Officiële zoekpunten en maandreacties
worden hiermee niet bevestigd of gewijzigd. Er zijn geen rechten voor
een geautomatiseerde accountactie toegevoegd.

## Verwijderen, herstellen en bewust leegmaken

Bij **Verwijder (herstelbaar)** verdwijnt precies één eigen dagboeknotitie
uit het tabblad. De knop **Herstel laatste verwijderde notitie** zet dezelfde
notitie-ID, datum, status en eindpositie weer op de oude plek in de lijst.
Dit is alleen de *laatste* verwijdering; een volgende verwijdering vervangt
de hersteloptie, een nieuwe notitie of bevestigde CSV-import sluit die optie.
Het gaat nooit om een woningreactie op WoningNet.

**Wis alle eigen notities…** toont nu eerst een apart bevestigingsscherm
met het huidige aantal notities en de waarschuwing om desgewenst een
privé-CSV op te slaan. Alleen **Ja, wis echt alle notities** wist de lijst.
Annuleren laat alles staan. Iedere tussentijdse bewerking, nieuwe notitie,
andere status, CSV-keuze of individuele verwijdering sluit een oud
bevestigingsverzoek, zodat een later gewijzigde lijst niet onverwacht wordt
leeggemaakt. Voor bewust gewiste volledige lijsten bestaat geen
automatische back-up of undo.

Ook deze tijdelijke hersteloptie werkt uitsluitend in het open
browsertabblad; zij slaat nergens op, vraagt geen extra rechten en roept
geen netwerk-API aan.
