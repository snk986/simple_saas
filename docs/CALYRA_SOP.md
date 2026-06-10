# Calyra AI 项目 SOP

版本：合并版  
生成时间：2026-06-10  
来源：`CALYRA_SOP_V1.md`、`CALYRA_SOP_V2.md`  
使用对象：项目 owner、Codex、GPT 网页版、Claude Code、后续项目 Agent  

核心原则：

- 以最近已经执行或确认的方案为准，旧方案只作为历史参考。
- 不确定项标记为“待确认”，不要编造项目里没有的信息。
- 重复内容只保留一处，优先保留 V2 中更接近当前状态的表述。
- SOP 只记录流程、决策和经验，不写真实密钥、后台敏感参数、完整私密 URL。

---

## 1. 项目总览

### 1.1 当前项目

项目名称：`Calyra AI`  
官网：`https://calyraai.com`  
早期名称：`Hit-Song`

`Hit-Song` 是早期 PRD 和工程文档里的项目名。正式品牌已经切换为 `Calyra AI`。历史文档里出现 `Hit-Song` 时，应理解为 Calyra AI 的前身，不要再用于正式品牌、页面文案、metadata、邮件或对外材料。

### 1.2 产品定位

Calyra AI 是面向欧美英语用户的 AI 音乐生成网站。

核心定位：

- `AI Song Maker`
- `AI Music Generator`
- `AI Song Generator`
- `Text to Song`
- `Lyrics to Song`

用户可以输入文字想法、歌词、风格描述和歌曲标题，生成带人声和伴奏的完整歌曲。

第一阶段目标不是做专业 DAW，也不是正面对抗 Suno / Udio 的模型能力，而是先做一个稳定、清晰、能被 Google 理解、能让欧美用户快速生成歌曲的工具站。

当前优先顺序：

1. 生成流程稳定。
2. 支付和 credits 稳定。
3. SEO 页面稳定。
4. 首页 demo 建立信任。
5. Product Hunt / 目录站补充曝光。
6. 再考虑高级功能。

### 1.3 第一阶段不追求

- 专业 DAW。
- 复杂音乐编辑器。
- 多轨混音。
- 自动母带。
- 完整音乐社区。
- 高级版权或发行平台。

---

## 2. 历史链路和关键决策

### 2.1 总链路地图

Calyra AI 的项目过程可以拆成 10 段：

1. 机会发现：看竞品、看 SEO 热词、确认 AI music / AI song maker 方向。
2. 调研验证：用 Semrush 查关键词热度，用竞品页验证搜索意图和页面结构。
3. 产品定位：面向欧美英语用户，先做简单好懂的 AI Song Maker 工具站。
4. 基础模板：从 simple_saas 出发，保留登录、支付、credits、Supabase、Vercel 等 SaaS 底座。
5. PRD 和架构：先写 `hit-song-prd.md` 和 `hit-song-architecture.md`，再按 Phase / Task 执行。
6. MVP 闭环：输入故事或歌词 -> 生成歌词 -> 生成音频 -> 展示歌曲 -> 生成报告 -> 分享/下载。
7. 商业闭环：credits 扣除/退款、Creem checkout、webhook 幂等、订阅权益、歌曲保存期限。
8. SEO 增长闭环：首页、工具页、公开歌曲页、sitemap、canonical、Search Console、精选歌曲。
9. 上线排障：Supabase migration、RLS、Vercel 环境变量、Google OAuth、Provider 405/422、线上 500。
10. 复盘复制：把判断、提示词、坑、命令、验证方式沉淀成可复用 SOP。

### 2.2 Codex 会话时间线

2026-05-06：从 Claude 工作流切到 Codex 工作流

- 明确 Codex 先读 `AGENTS.md`、`hit-song-architecture.md`、`hit-song-prd.md`。
- 公开页不能匿名读取整行 `songs`，只能取公开投影数据。
- 新项目要有 AI agent 入口文档，写清项目背景、技术栈、目录约定、验证命令和禁止事项。

2026-05-06 至 2026-05-07：Task 1-16 快速推进

- 按架构文档推进公开歌曲页、SEO 闭环、报告页、分享卡片、成就系统、多语言、召回、商业化。
- 大任务必须拆 Phase / Task，每个 Task 要有目标、边界、涉及文件和构建门禁。
- 支付、credits、webhook、RLS、SEO 这类高风险模块要单独拆任务。

2026-05-07 至 2026-05-08：dev 环境上线验证

- 个人项目也建议先走 dev 环境，不要直接在 production 验证全链路。
- dev/prod 的 Supabase、Creem、Vercel 环境变量要分开。
- 后台配置动作要同步写 checklist。
- 线上排障文档按“问题、原因、解决办法”记录。

