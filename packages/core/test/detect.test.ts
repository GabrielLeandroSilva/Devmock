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

describe("clientes HTTP variados (T2)", () => {
  const calls: ProjectFile[] = [
    {
      path: "src/services/http.ts",
      content: `
http.get('/users');
this.http.get<User[]>('/users/1');
httpClient.post('/orders');
ky.get('/health');
got.put('/settings');
client.patch('/profile');
request.delete('/session');
axios({ url: '/orders', method: 'post' });
axios.request({ url: '/teams' });
request({ url: '/legacy', method: 'DELETE' });
fetch('/users', { method: 'POST' });
fetch('https://api.example.com/v1/users?x=1');
api.get(\`\${BASE}/users\`);
fetch(\`\${API_URL}/orders/\${id}\`);
`,
    },
  ];

  it("detecta clientes, genéricos, config-object, fetch com método e base em template", () => {
    expect(detectFromProject(calls).endpoints).toEqual([
      { method: "GET", path: "/users" },
      { method: "GET", path: "/users/1" },
      { method: "POST", path: "/orders" },
      { method: "GET", path: "/health" },
      { method: "PUT", path: "/settings" },
      { method: "PATCH", path: "/profile" },
      { method: "DELETE", path: "/session" },
      { method: "POST", path: "/users" },
      { method: "GET", path: "/v1/users" },
      { method: "GET", path: "/orders/${id}" },
      { method: "GET", path: "/teams" },
      { method: "DELETE", path: "/legacy" },
    ]);
  });

  it("método desconhecido no config cai para GET", () => {
    const r = detectFromProject([
      { path: "src/a.ts", content: "axios({ url: '/x', method: 'TRACE' });" },
    ]);
    expect(r.endpoints).toEqual([{ method: "GET", path: "/x" }]);
  });

  it("não confunde métodos de Map com chamadas HTTP", () => {
    const r = detectFromProject([{ path: "src/m.ts", content: "const v = map.get('key');" }]);
    expect(r.endpoints).toEqual([]);
  });
});
