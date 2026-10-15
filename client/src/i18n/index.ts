import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readString, writeString } from '@/lib/storage';
import { de } from './de';
import { en, type Messages } from './en';
import { es } from './es';
import { fi } from './fi';
import { fr } from './fr';
import { it } from './it';
import { nl } from './nl';
import { ptBR } from './pt-BR';
import { tr } from './tr';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: 'us', messages: en },
  { code: 'tr', label: 'Türkçe', flag: 'tr', messages: tr },
  { code: 'de', label: 'Deutsch', flag: 'de', messages: de },
  { code: 'es', label: 'Español', flag: 'es', messages: es },
  { code: 'fi', label: 'Suomi', flag: 'fi', messages: fi },
  { code: 'fr', label: 'Français', flag: 'fr', messages: fr },
  { code: 'it', label: 'Italiano', flag: 'it', messages: it },
  { code: 'nl', label: 'Nederlands', flag: 'nl', messages: nl },
  { code: 'pt-BR', label: 'Português (Brasil)', flag: 'br', messages: ptBR },
] as const satisfies readonly { code: string; label: string; flag: string; messages: Messages }[];

export type Language = (typeof LANGUAGES)[number]['code'];

const STORAGE_KEY = 'wired.lang';
const TURKEY_TIMEZONES = new Set(['Europe/Istanbul', 'Asia/Istanbul', 'Turkey']);

function isLanguage(value: string | null): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}

export function detectLanguage(): Language {
  const stored = readString('local', STORAGE_KEY);
  if (isLanguage(stored)) return stored;

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TURKEY_TIMEZONES.has(timezone) ? 'tr' : 'en';
}

export function changeLanguage(language: Language): void {
  writeString('local', STORAGE_KEY, language);
  void i18n.changeLanguage(language);
}

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: Messages };
  }
}

void i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    LANGUAGES.map((language) => [language.code, { translation: language.messages }]),
  ),
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});
document.documentElement.lang = i18n.language;

export default i18n;
