# Calyra AI SEO 问题与解决方案记录

更新时间：2026-06-18

本文档用于集中记录 Calyra AI 从项目早期到现在所有已知 SEO 问题、判断、解决方案和验证点。来源包括：

- Git 提交历史中明确包含 SEO、sitemap、robots、metadata、OG、schema、blog、landing 等关键词的提交。
- 当前代码中可确认的 SEO 实现。
- `docs/CALYRA_SOP.md`、`docs/CALYRA_SOP_V1.md`、`docs/CALYRA_SOP_V2.md` 中的复盘记录和会话索引。

说明：如果某个历史问题只有 SOP 或提交标题能确认，本文会标记为“待补细节”，避免把无法从代码还原的内容写成确定事实。

---

## 总原则

1. 英文 SEO 优先，先稳定 `/`、`/ai-song-maker`、`/ai-text-to-song`、`/ai-lyrics-to-song`、`/ai-lyrics-generator`、场景页、博客页和高质量公开歌曲页。
2. 公开增长页必须保留 SSR 可索引文本、结构化数据、内链、首屏核心信息、分享预览和 CTA。
3. 不为了堆词牺牲可信度、移动端首屏效率和转化路径。
4. 多语言页面在翻译质量不稳定时不主动强推 SEO，当前 `seoLocales` 只输出默认英文。
5. 公开歌曲页不全部收录，只让 `public + ready + featured` 或评分高的歌曲进入可索引池。
6. GSC 问题优先级：重要页面 404 > 重要页面错误 noindex > canonical 明显错误 > sitemap 缺漏 > 重要页面无法访问。

---

## 时间线

### 2026-05-01：AI 音乐订阅价格与机会判断

问题：

- 项目还没有明确 SEO 切入点，只知道 AI 音乐工具存在机会。
- 需要判断是做复杂音乐平台，还是先做可被搜索理解的简单工具站。

解决方案：

- 选择先做欧美英语用户能理解的 AI Song Maker 工具站。
- 初步把 SEO 作为长期主线，Product Hunt 和目录站只作为补充曝光。

证据：

- `docs/CALYRA_SOP_V2.md` 来源会话索引包含 `2026-05-01 | AI音乐订阅价格对比`。

状态：

- 已沉淀为项目定位：稳定可用 > SEO 基础 > 首页信任感 > Product Hunt / 目录站 > 高级功能。

### 2026-05-06 至 2026-05-07：公开歌曲页 + SEO 闭环 MVP

问题：

- 生成的歌曲如果只存在用户后台，无法形成可分享、可索引、可回流的资产。
- 缺少公开歌曲详情页、歌词展示、音频播放、相关歌曲、CTA、播放/分享计数和 sitemap。

解决方案：

- 新增 `/song/[id]` 公开歌曲页。
- 新增公开歌曲数据读取层 `lib/song/public-song.ts`。
- 新增歌曲播放、歌词、SEO 摘要、相关歌曲、CTA 等组件。
- 新增 `app/sitemap.ts`，让公开内容具备进入 sitemap 的基础。
- 新增 `song_cta_counter` migration，支持公开页转化计数。

涉及提交：

- `aa248cd`：Task 4: 歌曲公开页 + SEO 闭环 MVP。

涉及文件：

- `app/[locale]/song/[id]/page.tsx`
- `app/sitemap.ts`
- `lib/song/public-song.ts`
- `components/song/*`
- `supabase/migrations/20260507000000_song_cta_counter.sql`

状态：

- 已完成 MVP。当前歌曲页仍保留 `MusicRecording`、`BreadcrumbList`、OpenGraph、Twitter metadata、canonical 和 robots 控制。

### 2026-05-07：分享卡片与 OG 图

问题：

- 歌曲和报告分享时缺少稳定的分享图，社交平台预览不完整。
- 没有动态 OG 图片接口，报告页和歌曲页分享效果弱。

解决方案：

- 新增 `app/api/share/og/route.ts`，生成分享 OG 图。
- 报告页和歌曲页接入分享卡片逻辑。
- 新增报告分享卡片组件和导出组件。

涉及提交：

- `d0b4345`：Task 7：分享卡片与 OG 图。

涉及文件：

- `app/api/share/og/route.ts`
- `app/[locale]/song/[id]/page.tsx`
- `app/[locale]/report/[id]/page.tsx`
- `components/report/share-card.tsx`
- `components/report/share-card-export.tsx`

状态：

- 已完成。当前歌曲页在有报告分数时优先使用 `/api/share/og?songId=...`。

### 2026-05-07：公开增长页多语言 SEO

问题：

- 首页、价格页、公开歌曲页缺少完整 i18n SEO 基础。
- 缺少 robots、localized URL 工具和多语言 alternate 结构。

