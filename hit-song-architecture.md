# Hit-Song Architecture Document v1.0

**基于 PRD v1.0 | 2026年5月**

---

## 一、技术决策总表

| 决策项    | 选型                                            | 理由                                    |
| --------- | ----------------------------------------------- | --------------------------------------- |
| 框架      | Next.js 15 (App Router)                         | 已有代码基础，SSR/SSG + API Routes 一体 |
| 数据库    | Supabase (Postgres + Auth + Storage + Realtime) | 已集成，RLS + Edge Functions            |
| 支付      | Creem.io                                        | 已集成，支持订阅 + 一次性积分包         |
| 音频生成  | kie.ai Suno API (主力) + provider 抽象层        | 已确认，预留 ACE-Step 降级切换          |
| 歌词/评判 | Claude API (Anthropic SDK)                      | 歌词生成 + 歌词评判 + 综合报告          |
| 封面图    | Pollinations.ai → Supabase Storage 缓存         | 首次生成后存 Storage，后续用缓存 URL    |
| i18n      | next-intl                                       | 已确认，支持 RSC + App Router           |
| 邮件      | Resend + React Email                            | Vercel 生态，3000封/月免费              |
| 部署      | Vercel 单项目双环境                             | preview (PR 自动) + production          |
| 包管理    | pnpm                                            | 已有                                    |
| UI        | shadcn/ui + Tailwind CSS + Framer Motion        | 已有                                    |
| OG图      | Satori (服务端) + html2canvas (客户端保存)      | Vercel 出品，双方案互补                 |

---

