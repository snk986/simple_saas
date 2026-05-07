# Phase 4 商业化与增长实施计划

> **给 Claude/Codex：** 必须使用 executing-plans，按任务逐步执行本计划。

**目标：** 完成 Hit-Song 的商业化闭环和增长数据基础，让定价、订阅、积分包、播放排行和百分比排名可以支撑付费转化与公开传播。

**架构：** Phase 4 拆成五个独立交付任务：商业套餐配置与定价页、Creem 订阅/积分支付闭环、订阅权益与存储生命周期、播放统计与排行榜、百分比排名与增长验收。所有支付与积分变更必须在服务端处理；Creem webhook 可公开访问但必须校验签名；积分相关操作必须走 RPC 或服务端封装，禁止客户端直接更新 `credits_balance`。

**技术栈：** Next.js 15 App Router、TypeScript、Supabase Auth/Postgres/RPC、Supabase service role、Creem.io、next-intl、shadcn/ui、Tailwind CSS、pnpm。

---

## 拆分结论

Phase 4 不建议作为一个大任务实现。它同时影响付费转化页、支付 API、webhook 幂等、订阅权益、积分账本、公开播放数据、排行榜 SEO 和增长归因。任何一个部分出错都可能造成重复发放积分、订阅状态错误、公开页计数污染或排行榜泄露私有歌曲。

推荐拆分为：

1. Task 14：商业套餐配置与定价页
2. Task 15：Creem 订阅与积分包支付闭环
3. Task 16：订阅权益、积分账本与存储生命周期
4. Task 17：播放统计、事件记录与排行榜
5. Task 18：百分比排名与增长验收

---

## Task 14：商业套餐配置与定价页

**目标：** 把当前通用 SaaS 套餐替换为 Hit-Song 的真实商业套餐，并让 `/pricing` 成为可索引、可信任、可转化的增长页面。

**文件：**
- 修改：`config/subscriptions.ts`
- 修改：`types/subscriptions.ts`
- 修改：`app/[locale]/pricing/page.tsx`
- 修改：`components/pricing-section.tsx`，如果定价页不再使用该组件，则删除无效引用后保留或下线
- 修改：`messages/en.json`
- 修改：`messages/es.json`
- 修改：`messages/pt.json`
- 修改：`messages/ja.json`
- 修改：`messages/ko.json`
- 修改：`.env.example`
- 参考：`hit-song-prd.md`

**实现细节：**

1. 重写 `config/subscriptions.ts`：
   - 定义一次性积分包：`mini`、`standard`、`pro_pack`。
   - 定义订阅套餐：`basic_monthly`、`pro_monthly`、`basic_yearly`、`pro_yearly`。
   - 使用环境变量保存 Creem product/price id，例如 `CREEM_BASIC_MONTHLY_PRODUCT_ID`、`CREEM_PRO_YEARLY_PRODUCT_ID`。
   - 套餐文案必须围绕歌曲、报告、永久保存、优先生成，不保留通用 SaaS 文案。

2. 调整 `types/subscriptions.ts`：
   - 增加 `billingPeriod: "one_time" | "monthly" | "yearly"`。
   - 增加 `plan: "free" | "basic" | "pro" | "enterprise"`。
   - 增加 `creditAmount`、`songRetentionDays`、`priorityGeneration`、`reportCreditsIncluded` 等前端展示字段。
   - 保持类型只描述公开配置，不放敏感价格 id 以外的 secret。

3. 重做 `/pricing` 页面信息架构：
   - 保持 Server Component 和 SSR 可索引。
   - 首屏明确展示 Hit-Song、积分如何消费、套餐差异、退款承诺、主 CTA。
   - 不使用低信息密度 landing page，不做大面积渐变或装饰 orb。
   - 支持登录用户看到当前积分、当前套餐和更合适的 CTA。

4. 增加 FAQ 与信任信息：
   - 积分不过期。
   - 支持随时取消订阅。
   - 免费版歌曲 30 天后删除，升级后永久保存。
   - 7 天退款政策。
   - 目前仅支持 USD。

5. 更新 i18n 文案：
   - 所有页面文案进入 `messages/*`。
   - 组件中不能硬编码中文字符串。
   - 五种语言 key 必须一致。

**验证：**

- 执行 `pnpm build`。
- 访问 `/pricing`、`/es/pricing`、`/pt/pricing`、`/ja/pricing`、`/ko/pricing` 均可渲染。
- 页面源码中能看到 SSR title、description、JSON-LD、FAQ 文案。
- 未登录用户 CTA 指向登录或 checkout 前置登录流程。
- 已登录用户能看到当前套餐/积分的个性化区域，且不泄露任何 Creem secret。

