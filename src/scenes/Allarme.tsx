import { useCurrentFrame } from "remotion";

import { corpo } from "../anim";
import type { PianoAllarme } from "../editoriale/piani/allarme";
import { cameraAllarme, cameraAllarmeTelefono, pianoAllarme } from "../editoriale/piani/allarme";
import { fase } from "../editoriale/regia";
import { SegnoInQuadro } from "../editoriale/Segno";
import { CORPO_NOTIFICA, RIGA_NOTIFICA, righeNotifica, SANS_SCHERMI } from "../editoriale/set/disegni";
import type { Camera, Punto2, Rettangolo } from "../editoriale/set/geometria";
import { angoliInQuadro, NOTIFICA_PX, proietta, puntoSchermo, rettangoloInQuadro, SCHERMO_PX } from "../editoriale/set/geometria";
import { Ingombro } from "../editoriale/set/Ingombro";
import { righeNotificaTelefono } from "../editoriale/set/oggetti/disegni";
import { Smartphone } from "../editoriale/set/oggetti/Oggetti";
import { Set3D } from "../editoriale/set/Set3D";
import { CORPO_NOTIFICA_TELEFONO, NOTIFICA_TELEFONO_PX, angoliTelefono, puntoTelefono, RIGA_NOTIFICA_TELEFONO, rettangoloTelefono } from "../editoriale/set/telefono";
import { useRighe } from "../editoriale/set/useRighe";
import { Velo } from "../editoriale/set/Velo";
import type { Stile } from "../editoriale/stili";
import { useStile } from "../editoriale/stili";
import type { Riga } from "../editoriale/Titolo";
import { Titolo } from "../editoriale/Titolo";
import { cerchiatura, sottolineatura } from "../editoriale/tratto";
import type { Punto } from "../editoriale/tratto";
import { FONDO_TITOLO, MARGINE, TITOLO_TOP } from "../impaginazione";
import type { ScenaDi } from "./props";

const PER_RIGA = 9;

/** Dove sta la notifica sul dispositivo: la riga dell'app e le righe del messaggio, portate nel fotogramma. */
interface Disposizione {
  font: string;
  dividi: (ctx: CanvasRenderingContext2D, testo: string) => string[];
  notifica: (cam: Camera) => Punto2[];
  rigaApp: (cam: Camera) => Rettangolo;
  /** inizio e fine della sottolineatura della riga i, larga `larghezza` pixel della notifica */
  riga: (i: number, larghezza: number, cam: Camera) => [{ x: number; y: number }, { x: number; y: number }];
}

const SUL_PORTATILE: Disposizione = {
  font: `650 ${CORPO_NOTIFICA}px ${SANS_SCHERMI}`,
  dividi: righeNotifica,
  notifica: (cam) => angoliInQuadro(NOTIFICA_PX, cam),
  rigaApp: (cam) => rettangoloInQuadro({ x: NOTIFICA_PX.x + 22, y: NOTIFICA_PX.y + 22, w: 300, h: 44 }, cam),
  riga: (i, larghezza, cam) => {
    const base = NOTIFICA_PX.y + RIGA_NOTIFICA.prima + i * RIGA_NOTIFICA.passo + 10;
    return [proietta(puntoSchermo(NOTIFICA_PX.x + 30, base), cam), proietta(puntoSchermo(NOTIFICA_PX.x + 30 + larghezza, base), cam)];
  },
};

const T = NOTIFICA_TELEFONO_PX;
const SUL_TELEFONO: Disposizione = {
  font: `650 ${CORPO_NOTIFICA_TELEFONO}px ${SANS_SCHERMI}`,
  dividi: righeNotificaTelefono,
  notifica: (cam) => angoliTelefono(T, cam),
  rigaApp: (cam) => rettangoloTelefono({ x: T.x + 20, y: T.y + 20, w: 380, h: 58 }, cam),
  riga: (i, larghezza, cam) => {
    const base = T.y + RIGA_NOTIFICA_TELEFONO.prima + i * RIGA_NOTIFICA_TELEFONO.passo + 12;
    return [proietta(puntoTelefono(T.x + 32, base), cam), proietta(puntoTelefono(T.x + 32 + larghezza, base), cam)];
  },
};

