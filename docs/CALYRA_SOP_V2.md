# Calyra AI 项目 SOP V2

> 版本：V2  
> 生成时间：2026-06-07  
> 数据来源：ChatGPT 导出文件 `conversations.json` / 用户上传文本文件  
> 使用对象：你自己、GPT 网页版、Codex、Claude Code、后续项目 Agent  
> 核心原则：以最近已经执行/确认的方案为准；旧方案只作为历史参考；不确定项标记“待确认”。

---

## 0. V2 与 V1 的区别

V1 是基于当前上下文记忆整理的版本。  
V2 增加了从导出文件中筛到的历史会话信息，重点补充了这些内容：

1. 项目从早期 `Hit-Song` 过渡到 `Calyra AI` 的历史。
2. PRD → 工程文档 → Codex 开发的工作方式。
3. 首页、Create 页、SEO 页、支付、FAL 音频生成、Vercel 环境变量、Google/Bing 收录、GA4、Product Hunt、目录站、首页 Demo 歌曲的完整 SOP。
4. 明确哪些方案已废弃，哪些仍待确认。
5. 加入 Codex 执行规范，避免重复踩坑。

---

## 1. 项目定位 SOP

### 1.1 当前项目

项目名称：

```text
Calyra AI
```

官网：

```text
https://calyraai.com
```

早期项目名：

```text
Hit-Song
```

说明：

```text
Hit-Song 是早期 PRD / 工程文档里的项目名。
后续正式品牌已经切换为 Calyra AI。
历史文档中出现 Hit-Song 时，应理解为 Calyra AI 的前身，不要再使用 Hit-Song 作为正式品牌。
```

### 1.2 产品定位

Calyra AI 是面向欧美用户的 AI 音乐生成网站。

核心定位：

```text
AI Song Maker
AI Music Generator
AI Song Generator
Text to Song
Lyrics to Song
```

用户输入文字想法、歌词、风格描述，网站生成带人声和伴奏的完整歌曲。

### 1.3 阶段目标

第一阶段不是做专业 DAW，也不是和 Suno / Udio 正面硬刚模型能力。

第一阶段目标是：

```text
让新用户能理解
让用户能生成
让支付和 credits 稳定
让 Google 能理解页面
让首页 demo 有信任感
```

优先级：

```text
稳定可用 > SEO 基础 > 首页信任感 > Product Hunt / 目录站 > 高级功能
```

---

## 2. 用户与市场 SOP

### 2.1 目标用户

主要面向：

```text
欧美英语用户
普通内容创作者
YouTube / TikTok / Instagram Reels 创作者
短视频创作者
独立音乐兴趣用户
需要 royalty-free music 的创作者
```

### 2.2 产品价值表达

第一版不要讲太专业的音乐理论。

更适合的表达：

```text
Create songs from text
Turn lyrics into music
Generate AI music with vocals and instruments
Make royalty-free songs for videos and social content
```

不推荐第一版强调：

```text
专业编曲
复杂混音
高级音乐制作
DAW 级编辑
```

---

## 3. 技术栈 SOP

### 3.1 当前技术栈

```text
Frontend: Next.js / React / TypeScript
Hosting: Vercel
Database/Auth: Supabase
Payment: Creem
Audio Generation: FAL / fal-ai/minimax-music/v2
Lyrics / Text AI: OpenAI / OpenRouter / 其他 LLM 方案待代码为准
Analytics: GA4
Email: Cloudflare Email Routing
```

### 3.2 工程开发原则

历史会话里已经确认：

```text
不要只靠 PRD 直接让 Codex/Claude 写代码。
PRD 需要先拆成轻量工程文档。
工程文档至少包含：
1. 数据结构
2. API 设计
3. 页面和状态流
4. 边界条件
```

Codex 的正确使用方式：

```text
PRD / SOP / 工程文档
→ Codex 先读文档和现有代码
→ Codex 输出修改计划
→ 每次只改一个明确问题
→ 修改后给验收方式
```

---

## 4. 页面结构 SOP

### 4.1 当前核心页面

```text
/
首页

/ai-song-maker
主生成页 / 主 SEO 功能页

/ai-text-to-song
Text to Song 页面

/ai-lyrics-to-song
Lyrics to Song 页面

/royalty-free-ai-music-generator
Royalty-Free 场景页，已做或至少已讨论落地

/pricing
价格页

/about
关于页

/contact
联系页

/faq
FAQ 页面

/privacy
隐私政策

/terms
服务条款

/sign-in
登录页
```

