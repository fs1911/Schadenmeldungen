# Schadenmeldung – Anforderungsanalyse (Stand vor Freigabe)

Quelle: `Formular_Layout_02.10.2025.xlsx`, Tabelle1 (Tabelle2/3 leer).
Zellbezüge beziehen sich auf Tabelle1. Diese Datei enthält **keine** Implementierung.

Legende Excel-Formatierung (aus der Datei ausgelesen):

- Hellgelb (`FFFFCC`) = Eingabe-/Auswahlzelle (auch leere gelbe Zellen)
- Orange (`FFC000`) = «+» (weiterer Eintrag)
- Rot (`FF0000`) = Zeilen 129–131 (Block «Autorisation des Schadefalls»)
- Spalte A, Überschrift A1 «Pflichtfelder», enthält die Sternchen
- Kommentare (Autor: Salemi Adriano) an A74 und A113

---

## A. Abweichungen zwischen Beschreibung (Chat) und Tabelle1

| # | Stelle | Excel (Tabelle1) | Beschreibung | Art |
|---|--------|------------------|--------------|-----|
| A1 | A11 | `*` in der Zeile der Auswahl «Mitarbeiter / Externe Person / Unwetter / Unbekannt» | Kein Sternchen an der Schadenverursacher-Auswahl erwähnt | Fehlt in Beschreibung |
| A2 | Kommentar A74 | «Mindestens 1 Checkbox muss angewählt werden» (Was wurde beschädigt?) | Nicht erwähnt | Fehlt in Beschreibung |
| A3 | Kommentar A113 | «Mindestens 1 Checkbox muss angewählt werden» (Warum ist der Schaden entstanden?) | Nicht erwähnt | Fehlt in Beschreibung |
| A4 | Bereichstitel | Excel hat nur diese fetten Überschriften: Schadenverursacher, Geschädigter, Schadenort, «Waren Fahrzeuge …?», Schadendetails, «Was wurde beschädigt?», «Wer war dabei?», «Wie ist der Schaden passiert?», «Was ist kaputt / gestohlen?», «Fotos (obligatorisch)», «Schadensumme schätzen», «Warum ist der Schaden entstanden?», «Wie hätte …?», «Autorisation des Schadefalls», «Fragen?», B146 | Beschreibung führt nummerierte Titel ein, die nicht im Excel stehen: «Allgemeine Angaben», «Fahrzeuge / Geräte / Maschinen», «Polizeirapport / Anzeige», «Externes Fahrzeug», «Fotos und Unterlagen», «Schadensumme», «Schadenursache», «Verhinderung des Schadens», «Abschlussangaben», «Kontakt», «Bestätigung nach dem Absenden» | Zusatz in Beschreibung |
| A5 | B87/B89 | «Wer war dabei?» ist eine fette Überschrift **ohne** eigene Eingabezelle; darunter «Bemerkung:» mit Freitext | «Wer war dabei?» als eigener Listenpunkt | Interpretationsunterschied |
| A6 | A129–C131 | Block rot hinterlegt | Rote Markierung nicht erwähnt | Fehlt in Beschreibung |
| A7 | C115–C121 | Leere gelbe Auswahlzellen (kein «X» eingetragen) | «Auswahlmöglichkeiten» | Nur Hinweis, inhaltlich gleich |
| A8 | B110/C110 | «Schadensumme schätzen» (Überschrift) + gelbe Zelle mit Inhalt «CHF» = ein Eingabefeld | Zwei Listenpunkte «Schadensumme schätzen» und «CHF» | Interpretationsunterschied |
| A9 | C131 | «Bauführer / Disponent» hat eine gelbe Eingabezelle | «Vorgesehenes Feld» | Übereinstimmend (bestätigt) |

Übereinstimmend geprüft (wortgleich): alle Feldbezeichnungen inkl. Schreibweisen «Verantwotlicher», «Schadefalls», «automatisches Bestätigungsnachricht», Hinweis Personenschaden, Hinweis Inventarnummer, Kontaktangaben, Bestätigungstext (B148).

