#!/usr/bin/env python3
"""Genera le fixture `matrice-NN.storyboard.json`: ogni tipo di scena per ogni dispositivo e schermata ammessi,
con i testi corti e con i testi al limite dei LIMITI (titoli su due righe, etichette e sopratitoli lunghi).

Uso (dalla radice del repo): python3 fixtures/matrice.py
Le ganci stanno nelle prime fixture: sono le uniche scene che cambiano con l'apertura della variante.
"""
import json
from pathlib import Path

PAROLE = ("Amministrazione Comune sportello accesso credenziali verifica Ministero documento identità "
          "richiesta prenotazione portale aggiornamento sicurezza impostazioni dispositivo").split()


def esatto(n: int, seme: int = 0) -> str:
    """Un testo di parole vere lungo esattamente n caratteri (l'ultima parola si taglia se serve)."""
    out, i = "", seme
    while len(out) < n:
        p = PAROLE[i % len(PAROLE)]
        out = f"{out} {p}" if out else p.capitalize()
        i += 1
    out = out[:n]
    return out[:-1] + "e" if out.endswith(" ") else out


CHIUSURA = {"testo": "Trovi tutto su la voce digitale punto it, il link è nel post.", "chiave": "link", "scena": {"tipo": "chiusura"}}


def frase(testo: str, chiave: str, scena: dict) -> dict:
    assert chiave.lower() in testo.lower(), (chiave, testo)
    return {"testo": testo, "chiave": chiave, "scena": scena}


T_CORTO = "Devi cambiare la password del conto?"  # 36 caratteri: la frase intera fa da titolo
T_64 = "Devi rinnovare la carta d'identità elettronica scaduta da poco?"  # <= 64: titolo su piu' righe
T_LUNGO = "Devi rinnovare la carta d'identità elettronica del Comune prima delle vacanze estive di agosto?"  # > 64: titolo ed evidenza
DETTA = "Il sistema lo dice in modo preciso."  # 7 parole


def ganci():
    out = []
    casi = [("portatile", "sistema", T_CORTO), ("portatile", "sistema", T_64), ("portatile", "sistema", T_LUNGO),
            ("portatile", "sito", T_LUNGO), ("portatile", "app", T_64), ("chiavetta", None, T_LUNGO),
            ("smartphone", None, T_64), ("router", None, T_LUNGO), ("carta", None, T_CORTO), ("nessuno", None, T_LUNGO)]
    for i, (ogg, sch, testo) in enumerate(casi):
        lunghi = testo == T_LUNGO
        scena = {"tipo": "gancio", "titolo": esatto(24, i) if lunghi else "Carta scaduta", "evidenza": esatto(16, i + 3) if lunghi else "Rinnovo",
                 "sottotitolo": esatto(36, i + 5) if lunghi else "Dal sito", "oggetto": ogg}
        if sch:
            scena["schermata"] = sch
        out.append(frase(testo, "Devi", scena))
    return out


def allarmi():
    out = []
    for disp in ["portatile", "smartphone"]:
        out.append(frase(DETTA, "preciso", {"tipo": "allarme", "sopra": "Avviso", "titolo": "Attenzione", "dispositivo": disp}))
        out.append(frase(DETTA, "preciso", {"tipo": "allarme", "sopra": esatto(32, 1), "titolo": esatto(24, 2), "notifica": esatto(64, 3),
                                             "mittente": esatto(28, 4), "azione": esatto(28, 5), "dispositivo": disp}))
    return out


def oggetti():
    out = []
    mx = lambda s: {"etichetta": esatto(32, s), "titolo": esatto(24, s + 1), "evidenza": esatto(16, s + 2), "conferma": esatto(28, s + 3)}
    mn = {"etichetta": "Nel menu", "titolo": "Apri"}
    for ogg, schermate in [("portatile", ["sistema", "sito", "app"]), ("smartphone", ["sistema", "sito", "app"])]:
        for k, sch in enumerate(schermate):
            out.append(frase(DETTA, "preciso", {"tipo": "oggetto", **mn, "oggetto": ogg, "schermata": sch}))
            out.append(frase(DETTA, "preciso", {"tipo": "oggetto", **mx(k), "indica": esatto(28, k + 4), "oggetto": ogg, "schermata": sch,
                                                 "menu": [esatto(18, k + j) for j in range(5)]}))
    for k, ogg in enumerate(["chiavetta", "router", "carta"]):
        out.append(frase(DETTA, "preciso", {"tipo": "oggetto", **mn, "oggetto": ogg}))
        out.append(frase(DETTA, "preciso", {"tipo": "oggetto", **mx(k), "indica": esatto(28, k + 6), "oggetto": ogg}))
    out.append(frase(DETTA, "preciso", {"tipo": "oggetto", **mn, "oggetto": "nessuno"}))
    out.append(frase(DETTA, "preciso", {"tipo": "oggetto", **mx(9), "oggetto": "nessuno"}))
    return out


