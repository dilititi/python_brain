# Week 9 Lighthouse 子任务

日期：2026-06-02

## 目标

把 `decorator` 标杆页 Lighthouse Performance 从 88-91 的贴边区间抬出，让 v1.1 strict 化发布后 PR 不再因为 90 分阈值附近的抖动反复红灯。

CI 真实门槛来自 `lighthouserc.json`：performance / accessibility `minScore` 均为 0.9。93+ 不是当前 CI gate，而是发布前给 beacon 页预留的 buffer 目标。

## 本次完成

- L1：搜索索引从每页内联 JSON 改为 `/search-docs.json` endpoint，搜索框只在用户输入时 lazy fetch。
- L3：CodeRunner 初始示例优先展示 `standard`，没有 `standard` 的 `language` 概念回退第一个展示性代码；运行器绑定延迟到代码区可见时再执行，避免隐藏 tab 首屏解析 `codeExamples`。
- 不另开分支，继续堆在 `codex/v1.1-code-examples`，等待 v1.1-rc PR 合入 main。

## 自测替代

本地 Lighthouse 分数不作为可信裁判：CI 使用 `treosh/lighthouse-ci-action@v12` 和自己的 Chromium 环境，之前 decorator 首跑 85/86/88、重跑过线，说明单次本地分数或单次 CI 分数都可能抖动。

本次用静态 payload 变化作为可复现的自测替代，再以 PR Actions 的 Lighthouse beacon job 作最终裁判：

- 变更前：`dist/concepts/decorator/index.html` 为 48,547 bytes，全站 97 个 HTML 合计 4,008,767 bytes。
- L1 + L3 后：`dist/concepts/decorator/index.html` 为 32,450 bytes，减少 16,097 bytes；全站 HTML 合计 2,403,877 bytes，减少 1,604,890 bytes。
- 新增 `dist/search-docs.json` 为 18,100 bytes，只有用户实际搜索时才请求。
- 第一次 CI Lighthouse 样本：decorator Performance 80，TBT 830ms；重跑样本为 88。两次都说明还不能把问题归为单次抖动，因此继续追加 CodeRunner 可见时绑定。
- 追加 CodeRunner 可见时绑定后的成功 CI 样本：decorator Performance 94 / 95 / 97，Accessibility 100，TBT 从 290ms 降到 200ms；`python-language` 与 `function-parameters` 均为 100 / 100，TBT 0ms。当前已经超过 90 gate，并达到 93+ buffer。

## 推翻的假设

- Pyodide 已经是点击“运行”后才加载，不是首屏自动加载；本轮不需要再做 Pyodide click-to-load。
- CodeRunner 当前是 Astro 组件和 inline script，不是 React island；“改 client 指令”不是有效方向。
- CI gate 是 90，93+ 是发布 buffer 目标，不应把二者写混。

## 判断缺口

- `payload bytes` 不等于 TBT。搜索索引 lazy load 让 decorator HTML 从 48,547 bytes 降到 32,450 bytes，这对 FCP、LCP、Speed Index 和 HTML parse 有价值，但 TBT 的核心是 main thread long tasks。真正把 decorator 从红灯区拉回 buffer 的不是默认展示 `standard` 这个 UX 改动，而是 CodeRunner 延迟到代码区可见时才解析 `codeExamples` 和绑定事件。以后遇到 Performance 问题，先看 TBT 归因，再排减负手段。
- “以 CI Lighthouse 为准”是对的，但 CI 第一次出结果后必须看 artifact 指标，而不是只看绿灯或红灯。第一次样本 decorator Performance 80 / TBT 830ms，说明不是普通抖动；看 artifact 后继续追加可见时绑定，才把成功样本推进到 94 / 95 / 97。以后边界指标默认走：先看 CI artifact，再决定是否收口。

## 待 Week 9 收尾验证

- Week 9 发布前仍需在 v1.1-rc PR 和 Vercel preview 再抽样一次，确认 93+ buffer 没有回落。
- Vercel preview 或 production 抽样访问三页标杆和 `/relations.json`，作为发布前验证的一部分。
- 如果 decorator 仍低于 93，继续查首屏脚本、CSS、代码区默认高度和非必要内容渲染。