---

## Task 15：Creem 订阅与积分包支付闭环

**目标：** 让用户可以购买积分包或订阅套餐，并通过 Creem webhook 幂等地更新订阅状态和积分余额。

**文件：**
- 修改：`app/api/creem/create-checkout/route.ts`
- 修改：`app/api/webhooks/creem/route.ts`
- 修改：`lib/creem.ts`
- 修改：`types/creem.ts`
- 修改：`utils/supabase/subscriptions.ts`
- 修改：`app/api/creem/customer-portal/route.ts`
- 新增或修改：`app/[locale]/payment/success/page.tsx`，如果采用直接回到 `/create?upgraded=true`，则只保留轻量 redirect
- 修改：`messages/*.json`
- 按需修改：`supabase/migrations/20260501000000_hit_song.sql` 或新增后续 migration

**实现细节：**

1. 收紧 `POST /api/creem/create-checkout`：
   - 使用 `utils/supabase/server.ts` 校验 Supabase session。
   - 不信任客户端传入的 `userId`、`credits`、`productType`。
   - 请求体只允许 `{ tierId: string }`。
   - 服务端从 `config/subscriptions.ts` 查找 tier，并生成 Creem checkout。
   - 返回格式统一为 `{ checkoutUrl: string }`；错误返回 `{ error: string }`。

2. 设置 checkout metadata：
   - `user_id`
   - `tier_id`
   - `plan`
   - `billing_period`
   - `credit_amount`
   - `locale`
   - `idempotency_key`，优先使用 Creem order/subscription id，缺失时用 checkout id。

3. 加固 Creem webhook：
   - webhook 路由继续公开，但必须校验 `creem-signature`。
   - 不在日志里输出完整 event body、邮箱、支付对象或敏感 metadata。
   - 支持至少这些事件：`checkout.completed`、`subscription.active`、`subscription.paid`、`subscription.canceled`、`subscription.expired`。
   - 未识别事件返回 `{ received: true }`，不抛 500。

4. 实现幂等积分发放：
   - 给 `credits_history.creem_order_id` 或新的 `payment_events.creem_event_id` 加唯一约束。
   - webhook 重试时不能重复加积分。
   - 一次性积分包在 `checkout.completed` 发放。
   - 订阅首购和续费按套餐规则发放月度/年度积分。
   - 积分增加必须走 RPC 或服务端封装，禁止客户端直接 UPDATE `credits_balance`。

5. 订阅状态同步：
   - `customers.plan` 或等价字段记录 `free/basic/pro`。
   - `subscriptions` 记录 Creem subscription id、product id、status、period start/end、canceled_at。
   - 取消订阅后当期权益保留到 `current_period_end`。
   - 已订阅 Pro 的用户在定价页看到“管理订阅”，而不是重复购买 Pro。

6. 支付成功体验：
   - 成功后优先跳转 `/create?upgraded=true`。
   - 页面或 create 顶部提示积分已到账。
   - 如果 webhook 尚未完成，显示“支付确认中”的轻量状态，并允许用户刷新积分。

**验证：**

- 执行 `pnpm build`。
- 未登录调用 `/api/creem/create-checkout` 返回 `{ error: "Unauthorized" }` 和 401。
- 传入不存在的 `tierId` 返回 `{ error: "Invalid plan" }` 和 400。
- checkout metadata 不包含客户端伪造的 userId 或 credits。
- 同一个 Creem webhook 重放两次，只发放一次积分。
- 订阅取消后状态更新，但当期权益仍然有效。
- 客户门户 API 只允许当前登录用户打开自己的 portal。

---

## Task 16：订阅权益、积分账本与存储生命周期

**目标：** 让付费状态真正影响产品权益，包括积分消耗、免费用户 30 天存储限制、升级后永久保存和 Dashboard 状态展示。

**文件：**
- 修改：`utils/supabase/subscriptions.ts`
- 修改：`app/api/credits/route.ts`
- 修改：`app/api/generate/lyrics/route.ts`
- 修改：`app/api/generate/audio/route.ts`
- 修改：`app/api/judge/report/route.ts`
- 修改：`components/dashboard/credits-balance-card.tsx`
- 修改：`components/dashboard/subscription-status-card.tsx`
- 修改：`components/dashboard/subscription-portal-dialog.tsx`
- 修改：`app/[locale]/dashboard/page.tsx`
- 新增：`lib/subscription/entitlements.ts`
- 新增：`app/api/cron/storage-cleanup/route.ts`
- 修改或新增：`supabase/migrations/*`
- 修改：`messages/*.json`

