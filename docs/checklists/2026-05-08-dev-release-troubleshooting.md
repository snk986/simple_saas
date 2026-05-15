# calyra-ai Dev 环境上线排障记录

日期：2026-05-08

本文记录 calyra-ai `dev` 环境上线验证过程中遇到的问题、原因和解决办法。以后本项目的上线排障记录统一使用中文，并按以下结构整理：

1. 总结问题
2. 说明原因
3. 给出解决办法

## 0. 创建并推送 dev 分支

### 问题

无。

### 原因

无。

### 解决办法

创建 `dev` 分支并推送到 GitHub。

分支策略：

- `dev`：用于 Vercel Preview / dev 环境验证
- `main`：稳定分支，dev 流程验证完成后再合并

## 1. 创建或确认 Supabase Dev 项目

### 问题

Supabase 后台显示的 key 名称和项目中的环境变量名称不完全一致，后台没有直接显示 `NEXT_PUBLIC_SUPABASE_URL`。

### 原因

Supabase 新版后台常见字段名称是：

- Publishable key
- Secret key

项目 URL 需要通过 Supabase 项目 ID 组合出来。

### 解决办法

使用以下映射：

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-key>
SUPABASE_SERVICE_ROLE_KEY=<secret-key>
```

安全注意：`SUPABASE_SERVICE_ROLE_KEY` 只能用于服务端，不能暴露到客户端代码、公开文档或 GitHub。

## 2. 执行 Supabase Dev 数据库迁移

### 问题 1

执行 `20260501000000_hit_song.sql` 时报错：

```text
column "credits_balance" of relation "customers" does not exist
```

### 原因

该 migration 末尾有一段 dev 临时代码：

```sql
update public.customers set credits_balance = 9999 where true;
```

但是 `credits_balance` 字段是在后续 migration 中创建的：

```text
20260507001000_payment_idempotency.sql
```

所以前一个 migration 提前引用了尚不存在的字段。

### 解决办法

从 `20260501000000_hit_song.sql` 移除 dev 临时的 `9999` 积分更新逻辑。

dev 流程改为使用真实的初始积分设计，而不是人为写入 `9999` 积分。

### 问题 2

`handle_new_user()` trigger 给新用户发放的初始积分是 `3`，但架构设计期望是 `300`。

### 原因

migration 中保留了早期占位值，未和架构文档同步。

### 解决办法

将初始积分更新为 `300`：

- `credits = 300`
- `credits_balance = 300`
- `credits_history.amount = 300`
- `metadata.initial_credits = 300`

并在 `20260507001000_payment_idempotency.sql` 中补充新的 `handle_new_user()` 替换逻辑，确保 `credits_balance` 字段存在后，新用户能同时获得 `credits` 和 `credits_balance`。

### 问题 3

执行 `20260507002000_entitlements_storage_lifecycle.sql` 时，Supabase 提示有破坏性操作。

### 原因

该 migration 中有以下 SQL：

```sql
drop constraint if exists songs_status_check;
drop function if exists public.freeze_credit(uuid, integer);
drop function if exists public.unfreeze_credit(uuid, integer);
```

Supabase 检测到 `drop` 操作时会提示风险。

### 解决办法

确认这些操作是预期行为：

- 旧的 `songs_status_check` 需要替换，以便新增 `expired` 歌曲状态。
- 旧的积分 RPC 函数需要替换，以便支持描述、metadata 和 credits history 写入。

确认后可以继续执行该 migration。

## 3. 确认 Supabase Storage Bucket

### 问题

无。

### 原因

无。

### 解决办法

创建公开 Supabase Storage bucket：

```text
calyra-ai-media
```

该 bucket 用于生成后的音频和封面图存储。

如果使用代码默认值，也可以在 Vercel 配置：

```env
SUPABASE_MEDIA_BUCKET=songs
```

注意：环境变量中的 bucket 名称必须和 Supabase Storage 中实际创建的 bucket 名称一致。

## 4. 配置 Vercel Preview / Dev 环境

### 问题 1

不确定是否必须先导入 Vercel 项目，才能配置环境变量。

### 原因

Vercel 只有在 GitHub 仓库被导入成 Vercel Project 后，才会显示该项目的 Settings 和 Environment Variables。

### 解决办法

先将 GitHub 仓库导入 Vercel，框架选择 Next.js。

推荐配置：

```text
Framework: Next.js
Root Directory: ./
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm build
```

### 问题 2

Vercel 初始构建在依赖安装阶段失败，日志中出现类似：

```text
ERR_PNPM_META_FETCH_FAIL
Value of "this" must be of type URLSearchParams
ERR_INVALID_THIS
```

### 原因

Vercel 默认 Node / pnpm 组合和项目依赖安装流程存在兼容问题。

### 解决办法

在 `package.json` 固定 pnpm：

```json
"packageManager": "pnpm@9.15.9"
```

并固定 Node：

```json
"engines": {
  "node": "20.x"
}
```

### 问题 3

固定 Node 和 pnpm 后，Vercel 又报错：

```text
Headless installation requires a pnpm-lock.yaml file
```

### 原因

项目使用了：

```bash
pnpm install --frozen-lockfile
```

但 `pnpm-lock.yaml` 没有提交到 GitHub，并且曾经被 `.gitignore` 忽略。

Vercel 构建环境不会使用本地 `node_modules`，它会从 GitHub 拉代码后重新安装依赖。没有 lockfile 时，Vercel 无法按本地锁定版本复现依赖树，容易出现依赖版本漂移或安装失败。

### 解决办法

从 `.gitignore` 中移除 `pnpm-lock.yaml` 忽略规则，并提交 lockfile：

```bash
git add .gitignore package.json pnpm-lock.yaml
git commit -m "chore: fix vercel pnpm install"
git push origin dev
```

上线 pnpm 项目前必须检查：

```bash
git ls-files pnpm-lock.yaml
pnpm install --frozen-lockfile
pnpm build
```

经验总结：`package.json` 表示“想要什么依赖”，`pnpm-lock.yaml` 表示“部署时精确安装哪一套依赖”。Vercel 上线必须提交 lockfile。

## 5. 关闭 Vercel Deployment Protection

### 问题

打开 Vercel Preview 部署地址时，页面要求登录 Vercel。

### 原因

Vercel 开启了 Deployment Protection / Vercel Authentication。Preview 部署会被保护，未授权访问者会先看到 Vercel 登录页。

### 解决办法

进入 Vercel 项目：

```text
Settings -> Deployment Protection
```

关闭 `Vercel Authentication`。

完整验证登录、支付、Webhook、公开分享页之前，Preview 地址不能被 Vercel Authentication 挡住，否则 Supabase 回调和 Creem webhook 也可能无法正常访问。

## 6. 首页打开后 Server Component 500

### 问题

关闭 Vercel Authentication 后，访问 Preview 地址出现：

```text
This page couldn't load
A server error occurred. Reload to try again.
```

浏览器 console 中出现：

```text
An error occurred in the Server Components render.
```

### 原因

生产环境下 Next.js 会隐藏 Server Component 的真实错误，浏览器只显示 digest。需要到 Vercel Runtime Logs 查看服务端异常。

本次排查中发现首页还有一个明确问题：`app/page.tsx` 中写了：

```ts
redirect("/");
```

这会导致访问 `/` 时重定向回自己。根路径应交给 `next-intl` middleware 接管并渲染默认语言首页。

### 解决办法

删除 `app/page.tsx` 中的自我重定向逻辑，让 `next-intl` middleware 处理 `/`。

如果仍然报错，进入：

```text
Vercel -> Project -> Deployments -> 最新 dev 部署 -> Logs / Runtime Logs
```

查看真实服务端错误。

## 7. Vercel 环境变量没有配置导致首页 500

### 问题

Vercel 构建成功，但打开网站时报错：

```text
Your project's URL and Key are required to create a Supabase client!
```

### 原因

Vercel Project 的 Environment Variables 页面显示：

```text
No Environment Variables Added
```

说明部署环境没有配置 Supabase 运行时变量。首页布局会在服务端创建 Supabase client，所以缺少以下变量会导致 Server Component 渲染失败：

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 解决办法

先在 Vercel 配置首页启动必需变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
BASE_URL=https://<vercel-dev-domain>
```

