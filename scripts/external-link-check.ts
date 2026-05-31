import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import matter from "gray-matter";
import YAML from "yaml";

const root = process.cwd();
const contentRoot = join(root, "src", "content");
const shouldCheck = process.argv.includes("--check");
const timeoutMsArg = process.argv.find((arg) => arg.startsWith("--timeout-ms="));
const timeoutMs = timeoutMsArg ? Number(timeoutMsArg.split("=", 2)[1]) : 10000;
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
const concurrency = concurrencyArg ? Number(concurrencyArg.split("=", 2)[1]) : 6;

type UrlReference = {
  url: string;
  file: string;
  field: string;
};

type UrlIssue = {
  url: string;
  sources: UrlReference[];
  message: string;
};

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...await walk(path));
      continue;
    }

    files.push(path);
  }

  return files;
}

function isUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function withoutFragment(value: string) {
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return value;
  }
}

function collectUrls(value: unknown, file: string, field: string, refs: UrlReference[]) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (isUrl(trimmed)) {
      refs.push({ url: trimmed, file: relative(root, file), field });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectUrls(item, file, `${field}[${index}]`, refs));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      collectUrls(item, file, field ? `${field}.${key}` : key, refs);
    }
  }
}

async function readContentUrls() {
  const files = (await walk(contentRoot)).filter((file) =>
    /\.(?:mdx?|ya?ml)$/.test(file)
  );
  const refs: UrlReference[] = [];

  for (const file of files) {
    const raw = await readFile(file, "utf8");
    const data = /\.mdx?$/.test(file) ? matter(raw).data : YAML.parse(raw);
    collectUrls(data, file, "", refs);
  }

  return refs;
}

async function fetchWithTimeout(url: string, method: "HEAD" | "GET") {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      method,
      headers: method === "GET" ? { Range: "bytes=0-0" } : undefined,
      redirect: "follow",
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url: string): Promise<string | null> {
  const target = withoutFragment(url);

  try {
    const head = await fetchWithTimeout(target, "HEAD");
    if (head.ok) {
      return null;
    }

    if (![403, 405, 406, 501].includes(head.status)) {
      return `HTTP ${head.status} ${head.statusText}`.trim();
    }
  } catch {
    // Retry with GET below; some documentation sites reject HEAD or proxy it poorly.
  }

  try {
    const get = await fetchWithTimeout(target, "GET");
    return get.ok ? null : `HTTP ${get.status} ${get.statusText}`.trim();
  } catch (error) {
    return error instanceof Error ? error.message : "request failed";
  }
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>
) {
  const results: R[] = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker)
  );
  return results;
}

const refs = await readContentUrls();
const refsByUrl = new Map<string, UrlReference[]>();
const formatIssues: UrlIssue[] = [];

for (const ref of refs) {
  if (!ref.url.startsWith("https://")) {
    formatIssues.push({
      url: ref.url,
      sources: [ref],
      message: "external content URLs must use https"
    });
    continue;
  }

  refsByUrl.set(ref.url, [...(refsByUrl.get(ref.url) ?? []), ref]);
}

const urlIssues = [...formatIssues];

if (shouldCheck) {
  const uniqueUrls = [...refsByUrl.keys()].sort((left, right) => left.localeCompare(right));
  const checked = await mapLimit(uniqueUrls, concurrency, async (url) => ({
    url,
    message: await checkUrl(url)
  }));

  for (const result of checked) {
    if (result.message) {
      urlIssues.push({
        url: result.url,
        sources: refsByUrl.get(result.url) ?? [],
        message: result.message
      });
    }
  }
}

if (urlIssues.length > 0) {
  console.error("External link check failed:");
  for (const issue of urlIssues) {
    console.error(`${issue.url} - ${issue.message}`);
    for (const source of issue.sources) {
      console.error(`  ${source.file}: ${source.field}`);
    }
  }
  process.exitCode = 1;
} else if (shouldCheck) {
  console.log(`External link check clean: ${refsByUrl.size} unique URLs checked from ${refs.length} references.`);
} else {
  console.log(`External link inventory clean: ${refsByUrl.size} unique https URLs found from ${refs.length} references.`);
  console.log("Run with --check to verify network reachability.");
}
