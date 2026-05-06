# Phase 2 评判与情绪价值实施计划

> **给 Claude/Codex：** 必须使用 executing-plans，按任务逐步执行本计划。

**目标：** 构建 Phase 2 闭环：歌词评判、情绪价值报告、分享卡片生成、成就系统。

**架构：** Phase 2 拆成四个独立交付任务，每个任务完成后都必须能通过 `pnpm build`，再进入下一个任务。Claude/报告生成只放在服务端 API Routes 和 `lib/ai/*` 中；浏览器端分享能力只放在 Client Component；成就通过服务端 helper 计算，并写入现有 `achievements` 表。

**技术栈：** Next.js 15 App Router、TypeScript、Supabase Auth/Postgres/Storage、Claude API 封装、shadcn/ui、Tailwind CSS、现有 `puppeteer` 依赖；`html2canvas`、`satori` 等架构确认过的依赖，只在实际实现需要时再添加。

---

## 拆分结论

Phase 2 在实现前需要拆分。它跨越了五类边界：

- 付费/积分敏感 API 行为：`/api/judge/report`
- Claude 报告生成与 JSON 解析
- 私有报告页与公开分享面
- 客户端截图/导出行为
- 成就解锁副作用

如果作为一个大任务实现，测试和回滚都会很困难。推荐拆分如下：

1. Task 5：歌词评判后端
2. Task 6：综合报告页
3. Task 7：分享卡片与 OG 图
4. Task 8：成就系统

---

## Task 5：歌词评判后端

**目标：** 让已登录用户可以为一首歌生成结构化 Claude 评判报告，并按规则处理积分。

**文件：**
- 修改：`types/judge.ts`
- 修改：`lib/ai/prompts.ts`
- 修改：`lib/ai/claude.ts`
- 新增：`app/api/judge/report/route.ts`
- 按需修改：`supabase/migrations/20260501000000_hit_song.sql`，仅当需要新的 RPC 或索引支持时修改
- 参考：`app/api/generate/lyrics/route.ts`
- 参考：`supabase/migrations/20260501000000_hit_song.sql`

**实现细节：**

1. 扩展 `types/judge.ts` 中 Phase 2 报告结构：
   - `total_score`
   - `dimensions`
   - `producer_comment`
   - `emotional_value`
   - `market_positioning`
   - `hook_analysis`
   - `recommended_next_steps`
   - `share_summary`
   - `generated_at`

2. 在 `lib/ai/prompts.ts` 中新增 `buildJudgeReportPrompt()`。
   - 输入：title、lyrics、user story、style params、locale。
   - 输出：严格 JSON。
   - prompt 文本只保留在服务端。
   - 要求所有分数在 0 到 100 之间。
   - 要求 Claude 避免医疗、法律、确定商业成功等承诺性表述。

3. 在 `lib/ai/claude.ts` 中新增 `generateJudgeReport()`。
   - 复用现有 `requestClaude()` 和 `extractJson()` 模式。
   - 5xx 响应最多自动重试 1 次，和现有 Claude 逻辑保持一致。
   - 解析后对分数边界做校验/归一化。

4. 创建 `POST /api/judge/report`。
   - 使用 `utils/supabase/server.ts` 中的 `createClient()` 校验 Supabase session。
   - 使用 `zod` 校验请求体：`{ songId: uuid }`。
   - 只允许读取当前用户自己的 song。
   - 要求 song status 为 `ready`；如果音频未完成，返回 400。
   - 如果 `report_data` 已存在，直接返回缓存报告，不重复扣费。
   - 如果 `SKIP_CREDIT_CHECK === "true"`，跳过扣费。
   - 否则在 Claude 生成前调用 `freeze_credit(user.id, 100)`。
   - 如果 Claude/报告生成失败，调用 `unfreeze_credit(user.id, 100)` 退回积分。
   - 将 `report_data` 和 `total_score` 写回 `songs`。
   - 返回 `{ songId, report }`。

