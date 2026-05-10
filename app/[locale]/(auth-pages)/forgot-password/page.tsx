import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import Link from "next/link";

function localePrefix(locale: Locale) {
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ForgotPassword(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Message>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const signInPath = `${localePrefix(locale)}/sign-in`;

  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your
          password
        </p>
      </div>
      <div className="grid gap-6">
        <form className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
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
            pendingText="Sending reset link..."
          >
            Send reset link
          </SubmitButton>
          <FormMessage message={searchParams} />
        </form>
        <div className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link
            href={signInPath}
            className="text-primary underline underline-offset-4 hover:text-primary/90"
          >
            Sign in
          </Link>
        </div>
      </div>
    </>
  );
}
