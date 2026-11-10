import { Fragment } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";

import { notificaSulloSchermo, suoniDettaglio } from "./editoriale/ganci/dettaglio";
import { Lampo } from "./editoriale/Lampo";
import { pianoScena } from "./editoriale/piani";
import { SCENE_SCHERMO } from "./editoriale/schermo";
import { Spinta } from "./editoriale/Spinta";
import { stileDelVideo, StileVideo } from "./editoriale/stili";
import { Sottofondo, Stanza, Suoni } from "./editoriale/Suoni";
import { DURATA_SPINTA } from "./editoriale/transizione";
import type { Variante } from "./editoriale/variante";
import { varianteDi } from "./editoriale/variante";
import { VarianteVideo } from "./editoriale/VarianteVideo";
import { costruisciLinea, livelloVoce } from "./linea";
import { MisuraImpaginazione } from "./MisuraImpaginazione";
import { Overlay } from "./Overlay";
import type { PropsScena } from "./scenes";
import { SCENE, Tipografica } from "./scenes";
import { propsFrase } from "./scenes/propsFrase";
import type { Scena, Storyboard } from "./storyboard/tipi";
import { FPS, fontsCss } from "./theme";
import type { Timing } from "./timing";
import { LivelloVoce } from "./voce";

/** `variante` assente: l'aspetto del video approvato. */
export type PropsNotizia = { storyboard: Storyboard; timing: Timing; audioBase: string; variante?: Variante; misuraImpaginazione?: boolean };

export const Notizia: React.FC<PropsNotizia> = ({ storyboard, timing, audioBase, variante, misuraImpaginazione }) => {
  const f = useCurrentFrame();
  const linea = costruisciLinea(timing, FPS);
  const aspetto = varianteDi(variante);
  const stile = stileDelVideo(aspetto.stile, storyboard.slug);
  // il controllo d'impaginazione misura ogni scena ferma al suo posto, non a meta' di una spinta o sotto un lampo
  const scorrimento = stile.transizione === "scorrimento";
  const spinta = (stile.transizione === "spinta" || scorrimento) && !misuraImpaginazione;
  const lampo = stile.transizione === "lampo" && !misuraImpaginazione;
  const ultima = storyboard.frasi.length - 1;
  return (
    <VarianteVideo.Provider value={aspetto}>
      <StileVideo.Provider value={stile}>
        <LivelloVoce.Provider value={livelloVoce(timing, linea, f)}>
          <AbsoluteFill style={{ background: stile.colori.fondo }}>
            <style>{fontsCss}</style>
            {storyboard.frasi.map((frase, i) => {
              // lo stile schermo non monta il set 3D: le scene del set hanno la loro resa a tutto quadro
              const Componente = ((stile.set === "schermo" ? SCENE_SCHERMO[frase.scena.tipo] : undefined) ?? SCENE[frase.scena.tipo]) as React.FC<PropsScena<Scena>> | undefined;
              const props = propsFrase(storyboard, timing, linea, i);
              const scena = Componente ? <Componente {...props} /> : <Tipografica testo={frase.testo} durata={linea.durate[i]} />;
              const { suoni } = pianoScena(props, linea.durate[i]);
              const voce = (
                <>
                  <Audio src={staticFile(`${audioBase}/${timing.clips[i].file}`)} />
                  <Suoni effetti={frase.scena.tipo === "gancio" && aspetto.gancio === "dettaglio" && notificaSulloSchermo({ oggetto: frase.scena.oggetto, contesto: props.contesto }, stile.set === "schermo") ? suoniDettaglio(suoni) : suoni} />
                </>
              );
              if (!spinta) {
                return (
                  <Sequence key={i} from={linea.inizi[i]} durationInFrames={linea.durate[i]}>
                    {scena}
                    {voce}
                  </Sequence>
                );
              }
              // la scena resta montata DURATA_SPINTA frame dopo la sua fine, mentre la seguente la spinge fuori; voce e suoni no
              return (
                <Fragment key={i}>
                  <Sequence from={linea.inizi[i]} durationInFrames={linea.durate[i] + (i < ultima ? DURATA_SPINTA : 0)}>
                    <Spinta durata={linea.durate[i]} entra={i > 0} esce={i < ultima} verticale={scorrimento}>
                      {scena}
                    </Spinta>
                  </Sequence>
                  <Sequence from={linea.inizi[i]} durationInFrames={linea.durate[i]} layout="none">
                    {voce}
                  </Sequence>
                </Fragment>
              );
            })}
            {lampo && <Lampo inizi={linea.inizi} />}
            <Stanza />
            <Sottofondo tema={aspetto.musica} timing={timing} linea={linea} />
            <Overlay storyboard={storyboard} timing={timing} linea={linea} />
            {misuraImpaginazione && <MisuraImpaginazione />}
          </AbsoluteFill>
        </LivelloVoce.Provider>
      </StileVideo.Provider>
    </VarianteVideo.Provider>
  );
};
