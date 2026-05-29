# Python 知识外脑

一个基于 Astro Content Collections 的 Python 学习外脑原型。它把概念、代码、案例、人物、作品和历史作为同一个知识节点的六个侧面，同时保留案例库、项目库、人物谱系和学习路径这些独立入口。

## 本地运行

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build
npm run validate:relations
```

## 内容模型

- `src/content/concepts/`：知识点，每个概念都声明前置、相关、应用、人物、作品和历史。
- `src/content/cases/`：真实案例，通过 `concepts` 字段反向注入概念页。
- `src/content/projects/`：项目练习，连接多个案例和概念。
- `src/content/people/`：人物谱系，连接人物、作品和概念。
- `src/content/paths/`：学习路径，使用 YAML 存储节点序列和里程碑。

Astro v6 的内容集合配置入口是 `src/content.config.ts`。双向关系聚合在 `src/lib/relations.ts`，全站图谱生成在 `src/lib/graph.ts`。

## 当前 MVP

- 42 个概念节点
- 18 个真实案例
- 7 个项目练习
- 6 位人物锚点
- 5 条学习路径

`npm run validate:relations` 会检查内容数量、引用完整性和最小连通子图约束。
