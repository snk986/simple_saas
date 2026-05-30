import { Link } from "@/i18n/navigation";
import { lyricExcerpt, type SongTemplate } from "@/config/song-templates";
import { TemplateGenerateButton } from "@/components/song-templates/template-generate-button";

interface OneClickSongTemplatesProps {
  templates: SongTemplate[];
  lyricsToSongPath: string;
  allTemplatesPath: string;
}

export function OneClickSongTemplates({
  templates,
  lyricsToSongPath,
  allTemplatesPath,
}: OneClickSongTemplatesProps) {
  return (
    <section
      className="mx-auto mt-8 max-w-6xl rounded-[30px] border border-white/20 bg-white/[0.07] p-4 text-left shadow-[0_34px_120px_rgba(0,0,0,0.52)] backdrop-blur sm:p-5"
      aria-labelledby="one-click-templates-title"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-violet-200">
            Featured templates
          </p>
          <h2
            id="one-click-templates-title"
            className="mt-1 text-xl font-black leading-tight tracking-normal text-white sm:text-2xl"
          >
            Ready lyric ideas for your next song.
          </h2>
        </div>
        <Link
          href={allTemplatesPath}
          className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 bg-black/20 px-4 text-sm font-black text-white transition hover:bg-white/[0.12]"
        >
          View all templates
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <article
            key={template.id}
            className="group relative min-h-40 rounded-[22px] border border-white/10 bg-white/[0.055] p-4 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.1]"
          >
            <TemplateGenerateButton
              lyricsToSongPath={lyricsToSongPath}
              title={template.title}
              lyrics={template.lyrics}
              style={template.style}
              className="absolute right-3 top-3 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-600 px-3 text-xs font-black text-white shadow-[0_14px_30px_rgba(139,92,246,0.22)] hover:brightness-110"
            />
            <h3 className="pr-24 text-lg font-black leading-tight tracking-normal text-white">
              {template.title}
            </h3>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-400">
              {lyricExcerpt(template.lyrics, 170)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
