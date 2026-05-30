# Python 知识外脑工程定位审查 v1.0

本文按《Python 知识外脑 · 工程对接 v1.0》审查当前仓库状态，并给出下一阶段定位。当前事实以本工作区源码为准。

## 当前定位

当前项目已经不是 12/5/3/5 的初始 MVP，而是一个内容规模已经提前扩张、治理层尚未收紧的原型：

- 内容规模：42 concepts / 18 cases / 7 projects / 6 people / 5 paths。
- 架构形态：Astro + MDX + React Islands 已成立。
- 关系机制：已有运行时聚合关系，但尚未按设计生成 `dist/relations.json`。
- 最大风险：内容扩张速度已经超过 schema、校验、脚手架和页面布局契约。

结论：项目当前处于“内容外脑原型可运行，但 v1.0 工程契约未冻结”的阶段。下一步不应继续扩内容，而应先完成设计文档中的 1-3 项。

## 设计原则对照

| 原则 | 当前状态 | 判断 |
|---|---|---|
| 内容模型清晰性 > 功能丰富度 | 内容量已经较多，schema 已开始补 v1.0 过渡字段，但旧字段仍并存 | 部分满足 |
| 构建期校验 > 运行时容错 | 已有 `validate-relations.ts`，但未覆盖 DAG、summary/whyImportant、standard code version 等 v1.0 约束 | 部分满足 |
| 静态优先 > 交互优先 | Astro 静态页面为主，Islands 局部交互 | 满足 |
| 数据写一次，关系自动算 | 概念页会反向聚合 cases/projects/people，但 works 仍主要手写在 concept | 部分满足 |
| 学习路径连贯性 > 概念覆盖数 | 路径已扩展，但未包含 milestone cases/projects，也没有拓扑规划 | 部分满足 |

## Schema 差距

当前 `src/content.config.ts` 与 v1.0 目标差距较大。

### Concept

当前字段：`title`、`description`、`summary`、`whyImportant`、`definition`、`mentalModel`、`category`、`level`、`tracks`、`prerequisites`、`related`、`extends`、`expandsTo`、`appliedIn`、`people`、`works`、`history`、`tags`、`updatedAt`、`codeExamples`。

v1.0 缺口：

- `summary` 已作为可选字段加入并限制 80 字，但未全量迁移、未强制必填。
- `whyImportant` 已作为可选字段加入并限制 200 字，但未全量迁移、未强制必填。
- 已加入 `extends`，但现有关系代码仍使用 `expandsTo`，两者处于过渡并存状态。
- `works` 当前是 `{title, creator, type, url, note}`，设计文档要求 `{name, url, role}`。
- `history` 当前是数组，设计文档要求对象 `{firstAppeared, pep, note}`。
- `tags` 已作为可选默认字段加入，但未全量补内容。
- `updatedAt` 已作为可选日期字段加入，但旧内容未全量补齐。

定位：Concept schema 需要作为第 3 项“标杆概念页”前的反向验证重点。若直接强改 schema，现有 42 个概念会大量失败；推荐先更新脚手架和 3 个标杆概念，再迁移其余内容。

### Case

当前字段：`title`、`description`、`scenario`、`difficulty`、`tracks`、`concepts`、`projects`、`people`、`sourceUrl`、`code`。

v1.0 缺口：

- `difficulty` 应迁移或映射为 `level`。
- 缺 `libraries`。
- 缺单数 `project?`，当前是 `projects[]`。
- 缺 `codeVersions[]`，也未强制存在 `standard` 版本。
- 缺 `pitfalls[]`。
- 缺 `extensions[]`。
- 未在 schema 层强制 `concepts.length >= 2`。

定位：Case 是“代码示例三版本化”的核心改造对象。当前案例更像简短说明，不足以支撑生产版概念页。

### Project

当前字段：`title`、`description`、`outcome`、`difficulty`、`tracks`、`concepts`、`cases`、`people`、`milestones`。

v1.0 缺口：