环境选择：

```text
Production and Preview
```

配置后必须重新创建或重新部署 Deployment。

## 8. Vercel 环境变量是 Deployment 快照

### 问题

在 Vercel 添加或修改环境变量后，网站仍然报缺少 Supabase URL / Key。重新填写变量并创建新 Deployment 后，网站才正常打开。

### 原因

Vercel 的每个 Deployment 都是一次快照。修改 Project Settings 中的 Environment Variables 不会自动更新已经创建好的旧 Deployment。

如果继续刷新旧浏览器 tab 或旧 `calyra-ai-xxxx.vercel.app` 地址，可能仍然访问的是旧环境变量快照。

### 解决办法

修改环境变量后的稳定流程：

1. 进入 `Settings -> Environment Variables` 修改变量。
2. 保存后进入 `Deployments` 页面。
3. 找到目标分支最新 Deployment。
4. 点击 `Redeploy` 或创建新的 Deployment。
5. 等待状态变为 `Ready`。
6. 从最新 Deployment 的 `Visit` 按钮打开网站。

经验总结：Vercel 环境变量变更后，不要只刷新旧页面。必须重新部署，并打开最新 Deployment。

## 9. 配置 Supabase Auth 回调地址

### 问题

Supabase 登录、注册、OAuth 或邮箱链接回调需要正确的 dev 域名。

