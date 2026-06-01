# v1.1 批次笔记模板

每周补完一个 category 后新增 `week-N.md`。笔记不需要长，但必须留下执行经验，避免后续批次重复摸索同一个问题。

## 模板

```markdown
# Week N: category

日期：YYYY-MM-DD

## 本周概念

- `concept-a`
- `concept-b`

## 完成内容

- 补齐了哪些 `naive` / `standard` / `production` 示例。
- 哪些示例标记了 `runnable: false`，为什么。

## 难点

- 本周最难定义三版本的概念是什么。
- 最终采用的同一场景是什么。

## 复用范式

- 后续批次可以复用的 naive 问题模式。
- production 常用工程化要素：异常处理、类型注解、日志或边界条件。

## 下一周提醒

- 哪些坑不要重复踩。
- 哪些概念容易和本周内容重叠。

## 验证命令

- `npm run audit:concepts`
- `npm run test:code-examples`
- `npm run test`
```