## 二、系统架构总览

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Middleware│→ │ next-intl│→ │   Next.js App Router     │  │
│  │(auth+i18n)│  │ routing  │  │                          │  │
│  └──────────┘  └──────────┘  │  /[locale]/create         │  │
│                               │  /[locale]/song/[id]      │  │
│                               │  /[locale]/dashboard      │  │
│                               │  /[locale]/pricing        │  │
│                               │  /api/generate/*          │  │
│                               │  /api/webhooks/*          │  │
│                               └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │ Supabase │  │ kie.ai   │  │ Claude   │
   │ DB+Auth  │  │ Suno API │  │ API      │
   │ +Storage │  │          │  │          │
   └──────────┘  └──────────┘  └──────────┘
          │                         │
          ▼                         ▼
   ┌──────────┐              ┌──────────┐
   │ Creem.io │              │Pollinations│
   │ Payments │              │ Cover Gen  │
   └──────────┘              └──────────┘
          │
          ▼
   ┌──────────┐
   │ Resend   │
   │ Email    │
   └──────────┘
```

---

## 三、目录结构设计

在现有 simple_saas 基础上演进，不做大范围重组：

```
simple_saas/
├── app/
│   ├── [locale]/                    # next-intl locale routing
│   │   ├── layout.tsx               # Root layout (providers, header, footer)
│   │   ├── page.tsx                 # Landing page
│   │   ├── (auth-pages)/
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── create/
│   │   │   └── page.tsx             # 核心：歌词输入 → 生成流程
│   │   ├── song/
│   │   │   └── [id]/
│   │   │       └── page.tsx         # 歌曲公开页 (SEO落地页)
│   │   ├── report/
│   │   │   └── [id]/
│   │   │       └── page.tsx         # 评判报告页
│   │   ├── dashboard/
│   │   │   ├── page.tsx             # 个人主页 (歌曲列表 + 成就)
│   │   │   └── reset-password/page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx             # 订阅套餐
│   │   ├── about/page.tsx
│   │   ├── privacy/page.tsx
│   │   └── terms/page.tsx
│   ├── api/
│   │   ├── generate/
│   │   │   ├── lyrics/route.ts      # 歌词生成 (Claude API)
│   │   │   ├── audio/route.ts       # 音频生成 (kie.ai)
│   │   │   └── audio/status/route.ts # 音频生成轮询
│   │   ├── judge/
│   │   │   └── report/route.ts      # 歌词评判 + 综合报告 (Claude API)
│   │   ├── song/
│   │   │   ├── route.ts             # CRUD 歌曲
│   │   │   └── [id]/
│   │   │       ├── route.ts         # 单首歌曲详情
│   │   │       └── count/route.ts   # 播放/分享计数 (RPC increment)
│   │   ├── share/
│   │   │   └── og/route.ts          # Satori OG图生成
│   │   ├── credits/route.ts         # 现有：积分查询/消费
│   │   ├── creem/                   # 现有：支付相关
│   │   │   ├── create-checkout/route.ts
│   │   │   └── customer-portal/route.ts
│   │   └── webhooks/
│   │       └── creem/route.ts       # 现有：支付回调
│   ├── auth/
│   │   └── callback/route.ts        # 现有：OAuth callback
│   ├── globals.css
│   └── favicon.ico
├── components/
│   ├── ui/                          # 现有：shadcn/ui 组件
│   ├── header.tsx                   # 改造：加 locale switcher + 积分显示
│   ├── footer.tsx
│   ├── logo.tsx                     # 改造：Hit-Song 品牌
│   ├── pricing-section.tsx          # 改造：PRD 定价
│   ├── create/
│   │   ├── story-input.tsx          # 故事输入框
│   │   ├── lyrics-editor.tsx        # 歌词编辑器
│   │   ├── audio-player.tsx         # 音频播放器 (双首选择)
│   │   ├── generation-status.tsx    # 生成状态动画
│   │   └── style-indicator.tsx      # 风格标签显示
│   ├── song/
│   │   ├── song-card.tsx            # 歌曲卡片 (列表用)
│   │   ├── song-player.tsx          # 歌曲播放页播放器
│   │   └── lyrics-display.tsx       # 歌词展示 (高亮)
│   ├── report/
│   │   ├── score-display.tsx        # 分数展示 (雷达图/进度条)
│   │   ├── producer-comment.tsx     # 制作人评语
│   │   └── share-card.tsx           # 分享卡片
│   ├── dashboard/
│   │   ├── stats-overview.tsx       # 数据总览
│   │   ├── song-list.tsx            # 歌曲列表
│   │   ├── achievements.tsx         # 成就系统
│   │   ├── credits-balance-card.tsx # 现有：改造
│   │   └── subscription-status-card.tsx  # 现有：改造
│   └── shared/
│       ├── credits-badge.tsx        # 导航栏积分徽标
│       ├── locale-switcher.tsx      # 语言切换
│       └── auth-guard.tsx           # 登录守卫组件
├── config/
│   ├── subscriptions.ts             # 改造：PRD 定价方案
│   ├── styles.ts                    # 风格映射表 (emotion → genre/bpm/instruments)
│   ├── achievements.ts              # 成就定义
│   └── i18n.ts                      # next-intl 配置
├── hooks/
│   ├── use-credits.ts               # 现有
│   ├── use-subscription.ts          # 现有
│   ├── use-user.ts                  # 现有
│   ├── use-toast.ts                 # 现有
│   ├── use-generation.ts            # 新增：歌曲生成流程状态管理
│   └── use-player.ts               # 新增：音频播放状态
├── lib/
│   ├── creem.ts                     # 现有
│   ├── utils.ts                     # 现有
│   ├── ai/
│   │   ├── claude.ts                # Claude API 客户端封装
│   │   └── prompts.ts               # 所有 prompt 模板集中管理
│   ├── audio/
│   │   ├── types.ts                 # AudioProvider 接口定义
│   │   ├── kie-provider.ts          # kie.ai Suno API 实现
│   │   └── index.ts                 # Provider 入口 (切引擎只改这里)
│   └── resend.ts                    # Resend 邮件客户端
├── messages/                        # next-intl 翻译文件
│   ├── en.json
│   ├── es.json
│   ├── pt.json
│   ├── ja.json
│   └── ko.json
├── types/
│   ├── creem.ts                     # 现有
│   ├── subscriptions.ts             # 现有
│   ├── song.ts                      # 歌曲相关类型
│   └── judge.ts                     # 评判相关类型
├── utils/
│   ├── utils.ts                     # 现有
│   └── supabase/                    # 现有
│       ├── client.ts
│       ├── server.ts
│       ├── middleware.ts            # 改造：加 i18n 路由
│       ├── service-role.ts
│       └── subscriptions.ts         # 现有
├── supabase/
│   └── migrations/
│       ├── 20250101000000_init_schema.sql  # 现有
│       └── 20260501000000_hit_song.sql     # 新增：Hit-Song 表结构
├── emails/                          # React Email 邮件模板
│   ├── data-report.tsx
│   ├── wake-up.tsx
│   ├── quota-exhausted.tsx
│   ├── storage-expiry.tsx
│   └── milestone.tsx
└── middleware.ts                     # 入口：auth + i18n routing
```

---

## 四、数据库设计

### 4.1 现有表（保留 + 微调）

**customers** — 保留，初始积分 3
**credits_history** — 保留不动
**subscriptions** — 保留不动
**credits 字段说明：**
PRD 中定义的独立 credits 表已合并入现有 customers 表。
字段对应关系：
PRD credits.credits_balance → customers.credits_balance
PRD credits.credits_used → customers.credits_used
freeze_credit / unfreeze_credit RPC 均操作 customers 表，不另建 credits 表。

### 4.2 新增表

```sql
-- 歌曲表
create table public.songs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  lyrics        text not null,
  user_input    text not null,             -- 用户原始输入
  audio_url     text,                       -- Supabase Storage 路径
  audio_url_alt text,                       -- 第二首备选
  selected_audio text default 'primary'     -- 用户选中的音频: 'primary'=audio_url, 'alt'=audio_url_alt
    check (selected_audio in ('primary', 'alt')),
  cover_url     text,                       -- Pollinations 生成的封面
  lyrics_regen_count integer default 0,     -- 歌词重新生成次数 (上限3次，后端校验)
  style_key     text not null,              -- heartbreak/joy/nostalgia/empowerment/chill
  style_params  jsonb not null default '{}',-- genre/bpm/instruments/vocals/mood
  style_tags    text[] default '{}',        -- 展示用标签
  locale        text not null default 'en', -- 歌词语言
  status        text not null default 'draft'
    check (status in ('draft', 'generating', 'ready', 'failed')),
  is_public     boolean default true,
  total_score   integer,                    -- 综合评分 (评判后写入)
  report_data   jsonb,                      -- 完整评判报告 JSON
  kie_task_id   text,                       -- kie.ai 异步任务ID
  play_count    integer default 0,          -- 播放数 (RPC 原子更新)
  share_count   integer default 0,          -- 分享数 (RPC 原子更新)
  like_count    integer default 0,          -- 点赞次数 (RPC 原子更新)
  expires_at    timestamptz,                -- 免费用户30天后过期
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- 成就表
create table public.achievements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  achievement  text not null,               -- 成就标识: first_song, songs_3, plays_50...
  unlocked_at  timestamptz default now(),
  unique(user_id, achievement)
);

-- 邮件发送记录 (频率控制)
create table public.email_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  email_type text not null,                 -- data_report/wake_up/quota/storage/milestone
  sent_at    timestamptz default now()
);

-- 索引
create index songs_user_id_idx on public.songs(user_id);
create index songs_status_idx on public.songs(status);
create index songs_is_public_idx on public.songs(is_public) where is_public = true;
create index songs_created_at_idx on public.songs(created_at desc);
create index achievements_user_id_idx on public.achievements(user_id);
create index email_log_user_id_idx on public.email_log(user_id);
create index email_log_sent_at_idx on public.email_log(sent_at);

-- 播放/分享计数 RPC（替代 play_events 表，直接原子更新 songs 计数）
create or replace function public.increment_song_counter(
  p_song_id uuid,
  p_counter text -- 'play_count' 或 'share_count' 或 'like_count' 
)
returns void as $$
begin
  if p_counter = 'play_count' then
    update public.songs
    set play_count = play_count + 1, updated_at = now()
    where id = p_song_id;
  elsif p_counter = 'share_count' then
    update public.songs
    set share_count = share_count + 1, updated_at = now()
    where id = p_song_id;
  elsif p_counter = 'like_count' then
    update public.songs
    set like_count = like_count + 1, updated_at = now()
    where id = p_song_id;
  end if;
end;
$$ language plpgsql security definer;

-- RLS
alter table public.songs enable row level security;
alter table public.achievements enable row level security;
alter table public.email_log enable row level security;

-- Songs: 作者读写 + 公开歌曲任何人可读
create policy "Users can manage own songs"
  on public.songs for all using (auth.uid() = user_id);

create policy "Public songs are viewable by anyone"
  on public.songs for select using (is_public = true);

-- Achievements: 用户只读自己的
create policy "Users can view own achievements"
  on public.achievements for select using (auth.uid() = user_id);

create policy "Service role manages achievements"
  on public.achievements for all using (auth.role() = 'service_role');

-- Email log: 仅 service role
create policy "Service role manages email log"
  on public.email_log for all using (auth.role() = 'service_role');

-- Grants
grant all on public.songs to service_role;
grant all on public.achievements to service_role;
grant all on public.email_log to service_role;
```

### 4.3 ER 关系

```
auth.users (Supabase 内置)
  │
  ├── 1:1 ── customers (积分 + Creem客户)
  │             └── 1:N ── subscriptions
  │             └── 1:N ── credits_history
  │
  ├── 1:N ── songs (含 play_count/share_count 计数)
  │
  ├── 1:N ── achievements
  └── 1:N ── email_log
```

---

## 五、核心流程设计

### 5.1 歌曲生成主流程

```
用户输入故事 (≤200字)
       │
       ▼
[POST /api/generate/lyrics]
  1. auth 校验
  2. 积分检查 (≥1)
  3. 若为重新生成 (请求含 songId)：
     - 查询 songs.lyrics_regen_count
     - ≥ 3 → 返回 429, 前端提示"最多重新生成3次"
     - < 3 → lyrics_regen_count + 1, 继续生成
  4. Claude API: 分析输入 → 提取 emotion/theme/scene
  5. 匹配 styleMap → 确定风格参数
  6. Claude API: 组装 prompt → 生成歌词
  7. 创建/更新 song 记录 (status: 'draft')
  8. 返回 { songId, lyrics, style }
       │
       ▼
用户编辑歌词 (可重新生成，不扣积分，最多3次)
       │
       ▼
[POST /api/generate/audio]
  1. 扣100积分 (成功后扣 → 失败不扣)
  2. 调 kie.ai Suno API × 2首
  3. 更新 song.status = 'generating'
  4. 返回 { taskId }
       │
       ▼
[GET /api/generate/audio/status?taskId=xxx]
  前端轮询 (3秒间隔)
  完成后：
  1. 下载音频 → 存入 Supabase Storage
  2. 生成封面图 URL (Pollinations)
  3. 更新 song (audio_url, audio_url_alt, cover_url, status: 'ready')
  4. 返回音频 URL
       │
       ▼
用户选择一首 → 点击"查看评判报告"
       │
       ▼
[POST /api/song/{id}/select]
  1. auth 校验
  2. 更新 songs.selected_audio = 'primary' 或 'alt'
  3. 返回 200
       │
       ▼
[POST /api/judge/report]
  2. Claude API: 歌词评判 → lyrics_score
  3. Claude API: 整合评分数据 → 综合报告
  4. 更新 song.report_data + total_score
  5. 检查成就解锁
  6. 返回完整报告
```

### 5.2 积分消费时序（防重复提交 + 防失扣）

```
前端: 点击"生成音乐"
  │
  ▼
前端: lodash/debounce 防抖 (2秒)
  │  ⚠️ 需手动安装: pnpm add lodash-es && pnpm add -D @types/lodash-es
  │  按需引入: import { debounce } from 'lodash-es/debounce'
  │
  ▼
API: deduct_credit_if_sufficient(userId, 1) — 原子操作，检查+预扣合一步
  │ 余额不足 → 返回 402, 前端弹充值
  │ 预扣成功 ↓
  ▼
API: 调用 kie.ai Suno API
  │ 失败 → refund_credit(userId, 1), 返回 500
  │ 成功 ↓
  ▼
返回 200 + taskId
```

```sql
-- 冻结积分（原子扣减）
-- 成功返回 { enough: true, balance: 新余额 }
-- 余额不足返回 { enough: false }
create or replace function public.freeze_credit(
  p_user_id uuid,
  p_amount integer default 100
)
returns json as $$
declare
  v_new_balance integer;
begin
  update public.customers
  set
    credits_balance = credits_balance - p_amount,
    credits_used = credits_used + p_amount,
    updated_at = now()
  where user_id = p_user_id
    and credits_balance >= p_amount
  returning credits_balance into v_new_balance;

  if found then
    return json_build_object('enough', true, 'balance', v_new_balance);
  else
    return json_build_object('enough', false);
  end if;
end;
$$ language plpgsql security definer;

-- 退回冻结的积分（API 失败时调用）
create or replace function public.unfreeze_credit(
  p_user_id uuid,
  p_amount integer default 1
)
returns void as $$
begin
  update public.customers
  set
    credits_balance = credits_balance + p_amount,
    credits_used = greatest(credits_used - p_amount, 0),
    updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;
```

关键改动：

1. **前端防抖**：lodash-es debounce 2秒，防止快速双击
2. **后端原子操作**：`SELECT ... FOR UPDATE` 行级锁，检查余额和扣减在同一事务内完成，杜绝竞态
3. **失败退款**：API 调用失败后退回积分，而非"先调 API 再扣"（先扣后退比先查后扣更安全）

### 5.3 音频生成 Provider 抽象层

kie.ai 是第三方非官方 API，无 SLA 保障。封装 provider 接口，后续切 ACE-Step 或其他引擎时不动上层逻辑。

```typescript
// lib/audio/types.ts — Provider 接口定义
interface AudioProvider {
  generateSong(params: GenerateParams): Promise<{ taskId: string }>;
  getTaskStatus(taskId: string): Promise<TaskResult>;
}

interface GenerateParams {
  prompt: string; // 风格描述 prompt
  lyrics: string; // 完整歌词
  title: string;
  make_instrumental: boolean;
}

interface TaskResult {
  status: "processing" | "completed" | "failed";
  songs: Array<{
    id: string;
    audio_url: string;
    duration: number;
  }>;
}
```

```typescript
// lib/audio/kie-provider.ts — kie.ai Suno API 实现
import type { AudioProvider } from "./types";

const KIE_BASE_URL = process.env.KIE_API_BASE_URL;
const KIE_API_KEY = process.env.KIE_API_KEY;

export const kieProvider: AudioProvider = {
  async generateSong(params) {
    /* ... */
  },
  async getTaskStatus(taskId) {
    /* ... */
  },
};
```

```typescript
// lib/audio/index.ts — Provider 入口
import { kieProvider } from "./kie-provider";
// import { aceStepProvider } from './ace-step-provider'  // 后续接入

