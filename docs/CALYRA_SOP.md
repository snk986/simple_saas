# Calyra AI 项目 SOP V1

版本：V1  
日期：2026-05-31  
用途：给自己复盘、给团队执行、后续整理文章/课程、未来复制第二个 SaaS 项目。  
原则：先记录当前已确认事实；不确定内容标记为“待补充”或“待确认”；等 ChatGPT 网页导出数据到位后再整理 V2。

## 0. V1 信息来源

本版 SOP 已吸收：

- 当前仓库扫描：PRD、架构文档、阶段计划、排障记录、API 路由、数据库迁移、Git 提交记录。
- 附件复制页：`Calyra AI 项目 SOP V1`。
- Codex 本地会话记录：`C:\Users\Admin\.codex\sessions\2026\05\*.jsonl` 和 `C:\Users\Admin\.codex\session_index.jsonl`。
- 人工补充信息：
  - 起点来自竞品观察、SEO 词机会，以及 Semrush Keyword Magic 热词查询。
  - Suno 提供生成歌曲流程启发。
  - AIMakeSong 和其他 AI song maker 站点提供 SEO 页面结构启发。
  - `ai song maker` SEO 方向、隐藏中文入口参考了竞品做法。
  - 其他页面排版、流程和技术方案主要由自己和 AI 多轮沟通后确定。
  - 所有坑都值得记录，应该从申请 Google 邮箱这类早期账户动作开始记录。

本版暂未吸收：

- ChatGPT 网页完整对话导出。
- Semrush 完整关键词表。
- 竞品截图、竞品页面结构明细。
- Google / Creem / Supabase / Vercel 等账号申请和配置全过程截图。

安全说明：Codex 会话里出现过环境变量、后台页面、错误日志和临时 key 信息。SOP 只沉淀过程和经验，不复制任何真实密钥、完整后台 URL 参数或可复用敏感值。

## 1. 总链路地图

Calyra AI 的项目过程可以拆成 10 段 SOP 链路：

1. 机会发现：看竞品、看 SEO 热词、确认 AI music / AI song maker 方向。
2. 调研验证：用 Semrush 查关键词热度，用竞品页验证搜索意图和页面结构。
3. 产品定位：确定面向欧美英语用户，先做简单好懂的 AI Song Maker 工具站。
4. 基础模板：从 simple_saas 出发，保留登录、支付、积分、Supabase、Vercel 这些 SaaS 底座。
5. PRD 和架构：先写 `hit-song-prd.md` 和 `hit-song-architecture.md`，再按 Phase / Task 执行。
6. MVP 闭环：输入故事或歌词 -> 生成歌词 -> 生成音频 -> 展示歌曲 -> 生成报告 -> 分享/下载。
7. 商业闭环：积分扣减/退款、Creem checkout、webhook 幂等、订阅权益、歌曲保存期限。
8. SEO 增长闭环：首页、工具页、公开歌曲页、sitemap、canonical、Search Console、精选歌曲。
9. 上线排障：Supabase migration、RLS、Vercel 环境变量、Google OAuth、Provider 405/422、线上 500。
10. 复盘复制：把每一步的判断、提示词、坑、命令、验证方式沉淀成可复用 SOP。

## 1.1 Codex 会话时间线补充

本节来自本地 Codex 会话记录，用来补齐 Git log 看不出来的过程性决策。

### 2026-05-06：从 Claude 工作流切到 Codex 工作流

关键动作：

- 讨论 `CLAUDE.md` 和 `AGENTS.md` 的关系。
- 让 Codex 先读 `AGENTS.md`、`hit-song-architecture.md`、`hit-song-prd.md`。
- 审查 PRD 和架构是否合理。
- 明确公开页不能匿名读取整行 `songs`，只能取公开投影数据。
- 询问为了高效开发需要哪些插件/skill。

沉淀成 SOP：

- 每个新项目都要有 AI agent 入口文档。
- 入口文档要告诉 AI：项目背景、技术栈、目录约定、验证命令、禁止事项。
- 在正式开发前，先让 AI 审查 PRD 和架构，而不是直接写代码。
- 涉及公开页时，先定义公开投影数据，避免把私有字段暴露给匿名访问。

### 2026-05-06 至 2026-05-07：Task 1-16 快速推进

关键动作：

