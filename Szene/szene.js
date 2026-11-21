/* Lebensgalaxie: die 3D-Szene. Läuft ohne Netz in der Web-Ansicht der App.
   Von der App aufgerufen: Szene.setze(daten), modus(m), funke(), verschmelze(), zeit(t), raender(oben, unten), waehle(null).
   Meldet an die App: {typ:'bereit'}, {typ:'wahl', art, id}, {typ:'haptik', art}, {typ:'verschmolzen'}. */
(function () {
'use strict';

var FARBE = { menschen: '#FF8FA8', arbeit: '#FFC857', gesundheit: '#6EE7B7', geld: '#6FD3FF', traeume: '#C3A6FF' };
var WEISS = '#EDEAFF';
var host = window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.app;
function melde(m) { try { if (host) host.postMessage(m); else (window.__meldungen = window.__meldungen || []).push(m); } catch (e) {} }

var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var canvas = document.getElementById('gl'), schilderEl = document.getElementById('schilder'), blende = document.getElementById('blende');
var renderer;
try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
catch (e) { melde({ typ: 'fehler', text: 'WebGL nicht verfügbar' }); return; }
renderer.setClearColor(0x06051A, 1);

var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(50, 1, 1, 8000);
var galaxie = new THREE.Group(), system = new THREE.Group();
scene.add(galaxie); scene.add(system); system.visible = false;

/* ---------- Zufall mit festem Startwert, damit die Galaxie bei jedem Öffnen gleich aussieht ---------- */
var saat = 7;
function rnd() { saat |= 0; saat = saat + 0x6D2B79F5 | 0; var t = Math.imul(saat ^ saat >>> 15, 1 | saat); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
function gauss() { var u = 0; for (var i = 0; i < 4; i++) u += rnd(); return (u - 2) / 1.15; }

/* ---------- Texturen ---------- */
function verlauf(stops) { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d');
  var gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); }
function ringBild(breite) { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = breite; g.beginPath(); g.arc(64, 64, 58, 0, 7); g.stroke(); return new THREE.CanvasTexture(c); }
var glowTex = verlauf([[0, 'rgba(255,255,255,1)'], [.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
var darkTex = verlauf([[0, 'rgba(4,3,16,1)'], [.5, 'rgba(4,3,16,.92)'], [1, 'rgba(4,3,16,0)']]);
var ringTex = ringBild(4), duennTex = ringBild(1.5);
function sprite(map, color, scale, add) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: map, color: color, transparent: true, depthWrite: false, depthTest: false, blending: add === false ? THREE.NormalBlending : THREE.AdditiveBlending })); s.scale.set(scale, scale, 1); return s; }

/* ---------- Punktwolken ---------- */
var uni = { uT: { value: 999 }, uH: { value: 500 }, uTime: { value: 0 }, uFade: { value: 1 } };
function punktMat(deckkraft) { return new THREE.ShaderMaterial({ uniforms: { uOp: { value: deckkraft }, uT: uni.uT, uH: uni.uH, uTime: uni.uTime, uFade: uni.uFade }, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  vertexShader: 'attribute float size;attribute vec3 aColor;attribute float aT;attribute float aPh;uniform float uT;uniform float uH;uniform float uTime;varying vec3 vC;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;float tw=.78+.22*sin(uTime*1.4+aPh);gl_PointSize=max(1.,size*tw*uH/-mv.z);vC=aColor;vA=1.-smoothstep(uT,uT+.5,aT);}',
  fragmentShader: 'precision mediump float;uniform float uOp;uniform float uFade;varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);gl_FragColor=vec4(vC,a*a*vA*uOp*uFade);}' }); }
function punkte(liste, deckkraft, order) { var n = liste.length, p = new Float32Array(n * 3), c = new Float32Array(n * 3), s = new Float32Array(n), t = new Float32Array(n), ph = new Float32Array(n);
  liste.forEach(function (o, i) { p[i * 3] = o.pos.x; p[i * 3 + 1] = o.pos.y; p[i * 3 + 2] = o.pos.z; c[i * 3] = o.col[0]; c[i * 3 + 1] = o.col[1]; c[i * 3 + 2] = o.col[2]; s[i] = o.size; t[i] = o.t; ph[i] = rnd() * 6.28; });
  var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aColor', new THREE.BufferAttribute(c, 3)); g.setAttribute('size', new THREE.BufferAttribute(s, 1)); g.setAttribute('aT', new THREE.BufferAttribute(t, 1)); g.setAttribute('aPh', new THREE.BufferAttribute(ph, 1));
  var pts = new THREE.Points(g, punktMat(deckkraft)); pts.renderOrder = order; pts.frustumCulled = false; return pts; }
function rgb(h) { var c = new THREE.Color(h); return [c.r, c.g, c.b]; }
function misch(a, b, k) { return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }

/* ---------- Ferne Sterne, immer sichtbar ---------- */
(function () { var l = []; for (var i = 0; i < 900; i++) { var v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(2400 + rnd() * 700), b = .35 + rnd() * .65; l.push({ pos: v, col: [b, b, b * 1.1], size: 15 + rnd() * 17, t: -1 }); }
  var p = punkte(l, .8, 0); p.material.uniforms.uT = { value: 999 }; p.material.uniforms.uFade = { value: 1 }; scene.add(p); })();

/* ---------- Zustand ---------- */
var daten = null, A = 31, K = 5.35, T = 999;
var modus = 'galaxie', klein = Math.min(window.innerWidth, window.innerHeight) < 500;
var ziel = new THREE.Vector3(), cam = { theta: -.4, phi: .14, zoom: 2.4 };
var baseR = 800, W = 1, H = 1, randOben = 0, randUnten = 0, letzteBeruehrung = -9999, einflug = reduce ? 1 : 0, gestartet = false;
var fokus = 0, uebergang = null, verschmelzen = -1, zoomFaktor = 1;
var heutePos = new THREE.Vector3(), heuteGlow, heuteRing, stoss, funken = [], wolken = [], nebel = [], schilder = [], waehlbar = [], planeten = [];
var auswahl = null, auswahlRing = sprite(duennTex, 0xffffff, 20); auswahlRing.renderOrder = 20; auswahlRing.visible = false; scene.add(auswahlRing);
var v = new THREE.Vector3(), uhr = new THREE.Clock();

function sp(t, off, y) { var th = t / 10 * Math.PI * 2, r = 10 + t * K + (off || 0); return new THREE.Vector3(Math.cos(th) * r, y || 0, Math.sin(th) * r); }
function leere(gruppe) { while (gruppe.children.length) { var o = gruppe.children[0]; gruppe.remove(o); if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose && !o.material.map) o.material.dispose(); } }
function schild(text, klasse, eintrag) { var el = document.createElement('div'); el.className = 'schild ' + (klasse || ''); if (klasse === 'heute') { var s = document.createElement('span'); s.textContent = text; el.appendChild(s); } else el.textContent = text;
  schilderEl.appendChild(el); eintrag.el = el; eintrag.breite = text.length * (klasse === 'planet' ? 8 : 6.6) + 14; schilder.push(eintrag); return eintrag; }

