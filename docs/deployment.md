# 部署说明

当前项目使用 Astro 静态输出，Vercel 配置文件为根目录 `vercel.json`。

## Vercel 项目设置

推荐通过 Vercel 控制台导入 GitHub 仓库：

- Repository: `dilititi/python_brain`
- Framework Preset: Astro
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

这些值已经写入 `vercel.json`，Vercel 通常会自动读取。

## 部署前置条件

部署前必须先跑：

```bash
npm run validate:relations
npm run audit:concepts
npm run test
npm run test:code-examples
npm run build
npm run link:check
npm run link:external:inventory
```

这些命令的通过条件和阻断语义如下：

| 命令 | 通过条件 | 阻断行为 |
|---|---|---|
| `npm run validate:relations` | 无 blocking error | error 时返回 `1` 并阻断；默认 warning-only 返回 `0` |
| `npm run audit:concepts` | 无 concept blocking error；v1.1 codeExamples warning 可存在 | blocking error 返回 `1`；当前 codeExamples warning 默认返回 `0` |
| `npm run test` | 所有测试通过 | 测试失败时返回 `1` 并阻断 |
| `npm run test:code-examples` | 所有 `runnable !== false` 的 concept codeExamples 可在 Pyodide 跑通 | 语法错误或运行错误返回 `1` 并阻断 |
| `npm run build` | Astro content schema、类型检查和静态构建通过 | schema、类型或构建失败时返回 `1` 并阻断 |
| `npm run link:check` | `dist` 内部链接和 anchor 全部可解析 | 缺失页面、资源或 anchor 时返回 `1` 并阻断 |
| `npm run link:external:inventory` | content 外链均为 `https://`，并输出去重清单规模 | 非 https 外链返回 `1`；不访问网络 |

`npm run build` 会先运行 `build:relations` 生成 `src/generated/relations.json`，让概念页、路径页和图谱页在 Astro 静态构建期间消费同一份关系索引；静态构建结束后会再次运行 `build:relations`，把同一索引写入 `dist/relations.json` 作为部署产物。

当前 `summary` / `whyImportant`、concept `worksRef` 引用与 `role`、case `standard` code version / `pitfalls` / `extensions`、project v1 字段（`type`、`stage`、`finalOutput`、`structure`、`youWillLearn[]`、`coreFlow[]`、`upgradePath[]`）与 `concepts >= 3`、person `sources` / `role` / `field`、path milestone `cases` / `projects` 已升级为严格字段；缺失、空值、TODO-like 内容或 registry 引用缺失会阻断审计、关系校验或 Astro content schema。

严格字段状态以源码和命令输出共同裁决：`src/content.config.ts` 必须声明 schema，`scripts/validate-relations.ts` 必须把缺失或无效内容作为 error，相关审计脚本必须返回非 0。当前 `summary` / `whyImportant` 不保留 warning-only 过渡状态；如果再次出现这两个字段的 warning 清单，应视为代码和文档脱节的回归，而不是可部署状态。

concept `codeExamples` 处于 v1.1 warning 阶段：`npm run audit:concepts` 默认列出缺口但不阻断，`npm run audit:concepts -- --strict-code-examples` 用于发布前模拟 strict gate。等 52 个概念全部补齐后，才把 codeExamples 缺失从 warning 升级为 blocking error，并把 strict 结果写回 schema、`validate-relations` 和本文件。

后续 GitHub Actions 进入 production monitoring gate 时，可额外使用：

```bash
npm run validate:relations -- --warning-exit-code=2
```

退出码语义分两种模式：

- 默认模式：不带 `--warning-exit-code` 时，warning 不影响退出码；无 error 返回 `0`，有 error 返回 `1`。本地开发和 watch 场景默认使用这一模式，避免 warning 打断编辑。
- CI 监控模式：带 `--warning-exit-code=2` 时，无 error 但存在 warning 返回 `2`；有 error 仍返回 `1`。GitHub Actions 可用 `continue-on-error` 或单独步骤把 `2` 标记为通知或黄灯，但不阻断 merge。

`--warning-exit-code=2` 只用于 `validate:relations` 的非阻塞 warning（例如孤立节点通知）。当前 content strict 项应直接返回 `1` 并阻断。concept `codeExamples` 的 warning/strict 切换由 `audit:concepts -- --strict-code-examples` 单独控制，不使用 `--warning-exit-code=2`。

Vercel Build Command 不应直接使用会返回 `2` 的 warning monitoring 命令；Vercel 只适合作为硬阻断部署 gate，继续使用 `npm run build`，并在合并前由本地或 GitHub Actions 跑完整前置检查。

标杆页验收里的内部 link check 已自动化为 `npm run link:check`，默认检查静态构建产物中的站内 href/src 和 hash anchor，不依赖网络。Lighthouse >= 90 已接入 GitHub Actions 的 `lighthouse-beacons` job，覆盖 `/concepts/decorator/`、`/concepts/python-language/`、`/concepts/function-parameters/` 三个标杆页，检查 performance 和 accessibility。外部 URL 监控已自动化为 `npm run link:external`，但因为它依赖外部站点和网络状态，只在 GitHub Actions 的手动触发与每周定时任务中运行，不作为 PR/Vercel 部署硬阻断。

GitHub Actions 工作流 `.github/workflows/v1-gates.yml` 会在 PR 和 `main` push 时运行：

- static gates：`validate:relations`、`audit:concepts`、`test`、`test:code-examples`、`build`、`link:check`
- Lighthouse beacon pages：构建静态站、启动 Astro preview、跑三页标杆 Lighthouse
- external URL monitor：手动或每周定时运行 `npm run link:external`

## CLI 部署

本地如果已经登录 Vercel，可运行：

```bash
npx vercel --prod
```

如果使用 token，可运行：

```bash
npx vercel --prod --token <VERCEL_TOKEN>
```

## 当前状态

本工作区已验证：

- `npm.cmd run validate:relations`
- `npm.cmd run validate:relations -- --warning-exit-code=2`
- `npm.cmd run audit:concepts`
- `npm.cmd run test`
- `npm.cmd run test:code-examples`
- `npm.cmd run build`
- `npm.cmd run link:check`
- `npm.cmd run link:external:inventory`
- `npx.cmd --yes vercel --version`

其中 `validate:relations` 输出 `Relations valid`；`audit:concepts` 当前应输出 blocking checks clean，并列出 v1.1 codeExamples warning 库存；`test:code-examples` 当前应输出 Pyodide runnable 示例全部通过。当前不存在 `summary` / `whyImportant` warning 库存。

Vercel production 已由用户完成部署，生产域名为 `https://python-brain.vercel.app/`。后续仍以 GitHub Actions 绿灯和生产站点关键路由可访问共同判定发布健康。
