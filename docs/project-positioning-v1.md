# Python 知识外脑工程定位审查 v1.0

本文按《Python 知识外脑 · 工程对接 v1.0》审查当前仓库状态，并给出下一阶段定位。当前事实以本工作区源码为准。

## 目录

- [当前定位](#当前定位)
- [设计原则对照](#设计原则对照)
- [Schema 差距](#schema-差距)
- [校验差距](#校验差距)
- [双向索引差距](#双向索引差距)
- [Works 聚合策略](#works-聚合策略)
- [概念页布局差距](#概念页布局差距)
- [Islands 策略对照](#islands-策略对照)
- [内容脚手架差距](#内容脚手架差距)
- [内容编辑准则差距](#内容编辑准则差距)
- [本阶段交付清单定位](#本阶段交付清单定位)
- [近期执行顺序](#近期执行顺序)
- [审查同步清单](#审查同步清单)
- [总结](#总结)

## 当前定位

当前项目已经不是 12/5/3/5 的初始 MVP，而是一个内容规模已经提前扩张、治理层尚未收紧的原型：

- 内容规模：52 concepts / 18 cases / 7 projects / 6 people / 5 paths。
- 架构形态：Astro + MDX + React Islands 已成立。
- 关系机制：已有运行时聚合关系，并已新增构建期 `dist/relations.json` 索引产物。
- 最大风险：内容扩张速度已经超过 schema、校验、脚手架和页面布局契约。

结论：项目当前处于“内容外脑原型可运行，但 v1.0 工程契约未冻结”的阶段。下一步不应继续扩内容，而应先完成设计文档中的 1-3 项。

## 设计原则对照

| 原则 | 当前状态 | 判断 |
|---|---|---|
| 内容模型清晰性 > 功能丰富度 | 内容量已经较多，`works.role`、`history[]`、`language` category、`extends` 已对齐 v1.0 裁决 | 部分满足 |
| 构建期校验 > 运行时容错 | 已有 `validate-relations.ts`，已覆盖 DAG、works AND、history/pep、summary/whyImportant、case standard/pitfalls/extensions、project concepts、person sources/role/field、path milestone cases/projects | 部分满足 |
| 静态优先 > 交互优先 | Astro 静态页面为主，Islands 局部交互 | 满足 |
| 数据写一次，关系自动算 | 概念页反向聚合 cases/projects/people 已成立；works 已确定路径 B（`works-registry.yaml`）但尚未迁移 | 部分满足 |
| 学习路径连贯性 > 概念覆盖数 | 路径已扩展，milestone 已包含 cases/projects；仍缺拓扑规划 | 部分满足 |

## Schema 差距

当前 `src/content.config.ts` 与 v1.0 目标差距较大。

### Concept

当前字段：`title`、`description`、`summary`、`whyImportant`、`definition`、`mentalModel`、`category`、`level`、`tracks`、`prerequisites`、`related`、`extends`、`appliedIn`、`people`、`works`、`history`、`tags`、`updatedAt`、`codeExamples`。

v1.0 缺口：

- `summary` 已补齐 52 个概念并升级为 required，限制 80 字。
- `whyImportant` 已补齐 52 个概念并升级为 required，限制 200 字。
- `extends` 已成为唯一延伸字段，`expandsTo` 兼容层已删除。
- `works` 已正式迁移为 `{title, creator, type, url, role}`，`note` 已删除。
- `history` 保留数组形态，每项为 `{year?, pep?, event, source?}`，用真实标杆页反向验证后裁决优于单对象；`source` 若填写必须为 `https://` URL。
- `tags` 已作为可选默认字段加入，但未全量补内容。
- `updatedAt` 已作为可选日期字段加入，但旧内容未全量补齐。

字段语义边界仍需继续收敛：

- `description` 是旧列表页/SEO 描述字段，标记为 deprecated；后续迁移脚本 `scripts/migrate-description-to-summary.ts` 负责清理仍依赖 `description` 的内容，再从 schema 删除。
- `summary` 是必填的 80 字以内一句话定义。
- `definition` 承载核心解释；更长解释进入 MDX 正文。
- `mentalModel` 是一句话心智模型或类比，可选但应避免和 `summary` 重复。
- `whyImportant` 是必填的 200 字以内场景价值。

定位：Concept schema 已完成关键字段裁决，`summary` / `whyImportant` 已进入阻塞校验；但 52 个概念远超 20 个 MVP 目标，仍必须冻结扩张，优先继续收紧 case 和 person 质量门禁。

### Case

当前字段：`title`、`description`、`scenario`、`level`、`difficulty`、`tracks`、`concepts`、`project`、`projects`、`libraries`、`people`、`sourceUrl`、`codeVersions`、`pitfalls`、`extensions`。

v1.0 剩余：

- 旧 `difficulty` 字段仍作为兼容别名保留，后续可删除，只保留 `level`。

定位：Case 已完成 `level`、`concepts.length >= 2`、`standard` code version、`project?`、`pitfalls[]` 和 `extensions[]` 迁移；旧 `difficulty` 暂作兼容字段保留，后续可在页面和内容稳定后删除。

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

定位：Project 已强制 `concepts.length >= 3`，能做关系承载；下一步是补 type/stage/structure/coreFlow/upgradePath，让它成为可执行项目模板。

### Person

当前字段：`name`、`title`、`role`、`field`、`description`、`roles`、`concepts`、`works`、`sources`、`links`。

v1.0 缺口：

- 未明确 `quote?`。

定位：人物页已补 `role`、`field`、`sources[]` 并进入阻塞校验；`title`/`roles` 作为兼容字段暂留，后续只需决定 `quote?` 是否进入展示面。

### Path

当前 milestones 为 `{title, nodes[], cases[], projects[]}`。

v1.0 缺口：

- 仍缺朴素拓扑排序路径规划。

定位：路径已经形成“概念 -> 案例 -> 项目”的学习闭环；下一步是把测评结果和前置图结合，生成个性化拓扑序列。

## 校验差距

当前 `scripts/validate-relations.ts` 已检查：

- 引用完整性。
- 最低内容数量。
- prerequisites DAG 无环检测。
- concept 至少被一个 case 覆盖。
- concept 必须至少有一个 work，且每个 work 必须有有效 `role`。
- summary / whyImportant 必须非空、非 TODO-like。
- history 事件必须有 `event`，必须含 `year` 或 `pep`，`pep` 必须匹配 `PEP \d+`。
- history `source` 若存在必须是 `https://` URL。
- case 必须 `concepts >= 2`，且必须包含有用的 `standard` code version。
- case 必须包含至少一个 `pitfalls[]` 和 `extensions[]`。
- case 至少支撑一个 project。
- person 至少连接 3 个 concept。
- project 至少连接 3 个 concept。
- person 必须有 `role` 和 `field`。
- person 必须包含至少一个 `sources[]`，且来源 URL 必须是 `https://`。
- path milestone 必须包含至少一个 case 和 project。
- 整张内容图连通。

v1.0 仍缺：

- 孤立节点只 warning 不阻塞的输出分层；约定本地 warning 退出码保持 0，CI 可用 `--warning-exit-code=2` 标记 warning-only 状态并发送通知，但不阻断 merge。
- 错误输出需要更系统地包含文件路径和具体字段。

定位：现有校验方向正确，但还停留在“关系完整性校验”，未达到“内容质量门禁”。

## 双向索引差距

当前 `src/lib/relations.ts` 仍支持页面渲染时读取集合并聚合，同时已通过 `src/lib/relation-index.ts` 提供纯函数关系索引：

- concept prerequisites / related / extends。
- cases / projects / people 的反向挂载。
- path concepts。
- `conceptUsedIn(id)`、`caseUsedIn(id)`、`personPortfolio(id)`、`conceptNeighbors(id)`。
- `npm run build` 会在 Astro 静态构建后生成 `dist/relations.json`。
- `dist/relations.json` 带 MD5 `contentHash`。
- `tests/relation-index.test.ts` 覆盖增删改场景。

v1.0 仍缺：

- 概念页和图谱页尚未切换为消费构建期索引产物，当前仍保留运行时聚合路径。

定位：构建期关系索引产物已成立，下一步是让页面读取同一份索引，进一步落实“数据写一次，关系自动算”。

## Works 聚合策略

当前 works 仍以内联数组挂在 concept 上，无法像 case/person 一样通过 `concepts[]` 反向聚合。v1.0 采用低迁移成本的路径 B：

- 新增 `src/content/works-registry.yaml` 作为作品注册表，集中保存 `id`、`title`、`creator`、`type`、`url` 等稳定元数据。
- concept 侧逐步从内联 `works[]` 迁移为 `worksRef[]` + 概念内的 `role` 说明。
- 关系索引从 registry + concept 引用生成作品维度；未来若需要作品独立页，再把 YAML 拆为 `src/content/works/*.mdx`。

注册表字段草案：

```yaml
- id: flask
  title: Flask
  creator:
    personId: armin-ronacher
  type: framework
  url: https://flask.palletsprojects.com/
```

- `id`：稳定 slug，作为 `worksRef[].id` 的引用目标。
- `title`：作品展示名。
- `creator`：优先使用 `{ personId }` 指向 people collection；无法对应现有人物节点时允许 `{ name }` 字符串回退。
- `type`：枚举，初始值为 `library`、`framework`、`tool`、`book`、`talk`、`project`。
- `url`：必须是 `https://` URL；可访问性进入后续 link check。

迁移期规则：

- `worksRef[]` 和内联 `works[]` 可短期共存，页面渲染和关系索引合并两者，并按 `id` 或 `title` 去重。
- 若同一作品同时来自 `worksRef[]` 与 `works[]`，以 `worksRef[]` 的 registry 元数据为准，概念侧 `role` 仍必须保留。
- 校验脚本在迁移期同时检查两类来源的 `role`。
- 迁移完成标准是所有 concept 的内联 `works[]` 长度为 0，之后从 schema 删除内联 `works` 字段。

这条路径保留了“数据写一次”的方向，同时避免立刻把现有 52 个概念里的 works 全量拆文件。

## 概念页布局差距

当前 `src/layouts/ConceptLayout.astro` 已改为固定 6 Tab 工作台，默认保留完整 DOM，前端脚本只负责同页 anchor 切换和显隐。

已满足：

- 6 个维度已经按固定顺序渲染：定义、代码、案例、人物、作品、历史。
- Tab 使用同页 anchor；无 JS 时仍能抓取完整内容，JS 启动后只显示当前面板。
- 空维度显示“暂未整理”，并在浏览器 console 输出对应 facet warning。
- 前置、相关、延伸已移到右侧吸顶关系栏。
- CodeRunner 使用 `client:visible`。
- 案例、人物可由 relations 自动聚合。

未满足：

- 作品维度仍主要来自 concept frontmatter，不是后 3 维完全自动聚合。
- 代码示例未体现 naive / standard / production 三版本。

定位：页面布局已达到 v1.0 固定 6 维展示契约；剩余差距集中在 worksRegistry 迁移和代码示例版本分层。

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

- 支持 `--id`、`--title`、`--category`、`--level`。
- 生成 v1.0 字段模板：`extends`、`works.role`、`history[].event`。
- 自动填 `updatedAt`。
- 生成后默认运行关系校验，并列出待补字段。
- 已加内容冻结闸门：写入新概念必须显式设置 `PKB_ALLOW_NEW_CONCEPTS=1`。

定位：脚手架第一版已完成。后续随 works registry、person quote 和 path planner 继续微调。

## 内容编辑准则差距

当前仓库已有 `docs/content-guidelines.md` 第一版。

定位：本阶段第 2 项已完成基础交付。后续应在三页标杆打磨中继续补充更具体的案例来源、作品 role 和历史写法示例。

## 本阶段交付清单定位

| # | 任务 | 当前状态 | 建议 |
|---|---|---|---|
| 1 | 完善 new-concept 脚手架 | 已完成第一版 | 后续随 schema 冻结微调 |
| 2 | 写 content-guidelines.md | 已完成第一版 | 后续随标杆页补细则 |
| 3 | 打磨 3 个概念页为展示标杆 | 已完成第一版 | 已选 `decorator`、`python-language`、`function-parameters`，固定 6 Tab 布局已补 |
| 4 | 部署 main 到 Vercel | 配置已补，待外部部署确认 | 已添加 `vercel.json` 和部署说明；当前环境无 Vercel 登录态或 token |
| 5 | 收紧校验（AND + DAG）+ 单测 | 核心 strict 项已完成 | 已覆盖 AND、DAG、summary/whyImportant、case standard/pitfalls/extensions、project concepts、person sources/role/field、path milestone cases/projects |
| 6 | 内容扩到 20/10/5/5 | 已远超（concepts 2.6x） | 当前 52/18/7/6/5，暂停扩内容 |
| 7 | 进度点亮 localStorage | 未完成 | 4-5 后做 |
| 8 | 测评题库化 | 未完成 | 4-5 后做 |
| 9 | 路径规划拓扑排序 | 未完成 | 4-5 后做 |

## 近期执行顺序

### P0：冻结内容扩张

在 schema、脚手架、标杆页完成前，不再继续扩概念数量。当前 52/18/7/6/5 已远超 MVP 目标，足够验证系统，也反过来强化了冻结扩张的必要性。

### P1：脚手架与编辑准则

已完成第一版：

1. `new-concept.ts` 支持 `--id`、`--title`、`--category`、`--level`。
2. 生成带 6 维占位和 naive / standard / production 代码版本的模板。
3. 自动写入 `updatedAt`。
4. 生成后默认运行关系校验，并列出待补字段。
5. 已新增 `docs/content-guidelines.md`。

内容冻结策略已落地：`new-concept.ts` 写入新文件前检查 `PKB_ALLOW_NEW_CONCEPTS=1`。脚手架只生成 v1.0 字段：`extends`、`works.role`、`history[].event`。

### P2：三页标杆反推 schema

已完成第一版：

- `decorator`：验证六维模型、作品、历史、人物、框架案例。
- `python-language`：验证 `language` 元层级、版本、PSF、哲学。
- `function-parameters`：验证 Basic Syntax 层、代码三版本、真实案例。

反推发现：

- `summary` 和 `whyImportant` 值得在概念页 Definition 区直接展示，否则 v1.0 字段只参与校验、不参与学习体验。
- `works.note` 已正式迁移为 `works.role`，避免把“概念中的作用”降级成普通备注。
- 现有 `history` 数组能表达多事件时间线，比单对象更适合历史脉络；v1.0 schema 保留数组形态，要求每项含 `year` 或 `pep`，并用 `event` 解释事件影响。
- `extends` 与 `expandsTo` 已合并，当前 schema 和关系代码只保留 `extends`。

### P3：收紧校验

已完成：

- `summary` / `whyImportant` 已从 warning 升级为 error，并在 schema 中改为 required。
- case `concepts >= 2` 与 `standard` code version 已进入 schema 和关系校验。
- case `pitfalls[]` / `extensions[]` 已进入 schema 和关系校验。
- project `concepts >= 3` 已进入 schema 和关系校验。
- person `sources >= 1` 已进入 schema 和关系校验，且 URL 必须是 `https://`。
- person `role` / `field` 已进入 schema 和关系校验。
- path milestone `cases[]` / `projects[]` 已进入 schema 和关系校验。

剩余收紧项：

- `description` 字段仍需后续删除；迁移脚本 `scripts/migrate-description-to-summary.ts` 负责清理仍依赖 `description` 的概念。
- 旧兼容字段清理：case `difficulty`、person `title` / `roles` / `links`。
- person `quote?` 是否进入展示面。

works AND、prerequisites DAG、summary/whyImportant、case standard/pitfalls/extensions、project concepts、person sources/role/field、path milestone cases/projects 已经是阻塞校验。剩余收紧项主要是兼容字段清理和展示体验，不再阻塞当前 v1.0 内容治理。

## 审查同步清单

每次更新本审查文档或工程契约时，先做一次跨文档关键词检查：

- 内容规模数字保持 `52/18/7/6/5` 一致，不再残留旧快照。
- 已完成校验项 `DAG` / `works AND` 在原则表、校验差距、交付清单、P3 列表中状态一致。
- schema 字段名保持 `year` / `pep` / `event` / `source`，不再使用 `firstAppeared`。
- works 路径 B 在原则表和策略段都表达为“已决策，未迁移”。
- `validate-relations` 退出码语义在脚本帮助文本和部署文档中一致。

## 总结

当前项目最准确的位置是：可运行的知识外脑原型，内容已超 MVP，但工程契约未冻结。下一阶段不是继续追求覆盖数，而是把 v1.0 的 schema、脚手架、编辑准则和 3 个标杆概念页做实。否则后续内容越多，迁移成本越高。