5. 错误返回约定：
   - 未登录：`{ error: "Unauthorized" }`，401
   - 请求体错误：`{ error: "Invalid request" }`，400
   - 歌曲不存在：`{ error: "Song not found" }`，404
   - 歌曲未 ready：`{ error: "Song is not ready" }`，400
   - 积分不足：`{ error: "Insufficient credits" }`，402
   - Claude 失败：`{ error: "Report generation failed" }`，500

**验证：**

- 执行 `pnpm build`。
- 手动 API 检查：
  - 未登录请求返回 401。
  - 无效 `songId` 返回 400。
  - ready 状态的歌曲会创建 `songs.report_data` 和 `songs.total_score`。
  - 重复请求返回缓存报告，并且不会再次扣费。
  - 设置 `SKIP_CREDIT_CHECK=true` 时，报告生成跳过积分扣除。

---

## Task 6：综合报告页

**目标：** 给歌曲作者提供一个私有报告页，展示评分、制作人点评、情绪价值，并提供明确的分享路径。

**文件：**
- 新增：`app/[locale]/report/[id]/page.tsx`
- 新增：`components/report/score-display.tsx`
- 新增：`components/report/producer-comment.tsx`
- 新增：`components/report/report-section.tsx`
- 新增：`components/report/report-actions.tsx`
- 修改：`messages/en.json`
- 参考：`components/song/song-player.tsx`
- 参考：`app/[locale]/create/page.tsx`

**实现细节：**

1. 将 `app/[locale]/report/[id]/page.tsx` 做成 Server Component。
   - 使用 Supabase server client。
   - 要求用户已登录。
   - 通过 `id` 和 `user_id` 获取 song。
   - 如果不存在，返回 `notFound()`。
   - 如果 `report_data` 为空，渲染生成报告 CTA，调用 `/api/judge/report`。
   - 如果报告已存在，渲染所有报告模块。

2. 创建 `score-display.tsx`。
   - 突出展示总分。
   - 使用进度条或紧凑仪表展示维度分数。
   - 布局保持信息密度和可读性，不做营销落地页风格。

3. 创建 `producer-comment.tsx`。
   - 展示制作人点评、优势、改进建议、下一步建议。
   - 组件内避免出现 `messages/` 之外的非英文硬编码文案。

4. 创建 `report-section.tsx`。
   - 作为情绪价值、hook 分析、市场定位的复用展示组件。
   - props 保持简单，并从 `JudgeReport` 类型派生。

5. 创建 Client Component：`report-actions.tsx`。
   - 按钮：如果报告缺失，则生成报告。
   - 按钮：进入公开歌曲页。
   - 按钮：Task 7 完成后用于打开/复制分享卡片链接。
   - 如果已有 toast 模式，复用现有 toast；否则使用最小本地状态。

6. 在 `messages/en.json` 下新增 `report` 相关 key。
   - 组件里不写硬编码中文。
   - 英文文案保持简洁。

**验证：**

- 执行 `pnpm build`。
- 未登录用户不能查看私有报告。
- 作者可以查看报告。
- 非作者收到 404 或跳转，不泄露歌曲存在性。
- 没有报告的歌曲可以触发生成。
- 已有报告的歌曲不会再次调用 Claude。

---

## Task 7：分享卡片与 OG 图

**目标：** 让用户可以生成/分享精致的报告卡片，并为社交平台提供服务端 OG 图片。

**文件：**
- 新增：`components/report/share-card.tsx`
- 新增：`components/report/share-card-export.tsx`
- 新增：`app/api/share/og/route.tsx`
- 修改：`app/[locale]/report/[id]/page.tsx`
- 修改：`messages/en.json`
- 可选依赖变更：实现时如果确实需要，再添加 `html2canvas` 和/或 `satori`

**实现细节：**

1. 创建 `share-card.tsx`。
   - 纯展示组件，不使用浏览器 API。
   - 输入：歌曲标题、总分、最高的两个维度、短制作人引语、封面 URL、风格标签。
   - 固定适合导出的宽高比：OG 使用 `1200 / 630`，竖版社交卡片可用 `1080 / 1350`。
   - 不做卡片套卡片，保持视觉清爽。