### 4.2 首页职责

首页承担四件事：

```text
1. 承接 SEO
2. 解释产品是什么
3. 展示 demo 歌曲建立信任
4. 引导用户进入 /ai-song-maker
```

首页风格方向：

```text
暗色
高级感
偏 Suno 氛围
但结构上学习 AIMakeSong 的 SEO 工具站逻辑
```

首页不应过度复杂。第一版优先清楚表达“这是 AI Song Maker”。

---

## 5. 首页 SEO SOP

### 5.1 当前首页 SEO 方向

已确认过的首页 SEO 文案：

```text
Title:
AI Song Maker & Music Generator Free | Calyra AI

H1:
AI Song Maker & AI Music Generator

Description:
Create AI songs from text, lyrics, and simple ideas. Use our AI song maker to generate music with vocals and instruments in minutes.
```

### 5.2 首页 H2 / 模块策略

首页可以包含这些模块：

```text
Hero
How It Works
Demo Songs / Gallery
Text to Song
Lyrics to Song
Royalty-Free AI Music for Creators
FAQ
CTA
```

已讨论过的标题方向：

```text
Make a Song in 3 Simple Steps with Our AI Song Maker
Discover Songs Made with Our AI Song Maker
Royalty-Free AI Music for Creators
```

### 5.3 首页 CTA

当前主 CTA 应指向：

```text
/ai-song-maker
```

不建议为了好看另开 `/create`，除非后续产品路由统一。当前站内实际生成页是 `/ai-song-maker`，SEO 和转化都应围绕它。

---

## 6. SEO 页面 SOP

### 6.1 主 SEO 页面

```text
/ai-song-maker
```

角色：

```text
主功能页 + 主关键词页
```

核心搜索意图：

```text
用户想找一个 AI Song Maker 直接生成歌曲。
```

页面应该强调：

```text
AI Song Maker
AI Music Generator
Create songs from text and lyrics
Vocals and instruments
Fast generation
```

### 6.2 Text to Song 页面

```text
/ai-text-to-song
```

H1：

```text
AI Text to Song Generator
```

默认交互：

```text
打开页面时默认选中 Text to Song 模式。
```

页面意图：

```text
用户有一句想法、一段 prompt、一个主题，想直接变成歌曲。
```

### 6.3 Lyrics to Song 页面

```text
/ai-lyrics-to-song
```

H1：

```text
AI Lyrics to Song Generator
```

默认交互：

```text
打开页面时默认选中 Lyrics to Song 模式。
```

页面意图：

```text
用户已经有歌词，想把歌词变成完整歌曲。
```

### 6.4 Royalty-Free AI Music 页面

```text
/royalty-free-ai-music-generator
```

V2 判断：

```text
可以做，而且更适合作为“商用/创作者场景页”，不要做成第四个重复生成器页。
```

页面定位：

```text
Royalty-Free AI Music Generator for Videos & Creators
```

内容重点：

```text
YouTube
TikTok
Reels
Ads
Podcast
Game / app background music
Commercial use explanation
Licensing / rights FAQ
```

注意：

```text
不要只堆 royalty-free 关键词。
页面要解释真实使用场景和用户担心的问题。
```

---

## 7. 多语言 SEO SOP

当前策略：

```text
英文为主。
其他语言可以保留，但不要强推。
质量不完整的语言入口可以隐藏。
```

已出现/讨论语言：

```text
zh-CN
es
pt
ja
ko
```

原则：

```text
1. 英文页面先完整。
2. 非英语页面如果翻译残留英文，不主动做 SEO。
3. 多语言页可以 noindex，避免低质量页面拖累。
4. 等英文流量和转化稳定后，再做多语言。
```

---

## 8. 生成页 / Create 工作台 SOP

### 8.1 页面目标

生成页是用户真正创作歌曲的主工作台。

推荐结构：

```text
左侧：生成面板
右侧：歌曲列表 / 当前生成结果 / 历史记录
```

### 8.2 左侧生成面板

应包含：

```text
Credits 显示
Text to Song / Lyrics to Song 切换
Prompt / Lyrics 输入框
Style 输入框
Title 输入框
Instrumental 开关
Generate Song 按钮
```