2026-05-08 至 2026-05-09：AI Provider 和音频 Provider 摸索

- Provider 选择不能只看免费，还要看地区、风控、额度和接入稳定性。
- AI Provider 和音频 Provider 都必须抽象，方便 Claude / GitHub Models / OpenAI / FAL / Kie / Wavespeed 切换。
- Provider 切换时要同步清理旧环境变量、旧代码和旧日志，避免线上仍调用旧 provider。

2026-05-09 至 2026-05-10：核心链路跑通后的体验重构

- MVP 跑通后，不是继续堆功能，而是先复盘体验问题。
- 不满意的地方先写流程原型或清单，再改代码。
- 双版本音频、计数、公开展示这类临时实现要尽快简化，不能误当长期架构。

2026-05-13 至 2026-05-15：上线前扫描、安全和品牌切换

- 上线前要做 AI 辅助扫描，但不能触发真实 AI、音频、支付消费。
- 扫描输出分 `Must Fix / Should Fix / Watch`。
- 生产密钥和 dev 密钥必须分开。
- 品牌改名要覆盖 UI、metadata、结构化数据、邮件/召回文案和法务页。

2026-05-16 至 2026-05-23：SEO 页面和首页工作台化

- 首页第一屏改成工具型生成器，不做纯介绍页。
- SEO 页面可以复用同一个工作台组件，但路由、metadata、默认 mode 和文案要独立。
- Simple / Advanced 和 Text to Song / Lyrics to Song 概念冲突，第一版移除 Simple / Advanced。
- 参考 AIMakeSong 的 SEO 结构，但不照抄页面和文案。

2026-05-19 至 2026-05-28：FAL、Creem、错误日志和增长数据

- FAL 这类异步队列 Provider 必须区分 status 和 result。
- 生成失败定位需要 request id、user id、song id、provider status、credits 操作日志。
- 关键增长路径要早埋点：访问 -> 生成 -> 注册 -> 付费。
- 错误提示要对用户友好，对开发者可定位。

2026-05-28 至 2026-05-31：内容资产、营销素材和 SOP 意识

- AI 音乐产品不只是代码，还需要 demo 歌曲、歌词资产、说明视频和社媒素材。
- Demo 内容要有审核流程，避免版权、低质歌词、不可商用表达。
- SOP 应从开发中同步沉淀，不要项目结束后凭记忆补。

---

## 3. 用户、市场和调研

### 3.1 目标用户

主要面向：

- 欧美英语用户。
- 普通内容创作者。
- YouTube / TikTok / Instagram Reels 创作者。
- 短视频创作者。
- 独立音乐兴趣用户。
- 需要 royalty-free music 的创作者。

### 3.2 产品价值表达

第一版不要讲太专业的音乐理论。

更适合的表达：

- Create songs from text.
- Turn lyrics into music.
- Generate AI music with vocals and instruments.
- Make royalty-free songs for videos and social content.

不建议第一版强调：

- 专业编曲。
- 复杂混音。
- 高级音乐制作。
- DAW 级编辑。

### 3.3 机会发现

触发点：

- 看到 AI music / AI song maker 竞品。
- 看到相关 SEO 词有搜索需求。
- 通过 Semrush Keyword Magic 查询热词。

第一版需要记录：

- 主关键词：`AI Song Maker`、`AI Music Generator`、`AI Song Generator`。
- 功能词：`Text to Song`、`Lyrics to Song`、`AI Lyrics to Song`。
- 场景词：`royalty-free AI music`、`YouTube music generator`、`TikTok song generator` 等待确认。
- 竞品：Suno、AIMakeSong、其他 AI song maker 站点。
- 每个竞品给项目的启发，而不是只记录名字。

### 3.4 竞品启发记录格式

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

### 3.5 Semrush 关键词记录格式

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

---

## 4. 技术栈和工程原则

### 4.1 当前技术栈

- Frontend：Next.js / React / TypeScript。
- Hosting：Vercel。
- Database/Auth：Supabase。
- Payment：Creem。
- Audio Generation：FAL / `fal-ai/minimax-music/v2`。
- Lyrics / Text AI：按当前代码为准，历史上讨论过 Claude、GitHub Models、OpenAI、OpenRouter。
- Analytics：GA4。
- Email：Cloudflare Email Routing。
- i18n：next-intl。
- UI：shadcn/ui、Tailwind CSS、Framer Motion。
- 包管理：pnpm。

注意：历史文档可能写 Next.js 15，但当前代码版本应以 `package.json` 为准。

### 4.2 核心目录

