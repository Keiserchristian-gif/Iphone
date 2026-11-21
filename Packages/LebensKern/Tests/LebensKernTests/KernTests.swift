import XCTest
@testable import LebensKern

final class KernTests: XCTestCase {
    var kal: Calendar { Zeit.fest }
    let heute = Zeit.datum(jahr: 2026, monat: 11, tag: 21)

    // MARK: Zeit

    func testAlterIstNieNegativUndRechnetJahre() {
        let geburt = Zeit.datum(jahr: 1995, monat: 11, tag: 21)
        XCTAssertEqual(Zeit.alter(geburt: geburt, am: heute), 31, accuracy: 0.01)
        XCTAssertEqual(Zeit.alter(geburt: heute, am: geburt), 0)
        XCTAssertEqual(Zeit.kurz(heute, kalender: kal), "21.11.2026")
    }

    // MARK: Tag

    func testNotizenWerdenBeimAbschlussZumTag() {
        var b = Bestand()
        b.notiere("  Schlecht geschlafen ", am: heute)
        b.notiere("   ", am: heute)
        b.notiere("Gelaufen", am: heute.addingTimeInterval(3600))
        XCTAssertEqual(b.notizen.count, 2)
        let tag = b.schliesseTag(am: heute, text: "War okay", stimmung: 9, bereiche: [.gesundheit], kurz: "Okay", kalender: kal)
        XCTAssertEqual(tag.notizen.map(\.text), ["Schlecht geschlafen", "Gelaufen"])
        XCTAssertEqual(tag.stimmung, 5)
        XCTAssertTrue(b.notizen.isEmpty)
        XCTAssertEqual(b.tage.count, 1)
    }

    func testZweiterAbschlussErgaenztStattZuVerdoppeln() {
        var b = Bestand()
        b.notiere("Eins", am: heute)
        b.schliesseTag(am: heute, text: "A", stimmung: 2, bereiche: [.arbeit], kurz: "A", kalender: kal)
        b.notiere("Zwei", am: heute.addingTimeInterval(7200))
        b.schliesseTag(am: heute, text: "B", stimmung: 4, bereiche: [.menschen], kurz: "B", kalender: kal)
        XCTAssertEqual(b.tage.count, 1)
        XCTAssertEqual(b.tage[0].notizen.map(\.text), ["Eins", "Zwei"])
        XCTAssertEqual(b.tage[0].text, "B")
        XCTAssertEqual(b.tage[0].stimmung, 4)
    }

    func testAbschlussOhneNotizenFunktioniert() {
        var b = Bestand()
        let tag = b.schliesseTag(am: heute, text: "", stimmung: 0, bereiche: [], kurz: "", kalender: kal)
        XCTAssertTrue(tag.notizen.isEmpty)
        XCTAssertEqual(b.tage.count, 1)
    }

    func testAlteNotizenWerdenStillZuTagen() {
        var b = Bestand()
        let gestern = heute.addingTimeInterval(-86_400)
        let vorgestern = heute.addingTimeInterval(-2 * 86_400)
        b.notiere("Absage bekommen", am: vorgestern)
        b.notiere("Mit Jonas telefoniert", am: gestern)
        b.notiere("Heute offen", am: heute)
        b.raeumeAuf(heute: heute, kalender: kal)
        XCTAssertEqual(b.tage.count, 2)
        XCTAssertEqual(b.tage[0].stimmung, 0)
        XCTAssertEqual(b.tage[0].bereiche, [.arbeit])
        XCTAssertEqual(b.notizen.map(\.text), ["Heute offen"])
        b.raeumeAuf(heute: heute, kalender: kal)
        XCTAssertEqual(b.tage.count, 2)
    }

    // MARK: Zuordnung

    func testZuordnungFindetBereicheUndBleibtBeiUnsinnLeer() {
        XCTAssertEqual(Zuordnung.bereiche(fuer: "Absage von der Firma, danach Bewerbung geschrieben").first, .arbeit)
        XCTAssertTrue(Zuordnung.bereiche(fuer: "Mit Jonas telefoniert und 30 Minuten gelaufen").contains(.gesundheit))
        XCTAssertEqual(Zuordnung.bereiche(fuer: "xyz qqq"), [])
        XCTAssertEqual(Zuordnung.bereiche(fuer: ""), [])
        XCTAssertLessThanOrEqual(Zuordnung.bereiche(fuer: "Arbeit Geld Freund Schlaf Traum Reise Chef").count, 3)
    }

    func testKurzfassungKuerztAnWortgrenze() {
        XCTAssertEqual(Zuordnung.kurzfassung("Absage von der Tischlerei. Danach gelaufen."), "Absage von der Tischlerei.")
        let lang = String(repeating: "wort ", count: 60)
        let kurz = Zuordnung.kurzfassung(lang, max: 40)
        XCTAssertLessThanOrEqual(kurz.count, 40)
        XCTAssertTrue(kurz.hasSuffix("…"))
        XCTAssertEqual(Zuordnung.kurzfassung("  \n "), "")
    }