### 原因

Supabase Auth 会校验 Site URL 和 Redirect URLs。如果 Vercel Preview URL 变化，而 Supabase 没有配置对应回调地址，登录和注册流程可能失败或跳转异常。

### 解决办法

进入 Supabase：

```text
Authentication -> URL Configuration
```

配置：

```text
Site URL = https://<vercel-dev-domain>
Redirect URLs = https://<vercel-dev-domain>/**
```

建议尽快绑定固定 dev 域名，避免每次 Vercel Preview URL 变化都要重新配置 Supabase 回调。

## 10. 注册和登录异常：Email not confirmed / email rate limit exceeded

### 问题

注册和登录时出现：

```text
/sign-in?error=Email%20not%20confirmed
/sign-up?error=email%20rate%20limit%20exceeded
```

### 原因

`Email not confirmed` 的原因是 Supabase Email Provider 开启了邮箱确认，新用户注册后必须先点击确认邮件，未确认前无法登录。

`email rate limit exceeded` 的原因是短时间内频繁注册或发送确认邮件，触发了 Supabase 内置邮件服务的发送限制。Supabase 默认邮件服务适合开发演示，不适合频繁测试。

### 解决办法

dev 验证阶段可以先关闭邮箱确认：

```text
Supabase Dashboard
-> Authentication
-> Providers
-> Email
-> Confirm email
-> 关闭
```

如果旧账号已经处于未确认状态，可以：

1. 在 Supabase `Authentication -> Users` 中手动确认该用户。
2. 删除旧用户后重新注册。
3. 换一个全新邮箱测试。

如果触发邮件限流，可以等待一段时间，或后续配置自定义 SMTP。

## 11. 注册成功后跳转 Dashboard 出现 Server Component 报错

### 问题

删除旧邮箱用户后重新注册，页面跳转到：

```text
/dashboard?success=Thanks%20for%20signing%20up!
```

但 Dashboard 出现：

```text
An error occurred in the Server Components render.
```

### 原因

注册动作已经成功，问题发生在登录后渲染 Dashboard。

Dashboard 页面会查询：

- `customers`
- `subscriptions`
- `credits_history`
- `songs`
- `achievements`

并且会调用 `getUserEntitlements(user.id)`。该函数使用 service role client，需要 Vercel 环境变量：

```env
SUPABASE_SERVICE_ROLE_KEY
```