/* ---------- Galaxie ---------- */
function baueGalaxie() {
  leere(galaxie); wolken = []; nebel = []; funken = [];
  saat = 7;
  var warm = [1, .84, .6], vio = [.62, .46, 1], blau = [.42, .62, 1], rosa = [1, .5, .72], l = [], N = klein ? 15000 : 22000, i, t, pos, col, b;
  for (i = 0; i < N; i++) {
    if (rnd() < .14) { var r = 10 + Math.pow(rnd(), .7) * 172, a = rnd() * 6.283; t = Math.max(0, (r - 10) / K); pos = new THREE.Vector3(Math.cos(a) * r, gauss() * 3, Math.sin(a) * r); }
    else { t = A * Math.pow(rnd(), .72); pos = sp(t, gauss() * (4.5 + t / A * 6.4), gauss() * (2.2 + 7 * Math.exp(-t / A * 9))); }
    var k = t / A; col = k < .28 ? misch(warm, vio, k / .28) : misch(vio, blau, (k - .28) / .72); if (rnd() < .07) col = rosa; b = .3 + rnd() * .7;
    l.push({ pos: pos, col: [col[0] * b, col[1] * b, col[2] * b], size: 2 + Math.pow(rnd(), 3) * 9, t: t });
  }
  for (t = A + .15 * A / 31; t < A * 1.14; t += A * .0042) l.push({ pos: sp(t), col: [.75, .7, 1], size: 2.2, t: -1 });
  galaxie.add(punkte(l, .5, 1));
  for (t = A * .03; t < A; t += A * .0145) { var kk = t / A, n = sprite(glowTex, new THREE.Color().setRGB(.62 - .2 * kk, .46 + .14 * kk, 1), 34 + kk * 28); n.material.opacity = .075; n.position.copy(sp(t)); n.renderOrder = 1; n.userData.t = t; galaxie.add(n); nebel.push(n); }
  var kern = sprite(glowTex, 0xFFD9A0, 95); kern.renderOrder = 2; galaxie.add(kern);
  var kern2 = sprite(glowTex, 0xFFF6E6, 30); kern2.renderOrder = 2; galaxie.add(kern2);

  // Dunkelwolken: schwere Phasen
  (daten.wolken || []).forEach(function (w) {
    var mitte = (w.t0 + w.t1) / 2, rr = 10 + mitte * K, bogen = rr * (w.t1 - w.t0) / 10 * 6.283, stk = Math.max(1, Math.ceil(bogen / 9)), groesse = Math.min(62, 40 + bogen * .12);
    for (var j = 0; j < stk; j++) { var tt = stk === 1 ? mitte : w.t0 + (w.t1 - w.t0) * j / (stk - 1); var s = sprite(darkTex, 0xffffff, groesse, false); s.position.copy(sp(tt)); s.renderOrder = 4; s.userData.t = w.t0; galaxie.add(s); wolken.push(s); }
    var p = sp(mitte);
    var rand = sprite(duennTex, 0xA898E8, groesse * .78 + bogen * .5); rand.material.opacity = w.offen ? .75 : .45; rand.position.copy(p); rand.renderOrder = 5; rand.userData.t = w.t0; galaxie.add(rand); wolken.push(rand);
    waehlbar.push({ modus: 'galaxie', art: 'wolke', id: w.id, t: w.t0, pos: function () { return p; }, radius: groesse * .4 });
    schild(w.name, 'wolke', { modus: 'galaxie', t: w.t0, prio: w.offen ? 9 : 7.5, pos: function () { return p; }, dy: 14 });
  });
  function inWolke(t) { return (daten.wolken || []).some(function (w) { return t > w.t0 - .12 && t < w.t1 + .12; }); }

  // Sterne des Lebens
  l = [];
  var beschriftet = (daten.sterne || []).filter(function (s) { return s.art === 'ereignis' && s.gewicht >= 2; }).sort(function (a, b) { return b.gewicht - a.gewicht || b.t - a.t; }).slice(0, 14);
  (daten.sterne || []).forEach(function (s) {
    var tag = s.art === 'tag', p = sp(s.t, tag ? gauss() * 3.5 : 0, tag ? gauss() * 1.2 : 0), farbe = rgb(FARBE[s.bereich] || WEISS);
    l.push({ pos: p, col: farbe, size: tag ? 6 : [9, 9, 15, 21][s.gewicht] || 9, t: s.t });
    waehlbar.push({ modus: 'galaxie', art: tag ? 'tag' : 'stern', id: s.id, t: s.t, pos: function () { return p; }, radius: tag ? 3 : 6 });
    if (beschriftet.indexOf(s) >= 0) schild(s.name, '', { modus: 'galaxie', t: s.t, prio: s.gewicht * 2 + s.t / A, pos: function () { return p; } });
  });
  // Staub des Alltags zwischen den echten Sternen, damit der Arm nie kahl wirkt
  for (i = 0; i < 150; i++) { t = A * (.02 + .97 * Math.pow(rnd(), .62)); if (inWolke(t)) continue; var f = Object.keys(FARBE)[Math.floor(rnd() * 5)]; l.push({ pos: sp(t, gauss() * 4.5, gauss() * 1.5), col: rgb(FARBE[f]).map(function (x) { return x * .75; }), size: 4 + rnd() * 3, t: t }); }
  galaxie.add(punkte(l, 1, 6));
  var mitteP = new THREE.Vector3();
  waehlbar.push({ modus: 'galaxie', art: 'geburt', id: '', t: 0, pos: function () { return mitteP; }, radius: 8 });
  schild('Geburt ' + daten.geburtsjahr, '', { modus: 'galaxie', t: 0, prio: 5, pos: function () { return mitteP; }, dy: 14 });

  // Heute
  heutePos = sp(A);
  heuteGlow = sprite(glowTex, daten.tagZu ? 0xFFE2B0 : 0xffffff, daten.tagZu ? 48 : 30); heuteGlow.position.copy(heutePos); heuteGlow.renderOrder = 8; galaxie.add(heuteGlow);
  heuteRing = sprite(ringTex, 0xffffff, 22); heuteRing.position.copy(heutePos); heuteRing.renderOrder = 8; heuteRing.material.opacity = .7; galaxie.add(heuteRing);
  stoss = sprite(duennTex, 0xFFD08A, 1); stoss.position.copy(heutePos); stoss.renderOrder = 9; stoss.visible = false; galaxie.add(stoss);
  waehlbar.push({ modus: 'galaxie', art: 'heute', id: '', t: A, pos: function () { return heutePos; }, radius: 9, vorrang: true });
  schild('Heute', 'heute', { modus: 'galaxie', t: A, prio: 99, pos: function () { return heutePos; }, heute: true });
  for (i = 0; i < (daten.funken || 0); i++) neuerFunke(false);
}

