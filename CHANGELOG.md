# Changelog

## v1.2.0 — 思想工作台 (2026-06-29)

### Released

- 将根首页发布为 Graph-first、搜索驱动的 Philosophy 局部图谱；中心节点只展示一阶邻居，并通过 inspector 进入详情页。
- 建立 Question、Perspective、Reading、Source、Entry、Notion 与 Understanding Claim 的问题驱动阅读工作流。
- 提供 Review、Next、Evidence、Gaps 与 Ability Lens 页面，把阅读状态、证据缺口和下一步行动聚合为可持续维护的思想工作台。
- 保留 Python concepts、graph、assessments 与 progress 系统作为辅助模块，不混入 Philosophy 首页主图。

### Release hardening

- 增加 Combobox 搜索、键盘选择、URL focus、Reset center、颜色图例和移动端布局。
- 补齐 Question Local Map detail panel、`what-is-history` essay 实验页和 Philosophy 作者命令。
- 修复移动端导航逐字换行与 CodeRunner 首屏布局探测；Lighthouse 保持 0.9 门槛并改用 3 次采样中位数。
- 统一 README、package 版本、发布 handoff 与部署文档；V4.8/V4.9 继续作为 Philosophy 功能轨迹保留。

### Verification

- Release candidate 执行 relations、concept/assessment audits、unit、e2e、code examples、assessment solutions、build、internal links 与 external URL inventory。
- 合并后以 GitHub Actions Static gates、Lighthouse beacon pages、Vercel 部署和生产主入口抽样共同判定发布健康。

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