export const audioProvider = kieProvider;
```

上层代码统一调用 `audioProvider.generateSong()`，切引擎只改 `index.ts` 的导出。

### 5.4 i18n 路由设计

> **⚠️ 已知坑：** Supabase auth middleware 和 next-intl middleware 都会操作 response 对象（设 cookie / 重定向）。next-intl 返回的 response 会覆盖 Supabase 设置的 session cookies。实现时必须手动合并两个 response 的 cookies。参考 next-intl 官方 `with-other-middleware` 示例。

```typescript
// middleware.ts
import createMiddleware from "next-intl/middleware";
import { updateSession } from "@/utils/supabase/middleware";

const intlMiddleware = createMiddleware({
  locales: ["en", "es", "pt", "ja", "ko"],
  defaultLocale: "en",
  localePrefix: "as-needed", // 英语不带前缀, /es/create, /ja/create
});

export default async function middleware(request: NextRequest) {
  // 1. Supabase session 刷新 → 拿到 supabaseResponse
  const supabaseResponse = await updateSession(request);

  // 2. i18n 路由 → 拿到 intlResponse
  const intlResponse = intlMiddleware(request);

  // 3. 合并：把 Supabase 的 set-cookie 头复制到 intl response 上
  supabaseResponse.headers.getSetCookie().forEach((cookie) => {
    intlResponse.headers.append("set-cookie", cookie);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
```

URL 结构：

- 英语: `hit-song.ai/create`, `hit-song.ai/song/xxx`
- 西班牙语: `hit-song.ai/es/create`, `hit-song.ai/es/song/xxx`
- API 路由不走 i18n: `hit-song.ai/api/generate/lyrics`

### 5.5 邮件召回系统

```
Vercel Cron Job (每天 UTC 00:00)
  │
  ├── 3天数据播报
  │   查询 songs WHERE created_at = now() - 3 days
  │   读取 songs.play_count / share_count 统计
  │   检查 email_log 频率控制 (≤2封/周, 间隔≥48h)
  │   发送 Resend
  │
  ├── 7天未登录唤醒
  │   查询 customers WHERE last_login_at < now() - 7 days
  │   排除已发过唤醒邮件的
  │
  └── 音频存储到期提醒
      查询 songs WHERE expires_at BETWEEN now() AND now() + 7 days
      仅免费用户

实时触发 (在业务代码中调用):
  ├── 积分用完 → onQuotaExhausted()
  └── 里程碑达成 → onMilestoneReached()
```

Vercel cron 配置：

```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/daily-emails",
    "schedule": "0 0 * * *"
  }]
}
⚠️ Vercel 计划限制：
- Hobby plan：Cron Job 最小间隔 1次/天，最多 2 个 Cron Job
- 当前仅使用 1 个每日 Cron（/api/cron/daily-emails），符合 Hobby 限制
- 实时触发（积分用完、里程碑）走业务代码直接调用，不占 Cron 配额
- 升级到 Pro plan 后可增加频率（最小间隔 1次/分钟）
```

---

## 六、外部 API 对照表

| 服务             | 用途                | 调用时机                                | 预估成本                 |
| ---------------- | ------------------- | --------------------------------------- | ------------------------ |
| kie.ai Suno API  | 音频生成            | 用户点击"生成音乐"                      | ~$0.06/首 × 2 = $0.12/次 |
| Claude API       | 输入分析 + 歌词生成 | 创作流程第一步                          | ~$0.01/次                |
| Claude API       | 歌词评判 + 综合报告 | 评判报告                                | ~$0.02/次                |
| Pollinations.ai  | 封面图生成          | 音频完成后（首次生成，存 Storage 缓存） | 免费                     |
| Resend           | 邮件发送            | Cron + 实时触发                         | 3000封/月免费            |
| Creem.io         | 支付                | 用户充值/订阅                           | 交易手续费               |
| Supabase Storage | 音频文件存储        | 音频完成后                              | $0.021/GB                |

**单首歌全流程成本：~$0.09-0.10** (歌词$0.01 + 音频$0.06×2=$0.06 + 评判$0.02)

> 注：音频每次生成2首 $0.06/首，总计 $0.12 → 但 kie.ai 按任务计费实际约 $0.06/任务（含2首）。

---

## 七、环境变量规划

```env
# 现有 (保留)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=
BASE_URL=