如果只配置了 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，Dashboard 会因为缺少 service role key 而服务端渲染失败。

### 解决办法

在 Vercel 添加：

```env
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
```

环境选择：

```text
Production and Preview
```

保存后重新创建或重新部署最新 dev Deployment。

如果添加后仍然报错，继续查看 Vercel Runtime Logs。下一类常见原因是 Supabase migrations 未完整执行，导致表、字段或 RPC 函数不存在。

## 12. 注册成功后的产品流程选择

### 问题

注册成功后应该跳转到哪里：

- 直接进入 Dashboard
- 回填登录页
- 跳回首页

### 原因

当前代码在 `app/actions.ts` 中注册成功后执行：

```ts
return encodedRedirect("success", "/dashboard", "Thanks for signing up!");
```

所以注册成功后会直接进入 Dashboard。

### 解决办法

dev 验证阶段建议保留跳转 Dashboard，因为可以最快验证：

- 登录态
- 新用户数据
- 积分
- 生成流程
- Dashboard 数据读取

正式上线前再根据产品策略决定是否调整：

```text
注册后直接进 Dashboard：适合低摩擦产品体验
注册后回登录页：适合强邮箱确认流程
注册后回首页：适合增长页承接和轻提示
```

## 14. Vercel 固定 dev 域名

### 问题

每次 Vercel 构建成功后，都会生成新的 Preview Deployment URL，例如：

```text
calyra-ai-l9ltxo13q-snk986s-projects.vercel.app
```

其中 `l9ltxo13q` 这一段每次部署都会变化，导致 Supabase Auth、Creem webhook、Return URL 等回调地址难以稳定配置。

### 原因

Vercel 每次 Preview Deployment 都会生成唯一 URL，这是正常机制。该 URL 适合查看单次部署产物，但不适合作为长期回调地址。

### 解决办法

使用 Vercel 免费域名绑定固定 dev 地址：

```text
https://calyra-ai-dev.vercel.app
```

注意：

- `dev.calyra-ai.com` 需要拥有 `calyra-ai.com` 域名并配置 DNS，否则会显示 `Invalid Configuration`。
- 如果只使用 Vercel 免费域名，不需要配置外部 DNS。
- 固定 dev 域名应指向 `dev` 分支最新部署。

绑定后统一更新：

```env
BASE_URL=https://calyra-ai-dev.vercel.app
CREEM_SUCCESS_URL=https://calyra-ai-dev.vercel.app/dashboard
```

Supabase Auth：

```text
Site URL = https://calyra-ai-dev.vercel.app
Redirect URLs = https://calyra-ai-dev.vercel.app/**
```

Creem test webhook：

```text
https://calyra-ai-dev.vercel.app/api/webhooks/creem
```

## 15. 客户端请求 customers 表被 RLS 拒绝

### 问题

Dashboard 页面出现浏览器请求：

```text
GET https://<project>.supabase.co/rest/v1/customers?select=creem_customer_id&user_id=eq.<user-id>
Status Code: 403 Forbidden
```

### 原因

客户端组件 `SubscriptionPortalDialog` 直接用浏览器端 Supabase client 查询 `customers.creem_customer_id`。

该表属于用户、支付和订阅相关敏感数据。即使使用的是 `NEXT_PUBLIC_SUPABASE_ANON_KEY`，外部用户也可以自己构造请求访问 Supabase REST API，所以必须依赖 RLS 保护。

本次 403 说明 RLS 正在拦截不合适的客户端访问。这个结果是安全保护生效，不是坏事。

如果关闭 RLS 或 policy 写得过宽，客户端可能泄露：

- `creem_customer_id`
- 用户 email
- credits / credits_balance
- plan
- metadata
- 支付客户和业务用户的关联关系

这类泄露会影响支付平台风控，严重时可能导致 Creem 等账号被限制。

### 解决办法

不要让客户端直接读取 `customers` 表。改为：

```text
客户端 UI
-> 调用自己的 API Route
-> API Route 校验 Supabase session
-> 服务端使用 service role 或受控查询读取 customers
-> 只返回前端需要的最小结果
```

