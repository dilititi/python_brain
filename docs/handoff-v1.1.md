# Python 知识外脑 v1.1 接手文档

更新日期：2026-06-01

本文件接在 v1.0 工程契约之后，专门记录“工作 1：概念代码示例补齐计划”。v1.1 的目标不是继续扩知识点，而是把现有 52 个概念的代码示例质量拉齐，让概念页的“代码”维度从可展示变成可验证。

## 当前真实状态

- 内容规模：52 个 concepts。
- 字段边界：concept 使用 `codeExamples`；case 使用 `codeVersions`。不要把 `codeVersions` 引入 concept。
- 已有三版本概念：13 个。
- v1.1 批次待处理概念：39 个。其中 37 个非 `language` 概念需要补齐三版本，并会在当前 audit 中触发 codeExamples warning；2 个 `language` 概念已各有一段展示代码，但仍安排在 Week 8 复核并按需要补写。
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

Week 1-7 共补 37 个非 `language` 概念，Week 8 复核并按需要补写 2 个 `language` 展示性代码，Week 9 复核已有 13 个，合计 52 个。

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
| Week 9 | 复核已有 13 个 | `common-stdlib-modules`、`cross-platform-community`、`decorator`、`dunder-methods`、`dynamic-strong-typing`、`encapsulation`、`function-parameters`、`interpreter-runtime`、`module-search-path`、`package-structure`、`polymorphism`、`programming-paradigms`、`python-language` |

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

每周完成后新增 `docs/v1.1-batch-notes/week-N.md`，记录本周概念、难点、复用范式、下一周提醒和跑过的命令。

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
- [ ] Week 1-7 的 37 个非 `language` 概念补齐三版本。
- [ ] Week 8 的 2 个 `language` 概念完成展示性代码复核。
- [ ] Week 9 的 13 个已有完整概念复核完成。
- [ ] `npm run audit:concepts -- --strict-code-examples` 返回 0。
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

当前预期：默认 `audit:concepts` 不因 codeExamples warning 阻断；strict 模式在 37 个非 `language` 概念补齐前应该失败。Week 8 的 2 个 `language` 概念不一定触发 audit warning，但仍要按展示性代码标准复核。
