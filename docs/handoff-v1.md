# Python 知识外脑 v1.0 接手文档

更新日期：2026-06-01

本文件给下一位接手者使用。项目已经从初始 MVP 骨架推进到 v1.0 工程契约收口阶段；当前重点不是继续扩内容，而是守住内容冻结、保持部署可访问、保持 CI 绿灯，并把后续体验打磨放到 v1.x。

## 当前推进到哪一步

当前仓库状态：

- 仓库：`dilititi/python_brain`
- 主分支：`main`
- 最近提交：以 `git ls-remote origin refs/heads/main` 为准
- 内容规模：52 concepts / 18 cases / 7 projects / 6 people / 5 paths
- 技术栈：Astro + MDX + React Islands
- 项目定位：v1.0 工程契约落地后的 Python 知识外脑原型

最新核查证据：

- Vercel 生产站点已上线并验证：`https://python-brain.vercel.app/`。
- 关键路由已验证返回 200：`/`、`/concepts/decorator/`、`/concepts/python-language/`、`/concepts/function-parameters/`、`/relations.json`。
- 本地 static gates 已通过：`validate:relations`、`audit:concepts`、`test`、`test:code-examples`、`build`、`link:check`、`link:external:inventory`。
- `.github/workflows/v1-gates.yml` 已配置 static gates、三页 Lighthouse beacon、手动/定时 external URL monitor。
- GitHub Actions 判定以最新 `main` run 为准：push 事件下 `Static gates` 和 `Lighthouse beacon pages` 必须为 success；`External URL monitor` 在 push 事件中 skipped 属于预期。

本阶段 9 项交付的状态：

| # | 任务 | 当前状态 |
|---|---|---|
| 1 | 完善 new-concept 脚手架 | 已完成第一版，已加内容冻结闸门 |
| 2 | 写 content-guidelines.md | 已完成第一版 |
| 3 | 打磨 3 个概念页为展示标杆 | 已完成第一版，标杆为 `decorator`、`python-language`、`function-parameters` |
| 4 | 部署 main 到 Vercel | 已完成，生产域名为 `https://python-brain.vercel.app/` |
| 5 | 收紧校验（AND + DAG）+ 单测 | 核心 strict 项已完成 |
| 6 | 内容扩到 20/10/5/5 | 已远超，当前 52 concepts 是 MVP 目标的 2.6 倍，应冻结扩张 |
| 7 | 进度点亮 localStorage | 已完成第一版 |
| 8 | 测评题库化 | 已完成第一版，已有 30 题场景题库 |
| 9 | 路径规划（拓扑排序朴素版） | 已完成第一版 |

## v1.0 完成判定 checklist

只有同时满足下面项目，才可以把 v1.0 判定为完成：

- [x] 内容冻结闸门生效：新增 concept 需要显式设置 `PKB_ALLOW_NEW_CONCEPTS=1`。
- [x] 内容规模稳定：当前 52/18/7/6/5 足够验证产品，不再继续堆知识点。
- [x] schema v1 字段已收口：`history[]`、`worksRef[].role`、`language` category、`summary`、`whyImportant` 均已落地。
- [x] 过渡字段已删除：`description`、`expandsTo`、内联 `works[]`、`works.note`、`firstAppeared`、person `links` 等旧字段不再进入数据契约。
- [x] 关系校验阻塞项已落地：prerequisites DAG、works AND、history pep/year、case code version 等失败时阻断。
- [x] 校验错误输出三件套已标准化：文件路径、字段路径、修复建议。
- [x] 本地 gates 可复现通过：`validate:relations`、`audit:concepts`、`test`、`build`、`link:check`。
- [x] Vercel 生产站点可访问，关键页面与 `relations.json` 返回 200。
- [x] GitHub Actions 最新 `main` run 绿灯：`Static gates` 和 `Lighthouse beacon pages` 为 success。
- [x] handoff 已记录部署状态、CI 判定规则、当前风险和接手命令。

不作为 v1.0 硬阻塞：

- External URL monitor。它依赖外部网络，保留为手动或定时监控；push 事件中 skipped 是预期。
- 全量 52 个概念都达到三页标杆质量。v1.0 只要求三页 beacon 可展示、可测试、可作为内容模板。
- 测评后的完整个性化学习体验。当前是第一版路径规划和题库化，不要求 AI 对话与 SM-2 复习系统全部上线。

## 项目现在是什么状态

项目已经不是“教程站骨架”，而是一个以知识图谱为核心的数据驱动站点：

- 内容在 `src/content/`：concepts、cases、projects、people、paths、works-registry。
- schema 在 `src/content.config.ts`，用 Astro Content Collections 和 Zod 收口字段约束。
- 关系索引由 `scripts/build-relations.ts` 构建，输出 `src/generated/relations.json` 和 `dist/relations.json`。
- 关系纯函数在 `src/lib/relation-index.ts`，页面不要重新手写聚合逻辑。
- 概念页布局在 `src/layouts/ConceptLayout.astro`，固定 6 个 Tab：概念定义、代码示例、真实案例、关键人物、经典作品、历史脉络。
- React Islands 在 `src/components/react/`，只保留必要交互。概念页默认只展示当前 Tab，避免非首屏 island 影响 Lighthouse。

