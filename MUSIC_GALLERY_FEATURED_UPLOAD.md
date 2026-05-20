# Music Gallery Featured Upload

This guide describes how to seed the homepage Music Gallery with official uploaded songs stored in Supabase Storage and tracked in the existing `songs` table.

## Goal

- Upload local audio and cover files to the same Supabase Storage bucket used by generated songs.
- Store each uploaded song in `public.songs`.
- Mark selected songs for the homepage with featured fields.
- Start with one song first, then expand to six songs after the test looks good.

## What Codex Implements

1. Add featured metadata fields to `public.songs`.
2. Add a local upload script.
3. Add a manifest template.
4. Change the homepage Music Gallery to read featured songs from the database.
5. Make the gallery play `audio_url` in the browser.

## Manual Step 1: Prepare One Test Song

Prepare one audio file and one cover image on your machine.

Recommended formats:

- Audio: `.mp3`, `.wav`, or `.ogg`
- Cover: `.jpg`, `.png`, or `.webp`

Do not put these media files in the project repository.

## Manual Step 2: Confirm Environment Variables

Confirm `.env.local` has:

```txt
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_MEDIA_BUCKET=calyra-ai-media
```

`SUPABASE_MEDIA_BUCKET` is optional. If it is missing, the script uses `calyra-ai-media`.

## Manual Step 3: Create Your Local Manifest

Copy the template:

```powershell
Copy-Item scripts/featured-gallery.example.json scripts/featured-gallery.local.json
```

Edit `scripts/featured-gallery.local.json`.

Fill:

- `ownerUserId`: your admin/system Supabase auth user id
- `title`: homepage song title
- `artist`: homepage display artist
- `badge`: homepage label, for example `Pop`
- `audioPath`: absolute local path to the audio file
- `coverPath`: absolute local path to the cover file
- `styleTags`: tags stored in `songs.style_tags`

For a one-song test, keep only one item in `songs`.

## Manual Step 4: Run The Upload Script

Run:

```powershell
node scripts/upload-featured-gallery.mjs scripts/featured-gallery.local.json
```

The script will:

- Create the media bucket if needed.
- Upload audio to `songs/{songId}/audio/primary.*`.
- Upload cover art to `songs/{songId}/cover/cover.*`.
- Upsert a `songs` record with `status = ready`, `is_public = true`, and `is_featured = true`.

## Manual Step 5: Check Supabase

In Supabase Storage, confirm files exist:

```txt
calyra-ai-media/songs/{songId}/audio/primary.*
calyra-ai-media/songs/{songId}/cover/cover.*
```

In `public.songs`, confirm the uploaded row has:

```txt
source_type = official_upload
status = ready
is_public = true
is_featured = true
featured_active = true
featured_rank = 1
audio_url is not null
cover_url is not null
```

## Manual Step 6: Check Homepage

Open the homepage and confirm:

- The Music Gallery shows the uploaded song.
- The cover image loads.
- The play button plays the uploaded audio.
- On mobile, the gallery remains a horizontal scroll track.

## Expanding To Six Songs

After the one-song test works:

1. Add six items to `scripts/featured-gallery.local.json`.
2. Use `rank` values from `1` to `6`.
3. Run the upload script again.
4. Confirm the homepage shows up to six active featured songs ordered by `featured_rank`.

## Later Updates

To feature an existing generated song, update its row:

```sql
update public.songs
set
  is_featured = true,
  featured_active = true,
  featured_rank = 1,
  featured_artist = 'Calyra Studio',
  featured_badge = 'Pop',
  featured_at = now()
where id = 'song-id';
```

To remove an old featured song:

```sql
update public.songs
set
  featured_active = false,
  featured_rank = null
where id = 'song-id';
```

## Notes

- Official uploads use `source_type = official_upload`.
- Future user uploads can use `source_type = user_upload`.
- AI-generated songs can keep the default `source_type = ai_generated`.
- Homepage featuring should stay admin-controlled. Ordinary users should not be able to set `is_featured`.
