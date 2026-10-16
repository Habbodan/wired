import clsx from 'clsx';
import { furniUrl, type FurniName } from '@/lib/furni';

export type { FurniName };

interface WiredFurniProps {
  name: FurniName;
  size?: number;
  className?: string;
}

export function WiredFurni({ name, size = 48, className }: WiredFurniProps) {
  return (
    <img
      src={furniUrl(name)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      draggable={false}
      className={clsx('pixelated object-contain select-none', className)}
      style={{ width: size, height: size }}
    />
  );
}