当前最重要的设计事实：

- `summary` / `whyImportant` 已是严格字段，不是 warning。
- concept frontmatter 已移除 `description`，列表卡片、SEO 描述和搜索摘要统一使用 `summary`。
- concept 侧作品只使用 `worksRef[]`，内联 `works[]` 已删除。
- `works.note` 已删除，统一使用 `worksRef[].role`。
- `history` 是事件数组，每项用 `year?`、`pep?`、`event`、`source?`，不是单对象。
- `extends` 是唯一延伸字段，`expandsTo` 已删除。
- `language` category 已加入，用于 Python 语言身份、哲学、版本、社区等元层级节点。
- case 旧字段 `difficulty` 已删除，只用 `level`。
- project 旧字段 `outcome` / `difficulty` / `milestones` 已删除；路径 milestone 只存在于 `paths/*.yaml`。
- person 旧字段 `title` / `roles` / `links` 已删除。

## 需要特别注意什么

第一，不要继续扩内容。当前 52 个概念已经是 MVP 目标 20 个的 2.6 倍。继续扩内容会让治理成本高过产品验证收益。若必须新增 concept，需要显式设置：

```bash
PKB_ALLOW_NEW_CONCEPTS=1 npm run new:concept -- --id=X --title=Y --category=Z --level=W
```

第二，所有“已完成”结论必须以源码和命令输出为准。不要只改文档就宣告字段进入 strict。至少同步核对：

- `src/content.config.ts`
- `scripts/validate-relations.ts`
- `scripts/audit-concepts.ts`
- `docs/deployment.md`
- `docs/project-positioning-v1.md`

第三，文档里若出现旧字段名，应当视为迁移遗漏。重点搜索：

```bash
rg -n "expandsTo|works.note|works\\[\\]|difficulty|outcome|firstAppeared|roles|links|description:" docs src scripts tests
```

搜索结果里要区分合法语境：people collection 仍有人物作品 `works`；paths 仍有路径 `milestones`；普通页面标题 `title` 是正常字段。

第四，Vercel 已不再是外部 blocker，但仍要警惕部署状态和 GitHub Actions 状态分离。站点能打开不等于最新 `main` 的 Actions 已绿灯；P0-2 要看最新 `main` run。

第五，不要把参考手册/工具箱混回主导航。当前设计明确不要做工具箱速查；要做也外链。

## 下一步建议

优先级从高到低：

1. 继续观察最新 GitHub Actions `v1 gates`，确保 `Static gates` 和 `Lighthouse beacon pages` 持续绿灯。
2. 决定是否把三页标杆的 `naive` / `standard` / `production` 代码示例要求推广到全部 52 个概念。
3. 继续打磨页面体验：图谱分层、搜索体验、测评推荐落地页。
4. 再做 AI 对话、SM-2 复习、双链笔记等学习支持系统；这些都不应反向污染 v1.0 内容模型。

## 常用验证命令

接手前先跑：

```bash
npm run validate:relations
npm run audit:concepts
npm run test
npm run test:code-examples
npm run build
npm run link:check
npm run link:external:inventory
```

如果要验证 warning-only 语义：

```bash
npm run validate:relations -- --warning-exit-code=2
```

当前预期：

- `validate:relations` 输出 `Relations valid`
- `audit:concepts` 输出 clean；v1.1 已将 codeExamples 缺口升级为 blocking error
- `--warning-exit-code=2` 在没有 warning 时返回 `0`
- content strict 项应返回 `1` 阻断，而不是 warning

## 文件地图

最该看的文件：

- `docs/project-positioning-v1.md`：当前工程定位审查
- `docs/content-guidelines.md`：内容编辑准则
- `docs/deployment.md`：部署和 gate 语义
- `src/content.config.ts`：内容 schema
- `scripts/validate-relations.ts`：关系与内容质量阻塞校验
- `scripts/audit-concepts.ts`：概念字段审计
- `scripts/build-relations.ts`：构建期关系索引输出
- `src/lib/relation-index.ts`：纯函数关系索引
- `src/layouts/ConceptLayout.astro`：6 维概念页布局
- `src/content/works-registry.yaml`：作品稳定元数据

## 当前风险

- 内容已超 MVP，任何新增内容都可能放大维护成本。
- Lighthouse 对首屏交互和 React island 加载很敏感；新增首屏交互前要重新跑三页 beacon。
- 三版本代码示例目前只对三页标杆强制，不代表全部概念都达到同等展示质量。
- 外部 URL 可访问性依赖网络，只适合作为手动或定时监控，不应作为 Vercel build 的硬阻断。

## 接手原则

遇到争议时按这个顺序裁决：

1. 内容模型清晰性 > 功能丰富度
2. 构建期校验 > 运行时容错
3. 静态优先 > 交互优先
4. 数据写一次，关系自动算
5. 学习路径连贯性 > 概念覆盖数

一句话定位：v1.0 现在要守住工程契约和部署绿灯，再进入体验打磨；不要把项目重新拉回“继续堆知识点”的方向。
