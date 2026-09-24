# 做饭记录 PWA：开发指示书（给 Claude Code）

> 使用方法：把本文件放在项目根目录，然后对 Claude Code 说：
> 「请阅读 SPEC.md，按"工作方式"一节的要求，从阶段 0 开始。」

---

## 0. 工作方式（请 Claude Code 严格遵守）

- **开发者是编程新手。** 每个阶段开始前，用简短的中文说明这一阶段要做什么、为什么这样做。需要开发者在网页控制台手动操作的步骤（如 Supabase、Vercel 设置），请逐步写清楚：点哪里、填什么、复制什么。
- **按阶段推进。** 一次只做一个阶段。完成后列出验收清单，请开发者在本机和手机上实际验证，确认后再进入下一阶段。
- **每个阶段结束时 git commit**，提交信息写清楚做了什么。
- **遇到本文件没写清楚、而且会影响架构的决定，先问再做。** 小的实现细节可以自行决定，并在阶段总结里说明。
- **不要把任何密钥写进代码或提交到 git。** `.env` 必须在 `.gitignore` 里，另外提供 `.env.example`。
- 第三方服务的具体接口地址、模型名、价格和免费额度变化很快。**请以写代码时的官方文档为准**，不要凭记忆硬编码；需要用到时先查证。
- 代码里的注释用中文或英文均可，面向用户的界面文字用中文（见第 8 节多语言）。

---

## 1. 项目概述

一个**开源、轻量**的个人做饭记录工具，以 PWA 形式运行，手机上"添加到主屏幕"后可像 App 一样使用。

核心功能：
1. **食材库存**：记录名称、数量、单位、保质期，可打自定义标签；临近过期时提醒。
2. **饮食日记**：按时间记录做过、吃过的饭菜，可以上传照片，写评价、感悟、使用的食材和耗时。
3. **AI 功能（可选，BYOK）**：
   - 营养点评：对最近一段时间的饮食做营养评价
   - 食谱推荐：点选想消耗的食材，结合个人口味生成食谱
   - 两个功能**各自独立开关**，默认关闭
4. **数据导出/导入**：JSON 全量备份和恢复；CSV 导出方便拿去做分析。

开源定位：任何人都可以 fork 本仓库，用**自己的** Supabase 项目和**自己的** AI API Key 部署使用。作者不承担他人的服务器或 AI 费用。

---

## 2. 技术栈

| 层 | 选择 | 说明 |
|---|---|---|
| 前端框架 | Vite + React + TypeScript | |
| 样式 | Tailwind CSS | 移动端优先 |
| PWA | vite-plugin-pwa | manifest、service worker、图标 |
| 路由 | React Router | |
| 数据请求/缓存 | TanStack Query | |
| 后端 | Supabase（Postgres + Auth + Storage + Edge Functions） | 使用免费额度 |
| 登录 | Supabase Auth：邮箱 Magic Link（必做）+ Google 登录（可选） | 不自建密码系统 |
| 部署 | Vercel（连接 GitHub 自动部署） | 如有更好选择可提出 |
| 表单校验 | zod | 也用于导入数据校验 |
| 导出打包 | JSZip | 导出含照片的 zip |
| 测试 | Vitest（工具函数、导入导出、日期计算） | 不要求 UI 全覆盖 |

---

## 3. 数据模型（Supabase / Postgres）

所有表都带 `user_id uuid references auth.users`，**并且必须开启 RLS**，策略为"只能读写 `user_id = auth.uid()` 的行"。
所有表都有 `created_at`、`updated_at`（用 trigger 自动更新）。主键用 `uuid default gen_random_uuid()`。
数据库变更写成 SQL migration 文件，放在 `supabase/migrations/`。

### 3.1 标签
```
tag_groups        -- 标签分组（可选），例如"类别""保存方式"
  id, user_id, name, sort_order

tags
  id, user_id, name, color (text, 例如 #hex), group_id (nullable → tag_groups), sort_order
  unique(user_id, name)
```
- 标签完全由用户自定义，可以增删改和排序。
- 分组是可选的：标签可以不属于任何分组。
- 用户**首次登录时自动创建一套默认标签**（之后可随意修改删除）：
  - 分组「类别」：肉类、蔬菜、水果、蛋奶、主食、饮品、调料、零食
  - 分组「保存方式」：常温、冷藏、冷冻

