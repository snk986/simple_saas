import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
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

export default async function ForgotPassword(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Message>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const tAuth = await getTranslations({ locale, namespace: "authErrors" });
  const t = await getTranslations({ locale, namespace: "auth" });
  const signInPath = `${localePrefix(locale)}/sign-in`;
  const displayMessage = resolveAuthErrorMessage(searchParams, tAuth);

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("forgot.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("forgot.subtitle")}
        </p>
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
          <SubmitButton
            className="w-full"
            formAction={forgotPasswordAction}
            pendingText={t("forgot.pending")}
          >
            {t("forgot.submit")}
          </SubmitButton>
          <FormMessage message={displayMessage} />
        </form>
        <div className="text-center text-sm text-muted-foreground">
          {t("forgot.remember")}{" "}
          <Link
            href={signInPath}
            className="text-primary underline underline-offset-4 hover:text-primary/90"
          >
            {t("forgot.signIn")}
          </Link>
        </div>
      </div>
    </>
  );
}
