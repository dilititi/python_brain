# Week 9 标杆字段试写

## 本次范围

- `decorator` 试写 `requiresMindset`，验证“思维切换”是否能补足 `prerequisites` 表达不了的卡壳点。
- `guido-van-rossum` 试写 `earlyCareer`，验证人物页能否呈现“早期具体行动 -> 后来影响”的记忆锚点。

## 字段边界

`requiresMindset` 不是前置知识列表。它回答的是“学习者需要放下哪种旧直觉”。本次装饰器样本聚焦两个切换：

- 把函数当作可传递的对象。
- 把包装逻辑看成一层可组合协议。

`earlyCareer` 不是完整生平。它只记录一个可验证的早期线索，并要求说明这件事后来如何长成影响。本次 Guido 样本使用 Python 官方 FAQ 作为来源，避免依赖第三方传记式描述。

## 不做的事

- 不把 `requiresMindset` 全量铺到 52 个概念。
- 不把 `earlyCareer` 全量铺到 6 个人物。
- 不新增第 7 个概念页维度；`requiresMindset` 只作为“概念定义”里的认知提示。

## 下一步提醒

v1.2 如果要推广这两个字段，先继续拿 `function-parameters` 和 Wes McKinney 做第二轮样本。只有当样本能稳定区分“知识前置”和“思维障碍”时，再讨论全量迁移。
