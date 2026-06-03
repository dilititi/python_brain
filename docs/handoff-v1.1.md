# Python 知识外脑 v1.1 接手文档

更新日期：2026-06-02

本文件接在 v1.0 工程契约之后，专门记录“工作 1：概念代码示例补齐计划”。v1.1 的目标不是继续扩知识点，而是把现有 52 个概念的代码示例质量拉齐，让概念页的“代码”维度从可展示变成可验证。

## 当前真实状态

- 内容规模：52 个 concepts。
- 字段边界：concept 使用 `codeExamples`；case 使用 `codeVersions`。不要把 `codeVersions` 引入 concept。
- 已有三版本概念：13 个。
- v1.1 批次待处理概念：Week 1-8 已完成 39 个；Week 9 剩余 13 个已有完整概念复核与发布收尾。
- 当前阶段：warning 阶段。`npm run audit:concepts` 列出 codeExamples 缺口但不阻断；`npm run audit:concepts -- --strict-code-examples` 用于模拟 v1.1 strict gate。
- 已新增运行测试：`npm run test:code-examples` 会用 Pyodide 运行所有 `runnable !== false` 的 concept codeExamples。

## 完成目标

v1.1 完成时必须满足：

- 37 个非 `language` 待补概念全部拥有 `naive`、`standard`、`production` 三段示例。
- 2 个 `language` 概念确认拥有至少一段可在 Pyodide 跑通且有可观察输出的展示性代码，并完成文案与节点关系复核。
- 13 个已有完整概念完成复核，质量、运行性和文案风格与新补批次一致。
- `npm run audit:concepts -- --strict-code-examples` 返回 0。
- `npm run test:code-examples` 返回 0。

## 批次清单

Week 1-7 共补 37 个非 `language` 概念，Week 8 复核并打磨 2 个 `language` 展示性代码，Week 9 复核已有 13 个并完成发布收尾，合计 52 个。

| 周次 | category | 概念 |
|---|---|---|
| Week 1 | `syntax` | `variable`、`f-string`、`operators`、`type-annotations`、`type-casting`、`walrus-operator` |
| Week 2 | `control-flow` | `break-continue-pass`、`comprehension`、`for-loop`、`if-statement`、`match-case`、`raise-assert-finally`、`try-except`、`while-loop` |
| Week 3 | `data-structure` | `bytes`、`dict`、`list`、`primitive-types`、`range`、`set`、`string`、`tuple` |
| Week 4 | `function` | `builtin-functions`、`closure`、`function`、`lambda`、`scope` |
| Week 5 | `module-eng` | `import-syntax`、`module`、`pip`、`venv` |
| Week 6 | `oop` | `class`、`dataclass`、`inheritance` |
| Week 7 | `stdlib` | `json`、`pathlib`、`regular-expression` |
| Week 8 | `language` | `python-philosophy`、`python-versions` |
| Week 9 | 复核与发布 | 复核已有 13 个：`common-stdlib-modules`、`cross-platform-community`、`decorator`、`dunder-methods`、`dynamic-strong-typing`、`encapsulation`、`function-parameters`、`interpreter-runtime`、`module-search-path`、`package-structure`、`polymorphism`、`programming-paradigms`、`python-language`；再完成 paths/cases/标杆字段试写、Lighthouse 减负、codeExamples strict 化和 `v1.1.0` tag |

Week 8 的关系要提前守住：`python-language` 是总枢节点；`python-philosophy` 和 `python-versions` 是其下游元层级节点，分别承接设计哲学和版本生命周期，不重复解释语言身份总览。

## 写作标准

非 `language` 概念：

- `naive`：暴露真实新人问题，不能只是把 `standard` 写差。
- `standard`：推荐教学版本，清楚展示当前概念。
- `production`：从 `standard` 演进，并至少包含异常处理、类型注解、日志或边界条件之一。
- 三版本必须围绕同一场景逐步演进；`production` 不能换成无关实现思路。

`language` 概念：

- 不强求 `naive` / `standard` / `production`。
- 至少一段展示性代码必须可在 Pyodide 跑通且有可观察输出。
- 优先选择 `import this`、`import sys; print(sys.version_info)` 这类能说明语言身份、哲学、版本或运行时行为的代码。
- 禁止只写注释、伪代码或不可执行演示文本。

Week 9 复核标准：

- 三版本能否通过 `npm run test:code-examples`。
- `naive` 是否真的暴露问题。
- `production` 是否包含至少一项工程化要素：异常处理、类型注解、日志或边界条件。
- 三版本之间是否连贯，`production` 必须是 `standard` 的演进。
- 文案风格是否和 Week 1-8 新补内容一致。

Week 9 收尾范围：

- 复核 13 个已有完整概念，防止早期三版本成为质量洼地。
- 给 5 条 paths 补 `forWhom` / `notForWhom` / `opportunityCost`，明确路径适合谁、不适合谁、机会成本是什么。
- 复核 18 个 cases 的 `pitfalls`，重点检查是否写出真实代价，而不是语法注意事项。
- 做小规模标杆字段试写：`decorator` 试写 `requiresMindset`，Guido van Rossum 试写 `earlyCareer`，只作为 v1.2 字段验证样本，不全量铺开。
- 排查 `decorator` 页首屏负担，把 Lighthouse Performance 余量从 88-91 抬到 93+。优先检查 CodeRunner 是否可延迟到代码区挂载、三版本代码块是否默认只展示 `standard`、works/media 是否 lazy load。
- 完成 codeExamples strict 化，跑全量 gates，推 `v1.1-rc` PR，绿灯后合并并打 `v1.1.0` annotated tag。