### 3.2 食材
```
ingredients
  id, user_id,
  name            text not null,
  quantity        numeric nullable,
  unit            text nullable,          -- 自由输入，并提供常用建议：g, kg, ml, L, 个, 瓶, 包, 盒, 袋
  expiry_date     date nullable,          -- 为空表示"无保质期/不关心"
  purchased_date  date nullable,
  notes           text nullable,
  status          text not null default 'active'   -- active | used_up | discarded

ingredient_tags   -- 多对多
  ingredient_id, tag_id, primary key(ingredient_id, tag_id)
```
- **一个食材可以有 0 个或多个标签**。没有标签的在界面上归为「未分类」。
- 用完或丢弃不直接删除，而是改 status，方便日后分析浪费情况。同时也提供真正的删除。

### 3.3 饮食记录
```
meals
  id, user_id,
  title              text not null,
  eaten_at           timestamptz not null,
  meal_type          text nullable      -- breakfast | lunch | dinner | snack | other
  source             text nullable      -- home_cooked | eating_out | takeout | other
  rating             smallint nullable  -- 1–5
  review             text nullable      -- 评价（味道、成败）
  reflection         text nullable      -- 感悟、下次改进
  cook_time_minutes  integer nullable
  servings           numeric nullable

meal_photos
  id, user_id, meal_id, storage_path text, sort_order

meal_ingredients
  id, user_id, meal_id,
  ingredient_id   uuid nullable -> ingredients (on delete set null)
  name            text not null     -- 名称快照，库存食材删除后记录仍然完整
  quantity        numeric nullable,
  unit            text nullable
```

### 3.4 用户设置
```
user_settings
  user_id (pk),
  reminder_days        integer default 3,    -- 提前几天提醒
  taste_profile        text nullable,        -- 口味档案（自由文本，AI 使用）
  ai_nutrition_enabled boolean default false,
  ai_recipe_enabled    boolean default false,
  locale               text default 'zh'
```
**注意：AI API Key 不存数据库**（见第 6 节）。

### 3.5 照片存储
- Supabase Storage 私有 bucket：`meal-photos`
- 路径：`{user_id}/{meal_id}/{uuid}.webp`
- Storage 的 RLS 策略：只允许访问自己 `user_id` 前缀下的文件
- 显示时使用 signed URL
- **上传前在浏览器端压缩**：长边不超过 1600px，转成 WebP（不支持时用 JPEG），质量约 0.8。每顿饭最多 6 张。

### 3.6 AI 生成结果（可选保存）
```
ai_reports
  id, user_id,
  kind          text   -- nutrition | recipe
  input_summary jsonb  -- 生成时的输入摘要（时间范围、选中的食材等）
  output        jsonb  -- 模型返回的结构化结果
  provider      text, model text
  is_favorite   boolean default false
```

---

## 4. 功能需求

### 4.1 登录
- 邮箱 Magic Link 登录（输入邮箱 → 收邮件点链接）。
- Google 登录作为可选项，写进 README 的配置说明。
- 首次登录：创建 `user_settings` 和默认标签。
- 设置页提供「退出登录」和「删除账户及全部数据」（二次确认）。

### 4.2 食材库存
- **列表页**：
  - 默认按保质期从近到远排序，无保质期的排最后
  - 每项显示：名称、数量+单位、标签（彩色小标签）、剩余天数
  - 状态颜色：已过期（红）、≤ `reminder_days` 天（橙）、正常（默认）、无保质期（灰）
  - **筛选**：按标签（可多选，逻辑为"包含任一"）、「未分类」、状态（在库/已用完/已丢弃）
  - 可切换**按分组视图**：按某个标签分组（如按「保存方式」分成冷藏/冷冻/常温），没有该组标签的归入「未分类」
  - 搜索框（按名称）
- **添加/编辑**：
  - 名称（必填）、数量、单位（带建议下拉）、保质期（日期选择，另有快捷按钮：+3天、+1周、+1个月）、购买日期、备注
  - 标签选择：显示已有标签可点选；输入新名称可**当场创建新标签**
  - 允许不选任何标签
- **快速操作**：左滑或长按弹出菜单 →「用掉一部分」（改数量）、「用完」、「丢弃」、「编辑」、「删除」
- **标签管理页**（设置内）：增删改标签和分组，改颜色，排序。删除标签时提示"将从 N 个食材上移除"。

