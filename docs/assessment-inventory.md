# Assessment Inventory (v1.2 阶段一)

更新日期：2026-06-04 ｜ 共 24 道，8 类 × 3 kind

## 按 category × kind × tier

| category | kind | tier | id | concepts |
|---|---|---|---|---|
| language | completion | tier1 | language-completion-tier1-major-version | interpreter-runtime, python-versions |
| language | recognition | tier1 | language-recognition-tier1-typing-discipline | dynamic-strong-typing, python-language |
| language | timed-coding | tier2 | language-timed-coding-tier2-feature-support | interpreter-runtime, python-versions |
| syntax | completion | tier1 | syntax-completion-tier1-type-cast | type-casting |
| syntax | recognition | tier1 | syntax-recognition-tier1-f-string-output | f-string, string, variable |
| syntax | timed-coding | tier2 | syntax-timed-coding-tier2-align-columns | f-string, variable |
| control-flow | debugging | tier2 | control-flow-debugging-tier2-loop-break | for-loop, break-continue-pass, if-statement |
| control-flow | recognition | tier1 | control-flow-recognition-tier1-for-else | for-loop, break-continue-pass |
| control-flow | timed-coding | tier2 | control-flow-timed-coding-tier2-filter-evens | comprehension, if-statement |
| data-structure | completion | tier1 | data-structure-completion-tier1-dict-lookup | dict, string |
| data-structure | recognition | tier1 | data-structure-recognition-tier1-set-dedup | set, list |
| data-structure | timed-coding | tier2 | data-structure-timed-coding-tier2-group-by-length | dict, list |
| function | recognition | tier1 | function-recognition-tier1-default-mutable | function-parameters, function |
| function | refactor | tier3 | function-refactor-tier3-extract-function | function, function-parameters |
| function | timed-coding | tier2 | function-timed-coding-tier2-normalize-name | function, string, if-statement |
| oop | recognition | tier1 | oop-recognition-tier1-super-init | inheritance, class |
| oop | refactor | tier3 | oop-refactor-tier3-balance-property | encapsulation, class |
| oop | timed-coding | tier2 | oop-timed-coding-tier2-rectangle-model | class, encapsulation |
| module-eng | recognition | tier1 | module-eng-recognition-tier1-venv-purpose | venv, pip |
| module-eng | refactor | tier3 | module-eng-refactor-tier3-config-loader | json, try-except, pathlib, function |
| module-eng | timed-coding | tier2 | module-eng-timed-coding-tier2-import-report | import-syntax, module, pathlib |
| stdlib | debugging | tier2 | stdlib-debugging-tier2-json-missing-key | json, common-stdlib-modules |
| stdlib | recognition | tier1 | stdlib-recognition-tier1-json-direction | json, common-stdlib-modules |
| stdlib | timed-coding | tier2 | stdlib-timed-coding-tier2-extract-emails | regular-expression, common-stdlib-modules |

## kind 分布

| kind | 数量 | 进 test:assessments | 驱动 tier |
|---|---:|---|---|
| recognition | 8 | 否 | Tier1 recognitionPassed |
| timed-coding | 8 | 是 | Tier2 timedCodingPassed |
| completion | 3 | 是 | Tier1 completionPassed |
| refactor | 3 | 是 | Tier3 refactorPassed |
| debugging | 2 | 是 | Tier2 debuggingPassed |

## 每类 Tier2 可达成性

| category | 3 道 kind | Tier2 |
|---|---|---|
| language | completion、recognition、timed-coding | ✓ 有 timed-coding |
| syntax | completion、recognition、timed-coding | ✓ 有 timed-coding |
| control-flow | debugging、recognition、timed-coding | ✓ 有 timed-coding |
| data-structure | completion、recognition、timed-coding | ✓ 有 timed-coding |
| function | recognition、refactor、timed-coding | ✓ 有 timed-coding |
| oop | recognition、refactor、timed-coding | ✓ 有 timed-coding |
| module-eng | recognition、refactor、timed-coding | ✓ 有 timed-coding |
| stdlib | debugging、recognition、timed-coding | ✓ 有 timed-coding |

> 注：module-eng 当前保留 timed-coding（import-report），Tier2 正常可达成。
> import-path（completion）留作 module-eng 未来第 4 道扩展题，不属于当前 24 道。

## 当前计分口径

- Tier 1 当前由 concept-read、recognition、completion、standard code run 驱动。
- Tier 2 当前由 debugging、timed-coding 驱动；`pep8Passed` 仍显式 disabled。
- Tier 3 当前由 entry project、production code run、refactor 驱动。
- Tier 4 当前只有 mid/capstone project 可计入；`reverseRecognitionPassed` 和 `crossConceptPassed` 仍显式 disabled。
- 未来启用 pep8 / reverseRecognition / crossConcept 时，必须同步改 `progress-calculator.ts` 的 `DISABLED_REQUIREMENTS` 和 `progress-config.ts` 的 count 来源。
