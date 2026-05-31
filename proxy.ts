import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/utils/supabase/middleware";

const handleI18nRouting = createMiddleware(routing);
const localePattern = /^\/(en|es|pt|ja|ko|zh-CN)(?=\/|$)/;
const sessionSegments = new Set(["dashboard", "report", "payment"]);

function needsSession(pathname: string) {
  const pathnameWithoutLocale = pathname.replace(localePattern, "") || "/";
  const segment = pathnameWithoutLocale.split("/")[1];

  return sessionSegments.has(segment);
}

export async function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  if (!needsSession(request.nextUrl.pathname)) {
    return response;
  }

  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
