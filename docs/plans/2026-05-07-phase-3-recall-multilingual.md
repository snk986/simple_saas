# Phase 3 召回与多语言实施计划

> **给 Claude/Codex：** 必须使用 executing-plans，按任务逐步执行本计划。

**目标：** 完成 Hit-Song 的多语言可访问闭环，并建立用户召回能力，让公开增长页、创作入口和邮件触达可以服务 `en/es/pt/ja/ko` 用户。

**架构：** Phase 3 拆成五个独立交付任务：i18n 路由与翻译基建、公开增长页多语言 SEO、召回邮件服务端能力、召回落地入口与追踪、验证与发布检查。所有敏感 API key 只在服务端使用；Supabase session 与 next-intl middleware 的 cookie 必须合并处理；公开页允许匿名访问，召回发送与用户数据读取必须走服务端。

**技术栈：** Next.js 15 App Router、TypeScript、next-intl、Supabase Auth/Postgres、Supabase service role、Resend 或当前架构确认的邮件 Provider、shadcn/ui、Tailwind CSS、pnpm。

---

## 拆分结论

Phase 3 不建议作为一个大任务实现。它同时影响增长页、认证态产品页、公开 SEO、邮件触达、统计归因和翻译资源，任何一个部分出错都可能造成构建失败、locale 404、登录 cookie 丢失或召回邮件误发。

推荐拆分为：

1. Task 9：多语言路由与消息文件基建
2. Task 10：公开增长页多语言 SEO
3. Task 11：召回邮件后端
4. Task 12：召回入口、归因与体验
5. Task 13：全链路验收与发布门禁

---

## Task 9：多语言路由与消息文件基建

**目标：** 让 `en/es/pt/ja/ko` 五种语言都有可加载的消息文件、稳定 URL、正确 middleware，并避免 Supabase session cookie 被 next-intl 覆盖。

**文件：**
- 新增：`i18n/routing.ts`
- 新增：`i18n/navigation.ts`
- 新增：`middleware.ts`
- 修改：`config/i18n.ts`
- 修改：`utils/supabase/middleware.ts`
- 修改：`messages/en.json`
- 新增：`messages/es.json`
- 新增：`messages/pt.json`
- 新增：`messages/ja.json`
- 新增：`messages/ko.json`
- 参考：`app/[locale]/layout.tsx`
- 参考：`app/[locale]/page.tsx`
- 参考：`utils/supabase/middleware.ts`

**实现细节：**

1. 创建 `i18n/routing.ts`：
   - 统一导出 `locales`、`defaultLocale`、`localePrefix`。
   - 英语不带前缀，其他语言带前缀。
   - 保持和 `config/i18n.ts` 当前约定一致：`["en", "es", "pt", "ja", "ko"]`。

2. 创建 `i18n/navigation.ts`：
   - 使用 `next-intl/navigation` 的 `createNavigation()`。
   - 导出本地化后的 `Link`、`redirect`、`usePathname`、`useRouter`。
   - 后续组件里的内部链接优先使用这里导出的 `Link`，避免手写 locale 前缀散落。

3. 修改 `config/i18n.ts`：
   - 继续作为 `getRequestConfig()` 入口。
   - 从 `i18n/routing.ts` 复用 locales 和 defaultLocale。
   - 对非法 locale 回退到 `defaultLocale`，不要让缺失 messages 导致页面崩溃。

4. 创建根 `middleware.ts`：
   - 使用 next-intl middleware 处理 locale 识别。
   - 再调用 `updateSession()` 刷新 Supabase session。
   - 手动合并两个 response 的 cookies，确保 next-intl locale cookie 和 Supabase auth cookie 都保留。
   - matcher 排除 `/_next`、静态资源、favicon、`app/api` 路由。

5. 调整 `utils/supabase/middleware.ts`：
   - 支持接收一个已有 `NextResponse`，在其上设置 Supabase cookies。
   - Dashboard 保护同时覆盖 `/dashboard` 和 `/{locale}/dashboard`。
   - 登录页跳转也要保持 locale：`/es/dashboard` 未登录跳 `/es/sign-in`。