解决方案：

- 新增 `app/robots.ts`。
- 新增 `lib/i18n/urls.ts`，统一生成 `baseUrl`、locale path、canonical 和 alternates。
- 扩展首页、价格页、歌曲页 metadata。
- 为消息文件补充 SEO 文案。
- 调整 header/footer/mobile nav 的公开增长入口。

涉及提交：

- `38738e0`：Task 10：公开增长页多语言 SEO。

涉及文件：

- `app/robots.ts`
- `app/sitemap.ts`
- `lib/i18n/urls.ts`
- `app/[locale]/page.tsx`
- `app/[locale]/pricing/page.tsx`
- `app/[locale]/song/[id]/page.tsx`
- `messages/*.json`

状态：

- 当前 `robots.ts` 允许 `/`，屏蔽 `/api/`、`/dashboard`、`/*/dashboard`、`/report`、`/*/report`。
- 当前 `seoLocales = [defaultLocale]`，说明 sitemap 和 hreflang 主动输出英文，避免低质量多语言扩散。

### 2026-05-11：SEO 最小审计和优先改造

问题：

- 早期页面 metadata、首页内容密度、关于页结构和 sitemap 仍不足。
- 需要在上线前做一次最小 SEO 审计。

解决方案：

- 重构 About 内容组件。
- 扩展首页 SEO 内容。
- 调整 sitemap，补充可提交页面。

涉及提交：

- `30e4376`：已执行 SEO 最小审计和优先改造。

涉及文件：

- `app/[locale]/about/page.tsx`
- `app/[locale]/page.tsx`
- `app/sitemap.ts`
- `components/about/about-content.tsx`

状态：

- 已完成。About 当前在非默认 locale 下会 `noindex`，避免多语言质量风险。

### 2026-05-12：ja/ko SEO 英文化与异常标点

问题：

- 日语、韩语 SEO 内容存在质量不稳定或混杂问题。
- 歌曲页标题/歌词中异常标点可能影响展示质量。
- 播放/分享计数体验不够实时。

解决方案：

- 调整 ja/ko SEO 文案策略，弱化低质量多语言风险。
- 优化歌曲页展示和计数区域。

涉及提交：

- `1a2963f`：异常标点、ja/ko SEO 英文化、计数实时刷新。

涉及文件：

- `app/[locale]/song/[id]/page.tsx`
- `components/song/lyrics-display.tsx`
- `components/song/song-action-band.tsx`
- `components/song/song-header-stats.tsx`
- `messages/*.json`

状态：

- 已完成。当前更进一步：`seoLocales` 只保留默认英文。

### 2026-05-13：og:image 不显示

问题：

- 首页/公开页面分享时 `og:image` 不正常显示。
- 多个页面重复配置 OG metadata，容易漏字段或不一致。

解决方案：

- 新增 `lib/seo/metadata.ts`，统一 `buildMarketingMetadata()`。
- 新增默认 OG 图资产。
- 首页、About、Pricing 等公开页面改用统一 metadata builder。

涉及提交：

- `81dcbe8`：增加分享时有封面图的功能，解决 og:image 不显示 bug。
- `104dd3c`：首页 og:image 正常显示修改。

涉及文件：

- `lib/seo/metadata.ts`
- `public/og/hit-song-cover.png`
- `public/og/calyra-ai-cover.png`
- `app/[locale]/page.tsx`
- `app/[locale]/about/page.tsx`
- `app/[locale]/pricing/page.tsx`

当前状态：

- 当前默认图为 `https://calyraai.com/og/calyra-ai-cover.jpg`。
- `buildMarketingMetadata()` 会同时输出 OpenGraph 和 Twitter large image。

注意：

- 历史提交中是 `.png`，当前代码引用 `.jpg`。需要确认 `public/og/calyra-ai-cover.jpg` 已存在，目前仓库中可以看到该文件。

### 2026-05-15：首页样式 + SEO 改造

问题：

- 首页需要同时承接 SEO、解释产品、展示 demo 建立信任、引导生成。
- 早期首页可能偏模板 landing page 或内容密度不足。

解决方案：

- 首页重构为更强的公开增长页。
- 补充首页 SEO 文案、结构和视觉。
- 品牌从早期命名切换为 Calyra AI，并同步 logo、metadata、消息文案、Next 配置。

涉及提交：

- `1d1ed46`：首页样式+seo改造。

涉及文件：

- `app/[locale]/page.tsx`
- `messages/*.json`
- `components/header.tsx`
- `components/footer.tsx`
- `components/logo.tsx`
- `next.config.ts`

状态：

