import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { detectFromProject, type DetectResult, type ProjectFile } from "@devmock/core";

const IGNORE = new Set([
  "node_modules",
  "dist",
  "out",
  "coverage",
  ".git",
  ".devmock",
  "test",
  "tests",
  "__tests__",
]);
const EXT = /\.(ts|tsx|js|jsx)$/;

function walk(dir: string, root: string, out: ProjectFile[]): void {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (IGNORE.has(e.name)) continue;
      walk(p, root, out);
    } else if (EXT.test(e.name)) {
      try {
        out.push({ path: relative(root, p), content: readFileSync(p, "utf8") });
      } catch {
        // arquivo ilegível: ignora
      }
    }
  }
}

/** Varre `src/` (ou a raiz do projeto) e roda o detector puro do Core. */
export function detectProject(root: string): DetectResult {
  const base = existsSync(join(root, "src")) ? join(root, "src") : root;
  const files: ProjectFile[] = [];
  walk(base, root, files);
  return detectFromProject(files);
}