6. 拆分消息文件：
   - 以 `messages/en.json` 作为源语言。
   - 新建 `messages/es.json`、`messages/pt.json`、`messages/ja.json`、`messages/ko.json`。
   - 五个 JSON 的 key 必须完全一致。
   - 只允许中文说明出现在计划文档；代码和消息文件里按目标语言落文案。

**验证：**

- 执行 `pnpm build`。
- 访问 `/create`，应加载英文。
- 访问 `/es/create`、`/pt/create`、`/ja/create`、`/ko/create`，应加载对应消息文件。
- 未登录访问 `/dashboard` 应跳转 `/sign-in`。
- 未登录访问 `/es/dashboard` 应跳转 `/es/sign-in`。
- 登录态刷新页面后 session 不丢失。
- 检查浏览器 cookies：locale cookie 和 Supabase auth cookie 都存在。

---

## Task 10：公开增长页多语言 SEO

**目标：** 让首页、公开 song 页、pricing 等增长页面在五种语言下有可索引内容、canonical、alternate hreflang、结构化数据和稳定 CTA。

**文件：**
- 修改：`app/[locale]/page.tsx`
- 修改：`app/[locale]/song/[id]/page.tsx`
- 修改：`app/[locale]/pricing/page.tsx`，如果文件不存在则创建
- 修改：`app/sitemap.ts`
- 新增：`app/robots.ts`
- 修改：`lib/song/public-song.ts`
- 修改：`components/header.tsx`
- 修改：`components/footer.tsx`
- 修改：`components/song/song-hero.tsx`
- 修改：`components/song/song-seo-summary.tsx`
- 修改：`components/song/song-cta.tsx`
- 修改：`messages/*.json`

**实现细节：**

1. 首页改为可索引 Server Component：
   - 移除首页顶层 `"use client"`。
   - Framer Motion 动效如需保留，拆到小型 Client Component。
   - 所有标题、副标题、CTA、步骤文案使用 `getTranslations()`。
   - 首屏信息密度要高：明确产品名、输入故事生成歌曲、歌词 + 音频 + 报告能力、主要 CTA。

2. 为首页添加 metadata：
   - 每个 locale 生成本地化 title、description。
   - `alternates.canonical` 指向当前语言 URL。
   - `alternates.languages` 包含 `en/es/pt/ja/ko` 和 `x-default`。
   - Open Graph 与 Twitter 文案本地化。

3. 公开 song 页补强多语言 SEO：
   - `generateMetadata()` 中按照 URL locale 输出 title 和 description。
   - `inLanguage` 使用 URL locale；歌曲原始创作语言保留在页面内容中。
   - 添加 hreflang alternates：同一首歌可在五种语言 URL 下展示，canonical 使用当前 URL。
   - OG image 优先使用 Phase 2/Task 7 的分享图接口；没有则回退 coverUrl。

4. `app/sitemap.ts` 生成五语言 URL：
   - 首页、create、pricing、公开 song 都输出 locale URL。
   - 英文 URL 不带 `/en`。
   - 其他语言带 `/{locale}`。
   - 公开 song 使用最近更新时间。

5. 创建 `app/robots.ts`：
   - 允许公开增长页索引。
   - 禁止 dashboard、report 私有页、API 路由索引。
   - 指向 `${BASE_URL}/sitemap.xml`。

6. 更新导航与页脚：
   - Header/Footer 使用本地化 Link。
   - 语言切换入口保留当前 path，切换后进入对应 locale URL。
   - 不把语言切换做成大面积营销模块；保持工具型、低干扰。

**验证：**

- 执行 `pnpm build`。
- 查看 `/`、`/es`、`/pt`、`/ja`、`/ko` 均可访问。
- 查看 `/song/{id}` 与 `/es/song/{id}` 均有不同语言 metadata。
- 查看 `/sitemap.xml` 包含五种语言 URL。
- 查看 `/robots.txt` 存在并禁止私有路径索引。
- 页面源码中能看到 SSR 文案、JSON-LD、canonical 和 hreflang。

---

## Task 11：召回邮件后端

**目标：** 建立服务端召回能力，支持按场景向用户发送本地化邮件，并使用 `email_log` 保证频控和可审计。