- 已完成。当前首页包含生成入口、精选音乐、风格/use case、FAQ、HowTo Schema、SoftwareApplication Schema 和长内容 SEO 区域。

### 2026-05-16：Google 报错优化提示

问题：

- Google 登录或认证相关错误会影响用户进入站点后的转化，也可能造成 GSC 中异常 URL 或登录页体验问题。

解决方案：

- 认证页和 actions 增加友好错误映射。

涉及提交：

- `c36e99a`：google报错优化提示。

涉及文件：

- `app/[locale]/(auth-pages)/sign-in/page.tsx`
- `app/[locale]/(auth-pages)/sign-up/page.tsx`
- `app/actions.ts`
- `lib/auth/error-map.ts`

状态：

- 已完成。认证页布局当前默认 `robots.index = false`，符合不主动收录认证页的策略。

### 2026-05-17：SEO 功能页拆分

问题：

- 首页承载过多生成意图，无法分别匹配 Text to Song、Lyrics to Song、Lyrics Generator 等搜索意图。
- 不同关键词需要独立 URL、metadata、默认 mode 和文案。

解决方案：

- 新增 SEO 工具页：
  - `/text-to-song`
  - `/lyrics-to-song`
  - `/ai-lyrics-generator`
- 新增 `components/seo/seo-tool-page.tsx`、`seo-song-start-form.tsx`、`lyrics-only-generator-form.tsx`。
- 新增 `config/seo-pages.ts` 统一工具页路径。
- sitemap 增加这些页面。

涉及提交：

- `714d6d9`
- `9e7af49`

涉及文件：

- `app/[locale]/ai-lyrics-generator/page.tsx`
- `app/[locale]/lyrics-to-song/page.tsx`
- `app/[locale]/text-to-song/page.tsx`
- `components/seo/*`
- `config/seo-pages.ts`
- `messages/*.json`

状态：

- 后续在 2026-05-18 做了路由改造，旧 `/text-to-song`、`/lyrics-to-song` 已删除。

### 2026-05-18：页面路由 SEO 改造

问题：

- `/text-to-song`、`/lyrics-to-song` 路由命名不够统一，和主关键词结构不一致。
- `/create` 与 SEO 功能页之间职责冲突。
- 非 locale 旧页面和重复页面会带来重复内容、canonical、sitemap 和 GSC 404 风险。

解决方案：

- 删除旧 `/create` 和旧非统一页面。
- 新增统一 SEO 路由：
  - `/ai-song-maker`
  - `/ai-text-to-song`
  - `/ai-lyrics-to-song`
  - `/ai-lyrics-generator`
- 新增 `components/song-maker/song-maker-route-page.tsx`，复用生成工作台但保持各路由独立 metadata 和默认模式。
- 更新 proxy、sitemap、header/footer、checkout 回跳和表单流。

涉及提交：

- `2f0b315`：页面路由 SEO 改造。

涉及文件：

- `app/[locale]/ai-song-maker/page.tsx`
- `app/[locale]/ai-text-to-song/page.tsx`
- `app/[locale]/ai-lyrics-to-song/page.tsx`
- `app/[locale]/ai-lyrics-generator/page.tsx`
- `components/song-maker/song-maker-route-page.tsx`
- `config/seo-pages.ts`
- `app/sitemap.ts`
- `proxy.ts`

状态：

- 已完成。当前工具页通过 `SongMakerRoutePage` 生成 metadata、FAQ Schema、HowTo Schema 和 SoftwareApplication Schema。

### 2026-05-18 至 2026-05-23：AI Lyrics Generator 体验与 SEO 质量

问题：

- 歌词生成页第一屏、布局、失败状态、积分不足提示、Style 和 Song title 模块顺序会影响 SEO 页的转化。
- SEO 页如果只是堆内容但工具不好用，会损害用户信任和停留。

解决方案：

- 生成后直接在当前页面触发流程，不再走草稿中转。
- 优化 insufficient credits、generation failed、左右排布、第一屏内容密度、模块顺序。

涉及提交：

- `7c88d4f`
- `c676707`
- `92d7694`
- `45df607`
- `826a3bd`
- `cf19d5b`
- `327a913`
- `268c490`

涉及文件：

- `app/[locale]/ai-lyrics-generator/page.tsx`
- `components/seo/lyrics-only-generator-form.tsx`
- `messages/*.json`

状态：

- 已完成。该阶段主要是转化与体验优化，不是纯 metadata 修复。

### 2026-05-20：多语言 SEO 页面提交前整理

问题：

- 多语言页面准备提交 sitemap 前，翻译、URL、layout metadata、法务页等需要统一。
- 低质量翻译或重复 alternate 可能拖累站点质量。

