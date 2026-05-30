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