本次已调整：

- 免费用户直接显示 `View plans`
- 有订阅信息时才显示 `Manage Plan`
- 点击管理订阅时走服务端 `/api/creem/customer-portal`

经验总结：

```text
NEXT_PUBLIC_SUPABASE_ANON_KEY 不是秘密。
凡是客户端能发起的 Supabase 查询，都必须假设外部用户也能自己构造请求。
RLS 必须开启，支付/积分/客户/订阅相关逻辑必须走服务端 API 或受控 RPC。
```

## 16. Creem 回调 URL 参数

### 问题

Creem 支付成功后回跳到 Dashboard，URL 后面带了一串参数：

```text
/dashboard?checkout_id=...&order_id=...&customer_id=...&product_id=...&signature=...
```

### 原因

这些参数是 Creem 支付完成后的回跳信息：

- `checkout_id`：本次 checkout 会话 ID
- `order_id`：订单 ID
- `customer_id`：Creem 客户 ID
- `product_id`：购买的产品 ID
- `signature`：Creem 用于证明参数未被篡改的签名

这些参数可以用于前端展示“支付完成”或辅助排查，但不应该作为发放积分或订阅权益的唯一依据。

### 解决办法

权益发放应以 Creem webhook 为准。当前项目方向正确：通过 `/api/webhooks/creem` 处理支付事件并写入积分/订阅数据。

前端回调参数只作为展示或辅助校验使用，不能仅凭 URL 参数给用户加积分，因为用户可以伪造 URL。

## 17. Creem 套餐打通与 Credits 数量不符合预期

### 问题

Creem 的 Basic 订阅和一次性 Standard 购买已经打通，但测试发现 $12 Standard 套餐只增加了 `3` credits，而预期应该是 `300` credits。其他套餐的 credits 数也不符合未来设计预期。

### 原因

当前代码配置中就是这么写的。在 `config/subscriptions.ts` 中：

```ts
{
  name: "Standard",
  price: "$12",
  creditAmount: 3,
}
```

所以 webhook 按配置发放 `3` credits，并不是 Creem 或 webhook 计算错误。

### 解决办法

当前阶段先不修改，因为套餐体系后续会大改。

后续重构套餐时，需要统一调整：

- `config/subscriptions.ts` 中所有 `creditAmount`
- 页面展示文案
- Creem 产品 ID 和价格
- webhook metadata
- 积分扣减规则
- “1 credit” 到底代表一首完整歌曲，还是内部计量单位

## 18. 歌词生成 API 500

### 问题

访问或调用：

```text
https://calyra-ai-dev.vercel.app/api/generate/lyrics
```

返回 500。

### 原因

当前尚未配置大模型 API key。歌词生成接口会调用 `lib/ai/claude.ts`，其中需要：

```env
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
```

如果缺少 `ANTHROPIC_API_KEY`，代码会抛出：

```text
ANTHROPIC_API_KEY is not configured
```

然后 API 返回：

```json
{ "error": "Generation failed" }
```

### 解决办法

如果继续使用当前 Claude 实现，需要在 Vercel 配置：

```env
ANTHROPIC_API_KEY=<anthropic-api-key>
ANTHROPIC_MODEL=claude-3-5-sonnet-latest
```

保存后重新部署 dev。