- `app/[locale]/`：页面路由。
- `app/api/`：API Routes。
- `lib/ai/`：AI Provider 抽象和歌词/报告能力。
- `lib/audio/`：音频 Provider 抽象层。
- `lib/credits/`：credits 冻结、扣除和退款。
- `lib/song/`：歌曲公开数据和歌词生成。
- `components/song-maker/`：生成工作台。
- `messages/`：多语言文案。
- `supabase/migrations/`：数据库迁移。
- `docs/`：计划、清单、SOP。

### 4.3 工程开发原则

- 不要只靠 PRD 直接让 Codex/Claude 写代码。
- PRD 要先拆成轻量工程文档，至少包含数据结构、API 设计、页面和状态流、边界条件。
- Codex 工作流：读文档和现有代码 -> 输出修改计划 -> 每次只改一个明确问题 -> 修改后给验证方式。
- 涉及支付、credits、数据库结构、RLS、SEO 的修改必须谨慎，优先小步验证。

---

## 5. 页面结构和 SEO

### 5.1 当前核心页面

- `/`：首页。
- `/ai-song-maker`：主生成页 / 主 SEO 功能页。
- `/ai-text-to-song`：Text to Song 页面。
- `/ai-lyrics-to-song`：Lyrics to Song 页面。
- `/ai-lyrics-generator`：只生成歌词的 SEO 工具页。
- `/free-ai-lyrics-generator`：歌词模板/免费歌词生成相关页面，状态以当前代码为准。
- `/royalty-free-ai-music-generator`：Royalty-Free 场景页。
- `/world-cup-song-generator`：世界杯/球迷歌曲场景页。
- `/song/[id]`：公开歌曲页。
- `/report/[id]`：私有报告页。
- `/dashboard`：用户歌曲和账户页。
- `/pricing`：价格页。
- `/about`：关于页。
- `/privacy`、`/terms`、`/refund`：法务页面。

V2 中提到 `/contact`、`/faq`，但是否已落地以当前代码为准。

### 5.2 首页职责

首页承担四件事：

1. 承接 SEO。
2. 解释产品是什么。
3. 展示 demo 歌曲建立信任。
4. 引导用户进入 `/ai-song-maker`。

首页不是纯介绍页，第一屏应尽量成为可用工具。当前首页方向是暗色、高级感、音乐产品氛围，但结构上学习 SEO 工具站逻辑。

首页核心 SEO 方向：

```text
Title:
AI Song Maker & Music Generator Free | Calyra AI

H1:
AI Song Maker & AI Music Generator

Description:
Create AI songs from text, lyrics, and simple ideas. Use our AI song maker to generate music with vocals and instruments in minutes.
```

首页模块可包含：

- Hero Generator。
- Music Gallery / Demo Songs。
- Popular AI Music Styles。
- How It Works。
- Commercial Use。
- Pricing。
- FAQ。
- CTA。

首页主 CTA 指向 `/ai-song-maker`。

### 5.3 SEO 页面策略

核心原则：SEO 闭环第一，视觉第二但必须精致。公开增长页必须保证 SSR 可索引内容、结构化数据、内链、首屏核心信息、分享预览和 CTA 转化。

主 SEO 页面：

- `/ai-song-maker` 承接 AI Song Maker / AI Music Generator 搜索意图。
- 强调 create songs from text and lyrics、vocals and instruments、fast generation。

功能 SEO 页面：

- `/ai-text-to-song` 默认进入 Text to Song 模式，承接“把一个想法或 prompt 变成歌曲”的意图。
- `/ai-lyrics-to-song` 默认进入 Lyrics to Song 模式，承接“已有歌词，想变成完整歌曲”的意图。
- `/ai-lyrics-generator` 先解决歌词生成，再引导转成歌曲。

场景 SEO 页面：

- `/royalty-free-ai-music-generator` 适合作为“商用/创作者场景页”，不要做成第四个重复生成器页。
- 内容重点包括 YouTube、TikTok、Reels、ads、podcast、game/app background music、commercial use、licensing/rights FAQ。
- 后续长尾词优先考虑 `YouTube music generator`、`TikTok song generator`，需结合真实搜索数据确认。

### 5.4 多语言 SEO

当前策略：

- 英文为主。
- 其他语言可以保留，但不要强推。
- 翻译质量不完整的语言入口可以隐藏或 noindex。
- 等英文流量和转化稳定后，再做多语言 SEO。

已出现或支持过的语言：

- `zh-CN`
- `es`
- `pt`
- `ja`
- `ko`

原则：

1. 英文页面先完整。
2. 非英文页面如果残留大量英文，不主动做 SEO。
3. 避免低质量多语言页面拖累站点质量。

