# Privé vervolgacties over alle woningaanbiedingen

De bestaande Woningaanbodcheck bevat nu een aanvullend actiebord voor alle 1–5 eigen werkbladen. Zonder te wisselen kan de gebruiker open controles zien, zelf gemelde urgente signalen van onbekende/onbeantwoorde vragen onderscheiden, een vraag rechtstreeks openen en eerdere eigen nagelopen acties terugzien.

- Het bord gebruikt alleen de bestaande React-state van de werkmap en het bestaande signalenmodel. Geen server, browseropslag, netwerk, WoningNet, identiteitsgegevens of wijziging aan versiegebonden JSON.
- Antwoord nee produceert geen open actie; ja en onbekend bieden een afvinkbare eigen vervolgstap. Niet ingevuld blijft open tot de gebruiker zelf antwoord geeft. Nagekeken items zijn afzonderlijk zichtbaar te maken.
- Een afvinking voor een ander werkblad past de werkmap in-memory aan en invalideert incomplete bestandsimport, backup-preview en eenmalige undo. Een gewijzigd antwoord zet zijn afvinkstatus terug.
- Een vrijwillig, vooraf bekeken TXT-overzicht bevat uitsluitend open acties, de werkbladnummers en vaste algemene adviesteksten. Geen labels, adressen, huurprijzen, financiële momentopnames of documenten.
- Nagekeken betekent niet geverifieerd: bij urgente signalen is onafhankelijke controle nodig voordat iemand tekent, betaalt of gevoelige gegevens deelt.

Deze bronwijziging vereist de bestaande CI-, review-, merge- en releasevoorwaarden vóór live beschikbaarheid.