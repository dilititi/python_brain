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
npm run build
```

这些命令的通过条件和阻断语义如下：

| 命令 | 通过条件 | 阻断行为 |
|---|---|---|
| `npm run validate:relations` | 无 blocking error | error 时返回 `1` 并阻断；默认 warning-only 返回 `0` |
| `npm run audit:concepts` | 无 concept audit issue | issue 时返回 `1` 并阻断 |
| `npm run test` | 所有测试通过 | 测试失败时返回 `1` 并阻断 |
| `npm run build` | Astro content schema、类型检查和静态构建通过 | schema、类型或构建失败时返回 `1` 并阻断 |

当前 `summary` / `whyImportant`、concept `worksRef` 引用与 `role`、case `standard` code version / `pitfalls` / `extensions`、project `concepts >= 3`、person `sources` / `role` / `field`、path milestone `cases` / `projects` 已升级为严格字段；缺失、空值、TODO-like 内容或 registry 引用缺失会阻断审计、关系校验或 Astro content schema。当前不保留 `summary` / `whyImportant` 的 warning-only 过渡状态。

后续 GitHub Actions 进入 production monitoring gate 时，可额外使用：

```bash
npm run validate:relations -- --warning-exit-code=2
```

退出码语义分两种模式：

- 默认模式：不带 `--warning-exit-code` 时，warning 不影响退出码；无 error 返回 `0`，有 error 返回 `1`。本地开发和 watch 场景默认使用这一模式，避免 warning 打断编辑。
- CI 监控模式：带 `--warning-exit-code=2` 时，无 error 但存在 warning 返回 `2`；有 error 仍返回 `1`。GitHub Actions 可用 `continue-on-error` 或单独步骤把 `2` 标记为通知或黄灯，但不阻断 merge。

`--warning-exit-code=2` 只用于未来的非阻塞 warning（例如孤立节点通知）。当前 content strict 项应直接返回 `1` 并阻断。

Vercel Build Command 不应直接使用会返回 `2` 的 warning monitoring 命令；Vercel 只适合作为硬阻断部署 gate，继续使用 `npm run build`，并在合并前由本地或 GitHub Actions 跑完整前置检查。

标杆页验收里的 link check 与 Lighthouse >= 90 还没有自动化脚本；在接入 GitHub Actions 前，只能作为人工 gate。后续新增脚本后，部署前置条件应补充 `npm run link:check` 和 `npm run lighthouse:beacons`，再把它们接入 PR 检查。

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
- `npm.cmd run build`
- `npx.cmd --yes vercel --version`

`vercel whoami` 在当前环境中等待交互式登录并超时，且 `VERCEL_TOKEN` 未设置。因此当前仓库已经具备 Vercel 部署配置，但线上发布仍需要 Vercel 登录态、token，或在 Vercel 控制台完成 GitHub 仓库导入。