### 8.3 Simple / Advanced 决策

历史讨论里出现过两种方案：

方案 A：

```text
保留 Simple / Advanced UI 占位，两个模式共用一套逻辑。
```

方案 B：

```text
移除 Simple / Advanced，只保留 Text to Song / Lyrics to Song。
复杂参数作为 Optional settings。
```

V2 推荐采用方案 B：

```text
第一版移除 Simple / Advanced。
原因是 Simple / Advanced 和 Text to Song / Lyrics to Song 会让新手困惑。
Calyra 第一版应让用户一眼知道怎么生成。
```

最终建议：

```text
只保留两个核心入口：
1. Text to Song
2. Lyrics to Song

Style / Title / Instrumental 作为可选字段，不要命名为 Advanced。
```

### 8.4 右侧歌曲列表

第一版可以包含：

```text
Search
Filters
Sort: Newest
Liked
Public
Uploads
Song list
```

落地原则：

```text
先做前端本地筛选。
不要一开始做复杂服务端筛选。
```

具体：

```text
Search：按 title / style / prompt summary 搜索
Sort：默认 created_at desc
Liked：没有字段时可以先做临时前端状态
Public：有字段就真实筛选，没有就 UI 占位
Uploads：有 uploads 数据再做，没有就先隐藏或占位
```

---

## 9. 歌曲生成流程 SOP

### 9.1 登录用户生成流程

```text
用户输入 prompt / lyrics / style / title
→ 点击 Generate
→ 检查登录状态
→ 检查 credits 是否足够
→ 创建 song 记录
→ 提交 AI 歌词或使用用户歌词
→ 提交 FAL 音频生成
→ 返回 songId / jobId
→ 前端轮询状态
→ 成功后展示歌曲
→ 失败则标记 failed 并退还 credits
```

### 9.2 jobId 原则

已确认：

```text
jobId 复用 songs.id。
第一版不单独新建复杂 job 表。
```

### 9.3 未登录用户流程

V2 推荐：

```text
未登录用户点击 Generate 后直接跳登录。
第一版不做复杂 draft 保存和登录后恢复。
```

原因：

```text
draftId 流程开发成本高，容易出现状态丢失、参数回填、支付后回跳等问题。
新站第一版不值得。
```

### 9.4 Credits 原则

```text
生成前检查 credits
生成成功后扣 credits 或按当前代码实现扣费
生成失败必须 refund
失败状态必须写入日志
前端必须给用户明确提示
```

注意：

```text
如果当前代码是“生成前先扣，失败后退”，也可以。
但必须保证失败退款稳定。
```

---

## 10. FAL / 音频生成 SOP

### 10.1 当前音频供应商

```text
FAL
fal-ai/minimax-music/v2
```

### 10.2 已踩过的坑

历史问题：

```text
FAL 405
FAL 422
轮询状态未完成时提前取 result
生产环境未使用最新代码
fallback result URL 错误
```

### 10.3 正确轮询流程

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
   - 更新 song.status = completed
6. 如果状态是 FAILED / ERROR：
   - 更新 song.status = failed
   - 退还 credits
   - 记录 provider_error