解决方案：

- 整理多语言消息文件。
- 更新 `lib/i18n/urls.ts` 和 `app/sitemap.ts`。
- 认证页、About、隐私、退款、条款等页面 metadata 统一。
- 根 layout 增加必要 metadata。

涉及提交：

- `c1c1c21`：Complete multilingual SEO pages before sitemap submission。

涉及文件：

- `app/sitemap.ts`
- `lib/i18n/urls.ts`
- `app/layout.tsx`
- `app/[locale]/*`
- `messages/*.json`

状态：

- 后续策略收敛为英文优先。当前 `seoLocales` 只主动输出默认英文。

### 2026-05-20：清理 ai-lyrics-to-song URL 参数

问题：

- SEO 工具页跳转和生成流程使用不必要 query 参数，可能造成重复 URL、参数页、canonical 混乱和 GSC duplicate。

解决方案：

- 清理 `/ai-lyrics-to-song` URL 中不必要的 query 参数。
- 调整首页 hero form、story input 和 song maker route page。

涉及提交：

- `76cee70`：Clean up ai-lyrics-to-song URL and remove unnecessary query parameters。

涉及文件：

- `app/[locale]/ai-lyrics-to-song/page.tsx`
- `components/create/story-input.tsx`
- `components/home/hero-generator-form.tsx`
- `components/seo/seo-song-start-form.tsx`
- `components/song-maker/song-maker-route-page.tsx`

状态：

- 已完成。继续坚持 canonical 使用干净路径。

### 2026-05-22：SEO 文案优化

问题：

- 多语言消息文件中的 SEO 文案需要进一步调整。

解决方案：

- 修改 `messages/*.json` 中相关 SEO 文案。

涉及提交：

- `a66f7af`：seo优化。

状态：

- 已完成。提交标题没有提供更多细节，待补当时具体问题。

### 2026-05-22：Google Search Console 提交

问题：

- 站点提交 GSC 后出现收录状态问题，需要确定处理优先级。

已遇到的状态：

- Search Console URL 404。
- Discovered - currently not indexed。
- Crawled - currently not indexed。
- Excluded by noindex tag。
- Page with redirect。
- Duplicate, Google chose different canonical than user。
- Not found 404。

解决方案：

- 不要一看到 duplicate 或 discovered 就乱改。
- 优先处理 404、错误 noindex、canonical 错误、sitemap 缺失、重要页面不可访问。
- 对非核心页面 noindex、正常 redirect、Bing discovered but not crawled 保持观察。

证据：

- `docs/CALYRA_SOP_V2.md` 来源会话索引包含 `2026-05-22 | Google Search Console 提交`、`2026-05-22 | SEO优化建议`。

状态：

- 已沉淀为 SOP。具体 GSC URL 列表待补。

### 2026-05-23：公开歌曲索引分层

问题：

- 所有公开/分享歌曲都被索引会带来低质量内容风险。
- 用户普通分享链接需要可访问，但不一定应该进入 Google index。
- 精选作品是否单独开页面存在取舍。

解决方案：

- 确定分层：
  - 默认生成：private 或 unlisted。
  - 普通分享链接：可访问，但 noindex。
  - 用户明确发布：public。
  - 只有 public + featured 或 high quality score 的歌曲进入 sitemap 和首页 Gallery。
- SEO 主力放在工具页、风格页、场景页、博客页、精选作品页。
- 精选公开作品只在首页展示，不单独开一个低内容密度页面。

涉及提交：

- `70c970a`：精选公开作品只在首页展示就好了...

涉及文件：

- `app/[locale]/page.tsx`
- `app/[locale]/song/[id]/page.tsx`
- `lib/song/public-song.ts`
- `app/api/songs/generate/route.ts`
- `components/dashboard/song-list.tsx`

当前状态：

- 歌曲页 metadata 中 `shouldIndex` 条件为 `isPublic && status === "ready" && (isFeatured 或 totalScore >= 80)`。
- sitemap 查询条件为 `is_public = true`、`status = ready`、`total_score >= 80 或 is_featured = true`，再过滤 `featured_active !== false`。
- 首页 Gallery 同样只取 public ready 且 featured/high score 的歌曲。

### 2026-05-28：GSC URL 404 问题

问题：

- GSC 中 `sc-domain:calyraai.com` 出现 URL 404。
- 可能来自旧路由、无 locale 路由、重命名后的旧 URL 或 sitemap 历史提交。

解决方案：

- 修改 `next.config.ts`，增加相关 URL 处理规则。

涉及提交：

- `d3df6b2`：修改 Google Search Console 上的 URL 404 问题。

涉及文件：

- `next.config.ts`

状态：

