# Philosophy Authoring Workflow Design

## Goal

让 Question 中心内容可以用一致命令创建，并让非法文件名、非法引用和缺失关系在 Astro 构建前给出可定位错误。

## Chosen approach

沿用项目已有的 `new:concept` 命令模式，提供 `new:question` 与 `new:source` 两个静态内容生成命令。生成器只写 MDX，不引入数据库、表单页面、运行时 API 或新依赖。

相较于只放可复制的文档模板，CLI 能统一 slug、避免覆盖已有文件，并在写入后调用现有关系校验。相较于浏览器编辑器，它保持 Content Layer 作为唯一内容源，也不改变部署模型。

## Components

### Pure authoring helpers

`src/lib/philosophy-authoring.ts` 负责：

- 定义普通 philosophy slug 与 entry 文件名格式。
- 校验 collection id。
- 渲染 question/source 的完整 MDX 初始内容。
- 对 source 类型和 HTTPS URL 做输入校验。

这些函数不读写文件，便于单元测试。

### CLI writer

`scripts/new-philosophy-content.ts` 负责解析参数、拒绝覆盖、写入对应 collection，并在成功写入后运行 `npm run validate:relations`。

命令入口：

- `npm run new:question -- --id=<slug> --title=<title>`
- `npm run new:source -- --id=<slug> --title=<title> --url=<https-url> --type=<type> --summary=<summary> --why-saved=<reason> --question=<question-slug>`

两者支持 `--dry-run` 与 `--skip-validate`。`--dry-run` 不写文件；`--skip-validate` 只用于批量编辑尚未完成时。

### Build-time validation

`validatePhilosophyRelations` 除现有关系存在性检查外，还验证：

- questions、perspectives、readings、notions、sources 的 id 必须是 kebab-case。
- entries 的 id 必须是 `YYYY-MM-DD-kebab-case`。
- 所有引用值必须符合 kebab-case；非法格式只报格式错误，不重复报告 missing id。
- entry 的 `triggeredBy` reading 必须同时出现在该 question 的 `relatedReadings` 中。

Astro schema 中的 `slugRef` 同样使用 kebab-case regex，形成 Content Layer 与独立校验脚本两层防线。

## Generated content contract

Question 骨架是诚实的开放状态：`status: open`、`currentAnswer: 尚未形成暂定回答。`，矩阵和 reading 关系为空，正文提供六个问题工作台写作段落。它结构完整但不伪造观点。

Source 必须在创建时提供真实 HTTPS URL、摘要、保存理由和至少一个关联 question。其余关系为空，状态从 `saved` 开始，正文提示记录使用结果与局限。

## Failure behavior

- 参数缺失、坏 slug、非 HTTPS URL、未知 source type：写入前退出 1。
- 目标文件已存在：拒绝覆盖并退出 1。
- 写入后的跨 collection 关系无效：文件保留以便修正，关系校验退出非零并给出 collection/field/id。
- `dev` 与 `build` 继续先执行 `validate:relations`，因此错误不会进入 Astro 页面生成。

## Testing

- 单元测试覆盖 slug、entry id、question/source 模板和参数约束。
- 关系测试覆盖非法 collection id、非法引用格式、source/question 缺失引用，以及 entry-triggered reading 不属于 question。
- CLI 用 `--dry-run` 验证输出且确认不写文件。
- 最终运行 `npm test`、`npm run test:e2e`、`npm run build`。