- 按 `hit-song-architecture.md` 执行 Task 2、Task 3a、Task 3b。
- 执行 Task 4：歌曲公开页 + SEO 闭环 MVP。
- 把“SEO 闭环第一，视觉第二但必须精致”写成全站公开增长页原则。
- 拆分 Phase 2：评判与情绪价值。
- 执行 Task 5：歌词评判后端。
- 执行 Task 6：综合报告页。
- 执行 Task 7：分享卡片与 OG 图。
- 执行 Task 8：成就系统。
- 拆分并执行 Phase 3：多语言、公开增长页 SEO、召回邮件、归因、发布门禁。
- 拆分 Phase 4：商业化与增长。
- 执行 Task 14：商业套餐配置与定价页。
- 执行 Task 15：Creem 订阅与积分包支付闭环。
- 执行 Task 16：订阅权益、积分账本与存储生命周期。

沉淀成 SOP：

- 大项目不要让 AI 一口气“做完整个产品”，要拆 Phase 和 Task。
- 每个 Task 都要有目标、边界、涉及文件、构建门禁。
- 每个 Phase 完成后要有 release checklist。
- 商业化、积分、webhook、RLS、SEO 这类高风险模块要单独拆任务。

### 2026-05-07 至 2026-05-08：dev 环境上线验证

关键动作：

- 讨论个人开发者是否直接上生产环境，最终选择先走 dev 验证完整流程。
- 创建并推送 dev 分支。
- 创建或确认 Supabase dev 项目。
- 执行 Supabase migrations。
- 配置 Supabase Storage bucket。
- 配置 Vercel Preview / Dev 环境。
- 固定 dev 域名。
- 手动验证首页、注册、登录、新用户 300 credits、Creem 订阅和一次性购买。
- 记录 `docs/checklists/2026-05-08-dev-release-troubleshooting.md`。

典型坑：

- Supabase 后台字段名变化，环境变量命名和项目代码不一致。
- migration 中提前引用 `credits_balance`。
- 初始积分设计为 300，但旧 trigger 仍是 3。
- Vercel 构建缺少 `pnpm-lock.yaml`。
- Vercel 默认预览域名可能被 deployment protection 拦住，需要调整访问策略。
- 环境变量修改后必须重新部署，部署快照不会自动拿到新值。

沉淀成 SOP：

- 个人项目也建议先走 dev 环境，不要直接在 production 上验证全链路。
- dev/prod 的 Supabase、Creem、Vercel 环境变量要分开。
- 每次手动配置后台都要同步写 checklist。
- 线上排障文档按“问题、原因、解决办法”记录。

### 2026-05-08 至 2026-05-09：AI Provider 和音频 Provider 摸索

关键动作：

- 讨论前期是否能用免费大模型生成歌词。
- 尝试 Gemini，并讨论 2.5 Pro / Flash / fallback 策略。
- 遇到 Gemini 403 和项目访问风控。
- 短暂考虑 OpenRouter，但因为充值门槛等因素转向 GitHub Models。
- 跑通 GitHub Models `gpt-4.1` 歌词生成。
- 接入 kie.ai，并从 V4_5 Plus / V5_5 中选择。
- 处理 Kie callback URL 等生成歌曲问题。

沉淀成 SOP：

- 早期 Provider 选择不能只看“免费”，还要看地区、风控、额度、接入稳定性。
- AI Provider 一定要抽象，方便 Claude / GitHub Models / 其他 provider 切换。
- 音频 Provider 一定要抽象，方便 Kie / FAL / Wavespeed 切换。
- Provider 切换时要同步清理旧环境变量、旧代码和旧日志，避免线上仍调用旧 provider。

### 2026-05-09 至 2026-05-10：核心链路跑通后的体验重构

已跑通链路：

- 注册/登录。
- 新用户 credits。
- 歌词生成：GitHub Models。
- 音频生成：kie.ai V5_5。
- 双版本音频：`audio_url` + `audio_url_alt`。
- Supabase Storage 上传。
- 公开 song 页。
- 评判报告。
- Creem 支付 + webhook 发放权益。

关键讨论：

- 核心链路跑通后，下一步不是继续堆功能，而是把不满意的流程和细节写出来。
- 可先做一个演示流程 HTML，让 AI 按理想流程改真实项目。
- 双版本音频不应共享播放/分享/CTA 统计。
- 与其做 take 级计数，不如后续把两个版本拆成两首独立歌曲，降低理解成本。
- 积分不足要用弹窗引导登录或充值。

沉淀成 SOP：

- MVP 跑通后，立刻做“手动体验复盘”。
- 不满意的地方要先写成流程原型或清单，再改代码。
- 不要把临时实现误当长期架构；双版本、计数、公开展示这类设计要尽快简化。

### 2026-05-13 至 2026-05-15：上线前扫描、安全和品牌切换

