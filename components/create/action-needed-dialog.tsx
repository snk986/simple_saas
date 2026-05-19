"use client";

import Link from "next/link";
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
  const title = action === "error" ? "Generation failed" : "Action needed";
  const description =
    action === "sign-in"
      ? "Please sign in before generating music."
      : action === "pricing"
        ? "Your credits are too low for this generation."
        : errorMessage ?? "Please try again in a moment.";

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
              Close
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
                {action === "sign-in" ? "Sign in" : "Top up credits"}
              </Link>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
