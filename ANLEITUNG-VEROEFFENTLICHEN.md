# Groove & Theorie auf die Schüler-iPads bringen – Schritt für Schritt

**Ziel:** Die App liegt unter einem **versteckten Link** im Internet. Sie ist nirgends verlinkt und für Suchmaschinen gesperrt. Die Schülerinnen und Schüler kommen nur über deinen **QR-Code** hin.

Du brauchst nur einen Browser (Safari oder Chrome). Du musst nichts installieren. Der Speicherplatz bei **GitHub Pages** ist kostenlos, das Einrichten dauert etwa 15 Minuten.

So bleibt die App versteckt:
- In der App steckt eine Sperre für Suchmaschinen (`noindex` und `robots.txt`). Google & Co. nehmen sie nicht auf.
- Keine Seite verlinkt auf die App. Wer den QR-Code oder Link nicht hat, findet sie praktisch nicht.
- Die App enthält nur Übungen, sammelt keine Daten und setzt keine Cookies. Selbst wenn jemand den Link weitergibt, ist nichts Vertrauliches zu sehen.
- **Ehrlicher Hinweis:** Der Quellcode-Ordner („Repository“) ist bei kostenlosen GitHub-Konten öffentlich einsehbar. Wähle deshalb einen unauffälligen Benutzernamen und Repository-Namen, siehe unten.

---

## Teil A: Ein kostenloses GitHub-Konto anlegen (einmalig)

1. Öffne **https://github.com/signup**.
2. Gib eine E-Mail-Adresse ein. Am besten nimmst du deine Schul- oder Dienstadresse.
3. Lege ein Passwort fest.
4. Wähle einen **Benutzernamen**. Er erscheint später im versteckten Link, zum Beispiel `ndmusik7`. Daraus wird dann `https://ndmusik7.github.io/…`. Nimm am besten etwas Unauffälliges, ohne vollen Namen und ohne Schulnamen.
5. Löse das kleine Rätsel, bestätige den Code aus der E-Mail, und fertig.
   Fragen zu „Team“ oder „Plan“ kannst du überspringen. Wähle den kostenlosen Plan (**Free**).

## Teil B: Einen Ordner (ein „Repository“) für die App anlegen

1. Klicke oben rechts auf das **+** und dann auf **New repository**.
2. **Repository name:** ein beliebiger, unauffälliger Name, zum Beispiel `gt7`. Er wird Teil des Links. In dieser Anleitung steht er als `gt7`.
3. Wähle **Public**. Das ist bei kostenlosen Konten nötig, damit die iPads die Seite abrufen können. Der Link bleibt trotzdem versteckt (siehe oben).
4. Alles andere bleibt, wie es ist. Klicke unten auf **Create repository**.

## Teil C: Die Dateien hochladen

1. Auf der neuen, fast leeren Seite klickst du auf den Link **„uploading an existing file“**.
2. Öffne im Finder den Ordner **Dokumente → Musiktheorie-App**.
3. Markiere dort **alles** mit **⌘ + A**.
4. Ziehe die markierten Dateien und Ordner mit der Maus in das Browserfenster, auf die Fläche „Drag files here“.
5. Warte, bis alle Dateien aufgelistet sind (etwa 70 Stück).
6. Klicke unten auf den grünen Knopf **Commit changes**.

> Die Ordner `screenshots` und `tools` und die Datei `tests.html` werden online nicht gebraucht. Sie schaden aber auch nicht und dürfen mit hochgeladen werden.

## Teil D: Den versteckten Link einschalten

1. Öffne im Repository oben den Reiter **Settings** (Zahnrad).
2. Klicke links auf **Pages**.
3. Wähle unter **Build and deployment → Source** die Option **Deploy from a branch**.
4. Wähle bei **Branch** den Eintrag **main** und daneben **/ (root)**. Klicke auf **Save**.
5. Warte 1–2 Minuten und lade die Seite neu. Oben erscheint dann:
   **„Your site is live at https://DEINNAME.github.io/gt7/“**

Das ist dein versteckter Link. Gib ihn nicht als Text weiter, sondern nur als QR-Code.

## Teil E: QR-Codes für die iPads

1. Öffne auf deinem Mac die Lehrkraft-Seite: **`https://DEINNAME.github.io/gt7/lehrkraft.html`**
   Diese Seite ist von der App aus nicht verlinkt. Setz dir ein Lesezeichen.
2. Dort siehst du die QR-Codes für die Startseite und für jedes Modul. Sie passen automatisch zum versteckten Link.
3. Im Unterricht zeigst du den Code am Beamer oder hängst ihn ausgedruckt auf (Knopf **Drucken**).
4. Die Schülerinnen und Schüler öffnen auf dem iPad die **Kamera**, halten sie auf den Code und tippen auf das gelbe Feld, das erscheint. Die App öffnet sich in Safari.
5. Tipp: In Safari auf **Teilen → Zum Home-Bildschirm** tippen. Dann liegt die App als Symbol auf dem iPad, und niemand muss den Code ein zweites Mal scannen. Nach dem ersten Öffnen funktioniert sie auch ohne Internet.

Auf der Lehrkraft-Seite findest du außerdem:
- den **Freischalt-Link** (`…/gt7/?frei`). Damit sind auf dem jeweiligen Gerät alle Stufen sofort offen.
- einen **Stundenvorschlag** für 10 Stunden.
- die **Lösungen** zu allen festen Inhalten.

## Später etwas ändern

1. Lade im Repository die geänderten Dateien genauso hoch wie in Teil C. Gleichnamige Dateien werden dabei ersetzt.
2. Wichtig für die Offline-Funktion: In der Datei `sw.js` muss die Zeile `const VERSION = '…'` bei jeder Änderung einen neuen Wert bekommen, zum Beispiel ein neues Datum. Sonst sehen manche Geräte noch eine Zeit lang die alte Fassung. Das übernehme ich gern, wenn du mir Bescheid sagst.

---

## Alternative: Netlify Drop

Unter **https://app.netlify.com/drop** kannst du den Ordner `Musiktheorie-App` einfach ins Browserfenster ziehen. Du bekommst dann sofort einen zufälligen, versteckten Link.
Damit sie **dauerhaft** online bleibt, musst du dich aber auch dort kostenlos anmelden. GitHub Pages ist für die Schule meist die übersichtlichere Lösung.

---

## Bitte vor dem Einsatz klären

- **Impressum und Datenschutz:** Auch ein versteckter Link ist technisch eine Webseite. Zur Sicherheit sollte es einen Hinweis auf das Impressum geben. Am einfachsten verlinkt die App auf Impressum und Datenschutzerklärung der Schul-Website. Schick mir die Links, dann baue ich sie in die Fußzeile ein.
- **Speicherort GitHub:** GitHub (wie jeder Webserver) speichert technisch bedingt Zugriffsprotokolle, zum Beispiel IP-Adressen. Die App selbst sammelt keine Daten, setzt keine Cookies und lädt nichts von fremden Servern. Stimme den Einsatz bitte kurz mit der Schulleitung oder der bzw. dem Datenschutzbeauftragten ab.

## Lokal ansehen (ohne Internet, nur auf deinem Mac)

Öffne das Programm **Terminal** und gib nacheinander ein:

```
cd ~/Documents/Musiktheorie-App
ruby tools/server.rb
```

Danach erreichst du die App im Browser unter **http://localhost:8417**. Mit **Ctrl + C** im Terminal beendest du den Server wieder.