- 已处理。具体 URL 列表待补。

### 2026-06-02：SEO 优化建议

问题：

- 存在一轮 SEO 优化建议会话，但当前仓库没有对应明确提交细节。

解决方案：

- 待补。

证据：

- `docs/CALYRA_SOP_V2.md` 来源会话索引包含 `2026-06-02 | SEO优化建议`。

状态：

- 待补当时建议、采用项和未采用项。

### 2026-06-03：歌曲页和 sitemap SEO 优化

问题：

- 歌曲页、sitemap、locale layout、report page 和 i18n routing 仍有 SEO 细节需要修正。
- 可能涉及 canonical、locale、noindex 或重复 sitemap 规则。

解决方案：

- 优化 `app/[locale]/song/[id]/page.tsx` 和 `app/sitemap.ts`。
- 优化 `app/[locale]/layout.tsx`、`app/[locale]/report/[id]/page.tsx`、`i18n/routing.ts`、`lib/i18n/urls.ts`。

涉及提交：

- `653c573`：seo 优化。
- `3f9ef23`：seo 优化。

涉及文件：

- `app/[locale]/song/[id]/page.tsx`
- `app/sitemap.ts`
- `app/[locale]/layout.tsx`
- `app/[locale]/report/[id]/page.tsx`
- `i18n/routing.ts`
- `lib/i18n/urls.ts`

当前状态：

- `app/[locale]/layout.tsx` 对无效 locale 返回 `noindex`。
- `report/[id]` 页面明确 `robots.index = false`。
- `localizedAlternates()` 现在只基于 `seoLocales` 输出默认英文和 `x-default`。

### 2026-06-04：SEO 页面优化建议

问题：

- SEO 页面仍需要提高内容质量、结构、内链或转化。

解决方案：

- 待补。

证据：

- `docs/CALYRA_SOP_V2.md` 来源会话索引包含 `2026-06-04 | SEO 页面优化建议`。

状态：

- 待补当时建议、采用项和未采用项。

### 2026-06-05：新增 royalty-free-ai-music-generator 页面

问题：

- 现有主工具页不能完整承接 “royalty-free AI music generator” 这类商业使用/创作者场景搜索意图。
- 如果把所有意图塞进 `/ai-song-maker`，页面会变散、重复和低转化。

解决方案：

- 新增 `/royalty-free-ai-music-generator` 场景 SEO 页面。
- 内容重点放在 YouTube、TikTok、Reels、ads、podcast、game/app background music、commercial use、licensing/rights FAQ。
- 接入 `config/seo-pages.ts` 和 footer。
- 后续做了一轮页面 SEO 优化。

涉及提交：

- `06e1fe0`：增加 royalty-free-ai-music-generator SEO 页面。
- `57d2144`：royalty-free-ai-music-generator 页面 seo 优化。

涉及文件：

- `app/[locale]/royalty-free-ai-music-generator/page.tsx`
- `config/seo-pages.ts`
- `components/footer.tsx`

当前状态：

- 页面有独立 metadata、canonical、localizedAlternates 和 FAQPage JSON-LD。

### 2026-06-05：新增 World Cup 热词页面

问题：

- 世界杯相关歌曲生成是季节性热词，主工具页无法精准承接。
- 需要场景页承接 “world cup song generator” 搜索意图。

解决方案：

- 新增 `/world-cup-song-generator`。
- 接入 footer、SEO page config、多语言消息。

涉及提交：

- `7dfe97f`：增加世界杯热词 SEO 页面。

涉及文件：

- `app/[locale]/world-cup-song-generator/page.tsx`
- `config/seo-pages.ts`
- `components/footer.tsx`
- `messages/*.json`

当前状态：

- 当前页面对非英文 locale 返回 `robots.index = false`，只主动推英文。
- 页面有独立 canonical 和 FAQPage JSON-LD。

### 2026-06-07：检查首页和 SEO landing page 多 H1

问题：

- 首页或 SEO landing page 可能出现多个 `<h1>`，影响语义层级和 SEO 质量。

解决方案：

- 检查首页和所有 SEO landing page 的 H1。
- 修改 `components/create/story-input.tsx`，避免嵌入式组件在页面内引入额外 H1。

涉及提交：

- `18e91a5`：Check the homepage and all SEO landing pages for multiple `<h1>` tags。

涉及文件：

- `components/create/story-input.tsx`

状态：

- 已处理。后续 UI 修改仍需检查每页只保留一个主 H1。

### 2026-06-14：精选歌曲取消 noindex 并加入 sitemap

问题：

- 高质量精选歌曲此前可能仍被 noindex 或未进入 sitemap，导致可作为 SEO 资产的页面没有被提交。

