# Privé woningaanbodcheck

Sectie: `/#private-offer-safety-heading` binnen de bestaande Woonpoints-pagina, ook bereikbaar via de vaste navigatie.

## Wat werkt

De gebruiker doorloopt negen concrete aandachtspunten in drie categorieën:
identiteit/kanaal, betaling/documenten en afspraak/overeenkomst. Ieder antwoord
is **ja**, **nee** of **weet ik niet**. Niet beantwoorde en onbekende punten
worden niet stilzwijgend als veilig beschouwd. Een urgent signaal toont eerst
een stop-en-verifieer-advies; alle andere gemelde punten geven afzonderlijk
uitvoerbare vervolgstappen. De resultaten zijn bewust **geen frauderisicoscore**
of oordeel over de rechtmatigheid van een woningaanbod.

Er is een openbaar, transparant overzicht van ingevulde/ongekende/open
vragen, een verzameld vervolgplan en een aparte eigen TXT-export:
eerst volledige lokale preview, daarna expliciete download. TXT bevat alleen
vaste vragen, gekozen antwoordlabels en generieke tips — geen formuliertekst,
credentials, adressen, betaalgegevens, contracten, URL's of persoonsgegevens.
Wissen is expliciet en vraagt bevestiging.

De navigatielink wordt vanuit de bestaande root-layout getoond, zodat de tool
niet verstopt zit in een alleen via directe URL bereikbare subpagina.

## Privacy- en autorisatiegrenzen

- Uitsluitend vluchtige React-state in het huidige tabblad, zonder localStorage,
  sessionStorage, backend-API, analytics, verifieerservice of achtergrondtaken.
- Geen WoningNet/MijnDak-accountinteractie, login, geldtransactie, contract,
  upload, contact met verhuurders of externe verifier.
- Download is vrijwillig; een zelfgekozen bestandslocatie kan buiten Woonpoints
  synchroniseren. De gebruiker krijgt eerst inzage in de exacte inhoud.
- Ook de status “geen signalen door jou gemeld” is nadrukkelijk **geen bewijs**
  dat de afzender, woning of overeenkomst betrouwbaar of legaal is.
- Regels, prijzen, rechten en autoriteit van documenten worden bewust niet
  automatisch beoordeeld; deze tool geeft slechts algemene controlehandvatten.

## Vrijgeven

De change bestaat uit een nieuwe client-only pagina, één expliciete
navigatielink en deze documentatie. Geen wijzigingen in worker, `BOT_DRY_RUN`,
database, credentials, WoningNet-actiepad, VPS of externe diensten.

Een broncommit is geen productiedeploy. Volg verplichte bestaande exacte
GitHub-head CI, review, branch protection en releasepaden. Voeg geen
extra QA-/regressiesuites toe.
