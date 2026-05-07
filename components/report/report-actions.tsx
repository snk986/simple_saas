"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, ExternalLink, RefreshCw, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ReportActionsProps {
  songId: string;
  publicHref: string;
  hasReport: boolean;
}

export function ReportActions({
  songId,
  publicHref,
  hasReport,
}: ReportActionsProps) {
  const t = useTranslations("report.actions");
  const router = useRouter();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateReport() {
    setIsGenerating(true);

    try {
      const response = await fetch("/api/judge/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ songId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? t("generateFailed"));
      }

      toast({ title: t("generated") });
      router.refresh();
    } catch (caught) {
      toast({
        title:
          caught instanceof Error && caught.message
            ? caught.message
            : t("generateFailed"),
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyPublicLink() {
    const url = new URL(publicHref, window.location.origin);
    await navigator.clipboard?.writeText(url.toString());
    await fetch(`/api/song/${songId}/count`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "share" }),
      keepalive: true,
    }).catch(() => undefined);
    toast({ title: t("copied") });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {!hasReport ? (
        <Button
          type="button"
          size="lg"
          className="gap-2"
          disabled={isGenerating}
          onClick={generateReport}
        >
          {isGenerating ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isGenerating ? t("generating") : t("generate")}
        </Button>
      ) : null}

      <Button asChild type="button" variant="outline" className="gap-2">
        <Link href={publicHref}>
          {t("publicPage")}
          <ExternalLink className="h-4 w-4" />
        </Link>
      </Button>

      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={copyPublicLink}
      >
        <Copy className="h-4 w-4" />
        {t("copyPublicLink")}
      </Button>

    </div>
  );
}