关键动作：

- dev 线上测试后，提出上线前 AI 代码扫描计划。
- 扫描范围包括构建、类型、API 鉴权、积分/支付/webhook、RLS/migration、环境变量、i18n/SEO/公开页面。
- 固定 Next 和 Node/pnpm 版本，避免 Vercel 构建不可复现。
- 删除未使用且高风险的客户端订阅 hook。
- 统一 Creem webhook 日志。
- 补齐 Supabase authenticated grants。
- 检查 API key、service role key、webhook secret 是否进入仓库。
- 讨论 dev 密钥泄露风险和生产密钥重新生成。
- 全站从 Hit-Song 改名为 Calyra AI。
- Supabase 环境变量从旧命名切到新命名。

沉淀成 SOP：

- 上线前一定要做一次 AI 辅助扫描，但不能触发真实 AI、音频、支付消费。
- 扫描输出必须分 `Must Fix / Should Fix / Watch`。
- 生产密钥和 dev 密钥必须分开生成。
- 品牌改名要覆盖 UI、metadata、结构化数据、邮件/召回文案、法务页。
- 内部历史文档和数据库表名可以不急着改，避免破坏稳定性。

### 2026-05-16 至 2026-05-23：SEO 页面和首页工作台化

关键动作：

- 修复 `zh-CN` 线上仍可访问的问题。
- 增加 `support@calyraai.com` 显性入口。
- OAuth provider 未启用时改友好错误提示。
- 首页第一屏改为工具型生成器。
- 首页顺序调整为 Hero Generator、Music Gallery、Popular AI Music Styles、How It Works、Commercial Use、Pricing、FAQ。
- 讨论 SEO block 是否保留，结论是保留精简版语义密度。
- 生成按钮尽量直接复用已有生成流程，避免 localStorage 中转后让用户再点一次。
- 简化 Create 页面，移除 Simple / Advanced，因为它和 Text to Song / Lyrics to Song 概念冲突。
- 拆分 SEO 功能页：Text to Song、Lyrics to Song、AI Lyrics Generator。
- 检查首页前三屏是否完成定位、场景、信任、行动。
- 参考 AIMakeSong，但不照抄其页面和文案。

沉淀成 SOP：

- 首页不是纯介绍页，第一屏要尽量变成可用工具。
- SEO 页面可以复用同一个工作台组件，但路由、metadata、默认 mode、文案要独立。
- 不要让模式层级过多，新手只需要知道 Text to Song 和 Lyrics to Song。
- 竞品提出的方法论不一定自己遵守，要参考但不能迷信。

### 2026-05-19 至 2026-05-28：FAL、Creem、错误日志和增长数据

关键动作：

- 完成多语言 SEO 页面。
- 修复 FAL audio poll 405。
- 重构 song generation flow。
- 调整 FAL 生成扣费规则。
- 检查 `CREEM_API_URL`。
- 查找生成报错原因。
- 修复桌面端登录无响应。
- 增加关键漏斗埋点：访问、生成、注册、付费。

沉淀成 SOP：

- FAL 这类异步队列 Provider 必须区分 status 和 result。
- 生成失败定位需要 request id、user id、song id、provider status、积分操作日志。
- 关键增长路径要早埋点：访问 -> 生成 -> 注册 -> 付费。
- 错误提示要对用户友好，对开发者可定位。

### 2026-05-28 至 2026-05-31：内容资产、营销素材和 SOP 意识

关键动作：

- 创建 producer brief。
- 审核和修改歌曲歌词风险。
- 生成 World Cup anthem、slime love lyrics 等 demo 内容。
- 审核 4 首歌。
- 制作歌曲生成说明视频。
- 查 JS 内存溢出原因。
- 准备 X 发帖素材。
- 开始整理项目 SOP 大纲。

沉淀成 SOP：

- AI 音乐产品不只是代码，还需要 demo 歌曲、歌词资产、说明视频、社媒素材。
- Demo 内容要有审核流程，避免版权、低质歌词、不可商用表达。
- SOP 应该从开发中同步沉淀，而不是项目结束后凭记忆补。

## 2. 项目定位 SOP

当前项目：Calyra AI，一个面向欧美市场的 AI 音乐生成网站。  
官网：`https://calyraai.com`  
核心定位：`AI Song Maker` / `AI Music Generator`

用户可以输入：

- 文字想法。
- 歌词。
- 风格提示词。
- 歌曲标题。

然后生成完整歌曲，包括人声和伴奏。

目标用户：