**文件：**
- 新增：`lib/email/provider.ts`
- 新增：`lib/email/templates.ts`
- 新增：`lib/recall/types.ts`
- 新增：`lib/recall/eligibility.ts`
- 新增：`app/api/cron/recall/route.ts`
- 修改：`supabase/migrations/20260501000000_hit_song.sql`，仅当现有 `email_log` 字段不够时新增迁移
- 修改：`messages/*.json`
- 参考：`utils/supabase/service-role.ts`

**召回场景：**

1. `draft_no_audio`：
   - 用户生成了歌词但没有完成音频。
   - 触发窗口：创建后 6 小时以上。
   - CTA：回到 `/create` 或歌曲编辑/生成入口。

2. `ready_no_report`：
   - 歌曲已经 ready，但没有生成评判报告。
   - 触发窗口：ready 后 12 小时以上。
   - CTA：进入 `/{locale}/report/{songId}`。

3. `report_no_share`：
   - 已有报告但 `share_count = 0`。
   - 触发窗口：报告生成后 24 小时以上。
   - CTA：进入公开 song 页或报告分享入口。

4. `inactive_creator`：
   - 用户最近 7 天没有新歌，但曾经成功生成过 ready 歌曲。
   - CTA：进入 `/{locale}/create`，带 `utm_campaign=inactive_creator`。

**实现细节：**

1. `lib/email/provider.ts`：
   - 封装邮件发送函数 `sendEmail({ to, subject, html, text })`。
   - 只在 server-side 使用。
   - 读取 `RESEND_API_KEY` 或架构确认的邮件 Provider key。
   - 外部 API 失败最多重试 1 次。
   - 不在日志里打印邮箱、key 或邮件正文。

2. `lib/email/templates.ts`：
   - 定义 `buildRecallEmail()`。
   - 输入：`locale`、`scenario`、`songTitle`、`ctaUrl`。
   - 输出：`subject`、`html`、`text`。
   - 文案从 `messages/{locale}.json` 的 `email.recall.*` key 读取。

3. `lib/recall/eligibility.ts`：
   - 使用 service role 查询候选用户和歌曲。
   - 每个用户每个 `email_type` 在 7 天内最多发送一次。
   - 每次 cron 最多发送 100 封，避免突发。
   - 只召回有邮箱、未删除、存在明确下一步动作的用户。

4. `app/api/cron/recall/route.ts`：
   - 只允许 Cron 调用。
   - 校验 `CRON_SECRET`，缺失或不匹配返回 401。
   - 支持 query：`?scenario=ready_no_report`，方便分批验证。
   - 发送成功后写入 `email_log`。
   - 单个用户失败不阻断整批，最终返回 `{ sent, skipped, failed }`。

5. 如需迁移，新增 `email_log` 字段：
   - `song_id uuid null`
   - `metadata jsonb default '{}'`
   - `status text default 'sent'`
   - 新增索引 `(user_id, email_type, sent_at desc)`。
   - 不改动积分余额，不直接 UPDATE `credits_balance`。

**验证：**

- 执行 `pnpm build`。
- 未带 `CRON_SECRET` 调用 `/api/cron/recall` 返回 401。
- 带错误 secret 返回 401。
- 测试环境带正确 secret 和 `scenario=ready_no_report` 返回 `{ sent, skipped, failed }`。
- 同一用户 7 天内重复调用不会重复发送同类型邮件。
- 邮件 CTA URL 按用户或歌曲 locale 生成。

---

## Task 12：召回入口、归因与体验

**目标：** 让召回邮件点回产品后有明确落地页、可追踪来源，并能继续完成报告生成、分享或二次创作。

**文件：**
- 修改：`app/[locale]/create/page.tsx`
- 修改：`app/[locale]/report/[id]/page.tsx`
- 修改：`app/[locale]/song/[id]/page.tsx`
- 修改：`components/create/*`
- 修改：`components/report/report-actions.tsx`
- 修改：`components/song/song-cta.tsx`
- 修改：`app/api/song/[id]/count/route.ts`
- 修改：`messages/*.json`

**实现细节：**

1. 规范召回链接参数：
   - `utm_source=email`
   - `utm_medium=recall`
   - `utm_campaign={scenario}`
   - `song_id={id}`，仅在场景需要时添加。

