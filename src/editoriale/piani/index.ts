import type { PropsScena } from "../../scenes/props.ts";
import type { Scena } from "../../storyboard/tipi.ts";
import type { Piano } from "../piano.ts";
import { pianoAllarme } from "./allarme.ts";
import { pianoChecklist } from "./checklist.ts";
import { pianoChiusura } from "./chiusura.ts";
import { pianoDocumenti } from "./documenti.ts";
import { pianoCitazione } from "./citazione.ts";
import { pianoConfronto } from "./confronto.ts";
import { pianoData } from "./data.ts";
import { pianoFlusso } from "./flusso.ts";
import { pianoGancio } from "./gancio.ts";
import { pianoNumero } from "./numero.ts";
import { pianoOggetto } from "./oggetto.ts";
import { pianoPassi } from "./passi.ts";
import { pianoRischio } from "./rischio.ts";
import { pianoSimbolo } from "./simbolo.ts";
import { pianoTeaser } from "./teaser.ts";
import { pianoTelefono } from "./telefono.ts";

/** Il piano della scena: testi a schermo, foley, cambiamenti visibili. */
export function pianoScena(p: PropsScena<Scena>, durata: number): Piano {
  switch (p.tipo) {
    case "gancio":
      return pianoGancio(p, durata);
    case "allarme":
      return pianoAllarme(p, durata);
    case "oggetto":
      return pianoOggetto(p, durata);
    case "rischio":
      return pianoRischio(p, durata);
    case "telefono":
      return pianoTelefono(p, durata);
    case "documenti":
      return pianoDocumenti(p, durata);
    case "data":
      return pianoData(p, durata);
    case "checklist":
      return pianoChecklist(p, durata);
    case "numero":
      return pianoNumero(p, durata);
    case "confronto":
      return pianoConfronto(p, durata);
    case "citazione":
      return pianoCitazione(p, durata);
    case "flusso":
      return pianoFlusso(p, durata);
    case "passi":
      return pianoPassi(p, durata);
    case "simbolo":
      return pianoSimbolo(p, durata);
    case "teaser":
      return pianoTeaser(p, durata);
    case "chiusura":
      return pianoChiusura(p, durata);
  }
}
