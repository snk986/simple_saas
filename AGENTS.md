# Hit-Song Project

## 项目背景
Hit-Song 是一个 AI 音乐创作平台，用户输入情绪/故事，生成歌词 + 音频 + 评判报告。
核心流程：输入故事 → 歌词生成（Claude）→ 音频生成（kie.ai Suno）→ 评判报告（Claude）→ 分享卡片

## 技术栈
- Next.js 15 App Router + TypeScript
- Supabase (Postgres + Auth + Storage)
- Creem.io 支付
- next-intl 国际化 (en/es/pt/ja/ko)
- shadcn/ui + Tailwind CSS + Framer Motion
- pnpm 包管理

## 目录约定
- `app/[locale]/` — 所有页面路由（i18n）
- `app/api/` — API Routes（不走 i18n）
- `lib/ai/` — Claude API 封装
- `lib/audio/` — 音频 Provider 抽象层
- `messages/` — next-intl 翻译文件
- `types/` — 全局类型定义
- `config/` — 静态配置（风格映射、成就、订阅）

## 命名约定
- 组件文件：kebab-case（`song-card.tsx`）
- 类型文件：kebab-case（`song.ts`）
- 环境变量：`SCREAMING_SNAKE_CASE`

## 验证命令
```bash
pnpm build
```

## 关键约束
- 所有 API 路由必须校验 Supabase session（除 webhook 和公开 song 页）
- 积分检查：`if (process.env.SKIP_CREDIT_CHECK === 'true')` 跳过（dev/preview）
- 敏感 key 仅 server-side 使用，不暴露客户端
- Supabase middleware 和 next-intl middleware 的 cookie 必须手动合并

## 清理规则
- 不写无用注释，不留 TODO 在代码里
- 不引入未在架构文档中确认的新依赖

## 数据库操作约定
- 浏览器组件：使用 `utils/supabase/client.ts`
- API Routes / Server Components：使用 `utils/supabase/server.ts`
- 需要绕过 RLS 的后台操作（Cron、Webhook）：使用 `utils/supabase/service-role.ts`
- 禁止在客户端使用 service role key
- 积分相关操作必须走 RPC 函数（freeze_credit / unfreeze_credit），禁止直接 UPDATE credits_balance

## 错误处理约定
- API Route 统一返回格式：`{ error: string }` + 对应 HTTP 状态码
- 积分不足返回 402，未登录返回 401，参数错误返回 400
- 外部 API（kie.ai / Claude）失败最多自动重试 1 次，仍失败才返回错误
- 不在客户端 console.log 敏感信息

## 外部 API 调用约定
- Claude API / kie.ai / Resend 只能在 server-side 调用（API Routes 或 Server Actions）
- Pollinations.ai 封面图：首次生成后下载存入 Supabase Storage，后续用 Storage URL
- 音频 Provider 统一走 `lib/audio/index.ts`，禁止直接引用 `kie-provider.ts`

## i18n 约定
- Server Component 用 `getTranslations()`，Client Component 用 `useTranslations()`
- 硬编码中文字符串只允许出现在 `messages/` 翻译文件中，其他地方必须用 t('key')
- URL 结构：英语不带前缀（`/create`），其他语言带前缀（`/es/create`）