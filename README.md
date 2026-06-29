# 思想工作台

一个问题驱动的哲学阅读与立场演化系统。它不是百科，也不是普通读书笔记：Question 是入口，不同理论围绕同一个问题形成可比较的回答，Readings 与 Sources 提供证据，Entries 记录立场变化，Understanding Claims 暴露当前判断的证据、缺口和下一步任务。

生产站点：[https://python-brain.vercel.app/](https://python-brain.vercel.app/)

## 从哪里开始

- `/`：搜索驱动的局部知识图谱；搜索问题、概念、理论或阅读，并查看中心节点的一阶邻居。
- `/questions/`：问题工作台总览。
- `/philosophy/review/`：学习回顾。
- `/philosophy/next/`：下一步阅读、写作和补证据任务。
- `/philosophy/evidence/`：证据锚点。
- `/philosophy/gaps/`：理解缺口、反证与下一步任务。
- `/philosophy/abilities/`：不带评分的 Ability Lens。

`/questions/what-is-history/` 是当前最完整的问题页；`/questions/what-is-history/essay/` 是 essay 实验页。

## Philosophy 内容模型

Philosophy 内容使用 Astro 6.4 Content Layer、MDX 和 `src/content.config.ts`。跨 collection 关系继续使用 slug 字符串，不维护独立 graph collection。

- `questions`：核心追问、比较维度、理论立场和当前暂定回答。
- `perspectives`：对同一个问题的理论回答。
- `readings`：长期跟读并持续写笔记的原典。
- `sources`：用于定位背景、证据和文献的辅助资料。
- `entries`：从 V0 到 V1、V2 的立场变化记录。
- `understanding-claims`：接受 evidence、gaps、counterEvidence 与 nextTasks 检验的理解主张。
- `notions`：Philosophy 模块中的概念节点。

首页图谱只是这些 collections 的只读 view model，只渲染当前中心节点及其一阶邻居。详细维护约定见 [Philosophy 内容工作流](docs/philosophy-authoring.md)。

## 作者命令

```bash
npm run new:question -- --id=what-is-freedom --title="自由是什么？"
npm run new:source -- --id=example-source --title="Example" --url=https://example.com --type=article --summary="摘要" --why-saved="保存原因" --question=what-is-history
npm run new:understanding-claim -- --id=example-claim --title="示例理解主张"
```

所有作者命令都支持 `--dry-run`。新增或修改关系后先运行 `npm run validate:relations`。

## Python 知识库：辅助模块

仓库仍保留原有 Python 学习系统，作为角落里的辅助入口，不参与 Philosophy 首页主图：

- `/concepts/`：Python 概念页。
- `/graph/`：旧 Python 全站关系图。
- `/assessments/` 与 `/progress/`：本地测评和学习证据矩阵。
- `cases`、`projects`、`people`、`paths`：案例、项目、人物和学习路径。

旧的 `works-registry.yaml` 属于 Python citation registry；它不等同于 Philosophy 的 `readings`。

## 本地运行

```bash
npm install
npm run dev
```

发布前检查：

```bash
npm run validate:relations
npm run audit:concepts
npm run audit:assessments
npm test
npm run test:e2e
npm run test:code-examples
npm run test:assessments
npm run build
npm run link:check
npm run link:external:inventory
```

项目使用 Astro 静态输出，Vercel 构建目录为 `dist/`。完整 gate 与部署语义见 [部署说明](docs/deployment.md)。

## 维护文档

- [Philosophy 内容工作流](docs/philosophy-authoring.md)
- [v1.2 发布交接](docs/handoff-v1.2.md)
- [内容编辑准则](docs/content-guidelines.md)
- [Changelog](CHANGELOG.md)
