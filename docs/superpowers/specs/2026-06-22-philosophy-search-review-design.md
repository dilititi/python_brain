# Philosophy Search and Review Design

## Goal

让全站搜索能找回 philosophy 对象和历史判断，并能按问题、可靠性、状态筛选 sources，按时间回顾立场变化。

## Search

继续使用现有 `/search-docs.json` 与 `SearchBox.astro`，不增加搜索服务或依赖。索引新增 questions、perspectives、readings、notions、entries、sources：

- Question：标题、当前回答、未解决问题。
- Perspective：标题、摘要、核心主张、思想家。
- Reading：书名、作者、阅读笔记提示、状态。
- Notion：标题、摘要。
- Entry：标题、改变原因、新立场、接受、怀疑、新问题、关联 Question/Reading。
- Source：标题、摘要、保存理由、用途、局限、可靠性、状态、关联 Question。

搜索文档增加 `keywords` 字段。结果仍只显示 kind、title、description；keywords 只用于匹配。默认最多显示 8 条。

## Source filters

`/sources` 增加三个 select：Question、可靠性、处理状态。三个条件采用 AND；“全部”不限制该维度。过滤只切换构建期已渲染卡片的 `hidden`，并显示当前结果数和无结果提示。

## Review

新增 `/philosophy/review`。Entry 按 `date` 降序、再按 `toVersion` 降序排列，显示：

- Question 与 Vn→Vn+1。
- 改变原因和新立场。
- 接受、怀疑、由此产生的新问题。
- 触发 Reading。

页面可按 Question 筛选，并从 `/philosophy` 提供入口。它不复制 entry 正文，只提供可扫描的历史判断摘要。

## Testing

纯函数测试覆盖六类搜索文档和近期变化排序。Playwright 覆盖全局搜索命中 entry/source/notion、Sources 多维筛选、Review 顺序与内容。最终运行单测、E2E、Astro check、build 和移动端溢出检查。

