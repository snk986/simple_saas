# Music Gallery 精选歌曲上传指南

这份文档说明如何把本地歌曲作为首页 `Music Gallery` 的精选歌曲上传到 Supabase Storage，并写入现有的 `songs` 表。

## 目标

- 把本地音频和封面上传到项目生成歌曲同一个 Supabase Storage bucket。
- 每首上传歌曲都写入 `public.songs` 表。
- 通过精选字段控制哪些歌曲展示在首页。
- 先用 1 首歌试跑，确认效果后再扩展到 6 首。

## Codex 已实现的内容

1. 给 `public.songs` 增加首页精选相关字段。
2. 新增本地上传脚本。
3. 新增上传清单模板。
4. 首页 `Music Gallery` 改为从数据库读取精选歌曲。
5. 首页播放按钮播放数据库里的 `audio_url`。

## 手动步骤 1：准备 1 首测试歌曲

在你的电脑上准备 1 个音频文件和 1 张封面图片。

推荐格式：

- 音频：`.mp3`、`.wav` 或 `.ogg`
- 封面：`.jpg`、`.png` 或 `.webp`

不要把这些媒体文件放进项目仓库。

## 手动步骤 2：确认环境变量

确认 `.env.local` 中有：

```txt
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
SUPABASE_MEDIA_BUCKET=calyra-ai-media
```

`SUPABASE_MEDIA_BUCKET` 是可选项。如果不填写，上传脚本会默认使用 `calyra-ai-media`。

## 手动步骤 3：创建本地上传清单

复制模板：

```powershell
Copy-Item scripts/featured-gallery.example.json scripts/featured-gallery.local.json
```

然后编辑：

```txt
scripts/featured-gallery.local.json
```

需要填写：

- `ownerUserId`：你的管理员或系统账号的 Supabase Auth User UID
- `title`：首页展示的歌曲标题
- `artist`：首页展示的作者名
- `badge`：首页展示标签，例如 `Pop`
- `audioPath`：本地音频文件的绝对路径
- `coverPath`：本地封面图片的绝对路径
- `styleTags`：写入 `songs.style_tags` 的风格标签

如果只是试跑 1 首歌，`songs` 数组里保留 1 条即可。

## 手动步骤 4：运行上传脚本

运行：

```powershell
node scripts/upload-featured-gallery.mjs scripts/featured-gallery.local.json
```

脚本会自动完成：

- 如果 bucket 不存在，则创建媒体 bucket。
- 上传音频到 `songs/{songId}/audio/primary.*`。
- 上传封面到 `songs/{songId}/cover/cover.*`。
- 向 `songs` 表写入或更新一条记录，并设置 `status = ready`、`is_public = true`、`is_featured = true`。

## 手动步骤 5：检查 Supabase

在 Supabase Storage 中确认文件存在：

```txt
calyra-ai-media/songs/{songId}/audio/primary.*
calyra-ai-media/songs/{songId}/cover/cover.*
```

在 `public.songs` 表中确认这条记录有：

```txt
source_type = official_upload
status = ready
is_public = true
is_featured = true
featured_active = true
featured_rank = 1
audio_url 不为空
cover_url 不为空
```

## 手动步骤 6：检查首页

打开首页，确认：

- `Music Gallery` 展示了上传的歌曲。
- 封面图片正常显示。
- 点击播放按钮可以播放上传的音频。
- 移动端仍然是横向滑动列表。

## 扩展到 6 首歌曲

1 首歌试跑成功后：

1. 在 `scripts/featured-gallery.local.json` 中添加 6 条歌曲。
2. `rank` 分别设置为 `1` 到 `6`。
3. 再次运行上传脚本。
4. 确认首页最多展示 6 首启用状态的精选歌曲，并按 `featured_rank` 排序。

## 后续替换首页歌曲

如果要把一首已经存在的生成歌曲设为首页精选，可以更新它的记录：

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

如果要下架旧的精选歌曲：

```sql
update public.songs
set
  featured_active = false,
  featured_rank = null
where id = 'song-id';
```

## 说明

- 官方上传歌曲使用 `source_type = official_upload`。
- 未来普通用户上传歌曲可以使用 `source_type = user_upload`。
- AI 生成歌曲默认使用 `source_type = ai_generated`。
- 首页精选应该保持管理员控制，普通用户不应该能直接设置 `is_featured`。
