# Woonpoints · eigen voorlopige keuze-JSON apart en bewust herstellen

Het bestaande Woonpoints aanbodcheck-beslisblad blijft volledig lokaal, zonder adres, huurcontract, gebruikersidentiteit, rekeninggegevens of automatische woningactie. Om voorlopige menselijke keuzes na het sluiten van het tabblad te kunnen meenemen is er nu een **separate, versiegebonden privékeuze-JSON** (niet hetzelfde bestand als de bestaande veiligheidssignalenback-up).

1. Klik **Bekijk exacte privékeuze-JSON** om het volledige bestand eerst na te lopen. Download pas daarna bewust een eigen bestand; de gekozen opslaglocatie kan elders synchroniseren.
2. Op een volgende browsersessie zet de gebruiker eerst zijn afzonderlijke oorspronkelijke veiligheidswerkbladen terug. Daarna kan hij zelf zijn privékeuzebestand selecteren (maximaal 4 KiB). Het bestand wordt alleen lokaal in het tabblad gelezen.
3. De import vereist exact `kind: woonpoints-private-offer-decisions`, `version: 1`, één tot vijf verschillende bestaande veilige werkbladnummers en precies `id`, `stage`, `reason` in elk geval. Alleen bekende vaste keuze- en redencodes of `null` zijn toegestaan; `null`-keuze met reden wordt geweigerd. Elke huidige werkblad-ID moet aanwezig zijn, onbekende of dubbele velden worden geweigerd.
4. Een strikt canonieke JSON-representatie wordt geëist, zodat duplicate-key-/prototype-/alias-sluiproutes niet stilzwijgend worden genormaliseerd. Aanbodcheckvragen, urgentie, datum en financiële momentopnames zijn geen onderdeel van dit extra formaat.
5. Na inlezen toont het product uitsluitend de oorspronkelijke werkbladnummers en vaste labels. Alleen na de aparte bevestiging worden de **voorlopige keuze en algemene reden** van exact die werkbladen overschreven. Afwijzen of een ongeldig/te groot bestand laat de werkmap intact. Nieuwe bestandsselecties verwerpen oude nog lopende bestandsreads.

Dit is nadrukkelijk **geen** objectieve prijs-/fraude-/huurveiligheidstoets of cliënttoestemming. Er is geen API, server, synchronisatie, browseropslag of automatische WoningNet-reactie toegevoegd. Verplichte bestaande CI, security en owner/release checks blijven vereist; geen extra QA-/regressiesuites.