def carta():
    out = [
        frase(DETTA, "preciso", {"tipo": "data", "etichetta": "Scadenza", "data": "2026-03-02"}),
        frase(DETTA, "preciso", {"tipo": "data", "etichetta": esatto(32, 1), "data": "2026-12-31", "barrato": esatto(26, 2), "timbro": esatto(16, 3)}),
        frase(DETTA, "preciso", {"tipo": "teaser", "testo": "Cosa cambia"}),
        frase(DETTA, "preciso", {"tipo": "teaser", "testo": esatto(40, 4)}),
        frase(DETTA, "preciso", {"tipo": "numero", "etichetta": "Costo", "numero": "5"}),
        frase(DETTA, "preciso", {"tipo": "numero", "etichetta": esatto(32, 5), "numero": "1.234,56", "unita": esatto(32, 6), "nota": esatto(36, 7)}),
        frase(DETTA, "preciso", {"tipo": "confronto", "etichetta": "Prima e dopo", "a": {"titolo": "Prima", "valore": "5"}, "b": {"titolo": "Dopo", "valore": "8"}}),
        frase(DETTA, "preciso", {"tipo": "confronto", "etichetta": esatto(32, 8), "a": {"titolo": esatto(24, 9), "valore": "1.234,56"}, "b": {"titolo": esatto(24, 10), "valore": "9.999,99"}}),
        frase(DETTA, "preciso", {"tipo": "citazione", "testo": "Si cambia.", "fonte": "Comune"}),
        frase(DETTA, "preciso", {"tipo": "citazione", "testo": esatto(110, 11), "fonte": esatto(32, 12)}),
    ]
    voci = lambda n, mx: [{"grande": esatto(18, j) if mx else "Voce", "piccolo": esatto(34, j + 1) if mx else "breve"} for j in range(n)]
    for k, (ogg, n, mx) in enumerate([("nessuno", 3, True), ("portatile", 2, False), ("chiavetta", 3, True), ("smartphone", 2, True), ("router", 3, False), ("carta", 3, True)]):
        out.append(frase(DETTA, "preciso", {"tipo": "checklist", "etichetta": esatto(32, k) if mx else "Serve", "voci": voci(n, mx), "oggetto": ogg}))
    return out


def set_vari():
    out = []
    for disp in ["portatile", "smartphone", None]:
        for mx in [False, True]:
            s = {"tipo": "rischio", "sopra": esatto(32, 2) if mx else "Senza", "titolo": esatto(24, 3) if mx else "Niente"}
            if disp:
                s["dispositivo"] = disp
            out.append(frase(DETTA, "preciso", s))
    op = lambda n, mx: [esatto(24, j) for j in range(n)] if mx else ["Entra con SPID", "Entra con CIE", "Entra con PIN"][:n]
    for n, escl, mx in [(2, False, False), (2, True, True), (3, False, True), (3, True, True), (3, True, False)]:
        opz = op(n, mx)
        s = {"tipo": "telefono", "etichetta": esatto(32, n) if mx else "Dall'app", "titolo": esatto(24, n + 1) if mx else "Solo con SPID", "opzioni": opz}
        if escl:
            s["esclusa"] = opz[-1]
        out.append(frase(DETTA, "preciso", s))
    for pezzi, mx in [(["tessera", "lettore"], False), (["tessera", "documento", "lettore"], True), (["lettore", "pin"], True), (["documento", "tessera", "pin"], False)]:
        out.append(frase(DETTA, "preciso", {"tipo": "documenti", "etichetta": esatto(32, 1) if mx else "Sul tavolo", "titolo": esatto(24, 2) if mx else "Prepara",
                                             "pezzi": [{"oggetto": p, "nota": esatto(24, j) if mx else "la tessera"} for j, p in enumerate(pezzi)]}))
    return out


def main():
    radice = Path(__file__).parent
    for vecchia in radice.glob("matrice-*.storyboard.json"):
        vecchia.unlink()
    gruppi = [ganci(), allarmi() + oggetti() + carta() + set_vari()]
    # la notifica arriva nel gancio solo prima di un allarme sul portatile: un caso con la notifica al limite
    gruppi[0].insert(1, allarmi()[1])
    parole = lambda f: len(f["testo"].split())
    budget = 72 - parole(CHIUSURA)  # tetto di parole della durata media (LIMITI_DURATA)
    n = 0
    for scene in gruppi:
        blocchi, blocco = [], []
        for f in scene:
            if len(blocco) == 7 or sum(map(parole, blocco)) + parole(f) > budget:
                blocchi.append(blocco)
                blocco = []
            blocco.append(f)
        blocchi.append(blocco)
        for blocco in blocchi:
            n += 1
            while len(blocco) < 5:
                blocco.append(frase(DETTA, "preciso", {"tipo": "teaser", "testo": "Ancora"}))
            sb = {"slug": f"matrice-{n:02d}", "orologio": "2026-03-02", "frasi": blocco + [CHIUSURA]}
            (radice / f"matrice-{n:02d}.storyboard.json").write_text(json.dumps(sb, ensure_ascii=False, indent=1) + "\n")
    print(n, "fixture")


if __name__ == "__main__":
    main()
