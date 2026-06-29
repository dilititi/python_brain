# Changelog

## V4.9 — Navigation and Release Polish (2026-06-28)

### Changed

- 将首页身份文案统一为“思想工作台 / QUESTION-DRIVEN GRAPH”，搜索提示改为面向问题、概念、理论和阅读。
- 在首页补充“学习回顾”入口，并校验 review、next、evidence、gaps、abilities 与旧 Python 图谱入口。
- 为 `/philosophy/review`、`/philosophy/next`、`/philosophy/evidence` 增加统一工作流导航和“返回首页图谱”入口。
- 修复移动端全站主导航被压缩后中文逐字换行的问题，保留导航区域内的横向滚动。
- 在 authoring 文档中说明 Graph-first Homepage 如何从现有 collections 和 slug 关系生成。

### Verification

- 增加首页导航、快捷入口可达性、双向链接和发布文档测试。
- 发布前执行 relations、unit、e2e、build 与 diff 检查。

## V4.8c — Graph Homepage Content Tuning

- 补强 `what-is-history` 的有意义邻居、关键节点摘要和关系连通性。
- 邻居较多时使用双环布局，保持中心问题和标签可读。

## V4.8b — Graph Homepage Interaction Polish

- 增加最多 6 项的 Combobox 搜索、键盘选择、URL focus、Reset center、颜色图例和移动端布局。

## V4.8 — Graph-first Homepage

- 将根首页改为暗色、搜索驱动的 philosophy local graph。
- 复用 Cytoscape，仅显示中心节点及其一阶邻居，并通过 inspector 进入详情页。
- 图谱数据继续来自既有 philosophy collections；没有新增 schema、统一 graph collection 或依赖。