```

### 10.4 禁止做法

```text
不要在 IN_QUEUE / IN_PROGRESS 时请求 result。
否则容易出现 422。
```

### 10.5 日志字段

后端日志建议包含：

```text
song_id
user_id
request_id
provider_status
queue_position
response_url_exists
provider_error
credit_refund_amount
balance_before
balance_after
```

### 10.6 前端错误提示

用户侧只需要：

```text
Song generation failed. Please try again.
```

不要暴露复杂 provider 原始错误。

---

## 11. 支付 / Creem SOP

### 11.1 支付供应商

```text
Creem
```

### 11.2 当前状态

历史记录中已讨论：

```text
Test Mode 跑通过
Checkout 能跳转
Webhook checkout.completed 能收到
生产环境切换过
Sumsub / 身份审核讨论过
Alipay payout 配置过
```

### 11.3 环境变量原则

关键变量：

```text
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
CREEM_SUCCESS_URL
CREEM_TEST_MODE
BASE_URL
```

当前生产 BASE_URL：

```text
https://calyraai.com
```

### 11.4 已踩坑

```text
401 Invalid API Key
Test Mode / Live Mode 混用
环境变量修改后没有重新部署
生产与本地配置不一致
```

### 11.5 操作规范

```text
1. 修改 Creem 环境变量后必须重新部署 Vercel。
2. Test Mode 和 Live Mode key 不要混用。
3. 支付成功只能由 webhook 加 credits。
4. 支付失败不能加 credits。
5. Webhook 必须校验签名。
6. 价格页切换月付/年付后，checkout 产品必须正确。
```

### 11.6 真实支付测试

V2 判断：

```text
Test Mode 通过后，早期可以不急着真实支付。
但正式 Product Hunt / 大规模推广前，最好做一次真实小额支付。
```

注意：

```text
真实支付可能产生税费。
退款不一定 100% 回到账户。
```

---

## 12. Supabase SOP

### 12.1 核心职责

```text
用户认证
用户资料
歌曲记录
credits
支付记录
生成日志
```

### 12.2 权限原则

```text
前端只能使用 anon key。
service role 只能在服务端使用。
RLS 需要检查。
authenticated grants 需要检查。
```

### 12.3 上线前 Must Check

```text
1. migrations 是否完整
2. profiles / credits 初始化是否正常
3. songs 表状态字段是否覆盖 draft / processing / completed / failed
4. 失败 refund 是否事务安全
5. webhook 写入 credits 是否幂等
```

---

## 13. Vercel / 环境变量 SOP

### 13.1 核心原则

```text
本地正常不代表线上正常。
线上出问题，优先查 Vercel 环境变量和部署版本。
```

### 13.2 修改变量后必须做

```text
Redeploy
```

### 13.3 检查清单

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
FAL_KEY
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
CREEM_TEST_MODE
BASE_URL
Google OAuth callback
OpenAI / OpenRouter key
```

### 13.4 生产/预览环境

如果 Vercel 同时有 Preview 和 Production：

```text
必须确认变量作用范围。
不要只改 Preview，却以为 Production 已生效。
```

---

## 14. Google OAuth SOP

已遇到问题：

```text
redirect_uri_mismatch
```

处理原则：

```text
1. Google Cloud Console 里的 Authorized redirect URI 必须和 Supabase / 站点实际回调地址完全一致。
2. http / https、www / non-www、路径、尾部斜杠都要一致。
3. 修改后重新测试登录。
```

---

## 15. Cloudflare Email Routing SOP

### 15.1 用途

为网站准备正式联系邮箱：

```text
support@calyraai.com
```

用途：

```text
Contact 页面
Creem 审核
Product Hunt
用户反馈
平台审核
```

### 15.2 已踩坑

```text
测试邮件进入 Gmail 垃圾箱
```

处理：

```text
检查垃圾箱
标记为非垃圾邮件
确认转发成功
```

---

## 16. Google Search Console / Bing SOP

### 16.1 提交前检查

```text
网站能正常访问
sitemap.xml 可访问
robots.txt 没有误屏蔽
核心页面没有 noindex
canonical 正确
首页 title / description 正确
```

### 16.2 已遇到的 GSC 状态

```text
Discovered - currently not indexed
Crawled - currently not indexed
Excluded by noindex tag
Page with redirect
Duplicate, Google chose different canonical than user
Not found 404
```

### 16.3 处理优先级

优先处理：

```text
1. 重要页面 404
2. 重要页面错误 noindex
3. canonical 明显错误
4. sitemap 缺漏
5. 重要页面无法访问
```

不用急：

```text
新站上线几天 0 点击
Discovered currently not indexed
Bing discovered but not crawled
非核心页面 noindex
redirect 正常
```

### 16.4 canonical 处理原则

如果 GSC 显示：

```text
Duplicate, Google chose different canonical than user
```

先检查这些 URL：

```text
是否是重复参数页
是否是旧 URL
是否 canonical 指向首页
是否 sitemap 里提交了不该提交的 URL
是否页面内容太相似
```

不要一看到 Duplicate 就乱改。

---

## 17. robots / AI 爬虫 SOP

已讨论过 robots / Content Signals：

```text
Googlebot
Bingbot
OAI-SearchBot
ChatGPT-User
```

当前原则：

```text
核心公开页面应允许搜索引擎抓取。
登录页、价格不一定要强推。
生成结果页如质量不可控，谨慎让搜索收录。
```

---

## 18. GA4 SOP

### 18.1 当前状态

历史截图中 GA4 Realtime 已经收到访问数据。

说明：

