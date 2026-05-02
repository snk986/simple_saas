# Hit-Song PRD
## 产品需求文档 v1.0

**产品名称：** Hit-Song  
**域名：** hit-song.ai  
**技术栈：** Next.js + Supabase + Vercel + Creem.io  
**文档版本：** 2026年5月  

---

## 产品定位

**一句话定位：** 让素人用AI做出有灵魂的歌，并且感受到被认可。

**核心用户：** 有表达欲但没有音乐技能的普通人

**核心价值：** 生成 + 评判 + 情绪价值闭环

**用户旅程：**
```
发现平台 → 输入情绪/故事 → 生成歌词
→ 确认/修改 → 生成音频 → 即时评判报告
→ 发布/分享 → 3天后邮件召回
```

---

## 疑问点汇总🔖

```
疑问点4：点赞数影响评分权重（模块四，更后期）
疑问点5：Satori vs html2canvas选型（模块五）
疑问点6：用户上传照片生成口型MV（模块五，后期）
疑问点7：成就系统全屏动效技术方案（模块八）
疑问点8：优先生成排队机制（模块九，有排队问题后启用）
```

---

## 模块一：积分系统

### 积分规则

**初始积分**
```
用户注册成功 → 自动发放3积分
```

**消耗规则**
```
生成一首歌（含歌词+音频）→ 扣100积分
评判报告 → 扣100积分
使用技能包，→ 扣100积分
```


**定价逻辑**
```
Suno成本：$0.06/首 × 2首 = $0.12（每次生成2首，待确认kie.ai按任务还是按首计费）
Claude成本：约$0.01（歌词生成）+ $0.02（评判报告）= $0.03/首
歌词重新生成：按平均1.5次重新生成估算，额外 $0.005
总成本：约$0.15-0.16/首（保守估算）
定价：$0.19-0.29/首
毛利率：约45-55%（基于保守成本）

注意：kie.ai按任务计费（含2首）实际可能为$0.06/任务，
如果确认则总成本降至$0.09-0.10/首，毛利率回到60-70%
```

### 积分系统技术实现

**Supabase表结构**
```sql
user_id
credits_balance   -- 当前余额
credits_used      -- 累计消耗
created_at
updated_at
```

**两个核心钩子（冻结-确认模式，防并发）**
```typescript
// 钩子一：调用Suno API前冻结积分（原子操作）
// 用 UPDATE ... WHERE 保证并发安全：两个tab同时点生成，只有一个能冻结成功
async function freezeCredit(userId: string) {
  const { data, error } = await supabase.rpc('freeze_credit', {
    p_user_id: userId,
    p_amount: 1
  })
  // SQL: UPDATE credits SET credits_balance = credits_balance - 1
  //      WHERE user_id = p_user_id AND credits_balance >= p_amount
  //      RETURNING credits_balance
  // 受影响行数为0 → 积分不足
  if (error || !data) {
    return { enough: false }
  }
  return { enough: true }
}

// 钩子二：API失败时退回冻结的积分
async function unfreezeCredit(userId: string) {
  await supabase.rpc('unfreeze_credit', {
    p_user_id: userId,
    p_amount: 1
  })
}

// 无需"确认扣除"步骤——冻结即扣除，失败才退回
```

**扣积分时机（冻结-退回模式）**
```
调用Suno API前 → 先冻结1积分（原子操作，防并发）
API生成成功   → 积分已扣，无需额外操作
API生成失败   → 退回冻结的积分，用户无损失
并发防护：两个请求同时冻结，只有积分足够的那个能成功
```

### 积分相关页面

**积分显示**
```
导航栏右上角常驻显示：⚡ 3积分
点击跳转充值页
积分不足时变红色提示
```

**积分不足弹窗文案**
```
✓ 你还差一点积分，就能做下一首了
✓ 你的第一首歌有18人听完，继续做？
显示条件：
有历史歌曲 → 取最新一首歌的 play_count，展示数据版文案
无历史歌曲 → 展示默认文案："⚡ 再充一点，就能做你的第一首歌了"
```

### 异常处理

```
Suno API超时     → 退回冻结积分，提示重试，保留生成参数
Suno API失败     → 退回冻结积分，记录错误日志
Claude API失败   → 不涉及积分（歌词生成阶段不扣积分），评判报告显示"生成中"稍后重试
支付成功积分未到账 → Creem.io webhook重试机制，超过5分钟联系客服
```