function neuerFunke(fliegt) {
  var s = sprite(glowTex, 0xFFE2B0, 7); s.renderOrder = 9; galaxie.add(s);
  var o = { s: s, ang: Math.random() * 6.28, rad: 9 + Math.random() * 6, tilt: (Math.random() - .5) * 1.2, speed: .9 + Math.random() * .8, flug: fliegt ? 0 : 1, von: null };
  if (fliegt) { var p = new THREE.Vector3(0, -.75, .5).unproject(camera), dir = p.sub(camera.position).normalize(); o.von = camera.position.clone().add(dir.multiplyScalar(camera.position.distanceTo(ziel) * .6)); }
  funken.push(o);
}

/* ---------- Sonnensystem ---------- */
function planetBild(farbe, art) {
  var c = document.createElement('canvas'); c.width = 256; c.height = 128; var g = c.getContext('2d'), basis = new THREE.Color(farbe), i, y;
  function ton(l, s) { var k = basis.clone(); k.offsetHSL(0, s || 0, l); return '#' + k.getHexString(); }
  g.fillStyle = ton(-.1); g.fillRect(0, 0, 256, 128);
  function fleck(x, yy, rx, ry, f, a) { g.globalAlpha = a; g.fillStyle = f; [-256, 0, 256].forEach(function (dx) { g.beginPath(); g.ellipse(x + dx, yy, rx, ry, 0, 0, 7); g.fill(); }); g.globalAlpha = 1; }
  if (art === 'baender') { for (y = 0; y < 128;) { var h = 4 + rnd() * 13; g.fillStyle = ton((rnd() - .5) * .3, (rnd() - .5) * .2); g.fillRect(0, y, 256, h); y += h; }
    for (i = 0; i < 26; i++) fleck(rnd() * 256, rnd() * 128, 14 + rnd() * 40, 1.5 + rnd() * 3, ton((rnd() - .4) * .3), .35); }
  else if (art === 'land') { for (i = 0; i < 34; i++) fleck(rnd() * 256, 14 + rnd() * 100, 8 + rnd() * 30, 5 + rnd() * 14, ton(-.12 - rnd() * .16, -.1), .55);
    for (i = 0; i < 20; i++) fleck(rnd() * 256, rnd() * 128, 10 + rnd() * 30, 2 + rnd() * 5, '#ffffff', .22); }
  else if (art === 'eis') { for (y = 0; y < 128;) { var hh = 6 + rnd() * 16; g.fillStyle = ton((rnd() - .5) * .14); g.fillRect(0, y, 256, hh); y += hh; }
    var gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.2, 'rgba(255,255,255,0)'); gr.addColorStop(.8, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.95)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); }
  else { for (i = 0; i < 46; i++) fleck(rnd() * 256, rnd() * 128, 10 + rnd() * 34, 4 + rnd() * 12, ton((rnd() - .4) * .3, (rnd() - .5) * .15), .4); }
  return new THREE.CanvasTexture(c);
}
var BAHN = { menschen: [34, 'wolkig', .5], gesundheit: [57, 'land', 2.5], arbeit: [81, 'baender', 4.0], geld: [105, 'eis', 5.6], traeume: [131, 'baender', 1.35] };
var STRECK = 1.5; // Bahnen sind zum Betrachter hin gestreckt, damit sie ein hohes Display füllen

