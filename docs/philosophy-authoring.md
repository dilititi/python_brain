# Philosophy 内容工作流

Philosophy 模块是“问题驱动的阅读与立场演化系统”。Question 是入口；reading 是长期跟读的 primary text；source 是帮助定位证据、背景和文献的辅助资料；entry 是一次有依据的立场变化。

## 新建 Question

```powershell
npm run new:question -- --id=what-is-freedom --title="自由是什么？"
```

可选参数：

- `--date=YYYY-MM-DD`：覆盖默认的当天日期。
- `--dry-run`：只在终端打印模板，不写文件。
- `--skip-validate`：写入后不立即运行关系校验，仅适合一次编辑多个互相引用的文件。

生成文件位于 `src/content/questions/<id>.mdx`。初始状态为 `open`，暂定回答诚实地标记为“尚未形成”，不会伪造理论立场。接下来依次填写：

1. `dimensions[]`：这个问题真正需要比较的轴。
2. `stances[]`：不同 perspective 对同一组维度的回答。
3. `relatedReadings[]`：需要长期跟读的原典。
4. `openQuestions[]`：下一轮阅读需要解决的具体疑问。
5. MDX 正文：展开自己的判断，不重复 frontmatter 卡片信息。

## 新建 Source

```powershell
npm run new:source -- `
  --id=history-methods-overview `
  --title="History Methods Overview" `
  --url=https://example.com/history-methods `
  --type=article `
  --summary="梳理历史研究中的主要解释方法。" `
  --why-saved="用于比较不同理论如何组织历史证据。" `
  --question=what-is-history
```

必填参数：`id`、`title`、`url`、`type`、`summary`、`why-saved`、`question`。URL 必须是 HTTPS；`question` 必须已经存在，否则写入后的关系校验会失败。

可用 source type：`book`、`paper`、`encyclopedia`、`article`、`blog`、`video`、`course`、`documentation`、`news`、`forum`、`other`。

Source 默认状态为 `saved`、可靠性为 `unknown`。阅读后再更新：

- `status`：从 saved 推进到 skimmed / reading / read / extracted，或标记 rejected。
- `reliability`：high / medium / low / unknown。
- `useFor[]`：它实际支持哪些判断。
- `limitations[]`：证据边界和仍需核对的地方。
- `relatedNotions[]`、`relatedPerspectives[]`：只有确实使用时才建立关系。

不要把需要长期跟读和持续写笔记的原典放进 sources；那类内容属于 readings。也不要把 readings 写进旧的 works-registry，后者仍是 Python 内容域的 citation registry。

## Ability Lens 标注原则

Ability Lens 是给问题和概念提供一个轻量观察角度，不是测评系统，也不是个人画像。填写 `abilities` 时遵守这些原则：

- abilities 只用于 questions / notions。
- 每个内容最多 4 个，宁可少标，也不要为了覆盖面而凑满。
- 只标主要维度：问这个问题或使用这个概念时真正被动员的维度才写入 frontmatter。
- total 不是分数；页面里的数量只表示该维度关联了多少内容。
- 不要给 readings / understanding-claims 标 abilities；readings 仍记录阅读状态，understanding-claims 仍记录证据、缺口和下一步任务。

## Slug 规则

questions、perspectives、readings、notions、sources 使用小写 kebab-case：

```text
what-is-history
discipline-and-punish
power-knowledge
```

entries 还必须带日期前缀：

```text
2026-06-22-foucault-subject-resistance
```

空格、下划线、大写字母、连续连字符都会在 `validate:relations` 阶段被阻断。跨 collection 字段继续填写 slug 字符串，不使用 `reference()`。

## 关系错误怎么修

运行：

```powershell
npm run validate:relations
```

错误格式会指出 collection、文件 id、字段位置和目标 slug。按以下顺序修复：

1. 先确认目标文件是否存在、文件名 slug 是否正确。
2. 再修复引用字段中的拼写和格式。
3. 如果 entry 有 `triggeredBy`，把该 reading 同时加入 Question 的 `relatedReadings[]`。
4. 检查 entry 是否从 V0 开始、每次只前进一个版本，且下一条 `priorStance` 与上一条 `newStance` 完全一致。
5. 重新运行关系校验，直到退出码为 0。

## 首页图谱如何生成

根首页 `/` 的图谱不是新的内容系统，而是既有 philosophy collections 的只读 view model。`src/pages/index.astro` 在构建时读取 questions、notions、readings、sources、entries、understanding-claims、perspectives，再交给 `buildPhilosophyHomeGraph()` 生成首页节点和关系边。它不会写回内容，也不会修改 `content.philosophy.ts`。

节点 id 使用 collection 类型前缀，例如 `question:what-is-history`、`reading:discipline-and-punish`。关系边来自 frontmatter 中已有的 slug 字符串：Question 的 related 字段、Source / Entry / Claim 的 `relatedQuestions`，以及 Claim evidence 的 `refType + ref`。重复关系会在 view model 中去重。

浏览器只渲染“当前中心节点 + 一阶邻居”，不会把全站节点一次性铺开。默认优先以 `question:what-is-history` 为中心；搜索会在 label、id、keywords 和 description 中做本地匹配，选择结果后只切换中心。地址栏的 `?focus=reading:discipline-and-punish` 可以直接聚焦一个节点。

作者不需要手工维护 graph 文件。要让图谱更有用，应当：

1. 给内容写清楚 title、summary / currentPosition / claim 等已有摘要字段。
2. 使用已经定义的 related 字段建立真实关系，并继续填写合法的 slug 字符串。
3. 新增或修改关系后运行 `npm run validate:relations` 和发布前检查。
4. 不为首页图谱新增统一 collection、KnowledgeNode、数字权重或能力评分。

## 发布前检查

```powershell
npm run validate:relations
npm test
npm run test:e2e
npm run build
```

`dev` 和 `build` 都会先执行关系校验。不要为了让页面构建成功而删除有效关系；应修复缺失目标或错误 slug。
