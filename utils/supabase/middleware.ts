import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale, isLocale } from "@/i18n/routing";

const getDashboardRedirectPath = (pathname: string) => {
  const [, maybeLocale, segment] = pathname.split("/");

  if (maybeLocale === "dashboard") {
    return "/sign-in";
  }

  if (isLocale(maybeLocale) && segment === "dashboard") {
    return maybeLocale === defaultLocale
      ? "/sign-in"
      : `/${maybeLocale}/sign-in`;
  }

  return null;
};

export const updateSession = async (
  request: NextRequest,
  response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
) => {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const user = await supabase.auth.getUser();

    const signInPath = getDashboardRedirectPath(request.nextUrl.pathname);
    if (signInPath && user.error) {
      const redirectUrl = new URL(signInPath, request.url);
      redirectUrl.searchParams.set(
        "redirectTo",
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
      );

      const redirectResponse = NextResponse.redirect(redirectUrl);
      response.headers.getSetCookie().forEach((cookie) => {
        redirectResponse.headers.append("set-cookie", cookie);
      });

      return redirectResponse;
    }

    return response;
  } catch {
    return response;
  }
};
