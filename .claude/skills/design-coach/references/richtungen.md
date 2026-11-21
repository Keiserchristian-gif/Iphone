<!-- Automatisch erzeugt von scripts/build-skill-refs.mjs. Nicht von Hand ändern. -->

# Gegenrichtungen zum Standard (nach Mut-Stufe 0 = vertraut, 100 = extrem)

## Papier & Stempel (Mut 10)

Wie ein gestempelter Behördenbogen aus den Fünfzigern: warmes Papier, ein roter Stempel, Tinte, die leicht ausläuft. Ruhig, haptisch, überraschend persönlich.

- Farben: #f1e7d0, #2b2a26, #b3262c, #7d8f9a
- Schriften (Google Fonts): Special Elite, Courier Prime, IM Fell English
- Layout: Der Inhalt liegt wie ein Formular auf einem Papierbogen (max. 720px breit) mit sichtbaren Falzlinien. Abschnitte sind durch gestrichelte Linien getrennt, Überschriften als rote Stempel (3° gedreht, 3px Rand). Kein Hero-Bild, nur Text und ein Stempel.
- Bewegung: Stempel schlagen beim Scrollen mit 120ms ein (scale 1.4 auf 1, kurzes Nachwippen). Sonst nichts bewegt sich.
- Startprompt: Gestalte die Hero-Überschrift und den Hintergrund der Startseite wie einen gestempelten Behördenbogen aus den Fünfzigern: Hintergrundfarbe #f1e7d0 mit feinem Papierrauschen, Text in #2b2a26 in der Schrift Special Elite mit 18px Größe, die Überschrift als roter Stempel (#b3262c, 3px Rahmen, 3° gedreht). Das Ganze wirkt haptisch, ruhig und persönlich, wie echtes Papier. Nur Hero und Hintergrund ändern; Navigation, Footer und Texte nicht anfassen.

## Editorial-Zeitung (Mut 20)

Eine Tageszeitung als Website: enge Spalten, riesige Serifenschlagzeile, feine Haarlinien. Seriös und trotzdem unverkennbar.

- Farben: #f4efe6, #141414, #c8102e, #8a8478
- Schriften (Google Fonts): Playfair Display, Source Serif 4, IBM Plex Mono
- Layout: Dreispaltiges Zeitungsraster mit 1px Haarlinien zwischen den Spalten. Schlagzeile über alle Spalten, 11vw, Zeilenhöhe 0.9, Initiale (Drop-Cap) über drei Zeilen. Bildunterschriften in Mono, 11px, Versalien.
- Bewegung: Die Schlagzeile setzt sich beim Laden Zeile für Zeile von unten nach oben (80ms Versatz). Haarlinien zeichnen sich beim Scrollen von links nach rechts.
- Startprompt: Gestalte die Überschrift und den Textbereich im Hero wie die Titelseite einer Tageszeitung: Schlagzeile in Playfair Display, Schriftgröße 11vw, Zeilenhöhe 0.9, Farbe #141414 auf Hintergrund #f4efe6, darunter dreispaltiger Fließtext in Source Serif 4 mit 1px Haarlinie (#8a8478) zwischen den Spalten und rotem Akzent #c8102e nur für die Rubrikzeile. Stil seriös, editorial und dicht wie ein Magazin. Ändere nur den Hero-Abschnitt, alles andere unverändert lassen.

## Swiss-Poster (Mut 25)

Internationaler Typografischer Stil: ein strenges Raster, eine Grotesk, eine Signalfarbe. Klar, kühl, extrem präzise.

