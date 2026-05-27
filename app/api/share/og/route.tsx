import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSongStyle } from "@/config/styles";
import { createServiceRoleClient } from "@/utils/supabase/service-role";
import type { JudgeReport } from "@/types/judge";
import { validationError } from "@/lib/api/errors";

export const runtime = "edge";
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
  return [...report.dimensions].sort((a, b) => b.score - a.score).slice(0, 2);
}

function formatDimensionName(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clampText(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1)}...`
    : value;
}

function ShareImage({ song, report }: { song: OgSong; report: JudgeReport }) {
  const style = getSongStyle(song.style_key);
  const tags = (song.style_tags?.length ? song.style_tags : style.tags).slice(
    0,
    3,
  );
  const topDimensions = getTopDimensions(report);

  return (
    <div
      style={{
        display: "flex",
        width: "1200px",
        height: "630px",
        background: "#020617",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "552px",
          height: "630px",
          background: "#0f172a",
          overflow: "hidden",
        }}
      >
        {song.cover_url ? (
          <img
            src={song.cover_url}
            width="552"
            height="630"
            style={{
              width: "552px",
              height: "630px",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              alignItems: "center",
              justifyContent: "center",
              color: "#334155",
              fontSize: "112px",
              fontWeight: 700,
            }}
          >
            CA
          </div>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(2, 6, 23, 0.78), transparent 62%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "42px",
            right: "42px",
            bottom: "42px",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                borderRadius: "999px",
                background: "rgba(255, 255, 255, 0.92)",
                color: "#020617",
                padding: "10px 16px",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "648px",
          height: "630px",
          padding: "58px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#6ee7b7",
              fontSize: "22px",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Creator Report
          </div>
          <div
            style={{
              marginTop: "26px",
              fontSize: "62px",
              lineHeight: 1.05,
              fontWeight: 800,
            }}
          >
            {clampText(song.title, 52)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "18px" }}>
            <strong style={{ fontSize: "108px", lineHeight: 0.9 }}>
              {report.total_score}
            </strong>
            <span
              style={{
                paddingBottom: "10px",
                color: "#cbd5e1",
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              /100 Score
            </span>
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "34px" }}>
            {topDimensions.map((dimension) => (
              <div
                key={dimension.dimension}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "250px",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.10)",
                  padding: "18px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: "#cbd5e1",
                    fontSize: "20px",
                  }}
                >
                  {formatDimensionName(dimension.dimension)}
                </p>
                <strong style={{ marginTop: "8px", fontSize: "38px" }}>
                  {dimension.score}
                </strong>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              marginTop: "28px",
              borderRadius: "14px",
              background: "white",
              color: "#020617",
              padding: "22px",
              fontSize: "23px",
              lineHeight: 1.35,
            }}
          >
            {clampText(report.share_summary, 150)}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse({
    songId: request.nextUrl.searchParams.get("songId"),
  });

  if (!query.success) {
    return validationError(query.error);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("songs")
    .select("id,title,cover_url,style_key,style_tags,total_score,report_data")
    .eq("id", query.data.songId)
    .eq("status", "ready")
    .single();

  if (error || !data || !isJudgeReport(data.report_data)) {
    return Response.json({ error: "Song not found" }, { status: 404 });
  }

  return new ImageResponse(
    <ShareImage song={data as OgSong} report={data.report_data} />,
    {
      width: 1200,
      height: 630,
      headers: {
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
