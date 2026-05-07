import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { z } from "zod";
import { getSongStyle } from "@/config/styles";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import type { JudgeReport } from "@/types/judge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  songId: z.string().uuid(),
});

type OgSong = {
  id: string;
  title: string;
  cover_url: string | null;
  style_key: string;
  style_tags: string[] | null;
  total_score: number | null;
  report_data: Record<string, unknown> | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isJudgeReport(value: unknown): value is JudgeReport {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    typeof (value as JudgeReport).total_score === "number" &&
    Array.isArray((value as JudgeReport).dimensions) &&
    typeof (value as JudgeReport).share_summary === "string"
  );
}

function getTopDimensions(report: JudgeReport) {
  return [...report.dimensions]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}

function formatDimensionName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildHtml(song: OgSong, report: JudgeReport) {
  const style = getSongStyle(song.style_key);
  const tags = (song.style_tags?.length ? song.style_tags : style.tags).slice(0, 3);
  const topDimensions = getTopDimensions(report);
  const cover = song.cover_url
    ? `<img src="${escapeHtml(song.cover_url)}" alt="" />`
    : `<div class="fallback">HS</div>`;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        width: 1200px;
        height: 630px;
        overflow: hidden;
        background: #020617;
        color: white;
        font-family: Inter, Arial, sans-serif;
      }
      .card {
        display: grid;
        grid-template-columns: 552px 648px;
        width: 1200px;
        height: 630px;
        background: #020617;
      }
      .cover {
        position: relative;
        overflow: hidden;
        background: #0f172a;
      }
      .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .fallback {
        display: flex;
        width: 100%;
        height: 100%;
        align-items: center;
        justify-content: center;
        color: #334155;
        font-size: 112px;
        font-weight: 700;
      }
      .shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(2, 6, 23, 0.78), transparent 62%);
      }
      .tags {
        position: absolute;
        left: 42px;
        right: 42px;
        bottom: 42px;
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .tag {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.92);
        color: #020617;
        padding: 10px 16px;
        font-size: 22px;
        font-weight: 650;
      }
      .content {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 58px;
      }
      .badge {
        color: #6ee7b7;
        font-size: 22px;
        font-weight: 800;
        text-transform: uppercase;
      }
      h1 {
        display: -webkit-box;
        margin: 26px 0 0;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        font-size: 62px;
        line-height: 1.05;
        letter-spacing: 0;
      }
      .score {
        display: flex;
        align-items: flex-end;
        gap: 18px;
      }
      .score strong {
        font-size: 108px;
        line-height: 0.9;
      }
      .score span {
        padding-bottom: 10px;
        color: #cbd5e1;
        font-size: 28px;
        font-weight: 650;
      }
      .dimensions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-top: 34px;
      }
      .dimension {
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.10);
        padding: 18px;
      }
      .dimension p {
        margin: 0;
        color: #cbd5e1;
        font-size: 20px;
      }
      .dimension strong {
        display: block;
        margin-top: 8px;
        font-size: 38px;
      }
      .summary {
        margin-top: 28px;
        border-radius: 14px;
        background: white;
        color: #020617;
        padding: 22px;
      }
      .summary p {
        display: -webkit-box;
        margin: 0;
        overflow: hidden;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        font-size: 23px;
        line-height: 1.45;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <section class="cover">
        ${cover}
        <div class="shade"></div>
        <div class="tags">
          ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        </div>
      </section>
      <section class="content">
        <div>
          <div class="badge">Creator Report</div>
          <h1>${escapeHtml(song.title)}</h1>
        </div>
        <div>
          <div class="score">
            <strong>${report.total_score}</strong>
            <span>/100 Score</span>
          </div>
          <div class="dimensions">
            ${topDimensions
              .map(
                (dimension) => `<div class="dimension">
                  <p>${escapeHtml(formatDimensionName(dimension.dimension))}</p>
                  <strong>${dimension.score}</strong>
                </div>`,
              )
              .join("")}
          </div>
          <div class="summary">
            <p>${escapeHtml(report.share_summary)}</p>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse({
    songId: request.nextUrl.searchParams.get("songId"),
  });

  if (!query.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,title,cover_url,style_key,style_tags,total_score,report_data")
    .eq("id", query.data.songId)
    .eq("is_public", true)
    .eq("status", "ready")
    .single();

  if (error || !data || !isJudgeReport(data.report_data)) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(buildHtml(data as OgSong, data.report_data), {
      waitUntil: "networkidle0",
    });
    const image = await page.screenshot({ type: "png" });

    return new Response(image, {
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (caught) {
    console.error("Share OG generation error:", caught);
    return NextResponse.json(
      { error: "Failed to generate share image" },
      { status: 500 },
    );
  } finally {
    await browser?.close();
  }
}
