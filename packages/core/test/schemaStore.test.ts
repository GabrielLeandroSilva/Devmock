import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadSchemas } from "../src/schemaStore.js";

let dir = "";

afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = "";
});

function setup(files: Record<string, string>): string {
  dir = mkdtempSync(join(tmpdir(), "devmock-store-"));
  const schemasDir = join(dir, "schemas");
  mkdirSync(schemasDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(schemasDir, name), content);
  }
  return schemasDir;
}

describe("loadSchemas", () => {
  it("lê *.json, ignora o resto e ordena keys para diff estável", () => {
    const schemasDir = setup({
      "b.json": JSON.stringify({ fields: [{ name: "id", type: "uuid", required: true }], name: "B" }),
      "a.json": JSON.stringify({ name: "A", fields: [{ name: "id", type: "uuid", required: true }] }),
      "lixo.txt": "ignorado",
    });
    const schemas = loadSchemas(schemasDir);
    expect(schemas.map((s) => s.name)).toEqual(["A", "B"]);
    // Keys ordenadas: "fields" antes de "name".
    expect(Object.keys(schemas[0])[0]).toBe("fields");
  });
});