```text
GA4 基础部署成功。
Realtime 能看到 active users / page_view / session_start / first_visit。
```

### 18.2 不要继续折腾基础部署

后续更有价值的是事件埋点：

```text
click_generate
sign_in_start
sign_in_success
checkout_start
checkout_success
song_generate_start
song_generate_success
song_generate_failed
play_demo_song
click_pricing
```

### 18.3 早期看什么

新站早期只看：

```text
有没有真实用户
用户从哪里来
访问了哪些页面
是否点击生成
是否进入支付
```

不要过早分析复杂漏斗。

---

## 19. 首页 Demo 歌曲 SOP

### 19.1 目标

首页 Demo 歌曲不是随便放音乐，而是用来证明：

```text
Calyra AI 能生成听起来像样、适合欧美用户的歌。
```

### 19.2 已规划 Demo 歌曲

```text
1. Back in the Light
Modern Dance Pop / Summer Pop

2. Still Missing You
Emotional Pop Ballad

3. Not That Serious
Playful Viral Pop

4. Run Until the Morning
Pop Rock / Indie Pop

5. Summer on Your Skin
Afro / Latin Pop

6. New Day Feeling
Chill Pop / Lifestyle Pop
```

### 19.3 Suno 生成标准

推荐：

```text
短 intro
快速进入 chorus
hook phrase 明显
歌词简单
适合欧美主流用户
适合 YouTube / Reels / vlog / lifestyle / brand content
时长约 2:40 - 3:05
```

避免：

```text
intro 太长
outro 太长
副歌来太晚
歌词太复杂
伴奏太杂
音质失真
生成 3:30 - 4:00 以上
```

### 19.4 Demo 歌曲工作流

推荐做成一个 Skill / SOP：

```text
Step 1: Producer Brief
先定歌曲方向、目标用户、hook、风格，不直接写完整歌词。

Step 2: Lyric Writer
根据 brief 写英文歌词和 Suno Style Prompt。

Step 3: Reviewer
检查歌词长度、结构、hook、风格、时长风险、是否适合首页 demo。

Step 4: Revision
如果不合格，压缩歌词、减少段落、强化 hook、降低编曲复杂度。
```

---

## 20. 歌词生成产品 SOP

### 20.1 方向

不要直接“仿某首歌”。

更安全、更适合产品化的方式是：

```text
模仿某类流行写法
模仿风格结构
模仿情绪和歌曲类型
不要抄歌词、旋律、独特表达
```

### 20.2 适合研究的流行方向

历史讨论中提到适合研究欧美主流歌曲的方向：

```text
大情歌
Country pop
情绪流行摇滚
轻柔 alt-pop
真诚型 pop ballad
Rap 口号型 hook
搞笑恶搞方向
```

产品里应该输出：

```text
原创歌词
可用 style prompt
适合 Suno / AI music model 的简短风格描述
```

---

## 21. Product Hunt SOP

### 21.1 当前策略

不要一上来直接发布。

推荐：

```text
先创建草稿
准备素材
检查流程
再正式发布
```

### 21.2 发布前检查

```text
1. 生成流程稳定
2. 支付流程稳定
3. 首页 demo 歌曲好看
4. 首页截图好看
5. 准备 4 张图
6. 准备 1 条 Maker Comment
7. 登录和 credits 正常
8. 移动端首页不要崩
```

### 21.3 Product Hunt 当前作用

第一阶段作用：

```text
获得第一波曝光
获得外链和品牌信任
测试转化
```

不要期待：

```text
Product Hunt 一次发布就带来长期稳定流量
```

长期主线仍然是 SEO。

---

## 22. 目录站 / 外部渠道 SOP

已讨论过：

```text
Product Hunt
OpenHunts
G2
Dang.ai
AI 工具目录站
```

### 22.1 优先级

```text
1. Product Hunt
2. 免费 AI 工具目录
3. OpenHunts 等 launch 平台
4. G2 等信任背书平台
5. 付费目录暂缓
```

### 22.2 原则

```text
免费能提交就提交。
收费目录前期谨慎。
目录站不是核心增长引擎，只是外链和曝光补充。
```

G2 的价值：

```text
更多是信任背书和后期 review 资产，不一定马上有流量。
```

---

## 23. 价格 / 订阅 SOP

### 23.1 市场锚点

历史调研里参考过：

```text
Suno
Udio
AIMakeSong
Soundraw
AIVA
```