解决方案：

- 对精选/高评分公开歌曲取消 noindex。
- 将精选/高评分公开歌曲加入 sitemap。
- `lib/song/public-song.ts` 增加必要字段。

涉及提交：

- `6a8e37e`：Task 1: 精选歌曲页取消 noindex + Task 2: 精选歌曲加入 sitemap。

涉及文件：

- `app/[locale]/song/[id]/page.tsx`
- `app/sitemap.ts`
- `lib/song/public-song.ts`

当前状态：

- `shouldIndex` 和 sitemap 规则已按 featured/high score 分层。

### 2026-06-14：首页不与 ai-make-song 抢 SEO 热词

问题：

- 首页如果过度抢 “ai make song” 等竞品/相近词，可能造成关键词定位混乱，且不利于建立 Calyra 自己的主线。

解决方案：

- 调整首页英文 SEO 文案，避免和 `ai-make-song` 抢同一热词。
- 首页聚焦 Calyra AI、AI Song Maker、AI Music Generator 和真实创作工作流。

涉及提交：

- `78fefe8`：首页不与 ai-make-song 抢 SEO 热词。

涉及文件：

- `messages/en.json`

状态：

- 已处理。

### 2026-06-17：扩展首页 SEO 长内容区域

问题：

- 首页需要更强的长内容语义密度，覆盖工具价值、创作者场景、商用授权、为什么选择 Calyra 等信息。
- 但不能变成低信息密度或堆词 landing page。

解决方案：

- 扩展首页 SEO 长内容区域。
- 在 `messages/en.json` 中补充长段内容。
- 首页把 `home.seo.sections` 渲染为可索引内容，并保留内链到 `/ai-song-maker`、`/pricing`、`/about`。

涉及提交：

- `5481edb`：Task #1: 扩展首页 SEO 长内容区域。

涉及文件：

- `app/[locale]/page.tsx`
- `messages/en.json`

当前状态：

- 首页 `seoSections` 从英文 `home.seo` 读取内容，确保默认英文语义完整。

### 2026-06-17：优化 HowTo Schema 提升 Rich Results

问题：

- 首页和核心工具页的 HowTo Schema 不够完整，可能无法充分支持 Google Rich Results。

解决方案：

- 首页和 `SongMakerRoutePage` 增强 HowTo Schema。
- 增加 supply/tool/step 等更完整字段。

涉及提交：

- `db758c0`：Task #5: 优化 HowTo Schema 提升 Google Rich Results。

涉及文件：

- `app/[locale]/page.tsx`
- `components/song-maker/song-maker-route-page.tsx`

当前状态：

- 首页有 `SoftwareApplication`、`FAQPage`、`HowTo` JSON-LD。
- 工具页有 `SoftwareApplication`、`FAQPage`、`HowTo` JSON-LD。

### 2026-06-17：新增 3 篇长 Blog

问题：

- 站点缺少可长期承接信息型搜索意图的博客内容。
- 工具页偏交易/功能意图，不足以覆盖教程类、指南类、免费工具类关键词。

解决方案：

- 新增博客配置和文章内容。
- 博客详情页支持 Article / HowTo Schema。
- 博客组件增强文章正文结构。

涉及提交：

- `7a2ba3d`：任务4：写3篇长 blog。

涉及文件：

- `app/[locale]/blog/[slug]/page.tsx`
- `components/blog/blog-article.tsx`
- `config/blog-articles.ts`

当前状态：

- `config/blog-articles.ts` 中存在 3 篇文章：
  - `how-to-turn-lyrics-into-a-song-with-ai`
  - `how-to-make-ai-music-for-free-in-2026`
  - `ai-song-maker-guide`
- sitemap 已包含 `/blog` 和每篇文章。
- 博客详情页生成 Article 或 HowTo JSON-LD、FAQPage 和 BreadcrumbList。

### 2026-06-18：SEO 优化

问题：

- 法务页、歌曲页和统一 metadata 仍有 SEO 细节需要补齐。
- 隐私、退款、条款等页面不应主动收录，但仍需要 canonical、OG/Twitter 等基础 metadata。
- 歌曲页 metadata 细节需要修正。

解决方案：

- 更新 `privacy`、`refund`、`terms` 页面。
- 更新歌曲页。
- 更新 `lib/seo/metadata.ts`。

涉及提交：

- `218b4c4`：SEO优化。

涉及文件：

- `app/[locale]/privacy/page.tsx`
- `app/[locale]/refund/page.tsx`
- `app/[locale]/terms/page.tsx`
- `app/[locale]/song/[id]/page.tsx`
- `lib/seo/metadata.ts`

当前状态：

