import type { CSSProperties } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cancelRender, continueRender, delayRender } from "remotion";

import type { Ctx } from "../set/disegni";

/**
 * Un disegno degli schermi (`set/disegni.ts`) su un canvas 2D: lo stesso che sul set fa da texture. Si dipinge una volta
 * per `chiave`, quando i font sono pronti; il fotogramma aspetta.
 */
export const Disegno: React.FC<{ w: number; h: number; disegna: (ctx: Ctx) => void; chiave: string; style?: CSSProperties }> = ({ w, h, disegna, chiave, style }) => {
  const tela = useRef<HTMLCanvasElement>(null);
  const [attesa] = useState(() => delayRender("disegno dello schermo"));
  const [pronti, setPronti] = useState(false);
  const fatto = useRef(false);
  useEffect(() => {
    document.fonts
      .load("800 100px Inter")
      .then(() => setPronti(true))
      .catch((err) => cancelRender(err));
    // smontato prima di dipingere: il render non deve restare ad aspettarlo
    return () => {
      if (!fatto.current) continueRender(attesa);
      fatto.current = true;
    };
  }, [attesa]);
  useLayoutEffect(() => {
    if (!pronti || !tela.current) return;
    const ctx = tela.current.getContext("2d")!;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    disegna(ctx);
    if (!fatto.current) continueRender(attesa);
    fatto.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pronti, chiave, w, h, attesa]);
  return <canvas ref={tela} width={w} height={h} style={{ display: "block", ...style }} />;
};