**实现细节：**

1. 创建 `lib/subscription/entitlements.ts`：
   - 导出 `getUserEntitlements(userId)`。
   - 返回 `plan`、`creditsBalance`、`songRetentionDays`、`priorityGeneration`、`canKeepSongsForever`、`subscriptionEndsAt`。
   - 服务端使用 service role 或 server client 查询，客户端不能直接读敏感订阅表。

2. 统一积分读取和消费：
   - 修正 `app/api/credits/route.ts` 中 `credits` 与 `credits_balance` 字段不一致的问题。
   - 积分不足返回 402。
   - 未登录返回 401。
   - 参数错误返回 400。
   - 消费积分必须走 `freeze_credit` / `unfreeze_credit` 或明确的 RPC，不直接 UPDATE `credits_balance`。

3. 接入生成流程权益：
   - 歌词生成、音频生成、报告生成都读取当前用户权益。
   - `SKIP_CREDIT_CHECK === "true"` 时只跳过扣费，不跳过 session 校验。
   - 付费用户可以永久保存歌曲；免费用户写入 `songs.expires_at = created_at + 30 days`。

4. 实现存储清理 cron：
   - 新增 `GET /api/cron/storage-cleanup`。
   - 校验 `CRON_SECRET`。
   - 使用 service role 查找 `expires_at < now()` 且未升级保留的歌曲。
   - 删除 Supabase Storage 中音频和封面文件。
   - 更新 song status 为 `expired`，保留必要元数据用于 Dashboard 提示。
   - 单首清理失败不阻塞整个批次。

5. Dashboard 展示权益：
   - 当前积分余额。
   - 当前套餐、到期/续费日期。
   - 免费歌曲到期提醒。
   - 管理订阅入口。
   - 升级 CTA 要克制、任务导向，不做强营销弹窗。

**验证：**

- 执行 `pnpm build`。
- 免费用户生成歌曲后有 `expires_at`。
- Pro/Basic 有效用户生成歌曲后 `expires_at` 为 null。
- 积分不足时生成类 API 返回 402。
- `SKIP_CREDIT_CHECK=true` 时不会扣积分，但仍要求登录。
- storage cleanup 没有 `CRON_SECRET` 返回 401。
- cleanup dry-run 或测试运行不会删除付费用户歌曲。

---

## Task 17：播放统计、事件记录与排行榜

**目标：** 把公开歌曲的播放、完整播放、分享和 CTA 点击沉淀成可分析数据，并生成安全的公开排行榜。

**文件：**
- 修改：`app/api/song/[id]/count/route.ts`
- 修改：`supabase/migrations/20260507000000_song_cta_counter.sql` 或新增 migration
- 新增：`lib/analytics/song-events.ts`
- 新增：`lib/song/ranking.ts`
- 新增：`app/[locale]/ranking/page.tsx`
- 新增：`components/ranking/ranking-list.tsx`
- 修改：`components/song/song-player.tsx`
- 修改：`components/song/song-cta.tsx`
- 修改：`components/header.tsx`
- 修改：`components/footer.tsx`
- 修改：`messages/*.json`

**实现细节：**

1. 规范事件模型：
   - 支持事件：`play_start`、`play_complete`、`share`、`cta_click`。
   - 保留现有 `songs.play_count`、`songs.share_count`、`songs.cta_click_count` 作为快速计数。
   - 新增 `complete_count`，如果当前表缺失则 migration 添加。
   - 增长阶段需要更细分析时，新增 `song_events` 表记录事件类型、song_id、referrer、utm、created_at、匿名 visitor hash。

2. 加固计数 API：
   - 只允许公开且 ready 的歌曲计数。
   - 使用 service role 调 RPC，不暴露私有歌曲。
   - 请求体验可以匿名，但不能让客户端指定要更新的数据库字段。
   - 同一浏览器短时间重复事件要做轻量去重，优先用 cookie/localStorage 结合服务端窗口。

3. 创建 `lib/song/ranking.ts`：
   - 查询公开 ready 歌曲。
   - 默认排序使用综合热度分：播放、完整播放、分享、CTA 点击和新鲜度。
   - 不返回 `user_id`、私有报告、内部成本、未公开音频等字段。
   - 支持 `period=today|week|all`。

