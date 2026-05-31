import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const slug = process.argv[2];

if (!slug) {
  console.error("Usage: npm run new:case -- <slug>");
  process.exit(1);
}

const title = process.argv.slice(3).join(" ") || slug;
const target = join(process.cwd(), "src", "content", "cases", `${slug}.mdx`);

await mkdir(join(process.cwd(), "src", "content", "cases"), { recursive: true });
await writeFile(
  target,
  `---
title: ${title}
description: 
scenario: 
level: intro
tracks: [beginner]
concepts: []
projects: []
people: []
---

`,
  "utf8"
);

console.log(`Created ${target}`);
