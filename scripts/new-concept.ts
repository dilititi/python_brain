import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const slug = process.argv[2];

if (!slug) {
  console.error("Usage: npm run new:concept -- <slug>");
  process.exit(1);
}

const title = process.argv.slice(3).join(" ") || slug;
const target = join(process.cwd(), "src", "content", "concepts", `${slug}.mdx`);

await mkdir(join(process.cwd(), "src", "content", "concepts"), { recursive: true });
await writeFile(
  target,
  `---
title: ${title}
description: 
definition: 
mentalModel: 
category: syntax
level: intro
tracks: [beginner]
prerequisites: []
related: []
expandsTo: []
appliedIn:
  cases: []
  projects: []
people: []
works: []
history: []
codeExamples: []
---

`,
  "utf8"
);

console.log(`Created ${target}`);