---

## 模块二：歌词生成

### 前端设计

**页面核心元素**
```
页面标题：
"说出你的故事，我来写成歌"

输入框：
placeholder："失恋了/想念某人/今天很开心...什么都可以说"
字数限制：200字以内

按钮：
"生成我的歌 ⚡1积分"

积分不足时按钮变成：
"生成我的歌 → 去充值"

输入框下方小字：
"你只需要说人话，剩下的交给我们"
```

### 后台技能包处理流程

**第一步：理解用户输入**
```typescript
const analyzeInput = async (userInput: string) => {
  const prompt = `
    分析以下用户输入，提取关键信息，
    只返回JSON，不要任何解释：

    用户输入：${userInput}

    返回格式：
    {
      "emotion": "主要情绪",
      "theme": "核心主题",
      "scene": "场景描述",
      "intensity": "情绪强度 1-10",
      "direction": "情绪走向"
    }
  `
}
```

**第二步：自动匹配风格**
```typescript
// 基础风格5种，但通过组合变体覆盖更多情绪
// 避免"想念某人"和"失恋"映射到完全相同的风格
const styleMap = {
  heartbreak: {
    genre: "Contemporary R&B Hip-Hop",
    bpm: 85,
    instruments: "Rhodes piano, soft 808 bass, trap hi-hats",
    vocals: "smooth male vocals with melodic hooks",
    mood: "melancholic and introspective"
  },
  longing: {
    genre: "Indie R&B",
    bpm: 75,
    instruments: "muted guitar, soft synth pads, light percussion",
    vocals: "breathy vocals with reverb",
    mood: "wistful and yearning"
  },
  joy: {
    genre: "Upbeat Pop",
    bpm: 110,
    instruments: "punchy synths, electric guitar",
    vocals: "bright vocals with harmonies",
    mood: "euphoric and carefree"
  },
  gratitude: {
    genre: "Acoustic Pop",
    bpm: 95,
    instruments: "acoustic guitar, light strings, piano",
    vocals: "warm sincere vocals",
    mood: "heartfelt and thankful"
  },
  nostalgia: {
    genre: "Indie Folk Pop",
    bpm: 88,
    instruments: "acoustic guitar, soft piano",
    vocals: "warm gentle vocals",
    mood: "bittersweet and nostalgic"
  },
  empowerment: {
    genre: "Hard Trap Hip-Hop",
    bpm: 140,
    instruments: "distorted 808, sharp hi-hats",
    vocals: "commanding rap vocals",
    mood: "aggressive and defiant"
  },
  anger: {
    genre: "Alternative Rock",
    bpm: 130,
    instruments: "distorted electric guitar, heavy drums, bass",
    vocals: "raw aggressive vocals",
    mood: "furious and cathartic"
  },
  chill: {
    genre: "Lo-fi Hip-Hop",
    bpm: 78,
    instruments: "dusty jazz sample, boom-bap drums",
    vocals: "no vocals / instrumental",
    mood: "relaxed and dreamy"
  }
}
// 从5种扩展到8种：新增longing（区分失恋vs思念）、gratitude（区分快乐vs感恩）、anger（区分力量vs愤怒）
// 后续可按用户数据继续扩展，但MVP阶段8种足够覆盖主流情绪
```

**第三步：组装歌词生成Prompt**
```typescript
// 标准版
const buildStandardPrompt = (userInput: string, style: Style) => `
  写一首${style.genre}风格的英文歌词
  主题：${userInput}
  情绪：${style.mood}
  BPM参考：${style.bpm}
  结构：Verse1+Chorus+Verse2+Bridge+Chorus+Outro
  每段加结构标签
`

// 技能包版
const buildSkillPrompt = (
  userInput: string,
  style: Style,
  analysis: Analysis
) => `
  写一首${style.genre}风格的英文歌词

  主题：${userInput}
  情绪走向：${analysis.direction}
  情绪强度：${analysis.intensity}/10

  制作参数：
  - BPM：${style.bpm}
  - 乐器：${style.instruments}
  - 人声：${style.vocals}
  - 氛围：${style.mood}

  写作要求：
  - 用具体细节代替抽象情绪
  - 不使用heart/pain/rain/again等万能词
  - Chorus不超过4行，每行不超过8个字
  - Verse用叙事，Chorus用情绪爆发
  - Bridge要转折，换角度或时间点

  结构：
  [Intro]
  [Verse 1]
  [Pre-Chorus]
  [Chorus]
  [Verse 2]
  [Bridge]
  [Chorus]
  [Outro]
