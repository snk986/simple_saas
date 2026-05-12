"use client";

import { Coins } from "lucide-react";
import { CreditTransaction } from "@/types/creem";

type CreditsBalanceCardProps = {
  credits: number;
  recentHistory: CreditTransaction[];
  songRetentionDays: number | null;
  locale: string;
  labels: {
    availableCredits: string;
    subscriberStorage: string;
    freeStorage: string;
    recentActivity: string;
    noRecentActivity: string;
  };
};

export function CreditsBalanceCard({
  credits,
  recentHistory,
  songRetentionDays,
  locale,
  labels,
}: CreditsBalanceCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/20">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Coins className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{labels.availableCredits}</p>
          <h3 className="text-2xl font-bold mt-1">{credits}</h3>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {songRetentionDays === null
          ? labels.subscriberStorage
          : labels.freeStorage.replace("{days}", String(songRetentionDays))}
      </p>
      <div className="mt-4 space-y-2">
        <p className="text-sm text-muted-foreground">{labels.recentActivity}</p>
        <div className="space-y-1">
          {recentHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">{labels.noRecentActivity}</p>
          ) : (
            recentHistory.map((history, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span
                  className={
                    history.type === "add" ? "text-primary" : "text-destructive"
                  }
                >
                  {history.type === "add" ? "+" : "-"}
                  {history.amount}
                </span>
                <span className="text-muted-foreground">
                  {new Intl.DateTimeFormat(locale).format(
                    new Date(history.created_at),
                  )}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
