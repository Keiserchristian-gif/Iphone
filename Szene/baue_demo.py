#!/usr/bin/env python3
"""Baut die Browser-Vorschau: die echte Szene mit erfundenen Beispieldaten und den Bedienelementen der App.
Aufruf: python3 Szene/baue_demo.py <klein.json> <voll.json> [Ziel]
Die JSON-Dateien entstehen mit: SZENE_JSON=<pfad> SZENE_VOLL_JSON=<pfad> swift test --package-path Packages/LebensKern --filter testSchreibe"""
import json, pathlib, sys

hier = pathlib.Path(__file__).resolve().parent
klein, voll = sys.argv[1], sys.argv[2]
ziel = pathlib.Path(sys.argv[3]) if len(sys.argv) > 3 else hier.parent / "mockups" / "demo-lebensgalaxie.html"
daten = {"klein": json.loads(pathlib.Path(klein).read_text()), "voll": json.loads(pathlib.Path(voll).read_text())}
seite = (hier / "demo.html").read_text(encoding="utf-8")
def inline(code): return code.replace("</script", "<\\/script")
seite = seite.replace("/*THREE*/", inline((hier / "three.min.js").read_text(encoding="utf-8")))
seite = seite.replace("/*SZENE*/", inline((hier / "szene.js").read_text(encoding="utf-8")))
seite = seite.replace("/*DATEN*/", json.dumps(daten, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/"))
ziel.write_text(seite, encoding="utf-8")
print(f"{ziel} ({len(seite) // 1024} KB)")
