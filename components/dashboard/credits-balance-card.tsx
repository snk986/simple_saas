"use client";

import { Coins } from "lucide-react";

type CreditsBalanceCardProps = {
  credits: number;
  songRetentionDays: number | null;
  labels: {
    availableCredits: string;
    subscriberStorage: string;
    freeStorage: string;
  };
};

export function CreditsBalanceCard({
  credits,
  songRetentionDays,
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
    </div>
  );
}
