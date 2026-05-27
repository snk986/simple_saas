"use client";

import { Download, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShareCardExportProps {
  songId: string;
  title: string;
  publicHref: string;
}

export function ShareCardExport({
  songId,
  title,
  publicHref,
}: ShareCardExportProps) {
  const t = useTranslations("report.actions");
  const { toast } = useToast();
  const imageHref = `/api/share/og?songId=${encodeURIComponent(songId)}`;

  function countShare() {
    void fetch(`/api/song/${songId}/count`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "share" }),
      keepalive: true,
    }).catch(() => undefined);
  }

  function downloadBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calyra-ai-${songId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function shareCard() {
    const response = await fetch(imageHref, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load share card");
    }

    const blob = await response.blob();
    const file = new File([blob], `calyra-ai-${songId}.png`, {
      type: blob.type || "image/png",
    });

    if (
      navigator.share &&
      navigator.canShare?.({
        files: [file],
      })
    ) {
      await navigator.share({
        title,
        files: [file],
      });
      countShare();
      return;
    }

    downloadBlob(blob);
  }

  async function shareSong() {
    const url = new URL(publicHref, window.location.origin).toString();

    if (navigator.share) {
      await navigator.share({
        title,
        url,
      });
    } else {
      await navigator.clipboard?.writeText(url);
      toast({ title: t("copied") });
    }

    countShare();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => {
          void shareCard().catch(() => {
            toast({ title: "Share card failed" });
          });
        }}
      >
        <Download className="h-4 w-4" />
        {t("downloadShareCard")}
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="gap-2"
        onClick={shareSong}
      >
        <Share2 className="h-4 w-4" />
        {t("shareSong")}
      </Button>
    </div>
  );
}