2. 创建 Client Component：`share-card-export.tsx`。
   - 如果添加了 `html2canvas`，只在这里使用。
   - 从渲染后的卡片导出 PNG。
   - 提供复制链接和下载操作。
   - 不输出敏感数据到日志。

3. 创建 `GET /api/share/og`。
   - Query 参数：`songId`。
   - 通过服务端 Supabase 获取公开安全的 song projection。
   - 如果歌曲私有、不存在或没有报告，返回 404。
   - 使用架构允许的方法生成图片：
     - 优先：实现时已安装 `satori` 则使用 `satori`。
     - 兜底：使用现有 `puppeteer` 依赖渲染本地 HTML 模板。
   - 返回 PNG response，并设置缓存头。

4. 接入报告页 metadata。
   - 私有报告页保持不可索引。
   - 报告存在后，公开歌曲页可以使用 `/api/share/og?songId={id}` 作为 OG image。

**验证：**

- 执行 `pnpm build`。
- 分享卡片在移动端和桌面端都能正常渲染。
- 导出按钮能在浏览器生成可用图片。
- `/api/share/og?songId=...` 对公开且有报告的歌曲返回图片。
- 私有或不存在的歌曲返回 404。
- 公开 OG endpoint 不泄露报告私有字段。

---

## Task 8：成就系统

**目标：** 基于 Phase 1 和 Phase 2 行为解锁成就，并且不信任客户端声明。

**文件：**
- 新增：`config/achievements.ts`
- 新增：`lib/achievements/check-achievements.ts`
- 新增：`components/dashboard/achievements.tsx`
- 修改：`app/api/generate/audio/status/route.ts`
- 修改：`app/api/judge/report/route.ts`
- 修改：`app/api/song/[id]/count/route.ts`，如果 Phase 1 还没有这个文件，则创建
- 修改：`app/[locale]/dashboard/page.tsx`
- 修改：`messages/en.json`
- 参考：`supabase/migrations/20260501000000_hit_song.sql`

**实现细节：**

1. 在 `config/achievements.ts` 定义成就元数据。
   - `first_song`
   - `first_ready_song`
   - `first_report`
   - `score_80`
   - `score_90`
   - `songs_3`
   - `plays_50`
   - `shares_10`

2. 在 `lib/achievements/check-achievements.ts` 创建 `checkAchievements()`。
   - 仅服务端使用。
   - 写入时使用 `utils/supabase/service-role.ts`。
   - 接收 `userId` 和触发上下文。
   - 从 `songs` 查询聚合计数。
   - 使用 `upsert` 或 conflict-ignore 方式幂等写入成就。

3. 将成就检查挂到后端事件中：
   - 音频状态切到 `ready` 后。
   - 报告生成成功后。
   - 公开计数变更后。
   - 不信任客户端传来的成就解锁请求。

4. 创建 `components/dashboard/achievements.tsx`。
   - 根据现有 dashboard 结构选择 Server Component 或 Client Component。
   - 展示已解锁和未解锁成就。
   - 保持紧凑，Dashboard 应该偏运营工具感，不做过度装饰。

5. 更新 dashboard 页面。
   - 获取当前用户成就。
   - 在歌曲/订阅等核心信息下方渲染成就模块。

**验证：**

- 执行 `pnpm build`。
- 第一首 ready 歌曲解锁 `first_ready_song`。
- 第一份报告解锁 `first_report`。
- 重复检查不会创建重复行。
- Dashboard 正确展示已解锁状态。
- 非作者不能替其他用户触发成就。

---

## 推荐执行顺序

1. 先做 Task 5，因为 report data 是后续所有能力的基础。
2. 再做 Task 6，因为它能在真实 UI 中验证报告 schema。
3. 第三做 Task 8，因为成就可以挂到稳定后的报告/音频接口上。
4. 最后做 Task 7，因为分享卡片依赖最终报告展示和公开安全 projection。

如果增长/分享优先级高于留存机制，Task 7 可以提前到 Task 8 之前。

---

## 构建门禁

每个任务完成后都执行：

```bash
pnpm build
```

预期：构建成功完成。

当前任务构建通过，并且上面列出的手动检查通过后，再开始下一个任务。
