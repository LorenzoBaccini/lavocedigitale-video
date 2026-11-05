import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { cancelRender, continueRender, delayRender } from "remotion";

// Testo e grafica dipinti su canvas e applicati come texture: aspetta che i font del sito siano carichi.
export const useCanvasTexture = (w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void, deps: unknown[] = []) => {
  const [handle] = useState(() => delayRender("font per le texture"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.all([document.fonts.load("800 100px Inter"), document.fonts.load("700 100px Lora")])
      .then(() => {
        setReady(true);
        continueRender(handle);
      })
      .catch((err) => cancelRender(err));
  }, [handle]);
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    if (ready) draw(ctx);
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, w, h, ...deps]);
};