大致结论：

```text
主流用户心理价位多在 $8 - $15 / month。
超过 $20 需要强调商业价值。
```

### 23.2 Calyra 第一阶段策略

```text
不要靠低价硬卷 Suno / Udio。
重点是简单工作流、SEO 入口、创作者场景、版权/商用解释。
```

### 23.3 支付方式

当前已讨论过：

```text
最低 $9 方案
月付/年付切换
Creem Checkout
```

后续要确保：

```text
价格页文案和 Creem 产品一致
checkout 成功后 credits 正确到账
```

---

## 24. 上线前 Must Fix SOP

历史 Must Fix：

```text
1. 生产依赖存在高危漏洞
2. Next.js 版本需升级
3. basic-ftp 漏洞来自 puppeteer 链路
4. Supabase migration / grants 风险
```

### 24.1 审计原则

```text
pnpm audit --prod 可能因为 npmmirror 不支持 audit 接口而失败。
可以临时使用 npm 官方 registry。
```

命令：

```bash
pnpm audit --prod --registry=https://registry.npmjs.org
```

如果 pnpm audit 网络失败，可以试：

```bash
npm audit --omit=dev
```

### 24.2 判断原则

```text
构建通过不代表可以上线。
支付、生成、credits、登录、数据库权限必须重点检查。
```

---

## 25. Codex 工作 SOP

### 25.1 Codex 任务大小

历史经验：

```text
不要一次塞 100k 的大任务。
单次任务控制在 30k - 60k 更稳。
复杂任务拆成多个小任务。
```

### 25.2 Codex 卡死处理

已遇到现象：

```text
session 一直转圈
对话不显示
其他会话正常
reconnecting
stream disconnected
backend-api 超时
```

处理：

```text
1. 不要在卡死 session 里继续硬等。
2. 新开 Codex session。
3. 让新 session 先检查 git diff 和已修改文件。
4. 不要重新实现。
5. 从已落地代码继续完成。
```

给 Codex 的提示：

```text
上一个 session 卡死。
不要重新实现。
请先检查当前 git diff 和已修改文件，继续完成未完成部分。
不要运行大范围重构。
先告诉我你看到哪些改动。
```

### 25.3 Codex 修改代码规则

```text
每次只处理一个问题
先读 docs
先看现有代码
先输出计划
不要顺手大改
不要重构无关文件
不要改支付/credits/数据库，除非任务明确要求
修改后给验收方式
```

### 25.4 Codex 必读文件

建议放入仓库：

```text
/docs/CALYRA_PROJECT_CONTEXT.md
/docs/CALYRA_SOP.md
/docs/CODEX_RULES.md
/docs/CALYRA_ISSUES_HISTORY.md
```

Codex 每次任务前都读。

---

## 26. 已废弃 / 暂缓方案

### 26.1 暂缓复杂 draft 流程

```text
未登录生成 draft
登录后恢复 draftId
支付后回填参数
```

暂缓原因：

```text
第一版复杂度太高。
容易引入状态 bug。
```

### 26.2 暂缓复杂筛选系统

```text
服务端 Search / Filters / Liked / Public / Uploads
```

暂缓原因：

```text
第一版前端本地筛选即可。
```

### 26.3 暂缓专业音乐编辑器

```text
DAW
多轨编辑
复杂混音
自动母带
```

暂缓原因：

```text
偏离第一阶段核心。
```

### 26.4 暂缓大规模社媒运营

当前判断：

```text
AIMakeSong 不主要依赖社媒。
Calyra 早期应优先 SEO、目录站、Product Hunt。
```

---

## 27. 当前优先级

### P0：稳定性

```text
生成流程稳定
FAL 轮询稳定
失败退款稳定
支付 webhook 稳定
登录稳定
Vercel 环境变量正确
Supabase 权限正确
```

### P1：SEO 基础

```text
首页 title / H1 / description
/ai-song-maker
/ai-text-to-song
/ai-lyrics-to-song
/royalty-free-ai-music-generator
sitemap
robots
canonical
GSC / Bing 提交
```

### P2：首页转化

```text
Demo 歌曲
Gallery
清楚 CTA
FAQ
移动端体验
```

### P3：外部发布

```text
Product Hunt 草稿
截图素材
Maker Comment
免费目录站提交
G2 / OpenHunts 等低成本渠道
```

