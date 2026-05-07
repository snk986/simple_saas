import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, locales, type Locale } from "@/i18n/routing";

export { defaultLocale, locales };
export type { Locale };

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = requestedLocale && isLocale(requestedLocale)
    ? requestedLocale
    : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