- 美国、欧洲等英语用户。
- 普通创作者。
- 短视频创作者。
- YouTube / Reels / TikTok 内容创作者。
- 独立音乐兴趣用户。
- 需要 royalty-free music 的创作者。

第一阶段核心价值：

- 简单。
- 快速。
- 好理解。
- 适合新手。
- 能生成带人声和伴奏的完整歌曲。

第一阶段不追求：

- 专业 DAW。
- 复杂音乐编辑器。
- 完整音乐社区。
- 高级版权/发行平台。

## 3. 调研 SOP

### 3.1 机会发现

触发点：

- 看到 AI music / AI song maker 竞品。
- 看到相关 SEO 词有搜索需求。
- 通过 Semrush Keyword Magic 查询热词。

第一版需要记录的调研产物：

- 主关键词：`AI Song Maker`、`AI Music Generator`、`AI Song Generator`。
- 功能词：`Text to Song`、`Lyrics to Song`、`AI Lyrics to Song`。
- 场景词：`royalty-free AI music`、`YouTube music generator`、`TikTok song generator` 等待确认。
- 竞品列表：Suno、AIMakeSong、其他 AI song maker 站点。
- 每个竞品给项目的启发，而不是只记录竞品名字。

### 3.2 竞品启发记录格式

每个竞品按这个格式记录：

```text
竞品名称：
网址：
我看到它的时间：
它解决了什么问题：
它的流量/SEO 词启发：
它的产品流程启发：
它的页面结构启发：
我决定参考什么：
我决定不参考什么：
原因：
```

当前已确认：

- Suno：主要给生成歌曲工作流启发，包括输入、风格、生成中状态、作品列表、播放器氛围。
- AIMakeSong：主要给 SEO 页面结构启发，包括首页关键词、工具页、长尾词页面、CTA 链路。
- 其他 AI song maker：待补充完整列表和截图。

### 3.3 Semrush 关键词记录格式

每次查词都记录：

```text
查询日期：
工具：Semrush Keyword Magic
种子词：
目标国家：
关键词：
搜索量：
KD：
CPC：
搜索意图：
竞品 URL：
是否进入第一版：
对应页面：
备注：
```

V1 暂定页面映射：

- `AI Song Maker` -> `/` 和 `/ai-song-maker`
- `AI Music Generator` -> `/` 和后续独立页面，待确认
- `Text to Song` -> `/ai-text-to-song`
- `Lyrics to Song` -> `/ai-lyrics-to-song`
- `AI Lyrics Generator` -> `/ai-lyrics-generator`
- `royalty-free AI music` -> 待确认，不急着硬做

## 4. 产品页面 SOP

当前仓库已存在的核心页面：

- `/`：首页。
- `/ai-song-maker`：主生成页。
- `/ai-text-to-song`：Text to Song 页面。
- `/ai-lyrics-to-song`：Lyrics to Song 页面。
- `/ai-lyrics-generator`：只生成歌词的 SEO 工具页。
- `/free-ai-lyrics-generator`：当前工作区有新增目录，状态待确认。
- `/song/[id]`：公开歌曲页。
- `/report/[id]`：私有报告页。
- `/dashboard`：用户歌曲和账户页。
- `/pricing`：价格页。
- `/about`：关于页。
- `/privacy`、`/terms`、`/refund`：法务页面。

附件复制页中提到但当前仓库未确认的页面：

- `/contact`
- `/faq`

这两个页面后续是否要做，等 V2 根据实际 SEO 和信任需求确认。

### 4.1 首页 SOP

首页主要承担：

- SEO 入口。
- 产品信任感。
- Demo 歌曲展示。
- 引导用户进入生成页。

首页不应该太复杂。第一屏要让欧美用户马上知道：

- 这是 AI Song Maker。
- 可以从 text / lyrics 生成歌曲。
- 生成结果是完整音乐，不只是歌词。
- CTA 指向 `/ai-song-maker` 或具体工具页。

当前首页方向：

- 暗色高级感。
- 类似 Suno 的音乐产品氛围。
- 结合 AIMakeSong 的 SEO 结构。
- Music Gallery 用精选歌曲建立信任。

### 4.2 生成页 SOP

生成页目标：让用户真正完成创作，而不是只看营销内容。

当前方向：

- 参考 Suno 工作台。
- 左侧或主区域放生成表单。
- 右侧或下方放歌曲列表/历史作品。
- 保持新手友好，不把参数做得过复杂。

生成表单应包含：

