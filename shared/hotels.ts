export const HOTELS = [
  { id: 'com', host: 'www.habbo.com', name: 'Habbo.com' },
  { id: 'tr', host: 'www.habbo.com.tr', name: 'Habbo.com.tr' },
  { id: 'br', host: 'www.habbo.com.br', name: 'Habbo.com.br' },
  { id: 'de', host: 'www.habbo.de', name: 'Habbo.de' },
  { id: 'es', host: 'www.habbo.es', name: 'Habbo.es' },
  { id: 'fi', host: 'www.habbo.fi', name: 'Habbo.fi' },
  { id: 'fr', host: 'www.habbo.fr', name: 'Habbo.fr' },
  { id: 'it', host: 'www.habbo.it', name: 'Habbo.it' },
  { id: 'nl', host: 'www.habbo.nl', name: 'Habbo.nl' },
  { id: 'sandbox', host: 'sandbox.habbo.com', name: 'Sandbox' },
] as const;

export type Hotel = (typeof HOTELS)[number];
export type HotelId = Hotel['id'];

export const HOTEL_IDS = HOTELS.map((hotel) => hotel.id) as [HotelId, ...HotelId[]];

export const HOTEL_ORIGINS = HOTELS.map((hotel) => `https://${hotel.host}`);

export function findHotel(id: string): Hotel | undefined {
  return HOTELS.find((hotel) => hotel.id === id);
}

export function hotelOrigin(id: HotelId): string {
  const hotel = findHotel(id);
  if (!hotel) throw new Error(`Unknown hotel: ${id}`);
  return `https://${hotel.host}`;
}
