# Week 4: function

日期：2026-06-01

## 本周概念

- `builtin-functions`
- `closure`
- `function`
- `lambda`
- `scope`

## 完成内容

- 5 个 `function` 概念全部补齐 `naive` / `standard` / `production` 三版本代码。
- 本周没有示例标记 `runnable: false`；所有新增示例都能在 Pyodide 中直接运行。
- `audit:concepts` warning 从 60 降到 40，下降 20 条，符合 `5 x (3 个缺版本 + 1 个旧标题)` 的预期。

## 难点

- `builtin-functions` 容易写成工具罗列，最终用手写索引越界引出 `enumerate`、`zip`、`sum` 和 `sorted` 的组合价值。
- `closure` 用全局折扣率展示状态被后续修改污染，再用闭包让每个函数记住创建时的配置。
- `function` 要避免只展示 `def` 语法，naive 先写重复求和逻辑，standard 再把边界抽成函数。
- `lambda` 的重点不是炫技，而是给 `sorted(key=...)` 传短小规则；复杂校验仍放进具名函数。
- `scope` 用 `UnboundLocalError` 说明赋值会改变名字解析，再用 `nonlocal` 和闭包状态收束。

## 复用范式

- 函数批次的 `naive` 可以集中暴露“没有边界”的问题：重复逻辑、全局状态、隐式作用域、缺少 key 函数。
- `standard` 应该让函数或函数式工具清楚表达意图，而不是提前工程化。
- `production` 继续从同一场景演进，优先加入类型注解、输入长度检查、参数范围检查和清楚异常。
- 当概念本身不是越复杂越好时，例如 `lambda`，production 要明确展示“复杂逻辑回到具名函数”的边界。

## 下一周提醒

- Week 5 的 `module-eng` 批次会碰到 `pip` 和 `venv`，很多示例不能真实安装包或创建环境；如需展示命令，应考虑 `runnable: false`，但仍要保留可验证的文字边界。
- `import-syntax` 和 `module` 容易重叠，前者强调导入语法，后者强调文件作为复用单元。
- `venv` 的 production 示例应偏工程流程，不要假装浏览器 Pyodide 能创建本地虚拟环境。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，warning 从 60 降到 40。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：129 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