`
```

### 国际化语言支持

前期支持5种主流语言：
```
英语    — 覆盖美国/英国/澳洲，最大市场
西班牙语 — 覆盖拉美+西班牙，增长最快
葡萄牙语 — 巴西单独一个超级市场
日语    — 付费意愿最强的亚洲市场
韩语    — K-pop文化驱动，年轻用户多
```

语言判断逻辑：
```
默认跟随浏览器语言
用户可以手动切换
歌词语言跟随界面语言生成
```

### 歌词编辑器

```
歌词展示区：
- 每个段落可以单独点击编辑
- 不喜欢某一段：点"重新生成这段"🔖（疑问点1）
- 整首不满意：点"重新生成"（不扣积分）
- 满意了：点"生成音乐 →"

右侧小提示：
"副歌是最重要的，确保它能让你想反复哼唱"
```

**重新生成规则**
```
歌词重新生成：不扣积分，最多3次
确认生成音频：扣积分
```

### 异常处理

```
用户输入为空          → 按钮置灰，提示"说点什么吧"
用户输入纯符号/乱码   → 提示"我没太听懂，换个方式说？"
Claude API超时        → 提示"正在创作中，稍等一下"，自动重试
Claude API失败        → 提示"出了点问题，帮你重试"，不扣积分
输入内容违规          → 提示"这个故事我没办法写，换一个？"
```

---

## 模块三：音频生成

### 触发时机

```
用户在歌词编辑器确认歌词
点击"生成音乐 →"
此时检查积分 → 扣积分 → 调用Suno API()
```

### 后台Prompt组装

```typescript
const buildSunoStylePrompt = (style: Style) => {
  // 注意：不能出现艺人名字
  return `
    ${style.genre},
    ${style.mood},
    ${style.bpm} BPM,
    ${style.instruments},
    ${style.vocals}
  `.trim()
}

// 实际输出示例：
// "Contemporary R&B Hip-Hop, melancholic and introspective,
//  85 BPM, Rhodes piano and soft 808 bass, trap hi-hats,
//  smooth male vocals with melodic hooks"
```

### 同时生成2首

```
点击生成 → 同时生成2首 → 扣100积分
用户选择其中一首 → 进入评判报告
另一首保留7天，用户可以随时切换
```

**成本计算**
```
⚠️ 待确认：kie.ai按"任务"还是按"首"计费
按首计费：$0.06 × 2首 = $0.12/次
按任务计费：$0.06/任务（含2首）= $0.06/次
上线前必须跑一次实际API确认账单
```

### 生成状态设计

```
0-8秒：  "正在理解你的故事..."
8-16秒： "编曲进行中，给它一点时间..."
16-24秒："人声和旋律正在融合..."
24-32秒："最后润色中，马上好..."
32秒+：  "比预期复杂了一点，再等等..."
```

### 生成完成后的展示

```
音频播放器：
- 播放/暂停
- 进度条
- 时长显示
- 音量控制

歌词同步高亮方案：
优先：联调时确认 kie.ai/Suno 是否返回时间戳
  - 有时间戳 → 按时间戳高亮对应行
  - 无时间戳 → 降级方案如下：
    按歌曲总时长 ÷ 段落数，均匀分配每段时长
    播放进度超过该段起点时间 → 高亮对应段落
    段落切换有 0.3s 渐变过渡
降级方案的准确率约 70-80%，视觉上可接受，无需依赖时间戳

下方三个按钮：
主按钮：  "查看我的评分报告 →"
次按钮： "下载音频"
```

### 音频存储

```
Supabase Storage：
- 存储路径：/audio/{user_id}/{song_id}.mp3
- 保留时长：永久（付费用户）/ 30天（免费用户）
- 免费用户到期前7天邮件提醒
```

**存储成本**
```
平均每首歌约3-4MB
Supabase免费额度：1GB ≈ 250-330首
超出后：$0.021/GB
```

### 异常处理

