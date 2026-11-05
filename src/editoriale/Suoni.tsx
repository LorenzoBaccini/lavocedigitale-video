import { Audio, Sequence, staticFile } from "remotion";

import type { NomeTema } from "../../suoni/sottofondo";
import { fileTema } from "../../suoni/sottofondo";
import type { Linea } from "../linea";
import type { Timing } from "../timing";
import { volumeSottofondo } from "./mix";
import type { Effetto } from "./piano";

const file = (nome: string) => staticFile(`suoni/editoriale/${nome}.wav`);

// Foley della scena (suoni/foley.ts), ognuno sul suo frame.
export const Suoni: React.FC<{ effetti: Effetto[] }> = ({ effetti }) => (
  <>
    {effetti.map((e, i) => (
      <Sequence key={i} from={Math.max(0, Math.round(e.da))} layout="none">
        <Audio src={file(e.suono)} volume={e.volume ?? 1} />
      </Sequence>
    ))}
  </>
);

/** Tono di stanza sotto tutto il video: toglie il silenzio digitale fra le parole. */
export const Stanza: React.FC = () => <Audio src={file("stanza")} loop />;

/** Il tema musicale in loop, abbassato sotto la voce, con entrata e uscita. */
export const Sottofondo: React.FC<{ tema: NomeTema; timing: Timing; linea: Linea }> = ({ tema, timing, linea }) => (
  <Audio src={file(fileTema(tema))} loop volume={(f) => volumeSottofondo(f, timing, linea)} />
);