function baueSystem() {
  leere(system); planeten = []; saat = 99;
  system.add(new THREE.AmbientLight(0x6a64a0, .55));
  var licht = new THREE.PointLight(0xfff0d8, 1.55, 0, 0); system.add(licht);
  var sonne = new THREE.Mesh(new THREE.SphereGeometry(11, 32, 24), new THREE.MeshBasicMaterial({ color: 0xFFF2D6 })); system.add(sonne);
  var g1 = sprite(glowTex, 0xFFD08A, 170); g1.renderOrder = 1; system.add(g1); var g2 = sprite(glowTex, 0xFFF6E6, 60); g2.renderOrder = 2; system.add(g2);
  var null0 = new THREE.Vector3();
  waehlbar.push({ modus: 'system', art: 'sonne', id: '', pos: function () { return null0; }, radius: 12 });
  schild(daten.rufname || 'Du', 'planet', { modus: 'system', prio: 50, pos: function () { return null0; }, dy: 26 });

  (daten.planeten || []).forEach(function (pl) {
    var cfg = BAHN[pl.bereich]; if (!cfg) return;
    var R = cfg[0], r = 11 + Math.min(12, pl.eintraege) * .45, farbe = FARBE[pl.bereich];
    var pts = []; for (var i = 0; i <= 128; i++) pts.push(new THREE.Vector3(Math.cos(i / 128 * 6.2832) * R, 0, Math.sin(i / 128 * 6.2832) * R * STRECK));
    system.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x9a90e6, transparent: true, opacity: .22 })));
    var gruppe = new THREE.Group(); system.add(gruppe);
    var kugel = new THREE.Mesh(new THREE.SphereGeometry(r, 40, 28), new THREE.MeshStandardMaterial({ map: planetBild(farbe, cfg[1]), roughness: .95, metalness: 0, emissive: new THREE.Color(farbe), emissiveIntensity: pl.zustand === 'sturm' ? .04 : .13 }));
    kugel.rotation.z = .25; gruppe.add(kugel);
    var hof = sprite(glowTex, farbe, r * (pl.zustand === 'hell' ? 5 : 3.1)); hof.material.opacity = pl.zustand === 'hell' ? .42 : .16; hof.renderOrder = 1; gruppe.add(hof);
    var sturm = [], blitz = null;
    if (pl.zustand === 'sturm') {
      for (var k = 0; k < 7; k++) { var d = new THREE.Vector3(gauss(), gauss() * .6, gauss()).normalize().multiplyScalar(r * .82); var s = sprite(darkTex, 0xffffff, r * 1.5, false); s.material.depthTest = true; s.material.opacity = .82; s.position.copy(d); s.renderOrder = 5; kugel.add(s); sturm.push(s); }
      blitz = sprite(glowTex, 0xE8ECFF, r * 1.4); blitz.material.opacity = 0; blitz.renderOrder = 6; gruppe.add(blitz);
    }
    if (pl.bereich === 'traeume') { var ring = new THREE.Mesh(new THREE.RingGeometry(r * 1.4, r * 2.1, 72), new THREE.MeshBasicMaterial({ color: farbe, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = Math.PI / 2 - .38; gruppe.add(ring); }
    var eintrag = { gruppe: gruppe, kugel: kugel, hof: hof, blitz: blitz, R: R, r: r, ang: cfg[2], tempo: 3.2 / R, zustand: pl.zustand, monde: [], naechsterBlitz: 1 + Math.random() * 3 };
    (pl.monde || []).slice(0, 6).forEach(function (m, j) {
      var mat = m.art === 'ziel' ? new THREE.MeshBasicMaterial({ color: 0xFFD08A }) : new THREE.MeshStandardMaterial({ color: m.art === 'mensch' ? 0xF4E9DD : 0xAEB6D8, roughness: 1 });
      var mesh = new THREE.Mesh(new THREE.SphereGeometry(m.art === 'ziel' ? 1.9 : 2.4, 16, 12), mat); system.add(mesh);
      var mo = { mesh: mesh, rad: r + 6 + j * 3.2, ang: Math.random() * 6.28, tempo: .55 / (1 + j * .3), neig: (Math.random() - .5) * .7 };
      eintrag.monde.push(mo);
      waehlbar.push({ modus: 'system', art: 'mond', id: m.id, pos: function () { return mesh.position; }, radius: 3 });
      schild(m.name, 'mond', { modus: 'system', prio: 1, pos: function () { return mesh.position; }, mond: true, planet: pl.bereich, dy: -6 });
    });
    planeten.push(eintrag);
    waehlbar.push({ modus: 'system', art: 'planet', id: pl.bereich, pos: function () { return gruppe.position; }, radius: r + 2, vorrang: true });
    schild(pl.name, 'planet', { modus: 'system', prio: 30, pos: function () { return gruppe.position; }, dy: r + 13, farbe: farbe });
  });
  schilder.forEach(function (s) { if (s.farbe) s.el.style.color = s.farbe; });
  bewegeSystem(0);
}
function bewegeSystem(dt) {
  planeten.forEach(function (p) {
    p.ang += dt * p.tempo * .12; p.gruppe.position.set(Math.cos(p.ang) * p.R, 0, Math.sin(p.ang) * p.R * STRECK); p.kugel.rotation.y += dt * .12;
    p.monde.forEach(function (m) { m.ang += dt * m.tempo; var c = Math.cos(m.ang) * m.rad, s = Math.sin(m.ang) * m.rad; m.mesh.position.set(p.gruppe.position.x + c, s * Math.sin(m.neig), p.gruppe.position.z + s * Math.cos(m.neig)); });
    if (p.blitz && !reduce) { p.naechsterBlitz -= dt; if (p.naechsterBlitz < 0) { p.naechsterBlitz = 1.2 + Math.random() * 3.5; p.blitzZeit = .16; p.blitz.position.set((Math.random() - .5) * p.r, (Math.random() - .5) * p.r, (Math.random() - .5) * p.r); }
      p.blitzZeit = Math.max(0, (p.blitzZeit || 0) - dt); p.blitz.material.opacity = p.blitzZeit > 0 ? .85 : 0; }
    if (p.zustand === 'hell' && !reduce) p.hof.material.opacity = .36 + .08 * Math.sin(uni.uTime.value * 1.6 + p.R);
  });
}

