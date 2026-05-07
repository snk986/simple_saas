import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const supabaseResponse = await updateSession(request, intlResponse);

  intlResponse.headers.getSetCookie().forEach((cookie) => {
    if (!supabaseResponse.headers.getSetCookie().includes(cookie)) {
      supabaseResponse.headers.append("set-cookie", cookie);
    }
  });

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|.*\\..*).*)"],
};