```
积分不足        → 弹窗引导付费，不进入生成流程
Suno API超时    → 不扣积分（退回冻结），自动重试1次，仍失败则提示用户
Suno API失败    → 不扣积分（退回冻结），自动重试1次，仍失败记录日志提示重试
生成结果为空    → 自动重试1次，仍失败退回积分
网络中断        → 保存生成任务状态，用户回来后可继续查看

自动重试规则：
- 最多自动重试1次，对用户透明（不显示"重试中"）
- 重试间隔3秒
- 重试仍失败才展示错误，避免因瞬时问题打断用户体验
- 重试期间前端继续显示正常的生成状态文案
```

---

## 模块四：即时评判报告

### 触发时机

```
用户从2首歌中选择一首
点击"查看我的评判报告"
检查本月免费次数 → 有则直接进入 → 无则提示付费
```

### 评判数据来源

```
歌词评判  → Claude API分析歌词文本
综合报告  → Claude整合两组数据生成文案
百分比排名 → 平台数据库（1000用户后启用🔖疑问点3）
```

### 歌词评判Prompt

```typescript
const buildLyricsJudgePrompt = (
  lyrics: string,
  style: Style,
  analysis: Analysis
) => `
你是一位有20年经验的欧美音乐制作人，
请评判以下歌词，只返回JSON，不要任何解释。

歌词：${lyrics}
风格：${style.genre}
主题：${analysis.theme}
情绪：${analysis.emotion}

评判维度（每项1-10分）：
{
  "hook_score": 副歌洗脑度,
  "imagery_score": 意象具体性,
  "emotion_score": 情绪层次,
  "rhyme_score": 韵脚节奏,
  "style_score": 风格统一性,
  "total_score": 综合评分,
  "best_line": "全歌最好的一行歌词",
  "best_line_reason": "为什么好，一句话",
  "improve_tip": "最重要的一条改进建议",
  "producer_comment": "制作人风格的整体评价，100字以内"
}
`
```

### 综合报告生成Prompt

```typescript
const buildFinalReportPrompt = (
  lyricsResult: LyricsJudge,
  audioResult: AudioJudge,
  userInput: string,
  songTitle: string
) => `
你是一位有20年经验的欧美音乐制作人，
同时也是一个懂得鼓励素人创作者的导师。

根据以下评判数据，生成一份有情绪价值的评判报告。
用第二人称"你"来写，像在对创作者说话。

歌词评分数据：${JSON.stringify(lyricsResult)}
音频评分数据：${JSON.stringify(audioResult)}
用户的故事：${userInput}
歌曲名：${songTitle}

要求：
- 先找闪光点放大，再给改进建议
- 语气像一个严格但温暖的制作人
- 不要假大空的夸奖，要具体
- 改进建议只给一条
- 让用户看完想截图发朋友圈
- 100-150字以内

只返回JSON：
{
  "headline": "一句话标题，像专辑评语",
  "highlight": "最大闪光点",
  "score_summary": "分数总结",
  "improve_one": "唯一一条改进建议",
  "producer_sign": "制作人落款"
}
`
```

### 评分显示规则

```
85分以上：直接显示，配上正向文案
70-84分：显示，配上"潜力股"定位
70分以下：不显示具体分数，显示"你的风格正在成型"
```

### 百分比排名（1000用户后启用🔖疑问点3）

```
超过90%："你已经在顶端了"
超过70%："超过了平台 X% 的创作者"
超过50%："你在平均线以上"
50%以下：不显示百分比，只显示鼓励文案
```

### 异常处理

```
Claude生成报告失败  → 展示结构化评分数据，文案部分显示默认鼓励语
评判结果生成超时    → 先展示分数，文案异步加载完成后刷新
```

---

## 模块五：分享成就卡片

### 核心定位

每一张被分享出去的卡片都是一个广告，用户自发传播，零成本获客。

**设计原则：让用户觉得这张卡片发出去有面子。**

### 卡片触发位置

```
评判报告页底部：主按钮"分享这张卡片"
音频播放页：    分享图标
个人主页：      每首歌右侧分享按钮
```

### 封面图方案

使用Pollinations.ai免费生成封面：

