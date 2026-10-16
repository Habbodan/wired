import { findHotel } from '@shared/hotels';

export function avatarUrl(username: string, hotel: string, headOnly = true): string {
  const host = findHotel(hotel)?.host ?? 'www.habbo.com';
  const params = new URLSearchParams({
    user: username,
    direction: '2',
    head_direction: '3',
    size: 'l',
    ...(headOnly && { headonly: '1' }),
  });
  return `https://${host}/habbo-imaging/avatarimage?${params}`;
}

export function relativeTime(iso: string, language: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
  }
  return format.format(0, 'second');
}
