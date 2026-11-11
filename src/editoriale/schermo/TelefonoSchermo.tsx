import { AbsoluteFill, useCurrentFrame } from "remotion";

import { ALTEZZA, FONDO_UTILE, LARGHEZZA } from "../../impaginazione";
import type { ScenaDi } from "../../scenes/props";
import { useDettagli } from "../DettagliVideo";
import { pianoTelefono } from "../piani/telefono";
import { fase, mix, uscita } from "../regia";
import { SegnoInQuadro } from "../Segno";
import { sopraIlTitolo } from "../set/misureOcchiello";
import { opzionePx, TELEFONO_PX } from "../set/telefono";
import { useStile } from "../stili";
import { fineTitoloAlto } from "../testate/quote";
import { titoloTelefono } from "../testate/telefono";
import { cerchiatura, trattoFra } from "../tratto";
import { contenutoTelefono, vistaDi } from "./contenuto";
import { Schermata } from "./Schermata";
import { Testata } from "./Testata";
import { punto, rettangolo } from "./vista";

const STACCO = 30;

// Le scelte del telefono a tutto quadro: le opzioni fra i titoli e i sottotitoli, il barrato a pennarello su quella
// esclusa e il cerchio su quella che resta, come sul set.
export const TelefonoSchermo: React.FC<ScenaDi<"telefono">> = (props) => {
  const f = useCurrentFrame();
  const dettagli = useDettagli();
  const stile = useStile();
  const { durata, etichetta, opzioni } = props;
  const piano = pianoTelefono(props, durata);
  const { righe } = titoloTelefono(props, piano, stile);
  const sottoITitoli = fineTitoloAlto(props.titolo, righe, stile, sopraIlTitolo(etichetta));
  const c = contenutoTelefono({ tipo: "opzioni", opzioni }, dettagli);
  const alto = sottoITitoli + STACCO;
  const quadro = { x: 0, y: alto, w: LARGHEZZA, h: ALTEZZA - alto };
  const fino = FONDO_UTILE - STACCO;
  const ultima = opzionePx(opzioni.length - 1);
  const [cima, fondo] = [opzionePx(0).y - 40, ultima.y + ultima.h + 40];
  // le opzioni stanno sempre intere fra i titoli e i sottotitoli: la scala non supera quella che le fa entrare
  const massima = Math.min(LARGHEZZA / TELEFONO_PX.w, (fino - alto) / (fondo - cima));
  const scala = Math.min(massima, massima * mix(0.9, 0.96, uscita(fase(f, 0, durata))) * 1.03 ** piano.stacchi.filter((s) => f >= s).length);
  const v = vistaDi(c, quadro, { u: TELEFONO_PX.w / 2, v: (cima + fondo) / 2, scala }, (alto + fino) / 2);

  const esclusa = piano.esclusa && opzionePx(piano.esclusa.indice);
  const resta = piano.cerchio && rettangolo(v, opzionePx(piano.cerchio.indice));
  return (
    <AbsoluteFill style={{ background: stile.colori.superficie }}>
      <Schermata nome="telefono" quadro={quadro} vista={v} misure={c.misure} fondo={c.fondo}>
        {c.strato}
      </Schermata>
      {esclusa && piano.esclusa && (
        <SegnoInQuadro punti={trattoFra(punto(v, esclusa.x + 18, esclusa.y + esclusa.h * 0.62), punto(v, esclusa.x + esclusa.w - 18, esclusa.y + esclusa.h * 0.4), 31)} colore={stile.colori.segnoSuChiaro} spessore={14} progresso={(f - piano.esclusa.da) / 10} />
      )}
      {resta && piano.cerchio && <SegnoInQuadro punti={cerchiatura(resta.x + resta.w / 2, resta.y + resta.h / 2, resta.w / 2 + 22, resta.h / 2 + 20, 17)} colore={stile.colori.suChiaro} spessore={7} progresso={(f - piano.cerchio.da) / 15} />}
      <Testata f={f} etichetta={etichetta} righe={righe} />
    </AbsoluteFill>
  );
};
