# Week 2: control-flow

日期：2026-06-01

## 本周概念

- `break-continue-pass`
- `comprehension`
- `for-loop`
- `if-statement`
- `match-case`
- `raise-assert-finally`
- `try-except`
- `while-loop`

## 完成内容

- 8 个 `control-flow` 概念全部补齐 `naive` / `standard` / `production` 三版本代码。
- 本周没有示例标记 `runnable: false`；所有新增示例都应能在 Pyodide 中直接运行。
- `audit:concepts` warning 从 125 降到 92，下降 33 条，单调下降趋势成立。

## 难点

- `break-continue-pass` 要同时展示三个关键字，但不能为了展示而破坏业务场景；最终采用“清洗姓名列表，遇到 STOP 停止，空值跳过，元数据分支留位”的场景。
- `for-loop` 原本有两个旧示例，所以消掉的旧标题 warning 比其他概念多 1 条；这也是本周 warning 降幅大于 `8 x 3` 的原因。
- `match-case` 要避免写成普通 switch，最终使用字典事件匹配，让“结构化模式匹配”的价值露出来。
- `raise-assert-finally` 的三版本必须同时解释“主动失败、开发期不变量、收尾保证”，比普通异常示例更容易写散。
- `while-loop` 要避免无限循环风险，production 版本必须显式写最大重试次数。

## 复用范式

- 控制流概念适合用“同一组输入，不同控制策略”的方式串三版本。
- `naive` 可以是能运行但语义不对的流程，比如错误分支顺序、吞错、手动索引越界。
- `standard` 要突出语法本身的清晰表达，不急着加抽象。
- `production` 优先加入函数边界、类型注解、具体异常、最大重试次数或输入范围校验。

## 下一周提醒

- Week 3 的 `data-structure` 容易写成 API 罗列，要继续围绕真实数据形状和误用代价设计三版本。
- `range` 的三版本会比较难，要避免 naive 和 standard 都只写 `range(10)`；可以围绕 off-by-one 或批处理窗口展开。
- `primitive-types` 要说明类型行为差异，不能只写 `type(value)` 展示。
- `bytes` 要注意 Pyodide 环境和编码示例，避免依赖本地文件。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，warning 从 125 降到 92。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：103 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