如果前期想降低成本，可以考虑改造为可切换 AI provider，先使用 Gemini 免费层验证流程：

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=<gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
```

阶段建议：

```text
开发验证期：Gemini 2.5 Flash / Flash-Lite
正式体验期：Claude Sonnet 或 GPT-5 mini
高质量歌词和报告期：Claude Sonnet
```

当前项目仍是 Claude 封装，若切 Gemini，需要先改 `lib/ai` provider 抽象。

## 19. 大模型 Provider 切换与第三方风控

### 问题

歌词生成从 Claude 切换到 Gemini / OpenRouter / GitHub Models 过程中，出现不同 provider 的访问失败：

```text
Gemini request failed with 403: Your project has been denied access.
OpenRouter requires credits / minimum top-up before model calls can run.
```

### 原因

不同 AI provider 的免费层、风控、额度和计费规则不同。

- Gemini API 即使 API key 正确，也可能因为项目、账号、地区、风控或 Google Cloud 权限策略返回 `403 PERMISSION_DENIED`。
- OpenRouter 虽然可以统一路由多个模型，但部分模型调用前需要账户充值或满足最低余额要求，例如先充值 `$5`。
- Vercel Runtime Logs 是确认线上实际 provider、模型和错误原因的主要位置。不要只看浏览器页面 500。

### 解决办法

把 AI 调用封装成 provider 抽象，业务 API 不直接绑定某一家服务。

推荐排查顺序：

1. 在 Runtime Logs 中确认实际 provider：

```text
[lyrics] generating lyrics { provider: 'github', locale: 'en' }
```

2. 看 provider 返回的真实错误，而不是只看浏览器 500。
3. 如果一个 provider 被风控或需要充值，切换到已验证可用的 provider。
4. 当前 dev 验证阶段使用 GitHub Models：

```env
AI_PROVIDER=github
GITHUB_MODELS_API_KEY=<github-models-key>
```

经验总结：

```text
AI provider 免费层不等于稳定可用。
403 通常是权限/风控/项目访问问题，不是普通额度用完。
429 才更像 rate limit / quota exhausted。
Provider 切换必须通过 Runtime Logs 确认线上是否真的生效。
```

## 20. Vercel 代码变更与环境变量变更的部署快照

### 问题

代码已经 push，Vercel 自动构建完成；随后又修改了环境变量。再去 Deployments 页面点最新 deployment 的 `Redeploy`，有时发现新环境变量仍然没有生效。

### 原因

Vercel 的每个 Deployment 都是一次快照：

```text
Deployment = 某个 commit + 当时可用的环境变量集合
```

容易踩坑的地方：

- 环境变量修改不会自动影响已经存在的 deployment。
- Preview / Production / branch-specific environment variables 作用域不同。
- branch-specific Preview 变量可能覆盖普通 Preview 变量。
- 在 Deployments 页面点某个 deployment 的 `Redeploy`，要确认它对应的是目标 commit、目标分支和目标环境。
- 固定域名可能还指向旧 deployment，需要确认 alias / visit 的是最新构建结果。

### 解决办法

最稳流程：

```text
1. 先在 Vercel 保存环境变量。
2. 再 push 代码到目标分支。
3. 等 Vercel 自动创建新的 deployment。
4. 确认 deployment commit 是最新 commit。
5. 确认固定域名指向最新 deployment。
```

如果已经先 push 代码、后改环境变量，推荐推一个空 commit 触发全新 deployment：

```bash
git commit --allow-empty -m "chore: refresh dev deployment env"
git push origin dev
```

排查环境变量是否生效时，不要只看 Settings 页面。应结合：

- Runtime Logs 中打印的非敏感配置，例如 provider / model。
- 第三方服务后台实际收到的请求参数。
- 最新 deployment 对应的 commit 和分支。

经验总结：

```text
同时改代码和环境变量时，最可靠的是创建一次新的 deployment。
不要对旧 deployment 反复 redeploy 来猜测环境变量是否生效。
```

## 21. API 返回 500 但 Vercel 页面看不到错误日志

### 问题

调用：

```text
POST /api/generate/lyrics
```

浏览器和 Vercel access log 只看到 `500`，但没有足够的错误栈或业务日志。

### 原因

Vercel 的请求详情页会先显示 access log、firewall、external APIs 等摘要信息，不一定直接显示应用层 `console.error` 的完整上下文。

此外，如果代码只返回：

```json
{ "error": "Generation failed" }
```

但没有在关键阶段打印结构化日志，就很难判断 500 发生在：

- 鉴权
- AI provider 调用
- JSON 解析
- Supabase 查询
- Supabase 写入
- 外部 API 响应格式变化

### 解决办法

给关键 API Route 增加不包含敏感信息的结构化日志。

示例：

```ts
console.info("[lyrics] generating lyrics", {
  provider: process.env.AI_PROVIDER ?? "github",
  locale,
});