    // MARK: Fragebogen

    func testFragebogenIdsSindEindeutig() {
        let ids = FragebogenInhalt.alleFragen.map(\.id)
        XCTAssertEqual(Set(ids).count, ids.count)
        XCTAssertGreaterThanOrEqual(ids.count, 40)
        XCTAssertTrue(ids.contains(FragebogenInhalt.briefFrage))
        XCTAssertEqual(Set(FragebogenInhalt.kapitel.map(\.id)).count, FragebogenInhalt.kapitel.count)
    }

    func frage(_ id: String) -> Frage { FragebogenInhalt.alleFragen.first { $0.id == id }! }

    func testAntwortWirdZuSternenUndMondenUndErsetztBeimAendern() {
        var b = Bestand()
        let f = frage("menschen.wichtig")
        b.uebernehme(Antwort(eintraege: [Eintrag(titel: "Jonas", jahr: 2012), Eintrag(titel: "Mira"), Eintrag(titel: "  ")]), fuer: f, heute: heute)
        XCTAssertEqual(b.ereignisse.map(\.titel), ["Jonas kennengelernt"])
        XCTAssertEqual(b.monde.map(\.name), ["Jonas", "Mira"])
        b.uebernehme(Antwort(eintraege: [Eintrag(titel: "Jonas", jahr: 2013)]), fuer: f, heute: heute)
        XCTAssertEqual(b.ereignisse.count, 1)
        XCTAssertEqual(Zeit.jahr(b.ereignisse[0].datum, kalender: kal), 2013)
        XCTAssertEqual(b.monde.count, 1)
        b.uebernehme(Antwort(), fuer: f, heute: heute)
        XCTAssertTrue(b.ereignisse.isEmpty && b.monde.isEmpty)
        XCTAssertNil(b.antworten[f.id])
    }

    func testBeendeteStelleWirdKeinMondUndZukunftsjahrWirdIgnoriert() {
        var b = Bestand()
        let f = frage("arbeit.stellen")
        b.uebernehme(Antwort(eintraege: [Eintrag(titel: "Alt", jahr: 2019, bisJahr: 2024), Eintrag(titel: "Neu", jahr: 2024),
                                         Eintrag(titel: "Unsinn", jahr: 2999)]), fuer: f, heute: heute)
        XCTAssertEqual(b.ereignisse.map(\.titel), ["Alt", "Neu"])
        XCTAssertEqual(b.monde.map(\.name), ["Neu", "Unsinn"])
    }

    func testSchwerePhasenWerdenWolkenMitEnde() {
        var b = Bestand()
        let f = frage("krisen.phasen")
        b.uebernehme(Antwort(eintraege: [Eintrag(titel: "Trennung", jahr: 2021), Eintrag(titel: "Lang", jahr: 2015, bisJahr: 2017),
                                         Eintrag(titel: "Ohne Jahr")]), fuer: f, heute: heute)
        XCTAssertEqual(b.phasen.map(\.name), ["Lang", "Trennung"])
        XCTAssertTrue(b.phasen.allSatisfy { $0.ende != nil && $0.ende! >= $0.beginn && $0.ende! <= heute })
        XCTAssertTrue(b.ereignisse.isEmpty)
        XCTAssertEqual(b.fortschritt(FragebogenInhalt.kapitel.first { $0.id == "krisen" }!), 0.25)
    }

    // MARK: Stationen

    func testStationenAusLebenslauf() {
        let text = """
        Lebenslauf
        Geburtsdatum: 14.03.1995 in Kiel
        09/2016 – 07/2019   Ausbildung zum Tischler, Tischlerei Brandt
        2019: Gesellenbrief
        seit 2024 Geselle bei Holzbau Nord
        08/2011 - 06/2015
        Realschule am Park
        Telefon 0431 2019884
        """
        let s = Stationen.erkenne(in: text, heute: 2026)
        XCTAssertEqual(s.map(\.titel), ["Ausbildung zum Tischler, Tischlerei Brandt", "Gesellenbrief", "Geselle bei Holzbau Nord", "Realschule am Park"])
        XCTAssertEqual(s[0].jahr, 2016); XCTAssertEqual(s[0].bisJahr, 2019)
        XCTAssertNil(s[1].bisJahr)
        XCTAssertTrue(s[2].laufend); XCTAssertNil(s[2].bisJahr)
        XCTAssertEqual(s[3].jahr, 2011); XCTAssertEqual(s[3].bisJahr, 2015)
    }