- Credits 显示。
- Text to Song / Lyrics to Song 模式。
- Prompt / Lyrics 输入框。
- Style 输入框。
- Title 输入框。
- Instrumental 开关，当前第一阶段可以隐藏或弱化。
- Generate Song 按钮。

第一版原则：

- 不做复杂 draft 恢复。
- 不做复杂服务端筛选。
- 不做专业音乐参数编辑器。
- 失败提示要明确，积分退回要可靠。

### 4.3 公开歌曲页 SOP

公开歌曲页的目标不是单纯展示，而是 SEO + 分享 + 回流：

- SSR 可索引内容。
- title / description / canonical / hreflang。
- JSON-LD。
- 可播放音频。
- 可展示歌词。
- 可展示报告摘要。
- CTA 回到 `/ai-song-maker`。

索引原则：

- 普通生成默认 `private` 或 `unlisted`。
- 普通分享链接可以访问，但不一定 index。
- 用户明确发布、官方精选、或高分作品才进入 sitemap / 首页 Gallery。

## 5. SEO SOP

SEO 是本项目第一阶段的重要增长策略，但不能为了堆词牺牲产品可信度。

主关键词：

- AI Song Maker
- AI Music Generator
- AI Song Generator
- Text to Song
- Lyrics to Song
- AI Lyrics to Song
- AI Lyrics Generator

首页建议方向：

```text
Title:
AI Song Maker & Music Generator Free | Calyra AI

H1:
AI Song Maker & AI Music Generator

Description:
Create AI songs from text, lyrics, and simple ideas. Use our AI song maker to generate music with vocals and instruments in minutes.
```

工具页策略：

- `/ai-song-maker`：承接 AI Song Maker 搜索意图。
- `/ai-text-to-song`：默认进入 Text to Song 模式。
- `/ai-lyrics-to-song`：默认进入 Lyrics to Song 模式。
- `/ai-lyrics-generator`：先解决歌词生成，再引导转成歌曲。

多语言 SEO 策略：

- 英文优先。
- 其他语言可以保留，但入口可以弱化或隐藏。
- 翻译质量不稳定时，不主动推多语言 SEO。
- 避免西语、葡语、日语、韩语页面混入大量英文。

隐藏中文的原因：

- 当前目标市场是欧美英语用户。
- 中文入口会弱化 Google 对站点主题和目标市场的理解。
- 这是参考竞品后的策略，同时结合项目定位做出的选择。

## 6. 生成主流程 SOP

推荐基础流程：

1. 用户进入首页或 SEO 工具页。
2. 用户输入 prompt / lyrics / style / title。
3. 点击 Generate。
4. 检查登录状态。
5. 检查 credits。
6. 文本模式下先生成歌词；歌词模式下直接使用用户歌词。
7. 创建 `songs` 记录，状态为 `generating`。
8. 冻结/扣减积分。
9. 调用音频 Provider。
10. 保存 provider task id。
11. 前端轮询歌曲状态。
12. Provider 完成后下载/转存音频和封面到 Supabase Storage。
13. 更新 `songs` 为 `ready`。
14. 用户播放、下载、分享、生成报告。
15. 失败时标记 `failed` 并退回 credits。

当前重要原则：

- `songId` 直接复用 `songs.id`。
- 第一版不新建复杂 job 表。
- 未登录用户优先跳登录，不做复杂未登录草稿。
- 生成失败必须能退积分。
- Provider 错误不要直接暴露给普通用户。

## 7. 技术栈 SOP

当前项目基础：

- Next.js App Router。
- TypeScript。
- Supabase Auth / Postgres / Storage。
- Creem 支付。
- next-intl 国际化。
- shadcn/ui + Tailwind CSS + Framer Motion。
- pnpm。

注意：项目约定文档仍写着 Next.js 15，但当前 `package.json` 中 Next.js 版本是 `16.2.6`。V2 需要统一文档说法。

核心目录：

- `app/[locale]/`：页面路由。
- `app/api/`：API Routes。
- `lib/ai/`：AI Provider 抽象和歌词/报告能力。
- `lib/audio/`：音频 Provider 抽象层。
- `lib/credits/`：积分冻结和退款。
- `lib/song/`：歌曲公开数据和歌词生成。
- `components/seo/`：SEO 工具页组件。
- `components/song-maker/`：生成工作台。
- `messages/`：多语言文案。
- `supabase/migrations/`：数据库迁移。
- `docs/`：计划、清单、SOP。

## 8. Provider SOP

### 8.1 AI Provider

当前代码支持：

- Claude。
- GitHub Models。

原则：

