# Mobiel onderdeelmenu voor Woonpoints

De oorspronkelijke homepage had één lange lijst met meer dan 25 modulelinks. De nieuwe **Vind je onderdeel**-navigatie toont standaard alleen vier essentiële startonderdelen. Via de categorieknoppen kun je direct wisselen tussen Reacties, Woningen, Verhuizen en Inzichten; met **Alles** of **Toon alle onderdelen** zie je het volledige aanbod.

Het lokale zoekveld zoekt realtime in alle onderdeelkoppen (ongeacht de gekozen categorie) en geeft direct een zichtbaar resultaataantal. Als niets overeenkomt wordt dat duidelijk aangegeven en blijft de Alles-knop beschikbaar. De categorieknoppen tonen met `aria-pressed` welke categorie actief is, met voldoende grote bedieningsdoelen. Alle bestaande hash-links blijven intact; het nieuwe maandoverzicht en de bestaande nazorgmodule zijn expliciet vindbaar.

Er verandert niets aan WoningNet-/reactiegegevens, accountautoriteit, persoonsgegevens, routes, API's, modules of CSS-assets. Filter- en zoekstatus staan uitsluitend in de tijdelijke React-geheugenstatus van het huidige tabblad; er wordt niets naar een server verstuurd, bewaard of gemeten. Een live deployment vereist nog altijd de bestaande releasevoorwaarden.
