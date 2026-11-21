// Claude-Code-Skills fürs Webdesign und der empfohlene Ablauf. Alle Texte deutsch, DOM-frei.

export const skills = [
  {
    name: 'frontend-design',
    wann: 'Wenn du eine einzelne Seite oder Komponente bauen oder überarbeiten willst und sie nicht wie typische KI-Webseiten aussehen soll.',
    warum: 'Der Skill sorgt für ein eigenständiges, einsatzfertiges Frontend mit klaren Gestaltungsentscheidungen, statt der üblichen austauschbaren KI-Optik (lila Verläufe, Standard-Karten, Allerweltsschriften).',
    beispielprompt: 'Nutze den Skill frontend-design und baue die Startseite für meine Bäckerei: Hero mit großer Serifenüberschrift, Hintergrund #f4efe6, ruhiger Editorial-Stil. Ändere nur die Startseite.',
  },
  {
    name: 'website-design:design-system',
    wann: 'Ganz am Anfang, bevor du etwas baust: wenn du noch keine feste Gestaltungslinie hast und dich für eine Richtung entscheiden willst.',
    warum: 'Der Skill hilft, eine Design-Richtung anhand echter Webseiten auszuwählen, und hält sie in einer Datei DESIGN.md fest (Farben, Schriften, Abstände). So bleibt später alles einheitlich.',
    beispielprompt: 'Nutze website-design:design-system. Ich baue eine Seite für ein Yoga-Studio. Zeig mir drei Richtungen anhand echter Webseiten und schreibe die gewählte als DESIGN.md auf.',
  },
  {
    name: 'website-design:landing-page',
    wann: 'Wenn du eine komplette Landingpage brauchst, also eine einzelne Werbe-Seite mit einem klaren Ziel, etwa Anmeldung oder Kauf.',
    warum: 'Der Skill entwirft und baut die Seite so, dass sie wie ein echtes Produkt wirkt und nicht wie ein KI-Ergebnis. Am besten nutzt du ihn mit einer vorhandenen DESIGN.md.',
    beispielprompt: 'Nutze website-design:landing-page und baue nach der DESIGN.md eine Landingpage für meinen Newsletter: Hero, drei Vorteile, Anmeldeformular. Ziel: E-Mail-Anmeldungen.',
  },
  {
    name: 'website-design:web-review',
    wann: 'Wenn eine Seite schon steht und du wissen willst, was daran noch nicht gut ist.',
    warum: 'Der Skill prüft die Seite und listet die nötigen Verbesserungen auf, die wichtigsten zuerst. So weißt du, was du zuerst anpacken solltest.',
    beispielprompt: 'Nutze website-design:web-review für meine Startseite und liste alle Verbesserungen auf, die wichtigsten zuerst. Ändere noch nichts am Code.',
  },
  {
    name: 'superdesign',
    wann: 'Wenn du Ideen erst sehen willst, bevor du Code schreibst, oder eine bestehende Seite neu denken möchtest.',
    warum: 'Superdesign entwirft Designs auf einer Zeichenfläche (Canvas), nutzt mehrere KI-Modelle, liefert Varianten zum Vergleichen und kann Redesigns bestehender Seiten erzeugen.',
    beispielprompt: 'Nutze superdesign und entwirf drei Varianten für die Startseite meiner Fotografie-Seite im Stil eines Zeitungsposters. Zeig sie nebeneinander auf dem Canvas.',
  },
];

export const workflow = [
  'Richtung wählen: Entscheide dich für einen Stil, am besten mit superdesign (Varianten ansehen) oder dem Design-Trainer.',
  'Design-System festhalten: Lass mit website-design:design-system Farben, Schriften und Abstände in einer DESIGN.md aufschreiben.',
  'Seite bauen: Baue mit website-design:landing-page oder frontend-design und verweise auf die DESIGN.md.',
  'Mit präzisen Prompts nachschärfen: Benenne Element, Eigenschaft, konkreten Wert, Stimmung und Grenze.',
  'Reviewen: Lass die Seite mit website-design:web-review prüfen und arbeite die Liste von oben nach unten ab.',
];