```typescript
const generateCover = (style: Style) => {
  const promptMap = {
    "都市夜晚": "neon city lights at night, rain on glass, cinematic, no people, aesthetic",
    "阳光能量": "golden hour sunlight, warm tones, beautiful sky, cinematic landscape",
    "温柔治愈": "soft morning light, flowers, dreamy atmosphere, pastel colors",
    "街头力量": "urban street art, dramatic lighting, black and white, gritty",
    "慵懒时光": "cozy coffee shop corner, warm light, vinyl records, lo-fi aesthetic"
  }

  const prompt = promptMap[style.tag]
  return `https://image.pollinations.ai/prompt/${
    encodeURIComponent(prompt)
  }?width=1080&height=1080&nologo=true`
}
```

### 卡片内容设计

```
[AI生成的风格封面图]

✦ Hit-Song
《She's Doing Fine》

"那句'走那条路回家'
 写出了很多人
 说不出口的感觉"

#都市夜晚  #情绪说唱  #真实系

hit-song.ai
```

### 风格标签体系

```typescript
const tagMap = {
  // 风格标签（替代艺人名）
  "Contemporary R&B Hip-Hop": "#都市夜晚",
  "Indie R&B":                "#深夜独白",
  "Upbeat Pop":               "#阳光能量",
  "Acoustic Pop":             "#温暖日常",
  "Indie Folk Pop":           "#温柔治愈",
  "Hard Trap Hip-Hop":        "#街头力量",
  "Alternative Rock":         "#燃烧释放",
  "Lo-fi Hip-Hop":            "#慵懒时光",

  // 情绪标签
  "heartbreak":    "#情绪说唱",
  "longing":       "#思念成河",
  "joy":           "#快乐至上",
  "gratitude":     "#谢谢你在",
  "nostalgia":     "#回忆滤镜",
  "empowerment":   "#破茧成蝶",
  "anger":         "#一腔孤勇",
  "chill":         "#岁月静好",

  // 特质标签（基于评分）
  imagery_score >= 8:  "#真实系",
  hook_score >= 8:     "#洗脑神曲",
  emotion_score >= 9:  "#催泪预警",
  rhyme_score >= 9:    "#韵脚大师"
}
// 每首歌最多3个标签
```

### 卡片生成技术方案

```
方案一：html2canvas
→ 前端直接截图DOM
→ 优点：简单快速
→ 缺点：移动端偶有兼容问题

方案二：Satori（Vercel出品）
→ 服务端生成OG图片
→ 优点：稳定，适合社交媒体
→ 缺点：需要JSX写样式

建议：
移动端用html2canvas保存图片
社交媒体链接预览用Satori生成OG图
🔖（疑问点5，联调时确认）
```

### 分享方式

```
移动端：
├── 保存到相册（最重要）
├── 分享到Instagram Story
├── 分享到TikTok
└── 复制链接

桌面端：
├── 下载PNG
├── 复制链接
└── 分享到Twitter/X
```

### Song落地页

```
URL：https://hit-song.ai/song/{song_id}

页面结构：
- 音频播放器
- 完整歌词
- 评判报告摘要
- "做你自己的歌 →"按钮（拉新入口）

未登录用户预览策略：
- 音频：完整播放（不限制）
- 歌词：显示前两段（Verse1 + Chorus），剩余模糊处理
- 评判报告：只显示综合评分和 一句话headline，详细报告需登录
- 目的：给够钩子让用户注册，但不白送全部内容

SEO设置：
title: {歌曲名} - 我用AI做了一首歌
description: {制作人评语第一句}
OG image: 分享卡片图
```

### 后期功能🔖（疑问点6）

```
用户上传照片 → AI生成头戴耳机对歌词口型的MV
技术复杂度高，后期单独排期
```

---

## 模块六：邮件召回系统

### 邮件服务选型

```
推荐：Resend
理由：
- 和Next.js + Vercel集成最简单
- 免费额度：3000封/月
- 支持React Email写模板
```

### 触发机制总览

```
触发一：3天后数据播报（核心）
触发二：7天未登录唤醒
触发三：免费额度到期提醒
触发四：音频存储到期提醒（免费用户）
触发五：平台里程碑通知
```

### 触发一：3天数据播报

**数据阈值判断**
```
完整播放 ≥ 3次  → 发"有数据"版邮件（展示具体数字）
完整播放 1-2次  → 发"有数据"版邮件，但不强调数字，侧重鼓励
完整播放 0次    → 发"无数据"兜底版邮件（不提播放数据，避免尴尬）
```