- 缺 `type`。
- 缺 `stage`。
- `outcome` 应迁移为 `finalOutput` 或保留为别名。
- 缺 `youWillLearn[]`。
- 缺 `structure`。
- 缺 `coreFlow[]`。
- 缺 `upgradePath[]`。
- 未在 schema 层强制 `concepts.length >= 3`。

定位：Project 现在能做关系承载，但还不是可执行项目模板。

### Person

当前字段：`name`、`title`、`description`、`roles`、`concepts`、`works`、`links`。

v1.0 缺口：

- `title`/`roles` 应整理成 `role`。
- 缺 `field`。
- 缺 `sources[]`，当前 `links[]` 不等价。
- 未强制 `sources.length >= 1`。
- 未明确 `quote?`。
- 未在 schema 层强制 `concepts.length >= 3`。

定位：人物页目前是叙事锚点，但来源可信度规则还没有落地。

### Path

当前 milestones 只有 `{title, nodes[]}`。

v1.0 缺口：

- milestone 缺 `cases[]`。
- milestone 缺 `projects[]`。

定位：路径仍是概念序列，还没有形成“概念 -> 案例 -> 项目”的学习闭环。

## 校验差距

当前 `scripts/validate-relations.ts` 已检查：

- 引用完整性。
- 最低内容数量。
- concept 至少被一个 case 覆盖。
- case 至少支撑一个 project。
- person 至少连接 3 个 concept。
- 整张内容图连通。

v1.0 仍缺：

- prerequisites DAG 无环检查。
- concept 必须 `cases >= 1 AND works >= 1`。
- `summary` / `whyImportant` 非空非 TODO。
- `history.pep` 若填必须匹配 `PEP \d+`。
- case 必须 `concepts >= 2`。
- case 必须包含 `standard` code version。
- person 必须 `sources >= 1`。
- 孤立节点只 warning 不阻塞的输出分层。
- 错误输出需要更系统地包含文件路径和具体字段。

定位：现有校验方向正确，但还停留在“关系完整性校验”，未达到“内容质量门禁”。

## 双向索引差距

当前 `src/lib/relations.ts` 在页面渲染时读取集合并聚合：

- concept prerequisites / related / expandsTo。
- cases / projects / people 的反向挂载。
- path concepts。

v1.0 仍缺：

- 构建期一次性序列化 `dist/relations.json`。
- `conceptUsedIn(id)`。
- `caseUsedIn(id)`。
- `personPortfolio(id)`。
- `conceptNeighbors(id)` 中的 successors。
- MD5 内容哈希缓存 key。
- 单元测试覆盖增删改。

定位：现在是“运行时关系服务”，不是设计文档要求的“构建期关系索引产物”。

## 概念页布局差距

当前 `src/layouts/ConceptLayout.astro` 是连续 section，不是固定 Tab。

已满足：

- 6 个维度已经按顺序渲染：定义、代码、案例、人物、作品、历史。
- CodeRunner 使用 `client:visible`。
- 案例、人物可由 relations 自动聚合。

未满足：

- 不是 Tab UI。
- 没有同页 anchor + JS 显隐。
- 空维度没有“暂未整理”和 console warning。
- 右侧没有吸顶前置/相关/延伸。
- 作品维度仍主要来自 concept frontmatter，不是后 3 维完全自动聚合。
- 代码示例未体现 naive / standard / production 三版本。

定位：页面已经验证了 6 维模型，但尚未达到 v1.0 固定布局契约。

## Islands 策略对照

| 组件 | 设计要求 | 当前状态 |
|---|---|---|
| SearchBox | `client:idle` | 满足 |
| GraphView | `client:visible` | 当前为 `client:load`，需调整 |
| CodeRunner | `client:visible` | 满足 |
| AssessmentQuiz | `client:load` | 满足 |

localStorage：

- `pkb:mastery` 未实现。
- `pkb:assessment` 未实现。

定位：加载策略基本正确，但进度点亮和测评持久化还没开始。

## 内容脚手架差距

当前 `scripts/new-concept.ts`：

