# v1.2 Startup Handoff

更新日期：2026-06-03

## 当前基线

- v1.1 已发布：`main` 位于 `617e938`，tag 为 `v1.1.0`。
- 当前正确仓库：`https://github.com/dilititi/python_brain.git`。
- 旧的相似仓库 `python-brain` 已归档，Vercel 新 project 已绑定到 `python_brain`。
- 生产域名：`https://python-brain.vercel.app/`。
- 抽样验证已通过：`/concepts/decorator/`、`/path/automation/`、`/relations.json` 返回 200。
- 本文件只用于 v1.2 启动前审查和拆任务；不在这里提前实现 progress tracking。

## v1.2 定位

v1.2 做的是“认知外脑”的掌握度地图，不是刷题平台。进度系统必须展示学习者在知识图谱中的形状、证据和下一步空缺，而不是只显示百分比、连击或排行榜。

详细产品设计见 `docs/v1.2-progress-tracking.md`。本 handoff 负责记录开工前必须确认的工程口径、风险和第一批 PR 切法。

## 已定边界

- 不新增 concept，不把内容规模推到 80+。
- 不引入后端、用户系统、跨设备同步。
- 不接入需要 API key 的外部服务。
- 题库纯静态进入 `src/content/assessments/`。
- 用户进度只落在 localStorage。
- 编辑器使用 CodeMirror 6，不使用 Monaco。
- Pyodide 只在用户点击“开始评估”后加载。
- ruff WASM 只作为阶段 A 可行性验证；验证失败则降级为建议层，不阻断主流程。

## 开工前发现

### 1. 类别矩阵口径已裁决

v1.2 启动期采用 `8 类别 × 4 档`。当前 schema 枚举是 10 类：

```text
language, syntax, control-flow, data-structure, function,
oop, file-io, module-eng, stdlib, third-party
```

当前 52 个概念实际只覆盖 8 类：

| category | concepts |
|---|---:|
| control-flow | 8 |
| data-structure | 8 |
| function | 7 |
| language | 7 |
| module-eng | 6 |
| oop | 6 |
| stdlib | 4 |
| syntax | 6 |

`file-io` 和 `third-party` 仍是空 category。v1.2 不为了凑 9 类新增 concepts，也不展示空 category。等 `file-io` / `third-party` 有真实内容时，再扩矩阵。

### 2. assessments collection 尚未存在

`src/content/assessments/`、assessments schema 和 5 种题型最小样本已进入第一批实现。第一阶段仍不写 UI，不接 localStorage。

建议题目 id 规范：

```text
{category}-{kind}-{tier}-{short-slug}
```

示例：

```text
syntax-recognition-tier1-f-string-output
control-flow-debugging-tier2-loop-break
function-refactor-tier3-parameter-contract
```

当前种子题保留 `tier` 进 id。这个选择的代价是：未来若调整题目 tier，直接改 id 会让既有 `pkb:attempts` 引用失效。因此 v1.2 内如果要改题目 tier，优先保持旧 id 不变，并在题目数据或迁移脚本里处理展示 tier / 证据 tier 的变化；不要无迁移地重命名 assessment id。

### 3. localStorage 需要版本化

`pkb:progress`、`pkb:attempts`、`pkb:timetrack` 都必须带 `schemaVersion`。原因是 v1.2 期间会频繁调整证据结构，没有版本号会让旧浏览器数据把 UI 算坏。

建议从 `schemaVersion: 1` 开始。读取失败或版本不匹配时，只清理 v1.2 progress keys，不影响 v1.0 已有的概念点亮数据。

### 4. progress calculator 必须先于页面

`src/lib/progress-calculator.ts` 必须是无 DOM、无 localStorage、无 Pyodide 的纯函数。先写 calculator 和单测，再接 `/progress` 页面。这样矩阵规则不会散落到 React island 或页面脚本里。

PR 2 已落地 calculator 规则：

- `PROGRESS_SCHEMA_VERSION = 1`。
- 启动期 category 为 8 类：`language`、`syntax`、`control-flow`、`data-structure`、`function`、`oop`、`module-eng`、`stdlib`。
- calculator 第二参数必须传入 `categoryConfig`，由当前 concepts / assessments / projects 构建得到；不要把全局 Tier 目标逐 category 硬套。
- Tier 目标按每类实际可用证据池缩放：概念阅读目标取该类概念数，识别题 / 限时题目标取该类对应题数，standard / production 代码目标取该类可运行示例数。
- 某个要求没有可用证据池时不计入完成度；但一个档位如果没有任何可衡量要求，不会自动完成。
- 档位采用累计完成：Tier 2 必须在 Tier 1 完成后才算完成，Tier 3/4 同理。
- 单个 cell 有 `empty` / `in_progress` / `blocked` / `complete` 四种状态。当前置档未完成时，即使本档证据已满足，也只显示 `blocked`。
- 证据按稳定 id 去重：概念、assessment、project 或 code example 的重复提交不重复计数。
- 失败 attempt 不计入档位证据，但会进入 `recentPatterns`，用于后续周摘要或卡壳模式提示。
- `activeFrontier` 优先返回最早未完成档；同档同进度时，有证据活动的 category 优先。

Tier 规则：

| Tier | 规则 |
|---|---|
| Tier 1 | 读过 15 个概念 + 通过 10 道识别题 + 跑通 8 段 `standard` 代码 |
| Tier 2 | 5 道限时题通过测试 + 3 道 PEP 8 检查通过 |
| Tier 3 | 完成 1 个 `entry` 项目 + 跑通 1 段 `production` 代码 |
| Tier 4 | 完成 1 个 `mid` / `capstone` 项目 + 2 次反向识别 + 1 道跨概念题 |