**有数据版邮件文案**
```
主题：你的《She's Doing Fine》这3天有人在听

嘿，

你3天前做的那首歌，有点动静。

━━━━━━━━━━━━━━━━
《She's Doing Fine》
━━━━━━━━━━━━━━━━

被点赞 18 次
被完整听完  3 次 
被分享出去   2 次

有人循环了3次。
你知道这意味着什么——
他们在反复感受同一种情绪。

你的下一首写什么？

[继续创作 →]

— Hit-Song 制作人团队
```

**无数据时的兜底文案**
```
主题：你的第一首歌在这里等你

你3天前做了《She's Doing Fine》

很多人第一首歌做完就放着了
但那些最后成为创作者的人
都有一个共同点：他们做了第二首。

[听听你的第一首 →]
[开始第二首 →]
```

### 触发二：7天未登录唤醒

```
// 注册了但没生成过歌曲
主题：你还没做你的第一首歌

你只需要一句话：
任何故事，任何情绪，任何时刻

[开始我的第一首歌 →]
免费，30秒内出结果

不知道写什么？试试这些开头：
· "今天发生了一件事..."
· "我一直想说但说不出口..."
· "有一个人，我想到他/她..."
```

### 触发三：免费额度到期提醒

```
主题：你的免费额度用完了，但故事还没讲完

你这个月的2首免费歌曲都做完了。

基础版 $6.9 — 30首歌，每月3次专业评判
专业版 $19.9 — 100首歌，每月10次专业评判

[继续我的创作 →]
```

### 触发四：音频存储到期提醒

```
主题：你的《She's Doing Fine》7天后会消失

你30天前做的《She's Doing Fine》
将在7天后从服务器删除。

这首歌有人完整听完过18次。

[保存我的歌 →]
```

### 触发五：里程碑通知

```
主题：你的歌被听了100次

里程碑达成。

《She's Doing Fine》
刚刚被完整播放了第 100 次。

100个人，听完了你想说的话。

[查看完整数据 →]
[做下一首歌 →]
```

### 技术实现

```typescript
// Vercel Cron Job，每天00:00执行
export const emailCronJob = async () => {
  // 触发一：3天数据播报
  const threeDayUsers = await getUsersCreatedDaysAgo(3)
  for (const user of threeDayUsers) {
    const stats = await getSongStats(user.latest_song_id)
    await sendDataReport(user, stats)
  }

  // 触发二：7天未登录
  const inactiveUsers = await getInactiveUsers(7)
  for (const user of inactiveUsers) {
    await sendWakeUpEmail(user)
  }

  // 触发四：存储到期提醒
  const expiringUsers = await getExpiringAudioUsers(7)
  for (const user of expiringUsers) {
    await sendStorageExpiryEmail(user)
  }
}

// 实时触发
export const onQuotaExhausted = async (userId: string) => {
  await sendQuotaExhaustedEmail(await getUser(userId))
}

export const onMilestoneReached = async (
  userId: string,
  songId: string,
  milestone: number
) => {
  await sendMilestoneEmail(
    await getUser(userId),
    await getSong(songId),
    milestone
  )
}
```

### 邮件频率控制

```typescript
const emailRateLimit = {
  max_per_week: 2,
  min_interval_hours: 48
}
```

### 退订处理

```
每封邮件底部：
"退订这类邮件 | 管理邮件偏好 | Hit-Song"

退订后：
- 停止所有营销邮件
- 保留账户功能通知（支付成功、存储到期等）
- 不影响产品使用
```

---

## 模块七：用户系统

### 注册/登录方式

```
优先级：
第一：Google一键登录（最重要）
第二：邮箱+密码（兜底方案）

暂不做：Apple登录、手机号登录
```

### 注册流程

**Google登录**
```
点击"Google登录"→ 授权弹窗 → 授权成功
→ 自动创建账户 → 发放3积分 → 进入生成页面
```

**邮箱注册**
```
输入邮箱+密码 → 发送验证邮件 → 点击验证链接
→ 账户激活 → 发放3积分 → 进入生成页面
```

### 技术实现

```typescript
// Google登录
const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
}

// 登录后回调
const onAuthCallback = async (userId: string) => {
  const isNewUser = await checkIsNewUser(userId)
  if (isNewUser) {
    await supabase.from('credits').insert({
      user_id: userId,
      credits_balance: 3,
      credits_used: 0
    })
    redirect('/create')
  } else {
    redirect('/dashboard')
  }
}
```

