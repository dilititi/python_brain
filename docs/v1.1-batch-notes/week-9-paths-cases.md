# Week 9 Paths + Cases 子任务

日期：2026-06-03

## 完成内容

- 5 条应用方向补齐 `forWhom` / `notForWhom` / `opportunityCost`，让路径不再假装普适。
- path schema 和 `validate-relations` 已收紧，缺少上述字段会阻断构建期校验。
- path 详情页新增“适合你，如果 / 先别选，如果 / 机会成本”三栏，让字段进入用户可见体验。
- 18 个 cases 的 `pitfalls` 全量复核，统一改成说明实际代价的句子，而不是语法层注意事项。

## 写作取舍

- `forWhom` 写具体使用意图或学习状态，不写“想学 Python 的人”。
- `notForWhom` 明确反向导航，帮助用户少走弯路。
- `opportunityCost` 说明选择这条方向会暂时牺牲什么能力训练。
- `pitfalls` 优先写调试损耗、数据污染、部署失败、性能退化、用户反馈中断等真实成本。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts -- --strict-code-examples`：通过，concept audit clean。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：141 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
