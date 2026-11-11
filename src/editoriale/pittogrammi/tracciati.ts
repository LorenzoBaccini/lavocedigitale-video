import type { Simbolo } from "../../storyboard/tipi.ts";

// I pittogrammi in un riquadro 100×100, solo linee: il tratto (spessore 6 di norma) lo mette `Pittogramma`, uguale per
// tutti, e i disegni stanno fra 8 e 92 perche' il tratto non esca dal riquadro. I tracciati sono nell'ordine in cui la
// mano li disegna: prima la sagoma, poi i dettagli. Forme generiche, nessun marchio.
export const TRACCIATI: Record<Simbolo, string[]> = {
  lucchetto: [
    "M33 46 V32 A17 17 0 0 1 67 32 V46",
    "M24 46 H76 Q82 46 82 52 V82 Q82 88 76 88 H24 Q18 88 18 82 V52 Q18 46 24 46 Z",
    "M47 62 A3 3 0 1 1 53 62 A3 3 0 1 1 47 62",
    "M50 62 V74",
  ],
  batteria: [
    "M12 30 H74 Q80 30 80 36 V64 Q80 70 74 70 H12 Q6 70 6 64 V36 Q6 30 12 30 Z",
    "M90 42 V58",
    "M20 42 V58",
    "M32 42 V58",
    "M44 42 V58",
  ],
  wifi: [
    "M16.06 38.06 A48 48 0 0 1 83.94 38.06",
    "M27.37 49.37 A32 32 0 0 1 72.63 49.37",
    "M38.69 60.69 A16 16 0 0 1 61.31 60.69",
    "M47 72 A3 3 0 1 0 53 72 A3 3 0 1 0 47 72",
  ],
  segnale: [
    "M8 72 H20 V86 H8 Z",
    "M31 58 H43 V86 H31 Z",
    "M54 40 H66 V86 H54 Z",
    "M77 18 H89 V86 H77 Z",
  ],
  posizione: [
    "M50 88 C40 74 26 58 26 38 A24 24 0 0 1 74 38 C74 58 60 74 50 88 Z",
    "M41 38 A9 9 0 1 0 59 38 A9 9 0 1 0 41 38",
  ],
  altoparlante: [
    "M18 40 H32 L52 22 V78 L32 60 H18 Z",
    "M64.26 39.72 A16 16 0 0 1 64.26 60.28",
    "M74.98 30.72 A30 30 0 0 1 74.98 69.28",
  ],
  documento: [
    "M22 10 H60 L78 28 V90 H22 Z",
    "M60 10 V28 H78",
    "M32 46 H68",
    "M32 60 H68",
    "M32 74 H54",
  ],
  euro: [
    "M79.28 27.02 A30 30 0 1 0 79.28 72.98",
    "M18 43 H62",
    "M18 57 H58",
  ],
  calendario: [
    "M22 22 H78 Q84 22 84 28 V82 Q84 88 78 88 H22 Q16 88 16 82 V28 Q16 22 22 22 Z",
    "M34 12 V30",
    "M66 12 V30",
    "M16 38 H84",
    "M16 55 H84",
    "M16 71 H84",
    "M39 38 V88",
    "M61 38 V88",
  ],
  scudo: [
    "M50 10 C62 18 72 20 84 20 V46 C84 68 70 82 50 92 C30 82 16 68 16 46 V20 C28 20 38 18 50 10 Z",
  ],
};