console.info("[lyrics] generated draft", {
  provider: process.env.AI_PROVIDER ?? "github",
  locale,
  style: style.key,
});

console.error("[lyrics] failed to create song", insertError);
```

这样 Runtime Logs 可以明确看到流程停在哪一步：

```text
[lyrics] generating lyrics { provider: 'github', locale: 'en' }
[lyrics] generated draft { provider: 'github', locale: 'en', style: 'joy' }
[lyrics] failed to create song { code: '42501', ... }
```

经验总结：

```text
线上排障不要只依赖 HTTP 500。
关键链路必须有阶段日志，且日志不得打印 API key、token、用户隐私或完整敏感 payload。
```

## 22. Supabase 表权限与 RLS Policy 同时需要配置

### 问题

歌词已经成功生成，但插入 `songs` 表失败：

```text
[lyrics] failed to create song {
  code: '42501',
  hint: 'Grant the required privileges to the current role with: GRANT SELECT, INSERT ON public.songs TO authenticated;',
  message: 'permission denied for table songs'
}
```

### 原因

Supabase / Postgres 权限分两层：

1. 表级权限：例如 `grant select, insert, update, delete on public.songs to authenticated;`
2. RLS Policy：例如只允许用户管理自己的歌曲 `auth.uid() = user_id`

只写 RLS policy 不够。如果 `authenticated` 角色没有表级 `INSERT` / `SELECT` / `UPDATE` 权限，请求会先被 Postgres 表权限拦截。

### 解决办法

给登录用户授予必要表权限，同时用 RLS 限制只能操作自己的数据：

```sql
grant select, insert, update, delete on public.songs to authenticated;
grant select on public.achievements to authenticated;

drop policy if exists "Users can manage own songs" on public.songs;

create policy "Users can manage own songs"
  on public.songs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

注意：

```text
grant 负责“能不能访问这张表”。
RLS policy 负责“能访问哪些行、能写入什么行”。
两者缺一不可。
```

经验总结：

```text
service_role 能写入不代表 authenticated 用户也能写入。
用户态 API Route 使用 Supabase session client 时，通常走 authenticated 角色。
后台任务、webhook、cron 才应使用 service_role。
```

## 23. 音频生成 Provider 要求 callBackUrl

### 问题

调用音频生成接口时报错：

```text
Audio generation error: Error [KieError]: Please enter callBackUrl.
```

### 原因

部分音乐生成 API 创建任务时要求传入公开可访问的回调地址。即使产品主流程采用轮询：

```text
/api/generate/audio/status
```

provider 创建任务时仍可能强制要求：

```json
{
  "callBackUrl": "https://your-domain.com/api/webhooks/kie"
}
```

如果没有传 `callBackUrl`，任务不会被创建。

### 解决办法

新增 webhook endpoint 用于接收 provider 回调，并在生成请求中传入 HTTPS 回调地址。

环境变量：

```env
BASE_URL=https://calyra-ai-dev.vercel.app
KIE_CALLBACK_URL=https://calyra-ai-dev.vercel.app/api/webhooks/kie
```

代码逻辑：

```ts
callBackUrl:
  process.env.KIE_CALLBACK_URL ??
  `${(process.env.BASE_URL ?? "").replace(/\/$/, "")}/api/webhooks/kie`
```

并在请求体中传入：

```ts
body: JSON.stringify({
  prompt,
  style,
  title,
  callBackUrl,
  customMode: true,
  instrumental,
  model,
})
```

注意：

```text
callBackUrl 必须是公网可访问的 HTTPS URL。
localhost、本地 IP、未开放的 preview URL 都可能导致 provider 拒绝或回调失败。
```

经验总结：

```text
即使主流程用轮询，也要满足第三方 API 的回调参数要求。
Webhook 可以先只记录 taskId/status 并返回 200，后续再扩展为真正的异步状态处理。
```