---

## B. 1:1-Feldliste

Typ-Angaben geben nur wieder, was die Vorlage zeigt («X» = Auswahl, «+» = weiterer Eintrag, «^ (Fotomöglichkeit)» = Upload mit Foto, «Freies Textfeld», gelbe Zelle = Eingabe). Nicht eindeutige Typen sind mit Verweis auf Teil C markiert.

| Nr. | Zelle | Bezeichnung (wörtlich) | Element laut Vorlage | Auswahlmöglichkeiten | Pflicht (*) | Hinweis / Bemerkung |
|-----|-------|------------------------|----------------------|----------------------|-------------|---------------------|
| 0.1 | A1 | Pflichtfelder | Spaltenüberschrift der Sternchen-Spalte | – | – | Darstellung offen (C17) |
| 0.2 | B1 | **Schadenmeldung** | Titel | – | – | – |
| 0.3 | G1 | LOGO | Platzhalter Kopfbereich | – | – | Logo-Datei offen (C16) |
| 1 | B3/C3 | Datum / Uhrzeit: | Eingabe | – | nein | Format offen (C10) |
| 2 | B5/C5 | Wetter / Temperatur: | Eingabe | – | nein | – |
| 3 | B9 | **Schadenverursacher** | Überschrift | – | – | – |
| 4 | B11–L11 | (Auswahl) | X je Option | Mitarbeiter · Externe Person · Unwetter / höhere Gewalt · Unbekannt | **ja (A11)** | Einfach-/Mehrfachauswahl offen (C1) |
| 4.1 | B14/C14 | Personal Nummer: | Eingabe (Spalte «Mitarbeiter») | – | **ja (A14)** | Bedingung offen (C2) |
| 4.2 | B16/C16 | Name / Vorname: | Eingabe (Spalte «Mitarbeiter») | – | nein | – |
| 4.3 | B18/C18 | Vorgesetzter: | Eingabe (Spalte «Mitarbeiter») | – | nein | – |
| 4.4 | E14/F14 | Name / Vorname: | Eingabe (Spalte «Externe Person») | – | **ja (D14)** | Bedingung offen (C2) |
| 4.5 | E16/F16 | Adresse: | Eingabe (Spalte «Externe Person») | – | nein | – |
| 4.6 | E18/F18 | Telefonnummer: | Eingabe (Spalte «Externe Person») | – | nein | – |
| 4.7 | E20/F20 | Emailadresse: | Eingabe (Spalte «Externe Person») | – | nein | – |
| 4.8 | H14/I14 | Bemerkung: | Freies Textfeld (Spalte «Unwetter / höhere Gewalt») | – | nein | – |
| 4.9 | K14/L14 | Bemerkung: | Freies Textfeld (Spalte «Unbekannt») | – | nein | – |
| 5 | B24 | **Geschädigter** | Überschrift | – | – | – |
| 5.1 | B26/C26 | Schaden an Eigentum von externer Person? | X (einzelne Auswahl) | nicht angegeben | nein | Ja/Nein vs. Checkbox offen (C3) |
| 5.2 | B28/C28 | Name / Vorname: | Eingabe | – | nein | – |
| 5.3 | B30/C30 | Adresse: | Eingabe | – | nein | – |
| 5.4 | B32/C32 | Telefonnummer: | Eingabe | – | nein | – |
| 5.5 | B34/C34 | Emailadresse: | Eingabe | – | nein | – |
| 6 | B38 | **Schadenort** | Überschrift | – | – | – |
| 6.1 | B40/C40 | Baustellennummer: | Eingabe | – | nein | – |
| 6.2 | B42/C42 | Adresse: (Strasse & Nr.) | Eingabe | – | nein | – |
| 6.3 | B44/C44 | Verantwotlicher Baustelle / Bauführer: | Eingabe | – | nein | Schreibweise lt. Vorlage (C15) |
| 7 | B48 | **Waren Fahrzeuge / Geräte / Maschinen beim Schadenfall dabei? Wenn ja, welche?** | Überschrift/Frage | – | – | – |
| 7.1 | B50/C50 | Inventar Bezeichnung (Typ): | Eingabe | – | nein | – |
| 7.2 | B52/C52 | Inventar Nummer / Mietnummer: | Eingabe | – | nein | – |
| 7.3 | B54/C54 | Kontrollschild: | Eingabe | – | nein | – |
| 7.4 | B56/C56 | Weiteres Inventar | + | – | nein | Umfang offen (C4) |
| 8.1 | B59/C59 | Polizeirapport / Anzeige vorhanden? | X (einzelne Auswahl) | nicht angegeben | nein | (C3) |
| 8.2 | B61/C61 | Polizeirapport / Anzeige hochladen: | ^ (Fotomöglichkeit) | – | nein | Dateiregeln offen (C5) |
| 8.3 | B63/C63 | Bemerkung: | Freies Textfeld | – | nein | – |
| 9.1 | B66/C66 | Externes Fahrzeug betroffen? | X (einzelne Auswahl) | nicht angegeben | nein | (C3) |
| 9.2 | B68/C68 | Unfallprotokoll hochladen: | ^ (Fotomöglichkeit) | – | nein | (C5) |
| 10 | B72 | **Schadendetails** | Überschrift | – | – | – |
| 10.1 | B74 | **Was wurde beschädigt?** | Matrix X, Spalten «Intern» / «Extern» | Fahrzeuge (Intern X / Extern X) · Maschinen (X / X) · Personen ([X]* / X) · Sonstiges (X / X) | **ja (A74)** | Kommentar A74: «Mindestens 1 Checkbox muss angewählt werden» |
| 10.2 | B84 | * Bei Personenschaden an Mitarbeitern bitte Formular "Internes Unfallprotokoll" der Personalabteilung ausfüllen | Hinweistext | – | – | Bezug: Personen/Intern «[X]*» |
| 10.3 | B87 | **Wer war dabei?** | Überschrift | – | – | – |
| 10.4 | B89/C89 | Bemerkung: | Freies Textfeld | – | nein | – |
| 10.5 | B92 | **Wie ist der Schaden passiert?** | Überschrift | – | – | – |
| 10.6 | B94/C94 | Beschrieb: | Freies Textfeld | – | **ja (A94)** | – |
| 10.7 | B97 | **Was ist kaputt / gestohlen?** | Überschrift | – | **ja (A97)** | – |
| 10.8 | B98 | Inventarnummer mit angeben z.B. "Stossstange und Scheinwerfer von Inv. 1841 ist kaputt / Lackierung von Bagger Inv. 2413 ist verkratzt" | Hinweistext | – | – | – |
| 10.9 | B100/C100 | Beschrieb: | Freies Textfeld | – | (über A97) | – |
| 11 | B103 | **Fotos (obligatorisch)** | Überschrift | – | **ja (A103)** | – |
| 11.1 | B104 | Pläne / Skizzen / Offerten / Rechnungen usw. falls vorhanden | Hinweistext | – | – | – |
| 11.2 | B105/C105 | Foto hochladen | ^ (Fotomöglichkeit) | – | (über A103) | (C5) |
| 11.3 | B107/C107 | Weitere Fotos | + | – | nein | (C4) |
| 12 | B110/C110 | **Schadensumme schätzen** | Eingabe mit «CHF» | – | nein | Format offen (C10) |
| 13 | B113 | **Warum ist der Schaden entstanden?** | Auswahl (leere gelbe Zellen C115–C121) | Unachtsamkeit · Nicht wissen · Fehlerhafte Pläne · Grobfahrlässigkeit | **ja (A113)** | Kommentar A113: «Mindestens 1 Checkbox muss angewählt werden» |
| 13.1 | D119 | Wenn "X" - Automatische Nachricht wird an Bauführer / Disponent ausgelöst - Pläne an schaden@tozzo.ch zuzustellen | Funktionshinweis zu «Fehlerhafte Pläne» | – | – | Umsetzung offen (C6) |
| 14 | B124 | **Wie hätte der Schaden verhindert werden können?** | Überschrift | – | **ja (A124)** | – |
| 14.1 | B126/C126 | Beschrieb: | Freies Textfeld | – | (über A124) | – |
| 15 | B129 | **Autorisation des Schadefalls** | Überschrift (rot) | – | **ja (A129, rot)** | – |
| 15.1 | C129 | Zumutbar, dass der Schadenersteller den Bauführernamen / Disponentenname bestimmen kann? | Offene Frage (Arbeitsnotiz) | – | – | Anzeige in App offen (C7) |
| 15.2 | B131/C131 | Bauführer / Disponent | Eingabe (Bezeichnung rot) | – | (über A129) | (C7) |
| 16.1 | B134/C134 | Erfassungsdatum: | Eingabe, Vorgabe «TT.MM.JJJJ» | – | **ja (A134)** | Automatisch/manuell offen (C8) |
| 16.2 | B136/C136 | Verfasser: | Eingabe, Vorgabe «Username» | – | **ja (A136)** | Herkunft Username offen (C9) |
| 17 | B139 | **Fragen?** | Überschrift | – | – | – |
| 17.1 | B140 | Telefon: +41 61 935 93 93 | Kontakttext | – | – | – |
| 17.2 | B141 | E-Mail: schaden@tozzo.ch | Kontakttext | – | – | – |
| 18 | B146 | **Nach dem Absenden wird automatisches Bestätigungsnachricht ausgelöst / selbstlöschend** | Funktionshinweis | – | – | «selbstlöschend» offen (C11) |
| 18.1 | B148 | Deine Schadenmeldung wurde erhalten! ⏎⏎ Deine Meldung wurde an die zuständige Stelle weitergeleitet und wird intern bearbeitet. ⏎⏎ Mit deiner Aufmerksamkeit und deinem Handeln zeigst du, was Zero Hero bedeutet. Danke, dass du Teil davon bist! | Bestätigungstext | – | – | Weiterleitung offen (C12) |