2. `/create` 处理召回入口：
   - 如果带 `ref=song&id={id}`，保持当前已有 song CTA 逻辑。
   - 如果带 `utm_campaign=inactive_creator`，展示轻量的回流提示。
   - 提示文案必须来自 `messages/*`，不硬编码中文。
   - 未登录用户可以先登录，登录后回到原始 locale URL。

3. `/report/[id]` 处理 `ready_no_report`：
   - 已登录作者进入后看到生成报告 CTA。
   - 非作者或未登录用户不能看到私有报告数据。
   - 如果报告已经生成，直接展示报告，不重复扣费。

4. `/song/[id]` 处理 `report_no_share`：
   - 公开页 CTA 文案根据 locale 本地化。
   - 分享按钮调用现有 `app/api/song/[id]/count/route.ts` 的 `share_count`。
   - 不信任客户端传来的计数类型，API 只能允许白名单 counter。

5. 归因轻量记录：
   - 不新增第三方分析依赖。
   - 可优先使用 URL UTM + 现有计数表字段。
   - 如果必须持久化更细归因，先新增 `song_events` 表并走服务端写入；不要把它混进 `email_log`。

**验证：**

- 执行 `pnpm build`。
- 点击 `ready_no_report` 邮件链接后，作者能进入报告页并生成报告。
- 点击 `report_no_share` 邮件链接后，公开 song 页可访问，分享后 `share_count` 增加。
- 点击 `inactive_creator` 邮件链接后，进入对应 locale 的 create 页。
- 未登录用户完成登录后不丢失原始召回路径。

---

## Task 13：全链路验收与发布门禁

**目标：** 在 Phase 3 完成后，用固定清单验证构建、多语言、SEO、认证 cookie、召回频控和敏感信息边界。

**文件：**
- 修改：`docs/plans/2026-05-07-phase-3-recall-multilingual.md`，执行时可勾选验收结果
- 按需新增：`docs/checklists/phase-3-release.md`

**验收清单：**

1. 构建：
   - 执行 `pnpm build`。
   - 预期：构建成功，无 TypeScript 错误。

2. Locale URL：
   - `/`
   - `/es`
   - `/pt`
   - `/ja`
   - `/ko`
   - `/create`
   - `/es/create`
   - 每个路径都返回 200。

3. Auth cookie：
   - 登录后访问 `/dashboard` 不丢 session。
   - 登录后访问 `/es/dashboard` 不丢 session。
   - 登出后访问 dashboard 跳转到同 locale sign-in。

4. SEO：
   - 首页和公开 song 页都有 title、description、canonical、hreflang。
   - `/sitemap.xml` 有五语言 URL。
   - `/robots.txt` 禁止私有页索引。
   - 私有 `/report/{id}` metadata 设置 `noindex`。

5. 召回：
   - Cron secret 校验有效。
   - 每个召回场景都能 dry-run 或测试运行。
   - 7 天频控生效。
   - 失败用户不阻断整批。
   - `email_log` 成功写入。

6. 安全：
   - 客户端 bundle 不包含 service role key、Claude key、kie.ai key、Resend key。
   - API Routes 除 webhook、公开 song 计数、公开 OG/SEO 相关接口外都校验 session 或 cron secret。
   - 不在客户端 `console.log` 敏感信息。

---

## 推荐执行顺序

1. 先做 Task 9，因为缺少多语言基建时，后续页面和邮件模板都会反复返工。
2. 再做 Task 10，让公开增长页和 song 页先具备 SEO 闭环。
3. 第三做 Task 11，把召回发送能力放到服务端并接入频控。
4. 第四做 Task 12，让邮件点回后的用户路径闭环。
5. 最后做 Task 13，统一跑构建、SEO、cookie 和召回验收。

---

## 构建门禁

每个任务完成后都执行：

```bash
pnpm build
```

预期：构建成功完成。

当前任务构建通过，并且上面列出的手动检查通过后，再进入下一个任务。
 
---

## Task 13 执行记录

- 日期：2026-05-07
- 发布门禁清单：`docs/checklists/phase-3-release.md`
- 自动化结果：`pnpm build` 通过。
- 剩余项：浏览器登录态检查、真实 Supabase 召回 dry-run、Resend 投递验证需要环境数据和凭证。