### 4.3 过期提醒
- **阶段 1 做应用内提醒**：打开 App 时，首页顶部显示横幅"N 样食材即将过期 / 已过期"，点击跳转到筛选后的列表。
- 底部导航的「食材」图标上显示数量角标。
- **阶段 5 再做推送通知**（见第 7 节）。

### 4.4 饮食日记
- **时间线列表**：按日期倒序分组显示，每条显示缩略图、标题、餐次、评分。
- 支持按月或周翻看，简单日历视图可以放到后续迭代。
- **添加/编辑记录**：
  - 标题（必填）、时间（默认现在）、餐次、来源（自己做/外食/外卖/其他）
  - 照片：拍照或从相册选，多张，可删除和排序
  - 评分（1–5 星）、评价、感悟
  - 耗时（分钟）、份数
  - **使用的食材**：可以从库存点选，也可以手动输入不在库存里的食材；每项可填用量
  - **「从库存扣减」开关**（默认开）：保存时对从库存选的食材扣减相应数量，数量归零时询问是否标记为"用完"。单位不一致时不自动扣减，提示用户手动处理。
- 详情页：大图浏览、全部信息、编辑、删除。
- **搜索**：时间线顶部有搜索框，按关键词搜索标题、评价、感悟和使用的食材名称（不区分大小写），结果仍按日期倒序显示；可与餐次、来源筛选组合。

### 4.6 做饭总结（设置页内）
- 入口：设置页 →「做饭总结」
- **热力图**：类似 GitHub 贡献图，每个格子是一天，颜色深浅表示当天记录的顿数；默认显示最近 12 个月，可切换年份；横向可滑动，适配手机
- **点击某一天**：在热力图下方列出当天的所有记录（缩略图、标题、餐次、评分），点击进入详情页
- 顶部显示简单统计：本月/今年记录天数、总顿数、自己做的比例、连续记录天数
- 日期按用户本地时区计算（复用日期工具函数）

### 4.5 数据导出/导入（设置页）
**导出：**
1. **JSON 全量备份**：包含 tag_groups、tags、ingredients、ingredient_tags、meals、meal_ingredients、meal_photos（元数据）、user_settings（不含 API Key）、ai_reports。顶层带 `schema_version`、`exported_at`、`app_version`。
2. **ZIP 完整备份**：上述 JSON + 所有照片文件（`photos/{meal_id}/...`）。
3. **CSV 导出（供分析用）**，打包成一个 zip：
   - `ingredients.csv`：每行一个食材，`tags` 列用 `;` 连接标签名，另加 `tag_groups` 信息列
   - `meals.csv`：每行一顿饭（不含照片二进制，含照片数量）
   - `meal_ingredients.csv`：每行一条"某顿饭用了某食材"，含 meal_id、meal_title、eaten_at
   - 编码 UTF-8 **带 BOM**（Excel 打开中文不乱码），日期用 ISO 8601
- 可选：导出时按时间范围筛选。

**导入：**
- 接受 JSON 或 ZIP 备份
- 用 zod 校验结构和 `schema_version`，出错时给出具体的中文提示
- 两种模式（导入前让用户选择，并显示预览"将导入 N 个食材、M 条记录"）：
  - **合并**：按 id 去重，已存在的跳过或覆盖（让用户选）
  - **替换**：先清空现有数据（二次确认）再导入
- 导入时重新生成 id 映射，避免与其他用户的数据冲突；照片重新上传到当前用户路径下

---

## 5. AI 功能

### 5.1 总体原则
- 两个功能**独立开关**，默认关闭。关闭时对应入口不显示。
- 只有用户填写了 API Key 并通过「测试连接」后才能打开开关。
- 所有 AI 输出都提示：「AI 生成内容仅供参考，营养数值为粗略估算」。

### 5.2 模型可切换（Provider 抽象层）
在 `src/lib/ai/` 下实现统一接口：

```ts
interface AIProvider {
  id: string;
  chat(params: {
    system: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    jsonSchema?: object;       // 期望的输出结构
    temperature?: number;
  }): Promise<string>;
  testConnection(): Promise<{ ok: boolean; message: string }>;
}
```