4. 创建 `/ranking` 页面：
   - Server Component，可索引。
   - 支持五种 locale URL。
   - 页面核心是排行榜列表和试听入口，不做营销型 hero。
   - 每首歌提供播放、分享、进入创作 CTA。
   - metadata、canonical、hreflang 和 JSON-LD 完整。

5. 接入播放器和 CTA：
   - 播放开始只计一次 `play_start`。
   - 播放达到 80% 或播放结束计 `play_complete`。
   - 分享成功后计 `share`。
   - 从公开页点击创建计 `cta_click`，并保留 `ref=song&id={songId}`。

**验证：**

- 执行 `pnpm build`。
- 私有歌曲调用 count API 返回 404。
- 公开 ready 歌曲的播放、完整播放、分享、CTA 点击能分别增加对应计数。
- `/ranking`、`/es/ranking` 可访问并只展示公开 ready 歌曲。
- 页面源码包含可索引排行榜内容。
- 不同事件不能通过伪造字段名更新任意列。

---

## Task 18：百分比排名与增长验收

**目标：** 在歌曲和报告中展示“超过 X% 作品”的相对排名，并建立 Phase 4 的发布验收清单。

**文件：**
- 新增：`lib/song/percentile.ts`
- 修改：`app/[locale]/song/[id]/page.tsx`
- 修改：`app/[locale]/report/[id]/page.tsx`
- 修改：`components/report/score-display.tsx`
- 修改：`components/song/song-seo-summary.tsx`
- 新增：`app/api/cron/ranking-snapshot/route.ts`
- 新增：`docs/checklists/phase-4-release.md`
- 修改：`messages/*.json`
- 按需新增：`supabase/migrations/*`

**实现细节：**

1. 定义百分比排名口径：
   - 少于 1000 首 ready 公开歌曲时，不展示强排名，只展示“数据积累中”或同类维度提示。
   - 达到阈值后，基于 `total_score`、`play_count`、`share_count`、`complete_count` 计算 percentile。
   - 文案避免承诺商业成功，只表达相对表现。

2. 创建 `lib/song/percentile.ts`：
   - 导出 `getSongPercentiles(songId)`。
   - 只基于公开 ready 歌曲或当前用户自己的报告数据计算。
   - 返回 `scorePercentile`、`playPercentile`、`sharePercentile`、`sampleSize`。

3. 可选创建 snapshot cron：
   - `GET /api/cron/ranking-snapshot` 校验 `CRON_SECRET`。
   - 每天计算一次排行榜/percentile 快照，避免页面请求做重查询。
   - 数据量小于阈值时可以不落快照。

4. 接入展示：
   - 公开 song 页显示公开表现排名。
   - 私有 report 页显示总分排名和维度亮点。
   - 不在未公开歌曲页面泄露全站排名。
   - 文案走 `messages/*`。

5. 创建 Phase 4 发布验收清单：
   - 支付成功、webhook 重放、订阅取消、积分包发放。
   - 免费/付费存储生命周期。
   - 公开计数和排行榜。
   - SEO metadata、sitemap、robots。
   - 敏感 key 和服务端边界。
   - 退款政策和客服入口。

**验证：**

- 执行 `pnpm build`。
- 样本量不足 1000 时不展示误导性百分比。
- 样本量达到阈值后 percentile 在 0 到 100 范围内。
- 私有歌曲不出现在公开排名计算和排行榜中。
- Cron secret 缺失时 snapshot API 返回 401。
- Phase 4 checklist 中的支付、权益、增长、SEO、安全项逐项通过后再发布。

---

## 推荐执行顺序

1. 先做 Task 14，因为真实套餐配置和定价页是后续 checkout、webhook 和权益判断的共同来源。
2. 再做 Task 15，把支付闭环和幂等积分发放打稳，避免后续权益逻辑基于错误账本。
3. 第三做 Task 16，让订阅状态真正影响生成、积分和存储生命周期。
4. 第四做 Task 17，沉淀公开增长数据并开放排行榜入口。
5. 最后做 Task 18，在数据基础稳定后再展示百分比排名，并统一做发布验收。

如果当前阶段还没有 1000 用户或足够公开歌曲，Task 18 的百分比排名应只实现阈值判断和接口边界，不强行展示排名文案。

---

## 构建门禁

每个任务完成后都执行：

```bash
pnpm build
```

预期：构建成功完成。

当前任务构建通过，并且上面列出的手动检查通过后，再进入下一个任务。
