"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ActionNeededType = "sign-in" | "pricing" | "error";

export function ActionNeededDialog({
  action,
  localePrefix,
  onClose,
  errorMessage,
}: {
  action: ActionNeededType | null;
  localePrefix: string;
  onClose: () => void;
  errorMessage?: string | null;
}) {
  const t = useTranslations("create.songMaker");
  const title =
    action === "error" ? t("generationFailed") : t("actionNeededTitle");
  const description =
    action === "sign-in"
      ? t("signInRequiredMessage")
      : action === "pricing"
        ? t("creditsTooLowMessage")
        : (errorMessage ?? t("tryAgainMessage"));

  return (
    <Dialog
      open={Boolean(action)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md rounded-lg border-border bg-card p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {action === "error" ? (
          <DialogFooter>
            <Button className="w-full sm:w-auto" onClick={onClose}>
              {t("close")}
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter>
            <Button asChild className="w-full sm:w-auto">
              <Link
                href={
                  action === "sign-in"
                    ? `${localePrefix}/sign-in`
                    : `${localePrefix}/pricing`
                }
              >
                {action === "sign-in" ? t("signInCta") : t("topUpCreditsCta")}
              </Link>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
