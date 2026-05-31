import { access, readFile, readdir } from "node:fs/promises";
import { extname, join, relative, resolve } from "node:path";

const root = process.cwd();
const distRoot = join(root, "dist");

const ignoredProtocols = /^(?:mailto:|tel:|javascript:|data:|blob:)/i;
const attributePattern = /\s(?:href|src)=["']([^"']+)["']/gi;
const idPattern = /\sid=["']([^"']+)["']/gi;
const namePattern = /\sname=["']([^"']+)["']/gi;

type HtmlFile = {
  path: string;
  html: string;
  anchors: Set<string>;
};

type LinkIssue = {
  file: string;
  target: string;
  message: string;
};

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

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

function extract(pattern: RegExp, html: string) {
  const values: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html))) {
    values.push(match[1]);
  }

  return values;
}

function decodePathname(pathname: string) {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}

function splitTarget(target: string) {
  const [withoutQuery] = target.split("?", 1);
  const [pathname, hash] = withoutQuery.split("#", 2);

  return {
    pathname: decodePathname(pathname),
    hash: hash ? decodePathname(hash) : ""
  };
}

function isExternal(target: string) {
  return /^https?:\/\//i.test(target) || target.startsWith("//");
}

function isIgnored(target: string) {
  return target === "" || ignoredProtocols.test(target);
}

function htmlTarget(pathname: string, sourceFile: string) {
  const base = pathname.startsWith("/")
    ? join(distRoot, pathname)
    : resolve(sourceFile, "..", pathname);
  const extension = extname(base);

  if (extension) {
    return base;
  }

  return join(base, "index.html");
}

async function checkFileLinks(file: HtmlFile, htmlByPath: Map<string, HtmlFile>) {
  const issues: LinkIssue[] = [];
  const targets = extract(attributePattern, file.html);

  for (const target of targets) {
    if (isIgnored(target) || isExternal(target)) {
      continue;
    }

    const { pathname, hash } = splitTarget(target);
    const resolvedPath = pathname
      ? htmlTarget(pathname, file.path)
      : file.path;
    const normalizedPath = resolve(resolvedPath);

    if (!normalizedPath.startsWith(resolve(distRoot))) {
      issues.push({
        file: relative(root, file.path),
        target,
        message: "link escapes dist directory"
      });
      continue;
    }

    if (!await exists(normalizedPath)) {
      issues.push({
        file: relative(root, file.path),
        target,
        message: `missing target ${relative(root, normalizedPath)}`
      });
      continue;
    }

    if (hash && extname(normalizedPath) === ".html") {
      const targetFile = htmlByPath.get(normalizedPath);
      if (!targetFile?.anchors.has(hash)) {
        issues.push({
          file: relative(root, file.path),
          target,
          message: `missing anchor #${hash}`
        });
      }
    }
  }

  return issues;
}

const files = await walk(distRoot);
const htmlFiles: HtmlFile[] = [];

for (const path of files.filter((file) => file.endsWith(".html"))) {
  const html = await readFile(path, "utf8");
  htmlFiles.push({
    path: resolve(path),
    html,
    anchors: new Set([
      ...extract(idPattern, html),
      ...extract(namePattern, html)
    ])
  });
}

const htmlByPath = new Map(htmlFiles.map((file) => [file.path, file]));
const issues = (
  await Promise.all(htmlFiles.map((file) => checkFileLinks(file, htmlByPath)))
).flat();

if (issues.length > 0) {
  console.error("Static link check failed:");
  for (const issue of issues) {
    console.error(`${issue.file}: ${issue.target} - ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Static link check clean: ${htmlFiles.length} html files checked.`);
}