/** Il sopratitolo in corsivo e il titolo con la chiave in accento. */
export function titoliAllarme(props: ScenaDi<"allarme">, piano: PianoAllarme, stile: Stile): { sopra: Riga[]; titolo: Riga[] } {
  const sopra: Riga[] = [{ parole: piano.sopra, size: corpo(props.sopra, 68, 22, stile.larghezza), peso: 500, corsivo: true }];
  const titolo: Riga[] = [
    {
      parole: piano.titolo.map((p, i) => (piano.accento.includes(i) ? { ...p, colore: stile.colori.accento, colpo: true } : p)),
      size: corpo(props.titolo, 112, 15, stile.larghezza),
      peso: 700,
    },
  ];
  return { sopra, titolo };
}

// L'allarme: primo piano della notifica sullo schermo del dispositivo (il portatile, in asse; il telefono, dall'alto),
// annotata a mano sulla voce.
export const Allarme: React.FC<ScenaDi<"allarme">> = (props) => {
  const f = useCurrentFrame();
  const stile = useStile();
  const { durata, contesto } = props;
  const piano = pianoAllarme(props, durata);
  const telefono = piano.dispositivo === "smartphone";
  const d = telefono ? SUL_TELEFONO : SUL_PORTATILE;
  const cam = telefono ? cameraAllarmeTelefono(f, durata, piano.stacchi) : cameraAllarme(f, durata, piano.stacchi);
  const righe = useRighe(d.font, piano.messaggio, d.dividi);
  const entrata = fase(f, piano.arrivo, piano.arrivo + 6);
  const visibile = !telefono && contesto.precedente === "gancio" ? 1 : entrata;
  const scarto = 28 * (1 - entrata) ** 3;

  const app = d.rigaApp(cam);
  const cerchio = cerchiatura(app.x + app.w / 2, app.y + app.h / 2, app.w / 2 + 26, app.h / 2 + 18, 7);
  // una sottolineatura per riga del messaggio, una dopo l'altra
  const sottolineature = (righe ?? []).map((r, i) => {
    const [a, b] = d.riga(i, r.larghezza, cam);
    const inclinazione = Math.atan2(b.y - a.y, b.x - a.x);
    const lunga = Math.hypot(b.x - a.x, b.y - a.y);
    return sottolineatura(lunga, 12 + i).map(([x, y]): Punto => [a.x + x * Math.cos(inclinazione) - y * Math.sin(inclinazione), a.y + x * Math.sin(inclinazione) + y * Math.cos(inclinazione)]);
  });

  const { sopra, titolo } = titoliAllarme(props, piano, stile);
  return (
    <>
      {telefono ? (
        <Set3D camera={cam} orologio={contesto.orologio}>
          <Smartphone schermo={{ tipo: "blocco" }} notifica={{ messaggio: piano.messaggio, mittente: props.mittente, visibile, scarto: scarto * 2 }} />
        </Set3D>
      ) : (
        <>
          <Set3D camera={cam} orologio={contesto.orologio} notifica={{ messaggio: piano.messaggio, mittente: props.mittente, azione: props.azione, visibile, scarto }} />
          <Fuoco cam={cam} />
        </>
      )}
      <Velo alto={0.55} basso={0.72} />
      <Ingombro nome="notifica" angoli={d.notifica(cam)} pieno />
      <SegnoInQuadro punti={cerchio} colore={stile.colori.testo} spessore={6} progresso={(f - piano.cerchio) / 15} />
      {sottolineature.map((punti, i) => (
        <SegnoInQuadro key={i} punti={punti} colore={stile.colori.accento} spessore={8} progresso={(f - piano.sottolinea - i * PER_RIGA) / PER_RIGA} />
      ))}
      <Titolo nome="sopra" f={f} righe={sopra} style={{ position: "absolute", top: TITOLO_TOP, left: MARGINE, right: MARGINE }} />
      <Titolo nome="titolo" f={f} righe={titolo} style={{ position: "absolute", bottom: FONDO_TITOLO, left: MARGINE, right: MARGINE }} />
    </>
  );
};

// profondita' di campo sul portatile: a fuoco lo schermo, la tastiera piu' vicina all'obiettivo si sfoca
const Fuoco: React.FC<{ cam: Camera }> = ({ cam }) => {
  const fuocoFino = proietta(puntoSchermo(SCHERMO_PX.w / 2, SCHERMO_PX.h), cam).y + 90;
  return <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: fuocoFino, backdropFilter: "blur(7px)", WebkitMaskImage: "linear-gradient(180deg, transparent 0, #000 160px)", maskImage: "linear-gradient(180deg, transparent 0, #000 160px)" }} />;
};
