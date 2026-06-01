# Week 5: module-eng

日期：2026-06-01

## 本周概念

- `import-syntax`
- `module`
- `pip`
- `venv`

## 完成内容

- 4 个 `module-eng` 概念全部补齐 `naive` / `standard` / `production` 三版本代码。
- `import-syntax` 的示例保持可在 Pyodide 中运行。
- `module` 的跨文件示例、`pip` 和 `venv` 的终端命令使用 `runnable: false`，避免把环境操作伪装成浏览器内可运行代码。
- `audit:concepts` warning 从 40 降到 24，下降 16 条，符合 `4 x (3 个缺版本 + 1 个旧标题)` 的预期。

## 难点

- `pip` 和 `venv` 的核心场景发生在终端和本地解释器环境里，不能为了提高 runnable 数量而写成假的 Pyodide 示例。
- `module` 的价值是跨文件复用，所以 standard 和 production 用文件结构片段表达；只有 naive 保持单文件可运行。
- `import-syntax` 用通配符导入和名字冲突展示风险，再用模块别名把来源写清楚。
- `venv` 示例目前采用 Windows 路径，因为当前项目开发环境在 Windows；后续如果要做跨平台命令展示，应单独设计 shell tabs。

## 复用范式

- 工程化概念允许使用 `runnable: false`，但必须说明为什么不能在 Pyodide 里运行。
- `naive` 可以展示“环境没隔离”“解释器不明确”“所有代码堆在一个脚本里”等真实工程问题。
- `standard` 要给出日常推荐命令或结构。
- `production` 应该加入可重复性和检查动作，例如 `python -m pip`、`requirements.txt`、`pip check`、`if __name__ == "__main__"`。

## 下一周提醒

- Week 6 的 `oop` 批次只有 3 个概念，但质量要求不能缩水。
- `class` 要避免写成“函数换皮”，需要展示对象把数据和行为放在一起。
- `inheritance` 要强调替换和复用边界，避免过度继承。
- `dataclass` 适合用“手写样板代码”作为 naive，再让 production 加不可变、校验或默认值边界。

## 验证命令

- `npm run validate:relations`：通过，52 concepts / 18 cases / 7 projects / 6 people / 5 paths / 54 works。
- `npm run audit:concepts`：通过，warning 从 40 降到 24。
- `npm run test`：17 tests 通过。
- `npm run test:code-examples`：129 段 runnable 示例通过。
- `npm run build`：通过，97 pages built。
- `npm run link:check`：通过，97 个 HTML 文件检查干净。
- `npm run link:external:inventory`：通过，64 个 unique https URLs。
- `git diff --check`：通过。
