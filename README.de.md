[English](./README.md) | [Deutsch](./README.de.md)

---

# Moodle OpenCast Video Downloader

Dies ist eine einfache Chrome-Extension, die entwickelt wurde, um Open-Cast Video-Streams (Vorlesungen und Folien) von von Moodle herunterzuladen.

Die Extension erkennt den Video-Stream in Moodle automatisch und bietet eine einfache Oberfläche im Side Panel des Browsers, um den Download zu starten.

## ✨ Features

*   **Automatische Erkennung:** Erkennt automatisch die URL-Vorlage des Video-Streams, sobald das Video abgespielt wird.
*   **Live-Fortschrittsanzeige:** Zeigt ein detailliertes Log mit dem Fortschritt des Downloads an.
*   **Manuelle Anpassung:** Ermöglicht das manuelle Bearbeiten der erkannten URL, um z.B. den Folien-Stream anstelle der Videoaufnahme herunterzuladen.

---

## ⚙️ Installation (Schritt-für-Schritt)

Da diese Extension nicht im offiziellen Chrome Web Store ist, muss sie manuell im Entwicklermodus geladen werden.

1.  **Projektordner herunterladen:** Stelle sicher, dass du den gesamten Projektordner auf deinem Computer gespeichert hast.
2.  **Chrome öffnen:** Starte Google Chrome und navigiere zur Seite `chrome://extensions`.
3.  **Entwicklermodus aktivieren:** Aktiviere oben rechts den Schalter für den **"Entwicklermodus"**.
4.  **Extension laden:** Es erscheinen neue Buttons. Klicke auf **"Entpackte Erweiterung laden"**.
5.  **Ordner auswählen:** Es öffnet sich ein Datei-Dialog. Wähle den **kompletten Projektordner** aus (nicht eine einzelne Datei darin).
6.  **Fertig!** Die Extension ist nun installiert und in deiner Extension-Liste sichtbar. Ihr Icon erscheint in der Toolbar.

---

## 🚀 Verwendung

### 1. Standard-Download (Dozenten-Video)

1.  Navigiere in Moodle zu der Aufzeichnung, welche du herunterladen willst.
2.  Öffne das Side Panel der Extension, indem du auf das Extension-Icon in deiner Chrome-Toolbar klickst. Im Panel steht zunächst "Scanne nach Video-Stream...".
3.  Drücke auf der Webseite auf **"Play"**, um das Video zu starten.
4.  **Warte einen Moment.** Die Extension erkennt den Stream automatisch. Der Status im Side Panel ändert sich zu "Video-Stream erkannt!", und die URL-Vorlage wird in das Textfeld eingefügt.
5.  Klicke auf den nun aktiven Button **"Download starten"**.
6.  Wähle einen Speicherort auf deinem Computer. Der Download beginnt und du kannst den Fortschritt live im Log-Fenster mitverfolgen.

> **Wichtiger Hinweis:** Das Side Panel muss während des gesamten Download-Vorgangs geöffnet bleiben! Wenn du es schließt, wird der Download abgebrochen.

### 2. Mehrere Videos nacheinander herunterladen

Um sicherzustellen, dass die URL für das nächste Video korrekt erkannt wird, muss der Zustand der Extension zurückgesetzt werden.

1.  Schließe nach einem erfolgreichen Download das **Side Panel** der Extension.
2.  Navigiere zur Seite des nächsten Videos.
3.  Öffne das Side Panel **erneut** und wiederhole die Schritte aus dem Standard-Download.

### 3. Nur die Folien herunterladen (Präsentations-Ansicht)

Manchmal gibt es neben dem Video des Dozenten auch einen separaten Stream für die gezeigten Folien.

1.  Folge den Schritten des Standard-Downloads, bis die URL im Textfeld der Extension erscheint.
2.  **Drücke noch nicht auf "Download starten"!**
3.  Klicke in das Textfeld und bearbeite die URL manuell: Ersetze das Wort `presenter` durch `presentation`.
    *   **Beispiel:**
        `..._presenter.smil/...`
        wird zu
        `..._presentation.smil/...`
4.  Klicke erst **jetzt** auf "Download starten".