每周完成后新增 `docs/v1.1-batch-notes/week-N.md`，记录本周概念、难点、复用范式、下一周提醒和跑过的命令。

## 用户反馈处理与建议审核

2026-06-01 的用户反馈分成两类：

- P0 体验缺陷：入口测评选项顺序暴露答案、从应用方向进入概念后缺少下一条/返回、图谱过密、`Paths` 文案生硬。这些属于当前产品体验问题，应直接修。
- Schema/内容建议：`requiresMindset`、`pitfalls` 质量、`earlyCareer`、path `forWhom/notForWhom/opportunityCost`、历史事件集合。这些需要按 v1.1 范围控制，不应一次性全塞进 codeExamples 主线。

审核结论：

- `requiresMindset`：方向成立，已作为 optional 字段在 `decorator` 做标杆试写；不在 v1.1 全量迁移，v1.2 再决定是否推广到更多概念。
- `cases.pitfalls`：已有字段，问题是写作质量。已在 `content-guidelines.md` 补充“写代价而不是语法注意事项”的准则；18 个 cases 的 pitfalls 复核可放到 Week 9。
- `people.earlyCareer`：适合 v1.2，已作为 optional 字段在 Guido van Rossum 做标杆试写；Wes McKinney 留到 v1.2 继续验证，不接受第三方传记式二手描述作为唯一来源。
- path `forWhom/notForWhom/opportunityCost`：产品价值高，放进 Week 9 复核范围，5 条 paths 全量补齐；仍需避免和 codeExamples strict 发布日混成不可回滚的大补丁。
- `historicalEvents` collection：先不建 collection。更轻的试探方案是给 concept `history[]` 增加可选 `eventId`，当复用超过 10 次再考虑独立集合和页面。

## 非目标边界

v1.1 不做这些事：

- 不把内容规模从 52 推到 80+，继续守内容冻结。
- 不引入新框架或新技术栈，继续使用 Astro + MDX + 必要 React island。
- 不做用户系统或跨设备同步。
- 不接入需要 API key 的外部服务，除非先有明确预算和运维计划。
- 不给 schema 枚举里的 `file-io`、`third-party` 安排独立周次；当前没有对应概念。

## 发布日 strict 化步骤

1. 跑 `npm run audit:concepts -- --strict-code-examples`，必须返回 0。
2. 跑 `npm run test:code-examples`，必须返回 0。
3. 修改 `src/content.config.ts`：把 `codeExamples` strict 化，并保留 `language` category 豁免。
4. 修改 `scripts/validate-relations.ts`：把 codeExamples 缺失从 warning 升级为 blocking error，并保持 `language` 豁免。
5. 更新 `docs/content-guidelines.md`：删除 warning 阶段表述，保留复核标准。
6. 更新 `docs/deployment.md`：把 codeExamples 加入严格字段清单。
7. 更新本文件的完成判定 checklist。
8. 跑全量 gates：`validate:relations`、`audit:concepts`、`test`、`test:code-examples`、`build`、`link:check`、`link:external:inventory`。
9. 推 `v1.1-rc` 分支并开 PR，等 GitHub Actions 绿灯后再合并到 `main`。
10. 验证 Vercel production：三页标杆、5 个新补概念页、`/relations.json` 返回 200。
11. 打 annotated tag：`v1.1.0`。

## 当前 checklist

- [x] `audit:concepts` 支持 codeExamples warning 阶段。
- [x] `audit:concepts -- --strict-code-examples` 支持 strict 模拟。
- [x] `test:code-examples` 已新增，并能运行当前 runnable 示例。
- [x] `docs/deployment.md` 已加入 `test:code-examples` 部署前置条件。
- [x] `docs/content-guidelines.md` 已写入三版本质量标准和 `language` 展示性代码规则。
- [x] `docs/v1.1-batch-notes/` 已加入周批次笔记模板。
- [x] Week 1-7 的 37 个非 `language` 概念补齐三版本。
- [x] Week 8 的 2 个 `language` 概念完成展示性代码复核。
- [x] Week 9 paths/cases 复核和标杆字段试写完成。
- [x] Week 9 的 13 个已有完整概念复核完成。
- [x] `npm run audit:concepts -- --strict-code-examples` 返回 0。
- [ ] `src/content.config.ts` strict 化完成。
- [ ] `scripts/validate-relations.ts` strict 化完成。
- [ ] GitHub Actions v1 gates 在 `v1.1-rc` PR 绿灯。
- [ ] Vercel production 抽样验证完成。
- [ ] `v1.1.0` annotated tag 已创建。

## 常用命令

```bash
npm run audit:concepts
npm run audit:concepts -- --strict-code-examples
npm run test:code-examples
npm run validate:relations
npm run test
npm run build
npm run link:check
npm run link:external:inventory
```

当前预期：默认 `audit:concepts` 不因 codeExamples warning 阻断；Week 8 结束后 `npm run audit:concepts -- --strict-code-examples` 应返回 0。Week 9 strict 化前仍需把这一事实写回 schema、`validate-relations` 和部署文档。
