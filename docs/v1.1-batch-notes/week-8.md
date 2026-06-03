# Week 8: language

日期：2026-06-02

## 本周概念

- `python-philosophy`
- `python-versions`

## 完成内容

- 2 个 `language` 概念完成展示性代码复核，没有补 `naive` / `standard` / `production` 三版本。
- `python-philosophy` 改为显式解码并打印 The Zen of Python 的关键句，避免只依赖 `import this` 首次导入副作用。
- `python-versions` 改为输出当前解释器版本，并判断 f-string、walrus、match-case、tomllib 等现代特性的版本边界。
- `audit:concepts` warning 保持 0，Week 8 没有让 codeExamples 缺口回升。

## 难点

- `language` 节点不是语法练习题，代码必须服务“语言身份、哲学、版本或运行时行为”的观察，而不是硬凑三版本。
- `python-philosophy` 要承接设计取舍，不重复 `python-language` 的解释器、跨平台、社区治理总览。
- `python-versions` 要承接版本生命周期和特性边界，不重复解释“Python 是什么”。

## 复用范式

- `language` 展示性代码优先选择能在 Pyodide 跑通、能打印可观察结果、能让用户立刻看到抽象概念落到运行时事实的片段。
- 对依赖导入副作用的示例，要补上显式输出路径，避免测试顺序或模块缓存让页面看起来“没反应”。
- 元层级节点可以用“读取环境 / 解码内置文本 / 判断版本能力”作为展示范式。

## 下一周提醒

- Week 9 是复核与发布周，不再扩 concept 数量。
- 复核已有 13 个完整概念：运行性、三版本层次、文案风格必须和 Week 1-8 对齐。
- 扩展复核范围包括 5 条 paths 的 `forWhom` / `notForWhom` / `opportunityCost`、18 个 cases 的 pitfalls 质量、`decorator` 与 Guido 的标杆字段试写。
- 发布前必须给 `decorator` 页 Lighthouse 减负，把 Performance 余量从 88-91 抬到 93+ 后再 strict 化 codeExamples。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，warning 保持 0。
- `npm run audit:concepts -- --strict-code-examples`：通过，v1.1 strict 模拟已 clean。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：141 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