/* ---------- Daten übernehmen ---------- */
function setze(neu) {
  if (typeof neu === 'string') { try { neu = JSON.parse(neu); } catch (e) { return; } }
  if (!neu) return;
  daten = neu; A = Math.max(1, daten.alter || 1); K = 166 / A; T = 999; uni.uT.value = 999;
  schilderEl.textContent = ''; schilder = []; waehlbar = []; auswahl = null; auswahlRing.visible = false;
  baueGalaxie(); baueSystem();
  galaxie.visible = modus === 'galaxie'; system.visible = modus === 'system';
  if (!gestartet) { gestartet = true; if (reduce) { cam.theta = startTheta(); cam.phi = .8; cam.zoom = 1; } }
}
function startTheta() { return A / 10 * Math.PI * 2 + .45; }

/* ---------- Größe und Ränder ---------- */
function groesse() {
  W = window.innerWidth; H = window.innerHeight; if (!W || !H) return; klein = Math.min(W, H) < 500;
  var pr = Math.min(window.devicePixelRatio || 1, 2); renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
  camera.aspect = W / H; var tanH = Math.tan(25 * Math.PI / 180), frei = Math.max(.35, (H - randOben - randUnten) / H);
  baseR = Math.max(186 / (tanH * Math.min(camera.aspect, frei * 1.05)), 400);
  camera.setViewOffset(W, H, 0, Math.round((randUnten - randOben) / 2), W, H); camera.updateProjectionMatrix(); uni.uH.value = (H * pr / 2) / tanH;
}
window.addEventListener('resize', groesse); groesse();