- 只接收位置参数 `<slug>` 和标题。
- 生成旧 schema 模板。
- 不支持 `--id`、`--title`、`--category`、`--level`。
- 不自动填 `updatedAt`。
- 不生成 v1.0 六维占位。
- 生成后不立即跑校验。

定位：这是本阶段第 1 优先级。继续扩内容前必须先修脚手架。

## 内容编辑准则差距

当前仓库已有 `docs/content-guidelines.md` 第一版。

定位：本阶段第 2 项已完成基础交付。后续应在三页标杆打磨中继续补充更具体的案例来源、作品 role 和历史写法示例。

## 本阶段交付清单定位

| # | 任务 | 当前状态 | 建议 |
|---|---|---|---|
| 1 | 完善 new-concept 脚手架 | 已完成第一版 | 后续随 schema 冻结微调 |
| 2 | 写 content-guidelines.md | 已完成第一版 | 后续随标杆页补细则 |
| 3 | 打磨 3 个概念页为展示标杆 | 已完成第一版 | 已选 `decorator`、`python-language`、`function-parameters`，后续可随 Tab 布局继续微调 |
| 4 | 部署 main 到 Vercel | 配置已补，待外部部署确认 | 已添加 `vercel.json` 和部署说明；当前环境无 Vercel 登录态或 token |
| 5 | 收紧校验（AND + DAG）+ 单测 | 部分完成 | 等标杆概念反向验证 schema 后做 |
| 6 | 内容扩到 20/10/5/5 | 已超过 | 暂停扩内容 |
| 7 | 进度点亮 localStorage | 未完成 | 4-5 后做 |
| 8 | 测评题库化 | 未完成 | 4-5 后做 |
| 9 | 路径规划拓扑排序 | 未完成 | 4-5 后做 |

## 近期执行顺序

### P0：冻结内容扩张

在 schema、脚手架、标杆页完成前，不再继续扩概念数量。当前 42/18/7/6 足够验证系统。

### P1：脚手架与编辑准则

已完成第一版：

1. `new-concept.ts` 支持 `--id`、`--title`、`--category`、`--level`。
2. 生成带 6 维占位和 naive / standard / production 代码版本的模板。
3. 自动写入 `updatedAt`。
4. 生成后默认运行关系校验，并列出待补字段。
5. 已新增 `docs/content-guidelines.md`。

保留过渡策略：当前脚手架同时生成 `extends` 与 `expandsTo`，以兼容 v1.0 目标字段和现有关系代码。待 schema 正式迁移后，删除 `expandsTo` 兼容层。

### P2：三页标杆反推 schema

已完成第一版：

- `decorator`：验证六维模型、作品、历史、人物、框架案例。
- `python-language`：验证 Foundation 层、版本、PSF、哲学。
- `function-parameters`：验证 Basic Syntax 层、代码三版本、真实案例。

反推发现：

- `summary` 和 `whyImportant` 值得在概念页 Definition 区直接展示，否则 v1.0 字段只参与校验、不参与学习体验。
- 现有 `works.note` 已经被用来承担 `works.role`，下一步 schema 迁移时应正式改名，避免语义含混。
- 现有 `history` 数组能表达多事件时间线，比单对象 `{firstAppeared, pep, note}` 更适合历史脉络；建议 v1.0 schema 保留数组形态，但要求至少一项含 `firstAppeared` 或 `pep` 语义。
- `extends` 与 `expandsTo` 需要尽快合并，当前只是过渡兼容。

### P3：收紧校验

在三页标杆完成后再强制：

- `summary` / `whyImportant`。
- works AND。
- DAG。
- case `standard` version。
- person `sources`。

这样可以避免一次性把 42 个概念全部打红，导致生产停摆。

## 总结

当前项目最准确的位置是：可运行的知识外脑原型，内容已超 MVP，但工程契约未冻结。下一阶段不是继续追求覆盖数，而是把 v1.0 的 schema、脚手架、编辑准则和 3 个标杆概念页做实。否则后续内容越多，迁移成本越高。
