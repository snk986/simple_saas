import { defineRouting } from "next-intl/routing";

export const locales = ["en", "es", "pt", "ja", "ko"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const localePrefix = "as-needed";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix,
});

export function isLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}
