# Complete privé-overdracht: startinspectie én nazorg in één bestand

De bestaande Woonpoints-startinspectie en het nazorgdossier zijn twee op zichzelf staande gebruikersflows. Tot deze uitbreiding moest de bewoner daarvoor twee aparte JSON-bestanden opslaan en later los importeren. Op de bestaande dashboardpagina bij **Complete privé-overdrachtsback-up** kan nu één herbruikbaar, draagbaar JSON-bestand worden opgeslagen en hersteld.

## Gebruikersflow

1. Maak eigen beoordelingen in **Begeleide startinspectie** (22 standaardcontroles en maximaal 12 eigen punten), optionele notities en/of open nazorgpunten, zelf genoteerde contactmomenten en afspraken.
2. Klik bewust op **Download complete privé-JSON**. Woonpoints maakt één lokaal bestand `woonpoints-volledige-prive-overdracht.json`. Dat bundelt *alle* inspectiebeoordelingen, eigen inspectiepuntdefinities, nazorgpunten (inclusief afgeronde items) en contacthistorie. Niets wordt naar een server gestuurd.
3. Kies eventueel later **Open complete Woonpoints-back-up**. Er wordt maximaal 40 KiB gelezen. De import valideert strikt het exacte buitenste schema en beide **bestaande module-importcontracten**. Een fout in één onderdeel weigert de volledige import; de huidige sessie blijft ongewijzigd.
4. De app toont vóór de vervanging expliciet de aantallen van inspectie/beoordelingen/eigen controles en nazorgpunten/contactnotities in zowel **de nieuwe back-up als de huidige sessie**.
5. Kies **Ja, herstel beide onderdelen** om beide tijdelijke datasets in één gebruikershandeling te vervangen; kies **Annuleer import** om beide intact te laten. Na succesvolle vervanging worden oude edit- en verwijderdialogen, gegenereerde concepten en eerder gegeven lokale conceptgoedkeuringen ingetrokken. De inspectie-interface wordt opnieuw gemount zonder zijn oude dialogen.
6. De **aparte** inspectie- en nazorgimport blijven beschikbaar. Gebruik die wanneer slechts een deel van de sessie moet worden vervangen.

## Extra: gecontroleerde, leesbare TXT-samenvatting

Naast de complete JSON-back-up kan de bewoner een eigen, leesbare **TXT-voorvertoning** maken waarin de zelf beoordeelde en niet beoordeelde inspectiecontroles en de nazorgstatussen staan. Standaard bevat deze samenvatting **geen vrije privénotities of volledige contactteksten**: er staan alleen aantallen contactmomenten per nazorgpunt. De gebruiker kan de vrije toelichtingen apart aanvinken als die daadwerkelijk in het exportbestand moeten komen.

De app toont de **precieze uiteindelijke inhoud** eerst in een alleen-lezen tekstvak. Er is een aparte checkbox `Ik heb ... nagekeken` nodig vóór de TXT-download. Als inspectie, nazorg of de include-details-keuze verandert, komt de oude voorvertoning niet meer in aanmerking en moet de bewoner opnieuw kijken en goedkeuren. Na een volledige JSON-import wordt de vorige voorvertoning ingetrokken. Er wordt nooit automatisch gekopieerd, geüpload of gemaild; het bestand is een eigen samenvatting, geen juridische of technische verificatie.

## Bestandscontract

```json
{
  "kind": "woonpoints-private-complete-handover",
  "schema": 1,
  "inspection": {
    "kind": "woonpoints-private-startinspectie",
    "schema": 2,
    "custom": [],
    "records": []
  },
  "aftercare": {
    "kind": "woonpoints-private-nazorg",
    "schema": 2,
    "items": [],
    "history": []
  }
}
```

- Buitenste structuur: exacte vier velden, bekende kind-waarde, schema 1, maximaal **40 KiB** UTF-8.
- Inspectie: maximaal 16 KiB aan geserialiseerde bekende data, valide vaste en eigen IDs, maximaal 12 eigen controles, geen ongeldige beoordelingen of ontoelaatbare notities. De bestaande inspectie-schemas 1 én 2 zijn ook als geneste inhoud ondersteund.
- Nazorg: maximaal 16 KiB aan geserialiseerde bekende data, maximaal 80 punten, maximaal 160 contactnotities en 8 per punt, valide unieke IDs, statussen/datums en bekende schema 1 of 2. Bestaande importchecks en exact-field-contracten blijven leidend.
- JSON is **geen officieel bewijs**, geen versleutelde archivering en bevat privé door de gebruiker ingevulde teksten. Een geselecteerde externe bestandsprovider kan gegevens buiten Woonpoints synchroniseren. Kies daarom bewust waar je dit bestand bewaart en met wie je het deelt.
- Geen automatische localStorage, IndexedDB, cookie, netwerk, WoningNet-verzoek, contact met verhuurders, worker- of runnerbesturing. `BOT_DRY_RUN=true`, echte WoningNet-capability gates en verplichte CI/security-gates blijven intact.

## Bronintegratie

Alleen de bestaande, voor de productiecontainer expliciet toegelaten `src/app/page.tsx` is voor gedrag veranderd. De inspectie-editor gebruikt nu door de omliggende nazorgcomponent beheerde React-state; de reeds bestaande standalone export, import, remove en reset blijven dezelfde actuele data gebruiken. `readCompleteHandover` roept voor de twee geneste structuren de bestaande `parseInspectionBackup` en `readBackup` aan voordat een state-mutatie wordt toegestaan. De module toont geen toestemming voor live account- of betalingstoegang. Een GitHub-merge bewijst geen VPS-deploy.