- **适配器 1：OpenAI 兼容格式（主力）**：用户填 `base_url`、`model`、`api_key`。DeepSeek、OpenRouter、Groq、Google Gemini（OpenAI 兼容端点）等都走这个。
- **适配器 2：Anthropic 原生格式**（可选实现）。
- 设置页提供**预设下拉**（DeepSeek / OpenRouter / Gemini / Groq / 自定义）。选中后自动填 base_url 和一个推荐模型，但**都可以手动修改**。预设值请写代码时查官方文档确认，并集中放在一个配置文件里，方便日后更新。
- 不依赖模型的原生 JSON 模式：prompt 里要求只输出 JSON，解析失败时自动重试一次，再失败就显示原文。

### 5.3 BYOK 与 Key 的存放
- API Key **只存在当前设备的浏览器里**（localStorage），不上传数据库。设置页明确说明：「Key 只保存在本设备，换设备需重新填写」。
- 提供「清除 Key」按钮。
- **CORS 问题**：部分服务商不允许浏览器直接调用。实现方式：
  1. 优先由浏览器直连（请逐个查证各预设服务商是否支持）；
  2. 对不支持直连的，提供一个 Supabase Edge Function `ai-proxy`：由前端把 Key 放在请求头里传入，函数转发请求。**函数不得记录、存储 Key 或对话内容**，只允许已登录用户调用，并且只转发到白名单里的域名。
  3. 设置里对每个 Provider 标注"直连 / 经代理"。

### 5.4 营养点评
- 入口：AI 页 →「营养点评」
- 用户选择范围：最近 3 天 / 7 天 / 14 天 / 自定义
- 发送给模型的数据：每顿饭的时间、餐次、标题、使用的食材和用量、份数、来源（外食等）。**不发送照片**（节省费用，也保护隐私）。
- 期望输出 JSON：
```json
{
  "summary": "总体评价（2-3句）",
  "strengths": ["做得好的地方"],
  "concerns": ["可能不足或过量的方面"],
  "estimated_daily": { "energy_kcal": "范围", "protein": "偏低/适中/偏高", "vegetables": "...", "notes": "估算依据说明" },
  "suggestions": ["具体可执行的建议，尽量结合现有库存"],
  "disclaimer": "..."
}
```
- 可以把当前库存名单一起发送，让建议更可执行。
- 结果页用卡片展示，可以「保存」到 ai_reports。

### 5.5 食谱推荐
- 入口：AI 页 →「推荐食谱」
- **点选想消耗的食材**：展示在库食材（快过期的置顶并高亮），多选
- 可选条件：最长烹饪时间、份数、菜系/风格（自由输入）、是否允许使用未选中的库存食材、是否允许需要额外购买的食材
- 发送：选中食材（含数量、剩余天数）、其他库存名单（如允许）、口味档案、最近几次高分和低分菜品的标题及评价（用于体现口味）
- 期望输出 JSON：生成 1–3 个食谱
```json
{
  "recipes": [{
    "title": "", "why": "推荐理由（为什么适合这些食材/你的口味）",
    "time_minutes": 0, "servings": 0,
    "ingredients": [{ "name": "", "quantity": "", "from_inventory": true }],
    "extra_to_buy": [""],
    "steps": [""],
    "tips": ""
  }]
}
```
- 每个食谱可以：「保存」、「重新生成」、**「做了！」**（跳转到新建饮食记录，自动带入标题和食材）

### 5.6 口味档案
- 设置页里的自由文本，例如「偏辣，不吃香菜，喜欢日式和川菜，少油」
- 按钮「根据我的记录生成口味总结」：把最近的评分和评价发给模型，生成一段总结，**由用户确认或编辑后才保存**

---

## 6. 页面结构（移动端优先）

底部导航 4 个 Tab：
1. **食材**：库存列表（首页，含过期横幅）
2. **记录**：饮食日记时间线
3. **AI**：营养点评 / 推荐食谱 / 已保存的结果（两个功能都关闭时，显示引导去设置开启）
4. **设置**：做饭总结（热力图）、提醒天数、标签管理、口味档案、AI 设置、导出导入、账户

右下角悬浮「+」按钮，根据当前 Tab 新建食材或记录。
支持深色模式（跟随系统）。界面要干净、按钮够大，单手能操作。

---

## 7. 推送通知（阶段 5，可选）

