import { defaultLocale, locales, type Locale } from "@/i18n/routing";

export const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

export function localePath(locale: Locale, path = "") {
  const normalizedPath = path === "/" ? "" : path;
  const prefix = locale === defaultLocale ? "" : `/${locale}`;

  return `${prefix}${normalizedPath || "/"}`;
}

export function absoluteLocaleUrl(locale: Locale, path = "") {
  return `${baseUrl}${localePath(locale, path)}`;
}

export function localizedAlternates(path = "") {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, absoluteLocaleUrl(locale, path)]),
    ),
    "x-default": absoluteLocaleUrl(defaultLocale, path),
  };
}