- Farben: #ffffff, #0a0a0a, #ff3b00, #d9d9d9
- Schriften (Google Fonts): Archivo Black, Space Grotesk, Archivo Narrow
- Layout: Sichtbares 12-Spalten-Raster (Linien 1px #d9d9d9 als Hintergrund). Überschrift linksbündig, 14vw, nur in Spalte 1 bis 8, am unteren Rand verankert. Eine einzige Orange-Fläche (#ff3b00) als Rechteck, das zwei Spalten füllt. Alles linksbündig, flatterrechts.
- Bewegung: Das Raster blendet sich beim Hover einer Spalte ein; die Orange-Fläche gleitet in 400ms (cubic-bezier(.7,0,.2,1)) auf die nächste Spalte.
- Startprompt: Gestalte den Hero-Bereich als Schweizer Typo-Poster: Überschrift in Archivo Black, Größe 14vw, linksbündig, Farbe #0a0a0a auf Hintergrund #ffffff, dazu ein orangefarbenes Rechteck in #ff3b00 über zwei Spalten eines sichtbaren 12-Spalten-Rasters (Linien 1px, #d9d9d9). Die Stimmung ist kühl, präzise und streng, wie ein Plakat von 1965. Nur den Hero verändern, nichts anderes anfassen.

## Bauhaus-Geometrie (Mut 35)

Kreis, Quadrat, Dreieck in Grundfarben. Das Layout besteht aus Formen, nicht aus Boxen.

- Farben: #f2ead3, #1b1b1b, #e63322, #1d4ea1, #f5b700
- Schriften (Google Fonts): Jost, Josefin Sans, Bebas Neue
- Layout: Der Hero besteht aus einem Kreis (40vw, #f5b700), einem Quadrat (#1d4ea1) und einem roten Dreieck, die sich überlappen. Text liegt diagonal im Winkel von -8° über den Formen. Abschnitte wechseln zwischen Quadrat- und Kreisausschnitten (clip-path), keine Rechtecke mit Rundung.
- Bewegung: Formen rotieren beim Scrollen langsam (0 bis 90°, scroll-gekoppelt), das Dreieck rastet alle 90° ein.
- Startprompt: Gestalte den Hero-Hintergrund und die Überschrift im Bauhaus-Stil: ein gelber Kreis (#f5b700, Größe 40vw), ein blaues Quadrat (#1d4ea1) und ein rotes Dreieck (#e63322) überlappen sich auf Hintergrund #f2ead3, die Überschrift in Jost Schriftgewicht 700 steht im Winkel von -8° quer darüber. Der Look wirkt geometrisch, spielerisch und streng zugleich. Nur Hero-Hintergrund und Überschrift ändern, Navigation und Rest nichts anderes anfassen.

## Kinderbuch-Collage (Mut 40)

Aus Papier ausgerissene Formen, Wachsstift-Linien, schiefe Handschrift. Warm, verspielt, überhaupt nicht Business.

- Farben: #fff4dc, #2f4858, #f26b5b, #7bc5a5, #f7c548
- Schriften (Google Fonts): Caveat, Baloo 2, Patrick Hand
- Layout: Elemente sind ausgerissene Papierstücke mit unregelmäßigem clip-path und leichtem Schlagschatten (2px 3px 0 rgba(0,0,0,.15)). Jede Karte ist anders gedreht (zwischen -4° und 5°). Überschriften wie mit Wachsstift, 64px, Unterstreichung als wellige SVG-Linie. Kein gerades Raster.
- Bewegung: Papierstücke wackeln beim Hover um 2° hin und her (Stop-Motion in 3 Schritten, steps(3)). Beim Laden fallen sie aus 40px Höhe auf ihren Platz.
- Startprompt: Gestalte die Karten-Abschnitte der Seite wie eine Kinderbuch-Collage: jede Karte als ausgerissenes Papierstück mit unregelmäßigem clip-path, Hintergrundfarben #f26b5b, #7bc5a5 und #f7c548 auf Seitenhintergrund #fff4dc, unterschiedlich gedreht zwischen -4° und 5°, Überschriften in Caveat mit 64px. Es wirkt verspielt, warm und handgemacht. Ändere nur die Karten und deren Überschriften, ohne den Rest der Seite anzufassen.

## Retro-Terminal (Mut 50)

Die Seite ist ein Rechner aus den Achtzigern: Phosphorgrün, Monospace, Kommandozeile statt Menü.

- Farben: #050b07, #33ff66, #1a9c3d, #ffb000
- Schriften (Google Fonts): VT323, IBM Plex Mono, Share Tech Mono
- Layout: Vollflächiger schwarzer Bildschirm mit 24px Innenabstand und 1px grünem Rahmen. Navigation als Kommandos (> start, > projekte, > kontakt). Inhalte als Terminalausgabe, 20px Zeilenabstand. Ein Scanline-Overlay (repeating-linear-gradient, 2px) liegt über allem.
- Bewegung: Text tippt sich Zeichen für Zeichen (40ms pro Zeichen), ein Block-Cursor blinkt im Takt von 1s. Leichtes Flackern des Bildschirms (opacity 0.97 bis 1).
- Startprompt: Gestalte die Navigation und den Hero-Text als Retro-Terminal aus den Achtziger-Jahren: Hintergrund #050b07, Text in #33ff66, Schrift VT323 mit 22px, Menüpunkte als Befehle mit vorangestelltem ">" und einem blinkenden Block-Cursor, darüber ein Scanline-Overlay mit 2px Streifen. Die Stimmung ist nerdig, retro und fokussiert. Nur Navigation und Hero-Text ändern, nichts anderes anfassen.

## Weltraum-Analog (Mut 55)

Ein Bordbuch aus der Raumfahrt der Siebziger: orange Instrumente, Technikbeschriftungen, Orbit-Linien. Wissenschaftlich und romantisch.

- Farben: #0d1117, #e8dcc2, #ff7a1a, #3a4a5c, #8fd3c8
- Schriften (Google Fonts): Space Mono, Syne, Chakra Petch
- Layout: Dunkle Seite mit konzentrischen Orbit-Linien (1px, #3a4a5c) hinter dem Hero. Technische Beschriftungen in 11px Versalien mit Koordinaten (z. B. "LAT 48.13 / LON 11.58") an den Rändern. Inhalte in Tafeln mit Eckmarkierungen statt Rahmen. Überschrift klein (28px), dafür breit gesperrt (Buchstabenabstand 0.4em).
- Bewegung: Ein Punkt kreist in 20s auf einer Orbit-Linie. Zahlenwerte zählen beim Sichtbarwerden hoch (800ms). Eckmarkierungen fahren aus der Mitte nach außen.
- Startprompt: Gestalte den Hero-Hintergrund und die Beschriftungen wie ein Bordbuch der Raumfahrt aus den Siebzigern: Hintergrundfarbe #0d1117 mit konzentrischen Orbit-Linien in #3a4a5c (1px), Beschriftungen in Space Mono 11px Versalien in #ff7a1a, Überschrift mit 0.4em Buchstabenabstand in #e8dcc2. Es wirkt wissenschaftlich, analog und ein bisschen romantisch. Nur Hero-Hintergrund und Beschriftungen ändern, alles andere unverändert lassen.

## Risograph-Druck (Mut 65)

Zwei Druckfarben, die sich überlappen und neue Töne ergeben; leichter Versatz, Körnung, Halbtonraster. Wirkt wie ein selbst gedrucktes Plakat.

- Farben: #fdf6e3, #ff48b0, #0078bf, #ffe800
- Schriften (Google Fonts): Rubik Mono One, DM Sans, Bowlby One
- Layout: Nur zwei Druckfarben (#ff48b0 und #0078bf) mit mix-blend-mode: multiply, sodass sich überlappende Flächen dunkel mischen. Jede Ebene ist 4px versetzt (Passerfehler). Bilder als Halbtonraster in nur einer Farbe. Überschrift 16vw, zwei Ebenen leicht gegeneinander verschoben.
- Bewegung: Die Farbebenen driften beim Hover um bis zu 6px auseinander (300ms) und rasten zurück. Körnung (SVG-Noise, 8% Deckkraft) flimmert in 4 Bildern pro Sekunde.
- Startprompt: Gestalte die Überschrift und die Bilder im Hero im Stil eines Risograph-Drucks: Überschrift in Rubik Mono One, 16vw, doppelt gesetzt in #ff48b0 und #0078bf mit mix-blend-mode multiply und 4px Versatz, Hintergrund #fdf6e3 mit Körnung bei 8% Deckkraft, Bilder als einfarbiges Halbtonraster. Der Look wirkt handgedruckt, laut und leicht unperfekt. Nur Überschrift und Bilder im Hero ändern, nichts anderes anfassen.

## Y2K-Chrom (Mut 72)

Das Jahr 2000 als Zukunftsversprechen: Chrom, Blasen, Sterne, Pixelschriften und hemmungsloser Optimismus.

- Farben: #e9f2ff, #7a5cff, #00e0d0, #ff7ad9, #1a1a2e
- Schriften (Google Fonts): Orbitron, Rubik Bubbles, Press Start 2P
- Layout: Fenster im Betriebssystem-Look mit 2px Bevel-Rand und Titelleiste, überlappend und leicht versetzt. Buttons als glänzende Kapseln (Verlauf von #ffffff nach #7a5cff, Glanzlicht oben). Hintergrund: Sternenmuster und schwebende Chrom-Blasen. Zwischenüberschriften in Pixelschrift.
- Bewegung: Blasen schweben in 6s-Schleifen (translateY ±14px). Buttons glänzen beim Hover mit einem Lichtstreifen von links nach rechts (500ms). Fenster lassen sich per Klick nach vorn holen.
- Startprompt: Gestalte die Buttons und Karten der Seite im Y2K-Stil von 2000: Buttons als glänzende Kapseln mit Verlauf von #ffffff nach #7a5cff, Rahmen 2px und Glanzlicht oben, Karten als Betriebssystem-Fenster mit Titelleiste in #00e0d0, Überschriften in Orbitron, Hintergrund #e9f2ff mit Sternen. Es wirkt optimistisch, futuristisch und verspielt. Nur Buttons und Karten ändern, nichts anderes anfassen.

## Zine-Collage (Mut 80)

Fotokopierte Schnipsel, Klebeband, Ausschnitt-Buchstaben: Punk-Fanzine statt Unternehmensseite.

- Farben: #f0ece2, #111111, #ff2e63, #fcee21
- Schriften (Google Fonts): Rubik Dirt, Special Elite, Permanent Marker
- Layout: Schwarz-Weiß-Kopien mit hartem Kontrast (filter: grayscale(1) contrast(1.6)), ausgeschnitten und mit "Klebeband" (halbtransparente gelbe Streifen, -6°) fixiert. Überschrift aus einzelnen Buchstaben, jede in anderem Hintergrund, Größe und Drehung. Elemente überlappen und brechen den Rand der Seite.
- Bewegung: Schnipsel springen beim Hover 6px hoch und drehen sich um 2°. Beim Laden werden sie nacheinander aufgeklebt (Einblenden mit leichtem Zoom, 150ms Versatz).
- Startprompt: Gestalte die Überschrift und die Bilder im Hero als Punk-Zine-Collage: Überschrift aus einzelnen Ausschnitt-Buchstaben in Permanent Marker, jeder Buchstabe mit anderem Hintergrund (#ff2e63, #fcee21, #111111), Größe zwischen 8vw und 14vw und Drehung von -9° bis 7°, Bilder in Schwarz-Weiß mit hartem Kontrast und 6° gedrehtem Klebeband in #fcee21. Es wirkt roh, laut und handgeklebt wie ein Fanzine. Nur Überschrift und Bilder im Hero ändern, nichts anderes anfassen.

## Neon-Nacht (Mut 88)

Eine Stadt um 2 Uhr nachts: Leuchtröhren, nasser Asphalt, Farbe, die aus der Dunkelheit strahlt.

- Farben: #07060f, #ff2bd6, #00f0ff, #f9f871, #2a1b4d
- Schriften (Google Fonts): Monoton, Tilt Neon, Syncopate
- Layout: Fast schwarze Seite, Überschrift als Neonschrift aus einer einzigen Linie (Monoton, 12vw) mit mehrlagigem text-shadow (0 0 8px, 0 0 24px, 0 0 60px in #ff2bd6). Karten nur als leuchtende Umrisse (1px #00f0ff mit Glow), nie als gefüllte Flächen. Reflexion der Überschrift darunter (scaleY(-1), 20% Deckkraft, Maskenverlauf).
- Bewegung: Die Neonröhre flackert unregelmäßig beim Laden (3 Aussetzer, 60 bis 200ms). Umrisse pulsieren im Atemrhythmus von 4s.
- Startprompt: Gestalte die Überschrift und die Karten der Seite als Neon-Nacht: Hintergrund #07060f, Überschrift in Monoton, Größe 12vw, Farbe #ff2bd6 mit dreifachem text-shadow (8px, 24px, 60px Glow), Karten ohne Füllung, nur 1px Umriss in #00f0ff mit Leuchten, und eine gespiegelte Reflexion der Überschrift mit 20% Deckkraft. Es wirkt nächtlich, städtisch und elektrisch. Nur Überschrift und Karten ändern, nichts anderes anfassen.

## Neo-Brutalismus (Mut 100)

Rohe Flächen, harte Schatten, schreiende Farben. Die Seite zeigt ihre Konstruktion und entschuldigt sich nicht dafür.

- Farben: #fffbe6, #000000, #ff5c00, #b6ff00, #7c3aed
- Schriften (Google Fonts): Archivo Black, Space Mono, Unbounded
- Layout: Raster bricht absichtlich aus: Überschrift 18vw, 12° gedreht, überlappt das Bild und ragt über den rechten Rand. Alle Boxen haben 4px schwarzen Rand und harten Schatten (8px 8px 0 #000), keine Rundungen. Flächen in grellem Orange und Giftgrün, Abstände ungleichmäßig (8px und 96px im Wechsel). Links sind unterstrichen und 6px dick.
- Bewegung: Boxen springen beim Hover auf ihren Schatten zu (translate 8px, Schatten verschwindet, 80ms linear). Marquee-Laufband mit Text in 28vw, 12s pro Durchlauf.
- Startprompt: Gestalte die Überschrift und die Buttons im Hero im Neo-Brutalismus: Überschrift in Archivo Black, Größe 18vw, 12° gedreht, überlappt das Bild, Buttons mit 4px schwarzem Rand, hartem Schatten (8px 8px 0 #000000) und Hintergrund #ff5c00 oder #b6ff00 auf Seitenfarbe #fffbe6. Die Stimmung ist roh, laut und mutig. Nur Überschrift und Buttons im Hero ändern, nichts anderes anfassen.
