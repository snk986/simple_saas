# Calyra Video Templates

## `minimal-lyric-wave`

Use this HyperFrames template for song-first social clips: cover art, a real
audio-reactive waveform, and manually timed lyrics.

The stable production workflow is intentionally manual:

1. Find the exact song row in Supabase and copy its `id`.
2. Listen to the song and choose `audioStart` and `audioEnd`.
3. Write down the lyrics actually heard in that clip.
4. Create a clip-relative lyric timing file.
5. Render, watch the result, and adjust only the timing file until it matches.

Do not use Whisper or provider timestamp APIs for this workflow.

Titles are not unique. Confirm the song ID before rendering:

```sql
select id, title, source_type, featured_artist, audio_provider, audio_url
from public.songs
where title ilike 'song title';
```

Create a dedicated lyric-video manifest:

```json
{
  "supabase": {
    "songId": "exact-supabase-song-id"
  },
  "hyperframes": {
    "audioStart": 38,
    "audioEnd": 53,
    "lyricsTimingPath": "song-name-38-53-lyrics.json",
    "output": "public/marketing/song-name-lyric-wave.mp4",
    "inspectionTimestamps": [1, 7, 14]
  }
}
```

Copy `marketing-video/manifests/lyric-video.example.json` and
`lyric-video-timing.example.json` when starting a new video.

The lyric timing file must use seconds relative to the selected clip:

```json
{
  "timebase": "clip",
  "lyrics": [
    { "text": "First lyric line", "start": 0, "end": 3.1 },
    { "text": "Second lyric line", "start": 3.1, "end": 6.8 }
  ]
}
```

Run with:

```powershell
pnpm video:lyric -- --manifest marketing-video/manifests/song-name-lyric.json
```

Generated audio, cover art, working-template files, check frames, and final MP4s
are ignored by Git. Commit the renderer, base template, manifest, and lyric
timing file.

## Product Demo Shorts

Keep `scripts/create-calyra-short-demo-video.mjs` for product-proof marketing
shorts. It shows the story input, generation action, result, and CTA; it serves
a different purpose from a song-first lyric visualizer.

Run with:

```powershell
pnpm video:product-demo
```