/* ---------- Berührung ---------- */
var zeiger = new Map(), abstand = 0, tipp = null;
canvas.addEventListener('pointerdown', function (e) { try { canvas.setPointerCapture(e.pointerId); } catch (x) {} zeiger.set(e.pointerId, [e.clientX, e.clientY]); abstand = 0; einflug = 1; tipp = zeiger.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; });
canvas.addEventListener('pointermove', function (e) { if (!zeiger.has(e.pointerId)) return; var p = zeiger.get(e.pointerId), dx = e.clientX - p[0], dy = e.clientY - p[1]; zeiger.set(e.pointerId, [e.clientX, e.clientY]); letzteBeruehrung = performance.now();
  if (tipp && Math.hypot(e.clientX - tipp.x, e.clientY - tipp.y) > 9) tipp = null;
  if (uebergang) return;
  if (zeiger.size === 1) { cam.theta += dx * .006; cam.phi = Math.min(1.42, Math.max(.12, cam.phi - dy * .005)); }
  else if (zeiger.size === 2) { var a = Array.from(zeiger.values()), d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (abstand) cam.zoom = Math.min(1.7, Math.max(.28, cam.zoom * abstand / d)); abstand = d; } });
function los(e) { zeiger.delete(e.pointerId); abstand = 0; if (tipp && e.type === 'pointerup' && performance.now() - tipp.t < 450) tippe(tipp.x, tipp.y); tipp = null; }
canvas.addEventListener('pointerup', los); canvas.addEventListener('pointercancel', los);
canvas.addEventListener('wheel', function (e) { e.preventDefault(); cam.zoom = Math.min(1.7, Math.max(.28, cam.zoom * (1 + e.deltaY * .0012))); einflug = 1; }, { passive: false });

function tippe(x, y) {
  var beste = null, besteD = 1e9;
  waehlbar.forEach(function (o) { if (o.modus !== modus) return; if (o.t !== undefined && o.t > T + .05) return; v.copy(o.pos()).project(camera); if (v.z > 1) return;
    var px = (v.x * .5 + .5) * W, py = (-v.y * .5 + .5) * H, d = Math.hypot(px - x, py - y) - (o.vorrang ? 10 : 0); if (d < 30 && d < besteD) { besteD = d; beste = o; } });
  auswahl = beste; melde(beste ? { typ: 'wahl', art: beste.art, id: beste.id } : { typ: 'wahl', art: 'nichts', id: '' });
  if (beste) melde({ typ: 'haptik', art: 'leicht' });
}