- AI 调用只放服务端。
- 内容审核、歌词生成、报告生成都经 `lib/ai/provider.ts` 抽象。
- 外部 API 失败最多自动重试 1 次，仍失败再返回错误。
- 不把敏感 key 暴露到客户端。

### 8.2 音频 Provider

当前代码支持：

- `kie`
- `fal`
- `wavespeed`

当前重点 Provider：

- FAL `fal-ai/minimax-music/v2`。

FAL 正确流程：

1. submit task。
2. 拿到 request id。
3. 轮询 queue status。
4. `IN_QUEUE` / `IN_PROGRESS` 只返回 processing。
5. `COMPLETED` / `OK` 后再请求 result。
6. `FAILED` 则标记 failed 并退款。

禁止做法：

- 任务未完成时直接请求 result。
- Provider 失败但 song 仍保持 generating。
- 失败后不退 credits。
- 把完整 provider 错误直接展示给普通用户。

已遇到问题：

- FAL 405。
- FAL 422。
- `queue.status` 和 `queue.result` 调用时机错误。
- Provider SDK 和拼 URL 方式切换。

## 9. 支付与积分 SOP

支付 Provider：Creem。

环境必须区分：

- Test Mode。
- Live Mode。

关键环境变量：

- `CREEM_API_KEY`
- `CREEM_API_URL`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_SUCCESS_URL`
- `BASE_URL`

当前生产 BASE URL：

- `https://calyraai.com`

已遇到问题：

- Creem 401 Invalid API Key。
- Test Mode 和 Live Mode key 混用。
- 环境变量修改后没有重新部署。
- Creem API 404。

处理原则：

- Creem 环境变量修改后必须重新部署 Vercel。
- Test Mode 和 Live Mode 不要混用。
- webhook 必须验证签名。
- 支付发放 credits 必须幂等。
- credits 不允许客户端直接改数据库。

积分原则：

- 注册初始积分当前设计为 300。
- 音频生成前冻结/扣减积分。
- 报告生成前冻结/扣减积分。
- 生成失败必须退款。
- 积分操作走 RPC：`freeze_credit` / `unfreeze_credit`。
- 禁止直接 UPDATE `credits_balance`。

上线前至少确认：

- 价格页能打开。
- 点击支付按钮能跳转 Creem Checkout。
- Test Mode webhook 能收到 `checkout.completed`。
- 支付成功后 credits 能到账。
- 重复 webhook 不会重复发 credits。
- 支付失败不会错误加 credits。

正式发布前建议做一次真实小额支付测试，尤其是 Product Hunt 或正式投放前。

## 10. Supabase SOP

核心数据：

- `customers`：用户、Creem customer、积分。
- `credits_history`：积分流水。
- `subscriptions`：订阅。
- `songs`：歌曲、音频、封面、公开状态、SEO 数据。
- `achievements`：成就。
- `email_log`：召回邮件频控。

上线前必须检查：

- RLS。
- authenticated grants。
- service role 只在服务端使用。
- Storage bucket 是否存在。
- migration 顺序是否正确。
- RPC 函数是否存在且参数和代码一致。

已遇到问题：

- migration 提前引用不存在字段。
- `handle_new_user()` 初始积分和架构不一致。
- authenticated grants 不完整导致线上功能异常。
- Dashboard 客户端直接读表被 RLS 拒绝。
- 新用户没有 300 credits。

失败退款原则：

```text
生成失败 -> song.status = failed
生成失败 -> 写日志
生成失败 -> unfreeze_credit
```

## 11. Vercel / 环境变量 SOP

修改环境变量后必须重新部署 Vercel，否则线上仍可能使用旧快照。

上线前检查：

- Production 环境变量。
- Preview 环境变量。
- 本地 `.env.local`。
- Supabase URL。
- Supabase anon key。
- Supabase service role key。
- Creem key。
- FAL key。
- AI provider key。
- Google OAuth callback。
- `BASE_URL`。
- `CRON_SECRET`。

常见现象：

```text
本地正常，线上不正常
```

优先怀疑：

- 环境变量不一致。
- 环境变量更新后没重新部署。
- Supabase 回调地址不一致。
- Vercel deployment protection。
- Node / pnpm 版本不一致。

## 12. Google / Bing 收录 SOP

提交前检查：

- 正式域名可访问。
- `/sitemap.xml` 可访问。
- `/robots.txt` 可访问。
- 核心页面没有错误 noindex。
- 首页 title / description 正确。
- canonical 正确。
- hreflang 正确。
- 404 页面不进入 sitemap。

已遇到情况：