---

## C. Offene Punkte (vor Implementierung zu klären)

### Fachlich / Formularverhalten
- **C1** Schadenverursacher: Nur eine Option wählbar oder mehrere?
- **C2** Die Sternchen bei «Personal Nummer:» (A14) und «Name / Vorname:» (D14): Pflicht nur, wenn die jeweilige Option gewählt ist? Sollen die zugehörigen Felder immer sichtbar sein oder erst nach Auswahl erscheinen?
- **C3** «Schaden an Eigentum von externer Person?», «Polizeirapport / Anzeige vorhanden?», «Externes Fahrzeug betroffen?»: einzelne Checkbox (angekreuzt = ja) oder Ja/Nein-Auswahl? Die Vorlage nennt keine Antwortwerte.
- **C4** «Weiteres Inventar +»: Fügt «+» alle drei Felder (Bezeichnung, Nummer, Kontrollschild) erneut hinzu? Maximale Anzahl? «Weitere Fotos +»: weiteres Upload-Feld oder Mehrfachauswahl? Maximale Anzahl?
- **C5** Uploads: erlaubte Dateitypen (nur Bilder? auch PDF für Rapport/Protokoll/Pläne/Offerten?), maximale Dateigrösse, mehrere Dateien pro Feld?
- **C6** «Fehlerhafte Pläne»:
  - Wer ist der Empfänger – die Person aus «Verantwotlicher Baustelle / Bauführer:», aus «Bauführer / Disponent» (Autorisation) oder eine feste Adresse? Beide Felder erfassen nur Namen, keine E-Mail-Adresse.
  - Versandweg (E-Mail? anderer Kanal?) und Absenderadresse.
  - Inhalt der Nachricht: Ist «Pläne an schaden@tozzo.ch zuzustellen» der Text der Nachricht an Bauführer/Disponent, oder soll das System Pläne an schaden@tozzo.ch senden?
  - Auslösezeitpunkt: beim Absenden der Meldung (Annahme wäre naheliegend, ist aber nicht festgelegt)?