# 新增
KIE_API_BASE_URL=           # kie.ai API 地址
KIE_API_KEY=                # kie.ai API 密钥
ANTHROPIC_API_KEY=          # Claude API
RESEND_API_KEY=             # Resend 邮件
NEXT_PUBLIC_DEFAULT_LOCALE=en
SKIP_CREDIT_CHECK=true      # dev/preview 环境跳过积分检查，production 不设此变量
```

---

## 八、性能与安全设计

### 8.1 Rate Limiting

```
/api/generate/lyrics  → 5次/分钟/用户 (防刷歌词)
/api/generate/audio   → 2次/分钟/用户 (有积分兜底但仍需限)
/api/judge/*          → 3次/分钟/用户
/api/song/*/play      → 30次/分钟/IP (播放记录)
```

实现方式：Vercel Edge Middleware + Upstash Redis（或先用内存 Map 做 MVP，量大后切 Redis）。

### 8.2 安全

- 所有 API 路由校验 Supabase session（除 webhook 和公开 song 页）
- Webhook 验证 Creem 签名
- 用户输入经 Claude 内容审核（prompt 中包含违规检测指令）
- 音频文件通过 Supabase Storage RLS 控制访问
- 敏感 key 仅在 server-side 使用，不暴露给客户端

### 8.3 SEO

- 每首公开歌曲 `/song/[id]` 是 SSR 页面，含完整歌词文本
- Satori 生成 OG 图，社交分享时展示封面 + 标题 + 评分
- `title` 按词簇优化（Cover/Hum/Lyrics 三种模板）
- sitemap.xml 动态生成，包含所有公开歌曲

---

## 九、开发阶段拆分

> **拆分原则：** 每个任务控制在 150K tokens 上下文窗口内可完成。每个任务包含完整上下文（架构文档 + 相关代码 + 指令）。

### Phase 1: 核心生成闭环 (MVP)

**目标：** 用户可以输入故事 → 生成歌词 → 生成音频 → 播放 → 公开歌曲页面可被 Google 索引

**SEO 第一原则：** 路由架构和页面结构优先满足 Google SEO 需求。

> **积分/定价后置：** Phase 1 不实现付费逻辑。积分扣减接口保留抽象，但暂时给每个用户无限积分用于测试生成闭环。定价/套餐/积分包等竞品调研完成后再设计。

#### Task 1: 项目基础改造 (~100K tokens)

- CLAUDE.md 生成（项目规范文档）
- 品牌改造：Logo → Hit-Song，Landing page 改造
- next-intl 接入（仅 en，路由结构 `/[locale]/...`）
- Middleware 改造（auth + i18n）
- 数据库 migration：新增 songs 表 + RPC 函数（increment_song_counter / deduct_credit_if_sufficient）
- migration 完成后执行：给所有现有用户设置 credits_balance = 9999（仅开发环境）
- 新增环境变量 SKIP_CREDIT_CHECK=true（dev/preview 环境）
- /api/generate/audio 积分检查逻辑：
  if (process.env.SKIP_CREDIT_CHECK === 'true') {
  // 跳过积分检查，直接进入生成流程
  }
- 基础类型定义（song.ts / judge.ts）
- 验证：`pnpm build` 通过，所有现有页面正常

#### Task 2: 歌词生成模块 (~120K tokens)

- Claude API 客户端封装 (`lib/ai/claude.ts`)
- Prompt 模板集中管理 (`lib/ai/prompts.ts`)
- 风格映射表 (`config/styles.ts`)
- API Route: `POST /api/generate/lyrics`
  - 输入分析 → emotion/theme 提取
  - 风格匹配 → style params
  - 歌词生成 → 结构化歌词
  - 创建 song 记录 (status: draft)
  - 重新生成校验：后端检查 lyrics_regen_count ≥ 3 则拒绝，< 3 则 +1 后继续
- 前端：`/create` 页面
  - 故事输入组件 (`components/create/story-input.tsx`)
  - 歌词编辑器 (`components/create/lyrics-editor.tsx`)
  - 重新生成按钮（调后端 API，由后端控制次数上限）
- 验证：输入故事 → 看到生成的歌词 → 可编辑

#### Task 3a: 音频生成后端 (~100K tokens)

- 音频 Provider 抽象层 (`lib/audio/types.ts` + `lib/audio/kie-provider.ts` + `lib/audio/index.ts`)
- API Route: `POST /api/generate/audio` + `GET /api/generate/audio/status`
- API Route: `POST /api/song/[id]/select` — 用户选择音频，更新 selected_audio 字段
- Supabase Storage 音频上传
- Pollinations 封面图生成 → 下载 → 存 Storage → 写入 `songs.cover_url`
- 验证：用 curl/Postman 调接口，确认 song 记录状态从 generating → ready，audio_url 和 cover_url 有值

#### Task 3b: 音频生成前端 (~80K tokens)

- 生成状态动画 (`components/create/generation-status.tsx`)
  - 根据 elapsed time 展示文案（0-8s/8-16s/...）
- 双首音频播放器 (`components/create/audio-player.tsx`)
  - 两首并排，可切换试听，选中高亮
- `/create` 页面接入完整音频流程
  - 调 `POST /api/generate/audio` → 拿 taskId
  - 轮询 `GET /api/generate/audio/status` (3s 间隔, 120s 超时)
  - 超时后提示"稍后在 Dashboard 查看"
  - 选择音频后调 `POST /api/song/[id]/select`
- 验证：确认歌词 → 等待生成动画 → 听到两首歌 → 选择一首

#### Task 4: 歌曲公开页 + SEO 基础 (~100K tokens)

- `/song/[id]` SSR 页面（SEO 落地页）
  - 音频播放器 (`components/song/song-player.tsx`)
  - 歌词全文展示 (`components/song/lyrics-display.tsx`，语义化 HTML）
      歌词同步高亮实现方案：
        Step 1：联调时检查 kie.ai 任务结果中是否含 timestamps 字段
        - 有 → 把时间戳数组存入 songs.report_data.timestamps
        - 无 → 用降级方案，不存时间戳

        Step 2（有时间戳）：
        audio.ontimeupdate → 对比当前 currentTime 与时间戳数组
        → 找到对应段落 index → 设置 activeSection state → CSS 高亮

        Step 3（降级，无时间戳）：
        均分方案：activeSectionIndex = Math.floor(currentTime / sectionDuration)
        其中 sectionDuration = audio.duration / sections.length
        段落切换加 CSS transition: 0.3s ease

        前端实现：
        用 useRef 存 audio element，useEffect 绑定 timeupdate 事件
        每次触发检查 activeSection 是否需要更新（避免频繁 setState）
        高亮段落自动 scrollIntoView({ behavior: 'smooth', block: 'center' })

- 结构化数据 (MusicRecording JSON-LD schema)
- SEO meta：动态 title/description/OG tags
- CTA 按钮："做你自己的歌 →"
- 播放/分享计数 API (`POST /api/song/[id]/count`，调用 increment_song_counter RPC)
- Dashboard 改造：歌曲列表 (`components/dashboard/song-list.tsx`)
- 动态 sitemap.xml（包含所有公开歌曲）
- 验证：公开页面可访问，查看页面源码确认歌词文本在 HTML 中，结构化数据正确

### Phase 2: 评判 + 情绪价值

5. 歌词评判 (Claude API，纯文本分析)，100个积分评判一次
6. 综合报告页
7. 分享卡片 (html2canvas + Satori OG)
8. 成就系统

### Phase 3: 召回 + 多语言

9. 邮件系统 (Resend + Cron)
10. 多语言翻译 (es/pt/ja/ko)
11. SEO 深度优化 (hreflang/structured data/词簇优化)

### Phase 4: 商业化 + 增长

12. 积分定价设计（竞品调研后）
13. 订阅套餐实现
14. 播放统计 + 排行
15. 百分比排名 (1000用户后)

---

## 十、PRD 架构补充点

以下是 PRD 未覆盖但架构必须考虑的：

### 10.1 音频生成的异步模型

kie.ai Suno API 是异步的，不能同步等待。设计：

- 前端调 `/api/generate/audio` → 返回 `taskId`
- 前端每 3 秒轮询 `/api/generate/audio/status?taskId=xxx`
- 状态文案由前端根据 elapsed time 展示（PRD 的 0-8s/8-16s/...）
- 超时 120 秒后停止轮询，提示用户稍后在 Dashboard 查看

**演进计划：** Phase 1 用轮询（3s 间隔 × 40 次 = 120s 超时）。当并发用户增多时（50+ 同时生成），轮询请求量 = 用户数 × 每秒 0.33 次，会给 Vercel serverless 造成压力。后续切换为 Supabase Realtime 订阅 `songs.status` 字段变更，前端监听 Postgres changes 事件，零轮询。Supabase 已集成，无额外成本。

### 10.2 双首音频存储策略

生成 2 首，用户选 1 首：

- 两首都存 Supabase Storage
- 未选中的那首存 `audio_url_alt`，保留 7 天
- 7 天后 Cron Job 删除未选中的音频文件 + 清空 `audio_url_alt`

### 10.3 免费用户存储清理

- `songs.expires_at = created_at + 30 days`（仅 free plan 用户）
- 升级后 `expires_at` 置 null（永久）
- Cron Job 每天检查：`expires_at < now()` 的歌曲 → 删 Storage 文件 → 更新 status = 'expired'
- 到期前 7 天触发邮件提醒

### 10.4 Content Moderation

用户输入在发给 Claude 生成歌词前，加一个审核 prompt：

```
在 analyzeInput 的 prompt 中加入：
"如果内容包含仇恨、暴力、色情、歧视等违规内容，返回 { flagged: true, reason: '...' }"
```

违规时前端提示 "这个故事我没办法写，换一个？"，不消耗任何 API 调用。

### 10.5 封面图缓存策略

Pollinations.ai 是免费服务，无 SLA，每次访问 URL 都是实时生成。同一张封面在歌曲页、卡片、列表、OG 图中被引用多次会产生多次实时生成请求。

**Phase 1 实现：** 音频生成完成后，服务端请求 Pollinations URL → 下载图片 → 存入 Supabase Storage → 把 Storage URL 写入 `songs.cover_url`。后续所有场景（页面、OG 图、分享卡片）统一用 Storage URL。单张图 <500KB，存储成本可忽略。

### 10.6 音频生成 Provider 降级

kie.ai 是第三方非官方 Suno API，稳定性未知。`lib/audio/` 封装了 provider 抽象层（见 5.3），上层代码不直接依赖 kie.ai。

**降级策略：**

- kie.ai 返回 5xx 或超时 → 自动重试 1 次
- 连续失败 3 次 → 记录告警日志，返回用户"生成服务繁忙，请稍后重试"
- 后续接入 ACE-Step 作为备选引擎，只需新增 `ace-step-provider.ts` 并改 `lib/audio/index.ts` 导出

---

_Hit-Song Architecture v1.0 — 2026年5月_
