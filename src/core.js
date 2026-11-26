/* Gedanken – reine Logik: Kern erkennen, Termine, Platzierung in der Karte, Sortierung fürs PDF. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CATS = {
    a: { label: 'Arbeit' },
    p: { label: 'Privat' },
    i: { label: 'Ideen' }
  };
  var CAT_ORDER = ['a', 'p', 'i'];
  /* Lage der Bereiche relativ zum Kern (0,0). */
  var HUBS = { a: { x: -104, y: -80 }, p: { x: 104, y: -76 }, i: { x: 0, y: 124 } };
  var CORE_RECT = { x: 0, y: 0, w: 116, h: 116 };
  var HUB_SIZE = { w: 128, h: 44 };
  var GAP = 10;

  var DAYS = ['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'];
  var DAY_SHORT = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.'];
  var STOP = ' ich du er sie es wir ihr man muss musst müssen soll sollte sollten will wollen möchte würde kann könnte ' +
    'noch unbedingt endlich mal bitte der die das den dem des ein eine einen einem einer und oder aber für mit zu zum zur ' +
    'bis am im in an auf von vom nicht dass daran denken mir mich mein meine meinen meinem auch wäre wären gut brauche ' +
    'brauchen habe hab haben ist sind so ganz wichtig dringend sofort heute morgen übermorgen abend früh idee vielleicht ' +
    'irgendwann eigenen eigene eigener kurz bald wegen außerdem dann danach nächste nächsten woche wochenende ' +
    'vergessen notiz erinnere erinnern zwar eigentlich einfach wieder gerne gern doch schon jetzt gleich später irgendwie ' +
    'halt eben nochmal nochmals mindestens ungefähr etwa ' + DAYS.join(' ') + ' ';
  var WORK = ['angebot', 'kunde', 'kundin', 'meeting', 'besprechung', 'mail', 'steuer', 'rechnung', 'chef', 'chefin',
    'projekt', 'büro', 'arbeit', 'präsentation', 'vertrag', 'kollege', 'kollegin', 'bericht', 'bewerbung', 'firma', 'termin mit'];
  var IDEA = ['idee', 'vielleicht', 'irgendwann', 'podcast', 'urlaub', 'blog', 'konzept', 'könnte man', 'wäre cool',
    'wäre schön', 'traum', 'eines tages', 'ausprobieren'];
  var HOT = ['wichtig', 'dringend', 'unbedingt', 'sofort', 'nicht vergessen', 'auf keinen fall vergessen'];

  /* ---------- Datum (immer UTC-Mitternacht, damit Zeitzonen nichts verschieben) ---------- */
  function toDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    if (!m) return null;
    var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
    return d;
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toIso(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function addDays(iso, n) { var d = toDate(iso); d.setUTCDate(d.getUTCDate() + n); return toIso(d); }
  function diffDays(a, b) { return Math.round((toDate(a) - toDate(b)) / 86400000); }
  function todayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function parseDue(text, today) {
    var low = ' ' + text.toLowerCase().replace(/[,;:!?()„“"]/g, ' ') + ' ';
    var m = /(^|\s)(\d{1,2})\.(\d{1,2})\.(\d{4})?/.exec(low);
    if (m) {
      var year = m[4] ? +m[4] : +today.slice(0, 4);
      var iso = year + '-' + pad(+m[3]) + '-' + pad(+m[2]);
      if (toDate(iso)) {
        if (!m[4] && diffDays(iso, today) < 0) iso = (year + 1) + iso.slice(4);
        return iso;
      }
    }
    var words = low.replace(/\./g, ' ');
    if (words.indexOf(' heute ') >= 0) return today;
    if (words.indexOf(' übermorgen ') >= 0) return addDays(today, 2);
    if (words.indexOf(' morgen ') >= 0) return addDays(today, 1);
    var wd = toDate(today).getUTCDay();
    for (var i = 0; i < 7; i += 1) {
      if (words.indexOf(' ' + DAYS[i] + ' ') >= 0) {
        var ahead = (i - wd + 7) % 7;
        return addDays(today, ahead === 0 ? 7 : ahead);
      }
    }
    if (words.indexOf(' wochenende ') >= 0) return addDays(today, (6 - wd + 7) % 7);
    if (words.indexOf(' nächste woche ') >= 0 || words.indexOf(' nächster woche ') >= 0) return addDays(today, 7);
    return null;
  }

  function dueLabel(due, today) {
    if (!due || !toDate(due)) return '';
    var n = diffDays(due, today);
    if (n < 0) return 'Überfällig';
    if (n === 0) return 'Heute';
    if (n === 1) return 'Morgen';
    var d = toDate(due);
    return DAY_SHORT[d.getUTCDay()] + ', ' + d.getUTCDate() + '.' + (d.getUTCMonth() + 1) + '.';
  }

  /* ---------- Kern erkennen (ohne KI) ---------- */
  function cleanWord(w) {
    return w.replace(/^[^A-Za-zÄÖÜäöüß0-9]+/, '').replace(/[^A-Za-zÄÖÜäöüß0-9]+$/, '');
  }
  function capTitle(t) {
    t = t.replace(/\s+/g, ' ').replace(/[\s.,;:!?]+$/, '').trim();
    if (!t) return '';
    t = t.charAt(0).toUpperCase() + t.slice(1);
    /* Zu lang: erst ganze Wörter weglassen, nur ein einzelnes Riesenwort wird gekürzt. */
    while (t.length > 24 && t.indexOf(' ') > 0) t = t.slice(0, t.lastIndexOf(' '));
    if (t.length > 24) t = t.slice(0, 23) + '…';
    return t;
  }
  function hasAny(low, list) {
    for (var i = 0; i < list.length; i += 1) if (low.indexOf(list[i]) >= 0) return true;
    return false;
  }
  /* Satzgrenzen, ohne ein Datum wie "3.12." zu zerreißen. */
  function splitThoughts(text) {
    var out = [], start = 0, re = /[.!?;]\s+/g, m;
    while ((m = re.exec(text))) {
      var before = text.charAt(m.index - 1);
      if (/\d/.test(before) && text.charAt(m.index) === '.') continue;
      out.push(text.slice(start, m.index + 1));
      start = m.index + m[0].length;
    }
    out.push(text.slice(start));
    return out.map(function (s) { return s.trim(); }).filter(function (s) { return cleanWord(s).length > 0; });
  }
  /* Welche Wörter eines Satzes den Kern bilden (für die Markierung in der Anzeige). */
  function keyFlags(words) {
    var kept = 0;
    return words.map(function (w) {
      if (/^\d{1,2}\.\d{1,2}\.?(\d{4})?$/.test(w)) return false;
      var c = cleanWord(w).toLowerCase();
      if (c.length > 1 && STOP.indexOf(' ' + c + ' ') < 0 && kept < 3) { kept += 1; return true; }
      return false;
    });
  }
  function analyzeOne(text, today) {
    var words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
    var flags = keyFlags(words);
    var title = capTitle(words.filter(function (w, i) { return flags[i]; }).map(cleanWord).join(' '));
    if (!title) title = capTitle(text) || 'Notiz';
    var low = ' ' + text.toLowerCase() + ' ';
    var cat = hasAny(low, WORK) ? 'a' : (hasAny(low, IDEA) ? 'i' : 'p');
    var due = parseDue(text, today);
    var soon = due !== null && diffDays(due, today) <= 2;
    return { title: title, cat: cat, important: soon || hasAny(low, HOT), due: due, text: text };
  }
  function analyze(text, today) {
    today = today || todayISO();
    return splitThoughts(String(text || '').trim()).slice(0, 5).map(function (s) { return analyzeOne(s, today); });
  }

  /* Antwort der KI prüfen; null heißt: lieber selbst auswerten. */
  function normalizeAI(raw, text, today) {
    var list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.items) ? raw.items : (raw && typeof raw === 'object' ? [raw] : null));
    if (!list) return null;
    var out = [];
    list.slice(0, 5).forEach(function (r) {
      if (!r || typeof r.title !== 'string') return;
      var title = capTitle(r.title);
      if (!title) return;
      var due = typeof r.due === 'string' && toDate(r.due) ? r.due : null;
      out.push({
        title: title,
        cat: CATS[r.cat] ? r.cat : 'p',
        important: r.important === true,
        due: due,
        text: typeof r.text === 'string' && r.text.trim() ? r.text.trim() : text
      });
    });
    return out.length ? out : null;
  }

  /* ---------- Platz in der Karte ---------- */
  function fixedRects() {
    var out = [CORE_RECT];
    CAT_ORDER.forEach(function (c) { out.push({ x: HUBS[c].x, y: HUBS[c].y, w: HUB_SIZE.w, h: HUB_SIZE.h }); });
    return out;
  }
  function hit(a, b) {
    return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + GAP && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + GAP;
  }
  function isFree(rect, rects) {
    var blocked = fixedRects().concat(rects || []);
    for (var i = 0; i < blocked.length; i += 1) if (hit(rect, blocked[i])) return false;
    return true;
  }
  /* Markiert im gesprochenen Satz die Wörter, die im Kern vorkommen (z. B. nach einer KI-Auswertung). */
  function titleFlags(words, titles) {
    var set = {};
    titles.forEach(function (t) {
      String(t).split(/\s+/).forEach(function (w) { var c = cleanWord(w).toLowerCase(); if (c.length > 1) set[c] = true; });
    });
    var flags = words.map(function (w) { return set[cleanWord(w).toLowerCase()] === true; });
    return flags.indexOf(true) >= 0 ? flags : keyFlags(words);
  }
  var candCache = {};
  function candidates(cat) {
    if (candCache[cat]) return candCache[cat];
    var hub = HUBS[cat], hl = Math.sqrt(hub.x * hub.x + hub.y * hub.y), list = [];
    for (var x = -560; x <= 560; x += 14) {
      for (var y = -1400; y <= 1400; y += 14) {
        var len = Math.sqrt(x * x + y * y);
        if (len < 60) continue;
        if ((x * hub.x + y * hub.y) / (len * hl) < 0.47) continue; /* nur im eigenen Sektor */
        var dx = (x - hub.x) * 1.15, dy = y - hub.y;
        list.push({ x: x, y: y, c: dx * dx + dy * dy });
      }
    }
    list.sort(function (p, q) { return p.c - q.c; });
    candCache[cat] = list;
    return list;
  }
  /* Nächster freier Platz beim Bereich; vorhandene Gedanken bleiben, wo sie sind. */
  function place(size, rects, cat) {
    var blocked = fixedRects().concat(rects || []);
    var list = candidates(CATS[cat] ? cat : 'p');
    for (var i = 0; i < list.length; i += 1) {
      var r = { x: list[i].x, y: list[i].y, w: size.w, h: size.h }, free = true;
      for (var j = 0; j < blocked.length; j += 1) {
        if (hit(r, blocked[j])) { free = false; break; }
      }
      if (free) return { x: r.x, y: r.y };
    }
    var last = list[list.length - 1];
    return { x: last.x, y: last.y };
  }

  /* ---------- Sortierter Text fürs PDF und die Liste ---------- */
  function byHot(a, b) {
    if (a.important !== b.important) return a.important ? -1 : 1;
    if (a.due !== b.due) {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due < b.due ? -1 : 1;
    }
    return a.created - b.created;
  }
  function byDue(a, b) {
    if (a.due !== b.due) {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due < b.due ? -1 : 1;
    }
    return a.created - b.created;
  }
  function metaOf(n, today) {
    var parts = [];
    var d = dueLabel(n.due, today);
    if (d) parts.push(d);
    if (n.important) parts.push('wichtig');
    return parts.join(' · ');
  }
  function docModel(notes, opts, today) {
    today = today || todayISO();
    opts = opts || {};
    var open = notes.filter(function (n) { return !n.done; });
    var item = function (n) {
      return { id: n.id, title: n.title, meta: n.done ? '' : metaOf(n, today), text: n.text || '', done: !!n.done, important: !!n.important, cat: n.cat };
    };
    var groups = [];
    var add = function (title, list) { if (list.length) groups.push({ title: title, items: list.map(item) }); };
    if (opts.sort === 'hot') {
      add('Wichtig', open.filter(function (n) { return n.important; }).sort(byDue));
      add('Weitere', open.filter(function (n) { return !n.important; }).sort(byDue));
    } else {
      CAT_ORDER.forEach(function (c) {
        add(CATS[c].label, open.filter(function (n) { return n.cat === c; }).sort(byHot));
      });
    }
    if (opts.withDone) {
      add('Erledigt', notes.filter(function (n) { return !!n.done; }).sort(function (a, b) { return b.done - a.done; }));
    }
    var d = toDate(today);
    return {
      title: 'Gedanken',
      subtitle: 'Stand ' + pad(d.getUTCDate()) + '.' + pad(d.getUTCMonth() + 1) + '.' + d.getUTCFullYear() +
        ' · sortiert nach ' + (opts.sort === 'hot' ? 'Wichtigkeit' : 'Bereich'),
      groups: groups
    };
  }
  function fileName(today) { return 'Gedanken-' + (today || todayISO()) + '.pdf'; }

  return {
    CATS: CATS, CAT_ORDER: CAT_ORDER, HUBS: HUBS, HUB_SIZE: HUB_SIZE, CORE_RECT: CORE_RECT,
    analyze: analyze, keyFlags: keyFlags, normalizeAI: normalizeAI, parseDue: parseDue, dueLabel: dueLabel,
    todayISO: todayISO, addDays: addDays, place: place, fixedRects: fixedRects, isFree: isFree, titleFlags: titleFlags,
    byHot: byHot, metaOf: metaOf, docModel: docModel, fileName: fileName
  };
});
