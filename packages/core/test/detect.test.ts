import { describe, expect, it } from "vitest";
import { detectFromProject, type ProjectFile } from "../src/detect/index.js";

const files: ProjectFile[] = [
  {
    path: "src/types/user.ts",
    content: `
export interface User {
  id: string;
  name?: string;
  age: number;
  active: boolean;
  status: "ACTIVE" | "BLOCKED";
  company: Company;
}
`,
  },
  {
    path: "src/types/company.ts",
    content: `export interface Company { id: string; name: string }`,
  },
  {
    path: "src/services/api.ts",
    content: `
api.get('/users');
api.get('/users?page=1');
axios.post('/orders');
fetch('/health');
`,
  },
  {
    path: "src/types/weird.ts",
    content: `
export interface Weird {
  id: string;
  tags: string[];
  meta: Record<string, unknown>;
  a: string | number;
}
`,
  },
];

describe("detectFromProject (PRD-09)", () => {
  it("detecta interfaces como Schemas (tipos, ref, enum, opcional)", () => {
    const r = detectFromProject(files);
    const user = r.schemas.find((s) => s.name === "User");
    expect(user).toBeDefined();
    expect(user!.fields.find((f) => f.name === "id")).toEqual({
      name: "id",
      type: "string",
      required: true,
    });
    expect(user!.fields.find((f) => f.name === "name")?.required).toBe(false);
    expect(user!.fields.find((f) => f.name === "status")?.type).toBe("enum");
    expect(user!.fields.find((f) => f.name === "company")).toEqual({
      name: "company",
      type: "ref",
      ref: "Company",
      required: true,
    });
  });

  it("detecta chamadas HTTP e normaliza/deduplica rotas", () => {
    const r = detectFromProject(files);
    expect(r.endpoints).toEqual([
      { method: "GET", path: "/users" },
      { method: "POST", path: "/orders" },
      { method: "GET", path: "/health" },
    ]);
  });

  it("gera warnings para tipos não mapeados (nunca inventa campo)", () => {
    const r = detectFromProject(files);
    const weird = r.schemas.find((s) => s.name === "Weird");
    expect(weird).toBeDefined();
    const names = weird!.fields.map((f) => f.name);
    expect(names).not.toContain("tags");
    expect(names).not.toContain("meta");
    expect(names).not.toContain("a");
    expect(r.warnings.some((w) => /array/i.test(w))).toBe(true);
  });

  it("é determinístico (mesma entrada → mesmo resultado)", () => {
    expect(detectFromProject(files)).toEqual(detectFromProject(files));
  });
});
