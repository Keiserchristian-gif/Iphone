#!/usr/bin/env python3
"""Fügt die Szene zu einer einzigen HTML-Datei zusammen, die in der App mitgeliefert wird.
Aufruf: python3 Szene/baue.py"""
import pathlib

hier = pathlib.Path(__file__).resolve().parent
ziel = hier.parent / "Lebensgalaxie" / "Ressourcen" / "szene.html"
seite = (hier / "szene.html").read_text(encoding="utf-8")
for name in ("three.min.js", "szene.js"):
    code = (hier / name).read_text(encoding="utf-8").replace("</script", "<\\/script")
    marke = f'<script src="{name}"></script>'
    assert marke in seite, name
    seite = seite.replace(marke, "<script>\n" + code + "\n</script>")
ziel.parent.mkdir(parents=True, exist_ok=True)
ziel.write_text(seite, encoding="utf-8")
print(f"{ziel} ({len(seite) // 1024} KB)")
