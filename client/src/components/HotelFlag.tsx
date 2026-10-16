import clsx from 'clsx';
import { FlaskConical } from 'lucide-react';
import type { HotelId } from '@shared/hotels';

const FLAGS: Record<HotelId, string | null> = {
  com: 'us',
  tr: 'tr',
  br: 'br',
  de: 'de',
  es: 'es',
  fi: 'fi',
  fr: 'fr',
  it: 'it',
  nl: 'nl',
  sandbox: null,
};

export function HotelFlag({ hotel, className }: { hotel: HotelId; className?: string }) {
  const flag = FLAGS[hotel];
  if (!flag) {
    return (
      <span
        className={clsx(
          'flex items-center justify-center rounded-full bg-sky-100 text-sky-600',
          className,
        )}
      >
        <FlaskConical className="size-3/5" aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={`/flags/${flag}.svg`}
      alt=""
      className={clsx('shrink-0 rounded-full shadow-sm ring-1 ring-black/5', className)}
    />
  );
}