- Search Console URL 404。
- Discovered but not crawled。
- Crawled currently not indexed。
- Duplicate canonical。
- Excluded by noindex。

处理原则：

- 新站早期没数据正常。
- 不要频繁大改 URL。
- 优先处理 404、错误 noindex、canonical 错误、sitemap 缺失、重要页面不可访问。

## 13. 首页 Demo 歌曲 SOP

首页 Demo 歌曲用于提升信任和转化，不是单纯展示音乐。

Demo 歌曲应满足：

- 欧美用户能听懂。
- 旋律和副歌明显。
- 风格主流。
- 歌词简单。
- 商业友好。
- 适合短视频 / YouTube / Reels。

已规划方向：

1. Back in the Light：Modern Dance Pop / Summer Pop
2. Still Missing You：Emotional Pop Ballad
3. Not That Serious：Playful Viral Pop
4. Run Until the Morning：Pop Rock / Indie Pop
5. Summer on Your Skin：Afro / Latin Pop
6. New Day Feeling：Chill Pop / Lifestyle Pop

Suno 生成原则：

- 避免 intro 太长。
- 避免 outro 太长。
- 避免副歌来得太慢。
- 避免歌词太复杂。
- 避免伴奏太乱。
- 避免音质失真。
- 推荐 2:40 - 3:05 左右。
- 快速进入 chorus。
- hook phrase 可重复。

## 14. Product Hunt SOP

当前策略：不要一上来直接发布。

推荐顺序：

1. 先创建草稿。
2. 准备素材。
3. 确认生成流程稳定。
4. 确认支付流程稳定。
5. 确认首页 demo 歌曲和截图好看。
6. 再正式发布。

发布前检查：

- 生成流程稳定。
- 支付流程稳定。
- 首页 demo 歌曲能播放。
- 首页截图好看。
- 准备 4 张图。
- 准备 Maker Comment。

暂不优先：

- 大量社交媒体运营。
- 复杂品牌故事。
- 过度打磨非核心页面。

## 15. Codex 工作 SOP

每次让 Codex 做项目任务前，优先让它读取：

- `AGENTS.md`
- `docs/CALYRA_SOP.md`
- 相关 `docs/plans/*`
- 相关代码文件

推荐固定提示词：

```text
请先阅读 AGENTS.md 和 docs/CALYRA_SOP.md，再阅读本次任务相关代码。
本次任务只处理一个问题，不要顺手大改。
如果发现 SOP 和代码不一致，先指出，不要直接改。

请按以下格式输出：
1. 你理解的当前问题
2. 你准备修改的文件
3. 修改方案
4. 验收方式
5. 风险点
```

Codex 修改原则：

- 每次只解决一个问题。
- 不重构无关代码。
- 不改动未要求的业务逻辑。
- 支付、credits、数据库结构要特别谨慎。
- 修改后说明影响范围。
- 能跑构建就跑 `pnpm build`。
- 工作结束看 `git diff`，确认没有误改。

禁止行为：

- 擅自改支付逻辑。
- 擅自改 credits 逻辑。
- 擅自改数据库结构。
- 擅自删除页面。
- 为了美观大改已跑通功能。
- 把 Test Mode 和 Live Mode 混在一起。

### 15.1 Codex 会话记录挖掘 SOP

用途：

- 从历史会话中恢复真实决策过程。
- 补齐 Git log 只记录结果、不记录原因的问题。
- 为文章、课程、团队 SOP 提供可复盘素材。

推荐检索位置：

- `C:\Users\Admin\.codex\session_index.jsonl`
- `C:\Users\Admin\.codex\sessions\YYYY\MM\*.jsonl`

推荐关键词：

- 项目名：`calyra`、`hit-song`、`simple_saas`
- 产品词：`ai-song-maker`、`text-to-song`、`lyrics-to-song`、`首页`、`SEO`
- 技术词：`Supabase`、`Vercel`、`Creem`、`FAL`、`Kie`、`GitHub Models`
- 风险词：`报错`、`失败`、`403`、`405`、`422`、`RLS`、`密钥`、`webhook`
- 决策词：`为什么`、`是否`、`方案`、`下一步`、`checklist`

提取格式：

```text
日期：
会话标题：
当时目标：
关键问题：
最终决策：
踩坑：
对应代码/文档：
可复用 SOP：
V2 是否要展开：
```

注意事项：

- 不要把真实密钥、后台参数、完整私密 URL 写进 SOP。
- 不要直接粘贴大段原始对话，只提炼“问题、原因、决策、结果”。
- 会话标题可能比 Git commit 更接近真实任务意图，要和 Git log 互相校验。
- 如果会话与当前代码不一致，以当前代码为准，并标记历史方案已废弃。