- 法务页明确 `robots.index = false`，但保留 canonical 和 alternates。
- `buildMarketingMetadata()` 统一输出默认 OG 图宽高和 alt。

---

## 当前 SEO 实现清单

### 基础 URL 与语言

- `lib/i18n/urls.ts`
  - `baseUrl = process.env.BASE_URL ?? "https://calyraai.com"`
  - `seoLocales = [defaultLocale]`
  - `localePath()`
  - `absoluteLocaleUrl()`
  - `localizedAlternates()`

结论：

- 当前主动 SEO 只推默认英文，其他语言不主动进 sitemap/hreflang。

### robots

- `app/robots.ts`
  - `allow: "/"`
  - `disallow: ["/api/", "/dashboard", "/*/dashboard", "/report", "/*/report"]`
  - `sitemap: https://calyraai.com/sitemap.xml`

结论：

- 核心公开页允许抓取。
- API、Dashboard、Report 被屏蔽。

### sitemap

- `app/sitemap.ts`
  - 首页
  - About
  - 所有 `SEO_TOOL_PAGE_KEYS`
  - `/free-ai-lyrics-generator`
  - `/pricing`
  - `/blog`
  - 所有 blog article
  - 高质量公开歌曲

歌曲进入 sitemap 条件：

- `is_public = true`
- `status = ready`
- `total_score >= 80` 或 `is_featured = true`
- 二次过滤：`featured_active !== false` 或 `total_score >= 80`
- 最多 500 首

### metadata

- `lib/seo/metadata.ts`
  - 统一 title、description、alternates、robots、OpenGraph、Twitter。
  - 默认 OG 图：`/og/calyra-ai-cover.jpg`。

注意：

- 新增公开增长页应优先使用 `buildMarketingMetadata()`。

### 首页

- `app/[locale]/page.tsx`
  - 独立 generateMetadata。
  - canonical + localizedAlternates。
  - SoftwareApplication JSON-LD。
  - FAQPage JSON-LD。
  - HowTo JSON-LD。
  - SSR 长内容 SEO section。
  - 首页 Gallery 只展示 public ready 且 featured/high score 的歌曲。

### SEO 工具页

- `components/song-maker/song-maker-route-page.tsx`
  - 供 `/ai-song-maker`、`/ai-text-to-song`、`/ai-lyrics-to-song` 使用。
  - 独立 metadata。
  - canonical + localizedAlternates。
  - SoftwareApplication、FAQPage、HowTo JSON-LD。

- `app/[locale]/ai-lyrics-generator/page.tsx`
  - 独立 metadata。
  - SoftwareApplication + FAQPage JSON-LD。

- `app/[locale]/ai-birthday-song-generator/page.tsx`
  - 独立 metadata。
  - JSON-LD。

- `app/[locale]/royalty-free-ai-music-generator/page.tsx`
  - 独立 metadata。
  - FAQPage JSON-LD。

- `app/[locale]/world-cup-song-generator/page.tsx`
  - 非默认 locale `noindex`。
  - 默认英文有独立 metadata 和 FAQPage JSON-LD。

### 公开歌曲页

- `app/[locale]/song/[id]/page.tsx`
  - canonical 固定指向英文 `/song/{id}`。
  - `robots.index = locale === defaultLocale && shouldIndex`。
  - `shouldIndex = isPublic && ready && (featured 或 totalScore >= 80)`。
  - OpenGraph type 为 `music.song`。
  - Twitter large image。
  - MusicRecording JSON-LD。
  - BreadcrumbList JSON-LD。

### 博客

- `app/[locale]/blog/page.tsx`
  - 默认英文可索引。
  - 非默认 locale noindex。

- `app/[locale]/blog/[slug]/page.tsx`
  - 静态参数来自 `config/blog-articles.ts`。
  - Article 或 HowTo JSON-LD。
  - FAQPage JSON-LD。
  - BreadcrumbList JSON-LD。

### noindex 页面

- 认证页 layout：`app/[locale]/(auth-pages)/layout.tsx`。
- 报告页：`app/[locale]/report/[id]/page.tsx`。
- Privacy / Refund / Terms：保留 metadata，但 `robots.index = false`。
- 无效 locale：`app/[locale]/layout.tsx` 返回 noindex。
- About、free lyrics generator 等页面在非默认 locale 下可能 noindex，具体以页面代码为准。

---

## 已知 SEO 问题类型与处理方案

### 1. GSC 404

可能原因：

- 旧 URL 已删除，例如早期 `/create`、`/text-to-song`、`/lyrics-to-song`。
- sitemap 曾提交旧路径。
- 非 locale 页面和 locale 页面重构造成历史 URL 残留。

处理方案：

