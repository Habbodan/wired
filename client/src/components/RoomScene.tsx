import { motion, useReducedMotion } from 'framer-motion';
import { furniUrl, type FurniName } from '@/lib/furni';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;
const GRID = 7;
const THICKNESS = 10;
const VIEW_WIDTH = GRID * TILE_WIDTH + 40;
const VIEW_HEIGHT = 280;
const ORIGIN_X = VIEW_WIDTH / 2;
const ORIGIN_Y = 16;

interface Placement {
  name: FurniName;
  x: number;
  y: number;
  size: number;
  delay: number;
}

const FURNI: Placement[] = [
  { name: 'user', x: 1, y: 3, size: 64, delay: 0.4 },
  { name: 'furni', x: 3, y: 1, size: 64, delay: 1.2 },
  { name: 'webApi', x: 3, y: 3, size: 58, delay: 0 },
  { name: 'changed', x: 3, y: 5, size: 64, delay: 2 },
  { name: 'room', x: 5, y: 3, size: 64, delay: 0.8 },
];

const corner = (x: number, y: number) => ({
  left: ORIGIN_X + ((x - y) * TILE_WIDTH) / 2,
  top: ORIGIN_Y + ((x + y) * TILE_HEIGHT) / 2,
});

const points = (...pairs: { left: number; top: number }[]) =>
  pairs.map(({ left, top }) => `${left},${top}`).join(' ');

const percent = (value: number, total: number) => `${(value / total) * 100}%`;

function Floor() {
  const right = corner(GRID, 0);
  const bottom = corner(GRID, GRID);
  const left = corner(0, GRID);
  const drop = (point: { left: number; top: number }) => ({
    left: point.left,
    top: point.top + THICKNESS,
  });

  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} className="absolute inset-0 size-full">
      <ellipse
        cx={ORIGIN_X}
        cy={bottom.top + 22}
        rx={GRID * 26}
        ry={12}
        className="fill-sky-900/15"
        filter="blur(6px)"
      />
      <polygon points={points(left, bottom, drop(bottom), drop(left))} fill="#a9bccb" />
      <polygon points={points(bottom, right, drop(right), drop(bottom))} fill="#c3d3df" />
      {Array.from({ length: GRID * GRID }, (_, index) => {
        const x = index % GRID;
        const y = Math.floor(index / GRID);
        return (
          <polygon
            key={index}
            points={points(corner(x, y), corner(x + 1, y), corner(x + 1, y + 1), corner(x, y + 1))}
            fill={(x + y) % 2 === 0 ? '#eef4f8' : '#e6eef4'}
            stroke="#cddbe6"
            strokeWidth={1}
          />
        );
      })}
      {FURNI.map((placement) => (
        <Shadow key={placement.name} {...placement} />
      ))}
    </svg>
  );
}

const motionFor = (delay: number, reduce: boolean | null) => ({
  transition: { duration: 3.2, delay, repeat: Infinity, ease: 'easeInOut' } as const,
  bob: reduce ? undefined : { y: [0, -6, 0] },
  shrink: reduce ? undefined : { scale: [1, 0.78, 1], opacity: [0.9, 0.55, 0.9] },
});

function Shadow({ x, y, size, delay }: Placement) {
  const reduce = useReducedMotion();
  const center = corner(x + 0.5, y + 0.5);
  const { transition, shrink } = motionFor(delay, reduce);

  return (
    <motion.ellipse
      cx={center.left}
      cy={center.top + 2}
      rx={size * 0.42}
      ry={size * 0.2}
      fill="rgb(12 74 110 / 0.22)"
      filter="blur(1.5px)"
      animate={shrink}
      transition={transition}
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  );
}

function Furni({ name, x, y, size, delay }: Placement) {
  const reduce = useReducedMotion();
  const anchor = corner(x + 1, y + 1);
  const { transition, bob } = motionFor(delay, reduce);

  return (
    <motion.img
      src={furniUrl(name)}
      alt=""
      draggable={false}
      animate={bob}
      transition={transition}
      className="pixelated absolute -translate-x-1/2 -translate-y-full select-none"
      style={{
        left: percent(anchor.left, VIEW_WIDTH),
        top: percent(anchor.top, VIEW_HEIGHT),
        width: percent(size, VIEW_WIDTH),
        zIndex: x + y,
      }}
    />
  );
}

export function RoomScene({ className }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ aspectRatio: `${VIEW_WIDTH} / ${VIEW_HEIGHT}` }}
      aria-hidden
    >
      <div className="relative size-full">
        <Floor />
        {FURNI.map((placement) => (
          <Furni key={placement.name} {...placement} />
        ))}
      </div>
    </div>
  );
}
