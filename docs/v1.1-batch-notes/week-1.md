# Week 1: syntax

日期：2026-06-01

## 本周概念

- `variable`
- `f-string`
- `operators`
- `type-annotations`
- `type-casting`
- `walrus-operator`

## 完成内容

- 6 个 `syntax` 概念全部补齐 `naive` / `standard` / `production` 三版本代码。
- 本周没有示例标记 `runnable: false`；所有新增示例都应能在 Pyodide 中直接运行。
- `variable` 作为 v1.1 内部范式标杆：用“任务列表快照”串起变量绑定、显式复制和不可变返回值。

## 难点

- `variable` 最容易写成抽象解释，最终改用可变对象别名场景，让新人真实看到“名字不是独立副本”的后果。
- `operators` 的三版本围绕权限判断展开，`naive` 保留自然语言式 `or` 误用，`standard` 改成成员判断，`production` 再加入函数边界和锁定状态。
- `type-annotations` 要避免暗示注解会自动做运行时校验，所以 `production` 明确补了边界检查。
- `walrus-operator` 的重点不是炫技，而是“同一个清洗结果既要判断又要复用”时减少重复。

## 复用范式

- `naive` 应该是能运行但暴露误解的代码，优先使用令人意外的输出或被捕获的异常。
- `standard` 保持最小推荐写法，不急着加入工程框架。
- `production` 必须从 `standard` 的同一场景演进，至少加入类型注解、异常处理、日志或边界条件之一。
- 如果 `naive` 必须触发错误，应在示例内部捕获并打印错误类型，避免破坏 `test:code-examples`。

## 下一周提醒

- Week 2 的控制流概念要继续坚持同一场景三段演进，尤其是 `try-except`、`raise-assert-finally` 不要写成孤立语法片段。
- `match-case` 可以依赖 Pyodide 的 Python 3.10+ 支持，但要避免写成大型命令解释器。
- `break-continue-pass` 和 `while-loop` 很容易重叠，前者突出循环内部控制，后者突出循环条件和退出策略。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，剩余 125 条 codeExamples warning，均属于后续批次。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：88 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
