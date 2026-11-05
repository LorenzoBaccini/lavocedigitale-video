import { useCurrentFrame } from "remotion";

// Il segno del logo del sito: la V fra le barre audio. Le barre seguono la voce.
const BARS = [
  { x: 8, h: 24 }, { x: 20, h: 46 }, { x: 32, h: 32 },
  { x: 89, h: 32 }, { x: 101, h: 46 }, { x: 113, h: 24 },
];

export const LogoMark: React.FC<{ size: number; color: string; livello?: number }> = ({ size, color, livello }) => {
  const frame = useCurrentFrame();
  const live = livello !== undefined;
  return (
    <svg width={size} height={size * 0.75} viewBox="0 20 128 88">
      <g fill={color}>
        {BARS.map((b, i) => {
          const wobble = 0.55 + 0.45 * Math.sin(frame / 3 + i * 1.7);
          const h = b.h * (live ? 0.45 + 0.9 * livello * wobble : 1);
          return <rect key={i} x={b.x} y={64 - h / 2} width={7} height={h} rx={3.5} />;
        })}
        <path d="M45 34 L55 34 L64 62 L73 34 L83 34 L64 94 Z" />
      </g>
    </svg>
  );
};
