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

### Automatisch intrekken bij bronwijziging

Wanneer na een aangeboden maandraming het stroom-/gasverbruik, de gekozen
gevoeligheid, een tarief, of de hele tariefset wordt gewijzigd of gewist,
trekt Woonpoints een nog **openstaand** voorstel in het huurformulier
meteen in. Een bevestigingspaneel met bedragen die inmiddels niet meer
bij de eigen bron horen blijft dan niet bestaan. De al eerder expliciet
ingevulde en opgeslagen huurvoorstellen blijven altijd onaangetast.
Bij een wijziging die alleen het **niet opgeslagen** editformulier van de
energievergelijker betreft, verandert de actuele berekening nog niet; pas
bij tariefopslaan wordt een pending handoff ingetrokken.