- Web Push（VAPID）+ Supabase Edge Function + 定时任务（pg_cron 或 Supabase Scheduled Functions）
- 每天一次（用户可设置时间，默认 9:00，按用户时区），检查即将过期的食材，有的话推送一条汇总
- 新表 `push_subscriptions(id, user_id, endpoint, keys jsonb, created_at)`
- 设置页开关「推送过期提醒」
- README 说明：iPhone 需要 iOS 16.4 以上，并且必须先"添加到主屏幕"才能收到推送

---

## 8. 多语言

- 使用 i18n 结构（例如 react-i18next），**所有界面文字从一开始就不要写死在组件里**
- 第一版只做简体中文 `zh`，预留 `ja`、`en`
- 默认标签名也跟随语言

---

## 9. 开源与部署

- 仓库包含：`README.md`（中文，可附英文版）、`LICENSE`（MIT）、`.env.example`、`supabase/migrations/`
- README 必须包含：
  1. 功能简介和截图占位
  2. **从零部署教程**（面向新手）：注册 Supabase → 新建项目 → 执行 migrations → 配置 Auth 的回调 URL → 创建 Storage bucket → fork 仓库 → 在 Vercel 导入并填写环境变量 → 手机添加到主屏幕
  3. AI 设置说明和费用提示（费用由用户自己的 API 账户承担）
  4. 数据导出格式说明（字段表）
- 环境变量只有：`VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`（anon key 可以公开，安全性由 RLS 保证，请在 README 中解释这一点）
- Edge Function 的密钥（如 VAPID 私钥）只存在 Supabase 的 secrets 里

---

## 10. 开发阶段与验收

### 阶段 0：环境与骨架
- 检查并指导安装：Node.js（LTS）、git，以及 GitHub、Supabase、Vercel 账户
- 初始化 Vite + React + TS + Tailwind + PWA + i18n + 路由 + 底部导航空页面
- 首次部署到 Vercel
- ✅ 验收：手机打开网址 → 添加到主屏幕 → 能以全屏 App 形式打开，看到 4 个 Tab

### 阶段 1：登录 + 食材库存 + 标签 + 应用内提醒
- Supabase 项目、migrations、RLS、Magic Link 登录、默认标签
- 食材增删改查、标签管理、筛选、分组视图、过期颜色和横幅
- ✅ 验收：手机和电脑登录同一账户，数据同步；另注册一个测试账户，确认互相看不到数据

### 阶段 2：饮食日记
- 记录增删改查、照片压缩上传、时间线、从库存选食材并扣减
- 日记搜索（4.4）、做饭总结热力图（4.6）
- ✅ 验收：手机拍照记录一顿饭，电脑上能看到照片；扣减库存数量正确；能按关键词搜到记录；热力图点某天能看到当天的记录

### 阶段 3：导出/导入
- JSON、ZIP、CSV 导出；JSON 和 ZIP 导入（合并/替换）
- 编写导入导出的单元测试（往返测试：导出 → 清空 → 导入 → 数据一致）
- ✅ 验收：CSV 用 Excel 打开中文正常；在测试账户中导入备份后数据完整

### 阶段 4：AI（BYOK）
- Provider 抽象层、设置页、测试连接、必要时的 ai-proxy
- 营养点评、食谱推荐、口味档案、保存结果、「做了！」联动
- ✅ 验收：至少用两个不同的服务商跑通两个功能；关闭开关后入口消失

### 阶段 5（可选）：推送通知
- ✅ 验收：安卓 Chrome 和 iPhone（主屏幕 PWA）都能收到每日过期提醒

### 阶段 6（可选，后续迭代）
- 离线缓存（没网也能看库存，恢复联网后同步）
- 统计图（每月花费时间、食材浪费率、评分趋势）
- 条码扫描录入食材
- 用 Capacitor 打包成安卓 APK

---

## 11. 代码质量要求
- TypeScript strict 模式
- 目录建议：`src/features/{ingredients,meals,ai,settings,auth}`、`src/lib/{supabase,ai,export,i18n}`、`src/components/`
- 数据库类型用 Supabase CLI 生成（`supabase gen types`）
- 所有异步操作要有加载状态和中文错误提示
- 删除类操作一律二次确认
- 日期计算统一用用户本地时区，封装成工具函数并写测试（剩余天数、是否过期）