### P4：扩展

```text
歌词生成智能体
评判报告
风格模板库
视频 MV / 对口型方向调研
高级音乐工作流
多语言 SEO
```

---

## 28. 风险清单

### 28.1 技术风险

```text
FAL 状态处理错误
Creem key 混用
Webhook 未幂等
Credits 重复扣/漏退
Supabase RLS 错误
Vercel 变量没重新部署
Google OAuth 回调地址错误
Next.js 依赖漏洞
```

### 28.2 产品风险

```text
Create 页模式太复杂
用户不知道 Text to Song 和 Lyrics to Song 区别
首页 Demo 歌曲质量一般
生成失败导致用户信任下降
价格页和 checkout 不一致
```

### 28.3 SEO 风险

```text
新站竞争词太难
页面内容重复
多语言质量差
频繁改 URL
canonical 配错
生成结果页低质量被收录
```

---

## 29. 给 Codex 的固定任务模板

```text
请先阅读：

/docs/CALYRA_PROJECT_CONTEXT.md
/docs/CALYRA_SOP.md
/docs/CODEX_RULES.md
/docs/CALYRA_ISSUES_HISTORY.md

然后再阅读当前相关代码。

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

---

## 30. 给 GPT 网页版的固定任务模板

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

---

## 31. V2 来源会话索引

以下是从导出文件中按关键词筛到的高相关会话，分数只是筛选参考，不代表重要性绝对排序。

| 日期 | 会话标题 | 关键词相关度 |
|---|---|---:|
| 2026-05-22 | Google Search Console 提交 | 1070 |
| 2026-05-22 | SEO优化建议 | 1058 |
| 2026-05-14 | 域名选择建议 | 1013 |
| 2026-05-12 | AI音乐创业规划建议 | 837 |
| 2026-05-16 | 网站交互流程分析 | 798 |
| 2026-05-15 | 首页设计与SEO策略 | 779 |
| 2026-05-20 | FAL轮询405错误修复 | 759 |
| 2026-05-14 | Calyra AI 首页优化 | 740 |
| 2026-05-19 | FAL音频生成405错误 | 718 |
| 2026-05-18 | Vercel 环境配置问题 | 664 |
| 2026-06-04 | SEO 页面优化建议 | 515 |
| 2026-06-03 | InfiniteTalk 视频配音生成 | 510 |
| 2026-05-30 | Codex读取项目归档 | 486 |
| 2026-05-14 | Vercel 环境变量问题 | 432 |
| 2026-05-19 | 歌词生成与评判报告 | 402 |
| 2026-05-28 | 网站流量监控指南 | 379 |
| 2026-06-01 | Product Hunt 互动策略 | 318 |
| 2026-05-23 | Product Hunt 草稿准备 | 284 |
| 2026-05-25 | Nissen商品链接解析 | 275 |
| 2026-05-14 | SEO 关键词分析指导 | 272 |
| 2026-05-19 | 正式测试前准备事项 | 260 |
| 2026-05-01 | AI音乐订阅价格对比 | 251 |
| 2026-06-02 | SEO优化建议 | 211 |
| 2026-05-23 | AIMakeSong 社交账号分析 | 207 |
| 2026-05-25 | Royalty-Free AI Music Page | 205 |
| 2026-05-21 | AI音乐网站首页歌曲建议 | 195 |
| 2026-05-21 | Calyra AI 首页歌曲审核 | 174 |
| 2026-05-22 | 大陆身份证审核问题 | 153 |
| 2026-05-09 | AI音乐生成API推荐 | 145 |
| 2026-05-18 | 出海误区解析 | 144 |
| 2026-05-16 | Cloudflare Email Routing 申请 | 144 |
| 2026-05-20 | 网站国际化与Google提交 | 141 |
| 2026-05-29 | Die With A Smile分析 | 121 |
| 2026-05-14 | Vercel 域名解析问题 | 121 |
| 2026-05-21 | Back in the Light | 115 |

---

## 32. 最终一句话

Calyra AI 当前阶段不是做复杂音乐平台，而是先做一个稳定、清楚、能被 Google 理解、能让欧美用户快速生成歌曲的 AI Song Maker 工具站。

当前最重要的顺序：

```text
生成稳定
支付稳定
SEO 页面稳定
首页 demo 可信
Product Hunt / 目录站补充曝光
再考虑高级功能
```