### 5. ruff WASM 不能提前成为 gate

PEP 8 检查是 Tier 2 证据的一部分，但 ruff WASM 在浏览器中的体积、加载方式、API 稳定性都还没验证。阶段 A 只做 spike：

- 能否在浏览器端加载。
- 首次加载是否破坏 Lighthouse。
- 是否能返回可解释的 lint 结果。
- 失败时是否能降级为“建议层”而不是阻断评估。

## 第一批任务拆分

### PR 1：数据模型和种子样本

- 新增 `assessments` collection schema。
- 新建 `src/content/assessments/`。
- 每种 kind 至少 1 道样本：`recognition`、`debugging`、`completion`、`timed-coding`、`refactor`。
- 写 schema 校验，确保 `concepts[]` 引用现有 concept。
- 不做页面，不接 localStorage。

完成条件：

- `npm run build` 能通过 Astro content schema。
- `npm run validate:relations` 不新增 relation error。
- `npm run audit:assessments` 返回 clean。
- 文档更新 assessment id 规范。

### PR 2：progress calculator

- 新增 `src/lib/progress-calculator.ts`。
- 定义 attempts/progress 的 TypeScript 类型和 `schemaVersion`。
- 实现 attempts -> matrix/cell/evidence/frontier 的纯函数。
- 新增单测，覆盖率目标不低于 80%。

完成条件：

- `npm run test` 通过。
- calculator 不读取 DOM、localStorage、Pyodide。
- `npm run build` 通过 Astro strict check。

### PR 3：只读矩阵页

- 新增 `/progress` 页面。已落地为只读矩阵页。
- 先读取本地 mock/localStorage fixture 渲染矩阵。当前只接受 `pkb:attempts` 中 `schemaVersion = 1` 且包含 `attempts[]` 的数据，否则回落 mock。
- 空状态要能清楚告诉用户“还没有评估证据”。
- 不接 Pyodide，不接 CodeMirror。

完成条件：

- `/progress` 可访问。
- Lighthouse 不低于现有门槛。
- localStorage 解析失败时页面不崩。
- 页面不写入 localStorage，不加载 Pyodide / CodeMirror。

### PR 4：评估页最小闭环

- 新增 `/assessments/` 列表页和 `/assessments/[id]` 静态详情页。
- 接入 CodeMirror 6 的最小编辑器配置，避免引入 Monaco 或完整编辑器套件。
- Pyodide 仍只在用户点击“开始评估”后通过 CDN 脚本加载，不进入首屏 HTML。
- runnable 题型会运行 `testCases` 并写入 `pkb:attempts`。
- recognition 题型可提交选择题结果，不触发 Pyodide。
- 提交后通过 calculator 更新 `pkb:progress`，并广播 `pkb:progress-updated`。

完成条件：

- 至少 1 道 timed-coding 可跑通测试用例。
- 失败输出包含测试名和 traceback，不吞错误。
- 首屏不加载 Pyodide。
- 当前仍不包含 ruff / PEP 8 浏览器检查、e2e 浏览器自动化、完整五题型专用 UI；这些进入后续 PR。

### PR 5：题库扩到阶段 1 目标

- 按最终 category 口径补齐种子题。
- 阶段 1 目标为 24 道题（8 类 × 3 kind）。
- 5 种评估类型都必须持续存在，不能退化成只有限时编程。

完成条件：

- assessment inventory 文档列出 category/kind/tier 分布。
- 每个非空 category 至少 3 道题。

## 后续阶段

### 阶段 2：UI 与运行

- `/progress` 矩阵页进入真实 localStorage。
- `/assessments/[id]` 支持 5 种题型。
- 三层反馈接通：键盘层、运行层、进度层。
- 周摘要页显示证据、卡壳模式、活跃前沿。

### 阶段 3：反向触发与发布

- 停留触发识别题。
- 沉默提醒。
- e2e 覆盖关键路径。
- 写 release handoff。
- 全量 gates 通过后打 annotated tag `v1.2.0`。

## v1.2 Gates

沿用 v1.1 gates：

```bash
npm run validate:relations
npm run audit:concepts
npm run audit:assessments
npm run test
npm run test:code-examples
npm run build
npm run link:check
npm run link:external:inventory
```

v1.2 新增建议：

- calculator 单测进入 `npm run test`。
- 若新增 assessment 专用校验脚本，命名为 `npm run audit:assessments`，并在发布前进入 deployment 文档。
- runnable assessment 测试脚本不要复用 `test:code-examples`，另起 `npm run test:assessments`，避免概念示例和评估题混在一起。

## 启动前 Checklist

- [x] v1.1.0 已发布。
- [x] 生产域名已绑定正确 repo。
- [x] 生产抽样 URL 返回 200。
- [x] v1.2 产品设计文档存在。
- [x] 裁决 category 矩阵口径：启动期使用 8 个真实 category。
- [x] 确认 assessment id 与目录规范。
- [x] 确认 localStorage `schemaVersion` 和迁移策略。
- [ ] 确认 ruff WASM spike 的成功/降级标准。
- [x] 确认第一批实现 PR 是否只做 schema + 样本，不碰 UI。

## 不要提前做

- 不要在 PR 1 里引入 CodeMirror 或 Pyodide。
- 不要为了凑 9 类矩阵新增 concepts。
- 不要把 ruff WASM 直接写进发布 gate。
- 不要把 progress 证据写进远端或第三方服务。
- 不要把积分、徽章、排行榜作为“激励”塞进 v1.2。
