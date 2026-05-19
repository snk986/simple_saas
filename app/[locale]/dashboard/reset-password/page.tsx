import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { locales, type Locale } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ResetPassword(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Message>;
}) {
  const { locale } = await props.params;
  const searchParams = await props.searchParams;
  const t = await getTranslations({ locale, namespace: "auth.reset" });

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-6 py-10 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <form className="grid gap-4">
        <input type="hidden" name="locale" value={locale} />
        <div className="grid gap-2">
          <Label htmlFor="password">{t("newPasswordLabel")}</Label>
          <Input
            type="password"
            name="password"
            placeholder={t("newPasswordLabel")}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
          <Input
            type="password"
            name="confirmPassword"
            placeholder={t("confirmPasswordLabel")}
            required
          />
        </div>
        <SubmitButton formAction={resetPasswordAction}>
          {t("submit")}
        </SubmitButton>
        <FormMessage message={searchParams} />
      </form>
    </div>
  );
}
