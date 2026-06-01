# Python 知识外脑 v1.0 接手文档

更新日期：2026-05-31

本文件给下一位接手者使用。项目已经从初始 12/5/3/5 MVP 骨架推进到 v1.0 工程契约基本落地阶段；当前重点不是继续扩内容，而是保持内容冻结、完成外部部署确认，并继续收紧少数遗留体验项。

## 当前推进到哪一步

当前仓库状态：

- 仓库：`dilititi/python_brain`
- 主分支：`main`
- 最近提交：以 `git ls-remote origin refs/heads/main` 为准
- 工作区状态：干净
- 内容规模：52 concepts / 18 cases / 7 projects / 6 people / 5 paths
- 技术栈：Astro + MDX + React Islands
- 项目定位：v1.0 工程契约基本落地的 Python 知识外脑原型

最新核查证据：

- 远端 `origin/main` 已确认能通过 `git ls-remote origin refs/heads/main` 读取。
- 本地 static gates 已通过：`validate:relations`、`audit:concepts`、`test`、`build`、`link:check`、`link:external:inventory`。
- `.github/workflows/v1-gates.yml` 已配置 static gates、三页 Lighthouse beacon、手动/定时 external URL monitor。
- 当前 Windows 环境未安装 `gh` CLI，无法从终端直接读取 GitHub Actions 运行状态；接手者仍需在 GitHub Actions 页面确认最新 workflow 是否绿灯。

本阶段 9 项交付的状态：

| # | 任务 | 当前状态 |
|---|---|---|
| 1 | 完善 new-concept 脚手架 | 已完成第一版，已加内容冻结闸门 |
| 2 | 写 content-guidelines.md | 已完成第一版 |
| 3 | 打磨 3 个概念页为展示标杆 | 已完成第一版，标杆为 `decorator`、`python-language`、`function-parameters` |
| 4 | 部署 main 到 Vercel | 仓库配置已完成，但 Vercel 登录/token 仍需外部处理 |
| 5 | 收紧校验（AND + DAG）+ 单测 | 核心 strict 项已完成 |
| 6 | 内容扩到 20/10/5/5 | 已远超，当前应冻结扩张 |
| 7 | 进度点亮 localStorage | 已完成第一版 |
| 8 | 测评题库化 | 已完成第一版，已有 30 题场景题库 |
| 9 | 路径规划（拓扑排序朴素版） | 已完成第一版 |

## 项目现在是什么状态

项目已经不是“教程站骨架”，而是一个以知识图谱为核心的数据驱动站点：

- 内容在 `src/content/`：concepts、cases、projects、people、paths、works-registry。
- schema 在 `src/content.config.ts`，用 Astro Content Collections 和 Zod 收口字段约束。
- 关系索引由 `scripts/build-relations.ts` 构建，输出 `src/generated/relations.json` 和 `dist/relations.json`。
- 关系纯函数在 `src/lib/relation-index.ts`，页面不要重新手写聚合逻辑。
- 概念页布局在 `src/layouts/ConceptLayout.astro`，固定 6 个 Tab：概念定义、代码示例、真实案例、关键人物、经典作品、历史脉络。
- React Islands 在 `src/components/react/`，加载策略已按 v1.0 对齐。

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
rg -n "expandsTo|works.note|works\\[\\]|difficulty|outcome|firstAppeared|roles|links" docs src scripts tests
```

搜索结果里要区分合法语境：people collection 仍有人物作品 `works`；paths 仍有路径 `milestones`；普通页面标题 `title` 是正常字段。

第四，Vercel 仍是外部状态 blocker，不是代码 blocker。本地和 GitHub 仓库已经具备部署配置；真正上线需要 Vercel 登录态、token，或在 Vercel 控制台导入 GitHub 仓库。

第五，不要把参考手册/工具箱混回主导航。当前设计明确不要做工具箱速查；要做也外链。

## 下一步建议

优先级从高到低：

1. 完成 Vercel 外部部署确认。
2. 在 Vercel/GitHub Actions 上确认 static gates、Lighthouse beacon、external URL monitor 的运行状态。
3. 决定是否把三页标杆的 `naive` / `standard` / `production` 代码示例要求推广到全部 52 个概念。
4. 继续打磨页面体验：图谱分层、搜索体验、测评推荐落地页，但这些都不是 v1.0 阻塞项。

## 常用验证命令

接手前先跑：

```bash
npm run validate:relations
npm run audit:concepts
npm run test
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
- `audit:concepts` 输出 `Concept audit clean`
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

- Vercel 无法在当前环境直接完成登录发布。
- 内容已超 MVP，任何新增内容都可能放大维护成本。
- 三版本代码示例目前只对三页标杆强制，不代表全部概念都达到同等展示质量。
- 外部 URL 可访问性依赖网络，只适合作为手动或定时监控，不应作为 Vercel build 的硬阻断。

## 接手原则

遇到争议时按这个顺序裁决：

1. 内容模型清晰性 > 功能丰富度
2. 构建期校验 > 运行时容错
3. 静态优先 > 交互优先
4. 数据写一次，关系自动算
5. 学习路径连贯性 > 概念覆盖数

一句话定位：现在先把 v1.0 工程契约守住，再做部署确认和体验收口；不要把项目重新拉回“继续堆知识点”的方向。
