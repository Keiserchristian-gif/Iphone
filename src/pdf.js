/* Gedanken – kleiner PDF-Schreiber ohne Fremdbibliothek (A4, Helvetica, WinAnsi für Umlaute). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GPdf = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var W = 595.28, H = 841.89, M = 56;
  /* Zeichen außerhalb von Latin-1, die WinAnsi trotzdem kennt. */
  var ANSI = { 0x20AC: 0x80, 0x201A: 0x82, 0x201E: 0x84, 0x2026: 0x85, 0x2039: 0x8B, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x203A: 0x9B };
  /* Helvetica-Laufweiten (Tausendstel der Schriftgröße) für ASCII 32–126. */
  var WIDTHS = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556,
    556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667,
    556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556,
    500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500,
    500, 334, 260, 334, 584];
  var WIDE = { 'Ä': 667, 'Ö': 778, 'Ü': 722, 'ß': 611, '…': 1000, '–': 556, '—': 1000, '·': 278, '„': 333, '“': 333, '”': 333 };

  function byteOf(ch) {
    var c = ch.charCodeAt(0);
    if (ANSI[c]) return ANSI[c];
    if (c >= 32 && c <= 126) return c;
    if (c >= 160 && c <= 255) return c;
    if (c < 32) return 32;
    return 63; /* ? */
  }
  function pdfString(str) {
    var out = '(';
    for (var i = 0; i < str.length; i += 1) {
      var b = byteOf(str.charAt(i));
      if (b === 40 || b === 41 || b === 92) out += '\\' + String.fromCharCode(b);
      else if (b > 126) out += '\\' + ('000' + b.toString(8)).slice(-3);
      else out += String.fromCharCode(b);
    }
    return out + ')';
  }
  function textWidth(str, size, bold) {
    var sum = 0;
    for (var i = 0; i < str.length; i += 1) {
      var ch = str.charAt(i), c = ch.charCodeAt(0);
      sum += WIDE[ch] || (c >= 32 && c <= 126 ? WIDTHS[c - 32] : 556);
    }
    return sum / 1000 * size * (bold ? 1.07 : 1);
  }
  function wrap(text, size, maxWidth, bold) {
    var words = String(text).split(/\s+/).filter(function (w) { return w.length > 0; });
    var lines = [], line = '';
    words.forEach(function (word) {
      while (textWidth(word, size, bold) > maxWidth && word.length > 1) {
        var cut = word.length - 1;
        while (cut > 1 && textWidth(word.slice(0, cut), size, bold) > maxWidth) cut -= 1;
        if (line) { lines.push(line); line = ''; }
        lines.push(word.slice(0, cut));
        word = word.slice(cut);
      }
      var next = line ? line + ' ' + word : word;
      if (line && textWidth(next, size, bold) > maxWidth) { lines.push(line); line = word; }
      else line = next;
    });
    if (line) lines.push(line);
    return lines;
  }
  function num(n) { return (Math.round(n * 100) / 100).toString(); }

  function buildPdf(doc) {
    var pages = [], ops = null, y = 0;
    var newPage = function () { ops = []; pages.push(ops); y = H - M; };
    var text = function (str, x, yy, size, bold, gray, spacing) {
      ops.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + num(size) + ' Tf ' + num(gray || 0) + ' g ' + num(spacing || 0) + ' Tc ' +
        num(x) + ' ' + num(yy) + ' Td ' + pdfString(str) + ' Tj ET');
    };
    var need = function (h) { if (y - h < M + 14) newPage(); };

    newPage();
    text(doc.title || 'MindDesk', M, y - 18, 24, true, 0.1);
    y -= 36;
    if (doc.subtitle) { text(doc.subtitle, M, y, 10, false, 0.42); y -= 14; }
    y -= 14;

    var groups = doc.groups || [];
    if (!groups.length) text('Keine offenen Gedanken.', M, y, 12, false, 0.3);
    groups.forEach(function (g) {
      need(70);
      text(String(g.title).toUpperCase(), M, y, 9.5, true, 0.38, 0.8);
      ops.push('0.82 G 0.6 w ' + num(M) + ' ' + num(y - 6) + ' m ' + num(W - M) + ' ' + num(y - 6) + ' l S');
      y -= 26;
      g.items.forEach(function (it) {
        var tx = M + 20, maxW = W - M - tx;
        var titleLines = wrap(it.title, 12, maxW, it.important);
        var showText = it.text && it.text.trim() && it.text.trim() !== it.title;
        var textLines = showText ? wrap('„' + it.text.trim() + '“', 9.5, maxW) : [];
        need(titleLines.length * 15 + (it.meta ? 13 : 0) + textLines.length * 12.5 + 10);
        /* Kästchen zum Abhaken */
        ops.push((it.done ? '0.55' : '0.3') + ' G 0.9 w ' + num(M) + ' ' + num(y - 1.5) + ' 9.5 9.5 re S');
        if (it.done) {
          ops.push('0.3 G 1.3 w ' + num(M + 2) + ' ' + num(y + 3.2) + ' m ' + num(M + 4.2) + ' ' + num(y + 0.8) + ' l ' +
            num(M + 7.8) + ' ' + num(y + 6.2) + ' l S');
        }
        titleLines.forEach(function (l) { text(l, tx, y, 12, it.important, it.done ? 0.5 : 0.1); y -= 15; });
        if (it.meta) { text(it.meta, tx, y, 9.5, true, 0.38); y -= 13; }
        textLines.forEach(function (l) { text(l, tx, y, 9.5, false, 0.45); y -= 12.5; });
        y -= 10;
      });
      y -= 8;
    });
    pages.forEach(function (p, i) {
      var label = 'Seite ' + (i + 1) + ' von ' + pages.length;
      p.push('BT /F1 8.5 Tf 0.55 g 0 Tc ' + num(W - M - textWidth(label, 8.5)) + ' ' + num(M - 22) + ' Td ' + pdfString(label) + ' Tj ET');
    });

    /* Objekte zusammensetzen */
    var objs = [];
    var kids = pages.map(function (p, i) { return (5 + i * 2) + ' 0 R'; }).join(' ');
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push('<< /Type /Pages /Kids [' + kids + '] /Count ' + pages.length + ' >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    objs.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    pages.forEach(function (p, i) {
      var stream = p.join('\n');
      objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + num(W) + ' ' + num(H) + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' +
        (6 + i * 2) + ' 0 R >>');
      objs.push('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
    });
    objs.push('<< /Title ' + pdfString(doc.title || 'MindDesk') + ' /Producer (MindDesk) >>');

    var out = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', offsets = [];
    objs.forEach(function (o, i) {
      offsets.push(out.length);
      out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n';
    });
    var xref = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach(function (off) { out += ('0000000000' + off).slice(-10) + ' 00000 n \n'; });
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R /Info ' + objs.length + ' 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';

    var bytes = new Uint8Array(out.length);
    for (var i = 0; i < out.length; i += 1) bytes[i] = out.charCodeAt(i) & 255;
    return bytes;
  }

  return { buildPdf: buildPdf, wrap: wrap, textWidth: textWidth };
});