    func testStationenHaltenUnsinnUndMassenAus() {
        XCTAssertEqual(Stationen.erkenne(in: "", heute: 2026), [])
        XCTAssertEqual(Stationen.erkenne(in: "§§§ \u{0} 12345678 ----", heute: 2026), [])
        let viel = (0..<5000).map { "2010 Station Nummer \($0)" }.joined(separator: "\n")
        XCTAssertEqual(Stationen.erkenne(in: viel, heute: 2026).count, Stationen.hoechstens)
        XCTAssertEqual(Stationen.erkenne(in: "2090 Zukunft", heute: 2026), [])
    }

    func testStueckeBleibenUnterDerGrenze() {
        let text = (0..<40).map { "Absatz \($0) " + String(repeating: "x", count: 150) }.joined(separator: "\n") + "\n" + String(repeating: "y", count: 5000)
        let s = Stationen.stuecke(text, laenge: 1800)
        XCTAssertTrue(s.allSatisfy { $0.count <= 1800 && !$0.isEmpty })
        XCTAssertEqual(s.joined().filter { $0 == "y" }.count, 5000)
        XCTAssertEqual(Stationen.stuecke("", laenge: 1800), [])
    }

    // MARK: Überblick und Szene

    func testDauerInWorten() {
        let t0 = heute
        XCTAssertEqual(Ueberblick.dauer(von: t0, bis: t0.addingTimeInterval(86_400)), "1 Tag")
        XCTAssertEqual(Ueberblick.dauer(von: t0, bis: t0.addingTimeInterval(5 * 86_400)), "5 Tage")
        XCTAssertEqual(Ueberblick.dauer(von: t0, bis: t0.addingTimeInterval(63 * 86_400)), "9 Wochen")
        XCTAssertEqual(Ueberblick.dauer(von: t0, bis: t0.addingTimeInterval(200 * 86_400)), "7 Monate")
        XCTAssertEqual(Ueberblick.dauer(von: t0, bis: t0.addingTimeInterval(1100 * 86_400)), "3 Jahre")
    }

    func testLeeresLebenErgibtGueltigeSzene() {
        let s = Szenenbau.baue(Bestand(), heute: heute, kalender: kal)
        XCTAssertEqual(s.alter, 1, accuracy: 0.01)
        XCTAssertTrue(s.sterne.isEmpty && s.wolken.isEmpty)
        XCTAssertEqual(s.planeten.count, 5)
        XCTAssertTrue(s.ueberblick.contains("fast leer"))
        XCTAssertFalse(s.tagZu)
    }

    func testBeispielSzene() throws {
        let b = Bestand.beispiel(heute: heute, kalender: kal)
        let s = Szenenbau.baue(b, heute: heute, kalender: kal)
        XCTAssertEqual(s.alter, 31.69, accuracy: 0.05)
        XCTAssertEqual(s.sterne.filter { $0.art == "ereignis" }.count, 12)
        XCTAssertEqual(s.sterne.filter { $0.art == "tag" }.count, 8)
        XCTAssertTrue(s.sterne.allSatisfy { $0.t >= 0 && $0.t <= s.alter })
        XCTAssertEqual(s.wolken.count, 3)
        XCTAssertEqual(s.wolken.filter(\.offen).count, 1)
        XCTAssertTrue(s.wolken.last!.text.contains("Du hast dir selbst geschrieben"))
        XCTAssertEqual(s.wolken[1].dauer, "9 Wochen")
        XCTAssertEqual(s.planeten.first { $0.bereich == "arbeit" }?.zustand, "sturm")
        XCTAssertEqual(s.planeten.first { $0.bereich == "menschen" }?.monde.count, 3)
        XCTAssertEqual(s.funken, 3)
        XCTAssertEqual(s.ueberblick, "Du bist in deiner vierten Umdrehung. Zwei Dunkelwolken liegen schon hinter dir, die längste dauerte 9 Wochen. Die jetzige ist 6 Wochen alt.")
        let json = try JSONEncoder().encode(s)
        XCTAssertEqual(try JSONDecoder().decode(Szene.self, from: json), s)
        let roh = try JSONEncoder().encode(b)
        XCTAssertEqual(try JSONDecoder().decode(Bestand.self, from: roh), b)
    }
}

extension KernTests {
    /// Schreibt die Beispiel-Szene als JSON, wenn SZENE_JSON gesetzt ist. Damit wird die Web-Szene außerhalb der App geprüft.
    func testSchreibeBeispielSzene() throws {
        guard let pfad = ProcessInfo.processInfo.environment["SZENE_JSON"] else { return }
        let s = Szenenbau.baue(Bestand.beispiel(heute: heute, kalender: kal), heute: heute, kalender: kal)
        try JSONEncoder().encode(s).write(to: URL(fileURLWithPath: pfad))
    }
}
