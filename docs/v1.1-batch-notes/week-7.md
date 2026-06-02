# Week 7: stdlib

日期：2026-06-02

## 本周概念

- `json`
- `pathlib`
- `regular-expression`

## 完成内容

- 3 个 `stdlib` 概念全部补齐 `naive` / `standard` / `production` 三版本代码。
- 本周没有示例标记 `runnable: false`；所有新增示例都能在 Pyodide 中直接运行。
- `audit:concepts` warning 从 12 降到 0，v1.1 Week 1-7 的非 `language` 三版本代码缺口清零。

## 难点

- `json` 不能只展示 `loads` 和 `dumps`，production 必须在解析后继续校验字段和类型，否则 JSON 只是“能读”而不是“可信”。
- `pathlib` 要避免依赖真实文件系统，所以使用 `PurePosixPath` 展示路径拼接、后缀和目录边界。
- `regular-expression` 的 naive 用 `split` 把标点带进邮箱结果，能说明“字符串方法不够时才上 re”的边界。

## 复用范式

- 标准库批次适合用“朴素字符串/字典处理不够可靠”作为 naive。
- `standard` 展示标准库模块提供的核心能力，不堆参数。
- `production` 要补上输入校验、异常转换、预编译模式、去重或路径边界。
- 对环境敏感的标准库功能要先判断是否适合 Pyodide；本周三个概念都选择了可运行且无外部文件依赖的写法。

## 下一周提醒

- Week 8 是 `language` 批次：`python-philosophy` 和 `python-versions`。
- `language` 概念不强求 `naive` / `standard` / `production`，但必须有至少一段可观察输出的展示性代码。
- `python-language` 是总枢节点；`python-philosophy` 和 `python-versions` 是下游元层级节点，不要重复解释语言身份总览。
- Week 8 的重点是展示性代码质量复核，不是为了凑三版本。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，warning 从 12 降到 0。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：141 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
- GitHub Actions Lighthouse（run `26802269881` 重跑通过）：`decorator` Performance 91 / Accessibility 100，`python-language` 100 / 100，`function-parameters` 100 / 100；`decorator` 首次曾抖到 Performance 85，v1.1 strict 化发布前应把 beacon 页余量做到 93+，避免 90-92 贴边导致 PR 偶发红灯。
