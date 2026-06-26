import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, relative } from "node:path";
import {
  philosophySourceTypes,
  renderUnderstandingClaimTemplate,
  renderQuestionTemplate,
  renderSourceTemplate,
  type PhilosophySourceType
} from "../src/lib/philosophy-authoring";

type ContentType = "question" | "source" | "understanding-claim";
type ParsedOptions = Record<string, string | boolean>;

const booleanOptions = new Set(["dry-run", "skip-validate"]);

function usage(type?: string): string {
  const common = [
    "Options:",
    "  --dry-run         Print the MDX without writing a file",
    "  --skip-validate   Write the file without running relation validation"
  ];

  if (type === "question") {
    return [
      "Usage:",
      "  npm run new:question -- --id=<slug> --title=<title> [--date=YYYY-MM-DD]",
      "",
      ...common
    ].join("\n");
  }

  if (type === "source") {
    return [
      "Usage:",
      "  npm run new:source -- --id=<slug> --title=<title> --url=<https-url> --type=<type>",
      "    --summary=<summary> --why-saved=<reason> --question=<question-slug>",
      "",
      `Source types: ${philosophySourceTypes.join(", ")}`,
      "",
      ...common
    ].join("\n");
  }

  if (type === "understanding-claim") {
    return [
      "Usage:",
      "  npm run new:understanding-claim -- --id=<slug> --title=<title> [--date=YYYY-MM-DD]",
      "",
      ...common
    ].join("\n");
  }

  return "Usage: tsx scripts/new-philosophy-content.ts <question|source|understanding-claim> [options]";
}

function parseArgs(argv: string[]): ParsedOptions {
  const options: ParsedOptions = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg?.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg ?? ""}`);
    }

    const [key, inlineValue] = arg.slice(2).split("=", 2);
    if (!key) throw new Error("Option name must not be empty");

    if (booleanOptions.has(key)) {
      if (inlineValue !== undefined) {
        throw new Error(`--${key} does not accept a value`);
      }
      options[key] = true;
      continue;
    }

    const value = inlineValue ?? argv[index + 1];
    if (!value || (!inlineValue && value.startsWith("--"))) {
      throw new Error(`--${key} requires a value`);
    }

    options[key] = value;
    if (inlineValue === undefined) index += 1;
  }

  return options;
}

function requireOption(options: ParsedOptions, key: string): string {
  const value = options[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Missing required option: --${key}`);
  }
  return value;
}

function rejectUnknownOptions(options: ParsedOptions, allowed: string[]) {
  const allowedSet = new Set([...allowed, ...booleanOptions]);
  const unknown = Object.keys(options).filter((key) => !allowedSet.has(key));
  if (unknown.length > 0) {
    throw new Error(`Unknown option(s): ${unknown.map((key) => `--${key}`).join(", ")}`);
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function render(type: ContentType, options: ParsedOptions): { collection: string; id: string; content: string } {
  if (type === "question") {
    rejectUnknownOptions(options, ["id", "title", "date"]);
    const id = requireOption(options, "id");
    return {
      collection: "questions",
      id,
      content: renderQuestionTemplate({
        id,
        title: requireOption(options, "title"),
        date: typeof options.date === "string" ? options.date : today()
      })
    };
  }

  if (type === "understanding-claim") {
    rejectUnknownOptions(options, ["id", "title", "date"]);
    const id = requireOption(options, "id");
    return {
      collection: "understanding-claims",
      id,
      content: renderUnderstandingClaimTemplate({
        id,
        title: requireOption(options, "title"),
        date: typeof options.date === "string" ? options.date : today()
      })
    };
  }

  rejectUnknownOptions(options, [
    "id",
    "title",
    "url",
    "type",
    "summary",
    "why-saved",
    "question"
  ]);
  const id = requireOption(options, "id");
  return {
    collection: "sources",
    id,
    content: renderSourceTemplate({
      id,
      title: requireOption(options, "title"),
      url: requireOption(options, "url"),
      type: requireOption(options, "type") as PhilosophySourceType,
      summary: requireOption(options, "summary"),
      whySaved: requireOption(options, "why-saved"),
      question: requireOption(options, "question")
    })
  };
}

function runRelationValidation(): number {
  const args = ["run", "validate:relations"];
  const result = process.platform === "win32"
    ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", "npm", ...args], {
        cwd: process.cwd(),
        stdio: "inherit"
      })
    : spawnSync("npm", args, { cwd: process.cwd(), stdio: "inherit" });

  if (result.error) throw result.error;
  return result.status ?? 1;
}

try {
  const rawType = process.argv[2];
  if (rawType !== "question" && rawType !== "source" && rawType !== "understanding-claim") {
    throw new Error(usage(rawType));
  }

  const type: ContentType = rawType;
  const options = parseArgs(process.argv.slice(3));
  const output = render(type, options);

  if (options["dry-run"] === true) {
    console.log(output.content);
    process.exit(0);
  }

  const directory = join(process.cwd(), "src", "content", output.collection);
  const target = join(directory, `${output.id}.mdx`);
  if (existsSync(target)) {
    throw new Error(`Content already exists: ${relative(process.cwd(), target)}`);
  }

  await mkdir(directory, { recursive: true });
  await writeFile(target, output.content, "utf8");
  console.log(`Created ${relative(process.cwd(), target)}`);

  if (options["skip-validate"] !== true) {
    process.exitCode = runRelationValidation();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error(usage(process.argv[2]));
  process.exit(1);
}
