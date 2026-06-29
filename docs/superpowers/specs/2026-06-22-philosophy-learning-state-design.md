# Philosophy Learning State Design

## Goal

让静态内容直接回答“现在该读什么”和“哪个问题停滞了”，同时保持 Question 为状态聚合中心。

## State model

- Question 的 `status` 继续使用 `open / provisional / settled`。
- Question 与 Reading 的 `updatedAt` 使用 `YYYY-MM-DD`，由作者在内容变更时更新。
- Reading 的 `status` 继续使用 `unread / reading / finished`。
- 下一条 reading：按 Question 的 `relatedReadings` 顺序，优先选择 `reading`，否则选择 `unread`。
- 停滞 Question：状态不是 `settled`，且距离 `updatedAt` 至少 30 天。

所有状态由纯函数派生，不在 frontmatter 重复保存 `nextReading` 或 `stalled`。

## Pages

- `/philosophy`：展示下一步阅读和停滞问题摘要。
- `/questions`：显示每个 Question 的下一条 reading、更新时间和停滞提示；提供状态/停滞筛选。
- `/questions/[slug]`：在 reading 区域前明确标出下一步阅读。
- `/readings`：新增 reading 状态索引，支持全部、未读、在读、已读完筛选。

筛选使用少量原生浏览器脚本切换 `hidden`，不增加 React island 或依赖。

## Validation

Question 与 Reading 的 `updatedAt` 在 schema 中设为必填。派生逻辑由 node:test 覆盖，页面行为由 Playwright 覆盖，最终通过现有关系校验和生产构建。