### 5.5 公开歌曲页

公开歌曲页目标不是单纯展示，而是 SEO + 分享 + 回流：

- 用户能访问。
- 搜索引擎能理解。
- 能播放试听。
- 能看到歌曲标题、歌词、风格、创建信息。
- 能 CTA 回到 `/ai-song-maker`。

索引原则：

- 普通生成默认 private 或 unlisted。
- 分享链接可以访问，但不一定 index。
- 用户明确发布、官方精选或高分作品才进入 sitemap / 首页 Gallery。

---

## 6. 生成页和歌曲生成流程

### 6.1 生成页目标

生成页是用户真正创作歌曲的主工作台。

推荐结构：

- 左侧：生成面板。
- 右侧：歌曲列表 / 当前生成结果 / 历史记录。

左侧生成面板包含：

- Credits 显示。
- Text to Song / Lyrics to Song 切换。
- Prompt / Lyrics 输入框。
- Style 输入框。
- Title 输入框。
- Instrumental 开关。
- Generate Song 按钮。

### 6.2 Simple / Advanced 决策

历史上讨论过两个方案：

- 方案 A：保留 Simple / Advanced UI。
- 方案 B：移除 Simple / Advanced，只保留 Text to Song / Lyrics to Song，复杂参数作为 optional settings。

当前采用方案 B。

原因：Simple / Advanced 和 Text to Song / Lyrics to Song 会让新手困惑。第一版只保留两个核心入口：

1. Text to Song。
2. Lyrics to Song。

Style / Title / Instrumental 作为可选字段，不命名为 Advanced。

### 6.3 右侧歌曲列表

第一版可包含：

- Search。
- Filters。
- Sort: Newest。
- Liked。
- Public。
- Uploads。
- Song list。

落地原则：

- 先做前端本地筛选。
- 不要一开始做复杂服务端筛选。
- 没有真实字段的数据不要硬做复杂 UI。

### 6.4 登录用户生成流程

```text
用户输入 prompt / lyrics / style / title
-> 点击 Generate
-> 检查登录状态
-> 检查 credits 是否足够
-> 创建 song 记录
-> 提交 AI 歌词或使用用户歌词
-> 提交 FAL 音频生成
-> 返回 songId / jobId
-> 前端轮询状态
-> 成功后展示歌曲
-> 失败则标记 failed 并退回 credits
```

### 6.5 jobId 原则

- `jobId` 复用 `songs.id`。
- 第一版不单独新建复杂 job 表。

### 6.6 未登录用户流程

当前推荐：

- 未登录用户点击 Generate 后直接跳登录。
- 第一版不做复杂 draft 保存和登录后恢复。

原因：draftId 流程开发成本高，容易出现状态丢失、参数回填、支付后回跳等问题。

### 6.7 Credits 原则

- 生成前检查 credits。
- 生成前冻结/扣除或按当前代码实现扣费。
- 生成失败必须退款。
- 失败状态必须写入日志。
- 前端必须给用户明确提示。
- credits 相关操作必须走 RPC，禁止客户端直接 UPDATE `credits_balance`。

---

## 7. Provider、音频和歌词生成

### 7.1 AI Provider

原则：

- AI 调用只放服务端。
- 内容审核、歌词生成、报告生成走统一 provider 抽象。
- 外部 API 失败最多自动重试 1 次，仍失败才返回错误。
- 不把敏感 key 暴露到客户端。

历史上讨论或使用过 Claude、GitHub Models、OpenAI、OpenRouter，当前以代码实现为准。

### 7.2 音频 Provider

当前重点 Provider：

- FAL。
- `fal-ai/minimax-music/v2`。

历史上涉及过：

- Kie。
- FAL。
- Wavespeed。

### 7.3 FAL 已踩坑

- FAL 405。
- FAL 422。
- 轮询状态未完成时提前取 result。
- 生产环境未使用最新代码。
- fallback result URL 错误。

### 7.4 FAL 正确轮询流程

```text
1. submit task
2. 保存 request_id
3. 轮询 queue.status
4. 如果状态是 IN_QUEUE / IN_PROGRESS：
   - 返回 processing
   - 不取 result
5. 如果状态是 COMPLETED / OK：
   - 请求 response / result
   - 保存 audio_url
   - 更新 song.status
6. 如果状态是 FAILED / ERROR：
   - 更新 song.status = failed
   - 退回 credits
   - 记录 provider_error
```

禁止做法：

- IN_QUEUE / IN_PROGRESS 时请求 result。
- Provider 失败后让 song 长期停留在 generating。
- 失败后不退 credits。
- 把完整 provider 原始错误暴露给普通用户。

