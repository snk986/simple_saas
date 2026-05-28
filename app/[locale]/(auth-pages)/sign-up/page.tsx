import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { mapOAuthErrorToKey } from "@/lib/auth/error-map";
import { baseUrl } from "@/lib/i18n/urls";
import Link from "next/link";

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

function localizedPath(locale: Locale, path: string) {
  return `${localePrefix(locale)}${path}`;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function resolveAuthErrorMessage(
  message: Message,
  t: Awaited<ReturnType<typeof getTranslations>>,
): Message {
  if (!("error" in message)) {
    return message;
  }

  const key = message.error;
  if (!key.startsWith("authErrors.")) {
    return { error: t("generic") };
  }

  const shortKey = key.slice("authErrors.".length);

  try {
    return { error: t(shortKey) };
  } catch {
    return { error: t("generic") };
  }
}

export default async function SignUp(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Message>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const tAuth = await getTranslations({ locale, namespace: "authErrors" });
  const t = await getTranslations({ locale, namespace: "auth" });
  const signUpPath = localizedPath(locale, "/sign-up");
  const signInPath = localizedPath(locale, "/sign-in");
  const homePath = localizedPath(locale, "/");
  const displayMessage = resolveAuthErrorMessage(searchParams, tAuth);

  const signUpWithGoogle = async () => {
    "use server";
    const supabase = await createClient();
    const origin = (await headers()).get("origin") ?? baseUrl;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?redirect_to=${encodeURIComponent(homePath)}`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      return encodedRedirect("error", signUpPath, mapOAuthErrorToKey(error));
    }

    if (data.url) {
      return redirect(data.url);
    }
  };

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("signUp.title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("signUp.subtitle")}</p>
      </div>
      <div className="grid gap-6">
        <form className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              required
            />
          </div>
          <SubmitButton
            className="w-full"
            pendingText={t("signUp.pending")}
            formAction={signUpAction}
            analyticsEventName="signup_submit"
            analyticsProperties={{ locale, method: "email" }}
          >
            {t("signUp.submit")}
          </SubmitButton>
          <FormMessage message={displayMessage} />
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t("continueWith")}
            </span>
          </div>
        </div>
        <form action={signUpWithGoogle}>
          <SubmitButton
            variant="outline"
            className="flex w-full items-center justify-center gap-2"
            pendingText={t("signUp.pending")}
            analyticsEventName="signup_submit"
            analyticsProperties={{ locale, method: "google" }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {t("signUp.google")}
          </SubmitButton>
        </form>
        <div className="text-center text-sm text-muted-foreground">
          {t("signUp.hasAccount")}{" "}
          <Link
            href={signInPath}
            className="text-primary underline underline-offset-4 hover:text-primary/90"
          >
            {t("signUp.signIn")}
          </Link>
        </div>
      </div>
    </>
  );
}