- **C7** «Autorisation des Schadefalls» (rot): Die Frage C129 ist offen. Ist «Bauführer / Disponent» ein freies Textfeld oder eine Auswahlliste (dann: Quelle der Namen)? Soll die Frage C129 in der App angezeigt werden (vermutlich Arbeitsnotiz, nicht Formularinhalt)? Kein Freigabeprozess wird abgeleitet.
- **C8** Erfassungsdatum: automatisch mit dem Tagesdatum befüllt oder manuell einzugeben (Format TT.MM.JJJJ)?
- **C9** Verfasser «Username»: Woher kommt der Username? Freie Eingabe oder aus einer Anmeldung (Login, z. B. Firmenkonto)? Ein Login ist in der Vorlage nicht beschrieben.
- **C10** Formate: Datum / Uhrzeit (ein Feld oder Datum + Uhrzeit, vorbelegt?), Schadensumme (nur Zahlen, Rappen?), Telefonnummer/E-Mail – sollen Formatprüfungen erfolgen oder reine Textfelder?
- **C11** «selbstlöschend»: Verschwindet die Bestätigungsnachricht nach einer Zeit (wie lange?), wird das Formular danach geleert, oder ist etwas anderes gemeint (z. B. Löschung von Daten)? Ist «automatisches Bestätigungsnachricht» nur die Anzeige am Bildschirm oder zusätzlich eine E-Mail an den Verfasser?
- **C12** «an die zuständige Stelle weitergeleitet»: Was genau passiert beim Absenden? Nur Speichern in einer Datenbank, E-Mail an schaden@tozzo.ch (mit Anhängen?), oder beides? Wer ruft gespeicherte Meldungen wie ab (Ihre Anforderung nennt «Abrufen», die Vorlage keine Ansicht dafür)?
- **C13** Kommentare A74/A113 («Mindestens 1 Checkbox …»): als Validierungsregel übernehmen? Sind die Optionen in «Warum ist der Schaden entstanden?» damit Mehrfachauswahl?
- **C14** Bereichstitel aus der Beschreibung (A4) anzeigen oder nur die Excel-Überschriften?
- **C15** Schreibfehler der Vorlage übernehmen («Verantwotlicher», «Schadefalls», «automatisches Bestätigungsnachricht»)? Beschreibung verlangt keine Änderungen → Standard wäre: übernehmen. «automatisches Bestätigungsnachricht» wird dem Benutzer ohnehin nicht angezeigt (C11).
- **C16** Logo: Datei vorhanden? Sonst bleibt der Platzhalter «LOGO».
- **C17** Sternchen-Legende «Pflichtfelder» (A1) in der App anzeigen?

### Technisch / Betrieb
- **C18** Hosting-Plattform und Domain.
- **C19** Datenbank und Dateispeicher (Ort, Schweiz/EU-Region?).
- **C20** E-Mail-Versand (SMTP-Server bzw. Dienst, Absenderadresse) – nötig für C6 und ggf. C12.
- **C21** Zugriffsschutz des Formulars: öffentlich erreichbar oder nur intern (Firmennetz/Login)? Hängt mit C9 zusammen.
- **C22** Aufbewahrungsdauer der Personendaten und Uploads (Datenschutz revDSG).
- **C23** Sprache: nur Deutsch (Schweizer Schreibweise «ss»)?
- **C24** Zielgeräte: Smartphone (Kamera für «Fotomöglichkeit») und Desktop?
