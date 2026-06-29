# AI_BOOTSTRAP

新接手者必读。15 分钟读完即可开始工作。详细契约见 `docs/handoff-v1.1.md` 与 `docs/project-positioning-v1.md`。

## 1. 项目是什么

**Python 知识外脑**：基于 Astro Content Collections 的 Python 学习知识图谱原型。核心理念是把每个知识点的「概念定义 / 代码示例 / 真实案例 / 关键人物 / 经典作品 / 历史脉络」当作同一节点的六个侧面，而不是六类页面。生产域名 `https://python-brain.vercel.app/`。

当前规模：**52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works**。

## 2. 为什么存在

定位是「认知外脑」，**不是刷题平台、不是文档站、不是 LMS**。它帮学习者：

- 看清每个 Python 概念在图谱里的位置（前置 / 相关 / 延伸 / 应用）。
- 用真实案例和经典作品验证概念，而不是纯语法练习。
- 通过 paths 给出连贯学习序列，而不是只覆盖概念数量。

设计原则按优先级：内容模型清晰性 > 功能丰富度；构建期校验 > 运行时容错；静态优先 > 交互优先；数据写一次，关系自动算；学习路径连贯性 > 概念覆盖数。

## 3. 当前开发阶段

**v1.1 Week 9（最终周，复核与发布收尾）**。Week 1–8 已完成：37 个非 `language` 概念补齐三版本代码示例，2 个 `language` 概念完成展示性代码。Week 9 不再扩内容，只做复核、strict 化、打 tag。

完成判定见 `docs/handoff-v1.1.md` 末尾 checklist。v1.2 进度系统已设计但**禁止在 v1.1 期间动手实现**。

## 4. 技术架构

- **框架**：Astro v6 静态输出 + MDX + 局部 React Islands（v19）。
- **内容层**：Content Collections，schema 定义在 `src/content.config.ts`，内容在 `src/content/{concepts,cases,projects,people,paths}/` 与 `src/content/works-registry.yaml`。
- **关系层**：`src/lib/relations.ts` 聚合双向关系，`src/lib/graph.ts` 生成全站图谱，`src/lib/path-planner.ts` 做拓扑排序。
- **构建脚本**：`scripts/build-relations.ts`、`validate-relations.ts`、`audit-concepts.ts`、`test-code-examples.ts`（Pyodide 跑代码）、`link-check.ts`、`external-link-check.ts`。
- **交互组件**：Cytoscape（图谱）、CodeRunner（Pyodide WASM 运行代码）。
- **部署**：Vercel，配置见 `vercel.json`。CI 见 `.github/workflows/v1-gates.yml`。

## 5. 数据流

```
src/content/*.{md,mdx,yaml}
        │
        ▼
scripts/build-relations.ts  ──►  src/generated/relations.json
        │                                 │
        │                                 ▼
        │                       Astro 静态构建（消费关系索引）
        │                                 │
        ▼                                 ▼
scripts/validate-relations.ts        dist/*.html + dist/relations.json
        │                                 │
        ▼                                 ▼
   阻断 / warning                    Vercel 部署
```

**字段边界硬规则**：concept 用 `codeExamples`，case 用 `codeVersions`；**绝对不要把 `codeVersions` 引到 concept**。作品稳定元数据写 `works-registry.yaml`，concept frontmatter 只写 `worksRef[].id` 和 `worksRef[].role`。

## 6. 当前任务（Week 9 范围，按优先级）

1. **复核 13 个已有完整概念**（早期三版本，防质量洼地）：`common-stdlib-modules`、`cross-platform-community`、`decorator`、`dunder-methods`、`dynamic-strong-typing`、`encapsulation`、`function-parameters`、`interpreter-runtime`、`module-search-path`、`package-structure`、`polymorphism`、`programming-paradigms`、`python-language`。复核点：能否通过 `test:code-examples`、`naive` 是否真的暴露问题、`production` 是否含工程化要素、三版本是否连贯、文案风格是否与 Week 1–8 一致。
2. **5 条 paths 补 `forWhom` / `notForWhom` / `opportunityCost`**；**18 个 cases 的 `pitfalls` 复核**（必须写「代价」而不是语法注意事项）。
3. **标杆字段试写**：`decorator` 试 `requiresMindset`，Guido van Rossum 试 `earlyCareer`，仅作 v1.2 样本，不全量。
4. **`decorator` 页 Lighthouse Performance 从 88–91 抬到 93+**：检查 CodeRunner 是否延迟挂载、三版本是否默认只展示 `standard`、works/media 是否 lazy load。
5. **codeExamples strict 化**：改 `src/content.config.ts` + `scripts/validate-relations.ts` + `docs/content-guidelines.md` + `docs/deployment.md`，跑全量 gates，开 `v1.1-rc` PR，绿灯合并，打 `v1.1.0` annotated tag。

## 7. 绝对不能做什么

- **不扩内容规模**（仍冻结在 52 concepts）。
- **不引入新框架或新技术栈**（继续 Astro + MDX + 必要 React island；编辑器已钉死 CodeMirror 6，不要换 Monaco）。
- **不做用户系统、账号、跨设备同步**。
- **不接需要 API key 的外部服务**（除非先有预算与运维计划）。
- **不把 v1.2 进度系统的 collection / 页面 / 运行时依赖 / localStorage 写入逻辑提前落地**——只允许文档讨论。
- **不在 concept 用 `codeVersions`**；不在 `language` 概念硬凑三版本。
- **不为 schema 枚举里的 `file-io`、`third-party` 安排独立周次**（当前无对应概念）。
- **不用 Vercel build 跑 `--warning-exit-code=2`**（warning 监控只属于 GitHub Actions）。
- **不把 codeExamples strict 化、paths 补字段、Lighthouse 减负塞进一个不可回滚的大补丁**，分步合并。
- **不修改 `git config`，不 `--no-verify`，不 force push main**。

## 8. 接下来最重要的 3 件事（按顺序）

1. **跑通基线 gates 确认当前状态**：`npm run validate:relations` / `audit:concepts` / `audit:concepts -- --strict-code-examples` / `test` / `test:code-examples` / `build` / `link:check` / `link:external:inventory`。Week 8 结束时全部应通过，strict 模拟应 clean。任一失败先修，不要开新工作。
2. **启动 Week 9 复核**：从 `decorator` / `python-language` / `function-parameters` 三个标杆页开始，因为它们同时承担 Lighthouse beacon 与字段试写双重职责，做完才能解锁后续 strict 化。每周完成后写 `docs/v1.1-batch-notes/week-9.md`。
3. **执行发布日 strict 化 11 步**（见 `docs/handoff-v1.1.md` 「发布日 strict 化步骤」）：审计 strict → 改 schema → 改 validate → 改文档 → 全量 gates → `v1.1-rc` PR → 合并 → Vercel 抽样 → 打 `v1.1.0` tag。

## 必读文件优先级

1. `docs/handoff-v1.1.md` — v1.1 完整契约与 checklist。
2. `docs/content-guidelines.md` — 字段语义边界与写作标准。
3. `docs/project-positioning-v1.md` — 设计原则与定位审查。
4. `src/content.config.ts` — schema 源真相。
5. `docs/deployment.md` — gates 与退出码语义。
6. `docs/v1.1-batch-notes/week-8.md` — 最近一次完成状态。
7. `docs/v1.2-progress-tracking.md` — 仅作 v1.2 方向参考，**不实施**。
