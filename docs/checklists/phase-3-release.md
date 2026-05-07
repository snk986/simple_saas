# Phase 3 发布门禁

日期：2026-05-07

## 构建

- [x] `pnpm build`
  - 结果：通过
  - 备注：Next.js 编译和类型检查成功。
  - 已知警告：`creem_io` 包已弃用，该问题早于 Phase 3 召回工作。

## Locale URL

基于本地服务器 `http://localhost:3000` 的自动化 HTTP 检查：

- [x] `/` 返回 200
- [x] `/es` 返回 200
- [x] `/pt` 返回 200
- [x] `/ja` 返回 200
- [x] `/ko` 返回 200
- [x] `/create` 返回 200
- [x] `/es/create` 返回 200

## 认证 Cookie 与重定向

自动化未认证重定向检查：

- [x] `/dashboard` 返回 307 跳转至 `/sign-in?redirectTo=%2Fdashboard`
- [x] `/es/dashboard` 返回 307 跳转至 `/es/sign-in?redirectTo=%2Fes%2Fdashboard`
- [x] `/es/report/{id}?utm_source=email&utm_medium=recall&utm_campaign=ready_no_report` 返回 307 跳转至 `/es/sign-in`，原始召回参数保留在 `redirectTo` 中

需要在浏览器中手动验证的登录态检查：

- [ ] 登录后刷新 `/dashboard`，确认 session 保持活跃
- [ ] 登录后刷新 `/es/dashboard`，确认 session 保持活跃
- [ ] 未登录时点击召回链接，登录后确认原始召回路径恢复

## SEO

自动化检查：

- [x] `/robots.txt` 返回 200
- [x] `/robots.txt` 禁止索引 `/api/`、`/dashboard`、`/*/dashboard`、`/report` 和 `/*/report`
- [x] `/robots.txt` 指向 `/sitemap.xml`
- [x] `/sitemap.xml` 返回 200
- [x] `/sitemap.xml` 包含 `en/es/pt/ja/ko` 的首页 URL
- [x] `/sitemap.xml` 包含 locale create URL，包括 `/create` 和 `/es/create`
- [x] `/es` 源码包含 canonical 和 alternate link 元数据
- [x] 私有报告在 `app/[locale]/report/[id]/page.tsx` 中设置了 `robots.index=false` 和 `robots.follow=false`

需要使用真实公开歌曲数据手动验证的 SEO 检查：

- [ ] 确认真实 `/song/{id}` 有本地化 title、description、canonical、hreflang alternates 和 JSON-LD
- [ ] 确认真实 `/es/song/{id}` 有本地化元数据和公开内容

## 召回

自动化检查：

- [x] `/api/cron/recall` 不带 secret 返回 401
- [x] `/api/cron/recall?secret=wrong&scenario=ready_no_report` 返回 401
- [x] `app/api/cron/recall/route.ts` 校验 `CRON_SECRET`
- [x] `lib/recall/eligibility.ts` 执行 7 天同用户同类型频控
- [x] `lib/recall/eligibility.ts` 每次 cron 运行上限 100 个可发送候选
- [x] 发送成功后写入 `email_log`，包含 `song_id`、`email_type`、`status` 和 `metadata`
- [x] 单用户发送失败递增 `failed` 计数，不阻断整批

需要环境数据支持的手动召回检查：

- [ ] 使用真实 Supabase 数据和有效 `CRON_SECRET` 运行每个召回场景
- [ ] 确认 `email_log` 在目标 Supabase 项目中成功写入
- [ ] 确认 7 天内不会向同一用户重复发送同类型邮件
- [ ] 使用有效 `RESEND_API_KEY` 确认 Resend 投递成功

## 安全

自动化检查：

- [x] `.next/static` 不包含 `SUPABASE_SERVICE_ROLE_KEY`
- [x] `.next/static` 不包含 `ANTHROPIC_API_KEY` 或 `CLAUDE_API_KEY`
- [x] `.next/static` 不包含 `KIE_API_KEY`
- [x] `.next/static` 不包含 `RESEND_API_KEY`
- [x] `.next/static` 不包含 `CRON_SECRET`
- [x] 敏感 Provider key 仅在服务端模块或路由处理器中引用
- [x] `/api/song/[id]/count` 仅接受 zod schema 中的事件白名单

建议手动验证的安全检查：

- [ ] 检查部署后的浏览器 bundle 中是否包含实际密钥值（不仅是密钥名称）
- [ ] 确认生产环境变量在托管平台中作用域配置正确
