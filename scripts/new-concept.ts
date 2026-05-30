import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";

const categories = new Set([
  "language",
  "syntax",
  "control-flow",
  "data-structure",
  "function",
  "oop",
  "file-io",
  "module-eng",
  "stdlib",
  "third-party"
]);

const levels = new Set(["intro", "core", "advanced"]);

type Options = {
  id?: string;
  title?: string;
  category?: string;
  level?: string;
  dryRun: boolean;
  skipValidate: boolean;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    dryRun: false,
    skipValidate: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--skip-validate") {
      options.skipValidate = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const [key, inlineValue] = arg.slice(2).split("=", 2);
      const value = inlineValue ?? argv[index + 1];

      if (!inlineValue) {
        index += 1;
      }

      if (key === "id") {
        options.id = value;
      } else if (key === "title") {
        options.title = value;
      } else if (key === "category") {
        options.category = value;
      } else if (key === "level") {
        options.level = value;
      } else {
        throw new Error(`Unknown option: --${key}`);
      }

      continue;
    }

    // Backward compatibility with the old positional form:
    // npm run new:concept -- slug Title Words
    if (!options.id) {
      options.id = arg;
      const titleParts = argv.slice(index + 1).filter((item) => !item.startsWith("--"));
      if (titleParts.length > 0) {
        options.title = titleParts.join(" ");
      }
      break;
    }
  }

  return options;
}

function usage() {
  return [
    "Usage:",
    "  npm run new:concept -- --id=X --title=Y --category=Z --level=W",
    "",
    "Example:",
    "  PKB_ALLOW_NEW_CONCEPTS=1 npm run new:concept -- --id=iterator --title=迭代器 --category=function --level=core",
    "",
    "Options:",
    "  --dry-run         Print the generated template without writing a file",
    "  --skip-validate   Do not run npm run validate:relations after writing"
  ].join("\n");
}

function assertOptions(options: Options): asserts options is Required<Options> {
  const missing = ["id", "title", "category", "level"].filter(
    (field) => !options[field as keyof Options]
  );

  if (missing.length > 0) {
    throw new Error(`Missing required option(s): ${missing.join(", ")}\n\n${usage()}`);
  }

  const id = options.id as string;
  const category = options.category as string;
  const level = options.level as string;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("--id must be kebab-case, for example function-parameters");
  }

  if (!categories.has(category)) {
    throw new Error(`--category must be one of: ${[...categories].join(", ")}`);
  }

  if (!levels.has(level)) {
    throw new Error(`--level must be one of: ${[...levels].join(", ")}`);
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function template(options: Required<Options>) {
  return `---
title: ${options.title}
description: "TODO: 用一句话说明这个知识点解决什么问题。"
summary: "TODO: 80 字以内说明最小心智模型。"
whyImportant: "TODO: 200 字以内说明它在真实场景里为什么重要。"
definition: "TODO: 写清楚定义。"
mentalModel: "TODO: 写清楚新人可抓住的类比或心智模型。"
category: ${options.category}
level: ${options.level}
tracks: [beginner]
prerequisites: []
related: []
extends: []
appliedIn:
  cases: []
  projects: []
people: []
works: []
history:
  - year: "${new Date().getFullYear()}"
    event: "TODO: 解释这个历史点为什么影响今天的写法。"
tags: []
updatedAt: "${today()}"
codeExamples:
  - title: naive
    description: "TODO: 新人容易写出的直接版本。"
    code: |
      # TODO: naive version
  - title: standard
    description: "TODO: 推荐教学版本。"
    code: |
      # TODO: standard version
  - title: production
    description: "TODO: 更接近真实项目的版本。"
    code: |
      # TODO: production version
---

## 概念定义

TODO: 手写维度 1。解释这个概念的边界、反例和最小使用场景。

## 代码示例

TODO: 手写维度 2。让 naive / standard / production 三个版本形成递进。

## 历史脉络

TODO: 手写维度 3。history 是事件数组，至少补 year 或 pep，并写清 event 的影响。

<!--
自动聚合维度：
- 真实案例：由 cases/*.mdx 的 concepts[] 反向聚合。
- 关键人物：由 people/*.mdx 的 concepts[] 反向聚合。
- 经典作品：由 works 或后续 relations 索引聚合。
-->
`;
}

function pendingFields(options: Required<Options>) {
  return [
    `src/content/concepts/${options.id}.mdx: summary`,
    `src/content/concepts/${options.id}.mdx: whyImportant`,
    `src/content/concepts/${options.id}.mdx: appliedIn.cases or reverse case.concepts`,
    `src/content/concepts/${options.id}.mdx: works role/source`,
    `src/content/concepts/${options.id}.mdx: history year or pep + event`,
    `src/content/concepts/${options.id}.mdx: standard code example`
  ];
}

try {
  const options = parseArgs(process.argv.slice(2));
  assertOptions(options);

  const content = template(options);
  const target = join(process.cwd(), "src", "content", "concepts", `${options.id}.mdx`);

  if (options.dryRun) {
    console.log(content);
    console.log("Pending fields:");
    for (const field of pendingFields(options)) {
      console.log(`- ${field}`);
    }
    process.exit(0);
  }

  if (process.env.PKB_ALLOW_NEW_CONCEPTS !== "1") {
    throw new Error(
      "内容扩张已冻结。如需新增，设置 PKB_ALLOW_NEW_CONCEPTS=1 并在 PR 里说明理由。"
    );
  }

  if (existsSync(target)) {
    throw new Error(`Concept already exists: ${relative(process.cwd(), target)}`);
  }

  await mkdir(join(process.cwd(), "src", "content", "concepts"), { recursive: true });
  await writeFile(target, content, "utf8");

  console.log(`Created ${relative(process.cwd(), target)}`);
  console.log("Pending fields:");
  for (const field of pendingFields(options)) {
    console.log(`- ${field}`);
  }

  if (!options.skipValidate) {
    const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(npmCommand, ["run", "validate:relations"], {
      cwd: process.cwd(),
      stdio: "inherit"
    });

    if (result.status !== 0) {
      process.exitCode = result.status ?? 1;
    }
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
