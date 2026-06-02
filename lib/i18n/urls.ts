import { defaultLocale, type Locale } from "@/i18n/routing";

export const baseUrl = process.env.BASE_URL ?? "https://calyraai.com";
export const seoLocales = [defaultLocale] as const satisfies readonly Locale[];

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
      seoLocales.map((locale) => [locale, absoluteLocaleUrl(locale, path)]),
    ),
    "x-default": absoluteLocaleUrl(defaultLocale, path),
  };
}