/* ---------- Schleife ---------- */
function weich(x) { return 1 - Math.pow(1 - x, 3); }
function bild() {
  window.requestAnimationFrame(bild); if (!daten) return;
  var dt = Math.min(uhr.getDelta(), .05), zeit = uhr.elapsedTime; uni.uTime.value = reduce ? 0 : zeit;
  if (einflug < 1) { einflug = Math.min(1, einflug + dt / 4.2); var k = weich(einflug), st = startTheta(); cam.phi = .14 + (.8 - .14) * k; cam.zoom = 2.4 + (1 - 2.4) * k; cam.theta = st - 2.3 + 2.3 * k; }
  else if (!reduce && !zeiger.size && performance.now() - letzteBeruehrung > 2500 && verschmelzen < 0 && !uebergang) { if (modus === 'galaxie') cam.theta += dt * .035; }

  // Wechsel zwischen Galaxie und Sonnensystem: hineinzoomen, abblenden, wechseln, aufblenden
  zoomFaktor = 1;
  if (uebergang) {
    uebergang.k += dt / (reduce ? .01 : 1.5); var u = Math.min(1, uebergang.k), h1 = Math.min(1, u * 2), h2 = Math.max(0, u * 2 - 1);
    if (!uebergang.gewechselt) { blende.style.opacity = String(Math.pow(h1, 2)); if (uebergang.nach === 'system') { fokus = weich(h1); zoomFaktor = 1 - .88 * weich(h1); } else zoomFaktor = 1 + 2.2 * h1 * h1;
      if (h1 >= 1) { uebergang.gewechselt = true; modus = uebergang.nach; galaxie.visible = modus === 'galaxie'; system.visible = modus === 'system'; auswahl = null; cam.zoom = modus === 'galaxie' ? 1 : .84; cam.phi = modus === 'galaxie' ? .8 : .66; cam.theta = modus === 'galaxie' ? startTheta() : Math.PI / 2; } }
    else { blende.style.opacity = String(1 - weich(h2)); if (modus === 'system') { fokus = 0; zoomFaktor = 1 + 1.6 * (1 - weich(h2)); } else { fokus = 1 - weich(h2); zoomFaktor = 1 - .88 * (1 - weich(h2)); } }
    if (u >= 1) { uebergang = null; blende.style.opacity = '0'; fokus = 0; }
  }

  // Tagesabschluss: die Funken fallen in den Stern von heute
  if (verschmelzen >= 0) { verschmelzen += dt / (reduce ? .01 : 3.4); var m = Math.min(verschmelzen, 1);
    var rein = m < .55 ? weich(m / .55) : 1, raus = m > .72 ? weich((m - .72) / .28) : 0; fokus = rein * (1 - raus); zoomFaktor = 1 - .55 * fokus;
    funken.forEach(function (o) { o.rad *= (1 - dt * 2.2); o.speed += dt * 5; o.s.material.opacity = Math.max(0, 1 - m * 1.8); });
    var blitz = m > .5 ? Math.max(0, 1 - (m - .5) / .5) : 0; heuteGlow.scale.setScalar(30 + 18 * Math.min(1, m * 2) + 90 * blitz * blitz); heuteGlow.material.color.set(m > .5 ? 0xFFE2B0 : 0xffffff);
    if (m > .5) { if (!stoss.visible) melde({ typ: 'haptik', art: 'stark' }); stoss.visible = true; var q = (m - .5) / .5; stoss.scale.setScalar(10 + 170 * weich(q)); stoss.material.opacity = .9 * (1 - q); }
    if (verschmelzen >= 1) { verschmelzen = -1; fokus = 0; stoss.visible = false; funken.forEach(function (o) { galaxie.remove(o.s); }); funken = []; heuteGlow.scale.setScalar(48); daten.tagZu = true; daten.funken = 0; melde({ typ: 'verschmolzen' }); } }
  else if (heuteGlow) heuteGlow.scale.setScalar((daten.tagZu ? 48 : 30) + (reduce ? 0 : 3 * Math.sin(zeit * 2.2)));
  if (heuteRing) heuteRing.scale.setScalar((daten.tagZu ? 30 : 22) + (reduce ? 0 : 2 * Math.sin(zeit * 2.2)));

  if (modus === 'galaxie') ziel.copy(heutePos).multiplyScalar(fokus); else ziel.set(0, 0, 0);
  var R = baseR * cam.zoom * zoomFaktor;
  camera.position.set(ziel.x + R * Math.sin(cam.phi) * Math.cos(cam.theta), ziel.y + R * Math.cos(cam.phi), ziel.z + R * Math.sin(cam.phi) * Math.sin(cam.theta)); camera.lookAt(ziel); camera.updateMatrixWorld();

  if (modus === 'system') bewegeSystem(reduce ? 0 : dt);
  funken.forEach(function (o) { o.ang += dt * o.speed; var c = Math.cos(o.ang) * o.rad, s = Math.sin(o.ang) * o.rad; v.set(heutePos.x + c, heutePos.y + s * Math.sin(o.tilt), heutePos.z + s * Math.cos(o.tilt));
    if (o.flug < 1) { var vorher = o.flug; o.flug = Math.min(1, o.flug + dt / 1.1); o.s.position.lerpVectors(o.von, v, weich(o.flug)); o.s.scale.setScalar(7 + 10 * Math.sin(o.flug * Math.PI)); if (vorher < 1 && o.flug >= 1) melde({ typ: 'haptik', art: 'leicht' }); } else o.s.position.copy(v); });

  // Zeitreise
  wolken.forEach(function (c) { c.visible = c.userData.t <= T + .2; }); nebel.forEach(function (n) { n.visible = n.userData.t <= T; });
  var jetzt = T >= A - .3; if (heuteGlow) { heuteGlow.visible = heuteRing.visible = jetzt; } funken.forEach(function (o) { o.s.visible = jetzt; });

  if (auswahl && auswahl.modus === modus) { auswahlRing.visible = true; auswahlRing.position.copy(auswahl.pos()); auswahlRing.scale.setScalar((auswahl.radius || 6) * 2.6 + 6 + (reduce ? 0 : Math.sin(zeit * 3) * 1.2)); } else auswahlRing.visible = false;
  renderer.render(scene, camera);

  // Beschriftungen: wichtigste zuerst, was sich überlappen würde, wird ausgeblendet
  var belegt = [], nah = cam.zoom * zoomFaktor < .6;
  schilder.slice().sort(function (a, b) { return b.prio - a.prio; }).forEach(function (s) {
    var sichtbar = s.modus === modus && !uebergang && (s.t === undefined || s.t <= T + .05) && (!s.heute || jetzt);
    if (sichtbar && s.mond) sichtbar = nah || (auswahl && (auswahl.id === s.planet));
    var x = 0, y = 0;
    if (sichtbar) { v.copy(s.pos()).project(camera); x = (v.x * .5 + .5) * W; y = (-v.y * .5 + .5) * H; if (v.z > 1 || y < randOben + 22 || y > H - randUnten - 6 || x < -20 || x > W + 20) sichtbar = false; }
    if (sichtbar) { var links = s.heute ? (x > W - 96 ? x - s.breite - 12 : x + 10) : x - s.breite / 2, oben = s.heute ? y - 12 : (s.dy !== undefined ? y + s.dy - (s.dy < 0 ? 22 : 0) : y - 26), kasten = [links, oben, links + s.breite, oben + 20];
      if (belegt.some(function (b) { return kasten[0] < b[2] && kasten[2] > b[0] && kasten[1] < b[3] && kasten[3] > b[1]; })) sichtbar = false; else { belegt.push(kasten); s.el.style.transform = 'translate(' + links.toFixed(1) + 'px,' + oben.toFixed(1) + 'px)'; } }
    s.el.style.opacity = sichtbar ? 1 : 0;
  });
}

