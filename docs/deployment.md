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

当前 `summary` / `whyImportant` 仍处于 warning 阶段，`audit:concepts` 会列出缺失清单但不阻断本地构建。升级为严格校验前，main 分支必须先让 `npm run audit:concepts` 返回 0 项缺失。

后续 Vercel 或 GitHub Actions 进入 production gate 时，建议使用：

```bash
npm run validate:relations -- --warning-exit-code=2
```

约定退出码：`0` 表示通过且无阻塞问题，`1` 表示错误并阻断，`2` 表示仅有 warning。CI 可在 `2` 时标记通知或黄灯，但不阻断 merge；等 `summary` / `whyImportant` 全量补齐后，再把 strict 校验接入阻断规则。

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
- `npm.cmd run build`
- `npx.cmd --yes vercel --version`

`vercel whoami` 在当前环境中等待交互式登录并超时，且 `VERCEL_TOKEN` 未设置。因此当前仓库已经具备 Vercel 部署配置，但线上发布仍需要 Vercel 登录态、token，或在 Vercel 控制台完成 GitHub 仓库导入。