### 7.5 日志字段

后端日志建议包含：

- `song_id`
- `user_id`
- `request_id`
- `provider_status`
- `queue_position`
- `response_url_exists`
- `provider_error`
- `credit_refund_amount`
- `balance_before`
- `balance_after`

前端错误提示保持简单：

```text
Song generation failed. Please try again.
```

### 7.6 歌词生成产品原则

不要直接“仿某首歌”。更安全的方式是：

- 模仿某类流行写法。
- 模仿风格结构。
- 模仿情绪和歌曲类型。
- 不抄歌词、旋律或独特表达。

适合研究的方向：

- 大情歌。
- Country pop。
- 情绪流行摇滚。
- 轻柔 alt-pop。
- 真诚型 pop ballad。
- Rap 口号型 hook。
- 搞笑恶搞方向。

产品里应输出原创歌词、可用 style prompt、适合 AI music model 的简短风格描述。

---

## 8. 支付、订阅和 Creem

### 8.1 支付供应商

当前支付供应商：Creem。

历史记录：

- Test Mode 跑通过。
- Checkout 能跳转。
- Webhook `checkout.completed` 能收到。
- 生产环境切换、Sumsub/身份审核、Alipay payout 都讨论过。

### 8.2 环境变量

关键变量：

- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_SUCCESS_URL`
- `CREEM_TEST_MODE`
- `BASE_URL`

当前生产 BASE URL：

```text
https://calyraai.com
```

### 8.3 已踩坑

- 401 Invalid API Key。
- Test Mode / Live Mode key 混用。
- 环境变量修改后没有重新部署。
- 生产与本地配置不一致。
- Creem API URL 或产品配置不匹配。

### 8.4 操作规范

1. 修改 Creem 环境变量后必须重新部署 Vercel。
2. Test Mode 和 Live Mode key 不要混用。
3. 支付成功只能通过 webhook 增加 credits。
4. 支付失败不能增加 credits。
5. Webhook 必须校验签名。
6. 支付发放 credits 必须幂等。
7. 价格页月付/年付切换后，checkout 产品必须正确。

### 8.5 真实支付测试

Test Mode 通过后，早期可以不急着真实支付。正式 Product Hunt / 大规模推广前，建议做一次真实小额支付测试。

注意：

- 真实支付可能产生税费。
- 退款不一定 100% 回到账户。

### 8.6 价格策略

历史调研参考过 Suno、Udio、AIMakeSong、Soundraw、AIVA。

大致结论：

- 主流用户心理价位多在 `$8 - $15 / month`。
- 超过 `$20` 需要强调商业价值。
- 第一阶段不要靠低价硬卷 Suno / Udio。
- 重点是简单工作流、SEO 入口、创作者场景、版权/商用解释。

---

## 9. Supabase、Vercel、OAuth 和邮件

### 9.1 Supabase 职责

Supabase 负责：

- 用户认证。
- 用户资料。
- 歌曲记录。
- credits。
- 支付记录。
- 生成日志。

核心数据：

- `customers`
- `credits_history`
- `subscriptions`
- `songs`
- `achievements`
- `email_log`

### 9.2 Supabase 权限原则

- 前端只能使用 anon key。
- service role 只能在服务端使用。
- RLS 必须检查。
- authenticated grants 必须检查。
- 客户端禁止使用 service role key。

上线前 Must Check：

1. migrations 是否完整。
2. profiles / credits 初始化是否正常。
3. songs 状态字段是否覆盖 draft / processing / completed / failed 或当前代码实际状态。
4. 失败 refund 是否事务安全。
5. webhook 写入 credits 是否幂等。
6. Storage bucket 是否存在。
7. RPC 函数是否存在且参数和代码一致。

### 9.3 Vercel / 环境变量

核心原则：

- 本地正常不代表线上正常。
- 线上出问题，优先查 Vercel 环境变量和部署版本。
- 修改变量后必须 redeploy。

检查清单：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FAL_KEY`
- `CREEM_API_KEY`
- `CREEM_WEBHOOK_SECRET`
- `CREEM_TEST_MODE`
- `BASE_URL`
- Google OAuth callback。
- OpenAI / OpenRouter / 当前 AI provider key。

如果 Vercel 同时有 Preview 和 Production，必须确认变量作用范围，不要只改 Preview 却以为 Production 已生效。

### 9.4 Google OAuth

已遇到的问题：

```text
redirect_uri_mismatch
```

处理原则：