- 先确认 URL 是否仍有价值。
- 有价值则加 redirect。
- 无价值且不是 sitemap 当前提交项，可以让 404 自然退出索引。
- 检查 sitemap 不再输出旧路径。

### 2. Excluded by noindex

可能原因：

- 页面本来就不该收录，例如 auth、dashboard、report、普通分享歌曲。
- 重要页面误加 noindex。

处理方案：

- 先判断页面类型。
- 核心公开页不能 noindex。
- 普通分享歌曲、低质量多语言页、私有/报告/登录页可以 noindex。

### 3. Duplicate, Google chose different canonical

可能原因：

- query 参数页。
- 旧路由和新路由共存。
- 多语言 alternate/canonical 不一致。
- sitemap 提交了不该提交的 URL。
- 页面内容太相似。

处理方案：

- 检查 canonical 是否指向干净主 URL。
- 清理不必要 query 参数。
- sitemap 只提交主 URL。
- 不要一看到 duplicate 就大改，先判断是否正常。

### 4. Discovered / Crawled currently not indexed

可能原因：

- 新站权重低。
- 内容质量不足。
- 页面重复。
- 内链弱。
- Google 尚未完成评估。

处理方案：

- 不作为最高优先级。
- 优先提升内容质量、内链和页面稳定性。
- 避免频繁改 URL。

### 5. 多语言质量拖累 SEO

可能原因：

- 非英文页面混入英文。
- 翻译质量不一致。
- 多语言页面内容重复或不完整。

处理方案：

- 英文优先。
- `seoLocales` 只输出默认英文。
- 非默认 locale 可保留给用户使用，但不主动提交 sitemap。
- 翻译质量稳定后再逐步开放多语言 SEO。

### 6. 生成结果页低质量收录

可能原因：

- 用户生成内容质量不可控。
- 大量短歌词、测试内容、失败内容进入索引。

处理方案：

- 普通分享可访问但 noindex。
- 只有 `public + ready + featured/high score` 才允许 index 和进 sitemap。
- 首页 Gallery 也只展示精选/高分歌曲。

### 7. OG 图不显示

可能原因：

- 缺少默认 OG 图。
- 页面 metadata 配置不一致。
- 图片路径或格式切换后未同步。

处理方案：

- 使用 `buildMarketingMetadata()`。
- 保证 `public/og/calyra-ai-cover.jpg` 存在。
- 歌曲页优先动态分享图，其次用 cover。

### 8. 多 H1

可能原因：

- 页面组件内部带 H1，被多个 SEO 页复用。
- 首页嵌入工具组件时重复主标题。

处理方案：

- 每个页面只保留一个主 H1。
- 嵌入式表单/工具组件内部用 `h2`、`h3` 或普通文本。
- 新增 SEO 页必须人工检查 heading 层级。

### 9. 首页 SEO 太重或像模板 landing page

可能原因：

- 为了关键词堆长文，牺牲首屏清晰度和转化。
- 视觉过度营销化，工具入口不明显。

处理方案：

- 首页第一屏保留可用生成入口。
- SEO 长内容放在首屏之后，并用内链服务用户任务。
- 保持 Material 3 / 现代工具感，避免低信息密度 hero 和过度装饰。

---

## 每次 SEO 修改后的检查清单

1. `pnpm build` 通过。
2. 目标页面只有一个 H1。
3. 页面有唯一 canonical。
4. sitemap 是否包含应该提交的 URL。
5. sitemap 是否排除了旧 URL、参数 URL、低质量 URL。
6. robots 没有误屏蔽核心公开页面。
7. noindex 只出现在应该 noindex 的页面。
8. OpenGraph 和 Twitter 图片可访问。
9. JSON-LD 类型与页面内容一致。
10. 首页、工具页、博客页、歌曲页保留 SSR 可索引文本。
11. 非默认语言如果翻译不完整，不主动进入 sitemap。
12. GSC 问题按优先级处理，不因 discovered 或 duplicate 状态频繁大改 URL。

---

## 待补信息

这些内容在 SOP 或提交标题中出现，但当前代码和提交摘要不能完整还原细节：

1. 2026-05-22 GSC 中具体 404 URL 列表。
2. 2026-05-22 `SEO优化建议` 的原始建议和采用情况。
3. 2026-06-02 `SEO优化建议` 的原始建议和采用情况。
4. 2026-06-04 `SEO 页面优化建议` 的原始建议和采用情况。
5. 2026-05-14 `SEO 关键词分析指导` 的 Semrush 关键词原始表。
6. 早期 Google 邮箱、Google Console、Search Console 申请和配置过程。
7. 竞品 AIMakeSong 等页面截图、关键词和参考项的原始记录。

