import { Fragment } from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";

import type { Dettagli } from "./editoriale/dettagli";
import { dettagliDi } from "./editoriale/dettagli";
import { DettagliVideo } from "./editoriale/DettagliVideo";
import { Ferma } from "./editoriale/Ferma";
import { scenaFerma } from "./editoriale/fermo";
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
import { ChiusuraIntegrata } from "./scenes/ChiusuraIntegrata";
import { propsFrase } from "./scenes/propsFrase";
import type { Scena, Storyboard } from "./storyboard/tipi";
import { FPS, fontsCss } from "./theme";
import type { Timing } from "./timing";
import { LivelloVoce } from "./voce";

/** `variante` assente: l'aspetto del video approvato; ogni dettaglio assente viene dallo slug (la regressione passa `DETTAGLI_BASE`). */
export type PropsNotizia = { storyboard: Storyboard; timing: Timing; audioBase: string; variante?: Variante; dettagli?: Partial<Dettagli>; misuraImpaginazione?: boolean };

export const Notizia: React.FC<PropsNotizia> = ({ storyboard, timing, audioBase, variante, dettagli, misuraImpaginazione }) => {
  const f = useCurrentFrame();
  const linea = costruisciLinea(timing, FPS);
  const aspetto = varianteDi(variante);
  const stile = stileDelVideo(aspetto.stile, storyboard.slug);
  const particolari = { ...dettagliDi(storyboard.slug, stile), ...dettagli };
  // il controllo d'impaginazione misura ogni scena ferma al suo posto, non a meta' di una spinta o sotto un lampo
  const scorrimento = stile.transizione === "scorrimento";
  const spinta = (stile.transizione === "spinta" || scorrimento) && !misuraImpaginazione;
  const lampo = stile.transizione === "lampo" && !misuraImpaginazione;
  const ultima = storyboard.frasi.length - 1;
  // chiusura integrata: niente scena finale, l'ultima di contenuto resta ferma sotto la fascia
  const ferma = scenaFerma(storyboard.frasi.map((fr) => fr.scena.tipo), aspetto.chiusura);
  return (
    <VarianteVideo.Provider value={aspetto}>
      <StileVideo.Provider value={stile}>
        <DettagliVideo.Provider value={particolari}>
        <LivelloVoce.Provider value={livelloVoce(timing, linea, f)}>
          <AbsoluteFill style={{ background: stile.colori.fondo }}>
            <style>{fontsCss}</style>
            {storyboard.frasi.map((frase, i) => {
              // lo stile schermo non monta il set 3D: le scene del set hanno la loro resa a tutto quadro
              const Componente = ((stile.set === "schermo" ? SCENE_SCHERMO[frase.scena.tipo] : undefined) ?? SCENE[frase.scena.tipo]) as React.FC<PropsScena<Scena>> | undefined;
              const props = propsFrase(storyboard, timing, linea, i);
              const fascia = ferma !== undefined && i === ultima;
              const scena = fascia ? <ChiusuraIntegrata {...(props as PropsScena<Extract<Scena, { tipo: "chiusura" }>>)} /> : Componente ? <Componente {...props} /> : <Tipografica testo={frase.testo} durata={linea.durate[i]} />;
              // senza il foglio non c'e' il fruscio della carta
              const suoni = fascia ? [] : pianoScena(props, linea.durate[i]).suoni;
              const voce = (
                <>
                  <Audio src={staticFile(`${audioBase}/${timing.clips[i].file}`)} />
                  <Suoni effetti={frase.scena.tipo === "gancio" && aspetto.gancio === "dettaglio" && notificaSulloSchermo({ oggetto: frase.scena.oggetto, contesto: props.contesto }, stile.set === "schermo") ? suoniDettaglio(suoni) : suoni} />
                </>
              );
              if (i === ferma) {
                const coda = linea.durate[ultima];
                return (
                  <Fragment key={i}>
                    <Sequence from={linea.inizi[i]} durationInFrames={linea.durate[i] + coda}>
                      <Ferma durata={linea.durate[i]} chiusura={coda} spinta={!misuraImpaginazione}>
                        {spinta ? (
                          <Spinta durata={linea.durate[i]} entra={i > 0} esce={false} verticale={scorrimento}>
                            {scena}
                          </Spinta>
                        ) : (
                          scena
                        )}
                      </Ferma>
                    </Sequence>
                    <Sequence from={linea.inizi[i]} durationInFrames={linea.durate[i]} layout="none">
                      {voce}
                    </Sequence>
                  </Fragment>
                );
              }
              if (!spinta || fascia) {
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
            {lampo && <Lampo inizi={ferma === undefined ? linea.inizi : linea.inizi.slice(0, ultima)} />}
            <Stanza />
            <Sottofondo tema={aspetto.musica} timing={timing} linea={linea} />
            <Overlay storyboard={storyboard} timing={timing} linea={linea} />
            {misuraImpaginazione && <MisuraImpaginazione />}
          </AbsoluteFill>
        </LivelloVoce.Provider>
        </DettagliVideo.Provider>
      </StileVideo.Provider>
    </VarianteVideo.Provider>
  );
};