## 16. 当前优先级 SOP

P0：稳定性

- 生成歌曲流程稳定。
- 失败退款稳定。
- 支付流程稳定。
- 登录流程稳定。
- 核心页面可访问。

P1：SEO 基础

- 首页 SEO。
- `/ai-song-maker`。
- `/ai-text-to-song`。
- `/ai-lyrics-to-song`。
- `/ai-lyrics-generator`。
- sitemap。
- robots。
- canonical。

P2：首页转化

- 首页 demo 歌曲。
- 首页截图。
- CTA 到 `/ai-song-maker`。
- Music Gallery 展示。
- 底部播放器体验。

P3：Product Hunt

- 草稿。
- 截图。
- Maker Comment。
- 测试流程。
- 正式发布。

P4：扩展功能

- 复杂筛选。
- 用户公开主页。
- 更完整音乐广场。
- 高级歌词智能体。
- 风格模板库。
- 多语言 SEO。

## 17. 暂不做事项 SOP

第一版暂不优先：

- 复杂 draft 恢复流程。
- 复杂服务端筛选。
- 完整社交系统。
- 复杂音乐编辑器。
- 专业 DAW 功能。
- 过多多语言 SEO 页面。
- 大规模社交媒体运营。
- 过度品牌包装。

原因：

当前阶段最重要的是：

- 用户能进来。
- 用户能生成。
- 用户能支付。
- Google 能理解页面。
- 项目能稳定运行。

## 18. 已知风险 SOP

技术风险：

- FAL 返回状态处理错误。
- Creem 环境变量混用。
- Supabase RLS 权限错误。
- Vercel 没有重新部署。
- Google OAuth callback 不一致。
- Next.js 版本和项目文档不一致。
- 音频 Provider 改动影响退款逻辑。

产品风险：

- 生成页太复杂，新手不会用。
- 首页 SEO 太重，视觉不够高级。
- Demo 歌曲质量不稳定。
- 用户生成失败后信任下降。

SEO 风险：

- 新站关键词竞争太大。
- 过早做高难度词。
- 频繁改 URL。
- 多语言翻译质量差。
- 页面内容堆词。

流程风险：

- 只记录结果，不记录过程。
- 忘记记录账号申请、API key、配置路径。
- 忘记保存 GPT 网页中的关键推理。
- 没有把错误和修复方式写入排障文档。

## 19. 坑记录 SOP

原则：所有坑都值得记录，从最早的账号申请开始。

每个坑按这个格式写：

```text
日期：
阶段：
问题现象：
错误信息：
影响范围：
初步猜测：
真实原因：
解决步骤：
验证方式：
是否需要写进 checklist：
下次如何避免：
相关文件/后台页面：
```

当前已知坑分类：

- Google 邮箱 / Google Console / OAuth。
- Supabase 项目、Auth、RLS、Storage、migration。
- Vercel 部署、环境变量、Node/pnpm 版本。
- Creem Test / Live、API key、webhook、checkout。
- FAL 405 / 422、轮询、SDK、任务状态。
- SEO：Search Console、sitemap、canonical、noindex、404。
- i18n：locale 路由、隐藏中文、多语言翻译质量。
- Codex：误改、过度重构、上下文不足。

## 20. V2 待补充内容

等 ChatGPT 导出包到位后，补充：

- 最早调研完整过程。
- 完整 GPT 问答链路。
- Codex 会话逐条复盘表，尤其是 2026-05-06 至 2026-05-15 的架构、上线和排障会话。
- 完整 Semrush 关键词表。
- 完整竞品列表和截图。
- 为什么最终选 `AI Song Maker` 作为主线。
- Google 邮箱 / Google Console / Search Console 申请和配置过程。
- Supabase 项目创建和 migration 完整过程。
- Creem 配置历史。
- FAL 405 / 422 完整修复过程。
- SEO 页面迭代历史。
- Product Hunt 发布材料。
- 首页 Demo 歌曲资料。
- i18n 页面问题记录。
- 上线前完整 checklist。
- Codex 错误处理记录。

## 一句话总结

Calyra AI 当前第一阶段目标不是做复杂音乐平台，而是先做成一个稳定可用、SEO 结构清楚、欧美用户能理解的 AI Song Maker 工具站。

当前最重要的顺序是：

1. 生成稳定。
2. 支付稳定。
3. SEO 页面稳定。
4. 首页 demo 好看。
5. 再做 Product Hunt 和扩展功能。