### 登录页面设计

```
✦ Hit-Song

说出你的故事
我来写成歌

[G  用Google继续]

─────── 或 ───────

邮箱 / 密码输入框

[登录 / 注册]

注册即代表同意服务条款和隐私政策
```

**登录和注册合并**：系统自动判断邮箱是否已注册，无需用户区分。

### 未登录用户处理

```
可以：浏览首页、听分享的song页面
不能：进入生成页面、查看评判报告

登录弹窗文案：
"先免费做一首歌，再决定要不要留下来"
[Google一键开始 →]
```

### 数据表结构

```sql
-- 用户信息表
create table customers (
  id            uuid references auth.users primary key,
  username      text,
  avatar_url    text,
  plan          text default 'free',
  created_at    timestamp default now(),
  last_login_at timestamp
);

-- 积分表
create table credits (
  user_id          uuid references customers primary key,
  credits_balance  int default 3,
  credits_used     int default 0,
  updated_at       timestamp default now()
);

### 账户安全

```
密码要求：最少8位，不做复杂度限制
忘记密码：发送重置链接到邮箱
会话时长：30天自动登录
```

### 异常处理

```
Google登录失败   → 提示"试试邮箱登录"
验证邮件未收到  → "重新发送"按钮，60秒冷却
邮箱已被注册    → 自动切换到登录流程（防止信息泄露）
会话过期        → 静默跳转登录页，保存当前操作状态
```

---

## 模块八：个人主页

### 核心定位

个人主页是用户的**创作档案馆**，让用户感受到"我已经走了这么远"。

### 顶部：用户信息 + 数据总览

```
[头像]  @username
        Free Plan  [升级 →]

──────────────────────

🎵 创作歌曲    3 首    "你已经是一个创作者了"
🎧 累计播放  128 次    "128个人听过你的故事"
📤 被分享     12 次    "你的音乐走出了这个页面"
⭐ 最高评分    82 分

⚡ 剩余积分    1 积分
[充值 →]
```

### 歌曲列表

**卡片设计**
```
[封面图]  《She's Doing Fine》
          #都市夜晚 #真实系

░░░░░░░░  82分
🎧 18次完整播放
📅 3天前创作

[▶ 播放]  [分享]  [···]
```

**[···] 菜单**
```
查看评判报告
下载音频
删除这首歌
```

**排序方式**
```
默认：按创作时间倒序
可切换：按评分排序 / 按播放次数排序
```

**空状态**
```
你还没有创作过歌曲
说出你的故事，我来写成歌
[开始第一首歌 →]
```

### 成就系统

**创作成就**
```
🎵 初来乍到    — 完成第一首歌
🎵 初露锋芒    — 完成3首歌
🎵 创作达人    — 完成10首歌
🎵 音乐人      — 完成30首歌
```

**播放成就**
```
🎧 有人在听    — 累计播放50次
🎧 小有名气    — 累计播放500次
🎧 破千传播    — 累计播放1000次
```

**评分成就**
```
⭐ 潜力新星    — 获得70分以上
⭐ 专业水准    — 获得85分以上
⭐ 制作人认可  — 获得90分以上
```

**分享成就**
```
📤 走出去了    — 第一次分享
📤 广泛传播    — 累计分享10次
```

**成就解锁文案示例**
```
解锁"破千传播"：
"1000次播放
 1000个人听过你的故事
 你已经是一个真正的创作者"
```

**成就进度展示**
```
🎵 创作达人
   ████████░░  8/10首
   还差2首解锁
```

### 数据表结构

```sql
create table songs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references customers,
  title        text,
  lyrics       text,
  audio_url    text,
  cover_url    text,
  style_tags   text[],
  style_params jsonb,
  total_score  int,
  report_data  jsonb,
  is_public    boolean default true,
  created_at   timestamp default now(),
  expires_at   timestamp
);

create table play_events (
  id         uuid primary key default gen_random_uuid(),
  song_id    uuid references songs,
  user_id    uuid,
  type       text,  -- play/complete/loop/share
  created_at timestamp default now()
);