1. Google Cloud Console 里的 Authorized redirect URI 必须和 Supabase / 站点实际回调地址完全一致。
2. http / https、www / non-www、路径、尾部斜杠都要一致。
3. 修改后重新测试登录。
4. OAuth provider 未启用时，前端给友好错误提示。

### 9.5 Cloudflare Email Routing

正式联系邮箱：

```text
support@calyraai.com
```

用途：

- Contact 页面。
- Creem 审核。
- Product Hunt。
- 用户反馈。
- 平台审核。

已踩坑：

- 测试邮件进入 Gmail 垃圾箱。

处理：

- 检查垃圾箱。
- 标记为非垃圾邮件。
- 确认转发成功。

---

## 10. 收录、robots 和 GA4

### 10.1 Google Search Console / Bing 提交前检查

- 正式域名可访问。
- `/sitemap.xml` 可访问。
- `/robots.txt` 没有误屏蔽。
- 核心页面没有错误 noindex。
- 首页 title / description 正确。
- canonical 正确。
- hreflang 正确。
- 404 页面不进 sitemap。

### 10.2 已遇到的 GSC 状态

- Discovered - currently not indexed。
- Crawled - currently not indexed。
- Excluded by noindex tag。
- Page with redirect。
- Duplicate, Google chose different canonical than user。
- Not found 404。

### 10.3 处理优先级

优先处理：

1. 重要页面 404。
2. 重要页面错误 noindex。
3. canonical 明显错误。
4. sitemap 缺失。
5. 重要页面无法访问。

不用急：

- 新站上线几天 0 点击。
- Discovered currently not indexed。
- Bing discovered but not crawled。
- 非核心页面 noindex。
- 正常 redirect。

### 10.4 canonical 原则

如果 GSC 显示 `Duplicate, Google chose different canonical than user`，先检查：

- 是否是重复参数页。
- 是否是旧 URL。
- canonical 是否错误指向首页。
- sitemap 是否提交了不该提交的 URL。
- 页面内容是否太相似。

不要一看到 Duplicate 就乱改。

### 10.5 robots / AI 爬虫

已讨论过：

- Googlebot。
- Bingbot。
- OAI-SearchBot。
- ChatGPT-User。

原则：

- 核心公开页面应允许搜索引擎抓取。
- 登录页、价格页不一定要强推。
- 生成结果页质量不可控时，谨慎让搜索收录。

### 10.6 GA4

当前状态：

- GA4 Realtime 已经收到访问数据。
- 基础部署成功。
- 不要继续折腾基础部署。

后续更有价值的是事件埋点：

- `click_generate`
- `sign_in_start`
- `sign_in_success`
- `checkout_start`
- `checkout_success`
- `song_generate_start`
- `song_generate_success`
- `song_generate_failed`
- `play_demo_song`
- `click_pricing`

早期只看：

- 有没有真实用户。
- 用户从哪里来。
- 访问了哪些页面。
- 是否点击生成。
- 是否进入支付。

---

## 11. 首页 Demo 歌曲和内容资产

### 11.1 Demo 歌曲目标

首页 Demo 歌曲不是随便放音乐，而是用来证明 Calyra AI 能生成听起来像样、适合欧美用户的歌曲。

Demo 歌曲应满足：

- 欧美用户能听懂。
- 旋律和副歌明显。
- 风格主流。
- 歌词简单。
- 商业友好。
- 适合短视频 / YouTube / Reels。

### 11.2 已规划 Demo 歌曲

1. Back in the Light：Modern Dance Pop / Summer Pop。
2. Still Missing You：Emotional Pop Ballad。
3. Not That Serious：Playful Viral Pop。
4. Run Until the Morning：Pop Rock / Indie Pop。
5. Summer on Your Skin：Afro / Latin Pop。
6. New Day Feeling：Chill Pop / Lifestyle Pop。

### 11.3 Suno / AI 音乐生成标准

推荐：

- 短 intro。
- 快速进入 chorus。
- hook phrase 明显。
- 歌词简单。
- 适合欧美主流用户。
- 适合 YouTube / Reels / vlog / lifestyle / brand content。
- 时长约 2:40 - 3:05。

避免：

- intro 太长。
- outro 太长。
- 副歌来得太慢。
- 歌词太复杂。
- 伴奏太杂。
- 音质失真。
- 生成 3:30 - 4:00 以上。

### 11.4 Demo 歌曲工作流

1. Producer Brief：先定歌曲方向、目标用户、hook、风格，不直接写完整歌词。
2. Lyric Writer：根据 brief 写英文歌词和 style prompt。
3. Reviewer：检查歌词长度、结构、hook、风格、时长风险、是否适合首页 demo。
4. Revision：不合格时压缩歌词、减少段落、强化 hook、降低编曲复杂度。

