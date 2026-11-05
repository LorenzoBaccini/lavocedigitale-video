import type { ScenaDi } from "../../scenes/props.ts";
import type { Piano } from "../piano.ts";
import { accentiMancanti, fase, mix, uscita } from "../regia.ts";
import type { Dispositivo } from "../../storyboard/tipi.ts";
import type { Camera } from "../set/geometria.ts";
import { NOTIFICA_TELEFONO_PX, SCHERMO_TELEFONO, sopraIlTelefono, TELEFONO_PX } from "../set/telefono.ts";
import { centroDi, distanzaPer, inAsse, NOTIFICA_PX, SCHERMO, SCHERMO_PX } from "../set/geometria.ts";
import type { ParolaTitolo } from "../titoli.ts";
import { entroIl, fineDi, paroleInAccento, paroleTitolo, testoDi } from "../titoli.ts";
import type { Voce } from "../voce.ts";

export interface PianoAllarme extends Piano {
  messaggio: string;
  dispositivo: Dispositivo;
  /** frame in cui la notifica arriva; negativo se e' gia' arrivata nel gancio */
  arrivo: number;
  sopra: ParolaTitolo[];
  titolo: ParolaTitolo[];
  /** indici delle parole del titolo in ambra, con il colpo */
  accento: number[];
  cerchio: number;
  sottolinea: number;
  colpo: number;
  stacchi: number[];
}

/** Nel primo piano la notifica e' larga cosi' (px del fotogramma) e il suo centro sta a questa quota. */
export const NOTIFICA_IN_QUADRO = { larghezza: 880, spinta: 940, quota: 800 };
const LARGHEZZA_NOTIFICA = (NOTIFICA_PX.w / SCHERMO_PX.w) * SCHERMO.larghezza;

/** La camera dell'allarme: in asse con la notifica, spinta lenta; ogni stacco in asse la stringe dell'8 %. */
export function cameraAllarme(f: number, durata: number, stacchi: number[]): Camera {
  const larghezza = mix(NOTIFICA_IN_QUADRO.larghezza, NOTIFICA_IN_QUADRO.spinta, uscita(fase(f, 0, durata))) * 1.08 ** stacchi.filter((s) => f >= s).length;
  return inAsse(centroDi(NOTIFICA_PX), distanzaPer(LARGHEZZA_NOTIFICA, larghezza), NOTIFICA_IN_QUADRO.quota);
}

/** Sul telefono: la notifica sulla schermata di blocco, dall'alto, larga cosi' (px del fotogramma); spinta lenta. */
export const NOTIFICA_TELEFONO_IN_QUADRO = { larghezza: 820, spinta: 880 };
const LARGHEZZA_NOTIFICA_TELEFONO = (NOTIFICA_TELEFONO_PX.w / TELEFONO_PX.w) * SCHERMO_TELEFONO.larghezza;

export function cameraAllarmeTelefono(f: number, durata: number, stacchi: number[]): Camera {
  const larghezza = mix(NOTIFICA_TELEFONO_IN_QUADRO.larghezza, NOTIFICA_TELEFONO_IN_QUADRO.spinta, uscita(fase(f, 0, durata))) * 1.08 ** stacchi.filter((s) => f >= s).length;
  const { x, y, w, h } = NOTIFICA_TELEFONO_PX;
  return sopraIlTelefono(x + w / 2, y + h / 2 + 90, distanzaPer(LARGHEZZA_NOTIFICA_TELEFONO, larghezza), 1.2, 0.07);
}

/** Il messaggio della notifica: il campo `notifica`, altrimenti la frase detta. */
export const messaggioAllarme = (notifica: string | undefined, voce: Voce) => notifica ?? voce.parole.map((p) => p.t).join(" ");

// L'allarme e' il primo piano della notifica sullo schermo, in asse. Il messaggio e' il campo `notifica`, o la frase detta.
// Sopra il sopratitolo in corsivo, sotto il titolo; sulla chiave la parola in ambra con un colpo sordo e la sottolineatura
// del messaggio; prima, una cerchiatura bianca intorno alla notifica.
export function pianoAllarme(s: ScenaDi<"allarme">, durata: number): PianoAllarme {
  const { voce } = s;
  const messaggio = messaggioAllarme(s.notifica, voce);
  const dispositivo = s.dispositivo ?? "portatile";
  const arrivo = s.contesto.precedente === "gancio" && dispositivo === "portatile" ? -30 : 3;
  const sopra = entroIl(paroleTitolo(s.sopra, voce, Math.max(2, arrivo + 4)), durata - 30);
  const titolo = entroIl(paroleTitolo(s.titolo, voce, fineDi(sopra) + 2), durata - 16);
  const nellaChiave = paroleInAccento(titolo, voce.parole.slice(voce.chiave).map((p) => p.t));
  const colpo = Math.min(durata - 6, Math.max(titolo[nellaChiave[0]]?.da ?? 0, voce.parole[voce.chiave]?.da ?? 0));
  const cerchio = Math.min(colpo - 14, Math.max(arrivo + 8, voce.parole[Math.floor(voce.parole.length * 0.3)]?.da ?? 10));
  const sottolinea = Math.min(durata - 10, colpo + 3);
  const eventi = [arrivo, ...sopra.map((p) => p.da), ...titolo.map((p) => p.da), cerchio, sottolinea, colpo];
  const stacchi = accentiMancanti(eventi, durata);
  return {
    messaggio,
    dispositivo,
    arrivo,
    sopra,
    titolo,
    accento: nellaChiave,
    cerchio: Math.max(0, cerchio),
    sottolinea,
    colpo,
    stacchi,
    // la notifica prima: sopratitolo e titolo si leggono di seguito, come la frase detta
    testi: [
      { testo: messaggio, da: Math.max(0, arrivo + 6) },
      { testo: testoDi(sopra), da: fineDi(sopra) },
      { testo: testoDi(titolo), da: fineDi(titolo) },
    ],
    suoni: [
      ...(arrivo >= 0 ? [{ da: arrivo, suono: "notifica" as const }] : []),
      { da: colpo, suono: "tonfo" as const },
    ],
    eventi: [...eventi, ...stacchi].filter((e) => e >= 0),
  };
}
