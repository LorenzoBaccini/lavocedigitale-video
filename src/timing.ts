/** Una parola detta dalla voce, in secondi relativi alla sua clip. */
export interface ParolaTempo {
  t: string;
  da: number;
  a: number;
}

export interface Clip {
  file: string;
  secondi: number;
  inviluppo: number[];
  /** Tempi veri della voce; mancano solo nelle fixture senza voce. */
  parole?: ParolaTempo[];
}

export interface Timing {
  voce: "elevenlabs";
  clips: Clip[];
}

export function problemiTiming(timing: Timing, frasi: string[]): string[] {
  if (timing.clips.length !== frasi.length) return [`${frasi.length} frasi, ${timing.clips.length} clip`];
  return timing.clips.flatMap((clip, i) => {
    const dove = `clip ${i + 1}`;
    const problemi: string[] = [];
    if (!(clip.secondi > 0)) problemi.push(`${dove}: durata non positiva`);
    if (!clip.parole) return problemi;
    const attese = frasi[i].split(/\s+/).filter(Boolean).length;
    if (clip.parole.length !== attese) problemi.push(`${dove}: ${clip.parole.length} parole, la frase ne ha ${attese}`);
    clip.parole.forEach((p, k) => {
      const prima = k > 0 ? clip.parole![k - 1].a : 0;
      if (!(p.da >= prima && p.a >= p.da && p.a <= clip.secondi)) {
        problemi.push(`${dove}: la parola ${k + 1} «${p.t}» ha tempi fuori ordine o fuori dalla clip`);
      }
    });
    return problemi;
  });
}
