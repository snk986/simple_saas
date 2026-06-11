import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/utils/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);
const localePattern = /^\/(en|es|pt|ja|ko|zh-CN)(?=\/|$)/;
const repeatedLocalePattern = /^\/(en|es|pt|ja|ko|zh-CN)\/\1(?=\/|$)/;
const sessionSegments = new Set(["dashboard", "report", "payment"]);

function normalizeRepeatedLocale(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const normalizedPathname = pathname.replace(repeatedLocalePattern, "/$1");

  if (normalizedPathname === pathname) {
    return null;
  }

  const url = request.nextUrl.clone();
  url.pathname = normalizedPathname;

  return NextResponse.redirect(url, 308);
}

function needsSession(pathname: string) {
  const pathnameWithoutLocale = pathname.replace(localePattern, "") || "/";
  const segment = pathnameWithoutLocale.split("/")[1];

  return sessionSegments.has(segment);
}

export async function proxy(request: NextRequest) {
  const normalizedLocaleResponse = normalizeRepeatedLocale(request);
  if (normalizedLocaleResponse) {
    return normalizedLocaleResponse;
  }

  const response = handleI18nRouting(request);

  if (!needsSession(request.nextUrl.pathname)) {
    return response;
  }

  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
