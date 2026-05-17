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

export type ActionNeededType = "sign-in" | "pricing";

export function ActionNeededDialog({
  action,
  localePrefix,
  onClose,
}: {
  action: ActionNeededType | null;
  localePrefix: string;
  onClose: () => void;
}) {
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
          <DialogTitle>Action needed</DialogTitle>
          <DialogDescription>
            {action === "sign-in"
              ? "Please sign in before generating music."
              : "Your credits are too low for this generation."}
          </DialogDescription>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}
