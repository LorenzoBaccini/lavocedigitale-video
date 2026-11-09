import type { Punto2 } from "../set/geometria.ts";
import type { Punto } from "../tratto.ts";
import { sottolineatura } from "../tratto.ts";

/** Una sottolineatura (o un barrato) a pennarello da `a` a `z` nel fotogramma, un poco storta. */
export function trattoFra(a: Punto2, z: Punto2, seme: number): Punto[] {
  const ang = Math.atan2(z.y - a.y, z.x - a.x);
  return sottolineatura(Math.hypot(z.x - a.x, z.y - a.y), seme).map(([x, y]): Punto => [a.x + x * Math.cos(ang) - y * Math.sin(ang), a.y + x * Math.sin(ang) + y * Math.cos(ang)]);
}