---

## 12. Product Hunt、目录站和外部渠道

### 12.1 Product Hunt 策略

不要一上来直接发布。

推荐顺序：

1. 创建草稿。
2. 准备素材。
3. 检查生成流程。
4. 检查支付流程。
5. 确认首页 demo 歌曲和截图好看。
6. 再正式发布。

发布前检查：

- 生成流程稳定。
- 支付流程稳定。
- 首页 demo 歌曲好听。
- 首页截图好看。
- 准备 4 张图。
- 准备 Maker Comment。
- 登录和 credits 正常。
- 移动端首页不崩。

Product Hunt 第一阶段作用：

- 获得第一波曝光。
- 获得外链和品牌信任。
- 测试转化。

不要期待 Product Hunt 一次发布带来长期稳定流量。长期主线仍然是 SEO。

### 12.2 目录站 / 外部渠道

已讨论过：

- Product Hunt。
- OpenHunts。
- G2。
- Dang.ai。
- AI 工具目录站。

优先级：

1. Product Hunt。
2. 免费 AI 工具目录。
3. OpenHunts 等 launch 平台。
4. G2 等信任背书平台。
5. 付费目录暂缓。

原则：

- 免费能提交就提交。
- 收费目录前期谨慎。
- 目录站不是核心增长引擎，只是外链和曝光补充。
- G2 更多是信任背书和后期 review 资产，不一定马上有流量。

---

## 13. 上线前 Must Fix

历史 Must Fix：

- 生产依赖存在高危漏洞。
- Next.js 版本需要升级。
- `basic-ftp` 漏洞来自 puppeteer 链路。
- Supabase migration / grants 风险。

审计原则：

```bash
pnpm audit --prod --registry=https://registry.npmjs.org
```

如果 pnpm audit 网络失败，可以试：

```bash
npm audit --omit=dev
```

判断原则：

- 构建通过不代表可以上线。
- 支付、生成、credits、登录、数据库权限必须重点检查。
- 审计命令可能因为 registry 或网络原因失败，需要区分工具失败和真实漏洞。

---

## 14. Codex 工作 SOP

### 14.1 任务大小

经验：

- 不要一次塞 100k 的大任务。
- 单次任务控制在 30k - 60k 更稳。
- 复杂任务拆成多个小任务。
- 每次只处理一个问题。

### 14.2 Codex 必读文件

建议 Codex 每次任务前读取：

- `AGENTS.md`
- `docs/CALYRA_SOP.md`
- 相关 `docs/plans/*`
- 相关代码文件

V2 中建议后续补充这些文件：

- `/docs/CALYRA_PROJECT_CONTEXT.md`
- `/docs/CODEX_RULES.md`
- `/docs/CALYRA_ISSUES_HISTORY.md`

是否创建这些文件待确认。

### 14.3 Codex 修改代码规则

- 先读 docs。
- 先看现有代码。
- 先说明理解的问题和修改范围。
- 不要顺手大改。
- 不要重构无关文件。
- 不要擅自改支付、credits、数据库结构，除非任务明确要求。
- 修改后给验证方式。
- 能跑构建就跑 `pnpm build`。
- 工作结束看 `git diff`，确认没有误改。

禁止行为：

- 擅自改支付逻辑。
- 擅自改 credits 逻辑。
- 擅自改数据库结构。
- 擅自删除页面。
- 为了美观大改已跑通功能。
- 把 Test Mode 和 Live Mode 混在一起。

### 14.4 Codex 卡死处理

已遇到现象：

- session 一直转圈。
- 对话不显示。
- reconnecting。
- stream disconnected。
- backend-api 超时。

处理：

1. 不要在卡死 session 里继续硬等。
2. 新开 Codex session。
3. 让新 session 先检查 `git diff` 和已修改文件。
4. 不要重新实现。
5. 从已落地代码继续完成。

给新 session 的提示：

```text
上一个 session 卡死。不要重新实现。
请先检查当前 git diff 和已修改文件，继续完成未完成部分。
不要运行大范围重构。
先告诉我你看到哪些改动。
```

### 14.5 给 Codex 的固定任务模板

```text
请先阅读：
/docs/CALYRA_SOP.md
以及本次任务相关代码。

本次任务只处理一个问题，不要顺手大改。

请按以下格式输出：
1. 你理解的当前问题
2. 你准备修改的文件
3. 修改方案
4. 验收方式
5. 风险点

注意：
- 不要擅自改支付逻辑
- 不要擅自改 credits 逻辑
- 不要擅自改数据库结构
- 不要把 Test Mode 和 Live Mode 混用
- 不要删除已有可用功能
- 如果发现 SOP 和代码不一致，先指出，不要直接改
```

