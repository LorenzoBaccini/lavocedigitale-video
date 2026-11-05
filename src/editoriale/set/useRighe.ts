import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

// Va a capo come la texture e misura le righe, dopo che i font sono carichi: i segni a mano si posano sulle righe vere.
export const useRighe = (font: string, testo: string, dividi: (ctx: CanvasRenderingContext2D, testo: string) => string[]) => {
  const [handle] = useState(() => delayRender("misura delle righe"));
  const [righe, setRighe] = useState<{ testo: string; larghezza: number }[] | null>(null);
  useEffect(() => {
    document.fonts
      .load(font)
      .then(() => {
        const ctx = document.createElement("canvas").getContext("2d")!;
        const divise = dividi(ctx, testo);
        ctx.font = font;
        setRighe(divise.map((r) => ({ testo: r, larghezza: ctx.measureText(r).width })));
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [font, testo, handle]);
  return righe;
};
