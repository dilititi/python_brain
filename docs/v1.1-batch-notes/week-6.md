# Week 6: oop

日期：2026-06-01

## 本周概念

- `class`
- `dataclass`
- `inheritance`

## 完成内容

- 3 个 `oop` 概念全部补齐 `naive` / `standard` / `production` 三版本代码。
- 本周没有示例标记 `runnable: false`；所有新增示例都能在 Pyodide 中直接运行。
- `audit:concepts` warning 从 24 降到 12，下降 12 条，符合 `3 x (3 个缺版本 + 1 个旧标题)` 的预期。

## 难点

- `class` 要避免写成“函数换皮”，所以 naive 用字典字段漂移展示数据和行为分离的风险，standard 再把两者收进对象。
- `dataclass` 的 naive 要突出手写样板的噪音；production 使用 `frozen=True` 和 `__post_init__` 展示数据记录也可以有约束。
- `inheritance` 容易过度抽象，最终用通知器场景表达“共享初始化 + 覆盖发送行为”，production 再用 `ABC` 明确子类协议。

## 复用范式

- OOP 批次的 `naive` 适合展示“相同数据形状和行为散落在外部”的维护问题。
- `standard` 应该让对象模型刚好够用，不急着引入复杂层级。
- `production` 可以加入属性边界、冻结数据、抽象基类、类型注解和输入校验。
- 继承示例要提醒复用边界，避免给新人留下“有相似代码就继承”的错觉。

## 下一周提醒

- Week 7 的 `stdlib` 批次剩下 `json`、`pathlib`、`regular-expression`，都是标准库实用工具。
- `pathlib` 在 Pyodide 里可以用相对路径和纯路径对象，但不要依赖真实本地文件系统结构。
- `regular-expression` 要避免写成正则炫技，应围绕“字符串方法不够用时才上 regex”。
- `json` 要重点展示解析失败和 schema-like 边界，不要只写 `loads` / `dumps`。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，warning 从 24 降到 12。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：135 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