### 14.6 给 GPT 网页版的固定任务模板

```text
请基于 Calyra AI 项目 SOP，帮我分析一个问题。

回答格式必须是：
1. 问题
2. 解决方案
3. 为什么这样做

要求：
- 每次只讲一个重点
- 用大白话
- 不要一次给太多建议
- 不确定就标记“待确认”
- 不要编造我项目里没有的信息
```

### 14.7 Codex 会话记录挖掘

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

---

## 15. 当前优先级

### P0：稳定性

- 生成流程稳定。
- FAL 轮询稳定。
- 失败退款稳定。
- 支付 webhook 稳定。
- 登录流程稳定。
- Vercel 环境变量正确。
- Supabase 权限正确。
- 核心页面可访问。

### P1：SEO 基础

- 首页 title / H1 / description。
- `/ai-song-maker`。
- `/ai-text-to-song`。
- `/ai-lyrics-to-song`。
- `/ai-lyrics-generator`。
- `/royalty-free-ai-music-generator`。
- sitemap。
- robots。
- canonical。
- GSC / Bing 提交。

### P2：首页转化

- 首页 demo 歌曲。
- 首页截图。
- Music Gallery。
- 清晰 CTA 到 `/ai-song-maker`。
- FAQ。
- 底部播放器体验。
- 移动端体验。

### P3：外部发布

- Product Hunt 草稿。
- 截图素材。
- Maker Comment。
- 测试流程。
- 免费目录站提交。
- G2 / OpenHunts 等低成本渠道。

### P4：扩展

- 复杂筛选。
- 用户公开主页。
- 更完整音乐广场。
- 高级歌词智能体。
- 风格模板库。
- 评判报告增强。
- 视频 MV / 对口型方向调研。
- 高级音乐工作流。
- 多语言 SEO。

---

## 16. 暂缓或废弃方案

### 16.1 复杂 draft 流程

暂缓：

- 未登录生成 draft。
- 登录后恢复 draftId。
- 支付后回填参数。

原因：第一版复杂度太高，容易引入状态 bug。

### 16.2 复杂筛选系统

暂缓：

- 服务端 Search / Filters / Liked / Public / Uploads。

原因：第一版前端本地筛选即可。

### 16.3 专业音乐编辑器

暂缓：

- DAW。
- 多轨编辑。
- 复杂混音。
- 自动母带。

原因：偏离第一阶段核心。

### 16.4 大规模社媒运营

当前判断：

- AIMakeSong 不主要依赖社媒。
- Calyra 早期应优先 SEO、目录站、Product Hunt。
- 大规模社媒运营暂缓。

### 16.5 过多多语言 SEO

暂缓原因：

- 非英文翻译质量不稳定时会拖累 SEO。
- 当前目标市场是欧美英语用户。
- 英文页面和生成链路稳定后再扩展。

---

## 17. 风险清单

### 17.1 技术风险

- FAL 状态处理错误。
- Creem key 混用。
- Webhook 未幂等。
- Credits 重复扣 / 漏退。
- Supabase RLS 错误。
- Vercel 变量没重新部署。
- Google OAuth 回调地址错误。
- Next.js 依赖漏洞。
- 音频 Provider 改动影响退款逻辑。

### 17.2 产品风险

- Create 页模式太复杂。
- 用户不知道 Text to Song 和 Lyrics to Song 区别。
- 首页 SEO 太重，视觉不够高级。
- 首页 Demo 歌曲质量一般。
- 生成失败导致用户信任下降。
- 价格页和 checkout 不一致。

### 17.3 SEO 风险

- 新站竞争词太难。
- 页面内容重复。
- 页面内容堆词。
- 多语言质量差。
- 频繁改 URL。
- canonical 配错。
- 生成结果页低质量被收录。

### 17.4 流程风险

- 只记录结果，不记录过程。
- 忘记记录账号申请、API key、配置路径。
- 忘记保存 GPT 网页中的关键推理。
- 没有把错误和修复方式写入排障文档。

---

## 18. 坑记录格式

所有坑都值得记录，从最早的账号申请开始。

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

---

## 19. 最终一句话

Calyra AI 当前阶段不是做复杂音乐平台，而是先做一个稳定、清晰、能被 Google 理解、能让欧美用户快速生成完整歌曲的 AI Song Maker 工具站。

当前最重要的顺序：

1. 生成稳定。
2. 支付稳定。
3. SEO 页面稳定。
4. 首页 demo 可信。
5. Product Hunt / 目录站补充曝光。
6. 再考虑高级功能。