create table achievements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references customers,
  achievement  text,
  unlocked_at  timestamp default now()
);
```

### 公开/私密设置

```
每首歌可以单独设置：
公开  → 分享链接可被任何人访问
私密  → 只有自己能看
默认：公开
```

### 异常处理

```
音频加载失败    → 显示封面图和歌词，提示刷新重试
免费用户歌曲到期 → 卡片显示"已过期"灰色状态，点击提示升级
删除确认        → 弹窗二次确认，"删除后无法恢复，确认删除？"
```

---

## 模块九：订阅套餐页面

### 核心定位

**设计原则：用用户已经体验过的价值来说服他，而不是用功能列表。**

### 积分包（一次性）
$4.99/900积分、$9.99/3000积分

### 套餐设计

| 套餐 | 价格  | 积分 |  存储 | 其他 |
|------|------|------|------|------|
| Free | $0   | 300积分 | 7天 | — |
| Basic| $8.99/月 | 9000积分  | 永久 | — |
| Pro  | $18.99/月 | 30000积分| 永久 | 优先生成🔖 |
**年付优惠（Pro）**
```
年付：Basic  $76/年（便宜30%）
      Pro $160/年（便宜30%）
```

### 页面标题文案

```
有用户数据时：
"你的故事值得被更多人听见"
"你已经做了3首歌，累计128次播放
 继续创作，看看能走多远"

无用户数据时：
"免费体验2首之后
 很多人发现自己停不下来"
```
### 套餐页面底部
```
货币：目前仅支持美元（USD），所有地区统一定价
```

### 定价心理学

```
锚定对比：
"相当于每首歌$0.2
 一杯咖啡的钱，一首专属的歌"

免费版展示：
只展示2条核心权益，不列所有限制
让用户感受升级后的差距
而不是感受现在被限制
```

### 支付流程

```typescript
const createCheckout = async (
  userId: string,
  plan: 'basic' | 'pro'
) => {
  const priceMap = {
    basic: process.env.CREEM_BASIC_PRICE_ID,
    pro:   process.env.CREEM_PRO_PRICE_ID,
  }

  const checkout = await creem.checkout.create({
    price_id:    priceMap[plan],
    customer_id: userId,
    success_url: `${BASE_URL}/payment/success`,
    cancel_url:  `${BASE_URL}/pricing`
  })

  return checkout.url
}

// 支付成功Webhook
const onPaymentSuccess = async (event: CreemEvent) => {
  const { userId, plan, credits } = event.data

  await supabase.from('customers')
    .update({ plan }).eq('id', userId)

  await supabase.rpc('add_credits', {
    user_id: userId,
    amount: credits
  })

  await sendPaymentSuccessEmail(userId, plan)
  redirect('/create?upgraded=true')
}
```

**支付成功体验**
```
不跳转"支付成功"页面
跳转到生成页面，顶部提示：
"积分已到账 ⚡ 你现在有30积分，开始做下一首歌吧"
```

### 退款政策

```
7天内不满意，全额退款，无需任何理由
（展示在套餐页底部，降低付费决策门槛）
```

### 企业版询价页面

```
URL：/enterprise

内容：
- 无限积分
- 无限评判次数
- API接入
- 团队协作
- 专属客户支持
- 定制化风格包
- 从 $99/月 起
- 联系表单（邮箱 + 公司名称）
```

### FAQ

```
Q：积分会过期吗？
A：不会，买了就是你的，用完再充。

Q：可以随时取消订阅吗？
A：可以，取消后当月权益保留到期末。

Q：免费版的歌曲30天后真的删除吗？
A：是的，但可以在删除前下载保存。升级后永久保存。

Q：支持哪些支付方式？
A：支持Visa、Mastercard、Apple Pay、Google Pay。

Q：不满意可以退款吗？
A：7天内全额退款，无需任何理由。
```

### 异常处理

```
套餐页加载失败    → 显示静态价格，支付按钮跳转邮件联系
Creem.io不可用   → 提示"支付系统维护中，请稍后再试"
重复订阅检测      → 已订阅Pro的用户看到"管理订阅"而非"选择套餐"
降级处理          → 当月高级权益保留到期末，下月按新套餐计算
```

---

## 冷启动策略

```
第一步：自己用平台做10首歌，覆盖10种不同情绪场景
第二步：把生成过程做成短视频，发YouTube/TikTok/ins
第三步：每个视频展示评判报告，让观众看到"AI还能这样夸我"
第四步：引导到平台，第一批用户免费体验
```

---

*Hit-Song PRD v1.0 — 2026年5月*
