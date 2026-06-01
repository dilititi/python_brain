# Week 3: data-structure

日期：2026-06-01

## 本周概念

- `bytes`
- `dict`
- `list`
- `primitive-types`
- `range`
- `set`
- `string`
- `tuple`

## 完成内容

- 8 个 `data-structure` 概念全部补齐 `naive` / `standard` / `production` 三版本代码。
- 本周没有示例标记 `runnable: false`；所有新增示例都能在 Pyodide 中直接运行。
- `audit:concepts` warning 从 92 降到 60，下降 32 条，符合 `8 x (3 个缺版本 + 1 个旧标题)` 的预期。

## 难点

- `range` 的三版本最容易写成同一行代码的变体，最终用右开区间造成的漏页问题串起 naive 和 standard。
- `primitive-types` 不能只展示 `type(value)`，改用字符串 `"False"` 在布尔判断中为真的真实误区。
- `list` 用遍历时原地删除元素展示位置移动带来的漏删，这是比增删查 API 更有记忆点的新人坑。
- `bytes` 要清楚区分 str 和 bytes，所以 naive 直接捕获拼接 TypeError，standard 再显式 encode/decode。
- `tuple` 用“列表不能当 dict key”引出不可变性，比单纯解包更能说明 tuple 的实际用武之地。

## 复用范式

- 数据结构批次适合把 naive 写成“选错容器或误解容器性质”。
- `standard` 负责展示这个容器真正解决的问题：映射、去重、不可变记录、惰性整数序列、文本清洗或字节边界。
- `production` 继续从同一场景演进，优先加入类型注解、输入规范化、边界检查和清楚的异常。
- 能用可观察输出证明误区时，比单纯解释 API 更有效。

## 下一周提醒

- Week 4 的 `function` 批次要特别守住“函数作为边界”的主题，避免每个概念都只写一个玩具函数。
- `closure` 可以延续之前提到的 global 变量误用，production 加类型注解或 `nonlocal` 边界。
- `lambda` 要避免把 lambda 写成炫技，最好围绕排序 key 或短小转换函数。
- `scope` 要把 LEGB 写成可观察行为，不要只背规则。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，warning 从 92 降到 60。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：119 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
