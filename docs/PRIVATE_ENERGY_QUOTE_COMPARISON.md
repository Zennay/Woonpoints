# Woonpoints · Eigen energietarieven vergelijken (zonder accountkoppeling)

Deze M1-functie is een **eigen rekenblad binnen Woonpoints**, niet een live energiemarktvergelijker en niet een overstapdienst.

## Gebruik

1. Open op de startpagina **Energietarieven vergelijken** (ook via zoeken en de bestaande navigatie).
2. Typ zelf jaarlijks stroomverbruik in kWh (0–50.000) en gasverbruik in m³ (0–10.000; nul voor gasloos). Minimaal één moet > 0 zijn.
3. Voeg maximaal vier eigen tarieven toe, met je eigen label, prijs per kWh, prijs per m³ en vaste maandkosten. Energie- en gasprijzen ondersteunen vier decimalen; er worden **geen** voorbeeldprijzen als echte leveranciersprijzen gepresenteerd.
4. De app rekent jaarlasten en een afgerond vergelijkingsbedrag per maand uit. Naast de basisschatting kies je optioneel 10% of 20% extra verbruik om te zien hoe het verschil tussen eigen aanbiedingen verandert.
5. Bewerk of verwijder een invoer; wissen van één tarief of alle tarieven vraagt expliciete bevestiging. Voor eigen bewaring open je eerst de volledige TXT-preview, waarna je afzonderlijk kunt downloaden.

**Formule:** kosten/jaar = afgeronde (jaar-kWh × prijs/kWh) + afgeronde (jaar-m³ × prijs/m³) + 12 × vaste maandkosten. Om eurocentprecisie te behouden worden variabele tarieven als geheel aantal tienduizendsten van een euro opgeslagen en per energiedrager pas bij de jaarberekening afgerond. Basisschatting per maand = jaarbedrag / 12, afgerond.

**Grenzen:** dynamische uurprijzen, netto teruglevering/salderen, niet-opgegeven energiebelasting, distributie/netbeheer, BTW-verschillen, kortingen, voorschotten, verhogingen, juridisch contractrecht en actuele leverancierstarieven zijn niet meegerekend. Een berekend goedkoper eigen tarief is **geen** bewijs dat het nu in Nederland leverbaar is of goedkoper zal zijn op een echt contract. Een huurder moet daarnaast internet en andere nutsvoorzieningen meenemen bij de bredere huurvoorstelvergelijking; bedragen worden niet automatisch in huurvoorstellen ingevuld.

## Privacy / veiligheidsgrens

- Alle eigen waarden leven alleen in React-tabgeheugen; geen cookies, localStorage, sessionStorage, API, accounts, analytics, background polling of energieprovidercontact.
- Een TXT-bestand komt alleen na twee bewuste handelingen tot stand (toon volledige preview → download) en kan bij een door de gebruiker gekozen cloudbestandsprovider worden gesynchroniseerd. Een wijziging aan offertes of invoer maakt een oude preview onbruikbaar.
- Er wordt niet automatisch een contract aangevraagd of afgesloten en er worden geen WoningNet-reacties of zCloud-workers gestart.
- UI staat volledig in bestaande, Docker-allowlisted `src/app/page.tsx`; responsive vormgeving uitsluitend in bestaande `src/app/globals.css`; bestaande CI, security-, privacy- en autorisatiegates zijn ongewijzigd.