/* ---------- Schnittstelle zur App ---------- */
window.Szene = {
  setze: setze,
  modus: function (m) { if (!daten || m === modus || (uebergang && uebergang.nach === m) || (m !== 'galaxie' && m !== 'system')) return; if (uebergang) return; einflug = 1; T = 999; uni.uT.value = 999; uebergang = { nach: m, k: 0, gewechselt: false }; },
  funke: function () { if (!daten) return; if (modus !== 'galaxie') return; T = 999; uni.uT.value = 999; neuerFunke(true); },
  verschmelze: function () { if (!daten || verschmelzen >= 0) return; if (modus !== 'galaxie') { modus = 'galaxie'; galaxie.visible = true; system.visible = false; cam.theta = startTheta(); cam.phi = .8; cam.zoom = 1; } einflug = 1; T = 999; uni.uT.value = 999; verschmelzen = 0; },
  zeit: function (t) { T = (t === null || t === undefined || t >= A - .02) ? 999 : Math.max(0, t); uni.uT.value = T; einflug = 1; },
  raender: function (oben, unten) { randOben = oben || 0; randUnten = unten || 0; groesse(); },
  waehle: function () { auswahl = null; },
  zustand: function () { return { modus: modus, alter: A, schilder: schilder.length, waehlbar: waehlbar.length, funken: funken.length }; }
};
bild();
melde({ typ: 'bereit' });
})();
